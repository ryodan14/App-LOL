import { describe, expect, it } from 'vitest'
import type { Champion, Item, StaticData } from '../types'
import { createAnalysisIndex, generateBuild, generateRunePlan, mapIdFromGameMode, mapLabelKey } from './index'

const champion: Champion = {
  id: 'Jinx',
  key: 222,
  name: 'Jinx',
  title: '',
  tags: ['Marksman'],
  partype: 'Maná',
  info: { attack: 9, defense: 2, magic: 1, difficulty: 6 },
  stats: {},
  image: 'Jinx.png',
  lore: '',
  passive: { name: '', description: '', image: '' },
  spells: []
}

function item(id: number, name: string, mapId: number, total: number, tags: string[] = []): Item {
  const maps: Record<string, boolean> = {}
  maps[String(mapId)] = true
  return {
    id,
    name,
    description: '',
    plaintext: '',
    gold: { base: total, total, sell: 0, purchasable: true },
    tags,
    stats: { FlatPhysicalDamageMod: 50 },
    image: `${id}.png`,
    maps,
    inStore: true
  }
}

const data: StaticData = {
  patch: '16.21.1',
  language: 'es_ES',
  champions: [champion],
  items: [
    item(3031, 'Filo infinito', 11, 3500, ['Damage', 'CriticalStrike']),
    item(123430, 'Rito de la ruina', 12, 3000, ['CriticalStrike']),
    item(223031, 'Filo infinito de Arena', 30, 2500, ['Damage', 'CriticalStrike']),
    item(2142, 'Zumito de poder', 30, 500, ['SpellDamage', 'Consumable']),
    item(2144, 'Zumito de velocidad', 30, 500, ['Consumable', 'CooldownReduction']),
    item(3184, 'Martillo del guardián', 12, 950, ['Damage', 'Lane']),
    item(2003, 'Poción de vida', 12, 50, ['Consumable', 'Lane']),
    item(223006, 'Grebas de Arena', 30, 500, ['Boots', 'AttackSpeed'])
  ],
  runeTrees: [],
  runeRecs: [],
  summonerSpells: [],
  shards: [],
  fetchedAt: 0
}

const index = createAnalysisIndex(data)

describe('modos de juego', () => {
  it('traduce modos y mapas conocidos', () => {
    expect(mapIdFromGameMode('CLASSIC')).toBe(11)
    expect(mapIdFromGameMode('ARAM')).toBe(12)
    expect(mapIdFromGameMode('CHERRY')).toBe(30)
    expect(mapIdFromGameMode('DESCONOCIDO')).toBe(11)
    expect(mapLabelKey(12)).toBe('ARAM')
    expect(mapLabelKey(30)).toBe('Arena')
    expect(mapLabelKey(11)).toBeNull()
  })

  it('usa objetos disponibles en ARAM', () => {
    const build = generateBuild(champion, 'BOTTOM', [], index, { mapId: 12 })
    expect(build.mapId).toBe(12)
    expect(build.core.map((entry) => entry.item.id)).toContain(123430)
    expect(build.core.map((entry) => entry.item.id)).not.toContain(3031)
    expect(build.starting.map((entry) => entry.item.id)).toEqual([3184, 2003])
  })

  it('usa objetos y zumos de Arena y no genera runas', () => {
    const build = generateBuild(champion, 'BOTTOM', [], index, { mapId: 30 })
    expect(build.mapId).toBe(30)
    expect(build.core.map((entry) => entry.item.id)).toContain(223031)
    expect(build.starting.map((entry) => entry.item.id)).toEqual([2144])
    expect(generateRunePlan(champion, 'BOTTOM', index, { mapId: 30 })).toBeNull()
  })
})
