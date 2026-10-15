export class Minimap {
  constructor(canvasId, world, roadNetwork) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.world = world;
    this.roads = roadNetwork;

    this.mapRange = 160; // Meters visible around player
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

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Push transform centered at player
    ctx.save();
    ctx.translate(cx, cy);

    // Rotate so top is player's forward direction
    ctx.rotate(playerRotationY);

    // 1. Draw Road Network (Asphalt base + Yellow centerlines)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 14 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // A. Grand Central Roundabout
    ctx.beginPath();
    ctx.arc(-playerPos.x * scale, -playerPos.z * scale, 34 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // B. Coastal Highway Ring (370m)
    ctx.beginPath();
    ctx.arc(-playerPos.x * scale, -playerPos.z * scale, 368 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // C. 4 Major Arterial Avenues (North, South, East, West)
    // North Avenue
    ctx.beginPath();
    ctx.moveTo(-playerPos.x * scale, (-38 - playerPos.z) * scale);
    ctx.lineTo(-playerPos.x * scale, (-350 - playerPos.z) * scale);
    ctx.stroke();

    // South Avenue
    ctx.beginPath();
    ctx.moveTo(-playerPos.x * scale, (38 - playerPos.z) * scale);
    ctx.lineTo(-playerPos.x * scale, (350 - playerPos.z) * scale);
    ctx.stroke();

    // East Avenue
    ctx.beginPath();
    ctx.moveTo((38 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.lineTo((350 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.stroke();

    // West Avenue
    ctx.beginPath();
    ctx.moveTo((-38 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.lineTo((-350 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.stroke();

    // D. Downtown Internal Streets
    [-160, -90, -30].forEach(rx => {
      ctx.beginPath();
      ctx.moveTo((rx - playerPos.x) * scale, (-180 - playerPos.z) * scale);
      ctx.lineTo((rx - playerPos.x) * scale, (-10 - playerPos.z) * scale);
      ctx.stroke();
    });
    [-160, -90, -30].forEach(rz => {
      ctx.beginPath();
      ctx.moveTo((-180 - playerPos.x) * scale, (rz - playerPos.z) * scale);
      ctx.lineTo((-10 - playerPos.x) * scale, (rz - playerPos.z) * scale);
      ctx.stroke();
    });

    // E. Sakura Residential Curved Road
    const sakuraPts = [
      { x: 45, z: 45 }, { x: 95, z: 65 }, { x: 145, z: 95 },
      { x: 195, z: 140 }, { x: 230, z: 195 }, { x: 250, z: 260 }
    ];
    ctx.beginPath();
    ctx.moveTo((sakuraPts[0].x - playerPos.x) * scale, (sakuraPts[0].z - playerPos.z) * scale);
    for (let p = 1; p < sakuraPts.length; p++) {
      ctx.lineTo((sakuraPts[p].x - playerPos.x) * scale, (sakuraPts[p].z - playerPos.z) * scale);
    }
    ctx.stroke();

    // Yellow Dashed Centerlines for Roundabout & Avenues
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.arc(-playerPos.x * scale, -playerPos.z * scale, 34 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-playerPos.x * scale, (-38 - playerPos.z) * scale);
    ctx.lineTo(-playerPos.x * scale, (-350 - playerPos.z) * scale);
    ctx.moveTo(-playerPos.x * scale, (38 - playerPos.z) * scale);
    ctx.lineTo(-playerPos.x * scale, (350 - playerPos.z) * scale);
    ctx.moveTo((38 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.lineTo((350 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.moveTo((-38 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.lineTo((-350 - playerPos.x) * scale, -playerPos.z * scale);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Vehicles (cyan dots)
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

    // 3. Draw Pedestrians (yellow dots)
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

    // 4. Center Player Arrow (Always pointing straight UP)
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
