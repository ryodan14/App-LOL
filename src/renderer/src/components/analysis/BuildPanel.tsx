import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Coins, Info, ShieldCheck, Sparkles, Swords } from 'lucide-react'
import type { BuildGuide, BuildItem, BuildPlan, CounterNeed, SkillOrder } from '@shared/analysis'
import type { LcuExportResult } from '@shared/types'
import { Badge } from '@renderer/components/ui/Badge'
import { ItemIcon } from '@renderer/components/lol/ItemIcon'
import { SpellIcon } from '@renderer/components/lol/SpellIcon'
import { roleLabel } from '@shared/constants'
import { formatNumber } from '@renderer/lib/format'
import { cn } from '@renderer/lib/cn'
import { t } from '@shared/i18n'
import { LcuExportButton } from './LcuExportButton'

function NeedBadge({ need }: { need: CounterNeed }): React.JSX.Element {
  const tone = need.priority === 'ALTA' ? 'danger' : need.priority === 'MEDIA' ? 'gold' : 'neutral'
  return (
    <Badge tone={tone} className="max-w-full">
      <span className="truncate">{need.label}</span>
    </Badge>
  )
}

function ItemRow({
  entry,
  featured = false,
  step,
  label
}: {
  entry: BuildItem
  featured?: boolean
  step?: number
  label?: string
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border border-line/80 bg-base-900/45 p-2',
        featured && 'border-gold-400/25 bg-gold-400/[0.05]'
      )}
    >
      {step !== undefined && (
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.62rem] font-bold tabular-nums',
            featured
              ? 'border-gold-400/40 bg-gold-400/10 text-gold-200'
              : 'border-line bg-base-950/60 text-ink-500'
          )}
        >
          {step}
        </span>
      )}
      <ItemIcon item={entry.item} size={featured ? 'lg' : 'md'} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-[0.78rem] font-semibold text-ink-100">{entry.item.name}</p>
          {featured && label && (
            <span className="rounded-md border border-gold-400/25 bg-gold-400/10 px-1 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-gold-200">
              {label}
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[0.65rem] leading-snug text-ink-500">{entry.reason}</p>
      </div>
      <span className="ml-auto shrink-0 text-[0.62rem] tabular-nums text-ink-600">
        {formatNumber(entry.item.gold.total)}g
      </span>
    </div>
  )
}

function GuideSection({ guide }: { guide: BuildGuide }): React.JSX.Element | null {
  if (guide.items.length === 0) return null

  const sourceLabel =
    guide.source === 'riot'
      ? t('Datos del juego')
      : guide.source === 'curated'
        ? t('Build curada')
        : t('Por arquetipo')
  const sourceNote =
    guide.source === 'riot'
      ? t('Objetos recomendados por el cliente del juego. La build final se ajusta a la composición enemiga.')
      : guide.source === 'curated'
        ? t('Riot no publica recomendaciones para este campeón en el parche actual; esta build está curada por App-LOL.')
        : t('Sin guía específica: la selección se genera por arquetipo, rol y estadísticas oficiales.')

  return (
    <div className="rounded-xl border border-line bg-base-900/45 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
          <Sparkles className="h-3.5 w-3.5 text-gold-300" /> {t('Objetos recomendados')}
        </p>
        <Badge tone={guide.source === 'riot' ? 'teal' : 'gold'}>{sourceLabel}</Badge>
      </div>
      <p className="mb-2.5 text-[0.68rem] leading-relaxed text-ink-500">{sourceNote}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {guide.items.map((entry) => (
          <Link
            key={entry.item.id}
            to={`/objetos?buscar=${encodeURIComponent(entry.item.name)}`}
            className="flex min-w-0 flex-col items-center gap-1 rounded-lg border border-line/70 bg-base-950/35 p-1.5 text-center transition-colors hover:border-gold-400/30 hover:bg-gold-400/[0.04]"
            title={entry.item.name}
          >
            <ItemIcon item={entry.item} size="md" />
            <span className="line-clamp-2 text-[0.58rem] font-medium leading-tight text-ink-300">
              {entry.item.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function PurchaseOrder({ build }: { build: BuildPlan }): React.JSX.Element {
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
          <Swords className="h-3.5 w-3.5 text-gold-300" /> {t('Orden de compra')}
        </p>
        <span className="text-[0.62rem] text-ink-600">
          {t('{count} objetos', { count: build.purchaseOrder.length })}
        </span>
      </div>
      <p className="mb-2 text-[0.68rem] leading-relaxed text-ink-500">
        {t('El primer completado es tu pico de poder. La salida de línea busca ganar el intercambio inicial.')}
      </p>
      {build.purchaseOrder.length > 0 ? (
        <div className="space-y-2">
          {build.purchaseOrder.map((entry, index) => (
            <ItemRow
              key={`${entry.item.id}-${index}`}
              entry={entry}
              step={index + 1}
              featured={index === 0 && entry.item.id === build.firstItem?.item.id}
              label={t('Primer completado')}
            />
          ))}
        </div>
      ) : (
        <p className="text-[0.72rem] text-ink-500">{t('Sin objetos para este bloque.')}</p>
      )}
    </div>
  )
}

function SkillPanel({ order }: { order: SkillOrder }): React.JSX.Element | null {
  if (order.entries.length === 0) return null

  return (
    <div className="rounded-xl border border-line bg-base-900/45 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
          <Sparkles className="h-3.5 w-3.5 text-gold-300" /> {t('Habilidades')}
        </p>
        {order.priority.length > 0 && (
          <Badge tone="teal">
            {t('Prioridad')} {order.priority.join(' > ')}
          </Badge>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {order.entries.map((entry) => (
          <div
            key={entry.key}
            className="flex items-center gap-2.5 rounded-xl border border-line/70 bg-base-950/35 p-2"
          >
            <SpellIcon image={entry.image} name={entry.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[0.72rem] font-semibold text-ink-200">
                <span className="text-gold-300">{entry.key}</span> · {entry.name}
              </p>
              <p className="mt-0.5 text-[0.62rem] text-ink-500">
                {entry.key === 'R'
                  ? t('Niveles {levels}', { levels: order.ultimateLevels.join(' / ') })
                  : entry.maxOrder
                    ? t('Máx. {order}', { order: entry.maxOrder })
                    : t('Adapta según la línea')}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[0.66rem] leading-relaxed text-ink-500">{order.note}</p>
    </div>
  )
}

export const BuildPanel = memo(function BuildPanel({
  build,
  championName
}: {
  build: BuildPlan
  championName?: string
}): React.JSX.Element {
  const exportBuild = (): Promise<LcuExportResult> => {
    if (!window.api?.lcu) {
      return Promise.resolve({ ok: false, error: t('El cliente de League no está disponible.') })
    }
    return window.api.lcu.exportItemSet({
      championId: build.championId,
      championName: championName ?? `Campeón ${build.championId}`,
      role: build.role,
      starting: build.starting.map((entry) => entry.item.id),
      first: build.firstItem ? [build.firstItem.item.id] : [],
      boots: build.boots ? [build.boots.item.id] : [],
      core: build.core.map((entry) => entry.item.id),
      situational: build.situational.map((entry) => entry.item.id)
    })
  }

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
        <div className="flex flex-col items-end gap-2">
          <Badge tone="gold">
            <Coins className="h-3 w-3" /> {t('6 objetos')}
          </Badge>
          <LcuExportButton
            idleLabel={t('Exportar build')}
            doneLabel={t('Build exportada')}
            onExport={exportBuild}
          />
        </div>
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

      <GuideSection guide={build.guide} />

      <div>
        <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
          {t('Salida de línea')}
        </p>
        {build.starting.length > 0 ? (
          <div className="space-y-2">
            {build.starting.map((entry, index) => (
              <ItemRow
                key={`${entry.item.id}-${index}`}
                entry={entry}
                featured={index === 0}
                label={index === 0 ? t('Salida de línea') : undefined}
              />
            ))}
          </div>
        ) : (
          <p className="text-[0.72rem] text-ink-500">{t('Sin objetos para este bloque.')}</p>
        )}
      </div>

      <PurchaseOrder build={build} />
      <SkillPanel order={build.skillOrder} />

      <div className="rounded-xl border border-line bg-base-900/35 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
          <Info className="h-3.5 w-3.5 text-teal-300" /> {t('Cómo leerla')}
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
})
