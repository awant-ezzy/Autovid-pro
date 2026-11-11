export async function callN8n<T>(payload: { action: 'script' | 'scenes' | 'image' | 'voice'; [key: string]: unknown }): Promise<T> {
  const url = process.env.N8N_WEBHOOK_URL
  const token = process.env.N8N_WEBHOOK_TOKEN
  if (!url || !token) throw new Error('n8n is not configured. Set N8N_WEBHOOK_URL and N8N_WEBHOOK_TOKEN on the server.')

  const parsedUrl = new URL(url)
  if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost' && parsedUrl.hostname !== '127.0.0.1') {
    throw new Error('N8N_WEBHOOK_URL must use HTTPS outside localhost.')
  }

  const timeout = Math.max(10_000, Math.min(Number(process.env.N8N_TIMEOUT_MS) || 240_000, 600_000))
  const response = await fetch(parsedUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Autovid-Token': token },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeout),
    cache: 'no-store',
  })
  const raw = await response.text()
  if (!response.ok) throw new Error(`n8n request failed (${response.status}): ${raw.slice(0, 500)}`)

  let result: unknown
  try { result = JSON.parse(raw) } catch {
    throw new Error('n8n returned invalid JSON. Configure the workflow to respond with JSON.')
  }
  if (Array.isArray(result) && result.length === 1) result = result[0]
  if (result && typeof result === 'object' && 'json' in result) result = (result as { json: unknown }).json
  return result as T
}
