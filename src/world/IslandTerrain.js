import * as THREE from 'three';

export class IslandTerrain {
  constructor(scene, assetGen) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.size = 800; // 800x800m open world island
    this.oceanMesh = null;
    this.islandMesh = null;
    this.rocksMesh = null;
    this.beachesMesh = null;

    this.init();
  }

  init() {
    this.createOcean();
    this.createIslandBase();
    this.createBeachesAndCliffs();
  }

  createOcean() {
    // Large expansive ocean plane
    const oceanGeo = new THREE.PlaneGeometry(2400, 2400, 48, 48);
    oceanGeo.rotateX(-Math.PI / 2);

    // Cute stylized anime toon water material
    const oceanMat = new THREE.MeshToonMaterial({
      color: 0x00b4d8,
      gradientMap: this.assetGen.toonGradient,
      transparent: true,
      opacity: 0.88,
      roughness: 0.2,
      depthWrite: false
    });

    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.position.y = -0.6; // Sea level
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
  }

  createIslandBase() {
    // Stylized rounded island
    const segments = 96;
    const islandGeo = new THREE.PlaneGeometry(this.size, this.size, segments, segments);
    islandGeo.rotateX(-Math.PI / 2);

    const pos = islandGeo.attributes.position;
    const half = this.size / 2;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Distance from center (squircle-like island shape)
      const nx = x / half;
      const nz = z / half;
      const dist = Math.pow(Math.abs(nx), 3.2) + Math.pow(Math.abs(nz), 3.2);

      let elevation = 0;
      if (dist < 0.85) {
        // Main island plateau with gentle rolling hills
        const hill1 = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 1.8;
        const hill2 = Math.sin(x * 0.006 + 1.2) * Math.cos(z * 0.008) * 3.5;
        elevation = 0.8 + hill1 + hill2;

        // Elevated cliff near the north-east lighthouse
        if (x > 180 && z < -180) {
          elevation += 8.5;
        }
      } else if (dist < 1.0) {
        // Coastline beach slope dipping into ocean
        const factor = (1.0 - dist) / 0.15;
        elevation = factor * 0.8;
      } else {
        // Underwater seabed drop
        elevation = -3.5;
      }

      pos.setY(i, elevation);
    }

    islandGeo.computeVertexNormals();

    const grassMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getGrassTexture(),
      gradientMap: this.assetGen.toonGradient,
      roughness: 0.8
    });

    this.islandMesh = new THREE.Mesh(islandGeo, grassMat);
    this.islandMesh.receiveShadow = true;
    this.scene.add(this.islandMesh);
  }

  createBeachesAndCliffs() {
    // Sandy beach ring surrounding the green plateau
    const beachGeo = new THREE.RingGeometry(this.size * 0.42, this.size * 0.52, 64);
    beachGeo.rotateX(-Math.PI / 2);

    const sandMat = new THREE.MeshToonMaterial({
      color: 0xfde047, // Warm golden anime sand
      gradientMap: this.assetGen.toonGradient,
      roughness: 0.9
    });

    this.beachesMesh = new THREE.Mesh(beachGeo, sandMat);
    this.beachesMesh.position.y = -0.25;
    this.beachesMesh.receiveShadow = true;
    this.scene.add(this.beachesMesh);

    // Coastal seawalls & rocky breakwaters around the marina
    const seaWallGeo = new THREE.BoxGeometry(120, 4, 8);
    const stoneMat = new THREE.MeshToonMaterial({
      color: 0x718096,
      gradientMap: this.assetGen.toonGradient
    });

    const wall1 = new THREE.Mesh(seaWallGeo, stoneMat);
    wall1.position.set(-240, 1.2, 180);
    wall1.rotation.y = Math.PI / 4;
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    this.scene.add(wall1);

    const wall2 = new THREE.Mesh(seaWallGeo, stoneMat);
    wall2.position.set(-180, 1.2, 240);
    wall2.rotation.y = -Math.PI / 4;
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    this.scene.add(wall2);
  }

  // Sample ground height at (x, z) for physics raycasting & entity alignment
  getElevation(x, z) {
    const half = this.size / 2;
    const nx = x / half;
    const nz = z / half;
    const dist = Math.pow(Math.abs(nx), 3.2) + Math.pow(Math.abs(nz), 3.2);

    if (dist >= 1.0) {
      return -0.5; // Water
    }

    if (x > 180 && z < -180) {
      return 9.2; // Lighthouse clifftop
    }

    const hill1 = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 1.8;
    const hill2 = Math.sin(x * 0.006 + 1.2) * Math.cos(z * 0.008) * 3.5;
    const base = 0.8 + hill1 + hill2;

    if (dist > 0.85) {
      const factor = (1.0 - dist) / 0.15;
      return factor * base;
    }
    return Math.max(0.6, base);
  }

  update(delta, time) {
    // Gentle bobbing ocean wave animation
    if (this.oceanMesh) {
      this.oceanMesh.position.y = -0.6 + Math.sin(time * 1.5) * 0.08;
    }
  }
}
