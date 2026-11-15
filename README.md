# @umituz/web-virtual

Universal 3D Virtual Environment Engine for Web and React.

Build realistic, high-performance, interactive 3D virtual offices, farms, industrial factories, schools, and hospitals with locked 60fps rendering, raycasting, and contextual inspectors.

---

## Features

- **Universal Engine**: Agnostic to domain (Corporate Offices, Agriculture, Automation Factories, Campus, Healthcare).
- **Locked 60 FPS Performance**: Direct GPU CSS `translate3d` projection for floating labels and pins without React state re-rendering overhead during orbit/zoom.
- **Interactive Entities & Raycasting**: Click and hover directly on 3D desks, monitors, robots, or avatars.
- **Architectural Presets**:
  - `officePreset`: 17-desk architectural floorplan with executive suite, meeting room, and glass partitions.
  - `farmPreset`: Greenhouses, crops, barns, tractors.
  - `factoryPreset`: Conveyor belts, robotic arms, storage racks.
  - `schoolPreset`: Lecture halls, interactive smartboards, science labs.
  - `hospitalPreset`: Triage rooms, consultation suites, patient monitoring.
- **Contextual Inspector**: Slide-out drawer displaying role, status, metadata, and custom application actions.
- **Day & Night Simulation**: One-click smooth lighting transitions.
- **Pin & Label Modes**: Minimal 28px circular pins (`#1`..`#17`) with status indicators, expandable chips, or hidden mode.

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

---

## License

MIT © umituz
