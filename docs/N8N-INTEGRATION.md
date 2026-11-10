# Autovid-Pro + n8n AI integration

## Current repository status

The current generation pipeline calls `z-ai-web-dev-sdk` directly. n8n is not automatically connected merely by installing the n8n service. The app adapter and an n8n workflow must agree on the four action contracts documented in `deploy/n8n/README.md`.

## Required application environment

Add these values to the Autovid-Pro server environment (never to a browser-exposed `NEXT_PUBLIC_*` variable):

```env
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/autovid-generate
N8N_WEBHOOK_TOKEN=replace-with-a-long-random-secret
N8N_TIMEOUT_MS=240000
```

## Workflow design

Recommended n8n workflow:

1. Webhook (POST, Header Auth, production URL)
2. Switch on `{{$json.body.action}}`
3. For `script` and `scenes`, call an LLM using a credential stored in n8n; validate structured output before responding.
4. For `image`, call an image-generation provider and store the resulting asset in durable storage. Respond with `imageUrl`.
5. For `voice`, call a text-to-speech provider and store the audio in durable storage. Respond with `audioUrl`.
6. Respond to Webhook with JSON and the exact field names in the action contract.

The Webhook node should use Header Auth. The request header sent by the app is `X-Autovid-Token`; configure the credential to validate that header. Keep the webhook URL private and use HTTPS.

## Important

- n8n is a workflow orchestrator, not an AI model or media storage service. Provider API credentials and billing are separate.
- For image/audio URLs, use persistent storage reachable from both the app and browser. A local filesystem path on the n8n container is not automatically a URL served by Next.js.
- MP4 rendering still requires FFmpeg on the Autovid-Pro host and a server-side render route. Do not mark a project completed until the MP4 file has actually been created and verified.
- Before deploying to a live host, take a SQLite backup and test against a separate copy of the database.
