import * as THREE from 'three';

export class CityBuilder {
  constructor(scene, assetGen, terrain, roadNetwork) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.terrain = terrain;
    this.roadNetwork = roadNetwork;

    this.colliders = [];
    this.districts = [];

    this.init();
  }

  init() {
    this.buildDowntownSkyscrapers();
    this.buildCivicDistrict(); // Police Station, Hospital, Bank
    this.buildShintoTempleAndTorii(); // Mountain peak temple & Torii gates
    this.buildCafesAndShops(); // Cafes, Conbini, Ramen, Vending
    this.buildDenseSakuraSuburbs(); // 60+ Japanese residential houses & apartments
    this.buildMuseumPlaza();
    this.buildCentralParkAndLake();
    this.buildClifftopLighthouse();
    this.setupDistrictZones();

    // Include road barriers and bridge colliders from road network
    if (this.roadNetwork && this.roadNetwork.roadColliders) {
      this.colliders.push(...this.roadNetwork.roadColliders);
    }
  }

  // -------------------------------------------------------------
  // 1. Downtown High-Rise Financial Core (Skyscrapers & Billboards)
  // -------------------------------------------------------------
  buildDowntownSkyscrapers() {
    const towers = [
      // Downtown Financial Core (Around x: -100~-280, z: -100~150)
      { x: -100, z: -80, w: 28, d: 28, h: 95, pal: 0, roof: 'spire' },
      { x: -100, z: -35, w: 22, d: 20, h: 65, pal: 1, roof: 'stepped' },
      { x: -100, z: 20, w: 24, d: 24, h: 75, pal: 2, roof: 'helipad' },
      { x: -100, z: 80, w: 26, d: 26, h: 88, pal: 3, roof: 'spire' },

      { x: -190, z: -80, w: 32, d: 30, h: 120, pal: 1, roof: 'spire' }, // Landmark Tower
      { x: -190, z: -35, w: 24, d: 24, h: 78, pal: 2, roof: 'helipad' },
      { x: -190, z: 20, w: 26, d: 26, h: 85, pal: 3, roof: 'stepped' },
      { x: -190, z: 80, w: 24, d: 24, h: 70, pal: 0, roof: 'flat' },

      { x: -280, z: -80, w: 26, d: 28, h: 80, pal: 2, roof: 'helipad' },
      { x: -280, z: -35, w: 22, d: 22, h: 60, pal: 3, roof: 'stepped' },
      { x: -280, z: 20, w: 25, d: 25, h: 72, pal: 0, roof: 'spire' },
      { x: -280, z: 80, w: 24, d: 24, h: 68, pal: 1, roof: 'flat' },

      // West Commercial Waterfront Towers
      { x: -380, z: -60, w: 28, d: 28, h: 85, pal: 0, roof: 'helipad' },
      { x: -380, z: 10, w: 26, d: 26, h: 75, pal: 1, roof: 'stepped' },
      { x: -380, z: 70, w: 30, d: 28, h: 90, pal: 2, roof: 'spire' }
    ];

    towers.forEach((cfg, i) => {
      const y = this.terrain.getElevation(cfg.x, cfg.z);
      const group = new THREE.Group();
      group.position.set(cfg.x, y, cfg.z);

      const geo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
      const mat = new THREE.MeshToonMaterial({
        map: this.assetGen.getFacadeTexture(cfg.pal),
        gradientMap: this.assetGen.toonGradient
      });
      const tower = new THREE.Mesh(geo, mat);
      tower.position.y = cfg.h / 2;
      tower.castShadow = true;
      tower.receiveShadow = true;
      group.add(tower);

      // Roof features
      if (cfg.roof === 'spire') {
        const spireGeo = new THREE.ConeGeometry(cfg.w * 0.35, 20, 8);
        const spireMat = this.assetGen.createToonMaterial(0x38bdf8);
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.y = cfg.h + 10;
        spire.castShadow = true;

        const needleGeo = new THREE.CylinderGeometry(0.2, 0.5, 16, 6);
        const needleMat = this.assetGen.createToonMaterial(0xff0055);
        const needle = new THREE.Mesh(needleGeo, needleMat);
        needle.position.y = cfg.h + 26;
        group.add(spire, needle);
      } else if (cfg.roof === 'helipad') {
        const padGeo = new THREE.CylinderGeometry(cfg.w * 0.42, cfg.w * 0.42, 1.4, 24);
        const padMat = this.assetGen.createToonMaterial(0xfbbf24);
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.y = cfg.h + 0.7;

        const hMat = this.assetGen.createToonMaterial(0xffffff);
        const bar1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 8), hMat);
        bar1.position.set(-2.5, cfg.h + 1.45, 0);
        const bar2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 8), hMat);
        bar2.position.set(2.5, cfg.h + 1.45, 0);
        const cross = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.2, 1.2), hMat);
        cross.position.set(0, cfg.h + 1.45, 0);
        group.add(pad, bar1, bar2, cross);
      } else if (cfg.roof === 'stepped') {
        const stepGeo = new THREE.BoxGeometry(cfg.w * 0.68, 12, cfg.d * 0.68);
        const stepMat = this.assetGen.createToonMaterial(0x64748b);
        const step = new THREE.Mesh(stepGeo, stepMat);
        step.position.y = cfg.h + 6;
        group.add(step);
      }

      // Add Anime Neon Billboards on selected commercial towers
      if (i % 3 === 0) {
        const bbMat = new THREE.MeshToonMaterial({
          map: this.assetGen.getBillboardTexture(i % 3),
          gradientMap: this.assetGen.toonGradient
        });
        const bbGeo = new THREE.PlaneGeometry(cfg.w * 0.85, (cfg.w * 0.85) / 2);
        const bb = new THREE.Mesh(bbGeo, bbMat);
        bb.position.set(0, cfg.h * 0.55, cfg.d / 2 + 0.15);
        group.add(bb);
      }

      this.scene.add(group);
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(cfg.x - cfg.w / 2, y, cfg.z - cfg.d / 2),
        new THREE.Vector3(cfg.x + cfg.w / 2, y + cfg.h, cfg.z + cfg.d / 2)
      ));
    });

    // Glass Skybridge connecting two skyscrapers
    const bridgeGeo = new THREE.BoxGeometry(12, 6.0, 35);
    const glassMat = this.assetGen.createToonMaterial(0xa5f3fc, { transparent: true, opacity: 0.82 });
    const skybridge = new THREE.Mesh(bridgeGeo, glassMat);
    skybridge.position.set(-100, 48, -58);
    skybridge.castShadow = true;
    this.scene.add(skybridge);
  }

  // -------------------------------------------------------------
  // 2. Civic District: Police Station, Hospital, Central Bank
  // -------------------------------------------------------------
  buildCivicDistrict() {
    // A. Police Station ("KOBAN 👮")
    const polX = -135;
    const polZ = 120;
    const polY = this.terrain.getElevation(polX, polZ);

    const polGroup = new THREE.Group();
    polGroup.position.set(polX, polY, polZ);

    const polGeo = new THREE.BoxGeometry(22, 10, 18);
    const polMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getPoliceStationTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    const polMesh = new THREE.Mesh(polGeo, polMat);
    polMesh.position.y = 5.0;
    polMesh.castShadow = true;
    polMesh.receiveShadow = true;
    polGroup.add(polMesh);

    // Revolving Emergency Beacon on Roof
    const beaconGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16);
    const beaconMat = this.assetGen.createToonMaterial(0xef4444);
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 10.6;
    polGroup.add(beacon);

    this.scene.add(polGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(polX - 12, polY, polZ - 10),
      new THREE.Vector3(polX + 12, polY + 11, polZ + 10)
    ));

    // B. Central City Hospital ("🏥 HOSPITAL")
    const hospX = -230;
    const hospZ = 120;
    const hospY = this.terrain.getElevation(hospX, hospZ);

    const hospGroup = new THREE.Group();
    hospGroup.position.set(hospX, hospY, hospZ);

    const hospGeo = new THREE.BoxGeometry(38, 22, 28);
    const hospMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getHospitalTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    const hospMesh = new THREE.Mesh(hospGeo, hospMat);
    hospMesh.position.y = 11.0;
    hospMesh.castShadow = true;
    hospMesh.receiveShadow = true;
    hospGroup.add(hospMesh);

    // Rooftop Medical Heliport
    const padGeo = new THREE.CylinderGeometry(11, 11, 1.2, 24);
    const padMat = this.assetGen.createToonMaterial(0xf1f5f9);
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 22.6;

    // Red Cross on Heliport
    const crossMat = this.assetGen.createToonMaterial(0xef4444);
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 14), crossMat);
    c1.position.set(0, 23.3, 0);
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 3.5), crossMat);
    c2.position.set(0, 23.3, 0);
    hospGroup.add(pad, c1, c2);

    this.scene.add(hospGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(hospX - 20, hospY, hospZ - 15),
      new THREE.Vector3(hospX + 20, hospY + 23, hospZ + 15)
    ));

    // C. OpenSquare Central Bank ("🏦 OPEN BANK")
    const bankX = -135;
    const bankZ = 35;
    const bankY = this.terrain.getElevation(bankX, bankZ);

    const bankGroup = new THREE.Group();
    bankGroup.position.set(bankX, bankY, bankZ);

    const bankGeo = new THREE.BoxGeometry(30, 16, 22);
    const bankMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getBankTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    const bankMesh = new THREE.Mesh(bankGeo, bankMat);
    bankMesh.position.y = 8.0;
    bankMesh.castShadow = true;
    bankMesh.receiveShadow = true;
    bankGroup.add(bankMesh);

    // Classical Gilded Columns along front portico
    const pillarGeo = new THREE.CylinderGeometry(0.85, 0.95, 14, 12);
    const goldPillarMat = this.assetGen.createToonMaterial(0xd97706);
    for (let p = -3; p <= 3; p++) {
      const col = new THREE.Mesh(pillarGeo, goldPillarMat);
      col.position.set(p * 3.8, 7.0, 11.5);
      col.castShadow = true;
      bankGroup.add(col);
    }

    this.scene.add(bankGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(bankX - 16, bankY, bankZ - 12),
      new THREE.Vector3(bankX + 16, bankY + 17, bankZ + 12)
    ));
  }

  // -------------------------------------------------------------
  // 3. Mount Sakura Shinto Shrine & Temple Peak (x: 275, y: 32m, z: -450)
  // -------------------------------------------------------------
  buildShintoTempleAndTorii() {
    const tx = 275;
    const tz = -450;
    const ty = this.terrain.getElevation(tx, tz); // At peak (~32.5m)

    const templeGroup = new THREE.Group();
    templeGroup.position.set(tx, ty, tz);

    const woodMat = this.assetGen.createToonMaterial(0x3f2212);
    const vermilionMat = this.assetGen.createToonMaterial(0xdc2626); // Sacred Japanese red
    const copperMat = this.assetGen.createToonMaterial(0x0f766e);   // Weathered green copper roof
    const stoneMat = this.assetGen.createToonMaterial(0x94a3b8);

    // Stone Terrace Foundation
    const terraceGeo = new THREE.BoxGeometry(42, 2.5, 36);
    const terrace = new THREE.Mesh(terraceGeo, stoneMat);
    terrace.position.y = 1.25;
    terrace.receiveShadow = true;
    templeGroup.add(terrace);

    // Main Shrine Hall (Honden)
    const hallGeo = new THREE.BoxGeometry(28, 10, 20);
    const hallMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getTempleTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    const hall = new THREE.Mesh(hallGeo, hallMat);
    hall.position.y = 7.5;
    hall.castShadow = true;
    templeGroup.add(hall);

    // Curved Traditional Japanese Temple Roof with Swept Eaves (Irimoya-zukuri)
    const roofBaseGeo = new THREE.BoxGeometry(34, 1.8, 26);
    const roofBase = new THREE.Mesh(roofBaseGeo, copperMat);
    roofBase.position.y = 13.0;
    roofBase.castShadow = true;

    const roofRidgeGeo = new THREE.ConeGeometry(18, 7.5, 4);
    roofRidgeGeo.rotateY(Math.PI / 4);
    const roofRidge = new THREE.Mesh(roofRidgeGeo, copperMat);
    roofRidge.position.y = 16.5;
    roofRidge.scale.set(1.1, 1.0, 0.7);
    roofRidge.castShadow = true;
    templeGroup.add(roofBase, roofRidge);

    // Sacred Red Torii Gate (Standing at entrance stairs to mountain peak)
    const makeToriiGate = (gx, gz, angle = 0) => {
      const torii = new THREE.Group();
      torii.position.set(gx, 0, gz);
      torii.rotation.y = angle;

      // Two upright pillars
      const postGeo = new THREE.CylinderGeometry(0.55, 0.65, 12, 12);
      const postL = new THREE.Mesh(postGeo, vermilionMat);
      postL.position.set(-5.5, 6, 0);
      postL.castShadow = true;
      const postR = new THREE.Mesh(postGeo, vermilionMat);
      postR.position.set(5.5, 6, 0);
      postR.castShadow = true;

      // Top curved lintel (Kasagi) with black cap
      const kasagiGeo = new THREE.BoxGeometry(16, 1.1, 1.6);
      const kasagi = new THREE.Mesh(kasagiGeo, vermilionMat);
      kasagi.position.set(0, 12, 0);

      const capGeo = new THREE.BoxGeometry(16.4, 0.35, 1.8);
      const cap = new THREE.Mesh(capGeo, this.assetGen.createToonMaterial(0x18181b));
      cap.position.set(0, 12.6, 0);

      // Lower tie-beam (Nuki)
      const nukiGeo = new THREE.BoxGeometry(13.5, 0.8, 1.1);
      const nuki = new THREE.Mesh(nukiGeo, vermilionMat);
      nuki.position.set(0, 9.8, 0);

      torii.add(postL, postR, kasagi, cap, nuki);
      templeGroup.add(torii);
    };

    makeToriiGate(0, 24, 0);       // Mountain peak Torii
    makeToriiGate(0, 48, 0);       // Approach Torii

    // Traditional Stone Lanterns (Toro) lining the mountain terrace
    const toroGeo = new THREE.BoxGeometry(1.2, 3.2, 1.2);
    [-16, 16].forEach(lx => {
      [10, 24, 38].forEach(lz => {
        const lantern = new THREE.Mesh(toroGeo, stoneMat);
        lantern.position.set(lx, 2.85, lz);
        lantern.castShadow = true;
        templeGroup.add(lantern);
      });
    });

    this.scene.add(templeGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(tx - 22, ty, tz - 18),
      new THREE.Vector3(tx + 22, ty + 24, tz + 20)
    ));
  }

  // -------------------------------------------------------------
  // 4. Shopping & Entertainment: Cafes, Conbini, Ramen & Vending
  // -------------------------------------------------------------
  buildCafesAndShops() {
    // A. "SAKURA CAFE & TEA" with Outdoor Seating & Sun Umbrellas
    const cafeX = -36;
    const cafeZ = -30;
    const cafeY = this.terrain.getElevation(cafeX, cafeZ);

    const cafeGroup = new THREE.Group();
    cafeGroup.position.set(cafeX, cafeY, cafeZ);

    const cafeMesh = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 15), new THREE.MeshToonMaterial({
      map: this.assetGen.getCafeTexture(),
      gradientMap: this.assetGen.toonGradient
    }));
    cafeMesh.position.y = 4.0;
    cafeMesh.castShadow = true;
    cafeGroup.add(cafeMesh);

    // Patio Deck with Tables
    const patio = new THREE.Mesh(new THREE.BoxGeometry(20, 0.35, 14), this.assetGen.createToonMaterial(0xb45309));
    patio.position.set(0, 0.18, 13);
    cafeGroup.add(patio);

    const makeTable = (tx, tz, col) => {
      const tg = new THREE.Group();
      tg.position.set(tx, 0.35, tz);

      const top = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.12, 16), this.assetGen.createToonMaterial(0xffffff));
      top.position.y = 1.4;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8), this.assetGen.createToonMaterial(0xffffff));
      leg.position.y = 0.7;

      const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.0, 12), this.assetGen.createToonMaterial(col));
      canopy.position.y = 3.6;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.8, 8), this.assetGen.createToonMaterial(0x334155));
      pole.position.y = 1.9;

      tg.add(top, leg, canopy, pole);
      cafeGroup.add(tg);
    };

    makeTable(-6, 12, 0xf43f5e);
    makeTable(6, 12, 0x0ea5e9);

    this.scene.add(cafeGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(cafeX - 10, cafeY, cafeZ - 9),
      new THREE.Vector3(cafeX + 10, cafeY + 9, cafeZ + 19)
    ));

    // B. "OpenMart 🏪" Japanese Convenience Store
    const martX = -92;
    const martZ = -30;
    const martY = this.terrain.getElevation(martX, martZ);

    const martGroup = new THREE.Group();
    martGroup.position.set(martX, martY, martZ);

    const martMesh = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 16), new THREE.MeshToonMaterial({
      map: this.assetGen.getConvenienceStoreTexture(),
      gradientMap: this.assetGen.toonGradient
    }));
    martMesh.position.y = 4.0;
    martMesh.castShadow = true;
    martGroup.add(martMesh);
    this.scene.add(martGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(martX - 11, martY, martZ - 9),
      new THREE.Vector3(martX + 11, martY + 9, martZ + 9)
    ));

    // C. "RAMEN ICHIBAN 🍜" Noodle Shop
    const ramenX = -158;
    const ramenZ = -30;
    const ramenY = this.terrain.getElevation(ramenX, ramenZ);

    const ramenGroup = new THREE.Group();
    ramenGroup.position.set(ramenX, ramenY, ramenZ);

    const ramenMesh = new THREE.Mesh(new THREE.BoxGeometry(18, 7.5, 15), new THREE.MeshToonMaterial({
      map: this.assetGen.getRamenShopTexture(),
      gradientMap: this.assetGen.toonGradient
    }));
    ramenMesh.position.y = 3.75;
    ramenMesh.castShadow = true;
    ramenGroup.add(ramenMesh);
    this.scene.add(ramenGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(ramenX - 10, ramenY, ramenZ - 8),
      new THREE.Vector3(ramenX + 10, ramenY + 8, ramenZ + 8)
    ));

    // D. Japanese Drink Vending Machines on corners
    const vendingMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getVendingMachineTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    const vendingGeo = new THREE.BoxGeometry(1.6, 2.8, 1.2);

    const vSpots = [
      { x: -24, z: -20, rot: 0 },
      { x: -80, z: -20, rot: 0 },
      { x: 42, z: 36, rot: Math.PI / 2 },
      { x: 120, z: 65, rot: 0 },
      { x: 260, z: 32.5, rot: 0 } // On mountain terrace
    ];

    vSpots.forEach(v => {
      const vy = this.terrain.getElevation(v.x, v.z);
      const vm = new THREE.Mesh(vendingGeo, vendingMat);
      vm.position.set(v.x, vy + 1.4, v.z);
      vm.rotation.y = v.rot;
      vm.castShadow = true;
      this.scene.add(vm);
    });
  }

  // -------------------------------------------------------------
  // 5. Dense Sakura Suburbs (60+ Varied Japanese Houses & Apartments)
  // -------------------------------------------------------------
  buildDenseSakuraSuburbs() {
    const houseColors = [0xffc6d9, 0xa0e7e5, 0xfff3b0, 0xb8e0d2, 0xe8dff5, 0xfce7f3];
    const roofColors = [0xff598f, 0x0284c7, 0xf97316, 0x059669, 0x7c3aed, 0xe11d48];

    // 7 rows x 9 columns = 63 houses across the south-east residential hills
    const rows = 7;
    const cols = 9;
    const startX = 65;
    const startZ = 65;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * 26;
        const z = startZ + r * 28;
        const y = this.terrain.getElevation(x, z);

        const colorIdx = (r * cols + c) % houseColors.length;
        const isApartment = (r + c) % 4 === 0;
        const isTwoStory = (r + c) % 2 === 0;

        const w = isApartment ? 18.0 : 12.0;
        const d = isApartment ? 14.0 : 13.0;
        const h = isApartment ? 12.5 : (isTwoStory ? 9.5 : 6.5);

        const group = new THREE.Group();
        group.position.set(x, y, z);

        // Walls
        const wallMat = this.assetGen.createToonMaterial(houseColors[colorIdx]);
        const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
        walls.position.y = h / 2;
        walls.castShadow = true;
        walls.receiveShadow = true;
        group.add(walls);

        // Roof
        const roofMat = this.assetGen.createToonMaterial(roofColors[colorIdx]);
        if (isApartment) {
          // Flat roof with parapet & antenna
          const parapet = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.8, d + 0.6), this.assetGen.createToonMaterial(0x475569));
          parapet.position.y = h + 0.4;
          const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.0, 6), this.assetGen.createToonMaterial(0x18181b));
          ant.position.set(w * 0.3, h + 2.0, 0);
          group.add(parapet, ant);
        } else {
          // Traditional Japanese pitched gabled roof
          const roofGeo = new THREE.ConeGeometry(w * 0.84, 5.0, 4);
          roofGeo.rotateY(Math.PI / 4);
          const roof = new THREE.Mesh(roofGeo, roofMat);
          roof.position.y = h + 2.5;
          roof.castShadow = true;

          // Rooftop solar panels
          const solar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.45, 0.15, d * 0.45), this.assetGen.createToonMaterial(0x0284c7));
          solar.position.set(w * 0.18, h + 2.8, -d * 0.1);
          solar.rotation.x = -0.4;
          group.add(roof, solar);
        }

        // Balcony & AC Units
        if (isTwoStory || isApartment) {
          const balc = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.35, 2.2), this.assetGen.createToonMaterial(0xd97706));
          balc.position.set(0, 5.2, d / 2 + 1.1);
          const rail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 1.2, 0.1), this.assetGen.createToonMaterial(0x1e293b));
          rail.position.set(0, 5.8, d / 2 + 2.15);
          group.add(balc, rail);
        }

        // Front Fence & Mailbox
        const fence = new THREE.Mesh(new THREE.BoxGeometry(w + 5, 1.2, 0.2), this.assetGen.createToonMaterial(0xffffff));
        fence.position.set(0, 0.6, d / 2 + 4.2);
        const mailbox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.0), this.assetGen.createToonMaterial(0xef4444));
        mailbox.position.set(w / 2 + 1.4, 1.6, d / 2 + 3.8);
        group.add(fence, mailbox);

        this.scene.add(group);
        this.colliders.push(new THREE.Box3(
          new THREE.Vector3(x - w / 2, y, z - d / 2),
          new THREE.Vector3(x + w / 2, y + h + 5, z + d / 2)
        ));
      }
    }
  }

  // -------------------------------------------------------------
  // 6. Cultural Museum Plaza & Grand Portico
  // -------------------------------------------------------------
  buildMuseumPlaza() {
    const mx = 240;
    const mz = -180;
    const my = this.terrain.getElevation(mx, mz);

    const museumGroup = new THREE.Group();
    museumGroup.position.set(mx, my, mz);

    const marbleMat = this.assetGen.createToonMaterial(0xf8fafc);
    const goldMat = this.assetGen.createToonMaterial(0xf59e0b);
    const domeMat = this.assetGen.createToonMaterial(0x06b6d4);

    // Marble Terrace
    const base = new THREE.Mesh(new THREE.BoxGeometry(68, 3.5, 52), marbleMat);
    base.position.y = 1.75;
    base.receiveShadow = true;
    museumGroup.add(base);

    // Main Hall
    const hall = new THREE.Mesh(new THREE.BoxGeometry(56, 22, 40), marbleMat);
    hall.position.y = 14.5;
    hall.castShadow = true;
    museumGroup.add(hall);

    // 8 Ionic Pillars
    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.4, 20, 16);
    for (let i = 0; i < 8; i++) {
      const col = new THREE.Mesh(pillarGeo, marbleMat);
      col.position.set(-24 + i * 6.8, 13.5, 21.5);
      col.castShadow = true;
      museumGroup.add(col);
    }

    // Triangular Pediment
    const pedGeo = new THREE.CylinderGeometry(26, 26, 2.5, 3);
    pedGeo.rotateX(Math.PI / 2);
    const pediment = new THREE.Mesh(pedGeo, marbleMat);
    pediment.position.set(0, 25.5, 21.5);
    pediment.scale.set(1.3, 0.45, 1);
    museumGroup.add(pediment);

    // Rotunda & Dome
    const rotunda = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 7, 24), marbleMat);
    rotunda.position.y = 29.0;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.y = 32.5;
    museumGroup.add(rotunda, dome);

    // Outdoor Fountain Plaza
    const fountainRing = new THREE.Mesh(new THREE.CylinderGeometry(12, 13, 1.8, 32), marbleMat);
    fountainRing.position.set(0, 0.9, 48);
    const fountainWater = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 11.5, 1.4, 32), this.assetGen.createToonMaterial(0x38bdf8, { transparent: true, opacity: 0.88 }));
    fountainWater.position.set(0, 1.1, 48);
    const statue = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 16), goldMat);
    statue.position.set(0, 4.4, 48);
    museumGroup.add(fountainRing, fountainWater, statue);

    this.scene.add(museumGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(mx - 35, my, mz - 26),
      new THREE.Vector3(mx + 35, my + 46, mz + 26)
    ));
  }

  // -------------------------------------------------------------
  // 7. Central Park & Emerald Lake with Traditional Arched Bridge
  // -------------------------------------------------------------
  buildCentralParkAndLake() {
    const lx = -240;
    const lz = -180;
    const ly = 0.4;

    // Arched Wooden Japanese Red Bridge over Lake (Length: 36m)
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(lx, ly + 1.2, lz);

    const woodMat = this.assetGen.createToonMaterial(0xd97706);
    const redMat = this.assetGen.createToonMaterial(0xef4444);

    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.5, 36), woodMat);
    bridgeDeck.receiveShadow = true;
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.6, 36), redMat);
    railL.position.set(-3.3, 0.9, 0);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.6, 36), redMat);
    railR.position.set(3.3, 0.9, 0);
    bridgeGroup.add(bridgeDeck, railL, railR);
    this.scene.add(bridgeGroup);

    // Pagoda Tea House on Lake Shore
    const pagodaGroup = new THREE.Group();
    pagodaGroup.position.set(lx + 70, 1.0, lz + 40);

    const r1 = new THREE.Mesh(new THREE.ConeGeometry(9.5, 4.5, 6), redMat);
    r1.position.y = 7.5;
    const r2 = new THREE.Mesh(new THREE.ConeGeometry(6.5, 3.5, 6), redMat);
    r2.position.y = 11.5;

    const postGeo = new THREE.CylinderGeometry(0.35, 0.35, 6.5, 8);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(Math.cos(ang) * 6.5, 3.25, Math.sin(ang) * 6.5);
      pagodaGroup.add(post);
    }
    pagodaGroup.add(r1, r2);
    this.scene.add(pagodaGroup);
  }

  // -------------------------------------------------------------
  // 8. Clifftop Maritime Lighthouse on Promontory (x: -440, z: -440)
  // -------------------------------------------------------------
  buildClifftopLighthouse() {
    const lx = -440;
    const lz = -440;
    const ly = this.terrain.getElevation(lx, lz); // At cliff peak (~17.5m)

    const lhGroup = new THREE.Group();
    lhGroup.position.set(lx, ly, lz);

    const whiteMat = this.assetGen.createToonMaterial(0xffffff);
    const redMat = this.assetGen.createToonMaterial(0xdc2626);

    const bands = 7;
    const bH = 5.5;
    for (let b = 0; b < bands; b++) {
      const rBot = 6.8 - b * 0.45;
      const rTop = rBot - 0.45;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, bH, 20), b % 2 === 0 ? whiteMat : redMat);
      band.position.y = b * bH + bH / 2;
      band.castShadow = true;
      lhGroup.add(band);
    }

    const topY = bands * bH;
    const balc = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.8, 20), redMat);
    balc.position.y = topY + 0.4;
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 5.0, 16), this.assetGen.createToonMaterial(0xfef08a, { transparent: true, opacity: 0.9 }));
    lantern.position.y = topY + 3.3;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.8, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), redMat);
    dome.position.y = topY + 5.8;
    lhGroup.add(balc, lantern, dome);

    this.scene.add(lhGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(lx - 8, ly, lz - 8),
      new THREE.Vector3(lx + 8, ly + 50, lz + 8)
    ));
  }

  setupDistrictZones() {
    this.districts = [
      { name: '🌆 Downtown Financial Core', minX: -400, maxX: -40, minZ: -100, maxZ: 200 },
      { name: '🚔 Civic District (Police, Hospital, Bank)', minX: -260, maxX: -40, minZ: 20, maxZ: 180 },
      { name: '☕ Shibuya Commercial Plaza', minX: -180, maxX: 10, minZ: -50, maxZ: 10 },
      { name: '⛰️ Mount Sakura Shinto Peak (35m)', minX: 120, maxX: 450, minZ: -600, maxZ: -280 },
      { name: '🌸 Sakura Old Town Suburbs', minX: 40, maxX: 550, minZ: 40, maxZ: 550 },
      { name: '🏛️ Cultural Museum Plaza', minX: 160, maxX: 360, minZ: -260, maxZ: -100 },
      { name: '🏞️ Emerald Lake & River Basin', minX: -380, maxX: -140, minZ: -280, maxZ: -40 },
      { name: '⛵ Clifftop Lighthouse Promontory', minX: -600, maxX: -320, minZ: -600, maxZ: -320 },
      { name: '🌊 Coastal Beach Promenade', minX: -900, maxX: 900, minZ: -900, maxZ: 900 }
    ];
  }

  getDistrictName(x, z) {
    for (let i = 0; i < this.districts.length; i++) {
      const d = this.districts[i];
      if (x >= d.minX && x <= d.maxX && z >= d.minZ && z <= d.maxZ) {
        return d.name;
      }
    }
    return '🌸 OpenSquare Realm';
  }

  // Strict & Reliable Collision Detection
  checkCollision(pos, radius = 0.8) {
    const box = new THREE.Box3(
      new THREE.Vector3(pos.x - radius, pos.y, pos.z - radius),
      new THREE.Vector3(pos.x + radius, pos.y + 2.2, pos.z + radius)
    );

    for (let i = 0; i < this.colliders.length; i++) {
      if (this.colliders[i].intersectsBox(box)) {
        return true;
      }
    }
    return false;
  }
}
