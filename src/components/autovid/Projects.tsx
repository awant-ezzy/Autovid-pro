'use client'

import { useEffect } from 'react'
import { useAutovid } from '@/store/autovid'
import { STYLE_OPTIONS } from '@/lib/options'
import { Film, Trash2, Play, Clock, FolderOpen, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export function Projects() {
  const {
    projects,
    loadProjects,
    deleteProject,
    setCurrentProject,
    setView,
    currentProject
  } = useAutovid()

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleOpen = (id: string, status: string) => {
    const p = projects.find((x) => x.id === id)
    if (!p) return
    setCurrentProject(p)
    localStorage.setItem('autovid_last_project_id', id)
    setView(status === 'completed' ? 'player' : 'builder')
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this project? This cannot be undone.')) return
    await deleteProject(id)
    toast.success('Project deleted')
  }

  const handleNew = () => {
    if (currentProject) setCurrentProject(null)
    setView('builder')
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <FolderOpen className="h-6 w-6 text-fuchsia-400" />
            Your Projects
          </h1>
          <p className="mt-1 text-sm text-white/40">
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition-all hover:shadow-fuchsia-500/50"
        >
          <Plus className="h-4 w-4" />
          New Video
        </button>
      </div>

      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20">
            <Film className="h-8 w-8 text-fuchsia-300" />
          </div>
          <h3 className="mb-1 text-lg font-bold text-white">No projects yet</h3>
          <p className="mb-5 text-sm text-white/40">
            Create your first AI-generated video to get started
          </p>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Create Your First Video
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            const scenes = (() => {
              try {
                return JSON.parse(p.scenesJson || '[]')
              } catch {
                return []
              }
            })()
            const firstImage = scenes.find((s: any) => s.imageUrl)?.imageUrl
            const styleLabel = STYLE_OPTIONS.find((s) => s.id === p.style)?.label || p.style
            const date = new Date(p.createdAt)
            const dateStr = date.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleOpen(p.id, p.status)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] transition-all hover:border-fuchsia-500/30 hover:bg-fuchsia-500/[0.03]"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-black/40">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10">
                      <Film className="h-8 w-8 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                  {/* Status badge */}
                  <div className="absolute right-2 top-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase backdrop-blur ${
                        p.status === 'completed'
                          ? 'bg-emerald-500/30 text-emerald-200'
                          : p.status === 'generating'
                          ? 'bg-fuchsia-500/30 text-fuchsia-200'
                          : p.status === 'failed'
                          ? 'bg-rose-500/30 text-rose-200'
                          : 'bg-white/20 text-white/70'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Play overlay on hover */}
                  {p.status === 'completed' && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-2xl shadow-fuchsia-500/50">
                        <Play className="ml-1 h-6 w-6 text-white" fill="white" />
                      </div>
                    </div>
                  )}

                  {/* Scene count */}
                  {scenes.length > 0 && (
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur">
                      {scenes.length} scenes
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="mb-1 line-clamp-1 font-bold text-white">{p.title}</h3>
                  <p className="mb-3 line-clamp-2 text-xs text-white/50">{p.topic}</p>

                  <div className="flex items-center justify-between text-[11px] text-white/40">
                    <span className="rounded bg-white/5 px-1.5 py-0.5 font-medium">
                      {styleLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {dateStr}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {/* placeholder for status, kept top-right */}
                </div>

                {/* Delete button - bottom right corner */}
                <button
                  onClick={(e) => handleDelete(p.id, e)}
                  className="absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/80 text-white opacity-0 backdrop-blur transition-all hover:bg-rose-500 group-hover:opacity-100"
                  title="Delete project"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
