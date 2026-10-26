import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, Minus } from 'lucide-react'
import type { Champion, LiveGameState, LivePlayer, Role } from '@shared/types'
import { ROLE_LABELS } from '@shared/constants'
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
  compact
}: {
  player: LivePlayer | undefined
  champion: Champion | null
  side: 'ally' | 'enemy'
  compact?: boolean
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

  if (!index) return null

  return (
    <div className={cn('space-y-1.5', !compact && 'space-y-2')}>
      <div className="grid grid-cols-[20px_minmax(0,1fr)_60px_minmax(0,1fr)] items-center gap-1.5 px-1 text-[0.52rem] font-bold uppercase tracking-[0.12em] text-ink-600">
        <span />
        <span>Tu equipo</span>
        <span className="text-center">Oro ≈</span>
        <span className="text-right">Rival</span>
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
            <LaneSide player={ally} champion={allyChampion} side="ally" compact={compact} />
            <div
              className="flex flex-col items-center leading-none"
              title={`${ROLE_LABELS[role]}: ${formatNumber(comparison.allyGold)} vs ${formatNumber(comparison.enemyGold)} de oro estimado`}
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
            <LaneSide player={enemy} champion={enemyChampion} side="enemy" compact={compact} />
          </div>
        )
      })}

      {!compact && (
        <p className="px-1 pt-1 text-[0.55rem] text-ink-600">
          Azul = tu equipo adelante · Rojo = el rival adelante · Oro estimado con objetos, CS y KDA.
        </p>
      )}
    </div>
  )
}
