import * as THREE from 'three';

export class RoadNetwork {
  constructor(scene, assetGen, islandTerrain) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.terrain = islandTerrain;

    // Traffic lane waypoints (directed graph for car AI)
    this.carWaypoints = [];
    // Sidewalk waypoints (for pedestrian AI)
    this.pedestrianWaypoints = [];

    // Intersections and traffic lights
    this.intersections = [];
    this.trafficLights = [];

    this.roadMeshes = [];
    this.init();
  }

  init() {
    this.buildWaypointGraph();
    this.generateRoadGeometry();
    this.generateSidewalksAndCrosswalks();
  }

  buildWaypointGraph() {
    // 1. Downtown Boulevard Grid:
    // Avenues at X = -80, 0, 80; Streets at Z = -80, 0, 80
    const downtownXs = [-90, 0, 90];
    const downtownZs = [-90, 0, 90];

    // 2. Coastal Highway:
    // Perimeter loop at radius ~250m
    const highwayRadius = 260;
    const highwayPoints = [];
    const count = 32;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * (highwayRadius + Math.sin(angle * 3) * 20);
      const z = Math.sin(angle) * (highwayRadius + Math.cos(angle * 2) * 20);
      highwayPoints.push(new THREE.Vector3(x, 0, z));
    }

    // Connect highway loop (Clockwise outer lane, Counter-Clockwise inner lane)
    for (let i = 0; i < highwayPoints.length; i++) {
      const pCurrent = highwayPoints[i];
      const pNext = highwayPoints[(i + 1) % highwayPoints.length];
      const dir = new THREE.Vector3().subVectors(pNext, pCurrent).normalize();
      const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      // Outer lane (offset right +3.5m)
      const outerPos = pCurrent.clone().add(right.clone().multiplyScalar(3.5));
      outerPos.y = this.terrain.getElevation(outerPos.x, outerPos.z) + 0.15;

      // Inner lane (offset left -3.5m, moving reverse)
      const innerPos = pCurrent.clone().add(right.clone().multiplyScalar(-3.5));
      innerPos.y = this.terrain.getElevation(innerPos.x, innerPos.z) + 0.15;

      const wpOuter = {
        id: `hwy_cw_${i}`,
        position: outerPos,
        direction: dir.clone(),
        speedLimit: 14.0, // Highway cruising
        lane: 'outer',
        next: []
      };

      const wpInner = {
        id: `hwy_ccw_${i}`,
        position: innerPos,
        direction: dir.clone().negate(),
        speedLimit: 14.0,
        lane: 'inner',
        next: []
      };

      this.carWaypoints.push(wpOuter, wpInner);
    }

    // Link consecutive highway waypoints
    const hwyOuterList = this.carWaypoints.filter(w => w.lane === 'outer');
    const hwyInnerList = this.carWaypoints.filter(w => w.lane === 'inner');
    for (let i = 0; i < hwyOuterList.length; i++) {
      hwyOuterList[i].next.push(hwyOuterList[(i + 1) % hwyOuterList.length]);
      // Inner moves reverse
      const prevIdx = (i - 1 + hwyInnerList.length) % hwyInnerList.length;
      hwyInnerList[i].next.push(hwyInnerList[prevIdx]);
    }

    // 3. Downtown Grid Roads:
    // Generate Avenue segments and links
    downtownXs.forEach((x, xi) => {
      downtownZs.forEach((z, zi) => {
        const y = this.terrain.getElevation(x, z) + 0.15;
        const intersection = {
          id: `inter_${xi}_${zi}`,
          x, z, y,
          state: 'green_ns', // Cycles green_ns -> yellow_ns -> green_ew -> yellow_ew
          timer: Math.random() * 8
        };
        this.intersections.push(intersection);

        // North-South lanes
        const nsForward = {
          id: `dt_ns_fwd_${xi}_${zi}`,
          position: new THREE.Vector3(x + 3.2, y, z),
          direction: new THREE.Vector3(0, 0, 1),
          speedLimit: 9.0,
          intersectionId: intersection.id,
          next: []
        };
        const nsReverse = {
          id: `dt_ns_rev_${xi}_${zi}`,
          position: new THREE.Vector3(x - 3.2, y, z),
          direction: new THREE.Vector3(0, 0, -1),
          speedLimit: 9.0,
          intersectionId: intersection.id,
          next: []
        };

        // East-West lanes
        const ewForward = {
          id: `dt_ew_fwd_${xi}_${zi}`,
          position: new THREE.Vector3(x, y, z + 3.2),
          direction: new THREE.Vector3(1, 0, 0),
          speedLimit: 9.0,
          intersectionId: intersection.id,
          next: []
        };
        const ewReverse = {
          id: `dt_ew_rev_${xi}_${zi}`,
          position: new THREE.Vector3(x, y, z - 3.2),
          direction: new THREE.Vector3(-1, 0, 0),
          speedLimit: 9.0,
          intersectionId: intersection.id,
          next: []
        };

        this.carWaypoints.push(nsForward, nsReverse, ewForward, ewReverse);

        // Add 4-corner Pedestrian Sidewalk waypoints around intersection
        const pedOffsets = [
          { dx: -7.5, dz: -7.5 },
          { dx: 7.5, dz: -7.5 },
          { dx: 7.5, dz: 7.5 },
          { dx: -7.5, dz: 7.5 }
        ];

        pedOffsets.forEach((off, pi) => {
          this.pedestrianWaypoints.push({
            id: `ped_${xi}_${zi}_${pi}`,
            position: new THREE.Vector3(x + off.dx, y + 0.1, z + off.dz),
            isCrosswalk: false,
            next: []
          });
        });
      });
    });

    // Connect Downtown Grid waypoints to neighboring intersections
    this.connectDowntownWaypoints(downtownXs, downtownZs);

    // Connect Highway to Downtown Grid via 4 arterial connector roads
    this.connectArterials(downtownXs, downtownZs, hwyOuterList, hwyInnerList);

    // Build connections between pedestrian sidewalk waypoints
    this.connectPedestrianWaypoints();
  }

  connectDowntownWaypoints(xs, zs) {
    for (let xi = 0; xi < xs.length; xi++) {
      for (let zi = 0; zi < zs.length; zi++) {
        // NS Forward connection (zi -> zi + 1)
        if (zi < zs.length - 1) {
          const from = this.carWaypoints.find(w => w.id === `dt_ns_fwd_${xi}_${zi}`);
          const to = this.carWaypoints.find(w => w.id === `dt_ns_fwd_${xi}_${zi + 1}`);
          if (from && to) from.next.push(to);
        }
        // NS Reverse connection (zi + 1 -> zi)
        if (zi > 0) {
          const from = this.carWaypoints.find(w => w.id === `dt_ns_rev_${xi}_${zi}`);
          const to = this.carWaypoints.find(w => w.id === `dt_ns_rev_${xi}_${zi - 1}`);
          if (from && to) from.next.push(to);
        }
        // EW Forward connection (xi -> xi + 1)
        if (xi < xs.length - 1) {
          const from = this.carWaypoints.find(w => w.id === `dt_ew_fwd_${xi}_${zi}`);
          const to = this.carWaypoints.find(w => w.id === `dt_ew_fwd_${xi + 1}_${zi}`);
          if (from && to) from.next.push(to);
        }
        // EW Reverse connection (xi + 1 -> xi)
        if (xi > 0) {
          const from = this.carWaypoints.find(w => w.id === `dt_ew_rev_${xi}_${zi}`);
          const to = this.carWaypoints.find(w => w.id === `dt_ew_rev_${xi - 1}_${zi}`);
          if (from && to) from.next.push(to);
        }

        // At intersections, cars have a chance to turn left or right
        const nsFwd = this.carWaypoints.find(w => w.id === `dt_ns_fwd_${xi}_${zi}`);
        const ewFwd = this.carWaypoints.find(w => w.id === `dt_ew_fwd_${xi}_${zi}`);
        const nsRev = this.carWaypoints.find(w => w.id === `dt_ns_rev_${xi}_${zi}`);
        const ewRev = this.carWaypoints.find(w => w.id === `dt_ew_rev_${xi}_${zi}`);

        if (nsFwd && ewFwd && xi < xs.length - 1) nsFwd.next.push(ewFwd);
        if (nsFwd && ewRev && xi > 0) nsFwd.next.push(ewRev);
        if (ewFwd && nsFwd && zi < zs.length - 1) ewFwd.next.push(nsFwd);
        if (ewFwd && nsRev && zi > 0) ewFwd.next.push(nsRev);
      }
    }
  }

  connectArterials(xs, zs, hwyOuter, hwyInner) {
    // Connect North, South, East, West edges of downtown grid to closest highway nodes
    const northEdge = this.carWaypoints.find(w => w.id === `dt_ns_rev_1_0`);
    const southEdge = this.carWaypoints.find(w => w.id === `dt_ns_fwd_1_${zs.length - 1}`);
    const eastEdge = this.carWaypoints.find(w => w.id === `dt_ew_fwd_${xs.length - 1}_1`);
    const westEdge = this.carWaypoints.find(w => w.id === `dt_ew_rev_0_1`);

    if (northEdge && hwyOuter.length > 0) {
      const closest = this.findClosestWaypoint(northEdge.position, hwyOuter);
      if (closest) northEdge.next.push(closest);
    }
    if (southEdge && hwyInner.length > 0) {
      const closest = this.findClosestWaypoint(southEdge.position, hwyInner);
      if (closest) southEdge.next.push(closest);
    }
    if (eastEdge && hwyOuter.length > 0) {
      const closest = this.findClosestWaypoint(eastEdge.position, hwyOuter);
      if (closest) eastEdge.next.push(closest);
    }
    if (westEdge && hwyInner.length > 0) {
      const closest = this.findClosestWaypoint(westEdge.position, hwyInner);
      if (closest) westEdge.next.push(closest);
    }
  }

  connectPedestrianWaypoints() {
    // Interconnect nearby sidewalk points (< 40m apart) so pedestrians can wander throughout the city
    for (let i = 0; i < this.pedestrianWaypoints.length; i++) {
      const p1 = this.pedestrianWaypoints[i];
      for (let j = i + 1; j < this.pedestrianWaypoints.length; j++) {
        const p2 = this.pedestrianWaypoints[j];
        const dist = p1.position.distanceTo(p2.position);
        if (dist < 45 && dist > 2) {
          p1.next.push(p2);
          p2.next.push(p1);
        }
      }
    }
  }

  findClosestWaypoint(pos, list) {
    let closest = null;
    let minDist = Infinity;
    for (let i = 0; i < list.length; i++) {
      const d = pos.distanceTo(list[i].position);
      if (d < minDist) {
        minDist = d;
        closest = list[i];
      }
    }
    return closest;
  }

  generateRoadGeometry() {
    const roadMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getRoadTexture(),
      gradientMap: this.assetGen.toonGradient
    });

    // 1. Downtown Roads (X and Z avenues)
    const roadWidth = 14;
    const gridSpan = 240;

    // North-South Avenues
    [-90, 0, 90].forEach(x => {
      const geo = new THREE.PlaneGeometry(roadWidth, gridSpan);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, roadMat);
      mesh.position.set(x, this.terrain.getElevation(x, 0) + 0.05, 0);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.roadMeshes.push(mesh);
    });

    // East-West Streets
    [-90, 0, 90].forEach(z => {
      const geo = new THREE.PlaneGeometry(gridSpan, roadWidth);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, roadMat);
      mesh.position.set(0, this.terrain.getElevation(0, z) + 0.05, z);
      mesh.rotation.y = Math.PI / 2;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.roadMeshes.push(mesh);
    });

    // 2. Coastal Highway Ring
    const highwayGeo = new THREE.RingGeometry(253, 267, 48);
    highwayGeo.rotateX(-Math.PI / 2);
    const hwyMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getRoadTexture(),
      gradientMap: this.assetGen.toonGradient
    });
    const hwyMesh = new THREE.Mesh(highwayGeo, hwyMat);
    hwyMesh.position.y = 0.85;
    hwyMesh.receiveShadow = true;
    this.scene.add(hwyMesh);
    this.roadMeshes.push(hwyMesh);
  }

  generateSidewalksAndCrosswalks() {
    const crosswalkMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getCrosswalkTexture(),
      gradientMap: this.assetGen.toonGradient,
      transparent: true,
      opacity: 0.95
    });

    const pavementMat = new THREE.MeshToonMaterial({
      map: this.assetGen.getPavementTexture(),
      gradientMap: this.assetGen.toonGradient
    });

    // Add crosswalks at each downtown intersection
    this.intersections.forEach(inter => {
      // 4 crosswalk strips around intersection
      const offsets = [
        { x: 0, z: -10, rot: 0 },
        { x: 0, z: 10, rot: 0 },
        { x: -10, z: 0, rot: Math.PI / 2 },
        { x: 10, z: 0, rot: Math.PI / 2 }
      ];

      offsets.forEach(off => {
        const cwGeo = new THREE.PlaneGeometry(12, 4);
        cwGeo.rotateX(-Math.PI / 2);
        const cwMesh = new THREE.Mesh(cwGeo, crosswalkMat);
        cwMesh.position.set(inter.x + off.x, inter.y + 0.06, inter.z + off.z);
        cwMesh.rotation.y = off.rot;
        cwMesh.receiveShadow = true;
        this.scene.add(cwMesh);
      });

      // 4 Sidewalk Corner slabs
      const cornerGeo = new THREE.BoxGeometry(10, 0.25, 10);
      const cOffsets = [
        { x: -14, z: -14 },
        { x: 14, z: -14 },
        { x: 14, z: 14 },
        { x: -14, z: 14 }
      ];
      cOffsets.forEach(co => {
        const cornerMesh = new THREE.Mesh(cornerGeo, pavementMat);
        cornerMesh.position.set(inter.x + co.x, inter.y + 0.12, inter.z + co.z);
        cornerMesh.receiveShadow = true;
        this.scene.add(cornerMesh);
      });
    });
  }

  update(delta) {
    // Cycle traffic light signals at intersections
    for (let i = 0; i < this.intersections.length; i++) {
      const inter = this.intersections[i];
      inter.timer += delta;
      if (inter.timer > 14) {
        inter.timer = 0;
      }
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
