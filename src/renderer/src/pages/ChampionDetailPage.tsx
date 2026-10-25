import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useGameData } from '@renderer/lib/gameData'
import { Card } from '@renderer/components/ui/Card'
import { Button } from '@renderer/components/ui/Button'
import { ChampionIcon } from '@renderer/components/lol/ChampionIcon'

export function ChampionDetailPage(): React.JSX.Element {
  const { id } = useParams()
  const index = useGameData()
  const champion = id ? index?.championById.get(id) : null

  return (
    <div className="space-y-5">
      <Link to="/campeones">
        <Button variant="quiet" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
          Volver a campeones
        </Button>
      </Link>
      <Card className="p-6">
        {champion ? (
          <div className="flex items-center gap-4">
            <ChampionIcon champion={champion} size="xl" />
            <div>
              <p className="eyebrow">{champion.title}</p>
              <h2 className="font-display text-3xl font-semibold text-ink-100">{champion.name}</h2>
              <p className="mt-1 text-sm text-ink-400">
                Build, runas y counters en camino para este campeón.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-400">No encontramos ese campeón.</p>
        )}
      </Card>
    </div>
  )
}
