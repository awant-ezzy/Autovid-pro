'use client'

import { useAutovid } from '@/store/autovid'
import { STYLE_OPTIONS } from '@/lib/options'
import {
  Sparkles,
  Workflow,
  Zap,
  Mic,
  ImageIcon,
  PenLine,
  Film,
  ArrowRight,
  Play,
  Clock
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { toast } from 'sonner'

const FEATURES = [
  {
    icon: PenLine,
    title: 'Script Writer',
    desc: 'LLM crafts compelling narration from your topic',
    color: 'from-fuchsia-500 to-pink-500'
  },
  {
    icon: Sparkles,
    title: 'Scene Planner',
    desc: 'AI splits script into visual beats with prompts',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: ImageIcon,
    title: 'Image Generator',
    desc: 'Each scene gets a custom AI-generated visual',
    color: 'from-rose-500 to-orange-500'
  },
  {
    icon: Mic,
    title: 'Voiceover Artist',
    desc: 'Natural TTS narrates each scene in your voice',
    color: 'from-orange-500 to-amber-500'
  },
  {
    icon: Film,
    title: 'Video Assembler',
    desc: 'Auto-stitched into a playable slideshow video',
    color: 'from-amber-500 to-yellow-500'
  }
]

const PIPELINE_FLOW = [
  { label: 'Topic Input', icon: Zap },
  { label: 'AI Pipeline', icon: Workflow },
  { label: 'Final Video', icon: Film }
]

export function Dashboard() {
  const { setView, projects, loadProjects, setCurrentProject, currentProject } = useAutovid()

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleStart = () => {
    if (currentProject) {
      setCurrentProject(null)
    }
    setView('builder')
    toast.info('Configure your video in the Builder tab')
  }

  const handleOpenProject = (id: string) => {
    const p = projects.find((x) => x.id === id)
    if (p) {
      setCurrentProject(p)
      setView(p.status === 'completed' ? 'player' : 'builder')
    }
  }

  const completedCount = projects.filter((p) => p.status === 'completed').length

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-fuchsia-950/40 via-zinc-950 to-zinc-950 p-8 sm:p-12"
      >
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />

        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
            </span>
            Powered by free Z.ai models — no API key needed
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Turn any topic into a
            <span className="block bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              fully-narrated video
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/60 sm:text-lg">
            AutoVid Pro orchestrates 5 AI nodes — script writer, scene planner, image
            generator, voiceover artist, and video assembler — into a self-building pipeline
            that turns a single sentence into a finished narrated slideshow video.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={handleStart}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition-all hover:shadow-fuchsia-500/50"
            >
              <Sparkles className="h-4 w-4" />
              Create New Video
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => setView('projects')}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.05]"
            >
              <Play className="h-4 w-4" />
              View Projects ({projects.length})
            </button>
          </div>

          {/* Quick stats */}
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <Stat label="Total Projects" value={`${projects.length}`} />
            <Stat label="Completed Videos" value={`${completedCount}`} />
            <Stat label="AI Nodes" value="5" />
            <Stat label="Cost" value="$0" highlight />
          </div>
        </div>
      </motion.section>

      {/* Pipeline overview */}
      <section className="mt-10">
        <div className="mb-5 flex items-center gap-2">
          <Workflow className="h-5 w-5 text-fuchsia-400" />
          <h2 className="text-xl font-bold text-white">How the Pipeline Works</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/15"
              >
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/30">0{i + 1}</span>
                  <h3 className="text-sm font-bold text-white">{f.title}</h3>
                </div>
                <p className="text-xs leading-relaxed text-white/50">{f.desc}</p>
                {i < FEATURES.length - 1 && (
                  <ArrowRight className="absolute -right-1 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-white/10 lg:block" />
                )}
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Recent projects */}
      {projects.length > 0 && (
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-fuchsia-400" />
              <h2 className="text-xl font-bold text-white">Recent Projects</h2>
            </div>
            <button
              onClick={() => setView('projects')}
              className="text-xs text-fuchsia-400 hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((p) => {
              const scenePreview = (() => {
                try {
                  const arr = JSON.parse(p.scenesJson || '[]')
                  return arr.find((s: any) => s.imageUrl)?.imageUrl
                } catch {
                  return null
                }
              })()
              return (
                <button
                  key={p.id}
                  onClick={() => handleOpenProject(p.id)}
                  className="group flex items-center gap-3 overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition-all hover:border-fuchsia-500/30 hover:bg-fuchsia-500/5"
                >
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-black/40">
                    {scenePreview ? (
                      <img src={scenePreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Film className="h-5 w-5 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{p.title}</div>
                    <div className="truncate text-xs text-white/40">{p.topic}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          p.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : p.status === 'generating'
                            ? 'bg-fuchsia-500/20 text-fuchsia-300'
                            : p.status === 'failed'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-white/10 text-white/40'
                        }`}
                      >
                        {p.status}
                      </span>
                      <span className="text-[10px] text-white/30">
                        {STYLE_OPTIONS.find((s) => s.id === p.style)?.label || p.style}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  highlight
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <div
        className={`text-2xl font-bold ${
          highlight
            ? 'bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent'
            : 'text-white'
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  )
}
