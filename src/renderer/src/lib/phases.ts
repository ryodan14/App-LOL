import type { ClientPhase, Snapshot } from '@shared/types'

export function phaseLabel(phase: ClientPhase): string {
  const labels: Record<ClientPhase, string> = {
    Offline: 'Sin cliente',
    Online: 'Cliente conectado',
    Lobby: 'En lobby',
    Matchmaking: 'Buscando partida',
    ReadyCheck: 'Partida encontrada',
    ChampSelect: 'Selección de campeones',
    InProgress: 'En partida',
    Reconnect: 'Reconectando',
    EndOfGame: 'Fin de partida',
    Unknown: 'Cliente conectado'
  }
  return labels[phase]
}

export function phaseTone(phase: ClientPhase): 'online' | 'idle' | 'busy' | 'error' {
  switch (phase) {
    case 'InProgress':
      return 'online'
    case 'ChampSelect':
    case 'ReadyCheck':
      return 'busy'
    case 'Matchmaking':
      return 'busy'
    case 'Reconnect':
      return 'error'
    default:
      return 'idle'
  }
}

export function isInGame(snapshot: Snapshot): boolean {
  return Boolean(snapshot.live)
}

export function isChampSelect(snapshot: Snapshot): boolean {
  return Boolean(snapshot.champSelect)
}
