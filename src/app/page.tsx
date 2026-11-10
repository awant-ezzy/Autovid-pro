'use client'

import { useEffect } from 'react'
import { Header } from '@/components/autovid/Header'
import { Dashboard } from '@/components/autovid/Dashboard'
import { Builder } from '@/components/autovid/Builder'
import { Player } from '@/components/autovid/Player'
import { Projects } from '@/components/autovid/Projects'
import { useAutovid } from '@/store/autovid'
import { Heart } from 'lucide-react'

export default function Home() {
  const { view, loadProjects, currentProject } = useAutovid()

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Persist last project id
  useEffect(() => {
    if (currentProject?.id) {
      localStorage.setItem('autovid_last_project_id', currentProject.id)
    }
  }, [currentProject?.id])

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/5 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-pink-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-rose-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {view === 'dashboard' && <Dashboard />}
          {view === 'builder' && <Builder />}
          {view === 'player' && <Player />}
          {view === 'projects' && <Projects />}
        </main>

        <footer className="mt-auto border-t border-white/5 bg-black/40 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-white/40 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white/60">AutoVid Pro</span>
              <span>·</span>
              <span>AI Video Generation Studio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Built with</span>
              <Heart className="h-3 w-3 fill-fuchsia-500 text-fuchsia-500" />
              <span>using Z.ai free models · Next.js · TypeScript</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
