import { tierLabel } from '@shared/constants'
import { INTL_LOCALE, getLocale, t } from '@shared/i18n'

const numberFormatters = new Map<string, Intl.NumberFormat>()

function numberFormatter(): Intl.NumberFormat {
  const locale = INTL_LOCALE[getLocale()]
  let formatter = numberFormatters.get(locale)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale)
    numberFormatters.set(locale, formatter)
  }
  return formatter
}

export function formatNumber(value: number): string {
  return numberFormatter().format(Math.round(value))
}

export function formatCompact(value: number): string {
  const decimal = getLocale() === 'en' ? '.' : ','
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', decimal)}M`
  if (value >= 10_000) return `${Math.round(value / 1000)}k`
  if (value >= 1_000) return `${(value / 1000).toFixed(1).replace('.', decimal)}k`
  return formatNumber(value)
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

export function formatTimer(ms: number): string {
  return formatDuration(Math.max(0, Math.ceil(ms / 1000)))
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60_000) return t('hace un momento')
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return t('hace {count} min', { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('hace {count} h', { count: hours })
  const days = Math.floor(hours / 24)
  return t('hace {count} d', { count: days })
}

export function formatRank(tier: string, division: string, leaguePoints: number): string {
  const tierName = tierLabel(tier)
  if (!division || ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier.toUpperCase())) {
    return `${tierName} · ${leaguePoints} LP`
  }
  return `${tierName} ${division} · ${leaguePoints} LP`
}

export function formatWinrate(wins: number, losses: number): string {
  const total = wins + losses
  if (total === 0) return '—'
  return `${Math.round((wins / total) * 100)}%`
}

export function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[\s\S]*?\}\}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
