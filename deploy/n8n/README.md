# n8n for Autovid-Pro

This folder installs n8n separately from the Next.js application. The n8n database and credentials live in the persistent Docker volume `n8n_data`; do not delete that volume during upgrades.

## Requirements

- Ubuntu Server 22.04/24.04 or Debian 12/13
- Docker Engine and Docker Compose plugin
- A hostname routed to this server through Cloudflare Tunnel or a reverse proxy
- At least 2 GB RAM available for n8n; more is recommended for concurrent executions

## Install

```bash
sudo apt update
sudo apt install -y ca-certificates curl openssl
# Install Docker using the official Docker Engine instructions for your Ubuntu/Debian release.
docker --version
docker compose version
```

Then:

```bash
cd deploy/n8n
cp .env.example .env
nano .env
# Set the public HTTPS hostname and a unique encryption key:
openssl rand -hex 32
docker compose up -d
docker compose logs -f n8n
```

Open `https://n8n.example.com` and create the owner account. Do not expose port 5678 directly to the public internet. The Compose file binds it to localhost only; point Cloudflare Tunnel/reverse proxy to `http://127.0.0.1:5678`.

For a Cloudflare Tunnel ingress rule, use the service URL `http://localhost:5678` and the exact hostname configured in `.env`.

## Backup and update

Back up the n8n volume before upgrades:

```bash
docker run --rm -v autovid-pro_n8n_data:/data -v "$PWD":/backup alpine \
  tar -czf /backup/n8n-data-$(date +%F).tar.gz -C /data .
``

The actual volume name can vary with the Compose project name. Check it with `docker volume ls` before running the backup command.

Update the image only after taking a backup:

```bash
docker compose pull
docker compose up -d
docker compose logs --tail=100 n8n
``

Never run `docker compose down -v` unless you intentionally want to delete n8n's persistent data.

## Autovid integration contract

Configure an n8n Webhook workflow and set its production URL in the Autovid-Pro application as `N8N_WEBHOOK_URL`. Protect the webhook with a Header Auth credential and set the same secret in Autovid-Pro as `N8N_WEBHOOK_TOKEN`.

The workflow should accept a JSON body with an `action` field:

- `script`: `{ action, topic, style, duration }` -> respond with `{ script: string }`
- `scenes`: `{ action, script, style }` -> respond with `{ scenes: [{ title, narration, imagePrompt }] }`
- `image`: `{ action, projectId, scene, style }` -> respond with `{ imageUrl: "https://..." }`
- `voice`: `{ action, projectId, scene, voice }` -> respond with `{ audioUrl: "https://..." }`

Use n8n's Webhook node with response mode set to **When Last Node Finishes** (or a Respond to Webhook node). Each route must return JSON matching the contract above. For image/audio, return a URL accessible by the Autovid-Pro server/browser; do not return a temporary URL that expires before playback.

The n8n workflow and AI provider credentials are intentionally configured in the n8n UI, not embedded in this repository. This avoids committing API keys and lets you choose OpenAI, Gemini, or another provider. Configure provider credentials in n8n's Credentials UI.
