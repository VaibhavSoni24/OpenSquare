import * as THREE from 'three';

export class IslandTerrain {
  constructor(scene, assetGen) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.size = 1100; // Grand 1100x1100m open world map
    this.oceanMesh = null;
    this.islandMesh = null;
    this.beachesMesh = null;

    this.init();
  }

  init() {
    this.createOcean();
    this.createIslandBase();
    this.createBeaches();
    this.createSeawalls();
  }

  createOcean() {
    // Expansive ocean surrounding the island
    const oceanGeo = new THREE.PlaneGeometry(3200, 3200, 64, 64);
    oceanGeo.rotateX(-Math.PI / 2);

    const oceanMat = new THREE.MeshToonMaterial({
      color: 0x0ea5e9,
      gradientMap: this.assetGen.toonGradient,
      transparent: true,
      opacity: 0.88,
      depthWrite: false
    });

    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.position.y = -0.5; // Sea level
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
  }

  createIslandBase() {
    const segments = 128;
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
    // Golden sand ring outlining the island perimeter
    const beachGeo = new THREE.RingGeometry(this.size * 0.40, this.size * 0.49, 96);
    beachGeo.rotateX(-Math.PI / 2);

    const sandMat = new THREE.MeshToonMaterial({
      color: 0xfef08a, // Bright warm anime sand
      gradientMap: this.assetGen.toonGradient
    });

    this.beachesMesh = new THREE.Mesh(beachGeo, sandMat);
    this.beachesMesh.position.y = -0.15;
    this.beachesMesh.receiveShadow = true;
    this.scene.add(this.beachesMesh);
  }

  createSeawalls() {
    // Marine breakwaters & stone promenades
    const stoneMat = this.assetGen.createToonMaterial(0x64748b);
    const wallGeo = new THREE.BoxGeometry(160, 4.5, 9);

    const wall1 = new THREE.Mesh(wallGeo, stoneMat);
    wall1.position.set(-360, 1.2, 260);
    wall1.rotation.y = Math.PI / 3.8;
    wall1.castShadow = true;
    wall1.receiveShadow = true;

    const wall2 = new THREE.Mesh(wallGeo, stoneMat);
    wall2.position.set(-260, 1.2, 360);
    wall2.rotation.y = -Math.PI / 4.2;
    wall2.castShadow = true;
    wall2.receiveShadow = true;

    this.scene.add(wall1, wall2);
  }

  // Consistent elevation model: flat graded plains for city & roads, rolling hills elsewhere
  getElevation(x, z) {
    const half = this.size / 2;
    const nx = x / half;
    const nz = z / half;
    // Squircle island boundary
    const dist = Math.pow(Math.abs(nx), 3.0) + Math.pow(Math.abs(nz), 3.0);

    if (dist >= 1.0) {
      return -4.0; // Deep ocean
    }

    // Coastal cliff / lighthouse mountain in North-East (x: 240~420, z: -420~-240)
    const cliffDist = Math.hypot(x - 330, z + 330);
    if (cliffDist < 160) {
      const cliffFactor = Math.cos((cliffDist / 160) * (Math.PI / 2));
      return 1.0 + cliffFactor * 18.0; // Dramatic ocean cliff up to 19m
    }

    // Central Park Lake basin (x: -160~-260, z: -160~-260)
    const lakeDist = Math.hypot(x - -210, z - -210);
    if (lakeDist < 65) {
      const lakeDepth = Math.cos((lakeDist / 65) * (Math.PI / 2)) * 1.5;
      return 1.0 - lakeDepth; // Dips into pond
    }

    // Main city & residential area (radius < 380m) is graded flat at y = 1.0
    // so all roads, buildings, intersections, and crosswalks sit flush on ground!
    const r = Math.hypot(x, z);
    if (r < 390) {
      return 1.0;
    }

    // Coastal slope down to beach & ocean
    if (dist < 0.82) {
      return 1.0;
    } else {
      const factor = (1.0 - dist) / 0.18;
      return Math.max(-0.6, factor * 1.0);
    }
  }

  update(delta, time) {
    if (this.oceanMesh) {
      this.oceanMesh.position.y = -0.5 + Math.sin(time * 1.6) * 0.08;
    }
  }
}
