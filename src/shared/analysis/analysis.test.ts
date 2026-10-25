import { describe, expect, it } from 'vitest'
import type {
  Champion,
  Item,
  RuneRecommendation,
  RuneTree,
  StaticData,
  SummonerSpell
} from '../types'
import {
  analyzeChampion,
  analyzeTeam,
  classifyArchetype,
  createAnalysisIndex,
  generateBuild,
  generateCounterTips,
  generateRunePlan
} from './index'

function champion(
  key: number,
  id: string,
  name: string,
  tags: string[],
  info: Champion['info'],
  passive: string,
  spells: { name: string; description: string; range?: number }[]
): Champion {
  return {
    id,
    key,
    name,
    title: '',
    tags,
    partype: 'Maná',
    info,
    stats: {},
    image: `${id}.png`,
    lore: '',
    passive: { name: 'Pasiva', description: passive, image: 'passive.png' },
    spells: spells.map((spell, index) => ({
      id: `${id}${index}`,
      name: spell.name,
      description: spell.description,
      cooldown: [10],
      cost: [50],
      range: [spell.range ?? 600],
      image: 'spell.png'
    }))
  }
}

function item(
  id: number,
  name: string,
  tags: string[],
  stats: Record<string, number>,
  total: number,
  description = '',
  extra: Partial<Item> = {}
): Item {
  return {
    id,
    name,
    description,
    plaintext: description,
    gold: { base: total, total, sell: Math.floor(total * 0.7), purchasable: true },
    tags,
    stats,
    image: `${id}.png`,
    maps: { '11': true },
    inStore: true,
    ...extra
  }
}

const champions: Champion[] = [
  champion(103, 'Ahri', 'Ahri', ['Mage', 'Assassin'], { attack: 3, defense: 4, magic: 8, difficulty: 5 }, '', [
    { name: 'Orbe del engaño', description: 'Lanza un orbe que inflige daño mágico.', range: 900 },
    { name: 'Encanto', description: 'Encanta al primer enemigo y lo atrae hacia ella.' }
  ]),
  champion(16, 'Soraka', 'Soraka', ['Support', 'Mage'], { attack: 2, defense: 3, magic: 7, difficulty: 3 }, '', [
    { name: 'Astroglobo', description: 'Restaura vida a un aliado.' },
    { name: 'Equinoccio', description: 'Cura a los aliados y daña a los enemigos con daño mágico.' }
  ]),
  champion(89, 'Leona', 'Leona', ['Tank', 'Support'], { attack: 4, defense: 9, magic: 3, difficulty: 4 }, '', [
    { name: 'Escudo del amanecer', description: 'Obtiene un escudo y aturde a los enemigos.' },
    { name: 'Ira solar', description: 'Inmoviliza al enemigo y lo daña con daño mágico.' }
  ]),
  champion(222, 'Jinx', 'Jinx', ['Marksman'], { attack: 9, defense: 2, magic: 1, difficulty: 6 }, '', [
    { name: 'Cambiazo', description: 'Sus ataques básicos infligen daño físico.' },
    { name: 'Zap', description: 'Dispara un rayo que ralentiza e inflige daño físico.', range: 1200 }
  ]),
  champion(238, 'Zed', 'Zed', ['Assassin'], { attack: 9, defense: 3, magic: 1, difficulty: 8 }, '', [
    { name: 'Sombra viviente', description: 'Se lanza hacia una sombra y su siguiente ataque inflige daño físico.' },
    { name: 'Marca de la muerte', description: 'Marca al enemigo para ejecutarlo con daño físico.' }
  ]),
  champion(54, 'Malphite', 'Malphite', ['Tank', 'Mage'], { attack: 4, defense: 9, magic: 5, difficulty: 3 }, '', [
    { name: 'Fragmento', description: 'Lanza un fragmento que inflige daño mágico y ralentiza.' },
    { name: 'Fuerza implacable', description: 'Lanza a los enemigos por los aires y los aturde.' }
  ]),
  champion(117, 'Lulu', 'Lulu', ['Support', 'Mage'], { attack: 2, defense: 3, magic: 7, difficulty: 4 }, '', [
    { name: 'Ayuda, pix', description: 'Da un escudo a un aliado.' },
    { name: 'Capricho', description: 'Otorga velocidad de movimiento y poder de habilidad.' }
  ]),
  champion(143, 'Zyra', 'Zyra', ['Mage', 'Support'], { attack: 2, defense: 3, magic: 8, difficulty: 5 }, '', [
    { name: 'Espinas', description: 'Invoca plantas que infligen daño mágico.' },
    { name: 'Enredadera', description: 'Enraíza a los enemigos con daño mágico.' }
  ])
]

const items: Item[] = [
  item(3031, 'Filo infinito', ['Damage', 'CriticalStrike'], { FlatPhysicalDamageMod: 75, FlatCritChanceMod: 0.25 }, 3500),
  item(6672, 'Filo de Kraken', ['Damage', 'AttackSpeed', 'OnHit'], { FlatPhysicalDamageMod: 45, PercentAttackSpeedMod: 0.4 }, 3000),
  item(3036, 'Recuerdos de Lord Dominik', ['Damage', 'CriticalStrike', 'ArmorPenetration'], { FlatPhysicalDamageMod: 35, FlatCritChanceMod: 0.25 }, 3300),
  item(3033, 'Recordatorio mortal', ['Damage', 'CriticalStrike', 'ArmorPenetration'], { FlatPhysicalDamageMod: 35, FlatCritChanceMod: 0.25 }, 3000),
  item(3165, 'Morellonomicón', ['Health', 'SpellDamage', 'AbilityHaste'], { FlatMagicDamageMod: 75, FlatHPPoolMod: 350 }, 2850),
  item(3089, 'Sombrero mortal de Rabadon', ['SpellDamage'], { FlatMagicDamageMod: 130 }, 3500),
  item(3135, 'Bastón del vacío', ['SpellDamage', 'MagicPenetration'], { FlatMagicDamageMod: 95 }, 3000),
  item(3075, 'Thornmail', ['Health', 'Armor'], { FlatHPPoolMod: 150, FlatArmorMod: 75 }, 2450),
  item(3068, 'Égida de fuego solar', ['Health', 'Armor', 'AbilityHaste'], { FlatHPPoolMod: 350, FlatArmorMod: 50 }, 2800),
  item(3084, 'Corazón de acero', ['Health', 'HealthRegen'], { FlatHPPoolMod: 900 }, 3000),
  item(3078, 'Fuerza de la trinidad', ['Health', 'Damage', 'AttackSpeed', 'AbilityHaste'], { FlatHPPoolMod: 333, FlatPhysicalDamageMod: 36, PercentAttackSpeedMod: 0.3 }, 3333),
  item(6617, 'Renovar de piedra lunar', ['Health', 'SpellDamage', 'ManaRegen', 'AbilityHaste'], { FlatHPPoolMod: 200, FlatMagicDamageMod: 25 }, 2200, 'Aumenta el poder de curación y escudos.'),
  item(3222, 'Bendición de Mikael', ['Health', 'SpellDamage', 'ManaRegen', 'AbilityHaste'], { FlatHPPoolMod: 200, FlatMagicDamageMod: 25 }, 2300, 'Aumenta el poder de curación y escudos.'),
  item(3190, 'Medallón de los Solari de Hierro', ['Health', 'Armor', 'SpellBlock', 'AbilityHaste'], { FlatHPPoolMod: 200, FlatArmorMod: 30, FlatSpellBlockMod: 30 }, 2200),
  item(3026, 'Ángel guardián', ['Armor', 'Damage'], { FlatArmorMod: 45, FlatPhysicalDamageMod: 55 }, 3200),
  item(3157, 'Reloj de arena de Zhonya', ['Armor', 'SpellDamage'], { FlatMagicDamageMod: 105, FlatArmorMod: 50 }, 3250),
  item(3072, 'Sanguinaria', ['Damage', 'LifeSteal'], { FlatPhysicalDamageMod: 80, PercentLifeStealMod: 0.15 }, 3400),
  item(3140, 'Chaleco de seda', ['Armor', 'Active'], { FlatArmorMod: 30 }, 1300, 'Limpia el control de masas.', { into: ['6035'] }),
  item(3047, 'Grebas de acero', ['Boots', 'Armor'], { FlatArmorMod: 25 }, 1100),
  item(3111, 'Botas de mercurio', ['Boots', 'SpellBlock'], { FlatSpellBlockMod: 25 }, 1100),
  item(3006, 'Grebas de berserker', ['Boots', 'AttackSpeed'], { PercentAttackSpeedMod: 0.25 }, 1100),
  item(3020, 'Botas de hechicero', ['Boots', 'MagicPenetration'], {}, 1100),
  item(3158, 'Botas de lucidez', ['Boots', 'AbilityHaste'], {}, 950),
  item(3009, 'Botas de rapidez', ['Boots'], {}, 1000),
  item(1055, 'Hoja de Doran', ['Lane', 'Damage'], { FlatPhysicalDamageMod: 10, FlatHPPoolMod: 80 }, 450),
  item(1056, 'Anillo de Doran', ['Lane', 'SpellDamage'], { FlatMagicDamageMod: 15, FlatHPPoolMod: 70 }, 400),
  item(1054, 'Escudo de Doran', ['Lane', 'Health'], { FlatHPPoolMod: 110 }, 450),
  item(2003, 'Poción de vida', ['Consumable'], {}, 50),
  item(3865, 'Atlas mundial', ['GoldPer', 'Lane'], {}, 400),
  item(1102, 'Cría de Caminante de ráfagas', ['Jungle'], {}, 450),
  item(1103, 'Brote de Pisoteador', ['Jungle'], {}, 450),
  item(1101, 'Cachorro de Garra ígnea', ['Jungle'], {}, 450)
]

const runeTree = (id: number, key: string, name: string, runes: number[]): RuneTree => ({
  id,
  key,
  name,
  icon: '',
  slots: [{ runes: runes.map((runeId) => ({ id: runeId, key: `${runeId}`, name: `${runeId}`, icon: '', shortDesc: '' })) }]
})

const runeTrees: RuneTree[] = [
  runeTree(8000, 'Precision', 'Precisión', [8005, 8009, 8010, 8011]),
  runeTree(8200, 'Sorcery', 'Brujería', [8210, 8220])
]

const recommendation: RuneRecommendation = {
  championId: 222,
  position: 'BOTTOM',
  mapId: 11,
  isDefaultPosition: true,
  perkIds: [8005, 8009, 8010, 8011, 8210, 8220, 5008, 5005, 5011],
  primaryPerkStyleId: 8000,
  secondaryPerkStyleId: 8200,
  summonerSpellIds: [4, 14],
  recommendationId: 'test'
}

const summonerSpells: SummonerSpell[] = [
  { id: 4, key: 'SummonerFlash', name: 'Destello', description: '', image: '', cooldown: [300] },
  { id: 14, key: 'SummonerIgnite', name: 'Ignición', description: '', image: '', cooldown: [180] }
]

const data: StaticData = {
  patch: 'test',
  language: 'es_ES',
  champions,
  items,
  runeTrees,
  runeRecs: [recommendation],
  summonerSpells,
  shards: [
    { id: 5008, name: 'Fuerza adaptativa', icon: '' },
    { id: 5005, name: 'Velocidad de ataque', icon: '' },
    { id: 5011, name: 'Vida', icon: '' }
  ],
  fetchedAt: 0
}

const index = createAnalysisIndex(data)

describe('análisis de campeones', () => {
  it('detecta daño, CC y movilidad', () => {
    const ahri = analyzeChampion(champions[0], 'MIDDLE')
    expect(ahri.damageType).toBe('AP')
    expect(ahri.threats.map((threat) => threat.tag)).toContain('HARD_CC')

    const zed = analyzeChampion(champions[4])
    expect(zed.damageType).toBe('AD')
    expect(zed.threats.map((threat) => threat.tag)).toContain('MOBILITY')
    expect(zed.threats.map((threat) => threat.tag)).toContain('BURST')
  })

  it('clasifica enchanters y magos de soporte', () => {
    expect(classifyArchetype(champions[6], 'UTILITY')).toBe('enchanter')
    expect(classifyArchetype(champions[7], 'UTILITY')).toBe('mage')
    expect(classifyArchetype(champions[3], 'BOTTOM')).toBe('marksman')
  })
})

describe('análisis de composición', () => {
  it('detecta necesidades defensivas y anti-curación', () => {
    const team = analyzeTeam([champions[2], champions[1], champions[3], champions[4], champions[5]])
    const ids = team.needs.map((need) => need.id)
    expect(ids).toContain('antiheal')
    expect(ids).toContain('armor')
    expect(ids).toContain('mr')
    expect(ids).toContain('tenacity')
    expect(team.summary.length).toBeGreaterThan(0)
  })
})

describe('builds', () => {
  it('adapta la build de un tirador contra curación y tanques', () => {
    const enemies = [champions[2], champions[1], champions[3], champions[4], champions[5]]
    const build = generateBuild(champions[3], 'BOTTOM', enemies, index)
    const allItems = [...build.core, ...build.situational].map((entry) => entry.item.id)

    expect(build.archetype).toBe('marksman')
    expect(build.starting.map((entry) => entry.item.id)).toContain(1055)
    expect(build.starting.map((entry) => entry.item.id)).toContain(2003)
    expect(allItems).toContain(3033)
    expect(build.boots?.item.id).toBe(3111)
    expect(build.notes.length).toBeGreaterThan(0)
    expect(build.totalGold).toBeGreaterThan(0)
  })

  it('arma una build con runas recomendadas', () => {
    const plan = generateRunePlan(champions[3], 'BOTTOM', index)
    expect(plan?.primaryTree.id).toBe(8000)
    expect(plan?.primaryRunes).toHaveLength(4)
    expect(plan?.secondaryRunes).toHaveLength(2)
    expect(plan?.shards).toHaveLength(3)
    expect(plan?.summonerSpells.map((spell) => spell.id)).toEqual([4, 14])
  })
})

describe('counters', () => {
  it('genera consejos con objetos para el campeón propio', () => {
    const { profile, tips } = generateCounterTips(champions[2], index, champions[3], 'BOTTOM')
    const ids = tips.map((tip) => tip.id)

    expect(profile.damageType).toBe('AP')
    expect(ids).toContain('threat-HARD_CC')
    expect(ids).toContain('threat-TANK')
    const ccTip = tips.find((tip) => tip.id === 'threat-HARD_CC')
    expect(ccTip?.items.some((tipItem) => tipItem.id === 3140)).toBe(true)
  })
})
