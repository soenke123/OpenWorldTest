import { MAP_WIDTH, MAP_HEIGHT, TILES, OBJECTS, BIOMES, TILE_SIZE } from './constants.js';
import { Noise2D } from './noise.js';

export class CloudMap {
  constructor() {
    this.width = MAP_WIDTH;   // 130 Kacheln
    this.height = MAP_HEIGHT; // 90 Kacheln
    this.name = 'Rosa Wolkenreich';
    this.biome = BIOMES.CLOUDS;

    this.ground = [];
    this.objects = [];
    this.elevation = [];
    this.ramps = [];
    this.shrines = [];

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

    this.generateCloudIslands();
    this.generateRainbowBridges();
    this.generateCloudShrines();
  }

  // Generiert eine organisch geformte rosa Wolke aus mehreren überlappenden Puff-Kreisen
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

  createCloudIsland(cx, cy, radius = 5) {
    // Kleiner zentraler fluffiger Kern
    this.createCloudPuff(cx, cy, radius);

    // 7 überlappende Bausch-Lappen (Fluffy Lobes) für die süße Wolkenform
    const lobes = 7;
    for (let i = 0; i < lobes; i++) {
      const angle = (i / lobes) * Math.PI * 2;
      const lx = Math.round(cx + Math.cos(angle) * (radius * 0.7));
      const ly = Math.round(cy + Math.sin(angle) * (radius * 0.65));
      const lRadius = Math.max(2, Math.round(radius * 0.55 + ((i % 2) * 1.2)));
      this.createCloudPuff(lx, ly, lRadius);
    }
  }

  generateCloudIslands() {
    // 15 kleinere, fluffige rosa Wolkeninseln im Himmel
    // Nördliche Reihe
    this.createCloudIsland(20, 20, 4.5);  // A1: West-Wald Himmel
    this.createCloudIsland(44, 20, 4.5);  // A2: Nordwest Trittwolke
    this.createCloudIsland(65, 14, 5.0);  // A3: Nordgipfel Wolke (Schrein)
    this.createCloudIsland(86, 20, 4.5);  // A4: Nordost Schnee Himmel
    this.createCloudIsland(110, 20, 4.5); // A5: Fernost Wolke

    // Mittlere Reihe
    this.createCloudIsland(18, 44, 4.5);  // B1: West Horizont
    this.createCloudIsland(38, 44, 4.5);  // B2: Westzentrum
    this.createCloudIsland(65, 44, 5.5);  // B3: Zentrales Wolkenheiligtum (Schrein)
    this.createCloudIsland(90, 44, 4.5);  // B4: Ostzentrum
    this.createCloudIsland(112, 44, 5.0); // B5: Fernost Morgenwolke (Schrein)

    // Südliche Reihe
    this.createCloudIsland(24, 70, 4.5);  // C1: Südwest Wüsten Himmel
    this.createCloudIsland(44, 70, 4.5);  // C2: Südwest Trittwolke
    this.createCloudIsland(65, 74, 5.0);  // C3: Südgipfel Wolke
    this.createCloudIsland(90, 70, 4.5);  // C4: Südost Sumpf Himmel
    this.createCloudIsland(112, 70, 4.5); // C5: Fern-Südost Wolke
  }

  // Horizontale Regenbogenbrücke
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

  // Vertikale Regenbogenbrücke
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
    // ========================================================================
    // LANGE REGENBOGENBRÜCKEN ZWISCHEN DEN FLUFFIGEN WOLKENINSELN
    // ========================================================================
    // 1. Nördliche Querbrücken
    this.createRainbowBridgeH(25, 39, 20, 2);   // A1 -> A2 (15 Kacheln)
    this.createRainbowBridgeH(49, 60, 18, 2);   // A2 -> A3 (12 Kacheln)
    this.createRainbowBridgeV(15, 18, 60, 2);
    this.createRainbowBridgeH(70, 81, 18, 2);   // A3 -> A4 (12 Kacheln)
    this.createRainbowBridgeV(15, 18, 70, 2);
    this.createRainbowBridgeH(91, 105, 20, 2);  // A4 -> A5 (15 Kacheln)

    // 2. Mittlere Haupt-Himmelsstraße (Lange Brücken ins Zentrum)
    this.createRainbowBridgeH(23, 33, 44, 2);   // B1 -> B2 (11 Kacheln)
    this.createRainbowBridgeH(43, 59, 44, 2);   // B2 -> B3 Zentrum (17 Kacheln!)
    this.createRainbowBridgeH(71, 85, 44, 2);   // B3 Zentrum -> B4 (15 Kacheln!)
    this.createRainbowBridgeH(95, 107, 44, 2);  // B4 -> B5 (13 Kacheln)

    // 3. Südliche Querbrücken
    this.createRainbowBridgeH(29, 39, 70, 2);   // C1 -> C2 (11 Kacheln)
    this.createRainbowBridgeH(49, 60, 72, 2);   // C2 -> C3 (12 Kacheln)
    this.createRainbowBridgeV(72, 74, 60, 2);
    this.createRainbowBridgeH(70, 85, 72, 2);   // C3 -> C4 (16 Kacheln)
    this.createRainbowBridgeV(72, 74, 70, 2);
    this.createRainbowBridgeH(95, 107, 70, 2);  // C4 -> C5 (13 Kacheln)

    // 4. Lange vertikale Himmelsbögen (Nord nach Süd)
    this.createRainbowBridgeV(20, 39, 65, 2);   // A3 Nordgipfel -> B3 Zentrum (20 Kacheln!)
    this.createRainbowBridgeV(49, 69, 65, 2);   // B3 Zentrum -> C3 Südgipfel (21 Kacheln!)

    // 5. Äußere vertikale Verbindungen
    this.createRainbowBridgeV(25, 39, 19, 2);   // A1 -> B1 (15 Kacheln)
    this.createRainbowBridgeV(49, 65, 21, 2);   // B1 -> C1 (17 Kacheln)

    this.createRainbowBridgeV(25, 39, 111, 2);  // A5 -> B5 (15 Kacheln)
    this.createRainbowBridgeV(49, 65, 112, 2);  // B5 -> C5 (17 Kacheln)
  }

  generateCloudShrines() {
    // 1. Schrein des Himmels-Zenits (Im Zentrum des zentralen Wolkenheiligtums)
    const shrineCenter = { x: 65, y: 42, name: 'Schrein des Himmels-Zenits' };
    this.objects[shrineCenter.y][shrineCenter.x] = OBJECTS.SHRINE;
    this.shrines.push(shrineCenter);

    // 2. Schrein der Rosa Dämmerung (Auf der Fernost-Morgenwolke)
    const shrineEast = { x: 112, y: 42, name: 'Schrein der Rosa Dämmerung' };
    this.objects[shrineEast.y][shrineEast.x] = OBJECTS.SHRINE;
    this.shrines.push(shrineEast);

    // 3. Schrein des Regenbogen-Wächters (Auf dem Nordgipfel)
    const shrineNorth = { x: 65, y: 13, name: 'Schrein des Regenbogen-Wächters' };
    this.objects[shrineNorth.y][shrineNorth.x] = OBJECTS.SHRINE;
    this.shrines.push(shrineNorth);
  }
}
