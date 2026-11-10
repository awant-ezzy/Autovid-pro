'use client'

import { useAutovid, type View } from '@/store/autovid'
import { Sparkles, LayoutDashboard, Workflow, Play, FolderOpen, Github } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const TABS: { id: View; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'builder', label: 'Builder', icon: Workflow },
  { id: 'player', label: 'Player', icon: Play },
  { id: 'projects', label: 'Projects', icon: FolderOpen }
]

export function Header() {
  const { view, setView, currentProject } = useAutovid()

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 shadow-lg shadow-fuchsia-500/30">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">AutoVid</span>
              <span className="rounded bg-gradient-to-r from-fuchsia-500 to-pink-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Pro
              </span>
            </div>
            <p className="text-[10px] text-white/40">AI Video Generation Studio</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-white/5 bg-white/[0.02] p-1 md:flex">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = view === t.id
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  active ? 'text-white' : 'text-white/50 hover:text-white/80'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="tab-active"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 ring-1 ring-fuchsia-500/40"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="relative h-3.5 w-3.5" />
                <span className="relative">{t.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {currentProject && (
            <div className="hidden max-w-[200px] truncate text-xs text-white/60 lg:block">
              <span className="text-white/30">Project: </span>
              <span className="font-medium text-white/80">{currentProject.title}</span>
            </div>
          )}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/5 text-white/50 transition-colors hover:text-white sm:flex"
            aria-label="Source"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Mobile tabs */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/5 px-3 py-2 md:hidden">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = view === t.id
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'bg-fuchsia-500/20 text-white ring-1 ring-fuchsia-500/40'
                  : 'text-white/50'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
