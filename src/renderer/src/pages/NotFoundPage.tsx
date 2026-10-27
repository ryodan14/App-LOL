import { Compass } from 'lucide-react'
import { Card } from '@renderer/components/ui/Card'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { ButtonLink } from '@renderer/components/ui/ButtonLink'
import { t } from '@shared/i18n'

export function NotFoundPage(): React.JSX.Element {
  return (
    <Card>
      <EmptyState
        icon={<Compass className="h-6 w-6" />}
        title={t('Página no encontrada')}
        description={t('La ruta que buscas no existe o fue movida.')}
        action={
          <ButtonLink to="/" variant="primary">
            {t('Volver al inicio')}
          </ButtonLink>
        }
      />
    </Card>
  )
}
