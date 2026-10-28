import { randomUUID } from 'node:crypto'
import type {
  LcuItemSetExport,
  LcuRuneExport,
  LcuRunePagePayload
} from '@shared/types'
import { roleLabel } from '@shared/constants'
import { t } from '@shared/i18n'

export const LCU_ITEM_SET_PREFIX = 'App-LOL ·'
export const LCU_RUNE_PAGE_PREFIX = 'App-LOL ·'

export interface LcuItemSet {
  uid: string
  title: string
  associatedChampions: number[]
  associatedMaps: number[]
  blocks: {
    type: string
    items: { id: string; count: number }[]
    hideIfSummonerSpell: string
    showIfSummonerSpell: string
  }[]
  map: string
  mode: string
  preferredItemSlots: unknown[]
  sortrank: number
  startedFrom: string
  type: string
}

export interface LcuItemSetsDocument {
  accountId?: number
  itemSets?: LcuItemSet[]
  timestamp?: number
}

function cleanName(value: string, fallback: string): string {
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
  return (clean || fallback).slice(0, 40)
}

function itemIds(values: number[]): number[] {
  return [...new Set(values)].filter((id) => Number.isInteger(id) && id > 0)
}

function block(type: string, ids: number[]): LcuItemSet['blocks'][number] | null {
  const unique = itemIds(ids)
  if (unique.length === 0) return null
  return {
    type,
    items: unique.map((id) => ({ id: String(id), count: 1 })),
    hideIfSummonerSpell: '',
    showIfSummonerSpell: ''
  }
}

export function itemSetTitle(payload: LcuItemSetExport): string {
  const name = cleanName(payload.championName, `Campeón ${payload.championId}`)
  return `${LCU_ITEM_SET_PREFIX} ${name} · ${roleLabel(payload.role)}`.slice(0, 75)
}

export function runePageName(payload: LcuRuneExport): string {
  const name = cleanName(payload.championName, `Campeón ${payload.championId}`)
  return `${LCU_RUNE_PAGE_PREFIX} ${name} · ${roleLabel(payload.role)}`.slice(0, 50)
}

export function validateItemSetExport(payload: LcuItemSetExport): void {
  if (!Number.isInteger(payload.championId) || payload.championId <= 0) {
    throw new Error(t('Campeón no válido para exportar.'))
  }
  const lists = [
    payload.starting,
    payload.first,
    payload.boots,
    payload.core,
    payload.situational
  ]
  if (!lists.every(Array.isArray)) {
    throw new Error(t('La build no tiene objetos para exportar.'))
  }
  const total = lists
    .flat()
    .filter((id) => Number.isInteger(id) && id > 0).length
  if (total === 0) throw new Error(t('La build no tiene objetos para exportar.'))
}

export function buildItemSetDocument(
  payload: LcuItemSetExport,
  summonerId: number,
  existing: LcuItemSetsDocument,
  now = Date.now()
): LcuItemSetsDocument {
  validateItemSetExport(payload)
  const title = itemSetTitle(payload)
  const blocks = [
    block(t('Salida'), payload.starting),
    block(t('Primer completado'), payload.first),
    block(t('Botas'), payload.boots),
    block(t('Núcleo'), payload.core),
    block(t('Situacional'), payload.situational)
  ].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

  const itemSet: LcuItemSet = {
    uid: randomUUID(),
    title,
    associatedChampions: [payload.championId],
    associatedMaps: [payload.mapId ?? 11],
    blocks,
    map: 'any',
    mode: 'any',
    preferredItemSlots: [],
    sortrank: 0,
    startedFrom: 'blank',
    type: 'custom'
  }

  const kept = (existing.itemSets ?? []).filter(
    (set) =>
      !(
        set.title?.startsWith(LCU_ITEM_SET_PREFIX) &&
        set.associatedChampions?.includes(payload.championId)
      )
  )

  return {
    accountId: existing.accountId ?? summonerId,
    itemSets: [itemSet, ...kept],
    timestamp: now
  }
}

export function validateRuneExport(payload: LcuRuneExport): void {
  if (!Number.isInteger(payload.championId) || payload.championId <= 0) {
    throw new Error(t('Campeón no válido para exportar.'))
  }
  if (
    !Number.isInteger(payload.primaryStyleId) ||
    payload.primaryStyleId <= 0 ||
    !Number.isInteger(payload.subStyleId) ||
    payload.subStyleId <= 0
  ) {
    throw new Error(t('La página de runas no tiene estilos válidos.'))
  }
  if (
    !Array.isArray(payload.selectedPerkIds) ||
    payload.selectedPerkIds.length < 6 ||
    payload.selectedPerkIds.some((id) => !Number.isInteger(id) || id <= 0)
  ) {
    throw new Error(t('La página de runas está incompleta.'))
  }
}

export function buildRunePagePayload(payload: LcuRuneExport): LcuRunePagePayload {
  validateRuneExport(payload)
  return {
    name: runePageName(payload),
    primaryStyleId: payload.primaryStyleId,
    subStyleId: payload.subStyleId,
    selectedPerkIds: [...payload.selectedPerkIds],
    current: true
  }
}
