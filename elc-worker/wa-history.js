// Восстановление истории не должно повторно создавать лиды, менять стадии
// или рассылать уведомления. Только сообщения уже существующего чата.
export async function ensureWaHistorySchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS wa_history_sync (
    chat_id TEXT PRIMARY KEY, checked_at INTEGER NOT NULL DEFAULT 0,
    retry_at INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending'
  )`).run();
}

export function historyMessage(message, chat) {
  if (!message?.idMessage || !['incoming', 'outgoing'].includes(message.type)) return null;
  if (message.chatId && message.chatId !== chat.chat_id) return null;
  const ts = Number(message.timestamp) * 1000;
  if (!Number.isFinite(ts) || ts <= 0) return null;
  const kinds = { imageMessage: 'image', stickerMessage: 'image', videoMessage: 'video',
    audioMessage: 'audio', documentMessage: 'document' };
  const ext = message.extendedTextMessage || {};
  const ad = (ext.showAdAttribution || ext.sourceId || ext.sourceType === 'ad') ? {
    adId: ext.sourceId ? String(ext.sourceId) : null, sourceType: ext.sourceType || null,
    sourceUrl: ext.sourceUrl || null, title: ext.title || null, description: ext.description || null,
    thumbnailUrl: ext.thumbnailUrl || null, mediaType: ext.mediaType || null,
    conversionSource: ext.conversionSource || null,
    entryPointConversionApp: ext.entryPointConversionApp || null,
    containsAutoReply: !!ext.containsAutoReply,
    receivedAt: new Date(ts).toISOString(),
  } : null;
  return {
    id: `wa:${chat.instance_id}:${message.idMessage}`, chatId: chat.id,
    providerId: message.idMessage, direction: message.type === 'incoming' ? 'in' : 'out',
    text: message.textMessage || ext.text || null, mediaKind: kinds[message.typeMessage] || null,
    mediaUrl: message.downloadUrl || null, fileName: message.fileName || null,
    mimeType: message.mimeType || null, caption: message.caption || null,
    senderName: chat.is_group && message.type === 'incoming' ? message.senderName || null : null,
    ad, ts,
  };
}

export async function syncWaHistory(db, chatId, fetcher = fetch, now = Date.now()) {
  const chat = await db.prepare(`SELECT c.*, ch.api_url, ch.api_token_instance, ch.active
    FROM wa_chats c JOIN wa_channels ch ON ch.id_instance = c.instance_id
    WHERE c.id = ? LIMIT 1`).bind(chatId).first();
  if (!chat || !chat.active) return { status: 'unavailable', imported: 0 };
  const previous = await db.prepare('SELECT * FROM wa_history_sync WHERE chat_id = ?').bind(chatId).first();
  if (previous?.retry_at > now) return { status: previous.status, imported: 0 };

  // Общий для вкладок и cron лимит провайдера: 1 getChatHistory/сек/инстанс.
  // Условный UPSERT атомарно выдаёт право на запрос только одному обработчику.
  const lease = await db.prepare(`INSERT INTO kv(k, v) VALUES (?, ?)
    ON CONFLICT(k) DO UPDATE SET v = excluded.v WHERE CAST(kv.v AS INTEGER) <= ?`)
    .bind(`wa:history:lease:${chat.instance_id}`, String(now + 1500), now).run();
  if (!lease.meta.changes) return { status: 'pending', imported: 0 };
  await db.prepare(`INSERT INTO wa_history_sync(chat_id, retry_at, status) VALUES (?, ?, 'pending')
    ON CONFLICT(chat_id) DO UPDATE SET retry_at = excluded.retry_at, status = 'pending'`)
    .bind(chatId, now + 60000).run();
  let history;
  try {
    const base = String(chat.api_url || 'https://api.green-api.com').replace(/\/$/, '');
    const response = await fetcher(`${base}/waInstance${chat.instance_id}/getChatHistory/${chat.api_token_instance}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: chat.chat_id, count: 100 }), signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`http_${response.status}`);
    history = await response.json();
    if (!Array.isArray(history)) throw new Error('invalid_history');
  } catch {
    await db.prepare("UPDATE wa_history_sync SET checked_at = ?, retry_at = ?, status = 'error' WHERE chat_id = ?")
      .bind(now, now + 60000, chatId).run();
    return { status: 'error', imported: 0 };
  }
  const messages = history.map(m => historyMessage(m, chat)).filter(Boolean).sort((a, b) => a.ts - b.ts);
  let imported = 0;
  for (let offset = 0; offset < messages.length; offset += 25) {
    const result = await db.batch(messages.slice(offset, offset + 25).map(m => db.prepare(`
      INSERT INTO wa_messages(id, chat_id, wa_message_id, direction, text, media_kind,
        media_url, media_file_name, media_mime_type, caption, sender_name, meta_ad_id, meta_ad_attribution, ts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        meta_ad_id = COALESCE(excluded.meta_ad_id, wa_messages.meta_ad_id),
        meta_ad_attribution = COALESCE(excluded.meta_ad_attribution, wa_messages.meta_ad_attribution)
      WHERE excluded.meta_ad_attribution IS NOT NULL AND wa_messages.meta_ad_attribution IS NULL
    `).bind(m.id, m.chatId, m.providerId, m.direction, m.text, m.mediaKind, m.mediaUrl,
      m.fileName, m.mimeType, m.caption, m.senderName, m.ad?.adId || null, m.ad ? JSON.stringify(m.ad) : null, m.ts)));
    imported += result.reduce((sum, r) => sum + Number(r.meta.changes || 0), 0);
  }
  if (messages.length) {
    const latest = messages[messages.length - 1];
    // Shell time is time of discovery, not time of the missing message.
    // Never replace a newer real message or touch read/unread counters.
    await db.prepare(`UPDATE wa_chats SET last_message_text = ?, last_message_at = ?,
      last_message_from = ?, updated_at = datetime('now') WHERE id = ?
      AND (last_message_at IS NULL OR last_message_at <= ? OR last_message_text LIKE '%не синхронизировано%')`)
      .bind((latest.text || latest.caption || `[${latest.mediaKind || 'сообщение'}]`).slice(0, 200),
        latest.ts, latest.direction === 'in' ? 'them' : 'me', chatId, latest.ts).run();
    const attributed = messages.find(m => m.direction === 'in' && m.ad);
    if (attributed && chat.deal_id) {
      await db.prepare(`UPDATE deals SET source_id = 'META_AD', source_description = ?,
        meta_ad_id = ?, meta_ad_attribution = ? WHERE id = ? AND meta_ad_attribution IS NULL`)
        .bind(attributed.ad.adId ? `Instagram → WhatsApp · объявление ${attributed.ad.adId}` : 'Instagram → WhatsApp · реклама',
          attributed.ad.adId, JSON.stringify(attributed.ad), chat.deal_id).run();
    }
  }
  const status = messages.length ? 'synced' : 'provider_empty';
  await db.prepare('UPDATE wa_history_sync SET checked_at = ?, retry_at = ?, status = ? WHERE chat_id = ?')
    .bind(now, now + (messages.length ? 15 * 60000 : 6 * 3600000), status, chatId).run();
  return { status, imported };
}

export async function recoverWaHistory(db) {
  await ensureWaHistorySchema(db);
  // One eligible chat per connected instance per minute. Oldest attempt first
  // ensures that empty histories do not starve the remaining chats.
  const { results } = await db.prepare(`SELECT id FROM (
    SELECT c.id, ROW_NUMBER() OVER (PARTITION BY c.instance_id
      ORDER BY COALESCE(s.checked_at, 0), c.last_message_at DESC) AS rank
    FROM wa_chats c JOIN wa_channels ch ON ch.id_instance = c.instance_id
    LEFT JOIN wa_history_sync s ON s.chat_id = c.id
    WHERE ch.active = 1 AND ch.conn_state = 'up'
      AND c.last_message_text LIKE '%не синхронизировано%'
      AND COALESCE(s.retry_at, 0) <= ?
  ) WHERE rank = 1`).bind(Date.now()).all();
  for (const chat of results) await syncWaHistory(db, chat.id);
}
