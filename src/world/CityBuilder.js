import * as THREE from 'three';

export class CityBuilder {
  constructor(scene, assetGen, terrain) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.terrain = terrain;

    this.colliders = [];
    this.districts = [];

    this.init();
  }

  init() {
    this.buildDowntownSkyscrapers();
    this.buildCafesAndShops();
    this.buildSakuraResidentialDistrict();
    this.buildMuseumPlaza();
    this.buildCentralPark();
    this.buildClifftopLighthouse();
    this.setupDistrictZones();
  }

  // -------------------------------------------------------------
  // 1. Downtown High-Rise Skyline (Varied Skyscrapers & Skybridges)
  // -------------------------------------------------------------
  buildDowntownSkyscrapers() {
    const towers = [
      // Block A (Around x: -60, z: -60)
      { x: -60, z: -60, w: 26, d: 26, h: 85, pal: 0, roof: 'spire' },
      { x: -60, z: -35, w: 20, d: 18, h: 55, pal: 1, roof: 'stepped' },
      { x: -35, z: -60, w: 18, d: 22, h: 62, pal: 2, roof: 'helipad' },
      // Block B (Around x: -125, z: -60)
      { x: -125, z: -60, w: 28, d: 26, h: 95, pal: 3, roof: 'helipad' },
      { x: -125, z: -35, w: 22, d: 20, h: 68, pal: 0, roof: 'stepped' },
      { x: -95, z: -60, w: 20, d: 22, h: 58, pal: 1, roof: 'flat' },
      // Block C (Around x: -60, z: -125)
      { x: -60, z: -125, w: 24, d: 24, h: 72, pal: 2, roof: 'spire' },
      { x: -60, z: -95, w: 18, d: 18, h: 48, pal: 3, roof: 'flat' },
      { x: -35, z: -125, w: 20, d: 24, h: 64, pal: 0, roof: 'stepped' },
      // Block D (Around x: -125, z: -125)
      { x: -125, z: -125, w: 30, d: 30, h: 110, pal: 1, roof: 'spire' }, // Tallest central landmark
      { x: -125, z: -95, w: 22, d: 22, h: 60, pal: 2, roof: 'helipad' },
      { x: -95, z: -125, w: 20, d: 20, h: 52, pal: 3, roof: 'flat' },
      // Outer West Commercial Row
      { x: -210, z: -50, w: 26, d: 28, h: 75, pal: 0, roof: 'helipad' },
      { x: -210, z: -95, w: 24, d: 24, h: 65, pal: 1, roof: 'stepped' },
      { x: -210, z: -140, w: 28, d: 26, h: 80, pal: 2, roof: 'spire' }
    ];

    towers.forEach(cfg => {
      const y = this.terrain.getElevation(cfg.x, cfg.z);
      const group = new THREE.Group();
      group.position.set(cfg.x, y, cfg.z);

      // Main tower body
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

      // Roof details
      if (cfg.roof === 'spire') {
        const spireGeo = new THREE.ConeGeometry(cfg.w * 0.35, 18, 8);
        const spireMat = this.assetGen.createToonMaterial(0x38bdf8);
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.y = cfg.h + 9;
        spire.castShadow = true;

        // Needle antenna
        const needleGeo = new THREE.CylinderGeometry(0.2, 0.45, 14, 6);
        const needleMat = this.assetGen.createToonMaterial(0xff0055);
        const needle = new THREE.Mesh(needleGeo, needleMat);
        needle.position.y = cfg.h + 23;
        group.add(spire, needle);
      } else if (cfg.roof === 'helipad') {
        const padGeo = new THREE.CylinderGeometry(cfg.w * 0.42, cfg.w * 0.42, 1.4, 24);
        const padMat = this.assetGen.createToonMaterial(0xfbbf24);
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.y = cfg.h + 0.7;

        // "H" letter marking on helipad
        const hMat = this.assetGen.createToonMaterial(0xffffff);
        const bar1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 8), hMat);
        bar1.position.set(-2.5, cfg.h + 1.45, 0);
        const bar2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 8), hMat);
        bar2.position.set(2.5, cfg.h + 1.45, 0);
        const cross = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.2, 1.2), hMat);
        cross.position.set(0, cfg.h + 1.45, 0);
        group.add(pad, bar1, bar2, cross);
      } else if (cfg.roof === 'stepped') {
        const stepGeo = new THREE.BoxGeometry(cfg.w * 0.68, 10, cfg.d * 0.68);
        const stepMat = this.assetGen.createToonMaterial(0x64748b);
        const step = new THREE.Mesh(stepGeo, stepMat);
        step.position.y = cfg.h + 5;
        group.add(step);
      }

      this.scene.add(group);

      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(cfg.x - cfg.w / 2, y, cfg.z - cfg.d / 2),
        new THREE.Vector3(cfg.x + cfg.w / 2, y + cfg.h, cfg.z + cfg.d / 2)
      ));
    });

    // Overhead Skybridge connecting two skyscrapers
    const bridgeGeo = new THREE.BoxGeometry(12, 5.5, 30);
    const glassMat = this.assetGen.createToonMaterial(0xa5f3fc, { transparent: true, opacity: 0.8 });
    const skybridge = new THREE.Mesh(bridgeGeo, glassMat);
    skybridge.position.set(-60, 42, -92);
    skybridge.castShadow = true;
    this.scene.add(skybridge);
  }

  // -------------------------------------------------------------
  // 2. Corner Cafes, Convenience Stores, Ramen Shops & Vending
  // -------------------------------------------------------------
  buildCafesAndShops() {
    // A. "SAKURA CAFE" with Outdoor Patio & Dining Tables
    const cafeX = -32;
    const cafeZ = -22;
    const cafeY = this.terrain.getElevation(cafeX, cafeZ);

    const cafeGroup = new THREE.Group();
    cafeGroup.position.set(cafeX, cafeY, cafeZ);

    // Cafe Building
    const cafeGeo = new THREE.BoxGeometry(16, 7.5, 14);
    const cafeMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getCafeTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    const cafeMesh = new THREE.Mesh(cafeGeo, cafeMat);
    cafeMesh.position.y = 3.75;
    cafeMesh.castShadow = true;
    cafeGroup.add(cafeMesh);

    // Outdoor Wooden Patio Deck
    const patioGeo = new THREE.BoxGeometry(18, 0.35, 12);
    const woodMat = this.assetGen.createToonMaterial(0xb45309);
    const patio = new THREE.Mesh(patioGeo, woodMat);
    patio.position.set(0, 0.18, 12);
    cafeGroup.add(patio);

    // Outdoor Cafe Tables & Sun Umbrellas
    const makeCafeTable = (tx, tz, umbrellaColor) => {
      const tableGroup = new THREE.Group();
      tableGroup.position.set(tx, 0.35, tz);

      // Table stand & top
      const standGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8);
      const topGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.12, 16);
      const tableMat = this.assetGen.createToonMaterial(0xffffff);
      const stand = new THREE.Mesh(standGeo, tableMat);
      stand.position.y = 0.7;
      const top = new THREE.Mesh(topGeo, tableMat);
      top.position.y = 1.4;
      tableGroup.add(stand, top);

      // Colorful Canvas Sun Umbrella
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.8, 8);
      const canopyGeo = new THREE.ConeGeometry(2.4, 0.9, 12);
      const umbMat = this.assetGen.createToonMaterial(umbrellaColor);
      const pole = new THREE.Mesh(poleGeo, this.assetGen.createToonMaterial(0x334155));
      pole.position.y = 1.9;
      const canopy = new THREE.Mesh(canopyGeo, umbMat);
      canopy.position.y = 3.6;
      tableGroup.add(pole, canopy);

      // Cute Chairs
      const chairMat = this.assetGen.createToonMaterial(0x92400e);
      [-1.1, 1.1].forEach(cx => {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), chairMat);
        seat.position.set(cx, 0.8, 0);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.1), chairMat);
        back.position.set(cx, 1.2, cx > 0 ? 0.35 : -0.35);
        tableGroup.add(seat, back);
      });

      cafeGroup.add(tableGroup);
    };

    makeCafeTable(-5, 11, 0xf43f5e); // Sakura pink umbrella
    makeCafeTable(5, 11, 0x0ea5e9);  // Sky blue umbrella

    this.scene.add(cafeGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(cafeX - 9, cafeY, cafeZ - 8),
      new THREE.Vector3(cafeX + 9, cafeY + 8, cafeZ + 18)
    ));

    // B. "OpenMart 🏪" 24H Japanese Convenience Store
    const martX = -92;
    const martZ = -22;
    const martY = this.terrain.getElevation(martX, martZ);

    const martGroup = new THREE.Group();
    martGroup.position.set(martX, martY, martZ);

    const martGeo = new THREE.BoxGeometry(18, 7.5, 15);
    const martMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getConvenienceStoreTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    const martMesh = new THREE.Mesh(martGeo, martMat);
    martMesh.position.y = 3.75;
    martMesh.castShadow = true;
    martGroup.add(martMesh);
    this.scene.add(martGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(martX - 10, martY, martZ - 8),
      new THREE.Vector3(martX + 10, martY + 8, martZ + 8)
    ));

    // C. "RAMEN ICHIBAN 🍜" Noodle Shop
    const ramenX = -158;
    const ramenZ = -22;
    const ramenY = this.terrain.getElevation(ramenX, ramenZ);

    const ramenGroup = new THREE.Group();
    ramenGroup.position.set(ramenX, ramenY, ramenZ);

    const ramenGeo = new THREE.BoxGeometry(16, 7.0, 14);
    const ramenMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getRamenShopTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    const ramenMesh = new THREE.Mesh(ramenGeo, ramenMat);
    ramenMesh.position.y = 3.5;
    ramenMesh.castShadow = true;
    ramenGroup.add(ramenMesh);
    this.scene.add(ramenGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(ramenX - 9, ramenY, ramenZ - 8),
      new THREE.Vector3(ramenX + 9, ramenY + 8, ramenZ + 8)
    ));

    // D. Japanese Beverage Vending Machines on street corners
    const vendingMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getVendingMachineTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    const vendingGeo = new THREE.BoxGeometry(1.6, 2.8, 1.2);

    const vendingSpots = [
      { x: -22, z: -16, rot: 0 },
      { x: -82, z: -16, rot: 0 },
      { x: 38, z: 32, rot: Math.PI / 2 },
      { x: 110, z: 55, rot: 0 }
    ];

    vendingSpots.forEach(v => {
      const vY = this.terrain.getElevation(v.x, v.z);
      const vm = new THREE.Mesh(vendingGeo, vendingMat);
      vm.position.set(v.x, vY + 1.4, v.z);
      vm.rotation.y = v.rot;
      vm.castShadow = true;
      this.scene.add(vm);
    });
  }

  // -------------------------------------------------------------
  // 3. Dense Sakura Residential District (40+ Detailed Houses & Gardens)
  // -------------------------------------------------------------
  buildSakuraResidentialDistrict() {
    const houseColors = [0xffc6d9, 0xa0e7e5, 0xfff3b0, 0xb8e0d2, 0xe8dff5, 0xfce7f3];
    const roofColors = [0xff598f, 0x0284c7, 0xf97316, 0x059669, 0x7c3aed, 0xe11d48];

    // Dense grid & cul-de-sac layout along the residential road
    const houseRows = 5;
    const houseCols = 7;
    const startX = 45;
    const startZ = 45;

    for (let r = 0; r < houseRows; r++) {
      for (let c = 0; c < houseCols; c++) {
        const x = startX + c * 24;
        const z = startZ + r * 26;
        const y = this.terrain.getElevation(x, z);

        const colorIdx = (r * houseCols + c) % houseColors.length;
        const isTwoStory = (r + c) % 2 === 0;

        const w = 11.5;
        const d = 12.5;
        const h = isTwoStory ? 9.5 : 6.5;

        const houseGroup = new THREE.Group();
        houseGroup.position.set(x, y, z);

        // Ground Floor Walls
        const wallMat = this.assetGen.createToonMaterial(houseColors[colorIdx]);
        const wallGeo = new THREE.BoxGeometry(w, h, d);
        const walls = new THREE.Mesh(wallGeo, wallMat);
        walls.position.y = h / 2;
        walls.castShadow = true;
        walls.receiveShadow = true;
        houseGroup.add(walls);

        // Pitched Anime Tile Roof with Overhangs
        const roofMat = this.assetGen.createToonMaterial(roofColors[colorIdx]);
        const roofGeo = new THREE.ConeGeometry(w * 0.82, 4.8, 4);
        roofGeo.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = h + 2.4;
        roof.castShadow = true;
        houseGroup.add(roof);

        // Front Porch Door & Stone Steps
        const doorGeo = new THREE.BoxGeometry(2.0, 3.4, 0.4);
        const doorMat = this.assetGen.createToonMaterial(0x854d0e);
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 1.7, d / 2 + 0.1);
        houseGroup.add(door);

        // Second-story Balcony (for 2-story houses)
        if (isTwoStory) {
          const balconyGeo = new THREE.BoxGeometry(w * 0.65, 0.35, 2.2);
          const woodMat = this.assetGen.createToonMaterial(0xd97706);
          const balcony = new THREE.Mesh(balconyGeo, woodMat);
          balcony.position.set(0, 5.2, d / 2 + 1.1);

          const railGeo = new THREE.BoxGeometry(w * 0.65, 1.2, 0.1);
          const railMat = this.assetGen.createToonMaterial(0x1e293b);
          const rail = new THREE.Mesh(railGeo, railMat);
          rail.position.set(0, 5.8, d / 2 + 2.15);
          houseGroup.add(balcony, rail);
        }

        // AC Compressor Unit on exterior wall (iconic Japanese anime detail)
        const acGeo = new THREE.BoxGeometry(1.4, 1.0, 0.6);
        const acMat = this.assetGen.createToonMaterial(0xe2e8f0);
        const ac = new THREE.Mesh(acGeo, acMat);
        ac.position.set(w / 2 + 0.3, 1.2, d * 0.2);
        houseGroup.add(ac);

        // Rooftop Solar Panel array
        const solarGeo = new THREE.BoxGeometry(w * 0.45, 0.15, d * 0.45);
        const solarMat = this.assetGen.createToonMaterial(0x0284c7);
        const solar = new THREE.Mesh(solarGeo, solarMat);
        solar.position.set(w * 0.18, h + 2.8, -d * 0.1);
        solar.rotation.x = -0.4;
        houseGroup.add(solar);

        // Garden Fence & Mailbox
        const fenceGeo = new THREE.BoxGeometry(w + 5, 1.2, 0.2);
        const fenceMat = this.assetGen.createToonMaterial(0xffffff);
        const fenceFront = new THREE.Mesh(fenceGeo, fenceMat);
        fenceFront.position.set(0, 0.6, d / 2 + 4.2);

        const mailboxGeo = new THREE.BoxGeometry(0.8, 0.6, 1.0);
        const mailbox = new THREE.Mesh(mailboxGeo, this.assetGen.createToonMaterial(0xef4444));
        mailbox.position.set(w / 2 + 1.4, 1.6, d / 2 + 3.8);
        houseGroup.add(fenceFront, mailbox);

        this.scene.add(houseGroup);

        this.colliders.push(new THREE.Box3(
          new THREE.Vector3(x - w / 2, y, z - d / 2),
          new THREE.Vector3(x + w / 2, y + h + 5, z + d / 2)
        ));
      }
    }
  }

  // -------------------------------------------------------------
  // 4. Cultural Museum Plaza (Classical Dome, Pillars, Fountains)
  // -------------------------------------------------------------
  buildMuseumPlaza() {
    const mx = 210;
    const mz = -190;
    const my = this.terrain.getElevation(mx, mz);

    const museumGroup = new THREE.Group();
    museumGroup.position.set(mx, my, mz);

    const marbleMat = this.assetGen.createToonMaterial(0xf8fafc);
    const goldMat = this.assetGen.createToonMaterial(0xf59e0b);
    const domeMat = this.assetGen.createToonMaterial(0x06b6d4);

    // Grand Stepped Terrace
    const baseGeo = new THREE.BoxGeometry(64, 3.5, 48);
    const base = new THREE.Mesh(baseGeo, marbleMat);
    base.position.y = 1.75;
    base.receiveShadow = true;
    museumGroup.add(base);

    // Main Museum Hall
    const hallGeo = new THREE.BoxGeometry(52, 20, 36);
    const hall = new THREE.Mesh(hallGeo, marbleMat);
    hall.position.y = 13.5;
    hall.castShadow = true;
    hall.receiveShadow = true;
    museumGroup.add(hall);

    // Classical Columns (8 frontal pillars)
    const pillarGeo = new THREE.CylinderGeometry(1.1, 1.3, 18, 14);
    for (let i = 0; i < 8; i++) {
      const px = -22 + i * 6.3;
      const col = new THREE.Mesh(pillarGeo, marbleMat);
      col.position.set(px, 12.5, 19.5);
      col.castShadow = true;
      museumGroup.add(col);
    }

    // Triangular Pediment over Portico
    const pedGeo = new THREE.CylinderGeometry(24, 24, 2.5, 3);
    pedGeo.rotateX(Math.PI / 2);
    const pediment = new THREE.Mesh(pedGeo, marbleMat);
    pediment.position.set(0, 23.5, 19.5);
    pediment.scale.set(1.3, 0.45, 1);
    pediment.castShadow = true;
    museumGroup.add(pediment);

    // Central Rotunda & Turquoise Dome
    const rotundaGeo = new THREE.CylinderGeometry(13, 13, 6, 24);
    const rotunda = new THREE.Mesh(rotundaGeo, marbleMat);
    rotunda.position.y = 26.5;

    const domeGeo = new THREE.SphereGeometry(13, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 29.5;
    dome.castShadow = true;
    museumGroup.add(rotunda, dome);

    // Museum Plaza Large Tiered Fountain
    const fountainRingGeo = new THREE.CylinderGeometry(11, 12, 1.8, 32);
    const fountainRing = new THREE.Mesh(fountainRingGeo, marbleMat);
    fountainRing.position.set(0, 0.9, 44);

    const fountainWaterGeo = new THREE.CylinderGeometry(10.5, 10.5, 1.4, 32);
    const fountainWater = new THREE.Mesh(fountainWaterGeo, this.assetGen.createToonMaterial(0x38bdf8, { transparent: true, opacity: 0.88 }));
    fountainWater.position.set(0, 1.1, 44);

    const statue = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 16), goldMat);
    statue.position.set(0, 4.2, 44);
    museumGroup.add(fountainRing, fountainWater, statue);

    this.scene.add(museumGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(mx - 32, my, mz - 24),
      new THREE.Vector3(mx + 32, my + 44, mz + 24)
    ));
  }

  // -------------------------------------------------------------
  // 5. Verdant Central Park & Lake with Arched Wooden Bridge
  // -------------------------------------------------------------
  buildCentralPark() {
    const px = -210;
    const pz = -210;
    const py = this.terrain.getElevation(px, pz);

    const parkGroup = new THREE.Group();
    parkGroup.position.set(px, py, pz);

    // Scenic Park Lake Water
    const lakeGeo = new THREE.CircleGeometry(48, 48);
    lakeGeo.rotateX(-Math.PI / 2);
    const lakeMat = this.assetGen.createToonMaterial(0x0284c7, { transparent: true, opacity: 0.9 });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.position.y = 0.25;
    parkGroup.add(lake);

    // Stone Rim around Lake
    const rimGeo = new THREE.RingGeometry(47, 51, 48);
    rimGeo.rotateX(-Math.PI / 2);
    const rimMat = this.assetGen.createToonMaterial(0x64748b);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.32;
    parkGroup.add(rim);

    // Arched Traditional Japanese Red Bridge across Lake
    const bridgeGeo = new THREE.BoxGeometry(8, 0.6, 38);
    const woodMat = this.assetGen.createToonMaterial(0xd97706);
    const redMat = this.assetGen.createToonMaterial(0xef4444);

    const bridge = new THREE.Mesh(bridgeGeo, woodMat);
    bridge.position.set(0, 2.4, 0);

    const railGeo = new THREE.BoxGeometry(0.35, 1.6, 38);
    const railL = new THREE.Mesh(railGeo, redMat);
    railL.position.set(-3.8, 3.2, 0);
    const railR = new THREE.Mesh(railGeo, redMat);
    railR.position.set(3.8, 3.2, 0);
    parkGroup.add(bridge, railL, railR);

    // Japanese Tea House / Pagoda Gazebo
    const gzX = 48;
    const gzZ = 25;
    const pagRoof1 = new THREE.Mesh(new THREE.ConeGeometry(9, 4.5, 6), redMat);
    pagRoof1.position.set(gzX, 7.5, gzZ);
    const pagRoof2 = new THREE.Mesh(new THREE.ConeGeometry(6, 3.5, 6), redMat);
    pagRoof2.position.set(gzX, 11.5, gzZ);

    const postGeo = new THREE.CylinderGeometry(0.35, 0.35, 6.5, 8);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(gzX + Math.cos(ang) * 6.5, 3.25, gzZ + Math.sin(ang) * 6.5);
      parkGroup.add(post);
    }
    parkGroup.add(pagRoof1, pagRoof2);

    this.scene.add(parkGroup);
  }

  // -------------------------------------------------------------
  // 6. Maritime Clifftop Lighthouse (Perched on North-East Cliff)
  // -------------------------------------------------------------
  buildClifftopLighthouse() {
    const lx = 330;
    const lz = -330;
    const ly = this.terrain.getElevation(lx, lz); // Perched at peak (~19m)

    const lhGroup = new THREE.Group();
    lhGroup.position.set(lx, ly, lz);

    const whiteMat = this.assetGen.createToonMaterial(0xffffff);
    const redMat = this.assetGen.createToonMaterial(0xdc2626);

    // Tapered Lighthouse Tower
    const bands = 7;
    const bHeight = 5.5;
    for (let b = 0; b < bands; b++) {
      const rBot = 6.8 - b * 0.45;
      const rTop = rBot - 0.45;
      const geo = new THREE.CylinderGeometry(rTop, rBot, bHeight, 20);
      const mat = b % 2 === 0 ? whiteMat : redMat;
      const band = new THREE.Mesh(geo, mat);
      band.position.y = b * bHeight + bHeight / 2;
      band.castShadow = true;
      lhGroup.add(band);
    }

    const towerTopY = bands * bHeight;

    // Observation Balcony Railing
    const balcGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.8, 20);
    const balc = new THREE.Mesh(balcGeo, redMat);
    balc.position.y = towerTopY + 0.4;

    // Glowing Lantern Room
    const lanternGeo = new THREE.CylinderGeometry(3.6, 3.6, 5.0, 16);
    const lanternMat = this.assetGen.createToonMaterial(0xfef08a, { transparent: true, opacity: 0.9 });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.y = towerTopY + 3.3;

    // Dome Cap
    const domeGeo = new THREE.SphereGeometry(3.8, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, redMat);
    dome.position.y = towerTopY + 5.8;
    lhGroup.add(balc, lantern, dome);

    this.scene.add(lhGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(lx - 8, ly, lz - 8),
      new THREE.Vector3(lx + 8, ly + 50, lz + 8)
    ));
  }

  setupDistrictZones() {
    this.districts = [
      { name: '🌆 Downtown Skyline Hub', minX: -260, maxX: 20, minZ: -260, maxZ: 20 },
      { name: '☕ Shibuya Commercial Plaza', minX: -180, maxX: 10, minZ: -40, maxZ: 10 },
      { name: '🌸 Sakura Residential District', minX: 30, maxX: 300, minZ: 30, maxZ: 300 },
      { name: '🏛️ Cultural Museum Plaza', minX: 140, maxX: 340, minZ: -280, maxZ: -100 },
      { name: '🌳 Verdant Central Park', minX: -320, maxX: -80, minZ: -320, maxZ: -80 },
      { name: '⛵ Clifftop Lighthouse Peak', minX: 250, maxX: 460, minZ: -460, maxZ: -240 },
      { name: '🌊 Coastal Beach Promenade', minX: -550, maxX: 550, minZ: -550, maxZ: 550 }
    ];
  }

  getDistrictName(x, z) {
    for (let i = 0; i < this.districts.length; i++) {
      const d = this.districts[i];
      if (x >= d.minX && x <= d.maxX && z >= d.minZ && z <= d.maxZ) {
        return d.name;
      }
    }
    return '🌸 OpenSquare Island';
  }

  checkCollision(pos, radius = 0.8) {
    const box = new THREE.Box3(
      new THREE.Vector3(pos.x - radius, pos.y, pos.z - radius),
      new THREE.Vector3(pos.x + radius, pos.y + 2.0, pos.z + radius)
    );

    for (let i = 0; i < this.colliders.length; i++) {
      if (this.colliders[i].intersectsBox(box)) {
        return true;
      }
    }
    return false;
  }
}
