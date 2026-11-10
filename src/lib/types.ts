export type ProjectStatus = 'draft' | 'generating' | 'completed' | 'failed'

export type NodeStatus = 'idle' | 'processing' | 'done' | 'error'

export interface Scene {
  index: number
  title: string
  narration: string
  imagePrompt: string
  imageUrl?: string
  audioUrl?: string
  duration?: number
}

export interface WorkflowNode {
  id: string
  key: string
  label: string
  description: string
  icon: string
  status: NodeStatus
  detail?: string
}

export interface Project {
  id: string
  title: string
  topic: string
  style: string
  duration: string
  voice: string
  status: ProjectStatus
  script: string | null
  scenesJson: string
  progress: number
  currentNode: string | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export function parseScenes(json: string): Scene[] {
  try {
    return JSON.parse(json || '[]')
  } catch {
    return []
  }
}

export const DEFAULT_NODES: WorkflowNode[] = [
  {
    id: 'n1',
    key: 'script',
    label: 'Script Writer',
    description: 'LLM generates narration',
    icon: 'pen',
    status: 'idle'
  },
  {
    id: 'n2',
    key: 'scenes',
    label: 'Scene Planner',
    description: 'Split script into scenes',
    icon: 'layers',
    status: 'idle'
  },
  {
    id: 'n3',
    key: 'images',
    label: 'Image Generator',
    description: 'AI creates visuals per scene',
    icon: 'image',
    status: 'idle'
  },
  {
    id: 'n4',
    key: 'voice',
    label: 'Voiceover Artist',
    description: 'TTS narrates each scene',
    icon: 'mic',
    status: 'idle'
  },
  {
    id: 'n5',
    key: 'assemble',
    label: 'Video Assembler',
    description: 'Combine into final video',
    icon: 'film',
    status: 'idle'
  }
]
