import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, getLocale, setLocale, t } from './i18n'

describe('i18n', () => {
  afterEach(() => setLocale(DEFAULT_LOCALE))

  it('keeps Spanish by default', () => {
    expect(getLocale()).toBe('es')
    expect(t('Ajustes')).toBe('Ajustes')
  })

  it('translates and interpolates in English', () => {
    setLocale('en')
    expect(t('Ajustes')).toBe('Settings')
    expect(t('Parche {patch}', { patch: '15.1' })).toBe('Patch 15.1')
  })

  it('translates and interpolates in Portuguese', () => {
    setLocale('pt')
    expect(t('Ajustes')).toBe('Configurações')
    expect(t('Nivel {level}', { level: 30 })).toBe('Nível 30')
  })

  it('falls back to the source text when a key is missing', () => {
    setLocale('en')
    expect(t('texto sin traducción')).toBe('texto sin traducción')
  })
})
