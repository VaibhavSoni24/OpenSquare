import * as THREE from 'three';
import { Vehicle } from './Vehicle.js';

export class TrafficSystem {
  constructor(scene, assetGen, world, roadNetwork, audioManager) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.world = world;
    this.roads = roadNetwork;
    this.audio = audioManager;

    this.cars = [];
    this.maxCars = 24; // Optimized for silky 60 FPS
    this.activeRadius = 180;
    this.despawnRadius = 240;

    this.carColors = [
      0xff7eb3, // Sakura Pink
      0x00f2fe, // Cyan
      0xffd166, // Sunny Yellow
      0x06d6a0, // Mint
      0x8338ec, // Lavender Purple
      0xff5964, // Coral Red
      0xffffff, // Pearl White
      0x38bdf8  // Sky Blue
    ];

    this.carTypes = ['kei', 'beetle', 'coupe'];

    this.init();
  }

  init() {
    // Initial spawn across various road waypoints
    const availableWaypoints = [...this.roads.carWaypoints];
    // Shuffle
    availableWaypoints.sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(this.maxCars, availableWaypoints.length); i++) {
      const wp = availableWaypoints[i];
      this.spawnCar(wp);
    }
  }

  spawnCar(startWp) {
    if (!startWp) return null;

    const type = this.carTypes[Math.floor(Math.random() * this.carTypes.length)];
    const color = this.carColors[Math.floor(Math.random() * this.carColors.length)];

    const vehicle = new Vehicle(this.scene, this.assetGen, this.world, {
      type,
      color,
      position: startWp.position.clone()
    });

    const carData = {
      vehicle,
      currentWp: startWp,
      targetWp: startWp.next.length > 0 ? startWp.next[0] : startWp,
      cruisingSpeed: 7.5 + Math.random() * 4.5,
      targetSpeed: 0,
      blockedTimer: 0
    };

    // Orient towards next waypoint
    if (carData.targetWp) {
      const dir = new THREE.Vector3().subVectors(carData.targetWp.position, startWp.position).normalize();
      vehicle.root.rotation.y = Math.atan2(dir.x, dir.z);
    }

    this.cars.push(carData);
    return carData;
  }

  getAllVehicles() {
    return this.cars.map(c => c.vehicle);
  }

  removeCar(vehicle) {
    const idx = this.cars.findIndex(c => c.vehicle === vehicle);
    if (idx !== -1) {
      this.cars.splice(idx, 1);
    }
  }

  addCar(vehicle, nearestWp) {
    this.cars.push({
      vehicle,
      currentWp: nearestWp,
      targetWp: nearestWp && nearestWp.next.length > 0 ? nearestWp.next[0] : null,
      cruisingSpeed: 8.0,
      targetSpeed: 0,
      blockedTimer: 0
    });
  }

  update(delta, playerPos, pedestrians = []) {
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      const v = car.vehicle;

      // Skip vehicle if being driven by human player
      if (v.isDrivenByPlayer) continue;

      const vPos = v.root.position;
      const distToPlayer = vPos.distanceTo(playerPos);

      // Despawn far cars and recycle ahead of player
      if (distToPlayer > this.despawnRadius) {
        this.recycleCar(car, playerPos);
        continue;
      }

      this.updateCarAI(car, delta, playerPos, pedestrians);
    }
  }

  recycleCar(car, playerPos) {
    // Find a waypoint within [70m, 160m] of player
    const candidates = this.roads.carWaypoints.filter(wp => {
      const d = wp.position.distanceTo(playerPos);
      return d > 70 && d < 160;
    });

    if (candidates.length > 0) {
      const newWp = candidates[Math.floor(Math.random() * candidates.length)];
      car.vehicle.setPosition(newWp.position.x, newWp.position.y, newWp.position.z);
      car.currentWp = newWp;
      car.targetWp = newWp.next.length > 0 ? newWp.next[Math.floor(Math.random() * newWp.next.length)] : newWp;
      car.vehicle.speed = 0;
    }
  }

  updateCarAI(car, delta, playerPos, pedestrians) {
    const v = car.vehicle;
    const vPos = v.root.position;

    // 1. Check Intersection Traffic Light Rules
    let isRedLight = false;
    if (car.targetWp && car.targetWp.intersectionId) {
      const inter = this.roads.intersections.find(it => it.id === car.targetWp.intersectionId);
      if (inter) {
        // NS lanes stop on EW green/yellow; EW lanes stop on NS green/yellow
        const isNSLane = car.targetWp.id.includes('_ns_');
        if (isNSLane && (inter.state === 'green_ew' || inter.state === 'yellow_ew')) {
          isRedLight = true;
        } else if (!isNSLane && (inter.state === 'green_ns' || inter.state === 'yellow_ns')) {
          isRedLight = true;
        }
      }
    }

    // 2. Check Distance to Vehicle Ahead
    let leadCarDist = Infinity;
    for (let j = 0; j < this.cars.length; j++) {
      const other = this.cars[j];
      if (other === car) continue;

      const diff = new THREE.Vector3().subVectors(other.vehicle.root.position, vPos);
      const dist = diff.length();
      if (dist < 20) {
        // Forward alignment dot product
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.root.rotation.y);
        const headingDot = forward.dot(diff.normalize());
        if (headingDot > 0.75 && dist < leadCarDist) {
          leadCarDist = dist;
        }
      }
    }

    // 3. Check Distance to Player on Foot
    let playerDist = Infinity;
    const toPlayer = new THREE.Vector3().subVectors(playerPos, vPos);
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.root.rotation.y);
    if (forward.dot(toPlayer.clone().normalize()) > 0.7) {
      playerDist = toPlayer.length();
    }

    // 4. Decision Logic
    let desiredSpeed = car.cruisingSpeed;

    if (isRedLight && car.targetWp && vPos.distanceTo(car.targetWp.position) < 12) {
      desiredSpeed = 0; // Stop for red light!
    } else if (leadCarDist < 6.5) {
      desiredSpeed = 0; // Queue behind lead car
    } else if (leadCarDist < 14) {
      desiredSpeed = Math.min(desiredSpeed, (leadCarDist - 5) * 1.5);
    }

    if (playerDist < 7.0) {
      desiredSpeed = 0; // Yield to player pedestrian!
      car.blockedTimer += delta;
      if (car.blockedTimer > 3.0) {
        // Honk horn if player blocks car!
        this.audio.playHorn();
        car.blockedTimer = 0;
      }
    } else {
      car.blockedTimer = 0;
    }

    // 5. Apply smooth acceleration/braking
    if (v.speed < desiredSpeed) {
      v.speed = Math.min(desiredSpeed, v.speed + 8.0 * delta);
    } else {
      v.speed = Math.max(desiredSpeed, v.speed - 14.0 * delta);
    }

    // 6. Steer towards Target Waypoint
    if (car.targetWp) {
      const toTarget = new THREE.Vector3().subVectors(car.targetWp.position, vPos);
      toTarget.y = 0;
      const distToTarget = toTarget.length();

      if (distToTarget < 6.0) {
        // Pick next waypoint
        car.currentWp = car.targetWp;
        const nextOptions = car.targetWp.next;
        if (nextOptions && nextOptions.length > 0) {
          car.targetWp = nextOptions[Math.floor(Math.random() * nextOptions.length)];
        }
      }

      const targetAngle = Math.atan2(toTarget.x, toTarget.z);
      const angleDiff = THREE.MathUtils.euclideanModulo(targetAngle - v.root.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
      v.root.rotation.y += THREE.MathUtils.clamp(angleDiff * 4.5 * delta, -0.08, 0.08);
      v.steeringAngle = THREE.MathUtils.clamp(angleDiff, -v.maxSteeringAngle, v.maxSteeringAngle);
    }

    // 7. Update Car Translation & Wheels
    const travel = v.speed * delta;
    const moveVector = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.root.rotation.y).multiplyScalar(travel);
    v.root.position.add(moveVector);

    // Ground elevation
    const gY = this.world.getGroundElevation(v.root.position.x, v.root.position.z);
    v.root.position.y = THREE.MathUtils.lerp(v.root.position.y, gY + 0.1, delta * 12);

    // Wheel spin & steer
    v.model.wheels.forEach(w => {
      w.tire.rotation.x += travel / 0.38;
      if (w.isFront) {
        w.group.rotation.y = v.steeringAngle;
      }
    });
  }
}
