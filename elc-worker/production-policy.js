// Manual preparation only. Zoom recording/transcription ingestion stays enabled.
// Deliberately not controlled by provider secrets or environment defaults.
export const AUTOMATIC_PRODUCTION_ENABLED = false;
export const PRODUCTION_DISABLED_MESSAGE = 'Автоматическая сборка отключена. Демо, КП, ТЗ и договоры готовятся вручную.';
export function requireAutomaticProduction() {
  if (!AUTOMATIC_PRODUCTION_ENABLED) throw Object.assign(new Error(PRODUCTION_DISABLED_MESSAGE), { code: 'PRODUCTION_DISABLED' });
}
