// В общей ссылке стороны заранее не назначаются. Старые pending-заготовки
// не являются обязательными сторонами: сохраняем их только для именных ссылок.
export function visibleParticipants(parties, universal) {
  const list = Array.isArray(parties) ? parties : [];
  return universal ? list.filter(p => p.status === 'signed' || p.status === 'declined') : list;
}
export function participantTypeLabel(p) {
  const type = p.signerType || p.requisites?.type;
  if (type === 'company' || type === 'ip') return 'компания';
  if (type === 'individual') return 'физлицо';
  return 'подписант';
}
export function signatureCountLabel(parties, universal) {
  const list = visibleParticipants(parties, universal);
  const signed = list.filter(p => p.status === 'signed').length;
  return universal ? `Получено подписей: ${signed}` : `${signed} из ${list.length}`;
}
