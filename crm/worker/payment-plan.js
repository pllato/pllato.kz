// Shared custom-plan validation; automatic plans keep their existing defaults.
export function normalizeCustomPaymentPlan(stages) {
  const ids = new Set();
  return (Array.isArray(stages) ? stages : []).slice(0, 100).flatMap(stage => {
    const id = String(stage?.id || '').trim();
    const dueAt = Number(stage?.dueAt);
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id) || ids.has(id) || !Number.isFinite(dueAt) || dueAt <= 0) return [];
    ids.add(id);
    const percentMode = stage.amount == null || stage.amount === '';
    const value = Number(percentMode ? stage.percent : stage.amount);
    if (!Number.isFinite(value) || value < 0 || value > (percentMode ? 100 : 1e12)) return [];
    return [{id, label: String(stage.label || 'Платёж').trim().slice(0,120), dueAt,
      final: stage.final === true, ...(percentMode ? {percent:value} : {amount:value})}];
  });
}
