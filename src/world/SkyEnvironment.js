import * as THREE from 'three';

export class SkyEnvironment {
  constructor(scene) {
    this.scene = scene;

    // Time presets: 0: Noon, 1: Sunset / Golden Hour, 2: Cyberpunk Anime Night
    this.presets = [
      {
        name: '☀️ Vibrant Noon',
        skyColor: 0x60a5fa,
        horizonColor: 0xbfdbfe,
        sunColor: 0xfffbeb,
        sunIntensity: 1.6,
        ambientColor: 0xe0f2fe,
        ambientIntensity: 0.85,
        fogColor: 0xa5f3fc,
        sunPos: new THREE.Vector3(150, 220, 150)
      },
      {
        name: '🌅 Golden Sunset',
        skyColor: 0xf43f5e,
        horizonColor: 0xfbbf24,
        sunColor: 0xffedd5,
        sunIntensity: 1.4,
        ambientColor: 0xfda4af,
        ambientIntensity: 0.75,
        fogColor: 0xfecdd3,
        sunPos: new THREE.Vector3(260, 60, -180)
      },
      {
        name: '🌙 Cyberpunk Night',
        skyColor: 0x0f172a,
        horizonColor: 0x3b0764,
        sunColor: 0xa5b4fc,
        sunIntensity: 0.45,
        ambientColor: 0x6366f1,
        ambientIntensity: 0.4,
        fogColor: 0x1e1b4b,
        sunPos: new THREE.Vector3(-120, 180, -120)
      }
    ];

    this.currentPresetIdx = 0;

    this.sunLight = null;
    this.ambientLight = null;
    this.hemiLight = null;
    this.cloudGroup = null;

    this.init();
  }

  init() {
    this.createLights();
    this.createStylizedClouds();
    this.applyPreset(0);
  }

  createLights() {
    // Directional Sun Light
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.sunLight.castShadow = true;

    // High quality shadow map frustum covering the player area
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 600;
    const d = 160;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    // Ambient and Hemisphere
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xbfdbfe, 0x166534, 0.45);
    this.scene.add(this.hemiLight);
  }

  createStylizedClouds() {
    // Stylized fluffy cartoon clouds floating above the island
    this.cloudGroup = new THREE.Group();
    const cloudCount = 28;
    const cloudMat = new THREE.MeshToonMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });

    for (let c = 0; c < cloudCount; c++) {
      const singleCloud = new THREE.Group();
      const puffCount = 4 + Math.floor(Math.random() * 4);

      for (let p = 0; p < puffCount; p++) {
        const r = 10 + Math.random() * 12;
        const puffGeo = new THREE.DodecahedronGeometry(r, 1);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (p - puffCount / 2) * 14 + (Math.random() * 6 - 3),
          (Math.random() * 4 - 2),
          Math.random() * 8 - 4
        );
        singleCloud.add(puff);
      }

      // Scatter across sky
      singleCloud.position.set(
        (Math.random() - 0.5) * 700,
        110 + Math.random() * 40,
        (Math.random() - 0.5) * 700
      );
      singleCloud.scale.set(0.9, 0.45, 0.9); // Flatten slightly for cartoon cloud aesthetic
      this.cloudGroup.add(singleCloud);
    }

    this.scene.add(this.cloudGroup);
  }

  cycleTime() {
    this.currentPresetIdx = (this.currentPresetIdx + 1) % this.presets.length;
    this.applyPreset(this.currentPresetIdx);
    return this.presets[this.currentPresetIdx].name;
  }

  applyPreset(idx) {
    const p = this.presets[idx];

    // Background & Fog
    this.scene.background = new THREE.Color(p.skyColor);
    if (this.scene.fog) {
      this.scene.fog.color = new THREE.Color(p.fogColor);
    }

    // Lights
    this.sunLight.color.setHex(p.sunColor);
    this.sunLight.intensity = p.sunIntensity;
    this.sunLight.position.copy(p.sunPos);

    this.ambientLight.color.setHex(p.ambientColor);
    this.ambientLight.intensity = p.ambientIntensity;

    this.hemiLight.color.setHex(p.skyColor);
    this.hemiLight.groundColor.setHex(p.horizonColor);
  }

  update(delta, time) {
    // Slowly drift clouds across the sky
    if (this.cloudGroup) {
      this.cloudGroup.children.forEach(cloud => {
        cloud.position.x += delta * 3.5;
        if (cloud.position.x > 400) {
          cloud.position.x = -400;
        }
      });
    }
  }
}
