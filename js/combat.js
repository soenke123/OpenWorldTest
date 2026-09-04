import { TILE_SIZE, COMBAT_CONFIG, OBJECTS, TILES } from './constants.js';

export class CombatManager {
  constructor(game) {
    this.game = game;
    this.flyingArrows = [];
    this.stuckArrows = [];
    this.slashEffects = [];
    this.hitSparks = [];
    this.floatingTexts = [];

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

  fireArrow(startX, startY, dirX, dirY, isCharged = false) {
    const angle = Math.atan2(dirY, dirX);
    const speed = isCharged ? COMBAT_CONFIG.ARROW_CHARGED_SPEED : COMBAT_CONFIG.ARROW_SPEED;
    const maxRange = isCharged ? COMBAT_CONFIG.ARROW_CHARGED_RANGE : COMBAT_CONFIG.ARROW_RANGE;

    this.flyingArrows.push({
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
    if (type === 'spin') duration = 0.32;
    if (type === 'thrust') duration = 0.32; // Longer duration for powerful lingering thrust

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
    const sparkCount = type === 'spin' ? 24 : (type === 'thrust' ? 22 : 9);
    for (let i = 0; i < sparkCount; i++) {
      let pAngle;
      if (type === 'spin') {
        pAngle = (i / sparkCount) * Math.PI * 2;
      } else if (type === 'thrust') {
        pAngle = angle + (Math.random() - 0.5) * 0.4;
      } else {
        pAngle = angle + (Math.random() - 0.5) * 1.0;
      }

      const pSpeed = type === 'thrust' ? (Math.random() * 140 + 60) : (Math.random() * 80 + 40);
      this.hitSparks.push({
        x: x + Math.cos(pAngle) * (radius * 0.5),
        y: y + Math.sin(pAngle) * (radius * 0.5),
        vx: Math.cos(pAngle) * pSpeed,
        vy: Math.sin(pAngle) * pSpeed,
        color: type === 'spin' ? '#67e8f9' : (type === 'thrust' ? (Math.random() > 0.4 ? '#fef08a' : '#f59e0b') : '#ffffff'),
        size: Math.random() * 2.5 + 1.2,
        life: 0.32,
        maxLife: 0.32
      });
    }
  }

  checkMeleeHits(hitbox) {
    // Check collision with training dummies
    let hitAny = false;
    for (const dummy of this.dummies) {
      if (this.game.currentDimension !== 'overworld') continue;

      const dx = dummy.x - hitbox.x;
      const dy = dummy.y - hitbox.y;
      const dist = Math.hypot(dx, dy);

      let inRange = false;
      if (hitbox.type === 'spin') {
        inRange = dist <= (hitbox.radius + 10);
      } else if (hitbox.type === 'thrust') {
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

    // Heavy thrust or spin attack camera shake impact
    if (hitAny && this.game && this.game.camera) {
      if (hitbox.type === 'thrust') {
        this.game.camera.shake(4.2, 0.16);
      } else if (hitbox.type === 'spin') {
        this.game.camera.shake(3.8, 0.15);
      }
    }

    return hitAny;
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

    // 1. Update Flying Arrows
    for (let i = this.flyingArrows.length - 1; i >= 0; i--) {
      const arrow = this.flyingArrows[i];
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

      // Check solid wall / obstacle collision
      const tX = Math.floor(arrow.x / TILE_SIZE);
      const tY = Math.floor(arrow.y / TILE_SIZE);
      const hitWall = map.isSolid ? map.isSolid(tX, tY) : false;

      if (hitDummy || hitWall || arrow.distTraveled >= arrow.maxRange) {
        // Arrow sticks in the ground!
        this.stuckArrows.push({
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

        this.flyingArrows.splice(i, 1);
      }
    }

    // 2. Update Stuck Arrows (quiver animation & player pickup)
    for (let i = this.stuckArrows.length - 1; i >= 0; i--) {
      const stuck = this.stuckArrows[i];
      if (stuck.quiverTimer > 0) {
        stuck.quiverTimer -= dt;
      }

      // Pickup check by player
      if (stuck.canCollect) {
        const pDist = Math.hypot(player.x - stuck.x, player.y - stuck.y);
        if (pDist <= COMBAT_CONFIG.ARROW_PICKUP_RADIUS) {
          if (player.ranged.ammo < COMBAT_CONFIG.MAX_AMMO) {
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
  }

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  render(ctx, bounds, t) {
    this.renderStuckArrows(ctx);
    this.renderTrainingDummies(ctx, t);
    this.renderFlyingArrows(ctx);
    this.renderSlashEffects(ctx);
    this.renderSparks(ctx);
    this.renderFloatingTexts(ctx);
  }

  renderStuckArrows(ctx) {
    for (const stuck of this.stuckArrows) {
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
    for (const arrow of this.flyingArrows) {
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
