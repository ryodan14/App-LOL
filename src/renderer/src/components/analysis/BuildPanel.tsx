import { Coins, Info, ShieldCheck, Sparkles } from 'lucide-react'
import type { BuildItem, BuildPlan, CounterNeed } from '@shared/analysis'
import { Badge } from '@renderer/components/ui/Badge'
import { ItemIcon } from '@renderer/components/lol/ItemIcon'
import { roleLabel } from '@shared/constants'
import { formatNumber } from '@renderer/lib/format'
import { cn } from '@renderer/lib/cn'
import { t } from '@shared/i18n'

function NeedBadge({ need }: { need: CounterNeed }): React.JSX.Element {
  const tone = need.priority === 'ALTA' ? 'danger' : need.priority === 'MEDIA' ? 'gold' : 'neutral'
  return (
    <Badge tone={tone} className="max-w-full">
      <span className="truncate">{need.label}</span>
    </Badge>
  )
}

function ItemRow({ entry, featured = false }: { entry: BuildItem; featured?: boolean }): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border border-line/80 bg-base-900/45 p-2',
        featured && 'border-gold-400/20 bg-gold-400/[0.04]'
      )}
    >
      <ItemIcon item={entry.item} size={featured ? 'lg' : 'md'} />
      <div className="min-w-0">
        <p className="truncate text-[0.78rem] font-semibold text-ink-100">{entry.item.name}</p>
        <p className="mt-0.5 line-clamp-2 text-[0.65rem] leading-snug text-ink-500">{entry.reason}</p>
      </div>
      <span className="ml-auto shrink-0 text-[0.62rem] tabular-nums text-ink-600">
        {formatNumber(entry.item.gold.total)}g
      </span>
    </div>
  )
}

function ItemGrid({ items, title }: { items: BuildItem[]; title: string }): React.JSX.Element {
  return (
    <div>
      <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
        {title}
      </p>
      {items.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((entry) => (
            <ItemRow key={entry.item.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="text-[0.72rem] text-ink-500">{t('Sin objetos para este bloque.')}</p>
      )}
    </div>
  )
}

export function BuildPanel({ build }: { build: BuildPlan }): React.JSX.Element {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{t('Build adaptada')}</p>
          <h2 className="font-display mt-1 text-xl font-semibold text-ink-100">
            {build.archetypeLabel}
          </h2>
          <p className="mt-1 text-[0.78rem] text-ink-400">
            {roleLabel(build.role)} ·{' '}
            {t('{gold} de oro estimado', { gold: formatNumber(build.totalGold) })}
          </p>
        </div>
        <Badge tone="gold">
          <Coins className="h-3 w-3" /> {t('6 objetos')}
        </Badge>
      </div>

      {build.needs.length > 0 && (
        <div className="rounded-xl border border-line bg-base-900/45 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-300" /> {t('Necesidades detectadas')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {build.needs.slice(0, 6).map((need) => (
              <NeedBadge key={need.id} need={need} />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
          {t('Iniciales')}
        </p>
        <div className="flex flex-wrap gap-2">
          {build.starting.map((entry, index) => (
            <div
              key={`${entry.item.id}-${index}`}
              className="flex items-center gap-2 rounded-xl border border-line bg-base-900/45 p-1.5 pr-3"
            >
              <ItemIcon item={entry.item} size="sm" />
              <span className="text-[0.7rem] font-medium text-ink-200">{entry.item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {build.boots && (
        <div>
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
            {t('Botas')}
          </p>
          <ItemRow entry={build.boots} featured />
        </div>
      )}

      <ItemGrid items={build.core} title={t('Núcleo')} />
      <ItemGrid items={build.situational} title={t('Situacionales')} />

      <div className="rounded-xl border border-line bg-base-900/35 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
          <Sparkles className="h-3.5 w-3.5 text-gold-300" /> {t('Cómo leerla')}
        </p>
        <ul className="space-y-1">
          {build.notes.map((note) => (
            <li key={note} className="flex gap-1.5 text-[0.7rem] leading-relaxed text-ink-400">
              <Info className="mt-0.5 h-3 w-3 shrink-0 text-ink-600" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
