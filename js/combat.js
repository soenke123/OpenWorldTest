import { TILE_SIZE, COMBAT_CONFIG, OBJECTS, TILES, OBJ_PROPS, TILE_PROPS } from './constants.js';

export class CombatManager {
  constructor(game) {
    this.game = game;
    this.flyingArrows = [];
    this.stuckArrows = [];
    this.slashEffects = [];
    this.hitSparks = [];
    this.floatingTexts = [];

    // Enemy Attacks & Hazard Systems
    this.enemyProjectiles = [];
    this.shockwaves = [];
    this.celestialStrikes = [];
    this.hazardPuddles = [];
    this.grapplingHooks = [];
    this.defeatPoofs = [];

    // Training Dummies for target practice & feedback
    this.dummies = [];
    this.initTrainingDummies();
  }

  initTrainingDummies() {
    // 3 Straw & Paper Training Dummies positioned right in front of the overworld spawn (30, 45)
    this.dummies = [
      { id: 1, x: 26 * TILE_SIZE + 8, y: 43 * TILE_SIZE + 8, startX: 26 * TILE_SIZE + 8, startY: 43 * TILE_SIZE + 8, vx: 0, vy: 0, wobble: 0, wobbleTimer: 0, hitTimer: 0, hp: 100 },
      { id: 2, x: 25 * TILE_SIZE + 8, y: 45 * TILE_SIZE + 8, startX: 25 * TILE_SIZE + 8, startY: 45 * TILE_SIZE + 8, vx: 0, vy: 0, wobble: 0, wobbleTimer: 0, hitTimer: 0, hp: 100 },
      { id: 3, x: 26 * TILE_SIZE + 8, y: 47 * TILE_SIZE + 8, startX: 26 * TILE_SIZE + 8, startY: 47 * TILE_SIZE + 8, vx: 0, vy: 0, wobble: 0, wobbleTimer: 0, hitTimer: 0, hp: 100 }
    ];
  }

  isWaterOrAbyssTile(tile) {
    return tile === TILES.WATER ||
           tile === TILES.SWAMP_WATER ||
           tile === TILES.CAVE_WATER ||
           tile === TILES.VOID_LAKE ||
           tile === TILES.SKY_ABYSS;
  }

  isArrowObstacle(map, tX, tY) {
    if (!map || !map.isValid || !map.isValid(tX, tY)) return true;

    // Check solid objects (rocks, tree trunks, cacti, stalagmites, etc.)
    const obj = map.getObjectTile ? map.getObjectTile(tX, tY) : (map.objects ? map.objects[tY]?.[tX] : 0);
    const objProps = OBJ_PROPS[obj];
    if (objProps && objProps.solid) return true;

    // Check ground solidity EXCEPT for water and abyss (arrows fly freely over liquids!)
    const ground = map.getGroundTile ? map.getGroundTile(tX, tY) : (map.ground ? map.ground[tY]?.[tX] : 0);
    if (this.isWaterOrAbyssTile(ground)) {
      return false;
    }

    const groundProps = TILE_PROPS[ground];
    if (groundProps && groundProps.solid) return true;

    return false;
  }

  createWaterSplash(x, y, tile) {
    let dropColor1 = '#38bdf8';
    let dropColor2 = '#e0f2fe';
    let rippleColor = 'rgba(56, 189, 248, 0.6)';

    if (tile === TILES.SWAMP_WATER) {
      dropColor1 = '#84cc16';
      dropColor2 = '#4d7c0f';
      rippleColor = 'rgba(101, 163, 13, 0.6)';
    } else if (tile === TILES.VOID_LAKE) {
      dropColor1 = '#c084fc';
      dropColor2 = '#6b21a8';
      rippleColor = 'rgba(168, 85, 247, 0.6)';
    }

    // Droplets jumping into the air
    for (let i = 0; i < 12; i++) {
      const spAngle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 35 + 15;
      this.hitSparks.push({
        x,
        y,
        vx: Math.cos(spAngle) * speed,
        vy: Math.sin(spAngle) * speed * 0.5 - (Math.random() * 25 + 15),
        color: Math.random() > 0.4 ? dropColor1 : dropColor2,
        size: Math.random() * 2.2 + 1.2,
        life: 0.35,
        maxLife: 0.35
      });
    }

    // Ripples
    for (let r = 0; r < 3; r++) {
      const rAngle = (r / 3) * Math.PI * 2;
      this.hitSparks.push({
        x: x + Math.cos(rAngle) * 3,
        y: y + Math.sin(rAngle) * 2,
        vx: Math.cos(rAngle) * 12,
        vy: Math.sin(rAngle) * 6,
        color: rippleColor,
        size: 2.5,
        life: 0.4,
        maxLife: 0.4
      });
    }

    this.addFloatingText('💧 Platsch!', x, y - 10, dropColor1, 0.55);
  }

  fireArrow(startX, startY, dirX, dirY, isCharged = false) {
    const angle = Math.atan2(dirY, dirX);
    const rangeSkill = this.game?.player?.skills?.range || 0;
    const baseSpeed = isCharged ? COMBAT_CONFIG.ARROW_CHARGED_SPEED : COMBAT_CONFIG.ARROW_SPEED;
    const baseRange = isCharged ? COMBAT_CONFIG.ARROW_CHARGED_RANGE : COMBAT_CONFIG.ARROW_RANGE;
    const speed = baseSpeed + rangeSkill * 25;
    const maxRange = baseRange + rangeSkill * 35;

    this.flyingArrows.push({
      dimension: this.game?.currentDimension || 'overworld',
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      distTraveled: 0,
      maxRange,
      isCharged,
      speed,
      trailTimer: 0
    });

    // Muzzle wind puff
    for (let i = 0; i < (isCharged ? 10 : 5); i++) {
      const spread = (Math.random() - 0.5) * 0.8;
      const pSpeed = Math.random() * 40 + 20;
      this.hitSparks.push({
        x: startX + Math.cos(angle) * 8,
        y: startY + Math.sin(angle) * 8,
        vx: Math.cos(angle + spread) * pSpeed,
        vy: Math.sin(angle + spread) * pSpeed,
        color: isCharged ? '#38bdf8' : '#f8fafc',
        size: Math.random() * 2 + 1,
        life: 0.25,
        maxLife: 0.25
      });
    }
  }

  addSlashEffect(type, x, y, angle, radius = 28) {
    let duration = 0.22;
    if (type === 'spin' || type === 'bear_spin') duration = 0.32;
    if (type === 'thrust' || type === 'bear_thrust') duration = 0.32; // Longer duration for powerful lingering thrust
    if (type === 'bear_claw1' || type === 'bear_claw2') duration = 0.26;

    this.slashEffects.push({
      type,
      x,
      y,
      angle,
      radius,
      timer: 0,
      duration
    });

    // Air gust & paper spark particles
    const isBear = type.startsWith('bear_');
    const sparkCount = (type === 'spin' || type === 'bear_spin') ? 24 : ((type === 'thrust' || type === 'bear_thrust') ? 22 : 12);
    for (let i = 0; i < sparkCount; i++) {
      let pAngle;
      if (type === 'spin' || type === 'bear_spin') {
        pAngle = (i / sparkCount) * Math.PI * 2;
      } else if (type === 'thrust' || type === 'bear_thrust') {
        pAngle = angle + (Math.random() - 0.5) * 0.4;
      } else {
        pAngle = angle + (Math.random() - 0.5) * 1.0;
      }

      const pSpeed = (type === 'thrust' || type === 'bear_thrust') ? (Math.random() * 150 + 60) : (Math.random() * 90 + 40);
      let color = '#ffffff';
      if (isBear) {
        color = Math.random() > 0.4 ? '#22c55e' : (Math.random() > 0.5 ? '#86efac' : '#facc15');
      } else if (type === 'spin') {
        color = '#67e8f9';
      } else if (type === 'thrust') {
        color = Math.random() > 0.4 ? '#fef08a' : '#f59e0b';
      }

      this.hitSparks.push({
        x: x + Math.cos(pAngle) * (radius * 0.5),
        y: y + Math.sin(pAngle) * (radius * 0.5),
        vx: Math.cos(pAngle) * pSpeed,
        vy: Math.sin(pAngle) * pSpeed,
        color,
        size: Math.random() * 2.8 + 1.2,
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  addHitSparks(x, y, color = '#facc15', count = 10, speed = 80) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sp = Math.random() * speed + speed * 0.4;
      this.hitSparks.push({
        x,
        y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        color,
        size: Math.random() * 2.5 + 1.2,
        life: 0.28,
        maxLife: 0.28
      });
    }
  }

  addFloatingText(text, x, y, color = '#ffffff', duration = 0.65) {
    this.floatingTexts.push({
      text,
      x,
      y,
      timer: 0,
      duration,
      color
    });
  }

  addDefeatPoof(x, y, category = 'normal', dimension = null) {
    const count = category === 'boss' ? 32 : 18;
    const colors = category === 'boss' ? ['#facc15', '#f43f5e', '#a855f7', '#ffffff'] : ['#f8fafc', '#e2e8f0', '#cbd5e1', '#fef08a'];
    const dim = dimension || this.game?.currentDimension || 'overworld';
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sp = Math.random() * 70 + 20;
      this.defeatPoofs.push({
        dimension: dim,
        x,
        y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp - 25,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8,
        life: 0.65,
        maxLife: 0.65
      });
    }
  }

  fireEnemyProjectile(config) {
    this.enemyProjectiles.push({
      dimension: config.dimension || this.game?.currentDimension || 'overworld',
      type: config.type || 'generic',
      x: config.x,
      y: config.y,
      dirX: config.dirX,
      dirY: config.dirY,
      speed: config.speed || 200,
      damage: config.damage || 15,
      color: config.color || '#ef4444',
      radius: config.radius || 5,
      maxDist: config.maxDist || 200,
      distTraveled: 0,
      trailTimer: 0,
      spawnsPuddle: Boolean(config.spawnsPuddle),
      slowsPlayer: Boolean(config.slowsPlayer),
      knockbackPlayer: config.knockbackPlayer || 0
    });
  }

  createShockwave(x, y, maxRadius, damage, color = '#f59e0b', slowsPlayer = false, dimension = null) {
    this.shockwaves.push({
      dimension: dimension || this.game?.currentDimension || 'overworld',
      x,
      y,
      maxRadius,
      currentRadius: 4,
      damage,
      color,
      slowsPlayer,
      duration: 0.42,
      timer: 0,
      hasHitPlayer: false
    });
  }

  spawnCelestialStrike(targetX, targetY, damage, dimension = null) {
    this.celestialStrikes.push({
      dimension: dimension || this.game?.currentDimension || 'overworld',
      targetX,
      targetY,
      damage,
      delay: 0.75,
      timer: 0,
      impacted: false
    });
  }

  spawnHazardPuddle(x, y, radius = 18, duration = 4.5, damage = 10, color = '#a855f7', dimension = null) {
    this.hazardPuddles.push({
      dimension: dimension || this.game?.currentDimension || 'overworld',
      x,
      y,
      radius,
      duration,
      timer: 0,
      damage,
      color,
      tickTimer: 0
    });
  }

  fireGrapplingHook(enemy, targetX, targetY) {
    const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
    const speed = 400;
    this.grapplingHooks.push({
      dimension: enemy.dimension || this.game?.currentDimension || 'overworld',
      enemy,
      startX: enemy.x,
      startY: enemy.y,
      tipX: enemy.x,
      tipY: enemy.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      length: 0,
      maxLength: 230,
      state: 'extend', // 'extend' | 'pull' | 'retract'
      color: enemy.typeId === 'frost_giant' ? '#7dd3fc' : '#94a3b8',
      hookColor: enemy.typeId === 'frost_giant' ? '#38bdf8' : '#78350f',
      damage: 18
    });
  }

  checkMeleeHits(hitbox) {
    let hitAny = false;
    const isSpin = hitbox.type === 'spin' || hitbox.type === 'bear_spin';
    const isThrust = hitbox.type === 'thrust' || hitbox.type === 'bear_thrust';

    // Check collision with training dummies
    for (const dummy of this.dummies) {
      if (this.game.currentDimension !== 'overworld') continue;

      const dx = dummy.x - hitbox.x;
      const dy = dummy.y - hitbox.y;
      const dist = Math.hypot(dx, dy);

      let inRange = false;
      if (isSpin) {
        inRange = dist <= (hitbox.radius + 10);
      } else if (isThrust) {
        // Forward piercing cone / capsule
        const forwardDot = (dx * Math.cos(hitbox.angle) + dy * Math.sin(hitbox.angle));
        const sideDist = Math.abs(-dx * Math.sin(hitbox.angle) + dy * Math.cos(hitbox.angle));
        inRange = (forwardDot > 0 && forwardDot <= hitbox.range && sideDist <= (hitbox.width || 22));
      } else {
        // Slash arc (~60 degree cone in front)
        const forwardDot = (dx * Math.cos(hitbox.angle) + dy * Math.sin(hitbox.angle));
        const angleDiff = Math.abs(Math.atan2(dy, dx) - hitbox.angle);
        const normAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        inRange = (dist <= hitbox.radius && Math.abs(normAngleDiff) <= 0.85);
      }

      if (inRange) {
        hitAny = true;
        this.applyHitToDummy(dummy, hitbox);
      }
    }

    // Check collision with active enemies
    if (this.game && this.game.enemyManager) {
      const enemies = this.game.enemyManager.getActiveEnemies();
      for (const enemy of enemies) {
        const dx = enemy.x - hitbox.x;
        const dy = enemy.y - hitbox.y;
        const dist = Math.hypot(dx, dy);

        let inRange = false;
        if (isSpin) {
          inRange = dist <= (hitbox.radius + enemy.radius + 4);
        } else if (isThrust) {
          const forwardDot = (dx * Math.cos(hitbox.angle) + dy * Math.sin(hitbox.angle));
          const sideDist = Math.abs(-dx * Math.sin(hitbox.angle) + dy * Math.cos(hitbox.angle));
          inRange = (forwardDot > 0 && forwardDot <= hitbox.range + enemy.radius && sideDist <= (hitbox.width || 22) + enemy.radius);
        } else {
          const forwardDot = (dx * Math.cos(hitbox.angle) + dy * Math.sin(hitbox.angle));
          const angleDiff = Math.abs(Math.atan2(dy, dx) - hitbox.angle);
          const normAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
          inRange = (dist <= hitbox.radius + enemy.radius && Math.abs(normAngleDiff) <= 0.95);
        }

        if (inRange) {
          hitAny = true;
          let dmg = 25;
          if (hitbox.type === 'slash2' || hitbox.type === 'bear_claw2') dmg = 35;
          if (isThrust) dmg = 52;
          if (isSpin) dmg = 68;

          const meleeBonus = (this.game?.player?.skills?.melee || 0) * 4;
          dmg += meleeBonus;

          if (hitbox.damageMultiplier) {
            dmg = Math.round(dmg * hitbox.damageMultiplier);
          } else if (hitbox.damage) {
            dmg = hitbox.damage;
          }

          const angle = isSpin ? Math.atan2(enemy.y - hitbox.y, enemy.x - hitbox.x) : hitbox.angle;
          let kb = hitbox.knockback || (isThrust ? 120 : (isSpin ? 140 : 80));
          if (hitbox.knockbackMultiplier) {
            kb = Math.round(kb * hitbox.knockbackMultiplier);
          }
          enemy.takeDamage(dmg, angle, kb, this);
        }
      }
    }

    // Check collision with remote players (LAN Multiplayer PvP)
    if (this.game && this.game.remotePlayers && this.game.network && this.game.network.connected) {
      const curDim = this.game.currentDimension || 'overworld';
      for (const remotePlayer of this.game.remotePlayers.values()) {
        if (remotePlayer.id === this.game.network.clientId) continue;
        if (remotePlayer.isDead || (remotePlayer.dimension && remotePlayer.dimension !== curDim)) continue;

        const dx = remotePlayer.x - hitbox.x;
        const dy = remotePlayer.y - hitbox.y;
        const dist = Math.hypot(dx, dy);

        let inRange = false;
        if (isSpin) {
          inRange = dist <= (hitbox.radius + remotePlayer.radius + 4);
        } else if (isThrust) {
          const forwardDot = (dx * Math.cos(hitbox.angle) + dy * Math.sin(hitbox.angle));
          const sideDist = Math.abs(-dx * Math.sin(hitbox.angle) + dy * Math.cos(hitbox.angle));
          inRange = (forwardDot > 0 && forwardDot <= hitbox.range + remotePlayer.radius && sideDist <= (hitbox.width || 22) + remotePlayer.radius);
        } else {
          const forwardDot = (dx * Math.cos(hitbox.angle) + dy * Math.sin(hitbox.angle));
          const angleDiff = Math.abs(Math.atan2(dy, dx) - hitbox.angle);
          const normAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
          inRange = (dist <= hitbox.radius + remotePlayer.radius && Math.abs(normAngleDiff) <= 0.95);
        }

        if (inRange) {
          hitAny = true;
          let dmg = 25;
          if (hitbox.type === 'slash2' || hitbox.type === 'bear_claw2') dmg = 35;
          if (isThrust) dmg = 52;
          if (isSpin) dmg = 68;

          const meleeBonus = (this.game?.player?.skills?.melee || 0) * 4;
          dmg += meleeBonus;

          if (hitbox.damageMultiplier) {
            dmg = Math.round(dmg * hitbox.damageMultiplier);
          } else if (hitbox.damage) {
            dmg = hitbox.damage;
          }

          const angle = isSpin ? Math.atan2(dy, dx) : hitbox.angle;
          let kb = hitbox.knockback || (isThrust ? 120 : (isSpin ? 140 : 80));
          if (hitbox.knockbackMultiplier) {
            kb = Math.round(kb * hitbox.knockbackMultiplier);
          }

          // Shield block check
          if (remotePlayer.shieldActive) {
            this.addHitSparks(remotePlayer.x, remotePlayer.y, '#38bdf8', 16, 90);
            this.addFloatingText('🛡️ GEBLOCKT!', remotePlayer.x, remotePlayer.y - 16, '#38bdf8');
            dmg = Math.round(dmg * 0.2); // 80% Schadensreduktion
          } else {
            this.addHitSparks(remotePlayer.x, remotePlayer.y, '#ef4444', 12, 70);
            this.addFloatingText(`-${dmg}`, remotePlayer.x, remotePlayer.y - 14, '#f87171');
          }

          const kbX = Math.cos(angle) * (kb * 0.4);
          const kbY = Math.sin(angle) * (kb * 0.4);
          this.game.network.sendPvPHit(remotePlayer.id, dmg, kbX, kbY);
        }
      }
    }

    // Heavy thrust or spin attack camera shake impact
    if (hitAny && this.game && this.game.camera) {
      if (isThrust) {
        this.game.camera.shake(4.5, 0.18);
      } else if (isSpin) {
        this.game.camera.shake(4.0, 0.16);
      }
    }

    return hitAny;
  }

  spawnVoidTeleportVFX(x, y, isArrival = false) {
    const dim = this.game?.currentDimension || 'overworld';
    const count = isArrival ? 35 : 28;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = isArrival ? (Math.random() * 90 + 30) : -(Math.random() * 70 + 20);
      const dist = isArrival ? (Math.random() * 8) : (Math.random() * 25 + 10);
      this.hitSparks.push({
        dimension: dim,
        x: x + Math.cos(ang) * dist,
        y: (y - 8) + Math.sin(ang) * dist,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 5,
        color: Math.random() > 0.4 ? '#a855f7' : (Math.random() > 0.5 ? '#c084fc' : '#ffffff'),
        size: Math.random() * 3 + 1.5,
        life: 0.55,
        maxLife: 0.55
      });
    }
    this.createShockwave(x, y - 8, isArrival ? 32 : 24, 0, '#a855f7', false, dim);
  }

  spawnPlasmaExplosion(x, y, radius = 36, damage = 45, knockback = 90) {
    const dim = this.game?.currentDimension || 'overworld';
    this.createShockwave(x, y, radius, 0, '#ec4899', false, dim);

    if (this.game?.camera) {
      this.game.camera.shake(1.6, 0.12);
    }

    this.addFloatingText('💥 PLASMA!', x, y - 18, '#f472b6', 0.85);

    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = Math.random() * 80 + 25;
      this.hitSparks.push({
        dimension: dim,
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 10,
        color: Math.random() > 0.4 ? '#ec4899' : (Math.random() > 0.5 ? '#f472b6' : '#ffffff'),
        size: Math.random() * 2.8 + 1.2,
        life: 0.4,
        maxLife: 0.4
      });
    }

    if (this.game?.enemyManager) {
      const enemies = this.game.enemyManager.getActiveEnemies();
      for (const enemy of enemies) {
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist <= radius + (enemy.radius || 12)) {
          const angle = dist > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
          enemy.takeDamage(damage, angle, knockback, this);
        }
      }
    }

    // PvP: Treffer auf andere Mitspieler im LAN-Multiplayer
    if (this.game && this.game.remotePlayers && this.game.network && this.game.network.connected) {
      for (const remotePlayer of this.game.remotePlayers.values()) {
        if (remotePlayer.id === this.game.network.clientId) continue;
        if (remotePlayer.isDead || (remotePlayer.dimension && remotePlayer.dimension !== dim)) continue;

        const dx = remotePlayer.x - x;
        const dy = remotePlayer.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist <= radius + (remotePlayer.radius || 10)) {
          const angle = dist > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
          const kbX = Math.cos(angle) * knockback;
          const kbY = Math.sin(angle) * knockback;

          let actualDmg = damage;
          if (remotePlayer.shield && remotePlayer.shield.active && remotePlayer.shield.energy > 0) {
            actualDmg = Math.round(damage * 0.3);
            this.addHitSparks(remotePlayer.x, remotePlayer.y, '#38bdf8', 16);
            this.addFloatingText('🛡️ GEBLOCKT!', remotePlayer.x, remotePlayer.y - 20, '#38bdf8');
          } else {
            this.addHitSparks(remotePlayer.x, remotePlayer.y, '#ec4899', 18);
            this.addFloatingText(`-${actualDmg}!`, remotePlayer.x, remotePlayer.y - 20, '#f472b6');
          }

          this.game.network.sendPvPHit(remotePlayer.id, actualDmg, kbX, kbY);
        }
      }
    }

    for (const dummy of this.dummies) {
      const dx = dummy.x - x;
      const dy = dummy.y - 6 - y;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius + 12) {
        this.applyHitToDummy(dummy, {
          type: 'thrust',
          knockback,
          angle: Math.atan2(dy, dx)
        });
      }
    }
  }

  applyHitToDummy(dummy, hitbox) {
    const isThrust = (hitbox.type === 'thrust');
    const isSpin = (hitbox.type === 'spin');
    dummy.hitTimer = (isThrust || isSpin) ? 0.32 : 0.2;
    dummy.wobbleTimer = (isThrust || isSpin) ? 0.75 : 0.5;

    // Knockback
    const kb = hitbox.knockback || 80;
    const angle = isSpin ? Math.atan2(dummy.y - hitbox.y, dummy.x - hitbox.x) : hitbox.angle;
    dummy.vx += Math.cos(angle) * kb;
    dummy.vy += Math.sin(angle) * kb;

    // Wobble angular direction
    dummy.wobble = (Math.cos(angle) > 0 ? 1 : -1) * (isThrust ? 0.65 : (isSpin ? 0.55 : 0.45));

    // Hit impact sparks (Smash Bros style impact burst)
    const sparkCount = (isThrust || isSpin) ? 22 : 12;
    for (let i = 0; i < sparkCount; i++) {
      const spAngle = isThrust ? (angle + (Math.random() - 0.5) * 1.2) : (Math.random() * Math.PI * 2);
      const spSpeed = (isThrust || isSpin) ? (Math.random() * 150 + 70) : (Math.random() * 90 + 30);
      this.hitSparks.push({
        x: dummy.x,
        y: dummy.y - 8,
        vx: Math.cos(spAngle) * spSpeed,
        vy: Math.sin(spAngle) * spSpeed,
        color: isThrust ? (Math.random() > 0.4 ? '#ef4444' : '#facc15') : (isSpin ? '#38bdf8' : '#f59e0b'),
        size: Math.random() * 3 + (isThrust ? 2.0 : 1.5),
        life: isThrust ? 0.38 : 0.32,
        maxLife: isThrust ? 0.38 : 0.32
      });
    }

    // Damage / Impact label
    const label = isThrust ? '💥 KRÄFTIGER STICH!' : (isSpin ? '🌀 45 WIRBEL!' : 'TREFFER!');
    this.floatingTexts.push({
      text: label,
      x: dummy.x,
      y: dummy.y - 20,
      timer: 0,
      duration: (isThrust || isSpin) ? 0.75 : 0.55,
      color: isThrust ? '#ef4444' : (isSpin ? '#38bdf8' : '#fef08a')
    });
  }

  update(dt) {
    const map = this.game.map;
    const player = this.game.player;
    const curDim = this.game?.currentDimension || 'overworld';

    // 1. Update Flying Arrows
    for (let i = this.flyingArrows.length - 1; i >= 0; i--) {
      const arrow = this.flyingArrows[i];
      if (arrow.dimension && arrow.dimension !== curDim) continue;

      const stepX = arrow.vx * dt;
      const stepY = arrow.vy * dt;
      arrow.x += stepX;
      arrow.y += stepY;
      arrow.distTraveled += arrow.speed * dt;

      // Trailing speed particles
      arrow.trailTimer += dt;
      if (arrow.trailTimer >= 0.02) {
        arrow.trailTimer = 0;
        this.hitSparks.push({
          dimension: curDim,
          x: arrow.x,
          y: arrow.y,
          vx: -arrow.vx * 0.05 + (Math.random() - 0.5) * 10,
          vy: -arrow.vy * 0.05 + (Math.random() - 0.5) * 10,
          color: arrow.isCharged ? 'rgba(56, 189, 248, 0.7)' : 'rgba(255, 255, 255, 0.45)',
          size: arrow.isCharged ? 2.5 : 1.5,
          life: 0.2,
          maxLife: 0.2
        });
      }

      // Check active enemies hit
      let hitEnemy = false;
      if (this.game && this.game.enemyManager) {
        const enemies = this.game.enemyManager.getActiveEnemies();
        for (const enemy of enemies) {
          if (Math.hypot(enemy.x - arrow.x, enemy.y - arrow.y) <= (enemy.radius + 6)) {
            // Anti-Range: Ritter und Skorpione blocken alles, was aus der Range kommt!
            if (enemy.typeId === 'cursed_knight' || enemy.typeId === 'emperor_scorpion') {
              const sparkColor = enemy.typeId === 'cursed_knight' ? '#f1f5f9' : '#f59e0b';
              this.addHitSparks(arrow.x, arrow.y, sparkColor, 14, 80);
              this.addFloatingText('🛡️ GEBLOCKT!', enemy.x, enemy.y - 18, '#38bdf8');
              hitEnemy = true;
              break;
            }

            const dmg = arrow.isCharged ? 45 : 22;
            const kb = arrow.isCharged ? 160 : 85;
            enemy.takeDamage(dmg, arrow.angle, kb, this, true);
            hitEnemy = true;
            break;
          }
        }
      }

      // Check collision with remote players (PvP)
      let hitRemotePlayer = false;
      if (!hitEnemy && this.game && this.game.remotePlayers && this.game.network && this.game.network.connected) {
        const curDim = this.game.currentDimension || 'overworld';
        for (const remotePlayer of this.game.remotePlayers.values()) {
          if (remotePlayer.id === this.game.network.clientId) continue;
          if (remotePlayer.isDead || (remotePlayer.dimension && remotePlayer.dimension !== curDim)) continue;

          if (Math.hypot(remotePlayer.x - arrow.x, remotePlayer.y - arrow.y) <= (remotePlayer.radius + 6)) {
            let dmg = arrow.isCharged ? 45 : 22;
            const kb = arrow.isCharged ? 140 : 70;

            if (remotePlayer.shieldActive) {
              this.addHitSparks(arrow.x, arrow.y, '#38bdf8', 14, 80);
              this.addFloatingText('🛡️ GEBLOCKT!', remotePlayer.x, remotePlayer.y - 18, '#38bdf8');
              dmg = 0;
            } else {
              this.addHitSparks(arrow.x, arrow.y, '#ef4444', 12, 70);
              this.addFloatingText(`-${dmg}`, remotePlayer.x, remotePlayer.y - 14, '#f87171');
            }

            if (dmg > 0) {
              const kbX = Math.cos(arrow.angle) * kb * 0.3;
              const kbY = Math.sin(arrow.angle) * kb * 0.3;
              this.game.network.sendPvPHit(remotePlayer.id, dmg, kbX, kbY);
            }

            hitRemotePlayer = true;
            break;
          }
        }
      }

      // Check dummy hit
      let hitDummy = false;
      if (this.game.currentDimension === 'overworld') {
        for (const dummy of this.dummies) {
          if (Math.hypot(dummy.x - arrow.x, dummy.y - 6 - arrow.y) <= 12) {
            this.applyHitToDummy(dummy, {
              angle: arrow.angle,
              knockback: arrow.isCharged ? 160 : 80,
              type: arrow.isCharged ? 'thrust' : 'slash1'
            });
            hitDummy = true;
            break;
          }
        }
      }

      // Check solid wall / obstacle collision (arrows fly freely over water & abyss!)
      const tX = Math.floor(arrow.x / TILE_SIZE);
      const tY = Math.floor(arrow.y / TILE_SIZE);
      const hitWall = this.isArrowObstacle(map, tX, tY);

      if (hitDummy || hitEnemy || hitRemotePlayer || hitWall || arrow.distTraveled >= arrow.maxRange) {
        const curTile = map.getGroundTile ? map.getGroundTile(tX, tY) : (map.ground ? map.ground[tY]?.[tX] : 0);
        const inWater = this.isWaterOrAbyssTile(curTile) && !hitEnemy && !hitDummy && !hitWall;

        if (inWater) {
          // Arrow lands in water/abyss: splashes and disappears!
          this.createWaterSplash(arrow.x, arrow.y, curTile);
        } else {
          // Arrow sticks in the ground or obstacle!
          this.stuckArrows.push({
            dimension: arrow.dimension || curDim,
            x: arrow.x,
            y: arrow.y,
            angle: arrow.angle,
            quiverTimer: 0.35,
            canCollect: true
          });

          // Dust / impact puff
          for (let s = 0; s < 6; s++) {
            const spAngle = Math.random() * Math.PI * 2;
            this.hitSparks.push({
              dimension: curDim,
              x: arrow.x,
              y: arrow.y,
              vx: Math.cos(spAngle) * (Math.random() * 25 + 10),
              vy: Math.sin(spAngle) * (Math.random() * 25 + 10),
              color: 'rgba(212, 212, 216, 0.65)',
              size: Math.random() * 2 + 1,
              life: 0.22,
              maxLife: 0.22
            });
          }
        }

        this.flyingArrows.splice(i, 1);
      }
    }

    // 2. Update Stuck Arrows (quiver animation & player pickup)
    for (let i = this.stuckArrows.length - 1; i >= 0; i--) {
      const stuck = this.stuckArrows[i];
      if (stuck.dimension && stuck.dimension !== curDim) continue;

      if (stuck.quiverTimer > 0) {
        stuck.quiverTimer -= dt;
      }

      // Pickup check by player
      if (stuck.canCollect) {
        const pDist = Math.hypot(player.x - stuck.x, player.y - stuck.y);
        if (pDist <= COMBAT_CONFIG.ARROW_PICKUP_RADIUS) {
          if (player && player.ranged && player.ranged.ammo < COMBAT_CONFIG.MAX_AMMO) {
            player.ranged.ammo++;

            // Shiny green/gold pickup sparkles
            for (let p = 0; p < 8; p++) {
              const pAngle = Math.random() * Math.PI * 2;
              this.hitSparks.push({
                x: stuck.x,
                y: stuck.y - 4,
                vx: Math.cos(pAngle) * (Math.random() * 35 + 15),
                vy: Math.sin(pAngle) * (Math.random() * 35 + 15),
                color: '#4ade80',
                size: Math.random() * 2 + 1.5,
                life: 0.3,
                maxLife: 0.3
              });
            }

            this.floatingTexts.push({
              text: '+1 Pfeil 🏹',
              x: stuck.x,
              y: stuck.y - 10,
              timer: 0,
              duration: 0.5,
              color: '#86efac'
            });

            this.stuckArrows.splice(i, 1);
            continue;
          }
        }
      }
    }

    // 3. Update Slash Effects
    for (let i = this.slashEffects.length - 1; i >= 0; i--) {
      const slash = this.slashEffects[i];
      slash.timer += dt;
      if (slash.timer >= slash.duration) {
        this.slashEffects.splice(i, 1);
      }
    }

    // 4. Update Sparks / Particles
    for (let i = this.hitSparks.length - 1; i >= 0; i--) {
      const sp = this.hitSparks[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) {
        this.hitSparks.splice(i, 1);
      }
    }

    // 5. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.timer += dt;
      ft.y -= dt * 25; // Drift upwards
      if (ft.timer >= ft.duration) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 6. Update Training Dummies (physics slide & return spring)
    if (this.game.currentDimension === 'overworld') {
      for (const dummy of this.dummies) {
        dummy.x += dummy.vx * dt;
        dummy.y += dummy.vy * dt;

        // Friction
        dummy.vx *= Math.pow(0.08, dt);
        dummy.vy *= Math.pow(0.08, dt);

        // Slow elastic pull back to start position
        dummy.vx += (dummy.startX - dummy.x) * 1.5 * dt;
        dummy.vy += (dummy.startY - dummy.y) * 1.5 * dt;

        if (dummy.hitTimer > 0) dummy.hitTimer -= dt;
        if (dummy.wobbleTimer > 0) {
          dummy.wobbleTimer -= dt;
          dummy.wobble = Math.sin(dummy.wobbleTimer * 20) * 0.35 * (dummy.wobbleTimer / 0.5);
        } else {
          dummy.wobble = 0;
        }
      }
    }

    // 7. Update Enemy Projectiles
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const proj = this.enemyProjectiles[i];
      if (proj.dimension && curDim && proj.dimension !== curDim) continue;

      proj.x += proj.dirX * proj.speed * dt;
      proj.y += proj.dirY * proj.speed * dt;
      proj.distTraveled += proj.speed * dt;

      // Trail particles
      proj.trailTimer += dt;
      if (proj.trailTimer >= 0.035) {
        proj.trailTimer = 0;
        this.hitSparks.push({
          dimension: curDim,
          x: proj.x,
          y: proj.y,
          vx: -proj.dirX * 18 + (Math.random() - 0.5) * 12,
          vy: -proj.dirY * 18 + (Math.random() - 0.5) * 12,
          color: proj.color,
          size: Math.random() * 2 + 1,
          life: 0.22,
          maxLife: 0.22
        });
      }

      // Check collision with player
      const distToPlayer = Math.hypot(player.x - proj.x, player.y - proj.y);
      if (distToPlayer <= (proj.radius + player.radius) && !player.isDead) {
        player.takeDamage(proj.damage, { x: proj.dirX, y: proj.dirY });
        if (proj.slowsPlayer) player.applySlow(0.45, 2.5);
        if (proj.knockbackPlayer) {
          player.x += proj.dirX * 24;
          player.y += proj.dirY * 24;
        }
        this.addHitSparks(proj.x, proj.y, proj.color, 12);
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      // Check wall / obstacle collision or max distance (projectiles pass over water)
      const tX = Math.floor(proj.x / TILE_SIZE);
      const tY = Math.floor(proj.y / TILE_SIZE);
      const hitWall = this.isArrowObstacle(map, tX, tY);

      if (hitWall || proj.distTraveled >= proj.maxDist) {
        if (proj.spawnsPuddle) {
          this.spawnHazardPuddle(proj.x, proj.y, 20, 5.0, 10, proj.color, proj.dimension);
        }
        this.addHitSparks(proj.x, proj.y, proj.color, 8);
        this.enemyProjectiles.splice(i, 1);
      }
    }

    // 8. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      if (sw.dimension && curDim && sw.dimension !== curDim) continue;

      sw.timer += dt;
      sw.currentRadius = (sw.timer / sw.duration) * sw.maxRadius;

      if (!sw.hasHitPlayer && !player.isDead) {
        const dist = Math.hypot(player.x - sw.x, player.y - sw.y);
        if (dist <= sw.currentRadius + player.radius && dist >= sw.currentRadius - 16) {
          sw.hasHitPlayer = true;
          const hitDir = { x: (player.x - sw.x) / (dist || 1), y: (player.y - sw.y) / (dist || 1) };
          player.takeDamage(sw.damage, hitDir);
          if (sw.slowsPlayer) player.applySlow(0.4, 2.5);
        }
      }

      if (sw.timer >= sw.duration) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 9. Update Celestial Strikes
    for (let i = this.celestialStrikes.length - 1; i >= 0; i--) {
      const cs = this.celestialStrikes[i];
      if (cs.dimension && curDim && cs.dimension !== curDim) continue;

      cs.timer += dt;

      if (cs.timer >= cs.delay && !cs.impacted) {
        cs.impacted = true;
        this.addHitSparks(cs.targetX, cs.targetY, '#facc15', 26, 120);
        this.addHitSparks(cs.targetX, cs.targetY, '#38bdf8', 18, 90);
        if (this.game.camera) this.game.camera.shake(6.5, 0.25);

        const dist = Math.hypot(player.x - cs.targetX, player.y - cs.targetY);
        if (dist <= 32 && !player.isDead) {
          player.takeDamage(cs.damage, { x: 0, y: 1 });
        }
        this.celestialStrikes.splice(i, 1);
      }
    }

    // 10. Update Hazard Puddles
    for (let i = this.hazardPuddles.length - 1; i >= 0; i--) {
      const pud = this.hazardPuddles[i];
      if (pud.dimension && curDim && pud.dimension !== curDim) continue;

      pud.timer += dt;
      pud.tickTimer += dt;

      // Poison bubbles
      if (Math.random() < 0.15) {
        const pAng = Math.random() * Math.PI * 2;
        const pDist = Math.random() * pud.radius;
        this.hitSparks.push({
          dimension: curDim,
          x: pud.x + Math.cos(pAng) * pDist,
          y: pud.y + Math.sin(pAng) * pDist,
          vx: (Math.random() - 0.5) * 8,
          vy: -Math.random() * 15 - 5,
          color: pud.color,
          size: Math.random() * 2 + 1,
          life: 0.35,
          maxLife: 0.35
        });
      }

      // Check player inside puddle
      if (pud.tickTimer >= 0.5) {
        pud.tickTimer = 0;
        const dist = Math.hypot(player.x - pud.x, player.y - pud.y);
        if (dist <= pud.radius && !player.isDead && player.invulnTimer <= 0) {
          player.takeDamage(pud.damage * 0.4);
        }
      }

      if (pud.timer >= pud.duration) {
        this.hazardPuddles.splice(i, 1);
      }
    }

    // 11. Update Defeat Poof Particles
    for (let i = this.defeatPoofs.length - 1; i >= 0; i--) {
      const p = this.defeatPoofs[i];
      if (p.dimension && curDim && p.dimension !== curDim) continue;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.defeatPoofs.splice(i, 1);
      }
    }

    // 12. Update Grappling Hooks (Yeti & Trolle Enterhaken)
    for (let i = this.grapplingHooks.length - 1; i >= 0; i--) {
      const hook = this.grapplingHooks[i];
      if (hook.dimension && curDim && hook.dimension !== curDim) continue;
      if (!hook.enemy || hook.enemy.state === 'dead') {
        this.grapplingHooks.splice(i, 1);
        continue;
      }

      hook.startX = hook.enemy.x;
      hook.startY = hook.enemy.y;

      if (hook.state === 'extend') {
        hook.tipX += hook.vx * dt;
        hook.tipY += hook.vy * dt;
        hook.length = Math.hypot(hook.tipX - hook.startX, hook.tipY - hook.startY);

        const tX = Math.floor(hook.tipX / TILE_SIZE);
        const tY = Math.floor(hook.tipY / TILE_SIZE);
        const hitObstacle = this.isArrowObstacle(map, tX, tY);

        if (hitObstacle || hook.length >= hook.maxLength) {
          hook.state = 'retract';
          this.addHitSparks(hook.tipX, hook.tipY, hook.color, 6);
          continue;
        }

        const distToPlayer = Math.hypot(player.x - hook.tipX, player.y - hook.tipY);
        if (distToPlayer <= (player.radius + 8) && !player.isDead) {
          if (player.dash && player.dash.active) {
            this.addFloatingText('💨 AUSGEWICHEN!', player.x, player.y - 16, '#67e8f9');
            hook.state = 'retract';
            continue;
          }

          if (player.shield && player.shield.active && player.shield.energy > 0) {
            player.shield.energy = Math.max(0, player.shield.energy - hook.damage * 0.8);
            this.addHitSparks(player.x, player.y, '#38bdf8', 12);
            this.addFloatingText('🛡️ GEBLOCKT!', player.x, player.y - 18, '#38bdf8');
            hook.state = 'retract';
            continue;
          }

          hook.state = 'pull';
          player.takeDamage(hook.damage, { x: hook.vx, y: hook.vy });
          this.addHitSparks(player.x, player.y, '#ef4444', 14);
          this.addFloatingText('⛓️ HERANGEZOGEN!', player.x, player.y - 24, '#f59e0b');
          if (this.game.camera) this.game.camera.shake(4.5, 0.22);
        }
      } else if (hook.state === 'pull') {
        const dx = hook.enemy.x - player.x;
        const dy = hook.enemy.y - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= 36 || player.isDead) {
          hook.enemy.cooldownTimer = 0.15;
          this.grapplingHooks.splice(i, 1);
          continue;
        }

        const pullSpeed = 440;
        const stepX = (dx / dist) * pullSpeed * dt;
        const stepY = (dy / dist) * pullSpeed * dt;
        player.x += stepX;
        player.y += stepY;
        hook.tipX = player.x;
        hook.tipY = player.y;

        if (Math.random() < 0.35) {
          this.hitSparks.push({
            dimension: curDim,
            x: player.x,
            y: player.y + 4,
            vx: -stepX * 0.1,
            vy: -stepY * 0.1 - 5,
            color: '#d4d4d8',
            size: 2.2,
            life: 0.2,
            maxLife: 0.2
          });
        }
      } else if (hook.state === 'retract') {
        const dx = hook.startX - hook.tipX;
        const dy = hook.startY - hook.tipY;
        const dist = Math.hypot(dx, dy);
        if (dist <= 25) {
          this.grapplingHooks.splice(i, 1);
          continue;
        }
        const retractSpeed = 520;
        hook.tipX += (dx / dist) * retractSpeed * dt;
        hook.tipY += (dy / dist) * retractSpeed * dt;
      }
    }
  }

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  render(ctx, bounds, t) {
    this.renderHazardPuddles(ctx, t);
    this.renderShockwaves(ctx, t);
    this.renderCelestialStrikes(ctx, t);
    this.renderGrapplingHooks(ctx, t);
    this.renderStuckArrows(ctx);
    this.renderTrainingDummies(ctx, t);
    this.renderFlyingArrows(ctx);
    this.renderEnemyProjectiles(ctx, t);
    this.renderDefeatPoofs(ctx);
    this.renderSlashEffects(ctx);
    this.renderSparks(ctx);
    this.renderFloatingTexts(ctx);
  }

  renderGrapplingHooks(ctx, t) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const hook of this.grapplingHooks) {
      if (hook.dimension && curDim && hook.dimension !== curDim) continue;

      const sx = Math.round(hook.startX);
      const sy = Math.round(hook.startY);
      const tx = Math.round(hook.tipX);
      const ty = Math.round(hook.tipY);

      const dx = tx - sx;
      const dy = ty - sy;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) continue;

      ctx.save();
      // Eisenkettenglieder zeichnen
      const numLinks = Math.max(2, Math.floor(dist / 9));
      for (let j = 0; j <= numLinks; j++) {
        const lx = sx + (dx * j) / numLinks;
        const ly = sy + (dy * j) / numLinks;

        ctx.fillStyle = j % 2 === 0 ? hook.color : '#475569';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 3.2, 2.0, Math.atan2(dy, dx), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Scharfer Enterhaken-Kopf an der Spitze
      ctx.translate(tx, ty);
      ctx.rotate(Math.atan2(dy, dx));

      ctx.fillStyle = hook.hookColor || '#475569';
      ctx.fillRect(-3, -2, 6, 4);

      ctx.strokeStyle = hook.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      // Oberer Haken
      ctx.moveTo(3, -2);
      ctx.quadraticCurveTo(8, -8, 2, -10);
      // Unterer Haken
      ctx.moveTo(3, 2);
      ctx.quadraticCurveTo(8, 8, 2, 10);
      // Mitteldorn
      ctx.moveTo(2, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();

      ctx.restore();
    }
  }

  renderHazardPuddles(ctx, t) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const pud of this.hazardPuddles) {
      if (pud.dimension && pud.dimension !== curDim) continue;
      const alpha = Math.min(1.0, (pud.duration - pud.timer) / 0.5) * 0.65;
      const pulse = Math.sin(t * 5 + pud.x) * 1.5;
      const r = pud.radius + pulse;

      ctx.save();
      ctx.translate(pud.x, pud.y);

      // Puddle base
      ctx.fillStyle = pud.color;
      ctx.globalAlpha = alpha * 0.55;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer ripple
      ctx.strokeStyle = pud.color;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = alpha * 0.8;
      ctx.stroke();

      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  renderShockwaves(ctx, t) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const sw of this.shockwaves) {
      if (sw.dimension && sw.dimension !== curDim) continue;
      const alpha = 1.0 - (sw.timer / sw.duration);
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3.0 * alpha;
      ctx.globalAlpha = alpha * 0.85;
      ctx.beginPath();
      ctx.ellipse(sw.x, sw.y, sw.currentRadius, sw.currentRadius * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  renderCelestialStrikes(ctx, t) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const cs of this.celestialStrikes) {
      if (cs.dimension && cs.dimension !== curDim) continue;
      const prog = cs.timer / cs.delay;
      ctx.save();
      ctx.translate(cs.targetX, cs.targetY);

      // Ground magic rune / target circle
      const r = 24 * (0.3 + prog * 0.7);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.4 + prog * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // 4 Star points
      ctx.fillStyle = '#fde047';
      for (let st = 0; st < 4; st++) {
        const sAng = (st / 4) * Math.PI * 2 + t * 4;
        ctx.fillRect(Math.cos(sAng) * r - 2, Math.sin(sAng) * r - 2, 4, 4);
      }

      // Falling star streak during second half
      if (prog > 0.4) {
        const fallProg = (prog - 0.4) / 0.6;
        const starY = -120 * (1 - fallProg);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, starY);
        ctx.lineTo(0, starY - 24);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, starY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  renderEnemyProjectiles(ctx, t) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const proj of this.enemyProjectiles) {
      if (proj.dimension && proj.dimension !== curDim) continue;
      ctx.save();
      ctx.translate(proj.x, proj.y);

      const angle = Math.atan2(proj.dirY, proj.dirX);
      ctx.rotate(angle);

      if (proj.type === 'moss_arrow') {
        // Green leaf-arrow
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(6, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'fireball' || proj.type === 'fire_spark') {
        // Calcifer fire orb
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(1, 0, proj.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'ink_ball') {
        // Soot droplet
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'web_shot') {
        // Web cluster
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-proj.radius, 0); ctx.lineTo(proj.radius, 0);
        ctx.moveTo(0, -proj.radius); ctx.lineTo(0, proj.radius);
        ctx.stroke();
      } else if (proj.type === 'void_beam') {
        // Cosmic needle
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(-12, -2, 24, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -1, 12, 2);
      } else if (proj.type === 'wind_petal') {
        // Sakura petal
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Default glowing magic orb
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  renderDefeatPoofs(ctx) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const p of this.defeatPoofs) {
      if (p.dimension && p.dimension !== curDim) continue;
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  renderStuckArrows(ctx) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const stuck of this.stuckArrows) {
      if (stuck.dimension && stuck.dimension !== curDim) continue;
      ctx.save();
      ctx.translate(stuck.x, stuck.y);

      let wobble = 0;
      if (stuck.quiverTimer > 0) {
        wobble = Math.sin(stuck.quiverTimer * 35) * 0.3 * (stuck.quiverTimer / 0.35);
      }
      ctx.rotate(stuck.angle + wobble);

      // Shadow in ground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(-6, 2, 8, 1.5);

      // Wooden Shaft sticking into ground
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(2, 0);
      ctx.stroke();

      // Paper Fletching (White feathers)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-10, -2.5);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, 2.5);
      ctx.closePath();
      ctx.fill();

      // Collectible pulse halo
      const pulse = Math.sin(performance.now() * 0.006 + stuck.x) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(134, 239, 172, ${0.35 * pulse})`;
      ctx.beginPath();
      ctx.arc(-4, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  renderFlyingArrows(ctx) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const arrow of this.flyingArrows) {
      if (arrow.dimension && arrow.dimension !== curDim) continue;
      ctx.save();
      ctx.translate(arrow.x, arrow.y);
      ctx.rotate(arrow.angle);

      // Speed streak lines behind arrow
      ctx.strokeStyle = arrow.isCharged ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-22, -1);
      ctx.lineTo(-10, -1);
      ctx.moveTo(-20, 1);
      ctx.lineTo(-8, 1);
      ctx.stroke();

      // Wooden Shaft
      ctx.strokeStyle = arrow.isCharged ? '#0284c7' : '#92400e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(4, 0);
      ctx.stroke();

      // Paper Fletching Feathers
      ctx.fillStyle = arrow.isCharged ? '#38bdf8' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-10, -2.5);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, 2.5);
      ctx.closePath();
      ctx.fill();

      // Arrowhead (Steel / Charged Cyan Point)
      ctx.fillStyle = arrow.isCharged ? '#e0f2fe' : '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(3, -2.5);
      ctx.lineTo(3, 2.5);
      ctx.closePath();
      ctx.fill();

      // Charged Arrow Gleam
      if (arrow.isCharged) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.beginPath();
        ctx.arc(4, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  renderSlashEffects(ctx) {
    for (const slash of this.slashEffects) {
      const progress = slash.timer / slash.duration;
      const alpha = 1.0 - progress;

      ctx.save();
      ctx.translate(slash.x, slash.y);

      if (slash.type === 'spin') {
        // 360 Degree Whirling Cyclone & Shockwave Ring (Zelda Spin Attack)
        const curRadius = slash.radius * (0.75 + progress * 0.45);

        // Outer expanding air vacuum ring
        ctx.lineWidth = 2 * alpha;
        ctx.strokeStyle = `rgba(186, 230, 253, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius * 1.3, 0, Math.PI * 2);
        ctx.stroke();

        // Primary glowing cyan blade circle
        ctx.lineWidth = 5 * alpha;
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Bright white sharp cutting rim
        ctx.lineWidth = 2.2 * alpha;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Dual swirling whirlwind spiral blades
        ctx.lineWidth = 3.0 * alpha;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.92})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius * 0.78, progress * Math.PI * 5, progress * Math.PI * 5 + Math.PI * 1.4);
        ctx.stroke();

        ctx.strokeStyle = `rgba(103, 232, 249, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius * 0.6, -progress * Math.PI * 5, -progress * Math.PI * 5 + Math.PI * 1.4);
        ctx.stroke();
      }
      else if (slash.type === 'thrust') {
        // Linear Forward Powerful Thrust Blade & Dual Sonic Shockwave
        ctx.rotate(slash.angle);
        const curLen = slash.radius * (0.68 + progress * 0.55);

        // 1. Dual Shockwave Pressure Rings
        // Outer cyan air pressure wave
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.75})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(curLen * 0.5, 0, 16 * (0.6 + progress * 0.8), -Math.PI * 0.48, Math.PI * 0.48);
        ctx.stroke();

        // Inner intense white sonic boom shockwave cone
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.arc(curLen * 0.72, 0, 13 * (0.5 + progress * 0.7), -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();

        // 2. Heavy Piercing Golden Spear Blade
        // Outer radiant golden aura
        ctx.fillStyle = `rgba(254, 240, 138, ${alpha * 0.92})`;
        ctx.beginPath();
        ctx.moveTo(curLen + 8, 0);
        ctx.lineTo(curLen - 24, -7);
        ctx.lineTo(curLen - 18, 0);
        ctx.lineTo(curLen - 24, 7);
        ctx.closePath();
        ctx.fill();

        // Inner glowing white core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(curLen + 8, 0);
        ctx.lineTo(curLen - 20, -3.5);
        ctx.lineTo(curLen - 15, 0);
        ctx.lineTo(curLen - 20, 3.5);
        ctx.closePath();
        ctx.fill();

        // Diamond tip gleam star
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(curLen + 6, -1.5, 3, 3);

        // 3. Piercing Speed Streaks (4 speed lines whistling alongside)
        ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.75})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(curLen * 0.15, -7.5);
        ctx.lineTo(curLen + 3, -7.5);
        ctx.moveTo(curLen * 0.15, 7.5);
        ctx.lineTo(curLen + 3, 7.5);
        ctx.moveTo(curLen * 0.35, -3.8);
        ctx.lineTo(curLen + 9, -3.8);
        ctx.moveTo(curLen * 0.35, 3.8);
        ctx.lineTo(curLen + 9, 3.8);
        ctx.stroke();
      }
      else if (slash.type === 'bear_spin') {
        // 360 Degree Savage Bear Claw Cyclone & Nature Spirit Shockwave
        const curRadius = slash.radius * (0.75 + progress * 0.45);

        // Outer emerald forest vacuum ring
        ctx.lineWidth = 2.5 * alpha;
        ctx.strokeStyle = `rgba(34, 197, 94, ${alpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius * 1.25, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glowing jade blade ring
        ctx.lineWidth = 4.5 * alpha;
        ctx.strokeStyle = `rgba(74, 222, 128, ${alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 4 swirling savage claw scratches
        for (let s = 0; s < 4; s++) {
          const startA = (s * Math.PI / 2) + progress * Math.PI * 4;
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
          ctx.lineWidth = 2.8 * alpha;
          ctx.beginPath();
          ctx.arc(0, 0, curRadius * 0.85, startA, startA + 0.85);
          ctx.stroke();

          ctx.strokeStyle = `rgba(250, 204, 21, ${alpha * 0.85})`;
          ctx.lineWidth = 2.0 * alpha;
          ctx.beginPath();
          ctx.arc(0, 0, curRadius * 0.65, -startA, -startA + 0.85);
          ctx.stroke();
        }
      }
      else if (slash.type === 'bear_thrust') {
        // Heavy twin paw gouge / beast lunge shockwave & razor claw trails
        ctx.rotate(slash.angle);
        const curLen = slash.radius * (0.7 + progress * 0.5);

        // Emerald shockwave rings
        ctx.strokeStyle = `rgba(34, 197, 94, ${alpha * 0.85})`;
        ctx.lineWidth = 3.0 * alpha;
        ctx.beginPath();
        ctx.arc(curLen * 0.5, 0, 18 * (0.6 + progress * 0.8), -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        // 4 forward razor claw puncture trails
        for (let c = -1.5; c <= 1.5; c += 1) {
          const yOff = c * 7;
          ctx.strokeStyle = `rgba(134, 239, 172, ${alpha * 0.95})`;
          ctx.lineWidth = 2.5 * alpha;
          ctx.beginPath();
          ctx.moveTo(curLen * 0.15, yOff * 0.4);
          ctx.lineTo(curLen + 10, yOff);
          ctx.stroke();

          // Star gleam at claw tips
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fillRect(curLen + 9, yOff - 1.5, 3, 3);
        }
      }
      else if (slash.type === 'bear_claw1' || slash.type === 'bear_claw2') {
        // Savage Bear Claw Swipe (Triple curved lacerations in emerald green & gold)
        ctx.rotate(slash.angle);
        const flip = slash.type === 'bear_claw2' ? -1 : 1;
        const curRadius = slash.radius * (0.8 + progress * 0.35);

        // Draw 3 distinct curved claw lacerations
        for (let c = -1; c <= 1; c++) {
          const clawOffset = c * 7.5;
          const r = curRadius - Math.abs(c) * 2.5;

          // Outer green claw trail
          ctx.strokeStyle = `rgba(34, 197, 94, ${alpha * 0.95})`;
          ctx.lineWidth = (3.5 - Math.abs(c) * 0.6) * alpha;
          ctx.beginPath();
          ctx.arc(0, clawOffset, r, -0.6 * flip, 0.6 * flip, flip < 0);
          ctx.stroke();

          // Inner white razor gleam
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.92})`;
          ctx.lineWidth = 1.4 * alpha;
          ctx.beginPath();
          ctx.arc(0, clawOffset, r, -0.45 * flip, 0.45 * flip, flip < 0);
          ctx.stroke();
        }
      }
      else {
        // Radial Slash 1 & 2 (Curved Crescent Paper Blade Swoosh)
        ctx.rotate(slash.angle);
        const flip = slash.type === 'slash2' ? -1 : 1;
        const curRadius = slash.radius * (0.75 + progress * 0.35);

        // Crescent Blade Arc (~70 degree paper crescent)
        ctx.fillStyle = `rgba(240, 249, 255, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius, -0.6 * flip, 0.6 * flip, flip < 0);
        ctx.arc(0, 0, curRadius - 8, 0.6 * flip, -0.6 * flip, flip > 0);
        ctx.closePath();
        ctx.fill();

        // Sharp luminous cutting edge
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius, -0.65 * flip, 0.65 * flip, flip < 0);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  renderTrainingDummies(ctx, t) {
    if (this.game.currentDimension !== 'overworld') return;

    for (const dummy of this.dummies) {
      const dx = Math.round(dummy.x);
      const dy = Math.round(dummy.y);

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(dummy.wobble);

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 3, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wooden Center Post
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-2, -18, 4, 20);

      // Crossbar support
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, -12, 16, 3);

      // Straw & Burlap Dummy Torso (Woven Papercraft Texture)
      ctx.fillStyle = dummy.hitTimer > 0 ? '#fef08a' : '#d97706';
      ctx.beginPath();
      ctx.ellipse(0, -10, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Straw Head
      ctx.fillStyle = dummy.hitTimer > 0 ? '#ffffff' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -18, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Painted Red Target Rings on chest
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, -10, 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, -10, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Rope bindings (Rope sash)
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-4, -6, 8, 1.5);

      ctx.restore();
    }
  }

  renderSparks(ctx) {
    for (const sp of this.hitSparks) {
      const alpha = sp.life / sp.maxLife;
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(sp.x, sp.y, sp.size, sp.size);
    }
    ctx.globalAlpha = 1.0;
  }

  renderFloatingTexts(ctx) {
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 2.5;

    for (const ft of this.floatingTexts) {
      const alpha = 1.0 - (ft.timer / ft.duration);
      ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = alpha;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();
  }
}
