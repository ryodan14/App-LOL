export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}

export function retryDelayMs(attempt: number, baseMs = 400): number {
  return baseMs * 2 ** attempt + Math.floor(Math.random() * 120)
}
