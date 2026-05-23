// Pllato CRM — автосоздание сделок из входящих WhatsApp.
// Запускается после sync чатов: для каждого WA-чата с входящим сообщением,
// если у контакта нет открытой сделки — создаём контакт (если нужно) + сделку
// в первой стадии активной воронки.

import { Store } from "./store.js";
import { normalizePhoneDigits } from "./wa_dialog.js";
import { getStages } from "./stages.js";
import { getActivePipelineId, ensurePipelinesInitialized } from "./pipelines.js";
import { currentEmployee } from "./employees.js";

const CHATS = "chats";
const MESSAGES = "chat_messages";
const CONTACTS = "contacts";
const DEALS = "deals";
const ACTIVITIES = "deal_activities";

function isContactAlive(c) {
  return c && !c.deleted && !c.trashed && !c.archived;
}

function findContactByPhone(phone) {
  if (!phone) return null;
  const target = normalizePhoneDigits(phone);
  if (!target) return null;
  return Store.list(CONTACTS).find((c) => {
    if (!isContactAlive(c)) return false;
    return normalizePhoneDigits(c.phone || "") === target;
  }) || null;
}

function isWinStage(stage) {
  const key = `${stage?.id || ""} ${stage?.title || ""}`.toLowerCase();
  return key.includes("won") || key.includes("win") || key.includes("выиг");
}

function isLossStage(stage) {
  const key = `${stage?.id || ""} ${stage?.title || ""}`.toLowerCase();
  return key.includes("lost") || key.includes("выпал") || key.includes("проиг");
}

function hasOpenDealForContact(contactId) {
  const stages = getStages();
  const closedStageIds = new Set(stages.filter((s) => isWinStage(s) || isLossStage(s)).map((s) => s.id));
  return Store.list(DEALS).some((d) => {
    if (d.contactId !== contactId) return false;
    if (d.archivedAt || d.trashed || d.deleted) return false;
    if (closedStageIds.has(d.stage)) return false;
    return true;
  });
}

/**
 * Сканирует WA-чаты и автоматически создаёт контакты/сделки для номеров с входящими.
 * Безопасна для повторного вызова — не создаёт дубликаты.
 *
 * @returns {{ contactsCreated: number, dealsCreated: number }}
 */
export function autoCreateDealsFromIncomingWa() {
  ensurePipelinesInitialized();
  const pipelineId = getActivePipelineId();
  const stages = getStages();
  const firstStageId = stages[0]?.id;
  if (!pipelineId || !firstStageId) return { contactsCreated: 0, dealsCreated: 0 };

  // Группируем сообщения по chatId один раз.
  const msgsByChat = new Map();
  for (const m of Store.list(MESSAGES)) {
    if (!m.chatId) continue;
    if (!msgsByChat.has(m.chatId)) msgsByChat.set(m.chatId, []);
    msgsByChat.get(m.chatId).push(m);
  }

  const me = currentEmployee();
  const now = Date.now();
  let contactsCreated = 0;
  let dealsCreated = 0;

  for (const chat of Store.list(CHATS)) {
    if (!chat?.wa || chat.isGroup) continue;
    // Хотя бы одно входящее сообщение от клиента
    const msgs = msgsByChat.get(chat.id) || [];
    if (!msgs.some((m) => m.from === "them")) continue;

    const phone = normalizePhoneDigits(chat.phone || chat.waChatId || "");
    if (!phone) continue;

    let contact = findContactByPhone(phone);
    if (!contact) {
      const draftName = String(chat.name || "").trim() || `+${phone}`;
      contact = Store.create(CONTACTS, {
        name: draftName,
        phone,
        source: "WhatsApp",
        createdAt: now,
        updatedAt: now,
      });
      contactsCreated += 1;
    }

    if (!contact?.id) continue;
    if (hasOpenDealForContact(contact.id)) continue;

    const deal = Store.create(DEALS, {
      title: contact.name || `+${phone}`,
      contactId: contact.id,
      pipelineId,
      stage: firstStageId,
      amount: 0,
      source: "WhatsApp",
      createdAt: now,
      ts: now,
      assigneeId: me?.id || null,
    });
    dealsCreated += 1;

    if (deal?.id) {
      Store.create(ACTIVITIES, {
        dealId: deal.id,
        type: "deal_created",
        text: "Сделка автоматически создана из входящего WhatsApp",
        authorId: me?.id || null,
        ts: now,
      });
    }
  }

  return { contactsCreated, dealsCreated };
}
