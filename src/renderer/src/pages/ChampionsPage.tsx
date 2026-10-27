import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Search, SlidersHorizontal, UsersRound } from 'lucide-react'
import type { Role } from '@shared/types'
import { roleLabel, ROLE_ORDER } from '@shared/constants'
import { useGameData } from '@renderer/lib/gameData'
import { useAppStore } from '@renderer/store/useAppStore'
import { Card, SectionHeading } from '@renderer/components/ui/Card'
import { EmptyState, Spinner } from '@renderer/components/ui/EmptyState'
import { Button } from '@renderer/components/ui/Button'
import { ChampionIcon } from '@renderer/components/lol/ChampionIcon'
import { RoleMark } from '@renderer/components/lol/RoleMark'
import { Badge } from '@renderer/components/ui/Badge'
import { cn } from '@renderer/lib/cn'
import { t } from '@shared/i18n'

const TAG_LABELS: Record<string, string> = {
  Mage: 'Mago',
  Fighter: 'Luchador',
  Assassin: 'Asesino',
  Marksman: 'Tirador',
  Support: 'Soporte',
  Tank: 'Tanque'
}

const FILTER_ROLES = ROLE_ORDER.filter((role): role is Exclude<Role, 'UNKNOWN'> => role !== 'UNKNOWN')

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function ChampionsPage(): React.JSX.Element {
  const index = useGameData()
  const data = useAppStore((state) => state.data)
  const refreshData = useAppStore((state) => state.refreshData)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<Role | 'ALL'>('ALL')

  const filtered = useMemo(() => {
    if (!index) return []
    const term = normalize(query.trim())
    return index.champions.filter((champion) => {
      const matchesRole =
        role === 'ALL' || (index.rolesByChampion.get(champion.key) ?? []).includes(role)
      if (!matchesRole) return false
      if (!term) return true
      return (
        normalize(champion.name).includes(term) ||
        normalize(champion.title).includes(term) ||
        champion.id.toLowerCase().includes(term)
      )
    })
  }, [index, query, role])

  if (!index) {
    return (
      <Card>
        <EmptyState
          icon={<UsersRound className="h-6 w-6" />}
          title={t('Cargando campeones')}
          description={
            data.status === 'error'
              ? t('No se pudieron cargar los datos oficiales. Revisa tu conexión e inténtalo de nuevo.')
              : t('Estamos preparando la lista completa con builds, runas y counters.')
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
        eyebrow={t('Explorador')}
        title={t('Campeones')}
        description={t('Busca por nombre o filtra por rol. Cada ficha incluye build adaptada, runas oficiales y counters.')}
        action={<Badge tone="gold">{t('{count} campeones', { count: filtered.length })}</Badge>}
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-base-950/45 px-3">
            <Search className="h-4 w-4 text-ink-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Buscar campeón, título o id…')}
              className="h-10 flex-1 bg-transparent text-[0.84rem] text-ink-100 outline-none placeholder:text-ink-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 hidden items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-ink-500 sm:flex">
              <SlidersHorizontal className="h-3.5 w-3.5" /> {t('Rol')}
            </span>
            <RoleButton active={role === 'ALL'} onClick={() => setRole('ALL')}>
              {t('Todos')}
            </RoleButton>
            {FILTER_ROLES.map((item) => (
              <RoleButton key={item} active={role === item} onClick={() => setRole(item)}>
                {roleLabel(item)}
              </RoleButton>
            ))}
          </div>
        </div>
      </Card>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((champion) => {
            const roles = index.rolesByChampion.get(champion.key) ?? []
            return (
              <Link key={champion.id} to={`/campeones/${champion.id}`} className="group min-w-0">
                <Card interactive className="h-full overflow-hidden p-3">
                  <div className="flex items-start gap-2.5">
                    <ChampionIcon champion={champion} size="md" />
                    <div className="min-w-0">
                      <h3 className="font-display truncate text-[0.88rem] font-semibold text-ink-100 group-hover:text-gold-200">
                        {champion.name}
                      </h3>
                      <p className="truncate text-[0.62rem] text-ink-500">{champion.title}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {champion.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-line px-1.5 py-0.5 text-[0.56rem] font-medium text-ink-400"
                          >
                            {t(TAG_LABELS[tag] ?? tag)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-line/70 pt-2">
                    <div className="flex items-center gap-1.5">
                      {roles.length > 0 ? (
                        roles.slice(0, 3).map((item) => (
                          <RoleMark key={item} role={item} className="text-ink-500" />
                        ))
                      ) : (
                        <span className="text-[0.58rem] text-ink-600">{t('Sin rol recomendado')}</span>
                      )}
                    </div>
                    <span className="text-[0.58rem] font-semibold text-gold-300/80 group-hover:text-gold-200">
                      {t('Ver ficha')}
                    </span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title={t('No encontramos campeones')}
            description={t('Prueba con otro nombre o quita el filtro de rol.')}
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setRole('ALL')
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

function RoleButton({
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
        'rounded-lg border px-2.5 py-1.5 text-[0.68rem] font-semibold transition-colors',
        active
          ? 'border-gold-400/35 bg-gold-400/10 text-gold-200'
          : 'border-line bg-base-900/40 text-ink-400 hover:border-line-strong hover:text-ink-200'
      )}
    >
      {children}
    </button>
  )
}
