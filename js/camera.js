import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './constants.js';

export class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.y = 0;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.zoom = 3.0; // 3x zoom for crisp 16px pixel art

    this.mapWidth = MAP_WIDTH;
    this.mapHeight = MAP_HEIGHT;
    this.worldWidth = MAP_WIDTH * TILE_SIZE;
    this.worldHeight = MAP_HEIGHT * TILE_SIZE;
  }

  setWorldBounds(widthInTiles, heightInTiles) {
    this.mapWidth = widthInTiles;
    this.mapHeight = heightInTiles;
    this.worldWidth = widthInTiles * TILE_SIZE;
    this.worldHeight = heightInTiles * TILE_SIZE;
  }

  resize(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  follow(targetX, targetY) {
    const viewW = this.viewportWidth / this.zoom;
    const viewH = this.viewportHeight / this.zoom;

    if (this.worldWidth <= viewW) {
      this.x = (this.worldWidth - viewW) / 2;
    } else {
      const maxX = this.worldWidth - viewW;
      this.x = Math.max(0, Math.min(targetX - viewW / 2, maxX));
    }

    if (this.worldHeight <= viewH) {
      this.y = (this.worldHeight - viewH) / 2;
    } else {
      const maxY = this.worldHeight - viewH;
      this.y = Math.max(0, Math.min(targetY - viewH / 2, maxY));
    }
  }

  shake(amount = 4.0, duration = 0.15) {
    this.shakeAmount = amount;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  update(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const prog = Math.max(0, this.shakeTimer / this.shakeDuration);
      const mag = this.shakeAmount * prog;
      this.offsetX = (Math.random() - 0.5) * 2 * mag;
      this.offsetY = (Math.random() - 0.5) * 2 * mag;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }

  apply(ctx) {
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-Math.round(this.x + (this.offsetX || 0)), -Math.round(this.y + (this.offsetY || 0)));
  }

  release(ctx) {
    ctx.restore();
  }

  getVisibleTileBounds() {
    const mw = this.mapWidth || MAP_WIDTH;
    const mh = this.mapHeight || MAP_HEIGHT;
    const startX = Math.max(0, Math.floor(this.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(this.y / TILE_SIZE) - 1);
    const endX = Math.min(mw, Math.ceil((this.x + this.viewportWidth / this.zoom) / TILE_SIZE) + 2);
    const endY = Math.min(mh, Math.ceil((this.y + this.viewportHeight / this.zoom) / TILE_SIZE) + 2);

    return { startX, startY, endX, endY };
  }
}
