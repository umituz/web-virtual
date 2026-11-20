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
import { VirtualCommandBar, type PresetMission } from './VirtualCommandBar'
import { VirtualRoster } from './VirtualRoster'
import { VirtualEntityDrawer, type EntityRunMetrics, type EntityLatestTask } from './VirtualEntityDrawer'
import { VirtualReportModal, type VirtualReportData } from './VirtualReportModal'

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
  /** Total number of desks in the office layout (defaults to the world's entity count). */
  deskCapacity?: number
  returnUrl?: string
  standaloneUrl?: string
  className?: string
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
}: DigitalHQViewProps): ReactNode {
  // Navigation Mode
  const [activeMode, setActiveMode] = useState<OperationalMode>('office')

  // Layout / Sidebar / Toggles (Pure Zen Office Mode by default)
  const virtualWorldRef = useRef<VirtualWorldRef>(null)
  const [showRoster, setShowRoster] = useState(false)
  const [showCommandBar, setShowCommandBar] = useState(false)
  const [pinMode, setPinMode] = useState<PinDisplayMode>('off')
  const [nightMode, setNightMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Pin cycle toggle: off -> pins (#1..#17) -> labels (full names) -> off
  const handleCyclePinMode = useCallback(() => {
    setPinMode((prev) => {
      if (prev === 'off') return 'pins'
      if (prev === 'pins') return 'labels'
      return 'off'
    })
  }, [])

  // Selection & Report
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const [viewingReport, setViewingReport] = useState<VirtualReportData | null>(null)

  const activeEntityId = selectedEntityId !== undefined ? selectedEntityId : internalSelectedId
  const activeEntity = world.entities.find((e) => e.id === activeEntityId) || null

  // Command Bar & Dispatch
  const [targetId, setTargetId] = useState<string>('auto')
  const [promptText, setPromptText] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [isLaunching, setIsLaunching] = useState(false)

  // Roster Search & Category
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

  // Count active running workers
  const activeWorkersCount = useMemo(() => {
    return world.entities.filter((e) => e.status === 'running' || e.status === 'working').length
  }, [world.entities])

  // Departments are consumer org data. When none are supplied, derive a
  // neutral grouping from the preset's architectural zones instead.
  const departments = useMemo<DepartmentInfo[]>(() => {
    if (departmentsProp && departmentsProp.length > 0) return departmentsProp
    return deriveDepartmentsFromZones(world.zones, preset?.slots ?? [])
  }, [departmentsProp, world.zones, preset])

  const pendingApprovalsCount = useMemo(() => {
    return world.entities.filter((e) => e.status === 'awaiting_approval').length
  }, [world.entities])

  // Total desks in the office layout (defaults to the world's entity count)
  const capacity = deskCapacity ?? world.entities.length

  return (
    <div className={`wv-hq-container ${nightMode ? 'is-night' : ''} ${className}`}>
      {/* 1. Header Toolbar */}
      <header className="wv-hq-header">
        <div className="wv-hq-header-left">
          <div className="wv-hq-brand-group">
            <div className="wv-hq-brand-icon">
              <Building2 size={18} />
            </div>
            <div>
              <div className="wv-hq-brand-title-row">
                <h1 className="wv-hq-brand-title">{world.name}</h1>
                <span className="wv-hq-badge">Universal 3D</span>
              </div>
              <p className="wv-hq-brand-desc">AI-powered virtual headquarters</p>
            </div>
          </div>

          <div className="wv-hq-stats-row">
            <span className="wv-hq-stat-pill is-green">
              <span className="wv-hq-pip" />
              {world.entities.length} / {capacity} desks staffed
            </span>
            {activeWorkersCount > 0 && (
              <span className="wv-hq-stat-pill is-purple">
                <Zap size={12} />
                {activeWorkersCount} on a mission
              </span>
            )}
            {pendingApprovalsCount > 0 && (
              <span className="wv-hq-stat-pill is-amber">
                <Clock size={12} />
                {pendingApprovalsCount} awaiting approval
              </span>
            )}
          </div>
        </div>

        {/* Operational Mode Navigation Tabs */}
        <div className="wv-hq-mode-tabs">
          <button
            type="button"
            onClick={() => setActiveMode('office')}
            className={`wv-hq-mode-tab ${activeMode === 'office' ? 'is-active' : ''}`}
          >
            <Compass size={14} color="#3b82f6" />
            <span>Office floor (3D)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('operations')}
            className={`wv-hq-mode-tab ${activeMode === 'operations' ? 'is-active' : ''}`}
          >
            <LayoutDashboard size={14} color="#06b6d4" />
            <span>Operations</span>
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
            <span>AI command center</span>
            {pendingApprovalsCount > 0 && (
              <span className="wv-hq-tab-badge">{pendingApprovalsCount}</span>
            )}
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="wv-hq-header-right">
          {onSeedSquad && world.entities.length < capacity && (
            <button
              type="button"
              onClick={onSeedSquad}
              disabled={isSeeding}
              className="wv-hq-action-btn is-seed"
            >
              {isSeeding ? <Loader2 size={13} className="wv-spin" /> : <Sparkles size={13} />}
              <span>Build squad ({capacity})</span>
            </button>
          )}

          {activeMode === 'office' && (
            <>
              {/* Pin Mode 3-Way Cycle Toggle */}
              <button
                type="button"
                onClick={handleCyclePinMode}
                className={`wv-hq-action-btn ${pinMode !== 'off' ? 'is-active' : ''}`}
                title="Cycle labels: off ➔ numbers (#) ➔ names"
              >
                <Tag size={14} />
                <span>
                  {pinMode === 'off' ? 'Labels: off' : pinMode === 'pins' ? 'Desk no. (#)' : 'Names'}
                </span>
              </button>

              {/* Command Bar Toggle */}
              <button
                type="button"
                onClick={() => setShowCommandBar((prev) => !prev)}
                className={`wv-hq-action-btn ${showCommandBar ? 'is-active' : ''}`}
                title={showCommandBar ? 'Hide mission panel' : 'Show mission panel'}
              >
                <Terminal size={14} />
                <span className="wv-hide-mobile">Mission panel</span>
              </button>

              {/* Roster Sidebar Toggle */}
              <button
                type="button"
                onClick={handleToggleRoster}
                className={`wv-hq-action-btn ${showRoster ? 'is-active' : ''}`}
                title={showRoster ? 'Hide roster panel' : 'Show roster panel'}
              >
                {showRoster ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                <span className="wv-hide-mobile">Roster ({world.entities.length})</span>
              </button>

              {/* Lighting Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !nightMode
                  setNightMode(next)
                  virtualWorldRef.current?.setNightMode(next)
                }}
                className="wv-hq-icon-btn"
                title={nightMode ? 'Switch to day mode (bright studio)' : 'Switch to night mode (evening lights)'}
              >
                {nightMode ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} />}
              </button>

              {/* Camera Reset */}
              <button
                type="button"
                onClick={() => virtualWorldRef.current?.resetCamera()}
                className="wv-hq-icon-btn"
                title="Reset camera to the default isometric angle"
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
              title="Open as a standalone fullscreen page"
            >
              <ExternalLink size={14} />
              <span className="wv-hide-mobile">Open standalone</span>
            </a>
          ) : (
            <a
              href={returnUrl}
              className="wv-hq-action-btn"
              title="Back to dashboard"
            >
              <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
              <span className="wv-hide-mobile">Dashboard</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="wv-hq-icon-btn"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="wv-hq-icon-btn"
              title="Refresh data"
            >
              <RefreshCw size={15} className={refreshing ? 'wv-spin' : ''} />
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Content Viewport */}
      <div className="wv-hq-main-viewport">
        {/* ========================================================== */}
        {/* MODE 1: 3D VIRTUAL WORLD VIEW                              */}
        {/* ========================================================== */}
        {activeMode === 'office' && (
          <div className="wv-hq-office-layout">
            <div className="wv-hq-canvas-wrapper">
              {loading && (
                <div className="wv-hq-loading-overlay">
                  <Loader2 size={32} className="wv-spin" color="#3b82f6" />
                  <p>Loading the 3D office floor...</p>
                </div>
              )}

              {/* Navigation Hint */}
              <div className="wv-hq-nav-hint">
                <Compass size={14} color="#3b82f6" />
                <span>Click a 3D desk to open its profile • Left drag: orbit • Right drag: pan • Wheel: zoom</span>
              </div>

              {/* 3D Viewport */}
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
                {/* Friendly empty state when no occupants are placed yet */}
                {world.entities.length === 0 && (
                  <div className="wv-hq-empty-floor">
                    <div className="wv-hq-empty-floor-card">
                      <Users size={28} />
                      <h3>The floor is ready — nobody is in yet</h3>
                      <p>
                        All {capacity} desks are installed and waiting. Bring your team in and they
                        will take their seats here in 3D.
                      </p>
                      {onSeedSquad && (
                        <button
                          type="button"
                          onClick={onSeedSquad}
                          disabled={isSeeding}
                          className="wv-hq-empty-floor-btn"
                        >
                          {isSeeding ? <Loader2 size={14} className="wv-spin" /> : <Sparkles size={14} />}
                          <span>Build the squad ({capacity})</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Floating Bottom Command Bar Overlay */}
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
                />
              </VirtualWorld>
            </div>

            {/* Collapsible Roster Sidebar */}
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
              />
            )}

            {/* Selected Entity Profile Drawer */}
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
              />
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* MODE 2: OPERATIONS DASHBOARD                               */}
        {/* ========================================================== */}
        {activeMode === 'operations' && (
          <div className="wv-hq-operations-view">
            {/* Metrics Grid */}
            <div className="wv-hq-ops-metrics-grid">
              <div className="wv-hq-ops-metric-card">
                <div className="wv-ops-metric-header">
                  <span>Total projects</span>
                  <FolderKanban size={16} color="#3b82f6" />
                </div>
                <div className="wv-ops-metric-num">{projects.length}</div>
                <p className="wv-ops-metric-sub">Active work portfolio</p>
              </div>

              <div className="wv-hq-ops-metric-card">
                <div className="wv-ops-metric-header">
                  <span>Departments</span>
                  <Building2 size={16} color="#06b6d4" />
                </div>
                <div className="wv-ops-metric-num">{departments.length}</div>
                <p className="wv-ops-metric-sub">Functional work cells</p>
              </div>

              <div className="wv-hq-ops-metric-card">
                <div className="wv-ops-metric-header">
                  <span>Active staff</span>
                  <Zap size={16} color="#a855f7" />
                </div>
                <div className="wv-ops-metric-num">{activeWorkersCount} / {capacity}</div>
                <p className="wv-ops-metric-sub">Specialists working at their desks</p>
              </div>

              <div className="wv-hq-ops-metric-card">
                <div className="wv-ops-metric-header">
                  <span>Awaiting approval</span>
                  <Clock size={16} color="#f59e0b" />
                </div>
                <div className="wv-ops-metric-num">{pendingApprovalsCount}</div>
                <p className="wv-ops-metric-sub">Missions pending a manager approval</p>
              </div>
            </div>

            {/* Department Hubs & Activity Timeline */}
            <div className="wv-hq-ops-cols">
              <div className="wv-hq-ops-dept-col">
                <h2 className="wv-hq-section-heading">
                  <Building2 size={16} color="#3b82f6" />
                  <span>Department rooms & desks</span>
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
                            {isDeptBusy && <span className="wv-dept-busy-badge">⚡ Working</span>}
                          </div>
                          <h3 className="wv-dept-name">{dept.name}</h3>
                          <p className="wv-dept-desc">{dept.description}</p>
                        </div>

                        <div className="wv-dept-card-bottom">
                          <span>{deptEntities.length} {deptEntities.length === 1 ? 'desk' : 'desks'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory(dept.slug ?? dept.id)
                              setActiveMode('office')
                            }}
                            className="wv-dept-link-btn"
                          >
                            <span>Go to room</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="wv-hq-ops-act-col">
                <h2 className="wv-hq-section-heading">
                  <Activity size={16} color="#3b82f6" />
                  <span>System activity feed</span>
                </h2>

                <div className="wv-hq-act-box">
                  {activities.length === 0 ? (
                    <div className="wv-hq-empty-act">
                      <Clock size={24} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                      <p>No recorded system activity yet.</p>
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

        {/* ========================================================== */}
        {/* MODE 3: AI COMMAND CENTER                                  */}
        {/* ========================================================== */}
        {activeMode === 'command_center' && (
          <div className="wv-hq-command-view">
            <div className="wv-hq-command-center-box">
              {/* Mission Header Card */}
              <div className="wv-hq-dispatch-card">
                <div className="wv-dispatch-header-row">
                  <div className="wv-dispatch-icon-badge">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h2 className="wv-dispatch-title">AI command & orchestration</h2>
                    <p className="wv-dispatch-sub">
                      Dispatch missions to every department automatically through the general manager.
                    </p>
                  </div>
                </div>

                <div className="wv-dispatch-input-area">
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={3}
                    placeholder="Describe a company goal or a complex project... (e.g. Build the strategy, visual briefs and budget plan for our new digital marketing campaign)"
                    className="wv-dispatch-textarea"
                  />
                  <div className="wv-dispatch-actions-row">
                    <button
                      type="button"
                      onClick={() => setIsDemoMode(!isDemoMode)}
                      className={`wv-demo-toggle-btn ${isDemoMode ? 'is-demo' : 'is-ai'}`}
                    >
                      {isDemoMode ? <Sparkles size={14} /> : <Bot size={14} />}
                      <span>{isDemoMode ? 'Fast demo simulation' : 'Real LLM API'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDispatch}
                      disabled={isLaunching || !promptText.trim()}
                      className="wv-dispatch-submit-big-btn"
                    >
                      {isLaunching ? <Loader2 size={16} className="wv-spin" /> : <Send size={15} />}
                      <span>Start orchestration</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tasks Review Feed */}
              <div className="wv-hq-review-section">
                <h3 className="wv-hq-section-heading">
                  <Clock size={16} color="#f59e0b" />
                  <span>Missions awaiting review & approval</span>
                </h3>

                <div className="wv-hq-review-feed">
                  {world.entities.filter((e) => getEntityLatestTask && getEntityLatestTask(e.id)).length === 0 ? (
                    <div className="wv-hq-empty-feed">
                      No completed or approval-pending missions yet.
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
                              <span>View report</span>
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

      {/* 3. Report Modal */}
      {viewingReport && (
        <VirtualReportModal
          report={viewingReport}
          onClose={() => setViewingReport(null)}
        />
      )}
    </div>
  )
}
