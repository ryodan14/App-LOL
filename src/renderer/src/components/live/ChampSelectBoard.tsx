import { useMemo } from 'react'
import { Ban, Bot, Crosshair, Hourglass } from 'lucide-react'
import type { ChampSelectSlot, ChampSelectState, Champion, Role } from '@shared/types'
import { roleLabel } from '@shared/constants'
import {
  analyzeChampion,
  assignRoles,
  findChampionForId,
  inferChampionRole,
  suggestBanTargets,
  suggestLaneCounters
} from '@shared/analysis'
import { useGameData, type GameDataIndex } from '@renderer/lib/gameData'
import { ChampionIcon } from '@renderer/components/lol/ChampionIcon'
import { RoleMark } from '@renderer/components/lol/RoleMark'
import { Badge } from '@renderer/components/ui/Badge'
import { cn } from '@renderer/lib/cn'
import { t } from '@shared/i18n'

function slotChampion(index: GameDataIndex, slot: ChampSelectSlot | undefined) {
  if (!slot) return null
  return findChampionForId(index, slot.championId || slot.pickIntentId)
}

function mySlot(state: ChampSelectState): ChampSelectSlot | undefined {
  return state.myTeam.find((slot) => slot.cellId === state.localCellId)
}

export function ChampSelectBoard({
  champSelect,
  compact = false
}: {
  champSelect: ChampSelectState
  compact?: boolean
}): React.JSX.Element | null {
  const index = useGameData()

  const model = useMemo(() => {
    if (!index) return null
    const local = mySlot(champSelect)
    const myChampion =
      findChampionForId(index, champSelect.localPlayerChampionId) ??
      slotChampion(index, local)
    const myRole: Role =
      local && local.assignedPosition !== 'UNKNOWN'
        ? local.assignedPosition
        : myChampion
          ? inferChampionRole(index, myChampion)
          : 'UNKNOWN'

    const enemyEntries = champSelect.theirTeam.map((slot) => ({
      role: slot.assignedPosition,
      champion: slotChampion(index, slot),
      data: slot
    }))
    const enemyByRole = assignRoles(enemyEntries, index)
    const opponentSlot = myRole !== 'UNKNOWN' ? enemyByRole.get(myRole) : undefined
    const opponentChampion = slotChampion(index, opponentSlot)
    const opponentInferred = Boolean(opponentSlot && opponentSlot.assignedPosition === 'UNKNOWN')
    const report =
      opponentChampion && myRole !== 'UNKNOWN'
        ? suggestLaneCounters(
            opponentChampion,
            myRole,
            index,
            myChampion ? [myChampion.id] : []
          )
        : null
    const enemyPicks = champSelect.theirTeam
      .map((slot) => slotChampion(index, slot))
      .filter((champion): champion is Champion => Boolean(champion))
    const knownPicks = [...champSelect.myTeam, ...champSelect.theirTeam]
      .map((slot) => slotChampion(index, slot))
      .filter((champion): champion is Champion => Boolean(champion))
    const banned = champSelect.bans
      .map((championId) => findChampionForId(index, championId))
      .filter((champion): champion is Champion => Boolean(champion))
    const banReport =
      myChampion && myRole !== 'UNKNOWN'
        ? suggestBanTargets(
            myChampion,
            myRole,
            index,
            [...knownPicks, ...banned].map((champion) => champion.id)
          )
        : null

    return {
      myChampion,
      myRole,
      opponentSlot,
      opponentChampion,
      opponentInferred,
      opponentProfile: opponentChampion ? analyzeChampion(opponentChampion, myRole) : null,
      report,
      banReport,
      enemyPicks
    }
  }, [champSelect, index])

  if (!index || !model) return null

  const count = compact ? 3 : 5

  return (
    <div className={cn('space-y-2.5', !compact && 'space-y-4')}>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-line/70 bg-base-950/25 px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink-600">
            {t('Tu pick')}
          </span>
          {model.myChampion ? (
            <>
              <ChampionIcon champion={model.myChampion} size="xs" />
              <span className="truncate text-[0.7rem] font-semibold text-ink-100">
                {model.myChampion.name}
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-[0.68rem] text-ink-500">
              <Hourglass className="h-3 w-3" /> {t('Esperando campeón')}
            </span>
          )}
        </div>
        <Badge tone={model.myRole === 'UNKNOWN' ? 'neutral' : 'gold'}>
          {roleLabel(model.myRole)}
        </Badge>
      </div>

      {model.banReport && model.banReport.suggestions.length > 0 && (
        <div className="rounded-xl border border-danger-500/20 bg-danger-500/[0.04] p-2.5">
          <div className="flex items-center gap-1.5 px-0.5">
            <Ban className="h-3 w-3 text-danger-400" />
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.13em] text-danger-400">
              {t('Baneos recomendados')}
            </p>
          </div>
          <div className="mt-2 space-y-1.5">
            {model.banReport.suggestions.slice(0, compact ? 2 : 3).map((suggestion) => (
              <div
                key={suggestion.champion.id}
                className="flex items-start gap-2 rounded-lg border border-line/70 bg-base-950/30 px-2 py-1.5"
              >
                <ChampionIcon champion={suggestion.champion} size="xs" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[0.68rem] font-semibold text-ink-200">
                      {suggestion.champion.name}
                    </p>
                    {suggestion.curated && (
                      <span className="text-[0.5rem] font-bold uppercase tracking-[0.1em] text-danger-400/80">
                        {t('counter')}
                      </span>
                    )}
                  </div>
                  {!compact && (
                    <p className="mt-0.5 text-[0.6rem] leading-snug text-ink-500">
                      {suggestion.reasons[0] ?? t('Castiga tu pick en esta línea.')}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {!compact && (
              <p className="px-0.5 pt-0.5 text-[0.56rem] text-ink-600">{model.banReport.note}</p>
            )}
          </div>
        </div>
      )}

      {model.opponentChampion ? (
        <div className="rounded-xl border border-gold-400/20 bg-gold-400/[0.04] p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <ChampionIcon champion={model.opponentChampion} size="sm" />
              <div className="min-w-0">
                <p className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-gold-300/80">
                  {t('Rival de línea')}{model.opponentInferred ? ' ' + t('(probable)') : ''}
                </p>
                <p className="truncate text-[0.82rem] font-semibold text-ink-100">
                  {model.opponentChampion.name}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <RoleMark role={model.myRole} showLabel className="text-ink-400" />
              {model.opponentProfile && (
                <span className="text-[0.58rem] text-ink-500">
                  {model.opponentProfile.archetypeLabel}
                </span>
              )}
            </div>
          </div>

          {model.report && model.report.suggestions.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5 px-0.5">
                <Crosshair className="h-3 w-3 text-teal-300" />
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.13em] text-teal-300">
                  {t('Counters sugeridos')}
                </p>
              </div>
              {model.report.suggestions.slice(0, count).map((suggestion) => (
                <div
                  key={suggestion.champion.id}
                  className="flex items-start gap-2 rounded-lg border border-line/70 bg-base-950/30 px-2 py-1.5"
                >
                  <ChampionIcon champion={suggestion.champion} size="xs" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[0.68rem] font-semibold text-ink-200">
                        {suggestion.champion.name}
                      </p>
                      {suggestion.curated && (
                        <span className="text-[0.5rem] font-bold uppercase tracking-[0.1em] text-gold-300/70">
                          {t('matchup')}
                        </span>
                      )}
                    </div>
                    {!compact && (
                      <p className="mt-0.5 text-[0.6rem] leading-snug text-ink-500">
                        {suggestion.reasons[0] ?? t('Herramientas favorables contra su kit.')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {!compact && (
                <p className="px-0.5 pt-0.5 text-[0.56rem] text-ink-600">
                  {model.report.note}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-line/70 bg-base-950/25 p-3">
          <p className="text-[0.68rem] font-medium text-ink-300">
            {model.myRole === 'UNKNOWN'
              ? t('Elige tu campeón para detectar tu línea.')
              : t('Esperando el pick rival en {role}.', { role: roleLabel(model.myRole).toLowerCase() })}
          </p>
          {model.enemyPicks.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {model.enemyPicks.map((champion) => (
                <span
                  key={champion.id}
                  className="inline-flex items-center gap-1 rounded-md border border-line bg-base-900/40 py-0.5 pl-0.5 pr-1.5 text-[0.58rem] text-ink-400"
                >
                  <ChampionIcon champion={champion} size="xs" />
                  {champion.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {model.myChampion && model.enemyPicks.length > 0 && !compact && (
        <div className="flex items-start gap-1.5 text-[0.58rem] leading-snug text-ink-600">
          <Bot className="mt-0.5 h-3 w-3 shrink-0" />
          {t('Los counters se recalculan cuando cambia el pick rival. Si el rival todavía no está revelado, los sugerimos cuando aparezca.')}
        </div>
      )}
    </div>
  )
}
