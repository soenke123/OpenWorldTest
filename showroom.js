import { BestiaryManager } from './bestiary.js';

/**
 * Welt-Design Showroom Engine
 * 5 distinct visual styles & render pipelines for the world.
 */

// ============================================================================
// 1. DETERMINISTIC NOISE & WORLD GENERATOR (Shared by all 5 styles)
// ============================================================================
class SimplexNoise {
  constructor(seed = 4242) {
    this.p = new Uint8Array(512);
    let s = seed;
    for (let i = 0; i < 256; i++) {
      s = (s * 16807) % 2147483647;
      this.p[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const temp = this.p[i];
      this.p[i] = this.p[j];
      this.p[j] = temp;
    }
    for (let i = 0; i < 256; i++) {
      this.p[256 + i] = this.p[i];
    }
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t, a, b) { return a + t * (b - a); }
  grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this.fade(xf);
    const v = this.fade(yf);
    const A = this.p[X] + Y;
    const B = this.p[X + 1] + Y;
    return this.lerp(
      v,
      this.lerp(u, this.grad(this.p[A], xf, yf), this.grad(this.p[B], xf - 1, yf)),
      this.lerp(u, this.grad(this.p[A + 1], xf, yf - 1), this.grad(this.p[B + 1], xf - 1, yf - 1))
    );
  }

  fbm(x, y, octaves = 3, persistence = 0.5) {
    let total = 0, freq = 1, amp = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * freq, y * freq) * amp;
      max += amp;
      amp *= persistence;
      freq *= 2;
    }
    return total / max;
  }
}

const TILE = {
  GRASS: 1,
  DIRT: 2,
  SAND: 3,
  SNOW: 4,
  SWAMP: 5,
  VOID: 6,
  WATER: 10,
  SWAMP_WATER: 11,
  QUICKSAND: 12,
  VOID_LAKE: 13,
  BRIDGE: 14
};

const OBJ = {
  NONE: 0,
  TREE: 1,
  ROCK: 2,
  BUSH: 3,
  FLOWER: 4,
  CACTUS: 5,
  MUSHROOM: 6
};

class ShowroomWorld {
  constructor(width = 110, height = 80) {
    this.width = width;
    this.height = height;
    this.noise = new SimplexNoise(7712);

    this.tiles = [];
    this.objects = [];
    this.heights = []; // Elevation for isometric view
    this.trees = [];

    this.init();
  }

  init() {
    const n = this.noise;
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = new Uint8Array(this.width);
      this.objects[y] = new Uint8Array(this.width);
      this.heights[y] = new Float32Array(this.width);
    }

    // 1. Biome Assignment with smooth organic domain warping
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const wx = x + n.fbm(x * 0.05, y * 0.05, 3) * 10;
        const wy = y + n.fbm((x + 40) * 0.05, (y + 40) * 0.05, 3) * 10;
        const nx = wx / this.width;
        const ny = wy / this.height;

        let t = TILE.GRASS;
        let h = 1.0; // Base elevation

        if (nx > 0.54 && ny < 0.45) {
          t = TILE.SNOW;
          h = 2.0; // Mountain plateau
        } else if (nx < 0.44 && ny > 0.50) {
          t = TILE.SAND;
          h = 0.8;
        } else if (nx > 0.72 && ny > 0.38) {
          t = TILE.VOID;
          h = 0.4; // Void plateau
        } else if (nx > 0.44 && ny > 0.48) {
          t = TILE.SWAMP;
          h = 0.6;
        }

        this.tiles[y][x] = t;
        this.heights[y][x] = h;
      }
    }

    // 2. Winding River
    for (let y = 0; y < this.height; y++) {
      const riverCenter = 40 + Math.sin(y * 0.09) * 7 + n.noise(y * 0.06, 12) * 8;
      const riverWidth = 3.2 + Math.sin(y * 0.16) * 1.2;
      for (let x = 0; x < this.width; x++) {
        const dist = Math.abs(x - riverCenter);
        if (dist < riverWidth) {
          if (this.tiles[y][x] === TILE.SWAMP) {
            this.tiles[y][x] = TILE.SWAMP_WATER;
          } else if (this.tiles[y][x] !== TILE.VOID) {
            this.tiles[y][x] = TILE.WATER;
          }
          this.heights[y][x] = 0.0; // Sunken riverbed
        }
      }
    }

    // 3. Bridges
    for (let x = 32; x <= 48; x++) {
      if (this.tiles[42][x] === TILE.WATER) {
        this.tiles[42][x] = TILE.BRIDGE;
        this.tiles[41][x] = TILE.BRIDGE;
        this.heights[42][x] = 1.0;
        this.heights[41][x] = 1.0;
      }
    }

    // 4. Lakes & Special Zones
    this.createBlob(78, 22, 8, TILE.WATER, 0.0);       // Snow lake
    this.createBlob(26, 64, 7, TILE.QUICKSAND, 0.4);   // Desert quicksand
    this.createBlob(68, 62, 6, TILE.SWAMP_WATER, 0.2); // Swamp lake
    this.createBlob(94, 56, 8, TILE.VOID_LAKE, -0.5);  // Void abyss

    // 5. Dirt paths & clearings
    for (let i = 0; i < 40; i++) {
      const px = Math.round(28 + i * 0.4 + Math.sin(i * 0.2) * 2);
      const py = Math.round(42 + Math.sin(i * 0.15) * 3);
      if (this.inBounds(px, py) && this.tiles[py][px] === TILE.GRASS) {
        this.tiles[py][px] = TILE.DIRT;
      }
    }

    // 6. Trees & Vegetation Placement
    for (let y = 3; y < this.height - 3; y += 3) {
      for (let x = 3; x < this.width - 3; x += 3) {
        const jx = x + Math.round(n.noise(x * 1.5, y * 1.5) * 1.4);
        const jy = y + Math.round(n.noise(x * 2.5, y * 2.5) * 1.4);
        if (!this.inBounds(jx, jy)) continue;
        const t = this.tiles[jy][jx];
        if (t === TILE.WATER || t === TILE.SWAMP_WATER || t === TILE.VOID_LAKE || t === TILE.BRIDGE || t === TILE.QUICKSAND) continue;

        const val = n.fbm(jx * 0.15, jy * 0.15, 2);
        if (val > 0.08) {
          this.objects[jy][jx] = OBJ.TREE;
          this.trees.push({ x: jx * 16 + 8, y: jy * 16 + 12, tileX: jx, tileY: jy, biome: t });
        } else if (val < -0.3) {
          if (t === TILE.SAND) {
            this.objects[jy][jx] = OBJ.CACTUS;
          } else if (t === TILE.GRASS) {
            this.objects[jy][jx] = n.noise(jx * 3, jy * 3) > 0 ? OBJ.FLOWER : OBJ.BUSH;
          } else if (t === TILE.SWAMP) {
            this.objects[jy][jx] = OBJ.MUSHROOM;
          } else {
            this.objects[jy][jx] = OBJ.ROCK;
          }
        }
      }
    }
  }

  createBlob(cx, cy, r, tileType, elevation) {
    for (let y = cy - r - 2; y <= cy + r + 2; y++) {
      for (let x = cx - r - 2; x <= cx + r + 2; x++) {
        if (!this.inBounds(x, y)) continue;
        const d = Math.hypot(x - cx, y - cy);
        const shape = r + this.noise.noise(x * 0.35, y * 0.35) * (r * 0.4);
        if (d < shape) {
          this.tiles[y][x] = tileType;
          this.heights[y][x] = elevation;
        }
      }
    }
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getTile(x, y) {
    if (!this.inBounds(x, y)) return TILE.VOID_LAKE;
    return this.tiles[y][x];
  }

  isSolid(x, y) {
    if (!this.inBounds(x, y)) return true;
    const t = this.tiles[y][x];
    if (t === TILE.WATER || t === TILE.SWAMP_WATER) return true;
    const obj = this.objects[y][x];
    if (obj === OBJ.ROCK || obj === OBJ.CACTUS) return true;
    return false;
  }
}

// ============================================================================
// 2. THE 5 VISUAL STYLE SPECIFICATIONS & RENDER PIPELINES
// ============================================================================
const STYLE_META = {
  retro: {
    name: '16-Bit Retro Nostalgie',
    badge: 'Classic Pixel',
    badgeClass: 'badge-retro',
    desc: 'Klassischer Handheld- & SNES-Look mit satten Farben, dunklen 1px-Outlines, lebendigen Baumkronen und warmem Sonnenlicht.',
    activeColor: '#2563eb',
    palette: ['#489c3e', '#2578d4', '#dfb867', '#e24949', '#8b3ab8'],
    teleportZoom: 1.5
  },
  grimdark: {
    name: 'Grimdark Gothic',
    badge: 'Dark Souls / Diablo',
    badgeClass: 'badge-grimdark',
    desc: 'Düstere, verwitterte Welt mit dynamischem Fackellicht, radialer Vignette, knorrigen Totenbäumen und aufsteigenden Glut-Partikeln.',
    activeColor: '#b91c1c',
    palette: ['#141416', '#3e4438', '#713828', '#ff7722', '#8b1c2b'],
    teleportZoom: 1.5
  },
  cyber: {
    name: 'Cyber-Void Synthwave',
    badge: 'Neon Sci-Fi',
    badgeClass: 'badge-cyber',
    desc: 'Pechschwarzer Void-Hintergrund mit leuchtenden Neon-Vektorgittern, pulsierenden Kristallbäumen und Afterimage-Laufspuren.',
    activeColor: '#06b6d4',
    palette: ['#05050d', '#00f0ff', '#ff0077', '#39ff14', '#a855f7'],
    teleportZoom: 1.5
  },
  ghibli: {
    name: 'Cozy Ghibli Aquarell',
    badge: 'Painterly Pastel',
    badgeClass: 'badge-ghibli',
    desc: 'Malerische Pastellfarben auf Pergament ohne harte Ränder, weich ziehende Wolkenschatten und flatternde Sakura-Blütenblätter.',
    activeColor: '#10b981',
    palette: ['#fbf7ee', '#6ebd85', '#f7bb97', '#6baed6', '#f472b6'],
    teleportZoom: 1.5
  },
  isometric: {
    name: 'Isometrisches 2.5D Diorama',
    badge: 'Tactical Voxel',
    badgeClass: 'badge-isometric',
    desc: 'Echte 2.5D-Isometrie mit sichtbaren Klippen-Höhenstufen, schattierten 3D-Bodenblöcken und dioramaartiger Raumtiefe.',
    activeColor: '#9333ea',
    palette: ['#50b04a', '#398834', '#2b7bc4', '#e2c070', '#7c3aed'],
    teleportZoom: 1.2
  },
  paper_mononoke: {
    name: 'Dark Ghibli: Mononoke Geisterwald',
    badge: '2.5D Papercraft',
    badgeClass: 'badge-paper-mononoke',
    desc: 'Mystischer Dämmerungswald im 2.5D-Papierschnitt-Look. Ausgestanzter Karton mit weichen Papierschatten, schwebende weiße Kodama-Waldgeister, uralte Moosbäume und geisterhafter Cyan-Nebel.',
    activeColor: '#2dd4bf',
    palette: ['#1a1f36', '#2d5a43', '#475b52', '#5eead4', '#f8fafc'],
    teleportZoom: 1.5
  },
  paper_spores: {
    name: 'Dark Ghibli: Sporen-Dschungel',
    badge: 'Biolumineszenz',
    badgeClass: 'badge-paper-spores',
    desc: 'Inspiriert von Nausicaä. Geschichtete Papierscheiben mit leuchtenden biolumineszenten Schnittkanten, riesige papierene Pilze und sanft rotierende Glüh-Sporen.',
    activeColor: '#f472b6',
    palette: ['#160f26', '#0f2830', '#22d3ee', '#f472b6', '#fbbf24'],
    teleportZoom: 1.5
  },
  paper_lantern: {
    name: 'Dark Ghibli: Lampion-Dämmerung',
    badge: 'Kiri-e & Shadowbox',
    badgeClass: 'badge-paper-lantern',
    desc: 'Inspiriert von Chihiro / Spirited Away. Kiri-e Scherenschnitt im Dämmerlicht. Schaukelnde rote Papierlampions werfen warmes Licht auf dunkle Papierebenen und schwebende Talismane.',
    activeColor: '#fb923c',
    palette: ['#1c1527', '#120c1a', '#ea580c', '#fbbf24', '#f8fafc'],
    teleportZoom: 1.5
  }
};

// ============================================================================
// 3. STYLE 1: 16-BIT RETRO NOSTALGIA RENDERER
// ============================================================================
function renderStyleRetro(ctx, world, cam, player, t, opts) {
  const ts = 16;
  const startX = Math.max(0, Math.floor(cam.x / ts));
  const endX = Math.min(world.width, Math.ceil((cam.x + cam.w) / ts) + 1);
  const startY = Math.max(0, Math.floor(cam.y / ts));
  const endY = Math.min(world.height, Math.ceil((cam.y + cam.h) / ts) + 1);

  // Background
  ctx.fillStyle = '#1c1b29';
  ctx.fillRect(0, 0, cam.w, cam.h);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // Ground layer
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = world.getTile(x, y);
      const px = x * ts;
      const py = y * ts;

      if (tile === TILE.GRASS) {
        ctx.fillStyle = (x + y) % 3 === 0 ? '#4fa345' : '#45973c';
        ctx.fillRect(px, py, ts, ts);
        // Grass blades
        if ((x * 7 + y * 13) % 5 === 0) {
          ctx.fillStyle = '#64bc59';
          ctx.fillRect(px + 3, py + 4, 2, 4);
          ctx.fillRect(px + 9, py + 8, 2, 4);
        }
      } else if (tile === TILE.DIRT) {
        ctx.fillStyle = '#7a5433';
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = '#684527';
        ctx.fillRect(px + 2, py + 3, 2, 2);
        ctx.fillRect(px + 10, py + 9, 3, 2);
      } else if (tile === TILE.SAND || tile === TILE.QUICKSAND) {
        ctx.fillStyle = tile === TILE.QUICKSAND ? '#be984c' : '#dfb867';
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = '#eed184';
        const wave = Math.sin(x * 0.8 + y * 0.4 + (tile === TILE.QUICKSAND ? t * 3 : 0));
        if (wave > 0.4) ctx.fillRect(px + 2, py + 7, 12, 1);
      } else if (tile === TILE.SNOW) {
        ctx.fillStyle = (x + y) % 4 === 0 ? '#f2f7fc' : '#e5eff8';
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = '#c7dced';
        ctx.fillRect(px + 1, py + 14, ts - 2, 1);
      } else if (tile === TILE.SWAMP) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#3f5235' : '#37472e';
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = '#4e6642';
        ctx.fillRect(px + 4, py + 6, 3, 2);
      } else if (tile === TILE.WATER || tile === TILE.SWAMP_WATER) {
        ctx.fillStyle = tile === TILE.SWAMP_WATER ? '#28422e' : '#2578d4';
        ctx.fillRect(px, py, ts, ts);
        // Flowing foam lines
        const wave = Math.sin((x * 0.4 + y * 0.2) - t * 2.5);
        if (wave > 0.5) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 3, py + 5, 8, 1);
          ctx.fillStyle = '#8bd3ff';
          ctx.fillRect(px + 2, py + 6, 11, 1);
        }
      } else if (tile === TILE.VOID || tile === TILE.VOID_LAKE) {
        ctx.fillStyle = tile === TILE.VOID_LAKE ? '#0c0418' : '#280f3d';
        ctx.fillRect(px, py, ts, ts);
        const star = (x * 19 + y * 31) % 17;
        if (star === 0) {
          const spark = (Math.sin(t * 4 + x + y) + 1) * 0.5;
          ctx.fillStyle = `rgba(224, 102, 255, ${0.4 + spark * 0.6})`;
          ctx.fillRect(px + 6, py + 6, 2, 2);
        }
      } else if (tile === TILE.BRIDGE) {
        ctx.fillStyle = '#85542b';
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = '#5c3616';
        ctx.fillRect(px, py + 14, ts, 2);
        ctx.fillRect(px + 7, py, 2, ts);
      }
    }
  }

  // Ground Objects (Flowers, Rocks, Bushes)
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const obj = world.objects[y][x];
      const px = x * ts;
      const py = y * ts;
      if (obj === OBJ.FLOWER) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 5, py + 5, 4, 4);
        ctx.fillStyle = '#ffcf33';
        ctx.fillRect(px + 6, py + 6, 2, 2);
      } else if (obj === OBJ.BUSH) {
        ctx.fillStyle = '#1c4a17'; // Shadow
        ctx.fillRect(px + 2, py + 3, 12, 10);
        ctx.fillStyle = '#2f7a26';
        ctx.fillRect(px + 3, py + 2, 10, 9);
        ctx.fillStyle = '#4db83f'; // Highlight
        ctx.fillRect(px + 4, py + 3, 5, 4);
      } else if (obj === OBJ.ROCK) {
        ctx.fillStyle = '#3a3a48';
        ctx.fillRect(px + 3, py + 5, 10, 8);
        ctx.fillStyle = '#7a7a8f';
        ctx.fillRect(px + 4, py + 4, 8, 7);
        ctx.fillStyle = '#a8a8c0';
        ctx.fillRect(px + 5, py + 5, 3, 2);
      } else if (obj === OBJ.CACTUS) {
        ctx.fillStyle = '#1b5e20';
        ctx.fillRect(px + 6, py + 2, 4, 12);
        ctx.fillRect(px + 2, py + 5, 4, 4);
        ctx.fillRect(px + 10, py + 7, 4, 4);
      } else if (obj === OBJ.MUSHROOM) {
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(px + 4, py + 4, 8, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 6, py + 5, 2, 2);
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(px + 7, py + 10, 2, 4);
      }
    }
  }

  // Y-Sorted Trees and Player
  const entities = [];
  for (const tr of world.trees) {
    if (tr.tileX >= startX - 2 && tr.tileX <= endX + 2 && tr.tileY >= startY - 2 && tr.tileY <= endY + 2) {
      entities.push({ type: 'tree', y: tr.y, data: tr });
    }
  }
  entities.push({ type: 'player', y: player.y, data: player });
  entities.sort((a, b) => a.y - b.y);

  for (const ent of entities) {
    if (ent.type === 'player') {
      drawRetroPlayer(ctx, player, t);
    } else {
      drawRetroTree(ctx, ent.data, t);
    }
  }

  // Particles
  if (opts.particles) {
    drawRetroParticles(ctx, cam, t);
  }

  // Time of Day Tint
  applyTimeOfDayTint(ctx, cam, opts.timeOfDay);

  ctx.restore();
}

function drawRetroTree(ctx, tree, t) {
  const sway = Math.sin(t * 2.2 + tree.x * 0.1) * 1.5;
  const tx = tree.x;
  const ty = tree.y;

  // Drop Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(tx, ty, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  ctx.fillStyle = '#53341b';
  ctx.fillRect(tx - 3, ty - 12, 6, 12);
  ctx.fillStyle = '#39210e';
  ctx.fillRect(tx + 1, ty - 12, 2, 12);

  // Crown (Puffy 16-Bit layered foliage)
  const cx = tx + sway;
  const cy = ty - 24;

  let baseCol = '#25701d';
  let midCol = '#3ea331';
  let highCol = '#74d463';

  if (tree.biome === TILE.SNOW) {
    baseCol = '#38607a'; midCol = '#5b8fa8'; highCol = '#eef6fc';
  } else if (tree.biome === TILE.SWAMP) {
    baseCol = '#2c3b24'; midCol = '#445c36'; highCol = '#6b8a57';
  }

  // Outline
  ctx.fillStyle = '#0f240b';
  ctx.beginPath();
  ctx.arc(cx, cy, 17, 0, Math.PI * 2);
  ctx.fill();

  // Base
  ctx.fillStyle = baseCol;
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.fill();

  // Midtone puffs
  ctx.fillStyle = midCol;
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 4, 10, 0, Math.PI * 2);
  ctx.arc(cx + 5, cy - 3, 9, 0, Math.PI * 2);
  ctx.fill();

  // Highlights
  ctx.fillStyle = highCol;
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 7, 5, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 6, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawRetroPlayer(ctx, player, t) {
  const px = Math.round(player.x);
  const py = Math.round(player.y);
  const bob = player.isMoving ? Math.sin(t * 12) * 2 : 0;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(px, py, 7, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boots
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(px - 5, py - 4, 4, 4);
  ctx.fillRect(px + 1, py - 4, 4, 4);

  // Tunic (Red or Green classic hero)
  ctx.fillStyle = '#22c55e'; // Vibrant tunic
  ctx.fillRect(px - 6, py - 14 + bob, 12, 10);
  ctx.fillStyle = '#15803d'; // Belt / border
  ctx.fillRect(px - 6, py - 6 + bob, 12, 2);
  ctx.fillStyle = '#eab308'; // Buckle
  ctx.fillRect(px - 1, py - 6 + bob, 2, 2);

  // Head & Cap
  ctx.fillStyle = '#fed7aa'; // Skin
  ctx.fillRect(px - 4, py - 19 + bob, 8, 6);
  ctx.fillStyle = '#15803d'; // Green cap
  ctx.fillRect(px - 5, py - 22 + bob, 10, 4);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(px - 2, py - 24 + bob, 6, 3);

  // Eyes
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(px - 2, py - 18 + bob, 2, 2);
  ctx.fillRect(px + 2, py - 18 + bob, 2, 2);
}

function drawRetroParticles(ctx, cam, t) {
  // Golden pollen & green leaf particles
  for (let i = 0; i < 30; i++) {
    const px = (Math.sin(i * 99 + t * 0.3) * 0.5 + 0.5) * cam.w + cam.x;
    const py = (Math.cos(i * 33 + t * 0.4) * 0.5 + 0.5) * cam.h + cam.y;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 235, 120, 0.7)' : 'rgba(120, 225, 120, 0.6)';
    ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
  }
}

// ============================================================================
// 4. STYLE 2: GRIMDARK GOTHIC RENDERER (Dynamic Torchlight, Fog & Embers)
// ============================================================================
function renderStyleGrimdark(ctx, world, cam, player, t, opts) {
  const ts = 16;
  const startX = Math.max(0, Math.floor(cam.x / ts));
  const endX = Math.min(world.width, Math.ceil((cam.x + cam.w) / ts) + 1);
  const startY = Math.max(0, Math.floor(cam.y / ts));
  const endY = Math.min(world.height, Math.ceil((cam.y + cam.h) / ts) + 1);

  // Deep pitch black base
  ctx.fillStyle = '#08080a';
  ctx.fillRect(0, 0, cam.w, cam.h);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // Bleak Desaturated Ground
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = world.getTile(x, y);
      const px = x * ts;
      const py = y * ts;

      if (tile === TILE.GRASS) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#272b22' : '#22261e';
        ctx.fillRect(px, py, ts, ts);
      } else if (tile === TILE.DIRT) {
        ctx.fillStyle = '#2c2522';
        ctx.fillRect(px, py, ts, ts);
      } else if (tile === TILE.SAND || tile === TILE.QUICKSAND) {
        ctx.fillStyle = '#4a443a'; // Ash dust
        ctx.fillRect(px, py, ts, ts);
        // Cracked lines
        ctx.fillStyle = '#2e2820';
        if ((x * 5 + y * 9) % 7 === 0) {
          ctx.fillRect(px + 2, py + 4, 10, 1);
          ctx.fillRect(px + 7, py + 5, 1, 6);
        }
      } else if (tile === TILE.SNOW) {
        ctx.fillStyle = '#596570'; // Cold blizzard ash
        ctx.fillRect(px, py, ts, ts);
      } else if (tile === TILE.SWAMP) {
        ctx.fillStyle = '#1c241a'; // Toxic mire
        ctx.fillRect(px, py, ts, ts);
      } else if (tile === TILE.WATER || tile === TILE.SWAMP_WATER) {
        ctx.fillStyle = '#121a1e';
        ctx.fillRect(px, py, ts, ts);
      } else if (tile === TILE.VOID || tile === TILE.VOID_LAKE) {
        ctx.fillStyle = '#0a030d';
        ctx.fillRect(px, py, ts, ts);
        // Blood fissure veins
        const vein = Math.sin(x * 0.4 + y * 0.3 - t * 1.5);
        if (vein > 0.6) {
          ctx.fillStyle = `rgba(180, 20, 40, ${(vein - 0.6) * 1.5})`;
          ctx.fillRect(px + 4, py + 6, 8, 2);
        }
      } else if (tile === TILE.BRIDGE) {
        ctx.fillStyle = '#3a2d26';
        ctx.fillRect(px, py, ts, ts);
      }
    }
  }

  // Dead Trees & Monuments
  const entities = [];
  for (const tr of world.trees) {
    if (tr.tileX >= startX - 2 && tr.tileX <= endX + 2 && tr.tileY >= startY - 2 && tr.tileY <= endY + 2) {
      entities.push({ type: 'tree', y: tr.y, data: tr });
    }
  }
  entities.push({ type: 'player', y: player.y, data: player });
  entities.sort((a, b) => a.y - b.y);

  for (const ent of entities) {
    if (ent.type === 'player') {
      drawGrimdarkPlayer(ctx, player, t);
    } else {
      drawGrimdarkTree(ctx, ent.data, t);
    }
  }

  ctx.restore();

  // DYNAMIC TORCHLIGHT SYSTEM:
  // Render darkness with an organic radial torch gradient around player!
  const screenPlayerX = player.x - cam.x;
  const screenPlayerY = player.y - cam.y;
  const torchFlicker = Math.sin(t * 15) * 3 + Math.cos(t * 22) * 2;
  const torchRadius = 140 + torchFlicker;

  const darkGrad = ctx.createRadialGradient(
    screenPlayerX, screenPlayerY - 10, 10,
    screenPlayerX, screenPlayerY - 10, torchRadius
  );
  darkGrad.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
  darkGrad.addColorStop(0.4, 'rgba(10, 10, 16, 0.2)');
  darkGrad.addColorStop(0.7, 'rgba(8, 8, 12, 0.65)');
  darkGrad.addColorStop(1, 'rgba(4, 4, 6, 0.94)');

  ctx.fillStyle = darkGrad;
  ctx.fillRect(0, 0, cam.w, cam.h);

  // Warm Torchlight Glow Color Multiply
  const torchGlow = ctx.createRadialGradient(
    screenPlayerX, screenPlayerY - 10, 2,
    screenPlayerX, screenPlayerY - 10, torchRadius * 0.7
  );
  torchGlow.addColorStop(0, 'rgba(255, 130, 40, 0.22)');
  torchGlow.addColorStop(0.6, 'rgba(210, 80, 20, 0.08)');
  torchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = torchGlow;
  ctx.fillRect(0, 0, cam.w, cam.h);

  // Heavy Screen Vignette
  const vig = ctx.createRadialGradient(cam.w / 2, cam.h / 2, cam.w * 0.3, cam.w / 2, cam.h / 2, cam.w * 0.7);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, cam.w, cam.h);

  // Rising Embers & Ash Particles
  if (opts.particles) {
    drawGrimdarkEmbers(ctx, cam, player, t);
  }
}

function drawGrimdarkTree(ctx, tree, t) {
  const tx = tree.x;
  const ty = tree.y;

  // Gnarled Dead Thorn Tree
  ctx.strokeStyle = '#1a191b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - 3, ty - 16);
  ctx.lineTo(tx - 12, ty - 28);
  ctx.moveTo(tx - 3, ty - 16);
  ctx.lineTo(tx + 8, ty - 26);
  ctx.lineTo(tx + 14, ty - 34);
  ctx.stroke();

  // Spikes and hanging moss
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#32323a';
  ctx.beginPath();
  ctx.moveTo(tx - 6, ty - 22);
  ctx.lineTo(tx - 14, ty - 20);
  ctx.moveTo(tx + 4, ty - 20);
  ctx.lineTo(tx + 10, ty - 16);
  ctx.stroke();

  // Blood moss or withered black foliage
  ctx.fillStyle = '#18191a';
  ctx.beginPath();
  ctx.arc(tx - 10, ty - 28, 5, 0, Math.PI * 2);
  ctx.arc(tx + 12, ty - 30, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGrimdarkPlayer(ctx, player, t) {
  const px = Math.round(player.x);
  const py = Math.round(player.y);
  const bob = player.isMoving ? Math.sin(t * 10) * 1.5 : 0;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.ellipse(px, py, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Penitent Knight Cloak
  ctx.fillStyle = '#222228';
  ctx.fillRect(px - 5, py - 16 + bob, 10, 13);
  ctx.fillStyle = '#141416';
  ctx.fillRect(px - 4, py - 6 + bob, 8, 6);

  // Helmet / Iron Hood
  ctx.fillStyle = '#555560';
  ctx.fillRect(px - 4, py - 20 + bob, 8, 6);
  ctx.fillStyle = '#b91c1c'; // Slit / blood feather
  ctx.fillRect(px - 2, py - 18 + bob, 4, 1.5);

  // Animated Torch in Hand
  const torchX = px + 7;
  const torchY = py - 12 + bob;
  ctx.fillStyle = '#5c3a21'; // Torch stick
  ctx.fillRect(torchX, torchY, 2, 10);

  // Flickering Flame
  const fScale = 1 + Math.sin(t * 20) * 0.25;
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(torchX + 1, torchY - 2, 4 * fScale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(torchX + 1, torchY - 2, 2 * fScale, 0, Math.PI * 2);
  ctx.fill();
}

function drawGrimdarkEmbers(ctx, cam, player, t) {
  for (let i = 0; i < 35; i++) {
    const rx = ((i * 47 + t * 25) % cam.w);
    const ry = (cam.h - ((i * 61 + t * 40) % cam.h));
    const dist = Math.hypot(rx - (player.x - cam.x), ry - (player.y - cam.y));
    const alpha = Math.max(0.1, 1 - (dist / 250));
    ctx.fillStyle = i % 3 === 0 ? `rgba(255, 115, 30, ${alpha})` : `rgba(180, 180, 190, ${alpha * 0.4})`;
    ctx.fillRect(Math.round(rx), Math.round(ry), 1.5, 1.5);
  }
}

// ============================================================================
// 5. STYLE 3: CYBER-VOID SYNTHWAVE RENDERER (Neon Vector Grid & Afterimages)
// ============================================================================
const cyberTrails = [];

function renderStyleCyber(ctx, world, cam, player, t, opts) {
  const ts = 16;
  const startX = Math.max(0, Math.floor(cam.x / ts));
  const endX = Math.min(world.width, Math.ceil((cam.x + cam.w) / ts) + 1);
  const startY = Math.max(0, Math.floor(cam.y / ts));
  const endY = Math.min(world.height, Math.ceil((cam.y + cam.h) / ts) + 1);

  // Pitch Black Matrix Background
  ctx.fillStyle = '#030308';
  ctx.fillRect(0, 0, cam.w, cam.h);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // 1. Digital Vector Grid Lines
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = startX; x <= endX; x++) {
    ctx.moveTo(x * ts, startY * ts);
    ctx.lineTo(x * ts, endY * ts);
  }
  for (let y = startY; y <= endY; y++) {
    ctx.moveTo(startX * ts, y * ts);
    ctx.lineTo(endX * ts, y * ts);
  }
  ctx.stroke();

  // 2. Neon Ground Matrix
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = world.getTile(x, y);
      const px = x * ts;
      const py = y * ts;

      if (tile === TILE.GRASS) {
        // Hex circuit dots
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = 'rgba(57, 255, 20, 0.25)';
          ctx.fillRect(px + 6, py + 6, 4, 4);
        }
      } else if (tile === TILE.WATER || tile === TILE.SWAMP_WATER) {
        // Frequency scan waves
        ctx.fillStyle = '#051226';
        ctx.fillRect(px, py, ts, ts);
        const wave = Math.sin((x * 0.5) - t * 4);
        ctx.strokeStyle = tile === TILE.SWAMP_WATER ? 'rgba(57, 255, 20, 0.6)' : 'rgba(0, 240, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py + 8 + wave * 4);
        ctx.lineTo(px + ts, py + 8 + wave * 4);
        ctx.stroke();
      } else if (tile === TILE.SAND || tile === TILE.QUICKSAND) {
        ctx.fillStyle = 'rgba(255, 170, 0, 0.15)';
        ctx.fillRect(px, py, ts, ts);
        ctx.strokeStyle = 'rgba(255, 170, 0, 0.5)';
        ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
      } else if (tile === TILE.SNOW) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.18)';
        ctx.fillRect(px, py, ts, ts);
        ctx.strokeStyle = '#c084fc';
        ctx.strokeRect(px + 4, py + 4, ts - 8, ts - 8);
      } else if (tile === TILE.VOID || tile === TILE.VOID_LAKE) {
        // Pure void abyss with digital matrix beams
        const beam = (x * 13 + y * 7 + Math.floor(t * 8)) % 23;
        if (beam === 0) {
          ctx.fillStyle = 'rgba(255, 0, 119, 0.7)';
          ctx.fillRect(px + 7, py, 2, ts);
        }
      } else if (tile === TILE.BRIDGE) {
        ctx.strokeStyle = '#ff0077';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 1, py + 1, ts - 2, ts - 2);
      }
    }
  }

  // 3. Holographic Trees & Obelisks
  const entities = [];
  for (const tr of world.trees) {
    if (tr.tileX >= startX - 2 && tr.tileX <= endX + 2 && tr.tileY >= startY - 2 && tr.tileY <= endY + 2) {
      entities.push({ type: 'tree', y: tr.y, data: tr });
    }
  }
  entities.push({ type: 'player', y: player.y, data: player });
  entities.sort((a, b) => a.y - b.y);

  for (const ent of entities) {
    if (ent.type === 'player') {
      drawCyberPlayer(ctx, player, t);
    } else {
      drawCyberTree(ctx, ent.data, t);
    }
  }

  ctx.restore();

  // Floating Digital Bits / Glitch
  if (opts.particles) {
    drawCyberParticles(ctx, cam, t);
  }
}

function drawCyberTree(ctx, tree, t) {
  const tx = tree.x;
  const ty = tree.y;
  const pulse = Math.sin(t * 3 + tx * 0.1) * 0.3 + 0.7;

  // Holographic Polygon Prism Tree
  ctx.strokeStyle = `rgba(0, 240, 255, ${pulse})`;
  ctx.lineWidth = 1.5;

  // Base Conduit
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx, ty - 14);
  ctx.stroke();

  // Diamond Polygon Crown
  ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(tx, ty - 32);
  ctx.lineTo(tx + 12, ty - 20);
  ctx.lineTo(tx, ty - 8);
  ctx.lineTo(tx - 12, ty - 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center Core
  ctx.fillStyle = '#ff0077';
  ctx.fillRect(tx - 2, ty - 22, 4, 4);
}

function drawCyberPlayer(ctx, player, t) {
  const px = Math.round(player.x);
  const py = Math.round(player.y);

  // Store afterimage trail
  if (player.isMoving && Math.random() < 0.6) {
    cyberTrails.push({ x: px, y: py, life: 0.35, maxLife: 0.35 });
  }

  // Draw Trails
  for (let i = cyberTrails.length - 1; i >= 0; i--) {
    const tr = cyberTrails[i];
    tr.life -= 0.016;
    if (tr.life <= 0) {
      cyberTrails.splice(i, 1);
      continue;
    }
    const alpha = tr.life / tr.maxLife;
    ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.5})`;
    ctx.fillRect(tr.x - 5, tr.y - 14, 10, 14);
  }

  // Neon Avatar
  ctx.fillStyle = '#05050f';
  ctx.fillRect(px - 5, py - 15, 10, 15);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(px - 5, py - 15, 10, 15);

  // Glowing Visor
  ctx.fillStyle = '#ff0077';
  ctx.fillRect(px - 4, py - 13, 8, 3);
  ctx.shadowColor = '#ff0077';
  ctx.shadowBlur = 8;
  ctx.fillRect(px - 3, py - 12, 6, 2);
  ctx.shadowBlur = 0;
}

function drawCyberParticles(ctx, cam, t) {
  ctx.font = '9px monospace';
  for (let i = 0; i < 25; i++) {
    const px = (Math.sin(i * 17 + t * 0.2) * 0.5 + 0.5) * cam.w;
    const py = (Math.cos(i * 43 + t * 0.3) * 0.5 + 0.5) * cam.h;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 240, 255, 0.7)' : 'rgba(255, 0, 119, 0.7)';
    ctx.fillText(i % 2 === 0 ? '1' : '0', px, py);
  }
}

// ============================================================================
// 6. STYLE 4: COZY GHIBLI WATERCOLOR RENDERER (Painterly Pastel & Clouds)
// ============================================================================
function renderStyleGhibli(ctx, world, cam, player, t, opts) {
  const ts = 16;
  const startX = Math.max(0, Math.floor(cam.x / ts));
  const endX = Math.min(world.width, Math.ceil((cam.x + cam.w) / ts) + 1);
  const startY = Math.max(0, Math.floor(cam.y / ts));
  const endY = Math.min(world.height, Math.ceil((cam.y + cam.h) / ts) + 1);

  // Creamy Parchment / Watercolor Paper Tint
  ctx.fillStyle = '#faf6ee';
  ctx.fillRect(0, 0, cam.w, cam.h);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // Soft Organic Ground Washes
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = world.getTile(x, y);
      const px = x * ts;
      const py = y * ts;

      if (tile === TILE.GRASS) {
        ctx.fillStyle = '#6ebd85';
        ctx.fillRect(px, py, ts, ts);
      } else if (tile === TILE.DIRT) {
        ctx.fillStyle = '#d8a47f';
        ctx.fillRect(px, py, ts, ts);
      } else if (tile === TILE.SAND || tile === TILE.QUICKSAND) {
        ctx.fillStyle = '#f7bb97';
        ctx.fillRect(px, py, ts, ts);
      } else if (tile === TILE.SNOW) {
        ctx.fillStyle = '#d8e2f8'; // Rosy lavender snow
        ctx.fillRect(px, py, ts, ts);
      } else if (tile === TILE.SWAMP) {
        ctx.fillStyle = '#7e9974';
        ctx.fillRect(px, py, ts, ts);
      } else if (tile === TILE.WATER || tile === TILE.SWAMP_WATER) {
        ctx.fillStyle = tile === TILE.SWAMP_WATER ? '#4b6f52' : '#6baed6';
        ctx.fillRect(px, py, ts, ts);
        // Soft watercolor ripple
        const rip = Math.sin(x * 0.3 + y * 0.2 - t * 1.8);
        if (rip > 0.4) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(px + 3, py + 7, 10, 1.5);
        }
      } else if (tile === TILE.VOID || tile === TILE.VOID_LAKE) {
        ctx.fillStyle = '#48436c'; // Dreamy twilight indigo
        ctx.fillRect(px, py, ts, ts);
      } else if (tile === TILE.BRIDGE) {
        ctx.fillStyle = '#bd7e54';
        ctx.fillRect(px, py, ts, ts);
      }
    }
  }

  // Soft Drifting Cloud Shadows overhead!
  for (let c = 0; c < 3; c++) {
    const cloudX = ((c * 400 + t * 15) % (world.width * ts + 300)) - 150;
    const cloudY = 150 + c * 250;
    ctx.fillStyle = 'rgba(40, 70, 90, 0.09)';
    ctx.beginPath();
    ctx.ellipse(cloudX, cloudY, 120, 60, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Painterly Trees & Gentle Wanderer
  const entities = [];
  for (const tr of world.trees) {
    if (tr.tileX >= startX - 2 && tr.tileX <= endX + 2 && tr.tileY >= startY - 2 && tr.tileY <= endY + 2) {
      entities.push({ type: 'tree', y: tr.y, data: tr });
    }
  }
  entities.push({ type: 'player', y: player.y, data: player });
  entities.sort((a, b) => a.y - b.y);

  for (const ent of entities) {
    if (ent.type === 'player') {
      drawGhibliPlayer(ctx, player, t);
    } else {
      drawGhibliTree(ctx, ent.data, t);
    }
  }

  // Sakura Cherry Blossom Petals
  if (opts.particles) {
    drawGhibliSakura(ctx, cam, t);
  }

  applyTimeOfDayTint(ctx, cam, opts.timeOfDay);

  ctx.restore();
}

function drawGhibliTree(ctx, tree, t) {
  const sway = Math.sin(t * 1.8 + tree.x * 0.08) * 2;
  const tx = tree.x;
  const ty = tree.y;

  // Soft round shadow
  ctx.fillStyle = 'rgba(70, 100, 80, 0.2)';
  ctx.beginPath();
  ctx.ellipse(tx, ty, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Natural wooden trunk
  ctx.fillStyle = '#8d6e53';
  ctx.beginPath();
  ctx.moveTo(tx - 3, ty);
  ctx.lineTo(tx - 2, ty - 14);
  ctx.lineTo(tx + 2, ty - 14);
  ctx.lineTo(tx + 3, ty);
  ctx.fill();

  // Fluffy watercolor brush crown (Lineless soft pastel)
  const cx = tx + sway;
  const cy = ty - 25;

  let col1 = '#4fa86b';
  let col2 = '#79cc93';
  let col3 = '#a9e8be';

  if (tree.biome === TILE.SNOW) {
    col1 = '#7c9bb5'; col2 = '#a7c5de'; col3 = '#e6f0fa';
  } else if (tree.biome === TILE.SWAMP) {
    col1 = '#5c7352'; col2 = '#758f6b'; col3 = '#9ab88f';
  }

  ctx.fillStyle = col1;
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = col2;
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 3, 11, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 2, 10, 0, Math.PI * 2);
  ctx.fill();

  // Dappled Sunlight Highlight
  ctx.fillStyle = col3;
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 7, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawGhibliPlayer(ctx, player, t) {
  const px = Math.round(player.x);
  const py = Math.round(player.y);
  const bob = player.isMoving ? Math.sin(t * 9) * 1.5 : 0;

  // Shadow
  ctx.fillStyle = 'rgba(60, 80, 70, 0.25)';
  ctx.beginPath();
  ctx.ellipse(px, py, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Soft traveler poncho
  ctx.fillStyle = '#5dade2'; // Soft sky blue poncho
  ctx.beginPath();
  ctx.moveTo(px, py - 18 + bob);
  ctx.lineTo(px + 7, py - 6 + bob);
  ctx.lineTo(px - 7, py - 6 + bob);
  ctx.closePath();
  ctx.fill();

  // Fluttering Scarf in wind
  const scarfSway = Math.sin(t * 5) * 3;
  ctx.strokeStyle = '#f472b6'; // Coral pink scarf
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(px, py - 15 + bob);
  ctx.lineTo(px - 8 + scarfSway, py - 14 + bob);
  ctx.stroke();

  // Straw Hat
  ctx.fillStyle = '#fcd34d'; // Straw yellow
  ctx.beginPath();
  ctx.ellipse(px, py - 19 + bob, 9, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(px, py - 20 + bob, 4, Math.PI, 0);
  ctx.fill();
}

function drawGhibliSakura(ctx, cam, t) {
  for (let i = 0; i < 35; i++) {
    const sx = ((i * 53 + t * 20) % cam.w);
    const sy = ((i * 79 + t * 35) % cam.h);
    ctx.fillStyle = 'rgba(244, 114, 182, 0.75)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 3, 1.5, Math.sin(t + i), 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================================
// 7. STYLE 5: ISOMETRIC 2.5D DIORAMA RENDERER (3D Extruded Blocks & Cliffs)
// ============================================================================
function renderStyleIsometric(ctx, world, cam, player, t, opts) {
  // Clear dark tactical slate background
  ctx.fillStyle = '#10121a';
  ctx.fillRect(0, 0, cam.w, cam.h);

  ctx.save();

  // Isometric Projection Geometry
  const tileW = 28; // Isometric diamond width
  const tileH = 14; // Isometric diamond height
  const blockDepth = 10; // Vertical height extrusion per elevation level

  // Center isometric projection relative to player
  const playerIsoX = (player.x / 16 - player.y / 16) * (tileW / 2);
  const playerIsoY = (player.x / 16 + player.y / 16) * (tileH / 2);

  const originX = cam.w / 2 - playerIsoX;
  const originY = cam.h / 2 - playerIsoY;

  ctx.translate(originX, originY);

  // Determine which tiles are visible in isometric view
  const range = 24;
  const pTileX = Math.floor(player.x / 16);
  const pTileY = Math.floor(player.y / 16);

  const minX = Math.max(0, pTileX - range);
  const maxX = Math.min(world.width - 1, pTileX + range);
  const minY = Math.max(0, pTileY - range);
  const maxY = Math.min(world.height - 1, pTileY + range);

  // Render back-to-front in diagonal isometric order (x + y)
  for (let d = (minX + minY); d <= (maxX + maxY); d++) {
    for (let x = minX; x <= maxX; x++) {
      const y = d - x;
      if (y < minY || y > maxY) continue;

      const tile = world.getTile(x, y);
      const elev = world.heights[y][x];

      const ix = (x - y) * (tileW / 2);
      const iy = (x + y) * (tileH / 2) - (elev * blockDepth);

      drawIsoTile(ctx, ix, iy, tileW, tileH, blockDepth, elev, tile, x, y);

      // Check for tree on this tile
      if (world.objects[y][x] === OBJ.TREE) {
        drawIsoTree(ctx, ix, iy, tile, t);
      }

      // Check if player is on this tile
      if (x === pTileX && y === pTileY) {
        drawIsoPlayer(ctx, ix, iy, player, t);
      }
    }
  }

  ctx.restore();
}

function drawIsoTile(ctx, x, y, tw, th, depth, elev, tile, tx, ty) {
  // Colors for top, left, right face
  let topCol = '#50b04a';
  let leftCol = '#388834';
  let rightCol = '#2b7028';

  if (tile === TILE.SAND || tile === TILE.QUICKSAND) {
    topCol = '#e2c070'; leftCol = '#be9d52'; rightCol = '#9e7f3c';
  } else if (tile === TILE.SNOW) {
    topCol = '#edf4fa'; leftCol = '#c2d5e5'; rightCol = '#9fbcd3';
  } else if (tile === TILE.SWAMP) {
    topCol = '#425b39'; leftCol = '#2e4227'; rightCol = '#21301c';
  } else if (tile === TILE.WATER || tile === TILE.SWAMP_WATER) {
    topCol = '#2b7bc4'; leftCol = '#1f5f99'; rightCol = '#154573';
  } else if (tile === TILE.VOID || tile === TILE.VOID_LAKE) {
    topCol = '#220b38'; leftCol = '#150624'; rightCol = '#0c0214';
  } else if (tile === TILE.BRIDGE) {
    topCol = '#91592c'; leftCol = '#6b3f1c'; rightCol = '#4f2d12';
  }

  const halfW = tw / 2;
  const halfH = th / 2;
  const h = Math.max(depth * elev, 4);

  // 1. Left Vertical Face
  ctx.fillStyle = leftCol;
  ctx.beginPath();
  ctx.moveTo(x - halfW, y);
  ctx.lineTo(x, y + halfH);
  ctx.lineTo(x, y + halfH + h);
  ctx.lineTo(x - halfW, y + h);
  ctx.closePath();
  ctx.fill();

  // 2. Right Vertical Face
  ctx.fillStyle = rightCol;
  ctx.beginPath();
  ctx.moveTo(x, y + halfH);
  ctx.lineTo(x + halfW, y);
  ctx.lineTo(x + halfW, y + h);
  ctx.lineTo(x, y + halfH + h);
  ctx.closePath();
  ctx.fill();

  // 3. Top Diamond Face
  ctx.fillStyle = topCol;
  ctx.beginPath();
  ctx.moveTo(x, y - halfH);
  ctx.lineTo(x + halfW, y);
  ctx.lineTo(x, y + halfH);
  ctx.lineTo(x - halfW, y);
  ctx.closePath();
  ctx.fill();

  // Subtle clean edge highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawIsoTree(ctx, x, y, tile, t) {
  // Cast directional shadow towards bottom-right
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 4, 12, 6, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // 3D Faceted Isometric Conifer
  let c1 = '#2e8538';
  let c2 = '#1f6327';
  if (tile === TILE.SNOW) {
    c1 = '#8cb6d4'; c2 = '#5c86a3';
  }

  // Left prism face
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x - 8, y - 4);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();

  // Right prism face
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x + 8, y - 4);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
}

function drawIsoPlayer(ctx, x, y, player, t) {
  const bob = player.isMoving ? Math.sin(t * 12) * 1.5 : 0;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 7, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Isometric Chibi Adventurer
  ctx.fillStyle = '#a855f7'; // Purple tactical tunic
  ctx.fillRect(x - 4, y - 16 + bob, 8, 11);
  ctx.fillStyle = '#7e22ce';
  ctx.fillRect(x - 4, y - 8 + bob, 8, 2);

  // Head
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(x - 3, y - 22 + bob, 6, 6);
  ctx.fillStyle = '#581c87';
  ctx.fillRect(x - 4, y - 24 + bob, 8, 3);
}

// ============================================================================
// 7B. STYLE 6: DARK GHIBLI - MONONOKE GEISTERWALD (2.5D Papercraft & Kodama)
// ============================================================================
function renderStylePaperMononoke(ctx, world, cam, player, t, opts) {
  const ts = 16;
  const startX = Math.max(0, Math.floor(cam.x / ts));
  const endX = Math.min(world.width, Math.ceil((cam.x + cam.w) / ts) + 1);
  const startY = Math.max(0, Math.floor(cam.y / ts));
  const endY = Math.min(world.height, Math.ceil((cam.y + cam.h) / ts) + 1);

  // Deep twilight indigo paperboard base
  ctx.fillStyle = '#121624';
  ctx.fillRect(0, 0, cam.w, cam.h);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // 1. Layered Cardstock Ground Tiles with Drop Shadows & Cut Edges
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = world.getTile(x, y);
      const elev = world.heights[y][x];
      const px = x * ts;
      const py = y * ts;

      // Base card colors
      let cardCol = '#224233'; // Twilight Jade Grass
      let isCutoutLayer = true;

      if (tile === TILE.DIRT) {
        cardCol = '#3a2d24';
      } else if (tile === TILE.SAND) {
        cardCol = '#dfb867'; // Warmer Wüstensand
      } else if (tile === TILE.QUICKSAND) {
        cardCol = '#6b4317'; // Treibsand (abgesenkt)
        isCutoutLayer = false;
      } else if (tile === TILE.SNOW) {
        cardCol = '#62798e';
      } else if (tile === TILE.SWAMP) {
        cardCol = '#1a2c20';
      } else if (tile === TILE.WATER || tile === TILE.SWAMP_WATER) {
        cardCol = '#0d1822'; // Sunken cut riverbed
        isCutoutLayer = false;
      } else if (tile === TILE.VOID) {
        cardCol = '#221236'; // Fester Leerenboden
      } else if (tile === TILE.VOID_LAKE) {
        cardCol = '#030008'; // Das Leerenmeer: endloser Schlund
        isCutoutLayer = false;
      } else if (tile === TILE.BRIDGE) {
        cardCol = '#5e432d';
      }

      // Cutout Paper Card Tile
      ctx.fillStyle = cardCol;
      ctx.fillRect(px, py, ts, ts);

      // Paper cut edges & depth shadows
      if (isCutoutLayer && elev >= 1.0) {
        // Top cut edge highlight (simulating physical paper sheet thickness)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.fillRect(px, py, ts, 1.5);
        // Bottom paper shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(px, py + ts - 2, ts, 2);
      }

      // 1. Sand-Dünenwellen & Rippeln
      if (tile === TILE.SAND) {
        const dune = Math.sin(x * 0.45 + y * 0.85);
        if (dune > 0.4) {
          ctx.fillStyle = '#f3d88c';
          ctx.fillRect(px + 1, py + 4, 14, 1.5);
        } else if (dune < -0.4) {
          ctx.fillStyle = '#c89943';
          ctx.fillRect(px + 2, py + 6, 12, 1);
        }
      }

      // 2. Treibsand Mahlstrom
      if (tile === TILE.QUICKSAND) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(px, py, ts, 2);
        ctx.fillRect(px, py, 2, ts);
        const swirl = Math.sin(x * 0.7 + y * 0.7 - t * 3.0);
        if (swirl > 0.3) {
          ctx.fillStyle = '#a6762f';
          ctx.fillRect(px + 2, py + 4, 12, 2);
        } else if (swirl < -0.3) {
          ctx.fillStyle = '#452608';
          ctx.fillRect(px + 3, py + 9, 10, 2);
        }
      }

      // Sunken paper river wave strips
      if (tile === TILE.WATER || tile === TILE.SWAMP_WATER) {
        const wave = Math.sin((x * 0.4 + y * 0.2) - t * 2.0);
        if (wave > 0.4) {
          ctx.fillStyle = 'rgba(94, 234, 212, 0.45)'; // Soft cyan paper strip
          ctx.fillRect(px + 2, py + 7, 12, 1.5);
        }
      }

      // 3. Fester Leerenboden (Starlight)
      if (tile === TILE.VOID) {
        if ((x * 13 + y * 19) % 9 === 0) {
          ctx.fillStyle = 'rgba(192, 132, 252, 0.8)';
          ctx.fillRect(px + 6, py + 6, 2, 2);
        }
      }

      // 4. Tödliches Leerenmeer (Glühende Abbruchkante & kosmische Wellen)
      if (tile === TILE.VOID_LAKE) {
        const vWave = Math.sin(x * 0.5 + y * 0.4 - t * 2.0);
        if (vWave > 0.4) {
          ctx.fillStyle = 'rgba(126, 34, 206, 0.5)';
          ctx.fillRect(px + 2, py + 5, 12, 2);
        }
        // Glühende Abbruchkante
        ctx.fillStyle = `rgba(192, 132, 252, ${0.7 + Math.sin(t * 3.5 + x) * 0.25})`;
        ctx.fillRect(px, py, ts, 1.5);
      }
    }
  }

  // 2. Papercraft Rocks & Objects with Origami Facets
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const obj = world.objects[y][x];
      const px = x * ts;
      const py = y * ts;
      if (obj === OBJ.ROCK) {
        // Folded paper boulder
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(px + 2, py + 8, 12, 6);
        // Light facet
        ctx.fillStyle = '#4b5563';
        ctx.beginPath();
        ctx.moveTo(px + 2, py + 12);
        ctx.lineTo(px + 8, py + 4);
        ctx.lineTo(px + 8, py + 12);
        ctx.closePath();
        ctx.fill();
        // Shadow facet
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.moveTo(px + 8, py + 4);
        ctx.lineTo(px + 14, py + 12);
        ctx.lineTo(px + 8, py + 12);
        ctx.closePath();
        ctx.fill();
        // Crease fold line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 8, py + 4);
        ctx.lineTo(px + 8, py + 12);
        ctx.stroke();
      } else if (obj === OBJ.FLOWER || obj === OBJ.BUSH) {
        ctx.fillStyle = '#1e382b';
        ctx.beginPath();
        ctx.arc(px + 8, py + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5eead4';
        ctx.fillRect(px + 7, py + 7, 2, 2);
      }
    }
  }

  // 3. Y-Sorted Paper Trees and Player
  const entities = [];
  for (const tr of world.trees) {
    if (tr.tileX >= startX - 2 && tr.tileX <= endX + 2 && tr.tileY >= startY - 2 && tr.tileY <= endY + 2) {
      entities.push({ type: 'tree', y: tr.y, data: tr });
    }
  }
  entities.push({ type: 'player', y: player.y, data: player });
  entities.sort((a, b) => a.y - b.y);

  for (const ent of entities) {
    if (ent.type === 'player') {
      drawPaperMononokePlayer(ctx, player, t);
    } else {
      drawPaperMononokeTree(ctx, ent.data, t);
    }
  }

  // 4. Floating Kodama Forest Spirits (Princess Mononoke)
  drawPaperKodamaSpirits(ctx, cam, t);

  // 5. Ambient Twilight Mist
  drawPaperTwilightMist(ctx, cam, t);

  applyTimeOfDayTint(ctx, cam, opts.timeOfDay);

  ctx.restore();
}

function drawPaperMononokeTree(ctx, tree, t) {
  const sway = Math.sin(t * 1.6 + tree.x * 0.08) * 1.8;
  const tx = tree.x;
  const ty = tree.y;

  // Paper cutout ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.beginPath();
  ctx.ellipse(tx, ty, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cut cardstock trunk
  ctx.fillStyle = '#3a2b1e';
  ctx.beginPath();
  ctx.moveTo(tx - 3, ty);
  ctx.lineTo(tx - 2, ty - 16);
  ctx.lineTo(tx + 2, ty - 16);
  ctx.lineTo(tx + 3, ty);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Multi-tier scalloped paper foliage with drop-shadows between each paper card!
  const cx = tx + sway;
  const cy = ty - 26;

  // Layer 1 (Back paper leaf with drop shadow)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.arc(cx + 2, cy + 3, 17, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#183426';
  ctx.beginPath();
  ctx.arc(cx, cy, 17, 0, Math.PI * 2);
  ctx.fill();

  // Layer 2 (Middle paper leaf with drop shadow)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 1, 13, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#264e3a';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 2, 13, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 1, 12, 0, Math.PI * 2);
  ctx.fill();

  // Layer 3 (Top paper highlight disc with fine cut edge)
  ctx.fillStyle = '#366d51';
  ctx.beginPath();
  ctx.arc(cx - 2, cy - 6, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(94, 234, 212, 0.35)'; // Ethereal paper edge rim
  ctx.lineWidth = 1;
  ctx.stroke();

  // Papercraft center pin / brad
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(cx - 1, cy - 6, 2, 2);
}

function drawPaperMononokePlayer(ctx, player, t) {
  const px = Math.round(player.x);
  const py = Math.round(player.y);
  const bob = player.isMoving ? Math.sin(t * 10) * 1.5 : 0;

  // Paper card drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(px + 1, py + 2, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Folded Papercraft Wanderer (Midnight Monk / Masked Spirit)
  // Robe (Dark Twilight Indigo)
  ctx.fillStyle = '#1e2436';
  ctx.beginPath();
  ctx.moveTo(px, py - 20 + bob);
  ctx.lineTo(px + 7, py - 4 + bob);
  ctx.lineTo(px - 7, py - 4 + bob);
  ctx.closePath();
  ctx.fill();

  // Paper fold line down the center
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, py - 20 + bob);
  ctx.lineTo(px, py - 4 + bob);
  ctx.stroke();

  // Cutout Mask / Face (Kodama Spirit White)
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(px, py - 18 + bob, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Glowing Cyan Spirit Eyes
  ctx.fillStyle = '#2dd4bf';
  ctx.fillRect(px - 2, py - 19 + bob, 1.5, 2);
  ctx.fillRect(px + 1, py - 19 + bob, 1.5, 2);

  // Red Talisman Cord / Ribbon fluttering
  const ribbon = Math.sin(t * 6) * 3;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px, py - 14 + bob);
  ctx.lineTo(px - 6 + ribbon, py - 10 + bob);
  ctx.stroke();
}

function drawPaperKodamaSpirits(ctx, cam, t) {
  // Cute little paper cutout Kodama heads bobbing & tilting in the dark forest!
  for (let i = 0; i < 8; i++) {
    const kx = ((i * 137 + Math.sin(t * 0.4 + i) * 20) % cam.w) + cam.x;
    const ky = ((i * 89 + Math.cos(t * 0.5 + i * 2) * 15) % cam.h) + cam.y;
    const tilt = Math.sin(t * 3.5 + i * 1.7) * 0.25;

    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(tilt);

    // Kodama Paper Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(1, 10, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(-1.5, 3, 3, 6);

    // Head
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3 Dark Hollow Dots: 2 Eyes and 1 Mouth
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-2, -1, 1, 0, Math.PI * 2);
    ctx.arc(2, -1, 1, 0, Math.PI * 2);
    ctx.arc(0, 2, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Ethereal Soft Glow Aura
    ctx.fillStyle = 'rgba(94, 234, 212, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawPaperTwilightMist(ctx, cam, t) {
  for (let i = 0; i < 2; i++) {
    const mx = ((i * 500 + t * 10) % (cam.w + 400)) - 200;
    const my = 80 + i * 140;
    const grad = ctx.createRadialGradient(mx, my, 20, mx, my, 180);
    grad.addColorStop(0, 'rgba(45, 212, 191, 0.06)');
    grad.addColorStop(1, 'rgba(18, 22, 36, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cam.w, cam.h);
  }
}

// ============================================================================
// 7C. STYLE 7: DARK GHIBLI - BIOLUMINESZENTER SPOREN-DSCHUNGEL (Nausicaä 2.5D)
// ============================================================================
function renderStylePaperSpores(ctx, world, cam, player, t, opts) {
  const ts = 16;
  const startX = Math.max(0, Math.floor(cam.x / ts));
  const endX = Math.min(world.width, Math.ceil((cam.x + cam.w) / ts) + 1);
  const startY = Math.max(0, Math.floor(cam.y / ts));
  const endY = Math.min(world.height, Math.ceil((cam.y + cam.h) / ts) + 1);

  // Deep spore-violet base
  ctx.fillStyle = '#0a0714';
  ctx.fillRect(0, 0, cam.w, cam.h);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // 1. Bioluminescent Cutout Paper Ground (Luminous Cut Edges!)
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = world.getTile(x, y);
      const px = x * ts;
      const py = y * ts;

      let baseCol = '#0d2224'; // Spore Teal Moss
      let glowEdge = '#22d3ee'; // Neon Cyan Cut Edge

      if (tile === TILE.SWAMP || tile === TILE.SWAMP_WATER) {
        baseCol = '#170b24';
        glowEdge = '#f472b6'; // Neon Magenta
      } else if (tile === TILE.SAND) {
        baseCol = '#332014'; // Warmer Sporen-Sand
        glowEdge = '#fbbf24'; // Amber Spore Dust
      } else if (tile === TILE.QUICKSAND) {
        baseCol = '#1a0c06'; // Tiefes Schlickloch
        glowEdge = '#ea580c'; // Gefahren-Glow
      } else if (tile === TILE.SNOW) {
        baseCol = '#251b3d';
        glowEdge = '#a855f7';
      } else if (tile === TILE.WATER) {
        baseCol = '#08121c';
        glowEdge = 'rgba(34, 211, 238, 0.4)';
      } else if (tile === TILE.VOID) {
        baseCol = '#140a26';
        glowEdge = '#c084fc';
      } else if (tile === TILE.VOID_LAKE) {
        baseCol = '#020005'; // Kosmischer Abgrund
        glowEdge = '#f43f5e'; // Tödliche Rift-Kante
      }

      ctx.fillStyle = baseCol;
      ctx.fillRect(px, py, ts, ts);

      // Glowing paper cut edge
      if (tile !== TILE.WATER && tile !== TILE.VOID_LAKE) {
        ctx.fillStyle = glowEdge;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(px, py, ts, 1);
        ctx.globalAlpha = 1.0;
      } else if (tile === TILE.VOID_LAKE) {
        // Glühender Ereignishorizont des Leerenmeers
        ctx.fillStyle = glowEdge;
        ctx.globalAlpha = 0.8 + Math.sin(t * 3 + x) * 0.2;
        ctx.fillRect(px, py, ts, 1.5);
        ctx.globalAlpha = 1.0;
      }
    }
  }

  // 2. Y-Sorted Giant Paper Mushrooms & Player
  const entities = [];
  for (const tr of world.trees) {
    if (tr.tileX >= startX - 2 && tr.tileX <= endX + 2 && tr.tileY >= startY - 2 && tr.tileY <= endY + 2) {
      entities.push({ type: 'tree', y: tr.y, data: tr });
    }
  }
  entities.push({ type: 'player', y: player.y, data: player });
  entities.sort((a, b) => a.y - b.y);

  for (const ent of entities) {
    if (ent.type === 'player') {
      drawPaperSporesPlayer(ctx, player, t);
    } else {
      drawPaperGiantMushroom(ctx, ent.data, t);
    }
  }

  // 3. Floating Bioluminescent Spores (Drifting upwards like in Nausicaä)
  drawPaperSporesParticles(ctx, cam, t);

  applyTimeOfDayTint(ctx, cam, opts.timeOfDay);

  ctx.restore();
}

function drawPaperGiantMushroom(ctx, tree, t) {
  const sway = Math.sin(t * 2.0 + tree.x * 0.12) * 1.5;
  const tx = tree.x;
  const ty = tree.y;
  const cx = tx + sway;
  const cy = ty - 28;

  // Ground drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(tx, ty, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stalk (Segmented paper stem)
  ctx.fillStyle = '#211530';
  ctx.fillRect(tx - 3, ty - 16, 6, 16);
  ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
  ctx.fillRect(tx - 2, ty - 14, 4, 2);
  ctx.fillRect(tx - 2, ty - 8, 4, 2);

  // Soft Radial Glow Aura behind cap
  const aura = ctx.createRadialGradient(cx, cy, 5, cx, cy, 28);
  aura.addColorStop(0, 'rgba(244, 114, 182, 0.22)');
  aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fill();

  // Giant Layered Mushroom Cap
  ctx.fillStyle = '#3b1845';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6b2172';
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 16, Math.PI, 0);
  ctx.fill();

  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Bioluminescent Glowing Dots
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(cx - 7, cy - 8, 2, 0, Math.PI * 2);
  ctx.arc(cx + 6, cy - 7, 2, 0, Math.PI * 2);
  ctx.arc(cx, cy - 12, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPaperSporesPlayer(ctx, player, t) {
  const px = Math.round(player.x);
  const py = Math.round(player.y);
  const bob = player.isMoving ? Math.sin(t * 10) * 1.5 : 0;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(px + 1, py + 2, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Coat / Hazmat Poncho
  ctx.fillStyle = '#1c2838';
  ctx.beginPath();
  ctx.moveTo(px, py - 20 + bob);
  ctx.lineTo(px + 7, py - 5 + bob);
  ctx.lineTo(px - 7, py - 5 + bob);
  ctx.closePath();
  ctx.fill();

  // Glowing Spore Collector Backpack on back
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(px - 6, py - 16 + bob, 3, 7);
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 6;
  ctx.fillRect(px - 5, py - 14 + bob, 2, 4);
  ctx.shadowBlur = 0;

  // Respirator / Mask
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(px, py - 17 + bob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f472b6';
  ctx.fillRect(px - 2, py - 18 + bob, 4, 2);
}

function drawPaperSporesParticles(ctx, cam, t) {
  for (let i = 0; i < 40; i++) {
    const px = ((i * 67 + Math.sin(t * 0.5 + i) * 25) % cam.w) + cam.x;
    const py = (cam.h - ((i * 83 + t * 35) % cam.h)) + cam.y;
    const pulse = Math.sin(t * 4 + i) * 0.3 + 0.7;

    ctx.fillStyle = i % 2 === 0 ? `rgba(34, 211, 238, ${pulse * 0.85})` : `rgba(244, 114, 182, ${pulse * 0.85})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================================
// 7D. STYLE 8: DARK GHIBLI - CHIHIRO LAMPION-DÄMMERUNG (Spirited Away 2.5D Kiri-e)
// ============================================================================
function renderStylePaperLantern(ctx, world, cam, player, t, opts) {
  const ts = 16;
  const startX = Math.max(0, Math.floor(cam.x / ts));
  const endX = Math.min(world.width, Math.ceil((cam.x + cam.w) / ts) + 1);
  const startY = Math.max(0, Math.floor(cam.y / ts));
  const endY = Math.min(world.height, Math.ceil((cam.y + cam.h) / ts) + 1);

  // Japanese Shadowbox Indigo base
  ctx.fillStyle = '#100b17';
  ctx.fillRect(0, 0, cam.w, cam.h);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // 1. Dark Cardstock Ground Layers
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = world.getTile(x, y);
      const px = x * ts;
      const py = y * ts;

      let cardCol = '#1a1324';
      if (tile === TILE.DIRT) cardCol = '#291b22';
      else if (tile === TILE.WATER || tile === TILE.SWAMP_WATER) cardCol = '#0d0e1a';
      else if (tile === TILE.SAND) cardCol = '#33232a';
      else if (tile === TILE.SNOW) cardCol = '#382b45';
      else if (tile === TILE.BRIDGE) cardCol = '#4d1e1c';

      ctx.fillStyle = cardCol;
      ctx.fillRect(px, py, ts, ts);

      if (tile === TILE.BRIDGE) {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(px, py, ts, 2);
        ctx.fillRect(px, py + ts - 2, ts, 2);
      }
    }
  }

  // 2. WARM LANTERN LIGHT CONES CAST ONTO THE PAPER FLOOR!
  const visibleTrees = world.trees.filter(tr =>
    tr.tileX >= startX - 3 && tr.tileX <= endX + 3 && tr.tileY >= startY - 3 && tr.tileY <= endY + 3
  );

  for (const tr of visibleTrees) {
    const lx = tr.x + 8;
    const ly = tr.y - 14;
    const fPulse = Math.sin(t * 8 + tr.x) * 2;
    const lGrad = ctx.createRadialGradient(lx, ly, 4, lx, ly, 45 + fPulse);
    lGrad.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
    lGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.12)');
    lGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, 45 + fPulse, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player's handheld lantern ground glow
  const pGrad = ctx.createRadialGradient(player.x + 6, player.y - 8, 4, player.x + 6, player.y - 8, 70);
  pGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
  pGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.16)');
  pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.arc(player.x + 6, player.y - 8, 70, 0, Math.PI * 2);
  ctx.fill();

  // 3. Y-Sorted Kiri-e Trees, Lanterns, and Player
  const entities = [];
  for (const tr of visibleTrees) {
    entities.push({ type: 'tree', y: tr.y, data: tr });
  }
  entities.push({ type: 'player', y: player.y, data: player });
  entities.sort((a, b) => a.y - b.y);

  for (const ent of entities) {
    if (ent.type === 'player') {
      drawPaperLanternPlayer(ctx, player, t);
    } else {
      drawPaperLanternTree(ctx, ent.data, t);
    }
  }

  // 4. Floating Ofuda Talismans & Lantern Embers
  drawPaperOfudaAndEmbers(ctx, cam, t);

  applyTimeOfDayTint(ctx, cam, opts.timeOfDay);

  ctx.restore();
}

function drawPaperLanternTree(ctx, tree, t) {
  const sway = Math.sin(t * 1.5 + tree.x * 0.1) * 1.5;
  const tx = tree.x;
  const ty = tree.y;
  const cx = tx + sway;
  const cy = ty - 26;

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(tx, ty, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Kiri-e Black Paper Tree Trunk & Branches
  ctx.fillStyle = '#170f21';
  ctx.beginPath();
  ctx.moveTo(tx - 3, ty);
  ctx.lineTo(tx - 2, ty - 18);
  ctx.lineTo(tx + 2, ty - 18);
  ctx.lineTo(tx + 3, ty);
  ctx.closePath();
  ctx.fill();

  // Foliage
  ctx.fillStyle = '#241432';
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#331d45';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 3, 11, 0, Math.PI * 2);
  ctx.fill();

  // Hanging red lantern
  const lSway = Math.sin(t * 3.0 + tree.x * 0.2) * 2;
  const lx = cx + 9 + lSway;
  const ly = cy + 12;

  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 7, cy);
  ctx.lineTo(lx, ly - 6);
  ctx.stroke();

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(lx - 4, ly - 6, 8, 10, 2) : ctx.rect(lx - 4, ly - 6, 8, 10);
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(lx - 2, ly - 3, 4, 4);

  ctx.fillStyle = '#181021';
  ctx.fillRect(lx - 5, ly - 7, 10, 2);
  ctx.fillRect(lx - 5, ly + 4, 10, 2);

  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lx, ly + 6);
  ctx.lineTo(lx, ly + 10);
  ctx.stroke();
}

function drawPaperLanternPlayer(ctx, player, t) {
  const px = Math.round(player.x);
  const py = Math.round(player.y);
  const bob = player.isMoving ? Math.sin(t * 10) * 1.5 : 0;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(px + 1, py + 2, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chihiro Spirit Town Traveler
  ctx.fillStyle = '#20162b';
  ctx.beginPath();
  ctx.moveTo(px, py - 20 + bob);
  ctx.lineTo(px + 6, py - 4 + bob);
  ctx.lineTo(px - 6, py - 4 + bob);
  ctx.closePath();
  ctx.fill();

  // Red Obi Sash
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(px - 5, py - 12 + bob, 10, 3);

  // Papercraft Face / Shadow Mask
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(px, py - 18 + bob, 4, 0, Math.PI * 2);
  ctx.fill();

  // Handheld lantern on bamboo pole
  const poleX = px + 6;
  const poleY = py - 14 + bob;
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px + 2, py - 8 + bob);
  ctx.lineTo(poleX, poleY);
  ctx.stroke();

  const fScale = 1 + Math.sin(t * 15) * 0.15;
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.arc(poleX, poleY + 4, 4 * fScale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(poleX, poleY + 4, 2 * fScale, 0, Math.PI * 2);
  ctx.fill();
}

function drawPaperOfudaAndEmbers(ctx, cam, t) {
  for (let i = 0; i < 10; i++) {
    const ox = ((i * 113 + t * 25) % cam.w) + cam.x;
    const oy = ((i * 71 + Math.sin(t + i) * 30) % cam.h) + cam.y;
    const rot = Math.sin(t * 2 + i) * 0.4;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(rot);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-3, -6, 6, 12);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-1.5, -3, 3, 6);

    ctx.restore();
  }

  for (let i = 0; i < 20; i++) {
    const ex = ((i * 89 + t * 20) % cam.w) + cam.x;
    const ey = (cam.h - ((i * 97 + t * 30) % cam.h)) + cam.y;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
    ctx.fillRect(Math.round(ex), Math.round(ey), 1.5, 1.5);
  }
}

// ============================================================================
// 8. ATMOSPHERE & TIME-OF-DAY TINT UTILITY
// ============================================================================
function applyTimeOfDayTint(ctx, cam, timeOfDay) {
  if (timeOfDay === 'sunset') {
    ctx.fillStyle = 'rgba(255, 120, 50, 0.18)';
    ctx.fillRect(cam.x, cam.y, cam.w, cam.h);
  } else if (timeOfDay === 'night') {
    ctx.fillStyle = 'rgba(10, 20, 60, 0.42)';
    ctx.fillRect(cam.x, cam.y, cam.w, cam.h);
  }
}

// ============================================================================
// 9. SHOWROOM MAIN APPLICATION CONTROLLER
// ============================================================================
class ShowroomApp {
  constructor() {
    this.world = new ShowroomWorld(110, 80);

    // Active state
    this.currentMode = 'gallery'; // 'gallery' or 'playground'
    this.currentStyle = 'retro';   // retro, grimdark, cyber, ghibli, isometric

    // Camera & Player for Playground
    this.player = {
      x: 30 * 16,
      y: 42 * 16,
      isMoving: false,
      speed: 130
    };

    this.input = {
      up: false, down: false, left: false, right: false, sprint: false
    };

    this.settings = {
      timeOfDay: 'day',
      zoom: 1.5,
      crt: false,
      particles: true
    };

    // DOM Elements
    this.galleryView = document.getElementById('gallery-view');
    this.playgroundView = document.getElementById('playground-view');
    this.bestiaryView = document.getElementById('bestiary-view');
    this.btnModeGallery = document.getElementById('btn-mode-gallery');
    this.btnModePlayground = document.getElementById('btn-mode-playground');
    this.btnModeBestiary = document.getElementById('btn-mode-bestiary');
    this.headerStyleSwitcher = document.getElementById('header-style-switcher');
    this.playgroundCanvas = document.getElementById('playground-canvas');
    this.playgroundCtx = this.playgroundCanvas.getContext('2d');
    this.crtOverlay = document.getElementById('crt-overlay');

    this.bestiaryGrid = document.getElementById('bestiary-grid');
    this.bestiaryManager = this.bestiaryGrid ? new BestiaryManager(this.bestiaryGrid) : null;

    // Mini preview canvases in Gallery
    this.previewCanvases = {
      retro: document.getElementById('canvas-preview-retro'),
      grimdark: document.getElementById('canvas-preview-grimdark'),
      cyber: document.getElementById('canvas-preview-cyber'),
      ghibli: document.getElementById('canvas-preview-ghibli'),
      isometric: document.getElementById('canvas-preview-isometric'),
      paper_mononoke: document.getElementById('canvas-preview-paper_mononoke'),
      paper_spores: document.getElementById('canvas-preview-paper_spores'),
      paper_lantern: document.getElementById('canvas-preview-paper_lantern')
    };

    this.animTime = 0;
    this.lastTime = performance.now();

    this.initEvents();
    this.resize();
    this.updateActiveStyleUI();
    this.loop();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    // Navigation buttons
    this.btnModeGallery.addEventListener('click', () => this.setMode('gallery'));
    this.btnModePlayground.addEventListener('click', () => this.setMode('playground'));
    if (this.btnModeBestiary) {
      this.btnModeBestiary.addEventListener('click', () => this.setMode('bestiary'));
    }

    // Quick style pill buttons in header
    document.querySelectorAll('.style-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const style = btn.getAttribute('data-style');
        this.setStyle(style);
      });
    });

    // Keyboard controls for movement & 1-8 style hotkeys
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.up = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.down = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.sprint = true;

      // 1-8 Style Hotkeys
      if (e.code === 'Digit1') this.setStyle('retro');
      if (e.code === 'Digit2') this.setStyle('grimdark');
      if (e.code === 'Digit3') this.setStyle('cyber');
      if (e.code === 'Digit4') this.setStyle('ghibli');
      if (e.code === 'Digit5') this.setStyle('isometric');
      if (e.code === 'Digit6') this.setStyle('paper_mononoke');
      if (e.code === 'Digit7') this.setStyle('paper_spores');
      if (e.code === 'Digit8') this.setStyle('paper_lantern');
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.up = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.down = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.sprint = false;
    });
  }

  resize() {
    this.playgroundCanvas.width = window.innerWidth;
    this.playgroundCanvas.height = window.innerHeight - 64;
    this.playgroundCtx.imageSmoothingEnabled = false;
  }

  setMode(mode) {
    this.currentMode = mode;
    if (mode === 'gallery') {
      this.galleryView.classList.remove('hidden');
      this.playgroundView.classList.add('hidden');
      if (this.bestiaryView) this.bestiaryView.classList.add('hidden');
      this.headerStyleSwitcher.classList.add('hidden');
      this.btnModeGallery.classList.add('active');
      this.btnModePlayground.classList.remove('active');
      if (this.btnModeBestiary) this.btnModeBestiary.classList.remove('active');
    } else if (mode === 'playground') {
      this.galleryView.classList.add('hidden');
      this.playgroundView.classList.remove('hidden');
      if (this.bestiaryView) this.bestiaryView.classList.add('hidden');
      this.headerStyleSwitcher.classList.remove('hidden');
      this.btnModeGallery.classList.remove('active');
      this.btnModePlayground.classList.add('active');
      if (this.btnModeBestiary) this.btnModeBestiary.classList.remove('active');
      this.resize();
    } else if (mode === 'bestiary') {
      this.galleryView.classList.add('hidden');
      this.playgroundView.classList.add('hidden');
      if (this.bestiaryView) this.bestiaryView.classList.remove('hidden');
      this.headerStyleSwitcher.classList.add('hidden');
      this.btnModeGallery.classList.remove('active');
      this.btnModePlayground.classList.remove('active');
      if (this.btnModeBestiary) this.btnModeBestiary.classList.add('active');
    }
  }

  openPlayground(style) {
    this.setStyle(style);
    this.setMode('playground');
  }

  setStyle(style) {
    if (!STYLE_META[style]) return;
    this.currentStyle = style;

    // Update Pills
    document.querySelectorAll('.style-pill').forEach(btn => {
      const match = btn.getAttribute('data-style') === style;
      btn.classList.toggle('active', match);
      if (match) {
        btn.style.setProperty('--active-color', STYLE_META[style].activeColor);
      }
    });

    this.updateActiveStyleUI();
  }

  updateActiveStyleUI() {
    const meta = STYLE_META[this.currentStyle];
    if (!meta) return;

    const nameEl = document.getElementById('active-style-name');
    const badgeEl = document.getElementById('active-style-badge');
    const descEl = document.getElementById('active-style-desc');
    const paletteEl = document.getElementById('active-style-palette');

    if (nameEl) nameEl.textContent = meta.name;
    if (badgeEl) {
      badgeEl.textContent = meta.badge;
      badgeEl.className = `card-badge ${meta.badgeClass}`;
    }
    if (descEl) descEl.textContent = meta.desc;

    if (paletteEl) {
      paletteEl.innerHTML = '';
      meta.palette.forEach(col => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.background = col;
        swatch.title = col;
        paletteEl.appendChild(swatch);
      });
    }
  }

  teleportTo(biome) {
    const coords = {
      grass: { x: 30 * 16, y: 42 * 16 },
      desert: { x: 22 * 16, y: 64 * 16 },
      snow: { x: 78 * 16, y: 22 * 16 },
      swamp: { x: 68 * 16, y: 62 * 16 },
      void: { x: 94 * 16, y: 56 * 16 }
    };

    if (coords[biome]) {
      this.player.x = coords[biome].x;
      this.player.y = coords[biome].y;

      document.querySelectorAll('.biome-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-biome') === biome);
      });
    }
  }

  setTimeOfDay(val) {
    this.settings.timeOfDay = val;
  }

  setZoom(val) {
    this.settings.zoom = val;
  }

  toggleCRT(checked) {
    this.settings.crt = checked;
    this.crtOverlay.classList.toggle('active', checked);
  }

  toggleParticles(checked) {
    this.settings.particles = checked;
  }

  update(dt) {
    this.animTime += dt;

    if (this.currentMode === 'bestiary') {
      if (this.bestiaryManager) this.bestiaryManager.update(dt);
      return;
    }

    if (this.currentMode === 'playground') {
      let dx = 0;
      let dy = 0;
      if (this.input.up) dy -= 1;
      if (this.input.down) dy += 1;
      if (this.input.left) dx -= 1;
      if (this.input.right) dx += 1;

      this.player.isMoving = dx !== 0 || dy !== 0;

      if (this.player.isMoving) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;

        const spd = this.player.speed * (this.input.sprint ? 1.6 : 1.0);
        const nextX = this.player.x + dx * spd * dt;
        const nextY = this.player.y + dy * spd * dt;

        // Collision check
        const tx = Math.floor(nextX / 16);
        const ty = Math.floor(nextY / 16);
        if (!this.world.isSolid(tx, ty)) {
          this.player.x = nextX;
          this.player.y = nextY;
        }
      }
    }
  }

  render() {
    const t = this.animTime;

    // 1. RENDER PREVIEW CANVASES IN GALLERY MODE
    if (this.currentMode === 'gallery') {
      const pCam = { w: 400, h: 220, x: 28 * 16 - 120, y: 40 * 16 - 80 };
      const previewPlayer = { x: 28 * 16, y: 41 * 16, isMoving: true };

      // Render Style 1: Retro
      if (this.previewCanvases.retro) {
        const ctx1 = this.previewCanvases.retro.getContext('2d');
        ctx1.imageSmoothingEnabled = false;
        renderStyleRetro(ctx1, this.world, pCam, previewPlayer, t, { particles: true, timeOfDay: 'day' });
      }

      // Render Style 2: Grimdark
      if (this.previewCanvases.grimdark) {
        const ctx2 = this.previewCanvases.grimdark.getContext('2d');
        ctx2.imageSmoothingEnabled = false;
        renderStyleGrimdark(ctx2, this.world, pCam, previewPlayer, t, { particles: true, timeOfDay: 'night' });
      }

      // Render Style 3: Cyber
      if (this.previewCanvases.cyber) {
        const ctx3 = this.previewCanvases.cyber.getContext('2d');
        ctx3.imageSmoothingEnabled = false;
        renderStyleCyber(ctx3, this.world, pCam, previewPlayer, t, { particles: true, timeOfDay: 'day' });
      }

      // Render Style 4: Ghibli
      if (this.previewCanvases.ghibli) {
        const ctx4 = this.previewCanvases.ghibli.getContext('2d');
        ctx4.imageSmoothingEnabled = false;
        renderStyleGhibli(ctx4, this.world, pCam, previewPlayer, t, { particles: true, timeOfDay: 'day' });
      }

      // Render Style 5: Isometric
      if (this.previewCanvases.isometric) {
        const ctx5 = this.previewCanvases.isometric.getContext('2d');
        ctx5.imageSmoothingEnabled = false;
        renderStyleIsometric(ctx5, this.world, { w: 400, h: 220 }, previewPlayer, t, { particles: true, timeOfDay: 'day' });
      }

      // Render Style 6: Dark Ghibli Mononoke Papercraft
      if (this.previewCanvases.paper_mononoke) {
        const ctx6 = this.previewCanvases.paper_mononoke.getContext('2d');
        ctx6.imageSmoothingEnabled = false;
        renderStylePaperMononoke(ctx6, this.world, pCam, previewPlayer, t, { particles: true, timeOfDay: 'night' });
      }

      // Render Style 7: Dark Ghibli Sporen-Dschungel Papercraft
      if (this.previewCanvases.paper_spores) {
        const ctx7 = this.previewCanvases.paper_spores.getContext('2d');
        ctx7.imageSmoothingEnabled = false;
        renderStylePaperSpores(ctx7, this.world, pCam, previewPlayer, t, { particles: true, timeOfDay: 'night' });
      }

      // Render Style 8: Dark Ghibli Lampion-Dämmerung Papercraft
      if (this.previewCanvases.paper_lantern) {
        const ctx8 = this.previewCanvases.paper_lantern.getContext('2d');
        ctx8.imageSmoothingEnabled = false;
        renderStylePaperLantern(ctx8, this.world, pCam, previewPlayer, t, { particles: true, timeOfDay: 'night' });
      }
    }

    // 2. RENDER PLAYGROUND CANVAS
    if (this.currentMode === 'playground') {
      const cw = this.playgroundCanvas.width;
      const ch = this.playgroundCanvas.height;
      const zoom = this.settings.zoom;

      const camW = cw / zoom;
      const camH = ch / zoom;
      const camX = this.player.x - camW / 2;
      const camY = this.player.y - camH / 2;

      const cam = { x: camX, y: camY, w: camW, h: camH };

      this.playgroundCtx.save();
      this.playgroundCtx.scale(zoom, zoom);

      if (this.currentStyle === 'retro') {
        renderStyleRetro(this.playgroundCtx, this.world, cam, this.player, t, this.settings);
      } else if (this.currentStyle === 'grimdark') {
        renderStyleGrimdark(this.playgroundCtx, this.world, cam, this.player, t, this.settings);
      } else if (this.currentStyle === 'cyber') {
        renderStyleCyber(this.playgroundCtx, this.world, cam, this.player, t, this.settings);
      } else if (this.currentStyle === 'ghibli') {
        renderStyleGhibli(this.playgroundCtx, this.world, cam, this.player, t, this.settings);
      } else if (this.currentStyle === 'isometric') {
        renderStyleIsometric(this.playgroundCtx, this.world, { w: camW, h: camH }, this.player, t, this.settings);
      } else if (this.currentStyle === 'paper_mononoke') {
        renderStylePaperMononoke(this.playgroundCtx, this.world, cam, this.player, t, this.settings);
      } else if (this.currentStyle === 'paper_spores') {
        renderStylePaperSpores(this.playgroundCtx, this.world, cam, this.player, t, this.settings);
      } else if (this.currentStyle === 'paper_lantern') {
        renderStylePaperLantern(this.playgroundCtx, this.world, cam, this.player, t, this.settings);
      }

      this.playgroundCtx.restore();
    }
  }

  loop() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();

    requestAnimationFrame(() => this.loop());
  }
}

// Start Showroom on DOMContentLoaded
let showroom = null;
window.addEventListener('DOMContentLoaded', () => {
  showroom = new ShowroomApp();
  window.showroom = showroom;
});
