// Отдельный технический номер Pllato: переписка и группы без входящих лидов.
export const PLLATO_TECH_INSTANCE = '770022696546';
const ADMINS = Object.freeze([
  Object.freeze({chatId:'77064261516@c.us',label:'Ирина'}),
  Object.freeze({chatId:'77011239999@c.us',label:'Платон'}),
]);
export function requiredGroupAdmins(channel) {
  return String(channel?.id_instance) === PLLATO_TECH_INSTANCE ? ADMINS : [];
}
export function channelCreatesLeads(channel) {
  return !!channel?.default_pipeline_id && String(channel.id_instance) !== PLLATO_TECH_INSTANCE;
}
