export class Minimap {
  constructor(canvasId, world, roadNetwork) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.world = world;
    this.roads = roadNetwork;

    this.mapRange = 240; // Meters visible around player in 1800m world
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
    // Emerald Lake (x: -330, z: -180, radius: 80)
    const lakeDx = (-330 - playerPos.x) * scale;
    const lakeDz = (-180 - playerPos.z) * scale;
    ctx.beginPath();
    ctx.arc(lakeDx, lakeDz, 80 * scale, 0, Math.PI * 2);
    ctx.fill();

    // River Channel (Width: 26m, length: 280m flowing through -330, -30)
    ctx.save();
    ctx.translate((-330 - playerPos.x) * scale, (-30 - playerPos.z) * scale);
    ctx.rotate(-0.38);
    ctx.fillRect(-13 * scale, -140 * scale, 26 * scale, 280 * scale);
    ctx.restore();

    // ---------------------------------------------------------
    // 2. Road Network (Asphalt base)
    // ---------------------------------------------------------
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 14 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // A. Grand Central Roundabout (Radius: 40m)
    ctx.beginPath();
    ctx.arc(-playerPos.x * scale, -playerPos.z * scale, 40 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // B. Coastal Highway Ring (Radius: 650m)
    ctx.beginPath();
    ctx.arc(-playerPos.x * scale, -playerPos.z * scale, 650 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // C. 4 Major Arterial Avenues (Length 560m each)
    // North Avenue
    ctx.beginPath();
    ctx.moveTo(-playerPos.x * scale, (-46 - playerPos.z) * scale);
    ctx.lineTo(-playerPos.x * scale, (-620 - playerPos.z) * scale);
    ctx.stroke();

    // South Avenue
    ctx.beginPath();
    ctx.moveTo(-playerPos.x * scale, (46 - playerPos.z) * scale);
    ctx.lineTo(-playerPos.x * scale, (620 - playerPos.z) * scale);
    ctx.stroke();

    // East Avenue
    ctx.beginPath();
    ctx.moveTo((46 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.lineTo((620 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.stroke();

    // West Avenue (Crosses heavy steel bridge at -330, -35)
    ctx.beginPath();
    ctx.moveTo((-46 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.lineTo((-620 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.stroke();

    // D. Downtown Internal Streets
    [-160, -90, -30].forEach(rx => {
      ctx.beginPath();
      ctx.moveTo((rx - playerPos.x) * scale, (-200 - playerPos.z) * scale);
      ctx.lineTo((rx - playerPos.x) * scale, (0 - playerPos.z) * scale);
      ctx.stroke();
    });
    [-160, -90, -30].forEach(rz => {
      ctx.beginPath();
      ctx.moveTo((-200 - playerPos.x) * scale, (rz - playerPos.z) * scale);
      ctx.lineTo((0 - playerPos.x) * scale, (rz - playerPos.z) * scale);
      ctx.stroke();
    });

    // E. Mount Sakura Switchback Mountain Pass
    const mtnPts = [
      { x: 120, z: -220 }, { x: 160, z: -280 }, { x: 210, z: -320 },
      { x: 170, z: -380 }, { x: 230, z: -410 }, { x: 275, z: -450 }
    ];
    ctx.beginPath();
    ctx.moveTo((mtnPts[0].x - playerPos.x) * scale, (mtnPts[0].z - playerPos.z) * scale);
    for (let p = 1; p < mtnPts.length; p++) {
      ctx.lineTo((mtnPts[p].x - playerPos.x) * scale, (mtnPts[p].z - playerPos.z) * scale);
    }
    ctx.stroke();

    // F. Sakura Old Town Winding Suburban Roads
    const resPts = [
      { x: 60, z: 60 }, { x: 130, z: 90 }, { x: 200, z: 130 },
      { x: 260, z: 190 }, { x: 330, z: 260 }, { x: 410, z: 340 }, { x: 480, z: 430 }
    ];
    ctx.beginPath();
    ctx.moveTo((resPts[0].x - playerPos.x) * scale, (resPts[0].z - playerPos.z) * scale);
    for (let p = 1; p < resPts.length; p++) {
      ctx.lineTo((resPts[p].x - playerPos.x) * scale, (resPts[p].z - playerPos.z) * scale);
    }
    ctx.stroke();

    // River Bridge Deck (Over river at -330, -35)
    ctx.strokeStyle = '#ef4444'; // Red Japanese steel bridge
    ctx.lineWidth = 16 * scale;
    ctx.beginPath();
    ctx.moveTo((-346 - playerPos.x) * scale, (-35 - playerPos.z) * scale);
    ctx.lineTo((-314 - playerPos.x) * scale, (-35 - playerPos.z) * scale);
    ctx.stroke();

    // Yellow Dashed Centerlines for Roundabout & Avenues
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.arc(-playerPos.x * scale, -playerPos.z * scale, 40 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-playerPos.x * scale, (-46 - playerPos.z) * scale);
    ctx.lineTo(-playerPos.x * scale, (-620 - playerPos.z) * scale);
    ctx.moveTo(-playerPos.x * scale, (46 - playerPos.z) * scale);
    ctx.lineTo(-playerPos.x * scale, (620 - playerPos.z) * scale);
    ctx.moveTo((46 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.lineTo((620 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.moveTo((-46 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.lineTo((-620 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.stroke();
    ctx.setLineDash([]);

    // ---------------------------------------------------------
    // 3. Landmark POI Badges (Icons)
    // ---------------------------------------------------------
    const pois = [
      { icon: '⛩️', x: 275, z: -460 }, // Shinto Shrine
      { icon: '👮', x: -18, z: 52 },   // Police Koban
      { icon: '🏥', x: 52, z: -18 },   // Hospital
      { icon: '🏦', x: -18, z: -52 },  // Bank
      { icon: '🏪', x: 52, z: 18 },    // OpenMart
      { icon: '☕', x: 54, z: 42 }     // Cafe
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
