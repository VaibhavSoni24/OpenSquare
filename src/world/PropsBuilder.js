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

  // 1. Instanced Modern Anime Street Lights along Avenues, Roundabout & Highway
  spawnStreetLights() {
    const count = 160;
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

    // A. Roundabout Perimeter Lamps (12 lamps around 40m traffic circle)
    for (let r = 0; r < 12; r++) {
      if (idx >= count) break;
      const ang = (r / 12) * Math.PI * 2;
      const px = Math.cos(ang) * 44;
      const pz = Math.sin(ang) * 44;
      const py = this.terrain.getElevation(px, pz);

      dummy.position.set(px, py, pz);
      dummy.rotation.y = ang + Math.PI; // Face inward toward road
      dummy.updateMatrix();

      instancedPole.setMatrixAt(idx, dummy.matrix);
      instancedHead.setMatrixAt(idx, dummy.matrix);
      idx++;
    }

    // B. Four Major Arterial Avenues (Length 550m each)
    const arterialSpacings = [80, 150, 220, 290, 360, 430, 500, 570];
    arterialSpacings.forEach(d => {
      // North Avenue (x = 0, z = -d)
      [-10, 10].forEach(dx => {
        if (idx >= count) return;
        const px = dx, pz = -d;
        dummy.position.set(px, this.terrain.getElevation(px, pz), pz);
        dummy.rotation.y = dx > 0 ? -Math.PI / 2 : Math.PI / 2;
        dummy.updateMatrix();
        instancedPole.setMatrixAt(idx, dummy.matrix);
        instancedHead.setMatrixAt(idx, dummy.matrix);
        idx++;
      });

      // South Avenue (x = 0, z = +d)
      [-10, 10].forEach(dx => {
        if (idx >= count) return;
        const px = dx, pz = d;
        dummy.position.set(px, this.terrain.getElevation(px, pz), pz);
        dummy.rotation.y = dx > 0 ? -Math.PI / 2 : Math.PI / 2;
        dummy.updateMatrix();
        instancedPole.setMatrixAt(idx, dummy.matrix);
        instancedHead.setMatrixAt(idx, dummy.matrix);
        idx++;
      });

      // East Avenue (x = +d, z = 0)
      [-10, 10].forEach(dz => {
        if (idx >= count) return;
        const px = d, pz = dz;
        dummy.position.set(px, this.terrain.getElevation(px, pz), pz);
        dummy.rotation.y = dz > 0 ? Math.PI : 0;
        dummy.updateMatrix();
        instancedPole.setMatrixAt(idx, dummy.matrix);
        instancedHead.setMatrixAt(idx, dummy.matrix);
        idx++;
      });

      // West Avenue (x = -d, z = 0)
      [-10, 10].forEach(dz => {
        if (idx >= count) return;
        const px = -d, pz = dz;
        dummy.position.set(px, this.terrain.getElevation(px, pz), pz);
        dummy.rotation.y = dz > 0 ? Math.PI : 0;
        dummy.updateMatrix();
        instancedPole.setMatrixAt(idx, dummy.matrix);
        instancedHead.setMatrixAt(idx, dummy.matrix);
        idx++;
      });
    });

    // C. Downtown Grid Streets
    const dtAvenues = [-160, -90, -30];
    dtAvenues.forEach(x => {
      for (let z = -200; z <= 0; z += 50) {
        if (Math.hypot(x, z) < 45 || idx >= count) continue;
        const px = x + 9.5;
        const pz = z;
        dummy.position.set(px, this.terrain.getElevation(px, pz), pz);
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

    // Place lanterns along Mount Sakura Torii sacred mountain path
    const lanternCoords = [
      { x: 215, z: -385 }, { x: 225, z: -385 },
      { x: 235, z: -405 }, { x: 245, z: -405 },
      { x: 255, z: -425 }, { x: 265, z: -425 },
      { x: 270, z: -440 }, { x: 280, z: -440 },
      { x: 270, z: -460 }, { x: 280, z: -460 },
      { x: 265, z: -475 }, { x: 285, z: -475 }
    ];

    lanternCoords.forEach(c => {
      const g = new THREE.Group();
      const y = this.terrain.getElevation(c.x, c.z);
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

  // 3. Instanced Benches in Central Park & Mountain Scenic Viewpoint
  spawnBenches() {
    const count = 48;
    const benchGeo = new THREE.BoxGeometry(2.4, 0.8, 1.0);
    benchGeo.translate(0, 0.4, 0);
    const benchMat = this.assetGen.createToonMaterial(0x854d0e);

    const instancedBench = new THREE.InstancedMesh(benchGeo, benchMat, count);
    const dummy = new THREE.Object3D();
    let idx = 0;

    // Around Emerald Lake rim
    for (let i = 0; i < 28 && idx < count; i++) {
      const ang = (i / 28) * Math.PI * 2;
      const x = -330 + Math.cos(ang) * 88;
      const z = -180 + Math.sin(ang) * 88;

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
      { x: 275, z: -445, rot: 0 },
      { x: 282, z: -445, rot: 0.3 },
      { x: 268, z: -445, rot: -0.3 }
    ];
    summitBenches.forEach(sb => {
      if (idx >= count) return;
      const y = this.terrain.getElevation(sb.x, sb.z);
      dummy.position.set(sb.x, y, sb.z);
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
    const count = 32;
    const hydrantGeo = new THREE.CylinderGeometry(0.25, 0.28, 1.0, 8);
    hydrantGeo.translate(0, 0.5, 0);
    const hydrantMat = this.assetGen.createToonMaterial(0xef4444);

    const instancedHydrant = new THREE.InstancedMesh(hydrantGeo, hydrantMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const inter = this.roadNetwork.intersections[i % (this.roadNetwork.intersections.length || 1)];
      if (!inter) continue;
      const px = inter.x + 8.5;
      const pz = inter.z + (i % 2 === 0 ? 8.5 : -8.5);
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
    const inters = this.roadNetwork.intersections;
    if (!inters || inters.length === 0) return;

    const poleGeo = new THREE.CylinderGeometry(0.15, 0.18, 6.5, 8);
    const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.5, 8);
    armGeo.rotateZ(Math.PI / 2);
    const boxGeo = new THREE.BoxGeometry(0.6, 1.5, 0.6);

    const metalMat = this.assetGen.createToonMaterial(0x1e293b);
    const signalMat = this.assetGen.createToonMaterial(0x22c55e);

    inters.forEach(inter => {
      const group = new THREE.Group();
      group.position.set(inter.x + 8.5, inter.y, inter.z + 8.5);

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
