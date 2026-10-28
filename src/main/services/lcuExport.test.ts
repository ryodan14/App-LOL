import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, setLocale } from '@shared/i18n'
import type { LcuItemSetExport, LcuRuneExport } from '@shared/types'
import {
  LCU_ITEM_SET_PREFIX,
  buildItemSetDocument,
  buildRunePagePayload,
  itemSetTitle,
  validateItemSetExport
} from './lcuExport'

const build: LcuItemSetExport = {
  championId: 222,
  championName: 'Jinx',
  role: 'BOTTOM',
  starting: [1055, 2003],
  first: [6672],
  boots: [3006],
  core: [3031, 3036],
  situational: [3026, 6676, 6676]
}

const runes: LcuRuneExport = {
  championId: 222,
  championName: 'Jinx',
  role: 'BOTTOM',
  primaryStyleId: 8000,
  subStyleId: 8200,
  selectedPerkIds: [8005, 8009, 9104, 8014, 8304, 8347, 5005, 5008, 5011]
}

describe('exportación al cliente de League', () => {
  afterEach(() => setLocale(DEFAULT_LOCALE))

  it('crea un conjunto de objetos con bloques únicos y sustituye el anterior', () => {
    const document = buildItemSetDocument(
      build,
      42,
      {
        itemSets: [
          {
            uid: 'old',
            title: `${LCU_ITEM_SET_PREFIX} Jinx · ADC`,
            associatedChampions: [222],
            associatedMaps: [11],
            blocks: [],
            map: 'any',
            mode: 'any',
            preferredItemSlots: [],
            sortrank: 0,
            startedFrom: 'blank',
            type: 'custom'
          },
          {
            uid: 'other',
            title: 'Otra build',
            associatedChampions: [222],
            associatedMaps: [11],
            blocks: [],
            map: 'any',
            mode: 'any',
            preferredItemSlots: [],
            sortrank: 0,
            startedFrom: 'blank',
            type: 'custom'
          }
        ]
      },
      123
    )

    expect(itemSetTitle(build)).toBe('App-LOL · Jinx · ADC')
    expect(document.accountId).toBe(42)
    expect(document.timestamp).toBe(123)
    expect(document.itemSets?.map((set) => set.title)).toEqual([
      'App-LOL · Jinx · ADC',
      'Otra build'
    ])
    const exported = document.itemSets?.[0]
    expect(exported?.associatedChampions).toEqual([222])
    expect(exported?.associatedMaps).toEqual([11])
    expect(exported?.blocks.map((entry) => entry.type)).toEqual([
      'Salida',
      'Primer completado',
      'Botas',
      'Núcleo',
      'Situacional'
    ])
    const situational = exported?.blocks.at(-1)
    expect(situational?.items.map((item) => item.id)).toEqual(['3026', '6676'])

    const aram = buildItemSetDocument({ ...build, mapId: 12 }, 42, { itemSets: [] }, 123)
    expect(aram.itemSets?.[0].associatedMaps).toEqual([12])
  })

  it('genera la página de runas y la marca como actual', () => {
    const page = buildRunePagePayload(runes)
    expect(page.name).toBe('App-LOL · Jinx · ADC')
    expect(page.current).toBe(true)
    expect(page.selectedPerkIds).toHaveLength(9)
    expect(page.primaryStyleId).toBe(8000)
    expect(page.subStyleId).toBe(8200)
  })

  it('rechaza builds sin objetos y campeones inválidos', () => {
    expect(() => validateItemSetExport({ ...build, championId: 0 })).toThrow()
    expect(() =>
      validateItemSetExport({
        ...build,
        starting: [],
        first: [],
        boots: [],
        core: [],
        situational: []
      })
    ).toThrow()
    expect(() => buildRunePagePayload({ ...runes, selectedPerkIds: [8005] })).toThrow()
  })
})
