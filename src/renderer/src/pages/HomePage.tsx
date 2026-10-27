import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock,
  Database,
  EyeOff,
  ShieldAlert,
  Sparkles,
  Swords,
  UserRound,
  UsersRound,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react'
import { useAppStore } from '@renderer/store/useAppStore'
import { useGameData } from '@renderer/lib/gameData'
import { phaseLabel, phaseTone } from '@renderer/lib/phases'
import { formatRelativeTime } from '@renderer/lib/format'
import { championSplashUrl } from '@renderer/lib/icons'
import { Card, SectionHeading } from '@renderer/components/ui/Card'
import { Badge, StatusDot } from '@renderer/components/ui/Badge'
import { Button } from '@renderer/components/ui/Button'
import { ButtonLink } from '@renderer/components/ui/ButtonLink'
import { ChampionIcon } from '@renderer/components/lol/ChampionIcon'
import { RoleMark } from '@renderer/components/lol/RoleMark'
import { ROLE_ORDER } from '@shared/constants'
import { cn } from '@renderer/lib/cn'
import { t } from '@shared/i18n'

const FEATURED_IDS = ['Jinx', 'Ahri', 'Yasuo', 'Thresh', 'Darius', 'LeeSin', 'Kaisa', 'Lux']

const features = [
  {
    icon: Sparkles,
    title: 'Builds que se adaptan',
    description:
      'Objetos y runas recomendados según tu campeón, tu rol y la composición enemiga. Nada de builds genéricas.',
    tone: 'gold'
  },
  {
    icon: ShieldAlert,
    title: 'Counters claros',
    description:
      'Detectamos curas, escudos, CC y daño enemigo para decirte qué comprar y cómo jugar cada pelea.',
    tone: 'teal'
  },
  {
    icon: UsersRound,
    title: 'Champ select y partida',
    description:
      'La app lee tu cliente y la partida local. Ves al instante quién está en tu partida y qué te conviene.',
    tone: 'gold'
  },
  {
    icon: EyeOff,
    title: 'Cero publicidad',
    description:
      'Sin anuncios, sin cuentas, sin ruido. Solo una interfaz limpia para consultar lo que necesitas.',
    tone: 'teal'
  }
] as const

const steps = [
  {
    icon: Wifi,
    title: 'Abre League of Legends',
    description: 'La app detecta el cliente automáticamente. No necesitas pegar tokens ni configurar nada.'
  },
  {
    icon: UsersRound,
    title: 'Entra en champ select',
    description: 'Vemos los campeones de tu equipo y los rivales revelados, con sus roles y amenazas.'
  },
  {
    icon: Zap,
    title: 'Juega con ventaja',
    description: 'Build adaptada, runas oficiales, counters y objetivos en vivo en una sola pantalla.'
  }
]

export function HomePage(): React.JSX.Element {
  const index = useGameData()
  const snapshot = useAppStore((state) => state.snapshot)
  const data = useAppStore((state) => state.data)
  const settings = useAppStore((state) => state.settings)
  const initError = useAppStore((state) => state.initError)
  const reconnect = useAppStore((state) => state.reconnect)
  const refreshData = useAppStore((state) => state.refreshData)

  const featured = FEATURED_IDS.map((id) => index?.championById.get(id)).filter(Boolean)
  const heroChampion = featured[0] ?? null
  const active = snapshot.phase === 'ChampSelect' || snapshot.phase === 'InProgress'

  return (
    <div className="space-y-7">
      {initError && (
        <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
          {t('No se pudo iniciar la app: {error}', { error: initError })}
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <div className="relative min-h-[318px] overflow-hidden rounded-[1.6rem] border border-line bg-base-900/70">
          {heroChampion && settings.showSplashArt && (
            <div className="absolute inset-y-0 right-0 w-[62%] overflow-hidden">
              <img
                src={championSplashUrl(heroChampion.id)}
                alt=""
                className="h-full w-full scale-[1.04] object-cover object-[50%_22%] opacity-80"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-base-900 via-base-900/55 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-base-950/75 via-transparent to-transparent" />
            </div>
          )}
          <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between p-7 sm:p-9">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold">
                  <Sparkles className="h-3 w-3" /> {t('Sin publicidad')}
                </Badge>
                <Badge>{t('Datos oficiales de Riot')}</Badge>
              </div>
              <h2 className="font-display mt-5 text-[2.15rem] font-semibold leading-[1.06] tracking-tight text-ink-100 sm:text-[2.6rem]">
                {t('Tu partida,')}
                <br />
                <span className="text-glow-gold bg-gradient-to-r from-gold-200 via-gold-300 to-gold-500 bg-clip-text text-transparent">
                  {t('más clara.')}
                </span>
              </h2>
              <p className="mt-4 max-w-lg text-[0.88rem] leading-relaxed text-ink-300">
                {t('Builds adaptadas, counters y análisis de la composición enemiga mientras eliges campeón o juegas. Sin publicidad y sin perder tiempo.')}
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <ButtonLink to="/partida" variant="primary" icon={<Swords className="h-4 w-4" />}>
                {t('Abrir partida')}
              </ButtonLink>
              <ButtonLink
                to="/campeones"
                variant="ghost"
                icon={<UsersRound className="h-4 w-4" />}
              >
                {t('Explorar campeones')}
              </ButtonLink>
              {snapshot.phase !== 'Offline' && (
                <span className="ml-1 inline-flex items-center gap-2 text-[0.72rem] text-ink-400">
                  <StatusDot tone={phaseTone(snapshot.phase)} pulse />
                  {phaseLabel(snapshot.phase)}
                </span>
              )}
            </div>
          </div>
        </div>

        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between">
              <p className="eyebrow">{t('Estado en vivo')}</p>
              <StatusDot tone={phaseTone(snapshot.phase)} pulse={snapshot.phase !== 'Offline'} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl border',
                  snapshot.lcuConnected
                    ? 'border-ok-400/25 bg-ok-400/10 text-ok-400'
                    : 'border-line bg-base-800 text-ink-400'
                )}
              >
                {snapshot.lcuConnected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-ink-100">
                  {phaseLabel(snapshot.phase)}
                </p>
                <p className="text-[0.72rem] text-ink-500">
                  {snapshot.lcuConnected ? t('Cliente de League of Legends detectado') : t('Esperando al cliente')}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <StatusRow
                icon={<UserRound className="h-3.5 w-3.5" />}
                label={t('Invocador')}
                value={snapshot.summoner?.displayName ?? '—'}
              />
              <StatusRow
                icon={<Database className="h-3.5 w-3.5" />}
                label={t('Datos')}
                value={
                  data.status === 'ready'
                    ? t('Parche {patch}', { patch: data.data?.patch ?? '' })
                    : data.status === 'error'
                      ? t('No disponibles')
                      : t('Cargando…')
                }
              />
              <StatusRow
                icon={<Clock className="h-3.5 w-3.5" />}
                label={t('Actualizado')}
                value={formatRelativeTime(snapshot.updatedAt)}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {active ? (
              <ButtonLink
                to="/partida"
                variant="primary"
                className="w-full"
                icon={<Swords className="h-4 w-4" />}
              >
                {t('Ver {mode}', { mode: snapshot.phase === 'InProgress' ? t('partida en vivo') : t('champ select') })}
              </ButtonLink>
            ) : (
              <Button
                variant="primary"
                className="w-full"
                icon={<Wifi className="h-4 w-4" />}
                onClick={() => void reconnect()}
              >
                {t('Buscar cliente')}
              </Button>
            )}
            {data.status === 'error' && (
              <Button variant="ghost" className="w-full" onClick={() => void refreshData()}>
                {t('Reintentar datos')}
              </Button>
            )}
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading
          eyebrow={t('Todo en una pantalla')}
          title={t('Pensada para jugar, no para leer')}
          description={t('La información justa, ordenada por prioridad y lista para usar en segundos.')}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="p-5" interactive>
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl border',
                  feature.tone === 'gold'
                    ? 'border-gold-400/25 bg-gold-400/10 text-gold-300'
                    : 'border-teal-400/20 bg-teal-400/8 text-teal-300'
                )}
              >
                <feature.icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.8} />
              </span>
              <h3 className="font-display mt-4 text-[0.95rem] font-semibold text-ink-100">
                {t(feature.title)}
              </h3>
              <p className="mt-1.5 text-[0.78rem] leading-relaxed text-ink-400">
                {t(feature.description)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card className="p-6">
          <SectionHeading eyebrow={t('Empieza en 3 pasos')} title={t('Cómo funciona')} />
          <div className="mt-5 space-y-1">
            {steps.map((step, stepIndex) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-base-800 text-gold-300">
                    <step.icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  {stepIndex < steps.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
                </div>
                <div className="pb-5">
                  <p className="text-[0.86rem] font-semibold text-ink-100">{t(step.title)}</p>
                  <p className="mt-0.5 text-[0.78rem] leading-relaxed text-ink-400">
                    {t(step.description)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={t('Atajos')}
            title={t('Campeones destacados')}
            action={
              <Link to="/campeones" className="text-[0.75rem] font-semibold text-gold-300 hover:text-gold-200">
                {t('Ver todos')} <ChevronRight className="inline h-3.5 w-3.5" />
              </Link>
            }
          />
          {featured.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {featured.map((champion) => {
                if (!champion) return null
                const roles = index?.rolesByChampion.get(champion.key) ?? []
                return (
                  <Link
                    key={champion.id}
                    to={`/campeones/${champion.id}`}
                    className="group flex items-center gap-2.5 rounded-xl border border-transparent p-2 transition-colors hover:border-line hover:bg-base-800/60"
                  >
                    <ChampionIcon champion={champion} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-[0.8rem] font-semibold text-ink-200 group-hover:text-ink-100">
                        {champion.name}
                      </span>
                      <span className="block truncate text-[0.65rem] text-ink-500">
                        {roles.length > 0 ? roles.map((role) => (
                          ROLE_ORDER.includes(role) ? <RoleMark key={role} role={role} className="mr-1.5" /> : null
                        )) : champion.tags[0]}
                      </span>
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2">
                  <div className="shimmer h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <div className="shimmer h-2.5 w-20 rounded" />
                    <div className="shimmer h-2 w-12 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-base-900/50 px-3 py-2.5">
            <BadgeCheck className="h-4 w-4 shrink-0 text-teal-300" />
            <p className="text-[0.7rem] leading-relaxed text-ink-400">
              {t('Builds y runas generadas con datos oficiales. Sin cuentas ni publicidad.')}
            </p>
          </div>
        </Card>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[0.65rem] text-ink-600">
        <span>{t('App-LOL no está afiliada a Riot Games. League of Legends es una marca de Riot Games, Inc.')}</span>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-ink-500 transition-colors hover:text-gold-300"
          onClick={() => void window.api.external.open('https://developer.riotgames.com/')}
        >
          {t('Fuentes de datos')} <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

function StatusRow({
  icon,
  label,
  value
}: {
  icon: React.ReactNode
  label: string
  value: string
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 text-[0.74rem]">
      <span className="inline-flex items-center gap-1.5 text-ink-500">
        {icon} {label}
      </span>
      <span className="truncate font-medium text-ink-300">{value}</span>
    </div>
  )
}
