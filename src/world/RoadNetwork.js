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
    this.roadColliders = []; // Railing & barrier colliders

    this.init();
  }

  init() {
    this.buildWaypointGraph();
    this.build3DRoadAndBridgeMeshes();
  }

  buildWaypointGraph() {
    // -------------------------------------------------------------
    // 1. Grand Central Roundabout (Radius: 40m at x: 0, z: 0)
    // -------------------------------------------------------------
    const rbRadius = 40;
    const rbNodes = 20;
    const rbOuterWaypoints = [];
    const rbInnerWaypoints = [];

    for (let i = 0; i < rbNodes; i++) {
      const ang = (i / rbNodes) * Math.PI * 2;
      const xOut = Math.cos(ang) * (rbRadius + 3.2);
      const zOut = Math.sin(ang) * (rbRadius + 3.2);
      const xIn = Math.cos(ang) * (rbRadius - 3.2);
      const zIn = Math.sin(ang) * (rbRadius - 3.2);

      const y = this.terrain.getElevation(xOut, zOut) + 0.12;
      const dir = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang)).normalize();

      const wpOut = {
        id: `rb_out_${i}`,
        position: new THREE.Vector3(xOut, y, zOut),
        direction: dir.clone(),
        speedLimit: 9.0,
        next: []
      };
      const wpIn = {
        id: `rb_in_${i}`,
        position: new THREE.Vector3(xIn, y, zIn),
        direction: dir.clone(),
        speedLimit: 9.0,
        next: []
      };

      rbOuterWaypoints.push(wpOut);
      rbInnerWaypoints.push(wpIn);
      this.carWaypoints.push(wpOut, wpIn);
    }

    for (let i = 0; i < rbNodes; i++) {
      const nextIdx = (i + 1) % rbNodes;
      rbOuterWaypoints[i].next.push(rbOuterWaypoints[nextIdx]);
      rbInnerWaypoints[i].next.push(rbInnerWaypoints[nextIdx]);
      if (i % 2 === 0) {
        rbOuterWaypoints[i].next.push(rbInnerWaypoints[nextIdx]);
        rbInnerWaypoints[i].next.push(rbOuterWaypoints[nextIdx]);
      }
    }

    // -------------------------------------------------------------
    // 2. Extra-Large Coastal Highway Loop (Radius ~650m)
    // -------------------------------------------------------------
    const hwyRadius = 650;
    const hwyNodes = 48;
    const hwyOuter = [];
    const hwyInner = [];

    for (let i = 0; i < hwyNodes; i++) {
      const ang = (i / hwyNodes) * Math.PI * 2;
      const r = hwyRadius + Math.sin(ang * 3) * 35 + Math.cos(ang * 2) * 20;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      const y = this.terrain.getElevation(x, z) + 0.12;

      const dir = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang)).normalize();
      const norm = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang)).normalize();

      const wpOut = {
        id: `hwy_cw_${i}`,
        position: new THREE.Vector3(x, y, z).add(norm.clone().multiplyScalar(4.0)),
        direction: dir.clone(),
        speedLimit: 18.0, // Fast scenic coastal cruise
        next: []
      };
      const wpIn = {
        id: `hwy_ccw_${i}`,
        position: new THREE.Vector3(x, y, z).add(norm.clone().multiplyScalar(-4.0)),
        direction: dir.clone().negate(),
        speedLimit: 18.0,
        next: []
      };

      hwyOuter.push(wpOut);
      hwyInner.push(wpIn);
      this.carWaypoints.push(wpOut, wpIn);
    }

    for (let i = 0; i < hwyNodes; i++) {
      hwyOuter[i].next.push(hwyOuter[(i + 1) % hwyNodes]);
      hwyInner[i].next.push(hwyInner[(i - 1 + hwyNodes) % hwyNodes]);
    }

    // -------------------------------------------------------------
    // 3. Four Grand Arterial Avenues (Length 550m each)
    // -------------------------------------------------------------
    this.createArterialBranch('north', 0, -46, 0, -620, rbOuterWaypoints[15], hwyOuter[36]);
    this.createArterialBranch('south', 0, 46, 0, 620, rbOuterWaypoints[5], hwyOuter[12]);
    this.createArterialBranch('east', 46, 0, 620, 0, rbOuterWaypoints[0], hwyOuter[0]);
    this.createArterialBranch('west', -46, 0, -620, 0, rbOuterWaypoints[10], hwyOuter[24]);

    // -------------------------------------------------------------
    // 4. Mount Sakura Mountain Switchback Pass (Ascending to y = 32m)
    // -------------------------------------------------------------
    const mtnPoints = [
      new THREE.Vector3(120, 1.1, -220),
      new THREE.Vector3(160, 6.5, -280),
      new THREE.Vector3(210, 14.0, -320),
      new THREE.Vector3(170, 21.0, -380), // Hairpin 1
      new THREE.Vector3(230, 27.0, -410), // Hairpin 2
      new THREE.Vector3(275, 32.5, -450)  // Shrine Terrace Peak
    ];

    for (let i = 0; i < mtnPoints.length - 1; i++) {
      const p1 = mtnPoints[i];
      const p2 = mtnPoints[i + 1];
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const norm = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      const wpClimb = {
        id: `mtn_up_${i}`,
        position: p1.clone().add(norm.clone().multiplyScalar(3.0)),
        direction: dir.clone(),
        speedLimit: 9.0, // Switchback control
        next: []
      };
      const wpDescend = {
        id: `mtn_down_${i}`,
        position: p2.clone().add(norm.clone().multiplyScalar(-3.0)),
        direction: dir.clone().negate(),
        speedLimit: 9.0,
        next: []
      };

      this.carWaypoints.push(wpClimb, wpDescend);

      // Mountain pedestrian path
      this.pedestrianWaypoints.push({
        id: `mtn_ped_${i}`,
        position: p1.clone().add(norm.clone().multiplyScalar(6.5)),
        next: []
      });
    }

    for (let i = 0; i < mtnPoints.length - 2; i++) {
      const u1 = this.carWaypoints.find(w => w.id === `mtn_up_${i}`);
      const u2 = this.carWaypoints.find(w => w.id === `mtn_up_${i + 1}`);
      if (u1 && u2) u1.next.push(u2);

      const d1 = this.carWaypoints.find(w => w.id === `mtn_down_${i + 1}`);
      const d2 = this.carWaypoints.find(w => w.id === `mtn_down_${i}`);
      if (d1 && d2) d1.next.push(d2);
    }

    // Connect Mountain road to North Avenue
    const mtnStart = this.carWaypoints.find(w => w.id === `mtn_up_0`);
    const northArtWp = this.carWaypoints.find(w => w.id === `art_north_fwd_2`);
    if (mtnStart && northArtWp) northArtWp.next.push(mtnStart);

    // -------------------------------------------------------------
    // 5. Metropolis Downtown Commercial Grid
    // -------------------------------------------------------------
    const dtXs = [-280, -190, -100];
    const dtZs = [-120, -30, 60, 150];

    dtXs.forEach((x, xi) => {
      dtZs.forEach((z, zi) => {
        const y = this.terrain.getElevation(x, z) + 0.12;
        const intersection = {
          id: `dt_inter_${xi}_${zi}`,
          x, z, y,
          state: 'green_ns',
          timer: Math.random() * 8
        };
        this.intersections.push(intersection);

        const nsFwd = {
          id: `dt_ns_fwd_${xi}_${zi}`,
          position: new THREE.Vector3(x + 3.2, y, z),
          direction: new THREE.Vector3(0, 0, 1),
          speedLimit: 10.0,
          intersectionId: intersection.id,
          next: []
        };
        const nsRev = {
          id: `dt_ns_rev_${xi}_${zi}`,
          position: new THREE.Vector3(x - 3.2, y, z),
          direction: new THREE.Vector3(0, 0, -1),
          speedLimit: 10.0,
          intersectionId: intersection.id,
          next: []
        };

        const ewFwd = {
          id: `dt_ew_fwd_${xi}_${zi}`,
          position: new THREE.Vector3(x, y, z + 3.2),
          direction: new THREE.Vector3(1, 0, 0),
          speedLimit: 10.0,
          intersectionId: intersection.id,
          next: []
        };
        const ewRev = {
          id: `dt_ew_rev_${xi}_${zi}`,
          position: new THREE.Vector3(x, y, z - 3.2),
          direction: new THREE.Vector3(-1, 0, 0),
          speedLimit: 10.0,
          intersectionId: intersection.id,
          next: []
        };

        this.carWaypoints.push(nsFwd, nsRev, ewFwd, ewRev);

        // Sidewalk waypoints
        const peds = [
          { dx: -8.0, dz: -8.0 },
          { dx: 8.0, dz: -8.0 },
          { dx: 8.0, dz: 8.0 },
          { dx: -8.0, dz: 8.0 }
        ];
        peds.forEach((p, pi) => {
          this.pedestrianWaypoints.push({
            id: `dt_ped_${xi}_${zi}_${pi}`,
            position: new THREE.Vector3(x + p.dx, y + 0.08, z + p.dz),
            next: []
          });
        });
      });
    });

    // Connect Downtown Grid waypoints
    for (let xi = 0; xi < dtXs.length; xi++) {
      for (let zi = 0; zi < dtZs.length; zi++) {
        if (zi < dtZs.length - 1) {
          const from = this.carWaypoints.find(w => w.id === `dt_ns_fwd_${xi}_${zi}`);
          const to = this.carWaypoints.find(w => w.id === `dt_ns_fwd_${xi}_${zi + 1}`);
          if (from && to) from.next.push(to);
        }
        if (zi > 0) {
          const from = this.carWaypoints.find(w => w.id === `dt_ns_rev_${xi}_${zi}`);
          const to = this.carWaypoints.find(w => w.id === `dt_ns_rev_${xi}_${zi - 1}`);
          if (from && to) from.next.push(to);
        }
        if (xi < dtXs.length - 1) {
          const from = this.carWaypoints.find(w => w.id === `dt_ew_fwd_${xi}_${zi}`);
          const to = this.carWaypoints.find(w => w.id === `dt_ew_fwd_${xi + 1}_${zi}`);
          if (from && to) from.next.push(to);
        }
        if (xi > 0) {
          const from = this.carWaypoints.find(w => w.id === `dt_ew_rev_${xi}_${zi}`);
          const to = this.carWaypoints.find(w => w.id === `dt_ew_rev_${xi - 1}_${zi}`);
          if (from && to) from.next.push(to);
        }
      }
    }

    // -------------------------------------------------------------
    // 6. Sakura Old Town Winding Suburban Roads (South-East)
    // -------------------------------------------------------------
    const resPoints = [
      new THREE.Vector3(60, 1.1, 60),
      new THREE.Vector3(130, 1.3, 90),
      new THREE.Vector3(200, 1.6, 130),
      new THREE.Vector3(260, 2.0, 190),
      new THREE.Vector3(330, 2.4, 260),
      new THREE.Vector3(410, 2.8, 340),
      new THREE.Vector3(480, 2.5, 430)
    ];

    for (let i = 0; i < resPoints.length - 1; i++) {
      const p1 = resPoints[i];
      const p2 = resPoints[i + 1];
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const norm = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      const wpFwd = {
        id: `res_fwd_${i}`,
        position: p1.clone().add(norm.clone().multiplyScalar(3.2)),
        direction: dir.clone(),
        speedLimit: 8.5,
        next: []
      };
      const wpRev = {
        id: `res_rev_${i}`,
        position: p2.clone().add(norm.clone().multiplyScalar(-3.2)),
        direction: dir.clone().negate(),
        speedLimit: 8.5,
        next: []
      };

      this.carWaypoints.push(wpFwd, wpRev);

      this.pedestrianWaypoints.push({
        id: `res_ped_${i}`,
        position: p1.clone().add(norm.clone().multiplyScalar(6.8)),
        next: []
      });
    }

    for (let i = 0; i < resPoints.length - 2; i++) {
      const f1 = this.carWaypoints.find(w => w.id === `res_fwd_${i}`);
      const f2 = this.carWaypoints.find(w => w.id === `res_fwd_${i + 1}`);
      if (f1 && f2) f1.next.push(f2);

      const r1 = this.carWaypoints.find(w => w.id === `res_rev_${i + 1}`);
      const r2 = this.carWaypoints.find(w => w.id === `res_rev_${i}`);
      if (r1 && r2) r1.next.push(r2);
    }

    // Connect Sakura road to Roundabout and Highway
    const resStart = this.carWaypoints.find(w => w.id === `res_fwd_0`);
    if (resStart && rbOuterWaypoints[3]) {
      rbOuterWaypoints[3].next.push(resStart);
    }

    // Interconnect pedestrian sidewalk waypoints
    for (let i = 0; i < this.pedestrianWaypoints.length; i++) {
      const p1 = this.pedestrianWaypoints[i];
      for (let j = i + 1; j < this.pedestrianWaypoints.length; j++) {
        const p2 = this.pedestrianWaypoints[j];
        const dist = p1.position.distanceTo(p2.position);
        if (dist < 48 && dist > 1.8) {
          p1.next.push(p2);
          p2.next.push(p1);
        }
      }
    }
  }

  createArterialBranch(name, x1, z1, x2, z2, rbWp, hwyWp) {
    const steps = 8;
    const fwdList = [];
    const revList = [];

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = THREE.MathUtils.lerp(x1, x2, t);
      const z = THREE.MathUtils.lerp(z1, z2, t);
      const y = this.terrain.getElevation(x, z) + 0.12;

      const dir = new THREE.Vector3(x2 - x1, 0, z2 - z1).normalize();
      const norm = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      const wpF = {
        id: `art_${name}_fwd_${s}`,
        position: new THREE.Vector3(x, y, z).add(norm.clone().multiplyScalar(3.5)),
        direction: dir.clone(),
        speedLimit: 14.0,
        next: []
      };
      const wpR = {
        id: `art_${name}_rev_${s}`,
        position: new THREE.Vector3(x, y, z).add(norm.clone().multiplyScalar(-3.5)),
        direction: dir.clone().negate(),
        speedLimit: 14.0,
        next: []
      };

      fwdList.push(wpF);
      revList.push(wpR);
      this.carWaypoints.push(wpF, wpR);

      this.pedestrianWaypoints.push({
        id: `art_ped_${name}_${s}`,
        position: new THREE.Vector3(x, y, z).add(norm.clone().multiplyScalar(7.5)),
        next: []
      });
    }

    for (let s = 0; s < steps; s++) {
      fwdList[s].next.push(fwdList[s + 1]);
      revList[s + 1].next.push(revList[s]);
    }

    if (rbWp && fwdList[0]) rbWp.next.push(fwdList[0]);
    if (revList[0] && rbWp) revList[0].next.push(rbWp);
    if (hwyWp && fwdList[steps]) fwdList[steps].next.push(hwyWp);
  }

  // -------------------------------------------------------------
  // Solid 3D Road Beds, Bridges, Railings & Curbs (Zero floating!)
  // -------------------------------------------------------------
  build3DRoadAndBridgeMeshes() {
    const roadMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getRoadTexture(),
      gradientMap: this.assetGen.toonGradient
    });

    const curbMat = this.assetGen.createToonMaterial(0x94a3b8);
    const sidewalkMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getPavementTexture(),
      gradientMap: this.assetGen.toonGradient
    });

    const bridgeSteelMat = this.assetGen.createToonMaterial(0xef4444); // Iconic Japanese vermilion red steel bridge
    const railingMat = this.assetGen.createToonMaterial(0xffffff);

    // 1. Grand Central Roundabout (3D Solid Ring & Center Island)
    const rbInner = 32;
    const rbOuter = 48;
    const rbGeo = new THREE.RingGeometry(rbInner, rbOuter, 64);
    rbGeo.rotateX(-Math.PI / 2);
    const rbMesh = new THREE.Mesh(rbGeo, roadMat);
    rbMesh.position.y = 1.09;
    rbMesh.receiveShadow = true;
    this.scene.add(rbMesh);
    this.roadMeshes.push(rbMesh);

    // Center Landscaped Island Plaza
    const centerPlazaGeo = new THREE.CylinderGeometry(rbInner - 0.5, rbInner - 0.5, 0.45, 48);
    const centerPlaza = new THREE.Mesh(centerPlazaGeo, sidewalkMat);
    centerPlaza.position.set(0, 1.2, 0);
    centerPlaza.receiveShadow = true;

    // Center fountain inside Roundabout
    const fountainGeo = new THREE.CylinderGeometry(10, 10.5, 1.6, 24);
    const fountainMat = this.assetGen.createToonMaterial(0xffffff);
    const fountain = new THREE.Mesh(fountainGeo, fountainMat);
    fountain.position.set(0, 1.9, 0);

    const waterGeo = new THREE.CylinderGeometry(9.6, 9.6, 1.4, 24);
    const waterMat = this.assetGen.createToonMaterial(0x38bdf8, { transparent: true, opacity: 0.88 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(0, 2.0, 0);
    this.scene.add(centerPlaza, fountain, water);

    // 2. Coastal Highway Curved 3D Ring (Radius: 638m ~ 662m, Width: 24m)
    const hwyGeo = new THREE.RingGeometry(638, 662, 128);
    hwyGeo.rotateX(-Math.PI / 2);
    const hwyMesh = new THREE.Mesh(hwyGeo, roadMat);
    hwyMesh.position.y = 1.09;
    hwyMesh.receiveShadow = true;
    this.scene.add(hwyMesh);
    this.roadMeshes.push(hwyMesh);

    // 3. Four Major Arterial Avenues (North, South, East, West) with Curbs & Sidewalks
    const makeAvenue = (x, z, length, isHorizontal) => {
      const roadW = 15;
      const curbW = 0.6;
      const walkW = 4.8;

      const roadBoxGeo = new THREE.BoxGeometry(
        isHorizontal ? length : roadW,
        0.2,
        isHorizontal ? roadW : length
      );
      const roadSlab = new THREE.Mesh(roadBoxGeo, roadMat);
      roadSlab.position.set(x, 1.09, z);
      roadSlab.receiveShadow = true;
      this.scene.add(roadSlab);
      this.roadMeshes.push(roadSlab);

      // Concrete Curbs
      const curbGeo = new THREE.BoxGeometry(
        isHorizontal ? length : curbW,
        0.34,
        isHorizontal ? curbW : length
      );
      const curb1 = new THREE.Mesh(curbGeo, curbMat);
      const curb2 = new THREE.Mesh(curbGeo, curbMat);
      if (isHorizontal) {
        curb1.position.set(x, 1.16, z - (roadW / 2 + curbW / 2));
        curb2.position.set(x, 1.16, z + (roadW / 2 + curbW / 2));
      } else {
        curb1.position.set(x - (roadW / 2 + curbW / 2), 1.16, z);
        curb2.position.set(x + (roadW / 2 + curbW / 2), 1.16, z);
      }
      this.scene.add(curb1, curb2);

      // Sidewalks
      const walkGeo = new THREE.BoxGeometry(
        isHorizontal ? length : walkW,
        0.3,
        isHorizontal ? walkW : length
      );
      const walk1 = new THREE.Mesh(walkGeo, sidewalkMat);
      const walk2 = new THREE.Mesh(walkGeo, sidewalkMat);
      if (isHorizontal) {
        walk1.position.set(x, 1.15, z - (roadW / 2 + curbW + walkW / 2));
        walk2.position.set(x, 1.15, z + (roadW / 2 + curbW + walkW / 2));
      } else {
        walk1.position.set(x - (roadW / 2 + curbW + walkW / 2), 1.15, z);
        walk2.position.set(x + (roadW / 2 + curbW + walkW / 2), 1.15, z);
      }
      walk1.receiveShadow = true;
      walk2.receiveShadow = true;
      this.scene.add(walk1, walk2);
    };

    // North Avenue (Length: 560m)
    makeAvenue(0, -330, 560, false);
    // South Avenue (Length: 560m)
    makeAvenue(0, 330, 560, false);
    // East Avenue (Length: 560m)
    makeAvenue(330, 0, 560, true);
    // West Avenue (Length: 560m)
    makeAvenue(-330, 0, 560, true);

    // 4. Downtown Streets
    const downtownXs = [-280, -190, -100];
    const downtownZs = [-120, -30, 60, 150];

    downtownXs.forEach(x => {
      makeAvenue(x, 15, 300, false);
    });
    downtownZs.forEach(z => {
      makeAvenue(-190, z, 200, true);
    });

    // 5. Grand Metropolis River Bridge (Crossing river at x: -330, z: -40)
    this.buildRiverBridge(bridgeSteelMat, roadMat, sidewalkMat);

    // 6. Mountain Switchback Pass (Mount Sakura) with Crash Barriers
    this.buildMountainPass(roadMat);

    // 7. Sakura Old Town Winding Suburban Roads
    this.buildSakuraResidentialRoads(roadMat);
  }

  // Grand Truss River Bridge over River Channel
  buildRiverBridge(steelMat, roadMat, sidewalkMat) {
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(-330, 1.25, -35);
    bridgeGroup.rotation.y = 0.38; // Matches river perpendicular

    // Solid Bridge Deck (Length: 48m, Width: 18m)
    const deckGeo = new THREE.BoxGeometry(18, 0.8, 52);
    const deck = new THREE.Mesh(deckGeo, roadMat);
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    // Heavy Concrete Abutments on both river banks
    const abutMat = this.assetGen.createToonMaterial(0x475569);
    const abutGeo = new THREE.BoxGeometry(22, 5.0, 8);
    const abut1 = new THREE.Mesh(abutGeo, abutMat);
    abut1.position.set(0, -2.0, -26);
    const abut2 = new THREE.Mesh(abutGeo, abutMat);
    abut2.position.set(0, -2.0, 26);
    bridgeGroup.add(abut1, abut2);

    // Red Steel Arched Trusses & Overhead Beams
    const trussGeo = new THREE.BoxGeometry(0.8, 6.5, 52);
    const trussL = new THREE.Mesh(trussGeo, steelMat);
    trussL.position.set(-9.2, 3.2, 0);
    const trussR = new THREE.Mesh(trussGeo, steelMat);
    trussR.position.set(9.2, 3.2, 0);
    bridgeGroup.add(trussL, trussR);

    // Cross beams overhead
    for (let c = -20; c <= 20; c += 10) {
      const beamGeo = new THREE.BoxGeometry(18.4, 0.6, 0.8);
      const beam = new THREE.Mesh(beamGeo, steelMat);
      beam.position.set(0, 6.4, c);
      bridgeGroup.add(beam);
    }

    this.scene.add(bridgeGroup);

    // Add Bridge Railing Colliders so player/car cannot fall into river!
    this.roadColliders.push(
      new THREE.Box3(new THREE.Vector3(-342, 1.0, -60), new THREE.Vector3(-336, 6.0, -10)),
      new THREE.Box3(new THREE.Vector3(-324, 1.0, -60), new THREE.Vector3(-318, 6.0, -10))
    );
  }

  // Mountain Switchback Road Climbing Mount Sakura with Safety Guardrails
  buildMountainPass(roadMat) {
    const barrierMat = this.assetGen.createToonMaterial(0xdc2626); // Red and white barrier
    const mtnPoints = [
      new THREE.Vector3(120, 1.1, -220),
      new THREE.Vector3(160, 6.5, -280),
      new THREE.Vector3(210, 14.0, -320),
      new THREE.Vector3(170, 21.0, -380),
      new THREE.Vector3(230, 27.0, -410),
      new THREE.Vector3(275, 32.5, -450)
    ];

    for (let i = 0; i < mtnPoints.length - 1; i++) {
      const p1 = mtnPoints[i];
      const p2 = mtnPoints[i + 1];
      const length = p1.distanceTo(p2);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);

      // Road bed slab
      const mtnRoadGeo = new THREE.BoxGeometry(11.5, 0.25, length + 2);
      const mtnRoad = new THREE.Mesh(mtnRoadGeo, roadMat);
      mtnRoad.position.copy(mid);
      mtnRoad.rotation.y = angle;
      mtnRoad.receiveShadow = true;
      this.scene.add(mtnRoad);
      this.roadMeshes.push(mtnRoad);

      // Red/White Crash Barrier along cliff edge
      const barGeo = new THREE.BoxGeometry(0.4, 1.1, length + 2);
      const barrier = new THREE.Mesh(barGeo, barrierMat);
      const norm = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
      barrier.position.copy(mid).add(norm.clone().multiplyScalar(5.9));
      barrier.position.y += 0.55;
      barrier.rotation.y = angle;
      this.scene.add(barrier);

      // Barrier collider along cliff edge
      const bPos = barrier.position;
      this.roadColliders.push(new THREE.Box3(
        new THREE.Vector3(bPos.x - 2.0, bPos.y - 0.5, bPos.z - 2.0),
        new THREE.Vector3(bPos.x + 2.0, bPos.y + 3.0, bPos.z + 2.0)
      ));
    }
  }

  // Sakura Old Town Winding Suburban Roads
  buildSakuraResidentialRoads(roadMat) {
    const resPoints = [
      new THREE.Vector3(60, 1.1, 60),
      new THREE.Vector3(130, 1.3, 90),
      new THREE.Vector3(200, 1.6, 130),
      new THREE.Vector3(260, 2.0, 190),
      new THREE.Vector3(330, 2.4, 260),
      new THREE.Vector3(410, 2.8, 340),
      new THREE.Vector3(480, 2.5, 430)
    ];

    for (let i = 0; i < resPoints.length - 1; i++) {
      const p1 = resPoints[i];
      const p2 = resPoints[i + 1];
      const segLength = p1.distanceTo(p2);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);

      const segGeo = new THREE.BoxGeometry(12, 0.2, segLength + 2);
      const segMesh = new THREE.Mesh(segGeo, roadMat);
      segMesh.position.copy(mid);
      segMesh.rotation.y = angle;
      segMesh.receiveShadow = true;
      this.scene.add(segMesh);
      this.roadMeshes.push(segMesh);
    }
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

  // Check road barrier and bridge railing collision
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
}
