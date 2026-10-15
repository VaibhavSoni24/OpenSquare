import * as THREE from 'three';

export class VehicleModels {
  static create(assetGen, type = 'kei', color = 0xff7eb3) {
    const group = new THREE.Group();

    const bodyMat = assetGen.createToonMaterial(color);
    const darkMat = assetGen.createToonMaterial(0x1e293b);
    const glassMat = assetGen.createToonMaterial(0xa5f3fc, { transparent: true, opacity: 0.75 });
    const chromeMat = assetGen.createToonMaterial(0xe2e8f0);
    const lightMat = assetGen.createToonMaterial(0xfef08a);
    const brakeMat = assetGen.createToonMaterial(0xef4444);
    const tireMat = assetGen.createToonMaterial(0x18181b);
    const rimMat = assetGen.createToonMaterial(0xffffff);

    let length = 3.6;
    let width = 1.8;
    let height = 1.5;
    let driverSeatOffset = new THREE.Vector3(-0.35, 0.4, 0.1);

    const wheels = [];

    // Helper to build a cute anime wheel
    const makeWheel = (x, y, z, isFront = false) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(x, y, z);

      // Tire
      const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;

      // Rim
      const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.29, 12);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);

      // Cute center hubcap star
      const hubGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
      hubGeo.rotateZ(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, bodyMat);

      wheelGroup.add(tire, rim, hub);
      group.add(wheelGroup);

      wheels.push({ group: wheelGroup, tire, isFront, basePos: new THREE.Vector3(x, y, z) });
      return wheelGroup;
    };

    if (type === 'kei') {
      // 1. Cute Boxy Japanese Kei-Car
      length = 3.4;
      width = 1.7;
      height = 1.6;

      // Main chassis
      const bodyGeo = new THREE.BoxGeometry(width, 0.75, length);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.65;
      body.castShadow = true;
      group.add(body);

      // Cute Cabin
      const cabinGeo = new THREE.BoxGeometry(width * 0.92, 0.85, length * 0.62);
      const cabin = new THREE.Mesh(cabinGeo, bodyMat);
      cabin.position.set(0, 1.35, -0.15);
      cabin.castShadow = true;
      group.add(cabin);

      // Windshield & Windows
      const windGeo = new THREE.BoxGeometry(width * 0.94, 0.65, length * 0.58);
      const wind = new THREE.Mesh(windGeo, glassMat);
      wind.position.set(0, 1.38, -0.15);
      group.add(wind);

      // Cute Big Round Anime Headlights
      [-0.55, 0.55].forEach(hx => {
        const hlGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.1, 16);
        hlGeo.rotateX(Math.PI / 2);
        const hl = new THREE.Mesh(hlGeo, lightMat);
        hl.position.set(hx, 0.75, length / 2 + 0.02);
        group.add(hl);

        // Cute blush cheeks
        const blushGeo = new THREE.BoxGeometry(0.25, 0.1, 0.05);
        const blush = new THREE.Mesh(blushGeo, assetGen.createToonMaterial(0xff4081, { transparent: true, opacity: 0.7 }));
        blush.position.set(hx * 1.3, 0.5, length / 2 + 0.02);
        group.add(blush);
      });

      // Taillights
      [-0.55, 0.55].forEach(tx => {
        const tlGeo = new THREE.BoxGeometry(0.3, 0.18, 0.08);
        const tl = new THREE.Mesh(tlGeo, brakeMat);
        tl.position.set(tx, 0.75, -length / 2 - 0.02);
        group.add(tl);
      });

      // Roof Antenna
      const antGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.6, 6);
      antGeo.rotateX(-0.2);
      const ant = new THREE.Mesh(antGeo, darkMat);
      ant.position.set(0, 1.9, -0.6);
      group.add(ant);

      // Wheels
      makeWheel(-width / 2 - 0.05, 0.38, length * 0.32, true);
      makeWheel(width / 2 + 0.05, 0.38, length * 0.32, true);
      makeWheel(-width / 2 - 0.05, 0.38, -length * 0.32, false);
      makeWheel(width / 2 + 0.05, 0.38, -length * 0.32, false);

      driverSeatOffset.set(-0.32, 0.7, -0.1);
    } else if (type === 'beetle') {
      // 2. Curvy Retro Bubble Beetle
      length = 3.6;
      width = 1.8;
      height = 1.45;

      const bodyGeo = new THREE.BoxGeometry(width, 0.65, length);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.6;
      body.castShadow = true;
      group.add(body);

      // Bubble Dome Roof
      const domeGeo = new THREE.SphereGeometry(1.05, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      domeGeo.scale(width * 0.48, 0.95, length * 0.38);
      const dome = new THREE.Mesh(domeGeo, bodyMat);
      dome.position.set(0, 0.9, -0.1);
      dome.castShadow = true;
      group.add(dome);

      // Windows
      const winGeo = new THREE.SphereGeometry(1.02, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
      winGeo.scale(width * 0.49, 0.88, length * 0.35);
      const win = new THREE.Mesh(winGeo, glassMat);
      win.position.set(0, 0.93, -0.1);
      group.add(win);

      // Round headlights
      [-0.6, 0.6].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), lightMat);
        hl.position.set(hx, 0.65, length / 2);
        group.add(hl);
      });

      // Chrome bumpers
      const bumperGeo = new THREE.CylinderGeometry(0.08, 0.08, width + 0.2, 8);
      bumperGeo.rotateZ(Math.PI / 2);
      const fBump = new THREE.Mesh(bumperGeo, chromeMat);
      fBump.position.set(0, 0.4, length / 2 + 0.12);
      const rBump = new THREE.Mesh(bumperGeo, chromeMat);
      rBump.position.set(0, 0.4, -length / 2 - 0.12);
      group.add(fBump, rBump);

      // Wheels
      makeWheel(-width / 2 - 0.05, 0.38, length * 0.32, true);
      makeWheel(width / 2 + 0.05, 0.38, length * 0.32, true);
      makeWheel(-width / 2 - 0.05, 0.38, -length * 0.32, false);
      makeWheel(width / 2 + 0.05, 0.38, -length * 0.32, false);

      driverSeatOffset.set(-0.35, 0.6, -0.1);
    } else {
      // 3. Sports Coupe Drift Racer
      length = 4.0;
      width = 1.9;
      height = 1.3;

      const bodyGeo = new THREE.BoxGeometry(width, 0.55, length);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.5;
      body.castShadow = true;
      group.add(body);

      // Sleek cabin
      const cabinGeo = new THREE.BoxGeometry(width * 0.85, 0.6, length * 0.5);
      const cabin = new THREE.Mesh(cabinGeo, bodyMat);
      cabin.position.set(0, 1.0, -0.2);
      cabin.castShadow = true;
      group.add(cabin);

      const glassGeo = new THREE.BoxGeometry(width * 0.87, 0.55, length * 0.46);
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(0, 1.02, -0.2);
      group.add(glass);

      // Rear Spoiler / Wing
      const wingGeo = new THREE.BoxGeometry(width + 0.2, 0.08, 0.4);
      const wing = new THREE.Mesh(wingGeo, darkMat);
      wing.position.set(0, 1.1, -length / 2 + 0.2);
      const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);
      [-0.6, 0.6].forEach(sx => {
        const strut = new THREE.Mesh(strutGeo, darkMat);
        strut.position.set(sx, 0.9, -length / 2 + 0.2);
        group.add(strut);
      });
      group.add(wing);

      // Angry anime slit headlights
      [-0.65, 0.65].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.1), lightMat);
        hl.position.set(hx, 0.55, length / 2 + 0.01);
        group.add(hl);
      });

      // Wheels
      makeWheel(-width / 2 - 0.06, 0.38, length * 0.32, true);
      makeWheel(width / 2 + 0.06, 0.38, length * 0.32, true);
      makeWheel(-width / 2 - 0.06, 0.38, -length * 0.32, false);
      makeWheel(width / 2 + 0.06, 0.38, -length * 0.32, false);

      driverSeatOffset.set(-0.38, 0.55, -0.2);
    }

    // Headlight SpotLight beam
    const headLightSpot = new THREE.SpotLight(0xfffbeb, 2.5, 45, Math.PI / 6, 0.4, 1);
    headLightSpot.position.set(0, 0.8, length / 2);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(0, 0, length / 2 + 20);
    group.add(targetObj);
    headLightSpot.target = targetObj;
    group.add(headLightSpot);

    return {
      root: group,
      wheels,
      driverSeatOffset,
      dimensions: { length, width, height },
      headLightSpot,
      brakeLights: group.children.filter(c => c.material === brakeMat)
    };
  }
}
