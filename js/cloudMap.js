import { MAP_WIDTH, MAP_HEIGHT, TILES, OBJECTS, BIOMES, TILE_SIZE } from './constants.js';
import { Noise2D } from './noise.js';

export class CloudMap {
  constructor(overworldMap = null, width = MAP_WIDTH, height = MAP_HEIGHT) {
    this.overworldMap = overworldMap;
    this.width = overworldMap ? overworldMap.width : width;
    this.height = overworldMap ? overworldMap.height : height;
    this.name = 'Rosa Wolkenreich';
    this.biome = BIOMES.CLOUDS;

    this.ground = [];
    this.objects = [];
    this.elevation = [];
    this.ramps = [];
    this.shrines = [];
    this.islands = [];

    this.noise = new Noise2D(9923);
    this.init();
  }

  isValid(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getGroundTile(x, y) {
    if (!this.isValid(x, y)) return TILES.SKY_ABYSS;
    return this.ground[y][x];
  }

  getObjectTile(x, y) {
    if (!this.isValid(x, y)) return OBJECTS.NONE;
    return this.objects[y][x];
  }

  getElevation() {
    return 0;
  }

  getRamp() {
    return 0;
  }

  isSolid(x, y) {
    if (!this.isValid(x, y)) return true;
    const obj = this.objects[y][x];
    if (obj === OBJECTS.SHRINE) return true;
    return false;
  }

  isElevationPassable() {
    return true;
  }

  checkTreeCollision() {
    return false;
  }

  getSpeedModifier(x, y) {
    if (!this.isValid(x, y)) return 1.0;
    const tile = this.ground[y][x];
    if (tile === TILES.RAINBOW_BRIDGE_H || tile === TILES.RAINBOW_BRIDGE_V) {
      return 1.15; // Sanfter Geschwindigkeits-Boost auf Regenbogenbrücken
    }
    return 1.0;
  }

  isDeadly() {
    return false;
  }

  getBiome() {
    return this.biome;
  }

  init() {
    for (let y = 0; y < this.height; y++) {
      this.ground[y] = new Uint8Array(this.width);
      this.objects[y] = new Uint8Array(this.width);
      this.elevation[y] = new Int8Array(this.width);
      this.ramps[y] = new Uint8Array(this.width);
      for (let x = 0; x < this.width; x++) {
        // Standardmäßig freier Himmel / Fallzone
        this.ground[y][x] = TILES.SKY_ABYSS;
      }
    }

    this.generateCloudArchipelago();
    this.generateRainbowBridges();
    this.generateCloudShrines();
  }

  createCloudPuff(cx, cy, radius, roughness = 0.3) {
    const n = this.noise;
    const r = Math.round(radius);
    const centerX = Math.round(cx);
    const centerY = Math.round(cy);

    for (let dy = -r - 2; dy <= r + 2; dy++) {
      for (let dx = -r - 2; dx <= r + 2; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (!this.isValid(x, y)) continue;

        const dist = Math.hypot(dx, dy) + n.noise(x * 0.3, y * 0.3) * roughness * radius;
        if (dist <= radius) {
          this.ground[y][x] = TILES.CLOUD_PINK;
        }
      }
    }
  }

  createCloudIsland(cx, cy, radius = 6) {
    this.createCloudPuff(cx, cy, radius);

    const lobes = 7;
    for (let i = 0; i < lobes; i++) {
      const angle = (i / lobes) * Math.PI * 2;
      const lx = Math.round(cx + Math.cos(angle) * (radius * 0.7));
      const ly = Math.round(cy + Math.sin(angle) * (radius * 0.65));
      const lRadius = Math.max(2, Math.round(radius * 0.55 + ((i % 2) * 1.2)));
      this.createCloudPuff(lx, ly, lRadius);
    }
    this.islands.push({ x: cx, y: cy, radius });
  }

  generateCloudArchipelago() {
    this.islands = [];

    // 1. Inseln direkt über den Trampolinen der Oberwelt verankern
    if (this.overworldMap && this.overworldMap.trampolines) {
      for (const tramp of this.overworldMap.trampolines) {
        this.createCloudIsland(tramp.x, tramp.y, 6.0);
      }
    }

    // 2. Zusätzliche asymmetrische Wolken-Cluster über die gesamte 290x200 Welt verteilen
    const extraSpots = [
      { x: Math.round(this.width * 0.15), y: Math.round(this.height * 0.15), r: 7.0 },
      { x: Math.round(this.width * 0.35), y: Math.round(this.height * 0.12), r: 6.5 },
      { x: Math.round(this.width * 0.55), y: Math.round(this.height * 0.20), r: 8.0 },
      { x: Math.round(this.width * 0.82), y: Math.round(this.height * 0.16), r: 7.5 },
      { x: Math.round(this.width * 0.12), y: Math.round(this.height * 0.45), r: 6.0 },
      { x: Math.round(this.width * 0.50), y: Math.round(this.height * 0.48), r: 9.0 },
      { x: Math.round(this.width * 0.78), y: Math.round(this.height * 0.45), r: 7.0 },
      { x: Math.round(this.width * 0.25), y: Math.round(this.height * 0.68), r: 6.5 },
      { x: Math.round(this.width * 0.60), y: Math.round(this.height * 0.72), r: 8.0 },
      { x: Math.round(this.width * 0.85), y: Math.round(this.height * 0.80), r: 7.0 },
      { x: Math.round(this.width * 0.40), y: Math.round(this.height * 0.85), r: 6.5 }
    ];

    for (const spot of extraSpots) {
      // Prüfe, ob nicht schon eine Trampolin-Insel zu nah dran ist
      let tooClose = false;
      for (const isl of this.islands) {
        if (Math.hypot(isl.x - spot.x, isl.y - spot.y) < 18) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) {
        this.createCloudIsland(spot.x, spot.y, spot.r);
      }
    }
  }

  createRainbowBridgeH(x1, x2, y, thickness = 2) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
      for (let dy = 0; dy < thickness; dy++) {
        const ty = y + dy;
        if (this.isValid(x, ty) && this.ground[ty][x] === TILES.SKY_ABYSS) {
          this.ground[ty][x] = TILES.RAINBOW_BRIDGE_H;
        }
      }
    }
  }

  createRainbowBridgeV(y1, y2, x, thickness = 2) {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y++) {
      for (let dx = 0; dx < thickness; dx++) {
        const tx = x + dx;
        if (this.isValid(tx, y) && this.ground[y][tx] === TILES.SKY_ABYSS) {
          this.ground[y][tx] = TILES.RAINBOW_BRIDGE_V;
        }
      }
    }
  }

  generateRainbowBridges() {
    // Verbinde gezielt einige nahegelegene Inselpaare zu Clustern,
    // lasse aber andere Inseln freistehend/losgelöst im Himmel schweben
    for (let i = 0; i < this.islands.length; i++) {
      for (let j = i + 1; j < this.islands.length; j++) {
        const a = this.islands[i];
        const b = this.islands[j];

        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);

        // Horizontale Nachbarn mit kleinem Y-Versatz
        if (dx >= 14 && dx <= 38 && dy <= 6) {
          if (this.noise.noise(a.x * 0.1, b.y * 0.1) > -0.2) {
            this.createRainbowBridgeH(a.x, b.x, Math.round((a.y + b.y) / 2), 2);
          }
        }
        // Vertikale Nachbarn mit kleinem X-Versatz
        else if (dy >= 14 && dy <= 38 && dx <= 6) {
          if (this.noise.noise(b.x * 0.1, a.y * 0.1) > -0.2) {
            this.createRainbowBridgeV(a.y, b.y, Math.round((a.x + b.x) / 2), 2);
          }
        }
      }
    }
  }

  generateCloudShrines() {
    this.shrines = [];

    // Platziere 4 bis 6 Shinto-Schreine auf den größeren Wolkeninseln
    const shrineNames = [
      'Schrein der Äther-Winde',
      'Schrein des Morgensterns',
      'Schrein der Schwebenden Gipfel',
      'Schrein des Regenbogens',
      'Schrein der Weißen Schwingen',
      'Schrein der Aurora'
    ];

    let nameIdx = 0;
    for (const isl of this.islands) {
      if (isl.radius >= 6.5 && nameIdx < shrineNames.length) {
        const sx = isl.x;
        const sy = isl.y - 1;
        if (this.isValid(sx, sy)) {
          this.objects[sy][sx] = OBJECTS.SHRINE;
          this.shrines.push({ x: sx, y: sy, name: shrineNames[nameIdx] });
          nameIdx++;
        }
      }
    }
  }
}
