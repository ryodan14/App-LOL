import { describe, expect, it } from 'vitest'
import type {
  Champion,
  Item,
  LiveGameState,
  LivePlayer,
  RuneRecommendation,
  RuneTree,
  StaticData,
  SummonerSpell
} from '../types'
import {
  analyzeChampion,
  analyzeTeam,
  assignRoles,
  classifyArchetype,
  compareLaneGold,
  computeObjectiveTimers,
  createAnalysisIndex,
  estimatePlayerGold,
  generateBuild,
  generateCounterTips,
  generateRunePlan,
  inferChampionRole,
  inferRolesFromTags,
  suggestBanTargets,
  suggestLaneCounters
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
  item(3135, 'Bastón del vacío', ['SpellDamage', 'MagicPenetration'], { FlatMagicDamageMod: 95 }, 3000, '40% de penetración mágica.'),
  item(6655, 'Eco de Luden', ['SpellDamage', 'Mana', 'AbilityHaste'], { FlatMagicDamageMod: 100, FlatMPPoolMod: 600 }, 2750),
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

describe('roles de campeón', () => {
  it('asigna al menos un rol a cada campeón aunque no tenga runas recomendadas', () => {
    for (const entry of champions) {
      expect(index.rolesByChampion.get(entry.key)?.length ?? 0).toBeGreaterThan(0)
    }
    expect(index.rolesByChampion.get(222)).toContain('BOTTOM')
    expect(index.rolesByChampion.get(16)).toEqual(['UTILITY'])
  })

  it('infiere roles por etiquetas cuando faltan datos oficiales', () => {
    expect(inferRolesFromTags(champions[3])).toContain('BOTTOM')
    expect(inferRolesFromTags(champions[5])).toEqual(expect.arrayContaining(['TOP', 'JUNGLE']))
    expect(inferRolesFromTags(champions[7])).toEqual(expect.arrayContaining(['MIDDLE', 'UTILITY']))
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
    expect(build.firstItem?.item.id).toBe(build.core[0]?.item.id)
    expect(build.purchaseOrder[0]?.item.id).toBe(build.firstItem?.item.id)
    expect(build.purchaseOrder[1]?.item.id).toBe(build.boots?.item.id)
    expect(build.purchaseOrder).toHaveLength(
      build.core.length + (build.boots ? 1 : 0) + build.situational.length
    )
    expect(build.skillOrder.priority[0]).toBe('Q')
    expect(build.skillOrder.entries[0]?.maxOrder).toBe(1)
    expect(build.skillOrder.ultimateLevels).toEqual([6, 11, 16])
    expect(build.skillOrder.note.length).toBeGreaterThan(0)
    expect(build.notes.length).toBeGreaterThan(0)
    expect(build.totalGold).toBeGreaterThan(0)
    expect(build.guide.items.length).toBeGreaterThan(0)
    expect(['riot', 'curated', 'heuristic']).toContain(build.guide.source)
  })

  it('prioriza el objeto de arranque antes que penetración tardía', () => {
    const jinx = generateBuild(champions[3], 'BOTTOM', [], index)
    expect(jinx.firstItem?.item.id).toBe(6672)

    const ahri = generateBuild(champions[0], 'MIDDLE', [], index)
    expect(ahri.firstItem?.item.id).toBe(6655)
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


function livePlayer(extra: Partial<LivePlayer> = {}): LivePlayer {
  return {
    championId: 'Jinx',
    championName: 'Jinx',
    rawChampionName: 'game_character_displayname_Jinx',
    riotId: 'Tester#LAS',
    team: 'ORDER',
    position: 'BOTTOM',
    level: 10,
    kills: 2,
    deaths: 1,
    assists: 3,
    cs: 100,
    wardScore: 10,
    items: [3031, 3047],
    summonerSpells: { one: 'Destello', two: 'Barrera' },
    isDead: false,
    respawnTimer: 0,
    ...extra
  }
}

function liveGame(extra: Partial<LiveGameState> = {}): LiveGameState {
  return {
    gameTime: 600,
    mapName: 'Map11',
    gameMode: 'CLASSIC',
    activePlayerRiotId: 'Tester#LAS',
    activeChampionName: 'Jinx',
    activeTeam: 'ORDER',
    players: [livePlayer()],
    events: [],
    ...extra
  }
}

describe('oro estimado', () => {
  it('suma objetos, CS, KDA y oro pasivo', () => {
    const estimate = estimatePlayerGold(livePlayer(), 600, index)
    expect(estimate.itemValue).toBe(4600)
    expect(estimate.total).toBeGreaterThan(5000)
  })

  it('compara dos líneas y marca al líder', () => {
    const ally = livePlayer()
    const enemy = livePlayer({ championId: 'Caitlyn', championName: 'Caitlyn', cs: 40, items: [3006] })
    const result = compareLaneGold(ally, enemy, 600, index)
    expect(result.leader).toBe('ALLY')
    expect(result.difference).toBeGreaterThan(0)
  })
})

describe('objetivos', () => {
  it('calcula primeros spawns y respawns', () => {
    const early = computeObjectiveTimers(liveGame({ gameTime: 100 }), 100)
    expect(early.find((timer) => timer.id === 'dragon')?.remaining).toBe(200)
    expect(early.find((timer) => timer.id === 'baron')?.remaining).toBe(1100)

    const game = liveGame({
      gameTime: 800,
      events: [
        { id: 1, name: 'DragonKill', time: 500, dragonType: 'Fire' },
        { id: 2, name: 'BaronKill', time: 1300 },
        { id: 3, name: 'InhibKilled', time: 600, turret: 'Turret_T2_L_03_A' }
      ]
    })
    const timers = computeObjectiveTimers(game, 700)
    expect(timers.find((timer) => timer.id === 'dragon')?.remaining).toBe(100)
    expect(timers.find((timer) => timer.id === 'baron')?.remaining).toBe(960)
    expect(timers.find((timer) => timer.id.startsWith('inhibitor'))?.label).toContain('top rojo')
  })
})

describe('línea y counters', () => {
  it('infiere el rol y asigna líneas', () => {
    expect(inferChampionRole(index, champions[3])).toBe('BOTTOM')
    const assignments = assignRoles(
      [
        { role: 'TOP', champion: champions[2], data: 'top' },
        { role: 'UTILITY', champion: champions[6], data: 'support' },
        { role: 'BOTTOM', champion: champions[3], data: 'adc' }
      ],
      index
    )
    expect(assignments.get('TOP')).toBe('top')
    expect(assignments.get('UTILITY')).toBe('support')
    expect(assignments.get('BOTTOM')).toBe('adc')
    expect(assignments.size).toBe(3)
  })

  it('sugiere counters por kit para el rival de línea', () => {
    const report = suggestLaneCounters(champions[0], 'MIDDLE', index)
    expect(report.enemy.id).toBe('Ahri')
    expect(report.suggestions.some((entry) => entry.champion.id === 'Zed')).toBe(true)
    expect(report.note.length).toBeGreaterThan(0)
  })

  it('sugiere baneos que castigan tu pick', () => {
    const report = suggestBanTargets(champions[0], 'MIDDLE', index)
    expect(report.champion.id).toBe('Ahri')
    expect(report.suggestions.length).toBeGreaterThan(0)
    expect(report.suggestions.every((entry) => entry.champion.id !== 'Ahri')).toBe(true)
    expect(report.note.length).toBeGreaterThan(0)
  })
})
