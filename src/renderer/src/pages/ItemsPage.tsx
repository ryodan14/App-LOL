import { useDeferredValue, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Package, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
import type { Item } from '@shared/types'
import {
  ITEM_CATEGORY_ORDER,
  itemCategory,
  itemCategoryLabelKey,
  itemStatSummary,
  type ItemCategory
} from '@shared/analysis'
import { useGameData } from '@renderer/lib/gameData'
import { useAppStore } from '@renderer/store/useAppStore'
import { Card, SectionHeading } from '@renderer/components/ui/Card'
import { EmptyState, Spinner } from '@renderer/components/ui/EmptyState'
import { Button } from '@renderer/components/ui/Button'
import { Badge } from '@renderer/components/ui/Badge'
import { ItemIcon } from '@renderer/components/lol/ItemIcon'
import { ChampionIcon } from '@renderer/components/lol/ChampionIcon'
import { formatNumber } from '@renderer/lib/format'
import { cn } from '@renderer/lib/cn'
import { t } from '@shared/i18n'

type SortMode = 'name' | 'gold-asc' | 'gold-desc'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function itemPlaintext(item: Item): string {
  return item.plaintext || ''
}

export function ItemsPage(): React.JSX.Element {
  const index = useGameData()
  const data = useAppStore((state) => state.data)
  const refreshData = useAppStore((state) => state.refreshData)
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('buscar') ?? '')
  const [category, setCategory] = useState<ItemCategory | 'all'>('all')
  const [sort, setSort] = useState<SortMode>('name')
  const deferredQuery = useDeferredValue(query)

  const categorized = useMemo(() => {
    if (!index) return []
    return index.data.items
      .filter((item) => item.maps['11'] === true)
      .map((item) => ({ item, category: itemCategory(item) }))
  }, [index])

  const categoryCounts = useMemo(() => {
    const counts = new Map<ItemCategory, number>()
    for (const entry of categorized) {
      counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1)
    }
    return counts
  }, [categorized])

  const filtered = useMemo(() => {
    const term = normalize(deferredQuery.trim())
    return categorized
      .filter((entry) => {
        if (category !== 'all' && entry.category !== category) return false
        if (!term) return true
        return (
          normalize(entry.item.name).includes(term) ||
          normalize(entry.item.plaintext).includes(term) ||
          normalize(entry.item.description).includes(term)
        )
      })
      .map((entry) => entry.item)
      .sort((a, b) => {
        if (sort === 'gold-asc') return a.gold.total - b.gold.total
        if (sort === 'gold-desc') return b.gold.total - a.gold.total
        return a.name.localeCompare(b.name, 'es')
      })
  }, [categorized, category, deferredQuery, sort])

  if (!index) {
    return (
      <Card>
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title={t('Cargando objetos')}
          description={
            data.status === 'error'
              ? t('No se pudieron cargar los objetos oficiales. Revisa tu conexión e inténtalo de nuevo.')
              : t('Estamos preparando el catálogo de objetos y sus campeones recomendados.')
          }
          action={
            data.status === 'error' ? (
              <Button
                variant="primary"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={() => void refreshData()}
              >
                {t('Reintentar')}
              </Button>
            ) : (
              <Spinner />
            )
          }
        />
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow={t('Catálogo')}
        title={t('Objetos')}
        description={t('Consulta todos los objetos del parche, sus estadísticas y para qué campeones los recomienda el juego.')}
        action={<Badge tone="gold">{t('{count} objetos', { count: filtered.length })}</Badge>}
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-base-950/45 px-3">
              <Search className="h-4 w-4 text-ink-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('Buscar objeto, estadística o texto…')}
                className="h-10 flex-1 bg-transparent text-[0.84rem] text-ink-100 outline-none placeholder:text-ink-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="hidden items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-ink-500 sm:flex">
                <SlidersHorizontal className="h-3.5 w-3.5" /> {t('Orden')}
              </span>
              <SortButton active={sort === 'name'} onClick={() => setSort('name')}>
                {t('Nombre')}
              </SortButton>
              <SortButton active={sort === 'gold-asc'} onClick={() => setSort('gold-asc')}>
                {t('Precio ↑')}
              </SortButton>
              <SortButton active={sort === 'gold-desc'} onClick={() => setSort('gold-desc')}>
                {t('Precio ↓')}
              </SortButton>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryButton active={category === 'all'} onClick={() => setCategory('all')}>
              {t('Todos')}
            </CategoryButton>
            {ITEM_CATEGORY_ORDER.map((item) => {
              const count = categoryCounts.get(item) ?? 0
              if (count === 0) return null
              return (
                <CategoryButton
                  key={item}
                  active={category === item}
                  onClick={() => setCategory(item)}
                >
                  {t(itemCategoryLabelKey(item))} · {count}
                </CategoryButton>
              )
            })}
          </div>
        </div>
      </Card>

      {filtered.length > 0 ? (
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} index={index} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title={t('No encontramos objetos')}
            description={t('Prueba con otro nombre, texto o quita el filtro de categoría.')}
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setCategory('all')
                }}
                className="btn btn-ghost"
              >
                {t('Limpiar filtros')}
              </button>
            }
          />
        </Card>
      )}
    </div>
  )
}

function ItemCard({
  item,
  index
}: {
  item: Item
  index: NonNullable<ReturnType<typeof useGameData>>
}): React.JSX.Element {
  const category = itemCategory(item)
  const champions = (index.championKeysByItemId.get(item.id) ?? [])
    .map((key) => index.championByKey.get(key))
    .filter((champion): champion is NonNullable<typeof champion> => Boolean(champion))
  const from = (item.from ?? [])
    .map((id) => index.itemById.get(Number(id)))
    .filter((entry): entry is Item => Boolean(entry))
  const into = (item.into ?? [])
    .map((id) => index.itemById.get(Number(id)))
    .filter((entry): entry is Item => Boolean(entry))

  return (
    <Card className="flex h-full flex-col p-3">
      <div className="flex items-start gap-3">
        <ItemIcon item={item} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-display truncate text-[0.92rem] font-semibold text-ink-100">
              {item.name}
            </h3>
            <Badge tone="neutral">{t(itemCategoryLabelKey(category))}</Badge>
          </div>
          <p className="mt-0.5 text-[0.72rem] font-semibold text-gold-300">
            {formatNumber(item.gold.total)}g
          </p>
          <p className="mt-1 line-clamp-2 text-[0.66rem] leading-relaxed text-ink-500">
            {itemPlaintext(item)}
          </p>
        </div>
      </div>

      <p className="mt-2 rounded-lg border border-line/70 bg-base-950/35 px-2 py-1.5 text-[0.66rem] leading-relaxed text-ink-400">
        {itemStatSummary(item)}
      </p>

      {(from.length > 0 || into.length > 0) && (
        <div className="mt-2 space-y-1.5 border-t border-line/70 pt-2">
          {from.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-ink-600">
                {t('Desde')}
              </span>
              <div className="flex flex-wrap gap-1">
                {from.slice(0, 4).map((entry) => (
                  <ItemIcon key={entry.id} item={entry} size="sm" />
                ))}
              </div>
            </div>
          )}
          {into.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-ink-600">
                {t('Hacia')}
              </span>
              <div className="flex flex-wrap gap-1">
                {into.slice(0, 4).map((entry) => (
                  <ItemIcon key={entry.id} item={entry} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/70 pt-2">
        {champions.length > 0 ? (
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {champions.slice(0, 4).map((champion) => (
                <Link
                  key={champion.id}
                  to={`/campeones/${champion.id}`}
                  title={champion.name}
                  className="relative rounded-md ring-1 ring-base-950"
                >
                  <ChampionIcon champion={champion} size="xs" ring={false} />
                </Link>
              ))}
            </div>
            <span className="truncate text-[0.6rem] text-ink-500">
              {champions.length === 1
                ? t('1 campeón')
                : t('{count} campeones', { count: champions.length })}
            </span>
          </div>
        ) : (
          <span className="text-[0.6rem] text-ink-600">{t('Sin campeones asociados')}</span>
        )}
        <Link
          to={`/campeones?objeto=${encodeURIComponent(item.name)}`}
          className="text-[0.6rem] font-semibold text-gold-300/80 hover:text-gold-200"
        >
          {t('Ver campeones')}
        </Link>
      </div>
    </Card>
  )
}

function SortButton({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-2 py-1.5 text-[0.64rem] font-semibold transition-colors',
        active
          ? 'border-gold-400/35 bg-gold-400/10 text-gold-200'
          : 'border-line bg-base-900/40 text-ink-400 hover:border-line-strong hover:text-ink-200'
      )}
    >
      {children}
    </button>
  )
}

function CategoryButton({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-2.5 py-1.5 text-[0.66rem] font-semibold transition-colors',
        active
          ? 'border-gold-400/35 bg-gold-400/10 text-gold-200'
          : 'border-line bg-base-900/40 text-ink-400 hover:border-line-strong hover:text-ink-200'
      )}
    >
      {children}
    </button>
  )
}
