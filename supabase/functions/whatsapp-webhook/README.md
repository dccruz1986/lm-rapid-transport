# WhatsApp intake webhook

Configure the Meta app with a WhatsApp Cloud API phone number and subscribe the app to the `messages` field. Set its callback URL to `https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook`. Set the verify token in Meta to the same random value as `WHATSAPP_VERIFY_TOKEN`.

Set `WHATSAPP_APP_SECRET`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, and `WHATSAPP_DRAIN_SECRET` as Supabase Edge Function secrets. `WHATSAPP_GRAPH_API_VERSION` is optional. Use `supabase/functions/.env` for local secrets. Keep that file out of Git.

The webhook validates Meta's `X-Hub-Signature-256` before processing an event. It accepts messages sent to the configured phone number and creates requests with `PENDING_REVIEW` because the client provides an approximate location. Staff should review the addresses and territory in admin.

Outgoing messages are queued in `private.whatsapp_outbox`. The migration schedules `private.whatsapp_drain_outbox()` every minute with `pg_cron`. Before enabling real messages, store two secrets in Supabase Vault using `vault.create_secret(value, name)`. The `whatsapp_webhook_url` value is the deployed Edge Function HTTPS URL. The `whatsapp_drain_secret` value must equal the Edge Function secret `WHATSAPP_DRAIN_SECRET`. The scheduled function skips the HTTP call until both values exist. It sends `X-WhatsApp-Drain-Secret` to the webhook, which drains pending and failed messages.

Inspect the outbox for rows with eight attempts, resolve the cause, and reset their attempts and state to `PENDING` if appropriate. Meta may accept a message even when its response is lost, so an exceptionally timed retry can duplicate a WhatsApp reply. The request itself remains unique.
