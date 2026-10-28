import { describe, expect, it } from 'vitest'
import { isRetryableStatus, retryDelayMs } from './retry'

describe('reintentos HTTP', () => {
  it('solo reintenta errores temporales', () => {
    expect(isRetryableStatus(429)).toBe(true)
    expect(isRetryableStatus(500)).toBe(true)
    expect(isRetryableStatus(503)).toBe(true)
    expect(isRetryableStatus(400)).toBe(false)
    expect(isRetryableStatus(401)).toBe(false)
    expect(isRetryableStatus(404)).toBe(false)
  })

  it('aplica un backoff exponencial acotado por intento', () => {
    expect(retryDelayMs(0)).toBeGreaterThanOrEqual(400)
    expect(retryDelayMs(1)).toBeGreaterThanOrEqual(800)
    expect(retryDelayMs(2)).toBeGreaterThanOrEqual(1_600)
  })
})
