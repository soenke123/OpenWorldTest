import { TILE_SIZE, PLAYER_CONFIG, TILES, OBJECTS, CANOPY, TREES, TILE_LAYER_ORDER, ELEVATION, RAMPS, ELEVATION_PIXEL_OFFSET, DIMENSIONS } from './constants.js';
import { SpriteManager } from './sprites.js';
import { WorldMap } from './map.js';
import { CaveMap } from './caveMap.js';
import { CloudMap } from './cloudMap.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { Minimap } from './minimap.js';
import { TouchControls } from './touchControls.js';
import { CombatManager } from './combat.js';
import { EnemyManager } from './enemies.js';
import { MagicManager } from './magic.js';
import { CHARACTERS_DATA, CHARACTERS_MAP, getSelectedSkin, setSelectedSkin, getSelectedPlayerName, setSelectedPlayerName, getRandomHeroName } from './characters.js';
import { getWorldPreset, getAllWorldPresets, getSelectedWorldId, setSelectedWorldId } from './worldPresets.js';
import { NetworkManager } from './network.js';
import { RemotePlayer } from './remotePlayer.js';
import { SpectatorManager } from './spectator.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.minimapCanvas = document.getElementById('minimapCanvas');

    // Multiplayer State
    this.remotePlayers = new Map();
    this.isHost = false;
    this.network = new NetworkManager(this);
    this.spectator = new SpectatorManager(this);

    this.input = {
      keys: {},
      joystick: { x: 0, y: 0, active: false },
      buttons: { A: false, B: false, X: false, Y: false },
      mouseLeft: false,
      mouseRight: false
    };

    this.touchControls = new TouchControls(this.input, (action, isDown, meta) => this.handleTouchButton(action, isDown, meta));
    this.combat = new CombatManager(this);

    // Multi-Dimension Maps & Core Systems
    this.overworldMap = new WorldMap();
    this.cloudMap = new CloudMap(this.overworldMap);
    const caveL1 = new CaveMap('caves_l1', this.overworldMap);
    const caveL2 = new CaveMap('caves_l2', this.overworldMap);
    this.caves = {
      caves_l1: caveL1,
      caves_l2: caveL2,
      main_complex: caveL1,
      sub_crystal: caveL2,
      forest_grotto: caveL1,
      snow_grotto: caveL1,
      void_grotto: caveL1
    };

    this.map = this.overworldMap;
    this.currentDimension = DIMENSIONS.OVERWORLD;
    this.activeSubCave = null;

    this.enemyManager = new EnemyManager(this);

    this.spriteManager = new SpriteManager();
    this.player = new Player(this.map.spawnPoint.x, this.map.spawnPoint.y, this.map, this);
    this.camera = new Camera(window.innerWidth, window.innerHeight);
    this.minimap = new Minimap(this.minimapCanvas, this.map);
    this.minimap.registerMaps({
      clouds: this.cloudMap,
      overworld: this.overworldMap,
      caves_l1: caveL1,
      caves_l2: caveL2
    });

    // Magic & Artifact System (Phoenix Spells, Shrines & Monster Drops)
    this.magicManager = new MagicManager(this);
    this.magicManager.initShrineArtifacts(this.caves, this.cloudMap, this.overworldMap);

    // Day-Night Cycle System (Start at 18:30 = Golden Twilight & Lantern Awakening)
    this.gameTime = 18.5; // Hours: 0.0 - 24.0
    this.timeSpeed = 0.04; // Smooth progression (~10 mins per full 24h cycle)

    // Ambient Environmental Particles (Day Clouds & Night Spirits/Embers)
    this.ambientParticles = [];
    this.initAmbientParticles();

    // HUD Elements
    this.hpStatEl = document.getElementById('hp-stat');
    this.compactHpFillEl = document.getElementById('compact-hp-fill');
    this.compactHpTextEl = document.getElementById('compact-hp-text');
    this.compactLevelBadgeEl = document.getElementById('compact-level-badge');
    this.compactXpFillEl = document.getElementById('compact-xp-fill');
    this.compactXpTextEl = document.getElementById('compact-xp-text');

    this.biomeNameEl = document.getElementById('biome-name');
    this.speedStatEl = document.getElementById('speed-stat');
    this.deathStatEl = document.getElementById('death-stat');
    this.posStatEl = document.getElementById('pos-stat');
    this.deathOverlay = document.getElementById('death-overlay');

    // Day/Night HUD Elements
    this.timeDisplayEl = document.getElementById('time-display');
    this.timeBarFillEl = document.getElementById('time-bar-fill');
    this.lanternStatusEl = document.getElementById('lantern-status-hint');
    this.timePanelEl = document.getElementById('time-panel');

    // Character & Name Selection Wizard State
    this.compactPlayerNameEl = document.getElementById('compact-player-name');
    this.charSelectModal = document.getElementById('character-select-modal');
    this.heroNameInput = document.getElementById('hero-name-input');
    this.btnRandomName = document.getElementById('btn-random-hero-name');
    this.btnStartGame = document.getElementById('btn-start-game');
    this.charSelectGrid = document.getElementById('char-select-grid');
    this.btnOpenCharSelect = document.getElementById('btn-open-char-select');

    this.btnStep1Next = document.getElementById('btn-step1-next');
    this.btnStep2Back = document.getElementById('btn-step2-back');
    this.btnStep2Next = document.getElementById('btn-step2-next');
    this.btnStep3Back = document.getElementById('btn-step3-back');
    this.confirmHeroNameEl = document.getElementById('confirm-hero-name');
    this.confirmHeroSubEl = document.getElementById('char-confirm-sub');
    this.confirmCanvas = document.getElementById('char-confirm-canvas');
    this.confirmCtx = this.confirmCanvas ? this.confirmCanvas.getContext('2d') : null;

    this.charWizardStep = 1;
    this.isCharacterSelectOpen = Boolean(this.charSelectModal && !this.charSelectModal.classList.contains('hidden'));
    this.selectedHeroSkin = (this.player && this.player.skinId) || getSelectedSkin();
    this.charPreviewCanvases = {};

    this.lastTime = 0;
    this.animTime = 0;

    this.initEvents();
    this.initCharacterSelectModal();
    this.initWorldSelectUI();
    this.updatePlayerNameUI();
    this.initNetworkEvents();
    this.initMultiplayerUI();
    this.openCharacterSelectModal();
    this.resize();
    this.start();
  }

  initAmbientParticles() {
    this.ambientParticles = [];
    const worldW = this.map.width * TILE_SIZE;
    const worldH = this.map.height * TILE_SIZE;

    // 1. Daytime / Twilight Sakura & Leaf Petals
    for (let i = 0; i < 45; i++) {
      this.ambientParticles.push({
        type: 'petal',
        x: Math.random() * worldW,
        y: Math.random() * worldH,
        vx: (Math.random() - 0.2) * 20,
        vy: Math.random() * 14 + 10,
        swaySpeed: Math.random() * 2 + 1,
        swayOffset: Math.random() * Math.PI * 2,
        size: Math.random() * 2 + 2,
        color: Math.random() > 0.4 ? 'rgba(244, 114, 182, 0.7)' : 'rgba(110, 231, 183, 0.65)'
      });
    }

    // 2. Nighttime Floating Ofuda (Paper Talismans with Red Seals)
    for (let i = 0; i < 20; i++) {
      this.ambientParticles.push({
        type: 'ofuda',
        x: Math.random() * worldW,
        y: Math.random() * worldH,
        vx: (Math.random() - 0.3) * 16,
        vy: Math.random() * 10 + 6,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 2,
        swaySpeed: Math.random() * 1.5 + 0.8,
        swayOffset: Math.random() * Math.PI * 2
      });
    }

    // 3. Nighttime Golden Firefly Embers
    for (let i = 0; i < 35; i++) {
      this.ambientParticles.push({
        type: 'firefly',
        x: Math.random() * worldW,
        y: Math.random() * worldH,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 15 - 5, // Rising upwards
        swaySpeed: Math.random() * 3 + 2,
        swayOffset: Math.random() * Math.PI * 2,
        size: Math.random() * 1.5 + 1.2
      });
    }
  }

  updateAmbientParticles(dt) {
    const t = this.animTime;
    const worldW = this.map.width * TILE_SIZE;
    const worldH = this.map.height * TILE_SIZE;

    for (const p of this.ambientParticles) {
      p.y += p.vy * dt;
      p.x += (p.vx + Math.sin(t * p.swaySpeed + p.swayOffset) * 12) * dt;

      if (p.type === 'ofuda') {
        p.rot += p.rotSpeed * dt;
      }

      if (p.y > worldH) {
        p.y = 0;
        p.x = Math.random() * worldW;
      } else if (p.y < 0) {
        p.y = worldH;
        p.x = Math.random() * worldW;
      }
      if (p.x < 0) p.x = worldW;
      if (p.x > worldW) p.x = 0;
    }
  }

  cycleTime() {
    // Immediate toggle between Day (12:00), Sunset (18:30), and Spirit Night (22:00)
    if (this.gameTime >= 6.5 && this.gameTime < 16.0) {
      this.gameTime = 18.5; // Jump to Sunset
    } else if (this.gameTime >= 16.0 && this.gameTime < 20.5) {
      this.gameTime = 22.0; // Jump to Night
    } else {
      this.gameTime = 11.5; // Jump to Day
    }
    this.updateHUD();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        if (e.code === 'Enter' && e.target === this.heroNameInput) {
          this.goToCharWizardStep(2);
        } else if (e.code === 'Escape' && this.isCharacterSelectOpen) {
          if (typeof e.target.blur === 'function') e.target.blur();
          this.startGameWithSelectedHero();
        }
        return;
      }
      if (this.isCharacterSelectOpen) {
        if (!this.charSelectModal || this.charSelectModal.classList.contains('hidden')) {
          this.isCharacterSelectOpen = false;
        } else {
          if (e.code === 'Enter') {
            if (this.charWizardStep === 1) this.goToCharWizardStep(2);
            else if (this.charWizardStep === 2) this.goToCharWizardStep(3);
            else if (this.charWizardStep === 3) this.startGameWithSelectedHero();
          } else if (e.code === 'Escape') {
            this.startGameWithSelectedHero();
          }
          return;
        }
      }

      if (this.magicManager && this.magicManager.isSwapModalOpen) {
        if (e.code === 'Escape') {
          this.magicManager.closeSwapModal();
        }
        return;
      }

      if (e.code === 'KeyM') {
        if (!e.repeat) {
          this.openLargeMap();
        }
        return;
      }

      if (e.code === 'Escape') {
        const mc = document.getElementById('minimap-container');
        if (mc && mc.classList.contains('expanded')) {
          this.closeLargeMap();
          return;
        }
      }

      this.input.keys[e.code] = true;
      if (e.repeat) return; // Prevent OS keyboard auto-repeat from resetting charge timers!

      if (e.code === 'KeyT') {
        this.cycleTime();
      }
      if (e.code === 'KeyR') {
        this.player.respawn();
      }
      if (e.code === 'Space') {
        e.preventDefault();
        const targetAngle = e.shiftKey ? this.player.getFacingAngle() : null;
        this.player.triggerDash(targetAngle);
      }
      if (e.code === 'KeyJ') {
        this.player.startMelee();
      }
      if (e.code === 'KeyK') {
        this.player.setShield(true);
      }
      if (e.code === 'KeyL' || e.code === 'KeyF') {
        this.player.startRanged();
      }
      if (e.code === 'KeyE') {
        if (!e.repeat && this.magicManager) {
          this.magicManager.startAiming(this.player);
        }
      }
      if (e.code === 'KeyC') {
        this.toggleSkillModal();
      }
      if (e.code === 'Escape') {
        const modal = document.getElementById('skill-modal');
        if (modal && !modal.classList.contains('hidden')) {
          this.toggleSkillModal(false);
        }
        if (this.magicManager) {
          this.magicManager.cancelAiming();
          this.magicManager.toggleInfoModal(false);
          this.magicManager.closeSwapModal();
          this.magicManager.closeTeleportModal();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        return;
      }
      if (this.isCharacterSelectOpen) {
        if (!this.charSelectModal || this.charSelectModal.classList.contains('hidden')) {
          this.isCharacterSelectOpen = false;
        } else {
          return;
        }
      }

      this.input.keys[e.code] = false;
      if (e.code === 'KeyJ') {
        this.player.releaseMelee();
      }
      if (e.code === 'KeyK') {
        this.player.setShield(false);
      }
      if (e.code === 'KeyL' || e.code === 'KeyF') {
        this.player.releaseRanged();
      }
      if (e.code === 'KeyE') {
        if (this.magicManager) {
          this.magicManager.releaseAiming(this.player, this.map, this.combat);
        }
      }
      if (e.code === 'KeyM') {
        this.closeLargeMap();
      }
    });

    if (this.canvas) {
      this.canvas.addEventListener('mousedown', (e) => {
        if (this.isCharacterSelectOpen) {
          if (!this.charSelectModal || this.charSelectModal.classList.contains('hidden')) {
            this.isCharacterSelectOpen = false;
          } else {
            return;
          }
        }
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const screenX = (e.clientX - rect.left) * scaleX;
        const screenY = (e.clientY - rect.top) * scaleY;
        const zoom = this.camera ? this.camera.zoom : 1;
        const camX = this.camera ? this.camera.x : 0;
        const camY = this.camera ? this.camera.y : 0;
        const mWorldX = screenX / zoom + camX;
        const mWorldY = screenY / zoom + camY;
        const mdx = mWorldX - this.player.x;
        const mdy = mWorldY - (this.player.y - 10);
        if (Math.hypot(mdx, mdy) > 12) {
          this.player.setDirectionFromVector(mdx, mdy);
        }

        if (e.button === 0) {
          this.input.mouseLeft = true;
          this.player.startMelee();
        }
        if (e.button === 2) {
          this.input.mouseRight = true;
          this.player.setShield(true);
        }
      });

      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
          this.input.mouseLeft = false;
          this.player.releaseMelee();
        }
        if (e.button === 2) {
          this.input.mouseRight = false;
          this.player.setShield(false);
        }
      });

      this.canvas.addEventListener('mousemove', (e) => {
        if (!this.player || this.player.isDead) return;
        if (this.isCharacterSelectOpen && this.charSelectModal && !this.charSelectModal.classList.contains('hidden')) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const screenX = (e.clientX - rect.left) * scaleX;
        const screenY = (e.clientY - rect.top) * scaleY;
        const zoom = this.camera ? this.camera.zoom : 1;
        const camX = this.camera ? this.camera.x : 0;
        const camY = this.camera ? this.camera.y : 0;
        const mWorldX = screenX / zoom + camX;
        const mWorldY = screenY / zoom + camY;
        const mdx = mWorldX - this.player.x;
        const mdy = mWorldY - (this.player.y - 10);
        if (Math.hypot(mdx, mdy) > 14) {
          const aimAngle = Math.atan2(mdy, mdx);
          this.player.setAimAngle(aimAngle);
        }
      });

      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    if (this.timePanelEl) {
      this.timePanelEl.addEventListener('click', () => this.cycleTime());
    }

    // 1. Dev Tools Visibility & Toggle
    // Automatische Erkennung: Auf Vercel (.vercel.app) oder bei ?dev=1 Entwicklertools aktivieren!
    // Auf dem lokalen LAN-Server / IP (z.B. 192.168.x.x:3000) standardmäßig reine User-Sicht.
    const isVercel = typeof window !== 'undefined' && window.location && (
      window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('vercel.dev')
    );
    const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
    const forceDev = Boolean(urlParams && (urlParams.get('dev') === '1' || urlParams.get('dev') === 'true' || urlParams.get('mode') === 'dev'));
    const forceUser = Boolean(urlParams && (urlParams.get('dev') === '0' || urlParams.get('dev') === 'false' || urlParams.get('mode') === 'user'));
    const isDevMode = !forceUser && (isVercel || forceDev);

    if (typeof document !== 'undefined') {
      if (isDevMode) {
        document.body.classList.add('dev-mode');
        console.log('[Mode] 🛠️ Entwickler-Modus aktiv (Vercel / ?dev=1: Dev Tools eingeblendet)');
      } else {
        document.body.classList.remove('dev-mode');
        console.log('[Mode] 🎮 Spieler-Modus / User-Sicht aktiv (LAN-Server / IP: Dev Tools ausgeblendet)');
      }
    }

    const devToolsToggleBtn = document.getElementById('dev-tools-toggle');
    const hudDropdown = document.getElementById('hud');
    const isMobile = (typeof window !== 'undefined' && (
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      Math.min(window.innerWidth, window.innerHeight) <= 600
    ));

    if (hudDropdown) {
      hudDropdown.classList.add('collapsed');
      if (devToolsToggleBtn) devToolsToggleBtn.classList.remove('active');
    }

    if (devToolsToggleBtn && hudDropdown) {
      devToolsToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = hudDropdown.classList.toggle('collapsed');
        devToolsToggleBtn.classList.toggle('active', !isCollapsed);
      });
    }

    // 2. Reset / Respawn Button in Dev Tools
    const btnReset = document.getElementById('btn-reset-player');
    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isCharacterSelectOpen) {
          this.startGameWithSelectedHero();
        }
        this.player.respawn();
        this.updateHUD();
        this.showToast('🔄 Spieler zurückgesetzt & respawnt!');
      });
    }

    // 2b. Monster AI Toggle Button
    const btnToggleAI = document.getElementById('btn-toggle-enemy-ai');
    if (btnToggleAI) {
      btnToggleAI.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.enemyManager) {
          this.enemyManager.aiActive = !this.enemyManager.aiActive;
          btnToggleAI.textContent = this.enemyManager.aiActive ? '👾 Monster-KI: Aktiv' : '💤 Monster-KI: Friedlich';
          btnToggleAI.style.color = this.enemyManager.aiActive ? '#4ade80' : '#94a3b8';
          this.showToast(this.enemyManager.aiActive ? '👾 Monster-KI aktiviert!' : '💤 Monster sind nun friedlich!');
        }
      });
    }

    // 2c. Respawn All Enemies Button
    const btnRespawnEnemies = document.getElementById('btn-respawn-enemies');
    if (btnRespawnEnemies) {
      btnRespawnEnemies.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.enemyManager) {
          this.enemyManager.initSpawns();
          this.showToast('✨ Alle 20 Monster-Gruppen neu gespawnt!');
        }
      });
    }

    // 2d. Biome / Monster Quick Teleport Dropdown
    const teleportSelect = document.getElementById('teleport-select');
    if (teleportSelect) {
      teleportSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (!val) return;
        const [tx, ty, dim] = val.split(',');
        const targetX = parseInt(tx, 10) * TILE_SIZE + 8;
        const targetY = parseInt(ty, 10) * TILE_SIZE + 8;
        if (dim !== this.currentDimension) {
          this.switchDimension(dim, targetX, targetY);
        } else {
          this.player.x = targetX;
          this.player.y = targetY;
          this.camera.follow(targetX, targetY);
        }
        this.showToast(`🚀 Schnellreise zu (${tx}, ${ty})!`);
        e.target.value = '';
      });
    }

    // 3. Zoom Controls (Herauszoomen / Heranzoomen)
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    this.updateZoomDisplay();

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', (e) => {
        e.stopPropagation();
        this.camera.adjustZoom(-0.25);
        this.updateZoomDisplay();
      });
    }
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.camera.adjustZoom(+0.25);
        this.updateZoomDisplay();
      });
    }

    if (this.canvas) {
      // Mouse wheel zoom
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        this.camera.adjustZoom(delta);
        this.updateZoomDisplay();
      }, { passive: false });
    }

    // 4. Minimalist Minimap (Gedrückt halten für große Karte, Multi-Touch Ebenen-Auswahl)
    const minimapContainer = document.getElementById('minimap-container');
    if (minimapContainer) {
      let isHoldingMap = false;
      let holdingPointerId = null;
      let holdingTouchId = null;

      const expandMap = (e) => {
        // Ignoriere, falls direkt ein Ebenen-Button angetippt wurde
        if (e.target && e.target.closest && e.target.closest('.layer-tab-btn')) {
          return;
        }
        if (e && e.cancelable) e.preventDefault();
        isHoldingMap = true;
        minimapContainer.classList.add('pressing');
        this.openLargeMap();

        if (e && e.pointerId !== undefined) {
          holdingPointerId = e.pointerId;
        }
      };

      const collapseMap = (e) => {
        if (!isHoldingMap) return;

        // Multi-touch Schutz: Nur schließen, wenn der HALTENDE Finger losgelassen wird!
        if (e && e.pointerId !== undefined && holdingPointerId !== null) {
          if (e.pointerId !== holdingPointerId) {
            // Ein anderer Finger (z.B. der die Ebene gewählt hat) wurde gehoben -> Karte BLEIBT OFFEN!
            return;
          }
        }

        isHoldingMap = false;
        holdingPointerId = null;
        holdingTouchId = null;
        minimapContainer.classList.remove('pressing');
        this.closeLargeMap();
      };

      // Pointer Events (Maus & Touch)
      minimapContainer.addEventListener('pointerdown', expandMap);
      window.addEventListener('pointerup', collapseMap);
      window.addEventListener('pointercancel', collapseMap);

      // Touch Events für native Multi-Touch Geräte
      minimapContainer.addEventListener('touchstart', (e) => {
        if (e.target && e.target.closest && e.target.closest('.layer-tab-btn')) {
          return;
        }
        if (e.cancelable) e.preventDefault();
        if (!isHoldingMap && e.changedTouches && e.changedTouches.length > 0) {
          isHoldingMap = true;
          holdingTouchId = e.changedTouches[0].identifier;
          minimapContainer.classList.add('pressing');
          this.openLargeMap();
        }
      }, { passive: false });

      window.addEventListener('touchend', (e) => {
        if (!isHoldingMap) return;
        if (holdingTouchId !== null && e.changedTouches) {
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === holdingTouchId) {
              isHoldingMap = false;
              holdingTouchId = null;
              holdingPointerId = null;
              minimapContainer.classList.remove('pressing');
              this.closeLargeMap();
              return;
            }
          }
        } else if (e.touches && e.touches.length === 0) {
          isHoldingMap = false;
          holdingTouchId = null;
          holdingPointerId = null;
          minimapContainer.classList.remove('pressing');
          this.closeLargeMap();
        }
      }, { passive: true });

      window.addEventListener('touchcancel', () => {
        if (isHoldingMap) {
          isHoldingMap = false;
          holdingTouchId = null;
          holdingPointerId = null;
          minimapContainer.classList.remove('pressing');
          this.closeLargeMap();
        }
      }, { passive: true });

      // Maus Events
      minimapContainer.addEventListener('mousedown', expandMap);
      window.addEventListener('mouseup', collapseMap);

      // Verhindere Kontextmenü bei langem Drücken
      minimapContainer.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Automatischer Vollbild-Wechsel bei der ersten Benutzer-Geste
    const triggerFsOnFirstGesture = () => {
      this.requestGameFullscreen();
      window.removeEventListener('pointerdown', triggerFsOnFirstGesture);
      window.removeEventListener('keydown', triggerFsOnFirstGesture);
    };
    window.addEventListener('pointerdown', triggerFsOnFirstGesture, { once: true });
    window.addEventListener('keydown', triggerFsOnFirstGesture, { once: true });

    // 5. Fullscreen Toggle (Vollbild)
    const fsBtn = document.getElementById('fullscreen-btn');
    const fsIcon = document.getElementById('fs-icon');
    const fsText = document.getElementById('fs-text');

    const updateFsUI = () => {
      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      if (fsIcon) fsIcon.textContent = isFs ? '🗗' : '⛶';
      if (fsText) fsText.textContent = isFs ? 'Beenden' : 'Vollbild';
    };

    const toggleFs = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {
            this.showToast('Vollbild vom Browser eingeschränkt');
          });
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          docEl.msRequestFullscreen();
        } else {
          this.showToast('Tipp: Auf iOS "Zum Home-Bildschirm" für Vollbild');
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    };

    if (fsBtn) {
      fsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFs();
      });
    }
    document.addEventListener('fullscreenchange', updateFsUI);
    document.addEventListener('webkitfullscreenchange', updateFsUI);

    // 7. Skill System UI & Modal Wiring
    const skillMenuBtn = document.getElementById('skill-menu-btn');
    if (skillMenuBtn) {
      skillMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSkillModal();
      });
    }

    const skillModalCloseBtn = document.getElementById('skill-modal-close');
    if (skillModalCloseBtn) {
      skillModalCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSkillModal(false);
      });
    }

    const skillModal = document.getElementById('skill-modal');
    if (skillModal) {
      skillModal.addEventListener('click', (e) => {
        if (e.target === skillModal) {
          this.toggleSkillModal(false);
        }
      });

      const upgradeBtns = skillModal.querySelectorAll('.skill-upgrade-btn');
      upgradeBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const skillType = btn.getAttribute('data-skill');
          if (skillType) {
            this.investSkillPoint(skillType);
          }
        });
      });
    }
  }

  updateZoomDisplay() {
    const zoomValEl = document.getElementById('zoom-val-text');
    if (zoomValEl && this.camera) {
      zoomValEl.textContent = this.camera.zoom.toFixed(2) + 'x';
    }
  }

  openLargeMap() {
    const el = document.getElementById('minimap-container');
    if (!el) return;
    el.classList.add('expanded');
    if (this.minimap) {
      this.minimap.viewingDimension = this.minimap.dimension;
      this.minimap.updateTabsUI();
    }
  }

  closeLargeMap() {
    const el = document.getElementById('minimap-container');
    if (!el) return;
    el.classList.remove('expanded');
    if (this.minimap) {
      this.minimap.viewingDimension = this.minimap.dimension;
      this.minimap.updateTabsUI();
    }
  }

  toggleLargeMap() {
    const el = document.getElementById('minimap-container');
    if (!el) return;
    if (el.classList.contains('expanded')) {
      this.closeLargeMap();
    } else {
      this.openLargeMap();
    }
  }

  showToast(msg, duration = 2200) {
    const toast = document.getElementById('game-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('toast-hidden');
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add('toast-hidden');
    }, duration);
  }

  handleTouchButton(action, isDown, meta = null) {
    if (this.isCharacterSelectOpen) {
      if (!this.charSelectModal || this.charSelectModal.classList.contains('hidden')) {
        this.isCharacterSelectOpen = false;
      } else {
        return;
      }
    }
    if (this.input.joystick && this.input.joystick.active) {
      this.player.setDirectionFromVector(this.input.joystick.x, this.input.joystick.y);
    }

    // A = Dash (Tippen: in Laufrichtung | Halten & Ziehen: 360° Richtungs-Dash | Zurück: Abbrechen)
    if (action === 'A') {
      if (isDown) {
        if (meta && meta.drag && typeof meta.angle === 'number') {
          this.player.setDashAim(true, meta.angle);
        } else if (meta && meta.cancel) {
          this.player.setDashAim(false);
        }
      } else {
        this.player.setDashAim(false);
        if (meta && meta.isCancelled) return;
        if (meta && meta.isDrag && typeof meta.angle === 'number') {
          this.player.triggerDash(meta.angle);
        } else {
          // Tap: In aktuelle Laufrichtung (oder Blickrichtung wenn stillstehend)
          this.player.triggerDash(null);
        }
      }
    }
    // B = Schwert (Gedrückt halten: 3er-Kombo durchballern | Kreis-Geste: 360° Wirbelattacke)
    else if (action === 'B') {
      if (isDown) {
        if (meta && meta.spin) {
          this.player.executeSpinAttack();
          if (this.combat) {
            this.combat.addFloatingText('🌀 WIRBELATTACKE!', this.player.x, this.player.y - 24, '#38bdf8', 0.9);
          }
        } else if (meta && meta.drag && typeof meta.angle === 'number') {
          this.player.setAimAngle(meta.angle);
        } else if (meta && meta.initial) {
          this.player.startMelee();
        }
      } else {
        this.player.releaseMelee();
      }
    }
    // X = Bogen (Gedrückt halten: ruhiges Tempo Schüsse in Zieh-Richtung | Weit ziehen >= 54px: Aimed Shot blau laden mit Flugbahn)
    else if (action === 'X') {
      if (isDown) {
        if (meta && meta.cancel) {
          this.player.cancelRanged();
        } else if (meta && meta.drag) {
          const aimAng = (typeof meta.angle === 'number') ? meta.angle : null;
          this.player.setRangedAimedShot(meta.isAimed, aimAng);
        } else if (meta && meta.initial) {
          this.player.startRanged();
        }
      } else {
        if (meta && meta.isCancelled) {
          this.player.cancelRanged();
        } else {
          const aimAng = (meta && typeof meta.angle === 'number') ? meta.angle : null;
          this.player.releaseRanged(aimAng, meta ? meta.isAimed : null);
        }
      }
    }
    // MAGIC = Zauber/Artefakt (Ziehen: 360° Schablone drehen | Loslassen: Wirken | Zurück: Abbrechen)
    else if (action === 'MAGIC') {
      if (!this.magicManager) return;
      if (isDown) {
        if (meta && meta.drag && typeof meta.angle === 'number') {
          this.player.setAimAngle(meta.angle);
        } else if (meta && meta.cancel) {
          this.magicManager.cancelAiming();
        } else if (meta && meta.initial) {
          this.magicManager.startAiming(this.player);
        }
      } else {
        if (meta && meta.isCancelled) {
          this.magicManager.cancelAiming();
        } else {
          if (meta && meta.isDrag && typeof meta.angle === 'number') {
            this.player.setAimAngle(meta.angle);
          }
          this.magicManager.releaseAiming(this.player, this.map, this.combat);
        }
      }
    }
    // Y = Schild (Einfaches Halten/Blocken)
    else if (action === 'Y') {
      this.player.setShield(isDown);
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;
    this.camera.resize(this.canvas.width, this.canvas.height);
    this.updateZoomDisplay();

    if (!this.canopyCanvas) {
      this.canopyCanvas = document.createElement('canvas');
      this.canopyCtx = this.canopyCanvas.getContext('2d');
    }
    this.canopyCanvas.width = this.canvas.width;
    this.canopyCanvas.height = this.canvas.height;
    this.canopyCtx.imageSmoothingEnabled = false;
  }

  switchDimension(targetDim, targetX, targetY) {
    if (targetDim === 'overworld') {
      this.map = this.overworldMap;
      this.currentDimension = DIMENSIONS.OVERWORLD;
      this.activeSubCave = null;
    } else if (targetDim === 'clouds') {
      this.map = this.cloudMap;
      this.currentDimension = DIMENSIONS.CLOUDS;
      this.activeSubCave = null;
    } else if (targetDim === 'caves_l2' || targetDim === 'sub_crystal' || targetDim === DIMENSIONS.CAVES_DEEP) {
      this.map = this.caves.caves_l2;
      this.currentDimension = DIMENSIONS.CAVES_DEEP;
      this.activeSubCave = 'caves_l2';
    } else if (this.caves[targetDim] || targetDim === 'caves_l1' || targetDim === 'caves' || targetDim === 'main_complex') {
      this.map = this.caves.caves_l1;
      this.currentDimension = DIMENSIONS.CAVES_L1;
      this.activeSubCave = 'caves_l1';
    }

    this.player.map = this.map;

    let finalX = targetX;
    let finalY = targetY;
    const curTx = Math.floor(targetX / TILE_SIZE);
    const curTy = Math.floor(targetY / TILE_SIZE);

    if (this.map.isSolid && this.map.isSolid(curTx, curTy)) {
      if (this.map.findSafeLandingFloor) {
        const safe = this.map.findSafeLandingFloor(curTx, curTy);
        finalX = safe.x * TILE_SIZE + 8;
        finalY = safe.y * TILE_SIZE + 8;
      } else if (this.player.findSafeLandingPosition) {
        const safe = this.player.findSafeLandingPosition(this.map, targetX, targetY);
        finalX = safe.x;
        finalY = safe.y;
      }
    }

    this.player.x = finalX;
    this.player.y = finalY;
    this.player.lastTransitionTile = {
      x: Math.floor(finalX / TILE_SIZE),
      y: Math.floor(finalY / TILE_SIZE)
    };
    this.camera.setWorldBounds(this.map.width, this.map.height);
    this.camera.follow(finalX, finalY);
    this.minimap.setMap(this.map, this.currentDimension);
    this.updateHUD();
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(currentTime) {
    const now = (typeof currentTime === 'number' && !isNaN(currentTime)) ? currentTime : performance.now();
    let dt = 0.016;
    if (this.lastTime && !isNaN(this.lastTime)) {
      const rawDt = (now - this.lastTime) / 1000;
      if (rawDt > 0 && rawDt < 1.0) {
        dt = Math.min(rawDt, 0.1);
      }
    }
    this.lastTime = now;
    this.animTime += dt;

    this.update(dt);
    this.render();

    requestAnimationFrame((time) => this.loop(time));
  }

  update(dt) {
    if (this.isCharacterSelectOpen) {
      if (!this.charSelectModal || this.charSelectModal.classList.contains('hidden')) {
        this.isCharacterSelectOpen = false;
      } else {
        this.updateCharacterSelectPreviews(dt);
        return;
      }
    }

    // 1. Advance Day-Night Clock
    this.gameTime = (this.gameTime + dt * this.timeSpeed) % 24;
    if (isNaN(this.gameTime) || this.gameTime < 0) {
      this.gameTime = 18.5;
    }

    this.spriteManager.update(dt);

    // Host / Spectator vs normaler Spieler
    if (this.isHost && this.spectator && this.spectator.active) {
      this.spectator.update(dt, this.input);
    } else {
      this.player.update(dt, this.input);
      this.camera.follow(this.player.x, this.player.y);
      this.camera.update(dt);
    }

    // Remote Players aktualisieren
    if (this.remotePlayers) {
      for (const rp of this.remotePlayers.values()) {
        rp.update(dt);
      }
    }

    if (this.enemyManager) this.enemyManager.update(dt, this.player, this.map, this.combat);
    if (this.combat) this.combat.update(dt);
    this.updateAmbientParticles(dt);

    if (this.magicManager) {
      this.magicManager.update(dt, this.player, this.map, this.combat, this.enemyManager);
    }

    if (!this.isHost) {
      this.updateHUD();
      this.updateCombatUI();
    }

    // Netzwerk-Synchronisation
    if (this.network) {
      this.network.update(dt, this.isHost ? null : this.player);

      // Im LAN-Modus: Wenn dieser Client der Master ist, Snapshot aller Monster an Mitspieler senden (~12.5 Hz)
      if (this.network.connected && this.enemyManager && this.enemyManager.isMasterClient) {
        this.enemySyncTimer = (this.enemySyncTimer || 0) + dt;
        if (this.enemySyncTimer >= 0.08) {
          this.enemySyncTimer = 0;
          this.network.sendEnemiesUpdate(this.enemyManager.serializeEnemiesState());
        }
      }
    }
  }

  getDayNightFactors() {
    const t = this.gameTime;

    // Sunlight: peak at 12h, zero between 20h and 05h
    let sunlight = 0;
    if (t >= 6.0 && t <= 18.0) {
      sunlight = Math.sin(((t - 6.0) / 12.0) * Math.PI);
    }

    // Sunset factor: peak around 18.0 - 19.5
    let sunset = 0;
    if (t >= 16.5 && t <= 20.0) {
      sunset = Math.sin(((t - 16.5) / 3.5) * Math.PI);
    }

    // Night factor: 0.0 - 1.0 (clamped strictly between 0 and 1)
    let night = 0;
    if (t >= 20.0 && t <= 21.5) {
      night = (t - 20.0) / 1.5; // Dämmerung -> Nacht Übergang
    } else if (t > 21.5 || t < 4.0) {
      night = 1.0; // Volle Nacht (Mitternacht bis 04:00)
    } else if (t >= 4.0 && t <= 5.5) {
      night = 1.0 - (t - 4.0) / 1.5; // Nacht -> Morgengrauen Übergang
    }
    night = Math.max(0, Math.min(1, night));

    return { sunlight, sunset, night };
  }

  updateHUD() {
    const tileX = Math.floor(this.player.x / TILE_SIZE);
    const tileY = Math.floor(this.player.y / TILE_SIZE);
    const currentBiome = this.map.getBiome(tileX, tileY);

    if (this.biomeNameEl) {
      let worldPrefix = '';
      if (this.currentDimension === DIMENSIONS.CLOUDS) {
        worldPrefix = '☁️ [Wolkenreich] ';
        this.biomeNameEl.style.color = '#f472b6';
        this.biomeNameEl.textContent = worldPrefix + (this.map.name || 'Rosa Wolkenmeer');
      } else if (this.currentDimension === DIMENSIONS.CAVES) {
        worldPrefix = '🪨 [Höhlenwelt] ';
        const cTheme = this.map.getTheme ? this.map.getTheme(tileX, tileY) : 'main';
        if (cTheme === 'snow') this.biomeNameEl.style.color = '#38bdf8';
        else if (cTheme === 'void') this.biomeNameEl.style.color = '#c084fc';
        else if (cTheme === 'forest') this.biomeNameEl.style.color = '#4ade80';
        else if (cTheme === 'desert') this.biomeNameEl.style.color = '#fbbf24';
        else if (cTheme === 'swamp') this.biomeNameEl.style.color = '#a3e635';
        else if (cTheme === 'crystal') this.biomeNameEl.style.color = '#818cf8';
        else this.biomeNameEl.style.color = '#cbd5e1';

        this.biomeNameEl.textContent = worldPrefix + (this.map.name || currentBiome);
      } else {
        if (currentBiome.includes('Leere')) {
          this.biomeNameEl.style.color = '#e066ff';
        } else if (currentBiome.includes('Wüste')) {
          this.biomeNameEl.style.color = '#ffda73';
        } else if (currentBiome.includes('Schnee')) {
          this.biomeNameEl.style.color = '#aee1f7';
        } else if (currentBiome.includes('Sumpf')) {
          this.biomeNameEl.style.color = '#8bc34a';
        } else {
          this.biomeNameEl.style.color = '#55e6a5';
        }
        this.biomeNameEl.textContent = currentBiome;
      }
    }

    if (this.speedStatEl) {
      if (this.player.speedMod < 0.5) {
        this.speedStatEl.textContent = '35% (Treibsand!)';
        this.speedStatEl.style.color = '#ff9800';
      } else if (this.player.isSprinting && this.player.isMoving) {
        this.speedStatEl.textContent = '150% (Sprint)';
        this.speedStatEl.style.color = '#38bdf8';
      } else {
        this.speedStatEl.textContent = '100%';
        this.speedStatEl.style.color = '#55e6a5';
      }
    }

    if (this.deathStatEl) this.deathStatEl.textContent = this.player.deathCount;
    if (this.posStatEl) {
      const elev = this.player.elevation;
      const elevText = elev === 0 ? 'Boden (0)' : (elev > 0 ? `Podest +${elev}` : `Loch ${elev}`);
      const shrinesFound = this.player.discoveredShrines ? this.player.discoveredShrines.size : 0;
      this.posStatEl.textContent = `X: ${tileX}, Y: ${tileY} | ${elevText} | ⛩️ Schreine: ${shrinesFound}`;
    }

    if (this.deathOverlay) {
      if (this.player.isDead) {
        this.deathOverlay.classList.remove('hidden');
        const info = this.player.lastDeathInfo;
        const titleEl = document.getElementById('death-title');
        const descEl = document.getElementById('death-desc');
        const detailsEl = document.getElementById('death-penalty-details');
        const levelEl = document.getElementById('death-penalty-level');
        const xpEl = document.getElementById('death-penalty-xp');
        const skillsEl = document.getElementById('death-penalty-skills');

        if (info) {
          if (info.cause === 'pvp') {
            const killer = info.killerName || 'Ein Spieler';
            const killerStr = (!killer.toLowerCase().startsWith('spieler')) ? `Spieler ${killer}` : killer;
            if (titleEl) titleEl.textContent = `${killerStr} hat dich besiegt.`;
            if (descEl) descEl.textContent = 'Im Spieler-Duell gefallen.';
          } else if (info.cause === 'enemy') {
            if (titleEl) titleEl.textContent = 'IM KAMPF GEFALLEN!';
            if (descEl) descEl.textContent = `${this.player.name || 'Held'} wurde von einem Monster überwältigt...`;
          } else if (info.cause === 'drown') {
            if (titleEl) titleEl.textContent = 'ERTRUNKEN!';
            if (descEl) descEl.textContent = `${this.player.name || 'Held'} ging im tiefen Wasser unter...`;
          } else {
            if (titleEl) titleEl.textContent = 'IN DIE LEERE GESTÜRZT!';
            if (descEl) descEl.textContent = `${this.player.name || 'Held'} stürzte in den ewigen Abgrund...`;
          }
          if (detailsEl) detailsEl.classList.remove('hidden');
          if (levelEl) levelEl.textContent = `⚡ Level halbiert: Lv. ${info.oldExactLevel.toFixed(2)} → Lv. ${info.newExactLevel.toFixed(2)}`;
          if (xpEl) xpEl.textContent = `✨ ${info.dropXp} EP als Beute gedroppt`;
          if (skillsEl) {
            if (info.skillsReducedCount > 0) {
              skillsEl.textContent = `🛡️ ${info.skillsReducedCount} Skillpunkt${info.skillsReducedCount > 1 ? 'e' : ''} gleichmäßig abgebaut`;
              skillsEl.classList.remove('hidden');
            } else {
              skillsEl.classList.add('hidden');
            }
          }
        }
      } else {
        this.deathOverlay.classList.add('hidden');
      }
    }

    // Time-of-Day HUD Update
    if (this.timeDisplayEl) {
      const hours = Math.floor(this.gameTime);
      const minutes = Math.floor((this.gameTime % 1) * 60);
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      const { sunlight, sunset, night } = this.getDayNightFactors();
      let icon = '☀️ Tag';
      let col = '#38bdf8';
      let lanternText = 'Lampions aus';
      let lanternCol = '#94a3b8';

      if (night > 0.3 || this.gameTime >= 21.0 || this.gameTime < 4.0) {
        icon = '🌙 Geisternacht';
        col = '#818cf8';
        lanternText = '🏮 Lampions an';
        lanternCol = '#fbbf24';
      } else if (sunset > 0.2 || (this.gameTime >= 16.5 && this.gameTime < 21.0)) {
        icon = '🏮 Dämmerung';
        col = '#f59e0b';
        lanternText = '🏮 Lampions an';
        lanternCol = '#f59e0b';
      } else if (this.gameTime >= 4.0 && this.gameTime < 6.5) {
        icon = '🌅 Morgengrauen';
        col = '#f472b6';
        lanternText = 'Lampions aus';
      }

      if (this.currentDimension === DIMENSIONS.CAVES) {
        lanternText = '🏮 Höhlenlampe an';
        lanternCol = '#fbbf24';
      }

      this.timeDisplayEl.textContent = `${timeStr} ${icon}`;
      this.timeDisplayEl.style.color = col;

      if (this.timeBarFillEl) {
        this.timeBarFillEl.style.width = `${(this.gameTime / 24) * 100}%`;
      }
      if (this.lanternStatusEl) {
        this.lanternStatusEl.textContent = lanternText;
        this.lanternStatusEl.style.color = lanternCol;
      }
    }
  }

  updateCombatUI() {
    // 1. Update Ammo counters
    const ammoEl = document.getElementById('ammo-count');
    if (ammoEl && this.player && this.player.ranged) {
      ammoEl.textContent = this.player.ranged.ammo;
    }
    const ammoStatEl = document.getElementById('ammo-stat');
    if (ammoStatEl && this.player && this.player.ranged) {
      ammoStatEl.textContent = `${this.player.ranged.ammo} / 30`;
    }

    // 2. Update Shield meter & status
    const shieldFillEl = document.getElementById('shield-meter-fill');
    if (shieldFillEl && this.player && this.player.shield) {
      const pct = Math.max(0, Math.min(100, (this.player.shield.energy / 100) * 100));
      shieldFillEl.style.width = `${pct}%`;
      if (this.player.shield.broken) {
        shieldFillEl.className = 'broken';
      } else if (pct < 30) {
        shieldFillEl.className = 'warning';
      } else if (!this.player.shield.active && pct < 100) {
        if (this.player.shield.rechargeDelay > 0) {
          shieldFillEl.className = 'paused';
        } else {
          shieldFillEl.className = 'recharging';
        }
      } else {
        shieldFillEl.className = '';
      }
    }
    const shieldStatEl = document.getElementById('shield-stat');
    if (shieldStatEl && this.player && this.player.shield) {
      if (this.player.shield.broken) {
        const pct = Math.round(this.player.shield.energy);
        if (this.player.shield.stunTimer > 0) {
          shieldStatEl.textContent = 'ZERBROCHEN (Stun!)';
        } else {
          shieldStatEl.textContent = `ZERBROCHEN (Lädt: ${pct}%)`;
        }
        shieldStatEl.style.color = '#ef4444';
      } else {
        const pct = Math.round(this.player.shield.energy);
        if (this.player.shield.rechargeDelay > 0 && pct < 100) {
          shieldStatEl.textContent = `${pct}% (1s Pause...)`;
          shieldStatEl.style.color = '#f59e0b';
        } else {
          shieldStatEl.textContent = `${pct}%`;
          shieldStatEl.style.color = pct < 30 ? '#ef4444' : '#38bdf8';
        }
      }
    }

    // 3. Update Player HP display (Dev Tools & Compact Status Pill)
    if (this.player) {
      const curHp = Math.max(0, Math.round(this.player.hp));
      const maxHp = this.player.maxHp || 100;
      const hpPct = Math.max(0, Math.min(1.0, curHp / maxHp));

      if (this.hpStatEl) {
        this.hpStatEl.textContent = `${curHp} / ${maxHp}`;
        this.hpStatEl.style.color = hpPct > 0.5 ? '#4ade80' : (hpPct > 0.25 ? '#facc15' : '#ef4444');
      }

      if (this.compactHpFillEl) {
        this.compactHpFillEl.style.width = `${Math.round(hpPct * 100)}%`;
        this.compactHpFillEl.style.background = hpPct > 0.5
          ? 'linear-gradient(90deg, #22c55e, #4ade80)'
          : (hpPct > 0.25 ? 'linear-gradient(90deg, #d97706, #facc15)' : 'linear-gradient(90deg, #dc2626, #f87171)');
      }
      if (this.compactHpTextEl) {
        this.compactHpTextEl.textContent = `${curHp} / ${maxHp}`;
      }

      // XP & Level Progression
      const curXp = Math.max(0, Math.round(this.player.xp || 0));
      const xpToNext = this.player.xpToNext || 50;
      const curLevel = this.player.level || 1;
      const xpPct = Math.max(0, Math.min(1.0, curXp / xpToNext));

      if (this.compactLevelBadgeEl) {
        this.compactLevelBadgeEl.textContent = `Lv. ${curLevel}`;
      }
      if (this.compactXpFillEl) {
        this.compactXpFillEl.style.width = `${Math.round(xpPct * 100)}%`;
      }
      if (this.compactXpTextEl) {
        this.compactXpTextEl.textContent = `${curXp} / ${xpToNext}`;
      }

      // 4. Skill Menu Button & Blinking Notification
      const skillBtn = document.getElementById('skill-menu-btn');
      const skillBadge = document.getElementById('skill-badge');
      const points = this.player.skillPoints || 0;
      if (skillBtn) {
        if (points > 0) {
          skillBtn.classList.remove('hidden');
          skillBtn.classList.add('blinking');
          if (skillBadge) {
            skillBadge.textContent = points;
            skillBadge.classList.remove('hidden');
          }
        } else {
          skillBtn.classList.remove('blinking');
          if (skillBadge) {
            skillBadge.classList.add('hidden');
          }
          const hasInvested = Boolean(this.player.skills && (
            this.player.skills.hp > 0 ||
            this.player.skills.melee > 0 ||
            this.player.skills.range > 0 ||
            this.player.skills.shield > 0
          ));
          if (curLevel > 1 || hasInvested) {
            skillBtn.classList.remove('hidden');
          } else {
            skillBtn.classList.add('hidden');
          }
        }
      }

      // Synchronize modal if it is currently open
      this.updateSkillModal();
    }
  }

  toggleSkillModal(forceState = null) {
    const modal = document.getElementById('skill-modal');
    if (!modal) return;
    const isClosed = modal.classList.contains('hidden');
    const shouldOpen = forceState !== null ? forceState : isClosed;
    if (shouldOpen) {
      modal.classList.remove('hidden');
      this.updateSkillModal();
    } else {
      modal.classList.add('hidden');
    }
  }

  updateSkillModal() {
    if (!this.player) return;
    const modal = document.getElementById('skill-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    const points = this.player.skillPoints || 0;
    const pointsEl = document.getElementById('skill-points-counter');
    if (pointsEl) {
      pointsEl.textContent = points;
      pointsEl.style.color = points > 0 ? '#4ade80' : '#94a3b8';
    }

    const skills = this.player.skills || { hp: 0, melee: 0, range: 0, shield: 0 };

    // Update Counts and Stat Information
    const hpCount = document.getElementById('skill-count-hp');
    const hpBonus = document.getElementById('skill-bonus-hp');
    if (hpCount) hpCount.textContent = skills.hp;
    if (hpBonus) hpBonus.textContent = `(+${skills.hp * 15} HP)`;

    const meleeCount = document.getElementById('skill-count-melee');
    const meleeBonus = document.getElementById('skill-bonus-melee');
    if (meleeCount) meleeCount.textContent = skills.melee;
    if (meleeBonus) meleeBonus.textContent = `(+${skills.melee * 4} DMG)`;

    const rangeCount = document.getElementById('skill-count-range');
    const rangeBonus = document.getElementById('skill-bonus-range');
    if (rangeCount) rangeCount.textContent = skills.range;
    if (rangeBonus) rangeBonus.textContent = skills.range > 0 ? `(+${skills.range * 25} Spd / +${skills.range * 35} Rng)` : `(Standard)`;

    const shieldCount = document.getElementById('skill-count-shield');
    const shieldBonus = document.getElementById('skill-bonus-shield');
    if (shieldCount) shieldCount.textContent = skills.shield;
    if (shieldBonus) shieldBonus.textContent = `(+${skills.shield * 15} Energie & Block+)`;

    // Disable / Enable Upgrade Buttons depending on available points
    const buttons = modal.querySelectorAll('.skill-upgrade-btn');
    buttons.forEach((btn) => {
      btn.disabled = (points <= 0);
      btn.classList.toggle('disabled', points <= 0);
    });
  }

  investSkillPoint(type) {
    if (!this.player || this.player.skillPoints <= 0) return;
    const success = this.player.investSkillPoint(type);
    if (success) {
      this.updateCombatUI();
      this.updateSkillModal();
    }
  }

  // ==========================================================================
  // DARK GHIBLI 2.5D PAPERCRAFT RENDERING ENGINE (Mononoke + Chihiro Hybrid)
  // ==========================================================================
  render() {
    const t = this.animTime;

    if (this.currentDimension === DIMENSIONS.CLOUDS) {
      this.renderCloudDimension(this.camera.getVisibleTileBounds(), t);
    } else if (this.currentDimension === DIMENSIONS.CAVES) {
      this.renderCaveDimension(this.camera.getVisibleTileBounds(), t);
    } else {
      const { sunlight, sunset, night } = this.getDayNightFactors();

      // 1. Clear Viewport (Midnight Cardboard Base)
      this.ctx.fillStyle = '#0f1322';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // 2. Camera Transform
      this.camera.apply(this.ctx);

      const bounds = this.camera.getVisibleTileBounds();

      // 3. LAYER 1: 2.5D Layered Paper Ground Tiles (Cardstock sheets & cut bevels)
      this.renderPaperGroundTiles(bounds, sunlight, sunset, night, t);

      // 4. LAYER 2: Sunken Riverbed with flowing paper wave ribbons
      this.renderPaperWaterRibbons(bounds, t);

      // 5. LAYER 3: Red Lacquered Paper Bridges
      this.renderPaperBridges(bounds);

      // 6. LAYER 4: Dynamic Warm Lantern Light Cones (Twilight & Night)
      if (night > 0.05 || sunset > 0.05) {
        this.renderLanternLightCones(bounds, t, night, sunset);
      }

      // 7. LAYER 5: Ground Props (Origami Boulders, Stone Lanterns, Paper Mushrooms, Trampolines, Cave Entrances, Shrines)
      this.renderGroundProps(bounds, t, night);

      // Magic Ground Artifacts (unter dem Blätterdach gerendert, damit sie im dichten Wald von außen verdeckt bleiben!)
      if (this.magicManager) {
        this.magicManager.renderGroundArtifacts(this.ctx, this.camera, this.currentDimension);
      }

      // 8. LAYER 6: Y-Sorted Entities (Scalloped Paper Trees, Kodama Spirits, Player)
      this.renderYSortedEntities(bounds, t, night);

      // Combat layer: flying arrows, slashes, hit effects, floating texts, training dummies
      if (this.combat) {
        this.combat.render(this.ctx, bounds, t);
      }

      // 9. LAYER 7: Dense Forest Canopy Roof with Circular Vision Cutout around Player
      this.renderForestCanopy(bounds, t);

      // 10. LAYER 8: Ambient Environmental Particles (Day Clouds, Night Ofuda, Fireflies)
      this.renderEnvironmentalAtmosphere(bounds, t, sunlight, night);

      this.camera.release(this.ctx);

      // 11. LAYER 9: Global Ambient Day/Night Lighting Wash & Forest Shade
      this.renderGlobalLightingWash(sunlight, sunset, night);
    }

    // 11.5. Magic Layer: Spells, Plasma Orbs & Player Sparkle Aura
    if (this.magicManager) {
      if (this.currentDimension !== DIMENSIONS.OVERWORLD) {
        this.magicManager.renderGroundArtifacts(this.ctx, this.camera, this.currentDimension);
      }
      this.magicManager.renderSpellsAndAuras(this.ctx, this.camera);
    }

    // 12. Screen Overlay: Floating Shrine Discovery Banner
    if (this.player.shrineMessage) {
      this.renderShrineBanner(this.player.shrineMessage);
    }

    // 12.5. Screen Overlay: Teleport Blackout Fade (kurze Schwarzüberblende während Kamerasprung)
    if (this.player && typeof this.player.getTeleportBlackoutAlpha === 'function') {
      const bAlpha = this.player.getTeleportBlackoutAlpha();
      if (bAlpha > 0) {
        this.ctx.save();
        this.ctx.fillStyle = `rgba(15, 5, 29, ${bAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
      }
    }

    // 13. LAYER 10: Minimap (inklusive Mitspieler auf der Karte)
    this.minimap.render(this.player, this.camera, this.remotePlayers);
  }

  renderPaperGroundTiles(bounds, sunlight, sunset, night, t) {
    const ts = TILE_SIZE;
    const startY = Math.max(0, bounds.startY - 2);
    const endY = Math.min(this.map.height, bounds.endY + 2);
    const startX = Math.max(0, bounds.startX - 1);
    const endX = Math.min(this.map.width, bounds.endX + 1);

    // ========================================================================
    // PASS 1: Base ground cardstock surfaces & animated biome textures
    // ========================================================================
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.map.getGroundTile(x, y);
        const elev = this.map.getElevation(x, y);
        const px = x * ts;
        const py = y * ts;
        const surfaceY = py - elev * ELEVATION_PIXEL_OFFSET;

        let baseCol = '#224434'; // Mononoke Jade Cardstock (Grass)
        let isElevated = true;

        if (tile === TILES.DIRT) {
          baseCol = '#382d24';
        } else if (tile === TILES.SAND) {
          baseCol = '#dfb867'; // Warm golden desert sand
        } else if (tile === TILES.QUICKSAND) {
          baseCol = '#6b4317'; // Treibsand: sunken dark amber mud
          isElevated = false;
        } else if (tile === TILES.SNOW) {
          baseCol = '#5f758c'; // Frosted Lavender Cardstock
        } else if (tile === TILES.SWAMP_GROUND) {
          baseCol = '#1c2e22'; // Swamp Moss Paper
        } else if (tile === TILES.WATER || tile === TILES.SWAMP_WATER) {
          baseCol = '#0c1620'; // Sunken Cut Riverbed
          isElevated = false;
        } else if (tile === TILES.VOID_GROUND) {
          baseCol = '#221236'; // Solid deep obsidian twilight cardstock
        } else if (tile === TILES.VOID_LAKE) {
          baseCol = '#030008'; // Das Leerenmeer: endloser kosmischer Schlund
          isElevated = false;
        } else if (tile === TILES.BRIDGE_H || tile === TILES.BRIDGE_V) {
          baseCol = '#4d1e1c';
        }

        // Base card tile surface
        this.ctx.fillStyle = baseCol;
        this.ctx.fillRect(px, surfaceY, ts, ts);

        // Elevation-based shading ("heller nach oben, dunkler nach unten"):
        if (elev === ELEVATION.LEVEL_2) {
          // Level +2: deutlich heller & leuchtender
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
          this.ctx.fillRect(px, surfaceY, ts, ts);
        } else if (elev === ELEVATION.LEVEL_1) {
          // Level +1: spürbar heller
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          this.ctx.fillRect(px, surfaceY, ts, ts);
        } else if (elev === ELEVATION.HOLE) {
          // Level -1 (Loch): deutlich dunkler / tief abgesenkt
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
          this.ctx.fillRect(px, surfaceY, ts, ts);
        }

        // 2.5D Physical Cardstock Thickness & Highlights
        if (isElevated && elev >= 0) {
          // Top cut edge highlight bevel (extra crisp for higher tiers)
          const bevelAlpha = elev === ELEVATION.LEVEL_2 ? 'rgba(255, 255, 255, 0.38)' : 'rgba(255, 255, 255, 0.20)';
          this.ctx.fillStyle = bevelAlpha;
          this.ctx.fillRect(px, surfaceY, ts, 1.8);

          // Bottom edge shadow when neighbor to South is at same or higher elevation
          const elevS = (y + 1 < this.map.height) ? this.map.getElevation(x, y + 1) : elev;
          if (elevS >= elev) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            this.ctx.fillRect(px, surfaceY + ts - 2, ts, 2);
          }
        }

        // --- SPECIAL TERRAIN DETAILS (Rendered relative to surfaceY) ---
        // 1. WÜSTENSAND DETAILS (Windrippeln, Dünenkämme, Quarzglitzer)
        if (tile === TILES.SAND) {
          const dune = Math.sin(x * 0.45 + y * 0.85);
          if (dune > 0.4) {
            this.ctx.fillStyle = '#f3d88c'; // Lichter Dünenkamm
            this.ctx.fillRect(px + 1, surfaceY + 4, 14, 1.5);
            this.ctx.fillRect(px + 4, surfaceY + 11, 10, 1.5);
          } else if (dune < -0.4) {
            this.ctx.fillStyle = '#c89943'; // Warmer Schattensaum der Düne
            this.ctx.fillRect(px + 2, surfaceY + 6, 12, 1);
            this.ctx.fillRect(px + 1, surfaceY + 13, 13, 1);
          }
          // Feine Sandkörnchen
          if ((x * 23 + y * 37) % 7 === 0) {
            this.ctx.fillStyle = '#fff4ce';
            this.ctx.fillRect(px + 5, surfaceY + 7, 1.5, 1.5);
          } else if ((x * 19 + y * 29) % 9 === 0) {
            this.ctx.fillStyle = '#b78330';
            this.ctx.fillRect(px + 10, surfaceY + 3, 1.5, 1.5);
          }
        }

        // 2. TREIBSAND (Wirbelnder Mahlstrom, Schlickkrater, Blubberblasen)
        else if (tile === TILES.QUICKSAND) {
          // Krater-Innenschatten (abgesenkt)
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          this.ctx.fillRect(px, surfaceY, ts, 2);
          this.ctx.fillRect(px, surfaceY, 2, ts);

          // Dynamischer Wirbel
          const gcx = 28 * ts + 8;
          const gcy = 72 * ts + 8;
          const gdx = (px + 8) - gcx;
          const gdy = (surfaceY + 8) - gcy;
          const dist = Math.hypot(gdx, gdy);
          const angle = Math.atan2(gdy, gdx) + dist * 0.08 - t * 2.8;
          const swirl = Math.sin(angle * 3.5);

          if (swirl > 0.3) {
            this.ctx.fillStyle = '#a6762f';
            this.ctx.fillRect(px + 2, surfaceY + 4, 12, 2);
          } else if (swirl < -0.3) {
            this.ctx.fillStyle = '#452608';
            this.ctx.fillRect(px + 3, surfaceY + 9, 10, 2);
          }

          // Aufsteigende Schlickblasen
          const bubblePhase = Math.sin(t * 3.5 + x * 7 + y * 11);
          if (bubblePhase > 0.65) {
            this.ctx.fillStyle = '#d49b42';
            this.ctx.fillRect(px + 7, surfaceY + 6, 2, 2);
            this.ctx.fillStyle = '#fff0ba';
            this.ctx.fillRect(px + 7, surfaceY + 6, 1, 1);
          }
        }

        // 3. SOLID VOID GROUND (Fester Leerenboden)
        else if (tile === TILES.VOID_GROUND) {
          if ((x * 17 + y * 23) % 7 === 0) {
            this.ctx.fillStyle = 'rgba(192, 132, 252, 0.85)';
            this.ctx.fillRect(px + 6, surfaceY + 6, 2, 2);
          } else if ((x * 13 + y * 31) % 9 === 0) {
            this.ctx.fillStyle = 'rgba(147, 51, 234, 0.6)';
            this.ctx.fillRect(px + 3, surfaceY + 10, 3, 1);
          }
        }

        // 4. LEERENMEER (Tödlicher kosmischer Abgrund)
        else if (tile === TILES.VOID_LAKE) {
          const vcx = 112 * ts + 8;
          const vcy = 62 * ts + 8;
          const vdx = (px + 8) - vcx;
          const vdy = (surfaceY + 8) - vcy;
          const vdist = Math.hypot(vdx, vdy);
          const vAngle = Math.atan2(vdy, vdx) + vdist * 0.06 - t * 1.8;
          const vWave = Math.sin(vAngle * 3.0 + vdist * 0.1);

          if (vWave > 0.35) {
            this.ctx.fillStyle = 'rgba(126, 34, 206, 0.45)';
            this.ctx.fillRect(px + 2, surfaceY + 5, 12, 2);
          } else if (vWave < -0.35) {
            this.ctx.fillStyle = 'rgba(88, 28, 135, 0.35)';
            this.ctx.fillRect(px + 3, surfaceY + 9, 10, 2);
          }

          const spark = Math.sin(t * 4.5 + x * 13 + y * 19);
          if (spark > 0.72) {
            this.ctx.fillStyle = 'rgba(232, 121, 249, 0.9)';
            this.ctx.fillRect(px + 6, surfaceY + 7, 2, 2);
          }

          const neighbors = this.map.getNeighbors(x, y);
          const hasSolidNeighbor = (
            neighbors.N !== TILES.VOID_LAKE ||
            neighbors.S !== TILES.VOID_LAKE ||
            neighbors.W !== TILES.VOID_LAKE ||
            neighbors.E !== TILES.VOID_LAKE
          );

          if (hasSolidNeighbor) {
            const glowPulse = Math.sin(t * 4.0 + (x + y) * 0.5) * 0.2 + 0.8;
            this.ctx.fillStyle = `rgba(192, 132, 252, ${0.75 * glowPulse})`;
            if (neighbors.N !== TILES.VOID_LAKE) this.ctx.fillRect(px, surfaceY, ts, 2.5);
            if (neighbors.S !== TILES.VOID_LAKE) this.ctx.fillRect(px, surfaceY + ts - 2.5, ts, 2.5);
            if (neighbors.W !== TILES.VOID_LAKE) this.ctx.fillRect(px, surfaceY, 2.5, ts);
            if (neighbors.E !== TILES.VOID_LAKE) this.ctx.fillRect(px + ts - 2.5, surfaceY, 2.5, ts);

            this.ctx.fillStyle = `rgba(244, 114, 182, ${0.9 * glowPulse})`;
            if (neighbors.N !== TILES.VOID_LAKE) this.ctx.fillRect(px + 2, surfaceY, ts - 4, 1);
            if (neighbors.S !== TILES.VOID_LAKE) this.ctx.fillRect(px + 2, surfaceY + ts - 1, ts - 4, 1);
            if (neighbors.W !== TILES.VOID_LAKE) this.ctx.fillRect(px, surfaceY + 2, 1, ts - 4);
            if (neighbors.E !== TILES.VOID_LAKE) this.ctx.fillRect(px + ts - 1, surfaceY + 2, 1, ts - 4);
          }
        }
      }
    }

    // ========================================================================
    // PASS 2: 2.5D Physical Cardstock Cliffs, Slopes / Ramps, and Depth Shadows
    // ========================================================================
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.map.getGroundTile(x, y);
        const elev = this.map.getElevation(x, y);
        const ramp = this.map.getRamp(x, y);
        const px = x * ts;
        const py = y * ts;
        const surfaceY = py - elev * ELEVATION_PIXEL_OFFSET;

        // 1. DIRECTIONAL RAMPS (Folded paper ramps with wooden/stone steps)
        if (ramp !== RAMPS.NONE) {
          this.renderRampTile(px, surfaceY, ramp, elev, tile);
        }

        // 2. INNER RIM SHADOWS FOR HOLES (-1)
        if (elev === ELEVATION.HOLE) {
          const elevN = (y - 1 >= 0) ? this.map.getElevation(x, y - 1) : 0;
          const elevW = (x - 1 >= 0) ? this.map.getElevation(x - 1, y) : 0;
          const elevE = (x + 1 < this.map.width) ? this.map.getElevation(x + 1, y) : 0;
          const elevS = (y + 1 < this.map.height) ? this.map.getElevation(x, y + 1) : 0;

          // Massiv verstärkte Innenschatten im Loch
          if (elevN > ELEVATION.HOLE) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            this.ctx.fillRect(px, surfaceY, ts, 3.5);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            this.ctx.fillRect(px, surfaceY + 3.5, ts, 2.5);
          }
          if (elevW > ELEVATION.HOLE) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            this.ctx.fillRect(px, surfaceY, 3.5, ts);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            this.ctx.fillRect(px + 3.5, surfaceY, 2, ts);
          }
          if (elevE > ELEVATION.HOLE) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            this.ctx.fillRect(px + ts - 3.5, surfaceY, 3.5, ts);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            this.ctx.fillRect(px + ts - 5.5, surfaceY, 2, ts);
          }
          if (elevS > ELEVATION.HOLE) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            this.ctx.fillRect(px, surfaceY + ts - 3, ts, 3);
          }
          // Pit cracks and dark pebbles at bottom of hole
          if ((x * 19 + y * 29) % 4 === 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(px + 4, surfaceY + 7, 4, 2.5);
          }
        }

        // 3. SOUTH-FACING PHYSICAL CLIFF FACES (Abbrüche nach Süden)
        const elevS = (y + 1 < this.map.height) ? this.map.getElevation(x, y + 1) : elev;
        const rampS = (y + 1 < this.map.height) ? this.map.getRamp(x, y + 1) : RAMPS.NONE;

        if (elev > elevS && rampS !== RAMPS.UP_NORTH && ramp !== RAMPS.UP_SOUTH) {
          const cliffH = (elev - elevS) * ELEVATION_PIXEL_OFFSET;
          const cliffTopY = surfaceY + ts;
          const cliffBottomY = cliffTopY + cliffH;

          // Biome-specific cliff face palette (hoher Kontrast & Plastizität)
          let cliffBase = '#20160f';
          let cliffLine = '#352518';
          let cliffHighlight = 'rgba(255, 255, 255, 0.22)';

          if (tile === TILES.SAND || tile === TILES.QUICKSAND) {
            cliffBase = '#8a5e1d'; cliffLine = '#664512'; cliffHighlight = '#ffd98c';
          } else if (tile === TILES.SNOW) {
            cliffBase = '#2c3947'; cliffLine = '#1f2933'; cliffHighlight = '#94a9bf';
          } else if (tile === TILES.VOID_GROUND || tile === TILES.VOID_LAKE) {
            cliffBase = '#110620'; cliffLine = '#230b3d'; cliffHighlight = '#d8b4fe';
          } else if (tile === TILES.SWAMP_GROUND || tile === TILES.SWAMP_WATER) {
            cliffBase = '#0e1710'; cliffLine = '#080d09'; cliffHighlight = '#344e39';
          }

          // Main vertical cut cliff wall
          this.ctx.fillStyle = cliffBase;
          this.ctx.fillRect(px, cliffTopY, ts, cliffH);

          // Oberste Schnittkante: Glänzendes Lichtband
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          this.ctx.fillRect(px, cliffTopY - 1.5, ts, 1.5);

          // Scharfe dunkle Schnittrille (Incision) zwischen Oberfläche und Wand
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          this.ctx.fillRect(px, cliffTopY, ts, 1.5);

          // Cardboard layered core striations
          this.ctx.fillStyle = cliffLine;
          this.ctx.fillRect(px, cliffTopY + Math.floor(cliffH * 0.45), ts, 1.5);
          this.ctx.fillStyle = cliffHighlight;
          this.ctx.fillRect(px, cliffTopY + Math.floor(cliffH * 0.45) + 1.5, ts, 1);

          if (cliffH >= 14) {
            this.ctx.fillStyle = cliffLine;
            this.ctx.fillRect(px, cliffTopY + Math.floor(cliffH * 0.75), ts, 1.5);
            this.ctx.fillStyle = cliffHighlight;
            this.ctx.fillRect(px, cliffTopY + Math.floor(cliffH * 0.75) + 1.5, ts, 1);
          }

          // Vertical cut cardstock tooth marks
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          this.ctx.fillRect(px + 4, cliffTopY, 1.2, cliffH);
          this.ctx.fillRect(px + 11, cliffTopY, 1.2, cliffH);

          // Void crystal veins in cliff
          if (tile === TILES.VOID_GROUND || tile === TILES.VOID_LAKE) {
            this.ctx.fillStyle = 'rgba(192, 132, 252, 0.85)';
            this.ctx.fillRect(px + 3, cliffTopY + 2, 4, 1.2);
            this.ctx.fillRect(px + 9, cliffTopY + 4, 3, 1.2);
          }

          // Fetter, gestufter Schlagschatten auf den unteren Boden (Contact Drop Shadow)
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
          this.ctx.fillRect(px, cliffBottomY, ts, 2.5);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
          this.ctx.fillRect(px, cliffBottomY + 2.5, ts, 2.5);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
          this.ctx.fillRect(px, cliffBottomY + 5, ts, 2);
        }

        // 4. NORTH-FACING CLIFF EDGES (Scharfe obere Pappkante)
        const elevN = (y - 1 >= 0) ? this.map.getElevation(x, y - 1) : elev;
        const rampN = (y - 1 >= 0) ? this.map.getRamp(x, y - 1) : RAMPS.NONE;

        if (elev > elevN && ramp !== RAMPS.UP_NORTH && rampN !== RAMPS.UP_SOUTH) {
          // Starkes, leuchtendes Lichtband an der Oberkante des Podests
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          this.ctx.fillRect(px, surfaceY, ts, 2);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          this.ctx.fillRect(px, surfaceY + 2, ts, 1);

          // Schattenwurf nach Norden auf das tiefere Terrain
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
          this.ctx.fillRect(px, surfaceY - 3, ts, 3);
        }

        // 5. WEST-FACING CLIFF DROPS (Schattenkante links)
        const elevW = (x - 1 >= 0) ? this.map.getElevation(x - 1, y) : elev;
        const rampW = (x - 1 >= 0) ? this.map.getRamp(x - 1, y) : RAMPS.NONE;

        if (elev > elevW && ramp !== RAMPS.UP_WEST && rampW !== RAMPS.UP_EAST) {
          const diffW = (elev - elevW) * ELEVATION_PIXEL_OFFSET;
          // Dunkle Schnittkante auf dem Podest
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          this.ctx.fillRect(px, surfaceY, 2.5, ts);
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          this.ctx.fillRect(px + 2.5, surfaceY, 1.5, ts);

          // Ausgeprägter Schlagschatten auf das westliche Nachbarfeld
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          this.ctx.fillRect(px - 3.5, surfaceY + diffW, 3.5, ts);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          this.ctx.fillRect(px - 6, surfaceY + diffW, 2.5, ts);
        }

        // 6. EAST-FACING CLIFF DROPS (Lichtkante rechts)
        const elevE = (x + 1 < this.map.width) ? this.map.getElevation(x + 1, y) : elev;
        const rampE = (x + 1 < this.map.width) ? this.map.getRamp(x + 1, y) : RAMPS.NONE;

        if (elev > elevE && ramp !== RAMPS.UP_EAST && rampE !== RAMPS.UP_WEST) {
          const diffE = (elev - elevE) * ELEVATION_PIXEL_OFFSET;
          // Helle Schnittkante auf dem Podest
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          this.ctx.fillRect(px + ts - 2.5, surfaceY, 2.5, ts);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          this.ctx.fillRect(px + ts - 3.5, surfaceY, 1, ts);

          // Ausgeprägter Schlagschatten auf das östliche Nachbarfeld
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          this.ctx.fillRect(px + ts, surfaceY + diffE, 3.5, ts);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          this.ctx.fillRect(px + ts + 3.5, surfaceY + diffE, 2.5, ts);
        }
      }
    }
  }

  renderRampTile(px, surfaceY, ramp, elev, tile) {
    const ts = TILE_SIZE;

    // Biome-specific materials for ramps
    let plankCol = '#6b492b';
    let plankLight = '#9e6d42';
    let plankDark = '#3d2514';
    let railCol = '#26160a';
    let accentCol = '#fbbf24'; // Warm glowing golden step marker

    if (tile === TILES.SAND || tile === TILES.QUICKSAND) {
      plankCol = '#c99642'; plankLight = '#f0be6b'; plankDark = '#785018'; railCol = '#472f0b'; accentCol = '#ffffff';
    } else if (tile === TILES.SNOW) {
      plankCol = '#56697d'; plankLight = '#8da6bf'; plankDark = '#2d3844'; railCol = '#1a222b'; accentCol = '#bfdbfe';
    } else if (tile === TILES.VOID_GROUND || tile === TILES.VOID_LAKE) {
      plankCol = '#3b185e'; plankLight = '#732fb8'; plankDark = '#1a082b'; railCol = '#0d0217'; accentCol = '#e879f9';
    } else if (tile === TILES.SWAMP_GROUND || tile === TILES.SWAMP_WATER) {
      plankCol = '#374730'; plankLight = '#58734d'; plankDark = '#1b2418'; railCol = '#0f140e'; accentCol = '#bbf7d0';
    }

    // Outer dark framing border
    this.ctx.fillStyle = railCol;
    this.ctx.fillRect(px, surfaceY, ts, ts);

    // Inner ramp base fill
    this.ctx.fillStyle = plankCol;
    this.ctx.fillRect(px + 1, surfaceY + 1, ts - 2, ts - 2);

    if (ramp === RAMPS.UP_NORTH) {
      // Slopes UP towards North
      // Folded paper side rails
      this.ctx.fillStyle = railCol;
      this.ctx.fillRect(px, surfaceY, 2.5, ts);
      this.ctx.fillRect(px + ts - 2.5, surfaceY, 2.5, ts);

      // Side rail highlights
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(px + 2.5, surfaceY, 1, ts);
      this.ctx.fillRect(px + ts - 3.5, surfaceY, 1, ts);

      // 4 Stepped Planks / Rungs
      for (let i = 0; i < 4; i++) {
        const ry = surfaceY + i * 4;
        this.ctx.fillStyle = plankLight;
        this.ctx.fillRect(px + 2.5, ry, ts - 5, 1.5);
        this.ctx.fillStyle = plankDark;
        this.ctx.fillRect(px + 2.5, ry + 1.5, ts - 5, 1.5);
      }

      // Corner post studs
      this.ctx.fillStyle = '#0f0804';
      this.ctx.fillRect(px, surfaceY, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY, 3, 3);
      this.ctx.fillRect(px, surfaceY + ts - 3, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY + ts - 3, 3, 3);

      // Large luminous upward step chevron
      this.ctx.fillStyle = accentCol;
      this.ctx.fillRect(px + 7, surfaceY + 2, 2, 2);
      this.ctx.fillRect(px + 5, surfaceY + 4, 6, 1.5);
    } else if (ramp === RAMPS.UP_SOUTH) {
      // Slopes UP towards South
      this.ctx.fillStyle = railCol;
      this.ctx.fillRect(px, surfaceY, 2.5, ts);
      this.ctx.fillRect(px + ts - 2.5, surfaceY, 2.5, ts);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(px + 2.5, surfaceY, 1, ts);
      this.ctx.fillRect(px + ts - 3.5, surfaceY, 1, ts);

      for (let i = 0; i < 4; i++) {
        const ry = surfaceY + i * 4;
        this.ctx.fillStyle = plankLight;
        this.ctx.fillRect(px + 2.5, ry, ts - 5, 1.5);
        this.ctx.fillStyle = plankDark;
        this.ctx.fillRect(px + 2.5, ry + 1.5, ts - 5, 1.5);
      }

      this.ctx.fillStyle = '#0f0804';
      this.ctx.fillRect(px, surfaceY, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY, 3, 3);
      this.ctx.fillRect(px, surfaceY + ts - 3, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY + ts - 3, 3, 3);

      this.ctx.fillStyle = accentCol;
      this.ctx.fillRect(px + 5, surfaceY + 10.5, 6, 1.5);
      this.ctx.fillRect(px + 7, surfaceY + 12, 2, 2);
    } else if (ramp === RAMPS.UP_WEST) {
      // Slopes UP towards West
      this.ctx.fillStyle = railCol;
      this.ctx.fillRect(px, surfaceY, ts, 2.5);
      this.ctx.fillRect(px, surfaceY + ts - 2.5, ts, 2.5);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(px, surfaceY + 2.5, ts, 1);
      this.ctx.fillRect(px + ts - 3.5, surfaceY, 1, ts);

      for (let i = 0; i < 4; i++) {
        const rx = px + i * 4;
        this.ctx.fillStyle = plankLight;
        this.ctx.fillRect(rx, surfaceY + 2.5, 1.5, ts - 5);
        this.ctx.fillStyle = plankDark;
        this.ctx.fillRect(rx + 1.5, surfaceY + 2.5, 1.5, ts - 5);
      }

      this.ctx.fillStyle = '#0f0804';
      this.ctx.fillRect(px, surfaceY, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY, 3, 3);
      this.ctx.fillRect(px, surfaceY + ts - 3, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY + ts - 3, 3, 3);

      this.ctx.fillStyle = accentCol;
      this.ctx.fillRect(px + 2, surfaceY + 7, 2, 2);
      this.ctx.fillRect(px + 4, surfaceY + 5, 1.5, 6);
    } else if (ramp === RAMPS.UP_EAST) {
      // Slopes UP towards East
      this.ctx.fillStyle = railCol;
      this.ctx.fillRect(px, surfaceY, ts, 2.5);
      this.ctx.fillRect(px, surfaceY + ts - 2.5, ts, 2.5);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(px, surfaceY + 2.5, ts, 1);
      this.ctx.fillRect(px + ts - 3.5, surfaceY, 1, ts);

      for (let i = 0; i < 4; i++) {
        const rx = px + i * 4;
        this.ctx.fillStyle = plankLight;
        this.ctx.fillRect(rx, surfaceY + 2.5, 1.5, ts - 5);
        this.ctx.fillStyle = plankDark;
        this.ctx.fillRect(rx + 1.5, surfaceY + 2.5, 1.5, ts - 5);
      }

      this.ctx.fillStyle = '#0f0804';
      this.ctx.fillRect(px, surfaceY, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY, 3, 3);
      this.ctx.fillRect(px, surfaceY + ts - 3, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY + ts - 3, 3, 3);

      this.ctx.fillStyle = accentCol;
      this.ctx.fillRect(px + 12, surfaceY + 7, 2, 2);
      this.ctx.fillRect(px + 10.5, surfaceY + 5, 1.5, 6);
    }
  }

  renderPaperWaterRibbons(bounds, t) {
    const ts = TILE_SIZE;
    for (let y = bounds.startY; y < bounds.endY; y++) {
      for (let x = bounds.startX; x < bounds.endX; x++) {
        const tile = this.map.getGroundTile(x, y);
        if (tile === TILES.WATER || tile === TILES.SWAMP_WATER) {
          const px = x * ts;
          const py = y * ts;
          const wave = Math.sin((x * 0.4 + y * 0.2) - t * 2.2);
          if (wave > 0.45) {
            this.ctx.fillStyle = tile === TILES.WATER
              ? 'rgba(94, 234, 212, 0.45)' // Cyan paper ribbon
              : 'rgba(52, 211, 153, 0.35)'; // Mossy paper ribbon
            this.ctx.fillRect(px + 2, py + 6, 12, 1.5);
          }
        }
      }
    }
  }

  renderPaperBridges(bounds) {
    const ts = TILE_SIZE;
    for (let y = bounds.startY; y < bounds.endY; y++) {
      for (let x = bounds.startX; x < bounds.endX; x++) {
        const tile = this.map.getGroundTile(x, y);
        if (tile === TILES.BRIDGE_H || tile === TILES.BRIDGE_V) {
          const px = x * ts;
          const py = y * ts;

          // Red lacquered bridge plank
          this.ctx.fillStyle = '#b91c1c';
          this.ctx.fillRect(px, py, ts, ts);

          // Wood planks
          this.ctx.fillStyle = '#7f1d1d';
          this.ctx.fillRect(px, py, ts, 1);
          this.ctx.fillRect(px, py + ts - 2, ts, 2);

          // Golden lacquered studs
          this.ctx.fillStyle = '#fbbf24';
          this.ctx.fillRect(px + 2, py + 2, 2, 2);
          this.ctx.fillRect(px + ts - 4, py + 2, 2, 2);
        }
      }
    }
  }

  renderLanternLightCones(bounds, t, night, sunset) {
    const intensity = Math.max(night * 1.0, sunset * 0.6);
    if (intensity <= 0.01) return;

    // 1. Hanging tree lanterns
    const visibleTrees = this.map.getVisibleTrees(bounds);
    for (const tree of visibleTrees) {
      if (!tree.hasLantern) continue;

      const tTileX = Math.floor(tree.x / TILE_SIZE);
      const tTileY = Math.floor(tree.y / TILE_SIZE);
      const tElev = this.map.getElevation(tTileX, tTileY);

      const lx = tree.x + 8;
      const ly = tree.y - 12 - tElev * ELEVATION_PIXEL_OFFSET;
      const fPulse = Math.sin(t * 7 + tree.x) * 2;
      const radius = (48 + fPulse);

      const grad = this.ctx.createRadialGradient(lx, ly, 3, lx, ly, radius);
      grad.addColorStop(0, `rgba(254, 240, 138, ${0.36 * intensity})`); // Warm gold core
      grad.addColorStop(0.4, `rgba(249, 115, 22, ${0.18 * intensity})`); // Reddish-amber mid
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(lx, ly, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 1b. Hängende Lampions im dichten Blätterdach
    const canopyCrowns = this.map.getVisibleCanopyCrowns(bounds);
    for (const crown of canopyCrowns) {
      if (!crown.hasLantern) continue;

      const cTileX = Math.floor(crown.x / TILE_SIZE);
      const cTileY = Math.floor(crown.y / TILE_SIZE);
      const cElev = this.map.getElevation(cTileX, cTileY);

      const lx = crown.x + 8;
      const ly = crown.y + 12 - cElev * ELEVATION_PIXEL_OFFSET;
      const fPulse = Math.sin(t * 7 + crown.x) * 2;
      const radius = (48 + fPulse);

      const grad = this.ctx.createRadialGradient(lx, ly, 3, lx, ly, radius);
      grad.addColorStop(0, `rgba(254, 240, 138, ${0.36 * intensity})`);
      grad.addColorStop(0.4, `rgba(249, 115, 22, ${0.18 * intensity})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(lx, ly, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 2. Stone Lanterns (Tōrō) along paths & bridge
    for (let y = bounds.startY; y < bounds.endY; y++) {
      for (let x = bounds.startX; x < bounds.endX; x++) {
        if (this.map.getObjectTile(x, y) === OBJECTS.STONE_TORO) {
          const elev = this.map.getElevation(x, y);
          const lx = x * TILE_SIZE + 8;
          const ly = y * TILE_SIZE + 8 - elev * ELEVATION_PIXEL_OFFSET;
          const fPulse = Math.sin(t * 9 + x) * 1.5;
          const radius = (52 + fPulse);

          const grad = this.ctx.createRadialGradient(lx, ly, 4, lx, ly, radius);
          grad.addColorStop(0, `rgba(254, 240, 138, ${0.4 * intensity})`);
          grad.addColorStop(0.5, `rgba(234, 88, 12, ${0.2 * intensity})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          this.ctx.fillStyle = grad;
          this.ctx.beginPath();
          this.ctx.arc(lx, ly, radius, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    // 3. Player's Handheld Lantern (illuminates surroundings on movement)
    const plx = this.player.x + 6;
    const ply = this.player.y - 8 - Math.round(this.player.visualElevation * ELEVATION_PIXEL_OFFSET);
    const pPulse = Math.sin(t * 12) * 2;
    const pRadius = (68 + pPulse);

    const pGrad = this.ctx.createRadialGradient(plx, ply, 4, plx, ply, pRadius);
    pGrad.addColorStop(0, `rgba(254, 240, 138, ${0.42 * intensity})`);
    pGrad.addColorStop(0.45, `rgba(249, 115, 22, ${0.2 * intensity})`);
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = pGrad;
    this.ctx.beginPath();
    this.ctx.arc(plx, ply, pRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderGroundProps(bounds, t, night) {
    const ts = TILE_SIZE;

    const startY = Math.max(0, bounds.startY - 1);
    const endY = Math.min(this.map.height, bounds.endY + 2);
    const startX = Math.max(0, bounds.startX - 1);
    const endX = Math.min(this.map.width, bounds.endX + 1);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const obj = this.map.getObjectTile(x, y);
        if (obj === OBJECTS.NONE) continue;
        const elev = this.map.getElevation(x, y);
        const px = x * ts;
        const py = y * ts - elev * ELEVATION_PIXEL_OFFSET;

        // 1. Stone Lantern (Tōrō)
        if (obj === OBJECTS.STONE_TORO) {
          // Drop shadow
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          this.ctx.fillRect(px + 2, py + 12, 12, 4);

          // Base & pillar
          this.ctx.fillStyle = '#475569';
          this.ctx.fillRect(px + 5, py + 4, 6, 10);
          this.ctx.fillStyle = '#334155';
          this.ctx.fillRect(px + 3, py + 12, 10, 3);

          // Lantern fire chamber (warm glow at night)
          this.ctx.fillStyle = night > 0.1 ? '#fef08a' : '#1e293b';
          this.ctx.fillRect(px + 5, py + 6, 6, 4);

          // Pagoda roof cap
          this.ctx.fillStyle = '#1e293b';
          this.ctx.beginPath();
          this.ctx.moveTo(px + 1, py + 5);
          this.ctx.lineTo(px + 8, py + 1);
          this.ctx.lineTo(px + 15, py + 5);
          this.ctx.closePath();
          this.ctx.fill();
        }

        // 2. Torii Shrine Gate
        else if (obj === OBJECTS.TORII_GATE) {
          // Red lacquered gate pillars
          this.ctx.fillStyle = '#dc2626';
          this.ctx.fillRect(px + 1, py - 6, 3, 22);
          this.ctx.fillRect(px + 12, py - 6, 3, 22);

          // Top crossbeams
          this.ctx.fillStyle = '#b91c1c';
          this.ctx.fillRect(px - 2, py - 8, 20, 3);
          this.ctx.fillStyle = '#0f172a'; // Black lintel
          this.ctx.fillRect(px - 4, py - 11, 24, 3);
        }

        // 3. Origami Boulders
        else if (obj === OBJECTS.ROCK_STONE || obj === OBJECTS.ROCK_ICE || obj === OBJECTS.ROCK_VOID) {
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          this.ctx.fillRect(px + 2, py + 8, 12, 6);

          let lightFacet = '#4b5563';
          let darkFacet = '#374151';
          if (obj === OBJECTS.ROCK_ICE) {
            lightFacet = '#93c5fd'; darkFacet = '#60a5fa';
          } else if (obj === OBJECTS.ROCK_VOID) {
            lightFacet = '#a855f7'; darkFacet = '#6b21a8';
          }

          // Light facet
          this.ctx.fillStyle = lightFacet;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 2, py + 12);
          this.ctx.lineTo(px + 8, py + 4);
          this.ctx.lineTo(px + 8, py + 12);
          this.ctx.closePath();
          this.ctx.fill();

          // Shadow facet
          this.ctx.fillStyle = darkFacet;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 8, py + 4);
          this.ctx.lineTo(px + 14, py + 12);
          this.ctx.lineTo(px + 8, py + 12);
          this.ctx.closePath();
          this.ctx.fill();

          // Paper crease fold
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 8, py + 4);
          this.ctx.lineTo(px + 8, py + 12);
          this.ctx.stroke();
        }

        // 4. Paper Mushrooms
        else if (obj === OBJECTS.MUSHROOM || obj === OBJECTS.MUSHROOM_BROWN) {
          this.ctx.fillStyle = '#f8fafc';
          this.ctx.fillRect(px + 7, py + 8, 2, 6);
          this.ctx.fillStyle = obj === OBJECTS.MUSHROOM ? '#ef4444' : '#b45309';
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 7, 5, Math.PI, 0);
          this.ctx.fill();
        }

        // 5. Paper Bushes & Flowers
        else if (obj === OBJECTS.BUSH || obj === OBJECTS.FOREST_FLOWERS || obj === OBJECTS.FERN) {
          this.ctx.fillStyle = '#1e382b';
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 8, 5, 0, Math.PI * 2);
          this.ctx.fill();
          if (obj === OBJECTS.FOREST_FLOWERS) {
            this.ctx.fillStyle = '#fbcfe8';
            this.ctx.fillRect(px + 7, py + 7, 2, 2);
          }
        }

        // 6. Desert Cacti
        else if (obj === OBJECTS.CACTUS) {
          this.ctx.fillStyle = '#1e3a29';
          this.ctx.fillRect(px + 6, py + 2, 4, 12);
          this.ctx.fillRect(px + 2, py + 5, 4, 4);
          this.ctx.fillRect(px + 10, py + 7, 4, 4);
        }

        // 7. Bambus-Trampolin (Zum Wolkenreich)
        else if (obj === OBJECTS.TRAMPOLINE) {
          // Drop shadow
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 12, 7, 3.5, 0, 0, Math.PI * 2);
          this.ctx.fill();

          // 4 Bamboo legs
          this.ctx.strokeStyle = '#a16207';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 3, py + 6);  this.ctx.lineTo(px + 2, py + 14);
          this.ctx.moveTo(px + 13, py + 6); this.ctx.lineTo(px + 14, py + 14);
          this.ctx.stroke();

          // Bouncy coiled springs
          this.ctx.strokeStyle = '#f59e0b';
          this.ctx.lineWidth = 1.2;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 4, py + 7);  this.ctx.lineTo(px + 4, py + 11);
          this.ctx.moveTo(px + 12, py + 7); this.ctx.lineTo(px + 12, py + 11);
          this.ctx.stroke();

          // Springy Canvas Pad (Pink bouncy disc)
          const isNear = Math.hypot(this.player.x - (px + 8), this.player.y - (py + 8)) < 24;
          const bouncePulse = isNear ? Math.sin(t * 12) * 1.5 : 0;

          this.ctx.fillStyle = '#db2777'; // Dark pink frame
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 6 + bouncePulse, 7, 3.5, 0, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#f472b6'; // Vibrant pink surface
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 5.5 + bouncePulse, 5.5, 2.5, 0, 0, Math.PI * 2);
          this.ctx.fill();

          // Spiral star flower in center
          this.ctx.fillStyle = '#fef08a';
          this.ctx.fillRect(px + 7, py + 5 + bouncePulse, 2, 2);
        }

        // 8. Höhlenschlund (Cave Entrance in Hole)
        else if (obj === OBJECTS.CAVE_ENTRANCE) {
          // Deep dark cave chasm pit
          this.ctx.fillStyle = '#05070d';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 8, 7, 5, 0, 0, Math.PI * 2);
          this.ctx.fill();

          // Stone rim
          this.ctx.strokeStyle = '#334155';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 8, 7.5, 5.5, 0, 0, Math.PI * 2);
          this.ctx.stroke();

          // Swirling cave darkness smoke
          const sAngle = t * 2.5;
          const smokeX = px + 8 + Math.cos(sAngle) * 3;
          const smokeY = py + 8 + Math.sin(sAngle) * 2;
          this.ctx.fillStyle = 'rgba(71, 85, 105, 0.45)';
          this.ctx.beginPath();
          this.ctx.arc(smokeX, smokeY, 2.5, 0, Math.PI * 2);
          this.ctx.fill();
        }

        // 9. Uralter Schrein (Overworld)
        else if (obj === OBJECTS.SHRINE) {
          this.renderShrine(px, py, t, 'overworld');
        }

        // 10. Fluoreszierende Kristalle (Overworld)
        else if (obj === OBJECTS.GLOW_CRYSTAL) {
          const gTile = this.map.getGroundTile(x, y);
          let theme = 'main';
          if (gTile === TILES.SNOW) theme = 'snow';
          else if (gTile === TILES.SAND || gTile === TILES.QUICKSAND) theme = 'desert';
          else if (gTile === TILES.SWAMP_GROUND || gTile === TILES.SWAMP_WATER) theme = 'forest';
          else if (gTile === TILES.VOID_GROUND || gTile === TILES.VOID_LAKE) theme = 'void';
          this.renderGlowCrystal(px, py, t, x, y, theme);
        }

        // 11. Trainingspuppe (Straw training dummy with target cross)
        else if (obj === OBJECTS.TRAINING_DUMMY) {
          // Drop shadow
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 14, 5, 2.5, 0, 0, Math.PI * 2);
          this.ctx.fill();

          // Wooden base post
          this.ctx.fillStyle = '#78350f';
          this.ctx.fillRect(px + 7, py + 6, 2, 9);

          // Straw woven chest
          this.ctx.fillStyle = '#d97706';
          this.ctx.fillRect(px + 5, py + 4, 6, 8);

          // Cross arms
          this.ctx.fillStyle = '#92400e';
          this.ctx.fillRect(px + 2, py + 6, 12, 2.5);

          // Head sack with tie
          this.ctx.fillStyle = '#fef3c7';
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 3, 3, 0, Math.PI * 2);
          this.ctx.fill();

          // Red bullseye target cross
          this.ctx.strokeStyle = '#dc2626';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 6, py + 8); this.ctx.lineTo(px + 10, py + 8);
          this.ctx.moveTo(px + 8, py + 6); this.ctx.lineTo(px + 8, py + 10);
          this.ctx.stroke();
        }

        // 12. Moosiger Holzstamm (Fallen log)
        else if (obj === OBJECTS.FALLEN_LOG) {
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          this.ctx.fillRect(px + 1, py + 11, 14, 4);

          this.ctx.fillStyle = '#451a03';
          this.ctx.fillRect(px + 2, py + 7, 12, 6);

          this.ctx.fillStyle = '#78350f';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 2, py + 10, 2, 3, 0, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#4ade80';
          this.ctx.fillRect(px + 5, py + 6, 6, 2);
        }

        // 13. Baumstumpf (Tree trunk)
        else if (obj === OBJECTS.TREE_TRUNK) {
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 12, 6, 3, 0, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#5c2d12';
          this.ctx.fillRect(px + 4, py + 8, 8, 5);

          this.ctx.fillStyle = '#b45309';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 8, 4, 2.5, 0, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#78350f';
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 8, 1.2, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }

  renderYSortedEntities(bounds, t, night) {
    const renderList = [];

    // Player
    const playerElev = this.player.visualElevation;
    const playerSortY = this.player.y - playerElev * ELEVATION_PIXEL_OFFSET;
    renderList.push({
      sortY: playerSortY,
      isPlayer: true
    });

    // Paper Trees
    const visibleTrees = this.map.getVisibleTrees(bounds);
    for (const tree of visibleTrees) {
      const tTileX = Math.floor(tree.x / TILE_SIZE);
      const tTileY = Math.floor(tree.y / TILE_SIZE);
      const treeElev = this.map.getElevation(tTileX, tTileY);
      const treeSortY = tree.y - treeElev * ELEVATION_PIXEL_OFFSET;
      renderList.push({
        sortY: treeSortY,
        isPlayer: false,
        isTree: true,
        tree,
        treeElev
      });
    }

    // Kodama Forest Spirits
    const visibleKodamas = this.map.getVisibleKodamas(bounds);
    for (const kodama of visibleKodamas) {
      const kTileX = Math.floor(kodama.x / TILE_SIZE);
      const kTileY = Math.floor(kodama.y / TILE_SIZE);
      const kElev = this.map.getElevation(kTileX, kTileY);
      const kSortY = kodama.y - kElev * ELEVATION_PIXEL_OFFSET;
      renderList.push({
        sortY: kSortY,
        isPlayer: false,
        isKodama: true,
        kodama,
        kElev
      });
    }

    // Active Enemies (Overworld)
    if (this.enemyManager) {
      const minX = bounds.startX * TILE_SIZE - 64;
      const maxX = bounds.endX * TILE_SIZE + 64;
      const minY = bounds.startY * TILE_SIZE - 64;
      const maxY = bounds.endY * TILE_SIZE + 64;

      const activeEnemies = this.enemyManager.getActiveEnemies();
      for (const enemy of activeEnemies) {
        if (enemy.x >= minX && enemy.x <= maxX &&
            enemy.y >= minY && enemy.y <= maxY) {
          const eElev = enemy.elevation || 0;
          const eSortY = enemy.y - eElev * ELEVATION_PIXEL_OFFSET;
          renderList.push({
            sortY: eSortY,
            isPlayer: false,
            isTree: false,
            isKodama: false,
            isEnemy: true,
            enemy
          });
        }
      }
    }

    // Remote Players (LAN Multiplayer)
    if (this.remotePlayers && this.remotePlayers.size > 0) {
      const curDim = this.currentDimension || 'overworld';
      const minX = bounds.startX * TILE_SIZE - 48;
      const maxX = bounds.endX * TILE_SIZE + 48;
      const minY = bounds.startY * TILE_SIZE - 48;
      const maxY = bounds.endY * TILE_SIZE + 48;

      for (const rp of this.remotePlayers.values()) {
        if (!rp.isDead && (rp.dimension || 'overworld') === curDim) {
          if (rp.x >= minX && rp.x <= maxX && rp.y >= minY && rp.y <= maxY) {
            const rpElev = rp.visualElevation || 0;
            const rpSortY = rp.y - rpElev * ELEVATION_PIXEL_OFFSET;
            renderList.push({
              sortY: rpSortY,
              isPlayer: false,
              isRemotePlayer: true,
              remotePlayer: rp
            });
          }
        }
      }
    }

    // Sort back-to-front by visual screen Y
    renderList.sort((a, b) => a.sortY - b.sortY);

    for (const item of renderList) {
      if (item.isPlayer) {
        if (!this.isHost) {
          this.player.render(this.ctx, this.spriteManager, t, night);
        }
      } else if (item.isRemotePlayer) {
        item.remotePlayer.render(this.ctx, t, night);
      } else if (item.isTree) {
        this.renderPaperTree(item.tree, t, night, item.treeElev);
      } else if (item.isKodama) {
        this.renderKodamaSpirit(item.kodama, t, night, item.kElev);
      } else if (item.isEnemy) {
        item.enemy.render(this.ctx, t, night);
      }
    }

    // Render Collectible Loot Drops
    if (this.enemyManager) {
      this.enemyManager.renderLoot(this.ctx, t);
    }
  }

  renderPaperTree(tree, t, night, treeElev = 0) {
    const sway = Math.sin(t * 1.6 + tree.x * 0.08) * 1.8;
    const tx = tree.x;
    const ty = tree.y - treeElev * ELEVATION_PIXEL_OFFSET;

    // Paper card drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    this.ctx.beginPath();
    this.ctx.ellipse(tx, ty, 15, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Cut cardstock trunk
    this.ctx.fillStyle = '#3a2b1e';
    this.ctx.beginPath();
    this.ctx.moveTo(tx - 3, ty);
    this.ctx.lineTo(tx - 2, ty - 16);
    this.ctx.lineTo(tx + 2, ty - 16);
    this.ctx.lineTo(tx + 3, ty);
    this.ctx.closePath();
    this.ctx.fill();

    const cx = tx + sway;
    const cy = ty - 26;

    this.drawPaperTreeCrown(this.ctx, cx, cy, tree.type, 17, t, tree.hasLantern, night);
  }

  drawPaperTreeCrown(ctx, cx, cy, type, radius = 17, t = 0, hasLantern = false, night = 0) {
    const scale = radius / 17;

    // Palette per tree type
    let col1 = '#183426';
    let col2 = '#264e3a';
    let col3 = '#366d51';

    if (type === TREES.SNOWY_PINE) {
      col1 = '#475569'; col2 = '#64748b'; col3 = '#cbd5e1';
    } else if (type === TREES.SWAMP_WILLOW) {
      col1 = '#1f291e'; col2 = '#2d3d2a'; col3 = '#42573d';
    } else if (type === TREES.BLOSSOM) {
      col1 = '#831843'; col2 = '#be185d'; col3 = '#f472b6';
    } else if (type === TREES.AUTUMN) {
      col1 = '#7c2d12'; col2 = '#c2410c'; col3 = '#fb923c';
    } else if (type === TREES.BIRCH) {
      col1 = '#204428'; col2 = '#3a6e46'; col3 = '#65a773';
    }

    // Scalloped Paper Foliage Layers with Drop Shadows
    // Layer 1 (Back paper leaf with drop shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(cx + 2 * scale, cy + 3 * scale, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = col1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Layer 2 (Middle paper leaf with drop shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(cx - 3 * scale, cy - 1 * scale, 13 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 4 * scale, cy, 12 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = col2;
    ctx.beginPath();
    ctx.arc(cx - 4 * scale, cy - 2 * scale, 13 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 4 * scale, cy - 1 * scale, 12 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Layer 3 (Top paper highlight disc with fine cut edge)
    ctx.fillStyle = col3;
    ctx.beginPath();
    ctx.arc(cx - 2 * scale, cy - 6 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Papercraft center pin / brad
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(cx - 1, cy - 6 * scale, 2, 2);

    // HANGING RED/AMBER PAPER LANTERN (If this tree has a lantern)
    if (hasLantern) {
      const lSway = Math.sin(t * 3.0 + cx * 0.2) * 2;
      const lx = cx + 9 * scale + lSway;
      const ly = cy + 12 * scale;

      // Hanging wire
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 7 * scale, cy);
      ctx.lineTo(lx, ly - 6);
      ctx.stroke();

      // Red paper lantern body
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(lx - 4, ly - 6, 8, 10, 2) : ctx.rect(lx - 4, ly - 6, 8, 10);
      ctx.fill();

      // Glowing core (illuminates at night & sunset)
      if (night > 0.05 || this.gameTime >= 17) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(lx - 2, ly - 3, 4, 4);
      }

      // Black / Gold caps
      ctx.fillStyle = '#181021';
      ctx.fillRect(lx - 5, ly - 7, 10, 2);
      ctx.fillRect(lx - 5, ly + 4, 10, 2);

      // Hanging tassel
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, ly + 6);
      ctx.lineTo(lx, ly + 10);
      ctx.stroke();
    }
  }

  renderKodamaSpirit(kodama, t, night, kElev = 0) {
    const kx = kodama.x;
    // Gentle floating bob
    const ky = (kodama.y - kElev * ELEVATION_PIXEL_OFFSET) + Math.sin(t * 2.5 + kodama.floatOffset) * 3;
    const tilt = Math.sin(t * kodama.tiltSpeed + kodama.tiltOffset) * 0.25;

    this.ctx.save();
    this.ctx.translate(kx, ky);
    this.ctx.rotate(tilt);

    // Drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.beginPath();
    this.ctx.ellipse(1, 10, 4, 2, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Body
    this.ctx.fillStyle = '#f1f5f9';
    this.ctx.fillRect(-1.5, 3, 3, 6);

    // Head
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 5, 4.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 3 Dark Hollow Dots: 2 Eyes and 1 Mouth
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(-2, -1, 1, 0, Math.PI * 2);
    this.ctx.arc(2, -1, 1, 0, Math.PI * 2);
    this.ctx.arc(0, 2, 1.2, 0, Math.PI * 2);
    this.ctx.fill();

    // Ethereal cyan glow aura at night
    if (night > 0.1) {
      this.ctx.fillStyle = `rgba(94, 234, 212, ${0.25 * night})`;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  renderEnvironmentalAtmosphere(bounds, t, sunlight, night) {
    const startX = bounds.startX * TILE_SIZE;
    const endX = bounds.endX * TILE_SIZE;
    const startY = bounds.startY * TILE_SIZE;
    const endY = bounds.endY * TILE_SIZE;

    // 1. Daytime Translucent Cloud Shadows drifting lazily across the paper world
    if (sunlight > 0.1) {
      for (let c = 0; c < 4; c++) {
        const cloudX = ((c * 500 + t * 18) % (this.map.width * TILE_SIZE + 400)) - 200;
        const cloudY = 200 + c * 350;
        this.ctx.fillStyle = `rgba(30, 50, 60, ${0.08 * sunlight})`;
        this.ctx.beginPath();
        this.ctx.ellipse(cloudX, cloudY, 140, 70, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // 2. Ambient Particles (Petals, Ofuda Talismans, Fireflies)
    for (const p of this.ambientParticles) {
      if (p.x < startX || p.x > endX || p.y < startY || p.y > endY) continue;

      if (p.type === 'petal') {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, Math.sin(t + p.swayOffset), 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'ofuda' && night > 0.05) {
        // White paper talisman with red seal
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rot);
        this.ctx.fillStyle = `rgba(248, 250, 252, ${night * 0.85})`;
        this.ctx.fillRect(-3, -6, 6, 12);
        this.ctx.fillStyle = `rgba(220, 38, 38, ${night * 0.85})`;
        this.ctx.fillRect(-1.5, -3, 3, 6);
        this.ctx.restore();
      } else if (p.type === 'firefly' && night > 0.05) {
        // Golden glowing ember
        const pulse = Math.sin(t * 5 + p.swayOffset) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(251, 191, 36, ${pulse * night * 0.85})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  renderForestCanopy(bounds, t) {
    if (!this.canopyCanvas || !this.canopyCtx) return;

    const crowns = this.map.getVisibleCanopyCrowns(bounds);
    if (crowns.length === 0) return;

    const cCanvas = this.canopyCanvas;
    const cCtx = this.canopyCtx;

    // Offscreen Canvas leeren
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);

    // Exakte Kamera-Transformation anwenden
    this.camera.apply(cCtx);

    const { night } = this.getDayNightFactors();

    // GROSSE BAUMKRONEN RENDERN (Genau dieselben wie die großen Bäume, > 1 Tile groß!)
    for (const crown of crowns) {
      const cTileX = Math.floor(crown.x / TILE_SIZE);
      const cTileY = Math.floor(crown.y / TILE_SIZE);
      const cElev = this.map.getElevation(cTileX, cTileY);

      const sway = Math.sin(t * 1.6 + crown.x * 0.08) * 1.8;
      const cx = crown.x + sway;
      const cy = crown.y - cElev * ELEVATION_PIXEL_OFFSET;

      this.drawPaperTreeCrown(cCtx, cx, cy, crown.type, crown.radius, t, crown.hasLantern, night);
    }

    // SICHTKREIS-CUTOUT UM DIE SPIELFIGUR ("nur um mich herum was sehe")
    cCtx.save();
    cCtx.globalCompositeOperation = 'destination-out';

    const plx = this.player.x;
    const ply = this.player.y - Math.round(this.player.visualElevation * ELEVATION_PIXEL_OFFSET);
    const radius = PLAYER_CONFIG.CANOPY_REVEAL_RADIUS || 54;

    // Runder, weich gefederter Ausstanz-Gradient
    const revealGrad = cCtx.createRadialGradient(plx, ply, radius * 0.5, plx, ply, radius);
    revealGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    revealGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.95)');
    revealGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    cCtx.fillStyle = revealGrad;
    cCtx.beginPath();
    cCtx.arc(plx, ply, radius, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.restore();

    this.camera.release(cCtx);

    // Blätterschicht auf den Hauptcanvas übertragen
    this.camera.release(this.ctx);
    this.ctx.drawImage(cCanvas, 0, 0);
    this.camera.apply(this.ctx);

    // Weicher Blätterdach-Schattenring am Boden entlang der Schnittkante
    const shadowGrad = this.ctx.createRadialGradient(plx, ply, radius * 0.65, plx, ply, radius * 1.15);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(0.75, 'rgba(10, 24, 16, 0.38)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = shadowGrad;
    this.ctx.beginPath();
    this.ctx.arc(plx, ply, radius * 1.15, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderGlobalLightingWash(sunlight, sunset, night) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Sunset Golden Wash
    if (sunset > 0.02) {
      this.ctx.fillStyle = `rgba(251, 146, 60, ${sunset * 0.16})`;
      this.ctx.fillRect(0, 0, w, h);
    }

    // Deep Mononoke Night Indigo Wash (max 0.38 alpha for clear visibility at night)
    if (night > 0.02) {
      const nightAlpha = Math.min(0.38, Math.max(0, night) * 0.38);
      this.ctx.fillStyle = `rgba(18, 24, 48, ${nightAlpha})`;
      this.ctx.fillRect(0, 0, w, h);
    }

    // Atmosphärischer Waldschatten, wenn der Spieler sich unter dem Blätterdach befindet
    const pTileX = Math.floor(this.player.x / TILE_SIZE);
    const pTileY = Math.floor(this.player.y / TILE_SIZE);
    if (this.map.getCanopyTile(pTileX, pTileY) === CANOPY.TREE_CROWN) {
      this.ctx.fillStyle = 'rgba(7, 20, 14, 0.26)';
      this.ctx.fillRect(0, 0, w, h);
    }

    // Vignette for cinematic framing
    const vig = this.ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.75);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    this.ctx.fillStyle = vig;
    this.ctx.fillRect(0, 0, w, h);
  }

  // ==========================================================================
  // CLOUD WORLD RENDERING (Rosa Wolken, Regenbogenbrücken & Schreine)
  // ==========================================================================
  renderCloudDimension(bounds, t) {
    // 1. Ethereal pastel twilight sky gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGrad.addColorStop(0, '#2b1b44');
    skyGrad.addColorStop(0.5, '#4a2559');
    skyGrad.addColorStop(1, '#6b2d5c');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Camera Transform
    this.camera.apply(this.ctx);

    const ts = TILE_SIZE;
    const startY = Math.max(0, bounds.startY - 2);
    const endY = Math.min(this.map.height, bounds.endY + 2);
    const startX = Math.max(0, bounds.startX - 2);
    const endX = Math.min(this.map.width, bounds.endX + 2);

    // PASS 1: Pink Clouds & Rainbow Bridges
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.map.getGroundTile(x, y);
        const px = x * ts;
        const py = y * ts;

        if (tile === TILES.CLOUD_PINK) {
          // Cloud drop shadow
          this.ctx.fillStyle = 'rgba(23, 10, 36, 0.45)';
          this.ctx.fillRect(px, py + 4, ts, ts);

          // Base cloud cardstock (lush rose)
          this.ctx.fillStyle = '#f472b6';
          this.ctx.fillRect(px, py, ts, ts);

          // Lighter soft pink top layer
          this.ctx.fillStyle = '#fbcfe8';
          this.ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);

          // Fluffy cloud paper arcs & puffs
          this.ctx.fillStyle = '#ffffff';
          const puffAngle = (x * 17 + y * 23) % 4;
          if (puffAngle === 0) {
            this.ctx.fillRect(px + 3, py + 3, 4, 3);
          } else if (puffAngle === 1) {
            this.ctx.fillRect(px + 8, py + 4, 5, 2.5);
          }

          // Scalloped cloud edge highlight if neighbor is sky abyss
          const nN = (y - 1 >= 0) ? this.map.getGroundTile(x, y - 1) : TILES.CLOUD_PINK;
          const nS = (y + 1 < this.map.height) ? this.map.getGroundTile(x, y + 1) : TILES.CLOUD_PINK;
          const nW = (x - 1 >= 0) ? this.map.getGroundTile(x - 1, y) : TILES.CLOUD_PINK;
          const nE = (x + 1 < this.map.width) ? this.map.getGroundTile(x + 1, y) : TILES.CLOUD_PINK;

          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          if (nN === TILES.SKY_ABYSS) {
            this.ctx.fillRect(px, py, ts, 2);
          }
          if (nS === TILES.SKY_ABYSS) {
            this.ctx.fillRect(px, py + ts - 2, ts, 2);
          }
          if (nW === TILES.SKY_ABYSS) {
            this.ctx.fillRect(px, py, 2, ts);
          }
          if (nE === TILES.SKY_ABYSS) {
            this.ctx.fillRect(px + ts - 2, py, 2, ts);
          }
        }
        else if (tile === TILES.RAINBOW_BRIDGE_H || tile === TILES.RAINBOW_BRIDGE_V) {
          this.renderRainbowBridgeTile(px, py, tile === TILES.RAINBOW_BRIDGE_H, t, x, y);
        }
        else if (tile === TILES.SKY_ABYSS) {
          // Twinkling stars in the sky abyss
          if ((x * 19 + y * 31) % 13 === 0) {
            const starTwinkle = Math.sin(t * 3.5 + x + y) * 0.3 + 0.7;
            this.ctx.fillStyle = `rgba(254, 240, 138, ${starTwinkle * 0.75})`;
            this.ctx.fillRect(px + 7, py + 7, 2, 2);
          }
        }
      }
    }

    // PASS 2: Objects / Shrines in Cloud World
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const obj = this.map.getObjectTile(x, y);
        if (obj === OBJECTS.SHRINE) {
          this.renderShrine(x * ts, y * ts, t, 'cloud');
        }
      }
    }

    // PASS 3: Cloud Enemies & Player
    if (this.enemyManager) {
      const minX = bounds.startX * TILE_SIZE - 64;
      const maxX = bounds.endX * TILE_SIZE + 64;
      const minY = bounds.startY * TILE_SIZE - 64;
      const maxY = bounds.endY * TILE_SIZE + 64;

      const cloudEnemies = this.enemyManager.getActiveEnemies();
      for (const enemy of cloudEnemies) {
        if (enemy.x >= minX && enemy.x <= maxX &&
            enemy.y >= minY && enemy.y <= maxY) {
          enemy.render(this.ctx, t, 0.4);
        }
      }
      this.enemyManager.renderLoot(this.ctx, t);
    }

    if (!this.isHost) {
      this.player.render(this.ctx, this.spriteManager, t, 0.4);
    }
    if (this.remotePlayers) {
      for (const rp of this.remotePlayers.values()) {
        if (!rp.isDead && rp.dimension === DIMENSIONS.CLOUDS) {
          rp.render(this.ctx, t, 0.4);
        }
      }
    }

    // Combat layer: flying arrows, slashes, hit effects, floating texts
    if (this.combat) {
      this.combat.render(this.ctx, bounds, t);
    }

    // PASS 4: Ambient floating cotton cloud puffs & rainbow sparkle particles
    this.renderCloudAtmosphere(bounds, t);

    this.camera.release(this.ctx);

    // Cinematic soft cloud vignette
    const vig = this.ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.4, this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.8);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(35, 10, 45, 0.4)');
    this.ctx.fillStyle = vig;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderRainbowBridgeTile(px, py, isHorizontal, t, tx, ty) {
    const ts = TILE_SIZE;
    const rainbowColors = [
      '#f43f5e', // Rosa-Rot
      '#fb923c', // Orange
      '#facc15', // Goldgelb
      '#4ade80', // Smaragdgrün
      '#38bdf8', // Himmelblau
      '#c084fc'  // Flieder
    ];

    // Drop shadow
    this.ctx.fillStyle = 'rgba(23, 10, 36, 0.35)';
    this.ctx.fillRect(px, py + 4, ts, ts);

    // Glowing bridge aura
    const pulse = Math.sin(t * 4 + (tx + ty) * 0.5) * 0.15 + 0.85;
    this.ctx.fillStyle = `rgba(254, 240, 138, ${0.25 * pulse})`;
    this.ctx.fillRect(px - 1, py - 1, ts + 2, ts + 2);

    const stripeW = isHorizontal ? ts : (ts / rainbowColors.length);
    const stripeH = isHorizontal ? (ts / rainbowColors.length) : ts;

    for (let i = 0; i < rainbowColors.length; i++) {
      this.ctx.fillStyle = rainbowColors[i];
      if (isHorizontal) {
        this.ctx.fillRect(px, py + i * stripeH, stripeW, stripeH);
      } else {
        this.ctx.fillRect(px + i * stripeW, py, stripeW, stripeH);
      }
    }

    // Shimmering white light sheen moving across bridge
    const sheenPos = ((t * 30 + tx * 8 + ty * 8) % 40) - 20;
    if (Math.abs(sheenPos) < 10) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * (1 - Math.abs(sheenPos) / 10)})`;
      this.ctx.fillRect(px, py, ts, ts);
    }
  }

  renderCloudAtmosphere(bounds, t) {
    // Drifting pastel cloud puffs
    for (let i = 0; i < 18; i++) {
      const px = ((i * 137 + t * 25) % (this.map.width * TILE_SIZE));
      const py = ((i * 193 + Math.sin(t + i) * 20) % (this.map.height * TILE_SIZE));

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      this.ctx.beginPath();
      this.ctx.arc(px, py, 6 + (i % 4) * 3, 0, Math.PI * 2);
      this.ctx.fill();

      // Rainbow star sparkle
      if (i % 3 === 0) {
        const starGlow = Math.sin(t * 5 + i) * 0.4 + 0.6;
        this.ctx.fillStyle = `rgba(254, 240, 138, ${starGlow * 0.7})`;
        this.ctx.fillRect(px + 4, py - 4, 2, 2);
      }
    }
  }

  // ==========================================================================
  // CAVE WORLD RENDERING (Tiefenhöhlen, Unterirdischer See & Biome-Themen)
  // ==========================================================================
  renderCaveDimension(bounds, t) {
    // 1. Deep Cavern Black Base
    this.ctx.fillStyle = '#060810';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Camera Transform
    this.camera.apply(this.ctx);

    const ts = TILE_SIZE;
    const startY = Math.max(0, bounds.startY - 2);
    const endY = Math.min(this.map.height, bounds.endY + 2);
    const startX = Math.max(0, bounds.startX - 2);
    const endX = Math.min(this.map.width, bounds.endX + 2);

    // PASS 1: Ground Tiles (Biome-spezifische Felswände, Böden, Seen, Leitern)
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.map.getGroundTile(x, y);
        const px = x * ts;
        const py = y * ts;
        const theme = this.map.getTheme ? this.map.getTheme(x, y) : 'main';

        if (tile === TILES.CAVE_WALL) {
          if (theme === 'snow') {
            // Glaziale Eiswand
            this.ctx.fillStyle = '#0c4a6e';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 3);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#075985';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
            if ((x * 13 + y * 19) % 2 === 0) {
              this.ctx.fillStyle = '#bae6fd';
              this.ctx.beginPath();
              this.ctx.moveTo(px + 4, py + ts);
              this.ctx.lineTo(px + 7, py + ts + 3);
              this.ctx.lineTo(px + 10, py + ts);
              this.ctx.fill();
            }
          } else if (theme === 'void') {
            // Abyssisches Obsidian-Gestein
            this.ctx.fillStyle = '#150524';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#a855f7';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 2.5);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#2a0845';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
            if ((x * 31 + y * 47) % 5 === 0) {
              const rGlow = Math.sin(t * 3 + x + y) * 0.3 + 0.7;
              this.ctx.fillStyle = `rgba(232, 121, 249, ${rGlow * 0.8})`;
              this.ctx.fillRect(px + 6, py + 6, 3, 3);
            }
          } else if (theme === 'forest') {
            // Moosige Waldgesteinswand
            this.ctx.fillStyle = '#14381a';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#22c55e';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 3);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#0f2813';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
            if ((x * 19 + y * 37) % 3 === 0) {
              this.ctx.strokeStyle = '#78350f';
              this.ctx.lineWidth = 1.2;
              this.ctx.beginPath();
              this.ctx.moveTo(px + 5, py + 4);
              this.ctx.lineTo(px + 4, py + 12);
              this.ctx.stroke();
            }
          } else if (theme === 'desert') {
            // Antiker Sandstein
            this.ctx.fillStyle = '#78350f';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#f59e0b';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 3);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#5c2406';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            this.ctx.fillRect(px + 2, py + 6, ts - 4, 1.2);
            this.ctx.fillRect(px + 2, py + 10, ts - 4, 1.2);
          } else if (theme === 'swamp') {
            // Sumpf-Mergelstein
            this.ctx.fillStyle = '#1c2818';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#84cc16';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 3);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#111a0e';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
          } else if (theme === 'crystal') {
            // Amethyst-Kristallwand
            this.ctx.fillStyle = '#1e1b4b';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#818cf8';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 3);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#312e81';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
          } else {
            // Schieferwand
            this.ctx.fillStyle = '#0f172a';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 3);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#090d16';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
          }
        }
        else if (tile === TILES.CAVE_FLOOR) {
          if (theme === 'snow') {
            this.ctx.fillStyle = '#155e75';
            this.ctx.fillRect(px, py, ts, ts);
            if ((x * 23 + y * 41) % 4 === 0) {
              this.ctx.fillStyle = '#67e8f9';
              this.ctx.fillRect(px + 4, py + 7, 3, 1.5);
            } else if ((x * 19 + y * 31) % 6 === 0) {
              this.ctx.fillStyle = '#e0f2fe';
              this.ctx.fillRect(px + 8, py + 4, 1.5, 1.5);
            }
          } else if (theme === 'void') {
            this.ctx.fillStyle = '#12071f';
            this.ctx.fillRect(px, py, ts, ts);
            if ((x * 23 + y * 41) % 4 === 0) {
              this.ctx.fillStyle = '#7e22ce';
              this.ctx.fillRect(px + 4, py + 6, 4, 1.5);
            } else if ((x * 19 + y * 31) % 5 === 0) {
              this.ctx.fillStyle = '#c084fc';
              this.ctx.fillRect(px + 9, py + 3, 2, 1.5);
            }
          } else if (theme === 'forest') {
            this.ctx.fillStyle = '#0f2e15';
            this.ctx.fillRect(px, py, ts, ts);
            if ((x * 23 + y * 41) % 4 === 0) {
              this.ctx.fillStyle = '#16a34a';
              this.ctx.fillRect(px + 4, py + 6, 3, 2);
            } else if ((x * 19 + y * 31) % 5 === 0) {
              this.ctx.fillStyle = '#4ade80';
              this.ctx.fillRect(px + 8, py + 4, 1.5, 1.5);
            }
          } else if (theme === 'desert') {
            this.ctx.fillStyle = '#451a03';
            this.ctx.fillRect(px, py, ts, ts);
            if ((x * 23 + y * 41) % 4 === 0) {
              this.ctx.fillStyle = '#d97706';
              this.ctx.fillRect(px + 4, py + 7, 4, 1.5);
            } else if ((x * 19 + y * 31) % 5 === 0) {
              this.ctx.fillStyle = '#f59e0b';
              this.ctx.fillRect(px + 9, py + 3, 2, 1.5);
            }
          } else if (theme === 'swamp') {
            this.ctx.fillStyle = '#141f13';
            this.ctx.fillRect(px, py, ts, ts);
            if ((x * 23 + y * 41) % 4 === 0) {
              this.ctx.fillStyle = '#3f6212';
              this.ctx.fillRect(px + 4, py + 7, 3, 2);
            }
          } else {
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(px, py, ts, ts);
            if ((x * 23 + y * 41) % 5 === 0) {
              this.ctx.fillStyle = '#334155';
              this.ctx.fillRect(px + 4, py + 7, 3, 1.5);
            } else if ((x * 19 + y * 31) % 7 === 0) {
              this.ctx.fillStyle = '#0f172a';
              this.ctx.fillRect(px + 9, py + 3, 2, 2);
            }
          }
        }
        else if (tile === TILES.CAVE_WATER) {
          let waterBase = '#07253b';
          let waveCol1 = '#0ea5e9';
          let waveCol2 = '#0369a1';
          let sparkCol = 'rgba(45, 212, 191, ';

          if (theme === 'snow') {
            waterBase = '#0e7490';
            waveCol1 = '#67e8f9';
            waveCol2 = '#0891b2';
            sparkCol = 'rgba(224, 242, 254, ';
          } else if (theme === 'void') {
            waterBase = '#2e1065';
            waveCol1 = '#a855f7';
            waveCol2 = '#581c87';
            sparkCol = 'rgba(240, 171, 252, ';
          } else if (theme === 'swamp') {
            waterBase = '#064e3b';
            waveCol1 = '#10b981';
            waveCol2 = '#047857';
            sparkCol = 'rgba(163, 230, 53, ';
          }

          this.ctx.fillStyle = waterBase;
          this.ctx.fillRect(px, py, ts, ts);

          const wave = Math.sin(t * 2.5 + x * 0.8 + y * 0.6);
          if (wave > 0.3) {
            this.ctx.fillStyle = waveCol1;
            this.ctx.fillRect(px + 2, py + 5, 12, 1.8);
          } else if (wave < -0.3) {
            this.ctx.fillStyle = waveCol2;
            this.ctx.fillRect(px + 3, py + 10, 10, 1.8);
          }

          if ((x * 37 + y * 59) % 6 === 0) {
            const glow = Math.sin(t * 3.5 + x + y) * 0.3 + 0.7;
            this.ctx.fillStyle = `${sparkCol}${glow * 0.85})`;
            this.ctx.fillRect(px + 6, py + 6, 2, 2);
          }
        }
        else if (tile === TILES.CAVE_HOLE_EXIT) {
          // Shaft of golden sunlight from the hole above!
          this.ctx.fillStyle = '#451a03';
          this.ctx.fillRect(px, py, ts, ts);

          const pulse = Math.sin(t * 3) * 0.15 + 0.85;
          this.ctx.fillStyle = `rgba(254, 240, 138, ${0.4 * pulse})`;
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 8, 9, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#fef08a';
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 8, 4, 0, Math.PI * 2);
          this.ctx.fill();

          // Wooden rope ladder dangling down
          this.ctx.strokeStyle = '#92400e';
          this.ctx.lineWidth = 1.2;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 4, py);
          this.ctx.lineTo(px + 4, py + ts);
          this.ctx.moveTo(px + 12, py);
          this.ctx.lineTo(px + 12, py + ts);
          this.ctx.moveTo(px + 4, py + 4);
          this.ctx.lineTo(px + 12, py + 4);
          this.ctx.moveTo(px + 4, py + 11);
          this.ctx.lineTo(px + 12, py + 11);
          this.ctx.stroke();
        }
        else if (tile === TILES.CAVE_LADDER_DOWN || tile === TILES.CAVE_LADDER_UP) {
          // Shaft hole with ladder
          this.ctx.fillStyle = '#090d16';
          this.ctx.fillRect(px + 2, py + 2, 12, 12);

          this.ctx.strokeStyle = '#cbd5e1';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 4, py);
          this.ctx.lineTo(px + 4, py + ts);
          this.ctx.moveTo(px + 12, py);
          this.ctx.lineTo(px + 12, py + ts);
          this.ctx.moveTo(px + 4, py + 4);
          this.ctx.lineTo(px + 12, py + 4);
          this.ctx.moveTo(px + 4, py + 8);
          this.ctx.lineTo(px + 12, py + 8);
          this.ctx.moveTo(px + 4, py + 12);
          this.ctx.lineTo(px + 12, py + 12);
          this.ctx.stroke();
        }
      }
    }

    // PASS 1b: Cave Light Cones (Warm ground illumination from Player Lantern, Torches, Sunlight Shafts, Shrines)
    this.renderCaveLightCones(bounds, t);

    // PASS 2: Objects in Cave (Stalagmites, Glow Crystals, Mushrooms, Shrines, Torches)
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const obj = this.map.getObjectTile(x, y);
        const px = x * ts;
        const py = y * ts;
        const theme = this.map.getTheme ? this.map.getTheme(x, y) : 'main';

        if (obj === OBJECTS.STALAGMITE || obj === OBJECTS.ROCK_ICE || obj === OBJECTS.ROCK_VOID) {
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          this.ctx.fillRect(px + 3, py + 12, 10, 3);

          let mainCol = '#334155';
          let lightCol = '#475569';
          if (theme === 'snow' || obj === OBJECTS.ROCK_ICE) {
            mainCol = '#0284c7';
            lightCol = '#7dd3fc';
          } else if (theme === 'void' || obj === OBJECTS.ROCK_VOID) {
            mainCol = '#581c87';
            lightCol = '#c084fc';
          } else if (theme === 'desert') {
            mainCol = '#9a3412';
            lightCol = '#f59e0b';
          } else if (theme === 'forest') {
            mainCol = '#166534';
            lightCol = '#4ade80';
          }

          this.ctx.fillStyle = mainCol;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 2, py + 14);
          this.ctx.lineTo(px + 8, py + 2);
          this.ctx.lineTo(px + 14, py + 14);
          this.ctx.closePath();
          this.ctx.fill();

          this.ctx.fillStyle = lightCol;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 8, py + 2);
          this.ctx.lineTo(px + 14, py + 14);
          this.ctx.lineTo(px + 8, py + 14);
          this.ctx.closePath();
          this.ctx.fill();
        }
        else if (obj === OBJECTS.GLOW_CRYSTAL) {
          this.renderGlowCrystal(px, py, t, x, y, theme);
        }
        else if (obj === OBJECTS.CAVE_MUSHROOM_GLOW) {
          this.renderCaveMushroom(px, py, t, x, y, theme);
        }
        else if (obj === OBJECTS.SHRINE) {
          this.renderShrine(px, py, t, 'cave');
        }
        else if (obj === OBJECTS.TORCH) {
          this.renderCaveTorch(px, py, t, x, y, theme);
        }
      }
    }

    // PASS 3: Cave Enemies & Player
    if (this.enemyManager) {
      const minX = bounds.startX * TILE_SIZE - 64;
      const maxX = bounds.endX * TILE_SIZE + 64;
      const minY = bounds.startY * TILE_SIZE - 64;
      const maxY = bounds.endY * TILE_SIZE + 64;

      const caveEnemies = this.enemyManager.getActiveEnemies();
      for (const enemy of caveEnemies) {
        if (enemy.x >= minX && enemy.x <= maxX &&
            enemy.y >= minY && enemy.y <= maxY) {
          enemy.render(this.ctx, t, 1.0);
        }
      }
      this.enemyManager.renderLoot(this.ctx, t);
    }

    if (!this.isHost) {
      this.player.render(this.ctx, this.spriteManager, t, 1.0);
    }
    if (this.remotePlayers) {
      for (const rp of this.remotePlayers.values()) {
        if (!rp.isDead && rp.dimension === DIMENSIONS.CAVES) {
          rp.render(this.ctx, t, 1.0);
        }
      }
    }

    // Combat layer: flying arrows, slashes, hit effects, floating texts
    if (this.combat) {
      this.combat.render(this.ctx, bounds, t);
    }

    // PASS 4: Ambient Atmosphere (Biome-spezifische Effekte)
    this.renderCaveAtmosphere(bounds, t);

    this.camera.release(this.ctx);

    // PASS 5: Dynamic Cavern Darkness Mask with Lantern & Crystal Light Holes
    this.renderCaveDarkness(bounds, t);
  }

  renderGlowCrystal(px, py, t, tx, ty, theme = 'main') {
    let baseCol = '#38bdf8';
    let lightCol = '#e0f2fe';

    if (theme === 'snow') {
      baseCol = '#38bdf8';
      lightCol = '#f0fdfa';
    } else if (theme === 'void') {
      baseCol = '#a855f7';
      lightCol = '#f5d0fe';
    } else if (theme === 'desert') {
      baseCol = '#f59e0b';
      lightCol = '#fef08a';
    } else if (theme === 'forest') {
      baseCol = '#10b981';
      lightCol = '#a7f3d0';
    } else {
      const isPurple = (tx + ty) % 2 === 0;
      baseCol = isPurple ? '#c084fc' : '#38bdf8';
      lightCol = isPurple ? '#f3e8ff' : '#e0f2fe';
    }

    const pulse = Math.sin(t * 3.5 + tx + ty) * 0.2 + 0.8;

    // Glowing aura
    this.ctx.save();
    this.ctx.fillStyle = baseCol;
    this.ctx.globalAlpha = 0.35 * pulse;
    this.ctx.beginPath();
    this.ctx.arc(px + 8, py + 8, 9, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Central crystal spike
    this.ctx.fillStyle = baseCol;
    this.ctx.beginPath();
    this.ctx.moveTo(px + 8, py + 1);
    this.ctx.lineTo(px + 12, py + 13);
    this.ctx.lineTo(px + 4, py + 13);
    this.ctx.closePath();
    this.ctx.fill();

    // Gleaming facet
    this.ctx.fillStyle = lightCol;
    this.ctx.beginPath();
    this.ctx.moveTo(px + 8, py + 1);
    this.ctx.lineTo(px + 8, py + 13);
    this.ctx.lineTo(px + 5, py + 13);
    this.ctx.closePath();
    this.ctx.fill();
  }

  renderCaveMushroom(px, py, t, tx, ty, theme = 'main') {
    let capCol = '#2dd4bf';
    let capLight = '#99f6e4';
    if (theme === 'swamp') {
      capCol = '#84cc16';
      capLight = '#bef264';
    } else if (theme === 'void') {
      capCol = '#c084fc';
      capLight = '#f5d0fe';
    }

    const pulse = Math.sin(t * 3.0 + tx * 3 + ty * 5) * 0.2 + 0.8;
    this.ctx.save();
    this.ctx.fillStyle = capCol;
    this.ctx.globalAlpha = 0.28 * pulse;
    this.ctx.beginPath();
    this.ctx.arc(px + 8, py + 8, 7, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Stem
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.fillRect(px + 7, py + 8, 2, 5);

    // Glowing Cap
    this.ctx.fillStyle = capCol;
    this.ctx.beginPath();
    this.ctx.arc(px + 8, py + 7, 4, Math.PI, 0);
    this.ctx.fill();

    this.ctx.fillStyle = capLight;
    this.ctx.fillRect(px + 7, py + 6, 2, 1.5);
  }

  renderCaveAtmosphere(bounds, t) {
    const centerTheme = this.map.getTheme ? this.map.getTheme(Math.floor(this.player.x / TILE_SIZE), Math.floor(this.player.y / TILE_SIZE)) : 'main';

    if (centerTheme === 'snow') {
      // Schnee- & Eisflocken in Eishöhlen
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 89 + Math.sin(t * 1.5 + i) * 15) % (this.map.width * TILE_SIZE));
        const sy = ((i * 127 + t * 25) % (this.map.height * TILE_SIZE));
        this.ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
        this.ctx.fillRect(sx, sy, 2, 2);
      }
    } else if (centerTheme === 'void') {
      // Aufsteigende Astral-Seelenfunken in Leerenhöhlen
      for (let i = 0; i < 20; i++) {
        const vx = ((i * 101 + Math.cos(t * 2 + i) * 18) % (this.map.width * TILE_SIZE));
        const vy = ((i * 139 - t * 30) % (this.map.height * TILE_SIZE) + (this.map.height * TILE_SIZE)) % (this.map.height * TILE_SIZE);
        this.ctx.fillStyle = 'rgba(216, 180, 254, 0.75)';
        this.ctx.fillRect(vx, vy, 2, 2);
      }
    } else if (centerTheme === 'forest') {
      // Schwebende Moos- & Waldsporen
      for (let i = 0; i < 18; i++) {
        const fx = ((i * 79 + Math.sin(t * 2 + i) * 14) % (this.map.width * TILE_SIZE));
        const fy = ((i * 113 + Math.cos(t * 1.5 + i) * 14) % (this.map.height * TILE_SIZE));
        const pulse = Math.sin(t * 3 + i) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(74, 222, 128, ${pulse * 0.7})`;
        this.ctx.fillRect(fx, fy, 2, 2);
      }
    } else {
      // Höhlenwassertropfen von der Decke
      for (let i = 0; i < 15; i++) {
        const dropX = ((i * 73 + t * 4) % (this.map.width * TILE_SIZE));
        const dropY = ((i * 109 + t * 65) % (this.map.height * TILE_SIZE));
        this.ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
        this.ctx.fillRect(dropX, dropY, 1.5, 3);
      }
    }
  }

  renderCaveTorch(px, py, t, tx, ty, theme = 'main') {
    const seed = (tx * 17 + ty * 29);
    const fBob = Math.sin(t * 16 + seed) * 1.2;
    const fSway = Math.cos(t * 12 + seed) * 0.8;

    // 1. Paper card drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.beginPath();
    this.ctx.ellipse(px + 8, py + 14, 5, 2.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Stone / Wooden stand base
    this.ctx.fillStyle = theme === 'snow' ? '#1e293b' : '#334155';
    this.ctx.fillRect(px + 5.5, py + 12, 5, 2.5);

    // 3. Wooden post
    this.ctx.fillStyle = '#78350f';
    this.ctx.fillRect(px + 7, py + 5, 2, 8);

    // 4. Metal bracket / sconce ring
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillRect(px + 5.5, py + 4.5, 5, 2);

    // 5. Flickering Torch Flame
    const tipX = px + 8 + fSway;
    const tipY = py - 2 + fBob;

    // Outer fiery orange-red flame
    this.ctx.fillStyle = '#ea580c';
    this.ctx.beginPath();
    this.ctx.moveTo(px + 5, py + 5);
    this.ctx.quadraticCurveTo(px + 4, py + 1, tipX, tipY);
    this.ctx.quadraticCurveTo(px + 12, py + 1, px + 11, py + 5);
    this.ctx.closePath();
    this.ctx.fill();

    // Inner bright yellow flame
    this.ctx.fillStyle = '#fef08a';
    this.ctx.beginPath();
    this.ctx.moveTo(px + 6.5, py + 5);
    this.ctx.quadraticCurveTo(px + 6, py + 2.5, tipX, tipY + 2);
    this.ctx.quadraticCurveTo(px + 9.5, py + 2.5, px + 9.5, py + 5);
    this.ctx.closePath();
    this.ctx.fill();

    // White-hot center spark
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(px + 7, py + 3.5, 2, 2);

    // Rising ember sparks
    const sparkProg = ((t * 22 + seed) % 20);
    const sparkY = py - sparkProg;
    const sparkX = px + 8 + Math.sin(t * 4 + sparkY) * 3;
    const sparkAlpha = Math.max(0, 1.0 - sparkProg / 20);
    this.ctx.fillStyle = `rgba(254, 215, 170, ${sparkAlpha * 0.85})`;
    this.ctx.fillRect(sparkX, sparkY, 1.5, 1.5);
  }

  renderCaveLightCones(bounds, t) {
    const { startX, endX, startY, endY } = bounds;

    // 1. Warm Player Lantern Fire Cone
    const elevY = Math.round(this.player.visualElevation * ELEVATION_PIXEL_OFFSET);
    const plx = this.player.x + 6;
    const ply = this.player.y - 8 - elevY;
    const pPulse = Math.sin(t * 9) * 3;
    const pRadius = 94 + pPulse;

    const pGrad = this.ctx.createRadialGradient(plx, ply, 6, plx, ply, pRadius);
    pGrad.addColorStop(0, 'rgba(254, 240, 138, 0.48)');
    pGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.24)');
    pGrad.addColorStop(0.75, 'rgba(251, 146, 60, 0.08)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = pGrad;
    this.ctx.beginPath();
    this.ctx.arc(plx, ply, pRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Torches Light Cones
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const obj = this.map.getObjectTile(x, y);
        if (obj === OBJECTS.TORCH) {
          const tx = x * TILE_SIZE + 8;
          const ty = y * TILE_SIZE + 5;
          const fPulse = Math.sin(t * 14 + x * 7 + y * 13) * 3;
          const tRadius = 76 + fPulse;

          const tGrad = this.ctx.createRadialGradient(tx, ty, 4, tx, ty, tRadius);
          tGrad.addColorStop(0, 'rgba(254, 240, 138, 0.46)');
          tGrad.addColorStop(0.42, 'rgba(249, 115, 22, 0.22)');
          tGrad.addColorStop(0.8, 'rgba(234, 88, 12, 0.07)');
          tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          this.ctx.fillStyle = tGrad;
          this.ctx.beginPath();
          this.ctx.arc(tx, ty, tRadius, 0, Math.PI * 2);
          this.ctx.fill();
        }
        else if (obj === OBJECTS.SHRINE) {
          const sx = x * TILE_SIZE + 8;
          const sy = y * TILE_SIZE + 8;
          const sGrad = this.ctx.createRadialGradient(sx, sy, 8, sx, sy, 65);
          sGrad.addColorStop(0, 'rgba(254, 240, 138, 0.38)');
          sGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.16)');
          sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          this.ctx.fillStyle = sGrad;
          this.ctx.beginPath();
          this.ctx.arc(sx, sy, 65, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    // 3. Sunlight Shafts from Cave Hole Exits
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (this.map.getGroundTile(x, y) === TILES.CAVE_HOLE_EXIT) {
          const hx = x * TILE_SIZE + 8;
          const hy = y * TILE_SIZE + 8;
          const hGrad = this.ctx.createRadialGradient(hx, hy, 6, hx, hy, 58);
          hGrad.addColorStop(0, 'rgba(254, 240, 138, 0.52)');
          hGrad.addColorStop(0.45, 'rgba(250, 204, 21, 0.2)');
          hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          this.ctx.fillStyle = hGrad;
          this.ctx.beginPath();
          this.ctx.arc(hx, hy, 58, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }

  renderCaveDarkness(bounds, t) {
    // Fallback if no offscreen canvas available
    if (!this.canopyCanvas || !this.canopyCtx) {
      const elevY = Math.round(this.player.visualElevation * ELEVATION_PIXEL_OFFSET);
      const screenX = Math.round((this.player.x - this.camera.x) * this.camera.zoom);
      const screenY = Math.round((this.player.y - elevY - this.camera.y) * this.camera.zoom);
      const grad = this.ctx.createRadialGradient(screenX, screenY, 40, screenX, screenY, 280);
      grad.addColorStop(0, 'rgba(6, 8, 16, 0.05)');
      grad.addColorStop(0.5, 'rgba(6, 8, 16, 0.55)');
      grad.addColorStop(1, 'rgba(6, 8, 16, 0.95)');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    const cCanvas = this.canopyCanvas;
    const cCtx = this.canopyCtx;

    // 1. Offscreen Canvas leeren
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);

    // 2. Volle Höhlen-Dunkelheit zeichnen
    cCtx.fillStyle = 'rgba(5, 7, 15, 0.94)';
    cCtx.fillRect(0, 0, cCanvas.width, cCanvas.height);

    // 3. Kamera-Transformation für exakte Weltkoordinaten anwenden
    this.camera.apply(cCtx);

    // 4. Ausstanzung via destination-out (Licht-Löcher im Dunkelheits-Schleier)
    cCtx.save();
    cCtx.globalCompositeOperation = 'destination-out';

    // 4a. Spieler-Höhlenlampe (Großer, sanft ausblendender Lichtkreis)
    const elevY = Math.round(this.player.visualElevation * ELEVATION_PIXEL_OFFSET);
    const plx = this.player.x + 6;
    const ply = this.player.y - 8 - elevY;
    const pRadius = 92 + Math.sin(t * 11) * 3;

    const pGrad = cCtx.createRadialGradient(plx, ply, 14, plx, ply, pRadius);
    pGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    pGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.88)');
    pGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.4)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    cCtx.fillStyle = pGrad;
    cCtx.beginPath();
    cCtx.arc(plx, ply, pRadius, 0, Math.PI * 2);
    cCtx.fill();

    // 4b. Fackeln, Kristalle & Schreine im Sichtfeld
    const { startX, endX, startY, endY } = bounds;
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const obj = this.map.getObjectTile(x, y);
        if (obj === OBJECTS.TORCH) {
          const tx = x * TILE_SIZE + 8;
          const ty = y * TILE_SIZE + 5;
          const fPulse = Math.sin(t * 14 + x * 7 + y * 13) * 3;
          const tRadius = 74 + fPulse;

          const tGrad = cCtx.createRadialGradient(tx, ty, 8, tx, ty, tRadius);
          tGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
          tGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.85)');
          tGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.35)');
          tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          cCtx.fillStyle = tGrad;
          cCtx.beginPath();
          cCtx.arc(tx, ty, tRadius, 0, Math.PI * 2);
          cCtx.fill();
        }
        else if (obj === OBJECTS.GLOW_CRYSTAL) {
          const cx = x * TILE_SIZE + 8;
          const cy = y * TILE_SIZE + 8;
          const cPulse = Math.sin(t * 3.5 + x + y) * 2;
          const cRadius = 46 + cPulse;

          const cGrad = cCtx.createRadialGradient(cx, cy, 6, cx, cy, cRadius);
          cGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
          cGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.45)');
          cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          cCtx.fillStyle = cGrad;
          cCtx.beginPath();
          cCtx.arc(cx, cy, cRadius, 0, Math.PI * 2);
          cCtx.fill();
        }
        else if (obj === OBJECTS.SHRINE) {
          const sx = x * TILE_SIZE + 8;
          const sy = y * TILE_SIZE + 8;
          const sGrad = cCtx.createRadialGradient(sx, sy, 10, sx, sy, 65);
          sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
          sGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.5)');
          sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          cCtx.fillStyle = sGrad;
          cCtx.beginPath();
          cCtx.arc(sx, sy, 65, 0, Math.PI * 2);
          cCtx.fill();
        }

        // 4c. Lichtschächte von Oberwelt-Löchern
        const tile = this.map.getGroundTile(x, y);
        if (tile === TILES.CAVE_HOLE_EXIT) {
          const hx = x * TILE_SIZE + 8;
          const hy = y * TILE_SIZE + 8;
          const hGrad = cCtx.createRadialGradient(hx, hy, 8, hx, hy, 56);
          hGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
          hGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.7)');
          hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          cCtx.fillStyle = hGrad;
          cCtx.beginPath();
          cCtx.arc(hx, hy, 56, 0, Math.PI * 2);
          cCtx.fill();
        }
      }
    }

    cCtx.restore();
    this.camera.release(cCtx);

    // 5. Dunkelheits-Maske über die Höhlenszene zeichnen
    this.ctx.drawImage(cCanvas, 0, 0);
  }

  // ==========================================================================
  // SHRINE & BANNER RENDERING (Seltene Shinto-Schreine in Höhlen & Wolken)
  // ==========================================================================
  renderShrine(px, py, t, theme = 'overworld') {
    // Drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.ctx.fillRect(px + 1, py + 11, 14, 5);

    // Stone / Wood Pedestal
    this.ctx.fillStyle = theme === 'cave' ? '#475569' : (theme === 'cloud' ? '#fce7f3' : '#78350f');
    this.ctx.fillRect(px + 3, py + 8, 10, 6);
    this.ctx.fillStyle = theme === 'cave' ? '#334155' : (theme === 'cloud' ? '#f472b6' : '#451a03');
    this.ctx.fillRect(px + 1, py + 13, 14, 3);

    // Wooden Shrine Cabinet
    this.ctx.fillStyle = theme === 'cloud' ? '#fbcfe8' : '#b91c1c';
    this.ctx.fillRect(px + 4, py + 1, 8, 8);

    // Sacred Shimenawa Rope across front
    this.ctx.fillStyle = '#fef08a';
    this.ctx.fillRect(px + 3, py + 3, 10, 1.5);
    // White paper zig-zag shide streamers
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(px + 5, py + 4.5, 1.5, 3);
    this.ctx.fillRect(px + 9, py + 4.5, 1.5, 3);

    // Pagoda Roof
    this.ctx.fillStyle = theme === 'cloud' ? '#db2777' : '#0f172a';
    this.ctx.beginPath();
    this.ctx.moveTo(px, py + 2);
    this.ctx.lineTo(px + 8, py - 4);
    this.ctx.lineTo(px + 16, py + 2);
    this.ctx.closePath();
    this.ctx.fill();

    // Floating Spirit Flame / Orb above shrine
    const flameBob = Math.sin(t * 4 + px) * 2;
    const flameY = py - 7 + flameBob;
    const flameCol = theme === 'cloud' ? '#f472b6' : (theme === 'cave' ? '#38bdf8' : '#34d399');
    this.ctx.fillStyle = flameCol;
    this.ctx.beginPath();
    this.ctx.arc(px + 8, flameY, 2.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Soft flame aura
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(px + 8, flameY, 1.2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderShrineBanner(msg) {
    const w = Math.min(380, this.canvas.width - 40);
    const h = 56;
    const x = Math.round((this.canvas.width - w) / 2);
    const y = 22;

    this.ctx.save();
    // Drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(x + 3, y + 4, w, h);

    // Parchment card
    this.ctx.fillStyle = '#1e1b2e';
    this.ctx.fillRect(x, y, w, h);

    // Gold trim border
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // Header title
    this.ctx.fillStyle = '#fcd34d';
    this.ctx.font = 'bold 13px system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(msg.title, x + w / 2, y + 22);

    // Subtitle / Shrine name
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.font = '12px system-ui, sans-serif';
    this.ctx.fillText(`${msg.name} (Gefunden: ${msg.total})`, x + w / 2, y + 41);

    this.ctx.restore();
  }

  initCharacterSelectModal() {
    if (!this.charSelectModal) return;

    // Set initial name into input
    const initialName = getSelectedPlayerName();
    if (this.heroNameInput) {
      this.heroNameInput.value = initialName;
      this.heroNameInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          setSelectedPlayerName(val);
          if (this.player) this.player.setName(val);
          this.updatePlayerNameUI();
        }
      });
    }

    // Random name dice button
    if (this.btnRandomName) {
      this.btnRandomName.addEventListener('click', () => {
        const randomName = getRandomHeroName();
        if (this.heroNameInput) {
          this.heroNameInput.value = randomName;
        }
        setSelectedPlayerName(randomName);
        if (this.player) this.player.setName(randomName);
        this.updatePlayerNameUI();
      });
    }

    // Wizard Step Navigation
    if (this.btnStep1Next) {
      this.btnStep1Next.addEventListener('click', () => {
        this.goToCharWizardStep(2);
      });
    }
    if (this.btnStep2Back) {
      this.btnStep2Back.addEventListener('click', () => {
        this.goToCharWizardStep(1);
      });
    }
    if (this.btnStep2Next) {
      this.btnStep2Next.addEventListener('click', () => {
        this.goToCharWizardStep(3);
      });
    }
    if (this.btnStep3Back) {
      this.btnStep3Back.addEventListener('click', () => {
        this.goToCharWizardStep(2);
      });
    }

    // Final Start Button: Welt betreten
    if (this.btnStartGame) {
      this.btnStartGame.addEventListener('click', () => {
        this.startGameWithSelectedHero();
      });
    }

    // Dev Tools Re-open Button
    if (this.btnOpenCharSelect) {
      this.btnOpenCharSelect.addEventListener('click', () => {
        this.openCharacterSelectModal();
      });
    }

    // Direct Close / Skip Button (✕)
    const btnCloseWizard = document.getElementById('btn-close-char-wizard');
    if (btnCloseWizard) {
      btnCloseWizard.addEventListener('click', () => {
        this.startGameWithSelectedHero();
      });
    }

    // Click backdrop outside modal dialog to start/resume
    if (this.charSelectModal) {
      this.charSelectModal.addEventListener('click', (e) => {
        if (e.target === this.charSelectModal) {
          this.startGameWithSelectedHero();
        }
      });
    }

    // Populate initial cards and start at step 1
    this.goToCharWizardStep(1);
    this.renderCharacterSelectCards();
  }

  goToCharWizardStep(step) {
    this.charWizardStep = step;

    // Ensure valid name before moving past step 1
    if (step >= 2 && this.heroNameInput) {
      const val = this.heroNameInput.value.trim();
      if (!val) {
        const defChar = (typeof CHARACTERS_MAP !== 'undefined' ? CHARACTERS_MAP[this.selectedHeroSkin] : null) || (CHARACTERS_DATA && CHARACTERS_DATA[0]);
        const fallback = defChar ? defChar.name : 'Ren';
        this.heroNameInput.value = fallback;
        setSelectedPlayerName(fallback);
        if (this.player) this.player.setName(fallback);
        this.updatePlayerNameUI();
      }
    }

    // Toggle step containers
    for (let i = 1; i <= 3; i++) {
      const stepEl = document.getElementById(`char-wizard-step-${i}`);
      if (stepEl) {
        stepEl.classList.toggle('active', i === step);
      }
    }

    // Toggle indicator dots
    const dots = document.querySelectorAll('.wizard-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx + 1 === step);
    });

    if (step === 3) {
      this.updateConfirmStep();
    }
  }

  updateConfirmStep() {
    const chosenName = (this.heroNameInput && this.heroNameInput.value.trim()) || (this.player ? this.player.name : 'Ren');
    if (this.confirmHeroNameEl) {
      this.confirmHeroNameEl.textContent = chosenName;
    }
    const defChar = (typeof CHARACTERS_MAP !== 'undefined' ? CHARACTERS_MAP[this.selectedHeroSkin] : null) || (CHARACTERS_DATA && CHARACTERS_DATA[0]);
    if (this.confirmHeroSubEl && defChar) {
      this.confirmHeroSubEl.textContent = defChar.subtitle ? `${defChar.subtitle}.` : `${defChar.name}.`;
    }
    this.updateWizardWorldDisplay();
    this.renderConfirmPreview();
  }

  updateWizardWorldDisplay(worldId) {
    const activeWorldEl = document.getElementById('wizard-active-world-name');
    if (!activeWorldEl) return;
    const currentId = worldId || (this.overworldMap && this.overworldMap.preset ? this.overworldMap.preset.id : getSelectedWorldId());
    const preset = getWorldPreset(currentId);
    if (preset) {
      activeWorldEl.textContent = `${preset.id}. ${preset.name} (${preset.badge})`;
    }
  }

  renderCharacterSelectCards() {
    if (!this.charSelectGrid) return;
    this.charSelectGrid.innerHTML = '';
    this.charPreviewCanvases = {};

    const list = (typeof CHARACTERS_DATA !== 'undefined' ? CHARACTERS_DATA : []);

    list.forEach(char => {
      const isSelected = char.id === this.selectedHeroSkin;
      const card = document.createElement('div');
      card.className = `char-select-card${isSelected ? ' is-selected' : ''}`;
      card.dataset.charId = char.id;
      card.title = `${char.name} (${char.subtitle})`;

      // Clean card with large figure only - no names or text
      card.innerHTML = `
        <canvas width="78" height="88" class="char-card-canvas" data-char-id="${char.id}"></canvas>
      `;

      card.addEventListener('click', () => {
        this.selectedHeroSkin = char.id;
        setSelectedSkin(char.id);
        if (this.player) this.player.setSkin(char.id);

        this.charSelectGrid.querySelectorAll('.char-select-card').forEach(c => {
          c.classList.toggle('is-selected', c.dataset.charId === char.id);
        });

        if (this.charWizardStep === 3) {
          this.updateConfirmStep();
        }
      });

      this.charSelectGrid.appendChild(card);

      const canvas = card.querySelector('canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          this.charPreviewCanvases[char.id] = { canvas, ctx, charDef: char };
        }
      }
    });

    this.updateCharacterSelectPreviews(0);
  }

  updateCharacterSelectPreviews(dt) {
    if (this.charWizardStep === 2 && this.charPreviewCanvases) {
      for (const [id, item] of Object.entries(this.charPreviewCanvases)) {
        const { canvas, ctx, charDef } = item;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (typeof charDef.render === 'function') {
          ctx.save();
          ctx.translate(39, 74);
          ctx.scale(1.65, 1.65);
          charDef.render(ctx, 0, 0, this.animTime, 'down', true, 0);
          ctx.restore();
        }
      }
    } else if (this.charWizardStep === 3) {
      this.renderConfirmPreview();
    }
  }

  renderConfirmPreview() {
    if (!this.confirmCanvas || !this.confirmCtx) {
      this.confirmCanvas = document.getElementById('char-confirm-canvas');
      if (this.confirmCanvas) this.confirmCtx = this.confirmCanvas.getContext('2d');
    }
    if (!this.confirmCanvas || !this.confirmCtx) return;

    const defChar = (typeof CHARACTERS_MAP !== 'undefined' ? CHARACTERS_MAP[this.selectedHeroSkin] : null) || (CHARACTERS_DATA && CHARACTERS_DATA[0]);
    if (!defChar || typeof defChar.render !== 'function') return;

    const ctx = this.confirmCtx;
    ctx.clearRect(0, 0, this.confirmCanvas.width, this.confirmCanvas.height);
    ctx.save();
    ctx.translate(60, 98);
    ctx.scale(2.2, 2.2);
    defChar.render(ctx, 0, 0, this.animTime, 'down', true, 0);
    ctx.restore();
  }

  startGameWithSelectedHero() {
    let chosenName = this.heroNameInput ? this.heroNameInput.value.trim() : '';
    if (!chosenName) {
      const defChar = (typeof CHARACTERS_MAP !== 'undefined' ? CHARACTERS_MAP[this.selectedHeroSkin] : null) || (CHARACTERS_DATA && CHARACTERS_DATA[0]);
      chosenName = defChar ? defChar.name : 'Ren';
    }

    setSelectedPlayerName(chosenName);
    setSelectedSkin(this.selectedHeroSkin);

    if (this.player) {
      this.player.setName(chosenName);
      this.player.setSkin(this.selectedHeroSkin);
    }

    this.updatePlayerNameUI();

    if (this.charSelectModal) {
      this.charSelectModal.classList.add('hidden');
    }
    this.isCharacterSelectOpen = false;
    this.requestGameFullscreen();

    // Auto-Connect to LAN-Multiplayer as Player
    if (this.network && !this.isHost) {
      this.network.connect('player', chosenName, this.selectedHeroSkin);
    }

    if (this.heroNameInput && typeof this.heroNameInput.blur === 'function') {
      this.heroNameInput.blur();
    }
    if (this.canvas && typeof this.canvas.focus === 'function') {
      this.canvas.focus();
    }
  }

  initWorldSelectUI() {
    const devWorldSelect = document.getElementById('dev-world-select');
    const presets = getAllWorldPresets();
    const currentId = getSelectedWorldId();

    if (devWorldSelect) {
      devWorldSelect.innerHTML = '';
      presets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.id}. ${p.name} (${p.badge})`;
        if (p.id === currentId) opt.selected = true;
        devWorldSelect.appendChild(opt);
      });

      devWorldSelect.addEventListener('change', (e) => {
        const newId = parseInt(e.target.value, 10);
        if (newId) {
          this.switchWorld(newId);
        }
      });
    }

    this.updateWizardWorldDisplay(currentId);
  }

  switchWorld(worldId) {
    const preset = getWorldPreset(worldId);
    setSelectedWorldId(preset.id);

    // Re-create maps with the new preset
    this.overworldMap = new WorldMap(preset.id);
    this.cloudMap = new CloudMap(this.overworldMap);

    if (this.currentDimension === DIMENSIONS.OVERWORLD) {
      this.map = this.overworldMap;
    } else if (this.currentDimension === DIMENSIONS.CLOUDS) {
      this.map = this.cloudMap;
    }

    // Reposition player to the new world's spawn point
    if (this.player) {
      this.player.x = this.overworldMap.spawnPoint.x * TILE_SIZE + 8;
      this.player.y = this.overworldMap.spawnPoint.y * TILE_SIZE + 8;
      this.player.elevation = 0;
      this.player.map = this.map;
    }

    // Reset camera bounds & center on player
    this.camera.setWorldBounds(this.map.width, this.map.height);
    this.camera.follow(this.player.x, this.player.y);

    // Reset Minimap and Fog of War for new world
    if (this.minimap) {
      this.minimap.setMap(this.map, this.currentDimension);
      this.minimap.resetFog();
    }

    // Reinitialize Shrines & Artifacts
    if (this.magicManager) {
      this.magicManager.initShrineArtifacts(this.caves, this.cloudMap, this.overworldMap);
    }

    // Re-spawn all monster groups for the new terrain and dimensions
    if (this.enemyManager) {
      this.enemyManager.initSpawns();
    }

    // Update World Select UI controls
    const worldPresetSelect = document.getElementById('world-preset-select');
    const devWorldSelect = document.getElementById('dev-world-select');
    const worldPresetDesc = document.getElementById('world-preset-desc');
    if (worldPresetSelect) worldPresetSelect.value = preset.id;
    if (devWorldSelect) devWorldSelect.value = preset.id;
    if (worldPresetDesc) {
      worldPresetDesc.innerHTML = `<strong style="color: ${preset.color || '#38bdf8'}">${preset.badge}: ${preset.name}</strong> - <em>${preset.subtitle}</em><br><span style="color: #cbd5e1">${preset.description}</span>`;
    }

    this.showToast(`🌍 Welt gewechselt: ${preset.name}!`);
  }

  openCharacterSelectModal() {
    if (!this.charSelectModal) return;
    this.isCharacterSelectOpen = true;
    this.selectedHeroSkin = this.player ? (this.player.skinId || getSelectedSkin()) : getSelectedSkin();
    if (this.heroNameInput && this.player) {
      this.heroNameInput.value = this.player.name || getSelectedPlayerName();
    }
    this.charSelectModal.classList.remove('hidden');
    this.goToCharWizardStep(1);
    this.renderCharacterSelectCards();
  }

  updatePlayerNameUI() {
    const name = this.player ? this.player.name : getSelectedPlayerName();
    if (this.compactPlayerNameEl) {
      this.compactPlayerNameEl.textContent = name;
    }
  }

  // ---------------------------------------------------------------------------
  // LAN MULTIPLAYER & SPECTATOR SYSTEMS
  // ---------------------------------------------------------------------------
  requestGameFullscreen() {
    const docEl = document.documentElement;
    if (!docEl || document.fullscreenElement || document.webkitFullscreenElement) return;
    try {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } catch (e) {}
  }

  startAsHost() {
    this.isHost = true;
    if (this.charSelectModal) {
      this.charSelectModal.classList.add('hidden');
    }
    this.isCharacterSelectOpen = false;
    this.requestGameFullscreen();

    if (this.spectator) {
      this.spectator.activate();
    }
    if (this.network) {
      this.network.connect('host', 'Spielleiter', 'ren_twilight');
    }
    this.showToast('👑 Als Spielleiter (Host / Spectator) gestartet!');
  }

  initMultiplayerUI() {
    this.btnStartAsHost = document.getElementById('btn-start-as-host');
    const wizardHostBanner = document.querySelector('.wizard-host-banner');
    const wizardDivider = document.querySelector('.wizard-divider');

    // Host-Rolle nur auf dem Host-Rechner (localhost / 127.0.0.1) erlauben
    const isLocalhost = typeof window !== 'undefined' && window.location &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Wenn nicht am Host-PC (z.B. Handy/Tablet/anderer PC im LAN): Host-Banner komplett ausblenden!
    if (!isLocalhost) {
      if (wizardHostBanner) wizardHostBanner.style.display = 'none';
      if (wizardDivider) wizardDivider.style.display = 'none';
    } else {
      // Am Host-PC: prüfen ob bereits ein Host aktiv ist
      if (typeof fetch !== 'undefined') {
        fetch('/api/server-info')
          .then(res => res.json())
          .then(data => {
            if (data && data.hasHost && !this.isHost) {
              if (wizardHostBanner) wizardHostBanner.style.display = 'none';
              if (wizardDivider) wizardDivider.style.display = 'none';
            }
            if (data && data.worldId) {
              this.updateWizardWorldDisplay(data.worldId);
            }
          })
          .catch(() => {});
      }
    }

    if (this.btnStartAsHost) {
      this.btnStartAsHost.addEventListener('click', () => {
        this.startAsHost();
      });
    }

    const btnDevHost = document.getElementById('btn-dev-host-mode');
    if (btnDevHost) {
      btnDevHost.addEventListener('click', () => {
        this.startAsHost();
      });
    }

    const btnResultsNewRound = document.getElementById('btn-results-new-round');
    if (btnResultsNewRound) {
      btnResultsNewRound.addEventListener('click', () => {
        const selWorld = (this.spectator && this.spectator.worldSelectEl) ? parseInt(this.spectator.worldSelectEl.value, 10) : 1;
        if (this.network) {
          this.network.sendHostStartRound(selWorld);
        }
      });
    }

    // URL Query Parameter ?host=true Support (nur auf localhost)
    if (isLocalhost && typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('host') === 'true' || urlParams.get('host') === '1') {
        this.startAsHost();
      }
    }
  }

  initNetworkEvents() {
    if (!this.network) return;

    this.network.on('init', (msg) => {
      this.remotePlayers.clear();
      const myId = msg.clientId || (this.network ? this.network.clientId : null);
      if (msg.masterClientId && this.enemyManager) {
        this.enemyManager.isMasterClient = (myId === msg.masterClientId);
      }
      if (msg.players) {
        for (const p of msg.players) {
          if (p.id !== myId) {
            this.remotePlayers.set(p.id, new RemotePlayer(p));
          }
        }
      }
      if (msg.worldId) {
        if (this.overworldMap && this.overworldMap.preset.id !== msg.worldId) {
          this.switchWorld(msg.worldId);
        }
        this.updateWizardWorldDisplay(msg.worldId);
      }
    });

    this.network.on('master_client', (msg) => {
      const isMaster = (this.network.clientId === msg.masterClientId);
      if (this.enemyManager) {
        this.enemyManager.isMasterClient = isMaster;
      }
    });

    this.network.on('enemies_update', (msg) => {
      if (this.enemyManager && !this.enemyManager.isMasterClient) {
        this.enemyManager.applyEnemiesState(msg.enemies);
      }
    });

    this.network.on('damage_enemy', (msg) => {
      if (this.enemyManager && this.enemyManager.isMasterClient) {
        this.enemyManager.handleRemoteDamage(msg);
      }
    });

    this.network.on('player_joined', (msg) => {
      const myId = this.network ? this.network.clientId : null;
      if (msg.player && msg.player.id !== myId) {
        this.remotePlayers.set(msg.player.id, new RemotePlayer(msg.player));
        this.showToast(`👋 ${msg.player.name} ist beigetreten!`);
      }
    });

    this.network.on('player_left', (msg) => {
      this.remotePlayers.delete(msg.id);
      this.showToast(`🚪 ${msg.name || 'Ein Spieler'} hat das Spiel verlassen.`);
    });

    this.network.on('player_update', (msg) => {
      if (this.network && msg.id === this.network.clientId) return;
      const rp = this.remotePlayers.get(msg.id);
      if (rp) {
        rp.updateFromNetwork(msg);
      }
    });

    this.network.on('player_action', (msg) => {
      if (this.network && msg.id === this.network.clientId) return;
      const rp = this.remotePlayers.get(msg.id);
      if (rp) {
        rp.triggerAction(msg.action, msg);
      }
      if (msg.action === 'melee' && this.combat) {
        const mx = (rp ? rp.x : msg.x) || 0;
        const my = ((rp ? rp.y : msg.y) || 0) - 6;
        this.combat.addSlashEffect(msg.subType || 'slash1', mx, my, msg.angle || 0, msg.radius || 24);
      } else if (msg.action === 'arrow' && this.combat) {
        this.combat.fireArrow(msg.x, msg.y, msg.dirX, msg.dirY, msg.isCharged);
      } else if (msg.action === 'dash' && this.combat) {
        const dx = (rp ? rp.x : msg.x) || 0;
        const dy = (rp ? rp.y : msg.y) || 0;
        this.combat.addHitSparks(dx, dy + 2, 'rgba(240, 240, 245, 0.75)', 8, 40);
      } else if (msg.action === 'shield_block' && this.combat) {
        this.combat.addHitSparks(msg.x, msg.y, '#38bdf8', 14);
        this.combat.addFloatingText('🛡️ GEBLOCKT!', msg.x, msg.y - 14, '#38bdf8');
      } else if (msg.action === 'spell_phoenix' && this.magicManager) {
        this.magicManager.spawnRemotePhoenix(msg);
      } else if (msg.action === 'spell_frost' && this.magicManager) {
        this.magicManager.spawnRemoteFrostCone(msg);
      }
    });

    this.network.on('pvp_hit', (msg) => {
      if (msg.targetId === this.network.clientId) {
        const attacker = this.remotePlayers.get(msg.attackerId);
        const attackerName = msg.attackerName || (attacker ? attacker.name : null) || 'Ein Spieler';
        this.player.takePvPDamage(msg.damage, msg.kbX, msg.kbY, msg.attackerId, attackerName);
      } else {
        const rp = this.remotePlayers.get(msg.targetId);
        if (rp && typeof msg.targetHp === 'number') {
          rp.hp = msg.targetHp;
        }
      }
    });

    this.network.on('player_killed', (msg) => {
      if (msg.victimId === this.network.clientId && this.player && this.player.lastDeathInfo) {
        this.player.lastDeathInfo.killerName = msg.killerName;
        this.updateHUD();
      }
    });

    this.network.on('player_respawned', (msg) => {
      if (msg.id !== this.network.clientId) {
        const rp = this.remotePlayers.get(msg.id);
        if (rp) {
          rp.isDead = false;
          rp.hp = msg.hp;
          rp.maxHp = msg.maxHp;
          rp.x = msg.x;
          rp.y = msg.y;
        }
      }
    });

    this.network.on('world_changed', (msg) => {
      this.switchWorld(msg.worldId);
      this.updateWizardWorldDisplay(msg.worldId);
      this.showToast(`🌍 Welt gewechselt: ${getWorldPreset(msg.worldId).name}`);
    });

    this.network.on('game_ended', (msg) => {
      this.showMatchResultsModal(msg.winners, msg.leaderboard);
    });

    this.network.on('round_started', (msg) => {
      this.hideMatchResultsModal();
      this.switchWorld(msg.worldId);
      this.updateWizardWorldDisplay(msg.worldId);

      // Reset local player
      if (!this.isHost && this.player) {
        this.player.level = 1;
        this.player.xp = 0;
        this.player.totalXpEarned = 0;
        this.player.skillPoints = 0;
        this.player.skills = { hp: 0, melee: 0, range: 0, shield: 0 };
        this.player.hp = this.player.maxHp;
        this.player.isDead = false;
        this.player.x = this.map.spawnPoint.x * TILE_SIZE + 8;
        this.player.y = this.map.spawnPoint.y * TILE_SIZE + 8;
        this.updateHUD();
      }

      // Reset remote players
      for (const rp of this.remotePlayers.values()) {
        rp.level = 1;
        rp.xp = 0;
        rp.pvpKills = 0;
        rp.deaths = 0;
        rp.hp = rp.maxHp;
        rp.isDead = false;
        rp.x = this.map.spawnPoint.x * TILE_SIZE + 8;
        rp.y = this.map.spawnPoint.y * TILE_SIZE + 8;
      }

      this.showToast('🚀 Neue Runde gestartet! Auf in den Kampf!');
    });
  }

  showKillFeed(killerName, victimName) {
    const container = document.getElementById('killfeed-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'killfeed-toast';
    toast.textContent = `⚔️ ${killerName} hat ${victimName} besiegt!`;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
  }

  showMatchResultsModal(winners, leaderboard) {
    const modal = document.getElementById('match-results-modal');
    if (!modal) return;

    const levelNameEl = document.getElementById('podium-level-name');
    const levelStatEl = document.getElementById('podium-level-stat');
    const killsNameEl = document.getElementById('podium-kills-name');
    const killsStatEl = document.getElementById('podium-kills-stat');
    const tbody = document.getElementById('results-table-body');
    const hostControls = document.getElementById('results-host-controls');
    const playerNotice = document.getElementById('results-player-notice');

    if (winners && winners.highestLevel) {
      if (levelNameEl) levelNameEl.textContent = winners.highestLevel.name;
      if (levelStatEl) levelStatEl.textContent = `Level ${winners.highestLevel.level} (${winners.highestLevel.xp} XP)`;
    } else {
      if (levelNameEl) levelNameEl.textContent = '-';
      if (levelStatEl) levelStatEl.textContent = 'Keine Daten';
    }

    if (winners && winners.mostKills) {
      if (killsNameEl) killsNameEl.textContent = winners.mostKills.name;
      if (killsStatEl) killsStatEl.textContent = `${winners.mostKills.pvpKills} PvP-Kills`;
    } else {
      if (killsNameEl) killsNameEl.textContent = '-';
      if (killsStatEl) killsStatEl.textContent = '0 Kills';
    }

    if (tbody) {
      tbody.innerHTML = '';
      if (leaderboard && leaderboard.length > 0) {
        leaderboard.forEach((p, idx) => {
          const row = document.createElement('tr');
          const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));
          row.innerHTML = `
            <td><strong>${medal}</strong></td>
            <td><strong>${p.name}</strong></td>
            <td>Lv.${p.level}</td>
            <td>${p.xp}</td>
            <td style="color: #f87171; font-weight: bold;">${p.pvpKills}</td>
            <td style="color: #94a3b8;">${p.deaths}</td>
          `;
          tbody.appendChild(row);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #94a3b8;">Keine Spielerdaten verfügbar</td></tr>';
      }
    }

    if (this.isHost) {
      if (hostControls) hostControls.classList.remove('hidden');
      if (playerNotice) playerNotice.classList.add('hidden');
    } else {
      if (hostControls) hostControls.classList.add('hidden');
      if (playerNotice) playerNotice.classList.remove('hidden');
    }

    modal.classList.remove('hidden');
  }

  hideMatchResultsModal() {
    const modal = document.getElementById('match-results-modal');
    if (modal) modal.classList.add('hidden');
  }
}

// Start Game on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
