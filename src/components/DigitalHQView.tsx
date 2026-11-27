import {
  type ReactNode,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import {
  Building2,
  Compass,
  LayoutDashboard,
  Terminal,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Zap,
  Clock,
  FolderKanban,
  Activity,
  Bot,
  Send,
  Loader2,
  Eye,
  Tag,
  Moon,
  Sun,
  RotateCcw,
  Users,
} from 'lucide-react'
import type { WorldDefinition, WorldEntity, WorldPreset, PinDisplayMode, DepartmentInfo } from '../core/types'
import { deriveDepartmentsFromZones } from '../core/environment'
import { VirtualWorld, type VirtualWorldRef } from './VirtualWorld'
import {
  VirtualCommandBar,
  type PresetMission,
  type VirtualCommandBarLabels,
  DEFAULT_VIRTUAL_COMMAND_BAR_LABELS,
} from './VirtualCommandBar'
import { VirtualRoster, type VirtualRosterLabels, DEFAULT_VIRTUAL_ROSTER_LABELS } from './VirtualRoster'
import {
  VirtualEntityDrawer,
  type EntityRunMetrics,
  type EntityLatestTask,
  type VirtualEntityDrawerLabels,
  DEFAULT_VIRTUAL_ENTITY_DRAWER_LABELS,
} from './VirtualEntityDrawer'
import {
  VirtualReportModal,
  type VirtualReportData,
  type VirtualReportModalLabels,
  DEFAULT_VIRTUAL_REPORT_MODAL_LABELS,
} from './VirtualReportModal'
import { type LabelOverrides, formatTemplate, mergeLabels } from './labels'

export type OperationalMode = 'office' | 'operations' | 'command_center'

export interface DigitalHQProject {
  id: string
  name: string
  description?: string
  status?: string
}

export interface DigitalHQActivity {
  id: string
  title: string
  description?: string
  createdAt: string
}

export interface DigitalHQLabels {
  header: {
    brandBadge: string
    brandDesc: string
    desksStaffed: string
    onAMission: string
    awaitingApproval: string
  }
  modes: {
    officeFloor: string
    operations: string
    commandCenter: string
  }
  actions: {
    buildSquad: string
    pinCycleTitle: string
    labelsOff: string
    deskNumbers: string
    names: string
    missionPanel: string
    showMissionPanel: string
    hideMissionPanel: string
    roster: string
    showRoster: string
    hideRoster: string
    switchToDay: string
    switchToNight: string
    resetCamera: string
    openStandalone: string
    standaloneTitle: string
    dashboard: string
    backTitle: string
    exitFullscreen: string
    fullscreen: string
    refresh: string
  }
  canvas: {
    loading: string
    navHint: string
    emptyTitle: string
    emptyCopy: string
    emptyBuild: string
  }
  operations: {
    totalProjects: string
    totalProjectsSub: string
    departments: string
    departmentsSub: string
    activeStaff: string
    activeStaffSub: string
    awaitingApproval: string
    awaitingSub: string
    deptHeading: string
    deptWorking: string
    deskSingular: string
    deskPlural: string
    goToRoom: string
    activityHeading: string
    activityEmpty: string
  }
  command: {
    title: string
    subtitle: string
    placeholder: string
    fastDemo: string
    realAI: string
    start: string
    reviewHeading: string
    reviewEmpty: string
    viewReport: string
  }
  rosterTitle: string
  roster: VirtualRosterLabels
  commandBar: VirtualCommandBarLabels
  drawer: VirtualEntityDrawerLabels
  report: VirtualReportModalLabels
}

export const DEFAULT_DIGITAL_HQ_LABELS: Readonly<DigitalHQLabels> = Object.freeze({
  header: Object.freeze({
    brandBadge: 'Universal 3D',
    brandDesc: 'AI-powered virtual headquarters',
    desksStaffed: '{staffed} / {capacity} desks staffed',
    onAMission: '{count} on a mission',
    awaitingApproval: '{count} awaiting approval',
  }),
  modes: Object.freeze({
    officeFloor: 'Office floor (3D)',
    operations: 'Operations',
    commandCenter: 'AI command center',
  }),
  actions: Object.freeze({
    buildSquad: 'Build squad ({capacity})',
    pinCycleTitle: 'Cycle labels: off ➔ numbers (#) ➔ names',
    labelsOff: 'Labels: off',
    deskNumbers: 'Desk no. (#)',
    names: 'Names',
    missionPanel: 'Mission panel',
    showMissionPanel: 'Show mission panel',
    hideMissionPanel: 'Hide mission panel',
    roster: 'Roster ({count})',
    showRoster: 'Show roster panel',
    hideRoster: 'Hide roster panel',
    switchToDay: 'Switch to day mode (bright studio)',
    switchToNight: 'Switch to night mode (evening lights)',
    resetCamera: 'Reset camera to the default isometric angle',
    openStandalone: 'Open standalone',
    standaloneTitle: 'Open as a standalone fullscreen page',
    dashboard: 'Dashboard',
    backTitle: 'Back to dashboard',
    exitFullscreen: 'Exit fullscreen',
    fullscreen: 'Fullscreen',
    refresh: 'Refresh data',
  }),
  canvas: Object.freeze({
    loading: 'Loading the 3D office floor...',
    navHint: 'Click a 3D desk to open its profile • Left drag: orbit • Right drag: pan • Wheel: zoom',
    emptyTitle: 'The floor is ready — nobody is in yet',
    emptyCopy:
      'All {capacity} desks are installed and waiting. Bring your team in and they will take their seats here in 3D.',
    emptyBuild: 'Build the squad ({capacity})',
  }),
  operations: Object.freeze({
    totalProjects: 'Total projects',
    totalProjectsSub: 'Active work portfolio',
    departments: 'Departments',
    departmentsSub: 'Functional work cells',
    activeStaff: 'Active staff',
    activeStaffSub: 'Specialists working at their desks',
    awaitingApproval: 'Awaiting approval',
    awaitingSub: 'Missions pending a manager approval',
    deptHeading: 'Department rooms & desks',
    deptWorking: '⚡ Working',
    deskSingular: 'desk',
    deskPlural: 'desks',
    goToRoom: 'Go to room',
    activityHeading: 'System activity feed',
    activityEmpty: 'No recorded system activity yet.',
  }),
  command: Object.freeze({
    title: 'AI command & orchestration',
    subtitle: 'Dispatch missions to every department automatically through the general manager.',
    placeholder:
      'Describe a company goal or a complex project... (e.g. Build the strategy, visual briefs and budget plan for our new digital marketing campaign)',
    fastDemo: 'Fast demo simulation',
    realAI: 'Real LLM API',
    start: 'Start orchestration',
    reviewHeading: 'Missions awaiting review & approval',
    reviewEmpty: 'No completed or approval-pending missions yet.',
    viewReport: 'View report',
  }),
  rosterTitle: 'Office roster',
  roster: DEFAULT_VIRTUAL_ROSTER_LABELS,
  commandBar: DEFAULT_VIRTUAL_COMMAND_BAR_LABELS,
  drawer: DEFAULT_VIRTUAL_ENTITY_DRAWER_LABELS,
  report: DEFAULT_VIRTUAL_REPORT_MODAL_LABELS,
})

export interface DigitalHQViewProps {
  world: WorldDefinition
  preset?: WorldPreset
  departments?: DepartmentInfo[]
  presetMissions?: PresetMission[]
  projects?: DigitalHQProject[]
  activities?: DigitalHQActivity[]
  standalone?: boolean
  loading?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  onSeedSquad?: () => void
  isSeeding?: boolean
  onDispatchMission: (data: { prompt: string; targetId: string; isDemo: boolean }) => Promise<void> | void
  selectedEntityId?: string | null
  onSelectEntity?: (entity: WorldEntity | null) => void
  getEntityMetrics?: (entityId: string) => EntityRunMetrics | undefined
  getEntityLatestTask?: (entityId: string) => EntityLatestTask | null
  deskCapacity?: number
  returnUrl?: string
  standaloneUrl?: string
  className?: string
  labels?: LabelOverrides<DigitalHQLabels>
}

export function DigitalHQView({
  world,
  preset,
  departments: departmentsProp,
  presetMissions = [],
  projects = [],
  activities = [],
  standalone = true,
  loading = false,
  refreshing = false,
  onRefresh,
  onSeedSquad,
  isSeeding = false,
  onDispatchMission,
  selectedEntityId,
  onSelectEntity,
  getEntityMetrics,
  getEntityLatestTask,
  deskCapacity,
  returnUrl = '/app/office',
  standaloneUrl = '/digital-hq',
  className = '',
  labels,
}: DigitalHQViewProps): ReactNode {
  const t = mergeLabels(DEFAULT_DIGITAL_HQ_LABELS, labels)

  const [activeMode, setActiveMode] = useState<OperationalMode>('office')

  const virtualWorldRef = useRef<VirtualWorldRef>(null)
  const [showRoster, setShowRoster] = useState(false)
  const [showCommandBar, setShowCommandBar] = useState(false)
  const [pinMode, setPinMode] = useState<PinDisplayMode>('off')
  const [nightMode, setNightMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleCyclePinMode = useCallback(() => {
    setPinMode((prev) => {
      if (prev === 'off') return 'pins'
      if (prev === 'pins') return 'labels'
      return 'off'
    })
  }, [])

  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const [viewingReport, setViewingReport] = useState<VirtualReportData | null>(null)

  const activeEntityId = selectedEntityId !== undefined ? selectedEntityId : internalSelectedId
  const activeEntity = world.entities.find((e) => e.id === activeEntityId) || null

  const [targetId, setTargetId] = useState<string>('auto')
  const [promptText, setPromptText] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [isLaunching, setIsLaunching] = useState(false)

  const [rosterSearch, setRosterSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const handleSelect = useCallback(
    (entity: WorldEntity | null) => {
      setInternalSelectedId(entity ? entity.id : null)
      if (onSelectEntity) onSelectEntity(entity)
      if (entity) {
        virtualWorldRef.current?.focusOnEntity(entity.id)
      }
    },
    [onSelectEntity],
  )

  const handleToggleRoster = useCallback(() => {
    setShowRoster(!showRoster)
    setTimeout(() => virtualWorldRef.current?.resize(), 50)
  }, [showRoster])

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
        setTimeout(() => virtualWorldRef.current?.resize(), 100)
      })
    } else {
      void document.exitFullscreen().then(() => {
        setIsFullscreen(false)
        setTimeout(() => virtualWorldRef.current?.resize(), 100)
      })
    }
  }, [])

  const handleDispatch = useCallback(async () => {
    if (!promptText.trim()) return
    setIsLaunching(true)
    try {
      await onDispatchMission({
        prompt: promptText.trim(),
        targetId,
        isDemo: isDemoMode,
      })
      setPromptText('')
    } finally {
      setIsLaunching(false)
    }
  }, [promptText, targetId, isDemoMode, onDispatchMission])

  const activeWorkersCount = useMemo(() => {
    return world.entities.filter((e) => e.status === 'running' || e.status === 'working').length
  }, [world.entities])

  const departments = useMemo<DepartmentInfo[]>(() => {
    if (departmentsProp && departmentsProp.length > 0) return departmentsProp
    return deriveDepartmentsFromZones(world.zones, preset?.slots ?? [])
  }, [departmentsProp, world.zones, preset])

  const pendingApprovalsCount = useMemo(() => {
    return world.entities.filter((e) => e.status === 'awaiting_approval').length
  }, [world.entities])

  const capacity = deskCapacity ?? world.entities.length

  return (
    <div className={`wv-hq-container ${nightMode ? 'is-night' : ''} ${className}`}>
      <header className="wv-hq-header">
        <div className="wv-hq-header-left">
          <div className="wv-hq-brand-group">
            <div className="wv-hq-brand-icon">
              <Building2 size={18} />
            </div>
            <div>
              <div className="wv-hq-brand-title-row">
                <h1 className="wv-hq-brand-title">{world.name}</h1>
                <span className="wv-hq-badge">{t.header.brandBadge}</span>
              </div>
              <p className="wv-hq-brand-desc">{t.header.brandDesc}</p>
            </div>
          </div>

          <div className="wv-hq-stats-row">
            <span className="wv-hq-stat-pill is-green">
              <span className="wv-hq-pip" />
              {formatTemplate(t.header.desksStaffed, {
                staffed: world.entities.length,
                capacity,
              })}
            </span>
            {activeWorkersCount > 0 && (
              <span className="wv-hq-stat-pill is-purple">
                <Zap size={12} />
                {formatTemplate(t.header.onAMission, { count: activeWorkersCount })}
              </span>
            )}
            {pendingApprovalsCount > 0 && (
              <span className="wv-hq-stat-pill is-amber">
                <Clock size={12} />
                {formatTemplate(t.header.awaitingApproval, { count: pendingApprovalsCount })}
              </span>
            )}
          </div>
        </div>

        <div className="wv-hq-mode-tabs">
          <button
            type="button"
            onClick={() => setActiveMode('office')}
            className={`wv-hq-mode-tab ${activeMode === 'office' ? 'is-active' : ''}`}
          >
            <Compass size={14} color="#3b82f6" />
            <span>{t.modes.officeFloor}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('operations')}
            className={`wv-hq-mode-tab ${activeMode === 'operations' ? 'is-active' : ''}`}
          >
            <LayoutDashboard size={14} color="#06b6d4" />
            <span>{t.modes.operations}</span>
            {projects.length > 0 && (
              <span className="wv-hq-tab-count">{projects.length}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('command_center')}
            className={`wv-hq-mode-tab ${activeMode === 'command_center' ? 'is-active' : ''}`}
          >
            <Terminal size={14} color="#a855f7" />
            <span>{t.modes.commandCenter}</span>
            {pendingApprovalsCount > 0 && (
              <span className="wv-hq-tab-badge">{pendingApprovalsCount}</span>
            )}
          </button>
        </div>

        <div className="wv-hq-header-right">
          {onSeedSquad && world.entities.length < capacity && (
            <button
              type="button"
              onClick={onSeedSquad}
              disabled={isSeeding}
              className="wv-hq-action-btn is-seed"
            >
              {isSeeding ? <Loader2 size={13} className="wv-spin" /> : <Sparkles size={13} />}
              <span>{formatTemplate(t.actions.buildSquad, { capacity })}</span>
            </button>
          )}

          {activeMode === 'office' && (
            <>
              <button
                type="button"
                onClick={handleCyclePinMode}
                className={`wv-hq-action-btn ${pinMode !== 'off' ? 'is-active' : ''}`}
                title={t.actions.pinCycleTitle}
              >
                <Tag size={14} />
                <span>
                  {pinMode === 'off'
                    ? t.actions.labelsOff
                    : pinMode === 'pins'
                      ? t.actions.deskNumbers
                      : t.actions.names}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowCommandBar((prev) => !prev)}
                className={`wv-hq-action-btn ${showCommandBar ? 'is-active' : ''}`}
                title={showCommandBar ? t.actions.hideMissionPanel : t.actions.showMissionPanel}
              >
                <Terminal size={14} />
                <span className="wv-hide-mobile">{t.actions.missionPanel}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleRoster}
                className={`wv-hq-action-btn ${showRoster ? 'is-active' : ''}`}
                title={showRoster ? t.actions.hideRoster : t.actions.showRoster}
              >
                {showRoster ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                <span className="wv-hide-mobile">
                  {formatTemplate(t.actions.roster, { count: world.entities.length })}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !nightMode
                  setNightMode(next)
                  virtualWorldRef.current?.setNightMode(next)
                }}
                className="wv-hq-icon-btn"
                title={nightMode ? t.actions.switchToDay : t.actions.switchToNight}
              >
                {nightMode ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} />}
              </button>

              <button
                type="button"
                onClick={() => virtualWorldRef.current?.resetCamera()}
                className="wv-hq-icon-btn"
                title={t.actions.resetCamera}
              >
                <RotateCcw size={15} />
              </button>
            </>
          )}

          {!standalone ? (
            <a
              href={standaloneUrl}
              target="_blank"
              rel="noreferrer"
              className="wv-hq-action-btn"
              title={t.actions.standaloneTitle}
            >
              <ExternalLink size={14} />
              <span className="wv-hide-mobile">{t.actions.openStandalone}</span>
            </a>
          ) : (
            <a
              href={returnUrl}
              className="wv-hq-action-btn"
              title={t.actions.backTitle}
            >
              <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
              <span className="wv-hide-mobile">{t.actions.dashboard}</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="wv-hq-icon-btn"
            title={isFullscreen ? t.actions.exitFullscreen : t.actions.fullscreen}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="wv-hq-icon-btn"
              title={t.actions.refresh}
            >
              <RefreshCw size={15} className={refreshing ? 'wv-spin' : ''} />
            </button>
          )}
        </div>
      </header>

      <div className="wv-hq-main-viewport">
        {activeMode === 'office' && (
          <div className="wv-hq-office-layout">
            <div className="wv-hq-canvas-wrapper">
              {loading && (
                <div className="wv-hq-loading-overlay">
                  <Loader2 size={32} className="wv-spin" color="#3b82f6" />
                  <p>{t.canvas.loading}</p>
                </div>
              )}

              <div className="wv-hq-nav-hint">
                <Compass size={14} color="#3b82f6" />
                <span>{t.canvas.navHint}</span>
              </div>

              <VirtualWorld
                ref={virtualWorldRef}
                world={world}
                preset={preset}
                selectedEntityId={activeEntity?.id}
                onSelectEntity={handleSelect}
                pinMode={pinMode}
                onChangePinMode={setPinMode}
                nightMode={nightMode}
                onToggleNightMode={() => {
                  const next = !nightMode
                  setNightMode(next)
                  virtualWorldRef.current?.setNightMode(next)
                }}
                showControls={false}
                showInspector={false}
              >
                {world.entities.length === 0 && (
                  <div className="wv-hq-empty-floor">
                    <div className="wv-hq-empty-floor-card">
                      <Users size={28} />
                      <h3>{t.canvas.emptyTitle}</h3>
                      <p>{formatTemplate(t.canvas.emptyCopy, { capacity })}</p>
                      {onSeedSquad && (
                        <button
                          type="button"
                          onClick={onSeedSquad}
                          disabled={isSeeding}
                          className="wv-hq-empty-floor-btn"
                        >
                          {isSeeding ? <Loader2 size={14} className="wv-spin" /> : <Sparkles size={14} />}
                          <span>{formatTemplate(t.canvas.emptyBuild, { capacity })}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <VirtualCommandBar
                  presetMissions={presetMissions}
                  entities={world.entities}
                  targetEntityId={targetId}
                  onChangeTarget={setTargetId}
                  prompt={promptText}
                  onChangePrompt={setPromptText}
                  onDispatch={handleDispatch}
                  isDemoMode={isDemoMode}
                  onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
                  isLaunching={isLaunching}
                  isOpen={showCommandBar}
                  onToggleOpen={setShowCommandBar}
                  labels={labels?.commandBar}
                />
              </VirtualWorld>
            </div>

            {showRoster && (
              <VirtualRoster
                entities={world.entities}
                departments={departments}
                selectedEntityId={activeEntity?.id}
                onSelectEntity={(id) => {
                  const en = world.entities.find((e) => e.id === id) || null
                  handleSelect(en)
                }}
                onClose={handleToggleRoster}
                searchQuery={rosterSearch}
                onSearchChange={setRosterSearch}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                title={t.rosterTitle}
                labels={labels?.roster}
              />
            )}

            {activeEntity && (
              <VirtualEntityDrawer
                entity={activeEntity}
                onClose={() => handleSelect(null)}
                metrics={getEntityMetrics ? getEntityMetrics(activeEntity.id) : undefined}
                latestTask={getEntityLatestTask ? getEntityLatestTask(activeEntity.id) : null}
                onViewReport={() => {
                  const task = getEntityLatestTask ? getEntityLatestTask(activeEntity.id) : null
                  if (task) {
                    setViewingReport({
                      prompt: task.prompt,
                      summary: task.summary,
                      status: task.status,
                    })
                  }
                }}
                dispatchPrompt={targetId === activeEntity.id ? promptText : ''}
                onChangeDispatchPrompt={(val) => {
                  setTargetId(activeEntity.id)
                  setPromptText(val)
                }}
                onDispatch={handleDispatch}
                isDispatching={isLaunching}
                labels={labels?.drawer}
              />
            )}
          </div>
        )}

        {activeMode === 'operations' && (
          <div className="wv-hq-operations-view">
            <div className="wv-hq-ops-metrics-grid">
              <div className="wv-hq-ops-metric-card">
                <div className="wv-ops-metric-header">
                  <span>{t.operations.totalProjects}</span>
                  <FolderKanban size={16} color="#3b82f6" />
                </div>
                <div className="wv-ops-metric-num">{projects.length}</div>
                <p className="wv-ops-metric-sub">{t.operations.totalProjectsSub}</p>
              </div>

              <div className="wv-hq-ops-metric-card">
                <div className="wv-ops-metric-header">
                  <span>{t.operations.departments}</span>
                  <Building2 size={16} color="#06b6d4" />
                </div>
                <div className="wv-ops-metric-num">{departments.length}</div>
                <p className="wv-ops-metric-sub">{t.operations.departmentsSub}</p>
              </div>

              <div className="wv-hq-ops-metric-card">
                <div className="wv-ops-metric-header">
                  <span>{t.operations.activeStaff}</span>
                  <Zap size={16} color="#a855f7" />
                </div>
                <div className="wv-ops-metric-num">{activeWorkersCount} / {capacity}</div>
                <p className="wv-ops-metric-sub">{t.operations.activeStaffSub}</p>
              </div>

              <div className="wv-hq-ops-metric-card">
                <div className="wv-ops-metric-header">
                  <span>{t.operations.awaitingApproval}</span>
                  <Clock size={16} color="#f59e0b" />
                </div>
                <div className="wv-ops-metric-num">{pendingApprovalsCount}</div>
                <p className="wv-ops-metric-sub">{t.operations.awaitingSub}</p>
              </div>
            </div>

            <div className="wv-hq-ops-cols">
              <div className="wv-hq-ops-dept-col">
                <h2 className="wv-hq-section-heading">
                  <Building2 size={16} color="#3b82f6" />
                  <span>{t.operations.deptHeading}</span>
                </h2>

                <div className="wv-hq-dept-cards-grid">
                  {departments.map((dept) => {
                    const deptEntities = world.entities.filter((e) => (dept.slotIds ?? []).includes(e.id))
                    const isDeptBusy = deptEntities.some((e) => e.status === 'running' || e.status === 'working')

                    return (
                      <div key={dept.id} className="wv-hq-dept-card">
                        <div>
                          <div className="wv-dept-card-top">
                            <span className="wv-dept-color-pip" style={{ backgroundColor: dept.color }} />
                            {isDeptBusy && <span className="wv-dept-busy-badge">{t.operations.deptWorking}</span>}
                          </div>
                          <h3 className="wv-dept-name">{dept.name}</h3>
                          <p className="wv-dept-desc">{dept.description}</p>
                        </div>

                        <div className="wv-dept-card-bottom">
                          <span>
                            {deptEntities.length}{' '}
                            {deptEntities.length === 1 ? t.operations.deskSingular : t.operations.deskPlural}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory(dept.slug ?? dept.id)
                              setActiveMode('office')
                            }}
                            className="wv-dept-link-btn"
                          >
                            <span>{t.operations.goToRoom}</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="wv-hq-ops-act-col">
                <h2 className="wv-hq-section-heading">
                  <Activity size={16} color="#3b82f6" />
                  <span>{t.operations.activityHeading}</span>
                </h2>

                <div className="wv-hq-act-box">
                  {activities.length === 0 ? (
                    <div className="wv-hq-empty-act">
                      <Clock size={24} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                      <p>{t.operations.activityEmpty}</p>
                    </div>
                  ) : (
                    activities.slice(0, 8).map((act) => (
                      <div key={act.id} className="wv-hq-act-item">
                        <span className="wv-act-pip" />
                        <div className="wv-act-content">
                          <p className="wv-act-title">{act.title}</p>
                          {act.description && <p className="wv-act-desc">{act.description}</p>}
                          <span className="wv-act-time">
                            {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMode === 'command_center' && (
          <div className="wv-hq-command-view">
            <div className="wv-hq-command-center-box">
              <div className="wv-hq-dispatch-card">
                <div className="wv-dispatch-header-row">
                  <div className="wv-dispatch-icon-badge">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h2 className="wv-dispatch-title">{t.command.title}</h2>
                    <p className="wv-dispatch-sub">{t.command.subtitle}</p>
                  </div>
                </div>

                <div className="wv-dispatch-input-area">
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={3}
                    placeholder={t.command.placeholder}
                    className="wv-dispatch-textarea"
                  />
                  <div className="wv-dispatch-actions-row">
                    <button
                      type="button"
                      onClick={() => setIsDemoMode(!isDemoMode)}
                      className={`wv-demo-toggle-btn ${isDemoMode ? 'is-demo' : 'is-ai'}`}
                    >
                      {isDemoMode ? <Sparkles size={14} /> : <Bot size={14} />}
                      <span>{isDemoMode ? t.command.fastDemo : t.command.realAI}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDispatch}
                      disabled={isLaunching || !promptText.trim()}
                      className="wv-dispatch-submit-big-btn"
                    >
                      {isLaunching ? <Loader2 size={16} className="wv-spin" /> : <Send size={15} />}
                      <span>{t.command.start}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="wv-hq-review-section">
                <h3 className="wv-hq-section-heading">
                  <Clock size={16} color="#f59e0b" />
                  <span>{t.command.reviewHeading}</span>
                </h3>

                <div className="wv-hq-review-feed">
                  {world.entities.filter((e) => getEntityLatestTask && getEntityLatestTask(e.id)).length === 0 ? (
                    <div className="wv-hq-empty-feed">
                      {t.command.reviewEmpty}
                    </div>
                  ) : (
                    world.entities
                      .filter((e) => getEntityLatestTask && getEntityLatestTask(e.id))
                      .map((entity) => {
                        const task = getEntityLatestTask!(entity.id)!
                        return (
                          <div key={entity.id} className="wv-hq-review-card">
                            <div className="wv-review-info">
                              <div className="wv-review-name-row">
                                <span className="wv-review-entity-name">
                                  #{entity.pinNumber || '•'} {entity.name}
                                </span>
                                <span className={`wv-drawer-status-chip ${task.status === 'running' ? 'is-running' : 'is-idle'}`}>
                                  {task.status || entity.status}
                                </span>
                              </div>
                              <p className="wv-review-prompt">{task.prompt}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setViewingReport({
                                  prompt: task.prompt,
                                  summary: task.summary,
                                  status: task.status,
                                })
                              }}
                              className="wv-review-view-btn"
                            >
                              <Eye size={14} />
                              <span>{t.command.viewReport}</span>
                            </button>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {viewingReport && (
        <VirtualReportModal
          report={viewingReport}
          onClose={() => setViewingReport(null)}
          labels={labels?.report}
        />
      )}
    </div>
  )
}
