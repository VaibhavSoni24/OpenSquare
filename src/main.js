import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { InputManager } from './core/InputManager.js';
import { AudioManager } from './core/AudioManager.js';
import { AssetGenerator } from './core/AssetGenerator.js';
import { World } from './world/World.js';
import { Player } from './entities/Player.js';
import { Vehicle } from './entities/Vehicle.js';
import { TrafficSystem } from './entities/TrafficSystem.js';
import { PedestrianSystem } from './entities/PedestrianSystem.js';
import { ThirdPersonCamera } from './camera/ThirdPersonCamera.js';
import { HUD } from './ui/HUD.js';

class Game {
  constructor() {
    this.engine = null;
    this.input = null;
    this.audio = null;
    this.assetGen = null;
    this.world = null;
    this.player = null;
    this.traffic = null;
    this.pedestrians = null;
    this.cameraSystem = null;
    this.hud = null;

    this.init();
  }

  async init() {
    try {
      // 1. Initialize Engine & Core Managers
      this.engine = new Engine('webgl-canvas');
      this.input = new InputManager(this.engine.canvas);
      this.audio = new AudioManager();
      this.assetGen = new AssetGenerator();

      // Setup Camera System
      this.cameraSystem = new ThirdPersonCamera(this.engine.camera, this.engine.canvas, this.input);

      // 2. Build OpenSquare World (Terrain, Roads, City, Nature, Props)
      this.world = new World(this.engine.scene, this.assetGen);

      // 3. Initialize HUD & Audio hooks
      this.hud = new HUD(this.world, this.world.roads, this.audio, this.cameraSystem);
      this.hud.setLoadingProgress(45, 'Generating Sakura Districts & Architecture...');

      await new Promise(r => setTimeout(r, 150));

      // 4. Initialize Player
      this.player = new Player(
        this.engine.scene,
        this.assetGen,
        this.world,
        this.input,
        this.audio
      );
      this.hud.setLoadingProgress(70, 'Spawning Traffic & Pedestrian AI...');

      await new Promise(r => setTimeout(r, 150));

      // 5. Initialize Traffic & Pedestrian AI Systems
      this.traffic = new TrafficSystem(
        this.engine.scene,
        this.assetGen,
        this.world,
        this.world.roads,
        this.audio
      );

      // Spawn a cute starter anime car parked on curbside near player
      const starterCar = new Vehicle(this.engine.scene, this.assetGen, this.world, {
        type: 'kei',
        color: 0xff5388,
        position: new THREE.Vector3(4.5, 0.85, 3.5),
        rotation: 0
      });
      this.traffic.cars.push({
        vehicle: starterCar,
        currentWp: null,
        targetWp: null,
        cruisingSpeed: 8.0,
        targetSpeed: 0,
        blockedTimer: 0
      });

      this.pedestrians = new PedestrianSystem(
        this.engine.scene,
        this.assetGen,
        this.world,
        this.world.roads
      );

      this.hud.setLoadingProgress(100, 'Ready! Entering OpenSquare...');
      await new Promise(r => setTimeout(r, 300));

      // Hide loading screen and display HUD
      this.hud.hideLoadingScreen();

      // Register main loop
      this.engine.addUpdatable(this);
      this.engine.start();

      // User interaction listener to resume AudioContext
      const startAudio = () => {
        this.audio.ensureContext();
        window.removeEventListener('click', startAudio);
        window.removeEventListener('keydown', startAudio);
      };
      window.addEventListener('click', startAudio);
      window.addEventListener('keydown', startAudio);

      console.log('🌸 OpenSquare initialized successfully!');
    } catch (err) {
      console.error('Failed to initialize OpenSquare game:', err);
    }
  }

  update(delta, time) {
    // 1. Update World (Terrain water, traffic light cycles, drifting clouds)
    this.world.update(delta, time);

    // 2. Retrieve entity lists for interactions
    const vehicles = this.traffic.getAllVehicles();
    const peds = this.pedestrians.pedestrians;
    const playerPos = this.player.getPosition();

    // 3. Update AI Systems (Traffic & Pedestrians)
    this.traffic.update(delta, playerPos, peds);
    this.pedestrians.update(delta, playerPos, vehicles);

    // 4. Update Player Controller
    this.player.update(delta, this.cameraSystem.yaw, vehicles);

    // 5. Update Third-Person Camera Tracking
    const isDriving = this.player.state === 'DRIVING';
    this.cameraSystem.update(
      delta,
      this.player.getPosition(),
      this.player.getRotation(),
      isDriving
    );

    // 6. Update HUD (Minimap, Speedometer, Prompts, District Badges)
    this.hud.update(this.player, vehicles, peds, this.input);

    // 7. Flush single-frame input flags
    this.input.endFrame();
  }
}

// Start Game on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
