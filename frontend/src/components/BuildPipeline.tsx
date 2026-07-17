/** Build progress pipeline: maps the backend's numeric progress + status onto
 *  human stages (Queued → Building → Signing → Uploading → Completed/Failed). */
import { clsx } from 'clsx'
import { Check, X, Loader2 } from 'lucide-react'

const STAGES = ['Queued', 'Building', 'Signing', 'Uploading', 'Completed'] as const

export function stageFromProgress(status?: string, progress?: number): { stage: string; index: number } {
  if (status === 'failed') return { stage: 'Failed', index: -1 }
  if (status === 'success') return { stage: 'Completed', index: 4 }
  const p = progress ?? 0
  if (p < 10) return { stage: 'Queued', index: 0 }
  if (p < 70) return { stage: 'Building', index: 1 }
  if (p < 85) return { stage: 'Signing', index: 2 }
  if (p < 100) return { stage: 'Uploading', index: 3 }
  return { stage: 'Completed', index: 4 }
}

export default function BuildPipeline({ status, progress }: { status?: string; progress?: number }) {
  const { index } = stageFromProgress(status, progress)
  const failed = status === 'failed'
  const active = status === 'building' || status === 'pending' || status === 'running'

  return (
    <div className="w-full">
      <div className="flex items-center">
        {STAGES.map((label, i) => {
          const done = index > i || index === 4
          const current = index === i && active
          return (
            <div key={label} className={clsx('flex items-center', i < STAGES.length - 1 && 'flex-1')}>
              <div className="flex flex-col items-center gap-1">
                <span
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors',
                    failed && i === Math.max(index, 1)
                      ? 'bg-red-500 border-red-500 text-white'
                      : done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : current
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'bg-surface border-line text-soft',
                  )}
                >
                  {failed && i === Math.max(index, 1) ? <X className="w-3 h-3" /> : done ? <Check className="w-3 h-3" /> : current ? <Loader2 className="w-3 h-3 animate-spin" /> : i + 1}
                </span>
                <span className={clsx('text-[10px] font-medium whitespace-nowrap', done || current ? 'text-ink' : 'text-soft')}>{label}</span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={clsx('flex-1 h-0.5 mx-1 mb-4 rounded', index > i ? 'bg-emerald-400' : 'bg-line')} />
              )}
            </div>
          )
        })}
      </div>
      {active && typeof progress === 'number' && (
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all duration-700" style={{ width: `${Math.max(4, progress)}%` }} />
        </div>
      )}
      {failed && <p className="mt-2 text-xs font-medium text-red-600">Build failed — retry from the order page (failed builds never count against your quota).</p>}
    </div>
  )
}
