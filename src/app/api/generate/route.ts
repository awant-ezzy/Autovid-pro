import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  generateScript,
  planScenes,
  generateSceneImage,
  generateSceneVoice,
  type Scene
} from '@/lib/ai-pipeline'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const body = await req.json()
        const { projectId } = body
        if (!projectId) throw new Error('projectId required')

        const project = await db.project.findUnique({ where: { id: projectId } })
        if (!project) throw new Error('Project not found')

        await db.project.update({
          where: { id: projectId },
          data: { status: 'generating', progress: 0, error: null }
        })

        // NODE 1: Script generation
        send('node_start', { node: 'script', label: 'Script Writer' })
        await db.project.update({
          where: { id: projectId },
          data: { currentNode: 'script' }
        })
        const script = await generateScript(project.topic, project.style, project.duration)
        await db.project.update({
          where: { id: projectId },
          data: { script, progress: 18 }
        })
        send('node_done', {
          node: 'script',
          label: 'Script Writer',
          progress: 18,
          result: { script }
        })

        // NODE 2: Scene planning
        send('node_start', { node: 'scenes', label: 'Scene Planner' })
        await db.project.update({
          where: { id: projectId },
          data: { currentNode: 'scenes' }
        })
        const scenes: Scene[] = await planScenes(script, project.style)
        await db.project.update({
          where: { id: projectId },
          data: { scenesJson: JSON.stringify(scenes), progress: 32 }
        })
        send('node_done', {
          node: 'scenes',
          label: 'Scene Planner',
          progress: 32,
          result: { scenesCount: scenes.length }
        })
        send('scenes_planned', { scenes })

        // NODE 3: Image generation (parallel, but throttle concurrency)
        send('node_start', { node: 'images', label: 'Image Generator' })
        await db.project.update({
          where: { id: projectId },
          data: { currentNode: 'images' }
        })
        // Process images 2 at a time to avoid overload
        const updatedScenesForImages: Scene[] = [...scenes]
        for (let i = 0; i < scenes.length; i += 2) {
          const batch = scenes.slice(i, i + 2)
          await Promise.all(
            batch.map(async (scene) => {
              try {
                const imageUrl = await generateSceneImage(
                  projectId,
                  scene,
                  project.style
                )
                updatedScenesForImages[scene.index] = { ...scene, imageUrl }
                send('scene_image_done', {
                  index: scene.index,
                  imageUrl
                })
              } catch (e: any) {
                console.error(`Image gen failed for scene ${scene.index}:`, e)
                send('scene_image_error', {
                  index: scene.index,
                  error: e.message
                })
              }
            })
          )
          const progress = 32 + Math.round(((i + batch.length) / scenes.length) * 35)
          await db.project.update({
            where: { id: projectId },
            data: {
              scenesJson: JSON.stringify(updatedScenesForImages),
              progress
            }
          })
          send('progress', { progress })
        }
        send('node_done', {
          node: 'images',
          label: 'Image Generator',
          progress: 67
        })

        // NODE 4: Voice generation (sequential with retry, avoids rate limits)
        send('node_start', { node: 'voice', label: 'Voiceover Artist' })
        await db.project.update({
          where: { id: projectId },
          data: { currentNode: 'voice' }
        })
        const updatedScenesForVoice: Scene[] = [...updatedScenesForImages]
        for (let i = 0; i < updatedScenesForImages.length; i++) {
          const scene = updatedScenesForImages[i]
          try {
            const audioUrl = await generateSceneVoice(projectId, scene, project.voice)
            updatedScenesForVoice[scene.index] = { ...scene, audioUrl }
            send('scene_voice_done', {
              index: scene.index,
              audioUrl
            })
          } catch (e: any) {
            console.error(`Voice gen failed for scene ${scene.index}:`, e)
            send('scene_voice_error', {
              index: scene.index,
              error: e.message
            })
          }
          // Brief delay between calls to avoid 429
          await new Promise((r) => setTimeout(r, 500))
          const progress = 67 + Math.round(((i + 1) / updatedScenesForImages.length) * 28)
          await db.project.update({
            where: { id: projectId },
            data: {
              scenesJson: JSON.stringify(updatedScenesForVoice),
              progress
            }
          })
          send('progress', { progress })
        }
        send('node_done', {
          node: 'voice',
          label: 'Voiceover Artist',
          progress: 95
        })

        // NODE 5: Assembly
        send('node_start', { node: 'assemble', label: 'Video Assembler' })
        await db.project.update({
          where: { id: projectId },
          data: { currentNode: 'assemble' }
        })
        // Estimate durations based on narration length (~ 14 chars per second of speech)
        const finalScenes = updatedScenesForVoice.map((s) => ({
          ...s,
          duration: Math.max(3, Math.min(12, Math.ceil(s.narration.length / 14)))
        }))
        await db.project.update({
          where: { id: projectId },
          data: {
            scenesJson: JSON.stringify(finalScenes),
            progress: 100,
            status: 'completed',
            currentNode: null
          }
        })
        send('node_done', {
          node: 'assemble',
          label: 'Video Assembler',
          progress: 100
        })
        send('complete', { projectId, scenes: finalScenes })
      } catch (e: any) {
        console.error('Generation pipeline error:', e)
        try {
          await db.project.updateMany({
            where: {},
            data: { status: 'failed', error: e.message }
          })
        } catch {}
        send('error', { message: e.message || 'Unknown error' })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}
