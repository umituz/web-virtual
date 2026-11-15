import {
  type ReactNode,
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
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
} from 'lucide-react'
import type { WorldDefinition, WorldEntity, WorldPreset } from '../core/types'
import { VirtualWorld, type VirtualWorldRef } from './VirtualWorld'
import { VirtualCommandBar, type PresetMission } from './VirtualCommandBar'
import { VirtualRoster } from './VirtualRoster'
import { VirtualEntityDrawer, type EntityRunMetrics, type EntityLatestTask } from './VirtualEntityDrawer'
import { VirtualReportModal, type VirtualReportData } from './VirtualReportModal'
import { DEFAULT_OFFICE_DEPARTMENTS, type DepartmentInfo } from '../presets/officePreset'

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
  returnUrl?: string
  standaloneUrl?: string
  className?: string
}

export function DigitalHQView({
  world,
  preset,
  departments = DEFAULT_OFFICE_DEPARTMENTS,
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
  returnUrl = '/app/office',
  standaloneUrl = '/digital-hq',
  className = '',
}: DigitalHQViewProps): ReactNode {
  // Navigation Mode
  const [activeMode, setActiveMode] = useState<OperationalMode>('office')

  // Layout / Sidebar
  const virtualWorldRef = useRef<VirtualWorldRef>(null)
  const [showRoster, setShowRoster] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

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
    setShowRoster((prev) => {
      const next = !prev
      setTimeout(() => virtualWorldRef.current?.resize(), 50)
      return next
    })
  }, [])

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

  const pendingApprovalsCount = useMemo(() => {
    return world.entities.filter((e) => e.status === 'awaiting_approval').length
  }, [world.entities])

  return (
    <div className={`wv-hq-container ${className}`}>
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
              <p className="wv-hq-brand-desc">Yapay Zeka Destekli Sanal Karargah</p>
            </div>
          </div>

          <div className="wv-hq-stats-row">
            <span className="wv-hq-stat-pill is-green">
              <span className="wv-hq-pip" />
              {world.entities.length} / 17 Masa Dolu
            </span>
            {activeWorkersCount > 0 && (
              <span className="wv-hq-stat-pill is-purple">
                <Zap size={12} />
                {activeWorkersCount} Görevde
              </span>
            )}
            {pendingApprovalsCount > 0 && (
              <span className="wv-hq-stat-pill is-amber">
                <Clock size={12} />
                {pendingApprovalsCount} Onay Bekliyor
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
            <span>Ofis Katı (3D)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('operations')}
            className={`wv-hq-mode-tab ${activeMode === 'operations' ? 'is-active' : ''}`}
          >
            <LayoutDashboard size={14} color="#06b6d4" />
            <span>Operasyonlar</span>
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
            <span>AI Komuta Merkezi</span>
            {pendingApprovalsCount > 0 && (
              <span className="wv-hq-tab-badge">{pendingApprovalsCount}</span>
            )}
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="wv-hq-header-right">
          {onSeedSquad && world.entities.length < 17 && (
            <button
              type="button"
              onClick={onSeedSquad}
              disabled={isSeeding}
              className="wv-hq-action-btn is-seed"
            >
              {isSeeding ? <Loader2 size={13} className="wv-spin" /> : <Sparkles size={13} />}
              <span>Kadro Ekle (17)</span>
            </button>
          )}

          {activeMode === 'office' && (
            <button
              type="button"
              onClick={handleToggleRoster}
              className={`wv-hq-action-btn ${showRoster ? 'is-active' : ''}`}
              title={showRoster ? 'Kadro Panelini Gizle' : 'Kadro Panelini Aç'}
            >
              {showRoster ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
              <span className="wv-hide-mobile">Kadro Paneli</span>
            </button>
          )}

          {!standalone ? (
            <a
              href={standaloneUrl}
              target="_blank"
              rel="noreferrer"
              className="wv-hq-action-btn"
              title="Tam Ekran Bağımsız Sayfada Aç"
            >
              <ExternalLink size={14} />
              <span className="wv-hide-mobile">Ayrı Sayfada Aç</span>
            </a>
          ) : (
            <a
              href={returnUrl}
              className="wv-hq-action-btn"
              title="Dashboard'a Dön"
            >
              <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
              <span className="wv-hide-mobile">Dashboard</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="wv-hq-icon-btn"
            title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="wv-hq-icon-btn"
              title="Verileri Yenile"
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
                  <p>3D Dijital Ofis Katı Yükleniyor...</p>
                </div>
              )}

              {/* Navigation Hint */}
              <div className="wv-hq-nav-hint">
                <Compass size={14} color="#3b82f6" />
                <span>3D Masaya Tıkla: Bilgiler Açılır • Sol Tık: Çevir • Sağ Tık: Kaydır • Tekerlek: Yakınlaş</span>
              </div>

              {/* 3D Viewport */}
              <VirtualWorld
                ref={virtualWorldRef}
                world={world}
                preset={preset}
                selectedEntityId={activeEntity?.id}
                onSelectEntity={handleSelect}
                defaultPinMode="pins"
                showControls={true}
                showInspector={false}
              >
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
                  <span>Toplam Proje</span>
                  <FolderKanban size={16} color="#3b82f6" />
                </div>
                <div className="wv-ops-metric-num">{projects.length}</div>
                <p className="wv-ops-metric-sub">Aktif iş geliştirme portföyü</p>
              </div>

              <div className="wv-hq-ops-metric-card">
                <div className="wv-ops-metric-header">
                  <span>Departman Sayısı</span>
                  <Building2 size={16} color="#06b6d4" />
                </div>
                <div className="wv-ops-metric-num">{departments.length}</div>
                <p className="wv-ops-metric-sub">Fonksiyonel çalışma hücresi</p>
              </div>

              <div className="wv-hq-ops-metric-card">
                <div className="wv-ops-metric-header">
                  <span>Aktif Çalışan</span>
                  <Zap size={16} color="#a855f7" />
                </div>
                <div className="wv-ops-metric-num">{activeWorkersCount} / 17</div>
                <p className="wv-ops-metric-sub">Masasında çalışan uzmanlar</p>
              </div>

              <div className="wv-hq-ops-metric-card">
                <div className="wv-ops-metric-header">
                  <span>Onay Bekleyen</span>
                  <Clock size={16} color="#f59e0b" />
                </div>
                <div className="wv-ops-metric-num">{pendingApprovalsCount}</div>
                <p className="wv-ops-metric-sub">Yönetici onayı bekleyen görevler</p>
              </div>
            </div>

            {/* Department Hubs & Activity Timeline */}
            <div className="wv-hq-ops-cols">
              <div className="wv-hq-ops-dept-col">
                <h2 className="wv-hq-section-heading">
                  <Building2 size={16} color="#3b82f6" />
                  <span>Departman Odaları & Masaları</span>
                </h2>

                <div className="wv-hq-dept-cards-grid">
                  {departments.map((dept) => {
                    const deptEntities = world.entities.filter((e) => dept.slotIds.includes(e.id))
                    const isDeptBusy = deptEntities.some((e) => e.status === 'running' || e.status === 'working')

                    return (
                      <div key={dept.id} className="wv-hq-dept-card">
                        <div>
                          <div className="wv-dept-card-top">
                            <span className="wv-dept-color-pip" style={{ backgroundColor: dept.color }} />
                            {isDeptBusy && <span className="wv-dept-busy-badge">⚡ Çalışıyor</span>}
                          </div>
                          <h3 className="wv-dept-name">{dept.name}</h3>
                          <p className="wv-dept-desc">{dept.description}</p>
                        </div>

                        <div className="wv-dept-card-bottom">
                          <span>{deptEntities.length} Masa</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory(dept.slug)
                              setActiveMode('office')
                            }}
                            className="wv-dept-link-btn"
                          >
                            <span>Odaya Git</span>
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
                  <span>Sistem Aktivite Akışı</span>
                </h2>

                <div className="wv-hq-act-box">
                  {activities.length === 0 ? (
                    <div className="wv-hq-empty-act">
                      <Clock size={24} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                      <p>Kayıtlı sistem aktivitesi bulunmuyor.</p>
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
                    <h2 className="wv-dispatch-title">Yapay Zeka Komuta ve Orkestrasyon</h2>
                    <p className="wv-dispatch-sub">
                      Genel Müdürlük üzerinden tüm departman çalışanlarına otomatik görev dağıtımı yapın.
                    </p>
                  </div>
                </div>

                <div className="wv-dispatch-input-area">
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={3}
                    placeholder="Şirket hedefinizi veya karmaşık projenizi yazın... (Örn: Yeni dijital pazarlama kampanyası için strateji, görsel briefler ve bütçe planını oluştur)"
                    className="wv-dispatch-textarea"
                  />
                  <div className="wv-dispatch-actions-row">
                    <button
                      type="button"
                      onClick={() => setIsDemoMode(!isDemoMode)}
                      className={`wv-demo-toggle-btn ${isDemoMode ? 'is-demo' : 'is-ai'}`}
                    >
                      {isDemoMode ? <Sparkles size={14} /> : <Bot size={14} />}
                      <span>{isDemoMode ? 'Demo Hızlı Simülasyon' : 'Gerçek LLM API'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDispatch}
                      disabled={isLaunching || !promptText.trim()}
                      className="wv-dispatch-submit-big-btn"
                    >
                      {isLaunching ? <Loader2 size={16} className="wv-spin" /> : <Send size={15} />}
                      <span>Orkestrasyonu Başlat</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tasks Review Feed */}
              <div className="wv-hq-review-section">
                <h3 className="wv-hq-section-heading">
                  <Clock size={16} color="#f59e0b" />
                  <span>Onay ve Denetim Bekleyen Görevler</span>
                </h3>

                <div className="wv-hq-review-feed">
                  {world.entities.filter((e) => getEntityLatestTask && getEntityLatestTask(e.id)).length === 0 ? (
                    <div className="wv-hq-empty-feed">
                      Henüz tamamlanan veya onay bekleyen bir görev bulunmuyor.
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
                              <span>Raporu Gör</span>
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
