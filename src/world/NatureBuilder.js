import * as THREE from 'three';

export class NatureBuilder {
  constructor(scene, assetGen, terrain) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.terrain = terrain;

    this.instancedSakuras = null;
    this.instancedOaks = null;
    this.instancedPalms = null;
    this.instancedBushes = null;

    this.init();
  }

  init() {
    this.spawnSakuraTrees();
    this.spawnOakTrees();
    this.spawnPalmTrees();
    this.spawnBushes();
  }

  // 1. Instanced Sakura Cherry Blossom Trees
  spawnSakuraTrees() {
    const count = 120;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 4.2, 7);
    trunkGeo.translate(0, 2.1, 0);

    const foliageGeo = new THREE.DodecahedronGeometry(2.8, 1);
    foliageGeo.translate(0, 5.2, 0);

    // Merge trunk and foliage or render compound instancing
    const sakuraMat = this.assetGen.createToonMaterial(0xffa8ba); // Soft sakura pink
    const trunkMat = this.assetGen.createToonMaterial(0x5c3d2e);

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, sakuraMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedFoliage.castShadow = true;
    instancedTrunk.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    // Sakura clusters: Residential area (X: 40~180, Z: 40~180), Museum (X: 120~200, Z: -180~-100)
    for (let i = 0; i < count; i++) {
      let x, z;
      if (i < 80) {
        // Residential Sakura street trees
        x = 45 + Math.random() * 140;
        z = 45 + Math.random() * 140;
      } else {
        // Museum plaza avenues
        x = 110 + Math.random() * 80;
        z = -180 + Math.random() * 70;
      }

      // Avoid road grid
      if (Math.abs(x % 90) < 10 || Math.abs(z % 90) < 10) {
        x += 12;
      }

      const y = this.terrain.getElevation(x, z);
      const scale = 0.8 + Math.random() * 0.45;

      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      instancedFoliage.setMatrixAt(idx, dummy.matrix);
      instancedTrunk.setMatrixAt(idx, dummy.matrix);
      idx++;
    }

    instancedFoliage.instanceMatrix.needsUpdate = true;
    instancedTrunk.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedFoliage, instancedTrunk);
    this.instancedSakuras = { foliage: instancedFoliage, trunk: instancedTrunk };
  }

  // 2. Instanced Verdant Oak Trees (Central Park & Highlands)
  spawnOakTrees() {
    const count = 100;
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 5, 8);
    trunkGeo.translate(0, 2.5, 0);

    const foliageGeo = new THREE.IcosahedronGeometry(3.2, 1);
    foliageGeo.translate(0, 6.2, 0);

    const oakMat = this.assetGen.createToonMaterial(0x4ade80); // Vibrant leafy green
    const trunkMat = this.assetGen.createToonMaterial(0x6b4f3b);

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, oakMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedFoliage.castShadow = true;
    instancedTrunk.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let i = 0; i < count; i++) {
      // Clustered around Central Park (X: -200~-80, Z: -200~-80)
      const x = -200 + Math.random() * 120;
      const z = -200 + Math.random() * 120;

      const y = this.terrain.getElevation(x, z);
      const scale = 0.85 + Math.random() * 0.4;

      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      instancedFoliage.setMatrixAt(idx, dummy.matrix);
      instancedTrunk.setMatrixAt(idx, dummy.matrix);
      idx++;
    }

    instancedFoliage.instanceMatrix.needsUpdate = true;
    instancedTrunk.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedFoliage, instancedTrunk);
    this.instancedOaks = { foliage: instancedFoliage, trunk: instancedTrunk };
  }

  // 3. Coastal Palm Trees (Along Highway & Coastline)
  spawnPalmTrees() {
    const count = 64;
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 7, 6);
    trunkGeo.translate(0, 3.5, 0);

    const leafGeo = new THREE.ConeGeometry(2.8, 1.4, 6);
    leafGeo.translate(0, 7.2, 0);

    const palmMat = this.assetGen.createToonMaterial(0x22c55e);
    const trunkMat = this.assetGen.createToonMaterial(0xa16207);

    const instancedLeaf = new THREE.InstancedMesh(leafGeo, palmMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedLeaf.castShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 246; // Along coastal highway
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = this.terrain.getElevation(x, z);

      dummy.position.set(x, y, z);
      dummy.rotation.y = angle;
      dummy.rotation.z = (Math.random() - 0.5) * 0.15; // Natural lean
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      instancedLeaf.setMatrixAt(i, dummy.matrix);
      instancedTrunk.setMatrixAt(i, dummy.matrix);
    }

    instancedLeaf.instanceMatrix.needsUpdate = true;
    instancedTrunk.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedLeaf, instancedTrunk);
    this.instancedPalms = { leaf: instancedLeaf, trunk: instancedTrunk };
  }

  // 4. Instanced Bushes along Sidewalks
  spawnBushes() {
    const count = 150;
    const bushGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const bushMat = this.assetGen.createToonMaterial(0x16a34a);

    const instancedBushes = new THREE.InstancedMesh(bushGeo, bushMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 200;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = this.terrain.getElevation(x, z) + 0.4;

      dummy.position.set(x, y, z);
      dummy.scale.set(0.7 + Math.random() * 0.6, 0.5 + Math.random() * 0.4, 0.7 + Math.random() * 0.6);
      dummy.updateMatrix();

      instancedBushes.setMatrixAt(i, dummy.matrix);
    }

    instancedBushes.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedBushes);
    this.instancedBushes = instancedBushes;
  }
}
