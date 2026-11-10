'use client'

import { create } from 'zustand'
import {
  type Project,
  type Scene,
  type WorkflowNode,
  type NodeStatus,
  DEFAULT_NODES,
  parseScenes
} from '@/lib/types'

export type View = 'dashboard' | 'builder' | 'player' | 'projects'

interface AutovidState {
  view: View
  projects: Project[]
  currentProject: Project | null
  nodes: WorkflowNode[]
  scenes: Scene[]
  generating: boolean
  error: string | null
  selectedProjectId: string | null
  // actions
  setView: (v: View) => void
  setProjects: (p: Project[]) => void
  setCurrentProject: (p: Project | null) => void
  setScenes: (s: Scene[]) => void
  setGenerating: (g: boolean) => void
  setError: (e: string | null) => void
  resetNodes: () => void
  setNodeStatus: (key: string, status: NodeStatus, detail?: string) => void
  loadProjects: () => Promise<void>
  loadProject: (id: string) => Promise<void>
  createProject: (input: {
    topic: string
    title?: string
    style: string
    duration: string
    voice: string
  }) => Promise<string | null>
  deleteProject: (id: string) => Promise<void>
  startGeneration: (projectId: string) => Promise<void>
}

export const useAutovid = create<AutovidState>((set, get) => ({
  view: 'dashboard',
  projects: [],
  currentProject: null,
  nodes: DEFAULT_NODES.map((n) => ({ ...n })),
  scenes: [],
  generating: false,
  error: null,
  selectedProjectId: null,

  setView: (v) => set({ view: v }),
  setProjects: (p) => set({ projects: p }),
  setCurrentProject: (p) => {
    set({ currentProject: p, selectedProjectId: p?.id ?? null })
    if (p) {
      set({ scenes: parseScenes(p.scenesJson) })
      const nodes = DEFAULT_NODES.map((n) => ({ ...n }))
      if (p.status === 'completed') {
        nodes.forEach((n) => (n.status = 'done'))
      } else if (p.status === 'generating') {
        const order = ['script', 'scenes', 'images', 'voice', 'assemble']
        const currentIdx = order.indexOf(p.currentNode || '')
        nodes.forEach((n, i) => {
          if (i < currentIdx) n.status = 'done'
          else if (i === currentIdx) n.status = 'processing'
        })
      } else if (p.status === 'failed') {
        const failedNode = nodes.find((n) => n.key === p.currentNode)
        if (failedNode) failedNode.status = 'error'
      }
      set({ nodes })
    } else {
      set({ nodes: DEFAULT_NODES.map((n) => ({ ...n })) })
    }
  },
  setScenes: (s) => set({ scenes: s }),
  setGenerating: (g) => set({ generating: g }),
  setError: (e) => set({ error: e }),
  resetNodes: () => set({ nodes: DEFAULT_NODES.map((n) => ({ ...n })) }),
  setNodeStatus: (key, status, detail) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.key === key ? { ...n, status, detail: detail ?? n.detail } : n
      )
    })),

  loadProjects: async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      set({ projects: data.projects || [] })
    } catch (e) {
      console.error('loadProjects error', e)
    }
  },

  loadProject: async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      const data = await res.json()
      if (data.project) {
        get().setCurrentProject(data.project)
      }
    } catch (e) {
      console.error('loadProject error', e)
    }
  },

  createProject: async (input) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      const data = await res.json()
      if (data.project) {
        await get().loadProjects()
        get().setCurrentProject(data.project)
        return data.project.id
      }
      return null
    } catch (e) {
      console.error('createProject error', e)
      return null
    }
  },

  deleteProject: async (id) => {
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      await get().loadProjects()
      if (get().currentProject?.id === id) {
        get().setCurrentProject(null)
      }
    } catch (e) {
      console.error('deleteProject error', e)
    }
  },

  startGeneration: async (projectId) => {
    set({ generating: true, error: null })
    get().resetNodes()
    set({ scenes: [] })

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''
        for (const evt of events) {
          const lines = evt.split('\n')
          let eventName = 'message'
          let dataStr = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) eventName = line.slice(7)
            else if (line.startsWith('data: ')) dataStr += line.slice(6)
          }
          if (!dataStr) continue
          let data: any
          try {
            data = JSON.parse(dataStr)
          } catch {
            continue
          }
          handleSSEEvent(eventName, data, get, set)
        }
      }
    } catch (e: any) {
      set({ error: e.message || 'Generation failed' })
    } finally {
      set({ generating: false })
      await get().loadProject(projectId)
    }
  }
}))

function handleSSEEvent(
  event: string,
  data: any,
  get: AutovidState,
  set: (partial: Partial<AutovidState>) => void
) {
  switch (event) {
    case 'node_start':
      get().setNodeStatus(data.node, 'processing')
      break
    case 'node_done':
      get().setNodeStatus(data.node, 'done')
      if (data.result?.script) {
        const cp = get().currentProject
        if (cp) {
          set({
            currentProject: { ...cp, script: data.result.script, progress: data.progress }
          })
        }
      } else {
        const cp = get().currentProject
        if (cp) set({ currentProject: { ...cp, progress: data.progress } })
      }
      break
    case 'scenes_planned':
      set({ scenes: data.scenes })
      break
    case 'scene_image_done':
      set((state: any) => ({
        scenes: state.scenes.map((s: Scene) =>
          s.index === data.index ? { ...s, imageUrl: data.imageUrl } : s
        )
      }))
      break
    case 'scene_voice_done':
      set((state: any) => ({
        scenes: state.scenes.map((s: Scene) =>
          s.index === data.index ? { ...s, audioUrl: data.audioUrl } : s
        )
      }))
      break
    case 'scene_image_error':
    case 'scene_voice_error':
      break
    case 'progress':
      {
        const cp = get().currentProject
        if (cp) set({ currentProject: { ...cp, progress: data.progress } })
      }
      break
    case 'complete':
      set({ scenes: data.scenes })
      {
        const cp2 = get().currentProject
        if (cp2) {
          set({
            currentProject: {
              ...cp2,
              status: 'completed',
              progress: 100,
              scenesJson: JSON.stringify(data.scenes)
            }
          })
        }
      }
      break
    case 'error':
      set({ error: data.message })
      break
  }
}
