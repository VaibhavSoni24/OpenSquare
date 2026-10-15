import * as THREE from 'three';

export class IslandTerrain {
  constructor(scene, assetGen) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.size = 1800; // Extra-large 1800m x 1800m GTA-scale island
    this.oceanMesh = null;
    this.islandMesh = null;
    this.beachesMesh = null;
    this.lakeMesh = null;
    this.riverMesh = null;

    // Lake & River bounds for physics & water safety
    this.lakeCenter = new THREE.Vector2(-240, -180);
    this.lakeRadius = 80;

    this.init();
  }

  init() {
    this.createOcean();
    this.createIslandBase();
    this.createLakeAndRiver();
    this.createBeaches();
    this.createCoastalBoulders();
  }

  createOcean() {
    // Massive ocean plane stretching to horizon
    const oceanGeo = new THREE.PlaneGeometry(4800, 4800, 48, 48);
    oceanGeo.rotateX(-Math.PI / 2);

    const oceanMat = new THREE.MeshToonMaterial({
      color: 0x0284c7, // Vibrant deep anime cyan-blue
      gradientMap: this.assetGen.toonGradient,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.position.y = -0.4;
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
  }

  createLakeAndRiver() {
    // 1. Emerald Lake Water Surface
    const lakeGeo = new THREE.CircleGeometry(this.lakeRadius, 48);
    lakeGeo.rotateX(-Math.PI / 2);
    const lakeMat = new THREE.MeshToonMaterial({
      color: 0x06b6d4, // Crystal turquoise lake
      gradientMap: this.assetGen.toonGradient,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });
    this.lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
    this.lakeMesh.position.set(this.lakeCenter.x, 0.35, this.lakeCenter.y);
    this.scene.add(this.lakeMesh);

    // Lake Stone Promenade Bank
    const stoneRimGeo = new THREE.RingGeometry(this.lakeRadius - 1.5, this.lakeRadius + 4.5, 48);
    stoneRimGeo.rotateX(-Math.PI / 2);
    const rimMat = this.assetGen.createToonMaterial(0x64748b);
    const rim = new THREE.Mesh(stoneRimGeo, rimMat);
    rim.position.set(this.lakeCenter.x, 0.42, this.lakeCenter.y);
    rim.receiveShadow = true;
    this.scene.add(rim);

    // 2. River Channel flowing from Lake to South-West Ocean (Length: 260m, Width: 26m)
    const riverGeo = new THREE.PlaneGeometry(26, 280);
    riverGeo.rotateX(-Math.PI / 2);
    this.riverMesh = new THREE.Mesh(riverGeo, lakeMat);
    this.riverMesh.position.set(-330, 0.32, -30);
    this.riverMesh.rotation.y = 0.38; // Diagonal flow towards ocean
    this.scene.add(this.riverMesh);
  }

  createIslandBase() {
    const segments = 160;
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

  createBeaches() {
    // Golden anime sandy beach fringe
    const beachGeo = new THREE.RingGeometry(this.size * 0.38, this.size * 0.48, 96);
    beachGeo.rotateX(-Math.PI / 2);

    const sandMat = new THREE.MeshToonMaterial({
      color: 0xfef08a,
      gradientMap: this.assetGen.toonGradient
    });

    this.beachesMesh = new THREE.Mesh(beachGeo, sandMat);
    this.beachesMesh.position.y = -0.12;
    this.beachesMesh.receiveShadow = true;
    this.scene.add(this.beachesMesh);
  }

  createCoastalBoulders() {
    // Rocky sea stacks and breakwater cliffs around the island edges
    const rockMat = this.assetGen.createToonMaterial(0x475569);
    const count = 40;

    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const r = 680 + Math.random() * 80;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;

      const rockGeo = new THREE.DodecahedronGeometry(8 + Math.random() * 12, 1);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(x, 1.0 + Math.random() * 6, z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rock.scale.set(1.2, 0.8, 1.2);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }
  }

  // -------------------------------------------------------------
  // Asymmetric Topography & Ground Elevation (1800m Realm)
  // -------------------------------------------------------------
  getElevation(x, z) {
    const half = this.size / 2;
    const nx = x / half;
    const nz = z / half;
    // Asymmetric squircle coast boundary
    const dist = Math.pow(Math.abs(nx), 2.8) + Math.pow(Math.abs(nz), 2.8);

    if (dist >= 1.0) {
      return -5.0; // Deep sea
    }

    // 1. Mount Sakura Highlands (Peak at x: 280, z: -460, radius ~240m)
    const mtnDist = Math.hypot(x - 280, z + 460);
    if (mtnDist < 250) {
      const factor = Math.cos((mtnDist / 250) * (Math.PI / 2));
      // Organic ridges & terraces for mountain shrine
      const terrace = Math.sin(mtnDist * 0.08) * 1.5;
      return 1.0 + Math.pow(factor, 1.8) * 36.0 + terrace; // Up to 37 meters high!
    }

    // 2. Coastal Promontory Lighthouse Cliff (North-West, x: -440, z: -440)
    const cliffDist = Math.hypot(x + 440, z + 440);
    if (cliffDist < 160) {
      const factor = Math.cos((cliffDist / 160) * (Math.PI / 2));
      return 1.0 + factor * 16.5; // Sea cliff up to 17.5m
    }

    // 3. Emerald Lake Basin (Centered at x: -240, z: -180, radius 80m)
    const lkDist = Math.hypot(x - this.lakeCenter.x, z - this.lakeCenter.y);
    if (lkDist < this.lakeRadius) {
      const lakeDepth = Math.cos((lkDist / this.lakeRadius) * (Math.PI / 2)) * 1.6;
      return 0.95 - lakeDepth; // Dips below water level (0.35m)
    }

    // 4. River Channel (Width: ~26m from lake out to south-west ocean)
    const rdx = x - -330;
    const rdz = z - -30;
    // Rotate into river local coords
    const localRx = rdx * Math.cos(-0.38) - rdz * Math.sin(-0.38);
    const localRz = rdx * Math.sin(-0.38) + rdz * Math.cos(-0.38);
    if (Math.abs(localRx) < 14 && Math.abs(localRz) < 145) {
      const factor = Math.cos((Math.abs(localRx) / 14) * (Math.PI / 2));
      return 0.95 - factor * 1.5; // Dips below river water
    }

    // 5. Sakura Old Town Rolling Suburb Hills (x: 80~460, z: 80~460)
    if (x > 60 && z > 60 && x < 500 && z < 500) {
      const hillWave = Math.sin(x * 0.012) * Math.cos(z * 0.012) * 1.6;
      return 1.0 + Math.max(0, hillWave);
    }

    // 6. Central Metropolis Plateau & Downtown Roads are graded flat at y = 1.0m
    const rCenter = Math.hypot(x, z);
    if (rCenter < 520) {
      return 1.0;
    }

    // 7. Coastal slope dipping into beaches
    if (dist < 0.82) {
      return 1.0;
    } else {
      const factor = (1.0 - dist) / 0.18;
      return Math.max(-0.6, factor * 1.0);
    }
  }

  // Check if position is inside dangerous deep water (Lake, River, Ocean)
  isWater(x, z) {
    // 1. Ocean edge check
    const half = this.size / 2;
    const dist = Math.pow(Math.abs(x / half), 2.8) + Math.pow(Math.abs(z / half), 2.8);
    if (dist > 0.88) return true;

    // 2. Emerald Lake (Exclude wooden bridge corridor!)
    const lkDist = Math.hypot(x - this.lakeCenter.x, z - this.lakeCenter.y);
    if (lkDist < this.lakeRadius - 1.5) {
      // Allow wooden bridge corridor passing over lake shore/edge (x near -240, z near -180)
      if (Math.abs(x - -240) < 5.0 && Math.abs(z - -180) < 22) return false;
      return true;
    }

    // 3. River Channel (Exclude heavy steel truss river bridge!)
    const rdx = x - -330;
    const rdz = z - -30;
    const localRx = rdx * Math.cos(-0.38) - rdz * Math.sin(-0.38);
    const localRz = rdx * Math.sin(-0.38) + rdz * Math.cos(-0.38);
    if (Math.abs(localRx) < 14 && Math.abs(localRz) < 145) {
      // River Bridge deck at localRz ~ -4 (near z = -35, x = -330)
      if (Math.abs(localRz - -4) < 16) return false;
      return true;
    }

    return false;
  }

  // Get nearest safe land point if player or vehicle falls into water
  getNearestShore(x, z) {
    // 1. Lake rescue
    const lkDist = Math.hypot(x - this.lakeCenter.x, z - this.lakeCenter.y);
    if (lkDist < this.lakeRadius + 15) {
      const dirX = (x - this.lakeCenter.x) / (lkDist || 1);
      const dirZ = (z - this.lakeCenter.y) / (lkDist || 1);
      return new THREE.Vector3(
        this.lakeCenter.x + dirX * (this.lakeRadius + 6),
        1.1,
        this.lakeCenter.y + dirZ * (this.lakeRadius + 6)
      );
    }

    // 2. River rescue
    const rdx = x - -330;
    const rdz = z - -30;
    const localRx = rdx * Math.cos(-0.38) - rdz * Math.sin(-0.38);
    const localRz = rdx * Math.sin(-0.38) + rdz * Math.cos(-0.38);
    if (Math.abs(localRz) < 150) {
      const pushSign = localRx >= 0 ? 1 : -1;
      const targetLocalRx = pushSign * 18.0;
      // Convert back to world coords
      const worldX = -330 + targetLocalRx * Math.cos(0.38) - localRz * Math.sin(0.38);
      const worldZ = -30 + targetLocalRx * Math.sin(0.38) + localRz * Math.cos(0.38);
      return new THREE.Vector3(worldX, 1.1, worldZ);
    }

    // 3. Ocean rescue (pull back towards beach perimeter)
    const angle = Math.atan2(z, x);
    const safeRadius = 660;
    return new THREE.Vector3(
      Math.cos(angle) * safeRadius,
      1.1,
      Math.sin(angle) * safeRadius
    );
  }

  update(delta, time) {
    if (this.oceanMesh) {
      this.oceanMesh.position.y = -0.4 + Math.sin(time * 1.5) * 0.08;
    }
    if (this.lakeMesh) {
      this.lakeMesh.position.y = 0.35 + Math.sin(time * 2.0) * 0.03;
    }
  }
}
