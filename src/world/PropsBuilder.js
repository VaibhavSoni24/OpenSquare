import * as THREE from 'three';

export class PropsBuilder {
  constructor(scene, assetGen, terrain, roadNetwork) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.terrain = terrain;
    this.roadNetwork = roadNetwork;

    this.streetLights = null;
    this.benches = null;
    this.hydrants = null;
    this.stoneLanterns = null;

    this.init();
  }

  init() {
    this.spawnStreetLights();
    this.spawnStoneLanterns();
    this.spawnBenches();
    this.spawnFireHydrants();
    this.spawnTrafficSignalPoles();
  }

  // 1. Instanced Modern Anime Street Lights along Grand Boulevard & Avenues
  spawnStreetLights() {
    const count = 180;
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
    poleGeo.translate(0, 3.75, 0);

    const headGeo = new THREE.BoxGeometry(0.8, 0.4, 1.4);
    headGeo.translate(0, 7.5, 0.6);

    const poleMat = this.assetGen.createToonMaterial(0x334155);
    const headMat = this.assetGen.createToonMaterial(0xfef08a); // Emits warm yellow

    const instancedPole = new THREE.InstancedMesh(poleGeo, poleMat, count);
    const instancedHead = new THREE.InstancedMesh(headGeo, headMat, count);
    instancedPole.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    // A. Roundabout Perimeter Lamps (12 lamps around traffic circle at 0, 40)
    for (let r = 0; r < 12; r++) {
      if (idx >= count) break;
      const ang = (r / 12) * Math.PI * 2;
      const px = Math.cos(ang) * 38;
      const pz = 40 + Math.sin(ang) * 38;
      // Skip street driving lanes
      if (Math.abs(px) < 14 || Math.abs(pz - 40) < 14) continue;

      const py = this.terrain.getElevation(px, pz);
      dummy.position.set(px, py, pz);
      dummy.rotation.y = ang + Math.PI;
      dummy.updateMatrix();

      instancedPole.setMatrixAt(idx, dummy.matrix);
      instancedHead.setMatrixAt(idx, dummy.matrix);
      idx++;
    }

    // B. Grand Central Boulevard (East-West along z = 40)
    for (let bx = -220; bx <= 520; bx += 45) {
      if (Math.abs(bx) < 38) continue; // Roundabout area
      [-11.5, 11.5].forEach(dz => {
        if (idx >= count) return;
        const px = bx, pz = 40 + dz;
        const py = this.terrain.getElevation(px, pz);
        dummy.position.set(px, py, pz);
        dummy.rotation.y = dz > 0 ? Math.PI : 0;
        dummy.updateMatrix();
        instancedPole.setMatrixAt(idx, dummy.matrix);
        instancedHead.setMatrixAt(idx, dummy.matrix);
        idx++;
      });
    }

    // C. Downtown Financial Avenue (North-South along x = 0)
    for (let bz = -340; bz <= 440; bz += 45) {
      if (Math.abs(bz - 40) < 38) continue; // Roundabout area
      [-11.5, 11.5].forEach(dx => {
        if (idx >= count) return;
        const px = dx, pz = bz;
        const py = this.terrain.getElevation(px, pz);
        dummy.position.set(px, py, pz);
        dummy.rotation.y = dx > 0 ? -Math.PI / 2 : Math.PI / 2;
        dummy.updateMatrix();
        instancedPole.setMatrixAt(idx, dummy.matrix);
        instancedHead.setMatrixAt(idx, dummy.matrix);
        idx++;
      });
    }

    // D. Commercial Grid Streets (x = 120, 240, 380)
    [120, 240, 380].forEach(gx => {
      for (let gz = -300; gz <= 0; gz += 60) {
        if (idx >= count) return;
        const px = gx + 9.5;
        const pz = gz;
        const py = this.terrain.getElevation(px, pz);
        dummy.position.set(px, py, pz);
        dummy.rotation.y = -Math.PI / 2;
        dummy.updateMatrix();
        instancedPole.setMatrixAt(idx, dummy.matrix);
        instancedHead.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    });

    instancedPole.count = idx;
    instancedHead.count = idx;
    instancedPole.instanceMatrix.needsUpdate = true;
    instancedHead.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedPole, instancedHead);
  }

  // 2. Traditional Japanese Granite Stone Lanterns (Tōrō ⛩️)
  spawnStoneLanterns() {
    const count = 16;
    const baseGeo = new THREE.CylinderGeometry(0.45, 0.55, 1.2, 6);
    baseGeo.translate(0, 0.6, 0);

    const lightGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    lightGeo.translate(0, 1.45, 0);

    const roofGeo = new THREE.ConeGeometry(0.85, 0.5, 6);
    roofGeo.translate(0, 2.05, 0);

    const stoneMat = this.assetGen.createToonMaterial(0x94a3b8); // Granite stone
    const fireMat = this.assetGen.createToonMaterial(0xfef08a); // Warm lantern glow

    const lanternGroup = new THREE.Group();

    // Place lanterns along Mount Sakura Torii sacred mountain path (around x: 650, z: -550)
    const lanternCoords = [
      { x: 620, z: -520 }, { x: 630, z: -520 },
      { x: 635, z: -535 }, { x: 645, z: -535 },
      { x: 640, z: -545 }, { x: 660, z: -545 },
      { x: 640, z: -560 }, { x: 660, z: -560 },
      { x: 635, z: -575 }, { x: 665, z: -575 },
      { x: 645, z: -585 }, { x: 655, z: -585 }
    ];

    lanternCoords.forEach(c => {
      const g = new THREE.Group();
      const y = 47.0; // Terrace summit
      g.position.set(c.x, y, c.z);

      const b = new THREE.Mesh(baseGeo, stoneMat);
      const l = new THREE.Mesh(lightGeo, fireMat);
      const r = new THREE.Mesh(roofGeo, stoneMat);
      b.castShadow = true;
      r.castShadow = true;

      g.add(b, l, r);
      lanternGroup.add(g);
    });

    this.scene.add(lanternGroup);
  }

  // 3. Instanced Benches in Central Park, Lake Promenade & Mountain Viewpoint
  spawnBenches() {
    const count = 50;
    const benchGeo = new THREE.BoxGeometry(2.4, 0.8, 1.0);
    benchGeo.translate(0, 0.4, 0);
    const benchMat = this.assetGen.createToonMaterial(0x854d0e);

    const instancedBench = new THREE.InstancedMesh(benchGeo, benchMat, count);
    const dummy = new THREE.Object3D();
    let idx = 0;

    // Around Emerald Lake rim (radius 122m around -360, 40)
    for (let i = 0; i < 30 && idx < count; i++) {
      const ang = (i / 30) * Math.PI * 2;
      const x = -360 + Math.cos(ang) * 122;
      const z = 40 + Math.sin(ang) * 122;

      // Keep bridge clear
      if (x >= -490 && x <= -230 && Math.abs(z - 40) < 18) continue;
      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getElevation(x, z);
      dummy.position.set(x, y, z);
      dummy.rotation.y = ang + Math.PI; // Face inward toward water
      dummy.updateMatrix();

      instancedBench.setMatrixAt(idx, dummy.matrix);
      idx++;
    }

    // Mount Sakura summit viewpoint
    const summitBenches = [
      { x: 655, z: -535, rot: 0 },
      { x: 662, z: -535, rot: 0.3 },
      { x: 648, z: -535, rot: -0.3 }
    ];
    summitBenches.forEach(sb => {
      if (idx >= count) return;
      dummy.position.set(sb.x, 47.0, sb.z);
      dummy.rotation.y = sb.rot;
      dummy.updateMatrix();
      instancedBench.setMatrixAt(idx, dummy.matrix);
      idx++;
    });

    instancedBench.count = idx;
    instancedBench.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedBench);
  }

  // 4. Cute Fire Hydrants along sidewalks
  spawnFireHydrants() {
    const count = 36;
    const hydrantGeo = new THREE.CylinderGeometry(0.25, 0.28, 1.0, 8);
    hydrantGeo.translate(0, 0.5, 0);
    const hydrantMat = this.assetGen.createToonMaterial(0xef4444);

    const instancedHydrant = new THREE.InstancedMesh(hydrantGeo, hydrantMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const px = -150 + (i % 6) * 100;
      const pz = -200 + Math.floor(i / 6) * 80;
      const py = this.terrain.getElevation(px, pz);

      dummy.position.set(px, py, pz);
      dummy.updateMatrix();

      instancedHydrant.setMatrixAt(i, dummy.matrix);
    }

    instancedHydrant.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedHydrant);
  }

  // 5. Traffic Signal Poles at Intersections
  spawnTrafficSignalPoles() {
    const interPoints = [
      { x: 0, z: -120 }, { x: 0, z: -240 },
      { x: 120, z: 40 }, { x: 240, z: 40 }, { x: 380, z: 40 },
      { x: 120, z: -120 }, { x: 240, z: -120 }, { x: 380, z: -120 }
    ];

    const poleGeo = new THREE.CylinderGeometry(0.15, 0.18, 6.5, 8);
    const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.5, 8);
    armGeo.rotateZ(Math.PI / 2);
    const boxGeo = new THREE.BoxGeometry(0.6, 1.5, 0.6);

    const metalMat = this.assetGen.createToonMaterial(0x1e293b);
    const signalMat = this.assetGen.createToonMaterial(0x22c55e);

    interPoints.forEach(inter => {
      const y = this.terrain.getElevation(inter.x, inter.z);
      const group = new THREE.Group();
      group.position.set(inter.x + 11.5, y, inter.z + 11.5);

      const pole = new THREE.Mesh(poleGeo, metalMat);
      pole.position.y = 3.25;

      const arm = new THREE.Mesh(armGeo, metalMat);
      arm.position.set(-2.25, 6.2, 0);

      const lightBox = new THREE.Mesh(boxGeo, signalMat);
      lightBox.position.set(-3.5, 5.8, 0);

      group.add(pole, arm, lightBox);
      this.scene.add(group);
    });
  }
}
