/**
 * VirtualWorldPage — the generic standalone world page: full-screen chrome
 * around a VirtualWorld so data-driven worlds (a club, a farm, any venue)
 * need zero local scaffolding. Owns the shared UI contract — header with
 * back/title/meta + label, night, top-view and reset actions; canvas with
 * selected-entity card and hint pill; sectioned sidebar rows that focus
 * entities; optional footer bar.
 *
 * Everything visual is config: strings arrive via `labels`, slots via
 * ReactNode props, theming via `--wv-page-*` CSS custom properties.
 */

import {
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react'
import { LayoutGrid, Moon, Play, RotateCcw, Square, Sun, Tags } from 'lucide-react'
import type {
  PinDisplayMode,
  WorldDefinition,
  WorldEntity,
  WorldPreset,
  WorldTourConfig,
} from '../core/types'
import { isNightHour } from '../core/time'
import { VirtualWorld, type VirtualWorldProps, type VirtualWorldRef } from './VirtualWorld'

export interface WorldPageRow {
  /** Entity id focused when the row is clicked. */
  id: string
  label: ReactNode
  meta?: ReactNode
  /** Row dot color; omit for a dotless row. */
  dotColor?: string
  /** Dashed border variant (e.g. VIP rows). */
  dashed?: boolean
}

export interface WorldPageSection {
  key: string
  heading: ReactNode
  rows: WorldPageRow[]
}

export interface WorldPageLabels {
  /** Title for the pin-labels toggle button. */
  toggleLabels: string
  /** Title for the day/night toggle button. */
  toggleNight: string
  /** Aria-label for the top-view camera button. */
  topView: string
  /** Aria-label for the reset-camera button. */
  resetView: string
  /** Title for the guided-tour toggle button (rendered when `tour` is set). */
  toggleTour?: string
  /** Selected-card fallback when the entity opens nowhere. */
  focusOnly?: string
}

export type VirtualWorldPageProps = {
  world: WorldDefinition
  preset?: WorldPreset
  title: ReactNode
  /** Header meta line (counts, live status, …). */
  meta?: ReactNode
  /** Back navigation — a router link from the consumer (rendered in a pill). */
  back?: ReactNode
  sections?: WorldPageSection[]
  /** Extra content at the bottom of the sidebar (overflow notes, legends). */
  sidebarFooter?: ReactNode
  /** Full-width bar under the world canvas. */
  footer?: ReactNode
  /** Pill at the top of the canvas (controls hint). */
  hint?: ReactNode
  /** Selected-card alignment: centered (default) or anchored to the start. */
  selectedAlign?: 'center' | 'start'
  /** Initial pin display mode. */
  initialPinMode?: PinDisplayMode
  /** Initial night state; `'auto'` follows the viewer's local hour (19–07). */
  initialNight?: boolean | 'auto'
  /** Show the day/night toggle button. */
  nightToggle?: boolean
  /**
   * Guided cinematic tour: cycles the camera through stops with optional
   * narration (title/caption strings come from the consumer). Adds a play
   * button to the header and a caption pill over the canvas.
   */
  tour?: WorldTourConfig
  labels?: Partial<WorldPageLabels>
  /** Selected-card subtitle; defaults to `entity.metadata.subtitle` when a string. */
  renderSubtitle?: (entity: WorldEntity) => ReactNode
  /** Selected-card action (a router link/button); absent → focusOnly label. */
  renderOpenLink?: (entity: WorldEntity) => ReactNode
  onSelectEntity?: (entity: WorldEntity | null) => void
  /** Escape hatch for extra VirtualWorld props (showInspector, onHoverEntity, …). */
  worldProps?: Omit<
    VirtualWorldProps,
    'world' | 'preset' | 'pinMode' | 'nightMode' | 'selectedEntityId' | 'onSelectEntity' | 'className'
  >
  className?: string
  canvasClassName?: string
}

const DEFAULT_LABELS: WorldPageLabels = {
  toggleLabels: 'Toggle labels',
  toggleNight: 'Toggle day/night',
  topView: 'Top view',
  resetView: 'Reset view',
  toggleTour: 'Guided tour',
  focusOnly: 'focus only',
}

function metadataSubtitle(entity: WorldEntity): ReactNode {
  const value = entity.metadata?.subtitle
  return typeof value === 'string' ? value : null
}

export function VirtualWorldPage({
  world,
  preset,
  title,
  meta,
  back,
  sections = [],
  sidebarFooter,
  footer,
  hint,
  selectedAlign = 'center',
  initialPinMode = 'labels',
  initialNight = false,
  nightToggle = false,
  tour,
  labels,
  renderSubtitle,
  renderOpenLink,
  onSelectEntity,
  worldProps,
  className = '',
  canvasClassName = '',
}: VirtualWorldPageProps): ReactNode {
  const worldRef = useRef<VirtualWorldRef>(null)
  const [pinMode, setPinMode] = useState<PinDisplayMode>(initialPinMode)
  const [nightMode, setNightMode] = useState<boolean>(
    initialNight === 'auto' ? isNightHour() : initialNight,
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [touring, setTouring] = useState(false)
  const [tourStopIndex, setTourStopIndex] = useState<number | null>(null)

  const selected: WorldEntity | null = world.entities.find((e) => e.id === selectedId) ?? null

  const { onTourStopChange: consumerTourStopChange, ...passthroughWorldProps } = worldProps ?? {}

  const stopTour = useCallback((): void => {
    worldRef.current?.setTour(null)
    setTouring(false)
    setTourStopIndex(null)
  }, [])

  const toggleTour = useCallback((): void => {
    if (touring) {
      stopTour()
      return
    }
    if (!tour || tour.stops.length === 0) return
    worldRef.current?.setTour(tour)
    setTouring(true)
  }, [touring, tour, stopTour])

  const handleCanvasSelect = useCallback(
    (entity: WorldEntity | null): void => {
      setSelectedId(entity?.id ?? null)
      onSelectEntity?.(entity)
    },
    [onSelectEntity],
  )

  const focusRow = useCallback(
    (id: string): void => {
      setSelectedId(id)
      worldRef.current?.focusOnEntity(id)
    },
    [],
  )

  const resolved: WorldPageLabels = { ...DEFAULT_LABELS, ...labels }
  const openLink = selected ? renderOpenLink?.(selected) : null
  const subtitle = selected
    ? (renderSubtitle?.(selected) ?? metadataSubtitle(selected))
    : null
  const currentStop = tourStopIndex != null ? tour?.stops[tourStopIndex] : undefined

  return (
    <div className={`wv-page${className ? ` ${className}` : ''}`} data-wv-page>
      <header className="wv-page__header">
        {back && <div className="wv-page__back">{back}</div>}
        <div className="wv-page__heading">
          <span className="wv-page__title">{title}</span>
          {meta && <span className="wv-page__meta">{meta}</span>}
        </div>
        <div className="wv-page__actions">
          <button
            type="button"
            className="wv-page__btn"
            data-wv-labels
            title={resolved.toggleLabels}
            aria-label={resolved.toggleLabels}
            onClick={() => setPinMode(pinMode === 'labels' ? 'off' : 'labels')}
          >
            <Tags size={15} />
          </button>
          {nightToggle && (
            <button
              type="button"
              className="wv-page__btn"
              data-wv-night
              title={resolved.toggleNight}
              aria-label={resolved.toggleNight}
              onClick={() => setNightMode(!nightMode)}
            >
              {nightMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}
          {tour && tour.stops.length > 0 && (
            <button
              type="button"
              className="wv-page__btn"
              data-wv-tour-btn
              title={resolved.toggleTour}
              aria-label={resolved.toggleTour}
              aria-pressed={touring}
              onClick={toggleTour}
            >
              {touring ? <Square size={15} /> : <Play size={15} />}
            </button>
          )}
          <button
            type="button"
            className="wv-page__btn"
            data-wv-view-top
            title={resolved.topView}
            aria-label={resolved.topView}
            onClick={() => {
              stopTour()
              worldRef.current?.setCameraPreset('top')
            }}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            className="wv-page__btn"
            data-wv-reset
            title={resolved.resetView}
            aria-label={resolved.resetView}
            onClick={() => {
              stopTour()
              worldRef.current?.resetCamera()
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </header>

      <div className="wv-page__main">
        <div className="wv-page__world" data-wv-canvas>
          <VirtualWorld
            ref={worldRef}
            world={world}
            preset={preset}
            pinMode={pinMode}
            nightMode={nightMode}
            selectedEntityId={selectedId}
            onSelectEntity={handleCanvasSelect}
            showControls={false}
            showInspector={false}
            {...passthroughWorldProps}
            onTourStopChange={(index) => {
              setTourStopIndex(index)
              consumerTourStopChange?.(index)
            }}
            className={`wv-page__canvas${canvasClassName ? ` ${canvasClassName}` : ''}`}
          />

          {selected && (
            <div
              className={`wv-page__selected${selectedAlign === 'start' ? ' wv-page__selected--start' : ''}`}
              data-wv-selected
            >
              <span className="wv-page__selected-dot" style={{ backgroundColor: selected.avatarColor }} />
              <span className="wv-page__selected-body">
                <span className="wv-page__selected-name">{selected.name}</span>
                {subtitle && <span className="wv-page__selected-sub">{subtitle}</span>}
              </span>
              {openLink ? (
                <span className="wv-page__selected-action">{openLink}</span>
              ) : resolved.focusOnly ? (
                <span className="wv-page__selected-hint">{resolved.focusOnly}</span>
              ) : null}
            </div>
          )}

          {touring && currentStop && (currentStop.title || currentStop.caption) && (
            <div className="wv-page__tour" data-wv-tour>
              {currentStop.title && <span className="wv-page__tour-title">{currentStop.title}</span>}
              {currentStop.caption && (
                <span className="wv-page__tour-caption">{currentStop.caption}</span>
              )}
            </div>
          )}

          {hint && <div className="wv-page__hint">{hint}</div>}
        </div>

        {(sections.length > 0 || sidebarFooter) && (
          <aside className="wv-page__sidebar" data-wv-sidebar>
            {sections.map((section) => (
              <section className="wv-page__section" key={section.key}>
                <h2 className="wv-page__section-heading">{section.heading}</h2>
                <ul className="wv-page__list">
                  {section.rows.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        className={`wv-page-row${selectedId === row.id ? ' wv-page-row--active' : ''}${
                          row.dashed ? ' wv-page-row--dashed' : ''
                        }`}
                        onClick={() => focusRow(row.id)}
                      >
                        {row.dotColor && (
                          <span className="wv-page-row__dot" style={{ backgroundColor: row.dotColor }} />
                        )}
                        <span className="wv-page-row__label">{row.label}</span>
                        {row.meta && <span className="wv-page-row__meta">{row.meta}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {sidebarFooter}
          </aside>
        )}
      </div>

      {footer && <footer className="wv-page__footer">{footer}</footer>}
    </div>
  )
}
