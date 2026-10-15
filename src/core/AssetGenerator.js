import * as THREE from 'three';

export class AssetGenerator {
  constructor() {
    this.textures = {};
    this.toonGradient = this.createToonGradient();
  }

  createToonGradient() {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');

    // 4 sharp anime shading steps (smooth shadow to bright anime highlight)
    const colors = ['#4a5568', '#718096', '#cbd5e1', '#ffffff'];
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i, 0, 1, 1);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }

  createToonMaterial(color, options = {}) {
    return new THREE.MeshToonMaterial({
      color: new THREE.Color(color),
      gradientMap: this.toonGradient,
      ...options
    });
  }

  // 1. High-Definition Crisp Anime Road Texture with Lane Arrows & Markings
  getRoadTexture() {
    if (this.textures.road) return this.textures.road;

    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Dark charcoal anime asphalt with soft cool tint
    ctx.fillStyle = '#1e2330';
    ctx.fillRect(0, 0, size, size);

    // Subtle grain texture
    for (let i = 0; i < 2500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(x, y, 3, 3);
    }

    // Outer white lane border lines (curbside line)
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(50, size);
    ctx.moveTo(size - 50, 0);
    ctx.lineTo(size - 50, size);
    ctx.stroke();

    // Center double-yellow or dashed divider
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 14;
    ctx.setLineDash([80, 50]);
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();

    // Painted Lane Direction Arrows (Northbound right lane, Southbound left lane)
    ctx.setLineDash([]);
    ctx.fillStyle = '#f8fafc';

    // Helper for stylized road arrow
    const drawArrow = (cx, cy, angle = 0) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.lineTo(24, -20);
      ctx.lineTo(10, -20);
      ctx.lineTo(10, 50);
      ctx.lineTo(-10, 50);
      ctx.lineTo(-10, -20);
      ctx.lineTo(-24, -20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Right lane arrow
    drawArrow(size * 0.72, size * 0.45, 0);
    // Left lane arrow (reverse)
    drawArrow(size * 0.28, size * 0.55, Math.PI);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.road = texture;
    return texture;
  }

  // 2. Crosswalk Texture with Tactile Paving
  getCrosswalkTexture() {
    if (this.textures.crosswalk) return this.textures.crosswalk;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Asphalt base
    ctx.fillStyle = '#1e2330';
    ctx.fillRect(0, 0, size, size);

    // Bold white zebra stripes
    ctx.fillStyle = '#ffffff';
    const barW = 46;
    const gap = 38;
    for (let x = 24; x < size; x += barW + gap) {
      ctx.fillRect(x, 30, barW, size - 60);
    }

    // Yellow tactile dots row along sidewalk edge (Japanese road standard)
    ctx.fillStyle = '#facc15';
    for (let x = 15; x < size; x += 30) {
      ctx.beginPath();
      ctx.arc(x, 15, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, size - 15, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.crosswalk = texture;
    return texture;
  }

  // Sidewalk Paver Texture with Tactile Guide Strips
  getSidewalkTexture() {
    if (this.textures.sidewalk) return this.textures.sidewalk;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Concrete paving tone
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, size, size);

    // Grid paver tiles
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
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

    // Yellow tactile paving strip in center (Japanese road standard)
    ctx.fillStyle = '#facc15';
    ctx.fillRect(size / 2 - 20, 0, 40, size);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    for (let y = 10; y < size; y += 24) {
      ctx.strokeRect(size / 2 - 16, y, 32, 12);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.sidewalk = texture;
    return texture;
  }

  // 3. Anime Stylized Grass with Painterly Swirls
  getGrassTexture() {
    if (this.textures.grass) return this.textures.grass;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Multi-tone lush anime green
    const grad = ctx.createRadialGradient(size / 2, size / 2, 40, size / 2, size / 2, size * 0.75);
    grad.addColorStop(0, '#5eead4'); // Mint highlight
    grad.addColorStop(0.3, '#4ade80'); // Emerald
    grad.addColorStop(0.8, '#22c55e'); // Rich green
    grad.addColorStop(1, '#16a34a'); // Shaded edge
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Painterly clover & grass strokes
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.strokeStyle = Math.random() > 0.4 ? '#86efac' : '#15803d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() * 10 - 5), y - (8 + Math.random() * 10));
      ctx.stroke();
    }

    // Anime Flowers (Sakura blossoms & White daisies)
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const flowerColor = ['#ffffff', '#fef08a', '#fbcfe8', '#fed7aa'][Math.floor(Math.random() * 4)];
      ctx.fillStyle = flowerColor;
      for (let p = 0; p < 5; p++) {
        const ang = (p * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(x + Math.cos(ang) * 5, y + Math.sin(ang) * 5, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(40, 40); // Repeat across island
    this.textures.grass = texture;
    return texture;
  }

  // 4. Concrete Sidewalk with Japanese Pavers
  getPavementTexture() {
    if (this.textures.pavement) return this.textures.pavement;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, size, size);

    // Grid of clean anime square paving slabs
    ctx.strokeStyle = '#94a3b8';
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

  getSkyscraperTexture(paletteType = 0) {
    return this.getFacadeTexture(paletteType);
  }

  getFacadeTexture(paletteType = 0) {
    let index = 0;
    if (typeof paletteType === 'number') {
      index = Math.abs(Math.floor(paletteType));
    } else if (typeof paletteType === 'string') {
      const map = { glass: 0, commercial: 1, luxury: 2, cyber: 3 };
      index = map[paletteType.toLowerCase()] !== undefined ? map[paletteType.toLowerCase()] : 0;
    }
    const key = `facade_${index}`;
    if (this.textures[key]) return this.textures[key];

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const themes = [
      { wall: '#1e293b', winOn: '#fef08a', winOff: '#0f172a', accent: '#06b6d4', brand: 'OPENSQUARE TOWER 🏢' },
      { wall: '#334155', winOn: '#67e8f9', winOff: '#1e293b', accent: '#ec4899', brand: 'NEO ARCADE 🎮' },
      { wall: '#1e1b4b', winOn: '#f472b6', winOff: '#0f172a', accent: '#a855f7', brand: 'CYBER CAFE ☕' },
      { wall: '#3f3f46', winOn: '#fef9c3', winOff: '#18181b', accent: '#f59e0b', brand: 'SHIBUYA SOUNDS 🎧' }
    ];
    const theme = themes[index % themes.length] || themes[0];

    ctx.fillStyle = theme.wall;
    ctx.fillRect(0, 0, size, size);

    // Glowing window grid
    const cols = 8;
    const rows = 12;
    const pad = 12;
    const w = (size - pad * (cols + 1)) / cols;
    const h = (size - 70 - pad * (rows + 1)) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = pad + c * (w + pad);
        const y = pad + r * (h + pad);
        const isLit = Math.random() > 0.45;
        ctx.fillStyle = isLit ? theme.winOn : theme.winOff;
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
      }
    }

    // Commercial Neon Banner at ground level
    ctx.fillStyle = theme.accent;
    ctx.fillRect(16, size - 56, size - 32, 44);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(theme.brand, size / 2, size - 34);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures[key] = texture;
    return texture;
  }

  // 6. Cute Anime Cafe Storefront Texture ("SAKURA CAFE")
  getCafeTexture() {
    if (this.textures.cafe) return this.textures.cafe;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Warm timber paneling
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, size, size);

    // Striped Awning at top
    const stripes = 12;
    const stripeW = size / stripes;
    for (let s = 0; s < stripes; s++) {
      ctx.fillStyle = s % 2 === 0 ? '#f43f5e' : '#fff1f2';
      ctx.fillRect(s * stripeW, 0, stripeW, 80);
    }

    // Awning shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 80, size, 14);

    // Signboard
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(40, 100, size - 80, 50);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 100, size - 80, 50);
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌸 SAKURA CAFE & TEA ☕', size / 2, 126);

    // Large glass bay windows
    const winW = (size - 80) / 2;
    [30, 30 + winW + 20].forEach(wx => {
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(wx, 170, winW, 280);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 6;
      ctx.strokeRect(wx, 170, winW, 280);

      // Window cross
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(wx + winW / 2, 170);
      ctx.lineTo(wx + winW / 2, 450);
      ctx.moveTo(wx, 310);
      ctx.lineTo(wx + winW, 310);
      ctx.stroke();

      // Interior silhouette: coffee cups & plants
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(wx + 30, 430, 15, 0, Math.PI * 2);
      ctx.fill();
    });

    // Front door
    ctx.fillStyle = '#92400e';
    ctx.fillRect(size / 2 - 35, 230, 70, 220);
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 4;
    ctx.strokeRect(size / 2 - 28, 245, 56, 120);

    const texture = new THREE.CanvasTexture(canvas);
    this.textures.cafe = texture;
    return texture;
  }

  // 7. Iconic Japanese Convenience Store ("OpenMart 🏪")
  getConvenienceStoreTexture() {
    if (this.textures.conbini) return this.textures.conbini;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Clean white paneling
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, size, size);

    // Tri-color Japanese Convenience Store Signage Stripe (Cyan, Orange, Green)
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(0, 20, size, 25);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, 45, size, 25);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 70, size, 25);

    // Store Logo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 25, size - 80, 65);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏪 OpenMart 24H', size / 2, 58);

    // Full-height illuminated glass facade
    ctx.fillStyle = '#f0fdf4';
    ctx.fillRect(30, 130, size - 60, 340);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 130, size - 60, 340);

    // Interior bright aisles & snacks
    for (let a = 0; a < 4; a++) {
      ctx.fillStyle = ['#f87171', '#60a5fa', '#facc15', '#4ade80'][a];
      ctx.fillRect(50 + a * 105, 260, 85, 120);
      ctx.fillStyle = '#334155';
      ctx.fillRect(50 + a * 105, 380, 85, 15);
    }

    // Sliding automatic doors
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.strokeRect(size / 2 - 50, 200, 100, 270);
    ctx.beginPath();
    ctx.moveTo(size / 2, 200);
    ctx.lineTo(size / 2, 470);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    this.textures.conbini = texture;
    return texture;
  }

  // 8. Traditional Ramen Shop Front ("RAMEN ICHIBAN 🍜")
  getRamenShopTexture() {
    if (this.textures.ramen) return this.textures.ramen;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Dark cedar wood
    ctx.fillStyle = '#291e17';
    ctx.fillRect(0, 0, size, size);

    // Tiled eave roof
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, size, 70);

    // Red hanging paper lanterns (Chochin)
    [90, 200, 310, 420].forEach(lx => {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(lx, 100, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('拉麺', lx, 100);
    });

    // Red Noren Curtains
    const curtainCount = 5;
    const cW = (size - 60) / curtainCount;
    for (let c = 0; c < curtainCount; c++) {
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(30 + c * cW + 4, 150, cW - 8, 120);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      const kanji = ['一', '番', 'ラ', 'ー', '麺'];
      ctx.fillText(kanji[c], 30 + c * cW + cW / 2, 210);
    }

    // Wooden lower lattice
    ctx.fillStyle = '#451a03';
    ctx.fillRect(30, 280, size - 60, 200);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    for (let ly = 290; ly < 470; ly += 24) {
      ctx.beginPath();
      ctx.moveTo(30, ly);
      ctx.lineTo(size - 30, ly);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.textures.ramen = texture;
    return texture;
  }

  // 9. Japanese Beverage Vending Machine Texture
  getVendingMachineTexture() {
    if (this.textures.vending) return this.textures.vending;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Vibrant Red / Blue vending casing
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, size, size);

    // Top logo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COLD DRINKS 🥤', size / 2, 30);

    // Glass display panel
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(16, 45, size - 32, 130);

    // Display rows of cute mini cans & bottles
    const canColors = ['#f87171', '#60a5fa', '#facc15', '#4ade80', '#c084fc'];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 5; col++) {
        const cx = 28 + col * 42;
        const cy = 60 + row * 60;
        ctx.fillStyle = canColors[col % canColors.length];
        ctx.fillRect(cx, cy, 26, 38);

        // Price button (glowing green/blue)
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(cx + 4, cy + 42, 18, 8);
      }
    }

    // Dispenser tray
    ctx.fillStyle = '#18181b';
    ctx.fillRect(24, size - 60, size - 48, 45);
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, size - 60, size - 48, 45);

    const texture = new THREE.CanvasTexture(canvas);
    this.textures.vending = texture;
    return texture;
  }

  // 10. Japanese Police Station ("KOBAN 👮") Facade Texture
  getPoliceTexture() {
    return this.getPoliceStationTexture();
  }

  getPoliceStationTexture() {
    if (this.textures.police) return this.textures.police;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Clean white & slate facade
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, size, size);

    // Dark slate ground foundation
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, size - 80, size, 80);

    // Blue & Gold Police Emblem / Signboard
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(40, 20, size - 80, 70);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 20, size - 80, 70);

    // Gold Police Star & Text
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👮 POLICE STATION 🚔', size / 2, 45);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('交番 KOBAN · CENTRAL DISTRICT', size / 2, 72);

    // Large glass inquiry windows
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(40, 120, size - 80, 300);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 120, size - 80, 300);

    // Window muntins
    ctx.beginPath();
    ctx.moveTo(size / 2, 120);
    ctx.lineTo(size / 2, 420);
    ctx.moveTo(40, 270);
    ctx.lineTo(size - 40, 270);
    ctx.stroke();

    // Red Emergency Beacon Light on top
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(size / 2, 12, 10, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    this.textures.police = texture;
    return texture;
  }

  // 11. Hospital & Emergency Center ("+ HOSPITAL 🏥") Facade Texture
  getHospitalTexture() {
    if (this.textures.hospital) return this.textures.hospital;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Clinical clean white & teal paneling
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Mint/Teal header strip
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(0, 0, size, 85);

    // Bold Red Cross Emblem
    ctx.fillStyle = '#ef4444';
    const cx = 80;
    const cy = 42;
    ctx.fillRect(cx - 8, cy - 26, 16, 52);
    ctx.fillRect(cx - 26, cy - 8, 52, 16);

    // Hospital Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('CENTRAL HOSPITAL', 130, 35);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('EMERGENCY MEDICAL 24H 🏥', 130, 62);

    // Rows of hospital windows
    const cols = 6;
    const rows = 4;
    const pad = 18;
    const winW = (size - pad * (cols + 1)) / cols;
    const winH = 45;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = pad + c * (winW + pad);
        const y = 110 + r * (winH + pad);
        ctx.fillStyle = Math.random() > 0.3 ? '#ccfbf1' : '#134e4a';
        ctx.fillRect(x, y, winW, winH);
        ctx.strokeStyle = '#0f766e';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, winW, winH);
      }
    }

    // Emergency Ambulance Bay Doors
    ctx.fillStyle = '#ccfbf1';
    ctx.fillRect(50, size - 120, size - 100, 110);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.strokeRect(50, size - 120, size - 100, 110);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚑 EMERGENCY AMBULANCE BAY 🚑', size / 2, size - 60);

    const texture = new THREE.CanvasTexture(canvas);
    this.textures.hospital = texture;
    return texture;
  }

  // 12. City Central Bank ("OPEN BANK 🏦") Facade Texture
  getBankTexture() {
    if (this.textures.bank) return this.textures.bank;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Marble granite texture
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    // Gilded Classical Pediment Banner
    ctx.fillStyle = '#d97706';
    ctx.fillRect(30, 20, size - 60, 75);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 20, size - 60, 75);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OPEN SQUARE BANK 🏦', size / 2, 46);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CENTRAL RESERVE & VAULT', size / 2, 74);

    // Tall Bronze Vault Glass Windows
    const winW = (size - 100) / 4;
    for (let i = 0; i < 4; i++) {
      const wx = 35 + i * (winW + 10);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(wx, 120, winW, 350);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 4;
      ctx.strokeRect(wx, 120, winW, 350);

      // Gold security grill bars
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      for (let gy = 140; gy < 460; gy += 30) {
        ctx.beginPath();
        ctx.moveTo(wx, gy);
        ctx.lineTo(wx + winW, gy);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.textures.bank = texture;
    return texture;
  }

  // 13. Traditional Shinto Temple / Shrine ("⛩️ JINJA") Wall Texture
  getTempleTexture() {
    if (this.textures.temple) return this.textures.temple;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Aged cedar wood panels
    ctx.fillStyle = '#3f2212';
    ctx.fillRect(0, 0, size, size);

    // Vermilion lacquered pillars & lintels
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, size, 40);
    ctx.fillRect(0, size - 40, size, 40);
    ctx.fillRect(0, 0, 40, size);
    ctx.fillRect(size - 40, 0, 40, size);

    // Golden Imperial Chrysanthemum / Sakura Crest (Mon)
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f2212';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 35, 0, Math.PI * 2);
    ctx.fill();

    // Sacred White Paper Zigzags (Shide)
    ctx.fillStyle = '#ffffff';
    for (let s = 60; s < size - 60; s += 80) {
      ctx.beginPath();
      ctx.moveTo(s, 40);
      ctx.lineTo(s + 18, 70);
      ctx.lineTo(s + 6, 85);
      ctx.lineTo(s + 24, 120);
      ctx.lineTo(s + 12, 120);
      ctx.lineTo(s - 6, 85);
      ctx.lineTo(s + 6, 70);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.textures.temple = texture;
    return texture;
  }

  // 14. Colorful Neon Billboards for Skyscrapers
  getBillboardTexture(type = 0) {
    const key = `billboard_${type}`;
    if (this.textures[key]) return this.textures[key];

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2; // 2:1 widescreen billboard
    const ctx = canvas.getContext('2d');

    const ads = [
      { bg: '#ec4899', title: '🌸 VIRTUAL IDOL LIVE', sub: 'TOKYO DOME 2026 · TICKETS ON SALE' },
      { bg: '#06b6d4', title: '⚡ CYBER ENERGY DRINK', sub: 'SUPER BOOST YOUR SENSES · 0 CALORIES' },
      { bg: '#8b5cf6', title: '🎮 NEO ANIME ARCADE', sub: 'VR MECHA FIGHTER 7 NOW PLAYING' }
    ];
    const ad = ads[type % ads.length];

    ctx.fillStyle = ad.bg;
    ctx.fillRect(0, 0, size, size / 2);

    // Outer glow border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, size - 12, size / 2 - 12);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ad.title, size / 2, 80);

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(ad.sub, size / 2, 160);

    const texture = new THREE.CanvasTexture(canvas);
    this.textures[key] = texture;
    return texture;
  }

  // 15. Helper Texture Aliases
  getMartTexture() {
    return this.getConvenienceStoreTexture();
  }

  getRamenTexture() {
    return this.getRamenShopTexture();
  }

  // 16. Japanese Residential House Wall Texture
  getHouseWallTexture() {
    if (this.textures.houseWall) return this.textures.houseWall;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Warm cream stucco
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, size, size);

    // Cedar timber corner posts and baseboard
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, size, 16);
    ctx.fillRect(0, size - 24, size, 24);
    ctx.fillRect(0, 0, 18, size);
    ctx.fillRect(size - 18, 0, 18, size);

    // Upper and lower shoji windows
    [70, 290].forEach(wy => {
      [50, 300].forEach(wx => {
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(wx, wy, 160, 130);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 4;
        ctx.strokeRect(wx, wy, 160, 130);

        // Window grid
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wx + 80, wy);
        ctx.lineTo(wx + 80, wy + 130);
        ctx.moveTo(wx, wy + 65);
        ctx.lineTo(wx + 160, wy + 65);
        ctx.stroke();
      });
    });

    const texture = new THREE.CanvasTexture(canvas);
    this.textures.houseWall = texture;
    return texture;
  }

  // 17. Japanese Scalloped Tile Roof Texture
  getTileRoofTexture(tint = 0x334155) {
    const key = `tileRoof_${tint}`;
    if (this.textures[key]) return this.textures[key];

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const hex = typeof tint === 'number' ? '#' + tint.toString(16).padStart(6, '0') : tint;
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, size, size);

    // Scalloped tile curves
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 3;
    for (let y = 0; y < size; y += 32) {
      for (let x = 0; x < size; x += 32) {
        ctx.beginPath();
        ctx.arc(x + 16, y, 16, 0, Math.PI);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures[key] = texture;
    return texture;
  }
}
