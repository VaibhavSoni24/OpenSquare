export class Minimap {
  constructor(canvasId, world, roadNetwork) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.world = world;
    this.roads = roadNetwork;

    this.mapRange = 320; // Meters visible around player in 3400m realm
    this.width = this.canvas ? this.canvas.width : 220;
    this.height = this.canvas ? this.canvas.height : 220;
  }

  update(playerPos, playerRotationY, vehicles = [], pedestrians = []) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = (w / 2) / this.mapRange;

    // Clear background (Dark anime tactical navy)
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, w, h);

    // Push transform centered at player
    ctx.save();
    ctx.translate(cx, cy);

    // Rotate so top is player's forward direction
    ctx.rotate(playerRotationY);

    // ---------------------------------------------------------
    // 1. Water Bodies (Emerald Lake & River Channel)
    // ---------------------------------------------------------
    ctx.fillStyle = '#0284c7'; // Turquoise blue
    // Emerald Lake (x: -360, z: 40, radius: 115)
    const lakeDx = (-360 - playerPos.x) * scale;
    const lakeDz = (40 - playerPos.z) * scale;
    ctx.beginPath();
    ctx.arc(lakeDx, lakeDz, 115 * scale, 0, Math.PI * 2);
    ctx.fill();

    // River Channel towards (-950, 450)
    ctx.save();
    ctx.translate((-360 - playerPos.x) * scale, (40 - playerPos.z) * scale);
    ctx.rotate(-0.58);
    ctx.fillRect(-22 * scale, 0, 44 * scale, 580 * scale);
    ctx.restore();

    // ---------------------------------------------------------
    // 2. Road Network (Asphalt base)
    // ---------------------------------------------------------
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 16 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // A. Grand Central Boulevard (East-West along z = 40)
    ctx.beginPath();
    ctx.moveTo((-240 - playerPos.x) * scale, (40 - playerPos.z) * scale);
    ctx.lineTo((540 - playerPos.x) * scale, (40 - playerPos.z) * scale);
    ctx.stroke();

    // B. Downtown Financial Avenue (North-South along x = 0)
    ctx.beginPath();
    ctx.moveTo((0 - playerPos.x) * scale, (-360 - playerPos.z) * scale);
    ctx.lineTo((0 - playerPos.x) * scale, (460 - playerPos.z) * scale);
    ctx.stroke();

    // C. Grand Central Roundabout at (0, 40)
    ctx.beginPath();
    ctx.arc((0 - playerPos.x) * scale, (40 - playerPos.z) * scale, 36 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // D. Commercial Grid Streets
    [120, 240, 380].forEach(gx => {
      ctx.beginPath();
      ctx.moveTo((gx - playerPos.x) * scale, (-320 - playerPos.z) * scale);
      ctx.lineTo((gx - playerPos.x) * scale, (80 - playerPos.z) * scale);
      ctx.stroke();
    });
    [-120, -240].forEach(gz => {
      ctx.beginPath();
      ctx.moveTo((0 - playerPos.x) * scale, (gz - playerPos.z) * scale);
      ctx.lineTo((450 - playerPos.x) * scale, (gz - playerPos.z) * scale);
      ctx.stroke();
    });

    // E. Sakura Town Residential Lanes
    [160, 280, 420, 560].forEach(rz => {
      ctx.beginPath();
      ctx.moveTo((-80 - playerPos.x) * scale, (rz - playerPos.z) * scale);
      ctx.lineTo((500 - playerPos.x) * scale, (rz - playerPos.z) * scale);
      ctx.stroke();
    });

    // F. Lighthouse Knitted Forest Highway
    const lhPts = [
      { x: -480, z: 40 }, { x: -600, z: 20 }, { x: -720, z: -100 },
      { x: -820, z: -300 }, { x: -880, z: -520 }, { x: -950, z: -750 }
    ];
    ctx.beginPath();
    ctx.moveTo((lhPts[0].x - playerPos.x) * scale, (lhPts[0].z - playerPos.z) * scale);
    for (let p = 1; p < lhPts.length; p++) {
      ctx.lineTo((lhPts[p].x - playerPos.x) * scale, (lhPts[p].z - playerPos.z) * scale);
    }
    ctx.stroke();

    // G. Mount Sakura Switchback Mountain Road
    const mtnPts = [
      { x: 400, z: 40 }, { x: 450, z: -100 }, { x: 520, z: -220 },
      { x: 600, z: -340 }, { x: 530, z: -420 }, { x: 620, z: -490 },
      { x: 560, z: -530 }, { x: 650, z: -550 }
    ];
    ctx.beginPath();
    ctx.moveTo((mtnPts[0].x - playerPos.x) * scale, (mtnPts[0].z - playerPos.z) * scale);
    for (let p = 1; p < mtnPts.length; p++) {
      ctx.lineTo((mtnPts[p].x - playerPos.x) * scale, (mtnPts[p].z - playerPos.z) * scale);
    }
    ctx.stroke();

    // ---------------------------------------------------------
    // The Grand Emerald Lake Bridge (Red Steel Truss Span)
    // ---------------------------------------------------------
    ctx.strokeStyle = '#ef4444'; // Japanese Vermilion Red Bridge Deck
    ctx.lineWidth = 18 * scale;
    ctx.beginPath();
    ctx.moveTo((-485 - playerPos.x) * scale, (40 - playerPos.z) * scale);
    ctx.lineTo((-235 - playerPos.x) * scale, (40 - playerPos.z) * scale);
    ctx.stroke();

    // Yellow Dashed Centerlines for Boulevards
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo((-240 - playerPos.x) * scale, (40 - playerPos.z) * scale);
    ctx.lineTo((540 - playerPos.x) * scale, (40 - playerPos.z) * scale);
    ctx.moveTo((0 - playerPos.x) * scale, (-360 - playerPos.z) * scale);
    ctx.lineTo((0 - playerPos.x) * scale, (460 - playerPos.z) * scale);
    ctx.stroke();
    ctx.setLineDash([]);

    // ---------------------------------------------------------
    // 3. Landmark POI Badges (Icons)
    // ---------------------------------------------------------
    const pois = [
      { icon: '⛩️', x: 650, z: -550 },  // Mount Sakura Shrine
      { icon: '⛵', x: -950, z: -750 }, // Lighthouse
      { icon: '👮', x: -80, z: -40 },   // Police Station
      { icon: '🏥', x: -150, z: -80 },  // Hospital
      { icon: '🏦', x: -80, z: -120 },  // Bank
      { icon: '🏪', x: 240, z: -80 },   // OpenMart
      { icon: '☕', x: 180, z: -40 },   // Cafe
      { icon: '🌲', x: -360, z: 40 }    // Emerald Lake
    ];

    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    pois.forEach(poi => {
      const px = (poi.x - playerPos.x) * scale;
      const pz = (poi.z - playerPos.z) * scale;
      if (Math.hypot(px, pz) < w / 2 - 12) {
        ctx.fillText(poi.icon, px, pz);
      }
    });

    // ---------------------------------------------------------
    // 4. Vehicles (Cyan dots) & Pedestrians (Yellow dots)
    // ---------------------------------------------------------
    ctx.fillStyle = '#00f2fe';
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      const vp = v.root.position;
      const dx = (vp.x - playerPos.x) * scale;
      const dz = (vp.z - playerPos.z) * scale;
      if (Math.hypot(dx, dz) < w / 2 - 8) {
        ctx.beginPath();
        ctx.arc(dx, dz, 3.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < pedestrians.length; i++) {
      const ped = pedestrians[i];
      const pp = ped.root.position;
      const dx = (pp.x - playerPos.x) * scale;
      const dz = (pp.z - playerPos.z) * scale;
      if (Math.hypot(dx, dz) < w / 2 - 8) {
        ctx.beginPath();
        ctx.arc(dx, dz, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // ---------------------------------------------------------
    // 5. Center Player Arrow (Always pointing straight UP)
    // ---------------------------------------------------------
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ff007f';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 8);
    ctx.lineTo(0, 4.5);
    ctx.lineTo(-7, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
