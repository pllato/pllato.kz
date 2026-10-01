# AI providers for deal production

The Worker supports OpenAI Responses and Anthropic Messages. Both produce the same validated blueprint, used by the existing demo/CP renderer. Changing providers does not replace the HTML renderer or fix its existing interaction limitations.

## Configuration

- `PRODUCTION_AI_PROVIDER`: `openai` (current default) or `anthropic`.
- `OPENAI_PRODUCTION_MODEL`: existing OpenAI model.
- `ANTHROPIC_PRODUCTION_MODEL`: `claude-opus-5-5`, configurable for the account's available models.
- `ANTHROPIC_API_KEY`: Cloudflare Worker **Secret**, never a plain variable or repository file.

Set the secret in Cloudflare Dashboard → Workers → pllato-elc-worker → Settings → Variables and Secrets, or interactively with `wrangler secret put ANTHROPIC_API_KEY`. Do not paste keys into chat, command arguments, logs, or commits.

## Isolated comparison

Use a **new job ID and isolated preview ID**, with a copied transcript/deal snapshot, `preview: true`, `aiProvider: "anthropic"`, and no pipeline/build stage. Do not change the provider/model on an existing completed job: a retry intentionally retains its cached result. Provider and model are pinned in the job payload before the API call; output metadata records the provider, returned model, request ID and usage. Existing production jobs retain their original cached blueprints.

A live comparison requires the Anthropic secret and API credit/model access. Until that is available, only mock transport/schema checks have been run. Keep the default provider unchanged until the live result is reviewed.

## Validation

`node production-ai.test.mjs`
`node deal-production.test.mjs`

Anthropic's schema omits unsupported array bounds while preserving them in descriptions; the original bounds and required fields are checked locally. Errors do not include raw upstream response bodies. No automatic fallback between providers is used.

References: https://platform.claude.com/docs/en/build-with-claude/structured-outputs and https://platform.claude.com/docs/en/models/overview
