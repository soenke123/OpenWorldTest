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

    // Fog of War Canvases (Nebel des Krieges, persistent pro Dimension)
    this.fogCanvases = {};

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
    const titleEl = document.getElementById('minimap-title');
    const header = titleEl || document.getElementById('minimap-header');
    const legend = document.getElementById('minimap-legend');
    if (!header || !legend) return;

    if (this.dimension === 'clouds') {
      header.textContent = 'MINIMAP - 🌸 WOLKENREICH';
      legend.innerHTML = `
        <span class="legend-item"><i class="dot" style="background:#f472b6;"></i> Wolke</span>
        <span class="legend-item"><i class="dot" style="background:#facc15;"></i> Brücke</span>
        <span class="legend-item"><i class="dot" style="background:#130a24;"></i> Himmel</span>
        <span class="legend-item"><i class="dot" style="background:#fbbf24;"></i> Schrein</span>
      `;
    } else if (this.dimension === 'caves') {
      const cName = this.map.name || 'HÖHLENWELT';
      header.textContent = `MINIMAP - 🪨 ${cName.toUpperCase()}`;
      legend.innerHTML = `
        <span class="legend-item"><i class="dot" style="background:#334155;"></i> Fels</span>
        <span class="legend-item"><i class="dot" style="background:#0ea5e9;"></i> See</span>
        <span class="legend-item"><i class="dot" style="background:#fef08a;"></i> Ausgang</span>
        <span class="legend-item"><i class="dot" style="background:#f97316;"></i> Fackel</span>
        <span class="legend-item"><i class="dot" style="background:#fbbf24;"></i> Schrein</span>
      `;
    } else {
      header.textContent = 'MINIMAP - 🗺️ OBERWELT';
      legend.innerHTML = `
        <span class="legend-item"><i class="dot grass"></i> Gras</span>
        <span class="legend-item"><i class="dot desert"></i> Wüste</span>
        <span class="legend-item"><i class="dot snow"></i> Schnee</span>
        <span class="legend-item"><i class="dot swamp"></i> Sumpf</span>
        <span class="legend-item"><i class="dot void"></i> Leere</span>
      `;
    }
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

        // Shrine indicator (Golden Diamond)
        if (this.map.objects && this.map.objects[y] && this.map.objects[y][x] === 15) {
          this.bgCtx.fillStyle = '#facc15';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX) - 1,
            Math.floor(y * this.scaleY) - 1,
            3,
            3
          );
        }

        // Trampoline indicator (Pink Dot)
        if (this.map.objects && this.map.objects[y] && this.map.objects[y][x] === 14) {
          this.bgCtx.fillStyle = '#f472b6';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            2,
            2
          );
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

  render(player, camera) {
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
    const viewW = (camera.viewportWidth / camera.zoom) / TILE_SIZE * this.scaleX;
    const viewH = (camera.viewportHeight / camera.zoom) / TILE_SIZE * this.scaleY;
    const viewX = (camera.x / TILE_SIZE) * this.scaleX;
    const viewY = (camera.y / TILE_SIZE) * this.scaleY;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(viewX, viewY, viewW, viewH);

    // 5. Player Marker
    if (player) {
      const pX = (player.x / TILE_SIZE) * this.scaleX;
      const pY = (player.y / TILE_SIZE) * this.scaleY;

      this.ctx.fillStyle = '#ff2a55';
      this.ctx.beginPath();
      this.ctx.arc(pX, pY, 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(pX, pY, 4, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }
}
