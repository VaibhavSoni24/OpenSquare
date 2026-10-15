import * as THREE from 'three';

export class IslandTerrain {
  constructor(scene, assetGen) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.size = 3400; // Extra-large 3400m x 3400m GTA-scale archipelago realm (4x area)
    this.oceanMesh = null;
    this.islandMesh = null;
    this.beachesMesh = null;
    this.lakeMesh = null;
    this.riverMesh = null;
    this.lakeRimMesh = null;

    // Emerald Lake & River Coordinates
    this.lakeCenter = new THREE.Vector2(-360, 40);
    this.lakeRadius = 115;
    this.lakeWaterLevel = 0.85;

    this.init();
  }

  init() {
    this.createOcean();
    this.createIslandBase();
    this.createLakeAndRiver();
    this.createBeaches();
    this.createCoastalBoulders();
  }

  // 1. Endless Oceanic Sea Plane stretching far beyond horizon
  createOcean() {
    const oceanGeo = new THREE.PlaneGeometry(8000, 8000, 64, 64);
    oceanGeo.rotateX(-Math.PI / 2);

    const oceanMat = new THREE.MeshToonMaterial({
      color: 0x0284c7, // Vibrant deep anime cyan-blue
      gradientMap: this.assetGen.toonGradient,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });

    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.position.y = -0.4;
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
  }

  // 2. Organic Island Coastline Radius Function
  // Returns the island boundary distance from center (0,0) at a given polar angle
  getIslandRadius(ang) {
    // Base radius: ~1280m
    let r = 1280;

    // A. Mount Sakura Protrusion (East/North-East, ang ~ -0.6 to 0.4)
    const mtnAng = THREE.MathUtils.euclideanModulo(ang + 0.3, Math.PI * 2);
    if (mtnAng < 1.1) {
      r += 280 * Math.cos((mtnAng - 0.55) * (Math.PI / 1.1));
    }

    // B. Lighthouse Cape Protrusion (North-West, ang ~ -2.45 to -1.8)
    const capeAng = THREE.MathUtils.euclideanModulo(ang + 2.15, Math.PI * 2);
    if (capeAng < 0.95) {
      r += 360 * Math.cos((capeAng - 0.475) * (Math.PI / 0.95));
    }

    // C. Emerald Bay Inward Coastal Fjord (West/South-West, ang ~ 2.4 to 3.0)
    const bayAng = THREE.MathUtils.euclideanModulo(ang - 2.65, Math.PI * 2);
    if (bayAng < 0.85) {
      r -= 260 * Math.cos((bayAng - 0.425) * (Math.PI / 0.85));
    }

    // D. Southern Sakura Peninsula (South, ang ~ 1.2 to 1.9)
    const southAng = THREE.MathUtils.euclideanModulo(ang - 1.55, Math.PI * 2);
    if (southAng < 0.85) {
      r += 220 * Math.cos((southAng - 0.425) * (Math.PI / 0.85));
    }

    // E. Natural fractal coastal harmonics (Bays, coves, sea inlets)
    r += Math.sin(ang * 5.0) * 75.0 + Math.cos(ang * 8.0) * 45.0 + Math.sin(ang * 13.0) * 22.0;

    return r;
  }

  // 3. Ground Elevation Topography Function across the entire 3400m Realm
  getElevation(x, z) {
    const r = Math.hypot(x, z);
    const ang = Math.atan2(z, x);
    const islandR = this.getIslandRadius(ang);

    // Sea floor beyond coastal shelf
    if (r > islandR + 80) {
      return -8.0;
    }
    // Coastal beach slope dipping into ocean
    if (r > islandR - 40) {
      const t = (r - (islandR - 40)) / 120.0;
      return THREE.MathUtils.lerp(1.2, -8.0, Math.min(1.0, Math.pow(t, 1.4)));
    }

    // -----------------------------------------------------------------
    // Feature 1: Mount Sakura Highlands (East/North-East: x: 650, z: -550)
    // -----------------------------------------------------------------
    const mtnDist = Math.hypot(x - 650, z - -550);
    if (mtnDist < 420) {
      const factor = Math.cos((mtnDist / 420) * (Math.PI / 2));
      const summit = Math.pow(factor, 1.8) * 48.0; // Summit up to 50m!
      const terrace = Math.sin(mtnDist * 0.05) * 1.8;
      return 1.8 + summit + terrace;
    }

    // -----------------------------------------------------------------
    // Feature 2: Lighthouse Cape & Ocean Bluffs (North-West: x: -950, z: -750)
    // -----------------------------------------------------------------
    const capeDist = Math.hypot(x - -950, z - -750);
    if (capeDist < 320) {
      const factor = Math.cos((capeDist / 320) * (Math.PI / 2));
      return 1.8 + factor * 24.5; // Dramatic 26m ocean bluffs!
    }

    // -----------------------------------------------------------------
    // Feature 3: Emerald Lake Basin (West: x: -360, z: 40, radius: 115m)
    // -----------------------------------------------------------------
    const lkDist = Math.hypot(x - this.lakeCenter.x, z - this.lakeCenter.y);
    if (lkDist < this.lakeRadius) {
      // Basin dips smoothly below water surface (0.85m) down to -2.2m
      const basinDepth = Math.cos((lkDist / this.lakeRadius) * (Math.PI / 2)) * 3.1;
      return 0.85 - basinDepth;
    }

    // -----------------------------------------------------------------
    // Feature 4: River Channel (Flowing from Lake to Emerald Bay)
    // Runs from (-360, 40) towards (-950, 450)
    // -----------------------------------------------------------------
    const riverStart = new THREE.Vector2(-360, 40);
    const riverEnd = new THREE.Vector2(-950, 450);
    const riverDir = new THREE.Vector2().subVectors(riverEnd, riverStart);
    const riverLen = riverDir.length();
    riverDir.normalize();

    const pt = new THREE.Vector2(x - riverStart.x, z - riverStart.y);
    const proj = pt.dot(riverDir);
    if (proj > 70 && proj < riverLen + 60) {
      const perpDist = Math.abs(pt.x * riverDir.y - pt.y * riverDir.x);
      const riverHalfWidth = 24.0;
      if (perpDist < riverHalfWidth) {
        const factor = Math.cos((perpDist / riverHalfWidth) * (Math.PI / 2));
        return 0.85 - factor * 2.4; // Channel carved below water
      }
    }

    // -----------------------------------------------------------------
    // Feature 5: Sakura Town Residential Rolling Suburb Hills (South/South-East)
    // -----------------------------------------------------------------
    if (x > -180 && z > 180 && x < 800 && z < 900) {
      const hillWave = (Math.sin(x * 0.008) * Math.cos(z * 0.008) + Math.sin(x * 0.018 + z * 0.012) * 0.5) * 2.8;
      return 1.8 + Math.max(0, hillWave);
    }

    // -----------------------------------------------------------------
    // Feature 6: Metropolitan Downtown & Civic Core (Center: x: -200~250, z: -250~200)
    // Smoothly graded flat plateau at y = 1.8m
    // -----------------------------------------------------------------
    if (x > -240 && x < 280 && z > -280 && z < 220) {
      return 1.8;
    }

    // Default natural rolling terrain
    const baseWave = (Math.sin(x * 0.005) + Math.cos(z * 0.005)) * 1.2;
    return 1.8 + Math.max(0, baseWave);
  }

  // 4. Create Main Island 3D Base Mesh
  createIslandBase() {
    const segments = 220; // High resolution grid for smooth terrain
    const islandGeo = new THREE.PlaneGeometry(this.size, this.size, segments, segments);
    islandGeo.rotateX(-Math.PI / 2);

    const pos = islandGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const elevation = this.getElevation(x, z);
      pos.setY(i, elevation);
    }

    islandGeo.computeVertexNormals();

    const grassMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getGrassTexture(),
      gradientMap: this.assetGen.toonGradient
    });

    this.islandMesh = new THREE.Mesh(islandGeo, grassMat);
    this.islandMesh.receiveShadow = true;
    this.scene.add(this.islandMesh);
  }

  // 5. Create Emerald Lake Water Surface & Grand River
  createLakeAndRiver() {
    // A. Emerald Lake Water Surface
    const lakeGeo = new THREE.CircleGeometry(this.lakeRadius, 64);
    lakeGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshToonMaterial({
      color: 0x06b6d4, // Crystal clear anime turquoise
      gradientMap: this.assetGen.toonGradient,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });

    this.lakeMesh = new THREE.Mesh(lakeGeo, waterMat);
    this.lakeMesh.position.set(this.lakeCenter.x, this.lakeWaterLevel, this.lakeCenter.y);
    this.scene.add(this.lakeMesh);

    // Lake Stone Promenade Bank Rim
    const stoneRimGeo = new THREE.RingGeometry(this.lakeRadius - 1.5, this.lakeRadius + 6.0, 64);
    stoneRimGeo.rotateX(-Math.PI / 2);
    const rimMat = this.assetGen.createToonMaterial(0x64748b);
    const rim = new THREE.Mesh(stoneRimGeo, rimMat);
    rim.position.set(this.lakeCenter.x, this.lakeWaterLevel + 0.08, this.lakeCenter.y);
    rim.receiveShadow = true;
    this.scene.add(rim);

    // B. River Channel Water Mesh
    // Runs from (-360, 40) towards (-950, 450)
    const riverStart = new THREE.Vector2(-360, 40);
    const riverEnd = new THREE.Vector2(-950, 450);
    const diff = new THREE.Vector2().subVectors(riverEnd, riverStart);
    const len = diff.length();
    const angle = Math.atan2(diff.y, diff.x);
    const mid = new THREE.Vector2().addVectors(riverStart, riverEnd).multiplyScalar(0.5);

    const riverGeo = new THREE.PlaneGeometry(len, 44);
    riverGeo.rotateX(-Math.PI / 2);
    this.riverMesh = new THREE.Mesh(riverGeo, waterMat);
    this.riverMesh.position.set(mid.x, this.lakeWaterLevel - 0.05, mid.y);
    this.riverMesh.rotation.y = -angle;
    this.scene.add(this.riverMesh);
  }

  // 6. Golden Anime Sandy Beaches along perimeter
  createBeaches() {
    const count = 72;
    const beachGroup = new THREE.Group();
    const sandMat = new THREE.MeshToonMaterial({
      color: 0xfef08a, // Soft warm anime sand
      gradientMap: this.assetGen.toonGradient
    });

    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const r = this.getIslandRadius(ang) - 15;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;

      const patchGeo = new THREE.CylinderGeometry(40, 55, 0.4, 8);
      const patch = new THREE.Mesh(patchGeo, sandMat);
      patch.position.set(x, 0.15, z);
      patch.rotation.y = ang;
      patch.scale.set(1.4, 1.0, 0.8);
      patch.receiveShadow = true;
      beachGroup.add(patch);
    }

    this.scene.add(beachGroup);
  }

  // 7. Coastal Breakwaters and Sea Cliffs
  createCoastalBoulders() {
    const rockMat = this.assetGen.createToonMaterial(0x475569);
    const count = 50;

    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const r = this.getIslandRadius(ang) + (Math.sin(i * 3) * 30);
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;

      const rockGeo = new THREE.DodecahedronGeometry(10 + Math.random() * 16, 1);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(x, 1.0 + Math.random() * 8, z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rock.scale.set(1.4, 0.9, 1.4);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }
  }

  // 8. Strict Water Hazard Detection
  // Returns true if (x, z) is in ocean, lake, or river, EXCLUDING the Grand Lake Bridge corridor!
  isWater(x, z) {
    const r = Math.hypot(x, z);
    const ang = Math.atan2(z, x);
    const islandR = this.getIslandRadius(ang);

    // Ocean boundary
    if (r > islandR - 8.0) return true;

    // Check Grand Lake Bridge Corridor (Bridge spans along z = 40 from x = -480 to x = -240)
    // Width is 24m (|z - 40| < 12.0)
    if (x >= -480 && x <= -240 && Math.abs(z - 40) < 12.5) {
      return false; // Safe solid bridge deck!
    }

    // Emerald Lake
    const lkDist = Math.hypot(x - this.lakeCenter.x, z - this.lakeCenter.y);
    if (lkDist < this.lakeRadius - 2.0) {
      return true;
    }

    // River Channel
    const riverStart = new THREE.Vector2(-360, 40);
    const riverEnd = new THREE.Vector2(-950, 450);
    const riverDir = new THREE.Vector2().subVectors(riverEnd, riverStart);
    const riverLen = riverDir.length();
    riverDir.normalize();

    const pt = new THREE.Vector2(x - riverStart.x, z - riverStart.y);
    const proj = pt.dot(riverDir);
    if (proj > 70 && proj < riverLen + 40) {
      const perpDist = Math.abs(pt.x * riverDir.y - pt.y * riverDir.x);
      if (perpDist < 20.0) {
        return true;
      }
    }

    return false;
  }

  // 9. Nearest Safe Shore Rescue Location
  getNearestShore(x, z) {
    // A. Emerald Lake Rescue
    const lkDist = Math.hypot(x - this.lakeCenter.x, z - this.lakeCenter.y);
    if (lkDist < this.lakeRadius + 20) {
      const dirX = (x - this.lakeCenter.x) / (lkDist || 1);
      const dirZ = (z - this.lakeCenter.y) / (lkDist || 1);
      return new THREE.Vector3(
        this.lakeCenter.x + dirX * (this.lakeRadius + 8),
        1.8,
        this.lakeCenter.y + dirZ * (this.lakeRadius + 8)
      );
    }

    // B. River Channel Rescue
    const riverStart = new THREE.Vector2(-360, 40);
    const riverEnd = new THREE.Vector2(-950, 450);
    const riverDir = new THREE.Vector2().subVectors(riverEnd, riverStart).normalize();
    const pt = new THREE.Vector2(x - riverStart.x, z - riverStart.y);
    const proj = pt.dot(riverDir);
    if (proj > 0 && proj < 700) {
      const norm = new THREE.Vector2(-riverDir.y, riverDir.x);
      const dot = pt.dot(norm);
      const sign = dot >= 0 ? 1 : -1;
      const safePt = riverStart.clone().add(riverDir.clone().multiplyScalar(proj)).add(norm.clone().multiplyScalar(sign * 28));
      return new THREE.Vector3(safePt.x, 1.8, safePt.y);
    }

    // C. Ocean Rescue (Pull back onto safe beach rim)
    const ang = Math.atan2(z, x);
    const safeR = this.getIslandRadius(ang) - 45;
    return new THREE.Vector3(
      Math.cos(ang) * safeR,
      1.8,
      Math.sin(ang) * safeR
    );
  }

  update(delta, time) {
    if (this.oceanMesh) {
      this.oceanMesh.position.y = -0.4 + Math.sin(time * 1.5) * 0.08;
    }
    if (this.lakeMesh) {
      this.lakeMesh.position.y = this.lakeWaterLevel + Math.sin(time * 2.0) * 0.03;
    }
  }
}
