import type { ClientPhase } from '@shared/types'

const ACTIVE_PHASES = new Set<ClientPhase>([
  'ChampSelect',
  'Matchmaking',
  'ReadyCheck',
  'InProgress',
  'Reconnect'
])

export function resolvePollDelay(phase: ClientPhase, baseMs: number): number {
  const base = Math.max(500, baseMs)
  if (ACTIVE_PHASES.has(phase)) return base
  return Math.max(4_000, base * 2)
}

export function liveProbeDelay(failures: number): number {
  if (failures <= 0) return 0
  return Math.min(30_000, 5_000 * 2 ** (failures - 1))
}
