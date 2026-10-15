import * as THREE from 'three';

export class NatureBuilder {
  constructor(scene, assetGen, terrain) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.terrain = terrain;

    this.init();
  }

  init() {
    this.spawnLighthouseKnittedForest();
    this.spawnMountSakuraPines();
    this.spawnSakuraCherryBlossoms();
    this.spawnLakeWillowsAndOaks();
    this.spawnCoastalPalms();
    this.spawnBushesAndShrubs();
  }

  // 1. Dense Knitted Pine Forest along the Road to the Lighthouse (North-West Cape)
  spawnLighthouseKnittedForest() {
    const count = 460;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 6.5, 7);
    trunkGeo.translate(0, 3.25, 0);

    const foliageGeo = new THREE.ConeGeometry(3.2, 8.5, 6);
    foliageGeo.translate(0, 8.5, 0);

    const pineMat = this.assetGen.createToonMaterial(0x1e3a1e); // Deep evergreen spruce
    const trunkMat = this.assetGen.createToonMaterial(0x3e2723);

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, pineMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedFoliage.castShadow = true;
    instancedTrunk.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let attempts = 0; attempts < count * 3 && idx < count; attempts++) {
      // North-West Forest Promontory (x: -1150 ~ -520, z: -900 ~ -150)
      const x = -1150 + Math.random() * 630;
      const z = -900 + Math.random() * 750;

      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getElevation(x, z);
      if (y < 1.2) continue; // Keep clear of beaches

      const scale = 0.85 + Math.random() * 0.55;
      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.scale.set(scale, scale * (0.95 + Math.random() * 0.3), scale);
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
  }

  // 2. Mount Sakura Highland Cryptomeria Pines (East / North-East)
  spawnMountSakuraPines() {
    const count = 350;
    const trunkGeo = new THREE.CylinderGeometry(0.32, 0.52, 7.0, 7);
    trunkGeo.translate(0, 3.5, 0);

    const foliageGeo = new THREE.ConeGeometry(2.8, 7.8, 6);
    foliageGeo.translate(0, 8.0, 0);

    const pineMat = this.assetGen.createToonMaterial(0x14532d); // Forest green
    const trunkMat = this.assetGen.createToonMaterial(0x451a03);

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, pineMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedFoliage.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let attempts = 0; attempts < count * 3 && idx < count; attempts++) {
      // Mount Sakura slopes (x: 420 ~ 850, z: -720 ~ -220)
      const x = 420 + Math.random() * 430;
      const z = -720 + Math.random() * 500;

      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getElevation(x, z);
      if (y < 4.0) continue; // Only on mountain elevations

      const scale = 0.9 + Math.random() * 0.5;
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
  }

  // 3. Sakura Cherry Blossom Trees across Residential Suburbs & Shrine Grounds
  spawnSakuraCherryBlossoms() {
    const count = 380;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 4.5, 7);
    trunkGeo.translate(0, 2.25, 0);

    const foliageGeo = new THREE.DodecahedronGeometry(3.3, 1);
    foliageGeo.translate(0, 5.6, 0);

    const sakuraMat = this.assetGen.createToonMaterial(0xffa8ba); // Soft pink sakura
    const trunkMat = this.assetGen.createToonMaterial(0x5c3d2e);

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, sakuraMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedFoliage.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let attempts = 0; attempts < count * 3 && idx < count; attempts++) {
      let x, z;
      if (idx < 300) {
        // Residential streets & private yards (x: -120 ~ 550, z: 180 ~ 750)
        x = -120 + Math.random() * 670;
        z = 180 + Math.random() * 570;
      } else {
        // Mount Sakura Shinto Shrine Sanctuary (x: 600 ~ 720, z: -600 ~ -480)
        x = 600 + Math.random() * 120;
        z = -600 + Math.random() * 120;
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
  }

  // 4. Emerald Lake Weeping Willows & Park Oaks
  spawnLakeWillowsAndOaks() {
    const count = 280;
    const trunkGeo = new THREE.CylinderGeometry(0.42, 0.65, 5.2, 8);
    trunkGeo.translate(0, 2.6, 0);

    const foliageGeo = new THREE.IcosahedronGeometry(3.6, 1);
    foliageGeo.translate(0, 6.4, 0);

    const oakMat = this.assetGen.createToonMaterial(0x22c55e); // Emerald leaf green
    const trunkMat = this.assetGen.createToonMaterial(0x6b4f3b);

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, oakMat, count);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    instancedFoliage.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let attempts = 0; attempts < count * 3 && idx < count; attempts++) {
      let x, z;
      if (idx < 180) {
        // Circling Emerald Lake Rim (Just outside the 115m lake radius!)
        const ang = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 55;
        x = -360 + Math.cos(ang) * dist;
        z = 40 + Math.sin(ang) * dist;
        // Keep bridge clear
        if (x >= -490 && x <= -230 && Math.abs(z - 40) < 18) continue;
      } else {
        // Downtown Boulevards & Central Plazas
        x = -180 + Math.random() * 320;
        z = -180 + Math.random() * 200;
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
  }

  // 5. Coastal Palm Trees (Along beaches and coastal loops)
  spawnCoastalPalms() {
    const count = 160;
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
      const ang = (i / count) * Math.PI * 2;
      const r = this.terrain.getIslandRadius(ang) - 35;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;

      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getElevation(x, z);
      if (y < 0.2) continue;

      dummy.position.set(x, y, z);
      dummy.rotation.y = ang;
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
  }

  // 6. Flowering Shrubs, Hedges & Bushes
  spawnBushesAndShrubs() {
    const count = 450;
    const bushGeo = new THREE.SphereGeometry(1.4, 8, 8);
    const bushMat = this.assetGen.createToonMaterial(0x15803d);

    const instancedBushes = new THREE.InstancedMesh(bushGeo, bushMat, count);
    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let attempts = 0; attempts < count * 3 && idx < count; attempts++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 800;
      const x = Math.cos(ang) * dist;
      const z = Math.sin(ang) * dist;

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
  }
}
