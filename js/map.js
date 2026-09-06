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
    // STEP 1: ORGANIC ROUND BIOME ASSIGNMENT (Radial Distance Fields with Perlin Wobble)
    // --------------------------------------------------------------------
    const snowCenterX = Math.round(this.width * 0.80);
    const snowCenterY = Math.round(this.height * 0.20);
    const desertCenterX = Math.round(this.width * 0.18);
    const desertCenterY = Math.round(this.height * 0.78);
    const swampCenterX = Math.round(this.width * 0.64);
    const swampCenterY = Math.round(this.height * 0.72);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Multi-octave domain warping for natural curvy, rounded contours
        const warpX = x + n.fbm(x * 0.02, y * 0.02, 3) * 18;
        const warpY = y + n.fbm((x + 60) * 0.02, (y + 60) * 0.02, 3) * 18;

        let tile = TILES.GRASS;

        if (mb === 'snow') {
          // Main Biome: Snow covers the realm
          tile = TILES.SNOW;

          // Thawed round central grass valley around spawn
          const distGrass = Math.hypot(warpX - this.spawnPoint.x, warpY - this.spawnPoint.y) + n.noise(x * 0.03, y * 0.03) * 20;
          if (distGrass < 56) {
            tile = TILES.GRASS;
          }
          // Organic desert basin in southwest
          const distDesert = Math.hypot((warpX - desertCenterX) * 0.9, (warpY - desertCenterY) * 1.1) + n.noise(x * 0.04, y * 0.04) * 18;
          if (distDesert < 44) {
            tile = TILES.SAND;
          }
          // Frosted swamp pocket in southeast
          const distSwamp = Math.hypot(warpX - swampCenterX, warpY - swampCenterY) + n.noise(x * 0.04, y * 0.04) * 16;
          if (distSwamp < 36) {
            tile = TILES.SWAMP_GROUND;
          }
        } else if (mb === 'desert') {
          // Main Biome: Desert sea covers the realm
          tile = TILES.SAND;

          // Lush round oasis valley around spawn
          const distGrass = Math.hypot(warpX - this.spawnPoint.x, warpY - this.spawnPoint.y) + n.noise(x * 0.03, y * 0.03) * 20;
          if (distGrass < 52) {
            tile = TILES.GRASS;
          }
          // High snow mountain range in northeast
          const distSnow = Math.hypot(warpX - snowCenterX, warpY - snowCenterY) + n.noise(x * 0.04, y * 0.04) * 18;
          if (distSnow < 48) {
            tile = TILES.SNOW;
          }
          // Mud oasis in southeast
          const distSwamp = Math.hypot(warpX - swampCenterX, warpY - swampCenterY) + n.noise(x * 0.04, y * 0.04) * 16;
          if (distSwamp < 34) {
            tile = TILES.SWAMP_GROUND;
          }
        } else {
          // Main Biome: Grassland dominates the world
          tile = TILES.GRASS;

          // Round Snow Realm in Northeast
          const distSnow = Math.hypot((warpX - snowCenterX) * 0.95, (warpY - snowCenterY) * 1.05) + n.noise(x * 0.035, y * 0.035) * 22;
          if (distSnow < 62) {
            tile = TILES.SNOW;
          }
          // Round Desert Dunes in Southwest
          const distDesert = Math.hypot((warpX - desertCenterX) * 0.95, (warpY - desertCenterY) * 1.05) + n.noise(x * 0.035, y * 0.035) * 22;
          if (distDesert < 58) {
            tile = TILES.SAND;
          }
          // Organic Swamp Basin in Southeast
          const distSwamp = Math.hypot(warpX - swampCenterX, warpY - swampCenterY) + n.noise(x * 0.04, y * 0.04) * 18;
          if (distSwamp < 46) {
            tile = TILES.SWAMP_GROUND;
          }
        }

        // Void Zone: Strictly 1 Single edge rift with circular boundary
        const distVoid = Math.hypot(x - vz.x, y - vz.y) + n.noise(x * 0.25, y * 0.25) * 4;
        if (distVoid < vz.radius) {
          tile = TILES.VOID_GROUND;
        }

        // Spawn Clearing: Dedicated large open flat area around spawn (100% round clearing)
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
    // STEP 12: DICHTE DEKO & INTERAKTIVE WELT-OBJEKTE (Kristalle, Laternen, Tore, Dummies)
    // --------------------------------------------------------------------
    this.populateEnvironmentalDecor();

    // --------------------------------------------------------------------
    // STEP 13: RAMPEN & TREPPEN FREIHALTEN
    // --------------------------------------------------------------------
    this.clearRampsAndAccessCorridors();

    // --------------------------------------------------------------------
    // STEP 14: BRÜCKEN & WEGE FREIHALTEN (Keine Bäume, Felsen oder Kronen auf Brücken)
    // --------------------------------------------------------------------
    this.clearBridgesAndAccessCorridors();

    // --------------------------------------------------------------------
    // STEP 15: OUTER 2-TILE WATER BORDER
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
        if (gTile === TILES.WATER || gTile === TILES.SWAMP_WATER || gTile === TILES.BRIDGE_H || gTile === TILES.BRIDGE_V) continue;
        if (this.isNearBridge(rx, ry, 2)) continue;
        if (Math.hypot(rx - this.spawnPoint.x, ry - this.spawnPoint.y) < this.preset.spawnClearingRadius) continue;

        const dist = Math.hypot(rx - cx, ry - cy);
        if (dist < r - 2) {
          const variant = Math.abs(Math.floor(n.noise(rx * 3.3, ry * 3.3) * 10)) % 2;
          this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, primaryTreeType, variant);

          // Flora & selective obstacles
          const obstRand = n.noise(rx * 1.9, ry * 1.9);
          if (obstRand > 0.62 && rx + 1 < this.width && this.objects[ry][rx + 1] === OBJECTS.NONE && !this.isNearBridge(rx + 1, ry, 1)) {
            this.objects[ry][rx + 1] = OBJECTS.FALLEN_LOG;
          } else if (obstRand < -0.62 && ry + 1 < this.height && this.objects[ry + 1][rx] === OBJECTS.NONE && !this.isNearBridge(rx, ry + 1, 1)) {
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
    for (let ty = 6; ty < this.height - 6; ty += 4) {
      for (let tx = 6; tx < this.width - 6; tx += 4) {
        if (!this.isValid(tx, ty)) continue;
        if (this.canopy[ty][tx] === CANOPY.TREE_CROWN) continue;
        if (Math.hypot(tx - this.spawnPoint.x, ty - this.spawnPoint.y) < this.preset.spawnClearingRadius) continue;

        const jx = tx + n.noise(tx * 1.4, ty * 1.4) * 1.8;
        const jy = ty + n.noise(tx * 2.2, ty * 2.2) * 1.8;
        const rx = Math.round(jx);
        const ry = Math.round(jy);
        if (!this.isValid(rx, ry)) continue;
        if (this.objects[ry][rx] !== OBJECTS.NONE) continue;
        if (this.canopy[ry][rx] === CANOPY.TREE_CROWN) continue;
        if (this.isNearBridge(rx, ry, 2)) continue;

        const g = this.ground[ry][rx];
        if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE || g === TILES.BRIDGE_H || g === TILES.BRIDGE_V) continue;

        const noiseVal = n.fbm(rx * 0.11, ry * 0.11, 2);

        if ((g === TILES.GRASS || g === TILES.DIRT) && noiseVal > 0.10) {
          // Standalone Oak / Blossom trees across grasslands & meadows
          const treeVariant = (Math.abs(rx + ry) % 2 === 0) ? TREES.OAK : TREES.BIRCH;
          this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, treeVariant, Math.abs(rx) % 3);
        } else if (g === TILES.SNOW && noiseVal > 0.08) {
          // Standalone Snowy Pines on mountain slopes & tundra
          this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, TREES.SNOWY_PINE, Math.abs(rx) % 3);
        } else if (g === TILES.SAND && noiseVal > 0.18) {
          // Date Palm or Desert Cactus
          if (n.noise(rx * 0.5, ry * 0.5) > 0.05) {
            this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, TREES.PALM, Math.abs(rx) % 2);
          } else {
            this.objects[ry][rx] = OBJECTS.CACTUS;
          }
        } else if (g === TILES.SWAMP_GROUND && noiseVal > 0.12) {
          // Mossy Swamp Willow in marsh pockets
          this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, TREES.SWAMP_WILLOW, Math.abs(rx) % 2);
        }
      }
    }
  }

  placeOverworldShrines() {
    this.shrines = [];
    const p = this.preset;

    // Gemäß Nutzeranforderung: In der Oberwelt gibt es NUR den Schrein im VOID!
    // Alle anderen Schreine liegen ausschließlich im Himmel (Clouds) und in Höhlen (Caves).
    const vz = p.voidZone;
    const vx = vz.x - 2;
    const vy = vz.y - 2;
    if (this.isValid(vx, vy)) {
      this.ground[vy][vx] = TILES.VOID_GROUND;
      this.objects[vy][vx] = OBJECTS.SHRINE;
      this.canopy[vy][vx] = CANOPY.NONE;
      this.shrines.push({ x: vx, y: vy, name: 'Schrein des Ewigen Abgrunds' });

      // Clear walkable spot directly in front
      if (this.isValid(vx, vy + 1)) {
        this.ground[vy + 1][vx] = TILES.VOID_GROUND;
        this.objects[vy + 1][vx] = OBJECTS.NONE;
      }
      if (this.isValid(vx - 2, vy + 1)) {
        this.objects[vy + 1][vx - 2] = OBJECTS.GLOW_CRYSTAL;
      }
      if (this.isValid(vx + 2, vy + 1)) {
        this.objects[vy + 1][vx + 2] = OBJECTS.GLOW_CRYSTAL;
      }
      if (this.isValid(vx, vy + 2)) {
        this.objects[vy + 2][vx] = OBJECTS.TORII_GATE;
        this.ground[vy + 2][vx] = TILES.VOID_GROUND;
      }
    }
  }

  placeTrampolines() {
    this.trampolines = [];
    const count = this.preset.trampolineCount || 18;

    // 18 strategische Standorte quer über die 290x200 Riesenwelt, inkl. mitten im Wald
    const trampolineSpots = [
      // 1. Grasland & Spawn-Nähe
      { x: this.spawnPoint.x + 14, y: this.spawnPoint.y + 14 },
      { x: this.spawnPoint.x - 16, y: this.spawnPoint.y + 18 },
      // 2. Mitten in den dichten Wäldern (Wald-Lichtungen für Trampoline!)
      { x: Math.round(this.width * 0.18), y: Math.round(this.height * 0.22) }, // Nordwest-Urwald
      { x: Math.round(this.width * 0.26), y: Math.round(this.height * 0.65) }, // Südwest-Waldhain
      { x: Math.round(this.width * 0.78), y: Math.round(this.height * 0.52) }, // Goldblätterwald
      { x: Math.round(this.width * 0.60), y: Math.round(this.height * 0.90) }, // Südwald
      // 3. Nordosten: Schnee, Gipfel & Eispass
      { x: Math.round(this.width * 0.74), y: Math.round(this.height * 0.26) },
      { x: Math.round(this.width * 0.86), y: Math.round(this.height * 0.18) },
      { x: Math.round(this.width * 0.68), y: Math.round(this.height * 0.14) },
      // 4. Südwesten: Wüste, Oasen & Plateaus
      { x: Math.round(this.width * 0.16), y: Math.round(this.height * 0.76) },
      { x: Math.round(this.width * 0.32), y: Math.round(this.height * 0.86) },
      { x: Math.round(this.width * 0.12), y: Math.round(this.height * 0.90) },
      // 5. Südosten: Sumpf & Nebelmoore
      { x: Math.round(this.width * 0.66), y: Math.round(this.height * 0.70) },
      { x: Math.round(this.width * 0.76), y: Math.round(this.height * 0.82) },
      // 6. Zentrales Tal & Binnensee-Küste
      { x: Math.round(this.width * 0.44), y: Math.round(this.height * 0.20) },
      { x: Math.round(this.width * 0.38), y: Math.round(this.height * 0.54) },
      { x: Math.round(this.width * 0.58), y: Math.round(this.height * 0.46) },
      { x: Math.round(this.width * 0.88), y: Math.round(this.height * 0.45) }
    ].slice(0, count);

    for (const ts of trampolineSpots) {
      if (!this.isValid(ts.x, ts.y)) continue;
      const g = this.ground[ts.y][ts.x];
      if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE || g === TILES.QUICKSAND) continue;

      this.objects[ts.y][ts.x] = OBJECTS.TRAMPOLINE;
      this.canopy[ts.y][ts.x] = CANOPY.NONE;

      // Wenn im Wald platziert: Baumkrone und naheliegende Stämme räumen,
      // damit der Spieler freie Sprungbahn in den Himmel hat!
      const px = ts.x * TILE_SIZE + 8;
      const py = ts.y * TILE_SIZE + 8;
      this.trees = this.trees.filter(t => Math.hypot(t.x - px, t.y - py) > 22);
      this.canopyCrowns = this.canopyCrowns.filter(c => Math.hypot(c.x - px, c.y - py) > 26);

      // 3x3 Bereich um das Trampolin von Baumkronen befreien
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = ts.x + dx;
          const ny = ts.y + dy;
          if (this.isValid(nx, ny)) {
            this.canopy[ny][nx] = CANOPY.NONE;
          }
        }
      }

      this.trampolines.push({ x: ts.x, y: ts.y });
    }
  }

  findSafeCaveEntranceSpot(desiredX, desiredY, maxSearchRadius = 35) {
    const isSuitable = (tx, ty, waterRadius = 2) => {
      if (tx < 6 || tx >= this.width - 6 || ty < 6 || ty >= this.height - 6) return false;
      const g = this.ground[ty][tx];
      if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE || g === TILES.QUICKSAND) return false;
      if (g === TILES.BRIDGE_H || g === TILES.BRIDGE_V) return false;
      if (this.isNearBridge(tx, ty, 2)) return false;
      if (this.isNearRamp(tx, ty, 2)) return false;
      if (waterRadius > 0 && this.isNearWater(tx, ty, waterRadius)) return false;
      if (Math.hypot(tx - this.spawnPoint.x, ty - this.spawnPoint.y) < this.preset.spawnClearingRadius + 3) return false;
      if (this.objects[ty][tx] === OBJECTS.TRAMPOLINE || this.objects[ty][tx] === OBJECTS.SHRINE || this.objects[ty][tx] === OBJECTS.CAVE_ENTRANCE) return false;
      for (const ent of this.holeEntrances) {
        if (Math.hypot(tx - ent.x, ty - ent.y) < 5) return false;
      }
      return true;
    };

    const px = Math.round(desiredX);
    const py = Math.round(desiredY);
    if (isSuitable(px, py, 2)) {
      return { x: px, y: py };
    }

    // 1. Search outward with a safe 2-tile land buffer from water
    for (let r = 1; r <= maxSearchRadius; r++) {
      let best = null;
      let minD = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = px + dx;
          const ty = py + dy;
          if (isSuitable(tx, ty, 2)) {
            const d = Math.hypot(tx - px, ty - py);
            if (d < minD) {
              minD = d;
              best = { x: tx, y: ty };
            }
          }
        }
      }
      if (best) return best;
    }

    // 2. Fallback: 1-tile land buffer if deeply landlocked region
    for (let r = 1; r <= maxSearchRadius; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = px + dx;
          const ty = py + dy;
          if (isSuitable(tx, ty, 1)) {
            return { x: tx, y: ty };
          }
        }
      }
    }

    return { x: px, y: py };
  }

  placeCaveEntrances() {
    // 26 vielfältige Höhleneingänge über die gesamte 290x200 Oberwelt verteilt
    const desiredEntrances = [
      // 1. West- & Spawn-Region (Grasland & Vorwälder) -> main_complex (Grasland) / forest_grotto
      { x: Math.round(this.width * 0.24), y: Math.round(this.height * 0.36), targetCave: 'main_complex', targetX: 16, targetY: 17, chamber: 'grasland', name: 'Grasland-Kluft (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.18), y: Math.round(this.height * 0.16), targetCave: 'forest_grotto', targetX: 11, targetY: 9, chamber: 'forest_grotto', name: 'Mooswald-Loch (Moosige Grotte)' },
      { x: Math.round(this.width * 0.12), y: Math.round(this.height * 0.30), targetCave: 'forest_grotto', targetX: 12, targetY: 10, chamber: 'forest_grotto', name: 'Alteiche-Schacht (Moosige Grotte)' },
      { x: Math.round(this.width * 0.28), y: Math.round(this.height * 0.18), targetCave: 'main_complex', targetX: 17, targetY: 17, chamber: 'grasland', name: 'Nordwest-Stollen (Tiefenhöhlen)' },
      { x: this.spawnPoint.x + 18, y: this.spawnPoint.y - 14, targetCave: 'main_complex', targetX: 16, targetY: 18, chamber: 'grasland', name: 'Spawn-Gipfelspalte (Tiefenhöhlen)' },
      { x: this.spawnPoint.x - 14, y: this.spawnPoint.y + 24, targetCave: 'main_complex', targetX: 19, targetY: 17, chamber: 'grasland', name: 'Lichtungsschacht (Tiefenhöhlen)' },

      // 2. Wüsten- & Canyon-Region (Südwesten) -> main_complex (Desert)
      { x: Math.round(this.width * 0.24), y: Math.round(this.height * 0.84), targetCave: 'main_complex', targetX: 20, targetY: 53, chamber: 'desert', name: 'Wüsten-Trichter (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.14), y: Math.round(this.height * 0.74), targetCave: 'main_complex', targetX: 21, targetY: 53, chamber: 'desert', name: 'Dünen-Erdloch (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.32), y: Math.round(this.height * 0.78), targetCave: 'main_complex', targetX: 18, targetY: 52, chamber: 'desert', name: 'Sandstein-Riss (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.10), y: Math.round(this.height * 0.86), targetCave: 'main_complex', targetX: 21, targetY: 55, chamber: 'desert', name: 'Oasen-Senke (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.22), y: Math.round(this.height * 0.94), targetCave: 'main_complex', targetX: 23, targetY: 52, chamber: 'desert', name: 'Südwest-Schlucht (Tiefenhöhlen)' },

      // 3. Schnee- & Gletscher-Region (Nordosten) -> snow_grotto / main_complex (Snow)
      { x: Math.round(this.width * 0.78), y: Math.round(this.height * 0.16), targetCave: 'snow_grotto', targetX: 11, targetY: 9, chamber: 'snow_grotto', name: 'Schnee-Eisspalte (Eis-Grotte)' },
      { x: Math.round(this.width * 0.86), y: Math.round(this.height * 0.24), targetCave: 'snow_grotto', targetX: 12, targetY: 10, chamber: 'snow_grotto', name: 'Gletscher-Höhle (Eis-Grotte)' },
      { x: Math.round(this.width * 0.68), y: Math.round(this.height * 0.22), targetCave: 'main_complex', targetX: 58, targetY: 22, chamber: 'snow', name: 'Eispass-Stollen (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.74), y: Math.round(this.height * 0.32), targetCave: 'main_complex', targetX: 59, targetY: 22, chamber: 'snow', name: 'Frostkamm-Einsturz (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.92), y: Math.round(this.height * 0.14), targetCave: 'snow_grotto', targetX: 10, targetY: 9, chamber: 'snow_grotto', name: 'Nordkap-Kluft (Eis-Grotte)' },

      // 4. Sumpf- & Nebelmoor-Region (Südosten) -> main_complex (Swamp)
      { x: Math.round(this.width * 0.66), y: Math.round(this.height * 0.72), targetCave: 'main_complex', targetX: 74, targetY: 51, chamber: 'swamp', name: 'Sumpf-Kuhle (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.72), y: Math.round(this.height * 0.80), targetCave: 'main_complex', targetX: 72, targetY: 53, chamber: 'swamp', name: 'Schilf-Trichter (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.58), y: Math.round(this.height * 0.76), targetCave: 'main_complex', targetX: 75, targetY: 51, chamber: 'swamp', name: 'Moorloch (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.80), y: Math.round(this.height * 0.88), targetCave: 'main_complex', targetX: 75, targetY: 54, chamber: 'swamp', name: 'Teerpfuhl-Grotte (Tiefenhöhlen)' },

      // 5. Void-Zone & Umfeld -> void_grotto
      { x: this.preset.voidZone.x - 7, y: this.preset.voidZone.y + 6, targetCave: 'void_grotto', targetX: 12, targetY: 9, chamber: 'void_grotto', name: 'Leeren-Riss (Astrale Kluft)' },
      { x: this.preset.voidZone.x + 7, y: this.preset.voidZone.y - 6, targetCave: 'void_grotto', targetX: 13, targetY: 10, chamber: 'void_grotto', name: 'Schatten-Schlund (Astrale Kluft)' },

      // 6. Zentrales Tal, Seenplatte & Hochebenen -> main_complex (Center)
      { x: Math.round(this.width * 0.46), y: Math.round(this.height * 0.34), targetCave: 'main_complex', targetX: 44, targetY: 33, chamber: 'center', name: 'Flusstal-Klamm (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.56), y: Math.round(this.height * 0.40), targetCave: 'main_complex', targetX: 42, targetY: 34, chamber: 'center', name: 'Seeterrassen-Schacht (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.82), y: Math.round(this.height * 0.46), targetCave: 'main_complex', targetX: 46, targetY: 31, chamber: 'center', name: 'Ostplateau-Grotte (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.40), y: Math.round(this.height * 0.68), targetCave: 'main_complex', targetX: 45, targetY: 54, chamber: 'center', name: 'Südübergang-Höhle (Tiefenhöhlen)' }
    ];

    this.holeEntrances = [];

    for (const d of desiredEntrances) {
      const spot = this.findSafeCaveEntranceSpot(d.x, d.y);
      const entrance = {
        ...d,
        targetCave: 'caves_l1',
        targetX: spot.x,
        targetY: spot.y,
        x: spot.x,
        y: spot.y
      };
      this.holeEntrances.push(entrance);

      this.objects[entrance.y][entrance.x] = OBJECTS.CAVE_ENTRANCE;
      this.canopy[entrance.y][entrance.x] = CANOPY.NONE;

      // 3x3 Bereich um das Loch begehbar und frei von Felsen & Bäumen halten
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = entrance.x + dx;
          const ny = entrance.y + dy;
          if (this.isValid(nx, ny)) {
            if (dx !== 0 || dy !== 0) {
              if (this.objects[ny][nx] !== OBJECTS.NONE && this.objects[ny][nx] !== OBJECTS.TRAMPOLINE && this.objects[ny][nx] !== OBJECTS.SHRINE) {
                this.objects[ny][nx] = OBJECTS.NONE;
              }
            }
            this.canopy[ny][nx] = CANOPY.NONE;
            const g = this.ground[ny][nx];
            if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE) {
              this.ground[ny][nx] = TILES.DIRT;
            }
          }
        }
      }

      // Bäume und Baumkronen um das Loch herum freiräumen
      const exPx = entrance.x * TILE_SIZE + 8;
      const eyPx = entrance.y * TILE_SIZE + 8;
      this.trees = this.trees.filter(t => Math.hypot(t.x - exPx, t.y - eyPx) > 24);
      this.canopyCrowns = this.canopyCrowns.filter(c => Math.hypot(c.x - exPx, c.y - eyPx) > 28);
    }
  }

  // --------------------------------------------------------------------------
  // DICHTE DEKO: Kristalle, Steinlaternen, Torii-Tore, Trainingspuppen & Kodamas
  // --------------------------------------------------------------------------
  populateEnvironmentalDecor() {
    const n = this.noise;

    // 1. Trainingspuppen am Spawn-Rand (Kante der Lichtung) für Kampfübungen
    const sp = this.spawnPoint;
    const dummySpots = [
      { x: sp.x + 16, y: sp.y - 2 },
      { x: sp.x + 16, y: sp.y + 2 }
    ];
    for (const d of dummySpots) {
      if (this.isValid(d.x, d.y)) {
        this.objects[d.y][d.x] = OBJECTS.TRAINING_DUMMY;
      }
    }

    // 2. Leuchtkristalle um Höhleneingänge & Felsformationen
    for (const entrance of this.holeEntrances) {
      const crystalOffsets = [
        { dx: -2, dy: -1 },
        { dx: 2, dy: 1 }
      ];
      for (const off of crystalOffsets) {
        const cx = entrance.x + off.dx;
        const cy = entrance.y + off.dy;
        if (this.isValid(cx, cy) && this.objects[cy][cx] === OBJECTS.NONE) {
          const g = this.ground[cy][cx];
          if (g !== TILES.WATER && g !== TILES.SWAMP_WATER && g !== TILES.VOID_LAKE && g !== TILES.BRIDGE_H) {
            this.objects[cy][cx] = OBJECTS.GLOW_CRYSTAL;
          }
        }
      }
    }

    // 3. Kodama Waldgeister in Wäldern & Hainen
    this.kodamas = [];
    for (let ty = 10; ty < this.height - 10; ty += 7) {
      for (let tx = 10; tx < this.width - 10; tx += 7) {
        if (!this.isValid(tx, ty)) continue;
        if (Math.hypot(tx - sp.x, ty - sp.y) < this.preset.spawnClearingRadius) continue;

        const isForest = (this.canopy[ty][tx] === CANOPY.TREE_CROWN);
        const kNoise = n.noise(tx * 0.45, ty * 0.45);
        if (isForest && kNoise > 0.45) {
          const kx = tx * TILE_SIZE + 8 + n.noise(tx * 1.8, ty * 1.8) * 5;
          const ky = ty * TILE_SIZE + 8 + n.noise(tx * 2.8, ty * 2.8) * 5;
          this.kodamas.push({
            x: kx,
            y: ky,
            floatOffset: Math.random() * Math.PI * 2,
            tiltSpeed: 1.8 + Math.random() * 0.8,
            tiltOffset: Math.random() * Math.PI * 2
          });
        }
      }
    }

    // 4. Naturdeko (Pilze, Farne, Blumen, Baumstämme, Laternen)
    for (let ty = 4; ty < this.height - 4; ty += 3) {
      for (let tx = 4; tx < this.width - 4; tx += 3) {
        if (!this.isValid(tx, ty)) continue;
        if (this.objects[ty][tx] !== OBJECTS.NONE) continue;
        if (this.ramps[ty] && this.ramps[ty][tx] !== RAMPS.NONE) continue;
        if (Math.hypot(tx - sp.x, ty - sp.y) < this.preset.spawnClearingRadius) continue;

        const g = this.ground[ty][tx];
        if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE || g === TILES.BRIDGE_H || g === TILES.BRIDGE_V) continue;

        const jx = tx + Math.round(n.noise(tx * 1.6, ty * 1.6) * 1.2);
        const jy = ty + Math.round(n.noise(tx * 2.3, ty * 2.3) * 1.2);
        if (!this.isValid(jx, jy)) continue;
        if (this.objects[jy][jx] !== OBJECTS.NONE) continue;

        const val = n.noise(jx * 0.22, jy * 0.22);
        const sub = n.noise(jx * 1.45, jy * 1.45);

        // Fels-Kristalle
        if (val > 0.72 && sub > 0.35) {
          this.objects[jy][jx] = OBJECTS.GLOW_CRYSTAL;
        }
        // Steinlaternen an Wegen / Lichtungen
        else if (g === TILES.DIRT && sub > 0.65) {
          this.objects[jy][jx] = OBJECTS.STONE_TORO;
        }
        // Blumenwiesen
        else if (g === TILES.GRASS && val > 0.45 && sub > 0.1) {
          this.objects[jy][jx] = OBJECTS.FOREST_FLOWERS;
        }
        // Pilze & Farne im Schatten / Sumpf
        else if ((g === TILES.GRASS || g === TILES.SWAMP_GROUND) && val < -0.45) {
          this.objects[jy][jx] = sub > 0 ? OBJECTS.MUSHROOM : OBJECTS.MUSHROOM_BROWN;
        }
        // Baumstamm / Totholz
        else if (sub < -0.68 && this.canopy[jy][jx] !== CANOPY.TREE_CROWN) {
          this.objects[jy][jx] = OBJECTS.FALLEN_LOG;
        }
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

  clearBridgesAndAccessCorridors() {
    const bridgeTiles = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const g = this.ground[y][x];
        if (g === TILES.BRIDGE_H || g === TILES.BRIDGE_V) {
          bridgeTiles.push({ x, y, g });
          this.objects[y][x] = OBJECTS.NONE;
          this.canopy[y][x] = CANOPY.NONE;
        }
      }
    }

    if (bridgeTiles.length === 0) return;

    // Bridge landings / approaches: walkable non-bridge tiles adjacent to the ends of bridges
    const landingTiles = [];
    for (const b of bridgeTiles) {
      // For BRIDGE_H, look at left/right (dx = -1, -2, 1, 2)
      // For BRIDGE_V, look at up/down (dy = -1, -2, 1, 2)
      const offsets = (b.g === TILES.BRIDGE_H)
        ? [{ dx: -1, dy: 0 }, { dx: -2, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 }]
        : [{ dx: 0, dy: -1 }, { dx: 0, dy: -2 }, { dx: 0, dy: 1 }, { dx: 0, dy: 2 }];

      for (const off of offsets) {
        const nx = b.x + off.dx;
        const ny = b.y + off.dy;
        if (this.isValid(nx, ny)) {
          const ng = this.ground[ny][nx];
          if (ng !== TILES.BRIDGE_H && ng !== TILES.BRIDGE_V && ng !== TILES.WATER && ng !== TILES.SWAMP_WATER && ng !== TILES.VOID_LAKE) {
            landingTiles.push({ x: nx, y: ny });
            // Clear obstacles on landing path
            if (this.objects[ny][nx] !== OBJECTS.NONE && this.objects[ny][nx] !== OBJECTS.CAVE_ENTRANCE && this.objects[ny][nx] !== OBJECTS.TRAMPOLINE && this.objects[ny][nx] !== OBJECTS.SHRINE) {
              this.objects[ny][nx] = OBJECTS.NONE;
            }
            this.canopy[ny][nx] = CANOPY.NONE;
            // Also clear 1 tile perpendicular for bridgehead corridor
            for (const adj of [-1, 1]) {
              const any = (b.g === TILES.BRIDGE_H) ? ny + adj : ny;
              const anx = (b.g === TILES.BRIDGE_H) ? nx : nx + adj;
              if (this.isValid(anx, any)) {
                if (this.objects[any][anx] !== OBJECTS.NONE && this.objects[any][anx] !== OBJECTS.CAVE_ENTRANCE && this.objects[any][anx] !== OBJECTS.TRAMPOLINE && this.objects[any][anx] !== OBJECTS.SHRINE) {
                  this.objects[any][anx] = OBJECTS.NONE;
                }
                this.canopy[any][anx] = CANOPY.NONE;
              }
            }
          }
        }
      }
    }

    // Filter trees away from all bridge tiles and bridge landings
    const criticalPoints = [...bridgeTiles, ...landingTiles];
    this.trees = this.trees.filter(t => {
      for (const pt of criticalPoints) {
        const px = pt.x * TILE_SIZE + 8;
        const py = pt.y * TILE_SIZE + 8;
        if (Math.hypot(t.x - px, t.y - py) < (t.trunkRadius + 14)) {
          return false;
        }
      }
      return true;
    });

    // Filter canopy crowns away from bridges so bridge decks are clearly visible
    this.canopyCrowns = this.canopyCrowns.filter(c => {
      for (const pt of bridgeTiles) {
        const px = pt.x * TILE_SIZE + 8;
        const py = pt.y * TILE_SIZE + 8;
        if (Math.hypot(c.x - px, c.y - py) < 28) {
          return false;
        }
      }
      return true;
    });
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

  isNearBridge(tileX, tileY, radius = 2) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = tileX + dx;
        const ny = tileY + dy;
        if (this.isValid(nx, ny)) {
          const g = this.ground[ny][nx];
          if (g === TILES.BRIDGE_H || g === TILES.BRIDGE_V) {
            return true;
          }
        }
      }
    }
    return false;
  }

  isNearWater(tileX, tileY, radius = 2) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = tileX + dx;
        const ny = tileY + dy;
        if (!this.isValid(nx, ny)) return true;
        const g = this.ground[ny][nx];
        if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE || g === TILES.QUICKSAND) {
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
    if (this.isNearBridge(tileX, tileY, 2)) return;

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
  // HÖHENEBENEN-SYSTEM (14 Plateaus & 7 Löcher/Senken über die 290x200 Welt)
  // ==========================================================================
  generateElevationsAndRamps() {
    // 1. Malerischer Hügel direkt am Spawn (Level 1 & Level 2 mit Rampe Richtung Spawn)
    this.createPlateau(this.spawnPoint.x + 22, this.spawnPoint.y - 10, 9, 6, ELEVATION.LEVEL_1, ['W', 'S']);
    this.createPlateau(this.spawnPoint.x + 22, this.spawnPoint.y - 10, 4, 3, ELEVATION.LEVEL_2, ['W']);
    this.createHole(this.spawnPoint.x + 14, this.spawnPoint.y + 16, 5, 4, 'N');

    // 2. Nordwest-Wald hügelige Plateaus & Moos-Senke
    this.createPlateau(Math.round(this.width * 0.16), Math.round(this.height * 0.35), 11, 8, ELEVATION.LEVEL_1, ['S', 'E']);
    this.createPlateau(Math.round(this.width * 0.16), Math.round(this.height * 0.35), 5, 4, ELEVATION.LEVEL_2, ['S']);
    this.createHole(Math.round(this.width * 0.24), Math.round(this.height * 0.36), 5, 4, 'S');

    // 3. Nordost-Schneegebirge (Hohe 2-Stufen-Gipfel & tiefe Eisspalte)
    this.createPlateau(Math.round(this.width * 0.74), Math.round(this.height * 0.22), 14, 10, ELEVATION.LEVEL_1, ['S', 'W']);
    this.createPlateau(Math.round(this.width * 0.74), Math.round(this.height * 0.22), 7, 5, ELEVATION.LEVEL_2, ['S']);
    this.createHole(Math.round(this.width * 0.78), Math.round(this.height * 0.16), 5, 4, 'S');

    // 4. Nordost-Rand Felsplateau
    this.createPlateau(Math.round(this.width * 0.88), Math.round(this.height * 0.26), 10, 7, ELEVATION.LEVEL_1, ['W', 'S']);
    this.createPlateau(Math.round(this.width * 0.88), Math.round(this.height * 0.26), 5, 3, ELEVATION.LEVEL_2, ['W']);

    // 5. Zentrales Flussufer-Plateau & Klippen-Aussichtspunkt
    this.createPlateau(Math.round(this.width * 0.36), Math.round(this.height * 0.52), 10, 6, ELEVATION.LEVEL_1, ['N', 'E']);
    this.createHole(Math.round(this.width * 0.46), Math.round(this.height * 0.58), 5, 4, 'W');

    // 6. Südwest-Wüstenmesas & Treibsand-Krater
    this.createPlateau(Math.round(this.width * 0.18), Math.round(this.height * 0.74), 13, 8, ELEVATION.LEVEL_1, ['N', 'E']);
    this.createPlateau(Math.round(this.width * 0.18), Math.round(this.height * 0.74), 6, 4, ELEVATION.LEVEL_2, ['N']);
    this.createHole(Math.round(this.width * 0.24), Math.round(this.height * 0.84), 6, 4, 'N');

    // 7. Südliche Dünen-Tafelberge
    this.createPlateau(Math.round(this.width * 0.10), Math.round(this.height * 0.86), 9, 6, ELEVATION.LEVEL_1, ['E']);
    this.createHole(Math.round(this.width * 0.14), Math.round(this.height * 0.66), 5, 4, 'S');

    // 8. Südost-Sumpfgrate & Schlamm-Kuhlen
    this.createPlateau(Math.round(this.width * 0.58), Math.round(this.height * 0.78), 10, 7, ELEVATION.LEVEL_1, ['N', 'W']);
    this.createHole(Math.round(this.width * 0.66), Math.round(this.height * 0.72), 6, 5, 'S');
    this.createPlateau(Math.round(this.width * 0.76), Math.round(this.height * 0.82), 11, 7, ELEVATION.LEVEL_1, ['N', 'W']);

    // 9. Ostgipfel & Sonnenaufgangs-Hochebene
    this.createPlateau(Math.round(this.width * 0.84), Math.round(this.height * 0.54), 12, 8, ELEVATION.LEVEL_1, ['W', 'S']);
    this.createPlateau(Math.round(this.width * 0.84), Math.round(this.height * 0.54), 6, 4, ELEVATION.LEVEL_2, ['W']);
    this.createHole(Math.round(this.width * 0.90), Math.round(this.height * 0.68), 5, 4, 'W');

    // 10. Leeren-Plateau (Void Rift Edge Rim)
    const vz = this.preset.voidZone;
    this.createPlateau(vz.x - 14, vz.y + 10, 9, 6, ELEVATION.LEVEL_1, ['W', 'S']);
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

    if (diff <= 0) return true;

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

    return false;
  }
}
