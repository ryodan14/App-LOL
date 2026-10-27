import { t } from '../i18n'
import type { LiveGameState } from '../types'
import type { ObjectiveTimer } from './types'

const DRAGON_RESPAWN = 300
const ELDER_RESPAWN = 360
const BARON_RESPAWN = 360
const INHIBITOR_RESPAWN = 300
const DRAGON_FIRST_SPAWN = 300
const BARON_FIRST_SPAWN = 1200

const LANE_FROM_CODE: Record<string, 'TOP' | 'MIDDLE' | 'BOTTOM'> = {
  L: 'TOP',
  M: 'MIDDLE',
  R: 'BOTTOM'
}

const LANE_LABEL: Record<'TOP' | 'MIDDLE' | 'BOTTOM', string> = {
  TOP: 'top',
  MIDDLE: 'mid',
  BOTTOM: 'bot'
}

function parseInhibitor(turret: string | undefined): {
  team: 'ORDER' | 'CHAOS'
  lane: 'TOP' | 'MIDDLE' | 'BOTTOM'
} | null {
  if (!turret) return null
  const match = turret.match(/Turret_T([12])_([LMR])_/i)
  if (!match) return null
  const lane = LANE_FROM_CODE[match[2].toUpperCase()]
  if (!lane) return null
  return {
    team: match[1] === '1' ? 'ORDER' : 'CHAOS',
    lane
  }
}

function teamLabel(team: 'ORDER' | 'CHAOS'): string {
  return t(team === 'ORDER' ? 'azul' : 'rojo')
}

export function computeObjectiveTimers(
  live: LiveGameState,
  currentGameTime = live.gameTime
): ObjectiveTimer[] {
  const now = Math.max(0, currentGameTime)
  const timers: ObjectiveTimer[] = []

  const dragonKills = live.events.filter((event) => event.name === 'DragonKill')
  const lastDragon = dragonKills.at(-1)
  const dragonDuration = lastDragon?.dragonType?.toLowerCase() === 'elder'
    ? ELDER_RESPAWN
    : DRAGON_RESPAWN
  const dragonAt = lastDragon ? lastDragon.time + dragonDuration : DRAGON_FIRST_SPAWN
  const dragonRemaining = dragonAt - now
  timers.push({
    id: 'dragon',
    kind: 'DRAGON',
    label: lastDragon?.dragonType ? t('Dragón {type}', { type: lastDragon.dragonType }) : t('Dragón'),
    shortLabel: t('Dragón'),
    respawnAt: dragonAt,
    remaining: Math.max(0, dragonRemaining),
    status: dragonRemaining > 0 ? 'countdown' : lastDragon ? 'ready' : 'active',
    dragonType: lastDragon?.dragonType
  })

  const baronKills = live.events.filter((event) => event.name === 'BaronKill')
  const lastBaron = baronKills.at(-1)
  const baronAt = lastBaron ? lastBaron.time + BARON_RESPAWN : BARON_FIRST_SPAWN
  const baronRemaining = baronAt - now
  timers.push({
    id: 'baron',
    kind: 'BARON',
    label: t('Barón'),
    shortLabel: t('Barón'),
    respawnAt: baronAt,
    remaining: Math.max(0, baronRemaining),
    status: baronRemaining > 0 ? 'countdown' : lastBaron ? 'ready' : 'active'
  })

  const inhibitorEvents = live.events.filter((event) => event.name === 'InhibKilled')
  const latest = new Map<string, { time: number; team: 'ORDER' | 'CHAOS'; lane: 'TOP' | 'MIDDLE' | 'BOTTOM' }>()
  for (const event of inhibitorEvents) {
    const parsed = parseInhibitor(event.turret)
    if (!parsed) continue
    const key = `${parsed.team}-${parsed.lane}`
    const previous = latest.get(key)
    if (!previous || event.time > previous.time) {
      latest.set(key, { time: event.time, ...parsed })
    }
  }

  for (const [key, value] of latest) {
    const respawnAt = value.time + INHIBITOR_RESPAWN
    const remaining = respawnAt - now
    if (remaining <= 0) continue
    const label = t('Inhibidor {lane} {team}', { lane: t(LANE_LABEL[value.lane]), team: teamLabel(value.team) })
    timers.push({
      id: `inhibitor-${key}`,
      kind: 'INHIBITOR',
      label,
      shortLabel: label.replace(t('Inhibidor ') + ' ', t('Inhib. ') + ' '),
      respawnAt,
      remaining,
      status: 'countdown',
      team: value.team,
      lane: value.lane
    })
  }

  return timers
}
