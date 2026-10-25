import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Card } from '@renderer/components/ui/Card'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { Button } from '@renderer/components/ui/Button'

export function NotFoundPage(): React.JSX.Element {
  return (
    <Card>
      <EmptyState
        icon={<Compass className="h-6 w-6" />}
        title="Página no encontrada"
        description="La ruta que buscás no existe o fue movida."
        action={
          <Link to="/">
            <Button variant="primary">Volver al inicio</Button>
          </Link>
        }
      />
    </Card>
  )
}
