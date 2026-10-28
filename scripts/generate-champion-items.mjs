#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CDRAGON = 'https://raw.communitydragon.org/latest'
const SUMMARY_URL = `${CDRAGON}/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json`
const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/shared/analysis/data/championItemGuides.generated.ts'
)
const CONCURRENCY = 8

const POSITIONS = {
  top: 'TOP',
  jungle: 'JUNGLE',
  middle: 'MIDDLE',
  mid: 'MIDDLE',
  bottom: 'BOTTOM',
  utility: 'UTILITY',
  support: 'UTILITY'
}

function normalizePosition(value) {
  if (!value) return null
  return POSITIONS[String(value).toLowerCase()] ?? null
}

function normalizeItems(items) {
  const seen = new Set()
  const result = []
  for (const raw of items ?? []) {
    const id = Number(String(raw).split('/').pop())
    if (!Number.isInteger(id) || id <= 0 || id >= 100_000) continue
    if (seen.has(id)) continue
    seen.add(id)
    result.push(id)
  }
  return result
}

function normalizeContexts(overrides) {
  const defaultContext = []
  const byRole = {}

  for (const override of overrides ?? []) {
    const contexts = (override.mOverrideContexts ?? []).filter(
      (context) => context.mMapID === 11 && context.mModeNameStringId === 'CLASSIC'
    )
    if (contexts.length === 0) continue

    const starting = (override.StartingItemBundles ?? [])
      .map((bundle) => normalizeItems(bundle.items))
      .filter((bundle) => bundle.length > 0)
    const ranges = (override.mRecItemRanges ?? [])
      .map((range) => normalizeItems(range.items))
      .filter((range) => range.length > 0)
    if (starting.length === 0 && ranges.length === 0) continue

    for (const context of contexts) {
      const role = normalizePosition(context.mPosition)
      const entry = { starting, ranges }
      if (role) {
        byRole[role] = mergeEntry(byRole[role], entry)
      } else {
        defaultContext.push(entry)
      }
    }
  }

  const mergedDefault = defaultContext.reduce((acc, entry) => mergeEntry(acc, entry), null)
  return { default: mergedDefault, roles: byRole }
}

function mergeEntry(current, next) {
  if (!current) return { starting: next.starting, ranges: next.ranges }
  return {
    starting: [...current.starting, ...next.starting],
    ranges: current.ranges.length > 0 ? current.ranges : next.ranges
  }
}

function findOverrideSets(value, found = []) {
  if (!value || typeof value !== 'object') return found
  if (Array.isArray(value)) {
    for (const entry of value) findOverrideSets(entry, found)
    return found
  }
  if (value.__type === 'ItemRecommendationOverrideSet') found.push(value)
  for (const entry of Object.values(value)) findOverrideSets(entry, found)
  return found
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'App-LOL champion item generator' }
  })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.json()
}

async function fetchChampion(champion) {
  const alias = champion.alias.toLowerCase()
  const url = `${CDRAGON}/game/data/characters/${alias}/${alias}.bin.json`
  const data = await fetchJson(url)
  const overrideSets = findOverrideSets(data)
  if (overrideSets.length === 0) return null

  const overrides = overrideSets.flatMap((set) => set.mOverrides ?? [])
  const { default: fallback, roles } = normalizeContexts(overrides)
  if (!fallback && Object.keys(roles).length === 0) return null

  const result = { source: 'riot' }
  if (fallback) {
    result.starting = fallback.starting
    result.ranges = fallback.ranges
  }
  const normalizedRoles = {}
  for (const [role, entry] of Object.entries(roles)) {
    normalizedRoles[role] = { starting: entry.starting, ranges: entry.ranges }
  }
  if (Object.keys(normalizedRoles).length > 0) result.roles = normalizedRoles
  return result
}

async function mapLimit(values, limit, mapper) {
  const results = new Array(values.length)
  let index = 0
  async function worker() {
    while (index < values.length) {
      const current = index++
      results[current] = await mapper(values[current])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker))
  return results
}

const summary = await fetchJson(SUMMARY_URL)
const champions = summary.filter((champion) => champion.id > 0 && champion.id < 60_000)

const guides = {}
let fetched = 0

await mapLimit(champions, CONCURRENCY, async (champion) => {
  try {
    const guide = await fetchChampion(champion)
    if (guide) guides[champion.id] = guide
  } catch (error) {
    console.warn(`No se pudo leer ${champion.alias}: ${error.message}`)
  } finally {
    fetched += 1
    if (fetched % 25 === 0) console.log(`${fetched}/${champions.length}`)
  }
})

const sorted = Object.fromEntries(
  Object.entries(guides).sort(([left], [right]) => Number(left) - Number(right))
)
const body = `// Archivo generado por scripts/generate-champion-items.mjs. No editar a mano.
// Fuente: datos del juego publicados por Riot Games en CommunityDragon.
import type { ChampionItemGuideData } from '../championItemTypes'

export const GENERATED_CHAMPION_ITEM_GUIDES: Record<number, ChampionItemGuideData> = ${JSON.stringify(
  sorted,
  null,
  2
)}
`

await mkdir(dirname(OUTPUT), { recursive: true })
await writeFile(OUTPUT, body, 'utf8')
console.log(`Guías escritas: ${Object.keys(sorted).length} en ${OUTPUT}`)
