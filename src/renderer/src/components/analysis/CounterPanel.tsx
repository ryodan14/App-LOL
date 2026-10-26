import { useMemo } from 'react'
import { AlertTriangle, Crosshair, Sparkles } from 'lucide-react'
import type { Champion, Role } from '@shared/types'
import { DAMAGE_LABELS, generateCounterTips, type AnalysisIndex } from '@shared/analysis'
import { ChampionIcon } from '@renderer/components/lol/ChampionIcon'
import { ItemIcon } from '@renderer/components/lol/ItemIcon'
import { Badge } from '@renderer/components/ui/Badge'
import { ThreatList } from './ThreatChip'
import { ROLE_LABELS } from '@shared/constants'

const PRIORITY_TONE = {
  ALTA: 'danger',
  MEDIA: 'gold',
  BAJA: 'neutral'
} as const

export function CounterPanel({
  enemy,
  index,
  myChampion,
  myRole
}: {
  enemy: Champion
  index: AnalysisIndex
  myChampion?: Champion
  myRole?: Role
}): React.JSX.Element {
  const { profile, tips } = useMemo(
    () => generateCounterTips(enemy, index, myChampion, myRole),
    [enemy, index, myChampion, myRole]
  )

  return (
    <div className="rounded-2xl border border-line bg-base-900/40 p-4">
      <div className="flex items-start gap-3">
        <ChampionIcon champion={enemy} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-display text-[0.98rem] font-semibold text-ink-100">{enemy.name}</h3>
            <Badge tone="gold">{profile.archetypeLabel}</Badge>
            <Badge>{DAMAGE_LABELS[profile.damageType]}</Badge>
          </div>
          <p className="mt-0.5 text-[0.68rem] text-ink-500">
            {enemy.title} · {myChampion ? `tu ${ROLE_LABELS[myRole ?? 'UNKNOWN'].toLowerCase()}` : 'análisis enemigo'}
          </p>
          <div className="mt-2">
            <ThreatList threats={profile.threats} limit={5} />
          </div>
        </div>
      </div>

      {profile.keySpells.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.keySpells.map((spell) => (
            <span
              key={spell.name}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-base-950/40 px-2 py-1 text-[0.64rem] text-ink-400"
              title={spell.reasons.join(' · ')}
            >
              <Sparkles className="h-3 w-3 text-gold-300/80" />
              {spell.name}
              <span className="text-ink-600">{spell.reasons.join('/')}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        {tips.slice(0, 4).map((tip) => (
          <div key={tip.id} className="rounded-xl border border-line/80 bg-base-950/30 p-2.5">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-ink-500">
                {tip.priority === 'ALTA' ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-danger-400" />
                ) : (
                  <Crosshair className="h-3.5 w-3.5 text-gold-300" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[0.74rem] font-semibold text-ink-200">{tip.title}</p>
                  <Badge tone={PRIORITY_TONE[tip.priority]}>{tip.priority}</Badge>
                </div>
                <p className="mt-0.5 text-[0.67rem] leading-relaxed text-ink-400">{tip.description}</p>
                {tip.items.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tip.items.map((item) => (
                      <span
                        key={item.id}
                        className="flex items-center gap-1.5 rounded-lg border border-line bg-base-900/60 py-0.5 pl-0.5 pr-2 text-[0.62rem] text-ink-400"
                      >
                        <ItemIcon item={item} size="sm" />
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
