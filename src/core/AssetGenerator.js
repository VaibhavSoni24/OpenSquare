import * as THREE from 'three';

export class AssetGenerator {
  constructor() {
    this.textures = {};
    this.materials = {};

    // 1. Generate Toon Gradient Map for Cel Shading
    this.toonGradient = this.createToonGradient();
  }

  createToonGradient() {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');

    // 4 sharp anime shading steps
    const colors = ['#555555', '#888888', '#bbbbbb', '#ffffff'];
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i, 0, 1, 1);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }

  // Create standard Toon Material with preset options
  createToonMaterial(color, options = {}) {
    return new THREE.MeshToonMaterial({
      color: new THREE.Color(color),
      gradientMap: this.toonGradient,
      ...options
    });
  }

  // 2. Procedural Road Texture with Dashed Yellow Line and Crosswalk
  getRoadTexture() {
    if (this.textures.road) return this.textures.road;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Dark charcoal anime asphalt
    ctx.fillStyle = '#232733';
    ctx.fillRect(0, 0, size, size);

    // Subtle asphalt grain
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(x, y, 2, 2);
    }

    // Outer white lane border lines
    ctx.strokeStyle = '#f8f9fa';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(30, size);
    ctx.moveTo(size - 30, 0);
    ctx.lineTo(size - 30, size);
    ctx.stroke();

    // Center yellow dashed lines
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 12;
    ctx.setLineDash([48, 36]);
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.road = texture;
    return texture;
  }

  // 3. Crosswalk Texture
  getCrosswalkTexture() {
    if (this.textures.crosswalk) return this.textures.crosswalk;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Asphalt bg
    ctx.fillStyle = '#232733';
    ctx.fillRect(0, 0, size, size);

    // Bold white zebra bars
    ctx.fillStyle = '#ffffff';
    const barWidth = 42;
    const gap = 34;
    for (let x = 20; x < size; x += barWidth + gap) {
      ctx.fillRect(x, 40, barWidth, size - 80);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.crosswalk = texture;
    return texture;
  }

  // 4. Anime Stylized Grass Texture with cute clover/flower specks
  getGrassTexture() {
    if (this.textures.grass) return this.textures.grass;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base vibrant emerald green
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#55c768');
    grad.addColorStop(0.5, '#48b85b');
    grad.addColorStop(1, '#5cd370');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Cute stylized grass tufts / brush strokes
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.strokeStyle = Math.random() > 0.4 ? '#6ee785' : '#3da64f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() * 8 - 4), y - (6 + Math.random() * 8));
      ctx.stroke();
    }

    // Mini cute flower daisies & buttercups
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const flowerColor = ['#ffffff', '#ffd166', '#ffb7b2'][Math.floor(Math.random() * 3)];
      ctx.fillStyle = flowerColor;
      for (let p = 0; p < 5; p++) {
        const ang = (p * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(x + Math.cos(ang) * 4, y + Math.sin(ang) * 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(24, 24);
    this.textures.grass = texture;
    return texture;
  }

  // 5. Anime Skyscraper Facade Texture (Window Grids & Neon Signs)
  getFacadeTexture(paletteType = 0) {
    const key = `facade_${paletteType}`;
    if (this.textures[key]) return this.textures[key];

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const wallPalettes = [
      { wall: '#34495e', winOn: '#ffeaa7', winOff: '#1e272e', accent: '#00d2d3' },
      { wall: '#2c3e50', winOn: '#81ecec', winOff: '#131e2b', accent: '#ff7675' },
      { wall: '#485460', winOn: '#fab1a0', winOff: '#1e272e', accent: '#fdcb6e' },
      { wall: '#576574', winOn: '#a8ff78', winOff: '#222f3e', accent: '#54a0ff' }
    ];
    const pal = wallPalettes[paletteType % wallPalettes.length];

    // Wall base
    ctx.fillStyle = pal.wall;
    ctx.fillRect(0, 0, size, size);

    // Window grid
    const cols = 8;
    const rows = 12;
    const padX = 14;
    const padY = 12;
    const winW = (size - padX * (cols + 1)) / cols;
    const winH = (size - padY * (rows + 1)) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padX + c * (winW + padX);
        const y = padY + r * (winH + padY);

        // Random window lights
        const isLit = Math.random() > 0.4;
        ctx.fillStyle = isLit ? pal.winOn : pal.winOff;
        ctx.fillRect(x, y, winW, winH);

        // Window frames
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, winW, winH);

        // Window divider
        ctx.beginPath();
        ctx.moveTo(x + winW / 2, y);
        ctx.lineTo(x + winW / 2, y + winH);
        ctx.stroke();
      }
    }

    // Commercial anime sign at the bottom
    ctx.fillStyle = pal.accent;
    ctx.fillRect(20, size - 45, size - 40, 35);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const brands = ['OPENSQUARE MALL', 'NEO CAFE ☕', 'ANIME ARCADE 🎮', 'KARAOKE 🎤', 'RAMEN ICHIBAN 🍜'];
    ctx.fillText(brands[paletteType % brands.length], size / 2, size - 28);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures[key] = texture;
    return texture;
  }

  // 6. Sidewalk Pavement Texture
  getPavementTexture() {
    if (this.textures.pavement) return this.textures.pavement;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(0, 0, size, size);

    // Cobblestone / slab lines
    ctx.strokeStyle = '#90a4ae';
    ctx.lineWidth = 3;
    const tileSize = 64;
    for (let x = 0; x <= size; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.pavement = texture;
    return texture;
  }
}
