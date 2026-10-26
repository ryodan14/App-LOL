import { app } from 'electron'
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { DATA_LANGUAGE } from '@shared/constants'
import type {
  Champion,
  DataResult,
  Item,
  RuneRecommendation,
  RuneShard,
  StaticData,
  SummonerSpell
} from '@shared/types'
import { fetchJson } from './http'

const DDRAGON = 'https://ddragon.leagueoflegends.com'
const CDRAGON =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1'
const CACHE_TTL_MS = 12 * 60 * 60 * 1000

const SHARDS: RuneShard[] = [
  {
    id: 5001,
    name: 'Vida (escalado)',
    icon: `${CDRAGON}/perk-images/statmods/statmodshealthscalingicon.png`
  },
  { id: 5002, name: 'Armadura', icon: `${CDRAGON}/perk-images/statmods/statmodsarmoricon.png` },
  {
    id: 5003,
    name: 'Resistencia mágica',
    icon: `${CDRAGON}/perk-images/statmods/statmodsmagicresicon.png`
  },
  {
    id: 5005,
    name: 'Velocidad de ataque',
    icon: `${CDRAGON}/perk-images/statmods/statmodsattackspeedicon.png`
  },
  {
    id: 5007,
    name: 'Aceleración de habilidades',
    icon: `${CDRAGON}/perk-images/statmods/statmodscdrscalingicon.png`
  },
  {
    id: 5008,
    name: 'Fuerza adaptativa',
    icon: `${CDRAGON}/perk-images/statmods/statmodsadaptiveforceicon.png`
  },
  {
    id: 5010,
    name: 'Velocidad de movimiento',
    icon: `${CDRAGON}/perk-images/statmods/statmodsmovementspeedicon.png`
  },
  {
    id: 5011,
    name: 'Vida',
    icon: `${CDRAGON}/perk-images/statmods/statmodshealthplusicon.png`
  },
  {
    id: 5013,
    name: 'Tenacidad y resistencia a ralentizaciones',
    icon: `${CDRAGON}/perk-images/statmods/statmodstenacityicon.png`
  }
]

interface RawChampion {
  id: string
  key: string
  name: string
  title: string
  tags: string[]
  partype: string
  info: Champion['info']
  stats: Record<string, number>
  lore: string
  image: { full: string }
  passive: { name: string; description: string; image: { full: string } }
  spells: {
    id: string
    name: string
    description: string
    cooldown: number[]
    cost: number[]
    range: number[]
    image: { full: string }
  }[]
}

interface RawItem {
  name: string
  description: string
  plaintext: string
  gold: Item['gold']
  tags: string[]
  stats: Record<string, number>
  image: { full: string }
  maps: Record<string, boolean>
  from?: string[]
  into?: string[]
  depth?: number
  requiredChampion?: string
  inStore?: boolean
  consumed?: boolean
}

interface RawRuneTree {
  id: number
  key: string
  name: string
  icon: string
  slots: {
    runes: {
      id: number
      key: string
      name: string
      icon: string
      shortDesc: string
      longDesc?: string
    }[]
  }[]
}

interface RawSummonerSpell {
  id: string
  key: string
  name: string
  description: string
  image: { full: string }
  cooldown: number[]
}

interface RawRuneRecommendation {
  position: string
  mapId: number
  isDefaultPosition: boolean
  perkIds: number[]
  primaryPerkStyleId: number
  secondaryPerkStyleId: number
  summonerSpellIds: number[]
  recommendationId: string
}

interface RawRuneRecommendationGroup {
  championId: number
  isOverride: boolean
  runeRecommendations: RawRuneRecommendation[]
}

interface RawChampionFull {
  data: Record<string, RawChampion>
}

interface RawItems {
  data: Record<string, RawItem>
}

interface RawSummonerSpells {
  data: Record<string, RawSummonerSpell>
}

function transformChampions(raw: RawChampionFull): Champion[] {
  return Object.values(raw.data)
    .map((champion) => ({
      id: champion.id,
      key: Number(champion.key),
      name: champion.name,
      title: champion.title,
      tags: champion.tags,
      partype: champion.partype,
      info: champion.info,
      stats: champion.stats,
      image: champion.image.full,
      lore: champion.lore,
      passive: {
        name: champion.passive.name,
        description: champion.passive.description,
        image: champion.passive.image.full
      },
      spells: champion.spells.map((spell) => ({
        id: spell.id,
        name: spell.name,
        description: spell.description,
        cooldown: spell.cooldown,
        cost: spell.cost,
        range: spell.range,
        image: spell.image.full
      }))
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

function transformItems(raw: RawItems): Item[] {
  const seen = new Set<number>()
  const items: Item[] = []
  for (const [rawId, item] of Object.entries(raw.data)) {
    const id = Number(rawId)
    if (!Number.isFinite(id) || id <= 0 || id >= 100_000) continue
    if (seen.has(id)) continue
    if (item.maps?.['11'] !== true) continue
    if (item.gold?.purchasable === false || item.gold?.total <= 0) continue
    if (item.inStore === false) continue
    if (item.requiredChampion) continue
    seen.add(id)
    items.push({
      id,
      name: item.name,
      description: item.description,
      plaintext: item.plaintext,
      gold: item.gold,
      tags: item.tags ?? [],
      stats: item.stats ?? {},
      image: item.image.full,
      maps: item.maps,
      from: item.from,
      into: item.into,
      depth: item.depth,
      requiredChampion: item.requiredChampion,
      inStore: item.inStore,
      consumed: item.consumed
    })
  }
  return items.sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

function transformRuneRecommendations(
  raw: RawRuneRecommendationGroup[],
  knownChampionIds: Set<number>
): RuneRecommendation[] {
  return raw
    .filter((group) => knownChampionIds.has(group.championId))
    .flatMap((group) =>
      (group.runeRecommendations ?? []).map((recommendation) => ({
        championId: group.championId,
        position: recommendation.position,
        mapId: recommendation.mapId,
        isDefaultPosition: recommendation.isDefaultPosition,
        perkIds: recommendation.perkIds,
        primaryPerkStyleId: recommendation.primaryPerkStyleId,
        secondaryPerkStyleId: recommendation.secondaryPerkStyleId,
        summonerSpellIds: recommendation.summonerSpellIds,
        recommendationId: recommendation.recommendationId
      }))
    )
}

function transformSummonerSpells(raw: RawSummonerSpells): SummonerSpell[] {
  return Object.values(raw.data)
    .map((spell) => ({
      id: Number(spell.key),
      key: spell.id,
      name: spell.name,
      description: spell.description,
      image: spell.image.full,
      cooldown: spell.cooldown
    }))
    .filter((spell) => Number.isFinite(spell.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export async function fetchStaticData(version: string): Promise<StaticData> {
  const language = DATA_LANGUAGE
  const [championRaw, itemRaw, summonerRaw, runeTreesRaw, runeRecsRaw] = await Promise.all([
    fetchJson<RawChampionFull>(
      `${DDRAGON}/cdn/${version}/data/${language}/championFull.json`
    ),
    fetchJson<RawItems>(`${DDRAGON}/cdn/${version}/data/${language}/item.json`),
    fetchJson<RawSummonerSpells>(`${DDRAGON}/cdn/${version}/data/${language}/summoner.json`),
    fetchJson<RawRuneTree[]>(`${DDRAGON}/cdn/${version}/data/${language}/runesReforged.json`),
    fetchJson<RawRuneRecommendationGroup[]>(
      `${CDRAGON}/champion-rune-recommendations.json`
    )
  ])

  const champions = transformChampions(championRaw)
  const knownChampionIds = new Set(champions.map((champion) => champion.key))
  const runeRecs = transformRuneRecommendations(runeRecsRaw, knownChampionIds)

  return {
    patch: version,
    language,
    champions,
    items: transformItems(itemRaw),
    runeTrees: runeTreesRaw,
    runeRecs,
    summonerSpells: transformSummonerSpells(summonerRaw),
    shards: SHARDS,
    fetchedAt: Date.now()
  }
}

function cachePath(): string {
  return join(app.getPath('userData'), 'cache', `static-data-v2-${DATA_LANGUAGE}.json`)
}

function isValidCache(value: unknown): value is StaticData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<StaticData>
  return (
    typeof data.patch === 'string' &&
    typeof data.language === 'string' &&
    Array.isArray(data.champions) &&
    data.champions.length > 0 &&
    Array.isArray(data.items) &&
    data.items.length > 0 &&
    Array.isArray(data.runeTrees) &&
    Array.isArray(data.runeRecs) &&
    data.runeRecs.every(
      (recommendation) =>
        typeof recommendation.championId === 'number' &&
        typeof recommendation.position === 'string' &&
        Array.isArray(recommendation.perkIds) &&
        recommendation.perkIds.length > 0
    ) &&
    Array.isArray(data.summonerSpells)
  )
}

async function readCache(): Promise<StaticData | null> {
  try {
    const raw = await fs.readFile(cachePath(), 'utf8')
    const parsed: unknown = JSON.parse(raw)
    return isValidCache(parsed) ? parsed : null
  } catch {
    return null
  }
}

async function writeCache(data: StaticData): Promise<void> {
  const file = cachePath()
  await fs.mkdir(dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data), 'utf8')
  await fs.rename(tmp, file)
}

export class StaticDataService {
  private state: DataResult = { data: null, status: 'loading' }
  private refreshing: Promise<DataResult> | null = null
  private listeners = new Set<(result: DataResult) => void>()

  get(): DataResult {
    return this.state
  }

  subscribe(listener: (result: DataResult) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state)
      } catch (error) {
        console.error('[data] Error en listener', error)
      }
    }
  }

  async init(): Promise<void> {
    const cached = await readCache()
    if (cached) {
      this.state = { data: cached, status: 'ready' }
      this.emit()
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) return
    }
    void this.refresh(false)
  }

  async refresh(force: boolean): Promise<DataResult> {
    if (this.refreshing) return this.refreshing

    this.refreshing = (async () => {
      try {
        if (this.state.data && !force) {
          const age = Date.now() - this.state.data.fetchedAt
          if (age < CACHE_TTL_MS) return this.state
        }

        const versions = await fetchJson<string[]>(`${DDRAGON}/api/versions.json`)
        const latest = versions[0]
        if (!latest) throw new Error('Data Dragon no devolvió versiones')

        const cached = this.state.data
        if (cached && cached.patch === latest && !force) {
          const updated = { ...cached, fetchedAt: Date.now() }
          this.state = { data: updated, status: 'ready' }
          this.emit()
          await writeCache(updated)
          return this.state
        }

        if (!this.state.data) {
          this.state = { data: null, status: 'loading' }
          this.emit()
        }

        const data = await fetchStaticData(latest)
        this.state = { data, status: 'ready' }
        await writeCache(data)
        this.emit()
        return this.state
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudieron cargar los datos del juego'
        if (this.state.data) {
          this.state = { ...this.state, status: 'ready', error: message }
        } else {
          this.state = { data: null, status: 'error', error: message }
        }
        this.emit()
        return this.state
      } finally {
        this.refreshing = null
      }
    })()

    return this.refreshing
  }
}
