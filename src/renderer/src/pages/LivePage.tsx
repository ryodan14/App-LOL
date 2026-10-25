import { Link } from 'react-router-dom'
import { MonitorPlay, RefreshCw, Swords } from 'lucide-react'
import { useAppStore } from '@renderer/store/useAppStore'
import { phaseLabel } from '@renderer/lib/phases'
import { Card } from '@renderer/components/ui/Card'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { Button } from '@renderer/components/ui/Button'

export function LivePage(): React.JSX.Element {
  const snapshot = useAppStore((state) => state.snapshot)
  const reconnect = useAppStore((state) => state.reconnect)

  if (snapshot.champSelect || snapshot.live) {
    return (
      <Card className="p-6">
        <p className="eyebrow">Partida detectada</p>
        <h2 className="font-display mt-1 text-xl font-semibold text-ink-100">
          {snapshot.live ? 'Partida en vivo' : 'Champ select'}
        </h2>
        <p className="mt-1 text-sm text-ink-400">
          El análisis completo de esta pantalla se está preparando.
        </p>
        <div className="mt-5">
          <Link to="/campeones">
            <Button variant="primary" icon={<Swords className="h-4 w-4" />}>
              Mientras tanto, explorá campeones
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <EmptyState
        icon={<MonitorPlay className="h-6 w-6" />}
        title="Todavía no hay una partida"
        description={`Abrí League of Legends y entrá a champ select o a una partida. Estado actual: ${phaseLabel(snapshot.phase)}.`}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="primary" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void reconnect()}>
              Buscar cliente
            </Button>
            <Link to="/ajustes">
              <Button variant="ghost">Configurar detección</Button>
            </Link>
          </div>
        }
      />
    </Card>
  )
}
