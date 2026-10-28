import type { Item } from '../types'

export type ItemCategory =
  | 'starter'
  | 'boots'
  | 'damage'
  | 'magic'
  | 'defense'
  | 'support'
  | 'jungle'
  | 'consumable'
  | 'other'

export const ITEM_CATEGORY_ORDER: ItemCategory[] = [
  'damage',
  'magic',
  'defense',
  'support',
  'boots',
  'starter',
  'jungle',
  'consumable',
  'other'
]

export function itemCategory(item: Item): ItemCategory {
  const tags = item.tags
  if (tags.includes('Boots')) return 'boots'
  if (tags.includes('Consumable')) return 'consumable'
  if (tags.includes('Trinket')) return 'other'
  if (tags.includes('Jungle')) return 'jungle'
  if (tags.includes('GoldPer')) return 'support'
  if (item.gold.total <= 650 && tags.includes('Lane')) return 'starter'
  if (tags.includes('SpellDamage') || tags.includes('MagicPenetration')) return 'magic'
  if (
    tags.includes('Damage') ||
    tags.includes('CriticalStrike') ||
    tags.includes('ArmorPenetration') ||
    tags.includes('AttackSpeed')
  ) {
    return 'damage'
  }
  if (tags.includes('Armor') || tags.includes('SpellBlock') || tags.includes('Health')) return 'defense'
  if (tags.includes('ManaRegen') || tags.includes('AbilityHaste')) return 'support'
  return 'other'
}

export function itemCategoryLabelKey(category: ItemCategory): string {
  switch (category) {
    case 'starter':
      return 'Salida'
    case 'boots':
      return 'Botas'
    case 'damage':
      return 'Daño'
    case 'magic':
      return 'Mágico'
    case 'defense':
      return 'Defensa'
    case 'support':
      return 'Soporte'
    case 'jungle':
      return 'Jungla'
    case 'consumable':
      return 'Consumibles'
    default:
      return 'Otros'
  }
}
