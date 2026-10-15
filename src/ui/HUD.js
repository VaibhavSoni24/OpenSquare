import { Minimap } from './Minimap.js';
import { Speedometer } from './Speedometer.js';

export class HUD {
  constructor(world, roadNetwork, audioManager, cameraSystem) {
    this.world = world;
    this.roads = roadNetwork;
    this.audio = audioManager;
    this.cameraSystem = cameraSystem;

    // Sub-components
    this.minimap = new Minimap('minimap-canvas', world, roadNetwork);
    this.speedometer = new Speedometer();

    // DOM Elements
    this.hudContainer = document.getElementById('hud');
    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingBar = document.getElementById('loading-bar');
    this.loadingStatus = document.getElementById('loading-status');
    this.districtBadge = document.getElementById('district-badge');
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptActionText = document.getElementById('prompt-action-text');
    this.messageToast = document.getElementById('hud-message');

    // Controls Modal
    this.modal = document.getElementById('controls-modal');
    this.modalCloseBtn = document.getElementById('modal-close-btn');
    this.modalStartBtn = document.getElementById('modal-start-btn');
    this.btnHelp = document.getElementById('btn-help');

    // Top buttons
    this.btnTime = document.getElementById('btn-time');
    this.btnRadio = document.getElementById('btn-radio');
    this.btnCamera = document.getElementById('btn-camera');

    this.initEventListeners();
  }

  initEventListeners() {
    // Time button
    if (this.btnTime) {
      this.btnTime.addEventListener('click', () => {
        const timeName = this.world.cycleTimeOfDay();
        const label = this.btnTime.querySelector('.btn-label');
        if (label) label.textContent = timeName.split(' ')[1] || timeName;
        this.showMessage(`Time of day changed to ${timeName}`);
      });
    }

    // Radio button
    if (this.btnRadio) {
      this.btnRadio.addEventListener('click', () => {
        const station = this.audio.cycleRadio();
        const label = this.btnRadio.querySelector('.btn-label');
        if (label) label.textContent = station;
        this.showMessage(`Radio tuned to ${station}`);
      });
    }

    // Camera button
    if (this.btnCamera) {
      this.btnCamera.addEventListener('click', () => {
        const camMode = this.cameraSystem.cycleMode();
        const label = this.btnCamera.querySelector('.btn-label');
        if (label) label.textContent = camMode.split(' ')[0] || camMode;
        this.showMessage(`Camera switched to ${camMode}`);
      });
    }

    // Help modal listeners
    if (this.btnHelp) {
      this.btnHelp.addEventListener('click', () => this.toggleModal());
    }
    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.modalStartBtn) {
      this.modalStartBtn.addEventListener('click', () => {
        this.closeModal();
        this.audio.ensureContext();
      });
    }

    // Keyboard shortcut for help modal (Tab or H)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        this.toggleModal();
      } else if (e.code === 'KeyT' && !e.repeat && this.modal.classList.contains('hidden')) {
        // Toggle time
        const timeName = this.world.cycleTimeOfDay();
        const label = this.btnTime ? this.btnTime.querySelector('.btn-label') : null;
        if (label) label.textContent = timeName.split(' ')[1] || timeName;
        this.showMessage(`Time: ${timeName}`);
      } else if (e.code === 'KeyR' && !e.repeat && this.modal.classList.contains('hidden')) {
        // Cycle radio
        const station = this.audio.cycleRadio();
        const label = this.btnRadio ? this.btnRadio.querySelector('.btn-label') : null;
        if (label) label.textContent = station;
        this.showMessage(`Radio: ${station}`);
      } else if (e.code === 'KeyC' && !e.repeat && this.modal.classList.contains('hidden')) {
        // Cycle camera
        const camMode = this.cameraSystem.cycleMode();
        const label = this.btnCamera ? this.btnCamera.querySelector('.btn-label') : null;
        if (label) label.textContent = camMode.split(' ')[0] || camMode;
        this.showMessage(`Camera: ${camMode}`);
      }
    });
  }

  setLoadingProgress(pct, statusText) {
    if (this.loadingBar) {
      this.loadingBar.style.width = `${pct}%`;
    }
    if (this.loadingStatus && statusText) {
      this.loadingStatus.textContent = statusText;
    }
  }

  hideLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        this.loadingScreen.style.display = 'none';
        if (this.hudContainer) {
          this.hudContainer.classList.remove('hidden');
        }
      }, 600);
    }
  }

  toggleModal() {
    if (this.modal) {
      this.modal.classList.toggle('hidden');
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  }

  showMessage(msg, duration = 3000) {
    if (this.messageToast) {
      this.messageToast.textContent = msg;
      this.messageToast.style.opacity = '1';
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.messageToast.style.opacity = '0.7';
      }, duration);
    }
  }

  update(player, vehicles = [], pedestrians = [], input) {
    const playerPos = player.getPosition();
    const playerRotY = player.getRotation();

    // 1. Update District Indicator
    const district = this.world.getCurrentDistrict(playerPos.x, playerPos.z);
    if (this.districtBadge && this.districtBadge.textContent !== district) {
      this.districtBadge.textContent = district;
    }

    // 2. Update Minimap
    this.minimap.update(playerPos, playerRotY, vehicles, pedestrians);

    // 3. Update Vehicle Driving / Speedometer
    if (player.state === 'DRIVING' && player.currentVehicle) {
      const isHonking = input ? input.isHonking() : false;
      this.speedometer.update(player.currentVehicle, isHonking);
    } else {
      this.speedometer.update(null, false);
    }

    // 4. Update Interaction Prompt (When near a car on foot)
    if (player.state === 'ON_FOOT' && player.nearbyVehicle) {
      if (this.promptEl) this.promptEl.classList.remove('hidden');
      if (this.promptActionText) {
        const carType = player.nearbyVehicle.type.toUpperCase();
        this.promptActionText.textContent = `Drive ${carType} Car`;
      }
    } else if (player.state === 'DRIVING') {
      if (this.promptEl) this.promptEl.classList.remove('hidden');
      if (this.promptActionText) {
        this.promptActionText.textContent = 'Exit Vehicle';
      }
    } else {
      if (this.promptEl) this.promptEl.classList.add('hidden');
    }
  }
}
