// Привязки по одной записи на пару проект/договор: параллельные загрузки
// не перезаписывают общий массив. Файлы и подписи остаются в реестре договоров.
export const COLLECTION = 'project_contracts';
export function relationId(projectId, contractId) {
  if (!/^[a-zA-Z0-9_-]{1,150}$/.test(projectId) || !/^[a-zA-Z0-9_-]{1,150}$/.test(contractId)) throw new Error('Некорректный проект или договор');
  return `${projectId}:${contractId}`;
}
export function projectContractsService(api) {
  return {
    async links() {
      const result = await api('/store/pull', { method:'POST', body:{ collections:[COLLECTION], limitPerCollection:10000 } });
      const rows = result.collections?.[COLLECTION];
      if (!Array.isArray(rows)) throw new Error('Не удалось получить привязки договоров');
      if (rows.length >= 10000) throw new Error('Слишком много привязок. Откройте общий реестр договоров.');
      return rows;
    },
    async attach(projectId, contract) {
      const item = { id:relationId(projectId, contract.id), projectId, contractId:contract.id, title:contract.title, updatedAt:Date.now() };
      await api('/store/push', { method:'POST', body:{ops:[{type:'upsert', collection:COLLECTION, item}]} });
      return item;
    },
  };
}
