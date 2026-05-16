# Cloud Function: stopBilling

`stopBilling` — страховочная функция для Firebase проекта `pllato-crm`: слушает бюджетные события из Pub/Sub (`billing-alerts`) и отвязывает billing account от проекта, если фактические траты выше лимита.

## Что делает функция

1. Получает payload budget alert из Pub/Sub.
2. Читает `costAmount`, `budgetAmount`, `currencyCode`.
3. Если `costAmount <= budgetAmount` — пишет лог `No action needed` и завершает работу.
4. Если `costAmount > budgetAmount` — проверяет billing status проекта `projects/pllato-crm`.
5. Если биллинг ещё включён, вызывает `updateProjectBillingInfo(... billingAccountName: "")` и отключает billing.

## Установка и деплой

```bash
cd functions
npm install

cd ..
firebase deploy --only functions --project pllato-crm
```

## Ручные шаги pllato (после деплоя)

1. Cloud Console -> Billing -> Budgets & alerts -> Create Budget:
   - Name: `pllato-crm-hardcap-5usd`
   - Scope: проект `pllato-crm`, все услуги
   - Amount: `$5`
   - Thresholds: `50%`, `90%`, `100% actual`, `100% forecasted`
2. Включить "Connect a Pub/Sub topic to this budget".
3. Создать/выбрать topic `billing-alerts`.
4. Cloud Console -> IAM (billing account scope): дать service account функции роль `Billing Account Administrator`.

## Тест срабатывания через Pub/Sub

```bash
gcloud pubsub topics publish billing-alerts \
  --message='{"costAmount":10,"budgetAmount":5,"currencyCode":"USD","budgetDisplayName":"test"}'
```

Безопасный тест:
- перед тестом временно убери у service account функции роль `Billing Account Administrator`, чтобы проверить логи без реальной отвязки billing;
- либо тестируй на dev-проекте.

Проверка логов:

```bash
firebase functions:log --only stopBilling --project pllato-crm
```

## Локальный smoke-тест

```bash
cd functions
npm test
```

## Откат

```bash
firebase functions:delete stopBilling --project pllato-crm
```

После этого вручную удалить Budget и (при необходимости) Pub/Sub topic `billing-alerts` в Cloud Console.
