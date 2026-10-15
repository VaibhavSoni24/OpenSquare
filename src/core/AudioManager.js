export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Engine synth nodes
    this.engineGain = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineFilter = null;
    this.isEngineRunning = false;

    // Radio
    this.radioStations = [
      { name: 'Lo-Fi Chill Cafe', bpm: 84, scale: [261.63, 293.66, 329.63, 392.00, 440.00] }, // C Major Pentatonic
      { name: 'Shibuya Citypop Synth', bpm: 110, scale: [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00] }, // A Minor
      { name: 'Sakura Breeze Beats', bpm: 92, scale: [293.66, 329.63, 369.99, 440.00, 493.88] }, // D Major Pentatonic
      { name: 'Radio Off', bpm: 0, scale: [] }
    ];
    this.currentStationIdx = 0;
    this.radioGain = null;
    this.radioTimer = null;
    this.radioStep = 0;

    // Ambient
    this.ambientGain = null;

    // Footstep throttling
    this.lastStepTime = 0;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initEngineSynth();
      this.initRadio();
      this.initAmbient();
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initEngineSynth() {
    if (!this.ctx) return;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(350, this.ctx.currentTime);

    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(22.5, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  setEngineRPM(normalizedSpeed, isDriving) {
    if (!this.isInitialized || !this.engineGain) return;
    const now = this.ctx.currentTime;

    if (!isDriving) {
      this.engineGain.gain.setTargetAtTime(0.0001, now, 0.2);
      return;
    }

    const targetGain = 0.18 + normalizedSpeed * 0.12;
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.1);

    const baseFreq = 42 + normalizedSpeed * 95;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08);

    const filterCutoff = 350 + normalizedSpeed * 1200;
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.1);
  }

  playHorn() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const hornGain = this.ctx.createGain();
    hornGain.gain.setValueAtTime(0.25, now);
    hornGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(440, now); // A4
    osc2.frequency.setValueAtTime(554.37, now); // C#5 (bright upbeat chord)

    osc1.connect(hornGain);
    osc2.connect(hornGain);
    hornGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  playFootstep(isSprinting) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = performance.now();
    const interval = isSprinting ? 280 : 420;
    if (now - this.lastStepTime < interval) return;
    this.lastStepTime = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const pitch = isSprinting ? 120 : 90;
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  playDoor() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  initAmbient() {
    if (!this.ctx) return;
    // Soft pink-noise wind/ocean coastal breeze generator
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.11;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(480, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    whiteNoise.start();
  }

  initRadio() {
    if (!this.ctx) return;
    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.radioGain.connect(this.masterGain);

    this.startRadioScheduler();
  }

  cycleRadio() {
    this.ensureContext();
    this.currentStationIdx = (this.currentStationIdx + 1) % this.radioStations.length;
    const station = this.radioStations[this.currentStationIdx];
    if (station.name === 'Radio Off') {
      if (this.radioGain) this.radioGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.1);
    } else {
      if (this.radioGain) this.radioGain.gain.setTargetAtTime(0.12, this.ctx.currentTime, 0.1);
    }
    return station.name;
  }

  startRadioScheduler() {
    const playNote = () => {
      if (!this.ctx || this.currentStationIdx >= this.radioStations.length - 1) {
        setTimeout(playNote, 400);
        return;
      }
      const station = this.radioStations[this.currentStationIdx];
      const intervalMs = (60 / station.bpm) * 500; // 8th note

      if (station.scale.length > 0) {
        const noteFreq = station.scale[Math.floor(Math.random() * station.scale.length)];
        const oct = Math.random() > 0.6 ? 2 : 1;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        // Warm electric piano tone
        osc.type = this.currentStationIdx === 1 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(noteFreq * oct, now);

        noteGain.gain.setValueAtTime(0.08, now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + (intervalMs / 1000) * 1.5);

        osc.connect(noteGain);
        noteGain.connect(this.radioGain);

        osc.start(now);
        osc.stop(now + (intervalMs / 1000) * 1.5);
      }

      setTimeout(playNote, intervalMs);
    };

    playNote();
  }
}
