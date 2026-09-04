import { TILES, OBJECTS, BIOMES, TILE_SIZE, ELEVATION, RAMPS } from './constants.js';
import { Noise2D } from './noise.js';

export class CaveMap {
  constructor(id = 'main_complex') {
    this.id = id;
    this.noise = new Noise2D(8819);

    if (id === 'main_complex') {
      this.width = 90;
      this.height = 70;
      this.name = 'Tiefenhöhlen & Unterirdischer See';
      this.biome = BIOMES.CAVES_MAIN;
    } else if (id === 'sub_crystal') {
      this.width = 36;
      this.height = 30;
      this.name = 'Kristall-Unterhöhle';
      this.biome = BIOMES.CAVES_SUB;
    } else if (id === 'forest_grotto') {
      this.width = 22;
      this.height = 18;
      this.name = 'Moosige Wald-Grotte';
      this.biome = BIOMES.CAVES_GROTTO;
    } else if (id === 'snow_grotto') {
      this.width = 22;
      this.height = 18;
      this.name = 'Gefrorene Eis-Spalte';
      this.biome = BIOMES.CAVES_GROTTO;
    } else if (id === 'void_grotto') {
      this.width = 24;
      this.height = 18;
      this.name = 'Astrale Tiefen-Kluft';
      this.biome = BIOMES.CAVES_GROTTO;
    } else {
      this.width = 30;
      this.height = 25;
      this.name = 'Unterirdische Grotte';
      this.biome = BIOMES.CAVES_GROTTO;
    }

    this.ground = [];
    this.objects = [];
    this.elevation = [];
    this.ramps = [];
    this.exits = []; // { x, y, targetDim, targetX, targetY, label }
    this.shrines = [];

    this.init();
  }

  isValid(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getGroundTile(x, y) {
    if (!this.isValid(x, y)) return TILES.CAVE_WALL;
    return this.ground[y][x];
  }

  getObjectTile(x, y) {
    if (!this.isValid(x, y)) return OBJECTS.NONE;
    return this.objects[y][x];
  }

  getTheme(x, y) {
    if (this.id === 'snow_grotto') return 'snow';
    if (this.id === 'void_grotto') return 'void';
    if (this.id === 'forest_grotto') return 'forest';
    if (this.id === 'sub_crystal') return 'crystal';
    if (this.id === 'main_complex') {
      if (x < 42 && y > 38) return 'desert';
      if (x < 42 && y <= 38) return 'forest';
      if (x >= 42 && y > 38) return 'swamp';
      return 'crystal';
    }
    return 'main';
  }

  getElevation(x, y) {
    if (!this.isValid(x, y)) return 0;
    return this.elevation[y][x];
  }

  getRamp(x, y) {
    if (!this.isValid(x, y)) return 0;
    return this.ramps[y][x];
  }

  isSolid(x, y) {
    if (!this.isValid(x, y)) return true;
    const tile = this.ground[y][x];
    if (tile === TILES.CAVE_WALL || tile === TILES.CAVE_WATER) return true;
    const obj = this.objects[y][x];
    if (obj === OBJECTS.STALAGMITE || obj === OBJECTS.GLOW_CRYSTAL || obj === OBJECTS.SHRINE || obj === OBJECTS.TORCH) return true;
    return false;
  }

  isElevationPassable(fromX, fromY, toX, toY) {
    if (!this.isValid(toX, toY)) return false;
    return !this.isSolid(toX, toY);
  }

  checkTreeCollision() {
    return false;
  }

  getSpeedModifier() {
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
        this.ground[y][x] = TILES.CAVE_WALL;
      }
    }

    if (this.id === 'main_complex') {
      this.generateMainComplex();
    } else if (this.id === 'sub_crystal') {
      this.generateSubCrystal();
    } else {
      this.generateSingleGrotto();
    }
  }

  // Aushöhlen eines Raumes / Pfades
  carveRoom(cx, cy, rx, ry, roughness = 0.25) {
    const n = this.noise;
    for (let dy = -ry - 1; dy <= ry + 1; dy++) {
      for (let dx = -rx - 1; dx <= rx + 1; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (!this.isValid(x, y) || x <= 1 || x >= this.width - 2 || y <= 1 || y >= this.height - 2) continue;

        const dist = Math.hypot(dx / rx, dy / ry) + n.noise(x * 0.4, y * 0.4) * roughness;
        if (dist <= 1.0) {
          this.ground[y][x] = TILES.CAVE_FLOOR;
        }
      }
    }
  }

  // Aushöhlen eines Tunnels zwischen zwei Punkten
  carveTunnel(x1, y1, x2, y2, radius = 2.5) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(dist * 2);
    const n = this.noise;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const curX = x1 + (x2 - x1) * t + Math.sin(t * Math.PI) * (n.noise(s * 0.2, 5) * 4);
      const curY = y1 + (y2 - y1) * t + Math.cos(t * Math.PI) * (n.noise(s * 0.2, 10) * 4);

      for (let dy = -Math.ceil(radius) - 1; dy <= Math.ceil(radius) + 1; dy++) {
        for (let dx = -Math.ceil(radius) - 1; dx <= Math.ceil(radius) + 1; dx++) {
          const tx = Math.floor(curX + dx);
          const ty = Math.floor(curY + dy);
          if (!this.isValid(tx, ty) || tx <= 1 || tx >= this.width - 2 || ty <= 1 || ty >= this.height - 2) continue;

          if (Math.hypot(dx, dy) <= radius) {
            this.ground[ty][tx] = TILES.CAVE_FLOOR;
          }
        }
      }
    }
  }

  // Großes verzweigtes Höhlensystem (verbindet 3 Löcher: Grasland, Wüste, Sumpf)
  generateMainComplex() {
    // 1. Kammern
    // Eingang 1 (Grasland-Loch): Nordwesten
    const roomNW = { x: 16, y: 16, rx: 7, ry: 6 };
    this.carveRoom(roomNW.x, roomNW.y, roomNW.rx, roomNW.ry);

    // Eingang 2 (Wüsten-Loch): Südwesten
    const roomSW = { x: 20, y: 54, rx: 8, ry: 7 };
    this.carveRoom(roomSW.x, roomSW.y, roomSW.rx, roomSW.ry);

    // Eingang 3 (Sumpf-Loch): Südosten
    const roomSE = { x: 74, y: 52, rx: 8, ry: 7 };
    this.carveRoom(roomSE.x, roomSE.y, roomSE.rx, roomSE.ry);

    // Zentrale Tropfsteinhalle
    const roomCenter = { x: 44, y: 32, rx: 11, ry: 9 };
    this.carveRoom(roomCenter.x, roomCenter.y, roomCenter.rx, roomCenter.ry);

    // Unterirdischer See (Nordosten)
    const roomNE = { x: 68, y: 22, rx: 14, ry: 10 };
    this.carveRoom(roomNE.x, roomNE.y, roomNE.rx, roomNE.ry);

    // Unterhöhlen-Vorraum (Abgang zur Kristall-Unterhöhle)
    const roomSub = { x: 46, y: 56, rx: 6, ry: 5 };
    this.carveRoom(roomSub.x, roomSub.y, roomSub.rx, roomSub.ry);

    // 2. Tunnels verbinden
    this.carveTunnel(roomNW.x, roomNW.y, roomCenter.x, roomCenter.y, 2.8);
    this.carveTunnel(roomSW.x, roomSW.y, roomCenter.x, roomCenter.y, 2.8);
    this.carveTunnel(roomCenter.x, roomCenter.y, roomNE.x, roomNE.y, 3.2);
    this.carveTunnel(roomNE.x, roomNE.y, roomSE.x, roomSE.y, 2.8);
    this.carveTunnel(roomCenter.x, roomCenter.y, roomSub.x, roomSub.y, 2.5);
    this.carveTunnel(roomSW.x, roomSW.y, roomSub.x, roomSub.y, 2.5);

    // 3. Unterirdischer See in Raum NE füllen
    for (let dy = -6; dy <= 6; dy++) {
      for (let dx = -9; dx <= 9; dx++) {
        const x = roomNE.x + dx;
        const y = roomNE.y + dy;
        if (this.isValid(x, y) && this.ground[y][x] === TILES.CAVE_FLOOR) {
          if (Math.hypot(dx / 9, dy / 6) <= 0.82) {
            this.ground[y][x] = TILES.CAVE_WATER;
          }
        }
      }
    }
    // Trittstein-Inseln im See
    this.ground[roomNE.y][roomNE.x] = TILES.CAVE_FLOOR;
    this.ground[roomNE.y - 1][roomNE.x + 1] = TILES.CAVE_FLOOR;
    this.ground[roomNE.y + 1][roomNE.x - 2] = TILES.CAVE_FLOOR;

    // 4. Ausgänge zur Oberwelt platzieren
    // Ausgang 1: Grasland-Loch bei (12, 38)
    this.ground[roomNW.y][roomNW.x] = TILES.CAVE_HOLE_EXIT;
    this.exits.push({
      x: roomNW.x,
      y: roomNW.y,
      targetDim: 'overworld',
      targetX: 12,
      targetY: 38,
      label: 'Aufgang zum Grasland-Loch'
    });

    // Ausgang 2: Wüsten-Loch bei (38, 76)
    this.ground[roomSW.y][roomSW.x] = TILES.CAVE_HOLE_EXIT;
    this.exits.push({
      x: roomSW.x,
      y: roomSW.y,
      targetDim: 'overworld',
      targetX: 38,
      targetY: 76,
      label: 'Aufgang zum Wüsten-Trichter'
    });

    // Ausgang 3: Sumpf-Loch bei (82, 64)
    this.ground[roomSE.y][roomSE.x] = TILES.CAVE_HOLE_EXIT;
    this.exits.push({
      x: roomSE.x,
      y: roomSE.y,
      targetDim: 'overworld',
      targetX: 82,
      targetY: 64,
      label: 'Aufgang zur Sumpf-Kuhle'
    });

    // Abgang zur Kristall-Unterhöhle
    this.ground[roomSub.y][roomSub.x] = TILES.CAVE_LADDER_DOWN;
    this.exits.push({
      x: roomSub.x,
      y: roomSub.y,
      targetDim: 'sub_crystal',
      targetX: 18,
      targetY: 6,
      label: 'Abgang in die Kristall-Unterhöhle'
    });

    // 5. Dekorationen (Tropfsteine, Leuchtkristalle, Pilze)
    for (let y = 2; y < this.height - 2; y++) {
      for (let x = 2; x < this.width - 2; x++) {
        if (this.ground[y][x] === TILES.CAVE_FLOOR && this.ground[y][x] !== TILES.CAVE_HOLE_EXIT) {
          const hasWallNeighbor = (
            this.ground[y - 1][x] === TILES.CAVE_WALL ||
            this.ground[y + 1][x] === TILES.CAVE_WALL ||
            this.ground[y][x - 1] === TILES.CAVE_WALL ||
            this.ground[y][x + 1] === TILES.CAVE_WALL
          );

          const r = (x * 37 + y * 53) % 100;
          if (hasWallNeighbor) {
            if (r < 16) {
              this.objects[y][x] = OBJECTS.STALAGMITE;
            } else if (r < 25) {
              this.objects[y][x] = OBJECTS.GLOW_CRYSTAL;
            } else if (r < 34) {
              this.objects[y][x] = OBJECTS.CAVE_MUSHROOM_GLOW;
            } else if (r < 44) {
              this.objects[y][x] = OBJECTS.TORCH; // Cave corridor torches along walls!
            }
          } else {
            if (r === 99) {
              this.objects[y][x] = OBJECTS.CAVE_MUSHROOM_GLOW;
            }
          }
        }
      }
    }

    // Fackeln neben den Höhlenausgängen, Leitern und Schrein
    const placeTorchIfFloor = (tx, ty) => {
      if (this.isValid(tx, ty) && this.ground[ty][tx] === TILES.CAVE_FLOOR && this.objects[ty][tx] === OBJECTS.NONE) {
        this.objects[ty][tx] = OBJECTS.TORCH;
      }
    };

    placeTorchIfFloor(roomNW.x - 2, roomNW.y);
    placeTorchIfFloor(roomNW.x + 2, roomNW.y);
    placeTorchIfFloor(roomSW.x - 2, roomSW.y);
    placeTorchIfFloor(roomSW.x + 2, roomSW.y);
    placeTorchIfFloor(roomSE.x - 2, roomSE.y);
    placeTorchIfFloor(roomSE.x + 2, roomSE.y);
    placeTorchIfFloor(roomSub.x - 2, roomSub.y);
    placeTorchIfFloor(roomSub.x + 2, roomSub.y);

    // Seltene Schrein-Nische am Seeufer
    const shrineX = roomNE.x + 7;
    const shrineY = roomNE.y - 4;
    if (this.isValid(shrineX, shrineY) && this.ground[shrineY][shrineX] === TILES.CAVE_FLOOR) {
      this.objects[shrineY][shrineX] = OBJECTS.SHRINE;
      this.shrines.push({ x: shrineX, y: shrineY, name: 'Schrein des Tiefenwassers' });
      placeTorchIfFloor(shrineX - 2, shrineY);
      placeTorchIfFloor(shrineX + 2, shrineY);
    }
  }

  // Kristall-Unterhöhle (Unterhöhle mit seltenem Tiefenschrein)
  generateSubCrystal() {
    const cx = Math.floor(this.width / 2);
    const cy = Math.floor(this.height / 2);
    this.carveRoom(cx, cy, 12, 10, 0.2);

    // Aufgang zurück zur Haupthöhle
    const ladderX = 18;
    const ladderY = 6;
    this.ground[ladderY][ladderX] = TILES.CAVE_LADDER_UP;
    this.exits.push({
      x: ladderX,
      y: ladderY,
      targetDim: 'main_complex',
      targetX: 46,
      targetY: 57,
      label: 'Aufgang zur Haupthöhle'
    });

    // Ein kleiner Leuchtpool
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const px = cx + dx;
        const py = cy + 4 + dy;
        if (this.isValid(px, py) && Math.hypot(dx / 3, dy / 2) <= 0.85) {
          this.ground[py][px] = TILES.CAVE_WATER;
        }
      }
    }

    // Kristalle, Fackeln & Stalagmiten ringsum
    for (let y = 2; y < this.height - 2; y++) {
      for (let x = 2; x < this.width - 2; x++) {
        if (this.ground[y][x] === TILES.CAVE_FLOOR && !(x === ladderX && y === ladderY)) {
          const hash = (x * 47 + y * 71) % 50;
          if (hash < 6) {
            this.objects[y][x] = OBJECTS.GLOW_CRYSTAL;
          } else if (hash < 9) {
            this.objects[y][x] = OBJECTS.STALAGMITE;
          } else if (hash < 12) {
            this.objects[y][x] = OBJECTS.CAVE_MUSHROOM_GLOW;
          } else if (hash < 16) {
            this.objects[y][x] = OBJECTS.TORCH;
          }
        }
      }
    }

    // Fackeln neben Aufgangsleiter
    if (this.isValid(ladderX - 2, ladderY)) this.objects[ladderY][ladderX - 2] = OBJECTS.TORCH;
    if (this.isValid(ladderX + 2, ladderY)) this.objects[ladderY][ladderX + 2] = OBJECTS.TORCH;

    // Alter Geister-Schrein im Zentrum der Kristallkammer
    this.objects[cy - 2][cx] = OBJECTS.SHRINE;
    this.shrines.push({ x: cx, y: cy - 2, name: 'Schrein des Äther-Kristalls' });
    if (this.isValid(cx - 3, cy - 2)) this.objects[cy - 2][cx - 3] = OBJECTS.TORCH;
    if (this.isValid(cx + 3, cy - 2)) this.objects[cy - 2][cx + 3] = OBJECTS.TORCH;
  }

  // Kompakte Ein-Raum-Grotten
  generateSingleGrotto() {
    const cx = Math.floor(this.width / 2);
    const cy = Math.floor(this.height / 2);
    this.carveRoom(cx, cy, 7, 5, 0.15);

    // Ausgang zurück zur Oberwelt
    const exitX = cx;
    const exitY = cy + 4;
    this.ground[exitY][exitX] = TILES.CAVE_HOLE_EXIT;

    let targetX = 34, targetY = 12;
    let label = 'Aufgang zur Wald-Senke';
    let shrineName = 'Schrein des Verborgenen Mooses';

    if (this.id === 'snow_grotto') {
      targetX = 104; targetY = 16;
      label = 'Aufgang zur Eisspalte';
      shrineName = 'Schrein der Ewigen Kälte';
    } else if (this.id === 'void_grotto') {
      targetX = 118; targetY = 48;
      label = 'Aufgang zum Leeren-Riss';
      shrineName = 'Schrein der Astralen Stille';
    }

    this.exits.push({
      x: exitX,
      y: exitY,
      targetDim: 'overworld',
      targetX,
      targetY,
      label
    });

    // Fackeln neben dem Ausstiegsloch
    if (this.isValid(exitX - 2, exitY) && this.ground[exitY][exitX - 2] === TILES.CAVE_FLOOR) {
      this.objects[exitY][exitX - 2] = OBJECTS.TORCH;
    }
    if (this.isValid(exitX + 2, exitY) && this.ground[exitY][exitX + 2] === TILES.CAVE_FLOOR) {
      this.objects[exitY][exitX + 2] = OBJECTS.TORCH;
    }

    // Kleine biome-spezifische Wasser- / Kristall-Pfütze
    if (this.isValid(cx - 3, cy - 1)) this.ground[cy - 1][cx - 3] = TILES.CAVE_WATER;
    if (this.isValid(cx - 2, cy - 1)) this.ground[cy - 1][cx - 2] = TILES.CAVE_WATER;

    // Biomspezifische Dekorationen
    for (let y = 2; y < this.height - 2; y++) {
      for (let x = 2; x < this.width - 2; x++) {
        if (this.ground[y][x] === TILES.CAVE_FLOOR && !(x === exitX && y === exitY)) {
          const h = (x * 29 + y * 43) % 20;
          if (this.id === 'snow_grotto') {
            if (h === 1) this.objects[y][x] = OBJECTS.ROCK_ICE;
            if (h === 2 || h === 4) this.objects[y][x] = OBJECTS.GLOW_CRYSTAL;
          } else if (this.id === 'void_grotto') {
            if (h === 1) this.objects[y][x] = OBJECTS.ROCK_VOID;
            if (h === 2 || h === 4) this.objects[y][x] = OBJECTS.GLOW_CRYSTAL;
          } else {
            // forest_grotto
            if (h === 1) this.objects[y][x] = OBJECTS.STALAGMITE;
            if (h === 2) this.objects[y][x] = OBJECTS.FERN;
            if (h === 3 || h === 4) this.objects[y][x] = OBJECTS.CAVE_MUSHROOM_GLOW;
          }
        }
      }
    }

    // Schrein in der Grotte mit Fackeln
    const sX = cx;
    const sY = cy - 3;
    if (this.isValid(sX, sY) && this.ground[sY][sX] === TILES.CAVE_FLOOR) {
      this.objects[sY][sX] = OBJECTS.SHRINE;
      this.shrines.push({ x: sX, y: sY, name: shrineName });
      if (this.isValid(sX - 2, sY) && this.ground[sY][sX - 2] === TILES.CAVE_FLOOR) {
        this.objects[sY][sX - 2] = OBJECTS.TORCH;
      }
      if (this.isValid(sX + 2, sY) && this.ground[sY][sX + 2] === TILES.CAVE_FLOOR) {
        this.objects[sY][sX + 2] = OBJECTS.TORCH;
      }
    }
  }
}
