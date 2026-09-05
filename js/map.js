import { MAP_WIDTH, MAP_HEIGHT, TILES, TILE_PROPS, OBJECTS, OBJ_PROPS, CANOPY, BIOMES, TREES, TILE_SIZE, TILE_LAYER_ORDER, ELEVATION, RAMPS } from './constants.js';
import { Noise2D } from './noise.js';
import { getWorldPreset, getSelectedWorldId } from './worldPresets.js';

export class WorldMap {
  constructor(presetId = null) {
    const id = presetId !== null ? presetId : getSelectedWorldId();
    this.preset = (typeof id === 'object' && id !== null) ? id : getWorldPreset(id);

    this.width = this.preset.width || MAP_WIDTH;
    this.height = this.preset.height || MAP_HEIGHT;

    this.ground = [];
    this.objects = [];
    this.canopy = [];
    this.canopyCrowns = [];
    this.trees = [];
    this.kodamas = [];
    this.elevation = []; // Int8Array: -1, 0, 1, 2
    this.ramps = [];     // Uint8Array: RAMPS.*
    this.holeEntrances = []; // Portale / Zugänge zu Höhlen
    this.trampolines = [];   // Trampoline zum Wolkenreich
    this.shrines = [];       // Shinto-Schreine auf der Oberwelt

    this.spawnPoint = { ...this.preset.spawnPoint };
    this.noise = new Noise2D(this.preset.seed || 4242);

    this.initMap();
  }

  initMap() {
    for (let y = 0; y < this.height; y++) {
      this.ground[y] = new Uint8Array(this.width);
      this.objects[y] = new Uint8Array(this.width);
      this.canopy[y] = new Uint8Array(this.width);
      this.elevation[y] = new Int8Array(this.width); // 0 by default (ELEVATION.GROUND)
      this.ramps[y] = new Uint8Array(this.width);     // 0 by default (RAMPS.NONE)
    }

    const n = this.noise;
    const p = this.preset;
    const mb = p.mainBiome || 'grass';
    const vz = p.voidZone || { x: 268, y: 40, radius: 18 };

    // --------------------------------------------------------------------
    // STEP 1: ORGANIC BIOME ASSIGNMENT WITH DOMAIN WARPING & MAIN BIOME
    // --------------------------------------------------------------------
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Domain warping for natural curvy biome borders
        const warpX = x + n.fbm(x * 0.02, y * 0.02, 3) * 16;
        const warpY = y + n.fbm((x + 60) * 0.02, (y + 60) * 0.02, 3) * 16;

        const nx = warpX / this.width;
        const ny = warpY / this.height;

        let tile = TILES.GRASS;

        if (mb === 'snow') {
          // Main Biome: Snow dominates ~70% of the world
          tile = TILES.SNOW;
          // Thawed central valley around spawn
          if (nx > 0.12 && nx < 0.48 && ny > 0.32 && ny < 0.70) {
            tile = TILES.GRASS;
          }
          // Far desert plateau in southwest corner
          else if (nx < 0.22 && ny > 0.72) {
            tile = TILES.SAND;
          }
          // Frosted marsh / swamp pocket
          else if (nx > 0.55 && nx < 0.75 && ny > 0.68) {
            tile = TILES.SWAMP_GROUND;
          }
        } else if (mb === 'desert') {
          // Main Biome: Desert dominates ~70% of the world
          tile = TILES.SAND;
          // Green oasis valley around spawn
          if (nx > 0.14 && nx < 0.46 && ny > 0.34 && ny < 0.68) {
            tile = TILES.GRASS;
          }
          // High snow peaks in northeast corner
          else if (nx > 0.70 && ny < 0.34) {
            tile = TILES.SNOW;
          }
          // Mud oasis / swamp in southeast
          else if (nx > 0.52 && nx < 0.72 && ny > 0.62) {
            tile = TILES.SWAMP_GROUND;
          }
        } else {
          // Main Biome: Grassland dominates ~70% of the world
          tile = TILES.GRASS;
          // Snow & Ice in Northeast
          if (nx > 0.64 && ny < 0.42) {
            tile = TILES.SNOW;
          }
          // Desert & Quicksand in Southwest
          else if (nx < 0.36 && ny > 0.60) {
            tile = TILES.SAND;
          }
          // Swamp in Southeast
          else if (nx > 0.48 && nx < 0.78 && ny > 0.62) {
            tile = TILES.SWAMP_GROUND;
          }
        }

        // Void Zone: Strictly 1 Single edge rift
        const distVoid = Math.hypot(x - vz.x, y - vz.y);
        if (distVoid < vz.radius) {
          tile = TILES.VOID_GROUND;
        }

        // Spawn Clearing: Dedicated large open flat area around spawn
        const distSpawn = Math.hypot(x - this.spawnPoint.x, y - this.spawnPoint.y);
        if (distSpawn < p.spawnClearingRadius) {
          tile = (mb === 'snow' ? TILES.SNOW : (mb === 'desert' ? TILES.SAND : TILES.GRASS));
        }

        this.ground[y][x] = tile;
      }
    }

    // --------------------------------------------------------------------
    // STEP 2: LARGE RIVERS & WATER BODIES
    // --------------------------------------------------------------------
    // Major meandering river flowing north to south across the world
    const riverBaseX = Math.round(this.width * 0.42);
    for (let y = 0; y < this.height; y++) {
      const riverCenter = riverBaseX + Math.sin(y * 0.04) * 22 + n.noise(y * 0.02, 10) * 26;
      const riverWidth = 4.5 + Math.sin(y * 0.08) * 1.5;

      for (let x = 0; x < this.width; x++) {
        // Protect spawn clearing from river cuts
        const distSpawn = Math.hypot(x - this.spawnPoint.x, y - this.spawnPoint.y);
        if (distSpawn < p.spawnClearingRadius + 4) continue;

        const dist = Math.abs(x - riverCenter);
        if (dist < riverWidth) {
          if (this.ground[y][x] === TILES.SWAMP_GROUND) {
            this.ground[y][x] = TILES.SWAMP_WATER;
          } else if (this.ground[y][x] !== TILES.VOID_GROUND) {
            this.ground[y][x] = TILES.WATER;
          }
        }
      }
    }

    // Second River Branch (for wide multi-river worlds)
    if (p.id % 2 === 0) {
      const river2BaseX = Math.round(this.width * 0.74);
      for (let y = 0; y < this.height; y++) {
        const riverCenter2 = river2BaseX + Math.sin((y + 30) * 0.045) * 18 + n.noise(y * 0.025, 25) * 20;
        const riverWidth2 = 3.8 + Math.sin(y * 0.09) * 1.2;

        for (let x = 0; x < this.width; x++) {
          const distVoid = Math.hypot(x - vz.x, y - vz.y);
          if (distVoid < vz.radius + 3) continue;

          const dist = Math.abs(x - riverCenter2);
          if (dist < riverWidth2) {
            if (this.ground[y][x] === TILES.SWAMP_GROUND) {
              this.ground[y][x] = TILES.SWAMP_WATER;
            } else if (this.ground[y][x] !== TILES.VOID_GROUND) {
              this.ground[y][x] = TILES.WATER;
            }
          }
        }
      }
    }

    // Large Organic Lakes
    // 1. Central Great Lake
    this.createOrganicBlob(Math.round(this.width * 0.52), Math.round(this.height * 0.44), 16, TILES.WATER, 0.55);

    // 2. Northern Mountain Tarn / Glacier Lake
    this.createOrganicBlob(Math.round(this.width * 0.76), Math.round(this.height * 0.22), 14, TILES.WATER, 0.58);

    // 3. Desert Oasis Pool / Quicksand
    const oasisX = Math.round(this.width * 0.22);
    const oasisY = Math.round(this.height * 0.75);
    this.createOrganicBlob(oasisX, oasisY, 11, TILES.WATER, 0.5);
    this.createOrganicBlob(oasisX + 18, oasisY + 8, 9, TILES.QUICKSAND, 0.48);

    // 4. Swamp Lagoon
    this.createOrganicBlob(Math.round(this.width * 0.64), Math.round(this.height * 0.74), 13, TILES.SWAMP_WATER, 0.54);

    // 5. Void Lake (Jagged Abyss in the Void Zone)
    this.createOrganicBlob(vz.x, vz.y, Math.round(vz.radius * 0.55), TILES.VOID_LAKE, 0.52);

    // --------------------------------------------------------------------
    // STEP 3: WOODEN BRIDGES OVER RIVERS
    // --------------------------------------------------------------------
    const bridgePositionsY = [
      Math.round(this.height * 0.25),
      Math.round(this.height * 0.50),
      Math.round(this.height * 0.78)
    ];

    for (const by of bridgePositionsY) {
      for (let x = 10; x < this.width - 10; x++) {
        if (this.ground[by][x] === TILES.WATER || this.ground[by][x] === TILES.SWAMP_WATER) {
          // Verify if it's a river crossing (has solid banks on left and right)
          let hasLeftBank = false;
          let hasRightBank = false;
          for (let k = 1; k <= 14; k++) {
            if (x - k >= 0 && this.ground[by][x - k] !== TILES.WATER && this.ground[by][x - k] !== TILES.SWAMP_WATER) hasLeftBank = true;
            if (x + k < this.width && this.ground[by][x + k] !== TILES.WATER && this.ground[by][x + k] !== TILES.SWAMP_WATER) hasRightBank = true;
          }
          if (hasLeftBank && hasRightBank) {
            this.ground[by - 1][x] = TILES.BRIDGE_H;
            this.ground[by][x] = TILES.BRIDGE_H;
          }
        }
      }
    }

    // --------------------------------------------------------------------
    // STEP 4: WINDING DIRT TRAILS
    // --------------------------------------------------------------------
    // Connect spawn clearing to central bridge and northern/southern forests
    this.createWindingPath(this.spawnPoint.x + p.spawnClearingRadius - 2, this.spawnPoint.y, riverBaseX - 4, bridgePositionsY[1], 2);
    this.createWindingPath(this.spawnPoint.x, this.spawnPoint.y - p.spawnClearingRadius + 2, Math.round(this.width * 0.25), Math.round(this.height * 0.28), 2);
    this.createWindingPath(this.spawnPoint.x, this.spawnPoint.y + p.spawnClearingRadius - 2, Math.round(this.width * 0.25), Math.round(this.height * 0.72), 2);

    // --------------------------------------------------------------------
    // STEP 5: MULTI-TIER ELEVATION SYSTEM (Hills +1, +2 and Valleys -1)
    // --------------------------------------------------------------------
    this.generateElevationsAndRamps();

    // --------------------------------------------------------------------
    // STEP 6: MULTIPLE FORESTS (4 to 7 Distinct Forests, Large & Small)
    // --------------------------------------------------------------------
    this.generateMultipleForests();

    // --------------------------------------------------------------------
    // STEP 7: BIOME TREES & PROPS OUTSIDE DENSE FORESTS
    // --------------------------------------------------------------------
    this.populateBiomeTreesAndFlora();

    // --------------------------------------------------------------------
    // STEP 8: SPAWN CLEARING CLEANUP (100% Flat, Free & Open)
    // --------------------------------------------------------------------
    this.clearSpawnArea();

    // --------------------------------------------------------------------
    // STEP 9: SHINTO-SCHREINE (5 to 8 Overworld + Void Shrine)
    // --------------------------------------------------------------------
    this.placeOverworldShrines();

    // --------------------------------------------------------------------
    // STEP 10: TRAMPOLINE ZUM WOLKENREICH (5 to 10 pro Karte)
    // --------------------------------------------------------------------
    this.placeTrampolines();

    // --------------------------------------------------------------------
    // STEP 11: HÖHLEN-ZUGÄNGE
    // --------------------------------------------------------------------
    this.placeCaveEntrances();

    // --------------------------------------------------------------------
    // STEP 12: RAMPEN & TREPPEN FREIHALTEN
    // --------------------------------------------------------------------
    this.clearRampsAndAccessCorridors();

    // --------------------------------------------------------------------
    // STEP 13: OUTER 2-TILE WATER BORDER
    // --------------------------------------------------------------------
    for (let x = 0; x < this.width; x++) {
      this.ground[0][x] = TILES.WATER;
      this.ground[1][x] = TILES.WATER;
      this.ground[this.height - 1][x] = TILES.WATER;
      this.ground[this.height - 2][x] = TILES.WATER;
    }
    for (let y = 0; y < this.height; y++) {
      this.ground[y][0] = TILES.WATER;
      this.ground[y][1] = TILES.WATER;
      this.ground[y][this.width - 1] = TILES.WATER;
      this.ground[y][this.width - 2] = TILES.WATER;
    }
  }

  clearSpawnArea() {
    const sp = this.spawnPoint;
    const rad = this.preset.spawnClearingRadius || 15;
    const mb = this.preset.mainBiome;
    const baseTile = (mb === 'snow' ? TILES.SNOW : (mb === 'desert' ? TILES.SAND : TILES.GRASS));

    for (let dy = -rad - 1; dy <= rad + 1; dy++) {
      for (let dx = -rad - 1; dx <= rad + 1; dx++) {
        const x = sp.x + dx;
        const y = sp.y + dy;
        if (!this.isValid(x, y)) continue;

        const dist = Math.hypot(dx, dy);
        if (dist <= rad) {
          this.ground[y][x] = baseTile;
          this.objects[y][x] = OBJECTS.NONE;
          this.canopy[y][x] = CANOPY.NONE;
          this.elevation[y][x] = ELEVATION.GROUND;
          this.ramps[y][x] = RAMPS.NONE;
        }
      }
    }

    // Remove any trees inside spawn area
    this.trees = this.trees.filter(t => Math.hypot(t.x - sp.x * TILE_SIZE, t.y - sp.y * TILE_SIZE) > (rad * TILE_SIZE));
    this.canopyCrowns = this.canopyCrowns.filter(c => Math.hypot(c.x - sp.x * TILE_SIZE, c.y - sp.y * TILE_SIZE) > (rad * TILE_SIZE));
  }

  generateMultipleForests() {
    const n = this.noise;
    const p = this.preset;
    const count = p.forestCount || 5;

    // Define forest centers spread across the 290x200 world
    const forestCenters = [
      { cx: Math.round(this.width * 0.18), cy: Math.round(this.height * 0.25), r: 20, type: TREES.OAK, name: 'Smaragd-Urwald' },
      { cx: Math.round(this.width * 0.62), cy: Math.round(this.height * 0.18), r: 24, type: (p.mainBiome === 'snow' ? TREES.SNOWY_PINE : TREES.PINE), name: 'Nord-Kiefernforst' },
      { cx: Math.round(this.width * 0.20), cy: Math.round(this.height * 0.72), r: 18, type: (p.mainBiome === 'desert' ? TREES.PALM : TREES.BIRCH), name: 'Südwest-Hain' },
      { cx: Math.round(this.width * 0.78), cy: Math.round(this.height * 0.52), r: 22, type: TREES.AUTUMN, name: 'Goldblätterwald' },
      { cx: Math.round(this.width * 0.48), cy: Math.round(this.height * 0.82), r: 16, type: (p.mainBiome === 'snow' ? TREES.SNOWY_PINE : TREES.BLOSSOM), name: 'Blüten-Dickicht' },
      { cx: Math.round(this.width * 0.85), cy: Math.round(this.height * 0.80), r: 15, type: TREES.PINE, name: 'Ostgipfel-Gehölz' },
      { cx: Math.round(this.width * 0.35), cy: Math.round(this.height * 0.45), r: 14, type: TREES.BIRCH, name: 'Flussaue-Wäldchen' }
    ].slice(0, count);

    for (const f of forestCenters) {
      this.buildDenseForest(f.cx, f.cy, f.r, f.type);
    }
  }

  buildDenseForest(cx, cy, radius, primaryTreeType) {
    const n = this.noise;
    const r = radius;

    // 1. Canopy roof
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (!this.isValid(x, y)) continue;
        const g = this.ground[y][x];
        if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE || g === TILES.BRIDGE_H) continue;
        if (Math.hypot(x - this.spawnPoint.x, y - this.spawnPoint.y) < this.preset.spawnClearingRadius + 2) continue;

        const dist = Math.hypot(x - cx, y - cy);
        const density = n.fbm(x * 0.12, y * 0.12, 2);
        if (dist < r + density * 6) {
          if (n.noise(x * 0.28, y * 0.28) > -0.1 && g !== TILES.SNOW && g !== TILES.SAND && g !== TILES.VOID_GROUND) {
            this.ground[y][x] = TILES.DIRT;
          }

          const gapNoise = n.noise(x * 0.35, y * 0.35);
          if (gapNoise > 0.68) {
            this.canopy[y][x] = CANOPY.NONE;
            if (n.noise(x * 1.7, y * 1.7) > 0.2) {
              this.objects[y][x] = OBJECTS.FOREST_FLOWERS;
            } else if (n.noise(x * 1.7, y * 1.7) < -0.2) {
              this.objects[y][x] = OBJECTS.FERN;
            }
          } else {
            this.canopy[y][x] = CANOPY.TREE_CROWN;
          }
        }
      }
    }

    // 2. Large overlapping canopy crowns
    const crownSpacingX = 18;
    const crownSpacingY = 16;
    const minPy = Math.max(2, cy - r) * TILE_SIZE;
    const maxPy = Math.min(this.height - 2, cy + r) * TILE_SIZE;
    const minPx = Math.max(2, cx - r) * TILE_SIZE;
    const maxPx = Math.min(this.width - 2, cx + r) * TILE_SIZE;

    for (let py = minPy; py <= maxPy; py += crownSpacingY) {
      const rowIndex = Math.floor(py / crownSpacingY);
      const rowOffset = (rowIndex % 2 === 1) ? crownSpacingX * 0.5 : 0;

      for (let px = minPx; px <= maxPx; px += crownSpacingX) {
        const jx = px + rowOffset + n.noise(px * 0.15, py * 0.15) * 5;
        const jy = py + n.noise(px * 0.25, py * 0.25) * 5;

        const tileX = Math.floor(jx / TILE_SIZE);
        const tileY = Math.floor(jy / TILE_SIZE);

        if (!this.isValid(tileX, tileY)) continue;
        if (this.canopy[tileY][tileX] !== CANOPY.TREE_CROWN) continue;

        const radiusCrown = 17 + Math.abs(n.noise(tileX * 0.85, tileY * 0.85)) * 5;
        const hasLantern = (n.noise(jx * 0.18, jy * 0.18) > 0.68);

        this.canopyCrowns.push({
          x: jx,
          y: jy,
          type: primaryTreeType,
          radius: radiusCrown,
          hasLantern
        });
      }
    }

    // 3. Walkable Tree Trunks under the canopy
    for (let ty = cy - r + 2; ty <= cy + r - 2; ty += 4) {
      for (let tx = cx - r + 2; tx <= cx + r - 2; tx += 4) {
        const jx = tx + (n.noise(tx * 1.3, ty * 1.3) * 1.4);
        const jy = ty + (n.noise(tx * 2.1, ty * 2.1) * 1.4);
        const rx = Math.round(jx);
        const ry = Math.round(jy);
        if (!this.isValid(rx, ry)) continue;
        const gTile = this.ground[ry][rx];
        if (gTile === TILES.WATER || gTile === TILES.SWAMP_WATER || gTile === TILES.BRIDGE_H) continue;
        if (Math.hypot(rx - this.spawnPoint.x, ry - this.spawnPoint.y) < this.preset.spawnClearingRadius) continue;

        const dist = Math.hypot(rx - cx, ry - cy);
        if (dist < r - 2) {
          const variant = Math.abs(Math.floor(n.noise(rx * 3.3, ry * 3.3) * 10)) % 2;
          this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, primaryTreeType, variant);

          // Flora & selective obstacles
          const obstRand = n.noise(rx * 1.9, ry * 1.9);
          if (obstRand > 0.62 && rx + 1 < this.width && this.objects[ry][rx + 1] === OBJECTS.NONE) {
            this.objects[ry][rx + 1] = OBJECTS.FALLEN_LOG;
          } else if (obstRand < -0.62 && ry + 1 < this.height && this.objects[ry + 1][rx] === OBJECTS.NONE) {
            this.objects[ry + 1][rx] = OBJECTS.ROCK_STONE;
          }

          const underRand = n.noise(rx * 2.5, ry * 2.5);
          if (underRand > 0.45 && this.objects[ry][rx] === OBJECTS.NONE) {
            this.objects[ry][rx] = OBJECTS.FERN;
          } else if (underRand < -0.45 && this.objects[ry][rx] === OBJECTS.NONE) {
            this.objects[ry][rx] = OBJECTS.MUSHROOM_BROWN;
          }
        }
      }
    }
  }

  populateBiomeTreesAndFlora() {
    const n = this.noise;
    for (let ty = 6; ty < this.height - 6; ty += 5) {
      for (let tx = 6; tx < this.width - 6; tx += 5) {
        if (!this.isValid(tx, ty)) continue;
        if (this.canopy[ty][tx] === CANOPY.TREE_CROWN) continue;
        if (Math.hypot(tx - this.spawnPoint.x, ty - this.spawnPoint.y) < this.preset.spawnClearingRadius) continue;

        const g = this.ground[ty][tx];
        const jx = tx + n.noise(tx * 1.4, ty * 1.4) * 1.6;
        const jy = ty + n.noise(tx * 2.2, ty * 2.2) * 1.6;
        const rx = Math.round(jx);
        const ry = Math.round(jy);
        if (!this.isValid(rx, ry)) continue;
        if (this.objects[ry][rx] !== OBJECTS.NONE) continue;

        if (g === TILES.SNOW && n.fbm(rx * 0.1, ry * 0.1, 2) > 0.15) {
          this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, TREES.SNOWY_PINE, Math.abs(rx) % 2);
        } else if (g === TILES.SAND && n.fbm(rx * 0.1, ry * 0.1, 2) > 0.25) {
          // Date Palm or Cactus
          if (n.noise(rx * 0.5, ry * 0.5) > 0.1) {
            this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, TREES.PALM, Math.abs(rx) % 2);
          } else {
            this.objects[ry][rx] = OBJECTS.CACTUS;
          }
        } else if (g === TILES.SWAMP_GROUND && n.fbm(rx * 0.1, ry * 0.1, 2) > 0.18) {
          this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, TREES.SWAMP_WILLOW, Math.abs(rx) % 2);
        }
      }
    }
  }

  placeOverworldShrines() {
    this.shrines = [];
    const p = this.preset;
    const count = p.shrineCount || 7;

    const shrineCandidates = [
      { x: this.spawnPoint.x + 18, y: this.spawnPoint.y - 12, name: 'Schrein des Erwachens' },
      { x: Math.round(this.width * 0.38), y: Math.round(this.height * 0.26), name: 'Schrein der Waldgeister' },
      { x: Math.round(this.width * 0.55), y: Math.round(this.height * 0.38), name: 'Schrein des Binnensees' },
      { x: Math.round(this.width * 0.72), y: Math.round(this.height * 0.24), name: 'Schrein des Ewigen Eises' },
      { x: Math.round(this.width * 0.25), y: Math.round(this.height * 0.70), name: 'Schrein der Sonnendüne' },
      { x: Math.round(this.width * 0.70), y: Math.round(this.height * 0.72), name: 'Schrein der Nebelmoore' },
      { x: Math.round(this.width * 0.82), y: Math.round(this.height * 0.44), name: 'Schrein der Morgendämmerung' },
      { x: Math.round(this.width * 0.45), y: Math.round(this.height * 0.84), name: 'Schrein der Blütentäler' }
    ].slice(0, count);

    for (const sc of shrineCandidates) {
      if (this.isValid(sc.x, sc.y)) {
        // Clear obstacles around shrine
        this.ground[sc.y][sc.x] = (this.preset.mainBiome === 'snow' ? TILES.SNOW : (this.preset.mainBiome === 'desert' ? TILES.SAND : TILES.GRASS));
        this.objects[sc.y][sc.x] = OBJECTS.SHRINE;
        this.canopy[sc.y][sc.x] = CANOPY.NONE;
        this.shrines.push({ x: sc.x, y: sc.y, name: sc.name });
      }
    }

    // Ancient Void Shrine inside Void Zone
    const vz = p.voidZone;
    const vx = vz.x - 2;
    const vy = vz.y - 2;
    if (this.isValid(vx, vy)) {
      this.ground[vy][vx] = TILES.VOID_GROUND;
      this.objects[vy][vx] = OBJECTS.SHRINE;
      this.shrines.push({ x: vx, y: vy, name: 'Schrein des Ewigen Abgrunds' });
    }
  }

  placeTrampolines() {
    this.trampolines = [];
    const count = this.preset.trampolineCount || 8;

    const trampolineSpots = [
      { x: this.spawnPoint.x + 14, y: this.spawnPoint.y + 14 },
      { x: Math.round(this.width * 0.22), y: Math.round(this.height * 0.24) },
      { x: Math.round(this.width * 0.44), y: Math.round(this.height * 0.18) },
      { x: Math.round(this.width * 0.74), y: Math.round(this.height * 0.28) },
      { x: Math.round(this.width * 0.18), y: Math.round(this.height * 0.78) },
      { x: Math.round(this.width * 0.48), y: Math.round(this.height * 0.65) },
      { x: Math.round(this.width * 0.76), y: Math.round(this.height * 0.72) },
      { x: Math.round(this.width * 0.88), y: Math.round(this.height * 0.45) },
      { x: Math.round(this.width * 0.32), y: Math.round(this.height * 0.52) },
      { x: Math.round(this.width * 0.62), y: Math.round(this.height * 0.85) }
    ].slice(0, count);

    for (const ts of trampolineSpots) {
      if (!this.isValid(ts.x, ts.y)) continue;
      const g = this.ground[ts.y][ts.x];
      if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE || g === TILES.QUICKSAND) continue;

      this.objects[ts.y][ts.x] = OBJECTS.TRAMPOLINE;
      this.canopy[ts.y][ts.x] = CANOPY.NONE;
      this.trampolines.push({ x: ts.x, y: ts.y });
    }
  }

  placeCaveEntrances() {
    this.holeEntrances = [
      { x: Math.round(this.width * 0.24), y: Math.round(this.height * 0.36), targetCave: 'main_complex', targetX: 16, targetY: 17, name: 'Grasland-Loch (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.18), y: Math.round(this.height * 0.16), targetCave: 'forest_grotto', targetX: 11, targetY: 11, name: 'Wald-Loch (Moosige Grotte)' },
      { x: Math.round(this.width * 0.22), y: Math.round(this.height * 0.82), targetCave: 'main_complex', targetX: 20, targetY: 53, name: 'Wüsten-Trichter (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.78), y: Math.round(this.height * 0.20), targetCave: 'snow_grotto', targetX: 11, targetY: 11, name: 'Schnee-Eisspalte (Eis-Grotte)' },
      { x: this.preset.voidZone.x - 6, y: this.preset.voidZone.y + 4, targetCave: 'void_grotto', targetX: 12, targetY: 11, name: 'Leeren-Riss (Astrale Kluft)' },
      { x: Math.round(this.width * 0.68), y: Math.round(this.height * 0.70), targetCave: 'main_complex', targetX: 74, targetY: 51, name: 'Sumpf-Kuhle (Tiefenhöhlen)' }
    ];

    for (const entrance of this.holeEntrances) {
      if (this.isValid(entrance.x, entrance.y)) {
        this.objects[entrance.y][entrance.x] = OBJECTS.CAVE_ENTRANCE;
        this.canopy[entrance.y][entrance.x] = CANOPY.NONE;
      }
    }
  }

  getHoleEntrance(tileX, tileY) {
    return this.holeEntrances.find(h => h.x === tileX && h.y === tileY);
  }

  isTrampoline(tileX, tileY) {
    if (!this.isValid(tileX, tileY)) return false;
    return this.objects[tileY][tileX] === OBJECTS.TRAMPOLINE;
  }

  clearRampsAndAccessCorridors() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.ramps[y] || this.ramps[y][x] === RAMPS.NONE) continue;

        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (!this.isValid(nx, ny)) continue;

            const obj = this.objects[ny][nx];
            if (obj !== OBJECTS.NONE && obj !== OBJECTS.CAVE_ENTRANCE && obj !== OBJECTS.TRAMPOLINE && obj !== OBJECTS.SHRINE) {
              this.objects[ny][nx] = OBJECTS.NONE;
            }
          }
        }
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (this.isValid(nx, ny)) {
              this.canopy[ny][nx] = CANOPY.NONE;
            }
          }
        }
      }
    }
  }

  createOrganicBlob(cx, cy, radius, tileId, threshold = 0.5) {
    const n = this.noise;
    const r = radius + 4;
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (!this.isValid(x, y)) continue;
        // Don't cut through spawn clearing
        if (Math.hypot(x - this.spawnPoint.x, y - this.spawnPoint.y) < this.preset.spawnClearingRadius + 3) continue;

        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        const wobble = n.noise(Math.cos(angle) * 2, Math.sin(angle) * 2) * (radius * 0.45);
        if (dist <= radius + wobble) {
          this.ground[y][x] = tileId;
          this.objects[y][x] = OBJECTS.NONE;
        }
      }
    }
  }

  createWindingPath(x1, y1, x2, y2, width = 2) {
    const steps = Math.hypot(x2 - x1, y2 - y1) * 1.5;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let px = x1 + (x2 - x1) * t;
      let py = y1 + (y2 - y1) * t;

      const offset = Math.sin(t * Math.PI) * 4 * this.noise.noise(t * 5, 2);
      px += -((y2 - y1) / (steps || 1)) * offset;
      py += ((x2 - x1) / (steps || 1)) * offset;

      const tx = Math.round(px);
      const ty = Math.round(py);

      for (let ox = -Math.floor(width / 2); ox <= Math.floor(width / 2); ox++) {
        for (let oy = -Math.floor(width / 2); oy <= Math.floor(width / 2); oy++) {
          const cx = tx + ox;
          const cy = ty + oy;
          if (this.isValid(cx, cy)) {
            if (this.ground[cy][cx] !== TILES.WATER && this.ground[cy][cx] !== TILES.SWAMP_WATER && this.ground[cy][cx] !== TILES.VOID_LAKE) {
              this.ground[cy][cx] = TILES.DIRT;
              this.objects[cy][cx] = OBJECTS.NONE;
            }
          }
        }
      }
    }
  }

  isValid(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getGroundTile(x, y) {
    if (!this.isValid(x, y)) return TILES.WATER;
    return this.ground[y][x];
  }

  getObjectTile(x, y) {
    if (!this.isValid(x, y)) return OBJECTS.NONE;
    return this.objects[y][x];
  }

  getCanopyTile(x, y) {
    if (!this.isValid(x, y)) return CANOPY.NONE;
    return this.canopy[y][x];
  }

  isSolid(tileX, tileY) {
    if (!this.isValid(tileX, tileY)) return true;

    const ground = this.getGroundTile(tileX, tileY);
    const groundProps = TILE_PROPS[ground];
    if (groundProps && groundProps.solid) return true;

    const obj = this.getObjectTile(tileX, tileY);
    const objProps = OBJ_PROPS[obj];
    if (objProps && objProps.solid) return true;

    return false;
  }

  isDeadly(tileX, tileY) {
    const ground = this.getGroundTile(tileX, tileY);
    const props = TILE_PROPS[ground];
    return props ? Boolean(props.deadly) : false;
  }

  getSpeedModifier(tileX, tileY) {
    const ground = this.getGroundTile(tileX, tileY);
    const props = TILE_PROPS[ground];
    return props ? (props.speedMod ?? 1.0) : 1.0;
  }

  getBiome(tileX, tileY) {
    const ground = this.getGroundTile(tileX, tileY);
    const props = TILE_PROPS[ground];
    return props ? props.biome : BIOMES.GRASSLAND;
  }

  isNearRamp(tileX, tileY, radius = 2) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = tileX + dx;
        const ny = tileY + dy;
        if (this.isValid(nx, ny) && this.ramps[ny] && this.ramps[ny][nx] !== RAMPS.NONE) {
          return true;
        }
      }
    }
    return false;
  }

  addTree(px, py, type, variant = 0) {
    const tileX = Math.floor(px / TILE_SIZE);
    const tileY = Math.floor(py / TILE_SIZE);
    if (this.isNearRamp(tileX, tileY, 2)) return;

    for (const t of this.trees) {
      if (Math.hypot(t.x - px, t.y - py) < 14) return;
    }
    const meta = {
      [TREES.OAK]:          { trunkRadius: 6, crownHeight: 30, width: 32, height: 44, anchorX: 16, anchorY: 40 },
      [TREES.PINE]:         { trunkRadius: 5, crownHeight: 34, width: 24, height: 46, anchorX: 12, anchorY: 42 },
      [TREES.BIRCH]:        { trunkRadius: 4, crownHeight: 28, width: 20, height: 40, anchorX: 10, anchorY: 37 },
      [TREES.BLOSSOM]:      { trunkRadius: 5, crownHeight: 28, width: 28, height: 40, anchorX: 14, anchorY: 37 },
      [TREES.AUTUMN]:       { trunkRadius: 6, crownHeight: 30, width: 30, height: 42, anchorX: 15, anchorY: 39 },
      [TREES.SNOWY_PINE]:   { trunkRadius: 5, crownHeight: 34, width: 24, height: 46, anchorX: 12, anchorY: 42 },
      [TREES.SWAMP_WILLOW]: { trunkRadius: 6, crownHeight: 28, width: 34, height: 44, anchorX: 17, anchorY: 40 },
      [TREES.PALM]:         { trunkRadius: 5, crownHeight: 26, width: 28, height: 46, anchorX: 14, anchorY: 42 },
      [TREES.SAPLING]:      { trunkRadius: 3, crownHeight: 14, width: 16, height: 22, anchorX: 8,  anchorY: 20 },
      [TREES.DEADWOOD]:     { trunkRadius: 4, crownHeight: 24, width: 24, height: 38, anchorX: 12, anchorY: 35 }
    }[type] || { trunkRadius: 5, crownHeight: 25, width: 24, height: 40, anchorX: 12, anchorY: 38 };

    const sacredLantern = (this.noise.noise(px * 0.18, py * 0.18) > 0.55);

    this.trees.push({
      id: this.trees.length,
      x: px,
      y: py,
      tileX,
      tileY,
      type,
      variant,
      hasLantern: sacredLantern,
      ...meta
    });
  }

  checkTreeCollision(px, py, playerRadius) {
    for (const tree of this.trees) {
      if (Math.abs(px - tree.x) > 16 || Math.abs(py - tree.y) > 16) continue;
      const dist = Math.hypot(px - tree.x, py - tree.y);
      if (dist < (tree.trunkRadius + playerRadius)) {
        return true;
      }
    }
    return false;
  }

  getVisibleTrees(bounds) {
    const startX = bounds.startX * TILE_SIZE - 40;
    const endX   = bounds.endX * TILE_SIZE + 40;
    const startY = bounds.startY * TILE_SIZE - 55;
    const endY   = bounds.endY * TILE_SIZE + 55;

    return this.trees.filter(t => t.x >= startX && t.x <= endX && t.y >= startY && t.y <= endY);
  }

  getVisibleCanopyCrowns(bounds) {
    const startX = bounds.startX * TILE_SIZE - 50;
    const endX   = bounds.endX * TILE_SIZE + 50;
    const startY = bounds.startY * TILE_SIZE - 50;
    const endY   = bounds.endY * TILE_SIZE + 50;

    return this.canopyCrowns.filter(c => c.x >= startX && c.x <= endX && c.y >= startY && c.y <= endY);
  }

  getVisibleKodamas(bounds) {
    const startX = bounds.startX * TILE_SIZE - 25;
    const endX   = bounds.endX * TILE_SIZE + 25;
    const startY = bounds.startY * TILE_SIZE - 25;
    const endY   = bounds.endY * TILE_SIZE + 25;

    return this.kodamas.filter(k => k.x >= startX && k.x <= endX && k.y >= startY && k.y <= endY);
  }

  getNeighbors(x, y) {
    return {
      N:  this.getGroundTile(x, y - 1),
      S:  this.getGroundTile(x, y + 1),
      W:  this.getGroundTile(x - 1, y),
      E:  this.getGroundTile(x + 1, y),
      NW: this.getGroundTile(x - 1, y - 1),
      NE: this.getGroundTile(x + 1, y - 1),
      SW: this.getGroundTile(x - 1, y + 1),
      SE: this.getGroundTile(x + 1, y + 1)
    };
  }

  // ==========================================================================
  // HÖHENEBENEN-SYSTEM (Plateaus & Löcher über 290x200 verteilt)
  // ==========================================================================
  generateElevationsAndRamps() {
    // Plateaus distributed across the large world
    this.createPlateau(Math.round(this.width * 0.16), Math.round(this.height * 0.35), 10, 7, ELEVATION.LEVEL_1, ['S', 'E']);
    this.createPlateau(Math.round(this.width * 0.16), Math.round(this.height * 0.35), 5, 4, ELEVATION.LEVEL_2, ['S']);
    this.createHole(Math.round(this.width * 0.24), Math.round(this.height * 0.36), 4, 3, 'S');

    this.createPlateau(Math.round(this.width * 0.72), Math.round(this.height * 0.28), 12, 8, ELEVATION.LEVEL_1, ['S', 'W']);
    this.createPlateau(Math.round(this.width * 0.72), Math.round(this.height * 0.28), 6, 4, ELEVATION.LEVEL_2, ['S']);
    this.createHole(Math.round(this.width * 0.78), Math.round(this.height * 0.20), 4, 3, 'S');

    this.createPlateau(Math.round(this.width * 0.20), Math.round(this.height * 0.78), 11, 7, ELEVATION.LEVEL_1, ['N', 'E']);
    this.createHole(Math.round(this.width * 0.22), Math.round(this.height * 0.82), 4, 4, 'N');

    this.createPlateau(Math.round(this.width * 0.82), Math.round(this.height * 0.68), 10, 7, ELEVATION.LEVEL_1, ['W', 'N']);
    this.createHole(Math.round(this.width * 0.68), Math.round(this.height * 0.70), 4, 3, 'S');
  }

  createPlateau(cx, cy, rx, ry, level = 1, rampDirections = ['S']) {
    const n = this.noise;
    const tilesInPlateau = [];

    for (let dy = -ry - 2; dy <= ry + 2; dy++) {
      for (let dx = -rx - 2; dx <= rx + 2; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (!this.isValid(x, y)) continue;

        const g = this.ground[y][x];
        if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE || g === TILES.BRIDGE_H || g === TILES.BRIDGE_V) continue;
        if (Math.hypot(x - this.spawnPoint.x, y - this.spawnPoint.y) < this.preset.spawnClearingRadius + 2) continue;

        const distNorm = Math.hypot(dx / rx, dy / ry) + n.noise(x * 0.3, y * 0.3) * 0.22;
        if (distNorm <= 1.0) {
          if (level === 2 && this.elevation[y][x] < 1) continue;
          this.elevation[y][x] = level;
          tilesInPlateau.push({ x, y });
        }
      }
    }

    if (tilesInPlateau.length === 0) return;

    for (const dir of rampDirections) {
      this.placePlateauRamp(cx, cy, rx, ry, level, dir);
    }
  }

  placePlateauRamp(cx, cy, rx, ry, level, dir) {
    let rampX = cx;
    let rampY = cy;

    if (dir === 'S') {
      for (let y = cy + ry + 2; y >= cy; y--) {
        if (this.isValid(cx, y) && this.elevation[y][cx] === level) {
          rampX = cx;
          rampY = y;
          break;
        }
      }
      if (this.isValid(rampX, rampY)) {
        this.elevation[rampY][rampX] = level - 1;
        this.ramps[rampY][rampX] = RAMPS.UP_NORTH;
        this.objects[rampY][rampX] = OBJECTS.NONE;
        if (this.isValid(rampX, rampY + 1)) this.objects[rampY + 1][rampX] = OBJECTS.NONE;
        if (this.isValid(rampX, rampY - 1)) this.objects[rampY - 1][rampX] = OBJECTS.NONE;
      }
    } else if (dir === 'N') {
      for (let y = cy - ry - 2; y <= cy; y++) {
        if (this.isValid(cx, y) && this.elevation[y][cx] === level) {
          rampX = cx;
          rampY = y;
          break;
        }
      }
      if (this.isValid(rampX, rampY)) {
        this.elevation[rampY][rampX] = level - 1;
        this.ramps[rampY][rampX] = RAMPS.UP_SOUTH;
        this.objects[rampY][rampX] = OBJECTS.NONE;
        if (this.isValid(rampX, rampY - 1)) this.objects[rampY - 1][rampX] = OBJECTS.NONE;
        if (this.isValid(rampX, rampY + 1)) this.objects[rampY + 1][rampX] = OBJECTS.NONE;
      }
    } else if (dir === 'E') {
      for (let x = cx + rx + 2; x >= cx; x--) {
        if (this.isValid(x, cy) && this.elevation[cy][x] === level) {
          rampX = x;
          rampY = cy;
          break;
        }
      }
      if (this.isValid(rampX, rampY)) {
        this.elevation[rampY][rampX] = level - 1;
        this.ramps[rampY][rampX] = RAMPS.UP_WEST;
        this.objects[rampY][rampX] = OBJECTS.NONE;
        if (this.isValid(rampX + 1, rampY)) this.objects[rampY + 1][rampX] = OBJECTS.NONE;
        if (this.isValid(rampX - 1, rampY)) this.objects[rampY - 1][rampX] = OBJECTS.NONE;
      }
    } else if (dir === 'W') {
      for (let x = cx - rx - 2; x <= cx; x++) {
        if (this.isValid(x, cy) && this.elevation[cy][x] === level) {
          rampX = x;
          rampY = cy;
          break;
        }
      }
      if (this.isValid(rampX, rampY)) {
        this.elevation[rampY][rampX] = level - 1;
        this.ramps[rampY][rampX] = RAMPS.UP_EAST;
        this.objects[rampY][rampX] = OBJECTS.NONE;
        if (this.isValid(rampX - 1, rampY)) this.objects[rampY - 1][rampX] = OBJECTS.NONE;
        if (this.isValid(rampX + 1, rampY)) this.objects[rampY + 1][rampX] = OBJECTS.NONE;
      }
    }
  }

  createHole(cx, cy, rx, ry, exitDir = 'S') {
    const n = this.noise;
    for (let dy = -ry - 1; dy <= ry + 1; dy++) {
      for (let dx = -rx - 1; dx <= rx + 1; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (!this.isValid(x, y)) continue;

        const g = this.ground[y][x];
        if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE || g === TILES.BRIDGE_H || g === TILES.BRIDGE_V) continue;
        if (Math.hypot(x - this.spawnPoint.x, y - this.spawnPoint.y) < this.preset.spawnClearingRadius + 2) continue;

        const distNorm = Math.hypot(dx / rx, dy / ry) + n.noise(x * 0.35, y * 0.35) * 0.2;
        if (distNorm <= 1.0) {
          this.elevation[y][x] = ELEVATION.HOLE;
          if (this.objects[y][x] === OBJECTS.ROCK_STONE || this.objects[y][x] === OBJECTS.FALLEN_LOG) {
            this.objects[y][x] = OBJECTS.NONE;
          }
        }
      }
    }

    let rampX = cx;
    let rampY = cy;
    if (exitDir === 'S') {
      for (let y = cy + ry + 1; y >= cy; y--) {
        if (this.isValid(cx, y) && this.elevation[y][cx] === ELEVATION.HOLE) {
          rampX = cx;
          rampY = y;
          break;
        }
      }
      if (this.isValid(rampX, rampY)) {
        this.ramps[rampY][rampX] = RAMPS.UP_SOUTH;
        this.objects[rampY][rampX] = OBJECTS.NONE;
        if (this.isValid(rampX, rampY + 1)) this.objects[rampY + 1][rampX] = OBJECTS.NONE;
      }
    } else if (exitDir === 'N') {
      for (let y = cy - ry - 1; y <= cy; y++) {
        if (this.isValid(cx, y) && this.elevation[y][cx] === ELEVATION.HOLE) {
          rampX = cx;
          rampY = y;
          break;
        }
      }
      if (this.isValid(rampX, rampY)) {
        this.ramps[rampY][rampX] = RAMPS.UP_NORTH;
        this.objects[rampY][rampX] = OBJECTS.NONE;
        if (this.isValid(rampX, rampY - 1)) this.objects[rampY - 1][rampX] = OBJECTS.NONE;
      }
    } else if (exitDir === 'W') {
      for (let x = cx - rx - 1; x <= cx; x++) {
        if (this.isValid(x, cy) && this.elevation[cy][x] === ELEVATION.HOLE) {
          rampX = x;
          rampY = cy;
          break;
        }
      }
      if (this.isValid(rampX, rampY)) {
        this.ramps[rampY][rampX] = RAMPS.UP_WEST;
        this.objects[rampY][rampX] = OBJECTS.NONE;
        if (this.isValid(rampX - 1, rampY)) this.objects[rampY - 1][rampX] = OBJECTS.NONE;
      }
    }
  }

  getElevation(tileX, tileY) {
    if (!this.isValid(tileX, tileY)) return ELEVATION.GROUND;
    return this.elevation[tileY][tileX];
  }

  getRamp(tileX, tileY) {
    if (!this.isValid(tileX, tileY)) return RAMPS.NONE;
    return this.ramps[tileY][tileX];
  }

  isElevationPassable(fromX, fromY, toX, toY) {
    if (!this.isValid(toX, toY)) return false;
    if (!this.isValid(fromX, fromY)) return true;

    const fromElev = this.getElevation(fromX, fromY);
    const toElev = this.getElevation(toX, toY);
    const diff = toElev - fromElev;

    if (diff === 0) return true;

    if (diff === 1) {
      const fromRamp = this.getRamp(fromX, fromY);
      const toRamp = this.getRamp(toX, toY);

      const moveDx = toX - fromX;
      const moveDy = toY - fromY;

      if (moveDy < 0 && (toRamp === RAMPS.UP_NORTH || fromRamp === RAMPS.UP_NORTH)) return true;
      if (moveDy > 0 && (toRamp === RAMPS.UP_SOUTH || fromRamp === RAMPS.UP_SOUTH)) return true;
      if (moveDx < 0 && (toRamp === RAMPS.UP_WEST || fromRamp === RAMPS.UP_WEST)) return true;
      if (moveDx > 0 && (toRamp === RAMPS.UP_EAST || fromRamp === RAMPS.UP_EAST)) return true;

      return false;
    }

    if (diff === -1) {
      return true;
    }

    return false;
  }
}
