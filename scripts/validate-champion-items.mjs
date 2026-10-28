#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DDRAGON = 'https://ddragon.leagueoflegends.com'
const GENERATED = resolve(ROOT, 'src/shared/analysis/data/championItemGuides.generated.ts')
const CURATED = resolve(ROOT, 'src/shared/analysis/championItemGuides.ts')

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'App-LOL champion item validator' }
  })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.json()
}

const versions = await fetchJson(`${DDRAGON}/api/versions.json`)
const version = versions[0]
if (!version) throw new Error('Data Dragon no devolvió ninguna versión')
const patch = version.split('.').slice(0, 2).join('.')

const [championsRaw, itemsRaw, generatedSource, curatedSource] = await Promise.all([
  fetchJson(`${DDRAGON}/cdn/${version}/data/en_US/champion.json`),
  fetchJson(`${DDRAGON}/cdn/${version}/data/en_US/item.json`),
  readFile(GENERATED, 'utf8'),
  readFile(CURATED, 'utf8')
])

const patchChampions = new Set(Object.values(championsRaw.data).map((champion) => Number(champion.key)))
const patchItems = new Set(Object.keys(itemsRaw.data).map(Number))

const generatedStart = generatedSource.indexOf('{', generatedSource.indexOf('GENERATED_CHAMPION_ITEM_GUIDES'))
const generatedEnd = generatedSource.lastIndexOf('}')
const generated = JSON.parse(generatedSource.slice(generatedStart, generatedEnd + 1))
const generatedPatch = generatedSource.match(/GENERATED_CHAMPION_ITEMS_PATCH = '([^']+)'/)?.[1]
const generatedKeys = new Set(Object.keys(generated).map(Number))

const curatedStart = curatedSource.indexOf('const CURATED')
const curatedEnd = curatedSource.indexOf('\n}\n', curatedStart)
const curatedBlock = curatedSource.slice(curatedStart, curatedEnd)
const curatedKeys = new Set(
  [...curatedBlock.matchAll(/^ {2}(\d+): \{/gm)].map((match) => Number(match[1]))
)

const itemIds = new Set()
for (const guide of Object.values(generated)) {
  for (const entry of [guide, ...Object.values(guide.roles ?? {})]) {
    for (const bundle of entry.starting ?? []) bundle.forEach((id) => itemIds.add(id))
    for (const range of entry.ranges ?? []) range.forEach((id) => itemIds.add(id))
  }
}
const starterBlock = curatedSource.slice(
  curatedSource.indexOf('const SUPPORT_STARTING'),
  curatedSource.indexOf('const CURATED')
)
for (const match of `${curatedBlock}\n${starterBlock}`.matchAll(/\b\d{3,5}\b/g)) {
  const id = Number(match[0])
  if (id >= 1_000) itemIds.add(id)
}

const covered = new Set([...generatedKeys, ...curatedKeys])
const missingChampions = [...patchChampions].filter((key) => !covered.has(key))
const extraChampions = [...covered].filter((key) => !patchChampions.has(key))
const invalidItems = [...itemIds].filter((id) => !patchItems.has(id))
const errors = []

if (generatedPatch !== patch) {
  errors.push(`Las guías son del parche ${generatedPatch ?? 'desconocido'} y el actual es ${patch}`)
}
if (missingChampions.length > 0) {
  errors.push(`Campeones sin guía: ${missingChampions.join(', ')}`)
}
if (extraChampions.length > 0) {
  errors.push(`Campeones fuera del parche: ${extraChampions.join(', ')}`)
}
if (invalidItems.length > 0) {
  errors.push(`Objetos inexistentes: ${invalidItems.join(', ')}`)
}

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(
  `Guías válidas para ${patch}: ${covered.size} campeones, ${itemIds.size} objetos y ${Object.keys(generated).length} guías de Riot.`
)
