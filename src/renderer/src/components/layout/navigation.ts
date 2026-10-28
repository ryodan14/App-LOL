import { Home, Package, Settings, Swords, UserRound, UsersRound } from 'lucide-react'

export const navigation = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/partida', label: 'Partida', icon: Swords, end: false },
  { to: '/campeones', label: 'Campeones', icon: UsersRound, end: false },
  { to: '/objetos', label: 'Objetos', icon: Package, end: false },
  { to: '/cuenta', label: 'Mi cuenta', icon: UserRound, end: false },
  { to: '/ajustes', label: 'Ajustes', icon: Settings, end: false }
] as const
