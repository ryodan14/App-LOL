import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Info, RefreshCw, Sparkles, Swords, UsersRound } from 'lucide-react'
import type { Champion, Role } from '@shared/types'
import { roleLabel, ROLE_ORDER } from '@shared/constants'
import { analyzeTeam, generateBuild, generateRunePlan } from '@shared/analysis'
import { useGameData } from '@renderer/lib/gameData'
import { useAppStore } from '@renderer/store/useAppStore'
import { championSplashUrl } from '@renderer/lib/icons'
import { formatNumber, stripHtml } from '@renderer/lib/format'
import { cn } from '@renderer/lib/cn'
import { Card, SectionHeading } from '@renderer/components/ui/Card'
import { Badge } from '@renderer/components/ui/Badge'
import { Button } from '@renderer/components/ui/Button'
import { ButtonLink } from '@renderer/components/ui/ButtonLink'
import { StatBar } from '@renderer/components/ui/StatBar'
import { ChampionIcon } from '@renderer/components/lol/ChampionIcon'
import { RoleMark } from '@renderer/components/lol/RoleMark'
import { ChampionPicker } from '@renderer/components/lol/ChampionPicker'
import { PassiveIcon, SpellIcon } from '@renderer/components/lol/SpellIcon'
import { BuildPanel } from '@renderer/components/analysis/BuildPanel'
import { RunePanel } from '@renderer/components/analysis/RunePanel'
import { TeamPanel } from '@renderer/components/analysis/TeamPanel'
import { CounterPanel } from '@renderer/components/analysis/CounterPanel'
import { t } from '@shared/i18n'

const TAG_LABELS: Record<string, string> = {
  Mage: 'Mago',
  Fighter: 'Luchador',
  Assassin: 'Asesino',
  Marksman: 'Tirador',
  Support: 'Soporte',
  Tank: 'Tanque'
}

const ROLE_OPTIONS = ROLE_ORDER.filter((role): role is Exclude<Role, 'UNKNOWN'> => role !== 'UNKNOWN')

function RoleSelector({
  role,
  recommended,
  onChange
}: {
  role: Role
  recommended: Role[]
  onChange: (role: Role) => void
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ROLE_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={role === option}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.7rem] font-semibold transition-colors',
            role === option
              ? 'border-gold-400/35 bg-gold-400/10 text-gold-200'
              : 'border-line bg-base-900/40 text-ink-400 hover:border-line-strong hover:text-ink-200'
          )}
        >
          <RoleMark role={option} className="text-current" />
          {roleLabel(option)}
          {recommended.includes(option) && <span className="h-1 w-1 rounded-full bg-teal-400" />}
        </button>
      ))}
    </div>
  )
}

function AbilityRow({
  icon,
  name,
  description,
  meta
}: {
  icon: React.ReactNode
  name: string
  description: string
  meta?: string
}): React.JSX.Element {
  return (
    <div className="flex gap-3 rounded-xl border border-line/70 bg-base-900/35 p-3">
      {icon}
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-[0.8rem] font-semibold text-ink-100">{name}</p>
          {meta && <span className="text-[0.62rem] text-ink-500">{meta}</span>}
        </div>
        <p className="mt-1 whitespace-pre-line text-[0.7rem] leading-relaxed text-ink-400">
          {stripHtml(description)}
        </p>
      </div>
    </div>
  )
}

function ChampionStats({ champion }: { champion: Champion }): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div>
        <p className="eyebrow">{t('Atributos')}</p>
        <h2 className="font-display mt-1 text-lg font-semibold text-ink-100">{t('Perfil de combate')}</h2>
      </div>
      <div className="space-y-2.5">
        <StatBar label={t('Ataque')} value={champion.info.attack} max={10} tone="gold" />
        <StatBar label={t('Defensa')} value={champion.info.defense} max={10} tone="teal" />
        <StatBar label={t('Magia')} value={champion.info.magic} max={10} tone="teal" />
        <StatBar label={t('Dificultad')} value={champion.info.difficulty} max={10} tone="danger" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {champion.tags.map((tag) => (
          <Badge key={tag}>{t(TAG_LABELS[tag] ?? tag)}</Badge>
        ))}
      </div>
    </div>
  )
}

export function ChampionDetailPage(): React.JSX.Element {
  const { id } = useParams()
  const index = useGameData()
  const showSplashArt = useAppStore((state) => state.settings.showSplashArt)
  const data = useAppStore((state) => state.data)
  const refreshData = useAppStore((state) => state.refreshData)
  const [role, setRole] = useState<Role | null>(null)
  const [enemyIds, setEnemyIds] = useState<string[]>([])

  useEffect(() => {
    setRole(null)
    setEnemyIds([])
  }, [id])

  const champion = id && index ? (index.championById.get(id) ?? null) : null
  const recommended = useMemo(
    () => (champion && index ? (index.rolesByChampion.get(champion.key) ?? []) : []),
    [champion, index]
  )
  const roleOptions = recommended.length > 0 ? recommended : (['MIDDLE'] as Role[])
  const selectedRole = role && roleOptions.includes(role) ? role : (roleOptions[0] ?? 'MIDDLE')

  const enemies = useMemo(() => {
    if (!index) return []
    return enemyIds
      .map((enemyId) => index.championById.get(enemyId))
      .filter((enemy): enemy is Champion => Boolean(enemy))
  }, [enemyIds, index])

  const build = useMemo(
    () => (champion && index ? generateBuild(champion, selectedRole, enemies, index) : null),
    [champion, index, selectedRole, enemies]
  )
  const runes = useMemo(
    () => (champion && index ? generateRunePlan(champion, selectedRole, index) : null),
    [champion, index, selectedRole]
  )
  const team = useMemo(() => analyzeTeam(enemies), [enemies])

  if (!index) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-[0.9rem] font-semibold text-ink-200">
            {data.status === 'error' ? t('No pudimos cargar los datos del campeón') : t('Cargando ficha del campeón…')}
          </p>
          <p className="mt-1.5 max-w-md text-[0.78rem] text-ink-500">
            {data.status === 'error'
              ? t('Revisa tu conexión y vuelve a intentarlo.')
              : t('Estamos preparando builds, runas y counters oficiales.')}
          </p>
          {data.status === 'error' && (
            <Button
              variant="primary"
              className="mt-5"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void refreshData()}
            >
              {t('Reintentar')}
            </Button>
          )}
        </div>
      </Card>
    )
  }

  if (!champion || !build) {
    return (
      <div className="space-y-5">
        <ButtonLink
          to="/campeones"
          variant="quiet"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          {t('Volver a campeones')}
        </ButtonLink>
        <Card>
          <div className="py-16 text-center text-sm text-ink-400">
            {t('No encontramos ese campeón.')}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <ButtonLink
        to="/campeones"
        variant="quiet"
        size="sm"
        icon={<ArrowLeft className="h-4 w-4" />}
      >
        Volver a campeones
      </ButtonLink>

      <section className="relative overflow-hidden rounded-[1.6rem] border border-line bg-base-900/60">
        {showSplashArt && (
          <div className="absolute inset-y-0 right-0 w-[58%] overflow-hidden">
            <img
              src={championSplashUrl(champion.id)}
              alt=""
              className="h-full w-full scale-[1.04] object-cover object-[50%_22%] opacity-70"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-base-900 via-base-900/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-base-950/80 via-transparent to-transparent" />
          </div>
        )}
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-center gap-4">
            <ChampionIcon champion={champion} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">{champion.title}</p>
                <Badge tone="gold">{build.archetypeLabel}</Badge>
              </div>
              <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-ink-100">
                {champion.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {champion.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-line bg-base-950/40 px-1.5 py-0.5 text-[0.6rem] font-medium text-ink-300"
                  >
                    {TAG_LABELS[tag] ?? tag}
                  </span>
                ))}
                {recommended.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-md border border-teal-400/20 bg-teal-400/5 px-1.5 py-0.5 text-[0.6rem] font-medium text-teal-300"
                  >
                    <RoleMark role={item} />
                    {roleLabel(item)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-full">
            <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
              {t('Tu rol')}
            </p>
            <RoleSelector role={selectedRole} recommended={recommended} onChange={setRole} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <Card className="p-5">
          <BuildPanel build={build} championName={champion.name} />
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <RunePanel plan={runes} championName={champion.name} role={selectedRole} />
          </Card>
          <Card className="p-5">
            <ChampionStats champion={champion} />
          </Card>
        </div>
      </div>

      <section>
        <SectionHeading
          eyebrow={t('Adaptación')}
          title={t('Composición enemiga')}
          description={t('Añade hasta 5 rivales para ajustar objetos, runas y consejos de pelea.')}
          action={<Badge tone="teal">{t('{count}/5 rivales', { count: enemyIds.length })}</Badge>}
        />
        <Card className="mt-3 p-5">
          <ChampionPicker
            value={enemyIds}
            onChange={setEnemyIds}
            excludeIds={[champion.id]}
            max={5}
          />
          {enemies.length > 0 ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-2xl border border-line bg-base-950/30 p-4">
                <TeamPanel team={team} />
              </div>
              <div className="space-y-3">
                {enemies.map((enemy) => (
                  <CounterPanel
                    key={enemy.id}
                    enemy={enemy}
                    index={index}
                    myChampion={champion}
                    myRole={selectedRole}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-base-900/35 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
              <p className="text-[0.74rem] leading-relaxed text-ink-400">
                {t('La build de arriba es la base del campeón. Al añadir rivales, se priorizan anti-curación, resistencias, penetración y objetos contra burst según lo que tengas enfrente.')}
              </p>
            </div>
          )}
        </Card>
      </section>

      <section>
        <SectionHeading
          eyebrow={t('Kit')}
          title={t('Habilidades')}
          description={t('Descripciones oficiales para repasar rangos, enfriamientos y utilidad.')}
          action={
            <Badge>
              <Sparkles className="h-3 w-3" /> {t('{count} habilidades', { count: champion.spells.length })}
            </Badge>
          }
        />
        <Card className="mt-3 space-y-2 p-4">
          <AbilityRow
            icon={<PassiveIcon image={champion.passive.image} name={champion.passive.name} />}
            name={champion.passive.name}
            description={champion.passive.description}
            meta={t('Pasiva')}
          />
          {champion.spells.map((spell) => (
            <AbilityRow
              key={spell.id}
              icon={<SpellIcon image={spell.image} name={spell.name} />}
              name={spell.name}
              description={spell.description}
              meta={t('Enfriamiento {cooldown}s · Rango {range}', { cooldown: spell.cooldown[0] ?? '—', range: formatNumber(spell.range[0] ?? 0) })}
            />
          ))}
        </Card>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-base-900/30 px-4 py-3 text-[0.68rem] text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <Swords className="h-3.5 w-3.5 text-gold-300/80" />
          {t('Build generada con datos oficiales del parche {patch}.', { patch: index.data.patch })}
        </span>
        <Link to="/partida" className="inline-flex items-center gap-1.5 font-semibold text-gold-300">
          <UsersRound className="h-3.5 w-3.5" />
          {t('Ver mi partida')}
        </Link>
      </div>
    </div>
  )
}
