import * as THREE from 'three';
import { CharacterModel } from './CharacterModel.js';

export class PedestrianSystem {
  constructor(scene, assetGen, world, roadNetwork) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.world = world;
    this.roads = roadNetwork;

    this.pedestrians = [];
    this.maxPedestrians = 36; // High density while preserving 60 FPS
    this.activeRadius = 150;
    this.despawnRadius = 210;

    this.hairColors = [0xff7eb3, 0x00f2fe, 0xfcd34d, 0xc084fc, 0x6ee7b7, 0xf87171, 0x818cf8];
    this.hairStyles = ['twintails', 'spiky', 'bob'];
    this.outfitColors = [0x38bdf8, 0xf472b6, 0xfbbf24, 0x34d399, 0xa78bfa, 0xf87171, 0xffffff];

    this.init();
  }

  init() {
    const wps = this.roads.pedestrianWaypoints;
    if (!wps || wps.length === 0) return;

    for (let i = 0; i < Math.min(this.maxPedestrians, wps.length); i++) {
      const wp = wps[i % wps.length];
      this.spawnPedestrian(wp);
    }
  }

  spawnPedestrian(startWp) {
    if (!startWp) return null;

    const hairColor = this.hairColors[Math.floor(Math.random() * this.hairColors.length)];
    const hairStyle = this.hairStyles[Math.floor(Math.random() * this.hairStyles.length)];
    const outfitColor = this.outfitColors[Math.floor(Math.random() * this.outfitColors.length)];

    const model = CharacterModel.create(this.assetGen, {
      hairColor,
      hairStyle,
      outfitColor,
      pantsColor: 0x334155,
      isPlayer: false
    });

    const root = model.root;
    root.position.copy(startWp.position);
    this.scene.add(root);

    const pedData = {
      model,
      root,
      currentWp: startWp,
      targetWp: startWp.next.length > 0 ? startWp.next[Math.floor(Math.random() * startWp.next.length)] : startWp,
      walkSpeed: 1.8 + Math.random() * 1.4,
      state: 'walk', // 'walk', 'idle', 'wait'
      stateTimer: 0,
      avoidanceOffset: new THREE.Vector3()
    };

    this.pedestrians.push(pedData);
    return pedData;
  }

  update(delta, playerPos, vehicles = []) {
    for (let i = this.pedestrians.length - 1; i >= 0; i--) {
      const ped = this.pedestrians[i];
      const pPos = ped.root.position;
      const distToPlayer = pPos.distanceTo(playerPos);

      // Despawn far pedestrians and recycle near player
      if (distToPlayer > this.despawnRadius) {
        this.recyclePedestrian(ped, playerPos);
        continue;
      }

      this.updatePedestrianAI(ped, delta, playerPos, vehicles);
    }
  }

  recyclePedestrian(ped, playerPos) {
    const candidates = this.roads.pedestrianWaypoints.filter(wp => {
      const d = wp.position.distanceTo(playerPos);
      return d > 40 && d < 120;
    });

    if (candidates.length > 0) {
      const newWp = candidates[Math.floor(Math.random() * candidates.length)];
      ped.root.position.copy(newWp.position);
      ped.currentWp = newWp;
      ped.targetWp = newWp.next.length > 0 ? newWp.next[Math.floor(Math.random() * newWp.next.length)] : newWp;
      ped.state = 'walk';
    }
  }

  updatePedestrianAI(ped, delta, playerPos, vehicles) {
    const root = ped.root;
    const pPos = root.position;

    // 1. Vehicle Proximity / Danger Avoidance
    let dangerDir = null;
    for (let i = 0; i < vehicles.length; i++) {
      const vPos = vehicles[i].root.position;
      const d = pPos.distanceTo(vPos);
      if (d < 4.5) {
        dangerDir = new THREE.Vector3().subVectors(pPos, vPos).normalize();
        dangerDir.y = 0;
        break;
      }
    }

    if (dangerDir) {
      // Step aside rapidly
      root.position.add(dangerDir.multiplyScalar(delta * 4.5));
      ped.model.animate('jump', 1.5, delta);
      return;
    }

    // 2. State Machine (Wandering / Idling)
    ped.stateTimer -= delta;

    if (ped.state === 'idle') {
      ped.model.animate('idle', 1, delta);
      if (ped.stateTimer <= 0) {
        ped.state = 'walk';
        if (ped.currentWp && ped.currentWp.next.length > 0) {
          ped.targetWp = ped.currentWp.next[Math.floor(Math.random() * ped.currentWp.next.length)];
        }
      }
      return;
    }

    // 3. Move along Sidewalk Waypoints
    if (ped.targetWp) {
      const diff = new THREE.Vector3().subVectors(ped.targetWp.position, pPos);
      diff.y = 0;
      const dist = diff.length();

      if (dist < 1.2) {
        // Reached waypoint
        ped.currentWp = ped.targetWp;
        // 25% chance to pause and look around
        if (Math.random() < 0.25) {
          ped.state = 'idle';
          ped.stateTimer = 2.0 + Math.random() * 3.0;
          return;
        } else {
          const nexts = ped.targetWp.next;
          if (nexts && nexts.length > 0) {
            ped.targetWp = nexts[Math.floor(Math.random() * nexts.length)];
          }
        }
      }

      // Smooth rotate towards target
      const targetAngle = Math.atan2(diff.x, diff.z);
      const angleDiff = THREE.MathUtils.euclideanModulo(targetAngle - root.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
      root.rotation.y += THREE.MathUtils.clamp(angleDiff * 8 * delta, -0.2, 0.2);

      // Walk forward
      const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), root.rotation.y);
      root.position.add(forward.multiplyScalar(ped.walkSpeed * delta));

      // Ground elevation
      const gy = this.world.getGroundElevation(root.position.x, root.position.z);
      root.position.y = gy;

      ped.model.animate('walk', ped.walkSpeed * 0.7, delta);
    }
  }
}
