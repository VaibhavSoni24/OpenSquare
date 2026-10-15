import * as THREE from 'three';

export class ThirdPersonCamera {
  constructor(camera, domElement, inputManager) {
    this.camera = camera;
    this.domElement = domElement;
    this.input = inputManager;

    // Orbit angles
    this.yaw = 0; // Horizontal angle (radians)
    this.pitch = 0.28; // Vertical angle (radians)
    this.distance = 7.5; // Distance from target

    this.minPitch = -0.15;
    this.maxPitch = 1.25;
    this.minDistance = 3.0;
    this.maxDistance = 22.0;

    this.targetPos = new THREE.Vector3();
    this.currentCameraPos = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    // Camera modes: 0: Normal, 1: Far, 2: Close
    this.cameraModes = [
      { name: 'Standard Orbit', footDist: 7.0, carDist: 11.0, heightOffset: 1.8 },
      { name: 'Cinematic Far', footDist: 12.0, carDist: 17.0, heightOffset: 2.8 },
      { name: 'Close Action', footDist: 4.2, carDist: 7.5, heightOffset: 1.4 }
    ];
    this.currentModeIdx = 0;

    this.isDriving = false;
  }

  cycleMode() {
    this.currentModeIdx = (this.currentModeIdx + 1) % this.cameraModes.length;
    return this.cameraModes[this.currentModeIdx].name;
  }

  update(delta, targetPosition, targetRotationY, isDriving = false) {
    this.isDriving = isDriving;
    const mode = this.cameraModes[this.currentModeIdx];
    const desiredDist = isDriving ? mode.carDist : mode.footDist;

    // 1. Mouse rotation inputs
    if (this.input.mouse.deltaX !== 0 || this.input.mouse.deltaY !== 0) {
      const sens = 0.0035;
      this.yaw -= this.input.mouse.deltaX * sens;
      this.pitch += this.input.mouse.deltaY * sens;
      this.pitch = THREE.MathUtils.clamp(this.pitch, this.minPitch, this.maxPitch);
    }

    // 2. Zoom scroll
    if (this.input.mouse.scrollDelta !== 0) {
      this.distance = THREE.MathUtils.clamp(
        this.distance + this.input.mouse.scrollDelta * 0.8,
        this.minDistance,
        this.maxDistance
      );
    } else {
      this.distance = THREE.MathUtils.lerp(this.distance, desiredDist, delta * 4);
    }

    // 3. For driving: auto-align yaw behind vehicle smoothly when moving
    if (isDriving && this.input.mouse.deltaX === 0) {
      const diff = THREE.MathUtils.euclideanModulo(targetRotationY + Math.PI - this.yaw + Math.PI, Math.PI * 2) - Math.PI;
      this.yaw += diff * Math.min(1.0, delta * 3.0);
    }

    // 4. Target Focus Point
    const targetCenter = targetPosition.clone();
    targetCenter.y += mode.heightOffset;
    this.targetPos.copy(targetCenter);

    // 5. Spherical offset calculation
    const offsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance;
    const offsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance;
    const offsetY = Math.sin(this.pitch) * this.distance;

    const desiredCamPos = new THREE.Vector3(
      this.targetPos.x + offsetX,
      Math.max(this.targetPos.y + offsetY, 1.2), // Don't clip through ground
      this.targetPos.z + offsetZ
    );

    // 6. Smooth Spring / Slerp Camera Position
    const lerpSpeed = isDriving ? 8 : 12;
    this.currentCameraPos.lerp(desiredCamPos, Math.min(1.0, delta * lerpSpeed));
    this.currentLookAt.lerp(this.targetPos, Math.min(1.0, delta * lerpSpeed));

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookAt);
  }
}
