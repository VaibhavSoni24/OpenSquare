# 🌸 OpenSquare (オープン・スクエア)

> **An Extra-Large 3D Anime GTA-Style Open-World Web Game** built with Three.js, WebGL, and modern Web Technologies. Roam on foot, sprint, jump, or hop into cute anime vehicles and cruise through a vast 1800m living island featuring mountain passes, Shinto shrines, civic centers, dense neighborhoods, intelligent pedestrian & traffic AI, and solid physical collisions!

![OpenSquare Banner](public/logo.svg)

---

## ✨ Features

- 🏝️ **Massive 1800m × 1800m Asymmetric Island Realm**
  - **Grand Central Roundabout**: A 40m-radius multi-lane traffic circle connecting four 560m grand arterial avenues, with a landscaped fountain courtyard and palm trees.
  - **Mount Sakura Highlands (Peak y = 35m+)**: Towering mountain slopes lined with evergreen pines, a winding switchback mountain road with red/white cliffside guardrails, and the sacred **Mount Sakura Shinto Shrine (`⛩️ JINJA`)** with grand vermilion Torii gates, granite stone lanterns (`Tōrō`), and a summit observation terrace.
  - **Emerald Lake & River Channel**: An 80m-radius turquoise lake with weeping willows, arched red wooden bridge, pagoda tea house, and a 26m-wide river channel spanned by a heavy **Japanese Red Steel Arched Truss Bridge**.
  - **Downtown Financial Core**: Lofty skyscrapers with anime signage, glass skybridges, illuminated storefronts, and broad multi-lane boulevards.
  - **Civic District**:
    - 👮 **Metropolitan Police Station (`KOBAN`)**: Cobalt blue and white modern station with emergency sirens, radio antenna mast, and secure parking.
    - 🏥 **Central Hospital (`+ HOSPITAL`)**: Multi-story medical center with red emergency cross, helipad, and ambulance bays.
    - 🏦 **OpenSquare Bank (`OPEN BANK`)**: Neoclassical banking headquarters with towering gold columns and vault architecture.
  - **Shibuya Commercial Plaza**: Japanese cafes with outdoor dining patios and striped sun umbrellas (*Sakura Cafe & Tea ☕*, *Cyber Cafe*), 24H convenience stores (*OpenMart 🏪*), ramen noodle shops (*Ramen Ichiban 🍜*), and street corner beverage vending machines.
  - **Dense Sakura Residential Old Town**: 60+ cozy Japanese suburban houses and apartment complexes with pitched tile roofs, dormers, balconies, solar panels, air conditioning units, flower gardens, and picket fences.
  - **Coastal Highway Loop & Sandy Beaches**: 650m-radius coastal highway ring, palm trees, golden sand beaches, marine breakwater boulders, and sea cliffs.

- 🌊 **Realistic Water Physics & Collision System**
  - **Lake & River Water Hazard**: Walking or driving directly over deep water is physically blocked.
  - **Water Rescue System**: If a player or vehicle lands in water (e.g. leaping from a cliff), the game automatically recovers them to the nearest safe shore with an on-screen notification (`🌊 Rescued back safely to shore`).
  - **Solid 3D Road Slabs & Bridges**: Continuous 3D extruded road beds, raised concrete curbs, and pedestrian sidewalks conforming to the graded terrain (zero floating/levitating roads!).
  - **Physical Railings & Barriers**: The river bridge and mountain switchback feature solid colliders preventing vehicles and pedestrians from plunging off edges.

- 🚗 **Intelligent Multi-Lane Traffic AI**
  - Pathfinding across an interconnected multi-lane road network including roundabouts, arterials, downtown grid, suburban curves, and mountain passes.
  - Traffic rules: Vehicle deceleration behind other cars, stops at red lights, yields to pedestrians.
  - Dynamic active bubble radius for silky 60 FPS performance.
  - Multiple cute anime vehicle types: Kei Micro-Cars, Retro Beetles, Compact Hatchbacks, Delivery Vans, and Sports Coupes.

- 🚶 **Pedestrian NPC AI**
  - Cute anime avatars with varied pastel hairstyles, fashionable anime outfits, and procedural bobbing walk animations.
  - Sidewalk navigation, pedestrian crosswalk crossing logic, and park roaming.
  - Obstacle and vehicle avoidance; interactive reactions when honked at or approached.

- 🎮 **Full Third-Person Controls**
  - **On Foot**: Smooth 360° mouse-look orbit camera, WASD movement, Sprint (`Shift`), Jump (`Space`).
  - **Driving**: Enter any vehicle seamlessly (`E` or `F`), smooth arcade physics with suspension, drifting, acceleration, reverse, braking.
  - **Vehicle Features**: Honk (`H`), toggle headlights (`L`), interactive Lo-Fi / Chiptune radio (`R`), multi-angle camera toggle (`C`).

- 🎨 **Cute Anime & Cel-Shaded Aesthetics**
  - Stylized custom toon shading with warm sunlight and soft ambient lighting.
  - Dynamic procedural sky with stylized fluffy clouds and day/golden sunset/night lighting cycles (`T`).
  - Procedural animated ocean waves with toon foam edge shaders.
  - Instanced rendering for trees (sakura cherry blossoms, mountain pines, park oaks, coastal palms), flower shrubs, street lamps, and urban props for peak performance.

- 🎵 **Integrated Procedural Audio Engine**
  - Web Audio API synthesizer for engine roar, screeching tires, car horn, footsteps, ambient coastal breezes, and Lo-Fi anime radio tracks without external asset bottlenecks.

- 🗺️ **Comprehensive Anime HUD**
  - Tactical GPS Minimap radar with dynamic road rendering, water bodies, POI landmark badges (`⛩️`, `👮`, `🏥`, `🏦`, `🏪`, `☕`), and real-time vehicle/pedestrian blips.
  - Arc & digital speedometer for vehicle driving.
  - Compass heading ribbon, interactive controls overlay, and time-of-day switcher.

---

## 🕹️ Controls

| Action | Foot Controls | Driving Controls |
| :--- | :--- | :--- |
| **Move / Drive** | `W` `A` `S` `D` or Arrows | `W` (Gas), `S` (Brake/Reverse), `A`/`D` (Steer) |
| **Sprint / Handbrake**| `Shift` (Sprint) | `Space` (Handbrake / Drift) |
| **Jump** | `Space` | — |
| **Enter / Exit Car** | `E` or `F` (Near car) | `E` or `F` (When stopped/slow) |
| **Car Horn** | — | `H` or `Ctrl` |
| **Headlights** | — | `L` |
| **Radio** | — | `R` (Cycle stations) |
| **Camera View** | Mouse Orbit / Drag | `C` (Cycle near / far / hood) |
| **Controls Help** | `Tab` or `?` | `Tab` or `?` |
| **Day / Night Cycle**| `T` | `T` |

---

## 🛠️ Technology Stack & Architecture

- **Engine**: [Three.js](https://threejs.org/) (WebGL2, Toon Shading, InstancedMeshes)
- **Bundler**: [Vite](https://vitejs.dev/) (Lightning-fast HMR and tree-shaking)
- **Audio**: Web Audio API (Custom procedural chiptune/lo-fi and sound effect synth)
- **Styling**: Modern Vanilla CSS (Glassmorphism, responsive anime HUD)
- **Performance**:
  - Distance-based simulation LOD (Active bubble radius).
  - Instanced rendering for repetitive geometry (thousands of trees, props, lights in single draw calls).
  - Baked canvas procedural textures for 0-latency instant loading.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm or pnpm

### Installation
```bash
git clone https://github.com/VaibhavSoni24/OpenSquare.git
cd OpenSquare
npm install
```

### Development
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

### Production Build
```bash
npm run build
```

---

## 📜 License
MIT License. Created with ❤️ for OpenSquare.
