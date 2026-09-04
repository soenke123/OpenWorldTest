export class TouchControls {
  constructor(gameInput, onButtonPress = null) {
    this.input = gameInput;
    this.onButtonPress = onButtonPress;

    // Ensure input state objects exist
    if (!this.input.joystick) {
      this.input.joystick = { x: 0, y: 0, active: false };
    }
    if (!this.input.buttons) {
      this.input.buttons = { A: false, B: false, X: false, Y: false };
    }

    if (typeof document !== 'undefined') {
      this.container = document.getElementById('touch-controls');
      this.joystickZone = document.getElementById('touch-joystick-zone');
      this.joystickBase = document.getElementById('touch-joystick-base');
      this.joystickKnob = document.getElementById('touch-joystick-knob');
      this.buttonsZone = document.getElementById('touch-buttons-zone');
      this.rotateOverlay = document.getElementById('rotate-device-overlay');
    } else {
      this.container = null;
      this.joystickZone = null;
      this.joystickBase = null;
      this.joystickKnob = null;
      this.buttonsZone = null;
      this.rotateOverlay = null;
    }

    this.joystickTouchId = null;
    this.baseRect = null;
    this.maxRadius = 45; // Max pixel deflection from center
    this.deadZone = 0.12; // Ignore minor thumb trembling

    this.isTouchDevice = false;

    this.initDetection();
    this.initJoystick();
    this.initButtons();
    this.initOrientationCheck();
  }

  initDetection() {
    if (typeof window === 'undefined') return;

    // Detect touch capability
    this.isTouchDevice = Boolean(
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches)
    );

    if (this.isTouchDevice && this.container) {
      this.container.classList.remove('hidden');
      if (typeof document !== 'undefined') {
        const hint = document.getElementById('controls-hint');
        if (hint) hint.style.display = 'none';
      }
    }

    // Dynamic reveal on first touch anywhere
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('touchstart', () => {
        if (!this.isTouchDevice) {
          this.isTouchDevice = true;
          if (this.container) this.container.classList.remove('hidden');
          if (typeof document !== 'undefined') {
            const hint = document.getElementById('controls-hint');
            if (hint) hint.style.display = 'none';
          }
        }
      }, { once: true, passive: true });
    }
  }

  initJoystick() {
    if (!this.joystickZone || !this.joystickBase || !this.joystickKnob) return;
    if (typeof this.joystickZone.addEventListener !== 'function') return;
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

    const updateBaseRect = () => {
      this.baseRect = this.joystickBase.getBoundingClientRect();
    };

    // Touch Start
    this.joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.joystickTouchId !== null) return; // Already tracking a finger

      updateBaseRect();
      const touch = e.changedTouches[0];
      this.joystickTouchId = touch.identifier;

      this.processJoystickMove(touch.clientX, touch.clientY);
    }, { passive: false });

    // Touch Move
    window.addEventListener('touchmove', (e) => {
      if (this.joystickTouchId === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          e.preventDefault();
          this.processJoystickMove(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    // Touch End / Cancel
    const endJoystick = (e) => {
      if (this.joystickTouchId === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          this.resetJoystick();
          break;
        }
      }
    };

    window.addEventListener('touchend', endJoystick, { passive: true });
    window.addEventListener('touchcancel', endJoystick, { passive: true });

    // Desktop mouse fallback for testing
    let isMouseDown = false;
    this.joystickZone.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      updateBaseRect();
      this.processJoystickMove(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      this.processJoystickMove(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        this.resetJoystick();
      }
    });
  }

  processJoystickMove(clientX, clientY) {
    if (!this.baseRect) {
      this.baseRect = this.joystickBase.getBoundingClientRect();
    }

    const centerX = this.baseRect.left + this.baseRect.width / 2;
    const centerY = this.baseRect.top + this.baseRect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;

    const distance = Math.hypot(deltaX, deltaY);

    if (distance > this.maxRadius) {
      deltaX = (deltaX / distance) * this.maxRadius;
      deltaY = (deltaY / distance) * this.maxRadius;
    }

    // Visuellen Joystick-Knauf versetzen
    this.joystickKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    // Normalisierter Richtungsvektor (-1 bis 1)
    const normDist = Math.min(1.0, distance / this.maxRadius);
    if (normDist < this.deadZone) {
      this.input.joystick.x = 0;
      this.input.joystick.y = 0;
      this.input.joystick.active = false;
    } else {
      this.input.joystick.x = deltaX / this.maxRadius;
      this.input.joystick.y = deltaY / this.maxRadius;
      this.input.joystick.active = true;
    }
  }

  resetJoystick() {
    this.joystickTouchId = null;
    this.joystickKnob.style.transform = 'translate(0px, 0px)';
    this.input.joystick.x = 0;
    this.input.joystick.y = 0;
    this.input.joystick.active = false;
  }

  initButtons() {
    if (!this.buttonsZone || typeof this.buttonsZone.querySelectorAll !== 'function') return;

    const buttons = this.buttonsZone.querySelectorAll('.touch-btn');
    if (!buttons || !buttons.forEach) return;

    buttons.forEach((btn) => {
      const action = btn.getAttribute('data-action');
      if (!btn.addEventListener) return;

      const press = (e) => {
        if (e) e.preventDefault();
        if (btn.classList && btn.classList.add) btn.classList.add('active');
        this.input.buttons[action] = true;
        if (this.onButtonPress) {
          this.onButtonPress(action, true);
        }
      };

      const release = (e) => {
        if (e) e.preventDefault();
        if (btn.classList && btn.classList.remove) btn.classList.remove('active');
        this.input.buttons[action] = false;
        if (this.onButtonPress) {
          this.onButtonPress(action, false);
        }
      };

      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('touchcancel', release, { passive: false });

      // Mouse support for testing
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);
    });
  }

  initOrientationCheck() {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      if (this.rotateOverlay && this.rotateOverlay.classList) {
        if (isPortrait && this.isTouchDevice) {
          this.rotateOverlay.classList.remove('hidden');
        } else {
          this.rotateOverlay.classList.add('hidden');
        }
      }
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation();
  }
}
