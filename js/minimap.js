import { MAP_WIDTH, MAP_HEIGHT, TILE_PROPS, CANOPY, TILE_SIZE } from './constants.js';

export class Minimap {
  constructor(canvasElement, map) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.map = map;
    this.dimension = 'overworld';

    this.scaleX = this.canvas.width / (this.map ? this.map.width : MAP_WIDTH);
    this.scaleY = this.canvas.height / (this.map ? this.map.height : MAP_HEIGHT);

    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = this.canvas.width;
    this.bgCanvas.height = this.canvas.height;
    this.bgCtx = this.bgCanvas.getContext('2d');
    this.bgCtx.imageSmoothingEnabled = false;

    // Fog of War Canvases & Explored Grids (persistent pro Dimension)
    this.fogCanvases = {};
    this.exploredGrids = {};

    this.renderStaticBackground();
  }

  getFogCanvasKey() {
    if (this.dimension === 'caves') {
      return `caves_${this.map.id || 'main'}`;
    }
    return this.dimension || 'overworld';
  }

  getFogCanvas() {
    const key = this.getFogCanvasKey();
    if (!this.fogCanvases[key]) {
      const fc = document.createElement('canvas');
      fc.width = this.canvas.width;
      fc.height = this.canvas.height;
      const fctx = fc.getContext('2d');
      fctx.fillStyle = '#06070d';
      fctx.fillRect(0, 0, fc.width, fc.height);
      this.fogCanvases[key] = { canvas: fc, ctx: fctx };
    }
    return this.fogCanvases[key];
  }

  resetFog() {
    this.fogCanvases = {};
    this.exploredGrids = {};
  }

  revealFog(playerX, playerY) {
    const fog = this.getFogCanvas();
    const fctx = fog.ctx;

    const mx = (playerX / TILE_SIZE) * this.scaleX;
    const my = (playerY / TILE_SIZE) * this.scaleY;
    const radius = Math.max(10, 20 * this.scaleX); // ~20 Kacheln Sichtradius

    fctx.save();
    fctx.globalCompositeOperation = 'destination-out';

    const grad = fctx.createRadialGradient(mx, my, radius * 0.65, mx, my, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    fctx.fillStyle = grad;
    fctx.beginPath();
    fctx.arc(mx, my, radius, 0, Math.PI * 2);
    fctx.fill();

    fctx.restore();

    // Track explored tiles in Uint8Array for Teleport validation & discovery checks
    const key = this.getFogCanvasKey();
    if (this.map) {
      if (!this.exploredGrids[key]) {
        this.exploredGrids[key] = new Uint8Array(this.map.width * this.map.height);
      }
      const grid = this.exploredGrids[key];
      const centerTx = Math.floor(playerX / TILE_SIZE);
      const centerTy = Math.floor(playerY / TILE_SIZE);
      const rTiles = 20;
      const r2 = rTiles * rTiles;
      for (let dy = -rTiles; dy <= rTiles; dy++) {
        const ty = centerTy + dy;
        if (ty < 0 || ty >= this.map.height) continue;
        for (let dx = -rTiles; dx <= rTiles; dx++) {
          const tx = centerTx + dx;
          if (tx < 0 || tx >= this.map.width) continue;
          if (dx * dx + dy * dy <= r2) {
            grid[ty * this.map.width + tx] = 1;
          }
        }
      }
    }
  }

  isTileExplored(tx, ty, dimensionKey = null) {
    const key = dimensionKey || this.getFogCanvasKey();
    const grid = this.exploredGrids[key];
    if (!grid) return false;
    if (!this.map || tx < 0 || tx >= this.map.width || ty < 0 || ty >= this.map.height) return false;
    return grid[ty * this.map.width + tx] === 1;
  }

  setMap(map, dimension = 'overworld') {
    this.map = map;
    this.dimension = dimension;
    this.scaleX = this.canvas.width / this.map.width;
    this.scaleY = this.canvas.height / this.map.height;
    this.updateHUD();
    this.renderStaticBackground();
  }
  updateHUD() {
    // Header & Legende wurden für minimalistisches Design entfernt
  }

  renderStaticBackground() {
    this.bgCtx.fillStyle = '#050508';
    this.bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const tile = this.map.getGroundTile(x, y);
        const props = TILE_PROPS[tile];
        let color = props ? props.minimapColor : '#222';

        // Biome-spezifische Farbgebung in Höhlen
        if (tile === 17) { // TILES.CAVE_WALL
          const theme = this.map.getTheme ? this.map.getTheme(x, y) : 'main';
          if (theme === 'snow') color = '#0c4a6e';
          else if (theme === 'void') color = '#1a052e';
          else if (theme === 'forest') color = '#14381a';
          else if (theme === 'desert') color = '#5c2406';
          else if (theme === 'swamp') color = '#1a2619';
          else if (theme === 'crystal') color = '#1e1b4b';
          else color = '#0f172a';
        } else if (tile === 16) { // TILES.CAVE_FLOOR
          const theme = this.map.getTheme ? this.map.getTheme(x, y) : 'main';
          if (theme === 'snow') color = '#38bdf8';
          else if (theme === 'void') color = '#6b21a8';
          else if (theme === 'forest') color = '#15803d';
          else if (theme === 'desert') color = '#b45309';
          else if (theme === 'swamp') color = '#3f6212';
          else if (theme === 'crystal') color = '#334155';
          else color = '#334155';
        } else if (tile === 18) { // TILES.CAVE_WATER
          const theme = this.map.getTheme ? this.map.getTheme(x, y) : 'main';
          if (theme === 'void') color = '#4c1d95';
          else if (theme === 'swamp') color = '#047857';
          else color = '#06b6d4';
        }

        this.bgCtx.fillStyle = color;
        this.bgCtx.fillRect(
          Math.floor(x * this.scaleX),
          Math.floor(y * this.scaleY),
          Math.ceil(this.scaleX) + 1,
          Math.ceil(this.scaleY) + 1
        );

        // Canopy overlay
        if (this.map.getCanopyTile && this.map.getCanopyTile(x, y) === CANOPY.TREE_CROWN) {
          this.bgCtx.fillStyle = '#16481e';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            Math.ceil(this.scaleX) + 1,
            Math.ceil(this.scaleY) + 1
          );
        }

        // Elevation tinting on minimap (plateaus lighter, holes darker)
        const elev = this.map.getElevation ? this.map.getElevation(x, y) : 0;
        if (elev > 0) {
          this.bgCtx.fillStyle = elev === 1 ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.35)';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            Math.ceil(this.scaleX) + 1,
            Math.ceil(this.scaleY) + 1
          );
        } else if (elev < 0) {
          this.bgCtx.fillStyle = 'rgba(0, 0, 0, 0.42)';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            Math.ceil(this.scaleX) + 1,
            Math.ceil(this.scaleY) + 1
          );
        }

        // Ramp indicator dot on minimap
        if (this.map.getRamp && this.map.getRamp(x, y) !== 0) {
          this.bgCtx.fillStyle = '#fbbf24';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            Math.ceil(this.scaleX),
            Math.ceil(this.scaleY)
          );
        }

        // Shrine indicator (Golden Pagoda Diamond 5x5)
        if (this.map.objects && this.map.objects[y] && this.map.objects[y][x] === 15) {
          const sx = Math.floor(x * this.scaleX) + 1;
          const sy = Math.floor(y * this.scaleY) + 1;
          this.bgCtx.fillStyle = '#b45309'; // Amber outline
          this.bgCtx.beginPath();
          this.bgCtx.moveTo(sx, sy - 3.5);
          this.bgCtx.lineTo(sx + 3.5, sy);
          this.bgCtx.lineTo(sx, sy + 3.5);
          this.bgCtx.lineTo(sx - 3.5, sy);
          this.bgCtx.closePath();
          this.bgCtx.fill();

          this.bgCtx.fillStyle = '#facc15'; // Bright Gold
          this.bgCtx.beginPath();
          this.bgCtx.moveTo(sx, sy - 2.5);
          this.bgCtx.lineTo(sx + 2.5, sy);
          this.bgCtx.lineTo(sx, sy + 2.5);
          this.bgCtx.lineTo(sx - 2.5, sy);
          this.bgCtx.closePath();
          this.bgCtx.fill();

          this.bgCtx.fillStyle = '#fef08a'; // Radiant core
          this.bgCtx.fillRect(sx - 0.5, sy - 0.5, 1.5, 1.5);
        }

        // Trampoline indicator (Bright Bouncy Magenta/Pink Disc 3x3)
        if (this.map.objects && this.map.objects[y] && this.map.objects[y][x] === 14) {
          const tx = Math.floor(x * this.scaleX);
          const ty = Math.floor(y * this.scaleY);
          this.bgCtx.fillStyle = '#be185d'; // Dark magenta border
          this.bgCtx.beginPath();
          this.bgCtx.arc(tx + 1, ty + 1, 3.2, 0, Math.PI * 2);
          this.bgCtx.fill();

          this.bgCtx.fillStyle = '#f472b6'; // Vibrant pink canvas
          this.bgCtx.beginPath();
          this.bgCtx.arc(tx + 1, ty + 1, 2.2, 0, Math.PI * 2);
          this.bgCtx.fill();

          this.bgCtx.fillStyle = '#ffffff'; // White highlight dot
          this.bgCtx.fillRect(tx + 0.5, ty + 0.5, 1, 1);
        }

        // Cave Entrance indicator (Dark Abyss Pit with Cyan Glowing Ring)
        if (this.map.objects && this.map.objects[y] && this.map.objects[y][x] === 16) {
          const cx = Math.floor(x * this.scaleX);
          const cy = Math.floor(y * this.scaleY);
          this.bgCtx.fillStyle = '#0284c7'; // Deep cyan outer ring
          this.bgCtx.beginPath();
          this.bgCtx.arc(cx + 1, cy + 1, 3.5, 0, Math.PI * 2);
          this.bgCtx.fill();

          this.bgCtx.fillStyle = '#38bdf8'; // Bright cyan glow
          this.bgCtx.beginPath();
          this.bgCtx.arc(cx + 1, cy + 1, 2.5, 0, Math.PI * 2);
          this.bgCtx.fill();

          this.bgCtx.fillStyle = '#020617'; // Pitch dark cave chasm
          this.bgCtx.beginPath();
          this.bgCtx.arc(cx + 1, cy + 1, 1.5, 0, Math.PI * 2);
          this.bgCtx.fill();
        }

        // Torch indicator in caves (Fiery Orange Dot)
        if (this.map.objects && this.map.objects[y] && this.map.objects[y][x] === 20) {
          this.bgCtx.fillStyle = '#f97316';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            2,
            2
          );
        }
      }
    }

    // Draw individual tree markers on minimap
    if (this.map.trees && this.map.trees.length > 0) {
      for (const tree of this.map.trees) {
        const mx = Math.floor((tree.x / TILE_SIZE) * this.scaleX);
        const my = Math.floor((tree.y / TILE_SIZE) * this.scaleY);
        let color = '#195420';
        if (tree.type === 2) color = '#0f3818';
        else if (tree.type === 4) color = '#e07a9e';
        else if (tree.type === 5) color = '#d97706';
        else if (tree.type === 6) color = '#b8d8ec';
        else if (tree.type === 7) color = '#344528';
        else if (tree.type === 8) color = '#78a638';

        this.bgCtx.fillStyle = color;
        this.bgCtx.fillRect(mx - 1, my - 1, 2, 2);
      }
    }
  }

  render(player, camera, remotePlayers = null) {
    // 0. Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Reveal Fog around player
    if (player && !player.isDead) {
      this.revealFog(player.x, player.y);
    }

    // 2. Pre-rendered terrain
    this.ctx.drawImage(this.bgCanvas, 0, 0);

    // 3. Fog of War Overlay (nur bereits erforschte Gebiete sind sichtbar!)
    const fog = this.getFogCanvas();
    if (fog && fog.canvas) {
      this.ctx.drawImage(fog.canvas, 0, 0);
    }

    // 4. Camera Viewport Box
    if (camera) {
      const viewW = (camera.viewportWidth / camera.zoom) / TILE_SIZE * this.scaleX;
      const viewH = (camera.viewportHeight / camera.zoom) / TILE_SIZE * this.scaleY;
      const viewX = (camera.x / TILE_SIZE) * this.scaleX;
      const viewY = (camera.y / TILE_SIZE) * this.scaleY;

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(viewX, viewY, viewW, viewH);
    }

    // 5. Remote Players (Andere Spieler auf der Minimap)
    if (remotePlayers) {
      const playersList = (remotePlayers instanceof Map) ? remotePlayers.values() : (Array.isArray(remotePlayers) ? remotePlayers : []);
      for (const rp of playersList) {
        if (!rp || rp.isDead) continue;
        if (rp.dimension && rp.dimension !== this.dimension) continue;

        const rx = (rp.x / TILE_SIZE) * this.scaleX;
        const ry = (rp.y / TILE_SIZE) * this.scaleY;

        // Leuchtender Cyan-Punkt mit Goldring
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.beginPath();
        this.ctx.arc(rx, ry, 3.2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.arc(rx, ry, 4.4, 0, Math.PI * 2);
        this.ctx.stroke();

        if (rp.name) {
          this.ctx.font = 'bold 8px system-ui, sans-serif';
          this.ctx.fillStyle = '#f8fafc';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(rp.name, rx, ry - 6);
        }
      }
    }

    // 6. Local Player Marker (Grüner Punkt mit weißer Umrandung)
    if (player && !player.isDead) {
      const pX = (player.x / TILE_SIZE) * this.scaleX;
      const pY = (player.y / TILE_SIZE) * this.scaleY;

      this.ctx.fillStyle = '#22c55e';
      this.ctx.beginPath();
      this.ctx.arc(pX, pY, 3.5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.4;
      this.ctx.beginPath();
      this.ctx.arc(pX, pY, 4.8, 0, Math.PI * 2);
      this.ctx.stroke();

      if (player.name) {
        this.ctx.font = 'bold 8px system-ui, sans-serif';
        this.ctx.fillStyle = '#4ade80';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(player.name, pX, pY - 6);
      }
    }
  }
}
