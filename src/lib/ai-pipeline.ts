import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { callN8n } from './n8n-client'
import { VOICE_OPTIONS, STYLE_OPTIONS, DURATION_OPTIONS } from './options'

export { VOICE_OPTIONS, STYLE_OPTIONS, DURATION_OPTIONS }

const PUBLIC_GEN_DIR = path.join(process.cwd(), 'public', 'generated')

export function ensureProjectDir(projectId: string) {
  const dir = path.join(PUBLIC_GEN_DIR, projectId)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function publicUrlFor(projectId: string, filename: string) {
  return `/generated/${projectId}/${filename}`
}

export interface Scene {
  index: number
  title: string
  narration: string
  imagePrompt: string
  imageUrl?: string
  audioUrl?: string
  duration?: number
}

const scriptResponse = z.object({ script: z.string().min(1) })
const scenesResponse = z.object({
  scenes: z.array(z.object({
    title: z.string(),
    narration: z.string(),
    imagePrompt: z.string(),
  })).min(1).max(12),
})

async function saveRemoteAsset(projectId: string, filename: string, assetUrl: string) {
  const parsed = new URL(assetUrl)
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    throw new Error('n8n asset URLs must use HTTPS outside localhost.')
  }
  const response = await fetch(parsed, { signal: AbortSignal.timeout(120_000), cache: 'no-store' })
  if (!response.ok) throw new Error(`Unable to download generated asset (${response.status}).`)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length === 0 || buffer.length > 30 * 1024 * 1024) {
    throw new Error('Generated asset is empty or larger than the 30 MB limit.')
  }
  const dir = ensureProjectDir(projectId)
  fs.writeFileSync(path.join(dir, filename), buffer)
  return publicUrlFor(projectId, filename)
}

export async function generateScript(topic: string, style: string, duration: string) {
  const result = scriptResponse.parse(await callN8n<unknown>({ action: 'script', topic, style, duration }))
  return result.script.trim()
}

export async function planScenes(script: string, style: string): Promise<Scene[]> {
  const result = scenesResponse.parse(await callN8n<unknown>({ action: 'scenes', script, style }))
  return result.scenes.map((scene, index) => ({ ...scene, index }))
}

export async function generateSceneImage(projectId: string, scene: Scene, style: string): Promise<string> {
  const result = z.object({ imageUrl: z.string().url() }).parse(
    await callN8n<unknown>({ action: 'image', projectId, scene, style })
  )
  return saveRemoteAsset(projectId, `scene-${scene.index}.png`, result.imageUrl)
}

export async function generateSceneVoice(projectId: string, scene: Scene, voice: string): Promise<string> {
  const result = z.object({ audioUrl: z.string().url() }).parse(
    await callN8n<unknown>({ action: 'voice', projectId, scene, voice })
  )
  return saveRemoteAsset(projectId, `scene-${scene.index}.wav`, result.audioUrl)
}
