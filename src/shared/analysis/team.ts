import type { Champion } from '../types'
import { t } from '../i18n'
import { analyzeChampion } from './champion'
import type {
  CounterNeed,
  DamageType,
  Priority,
  TeamAnalysis,
  ThreatProfile,
  ThreatTag
} from './types'

const PRIORITY_ORDER: Record<Priority, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 }

const DAMAGE_ADJECTIVE: Record<DamageType, string> = {
  AD: 'física',
  AP: 'mágica',
  MIXED: 'mixta',
  TRUE: 'verdadera'
}

function countTag(profiles: ThreatProfile[], tag: ThreatTag): number {
  return profiles.reduce(
    (total, profile) => total + profile.threats.filter((threat) => threat.tag === tag).length,
    0
  )
}

function priorityFor(value: number, high: number, medium: number): Priority {
  if (value >= high) return 'ALTA'
  if (value >= medium) return 'MEDIA'
  return 'BAJA'
}

export function analyzeTeam(enemies: Champion[]): TeamAnalysis {
  const profiles = enemies.map((champion) => analyzeChampion(champion))
  const damage = { AD: 0, AP: 0, MIXED: 0, TRUE: 0 }
  for (const profile of profiles) damage[profile.damageType] += 1

  const threatCounts: Partial<Record<ThreatTag, number>> = {}
  for (const profile of profiles) {
    for (const threat of profile.threats) {
      threatCounts[threat.tag] = (threatCounts[threat.tag] ?? 0) + 1
    }
  }

  const heal = countTag(profiles, 'HEAL')
  const shield = countTag(profiles, 'SHIELD')
  const hardCc = countTag(profiles, 'HARD_CC')
  const tank = countTag(profiles, 'TANK')
  const maxHp = countTag(profiles, 'MAX_HP')
  const burst = countTag(profiles, 'BURST')
  const autoAttack = countTag(profiles, 'AUTO_ATTACK')
  const stealth = countTag(profiles, 'STEALTH')
  const poke = countTag(profiles, 'POKE')
  const execute = countTag(profiles, 'EXECUTE')
  const slow = countTag(profiles, 'SLOW')

  const weightedAd = damage.AD + damage.MIXED * 0.5
  const weightedAp = damage.AP + damage.MIXED * 0.5
  let primaryDamage: DamageType = 'MIXED'
  if (damage.TRUE > weightedAd && damage.TRUE > weightedAp) primaryDamage = 'TRUE'
  else if (weightedAd > weightedAp + 0.5) primaryDamage = 'AD'
  else if (weightedAp > weightedAd + 0.5) primaryDamage = 'AP'

  const needs: CounterNeed[] = []
  const addNeed = (need: CounterNeed): void => {
    needs.push(need)
  }

  if (heal > 0) {
    addNeed({
      id: 'antiheal',
      label: t('Anti-curación'),
      description:
        heal >= 2
          ? t('Varios campeones enemigos se curan. Compra anti-curación temprano.')
          : t('El enemigo tiene curación o robo de vida. Suma anti-curación antes de las peleas largas.'),
      priority: priorityFor(heal, 2, 1),
      itemIds: [3165, 6609, 3033, 3075, 3011]
    })
  }

  if (shield > 0) {
    addNeed({
      id: 'antishield',
      label: t('Anti-escudos'),
      description: shield >= 2
        ? t('Hay varios escudos en el equipo enemigo. Rómpelos antes de comprometerte.')
        : t('El enemigo puede absorber daño con escudos. Considera rompe-escudos.'),
      priority: priorityFor(shield, 2, 1),
      itemIds: [6695, 4645]
    })
  }

  if (weightedAd >= 2 || damage.AD > damage.AP) {
    addNeed({
      id: 'armor',
      label: t('Armadura'),
      description:
        weightedAd >= 3
          ? t('La composición enemiga es mayoritariamente física. La armadura es prioridad.')
          : t('El enemigo tiene daño físico relevante. Suma armadura a tu build.'),
      priority: priorityFor(weightedAd, 3, 2),
      itemIds: [3075, 3143, 3110, 3742]
    })
  }

  if (weightedAp >= 2 || damage.AP > damage.AD) {
    addNeed({
      id: 'mr',
      label: t('Resistencia mágica'),
      description:
        weightedAp >= 3
          ? t('La composición enemiga es mayoritariamente mágica. La RM es prioridad.')
          : t('El enemigo tiene daño mágico relevante. Suma resistencia mágica.'),
      priority: priorityFor(weightedAp, 3, 2),
      itemIds: [3065, 2504, 4401, 3091, 3156]
    })
  }

  if (tank >= 2 || maxHp > 0) {
    addNeed({
      id: 'antitank',
      label: t('Daño porcentual'),
      description:
        tank >= 2
          ? t('Hay varios tanques enemigos. Necesitas penetración y daño porcentual.')
          : t('El enemigo castiga objetivos con mucha vida. El daño porcentual ayuda.'),
      priority: priorityFor(tank, 2, 1),
      itemIds: [3036, 3135, 3153, 6653]
    })
  }

  if (hardCc >= 2) {
    addNeed({
      id: 'tenacity',
      label: t('Tenacidad'),
      description:
        hardCc >= 3
          ? t('Mucho CC enemigo. La tenacidad y un cleanup son casi obligatorios.')
          : t('El CC enemigo puede encadenarte. Considera tenacidad o limpieza de CC.'),
      priority: priorityFor(hardCc, 3, 2),
      itemIds: [3111, 3140, 6035, 3091]
    })
  }

  if (autoAttack >= 2) {
    addNeed({
      id: 'antiauto',
      label: t('Contra ataques básicos'),
      description: t('Varios enemigos dependen de ataques básicos. Randuin o Frozen Heart reducen su daño.'),
      priority: priorityFor(autoAttack, 2, 1),
      itemIds: [3143, 3110, 3075]
    })
  }

  if (stealth > 0) {
    addNeed({
      id: 'antistealth',
      label: t('Control de visión'),
      description: t('El enemigo puede invisibilizarse. Wardea y lleva control de visión.'),
      priority: 'MEDIA',
      itemIds: [3364, 2056]
    })
  }

  if (poke >= 2) {
    addNeed({
      id: 'antipoke',
      label: t('Sustain contra poke'),
      description: t('El enemigo hace daño desde lejos. Prioriza sustain y peleas cortas.'),
      priority: priorityFor(poke, 2, 1),
      itemIds: [1054, 3065, 3107, 3222]
    })
  }

  if (burst >= 2) {
    addNeed({
      id: 'antiburts',
      label: t('Defensa contra burst'),
      description: t('Hay varias amenazas de burst. Un objeto defensivo puede salvarte la pelea.'),
      priority: priorityFor(burst, 2, 1),
      itemIds: [3157, 3026, 3156, 3102, 3053]
    })
  }

  if (execute > 0) {
    addNeed({
      id: 'antiexecute',
      label: t('Contra ejecución'),
      description: t('El enemigo remata objetivos con poca vida. No te quedes bajo y usa escudos.'),
      priority: 'MEDIA',
      itemIds: [3157, 3026, 3053]
    })
  }

  if (slow > 1) {
    addNeed({
      id: 'antislow',
      label: t('Contra ralentizaciones'),
      description: t('El enemigo encadena ralentizaciones. La tenacidad y movilidad ayudan.'),
      priority: 'BAJA',
      itemIds: [3111, 3009, 3091]
    })
  }

  needs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  const tanks = profiles.filter((profile) => profile.threats.some((threat) => threat.tag === 'TANK')).length
  const assassins = profiles.filter((profile) => profile.archetype.includes('assassin')).length
  const ccScore = Math.min(100, hardCc * 18 + slow * 8)
  const sustainScore = Math.min(100, heal * 35 + shield * 15)
  const engageScore = Math.min(100, hardCc * 15 + tanks * 15 + assassins * 5)
  const pokeScore = Math.min(100, poke * 20)

  const priorityNeeds = needs
    .filter((need) => need.priority !== 'BAJA')
    .map((need) => need.label)
    .slice(0, 3)

  const summaryParts = [
    t('Composición {damage} con {count} campeones.', { damage: t(DAMAGE_ADJECTIVE[primaryDamage]), count: enemies.length })
  ]
  if (tanks > 0) summaryParts.push(`${tanks} ${tanks === 1 ? t('tanque') : t('tanques')}.`)
  if (assassins > 0) summaryParts.push(`${assassins} ${assassins === 1 ? t('asesino') : t('asesinos')}.`)
  if (priorityNeeds.length > 0) {
    summaryParts.push(t('Prioriza {needs}.', { needs: priorityNeeds.join(', ').toLocaleLowerCase() }))
  } else {
    summaryParts.push(t('Sin amenazas críticas detectadas: build estándar.'))
  }

  return {
    profiles,
    damage,
    primaryDamage,
    threatCounts,
    needs,
    tanks,
    assassins,
    ccScore,
    sustainScore,
    engageScore,
    pokeScore,
    summary: summaryParts.join(' ')
  }
}
