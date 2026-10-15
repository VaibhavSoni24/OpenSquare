import * as THREE from 'three';

export class Engine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found.`);
    }

    // 1. Renderer setup with high visual fidelity and performance
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Anime sky blue default
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0018); // Soft horizon fog

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.2,
      1200
    );
    this.camera.position.set(0, 10, 25);

    // 4. Clock & Loop management
    this.clock = new THREE.Clock();
    this.updatables = [];
    this.renderables = [];
    this.isRunning = false;

    // 5. Handle Resizing
    window.addEventListener('resize', () => this.onWindowResize());
  }

  addUpdatable(obj) {
    this.updatables.push(obj);
  }

  removeUpdatable(obj) {
    const idx = this.updatables.indexOf(obj);
    if (idx !== -1) this.updatables.splice(idx, 1);
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  stop() {
    this.isRunning = false;
    this.renderer.setAnimationLoop(null);
  }

  tick() {
    const rawDelta = this.clock.getDelta();
    // Cap delta time to prevent physics explosions on background tab focus
    const delta = Math.min(rawDelta, 0.05);
    const elapsedTime = this.clock.getElapsedTime();

    for (let i = 0; i < this.updatables.length; i++) {
      this.updatables[i].update(delta, elapsedTime);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
