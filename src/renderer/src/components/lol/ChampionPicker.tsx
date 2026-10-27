import { useMemo, useState } from 'react'
import { Check, Plus, Search, X } from 'lucide-react'
import type { Champion } from '@shared/types'
import { useGameData } from '@renderer/lib/gameData'
import { ChampionIcon } from './ChampionIcon'
import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function ChampionPicker({
  value,
  onChange,
  excludeIds = [],
  max = 5,
  label = 'Añadir rival'
}: {
  value: string[]
  onChange: (ids: string[]) => void
  excludeIds?: string[]
  max?: number
  label?: string
}): React.JSX.Element | null {
  const index = useGameData()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = useMemo(
    () => value.map((id) => index?.championById.get(id)).filter((champion): champion is Champion => Boolean(champion)),
    [value, index]
  )

  const filtered = useMemo(() => {
    if (!index) return []
    const excluded = new Set([...value, ...excludeIds])
    const term = normalize(query.trim())
    return index.champions
      .filter((champion) => !excluded.has(champion.id))
      .filter((champion) => {
        if (!term) return true
        return (
          normalize(champion.name).includes(term) ||
          normalize(champion.title).includes(term) ||
          champion.id.toLowerCase().includes(term)
        )
      })
      .slice(0, 36)
  }, [index, value, excludeIds, query])

  if (!index) return null

  const add = (id: string): void => {
    if (value.includes(id) || value.length >= max) return
    onChange([...value, id])
  }

  const remove = (id: string): void => {
    onChange(value.filter((item) => item !== id))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((champion) => (
          <span
            key={champion.id}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-base-900/60 py-1 pl-1 pr-2"
          >
            <ChampionIcon champion={champion} size="xs" />
            <span className="text-[0.7rem] font-medium text-ink-200">{champion.name}</span>
            <button
              type="button"
              onClick={() => remove(champion.id)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-ink-500 hover:bg-base-700 hover:text-ink-100"
              aria-label={`Quitar a ${champion.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {value.length < max && (
          <Button
            size="sm"
            variant={open ? 'ghost' : 'quiet'}
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setOpen((current) => !current)}
          >
            {label} ({value.length}/{max})
          </Button>
        )}
        {value.length > 0 && (
          <Button size="sm" variant="quiet" onClick={() => onChange([])}>
            Limpiar
          </Button>
        )}
      </div>

      {open && (
        <Card className="mt-3 p-3" padded={false}>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-base-950/50 px-3">
            <Search className="h-3.5 w-3.5 text-ink-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar campeón…"
              className="h-9 flex-1 bg-transparent text-[0.78rem] text-ink-100 outline-none placeholder:text-ink-500"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[0.68rem] font-semibold text-gold-300 hover:text-gold-200"
            >
              Listo
            </button>
          </div>

          <div className="mt-3 grid max-h-[19rem] grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3">
            {filtered.map((champion) => {
              const isSelected = value.includes(champion.id)
              return (
                <button
                  key={champion.id}
                  type="button"
                  onClick={() => add(champion.id)}
                  className="flex items-center gap-2 rounded-lg border border-transparent p-1.5 text-left hover:border-line hover:bg-base-800/60"
                >
                  <ChampionIcon champion={champion} size="xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.7rem] font-medium text-ink-200">
                      {champion.name}
                    </span>
                    <span className="block truncate text-[0.58rem] text-ink-500">
                      {champion.title}
                    </span>
                  </span>
                  {isSelected && <Check className="h-3 w-3 text-teal-300" />}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <p className="col-span-full py-6 text-center text-[0.72rem] text-ink-500">
                No encontramos campeones con esa búsqueda.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
