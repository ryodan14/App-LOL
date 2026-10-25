import { describe, expect, it } from 'vitest'
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
      const data = await fetchStaticData(versions[0])

      expect(data.champions.length).toBeGreaterThan(160)
      expect(data.items.length).toBeGreaterThan(200)
      expect(data.runeTrees.length).toBe(5)
      expect(data.runeRecs.length).toBeGreaterThan(100)
      expect(data.summonerSpells.length).toBeGreaterThan(10)

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
