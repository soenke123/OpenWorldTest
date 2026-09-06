import { TILES, OBJECTS, BIOMES, TILE_SIZE, ELEVATION, RAMPS, MAP_WIDTH, MAP_HEIGHT } from './constants.js';
import { Noise2D } from './noise.js';

export class CaveMap {
  constructor(id = 'caves_l1', overworldMap = null) {
    this.id = id;
    this.overworldMap = overworldMap;
    this.noise = new Noise2D(id === 'caves_l2' || id === 'sub_crystal' ? 9931 : 8819);

    if (id === 'caves_l1' || id === 'main_complex') {
      this.width = MAP_WIDTH;   // 290
      this.height = MAP_HEIGHT; // 200
      this.name = 'Höhlen & Grotten (Ebene -1)';
      this.biome = BIOMES.CAVES_L1 || 'Höhlen & Grotten (Ebene -1)';
    } else if (id === 'caves_l2' || id === 'sub_crystal') {
      this.width = MAP_WIDTH;   // 290
      this.height = MAP_HEIGHT; // 200
      this.name = 'Tiefe Kristall- & Magmahöhlen (Ebene -2)';
      this.biome = BIOMES.CAVES_L2 || 'Tiefe Kristall- & Magmahöhlen (Ebene -2)';
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
    this.exits = []; // { x, y, targetDim, targetX, targetY, label, chamber }
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
    if (this.id === 'caves_l1' || this.id === 'main_complex') {
      if (x < 115 && y < 100) return 'forest';
      if (x < 115 && y >= 100) return 'desert';
      if (x >= 165 && y < 90) return 'snow';
      if (x >= 155 && y >= 95) return 'swamp';
      if (x >= 210 && y >= 65 && y <= 135) return 'void';
      return 'crystal';
    }
    if (this.id === 'caves_l2' || this.id === 'sub_crystal') {
      if (y >= 125) return 'desert'; // Magma / Basalt / Fels
      if (x < 110 && y < 125) return 'forest'; // Deep moss catacomb
      if (x >= 170 && y < 100) return 'snow'; // Frozen glacial abyss
      if (x >= 210 && y >= 70 && y <= 130) return 'void'; // Deep void chasm
      return 'crystal'; // Äther-crystal palace
    }
    if (this.id === 'snow_grotto') return 'snow';
    if (this.id === 'void_grotto') return 'void';
    if (this.id === 'forest_grotto') return 'forest';
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

  findSafeLandingFloor(preferredX, preferredY, maxRadius = 25) {
    const isSafe = (tx, ty) => {
      if (!this.isValid(tx, ty)) return false;
      const g = this.ground[ty][tx];
      if (g !== TILES.CAVE_FLOOR && g !== TILES.CAVE_HOLE_EXIT && g !== TILES.CAVE_LADDER_UP && g !== TILES.CAVE_LADDER_DOWN) {
        return false;
      }
      if (this.isSolid(tx, ty)) return false;
      const obj = this.objects[ty][tx];
      if (obj !== OBJECTS.NONE && obj !== OBJECTS.CAVE_HOLE_EXIT && obj !== OBJECTS.CAVE_LADDER_UP && obj !== OBJECTS.CAVE_LADDER_DOWN) {
        return false;
      }
      return true;
    };

    const px = Math.round(preferredX);
    const py = Math.round(preferredY);
    if (isSafe(px, py)) {
      return { x: px, y: py };
    }

    for (let r = 1; r <= maxRadius; r++) {
      let best = null;
      let minD = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = px + dx;
          const ty = py + dy;
          if (isSafe(tx, ty)) {
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

    // Fallback: search whole cave
    for (let y = 2; y < this.height - 2; y++) {
      for (let x = 2; x < this.width - 2; x++) {
        if (isSafe(x, y)) {
          return { x, y };
        }
      }
    }

    return { x: px, y: py };
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

    if (this.id === 'caves_l1' || this.id === 'main_complex') {
      this.generateCavesL1();
    } else if (this.id === 'caves_l2' || this.id === 'sub_crystal') {
      this.generateCavesL2();
    } else {
      this.generateSingleGrotto();
    }
  }

  // Aushöhlen eines Raumes
  carveRoom(cx, cy, rx, ry, roughness = 0.25) {
    const n = this.noise;
    for (let dy = -ry - 1; dy <= ry + 1; dy++) {
      for (let dx = -rx - 1; dx <= rx + 1; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (!this.isValid(x, y) || x <= 1 || x >= this.width - 2 || y <= 1 || y >= this.height - 2) continue;

        const dist = Math.hypot(dx / rx, dy / ry) + n.noise(x * 0.35, y * 0.35) * roughness;
        if (dist <= 1.0) {
          this.ground[y][x] = TILES.CAVE_FLOOR;
        }
      }
    }
  }

  // Aushöhlen eines geschwungenen Tunnels zwischen zwei Punkten
  carveTunnel(x1, y1, x2, y2, radius = 2.8) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(dist * 2.2);
    const n = this.noise;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const curX = x1 + (x2 - x1) * t + Math.sin(t * Math.PI) * (n.noise(s * 0.15, 7) * 5);
      const curY = y1 + (y2 - y1) * t + Math.cos(t * Math.PI) * (n.noise(s * 0.15, 13) * 5);

      const rad = radius + n.noise(curX * 0.2, curY * 0.2) * 0.6;
      const ceilR = Math.ceil(rad) + 1;

      for (let dy = -ceilR; dy <= ceilR; dy++) {
        for (let dx = -ceilR; dx <= ceilR; dx++) {
          const tx = Math.floor(curX + dx);
          const ty = Math.floor(curY + dy);
          if (!this.isValid(tx, ty) || tx <= 1 || tx >= this.width - 2 || ty <= 1 || ty >= this.height - 2) continue;

          if (Math.hypot(dx, dy) <= rad) {
            this.ground[ty][tx] = TILES.CAVE_FLOOR;
          }
        }
      }
    }
  }

  placeTorchIfFloor(tx, ty) {
    if (this.isValid(tx, ty) && this.ground[ty][tx] === TILES.CAVE_FLOOR && this.objects[ty][tx] === OBJECTS.NONE) {
      this.objects[ty][tx] = OBJECTS.TORCH;
    }
  }

  // ---------------------------------------------------------------------------------------------------
  // EBENE -1: HÖHLEN & GROTTEN (290x200) – Direkt von der Oberwelt erreichbar
  // ---------------------------------------------------------------------------------------------------
  generateCavesL1() {
    // 1. Hole-Entrances sammeln
    let entrances = [];
    if (this.overworldMap && Array.isArray(this.overworldMap.holeEntrances) && this.overworldMap.holeEntrances.length > 0) {
      entrances = this.overworldMap.holeEntrances;
    } else {
      entrances = [
        // West & Spawn (Grasland & Vorwälder)
        { x: 70, y: 72, chamber: 'grasland', name: 'Grasland-Kluft' },
        { x: 52, y: 32, chamber: 'forest_grotto', name: 'Mooswald-Loch' },
        { x: 35, y: 60, chamber: 'forest_grotto', name: 'Alteiche-Schacht' },
        { x: 81, y: 36, chamber: 'grasland', name: 'Nordwest-Stollen' },
        { x: 48, y: 31, chamber: 'grasland', name: 'Spawn-Gipfelspalte' },
        { x: 16, y: 69, chamber: 'grasland', name: 'Lichtungsschacht' },
        // Wüste & Canyon (Südwesten)
        { x: 70, y: 168, chamber: 'desert', name: 'Wüsten-Trichter' },
        { x: 41, y: 148, chamber: 'desert', name: 'Dünen-Erdloch' },
        { x: 93, y: 156, chamber: 'desert', name: 'Sandstein-Riss' },
        { x: 29, y: 172, chamber: 'desert', name: 'Oasen-Senke' },
        { x: 64, y: 188, chamber: 'desert', name: 'Südwest-Schlucht' },
        // Schnee & Eislande (Nordosten)
        { x: 226, y: 32, chamber: 'snow_grotto', name: 'Schnee-Eisspalte' },
        { x: 249, y: 48, chamber: 'snow_grotto', name: 'Gletscher-Höhle' },
        { x: 197, y: 44, chamber: 'snow', name: 'Eispass-Stollen' },
        { x: 215, y: 64, chamber: 'snow', name: 'Frostkamm-Einsturz' },
        { x: 267, y: 28, chamber: 'snow_grotto', name: 'Nordkap-Kluft' },
        // Sumpf & Moor (Südosten)
        { x: 191, y: 144, chamber: 'swamp', name: 'Sumpf-Kuhle' },
        { x: 209, y: 160, chamber: 'swamp', name: 'Schilf-Trichter' },
        { x: 168, y: 152, chamber: 'swamp', name: 'Moorloch' },
        { x: 232, y: 176, chamber: 'swamp', name: 'Teerpfuhl-Grotte' },
        // Void-Zone (Osten)
        { x: 243, y: 106, chamber: 'void_grotto', name: 'Leeren-Riss' },
        { x: 257, y: 94, chamber: 'void_grotto', name: 'Schatten-Schlund' },
        // Zentrales Tal
        { x: 133, y: 68, chamber: 'center', name: 'Flusstal-Klamm' },
        { x: 162, y: 80, chamber: 'center', name: 'Seeterrassen-Schacht' },
        { x: 238, y: 92, chamber: 'center', name: 'Ostplateau-Grotte' },
        { x: 116, y: 136, chamber: 'center', name: 'Südübergang-Höhle' }
      ];
    }

    // 2. Kammern um jeden Höhleneingang aushöhlen
    for (const ent of entrances) {
      this.carveRoom(ent.x, ent.y, 6, 5, 0.2);
    }

    // 3. Regionale Hubs miteinander durch Tunnel vernetzen
    for (let i = 0; i < entrances.length; i++) {
      let nearestDist = Infinity;
      let nearestIdx = -1;
      for (let j = 0; j < entrances.length; j++) {
        if (i === j) continue;
        const d = Math.hypot(entrances[i].x - entrances[j].x, entrances[i].y - entrances[j].y);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = j;
        }
      }
      if (nearestIdx !== -1 && nearestDist <= 48) {
        this.carveTunnel(entrances[i].x, entrances[i].y, entrances[nearestIdx].x, entrances[nearestIdx].y, 2.7);
      }
    }

    // 4. Zentraler Unterirdischer See (Große Halle bei 145, 85)
    const lakeCenter = { x: 145, y: 85 };
    this.carveRoom(lakeCenter.x, lakeCenter.y, 22, 15, 0.22);

    // Unterirdischen See füllen mit Inseln
    for (let dy = -9; dy <= 9; dy++) {
      for (let dx = -14; dx <= 14; dx++) {
        const lx = lakeCenter.x + dx;
        const ly = lakeCenter.y + dy;
        if (this.isValid(lx, ly) && this.ground[ly][lx] === TILES.CAVE_FLOOR) {
          if (Math.hypot(dx / 14, dy / 9) <= 0.82) {
            this.ground[ly][lx] = TILES.CAVE_WATER;
          }
        }
      }
    }
    // Trittstein-Inseln im See
    this.ground[lakeCenter.y][lakeCenter.x] = TILES.CAVE_FLOOR;
    this.ground[lakeCenter.y - 1][lakeCenter.x + 2] = TILES.CAVE_FLOOR;
    this.ground[lakeCenter.y + 1][lakeCenter.x - 3] = TILES.CAVE_FLOOR;
    this.ground[lakeCenter.y][lakeCenter.x + 6] = TILES.CAVE_FLOOR;
    this.ground[lakeCenter.y][lakeCenter.x - 6] = TILES.CAVE_FLOOR;

    // 5. Haupt-Tunnel von allen 5 Regionen zum Zentralen See
    this.carveTunnel(70, 72, lakeCenter.x, lakeCenter.y, 3.2);       // Grasland -> See
    this.carveTunnel(70, 168, lakeCenter.x, lakeCenter.y, 3.2);      // Wüste -> See
    this.carveTunnel(197, 44, lakeCenter.x, lakeCenter.y, 3.2);      // Schnee -> See
    this.carveTunnel(191, 144, lakeCenter.x, lakeCenter.y, 3.2);     // Sumpf -> See
    this.carveTunnel(243, 106, lakeCenter.x, lakeCenter.y, 3.0);     // Void -> See
    this.carveTunnel(93, 156, 168, 152, 2.8);                       // Süd-Bypass (Wüste <-> Sumpf)

    // 6. Fünf Abgänge zu Ebene -2 (Tiefe Höhlenwelt) mit Leitern nach unten
    const deepLadders = [
      { x: 145, y: 105, label: 'Abstieg zur Äther-Kristall-Kammer (Ebene -2)' },
      { x: 55,  y: 48,  label: 'Abstieg in die Moos-Katakomben (Ebene -2)' },
      { x: 65,  y: 165, label: 'Abstieg in die Magma-Kluft (Ebene -2)' },
      { x: 220, y: 45,  label: 'Abstieg in den Frostpalast-Schacht (Ebene -2)' },
      { x: 200, y: 155, label: 'Abstieg in die Tiefensumpf-Krypta (Ebene -2)' }
    ];

    for (const dl of deepLadders) {
      this.carveRoom(dl.x, dl.y, 6, 5, 0.2);
    }

    // 7. Fünf Schreine in Ebene -1 (Thematisch über die Biome verteilt)
    const shrinesL1 = [
      { x: 145, y: 73,  name: 'Schrein des Tiefenwassers' },
      { x: 50,  y: 40,  name: 'Schrein des Verborgenen Mooses' },
      { x: 75,  y: 175, name: 'Schrein der Sandstein-Tiefen' },
      { x: 235, y: 35,  name: 'Schrein der Ewigen Kälte' },
      { x: 255, y: 95,  name: 'Schrein der Astralen Stille' }
    ];

    for (const s of shrinesL1) {
      this.carveRoom(s.x, s.y, 6, 5, 0.15);
    }

    // 8. JETZT nach allen Tunnelaushöhlungen die Lichtschächte & Exits einprägen (verhindert Überschreiben)
    for (const ent of entrances) {
      this.ground[ent.y][ent.x] = TILES.CAVE_HOLE_EXIT;
      this.exits.push({
        x: ent.x,
        y: ent.y,
        targetDim: 'overworld',
        targetX: ent.x,
        targetY: ent.y,
        chamber: ent.chamber || 'cave',
        label: ent.name || 'Aufgang zur Oberwelt'
      });
      this.placeTorchIfFloor(ent.x - 2, ent.y);
      this.placeTorchIfFloor(ent.x + 2, ent.y);
    }

    for (const dl of deepLadders) {
      this.ground[dl.y][dl.x] = TILES.CAVE_LADDER_DOWN;
      this.exits.push({
        x: dl.x,
        y: dl.y,
        targetDim: 'caves_l2',
        targetX: dl.x,
        targetY: dl.y,
        chamber: 'deep_caves',
        label: dl.label
      });
      this.placeTorchIfFloor(dl.x - 2, dl.y);
      this.placeTorchIfFloor(dl.x + 2, dl.y);
    }

    for (const s of shrinesL1) {
      this.ground[s.y][s.x] = TILES.CAVE_FLOOR;
      this.objects[s.y][s.x] = OBJECTS.SHRINE;
      this.shrines.push(s);
      this.placeTorchIfFloor(s.x - 2, s.y);
      this.placeTorchIfFloor(s.x + 2, s.y);
    }

    // 9. Dekorationen (Tropfsteine, Kristalle, Leuchtpilze, Wandfackeln)
    this.decorateCaves();
  }

  // ---------------------------------------------------------------------------------------------------
  // EBENE -2: TIEFE KRISTALL- & MAGMAHÖHLEN (290x200) – Unterhalb von Ebene -1
  // ---------------------------------------------------------------------------------------------------
  generateCavesL2() {
    // 1. Die fünf Aufstiegsleitern zu Ebene -1 (exakt identische Koordinaten)
    const upLadders = [
      { x: 145, y: 105, label: 'Aufgang zur Haupthalle (Ebene -1)' },
      { x: 55,  y: 48,  label: 'Aufgang zu den Moosgrotten (Ebene -1)' },
      { x: 65,  y: 165, label: 'Aufgang zur Sandstein-Kluft (Ebene -1)' },
      { x: 220, y: 45,  label: 'Aufgang zum Froststollen (Ebene -1)' },
      { x: 200, y: 155, label: 'Aufgang zur Moor-Kuhle (Ebene -1)' }
    ];

    for (const ul of upLadders) {
      this.carveRoom(ul.x, ul.y, 7, 5, 0.2);
    }

    // 2. Große Kristall-Zentralkammer (Äther-Kristallpalast)
    const crystalPalace = { x: 145, y: 88 };
    this.carveRoom(crystalPalace.x, crystalPalace.y, 24, 16, 0.18);

    // Biolumineszierender Kristallpool im Zentrum
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -7; dx <= 7; dx++) {
        const px = crystalPalace.x + dx;
        const py = crystalPalace.y + 4 + dy;
        if (this.isValid(px, py) && Math.hypot(dx / 7, dy / 4) <= 0.85) {
          this.ground[py][px] = TILES.CAVE_WATER;
        }
      }
    }

    // 3. Südwestliche Magma- und Obsidianhallen
    const magmaChamber = { x: 72, y: 170 };
    this.carveRoom(magmaChamber.x, magmaChamber.y, 18, 13, 0.25);

    // 4. Nordöstliche Glaziale Abgrund-Kammer
    const frostAbyss = { x: 225, y: 45 };
    this.carveRoom(frostAbyss.x, frostAbyss.y, 17, 12, 0.2);

    // 5. Südöstliche Versunkene Krypta
    const sunkenCrypt = { x: 195, y: 160 };
    this.carveRoom(sunkenCrypt.x, sunkenCrypt.y, 16, 12, 0.2);

    // 6. Östliche Astrale Urleeren-Kluft
    const voidAbyss = { x: 245, y: 95 };
    this.carveRoom(voidAbyss.x, voidAbyss.y, 18, 13, 0.22);

    // 7. Wandelgänge & tiefe Tunnel zwischen den Großhallen
    this.carveTunnel(55, 48, crystalPalace.x, crystalPalace.y, 2.9);
    this.carveTunnel(65, 165, magmaChamber.x, magmaChamber.y, 3.0);
    this.carveTunnel(magmaChamber.x, magmaChamber.y, crystalPalace.x, crystalPalace.y, 3.0);
    this.carveTunnel(frostAbyss.x, frostAbyss.y, crystalPalace.x, crystalPalace.y, 2.9);
    this.carveTunnel(sunkenCrypt.x, sunkenCrypt.y, crystalPalace.x, crystalPalace.y, 2.9);
    this.carveTunnel(voidAbyss.x, voidAbyss.y, crystalPalace.x, crystalPalace.y, 3.0);
    this.carveTunnel(magmaChamber.x, magmaChamber.y, sunkenCrypt.x, sunkenCrypt.y, 2.7);

    // 8. Drei Uralte Tiefenschreine in Ebene -2
    const shrinesL2 = [
      { x: crystalPalace.x, y: crystalPalace.y - 8, name: 'Schrein des Äther-Kristalls' },
      { x: magmaChamber.x + 4, y: magmaChamber.y,    name: 'Schrein der Magma-Urkraft' },
      { x: voidAbyss.x + 3,    y: voidAbyss.y - 1,   name: 'Schrein des Tiefsten Vergessens' }
    ];

    for (const s of shrinesL2) {
      if (this.isValid(s.x, s.y)) {
        this.ground[s.y][s.x] = TILES.CAVE_FLOOR;
        this.objects[s.y][s.x] = OBJECTS.SHRINE;
        this.shrines.push(s);
        this.placeTorchIfFloor(s.x - 2, s.y);
        this.placeTorchIfFloor(s.x + 2, s.y);
      }
    }

    // 9. JETZT nach allen Tunneln die Leitern nach oben zu Ebene -1 einprägen
    for (const ul of upLadders) {
      this.ground[ul.y][ul.x] = TILES.CAVE_LADDER_UP;
      this.exits.push({
        x: ul.x,
        y: ul.y,
        targetDim: 'caves_l1',
        targetX: ul.x,
        targetY: ul.y,
        chamber: 'upper_caves',
        label: ul.label
      });
      this.placeTorchIfFloor(ul.x - 2, ul.y);
      this.placeTorchIfFloor(ul.x + 2, ul.y);
    }

    // 10. Tiefen-Dekoration
    this.decorateCaves(true);
  }

  // ---------------------------------------------------------------------------------------------------
  // DEKORATION (Tropfsteine, Kristalle, Leuchtpilze, Wandfackeln)
  // ---------------------------------------------------------------------------------------------------
  decorateCaves(isDeep = false) {
    for (let y = 2; y < this.height - 2; y++) {
      for (let x = 2; x < this.width - 2; x++) {
        if (this.ground[y][x] === TILES.CAVE_FLOOR && this.objects[y][x] === OBJECTS.NONE) {
          const hasWallNeighbor = (
            this.ground[y - 1][x] === TILES.CAVE_WALL ||
            this.ground[y + 1][x] === TILES.CAVE_WALL ||
            this.ground[y][x - 1] === TILES.CAVE_WALL ||
            this.ground[y][x + 1] === TILES.CAVE_WALL
          );

          const r = (x * 37 + y * 53) % 100;
          const theme = this.getTheme(x, y);

          if (hasWallNeighbor) {
            if (r < (isDeep ? 22 : 14)) {
              this.objects[y][x] = (theme === 'snow') ? OBJECTS.ROCK_ICE : OBJECTS.STALAGMITE;
            } else if (r < (isDeep ? 38 : 24)) {
              this.objects[y][x] = OBJECTS.GLOW_CRYSTAL;
            } else if (r < 32 && !isDeep) {
              this.objects[y][x] = OBJECTS.CAVE_MUSHROOM_GLOW;
            } else if (r < (isDeep ? 46 : 38)) {
              this.objects[y][x] = OBJECTS.TORCH;
            }
          } else {
            if (r === 99) {
              this.objects[y][x] = OBJECTS.CAVE_MUSHROOM_GLOW;
            } else if (isDeep && r === 98) {
              this.objects[y][x] = OBJECTS.GLOW_CRYSTAL;
            }
          }
        }
      }
    }
  }

  // Fallback für isolierte Test-Grotten
  generateSingleGrotto() {
    const cx = Math.floor(this.width / 2);
    const cy = Math.floor(this.height / 2);
    this.carveRoom(cx, cy, 7, 5, 0.15);

    const exitX = cx;
    const exitY = cy + 4;
    this.ground[exitY][exitX] = TILES.CAVE_HOLE_EXIT;
    this.exits.push({
      x: exitX,
      y: exitY,
      targetDim: 'overworld',
      targetX: 52,
      targetY: 32,
      chamber: 'single_grotto',
      label: 'Aufgang zur Oberwelt'
    });
    this.placeTorchIfFloor(exitX - 2, exitY);
    this.placeTorchIfFloor(exitX + 2, exitY);
  }
}
