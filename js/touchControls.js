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

    const activeTouches = new Map(); // touchId -> state
    let mouseState = null;

    const startButtonInteraction = (action, btn, clientX, clientY) => {
      const rect = btn.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;

      btn.classList.add('active');
      this.input.buttons[action] = true;

      const state = {
        btn,
        action,
        originX,
        originY,
        startTime: performance.now(),
        circleStartTime: performance.now(),
        isDragging: false,
        dragDistance: 0,
        dragAngle: 0,
        prevAngle: null,
        cumulativeAngle: 0,
        spinFired: false,
        isAimed: false,
        isCancelled: false
      };

      if (this.onButtonPress) {
        this.onButtonPress(action, true, { initial: true });
      }

      return state;
    };

    const processButtonMove = (state, clientX, clientY) => {
      if (!state) return;
      const dx = clientX - state.originX;
      const dy = clientY - state.originY;
      const dist = Math.hypot(dx, dy);

      // Schild (Y) braucht kein Drag-to-Aim
      if (state.action === 'Y') return;

      if (dist >= 14) {
        state.isDragging = true;
        state.dragDistance = dist;
        state.dragAngle = Math.atan2(dy, dx);
        state.isCancelled = false;

        state.btn.classList.remove('cancel-zone');
        state.btn.classList.add('aiming-active');

        // Visuelle Auslenkung des Buttons (virtueller Analog-Stick-Effekt)
        const clampDist = Math.min(28, dist);
        const vx = (dx / dist) * clampDist;
        const vy = (dy / dist) * clampDist;
        state.btn.style.transform = `translate(${vx}px, ${vy}px)`;

        // Range (Button X): Zone 1 (< 54px) = normal fire | Zone 2 (>= 54px) = Aimed Shot (+20% weiter)
        if (state.action === 'X') {
          // Hysterese: Lädt ab 54px auf, bleibt aufgeladen bis der Finger fast ganz im Zentrum (< 22px) ist
          if (dist >= 54) {
            state.isAimed = true;
          } else if (dist < 22) {
            state.isAimed = false;
          }

          if (state.isAimed) {
            state.btn.classList.add('btn-aim-charged');
          } else {
            state.btn.classList.remove('btn-aim-charged');
          }
          if (this.onButtonPress) {
            this.onButtonPress('X', true, {
              drag: true,
              angle: state.dragAngle,
              dist,
              isAimed: Boolean(state.isAimed),
              isCancelled: false
            });
          }
          return;
        }

        // Kreis-Geste für Schwert (Button B: Wirbelattacke)
        // Rolling time window: kann jederzeit auch mitten im Schlagen ausgelöst werden!
        if (state.action === 'B') {
          const now = performance.now();
          if (!state.circleStartTime) state.circleStartTime = now;

          if (state.prevAngle !== null) {
            let delta = state.dragAngle - state.prevAngle;
            while (delta > Math.PI) delta -= Math.PI * 2;
            while (delta < -Math.PI) delta += Math.PI * 2;

            // Rolling window von 850ms
            if (now - state.circleStartTime > 850) {
              state.cumulativeAngle = 0;
              state.circleStartTime = now;
            }

            state.cumulativeAngle += delta;

            // Schnelle Kreisbewegung (~270° bis 360°)
            if (Math.abs(state.cumulativeAngle) >= Math.PI * 1.5) {
              state.cumulativeAngle = 0;
              state.circleStartTime = now;
              state.spinFired = true;
              state.btn.classList.add('anim-pop-glow');
              setTimeout(() => state.btn.classList.remove('anim-pop-glow'), 400);
              if (this.onButtonPress) {
                this.onButtonPress('B', true, { spin: true });
              }
            }
          }
          state.prevAngle = state.dragAngle;
        }

        if (this.onButtonPress) {
          this.onButtonPress(state.action, true, {
            drag: true,
            angle: state.dragAngle,
            dist,
            isCancelled: false
          });
        }
      } else {
        // Finger nahe Button-Zentrum: Button visuell zentrieren, KEIN versehentlicher Abbruch!
        state.btn.style.transform = 'translate(0px, 0px)';
      }
    };

    const finishButtonInteraction = (state) => {
      if (!state) return;
      state.btn.classList.remove('active', 'aiming-active', 'cancel-zone', 'btn-aim-charged');
      state.btn.style.transform = 'translate(0px, 0px)';
      this.input.buttons[state.action] = false;

      const wasDrag = state.isDragging && typeof state.dragAngle === 'number';
      const finalAngle = wasDrag ? state.dragAngle : null;

      if (this.onButtonPress) {
        this.onButtonPress(state.action, false, {
          isDrag: wasDrag,
          angle: finalAngle,
          dist: state.dragDistance,
          isAimed: Boolean(state.isAimed),
          isCancelled: false,
          spinTriggered: state.spinFired
        });
      }
    };

    buttons.forEach((btn) => {
      const action = btn.getAttribute('data-action');
      if (!btn.addEventListener) return;

      // Touch Events
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const state = startButtonInteraction(action, btn, touch.clientX, touch.clientY);
          activeTouches.set(touch.identifier, state);
        }
      }, { passive: false });

      // Mouse Events (Desktop-Testing)
      btn.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        mouseState = startButtonInteraction(action, btn, e.clientX, e.clientY);
      });
    });

    // Window-level move and release listeners so dragging outside the button works smoothly
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('touchmove', (e) => {
        if (activeTouches.size === 0) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const state = activeTouches.get(touch.identifier);
          if (state) {
            e.preventDefault();
            processButtonMove(state, touch.clientX, touch.clientY);
          }
        }
      }, { passive: false });

      const handleTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const state = activeTouches.get(touch.identifier);
          if (state) {
            finishButtonInteraction(state);
            activeTouches.delete(touch.identifier);
          }
        }
      };

      window.addEventListener('touchend', handleTouchEnd, { passive: true });
      window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

      // Desktop Mouse Fallback
      window.addEventListener('mousemove', (e) => {
        if (!mouseState) return;
        processButtonMove(mouseState, e.clientX, e.clientY);
      });

      window.addEventListener('mouseup', () => {
        if (!mouseState) return;
        finishButtonInteraction(mouseState);
        mouseState = null;
      });
    }
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
