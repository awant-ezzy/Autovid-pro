'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAutovid } from '@/store/autovid'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Film,
  Loader2,
  Download,
  RotateCcw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Player() {
  const { currentProject, scenes, setView, loadProject } = useAutovid()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0) // 0-1 within current scene
  const [sceneDurations, setSceneDurations] = useState<number[]>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sceneTimerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const sceneDurationRef = useRef<number>(5000)
  const isPlayingRef = useRef<boolean>(false)
  const currentIndexRef = useRef<number>(0)

  const validScenes = scenes.filter((s) => s.imageUrl)

  // Sync refs
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])
  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  // Load most recent project if none selected
  useEffect(() => {
    if (!currentProject) {
      const id = localStorage.getItem('autovid_last_project_id')
      if (id) loadProject(id)
    }
  }, [currentProject, loadProject])

  // Initialize durations when scenes change
  useEffect(() => {
    if (validScenes.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSceneDurations(
        validScenes.map((s) => (s.duration ? s.duration * 1000 : 5000))
      )
      setCurrentIndex(0)
      setProgress(0)
    }
  }, [scenes])

  // Stop everything
  const stopPlayback = useCallback(() => {
    if (sceneTimerRef.current) {
      window.clearInterval(sceneTimerRef.current)
      sceneTimerRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  // Play a specific scene (sets state, audio element is handled by effect below)
  const playScene = useCallback(
    (idx: number) => {
      if (idx >= validScenes.length) {
        setIsPlaying(false)
        stopPlayback()
        return
      }
      setIsPlaying(true)
      setCurrentIndex(idx)
      setProgress(0)
    },
    [validScenes.length, stopPlayback]
  )

  // Effect: whenever currentIndex or isPlaying changes, start the scene
  useEffect(() => {
    if (!isPlaying) return
    if (currentIndex >= validScenes.length) return

    const duration = validScenes[currentIndex].duration
      ? validScenes[currentIndex].duration! * 1000
      : 5000
    sceneDurationRef.current = duration
    startTimeRef.current = Date.now()

    // Play audio
    if (audioRef.current) {
      const audioUrl = validScenes[currentIndex].audioUrl
      if (audioUrl) {
        audioRef.current.src = audioUrl
        audioRef.current.muted = muted
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
    }

    // Progress timer
    if (sceneTimerRef.current) window.clearInterval(sceneTimerRef.current)
    sceneTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const pct = Math.min(1, elapsed / sceneDurationRef.current)
      setProgress(pct)
      if (pct >= 1) {
        if (sceneTimerRef.current) {
          window.clearInterval(sceneTimerRef.current)
          sceneTimerRef.current = null
        }
        // Advance to next scene
        const nextIdx = currentIndexRef.current + 1
        if (nextIdx < validScenes.length) {
          playScene(nextIdx)
        } else {
          setIsPlaying(false)
          setProgress(1)
        }
      }
    }, 50)

    return () => {
      if (sceneTimerRef.current) {
        window.clearInterval(sceneTimerRef.current)
        sceneTimerRef.current = null
      }
    }
  }, [currentIndex, isPlaying])

  // Mute toggle sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

  // Cleanup
  useEffect(() => {
    return () => stopPlayback()
  }, [stopPlayback])

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false)
      stopPlayback()
    } else {
      playScene(currentIndex)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      playScene(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < validScenes.length - 1) {
      playScene(currentIndex + 1)
    }
  }

  const handleRestart = () => {
    if (validScenes.length > 0) {
      playScene(0)
    }
  }

  const handleSeek = (idx: number) => {
    playScene(idx)
  }

  const handleDownload = () => {
    if (!currentProject || currentProject.status !== 'completed') return
    const a = document.createElement('a')
    a.href = `/generated/${currentProject.id}/final.mp4`
    a.download = `${currentProject.title || 'autovid'}.mp4`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  if (!currentProject || validScenes.length === 0) {
    return (
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
          <Film className="h-8 w-8 text-white/30" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">No video to play yet</h2>
        <p className="mb-6 max-w-md text-sm text-white/50">
          Generate a video first in the Builder tab, then come back here to preview it.
        </p>
        <button
          onClick={() => setView('builder')}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Go to Builder
        </button>
      </div>
    )
  }

  const currentScene = validScenes[currentIndex]
  const totalDuration = sceneDurations.reduce((a, b) => a + b, 0) / 1000
  const elapsedBefore = sceneDurations.slice(0, currentIndex).reduce((a, b) => a + b, 0)
  const currentSceneDuration = sceneDurations[currentIndex] || 5000
  const totalElapsedMs = elapsedBefore + progress * currentSceneDuration

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Player */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{currentProject.title}</h2>
              <p className="text-xs text-white/40">
                {validScenes.length} scenes · ~{Math.round(totalDuration)}s ·{' '}
                {currentProject.style}
              </p>
            </div>
            <button
              onClick={handleDownload}
              disabled={currentProject.status !== 'completed'}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.05]"
            >
              <Download className="h-3.5 w-3.5" />
              Download MP4
            </button>
          </div>

          {/* Video viewport */}
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-fuchsia-500/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {currentScene.imageUrl && (
                  <img
                    src={currentScene.imageUrl}
                    alt={currentScene.title}
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              </motion.div>
            </AnimatePresence>

            {/* Scene caption */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <motion.div
                key={`caption-${currentIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl"
              >
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-fuchsia-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-200 backdrop-blur">
                  Scene {currentIndex + 1} / {validScenes.length}
                </div>
                <h3 className="text-xl font-bold text-white drop-shadow-lg">
                  {currentScene.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-white/90 drop-shadow">
                  {currentScene.narration}
                </p>
              </motion.div>
            </div>

            {/* Top-right progress bar */}
            <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 backdrop-blur">
              <span className="text-[10px] font-mono text-white/70">
                {Math.floor(totalElapsedMs / 1000)}s / {Math.round(totalDuration)}s
              </span>
            </div>

            {/* Big play overlay when paused */}
            {!isPlaying && (
              <button
                onClick={handlePlayPause}
                className="group absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-2xl shadow-fuchsia-500/50 transition-transform group-hover:scale-110">
                  <Play className="ml-1 h-8 w-8 text-white" fill="white" />
                </div>
              </button>
            )}

            {/* Loading spinner if scene image not loaded */}
            {!currentScene.imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
            {/* Timeline */}
            <div className="mb-3 flex items-center gap-1">
              {validScenes.map((s, i) => (
                <button
                  key={s.index}
                  onClick={() => handleSeek(i)}
                  className={cn(
                    'group relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10',
                    i === currentIndex && 'bg-fuchsia-500/30'
                  )}
                >
                  {i < currentIndex && <div className="absolute inset-0 bg-emerald-500" />}
                  {i === currentIndex && (
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-fuchsia-500 to-pink-500"
                      style={{ width: `${progress * 100}%` }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
                >
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/30 transition-transform hover:scale-105"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" fill="white" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5" fill="white" />
                  )}
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === validScenes.length - 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRestart}
                  className="ml-2 flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10"
                  title="Restart"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/40">
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10"
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <span className="font-mono">
                  {String(Math.floor(totalElapsedMs / 60000)).padStart(2, '0')}:
                  {String(Math.floor((totalElapsedMs / 1000) % 60)).padStart(2, '0')} /{' '}
                  {String(Math.floor(totalDuration / 60)).padStart(2, '0')}:
                  {String(Math.floor(totalDuration % 60)).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scene list sidebar */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">Scenes</h3>
          <div className="autovid-scroll max-h-[600px] space-y-2 overflow-y-auto pr-2">
            {validScenes.map((s, i) => (
              <button
                key={s.index}
                onClick={() => handleSeek(i)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-all',
                  i === currentIndex
                    ? 'border-fuchsia-500/50 bg-fuchsia-500/10'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                )}
              >
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-black/40">
                  {s.imageUrl && (
                    <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-white">{s.title}</div>
                  <div className="truncate text-[10px] text-white/40">{s.narration}</div>
                </div>
                {i === currentIndex && isPlaying && (
                  <div className="flex items-end gap-0.5 pr-1">
                    {[0, 1, 2].map((bar) => (
                      <motion.div
                        key={bar}
                        className="w-0.5 rounded-full bg-fuchsia-400"
                        animate={{ height: [4, 12, 4] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: bar * 0.15
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
