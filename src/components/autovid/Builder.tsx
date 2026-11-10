'use client'

import { useState } from 'react'
import { useAutovid } from '@/store/autovid'
import { WorkflowGraph } from './WorkflowGraph'
import { STYLE_OPTIONS, DURATION_OPTIONS, VOICE_OPTIONS } from '@/lib/options'
import { Sparkles, Wand2, Loader2, ArrowRight, Film, ImageOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function Builder() {
  const {
    currentProject,
    generating,
    nodes,
    scenes,
    error,
    createProject,
    startGeneration,
    setView
  } = useAutovid()

  const [topic, setTopic] = useState(currentProject?.topic || '')
  const [title, setTitle] = useState(currentProject?.title || '')
  const [style, setStyle] = useState(currentProject?.style || 'cinematic')
  const [duration, setDuration] = useState(currentProject?.duration || '30s')
  const [voice, setVoice] = useState(currentProject?.voice || 'tongtong')

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic first')
      return
    }
    let projectId = currentProject?.id
    if (!projectId) {
      projectId = await createProject({ topic, title, style, duration, voice }) || undefined
    }
    if (!projectId) {
      toast.error('Failed to create project')
      return
    }
    toast.success('Pipeline started — watch the nodes flow!')
    await startGeneration(projectId)
  }

  const completedScenes = scenes.filter((s) => s.imageUrl)
  const totalProgress = currentProject?.progress || 0
  const hasResult = scenes.length > 0 && scenes.some((s) => s.imageUrl)

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        {/* Left: Configuration panel */}
        <div className="space-y-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fuchsia-400" />
              <h2 className="text-lg font-bold text-white">Video Configuration</h2>
            </div>
            <p className="text-sm text-white/40">Describe what you want to create</p>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <Field label="Topic" hint="What is the video about?">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. The future of renewable energy in 2030"
                className="min-h-[80px] w-full resize-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-fuchsia-500/50 focus:outline-none"
                disabled={generating}
              />
            </Field>

            <Field label="Title (optional)">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Auto-generated from topic"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-fuchsia-500/50 focus:outline-none"
                disabled={generating}
              />
            </Field>

            <Field label="Visual Style">
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    disabled={generating}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all',
                      style === s.id
                        ? 'border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-200'
                        : 'border-white/10 bg-black/30 text-white/50 hover:border-white/20'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration">
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={generating}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-fuchsia-500/50 focus:outline-none"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.id} value={d.id} className="bg-zinc-900">
                      {d.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Voice">
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  disabled={generating}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-fuchsia-500/50 focus:outline-none"
                >
                  {VOICE_OPTIONS.map((v) => (
                    <option key={v.id} value={v.id} className="bg-zinc-900">
                      {v.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className={cn(
                'group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all',
                generating || !topic.trim()
                  ? 'cursor-not-allowed bg-white/5 text-white/30'
                  : 'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50'
              )}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generate Video
                </>
              )}
              {!generating && topic.trim() && (
                <motion.div
                  className="absolute inset-0 -translate-x-full bg-white/20"
                  animate={{ translateX: ['100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </button>

            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}
          </div>

          {/* Stats */}
          {currentProject && (
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-center">
              <Stat label="Progress" value={`${totalProgress}%`} />
              <Stat label="Scenes" value={`${scenes.length}`} />
              <Stat label="Status" value={currentProject.status} />
            </div>
          )}
        </div>

        {/* Right: Workflow + scenes */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-white">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-fuchsia-500/20 text-fuchsia-300">
                    <Film className="h-3.5 w-3.5" />
                  </span>
                  Workflow Pipeline
                </h3>
                <p className="mt-0.5 text-xs text-white/40">
                  5 AI nodes execute in sequence — like n8n but for video
                </p>
              </div>
              {hasResult && (
                <button
                  onClick={() => setView('player')}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/40 transition-colors hover:bg-emerald-500/25"
                >
                  Open Player
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center sm:gap-1">
              {/* Horizontal layout on desktop */}
              <div className="hidden sm:contents">
                {nodes.map((n, i) => (
                  <HorizontalNode key={n.id} node={n} isLast={i === nodes.length - 1} />
                ))}
              </div>
              {/* Vertical layout on mobile */}
              <div className="sm:hidden">
                <WorkflowGraph />
              </div>
            </div>
          </div>

          {/* Scenes preview */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Scene Preview</h3>
              <span className="text-xs text-white/40">
                {completedScenes.length}/{scenes.length} ready
              </span>
            </div>

            {scenes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-12 text-center">
                <ImageOff className="mb-2 h-8 w-8 text-white/20" />
                <p className="text-sm text-white/40">
                  Scenes will appear here as the pipeline runs
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <AnimatePresence>
                  {scenes.map((scene) => (
                    <motion.div
                      key={scene.index}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-video overflow-hidden rounded-lg border border-white/5 bg-black/40"
                    >
                      {scene.imageUrl ? (
                        <img
                          src={scene.imageUrl}
                          alt={scene.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10">
                          <Loader2 className="h-5 w-5 animate-spin text-fuchsia-400" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-fuchsia-500/80 text-[9px] font-bold text-white">
                            {scene.index + 1}
                          </span>
                          <span className="truncate text-[11px] font-medium text-white">
                            {scene.title}
                          </span>
                        </div>
                      </div>
                      {scene.audioUrl && (
                        <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/80 backdrop-blur">
                          <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="currentColor">
                            <path d="M3 9v6h4l5 5V4L7 9H3z" />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Script preview */}
          {currentProject?.script && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h3 className="mb-3 text-base font-bold text-white">Generated Script</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                {currentProject.script}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
          {label}
        </label>
        {hint && <span className="text-[10px] text-white/30">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-base font-bold capitalize text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
    </div>
  )
}

function HorizontalNode({ node, isLast }: { node: any; isLast: boolean }) {
  const ICONS: Record<string, any> = {
    pen: Sparkles,
    layers: Sparkles,
    image: Sparkles,
    mic: Sparkles,
    film: Sparkles
  }
  const Icon = ICONS[node.icon] || Sparkles
  const isProcessing = node.status === 'processing'
  const isDone = node.status === 'done'

  return (
    <>
      <div
        className={cn(
          'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all',
          isProcessing && 'border-fuchsia-500/50 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/20',
          isDone && 'border-emerald-500/40 bg-emerald-500/10',
          !isProcessing && !isDone && 'border-white/10 bg-white/[0.02]'
        )}
      >
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            isProcessing && 'bg-fuchsia-500/30',
            isDone && 'bg-emerald-500/30',
            !isProcessing && !isDone && 'bg-white/5'
          )}
        >
          {isDone ? (
            <svg className="h-4 w-4 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin text-fuchsia-300" />
          ) : (
            <Icon className="h-4 w-4 text-white/40" />
          )}
        </div>
        <div className="text-[11px] font-semibold leading-tight text-white">{node.label}</div>
      </div>
      {!isLast && (
        <div className="relative h-px w-8 bg-white/10">
          {isDone && (
            <motion.div
              className="absolute inset-0 bg-emerald-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{ transformOrigin: 'left' }}
            />
          )}
          {isProcessing && (
            <motion.div
              className="absolute inset-0 bg-fuchsia-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </div>
      )}
    </>
  )
}
