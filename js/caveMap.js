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
      if (y >= 120) return 'desert'; // Magma / Basalt / Glutkammer
      if (x >= 180) return 'void';   // Astraler Urleeren- & Frostschlund
      return 'crystal';              // Äther-Kristallgrotte
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
  // EBENE -1: HÖHLEN & GROTTEN (290x200) – 3 RIESIGE HÖHLENSYSTEME UNTER DER GESAMTEN KARTE
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

    // ==========================================================================================
    // 2. DIE 3 GROSSEN HÖHLENSYSTEME IN EBENE -1 (Spannen unter der gesamten Karte)
    // ==========================================================================================

    // KOMPLEX 1: MOOS- & URALT-STOLLEN (Nordwesten bis Zentrum)
    this.carveRoom(55, 48, 22, 16, 0.2);     // Westliche Mooshalle
    this.carveRoom(70, 72, 22, 16, 0.2);     // Grasland-Kaverne
    this.carveRoom(45, 32, 18, 14, 0.18);    // Spawn-Untergrund
    this.carveRoom(125, 75, 26, 18, 0.22);   // Große Seenhalle im Zentrum
    this.carveTunnel(45, 32, 55, 48, 4.8);
    this.carveTunnel(55, 48, 70, 72, 5.0);
    this.carveTunnel(70, 72, 125, 75, 5.0);
    this.carveTunnel(55, 48, 125, 75, 4.8);

    // Unterirdischer See mit Trittstein-Inseln in der Seenhalle (125, 75)
    const lakeCenter = { x: 125, y: 75 };
    for (let dy = -8; dy <= 8; dy++) {
      for (let dx = -13; dx <= 13; dx++) {
        const lx = lakeCenter.x + dx;
        const ly = lakeCenter.y + dy;
        if (this.isValid(lx, ly) && this.ground[ly][lx] === TILES.CAVE_FLOOR) {
          if (Math.hypot(dx / 13, dy / 8) <= 0.82) {
            this.ground[ly][lx] = TILES.CAVE_WATER;
          }
        }
      }
    }
    this.ground[lakeCenter.y][lakeCenter.x] = TILES.CAVE_FLOOR;
    this.ground[lakeCenter.y - 1][lakeCenter.x + 2] = TILES.CAVE_FLOOR;
    this.ground[lakeCenter.y + 1][lakeCenter.x - 3] = TILES.CAVE_FLOOR;
    this.ground[lakeCenter.y][lakeCenter.x + 6] = TILES.CAVE_FLOOR;
    this.ground[lakeCenter.y][lakeCenter.x - 6] = TILES.CAVE_FLOOR;

    // KOMPLEX 2: GLUT- & BASALT-CANYON (Südwesten bis Süden)
    this.carveRoom(75, 165, 26, 18, 0.25);   // Magma- & Basalthalle
    this.carveRoom(40, 155, 20, 15, 0.22);   // Dünen-Kluft
    this.carveRoom(95, 165, 22, 16, 0.22);   // Sandstein-Grotte
    this.carveRoom(175, 155, 24, 16, 0.22);  // Moor-Gewölbe
    this.carveRoom(215, 165, 20, 15, 0.2);   // Teerpfuhl-Kaverne
    this.carveTunnel(40, 155, 75, 165, 4.8);
    this.carveTunnel(75, 165, 95, 165, 5.0);
    this.carveTunnel(95, 165, 175, 155, 4.8);
    this.carveTunnel(175, 155, 215, 165, 4.8);

    // KOMPLEX 3: GLAZIALER STERNENABGRUND (Nordosten bis Osten)
    this.carveRoom(225, 50, 26, 18, 0.2);    // Großer Gletscher-Palast
    this.carveRoom(255, 36, 20, 15, 0.18);   // Nordkap-Eisdom
    this.carveRoom(195, 45, 22, 15, 0.2);    // Eispass-Halle
    this.carveRoom(245, 95, 24, 16, 0.22);   // Astraler Sternenschlund
    this.carveTunnel(195, 45, 225, 50, 4.8);
    this.carveTunnel(225, 50, 255, 36, 4.8);
    this.carveTunnel(225, 50, 245, 95, 4.8);

    // 3 GROSSE VERBINDUNGS-AUTOBAHNEN (Zwischen den 3 Komplexen)
    this.carveTunnel(70, 72, 75, 165, 4.5);   // Komplex 1 <-> Komplex 2 (Nordwest nach Südwest)
    this.carveTunnel(125, 75, 195, 45, 4.5);  // Komplex 1 <-> Komplex 3 (Zentrum nach Nordost)
    this.carveTunnel(175, 155, 245, 95, 4.5); // Komplex 2 <-> Komplex 3 (Süd nach Ost)

    // Alle 26 Oberwelt-Löcher mit großzügigen Räumen und Anbindungen versehen
    for (const ent of entrances) {
      this.carveRoom(ent.x, ent.y, 8, 7, 0.15);
      // Nächsten Komplexpunkt suchen und anbinden
      const hubs = [
        { x: 55, y: 48 }, { x: 70, y: 72 }, { x: 125, y: 75 },
        { x: 75, y: 165 }, { x: 95, y: 165 }, { x: 175, y: 155 },
        { x: 225, y: 50 }, { x: 195, y: 45 }, { x: 245, y: 95 }
      ];
      let closestHub = hubs[0];
      let minD = Infinity;
      for (const h of hubs) {
        const d = Math.hypot(ent.x - h.x, ent.y - h.y);
        if (d < minD) {
          minD = d;
          closestHub = h;
        }
      }
      this.carveTunnel(ent.x, ent.y, closestHub.x, closestHub.y, 3.8);
    }

    // ==========================================================================================
    // 3. GENAU DREI LEITERN NACH UNTEN (Zu den 3 Sanktuarien in Ebene -2)
    // ==========================================================================================
    const deepLadders = [
      { x: 65,  y: 55,  chamber: 'crystal_sanctuary', label: '⬇️ Leiter zur Äther-Kristallgrotte (Ebene -2)' },
      { x: 75,  y: 165, chamber: 'magma_sanctuary',   label: '⬇️ Leiter zur Magmakammer (Ebene -2)' },
      { x: 225, y: 50,  chamber: 'void_sanctuary',    label: '⬇️ Leiter zum Astralen Sternenschlund (Ebene -2)' }
    ];

    for (const dl of deepLadders) {
      this.carveRoom(dl.x, dl.y, 8, 7, 0.15);
    }

    // ==========================================================================================
    // 4. FÜNF SCHREINE IN EBENE -1
    // ==========================================================================================
    const shrinesL1 = [
      { x: 125, y: 64,  name: 'Schrein des Tiefenwassers' },
      { x: 45,  y: 44,  name: 'Schrein des Verborgenen Mooses' },
      { x: 82,  y: 176, name: 'Schrein der Sandstein-Tiefen' },
      { x: 235, y: 38,  name: 'Schrein der Ewigen Kälte' },
      { x: 252, y: 98,  name: 'Schrein der Astralen Stille' }
    ];

    for (const s of shrinesL1) {
      this.carveRoom(s.x, s.y, 7, 6, 0.15);
    }

    // ==========================================================================================
    // 5. OBJEKTE & EXITS EINPRÄGEN
    // ==========================================================================================
    // Lichtschächte zur Oberwelt
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

    // Leitern nach unten zu Ebene -2
    for (const dl of deepLadders) {
      this.ground[dl.y][dl.x] = TILES.CAVE_LADDER_DOWN;
      this.exits.push({
        x: dl.x,
        y: dl.y,
        targetDim: 'caves_l2',
        targetX: dl.x,
        targetY: dl.y,
        chamber: dl.chamber,
        label: dl.label
      });
      this.placeTorchIfFloor(dl.x - 2, dl.y);
      this.placeTorchIfFloor(dl.x + 2, dl.y);
    }

    // Schreine
    for (const s of shrinesL1) {
      this.ground[s.y][s.x] = TILES.CAVE_FLOOR;
      this.objects[s.y][s.x] = OBJECTS.SHRINE;
      this.shrines.push(s);
      this.placeTorchIfFloor(s.x - 2, s.y);
      this.placeTorchIfFloor(s.x + 2, s.y);
    }

    // Dekorationen
    this.decorateCaves();
  }

  // ---------------------------------------------------------------------------------------------------
  // EBENE -2: TIEFE SANCTUARIEN (290x200) – 3 Besondere kleine Höhlen mit jeweils einem Schrein
  // ---------------------------------------------------------------------------------------------------
  generateCavesL2() {
    // 1. SANKTUM 1: DIE ÄTHER-KRISTALLGROTTE (bei 65, 55)
    // Reached via Leiter 1 von (65, 55)
    this.carveRoom(65, 55, 12, 10, 0.12);
    // Biolumineszierender Kristallpool
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const px = 65 + dx;
        const py = 59 + dy;
        if (this.isValid(px, py) && Math.hypot(dx / 4, dy / 2) <= 0.8) {
          this.ground[py][px] = TILES.CAVE_WATER;
        }
      }
    }
    // Glühkristalle rund um das Sanktum
    const crystalSpots = [
      { x: 58, y: 52 }, { x: 72, y: 52 }, { x: 57, y: 57 }, { x: 73, y: 57 },
      { x: 61, y: 62 }, { x: 69, y: 62 }
    ];
    for (const cs of crystalSpots) {
      if (this.isValid(cs.x, cs.y) && this.ground[cs.y][cs.x] === TILES.CAVE_FLOOR) {
        this.objects[cs.y][cs.x] = OBJECTS.GLOW_CRYSTAL;
      }
    }

    // 2. SANKTUM 2: DIE MAGMA- & OBSIDIANKAMMER (bei 75, 165)
    // Reached via Leiter 2 von (75, 165)
    this.carveRoom(75, 165, 13, 11, 0.14);
    const magmaGlowSpots = [
      { x: 67, y: 161 }, { x: 83, y: 161 }, { x: 66, y: 168 }, { x: 84, y: 168 },
      { x: 71, y: 173 }, { x: 79, y: 173 }
    ];
    for (const ms of magmaGlowSpots) {
      if (this.isValid(ms.x, ms.y) && this.ground[ms.y][ms.x] === TILES.CAVE_FLOOR) {
        this.objects[ms.y][ms.x] = OBJECTS.GLOW_CRYSTAL;
      }
    }

    // 3. SANKTUM 3: DER ASTRALE URLEEREN-SCHLUND (bei 225, 50)
    // Reached via Leiter 3 von (225, 50)
    this.carveRoom(225, 50, 13, 11, 0.14);
    const voidGlowSpots = [
      { x: 217, y: 46 }, { x: 233, y: 46 }, { x: 216, y: 54 }, { x: 234, y: 54 },
      { x: 221, y: 58 }, { x: 229, y: 58 }
    ];
    for (const vs of voidGlowSpots) {
      if (this.isValid(vs.x, vs.y) && this.ground[vs.y][vs.x] === TILES.CAVE_FLOOR) {
        this.objects[vs.y][vs.x] = OBJECTS.GLOW_CRYSTAL;
      }
    }

    // ==========================================================================================
    // DIE DREI URALTEN TIEFENSCHREINE IN EBENE -2 (Ein Schrein in jeder besonderen Grotte!)
    // ==========================================================================================
    const shrinesL2 = [
      { x: 65,  y: 50,  name: 'Schrein des Äther-Kristalls' },
      { x: 75,  y: 159, name: 'Schrein der Magma-Urkraft' },
      { x: 225, y: 44,  name: 'Schrein des Tiefsten Vergessens' }
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

    // ==========================================================================================
    // DIE DREI LEITERN NACH OBEN (Exakt korrespondierend zu Ebene -1)
    // ==========================================================================================
    const upLadders = [
      { x: 65,  y: 55,  chamber: 'crystal_sanctuary', label: '⬆️ Leiter zum Moos-Stollen (Ebene -1)' },
      { x: 75,  y: 165, chamber: 'magma_sanctuary',   label: '⬆️ Leiter zum Basalt-Canyon (Ebene -1)' },
      { x: 225, y: 50,  chamber: 'void_sanctuary',    label: '⬆️ Leiter zum Gletscher-Palast (Ebene -1)' }
    ];

    for (const ul of upLadders) {
      this.ground[ul.y][ul.x] = TILES.CAVE_LADDER_UP;
      this.exits.push({
        x: ul.x,
        y: ul.y,
        targetDim: 'caves_l1',
        targetX: ul.x,
        targetY: ul.y,
        chamber: ul.chamber,
        label: ul.label
      });
      this.placeTorchIfFloor(ul.x - 2, ul.y);
      this.placeTorchIfFloor(ul.x + 2, ul.y);
    }

    // Tiefen-Dekoration (leuchtende Pilze & Fackeln nur in den 3 Sanktuarien)
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
