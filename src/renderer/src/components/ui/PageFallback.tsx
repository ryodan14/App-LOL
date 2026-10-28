import { t } from '@shared/i18n'

export function PageFallback(): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label={t('Cargando…')}
      className="flex min-h-[40vh] items-center justify-center"
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-gold-300" />
    </div>
  )
}
