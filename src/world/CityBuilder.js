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
    this.defineDistricts();
    this.buildDowntownSkyscrapers();
    this.buildCivicCenter();
    this.buildShibuyaCommercialDistrict();
    this.buildSakuraResidentialSuburb();
    this.buildMountSakuraVillageAndShrine();
    this.buildLighthouseStation();
    this.buildEmeraldLakeAmenities();
  }

  defineDistricts() {
    this.districts = [
      { name: '🌆 Downtown Financial Core', minX: -260, maxX: 120, minZ: -380, maxZ: 80 },
      { name: '🏛️ Civic Center & Services', minX: -180, maxX: 120, minZ: -120, maxZ: 60 },
      { name: '🛍️ Shibuya Commercial Plaza', minX: 120, maxX: 500, minZ: -350, maxZ: 140 },
      { name: '🌸 Sakura Residential Town', minX: -140, maxX: 600, minZ: 140, maxZ: 800 },
      { name: '⛩️ Mount Sakura Sanctuary', minX: 380, maxX: 900, minZ: -750, maxZ: -200 },
      { name: '🌲 Knitted Pine Forest & Cape', minX: -1200, maxX: -480, minZ: -900, maxZ: -100 },
      { name: '🌊 Emerald Lake & Marina', minX: -500, maxX: -220, minZ: -80, maxZ: 160 },
      { name: '⛵ Lighthouse Coastal Promontory', minX: -1100, maxX: -800, minZ: -900, maxZ: -600 }
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

  // -------------------------------------------------------------
  // 1. Downtown Financial Metropolis (30+ High-Rise Towers)
  // -------------------------------------------------------------
  buildDowntownSkyscrapers() {
    const texKeys = ['glass', 'commercial', 'luxury'];

    // Dense grid of towers in Downtown blocks
    const towerCoords = [];
    for (let bx = -220; bx <= 80; bx += 55) {
      for (let bz = -340; bz <= 0; bz += 60) {
        // Keep North-South avenue, East-West boulevard, and central plaza completely clear
        if (Math.abs(bx) < 24 || Math.abs(bz - 40) < 24 || Math.hypot(bx, bz - 40) < 45) continue;
        towerCoords.push({
          x: bx + (Math.sin(bz) * 6),
          z: bz + (Math.cos(bx) * 6),
          width: 32 + (Math.abs(bx * bz) % 18),
          depth: 32 + (Math.abs(bx + bz) % 18),
          height: 48 + (Math.abs(bx * 13 + bz * 7) % 85),
          tex: texKeys[Math.abs(bx + bz) % texKeys.length]
        });
      }
    }

    towerCoords.forEach(t => {
      const y = this.terrain.getElevation(t.x, t.z);
      const group = new THREE.Group();
      group.position.set(t.x, y, t.z);

      // Main tower body
      const bodyGeo = new THREE.BoxGeometry(t.width, t.height, t.depth);
      const tex = this.assetGen.getSkyscraperTexture(t.tex);
      const bodyMat = new THREE.MeshToonMaterial({
        map: tex,
        gradientMap: this.assetGen.toonGradient
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = t.height / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Rooftop service room / helipad
      if (t.height > 70) {
        const roofGeo = new THREE.BoxGeometry(t.width * 0.5, 5, t.depth * 0.5);
        const roofMat = this.assetGen.createToonMaterial(0x334155);
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = t.height + 2.5;
        group.add(roof);

        // Antenna needle spire
        const spireGeo = new THREE.CylinderGeometry(0.2, 0.4, 18, 6);
        const spireMat = this.assetGen.createToonMaterial(0xe2e8f0);
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.y = t.height + 14;
        group.add(spire);
      }

      this.scene.add(group);

      // Collider
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(t.x - t.width / 2 - 0.5, y, t.z - t.depth / 2 - 0.5),
        new THREE.Vector3(t.x + t.width / 2 + 0.5, y + t.height + 5, t.z + t.depth / 2 + 0.5)
      ));
    });

    // Glass Skybridges connecting adjacent skyscrapers
    const bridgeGeo = new THREE.BoxGeometry(10, 5, 30);
    const bridgeMat = this.assetGen.createToonMaterial(0x0284c7, { transparent: true, opacity: 0.85 });
    const skybridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    skybridge.position.set(-110, 52, -160);
    skybridge.castShadow = true;
    this.scene.add(skybridge);
  }

  // -------------------------------------------------------------
  // 2. Civic Center & Emergency Services Plaza
  // -------------------------------------------------------------
  buildCivicCenter() {
    // A. Metropolitan Police Station (KOBAN)
    const polX = -80, polZ = -40;
    const polY = this.terrain.getElevation(polX, polZ);
    const polGroup = new THREE.Group();
    polGroup.position.set(polX, polY, polZ);

    const polBody = new THREE.Mesh(
      new THREE.BoxGeometry(28, 14, 22),
      new THREE.MeshToonMaterial({ map: this.assetGen.getPoliceTexture(), gradientMap: this.assetGen.toonGradient })
    );
    polBody.position.y = 7.0;
    polBody.castShadow = true;
    polGroup.add(polBody);

    // Police Red Emergency Beacon
    const sirenGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 12);
    const sirenMat = this.assetGen.createToonMaterial(0xef4444);
    const siren = new THREE.Mesh(sirenGeo, sirenMat);
    siren.position.set(0, 14.5, 9);
    polGroup.add(siren);

    // Communications Antenna Mast
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.35, 16, 6),
      this.assetGen.createToonMaterial(0x94a3b8)
    );
    mast.position.set(11, 22, -8);
    polGroup.add(mast);

    this.scene.add(polGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(polX - 15, polY, polZ - 12),
      new THREE.Vector3(polX + 15, polY + 16, polZ + 12)
    ));

    // B. Central Emergency Hospital (+ HOSPITAL)
    const hospX = -150, hospZ = -80;
    const hospY = this.terrain.getElevation(hospX, hospZ);
    const hospGroup = new THREE.Group();
    hospGroup.position.set(hospX, hospY, hospZ);

    const hospBody = new THREE.Mesh(
      new THREE.BoxGeometry(42, 24, 30),
      new THREE.MeshToonMaterial({ map: this.assetGen.getHospitalTexture(), gradientMap: this.assetGen.toonGradient })
    );
    hospBody.position.y = 12.0;
    hospBody.castShadow = true;
    hospGroup.add(hospBody);

    // Rooftop Helipad
    const heliGeo = new THREE.CylinderGeometry(8.5, 8.5, 0.8, 24);
    const heliMat = this.assetGen.createToonMaterial(0x334155);
    const helipad = new THREE.Mesh(heliGeo, heliMat);
    helipad.position.set(0, 24.5, 0);
    hospGroup.add(helipad);

    this.scene.add(hospGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(hospX - 22, hospY, hospZ - 16),
      new THREE.Vector3(hospX + 22, hospY + 26, hospZ + 16)
    ));

    // C. OpenSquare Central Bank (OPEN BANK)
    const bankX = -80, bankZ = -120;
    const bankY = this.terrain.getElevation(bankX, bankZ);
    const bankGroup = new THREE.Group();
    bankGroup.position.set(bankX, bankY, bankZ);

    const bankBody = new THREE.Mesh(
      new THREE.BoxGeometry(34, 18, 24),
      new THREE.MeshToonMaterial({ map: this.assetGen.getBankTexture(), gradientMap: this.assetGen.toonGradient })
    );
    bankBody.position.y = 9.0;
    bankBody.castShadow = true;
    bankGroup.add(bankBody);

    // Gilded Classical Columns
    const colGeo = new THREE.CylinderGeometry(0.9, 1.0, 16, 12);
    const colMat = this.assetGen.createToonMaterial(0xd97706);
    for (let c = -3; c <= 3; c++) {
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(c * 4.2, 8.0, 12.8);
      col.castShadow = true;
      bankGroup.add(col);
    }

    this.scene.add(bankGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(bankX - 18, bankY, bankZ - 14),
      new THREE.Vector3(bankX + 18, bankY + 20, bankZ + 14)
    ));
  }

  // -------------------------------------------------------------
  // 3. Shibuya Commercial & Entertainment District (40+ Buildings)
  // -------------------------------------------------------------
  buildShibuyaCommercialDistrict() {
    const cafeMat = new THREE.MeshToonMaterial({ map: this.assetGen.getCafeTexture(), gradientMap: this.assetGen.toonGradient });
    const martMat = new THREE.MeshToonMaterial({ map: this.assetGen.getMartTexture(), gradientMap: this.assetGen.toonGradient });
    const ramenMat = new THREE.MeshToonMaterial({ map: this.assetGen.getRamenTexture(), gradientMap: this.assetGen.toonGradient });
    const billboardMat = new THREE.MeshToonMaterial({ map: this.assetGen.getBillboardTexture(), gradientMap: this.assetGen.toonGradient });

    // Grid of commercial stores along avenues
    const shopCoords = [];
    for (let sx = 140; sx <= 460; sx += 60) {
      for (let sz = -320; sz <= 80; sz += 55) {
        if (Math.abs(sz - 40) < 22) continue; // Keep avenue clear
        shopCoords.push({
          x: sx,
          z: sz,
          width: 26 + (Math.abs(sx + sz) % 12),
          depth: 26 + (Math.abs(sx * sz) % 12),
          height: 12 + (Math.abs(sx * 7 + sz * 11) % 24),
          type: (Math.abs(sx + sz) % 4)
        });
      }
    }

    shopCoords.forEach(s => {
      const y = this.terrain.getElevation(s.x, s.z);
      const group = new THREE.Group();
      group.position.set(s.x, y, s.z);

      let mat = cafeMat;
      if (s.type === 1) mat = martMat;
      else if (s.type === 2) mat = ramenMat;
      else if (s.type === 3) mat = billboardMat;

      const body = new THREE.Mesh(new THREE.BoxGeometry(s.width, s.height, s.depth), mat);
      body.position.y = s.height / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Outdoor Cafe Parasols & Dining Chairs
      if (s.type === 0) {
        const umbrellaGeo = new THREE.ConeGeometry(2.4, 0.8, 8);
        const umbrellaMat = this.assetGen.createToonMaterial(0xef4444);
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 6);
        const poleMat = this.assetGen.createToonMaterial(0x94a3b8);

        [-5, 5].forEach(dx => {
          const uPole = new THREE.Mesh(poleGeo, poleMat);
          uPole.position.set(dx, 1.4, s.depth / 2 + 4.5);
          const uTop = new THREE.Mesh(umbrellaGeo, umbrellaMat);
          uTop.position.set(dx, 2.7, s.depth / 2 + 4.5);
          group.add(uPole, uTop);
        });
      }

      this.scene.add(group);
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(s.x - s.width / 2 - 0.5, y, s.z - s.depth / 2 - 0.5),
        new THREE.Vector3(s.x + s.width / 2 + 0.5, y + s.height + 2, s.z + s.depth / 2 + 0.5)
      ));
    });
  }

  // -------------------------------------------------------------
  // 4. Dense Sakura Residential Suburb (Over 100 Japanese Houses)
  // -------------------------------------------------------------
  buildSakuraResidentialSuburb() {
    const wallMat = new THREE.MeshToonMaterial({ map: this.assetGen.getHouseWallTexture(), gradientMap: this.assetGen.toonGradient });
    const roofMats = [
      new THREE.MeshToonMaterial({ map: this.assetGen.getTileRoofTexture(0xff7eb3), gradientMap: this.assetGen.toonGradient }), // Sakura Pink
      new THREE.MeshToonMaterial({ map: this.assetGen.getTileRoofTexture(0x38bdf8), gradientMap: this.assetGen.toonGradient }), // Sky Blue
      new THREE.MeshToonMaterial({ map: this.assetGen.getTileRoofTexture(0xf97316), gradientMap: this.assetGen.toonGradient }), // Terracotta
      new THREE.MeshToonMaterial({ map: this.assetGen.getTileRoofTexture(0x334155), gradientMap: this.assetGen.toonGradient })  // Charcoal
    ];

    const fenceMat = this.assetGen.createToonMaterial(0xf8fafc); // White picket fence

    let houseCount = 0;
    for (let hx = -100; hx <= 540; hx += 38) {
      for (let hz = 180; hz <= 700; hz += 42) {
        // Leave gaps for suburban roads
        if (Math.abs(hx - 80) < 12 || Math.abs(hx - 220) < 12 || Math.abs(hx - 360) < 12 || Math.abs(hx - 500) < 12) continue;
        if (Math.abs(hz - 280) < 12 || Math.abs(hz - 420) < 12 || Math.abs(hz - 560) < 12) continue;

        const y = this.terrain.getElevation(hx, hz);
        if (y < 1.0) continue;

        const group = new THREE.Group();
        group.position.set(hx, y, hz);

        const w = 14 + (houseCount % 4) * 2;
        const d = 16 + (houseCount % 3) * 2;
        const h = 7.5 + (houseCount % 2) * 3.0;

        // House Body
        const bodyGeo = new THREE.BoxGeometry(w, h, d);
        const body = new THREE.Mesh(bodyGeo, wallMat);
        body.position.y = h / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Pitched Japanese Roof
        const roofMat = roofMats[houseCount % roofMats.length];
        const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.75, 4.2, 4);
        roofGeo.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = h + 2.1;
        roof.scale.set(w / Math.max(w, d), 1.0, d / Math.max(w, d));
        roof.castShadow = true;
        group.add(roof);

        // Balcony & AC Unit
        const acGeo = new THREE.BoxGeometry(1.4, 1.0, 0.8);
        const acMat = this.assetGen.createToonMaterial(0xe2e8f0);
        const ac = new THREE.Mesh(acGeo, acMat);
        ac.position.set(w / 2 + 0.5, 2.5, 0);
        group.add(ac);

        // Garden Picket Fence
        const fenceGeo = new THREE.BoxGeometry(w + 4, 1.0, d + 4);
        const fence = new THREE.Mesh(fenceGeo, fenceMat);
        fence.position.y = 0.5;
        group.add(fence);

        this.scene.add(group);
        this.colliders.push(new THREE.Box3(
          new THREE.Vector3(hx - w / 2 - 0.4, y, hz - d / 2 - 0.4),
          new THREE.Vector3(hx + w / 2 + 0.4, y + h + 4.5, hz + d / 2 + 0.4)
        ));

        houseCount++;
      }
    }
  }

  // -------------------------------------------------------------
  // 5. Mount Sakura Hillside Village & Shinto Shrine Sanctuary
  // -------------------------------------------------------------
  buildMountSakuraVillageAndShrine() {
    // A. Terraced Hillside Village Cottages along the mountain road
    const villagePoints = [
      { x: 440, z: -160 }, { x: 480, z: -190 },
      { x: 500, z: -260 }, { x: 540, z: -290 },
      { x: 580, z: -370 }, { x: 620, z: -400 },
      { x: 510, z: -440 }, { x: 550, z: -470 }
    ];

    const woodMat = this.assetGen.createToonMaterial(0x854d0e);
    const roofMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getTileRoofTexture(0x334155),
      gradientMap: this.assetGen.toonGradient
    });

    villagePoints.forEach((vp, i) => {
      const y = this.terrain.getElevation(vp.x, vp.z);
      const group = new THREE.Group();
      group.position.set(vp.x, y, vp.z);

      const body = new THREE.Mesh(new THREE.BoxGeometry(12, 6.5, 14), woodMat);
      body.position.y = 3.25;
      body.castShadow = true;
      group.add(body);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(10, 3.8, 4), roofMat);
      roof.rotateY(Math.PI / 4);
      roof.position.y = 8.4;
      group.add(roof);

      this.scene.add(group);
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(vp.x - 7, y, vp.z - 8),
        new THREE.Vector3(vp.x + 7, y + 11, vp.z + 8)
      ));
    });

    // B. Sacred Mount Sakura Shinto Shrine Sanctuary at Peak (x: 650, z: -550)
    const shrineX = 650, shrineZ = -550;
    const shrineY = 47.0; // Summit terrace height
    const shrineGroup = new THREE.Group();
    shrineGroup.position.set(shrineX, shrineY, shrineZ);

    const redMat = this.assetGen.createToonMaterial(0xdc2626); // Vermilion Torii Red
    const goldMat = this.assetGen.createToonMaterial(0xf59e0b); // Gold finials

    // 1. Grand Vermilion Torii Gate (At Mountain Approach)
    const toriiGroup = new THREE.Group();
    toriiGroup.position.set(-25, 0, 35);

    const postGeo = new THREE.CylinderGeometry(0.55, 0.65, 12, 12);
    const postL = new THREE.Mesh(postGeo, redMat);
    postL.position.set(-6, 6, 0);
    const postR = new THREE.Mesh(postGeo, redMat);
    postR.position.set(6, 6, 0);

    const lintelGeo = new THREE.BoxGeometry(16, 1.2, 1.4);
    const lintel = new THREE.Mesh(lintelGeo, redMat);
    lintel.position.set(0, 11.5, 0);

    const subLintelGeo = new THREE.BoxGeometry(14, 0.8, 0.9);
    const subLintel = new THREE.Mesh(subLintelGeo, redMat);
    subLintel.position.set(0, 9.8, 0);

    toriiGroup.add(postL, postR, lintel, subLintel);
    shrineGroup.add(toriiGroup);

    // 2. Main Shinto Shrine Hall (Honden / Haiden)
    const hallMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getTempleTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    const hallBody = new THREE.Mesh(new THREE.BoxGeometry(24, 11, 28), hallMat);
    hallBody.position.y = 5.5;
    hallBody.castShadow = true;
    shrineGroup.add(hallBody);

    // Traditional Curved Japanese Roof with Chigi Gold Finials
    const shrineRoofGeo = new THREE.ConeGeometry(22, 7.5, 4);
    shrineRoofGeo.rotateY(Math.PI / 4);
    const shrineRoof = new THREE.Mesh(shrineRoofGeo, roofMat);
    shrineRoof.position.y = 14.5;
    shrineRoof.scale.set(1.1, 1.0, 1.25);
    shrineRoof.castShadow = true;
    shrineGroup.add(shrineRoof);

    // Chigi X-shaped Finials
    const chigiGeo = new THREE.BoxGeometry(0.5, 4.5, 0.5);
    const chigi1 = new THREE.Mesh(chigiGeo, goldMat);
    chigi1.position.set(0, 18.5, -10);
    chigi1.rotation.z = 0.5;
    const chigi2 = new THREE.Mesh(chigiGeo, goldMat);
    chigi2.position.set(0, 18.5, -10);
    chigi2.rotation.z = -0.5;
    shrineGroup.add(chigi1, chigi2);

    // 3. Purification Water Pavilion (Chozuya)
    const chozuGroup = new THREE.Group();
    chozuGroup.position.set(-18, 0, 12);
    const basin = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 3), this.assetGen.createToonMaterial(0x64748b));
    basin.position.y = 0.75;
    chozuGroup.add(basin);
    shrineGroup.add(chozuGroup);

    this.scene.add(shrineGroup);

    // Shrine Colliders
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(shrineX - 13, shrineY, shrineZ - 15),
      new THREE.Vector3(shrineX + 13, shrineY + 20, shrineZ + 15)
    ));
  }

  // -------------------------------------------------------------
  // 6. Clifftop Maritime Lighthouse Station (x: -950, z: -750)
  // -------------------------------------------------------------
  buildLighthouseStation() {
    const lhX = -950, lhZ = -750;
    const lhY = 26.5; // High ocean bluff
    const lhGroup = new THREE.Group();
    lhGroup.position.set(lhX, lhY, lhZ);

    const whiteMat = this.assetGen.createToonMaterial(0xf8fafc);
    const redMat = this.assetGen.createToonMaterial(0xef4444);
    const glassMat = this.assetGen.createToonMaterial(0x38bdf8, { transparent: true, opacity: 0.85 });

    // 32m Tower with Red/White Nautical Bands
    const bandHeight = 6.0;
    for (let b = 0; b < 5; b++) {
      const bGeo = new THREE.CylinderGeometry(2.8 - b * 0.25, 3.1 - b * 0.25, bandHeight, 16);
      const bMesh = new THREE.Mesh(bGeo, b % 2 === 0 ? whiteMat : redMat);
      bMesh.position.y = b * bandHeight + bandHeight / 2;
      bMesh.castShadow = true;
      lhGroup.add(bMesh);
    }

    // Observation Balcony Gallery
    const balGeo = new THREE.CylinderGeometry(3.8, 3.8, 0.6, 16);
    const balcony = new THREE.Mesh(balGeo, this.assetGen.createToonMaterial(0x334155));
    balcony.position.y = 30.3;
    lhGroup.add(balcony);

    // Glass Lantern Dome & Beacon Room
    const domeGeo = new THREE.CylinderGeometry(2.2, 2.2, 3.5, 12);
    const dome = new THREE.Mesh(domeGeo, glassMat);
    dome.position.y = 32.2;
    lhGroup.add(dome);

    // Lantern Roof Cupola
    const cupolaGeo = new THREE.ConeGeometry(2.6, 2.2, 12);
    const cupola = new THREE.Mesh(cupolaGeo, redMat);
    cupola.position.y = 35.0;
    lhGroup.add(cupola);

    // Keeper's Cottage
    const cottage = new THREE.Mesh(
      new THREE.BoxGeometry(14, 6.0, 10),
      this.assetGen.createToonMaterial(0xf1f5f9)
    );
    cottage.position.set(12, 3.0, 0);
    cottage.castShadow = true;
    lhGroup.add(cottage);

    this.scene.add(lhGroup);
    this.colliders.push(
      new THREE.Box3(new THREE.Vector3(lhX - 4, lhY, lhZ - 4), new THREE.Vector3(lhX + 4, lhY + 36, lhZ + 4)),
      new THREE.Box3(new THREE.Vector3(lhX + 5, lhY, lhZ - 6), new THREE.Vector3(lhX + 20, lhY + 8, lhZ + 6))
    );
  }

  // -------------------------------------------------------------
  // 7. Emerald Lake Amenities & Lakeside Pavilion
  // -------------------------------------------------------------
  buildEmeraldLakeAmenities() {
    const lx = -360, lz = 40;
    const ly = 1.0;

    // Lakeside Pavilion & Gazebo on the northern shore
    const gazGroup = new THREE.Group();
    gazGroup.position.set(lx + 85, ly + 0.8, lz - 85);

    const woodMat = this.assetGen.createToonMaterial(0x854d0e);
    const redMat = this.assetGen.createToonMaterial(0xdc2626);

    const deck = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.5, 8), woodMat);
    deck.position.y = 0.25;
    gazGroup.add(deck);

    // Pagoda Tiered Roof
    const roof1 = new THREE.Mesh(new THREE.ConeGeometry(9.5, 3.5, 8), redMat);
    roof1.position.y = 6.0;
    const roof2 = new THREE.Mesh(new THREE.ConeGeometry(6.5, 2.5, 8), redMat);
    roof2.position.y = 8.5;
    gazGroup.add(roof1, roof2);

    // Pillars
    for (let p = 0; p < 8; p++) {
      const ang = (p / 8) * Math.PI * 2;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.5, 6), redMat);
      pillar.position.set(Math.cos(ang) * 6.5, 2.5, Math.sin(ang) * 6.5);
      gazGroup.add(pillar);
    }

    this.scene.add(gazGroup);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(lx + 76, ly, lz - 94),
      new THREE.Vector3(lx + 94, ly + 10, lz - 76)
    ));
  }

  // -------------------------------------------------------------
  // Precise Building Collision Detection
  // -------------------------------------------------------------
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
