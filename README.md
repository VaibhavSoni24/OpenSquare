# 🌸 OpenSquare (オープン・スクエア)

> **A Vibrant 3D Anime Open-World Web Game** built with Three.js, WebGL, and modern Web Technologies. Roam on foot, sprint, jump, or hop into cute anime vehicles and cruise through a living island city featuring intelligent pedestrian & traffic AI!

![OpenSquare Banner](public/logo.svg)

---

## ✨ Features

- 🏝️ **Expansive 1100m GTA-Style Open World Island**
  - **Grand Central Roundabout**: A wide multi-lane traffic circle at the heart of the island with a landscaped fountain courtyard and palm trees.
  - **Downtown Skyline**: Lofty anime skyscrapers with neon signage, glass skybridges, and broad arterial boulevards.
  - **Shibuya Commercial Plaza**: Japanese cafes with outdoor dining patios and striped sun umbrellas (*Sakura Cafe & Tea ☕*), 24H convenience stores (*OpenMart 🏪*), ramen noodle shops (*Ramen Ichiban 🍜*), and street corner beverage vending machines.
  - **Dense Sakura Residential District**: 40+ cozy Japanese suburban homes with pitched tile roofs, dormers, balconies, solar panels, AC units, gardens, and picket fences.
  - **Cultural Museum Plaza**: Neoclassical domed museum with Roman pillars, stepped terrace, outdoor sculptures, and tiered water fountains.
  - **Verdant Central Park**: Lush rolling lawns, weeping willows, a scenic lake with stone banks, an arched Japanese wooden bridge, and a pagoda gazebo.
  - **Coastal Promenade & Clifftop Lighthouse**: 370m radius coastal highway loop, palm-lined beach promenade, marine breakwaters, and a clifftop maritime lighthouse.
  
- 🛣️ **Grounded Solid 3D Road Network**
  - Continuous 3D solid asphalt beds, beveled concrete curbs, and textured pedestrian sidewalk slabs conforming seamlessly to the terrain (zero floating/levitating roads!).
  - Multi-lane avenues, sweeping curved highways, crosswalks with tactile paving strips, and painted directional lane arrows.
  - Intelligent vehicle pathfinding across an interconnected multi-lane road network.
  - Traffic rules: Vehicle deceleration behind other cars, stops at red lights, yields to pedestrians.
  - Dynamic spawning bubble with spatial awareness for 60 FPS buttery-smooth performance.
  - Multiple cute anime vehicle types: Kei Micro-Cars, Retro Beetles, Compact Hatchbacks, Delivery Vans, and Sports Coupes.

- 🚶 **Pedestrian NPC AI**
  - Cute anime avatars with varied pastel hairstyles, fashionable anime outfits, and procedural bobbing walk animations.
  - Sidewalk navigation, pedestrian crosswalk crossing logic, and park roaming.
  - Obstacle and vehicle avoidance; interactive reactions when honked at or approached.

- 🎮 **Full Third-Person Controls**
  - **On Foot**: Smooth 360° mouse-look orbit camera, WASD movement, Sprint (Shift), Jump (Space).
  - **Driving**: Enter any vehicle seamlessly (`E` or `F`), smooth arcade physics with suspension, drifting, acceleration, reverse, braking.
  - **Vehicle Features**: Honk (`H`), toggle headlights (`L`), interactive Lo-Fi / Chiptune radio (`R`), multi-angle camera toggle (`C`).

- 🎨 **Cute Anime & Cel-Shaded Aesthetics**
  - Stylized custom toon shading with warm sunlight and soft ambient lighting.
  - Dynamic procedural sky with stylized fluffy clouds and day/golden hour/night lighting cycles.
  - Procedural animated ocean waves with toon foam edge shaders.
  - Instanced rendering for trees, foliage, street lamps, and urban props for peak performance.

- 🎵 **Integrated Procedural Audio Engine**
  - Web Audio API synthesizer for engine roar, screeching tires, car horn, footsteps, ambient coastal breezes, and Lo-Fi anime radio tracks without external asset bottlenecks.

- 🗺️ **Comprehensive Anime HUD**
  - GPS Minimap radar with dynamic road rendering and real-time vehicle/player blips.
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
Open your browser at `http://localhost:5173` to explore OpenSquare!

### Production Build
```bash
npm run build
npm run preview
```

---

## 📄 License
MIT License. Open source and built with ❤️ for anime open-world lovers.
