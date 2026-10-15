import * as THREE from 'three';

export class CityBuilder {
  constructor(scene, assetGen, terrain) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.terrain = terrain;

    // Collision bounding boxes for player and vehicle collisions
    this.colliders = [];
    // District boundaries for HUD indicator
    this.districts = [];

    this.init();
  }

  init() {
    this.buildDowntownSkyscrapers();
    this.buildSakuraResidentialDistrict();
    this.buildMuseumPlaza();
    this.buildCentralPark();
    this.buildLighthouseAndMarina();
    this.setupDistrictZones();
  }

  // 1. Downtown Skyline
  buildDowntownSkyscrapers() {
    const skyscraperConfigs = [
      // Block A (x: -45, z: -45)
      { x: -45, z: -45, w: 22, d: 22, h: 65, pal: 0, roof: 'spire' },
      { x: -45, z: -25, w: 18, d: 16, h: 42, pal: 1, roof: 'flat' },
      { x: -25, z: -45, w: 16, d: 20, h: 50, pal: 2, roof: 'stepped' },
      // Block B (x: 45, z: -45)
      { x: 45, z: -45, w: 24, d: 24, h: 75, pal: 3, roof: 'helipad' },
      { x: 45, z: -25, w: 18, d: 18, h: 48, pal: 0, roof: 'flat' },
      { x: 25, z: -45, w: 16, d: 16, h: 55, pal: 1, roof: 'spire' },
      // Block C (x: -45, z: 45)
      { x: -45, z: 45, w: 20, d: 20, h: 58, pal: 2, roof: 'stepped' },
      { x: -45, z: 25, w: 18, d: 16, h: 38, pal: 3, roof: 'flat' },
      { x: -25, z: 45, w: 16, d: 18, h: 45, pal: 0, roof: 'flat' },
      // Downtown Center Hub
      { x: -140, z: -35, w: 26, d: 24, h: 80, pal: 1, roof: 'spire' },
      { x: -140, z: 35, w: 22, d: 26, h: 60, pal: 2, roof: 'helipad' }
    ];

    skyscraperConfigs.forEach(cfg => {
      const y = this.terrain.getElevation(cfg.x, cfg.z);
      const buildingGroup = new THREE.Group();
      buildingGroup.position.set(cfg.x, y, cfg.z);

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
      buildingGroup.add(tower);

      // Roof details
      if (cfg.roof === 'spire') {
        const spireGeo = new THREE.ConeGeometry(cfg.w * 0.35, 14, 8);
        const spireMat = this.assetGen.createToonMaterial(0x38bdf8);
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.y = cfg.h + 7;
        spire.castShadow = true;
        buildingGroup.add(spire);

        // Antenna needle
        const needleGeo = new THREE.CylinderGeometry(0.2, 0.4, 10, 6);
        const needleMat = this.assetGen.createToonMaterial(0xff0055);
        const needle = new THREE.Mesh(needleGeo, needleMat);
        needle.position.y = cfg.h + 18;
        buildingGroup.add(needle);
      } else if (cfg.roof === 'helipad') {
        // Helipad platform
        const padGeo = new THREE.CylinderGeometry(cfg.w * 0.38, cfg.w * 0.38, 1.2, 16);
        const padMat = this.assetGen.createToonMaterial(0xffd166);
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.y = cfg.h + 0.6;
        buildingGroup.add(pad);
      } else if (cfg.roof === 'stepped') {
        const stepGeo = new THREE.BoxGeometry(cfg.w * 0.65, 8, cfg.d * 0.65);
        const stepMat = this.assetGen.createToonMaterial(0x64748b);
        const step = new THREE.Mesh(stepGeo, stepMat);
        step.position.y = cfg.h + 4;
        buildingGroup.add(step);
      }

      this.scene.add(buildingGroup);

      // Add collision box
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(cfg.x - cfg.w / 2, y, cfg.z - cfg.d / 2),
        new THREE.Vector3(cfg.x + cfg.w / 2, y + cfg.h, cfg.z + cfg.d / 2)
      ));
    });
  }

  // 2. Sakura Residential District (Cute Japanese anime suburban houses)
  buildSakuraResidentialDistrict() {
    const houseColors = [0xffc6d9, 0xa0e7e5, 0xfff3b0, 0xb8e0d2, 0xe8dff5];
    const roofColors = [0xff598f, 0x00bbf9, 0xf77f00, 0x48bfe3, 0x7209b7];

    const startX = 40;
    const startZ = 40;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const x = startX + c * 26;
        const z = startZ + r * 28;
        const y = this.terrain.getElevation(x, z);

        const houseGroup = new THREE.Group();
        houseGroup.position.set(x, y, z);

        const colorIdx = (r + c) % houseColors.length;
        const w = 11;
        const d = 13;
        const h = 6.5;

        // Base walls
        const wallMat = this.assetGen.createToonMaterial(houseColors[colorIdx]);
        const wallGeo = new THREE.BoxGeometry(w, h, d);
        const walls = new THREE.Mesh(wallGeo, wallMat);
        walls.position.y = h / 2;
        walls.castShadow = true;
        walls.receiveShadow = true;
        houseGroup.add(walls);

        // Cute Pitched Roof
        const roofMat = this.assetGen.createToonMaterial(roofColors[colorIdx]);
        const roofGeo = new THREE.ConeGeometry(w * 0.78, 4.5, 4);
        roofGeo.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = h + 2.25;
        roof.castShadow = true;
        houseGroup.add(roof);

        // Front porch door & windows
        const doorGeo = new THREE.BoxGeometry(1.8, 3.2, 0.4);
        const doorMat = this.assetGen.createToonMaterial(0x8d5b4c);
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 1.6, d / 2 + 0.1);
        houseGroup.add(door);

        // Cute chimney
        const chimneyGeo = new THREE.BoxGeometry(1.2, 3.5, 1.2);
        const chimneyMat = this.assetGen.createToonMaterial(0xff758f);
        const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
        chimney.position.set(w * 0.28, h + 2.5, -d * 0.15);
        houseGroup.add(chimney);

        // White picket fence around the yard
        const fenceGeo = new THREE.BoxGeometry(w + 6, 1.1, 0.2);
        const fenceMat = this.assetGen.createToonMaterial(0xffffff);
        const fenceFront = new THREE.Mesh(fenceGeo, fenceMat);
        fenceFront.position.set(0, 0.55, d / 2 + 4.5);
        houseGroup.add(fenceFront);

        // Cute Mailbox
        const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.5, 8);
        const boxGeo = new THREE.BoxGeometry(0.8, 0.6, 1.0);
        const mailGroup = new THREE.Group();
        const post = new THREE.Mesh(postGeo, fenceMat);
        const box = new THREE.Mesh(boxGeo, this.assetGen.createToonMaterial(0xef4444));
        post.position.y = 0.75;
        box.position.y = 1.6;
        mailGroup.add(post, box);
        mailGroup.position.set(w / 2 + 1.5, 0, d / 2 + 3.5);
        houseGroup.add(mailGroup);

        this.scene.add(houseGroup);

        this.colliders.push(new THREE.Box3(
          new THREE.Vector3(x - w / 2, y, z - d / 2),
          new THREE.Vector3(x + w / 2, y + h + 4.5, z + d / 2)
        ));
      }
    }
  }

  // 3. Cultural Museum Plaza (Grand classical dome, pillars, fountain)
  buildMuseumPlaza() {
    const mx = 145;
    const mz = -145;
    const my = this.terrain.getElevation(mx, mz);

    const museumGroup = new THREE.Group();
    museumGroup.position.set(mx, my, mz);

    const marbleMat = this.assetGen.createToonMaterial(0xf8fafc);
    const goldMat = this.assetGen.createToonMaterial(0xf59e0b);
    const domeMat = this.assetGen.createToonMaterial(0x06b6d4);

    // Stepped Grand Podium
    const baseGeo = new THREE.BoxGeometry(48, 3, 36);
    const base = new THREE.Mesh(baseGeo, marbleMat);
    base.position.y = 1.5;
    base.receiveShadow = true;
    museumGroup.add(base);

    // Main Hall
    const hallGeo = new THREE.BoxGeometry(40, 16, 28);
    const hall = new THREE.Mesh(hallGeo, marbleMat);
    hall.position.y = 11;
    hall.castShadow = true;
    hall.receiveShadow = true;
    museumGroup.add(hall);

    // Grand Classical Columns (8 pillars along front)
    const pillarGeo = new THREE.CylinderGeometry(0.9, 1.1, 14, 12);
    for (let i = 0; i < 6; i++) {
      const px = -15 + i * 6;
      const col = new THREE.Mesh(pillarGeo, marbleMat);
      col.position.set(px, 10, 15.5);
      col.castShadow = true;
      museumGroup.add(col);
    }

    // Triangular Pediment over entrance
    const pedGeo = new THREE.CylinderGeometry(18, 18, 2, 3);
    pedGeo.rotateX(Math.PI / 2);
    const pediment = new THREE.Mesh(pedGeo, marbleMat);
    pediment.position.set(0, 19, 15.5);
    pediment.scale.set(1.2, 0.45, 1);
    pediment.castShadow = true;
    museumGroup.add(pediment);

    // Central Rotunda Dome
    const rotundaGeo = new THREE.CylinderGeometry(10, 10, 5, 24);
    const rotunda = new THREE.Mesh(rotundaGeo, marbleMat);
    rotunda.position.y = 21.5;
    const domeGeo = new THREE.SphereGeometry(10, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 24;
    dome.castShadow = true;
    museumGroup.add(rotunda, dome);

    // Museum Plaza Fountain
    const fountainRingGeo = new THREE.CylinderGeometry(8, 8.5, 1.5, 24);
    const fountainRing = new THREE.Mesh(fountainRingGeo, marbleMat);
    fountainRing.position.set(0, 0.75, 34);
    const fountainWaterGeo = new THREE.CylinderGeometry(7.6, 7.6, 1.2, 24);
    const fountainWater = new THREE.Mesh(fountainWaterGeo, this.assetGen.createToonMaterial(0x38bdf8, { transparent: true, opacity: 0.85 }));
    fountainWater.position.set(0, 0.9, 34);

    // Center fountain spout statue
    const statueGeo = new THREE.SphereGeometry(1.6, 12, 12);
    const statue = new THREE.Mesh(statueGeo, goldMat);
    statue.position.set(0, 3.5, 34);
    museumGroup.add(fountainRing, fountainWater, statue);

    this.scene.add(museumGroup);

    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(mx - 24, my, mz - 18),
      new THREE.Vector3(mx + 24, my + 34, mz + 18)
    ));
  }

  // 4. Verdant Central Park (Lake, arched bridge, gazebo)
  buildCentralPark() {
    const px = -150;
    const pz = -150;
    const py = this.terrain.getElevation(px, pz);

    const parkGroup = new THREE.Group();
    parkGroup.position.set(px, py, pz);

    // Pond Water
    const pondGeo = new THREE.CircleGeometry(28, 32);
    pondGeo.rotateX(-Math.PI / 2);
    const pondMat = this.assetGen.createToonMaterial(0x0284c7, { transparent: true, opacity: 0.85 });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.position.y = 0.15;
    parkGroup.add(pond);

    // Curved Japanese Wooden Bridge over pond
    const bridgeGeo = new THREE.BoxGeometry(6, 0.4, 26);
    const woodMat = this.assetGen.createToonMaterial(0xd97706);
    const redMat = this.assetGen.createToonMaterial(0xef4444);

    const bridge = new THREE.Mesh(bridgeGeo, woodMat);
    bridge.position.set(0, 1.8, 0);
    // Railings
    const railGeo = new THREE.BoxGeometry(0.3, 1.4, 26);
    const railL = new THREE.Mesh(railGeo, redMat);
    railL.position.set(-2.8, 2.5, 0);
    const railR = new THREE.Mesh(railGeo, redMat);
    railR.position.set(2.8, 2.5, 0);
    parkGroup.add(bridge, railL, railR);

    // Park Gazebo / Pagoda
    const gzX = 36;
    const gzZ = 15;
    const gzMat = this.assetGen.createToonMaterial(0xef4444);
    const gzRoofGeo = new THREE.ConeGeometry(7, 4.5, 6);
    const gzRoof = new THREE.Mesh(gzRoofGeo, gzMat);
    gzRoof.position.set(gzX, 6.5, gzZ);

    const postGeo = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(gzX + Math.cos(ang) * 5, 2.5, gzZ + Math.sin(ang) * 5);
      parkGroup.add(post);
    }
    parkGroup.add(gzRoof);

    this.scene.add(parkGroup);
  }

  // 5. Clifftop Lighthouse & Coastal Marina
  buildLighthouseAndMarina() {
    const lx = 240;
    const lz = -240;
    const ly = this.terrain.getElevation(lx, lz);

    const lhGroup = new THREE.Group();
    lhGroup.position.set(lx, ly, lz);

    // Lighthouse Tower with alternating Red and White bands
    const whiteMat = this.assetGen.createToonMaterial(0xffffff);
    const redMat = this.assetGen.createToonMaterial(0xe11d48);

    const bandHeights = [6, 6, 6, 6, 6];
    let curY = 0;
    bandHeights.forEach((bh, i) => {
      const rBot = 5.5 - i * 0.45;
      const rTop = rBot - 0.45;
      const geo = new THREE.CylinderGeometry(rTop, rBot, bh, 16);
      const mat = i % 2 === 0 ? whiteMat : redMat;
      const band = new THREE.Mesh(geo, mat);
      band.position.y = curY + bh / 2;
      band.castShadow = true;
      lhGroup.add(band);
      curY += bh;
    });

    // Glass Lantern Room
    const lanternGeo = new THREE.CylinderGeometry(3.2, 3.2, 4.5, 16);
    const lanternMat = this.assetGen.createToonMaterial(0xfef08a, { transparent: true, opacity: 0.9 });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.y = curY + 2.25;

    // Dome Cap
    const domeGeo = new THREE.SphereGeometry(3.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, redMat);
    dome.position.y = curY + 4.5;
    lhGroup.add(lantern, dome);

    this.scene.add(lhGroup);

    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(lx - 6, ly, lz - 6),
      new THREE.Vector3(lx + 6, ly + 36, lz + 6)
    ));
  }

  setupDistrictZones() {
    this.districts = [
      { name: '🌆 Downtown Skyline Hub', minX: -100, maxX: 40, minZ: -100, maxZ: 40 },
      { name: '🌸 Sakura Residential District', minX: 30, maxX: 220, minZ: 30, maxZ: 220 },
      { name: '🏛️ Cultural Museum Plaza', minX: 100, maxX: 260, minZ: -200, maxZ: -80 },
      { name: '🌳 Verdant Central Park', minX: -220, maxX: -60, minZ: -220, maxZ: -60 },
      { name: '⛵ Coastal Lighthouse & Marina', minX: 180, maxX: 320, minZ: -320, maxZ: -180 },
      { name: '🌊 OpenSquare Ocean Promenade', minX: -400, maxX: 400, minZ: -400, maxZ: 400 }
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

  // Check if position (pos) intersects any building collider
  checkCollision(pos, radius = 0.8) {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(pos.x - radius, pos.y, pos.z - radius),
      new THREE.Vector3(pos.x + radius, pos.y + 2.0, pos.z + radius)
    );

    for (let i = 0; i < this.colliders.length; i++) {
      if (this.colliders[i].intersectsBox(playerBox)) {
        return true;
      }
    }
    return false;
  }
}
