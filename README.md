# Autovid-Pro

Next.js application for AI-assisted scene-based video creation.

## Current deployment architecture

- Next.js standalone server + Prisma/SQLite
- n8n orchestrates script, scene, image, and voice generation
- FFmpeg renders the generated scene images and voice tracks into a vertical 1080x1920 MP4
- Generated assets are stored under `public/generated/<projectId>/`

## Quick start (Ubuntu)

1. Install Node.js 22 LTS, FFmpeg, and Git.
2. Clone this repository and check out the deployment branch while it is being tested:
   `git checkout feature/n8n-ai-deployment`
3. Copy `.env.example` to `.env`, then set a persistent SQLite `DATABASE_URL`, `N8N_WEBHOOK_URL`, and `N8N_WEBHOOK_TOKEN`.
4. Install dependencies with `npm install` (or Bun if you use the lockfile), then run `npm run db:generate`.
5. Install n8n using the instructions in [deploy/n8n/README.md](deploy/n8n/README.md).
6. Configure the n8n workflow according to [docs/N8N-INTEGRATION.md](docs/N8N-INTEGRATION.md).
7. Run `npm run build` and `npm start`.

Do not run `prisma db push --accept-data-loss` on a database containing important data. Back up the SQLite file before schema changes.

## Important deployment notes

- The app API currently has no built-in user authentication. Put the app behind Cloudflare Access or another authenticated reverse proxy before exposing it publicly.
- n8n must use HTTPS externally and a strong encryption key. Do not expose port 5678 directly.
- MP4 rendering requires FFmpeg on the Autovid-Pro host.
- Configure provider credentials in n8n; never commit API keys to Git.
- This feature branch still needs a full install/build/generation test on the target Ubuntu host before production use.
