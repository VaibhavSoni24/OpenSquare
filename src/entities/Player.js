import * as THREE from 'three';
import { CharacterModel } from './CharacterModel.js';

export const PlayerState = {
  ON_FOOT: 'ON_FOOT',
  DRIVING: 'DRIVING'
};

export class Player {
  constructor(scene, assetGen, world, inputManager, audioManager) {
    this.scene = scene;
    this.assetGen = assetGen;
    this.world = world;
    this.input = inputManager;
    this.audio = audioManager;

    // State
    this.state = PlayerState.ON_FOOT;
    this.currentVehicle = null;
    this.nearbyVehicle = null;

    // Create cute anime player model
    this.model = CharacterModel.create(assetGen, {
      hairColor: 0xff7eb3, // Vibrant anime sakura pink
      hairStyle: 'twintails',
      outfitColor: 0x38bdf8, // Cute cyan hoodie
      pantsColor: 0x1e293b,
      isPlayer: true
    });
    this.root = this.model.root;
    this.root.position.set(0, 2, 0); // Spawns in Downtown Plaza
    this.scene.add(this.root);

    // Physics
    this.velocity = new THREE.Vector3();
    this.walkSpeed = 5.2;
    this.sprintSpeed = 10.5;
    this.gravity = 28.0;
    this.jumpForce = 9.5;
    this.isGrounded = true;
    this.verticalVelocity = 0;

    // Movement direction & smoothing
    this.moveAngle = 0;
    this.targetRotation = 0;
  }

  getPosition() {
    if (this.state === PlayerState.DRIVING && this.currentVehicle) {
      return this.currentVehicle.root.position;
    }
    return this.root.position;
  }

  getRotation() {
    if (this.state === PlayerState.DRIVING && this.currentVehicle) {
      return this.currentVehicle.root.rotation.y;
    }
    return this.root.rotation.y;
  }

  enterVehicle(vehicle) {
    this.state = PlayerState.DRIVING;
    this.currentVehicle = vehicle;
    vehicle.board(this);

    // Attach player to vehicle driver seat in seated anime driving pose
    this.root.removeFromParent();
    vehicle.root.add(this.root);
    this.root.position.copy(vehicle.model.driverSeatOffset);
    this.root.rotation.set(0, 0, 0);
    this.model.animate('drive');

    this.audio.playDoor();
  }

  exitVehicle() {
    if (!this.currentVehicle) return;

    const vPos = this.currentVehicle.root.position;
    const vRot = this.currentVehicle.root.rotation.y;

    // Unboard vehicle
    this.currentVehicle.unboard();

    // Reattach player to scene beside vehicle
    this.root.removeFromParent();
    this.scene.add(this.root);

    const leftOffset = new THREE.Vector3(-2.2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), vRot);
    const exitPos = vPos.clone().add(leftOffset);
    exitPos.y = this.world.getGroundElevation(exitPos.x, exitPos.z);

    this.root.position.copy(exitPos);
    this.root.rotation.set(0, vRot, 0);

    this.currentVehicle = null;
    this.state = PlayerState.ON_FOOT;
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;

    this.audio.playDoor();
  }

  update(delta, cameraAngleY, vehicles = []) {
    // Check vehicle enter / exit input
    if (this.input.wasJustPressed('KeyE') || this.input.wasJustPressed('KeyF')) {
      if (this.state === PlayerState.ON_FOOT && this.nearbyVehicle) {
        this.enterVehicle(this.nearbyVehicle);
        return;
      } else if (this.state === PlayerState.DRIVING) {
        // Can exit if slow enough (< 20 km/h)
        if (this.currentVehicle.getSpeedKmh() < 20) {
          this.exitVehicle();
          return;
        }
      }
    }

    if (this.state === PlayerState.DRIVING) {
      this.updateDriving(delta);
    } else {
      this.updateOnFoot(delta, cameraAngleY, vehicles);
    }
  }

  updateDriving(delta) {
    this.currentVehicle.updatePhysics(delta, this.input);
    this.audio.setEngineRPM(this.currentVehicle.getNormalizedSpeed(), true);

    // Horn
    if (this.input.wasJustPressed('KeyH') || this.input.wasJustPressed('ControlLeft')) {
      this.audio.playHorn();
    }

    // Headlight toggle
    if (this.input.wasJustPressed('KeyL')) {
      this.currentVehicle.toggleHeadlights();
    }
  }

  updateOnFoot(delta, cameraAngleY, vehicles) {
    this.audio.setEngineRPM(0, false);

    // 1. Movement Inputs relative to camera
    const axes = this.input.getMovementAxes();
    const isMoving = axes.forward !== 0 || axes.turn !== 0;
    const isSprinting = this.input.isSprinting() && isMoving;

    const currentSpeed = isSprinting ? this.sprintSpeed : this.walkSpeed;

    if (isMoving) {
      // Calculate world movement angle combining forward & strafe with camera yaw
      const inputAngle = Math.atan2(axes.turn, axes.forward);
      const targetAngle = cameraAngleY + inputAngle;

      // Smoothly rotate player toward movement direction
      const diff = THREE.MathUtils.euclideanModulo(targetAngle - this.root.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
      this.root.rotation.y += diff * Math.min(1.0, delta * 14);

      // Move velocity vector
      const moveDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.root.rotation.y);
      this.velocity.x = moveDir.x * currentSpeed;
      this.velocity.z = moveDir.z * currentSpeed;

      // Sound
      if (this.isGrounded) {
        this.audio.playFootstep(isSprinting);
      }
    } else {
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, delta * 12);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, delta * 12);
    }

    // 2. Jump & Gravity
    if (this.isGrounded && this.input.isJumping()) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
    }

    this.verticalVelocity -= this.gravity * delta;
    this.root.position.y += this.verticalVelocity * delta;

    // Check ground collision
    const groundElevation = this.world.getGroundElevation(this.root.position.x, this.root.position.z);
    if (this.root.position.y <= groundElevation) {
      this.root.position.y = groundElevation;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }

    // 3. Move X/Z with building collision check
    const nextPos = this.root.position.clone().add(
      new THREE.Vector3(this.velocity.x * delta, 0, this.velocity.z * delta)
    );

    if (!this.world.checkCollision(nextPos, 0.6)) {
      this.root.position.x = nextPos.x;
      this.root.position.z = nextPos.z;
    }

    // 4. Update procedural animation
    if (!this.isGrounded) {
      this.model.animate('jump', 1, delta);
    } else if (isMoving) {
      this.model.animate(isSprinting ? 'sprint' : 'walk', isSprinting ? 1.6 : 1.0, delta);
    } else {
      this.model.animate('idle', 1, delta);
    }

    // 5. Scan for nearby vehicles to board
    this.detectNearbyVehicle(vehicles);
  }

  detectNearbyVehicle(vehicles) {
    this.nearbyVehicle = null;
    const playerPos = this.root.position;

    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      const dist = playerPos.distanceTo(v.root.position);
      if (dist < 4.2) {
        this.nearbyVehicle = v;
        break;
      }
    }
  }
}
