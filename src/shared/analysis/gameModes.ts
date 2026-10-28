export const MAP_SUMMONERS_RIFT = 11
export const MAP_ARAM = 12
export const MAP_ARENA = 30

const MODE_MAP: Record<string, number> = {
  CLASSIC: MAP_SUMMONERS_RIFT,
  ARAM: MAP_ARAM,
  CHERRY: MAP_ARENA,
  ARENA: MAP_ARENA
}

export function mapIdFromGameMode(mode: string | undefined, fallback = MAP_SUMMONERS_RIFT): number {
  return MODE_MAP[(mode ?? '').trim().toUpperCase()] ?? fallback
}

export function isArenaMap(mapId: number): boolean {
  return mapId === MAP_ARENA
}

export function mapLabelKey(mapId: number): string | null {
  if (mapId === MAP_ARAM) return 'ARAM'
  if (mapId === MAP_ARENA) return 'Arena'
  return null
}
