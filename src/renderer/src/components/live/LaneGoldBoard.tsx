import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, Minus } from 'lucide-react'
import type { Champion, LiveGameState, LivePlayer, Role } from '@shared/types'
import { roleLabel } from '@shared/constants'
import {
  assignRoles,
  compareLaneGold,
  findChampionForLivePlayer,
  LANE_ROLES
} from '@shared/analysis'
import { useGameData, type GameDataIndex } from '@renderer/lib/gameData'
import { formatCompact, formatNumber } from '@renderer/lib/format'
import { cn } from '@renderer/lib/cn'
import { ChampionIcon } from '@renderer/components/lol/ChampionIcon'
import { RoleMark } from '@renderer/components/lol/RoleMark'
import { t } from '@shared/i18n'

function playerChampion(
  index: GameDataIndex,
  player: LivePlayer | undefined
): Champion | null {
  if (!player) return null
  return findChampionForLivePlayer(index, player.championId, player.championName)
}

function findActivePlayer(live: LiveGameState): LivePlayer | undefined {
  return (
    live.players.find((player) => player.riotId && player.riotId === live.activePlayerRiotId) ??
    live.players.find(
      (player) => player.championName && player.championName === live.activeChampionName
    )
  )
}

function LaneSide({
  player,
  champion,
  side,
  compact,
  gold
}: {
  player: LivePlayer | undefined
  champion: Champion | null
  side: 'ally' | 'enemy'
  compact?: boolean
  gold?: number
}): React.JSX.Element {
  const content = (
    <>
      {side === 'ally' && <ChampionIcon champion={champion} size="xs" />}
      <span className={cn('min-w-0', side === 'enemy' && 'text-right')}>
        <span className="block truncate text-[0.66rem] font-semibold text-ink-200">
          {champion?.name ?? player?.championName ?? '—'}
        </span>
        {!compact && player && (
          <span className="block text-[0.55rem] text-ink-500">
            {gold !== undefined && `${formatCompact(gold)} · `}
            {formatNumber(player.cs)} CS · {player.kills}/{player.deaths}/{player.assists}
          </span>
        )}
      </span>
      {side === 'enemy' && <ChampionIcon champion={champion} size="xs" />}
    </>
  )

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5',
        side === 'enemy' && 'justify-end'
      )}
    >
      {content}
    </div>
  )
}

export function LaneGoldBoard({
  live,
  gameTime = live.gameTime,
  compact = false
}: {
  live: LiveGameState
  gameTime?: number
  compact?: boolean
}): React.JSX.Element | null {
  const index = useGameData()

  const { allyByRole, enemyByRole, activeRole } = useMemo(() => {
    if (!index) {
      return {
        allyByRole: new Map<Role, LivePlayer>(),
        enemyByRole: new Map<Role, LivePlayer>(),
        activeRole: 'UNKNOWN' as Role
      }
    }
    const allies = live.players.filter((player) => player.team === live.activeTeam)
    const enemies = live.players.filter((player) => player.team !== live.activeTeam)
    const allyEntries = allies.map((player) => ({
      role: player.position,
      champion: playerChampion(index, player),
      data: player
    }))
    const enemyEntries = enemies.map((player) => ({
      role: player.position,
      champion: playerChampion(index, player),
      data: player
    }))
    const allyRoles = assignRoles(allyEntries, index)
    const enemyRoles = assignRoles(enemyEntries, index)
    const activePlayer = findActivePlayer(live)
    const role =
      (LANE_ROLES.find((lane) => allyRoles.get(lane) === activePlayer) as Role | undefined) ??
      'UNKNOWN'
    return { allyByRole: allyRoles, enemyByRole: enemyRoles, activeRole: role }
  }, [index, live])

  const totals = useMemo(() => {
    if (!index) return { ally: 0, enemy: 0 }
    let ally = 0
    let enemy = 0
    for (const role of LANE_ROLES) {
      const comparison = compareLaneGold(
        allyByRole.get(role),
        enemyByRole.get(role),
        gameTime,
        index
      )
      ally += comparison.allyGold
      enemy += comparison.enemyGold
    }
    return { ally, enemy }
  }, [index, gameTime, allyByRole, enemyByRole])

  if (!index) return null

  const totalDifference = totals.ally - totals.enemy
  const totalLabel =
    totalDifference > 0
      ? `+${formatCompact(totalDifference)}`
      : totalDifference < 0
        ? `-${formatCompact(Math.abs(totalDifference))}`
        : '—'

  return (
    <div className={cn('space-y-1.5', !compact && 'space-y-2')}>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-line/70 bg-base-950/25 px-2 py-1.5">
        <span className="text-[0.55rem] font-bold uppercase tracking-[0.13em] text-ink-600">
          {t('Oro total ≈')}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[0.66rem] font-semibold tabular-nums">
          <span className="text-sky-300">{formatCompact(totals.ally)}</span>
          <span className="text-ink-600">·</span>
          <span className="text-danger-400">{formatCompact(totals.enemy)}</span>
          <span
            className={cn(
              'ml-1 text-[0.6rem]',
              totalDifference > 0
                ? 'text-sky-400'
                : totalDifference < 0
                  ? 'text-danger-400'
                  : 'text-ink-600'
            )}
          >
            {totalLabel}
          </span>
        </span>
      </div>
      <div className="grid grid-cols-[20px_minmax(0,1fr)_60px_minmax(0,1fr)] items-center gap-1.5 px-1 text-[0.52rem] font-bold uppercase tracking-[0.12em] text-ink-600">
        <span />
        <span>{t('Tu equipo')}</span>
        <span className="text-center">{t('Oro ≈')}</span>
        <span className="text-right">{t('Rival')}</span>
      </div>

      {LANE_ROLES.map((role) => {
        const ally = allyByRole.get(role)
        const enemy = enemyByRole.get(role)
        const allyChampion = playerChampion(index, ally)
        const enemyChampion = playerChampion(index, enemy)
        const comparison = compareLaneGold(ally, enemy, gameTime, index)
        const isMine = role === activeRole
        const leader = comparison.leader
        const arrow =
          leader === 'ALLY' ? (
            <ArrowLeft className="h-4 w-4 text-sky-400" strokeWidth={2.4} />
          ) : leader === 'ENEMY' ? (
            <ArrowRight className="h-4 w-4 text-danger-400" strokeWidth={2.4} />
          ) : (
            <Minus className="h-3.5 w-3.5 text-ink-600" />
          )
        const diffLabel =
          leader === 'ALLY'
            ? `+${formatCompact(comparison.difference)}`
            : leader === 'ENEMY'
              ? `-${formatCompact(Math.abs(comparison.difference))}`
              : '—'

        return (
          <div
            key={role}
            className={cn(
              'grid grid-cols-[20px_minmax(0,1fr)_60px_minmax(0,1fr)] items-center gap-1.5 rounded-lg border px-1 py-1',
              isMine
                ? 'border-gold-400/25 bg-gold-400/[0.06]'
                : 'border-transparent bg-base-950/20'
            )}
          >
            <RoleMark role={role} className={cn('text-ink-500', isMine && 'text-gold-300')} />
            <LaneSide player={ally} champion={allyChampion} side="ally" compact={compact} gold={comparison.allyGold} />
            <div
              className="flex flex-col items-center leading-none"
              title={t('{role}: {ally} vs {enemy} de oro estimado', { role: roleLabel(role), ally: formatNumber(comparison.allyGold), enemy: formatNumber(comparison.enemyGold) })}
            >
              {arrow}
              <span
                className={cn(
                  'mt-0.5 text-[0.62rem] font-bold tabular-nums',
                  leader === 'ALLY'
                    ? 'text-sky-400'
                    : leader === 'ENEMY'
                      ? 'text-danger-400'
                      : 'text-ink-600'
                )}
              >
                {diffLabel}
              </span>
            </div>
            <LaneSide player={enemy} champion={enemyChampion} side="enemy" compact={compact} gold={comparison.enemyGold} />
          </div>
        )
      })}

      {!compact && (
        <p className="px-1 pt-1 text-[0.55rem] text-ink-600">
          {t('Azul = tu equipo adelante · Rojo = el rival adelante · Oro estimado con objetos, CS y KDA.')}
        </p>
      )}
    </div>
  )
}
