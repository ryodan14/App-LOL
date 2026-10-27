import { useEffect, useState } from 'react'
import {
  Award,
  Flame,
  RefreshCw,
  ShieldQuestion,
  Sparkles,
  Trophy,
  UserRound,
  WifiOff
} from 'lucide-react'
import type { LcuAccount, LcuMastery, LcuRank } from '@shared/types'
import { queueLabel } from '@shared/constants'
import { useAppStore } from '@renderer/store/useAppStore'
import { useGameData } from '@renderer/lib/gameData'
import { profileIconUrl } from '@renderer/lib/icons'
import { formatCompact, formatNumber, formatRank, formatRelativeTime, formatWinrate } from '@renderer/lib/format'
import { Card, SectionHeading } from '@renderer/components/ui/Card'
import { EmptyState, Spinner } from '@renderer/components/ui/EmptyState'
import { Button } from '@renderer/components/ui/Button'
import { ButtonLink } from '@renderer/components/ui/ButtonLink'
import { Badge } from '@renderer/components/ui/Badge'
import { ChampionIcon } from '@renderer/components/lol/ChampionIcon'
import { cn } from '@renderer/lib/cn'
import { t } from '@shared/i18n'

const TIER_STYLES: Record<string, string> = {
  IRON: 'border-ink-500/25 bg-ink-500/[0.06] text-ink-300',
  BRONZE: 'border-orange-700/35 bg-orange-700/[0.08] text-orange-300',
  SILVER: 'border-slate-400/25 bg-slate-400/[0.07] text-slate-200',
  GOLD: 'border-gold-400/35 bg-gold-400/[0.09] text-gold-200',
  PLATINUM: 'border-teal-400/30 bg-teal-400/[0.08] text-teal-200',
  EMERALD: 'border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300',
  DIAMOND: 'border-sky-400/30 bg-sky-400/[0.08] text-sky-300',
  MASTER: 'border-purple-400/30 bg-purple-400/[0.08] text-purple-300',
  GRANDMASTER: 'border-danger-400/30 bg-danger-500/[0.08] text-danger-400',
  CHALLENGER: 'border-cyan-300/40 bg-cyan-300/[0.09] text-cyan-200'
}

function winrate(rank: LcuRank): number {
  const total = rank.wins + rank.losses
  return total > 0 ? Math.round((rank.wins / total) * 100) : 0
}

function ProfileAvatar({ account }: { account: LcuAccount }): React.JSX.Element {
  const index = useGameData()
  const [failed, setFailed] = useState(false)
  const src =
    index && !failed
      ? profileIconUrl(account.summoner.profileIconId, index.data.patch)
      : ''

  return (
    <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gold-400/30 bg-base-800 shadow-[0_0_40px_-12px_rgba(212,184,122,0.6)]">
      <UserRound className="h-8 w-8 text-gold-300/70" />
      {src && (
        <img
          src={src}
          alt={t('Icono de {name}', { name: account.summoner.displayName })}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          onError={() => setFailed(true)}
        />
      )}
      <span className="absolute inset-x-0 bottom-0 bg-base-950/85 py-0.5 text-center font-mono text-[0.62rem] font-bold text-gold-200">
        {account.summoner.summonerLevel}
      </span>
    </span>
  )
}

function RankCard({ rank }: { rank: LcuRank }): React.JSX.Element {
  const rate = winrate(rank)
  const tone = TIER_STYLES[rank.tier.toUpperCase()] ?? TIER_STYLES.IRON
  return (
    <div className={cn('rounded-xl border p-3.5', tone)}>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.68rem] font-semibold text-ink-300">
          <Trophy className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{queueLabel(rank.queueType)}</span>
        </span>
        {rank.hotStreak && (
          <span className="inline-flex items-center gap-1 text-[0.58rem] font-semibold text-gold-300">
            <Flame className="h-3 w-3" /> {t('racha')}
          </span>
        )}
      </div>
      <p className="font-display mt-2 text-[1.02rem] font-semibold text-ink-100">
        {formatRank(rank.tier, rank.division, rank.leaguePoints)}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-base-950/55">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 transition-[width] duration-500"
          style={{ width: `${rate}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[0.62rem] text-ink-400">
        <span>
          {t('{wins}V · {losses}D', { wins: formatNumber(rank.wins), losses: formatNumber(rank.losses) })}
        </span>
        <span className="font-semibold text-ink-300">{formatWinrate(rank.wins, rank.losses)} WR</span>
      </div>
    </div>
  )
}

function MasteryRow({ mastery }: { mastery: LcuMastery }): React.JSX.Element {
  const index = useGameData()
  const champion = index?.championByKey.get(mastery.championId) ?? null
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-line/80 bg-base-950/30 p-2">
      <ChampionIcon champion={champion} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.74rem] font-semibold text-ink-100">
          {champion?.name ?? t('Campeón #{id}', { id: mastery.championId })}
        </p>
        <p
          className="mt-0.5 truncate text-[0.6rem] text-ink-500"
          title={
            mastery.lastPlayTime > 0
              ? t('{points} puntos · jugado {time}', { points: formatNumber(mastery.championPoints), time: formatRelativeTime(mastery.lastPlayTime) })
              : t('{points} puntos', { points: formatNumber(mastery.championPoints) })
          }
        >
          {t('{points} pts', { points: formatCompact(mastery.championPoints) })}
        </p>
      </div>
      <Badge tone="gold" className="shrink-0">
        M{mastery.championLevel}
      </Badge>
    </div>
  )
}

function AccountLoading(): React.JSX.Element {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <Spinner className="h-6 w-6" />
        <p className="mt-4 text-[0.84rem] font-semibold text-ink-200">{t('Leyendo tu cuenta del cliente')}</p>
        <p className="mt-1 text-[0.74rem] text-ink-500">
          {t('Consultamos rango y maestría directamente desde League of Legends.')}
        </p>
      </div>
    </Card>
  )
}

export function AccountPage(): React.JSX.Element {
  const snapshot = useAppStore((state) => state.snapshot)
  const [account, setAccount] = useState<LcuAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    if (!snapshot.lcuConnected) {
      setAccount(null)
      setError(null)
      setLoading(false)
      return () => {
        active = false
      }
    }

    setLoading(true)
    setError(null)
    void window.api.account
      .get()
      .then((data) => {
        if (!active) return
        if (data) {
          setAccount(data)
          setError(null)
        } else {
          setAccount(null)
          setError(t('No pudimos leer los datos de tu cuenta. Prueba a reconectar el cliente.'))
        }
      })
      .catch((reason: unknown) => {
        if (!active) return
        setAccount(null)
        setError(reason instanceof Error ? reason.message : t('No pudimos leer los datos de tu cuenta.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [snapshot.lcuConnected, snapshot.summoner?.puuid, reloadKey])

  if (!snapshot.lcuConnected) {
    return (
      <Card>
        <EmptyState
          icon={<WifiOff className="h-6 w-6" />}
          title={t('Tu cuenta aparece cuando abres el cliente')}
          description={t('Detectamos tu invocador, rango y maestría directamente desde el cliente de League of Legends, sin pedirte la contraseña.')}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink to="/ajustes" variant="ghost">
                {t('Revisar detección del cliente')}
              </ButtonLink>
              <ButtonLink to="/" variant="quiet">
                {t('Volver al inicio')}
              </ButtonLink>
            </div>
          }
        />
      </Card>
    )
  }

  if (loading && !account) return <AccountLoading />

  if (!account) {
    return (
      <Card>
        <EmptyState
          icon={<ShieldQuestion className="h-6 w-6" />}
          title={t('No pudimos cargar tu cuenta')}
          description={error ?? t('El cliente está conectado, pero todavía no devolvió los datos de la cuenta.')}
          action={
            <Button
              variant="primary"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => setReloadKey((value) => value + 1)}
            >
              {t('Volver a intentar')}
            </Button>
          }
        />
      </Card>
    )
  }

  const ranks = [...account.ranks].sort((a, b) => {
    const order = ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR']
    return order.indexOf(a.queueType) - order.indexOf(b.queueType)
  })
  const mastery = account.mastery.slice(0, 8)
  const totalWins = ranks.reduce((total, rank) => total + rank.wins, 0)
  const totalLosses = ranks.reduce((total, rank) => total + rank.losses, 0)
  const totalGames = totalWins + totalLosses
  const overallWinrate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.6rem] border border-line bg-base-900/60 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-teal-500/8 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <ProfileAvatar account={account} />
            <div className="min-w-0">
              <p className="eyebrow">{t('Invocador')}</p>
              <h1 className="font-display mt-1 truncate text-2xl font-semibold tracking-tight text-ink-100">
                {account.summoner.displayName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge tone="gold">
                  <Sparkles className="h-3 w-3" /> {t('Nivel {level}', { level: account.summoner.summonerLevel })}
                </Badge>
                <Badge tone="teal">
                  <Award className="h-3 w-3" /> {t('Cliente local')}
                </Badge>
                <Badge>{formatRelativeTime(account.fetchedAt)}</Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            icon={<RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />}
            onClick={() => setReloadKey((value) => value + 1)}
            disabled={loading}
          >
            {t('Actualizar cuenta')}
          </Button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-[0.76rem] text-danger-400">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-5">
          <SectionHeading
            eyebrow={t('Clasificatorias')}
            title={t('Tus rangos')}
            description={t('Datos actuales de Solo/Dúo y Flex 5v5.')}
          />
          {ranks.length > 0 ? (
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {ranks.map((rank) => (
                <RankCard key={rank.queueType} rank={rank} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-line bg-base-950/35 px-4 py-8 text-center">
              <Trophy className="mx-auto h-6 w-6 text-ink-600" />
              <p className="mt-2 text-[0.8rem] font-semibold text-ink-300">{t('Sin clasificatorias este split')}</p>
              <p className="mt-1 text-[0.7rem] text-ink-500">
                {t('Cuando juegues tus primeras partidas clasificatorias, el rango aparecerá aquí.')}
              </p>
            </div>
          )}

          {totalGames > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-line bg-base-950/35 p-3">
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
                  {t('Partidas clasificatorias')}
                </p>
                <p className="font-display mt-1 text-lg font-semibold text-ink-100">
                  {formatNumber(totalGames)}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-base-950/35 p-3">
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
                  {t('Winrate combinado')}
                </p>
                <p className="font-display mt-1 text-lg font-semibold text-gold-200">
                  {overallWinrate}%
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card className="flex flex-col p-5">
          <SectionHeading eyebrow={t('Maestría')} title={t('Tus campeones')} />
          {mastery.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {mastery.map((entry) => (
                <MasteryRow key={entry.championId} mastery={entry} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-line bg-base-950/35 px-4 py-8 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-ink-600" />
              <p className="mt-2 text-[0.8rem] font-semibold text-ink-300">{t('Sin datos de maestría')}</p>
              <p className="mt-1 text-[0.7rem] text-ink-500">
                {t('El cliente todavía no devolvió tus campeones con más puntos.')}
              </p>
            </div>
          )}
          <div className="mt-auto pt-4">
            <p className="rounded-lg border border-line bg-base-950/40 px-3 py-2 text-[0.66rem] leading-relaxed text-ink-500">
              {t('La maestría se lee del cliente local. No se envía a ningún servidor externo.')}
            </p>
          </div>
        </Card>
      </div>

      <p className="flex items-center gap-1.5 rounded-xl border border-line bg-base-900/30 px-4 py-3 text-[0.68rem] text-ink-500">
        <Award className="h-3.5 w-3.5 text-gold-300/80" />
        {t('Rango y maestría son datos de tu cuenta. App-LOL no pide usuario ni contraseña.')}
      </p>
    </div>
  )
}
