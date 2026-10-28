import { describe, expect, it } from 'vitest'
import type { Item } from '../types'
import { itemCategory, itemCategoryLabelKey } from './itemCatalog'

function item(id: number, tags: string[], total = 3000): Item {
  return {
    id,
    name: `${id}`,
    description: '',
    plaintext: '',
    gold: { base: 0, total, sell: 0, purchasable: true },
    tags,
    stats: {},
    image: '',
    maps: { '11': true }
  }
}

describe('catálogo de objetos', () => {
  it('clasifica objetos por su función principal', () => {
    expect(itemCategory(item(6672, ['Damage', 'AttackSpeed', 'OnHit']))).toBe('damage')
    expect(itemCategory(item(3089, ['SpellDamage']))).toBe('magic')
    expect(itemCategory(item(3075, ['Health', 'Armor']))).toBe('defense')
    expect(itemCategory(item(3865, ['GoldPer', 'Lane'], 400))).toBe('support')
    expect(itemCategory(item(1101, ['Jungle'], 450))).toBe('jungle')
    expect(itemCategory(item(3006, ['Boots', 'AttackSpeed']))).toBe('boots')
    expect(itemCategory(item(2003, ['Consumable'], 50))).toBe('consumable')
    expect(itemCategory(item(1055, ['Lane', 'Damage'], 450))).toBe('starter')
  })

  it('expone una etiqueta traducible para cada categoría', () => {
    expect(itemCategoryLabelKey('damage')).toBe('Daño')
    expect(itemCategoryLabelKey('magic')).toBe('Mágico')
    expect(itemCategoryLabelKey('defense')).toBe('Defensa')
    expect(itemCategoryLabelKey('other')).toBe('Otros')
  })
})
