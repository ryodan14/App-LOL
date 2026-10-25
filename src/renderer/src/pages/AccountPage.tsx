import { UserRound, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@renderer/store/useAppStore'
import { Card } from '@renderer/components/ui/Card'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { Button } from '@renderer/components/ui/Button'

export function AccountPage(): React.JSX.Element {
  const snapshot = useAppStore((state) => state.snapshot)

  if (!snapshot.lcuConnected) {
    return (
      <Card>
        <EmptyState
          icon={<WifiOff className="h-6 w-6" />}
          title="Tu cuenta aparece cuando abrís el cliente"
          description="Detectamos tu invocador, rango y maestría directamente desde el cliente de League of Legends, sin pedirte la contraseña."
          action={
            <Link to="/ajustes">
              <Button variant="ghost">Revisar detección del cliente</Button>
            </Link>
          }
        />
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-base-800 text-gold-300">
          <UserRound className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-100">{snapshot.summoner?.displayName}</h2>
          <p className="text-[0.75rem] text-ink-500">Nivel {snapshot.summoner?.summonerLevel}</p>
        </div>
      </div>
      <p className="mt-5 text-sm text-ink-400">
        El resumen de rango y maestría se está preparando.
      </p>
    </Card>
  )
}
