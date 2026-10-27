import { describe, expect, it } from 'vitest'
import {
  analyzeTeam,
  createAnalysisIndex,
  generateBuild,
  generateRunePlan,
  generateCounterTips
} from '@shared/analysis'
import { fetchJson } from './http'
import { fetchStaticData } from './staticData'

const live = process.env.LIVE_DATA === '1'

describe.skipIf(!live)('carga real de datos de Riot', () => {
  it(
    'descarga y transforma campeones, objetos y runas',
    async () => {
      const versions = await fetchJson<string[]>(
        'https://ddragon.leagueoflegends.com/api/versions.json'
      )
      const data = await fetchStaticData(versions[0], 'es')

      expect(data.champions.length).toBeGreaterThan(160)
      expect(data.items.length).toBeGreaterThan(200)
      expect(data.runeTrees.length).toBe(5)
      expect(data.runeRecs.length).toBeGreaterThan(100)
      expect(data.summonerSpells.length).toBeGreaterThan(10)
      expect(
        data.runeRecs.every(
          (recommendation) =>
            typeof recommendation.position === 'string' && recommendation.perkIds.length > 0
        )
      ).toBe(true)

      const jinx = data.champions.find((champion) => champion.id === 'Jinx')
      expect(jinx).toBeTruthy()
      expect(
        data.runeRecs.some(
          (recommendation) =>
            recommendation.championId === jinx?.key &&
            recommendation.mapId === 11 &&
            recommendation.position === 'BOTTOM'
        )
      ).toBe(true)

      const index = createAnalysisIndex(data)
      const enemies = ['Darius', 'Ahri', 'Leona', 'Jinx', 'Lulu']
        .map((name) => data.champions.find((champion) => champion.name === name))
        .filter((champion): champion is NonNullable<typeof champion> => Boolean(champion))
      const team = analyzeTeam(enemies)
      expect(team.needs.length).toBeGreaterThan(0)

      const build = generateBuild(jinx!, 'BOTTOM', enemies, index)
      expect(build.core.length).toBe(3)
      expect(build.boots).toBeTruthy()
      expect(build.starting.length).toBeGreaterThan(0)

      const runes = generateRunePlan(jinx!, 'BOTTOM', index)
      expect(runes?.primaryRunes.length).toBeGreaterThan(0)
      expect(runes?.summonerSpells.length).toBeGreaterThan(0)

      const counters = generateCounterTips(jinx!, index, jinx!, 'BOTTOM')
      expect(counters.tips.length).toBeGreaterThan(0)

      const ahri = data.champions.find((champion) => champion.id === 'Ahri')
      expect(ahri?.spells).toHaveLength(4)
      expect(ahri?.title.length).toBeGreaterThan(0)

      const infinityEdge = data.items.find((item) => item.id === 3031)
      expect(infinityEdge?.name.length).toBeGreaterThan(0)

      console.log(
        `[datos] ${data.patch}: ${data.champions.length} campeones, ${data.items.length} objetos, ${data.runeRecs.length} recomendaciones de runas`
      )
    },
    180_000
  )
})
