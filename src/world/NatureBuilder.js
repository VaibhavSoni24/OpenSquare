import * as THREE from 'three';

export class NatureBuilder {
  constructor(scene, assetGen, terrain) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.terrain = terrain;

    this.instancedSakuras = null;
    this.instancedPines = null;
    this.instancedOaks = null;
    this.instancedPalms = null;
    this.instancedBushes = null;

    this.init();
  }

  init() {
    this.spawnSakuraTrees();
    this.spawnMountainPines();
    this.spawnOakAndWillowTrees();
    this.spawnPalmTrees();
    this.spawnBushes();
  }

  // 1. Instanced Blooming Sakura Cherry Blossom Trees
  spawnSakuraTrees() {
    const count = 260;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 4.4, 7);
    trunkGeo.translate(0, 2.2, 0);

    const foliageGeo = new THREE.DodecahedronGeometry(3.2, 1);
    foliageGeo.translate(0, 5.4, 0);

    const sakuraMat = this.assetGen.createToonMaterial(0xffa8ba); // Soft pastel sakura pink
    const trunkMat = this.assetGen.createToonMaterial(0x5c3d2e);

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, sakuraMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedFoliage.castShadow = true;
    instancedTrunk.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let attempts = 0; attempts < count * 3 && idx < count; attempts++) {
      let x, z;
      if (idx < 180) {
        // Expansive Sakura Residential streets & gardens (x: 60~480, z: 60~480)
        x = 65 + Math.random() * 415;
        z = 65 + Math.random() * 415;
      } else {
        // Mount Sakura Shinto Shrine Sanctuary & approach (x: 200~320, z: -480~-360)
        x = 210 + Math.random() * 110;
        z = -480 + Math.random() * 120;
      }

      if (this.terrain.isWater(x, z)) continue;

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

    instancedFoliage.count = idx;
    instancedTrunk.count = idx;
    instancedFoliage.instanceMatrix.needsUpdate = true;
    instancedTrunk.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedFoliage, instancedTrunk);
    this.instancedSakuras = { foliage: instancedFoliage, trunk: instancedTrunk };
  }

  // 2. Evergreen Mountain Pines & Cryptomeria on Mount Sakura
  spawnMountainPines() {
    const count = 160;
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 6.0, 7);
    trunkGeo.translate(0, 3.0, 0);

    const foliageGeo = new THREE.ConeGeometry(2.8, 7.5, 6);
    foliageGeo.translate(0, 7.5, 0);

    const pineMat = this.assetGen.createToonMaterial(0x1e3a1e); // Deep forest green
    const trunkMat = this.assetGen.createToonMaterial(0x452211);

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, pineMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedFoliage.castShadow = true;
    instancedTrunk.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let attempts = 0; attempts < count * 3 && idx < count; attempts++) {
      // Slopes of Mount Sakura highlands (x: 130~360, z: -520~-220)
      const x = 135 + Math.random() * 220;
      const z = -510 + Math.random() * 280;

      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getElevation(x, z);
      if (y < 4.0) continue; // Only on mountain slopes

      const scale = 0.9 + Math.random() * 0.5;
      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.scale.set(scale, scale * (1.0 + Math.random() * 0.3), scale);
      dummy.updateMatrix();

      instancedFoliage.setMatrixAt(idx, dummy.matrix);
      instancedTrunk.setMatrixAt(idx, dummy.matrix);
      idx++;
    }

    instancedFoliage.count = idx;
    instancedTrunk.count = idx;
    instancedFoliage.instanceMatrix.needsUpdate = true;
    instancedTrunk.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedFoliage, instancedTrunk);
    this.instancedPines = { foliage: instancedFoliage, trunk: instancedTrunk };
  }

  // 3. Verdant Oaks & Weeping Willows (Central Park & Emerald Lake Rim)
  spawnOakAndWillowTrees() {
    const count = 200;
    const trunkGeo = new THREE.CylinderGeometry(0.42, 0.65, 5.2, 8);
    trunkGeo.translate(0, 2.6, 0);

    const foliageGeo = new THREE.IcosahedronGeometry(3.6, 1);
    foliageGeo.translate(0, 6.4, 0);

    const oakMat = this.assetGen.createToonMaterial(0x22c55e); // Vibrant emerald green
    const trunkMat = this.assetGen.createToonMaterial(0x6b4f3b);

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, oakMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedFoliage.castShadow = true;
    instancedTrunk.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let attempts = 0; attempts < count * 3 && idx < count; attempts++) {
      let x, z;
      if (idx < 120) {
        // Circling around Emerald Lake parkland (x: -420~-240, z: -270~-90)
        const angle = Math.random() * Math.PI * 2;
        const dist = 86 + Math.random() * 45; // Just outside 80m lake radius!
        x = -330 + Math.cos(angle) * dist;
        z = -180 + Math.sin(angle) * dist;
      } else {
        // Civic District & Downtown Central Park boulevard
        x = -260 + Math.random() * 160;
        z = -120 + Math.random() * 140;
      }

      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getElevation(x, z);
      const scale = 0.9 + Math.random() * 0.45;

      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      instancedFoliage.setMatrixAt(idx, dummy.matrix);
      instancedTrunk.setMatrixAt(idx, dummy.matrix);
      idx++;
    }

    instancedFoliage.count = idx;
    instancedTrunk.count = idx;
    instancedFoliage.instanceMatrix.needsUpdate = true;
    instancedTrunk.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedFoliage, instancedTrunk);
    this.instancedOaks = { foliage: instancedFoliage, trunk: instancedTrunk };
  }

  // 4. Coastal Palm Trees (Along 650m Coastal Highway & Sandy Beaches)
  spawnPalmTrees() {
    const count = 120;
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.42, 8.5, 6);
    trunkGeo.translate(0, 4.25, 0);

    const leafGeo = new THREE.ConeGeometry(3.6, 1.8, 6);
    leafGeo.translate(0, 8.8, 0);

    const palmMat = this.assetGen.createToonMaterial(0x10b981);
    const trunkMat = this.assetGen.createToonMaterial(0xa16207);

    const instancedLeaf = new THREE.InstancedMesh(leafGeo, palmMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedLeaf.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      // Staggered along outer edge of 650m Highway and inner beach fringe
      const r = 658 + (i % 2 === 0 ? 8 : -8);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getElevation(x, z);

      dummy.position.set(x, y, z);
      dummy.rotation.y = angle;
      dummy.rotation.z = Math.sin(i * 1.5) * 0.14; // Organic beach breeze lean
      dummy.scale.set(1.15, 1.15, 1.15);
      dummy.updateMatrix();

      instancedLeaf.setMatrixAt(idx, dummy.matrix);
      instancedTrunk.setMatrixAt(idx, dummy.matrix);
      idx++;
    }

    instancedLeaf.count = idx;
    instancedTrunk.count = idx;
    instancedLeaf.instanceMatrix.needsUpdate = true;
    instancedTrunk.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedLeaf, instancedTrunk);
    this.instancedPalms = { leaf: instancedLeaf, trunk: instancedTrunk };
  }

  // 5. Instanced Flower Shrubs & Garden Hedges
  spawnBushes() {
    const count = 280;
    const bushGeo = new THREE.SphereGeometry(1.4, 8, 8);
    const bushMat = this.assetGen.createToonMaterial(0x15803d);

    const instancedBushes = new THREE.InstancedMesh(bushGeo, bushMat, count);
    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let attempts = 0; attempts < count * 3 && idx < count; attempts++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 42 + Math.random() * 460;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getElevation(x, z) + 0.45;

      dummy.position.set(x, y, z);
      dummy.scale.set(0.7 + Math.random() * 0.6, 0.5 + Math.random() * 0.4, 0.7 + Math.random() * 0.6);
      dummy.updateMatrix();

      instancedBushes.setMatrixAt(idx, dummy.matrix);
      idx++;
    }

    instancedBushes.count = idx;
    instancedBushes.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedBushes);
    this.instancedBushes = instancedBushes;
  }
}
