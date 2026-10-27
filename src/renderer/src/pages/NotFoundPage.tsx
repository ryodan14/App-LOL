import { Compass } from 'lucide-react'
import { Card } from '@renderer/components/ui/Card'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { ButtonLink } from '@renderer/components/ui/ButtonLink'

export function NotFoundPage(): React.JSX.Element {
  return (
    <Card>
      <EmptyState
        icon={<Compass className="h-6 w-6" />}
        title="Página no encontrada"
        description="La ruta que buscas no existe o fue movida."
        action={
          <ButtonLink to="/" variant="primary">
            Volver al inicio
          </ButtonLink>
        }
      />
    </Card>
  )
}
