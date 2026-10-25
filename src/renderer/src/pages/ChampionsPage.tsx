import { Search, UsersRound } from 'lucide-react'
import { useAppStore } from '@renderer/store/useAppStore'
import { Card } from '@renderer/components/ui/Card'
import { EmptyState, Spinner } from '@renderer/components/ui/EmptyState'

export function ChampionsPage(): React.JSX.Element {
  const data = useAppStore((state) => state.data)

  return (
    <div className="space-y-5">
      <Card className="flex items-center gap-3 p-4">
        <Search className="h-4 w-4 text-ink-500" />
        <span className="text-sm text-ink-400">
          El explorador de campeones se está preparando…
        </span>
        {data.status === 'loading' && <Spinner className="ml-auto" />}
      </Card>
      <Card>
        <EmptyState
          icon={<UsersRound className="h-6 w-6" />}
          title="Campeones en camino"
          description="Acá vas a poder buscar cualquier campeón, ver su build, runas, habilidades y counters."
        />
      </Card>
    </div>
  )
}
