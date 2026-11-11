import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import type { Scene } from './ai-pipeline'

const GENERATED_ROOT = path.join(process.cwd(), 'public', 'generated')

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const command = process.env.FFMPEG_PATH || 'ffmpeg'
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-6000)
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`))
    })
  })
}

export async function renderProjectVideo(projectId: string, scenes: Scene[]) {
  if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) throw new Error('Invalid project id for video rendering.')
  if (!scenes.length) throw new Error('There are no scenes to render.')

  const projectDir = path.join(GENERATED_ROOT, projectId)
  await fs.promises.mkdir(projectDir, { recursive: true })
  const segmentsDir = path.join(projectDir, '.segments')
  await fs.promises.rm(segmentsDir, { recursive: true, force: true })
  await fs.promises.mkdir(segmentsDir, { recursive: true })

  const ordered = [...scenes].sort((a, b) => a.index - b.index)
  const segmentNames: string[] = []

  for (const [position, scene] of ordered.entries()) {
    const imageName = `scene-${scene.index}.png`
    const audioName = `scene-${scene.index}.wav`
    const imagePath = path.join(projectDir, imageName)
    const audioPath = path.join(projectDir, audioName)
    if (!fs.existsSync(imagePath) || !fs.existsSync(audioPath)) {
      throw new Error(`Scene ${scene.index + 1} is missing its image or voice file.`)
    }

    const segmentName = `segment-${position}.mp4`
    const segmentPath = path.join(segmentsDir, segmentName)
    await runFfmpeg([
      '-y', '-loop', '1', '-framerate', '30', '-i', imagePath, '-i', audioPath,
      '-map', '0:v:0', '-map', '1:a:0',
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'stillimage', '-r', '30',
      '-c:a', 'aac', '-b:a', '160k', '-ar', '44100',
      '-shortest', '-movflags', '+faststart', segmentPath,
    ])
    segmentNames.push(segmentName)
  }

  const concatPath = path.join(segmentsDir, 'concat.txt')
  const concatText = segmentNames.map((name) => `file '${name}'`).join('\n') + '\n'
  await fs.promises.writeFile(concatPath, concatText, 'utf8')

  const outputPath = path.join(projectDir, 'final.mp4')
  await runFfmpeg([
    '-y', '-f', 'concat', '-safe', '0', '-i', concatPath,
    '-c', 'copy', '-movflags', '+faststart', outputPath,
  ])
  const stat = await fs.promises.stat(outputPath)
  if (stat.size < 1024) throw new Error('FFmpeg produced an invalid or empty MP4 file.')
  await fs.promises.rm(segmentsDir, { recursive: true, force: true })
  return `/generated/${projectId}/final.mp4`
}
