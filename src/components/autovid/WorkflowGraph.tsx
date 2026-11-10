'use client'

import { useAutovid } from '@/store/autovid'
import type { WorkflowNode, NodeStatus } from '@/lib/types'
import { PenLine, Layers, ImageIcon, Mic, Film, Check, Loader2, AlertCircle, Circle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const ICONS: Record<string, any> = {
  pen: PenLine,
  layers: Layers,
  image: ImageIcon,
  mic: Mic,
  film: Film
}

const STATUS_COLORS: Record<NodeStatus, { ring: string; bg: string; text: string; dot: string }> = {
  idle: {
    ring: 'border-white/10',
    bg: 'bg-white/[0.02]',
    text: 'text-white/40',
    dot: 'bg-white/20'
  },
  processing: {
    ring: 'border-fuchsia-500/50',
    bg: 'bg-fuchsia-500/10',
    text: 'text-fuchsia-300',
    dot: 'bg-fuchsia-400'
  },
  done: {
    ring: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400'
  },
  error: {
    ring: 'border-rose-500/50',
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    dot: 'bg-rose-400'
  }
}

function NodeCard({ node, isLast }: { node: WorkflowNode; isLast: boolean }) {
  const Icon = ICONS[node.icon] || Circle
  const colors = STATUS_COLORS[node.status]
  const isProcessing = node.status === 'processing'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative flex w-full max-w-[280px] items-center gap-3 rounded-2xl border bg-gradient-to-br from-white/[0.04] to-transparent p-4 backdrop-blur transition-all',
        colors.ring,
        colors.bg,
        isProcessing && 'shadow-lg shadow-fuchsia-500/20'
      )}
    >
      {/* Status indicator icon */}
      <div
        className={cn(
          'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
          colors.ring,
          colors.bg
        )}
      >
        <AnimatePresence mode="wait">
          {node.status === 'done' ? (
            <motion.div
              key="done"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check className="h-5 w-5 text-emerald-400" />
            </motion.div>
          ) : node.status === 'processing' ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="h-5 w-5 animate-spin text-fuchsia-400" />
            </motion.div>
          ) : node.status === 'error' ? (
            <motion.div
              key="error"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <AlertCircle className="h-5 w-5 text-rose-400" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Icon className={cn('h-5 w-5', colors.text)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsing ring when processing */}
        {isProcessing && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-fuchsia-500"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">
            Node {node.id}
          </span>
          <span className={cn('h-1 w-1 rounded-full', colors.dot)} />
        </div>
        <h4 className="truncate text-sm font-semibold text-white">{node.label}</h4>
        <p className="truncate text-xs text-white/40">{node.description}</p>
        {node.detail && <p className="mt-1 truncate text-xs text-fuchsia-300">{node.detail}</p>}
      </div>

      {/* Connector line */}
      {!isLast && (
        <div className="absolute -bottom-[28px] left-1/2 z-0 h-[28px] w-px -translate-x-1/2">
          <div className="relative h-full w-full bg-white/10">
            {node.status === 'done' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-emerald-500 to-fuchsia-500"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.4 }}
                style={{ transformOrigin: 'top' }}
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
        </div>
      )}
    </motion.div>
  )
}

export function WorkflowGraph() {
  const { nodes } = useAutovid()

  return (
    <div className="relative flex flex-col items-center gap-7 py-4">
      {nodes.map((n, i) => (
        <NodeCard key={n.id} node={n} isLast={i === nodes.length - 1} />
      ))}
    </div>
  )
}
