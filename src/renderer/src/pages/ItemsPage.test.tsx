// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Champion, Item, StaticData } from '@shared/types'
import { t } from '@shared/i18n'
import { useAppStore } from '@renderer/store/useAppStore'
import { GameDataProvider } from '@renderer/lib/gameData'
import { ItemsPage } from './ItemsPage'

const champions: Champion[] = [
  {
    id: 'Jinx',
    key: 222,
    name: 'Jinx',
    title: 'la bala perdida',
    tags: ['Marksman'],
    partype: 'Maná',
    info: { attack: 9, defense: 2, magic: 1, difficulty: 6 },
    stats: {},
    image: 'Jinx.png',
    lore: '',
    passive: { name: '¡A toda mecha!', description: '', image: 'passive.png' },
    spells: []
  }
]

function item(id: number, name: string, tags: string[], total: number, from?: string[]): Item {
  return {
    id,
    name,
    description: '',
    plaintext: `${name} de prueba`,
    gold: { base: total, total, sell: 0, purchasable: true },
    tags,
    stats: {},
    image: `${id}.png`,
    maps: { '11': true },
    from,
    inStore: true
  }
}

const items = [
  item(3031, 'Filo infinito', ['Damage', 'CriticalStrike'], 3500, ['1038', '6672']),
  item(6672, 'Filo de Kraken', ['Damage', 'AttackSpeed'], 3000),
  item(3006, 'Grebas de berserker', ['Boots', 'AttackSpeed'], 1100),
  item(2003, 'Poción de vida', ['Consumable'], 50)
]

const data: StaticData = {
  patch: '16.21.1',
  language: 'es_ES',
  champions,
  items,
  runeTrees: [],
  runeRecs: [],
  summonerSpells: [],
  shards: [],
  fetchedAt: Date.now()
}

function renderPage(): void {
  useAppStore.setState({ data: { data, status: 'ready' } })
  render(
    <MemoryRouter initialEntries={['/objetos']}>
      <GameDataProvider>
        <ItemsPage />
      </GameDataProvider>
    </MemoryRouter>
  )
}

describe('catálogo de objetos', () => {
  beforeEach(() => {
    useAppStore.setState({ data: { data, status: 'ready' } })
  })

  afterEach(() => cleanup())

  it('filtra por texto y enlaza con los campeones recomendados', async () => {
    renderPage()

    const search = screen.getByPlaceholderText(t('Buscar objeto, estadística o texto…'))
    fireEvent.change(search, { target: { value: 'kraken' } })

    expect(await screen.findByText('Filo de Kraken')).toBeTruthy()
    expect(screen.queryByText('Filo infinito')).toBeNull()

    fireEvent.change(search, { target: { value: '' } })
    const links = await screen.findAllByRole('link', { name: t('Ver campeones') })
    expect(links.map((link) => link.getAttribute('href'))).toContain(
      '/campeones?objeto=Filo%20de%20Kraken'
    )
  })

  it('muestra el estado vacío cuando no hay coincidencias', async () => {
    renderPage()

    fireEvent.change(screen.getByPlaceholderText(t('Buscar objeto, estadística o texto…')), {
      target: { value: 'objeto inexistente' }
    })

    expect(await screen.findByText(t('No encontramos objetos'))).toBeTruthy()
  })

  it('filtra por categoría y limpia los filtros', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: `${t('Botas')} · 1` }))
    expect(await screen.findByText('Grebas de berserker')).toBeTruthy()
    expect(screen.queryByText('Filo infinito')).toBeNull()

    fireEvent.change(screen.getByPlaceholderText(t('Buscar objeto, estadística o texto…')), {
      target: { value: 'sin resultados' }
    })
    fireEvent.click(await screen.findByRole('button', { name: t('Limpiar filtros') }))

    expect(await screen.findByText('Filo infinito')).toBeTruthy()
    expect(screen.queryByText(t('No encontramos objetos'))).toBeNull()
  })
})

vi.mock('@renderer/lib/icons', () => ({
  itemIconUrl: () => '',
  championIconUrl: () => ''
}))
