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
- **Hot-Synced Entities (1.2.0)**: When the `world` prop changes (e.g. a status poll), entities are diffed and updated **in place** — the scene, camera position, lights and cached GLB models are never rebuilt. No flicker, no reloads, no lost camera angle.
- **WebGL Resilience (1.2.0)**: Graceful fallback UI when WebGL is unavailable, and a one-click restore overlay if the GPU context is lost mid-session.
- **Battery Friendly (1.2.0)**: The render loop pauses automatically while the tab is hidden.
- **Locked 60 FPS Performance**: Direct GPU CSS `translate3d` projection for floating labels and pins without React state re-rendering overhead during orbit/zoom.
- **Interactive Entities & Raycasting**: Click and hover directly on 3D desks, monitors, robots, or avatars.
- **Architectural Presets** (occupant-free — slots only):
  - `officePreset`: 17-desk architectural floorplan with executive suite, meeting room, and glass partitions (`OFFICE_SLOTS`).
  - `farmPreset`: Greenhouses, crops, barns, tractors (`FARM_SLOTS`).
  - `factoryPreset`: Conveyor belts, robotic arms, storage racks (`FACTORY_SLOTS`).
  - `schoolPreset`: Lecture halls, interactive smartboards, science labs (`SCHOOL_SLOTS`).
  - `hospitalPreset`: Triage rooms, consultation suites, patient monitoring (`HOSPITAL_SLOTS`).
- **DigitalHQView**: A complete, embeddable "digital headquarters" screen — 3D office floor, operations dashboard, and an AI command center wired through a single `onDispatchMission` callback. Departments default to a neutral zone-based grouping when the consumer passes none.
- **Contextual Inspector & Profile Drawer**: Role, status, metrics, latest task, and custom application actions.
- **Day & Night Simulation**: One-click smooth lighting transitions.
- **Pin & Label Modes**: Minimal circular pins (`#1`..`#17`) with status indicators, expandable chips, or hidden mode.

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
