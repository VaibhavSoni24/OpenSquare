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

    this.init();
  }

  init() {
    this.spawnStreetLights();
    this.spawnBenches();
    this.spawnFireHydrants();
    this.spawnTrafficSignalPoles();
  }

  // 1. Instanced Street Lights along Downtown Avenues
  spawnStreetLights() {
    const count = 72;
    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
    poleGeo.translate(0, 3.75, 0);

    // Lamp Head fixture
    const headGeo = new THREE.BoxGeometry(0.8, 0.4, 1.4);
    headGeo.translate(0, 7.5, 0.6);

    const poleMat = this.assetGen.createToonMaterial(0x334155);
    const headMat = this.assetGen.createToonMaterial(0xfef08a); // Emits warm yellow

    const instancedPole = new THREE.InstancedMesh(poleGeo, poleMat, count);
    const instancedHead = new THREE.InstancedMesh(headGeo, headMat, count);
    instancedPole.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    // Place along Downtown roads
    const avenues = [-90, 0, 90];
    avenues.forEach(x => {
      for (let z = -100; z <= 100; z += 35) {
        [-8.5, 8.5].forEach(dx => {
          if (idx >= count) return;
          const px = x + dx;
          const pz = z;
          const py = this.terrain.getElevation(px, pz);

          dummy.position.set(px, py, pz);
          dummy.rotation.y = dx > 0 ? -Math.PI / 2 : Math.PI / 2;
          dummy.updateMatrix();

          instancedPole.setMatrixAt(idx, dummy.matrix);
          instancedHead.setMatrixAt(idx, dummy.matrix);
          idx++;
        });
      }
    });

    instancedPole.instanceMatrix.needsUpdate = true;
    instancedHead.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedPole, instancedHead);
  }

  // 2. Instanced Park & Sidewalk Benches
  spawnBenches() {
    const count = 40;
    const benchGeo = new THREE.BoxGeometry(2.4, 0.8, 1.0);
    benchGeo.translate(0, 0.4, 0);
    const benchMat = this.assetGen.createToonMaterial(0x854d0e);

    const instancedBench = new THREE.InstancedMesh(benchGeo, benchMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      let x, z;
      if (i < 25) {
        // Central Park paths
        x = -170 + Math.random() * 80;
        z = -170 + Math.random() * 80;
      } else {
        // Museum plaza & Promenade
        x = 120 + Math.random() * 60;
        z = -130 + Math.random() * 50;
      }
      const y = this.terrain.getElevation(x, z);

      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.updateMatrix();

      instancedBench.setMatrixAt(i, dummy.matrix);
    }

    instancedBench.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedBench);
  }

  // 3. Cute Fire Hydrants along sidewalks
  spawnFireHydrants() {
    const count = 28;
    const hydrantGeo = new THREE.CylinderGeometry(0.25, 0.28, 1.0, 8);
    hydrantGeo.translate(0, 0.5, 0);
    const hydrantMat = this.assetGen.createToonMaterial(0xef4444);

    const instancedHydrant = new THREE.InstancedMesh(hydrantGeo, hydrantMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const inter = this.roadNetwork.intersections[i % this.roadNetwork.intersections.length];
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

  // 4. Traffic Signal Poles at each Intersection
  spawnTrafficSignalPoles() {
    const inters = this.roadNetwork.intersections;
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.18, 6.5, 8);
    const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.5, 8);
    armGeo.rotateZ(Math.PI / 2);
    const boxGeo = new THREE.BoxGeometry(0.6, 1.5, 0.6);

    const metalMat = this.assetGen.createToonMaterial(0x1e293b);
    const signalMat = this.assetGen.createToonMaterial(0x22c55e);

    inters.forEach(inter => {
      const group = new THREE.Group();
      group.position.set(inter.x + 7.5, inter.y, inter.z + 7.5);

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
