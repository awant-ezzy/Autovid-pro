import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'
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

// Step 1: Generate video script from topic
export async function generateScript(topic: string, style: string, duration: string) {
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'assistant',
        content: `You are a professional video scriptwriter. Write engaging, well-structured video narration scripts.`
      },
      {
        role: 'user',
        content: `Write a video script for the topic: "${topic}".
Style: ${style}
Target duration: ${duration}

Requirements:
- Write a compelling narration script ready to be spoken aloud
- 150-280 words total
- Engaging hook in the first sentence
- Clear structure: intro, body, conclusion
- Conversational, natural spoken tone
- No stage directions, no headers, just the spoken narration text
- End with a memorable closing line

Return ONLY the script text, nothing else.`
      }
    ],
    thinking: { type: 'disabled' }
  })
  return (completion.choices[0]?.message?.content || '').trim()
}

// Step 2: Break script into scenes with image prompts
export async function planScenes(script: string, style: string): Promise<Scene[]> {
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'assistant',
        content: `You are a video director who breaks narration scripts into visual scenes with detailed image prompts.`
      },
      {
        role: 'user',
        content: `Break the following video narration into 4 to 6 scenes. For each scene output a JSON object.

SCRIPT:
"""
${script}
"""

Visual style: ${style}

Return a JSON array, each item with fields:
- title: short scene title (max 6 words)
- narration: the portion of the script spoken during this scene (1-3 sentences, copy verbatim from the script)
- imagePrompt: a detailed visual prompt for image generation describing what should appear on screen. Include style, mood, composition, lighting. Style: ${style}. No text overlays.

Output ONLY the JSON array, no markdown, no explanation.`
      }
    ],
    thinking: { type: 'disabled' }
  })
  const raw = (completion.choices[0]?.message?.content || '').trim()
  // Extract JSON from response (in case model added markdown)
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Failed to parse scenes JSON')
  const scenes = JSON.parse(jsonMatch[0]) as Scene[]
  return scenes.map((s, i) => ({ ...s, index: i }))
}

// Step 3: Generate image for one scene
export async function generateSceneImage(
  projectId: string,
  scene: Scene,
  style: string
): Promise<string> {
  const dir = ensureProjectDir(projectId)
  const zai = await ZAI.create()
  const fullPrompt = `${scene.imagePrompt}. Visual style: ${style}, cinematic, high detail, professional photography`
  const response = await zai.images.generations.create({
    prompt: fullPrompt,
    size: '1344x768'
  })
  const base64 = response.data[0].base64
  const buffer = Buffer.from(base64, 'base64')
  const filename = `scene-${scene.index}.png`
  fs.writeFileSync(path.join(dir, filename), buffer)
  return publicUrlFor(projectId, filename)
}

// Step 4: Generate voiceover for one scene (with retry for rate limits)
export async function generateSceneVoice(
  projectId: string,
  scene: Scene,
  voice: string
): Promise<string> {
  const dir = ensureProjectDir(projectId)
  const zai = await ZAI.create()
  const text = scene.narration.slice(0, 1000) // TTS limit
  const filename = `scene-${scene.index}.wav`
  const outPath = path.join(dir, filename)

  // Retry up to 4 times with exponential backoff for 429/5xx
  const maxRetries = 4
  let lastError: any
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await zai.audio.tts.create({
        input: text,
        voice: voice,
        speed: 1.0,
        response_format: 'wav',
        stream: false
      })
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(new Uint8Array(arrayBuffer))
      fs.writeFileSync(outPath, buffer)
      return publicUrlFor(projectId, filename)
    } catch (e: any) {
      lastError = e
      const msg = e.message || ''
      if (msg.includes('429') || msg.includes('Too many requests') || msg.includes('5') || msg.includes('不支持')) {
        // Exponential backoff: 2s, 4s, 8s, 16s
        const wait = Math.min(2000 * Math.pow(2, attempt), 20000)
        console.warn(`TTS retry ${attempt + 1}/${maxRetries} for scene ${scene.index} after ${wait}ms`)
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
      throw e
    }
  }
  throw lastError
}
