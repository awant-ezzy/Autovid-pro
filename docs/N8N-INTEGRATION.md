# Autovid-Pro + local Ollama/n8n workflow

This deployment keeps text generation and Indonesian speech synthesis local:

- Ollama + `qwen2.5:3b`: script writing and scene planning
- Piper TTS + `id_ID-news_tts-medium`: Indonesian WAV narration
- n8n: routes the four Autovid actions and validates JSON
- SVG scene cards: local poster-style visuals, rasterized to PNG by the app
- FFmpeg: assembles scene PNGs and WAV narration into vertical MP4

**Image-generation note:** this starter workflow creates designed SVG scene cards, not photorealistic AI artwork. Ollama is a text model; it does not generate image pixels. ComfyUI + a compatible diffusion model can be added later for actual AI images, preferably on a machine with a supported GPU.

## 1. Start local AI services

Run from this folder:

```bash
cd deploy/n8n
cp .env.example .env
nano .env
```

Set the n8n public hostname, HTTPS URLs, timezone, and a unique encryption key:

```bash
openssl rand -hex 32
```

Install Docker Engine and the Compose plugin if they are not already installed. Then:

```bash
docker compose build piper
docker compose up -d
docker compose exec ollama ollama pull qwen2.5:3b
docker compose ps
```

The first Ollama model download and Piper image build need internet access. In normal operation, model inference and Indonesian TTS run locally. The Ollama and Piper ports are not published to the LAN; n8n reaches them on the private Compose network.

Check Ollama:

```bash
docker compose exec ollama ollama run qwen2.5:3b "Tulis satu kalimat bahasa Indonesia."
```

Piper is intentionally not published to the host. To test it from inside the Compose network, use:

```bash
docker compose exec n8n node -e "fetch('http://piper:5000/info').then(r=>r.text()).then(console.log).catch(e=>{console.error(e);process.exit(1)})"
```

## 2. Import the workflow

1. Open the n8n editor at your configured HTTPS hostname.
2. Select **Workflows → Import from File**.
3. Import `workflows/autovid-ollama-local.json`.
4. Open the **Autovid Webhook** node.
5. Under Authentication choose **Header Auth**, then create/select a credential:
   - Header Name: `X-Autovid-Token`
   - Header Value: the same long random secret used as `N8N_WEBHOOK_TOKEN` in the Autovid-Pro app's server environment.
6. Save the workflow and activate/publish it.
7. The production webhook path is `/webhook/autovid-generate`.

The workflow uses direct HTTP calls to the private `ollama` and `piper` Compose services, so it does not need an Ollama API key. If you add native **Chat Ollama** nodes later, create an Ollama credential with Base URL `http://ollama:11434`; do not use localhost from inside the n8n container.

## 3. Configure Autovid-Pro

On the Autovid-Pro application host, set these server-side environment variables:

```env
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/autovid-generate
N8N_WEBHOOK_TOKEN=the-same-long-random-header-value
N8N_TIMEOUT_MS=240000
```

Restart the Next.js/PM2 process after changing environment values. Never put the webhook token in a `NEXT_PUBLIC_*` variable or commit it to Git.

## 4. Test all four actions

Replace the URL and token. Run these from a machine that can reach the n8n HTTPS hostname.

### Script

```bash
curl -sS -X POST "https://n8n.example.com/webhook/autovid-generate" \
  -H "Content-Type: application/json" \
  -H "X-Autovid-Token: YOUR_SECRET" \
  -d '{"action":"script","topic":"Manfaat menjaga silaturahmi","style":"cinematic","duration":"30 detik"}'
```

Expected JSON: `{"script":"..."}`

### Scene planning

```bash
curl -sS -X POST "https://n8n.example.com/webhook/autovid-generate" \
  -H "Content-Type: application/json" \
  -H "X-Autovid-Token: YOUR_SECRET" \
  -d '{"action":"scenes","style":"cinematic","script":"Silaturahmi mempererat persaudaraan. Mulailah dengan menyapa dan saling peduli."}'
```

Expected JSON: `{"scenes":[{"title":"...","narration":"...","imagePrompt":"..."}]}`

### Scene artwork

```bash
curl -sS -X POST "https://n8n.example.com/webhook/autovid-generate" \
  -H "Content-Type: application/json" \
  -H "X-Autovid-Token: YOUR_SECRET" \
  -d '{"action":"image","projectId":"test-project","style":"cinematic","scene":{"index":0,"title":"Silaturahmi","narration":"Menjaga hubungan baik dimulai dari hal sederhana.","imagePrompt":"Warm cinematic village gathering"}}' \
  -o image-response.json
```

Expected JSON includes an `imageUrl` beginning with `data:image/svg+xml;base64,`.

### Indonesian voice

```bash
curl -sS -X POST "https://n8n.example.com/webhook/autovid-generate" \
  -H "Content-Type: application/json" \
  -H "X-Autovid-Token: YOUR_SECRET" \
  -d '{"action":"voice","projectId":"test-project","voice":"id_ID-news_tts-medium","scene":{"index":0,"title":"Tes suara","narration":"Halo, ini pengujian suara Bahasa Indonesia dari Piper lokal."}}' \
  -o audio-response.json
```

Expected JSON includes an `audioUrl` beginning with `data:audio/wav;base64,`.

A wrong/missing token should be rejected by the Webhook node with HTTP 401. In n8n, inspect **Executions** for the failed node if a request fails.

## 5. End-to-end app test

1. Back up the Autovid-Pro SQLite database and the `public/generated` folder.
2. Deploy the feature branch to a separate test instance first.
3. Confirm the four webhook tests above pass.
4. Create a short test project in Autovid-Pro and generate only a few scenes.
5. Confirm images appear, audio plays, and `final.mp4` downloads.
6. Check the MP4 with `ffprobe public/generated/<projectId>/final.mp4` and play it before using the app for real projects.

## Troubleshooting

- **Ollama connection refused:** check `docker compose ps`; n8n must use `http://ollama:11434`, not localhost.
- **Model not found:** run `docker compose exec ollama ollama pull qwen2.5:3b`.
- **Piper voice missing:** rebuild the Piper image and check `docker compose logs piper`.
- **Webhook 401:** confirm the Webhook node uses the Header Auth credential with header name exactly `X-Autovid-Token`, and that the app token matches.
- **Long first response:** the model loads on first request. The first generation may be slower on CPU.
- **MP4 render fails:** install FFmpeg on the Autovid-Pro host and check `ffmpeg -version`.

## Backup and update

Back up the n8n Docker volume before updates. Discover the actual volume name using `docker volume ls`; do not assume the Compose project prefix. Never run `docker compose down -v` unless intentionally deleting all n8n, Ollama, and Piper persisted data.

Piper software is GPL-3.0 and voice models have their own model-card terms. Review the model license and intended-use terms before commercial redistribution.
