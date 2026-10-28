import { describe, expect, it } from 'vitest'
import {
  parseBoolean,
  parseExternalUrl,
  parseItemSetExport,
  parseRuneExport,
  parseSettingsPatch
} from './ipcValidation'

const itemSet = {
  championId: 222,
  championName: 'Jinx',
  role: 'BOTTOM',
  mapId: 11,
  starting: [1055, 2003],
  first: [6672],
  boots: [3006],
  core: [3031, 3036],
  situational: [3026]
}

const runes = {
  championId: 222,
  championName: 'Jinx',
  role: 'BOTTOM',
  primaryStyleId: 8000,
  subStyleId: 8200,
  selectedPerkIds: [8005, 8009, 9104, 8014, 8304, 8347, 5005, 5008, 5011]
}

describe('validación IPC', () => {
  it('acepta ajustes conocidos y rechaza claves o valores inválidos', () => {
    expect(parseSettingsPatch({ language: 'en', overlayScale: 0.9 })).toEqual({
      language: 'en',
      overlayScale: 0.9
    })
    expect(() => parseSettingsPatch({ language: 'fr' })).toThrow()
    expect(() => parseSettingsPatch({ overlayScale: 0.5 })).toThrow()
    expect(() => parseSettingsPatch({ overlayEnabled: 'true' })).toThrow()
    expect(() => parseSettingsPatch({ unknown: true })).toThrow()
    expect(() => parseSettingsPatch({ manualLcuPort: 70000 })).toThrow()
  })

  it('valida conjuntos de objetos y páginas de runas', () => {
    expect(parseItemSetExport(itemSet)).toMatchObject({ championId: 222, mapId: 11 })
    expect(() => parseItemSetExport({ ...itemSet, championId: 0 })).toThrow()
    expect(() => parseItemSetExport({ ...itemSet, role: 'ADC' })).toThrow()
    expect(() => parseItemSetExport({ ...itemSet, starting: [0] })).toThrow()
    expect(() =>
      parseItemSetExport({
        ...itemSet,
        starting: [],
        first: [],
        boots: [],
        core: [],
        situational: []
      })
    ).toThrow()
    expect(parseRuneExport(runes).selectedPerkIds).toHaveLength(9)
    expect(() => parseRuneExport({ ...runes, selectedPerkIds: [8005] })).toThrow()
    expect(() => parseRuneExport({ ...runes, primaryStyleId: 0 })).toThrow()
  })

  it('solo permite URLs http o https sin credenciales', () => {
    expect(parseExternalUrl('https://github.com/ryodan14/App-LOL')).toBe(
      'https://github.com/ryodan14/App-LOL'
    )
    expect(() => parseExternalUrl('file:///C:/Windows/System32')).toThrow()
    expect(() => parseExternalUrl('javascript:alert(1)')).toThrow()
    expect(() => parseExternalUrl('https://user:pass@example.com')).toThrow()
    expect(() => parseExternalUrl(42)).toThrow()
    expect(parseBoolean(true)).toBe(true)
    expect(() => parseBoolean('true')).toThrow()
  })
})
