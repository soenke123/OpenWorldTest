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

    this.shieldActive = Boolean(data.shieldActive);
    this.isBearForm = Boolean(data.isBearForm);
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
      this.swingAnim = Math.max(0, this.swingAnim - dt * 4);
    }
  }

  triggerAction(action, data = {}) {
    if (action === 'melee') {
      this.swingAnim = 1.0;
      this.swingType = data.subType || 'slash';
      if (data.direction) this.direction = data.direction;
    }
  }

  render(ctx, animTime, nightFactor = 0) {
    if (this.isDead) return;

    const px = Math.round(this.x);
    const py = Math.round(this.y - this.visualElevation * ELEVATION_PIXEL_OFFSET);

    ctx.save();

    // 1. Weicher Papierschatten unter den Füßen
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.ellipse(px, py + 5, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Charakter Skin rendern
    const skinDef = CHARACTERS_MAP[this.skinId] || CHARACTERS_MAP['ren_twilight'];
    if (skinDef && typeof skinDef.render === 'function') {
      skinDef.render(ctx, px, py, animTime, this.direction, this.isMoving, this.hitFlash);
    } else {
      // Fallback
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Schild-Blase (wenn aktiv)
    if (this.shieldActive) {
      ctx.save();
      const pulse = 1.0 + Math.sin(animTime * 10) * 0.06;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(px, py - 4, 15 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Melee Schwung-Visual
    if (this.swingAnim > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      let arcStart = 0;
      let arcEnd = Math.PI;
      if (this.direction === 'right') { arcStart = -Math.PI / 3; arcEnd = Math.PI / 3; }
      else if (this.direction === 'left') { arcStart = Math.PI * 2/3; arcEnd = Math.PI * 4/3; }
      else if (this.direction === 'up') { arcStart = -Math.PI * 5/6; arcEnd = -Math.PI / 6; }
      else { arcStart = Math.PI / 6; arcEnd = Math.PI * 5/6; }

      ctx.arc(px, py - 3, 16, arcStart, arcEnd);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Nameplate & Level unter dem Charakter
    const baseUnderY = py + 9;
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

    // 6. Lebensbalken direkt unter dem Namen (nur wenn verletzt)
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
}
