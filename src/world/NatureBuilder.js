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

  // 1. Instanced Blooming Sakura Cherry Blossom Trees
  spawnSakuraTrees() {
    const count = 180;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 4.4, 7);
    trunkGeo.translate(0, 2.2, 0);

    const foliageGeo = new THREE.DodecahedronGeometry(3.0, 1);
    foliageGeo.translate(0, 5.4, 0);

    const sakuraMat = this.assetGen.createToonMaterial(0xffa8ba); // Soft pastel sakura pink
    const trunkMat = this.assetGen.createToonMaterial(0x5c3d2e);

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, sakuraMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedFoliage.castShadow = true;
    instancedTrunk.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let i = 0; i < count; i++) {
      let x, z;
      if (i < 130) {
        // Dense Sakura Residential streets & yards (x: 40~260, z: 40~260)
        x = 45 + Math.random() * 210;
        z = 45 + Math.random() * 210;
      } else {
        // Museum Grand Esplanade & Gardens (x: 160~280, z: -240~-140)
        x = 160 + Math.random() * 120;
        z = -240 + Math.random() * 100;
      }

      const y = this.terrain.getElevation(x, z);
      const scale = 0.85 + Math.random() * 0.45;

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

  // 2. Instanced Verdant Oak Trees (Central Park & Boulevard Medians)
  spawnOakTrees() {
    const count = 150;
    const trunkGeo = new THREE.CylinderGeometry(0.42, 0.65, 5.2, 8);
    trunkGeo.translate(0, 2.6, 0);

    const foliageGeo = new THREE.IcosahedronGeometry(3.5, 1);
    foliageGeo.translate(0, 6.4, 0);

    const oakMat = this.assetGen.createToonMaterial(0x4ade80);
    const trunkMat = this.assetGen.createToonMaterial(0x6b4f3b);

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, oakMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedFoliage.castShadow = true;
    instancedTrunk.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let i = 0; i < count; i++) {
      // Clustered around Central Park (x: -300~-90, z: -300~-90)
      const x = -290 + Math.random() * 190;
      const z = -290 + Math.random() * 190;

      const y = this.terrain.getElevation(x, z);
      const scale = 0.9 + Math.random() * 0.4;

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

  // 3. Coastal Palm Trees (Along 370m Highway Loop & Beach Promenade)
  spawnPalmTrees() {
    const count = 96;
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.38, 7.5, 6);
    trunkGeo.translate(0, 3.75, 0);

    const leafGeo = new THREE.ConeGeometry(3.2, 1.6, 6);
    leafGeo.translate(0, 7.8, 0);

    const palmMat = this.assetGen.createToonMaterial(0x22c55e);
    const trunkMat = this.assetGen.createToonMaterial(0xa16207);

    const instancedLeaf = new THREE.InstancedMesh(leafGeo, palmMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedLeaf.castShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 368; // Along 370m Coastal Highway
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = this.terrain.getElevation(x, z);

      dummy.position.set(x, y, z);
      dummy.rotation.y = angle;
      dummy.rotation.z = (Math.sin(i * 1.5)) * 0.12; // Natural organic lean
      dummy.scale.set(1.1, 1.1, 1.1);
      dummy.updateMatrix();

      instancedLeaf.setMatrixAt(i, dummy.matrix);
      instancedTrunk.setMatrixAt(i, dummy.matrix);
    }

    instancedLeaf.instanceMatrix.needsUpdate = true;
    instancedTrunk.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedLeaf, instancedTrunk);
    this.instancedPalms = { leaf: instancedLeaf, trunk: instancedTrunk };
  }

  // 4. Instanced Bushes & Flower Shrubs along Sidewalks & Gardens
  spawnBushes() {
    const count = 220;
    const bushGeo = new THREE.SphereGeometry(1.3, 8, 8);
    const bushMat = this.assetGen.createToonMaterial(0x16a34a);

    const instancedBushes = new THREE.InstancedMesh(bushGeo, bushMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 280;
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
