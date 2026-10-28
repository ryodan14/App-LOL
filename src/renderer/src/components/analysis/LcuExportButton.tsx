import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Download, Loader2 } from 'lucide-react'
import type { LcuExportResult } from '@shared/types'
import { t } from '@shared/i18n'
import { cn } from '@renderer/lib/cn'

type ExportStatus = 'idle' | 'working' | 'done' | 'error'

export function LcuExportButton({
  idleLabel,
  doneLabel,
  onExport,
  disabled = false
}: {
  idleLabel: string
  doneLabel: string
  onExport: () => Promise<LcuExportResult>
  disabled?: boolean
}): React.JSX.Element {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status !== 'done' && status !== 'error') return
    const timer = window.setTimeout(() => {
      setStatus('idle')
      setMessage('')
    }, 5_000)
    return () => window.clearTimeout(timer)
  }, [status])

  async function exportNow(): Promise<void> {
    if (status === 'working' || disabled) return
    setStatus('working')
    setMessage('')
    try {
      const result = await onExport()
      setStatus(result.ok ? 'done' : 'error')
      setMessage(result.ok ? (result.message ?? '') : (result.error ?? t('No se pudo exportar')))
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : t('No se pudo exportar'))
    }
  }

  const label =
    status === 'working'
      ? t('Exportando…')
      : status === 'done'
        ? doneLabel
        : status === 'error'
          ? t('No se pudo exportar')
          : idleLabel

  return (
    <div className="flex max-w-[15rem] flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void exportNow()}
        disabled={disabled || status === 'working'}
        title={message || label}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.64rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55',
          status === 'done'
            ? 'border-teal-400/30 bg-teal-400/10 text-teal-200'
            : status === 'error'
              ? 'border-danger-400/30 bg-danger-400/10 text-danger-400'
              : 'border-gold-400/30 bg-gold-400/10 text-gold-200 hover:border-gold-400/50'
        )}
      >
        {status === 'working' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : status === 'done' ? (
          <Check className="h-3.5 w-3.5" />
        ) : status === 'error' ? (
          <AlertTriangle className="h-3.5 w-3.5" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {label}
      </button>
      {status === 'error' && message && (
        <p className="text-right text-[0.6rem] leading-snug text-danger-400/90">{message}</p>
      )}
    </div>
  )
}
