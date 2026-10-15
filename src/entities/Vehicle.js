import * as THREE from 'three';
import { VehicleModels } from './VehicleModels.js';

export class Vehicle {
  constructor(scene, assetGen, world, options = {}) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.world = world;

    const {
      type = 'kei',
      color = 0xff7eb3,
      position = new THREE.Vector3(0, 1, 0),
      rotation = 0
    } = options;

    this.type = type;
    this.model = VehicleModels.create(assetGen, type, color);
    this.root = this.model.root;
    this.root.position.copy(position);
    this.root.rotation.y = rotation;
    this.scene.add(this.root);

    // Physics parameters
    this.speed = 0;
    this.maxForwardSpeed = 26.0; // ~95 km/h
    this.maxReverseSpeed = -9.0;
    this.acceleration = 18.0;
    this.brakeDecel = 28.0;
    this.friction = 6.0;
    this.steeringAngle = 0;
    this.maxSteeringAngle = 0.58; // Radians (~33 deg)
    this.turnSpeed = 2.4;
    this.driftFactor = 1.0;

    // State
    this.isDrivenByPlayer = false;
    this.driver = null;
    this.headlightsOn = true;
    this.isBraking = false;
  }

  setPosition(x, y, z) {
    this.root.position.set(x, y, z);
  }

  setRotation(rotY) {
    this.root.rotation.y = rotY;
  }

  toggleHeadlights() {
    this.headlightsOn = !this.headlightsOn;
    if (this.model.headLightSpot) {
      this.model.headLightSpot.visible = this.headlightsOn;
    }
    return this.headlightsOn;
  }

  board(player) {
    this.isDrivenByPlayer = true;
    this.driver = player;
  }

  unboard() {
    this.isDrivenByPlayer = false;
    const driver = this.driver;
    this.driver = null;
    return driver;
  }

  updatePhysics(delta, input) {
    // 1. Acceleration / Braking
    let throttle = 0;
    let steer = 0;
    let handbrake = false;

    if (this.isDrivenByPlayer && input) {
      const axes = input.getMovementAxes();
      throttle = axes.forward;
      steer = -axes.turn;
      handbrake = input.isHandbrake();
    }

    this.isBraking = (this.speed > 0.5 && throttle < 0) || handbrake;

    if (throttle > 0) {
      this.speed = Math.min(this.maxForwardSpeed, this.speed + this.acceleration * delta);
    } else if (throttle < 0) {
      if (this.speed > 0.2) {
        this.speed = Math.max(0, this.speed - this.brakeDecel * delta);
      } else {
        this.speed = Math.max(this.maxReverseSpeed, this.speed - this.acceleration * 0.7 * delta);
      }
    } else {
      // Natural friction / rolling resistance
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.friction * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.friction * delta);
      }
    }

    if (handbrake) {
      this.speed = Math.max(0, this.speed - this.brakeDecel * 1.5 * delta);
      this.driftFactor = 1.45; // Enhanced sliding rotation
    } else {
      this.driftFactor = 1.0;
    }

    // 2. Steering with dynamic speed-scaling
    const speedFactor = Math.min(1.0, Math.abs(this.speed) / 6.0);
    const targetSteer = steer * this.maxSteeringAngle;
    this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, targetSteer, delta * 8);

    if (Math.abs(this.speed) > 0.1) {
      const turnDir = this.speed >= 0 ? 1 : -1;
      this.root.rotation.y += this.steeringAngle * this.turnSpeed * speedFactor * turnDir * this.driftFactor * delta;
    }

    // 3. Move along forward direction
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.root.rotation.y);
    const nextPos = this.root.position.clone().add(forward.clone().multiplyScalar(this.speed * delta));

    // Check building collisions
    if (!this.world.checkCollision(nextPos, 1.2)) {
      this.root.position.copy(nextPos);
    } else {
      // Rebound / halt on crash
      this.speed = -this.speed * 0.35;
    }

    // 4. Ground elevation & terrain smoothing
    const groundY = this.world.getGroundElevation(this.root.position.x, this.root.position.z);
    this.root.position.y = THREE.MathUtils.lerp(this.root.position.y, groundY + 0.1, delta * 14);

    // 5. Update Wheels (Spin & Front Steering)
    const travelDist = this.speed * delta;
    this.model.wheels.forEach(w => {
      // Wheel spin
      w.tire.rotation.x += travelDist / 0.38;
      // Front wheel steer
      if (w.isFront) {
        w.group.rotation.y = this.steeringAngle;
      }
    });

    // 6. Visual suspension pitch / roll bounce
    const accelPitch = THREE.MathUtils.clamp((throttle) * -0.04, -0.06, 0.06);
    this.root.rotation.x = THREE.MathUtils.lerp(this.root.rotation.x, accelPitch, delta * 6);
  }

  getSpeedKmh() {
    return Math.round(Math.abs(this.speed) * 3.6);
  }

  getNormalizedSpeed() {
    return Math.min(1.0, Math.abs(this.speed) / this.maxForwardSpeed);
  }
}
