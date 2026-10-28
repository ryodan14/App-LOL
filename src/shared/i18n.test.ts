import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, EN, PT, getLocale, setLocale, t } from './i18n'

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry) ? [path] : []
  })
}

function placeholders(value: string): string {
  return [...value.matchAll(/\{(\w+)\}/g)]
    .map((match) => match[1])
    .sort()
    .join(',')
}

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

  it('keeps English and Portuguese tables in sync', () => {
    expect(Object.keys(EN).sort()).toEqual(Object.keys(PT).sort())
    expect(Object.values(EN).every(Boolean)).toBe(true)
    expect(Object.values(PT).every(Boolean)).toBe(true)
    for (const [source, translation] of Object.entries(EN)) {
      expect(placeholders(translation), source).toBe(placeholders(source))
    }
    for (const [source, translation] of Object.entries(PT)) {
      expect(placeholders(translation), source).toBe(placeholders(source))
    }
  })

  it('translates every literal key used in the source', () => {
    const root = resolve('src')
    const missing: string[] = []
    for (const file of sourceFiles(root)) {
      if (file === join(root, 'shared', 'i18n.ts')) continue
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/\bt\(\s*'([^']*)'/g)) {
        const key = match[1]
        if (!(key in EN)) missing.push(`${relative(root, file)}: ${key}`)
        if (!(key in PT)) missing.push(`${relative(root, file)}: ${key}`)
      }
    }
    expect(missing).toEqual([])
  })
})
