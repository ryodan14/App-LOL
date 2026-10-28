import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { t } from '@shared/i18n'
import { Button } from './Button'
import { Card } from './Card'

type Props = {
  children: ReactNode
  resetKey: string
}

type State = {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[renderer] Error no controlado', error, info.componentStack)
  }

  componentDidUpdate(previous: Props): void {
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <Card role="alert" className="mx-auto max-w-2xl p-6">
        <div className="flex items-start gap-3">
          <span className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-2 text-danger-400">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink-100">
              {t('Algo salió mal')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-400">
              {t('La página no se pudo cargar. Puedes reintentar o recargar la aplicación.')}
            </p>
            <p className="mt-3 break-words rounded-lg border border-line bg-base-950/50 px-3 py-2 font-mono text-[0.7rem] text-ink-500">
              {error.message}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => this.setState({ error: null })}>{t('Reintentar')}</Button>
              <Button variant="quiet" onClick={() => window.location.reload()}>
                {t('Recargar app')}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }
}
