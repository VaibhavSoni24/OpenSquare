export class InputManager {
  constructor(domElement) {
    this.domElement = domElement || document.body;
    
    // Key states
    this.keys = {};
    this.justPressed = {};

    // Mouse states
    this.mouse = {
      isDown: false,
      button: 0,
      deltaX: 0,
      deltaY: 0,
      prevX: 0,
      prevY: 0,
      scrollDelta: 0
    };

    // Pointer lock option
    this.isPointerLocked = false;

    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (!this.keys[code]) {
        this.justPressed[code] = true;
      }
      this.keys[code] = true;

      // Prevent scrolling on Space or Arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse Listeners
    this.domElement.addEventListener('mousedown', (e) => {
      this.mouse.isDown = true;
      this.mouse.button = e.button;
      this.mouse.prevX = e.clientX;
      this.mouse.prevY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.domElement) {
        this.mouse.deltaX = e.movementX || 0;
        this.mouse.deltaY = e.movementY || 0;
      } else if (this.mouse.isDown) {
        this.mouse.deltaX = e.clientX - this.mouse.prevX;
        this.mouse.deltaY = e.clientY - this.mouse.prevY;
        this.mouse.prevX = e.clientX;
        this.mouse.prevY = e.clientY;
      }
    });

    window.addEventListener('wheel', (e) => {
      this.mouse.scrollDelta += Math.sign(e.deltaY);
    }, { passive: true });

    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });
  }

  requestPointerLock() {
    if (this.domElement && this.domElement.requestPointerLock) {
      this.domElement.requestPointerLock();
    }
  }

  exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  isKeyDown(code) {
    return !!this.keys[code];
  }

  wasJustPressed(code) {
    return !!this.justPressed[code];
  }

  // Get directional input vector (-1 to +1)
  getMovementAxes() {
    let forward = 0;
    let turn = 0;

    if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) forward += 1;
    if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) forward -= 1;
    if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) turn += 1;
    if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) turn -= 1;

    return { forward, turn };
  }

  isSprinting() {
    return this.isKeyDown('ShiftLeft') || this.isKeyDown('ShiftRight');
  }

  isJumping() {
    return this.isKeyDown('Space');
  }

  isHandbrake() {
    return this.isKeyDown('Space');
  }

  isHonking() {
    return this.isKeyDown('KeyH') || this.isKeyDown('ControlLeft') || this.isKeyDown('ControlRight');
  }

  // Clear single-frame flags at the end of each tick
  endFrame() {
    this.justPressed = {};
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    this.mouse.scrollDelta = 0;
  }
}
