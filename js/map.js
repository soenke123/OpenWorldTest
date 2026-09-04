import { MAP_WIDTH, MAP_HEIGHT, TILES, TILE_PROPS, OBJECTS, OBJ_PROPS, CANOPY, BIOMES, TREES, TILE_SIZE, TILE_LAYER_ORDER, ELEVATION, RAMPS } from './constants.js';
import { Noise2D } from './noise.js';

export class WorldMap {
  constructor() {
    this.width = MAP_WIDTH;
    this.height = MAP_HEIGHT;

    this.ground = [];
    this.objects = [];
    this.canopy = [];
    this.canopyCrowns = [];
    this.trees = [];
    this.kodamas = [];
    this.elevation = []; // Int8Array: -1, 0, 1, 2
    this.ramps = [];     // Uint8Array: RAMPS.*
    this.holeEntrances = []; // Portale / Zugänge zu Höhlen in Löchern
    this.trampolines = [];   // Trampoline zum Wolkenreich

    this.spawnPoint = { x: 30, y: 45 }; // In 16px tiles
    this.noise = new Noise2D(4242);     // Deterministic seed for reproducible test world

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

    // --------------------------------------------------------------------
    // STEP 1: ORGANIC BIOME ASSIGNMENT WITH NOISE PERTURBATION
    // --------------------------------------------------------------------
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Domain warping for natural, curvy, non-linear biome borders
        const warpX = x + n.fbm(x * 0.04, y * 0.04, 3) * 12;
        const warpY = y + n.fbm((x + 50) * 0.04, (y + 50) * 0.04, 3) * 12;

        const nx = warpX / this.width;
        const ny = warpY / this.height;

        // Default: Grassland
        let tile = TILES.GRASS;

        // Northeast: Snow & Ice
        if (nx > 0.52 && ny < 0.44) {
          tile = TILES.SNOW;
        }
        // Southwest: Desert & Quicksand
        else if (nx < 0.46 && ny > 0.52) {
          tile = TILES.SAND;
        }
        // Far East: The Void
        else if (nx > 0.74 && ny > 0.35) {
          tile = TILES.VOID_GROUND;
        }
        // Southeast: Swamp
        else if (nx > 0.44 && ny > 0.48) {
          tile = TILES.SWAMP_GROUND;
        }

        this.ground[y][x] = tile;
      }
    }

    // --------------------------------------------------------------------
    // STEP 2: ORGANIC MEANDERING RIVER & WATER BODIES
    // --------------------------------------------------------------------
    // A natural winding river flowing from North to South through Grassland
    for (let y = 0; y < this.height; y++) {
      // River center weaves with noise
      const riverCenter = 44 + Math.sin(y * 0.08) * 8 + n.noise(y * 0.05, 10) * 10;
      const riverWidth = 3.5 + Math.sin(y * 0.15) * 1.5;

      for (let x = 0; x < this.width; x++) {
        const dist = Math.abs(x - riverCenter);
        if (dist < riverWidth) {
          // If in swamp area, turn into swamp water
          if (this.ground[y][x] === TILES.SWAMP_GROUND) {
            this.ground[y][x] = TILES.SWAMP_WATER;
          } else if (this.ground[y][x] !== TILES.VOID_GROUND) {
            this.ground[y][x] = TILES.WATER;
          }
        }
      }
    }

    // Organic Lake in Snow region
    this.createOrganicBlob(88, 22, 9, TILES.WATER, 0.6);

    // Organic Swamp Water Ponds in Swamp
    this.createOrganicBlob(72, 64, 7, TILES.SWAMP_WATER, 0.55);
    this.createOrganicBlob(86, 78, 8, TILES.SWAMP_WATER, 0.58);

    // --------------------------------------------------------------------
    // STEP 3: QUICKSAND IN THE DESERT (Organic swirling sinkhole)
    // --------------------------------------------------------------------
    this.createOrganicBlob(28, 72, 8, TILES.QUICKSAND, 0.5);

    // --------------------------------------------------------------------
    // STEP 4: DEADLY VOID LAKE IN THE VOID (Jagged Abyss)
    // --------------------------------------------------------------------
    this.createOrganicBlob(112, 62, 10, TILES.VOID_LAKE, 0.52);

    // --------------------------------------------------------------------
    // STEP 5: BRIDGES OVER THE RIVER
    // --------------------------------------------------------------------
    // Main horizontal wooden bridge connecting West and East
    const bridgeY = 44;
    for (let x = 36; x <= 52; x++) {
      if (this.ground[bridgeY][x] === TILES.WATER || this.ground[bridgeY][x] === TILES.SWAMP_WATER) {
        this.ground[bridgeY - 1][x] = TILES.BRIDGE_H;
        this.ground[bridgeY][x] = TILES.BRIDGE_H;
      }
    }

    // Northern snow crossing bridge
    const bridgeY2 = 18;
    for (let x = 36; x <= 50; x++) {
      if (this.ground[bridgeY2][x] === TILES.WATER) {
        this.ground[bridgeY2][x] = TILES.BRIDGE_H;
      }
    }

    // --------------------------------------------------------------------
    // STEP 6: NATURAL WINDING DIRT PATHS
    // --------------------------------------------------------------------
    // Connect spawn point to bridge and north
    this.createWindingPath(this.spawnPoint.x, this.spawnPoint.y, 42, 44, 2);
    this.createWindingPath(46, 44, 75, 44, 2);
    this.createWindingPath(30, 45, 20, 20, 2); // towards forest

    // --------------------------------------------------------------------
    // STEP 6b: MULTI-TIER ELEVATION SYSTEM (Plateaus +1, +2 and Holes -1 with Ramps)
    // --------------------------------------------------------------------
    this.generateElevationsAndRamps();

    // --------------------------------------------------------------------
    // STEP 7: DENSE LIVING FOREST (Thick Canopy Roof + Walkable Trails)
    // --------------------------------------------------------------------
    this.trees = [];

    // Clear canopy array
    for (let y = 0; y < this.height; y++) {
      this.canopy[y].fill(CANOPY.NONE);
    }

    // 1. Thick Forest Canopy Roof with Organic Sunbeam Openings
    for (let y = 4; y <= 34; y++) {
      for (let x = 4; x <= 40; x++) {
        if (!this.isValid(x, y)) continue;
        const gTile = this.ground[y][x];
        if (gTile === TILES.WATER || gTile === TILES.SWAMP_WATER || gTile === TILES.BRIDGE_H) continue;
        if (Math.hypot(x - this.spawnPoint.x, y - this.spawnPoint.y) < 5) continue;

        const distFromCenter = Math.hypot(x - 22, y - 18);
        const forestDensity = n.fbm(x * 0.12, y * 0.12, 3);

        if (distFromCenter < 16 + forestDensity * 7) {
          // Forest floor gets dirt and rich shaded soil
          if (n.noise(x * 0.28, y * 0.28) > -0.1) {
            this.ground[y][x] = TILES.DIRT;
          }

          // Seltene, kleine Lichtschneisen ("nur an einigen wenigen Stellen bricht ein Sonnenstrahl durch")
          const gapNoise = n.noise(x * 0.35, y * 0.35);
          if (gapNoise > 0.68) {
            // Sunlit gap: ground visible from above!
            this.canopy[y][x] = CANOPY.NONE;
            if (n.noise(x * 1.7, y * 1.7) > 0.2) {
              this.objects[y][x] = OBJECTS.FOREST_FLOWERS;
            } else if (n.noise(x * 1.7, y * 1.7) < -0.2) {
              this.objects[y][x] = OBJECTS.FERN;
            }
          } else {
            // Dichtes, geschlossenes Blätterdach über dem Kopf
            this.canopy[y][x] = CANOPY.TREE_CROWN;
          }
        }
      }
    }

    // 1b. Grosse, überlappende Baumkronen für das geschlossene Kronendach
    this.canopyCrowns = [];
    const crownSpacingX = 18;
    const crownSpacingY = 16;

    for (let py = 3 * TILE_SIZE; py <= 36 * TILE_SIZE; py += crownSpacingY) {
      const rowIndex = Math.floor(py / crownSpacingY);
      const rowOffset = (rowIndex % 2 === 1) ? crownSpacingX * 0.5 : 0;

      for (let px = 3 * TILE_SIZE; px <= 42 * TILE_SIZE; px += crownSpacingX) {
        const jx = px + rowOffset + n.noise(px * 0.15, py * 0.15) * 5;
        const jy = py + n.noise(px * 0.25, py * 0.25) * 5;

        const tileX = Math.floor(jx / TILE_SIZE);
        const tileY = Math.floor(jy / TILE_SIZE);

        if (!this.isValid(tileX, tileY)) continue;
        if (this.canopy[tileY][tileX] !== CANOPY.TREE_CROWN) continue;

        // Verschiedene Baumarten & organische Kronengrößen (deutlich größer als 1 Tile!)
        const tRand = Math.abs(n.noise(tileX * 0.7 + 15, tileY * 0.7 + 15));
        let treeType = TREES.OAK;
        if (tRand > 0.76) treeType = TREES.PINE;
        else if (tRand > 0.54) treeType = TREES.BIRCH;
        else if (tRand > 0.40) treeType = TREES.AUTUMN;
        else if (tRand > 0.22) treeType = TREES.BLOSSOM;

        const radius = 17 + Math.abs(n.noise(tileX * 0.85, tileY * 0.85)) * 5; // 17px bis 22px Radius = 34px bis 44px Durchmesser!
        const hasLantern = (n.noise(jx * 0.18, jy * 0.18) > 0.65);

        this.canopyCrowns.push({
          x: jx,
          y: jy,
          type: treeType,
          radius,
          hasLantern
        });
      }
    }

    // Von Nord nach Süd sortieren, damit südliche Kronen die nördlichen mit Schatten überdecken
    this.canopyCrowns.sort((a, b) => a.y - b.y);

    // 2. Walkable Trees under the Canopy (Spaced 4 tiles apart so player can walk freely!)
    for (let ty = 6; ty <= 32; ty += 4) {
      for (let tx = 6; tx <= 38; tx += 4) {
        const jx = tx + (n.noise(tx * 1.3, ty * 1.3) * 1.4);
        const jy = ty + (n.noise(tx * 2.1, ty * 2.1) * 1.4);
        const rx = Math.round(jx);
        const ry = Math.round(jy);
        if (!this.isValid(rx, ry)) continue;
        const gTile = this.ground[ry][rx];
        if (gTile === TILES.WATER || gTile === TILES.SWAMP_WATER || gTile === TILES.BRIDGE_H) continue;
        if (Math.hypot(rx - this.spawnPoint.x, ry - this.spawnPoint.y) < 5) continue;

        const distFromCenter = Math.hypot(rx - 22, ry - 18);
        const forestDensity = n.fbm(rx * 0.12, ry * 0.12, 3);

        if (distFromCenter < 14 + forestDensity * 6) {
          // Diverse tree species under canopy
          const tRand = Math.abs(n.noise(rx * 0.7 + 10, ry * 0.7 + 10));
          let treeType = TREES.OAK;
          if (tRand > 0.72) {
            treeType = TREES.PINE;
          } else if (tRand > 0.52) {
            treeType = TREES.BIRCH;
          } else if (tRand > 0.38) {
            treeType = TREES.AUTUMN;
          } else if (tRand > 0.22) {
            treeType = TREES.BLOSSOM;
          } else if (tRand > 0.12) {
            treeType = TREES.SAPLING;
          }

          const variant = Math.abs(Math.floor(n.noise(rx * 3.3, ry * 3.3) * 10)) % 2;
          this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, treeType, variant);

          // Selective obstacles ("nur an manchen stellen kommt man nicht durch")
          const obstRand = n.noise(rx * 1.9, ry * 1.9);
          if (obstRand > 0.58 && rx + 1 < this.width && this.objects[ry][rx + 1] === OBJECTS.NONE && !this.isNearRamp(rx + 1, ry, 2)) {
            this.objects[ry][rx + 1] = OBJECTS.FALLEN_LOG;
          } else if (obstRand < -0.58 && ry + 1 < this.height && this.objects[ry + 1][rx] === OBJECTS.NONE && !this.isNearRamp(rx, ry + 1, 2)) {
            this.objects[ry + 1][rx] = OBJECTS.ROCK_STONE;
          }

          // Walkable undergrowth
          const underRand = n.noise(rx * 2.5, ry * 2.5);
          if (underRand > 0.45 && this.objects[ry][rx] === OBJECTS.NONE) {
            this.objects[ry][rx] = OBJECTS.FERN;
          } else if (underRand < -0.45 && this.objects[ry][rx] === OBJECTS.NONE) {
            this.objects[ry][rx] = OBJECTS.MUSHROOM_BROWN;
          }
        }
      }
    }

    // 2. Snow Biome: Snowy Firs & Conifers
    for (let ty = 6; ty <= 36; ty += 4) {
      for (let tx = 65; tx <= 122; tx += 4) {
        if (!this.isValid(tx, ty)) continue;
        if (this.ground[ty][tx] !== TILES.SNOW) continue;
        const snowNoise = n.fbm(tx * 0.1, ty * 0.1, 2);
        if (snowNoise > 0.12) {
          const jx = tx + n.noise(tx * 1.5, ty * 1.5) * 1.4;
          const jy = ty + n.noise(tx * 2.5, ty * 2.5) * 1.4;
          const rx = Math.round(jx);
          const ry = Math.round(jy);
          if (this.isValid(rx, ry) && this.ground[ry][rx] === TILES.SNOW) {
            const isSnowy = n.noise(rx * 0.6, ry * 0.6) > 0.0;
            this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, isSnowy ? TREES.SNOWY_PINE : TREES.PINE, Math.abs(rx) % 2);
          }
        }
      }
    }

    // 3. Swamp Biome: Gnarled Weeping Willows & Deadwood
    for (let ty = 52; ty <= 84; ty += 4) {
      for (let tx = 55; tx <= 118; tx += 4) {
        if (!this.isValid(tx, ty)) continue;
        if (this.ground[ty][tx] !== TILES.SWAMP_GROUND) continue;
        const swampNoise = n.fbm(tx * 0.11, ty * 0.11, 2);
        if (swampNoise > 0.15) {
          const jx = tx + n.noise(tx * 1.7, ty * 1.7) * 1.4;
          const jy = ty + n.noise(tx * 2.7, ty * 2.7) * 1.4;
          const rx = Math.round(jx);
          const ry = Math.round(jy);
          if (this.isValid(rx, ry) && this.ground[ry][rx] === TILES.SWAMP_GROUND) {
            const isWillow = n.noise(rx * 0.5, ry * 0.5) > -0.1;
            this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, isWillow ? TREES.SWAMP_WILLOW : TREES.DEADWOOD, Math.abs(rx) % 2);
          }
        }
      }
    }

    // 4. Desert Biome: Desert Palms near Water & Oases
    for (let ty = 54; ty <= 82; ty += 3) {
      for (let tx = 8; tx <= 44; tx += 3) {
        if (!this.isValid(tx, ty)) continue;
        if (this.ground[ty][tx] !== TILES.SAND) continue;

        let nearWater = false;
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            const cx = tx + dx, cy = ty + dy;
            if (this.isValid(cx, cy)) {
              const g = this.ground[cy][cx];
              if (g === TILES.WATER || g === TILES.QUICKSAND) {
                nearWater = true;
                break;
              }
            }
          }
          if (nearWater) break;
        }

        if (nearWater && n.noise(tx * 0.4, ty * 0.4) > 0.0) {
          this.addTree(tx * TILE_SIZE + 8, ty * TILE_SIZE + 12, TREES.PALM, Math.abs(tx) % 2);
        }
      }
    }

    // 5. Grassland Plains: Scattered Solitary & Pair Trees
    for (let ty = 36; ty <= 60; ty += 5) {
      for (let tx = 10; tx <= 65; tx += 5) {
        if (!this.isValid(tx, ty)) continue;
        if (this.ground[ty][tx] !== TILES.GRASS) continue;
        if (Math.hypot(tx - this.spawnPoint.x, ty - this.spawnPoint.y) < 5) continue;

        if (n.noise(tx * 0.22, ty * 0.22) > 0.32) {
          const jx = tx + n.noise(tx * 1.8, ty * 1.8) * 1.8;
          const jy = ty + n.noise(tx * 2.8, ty * 2.8) * 1.8;
          const rx = Math.round(jx);
          const ry = Math.round(jy);
          if (this.isValid(rx, ry) && this.ground[ry][rx] === TILES.GRASS) {
            const pVal = n.noise(rx * 0.8, ry * 0.8);
            const type = pVal > 0.35 ? TREES.BLOSSOM : (pVal > -0.1 ? TREES.OAK : TREES.BIRCH);
            this.addTree(rx * TILE_SIZE + 8, ry * TILE_SIZE + 12, type, 0);
          }
        }
      }
    }

    // --------------------------------------------------------------------
    // STEP 8: OBJECTS & DECORATIONS WITH TRANSPARENT BACKGROUNDS
    // (Rocks, Ice Boulders, Void Crystals, Bushes, Cacti, Ferns, Flowers, Logs)
    // --------------------------------------------------------------------
    for (let y = 2; y < this.height - 2; y++) {
      for (let x = 2; x < this.width - 2; x++) {
        if (this.objects[y][x] !== OBJECTS.NONE) continue;
        const ground = this.ground[y][x];
        if (ground === TILES.WATER || ground === TILES.SWAMP_WATER || ground === TILES.VOID_LAKE ||
            ground === TILES.QUICKSAND || ground === TILES.BRIDGE_H || ground === TILES.BRIDGE_V) {
          continue;
        }

        // Keep ramps and stairs corridors 100% free of obstacles
        if (this.isNearRamp(x, y, 2)) continue;

        // Don't place solid object right on a tree base
        let onTree = false;
        for (const t of this.trees) {
          if (Math.hypot(t.x - (x * TILE_SIZE + 8), t.y - (y * TILE_SIZE + 8)) < 12) {
            onTree = true;
            break;
          }
        }
        if (onTree) continue;

        const objNoise = n.noise(x * 0.25, y * 0.25);
        const rand = n.noise(x * 1.7, y * 1.7);

        // Grassland Objects: Boulders, Bushes, Flowers, Ferns
        if (ground === TILES.GRASS) {
          if (objNoise > 0.52 && rand > 0.6) {
            this.objects[y][x] = OBJECTS.ROCK_STONE;
          } else if (objNoise > 0.44 && rand < -0.45) {
            this.objects[y][x] = OBJECTS.BUSH;
          } else if (rand > 0.72) {
            this.objects[y][x] = OBJECTS.FOREST_FLOWERS;
          } else if (rand < -0.65) {
            this.objects[y][x] = OBJECTS.FERN;
          }
        }

        // Forest Floor / Dirt Paths: Mushrooms, Logs, Ferns
        else if (ground === TILES.DIRT) {
          if (rand > 0.68) {
            this.objects[y][x] = OBJECTS.MUSHROOM_BROWN;
          } else if (rand < -0.68) {
            this.objects[y][x] = OBJECTS.FERN;
          } else if (objNoise > 0.52 && rand > 0.35) {
            this.objects[y][x] = OBJECTS.FALLEN_LOG;
          }
        }

        // Snow Objects: Ice Boulders
        else if (ground === TILES.SNOW) {
          if (objNoise > 0.42 && rand > 0.45) {
            this.objects[y][x] = OBJECTS.ROCK_ICE;
          }
        }

        // Desert Objects: Cacti & Desert Boulders
        else if (ground === TILES.SAND) {
          if (objNoise > 0.45 && rand > 0.6) {
            this.objects[y][x] = OBJECTS.CACTUS;
          } else if (objNoise > 0.5 && rand < -0.4) {
            this.objects[y][x] = OBJECTS.ROCK_STONE;
          }
        }

        // Swamp Objects: Mushrooms, Fallen Logs & Mossy Rocks
        else if (ground === TILES.SWAMP_GROUND) {
          if (objNoise > 0.45 && rand > 0.55) {
            this.objects[y][x] = rand > 0.75 ? OBJECTS.MUSHROOM_BROWN : OBJECTS.MUSHROOM;
          } else if (objNoise > 0.5 && rand < -0.5) {
            this.objects[y][x] = OBJECTS.FALLEN_LOG;
          } else if (objNoise > 0.48 && rand < -0.3) {
            this.objects[y][x] = OBJECTS.ROCK_STONE;
          }
        }

        // The Void: Neon Void Crystals
        else if (ground === TILES.VOID_GROUND) {
          if (objNoise > 0.38 && rand > 0.4) {
            this.objects[y][x] = OBJECTS.ROCK_VOID;
          }
        }
      }
    }

    // Outer boundary water barrier
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

    // Ensure spawn tile is clean grass
    this.ground[this.spawnPoint.y][this.spawnPoint.x] = TILES.GRASS;
    this.objects[this.spawnPoint.y][this.spawnPoint.x] = OBJECTS.NONE;
    this.canopy[this.spawnPoint.y][this.spawnPoint.x] = CANOPY.NONE;

    // Place Stone Lanterns (Tōrō) and Torii Gates at bridge crossings & paths
    if (this.isValid(35, 42)) this.objects[42][35] = OBJECTS.STONE_TORO;
    if (this.isValid(35, 45)) this.objects[45][35] = OBJECTS.STONE_TORO;
    if (this.isValid(53, 42)) this.objects[42][53] = OBJECTS.STONE_TORO;
    if (this.isValid(53, 45)) this.objects[45][53] = OBJECTS.STONE_TORO;
    if (this.isValid(35, 18)) this.objects[18][35] = OBJECTS.TORII_GATE;
    if (this.isValid(51, 18)) this.objects[18][51] = OBJECTS.TORII_GATE;

    // Populate Kodama Forest Spirits in the sacred forest & mossy groves
    this.kodamas = [];
    for (let i = 0; i < 28; i++) {
      const kx = 8 + Math.abs(n.noise(i * 13.7, 42.1)) * 34;
      const ky = 6 + Math.abs(n.noise(i * 27.3, 81.5)) * 28;
      const tx = Math.floor(kx);
      const ty = Math.floor(ky);
      if (this.isValid(tx, ty) && (this.ground[ty][tx] === TILES.GRASS || this.ground[ty][tx] === TILES.DIRT)) {
        this.kodamas.push({
          x: tx * TILE_SIZE + 8 + (n.noise(i * 3, 1) * 3),
          y: ty * TILE_SIZE + 10 + (n.noise(i * 3, 2) * 3),
          tiltSpeed: 2.2 + Math.abs(n.noise(i, 9)) * 2,
          tiltOffset: i * 1.6,
          floatOffset: i * 2.3
        });
      }
    }

    // --------------------------------------------------------------------
    // STEP 9: HÖHLEN-ZUGÄNGE IN LÖCHERN & TRAMPOLINE ZUM WOLKENREICH
    // --------------------------------------------------------------------
    this.placeCaveEntrances();
    this.placeTrampolines();

    // --------------------------------------------------------------------
    // STEP 10: RAMPEN & TREPPEN FREIHALTEN (Keine Bäume oder Objekte)
    // --------------------------------------------------------------------
    this.clearRampsAndAccessCorridors();
  }

  placeCaveEntrances() {
    this.holeEntrances = [
      { x: 12, y: 38, targetCave: 'main_complex', targetX: 16, targetY: 17, name: 'Grasland-Loch (Tiefenhöhlen)' },
      { x: 34, y: 12, targetCave: 'forest_grotto', targetX: 11, targetY: 11, name: 'Wald-Loch (Moosige Grotte)' },
      { x: 38, y: 76, targetCave: 'main_complex', targetX: 20, targetY: 53, name: 'Wüsten-Trichter (Tiefenhöhlen)' },
      { x: 104, y: 16, targetCave: 'snow_grotto', targetX: 11, targetY: 11, name: 'Schnee-Eisspalte (Eis-Grotte)' },
      { x: 118, y: 48, targetCave: 'void_grotto', targetX: 12, targetY: 11, name: 'Leeren-Riss (Astrale Kluft)' },
      { x: 82, y: 64, targetCave: 'main_complex', targetX: 74, targetY: 51, name: 'Sumpf-Kuhle (Tiefenhöhlen)' }
    ];

    for (const entrance of this.holeEntrances) {
      if (this.isValid(entrance.x, entrance.y)) {
        this.objects[entrance.y][entrance.x] = OBJECTS.CAVE_ENTRANCE;
      }
    }
  }

  placeTrampolines() {
    this.trampolines = [];
    const candidates = [
      // Unter Zentraler Himmelsstadt
      { x: 62, y: 44 }, { x: 68, y: 46 }, { x: 65, y: 42 },
      // Unter Nordwest-Wolke (Grasland & Wald)
      { x: 22, y: 18 }, { x: 26, y: 22 }, { x: 18, y: 22 }, { x: 28, y: 16 },
      // Unter Südwest-Wolke (Wüste)
      { x: 24, y: 68 }, { x: 28, y: 72 }, { x: 20, y: 70 }, { x: 32, y: 72 },
      // Unter Nordost-Wolke (Schnee & Eis)
      { x: 86, y: 20 }, { x: 90, y: 24 }, { x: 84, y: 24 }, { x: 92, y: 18 },
      // Unter Südost-Wolke (Sumpf)
      { x: 94, y: 66 }, { x: 98, y: 70 }, { x: 92, y: 68 }, { x: 96, y: 74 },
      // Unter Brücken-Trittwolken & Außenposten
      { x: 44, y: 32 }, { x: 44, y: 58 }, { x: 78, y: 33 }, { x: 82, y: 57 },
      { x: 14, y: 46 }, { x: 115, y: 38 }, { x: 65, y: 12 }, { x: 65, y: 78 }
    ];

    for (const c of candidates) {
      if (!this.isValid(c.x, c.y)) continue;
      const g = this.ground[c.y][c.x];
      if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE || g === TILES.QUICKSAND) continue;

      // Entferne etwaige kleine Felsen/Bäume an der Stelle
      this.objects[c.y][c.x] = OBJECTS.TRAMPOLINE;
      this.trampolines.push({ x: c.x, y: c.y });
    }
  }

  getHoleEntrance(tileX, tileY) {
    return this.holeEntrances.find(h => h.x === tileX && h.y === tileY);
  }

  isTrampoline(tileX, tileY) {
    if (!this.isValid(tileX, tileY)) return false;
    return this.objects[tileY][tileX] === OBJECTS.TRAMPOLINE;
  }

  // Stellt sicher, dass Treppen / Rampen und deren Zugänge 100% frei von Bäumen, Felsen und Objekten sind
  clearRampsAndAccessCorridors() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.ramps[y] || this.ramps[y][x] === RAMPS.NONE) continue;

        const rampCenterX = x * TILE_SIZE + 8;
        const rampCenterY = y * TILE_SIZE + 8;

        // 1. Felsen, Holzstämme und sonstige feste Hindernisse im Rampenkorridor entfernen
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (!this.isValid(nx, ny)) continue;

            const obj = this.objects[ny][nx];
            if (obj !== OBJECTS.NONE && obj !== OBJECTS.CAVE_ENTRANCE && obj !== OBJECTS.TRAMPOLINE) {
              const prop = OBJ_PROPS[obj];
              if (!prop || prop.solid || Math.abs(dx) + Math.abs(dy) <= 2) {
                this.objects[ny][nx] = OBJECTS.NONE;
              }
            }
          }
        }

        // 2. Bäume im Umkreis von 34px (mehr als 2 Kacheln) um die Treppe entfernen
        this.trees = this.trees.filter(t => {
          const dist = Math.hypot(t.x - rampCenterX, t.y - rampCenterY);
          return dist >= 34;
        });

        // 3. Überhängende Baumkronen im Kronendach lichten, damit die Treppe hell und sichtbar ist
        if (this.canopyCrowns) {
          this.canopyCrowns = this.canopyCrowns.filter(c => {
            const dist = Math.hypot(c.x - rampCenterX, c.y - rampCenterY);
            return dist >= 26;
          });
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

  // Helper for generating organic, wavy blobs (lakes, quicksand pits)
  createOrganicBlob(cx, cy, radius, tileId, threshold = 0.5) {
    const n = this.noise;
    const r = radius + 4;
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (!this.isValid(x, y)) continue;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        // Organic wobble on radius
        const wobble = n.noise(Math.cos(angle) * 2, Math.sin(angle) * 2) * (radius * 0.45);
        if (dist <= radius + wobble) {
          this.ground[y][x] = tileId;
          this.objects[y][x] = OBJECTS.NONE; // Clear objects in water/pit
        }
      }
    }
  }

  // Winding path generator between two points
  createWindingPath(x1, y1, x2, y2, width = 2) {
    const steps = Math.hypot(x2 - x1, y2 - y1) * 1.5;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let px = x1 + (x2 - x1) * t;
      let py = y1 + (y2 - y1) * t;

      // Add gentle sine/noise curve
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
            // Don't overwrite water
            if (this.ground[cy][cx] !== TILES.WATER && this.ground[cy][cx] !== TILES.SWAMP_WATER) {
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

    // Check ground solidity
    const ground = this.getGroundTile(tileX, tileY);
    const groundProps = TILE_PROPS[ground];
    if (groundProps && groundProps.solid) return true;

    // Check object solidity (rocks, ice, void crystals, trunks, cacti)
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
    if (this.isNearRamp(tileX, tileY, 2)) return; // Treppen/Rampen immer frei von Bäumen halten!

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

    const nearBridge = (Math.abs(tileX - 44) < 12 && Math.abs(tileY - 44) < 6);
    const nearSnowBridge = (Math.abs(tileX - 44) < 8 && Math.abs(tileY - 18) < 5);
    const sacredLantern = (this.noise.noise(px * 0.18, py * 0.18) > 0.52);
    const hasLantern = nearBridge || nearSnowBridge || sacredLantern;

    this.trees.push({
      id: this.trees.length,
      x: px,
      y: py,
      tileX,
      tileY,
      type,
      variant,
      hasLantern,
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
  // HÖHENEBENEN-SYSTEM (Podeste +1, +2, Löcher -1 und Schrägen / Rampen)
  // ==========================================================================
  generateElevationsAndRamps() {
    // 1. Grasland: Podest (+1 & +2) und Gras-Loch (-1)
    this.createPlateau(20, 52, 8, 6, ELEVATION.LEVEL_1, ['S', 'E']);
    this.createPlateau(20, 52, 4, 3, ELEVATION.LEVEL_2, ['S']);
    this.createHole(12, 38, 3, 3, 'S');

    // 2. Dichter Wald: Wald-Podest (+1) und Wald-Senke (-1)
    this.createPlateau(16, 14, 6, 5, ELEVATION.LEVEL_1, ['S']);
    this.createHole(34, 12, 4, 3, 'S');

    // 3. Wüste (Sand): Dünen-Plateau (+1 & +2) und Wüsten-Trichter (-1)
    this.createPlateau(16, 72, 8, 6, ELEVATION.LEVEL_1, ['N', 'E']);
    this.createPlateau(16, 72, 4, 3, ELEVATION.LEVEL_2, ['E']);
    this.createHole(38, 76, 4, 4, 'N');

    // 4. Schnee & Eis: Eis-Plateau (+1 & +2) und Eisspalte / Loch (-1)
    this.createPlateau(76, 18, 8, 6, ELEVATION.LEVEL_1, ['S', 'W']);
    this.createPlateau(76, 18, 4, 3, ELEVATION.LEVEL_2, ['S']);
    this.createHole(104, 16, 4, 3, 'S');

    // 5. Die Leere: Schwebendes Astral-Podest (+1 & +2) und Leeren-Riss (-1)
    this.createPlateau(104, 42, 8, 6, ELEVATION.LEVEL_1, ['W', 'N']);
    this.createPlateau(104, 42, 4, 3, ELEVATION.LEVEL_2, ['W']);
    this.createHole(118, 48, 4, 3, 'W');

    // 6. Düsterer Sumpf: Sumpf-Plateau (+1) und Sumpf-Kuhle (-1)
    this.createPlateau(66, 76, 6, 5, ELEVATION.LEVEL_1, ['N']);
    this.createHole(82, 64, 4, 3, 'S');
  }

  createPlateau(cx, cy, rx, ry, level = 1, rampDirections = ['S']) {
    const n = this.noise;
    const tilesInPlateau = [];

    for (let dy = -ry - 2; dy <= ry + 2; dy++) {
      for (let dx = -rx - 2; dx <= rx + 2; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (!this.isValid(x, y)) continue;

        // Wasser, Quicksand, Void-Lake und Brücken auslassen
        const g = this.ground[y][x];
        if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE || g === TILES.BRIDGE_H || g === TILES.BRIDGE_V) continue;
        if (Math.hypot(x - this.spawnPoint.x, y - this.spawnPoint.y) < 6) continue;

        // Organische Ellipse mit Noise
        const distNorm = Math.hypot(dx / rx, dy / ry) + n.noise(x * 0.3, y * 0.3) * 0.22;
        if (distNorm <= 1.0) {
          // Stufe 2 darf nur auf bestehende Stufe 1 gesetzt werden
          if (level === 2 && this.elevation[y][x] < 1) continue;
          this.elevation[y][x] = level;
          tilesInPlateau.push({ x, y });
        }
      }
    }

    if (tilesInPlateau.length === 0) return;

    // Rampen für gewünschte Richtungen anlegen
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
        this.elevation[rampY][rampX] = level - 1; // Rampe vermittelt von unterer Ebene
        this.ramps[rampY][rampX] = RAMPS.UP_NORTH; // Nach Norden hochsteigen
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
        this.ramps[rampY][rampX] = RAMPS.UP_SOUTH; // Nach Süden hochsteigen
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
        this.ramps[rampY][rampX] = RAMPS.UP_WEST; // Nach Westen hochsteigen
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
        this.ramps[rampY][rampX] = RAMPS.UP_EAST; // Nach Osten hochsteigen
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
        if (Math.hypot(x - this.spawnPoint.x, y - this.spawnPoint.y) < 6) continue;

        const distNorm = Math.hypot(dx / rx, dy / ry) + n.noise(x * 0.35, y * 0.35) * 0.2;
        if (distNorm <= 1.0) {
          this.elevation[y][x] = ELEVATION.HOLE; // -1
          if (this.objects[y][x] === OBJECTS.ROCK_STONE || this.objects[y][x] === OBJECTS.FALLEN_LOG) {
            this.objects[y][x] = OBJECTS.NONE;
          }
        }
      }
    }

    // Garantiere Aufgangs-Rampe aus dem Loch (-1) nach oben auf Ebene 0
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
        this.ramps[rampY][rampX] = RAMPS.UP_SOUTH; // Nach Süden rauslaufen
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
        this.ramps[rampY][rampX] = RAMPS.UP_NORTH; // Nach Norden rauslaufen
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
        this.ramps[rampY][rampX] = RAMPS.UP_WEST; // Nach Westen rauslaufen
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

    // 1. Gleiche Höhe -> immer passierbar
    if (diff === 0) return true;

    // 2. Eine Ebene nach oben (+1): Nur mit passender Rampe
    if (diff === 1) {
      const fromRamp = this.getRamp(fromX, fromY);
      const toRamp = this.getRamp(toX, toY);

      const moveDx = toX - fromX;
      const moveDy = toY - fromY;

      if (moveDy < 0 && (toRamp === RAMPS.UP_NORTH || fromRamp === RAMPS.UP_NORTH)) return true;
      if (moveDy > 0 && (toRamp === RAMPS.UP_SOUTH || fromRamp === RAMPS.UP_SOUTH)) return true;
      if (moveDx < 0 && (toRamp === RAMPS.UP_WEST || fromRamp === RAMPS.UP_WEST)) return true;
      if (moveDx > 0 && (toRamp === RAMPS.UP_EAST || fromRamp === RAMPS.UP_EAST)) return true;

      // Klippenwand blockiert Aufstieg
      return false;
    }

    // 3. Eine Ebene nach unten (-1): Herabspringen oder über Rampe runtergehen erlaubt
    if (diff === -1) {
      return true;
    }

    // 4. Größere Höhenunterschiede (>= 2 Stufen auf einmal): blockiert
    return false;
  }
}
