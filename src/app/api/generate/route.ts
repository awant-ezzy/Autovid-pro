import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { generateScript, planScenes, generateSceneImage, generateSceneVoice, type Scene } from '@/lib/ai-pipeline'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\\ndata: ${JSON.stringify(data)}\\n\\n`))
      }
      let projectId: string | undefined

      try {
        const body = await req.json()
        projectId = typeof body.projectId === 'string' ? body.projectId : undefined
        if (!projectId) throw new Error('projectId required')

        const project = await db.project.findUnique({ where: { id: projectId } })
        if (!project) throw new Error('Project not found')
        await db.project.update({ where: { id: projectId }, data: { status: 'generating', progress: 0, error: null } })

        send('node_start', { node: 'script', label: 'Script Writer' })
        await db.project.update({ where: { id: projectId }, data: { currentNode: 'script' } })
        const script = await generateScript(project.topic, project.style, project.duration)
        await db.project.update({ where: { id: projectId }, data: { script, progress: 18 } })
        send('node_done', { node: 'script', label: 'Script Writer', progress: 18, result: { script } })

        send('node_start', { node: 'scenes', label: 'Scene Planner' })
        await db.project.update({ where: { id: projectId }, data: { currentNode: 'scenes' } })
        const scenes: Scene[] = await planScenes(script, project.style)
        await db.project.update({ where: { id: projectId }, data: { scenesJson: JSON.stringify(scenes), progress: 32 } })
        send('node_done', { node: 'scenes', label: 'Scene Planner', progress: 32, result: { scenesCount: scenes.length } })
        send('scenes_planned', { scenes })

        send('node_start', { node: 'images', label: 'Image Generator' })
        await db.project.update({ where: { id: projectId }, data: { currentNode: 'images' } })
        const withImages: Scene[] = [...scenes]
        for (let i = 0; i < scenes.length; i += 2) {
          const batch = scenes.slice(i, i + 2)
          await Promise.all(batch.map(async (scene) => {
            const imageUrl = await generateSceneImage(projectId!, scene, project.style)
            withImages[scene.index] = { ...scene, imageUrl }
            send('scene_image_done', { index: scene.index, imageUrl })
          }))
          const progress = 32 + Math.round(((i + batch.length) / scenes.length) * 35)
          await db.project.update({ where: { id: projectId! }, data: { scenesJson: JSON.stringify(withImages), progress } })
          send('progress', { progress })
        }
        send('node_done', { node: 'images', label: 'Image Generator', progress: 67 })

        send('node_start', { node: 'voice', label: 'Voiceover Artist' })
        await db.project.update({ where: { id: projectId }, data: { currentNode: 'voice' } })
        const withVoice: Scene[] = [...withImages]
        for (let i = 0; i < withImages.length; i++) {
          const scene = withImages[i]
          const audioUrl = await generateSceneVoice(projectId, scene, project.voice)
          withVoice[scene.index] = { ...scene, audioUrl }
          send('scene_voice_done', { index: scene.index, audioUrl })
          const progress = 67 + Math.round(((i + 1) / withImages.length) * 28)
          await db.project.update({ where: { id: projectId }, data: { scenesJson: JSON.stringify(withVoice), progress } })
          send('progress', { progress })
        }
        send('node_done', { node: 'voice', label: 'Voiceover Artist', progress: 95 })

        const finalScenes = withVoice.map((scene) => ({
          ...scene,
          duration: Math.max(3, Math.min(12, Math.ceil(scene.narration.length / 14))),
        }))
        const missing = finalScenes.filter((scene) => !scene.imageUrl || !scene.audioUrl)
        if (missing.length) throw new Error(`Generation incomplete: ${missing.length} scene(s) are missing image or audio assets.`)

        await db.project.update({
          where: { id: projectId },
          data: { scenesJson: JSON.stringify(finalScenes), progress: 100, status: 'completed', currentNode: null }
        })
        send('node_done', { node: 'assemble', label: 'Media Ready', progress: 100 })
        send('complete', { projectId, scenes: finalScenes, note: 'Scene media generated. MP4 rendering is not included in this pipeline yet.' })
      } catch (e: any) {
        console.error('Generation pipeline error:', e)
        if (projectId) {
          try {
            await db.project.update({
              where: { id: projectId },
              data: { status: 'failed', error: e?.message || 'Unknown error', currentNode: null }
            })
          } catch {}
        }
        send('error', { message: e?.message || 'Unknown error' })
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
