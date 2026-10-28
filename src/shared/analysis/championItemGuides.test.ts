import { describe, expect, it } from 'vitest'
import type { Item } from '../types'
import {
  CURATED_CHAMPION_ITEM_GUIDES,
  normalizeChampionItemGuide,
  resolveChampionItemGuide
} from './championItemGuides'
import {
  GENERATED_CHAMPION_ITEM_GUIDES,
  GENERATED_CHAMPION_ITEMS_PATCH,
  PATCH_CHAMPION_KEYS
} from './data/championItemGuides.generated'

function item(id: number, tags: string[] = []): Item {
  return {
    id,
    name: `${id}`,
    description: '',
    plaintext: '',
    gold: { base: 0, total: 1000, sell: 700, purchasable: true },
    tags,
    stats: {},
    image: `${id}.png`,
    maps: { '11': true },
    inStore: true
  }
}

function itemMap(items: Item[]): Map<number, Item> {
  return new Map(items.map((entry) => [entry.id, entry]))
}

describe('guías de objetos por campeón', () => {
  it('cubre exactamente a todos los campeones jugables del parche', () => {
    const generated = Object.keys(GENERATED_CHAMPION_ITEM_GUIDES).map(Number)
    const curated = Object.keys(CURATED_CHAMPION_ITEM_GUIDES).map(Number)
    const keys = [...generated, ...curated].sort((left, right) => left - right)
    const patchKeys = [...PATCH_CHAMPION_KEYS].sort((left, right) => left - right)

    expect(GENERATED_CHAMPION_ITEMS_PATCH).toMatch(/^\d+\.\d+$/)
    expect(new Set(patchKeys).size).toBe(patchKeys.length)
    expect(keys).toEqual(patchKeys)
    expect(generated.filter((key) => curated.includes(key))).toEqual([])
  })

  it('no deja grupos vacíos ni identificadores fuera de rango', () => {
    for (const [key, guide] of Object.entries(GENERATED_CHAMPION_ITEM_GUIDES)) {
      expect(Number(key)).toBeGreaterThan(0)
      expect(guide.source).toBe('riot')
      for (const group of [...(guide.starting ?? []), ...(guide.ranges ?? [])]) {
        expect(group.length).toBeGreaterThan(0)
        expect(group.every((id) => Number.isInteger(id) && id > 0 && id < 100_000)).toBe(true)
      }
      for (const entry of Object.values(guide.roles ?? {})) {
        expect((entry.starting?.length ?? 0) + (entry.ranges?.length ?? 0)).toBeGreaterThan(0)
      }
    }
  })

  it('usa la guía del rol cuando existe y la genérica cuando no', () => {
    const ahriSupport = resolveChampionItemGuide(103, 'UTILITY')
    expect(ahriSupport?.source).toBe('riot')
    expect(ahriSupport?.starting.flat()).toContain(3850)

    const missFortune = resolveChampionItemGuide(21, 'BOTTOM')
    expect(missFortune?.source).toBe('curated')
    expect(missFortune?.ranges.flat()).toContain(3031)
  })

  it('normaliza la guía y descarta objetos que no existen en el parche', () => {
    const items = itemMap([
      item(6672),
      item(6673),
      item(3006, ['Boots']),
      item(3031),
      item(3085),
      item(3036),
      item(3033),
      item(3026),
      item(6676)
    ])
    const guide = normalizeChampionItemGuide(resolveChampionItemGuide(222, 'BOTTOM'), items)

    expect(guide.source).toBe('curated')
    expect(guide.first).toEqual([6672, 6673])
    expect(guide.boots).toEqual([3006])
    expect(guide.core).toHaveLength(2)
    expect(guide.situational.length).toBeGreaterThan(0)
    expect(guide.itemIds).toContain(3031)
  })
})
