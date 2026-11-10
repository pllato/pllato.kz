# Meta test channel in CRM

Implement a bounded test integration for App Review before any production cutover. Reuse the existing team CRM WhatsApp chat/message storage and UI, but keep credentials and configuration separate from Green API. Only administrators can configure/use the test channel. Fixed Meta test phone ID 1464941916696853, WABA 2126758854867530, recipient 77066423098. No production-number registration, customer broadcasts, or Green API changes.

Use a small Worker module with signed raw-body webhooks, an admin configuration API, a test template send, ordinary text replies and stored delivery status. Store incoming/outgoing messages in wa_chats/wa_messages with a meta-prefixed instance; exclude these from non-admin chat listings. A settings panel lets the administrator save credentials without returning them, copy the webhook verification token, send a test and inspect the conversation/status. Settings are persisted in D1; secrets never logged or returned.

Alternatives: replacing Green API now risks existing customer traffic; a separate demo disconnected from CRM does not demonstrate the product. Therefore a separately configured test channel in the existing CRM is selected based on the user's approved staged approach.

Validation: signature/verification failures, duplicate webhooks, unauthorized calls, recipient isolation, provider errors, token redaction, API send/status, and browser UI. Deployment requires real credentials and webhook subscription, then an actual message round trip. Do not claim Coexistence or review approval from this test.
