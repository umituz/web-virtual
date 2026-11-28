# @umituz/web-virtual

Universal 3D Virtual Environment Engine for Web and React.

Build realistic, high-performance, interactive 3D virtual offices, farms, industrial factories, schools, and hospitals with locked 60fps rendering, raycasting, and contextual inspectors.

All UI strings are **English** so the package drops into any product without locale friction. Consumer-supplied data (entity names, missions, roles) is rendered verbatim.

## Architecture vs. data

The package ships **architecture only** — buildings, rooms (zones), lighting, and anchor **slots** (where someone *can* sit). All occupant and org data is **yours**, passed in as props:

| Package provides | Consumer provides |
|---|---|
| 3D engine, camera, raycasting, labels/pins | `entities` — who/what occupies the world |
| Presets: floorplan geometry, furniture, zones | `departments` — org grouping (else derived from zones) |
| Anchor `slots` (position, zone, pin number) | `zones` override — localized zone labels |
| Digital HQ chrome (roster, ops, command center) | Missions, projects, activities, metrics |

Entities without an explicit `position` are auto-placed onto preset slots — by `slotId`, by matching `id`, or the next free slot — inheriting position, rotation, zone and pin number from the architecture. You only ever describe **who**, never **where**.

---

## Features

- **Universal Engine**: Agnostic to domain (Corporate Offices, Agriculture, Automation Factories, Campus, Healthcare).
- **Engine Tick Animations (2.1.0)**: Register per-frame scene motion (`registerTick`) on the engine's own render loop — wind sway, water ripples, spinning wheels, grazing herds. No separate `requestAnimationFrame` needed; pauses with the tab, cleared on dispose.
- **Standalone World Page Shell (2.2.0)**: `VirtualWorldPage` — the full-screen chrome every data-driven world needs (header with back/title/meta + label, night, top-view & reset actions; selected-entity card; hint pill; sectioned sidebar rows that focus entities; optional footer). All strings arrive via the `labels` prop (i18n stays yours), all theming via `--wv-page-*` CSS custom properties. Ships with `createTickBinder()` (bind/queue bridge for the engine tick), `useStableSnapshot()` (freeze the first world build per visit so refetches never steal the camera) and `isNightHour()` (local-hour night default).
- **Nature / Farm / Animal Builders (2.1.0)**: Procedural, config-driven `createCropPlot` (growth 0–1), `createTree`/`createTreeRow` (+`applyWindSway`), `createFence`, `createPond`, `createAnimal`/`createHerd` (cow/sheep/goat/chicken), `createTractor`, plus farm architecture (barn, silo, greenhouse, machine shed, coop).
- **Hot-Synced Entities (1.2.0)**: When the `world` prop changes (e.g. a status poll), entities are diffed and updated **in place** — the scene, camera position, lights and cached GLB models are never rebuilt. No flicker, no reloads, no lost camera angle.
- **WebGL Resilience (1.2.0)**: Graceful fallback UI when WebGL is unavailable, and a one-click restore overlay if the GPU context is lost mid-session.
- **Battery Friendly (1.2.0)**: The render loop pauses automatically while the tab is hidden.
- **Locked 60 FPS Performance**: Direct GPU CSS `translate3d` projection for floating labels and pins without React state re-rendering overhead during orbit/zoom.
- **Interactive Entities & Raycasting**: Click and hover directly on 3D desks, monitors, robots, or avatars.
- **Architectural Presets** (occupant-free — slots only):
  - `officePreset`: 17-desk architectural floorplan with executive suite, meeting room, and glass partitions (`OFFICE_SLOTS`).
  - `farmPreset`: Staged crop plots, greenhouse benches, fenced pasture with animated herds, a rippling pond, barn + silo, machinery yard and poultry run (`FARM_SLOTS`).
  - `factoryPreset`: Conveyor belts, robotic arms, storage racks (`FACTORY_SLOTS`).
  - `schoolPreset`: Lecture halls, interactive smartboards, science labs (`SCHOOL_SLOTS`).
  - `hospitalPreset`: Triage rooms, consultation suites, patient monitoring (`HOSPITAL_SLOTS`).
- **DigitalHQView**: A complete, embeddable "digital headquarters" screen — 3D office floor, operations dashboard, and an AI command center wired through a single `onDispatchMission` callback. Departments default to a neutral zone-based grouping when the consumer passes none.
- **Contextual Inspector & Profile Drawer**: Role, status, metrics, latest task, and custom application actions.
- **Day & Night Simulation**: One-click smooth lighting transitions.
- **Pin & Label Modes**: Minimal circular pins (`#1`..`#17`) with status indicators, expandable chips, or hidden mode.

## Vertical Farm / CEA Laboratory (2.7.0)

Closed-environment cultivation, fully config-driven — the same architecture-only
contract as every other preset:

| Builder | What it makes |
| --- | --- |
| `createLabShell({ width, depth, height, panels })` | Clean-room shell — floor grid, walls, emissive ceiling panels, observation window |
| `createGrowRack({ tiers, trays: { growth }, led })` | Multi-tier rack — frame, tray slabs, instanced plants (growth 0→1) and one LED bar per tier |
| `createLedBar({ spectrum, periodSeconds })` | Emissive LED bar — `vegetative` / `flowering` / `full` spectra with a breathing photoperiod cycle |
| `createVerticalTower({ mist })` | Pocketed fog tower with instanced canopies and drifting mist |
| `createFishTank({ fishCount })` | Aquaponic tank — glass, water volume, schooling fish on looping swim paths |
| `createHydroLoop({ points })` | Closed pipe loop with glowing flow dashes streaming along the curve |
| `createClimateUnit({ fanSpeed })` | HVAC body, spinning fan and a soft airflow cone |
| `createWorkbench({ trays, console })` | Propagation bench, seedling trays and a status console |

Scene richness is engine-level: `effects: { bloom: { strength, radius, threshold } }`
on the world or preset switches the renderer to an `EffectComposer` pipeline
(UnrealBloom + OutputPass — LED bars and flow dashes actually glow); the loop is
still the same battery-aware engine tick. Also new: `createPhotoperiod()`
(on/off/fade cycle math), `createMistField()` (drifting particle volumes for
fog, humidity or CO₂), `createCameraTour()` (OrbitControls auto-orbit handle),
and `lighting.interiorSpots: false` turns the default office downlights off so
labs light themselves from their own fixtures.

`verticalLabPreset` composes all of it — two rack rows, a fog-tower aisle, the
aquaponic tank with its hydro loop, ceiling climate units and a propagation
bench (`VERTICAL_LAB_SLOTS` for occupant anchors). Bloom is on by default
there; pass `effects: { bloom: false }` to opt out.

### Guided tour (2.7.1)

`VirtualWorldPage` accepts a `tour` prop — a config-driven cinematic walk-through:

```tsx
<VirtualWorldPage
  tour={{
    stops: [
      { id: 'intro', title: 'Grow room', caption: 'Four rack rows under LED photoperiod', position: [15, 9.5, 17], target: [0, 2, 0] },
      { id: 'tanks', title: 'Aquaponics', caption: 'Fish waste feeds the towers', position: [8, 3, 6], target: [5.5, 0.9, 2.5], holdSeconds: 8 },
    ],
    autoRotateSpeed: 0.8,
    transitionSeconds: 2.4,
  }}
  labels={{ toggleTour: 'Guided tour' }}
  …
/>
```

The camera damps to each stop (`position` + `target`), slow-orbits while
holding, then advances; a caption pill renders the current stop's `title` /
`caption` (consumer strings — the package ships none). A play/stop button is
added to the header; the top-view and reset buttons end the tour. Engine-side
the same machinery is available via `WorldEngine.startTour(config, onStop)` /
`stopTour()` and the `createCameraTour()` auto-orbit handle.

---

---

## Installation

```bash
npm install @umituz/web-virtual three lucide-react
```

## Quick Start

```tsx
import {
  VirtualWorld,
  createEnvironment,
  officePreset,
} from '@umituz/web-virtual'
import '@umituz/web-virtual/styles.css'

export function MyOfficePage() {
  const world = createEnvironment({
    preset: officePreset,
    name: 'Acme Corp HQ',
  })

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <VirtualWorld
        world={world}
        preset={officePreset}
        onSelectEntity={(entity) => console.log('Selected:', entity)}
      />
    </div>
  )
}
```

### Live status updates (hot-sync)

Poll or stream your data and pass a fresh `world` object — the engine diffs entities and updates status rings, animations and transforms in place. Poll every few seconds without penalty:

```tsx
const world = useMemo(
  () => createEnvironment({ preset: officePreset, name: 'HQ', entities: liveEntities }),
  [liveEntities],
)

return <VirtualWorld world={world} preset={officePreset} />
```

### Scene animations on the engine loop (2.1.0)

`buildScene` receives a `registerTick` hook — register any per-frame motion
there and the engine steps it inside its own loop (tab-hidden pause and
dispose cleanup included). The same hook is available on the component ref:

```tsx
import type { WorldPreset } from '@umituz/web-virtual'

const myPreset: WorldPreset = {
  /* …camera, lighting, theme, zones… */
  buildScene: (scene, { registerTick }) => {
    const herd = createHerd({ species: 'cow', count: 6, registerTick })
    scene.add(herd)
    applyWindSway(treeRow, registerTick, { intensity: 0.03 })
  },
}

// Or from the page:
const onReady = (ref: VirtualWorldRef) =>
  ref.registerTick((_delta, elapsed) => {
    myMesh.rotation.y = elapsed * 0.4
  })
```

### Standalone world page (2.2.0)

`VirtualWorldPage` wraps a `VirtualWorld` with the whole page — hand it data,
labels and two render slots; it owns pinMode/night/selection state, the focus
wiring and the responsive layout:

```tsx
import { VirtualWorldPage, createEnvironment } from '@umituz/web-virtual'
import '@umituz/web-virtual/styles.css'

<VirtualWorldPage
  world={world}
  preset={myPreset}
  title="Club Aria"
  meta={`${liveCount} live · ${personaCount} co-hosts`}
  back={<Link to="/discover">Discover</Link>}
  initialNight="auto"        // local-hour day/night; 'nightToggle' adds the button
  selectedAlign="start"      // or 'center'
  hint="Click a stage to watch · drag to orbit · scroll to zoom"
  sections={[
    { key: 'live', heading: 'Now live', rows: liveRows },
    { key: 'vips', heading: 'VIP lofts', rows: vipRows }, // rows: {id, label, meta?, dotColor?, dashed?}
  ]}
  labels={{ topView: 'Üst görünüm', resetView: 'Sıfırla' }}  // your i18n
  renderOpenLink={(entity) => <Link to={`/x/${entity.id}`}>Open</Link>}
  footer="Click a stage to watch its stream"
/>
```

Theme it from consumer CSS by overriding the custom properties (dark clubs,
paper-white farms — same shell):

```css
.club {
  --wv-page-bg: #0b0b0f;
  --wv-page-surface: #111827;
  --wv-page-fg: #e8edf8;
  --wv-page-muted: #8b93a7;
  --wv-page-line: #27334a;
  --wv-page-accent: #7c3aed;
  --wv-page-accent-soft: rgba(124, 58, 237, 0.14);
}
```

Companion utilities:

| Export | What it does |
| --- | --- |
| `createTickBinder()` | Module-scoped bind/queue bridge for `registerTick` — animations registered before the engine mounts flush on the next bind |
| `useStableSnapshot(fresh)` | Freezes the first non-null value per visit (world builds) so background refetches never rebuild the scene |
| `isNightHour(from?, to?)` | Local-hour night check (wraps midnight) for `initialNight="auto"` |

### Procedural nature / farm builders (2.1.0)

All builders are pure config — no domain data, no fetching, nothing
project-specific:

| Builder | What it makes |
| --- | --- |
| `createCropPlot({ growth, rows, cropColor })` | Raised soil bed + instanced crop rows; `growth` 0→1 scales height and density |
| `createTree({ shape, season })` / `createTreeRow` | Low-poly trees (round/broad/conifer, spring→winter) |
| `applyWindSway(target, registerTick)` | Sine sway for foliage (or any group) |
| `createFence({ points })` | Ranch/picket fence along a polyline |
| `createPond({ radius, registerTick })` | Water disc with looping ripple rings |
| `createAnimal` / `createHerd` | Cow, sheep, goat, chicken — deterministic scatter, grazing animation |
| `createTractor({ status, implement })` | Wheels spin and engine shivers when `status: 'running'` |
| `createBarn`, `createSilo`, `createGreenhouse`, `createMachineShed`, `createCoop` | Farm architecture — every piece optional and parameterized |

### Your occupants, your language (any preset)

Occupants carry no positions — they are auto-placed onto the preset's slots. Pin someone to a specific desk with `slotId`, or let them fill slots in order. Same API for every preset:

```tsx
import { createEnvironment, farmPreset } from '@umituz/web-virtual'

const world = createEnvironment({
  preset: farmPreset,
  name: 'Agromera Çiftlik',
  zones: TurkishZoneLabels,          // optional: localize room names
  entities: [
    { slotId: 'slot-1', type: 'person', name: 'Ahmet', role: 'Sera operatörü', status: 'working' },
    { slotId: 'slot-2', type: 'vehicle', name: 'Traktör Alpha', status: 'running' },
  ],
})
```

### Full digital HQ screen

```tsx
import { DigitalHQView, createEnvironment, officePreset } from '@umituz/web-virtual'

<DigitalHQView
  world={world}
  preset={officePreset}
  deskCapacity={17}
  onDispatchMission={async ({ prompt, targetId, isDemo }) => {
    await fetch('/api/office/dispatch', {
      method: 'POST',
      body: JSON.stringify({ prompt, targetId, demo: isDemo }),
    })
  }}
  getEntityLatestTask={(id) => latestTaskById.get(id) ?? null}
/>
```

---

## Key props

### `VirtualWorld`

| Prop | Type | Notes |
|---|---|---|
| `world` | `WorldDefinition` | Hot-synced: changes update the scene in place. |
| `preset` | `WorldPreset` | Scene is built once per preset instance. |
| `pinMode` | `'pins' \| 'labels' \| 'off'` | Controlled or uncontrolled label display. |
| `nightMode` | `boolean` | Smooth day/night lighting transition. |
| `onSelectEntity` / `onHoverEntity` | callback | Fired from 3D raycast hits and pins. |

Ref API (`VirtualWorldRef`): `focusOnEntity`, `setCameraPreset`, `resetCamera`, `setNightMode`, `resize`.

### `DigitalHQView`

Everything `VirtualWorld` renders plus an operations dashboard and AI command center. Notable props: `departments` (consumer org data; neutral zone-based groups when omitted), `projects`, `activities`, `presetMissions`, `deskCapacity` (defaults to the world's entity count), `getEntityMetrics`, `getEntityLatestTask`, `onDispatchMission({ prompt, targetId, isDemo })`, `onSeedSquad`.

---

## License

MIT © umituz
