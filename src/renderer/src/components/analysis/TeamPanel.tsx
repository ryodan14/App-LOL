import { Activity, Crosshair, Droplets, ShieldAlert } from 'lucide-react'
import { damageLabel, priorityLabel, threatLabel, type TeamAnalysis, type ThreatTag } from '@shared/analysis'
import { Badge } from '@renderer/components/ui/Badge'
import { ThreatChip } from './ThreatChip'
import { t } from '@shared/i18n'

const DAMAGE_COLORS: Record<string, string> = {
  AD: 'from-orange-500 to-amber-300',
  AP: 'from-violet-500 to-fuchsia-300',
  MIXED: 'from-sky-500 to-cyan-300',
  TRUE: 'from-rose-500 to-red-300'
}

function Score({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-xl border border-line bg-base-900/40 p-2.5">
      <div className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-base-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300"
            style={{ width: `${Math.min(100, value)}%` }}
          />
        </div>
        <span className="text-[0.65rem] tabular-nums text-ink-400">{value}</span>
      </div>
    </div>
  )
}

export function TeamPanel({ team }: { team: TeamAnalysis }): React.JSX.Element {
  const total = team.damage.AD + team.damage.AP + team.damage.MIXED + team.damage.TRUE
  const threatEntries = Object.entries(team.threatCounts)
    .filter((entry): entry is [ThreatTag, number] => typeof entry[1] === 'number')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">{t('Lectura de la composición')}</p>
        <h2 className="font-display mt-1 text-xl font-semibold text-ink-100">{t('Qué te van a hacer')}</h2>
        <p className="mt-1.5 text-[0.8rem] leading-relaxed text-ink-300">{team.summary}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(team.damage) as (keyof TeamAnalysis['damage'])[]).map((type) => {
          const value = team.damage[type]
          const percent = total > 0 ? (value / total) * 100 : 0
          return (
            <div key={type} className="rounded-xl border border-line bg-base-900/40 p-2.5">
              <div className="flex items-center justify-between text-[0.65rem]">
                <span className="font-semibold text-ink-300">{damageLabel(type)}</span>
                <span className="tabular-nums text-ink-500">{value}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-base-700">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${DAMAGE_COLORS[type]}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {threatEntries.length > 0 && (
        <div>
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
            {t('Amenazas')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {threatEntries.map(([tag, count]) => (
              <ThreatChip key={tag} tag={tag} severity={count >= 2 ? 3 : 2} reason={threatLabel(tag)} />
            ))}
          </div>
        </div>
      )}

      {team.needs.length > 0 && (
        <div>
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
            {t('Prioridades')}
          </p>
          <div className="space-y-1.5">
            {team.needs.slice(0, 5).map((need) => (
              <div key={need.id} className="flex items-start gap-2">
                <Badge tone={need.priority === 'ALTA' ? 'danger' : need.priority === 'MEDIA' ? 'gold' : 'neutral'}>
                  {priorityLabel(need.priority)}
                </Badge>
                <div className="min-w-0">
                  <p className="text-[0.72rem] font-semibold text-ink-200">{need.label}</p>
                  <p className="text-[0.66rem] leading-snug text-ink-500">{need.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Score label={t('CC')} value={team.ccScore} icon={<ShieldAlert className="h-3 w-3" />} />
        <Score label={t('Sustain')} value={team.sustainScore} icon={<Droplets className="h-3 w-3" />} />
        <Score label={t('Engage')} value={team.engageScore} icon={<Activity className="h-3 w-3" />} />
        <Score label={t('Poke')} value={team.pokeScore} icon={<Crosshair className="h-3 w-3" />} />
      </div>
    </div>
  )
}
