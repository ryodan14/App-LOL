import type { Champion, Item, Role } from '../types'
import { analyzeChampion, classifyArchetype } from './champion'
import { NEED_ITEM_IDS } from './items'
import type {
  AnalysisIndex,
  Archetype,
  CounterTip,
  Priority,
  ThreatProfile,
  ThreatTag
} from './types'

const TAG_TO_NEED: Partial<Record<ThreatTag, string>> = {
  HEAL: 'antiheal',
  SHIELD: 'antishield',
  HARD_CC: 'tenacity',
  TANK: 'antitank',
  MAX_HP: 'antitank',
  BURST: 'antiburts',
  POKE: 'antipoke',
  STEALTH: 'antistealth',
  AUTO_ATTACK: 'antiauto',
  EXECUTE: 'antiexecute'
}

const SPECIAL_ITEMS: Partial<Record<ThreatTag, number[]>> = {
  SLOW: [3009, 3111],
  TRUE_DAMAGE: [3084, 3065],
  MOBILITY: [],
  STEALTH: [3364, 2056]
}

const TIP_TEXT: Record<ThreatTag, { title: string; description: (name: string) => string }> = {
  HEAL: {
    title: 'Reduce la curación',
    description: (name) =>
      `${name} puede alargar las peleas curándose o robando vida. Compra anti-curación y concentra el daño para rematarlo.`
  },
  SHIELD: {
    title: 'Rompe los escudos',
    description: (name) =>
      `${name} absorbe daño con escudos. Rómpelos antes de comprometerte y evita gastar tu burst en un escudo.`
  },
  HARD_CC: {
    title: 'Cuidado con el CC',
    description: (name) =>
      `${name} tiene control de masas fuerte. Mantén la distancia, compra tenacidad y no gastes tu movilidad antes de que use su CC.`
  },
  SLOW: {
    title: 'Sal de las ralentizaciones',
    description: (name) =>
      `${name} ralentiza para alcanzarte. Tenacidad, botas de velocidad y guardar movilidad te ayudan a cortar la persecución.`
  },
  MOBILITY: {
    title: 'Guarda recursos para su entrada',
    description: (name) =>
      `${name} se reposiciona rápido. Guarda CC o ralentizaciones para cuando entre y no lo persigas a ciegas.`
  },
  STEALTH: {
    title: 'Controla la visión',
    description: (name) =>
      `${name} puede invisibilizarse. Wardea los flancos, lleva control de visión y juega cerca de tu equipo.`
  },
  BURST: {
    title: 'Sobrevive al burst',
    description: (name) =>
      `${name} puede eliminarte en una combo. Respeta su rango, no camines solo y compra una defensa de burst si te enfoca.`
  },
  TANK: {
    title: 'Penetra sus resistencias',
    description: (name) =>
      `${name} aguanta peleas largas. Suma penetración de armaduras, daño porcentual o quemadura para bajarlo.`
  },
  POKE: {
    title: 'Aguanta el poke',
    description: (name) =>
      `${name} hace daño desde lejos. Usa sustain, escudos y busca peleas cortas; no regales vida antes del objetivo.`
  },
  MAX_HP: {
    title: 'Daño porcentual',
    description: (name) =>
      `${name} castiga objetivos con mucha vida. El daño porcentual y la penetración de resistencias son claves.`
  },
  TRUE_DAMAGE: {
    title: 'El daño verdadero ignora resistencias',
    description: (name) =>
      `${name} tiene daño verdadero. Prioriza vida y mitigación en lugar de apilar solo armadura o RM.`
  },
  EXECUTE: {
    title: 'No te quedes bajo de vida',
    description: (name) =>
      `${name} remata objetivos con poca vida. Usa escudos, cúrate antes de entrar y evita quedarte a rango de ejecución.`
  },
  AUTO_ATTACK: {
    title: 'Frena los ataques básicos',
    description: (name) =>
      `${name} depende de ataques básicos. Randuin, Frozen Heart y anti-curación reducen mucho su daño sostenido.`
  }
}

const ARCHETYPE_TIPS: Partial<
  Record<Archetype, { title: string; description: (name: string) => string }>
> = {
  'ad-assassin': {
    title: 'Respeta su combo',
    description: (name) =>
      `${name} busca entrar y borrar un objetivo. Wardea sus flancos y guarda CC o escudos para su primer dash.`
  },
  'ap-assassin': {
    title: 'Respeta su combo',
    description: (name) =>
      `${name} busca entrar y borrar un objetivo. Wardea sus flancos y guarda CC o escudos para su primer dash.`
  },
  tank: {
    title: 'Kitéalo',
    description: (name) =>
      `${name} quiere peleas largas y cuerpo a cuerpo. Kitéalo, evita pelear en pasillos y ataca a sus carries.`
  },
  mage: {
    title: 'Esquiva sus habilidades',
    description: (name) =>
      `${name} depende de acertar habilidades. Muévete lateralmente, usa minions como cobertura y castígalo cuando falle.`
  },
  marksman: {
    title: 'Cierra la distancia',
    description: (name) =>
      `${name} hace daño desde lejos. Busca flanquearlo, usa CC y no le des tiempo para atacar gratis.`
  },
  enchanter: {
    title: 'Presiona a la enchanter',
    description: (name) =>
      `${name} escala con curas y escudos. Presiona early, compra anti-curación y enfoca a su carry.`
  },
  support: {
    title: 'Cuidado con su engage',
    description: (name) =>
      `${name} puede iniciar peleas. Mantén visión del flanco y no te agrupes alrededor de su engage.`
  }
}

function priorityFor(severity: 1 | 2 | 3): Priority {
  if (severity >= 3) return 'ALTA'
  if (severity === 2) return 'MEDIA'
  return 'BAJA'
}

function resolveItems(ids: number[], index: AnalysisIndex): Item[] {
  return ids
    .map((id) => index.itemById.get(id))
    .filter((item): item is Item => Boolean(item))
    .slice(0, 2)
}

export function generateCounterTips(
  enemy: Champion,
  index: AnalysisIndex,
  myChampion?: Champion,
  myRole?: Role
): { profile: ThreatProfile; tips: CounterTip[] } {
  const profile = analyzeChampion(enemy)
  const myArchetype: Archetype = myChampion
    ? classifyArchetype(myChampion, myRole)
    : 'bruiser'

  const tips: CounterTip[] = []
  for (const threat of profile.threats) {
    const template = TIP_TEXT[threat.tag]
    const needId = TAG_TO_NEED[threat.tag]
    const needItems = needId ? (NEED_ITEM_IDS[needId]?.[myArchetype] ?? []) : []
    const itemIds = needItems.length > 0 ? needItems : (SPECIAL_ITEMS[threat.tag] ?? [])
    tips.push({
      id: `threat-${threat.tag}`,
      title: template.title,
      description: template.description(enemy.name),
      priority: priorityFor(threat.severity),
      items: resolveItems(itemIds, index),
      tags: [threat.tag]
    })
  }

  const archetypeTip = ARCHETYPE_TIPS[profile.archetype]
  if (archetypeTip) {
    tips.push({
      id: `archetype-${profile.archetype}`,
      title: archetypeTip.title,
      description: archetypeTip.description(enemy.name),
      priority: 'MEDIA',
      items: [],
      tags: []
    })
  }

  tips.sort((a, b) => {
    const order: Record<Priority, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 }
    return order[a.priority] - order[b.priority]
  })

  return { profile, tips }
}
