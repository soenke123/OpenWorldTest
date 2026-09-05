import { TILE_SIZE, PLAYER_CONFIG, TILES, OBJECTS, ELEVATION_PIXEL_OFFSET, RAMPS, COMBAT_CONFIG } from './constants.js';
import { CHARACTERS_MAP, getSelectedSkin, setSelectedSkin, getSelectedPlayerName, setSelectedPlayerName } from './characters.js';

export class Player {
  constructor(x, y, map, game = null) {
    this.map = map;
    this.game = game;
    this.spawnX = x * TILE_SIZE + TILE_SIZE / 2;
    this.spawnY = y * TILE_SIZE + TILE_SIZE / 2;
    this.x = this.spawnX;
    this.y = this.spawnY;

    this.elevation = 0;        // Aktuelle Ebene (-1, 0, 1, 2)
    this.visualElevation = 0;  // Sanft interpolierte optische Höhe für Rampen

    this.radius = PLAYER_CONFIG.RADIUS;
    this.baseSpeed = PLAYER_CONFIG.BASE_SPEED;
    this.currentSpeed = this.baseSpeed;
    this.speedMod = 1.0;

    this.direction = 'down';
    this.isMoving = false;
    this.isSprinting = false;

    this.isDead = false;
    this.deathTimer = 0;
    this.deathCount = 0;

    // Active Character Skin (15 selectable Dark Ghibli Papercraft heroes)
    this.skinId = (typeof getSelectedSkin === 'function') ? getSelectedSkin() : 'ren_twilight';
    this.name = (typeof getSelectedPlayerName === 'function') ? getSelectedPlayerName() : 'Ren';

    // Health & Damage States
    this.maxHp = PLAYER_CONFIG.MAX_HP || 100;
    this.hp = this.maxHp;
    this.hitFlash = 0;
    this.invulnTimer = 0;
    this.speedSlowTimer = 0;
    this.speedSlowFactor = 1.0;

    // Level & XP Progression
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 50;
    this.totalXpEarned = 0;
    this.lastDeathInfo = null;

    // Skills & Stat Progression (HP, Melee, Range, Shield)
    this.skills = {
      hp: 0,
      melee: 0,
      range: 0,
      shield: 0
    };
    this.skillPoints = 0;
    this.levelUpFlameTimer = 0;

    this.particles = [];

    // Combat & Ability State (Dash, Melee, Shield, Ranged)
    this.dash = {
      active: false,
      timer: 0,
      cooldown: 0,
      vx: 0,
      vy: 0,
      ghosts: []
    };

    this.melee = {
      comboStep: 0,       // 0 = idle, 1 = slash1, 2 = slash2, 3 = thrust
      comboTimer: 0,      // buffer window for next combo attack
      recoveryTimer: 0,   // pause after thrust (schnitt schnitt stich PAUSE)
      charging: false,
      chargeTimer: 0,
      isSpinning: false,
      spinTimer: 0,
      swingProgress: 1.0, // for visual sword rendering
      swingType: null     // 'slash1' | 'slash2' | 'thrust' | 'spin'
    };

    this.shield = {
      active: false,
      energy: COMBAT_CONFIG.SHIELD_MAX,
      maxEnergy: COMBAT_CONFIG.SHIELD_MAX,
      broken: false,
      stunTimer: 0,
      rechargeDelay: 0
    };

    this.ranged = {
      ammo: COMBAT_CONFIG.MAX_AMMO,
      charging: false,
      chargeTimer: 0
    };

    // Dimensions-Transitionen (Trampolin, Wolkenfall, Höhleneinstieg)
    this.transition = null; // { type, timer, duration, targetDim, targetX, targetY, switched }
    this.transitionCooldown = 0;
    this.lastTransitionTile = null; // Verhindert Re-Triggering solange man auf dem Zielfeld steht
    this.discoveredShrines = new Set();
    this.shrineMessage = null;
    this.artifact = null; // Active magical artifact { id, name, charges, maxCharges, cooldownTimer, ... }
  }

  respawn() {
    this.transition = null;
    this.transitionCooldown = 0.5;
    this.lastTransitionTile = null;
    this.isDead = false;
    this.deathTimer = 0;
    this.hp = this.maxHp;
    this.hitFlash = 0;
    this.invulnTimer = 0;
    this.speedSlowTimer = 0;
    this.speedSlowFactor = 1.0;

    // Reset combat states
    this.dash.active = false;
    this.dash.cooldown = 0;
    this.dash.ghosts = [];
    this.melee.charging = false;
    this.melee.isSpinning = false;
    this.melee.comboStep = 0;
    this.melee.recoveryTimer = 0;
    this.shield.active = false;
    this.shield.broken = false;
    this.shield.stunTimer = 0;
    this.shield.rechargeDelay = 0;
    const maxShield = COMBAT_CONFIG.SHIELD_MAX + (this.skills?.shield || 0) * 15;
    this.shield.maxEnergy = maxShield;
    this.shield.energy = maxShield;
    this.ranged.charging = false;
    this.ranged.ammo = COMBAT_CONFIG.MAX_AMMO;

    if (this.game && this.game.currentDimension !== 'overworld') {
      this.game.switchDimension('overworld', this.spawnX, this.spawnY);
    } else {
      this.x = this.spawnX;
      this.y = this.spawnY;
      this.elevation = 0;
      this.visualElevation = 0;
    }
  }

  addXp(amount) {
    if (amount <= 0) return;
    this.xp += amount;
    this.totalXpEarned = (this.totalXpEarned || 0) + amount;

    let leveledUp = false;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.round(50 * Math.pow(1.35, this.level - 1));
      this.skillPoints = (this.skillPoints || 0) + 1;
      leveledUp = true;
    }

    if (leveledUp) {
      this.levelUpFlameTimer = 2.4;
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText(`🎉 LEVEL UP! Lv. ${this.level}`, this.x, this.y - 28, '#facc15', 1.0);
        for (let i = 0; i < 22; i++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = Math.random() * 60 + 20;
          this.game.combat.hitSparks.push({
            x: this.x,
            y: this.y - 10,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp - 20,
            color: Math.random() > 0.5 ? '#facc15' : '#4ade80',
            size: Math.random() * 2.5 + 1.5,
            life: 0.5,
            maxLife: 0.5
          });
        }
      }
    }
  }

  setName(name) {
    if (typeof name === 'string' && name.trim()) {
      this.name = name.trim().slice(0, 20);
      if (typeof setSelectedPlayerName === 'function') {
        setSelectedPlayerName(this.name);
      }
    }
  }

  setSkin(skinId) {
    if (CHARACTERS_MAP && CHARACTERS_MAP[skinId]) {
      this.skinId = skinId;
      if (typeof setSelectedSkin === 'function') {
        setSelectedSkin(skinId);
      }
    }
  }

  hasActiveArtifact() {
    return !!(this.artifact && this.artifact.charges > 0);
  }

  equipArtifact(artifactDef) {
    this.artifact = {
      id: artifactDef.id,
      name: artifactDef.name,
      title: artifactDef.title,
      icon: artifactDef.icon,
      charges: artifactDef.maxCharges,
      maxCharges: artifactDef.maxCharges,
      cooldownTimer: 0,
      cooldownMax: artifactDef.cooldown,
      damage: artifactDef.damage,
      widthTiles: artifactDef.widthTiles,
      speed: artifactDef.speed
    };
  }

  rechargeArtifact(amount = 3) {
    if (this.artifact) {
      this.artifact.charges = Math.min(this.artifact.maxCharges + 5, this.artifact.charges + amount);
    }
  }

  getTotalXpEarned() {
    if (this.totalXpEarned && this.totalXpEarned > 0) {
      return this.totalXpEarned;
    }
    let total = this.xp || 0;
    for (let lvl = 1; lvl < this.level; lvl++) {
      total += Math.round(50 * Math.pow(1.35, lvl - 1));
    }
    return total;
  }

  investSkillPoint(attribute) {
    if (!this.skills) {
      this.skills = { hp: 0, melee: 0, range: 0, shield: 0 };
    }
    if ((this.skillPoints || 0) <= 0) {
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('Keine Skillpunkte!', this.x, this.y - 20, '#ef4444', 0.8);
      }
      return false;
    }

    if (!['hp', 'melee', 'range', 'shield'].includes(attribute)) {
      return false;
    }

    this.skillPoints--;
    this.skills[attribute] = (this.skills[attribute] || 0) + 1;

    // Apply immediate attribute bonuses
    if (attribute === 'hp') {
      this.maxHp += 15;
      this.hp = Math.min(this.maxHp, this.hp + 15);
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('❤️ +15 Max HP!', this.x, this.y - 24, '#4ade80', 1.1);
        this.game.combat.addHitSparks(this.x, this.y - 10, '#4ade80', 14);
      }
    } else if (attribute === 'melee') {
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('⚔️ +4 Nahkampf-Schaden!', this.x, this.y - 24, '#f59e0b', 1.1);
        this.game.combat.addHitSparks(this.x, this.y - 10, '#f59e0b', 14);
      }
    } else if (attribute === 'range') {
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('🏹 Pfeil-Speed & Reichweite +!', this.x, this.y - 24, '#38bdf8', 1.1);
        this.game.combat.addHitSparks(this.x, this.y - 10, '#38bdf8', 14);
      }
    } else if (attribute === 'shield') {
      const baseMax = COMBAT_CONFIG.SHIELD_MAX || 100;
      this.shield.maxEnergy = baseMax + this.skills.shield * 15;
      this.shield.energy = Math.min(this.shield.maxEnergy, this.shield.energy + 15);
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('🛡️ +15 Schild-Energie!', this.x, this.y - 24, '#06b6d4', 1.1);
        this.game.combat.addHitSparks(this.x, this.y - 10, '#06b6d4', 14);
      }
    }

    return true;
  }

  // ==========================================================================
  // DIRECTION & VECTOR HELPERS (8-Directional Support)
  // ==========================================================================

  getFacingAngle() {
    switch (this.direction) {
      case 'right': return 0;
      case 'down-right': return Math.PI / 4;
      case 'down': return Math.PI / 2;
      case 'down-left': return 3 * Math.PI / 4;
      case 'left': return Math.PI;
      case 'up-left': return -3 * Math.PI / 4;
      case 'up': return -Math.PI / 2;
      case 'up-right': return -Math.PI / 4;
      default: return 0;
    }
  }

  getFacingVector() {
    switch (this.direction) {
      case 'right': return { x: 1, y: 0 };
      case 'down-right': return { x: Math.SQRT1_2, y: Math.SQRT1_2 };
      case 'down': return { x: 0, y: 1 };
      case 'down-left': return { x: -Math.SQRT1_2, y: Math.SQRT1_2 };
      case 'left': return { x: -1, y: 0 };
      case 'up-left': return { x: -Math.SQRT1_2, y: -Math.SQRT1_2 };
      case 'up': return { x: 0, y: -1 };
      case 'up-right': return { x: Math.SQRT1_2, y: -Math.SQRT1_2 };
      default: return { x: 1, y: 0 };
    }
  }

  setDirectionFromVector(dx, dy) {
    if (dx === 0 && dy === 0) return;
    const angle = Math.atan2(dy, dx);
    const step = Math.PI / 4;
    const offset = Math.PI / 8;
    let a = angle;
    if (a < 0) a += Math.PI * 2;
    const index = Math.floor((a + offset) / step) % 8;
    const dirs = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
    this.direction = dirs[index];
  }

  syncDirectionFromInput() {
    if (this.game && this.game.input) {
      let dx = 0;
      let dy = 0;
      const keys = this.game.input.keys || {};
      if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
      if (keys['ArrowDown'] || keys['KeyS']) dy += 1;
      if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
      if (this.game.input.joystick && this.game.input.joystick.active) {
        dx += this.game.input.joystick.x;
        dy += this.game.input.joystick.y;
      }
      if (dx !== 0 || dy !== 0) {
        this.setDirectionFromVector(dx, dy);
      }
    }
  }

  // ==========================================================================
  // COMBAT ACTIONS (Zelda & Smash Bros Mechanics)
  // ==========================================================================

  triggerDash() {
    if (this.dash.cooldown > 0 || this.dash.active || this.shield.active || this.shield.stunTimer > 0 || this.isDead || this.transition) {
      return;
    }

    this.syncDirectionFromInput();

    const vec = this.getFacingVector();
    const dirX = vec.x;
    const dirY = vec.y;

    const speed = COMBAT_CONFIG.DASH_SPEED;
    this.dash.active = true;
    this.dash.timer = COMBAT_CONFIG.DASH_DURATION;
    this.dash.cooldown = COMBAT_CONFIG.DASH_COOLDOWN;
    this.dash.vx = dirX * speed;
    this.dash.vy = dirY * speed;

    // Ground dust puff particles
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: this.x,
        y: this.y + 4,
        vx: -dirX * 30 + Math.cos(angle) * 15,
        vy: -dirY * 30 + Math.sin(angle) * 15,
        size: Math.random() * 2.5 + 1.2,
        color: 'rgba(240, 240, 245, 0.75)',
        life: 0.28,
        maxLife: 0.28
      });
    }
  }

  startMelee() {
    if (this.shield.active || this.shield.stunTimer > 0 || this.isDead || this.transition) return;
    if (this.melee.recoveryTimer > 0) return; // Pause nach Stich einhalten!
    if (this.melee.charging) return; // Bereits am Laden: chargeTimer nicht zurücksetzen!
    this.syncDirectionFromInput();
    this.melee.charging = true;
    this.melee.chargeTimer = 0;
  }

  releaseMelee() {
    if (!this.melee.charging) return;
    this.melee.charging = false;

    if (this.melee.chargeTimer >= COMBAT_CONFIG.SPIN_CHARGE_TIME) {
      // Execute 360 Spin Attack (Kreisel-Angriff)
      this.executeSpinAttack();
    } else {
      // Execute Next Combo Step (1 = Schnitt 1, 2 = Schnitt 2, 3 = Stich)
      this.executeComboStep();
    }
    this.melee.chargeTimer = 0;
  }

  executeSpinAttack() {
    this.melee.isSpinning = true;
    this.melee.spinTimer = 0.32;
    this.melee.swingProgress = 0;
    this.melee.swingType = 'spin';
    this.melee.comboStep = 0;
    this.melee.comboTimer = 0;
    this.melee.recoveryTimer = 0;

    const radius = COMBAT_CONFIG.SPIN_RADIUS;
    if (this.game && this.game.combat) {
      this.game.combat.addSlashEffect('spin', this.x, this.y - 6, 0, radius);
      this.game.combat.checkMeleeHits({
        type: 'spin',
        x: this.x,
        y: this.y - 6,
        radius,
        knockback: COMBAT_CONFIG.SPIN_KNOCKBACK
      });
    }
  }

  executeComboStep() {
    let nextStep = 1;
    if (this.melee.comboStep === 1 && this.melee.comboTimer > 0) {
      nextStep = 2;
    } else if (this.melee.comboStep === 2 && this.melee.comboTimer > 0) {
      nextStep = 3;
    }

    this.syncDirectionFromInput();
    this.melee.comboStep = nextStep;
    this.melee.swingProgress = 0;

    const angle = this.getFacingAngle();

    if (nextStep === 1) {
      this.melee.swingType = 'slash1';
      this.melee.comboTimer = COMBAT_CONFIG.COMBO_WINDOW;
      this.melee.recoveryTimer = 0;
      const radius = COMBAT_CONFIG.COMBO_SLASH_RADIUS;
      if (this.game && this.game.combat) {
        this.game.combat.addSlashEffect('slash1', this.x, this.y - 6, angle, radius);
        this.game.combat.checkMeleeHits({
          type: 'slash1',
          x: this.x,
          y: this.y - 6,
          angle,
          radius,
          knockback: 75
        });
      }
    } else if (nextStep === 2) {
      this.melee.swingType = 'slash2';
      this.melee.comboTimer = COMBAT_CONFIG.COMBO_WINDOW;
      this.melee.recoveryTimer = 0;
      const radius = COMBAT_CONFIG.COMBO_SLASH_RADIUS + 2;
      if (this.game && this.game.combat) {
        this.game.combat.addSlashEffect('slash2', this.x, this.y - 6, angle, radius);
        this.game.combat.checkMeleeHits({
          type: 'slash2',
          x: this.x,
          y: this.y - 6,
          angle,
          radius,
          knockback: 95
        });
      }
    } else if (nextStep === 3) {
      // Kräftiger Stich / Thrust mit spürbarem Vorstoß, Wucht & anschließender Pause
      this.melee.swingType = 'thrust';
      this.melee.comboTimer = 0; // Kombo-Kette endet mit dem Stich
      this.melee.recoveryTimer = COMBAT_CONFIG.COMBO_RECOVERY_PAUSE; // Pause nach Stich
      const range = COMBAT_CONFIG.COMBO_THRUST_RANGE;

      // Vorwärts-Lunge (kräftiger Ausfallschritt nach vorne)
      const lungeDist = COMBAT_CONFIG.COMBO_THRUST_LUNGE;
      const lx = Math.cos(angle) * lungeDist;
      const ly = Math.sin(angle) * lungeDist;
      if (!this.checkCollision(this.x + lx, this.y)) {
        this.x += lx;
      }
      if (!this.checkCollision(this.x, this.y + ly)) {
        this.y += ly;
      }

      // Staub- und Windpartikel nach hinten schleudern
      for (let i = 0; i < 7; i++) {
        const spread = (Math.random() - 0.5) * 0.8;
        const pSpeed = Math.random() * 50 + 30;
        this.particles.push({
          x: this.x - Math.cos(angle) * 8 + (Math.random() * 4 - 2),
          y: this.y + 4 + (Math.random() * 4 - 2),
          vx: -Math.cos(angle + spread) * pSpeed,
          vy: -Math.sin(angle + spread) * pSpeed,
          size: Math.random() * 2.5 + 1.2,
          color: 'rgba(254, 240, 138, 0.75)',
          life: 0.28,
          maxLife: 0.28
        });
      }

      if (this.game && this.game.combat) {
        this.game.combat.addSlashEffect('thrust', this.x, this.y - 6, angle, range);
        this.game.combat.checkMeleeHits({
          type: 'thrust',
          x: this.x,
          y: this.y - 6,
          angle,
          range,
          width: COMBAT_CONFIG.COMBO_THRUST_WIDTH,
          knockback: COMBAT_CONFIG.COMBO_THRUST_KNOCKBACK
        });
      }
    }
  }

  setShield(isDown) {
    if (this.shield.broken || this.shield.stunTimer > 0 || this.isDead || this.transition) {
      this.shield.active = false;
      return;
    }
    const wasActive = this.shield.active;
    this.shield.active = Boolean(isDown);
    if (this.shield.active) {
      this.melee.charging = false;
      this.ranged.charging = false;
      this.shield.rechargeDelay = COMBAT_CONFIG.SHIELD_RECHARGE_DELAY;
    } else if (wasActive && !this.shield.broken) {
      this.shield.rechargeDelay = COMBAT_CONFIG.SHIELD_RECHARGE_DELAY;
    }
  }

  startRanged() {
    if (this.shield.active || this.shield.stunTimer > 0 || this.isDead || this.transition) return;
    if (this.ranged.charging) return; // Bereits am Laden
    this.syncDirectionFromInput();
    if (this.ranged.ammo <= 0) {
      if (this.game && this.game.combat) {
        this.game.combat.floatingTexts.push({
          text: 'Keine Pfeile! (0/30) 🏹',
          x: this.x,
          y: this.y - 22,
          timer: 0,
          duration: 0.65,
          color: '#ef4444'
        });
      }
      return;
    }
    this.ranged.charging = true;
    this.ranged.chargeTimer = 0;
  }

  releaseRanged() {
    if (!this.ranged.charging) return;
    this.ranged.charging = false;

    if (this.ranged.ammo > 0) {
      this.syncDirectionFromInput();
      this.ranged.ammo--;
      const isCharged = (this.ranged.chargeTimer >= COMBAT_CONFIG.ARROW_CHARGE_TIME);

      const vec = this.getFacingVector();
      const dirX = vec.x;
      const dirY = vec.y;

      if (this.game && this.game.combat) {
        this.game.combat.fireArrow(this.x, this.y - 6, dirX, dirY, isCharged);
      }
    }
    this.ranged.chargeTimer = 0;
  }

  update(dt, input) {
    this.updateParticles(dt);

    // Green Level-Up Flame Aura Timer & Spark Emitters
    if (this.levelUpFlameTimer > 0) {
      this.levelUpFlameTimer -= dt;
      if (this.levelUpFlameTimer < 0) this.levelUpFlameTimer = 0;
      // Emit rising spirit embers from the feet
      if (Math.random() < 0.45) {
        const offX = (Math.random() - 0.5) * 18;
        this.particles.push({
          x: this.x + offX,
          y: this.y + (Math.random() * 6),
          vx: (Math.random() - 0.5) * 18,
          vy: -(Math.random() * 38 + 22),
          size: Math.random() * 2.8 + 1.2,
          color: Math.random() > 0.4 ? '#4ade80' : '#86efac',
          life: 0.55,
          maxLife: 0.55
        });
      }
    }

    if (this.transitionCooldown > 0) {
      this.transitionCooldown -= dt;
    }

    if (this.shrineMessage) {
      this.shrineMessage.timer -= dt;
      if (this.shrineMessage.timer <= 0) {
        this.shrineMessage = null;
      }
    }

    if (this.transition) {
      this.transition.timer += dt;
      const prog = this.transition.timer / this.transition.duration;
      if (prog >= 0.5 && !this.transition.switched) {
        this.transition.switched = true;
        if (this.game) {
          this.game.switchDimension(this.transition.targetDim, this.transition.targetX, this.transition.targetY);
        } else {
          this.x = this.transition.targetX;
          this.y = this.transition.targetY;
        }
      }
      if (prog >= 1.0) {
        // Sicherstellen, dass der Spieler nach Wolkensturz nicht auf Bäumen oder im Wasser landet
        if (this.transition.type === 'fall') {
          const safe = this.findSafeLandingPosition(this.map, this.x, this.y);
          this.x = safe.x;
          this.y = safe.y;
        }

        // Landing puff
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          this.particles.push({
            x: this.x,
            y: this.y + 4,
            vx: Math.cos(angle) * (Math.random() * 25 + 10),
            vy: Math.sin(angle) * (Math.random() * 10 + 5),
            size: Math.random() * 2.5 + 1,
            color: 'rgba(255, 255, 255, 0.7)',
            life: 0.35,
            maxLife: 0.35
          });
        }
        this.transition = null;
        this.transitionCooldown = 0.1;
        this.lastTransitionTile = {
          x: Math.floor(this.x / TILE_SIZE),
          y: Math.floor(this.y / TILE_SIZE)
        };
      }
      return;
    }

    if (this.isDead) {
      this.deathTimer += dt;
      if (this.deathTimer >= 1.2) {
        this.respawn();
      }
      return;
    }

    let dx = 0;
    let dy = 0;

    // Movement-Inputs
    if (input) {
      if (input.keys) {
        if (input.keys['ArrowUp'] || input.keys['KeyW']) dy -= 1;
        if (input.keys['ArrowDown'] || input.keys['KeyS']) dy += 1;
        if (input.keys['ArrowLeft'] || input.keys['KeyA']) dx -= 1;
        if (input.keys['ArrowRight'] || input.keys['KeyD']) dx += 1;
      }
      if (input.joystick && input.joystick.active) {
        dx = input.joystick.x;
        dy = input.joystick.y;
      }
    }

    // Direction & Vector aktualisieren
    if ((dx !== 0 || dy !== 0) && !this.dash.active && this.shield.stunTimer <= 0) {
      this.setDirectionFromVector(dx, dy);
    }

    // ==========================================================================
    // COMBAT INPUTS DISPATCH & TIMERS UPDATE
    // ==========================================================================

    if (input) {
      // Dash (Button A on Mobile/Touch, Space on PC)
      if ((input.keys && input.keys['Space']) || (input.buttons && input.buttons['A'])) {
        this.triggerDash();
      }

      // Melee (Button B on Mobile/Touch, KeyJ or Left Click on PC)
      const meleeDown = Boolean((input.keys && input.keys['KeyJ']) || input.mouseLeft || (input.buttons && input.buttons['B']));
      if (meleeDown && !this.melee.charging) {
        this.startMelee();
      } else if (!meleeDown && this.melee.charging) {
        this.releaseMelee();
      }

      // Shield (Button Y on Mobile/Touch, KeyK or Right Click on PC)
      const shieldDown = Boolean((input.keys && input.keys['KeyK']) || input.mouseRight || (input.buttons && input.buttons['Y']));
      this.setShield(shieldDown);

      // Ranged (Button X on Mobile/Touch, KeyL or KeyF on PC)
      const rangedDown = Boolean((input.keys && (input.keys['KeyL'] || input.keys['KeyF'])) || (input.buttons && input.buttons['X']));
      if (rangedDown && !this.ranged.charging) {
        this.startRanged();
      } else if (!rangedDown && this.ranged.charging) {
        this.releaseRanged();
      }

      this.isSprinting = Boolean(input.keys && (input.keys['ShiftLeft'] || input.keys['ShiftRight']));

      if (input.keys && input.keys['KeyR']) {
        this.respawn();
      }
    }

    // Slow-Debuff abklingen lassen
    if (this.speedSlowTimer > 0) {
      this.speedSlowTimer -= dt;
      if (this.speedSlowTimer <= 0) {
        this.speedSlowFactor = 1.0;
      }
    }

    // HitFlash & Invulnerability
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;

    // 1. Dash-Update
    if (this.dash.active) {
      this.dash.timer -= dt;
      const moveStepX = this.dash.vx * dt;
      const moveStepY = this.dash.vy * dt;

      if (!this.checkCollision(this.x + moveStepX, this.y)) {
        this.x += moveStepX;
      }
      if (!this.checkCollision(this.x, this.y + moveStepY)) {
        this.y += moveStepY;
      }

      // Ghost trail
      if (Math.random() < 0.6) {
        this.dash.ghosts.push({
          x: this.x,
          y: this.y,
          elevY: Math.round(this.visualElevation * ELEVATION_PIXEL_OFFSET),
          alpha: 1.0
        });
      }

      if (this.dash.timer <= 0) {
        this.dash.active = false;
      }
    }

    if (this.dash.cooldown > 0) {
      this.dash.cooldown -= dt;
    }

    // Dash Ghost fading
    for (let g = this.dash.ghosts.length - 1; g >= 0; g--) {
      this.dash.ghosts[g].alpha -= dt * 3.5;
      if (this.dash.ghosts[g].alpha <= 0) {
        this.dash.ghosts.splice(g, 1);
      }
    }

    // 2. Shield drain, broken state full recovery & passive recharge with 1s delay
    const maxShieldEnergy = this.shield.maxEnergy || (COMBAT_CONFIG.SHIELD_MAX + (this.skills?.shield || 0) * 15);
    const shieldSkill = this.skills?.shield || 0;
    const drainFactor = Math.max(0.6, 1.0 - shieldSkill * 0.06);

    if (this.shield.broken) {
      if (this.shield.stunTimer > 0) {
        this.shield.stunTimer -= dt;
      }
      // Erst wieder nutzbar, wenn es EINMAL VOLL (100%) aufgeladen ist!
      this.shield.energy = Math.min(maxShieldEnergy, this.shield.energy + COMBAT_CONFIG.SHIELD_RECHARGE_RATE * dt);
      if (this.shield.energy >= maxShieldEnergy) {
        this.shield.energy = maxShieldEnergy;
        this.shield.broken = false; // Voll aufgeladen und wieder einsatzbereit!
        this.shield.rechargeDelay = 0;
      }
    } else if (this.shield.active) {
      this.shield.rechargeDelay = COMBAT_CONFIG.SHIELD_RECHARGE_DELAY; // 1.0s Pause vorbereiten
      this.shield.energy = Math.max(0, this.shield.energy - COMBAT_CONFIG.SHIELD_DRAIN_RATE * drainFactor * dt);
      if (this.shield.energy <= 0) {
        // Shield Shatters!
        this.shield.broken = true;
        this.shield.active = false;
        this.shield.energy = 0;
        this.shield.stunTimer = COMBAT_CONFIG.SHIELD_STUN_TIME;

        // Shatter burst particles
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spSpeed = Math.random() * 100 + 35;
          this.particles.push({
            x: this.x,
            y: this.y - 10,
            vx: Math.cos(angle) * spSpeed,
            vy: Math.sin(angle) * spSpeed,
            size: Math.random() * 3.5 + 1.5,
            color: '#38bdf8',
            life: 0.5,
            maxLife: 0.5
          });
        }
      }
    } else {
      // Wenn nicht zerbrochen: erst nach 1 Sekunde Pause wieder aufladen
      if (this.shield.rechargeDelay > 0) {
        this.shield.rechargeDelay -= dt;
      } else {
        // Passive Shield Recharge nach 1s Pause
        this.shield.energy = Math.min(maxShieldEnergy, this.shield.energy + COMBAT_CONFIG.SHIELD_RECHARGE_RATE * dt);
      }
    }

    // 3. Melee combo, recovery & charge timers
    if (this.melee.recoveryTimer > 0) {
      this.melee.recoveryTimer -= dt;
      if (this.melee.recoveryTimer <= 0) {
        this.melee.recoveryTimer = 0;
        this.melee.comboStep = 0; // Kombo-Pause beendet, nächster Schlag ist Schnitt 1
      }
    } else if (this.melee.comboTimer > 0) {
      this.melee.comboTimer -= dt;
      if (this.melee.comboTimer <= 0) {
        this.melee.comboStep = 0;
      }
    }
    if (this.melee.charging) {
      this.melee.chargeTimer += dt;
      // Charging aura sparkles
      if (this.melee.chargeTimer >= COMBAT_CONFIG.SPIN_CHARGE_TIME && Math.random() < 0.4) {
        this.particles.push({
          x: this.x + (Math.random() - 0.5) * 16,
          y: this.y - 8 + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 20,
          vy: -Math.random() * 25 - 10,
          size: Math.random() * 2 + 1,
          color: '#67e8f9',
          life: 0.25,
          maxLife: 0.25
        });
      }
    }
    if (this.melee.isSpinning) {
      this.melee.spinTimer -= dt;
      if (this.melee.spinTimer <= 0) {
        this.melee.isSpinning = false;
      }
    }
    if (this.melee.swingProgress < 1.0) {
      const swingSpeed = (this.melee.swingType === 'thrust') ? 2.8 : 5.0;
      this.melee.swingProgress += dt * swingSpeed;
    }

    // 4. Ranged charge timer
    if (this.ranged.charging) {
      this.ranged.chargeTimer += dt;
      if (this.ranged.chargeTimer >= COMBAT_CONFIG.ARROW_CHARGE_TIME && Math.random() < 0.35) {
        this.particles.push({
          x: this.x + (Math.random() - 0.5) * 12,
          y: this.y - 12 + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 15,
          vy: -Math.random() * 20 - 5,
          size: Math.random() * 2 + 1,
          color: '#38bdf8',
          life: 0.2,
          maxLife: 0.2
        });
      }
    }

    // Dash movement override
    if (this.dash.active) {
      const dMoveX = this.dash.vx * dt;
      const dMoveY = this.dash.vy * dt;

      if (!this.checkCollision(this.x + dMoveX, this.y)) this.x += dMoveX;
      if (!this.checkCollision(this.x, this.y + dMoveY)) this.y += dMoveY;

      // Dust puff particles while dashing
      if (Math.random() < 0.6) {
        this.particles.push({
          x: this.x + (Math.random() * 6 - 3),
          y: this.y + 4,
          vx: -this.dash.vx * 0.15 + (Math.random() * 8 - 4),
          vy: -this.dash.vy * 0.15 + (Math.random() * 8 - 4),
          size: Math.random() * 2.2 + 1,
          color: 'rgba(255, 255, 255, 0.6)',
          life: 0.22,
          maxLife: 0.22
        });
      }

      // Record ghost afterimage
      if (Math.random() < 0.5) {
        this.dash.ghosts.push({
          x: this.x,
          y: this.y,
          elevY: Math.round(this.visualElevation * ELEVATION_PIXEL_OFFSET),
          direction: this.direction,
          alpha: 0.65
        });
      }
    }

    this.isMoving = dx !== 0 || dy !== 0;

    // Stun / Shield Movement adjustments
    if (this.shield.stunTimer > 0) {
      dx = 0;
      dy = 0;
      this.isMoving = false;
    }

    if (this.isMoving && !this.dash.active) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;

      this.setDirectionFromVector(dx, dy);

      const currentTileX = Math.floor(this.x / TILE_SIZE);
      const currentTileY = Math.floor(this.y / TILE_SIZE);
      this.speedMod = this.map.getSpeedModifier(currentTileX, currentTileY);

      let speed = this.baseSpeed * this.speedMod;
      if (input.joystick && input.joystick.active) {
        const joyMag = Math.min(1.0, Math.hypot(input.joystick.x, input.joystick.y));
        speed *= Math.max(0.45, joyMag);
      }
      if (this.isSprinting && this.speedMod > 0.5) {
        speed *= PLAYER_CONFIG.SPRINT_MULTIPLIER;
      }
      if (this.shield.active) {
        speed *= 0.38; // Guarding walk
      }
      if (this.melee.isSpinning) {
        speed *= 0.45;
      }
      if (this.speedSlowTimer > 0) {
        speed *= this.speedSlowFactor;
      }
      this.currentSpeed = speed;

      const moveX = dx * speed * dt;
      const moveY = dy * speed * dt;

      // Check previous tile before movement
      const prevTileX = Math.floor(this.x / TILE_SIZE);
      const prevTileY = Math.floor(this.y / TILE_SIZE);
      const prevElev = this.map.getElevation(prevTileX, prevTileY);

      // Sliding collision
      if (!this.checkCollision(this.x + moveX, this.y)) {
        this.x += moveX;
      }
      if (!this.checkCollision(this.x, this.y + moveY)) {
        this.y += moveY;
      }

      // Ledge hop boost: when stepping down an elevation tier, advance player 6px
      // in movement direction so they land cleanly on lower ground without clipping cliff walls
      const newTileX = Math.floor(this.x / TILE_SIZE);
      const newTileY = Math.floor(this.y / TILE_SIZE);
      const newElev = this.map.getElevation(newTileX, newTileY);

      if (newElev < prevElev) {
        if (dx !== 0) {
          const hopX = this.x + Math.sign(dx) * 6;
          if (!this.checkCollision(hopX, this.y)) {
            this.x = hopX;
          }
        }
        if (dy !== 0) {
          const hopY = this.y + Math.sign(dy) * 6;
          if (!this.checkCollision(this.x, hopY)) {
            this.y = hopY;
          }
        }
      }

      // Footstep particles
      if (Math.random() < 0.3) {
        const tile = this.map.getGroundTile(currentTileX, currentTileY);
        let pColor = 'rgba(255,255,255,0.3)';
        if (tile === TILES.SAND || tile === TILES.QUICKSAND) pColor = 'rgba(215, 175, 95, 0.55)';
        if (tile === TILES.SNOW) pColor = 'rgba(235, 245, 255, 0.65)';
        if (tile === TILES.VOID_GROUND) pColor = 'rgba(185, 60, 245, 0.55)';

        this.particles.push({
          x: this.x + (Math.random() * 6 - 3),
          y: this.y + 6,
          vx: -dx * 12 + (Math.random() * 8 - 4),
          vy: -dy * 12 + (Math.random() * 8 - 4),
          size: Math.random() * 2 + 1,
          color: pColor,
          life: 0.3,
          maxLife: 0.3
        });
      }
    } else {
      this.currentSpeed = 0;
    }

    // Check deadly abyss & update elevation
    const curTileX = Math.floor(this.x / TILE_SIZE);
    const curTileY = Math.floor(this.y / TILE_SIZE);

    // Sobald sich der Spieler vom Lande-Kachel wegbewegt, wird der Schutz aufgehoben
    if (this.lastTransitionTile && (this.lastTransitionTile.x !== curTileX || this.lastTransitionTile.y !== curTileY)) {
      this.lastTransitionTile = null;
    }

    if (this.map.isDeadly(curTileX, curTileY)) {
      this.die('void');
    }

    const tileElev = this.map.getElevation(curTileX, curTileY);
    const tileRamp = this.map.getRamp(curTileX, curTileY);
    this.elevation = tileElev;

    // Sanfte optische Höhenanpassung auf Rampen
    if (tileRamp !== RAMPS.NONE) {
      let rampProgress = 0.5;
      const subX = (this.x % TILE_SIZE) / TILE_SIZE;
      const subY = (this.y % TILE_SIZE) / TILE_SIZE;

      if (tileRamp === RAMPS.UP_NORTH) {
        rampProgress = 1.0 - subY;
      } else if (tileRamp === RAMPS.UP_SOUTH) {
        rampProgress = subY;
      } else if (tileRamp === RAMPS.UP_WEST) {
        rampProgress = 1.0 - subX;
      } else if (tileRamp === RAMPS.UP_EAST) {
        rampProgress = subX;
      }

      const targetVis = tileElev + Math.max(0, Math.min(1, rampProgress));
      this.visualElevation += (targetVis - this.visualElevation) * Math.min(1, dt * 15);
    } else {
      this.visualElevation += (tileElev - this.visualElevation) * Math.min(1, dt * 15);
    }

    // Seltene Schreine prüfen (immer prüfen, auch im Stehen)
    this.checkShrines(curTileX, curTileY);

    // Dimension-Trigger prüfen (nur wenn keine Transition läuft, Cooldown vorbei ist und nicht auf Lande-Kachel)
    const isLandingTile = Boolean(this.lastTransitionTile && this.lastTransitionTile.x === curTileX && this.lastTransitionTile.y === curTileY);

    if (!this.transition && this.transitionCooldown <= 0 && !isLandingTile) {
      // 1. Trampolin auf der Oberwelt -> Bounced in die Wolkenwelt
      if (this.game && this.game.currentDimension === 'overworld') {
        if (this.map.isTrampoline && this.map.isTrampoline(curTileX, curTileY)) {
          this.startTransition('trampoline', 'clouds', this.x, this.y, 0.8);
        } else if (this.map.getHoleEntrance) {
          const entrance = this.map.getHoleEntrance(curTileX, curTileY);
          if (entrance) {
            this.startTransition('cave_enter', entrance.targetCave, entrance.targetX * TILE_SIZE + 8, entrance.targetY * TILE_SIZE + 8, 0.65);
          }
        }
      }
      // 2. Freier Himmel in der Wolkenwelt -> Sturzflug zurück zur Oberwelt
      else if (this.game && this.game.currentDimension === 'clouds') {
        const gTile = this.map.getGroundTile(curTileX, curTileY);
        if (gTile === TILES.SKY_ABYSS) {
          this.startTransition('fall', 'overworld', this.x, this.y, 0.85);
        }
      }
      // 3. Lichtschacht oder Leiter in Höhlen
      else if (this.game && this.game.currentDimension === 'caves') {
        if (this.map.exits) {
          const exit = this.map.exits.find(e => e.x === curTileX && e.y === curTileY);
          if (exit) {
            const tType = exit.targetDim === 'overworld' ? 'cave_exit' : 'ladder';
            this.startTransition(tType, exit.targetDim, exit.targetX * TILE_SIZE + 8, exit.targetY * TILE_SIZE + 8, 0.65);
          }
        }
      }
    }
  }

  findSafeLandingPosition(map, startX, startY) {
    if (!map) return { x: startX, y: startY };

    const isSafe = (x, y) => {
      const tx = Math.floor(x / TILE_SIZE);
      const ty = Math.floor(y / TILE_SIZE);
      if (tx < 2 || tx >= map.width - 2 || ty < 2 || ty >= map.height - 2) return false;
      if (map.isDeadly && map.isDeadly(tx, ty)) return false;

      const g = map.getGroundTile(tx, ty);
      if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE ||
          g === TILES.QUICKSAND || g === TILES.SKY_ABYSS) {
        return false;
      }
      if (map.getSpeedModifier && map.getSpeedModifier(tx, ty) <= 0.05) return false;

      if (map.isSolid && map.isSolid(tx, ty)) return false;
      if (map.checkTreeCollision && map.checkTreeCollision(x, y, this.radius || 6)) return false;

      return true;
    };

    // Wenn Zielposition bereits vollkommen frei und sicher ist: direkt nutzen!
    if (isSafe(startX, startY)) {
      return { x: startX, y: startY };
    }

    // Andernfalls: Spiralförmig nach außen suchen, um die nächste freie Kachel daneben zu finden
    const startTileX = Math.floor(startX / TILE_SIZE);
    const startTileY = Math.floor(startY / TILE_SIZE);

    for (let r = 1; r <= 20; r++) {
      const candidates = [];
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = startTileX + dx;
          const ty = startTileY + dy;
          const cx = tx * TILE_SIZE + 8;
          const cy = ty * TILE_SIZE + 8;
          if (isSafe(cx, cy)) {
            candidates.push({ x: cx, y: cy, dist: Math.hypot(cx - startX, cy - startY) });
          }
        }
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.dist - b.dist);
        return { x: candidates[0].x, y: candidates[0].y };
      }
    }

    // Fallback auf Spawn-Punkt
    if (map.spawnPoint) {
      return { x: map.spawnPoint.x * TILE_SIZE + 8, y: map.spawnPoint.y * TILE_SIZE + 8 };
    }
    return { x: startX, y: startY };
  }

  startTransition(type, targetDim, targetX, targetY, duration = 0.8) {
    if (this.transition) return;

    let destX = targetX;
    let destY = targetY;

    if (type === 'fall' && targetDim === 'overworld') {
      const targetMap = (this.game && this.game.overworldMap) ? this.game.overworldMap : this.map;
      const safe = this.findSafeLandingPosition(targetMap, targetX, targetY);
      destX = safe.x;
      destY = safe.y;
    }

    this.transition = {
      type,
      timer: 0,
      duration,
      startX: this.x,
      startY: this.y,
      targetDim,
      targetX: destX,
      targetY: destY,
      switched: false
    };

    if (type === 'trampoline') {
      for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 45 + 25;
        this.particles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40,
          size: Math.random() * 3.5 + 2,
          color: Math.random() > 0.5 ? '#f472b6' : '#fcd34d',
          life: 0.65,
          maxLife: 0.65
        });
      }
    } else if (type === 'fall') {
      for (let i = 0; i < 25; i++) {
        this.particles.push({
          x: this.x + (Math.random() * 20 - 10),
          y: this.y + (Math.random() * 20 - 10),
          vx: (Math.random() - 0.5) * 20,
          vy: Math.random() * 50 + 40,
          size: Math.random() * 3 + 1.5,
          color: 'rgba(255, 255, 255, 0.85)',
          life: 0.5,
          maxLife: 0.5
        });
      }
    }
  }

  checkShrines(tx, ty) {
    if (!this.map.objects) return;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = tx + dx;
        const ny = ty + dy;
        if (nx >= 0 && nx < this.map.width && ny >= 0 && ny < this.map.height) {
          if (this.map.objects[ny][nx] === OBJECTS.SHRINE) {
            const dim = this.game ? (this.game.activeSubCave || this.game.currentDimension) : 'world';
            const shrineKey = `${dim}_${nx}_${ny}`;
            if (!this.discoveredShrines.has(shrineKey)) {
              this.discoveredShrines.add(shrineKey);
              let sName = 'Uralter Geister-Schrein';
              if (this.map.shrines) {
                const found = this.map.shrines.find(s => s.x === nx && s.y === ny);
                if (found) sName = found.name;
              }
              this.shrineMessage = {
                title: '⛩️ SCHREIN ENTDECKT!',
                name: sName,
                total: this.discoveredShrines.size,
                timer: 4.5
              };
              for (let i = 0; i < 35; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 45 + 15;
                this.particles.push({
                  x: nx * TILE_SIZE + 8,
                  y: ny * TILE_SIZE + 8,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  size: Math.random() * 3 + 1.5,
                  color: Math.random() > 0.4 ? '#fcd34d' : '#f472b6',
                  life: 0.9,
                  maxLife: 0.9
                });
              }
            }
          }
        }
      }
    }
  }

  takeDamage(amount, dir = null) {
    if (this.isDead || this.invulnTimer > 0 || this.transition) return false;

    // 1. Dash-Ausweich-Unverwundbarkeit (I-Frames)
    if (this.dash && this.dash.active) {
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('💨 AUSGEWICHEN!', this.x, this.y - 18, '#67e8f9');
      }
      return 'dodged';
    }

    // 2. Schild-Block
    if (this.shield && this.shield.active && this.shield.energy > 0) {
      const shieldSkill = this.skills?.shield || 0;
      const blockEfficiency = Math.max(0.45, 0.85 - shieldSkill * 0.05);
      this.shield.energy = Math.max(0, this.shield.energy - amount * blockEfficiency);
      this.shield.rechargeDelay = COMBAT_CONFIG.SHIELD_RECHARGE_DELAY;
      if (this.game && this.game.combat) {
        this.game.combat.addHitSparks(this.x, this.y, '#38bdf8', 14);
        this.game.combat.addFloatingText('🛡️ GEBLOCKT!', this.x, this.y - 18, '#38bdf8');
      }
      if (this.shield.energy <= 0) {
        this.shield.broken = true;
        this.shield.stunTimer = COMBAT_CONFIG.SHIELD_BREAK_STUN || 1.2;
        this.shield.active = false;
        if (this.game && this.game.combat) {
          this.game.combat.addFloatingText('💥 SCHILD ZERBROCHEN!', this.x, this.y - 26, '#ef4444');
        }
      }
      return 'blocked';
    }

    // 3. Voller Treffer
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.3;
    this.invulnTimer = 0.45;

    // Knockback
    if (dir) {
      const kx = dir.x || 0;
      const ky = dir.y || 0;
      const dist = Math.hypot(kx, ky) || 1;
      this.x += (kx / dist) * 14;
      this.y += (ky / dist) * 14;
    }

    if (this.game && this.game.combat) {
      this.game.combat.addHitSparks(this.x, this.y - 8, '#ef4444', 16);
      this.game.combat.addFloatingText(`-${Math.round(amount)} HP`, this.x, this.y - 22, '#ef4444');
    }

    if (this.game && this.game.camera) {
      this.game.camera.shake(6, 0.22);
    }

    if (this.hp <= 0) {
      this.die('enemy');
    }

    return 'hit';
  }

  applySlow(factor = 0.45, duration = 2.0) {
    this.speedSlowFactor = factor;
    this.speedSlowTimer = duration;
    if (this.game && this.game.combat) {
      this.game.combat.addFloatingText('❄️ VERLANGSAMT', this.x, this.y - 22, '#38bdf8');
    }
  }

  die(cause = 'void') {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTimer = 0;
    this.deathCount++;

    // 1. Calculate and drop 10% of total earned XP at death position (on safe ground if void)
    const totalEarned = this.getTotalXpEarned();
    const dropXp = Math.max(0, Math.round(totalEarned * 0.10));
    const currentDim = this.game?.currentDimension || 'overworld';

    let dropX = this.x;
    let dropY = this.y;
    const curTileX = Math.floor(this.x / TILE_SIZE);
    const curTileY = Math.floor(this.y / TILE_SIZE);
    if (cause === 'void' || (this.map && typeof this.map.isDeadly === 'function' && this.map.isDeadly(curTileX, curTileY))) {
      const safePos = this.findSafeLandingPosition(this.map, this.x, this.y);
      dropX = safePos.x;
      dropY = safePos.y;
    }

    if (this.game && this.game.enemyManager && dropXp > 0) {
      this.game.enemyManager.spawnXp(dropX, dropY, dropXp, currentDim);
    }

    // 2. Exact Level Halving (e.g. 4.70 -> 2.35)
    const oldExactLevel = this.level + (this.xpToNext > 0 ? (this.xp / this.xpToNext) : 0);
    const newExactLevel = Math.max(1.0, oldExactLevel / 2);

    this.level = Math.floor(newExactLevel);
    const fraction = newExactLevel - this.level;
    this.xpToNext = Math.round(50 * Math.pow(1.35, this.level - 1));
    this.xp = Math.round(fraction * this.xpToNext);
    this.totalXpEarned = this.getTotalXpEarned();

    // 3. Even Skill Reduction matching new level
    const targetTotalPoints = Math.max(0, this.level - 1);
    const currentTotalPoints = (this.skills.hp + this.skills.melee + this.skills.range + this.skills.shield) + (this.skillPoints || 0);
    let pointsToRemove = Math.max(0, currentTotalPoints - targetTotalPoints);
    let skillsReducedCount = 0;

    if (pointsToRemove > 0) {
      // First, deduct from unspent skill points
      const deductFromUnspent = Math.min(this.skillPoints || 0, pointsToRemove);
      this.skillPoints -= deductFromUnspent;
      pointsToRemove -= deductFromUnspent;

      // Second, evenly reduce invested skills (round-robin from highest invested skills)
      while (pointsToRemove > 0) {
        const maxVal = Math.max(this.skills.hp, this.skills.melee, this.skills.range, this.skills.shield);
        if (maxVal <= 0) break;

        const candidateSkills = ['hp', 'melee', 'range', 'shield'].filter(s => this.skills[s] === maxVal);
        for (const s of candidateSkills) {
          if (pointsToRemove <= 0) break;
          this.skills[s]--;
          skillsReducedCount++;
          pointsToRemove--;
        }
      }

      // Recalculate stats based on updated skills
      this.maxHp = 100 + (this.skills.hp || 0) * 15;
      this.hp = Math.min(this.hp, this.maxHp);
      const maxShield = COMBAT_CONFIG.SHIELD_MAX + (this.skills.shield || 0) * 15;
      this.shield.maxEnergy = maxShield;
      this.shield.energy = Math.min(this.shield.energy, this.shield.maxEnergy);
    }

    // 4. Record death info for UI overlay
    this.lastDeathInfo = {
      cause,
      oldExactLevel,
      newExactLevel,
      dropXp,
      skillsReducedCount
    };

    if (this.game && this.game.combat) {
      this.game.combat.addFloatingText(`💀 Level halbiert: ${oldExactLevel.toFixed(2)} → ${newExactLevel.toFixed(2)}`, this.x, this.y - 28, '#ef4444', 1.4);
      if (dropXp > 0) {
        this.game.combat.addFloatingText(`✨ -${dropXp} EP verloren`, this.x, this.y - 44, '#facc15', 1.4);
      }
    }

    // Death particle burst
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 35;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * dist,
        vy: Math.sin(angle) * dist,
        size: Math.random() * 3 + 1.5,
        color: Math.random() > 0.5 ? '#d946ef' : '#8b24d6',
        life: 0.7,
        maxLife: 0.7
      });
    }
  }

  checkCollision(targetX, targetY) {
    const r = this.radius;
    const curTileX = Math.floor(this.x / TILE_SIZE);
    const curTileY = Math.floor(this.y / TILE_SIZE);

    const moveDx = targetX - this.x;
    const moveDy = targetY - this.y;

    // Nur Punkte auf der vorderen Kante (Leading Edge) in Bewegungsrichtung prüfen.
    // Verhindert das Hängenbleiben an Kanten, von denen man sich wegbewegt.
    let checkPoints = [];
    if (moveDx > 0) {
      checkPoints = [
        { x: targetX + r, y: targetY - r * 0.7 },
        { x: targetX + r, y: targetY },
        { x: targetX + r, y: targetY + r * 0.7 }
      ];
    } else if (moveDx < 0) {
      checkPoints = [
        { x: targetX - r, y: targetY - r * 0.7 },
        { x: targetX - r, y: targetY },
        { x: targetX - r, y: targetY + r * 0.7 }
      ];
    } else if (moveDy > 0) {
      checkPoints = [
        { x: targetX - r * 0.7, y: targetY + r },
        { x: targetX, y: targetY + r },
        { x: targetX + r * 0.7, y: targetY + r }
      ];
    } else if (moveDy < 0) {
      checkPoints = [
        { x: targetX - r * 0.7, y: targetY - r },
        { x: targetX, y: targetY - r },
        { x: targetX + r * 0.7, y: targetY - r }
      ];
    } else {
      checkPoints = [
        { x: targetX - r, y: targetY - r },
        { x: targetX + r, y: targetY - r },
        { x: targetX - r, y: targetY + r },
        { x: targetX + r, y: targetY + r }
      ];
    }

    for (const pt of checkPoints) {
      const tx = Math.floor(pt.x / TILE_SIZE);
      const ty = Math.floor(pt.y / TILE_SIZE);
      if (this.map.isSolid(tx, ty)) {
        return true;
      }
      // Gleiche Kachel wie Spielerzentrum -> kein Höhenwechsel
      if (tx === curTileX && ty === curTileY) continue;

      // Kantenkollision prüfen
      if (!this.map.isElevationPassable(curTileX, curTileY, tx, ty)) {
        return true;
      }
    }

    // Check tree trunk collision
    if (this.map.checkTreeCollision(targetX, targetY, r)) {
      return true;
    }

    return false;
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  renderParticles(ctx) {
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  render(ctx, spriteManager, animTime = 0, nightFactor = 0) {
    this.renderParticles(ctx);

    const px = Math.round(this.x);
    const elevY = Math.round(this.visualElevation * ELEVATION_PIXEL_OFFSET);

    // Transitions-Höhe & Effekte (Trampolin-Sprung, Freifall, Höhleneinstieg)
    let transOffset = 0;
    let transScale = 1.0;
    let transAlpha = 1.0;

    if (this.transition) {
      const prog = this.transition.timer / this.transition.duration;
      if (this.transition.type === 'trampoline') {
        transOffset = Math.sin(prog * Math.PI) * 45;
        transScale = 1.0 + Math.sin(prog * Math.PI) * 0.35;

        // Aufsteigende Wind- & Glitzerstreifen
        ctx.save();
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.75)';
        ctx.lineWidth = 1.8;
        for (let l = 0; l < 5; l++) {
          const lx = px - 10 + l * 5;
          ctx.beginPath();
          ctx.moveTo(lx, Math.round(this.y) - elevY - transOffset + 8);
          ctx.lineTo(lx, Math.round(this.y) - elevY - transOffset + 22);
          ctx.stroke();
        }
        ctx.restore();
      } else if (this.transition.type === 'fall') {
        if (prog < 0.5) {
          transOffset = prog * 25;
          transScale = 1.0 - prog * 0.4;
          transAlpha = 1.0 - prog * 0.4;
        } else {
          transOffset = (1.0 - prog) * 35;
          transScale = 0.8 + (prog - 0.5) * 0.4;
          transAlpha = 0.6 + (prog - 0.5) * 0.8;
        }

        // Nach unten ziehende Sturzflug-Linien
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.0;
        for (let l = 0; l < 5; l++) {
          const lx = px - 10 + l * 5;
          ctx.beginPath();
          ctx.moveTo(lx, Math.round(this.y) - elevY - transOffset - 20);
          ctx.lineTo(lx, Math.round(this.y) - elevY - transOffset - 6);
          ctx.stroke();
        }
        ctx.restore();
      } else if (this.transition.type === 'cave_enter') {
        if (prog < 0.5) {
          transOffset = -prog * 16;
          transScale = Math.max(0.3, 1.0 - prog * 1.2);
          transAlpha = Math.max(0.3, 1.0 - prog * 1.2);
        } else {
          transOffset = (1.0 - prog) * 20;
          transScale = 0.5 + (prog - 0.5) * 1.0;
          transAlpha = 0.5 + (prog - 0.5) * 1.0;
        }
      } else if (this.transition.type === 'cave_exit' || this.transition.type === 'ladder') {
        if (prog < 0.5) {
          transOffset = prog * 18;
          transScale = 1.0 - prog * 0.5;
          transAlpha = 1.0 - prog * 0.5;
        } else {
          transOffset = -(1.0 - prog) * 14;
          transScale = 0.6 + (prog - 0.5) * 0.8;
          transAlpha = 0.6 + (prog - 0.5) * 0.8;
        }
      }
    }

    const py = Math.round(this.y) - elevY - Math.round(transOffset);
    const bob = this.isMoving ? Math.sin(animTime * 10) * 1.5 : 0;

    if (this.isDead) {
      const progress = this.deathTimer / 1.2;
      ctx.save();
      ctx.translate(this.x, this.y - elevY);
      ctx.rotate(progress * 12);
      ctx.scale(1 - progress, 1 - progress);
      ctx.globalAlpha = 1 - progress;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-6, -12, 12, 16);
      ctx.restore();
      return;
    }

    ctx.save();
    if (transScale !== 1.0 || transAlpha !== 1.0) {
      ctx.translate(px, py);
      ctx.scale(transScale, transScale);
      ctx.globalAlpha = transAlpha;
      ctx.translate(-px, -py);
    }

    // 1. Paper Card Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(px + 1, py + 2, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1b. Level-Up Green Flame Aura (Back Layer)
    if (this.levelUpFlameTimer > 0) {
      const flameAlpha = Math.min(1.0, this.levelUpFlameTimer / 0.45);
      this.renderGreenFlameAura(ctx, px, py, animTime, flameAlpha, true);
    }

    // 2. Folded Papercraft Hero Skin (15 selectable Dark Ghibli skins)
    const skin = (typeof CHARACTERS_MAP !== 'undefined' && CHARACTERS_MAP[this.skinId]) || (typeof CHARACTERS_MAP !== 'undefined' && CHARACTERS_MAP['ren_twilight']);
    if (skin && typeof skin.render === 'function') {
      skin.render(ctx, px, py, animTime, this.direction, this.isMoving, this.hitFlash);
    } else {
      ctx.fillStyle = '#1e2636';
      ctx.beginPath();
      ctx.moveTo(px, py - 20 + bob);
      ctx.lineTo(px + 7, py - 4 + bob);
      ctx.lineTo(px - 7, py - 4 + bob);
      ctx.closePath();
      ctx.fill();
    }

    // 2b. Level-Up Green Flame Aura (Front Layer)
    if (this.levelUpFlameTimer > 0) {
      const flameAlpha = Math.min(1.0, this.levelUpFlameTimer / 0.45);
      this.renderGreenFlameAura(ctx, px, py, animTime, flameAlpha, false);
    }

    // 3. Handheld Paper Lantern on Bamboo Pole (Held during Dusk & Night AND always Underground in Caves)
    const isUnderground = (this.game && this.game.currentDimension === 'caves') ||
      (this.map && this.map.biome && typeof this.map.biome === 'string' && (this.map.biome.includes('Tiefenhöhlen') || this.map.biome.includes('Grotte') || this.map.biome.includes('Höhle')));
    const showLantern = (nightFactor > 0.1) || isUnderground;
    const effectiveIntensity = isUnderground ? 1.0 : nightFactor;

    if (showLantern) {
      const poleSide = this.direction.includes('left') ? -1 : 1;
      const poleX = px + poleSide * 7;
      const poleY = py - 13 + bob;
      ctx.strokeStyle = '#a16207'; // Bamboo pole
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + poleSide * 2, py - 8 + bob);
      ctx.lineTo(poleX, poleY);
      ctx.stroke();

      // Swaying Paper Lantern
      const lSway = (this.isMoving ? Math.sin(animTime * 12) * 2.5 : 0);
      const lanX = poleX + lSway;
      const lanY = poleY + 5;

      const fScale = 1 + Math.sin(animTime * 15) * 0.15;

      // Soft ambient lantern aura
      ctx.fillStyle = `rgba(251, 146, 60, ${0.35 * effectiveIntensity})`;
      ctx.beginPath();
      ctx.arc(lanX, lanY, 7.5 * fScale, 0, Math.PI * 2);
      ctx.fill();

      // Paper lantern body (Warm Orange-Red)
      ctx.fillStyle = `rgba(234, 88, 12, ${effectiveIntensity})`;
      ctx.beginPath();
      ctx.arc(lanX, lanY, 4.2 * fScale, 0, Math.PI * 2);
      ctx.fill();

      // Glowing incandescent filament core (Bright Gold)
      ctx.fillStyle = `rgba(254, 240, 138, ${effectiveIntensity})`;
      ctx.beginPath();
      ctx.arc(lanX, lanY, 2.2 * fScale, 0, Math.PI * 2);
      ctx.fill();

      // Wooden caps on top and bottom of paper lantern
      ctx.fillStyle = '#451a03';
      ctx.fillRect(lanX - 1.5, lanY - 4.5 * fScale, 3, 1);
      ctx.fillRect(lanX - 1.5, lanY + 3.5 * fScale, 3, 1);
    }

    // 4. COMBAT WEAPONS & ABILITY RENDERING

    // 4a. Sword & Melee Attack Rendering
    if (this.melee.charging) {
      const facingRight = this.direction.includes('right');
      const swordSide = facingRight ? 1 : -1;
      const hiltX = px + swordSide * 5;
      const hiltY = py - 14 + bob;
      const chargeProg = Math.min(1.0, this.melee.chargeTimer / COMBAT_CONFIG.SPIN_CHARGE_TIME);

      // Sword Hilt
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hiltX, hiltY);
      ctx.lineTo(hiltX + swordSide * 2, hiltY - 4);
      ctx.stroke();

      // Gleaming silver paper blade (turns glowing cyan when fully charged)
      ctx.strokeStyle = chargeProg >= 1.0 ? '#38bdf8' : '#e2e8f0';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(hiltX + swordSide * 2, hiltY - 4);
      ctx.lineTo(hiltX + swordSide * 5, hiltY - 18);
      ctx.stroke();

      // Gleam spark at blade tip
      ctx.fillStyle = chargeProg >= 1.0 ? '#fef08a' : '#38bdf8';
      ctx.fillRect(hiltX + swordSide * 5 - 1.5, hiltY - 19.5, 3, 3);
    } else if (this.melee.swingProgress < 1.0 && this.melee.swingType) {
      const swProg = this.melee.swingProgress;
      const swAngle = this.getFacingAngle();

      ctx.save();
      ctx.translate(px, py - 10 + bob);

      if (this.melee.swingType === 'thrust') {
        ctx.rotate(swAngle);
        // Linear thrust motion: shoots forward quickly, holds pose, then retracts
        const thrustExtend = Math.sin(swProg * Math.PI) * 16;
        const swordLen = 22;

        // Thrust Speed Lines around blade
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(thrustExtend, -4);
        ctx.lineTo(thrustExtend + swordLen + 6, -4);
        ctx.moveTo(thrustExtend, 4);
        ctx.lineTo(thrustExtend + swordLen + 6, 4);
        ctx.stroke();

        // Glowing white / silver blade
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(4 + thrustExtend, 0);
        ctx.lineTo(4 + thrustExtend + swordLen, 0);
        ctx.stroke();

        // Sharp golden arrowhead spear tip
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(4 + thrustExtend + swordLen + 5, 0);
        ctx.lineTo(4 + thrustExtend + swordLen - 4, -3);
        ctx.lineTo(4 + thrustExtend + swordLen - 2, 0);
        ctx.lineTo(4 + thrustExtend + swordLen - 4, 3);
        ctx.closePath();
        ctx.fill();

        // Red lacquered grip
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(2 + thrustExtend, -1.5, 3, 3);
      } else {
        // Slashes 1 & 2: Curved sweeping blade
        ctx.rotate(swAngle + (swProg - 0.5) * (this.melee.swingType === 'slash2' ? -1.8 : 1.8));

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();

        ctx.fillStyle = '#ef4444'; // Red grip wrap
        ctx.fillRect(2, -1.5, 3, 3);
      }
      ctx.restore();
    }

    // 4a2. 360 Spin Attack Whirling Twin Blades
    if (this.melee.isSpinning) {
      const spinAngle = animTime * 32;
      ctx.save();
      ctx.translate(px, py - 10 + bob);
      for (let s = 0; s < 2; s++) {
        const curAngle = spinAngle + s * Math.PI;
        ctx.save();
        ctx.rotate(curAngle);

        // Radiant Cyan Blade
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(26, 0);
        ctx.stroke();

        // Glowing white cutting edge
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(28, 0);
        ctx.stroke();

        // Sharp tip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(24, -3.5);
        ctx.lineTo(24, 3.5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
      ctx.restore();
    }

    // 4b. Bow & Arrow Aiming
    if (this.ranged.charging) {
      const bowAngle = this.getFacingAngle();

      ctx.save();
      ctx.translate(px, py - 10 + bob);
      ctx.rotate(bowAngle);

      // Curved Bamboo Bow
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(8, 0, 10, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();

      // Pulled Bowstring
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(8 + Math.cos(-Math.PI * 0.35) * 10, Math.sin(-Math.PI * 0.35) * 10);
      ctx.lineTo(2, 0);
      ctx.lineTo(8 + Math.cos(Math.PI * 0.35) * 10, Math.sin(Math.PI * 0.35) * 10);
      ctx.stroke();

      // Nocked Paper Arrow
      ctx.strokeStyle = (this.ranged.chargeTimer >= COMBAT_CONFIG.ARROW_CHARGE_TIME) ? '#38bdf8' : '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(16, 0);
      ctx.stroke();

      ctx.restore();
    }

    // 4c. Translucent Shimmering Bubble Shield (Smash Bros / Zelda Style)
    if (this.shield.active) {
      const sRadius = 14 + (this.shield.energy / 100) * 8;
      const sPulse = Math.sin(animTime * 10) * 0.6;
      const rad = sRadius + sPulse;

      const sGrad = ctx.createRadialGradient(px, py - 10 + bob, rad * 0.2, px, py - 10 + bob, rad);
      const isLow = this.shield.energy < 25;
      if (isLow) {
        sGrad.addColorStop(0, 'rgba(239, 68, 68, 0.08)');
        sGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.35)');
        sGrad.addColorStop(1, 'rgba(254, 202, 202, 0.88)');
      } else {
        sGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
        sGrad.addColorStop(0.68, 'rgba(14, 165, 233, 0.35)');
        sGrad.addColorStop(1, 'rgba(224, 242, 254, 0.85)');
      }

      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(px, py - 10 + bob, rad, 0, Math.PI * 2);
      ctx.fill();

      // Hexagonal origami shield facet seams
      ctx.strokeStyle = isLow ? 'rgba(248, 113, 113, 0.85)' : 'rgba(186, 230, 253, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let h = 0; h < 6; h++) {
        const hAngle = animTime * 1.5 + (h / 6) * Math.PI * 2;
        const hx = px + Math.cos(hAngle) * rad;
        const hy = py - 10 + bob + Math.sin(hAngle) * rad;
        if (h === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 4d. Stun Stars on Shield Break
    if (this.shield.broken && this.shield.stunTimer > 0) {
      for (let st = 0; st < 3; st++) {
        const stAngle = animTime * 8 + (st / 3) * Math.PI * 2;
        const stX = px + Math.cos(stAngle) * 9;
        const stY = py - 26 + bob + Math.sin(stAngle) * 3;
        ctx.fillStyle = '#facc15';
        ctx.fillRect(stX - 1.5, stY - 1.5, 3, 3);
      }
    }

    // 4e. Dash Ghost Trails
    for (const ghost of this.dash.ghosts) {
      ctx.save();
      ctx.globalAlpha = ghost.alpha * 0.45;
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.ellipse(ghost.x, ghost.y - ghost.elevY - 10, 7, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4f. Compact Overhead Health Bar (when damaged)
    if (this.hp < this.maxHp && this.hp > 0 && !this.isDead) {
      const barW = 24;
      const barH = 3.5;
      const barX = px - barW / 2;
      const barY = py - 26 + bob;
      const hpPct = Math.max(0, this.hp / this.maxHp);

      ctx.save();
      // Paper border & dark drop shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      // Health Fill (dynamic green -> yellow -> red)
      ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : (hpPct > 0.25 ? '#f59e0b' : '#ef4444');
      ctx.fillRect(barX, barY, barW * hpPct, barH);
      ctx.restore();
    }

    // 4g. Overhead Player Nameplate (Dark Ghibli Papercraft)
    if (this.name && !this.isDead) {
      ctx.save();
      ctx.font = 'bold 8.5px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const nameY = (this.hp < this.maxHp) ? py - 33 + bob : py - 27 + bob;
      const textMetrics = (typeof ctx.measureText === 'function') ? ctx.measureText(this.name) : { width: this.name.length * 5.5 };
      const textW = Math.max(16, textMetrics.width);
      const padX = 4;
      const badgeH = 11;

      // Dark Papercraft Badge & Drop Shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.fillRect(px - textW / 2 - padX, nameY - badgeH / 2, textW + padX * 2, badgeH);

      // Delicate Paper Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(px - textW / 2 - padX, nameY - badgeH / 2, textW + padX * 2, badgeH);

      // Pure White Text
      ctx.fillStyle = '#f8fafc';
      if (typeof ctx.fillText === 'function') {
        ctx.fillText(this.name, px, nameY);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  renderGreenFlameAura(ctx, px, py, animTime, alpha, behind = false) {
    if (alpha <= 0) return;

    ctx.save();
    if (behind) {
      // 1. Soft Emerald Glow Radial Gradient
      const glowPulse = 1.0 + Math.sin(animTime * 12) * 0.15;
      const grad = ctx.createRadialGradient(px, py - 10, 2, px, py - 10, 28 * glowPulse);
      grad.addColorStop(0, `rgba(74, 222, 128, ${0.45 * alpha})`);
      grad.addColorStop(0.5, `rgba(34, 197, 94, ${0.28 * alpha})`);
      grad.addColorStop(1, 'rgba(22, 101, 52, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py - 10, 28 * glowPulse, 0, Math.PI * 2);
      ctx.fill();

      // 2. Background Flame Tongues (Darker Emerald & Forest Green)
      for (let i = 0; i < 5; i++) {
        const tOff = i * 1.35;
        const sway = Math.sin(animTime * 11 + tOff) * 3.5;
        const hFluct = Math.cos(animTime * 13 + tOff) * 4;
        const bx = px - 9 + i * 4.5;
        const by = py - 1;
        const tipX = px - 11 + i * 5.5 + sway;
        const tipY = py - 24 - (i % 2 === 0 ? 6 : 2) + hFluct;

        ctx.fillStyle = (i % 2 === 0)
          ? `rgba(22, 163, 74, ${0.75 * alpha})`
          : `rgba(34, 197, 94, ${0.85 * alpha})`;

        ctx.beginPath();
        ctx.moveTo(bx - 3.5, by);
        ctx.quadraticCurveTo(bx - 6 + sway * 0.5, (by + tipY) * 0.5, tipX, tipY);
        ctx.quadraticCurveTo(bx + 6 + sway * 0.5, (by + tipY) * 0.5, bx + 3.5, by);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // 3. Foreground Flame Tongues (Vibrant Mint & Bright Green)
      for (let i = 0; i < 4; i++) {
        const tOff = i * 1.6 + 2.1;
        const sway = Math.sin(animTime * 14 + tOff) * 3.0;
        const hFluct = Math.sin(animTime * 16 + tOff) * 3.5;
        const bx = px - 6 + i * 4;
        const by = py - 2;
        const tipX = px - 6 + i * 4 + sway;
        const tipY = py - 19 - (i % 2 === 1 ? 5 : 1) + hFluct;

        // Outer bright flame
        ctx.fillStyle = (i % 2 === 0)
          ? `rgba(74, 222, 128, ${0.85 * alpha})`
          : `rgba(134, 239, 172, ${0.90 * alpha})`;

        ctx.beginPath();
        ctx.moveTo(bx - 2.8, by);
        ctx.quadraticCurveTo(bx - 4.5 + sway * 0.4, (by + tipY) * 0.5, tipX, tipY);
        ctx.quadraticCurveTo(bx + 4.5 + sway * 0.4, (by + tipY) * 0.5, bx + 2.8, by);
        ctx.closePath();
        ctx.fill();

        // White-hot spirit inner core
        ctx.fillStyle = `rgba(240, 253, 244, ${0.85 * alpha})`;
        ctx.beginPath();
        ctx.moveTo(bx - 1.2, by);
        ctx.quadraticCurveTo(bx - 2.2 + sway * 0.3, (by + tipY) * 0.6, tipX * 0.7 + bx * 0.3, tipY + 4);
        ctx.quadraticCurveTo(bx + 2.2 + sway * 0.3, (by + tipY) * 0.6, bx + 1.2, by);
        ctx.closePath();
        ctx.fill();
      }

      // 4. Floating Spirit Flame Embers
      for (let e = 0; e < 6; e++) {
        const eProg = (animTime * 2.8 + e * 0.38) % 1.0;
        const eX = px + Math.sin(animTime * 5 + e * 2.2) * (11 + e * 1.8);
        const eY = py - eProg * 32;
        const emberAlpha = Math.sin(eProg * Math.PI) * alpha;

        ctx.fillStyle = `rgba(187, 247, 208, ${emberAlpha})`;
        ctx.beginPath();
        ctx.arc(eX, eY, 1.4 + (1 - eProg) * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
