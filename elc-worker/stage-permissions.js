// Право «Все сделки» в оргструктуре должно означать не только видимость,
// но и возможность двигать карточки по этапам доступной воронки. Это особенно
// важно для новых лидов без ответственного: руководитель видит их в канбане,
// но owner-проверка закономерно возвращает false.
//
// Ограничение по pipelineIds остаётся hard limit: право на все сделки одной
// воронки не открывает изменение стадий в другой.
export function canChangeAnyDealStage(me, pipelineId) {
  const permissions = me?.orgPerms;
  if (!permissions || permissions.dealScope !== 'all') return false;
  const allowedPipelineIds = permissions.pipelineIds;
  if (allowedPipelineIds == null) return true;
  return allowedPipelineIds.map(String).includes(String(pipelineId || ''));
}
