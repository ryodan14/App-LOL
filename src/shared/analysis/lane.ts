import type { Champion, Role } from '../types'
import { t } from '../i18n'
import { analyzeChampion } from './champion'
import type {
  AnalysisIndex,
  CounterSuggestion,
  LaneCounterReport,
  RoleEntry
} from './types'

export const LANE_ROLES: Role[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']

const CURATED_COUNTERS: Record<string, string[]> = {
  Darius: ['Quinn', 'Vayne', 'Kennen', 'Teemo', 'Gwen'],
  Garen: ['Vayne', 'Quinn', 'Teemo', 'Gwen', 'Kayle'],
  Sett: ['Quinn', 'Vayne', 'Gwen', 'Poppy', 'Jax'],
  Fiora: ['Poppy', 'Malphite', 'Kayle', 'Quinn', 'Kennen'],
  Irelia: ['Poppy', 'Malphite', 'Warwick', 'Jax', 'Garen'],
  Riven: ['Poppy', 'Malphite', 'Renekton', 'Garen', 'Quinn'],
  Aatrox: ['Fiora', 'Camille', 'Irelia', 'Kled', 'Gwen'],
  Jax: ['Malphite', 'Poppy', 'Garen', 'Quinn', 'Kennen'],
  Malphite: ['Vayne', 'Gwen', 'Fiora', 'Camille', 'Kled'],
  Teemo: ['DrMundo', 'Malphite', 'Yorick', 'Aatrox', 'Quinn'],
  Yasuo: ['Renekton', 'Malphite', 'Pantheon', 'Annie', 'Garen'],
  Yone: ['Renekton', 'Pantheon', 'Malphite', 'Garen', 'Annie'],
  Zed: ['Malphite', 'Lissandra', 'Pantheon', 'Kayle', 'Galio'],
  Katarina: ['Kassadin', 'Galio', 'Pantheon', 'Malzahar', 'Lissandra'],
  Akali: ['Galio', 'Malzahar', 'Pantheon', 'Kassadin', 'Lissandra'],
  Leblanc: ['Kassadin', 'Galio', 'Malzahar', 'Lissandra', 'Pantheon'],
  Ahri: ['Kassadin', 'Galio', 'Malzahar', 'Yasuo', 'Zed'],
  Lux: ['Kassadin', 'Zed', 'Talon', 'Fizz', 'Yasuo'],
  Veigar: ['Kassadin', 'Zed', 'Talon', 'Fizz', 'Katarina'],
  Jinx: ['Draven', 'Caitlyn', 'Lucian', 'Tristana', 'Nilah'],
  Caitlyn: ['Draven', 'Sivir', 'Tristana', 'Ezreal', 'Nilah'],
  Draven: ['Caitlyn', 'Sivir', 'Nilah', 'Ashe', 'Jhin'],
  Samira: ['Caitlyn', 'Ashe', 'Jhin', 'Senna', 'Nilah'],
  Blitzcrank: ['Morgana', 'Sivir', 'Ezreal', 'Leona', 'Braum'],
  Thresh: ['Morgana', 'Leona', 'Nautilus', 'Braum', 'Janna'],
  Leona: ['Morgana', 'Janna', 'Lulu', 'Braum', 'Rakan'],
  Nautilus: ['Morgana', 'Janna', 'Lulu', 'Braum', 'Rakan'],
  Pyke: ['Morgana', 'Leona', 'Nautilus', 'Lulu', 'Rakan'],
  LeeSin: ['Poppy', 'Jax', 'Warwick', 'Trundle', 'Sejuani'],
  Viego: ['Poppy', 'Jax', 'Warwick', 'Trundle', 'Sejuani'],
  Khazix: ['Poppy', 'Jax', 'Warwick', 'Trundle', 'Sejuani']
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
}

export function findChampionByName(index: AnalysisIndex, value: string): Champion | null {
  const term = normalize(value)
  if (!term) return null
  return (
    index.data.champions.find(
      (champion) =>
        normalize(champion.id) === term ||
        normalize(champion.name) === term ||
        normalize(champion.key.toString()) === term
    ) ?? null
  )
}

export function findChampionForLivePlayer(
  index: AnalysisIndex,
  championId: string,
  championName: string
): Champion | null {
  return (
    index.championById.get(championId) ??
    findChampionByName(index, championName) ??
    findChampionByName(index, championId)
  )
}

export function findChampionForId(index: AnalysisIndex, championId: number): Champion | null {
  if (!championId || championId <= 0) return null
  return index.championByKey.get(championId) ?? null
}

export function fallbackRoles(champion: Champion): Role[] {
  const roles: Role[] = []
  if (champion.tags.includes('Support')) roles.push('UTILITY')
  if (champion.tags.includes('Marksman')) roles.push('BOTTOM')
  if (champion.tags.includes('Assassin') || champion.tags.includes('Mage')) roles.push('MIDDLE')
  if (champion.tags.includes('Tank') || champion.tags.includes('Fighter')) {
    roles.push('TOP', 'JUNGLE')
  }
  return roles.length > 0 ? roles : ['MIDDLE']
}

export function recommendedRoles(index: AnalysisIndex, champion: Champion): Role[] {
  return index.rolesByChampion.get(champion.key) ?? fallbackRoles(champion)
}

export function inferChampionRole(index: AnalysisIndex, champion: Champion): Role {
  return recommendedRoles(index, champion)[0] ?? 'UNKNOWN'
}

export function assignRoles<T>(
  entries: RoleEntry<T>[],
  index: AnalysisIndex
): Map<Role, T> {
  const assignments = new Map<Role, T>()
  const assigned = new Set<RoleEntry<T>>()

  for (const entry of entries) {
    if (entry.role !== 'UNKNOWN' && !assignments.has(entry.role)) {
      assignments.set(entry.role, entry.data)
      assigned.add(entry)
    }
  }

  const pending = entries
    .filter((entry) => !assigned.has(entry))
    .sort((a, b) => {
      const aRoles = a.champion ? recommendedRoles(index, a.champion).length : 5
      const bRoles = b.champion ? recommendedRoles(index, b.champion).length : 5
      return aRoles - bRoles
    })

  for (const entry of pending) {
    if (!entry.champion) continue
    const options = recommendedRoles(index, entry.champion)
    const role = options.find((candidate) => !assignments.has(candidate))
    if (role) {
      assignments.set(role, entry.data)
      assigned.add(entry)
    }
  }

  for (const entry of entries) {
    if (assigned.has(entry)) continue
    const role = LANE_ROLES.find((candidate) => !assignments.has(candidate))
    if (!role) break
    assignments.set(role, entry.data)
    assigned.add(entry)
  }

  return assignments
}

function addReason(reasons: string[], reason: string): void {
  if (!reasons.includes(reason)) reasons.push(reason)
}

function matchupScore(
  candidate: Champion,
  enemy: Champion,
  role: Role,
  index: AnalysisIndex
): { score: number; reasons: string[] } {
  const enemyProfile = analyzeChampion(enemy, role)
  const candidateProfile = analyzeChampion(candidate, role)
  const reasons: string[] = []
  let score = 0

  const candidateRoles = recommendedRoles(index, candidate)
  if (candidateRoles.includes(role)) score += 1.4

  const candidateRange = candidate.stats['attackrange'] ?? 0
  const enemyRange = enemy.stats['attackrange'] ?? 0
  const candidateRanged = candidateRange >= 350
  const enemyMelee = enemyRange > 0 && enemyRange < 350

  if (candidateRanged && enemyMelee) {
    score += 1.8
    addReason(reasons, t('Rango para kites y castigar su aproximación'))
  } else if (candidateRange > enemyRange + 100) {
    score += 0.8
    addReason(reasons, t('Tiene más rango en la línea'))
  }

  const has = (tag: string): boolean =>
    candidateProfile.threats.some((threat) => threat.tag === tag)

  if (enemyProfile.archetype === 'tank') {
    if (has('MAX_HP') || has('TRUE_DAMAGE')) {
      score += 3
      addReason(reasons, t('Tiene daño porcentual o verdadero para romper tanques'))
    }
    if (has('AUTO_ATTACK') && candidateProfile.archetype === 'marksman') {
      score += 1.2
      addReason(reasons, t('Daño sostenido para peleas largas'))
    }
    if (candidateProfile.archetype === 'tank') score -= 0.8
  }

  if (
    enemyProfile.archetype === 'ad-assassin' ||
    enemyProfile.archetype === 'ap-assassin' ||
    enemyProfile.threats.some((threat) => threat.tag === 'BURST')
  ) {
    if (candidateProfile.archetype === 'tank') {
      score += 2.4
      addReason(reasons, t('Aguanta su burst y puede cortar la entrada'))
    }
    if (has('HARD_CC')) {
      score += 1.7
      addReason(reasons, t('CC para frenar su combo'))
    }
    if (candidateProfile.archetype === 'marksman') score -= 0.8
  }

  if (enemyProfile.archetype === 'marksman') {
    if (
      candidateProfile.archetype === 'ad-assassin' ||
      candidateProfile.archetype === 'ap-assassin'
    ) {
      score += 2.2
      addReason(reasons, t('Burst y movilidad para cerrar sobre el tirador'))
    }
    if (has('HARD_CC') || has('SLOW')) {
      score += 1
      addReason(reasons, t('CC para castigarlo cuando se acerca'))
    }
  }

  if (enemyProfile.archetype === 'mage') {
    if (
      candidateProfile.archetype === 'ad-assassin' ||
      candidateProfile.archetype === 'ap-assassin'
    ) {
      score += 2.2
      addReason(reasons, t('Movilidad para esquivar sus habilidades y entrar'))
    }
    if (has('HARD_CC')) {
      score += 0.9
      addReason(reasons, t('Puede castigarlo si falla su combo'))
    }
  }

  if (enemyProfile.archetype === 'bruiser' || enemyProfile.archetype === 'ap-bruiser') {
    if (candidateRanged) {
      score += 1.2
      addReason(reasons, t('Rango y kite contra un cuerpo a cuerpo'))
    }
    if (has('HARD_CC') || has('SLOW')) {
      score += 0.8
      addReason(reasons, t('Herramientas para cortar su persecución'))
    }
  }

  if (enemyProfile.archetype === 'enchanter' || enemyProfile.archetype === 'support') {
    if (
      candidateProfile.archetype === 'ad-assassin' ||
      candidateProfile.archetype === 'ap-assassin' ||
      candidateProfile.archetype === 'support'
    ) {
      score += 1.4
      addReason(reasons, t('Presión o engage para forzar peleas cortas'))
    }
  }

  if (enemyProfile.threats.some((threat) => threat.tag === 'HEAL')) {
    if (has('BURST')) {
      score += 0.7
      addReason(reasons, t('Burst para matar antes de que se cure'))
    }
  }

  if (has('HARD_CC')) score += 0.4
  if (has('MOBILITY')) score += 0.25

  return { score, reasons }
}

export function suggestLaneCounters(
  enemy: Champion,
  role: Role,
  index: AnalysisIndex,
  excludeIds: string[] = []
): LaneCounterReport {
  const excluded = new Set([enemy.id, ...excludeIds])
  const curated = new Set(CURATED_COUNTERS[enemy.id] ?? [])
  const suggestions: CounterSuggestion[] = []

  for (const candidate of index.data.champions) {
    if (excluded.has(candidate.id)) continue
    const roles = recommendedRoles(index, candidate)
    if (!roles.includes(role)) continue

    const { score, reasons } = matchupScore(candidate, enemy, role, index)
    const isCurated = curated.has(candidate.id)
    if (isCurated) {
      addReason(reasons, t('Matchup históricamente favorable en esta línea'))
    }

    suggestions.push({
      champion: candidate,
      score: score + (isCurated ? 4 : 0),
      reasons: reasons.slice(0, 3),
      curated: isCurated
    })
  }

  suggestions.sort((a, b) => b.score - a.score || a.champion.name.localeCompare(b.champion.name))

  return {
    enemy,
    role,
    suggestions: suggestions.filter((entry) => entry.score > 0.5).slice(0, 6),
    note: t('Sugerencias por kit, rango y arquetipo. No son winrates en vivo.')
  }
}
