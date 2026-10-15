export class Minimap {
  constructor(canvasId, world, roadNetwork) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.world = world;
    this.roads = roadNetwork;

    this.mapRange = 140; // Meters visible around player
    this.width = this.canvas ? this.canvas.width : 200;
    this.height = this.canvas ? this.canvas.height : 200;
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

    // 1. Draw Grid Roads
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 14 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Downtown avenues
    [-90, 0, 90].forEach(rx => {
      ctx.beginPath();
      ctx.moveTo((rx - playerPos.x) * scale, (-120 - playerPos.z) * scale);
      ctx.lineTo((rx - playerPos.x) * scale, (120 - playerPos.z) * scale);
      ctx.stroke();
    });

    [-90, 0, 90].forEach(rz => {
      ctx.beginPath();
      ctx.moveTo((-120 - playerPos.x) * scale, (rz - playerPos.z) * scale);
      ctx.lineTo((120 - playerPos.x) * scale, (rz - playerPos.z) * scale);
      ctx.stroke();
    });

    // Highway loop
    ctx.beginPath();
    ctx.arc(-playerPos.x * scale, -playerPos.z * scale, 260 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Road center lines
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    [-90, 0, 90].forEach(rx => {
      ctx.beginPath();
      ctx.moveTo((rx - playerPos.x) * scale, (-120 - playerPos.z) * scale);
      ctx.lineTo((rx - playerPos.x) * scale, (120 - playerPos.z) * scale);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // 2. Draw Vehicles (cyan blips)
    ctx.fillStyle = '#00f2fe';
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      const vp = v.root.position;
      const dx = (vp.x - playerPos.x) * scale;
      const dz = (vp.z - playerPos.z) * scale;
      if (Math.hypot(dx, dz) < w / 2 - 8) {
        ctx.beginPath();
        ctx.arc(dx, dz, 3.5, 0, Math.PI * 2);
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
        ctx.arc(dx, dz, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // 4. Draw Center Player Icon (Always pointing UP)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ff007f';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
