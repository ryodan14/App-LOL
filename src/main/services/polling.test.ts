import { describe, expect, it } from 'vitest'
import { liveProbeDelay, resolvePollDelay } from './polling'

describe('cadencia del snapshot', () => {
  it('mantiene el intervalo del usuario durante la partida', () => {
    expect(resolvePollDelay('InProgress', 2_000)).toBe(2_000)
    expect(resolvePollDelay('ChampSelect', 1_000)).toBe(1_000)
  })

  it('reduce la frecuencia cuando no hay partida activa', () => {
    expect(resolvePollDelay('Offline', 2_000)).toBe(4_000)
    expect(resolvePollDelay('Online', 500)).toBe(4_000)
  })

  it('aplica un backoff acotado a la sonda de la partida', () => {
    expect(liveProbeDelay(0)).toBe(0)
    expect(liveProbeDelay(1)).toBe(5_000)
    expect(liveProbeDelay(2)).toBe(10_000)
    expect(liveProbeDelay(10)).toBe(30_000)
  })
})
