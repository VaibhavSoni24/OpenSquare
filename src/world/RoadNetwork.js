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

    this.init();
  }

  init() {
    this.buildWaypointGraph();
    this.build3DRoadMeshes();
  }

  buildWaypointGraph() {
    // -------------------------------------------------------------
    // 1. Grand Central Roundabout (Traffic Circle at x: 0, z: 0)
    // -------------------------------------------------------------
    const rbRadius = 34;
    const rbNodes = 16;
    const rbOuterWaypoints = [];
    const rbInnerWaypoints = [];

    for (let i = 0; i < rbNodes; i++) {
      const ang = (i / rbNodes) * Math.PI * 2;
      // Clockwise traffic flow
      const xOut = Math.cos(ang) * (rbRadius + 2.8);
      const zOut = Math.sin(ang) * (rbRadius + 2.8);
      const xIn = Math.cos(ang) * (rbRadius - 2.8);
      const zIn = Math.sin(ang) * (rbRadius - 2.8);

      const y = this.terrain.getElevation(xOut, zOut) + 0.12;

      const wpOut = {
        id: `rb_out_${i}`,
        position: new THREE.Vector3(xOut, y, zOut),
        direction: new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang)).normalize(),
        speedLimit: 8.0,
        next: []
      };

      const wpIn = {
        id: `rb_in_${i}`,
        position: new THREE.Vector3(xIn, y, zIn),
        direction: new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang)).normalize(),
        speedLimit: 8.0,
        next: []
      };

      rbOuterWaypoints.push(wpOut);
      rbInnerWaypoints.push(wpIn);
      this.carWaypoints.push(wpOut, wpIn);
    }

    // Connect roundabout ring loops
    for (let i = 0; i < rbNodes; i++) {
      const nextIdx = (i + 1) % rbNodes;
      rbOuterWaypoints[i].next.push(rbOuterWaypoints[nextIdx]);
      rbInnerWaypoints[i].next.push(rbInnerWaypoints[nextIdx]);
      // Lane change options
      if (i % 2 === 0) {
        rbOuterWaypoints[i].next.push(rbInnerWaypoints[nextIdx]);
        rbInnerWaypoints[i].next.push(rbOuterWaypoints[nextIdx]);
      }
    }

    // -------------------------------------------------------------
    // 2. Coastal Highway Loop (Expansive curved ring at radius ~370m)
    // -------------------------------------------------------------
    const hwyRadius = 370;
    const hwyNodes = 40;
    const hwyOuter = [];
    const hwyInner = [];

    for (let i = 0; i < hwyNodes; i++) {
      const ang = (i / hwyNodes) * Math.PI * 2;
      // Scenic natural curvature
      const r = hwyRadius + Math.sin(ang * 4) * 25 + Math.cos(ang * 2) * 15;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      const y = this.terrain.getElevation(x, z) + 0.12;

      const dir = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang)).normalize();
      const normal = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang)).normalize();

      const pOut = new THREE.Vector3(x, y, z).add(normal.clone().multiplyScalar(3.5));
      const pIn = new THREE.Vector3(x, y, z).add(normal.clone().multiplyScalar(-3.5));

      const wpOut = {
        id: `hwy_cw_${i}`,
        position: pOut,
        direction: dir.clone(),
        speedLimit: 16.0, // Highway cruising
        next: []
      };

      const wpIn = {
        id: `hwy_ccw_${i}`,
        position: pIn,
        direction: dir.clone().negate(),
        speedLimit: 16.0,
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
    // 3. Arterial Boulevards connecting Roundabout to Highway & Districts
    // -------------------------------------------------------------
    // North Avenue (To Downtown Skyscrapers & North Highway)
    this.createArterialBranch('north', 0, -38, 0, -350, rbOuterWaypoints[12], hwyOuter[30]);
    // South Avenue (To Central Park & South Highway)
    this.createArterialBranch('south', 0, 38, 0, 350, rbOuterWaypoints[4], hwyOuter[10]);
    // East Avenue (To Sakura Residential District & East Highway)
    this.createArterialBranch('east', 38, 0, 350, 0, rbOuterWaypoints[0], hwyOuter[0]);
    // West Avenue (To Commercial Harbor & West Highway)
    this.createArterialBranch('west', -38, 0, -350, 0, rbOuterWaypoints[8], hwyOuter[20]);

    // -------------------------------------------------------------
    // 4. Downtown City Grid & Commercial Avenues
    // -------------------------------------------------------------
    const dtXs = [-160, -90, -30];
    const dtZs = [-160, -90, -30];

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

        // North-South Lanes
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

        // East-West Lanes
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

        // Sidewalk corner waypoints
        const peds = [
          { dx: -7.5, dz: -7.5 },
          { dx: 7.5, dz: -7.5 },
          { dx: 7.5, dz: 7.5 },
          { dx: -7.5, dz: 7.5 }
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

    // Connect Downtown Grid internal waypoints
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
    // 5. Sakura Residential Winding Avenue Network (South-East)
    // -------------------------------------------------------------
    const resPoints = [
      new THREE.Vector3(45, 1.1, 45),
      new THREE.Vector3(95, 1.1, 65),
      new THREE.Vector3(145, 1.1, 95),
      new THREE.Vector3(195, 1.1, 140),
      new THREE.Vector3(230, 1.1, 195),
      new THREE.Vector3(250, 1.1, 260)
    ];

    for (let i = 0; i < resPoints.length - 1; i++) {
      const p1 = resPoints[i];
      const p2 = resPoints[i + 1];
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const norm = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      const wpFwd = {
        id: `sakura_fwd_${i}`,
        position: p1.clone().add(norm.clone().multiplyScalar(3.2)),
        direction: dir.clone(),
        speedLimit: 8.5,
        next: []
      };
      const wpRev = {
        id: `sakura_rev_${i}`,
        position: p2.clone().add(norm.clone().multiplyScalar(-3.2)),
        direction: dir.clone().negate(),
        speedLimit: 8.5,
        next: []
      };

      this.carWaypoints.push(wpFwd, wpRev);

      // Residential sidewalk waypoints
      this.pedestrianWaypoints.push({
        id: `sakura_ped_${i}`,
        position: p1.clone().add(norm.clone().multiplyScalar(6.5)),
        next: []
      });
    }

    // Connect residential chain
    for (let i = 0; i < resPoints.length - 2; i++) {
      const fwd1 = this.carWaypoints.find(w => w.id === `sakura_fwd_${i}`);
      const fwd2 = this.carWaypoints.find(w => w.id === `sakura_fwd_${i + 1}`);
      if (fwd1 && fwd2) fwd1.next.push(fwd2);

      const rev1 = this.carWaypoints.find(w => w.id === `sakura_rev_${i + 1}`);
      const rev2 = this.carWaypoints.find(w => w.id === `sakura_rev_${i}`);
      if (rev1 && rev2) rev1.next.push(rev2);
    }

    // Connect Sakura road to Roundabout and Highway
    const sakuraStart = this.carWaypoints.find(w => w.id === `sakura_fwd_0`);
    if (sakuraStart && rbOuterWaypoints[2]) {
      rbOuterWaypoints[2].next.push(sakuraStart);
    }

    // Interconnect pedestrian sidewalk waypoints
    for (let i = 0; i < this.pedestrianWaypoints.length; i++) {
      const p1 = this.pedestrianWaypoints[i];
      for (let j = i + 1; j < this.pedestrianWaypoints.length; j++) {
        const p2 = this.pedestrianWaypoints[j];
        const dist = p1.position.distanceTo(p2.position);
        if (dist < 45 && dist > 1.5) {
          p1.next.push(p2);
          p2.next.push(p1);
        }
      }
    }
  }

  createArterialBranch(name, x1, z1, x2, z2, rbWp, hwyWp) {
    const steps = 6;
    const fwdList = [];
    const revList = [];

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = THREE.MathUtils.lerp(x1, x2, t);
      const z = THREE.MathUtils.lerp(z1, z2, t);
      const y = this.terrain.getElevation(x, z) + 0.12;

      const dir = new THREE.Vector3(x2 - x1, 0, z2 - z1).normalize();
      const norm = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      const posFwd = new THREE.Vector3(x, y, z).add(norm.clone().multiplyScalar(3.4));
      const posRev = new THREE.Vector3(x, y, z).add(norm.clone().multiplyScalar(-3.4));

      const wpF = {
        id: `art_${name}_fwd_${s}`,
        position: posFwd,
        direction: dir.clone(),
        speedLimit: 12.0,
        next: []
      };
      const wpR = {
        id: `art_${name}_rev_${s}`,
        position: posRev,
        direction: dir.clone().negate(),
        speedLimit: 12.0,
        next: []
      };

      fwdList.push(wpF);
      revList.push(wpR);
      this.carWaypoints.push(wpF, wpR);

      // Sidewalk points along arterials
      this.pedestrianWaypoints.push({
        id: `art_ped_${name}_${s}`,
        position: new THREE.Vector3(x, y, z).add(norm.clone().multiplyScalar(7.2)),
        next: []
      });
    }

    // Chain links
    for (let s = 0; s < steps; s++) {
      fwdList[s].next.push(fwdList[s + 1]);
      revList[s + 1].next.push(revList[s]);
    }

    // Connect to Roundabout and Highway
    if (rbWp && fwdList[0]) rbWp.next.push(fwdList[0]);
    if (revList[0] && rbWp) revList[0].next.push(rbWp);
    if (hwyWp && fwdList[steps]) fwdList[steps].next.push(hwyWp);
  }

  // -------------------------------------------------------------
  // Solid 3D Road Bed, Curbs & Sidewalk Generation (Zero floating!)
  // -------------------------------------------------------------
  build3DRoadMeshes() {
    const roadMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getRoadTexture(),
      gradientMap: this.assetGen.toonGradient
    });

    const curbMat = this.assetGen.createToonMaterial(0x94a3b8);
    const sidewalkMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getPavementTexture(),
      gradientMap: this.assetGen.toonGradient
    });

    const crosswalkMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getCrosswalkTexture(),
      gradientMap: this.assetGen.toonGradient,
      transparent: true,
      opacity: 0.95
    });

    // 1. Central Roundabout 3D Ring
    const rbInner = 26;
    const rbOuter = 41;
    const rbGeo = new THREE.RingGeometry(rbInner, rbOuter, 64);
    rbGeo.rotateX(-Math.PI / 2);
    const rbMesh = new THREE.Mesh(rbGeo, roadMat);
    rbMesh.position.y = 1.08;
    rbMesh.receiveShadow = true;
    this.scene.add(rbMesh);
    this.roadMeshes.push(rbMesh);

    // Roundabout Center Island Plaza (Paved courtyard + fountain)
    const centerPlazaGeo = new THREE.CylinderGeometry(rbInner - 0.5, rbInner - 0.5, 0.45, 48);
    const centerPlaza = new THREE.Mesh(centerPlazaGeo, sidewalkMat);
    centerPlaza.position.set(0, 1.2, 0);
    centerPlaza.receiveShadow = true;

    // Center fountain inside Roundabout
    const fountainGeo = new THREE.CylinderGeometry(8, 8.5, 1.4, 24);
    const fountainMat = this.assetGen.createToonMaterial(0xffffff);
    const fountain = new THREE.Mesh(fountainGeo, fountainMat);
    fountain.position.set(0, 1.8, 0);

    const waterGeo = new THREE.CylinderGeometry(7.6, 7.6, 1.2, 24);
    const waterMat = this.assetGen.createToonMaterial(0x38bdf8, { transparent: true, opacity: 0.85 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(0, 1.9, 0);
    this.scene.add(centerPlaza, fountain, water);

    // 2. Coastal Highway Curved 3D Ring (Radius: 360m~376m, Width: 16m)
    const hwyGeo = new THREE.RingGeometry(358, 376, 96);
    hwyGeo.rotateX(-Math.PI / 2);
    const hwyMesh = new THREE.Mesh(hwyGeo, roadMat);
    hwyMesh.position.y = 1.08;
    hwyMesh.receiveShadow = true;
    this.scene.add(hwyMesh);
    this.roadMeshes.push(hwyMesh);

    // 3. Four Major Arterial Avenues (North, South, East, West) with Curbs & Sidewalks
    const makeAvenue = (x, z, length, isHorizontal) => {
      const roadW = 14;
      const curbW = 0.6;
      const walkW = 4.5;
      const totalW = roadW + (curbW + walkW) * 2;

      // Asphalt Road Slab (Solid box sitting flush on terrain!)
      const roadBoxGeo = new THREE.BoxGeometry(
        isHorizontal ? length : roadW,
        0.18,
        isHorizontal ? roadW : length
      );
      const roadSlab = new THREE.Mesh(roadBoxGeo, roadMat);
      roadSlab.position.set(x, 1.09, z);
      roadSlab.receiveShadow = true;
      this.scene.add(roadSlab);
      this.roadMeshes.push(roadSlab);

      // Raised Concrete Curbs (Beveled edge steps)
      const curbGeo = new THREE.BoxGeometry(
        isHorizontal ? length : curbW,
        0.32,
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

      // Raised Paved Sidewalks
      const walkGeo = new THREE.BoxGeometry(
        isHorizontal ? length : walkW,
        0.28,
        isHorizontal ? walkW : length
      );
      const walk1 = new THREE.Mesh(walkGeo, sidewalkMat);
      const walk2 = new THREE.Mesh(walkGeo, sidewalkMat);
      if (isHorizontal) {
        walk1.position.set(x, 1.14, z - (roadW / 2 + curbW + walkW / 2));
        walk2.position.set(x, 1.14, z + (roadW / 2 + curbW + walkW / 2));
      } else {
        walk1.position.set(x - (roadW / 2 + curbW + walkW / 2), 1.14, z);
        walk2.position.set(x + (roadW / 2 + curbW + walkW / 2), 1.14, z);
      }
      walk1.receiveShadow = true;
      walk2.receiveShadow = true;
      this.scene.add(walk1, walk2);
    };

    // North Arterial (Downtown)
    makeAvenue(0, -195, 310, false);
    // South Arterial (Central Park)
    makeAvenue(0, 195, 310, false);
    // East Arterial (Sakura Residential)
    makeAvenue(195, 0, 310, true);
    // West Arterial (Commercial Harbor)
    makeAvenue(-195, 0, 310, true);

    // 4. Downtown Internal Streets
    const downtownXs = [-160, -90, -30];
    const downtownZs = [-160, -90, -30];

    downtownXs.forEach(x => {
      makeAvenue(x, -95, 170, false);
    });
    downtownZs.forEach(z => {
      makeAvenue(-95, z, 170, true);
    });

    // 5. Crosswalks at Downtown Intersections
    this.intersections.forEach(inter => {
      const offsets = [
        { x: 0, z: -10, rot: 0 },
        { x: 0, z: 10, rot: 0 },
        { x: -10, z: 0, rot: Math.PI / 2 },
        { x: 10, z: 0, rot: Math.PI / 2 }
      ];

      offsets.forEach(off => {
        const cwGeo = new THREE.PlaneGeometry(12, 4.2);
        cwGeo.rotateX(-Math.PI / 2);
        const cw = new THREE.Mesh(cwGeo, crosswalkMat);
        cw.position.set(inter.x + off.x, 1.18, inter.z + off.z);
        cw.rotation.y = off.rot;
        cw.receiveShadow = true;
        this.scene.add(cw);
      });
    });

    // 6. Sakura Residential Winding Avenue Mesh (Curved Street with Curbs)
    const curvePoints = [
      new THREE.Vector3(45, 1.1, 45),
      new THREE.Vector3(95, 1.1, 65),
      new THREE.Vector3(145, 1.1, 95),
      new THREE.Vector3(195, 1.1, 140),
      new THREE.Vector3(230, 1.1, 195),
      new THREE.Vector3(250, 1.1, 260)
    ];

    for (let i = 0; i < curvePoints.length - 1; i++) {
      const p1 = curvePoints[i];
      const p2 = curvePoints[i + 1];
      const segLength = p1.distanceTo(p2);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);

      const segGeo = new THREE.BoxGeometry(11, 0.16, segLength + 1);
      const segMesh = new THREE.Mesh(segGeo, roadMat);
      segMesh.position.set(mid.x, 1.1, mid.z);
      segMesh.rotation.y = angle;
      segMesh.receiveShadow = true;
      this.scene.add(segMesh);
      this.roadMeshes.push(segMesh);
    }
  }

  update(delta) {
    // Cycle traffic light signals
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
