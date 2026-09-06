import { TILE_SIZE, ELEVATION_PIXEL_OFFSET } from './constants.js';
import { CHARACTERS_MAP } from './characters.js';

export class RemotePlayer {
  constructor(data) {
    this.id = data.id;
    this.name = data.name || 'Mitspieler';
    this.skinId = data.skinId || 'ren_twilight';

    this.x = data.x || 800;
    this.y = data.y || 1600;
    this.targetX = this.x;
    this.targetY = this.y;

    this.elevation = data.elevation || 0;
    this.targetElevation = this.elevation;
    this.visualElevation = this.elevation;

    this.dimension = data.dimension || 'overworld';
    this.direction = data.direction || 'down';
    this.isMoving = Boolean(data.isMoving);
    this.isSprinting = Boolean(data.isSprinting);

    this.hp = data.hp ?? 100;
    this.maxHp = data.maxHp ?? 100;
    this.level = data.level || 1;
    this.xp = data.xp || 0;
    this.pvpKills = data.pvpKills || 0;
    this.deaths = data.deaths || 0;
    this.isDead = Boolean(data.isDead);

    this.shieldActive = Boolean(data.shieldActive);
    this.isBearForm = Boolean(data.isBearForm);

    this.hitFlash = 0;
    this.radius = 6;

    // Melee attack visual effect
    this.swingAnim = 0;
    this.swingType = null;
    this.swingAngle = 0;

    // Bow attack visual effect
    this.bowAnim = 0;
    this.bowAngle = 0;

    // Dash visual effect & ghost trails
    this.dashAnim = 0;
    this.dashAngle = 0;
    this.dashGhosts = [];

    // Shield block & spells
    this.shieldBlockTimer = 0;
    this.plasmaTimer = 0;
    this.teleportSequence = null;
  }

  updateFromNetwork(data) {
    if (typeof data.x === 'number') this.targetX = data.x;
    if (typeof data.y === 'number') this.targetY = data.y;
    if (typeof data.elevation === 'number') this.targetElevation = data.elevation;
    if (data.dimension) this.dimension = data.dimension;
    if (data.direction) this.direction = data.direction;
    if (data.skinId) this.skinId = data.skinId;

    this.isMoving = Boolean(data.isMoving);
    this.isSprinting = Boolean(data.isSprinting);

    if (typeof data.hp === 'number') {
      if (data.hp < this.hp) this.hitFlash = 0.2;
      this.hp = data.hp;
    }
    if (typeof data.maxHp === 'number') this.maxHp = data.maxHp;
    if (typeof data.level === 'number') this.level = data.level;
    if (typeof data.xp === 'number') this.xp = data.xp;
    if (typeof data.pvpKills === 'number') this.pvpKills = data.pvpKills;
    if (typeof data.deaths === 'number') this.deaths = data.deaths;
    if (typeof data.isDead === 'boolean') this.isDead = data.isDead;

    if (typeof data.shieldActive === 'boolean') this.shieldActive = data.shieldActive;
    if (typeof data.isBearForm === 'boolean') this.isBearForm = data.isBearForm;
  }

  update(dt) {
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Smooth Lerp Position (Butterweiche Interpolation bei 25 Hz Netzwerk-Updates)
    const lerpSpeed = 16.0;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;

    // Schneller Sprung bei Teleportation / großem Desync (> 200 px)
    if (Math.hypot(dx, dy) > 200) {
      this.x = this.targetX;
      this.y = this.targetY;
    } else {
      this.x += dx * Math.min(1.0, dt * lerpSpeed);
      this.y += dy * Math.min(1.0, dt * lerpSpeed);
    }

    // Smooth elevation lerp
    this.visualElevation += (this.targetElevation - this.visualElevation) * Math.min(1.0, dt * 10);
    this.elevation = this.targetElevation;

    // Swing animation decay
    if (this.swingAnim > 0) {
      this.swingAnim = Math.max(0, this.swingAnim - dt * 4.2);
    }

    // Bow animation decay
    if (this.bowAnim > 0) {
      this.bowAnim = Math.max(0, this.bowAnim - dt * 2.5);
    }

    // Dash animation decay and ghost spawning
    if (this.dashAnim > 0) {
      this.dashAnim = Math.max(0, this.dashAnim - dt);
      if (Math.random() < 0.7) {
        this.dashGhosts.push({
          x: this.x,
          y: this.y,
          direction: this.direction,
          alpha: 0.65,
          isBear: this.isBearForm
        });
      }
    }

    // Dash ghost fading
    for (let g = this.dashGhosts.length - 1; g >= 0; g--) {
      this.dashGhosts[g].alpha -= dt * 3.5;
      if (this.dashGhosts[g].alpha <= 0) {
        this.dashGhosts.splice(g, 1);
      }
    }

    // Shield block timer decay
    if (this.shieldBlockTimer > 0) {
      this.shieldBlockTimer = Math.max(0, this.shieldBlockTimer - dt);
    }

    // Plasma timer decay
    if (this.plasmaTimer > 0) {
      this.plasmaTimer = Math.max(0, this.plasmaTimer - dt);
    }

    // Teleport sequence
    if (this.teleportSequence) {
      this.teleportSequence.timer += dt;
      this.teleportSequence.vortexAngle += dt * 8;
      if (this.teleportSequence.phase === 'sink') {
        if (this.teleportSequence.timer >= 0.35) {
          this.teleportSequence.phase = 'emerge';
          this.teleportSequence.timer = 0;
          this.x = this.teleportSequence.targetX;
          this.y = this.teleportSequence.targetY;
          this.targetX = this.x;
          this.targetY = this.y;
        }
      } else if (this.teleportSequence.phase === 'emerge') {
        if (this.teleportSequence.timer >= 0.35) {
          this.teleportSequence = null;
        }
      }
    }
  }

  triggerAction(action, data = {}) {
    if (action === 'melee') {
      this.swingAnim = 1.0;
      this.swingType = data.subType || 'slash1';
      this.swingAngle = (typeof data.angle === 'number') ? data.angle : this.getFacingAngle();
      if (data.direction) this.direction = data.direction;
      if (typeof data.isBear === 'boolean') this.isBearForm = data.isBear;
    } else if (action === 'arrow') {
      this.bowAnim = 0.45;
      this.bowAngle = Math.atan2(data.dirY || 0, data.dirX || 1);
    } else if (action === 'dash') {
      this.dashAnim = 0.28;
      this.dashAngle = (typeof data.angle === 'number') ? data.angle : this.getFacingAngle();
      if (typeof data.isBear === 'boolean') this.isBearForm = data.isBear;
      this.dashGhosts.push({
        x: this.x,
        y: this.y,
        direction: this.direction,
        alpha: 0.75,
        isBear: this.isBearForm
      });
    } else if (action === 'shield') {
      this.shieldActive = Boolean(data.active);
    } else if (action === 'shield_block') {
      this.shieldBlockTimer = 0.28;
    } else if (action === 'spell_bear') {
      this.isBearForm = true;
    } else if (action === 'spell_plasma') {
      this.plasmaTimer = 2.0;
    } else if (action === 'teleport') {
      this.teleportSequence = {
        phase: 'sink',
        timer: 0,
        originX: data.originX || this.x,
        originY: data.originY || this.y,
        targetX: data.targetX,
        targetY: data.targetY,
        vortexAngle: 0
      };
    }
  }

  getFacingAngle() {
    switch (this.direction) {
      case 'up': return -Math.PI / 2;
      case 'down': return Math.PI / 2;
      case 'left': return Math.PI;
      case 'right': return 0;
      case 'up-left': return -Math.PI * 0.75;
      case 'up-right': return -Math.PI * 0.25;
      case 'down-left': return Math.PI * 0.75;
      case 'down-right': return Math.PI * 0.25;
      default: return 0;
    }
  }

  getFacingVector() {
    const angle = this.getFacingAngle();
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  render(ctx, animTime, nightFactor = 0) {
    if (this.isDead) return;

    const px = Math.round(this.x);
    const py = Math.round(this.y - this.visualElevation * ELEVATION_PIXEL_OFFSET);

    ctx.save();

    // 0. Dash Ghost Trails
    for (const ghost of this.dashGhosts) {
      ctx.save();
      ctx.globalAlpha = ghost.alpha * 0.75;
      const gx = Math.round(ghost.x);
      const gy = Math.round(ghost.y - this.visualElevation * ELEVATION_PIXEL_OFFSET);
      if (ghost.isBear) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.beginPath();
        ctx.ellipse(gx, gy - 8, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const skinDef = CHARACTERS_MAP[this.skinId] || CHARACTERS_MAP['ren_twilight'];
        if (skinDef && typeof skinDef.render === 'function') {
          skinDef.render(ctx, gx, gy, animTime, ghost.direction, true, 0);
        }
      }
      ctx.restore();
    }

    // 0b. Teleportation Void Vortex
    if (this.teleportSequence) {
      ctx.save();
      const seq = this.teleportSequence;
      const vScale = seq.phase === 'sink'
        ? Math.min(1.0, seq.timer / 0.18)
        : Math.max(0, 1.0 - seq.timer / 0.35);
      const vortexRadius = 22 * vScale;
      ctx.translate(px, py - 4);
      ctx.rotate(seq.vortexAngle);

      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, vortexRadius);
      grad.addColorStop(0, '#090514');
      grad.addColorStop(0.65, 'rgba(88, 28, 135, 0.85)');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, vortexRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.6;
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        const startA = (arm * Math.PI * 2) / 3;
        ctx.arc(0, 0, vortexRadius * 0.75, startA, startA + 1.2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 1. Weicher Papierschatten unter den Füßen
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.ellipse(px, py + 5, this.isBearForm ? 12 : 8, this.isBearForm ? 5 : 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Charakter Skin oder Druiden-Bärengestalt
    if (this.isBearForm) {
      this.renderBearForm(ctx, px, py, animTime);
    } else {
      const skinDef = CHARACTERS_MAP[this.skinId] || CHARACTERS_MAP['ren_twilight'];
      if (skinDef && typeof skinDef.render === 'function') {
        skinDef.render(ctx, px, py, animTime, this.direction, this.isMoving, this.hitFlash);
      } else {
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Schild-Blase (wenn aktiv) & Schild-Block Blitz
    if (this.shieldActive) {
      ctx.save();
      const pulse = 1.0 + Math.sin(animTime * 10) * 0.06;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(px, py - 4, (this.isBearForm ? 20 : 15) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (this.shieldBlockTimer > 0) {
      ctx.save();
      const flareRatio = 1.0 - (this.shieldBlockTimer / 0.28);
      ctx.strokeStyle = `rgba(56, 189, 248, ${1.0 - flareRatio})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px, py - 4, 14 + flareRatio * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Melee Schwung-Visual (Schwert, Stich, Spin & Bärenkrallen)
    if (this.swingAnim > 0) {
      ctx.save();
      const isSpin = this.swingType === 'spin' || this.swingType === 'bear_spin';
      const isThrust = this.swingType === 'thrust' || this.swingType === 'bear_thrust';
      const isBear = this.isBearForm || (this.swingType && this.swingType.startsWith('bear_'));
      const ang = this.swingAngle;

      if (isBear) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        if (isSpin) {
          ctx.arc(px, py - 6, 26 * (1.0 - this.swingAnim * 0.25), 0, Math.PI * 2);
        } else if (isThrust) {
          const tx = Math.cos(ang) * 26;
          const ty = Math.sin(ang) * 26;
          ctx.moveTo(px, py - 6);
          ctx.lineTo(px + tx, py - 6 + ty);
        } else {
          ctx.arc(px, py - 6, 22, ang - 0.75, ang + 0.75);
        }
        ctx.stroke();
      } else {
        ctx.strokeStyle = isSpin ? '#38bdf8' : '#f8fafc';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        if (isSpin) {
          ctx.arc(px, py - 6, 24 * (1.0 - this.swingAnim * 0.25), 0, Math.PI * 2);
        } else if (isThrust) {
          const tx = Math.cos(ang) * 24;
          const ty = Math.sin(ang) * 24;
          ctx.moveTo(px, py - 6);
          ctx.lineTo(px + tx, py - 6 + ty);
        } else {
          ctx.arc(px, py - 6, 18, ang - 0.7, ang + 0.7);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Bogen-Zielen & Abschuss-Visual
    if (this.bowAnim > 0 && !this.isBearForm) {
      ctx.save();
      ctx.translate(px, py - 6);
      ctx.rotate(this.bowAngle);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(6, 0, 7, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(6, -7);
      ctx.lineTo(2, 0);
      ctx.lineTo(6, 7);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Plasmakugeln im Orbit
    if (this.plasmaTimer > 0) {
      ctx.save();
      const orbDist = 20;
      for (let i = 0; i < 4; i++) {
        const orbAngle = animTime * 6 + (i * Math.PI) / 2;
        const ox = px + Math.cos(orbAngle) * orbDist;
        const oy = (py - 6) + Math.sin(orbAngle) * (orbDist * 0.65);

        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fdf2f8';
        ctx.beginPath();
        ctx.arc(ox, oy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. Nameplate & Level unter dem Charakter
    const baseUnderY = py + (this.isBearForm ? 12 : 9);
    if (this.name) {
      ctx.save();
      ctx.font = 'bold 8.5px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const nameY = baseUnderY;
      const text = `${this.name} (Lv.${this.level})`;
      const textMetrics = (typeof ctx.measureText === 'function') ? ctx.measureText(text) : { width: text.length * 5.2 };
      const textW = Math.max(16, textMetrics.width);
      const padX = 4;
      const badgeH = 11;

      // Dark Papercraft Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.fillRect(px - textW / 2 - padX, nameY - badgeH / 2, textW + padX * 2, badgeH);

      // Goldene Umrandung für Mitspieler
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(px - textW / 2 - padX, nameY - badgeH / 2, textW + padX * 2, badgeH);

      // Weißer Text
      ctx.fillStyle = '#f8fafc';
      if (typeof ctx.fillText === 'function') {
        ctx.fillText(text, px, nameY);
      }
      ctx.restore();
    }

    // 8. Lebensbalken direkt unter dem Namen (nur wenn verletzt)
    if (this.hp < this.maxHp && this.hp > 0) {
      const barW = 24;
      const barH = 3.5;
      const barX = px - barW / 2;
      const barY = baseUnderY + 8;
      const hpPct = Math.max(0, this.hp / this.maxHp);

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : (hpPct > 0.25 ? '#f59e0b' : '#ef4444');
      ctx.fillRect(barX, barY, barW * hpPct, barH);
      ctx.restore();
    }

    ctx.restore();
  }

  renderBearForm(ctx, px, py, animTime) {
    const vec = this.getFacingVector();
    const dx = vec.x;
    const dy = vec.y;
    const waddle = this.isMoving ? Math.sin(animTime * 9) * 2 : Math.sin(animTime * 2.5) * 0.5;
    const footStep = this.isMoving ? Math.cos(animTime * 9) * 2.5 : 0;

    const drawBox = (x, y, w, h, rad) => {
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, rad);
      } else {
        ctx.rect(x, y, w, h);
      }
    };

    ctx.save();

    // 1. Druidic Nature Aura Ring (Forest Emerald Glow)
    const auraPulse = 1.0 + Math.sin(animTime * 4) * 0.12;
    if (typeof ctx.createRadialGradient === 'function') {
      const auraGrad = ctx.createRadialGradient(px, py - 8, 4, px, py - 8, 22 * auraPulse);
      auraGrad.addColorStop(0, 'rgba(34, 197, 94, 0.35)');
      auraGrad.addColorStop(0.7, 'rgba(22, 163, 74, 0.15)');
      auraGrad.addColorStop(1, 'rgba(22, 101, 52, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(px, py - 8, 22 * auraPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Back Paws
    const hindY = py - 2;
    ctx.fillStyle = '#2e1507';
    ctx.beginPath();
    ctx.ellipse(px - 7, hindY - footStep * 0.5, 4.2, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + 7, hindY + footStep * 0.5, 4.2, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 3. Massive Bear Torso
    const bodyY = py - 13 + waddle;
    ctx.fillStyle = '#3d1d0a';
    ctx.beginPath();
    drawBox(px - 11, bodyY - 11, 22, 20, 7);
    ctx.fill();

    ctx.fillStyle = '#552a10';
    ctx.beginPath();
    drawBox(px - 10, bodyY - 10, 20, 18, 6);
    ctx.fill();

    // 4. Chest Crest
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.moveTo(px, bodyY - 7);
    ctx.lineTo(px + 6 + dx * 1.5, bodyY + 4 + dy);
    ctx.lineTo(px, bodyY + 7 + dy);
    ctx.lineTo(px - 6 + dx * 1.5, bodyY + 4 + dy);
    ctx.closePath();
    ctx.fill();

    // Emerald Spiral Mark
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(px + dx * 1.2, bodyY + dy * 0.8, 2.8, 0, Math.PI * 1.6);
    ctx.stroke();

    // 5. Head & Snout
    const headX = px + dx * 3;
    const headY = bodyY - 9 + dy * 2;

    // Ears
    ctx.fillStyle = '#3d1d0a';
    ctx.beginPath();
    ctx.arc(headX - 6.5, headY - 5, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX + 6.5, headY - 5, 3.6, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#5c3012';
    ctx.beginPath();
    ctx.ellipse(headX, headY, 8.5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    const snoutX = headX + dx * 2.5;
    const snoutY = headY + 2 + dy * 1.5;
    ctx.fillStyle = '#783c18';
    ctx.beginPath();
    ctx.ellipse(snoutX, snoutY, 4.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(snoutX + dx * 0.8, snoutY - 1 + dy * 0.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Emerald Eyes
    if (this.direction !== 'up') {
      const eyeY = headY - 1.5 + dy * 0.5;
      const eyeSpacing = 3.8;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(headX - eyeSpacing + dx * 0.8 - 1, eyeY, 2.2, 2.2);
      ctx.fillRect(headX + eyeSpacing + dx * 0.8 - 1, eyeY, 2.2, 2.2);
    }

    ctx.restore();
  }
}
