import * as THREE from 'three';

export class RoadNetwork {
  constructor(scene, assetGen, islandTerrain) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.terrain = islandTerrain;

    this.carWaypoints = [];
    this.pedestrianWaypoints = [];
    this.intersections = [];
    this.roadMeshes = [];
    this.roadColliders = []; // Bridge railings, cliff barriers ONLY

    this.init();
  }

  init() {
    this.buildWaypointGraph();
    this.build3DRoadAndBridgeMeshes();
  }

  // -------------------------------------------------------------
  // Bridge & Ramp Elevation Query (Seamless Surface for Player & Cars)
  // -------------------------------------------------------------
  getBridgeElevation(x, z) {
    // Grand Emerald Lake Bridge (Spans z = 40 from x = -480 to x = -240)
    if (x >= -485 && x <= -235 && Math.abs(z - 40) < 12.5) {
      const deckY = 4.2;
      const groundY = 1.8;
      // East Ramp (x: -260 to -235)
      if (x > -265) {
        const t = (x - -265) / 30.0;
        return THREE.MathUtils.lerp(deckY, groundY, Math.min(1.0, Math.max(0, t)));
      }
      // West Ramp (x: -485 to -455)
      if (x < -455) {
        const t = (-455 - x) / 30.0;
        return THREE.MathUtils.lerp(deckY, groundY, Math.min(1.0, Math.max(0, t)));
      }
      return deckY; // Flat bridge span over lake
    }

    // Mount Sakura Switchback Ascending Road
    const mtnPoints = [
      new THREE.Vector3(400, 2.0, 40),
      new THREE.Vector3(450, 2.0, -100),
      new THREE.Vector3(520, 8.0, -220),
      new THREE.Vector3(600, 16.5, -340),
      new THREE.Vector3(530, 25.0, -420),
      new THREE.Vector3(620, 34.0, -490),
      new THREE.Vector3(560, 41.5, -530),
      new THREE.Vector3(650, 47.0, -550)
    ];

    for (let i = 0; i < mtnPoints.length - 1; i++) {
      const p1 = mtnPoints[i];
      const p2 = mtnPoints[i + 1];
      const segDir = new THREE.Vector2(p2.x - p1.x, p2.z - p1.z);
      const segLen = segDir.length();
      segDir.normalize();

      const pt = new THREE.Vector2(x - p1.x, z - p1.z);
      const proj = pt.dot(segDir);
      if (proj >= 0 && proj <= segLen) {
        const perp = Math.abs(pt.x * segDir.y - pt.y * segDir.x);
        if (perp < 8.5) {
          const t = proj / segLen;
          return THREE.MathUtils.lerp(p1.y, p2.y, t) + 0.12;
        }
      }
    }

    // Lighthouse Forest Highway
    const lhPoints = [
      new THREE.Vector3(-480, 2.0, 40),
      new THREE.Vector3(-600, 3.5, 20),
      new THREE.Vector3(-720, 8.0, -100),
      new THREE.Vector3(-820, 15.0, -300),
      new THREE.Vector3(-880, 21.0, -520),
      new THREE.Vector3(-950, 26.5, -750)
    ];

    for (let i = 0; i < lhPoints.length - 1; i++) {
      const p1 = lhPoints[i];
      const p2 = lhPoints[i + 1];
      const segDir = new THREE.Vector2(p2.x - p1.x, p2.z - p1.z);
      const segLen = segDir.length();
      segDir.normalize();

      const pt = new THREE.Vector2(x - p1.x, z - p1.z);
      const proj = pt.dot(segDir);
      if (proj >= 0 && proj <= segLen) {
        const perp = Math.abs(pt.x * segDir.y - pt.y * segDir.x);
        if (perp < 9.0) {
          const t = proj / segLen;
          return THREE.MathUtils.lerp(p1.y, p2.y, t) + 0.12;
        }
      }
    }

    return null; // Defer to terrain elevation
  }

  // -------------------------------------------------------------
  // Build AI Traffic & Pedestrian Waypoint Graph
  // -------------------------------------------------------------
  buildWaypointGraph() {
    // 1. Grand Central Boulevard (East-West across island, z = 40)
    const boulevardXs = [-480, -360, -240, -120, 0, 120, 240, 380, 500];
    const bvdFwd = [];
    const bvdRev = [];

    boulevardXs.forEach((bx, i) => {
      const by = this.getBridgeElevation(bx, 40) || this.terrain.getElevation(bx, 40);
      const wpF = {
        id: `bvd_fwd_${i}`,
        position: new THREE.Vector3(bx, by + 0.12, 40 - 4.5),
        direction: new THREE.Vector3(1, 0, 0),
        speedLimit: 14.0,
        next: []
      };
      const wpR = {
        id: `bvd_rev_${i}`,
        position: new THREE.Vector3(bx, by + 0.12, 40 + 4.5),
        direction: new THREE.Vector3(-1, 0, 0),
        speedLimit: 14.0,
        next: []
      };
      bvdFwd.push(wpF);
      bvdRev.push(wpR);
      this.carWaypoints.push(wpF, wpR);

      // Sidewalk pedestrian nodes
      this.pedestrianWaypoints.push(
        { id: `bvd_ped_n_${i}`, position: new THREE.Vector3(bx, by + 0.2, 40 - 10.5), next: [] },
        { id: `bvd_ped_s_${i}`, position: new THREE.Vector3(bx, by + 0.2, 40 + 10.5), next: [] }
      );
    });

    for (let i = 0; i < boulevardXs.length - 1; i++) {
      bvdFwd[i].next.push(bvdFwd[i + 1]);
      bvdRev[i + 1].next.push(bvdRev[i]);
    }

    // 2. Downtown Financial Avenue (North-South, x = 0)
    const dtZs = [-350, -240, -120, 40, 160, 280, 420];
    const dtFwd = [];
    const dtRev = [];

    dtZs.forEach((dz, i) => {
      const dy = this.terrain.getElevation(0, dz);
      const wpF = {
        id: `dt_ns_fwd_${i}`,
        position: new THREE.Vector3(4.5, dy + 0.12, dz),
        direction: new THREE.Vector3(0, 0, 1),
        speedLimit: 12.0,
        next: []
      };
      const wpR = {
        id: `dt_ns_rev_${i}`,
        position: new THREE.Vector3(-4.5, dy + 0.12, dz),
        direction: new THREE.Vector3(0, 0, -1),
        speedLimit: 12.0,
        next: []
      };
      dtFwd.push(wpF);
      dtRev.push(wpR);
      this.carWaypoints.push(wpF, wpR);

      this.pedestrianWaypoints.push(
        { id: `dt_ns_ped_e_${i}`, position: new THREE.Vector3(10.5, dy + 0.2, dz), next: [] },
        { id: `dt_ns_ped_w_${i}`, position: new THREE.Vector3(-10.5, dy + 0.2, dz), next: [] }
      );
    });

    for (let i = 0; i < dtZs.length - 1; i++) {
      dtFwd[i].next.push(dtFwd[i + 1]);
      dtRev[i + 1].next.push(dtRev[i]);
    }

    // Interconnect Boulevard and North-South Avenue at (0, 40)
    const bvdCenterFwd = bvdFwd[4]; // (0, 40)
    const bvdCenterRev = bvdRev[4];
    const dtCenterFwd = dtFwd[3];
    const dtCenterRev = dtRev[3];

    if (bvdCenterFwd && dtCenterFwd) bvdCenterFwd.next.push(dtCenterFwd);
    if (bvdCenterRev && dtCenterRev) bvdCenterRev.next.push(dtCenterRev);
    if (dtCenterFwd && bvdCenterRev) dtCenterFwd.next.push(bvdCenterRev);
    if (dtCenterRev && bvdCenterFwd) dtCenterRev.next.push(bvdCenterFwd);

    // 3. Lighthouse Knitted Forest Highway Waypoints
    const lhPts = [
      new THREE.Vector3(-480, 2.0, 40),
      new THREE.Vector3(-600, 3.5, 20),
      new THREE.Vector3(-720, 8.0, -100),
      new THREE.Vector3(-820, 15.0, -300),
      new THREE.Vector3(-880, 21.0, -520),
      new THREE.Vector3(-950, 26.5, -750)
    ];

    const lhWpsFwd = [];
    const lhWpsRev = [];

    lhPts.forEach((pt, i) => {
      const wpF = {
        id: `lh_fwd_${i}`,
        position: pt.clone().add(new THREE.Vector3(2.5, 0.12, 2.5)),
        speedLimit: 11.0,
        next: []
      };
      const wpR = {
        id: `lh_rev_${i}`,
        position: pt.clone().add(new THREE.Vector3(-2.5, 0.12, -2.5)),
        speedLimit: 11.0,
        next: []
      };
      lhWpsFwd.push(wpF);
      lhWpsRev.push(wpR);
      this.carWaypoints.push(wpF, wpR);

      this.pedestrianWaypoints.push({
        id: `lh_ped_${i}`,
        position: pt.clone().add(new THREE.Vector3(6.0, 0.2, 0)),
        next: []
      });
    });

    for (let i = 0; i < lhPts.length - 1; i++) {
      lhWpsFwd[i].next.push(lhWpsFwd[i + 1]);
      lhWpsRev[i + 1].next.push(lhWpsRev[i]);
    }
    // Loop at lighthouse summit
    lhWpsFwd[lhWpsFwd.length - 1].next.push(lhWpsRev[lhWpsRev.length - 1]);
    // Connect to boulevard west end
    bvdRev[0].next.push(lhWpsFwd[0]);
    lhWpsRev[0].next.push(bvdFwd[0]);

    // 4. Mount Sakura Switchback Mountain Road Waypoints
    const mtnPts = [
      new THREE.Vector3(400, 2.0, 40),
      new THREE.Vector3(450, 2.0, -100),
      new THREE.Vector3(520, 8.0, -220),
      new THREE.Vector3(600, 16.5, -340),
      new THREE.Vector3(530, 25.0, -420),
      new THREE.Vector3(620, 34.0, -490),
      new THREE.Vector3(560, 41.5, -530),
      new THREE.Vector3(650, 47.0, -550)
    ];

    const mtnWpsFwd = [];
    const mtnWpsRev = [];

    mtnPts.forEach((pt, i) => {
      const wpF = {
        id: `mtn_fwd_${i}`,
        position: pt.clone().add(new THREE.Vector3(2.5, 0.12, 2.5)),
        speedLimit: 9.5,
        next: []
      };
      const wpR = {
        id: `mtn_rev_${i}`,
        position: pt.clone().add(new THREE.Vector3(-2.5, 0.12, -2.5)),
        speedLimit: 9.5,
        next: []
      };
      mtnWpsFwd.push(wpF);
      mtnWpsRev.push(wpR);
      this.carWaypoints.push(wpF, wpR);

      this.pedestrianWaypoints.push({
        id: `mtn_ped_${i}`,
        position: pt.clone().add(new THREE.Vector3(5.5, 0.2, 0)),
        next: []
      });
    });

    for (let i = 0; i < mtnPts.length - 1; i++) {
      mtnWpsFwd[i].next.push(mtnWpsFwd[i + 1]);
      mtnWpsRev[i + 1].next.push(mtnWpsRev[i]);
    }
    // Turnaround at shrine terrace
    mtnWpsFwd[mtnWpsFwd.length - 1].next.push(mtnWpsRev[mtnWpsRev.length - 1]);
    // Connect to east avenue
    bvdFwd[7].next.push(mtnWpsFwd[0]);
    mtnWpsRev[0].next.push(bvdRev[7]);

    // 5. Connect pedestrian sidewalk waypoints
    for (let i = 0; i < this.pedestrianWaypoints.length; i++) {
      const p1 = this.pedestrianWaypoints[i];
      for (let j = i + 1; j < this.pedestrianWaypoints.length; j++) {
        const p2 = this.pedestrianWaypoints[j];
        const dist = p1.position.distanceTo(p2.position);
        if (dist < 140) {
          p1.next.push(p2);
          p2.next.push(p1);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // Build Solid 3D Road Meshes, Curbs, Sidewalks & Bridges
  // -------------------------------------------------------------
  build3DRoadAndBridgeMeshes() {
    const roadMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getRoadTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    roadMat.map.wrapS = THREE.RepeatWrapping;
    roadMat.map.wrapT = THREE.RepeatWrapping;

    const sidewalkMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getSidewalkTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    sidewalkMat.map.wrapS = THREE.RepeatWrapping;
    sidewalkMat.map.wrapT = THREE.RepeatWrapping;

    const curbMat = this.assetGen.createToonMaterial(0x94a3b8);
    const bridgeRedSteel = this.assetGen.createToonMaterial(0xdc2626); // Japanese vermilion red steel

    // 1. Build Grand Central Boulevard (Width: 24m, East-West)
    this.buildGrandBoulevard(roadMat, sidewalkMat, curbMat);

    // 2. Build The Grand Emerald Lake Bridge (Length: 240m, Width: 24m)
    this.buildGrandLakeBridge(roadMat, sidewalkMat, curbMat, bridgeRedSteel);

    // 3. Build Downtown Financial Avenue (North-South, Width: 24m)
    this.buildDowntownAvenue(roadMat, sidewalkMat, curbMat);

    // 4. Build Commercial & Shibuya Grid Streets
    this.buildCommercialGridStreets(roadMat, sidewalkMat, curbMat);

    // 5. Build Sakura Town Residential Winding Lanes
    this.buildResidentialRoads(roadMat, sidewalkMat, curbMat);

    // 6. Build Lighthouse Knitted Forest Highway
    this.buildLighthouseHighway(roadMat, sidewalkMat);

    // 7. Build Mount Sakura Switchback Mountain Road
    this.buildMountSakuraRoad(roadMat);
  }

  // 1. Grand Boulevard (Width: 24m)
  buildGrandBoulevard(roadMat, sidewalkMat, curbMat) {
    // Spans from x = -240 (East bridge exit) to x = 540 along z = 40
    const startX = -240;
    const endX = 540;
    const length = endX - startX;
    const midX = (startX + endX) / 2;
    const y = 1.8;

    // Roadway bed slab (width 20m)
    const roadGeo = new THREE.BoxGeometry(length, 0.28, 20);
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.position.set(midX, y, 40);
    roadMesh.receiveShadow = true;
    this.scene.add(roadMesh);
    this.roadMeshes.push(roadMesh);

    // North & South Concrete Curbs and Sidewalks (width 3.5m each)
    [-11.5, 11.5].forEach(dz => {
      const swGeo = new THREE.BoxGeometry(length, 0.38, 3.5);
      const sw = new THREE.Mesh(swGeo, sidewalkMat);
      sw.position.set(midX, y + 0.06, 40 + dz);
      sw.receiveShadow = true;
      this.scene.add(sw);

      const curbGeo = new THREE.BoxGeometry(length, 0.42, 0.4);
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(midX, y + 0.08, 40 + (dz > 0 ? dz - 1.8 : dz + 1.8));
      this.scene.add(curb);
    });
  }

  // 2. The Grand Emerald Lake Bridge (Spans Lake from x = -480 to x = -240, z = 40)
  buildGrandLakeBridge(roadMat, sidewalkMat, curbMat, steelMat) {
    const bridgeGroup = new THREE.Group();
    const length = 240;
    const midX = -360;
    const deckY = 4.2;

    // A. Main Bridge Deck Slab (Width: 24m, Length: 240m)
    const deckGeo = new THREE.BoxGeometry(length, 0.6, 22);
    const deck = new THREE.Mesh(deckGeo, roadMat);
    deck.position.set(midX, deckY, 40);
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    // Sidewalks on Bridge Deck
    [-12.0, 12.0].forEach(dz => {
      const swGeo = new THREE.BoxGeometry(length, 0.72, 2.5);
      const sw = new THREE.Mesh(swGeo, sidewalkMat);
      sw.position.set(midX, deckY + 0.08, 40 + dz);
      sw.receiveShadow = true;
      bridgeGroup.add(sw);
    });

    // B. Massive Concrete Piers in Lake Bed (6 Heavy Pier Columns)
    const pierGeo = new THREE.BoxGeometry(8.0, 7.5, 26);
    const pierMat = this.assetGen.createToonMaterial(0x64748b);
    for (let px = -440; px <= -280; px += 40) {
      const pier = new THREE.Mesh(pierGeo, pierMat);
      pier.position.set(px, deckY - 3.75, 40);
      pier.castShadow = true;
      pier.receiveShadow = true;
      bridgeGroup.add(pier);
    }

    // C. Iconic Japanese Red Steel Arched Trusses along bridge sides
    const trussGeo = new THREE.BoxGeometry(length, 4.5, 0.8);
    const trussL = new THREE.Mesh(trussGeo, steelMat);
    trussL.position.set(midX, deckY + 2.4, 40 - 12.8);
    const trussR = new THREE.Mesh(trussGeo, steelMat);
    trussR.position.set(midX, deckY + 2.4, 40 + 12.8);
    bridgeGroup.add(trussL, trussR);

    // Cross Beams overhead
    for (let bx = -460; bx <= -260; bx += 20) {
      const beamGeo = new THREE.BoxGeometry(0.8, 0.6, 26.4);
      const beam = new THREE.Mesh(beamGeo, steelMat);
      beam.position.set(bx, deckY + 4.8, 40);
      bridgeGroup.add(beam);
    }

    // D. Smooth Approach Ramps (Connecting terrain y = 1.8 to deck y = 4.2)
    // East Ramp (x: -260 to -230)
    const rampGeo = new THREE.BoxGeometry(32, 0.35, 24);
    const rampE = new THREE.Mesh(rampGeo, roadMat);
    rampE.position.set(-245, 3.0, 40);
    rampE.rotation.z = 0.08;
    rampE.receiveShadow = true;
    bridgeGroup.add(rampE);

    // West Ramp (x: -490 to -460)
    const rampW = new THREE.Mesh(rampGeo, roadMat);
    rampW.position.set(-475, 3.0, 40);
    rampW.rotation.z = -0.08;
    rampW.receiveShadow = true;
    bridgeGroup.add(rampW);

    this.scene.add(bridgeGroup);

    // Solid Bridge Railing Colliders on LEFT & RIGHT ONLY (Road deck is 100% open!)
    this.roadColliders.push(
      new THREE.Box3(new THREE.Vector3(-485, 3.0, 40 - 14.5), new THREE.Vector3(-235, 8.0, 40 - 12.0)),
      new THREE.Box3(new THREE.Vector3(-485, 3.0, 40 + 12.0), new THREE.Vector3(-235, 8.0, 40 + 14.5))
    );
  }

  // 3. Downtown Financial Avenue (Width: 24m, North-South, x = 0)
  buildDowntownAvenue(roadMat, sidewalkMat, curbMat) {
    const startZ = -360;
    const endZ = 460;
    const length = endZ - startZ;
    const midZ = (startZ + endZ) / 2;
    const y = 1.8;

    const roadGeo = new THREE.BoxGeometry(20, 0.28, length);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, y, midZ);
    road.receiveShadow = true;
    this.scene.add(road);
    this.roadMeshes.push(road);

    [-11.5, 11.5].forEach(dx => {
      const swGeo = new THREE.BoxGeometry(3.5, 0.38, length);
      const sw = new THREE.Mesh(swGeo, sidewalkMat);
      sw.position.set(dx, y + 0.06, midZ);
      sw.receiveShadow = true;
      this.scene.add(sw);
    });

    // Grand Central 4-Way Junction Plaza at (0, 40)
    const junctionGeo = new THREE.BoxGeometry(48, 0.3, 48);
    const junction = new THREE.Mesh(junctionGeo, roadMat);
    junction.position.set(0, y + 0.02, 40);
    junction.receiveShadow = true;
    this.scene.add(junction);
    this.roadMeshes.push(junction);
  }

  // 4. Commercial & Shibuya Grid Streets (Width: 18m)
  buildCommercialGridStreets(roadMat, sidewalkMat, curbMat) {
    const y = 1.8;

    // North-South Grid Lines
    [120, 240, 380].forEach(gx => {
      const roadGeo = new THREE.BoxGeometry(16, 0.25, 400);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(gx, y, -100);
      road.receiveShadow = true;
      this.scene.add(road);
      this.roadMeshes.push(road);

      [-9.5, 9.5].forEach(dx => {
        const swGeo = new THREE.BoxGeometry(3.0, 0.35, 400);
        const sw = new THREE.Mesh(swGeo, sidewalkMat);
        sw.position.set(gx + dx, y + 0.05, -100);
        this.scene.add(sw);
      });
    });

    // East-West Grid Lines
    [-120, -240].forEach(gz => {
      const roadGeo = new THREE.BoxGeometry(450, 0.25, 16);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(200, y, gz);
      road.receiveShadow = true;
      this.scene.add(road);
      this.roadMeshes.push(road);
    });
  }

  // 5. Sakura Town Residential Winding Lanes (Width: 14m)
  buildResidentialRoads(roadMat, sidewalkMat, curbMat) {
    const y = 1.8;
    // Multi-block suburban lanes throughout x: -100~550, z: 160~680
    [160, 280, 420, 560].forEach(rz => {
      const roadGeo = new THREE.BoxGeometry(580, 0.22, 14);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(200, y, rz);
      road.receiveShadow = true;
      this.scene.add(road);
      this.roadMeshes.push(road);
    });

    [80, 220, 360, 500].forEach(rx => {
      const roadGeo = new THREE.BoxGeometry(14, 0.22, 500);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.set(rx, y, 420);
      road.receiveShadow = true;
      this.scene.add(road);
      this.roadMeshes.push(road);
    });
  }

  // 6. Lighthouse Knitted Forest Highway
  buildLighthouseHighway(roadMat, sidewalkMat) {
    const lhPoints = [
      new THREE.Vector3(-480, 2.0, 40),
      new THREE.Vector3(-600, 3.5, 20),
      new THREE.Vector3(-720, 8.0, -100),
      new THREE.Vector3(-820, 15.0, -300),
      new THREE.Vector3(-880, 21.0, -520),
      new THREE.Vector3(-950, 26.5, -750)
    ];

    const barrierMat = this.assetGen.createToonMaterial(0xd97706); // Timber wooden guardrail

    for (let i = 0; i < lhPoints.length - 1; i++) {
      const p1 = lhPoints[i];
      const p2 = lhPoints[i + 1];
      const length = p1.distanceTo(p2);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);

      const roadGeo = new THREE.BoxGeometry(16, 0.3, length + 2);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.copy(mid);
      road.rotation.y = angle;
      road.receiveShadow = true;
      this.scene.add(road);
      this.roadMeshes.push(road);

      // Wooden Guardrails along ocean side
      const railGeo = new THREE.BoxGeometry(0.35, 1.1, length + 2);
      const rail = new THREE.Mesh(railGeo, barrierMat);
      const norm = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
      rail.position.copy(mid).add(norm.clone().multiplyScalar(8.2));
      rail.position.y += 0.55;
      rail.rotation.y = angle;
      this.scene.add(rail);

      // Guardrail collider
      const rPos = rail.position;
      this.roadColliders.push(new THREE.Box3(
        new THREE.Vector3(rPos.x - 2.5, rPos.y - 0.5, rPos.z - 2.5),
        new THREE.Vector3(rPos.x + 2.5, rPos.y + 3.0, rPos.z + 2.5)
      ));
    }

    // Lighthouse Summit Viewing Circle Loop
    const loopGeo = new THREE.CylinderGeometry(28, 28, 0.35, 36);
    const loop = new THREE.Mesh(loopGeo, roadMat);
    loop.position.set(-950, 26.5, -750);
    loop.receiveShadow = true;
    this.scene.add(loop);
  }

  // 7. Mount Sakura Switchback Mountain Road
  buildMountSakuraRoad(roadMat) {
    const barrierMat = this.assetGen.createToonMaterial(0xdc2626); // Red & White crash barrier
    const mtnPoints = [
      new THREE.Vector3(400, 2.0, 40),
      new THREE.Vector3(450, 2.0, -100),
      new THREE.Vector3(520, 8.0, -220),
      new THREE.Vector3(600, 16.5, -340),
      new THREE.Vector3(530, 25.0, -420),
      new THREE.Vector3(620, 34.0, -490),
      new THREE.Vector3(560, 41.5, -530),
      new THREE.Vector3(650, 47.0, -550)
    ];

    for (let i = 0; i < mtnPoints.length - 1; i++) {
      const p1 = mtnPoints[i];
      const p2 = mtnPoints[i + 1];
      const length = p1.distanceTo(p2);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);

      const roadGeo = new THREE.BoxGeometry(15, 0.3, length + 2);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.copy(mid);
      road.rotation.y = angle;
      road.receiveShadow = true;
      this.scene.add(road);
      this.roadMeshes.push(road);

      // Red/White Crash Barrier along cliff edge
      const barGeo = new THREE.BoxGeometry(0.4, 1.15, length + 2);
      const barrier = new THREE.Mesh(barGeo, barrierMat);
      const norm = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
      barrier.position.copy(mid).add(norm.clone().multiplyScalar(7.8));
      barrier.position.y += 0.55;
      barrier.rotation.y = angle;
      this.scene.add(barrier);

      const bPos = barrier.position;
      this.roadColliders.push(new THREE.Box3(
        new THREE.Vector3(bPos.x - 2.5, bPos.y - 0.5, bPos.z - 2.5),
        new THREE.Vector3(bPos.x + 2.5, bPos.y + 3.0, bPos.z + 2.5)
      ));
    }

    // Shrine Summit Parking Terrace
    const summitGeo = new THREE.CylinderGeometry(32, 32, 0.4, 36);
    const summitRoad = new THREE.Mesh(summitGeo, roadMat);
    summitRoad.position.set(650, 47.0, -550);
    summitRoad.receiveShadow = true;
    this.scene.add(summitRoad);
  }

  // -------------------------------------------------------------
  // Barrier & Railing Collision Detection (ONLY Blocks Railings, NOT Roads!)
  // -------------------------------------------------------------
  checkCollision(pos, radius = 0.8) {
    const box = new THREE.Box3(
      new THREE.Vector3(pos.x - radius, pos.y, pos.z - radius),
      new THREE.Vector3(pos.x + radius, pos.y + 2.2, pos.z + radius)
    );

    for (let i = 0; i < this.roadColliders.length; i++) {
      if (this.roadColliders[i].intersectsBox(box)) {
        return true;
      }
    }
    return false;
  }

  update(delta) {
    for (let i = 0; i < this.intersections.length; i++) {
      const inter = this.intersections[i];
      inter.timer += delta;
      if (inter.timer > 14) inter.timer = 0;
      if (inter.timer < 6) {
        inter.state = 'green_ns';
      } else if (inter.timer < 7.5) {
        inter.state = 'yellow_ns';
      } else if (inter.timer < 12.5) {
        inter.state = 'green_ew';
      } else {
        inter.state = 'yellow_ew';
      }
    }
  }
}
