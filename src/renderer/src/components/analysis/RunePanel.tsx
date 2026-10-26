import type { RunePlan } from '@shared/analysis'
import type { RuneDef } from '@shared/types'
import { SpellIcon } from '@renderer/components/lol/SpellIcon'
import { RuneIcon } from '@renderer/components/lol/RuneIcon'
import { Badge } from '@renderer/components/ui/Badge'

function RuneRow({ runes }: { runes: RuneDef[] }): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {runes.map((rune, index) => (
        <div
          key={`${rune.id}-${index}`}
          className="flex items-center gap-2 rounded-xl border border-line bg-base-900/45 px-2 py-1.5"
        >
          <RuneIcon icon={rune.icon} name={rune.name} size="sm" />
          <span className="max-w-[10rem] truncate text-[0.7rem] font-medium text-ink-200">
            {rune.name}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RunePanel({ plan }: { plan: RunePlan | null }): React.JSX.Element {
  if (!plan) {
    return (
      <div className="rounded-xl border border-line bg-base-900/35 p-4 text-[0.78rem] text-ink-400">
        No hay una página de runas recomendada para este campeón y rol en este parche.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Runas oficiales</p>
        <h2 className="font-display mt-1 text-xl font-semibold text-ink-100">Página recomendada</h2>
        <p className="mt-1 text-[0.78rem] text-ink-400">
          Recomendación de Riot para {plan.recommendation.position.toLowerCase()} en Grieta del
          Invocador.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <RuneIcon icon={plan.primaryTree.icon} name={plan.primaryTree.name} size="sm" />
          <span className="text-[0.72rem] font-semibold text-gold-300">{plan.primaryTree.name}</span>
        </div>
        <RuneRow runes={plan.primaryRunes} />
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <RuneIcon icon={plan.secondaryTree.icon} name={plan.secondaryTree.name} size="sm" />
          <span className="text-[0.72rem] font-semibold text-teal-300">
            {plan.secondaryTree.name}
          </span>
        </div>
        <RuneRow runes={plan.secondaryRunes} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Fragmentos
          </p>
          <div className="flex flex-wrap gap-1.5">
            {plan.shards.map((shard, index) => (
              <RuneIcon
                key={`${shard.id}-${index}`}
                icon={shard.icon}
                name={shard.name}
                size="sm"
              />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Hechizos
          </p>
          <div className="flex flex-wrap gap-2">
            {plan.summonerSpells.map((spell) => (
              <div key={spell.id} className="flex items-center gap-2">
                <SpellIcon image={spell.image} name={spell.name} size="sm" />
                <span className="text-[0.7rem] text-ink-300">{spell.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {plan.primaryRunes.slice(0, 1).map((rune) => (
          <Badge key={rune.id} tone="gold">
            {rune.name}
          </Badge>
        ))}
        {plan.summonerSpells.map((spell) => (
          <Badge key={spell.id}>{spell.name}</Badge>
        ))}
      </div>
    </div>
  )
}
