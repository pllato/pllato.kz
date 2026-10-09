const parse = value => {
  if (value && typeof value === 'object') return value;
  try { return JSON.parse(value || '{}') || {}; } catch { return {}; }
};
const field = (patch, camel, snake, fallback) => Object.hasOwn(patch, camel)
  ? patch[camel] : Object.hasOwn(patch, snake) ? patch[snake] : fallback;

// Только переход, а не создание карточки или повтор сохранения текущей стадии.
// Проверяем и основную воронку, и стадию зеркала в Pllato Старт.
export async function managerStageError(env, deal, pipelineId, stageId, patch = {}) {
  const currentStage = String(deal.pipeline_id) === String(pipelineId)
    ? deal.stage_id : parse(deal.mirrored_in)[pipelineId];
  if (String(currentStage ?? '') === String(stageId ?? '')) return null;
  const pipeline = await env.DB.prepare('SELECT name FROM pipelines WHERE id = ?').bind(pipelineId).first();
  if (String(pipeline?.name || '').trim().toLowerCase() !== 'pllato старт') return null;
  const lead = field(patch, 'responsibleUid', 'responsible_uid', deal.responsible_uid);
  const custom = parse(field(patch, 'customFields', 'custom_fields', deal.custom_fields));
  const missing = [];
  if (typeof lead !== 'string' || !lead.trim()) missing.push('Менеджер по лидам');
  if (typeof custom.kepManagerUid !== 'string' || !custom.kepManagerUid.trim()) missing.push('Менеджер КЭПов');
  return missing.length ? {
    code: 'MANAGERS_REQUIRED', managerGate: true, missing,
    error: `Для смены стадии в «Pllato Старт» назначьте в карточке: ${missing.join(' и ')}.`,
  } : null;
}

// Старые клиенты могут менять stageId напрямую через RTDB-proxy.
export async function managerPatchError(env, deal, patch) {
  const pipelineId = field(patch, 'pipelineId', 'pipeline_id', deal.pipeline_id);
  const stageId = field(patch, 'stageId', 'stage_id', deal.stage_id);
  if (pipelineId !== deal.pipeline_id || stageId !== deal.stage_id) {
    const error = await managerStageError(env, deal, pipelineId, stageId, patch);
    if (error) return error;
  }
  if (Object.hasOwn(patch, 'mirroredIn') || Object.hasOwn(patch, 'mirrored_in')) {
    const mirrors = parse(field(patch, 'mirroredIn', 'mirrored_in', null));
    for (const [id, stage] of Object.entries(mirrors)) {
      const error = await managerStageError(env, deal, id, stage, patch);
      if (error) return error;
    }
  }
  return null;
}
