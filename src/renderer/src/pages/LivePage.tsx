import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '@renderer/components/ui/ButtonLink'
import {
  Crosshair,
  MonitorOff,
  MonitorPlay,
  MonitorUp,
  Radio,
  RefreshCw,
  Swords,
  TimerReset,
  TrendingUp,
  UsersRound
} from 'lucide-react'
import type { Champion, ChampSelectSlot, LivePlayer, Role } from '@shared/types'
import { roleLabel } from '@shared/constants'
import {
  analyzeTeam,
  estimatePlayerGold,
  findChampionForId,
  findChampionForLivePlayer,
  generateBuild,
  generateRunePlan,
  inferChampionRole
} from '@shared/analysis'
import { useAppStore } from '@renderer/store/useAppStore'
import { useGameData } from '@renderer/lib/gameData'
import { phaseLabel } from '@renderer/lib/phases'
import { formatCompact, formatDuration, formatNumber } from '@renderer/lib/format'
import { Card } from '@renderer/components/ui/Card'
import { Badge } from '@renderer/components/ui/Badge'
import { Button } from '@renderer/components/ui/Button'
import { EmptyState, Spinner } from '@renderer/components/ui/EmptyState'
import { ChampionIcon } from '@renderer/components/lol/ChampionIcon'
import { BuildPanel } from '@renderer/components/analysis/BuildPanel'
import { RunePanel } from '@renderer/components/analysis/RunePanel'
import { TeamPanel } from '@renderer/components/analysis/TeamPanel'
import { LaneGoldBoard } from '@renderer/components/live/LaneGoldBoard'
import { ObjectiveTimerList } from '@renderer/components/live/ObjectiveTimerList'
import { ChampSelectBoard } from '@renderer/components/live/ChampSelectBoard'
import { cn } from '@renderer/lib/cn'
import { t } from '@shared/i18n'

function findActivePlayer(players: LivePlayer[], activeRiotId: string, activeChampionName: string) {
  return (
    players.find((player) => player.riotId && player.riotId === activeRiotId) ??
    players.find((player) => player.championName === activeChampionName)
  )
}

function mySlot(slots: ChampSelectSlot[], cellId: number): ChampSelectSlot | undefined {
  return slots.find((slot) => slot.cellId === cellId)
}

function OverlayToggle(): React.JSX.Element {
  const enabled = useAppStore((state) => state.settings.overlayEnabled)
  const updateSettings = useAppStore((state) => state.updateSettings)
  return (
    <Button
      size="sm"
      variant={enabled ? 'ghost' : 'quiet'}
      icon={enabled ? <MonitorUp className="h-4 w-4" /> : <MonitorOff className="h-4 w-4" />}
      onClick={() => void updateSettings({ overlayEnabled: !enabled })}
      aria-pressed={enabled}
      className={enabled ? 'border-teal-400/30 text-teal-200' : ''}
      title={enabled ? t('Ocultar overlay de partida') : t('Mostrar overlay de partida')}
    >
      {enabled ? t('Overlay activo') : t('Overlay oculto')}
    </Button>
  )
}

export function LivePage(): React.JSX.Element {
  const snapshot = useAppStore((state) => state.snapshot)
  const reconnect = useAppStore((state) => state.reconnect)
  const data = useAppStore((state) => state.data)
  const refreshData = useAppStore((state) => state.refreshData)
  const index = useGameData()

  const scene = useMemo(() => {
    if (!index) return null

    if (snapshot.champSelect) {
      const state = snapshot.champSelect
      const slot = mySlot(state.myTeam, state.localCellId)
      const myChampion =
        findChampionForId(index, state.localPlayerChampionId) ??
        (slot ? findChampionForId(index, slot.championId || slot.pickIntentId) : null)
      const myRole: Role =
        slot && slot.assignedPosition !== 'UNKNOWN'
          ? slot.assignedPosition
          : myChampion
            ? inferChampionRole(index, myChampion)
            : 'UNKNOWN'
      const enemyKeys = state.theirTeam
        .map((enemy) => findChampionForId(index, enemy.championId || enemy.pickIntentId))
        .filter((champion): champion is Champion => Boolean(champion))
        .map((champion) => champion.key)
      return {
        mode: 'champ-select' as const,
        myChampion,
        myRole,
        effectiveRole: (myRole === 'UNKNOWN' ? 'MIDDLE' : myRole) as Role,
        enemyKeys,
        activePlayer: undefined,
        allies: [] as LivePlayer[],
        enemyPlayers: [] as LivePlayer[],
        myGold: null
      }
    }

    if (snapshot.live) {
      const live = snapshot.live
      const activePlayer = findActivePlayer(
        live.players,
        live.activePlayerRiotId,
        live.activeChampionName
      )
      const myChampion = activePlayer
        ? findChampionForLivePlayer(index, activePlayer.championId, activePlayer.championName)
        : null
      const myRole: Role =
        activePlayer && activePlayer.position !== 'UNKNOWN'
          ? activePlayer.position
          : myChampion
            ? inferChampionRole(index, myChampion)
            : 'UNKNOWN'
      const allies = live.players.filter((player) => player.team === live.activeTeam)
      const enemyPlayers = live.players.filter((player) => player.team !== live.activeTeam)
      const enemyKeys = enemyPlayers
        .map((player) => findChampionForLivePlayer(index, player.championId, player.championName))
        .filter((champion): champion is Champion => Boolean(champion))
        .map((champion) => champion.key)
      return {
        mode: 'live' as const,
        myChampion,
        myRole,
        effectiveRole: (myRole === 'UNKNOWN' ? 'MIDDLE' : myRole) as Role,
        enemyKeys,
        activePlayer,
        allies,
        enemyPlayers,
        myGold: activePlayer ? estimatePlayerGold(activePlayer, live.gameTime, index) : null
      }
    }

    return null
  }, [index, snapshot.champSelect, snapshot.live])

  const enemySignature = scene?.enemyKeys.join(',') ?? ''
  const enemies = useMemo(() => {
    if (!index || !enemySignature) return []
    return enemySignature
      .split(',')
      .map(Number)
      .map((key) => index.championByKey.get(key))
      .filter((champion): champion is Champion => Boolean(champion))
  }, [enemySignature, index])

  const build = useMemo(
    () =>
      index && scene?.myChampion
        ? generateBuild(scene.myChampion, scene.effectiveRole, enemies, index)
        : null,
    [enemies, index, scene?.effectiveRole, scene?.myChampion]
  )
  const runes = useMemo(
    () =>
      index && scene?.myChampion
        ? generateRunePlan(scene.myChampion, scene.effectiveRole, index)
        : null,
    [index, scene?.effectiveRole, scene?.myChampion]
  )
  const team = useMemo(() => analyzeTeam(enemies), [enemies])
  const model = useMemo(
    () => (scene ? { ...scene, enemies, team, build, runes } : null),
    [build, enemies, runes, scene, team]
  )

  if (!index) {
    return (
      <Card>
        <EmptyState
          icon={<MonitorPlay className="h-6 w-6" />}
          title={data.status === 'error' ? t('No pudieron cargar los datos de Riot') : t('Cargando datos de Riot')}
          description={
            data.status === 'error'
              ? t('Sin los datos del parche no podemos identificar campeones, objetos ni runas.')
              : t('Estamos preparando campeones, objetos y runas para analizar la partida.')
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

  if (!model) {
    return (
      <Card>
        <EmptyState
          icon={<MonitorPlay className="h-6 w-6" />}
          title={t('Todavía no hay una partida')}
          description={t('Abre League of Legends y entra en champ select o en una partida. Estado actual: {phase}.', { phase: phaseLabel(snapshot.phase) })}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="primary"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={() => void reconnect()}
              >
                {t('Buscar cliente')}
              </Button>
              <ButtonLink to="/ajustes" variant="ghost">
                {t('Configurar detección')}
              </ButtonLink>
            </div>
          }
        />
      </Card>
    )
  }

  if (model.mode === 'champ-select' && snapshot.champSelect) {
    const timer = snapshot.champSelect.timer
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">{t('Champ select')}</p>
            <h1 className="font-display mt-1 text-2xl font-semibold text-ink-100">
              {t('Elige con información')}
            </h1>
            <p className="mt-1 text-[0.82rem] text-ink-400">
              {t('Detectamos tu línea y sugerimos counters para el rival revelado.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold">
              <Radio className="h-3 w-3" /> {t('En selección')}
            </Badge>
            {timer && <Badge tone="teal">{Math.ceil(timer.remainingMs / 1000)} s</Badge>}
            <OverlayToggle />
          </div>
        </div>

        <Card className="p-5">
          <ChampSelectBoard champSelect={snapshot.champSelect} />
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.85fr]">
          <Card className="p-5">
            {model.build ? (
              <BuildPanel build={model.build} championName={model.myChampion?.name} />
            ) : (
              <div className="py-10 text-center text-[0.82rem] text-ink-400">
                {t('Elige tu campeón para ver la build adaptada a tu línea.')}
              </div>
            )}
          </Card>
          <div className="space-y-4">
            <Card className="p-5">
              <RunePanel
                plan={model.runes}
                championName={model.myChampion?.name}
                role={model.effectiveRole}
              />
            </Card>
            {model.enemies.length > 0 && (
              <Card className="p-5">
                <TeamPanel team={model.team} />
              </Card>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-line bg-base-900/30 px-4 py-3 text-[0.68rem] text-ink-500">
          <span>{t('Los counters se actualizan cuando cambia el pick rival.')}</span>
          <Link to="/campeones" className="font-semibold text-gold-300">
            {t('Explorar campeones')}
          </Link>
        </div>
      </div>
    )
  }

  const live = snapshot.live
  if (!live) return <div />

  const allyKills = model.allies.reduce((total, player) => total + player.kills, 0)
  const enemyKills = model.enemyPlayers.reduce((total, player) => total + player.kills, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t('Partida en vivo')}</p>
          <h1 className="font-display mt-1 text-2xl font-semibold text-ink-100">
            {model.myChampion?.name ?? t('Tu partida')}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.8rem] text-ink-400">
            <span>{roleLabel(model.myRole)}</span>
            <span className="text-ink-600">·</span>
            <span>{formatDuration(live.gameTime)}</span>
            <span className="text-ink-600">·</span>
            <span className="font-mono text-ink-300">
              {allyKills} - {enemyKills}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="teal">
            <Radio className="h-3 w-3" /> LIVE
          </Badge>
          <Badge>{live.mapName || t('Grieta del Invocador')}</Badge>
          <OverlayToggle />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="eyebrow">{t('Marcador por línea')}</p>
              <h2 className="font-display mt-1 text-xl font-semibold text-ink-100">
                {t('Diferencia de oro')}
              </h2>
            </div>
            <Badge tone="gold">
              <TrendingUp className="h-3 w-3" /> {t('estimado')}
            </Badge>
          </div>
          <LaneGoldBoard live={live} />
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <TimerReset className="h-4 w-4 text-teal-300" />
              <div>
                <p className="eyebrow">{t('Relojes')}</p>
                <h2 className="font-display mt-0.5 text-xl font-semibold text-ink-100">
                  {t('Objetivos')}
                </h2>
              </div>
            </div>
            <ObjectiveTimerList live={live} />
          </Card>

          {model.activePlayer && (
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ChampionIcon champion={model.myChampion} size="md" />
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
                      {t('Tu rendimiento')}
                    </p>
                    <p className="font-display text-lg font-semibold text-ink-100">
                      {model.activePlayer.kills}/{model.activePlayer.deaths}/{model.activePlayer.assists}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[0.62rem] text-ink-500">CS</p>
                  <p className="font-mono text-sm font-bold text-ink-200">
                    {formatNumber(model.activePlayer.cs)}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-line bg-base-950/35 p-2">
                  <p className="text-[0.58rem] text-ink-500">{t('Oro estimado')}</p>
                  <p className="font-mono text-sm font-bold text-gold-200">
                    ≈ {model.myGold ? formatCompact(model.myGold.total) : '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-base-950/35 p-2">
                  <p className="text-[0.58rem] text-ink-500">{t('Nivel')}</p>
                  <p className="font-mono text-sm font-bold text-ink-200">
                    {model.activePlayer.level}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.85fr]">
        <Card className="p-5">
          {model.build ? (
            <BuildPanel build={model.build} championName={model.myChampion?.name} />
          ) : (
            <div className="py-10 text-center text-[0.82rem] text-ink-400">
              {t('No pudimos identificar tu campeón en la partida.')}
            </div>
          )}
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <RunePanel
              plan={model.runes}
              championName={model.myChampion?.name}
              role={model.effectiveRole}
            />
          </Card>
          {model.enemies.length > 0 && (
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-gold-300" />
                <h2 className="font-display text-lg font-semibold text-ink-100">
                  {t('Composición enemiga')}
                </h2>
              </div>
              <TeamPanel team={model.team} />
            </Card>
          )}
        </div>
      </div>

      <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-base-900/30 px-4 py-3 text-[0.68rem] text-ink-500')}>
        <span className="inline-flex items-center gap-1.5">
          <Crosshair className="h-3.5 w-3.5 text-gold-300/80" />
          {t('Oro estimado con objetos, CS, KDA y oro pasivo. No es el oro exacto del marcador.')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Swords className="h-3.5 w-3.5" />
          {t('Overlay: Ctrl+Shift+O · Oro: Ctrl+Shift+G')}
        </span>
      </div>
    </div>
  )
}
