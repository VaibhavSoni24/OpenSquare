export class Speedometer {
  constructor() {
    this.panel = document.getElementById('speedometer-panel');
    this.speedVal = document.getElementById('speed-value');
    this.gaugeFill = document.getElementById('gauge-fill');
    this.gearText = document.getElementById('gear-text');
    this.headlightIcon = document.getElementById('headlight-indicator');
    this.hornIcon = document.getElementById('horn-indicator');

    this.maxSpeedKmh = 120;
    this.maxDashOffset = 220; // Full stroke dash
  }

  show() {
    if (this.panel) this.panel.classList.remove('hidden');
  }

  hide() {
    if (this.panel) this.panel.classList.add('hidden');
  }

  update(vehicle, isHonking) {
    if (!vehicle) {
      this.hide();
      return;
    }
    this.show();

    const speedKmh = vehicle.getSpeedKmh();
    if (this.speedVal) {
      this.speedVal.textContent = speedKmh;
    }

    // Arc offset: 220 is empty, 0 is full
    const factor = Math.min(1.0, speedKmh / this.maxSpeedKmh);
    const offset = this.maxDashOffset - factor * this.maxDashOffset;
    if (this.gaugeFill) {
      this.gaugeFill.style.strokeDashoffset = offset;
    }

    // Gear indicator
    if (this.gearText) {
      if (vehicle.speed < -0.2) {
        this.gearText.textContent = 'R';
        this.gearText.style.color = '#ef4444';
      } else if (speedKmh === 0) {
        this.gearText.textContent = 'P';
        this.gearText.style.color = '#ffd166';
      } else {
        this.gearText.textContent = 'D';
        this.gearText.style.color = '#38bdf8';
      }
    }

    // Headlight indicator
    if (this.headlightIcon) {
      if (vehicle.headlightsOn) {
        this.headlightIcon.classList.add('active');
      } else {
        this.headlightIcon.classList.remove('active');
      }
    }

    // Horn indicator
    if (this.hornIcon) {
      if (isHonking) {
        this.hornIcon.classList.add('active');
      } else {
        this.hornIcon.classList.remove('active');
      }
    }
  }
}
