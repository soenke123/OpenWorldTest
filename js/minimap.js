import { MAP_WIDTH, MAP_HEIGHT, TILE_PROPS, CANOPY, TILE_SIZE, DIMENSIONS } from './constants.js';

export class Minimap {
  constructor(canvasElement, map) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.map = map;
    this.dimension = 'overworld';
    this.viewingDimension = 'overworld';

    this.scaleX = this.canvas.width / (this.map ? this.map.width : MAP_WIDTH);
    this.scaleY = this.canvas.height / (this.map ? this.map.height : MAP_HEIGHT);

    // Multi-Layer Caches & Grids
    this.maps = {};
    if (map) this.maps['overworld'] = map;
    this.bgCanvases = {};
    this.fogCanvases = {};
    this.exploredGrids = {};

    this.initTabsDOM();
  }

  normalizeDimensionKey(dim) {
    if (!dim) return 'overworld';
    if (dim === 'caves' || dim === 'main_complex') return 'caves_l1';
    if (dim === 'sub_crystal' || dim === 'caves_deep') return 'caves_l2';
    return dim;
  }

  registerMaps(mapDict) {
    if (!mapDict) return;
    for (const [key, m] of Object.entries(mapDict)) {
      const norm = this.normalizeDimensionKey(key);
      this.maps[norm] = m;
    }
    this.updateTabsUI();
  }

  getFogCanvasKey(dim = null) {
    return this.normalizeDimensionKey(dim || this.dimension);
  }

  getFogCanvas(dim = null) {
    const key = this.getFogCanvasKey(dim);
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
    this.updateTabsUI();
  }

  revealFog(playerX, playerY) {
    const key = this.getFogCanvasKey(this.dimension);
    const fog = this.getFogCanvas(this.dimension);
    const fctx = fog.ctx;

    const currentMap = this.maps[key] || this.map;
    if (!currentMap) return;

    const sX = this.canvas.width / currentMap.width;
    const sY = this.canvas.height / currentMap.height;

    const mx = (playerX / TILE_SIZE) * sX;
    const my = (playerY / TILE_SIZE) * sY;
    const radius = Math.max(10, 20 * sX); // ~20 Kacheln Sichtradius

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
    if (!this.exploredGrids[key]) {
      this.exploredGrids[key] = new Uint8Array(currentMap.width * currentMap.height);
    }
    const grid = this.exploredGrids[key];
    const centerTx = Math.floor(playerX / TILE_SIZE);
    const centerTy = Math.floor(playerY / TILE_SIZE);
    const rTiles = 20;
    const r2 = rTiles * rTiles;
    for (let dy = -rTiles; dy <= rTiles; dy++) {
      const ty = centerTy + dy;
      if (ty < 0 || ty >= currentMap.height) continue;
      for (let dx = -rTiles; dx <= rTiles; dx++) {
        const tx = centerTx + dx;
        if (tx < 0 || tx >= currentMap.width) continue;
        if (dx * dx + dy * dy <= r2) {
          grid[ty * currentMap.width + tx] = 1;
        }
      }
    }
  }

  isTileExplored(tx, ty, dimensionKey = null) {
    const key = this.normalizeDimensionKey(dimensionKey || this.dimension);
    const grid = this.exploredGrids[key];
    const map = this.maps[key] || this.map;
    if (!grid || !map) return false;
    if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return false;
    return grid[ty * map.width + tx] === 1;
  }

  getExplorationPercentage(dimensionKey = null) {
    const key = this.normalizeDimensionKey(dimensionKey || this.dimension);
    const grid = this.exploredGrids[key];
    const map = this.maps[key] || this.map;
    if (!grid || !map) return 0;
    let count = 0;
    const total = map.width * map.height;
    for (let i = 0; i < total; i++) {
      if (grid[i] === 1) count++;
    }
    // Erforschter Anteil in Relation zur Gesamtfläche (~60% Begehbarkeit)
    const pct = Math.min(100, Math.round((count / (total * 0.55)) * 100));
    return pct;
  }

  setMap(map, dimension = 'overworld') {
    this.map = map;
    const norm = this.normalizeDimensionKey(dimension);
    this.dimension = norm;
    this.maps[norm] = map;
    this.viewingDimension = norm;

    this.scaleX = this.canvas.width / this.map.width;
    this.scaleY = this.canvas.height / this.map.height;

    this.updateTabsUI();
  }

  setViewingDimension(dim) {
    this.viewingDimension = this.normalizeDimensionKey(dim);
    this.updateTabsUI();
  }

  initTabsDOM() {
    const buttons = document.querySelectorAll('.layer-tab-btn');
    buttons.forEach(btn => {
      const selectLayer = (e) => {
        e.stopPropagation();
        if (e.type === 'touchstart' && e.cancelable) {
          e.preventDefault();
        }
        const layer = btn.getAttribute('data-layer');
        if (layer) {
          this.setViewingDimension(layer);
        }
      };
      btn.addEventListener('pointerdown', selectLayer);
      btn.addEventListener('touchstart', selectLayer, { passive: false });
      btn.addEventListener('click', selectLayer);
    });
  }

  updateTabsUI() {
    const buttons = document.querySelectorAll('.layer-tab-btn');
    buttons.forEach(btn => {
      const layer = btn.getAttribute('data-layer');
      if (!layer) return;

      const normLayer = this.normalizeDimensionKey(layer);
      const isCurrent = normLayer === this.dimension;
      const isViewing = normLayer === this.viewingDimension;

      btn.classList.toggle('is-current-dim', isCurrent);
      btn.classList.toggle('selected', isViewing);

      const statusEl = document.getElementById(`layer-status-${layer}`);
      if (statusEl) {
        statusEl.textContent = `${this.getExplorationPercentage(layer)}%`;
      }
    });

    const titleEl = document.getElementById('minimap-viewing-title');
    if (titleEl) {
      const titles = {
        clouds: '☁️ Wolkenreich (+1)',
        overworld: '🌲 Oberwelt (0)',
        caves_l1: '🪨 Höhlen & Grotten (-1)',
        caves_l2: '💎 Kristall- & Magmatiefen (-2)'
      };
      titleEl.textContent = titles[this.viewingDimension] || 'Karte';
    }
  }

  getBgCanvas(key) {
    const dim = this.normalizeDimensionKey(key);
    if (!this.bgCanvases[dim]) {
      const c = document.createElement('canvas');
      c.width = this.canvas.width;
      c.height = this.canvas.height;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const map = this.maps[dim] || this.map;
      if (map) {
        this.renderStaticBackgroundForMap(map, c, ctx);
      }
      this.bgCanvases[dim] = { canvas: c, ctx };
    }
    return this.bgCanvases[dim];
  }

  renderStaticBackgroundForMap(map, targetCanvas, targetCtx) {
    targetCtx.fillStyle = '#050508';
    targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

    const sX = targetCanvas.width / map.width;
    const sY = targetCanvas.height / map.height;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.getGroundTile(x, y);
        const props = TILE_PROPS[tile];
        let color = props ? props.minimapColor : '#222';

        // Biome-spezifische Farbgebung in Höhlen
        if (tile === 31 || tile === 17) { // TILES.CAVE_WALL
          const theme = map.getTheme ? map.getTheme(x, y) : 'main';
          if (theme === 'snow') color = '#0c4a6e';
          else if (theme === 'void') color = '#1a052e';
          else if (theme === 'forest') color = '#14381a';
          else if (theme === 'desert') color = '#5c2406';
          else if (theme === 'swamp') color = '#1a2619';
          else if (theme === 'crystal') color = '#1e1b4b';
          else color = '#0f172a';
        } else if (tile === 30 || tile === 16) { // TILES.CAVE_FLOOR
          const theme = map.getTheme ? map.getTheme(x, y) : 'main';
          if (theme === 'snow') color = '#38bdf8';
          else if (theme === 'void') color = '#6b21a8';
          else if (theme === 'forest') color = '#15803d';
          else if (theme === 'desert') color = '#b45309';
          else if (theme === 'swamp') color = '#3f6212';
          else if (theme === 'crystal') color = '#334155';
          else color = '#334155';
        } else if (tile === 32 || tile === 18) { // TILES.CAVE_WATER
          const theme = map.getTheme ? map.getTheme(x, y) : 'main';
          if (theme === 'void') color = '#4c1d95';
          else if (theme === 'swamp') color = '#047857';
          else color = '#06b6d4';
        } else if (tile === 33) { // Lichtschacht
          color = '#fef08a';
        } else if (tile === 34) { // Leiter nach unten
          color = '#c084fc';
        } else if (tile === 35) { // Leiter nach oben
          color = '#38bdf8';
        }

        targetCtx.fillStyle = color;
        targetCtx.fillRect(
          Math.floor(x * sX),
          Math.floor(y * sY),
          Math.ceil(sX) + 1,
          Math.ceil(sY) + 1
        );

        // Canopy overlay
        if (map.getCanopyTile && map.getCanopyTile(x, y) === CANOPY.TREE_CROWN) {
          targetCtx.fillStyle = '#16481e';
          targetCtx.fillRect(
            Math.floor(x * sX),
            Math.floor(y * sY),
            Math.ceil(sX) + 1,
            Math.ceil(sY) + 1
          );
        }

        // Elevation tinting on minimap
        const elev = map.getElevation ? map.getElevation(x, y) : 0;
        if (elev > 0) {
          targetCtx.fillStyle = elev === 1 ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.35)';
          targetCtx.fillRect(Math.floor(x * sX), Math.floor(y * sY), Math.ceil(sX) + 1, Math.ceil(sY) + 1);
        } else if (elev < 0) {
          targetCtx.fillStyle = 'rgba(0, 0, 0, 0.42)';
          targetCtx.fillRect(Math.floor(x * sX), Math.floor(y * sY), Math.ceil(sX) + 1, Math.ceil(sY) + 1);
        }

        // Ramp indicator dot on minimap
        if (map.getRamp && map.getRamp(x, y) !== 0) {
          targetCtx.fillStyle = '#fbbf24';
          targetCtx.fillRect(Math.floor(x * sX), Math.floor(y * sY), Math.ceil(sX), Math.ceil(sY));
        }

        // Shrine indicator (Golden Pagoda Diamond)
        if (map.objects && map.objects[y] && map.objects[y][x] === 15) {
          const sx = Math.floor(x * sX) + 1;
          const sy = Math.floor(y * sY) + 1;
          targetCtx.fillStyle = '#b45309';
          targetCtx.beginPath();
          targetCtx.moveTo(sx, sy - 3.5);
          targetCtx.lineTo(sx + 3.5, sy);
          targetCtx.lineTo(sx, sy + 3.5);
          targetCtx.lineTo(sx - 3.5, sy);
          targetCtx.closePath();
          targetCtx.fill();

          targetCtx.fillStyle = '#facc15';
          targetCtx.beginPath();
          targetCtx.moveTo(sx, sy - 2.5);
          targetCtx.lineTo(sx + 2.5, sy);
          targetCtx.lineTo(sx, sy + 2.5);
          targetCtx.lineTo(sx - 2.5, sy);
          targetCtx.closePath();
          targetCtx.fill();
        }

        // Cave Entrance indicator (on Overworld)
        if (map.objects && map.objects[y] && map.objects[y][x] === 16) {
          const cx = Math.floor(x * sX);
          const cy = Math.floor(y * sY);
          targetCtx.fillStyle = '#0284c7';
          targetCtx.beginPath();
          targetCtx.arc(cx + 1, cy + 1, 3.2, 0, Math.PI * 2);
          targetCtx.fill();

          targetCtx.fillStyle = '#38bdf8';
          targetCtx.beginPath();
          targetCtx.arc(cx + 1, cy + 1, 2.2, 0, Math.PI * 2);
          targetCtx.fill();

          targetCtx.fillStyle = '#020617';
          targetCtx.beginPath();
          targetCtx.arc(cx + 1, cy + 1, 1.2, 0, Math.PI * 2);
          targetCtx.fill();
        }

        // Ladder / Exit indicators in caves
        if (tile === 33 || tile === 34 || tile === 35) {
          const lx = Math.floor(x * sX);
          const ly = Math.floor(y * sY);
          targetCtx.fillStyle = (tile === 33) ? '#fef08a' : ((tile === 34) ? '#c084fc' : '#38bdf8');
          targetCtx.fillRect(lx - 1, ly - 1, 3, 3);
        }
      }
    }
  }

  render(player, camera, remotePlayers = null) {
    // 0. Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Reveal Fog around player on player's current dimension
    if (player && !player.isDead) {
      this.revealFog(player.x, player.y);
    }

    const isExpanded = document.getElementById('minimap-container')?.classList.contains('expanded');
    const displayDim = isExpanded ? (this.viewingDimension || this.dimension) : this.dimension;
    const activeMap = this.maps[displayDim] || this.map;
    const sX = this.canvas.width / (activeMap ? activeMap.width : MAP_WIDTH);
    const sY = this.canvas.height / (activeMap ? activeMap.height : MAP_HEIGHT);

    // 2. Pre-rendered terrain background of displayed dimension
    const bg = this.getBgCanvas(displayDim);
    if (bg && bg.canvas) {
      this.ctx.drawImage(bg.canvas, 0, 0);
    }

    // 3. Fog of War Overlay of displayed dimension
    const fog = this.getFogCanvas(displayDim);
    if (fog && fog.canvas) {
      this.ctx.drawImage(fog.canvas, 0, 0);
    }

    // 4. Camera Viewport Box & Local Player (nur wenn die aktuelle Ebene betrachtet wird!)
    if (displayDim === this.dimension) {
      if (camera) {
        const viewW = (camera.viewportWidth / camera.zoom) / TILE_SIZE * sX;
        const viewH = (camera.viewportHeight / camera.zoom) / TILE_SIZE * sY;
        const viewX = (camera.x / TILE_SIZE) * sX;
        const viewY = (camera.y / TILE_SIZE) * sY;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(viewX, viewY, viewW, viewH);
      }

      if (player && !player.isDead) {
        const pX = (player.x / TILE_SIZE) * sX;
        const pY = (player.y / TILE_SIZE) * sY;

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

    // 5. Remote Players (Andere Spieler auf derselben angezeigten Ebene)
    if (remotePlayers) {
      const playersList = (remotePlayers instanceof Map) ? remotePlayers.values() : (Array.isArray(remotePlayers) ? remotePlayers : []);
      for (const rp of playersList) {
        if (!rp || rp.isDead) continue;
        const rpDim = this.normalizeDimensionKey(rp.dimension);
        if (rpDim !== displayDim) continue;

        const rx = (rp.x / TILE_SIZE) * sX;
        const ry = (rp.y / TILE_SIZE) * sY;

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
  }
}

