(function() {

// --- js/constants.js ---
// 16x16 Tile Size for fine, detailed pixel-art and organic shapes
const TILE_SIZE = 16;

// World Dimensions in Tiles (130 x 90 = 2080 x 1440 px)
const MAP_WIDTH = 130;
const MAP_HEIGHT = 90;

// Dimensions / Worlds
const DIMENSIONS = {
  OVERWORLD: 'overworld',
  CAVES: 'caves',
  CLOUDS: 'clouds'
};

// Biome Names
const BIOMES = {
  GRASSLAND: 'Grasland & Wald',
  DESERT: 'Wüste & Treibsand',
  SNOW: 'Schnee & Eislande',
  SWAMP: 'Düsterer Sumpf',
  VOID: 'Die Leere (Void)',
  CAVES_MAIN: 'Tiefenhöhlen & Unterirdischer See',
  CAVES_SUB: 'Kristall-Unterhöhle',
  CAVES_GROTTO: 'Versteckte Grotte',
  CLOUDS: 'Rosa Wolkenreich'
};

// Ground Tiles (Base Terrain)
const TILES = {
  GRASS: 1,
  DIRT: 2,
  SAND: 3,
  SNOW: 4,
  SWAMP_GROUND: 5,
  VOID_GROUND: 6,
  WATER: 10,
  SWAMP_WATER: 11,
  QUICKSAND: 12,
  VOID_LAKE: 13,
  BRIDGE_H: 14,
  BRIDGE_V: 15,

  // Cloud World (Rosa Wolken & Regenbogen)
  CLOUD_PINK: 20,
  RAINBOW_BRIDGE_H: 21,
  RAINBOW_BRIDGE_V: 22,
  SKY_ABYSS: 23, // Freier Himmel (beim Betreten fällt man auf die Oberwelt zurück)

  // Cave System (Unterirdische Höhlen & Seen)
  CAVE_FLOOR: 30,
  CAVE_WALL: 31,
  CAVE_WATER: 32, // Unterirdischer See
  CAVE_HOLE_EXIT: 33, // Lichtschacht / Aufstieg zur Oberwelt
  CAVE_LADDER_DOWN: 34, // Abgang zur Unterhöhle
  CAVE_LADDER_UP: 35 // Aufgang aus Unterhöhle
};

// Objects & Decorations (Sit on top of ground with TRANSPARENT background)
const OBJECTS = {
  NONE: 0,
  ROCK_STONE: 1,
  ROCK_ICE: 2,
  ROCK_VOID: 3,
  BUSH: 4,
  CACTUS: 5,
  MUSHROOM: 6,
  TREE_TRUNK: 7,
  FERN: 8,
  FALLEN_LOG: 9,
  FOREST_FLOWERS: 10,
  MUSHROOM_BROWN: 11,
  STONE_TORO: 12,
  TORII_GATE: 13,
  TRAMPOLINE: 14,
  SHRINE: 15,
  CAVE_ENTRANCE: 16,
  STALAGMITE: 17,
  GLOW_CRYSTAL: 18,
  CAVE_MUSHROOM_GLOW: 19,
  TORCH: 20,
  TRAINING_DUMMY: 21
};

// Tree species & types for organic diverse forests
const TREES = {
  OAK: 1,
  PINE: 2,
  BIRCH: 3,
  BLOSSOM: 4,
  AUTUMN: 5,
  SNOWY_PINE: 6,
  SWAMP_WILLOW: 7,
  PALM: 8,
  SAPLING: 9,
  DEADWOOD: 10
};

// Terrain layer hierarchy for organic edge transitions (higher overlaps lower)
const TILE_LAYER_ORDER = {
  [TILES.WATER]: 0,
  [TILES.SWAMP_WATER]: 1,
  [TILES.VOID_LAKE]: 2,
  [TILES.QUICKSAND]: 3,
  [TILES.SAND]: 10,
  [TILES.DIRT]: 15,
  [TILES.SWAMP_GROUND]: 18,
  [TILES.GRASS]: 20,
  [TILES.SNOW]: 25,
  [TILES.VOID_GROUND]: 30,
  [TILES.BRIDGE_H]: 40,
  [TILES.BRIDGE_V]: 40
};

// Overlay / Canopy
const CANOPY = {
  NONE: 0,
  TREE_CROWN: 1
};

// Elevation Levels (Höhenebenen: -1 = Loch/Senke, 0 = Boden, 1 = Podest Stufe 1, 2 = Podest Stufe 2)
const ELEVATION = {
  HOLE: -1,
  GROUND: 0,
  LEVEL_1: 1,
  LEVEL_2: 2
};

// Ramps / Slopes (Schrägen / Aufgänge zwischen Ebenen)
const RAMPS = {
  NONE: 0,
  UP_NORTH: 1, // Führt nach Norden bergauf (nach Süden bergab)
  UP_SOUTH: 2, // Führt nach Süden bergauf (nach Norden bergab)
  UP_WEST: 3,  // Führt nach Westen bergauf (nach Osten bergab)
  UP_EAST: 4   // Führt nach Osten bergauf (nach Westen bergab)
};

const ELEVATION_PIXEL_OFFSET = 7; // Visuelle Kantenhöhe in Pixeln pro Stufe

// Ground Tile Properties
const TILE_PROPS = {
  [TILES.GRASS]:        { name: 'Gras', solid: false, speedMod: 1.0, biome: BIOMES.GRASSLAND, minimapColor: '#489c3e' },
  [TILES.DIRT]:         { name: 'Erdboden', solid: false, speedMod: 1.0, biome: BIOMES.GRASSLAND, minimapColor: '#7a5433' },
  [TILES.SAND]:         { name: 'Wüstensand', solid: false, speedMod: 1.0, biome: BIOMES.DESERT, minimapColor: '#dfb867' },
  [TILES.SNOW]:         { name: 'Schnee', solid: false, speedMod: 1.0, biome: BIOMES.SNOW, minimapColor: '#eaf1f8' },
  [TILES.SWAMP_GROUND]: { name: 'Sumpfboden', solid: false, speedMod: 0.85, biome: BIOMES.SWAMP, minimapColor: '#445434' },
  [TILES.VOID_GROUND]:  { name: 'Leerenboden', solid: false, speedMod: 1.0, biome: BIOMES.VOID, minimapColor: '#301348' },
  [TILES.WATER]:        { name: 'Wasser', solid: true, speedMod: 0.0, biome: BIOMES.GRASSLAND, minimapColor: '#2670ba' },
  [TILES.SWAMP_WATER]:  { name: 'Sumpfwasser', solid: true, speedMod: 0.0, biome: BIOMES.SWAMP, minimapColor: '#263b28' },
  [TILES.QUICKSAND]:    { name: 'Treibsand', solid: false, speedMod: 0.35, biome: BIOMES.DESERT, minimapColor: '#a67b36' },
  [TILES.VOID_LAKE]:    { name: 'Leeren-Abgrund', solid: false, deadly: true, speedMod: 0.0, biome: BIOMES.VOID, minimapColor: '#0c0214' },
  [TILES.BRIDGE_H]:     { name: 'Holzbrücke', solid: false, speedMod: 1.0, biome: BIOMES.GRASSLAND, minimapColor: '#8a552b' },
  [TILES.BRIDGE_V]:     { name: 'Holzbrücke', solid: false, speedMod: 1.0, biome: BIOMES.GRASSLAND, minimapColor: '#8a552b' },
  // Cloud World
  [TILES.CLOUD_PINK]:        { name: 'Rosa Wolke', solid: false, speedMod: 1.0, biome: BIOMES.CLOUDS, minimapColor: '#f472b6' },
  [TILES.RAINBOW_BRIDGE_H]:  { name: 'Regenbogenbrücke', solid: false, speedMod: 1.15, biome: BIOMES.CLOUDS, minimapColor: '#facc15' },
  [TILES.RAINBOW_BRIDGE_V]:  { name: 'Regenbogenbrücke', solid: false, speedMod: 1.15, biome: BIOMES.CLOUDS, minimapColor: '#facc15' },
  [TILES.SKY_ABYSS]:         { name: 'Freier Himmel', solid: false, fallZone: true, speedMod: 1.0, biome: BIOMES.CLOUDS, minimapColor: '#1e1b4b' },
  // Caves
  [TILES.CAVE_FLOOR]:        { name: 'Höhlenboden', solid: false, speedMod: 1.0, biome: BIOMES.CAVES_MAIN, minimapColor: '#334155' },
  [TILES.CAVE_WALL]:         { name: 'Höhlenwand', solid: true, speedMod: 0.0, biome: BIOMES.CAVES_MAIN, minimapColor: '#0f172a' },
  [TILES.CAVE_WATER]:        { name: 'Unterirdischer See', solid: true, speedMod: 0.0, biome: BIOMES.CAVES_MAIN, minimapColor: '#0ea5e9' },
  [TILES.CAVE_HOLE_EXIT]:    { name: 'Lichtschacht (Oberwelt)', solid: false, speedMod: 1.0, biome: BIOMES.CAVES_MAIN, minimapColor: '#fef08a' },
  [TILES.CAVE_LADDER_DOWN]:  { name: 'Abgang zur Unterhöhle', solid: false, speedMod: 1.0, biome: BIOMES.CAVES_MAIN, minimapColor: '#cbd5e1' },
  [TILES.CAVE_LADDER_UP]:    { name: 'Aufgang zur Haupthöhle', solid: false, speedMod: 1.0, biome: BIOMES.CAVES_SUB, minimapColor: '#cbd5e1' }
};

// Object Properties
const OBJ_PROPS = {
  [OBJECTS.ROCK_STONE]:          { solid: true,  name: 'Felsen' },
  [OBJECTS.ROCK_ICE]:            { solid: true,  name: 'Eisfelsen' },
  [OBJECTS.ROCK_VOID]:           { solid: true,  name: 'Leerenkristall' },
  [OBJECTS.BUSH]:                { solid: false, name: 'Busch' },
  [OBJECTS.CACTUS]:              { solid: true,  name: 'Kaktus' },
  [OBJECTS.MUSHROOM]:            { solid: false, name: 'Fliegenpilz' },
  [OBJECTS.MUSHROOM_BROWN]:      { solid: false, name: 'Waldpilze' },
  [OBJECTS.TREE_TRUNK]:          { solid: true,  name: 'Baumstumpf' },
  [OBJECTS.FERN]:                { solid: false, name: 'Wald-Farn' },
  [OBJECTS.FALLEN_LOG]:          { solid: true,  name: 'Moosiger Holzstamm' },
  [OBJECTS.FOREST_FLOWERS]:      { solid: false, name: 'Waldblumen' },
  [OBJECTS.STONE_TORO]:          { solid: true,  name: 'Steinlaterne (Tōrō)' },
  [OBJECTS.TORII_GATE]:          { solid: false, name: 'Torii-Schreintor' },
  [OBJECTS.TRAMPOLINE]:          { solid: false, name: 'Bambus-Trampolin' },
  [OBJECTS.SHRINE]:              { solid: true,  name: 'Uralter Geister-Schrein' },
  [OBJECTS.CAVE_ENTRANCE]:       { solid: false, name: 'Höhlenschlund' },
  [OBJECTS.STALAGMITE]:          { solid: true,  name: 'Tropfstein / Stalagmit' },
  [OBJECTS.GLOW_CRYSTAL]:        { solid: true,  name: 'Fluoreszierender Kristall' },
  [OBJECTS.CAVE_MUSHROOM_GLOW]:  { solid: false, name: 'Leuchtender Höhlenpilz' },
  [OBJECTS.TRAINING_DUMMY]:      { solid: true,  name: 'Trainingspuppe' }
};

// Player Settings for 16px Scale
const PLAYER_CONFIG = {
  BASE_SPEED: 135,
  SPRINT_MULTIPLIER: 1.5,
  RADIUS: 5.5,
  MAX_HP: 100,
  CANOPY_REVEAL_RADIUS: 52 // Exakter, scharfer Sichtkreis
};

// Combat & Ability Settings (Zelda / Smash Bros Inspired)
const COMBAT_CONFIG = {
  // Dash
  DASH_DURATION: 0.18,
  DASH_SPEED: 265,
  DASH_COOLDOWN: 0.42,

  // Melee & Combo
  COMBO_WINDOW: 0.44,
  COMBO_SLASH_RADIUS: 28,
  COMBO_THRUST_RANGE: 48,
  COMBO_THRUST_WIDTH: 22,
  COMBO_THRUST_KNOCKBACK: 320,
  COMBO_THRUST_LUNGE: 18,
  COMBO_RECOVERY_PAUSE: 0.38,
  SPIN_RADIUS: 48,
  SPIN_CHARGE_TIME: 0.45,
  SPIN_KNOCKBACK: 290,

  // Shield
  SHIELD_MAX: 100,
  SHIELD_DRAIN_RATE: 22,
  SHIELD_RECHARGE_RATE: 20,
  SHIELD_RECHARGE_DELAY: 1.0, // 1.0s Pause bevor Schild auflädt (wenn nicht zerbrochen)
  SHIELD_STUN_TIME: 1.2,
  SHIELD_RADIUS: 22,

  // Ranged (Bow & Arrow)
  MAX_AMMO: 30,
  ARROW_SPEED: 330,
  ARROW_CHARGED_SPEED: 580,
  ARROW_RANGE: 165,
  ARROW_CHARGED_RANGE: 270,
  ARROW_CHARGE_TIME: 0.55,
  ARROW_PICKUP_RADIUS: 16
};

// Enemy AI & Gameplay Settings
const ENEMY_CONFIG = {
  DETECTION_RADIUS_DEFAULT: 135,
  DETECTION_RADIUS_SCOUT: 180,
  DEAGGRO_RADIUS: 240,
  WANDER_RADIUS: 42,
  PACK_CALL_RADIUS: 110,
  ATTACK_TELEGRAPH_TIME: 0.45,
  ATTACK_RECOVERY_TIME: 0.65
};

const LOOT_TYPES = {
  HEART: 'heart',
  ARROW: 'arrow',
  SPIRIT_GEM: 'spirit_gem'
};


// --- js/noise.js ---
// Fast 2D Simplex/Perlin-style Gradient Noise for organic terrain generation
class Noise2D {
  constructor(seed = 12345) {
    this.p = new Uint8Array(512);
    this.permutation = new Uint8Array(256);
    let s = seed;
    for (let i = 0; i < 256; i++) {
      s = (s * 16807) % 2147483647;
      this.permutation[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const temp = this.permutation[i];
      this.permutation[i] = this.permutation[j];
      this.permutation[j] = temp;
    }
    for (let i = 0; i < 512; i++) {
      this.p[i] = this.permutation[i & 255];
    }
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

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

  // Fractal Brownian Motion for rich multi-scale natural features
  fbm(x, y, octaves = 4, persistence = 0.5) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return total / maxValue;
  }
}


// --- js/characters.js ---
/**
 * Ocarina of Brawls - 15 Spielbare Helden-Skins
 * Kunststil: Süßer Dark Ghibli 2.5D Papercraft
 * Identische Spielmechanik, Hitboxen und Kampfaktionen für alle Helden.
 */

// LocalStorage Keys for chosen skin & player name
const STORAGE_KEY_SKIN = 'ocarina_player_skin';
const STORAGE_KEY_NAME = 'ocarina_player_name';

const RANDOM_HERO_NAMES = [
  'Ren', 'Kaito', 'Jiro', 'Taro', 'Sora', 'Kanna', 'Aoi', 'Mei',
  'Yuto', 'Poko', 'Kuro', 'Toru', 'Hayate', 'Shiratama', 'Mukuro',
  'Haku', 'Ashitaka', 'San', 'Chihiro', 'Howl', 'Nausicaä', 'Kiki',
  'Tsuki', 'Kohaku', 'Genji', 'Kagome', 'Rin', 'Botan', 'Shin'
];

function getRandomHeroName() {
  return RANDOM_HERO_NAMES[Math.floor(Math.random() * RANDOM_HERO_NAMES.length)];
}

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
}

function getSelectedSkin() {
  const storage = getStorage();
  if (storage) {
    try {
      const saved = storage.getItem(STORAGE_KEY_SKIN);
      if (saved && CHARACTERS_MAP[saved]) return saved;
    } catch (e) {
      // ignore
    }
  }
  return 'ren_twilight';
}

function setSelectedSkin(skinId) {
  const storage = getStorage();
  if (CHARACTERS_MAP[skinId] && storage) {
    try {
      storage.setItem(STORAGE_KEY_SKIN, skinId);
    } catch (e) {
      // ignore
    }
  }
}

function getSelectedPlayerName() {
  const storage = getStorage();
  if (storage) {
    try {
      const saved = storage.getItem(STORAGE_KEY_NAME);
      if (saved && saved.trim()) return saved.trim().slice(0, 20);
    } catch (e) {
      // ignore
    }
  }
  const currentSkin = getSelectedSkin();
  if (CHARACTERS_MAP[currentSkin]) {
    return CHARACTERS_MAP[currentSkin].name;
  }
  return 'Ren';
}

function setSelectedPlayerName(name) {
  const storage = getStorage();
  if (storage && typeof name === 'string') {
    try {
      const clean = name.trim().slice(0, 20) || 'Ren';
      storage.setItem(STORAGE_KEY_NAME, clean);
    } catch (e) {
      // ignore
    }
  }
}

// -----------------------------------------------------------------------------
// HELPER DRAWING FUNCTIONS (Papercraft Ghibli Aesthetics)
// -----------------------------------------------------------------------------
function getFacingOffsets(direction) {
  let dx = 0, dy = 0;
  if (direction === 'up') dy = -1;
  else if (direction === 'down') dy = 1;
  else if (direction === 'left') dx = -1;
  else if (direction === 'right') dx = 1;
  else if (direction === 'up-left') { dx = -0.7; dy = -0.7; }
  else if (direction === 'up-right') { dx = 0.7; dy = -0.7; }
  else if (direction === 'down-left') { dx = -0.7; dy = 0.7; }
  else if (direction === 'down-right') { dx = 0.7; dy = 0.7; }
  return { dx, dy };
}

function drawPaperDropShadow(ctx, px, py, rx = 8, ry = 3.5, alpha = 0.3) {
  ctx.save();
  ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function applyHitFlashTint(ctx, hitFlash, drawPath) {
  if (hitFlash > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
    drawPath();
    ctx.fill();
    ctx.restore();
  }
}

// -----------------------------------------------------------------------------
// 15 PROCEDURAL CHARACTER RENDERERS
// -----------------------------------------------------------------------------

// 1. REN (Schattengänger) - Original Main
function renderRenTwilight(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 8, 3.5, 0.32);

  // Paper Cloak
  ctx.fillStyle = '#1e2636';
  ctx.beginPath();
  ctx.moveTo(px, py - 20 + bob);
  ctx.lineTo(px + 7.5, py - 4 + bob);
  ctx.lineTo(px - 7.5, py - 4 + bob);
  ctx.closePath();
  ctx.fill();

  // Central Paper Fold Crease
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, py - 20 + bob);
  ctx.lineTo(px, py - 4 + bob);
  ctx.stroke();

  // Red Obi Sash
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(px - 5, py - 11 + bob, 10, 2.5);

  // Fluttering Ribbon
  const ribbon = Math.sin(animTime * 6) * 3;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px - 2, py - 10 + bob);
  ctx.lineTo(px - 6 + ribbon, py - 6 + bob);
  ctx.stroke();

  // Paper Cutout Mask / Face
  const faceX = px + dx * 1.2;
  const faceY = py - 18 + bob + dy * 0.8;
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(faceX, faceY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Cyan Spirit Eyes
  if (direction !== 'up') {
    ctx.fillStyle = '#2dd4bf';
    const eyeBaseX = faceX + dx * 1.2;
    const eyeBaseY = faceY + dy * 0.4;
    if (direction === 'down') {
      ctx.fillRect(eyeBaseX - 2.2, eyeBaseY - 1, 1.5, 2);
      ctx.fillRect(eyeBaseX + 0.7, eyeBaseY - 1, 1.5, 2);
    } else if (direction.includes('left')) {
      ctx.fillRect(eyeBaseX - 2.2, eyeBaseY - 1, 1.5, 2);
    } else if (direction.includes('right')) {
      ctx.fillRect(eyeBaseX + 0.8, eyeBaseY - 1, 1.5, 2);
    }
  }

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.moveTo(px, py - 21 + bob);
    ctx.lineTo(px + 8, py - 3 + bob);
    ctx.lineTo(px - 8, py - 3 + bob);
    ctx.closePath();
  });
}

// 2. KAITO (Windläufer)
function renderKaitoWind(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 8, 3.5, 0.32);

  // Poncho body (Forest & moss green paper)
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.moveTo(px, py - 21 + bob);
  ctx.lineTo(px + 8, py - 4 + bob);
  ctx.lineTo(px - 8, py - 4 + bob);
  ctx.closePath();
  ctx.fill();

  // Asymmetric Poncho Fold
  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.moveTo(px, py - 21 + bob);
  ctx.lineTo(px + 8, py - 4 + bob);
  ctx.lineTo(px, py - 4 + bob);
  ctx.closePath();
  ctx.fill();

  // Leather scout sash
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(px - 6, py - 18 + bob);
  ctx.lineTo(px + 6, py - 7 + bob);
  ctx.stroke();

  // Ponytail & Falcon Feather
  const hairSway = Math.sin(animTime * 7) * 2.5;
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.ellipse(px - 2 + hairSway * 0.5, py - 19 + bob, 3, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Falcon feather
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(px - 3 + hairSway, py - 22 + bob);
  ctx.lineTo(px - 1 + hairSway, py - 27 + bob);
  ctx.lineTo(px - 5 + hairSway, py - 25 + bob);
  ctx.closePath();
  ctx.fill();

  // Head & Headband
  const faceX = px + dx * 1.2;
  const faceY = py - 18 + bob + dy * 0.8;
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(faceX, faceY, 4.4, 0, Math.PI * 2);
  ctx.fill();

  // White Headband
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(faceX - 4.5, faceY - 3.5, 9, 2);

  // Emerald Eyes
  if (direction !== 'up') {
    ctx.fillStyle = '#10b981';
    const ex = faceX + dx * 1.2;
    const ey = faceY + dy * 0.3;
    if (direction === 'down') {
      ctx.fillRect(ex - 2.2, ey - 0.5, 1.4, 1.8);
      ctx.fillRect(ex + 0.8, ey - 0.5, 1.4, 1.8);
    } else if (direction.includes('left')) {
      ctx.fillRect(ex - 2.2, ey - 0.5, 1.4, 1.8);
    } else {
      ctx.fillRect(ex + 0.8, ey - 0.5, 1.4, 1.8);
    }
  }

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.moveTo(px, py - 22 + bob);
    ctx.lineTo(px + 8.5, py - 3 + bob);
    ctx.lineTo(px - 8.5, py - 3 + bob);
    ctx.closePath();
  });
}

// 3. JIRO (Papier-Ronin)
function renderJiroRonin(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 9, 3.8, 0.35);

  // Dark Kimono / Hakama Robe
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(px, py - 19 + bob);
  ctx.lineTo(px + 7.5, py - 3 + bob);
  ctx.lineTo(px - 7.5, py - 3 + bob);
  ctx.closePath();
  ctx.fill();

  // Purple Lapel Fold
  ctx.fillStyle = '#581c87';
  ctx.beginPath();
  ctx.moveTo(px, py - 16 + bob);
  ctx.lineTo(px + 3, py - 6 + bob);
  ctx.lineTo(px - 4, py - 6 + bob);
  ctx.closePath();
  ctx.fill();

  // White Collar Wrap
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(px - 3, py - 15 + bob, 6, 2);

  // Wide Kasa Conical Straw Hat
  const hatY = py - 20 + bob + dy * 0.5;
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(px + dx * 1.5, hatY - 7);
  ctx.lineTo(px + 12, hatY + 1);
  ctx.lineTo(px - 12, hatY + 1);
  ctx.closePath();
  ctx.fill();

  // Hat Weave Ribs
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + dx * 1.5, hatY - 7);
  ctx.lineTo(px, hatY + 1);
  ctx.moveTo(px + dx * 1.5, hatY - 7);
  ctx.lineTo(px + 7, hatY + 1);
  ctx.moveTo(px + dx * 1.5, hatY - 7);
  ctx.lineTo(px - 7, hatY + 1);
  ctx.stroke();

  // Hat Cord hanging
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(px - 6, hatY + 1);
  ctx.lineTo(px - 4, hatY + 7);
  ctx.stroke();

  // Keen Golden Eyes peeking beneath hat
  if (direction !== 'up') {
    ctx.fillStyle = '#fbbf24';
    const ey = hatY + 3;
    const ex = px + dx * 2;
    if (direction === 'down') {
      ctx.fillRect(ex - 2.5, ey, 2, 1.2);
      ctx.fillRect(ex + 0.8, ey, 2, 1.2);
    } else if (direction.includes('left')) {
      ctx.fillRect(ex - 2.5, ey, 2, 1.2);
    } else {
      ctx.fillRect(ex + 0.8, ey, 2, 1.2);
    }
  }

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.arc(px, py - 12 + bob, 11, 0, Math.PI * 2);
  });
}

// 4. TARO (Lampion-Schmied)
function renderTaroLantern(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 8.5, 3.5, 0.32);

  // Charcoal base shirt
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(px, py - 20 + bob);
  ctx.lineTo(px + 7, py - 4 + bob);
  ctx.lineTo(px - 7, py - 4 + bob);
  ctx.closePath();
  ctx.fill();

  // Leather blacksmith apron
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.moveTo(px - 4, py - 14 + bob);
  ctx.lineTo(px + 4, py - 14 + bob);
  ctx.lineTo(px + 5.5, py - 3 + bob);
  ctx.lineTo(px - 5.5, py - 3 + bob);
  ctx.closePath();
  ctx.fill();

  // Apron strap
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(px - 3, py - 16 + bob);
  ctx.lineTo(px + 3, py - 16 + bob);
  ctx.stroke();

  // Face & Beard
  const faceX = px + dx * 1.2;
  const faceY = py - 18 + bob + dy * 0.8;
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(faceX, faceY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Brown short beard / stubble
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(faceX, faceY + 1.8, 3.2, 0, Math.PI);
  ctx.fill();

  // Copper Goggles on Forehead
  ctx.fillStyle = '#d97706';
  ctx.fillRect(faceX - 4.5, faceY - 4.5, 9, 2.5);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(faceX - 3.5, faceY - 4, 2.5, 1.8);
  ctx.fillRect(faceX + 1, faceY - 4, 2.5, 1.8);

  // Fiery Amber Eyes
  if (direction !== 'up') {
    ctx.fillStyle = '#f97316';
    const ex = faceX + dx * 1.2;
    const ey = faceY + dy * 0.3;
    if (direction === 'down') {
      ctx.fillRect(ex - 2.2, ey - 0.5, 1.4, 1.6);
      ctx.fillRect(ex + 0.8, ey - 0.5, 1.4, 1.6);
    } else if (direction.includes('left')) {
      ctx.fillRect(ex - 2.2, ey - 0.5, 1.4, 1.6);
    } else {
      ctx.fillRect(ex + 0.8, ey - 0.5, 1.4, 1.6);
    }
  }

  // Tiny ember spark
  const sparkX = px + Math.sin(animTime * 6) * 7;
  const sparkY = py - 8 + bob - ((animTime * 15) % 12);
  ctx.fillStyle = '#f97316';
  ctx.fillRect(sparkX, sparkY, 1.5, 1.5);

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.moveTo(px, py - 21 + bob);
    ctx.lineTo(px + 8, py - 3 + bob);
    ctx.lineTo(px - 8, py - 3 + bob);
    ctx.closePath();
  });
}

// 5. SORA (Kirschblüten-Miko)
function renderSoraMiko(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 8, 3.5, 0.3);

  // Red Pleated Hakama Skirt
  ctx.fillStyle = '#be123c';
  ctx.beginPath();
  ctx.moveTo(px - 4.5, py - 11 + bob);
  ctx.lineTo(px + 4.5, py - 11 + bob);
  ctx.lineTo(px + 7.5, py - 3 + bob);
  ctx.lineTo(px - 7.5, py - 3 + bob);
  ctx.closePath();
  ctx.fill();

  // White Shrine Robe (Haori)
  ctx.fillStyle = '#fdfbf7';
  ctx.beginPath();
  ctx.moveTo(px, py - 20 + bob);
  ctx.lineTo(px + 6, py - 10 + bob);
  ctx.lineTo(px - 6, py - 10 + bob);
  ctx.closePath();
  ctx.fill();

  // Red Ribbon Trim on collar
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px - 3, py - 17 + bob);
  ctx.lineTo(px, py - 12 + bob);
  ctx.lineTo(px + 3, py - 17 + bob);
  ctx.stroke();

  // Long dark hair
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(px, py - 17 + bob, 4.8, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Twin hair ribbons
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(px - 5.5, py - 18 + bob, 2, 4);
  ctx.fillRect(px + 3.5, py - 18 + bob, 2, 4);

  // Miko Face
  const faceX = px + dx * 1.2;
  const faceY = py - 18 + bob + dy * 0.8;
  ctx.fillStyle = '#fff1f2';
  ctx.beginPath();
  ctx.arc(faceX, faceY, 4.2, 0, Math.PI * 2);
  ctx.fill();

  // Cheerful Blush
  ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
  ctx.beginPath();
  ctx.arc(faceX - 2.2, faceY + 1.5, 1.2, 0, Math.PI * 2);
  ctx.arc(faceX + 2.2, faceY + 1.5, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Ruby Eyes
  if (direction !== 'up') {
    ctx.fillStyle = '#e11d48';
    const ex = faceX + dx * 1.2;
    const ey = faceY + dy * 0.3;
    if (direction === 'down') {
      ctx.fillRect(ex - 2, ey - 0.5, 1.4, 1.8);
      ctx.fillRect(ex + 0.8, ey - 0.5, 1.4, 1.8);
    } else if (direction.includes('left')) {
      ctx.fillRect(ex - 2, ey - 0.5, 1.4, 1.8);
    } else {
      ctx.fillRect(ex + 0.8, ey - 0.5, 1.4, 1.8);
    }
  }

  // O-Mikuji Prayer Strips on shoulder
  const omikujiWave = Math.sin(animTime * 5) * 1.8;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px - 5 + omikujiWave, py - 13 + bob, 2, 5);

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.moveTo(px, py - 21 + bob);
    ctx.lineTo(px + 8, py - 3 + bob);
    ctx.lineTo(px - 8, py - 3 + bob);
    ctx.closePath();
  });
}

// 6. KANNA (Wolfsprinzessin)
function renderKannaWolf(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 8, 3.5, 0.3);

  // Hunter leather tunic
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(px, py - 19 + bob);
  ctx.lineTo(px + 7, py - 4 + bob);
  ctx.lineTo(px - 7, py - 4 + bob);
  ctx.closePath();
  ctx.fill();

  // Bone Claw necklace
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(px, py - 13 + bob, 1.2, 0, Math.PI * 2);
  ctx.arc(px - 2.5, py - 14 + bob, 1, 0, Math.PI * 2);
  ctx.arc(px + 2.5, py - 14 + bob, 1, 0, Math.PI * 2);
  ctx.fill();

  // Wolf Pelt Hood with Ears
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(px, py - 18 + bob, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Pointed Wolf Ears on Hood
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(px - 4, py - 22 + bob);
  ctx.lineTo(px - 6, py - 27 + bob);
  ctx.lineTo(px - 1, py - 23 + bob);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(px + 4, py - 22 + bob);
  ctx.lineTo(px + 6, py - 27 + bob);
  ctx.lineTo(px + 1, py - 23 + bob);
  ctx.closePath();
  ctx.fill();

  // Face
  const faceX = px + dx * 1.2;
  const faceY = py - 18 + bob + dy * 0.8;
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(faceX, faceY, 4.2, 0, Math.PI * 2);
  ctx.fill();

  // Red War Paint Stripes (Mononoke Style)
  ctx.fillStyle = '#e11d48';
  ctx.fillRect(faceX - 3.5, faceY + 1.2, 2.5, 1);
  ctx.fillRect(faceX + 1.2, faceY + 1.2, 2.5, 1);

  // Fierce Ice-Blue Eyes
  if (direction !== 'up') {
    ctx.fillStyle = '#38bdf8';
    const ex = faceX + dx * 1.2;
    const ey = faceY + dy * 0.3;
    if (direction === 'down') {
      ctx.fillRect(ex - 2.2, ey - 0.5, 1.4, 1.8);
      ctx.fillRect(ex + 0.8, ey - 0.5, 1.4, 1.8);
    } else if (direction.includes('left')) {
      ctx.fillRect(ex - 2.2, ey - 0.5, 1.4, 1.8);
    } else {
      ctx.fillRect(ex + 0.8, ey - 0.5, 1.4, 1.8);
    }
  }

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.arc(px, py - 13 + bob, 10, 0, Math.PI * 2);
  });
}

// 7. AOI (Sternen-Weise)
function renderAoiCelestial(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 8.5, 3.5, 0.3);

  // Midnight Astral Cloak
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.moveTo(px, py - 20 + bob);
  ctx.lineTo(px + 8, py - 3 + bob);
  ctx.lineTo(px - 8, py - 3 + bob);
  ctx.closePath();
  ctx.fill();

  // Golden Constellation Dots on Cloak
  ctx.fillStyle = '#fde047';
  ctx.fillRect(px - 4, py - 9 + bob, 1.5, 1.5);
  ctx.fillRect(px + 3, py - 12 + bob, 1.2, 1.2);
  ctx.fillRect(px - 2, py - 5 + bob, 1.5, 1.5);
  ctx.fillRect(px + 4, py - 6 + bob, 1.2, 1.2);

  // Face & Sheer Veil
  const faceX = px + dx * 1.2;
  const faceY = py - 18 + bob + dy * 0.8;
  ctx.fillStyle = '#f5f3ff';
  ctx.beginPath();
  ctx.arc(faceX, faceY, 4.4, 0, Math.PI * 2);
  ctx.fill();

  // Golden Crescent Moon Diadem
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(faceX, faceY - 3.8, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(faceX, faceY - 4.5, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Sheer Translucent Veil
  ctx.fillStyle = 'rgba(224, 231, 255, 0.6)';
  ctx.beginPath();
  ctx.moveTo(faceX - 4, faceY - 1);
  ctx.lineTo(faceX + 4, faceY - 1);
  ctx.lineTo(faceX + 3.5, faceY + 5.5);
  ctx.lineTo(faceX - 3.5, faceY + 5.5);
  ctx.closePath();
  ctx.fill();

  // Lavender Astral Eyes
  if (direction !== 'up') {
    ctx.fillStyle = '#c084fc';
    const ex = faceX + dx * 1.2;
    const ey = faceY + dy * 0.3;
    if (direction === 'down') {
      ctx.fillRect(ex - 2, ey - 0.5, 1.4, 1.6);
      ctx.fillRect(ex + 0.8, ey - 0.5, 1.4, 1.6);
    } else if (direction.includes('left')) {
      ctx.fillRect(ex - 2, ey - 0.5, 1.4, 1.6);
    } else {
      ctx.fillRect(ex + 0.8, ey - 0.5, 1.4, 1.6);
    }
  }

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.moveTo(px, py - 21 + bob);
    ctx.lineTo(px + 8.5, py - 3 + bob);
    ctx.lineTo(px - 8.5, py - 3 + bob);
    ctx.closePath();
  });
}

// 8. MEI (Kräuter-Nomadin)
function renderMeiHerbalist(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 8, 3.5, 0.3);

  // Wicker Basket on back
  ctx.fillStyle = '#92400e';
  ctx.fillRect(px - 5, py - 18 + bob, 10, 8);
  ctx.fillStyle = '#4ade80'; // Fresh herbs in basket
  ctx.beginPath();
  ctx.arc(px - 2, py - 18 + bob, 2.5, 0, Math.PI * 2);
  ctx.arc(px + 2, py - 19 + bob, 2, 0, Math.PI * 2);
  ctx.fill();

  // Sage Green Traveler Dress
  ctx.fillStyle = '#047857';
  ctx.beginPath();
  ctx.moveTo(px, py - 18 + bob);
  ctx.lineTo(px + 7.5, py - 3 + bob);
  ctx.lineTo(px - 7.5, py - 3 + bob);
  ctx.closePath();
  ctx.fill();

  // White apron
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(px - 4, py - 11 + bob, 8, 7);

  // Twin Braids with wild buttercups
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(px - 4.5, py - 14 + bob, 2, 0, Math.PI * 2);
  ctx.arc(px + 4.5, py - 14 + bob, 2, 0, Math.PI * 2);
  ctx.fill();
  // Flowers in hair
  ctx.fillStyle = '#fde047';
  ctx.fillRect(px - 5, py - 15 + bob, 1.8, 1.8);
  ctx.fillRect(px + 3.5, py - 15 + bob, 1.8, 1.8);

  // Cute Face
  const faceX = px + dx * 1.2;
  const faceY = py - 18 + bob + dy * 0.8;
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(faceX, faceY, 4.3, 0, Math.PI * 2);
  ctx.fill();

  // Warm Peach Blush
  ctx.fillStyle = 'rgba(251, 146, 60, 0.45)';
  ctx.beginPath();
  ctx.arc(faceX - 2.2, faceY + 1.2, 1.2, 0, Math.PI * 2);
  ctx.arc(faceX + 2.2, faceY + 1.2, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Warm Chestnut Eyes
  if (direction !== 'up') {
    ctx.fillStyle = '#78350f';
    const ex = faceX + dx * 1.2;
    const ey = faceY + dy * 0.3;
    if (direction === 'down') {
      ctx.fillRect(ex - 2, ey - 0.5, 1.4, 1.8);
      ctx.fillRect(ex + 0.8, ey - 0.5, 1.4, 1.8);
    } else if (direction.includes('left')) {
      ctx.fillRect(ex - 2, ey - 0.5, 1.4, 1.8);
    } else {
      ctx.fillRect(ex + 0.8, ey - 0.5, 1.4, 1.8);
    }
  }

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.moveTo(px, py - 20 + bob);
    ctx.lineTo(px + 8, py - 3 + bob);
    ctx.lineTo(px - 8, py - 3 + bob);
    ctx.closePath();
  });
}

// 9. YUTO (Kitsune Fuchskrieger)
function renderYutoKitsune(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 9, 3.8, 0.32);

  // Big Fluffy Fox Tail (Wagging)
  const tailSway = Math.sin(animTime * 6) * 4;
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(px + 7 + tailSway * 0.4, py - 7 + bob, 5, 8, 0.45, 0, Math.PI * 2);
  ctx.fill();
  // White Tail Tip
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(px + 8 + tailSway * 0.6, py - 12 + bob, 2.8, 3.5, 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Orange Robe Body
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(px, py - 19 + bob);
  ctx.lineTo(px + 7, py - 3 + bob);
  ctx.lineTo(px - 7, py - 3 + bob);
  ctx.closePath();
  ctx.fill();

  // White Chest Fur
  ctx.fillStyle = '#ffedd5';
  ctx.beginPath();
  ctx.moveTo(px, py - 16 + bob);
  ctx.lineTo(px + 3, py - 8 + bob);
  ctx.lineTo(px - 3, py - 8 + bob);
  ctx.closePath();
  ctx.fill();

  // Head
  const faceX = px + dx * 1.2;
  const faceY = py - 18 + bob + dy * 0.8;
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(faceX, faceY, 4.8, 0, Math.PI * 2);
  ctx.fill();

  // Pointed Fox Ears
  ctx.fillStyle = '#c2410c';
  ctx.beginPath();
  ctx.moveTo(faceX - 5, faceY - 3);
  ctx.lineTo(faceX - 7, faceY - 9);
  ctx.lineTo(faceX - 2, faceY - 4);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(faceX + 5, faceY - 3);
  ctx.lineTo(faceX + 7, faceY - 9);
  ctx.lineTo(faceX + 2, faceY - 4);
  ctx.closePath();
  ctx.fill();

  // White inner ears
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(faceX - 5.5, faceY - 6.5, 1.8, 2.5);
  ctx.fillRect(faceX + 3.8, faceY - 6.5, 1.8, 2.5);

  // White muzzle
  ctx.fillStyle = '#ffedd5';
  ctx.beginPath();
  ctx.arc(faceX + dx * 1.2, faceY + 1.2 + dy * 0.5, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Fox Nose
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(faceX + dx * 1.8 - 0.7, faceY + 1.8 + dy * 0.5, 1.4, 1.2);

  // Clever Amber Eyes
  if (direction !== 'up') {
    ctx.fillStyle = '#f59e0b';
    const ex = faceX + dx * 1.2;
    const ey = faceY + dy * 0.2;
    if (direction === 'down') {
      ctx.fillRect(ex - 2.4, ey - 1, 1.6, 1.8);
      ctx.fillRect(ex + 0.8, ey - 1, 1.6, 1.8);
    } else if (direction.includes('left')) {
      ctx.fillRect(ex - 2.4, ey - 1, 1.6, 1.8);
    } else {
      ctx.fillRect(ex + 0.8, ey - 1, 1.6, 1.8);
    }
  }

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.arc(px, py - 12 + bob, 10, 0, Math.PI * 2);
  });
}

// 10. POKO (Tanuki Marderhund)
function renderPokoTanuki(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 9.5, 4, 0.35);

  // Round Plump Tanuki Body
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(px, py - 12 + bob, 8.5, 0, Math.PI * 2);
  ctx.fill();

  // Creamy Tanuki Belly
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.ellipse(px + dx * 1.2, py - 10 + bob + dy * 0.5, 5.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Round Tanuki Ears
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(px - 5.5, py - 20 + bob, 2.5, 0, Math.PI * 2);
  ctx.arc(px + 5.5, py - 20 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Dark Bandit Eye Mask
  ctx.fillStyle = '#451a03';
  const faceX = px + dx * 1.2;
  const faceY = py - 16 + bob + dy * 0.8;
  ctx.beginPath();
  ctx.ellipse(faceX - 2.5, faceY, 2.8, 2, 0.2, 0, Math.PI * 2);
  ctx.ellipse(faceX + 2.5, faceY, 2.8, 2, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Magical Transformation Leaf atop head
  const leafTilt = Math.sin(animTime * 4) * 0.3;
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(px + 1, py - 22 + bob, 3.2, 1.8, leafTilt, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(px - 1, py - 22 + bob);
  ctx.lineTo(px + 3, py - 22 + bob);
  ctx.stroke();

  // Curious Button Eyes
  if (direction !== 'up') {
    ctx.fillStyle = '#ffffff';
    const ex = faceX + dx * 1.2;
    const ey = faceY + dy * 0.3;
    if (direction === 'down') {
      ctx.fillRect(ex - 2.8, ey - 0.5, 1.8, 1.8);
      ctx.fillRect(ex + 1, ey - 0.5, 1.8, 1.8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ex - 2.2, ey, 1, 1);
      ctx.fillRect(ex + 1.2, ey, 1, 1);
    } else if (direction.includes('left')) {
      ctx.fillRect(ex - 2.8, ey - 0.5, 1.8, 1.8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ex - 2.4, ey, 1, 1);
    } else {
      ctx.fillRect(ex + 1, ey - 0.5, 1.8, 1.8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ex + 1.4, ey, 1, 1);
    }
  }

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.arc(px, py - 12 + bob, 9, 0, Math.PI * 2);
  });
}

// 11. KURO (Neko Schattenkater)
function renderKuroNeko(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 8, 3.5, 0.35);

  // Curling Cat Tail behind
  const tailWave = Math.sin(animTime * 7) * 3;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(px - 4, py - 6 + bob);
  ctx.quadraticCurveTo(px - 10 + tailWave, py - 12 + bob, px - 7 + tailWave, py - 16 + bob);
  ctx.stroke();

  // Jet Black Paper Body
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(px, py - 19 + bob);
  ctx.lineTo(px + 6.5, py - 3 + bob);
  ctx.lineTo(px - 6.5, py - 3 + bob);
  ctx.closePath();
  ctx.fill();

  // Flowing Red Shinobi Scarf
  const scarfWave = Math.sin(animTime * 8) * 3.5;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(px - 2, py - 13 + bob);
  ctx.lineTo(px - 8 + scarfWave, py - 10 + bob);
  ctx.lineTo(px - 12 + scarfWave * 1.2, py - 12 + bob);
  ctx.stroke();

  // Scarf collar knot
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(px - 4.5, py - 14 + bob, 9, 2.5);

  // Cat Head
  const faceX = px + dx * 1.2;
  const faceY = py - 18 + bob + dy * 0.8;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(faceX, faceY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Pointed Cat Ears
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.moveTo(faceX - 4, faceY - 2);
  ctx.lineTo(faceX - 6, faceY - 8);
  ctx.lineTo(faceX - 1, faceY - 4);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(faceX + 4, faceY - 2);
  ctx.lineTo(faceX + 6, faceY - 8);
  ctx.lineTo(faceX + 1, faceY - 4);
  ctx.closePath();
  ctx.fill();

  // Pink inner ears
  ctx.fillStyle = '#f472b6';
  ctx.fillRect(faceX - 4.8, faceY - 6, 1.5, 2);
  ctx.fillRect(faceX + 3.3, faceY - 6, 1.5, 2);

  // Glowing Neon Green Cat Eyes with Slit Pupil
  if (direction !== 'up') {
    ctx.fillStyle = '#4ade80';
    const ex = faceX + dx * 1.2;
    const ey = faceY + dy * 0.2;
    if (direction === 'down') {
      ctx.fillRect(ex - 2.2, ey - 0.8, 1.5, 2.2);
      ctx.fillRect(ex + 0.8, ey - 0.8, 1.5, 2.2);
      ctx.fillStyle = '#020617';
      ctx.fillRect(ex - 1.6, ey - 0.4, 0.6, 1.5);
      ctx.fillRect(ex + 1.3, ey - 0.4, 0.6, 1.5);
    } else if (direction.includes('left')) {
      ctx.fillRect(ex - 2.2, ey - 0.8, 1.5, 2.2);
      ctx.fillStyle = '#020617';
      ctx.fillRect(ex - 1.6, ey - 0.4, 0.6, 1.5);
    } else {
      ctx.fillRect(ex + 0.8, ey - 0.8, 1.5, 2.2);
      ctx.fillStyle = '#020617';
      ctx.fillRect(ex + 1.3, ey - 0.4, 0.6, 1.5);
    }
  }

  // Whisker lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(faceX - 3, faceY + 1);
  ctx.lineTo(faceX - 7, faceY + 0.5);
  ctx.moveTo(faceX + 3, faceY + 1);
  ctx.lineTo(faceX + 7, faceY + 0.5);
  ctx.stroke();

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.arc(px, py - 12 + bob, 9, 0, Math.PI * 2);
  });
}

// 12. TORU (Totoro Waldwächter)
function renderToruTotoro(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 10, 4.2, 0.38);

  // Pear-shaped gray body
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.ellipse(px, py - 11 + bob, 8.8, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // White Fluffy Belly
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(px + dx * 1.2, py - 9 + bob + dy * 0.5, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Characteristic dark chevron chest markings (^ ^ ^)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.2;
  const cx = px + dx * 1.2;
  const cy = py - 10 + bob + dy * 0.5;
  // Mark 1
  ctx.beginPath();
  ctx.moveTo(cx - 3.5, cy - 2);
  ctx.lineTo(cx - 2.5, cy - 3.5);
  ctx.lineTo(cx - 1.5, cy - 2);
  ctx.stroke();
  // Mark 2
  ctx.beginPath();
  ctx.moveTo(cx - 1, cy - 2.5);
  ctx.lineTo(cx, cy - 4);
  ctx.lineTo(cx + 1, cy - 2.5);
  ctx.stroke();
  // Mark 3
  ctx.beginPath();
  ctx.moveTo(cx + 1.5, cy - 2);
  ctx.lineTo(cx + 2.5, cy - 3.5);
  ctx.lineTo(cx + 3.5, cy - 2);
  ctx.stroke();

  // Long Rabbit / Totoro Ears
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.ellipse(px - 4, py - 23 + bob, 1.8, 5, -0.15, 0, Math.PI * 2);
  ctx.ellipse(px + 4, py - 23 + bob, 1.8, 5, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Wide Anime Eyes
  if (direction !== 'up') {
    const faceX = px + dx * 1.2;
    const faceY = py - 17 + bob + dy * 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(faceX - 2.5, faceY, 2, 0, Math.PI * 2);
    ctx.arc(faceX + 2.5, faceY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(faceX - 2.5 + dx * 0.5, faceY + dy * 0.3, 1.1, 0, Math.PI * 2);
    ctx.arc(faceX + 2.5 + dx * 0.5, faceY + dy * 0.3, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.ellipse(px, py - 11 + bob, 9.5, 10.5, 0, 0, Math.PI * 2);
  });
}

// 13. HAYATE (Tengu Rabenkrieger)
function renderHayateTengu(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 8.5, 3.5, 0.35);

  // Midnight Feathered Cloak
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(px, py - 20 + bob);
  ctx.lineTo(px + 8, py - 3 + bob);
  ctx.lineTo(px - 8, py - 3 + bob);
  ctx.closePath();
  ctx.fill();

  // Folded Wing Feathers at sides
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.moveTo(px - 6, py - 16 + bob);
  ctx.lineTo(px - 10, py - 8 + bob);
  ctx.lineTo(px - 5, py - 6 + bob);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(px + 6, py - 16 + bob);
  ctx.lineTo(px + 10, py - 8 + bob);
  ctx.lineTo(px + 5, py - 6 + bob);
  ctx.closePath();
  ctx.fill();

  // Red Tokin Pillbox Cap atop head
  const faceX = px + dx * 1.2;
  const faceY = py - 18 + bob + dy * 0.8;
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(faceX - 2.5, faceY - 6.5, 5, 2.5);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(faceX - 1, faceY - 7.5, 2, 1.2);

  // Raven Head
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(faceX, faceY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Golden Raven Beak
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  if (direction.includes('left')) {
    ctx.moveTo(faceX - 2, faceY - 1);
    ctx.lineTo(faceX - 7, faceY + 1);
    ctx.lineTo(faceX - 2, faceY + 2);
  } else if (direction.includes('right')) {
    ctx.moveTo(faceX + 2, faceY - 1);
    ctx.lineTo(faceX + 7, faceY + 1);
    ctx.lineTo(faceX + 2, faceY + 2);
  } else {
    ctx.moveTo(faceX - 2, faceY);
    ctx.lineTo(faceX, faceY + 4);
    ctx.lineTo(faceX + 2, faceY);
  }
  ctx.closePath();
  ctx.fill();

  // Piercing Ruby Eyes
  if (direction !== 'up') {
    ctx.fillStyle = '#ef4444';
    const ex = faceX + dx * 1.2;
    const ey = faceY + dy * 0.2;
    if (direction === 'down') {
      ctx.fillRect(ex - 2.4, ey - 1.5, 1.5, 1.5);
      ctx.fillRect(ex + 1, ey - 1.5, 1.5, 1.5);
    } else if (direction.includes('left')) {
      ctx.fillRect(ex - 2.4, ey - 1.5, 1.5, 1.5);
    } else {
      ctx.fillRect(ex + 1, ey - 1.5, 1.5, 1.5);
    }
  }

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.moveTo(px, py - 21 + bob);
    ctx.lineTo(px + 8.5, py - 3 + bob);
    ctx.lineTo(px - 8.5, py - 3 + bob);
    ctx.closePath();
  });
}

// 14. SHIRATAMA (Yurei Tempelgeist)
function renderShiratamaSpirit(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  // Shiratama floats without feet! Smooth sinusoidal levitation
  const hover = Math.sin(animTime * 3.5) * 3;
  const { dx, dy } = getFacingOffsets(direction);

  // Soft translucent aura shadow
  drawPaperDropShadow(ctx, px, py + 1, 7, 3, 0.2);

  // Orbiting Will-o'-the-wisps (Hitodama)
  const orbAngle1 = animTime * 3;
  const orbAngle2 = orbAngle1 + Math.PI;
  const orb1X = px + Math.cos(orbAngle1) * 11;
  const orb1Y = py - 14 + hover + Math.sin(orbAngle1) * 4;
  const orb2X = px + Math.cos(orbAngle2) * 11;
  const orb2Y = py - 14 + hover + Math.sin(orbAngle2) * 4;

  ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
  ctx.beginPath();
  ctx.arc(orb1X, orb1Y, 2, 0, Math.PI * 2);
  ctx.arc(orb2X, orb2Y, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Floating Ghost Body (Tapering wisp)
  const tailRipple = Math.sin(animTime * 6) * 2;
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(px, py - 23 + hover);
  ctx.quadraticCurveTo(px + 8, py - 16 + hover, px + 4, py - 6 + hover);
  ctx.quadraticCurveTo(px + tailRipple, py - 2 + hover, px - 3, py - 6 + hover);
  ctx.quadraticCurveTo(px - 8, py - 16 + hover, px, py - 23 + hover);
  ctx.closePath();
  ctx.fill();

  // Cyan translucent rim
  ctx.strokeStyle = 'rgba(165, 243, 252, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Head & Kodama Expression
  const faceX = px + dx * 1.5;
  const faceY = py - 17 + hover + dy * 0.8;

  // Hollow dark curious eyes
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(faceX - 2.5, faceY - 1, 1.4, 2, 0.1, 0, Math.PI * 2);
  ctx.ellipse(faceX + 2.5, faceY - 1, 1.4, 2, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Little open mouth
  ctx.beginPath();
  ctx.ellipse(faceX, faceY + 2.5, 1.1, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.arc(px, py - 14 + hover, 8.5, 0, Math.PI * 2);
  });
}

// 15. MUKURO (Leeren-Schatten / Kaonashi)
function renderMukuroShadow(ctx, px, py, animTime, direction, isMoving, hitFlash) {
  const bob = isMoving ? Math.sin(animTime * 14) * 1.5 : Math.sin(animTime * 2.5) * 0.5;
  const { dx, dy } = getFacingOffsets(direction);

  drawPaperDropShadow(ctx, px, py + 1, 8.5, 3.5, 0.4);

  // Purple void luminescence aura
  ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
  ctx.beginPath();
  ctx.ellipse(px, py - 12 + bob, 9, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark flowing shadow cloak
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.moveTo(px, py - 22 + bob);
  ctx.lineTo(px + 7.5, py - 3 + bob);
  ctx.lineTo(px - 7.5, py - 3 + bob);
  ctx.closePath();
  ctx.fill();

  // Inner deep purple fold
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.moveTo(px, py - 20 + bob);
  ctx.lineTo(px + 4, py - 4 + bob);
  ctx.lineTo(px - 4, py - 4 + bob);
  ctx.closePath();
  ctx.fill();

  // White Noh Porcelain Mask
  const faceX = px + dx * 1.2;
  const faceY = py - 17 + bob + dy * 0.8;
  ctx.fillStyle = '#f4f4f5';
  ctx.beginPath();
  ctx.ellipse(faceX, faceY, 4.4, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Purple Teardrop Markings under eyes
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.ellipse(faceX - 2.2, faceY + 2.5, 0.8, 1.8, -0.1, 0, Math.PI * 2);
  ctx.ellipse(faceX + 2.2, faceY + 2.5, 0.8, 1.8, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Dark Narrow Mask Eyes & Mouth
  ctx.fillStyle = '#09090b';
  ctx.fillRect(faceX - 3, faceY - 1.5, 2, 1.2);
  ctx.fillRect(faceX + 1, faceY - 1.5, 2, 1.2);
  ctx.fillRect(faceX - 1, faceY + 3.2, 2, 1);

  applyHitFlashTint(ctx, hitFlash, () => {
    ctx.beginPath();
    ctx.moveTo(px, py - 23 + bob);
    ctx.lineTo(px + 8.5, py - 2 + bob);
    ctx.lineTo(px - 8.5, py - 2 + bob);
    ctx.closePath();
  });
}

// -----------------------------------------------------------------------------
// 15 CHARACTERS ROSTER DATA & METADATA
// -----------------------------------------------------------------------------
const CHARACTERS_DATA = [
  // ⚔️ MÄNNLICH (4)
  {
    id: 'ren_twilight',
    name: 'Ren',
    title: 'Schattengänger (Twilight Wanderer)',
    category: 'male',
    categoryName: '⚔️ Männlich',
    badgeClass: 'badge-male',
    desc: 'Indigo-Papierumhang, schützende weiße Maske und leuchtende Geisteraugen.',
    lore: 'Ein stiller Wanderer der Dämmerung, der die Pfade zwischen Diesseits und Jenseits beschützt.',
    palette: ['#1e2636', '#dc2626', '#f8fafc', '#2dd4bf'],
    render: renderRenTwilight
  },
  {
    id: 'kaito_wind',
    name: 'Kaito',
    title: 'Windläufer (Wind Scout)',
    category: 'male',
    categoryName: '⚔️ Männlich',
    badgeClass: 'badge-male',
    desc: 'Moosgrüner Asymmetrie-Poncho, Lederriemen, Windzopf mit Falkenfeder.',
    lore: 'Schneller als der Sturm über den Berggipfeln. Seine Schritte hinterlassen keinen Hauch im Gras.',
    palette: ['#15803d', '#166534', '#f59e0b', '#10b981'],
    render: renderKaitoWind
  },
  {
    id: 'jiro_ronin',
    name: 'Jiro',
    title: 'Papier-Ronin (Folded Blade)',
    category: 'male',
    categoryName: '⚔️ Männlich',
    badgeClass: 'badge-male',
    desc: 'Breiter geflochtener Kasa-Strohhut, nachtschwarzer Kimono und Goldaugen.',
    lore: 'Ein herrenloser Schwertmeister, dessen Papierklinge niemals bricht und jede Böe teilt.',
    palette: ['#b45309', '#0f172a', '#581c87', '#fbbf24'],
    render: renderJiroRonin
  },
  {
    id: 'taro_lantern',
    name: 'Taro',
    title: 'Lampion-Schmied (Lantern Smith)',
    category: 'male',
    categoryName: '⚔️ Männlich',
    badgeClass: 'badge-male',
    desc: 'Gegerbte Lederschürze, Kupfer-Schweißerbrille und Glutaugen.',
    lore: 'Er schmiedet das Licht, das die Schatten der Leere verbrennt, mit Hammer und Seelenfeuer.',
    palette: ['#7c2d12', '#334155', '#d97706', '#f97316'],
    render: renderTaroLantern
  },

  // 🌸 WEIBLICH (4)
  {
    id: 'sora_miko',
    name: 'Sora',
    title: 'Kirschblüten-Miko (Sakura Priestess)',
    category: 'female',
    categoryName: '🌸 Weiblich',
    badgeClass: 'badge-female',
    desc: 'Schneeweißes Haori-Gewand, karmesinroter Hakama-Rock und O-Mikuji Bänder.',
    lore: 'Priesterin des ewigen Kirschblütenhains. Ihre Gebete reinigen selbst das dunkelste Miasma.',
    palette: ['#fdfbf7', '#be123c', '#ef4444', '#fb7185'],
    render: renderSoraMiko
  },
  {
    id: 'kanna_wolf',
    name: 'Kanna',
    title: 'Wolfsprinzessin (Wolf Princess)',
    category: 'female',
    categoryName: '🌸 Weiblich',
    badgeClass: 'badge-female',
    desc: 'Wolfsfell-Kapuze mit Ohren, Kriegsbemalung und furchtlose Eisaugen.',
    lore: 'Aufgezogen von den alten Bergwölfen. Sie kennt weder Furcht vor der Leere noch Gnade für Frevler.',
    palette: ['#cbd5e1', '#1e293b', '#e11d48', '#38bdf8'],
    render: renderKannaWolf
  },
  {
    id: 'aoi_celestial',
    name: 'Aoi',
    title: 'Sternen-Weise (Star Sage)',
    category: 'female',
    categoryName: '🌸 Weiblich',
    badgeClass: 'badge-female',
    desc: 'Mitternachtsblaues Sternen-Cape, Schleier und goldene Mondsichel-Tiara.',
    lore: 'Liest das Schicksal in den Sternenbildern über dem Wolkenmeer und webt leuchtende Lichtfäden.',
    palette: ['#1e1b4b', '#fde047', '#c084fc', '#e0e7ff'],
    render: renderAoiCelestial
  },
  {
    id: 'mei_herbalist',
    name: 'Mei',
    title: 'Kräuter-Nomadin (Herb Nomad)',
    category: 'female',
    categoryName: '🌸 Weiblich',
    badgeClass: 'badge-female',
    desc: 'Salbeigrünes Wanderkleid, Weiden-Rucksackkorb und Wiesenblüten im Haar.',
    lore: 'Reist durch alle Biome auf der Suche nach seltenen Mondlilien und heilendem Bergtraubentee.',
    palette: ['#047857', '#92400e', '#fde047', '#78350f'],
    render: renderMeiHerbalist
  },

  // 🐾 TIERWESEN (5)
  {
    id: 'yuto_kitsune',
    name: 'Kitsune Yuto',
    title: 'Fuchskrieger (Fox Guardian)',
    category: 'beast',
    categoryName: '🐾 Tierwesen',
    badgeClass: 'badge-beast',
    desc: 'Flammender Fuchsschwanz, spitze Ohren, Fuchsfell und geschickte Pfoten.',
    lore: 'Ein neunschwänziger Waldwächter in Gestalt eines jungen Fuchskriegers, Meister der Illusion.',
    palette: ['#ea580c', '#ffedd5', '#f59e0b', '#c2410c'],
    render: renderYutoKitsune
  },
  {
    id: 'poko_tanuki',
    name: 'Tanuki Poko',
    title: 'Marderhund (Tanuki Monk)',
    category: 'beast',
    categoryName: '🐾 Tierwesen',
    badgeClass: 'badge-beast',
    desc: 'Kugelrunder Bauch, Bambushut, magisches Kopfblatt und schelmisches Grinsen.',
    lore: 'Stets gut gelaunt, liebt Sake und Reisbällchen. Kann sich mit einem Blatt in alles verwandeln.',
    palette: ['#78350f', '#fde68a', '#22c55e', '#451a03'],
    render: renderPokoTanuki
  },
  {
    id: 'kuro_neko',
    name: 'Neko Kuro',
    title: 'Schattenkater (Shinobi Cat)',
    category: 'beast',
    categoryName: '🐾 Tierwesen',
    badgeClass: 'badge-beast',
    desc: 'Origami-Katzenkörper, wehender roter Schal, neongrüne Nachtaugen.',
    lore: 'Geht lautlos durch die finstersten Gassen. Sieben Leben reichen ihm für jedes Abenteuer.',
    palette: ['#0f172a', '#ef4444', '#4ade80', '#f472b6'],
    render: renderKuroNeko
  },
  {
    id: 'toru_totoro',
    name: 'Totoro Toru',
    title: 'Waldwächter (Forest Sprite)',
    category: 'beast',
    categoryName: '🐾 Tierwesen',
    badgeClass: 'badge-beast',
    desc: 'Birnenförmiger grauer Körper, Pfeilsicheln auf der Brust und Hasenohren.',
    lore: 'Ein sanfter uralter Waldgeist. Wenn er tief einatmet, wiegen sich alle Kronen des Waldes.',
    palette: ['#475569', '#f8fafc', '#334155', '#94a3b8'],
    render: renderToruTotoro
  },
  {
    id: 'hayate_tengu',
    name: 'Tengu Hayate',
    title: 'Rabenkrieger (Crow Tengu)',
    category: 'beast',
    categoryName: '🐾 Tierwesen',
    badgeClass: 'badge-beast',
    desc: 'Origami-Flügel, goldener Schnabel, rotes Tokin-Käppchen und Raubvogelaugen.',
    lore: 'Herr der Berglüfte und Wächter der heiligen Schreine. Keiner fliegt geschwinder im Wind.',
    palette: ['#0f172a', '#1e3a8a', '#f59e0b', '#dc2626'],
    render: renderHayateTengu
  },

  // 👻 GEISTERWESEN (2)
  {
    id: 'shiratama_spirit',
    name: 'Yurei Shiratama',
    title: 'Tempelgeist (Floating Kodama)',
    category: 'spirit',
    categoryName: '👻 Geisterwesen',
    badgeClass: 'badge-spirit',
    desc: 'Beinlos schwebende weiße Papierwolke, Kodama-Gesicht und Seelenfeuer-Orbs.',
    lore: 'Ein verspielter kleiner Tempelgeist, der leise klackert wenn gute Seelen den Wald betreten.',
    palette: ['#f8fafc', '#38bdf8', '#1e293b', '#a5f3fc'],
    render: renderShiratamaSpirit
  },
  {
    id: 'mukuro_shadow',
    name: 'Mukuro',
    title: 'Leeren-Schatten (Kaonashi Shadow)',
    category: 'spirit',
    categoryName: '👻 Geisterwesen',
    badgeClass: 'badge-spirit',
    desc: 'Waberndes Schattengewand, weiße Noh-Maske mit lila Tränen-Malereien.',
    lore: 'Ein Wesen ohne Namen aus den Tiefen des Abgrunds. Es wandelt lautlos und beobachtet die Welt.',
    palette: ['#09090b', '#f4f4f5', '#7c3aed', '#18181b'],
    render: renderMukuroShadow
  }
];

const CHARACTERS_MAP = CHARACTERS_DATA.reduce((acc, char) => {
  acc[char.id] = char;
  return acc;
}, {});


// --- bestiary.js ---
/**
 * Ocarina of Brawls - Bestiarium & Monster-Handbuch
 * 20 detaillierte, prozedural animierte Gegner-Modelle im "Süßen Dark Ghibli 2.5D Papercraft"-Stil
 * Inspiriert von Prinzessin Mononoke, Chihiros Reise ins Zauberland, Totoro und japanischer Mythologie
 */

// =============================================================================
// GHIBLI PAPERCRAFT DRAWING HELPERS
// Polyfill for CanvasRenderingContext2D.prototype.roundRect on older browsers/mobile devices
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    this.rect(x, y, w, h);
  };
}

/** Zeichnet weichen Papierschatten unter dem Wesen */
function drawPaperShadow(ctx, cx, cy, rx, ry, alpha = 0.28) {
  ctx.save();
  ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Zeichnet ausdrucksstarke Ghibli-Anime-Augen mit Glanzpunkten und Wangen-Rouge */
function drawGhibliEyes(ctx, lx, rx, y, r, dx = 0, dy = 0, isBlinking = false, blush = true) {
  ctx.save();
  if (isBlinking) {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(lx, y, r, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rx, y, r, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  } else {
    // Sklera / Weiß
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(lx, y, r * 1.05, r * 1.25, 0, 0, Math.PI * 2);
    ctx.ellipse(rx, y, r * 1.05, r * 1.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris / Dunkel
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(lx + dx, y + dy, r * 0.75, 0, Math.PI * 2);
    ctx.arc(rx + dx, y + dy, r * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Glanzpunkte (Specular highlights)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lx + dx - r * 0.25, y + dy - r * 0.25, r * 0.3, 0, Math.PI * 2);
    ctx.arc(rx + dx - r * 0.25, y + dy - r * 0.25, r * 0.3, 0, Math.PI * 2);
    ctx.arc(lx + dx + r * 0.2, y + dy + r * 0.2, r * 0.15, 0, Math.PI * 2);
    ctx.arc(rx + dx + r * 0.2, y + dy + r * 0.2, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sanftes Wangen-Rouge (Blush)
  if (blush) {
    ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
    ctx.beginPath();
    ctx.ellipse(lx - r * 0.8, y + r * 0.8, r * 0.75, r * 0.38, -0.15, 0, Math.PI * 2);
    ctx.ellipse(rx + r * 0.8, y + r * 0.8, r * 0.75, r * 0.38, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Zeichnet eine feine Porzellanmaske mit Zinnober-Kitsune-/Mononoke-Malereien */
function drawPorcelainMask(ctx, cx, cy, w, h, style = 'fox') {
  ctx.save();
  // Weicher Maskenschatten
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(cx + 1, cy + 1, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Weißes Porzellan
  ctx.fillStyle = '#fdfbf7';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Zinnoberrote Ritual-Malerei
  ctx.fillStyle = '#e11d48';
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 1.4;

  if (style === 'fox') {
    // Kitsune-Augenbrauen und Wangenwirbel
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.3, cy - h * 0.15);
    ctx.quadraticCurveTo(cx - w * 0.15, cy - h * 0.35, cx - w * 0.05, cy - h * 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.3, cy - h * 0.15);
    ctx.quadraticCurveTo(cx + w * 0.15, cy - h * 0.35, cx + w * 0.05, cy - h * 0.15);
    ctx.stroke();

    // Rote Wangenstreifen
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.4, cy + h * 0.1);
    ctx.lineTo(cx - w * 0.15, cy + h * 0.18);
    ctx.moveTo(cx + w * 0.4, cy + h * 0.1);
    ctx.lineTo(cx + w * 0.15, cy + h * 0.18);
    ctx.stroke();
  } else if (style === 'noh') {
    // Kaonashi / No-Face Tränenpunkte
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.22, cy - h * 0.2, w * 0.08, h * 0.12, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + w * 0.22, cy - h * 0.2, w * 0.08, h * 0.12, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - w * 0.22, cy + h * 0.2, w * 0.08, h * 0.12, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + w * 0.22, cy + h * 0.2, w * 0.08, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Augen-Schlitze
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.2, cy - h * 0.05, w * 0.12, h * 0.06, 0.1, 0, Math.PI * 2);
  ctx.ellipse(cx + w * 0.2, cy - h * 0.05, w * 0.12, h * 0.06, -0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Zeichnet einen niedlichen kleinen Kodama (Baumgeist mit Wackelkopf) */
function drawKodama(ctx, x, y, tilt = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Kleiner milchweißer Körper
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(0, 4, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wackelkopf
  ctx.translate(0, -2);
  ctx.rotate(tilt);
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neugierige hohle Augen & Mund
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-2, -0.5, 0.9, 0, Math.PI * 2);
  ctx.arc(2, -0.5, 0.9, 0, Math.PI * 2);
  ctx.arc(0, 1.8, 0.75, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Zeichnet einen flauschigen Rußmännchen-Begleiter (Susuwatari) */
function drawSootSprite(ctx, x, y, r, time, holdingCandy = false) {
  ctx.save();
  ctx.translate(x, y);

  // Flauschige Stachelspitzen
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  const spikes = 10;
  for (let i = 0; i < spikes; i++) {
    const angle = (i / spikes) * Math.PI * 2;
    const spikeR = r + Math.sin(time * 8 + i * 2) * 1.5;
    const px = Math.cos(angle) * spikeR;
    const py = Math.sin(angle) * spikeR;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Zentraler runder Körper
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Große Kulleraugen
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.15, r * 0.38, 0, Math.PI * 2);
  ctx.arc(r * 0.35, -r * 0.15, r * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Pupillen (blicken neugierig)
  const pLook = Math.sin(time * 3) * 0.5;
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(-r * 0.35 + pLook, -r * 0.15, r * 0.18, 0, Math.PI * 2);
  ctx.arc(r * 0.35 + pLook, -r * 0.15, r * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // Konpeitō (Stern-Zuckerchen in den Pfötchen)
  if (holdingCandy) {
    const candyY = r * 0.7;
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, candyY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(-1, candyY - 1, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** Zeichnet eine traditionelle japanische Papierlaterne (Chōchin) */
function drawPaperLantern(ctx, x, y, w, h, time, glowColor = '#f59e0b') {
  ctx.save();
  ctx.translate(x, y);

  // Weicher Lichtschein
  ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(w, h) * 0.9 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
  ctx.fill();

  // Aufhängung
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.6);
  ctx.lineTo(0, -h * 0.4);
  ctx.stroke();

  // Laternenkörper (Rot / Pergament)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.5, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Warmes inneres Licht
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.28, h * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bambus-Rippen
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.2, w * 0.42, h * 0.12, 0, 0, Math.PI * 2);
  ctx.ellipse(0, h * 0.2, w * 0.42, h * 0.12, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Quaste unten
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-1, h * 0.45, 2, 4);

  ctx.restore();
}

/** Zeichnet ein zartes Kirschblütenblatt (Sakura) */
function drawSakuraPetal(ctx, x, y, rot, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.quadraticCurveTo(3, -2, 2, 3);
  ctx.quadraticCurveTo(0, 5, -2, 3);
  ctx.quadraticCurveTo(-3, -2, 0, -4);
  ctx.fill();
  ctx.restore();
}

// =============================================================================
// BESTIARY DATA (20 ENEMY MODELS - GHIBLI PAPERCRAFT EDITION)
// =============================================================================

const BESTIARY_DATA = [
  // =========================================================================
  // 1. FERNKAMPF (RANGE)
  // =========================================================================
  {
    id: 'moss_archer',
    name: 'Waldläufer-Schütze',
    title: 'Kitsune Moss Ranger',
    category: 'range',
    categoryName: '🏹 Fernkampf',
    biome: 'Grasland / Dichter Wald',
    biomeBadge: 'Grasland',
    badgeClass: 'badge-grass',
    variants: ['Waldgrün (Standard)', 'Wüstensand (Ockergelb)', 'Schneetarn (Polarweiß)'],
    stats: { hp: 45, maxHp: 50, atk: 18, spd: 'Schnell', rng: '180px (Hoch)' },
    behavior: 'Lauert lautlos im Geäst und feuert treffsichere Moospfeile. Nähert sich der Spieler auf unter 35px, springt er mit einer geschickten Rückwärtsrolle ins Blattwerk.',
    counter: 'Mit erhobenem Schild vorrücken, um die Pfeile abprallen zu lassen. Im Moment seines Nachladens mit einem schnellen Dash zuschlagen.',
    lore: 'Trägt eine handgeschnitzte Kitsune-Porzellanmaske. Auf seiner Schulter reist stets ein kleiner Kodama-Baumgeist mit, der ihm die Windrichtung zuflüstert.',
    palette: { primary: '#15803d', secondary: '#166534', cloth: '#22c55e', bow: '#854d0e', skin: '#fde047' },
    render(ctx, cx, cy, time, state, hitFlash) {
      const breath = Math.sin(time * 3) * 1.5;
      const isAttacking = state === 'attack';
      const isWalking = state === 'walk';
      const walkCycle = Math.sin(time * 8) * 3;

      drawPaperShadow(ctx, cx, cy + 18, 13, 4.5);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Kodama auf linker Schulter
      const kodamaTilt = Math.sin(time * 2.5) * 0.25;
      drawKodama(ctx, cx - 11, cy - 2 + breath * 0.6, kodamaTilt, 0.9);

      // Beine & gefaltete Lederstiefel
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(cx - 5.5, cy + 8, 3.2, 9 + (isWalking ? walkCycle : 0), 1.5);
      ctx.roundRect(cx + 2.5, cy + 8, 3.2, 9 - (isWalking ? walkCycle : 0), 1.5);
      ctx.fill();

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(cx - 6.5, cy + 15 + (isWalking ? walkCycle : 0), 4.5, 3.2, 1.2);
      ctx.roundRect(cx + 1.5, cy + 15 - (isWalking ? walkCycle : 0), 4.5, 3.2, 1.2);
      ctx.fill();

      // Körper / Gestufter Blatt-Poncho
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 3 + breath);
      ctx.quadraticCurveTo(cx - 10, cy + 11 + breath, cx - 4, cy + 12 + breath);
      ctx.quadraticCurveTo(cx, cy + 13 + breath, cx + 4, cy + 12 + breath);
      ctx.quadraticCurveTo(cx + 10, cy + 11 + breath, cx + 8, cy - 3 + breath);
      ctx.closePath();
      ctx.fill();

      // Innere Blattlage (hellgrün gestuft)
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy + 1 + breath);
      ctx.quadraticCurveTo(cx, cy + 11 + breath, cx + 5, cy + 1 + breath);
      ctx.closePath();
      ctx.fill();

      // Gürtel & Eichel-Schnalle
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 7, cy + 6 + breath, 14, 2);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy + 7 + breath, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Köcher mit zarten Papier-Pfeilfedern
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx - 10, cy - 7 + breath, 3.5, 12);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - 11, cy - 11 + breath, 1.8, 4);
      ctx.fillRect(cx - 8.5, cy - 10 + breath, 1.8, 4);

      // Kapuze mit Fuchsohren
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(cx, cy - 6 + breath, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Kapuzenspitze geschwungen
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 12 + breath);
      ctx.quadraticCurveTo(cx - 8, cy - 16 + breath, cx - 11, cy - 14 + breath);
      ctx.lineTo(cx + 1, cy - 11 + breath);
      ctx.closePath();
      ctx.fill();

      // Kitsune Porzellan-Halbmaske mit roten Zeichen
      drawPorcelainMask(ctx, cx, cy - 6 + breath, 10, 8.5, 'fox');

      // Bogen aus Birkenholz mit Sakura-Band
      const bowPull = isAttacking ? Math.sin(time * 12) * 4.5 : 0;
      const bowX = cx + 8 + (isAttacking ? 3 : 0);
      const bowY = cy + 2 + breath;

      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(bowX, bowY, 11, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();

      // Sakura-Bändchen am Bogenhorn
      drawSakuraPetal(ctx, bowX - 2, bowY - 11, Math.sin(time * 4) * 0.4, 0.8);

      // Bogensehne
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bowX - 4, bowY - 10);
      ctx.lineTo(bowX - 8 - bowPull, bowY);
      ctx.lineTo(bowX - 4, bowY + 10);
      ctx.stroke();

      // Leuchtender Waldpfeil bei Angriff
      if (isAttacking) {
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(bowX - 8 - bowPull, bowY);
        ctx.lineTo(bowX + 11, bowY);
        ctx.stroke();

        ctx.fillStyle = '#bbf7d0';
        ctx.beginPath();
        ctx.moveTo(bowX + 13, bowY);
        ctx.lineTo(bowX + 9, bowY - 2.5);
        ctx.lineTo(bowX + 9, bowY + 2.5);
        ctx.fill();
      }

      ctx.filter = 'none';
    }
  },

  {
    id: 'spore_spitter',
    name: 'Sporen-Spucker',
    title: 'Spore Dumpling Yokai',
    category: 'range',
    categoryName: '🏹 Fernkampf',
    biome: 'Sumpf & Pilzgrotten',
    biomeBadge: 'Sumpf',
    badgeClass: 'badge-swamp',
    variants: ['Giftgrün (Standard)', 'Neon-Lila (Tiefsteinhöhle)', 'Gletscherblau (Frostpilz)'],
    stats: { hp: 55, maxHp: 60, atk: 22, spd: 'Langsam', rng: '160px (Bogen)' },
    behavior: 'Ein pummeliger Pilzgeist, der friedlich im Moos döst, bei Störung jedoch zischende Leuchtsporen im hohen Bogen spuckt. Hinterlässt beim Aufprall glitzernden Nebel.',
    counter: 'Die bogenförmigen Flugbahnen sind langsam. Seitlich ausweichen und den kurzen Moment nutzen, in dem er nach dem Spucken erschöpft seufzt.',
    lore: 'Seine samtige Haube duftet nach feuchtem Waldboden und süßen Blaubeeren. Mag es besonders, wenn man ihn sanft am Stiel krault.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const isWalking = state === 'walk';
      const breath = Math.sin(time * 3.5) * 1.5;
      const squash = isAttacking ? Math.sin(time * 10) * 3 : (isWalking ? Math.sin(time * 8) * 1.5 : 0);

      drawPaperShadow(ctx, cx, cy + 16, 14, 5);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // 4 zarte Wurzelbeinchen
      ctx.fillStyle = '#451a03';
      for (let i = -1.5; i <= 1.5; i += 1) {
        const footWiggle = isWalking ? Math.sin(time * 8 + i * 1.5) * 2.5 : 0;
        ctx.beginPath();
        ctx.ellipse(cx + i * 5.5, cy + 13 + footWiggle, 2.2, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Runder, samtiger Pilzkörper (Deep Indigo & Magenta)
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4 - squash * 0.5, 13 + breath * 0.5, 11 + squash, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bauchbereich heller (Fliederfarbenes Pergament)
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6 - squash * 0.5, 9, 7 + squash * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mintgrüne Leucht-Polkapunkte
      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.arc(cx - 7, cy + 1, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 7, cy + 3, 2, 0, Math.PI * 2);
      ctx.arc(cx - 2, cy + 8, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Kamin-Mund auf dem Kopf
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 6);
      ctx.quadraticCurveTo(cx - 8, cy - 13 - squash, cx - 5, cy - 14 - squash);
      ctx.lineTo(cx + 5, cy - 14 - squash);
      ctx.quadraticCurveTo(cx + 8, cy - 13 - squash, cx + 6, cy - 6);
      ctx.closePath();
      ctx.fill();

      // Mündungsschlund mit zartem Leuchten
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 14 - squash, 6, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Niedliche schläfrige Kulleraugen
      const blink = Math.sin(time * 1.8) > 0.95;
      drawGhibliEyes(ctx, cx - 4.5, cx + 4.5, cy + 2 - squash * 0.4, 2.4, 0, 0.4, blink, true);

      // Schwebende Sporenbläschen
      if (isAttacking) {
        // Große leuchtende Sporen-Kugel
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(cx, cy - 22 - squash, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#bbf7d0';
        ctx.beginPath();
        ctx.arc(cx - 1.5, cy - 23.5 - squash, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Zarte kleine Schwebepartikel
        const bubbleY = (time * 18) % 24;
        ctx.fillStyle = 'rgba(110, 231, 183, 0.7)';
        ctx.beginPath();
        ctx.arc(cx + Math.sin(time * 3) * 4, cy - 16 - bubbleY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 2. BOSS / TANK / MONSTER (KOLOSS)
  // =========================================================================
  {
    id: 'boulder_troll',
    name: 'Moos-Koloss',
    title: 'Laputa Stone Guardian',
    category: 'boss',
    categoryName: '🛡️ Koloss / Boss',
    biome: 'Felsgebirge & Berggipfel',
    biomeBadge: 'Gebirge',
    badgeClass: 'badge-mountain',
    variants: ['Granit-Moos (Standard)', 'Vulkanasche (Basaltschwarz)', 'Marmorglanz (Alabaster)'],
    scale: 1.6,
    xpValue: 200,
    stats: { hp: 1400, maxHp: 1400, atk: 60, spd: 'Schwerfällig', rng: '50px (Flächen-Beben)' },
    behavior: 'Uralter Steingolem, bewachsen mit Moos und Miniatur-Bonsai. Stampft im Takt der Bergadern. Rammt beide Fäuste in die Erde für verheerende Stoßwellen.',
    counter: 'Seine wuchtigen Schläge haben lange Vorbereitung. Während er ausholt, hinter ihn rollen und den moosfreien Riss an seinem Rücken attackieren.',
    lore: 'Wacht seit Jahrhunderten über zerfallene Himmelsruinen. Kleine Glühwürmchen schlafen nachts geborgen in seinen Steinfugen.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const breath = Math.sin(time * 2) * 1.2;
      const isAttacking = state === 'attack';
      const isWalking = state === 'walk';
      const sway = isWalking ? Math.sin(time * 4) * 3 : 0;

      drawPaperShadow(ctx, cx, cy + 22, 22, 7);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Uralter runder Felskörper (Slate Grey Papercraft)
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(cx + sway * 0.3, cy + 3 + breath, 18, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Steinstruktur / Geschichtete Felsplatten
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.ellipse(cx + sway * 0.3, cy + 1 + breath, 15, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Moosdecke auf Schultern und Kopf (Lush Moss)
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(cx + sway * 0.3, cy - 9 + breath, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(cx - 3 + sway * 0.3, cy - 10 + breath, 8, 4, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Bonsai-Zweiglein mit 3 Blättern auf rechter Schulter
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx + 8 + sway * 0.3, cy - 10 + breath);
      ctx.quadraticCurveTo(cx + 14 + sway * 0.3, cy - 15 + breath, cx + 12 + sway * 0.3, cy - 19 + breath);
      ctx.stroke();

      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(cx + 12 + sway * 0.3, cy - 20 + breath, 2.5, 1.5, 0.4, 0, Math.PI * 2);
      ctx.ellipse(cx + 15 + sway * 0.3, cy - 16 + breath, 2.2, 1.4, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Uralte leuchtende Bernstein-Augenschlitze (Laputa Look)
      const eyeBlink = Math.sin(time * 1.5) > 0.94;
      if (!eyeBlink) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.ellipse(cx - 5 + sway * 0.3, cy - 1 + breath, 3, 1.8, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 5 + sway * 0.3, cy - 1 + breath, 3, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(cx - 5 + sway * 0.3, cy - 1 + breath, 1.2, 0, Math.PI * 2);
        ctx.arc(cx + 5 + sway * 0.3, cy - 1 + breath, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Massive Steinfäuste
      const armLift = isAttacking ? Math.sin(time * 8) * 12 : 0;
      ctx.fillStyle = '#1e293b';
      // Linke Faust
      ctx.beginPath();
      ctx.ellipse(cx - 16 + sway, cy + 12 + breath - armLift, 6.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Rechte Faust
      ctx.beginPath();
      ctx.ellipse(cx + 16 + sway, cy + 12 + breath - armLift, 6.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Umkreisende Glühwürmchen (Totoro / Waldgeist-Touch)
      const fireflyAngle = time * 2;
      const ffx = cx + Math.cos(fireflyAngle) * 22;
      const ffy = cy + Math.sin(fireflyAngle) * 9 + breath;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(ffx, ffy, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.filter = 'none';
    }
  },

  {
    id: 'frost_giant',
    name: 'Yeti-Wächter',
    title: 'Frosthorn Snow Totoro',
    category: 'boss',
    categoryName: '🛡️ Koloss / Boss',
    biome: 'Gletscher & Schneegipfel',
    biomeBadge: 'Schnee',
    badgeClass: 'badge-ice',
    variants: ['Gletscherweiß (Standard)', 'Polar-Nacht (Arktis-Blau)', 'Kristallquarz (Türkis)'],
    scale: 1.65,
    xpValue: 220,
    stats: { hp: 1500, maxHp: 1500, atk: 65, spd: 'Langsam', rng: '65px (Eis-Keule)' },
    behavior: 'Ein gemütlicher, flauschiger Schnee-Yeti mit mächtigen Eis-Widderhörnern. Schwingt eine uralte Eiskristall-Keule und beschwört sanfte Schneewirbel.',
    counter: 'Feuer- und Spreng-Angriffe schmelzen seine Schneefell-Rüstung. Im Moment seines Keulenschwungs unter seinen Beinen durchrollen.',
    lore: 'An seinem linken Horn baumelt eine alte rote Papierlaterne, die ihm ein verlorener Wanderer einst zum Dank schenkte. Das Licht erlischt niemals.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const breath = Math.sin(time * 2.2) * 1.5;
      const isAttacking = state === 'attack';
      const isWalking = state === 'walk';
      const step = isWalking ? Math.sin(time * 6) * 3 : 0;

      drawPaperShadow(ctx, cx, cy + 22, 20, 6);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Flauschiger schneeweißer Wolkenkörper (Totoro Snow Silhouette)
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 5 + breath, 18, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 3 + breath, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bauchfell mit Eis-Tönung
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 7 + breath, 11, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Kulleraugen & blaue Stupsnase
      drawGhibliEyes(ctx, cx - 5.5, cx + 5.5, cy - 2 + breath, 2.5, 0, 0.2, false, false);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2.5 + breath, 2.5, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Transparente Gletscher-Widderhörner
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      // Rechtes Horn
      ctx.beginPath();
      ctx.arc(cx + 12, cy - 9 + breath, 8, -Math.PI * 0.2, Math.PI * 0.7);
      ctx.stroke();
      // Linkes Horn
      ctx.beginPath();
      ctx.arc(cx - 12, cy - 9 + breath, 8, Math.PI * 0.3, Math.PI * 1.2);
      ctx.stroke();

      // Rote Papierlaterne am linken Horn (schwankend im Wind)
      const lanternSwing = Math.sin(time * 3) * 0.25;
      drawPaperLantern(ctx, cx - 18 + lanternSwing * 6, cy - 3 + breath, 8, 10, time, '#fef08a');

      // Eiskristall-Keule in der rechten Pranke
      const clubSwing = isAttacking ? Math.sin(time * 8) * 20 : 0;
      ctx.save();
      ctx.translate(cx + 16, cy + 4 + breath);
      ctx.rotate(clubSwing * Math.PI / 180);
      // Holzgriff
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, -14, 4, 18);
      // Glänzender Eisblock
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(-6, -22, 12, 10, 2);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(-4, -20, 4, 4);
      ctx.restore();

      // Flauschige Schneefüße
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(cx - 8, cy + 18 + step, 6, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 8, cy + 18 - step, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 3. REPTILIEN & SCHLANGEN (REPTILE)
  // =========================================================================
  {
    id: 'slithering_viper',
    name: 'Smaragd-Natter',
    title: 'Jade Ribbon Dragon',
    category: 'reptile',
    categoryName: '🐍 Reptilien & Schlangen',
    biome: 'Dschungel & Feuchtgebiete',
    biomeBadge: 'Dschungel',
    badgeClass: 'badge-grass',
    variants: ['Smaragdgrün (Standard)', 'Amethyst (Giftviper)', 'Goldkobra (Wüste)'],
    stats: { hp: 50, maxHp: 50, atk: 24, spd: 'Sehr Schnell', rng: '30px (Giftbiss)' },
    behavior: 'Gleitet in weichen, eleganten Sinuswellen lautlos durchs Gras. Schnellt blitzartig vor für einen giftigen Überraschungsbiss.',
    counter: 'Ihre Gleitbahn ist vorhersehbar. Im Moment ihres Ausholens zur Seite hechten und mit einem Rundumschlag den Schwanz treffen.',
    lore: 'Eine heilige Bote des Waldgeistes. Auf ihrer Schwanzspitze reitet ein winziger Kodama mit einem Seerosenblatt als Sonnenschirm.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const isWalking = state === 'walk';
      const speed = isWalking ? 6.5 : (isAttacking ? 8 : 4);

      drawPaperShadow(ctx, cx, cy + 16, 22, 5);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // 8 geschmeidige Jade-Körperscheiben in Sinuswellen
      const segments = 8;
      const points = [];

      for (let i = segments - 1; i >= 0; i--) {
        const segWave = Math.sin(time * speed - i * 0.55);
        const px = cx + segWave * (12 + (segments - i) * 0.8);
        const py = cy + 12 - i * 3.5;
        const rad = 3.5 + (1 - i / segments) * 4;

        points.push({ x: px, y: py, r: rad });

        // Bauchtönung (Creme-Pergament)
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(px, py + 1.5, rad * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Jadegrüner Rückenschuppen-Körper
        ctx.fillStyle = i % 2 === 0 ? '#059669' : '#10b981';
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();

        // Feine goldene Zierflecken
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(px, py - rad * 0.3, rad * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reitender Kodama auf dem letzten Schwanzsegment! (Ghibli-Charm Pur)
      const tail = points[0];
      drawKodama(ctx, tail.x, tail.y - 6, Math.sin(time * 3) * 0.3, 0.75);

      // Edler Drachen- / Schlangenkopf
      const head = points[points.length - 1];
      const headX = isAttacking ? head.x + Math.sin(time * 12) * 5 : head.x;
      const headY = head.y - 3;

      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.ellipse(headX, headY, 7.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rubinrote Glasaugen
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(headX - 3.5, headY - 1.5, 2, 0, Math.PI * 2);
      ctx.arc(headX + 3.5, headY - 1.5, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headX - 4, headY - 2, 0.8, 0, Math.PI * 2);
      ctx.arc(headX + 3, headY - 2, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Goldene Fühler / Schnurrhaare
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(headX - 4, headY - 3);
      ctx.quadraticCurveTo(headX - 8, headY - 8, headX - 6, headY - 11);
      ctx.moveTo(headX + 4, headY - 3);
      ctx.quadraticCurveTo(headX + 8, headY - 8, headX + 6, headY - 11);
      ctx.stroke();

      // Zarte gespaltene Zunge bei Zischen
      if (Math.sin(time * 6) > 0.4) {
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(headX, headY + 4);
        ctx.lineTo(headX, headY + 8);
        ctx.lineTo(headX - 2, headY + 10);
        ctx.moveTo(headX, headY + 8);
        ctx.lineTo(headX + 2, headY + 10);
        ctx.stroke();
      }

      ctx.filter = 'none';
    }
  },

  {
    id: 'dune_maw',
    name: 'Dünen-Schlund',
    title: 'Terracotta Sand Lotus',
    category: 'reptile',
    categoryName: '🐍 Reptilien & Schlangen',
    biome: 'Wüste & Sanddünen',
    biomeBadge: 'Wüste',
    badgeClass: 'badge-desert',
    variants: ['Terrakotta (Standard)', 'Obsidian (Vulkansand)', 'Geisterweiß (Kalköde)'],
    scale: 1.55,
    xpValue: 60,
    stats: { hp: 340, maxHp: 340, atk: 36, spd: 'Stationär', rng: '45px (Boden-Verschlingen)' },
    behavior: 'Bricht wie eine blühende Keramik-Wüstenlotus aus dem Treibsand hervor. Erzeugt wirbelnde Sandtrichter und schnappt mit glatten Perlzähnen zu.',
    counter: 'Auf die zarten Blütenblätter am Kragen zielen, wenn sich der Schlund öffnet. Bomben direkt in seinen Sandtrichter werfen.',
    lore: 'Aus antiken Terrakotta-Scherben und goldenen Kintsugi-Adern geformt. Sammelt Tautropfen der Wüstennächte in seinem Blütenkelch.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const breath = Math.sin(time * 3) * 1.5;
      const mawOpen = isAttacking ? 6 + Math.sin(time * 12) * 3 : 2 + Math.sin(time * 3) * 1;

      // Wirbelnder Sandtrichter am Boden
      ctx.fillStyle = 'rgba(217, 119, 6, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 20 + Math.sin(time * 4) * 2, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Segmentierter Terrakotta-Hals
      for (let i = 0; i < 3; i++) {
        const segY = cy + 12 - i * 6 + breath;
        ctx.fillStyle = i % 2 === 0 ? '#c2410c' : '#ea580c';
        ctx.beginPath();
        ctx.ellipse(cx, segY, 14 - i * 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Kintsugi-Goldader
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 6 + i * 2, segY);
        ctx.lineTo(cx + 4 - i, segY + 2);
        ctx.stroke();
      }

      // Lotus-Blütenblätter (Korallen-Rosa & Gold)
      const petals = 6;
      ctx.fillStyle = '#fb7185';
      for (let p = 0; p < petals; p++) {
        const angle = (p / petals) * Math.PI * 2;
        const petX = cx + Math.cos(angle) * (11 + mawOpen);
        const petY = cy - 2 + Math.sin(angle) * (5 + mawOpen * 0.4) + breath;
        ctx.beginPath();
        ctx.ellipse(petX, petY, 4.5, 3, angle, 0, Math.PI * 2);
        ctx.fill();
      }

      // Innerer Schlund (Tiefes Dunkel mit leuchtendem Sonnenkern)
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 2 + breath, 10 + mawOpen * 0.5, 6 + mawOpen * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Goldener Sonnen-Nektarkern
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy - 2 + breath, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Kreis glatter weißer Perlzähne
      ctx.fillStyle = '#f8fafc';
      for (let t = 0; t < 8; t++) {
        const tAngle = (t / 8) * Math.PI * 2;
        const tx = cx + Math.cos(tAngle) * (7 + mawOpen * 0.4);
        const ty = cy - 2 + Math.sin(tAngle) * (4 + mawOpen * 0.25) + breath;
        ctx.beginPath();
        ctx.arc(tx, ty, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Zwei neugierige Bernstein-Augen an den Seiten
      drawGhibliEyes(ctx, cx - 11, cx + 11, cy - 6 + breath, 2, 0, 0, false, false);

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 4. MAGIER & KULTISTEN (MAGE)
  // =========================================================================
  {
    id: 'pyromancer',
    name: 'Laternen-Pyromant',
    title: 'Paper Lantern Wraith',
    category: 'mage',
    categoryName: '🔮 Magier & Gelehrte',
    biome: 'Vulkanland & Brandruinen',
    biomeBadge: 'Vulkan',
    badgeClass: 'badge-vulcano',
    variants: ['Feuerrot (Standard)', 'Seelenblau (Geisterflamme)', 'Giftgrün (Hexenfeuer)'],
    stats: { hp: 40, maxHp: 40, atk: 26, spd: 'Mittel', rng: '140px (Flammenwirbel)' },
    behavior: 'Schwebender Geistermönch mit einer traditionellen roten Chōchin-Laterne als Kopf. Wird von zwei verspielten Flämmchen-Begleitern (Hi-no-Tama) umtanzt.',
    counter: 'Feuersäulen kündigen sich durch kleine Funkenwirbel am Boden an. Im Schwebemodus mit Pfeilen aus der Distanz unterbrechen.',
    lore: 'Sein Laternenkopf lächelt stets sanft, selbst im heißesten Gefecht. Die zwei kleinen Flämmchen bringen ihm getrocknete Teeblätter zum Verglühen.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const floatBob = Math.sin(time * 2.5) * 3;

      drawPaperShadow(ctx, cx, cy + 18, 12, 4);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Flatterndes Indigo-Papiergewand mit Talismanen
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 2 + floatBob);
      ctx.quadraticCurveTo(cx - 12, cy + 14 + floatBob, cx - 6, cy + 17 + floatBob);
      ctx.quadraticCurveTo(cx, cy + 15 + floatBob, cx + 6, cy + 17 + floatBob);
      ctx.quadraticCurveTo(cx + 12, cy + 14 + floatBob, cx + 8, cy - 2 + floatBob);
      ctx.closePath();
      ctx.fill();

      // Goldene Talisman-Schärfe
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 2, cy + 2 + floatBob, 4, 10);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - 1, cy + 4 + floatBob, 2, 2);
      ctx.fillRect(cx - 1, cy + 8 + floatBob, 2, 2);

      // Kopf ist eine leuchtende rote Papierlaterne (Chōchin)
      drawPaperLantern(ctx, cx, cy - 8 + floatBob, 14, 15, time, '#fef08a');

      // Freundliches Lächel-Gesicht auf der Laterne ausgeschnitten
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 9 + floatBob, 1.2, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy - 9 + floatBob, 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - 7 + floatBob, 2, 0.1, Math.PI * 0.9);
      ctx.stroke();

      // Zwei niedliche tanzende Flämmchen-Geister (Hi-no-Tama / Calcifers)
      const f1Angle = time * 3;
      const f2Angle = time * 3 + Math.PI;

      const drawFlameSprite = (fx, fy, scale = 1) => {
        ctx.save();
        ctx.translate(fx, fy);
        ctx.scale(scale, scale);
        // Flammenkörper
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 2, 4, 0, Math.PI * 2);
        ctx.moveTo(0, -5);
        ctx.quadraticCurveTo(4, -1, 3, 3);
        ctx.quadraticCurveTo(-4, -1, 0, -5);
        ctx.fill();
        // Leuchtendes Gelb
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Zwei kleine Pünktchen-Augen
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-1.2, 1.5, 0.6, 0, Math.PI * 2);
        ctx.arc(1.2, 1.5, 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      const flameRadius = isAttacking ? 18 + Math.sin(time * 10) * 4 : 14;
      drawFlameSprite(cx + Math.cos(f1Angle) * flameRadius, cy + floatBob + Math.sin(f1Angle) * 6, 0.9);
      drawFlameSprite(cx + Math.cos(f2Angle) * flameRadius, cy + floatBob + Math.sin(f2Angle) * 6, 0.9);

      ctx.filter = 'none';
    }
  },

  {
    id: 'star_astromancer',
    name: 'Wolken-Astrologe',
    title: 'Celestial Owl Sage',
    category: 'mage',
    categoryName: '🔮 Magier & Gelehrte',
    biome: 'Himmelsinseln & Sternwarte',
    biomeBadge: 'Himmel',
    badgeClass: 'badge-sky',
    variants: ['Mitternachtsblau (Standard)', 'Mondsilber (Vollmond)', 'Aurora (Nordlicht)'],
    scale: 1.15,
    xpValue: 85,
    stats: { hp: 480, maxHp: 480, atk: 60, spd: 'Mittel', rng: '150px (Sternschnuppen)' },
    behavior: 'Ein weiser Eulen-Mönch im Sternen-Kimono. Schwebt auf einer zarten rosa Traumwolke und beschwört leuchtende Sternschnuppen-Kaskaden.',
    counter: 'Seine Sternschnuppen schlagen mit kurzer Verzögerung ein. Nach den Einschlägen ist er kurz geblendet – perfekte Zeit für Kombo-Angriffe.',
    lore: 'Trägt einen Kegelhut aus Reisstroh mit kleinen Papier-Glücksstreifen (O-Mikuji). Kennt jeden Stern der Geisterwelt beim Vornamen.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const cloudBob = Math.sin(time * 2.2) * 2.5;

      drawPaperShadow(ctx, cx, cy + 20, 16, 5);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Zartrosa fluffige Traumwolke (Pink Spirit Cloud)
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(cx - 8, cy + 12 + cloudBob, 7, 0, Math.PI * 2);
      ctx.arc(cx, cy + 10 + cloudBob, 9, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy + 12 + cloudBob, 7, 0, Math.PI * 2);
      ctx.fill();

      // Kleiner weiser Eulen-Körper im Mitternachts-Kimono
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 1 + cloudBob, 10, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Goldene Sternen-Muster auf dem Kimono
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(cx - 4, cy + 4 + cloudBob, 1, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy + 6 + cloudBob, 1.2, 0, Math.PI * 2);
      ctx.arc(cx - 1, cy + 8 + cloudBob, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Flauschige weiße Brustfedern
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2 + cloudBob, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Große, weise goldene Eulenaugen & Schnabel
      drawGhibliEyes(ctx, cx - 4, cx + 4, cy - 4 + cloudBob, 2.6, 0, 0, false, false);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 2 + cloudBob);
      ctx.lineTo(cx - 1.5, cy - 0.5 + cloudBob);
      ctx.lineTo(cx + 1.5, cy - 0.5 + cloudBob);
      ctx.fill();

      // Kegelhut aus Reisstroh (Kasa) mit O-Mikuji Papierstreifen
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(cx - 13, cy - 6 + cloudBob);
      ctx.lineTo(cx, cy - 14 + cloudBob);
      ctx.lineTo(cx + 13, cy - 6 + cloudBob);
      ctx.closePath();
      ctx.fill();

      // Glücks-Papierstreifen am Hutrand
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - 8, cy - 5 + cloudBob, 2, 5);
      ctx.fillRect(cx + 6, cy - 5 + cloudBob, 2, 5);

      // Knorriges Holzstabsystem mit kreisendem Sternkristall
      const staffX = cx + 12;
      const staffY = cy + cloudBob;
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(staffX, staffY + 10);
      ctx.lineTo(staffX, staffY - 10);
      ctx.stroke();

      // Kreisender 8-zackiger Stern
      const starRot = time * 3;
      ctx.save();
      ctx.translate(staffX, staffY - 14);
      ctx.rotate(starRot);
      ctx.fillStyle = isAttacking ? '#facc15' : '#38bdf8';
      for (let s = 0; s < 4; s++) {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-1, -4, 2, 8);
      }
      ctx.restore();

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 5. BLOBS & SLIMES (BLOB)
  // =========================================================================
  {
    id: 'green_slime',
    name: 'Tau-Tropfen Blob',
    title: 'Acorn Dewdrop Slime',
    category: 'blob',
    categoryName: '🧪 Blobs & Schleime',
    biome: 'Grasland & Feuchtwiesen',
    biomeBadge: 'Grasland',
    badgeClass: 'badge-grass',
    variants: ['Smaragd-Tau (Standard)', 'Honig-Gelee (Wüste)', 'Frost-Träne (Schnee)'],
    scale: 0.48,
    xpValue: 2,
    stats: { hp: 12, maxHp: 12, atk: 5, spd: 'Mittel', rng: '22px (Körper-Platscher)' },
    behavior: 'Ein herziges, transparentes Tropfen-Wesen mit einem kleinen Eichelkern und Kleeblatt im Bauch. Hüpft fröhlich und teilt sich bei Gefahr kurz in zwei Mini-Tröpfchen.',
    counter: 'Mit einfachen Schwerthieben schnell besiegbar. Vorsicht beim Zerschlagen: Mini-Blobs hüpfen flink davon!',
    lore: 'Entsteht aus Morgentautropfen auf uralten Eichenblättern. Kitzelt sanft an den Zehen und liebt sonnige Waldlichtungen.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const isWalking = state === 'walk';
      const squish = Math.sin(time * 5) * (isWalking ? 3.5 : 1.8);
      const hop = isWalking ? Math.abs(Math.sin(time * 5)) * 6 : 0;

      drawPaperShadow(ctx, cx, cy + 16, 15 + squish, 5 - squish * 0.2);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      const blobY = cy + 4 - hop;

      // Transparenter Smaragd-Gelee-Körper
      ctx.fillStyle = 'rgba(34, 197, 94, 0.88)';
      ctx.beginPath();
      ctx.moveTo(cx, blobY - 14 - squish);
      ctx.bezierCurveTo(cx + 14 + squish, blobY - 10, cx + 16 + squish, blobY + 11, cx, blobY + 12 + squish * 0.5);
      ctx.bezierCurveTo(cx - 16 - squish, blobY + 11, cx - 14 - squish, blobY - 10, cx, blobY - 14 - squish);
      ctx.fill();

      // Eingeschlossene goldene Eichel im Geleebauch (Ghibli-Detail!)
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(cx - 3, blobY + 2, 3, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(cx - 4, blobY - 1, 2.5, 0, Math.PI);
      ctx.fill();

      // Glanz-Highlight auf dem Gelee (Papercraft-Glanz)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.ellipse(cx - 6, blobY - 6, 4, 2, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Wackelndes 4-blättriges Kleeblatt auf dem Kopf
      const leafSway = Math.sin(time * 4) * 0.3;
      ctx.save();
      ctx.translate(cx, blobY - 14 - squish);
      ctx.rotate(leafSway);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-0.8, -4, 1.6, 5);
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(-2, -5, 2, 0, Math.PI * 2);
      ctx.arc(2, -5, 2, 0, Math.PI * 2);
      ctx.arc(0, -7, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Riesen-Kulleraugen & niedlicher Katzenmund
      drawGhibliEyes(ctx, cx - 5, cx + 5, blobY - 1, 2.8, 0, 0, false, true);

      // Kleiner süßer Mund
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(cx - 1.2, blobY + 4, 1.2, 0.2, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 1.2, blobY + 4, 1.2, 0.2, Math.PI * 0.9);
      ctx.stroke();

      // Bei Angriff: Zwei winzige jubelnde Baby-Tröpfchen hüpfen an den Seiten!
      if (isAttacking) {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(cx - 16, blobY + 6, 4, 0, Math.PI * 2);
        ctx.arc(cx + 16, blobY + 6, 4, 0, Math.PI * 2);
        ctx.fill();
        drawGhibliEyes(ctx, cx - 17, cx - 15, blobY + 5, 1, 0, 0, false, false);
        drawGhibliEyes(ctx, cx + 15, cx + 17, blobY + 5, 1, 0, 0, false, false);
      }

      ctx.filter = 'none';
    }
  },

  {
    id: 'tar_mire',
    name: 'Teer-Schlamm',
    title: 'Susuwatari Soot Overlord',
    category: 'blob',
    categoryName: '🧪 Blobs & Schleime',
    biome: 'Sumpf & Teergruben',
    biomeBadge: 'Sumpf',
    badgeClass: 'badge-swamp',
    variants: ['Tiefschwarz (Standard)', 'Pech-Violett (Abyss)', 'Kupferlack (Erzsumpf)'],
    stats: { hp: 70, maxHp: 70, atk: 20, spd: 'Sehr Langsam', rng: '40px (Kleb-Pfütze)' },
    behavior: 'Eine große kuschelige Rußmännchen-Königin (Susuwatari) aus samtigem Tintenflaum. Umgeben von flinken kleinen Rußmännchen, die bunte Zuckerchen tragen.',
    counter: 'Seine klebrige Hülle verlangsamt Nahkämpfer. Mit Fackeln oder Feuerschwert anzünden, um die Tintenhülle zu verbrennen.',
    lore: 'Lebt in verlassenen Dachböden und alten Kaminen. Versteckt glitzernde Sternbonbons (Konpeitō) in seinem weichen Tintenbauch.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const breath = Math.sin(time * 3) * 1.5;

      drawPaperShadow(ctx, cx, cy + 18, 18, 5.5);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Großer flauschiger Ruß-Körper (Susuwatari Queen)
      drawSootSprite(ctx, cx, cy + 4 + breath, 14, time, false);

      // Große verdutzte Kulleraugen blicken umher
      const lookX = Math.sin(time * 2) * 1.5;
      drawGhibliEyes(ctx, cx - 5, cx + 5, cy + 2 + breath, 3.2, lookX, 0, false, false);

      // 3 kleine flinke Rußmännchen-Kinder um sie herum!
      // 1. Rußmännchen links mit Sternzuckerchen (Konpeitō)
      drawSootSprite(ctx, cx - 18, cy + 14 + Math.sin(time * 6) * 1.5, 4, time, true);

      // 2. Rußmännchen rechts hüpfend
      drawSootSprite(ctx, cx + 17, cy + 12 + Math.abs(Math.sin(time * 7)) * -3, 3.5, time, false);

      // 3. Rußmännchen vorne neugierig
      drawSootSprite(ctx, cx + 2, cy + 17, 3, time, false);

      // Bei Angriff: Pustet sich auf und sprüht kleine harmlose Zuckerchen!
      if (isAttacking) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(time * 12) * 14, cy - 10 + Math.sin(time * 12) * 6, 2, 0, Math.PI * 2);
        ctx.arc(cx - Math.cos(time * 12) * 14, cy - 8 - Math.sin(time * 12) * 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 6. WILDTIERE (BEAST)
  // =========================================================================
  {
    id: 'dire_wolf',
    name: 'Schattenwolf',
    title: 'Okami Spirit Wolf',
    category: 'beast',
    categoryName: '🐺 Wilde Bestien',
    biome: 'Dunkelwald & Taiga',
    biomeBadge: 'Dunkelwald',
    badgeClass: 'badge-grass',
    variants: ['Nachtschwarz (Standard)', 'Schneeweiß (Tundra)', 'Blutmond (Karmesin)'],
    stats: { hp: 60, maxHp: 60, atk: 28, spd: 'Sehr Schnell', rng: '35px (Anspring-Biss)' },
    behavior: 'Ein majestätischer Geisterwolf, inspiriert vom Wolfsgott aus Prinzessin Mononoke und Okami. Trägt heilige Shimenawa-Seile mit Zickzack-Papier.',
    counter: 'Reißt beim Anspringen die Deckung auf. Exakt im Moment seines Sprungs zur Seite rollen und von der Flanke attackieren.',
    lore: 'Beschützt heilige Schreine im tiefen Wald. Heult nur bei Neumond, wenn die Geisterbrücke zur Anderswelt offen steht.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const isWalking = state === 'walk';
      const breath = Math.sin(time * 3) * 1.2;
      const gallop = isWalking ? Math.sin(time * 9) * 3 : 0;

      drawPaperShadow(ctx, cx, cy + 18, 18, 5);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Geschwungener buschiger Geister-Schweif
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 6 + breath);
      ctx.quadraticCurveTo(cx - 20, cy - 2 + Math.sin(time * 4) * 4, cx - 22, cy - 10);
      ctx.quadraticCurveTo(cx - 14, cy - 4, cx - 8, cy + 8 + breath);
      ctx.fill();

      // Beine
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 8, cy + 8, 3, 10 + gallop);
      ctx.fillRect(cx + 6, cy + 8, 3, 10 - gallop);

      // Wolfskörper (Elegantes tiefdunkles Pergament mit weißer Brust)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 5 + breath, 13, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Weiße Brustpartie
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy + 4 + breath, 6, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Heiliges Shimenawa-Seil mit Shide-Papieranhängern um den Hals
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(cx + 6, cy + 2 + breath, 5, 6, 0.4, 0, Math.PI * 2);
      ctx.stroke();

      // Weiße Zickzack-Papieranhänger (Shide)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 7, cy + 6 + breath, 2, 4);
      ctx.fillRect(cx + 4, cy + 7 + breath, 2, 3.5);

      // Edler Wolfskopf mit spitzen Ohren
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(cx + 9, cy - 4 + breath, 7, 5.5, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Spitze aufmerksame Ohren
      ctx.beginPath();
      ctx.moveTo(cx + 5, cy - 8 + breath);
      ctx.lineTo(cx + 7, cy - 15 + breath);
      ctx.lineTo(cx + 10, cy - 7 + breath);
      ctx.moveTo(cx + 10, cy - 8 + breath);
      ctx.lineTo(cx + 13, cy - 14 + breath);
      ctx.lineTo(cx + 14, cy - 6 + breath);
      ctx.fill();

      // Zinnoberrote Ritual-Kriegsbemalung um die Augen (Mononoke Look)
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx + 7, cy - 5 + breath);
      ctx.lineTo(cx + 12, cy - 3 + breath);
      ctx.stroke();

      // Bernstein-Glanzaugen
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx + 10, cy - 4 + breath, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + 9.5, cy - 4.5 + breath, 0.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.filter = 'none';
    }
  },

  {
    id: 'emperor_scorpion',
    name: 'Kaiser-Skorpion',
    title: 'Porcelain Jade Scorpion',
    category: 'beast',
    categoryName: '🐺 Wilde Bestien',
    biome: 'Wüste & Felsenschluchten',
    biomeBadge: 'Wüste',
    badgeClass: 'badge-desert',
    variants: ['Smaragd-Chitin (Standard)', 'Obsidianschwarz (Abyss)', 'Kupfererz (Mine)'],
    stats: { hp: 75, maxHp: 75, atk: 25, spd: 'Mittel', rng: '45px (Schwanzstachel)' },
    behavior: 'Ein Tempelwächter-Skorpion aus antiker Seladon-Keramik. Seine Scheren ähneln zarten Lotusknospen; sein Stachelschwanz trägt eine leuchtende Spinnenlilien-Laterne.',
    counter: 'Blockt frontale Schläge mit den Keramikscheren ab. Umkreisen und den weichen Ansatz des Stachelschwanzes anvisieren.',
    lore: 'Wurde vor Jahrtausenden von Kaiserlichen Kunsthandwerkern geschaffen, um Juwelenkammern vor Grabräubern zu beschützen.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const breath = Math.sin(time * 3) * 1.2;

      drawPaperShadow(ctx, cx, cy + 18, 19, 5);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // 6 feine Scherenschreitbeine
      ctx.strokeStyle = '#065f46';
      ctx.lineWidth = 1.6;
      for (let i = -1; i <= 1; i++) {
        const legSway = Math.sin(time * 6 + i * 2) * 2;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy + 4 + i * 4);
        ctx.lineTo(cx - 15, cy + 8 + legSway);
        ctx.lineTo(cx - 18, cy + 16);
        ctx.moveTo(cx + 6, cy + 4 + i * 4);
        ctx.lineTo(cx + 15, cy + 8 - legSway);
        ctx.lineTo(cx + 18, cy + 16);
        ctx.stroke();
      }

      // Seladon-Jade Panzerplatte mit Kintsugi-Linien
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6 + breath, 11, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 5 + breath, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Kintsugi Goldriss
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 4 + breath);
      ctx.lineTo(cx + 2, cy + 7 + breath);
      ctx.stroke();

      // Lotus-Scherenarme vorne
      const drawLotusClaw = (clawX, clawY, angle) => {
        ctx.save();
        ctx.translate(clawX, clawY);
        ctx.rotate(angle);
        ctx.fillStyle = '#0d9488';
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fb7185'; // Rosa Lotusspitze
        ctx.beginPath();
        ctx.arc(3, -1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      const clawClick = Math.sin(time * 5) * 0.2;
      drawLotusClaw(cx - 12, cy - 2 + breath, -0.4 + clawClick);
      drawLotusClaw(cx + 12, cy - 2 + breath, 0.4 - clawClick);

      // Geschwungener Skorpionschwanz
      const tailWhip = isAttacking ? Math.sin(time * 12) * 15 : Math.sin(time * 3) * 4;
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 10 + breath);
      ctx.quadraticCurveTo(cx - 8, cy - 6, cx - 4 + tailWhip * 0.3, cy - 14 + breath);
      ctx.stroke();

      // Spinnenlilien-Laterne an der Stachelspitze (Higanbana Lantern)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx - 4 + tailWhip * 0.3, cy - 15 + breath, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Glänzender Gift-Tautropfen
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx - 4 + tailWhip * 0.3, cy - 17 + breath, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.filter = 'none';
    }
  },

  {
    id: 'tusk_boar',
    name: 'Grasland-Wildschwein',
    title: 'Mossback Forest Boar',
    category: 'beast',
    categoryName: '🐺 Wilde Bestien',
    biome: 'Grasland & Hügelland',
    biomeBadge: 'Grasland',
    badgeClass: 'badge-grass',
    variants: ['Erdbraun (Standard)', 'Moosrücken (Uralter Wald)', 'Alabaster-Hauer (Schnee)'],
    stats: { hp: 70, maxHp: 70, atk: 22, spd: 'Mittel (Schneller Ansturm)', rng: '30px (Hauer-Stoß)' },
    behavior: 'Ein pummeliges Waldhüter-Wildschwein mit Moosdecke und Kirschblüten auf dem Rücken. Schnaubt gemütlich, stürmt bei Bedrohung wie ein Rammbock vor.',
    counter: 'Beim Ansturm kann es nicht lenken. Rechtzeitig zur Seite springen; prallt es gegen einen Felsen, ist es für 3 Sekunden benommen.',
    lore: 'Schläft am liebsten unter alten Kastanienbäumen. Kleine Waldvögel baden gerne in den weichen Pfützen seiner Trittspuren.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const isWalking = state === 'walk';
      const breath = Math.sin(time * 3.5) * 1.5;
      const trot = isWalking ? Math.sin(time * 9) * 3 : 0;

      drawPaperShadow(ctx, cx, cy + 18, 18, 6);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // 4 kurze, stämmige Beinchen
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - 9, cy + 8, 4, 9 + trot);
      ctx.fillRect(cx + 6, cy + 8, 4, 9 - trot);

      // Runder kuscheliger Wildschweinkörper (Warm Cocoa Brown)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4 + breath, 15, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Saftige Moosdecke auf dem Rücken
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy - 3 + breath, 12, 5, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Eingebettete Sakura-Kirschblütenblätter im Moos
      drawSakuraPetal(ctx, cx - 6, cy - 5 + breath, 0.3, 0.8);
      drawSakuraPetal(ctx, cx + 2, cy - 4 + breath, -0.4, 0.7);

      // Kuschelige Schlappohren
      ctx.fillStyle = '#542307';
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy - 4 + breath, 3, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Glänzende schwarze Schnauze mit Nüstern
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(cx + 13, cy + 4 + breath, 4.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(cx + 12.5, cy + 3.5 + breath, 0.8, 0, Math.PI * 2);
      ctx.arc(cx + 14.5, cy + 3.5 + breath, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Weiße geschwungene Elfenbeinhauer
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx + 11, cy + 6 + breath);
      ctx.quadraticCurveTo(cx + 16, cy + 8 + breath, cx + 15, cy + 1 + breath);
      ctx.stroke();

      // Kulleraugen mit Glanz
      drawGhibliEyes(ctx, cx + 7, cx + 7, cy - 1 + breath, 2, 0, 0, false, false);

      // Dampfwölkchen aus der Schnauze
      if (Math.sin(time * 3) > 0.5) {
        ctx.fillStyle = 'rgba(248, 250, 252, 0.6)';
        ctx.beginPath();
        ctx.arc(cx + 18, cy + 2 + breath, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.filter = 'none';
    }
  },

  {
    id: 'cave_weaver',
    name: 'Höhlen-Krallenspinne',
    title: 'Dew-Drop Silk Weaver',
    category: 'beast',
    categoryName: '🐺 Wilde Bestien',
    biome: 'Höhlensysteme & Grotten',
    biomeBadge: 'Höhle',
    badgeClass: 'badge-cave',
    variants: ['Tiefsteinschwarz (Standard)', 'Kristallblau (Eishöhle)', 'Glühwurm-Gelb (Biolumineszenz)'],
    scale: 0.72,
    xpValue: 4,
    stats: { hp: 24, maxHp: 24, atk: 10, spd: 'Schnell (Kletternd)', rng: '100px (Spinnennetz-Schuss)' },
    behavior: 'Ein zuckersüßes flauschiges Ruß-Spinnchen mit bunten Ringelsöckchen an den Beinen. Schwingt an einem elastischen Silberfaden und verwebt glitzernde Tautropfen.',
    counter: 'Feuer entzündet ihre Seidennetze sofort. Wenn sie sich am Faden herablässt, mit dem Schild abfangen und mit dem Schwert kontern.',
    lore: 'Ihre Netze klingen wie feine Harfensaiten, wenn der Höhlenwind hindurchweht. Höhlenforscher lauschen oft stundenlang ihrer Musik.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const bungeeBob = Math.sin(time * 4) * (isAttacking ? 6 : 2.5);

      drawPaperShadow(ctx, cx, cy + 22, 14, 4);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Glänzender silberner Seidenfaden nach oben
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 22);
      ctx.lineTo(cx, cy - 4 + bungeeBob);
      ctx.stroke();

      // 6 spindeldürre Beinchen mit gestreiften Ringelsöckchen
      for (let i = -1; i <= 1; i++) {
        const legWave = Math.sin(time * 5 + i * 2) * 3;
        // Links
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy + bungeeBob + i * 3);
        ctx.lineTo(cx - 14, cy - 3 + bungeeBob + legWave);
        ctx.lineTo(cx - 18, cy + 12 + bungeeBob);
        ctx.stroke();
        // Ringelsöckchen rot-weiß
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - 19, cy + 10 + bungeeBob, 2.5, 2.5);

        // Rechts
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy + bungeeBob + i * 3);
        ctx.lineTo(cx + 14, cy - 3 + bungeeBob - legWave);
        ctx.lineTo(cx + 18, cy + 12 + bungeeBob);
        ctx.stroke();
        // Ringelsöckchen rot-weiß
        ctx.fillRect(cx + 16.5, cy + 10 + bungeeBob, 2.5, 2.5);
      }

      // Flauschiger runder Pom-Pom Spinnenkörper
      drawSootSprite(ctx, cx, cy + bungeeBob, 9, time, false);

      // Große, neugierige Anime-Augen & 4 winzige Stirn-Pünktchen
      drawGhibliEyes(ctx, cx - 3.5, cx + 3.5, cy - 1 + bungeeBob, 2.2, 0, 0, false, true);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 4, cy - 5 + bungeeBob, 0.8, 0, Math.PI * 2);
      ctx.arc(cx - 1.5, cy - 6 + bungeeBob, 0.8, 0, Math.PI * 2);
      ctx.arc(cx + 1.5, cy - 6 + bungeeBob, 0.8, 0, Math.PI * 2);
      ctx.arc(cx + 4, cy - 5 + bungeeBob, 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 7. LEEREN-WESEN & GEISTER (VOID)
  // =========================================================================
  {
    id: 'void_reaper',
    name: 'Leeren-Verschlinger',
    title: 'Kaonashi Shadow Reaper',
    category: 'void',
    categoryName: '🌑 Leeren-Wesen & Geister',
    biome: 'Leerenwelt & Risszonen',
    biomeBadge: 'Leere',
    badgeClass: 'badge-void',
    variants: ['Obsidian-Violett (Standard)', 'Blut-Astral (Karmesin-Nebel)', 'Sternenstaub (Kosmisch)'],
    scale: 1.15,
    xpValue: 90,
    stats: { hp: 540, maxHp: 540, atk: 55, spd: 'Mittel', rng: '60px (Doppelklingen-Wirbel)' },
    behavior: 'Direkt inspiriert von Ohngesicht (Kaonashi). Eine geheimnisvolle Schattengestalt mit weißer Porzellanmaske und violetten Tränen. Führt zwei ätherische Sternenkatanas.',
    counter: 'Seine Klingenwirbel haben eine rhythmische Pause. Genau nach dem zweiten Schwung öffnet sich seine Schattengestalt für Gegentreffer.',
    lore: 'Sucht in der Leere nach vergessenen Kindheitserinnerungen. Bietet Reisenden schweigend glitzernde Sternsteine auf seiner Handfläche an.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const floatBob = Math.sin(time * 2.2) * 3;

      drawPaperShadow(ctx, cx, cy + 20, 15, 4.5);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Elegantes Kaonashi Schatten-Gewand (Deep Violet-Black Silhouette)
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - 10 + floatBob);
      ctx.quadraticCurveTo(cx - 16, cy + 12 + floatBob, cx - 11, cy + 19 + floatBob);
      ctx.quadraticCurveTo(cx, cy + 16 + floatBob, cx + 11, cy + 19 + floatBob);
      ctx.quadraticCurveTo(cx + 16, cy + 12 + floatBob, cx + 9, cy - 10 + floatBob);
      ctx.closePath();
      ctx.fill();

      // Schwebende Tintenrauch-Fransen am Saum
      ctx.fillStyle = '#3b0764';
      for (let i = -2; i <= 2; i++) {
        const wispY = Math.sin(time * 4 + i) * 2;
        ctx.beginPath();
        ctx.arc(cx + i * 4.5, cy + 17 + floatBob + wispY, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ovale Porzellanmaske mit violetten Kaonashi-Tränen
      drawPorcelainMask(ctx, cx, cy - 6 + floatBob, 12, 14, 'noh');

      // Ätherische Sternen-Katana-Klingen (Translucent Violet Light)
      const bladeGlow = isAttacking ? '#c084fc' : '#818cf8';
      const bladeSwing = isAttacking ? Math.sin(time * 12) * 25 : 0;

      ctx.save();
      ctx.translate(cx + 12, cy + 2 + floatBob);
      ctx.rotate((25 + bladeSwing) * Math.PI / 180);
      ctx.strokeStyle = bladeGlow;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(3, -12, 1, -22);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(cx - 12, cy + 2 + floatBob);
      ctx.rotate((-25 - bladeSwing) * Math.PI / 180);
      ctx.strokeStyle = bladeGlow;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-3, -12, -1, -22);
      ctx.stroke();
      ctx.restore();

      ctx.filter = 'none';
    }
  },

  {
    id: 'gazer_of_the_void',
    name: 'Auge des Abgrunds',
    title: 'Celestial Moon-Jelly',
    category: 'void',
    categoryName: '🌑 Leeren-Wesen & Geister',
    biome: 'Leerenwelt & Risszonen',
    biomeBadge: 'Leere',
    badgeClass: 'badge-void',
    variants: ['Galaxie-Iris (Standard)', 'Supernova (Gold-Orange)', 'Polarlicht (Smaragdgrün)'],
    scale: 1.55,
    xpValue: 220,
    stats: { hp: 1350, maxHp: 1350, atk: 75, spd: 'Schwebend Schnell', rng: '160px (Kosmischer Strahl)' },
    behavior: 'Eine ätherische Himmels-Mondqualle mit einer gläsernen Sternenglocke. In ihrem Zentrum ruht ein wohlwollendes kosmisches Auge, das Starlight-Strahlen bündelt.',
    counter: 'Vor dem Strahl schließt sich seine Glocke für eine Sekunde. Hinter eine Felsbarriere stellen und danach seine weichen Quallententakel treffen.',
    lore: 'Fiel in einer Neumondnacht aus dem Sternenmeer herab. Summt eine Melodie, die an uralte Spieluhren erinnert.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const pulse = Math.sin(time * 2.5) * 2;
      const floatY = cy - 2 + Math.sin(time * 2) * 3;

      drawPaperShadow(ctx, cx, cy + 20, 14, 4);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // 5 wallende Seidententakel mit Sternenstaub
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)';
      ctx.lineWidth = 1.6;
      for (let i = -2; i <= 2; i++) {
        const wave = Math.sin(time * 4 - i * 0.8) * 4;
        ctx.beginPath();
        ctx.moveTo(cx + i * 4, floatY + 6);
        ctx.quadraticCurveTo(cx + i * 5 + wave, floatY + 14, cx + i * 3 - wave, floatY + 22);
        ctx.stroke();
      }

      // Transparente gläserne Quallenglocke (Glass Dome)
      ctx.fillStyle = 'rgba(139, 92, 246, 0.35)';
      ctx.beginPath();
      ctx.arc(cx, floatY - 2, 14 + pulse * 0.4, Math.PI, 0);
      ctx.quadraticCurveTo(cx + 12, floatY + 6, cx, floatY + 7);
      ctx.quadraticCurveTo(cx - 12, floatY + 6, cx - 14 - pulse * 0.4, floatY - 2);
      ctx.fill();

      // Kosmisches Großauge im Inneren
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx, floatY - 2, 9, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Galaxie-Iris (Irisierend Violett & Gold)
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.arc(cx, floatY - 2, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(cx, floatY - 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Glanzpunkte
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 1.5, floatY - 3.5, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Zarter Mondsichel-Anhänger auf dem Scheitel
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, floatY - 17, 3, 0.5, Math.PI * 1.5);
      ctx.stroke();

      ctx.filter = 'none';
    }
  },

  {
    id: 'abyss_tentacle',
    name: 'Schatten-Tentakel',
    title: 'Bell-Spirit Vine',
    category: 'void',
    categoryName: '🌑 Leeren-Wesen & Geister',
    biome: 'Leerenwelt & Risszonen',
    biomeBadge: 'Leere',
    badgeClass: 'badge-void',
    variants: ['Tiefsee-Schwarz (Standard)', 'Giftmorast (Smaragdgrün)', 'Glutasche (Rubinrot)'],
    scale: 1.25,
    xpValue: 80,
    stats: { hp: 480, maxHp: 480, atk: 50, spd: 'Stationär', rng: '50px (Peitschenhieb)' },
    behavior: 'Bricht aus einem moosbewachsenen Steinbrunnen hervor. An seiner gewundenen Spitze baumelt eine antike bronzene Shinto-Tempelglocke (Suzu), die bei Hieben silbern läutet.',
    counter: 'Wenn sich die Ranke spiralig zusammenzieht, bereitet sie den Peitschenhieb vor. Sofort zurückweichen und nach dem Aufprall die Glocke attackieren.',
    lore: 'Entspringt den Wurzeln eines versunkenen Glockenturms. Ihr Läuten klingt wie Regentropfen auf Tempeldächern.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const coilSpeed = isAttacking ? 8 : 3.5;
      const coil = Math.sin(time * coilSpeed) * 6;

      // Steinbrunnen / Rissportal am Boden
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 14, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 15, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Elegante, gewundene Tintenranke
      ctx.strokeStyle = '#2e1065';
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 15);
      ctx.quadraticCurveTo(cx - 10 + coil, cy + 3, cx + 4 - coil, cy - 6);
      ctx.quadraticCurveTo(cx + 12 - coil, cy - 14, cx - 2 + coil * 0.5, cy - 18);
      ctx.stroke();

      // Zarte lumineszierende Pflaumenblüten-Saugnäpfe (Plum Blossoms)
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.arc(cx - 6 + coil * 0.7, cy + 5, 2.2, 0, Math.PI * 2);
      ctx.arc(cx + 4 - coil * 0.5, cy - 4, 2, 0, Math.PI * 2);
      ctx.arc(cx + 8 - coil, cy - 12, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Antike bronzene Tempelglocke (Suzu) an der Spitze
      const bellX = cx - 2 + coil * 0.5;
      const bellY = cy - 18;

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(bellX, bellY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Rotes Seidenband & Schallwellen
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(bellX - 1, bellY + 3, 2, 4);

      if (Math.sin(time * 5) > 0.6) {
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bellX, bellY, 7, -0.5, Math.PI * 0.8);
        ctx.stroke();
      }

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 8. ELITE & ELEMENTARE (ELITE)
  // =========================================================================
  {
    id: 'cursed_knight',
    name: 'Origami-Krieger',
    title: 'Cursed Paper Samurai',
    category: 'elite',
    categoryName: '⚔️ Elite & Elementare',
    biome: 'Antike Tempel & Burgruinen',
    biomeBadge: 'Tempel',
    badgeClass: 'badge-mountain',
    variants: ['Karmesin-Gold (Standard)', 'Schatten-Obsidian (Nacht)', 'Kaiser-Jade (Grün)'],
    stats: { hp: 100, maxHp: 100, atk: 36, spd: 'Mittel-Schnell', rng: '55px (Kalligraphie-Hieb)' },
    behavior: 'Ein lebendiges Origami-Kunstwerk aus gefaltetem Washi-Papier. Trägt einen imposanten Kabuto-Helm mit goldener Mondsichel und führt ein federleichtes Odachi-Schwert.',
    counter: 'Seine Iaijutsu-Schläge durchdringen leichte Schilde. Genau im Moment seines Ziehens parieren, um seine Papierrüstung zu destabilisieren.',
    lore: 'Wurde vor Jahrhunderten gefaltet, um den Tempel der Kirschblüten zu bewachen. Jeder seiner Schwerthiebe hinterlässt flüchtige schwarze Tuschezeichen in der Luft.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const breath = Math.sin(time * 3) * 1.2;

      drawPaperShadow(ctx, cx, cy + 19, 16, 5);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Gefaltete Papier-Rüstungsbeine
      ctx.fillStyle = '#18181b';
      ctx.fillRect(cx - 6, cy + 9, 4, 9);
      ctx.fillRect(cx + 2, cy + 9, 4, 9);

      // Karmesinrote Washi-Brustpanzerung mit Goldkante
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - 2 + breath);
      ctx.lineTo(cx - 11, cy + 10 + breath);
      ctx.lineTo(cx + 11, cy + 10 + breath);
      ctx.lineTo(cx + 9, cy - 2 + breath);
      ctx.closePath();
      ctx.fill();

      // Goldene Faltleisten
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy + 3 + breath);
      ctx.lineTo(cx + 9, cy + 3 + breath);
      ctx.moveTo(cx - 10, cy + 7 + breath);
      ctx.lineTo(cx + 10, cy + 7 + breath);
      ctx.stroke();

      // Schulterplatten (Sode)
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.roundRect(cx - 14, cy - 1 + breath, 5, 8, 1);
      ctx.roundRect(cx + 9, cy - 1 + breath, 5, 8, 1);
      ctx.fill();

      // Kabuto-Helm mit stolzer goldener Mondsichel (Date Masamune Look)
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(cx, cy - 6 + breath, 7, Math.PI, 0);
      ctx.fill();

      // Goldene Mondsichel auf der Stirn
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(cx, cy - 13 + breath, 8, 0.4, Math.PI * 0.8);
      ctx.stroke();

      // Kitsune-Halbmaske unter dem Helm
      drawPorcelainMask(ctx, cx, cy - 4 + breath, 9, 7, 'fox');

      // Geschwungenes Odachi-Papierschwert mit Tusche-Schweif
      const swordSwing = isAttacking ? Math.sin(time * 12) * 45 : 0;
      ctx.save();
      ctx.translate(cx + 11, cy + 4 + breath);
      ctx.rotate((-20 + swordSwing) * Math.PI / 180);
      // Griff
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-1.5, 0, 3, 7);
      // Klinge
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(4, -14, 2, -26);
      ctx.stroke();

      // Schwarzer Kalligraphie-Tuschestreif bei Hieb
      if (isAttacking) {
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -12, 16, -Math.PI * 0.8, -Math.PI * 0.2);
        ctx.stroke();
      }
      ctx.restore();

      ctx.filter = 'none';
    }
  },

  {
    id: 'sky_harpy',
    name: 'Wolken-Harpyie',
    title: 'Tengu Feather Maiden',
    category: 'elite',
    categoryName: '⚔️ Elite & Elementare',
    biome: 'Himmelsinseln & Bergpass',
    biomeBadge: 'Himmel',
    badgeClass: 'badge-sky',
    variants: ['Himmelsblau (Standard)', 'Sonnenuntergang (Rosa-Gold)', 'Gewittersturm (Stahlgrau)'],
    scale: 1.05,
    xpValue: 65,
    stats: { hp: 390, maxHp: 390, atk: 50, spd: 'Sehr Schnell (Fliegend)', rng: '110px (Windklingen-Fächer)' },
    behavior: 'Eine anmutige Wind-Tengu-Maid mit gefalteten Papierkranich-Flügeln. Schwingt einen heiligen Federfächer (Hauchiwa) und entfesselt wirbelnde Kirschblüten-Stürme.',
    counter: 'Ihre Windwirbel stoßen Helden zurück. Mit dem Schild blocken und sie im Landemoment mit Wirbelattacken zu Boden zwingen.',
    lore: 'Webt den Morgennebel über den Tälern. Wenn sie mit ihrem Federfächer winkt, fallen die ersten Kirschblüten des Frühlings.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const wingFlap = Math.sin(time * 6) * 7;
      const floatBob = Math.sin(time * 3) * 3;

      drawPaperShadow(ctx, cx, cy + 20, 15, 4);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Majestätische Papierkranich-Flügel (Origami Wing Feathers)
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      // Linker Flügel
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + floatBob);
      ctx.lineTo(cx - 24, cy - 10 + floatBob + wingFlap);
      ctx.lineTo(cx - 18, cy + 4 + floatBob + wingFlap * 0.5);
      ctx.lineTo(cx - 12, cy + 8 + floatBob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rechter Flügel
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy + floatBob);
      ctx.lineTo(cx + 24, cy - 10 + floatBob + wingFlap);
      ctx.lineTo(cx + 18, cy + 4 + floatBob + wingFlap * 0.5);
      ctx.lineTo(cx + 12, cy + 8 + floatBob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Zartes Feder-Kimono-Kleidchen
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 2 + floatBob);
      ctx.lineTo(cx - 8, cy + 14 + floatBob);
      ctx.lineTo(cx + 8, cy + 14 + floatBob);
      ctx.lineTo(cx + 6, cy - 2 + floatBob);
      ctx.closePath();
      ctx.fill();

      // Rosa Kirschblüten-Schärfe
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(cx - 6, cy + 3 + floatBob, 12, 2.5);

      // Sanftes Anime-Gesicht mit wehendem schwarzen Haar
      drawGhibliEyes(ctx, cx - 3.5, cx + 3.5, cy - 6 + floatBob, 2.2, 0, 0, false, true);

      // Zarte Vogelmaske schräg auf der Stirn (Tengu-Mask)
      ctx.fillStyle = '#fdfbf7';
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy - 11 + floatBob, 4, 3, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(cx + 7, cy - 11 + floatBob);
      ctx.lineTo(cx + 11, cy - 10 + floatBob);
      ctx.lineTo(cx + 7, cy - 9 + floatBob);
      ctx.fill();

      // Heiliger Federfächer (Hauchiwa)
      const fanX = cx - 11;
      const fanY = cy + 2 + floatBob;
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(fanX, fanY, 7, Math.PI * 0.8, Math.PI * 1.8);
      ctx.lineTo(fanX, fanY);
      ctx.fill();

      // Umherwirbelnde Kirschblüten bei Windangriff
      if (isAttacking) {
        drawSakuraPetal(ctx, cx + 14, cy - 6 + floatBob, time * 4, 1);
        drawSakuraPetal(ctx, cx - 14, cy + 8 + floatBob, -time * 3, 0.8);
      }

      ctx.filter = 'none';
    }
  },

  {
    id: 'lava_core',
    name: 'Magma-Funke',
    title: 'Calcifer Flame Sprite',
    category: 'elite',
    categoryName: '⚔️ Elite & Elementare',
    biome: 'Vulkan & Magmakammern',
    biomeBadge: 'Vulkan',
    badgeClass: 'badge-vulcano',
    variants: ['Feuer-Orange (Standard)', 'Blau-Plasma (Gleißend)', 'Smaragd-Flamme (Giftvulkan)'],
    scale: 0.75,
    xpValue: 4,
    stats: { hp: 25, maxHp: 25, atk: 12, spd: 'Schnell (Pulsierend)', rng: '120px (Funken-Feuerwerk)' },
    behavior: 'Eine direkte liebevolle Hommage an Calcifer aus Das wandelnde Schloss! Ein warmes, übermütiges Flämmchen mit Kulleraugen, umringt von schwebenden Obsidian-Kieseln.',
    counter: 'Wasser- und Eiszauber kühlen seinen Glutkern sofort ab. Im abgekühlten Zustand kann er 4 Sekunden lang keine Funken spucken.',
    lore: 'Schläft am liebsten auf alten Speckpfannen und beschwert sich lautstark über schlechtes Brennholz. Knistert vor Freude, wenn man ihn lobt.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const flameDance = Math.sin(time * 9) * 2;
      const breath = Math.sin(time * 4) * 1.5;

      drawPaperShadow(ctx, cx, cy + 18, 14, 4);

      if (hitFlash > 0) ctx.filter = 'brightness(2.2) saturate(0.3)';

      // Äußere lodernde Flammenkrone (Karmesinrot)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 13 + breath, 0, Math.PI);
      ctx.quadraticCurveTo(cx - 14, cy - 10 + flameDance, cx - 4, cy - 16);
      ctx.quadraticCurveTo(cx, cy - 10, cx + 4, cy - 18 + flameDance);
      ctx.quadraticCurveTo(cx + 14, cy - 10, cx + 13 + breath, cy + 4);
      ctx.fill();

      // Warmer oranger Herzkörper (Calcifer Orange)
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 10 + breath * 0.8, 0, Math.PI);
      ctx.quadraticCurveTo(cx - 10, cy - 7 + flameDance, cx - 2, cy - 13);
      ctx.quadraticCurveTo(cx + 10, cy - 7, cx + 10 + breath * 0.8, cy + 4);
      ctx.fill();

      // Heller sonnengelber Glutkern
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(cx, cy + 5, 7, 0, Math.PI * 2);
      ctx.fill();

      // Expressives, fröhliches Calcifer-Gesicht!
      // Große Kulleraugen blicken aufgeregt nach oben
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx - 4.5, cy - 1, 3.2, 4.2, -0.1, 0, Math.PI * 2);
      ctx.ellipse(cx + 4.5, cy - 1, 3.2, 4.2, 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx - 4.5, cy - 2, 1.8, 0, Math.PI * 2);
      ctx.arc(cx + 4.5, cy - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 5.2, cy - 2.8, 0.8, 0, Math.PI * 2);
      ctx.arc(cx + 3.8, cy - 2.8, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Breites herzliches Grinsen mit zwei winzigen süßen Zähnchen!
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 4.2, 0.1, Math.PI * 0.9);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, cy + 4, 1.5, 1.5);
      ctx.fillRect(cx + 0.5, cy + 4, 1.5, 1.5);

      // Kleine gestikulierende Flämmchen-Ärmchen
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(cx - 10, cy + 3 + flameDance, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy + 3 - flameDance, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 4 schwebende Obsidian-Kieselsteine in 3D-Umlaufbahn
      const numStones = 4;
      for (let s = 0; s < numStones; s++) {
        const stoneAngle = time * 3 + (s / numStones) * Math.PI * 2;
        const sx = cx + Math.cos(stoneAngle) * (18 + (isAttacking ? 6 : 0));
        const sy = cy + 4 + Math.sin(stoneAngle) * 7;

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.filter = 'none';
    }
  }
];

// =============================================================================
// BESTIARY UI MANAGER
// =============================================================================

class BestiaryManager {
  constructor(container = 'bestiary-grid') {
    if (typeof container === 'string') {
      this.container = document.getElementById(container);
    } else if (container && (container.nodeType || typeof container.querySelector === 'function')) {
      this.container = container;
    } else {
      this.container = document.getElementById('bestiary-grid');
    }

    this.currentCategory = 'all';
    this.enemyStates = {};
    this.canvases = {};

    BESTIARY_DATA.forEach(enemy => {
      this.enemyStates[enemy.id] = {
        animTime: Math.random() * 5,
        state: 'idle', // 'idle' | 'walk' | 'attack'
        hitTimer: 0
      };
    });

    if (this.container) {
      this.init();
    }
  }

  init() {
    if (!this.container) {
      this.container = document.getElementById('bestiary-grid');
    }
    if (!this.container) return;
    this.wireFilterPills();
    this.renderCards();
  }

  wireFilterPills() {
    const pills = document.querySelectorAll('.bestiary-filter-btn, .filter-pill');
    pills.forEach(pill => {
      pill.onclick = () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentCategory = pill.dataset.category || pill.dataset.filter || 'all';
        this.renderCards();
      };
    });
  }

  renderCards() {
    if (!this.container) {
      this.container = document.getElementById('bestiary-grid');
    }
    if (!this.container) return;
    if (typeof this.container.replaceChildren === 'function') {
      this.container.replaceChildren();
    } else {
      this.container.innerHTML = '';
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }
    }
    this.canvases = {};

    const filtered = this.currentCategory === 'all'
      ? BESTIARY_DATA
      : BESTIARY_DATA.filter(e => e.category === this.currentCategory);

    filtered.forEach(enemy => {
      const st = this.enemyStates[enemy.id];
      const card = document.createElement('div');
      card.className = 'enemy-card';
      card.dataset.id = enemy.id;

      card.innerHTML = `
        <div class="enemy-card-header">
          <div class="enemy-title-group">
            <h3>${enemy.name}</h3>
            <span class="enemy-eng-title">${enemy.title}</span>
          </div>
          <div class="enemy-badges-group">
            <span class="enemy-badge badge-role">${enemy.categoryName}</span>
            <span class="enemy-badge ${enemy.badgeClass}">${enemy.biomeBadge}</span>
          </div>
        </div>

        <div class="enemy-preview-stage">
          <canvas id="enemy-canvas-${enemy.id}" class="enemy-canvas" width="80" height="80"></canvas>
          <div id="dmg-float-${enemy.id}" class="dmg-float"></div>
          
          <div class="enemy-stage-controls">
            <button class="stage-btn btn-anim-toggle" title="Animation umschalten">
              <span class="anim-icon">▶</span> Modus: <span class="anim-state-label">${st.state.toUpperCase()}</span>
            </button>
            <button class="stage-btn btn-hit-test" title="Treffer testen (Hit Flash)">
              💥 Treffer
            </button>
          </div>
        </div>

        <div class="enemy-stats-panel">
          <div class="stat-bar-row">
            <span class="stat-label">Leben</span>
            <div class="stat-track"><div class="stat-fill fill-hp" style="width: ${Math.min(100, (enemy.stats.hp / 140) * 100)}%"></div></div>
            <span class="stat-num">${enemy.stats.hp}</span>
          </div>
          <div class="stat-bar-row">
            <span class="stat-label">Angriff</span>
            <div class="stat-track"><div class="stat-fill fill-atk" style="width: ${Math.min(100, (enemy.stats.atk / 45) * 100)}%"></div></div>
            <span class="stat-num">${enemy.stats.atk}</span>
          </div>
          <div class="stat-chips-row">
            <span class="stat-chip">Tempo: <b>${enemy.stats.spd}</b></span>
            <span class="stat-chip">Reichweite: <b>${enemy.stats.rng.split(' ')[0]}</b></span>
          </div>
        </div>

        <div class="enemy-tactics-box">
          <div class="tactic-item"><span class="tactic-icon">⚔️</span> <span>${enemy.behavior}</span></div>
          <div class="tactic-item counter-item"><span class="tactic-icon">🛡️</span> <span><strong>Konter:</strong> ${enemy.counter}</span></div>
        </div>

        <div class="enemy-variants-row">
          <span class="variants-title">🎨 Farbvarianten:</span>
          ${enemy.variants.map(v => `<span class="variant-pill">${v}</span>`).join('')}
        </div>

        <div class="enemy-lore-quote">„${enemy.lore}“</div>
      `;

      this.container.appendChild(card);

      const canvas = card.querySelector(`#enemy-canvas-${enemy.id}`);
      if (canvas) {
        this.canvases[enemy.id] = canvas;
      }

      // Wire interactive buttons
      const btnAnim = card.querySelector('.btn-anim-toggle');
      const labelAnim = card.querySelector('.anim-state-label');
      if (btnAnim && labelAnim) {
        btnAnim.addEventListener('click', (e) => {
          e.stopPropagation();
          const nextState = st.state === 'idle' ? 'walk' : (st.state === 'walk' ? 'attack' : 'idle');
          st.state = nextState;
          labelAnim.textContent = nextState.toUpperCase();
        });
      }

      const btnHit = card.querySelector('.btn-hit-test');
      const dmgFloat = card.querySelector(`#dmg-float-${enemy.id}`);
      if (btnHit) {
        btnHit.addEventListener('click', (e) => {
          e.stopPropagation();
          st.hitTimer = 0.25; // White flash
          if (dmgFloat) {
            dmgFloat.textContent = `-${Math.floor(Math.random() * 14 + 18)}!`;
            dmgFloat.classList.remove('anim-float');
            void dmgFloat.offsetWidth; // Trigger reflow for re-animation
            dmgFloat.classList.add('anim-float');
            setTimeout(() => {
              dmgFloat.classList.remove('anim-float');
            }, 650);
          }
        });
      }
    });
  }

  update(dt) {
    BESTIARY_DATA.forEach(enemy => {
      const st = this.enemyStates[enemy.id];
      if (!st) return;
      st.animTime += dt;
      if (st.hitTimer > 0) st.hitTimer -= dt;

      const canvas = this.canvases[enemy.id];
      if (canvas) {
        const ctx = canvas.getContext('2d');
        // Smooth paper rendering for curved Ghibli vector aesthetics
        ctx.imageSmoothingEnabled = true;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render enemy centered in 80x80 canvas (center at 40, 42)
        enemy.render(ctx, 40, 42, st.animTime, st.state, Math.max(0, st.hitTimer));
      }
    });
  }
}


// --- js/sprites.js ---

function createTileCanvas(width = TILE_SIZE, height = TILE_SIZE) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

// Simple deterministic hash for procedural variation
function hash(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 1274126177) ^ 0x5bf03635;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

// ----------------------------------------------------
// 1. GROUND TILES (Multiple variations for organic look)
// ----------------------------------------------------
function generateGrassSprites() {
  const variations = [];
  for (let v = 0; v < 4; v++) {
    const { canvas, ctx } = createTileCanvas();
    ctx.fillStyle = '#489c3e';
    ctx.fillRect(0, 0, 16, 16);

    // Varied grass blades
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash(x, y, v * 10 + 1);
        if (r > 0.82) {
          ctx.fillStyle = '#59b54e';
          ctx.fillRect(x, y, 1, 1);
        } else if (r < 0.14) {
          ctx.fillStyle = '#3a8332';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Occasional tiny wild flower on variation 2 & 3
    if (v === 2) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 8, 2, 2);
      ctx.fillStyle = '#ffdf4a';
      ctx.fillRect(7, 8, 1, 1);
    } else if (v === 3) {
      ctx.fillStyle = '#4cc7ff';
      ctx.fillRect(11, 4, 1, 2);
    }

    variations.push(canvas);
  }
  return variations;
}

function generateDirtSprites() {
  const variations = [];
  for (let v = 0; v < 3; v++) {
    const { canvas, ctx } = createTileCanvas();
    ctx.fillStyle = '#7a5433';
    ctx.fillRect(0, 0, 16, 16);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash(x, y, v * 20 + 3);
        if (r > 0.8) {
          ctx.fillStyle = '#8f653e';
          ctx.fillRect(x, y, 1, 1);
        } else if (r < 0.2) {
          ctx.fillStyle = '#614023';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Small pebbles
    if (v === 1) {
      ctx.fillStyle = '#9e8167';
      ctx.fillRect(4, 9, 2, 1);
    }
    variations.push(canvas);
  }
  return variations;
}

function generateSandSprites() {
  const variations = [];
  for (let v = 0; v < 3; v++) {
    const { canvas, ctx } = createTileCanvas();
    ctx.fillStyle = '#dfb867';
    ctx.fillRect(0, 0, 16, 16);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const wave = Math.sin((x + y * 0.7 + v * 3) * 0.7);
        if (wave > 0.7) {
          ctx.fillStyle = '#ecd37f';
          ctx.fillRect(x, y, 1, 1);
        } else if (wave < -0.7) {
          ctx.fillStyle = '#cb9f4d';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    variations.push(canvas);
  }
  return variations;
}

function generateSnowSprites() {
  const variations = [];
  for (let v = 0; v < 3; v++) {
    const { canvas, ctx } = createTileCanvas();
    ctx.fillStyle = '#eaf1f8';
    ctx.fillRect(0, 0, 16, 16);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash(x, y, v * 30 + 7);
        if (r > 0.85) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y, 1, 1);
        } else if (r < 0.15) {
          ctx.fillStyle = '#d1e0ee';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    variations.push(canvas);
  }
  return variations;
}

function generateSwampGroundSprites() {
  const variations = [];
  for (let v = 0; v < 3; v++) {
    const { canvas, ctx } = createTileCanvas();
    ctx.fillStyle = '#445434';
    ctx.fillRect(0, 0, 16, 16);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash(x, y, v * 40 + 9);
        if (r > 0.78) {
          ctx.fillStyle = '#546b3e';
          ctx.fillRect(x, y, 1, 1);
        } else if (r < 0.22) {
          ctx.fillStyle = '#313d24';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Moss speck
    if (v === 1) {
      ctx.fillStyle = '#658245';
      ctx.fillRect(8, 7, 3, 2);
    }
    variations.push(canvas);
  }
  return variations;
}

function generateVoidGroundSprites() {
  const variations = [];
  for (let v = 0; v < 3; v++) {
    const { canvas, ctx } = createTileCanvas();
    ctx.fillStyle = '#260f38';
    ctx.fillRect(0, 0, 16, 16);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = hash(x, y, v * 50 + 13);
        if (r > 0.8) {
          ctx.fillStyle = '#391754';
          ctx.fillRect(x, y, 1, 1);
        } else if (r < 0.2) {
          ctx.fillStyle = '#190726';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Glowing rift vein
    if (v === 1) {
      ctx.fillStyle = '#b03bf3';
      ctx.fillRect(4, 7, 4, 1);
      ctx.fillRect(7, 8, 2, 2);
      ctx.fillStyle = '#e87eff';
      ctx.fillRect(5, 7, 2, 1);
    }
    variations.push(canvas);
  }
  return variations;
}

// ----------------------------------------------------
// 2. ANIMATED GROUND TILES
// ----------------------------------------------------
function generateWaterSprite(time = 0) {
  const { canvas, ctx } = createTileCanvas();
  ctx.fillStyle = '#246baf';
  ctx.fillRect(0, 0, 16, 16);

  const t = time * 0.08;
  for (let row = 3; row < 16; row += 5) {
    const shift = Math.floor(Math.sin(t + row) * 2.5);
    ctx.fillStyle = '#3d8cdb';
    ctx.fillRect((2 + shift + 16) % 16, row, 6, 1);
    ctx.fillStyle = '#7ac0f8';
    ctx.fillRect((4 + shift + 16) % 16, row, 2, 1);
  }
  return canvas;
}

function generateSwampWaterSprite(time = 0) {
  const { canvas, ctx } = createTileCanvas();
  ctx.fillStyle = '#233824';
  ctx.fillRect(0, 0, 16, 16);

  const t = time * 0.05;
  for (let row = 4; row < 16; row += 6) {
    const shift = Math.floor(Math.sin(t + row) * 2);
    ctx.fillStyle = '#375438';
    ctx.fillRect((3 + shift + 16) % 16, row, 5, 1);
  }
  // Bubble
  const bY = Math.floor((16 - (time * 1.5) % 16));
  ctx.fillStyle = '#557d51';
  ctx.fillRect(8, bY, 1, 1);
  return canvas;
}

function generateQuicksandSprite(time = 0) {
  const { canvas, ctx } = createTileCanvas();
  ctx.fillStyle = '#b3833b';
  ctx.fillRect(0, 0, 16, 16);

  const cx = 8, cy = 8;
  const rot = time * 0.15;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) + dist * 0.35 - rot;
      const v = Math.sin(angle * 2.5);
      if (dist < 2.5) {
        ctx.fillStyle = '#5e3f16';
        ctx.fillRect(x, y, 1, 1);
      } else if (v > 0.4) {
        ctx.fillStyle = '#cca04e';
        ctx.fillRect(x, y, 1, 1);
      } else if (v < -0.4) {
        ctx.fillStyle = '#8a5e24';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return canvas;
}

function generateVoidLakeSprite(time = 0) {
  const { canvas, ctx } = createTileCanvas();
  ctx.fillStyle = '#0a0112';
  ctx.fillRect(0, 0, 16, 16);

  const cx = 8, cy = 8;
  const pulse = Math.sin(time * 0.1) * 1.5;

  for (let r = 7; r > 1; r -= 2) {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1, r + pulse * (r / 7)), 0, Math.PI * 2);
    ctx.strokeStyle = r > 4 ? '#2c0842' : '#571380';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = '#030005';
  ctx.fillRect(cx - 1, cy - 1, 2, 2);

  // Spark
  const spX = Math.floor(cx + Math.cos(time * 0.15) * 4);
  const spY = Math.floor(cy + Math.sin(time * 0.15) * 4);
  ctx.fillStyle = '#f08aff';
  ctx.fillRect(spX, spY, 1, 1);

  return canvas;
}

function generateBridgeSprite(isHorizontal = true) {
  const { canvas, ctx } = createTileCanvas();
  ctx.fillStyle = '#3d2411';
  ctx.fillRect(0, 0, 16, 16);

  if (isHorizontal) {
    for (let x = 0; x < 16; x += 4) {
      ctx.fillStyle = (x % 8 === 0) ? '#8d5528' : '#7d4a22';
      ctx.fillRect(x, 1, 3, 14);
      ctx.fillStyle = '#261509';
      ctx.fillRect(x + 1, 2, 1, 1);
      ctx.fillRect(x + 1, 13, 1, 1);
    }
    ctx.fillStyle = '#543014';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
  } else {
    for (let y = 0; y < 16; y += 4) {
      ctx.fillStyle = (y % 8 === 0) ? '#8d5528' : '#7d4a22';
      ctx.fillRect(1, y, 14, 3);
      ctx.fillStyle = '#261509';
      ctx.fillRect(2, y + 1, 1, 1);
      ctx.fillRect(13, y + 1, 1, 1);
    }
    ctx.fillStyle = '#543014';
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);
  }
  return canvas;
}

// ----------------------------------------------------
// 3. OBJECTS WITH 100% TRANSPARENT BACKGROUNDS
// (Fixes "die steine haben einen schwarzen hintergrund")
// ----------------------------------------------------
function generateRockStoneSprite() {
  const { canvas, ctx } = createTileCanvas();
  // No opaque fillRect! Canvas is fully transparent.

  // 1. Soft grounded drop-shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.ellipse(8, 13, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Rock base body
  ctx.fillStyle = '#525b68';
  ctx.beginPath();
  ctx.moveTo(3, 12);
  ctx.lineTo(4, 7);
  ctx.lineTo(8, 4);
  ctx.lineTo(13, 7);
  ctx.lineTo(14, 12);
  ctx.lineTo(11, 14);
  ctx.lineTo(5, 14);
  ctx.closePath();
  ctx.fill();

  // 3. Chiseled facets
  ctx.fillStyle = '#717c8c';
  ctx.beginPath();
  ctx.moveTo(4, 7);
  ctx.lineTo(8, 4);
  ctx.lineTo(10, 9);
  ctx.lineTo(5, 11);
  ctx.closePath();
  ctx.fill();

  // 4. Sun highlight on top rim
  ctx.fillStyle = '#9aa7ba';
  ctx.fillRect(6, 4, 3, 2);
  ctx.fillRect(5, 6, 2, 1);

  return canvas;
}

function generateRockIceSprite() {
  const { canvas, ctx } = createTileCanvas();
  // Transparent background!

  // Soft shadow
  ctx.fillStyle = 'rgba(0, 20, 40, 0.25)';
  ctx.beginPath();
  ctx.ellipse(8, 13, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Crystalline ice body
  ctx.fillStyle = '#6fa4c6';
  ctx.beginPath();
  ctx.moveTo(8, 2);
  ctx.lineTo(14, 8);
  ctx.lineTo(12, 13);
  ctx.lineTo(4, 13);
  ctx.lineTo(2, 7);
  ctx.closePath();
  ctx.fill();

  // Cyan bright facet
  ctx.fillStyle = '#b1e5f8';
  ctx.beginPath();
  ctx.moveTo(8, 2);
  ctx.lineTo(11, 8);
  ctx.lineTo(6, 11);
  ctx.lineTo(4, 6);
  ctx.closePath();
  ctx.fill();

  // Glimmer
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(7, 3, 2, 2);
  ctx.fillRect(9, 5, 1, 2);

  return canvas;
}

function generateRockVoidSprite() {
  const { canvas, ctx } = createTileCanvas();
  // Transparent background!

  // Purple glow shadow
  ctx.fillStyle = 'rgba(25, 0, 40, 0.4)';
  ctx.beginPath();
  ctx.ellipse(8, 14, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Obelisk crystal body
  ctx.fillStyle = '#551178';
  ctx.beginPath();
  ctx.moveTo(8, 1);
  ctx.lineTo(13, 8);
  ctx.lineTo(11, 14);
  ctx.lineTo(5, 14);
  ctx.lineTo(3, 8);
  ctx.closePath();
  ctx.fill();

  // Glowing neon facet
  ctx.fillStyle = '#b827f2';
  ctx.beginPath();
  ctx.moveTo(8, 1);
  ctx.lineTo(11, 8);
  ctx.lineTo(8, 13);
  ctx.lineTo(5, 7);
  ctx.closePath();
  ctx.fill();

  // White-hot magic tip
  ctx.fillStyle = '#ff82fc';
  ctx.fillRect(7, 2, 2, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(7, 2, 1, 1);

  return canvas;
}

function generateBushSprite() {
  const { canvas, ctx } = createTileCanvas();
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(8, 13, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Foliage
  ctx.fillStyle = '#2d7a36';
  ctx.beginPath();
  ctx.arc(8, 8, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#459e4f';
  ctx.beginPath();
  ctx.arc(7, 7, 4, 0, Math.PI * 2);
  ctx.fill();

  // Berries
  ctx.fillStyle = '#e53935';
  ctx.fillRect(6, 6, 1, 1);
  ctx.fillRect(9, 8, 1, 1);
  return canvas;
}

function generateCactusSprite() {
  const { canvas, ctx } = createTileCanvas();
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(8, 14, 4, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  ctx.fillStyle = '#3e8e41';
  ctx.fillRect(7, 3, 3, 11);
  // Left arm
  ctx.fillRect(3, 6, 4, 2);
  ctx.fillRect(3, 4, 2, 4);
  // Right arm
  ctx.fillRect(9, 8, 4, 2);
  ctx.fillRect(11, 6, 2, 4);

  // Highlight
  ctx.fillStyle = '#61b864';
  ctx.fillRect(8, 4, 1, 10);
  return canvas;
}

function generateMushroomSprite() {
  const { canvas, ctx } = createTileCanvas();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(8, 14, 3, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  ctx.fillStyle = '#eae2cb';
  ctx.fillRect(7, 9, 2, 5);

  // Cap
  ctx.fillStyle = '#cf2b2b';
  ctx.beginPath();
  ctx.ellipse(8, 8, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // White spots
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(6, 7, 1, 1);
  ctx.fillRect(9, 7, 1, 1);
  return canvas;
}

function generateTreeTrunkSprite() {
  const { canvas, ctx } = createTileCanvas();
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(8, 13, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(6, 4, 5, 9);
  // Roots
  ctx.fillRect(4, 11, 2, 3);
  ctx.fillRect(11, 11, 2, 3);

  // Bark detail
  ctx.fillStyle = '#6b411f';
  ctx.fillRect(7, 5, 2, 7);
  return canvas;
}

function generateFernSprite() {
  const { canvas, ctx } = createTileCanvas();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(8, 13, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Feathery fern fronds
  ctx.fillStyle = '#166534';
  ctx.fillRect(7, 5, 2, 9);
  ctx.fillRect(5, 7, 2, 2);
  ctx.fillRect(9, 7, 2, 2);
  ctx.fillRect(4, 9, 3, 2);
  ctx.fillRect(9, 9, 3, 2);
  ctx.fillRect(3, 11, 4, 2);
  ctx.fillRect(9, 11, 4, 2);

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(7, 4, 2, 2);
  ctx.fillRect(4, 8, 1, 1);
  ctx.fillRect(11, 8, 1, 1);
  ctx.fillRect(3, 10, 1, 1);
  ctx.fillRect(12, 10, 1, 1);
  ctx.fillStyle = '#86efac';
  ctx.fillRect(7, 4, 1, 1);

  return canvas;
}

function generateFallenLogSprite() {
  const { canvas, ctx } = createTileCanvas(32, 16);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(16, 13, 13, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main horizontal log
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(4, 7, 24, 6);

  // Cut end with rings
  ctx.fillStyle = '#78461f';
  ctx.beginPath();
  ctx.ellipse(5, 10, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a1f0a';
  ctx.fillRect(5, 10, 1, 1);

  // Bark cracks
  ctx.fillStyle = '#2d1808';
  ctx.fillRect(10, 8, 2, 4);
  ctx.fillRect(18, 9, 3, 3);
  ctx.fillRect(23, 7, 1, 5);

  // Moss patches on top
  ctx.fillStyle = '#489c3e';
  ctx.fillRect(8, 6, 6, 2);
  ctx.fillRect(16, 6, 5, 2);
  ctx.fillStyle = '#86efac';
  ctx.fillRect(9, 6, 3, 1);
  ctx.fillRect(17, 6, 2, 1);

  // Bracket fungi
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(14, 11, 2, 1);
  ctx.fillRect(20, 11, 2, 1);

  return canvas;
}

function generateForestFlowersSprite() {
  const { canvas, ctx } = createTileCanvas();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(8, 13, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(4, 8, 1, 5);
  ctx.fillRect(7, 7, 1, 6);
  ctx.fillRect(11, 8, 1, 5);

  // Bluebells
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(3, 6, 2, 2);
  ctx.fillRect(4, 5, 1, 1);
  ctx.fillStyle = '#93c5fd';
  ctx.fillRect(3, 6, 1, 1);

  // Buttercups
  ctx.fillStyle = '#eab308';
  ctx.fillRect(10, 6, 2, 2);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(10, 6, 1, 1);

  // White forest star
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(7, 5, 2, 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(7, 5, 1, 1);

  return canvas;
}

function generateMushroomBrownSprite() {
  const { canvas, ctx } = createTileCanvas();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(8, 13, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boletus
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(8, 8, 3, 5);
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.ellipse(9, 7, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b45309';
  ctx.fillRect(7, 6, 4, 1);

  // Small chanterelle
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(4, 10, 2, 3);
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.ellipse(5, 9, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

// ----------------------------------------------------
// 4. CANOPY (Treetops - Rich Dense Forest Roof)
// ----------------------------------------------------
function generateCanopySprites() {
  const variations = [];
  const configs = [
    { base: '#0e2b13', mid1: '#16481e', mid2: '#23692d', sun: '#389647', tip: '#57be67' },
    { base: '#0b2612', mid1: '#13401b', mid2: '#1e5c26', sun: '#31853d', tip: '#4caf58' },
    { base: '#143313', mid1: '#21541f', mid2: '#337a2f', sun: '#4ea847', tip: '#72cf68' },
    { base: '#1b2e11', mid1: '#2e4c1c', mid2: '#457327', sun: '#649e38', tip: '#8fd457' }
  ];

  configs.forEach((cfg, v) => {
    const { canvas, ctx } = createTileCanvas();
    ctx.fillStyle = cfg.base;
    ctx.fillRect(0, 0, 16, 16);

    const lobes = [
      { x: 4,  y: 4,  r: 5, col: cfg.mid1 },
      { x: 12, y: 4,  r: 6, col: cfg.mid2 },
      { x: 4,  y: 12, r: 5, col: cfg.mid1 },
      { x: 12, y: 12, r: 6, col: cfg.mid2 },
      { x: 8,  y: 8,  r: 6, col: cfg.sun  }
    ];

    lobes.forEach(l => {
      ctx.fillStyle = l.col;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = cfg.tip;
    ctx.fillRect(7, 5, 3, 2);
    ctx.fillRect(11, 9, 2, 2);
    ctx.fillRect(3, 8, 2, 1);

    if (v === 2) {
      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(5, 5, 1, 1);
      ctx.fillRect(11, 12, 1, 1);
    } else if (v === 3) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(6, 10, 2, 1);
      ctx.fillRect(12, 4, 1, 1);
    }

    variations.push(canvas);
  });

  return variations;
}

// ----------------------------------------------------
// 5. PLAYER SPRITES (Crisp 16x16 Pixel Hero)
// ----------------------------------------------------
function generatePlayerSprites() {
  const directions = ['down', 'up', 'left', 'right'];
  const frames = [0, 1];
  const sprites = {};

  directions.forEach(dir => {
    sprites[dir] = [];
    frames.forEach(frame => {
      const { canvas, ctx } = createTileCanvas(16, 16);
      const legOffset = (frame === 1) ? 1 : 0;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(8, 15, 4, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boots
      ctx.fillStyle = '#2c1e13';
      if (dir === 'down' || dir === 'up') {
        ctx.fillRect(6, 13 - legOffset, 2, 2 + legOffset);
        ctx.fillRect(9, 13 + legOffset, 2, 2 - legOffset);
      } else if (dir === 'left') {
        ctx.fillRect(6 - legOffset, 13, 2, 2);
        ctx.fillRect(9 + legOffset, 13, 2, 2);
      } else {
        ctx.fillRect(5 - legOffset, 13, 2, 2);
        ctx.fillRect(8 + legOffset, 13, 2, 2);
      }

      // Tunic (Teal/Emerald)
      ctx.fillStyle = '#1b7677';
      ctx.fillRect(6, 8, 5, 5);

      // Belt
      ctx.fillStyle = '#5c3716';
      ctx.fillRect(6, 11, 5, 1);
      ctx.fillStyle = '#ffcf44';
      ctx.fillRect(8, 11, 1, 1);

      // Head / Skin
      ctx.fillStyle = '#f8c79c';
      ctx.fillRect(6, 4, 5, 4);

      // Hair
      ctx.fillStyle = '#543018';
      ctx.fillRect(5, 3, 7, 2);
      ctx.fillRect(5, 4, 1, 3);
      ctx.fillRect(11, 4, 1, 3);

      // Face direction
      if (dir === 'down') {
        ctx.fillStyle = '#1b2230';
        ctx.fillRect(7, 6, 1, 1);
        ctx.fillRect(9, 6, 1, 1);
      } else if (dir === 'left') {
        ctx.fillStyle = '#1b2230';
        ctx.fillRect(6, 6, 1, 1);
      } else if (dir === 'right') {
        ctx.fillStyle = '#1b2230';
        ctx.fillRect(10, 6, 1, 1);
      } else if (dir === 'up') {
        ctx.fillStyle = '#543018';
        ctx.fillRect(6, 4, 5, 4); // Hair covers back
      }

      sprites[dir].push(canvas);
    });
  });

  return sprites;
}

// ----------------------------------------------------
// 6. DETAILED MULTI-TILE TREES & SPECIES
// ----------------------------------------------------
const TREE_METADATA = {
  [TREES.OAK]:          { width: 32, height: 44, anchorX: 16, anchorY: 40, trunkRadius: 6, crownHeight: 30, name: 'Eiche' },
  [TREES.PINE]:         { width: 24, height: 46, anchorX: 12, anchorY: 42, trunkRadius: 5, crownHeight: 34, name: 'Kiefer' },
  [TREES.BIRCH]:        { width: 20, height: 40, anchorX: 10, anchorY: 37, trunkRadius: 4, crownHeight: 28, name: 'Birke' },
  [TREES.BLOSSOM]:      { width: 28, height: 40, anchorX: 14, anchorY: 37, trunkRadius: 5, crownHeight: 28, name: 'Blütenbaum' },
  [TREES.AUTUMN]:       { width: 30, height: 42, anchorX: 15, anchorY: 39, trunkRadius: 6, crownHeight: 30, name: 'Herbstbaum' },
  [TREES.SNOWY_PINE]:   { width: 24, height: 46, anchorX: 12, anchorY: 42, trunkRadius: 5, crownHeight: 34, name: 'Schneetanne' },
  [TREES.SWAMP_WILLOW]: { width: 34, height: 44, anchorX: 17, anchorY: 40, trunkRadius: 6, crownHeight: 28, name: 'Sumpfweide' },
  [TREES.PALM]:         { width: 28, height: 46, anchorX: 14, anchorY: 42, trunkRadius: 5, crownHeight: 26, name: 'Palme' },
  [TREES.SAPLING]:      { width: 16, height: 22, anchorX: 8,  anchorY: 20, trunkRadius: 3, crownHeight: 14, name: 'Jungbaum' },
  [TREES.DEADWOOD]:     { width: 24, height: 38, anchorX: 12, anchorY: 35, trunkRadius: 4, crownHeight: 24, name: 'Totholz' }
};

function generateOakSprites() {
  const variations = [];
  for (let v = 0; v < 2; v++) {
    const { canvas, ctx } = createTileCanvas(32, 44);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(16, 40, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk & Roots
    ctx.fillStyle = '#4a2c14';
    ctx.fillRect(13, 22, 6, 18);
    ctx.fillStyle = '#331c0c';
    ctx.fillRect(13, 23, 2, 17);
    ctx.fillStyle = '#6b411f';
    ctx.fillRect(17, 24, 2, 15);
    ctx.fillStyle = '#4a2c14';
    ctx.fillRect(10, 37, 4, 3);
    ctx.fillRect(9, 39, 2, 2);
    ctx.fillRect(18, 37, 4, 3);
    ctx.fillRect(21, 39, 2, 2);

    // Foliage
    const baseGreen = v === 0 ? '#18421d' : '#224016';
    const midGreen  = v === 0 ? '#2d7836' : '#3d7a28';
    const sunGreen  = v === 0 ? '#48a652' : '#5da836';
    const lightTip  = v === 0 ? '#82d48a' : '#94de5b';

    const clusters = [
      { x: 10, y: 22, r: 8 },
      { x: 22, y: 21, r: 9 },
      { x: 16, y: 17, r: 11 },
      { x: 16, y: 11, r: 10 }
    ];

    ctx.fillStyle = baseGreen;
    clusters.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r + 1, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = midGreen;
    clusters.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y - 1, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = sunGreen;
    clusters.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y - 3, c.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = lightTip;
    ctx.fillRect(14, 6, 4, 2);
    ctx.fillRect(9, 17, 3, 2);
    ctx.fillRect(21, 15, 3, 2);
    ctx.fillRect(15, 12, 3, 2);

    variations.push(canvas);
  }
  return variations;
}

function generatePineSprites() {
  const variations = [];
  for (let v = 0; v < 2; v++) {
    const { canvas, ctx } = createTileCanvas(24, 46);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(12, 42, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#3a200e';
    ctx.fillRect(10, 30, 4, 12);
    ctx.fillStyle = '#59361a';
    ctx.fillRect(12, 31, 2, 10);

    const darkNeedle = v === 0 ? '#0d2818' : '#0a2318';
    const midNeedle  = v === 0 ? '#184b29' : '#144426';
    const sunNeedle  = v === 0 ? '#2a7442' : '#236b3b';
    const tipNeedle  = v === 0 ? '#48a666' : '#3f995c';

    const tiers = [
      { yTop: 24, yBot: 34, w: 20 },
      { yTop: 16, yBot: 26, w: 16 },
      { yTop: 9,  yBot: 18, w: 12 },
      { yTop: 3,  yBot: 11, w: 8  }
    ];

    tiers.forEach(t => {
      ctx.fillStyle = darkNeedle;
      ctx.beginPath();
      ctx.moveTo(12, t.yTop);
      ctx.lineTo(12 - t.w / 2, t.yBot);
      ctx.lineTo(12 + t.w / 2, t.yBot);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = midNeedle;
      ctx.beginPath();
      ctx.moveTo(12, t.yTop + 1);
      ctx.lineTo(12 - t.w / 2 + 1, t.yBot - 1);
      ctx.lineTo(12 + t.w / 2 - 1, t.yBot - 1);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = sunNeedle;
      ctx.beginPath();
      ctx.moveTo(12, t.yTop + 1);
      ctx.lineTo(12 - t.w / 4, t.yBot - 2);
      ctx.lineTo(12 + t.w / 4, t.yBot - 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = tipNeedle;
      ctx.fillRect(12 - t.w / 2, t.yBot - 1, 2, 2);
      ctx.fillRect(12 + t.w / 2 - 2, t.yBot - 1, 2, 2);
      ctx.fillRect(12 - 1, t.yTop, 2, 2);
    });

    variations.push(canvas);
  }
  return variations;
}

function generateBirchSprites() {
  const variations = [];
  for (let v = 0; v < 2; v++) {
    const { canvas, ctx } = createTileCanvas(20, 40);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(10, 37, 8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#f0f4ea';
    ctx.fillRect(9, 18, 3, 19);
    ctx.fillStyle = '#262322';
    ctx.fillRect(9, 21, 2, 1);
    ctx.fillRect(10, 26, 2, 1);
    ctx.fillRect(9, 31, 3, 1);
    ctx.fillRect(10, 35, 2, 1);

    const circles = [
      { x: 7,  y: 20, r: 6, col: '#346d29' },
      { x: 13, y: 18, r: 7, col: '#458536' },
      { x: 10, y: 11, r: 8, col: '#5ba644' }
    ];

    circles.forEach(c => {
      ctx.fillStyle = c.col;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#8ce067';
    ctx.fillRect(9, 7, 4, 3);
    ctx.fillRect(6, 17, 3, 2);
    ctx.fillRect(12, 15, 3, 2);
    ctx.fillStyle = '#c7fca2';
    ctx.fillRect(10, 6, 2, 1);

    variations.push(canvas);
  }
  return variations;
}

function generateBlossomSprites() {
  const variations = [];
  for (let v = 0; v < 2; v++) {
    const { canvas, ctx } = createTileCanvas(28, 40);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(14, 37, 11, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#4a2c14';
    ctx.fillRect(12, 20, 4, 17);
    ctx.fillStyle = '#331c0c';
    ctx.fillRect(12, 22, 1, 15);
    ctx.fillStyle = '#6b411f';
    ctx.fillRect(14, 21, 2, 15);

    ctx.fillRect(10, 18, 3, 4);
    ctx.fillRect(15, 17, 3, 4);

    // Foliage base
    ctx.fillStyle = '#1e5223';
    ctx.beginPath();
    ctx.arc(14, 16, 11, 0, Math.PI * 2);
    ctx.arc(9, 19, 7, 0, Math.PI * 2);
    ctx.arc(19, 18, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2f7d38';
    ctx.beginPath();
    ctx.arc(14, 14, 10, 0, Math.PI * 2);
    ctx.fill();

    // Cherry blossoms
    const blossomPetal = v === 0 ? '#f472b6' : '#f9a8d4';
    const blossomDark  = '#db2777';

    ctx.fillStyle = blossomDark;
    const dots = [
      [8, 14], [11, 10], [16, 8], [19, 12], [21, 16],
      [14, 13], [10, 18], [17, 18], [13, 20], [7, 18]
    ];
    dots.forEach(([x, y]) => {
      ctx.fillRect(x, y, 3, 3);
    });

    ctx.fillStyle = blossomPetal;
    dots.forEach(([x, y]) => {
      ctx.fillRect(x + 1, y, 1, 2);
      ctx.fillRect(x, y + 1, 2, 1);
    });

    ctx.fillStyle = '#ffffff';
    dots.forEach(([x, y]) => {
      ctx.fillRect(x + 1, y + 1, 1, 1);
    });

    variations.push(canvas);
  }
  return variations;
}

function generateAutumnSprites() {
  const variations = [];
  for (let v = 0; v < 2; v++) {
    const { canvas, ctx } = createTileCanvas(30, 42);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(15, 39, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#3f2511';
    ctx.fillRect(13, 22, 5, 17);
    ctx.fillStyle = '#59361a';
    ctx.fillRect(15, 23, 2, 16);

    const darkAmber  = v === 0 ? '#7c2d12' : '#881337';
    const richOrange = v === 0 ? '#c2410c' : '#b91c1c';
    const brightGold = v === 0 ? '#ea580c' : '#e11d48';
    const sunYellow  = v === 0 ? '#facc15' : '#fb923c';

    ctx.fillStyle = darkAmber;
    ctx.beginPath();
    ctx.arc(10, 21, 8, 0, Math.PI * 2);
    ctx.arc(20, 20, 8, 0, Math.PI * 2);
    ctx.arc(15, 15, 11, 0, Math.PI * 2);
    ctx.arc(15, 9, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = richOrange;
    ctx.beginPath();
    ctx.arc(15, 13, 9, 0, Math.PI * 2);
    ctx.arc(11, 18, 6, 0, Math.PI * 2);
    ctx.arc(19, 17, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = brightGold;
    ctx.beginPath();
    ctx.arc(15, 10, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = sunYellow;
    ctx.fillRect(13, 5, 4, 2);
    ctx.fillRect(9, 14, 3, 2);
    ctx.fillRect(19, 13, 3, 2);

    variations.push(canvas);
  }
  return variations;
}

function generateSnowyPineSprites() {
  const variations = [];
  for (let v = 0; v < 2; v++) {
    const { canvas, ctx } = createTileCanvas(24, 46);
    ctx.fillStyle = 'rgba(0, 20, 40, 0.25)';
    ctx.beginPath();
    ctx.ellipse(12, 42, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#2c1e13';
    ctx.fillRect(10, 30, 4, 12);

    const tiers = [
      { yTop: 24, yBot: 34, w: 20 },
      { yTop: 16, yBot: 26, w: 16 },
      { yTop: 9,  yBot: 18, w: 12 },
      { yTop: 3,  yBot: 11, w: 8  }
    ];

    tiers.forEach(t => {
      ctx.fillStyle = '#0f2918';
      ctx.beginPath();
      ctx.moveTo(12, t.yTop);
      ctx.lineTo(12 - t.w / 2, t.yBot);
      ctx.lineTo(12 + t.w / 2, t.yBot);
      ctx.closePath();
      ctx.fill();
    });

    // Snowdrifts
    tiers.forEach(t => {
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(12, t.yTop + 2, t.w / 2 + 1, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(12, t.yTop + 1, t.w / 2, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(12 - Math.floor(t.w / 4), t.yTop + 3, 1, 2);
      ctx.fillRect(12 + Math.floor(t.w / 4), t.yTop + 3, 1, 2);
    });

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, 2, 2, 3);

    variations.push(canvas);
  }
  return variations;
}

function generateSwampWillowSprites() {
  const variations = [];
  for (let v = 0; v < 2; v++) {
    const { canvas, ctx } = createTileCanvas(34, 44);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(17, 40, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk & roots
    ctx.fillStyle = '#261b12';
    ctx.fillRect(14, 21, 6, 19);
    ctx.fillStyle = '#3f2d1e';
    ctx.fillRect(16, 22, 2, 17);

    ctx.fillStyle = '#261b12';
    ctx.fillRect(11, 36, 4, 4);
    ctx.fillRect(9, 38, 3, 2);
    ctx.fillRect(19, 36, 4, 4);
    ctx.fillRect(22, 38, 3, 2);

    // Canopy
    ctx.fillStyle = '#1f291a';
    ctx.beginPath();
    ctx.ellipse(17, 16, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#33442a';
    ctx.beginPath();
    ctx.ellipse(17, 14, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Moss tendrils
    ctx.fillStyle = '#4c5f3c';
    const tendrils = [6, 9, 12, 15, 18, 21, 24, 27];
    tendrils.forEach((tx, idx) => {
      const len = 5 + ((idx * 3 + v * 2) % 6);
      ctx.fillRect(tx, 20, 2, len);
      ctx.fillStyle = '#38472c';
      ctx.fillRect(tx + 1, 20, 1, len + 1);
      ctx.fillStyle = '#4c5f3c';
    });

    variations.push(canvas);
  }
  return variations;
}

function generatePalmSprites() {
  const variations = [];
  for (let v = 0; v < 2; v++) {
    const { canvas, ctx } = createTileCanvas(28, 46);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(14, 42, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const lean = v === 0 ? 1 : -1;
    ctx.fillStyle = '#825f38';
    for (let y = 41; y >= 20; y -= 3) {
      const progress = (41 - y) / 21;
      const x = 13 + Math.floor(progress * 4 * lean);
      ctx.fillRect(x, y, 4, 3);
      ctx.fillStyle = '#b38f5f';
      ctx.fillRect(x + 1, y, 2, 1);
      ctx.fillStyle = '#825f38';
    }

    const crownX = 13 + Math.floor(4 * lean);
    const crownY = 18;

    // Coconuts
    ctx.fillStyle = '#482a13';
    ctx.fillRect(crownX - 1, crownY + 1, 2, 2);
    ctx.fillRect(crownX + 2, crownY + 2, 2, 2);

    // Palm fronds
    ctx.fillStyle = '#1e5e22';
    const fronds = [
      { dx: -11, dy: -6 },
      { dx: 11,  dy: -6 },
      { dx: -12, dy: 3 },
      { dx: 12,  dy: 3 },
      { dx: -5,  dy: -12 },
      { dx: 5,   dy: -12 }
    ];

    fronds.forEach(f => {
      ctx.beginPath();
      ctx.moveTo(crownX + 1, crownY);
      ctx.quadraticCurveTo(crownX + f.dx * 0.6, crownY + f.dy * 0.3 - 3, crownX + f.dx, crownY + f.dy);
      ctx.strokeStyle = '#2d7830';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#4fa854';
      ctx.fillRect(crownX + Math.floor(f.dx * 0.7), crownY + Math.floor(f.dy * 0.7), 2, 2);
    });

    variations.push(canvas);
  }
  return variations;
}

function generateSaplingSprites() {
  const { canvas, ctx } = createTileCanvas(16, 22);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(8, 20, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#543217';
  ctx.fillRect(7, 10, 2, 10);

  ctx.fillStyle = '#2d7836';
  ctx.beginPath();
  ctx.arc(8, 7, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#52b85c';
  ctx.beginPath();
  ctx.arc(8, 6, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a1f2aa';
  ctx.fillRect(7, 4, 2, 2);

  return [canvas];
}

function generateDeadwoodSprites() {
  const { canvas, ctx } = createTileCanvas(24, 38);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(12, 35, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3f3d3a';
  ctx.fillRect(10, 18, 4, 17);
  ctx.fillStyle = '#656360';
  ctx.fillRect(12, 19, 2, 15);

  ctx.strokeStyle = '#3f3d3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(11, 22);
  ctx.lineTo(4, 15);
  ctx.lineTo(2, 10);
  ctx.moveTo(13, 20);
  ctx.lineTo(19, 13);
  ctx.lineTo(22, 8);
  ctx.moveTo(12, 18);
  ctx.lineTo(11, 9);
  ctx.lineTo(7, 4);
  ctx.stroke();

  return [canvas];
}

function generateAllTreeSprites() {
  const treeMap = new Map();
  treeMap.set(TREES.OAK, generateOakSprites());
  treeMap.set(TREES.PINE, generatePineSprites());
  treeMap.set(TREES.BIRCH, generateBirchSprites());
  treeMap.set(TREES.BLOSSOM, generateBlossomSprites());
  treeMap.set(TREES.AUTUMN, generateAutumnSprites());
  treeMap.set(TREES.SNOWY_PINE, generateSnowyPineSprites());
  treeMap.set(TREES.SWAMP_WILLOW, generateSwampWillowSprites());
  treeMap.set(TREES.PALM, generatePalmSprites());
  treeMap.set(TREES.SAPLING, generateSaplingSprites());
  treeMap.set(TREES.DEADWOOD, generateDeadwoodSprites());
  return treeMap;
}

// ----------------------------------------------------
// 7. ORGANIC EDGE TRANSITION OVERLAYS (No more square tiles!)
// ----------------------------------------------------
function generateEdgeTransitionOverlays() {
  const overlays = new Map();

  const configs = [
    {
      tile: TILES.GRASS,
      main: '#489c3e',
      light: '#59b54e',
      dark: '#3a8332',
      shadow: 'rgba(0, 0, 0, 0.24)'
    },
    {
      tile: TILES.SNOW,
      main: '#eaf1f8',
      light: '#ffffff',
      dark: '#cbd5e1',
      shadow: 'rgba(0, 25, 50, 0.18)'
    },
    {
      tile: TILES.SAND,
      main: '#dfb867',
      light: '#ecd37f',
      dark: '#cb9f4d',
      shadow: 'rgba(50, 35, 10, 0.2)'
    },
    {
      tile: TILES.DIRT,
      main: '#7a5433',
      light: '#8f653e',
      dark: '#614023',
      shadow: 'rgba(0, 0, 0, 0.22)'
    },
    {
      tile: TILES.SWAMP_GROUND,
      main: '#445434',
      light: '#546b3e',
      dark: '#313d24',
      shadow: 'rgba(0, 0, 0, 0.26)'
    },
    {
      tile: TILES.VOID_GROUND,
      main: '#260f38',
      light: '#551178',
      dark: '#150522',
      accent: '#b03bf3',
      shadow: 'rgba(100, 0, 160, 0.35)'
    }
  ];

  configs.forEach(cfg => {
    const set = {};

    // 1. OVERHANG FROM NORTH (reaches down from y=0 by 1 to 4px)
    {
      const { canvas, ctx } = createTileCanvas();
      const heights = [3, 2, 4, 3, 2, 4, 3, 1, 3, 4, 2, 4, 3, 2, 3, 2];
      for (let x = 0; x < 16; x++) {
        const h = heights[x];
        ctx.fillStyle = cfg.shadow;
        ctx.fillRect(x, h, 1, 1);
        ctx.fillStyle = cfg.main;
        ctx.fillRect(x, 0, 1, h);
        ctx.fillStyle = cfg.light;
        ctx.fillRect(x, h - 1, 1, 1);
        if (cfg.accent && x % 4 === 0) {
          ctx.fillStyle = cfg.accent;
          ctx.fillRect(x, 0, 1, 1);
        }
      }
      set['FROM_N'] = canvas;
    }

    // 2. OVERHANG FROM SOUTH (reaches up from y=15 into tile by 1 to 4px)
    {
      const { canvas, ctx } = createTileCanvas();
      const heights = [2, 4, 3, 2, 3, 4, 2, 3, 4, 1, 3, 2, 4, 3, 2, 3];
      for (let x = 0; x < 16; x++) {
        const h = heights[x];
        const startY = 16 - h;
        ctx.fillStyle = cfg.shadow;
        ctx.fillRect(x, startY - 1, 1, 1);
        ctx.fillStyle = cfg.main;
        ctx.fillRect(x, startY, 1, h);
        ctx.fillStyle = cfg.light;
        ctx.fillRect(x, startY, 1, 1);
        if (cfg.accent && x % 4 === 2) {
          ctx.fillStyle = cfg.accent;
          ctx.fillRect(x, 15, 1, 1);
        }
      }
      set['FROM_S'] = canvas;
    }

    // 3. OVERHANG FROM WEST (reaches right from x=0 into tile by 1 to 4px)
    {
      const { canvas, ctx } = createTileCanvas();
      const widths = [3, 2, 4, 2, 3, 4, 1, 3, 4, 2, 3, 4, 2, 3, 2, 3];
      for (let y = 0; y < 16; y++) {
        const w = widths[y];
        ctx.fillStyle = cfg.shadow;
        ctx.fillRect(w, y, 1, 1);
        ctx.fillStyle = cfg.main;
        ctx.fillRect(0, y, w, 1);
        ctx.fillStyle = cfg.light;
        ctx.fillRect(w - 1, y, 1, 1);
      }
      set['FROM_W'] = canvas;
    }

    // 4. OVERHANG FROM EAST (reaches left from x=15 into tile by 1 to 4px)
    {
      const { canvas, ctx } = createTileCanvas();
      const widths = [2, 3, 4, 3, 2, 4, 3, 2, 4, 1, 3, 2, 4, 3, 2, 3];
      for (let y = 0; y < 16; y++) {
        const w = widths[y];
        const startX = 16 - w;
        ctx.fillStyle = cfg.shadow;
        ctx.fillRect(startX - 1, y, 1, 1);
        ctx.fillStyle = cfg.main;
        ctx.fillRect(startX, y, w, 1);
        ctx.fillStyle = cfg.light;
        ctx.fillRect(startX, y, 1, 1);
      }
      set['FROM_E'] = canvas;
    }

    // 5. INNER CORNERS
    // Top-Left Inner Corner
    {
      const { canvas, ctx } = createTileCanvas();
      ctx.fillStyle = cfg.shadow;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI / 2);
      ctx.lineTo(0, 0);
      ctx.fill();

      ctx.fillStyle = cfg.main;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI / 2);
      ctx.lineTo(0, 0);
      ctx.fill();

      ctx.fillStyle = cfg.light;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI / 2);
      ctx.lineTo(0, 0);
      ctx.fill();
      set['INNER_NW'] = canvas;
    }

    // Top-Right Inner Corner
    {
      const { canvas, ctx } = createTileCanvas();
      ctx.fillStyle = cfg.shadow;
      ctx.beginPath();
      ctx.arc(16, 0, 6, Math.PI / 2, Math.PI);
      ctx.lineTo(16, 0);
      ctx.fill();

      ctx.fillStyle = cfg.main;
      ctx.beginPath();
      ctx.arc(16, 0, 5, Math.PI / 2, Math.PI);
      ctx.lineTo(16, 0);
      ctx.fill();

      ctx.fillStyle = cfg.light;
      ctx.beginPath();
      ctx.arc(16, 0, 3, Math.PI / 2, Math.PI);
      ctx.lineTo(16, 0);
      ctx.fill();
      set['INNER_NE'] = canvas;
    }

    // Bottom-Left Inner Corner
    {
      const { canvas, ctx } = createTileCanvas();
      ctx.fillStyle = cfg.shadow;
      ctx.beginPath();
      ctx.arc(0, 16, 6, -Math.PI / 2, 0);
      ctx.lineTo(0, 16);
      ctx.fill();

      ctx.fillStyle = cfg.main;
      ctx.beginPath();
      ctx.arc(0, 16, 5, -Math.PI / 2, 0);
      ctx.lineTo(0, 16);
      ctx.fill();

      ctx.fillStyle = cfg.light;
      ctx.beginPath();
      ctx.arc(0, 16, 3, -Math.PI / 2, 0);
      ctx.lineTo(0, 16);
      ctx.fill();
      set['INNER_SW'] = canvas;
    }

    // Bottom-Right Inner Corner
    {
      const { canvas, ctx } = createTileCanvas();
      ctx.fillStyle = cfg.shadow;
      ctx.beginPath();
      ctx.arc(16, 16, 6, Math.PI, Math.PI * 1.5);
      ctx.lineTo(16, 16);
      ctx.fill();

      ctx.fillStyle = cfg.main;
      ctx.beginPath();
      ctx.arc(16, 16, 5, Math.PI, Math.PI * 1.5);
      ctx.lineTo(16, 16);
      ctx.fill();

      ctx.fillStyle = cfg.light;
      ctx.beginPath();
      ctx.arc(16, 16, 3, Math.PI, Math.PI * 1.5);
      ctx.lineTo(16, 16);
      ctx.fill();
      set['INNER_SE'] = canvas;
    }

    // 6. OUTER CORNER BEVELS
    // Top-Left Outer Corner Bevel
    {
      const { canvas, ctx } = createTileCanvas();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillRect(1, 0, 1, 1);
      ctx.fillRect(0, 1, 1, 1);
      ctx.fillStyle = cfg.dark;
      ctx.fillRect(1, 1, 2, 1);
      ctx.fillRect(1, 2, 1, 2);
      set['OUTER_NW'] = canvas;
    }

    // Top-Right Outer Corner Bevel
    {
      const { canvas, ctx } = createTileCanvas();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(15, 0, 1, 1);
      ctx.fillRect(14, 0, 1, 1);
      ctx.fillRect(15, 1, 1, 1);
      ctx.fillStyle = cfg.dark;
      ctx.fillRect(13, 1, 2, 1);
      ctx.fillRect(14, 2, 1, 2);
      set['OUTER_NE'] = canvas;
    }

    // Bottom-Left Outer Corner Bevel
    {
      const { canvas, ctx } = createTileCanvas();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 15, 1, 1);
      ctx.fillRect(1, 15, 1, 1);
      ctx.fillRect(0, 14, 1, 1);
      ctx.fillStyle = cfg.dark;
      ctx.fillRect(1, 14, 2, 1);
      ctx.fillRect(1, 12, 1, 2);
      set['OUTER_SW'] = canvas;
    }

    // Bottom-Right Outer Corner Bevel
    {
      const { canvas, ctx } = createTileCanvas();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(15, 15, 1, 1);
      ctx.fillRect(14, 15, 1, 1);
      ctx.fillRect(15, 14, 1, 1);
      ctx.fillStyle = cfg.dark;
      ctx.fillRect(13, 14, 2, 1);
      ctx.fillRect(14, 12, 1, 2);
      set['OUTER_SE'] = canvas;
    }

    overlays.set(cfg.tile, set);
  });

  return overlays;
}

// ----------------------------------------------------
// SPRITE MANAGER
// ----------------------------------------------------
class SpriteManager {
  constructor() {
    this.groundVariants = new Map();
    this.objects = new Map();
    this.trees = new Map();
    this.edgeOverlays = new Map();
    this.canopyVariants = [];
    this.playerSprites = null;
    this.animTime = 0;

    this.init();
  }

  init() {
    // Ground variants
    this.groundVariants.set(TILES.GRASS, generateGrassSprites());
    this.groundVariants.set(TILES.DIRT, generateDirtSprites());
    this.groundVariants.set(TILES.SAND, generateSandSprites());
    this.groundVariants.set(TILES.SNOW, generateSnowSprites());
    this.groundVariants.set(TILES.SWAMP_GROUND, generateSwampGroundSprites());
    this.groundVariants.set(TILES.VOID_GROUND, generateVoidGroundSprites());
    this.groundVariants.set(TILES.BRIDGE_H, [generateBridgeSprite(true)]);
    this.groundVariants.set(TILES.BRIDGE_V, [generateBridgeSprite(false)]);

    // Transparent Objects & Undergrowth
    this.objects.set(OBJECTS.ROCK_STONE, generateRockStoneSprite());
    this.objects.set(OBJECTS.ROCK_ICE, generateRockIceSprite());
    this.objects.set(OBJECTS.ROCK_VOID, generateRockVoidSprite());
    this.objects.set(OBJECTS.BUSH, generateBushSprite());
    this.objects.set(OBJECTS.CACTUS, generateCactusSprite());
    this.objects.set(OBJECTS.MUSHROOM, generateMushroomSprite());
    this.objects.set(OBJECTS.MUSHROOM_BROWN, generateMushroomBrownSprite());
    this.objects.set(OBJECTS.TREE_TRUNK, generateTreeTrunkSprite());
    this.objects.set(OBJECTS.FERN, generateFernSprite());
    this.objects.set(OBJECTS.FALLEN_LOG, generateFallenLogSprite());
    this.objects.set(OBJECTS.FOREST_FLOWERS, generateForestFlowersSprite());

    // Trees
    this.trees = generateAllTreeSprites();

    // Edge Transitions
    this.edgeOverlays = generateEdgeTransitionOverlays();

    // Canopy variants
    this.canopyVariants = generateCanopySprites();

    // Player
    this.playerSprites = generatePlayerSprites();
  }

  update(dt) {
    this.animTime += dt;
  }

  getGroundSprite(tileId, tileX = 0, tileY = 0) {
    const t = Math.floor(this.animTime * 12);

    if (tileId === TILES.WATER) return generateWaterSprite(t);
    if (tileId === TILES.SWAMP_WATER) return generateSwampWaterSprite(t);
    if (tileId === TILES.QUICKSAND) return generateQuicksandSprite(t);
    if (tileId === TILES.VOID_LAKE) return generateVoidLakeSprite(t);

    const variants = this.groundVariants.get(tileId);
    if (variants && variants.length > 0) {
      const index = Math.abs((tileX * 73856093 ^ tileY * 19349663) % variants.length);
      return variants[index];
    }
    return this.groundVariants.get(TILES.GRASS)[0];
  }

  getObjectSprite(objId) {
    return this.objects.get(objId) || null;
  }

  getTreeSprite(treeType, variant = 0) {
    const list = this.trees.get(treeType);
    if (!list || list.length === 0) return null;
    return list[variant % list.length];
  }

  getTreeMetadata(treeType) {
    return TREE_METADATA[treeType] || null;
  }

  getEdgeOverlay(tileType, key) {
    const set = this.edgeOverlays.get(tileType);
    return set ? set[key] : null;
  }

  getCanopySprite(tileX = 0, tileY = 0) {
    const index = Math.abs((tileX * 31 + tileY * 17) % this.canopyVariants.length);
    return this.canopyVariants[index];
  }

  getPlayerSprite(direction, isMoving) {
    const dir = this.playerSprites[direction] || this.playerSprites['down'];
    if (!isMoving) return dir[0];
    const frame = Math.floor(this.animTime * 7) % 2;
    return dir[frame];
  }
}


// --- js/caveMap.js ---

class CaveMap {
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


// --- js/cloudMap.js ---

class CloudMap {
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


// --- js/map.js ---

class WorldMap {
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


// --- js/enemies.js ---

// Index BESTIARY_DATA by ID for quick O(1) lookup
const BESTIARY_MAP = {};
BESTIARY_DATA.forEach(def => {
  BESTIARY_MAP[def.id] = def;
});

/** Gibt an, ob ein Monster fliegt oder schwebt (darf über Wasser/Abgründen existieren) */
function isFlyingEnemy(typeId) {
  return typeId === 'gazer_of_the_void' ||
         typeId === 'sky_harpy' ||
         typeId === 'star_astromancer' ||
         typeId === 'lava_core';
}

/** Prüft, ob ein Kachelfeld für Boden-Gegner begehbar ist */
function isTileWalkable(map, tx, ty) {
  if (!map || !map.isValid(tx, ty)) return false;
  if (map.isSolid && map.isSolid(tx, ty)) return false;
  if (map.isDeadly && map.isDeadly(tx, ty)) return false;

  const ground = map.getGroundTile ? map.getGroundTile(tx, ty) : (map.ground ? map.ground[ty]?.[tx] : 0);
  if (ground === TILES.WATER ||
      ground === TILES.SWAMP_WATER ||
      ground === TILES.CAVE_WATER ||
      ground === TILES.VOID_LAKE ||
      ground === TILES.SKY_ABYSS) {
    return false;
  }

  const obj = map.getObjectTile ? map.getObjectTile(tx, ty) : (map.objects ? map.objects[ty]?.[tx] : 0);
  if (obj && OBJ_PROPS[obj] && OBJ_PROPS[obj].solid) {
    return false;
  }

  if (map.checkTreeCollision && map.checkTreeCollision(tx * TILE_SIZE + 8, ty * TILE_SIZE + 8, 4)) {
    return false;
  }

  return true;
}

/** Sucht in Spiralen das nächste gültige begehbare Kachelfeld */
function findNearestWalkableTile(map, tx, ty, maxRadius = 14) {
  if (isTileWalkable(map, tx, ty)) return { tx, ty };

  for (let r = 1; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) === r || Math.abs(dy) === r) {
          const nx = tx + dx;
          const ny = ty + dy;
          if (isTileWalkable(map, nx, ny)) {
            return { tx: nx, ty: ny };
          }
        }
      }
    }
  }
  return { tx, ty };
}

/**
 * EnemyEntity - Ein lebendiges, animiertes Monster in der Spielwelt
 */
class EnemyEntity {
  constructor(typeId, x, y, dimension = DIMENSIONS.OVERWORLD, packId = null, options = {}) {
    this.def = BESTIARY_MAP[typeId];
    if (!this.def) {
      throw new Error(`Unbekannter Gegner-Typ: ${typeId}`);
    }

    this.id = options.id || `${typeId}_${Math.random().toString(36).substr(2, 7)}`;
    this.typeId = typeId;
    this.name = this.def.name;
    this.title = this.def.title;
    this.category = this.def.category;
    this.dimension = dimension;
    this.packId = packId;

    // Welt-Position (in Pixeln)
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.vx = 0;
    this.vy = 0;
    this.elevation = options.elevation || 0;

    // Proportionale Skalierung (Schwache Monster kleiner, Kolosse/Bosse riesig!)
    this.scale = options.scale ?? this.def.scale ?? (this.typeId === 'green_slime' ? 0.48 : (this.category === 'boss' ? 1.6 : (this.typeId === 'cave_weaver' || this.typeId === 'lava_core' ? 0.72 : 1.0)));

    // Hitbox-Radius proportional zur Skalierung
    let baseRadius = 9;
    if (this.category === 'boss') {
      baseRadius = 18;
    } else if (this.category === 'reptile' || this.category === 'beast') {
      baseRadius = 11;
    } else if (this.typeId === 'green_slime') {
      baseRadius = 6;
    } else if (this.typeId === 'cave_weaver' || this.typeId === 'lava_core') {
      baseRadius = 7;
    }
    this.radius = Math.max(3, Math.round(baseRadius * this.scale));

    // Werte aus Bestiarium / Optionen
    this.maxHp = options.hp ?? this.def.stats.hp ?? 50;
    this.hp = this.maxHp;
    this.atk = options.atk ?? this.def.stats.atk ?? 20;

    // XP-Ertrag bei Besiegung (stärkere Gegner geben deutlich mehr EP)
    this.xpValue = options.xpValue ?? this.def.xpValue ?? (this.category === 'boss' ? 65 : (this.scale < 0.85 ? 4 : 16));

    // Geschwindigkeit
    const spdStr = this.def.stats.spd || 'Mittel';
    if (spdStr.includes('Sehr Schnell')) this.baseSpeed = 92;
    else if (spdStr.includes('Schnell')) this.baseSpeed = 74;
    else if (spdStr.includes('Mittel')) this.baseSpeed = 52;
    else if (spdStr.includes('Langsam')) this.baseSpeed = 34;
    else if (spdStr.includes('Schwerfällig')) this.baseSpeed = 24;
    else if (spdStr.includes('Stationär')) this.baseSpeed = 0;
    else this.baseSpeed = 48;

    // Reichweite
    const rngStr = this.def.stats.rng || '40px';
    const parsedRng = parseInt(rngStr, 10);
    this.attackRange = isNaN(parsedRng) ? 40 : parsedRng;

    // KI & Animationsstatus
    this.state = 'idle'; // 'idle' | 'walk' | 'alert' | 'attack' | 'cooldown' | 'hurt' | 'dead'
    this.animTime = Math.random() * 5;
    this.hitFlash = 0;
    this.telegraphTimer = 0;
    this.cooldownTimer = Math.random() * 1.5;
    this.wanderTimer = Math.random() * 2 + 1;
    this.wanderTarget = { x, y };

    this.alertEmoteTimer = 0;
    this.facing = 'down';

    // Boar Charge State
    this.chargeDir = { x: 0, y: 0 };
    this.isCharging = false;
    this.chargeTimer = 0;

    // Anti-Kiting & Spezialfähigkeiten
    this.teleportCooldown = Math.random() * 2 + 4.0;
    this.isTeleporting = false;
    this.teleportTimer = 0;
    this.teleportDest = null;
    this.hookCooldown = Math.random() * 2 + 4.5;
    this.isHooking = false;
  }

  update(dt, player, map, enemyManager, combatManager) {
    if (this.state === 'dead') return;

    this.animTime += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    if (this.alertEmoteTimer > 0) this.alertEmoteTimer -= dt;
    if (this.teleportCooldown > 0) this.teleportCooldown -= dt;
    if (this.hookCooldown > 0) this.hookCooldown -= dt;

    // Nur in der aktiven Dimension berechnen
    if (this.dimension !== enemyManager.game.currentDimension) return;

    // Distanz zum Spieler
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distToPlayer = Math.hypot(dx, dy);

    // Spezial: Teleportation im Gange
    if (this.isTeleporting) {
      this.teleportTimer -= dt;
      if (this.teleportTimer <= 0) {
        this.completeTeleport(player, map, combatManager);
      }
      return;
    }

    // Ausrichtung
    if (Math.abs(dx) > Math.abs(dy)) {
      this.facing = dx > 0 ? 'right' : 'left';
    } else {
      this.facing = dy > 0 ? 'down' : 'up';
    }

    // Wenn KI deaktiviert (z.B. friedlicher Show-Modus)
    if (!enemyManager.aiActive) {
      this.state = 'idle';
      return;
    }

    // Erfassungsreichweite
    const detectionRange = (this.category === 'range' || this.typeId === 'star_astromancer')
      ? ENEMY_CONFIG.DETECTION_RADIUS_SCOUT
      : ENEMY_CONFIG.DETECTION_RADIUS_DEFAULT;

    // =========================================================================
    // 1. ZUSTANDSAUTOMAT (FSM)
    // =========================================================================

    // A) Wenn im Angriff oder Telegraphieren
    if (this.state === 'attack') {
      this.telegraphTimer -= dt;

      // Spezial: Wildschwein-Ansturm (Charge)
      if (this.typeId === 'tusk_boar' && this.isCharging) {
        this.chargeTimer -= dt;
        const cSpeed = this.baseSpeed * 2.6;
        const nextX = this.x + this.chargeDir.x * cSpeed * dt;
        const nextY = this.y + this.chargeDir.y * cSpeed * dt;

        // Kollision beim Stürmen
        const tx = Math.floor(nextX / TILE_SIZE);
        const ty = Math.floor(nextY / TILE_SIZE);
        const hitWall = map.isSolid ? map.isSolid(tx, ty) : false;

        if (hitWall || this.chargeTimer <= 0) {
          // Betäubung bei Wandaufprall
          this.isCharging = false;
          this.state = 'idle';
          this.cooldownTimer = hitWall ? 2.5 : 1.2;
          if (hitWall && combatManager) {
            combatManager.addHitSparks(this.x, this.y, '#f59e0b', 12);
            combatManager.addFloatingText('💫 BENOMMEN!', this.x, this.y - 18, '#fde047');
          }
        } else {
          this.x = nextX;
          this.y = nextY;
          // Prüfe Treffer auf Spieler während des Ansturms
          if (Math.hypot(player.x - this.x, player.y - this.y) <= (this.radius + player.radius + 4)) {
            this.hitPlayer(player, combatManager, this.atk * 1.3, this.chargeDir);
            this.isCharging = false;
            this.state = 'idle';
            this.cooldownTimer = 1.5;
          }
        }
        return;
      }

      if (this.telegraphTimer <= 0) {
        if (this.isHooking) {
          this.isHooking = false;
          if (combatManager) {
            combatManager.fireGrapplingHook(this, player.x, player.y);
          }
          this.state = 'idle';
          this.cooldownTimer = 0.9;
          return;
        }

        this.executeAttack(player, combatManager, enemyManager);
        this.state = 'idle';
        this.cooldownTimer = ENEMY_CONFIG.ATTACK_RECOVERY_TIME + Math.random() * 0.4;
      }
      return;
    }

    // B) Aggro & Annäherung
    const isAggro = distToPlayer <= detectionRange;

    if (isAggro && !player.isDead) {
      // Wenn frisch aufgeschreckt -> Alarm-Emote und Rudel alarmieren!
      if (this.state === 'idle' || this.state === 'wander') {
        this.alertEmoteTimer = 1.0;
        enemyManager.alertPack(this.packId, this.x, this.y);
      }

      // 1. Anti-Kiting: Leeren-Monster teleportieren sich zum Spieler!
      if (this.category === 'void' && distToPlayer > 75 && this.teleportCooldown <= 0 && this.state !== 'attack') {
        this.startTeleport(player, map, combatManager);
        return;
      }

      // 2. Anti-Kiting: Yeti und Trolle haben einen Enterhaken, mit dem sie den Spieler heranziehen!
      if ((this.typeId === 'boulder_troll' || this.typeId === 'frost_giant') &&
          distToPlayer >= 65 && distToPlayer <= 230 &&
          this.hookCooldown <= 0 && this.state !== 'attack' && this.cooldownTimer <= 0) {
        this.startHookAttack(player, combatManager);
        return;
      }

      // Bereite Angriff vor, wenn in Angriffsreichweite
      if (distToPlayer <= this.attackRange && this.cooldownTimer <= 0) {
        this.startAttack(player, combatManager);
        return;
      }

      // Bewegung zum Spieler (wenn nicht stationär)
      if (this.baseSpeed > 0) {
        this.state = 'walk';
        let moveX = dx / (distToPlayer || 1);
        let moveY = dy / (distToPlayer || 1);

        // Fernkämpfer halten Abstand! Weichen zurück, wenn Spieler zu nah (< 45px)
        if (this.category === 'range' && distToPlayer < 45) {
          moveX = -moveX;
          moveY = -moveY;
        }

        this.moveWithCollision(moveX, moveY, this.baseSpeed, dt, map);
      } else {
        this.state = 'idle';
      }
    } else {
      // C) Friedliches Umherstreifen (Wander) nahe Heimatort
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = Math.random() * 3 + 2;
        const angle = Math.random() * Math.PI * 2;
        const wDist = Math.random() * ENEMY_CONFIG.WANDER_RADIUS;
        this.wanderTarget = {
          x: this.homeX + Math.cos(angle) * wDist,
          y: this.homeY + Math.sin(angle) * wDist
        };
      }

      const distToWander = Math.hypot(this.wanderTarget.x - this.x, this.wanderTarget.y - this.y);
      if (distToWander > 8 && this.baseSpeed > 0) {
        this.state = 'walk';
        const wdx = (this.wanderTarget.x - this.x) / distToWander;
        const wdy = (this.wanderTarget.y - this.y) / distToWander;
        this.moveWithCollision(wdx, wdy, this.baseSpeed * 0.45, dt, map);
      } else {
        this.state = 'idle';
      }
    }
  }

  moveWithCollision(dirX, dirY, speed, dt, map) {
    const nextX = this.x + dirX * speed * dt;
    const nextY = this.y + dirY * speed * dt;

    // X-Achse
    const tx1 = Math.floor((nextX + (dirX > 0 ? this.radius : -this.radius)) / TILE_SIZE);
    const ty1 = Math.floor(this.y / TILE_SIZE);
    if (!map.isSolid || !map.isSolid(tx1, ty1)) {
      this.x = nextX;
    }

    // Y-Achse
    const tx2 = Math.floor(this.x / TILE_SIZE);
    const ty2 = Math.floor((nextY + (dirY > 0 ? this.radius : -this.radius)) / TILE_SIZE);
    if (!map.isSolid || !map.isSolid(tx2, ty2)) {
      this.y = nextY;
    }
  }

  startTeleport(player, map, combatManager) {
    this.isTeleporting = true;
    this.teleportTimer = 0.32;
    this.teleportCooldown = 4.5 + Math.random() * 1.5;
    this.state = 'idle';

    if (combatManager) {
      combatManager.addHitSparks(this.x, this.y - 4, '#a855f7', 16, 90);
      combatManager.addFloatingText('🔮 SCHATTEN-SPRUNG!', this.x, this.y - 18, '#c084fc');
    }

    // Bestimme Zielposition nahe dem Spieler (flankierend / im Rücken)
    const angle = Math.random() * Math.PI * 2;
    const targetDist = 26 + Math.random() * 12;
    const destX = player.x + Math.cos(angle) * targetDist;
    const destY = player.y + Math.sin(angle) * targetDist;

    if (isFlyingEnemy(this.typeId)) {
      this.teleportDest = { x: destX, y: destY };
    } else {
      const tx = Math.floor(destX / TILE_SIZE);
      const ty = Math.floor(destY / TILE_SIZE);
      const safeTile = findNearestWalkableTile(map, tx, ty, 8);
      this.teleportDest = {
        x: safeTile.tx * TILE_SIZE + 8,
        y: safeTile.ty * TILE_SIZE + 8
      };
    }
  }

  completeTeleport(player, map, combatManager) {
    if (this.teleportDest) {
      this.x = this.teleportDest.x;
      this.y = this.teleportDest.y;
    }
    this.isTeleporting = false;
    this.teleportDest = null;
    this.cooldownTimer = 0.25;

    if (combatManager) {
      combatManager.addHitSparks(this.x, this.y - 4, '#7c3aed', 18, 120);
    }
  }

  startHookAttack(player, combatManager) {
    this.state = 'attack';
    this.telegraphTimer = 0.38;
    this.isHooking = true;
    this.hookCooldown = 5.5 + Math.random() * 1.5;

    if (combatManager) {
      combatManager.addFloatingText('⛓️ ENTERHAKEN!', this.x, this.y - 20, '#f59e0b');
      combatManager.addHitSparks(this.x, this.y - 6, '#f59e0b', 8);
    }
  }

  startAttack(player, combatManager) {
    this.state = 'attack';
    this.telegraphTimer = ENEMY_CONFIG.ATTACK_TELEGRAPH_TIME;

    // Optisches Telegraphing (Warnkreis / Funken)
    if (combatManager) {
      combatManager.addHitSparks(this.x, this.y - 4, '#fbbf24', 6);
    }

    // Vorbereitung für Wildschwein
    if (this.typeId === 'tusk_boar') {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      this.chargeDir = { x: dx / dist, y: dy / dist };
    }
  }

  executeAttack(player, combatManager, enemyManager) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    // =========================================================================
    // SPEZIFISCHE ATTACKEN ALLER 20 MODELLE
    // =========================================================================
    switch (this.typeId) {
      // 1. Waldläufer-Schütze: Moospfeil
      case 'moss_archer':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'moss_arrow',
            x: this.x,
            y: this.y - 2,
            dirX,
            dirY,
            speed: 240,
            damage: this.atk,
            color: '#22c55e',
            radius: 4,
            maxDist: 220
          });
        }
        break;

      // 2. Sporen-Spucker: Sporen-Ball mit Giftnebel
      case 'spore_spitter':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'spore_blob',
            x: this.x,
            y: this.y - 12,
            dirX,
            dirY,
            speed: 160,
            damage: this.atk,
            color: '#a855f7',
            radius: 6,
            maxDist: 180,
            spawnsPuddle: true
          });
        }
        break;

      // 3. Moos-Koloss: Erdbeben-Bodenstampfer (Schockwelle)
      case 'boulder_troll':
        if (combatManager) {
          combatManager.createShockwave(this.x, this.y + 8, 48, this.atk, '#15803d');
          enemyManager.game.camera.shake(4.5, 0.22);
        }
        break;

      // 4. Yeti-Wächter: Eiskeulen-Frostwelle
      case 'frost_giant':
        if (combatManager) {
          combatManager.createShockwave(this.x, this.y + 8, 55, this.atk, '#38bdf8', true); // Slows player
          enemyManager.game.camera.shake(5.0, 0.25);
        }
        break;

      // 5. Smaragd-Natter: Blitzschneller Giftzahn-Vorstoß
      case 'slithering_viper':
        if (dist <= 38) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
        }
        break;

      // 6. Dünen-Schlund: Lotus-Maw Einschnappen mit Sandfontäne
      case 'dune_maw':
        if (combatManager) {
          combatManager.createShockwave(this.x, this.y, 42, this.atk, '#d97706');
        }
        break;

      // 7. Laternen-Pyromant: Feuriger Lampion-Feuerball
      case 'pyromancer':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'fireball',
            x: this.x,
            y: this.y - 6,
            dirX,
            dirY,
            speed: 210,
            damage: this.atk,
            color: '#f97316',
            radius: 6,
            maxDist: 200
          });
        }
        break;

      // 8. Wolken-Astrologe: Fallende Sternschnuppe am Spielerort
      case 'star_astromancer':
        if (combatManager) {
          combatManager.spawnCelestialStrike(player.x, player.y, this.atk);
        }
        break;

      // 9. Tau-Tropfen Blob: Weicher Gelee-Platscher
      case 'green_slime':
        if (dist <= 30) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
        }
        break;

      // 10. Teer-Schlamm: Rußkugel-Schuss
      case 'tar_mire':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'ink_ball',
            x: this.x,
            y: this.y,
            dirX,
            dirY,
            speed: 180,
            damage: this.atk,
            color: '#0f172a',
            radius: 5,
            maxDist: 160
          });
        }
        break;

      // 11. Schattenwolf: Mononoke-Hechtsprung
      case 'dire_wolf':
        // Schneller Vorwärtssprung
        this.x += dirX * 22;
        this.y += dirY * 22;
        if (Math.hypot(player.x - this.x, player.y - this.y) <= 32) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
        }
        break;

      // 12. Kaiser-Skorpion: Lotus-Scherenschlag & Stachel
      case 'emperor_scorpion':
        if (dist <= 42) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
        }
        break;

      // 13. Grasland-Wildschwein: Sturm-Anlauf aktivieren
      case 'tusk_boar':
        this.isCharging = true;
        this.chargeTimer = 1.4;
        this.state = 'attack'; // bleibt während des Sturms im Angriffsmodus
        break;

      // 14. Höhlen-Krallenspinne: Verlangsamender Seidenfaden-Schuss
      case 'cave_weaver':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'web_shot',
            x: this.x,
            y: this.y,
            dirX,
            dirY,
            speed: 230,
            damage: this.atk,
            color: '#e2e8f0',
            radius: 6,
            maxDist: 180,
            slowsPlayer: true
          });
        }
        break;

      // 15. Leeren-Verschlinger: Kaonashi Sternenklingen-Schnitt
      case 'void_reaper':
        if (dist <= 48) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
          if (combatManager) {
            combatManager.addSlashEffect('slash1', player.x, player.y, Math.atan2(dirY, dirX), 24);
          }
        }
        break;

      // 16. Auge des Abgrunds: Kosmischer Starlight-Strahl
      case 'gazer_of_the_void':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'void_beam',
            x: this.x,
            y: this.y - 2,
            dirX,
            dirY,
            speed: 290,
            damage: this.atk,
            color: '#c084fc',
            radius: 5,
            maxDist: 240
          });
        }
        break;

      // 17. Schatten-Tentakel: Tempelglocken-Peitschenhieb
      case 'abyss_tentacle':
        if (dist <= 48) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
          if (combatManager) {
            combatManager.addHitSparks(this.x, this.y, '#f59e0b', 14);
          }
        }
        break;

      // 18. Origami-Krieger: Iaijutsu Mondsichel-Tuschehieb
      case 'cursed_knight':
        if (dist <= 46) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
          if (combatManager) {
            combatManager.addSlashEffect('thrust', player.x, player.y, Math.atan2(dirY, dirX), 28);
          }
        }
        break;

      // 19. Wolken-Harpyie: Sakura-Windböen-Fächer
      case 'sky_harpy':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'wind_petal',
            x: this.x,
            y: this.y,
            dirX,
            dirY,
            speed: 260,
            damage: this.atk,
            color: '#f472b6',
            radius: 7,
            maxDist: 210,
            knockbackPlayer: 220
          });
        }
        break;

      // 20. Magma-Funke: Calcifer Feuerwerk-Funken
      case 'lava_core':
        if (combatManager) {
          for (let s = -1; s <= 1; s++) {
            const spreadAngle = Math.atan2(dirY, dirX) + s * 0.3;
            combatManager.fireEnemyProjectile({
              type: 'fire_spark',
              x: this.x,
              y: this.y,
              dirX: Math.cos(spreadAngle),
              dirY: Math.sin(spreadAngle),
              speed: 220,
              damage: this.atk * 0.65,
              color: '#facc15',
              radius: 4,
              maxDist: 180
            });
          }
        }
        break;

      default:
        if (dist <= 35) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
        }
        break;
    }
  }

  hitPlayer(player, combatManager, damage, dir) {
    if (!player || player.isDead) return;

    // 1. Dash-Ausweich-Unverwundbarkeit (I-Frames)
    if (player.dash && player.dash.active) {
      if (combatManager) {
        combatManager.addFloatingText('💨 AUSGEWICHEN!', player.x, player.y - 16, '#67e8f9');
      }
      return;
    }

    // 2. Schild-Block
    if (player.shield && player.shield.active && player.shield.energy > 0) {
      player.shield.energy = Math.max(0, player.shield.energy - damage * 0.7);
      if (combatManager) {
        combatManager.addHitSparks(player.x, player.y, '#38bdf8', 16);
        combatManager.addFloatingText('🛡️ GEBLOCKT!', player.x, player.y - 18, '#38bdf8');
      }
      // Schild-Betäubung bei Bruch
      if (player.shield.energy <= 0) {
        player.shield.broken = true;
        player.shield.stunTimer = 1.2;
        player.shield.active = false;
        if (combatManager) {
          combatManager.addFloatingText('💥 SCHILD ZERBROCHEN!', player.x, player.y - 26, '#ef4444');
        }
      }
      return;
    }

    // 3. Voller Treffer auf Spieler
    player.takeDamage(damage, dir);
  }

  takeDamage(amount, knockbackAngle, knockbackForce, combatManager, isRange = false) {
    if (this.state === 'dead') return;

    this.hp -= amount;
    this.hitFlash = 0.25;

    // Wenn Leeren-Monster aus der Ferne getroffen wird -> Sofortiger Konter-Teleport zum Schützen!
    if (isRange && this.category === 'void' && combatManager?.game?.player && !this.isTeleporting) {
      const player = combatManager.game.player;
      const map = combatManager.game.currentMap || combatManager.game.map;
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      if (dist > 75) {
        this.startTeleport(player, map, combatManager);
      }
    }

    // Knockback (Kleine Blob-Gegner fliegen mit starkem Impuls wie Kegel weg!)
    if (this.baseSpeed > 0) {
      const kbMult = (this.typeId === 'green_slime' || this.scale < 0.6) ? 0.24 : 0.08;
      this.x += Math.cos(knockbackAngle) * (knockbackForce * kbMult);
      this.y += Math.sin(knockbackAngle) * (knockbackForce * kbMult);
    }

    // Treffer-Partikel
    if (combatManager) {
      combatManager.addHitSparks(this.x, this.y - 4, '#ef4444', 10);
      combatManager.addFloatingText(`-${Math.round(amount)}!`, this.x, this.y - 18, '#f87171');
    }

    // Tod prüfen
    if (this.hp <= 0) {
      this.die(combatManager);
    }
  }

  die(combatManager) {
    this.state = 'dead';
    this.hp = 0;

    // Poof / Konfetti-Partikelwolke
    if (combatManager) {
      combatManager.addDefeatPoof(this.x, this.y, this.category, this.dimension);

      // Spritzige Gelee-Partikel für Blobs
      if (this.typeId === 'green_slime') {
        for (let s = 0; s < 10; s++) {
          const pAng = Math.random() * Math.PI * 2;
          const sp = Math.random() * 50 + 15;
          combatManager.hitSparks.push({
            dimension: this.dimension,
            x: this.x,
            y: this.y,
            vx: Math.cos(pAng) * sp,
            vy: Math.sin(pAng) * sp - 15,
            color: Math.random() > 0.4 ? '#4ade80' : '#22c55e',
            size: Math.random() * 2.5 + 1.2,
            life: 0.35,
            maxLife: 0.35
          });
        }
      }
    }
  }

  render(ctx, t, night) {
    if (this.state === 'dead') return;

    const renderState = (this.state === 'walk' || this.isCharging)
      ? 'walk'
      : (this.state === 'attack' ? 'attack' : 'idle');

    const elevY = (this.elevation || 0) * ELEVATION_PIXEL_OFFSET;
    const drawX = Math.round(this.x);
    const drawY = Math.round(this.y - elevY);

    // Zeichne das prozedurale Ghibli-Papercraft-Wesen (skaliert nach Monster-Kategorie)
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.scale(this.scale, this.scale);
    this.def.render(ctx, 0, 0, this.animTime, renderState, Math.max(0, this.hitFlash));
    ctx.restore();

    // Alarm-Emote `!` über dem Kopf
    if (this.alertEmoteTimer > 0) {
      const emoteY = drawY - Math.round(24 * this.scale);
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(drawX, emoteY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', drawX, emoteY);
      ctx.restore();
    }

    // Lebensbalken über dem Kopf (nur wenn verletzt)
    if (this.hp < this.maxHp && this.hp > 0) {
      const barW = Math.round(24 * Math.max(0.8, Math.min(1.8, this.scale)));
      const barH = 3.5;
      const barX = drawX - barW / 2;
      const barY = drawY - Math.round(18 * this.scale);
      const hpPct = Math.max(0, this.hp / this.maxHp);

      ctx.save();
      // Hintergrund
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      // Füllung
      ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : (hpPct > 0.25 ? '#f59e0b' : '#ef4444');
      ctx.fillRect(barX, barY, barW * hpPct, barH);
      ctx.restore();
    }
  }
}

/**
 * EnemyManager - Koordiniert alle Spawns, Gruppen und Dimensionen
 */
class EnemyManager {
  constructor(game) {
    this.game = game;
    this.enemies = [];
    this.lootItems = [];
    this.xpOrbs = [];
    this.aiActive = true;

    this.initSpawns();
  }

  initSpawns() {
    this.enemies = [];
    this.lootItems = [];
    this.xpOrbs = [];

    // =========================================================================
    // OVERWORLD SPAWNS NACH BIOMEN & GRUPPEN
    // =========================================================================

    // 1. Grasland & Lichtungen (nahe Spawn 30, 45)
    // RIESIGER 28er-Massen-Schwarm winziger Tau-Tropfen Blobs (super klein, schwach, fliegen beim Hieb wie Kegel weg!)
    this.spawnPack('green_slime', 39 * TILE_SIZE, 46 * TILE_SIZE, 28, 55, DIMENSIONS.OVERWORLD, 'pack_slimes', {
      scale: 0.48, hp: 12, atk: 5, xpValue: 2
    });

    // 3er-Gruppe Waldhüter-Wildschweine (Tusk Boars)
    this.spawnPack('tusk_boar', 22 * TILE_SIZE, 38 * TILE_SIZE, 3, 30, DIMENSIONS.OVERWORLD, 'pack_boars', {
      scale: 0.88, hp: 55, atk: 18, xpValue: 10
    });

    // 3er-Gruppe Waldläufer-Schützen (Moss Archers) am Waldsaum
    this.spawnPack('moss_archer', 17 * TILE_SIZE, 28 * TILE_SIZE, 3, 28, DIMENSIONS.OVERWORLD, 'pack_archers', {
      scale: 0.95, hp: 65, atk: 18, xpValue: 15
    });

    // 2. Dichter Dunkelwald (Nordwesten)
    // 4er-Rudel Okami-Schattenwölfe (Dire Wolves)
    this.spawnPack('dire_wolf', 24 * TILE_SIZE, 15 * TILE_SIZE, 4, 32, DIMENSIONS.OVERWORLD, 'pack_wolves', {
      scale: 0.85, hp: 45, atk: 16, xpValue: 8
    });

    // 3. Wüste & Treibsand (Südwesten)
    // RIESIGER APEX-PREDATOR: Dünen-Schlund (Dune Maw)
    this.spawnEnemy('dune_maw', 25 * TILE_SIZE, 68 * TILE_SIZE, DIMENSIONS.OVERWORLD, null, {
      scale: 1.55, hp: 340, atk: 36, xpValue: 60
    });

    // 2er-Gruppe Kaiser-Skorpione (Emperor Scorpions)
    this.spawnPack('emperor_scorpion', 16 * TILE_SIZE, 74 * TILE_SIZE, 2, 32, DIMENSIONS.OVERWORLD, 'pack_scorpions', {
      scale: 1.05, hp: 90, atk: 24, xpValue: 20
    });

    // 4. Schnee & Eisberge (Nordosten)
    // RIESIGER KOLOSS: Yeti-Wächter (Frost Giant)
    this.spawnEnemy('frost_giant', 88 * TILE_SIZE, 16 * TILE_SIZE, DIMENSIONS.OVERWORLD, null, {
      scale: 1.65, hp: 1500, atk: 65, xpValue: 220, elevation: 1
    });

    // 5. Düsterer Sumpf (Südosten)
    // 3er-Gruppe Sporen-Spucker (Spore Spitters)
    this.spawnPack('spore_spitter', 68 * TILE_SIZE, 62 * TILE_SIZE, 3, 28, DIMENSIONS.OVERWORLD, 'pack_spores', {
      scale: 0.85, hp: 40, atk: 14, xpValue: 8
    });

    // 3er-Gruppe Smaragd-Nattern (Slithering Vipers) am Sumpfteich
    this.spawnPack('slithering_viper', 82 * TILE_SIZE, 60 * TILE_SIZE, 3, 30, DIMENSIONS.OVERWORLD, 'pack_vipers', {
      scale: 1.0, hp: 70, atk: 20, xpValue: 15
    });

    // 3er-Gruppe Teer-Schlamm Geister (Tar Mire)
    this.spawnPack('tar_mire', 95 * TILE_SIZE, 75 * TILE_SIZE, 3, 26, DIMENSIONS.OVERWORLD, 'pack_tar', {
      scale: 0.82, hp: 45, atk: 12, xpValue: 8
    });

    // 6. Felsgebirge & Bergpfade (Höhenebene +1, +2)
    // RIESIGER KOLOSS: Moos-Koloss (Boulder Troll) am Bergpass
    this.spawnEnemy('boulder_troll', 56 * TILE_SIZE, 28 * TILE_SIZE, DIMENSIONS.OVERWORLD, null, {
      scale: 1.60, hp: 1400, atk: 60, xpValue: 200, elevation: 1
    });

    // 2er-Wache Origami-Krieger (Cursed Paper Knights)
    this.spawnPack('cursed_knight', 70 * TILE_SIZE, 35 * TILE_SIZE, 2, 28, DIMENSIONS.OVERWORLD, 'pack_samurai', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25, elevation: 1
    });

    // 7. Die Leere / Void (Osten)
    // 2er-Patrouille Leeren-Verschlinger (Void Reapers)
    this.spawnPack('void_reaper', 108 * TILE_SIZE, 45 * TILE_SIZE, 2, 28, DIMENSIONS.OVERWORLD, 'pack_void_reapers', {
      scale: 1.15, hp: 540, atk: 55, xpValue: 90
    });

    // Zweite Patrouille Leeren-Verschlinger im Süden der Leere
    this.spawnPack('void_reaper', 116 * TILE_SIZE, 68 * TILE_SIZE, 2, 28, DIMENSIONS.OVERWORLD, 'pack_void_reapers_south', {
      scale: 1.15, hp: 540, atk: 55, xpValue: 90
    });

    // RIESIGER TITAN: Schwebende Mondqualle: Auge des Abgrunds (Gazer of the Void)
    this.spawnEnemy('gazer_of_the_void', 115 * TILE_SIZE, 55 * TILE_SIZE, DIMENSIONS.OVERWORLD, null, {
      scale: 1.55, hp: 1350, atk: 75, xpValue: 220
    });

    // Brunnen-Fallen: Schatten-Tentakel (Abyss Tentacles)
    this.spawnEnemy('abyss_tentacle', 118 * TILE_SIZE, 38 * TILE_SIZE, DIMENSIONS.OVERWORLD, null, {
      scale: 1.25, hp: 480, atk: 50, xpValue: 80
    });
    this.spawnEnemy('abyss_tentacle', 121 * TILE_SIZE, 62 * TILE_SIZE, DIMENSIONS.OVERWORLD, null, {
      scale: 1.25, hp: 480, atk: 50, xpValue: 80
    });

    // 8. Brand- & Vulkanzone (Zwischen Felsen und Wüste)
    // Laternen-Pyromant mit 5 Calcifer-Feuerdämonen (Schwarm kleiner Feuerfunken)
    this.spawnEnemy('pyromancer', 85 * TILE_SIZE, 36 * TILE_SIZE, DIMENSIONS.OVERWORLD, 'pack_fire', {
      scale: 1.10, hp: 130, atk: 30, xpValue: 35
    });
    this.spawnPack('lava_core', 85 * TILE_SIZE, 38 * TILE_SIZE, 5, 24, DIMENSIONS.OVERWORLD, 'pack_fire', {
      scale: 0.75, hp: 25, atk: 12, xpValue: 4
    });

    // =========================================================================
    // HÖHLEN-SPAWNS (CAVES DIMENSION)
    // =========================================================================
    // 6er-Schwarm Höhlen-Krallenspinnen (Cave Weavers) (klein, viele, fies)
    this.spawnPack('cave_weaver', 32 * TILE_SIZE, 26 * TILE_SIZE, 6, 36, DIMENSIONS.CAVES, 'pack_cave_spiders', {
      scale: 0.72, hp: 24, atk: 10, xpValue: 4
    });

    // =========================================================================
    // WOLKENREICH-SPAWNS (CLOUDS DIMENSION - MASSIVES HIMMELSREICH)
    // =========================================================================
    // Nördliche Reihe (Inseln A1 - A5)
    // A1 (20, 20): Harpyien-Schwarm
    this.spawnPack('sky_harpy', 20 * TILE_SIZE, 20 * TILE_SIZE, 3, 30, DIMENSIONS.CLOUDS, 'pack_harpies_a1', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // A2 (44, 20): Wolken-Astrologe mit Harpyien-Garde
    this.spawnEnemy('star_astromancer', 44 * TILE_SIZE, 20 * TILE_SIZE, DIMENSIONS.CLOUDS, 'pack_sky_a2', {
      scale: 1.15, hp: 480, atk: 60, xpValue: 85
    });
    this.spawnPack('sky_harpy', 45 * TILE_SIZE, 21 * TILE_SIZE, 2, 24, DIMENSIONS.CLOUDS, 'pack_sky_a2', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // A3 (65, 14 - Nordgipfel Schrein): Heiligtums-Wächter Astrologe + Harpyien
    this.spawnEnemy('star_astromancer', 65 * TILE_SIZE, 14 * TILE_SIZE, DIMENSIONS.CLOUDS, 'pack_sky_a3', {
      scale: 1.20, hp: 520, atk: 62, xpValue: 95
    });
    this.spawnPack('sky_harpy', 65 * TILE_SIZE, 16 * TILE_SIZE, 3, 26, DIMENSIONS.CLOUDS, 'pack_sky_a3', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // A4 (86, 20): Harpyien-Garde
    this.spawnPack('sky_harpy', 86 * TILE_SIZE, 20 * TILE_SIZE, 3, 28, DIMENSIONS.CLOUDS, 'pack_harpies_a4', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // A5 (110, 20): Fernost-Astrologe & Harpyien
    this.spawnEnemy('star_astromancer', 110 * TILE_SIZE, 20 * TILE_SIZE, DIMENSIONS.CLOUDS, 'pack_sky_a5', {
      scale: 1.15, hp: 480, atk: 60, xpValue: 85
    });
    this.spawnPack('sky_harpy', 110 * TILE_SIZE, 22 * TILE_SIZE, 2, 24, DIMENSIONS.CLOUDS, 'pack_sky_a5', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // Mittlere Reihe (Inseln B1 - B5)
    // B1 (18, 44): West-Horizont Harpyien
    this.spawnPack('sky_harpy', 18 * TILE_SIZE, 44 * TILE_SIZE, 3, 26, DIMENSIONS.CLOUDS, 'pack_harpies_b1', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // B2 (38, 44): Westzentrum Harpyien
    this.spawnPack('sky_harpy', 38 * TILE_SIZE, 44 * TILE_SIZE, 2, 24, DIMENSIONS.CLOUDS, 'pack_harpies_b2', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // B3 (65, 44 - Zentrales Wolkenheiligtum Schrein): Gross-Astrologe & Elite-Schwarm
    this.spawnEnemy('star_astromancer', 65 * TILE_SIZE, 43 * TILE_SIZE, DIMENSIONS.CLOUDS, 'pack_sky_central', {
      scale: 1.35, hp: 650, atk: 68, xpValue: 130
    });
    this.spawnPack('sky_harpy', 65 * TILE_SIZE, 46 * TILE_SIZE, 4, 32, DIMENSIONS.CLOUDS, 'pack_sky_central', {
      scale: 1.10, hp: 410, atk: 52, xpValue: 70
    });

    // B4 (90, 44): Ostzentrum Harpyien
    this.spawnPack('sky_harpy', 90 * TILE_SIZE, 44 * TILE_SIZE, 3, 26, DIMENSIONS.CLOUDS, 'pack_harpies_b4', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // B5 (112, 44 - Morgenwolke Schrein): Astrologe & Harpyien
    this.spawnEnemy('star_astromancer', 112 * TILE_SIZE, 44 * TILE_SIZE, DIMENSIONS.CLOUDS, 'pack_sky_b5', {
      scale: 1.15, hp: 480, atk: 60, xpValue: 85
    });
    this.spawnPack('sky_harpy', 112 * TILE_SIZE, 46 * TILE_SIZE, 2, 24, DIMENSIONS.CLOUDS, 'pack_sky_b5', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // Südliche Reihe (Inseln C1 - C5)
    // C1 (24, 70): Südwest Harpyien
    this.spawnPack('sky_harpy', 24 * TILE_SIZE, 70 * TILE_SIZE, 3, 26, DIMENSIONS.CLOUDS, 'pack_harpies_c1', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // C2 (44, 70): Astrologe & Harpyien
    this.spawnEnemy('star_astromancer', 44 * TILE_SIZE, 70 * TILE_SIZE, DIMENSIONS.CLOUDS, 'pack_sky_c2', {
      scale: 1.15, hp: 480, atk: 60, xpValue: 85
    });
    this.spawnPack('sky_harpy', 44 * TILE_SIZE, 72 * TILE_SIZE, 2, 24, DIMENSIONS.CLOUDS, 'pack_sky_c2', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // C3 (65, 74): Südgipfel Astrologe & Harpyien
    this.spawnEnemy('star_astromancer', 65 * TILE_SIZE, 74 * TILE_SIZE, DIMENSIONS.CLOUDS, 'pack_sky_c3', {
      scale: 1.15, hp: 480, atk: 60, xpValue: 85
    });
    this.spawnPack('sky_harpy', 65 * TILE_SIZE, 76 * TILE_SIZE, 3, 26, DIMENSIONS.CLOUDS, 'pack_sky_c3', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // C4 (90, 70): Harpyien
    this.spawnPack('sky_harpy', 90 * TILE_SIZE, 70 * TILE_SIZE, 3, 26, DIMENSIONS.CLOUDS, 'pack_harpies_c4', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });

    // C5 (112, 70): Fern-Südost Astrologe & Harpyien
    this.spawnEnemy('star_astromancer', 112 * TILE_SIZE, 70 * TILE_SIZE, DIMENSIONS.CLOUDS, 'pack_sky_c5', {
      scale: 1.15, hp: 480, atk: 60, xpValue: 85
    });
    this.spawnPack('sky_harpy', 112 * TILE_SIZE, 72 * TILE_SIZE, 2, 24, DIMENSIONS.CLOUDS, 'pack_sky_c5', {
      scale: 1.05, hp: 390, atk: 50, xpValue: 65
    });
  }

  getMapForDimension(dim) {
    if (!this.game) return null;
    if (dim === DIMENSIONS.CAVES) {
      return this.game.caves?.main_complex || null;
    }
    if (dim === DIMENSIONS.CLOUDS) {
      return this.game.cloudMap || null;
    }
    return this.game.overworldMap || this.game.map || null;
  }

  findWalkablePosition(typeId, rawX, rawY, dimension) {
    // Fliegende Gegner dürfen frei über Abgründen/Wasser schweben
    if (isFlyingEnemy(typeId)) {
      return { x: rawX, y: rawY };
    }

    const map = this.getMapForDimension(dimension);
    if (!map) return { x: rawX, y: rawY };

    const tx = Math.floor(rawX / TILE_SIZE);
    const ty = Math.floor(rawY / TILE_SIZE);

    // Finde nächste freie begehbare Land-Kachel (kein Wasser, kein Felsen, kein Baum, kein Abgrund)
    const safeTile = findNearestWalkableTile(map, tx, ty, 14);
    return {
      x: safeTile.tx * TILE_SIZE + 8 + (Math.random() - 0.5) * 4,
      y: safeTile.ty * TILE_SIZE + 8 + (Math.random() - 0.5) * 4
    };
  }

  spawnEnemy(typeId, x, y, dimension = DIMENSIONS.OVERWORLD, packId = null, options = {}) {
    const pos = this.findWalkablePosition(typeId, x, y, dimension);
    const enemy = new EnemyEntity(typeId, pos.x, pos.y, dimension, packId, options);
    this.enemies.push(enemy);
    return enemy;
  }

  spawnPack(typeId, centerX, centerY, count = 2, radius = 26, dimension = DIMENSIONS.OVERWORLD, packId = null, options = {}) {
    const pack = packId || `pack_${typeId}_${Math.random().toString(36).substr(2, 5)}`;
    const created = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = Math.random() * radius * 0.7 + radius * 0.3;
      const rawX = centerX + Math.cos(angle) * dist;
      const rawY = centerY + Math.sin(angle) * dist;
      const pos = this.findWalkablePosition(typeId, rawX, rawY, dimension);
      const enemy = new EnemyEntity(typeId, pos.x, pos.y, dimension, pack, options);
      this.enemies.push(enemy);
      created.push(enemy);
    }
    return created;
  }

  alertPack(packId, fromX, fromY) {
    if (!packId) return;
    this.enemies.forEach(e => {
      if (e.packId === packId && e.state !== 'dead') {
        const dist = Math.hypot(e.x - fromX, e.y - fromY);
        if (dist <= ENEMY_CONFIG.PACK_CALL_RADIUS) {
          e.alertEmoteTimer = 1.0;
          if (e.state === 'idle' || e.state === 'wander') {
            e.state = 'walk';
          }
        }
      }
    });
  }

  dropLoot(x, y, enemy = null) {
    const dimension = enemy?.dimension || this.game?.currentDimension || DIMENSIONS.OVERWORLD;

    // Drop-Raten: XP droppen immer (100%), Pfeile und Herzen nur manchmal / selten!
    const isBoss = enemy && (enemy.category === 'boss' || enemy.maxHp >= 100);
    const isRanged = enemy && (enemy.category === 'range' || enemy.typeId === 'moss_archer');

    // 1. Herz-Beere (❤️ +25 HP) - selten (ca. 8% bei normalen Gegnern, 25% bei Bossen)
    const heartChance = isBoss ? 0.25 : 0.08;
    if (Math.random() < heartChance) {
      this.lootItems.push({
        type: LOOT_TYPES.HEART,
        dimension,
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        life: 25.0,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    // 2. Köcher-Pfeile (🏹 +3 Pfeile) - selten (ca. 10% bei normalen Gegnern, 25% bei Bogenschützen/Bossen)
    const arrowChance = isBoss ? 0.25 : (isRanged ? 0.25 : 0.10);
    if (Math.random() < arrowChance) {
      this.lootItems.push({
        type: LOOT_TYPES.ARROW,
        dimension,
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        life: 25.0,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    // 3. Sternenstaub / Geist-Juwel (⭐ Glanzpartikel) - selten (ca. 5% bei normalen Gegnern, 35% bei Bossen)
    const gemChance = isBoss ? 0.35 : 0.05;
    if (Math.random() < gemChance) {
      this.lootItems.push({
        type: LOOT_TYPES.SPIRIT_GEM,
        dimension,
        x,
        y,
        life: 20.0,
        bobOffset: Math.random() * Math.PI * 2
      });
    }
  }

  spawnXp(x, y, totalXp, dimension = null) {
    const dim = dimension || this.game?.currentDimension || DIMENSIONS.OVERWORLD;

    // Gegner droppen IMMER Erfahrungspunkte (mindestens 1 EP)
    totalXp = Math.max(1, totalXp || 1);

    let orbCount = 1;
    if (totalXp >= 40) orbCount = Math.min(9, Math.max(5, Math.round(totalXp / 8)));
    else if (totalXp >= 12) orbCount = Math.min(4, Math.max(2, Math.round(totalXp / 5)));
    else if (totalXp >= 4) orbCount = 2;

    const baseVal = Math.max(1, Math.floor(totalXp / orbCount));
    let remainder = totalXp - (baseVal * orbCount);

    for (let i = 0; i < orbCount; i++) {
      const val = baseVal + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      const burstAng = (i / orbCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const burstSpeed = Math.random() * 45 + 20;

      this.xpOrbs.push({
        dimension: dim,
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(burstAng) * burstSpeed,
        vy: Math.sin(burstAng) * burstSpeed - 10,
        value: val,
        life: 45.0,
        magnetSpeed: 0,
        bobOffset: Math.random() * Math.PI * 2
      });
    }
  }

  update(dt, player, map, combatManager) {
    const curDim = this.game.currentDimension;

    // 1. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.dimension !== curDim) continue;

      enemy.update(dt, player, map, this, combatManager);

      // Bei Tod: XP droppt IMMER garantiert, Pfeile & Herzen nur selten
      if (enemy.state === 'dead') {
        this.dropLoot(enemy.x, enemy.y, enemy);
        this.spawnXp(enemy.x, enemy.y, Math.max(1, enemy.xpValue || 2), enemy.dimension);
        this.enemies.splice(i, 1);
      }
    }

    // 2. Update Loot Items (nur aktuelle Dimension)
    for (let i = this.lootItems.length - 1; i >= 0; i--) {
      const item = this.lootItems[i];
      if (item.dimension && curDim && item.dimension !== curDim) continue;

      item.life -= dt;
      if (item.life <= 0) {
        this.lootItems.splice(i, 1);
        continue;
      }

      // Pickup durch Spieler
      const dist = Math.hypot(player.x - item.x, player.y - item.y);
      if (dist <= 16 && !player.isDead) {
        if (item.type === LOOT_TYPES.HEART) {
          if (player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + 25);
            combatManager?.addFloatingText('❤️ +25 LEBEN', player.x, player.y - 20, '#4ade80');
            combatManager?.addHitSparks(player.x, player.y, '#4ade80', 12);
            this.lootItems.splice(i, 1);
          }
        } else if (item.type === LOOT_TYPES.ARROW) {
          if (player.ranged && player.ranged.ammo < 30) {
            player.ranged.ammo = Math.min(30, player.ranged.ammo + 3);
            combatManager?.addFloatingText('🏹 +3 PFEILE', player.x, player.y - 20, '#38bdf8');
            combatManager?.addHitSparks(player.x, player.y, '#38bdf8', 10);
            this.lootItems.splice(i, 1);
          }
        } else if (item.type === LOOT_TYPES.SPIRIT_GEM) {
          combatManager?.addFloatingText('⭐ GEIST-FUNKE', player.x, player.y - 20, '#fde047');
          combatManager?.addHitSparks(player.x, player.y, '#facc15', 14);
          this.lootItems.splice(i, 1);
        }
      }
    }

    // 3. Update XP Orbs (Magnetischer Flug zum Spieler, nur in aktueller Dimension)
    const MAGNET_RADIUS = 90;
    const PICKUP_RADIUS = 14;

    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const orb = this.xpOrbs[i];
      if (orb.dimension && curDim && orb.dimension !== curDim) continue;

      orb.life -= dt;
      if (orb.life <= 0) {
        this.xpOrbs.splice(i, 1);
        continue;
      }

      // Physics drag
      if (Math.abs(orb.vx) > 0.1 || Math.abs(orb.vy) > 0.1) {
        orb.x += orb.vx * dt;
        orb.y += orb.vy * dt;
        orb.vx *= Math.pow(0.08, dt);
        orb.vy *= Math.pow(0.08, dt);
      }

      if (!player || player.isDead) continue;

      const pTargetY = player.y - 8;
      const dx = player.x - orb.x;
      const dy = pTargetY - orb.y;
      const dist = Math.hypot(dx, dy);

      // Magnetischer Zug wenn Spieler in der Nähe ist
      if (dist <= MAGNET_RADIUS) {
        orb.magnetSpeed = Math.min(320, orb.magnetSpeed + 650 * dt);
        orb.x += (dx / (dist || 1)) * orb.magnetSpeed * dt;
        orb.y += (dy / (dist || 1)) * orb.magnetSpeed * dt;
      }

      // Einsammeln durch Spieler
      if (dist <= PICKUP_RADIUS) {
        player.addXp(orb.value);

        if (combatManager) {
          combatManager.addFloatingText(`+${orb.value} EP`, player.x + (Math.random() - 0.5) * 14, player.y - 18, '#4ade80', 0.55);
          for (let s = 0; s < 5; s++) {
            const spAng = Math.random() * Math.PI * 2;
            combatManager.hitSparks.push({
              x: orb.x,
              y: orb.y,
              vx: Math.cos(spAng) * (Math.random() * 30 + 10),
              vy: Math.sin(spAng) * (Math.random() * 30 + 10),
              color: '#4ade80',
              size: Math.random() * 2 + 1,
              life: 0.25,
              maxLife: 0.25
            });
          }
        }

        this.xpOrbs.splice(i, 1);
      }
    }
  }

  getActiveEnemies() {
    const curDim = this.game.currentDimension;
    return this.enemies.filter(e => e.dimension === curDim && e.state !== 'dead');
  }

  renderLoot(ctx, t) {
    const curDim = this.game?.currentDimension || DIMENSIONS.OVERWORLD;

    // 1. Render Normal Loot (nur in der Dimension wo es gedroppt wurde!)
    this.lootItems.forEach(item => {
      if (item.dimension && curDim && item.dimension !== curDim) return;

      const bob = Math.sin(t * 4 + item.bobOffset) * 2.5;

      ctx.save();
      ctx.translate(item.x, item.y + bob);

      // Papierschatten
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 4 - bob * 0.4, 5, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      if (item.type === LOOT_TYPES.HEART) {
        // Herz-Beere
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.bezierCurveTo(-4, -2, -4, -6, 0, -4);
        ctx.bezierCurveTo(4, -6, 4, -2, 0, 2);
        ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(-1.5, -4, 1, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === LOOT_TYPES.ARROW) {
        // Pfeil-Bündel
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-3, 3);
        ctx.lineTo(3, -3);
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-4, 2, 2, 2);
      } else if (item.type === LOOT_TYPES.SPIRIT_GEM) {
        // Stern-Juwel
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-0.8, -0.8, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // 2. Render Glowing Green XP Orbs (nur in der Dimension wo es gedroppt wurde!)
    this.xpOrbs.forEach(orb => {
      if (orb.dimension && curDim && orb.dimension !== curDim) return;

      const bob = Math.sin(t * 6 + orb.bobOffset) * 2;
      const ox = orb.x;
      const oy = orb.y + bob;

      ctx.save();
      // Weiche grüne Aura
      const pulse = Math.sin(t * 8 + orb.bobOffset) * 0.8 + 3.8;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.35)';
      ctx.beginPath();
      ctx.arc(ox, oy, pulse, 0, Math.PI * 2);
      ctx.fill();

      // Smaragdgrüner Körper
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Heller Glanzpunkt
      ctx.fillStyle = '#f0fdf4';
      ctx.beginPath();
      ctx.arc(ox - 0.6, oy - 0.6, 1.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }
}


// --- js/player.js ---

class Player {
  constructor(x, y, map, game = null) {
    this.map = map;
    this.game = game;
    this.spawnX = x * TILE_SIZE + TILE_SIZE / 2;
    this.spawnY = y * TILE_SIZE + TILE_SIZE / 2;
    this.x = this.spawnX;
    this.y = this.spawnY;

    this.elevation = 0;        // Aktuelle Ebene (-1, 0, 1, 2)
    this.visualElevation = 0;  // Sanft interpolierte optische Höhe für Rampen

    this.radius = PLAYER_CONFIG.RADIUS;
    this.baseSpeed = PLAYER_CONFIG.BASE_SPEED;
    this.currentSpeed = this.baseSpeed;
    this.speedMod = 1.0;

    this.direction = 'down';
    this.isMoving = false;
    this.isSprinting = false;

    this.isDead = false;
    this.deathTimer = 0;
    this.deathCount = 0;

    // Active Character Skin (15 selectable Dark Ghibli Papercraft heroes)
    this.skinId = (typeof getSelectedSkin === 'function') ? getSelectedSkin() : 'ren_twilight';
    this.name = (typeof getSelectedPlayerName === 'function') ? getSelectedPlayerName() : 'Ren';

    // Health & Damage States
    this.maxHp = PLAYER_CONFIG.MAX_HP || 100;
    this.hp = this.maxHp;
    this.hitFlash = 0;
    this.invulnTimer = 0;
    this.speedSlowTimer = 0;
    this.speedSlowFactor = 1.0;

    // Level & XP Progression
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 50;
    this.totalXpEarned = 0;
    this.lastDeathInfo = null;

    // Skills & Stat Progression (HP, Melee, Range, Shield)
    this.skills = {
      hp: 0,
      melee: 0,
      range: 0,
      shield: 0
    };
    this.skillPoints = 0;
    this.levelUpFlameTimer = 0;

    this.particles = [];

    // Combat & Ability State (Dash, Melee, Shield, Ranged)
    this.dash = {
      active: false,
      timer: 0,
      cooldown: 0,
      vx: 0,
      vy: 0,
      ghosts: []
    };

    this.melee = {
      comboStep: 0,       // 0 = idle, 1 = slash1, 2 = slash2, 3 = thrust
      comboTimer: 0,      // buffer window for next combo attack
      recoveryTimer: 0,   // pause after thrust (schnitt schnitt stich PAUSE)
      charging: false,
      chargeTimer: 0,
      isSpinning: false,
      spinTimer: 0,
      swingProgress: 1.0, // for visual sword rendering
      swingType: null     // 'slash1' | 'slash2' | 'thrust' | 'spin'
    };

    this.shield = {
      active: false,
      energy: COMBAT_CONFIG.SHIELD_MAX,
      maxEnergy: COMBAT_CONFIG.SHIELD_MAX,
      broken: false,
      stunTimer: 0,
      rechargeDelay: 0
    };

    this.ranged = {
      ammo: COMBAT_CONFIG.MAX_AMMO,
      charging: false,
      chargeTimer: 0
    };

    // Dimensions-Transitionen (Trampolin, Wolkenfall, Höhleneinstieg)
    this.transition = null; // { type, timer, duration, targetDim, targetX, targetY, switched }
    this.transitionCooldown = 0;
    this.lastTransitionTile = null; // Verhindert Re-Triggering solange man auf dem Zielfeld steht
    this.discoveredShrines = new Set();
    this.shrineMessage = null;
  }

  respawn() {
    this.transition = null;
    this.transitionCooldown = 0.5;
    this.lastTransitionTile = null;
    this.isDead = false;
    this.deathTimer = 0;
    this.hp = this.maxHp;
    this.hitFlash = 0;
    this.invulnTimer = 0;
    this.speedSlowTimer = 0;
    this.speedSlowFactor = 1.0;

    // Reset combat states
    this.dash.active = false;
    this.dash.cooldown = 0;
    this.dash.ghosts = [];
    this.melee.charging = false;
    this.melee.isSpinning = false;
    this.melee.comboStep = 0;
    this.melee.recoveryTimer = 0;
    this.shield.active = false;
    this.shield.broken = false;
    this.shield.stunTimer = 0;
    this.shield.rechargeDelay = 0;
    const maxShield = COMBAT_CONFIG.SHIELD_MAX + (this.skills?.shield || 0) * 15;
    this.shield.maxEnergy = maxShield;
    this.shield.energy = maxShield;
    this.ranged.charging = false;
    this.ranged.ammo = COMBAT_CONFIG.MAX_AMMO;

    if (this.game && this.game.currentDimension !== 'overworld') {
      this.game.switchDimension('overworld', this.spawnX, this.spawnY);
    } else {
      this.x = this.spawnX;
      this.y = this.spawnY;
      this.elevation = 0;
      this.visualElevation = 0;
    }
  }

  addXp(amount) {
    if (amount <= 0) return;
    this.xp += amount;
    this.totalXpEarned = (this.totalXpEarned || 0) + amount;

    let leveledUp = false;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.round(50 * Math.pow(1.35, this.level - 1));
      this.skillPoints = (this.skillPoints || 0) + 1;
      leveledUp = true;
    }

    if (leveledUp) {
      this.levelUpFlameTimer = 2.4;
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText(`🎉 LEVEL UP! Lv. ${this.level}`, this.x, this.y - 28, '#facc15', 1.0);
        for (let i = 0; i < 22; i++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = Math.random() * 60 + 20;
          this.game.combat.hitSparks.push({
            x: this.x,
            y: this.y - 10,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp - 20,
            color: Math.random() > 0.5 ? '#facc15' : '#4ade80',
            size: Math.random() * 2.5 + 1.5,
            life: 0.5,
            maxLife: 0.5
          });
        }
      }
    }
  }

  setName(name) {
    if (typeof name === 'string' && name.trim()) {
      this.name = name.trim().slice(0, 20);
      if (typeof setSelectedPlayerName === 'function') {
        setSelectedPlayerName(this.name);
      }
    }
  }

  setSkin(skinId) {
    if (CHARACTERS_MAP && CHARACTERS_MAP[skinId]) {
      this.skinId = skinId;
      if (typeof setSelectedSkin === 'function') {
        setSelectedSkin(skinId);
      }
    }
  }

  getTotalXpEarned() {
    if (this.totalXpEarned && this.totalXpEarned > 0) {
      return this.totalXpEarned;
    }
    let total = this.xp || 0;
    for (let lvl = 1; lvl < this.level; lvl++) {
      total += Math.round(50 * Math.pow(1.35, lvl - 1));
    }
    return total;
  }

  investSkillPoint(attribute) {
    if (!this.skills) {
      this.skills = { hp: 0, melee: 0, range: 0, shield: 0 };
    }
    if ((this.skillPoints || 0) <= 0) {
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('Keine Skillpunkte!', this.x, this.y - 20, '#ef4444', 0.8);
      }
      return false;
    }

    if (!['hp', 'melee', 'range', 'shield'].includes(attribute)) {
      return false;
    }

    this.skillPoints--;
    this.skills[attribute] = (this.skills[attribute] || 0) + 1;

    // Apply immediate attribute bonuses
    if (attribute === 'hp') {
      this.maxHp += 15;
      this.hp = Math.min(this.maxHp, this.hp + 15);
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('❤️ +15 Max HP!', this.x, this.y - 24, '#4ade80', 1.1);
        this.game.combat.addHitSparks(this.x, this.y - 10, '#4ade80', 14);
      }
    } else if (attribute === 'melee') {
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('⚔️ +4 Nahkampf-Schaden!', this.x, this.y - 24, '#f59e0b', 1.1);
        this.game.combat.addHitSparks(this.x, this.y - 10, '#f59e0b', 14);
      }
    } else if (attribute === 'range') {
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('🏹 Pfeil-Speed & Reichweite +!', this.x, this.y - 24, '#38bdf8', 1.1);
        this.game.combat.addHitSparks(this.x, this.y - 10, '#38bdf8', 14);
      }
    } else if (attribute === 'shield') {
      const baseMax = COMBAT_CONFIG.SHIELD_MAX || 100;
      this.shield.maxEnergy = baseMax + this.skills.shield * 15;
      this.shield.energy = Math.min(this.shield.maxEnergy, this.shield.energy + 15);
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('🛡️ +15 Schild-Energie!', this.x, this.y - 24, '#06b6d4', 1.1);
        this.game.combat.addHitSparks(this.x, this.y - 10, '#06b6d4', 14);
      }
    }

    return true;
  }

  // ==========================================================================
  // DIRECTION & VECTOR HELPERS (8-Directional Support)
  // ==========================================================================

  getFacingAngle() {
    switch (this.direction) {
      case 'right': return 0;
      case 'down-right': return Math.PI / 4;
      case 'down': return Math.PI / 2;
      case 'down-left': return 3 * Math.PI / 4;
      case 'left': return Math.PI;
      case 'up-left': return -3 * Math.PI / 4;
      case 'up': return -Math.PI / 2;
      case 'up-right': return -Math.PI / 4;
      default: return 0;
    }
  }

  getFacingVector() {
    switch (this.direction) {
      case 'right': return { x: 1, y: 0 };
      case 'down-right': return { x: Math.SQRT1_2, y: Math.SQRT1_2 };
      case 'down': return { x: 0, y: 1 };
      case 'down-left': return { x: -Math.SQRT1_2, y: Math.SQRT1_2 };
      case 'left': return { x: -1, y: 0 };
      case 'up-left': return { x: -Math.SQRT1_2, y: -Math.SQRT1_2 };
      case 'up': return { x: 0, y: -1 };
      case 'up-right': return { x: Math.SQRT1_2, y: -Math.SQRT1_2 };
      default: return { x: 1, y: 0 };
    }
  }

  setDirectionFromVector(dx, dy) {
    if (dx === 0 && dy === 0) return;
    const angle = Math.atan2(dy, dx);
    const step = Math.PI / 4;
    const offset = Math.PI / 8;
    let a = angle;
    if (a < 0) a += Math.PI * 2;
    const index = Math.floor((a + offset) / step) % 8;
    const dirs = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
    this.direction = dirs[index];
  }

  syncDirectionFromInput() {
    if (this.game && this.game.input) {
      let dx = 0;
      let dy = 0;
      const keys = this.game.input.keys || {};
      if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
      if (keys['ArrowDown'] || keys['KeyS']) dy += 1;
      if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
      if (this.game.input.joystick && this.game.input.joystick.active) {
        dx += this.game.input.joystick.x;
        dy += this.game.input.joystick.y;
      }
      if (dx !== 0 || dy !== 0) {
        this.setDirectionFromVector(dx, dy);
      }
    }
  }

  // ==========================================================================
  // COMBAT ACTIONS (Zelda & Smash Bros Mechanics)
  // ==========================================================================

  triggerDash() {
    if (this.dash.cooldown > 0 || this.dash.active || this.shield.active || this.shield.stunTimer > 0 || this.isDead || this.transition) {
      return;
    }

    this.syncDirectionFromInput();

    const vec = this.getFacingVector();
    const dirX = vec.x;
    const dirY = vec.y;

    const speed = COMBAT_CONFIG.DASH_SPEED;
    this.dash.active = true;
    this.dash.timer = COMBAT_CONFIG.DASH_DURATION;
    this.dash.cooldown = COMBAT_CONFIG.DASH_COOLDOWN;
    this.dash.vx = dirX * speed;
    this.dash.vy = dirY * speed;

    // Ground dust puff particles
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: this.x,
        y: this.y + 4,
        vx: -dirX * 30 + Math.cos(angle) * 15,
        vy: -dirY * 30 + Math.sin(angle) * 15,
        size: Math.random() * 2.5 + 1.2,
        color: 'rgba(240, 240, 245, 0.75)',
        life: 0.28,
        maxLife: 0.28
      });
    }
  }

  startMelee() {
    if (this.shield.active || this.shield.stunTimer > 0 || this.isDead || this.transition) return;
    if (this.melee.recoveryTimer > 0) return; // Pause nach Stich einhalten!
    if (this.melee.charging) return; // Bereits am Laden: chargeTimer nicht zurücksetzen!
    this.syncDirectionFromInput();
    this.melee.charging = true;
    this.melee.chargeTimer = 0;
  }

  releaseMelee() {
    if (!this.melee.charging) return;
    this.melee.charging = false;

    if (this.melee.chargeTimer >= COMBAT_CONFIG.SPIN_CHARGE_TIME) {
      // Execute 360 Spin Attack (Kreisel-Angriff)
      this.executeSpinAttack();
    } else {
      // Execute Next Combo Step (1 = Schnitt 1, 2 = Schnitt 2, 3 = Stich)
      this.executeComboStep();
    }
    this.melee.chargeTimer = 0;
  }

  executeSpinAttack() {
    this.melee.isSpinning = true;
    this.melee.spinTimer = 0.32;
    this.melee.swingProgress = 0;
    this.melee.swingType = 'spin';
    this.melee.comboStep = 0;
    this.melee.comboTimer = 0;
    this.melee.recoveryTimer = 0;

    const radius = COMBAT_CONFIG.SPIN_RADIUS;
    if (this.game && this.game.combat) {
      this.game.combat.addSlashEffect('spin', this.x, this.y - 6, 0, radius);
      this.game.combat.checkMeleeHits({
        type: 'spin',
        x: this.x,
        y: this.y - 6,
        radius,
        knockback: COMBAT_CONFIG.SPIN_KNOCKBACK
      });
    }
  }

  executeComboStep() {
    let nextStep = 1;
    if (this.melee.comboStep === 1 && this.melee.comboTimer > 0) {
      nextStep = 2;
    } else if (this.melee.comboStep === 2 && this.melee.comboTimer > 0) {
      nextStep = 3;
    }

    this.syncDirectionFromInput();
    this.melee.comboStep = nextStep;
    this.melee.swingProgress = 0;

    const angle = this.getFacingAngle();

    if (nextStep === 1) {
      this.melee.swingType = 'slash1';
      this.melee.comboTimer = COMBAT_CONFIG.COMBO_WINDOW;
      this.melee.recoveryTimer = 0;
      const radius = COMBAT_CONFIG.COMBO_SLASH_RADIUS;
      if (this.game && this.game.combat) {
        this.game.combat.addSlashEffect('slash1', this.x, this.y - 6, angle, radius);
        this.game.combat.checkMeleeHits({
          type: 'slash1',
          x: this.x,
          y: this.y - 6,
          angle,
          radius,
          knockback: 75
        });
      }
    } else if (nextStep === 2) {
      this.melee.swingType = 'slash2';
      this.melee.comboTimer = COMBAT_CONFIG.COMBO_WINDOW;
      this.melee.recoveryTimer = 0;
      const radius = COMBAT_CONFIG.COMBO_SLASH_RADIUS + 2;
      if (this.game && this.game.combat) {
        this.game.combat.addSlashEffect('slash2', this.x, this.y - 6, angle, radius);
        this.game.combat.checkMeleeHits({
          type: 'slash2',
          x: this.x,
          y: this.y - 6,
          angle,
          radius,
          knockback: 95
        });
      }
    } else if (nextStep === 3) {
      // Kräftiger Stich / Thrust mit spürbarem Vorstoß, Wucht & anschließender Pause
      this.melee.swingType = 'thrust';
      this.melee.comboTimer = 0; // Kombo-Kette endet mit dem Stich
      this.melee.recoveryTimer = COMBAT_CONFIG.COMBO_RECOVERY_PAUSE; // Pause nach Stich
      const range = COMBAT_CONFIG.COMBO_THRUST_RANGE;

      // Vorwärts-Lunge (kräftiger Ausfallschritt nach vorne)
      const lungeDist = COMBAT_CONFIG.COMBO_THRUST_LUNGE;
      const lx = Math.cos(angle) * lungeDist;
      const ly = Math.sin(angle) * lungeDist;
      if (!this.checkCollision(this.x + lx, this.y)) {
        this.x += lx;
      }
      if (!this.checkCollision(this.x, this.y + ly)) {
        this.y += ly;
      }

      // Staub- und Windpartikel nach hinten schleudern
      for (let i = 0; i < 7; i++) {
        const spread = (Math.random() - 0.5) * 0.8;
        const pSpeed = Math.random() * 50 + 30;
        this.particles.push({
          x: this.x - Math.cos(angle) * 8 + (Math.random() * 4 - 2),
          y: this.y + 4 + (Math.random() * 4 - 2),
          vx: -Math.cos(angle + spread) * pSpeed,
          vy: -Math.sin(angle + spread) * pSpeed,
          size: Math.random() * 2.5 + 1.2,
          color: 'rgba(254, 240, 138, 0.75)',
          life: 0.28,
          maxLife: 0.28
        });
      }

      if (this.game && this.game.combat) {
        this.game.combat.addSlashEffect('thrust', this.x, this.y - 6, angle, range);
        this.game.combat.checkMeleeHits({
          type: 'thrust',
          x: this.x,
          y: this.y - 6,
          angle,
          range,
          width: COMBAT_CONFIG.COMBO_THRUST_WIDTH,
          knockback: COMBAT_CONFIG.COMBO_THRUST_KNOCKBACK
        });
      }
    }
  }

  setShield(isDown) {
    if (this.shield.broken || this.shield.stunTimer > 0 || this.isDead || this.transition) {
      this.shield.active = false;
      return;
    }
    const wasActive = this.shield.active;
    this.shield.active = Boolean(isDown);
    if (this.shield.active) {
      this.melee.charging = false;
      this.ranged.charging = false;
      this.shield.rechargeDelay = COMBAT_CONFIG.SHIELD_RECHARGE_DELAY;
    } else if (wasActive && !this.shield.broken) {
      this.shield.rechargeDelay = COMBAT_CONFIG.SHIELD_RECHARGE_DELAY;
    }
  }

  startRanged() {
    if (this.shield.active || this.shield.stunTimer > 0 || this.isDead || this.transition) return;
    if (this.ranged.charging) return; // Bereits am Laden
    this.syncDirectionFromInput();
    if (this.ranged.ammo <= 0) {
      if (this.game && this.game.combat) {
        this.game.combat.floatingTexts.push({
          text: 'Keine Pfeile! (0/30) 🏹',
          x: this.x,
          y: this.y - 22,
          timer: 0,
          duration: 0.65,
          color: '#ef4444'
        });
      }
      return;
    }
    this.ranged.charging = true;
    this.ranged.chargeTimer = 0;
  }

  releaseRanged() {
    if (!this.ranged.charging) return;
    this.ranged.charging = false;

    if (this.ranged.ammo > 0) {
      this.syncDirectionFromInput();
      this.ranged.ammo--;
      const isCharged = (this.ranged.chargeTimer >= COMBAT_CONFIG.ARROW_CHARGE_TIME);

      const vec = this.getFacingVector();
      const dirX = vec.x;
      const dirY = vec.y;

      if (this.game && this.game.combat) {
        this.game.combat.fireArrow(this.x, this.y - 6, dirX, dirY, isCharged);
      }
    }
    this.ranged.chargeTimer = 0;
  }

  update(dt, input) {
    this.updateParticles(dt);

    // Green Level-Up Flame Aura Timer & Spark Emitters
    if (this.levelUpFlameTimer > 0) {
      this.levelUpFlameTimer -= dt;
      if (this.levelUpFlameTimer < 0) this.levelUpFlameTimer = 0;
      // Emit rising spirit embers from the feet
      if (Math.random() < 0.45) {
        const offX = (Math.random() - 0.5) * 18;
        this.particles.push({
          x: this.x + offX,
          y: this.y + (Math.random() * 6),
          vx: (Math.random() - 0.5) * 18,
          vy: -(Math.random() * 38 + 22),
          size: Math.random() * 2.8 + 1.2,
          color: Math.random() > 0.4 ? '#4ade80' : '#86efac',
          life: 0.55,
          maxLife: 0.55
        });
      }
    }

    if (this.transitionCooldown > 0) {
      this.transitionCooldown -= dt;
    }

    if (this.shrineMessage) {
      this.shrineMessage.timer -= dt;
      if (this.shrineMessage.timer <= 0) {
        this.shrineMessage = null;
      }
    }

    if (this.transition) {
      this.transition.timer += dt;
      const prog = this.transition.timer / this.transition.duration;
      if (prog >= 0.5 && !this.transition.switched) {
        this.transition.switched = true;
        if (this.game) {
          this.game.switchDimension(this.transition.targetDim, this.transition.targetX, this.transition.targetY);
        } else {
          this.x = this.transition.targetX;
          this.y = this.transition.targetY;
        }
      }
      if (prog >= 1.0) {
        // Sicherstellen, dass der Spieler nach Wolkensturz nicht auf Bäumen oder im Wasser landet
        if (this.transition.type === 'fall') {
          const safe = this.findSafeLandingPosition(this.map, this.x, this.y);
          this.x = safe.x;
          this.y = safe.y;
        }

        // Landing puff
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          this.particles.push({
            x: this.x,
            y: this.y + 4,
            vx: Math.cos(angle) * (Math.random() * 25 + 10),
            vy: Math.sin(angle) * (Math.random() * 10 + 5),
            size: Math.random() * 2.5 + 1,
            color: 'rgba(255, 255, 255, 0.7)',
            life: 0.35,
            maxLife: 0.35
          });
        }
        this.transition = null;
        this.transitionCooldown = 0.1;
        this.lastTransitionTile = {
          x: Math.floor(this.x / TILE_SIZE),
          y: Math.floor(this.y / TILE_SIZE)
        };
      }
      return;
    }

    if (this.isDead) {
      this.deathTimer += dt;
      if (this.deathTimer >= 1.2) {
        this.respawn();
      }
      return;
    }

    let dx = 0;
    let dy = 0;

    // Movement-Inputs
    if (input) {
      if (input.keys) {
        if (input.keys['ArrowUp'] || input.keys['KeyW']) dy -= 1;
        if (input.keys['ArrowDown'] || input.keys['KeyS']) dy += 1;
        if (input.keys['ArrowLeft'] || input.keys['KeyA']) dx -= 1;
        if (input.keys['ArrowRight'] || input.keys['KeyD']) dx += 1;
      }
      if (input.joystick && input.joystick.active) {
        dx = input.joystick.x;
        dy = input.joystick.y;
      }
    }

    // Direction & Vector aktualisieren
    if ((dx !== 0 || dy !== 0) && !this.dash.active && this.shield.stunTimer <= 0) {
      this.setDirectionFromVector(dx, dy);
    }

    // ==========================================================================
    // COMBAT INPUTS DISPATCH & TIMERS UPDATE
    // ==========================================================================

    if (input) {
      // Dash (Button A on Mobile/Touch, Space on PC)
      if ((input.keys && input.keys['Space']) || (input.buttons && input.buttons['A'])) {
        this.triggerDash();
      }

      // Melee (Button B on Mobile/Touch, KeyJ or Left Click on PC)
      const meleeDown = Boolean((input.keys && input.keys['KeyJ']) || input.mouseLeft || (input.buttons && input.buttons['B']));
      if (meleeDown && !this.melee.charging) {
        this.startMelee();
      } else if (!meleeDown && this.melee.charging) {
        this.releaseMelee();
      }

      // Shield (Button Y on Mobile/Touch, KeyK or Right Click on PC)
      const shieldDown = Boolean((input.keys && input.keys['KeyK']) || input.mouseRight || (input.buttons && input.buttons['Y']));
      this.setShield(shieldDown);

      // Ranged (Button X on Mobile/Touch, KeyL or KeyF on PC)
      const rangedDown = Boolean((input.keys && (input.keys['KeyL'] || input.keys['KeyF'])) || (input.buttons && input.buttons['X']));
      if (rangedDown && !this.ranged.charging) {
        this.startRanged();
      } else if (!rangedDown && this.ranged.charging) {
        this.releaseRanged();
      }

      this.isSprinting = Boolean(input.keys && (input.keys['ShiftLeft'] || input.keys['ShiftRight']));

      if (input.keys && input.keys['KeyR']) {
        this.respawn();
      }
    }

    // Slow-Debuff abklingen lassen
    if (this.speedSlowTimer > 0) {
      this.speedSlowTimer -= dt;
      if (this.speedSlowTimer <= 0) {
        this.speedSlowFactor = 1.0;
      }
    }

    // HitFlash & Invulnerability
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;

    // 1. Dash-Update
    if (this.dash.active) {
      this.dash.timer -= dt;
      const moveStepX = this.dash.vx * dt;
      const moveStepY = this.dash.vy * dt;

      if (!this.checkCollision(this.x + moveStepX, this.y)) {
        this.x += moveStepX;
      }
      if (!this.checkCollision(this.x, this.y + moveStepY)) {
        this.y += moveStepY;
      }

      // Ghost trail
      if (Math.random() < 0.6) {
        this.dash.ghosts.push({
          x: this.x,
          y: this.y,
          elevY: Math.round(this.visualElevation * ELEVATION_PIXEL_OFFSET),
          alpha: 1.0
        });
      }

      if (this.dash.timer <= 0) {
        this.dash.active = false;
      }
    }

    if (this.dash.cooldown > 0) {
      this.dash.cooldown -= dt;
    }

    // Dash Ghost fading
    for (let g = this.dash.ghosts.length - 1; g >= 0; g--) {
      this.dash.ghosts[g].alpha -= dt * 3.5;
      if (this.dash.ghosts[g].alpha <= 0) {
        this.dash.ghosts.splice(g, 1);
      }
    }

    // 2. Shield drain, broken state full recovery & passive recharge with 1s delay
    const maxShieldEnergy = this.shield.maxEnergy || (COMBAT_CONFIG.SHIELD_MAX + (this.skills?.shield || 0) * 15);
    const shieldSkill = this.skills?.shield || 0;
    const drainFactor = Math.max(0.6, 1.0 - shieldSkill * 0.06);

    if (this.shield.broken) {
      if (this.shield.stunTimer > 0) {
        this.shield.stunTimer -= dt;
      }
      // Erst wieder nutzbar, wenn es EINMAL VOLL (100%) aufgeladen ist!
      this.shield.energy = Math.min(maxShieldEnergy, this.shield.energy + COMBAT_CONFIG.SHIELD_RECHARGE_RATE * dt);
      if (this.shield.energy >= maxShieldEnergy) {
        this.shield.energy = maxShieldEnergy;
        this.shield.broken = false; // Voll aufgeladen und wieder einsatzbereit!
        this.shield.rechargeDelay = 0;
      }
    } else if (this.shield.active) {
      this.shield.rechargeDelay = COMBAT_CONFIG.SHIELD_RECHARGE_DELAY; // 1.0s Pause vorbereiten
      this.shield.energy = Math.max(0, this.shield.energy - COMBAT_CONFIG.SHIELD_DRAIN_RATE * drainFactor * dt);
      if (this.shield.energy <= 0) {
        // Shield Shatters!
        this.shield.broken = true;
        this.shield.active = false;
        this.shield.energy = 0;
        this.shield.stunTimer = COMBAT_CONFIG.SHIELD_STUN_TIME;

        // Shatter burst particles
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spSpeed = Math.random() * 100 + 35;
          this.particles.push({
            x: this.x,
            y: this.y - 10,
            vx: Math.cos(angle) * spSpeed,
            vy: Math.sin(angle) * spSpeed,
            size: Math.random() * 3.5 + 1.5,
            color: '#38bdf8',
            life: 0.5,
            maxLife: 0.5
          });
        }
      }
    } else {
      // Wenn nicht zerbrochen: erst nach 1 Sekunde Pause wieder aufladen
      if (this.shield.rechargeDelay > 0) {
        this.shield.rechargeDelay -= dt;
      } else {
        // Passive Shield Recharge nach 1s Pause
        this.shield.energy = Math.min(maxShieldEnergy, this.shield.energy + COMBAT_CONFIG.SHIELD_RECHARGE_RATE * dt);
      }
    }

    // 3. Melee combo, recovery & charge timers
    if (this.melee.recoveryTimer > 0) {
      this.melee.recoveryTimer -= dt;
      if (this.melee.recoveryTimer <= 0) {
        this.melee.recoveryTimer = 0;
        this.melee.comboStep = 0; // Kombo-Pause beendet, nächster Schlag ist Schnitt 1
      }
    } else if (this.melee.comboTimer > 0) {
      this.melee.comboTimer -= dt;
      if (this.melee.comboTimer <= 0) {
        this.melee.comboStep = 0;
      }
    }
    if (this.melee.charging) {
      this.melee.chargeTimer += dt;
      // Charging aura sparkles
      if (this.melee.chargeTimer >= COMBAT_CONFIG.SPIN_CHARGE_TIME && Math.random() < 0.4) {
        this.particles.push({
          x: this.x + (Math.random() - 0.5) * 16,
          y: this.y - 8 + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 20,
          vy: -Math.random() * 25 - 10,
          size: Math.random() * 2 + 1,
          color: '#67e8f9',
          life: 0.25,
          maxLife: 0.25
        });
      }
    }
    if (this.melee.isSpinning) {
      this.melee.spinTimer -= dt;
      if (this.melee.spinTimer <= 0) {
        this.melee.isSpinning = false;
      }
    }
    if (this.melee.swingProgress < 1.0) {
      const swingSpeed = (this.melee.swingType === 'thrust') ? 2.8 : 5.0;
      this.melee.swingProgress += dt * swingSpeed;
    }

    // 4. Ranged charge timer
    if (this.ranged.charging) {
      this.ranged.chargeTimer += dt;
      if (this.ranged.chargeTimer >= COMBAT_CONFIG.ARROW_CHARGE_TIME && Math.random() < 0.35) {
        this.particles.push({
          x: this.x + (Math.random() - 0.5) * 12,
          y: this.y - 12 + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 15,
          vy: -Math.random() * 20 - 5,
          size: Math.random() * 2 + 1,
          color: '#38bdf8',
          life: 0.2,
          maxLife: 0.2
        });
      }
    }

    // Dash movement override
    if (this.dash.active) {
      const dMoveX = this.dash.vx * dt;
      const dMoveY = this.dash.vy * dt;

      if (!this.checkCollision(this.x + dMoveX, this.y)) this.x += dMoveX;
      if (!this.checkCollision(this.x, this.y + dMoveY)) this.y += dMoveY;

      // Dust puff particles while dashing
      if (Math.random() < 0.6) {
        this.particles.push({
          x: this.x + (Math.random() * 6 - 3),
          y: this.y + 4,
          vx: -this.dash.vx * 0.15 + (Math.random() * 8 - 4),
          vy: -this.dash.vy * 0.15 + (Math.random() * 8 - 4),
          size: Math.random() * 2.2 + 1,
          color: 'rgba(255, 255, 255, 0.6)',
          life: 0.22,
          maxLife: 0.22
        });
      }

      // Record ghost afterimage
      if (Math.random() < 0.5) {
        this.dash.ghosts.push({
          x: this.x,
          y: this.y,
          elevY: Math.round(this.visualElevation * ELEVATION_PIXEL_OFFSET),
          direction: this.direction,
          alpha: 0.65
        });
      }
    }

    this.isMoving = dx !== 0 || dy !== 0;

    // Stun / Shield Movement adjustments
    if (this.shield.stunTimer > 0) {
      dx = 0;
      dy = 0;
      this.isMoving = false;
    }

    if (this.isMoving && !this.dash.active) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;

      this.setDirectionFromVector(dx, dy);

      const currentTileX = Math.floor(this.x / TILE_SIZE);
      const currentTileY = Math.floor(this.y / TILE_SIZE);
      this.speedMod = this.map.getSpeedModifier(currentTileX, currentTileY);

      let speed = this.baseSpeed * this.speedMod;
      if (input.joystick && input.joystick.active) {
        const joyMag = Math.min(1.0, Math.hypot(input.joystick.x, input.joystick.y));
        speed *= Math.max(0.45, joyMag);
      }
      if (this.isSprinting && this.speedMod > 0.5) {
        speed *= PLAYER_CONFIG.SPRINT_MULTIPLIER;
      }
      if (this.shield.active) {
        speed *= 0.38; // Guarding walk
      }
      if (this.melee.isSpinning) {
        speed *= 0.45;
      }
      if (this.speedSlowTimer > 0) {
        speed *= this.speedSlowFactor;
      }
      this.currentSpeed = speed;

      const moveX = dx * speed * dt;
      const moveY = dy * speed * dt;

      // Check previous tile before movement
      const prevTileX = Math.floor(this.x / TILE_SIZE);
      const prevTileY = Math.floor(this.y / TILE_SIZE);
      const prevElev = this.map.getElevation(prevTileX, prevTileY);

      // Sliding collision
      if (!this.checkCollision(this.x + moveX, this.y)) {
        this.x += moveX;
      }
      if (!this.checkCollision(this.x, this.y + moveY)) {
        this.y += moveY;
      }

      // Ledge hop boost: when stepping down an elevation tier, advance player 6px
      // in movement direction so they land cleanly on lower ground without clipping cliff walls
      const newTileX = Math.floor(this.x / TILE_SIZE);
      const newTileY = Math.floor(this.y / TILE_SIZE);
      const newElev = this.map.getElevation(newTileX, newTileY);

      if (newElev < prevElev) {
        if (dx !== 0) {
          const hopX = this.x + Math.sign(dx) * 6;
          if (!this.checkCollision(hopX, this.y)) {
            this.x = hopX;
          }
        }
        if (dy !== 0) {
          const hopY = this.y + Math.sign(dy) * 6;
          if (!this.checkCollision(this.x, hopY)) {
            this.y = hopY;
          }
        }
      }

      // Footstep particles
      if (Math.random() < 0.3) {
        const tile = this.map.getGroundTile(currentTileX, currentTileY);
        let pColor = 'rgba(255,255,255,0.3)';
        if (tile === TILES.SAND || tile === TILES.QUICKSAND) pColor = 'rgba(215, 175, 95, 0.55)';
        if (tile === TILES.SNOW) pColor = 'rgba(235, 245, 255, 0.65)';
        if (tile === TILES.VOID_GROUND) pColor = 'rgba(185, 60, 245, 0.55)';

        this.particles.push({
          x: this.x + (Math.random() * 6 - 3),
          y: this.y + 6,
          vx: -dx * 12 + (Math.random() * 8 - 4),
          vy: -dy * 12 + (Math.random() * 8 - 4),
          size: Math.random() * 2 + 1,
          color: pColor,
          life: 0.3,
          maxLife: 0.3
        });
      }
    } else {
      this.currentSpeed = 0;
    }

    // Check deadly abyss & update elevation
    const curTileX = Math.floor(this.x / TILE_SIZE);
    const curTileY = Math.floor(this.y / TILE_SIZE);

    // Sobald sich der Spieler vom Lande-Kachel wegbewegt, wird der Schutz aufgehoben
    if (this.lastTransitionTile && (this.lastTransitionTile.x !== curTileX || this.lastTransitionTile.y !== curTileY)) {
      this.lastTransitionTile = null;
    }

    if (this.map.isDeadly(curTileX, curTileY)) {
      this.die('void');
    }

    const tileElev = this.map.getElevation(curTileX, curTileY);
    const tileRamp = this.map.getRamp(curTileX, curTileY);
    this.elevation = tileElev;

    // Sanfte optische Höhenanpassung auf Rampen
    if (tileRamp !== RAMPS.NONE) {
      let rampProgress = 0.5;
      const subX = (this.x % TILE_SIZE) / TILE_SIZE;
      const subY = (this.y % TILE_SIZE) / TILE_SIZE;

      if (tileRamp === RAMPS.UP_NORTH) {
        rampProgress = 1.0 - subY;
      } else if (tileRamp === RAMPS.UP_SOUTH) {
        rampProgress = subY;
      } else if (tileRamp === RAMPS.UP_WEST) {
        rampProgress = 1.0 - subX;
      } else if (tileRamp === RAMPS.UP_EAST) {
        rampProgress = subX;
      }

      const targetVis = tileElev + Math.max(0, Math.min(1, rampProgress));
      this.visualElevation += (targetVis - this.visualElevation) * Math.min(1, dt * 15);
    } else {
      this.visualElevation += (tileElev - this.visualElevation) * Math.min(1, dt * 15);
    }

    // Seltene Schreine prüfen (immer prüfen, auch im Stehen)
    this.checkShrines(curTileX, curTileY);

    // Dimension-Trigger prüfen (nur wenn keine Transition läuft, Cooldown vorbei ist und nicht auf Lande-Kachel)
    const isLandingTile = Boolean(this.lastTransitionTile && this.lastTransitionTile.x === curTileX && this.lastTransitionTile.y === curTileY);

    if (!this.transition && this.transitionCooldown <= 0 && !isLandingTile) {
      // 1. Trampolin auf der Oberwelt -> Bounced in die Wolkenwelt
      if (this.game && this.game.currentDimension === 'overworld') {
        if (this.map.isTrampoline && this.map.isTrampoline(curTileX, curTileY)) {
          this.startTransition('trampoline', 'clouds', this.x, this.y, 0.8);
        } else if (this.map.getHoleEntrance) {
          const entrance = this.map.getHoleEntrance(curTileX, curTileY);
          if (entrance) {
            this.startTransition('cave_enter', entrance.targetCave, entrance.targetX * TILE_SIZE + 8, entrance.targetY * TILE_SIZE + 8, 0.65);
          }
        }
      }
      // 2. Freier Himmel in der Wolkenwelt -> Sturzflug zurück zur Oberwelt
      else if (this.game && this.game.currentDimension === 'clouds') {
        const gTile = this.map.getGroundTile(curTileX, curTileY);
        if (gTile === TILES.SKY_ABYSS) {
          this.startTransition('fall', 'overworld', this.x, this.y, 0.85);
        }
      }
      // 3. Lichtschacht oder Leiter in Höhlen
      else if (this.game && this.game.currentDimension === 'caves') {
        if (this.map.exits) {
          const exit = this.map.exits.find(e => e.x === curTileX && e.y === curTileY);
          if (exit) {
            const tType = exit.targetDim === 'overworld' ? 'cave_exit' : 'ladder';
            this.startTransition(tType, exit.targetDim, exit.targetX * TILE_SIZE + 8, exit.targetY * TILE_SIZE + 8, 0.65);
          }
        }
      }
    }
  }

  findSafeLandingPosition(map, startX, startY) {
    if (!map) return { x: startX, y: startY };

    const isSafe = (x, y) => {
      const tx = Math.floor(x / TILE_SIZE);
      const ty = Math.floor(y / TILE_SIZE);
      if (tx < 2 || tx >= map.width - 2 || ty < 2 || ty >= map.height - 2) return false;
      if (map.isDeadly && map.isDeadly(tx, ty)) return false;

      const g = map.getGroundTile(tx, ty);
      if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE ||
          g === TILES.QUICKSAND || g === TILES.SKY_ABYSS) {
        return false;
      }
      if (map.getSpeedModifier && map.getSpeedModifier(tx, ty) <= 0.05) return false;

      if (map.isSolid && map.isSolid(tx, ty)) return false;
      if (map.checkTreeCollision && map.checkTreeCollision(x, y, this.radius || 6)) return false;

      return true;
    };

    // Wenn Zielposition bereits vollkommen frei und sicher ist: direkt nutzen!
    if (isSafe(startX, startY)) {
      return { x: startX, y: startY };
    }

    // Andernfalls: Spiralförmig nach außen suchen, um die nächste freie Kachel daneben zu finden
    const startTileX = Math.floor(startX / TILE_SIZE);
    const startTileY = Math.floor(startY / TILE_SIZE);

    for (let r = 1; r <= 20; r++) {
      const candidates = [];
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = startTileX + dx;
          const ty = startTileY + dy;
          const cx = tx * TILE_SIZE + 8;
          const cy = ty * TILE_SIZE + 8;
          if (isSafe(cx, cy)) {
            candidates.push({ x: cx, y: cy, dist: Math.hypot(cx - startX, cy - startY) });
          }
        }
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.dist - b.dist);
        return { x: candidates[0].x, y: candidates[0].y };
      }
    }

    // Fallback auf Spawn-Punkt
    if (map.spawnPoint) {
      return { x: map.spawnPoint.x * TILE_SIZE + 8, y: map.spawnPoint.y * TILE_SIZE + 8 };
    }
    return { x: startX, y: startY };
  }

  startTransition(type, targetDim, targetX, targetY, duration = 0.8) {
    if (this.transition) return;

    let destX = targetX;
    let destY = targetY;

    if (type === 'fall' && targetDim === 'overworld') {
      const targetMap = (this.game && this.game.overworldMap) ? this.game.overworldMap : this.map;
      const safe = this.findSafeLandingPosition(targetMap, targetX, targetY);
      destX = safe.x;
      destY = safe.y;
    }

    this.transition = {
      type,
      timer: 0,
      duration,
      startX: this.x,
      startY: this.y,
      targetDim,
      targetX: destX,
      targetY: destY,
      switched: false
    };

    if (type === 'trampoline') {
      for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 45 + 25;
        this.particles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40,
          size: Math.random() * 3.5 + 2,
          color: Math.random() > 0.5 ? '#f472b6' : '#fcd34d',
          life: 0.65,
          maxLife: 0.65
        });
      }
    } else if (type === 'fall') {
      for (let i = 0; i < 25; i++) {
        this.particles.push({
          x: this.x + (Math.random() * 20 - 10),
          y: this.y + (Math.random() * 20 - 10),
          vx: (Math.random() - 0.5) * 20,
          vy: Math.random() * 50 + 40,
          size: Math.random() * 3 + 1.5,
          color: 'rgba(255, 255, 255, 0.85)',
          life: 0.5,
          maxLife: 0.5
        });
      }
    }
  }

  checkShrines(tx, ty) {
    if (!this.map.objects) return;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = tx + dx;
        const ny = ty + dy;
        if (nx >= 0 && nx < this.map.width && ny >= 0 && ny < this.map.height) {
          if (this.map.objects[ny][nx] === OBJECTS.SHRINE) {
            const dim = this.game ? (this.game.activeSubCave || this.game.currentDimension) : 'world';
            const shrineKey = `${dim}_${nx}_${ny}`;
            if (!this.discoveredShrines.has(shrineKey)) {
              this.discoveredShrines.add(shrineKey);
              let sName = 'Uralter Geister-Schrein';
              if (this.map.shrines) {
                const found = this.map.shrines.find(s => s.x === nx && s.y === ny);
                if (found) sName = found.name;
              }
              this.shrineMessage = {
                title: '⛩️ SCHREIN ENTDECKT!',
                name: sName,
                total: this.discoveredShrines.size,
                timer: 4.5
              };
              for (let i = 0; i < 35; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 45 + 15;
                this.particles.push({
                  x: nx * TILE_SIZE + 8,
                  y: ny * TILE_SIZE + 8,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  size: Math.random() * 3 + 1.5,
                  color: Math.random() > 0.4 ? '#fcd34d' : '#f472b6',
                  life: 0.9,
                  maxLife: 0.9
                });
              }
            }
          }
        }
      }
    }
  }

  takeDamage(amount, dir = null) {
    if (this.isDead || this.invulnTimer > 0 || this.transition) return false;

    // 1. Dash-Ausweich-Unverwundbarkeit (I-Frames)
    if (this.dash && this.dash.active) {
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('💨 AUSGEWICHEN!', this.x, this.y - 18, '#67e8f9');
      }
      return 'dodged';
    }

    // 2. Schild-Block
    if (this.shield && this.shield.active && this.shield.energy > 0) {
      const shieldSkill = this.skills?.shield || 0;
      const blockEfficiency = Math.max(0.45, 0.85 - shieldSkill * 0.05);
      this.shield.energy = Math.max(0, this.shield.energy - amount * blockEfficiency);
      this.shield.rechargeDelay = COMBAT_CONFIG.SHIELD_RECHARGE_DELAY;
      if (this.game && this.game.combat) {
        this.game.combat.addHitSparks(this.x, this.y, '#38bdf8', 14);
        this.game.combat.addFloatingText('🛡️ GEBLOCKT!', this.x, this.y - 18, '#38bdf8');
      }
      if (this.shield.energy <= 0) {
        this.shield.broken = true;
        this.shield.stunTimer = COMBAT_CONFIG.SHIELD_BREAK_STUN || 1.2;
        this.shield.active = false;
        if (this.game && this.game.combat) {
          this.game.combat.addFloatingText('💥 SCHILD ZERBROCHEN!', this.x, this.y - 26, '#ef4444');
        }
      }
      return 'blocked';
    }

    // 3. Voller Treffer
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.3;
    this.invulnTimer = 0.45;

    // Knockback
    if (dir) {
      const kx = dir.x || 0;
      const ky = dir.y || 0;
      const dist = Math.hypot(kx, ky) || 1;
      this.x += (kx / dist) * 14;
      this.y += (ky / dist) * 14;
    }

    if (this.game && this.game.combat) {
      this.game.combat.addHitSparks(this.x, this.y - 8, '#ef4444', 16);
      this.game.combat.addFloatingText(`-${Math.round(amount)} HP`, this.x, this.y - 22, '#ef4444');
    }

    if (this.game && this.game.camera) {
      this.game.camera.shake(6, 0.22);
    }

    if (this.hp <= 0) {
      this.die('enemy');
    }

    return 'hit';
  }

  applySlow(factor = 0.45, duration = 2.0) {
    this.speedSlowFactor = factor;
    this.speedSlowTimer = duration;
    if (this.game && this.game.combat) {
      this.game.combat.addFloatingText('❄️ VERLANGSAMT', this.x, this.y - 22, '#38bdf8');
    }
  }

  die(cause = 'void') {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTimer = 0;
    this.deathCount++;

    // 1. Calculate and drop 10% of total earned XP at death position (on safe ground if void)
    const totalEarned = this.getTotalXpEarned();
    const dropXp = Math.max(0, Math.round(totalEarned * 0.10));
    const currentDim = this.game?.currentDimension || 'overworld';

    let dropX = this.x;
    let dropY = this.y;
    const curTileX = Math.floor(this.x / TILE_SIZE);
    const curTileY = Math.floor(this.y / TILE_SIZE);
    if (cause === 'void' || (this.map && typeof this.map.isDeadly === 'function' && this.map.isDeadly(curTileX, curTileY))) {
      const safePos = this.findSafeLandingPosition(this.map, this.x, this.y);
      dropX = safePos.x;
      dropY = safePos.y;
    }

    if (this.game && this.game.enemyManager && dropXp > 0) {
      this.game.enemyManager.spawnXp(dropX, dropY, dropXp, currentDim);
    }

    // 2. Exact Level Halving (e.g. 4.70 -> 2.35)
    const oldExactLevel = this.level + (this.xpToNext > 0 ? (this.xp / this.xpToNext) : 0);
    const newExactLevel = Math.max(1.0, oldExactLevel / 2);

    this.level = Math.floor(newExactLevel);
    const fraction = newExactLevel - this.level;
    this.xpToNext = Math.round(50 * Math.pow(1.35, this.level - 1));
    this.xp = Math.round(fraction * this.xpToNext);
    this.totalXpEarned = this.getTotalXpEarned();

    // 3. Even Skill Reduction matching new level
    const targetTotalPoints = Math.max(0, this.level - 1);
    const currentTotalPoints = (this.skills.hp + this.skills.melee + this.skills.range + this.skills.shield) + (this.skillPoints || 0);
    let pointsToRemove = Math.max(0, currentTotalPoints - targetTotalPoints);
    let skillsReducedCount = 0;

    if (pointsToRemove > 0) {
      // First, deduct from unspent skill points
      const deductFromUnspent = Math.min(this.skillPoints || 0, pointsToRemove);
      this.skillPoints -= deductFromUnspent;
      pointsToRemove -= deductFromUnspent;

      // Second, evenly reduce invested skills (round-robin from highest invested skills)
      while (pointsToRemove > 0) {
        const maxVal = Math.max(this.skills.hp, this.skills.melee, this.skills.range, this.skills.shield);
        if (maxVal <= 0) break;

        const candidateSkills = ['hp', 'melee', 'range', 'shield'].filter(s => this.skills[s] === maxVal);
        for (const s of candidateSkills) {
          if (pointsToRemove <= 0) break;
          this.skills[s]--;
          skillsReducedCount++;
          pointsToRemove--;
        }
      }

      // Recalculate stats based on updated skills
      this.maxHp = 100 + (this.skills.hp || 0) * 15;
      this.hp = Math.min(this.hp, this.maxHp);
      const maxShield = COMBAT_CONFIG.SHIELD_MAX + (this.skills.shield || 0) * 15;
      this.shield.maxEnergy = maxShield;
      this.shield.energy = Math.min(this.shield.energy, this.shield.maxEnergy);
    }

    // 4. Record death info for UI overlay
    this.lastDeathInfo = {
      cause,
      oldExactLevel,
      newExactLevel,
      dropXp,
      skillsReducedCount
    };

    if (this.game && this.game.combat) {
      this.game.combat.addFloatingText(`💀 Level halbiert: ${oldExactLevel.toFixed(2)} → ${newExactLevel.toFixed(2)}`, this.x, this.y - 28, '#ef4444', 1.4);
      if (dropXp > 0) {
        this.game.combat.addFloatingText(`✨ -${dropXp} EP verloren`, this.x, this.y - 44, '#facc15', 1.4);
      }
    }

    // Death particle burst
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 35;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * dist,
        vy: Math.sin(angle) * dist,
        size: Math.random() * 3 + 1.5,
        color: Math.random() > 0.5 ? '#d946ef' : '#8b24d6',
        life: 0.7,
        maxLife: 0.7
      });
    }
  }

  checkCollision(targetX, targetY) {
    const r = this.radius;
    const curTileX = Math.floor(this.x / TILE_SIZE);
    const curTileY = Math.floor(this.y / TILE_SIZE);

    const moveDx = targetX - this.x;
    const moveDy = targetY - this.y;

    // Nur Punkte auf der vorderen Kante (Leading Edge) in Bewegungsrichtung prüfen.
    // Verhindert das Hängenbleiben an Kanten, von denen man sich wegbewegt.
    let checkPoints = [];
    if (moveDx > 0) {
      checkPoints = [
        { x: targetX + r, y: targetY - r * 0.7 },
        { x: targetX + r, y: targetY },
        { x: targetX + r, y: targetY + r * 0.7 }
      ];
    } else if (moveDx < 0) {
      checkPoints = [
        { x: targetX - r, y: targetY - r * 0.7 },
        { x: targetX - r, y: targetY },
        { x: targetX - r, y: targetY + r * 0.7 }
      ];
    } else if (moveDy > 0) {
      checkPoints = [
        { x: targetX - r * 0.7, y: targetY + r },
        { x: targetX, y: targetY + r },
        { x: targetX + r * 0.7, y: targetY + r }
      ];
    } else if (moveDy < 0) {
      checkPoints = [
        { x: targetX - r * 0.7, y: targetY - r },
        { x: targetX, y: targetY - r },
        { x: targetX + r * 0.7, y: targetY - r }
      ];
    } else {
      checkPoints = [
        { x: targetX - r, y: targetY - r },
        { x: targetX + r, y: targetY - r },
        { x: targetX - r, y: targetY + r },
        { x: targetX + r, y: targetY + r }
      ];
    }

    for (const pt of checkPoints) {
      const tx = Math.floor(pt.x / TILE_SIZE);
      const ty = Math.floor(pt.y / TILE_SIZE);
      if (this.map.isSolid(tx, ty)) {
        return true;
      }
      // Gleiche Kachel wie Spielerzentrum -> kein Höhenwechsel
      if (tx === curTileX && ty === curTileY) continue;

      // Kantenkollision prüfen
      if (!this.map.isElevationPassable(curTileX, curTileY, tx, ty)) {
        return true;
      }
    }

    // Check tree trunk collision
    if (this.map.checkTreeCollision(targetX, targetY, r)) {
      return true;
    }

    return false;
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  renderParticles(ctx) {
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  render(ctx, spriteManager, animTime = 0, nightFactor = 0) {
    this.renderParticles(ctx);

    const px = Math.round(this.x);
    const elevY = Math.round(this.visualElevation * ELEVATION_PIXEL_OFFSET);

    // Transitions-Höhe & Effekte (Trampolin-Sprung, Freifall, Höhleneinstieg)
    let transOffset = 0;
    let transScale = 1.0;
    let transAlpha = 1.0;

    if (this.transition) {
      const prog = this.transition.timer / this.transition.duration;
      if (this.transition.type === 'trampoline') {
        transOffset = Math.sin(prog * Math.PI) * 45;
        transScale = 1.0 + Math.sin(prog * Math.PI) * 0.35;

        // Aufsteigende Wind- & Glitzerstreifen
        ctx.save();
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.75)';
        ctx.lineWidth = 1.8;
        for (let l = 0; l < 5; l++) {
          const lx = px - 10 + l * 5;
          ctx.beginPath();
          ctx.moveTo(lx, Math.round(this.y) - elevY - transOffset + 8);
          ctx.lineTo(lx, Math.round(this.y) - elevY - transOffset + 22);
          ctx.stroke();
        }
        ctx.restore();
      } else if (this.transition.type === 'fall') {
        if (prog < 0.5) {
          transOffset = prog * 25;
          transScale = 1.0 - prog * 0.4;
          transAlpha = 1.0 - prog * 0.4;
        } else {
          transOffset = (1.0 - prog) * 35;
          transScale = 0.8 + (prog - 0.5) * 0.4;
          transAlpha = 0.6 + (prog - 0.5) * 0.8;
        }

        // Nach unten ziehende Sturzflug-Linien
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.0;
        for (let l = 0; l < 5; l++) {
          const lx = px - 10 + l * 5;
          ctx.beginPath();
          ctx.moveTo(lx, Math.round(this.y) - elevY - transOffset - 20);
          ctx.lineTo(lx, Math.round(this.y) - elevY - transOffset - 6);
          ctx.stroke();
        }
        ctx.restore();
      } else if (this.transition.type === 'cave_enter') {
        if (prog < 0.5) {
          transOffset = -prog * 16;
          transScale = Math.max(0.3, 1.0 - prog * 1.2);
          transAlpha = Math.max(0.3, 1.0 - prog * 1.2);
        } else {
          transOffset = (1.0 - prog) * 20;
          transScale = 0.5 + (prog - 0.5) * 1.0;
          transAlpha = 0.5 + (prog - 0.5) * 1.0;
        }
      } else if (this.transition.type === 'cave_exit' || this.transition.type === 'ladder') {
        if (prog < 0.5) {
          transOffset = prog * 18;
          transScale = 1.0 - prog * 0.5;
          transAlpha = 1.0 - prog * 0.5;
        } else {
          transOffset = -(1.0 - prog) * 14;
          transScale = 0.6 + (prog - 0.5) * 0.8;
          transAlpha = 0.6 + (prog - 0.5) * 0.8;
        }
      }
    }

    const py = Math.round(this.y) - elevY - Math.round(transOffset);
    const bob = this.isMoving ? Math.sin(animTime * 10) * 1.5 : 0;

    if (this.isDead) {
      const progress = this.deathTimer / 1.2;
      ctx.save();
      ctx.translate(this.x, this.y - elevY);
      ctx.rotate(progress * 12);
      ctx.scale(1 - progress, 1 - progress);
      ctx.globalAlpha = 1 - progress;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-6, -12, 12, 16);
      ctx.restore();
      return;
    }

    ctx.save();
    if (transScale !== 1.0 || transAlpha !== 1.0) {
      ctx.translate(px, py);
      ctx.scale(transScale, transScale);
      ctx.globalAlpha = transAlpha;
      ctx.translate(-px, -py);
    }

    // 1. Paper Card Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(px + 1, py + 2, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1b. Level-Up Green Flame Aura (Back Layer)
    if (this.levelUpFlameTimer > 0) {
      const flameAlpha = Math.min(1.0, this.levelUpFlameTimer / 0.45);
      this.renderGreenFlameAura(ctx, px, py, animTime, flameAlpha, true);
    }

    // 2. Folded Papercraft Hero Skin (15 selectable Dark Ghibli skins)
    const skin = (typeof CHARACTERS_MAP !== 'undefined' && CHARACTERS_MAP[this.skinId]) || (typeof CHARACTERS_MAP !== 'undefined' && CHARACTERS_MAP['ren_twilight']);
    if (skin && typeof skin.render === 'function') {
      skin.render(ctx, px, py, animTime, this.direction, this.isMoving, this.hitFlash);
    } else {
      ctx.fillStyle = '#1e2636';
      ctx.beginPath();
      ctx.moveTo(px, py - 20 + bob);
      ctx.lineTo(px + 7, py - 4 + bob);
      ctx.lineTo(px - 7, py - 4 + bob);
      ctx.closePath();
      ctx.fill();
    }

    // 2b. Level-Up Green Flame Aura (Front Layer)
    if (this.levelUpFlameTimer > 0) {
      const flameAlpha = Math.min(1.0, this.levelUpFlameTimer / 0.45);
      this.renderGreenFlameAura(ctx, px, py, animTime, flameAlpha, false);
    }

    // 3. Handheld Paper Lantern on Bamboo Pole (Held during Dusk & Night AND always Underground in Caves)
    const isUnderground = (this.game && this.game.currentDimension === 'caves') ||
      (this.map && this.map.biome && typeof this.map.biome === 'string' && (this.map.biome.includes('Tiefenhöhlen') || this.map.biome.includes('Grotte') || this.map.biome.includes('Höhle')));
    const showLantern = (nightFactor > 0.1) || isUnderground;
    const effectiveIntensity = isUnderground ? 1.0 : nightFactor;

    if (showLantern) {
      const poleSide = this.direction.includes('left') ? -1 : 1;
      const poleX = px + poleSide * 7;
      const poleY = py - 13 + bob;
      ctx.strokeStyle = '#a16207'; // Bamboo pole
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + poleSide * 2, py - 8 + bob);
      ctx.lineTo(poleX, poleY);
      ctx.stroke();

      // Swaying Paper Lantern
      const lSway = (this.isMoving ? Math.sin(animTime * 12) * 2.5 : 0);
      const lanX = poleX + lSway;
      const lanY = poleY + 5;

      const fScale = 1 + Math.sin(animTime * 15) * 0.15;

      // Soft ambient lantern aura
      ctx.fillStyle = `rgba(251, 146, 60, ${0.35 * effectiveIntensity})`;
      ctx.beginPath();
      ctx.arc(lanX, lanY, 7.5 * fScale, 0, Math.PI * 2);
      ctx.fill();

      // Paper lantern body (Warm Orange-Red)
      ctx.fillStyle = `rgba(234, 88, 12, ${effectiveIntensity})`;
      ctx.beginPath();
      ctx.arc(lanX, lanY, 4.2 * fScale, 0, Math.PI * 2);
      ctx.fill();

      // Glowing incandescent filament core (Bright Gold)
      ctx.fillStyle = `rgba(254, 240, 138, ${effectiveIntensity})`;
      ctx.beginPath();
      ctx.arc(lanX, lanY, 2.2 * fScale, 0, Math.PI * 2);
      ctx.fill();

      // Wooden caps on top and bottom of paper lantern
      ctx.fillStyle = '#451a03';
      ctx.fillRect(lanX - 1.5, lanY - 4.5 * fScale, 3, 1);
      ctx.fillRect(lanX - 1.5, lanY + 3.5 * fScale, 3, 1);
    }

    // 4. COMBAT WEAPONS & ABILITY RENDERING

    // 4a. Sword & Melee Attack Rendering
    if (this.melee.charging) {
      const facingRight = this.direction.includes('right');
      const swordSide = facingRight ? 1 : -1;
      const hiltX = px + swordSide * 5;
      const hiltY = py - 14 + bob;
      const chargeProg = Math.min(1.0, this.melee.chargeTimer / COMBAT_CONFIG.SPIN_CHARGE_TIME);

      // Sword Hilt
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hiltX, hiltY);
      ctx.lineTo(hiltX + swordSide * 2, hiltY - 4);
      ctx.stroke();

      // Gleaming silver paper blade (turns glowing cyan when fully charged)
      ctx.strokeStyle = chargeProg >= 1.0 ? '#38bdf8' : '#e2e8f0';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(hiltX + swordSide * 2, hiltY - 4);
      ctx.lineTo(hiltX + swordSide * 5, hiltY - 18);
      ctx.stroke();

      // Gleam spark at blade tip
      ctx.fillStyle = chargeProg >= 1.0 ? '#fef08a' : '#38bdf8';
      ctx.fillRect(hiltX + swordSide * 5 - 1.5, hiltY - 19.5, 3, 3);
    } else if (this.melee.swingProgress < 1.0 && this.melee.swingType) {
      const swProg = this.melee.swingProgress;
      const swAngle = this.getFacingAngle();

      ctx.save();
      ctx.translate(px, py - 10 + bob);

      if (this.melee.swingType === 'thrust') {
        ctx.rotate(swAngle);
        // Linear thrust motion: shoots forward quickly, holds pose, then retracts
        const thrustExtend = Math.sin(swProg * Math.PI) * 16;
        const swordLen = 22;

        // Thrust Speed Lines around blade
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(thrustExtend, -4);
        ctx.lineTo(thrustExtend + swordLen + 6, -4);
        ctx.moveTo(thrustExtend, 4);
        ctx.lineTo(thrustExtend + swordLen + 6, 4);
        ctx.stroke();

        // Glowing white / silver blade
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(4 + thrustExtend, 0);
        ctx.lineTo(4 + thrustExtend + swordLen, 0);
        ctx.stroke();

        // Sharp golden arrowhead spear tip
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(4 + thrustExtend + swordLen + 5, 0);
        ctx.lineTo(4 + thrustExtend + swordLen - 4, -3);
        ctx.lineTo(4 + thrustExtend + swordLen - 2, 0);
        ctx.lineTo(4 + thrustExtend + swordLen - 4, 3);
        ctx.closePath();
        ctx.fill();

        // Red lacquered grip
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(2 + thrustExtend, -1.5, 3, 3);
      } else {
        // Slashes 1 & 2: Curved sweeping blade
        ctx.rotate(swAngle + (swProg - 0.5) * (this.melee.swingType === 'slash2' ? -1.8 : 1.8));

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();

        ctx.fillStyle = '#ef4444'; // Red grip wrap
        ctx.fillRect(2, -1.5, 3, 3);
      }
      ctx.restore();
    }

    // 4a2. 360 Spin Attack Whirling Twin Blades
    if (this.melee.isSpinning) {
      const spinAngle = animTime * 32;
      ctx.save();
      ctx.translate(px, py - 10 + bob);
      for (let s = 0; s < 2; s++) {
        const curAngle = spinAngle + s * Math.PI;
        ctx.save();
        ctx.rotate(curAngle);

        // Radiant Cyan Blade
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(26, 0);
        ctx.stroke();

        // Glowing white cutting edge
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(28, 0);
        ctx.stroke();

        // Sharp tip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(24, -3.5);
        ctx.lineTo(24, 3.5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
      ctx.restore();
    }

    // 4b. Bow & Arrow Aiming
    if (this.ranged.charging) {
      const bowAngle = this.getFacingAngle();

      ctx.save();
      ctx.translate(px, py - 10 + bob);
      ctx.rotate(bowAngle);

      // Curved Bamboo Bow
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(8, 0, 10, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();

      // Pulled Bowstring
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(8 + Math.cos(-Math.PI * 0.35) * 10, Math.sin(-Math.PI * 0.35) * 10);
      ctx.lineTo(2, 0);
      ctx.lineTo(8 + Math.cos(Math.PI * 0.35) * 10, Math.sin(Math.PI * 0.35) * 10);
      ctx.stroke();

      // Nocked Paper Arrow
      ctx.strokeStyle = (this.ranged.chargeTimer >= COMBAT_CONFIG.ARROW_CHARGE_TIME) ? '#38bdf8' : '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(16, 0);
      ctx.stroke();

      ctx.restore();
    }

    // 4c. Translucent Shimmering Bubble Shield (Smash Bros / Zelda Style)
    if (this.shield.active) {
      const sRadius = 14 + (this.shield.energy / 100) * 8;
      const sPulse = Math.sin(animTime * 10) * 0.6;
      const rad = sRadius + sPulse;

      const sGrad = ctx.createRadialGradient(px, py - 10 + bob, rad * 0.2, px, py - 10 + bob, rad);
      const isLow = this.shield.energy < 25;
      if (isLow) {
        sGrad.addColorStop(0, 'rgba(239, 68, 68, 0.08)');
        sGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.35)');
        sGrad.addColorStop(1, 'rgba(254, 202, 202, 0.88)');
      } else {
        sGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
        sGrad.addColorStop(0.68, 'rgba(14, 165, 233, 0.35)');
        sGrad.addColorStop(1, 'rgba(224, 242, 254, 0.85)');
      }

      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(px, py - 10 + bob, rad, 0, Math.PI * 2);
      ctx.fill();

      // Hexagonal origami shield facet seams
      ctx.strokeStyle = isLow ? 'rgba(248, 113, 113, 0.85)' : 'rgba(186, 230, 253, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let h = 0; h < 6; h++) {
        const hAngle = animTime * 1.5 + (h / 6) * Math.PI * 2;
        const hx = px + Math.cos(hAngle) * rad;
        const hy = py - 10 + bob + Math.sin(hAngle) * rad;
        if (h === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 4d. Stun Stars on Shield Break
    if (this.shield.broken && this.shield.stunTimer > 0) {
      for (let st = 0; st < 3; st++) {
        const stAngle = animTime * 8 + (st / 3) * Math.PI * 2;
        const stX = px + Math.cos(stAngle) * 9;
        const stY = py - 26 + bob + Math.sin(stAngle) * 3;
        ctx.fillStyle = '#facc15';
        ctx.fillRect(stX - 1.5, stY - 1.5, 3, 3);
      }
    }

    // 4e. Dash Ghost Trails
    for (const ghost of this.dash.ghosts) {
      ctx.save();
      ctx.globalAlpha = ghost.alpha * 0.45;
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.ellipse(ghost.x, ghost.y - ghost.elevY - 10, 7, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4f. Compact Overhead Health Bar (when damaged)
    if (this.hp < this.maxHp && this.hp > 0 && !this.isDead) {
      const barW = 24;
      const barH = 3.5;
      const barX = px - barW / 2;
      const barY = py - 26 + bob;
      const hpPct = Math.max(0, this.hp / this.maxHp);

      ctx.save();
      // Paper border & dark drop shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      // Health Fill (dynamic green -> yellow -> red)
      ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : (hpPct > 0.25 ? '#f59e0b' : '#ef4444');
      ctx.fillRect(barX, barY, barW * hpPct, barH);
      ctx.restore();
    }

    // 4g. Overhead Player Nameplate (Dark Ghibli Papercraft)
    if (this.name && !this.isDead) {
      ctx.save();
      ctx.font = 'bold 8.5px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const nameY = (this.hp < this.maxHp) ? py - 33 + bob : py - 27 + bob;
      const textMetrics = (typeof ctx.measureText === 'function') ? ctx.measureText(this.name) : { width: this.name.length * 5.5 };
      const textW = Math.max(16, textMetrics.width);
      const padX = 4;
      const badgeH = 11;

      // Dark Papercraft Badge & Drop Shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.fillRect(px - textW / 2 - padX, nameY - badgeH / 2, textW + padX * 2, badgeH);

      // Delicate Paper Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(px - textW / 2 - padX, nameY - badgeH / 2, textW + padX * 2, badgeH);

      // Pure White Text
      ctx.fillStyle = '#f8fafc';
      if (typeof ctx.fillText === 'function') {
        ctx.fillText(this.name, px, nameY);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  renderGreenFlameAura(ctx, px, py, animTime, alpha, behind = false) {
    if (alpha <= 0) return;

    ctx.save();
    if (behind) {
      // 1. Soft Emerald Glow Radial Gradient
      const glowPulse = 1.0 + Math.sin(animTime * 12) * 0.15;
      const grad = ctx.createRadialGradient(px, py - 10, 2, px, py - 10, 28 * glowPulse);
      grad.addColorStop(0, `rgba(74, 222, 128, ${0.45 * alpha})`);
      grad.addColorStop(0.5, `rgba(34, 197, 94, ${0.28 * alpha})`);
      grad.addColorStop(1, 'rgba(22, 101, 52, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py - 10, 28 * glowPulse, 0, Math.PI * 2);
      ctx.fill();

      // 2. Background Flame Tongues (Darker Emerald & Forest Green)
      for (let i = 0; i < 5; i++) {
        const tOff = i * 1.35;
        const sway = Math.sin(animTime * 11 + tOff) * 3.5;
        const hFluct = Math.cos(animTime * 13 + tOff) * 4;
        const bx = px - 9 + i * 4.5;
        const by = py - 1;
        const tipX = px - 11 + i * 5.5 + sway;
        const tipY = py - 24 - (i % 2 === 0 ? 6 : 2) + hFluct;

        ctx.fillStyle = (i % 2 === 0)
          ? `rgba(22, 163, 74, ${0.75 * alpha})`
          : `rgba(34, 197, 94, ${0.85 * alpha})`;

        ctx.beginPath();
        ctx.moveTo(bx - 3.5, by);
        ctx.quadraticCurveTo(bx - 6 + sway * 0.5, (by + tipY) * 0.5, tipX, tipY);
        ctx.quadraticCurveTo(bx + 6 + sway * 0.5, (by + tipY) * 0.5, bx + 3.5, by);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // 3. Foreground Flame Tongues (Vibrant Mint & Bright Green)
      for (let i = 0; i < 4; i++) {
        const tOff = i * 1.6 + 2.1;
        const sway = Math.sin(animTime * 14 + tOff) * 3.0;
        const hFluct = Math.sin(animTime * 16 + tOff) * 3.5;
        const bx = px - 6 + i * 4;
        const by = py - 2;
        const tipX = px - 6 + i * 4 + sway;
        const tipY = py - 19 - (i % 2 === 1 ? 5 : 1) + hFluct;

        // Outer bright flame
        ctx.fillStyle = (i % 2 === 0)
          ? `rgba(74, 222, 128, ${0.85 * alpha})`
          : `rgba(134, 239, 172, ${0.90 * alpha})`;

        ctx.beginPath();
        ctx.moveTo(bx - 2.8, by);
        ctx.quadraticCurveTo(bx - 4.5 + sway * 0.4, (by + tipY) * 0.5, tipX, tipY);
        ctx.quadraticCurveTo(bx + 4.5 + sway * 0.4, (by + tipY) * 0.5, bx + 2.8, by);
        ctx.closePath();
        ctx.fill();

        // White-hot spirit inner core
        ctx.fillStyle = `rgba(240, 253, 244, ${0.85 * alpha})`;
        ctx.beginPath();
        ctx.moveTo(bx - 1.2, by);
        ctx.quadraticCurveTo(bx - 2.2 + sway * 0.3, (by + tipY) * 0.6, tipX * 0.7 + bx * 0.3, tipY + 4);
        ctx.quadraticCurveTo(bx + 2.2 + sway * 0.3, (by + tipY) * 0.6, bx + 1.2, by);
        ctx.closePath();
        ctx.fill();
      }

      // 4. Floating Spirit Flame Embers
      for (let e = 0; e < 6; e++) {
        const eProg = (animTime * 2.8 + e * 0.38) % 1.0;
        const eX = px + Math.sin(animTime * 5 + e * 2.2) * (11 + e * 1.8);
        const eY = py - eProg * 32;
        const emberAlpha = Math.sin(eProg * Math.PI) * alpha;

        ctx.fillStyle = `rgba(187, 247, 208, ${emberAlpha})`;
        ctx.beginPath();
        ctx.arc(eX, eY, 1.4 + (1 - eProg) * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}


// --- js/camera.js ---

class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.y = 0;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.userZoom = null;
    this.zoom = this.calculateDefaultZoom(viewportWidth, viewportHeight);

    this.mapWidth = MAP_WIDTH;
    this.mapHeight = MAP_HEIGHT;
    this.worldWidth = MAP_WIDTH * TILE_SIZE;
    this.worldHeight = MAP_HEIGHT * TILE_SIZE;
  }

  calculateDefaultZoom(width, height) {
    if (typeof window !== 'undefined') {
      const isTouch = (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) ||
                      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
      const isSmallScreen = Math.min(width || window.innerWidth, height || window.innerHeight) <= 560;
      if (isTouch || isSmallScreen) {
        return 1.85; // Weitwinkel-Zoom für Smartphones & Touchscreens
      }
    }
    return 3.0; // Klassischer 3x Pixel-Zoom auf Desktop-Monitoren
  }

  setZoom(val) {
    this.zoom = Math.max(1.0, Math.min(4.0, Math.round(val * 100) / 100));
    this.userZoom = this.zoom;
    return this.zoom;
  }

  adjustZoom(delta) {
    return this.setZoom(this.zoom + delta);
  }

  setWorldBounds(widthInTiles, heightInTiles) {
    this.mapWidth = widthInTiles;
    this.mapHeight = heightInTiles;
    this.worldWidth = widthInTiles * TILE_SIZE;
    this.worldHeight = heightInTiles * TILE_SIZE;
  }

  resize(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    if (this.userZoom === null) {
      this.zoom = this.calculateDefaultZoom(width, height);
    }
  }

  follow(targetX, targetY) {
    const viewW = this.viewportWidth / this.zoom;
    const viewH = this.viewportHeight / this.zoom;

    if (this.worldWidth <= viewW) {
      this.x = (this.worldWidth - viewW) / 2;
    } else {
      const maxX = this.worldWidth - viewW;
      this.x = Math.max(0, Math.min(targetX - viewW / 2, maxX));
    }

    if (this.worldHeight <= viewH) {
      this.y = (this.worldHeight - viewH) / 2;
    } else {
      const maxY = this.worldHeight - viewH;
      this.y = Math.max(0, Math.min(targetY - viewH / 2, maxY));
    }
  }

  shake(amount = 4.0, duration = 0.15) {
    this.shakeAmount = amount;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  update(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const prog = Math.max(0, this.shakeTimer / this.shakeDuration);
      const mag = this.shakeAmount * prog;
      this.offsetX = (Math.random() - 0.5) * 2 * mag;
      this.offsetY = (Math.random() - 0.5) * 2 * mag;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }

  apply(ctx) {
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-Math.round(this.x + (this.offsetX || 0)), -Math.round(this.y + (this.offsetY || 0)));
  }

  release(ctx) {
    ctx.restore();
  }

  getVisibleTileBounds() {
    const mw = this.mapWidth || MAP_WIDTH;
    const mh = this.mapHeight || MAP_HEIGHT;
    const startX = Math.max(0, Math.floor(this.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(this.y / TILE_SIZE) - 1);
    const endX = Math.min(mw, Math.ceil((this.x + this.viewportWidth / this.zoom) / TILE_SIZE) + 2);
    const endY = Math.min(mh, Math.ceil((this.y + this.viewportHeight / this.zoom) / TILE_SIZE) + 2);

    return { startX, startY, endX, endY };
  }
}


// --- js/minimap.js ---

class Minimap {
  constructor(canvasElement, map) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.map = map;

    this.scaleX = this.canvas.width / MAP_WIDTH;
    this.scaleY = this.canvas.height / MAP_HEIGHT;

    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = this.canvas.width;
    this.bgCanvas.height = this.canvas.height;
    this.bgCtx = this.bgCanvas.getContext('2d');
    this.bgCtx.imageSmoothingEnabled = false;

    this.renderStaticBackground();
  }

  setMap(map, dimension = 'overworld') {
    this.map = map;
    this.dimension = dimension;
    this.scaleX = this.canvas.width / this.map.width;
    this.scaleY = this.canvas.height / this.map.height;
    this.updateHUD();
    this.renderStaticBackground();
  }
  updateHUD() {
    const titleEl = document.getElementById('minimap-title');
    const header = titleEl || document.getElementById('minimap-header');
    const legend = document.getElementById('minimap-legend');
    if (!header || !legend) return;

    if (this.dimension === 'clouds') {
      header.textContent = 'MINIMAP - 🌸 WOLKENREICH';
      legend.innerHTML = `
        <span class="legend-item"><i class="dot" style="background:#f472b6;"></i> Wolke</span>
        <span class="legend-item"><i class="dot" style="background:#facc15;"></i> Brücke</span>
        <span class="legend-item"><i class="dot" style="background:#130a24;"></i> Himmel</span>
        <span class="legend-item"><i class="dot" style="background:#fbbf24;"></i> Schrein</span>
      `;
    } else if (this.dimension === 'caves') {
      const cName = this.map.name || 'HÖHLENWELT';
      header.textContent = `MINIMAP - 🪨 ${cName.toUpperCase()}`;
      legend.innerHTML = `
        <span class="legend-item"><i class="dot" style="background:#334155;"></i> Fels</span>
        <span class="legend-item"><i class="dot" style="background:#0ea5e9;"></i> See</span>
        <span class="legend-item"><i class="dot" style="background:#fef08a;"></i> Ausgang</span>
        <span class="legend-item"><i class="dot" style="background:#f97316;"></i> Fackel</span>
        <span class="legend-item"><i class="dot" style="background:#fbbf24;"></i> Schrein</span>
      `;
    } else {
      header.textContent = 'MINIMAP - 🗺️ OBERWELT';
      legend.innerHTML = `
        <span class="legend-item"><i class="dot grass"></i> Gras</span>
        <span class="legend-item"><i class="dot desert"></i> Wüste</span>
        <span class="legend-item"><i class="dot snow"></i> Schnee</span>
        <span class="legend-item"><i class="dot swamp"></i> Sumpf</span>
        <span class="legend-item"><i class="dot void"></i> Leere</span>
      `;
    }
  }

  renderStaticBackground() {
    this.bgCtx.fillStyle = '#050508';
    this.bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const tile = this.map.getGroundTile(x, y);
        const props = TILE_PROPS[tile];
        let color = props ? props.minimapColor : '#222';

        // Biome-spezifische Farbgebung in Höhlen
        if (tile === 17) { // TILES.CAVE_WALL
          const theme = this.map.getTheme ? this.map.getTheme(x, y) : 'main';
          if (theme === 'snow') color = '#0c4a6e';
          else if (theme === 'void') color = '#1a052e';
          else if (theme === 'forest') color = '#14381a';
          else if (theme === 'desert') color = '#5c2406';
          else if (theme === 'swamp') color = '#1a2619';
          else if (theme === 'crystal') color = '#1e1b4b';
          else color = '#0f172a';
        } else if (tile === 16) { // TILES.CAVE_FLOOR
          const theme = this.map.getTheme ? this.map.getTheme(x, y) : 'main';
          if (theme === 'snow') color = '#38bdf8';
          else if (theme === 'void') color = '#6b21a8';
          else if (theme === 'forest') color = '#15803d';
          else if (theme === 'desert') color = '#b45309';
          else if (theme === 'swamp') color = '#3f6212';
          else if (theme === 'crystal') color = '#334155';
          else color = '#334155';
        } else if (tile === 18) { // TILES.CAVE_WATER
          const theme = this.map.getTheme ? this.map.getTheme(x, y) : 'main';
          if (theme === 'void') color = '#4c1d95';
          else if (theme === 'swamp') color = '#047857';
          else color = '#06b6d4';
        }

        this.bgCtx.fillStyle = color;
        this.bgCtx.fillRect(
          Math.floor(x * this.scaleX),
          Math.floor(y * this.scaleY),
          Math.ceil(this.scaleX) + 1,
          Math.ceil(this.scaleY) + 1
        );

        // Canopy overlay
        if (this.map.getCanopyTile && this.map.getCanopyTile(x, y) === CANOPY.TREE_CROWN) {
          this.bgCtx.fillStyle = '#16481e';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            Math.ceil(this.scaleX) + 1,
            Math.ceil(this.scaleY) + 1
          );
        }

        // Elevation tinting on minimap (plateaus lighter, holes darker)
        const elev = this.map.getElevation ? this.map.getElevation(x, y) : 0;
        if (elev > 0) {
          this.bgCtx.fillStyle = elev === 1 ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.35)';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            Math.ceil(this.scaleX) + 1,
            Math.ceil(this.scaleY) + 1
          );
        } else if (elev < 0) {
          this.bgCtx.fillStyle = 'rgba(0, 0, 0, 0.42)';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            Math.ceil(this.scaleX) + 1,
            Math.ceil(this.scaleY) + 1
          );
        }

        // Ramp indicator dot on minimap
        if (this.map.getRamp && this.map.getRamp(x, y) !== 0) {
          this.bgCtx.fillStyle = '#fbbf24';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            Math.ceil(this.scaleX),
            Math.ceil(this.scaleY)
          );
        }

        // Shrine indicator (Golden Diamond)
        if (this.map.objects && this.map.objects[y] && this.map.objects[y][x] === 15) {
          this.bgCtx.fillStyle = '#facc15';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX) - 1,
            Math.floor(y * this.scaleY) - 1,
            3,
            3
          );
        }

        // Trampoline indicator (Pink Dot)
        if (this.map.objects && this.map.objects[y] && this.map.objects[y][x] === 14) {
          this.bgCtx.fillStyle = '#f472b6';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            2,
            2
          );
        }

        // Torch indicator in caves (Fiery Orange Dot)
        if (this.map.objects && this.map.objects[y] && this.map.objects[y][x] === 20) {
          this.bgCtx.fillStyle = '#f97316';
          this.bgCtx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            2,
            2
          );
        }
      }
    }

    // Draw individual tree markers on minimap
    if (this.map.trees && this.map.trees.length > 0) {
      for (const tree of this.map.trees) {
        const mx = Math.floor((tree.x / TILE_SIZE) * this.scaleX);
        const my = Math.floor((tree.y / TILE_SIZE) * this.scaleY);
        let color = '#195420';
        if (tree.type === 2) color = '#0f3818';
        else if (tree.type === 4) color = '#e07a9e';
        else if (tree.type === 5) color = '#d97706';
        else if (tree.type === 6) color = '#b8d8ec';
        else if (tree.type === 7) color = '#344528';
        else if (tree.type === 8) color = '#78a638';

        this.bgCtx.fillStyle = color;
        this.bgCtx.fillRect(mx - 1, my - 1, 2, 2);
      }
    }
  }

  render(player, camera) {
    // 0. Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Pre-rendered terrain
    this.ctx.drawImage(this.bgCanvas, 0, 0);

    // 2. Camera Viewport Box
    const viewW = (camera.viewportWidth / camera.zoom) / TILE_SIZE * this.scaleX;
    const viewH = (camera.viewportHeight / camera.zoom) / TILE_SIZE * this.scaleY;
    const viewX = (camera.x / TILE_SIZE) * this.scaleX;
    const viewY = (camera.y / TILE_SIZE) * this.scaleY;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(viewX, viewY, viewW, viewH);

    // 3. Player Marker
    const pX = (player.x / TILE_SIZE) * this.scaleX;
    const pY = (player.y / TILE_SIZE) * this.scaleY;

    this.ctx.fillStyle = '#ff2a55';
    this.ctx.beginPath();
    this.ctx.arc(pX, pY, 3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(pX, pY, 4, 0, Math.PI * 2);
    this.ctx.stroke();
  }
}


// --- js/touchControls.js ---
class TouchControls {
  constructor(gameInput, onButtonPress = null) {
    this.input = gameInput;
    this.onButtonPress = onButtonPress;

    // Ensure input state objects exist
    if (!this.input.joystick) {
      this.input.joystick = { x: 0, y: 0, active: false };
    }
    if (!this.input.buttons) {
      this.input.buttons = { A: false, B: false, X: false, Y: false };
    }

    if (typeof document !== 'undefined') {
      this.container = document.getElementById('touch-controls');
      this.joystickZone = document.getElementById('touch-joystick-zone');
      this.joystickBase = document.getElementById('touch-joystick-base');
      this.joystickKnob = document.getElementById('touch-joystick-knob');
      this.buttonsZone = document.getElementById('touch-buttons-zone');
      this.rotateOverlay = document.getElementById('rotate-device-overlay');
    } else {
      this.container = null;
      this.joystickZone = null;
      this.joystickBase = null;
      this.joystickKnob = null;
      this.buttonsZone = null;
      this.rotateOverlay = null;
    }

    this.joystickTouchId = null;
    this.baseRect = null;
    this.maxRadius = 45; // Max pixel deflection from center
    this.deadZone = 0.12; // Ignore minor thumb trembling

    this.isTouchDevice = false;

    this.initDetection();
    this.initJoystick();
    this.initButtons();
    this.initOrientationCheck();
  }

  initDetection() {
    if (typeof window === 'undefined') return;

    // Detect touch capability
    this.isTouchDevice = Boolean(
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches)
    );

    if (this.isTouchDevice && this.container) {
      this.container.classList.remove('hidden');
      if (typeof document !== 'undefined') {
        const hint = document.getElementById('controls-hint');
        if (hint) hint.style.display = 'none';
      }
    }

    // Dynamic reveal on first touch anywhere
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('touchstart', () => {
        if (!this.isTouchDevice) {
          this.isTouchDevice = true;
          if (this.container) this.container.classList.remove('hidden');
          if (typeof document !== 'undefined') {
            const hint = document.getElementById('controls-hint');
            if (hint) hint.style.display = 'none';
          }
        }
      }, { once: true, passive: true });
    }
  }

  initJoystick() {
    if (!this.joystickZone || !this.joystickBase || !this.joystickKnob) return;
    if (typeof this.joystickZone.addEventListener !== 'function') return;
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

    const updateBaseRect = () => {
      this.baseRect = this.joystickBase.getBoundingClientRect();
    };

    // Touch Start
    this.joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.joystickTouchId !== null) return; // Already tracking a finger

      updateBaseRect();
      const touch = e.changedTouches[0];
      this.joystickTouchId = touch.identifier;

      this.processJoystickMove(touch.clientX, touch.clientY);
    }, { passive: false });

    // Touch Move
    window.addEventListener('touchmove', (e) => {
      if (this.joystickTouchId === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          e.preventDefault();
          this.processJoystickMove(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    // Touch End / Cancel
    const endJoystick = (e) => {
      if (this.joystickTouchId === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          this.resetJoystick();
          break;
        }
      }
    };

    window.addEventListener('touchend', endJoystick, { passive: true });
    window.addEventListener('touchcancel', endJoystick, { passive: true });

    // Desktop mouse fallback for testing
    let isMouseDown = false;
    this.joystickZone.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      updateBaseRect();
      this.processJoystickMove(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      this.processJoystickMove(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        this.resetJoystick();
      }
    });
  }

  processJoystickMove(clientX, clientY) {
    if (!this.baseRect) {
      this.baseRect = this.joystickBase.getBoundingClientRect();
    }

    const centerX = this.baseRect.left + this.baseRect.width / 2;
    const centerY = this.baseRect.top + this.baseRect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;

    const distance = Math.hypot(deltaX, deltaY);

    if (distance > this.maxRadius) {
      deltaX = (deltaX / distance) * this.maxRadius;
      deltaY = (deltaY / distance) * this.maxRadius;
    }

    // Visuellen Joystick-Knauf versetzen
    this.joystickKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    // Normalisierter Richtungsvektor (-1 bis 1)
    const normDist = Math.min(1.0, distance / this.maxRadius);
    if (normDist < this.deadZone) {
      this.input.joystick.x = 0;
      this.input.joystick.y = 0;
      this.input.joystick.active = false;
    } else {
      this.input.joystick.x = deltaX / this.maxRadius;
      this.input.joystick.y = deltaY / this.maxRadius;
      this.input.joystick.active = true;
    }
  }

  resetJoystick() {
    this.joystickTouchId = null;
    this.joystickKnob.style.transform = 'translate(0px, 0px)';
    this.input.joystick.x = 0;
    this.input.joystick.y = 0;
    this.input.joystick.active = false;
  }

  initButtons() {
    if (!this.buttonsZone || typeof this.buttonsZone.querySelectorAll !== 'function') return;

    const buttons = this.buttonsZone.querySelectorAll('.touch-btn');
    if (!buttons || !buttons.forEach) return;

    buttons.forEach((btn) => {
      const action = btn.getAttribute('data-action');
      if (!btn.addEventListener) return;

      const press = (e) => {
        if (e) e.preventDefault();
        if (btn.classList && btn.classList.add) btn.classList.add('active');
        this.input.buttons[action] = true;
        if (this.onButtonPress) {
          this.onButtonPress(action, true);
        }
      };

      const release = (e) => {
        if (e) e.preventDefault();
        if (btn.classList && btn.classList.remove) btn.classList.remove('active');
        this.input.buttons[action] = false;
        if (this.onButtonPress) {
          this.onButtonPress(action, false);
        }
      };

      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('touchcancel', release, { passive: false });

      // Mouse support for testing
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);
    });
  }

  initOrientationCheck() {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      if (this.rotateOverlay && this.rotateOverlay.classList) {
        if (isPortrait && this.isTouchDevice) {
          this.rotateOverlay.classList.remove('hidden');
        } else {
          this.rotateOverlay.classList.add('hidden');
        }
      }
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation();
  }
}


// --- js/combat.js ---

class CombatManager {
  constructor(game) {
    this.game = game;
    this.flyingArrows = [];
    this.stuckArrows = [];
    this.slashEffects = [];
    this.hitSparks = [];
    this.floatingTexts = [];

    // Enemy Attacks & Hazard Systems
    this.enemyProjectiles = [];
    this.shockwaves = [];
    this.celestialStrikes = [];
    this.hazardPuddles = [];
    this.grapplingHooks = [];
    this.defeatPoofs = [];

    // Training Dummies for target practice & feedback
    this.dummies = [];
    this.initTrainingDummies();
  }

  initTrainingDummies() {
    // 3 Straw & Paper Training Dummies positioned right in front of the overworld spawn (30, 45)
    this.dummies = [
      { id: 1, x: 26 * TILE_SIZE + 8, y: 43 * TILE_SIZE + 8, startX: 26 * TILE_SIZE + 8, startY: 43 * TILE_SIZE + 8, vx: 0, vy: 0, wobble: 0, wobbleTimer: 0, hitTimer: 0, hp: 100 },
      { id: 2, x: 25 * TILE_SIZE + 8, y: 45 * TILE_SIZE + 8, startX: 25 * TILE_SIZE + 8, startY: 45 * TILE_SIZE + 8, vx: 0, vy: 0, wobble: 0, wobbleTimer: 0, hitTimer: 0, hp: 100 },
      { id: 3, x: 26 * TILE_SIZE + 8, y: 47 * TILE_SIZE + 8, startX: 26 * TILE_SIZE + 8, startY: 47 * TILE_SIZE + 8, vx: 0, vy: 0, wobble: 0, wobbleTimer: 0, hitTimer: 0, hp: 100 }
    ];
  }

  isWaterOrAbyssTile(tile) {
    return tile === TILES.WATER ||
           tile === TILES.SWAMP_WATER ||
           tile === TILES.CAVE_WATER ||
           tile === TILES.VOID_LAKE ||
           tile === TILES.SKY_ABYSS;
  }

  isArrowObstacle(map, tX, tY) {
    if (!map || !map.isValid || !map.isValid(tX, tY)) return true;

    // Check solid objects (rocks, tree trunks, cacti, stalagmites, etc.)
    const obj = map.getObjectTile ? map.getObjectTile(tX, tY) : (map.objects ? map.objects[tY]?.[tX] : 0);
    const objProps = OBJ_PROPS[obj];
    if (objProps && objProps.solid) return true;

    // Check ground solidity EXCEPT for water and abyss (arrows fly freely over liquids!)
    const ground = map.getGroundTile ? map.getGroundTile(tX, tY) : (map.ground ? map.ground[tY]?.[tX] : 0);
    if (this.isWaterOrAbyssTile(ground)) {
      return false;
    }

    const groundProps = TILE_PROPS[ground];
    if (groundProps && groundProps.solid) return true;

    return false;
  }

  createWaterSplash(x, y, tile) {
    let dropColor1 = '#38bdf8';
    let dropColor2 = '#e0f2fe';
    let rippleColor = 'rgba(56, 189, 248, 0.6)';

    if (tile === TILES.SWAMP_WATER) {
      dropColor1 = '#84cc16';
      dropColor2 = '#4d7c0f';
      rippleColor = 'rgba(101, 163, 13, 0.6)';
    } else if (tile === TILES.VOID_LAKE) {
      dropColor1 = '#c084fc';
      dropColor2 = '#6b21a8';
      rippleColor = 'rgba(168, 85, 247, 0.6)';
    }

    // Droplets jumping into the air
    for (let i = 0; i < 12; i++) {
      const spAngle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 35 + 15;
      this.hitSparks.push({
        x,
        y,
        vx: Math.cos(spAngle) * speed,
        vy: Math.sin(spAngle) * speed * 0.5 - (Math.random() * 25 + 15),
        color: Math.random() > 0.4 ? dropColor1 : dropColor2,
        size: Math.random() * 2.2 + 1.2,
        life: 0.35,
        maxLife: 0.35
      });
    }

    // Ripples
    for (let r = 0; r < 3; r++) {
      const rAngle = (r / 3) * Math.PI * 2;
      this.hitSparks.push({
        x: x + Math.cos(rAngle) * 3,
        y: y + Math.sin(rAngle) * 2,
        vx: Math.cos(rAngle) * 12,
        vy: Math.sin(rAngle) * 6,
        color: rippleColor,
        size: 2.5,
        life: 0.4,
        maxLife: 0.4
      });
    }

    this.addFloatingText('💧 Platsch!', x, y - 10, dropColor1, 0.55);
  }

  fireArrow(startX, startY, dirX, dirY, isCharged = false) {
    const angle = Math.atan2(dirY, dirX);
    const rangeSkill = this.game?.player?.skills?.range || 0;
    const baseSpeed = isCharged ? COMBAT_CONFIG.ARROW_CHARGED_SPEED : COMBAT_CONFIG.ARROW_SPEED;
    const baseRange = isCharged ? COMBAT_CONFIG.ARROW_CHARGED_RANGE : COMBAT_CONFIG.ARROW_RANGE;
    const speed = baseSpeed + rangeSkill * 25;
    const maxRange = baseRange + rangeSkill * 35;

    this.flyingArrows.push({
      dimension: this.game?.currentDimension || 'overworld',
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      distTraveled: 0,
      maxRange,
      isCharged,
      speed,
      trailTimer: 0
    });

    // Muzzle wind puff
    for (let i = 0; i < (isCharged ? 10 : 5); i++) {
      const spread = (Math.random() - 0.5) * 0.8;
      const pSpeed = Math.random() * 40 + 20;
      this.hitSparks.push({
        x: startX + Math.cos(angle) * 8,
        y: startY + Math.sin(angle) * 8,
        vx: Math.cos(angle + spread) * pSpeed,
        vy: Math.sin(angle + spread) * pSpeed,
        color: isCharged ? '#38bdf8' : '#f8fafc',
        size: Math.random() * 2 + 1,
        life: 0.25,
        maxLife: 0.25
      });
    }
  }

  addSlashEffect(type, x, y, angle, radius = 28) {
    let duration = 0.22;
    if (type === 'spin') duration = 0.32;
    if (type === 'thrust') duration = 0.32; // Longer duration for powerful lingering thrust

    this.slashEffects.push({
      type,
      x,
      y,
      angle,
      radius,
      timer: 0,
      duration
    });

    // Air gust & paper spark particles
    const sparkCount = type === 'spin' ? 24 : (type === 'thrust' ? 22 : 9);
    for (let i = 0; i < sparkCount; i++) {
      let pAngle;
      if (type === 'spin') {
        pAngle = (i / sparkCount) * Math.PI * 2;
      } else if (type === 'thrust') {
        pAngle = angle + (Math.random() - 0.5) * 0.4;
      } else {
        pAngle = angle + (Math.random() - 0.5) * 1.0;
      }

      const pSpeed = type === 'thrust' ? (Math.random() * 140 + 60) : (Math.random() * 80 + 40);
      this.hitSparks.push({
        x: x + Math.cos(pAngle) * (radius * 0.5),
        y: y + Math.sin(pAngle) * (radius * 0.5),
        vx: Math.cos(pAngle) * pSpeed,
        vy: Math.sin(pAngle) * pSpeed,
        color: type === 'spin' ? '#67e8f9' : (type === 'thrust' ? (Math.random() > 0.4 ? '#fef08a' : '#f59e0b') : '#ffffff'),
        size: Math.random() * 2.5 + 1.2,
        life: 0.32,
        maxLife: 0.32
      });
    }
  }

  addHitSparks(x, y, color = '#facc15', count = 10, speed = 80) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sp = Math.random() * speed + speed * 0.4;
      this.hitSparks.push({
        x,
        y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        color,
        size: Math.random() * 2.5 + 1.2,
        life: 0.28,
        maxLife: 0.28
      });
    }
  }

  addFloatingText(text, x, y, color = '#ffffff', duration = 0.65) {
    this.floatingTexts.push({
      text,
      x,
      y,
      timer: 0,
      duration,
      color
    });
  }

  addDefeatPoof(x, y, category = 'normal', dimension = null) {
    const count = category === 'boss' ? 32 : 18;
    const colors = category === 'boss' ? ['#facc15', '#f43f5e', '#a855f7', '#ffffff'] : ['#f8fafc', '#e2e8f0', '#cbd5e1', '#fef08a'];
    const dim = dimension || this.game?.currentDimension || 'overworld';
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sp = Math.random() * 70 + 20;
      this.defeatPoofs.push({
        dimension: dim,
        x,
        y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp - 25,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8,
        life: 0.65,
        maxLife: 0.65
      });
    }
  }

  fireEnemyProjectile(config) {
    this.enemyProjectiles.push({
      dimension: config.dimension || this.game?.currentDimension || 'overworld',
      type: config.type || 'generic',
      x: config.x,
      y: config.y,
      dirX: config.dirX,
      dirY: config.dirY,
      speed: config.speed || 200,
      damage: config.damage || 15,
      color: config.color || '#ef4444',
      radius: config.radius || 5,
      maxDist: config.maxDist || 200,
      distTraveled: 0,
      trailTimer: 0,
      spawnsPuddle: Boolean(config.spawnsPuddle),
      slowsPlayer: Boolean(config.slowsPlayer),
      knockbackPlayer: config.knockbackPlayer || 0
    });
  }

  createShockwave(x, y, maxRadius, damage, color = '#f59e0b', slowsPlayer = false, dimension = null) {
    this.shockwaves.push({
      dimension: dimension || this.game?.currentDimension || 'overworld',
      x,
      y,
      maxRadius,
      currentRadius: 4,
      damage,
      color,
      slowsPlayer,
      duration: 0.42,
      timer: 0,
      hasHitPlayer: false
    });
  }

  spawnCelestialStrike(targetX, targetY, damage, dimension = null) {
    this.celestialStrikes.push({
      dimension: dimension || this.game?.currentDimension || 'overworld',
      targetX,
      targetY,
      damage,
      delay: 0.75,
      timer: 0,
      impacted: false
    });
  }

  spawnHazardPuddle(x, y, radius = 18, duration = 4.5, damage = 10, color = '#a855f7', dimension = null) {
    this.hazardPuddles.push({
      dimension: dimension || this.game?.currentDimension || 'overworld',
      x,
      y,
      radius,
      duration,
      timer: 0,
      damage,
      color,
      tickTimer: 0
    });
  }

  fireGrapplingHook(enemy, targetX, targetY) {
    const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
    const speed = 400;
    this.grapplingHooks.push({
      dimension: enemy.dimension || this.game?.currentDimension || 'overworld',
      enemy,
      startX: enemy.x,
      startY: enemy.y,
      tipX: enemy.x,
      tipY: enemy.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      length: 0,
      maxLength: 230,
      state: 'extend', // 'extend' | 'pull' | 'retract'
      color: enemy.typeId === 'frost_giant' ? '#7dd3fc' : '#94a3b8',
      hookColor: enemy.typeId === 'frost_giant' ? '#38bdf8' : '#78350f',
      damage: 18
    });
  }

  checkMeleeHits(hitbox) {
    let hitAny = false;

    // Check collision with training dummies
    for (const dummy of this.dummies) {
      if (this.game.currentDimension !== 'overworld') continue;

      const dx = dummy.x - hitbox.x;
      const dy = dummy.y - hitbox.y;
      const dist = Math.hypot(dx, dy);

      let inRange = false;
      if (hitbox.type === 'spin') {
        inRange = dist <= (hitbox.radius + 10);
      } else if (hitbox.type === 'thrust') {
        // Forward piercing cone / capsule
        const forwardDot = (dx * Math.cos(hitbox.angle) + dy * Math.sin(hitbox.angle));
        const sideDist = Math.abs(-dx * Math.sin(hitbox.angle) + dy * Math.cos(hitbox.angle));
        inRange = (forwardDot > 0 && forwardDot <= hitbox.range && sideDist <= (hitbox.width || 22));
      } else {
        // Slash arc (~60 degree cone in front)
        const forwardDot = (dx * Math.cos(hitbox.angle) + dy * Math.sin(hitbox.angle));
        const angleDiff = Math.abs(Math.atan2(dy, dx) - hitbox.angle);
        const normAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        inRange = (dist <= hitbox.radius && Math.abs(normAngleDiff) <= 0.85);
      }

      if (inRange) {
        hitAny = true;
        this.applyHitToDummy(dummy, hitbox);
      }
    }

    // Check collision with active enemies
    if (this.game && this.game.enemyManager) {
      const enemies = this.game.enemyManager.getActiveEnemies();
      for (const enemy of enemies) {
        const dx = enemy.x - hitbox.x;
        const dy = enemy.y - hitbox.y;
        const dist = Math.hypot(dx, dy);

        let inRange = false;
        if (hitbox.type === 'spin') {
          inRange = dist <= (hitbox.radius + enemy.radius + 4);
        } else if (hitbox.type === 'thrust') {
          const forwardDot = (dx * Math.cos(hitbox.angle) + dy * Math.sin(hitbox.angle));
          const sideDist = Math.abs(-dx * Math.sin(hitbox.angle) + dy * Math.cos(hitbox.angle));
          inRange = (forwardDot > 0 && forwardDot <= hitbox.range + enemy.radius && sideDist <= (hitbox.width || 22) + enemy.radius);
        } else {
          const forwardDot = (dx * Math.cos(hitbox.angle) + dy * Math.sin(hitbox.angle));
          const angleDiff = Math.abs(Math.atan2(dy, dx) - hitbox.angle);
          const normAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
          inRange = (dist <= hitbox.radius + enemy.radius && Math.abs(normAngleDiff) <= 0.95);
        }

        if (inRange) {
          hitAny = true;
          let dmg = 25;
          if (hitbox.type === 'slash2') dmg = 35;
          if (hitbox.type === 'thrust') dmg = 52;
          if (hitbox.type === 'spin') dmg = 68;

          const meleeBonus = (this.game?.player?.skills?.melee || 0) * 4;
          dmg += meleeBonus;

          const angle = hitbox.type === 'spin' ? Math.atan2(enemy.y - hitbox.y, enemy.x - hitbox.x) : hitbox.angle;
          const kb = hitbox.knockback || (hitbox.type === 'thrust' ? 120 : (hitbox.type === 'spin' ? 140 : 80));
          enemy.takeDamage(dmg, angle, kb, this);
        }
      }
    }

    // Heavy thrust or spin attack camera shake impact
    if (hitAny && this.game && this.game.camera) {
      if (hitbox.type === 'thrust') {
        this.game.camera.shake(4.2, 0.16);
      } else if (hitbox.type === 'spin') {
        this.game.camera.shake(3.8, 0.15);
      }
    }

    return hitAny;
  }

  applyHitToDummy(dummy, hitbox) {
    const isThrust = (hitbox.type === 'thrust');
    const isSpin = (hitbox.type === 'spin');
    dummy.hitTimer = (isThrust || isSpin) ? 0.32 : 0.2;
    dummy.wobbleTimer = (isThrust || isSpin) ? 0.75 : 0.5;

    // Knockback
    const kb = hitbox.knockback || 80;
    const angle = isSpin ? Math.atan2(dummy.y - hitbox.y, dummy.x - hitbox.x) : hitbox.angle;
    dummy.vx += Math.cos(angle) * kb;
    dummy.vy += Math.sin(angle) * kb;

    // Wobble angular direction
    dummy.wobble = (Math.cos(angle) > 0 ? 1 : -1) * (isThrust ? 0.65 : (isSpin ? 0.55 : 0.45));

    // Hit impact sparks (Smash Bros style impact burst)
    const sparkCount = (isThrust || isSpin) ? 22 : 12;
    for (let i = 0; i < sparkCount; i++) {
      const spAngle = isThrust ? (angle + (Math.random() - 0.5) * 1.2) : (Math.random() * Math.PI * 2);
      const spSpeed = (isThrust || isSpin) ? (Math.random() * 150 + 70) : (Math.random() * 90 + 30);
      this.hitSparks.push({
        x: dummy.x,
        y: dummy.y - 8,
        vx: Math.cos(spAngle) * spSpeed,
        vy: Math.sin(spAngle) * spSpeed,
        color: isThrust ? (Math.random() > 0.4 ? '#ef4444' : '#facc15') : (isSpin ? '#38bdf8' : '#f59e0b'),
        size: Math.random() * 3 + (isThrust ? 2.0 : 1.5),
        life: isThrust ? 0.38 : 0.32,
        maxLife: isThrust ? 0.38 : 0.32
      });
    }

    // Damage / Impact label
    const label = isThrust ? '💥 KRÄFTIGER STICH!' : (isSpin ? '🌀 45 WIRBEL!' : 'TREFFER!');
    this.floatingTexts.push({
      text: label,
      x: dummy.x,
      y: dummy.y - 20,
      timer: 0,
      duration: (isThrust || isSpin) ? 0.75 : 0.55,
      color: isThrust ? '#ef4444' : (isSpin ? '#38bdf8' : '#fef08a')
    });
  }

  update(dt) {
    const map = this.game.map;
    const player = this.game.player;
    const curDim = this.game?.currentDimension || 'overworld';

    // 1. Update Flying Arrows
    for (let i = this.flyingArrows.length - 1; i >= 0; i--) {
      const arrow = this.flyingArrows[i];
      if (arrow.dimension && arrow.dimension !== curDim) continue;

      const stepX = arrow.vx * dt;
      const stepY = arrow.vy * dt;
      arrow.x += stepX;
      arrow.y += stepY;
      arrow.distTraveled += arrow.speed * dt;

      // Trailing speed particles
      arrow.trailTimer += dt;
      if (arrow.trailTimer >= 0.02) {
        arrow.trailTimer = 0;
        this.hitSparks.push({
          dimension: curDim,
          x: arrow.x,
          y: arrow.y,
          vx: -arrow.vx * 0.05 + (Math.random() - 0.5) * 10,
          vy: -arrow.vy * 0.05 + (Math.random() - 0.5) * 10,
          color: arrow.isCharged ? 'rgba(56, 189, 248, 0.7)' : 'rgba(255, 255, 255, 0.45)',
          size: arrow.isCharged ? 2.5 : 1.5,
          life: 0.2,
          maxLife: 0.2
        });
      }

      // Check active enemies hit
      let hitEnemy = false;
      if (this.game && this.game.enemyManager) {
        const enemies = this.game.enemyManager.getActiveEnemies();
        for (const enemy of enemies) {
          if (Math.hypot(enemy.x - arrow.x, enemy.y - arrow.y) <= (enemy.radius + 6)) {
            // Anti-Range: Ritter und Skorpione blocken alles, was aus der Range kommt!
            if (enemy.typeId === 'cursed_knight' || enemy.typeId === 'emperor_scorpion') {
              const sparkColor = enemy.typeId === 'cursed_knight' ? '#f1f5f9' : '#f59e0b';
              this.addHitSparks(arrow.x, arrow.y, sparkColor, 14, 80);
              this.addFloatingText('🛡️ GEBLOCKT!', enemy.x, enemy.y - 18, '#38bdf8');
              hitEnemy = true;
              break;
            }

            const dmg = arrow.isCharged ? 45 : 22;
            const kb = arrow.isCharged ? 160 : 85;
            enemy.takeDamage(dmg, arrow.angle, kb, this, true);
            hitEnemy = true;
            break;
          }
        }
      }

      // Check dummy hit
      let hitDummy = false;
      if (this.game.currentDimension === 'overworld') {
        for (const dummy of this.dummies) {
          if (Math.hypot(dummy.x - arrow.x, dummy.y - 6 - arrow.y) <= 12) {
            this.applyHitToDummy(dummy, {
              angle: arrow.angle,
              knockback: arrow.isCharged ? 160 : 80,
              type: arrow.isCharged ? 'thrust' : 'slash1'
            });
            hitDummy = true;
            break;
          }
        }
      }

      // Check solid wall / obstacle collision (arrows fly freely over water & abyss!)
      const tX = Math.floor(arrow.x / TILE_SIZE);
      const tY = Math.floor(arrow.y / TILE_SIZE);
      const hitWall = this.isArrowObstacle(map, tX, tY);

      if (hitDummy || hitEnemy || hitWall || arrow.distTraveled >= arrow.maxRange) {
        const curTile = map.getGroundTile ? map.getGroundTile(tX, tY) : (map.ground ? map.ground[tY]?.[tX] : 0);
        const inWater = this.isWaterOrAbyssTile(curTile) && !hitEnemy && !hitDummy && !hitWall;

        if (inWater) {
          // Arrow lands in water/abyss: splashes and disappears!
          this.createWaterSplash(arrow.x, arrow.y, curTile);
        } else {
          // Arrow sticks in the ground or obstacle!
          this.stuckArrows.push({
            dimension: arrow.dimension || curDim,
            x: arrow.x,
            y: arrow.y,
            angle: arrow.angle,
            quiverTimer: 0.35,
            canCollect: true
          });

          // Dust / impact puff
          for (let s = 0; s < 6; s++) {
            const spAngle = Math.random() * Math.PI * 2;
            this.hitSparks.push({
              dimension: curDim,
              x: arrow.x,
              y: arrow.y,
              vx: Math.cos(spAngle) * (Math.random() * 25 + 10),
              vy: Math.sin(spAngle) * (Math.random() * 25 + 10),
              color: 'rgba(212, 212, 216, 0.65)',
              size: Math.random() * 2 + 1,
              life: 0.22,
              maxLife: 0.22
            });
          }
        }

        this.flyingArrows.splice(i, 1);
      }
    }

    // 2. Update Stuck Arrows (quiver animation & player pickup)
    for (let i = this.stuckArrows.length - 1; i >= 0; i--) {
      const stuck = this.stuckArrows[i];
      if (stuck.dimension && stuck.dimension !== curDim) continue;

      if (stuck.quiverTimer > 0) {
        stuck.quiverTimer -= dt;
      }

      // Pickup check by player
      if (stuck.canCollect) {
        const pDist = Math.hypot(player.x - stuck.x, player.y - stuck.y);
        if (pDist <= COMBAT_CONFIG.ARROW_PICKUP_RADIUS) {
          if (player && player.ranged && player.ranged.ammo < COMBAT_CONFIG.MAX_AMMO) {
            player.ranged.ammo++;

            // Shiny green/gold pickup sparkles
            for (let p = 0; p < 8; p++) {
              const pAngle = Math.random() * Math.PI * 2;
              this.hitSparks.push({
                x: stuck.x,
                y: stuck.y - 4,
                vx: Math.cos(pAngle) * (Math.random() * 35 + 15),
                vy: Math.sin(pAngle) * (Math.random() * 35 + 15),
                color: '#4ade80',
                size: Math.random() * 2 + 1.5,
                life: 0.3,
                maxLife: 0.3
              });
            }

            this.floatingTexts.push({
              text: '+1 Pfeil 🏹',
              x: stuck.x,
              y: stuck.y - 10,
              timer: 0,
              duration: 0.5,
              color: '#86efac'
            });

            this.stuckArrows.splice(i, 1);
            continue;
          }
        }
      }
    }

    // 3. Update Slash Effects
    for (let i = this.slashEffects.length - 1; i >= 0; i--) {
      const slash = this.slashEffects[i];
      slash.timer += dt;
      if (slash.timer >= slash.duration) {
        this.slashEffects.splice(i, 1);
      }
    }

    // 4. Update Sparks / Particles
    for (let i = this.hitSparks.length - 1; i >= 0; i--) {
      const sp = this.hitSparks[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) {
        this.hitSparks.splice(i, 1);
      }
    }

    // 5. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.timer += dt;
      ft.y -= dt * 25; // Drift upwards
      if (ft.timer >= ft.duration) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 6. Update Training Dummies (physics slide & return spring)
    if (this.game.currentDimension === 'overworld') {
      for (const dummy of this.dummies) {
        dummy.x += dummy.vx * dt;
        dummy.y += dummy.vy * dt;

        // Friction
        dummy.vx *= Math.pow(0.08, dt);
        dummy.vy *= Math.pow(0.08, dt);

        // Slow elastic pull back to start position
        dummy.vx += (dummy.startX - dummy.x) * 1.5 * dt;
        dummy.vy += (dummy.startY - dummy.y) * 1.5 * dt;

        if (dummy.hitTimer > 0) dummy.hitTimer -= dt;
        if (dummy.wobbleTimer > 0) {
          dummy.wobbleTimer -= dt;
          dummy.wobble = Math.sin(dummy.wobbleTimer * 20) * 0.35 * (dummy.wobbleTimer / 0.5);
        } else {
          dummy.wobble = 0;
        }
      }
    }

    // 7. Update Enemy Projectiles
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const proj = this.enemyProjectiles[i];
      if (proj.dimension && curDim && proj.dimension !== curDim) continue;

      proj.x += proj.dirX * proj.speed * dt;
      proj.y += proj.dirY * proj.speed * dt;
      proj.distTraveled += proj.speed * dt;

      // Trail particles
      proj.trailTimer += dt;
      if (proj.trailTimer >= 0.035) {
        proj.trailTimer = 0;
        this.hitSparks.push({
          dimension: curDim,
          x: proj.x,
          y: proj.y,
          vx: -proj.dirX * 18 + (Math.random() - 0.5) * 12,
          vy: -proj.dirY * 18 + (Math.random() - 0.5) * 12,
          color: proj.color,
          size: Math.random() * 2 + 1,
          life: 0.22,
          maxLife: 0.22
        });
      }

      // Check collision with player
      const distToPlayer = Math.hypot(player.x - proj.x, player.y - proj.y);
      if (distToPlayer <= (proj.radius + player.radius) && !player.isDead) {
        player.takeDamage(proj.damage, { x: proj.dirX, y: proj.dirY });
        if (proj.slowsPlayer) player.applySlow(0.45, 2.5);
        if (proj.knockbackPlayer) {
          player.x += proj.dirX * 24;
          player.y += proj.dirY * 24;
        }
        this.addHitSparks(proj.x, proj.y, proj.color, 12);
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      // Check wall / obstacle collision or max distance (projectiles pass over water)
      const tX = Math.floor(proj.x / TILE_SIZE);
      const tY = Math.floor(proj.y / TILE_SIZE);
      const hitWall = this.isArrowObstacle(map, tX, tY);

      if (hitWall || proj.distTraveled >= proj.maxDist) {
        if (proj.spawnsPuddle) {
          this.spawnHazardPuddle(proj.x, proj.y, 20, 5.0, 10, proj.color, proj.dimension);
        }
        this.addHitSparks(proj.x, proj.y, proj.color, 8);
        this.enemyProjectiles.splice(i, 1);
      }
    }

    // 8. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      if (sw.dimension && curDim && sw.dimension !== curDim) continue;

      sw.timer += dt;
      sw.currentRadius = (sw.timer / sw.duration) * sw.maxRadius;

      if (!sw.hasHitPlayer && !player.isDead) {
        const dist = Math.hypot(player.x - sw.x, player.y - sw.y);
        if (dist <= sw.currentRadius + player.radius && dist >= sw.currentRadius - 16) {
          sw.hasHitPlayer = true;
          const hitDir = { x: (player.x - sw.x) / (dist || 1), y: (player.y - sw.y) / (dist || 1) };
          player.takeDamage(sw.damage, hitDir);
          if (sw.slowsPlayer) player.applySlow(0.4, 2.5);
        }
      }

      if (sw.timer >= sw.duration) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 9. Update Celestial Strikes
    for (let i = this.celestialStrikes.length - 1; i >= 0; i--) {
      const cs = this.celestialStrikes[i];
      if (cs.dimension && curDim && cs.dimension !== curDim) continue;

      cs.timer += dt;

      if (cs.timer >= cs.delay && !cs.impacted) {
        cs.impacted = true;
        this.addHitSparks(cs.targetX, cs.targetY, '#facc15', 26, 120);
        this.addHitSparks(cs.targetX, cs.targetY, '#38bdf8', 18, 90);
        if (this.game.camera) this.game.camera.shake(6.5, 0.25);

        const dist = Math.hypot(player.x - cs.targetX, player.y - cs.targetY);
        if (dist <= 32 && !player.isDead) {
          player.takeDamage(cs.damage, { x: 0, y: 1 });
        }
        this.celestialStrikes.splice(i, 1);
      }
    }

    // 10. Update Hazard Puddles
    for (let i = this.hazardPuddles.length - 1; i >= 0; i--) {
      const pud = this.hazardPuddles[i];
      if (pud.dimension && curDim && pud.dimension !== curDim) continue;

      pud.timer += dt;
      pud.tickTimer += dt;

      // Poison bubbles
      if (Math.random() < 0.15) {
        const pAng = Math.random() * Math.PI * 2;
        const pDist = Math.random() * pud.radius;
        this.hitSparks.push({
          dimension: curDim,
          x: pud.x + Math.cos(pAng) * pDist,
          y: pud.y + Math.sin(pAng) * pDist,
          vx: (Math.random() - 0.5) * 8,
          vy: -Math.random() * 15 - 5,
          color: pud.color,
          size: Math.random() * 2 + 1,
          life: 0.35,
          maxLife: 0.35
        });
      }

      // Check player inside puddle
      if (pud.tickTimer >= 0.5) {
        pud.tickTimer = 0;
        const dist = Math.hypot(player.x - pud.x, player.y - pud.y);
        if (dist <= pud.radius && !player.isDead && player.invulnTimer <= 0) {
          player.takeDamage(pud.damage * 0.4);
        }
      }

      if (pud.timer >= pud.duration) {
        this.hazardPuddles.splice(i, 1);
      }
    }

    // 11. Update Defeat Poof Particles
    for (let i = this.defeatPoofs.length - 1; i >= 0; i--) {
      const p = this.defeatPoofs[i];
      if (p.dimension && curDim && p.dimension !== curDim) continue;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.defeatPoofs.splice(i, 1);
      }
    }

    // 12. Update Grappling Hooks (Yeti & Trolle Enterhaken)
    for (let i = this.grapplingHooks.length - 1; i >= 0; i--) {
      const hook = this.grapplingHooks[i];
      if (hook.dimension && curDim && hook.dimension !== curDim) continue;
      if (!hook.enemy || hook.enemy.state === 'dead') {
        this.grapplingHooks.splice(i, 1);
        continue;
      }

      hook.startX = hook.enemy.x;
      hook.startY = hook.enemy.y;

      if (hook.state === 'extend') {
        hook.tipX += hook.vx * dt;
        hook.tipY += hook.vy * dt;
        hook.length = Math.hypot(hook.tipX - hook.startX, hook.tipY - hook.startY);

        const tX = Math.floor(hook.tipX / TILE_SIZE);
        const tY = Math.floor(hook.tipY / TILE_SIZE);
        const hitObstacle = this.isArrowObstacle(map, tX, tY);

        if (hitObstacle || hook.length >= hook.maxLength) {
          hook.state = 'retract';
          this.addHitSparks(hook.tipX, hook.tipY, hook.color, 6);
          continue;
        }

        const distToPlayer = Math.hypot(player.x - hook.tipX, player.y - hook.tipY);
        if (distToPlayer <= (player.radius + 8) && !player.isDead) {
          if (player.dash && player.dash.active) {
            this.addFloatingText('💨 AUSGEWICHEN!', player.x, player.y - 16, '#67e8f9');
            hook.state = 'retract';
            continue;
          }

          if (player.shield && player.shield.active && player.shield.energy > 0) {
            player.shield.energy = Math.max(0, player.shield.energy - hook.damage * 0.8);
            this.addHitSparks(player.x, player.y, '#38bdf8', 12);
            this.addFloatingText('🛡️ GEBLOCKT!', player.x, player.y - 18, '#38bdf8');
            hook.state = 'retract';
            continue;
          }

          hook.state = 'pull';
          player.takeDamage(hook.damage, { x: hook.vx, y: hook.vy });
          this.addHitSparks(player.x, player.y, '#ef4444', 14);
          this.addFloatingText('⛓️ HERANGEZOGEN!', player.x, player.y - 24, '#f59e0b');
          if (this.game.camera) this.game.camera.shake(4.5, 0.22);
        }
      } else if (hook.state === 'pull') {
        const dx = hook.enemy.x - player.x;
        const dy = hook.enemy.y - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= 36 || player.isDead) {
          hook.enemy.cooldownTimer = 0.15;
          this.grapplingHooks.splice(i, 1);
          continue;
        }

        const pullSpeed = 440;
        const stepX = (dx / dist) * pullSpeed * dt;
        const stepY = (dy / dist) * pullSpeed * dt;
        player.x += stepX;
        player.y += stepY;
        hook.tipX = player.x;
        hook.tipY = player.y;

        if (Math.random() < 0.35) {
          this.hitSparks.push({
            dimension: curDim,
            x: player.x,
            y: player.y + 4,
            vx: -stepX * 0.1,
            vy: -stepY * 0.1 - 5,
            color: '#d4d4d8',
            size: 2.2,
            life: 0.2,
            maxLife: 0.2
          });
        }
      } else if (hook.state === 'retract') {
        const dx = hook.startX - hook.tipX;
        const dy = hook.startY - hook.tipY;
        const dist = Math.hypot(dx, dy);
        if (dist <= 25) {
          this.grapplingHooks.splice(i, 1);
          continue;
        }
        const retractSpeed = 520;
        hook.tipX += (dx / dist) * retractSpeed * dt;
        hook.tipY += (dy / dist) * retractSpeed * dt;
      }
    }
  }

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  render(ctx, bounds, t) {
    this.renderHazardPuddles(ctx, t);
    this.renderShockwaves(ctx, t);
    this.renderCelestialStrikes(ctx, t);
    this.renderGrapplingHooks(ctx, t);
    this.renderStuckArrows(ctx);
    this.renderTrainingDummies(ctx, t);
    this.renderFlyingArrows(ctx);
    this.renderEnemyProjectiles(ctx, t);
    this.renderDefeatPoofs(ctx);
    this.renderSlashEffects(ctx);
    this.renderSparks(ctx);
    this.renderFloatingTexts(ctx);
  }

  renderGrapplingHooks(ctx, t) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const hook of this.grapplingHooks) {
      if (hook.dimension && curDim && hook.dimension !== curDim) continue;

      const sx = Math.round(hook.startX);
      const sy = Math.round(hook.startY);
      const tx = Math.round(hook.tipX);
      const ty = Math.round(hook.tipY);

      const dx = tx - sx;
      const dy = ty - sy;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) continue;

      ctx.save();
      // Eisenkettenglieder zeichnen
      const numLinks = Math.max(2, Math.floor(dist / 9));
      for (let j = 0; j <= numLinks; j++) {
        const lx = sx + (dx * j) / numLinks;
        const ly = sy + (dy * j) / numLinks;

        ctx.fillStyle = j % 2 === 0 ? hook.color : '#475569';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 3.2, 2.0, Math.atan2(dy, dx), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Scharfer Enterhaken-Kopf an der Spitze
      ctx.translate(tx, ty);
      ctx.rotate(Math.atan2(dy, dx));

      ctx.fillStyle = hook.hookColor || '#475569';
      ctx.fillRect(-3, -2, 6, 4);

      ctx.strokeStyle = hook.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      // Oberer Haken
      ctx.moveTo(3, -2);
      ctx.quadraticCurveTo(8, -8, 2, -10);
      // Unterer Haken
      ctx.moveTo(3, 2);
      ctx.quadraticCurveTo(8, 8, 2, 10);
      // Mitteldorn
      ctx.moveTo(2, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();

      ctx.restore();
    }
  }

  renderHazardPuddles(ctx, t) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const pud of this.hazardPuddles) {
      if (pud.dimension && pud.dimension !== curDim) continue;
      const alpha = Math.min(1.0, (pud.duration - pud.timer) / 0.5) * 0.65;
      const pulse = Math.sin(t * 5 + pud.x) * 1.5;
      const r = pud.radius + pulse;

      ctx.save();
      ctx.translate(pud.x, pud.y);

      // Puddle base
      ctx.fillStyle = pud.color;
      ctx.globalAlpha = alpha * 0.55;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer ripple
      ctx.strokeStyle = pud.color;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = alpha * 0.8;
      ctx.stroke();

      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  renderShockwaves(ctx, t) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const sw of this.shockwaves) {
      if (sw.dimension && sw.dimension !== curDim) continue;
      const alpha = 1.0 - (sw.timer / sw.duration);
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3.0 * alpha;
      ctx.globalAlpha = alpha * 0.85;
      ctx.beginPath();
      ctx.ellipse(sw.x, sw.y, sw.currentRadius, sw.currentRadius * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  renderCelestialStrikes(ctx, t) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const cs of this.celestialStrikes) {
      if (cs.dimension && cs.dimension !== curDim) continue;
      const prog = cs.timer / cs.delay;
      ctx.save();
      ctx.translate(cs.targetX, cs.targetY);

      // Ground magic rune / target circle
      const r = 24 * (0.3 + prog * 0.7);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.4 + prog * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // 4 Star points
      ctx.fillStyle = '#fde047';
      for (let st = 0; st < 4; st++) {
        const sAng = (st / 4) * Math.PI * 2 + t * 4;
        ctx.fillRect(Math.cos(sAng) * r - 2, Math.sin(sAng) * r - 2, 4, 4);
      }

      // Falling star streak during second half
      if (prog > 0.4) {
        const fallProg = (prog - 0.4) / 0.6;
        const starY = -120 * (1 - fallProg);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, starY);
        ctx.lineTo(0, starY - 24);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, starY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  renderEnemyProjectiles(ctx, t) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const proj of this.enemyProjectiles) {
      if (proj.dimension && proj.dimension !== curDim) continue;
      ctx.save();
      ctx.translate(proj.x, proj.y);

      const angle = Math.atan2(proj.dirY, proj.dirX);
      ctx.rotate(angle);

      if (proj.type === 'moss_arrow') {
        // Green leaf-arrow
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(6, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'fireball' || proj.type === 'fire_spark') {
        // Calcifer fire orb
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(1, 0, proj.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'ink_ball') {
        // Soot droplet
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'web_shot') {
        // Web cluster
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-proj.radius, 0); ctx.lineTo(proj.radius, 0);
        ctx.moveTo(0, -proj.radius); ctx.lineTo(0, proj.radius);
        ctx.stroke();
      } else if (proj.type === 'void_beam') {
        // Cosmic needle
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(-12, -2, 24, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -1, 12, 2);
      } else if (proj.type === 'wind_petal') {
        // Sakura petal
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Default glowing magic orb
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  renderDefeatPoofs(ctx) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const p of this.defeatPoofs) {
      if (p.dimension && p.dimension !== curDim) continue;
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  renderStuckArrows(ctx) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const stuck of this.stuckArrows) {
      if (stuck.dimension && stuck.dimension !== curDim) continue;
      ctx.save();
      ctx.translate(stuck.x, stuck.y);

      let wobble = 0;
      if (stuck.quiverTimer > 0) {
        wobble = Math.sin(stuck.quiverTimer * 35) * 0.3 * (stuck.quiverTimer / 0.35);
      }
      ctx.rotate(stuck.angle + wobble);

      // Shadow in ground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(-6, 2, 8, 1.5);

      // Wooden Shaft sticking into ground
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(2, 0);
      ctx.stroke();

      // Paper Fletching (White feathers)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-10, -2.5);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, 2.5);
      ctx.closePath();
      ctx.fill();

      // Collectible pulse halo
      const pulse = Math.sin(performance.now() * 0.006 + stuck.x) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(134, 239, 172, ${0.35 * pulse})`;
      ctx.beginPath();
      ctx.arc(-4, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  renderFlyingArrows(ctx) {
    const curDim = this.game?.currentDimension || 'overworld';
    for (const arrow of this.flyingArrows) {
      if (arrow.dimension && arrow.dimension !== curDim) continue;
      ctx.save();
      ctx.translate(arrow.x, arrow.y);
      ctx.rotate(arrow.angle);

      // Speed streak lines behind arrow
      ctx.strokeStyle = arrow.isCharged ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-22, -1);
      ctx.lineTo(-10, -1);
      ctx.moveTo(-20, 1);
      ctx.lineTo(-8, 1);
      ctx.stroke();

      // Wooden Shaft
      ctx.strokeStyle = arrow.isCharged ? '#0284c7' : '#92400e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(4, 0);
      ctx.stroke();

      // Paper Fletching Feathers
      ctx.fillStyle = arrow.isCharged ? '#38bdf8' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-10, -2.5);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, 2.5);
      ctx.closePath();
      ctx.fill();

      // Arrowhead (Steel / Charged Cyan Point)
      ctx.fillStyle = arrow.isCharged ? '#e0f2fe' : '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(3, -2.5);
      ctx.lineTo(3, 2.5);
      ctx.closePath();
      ctx.fill();

      // Charged Arrow Gleam
      if (arrow.isCharged) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.beginPath();
        ctx.arc(4, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  renderSlashEffects(ctx) {
    for (const slash of this.slashEffects) {
      const progress = slash.timer / slash.duration;
      const alpha = 1.0 - progress;

      ctx.save();
      ctx.translate(slash.x, slash.y);

      if (slash.type === 'spin') {
        // 360 Degree Whirling Cyclone & Shockwave Ring (Zelda Spin Attack)
        const curRadius = slash.radius * (0.75 + progress * 0.45);

        // Outer expanding air vacuum ring
        ctx.lineWidth = 2 * alpha;
        ctx.strokeStyle = `rgba(186, 230, 253, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius * 1.3, 0, Math.PI * 2);
        ctx.stroke();

        // Primary glowing cyan blade circle
        ctx.lineWidth = 5 * alpha;
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Bright white sharp cutting rim
        ctx.lineWidth = 2.2 * alpha;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Dual swirling whirlwind spiral blades
        ctx.lineWidth = 3.0 * alpha;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.92})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius * 0.78, progress * Math.PI * 5, progress * Math.PI * 5 + Math.PI * 1.4);
        ctx.stroke();

        ctx.strokeStyle = `rgba(103, 232, 249, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius * 0.6, -progress * Math.PI * 5, -progress * Math.PI * 5 + Math.PI * 1.4);
        ctx.stroke();
      }
      else if (slash.type === 'thrust') {
        // Linear Forward Powerful Thrust Blade & Dual Sonic Shockwave
        ctx.rotate(slash.angle);
        const curLen = slash.radius * (0.68 + progress * 0.55);

        // 1. Dual Shockwave Pressure Rings
        // Outer cyan air pressure wave
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.75})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(curLen * 0.5, 0, 16 * (0.6 + progress * 0.8), -Math.PI * 0.48, Math.PI * 0.48);
        ctx.stroke();

        // Inner intense white sonic boom shockwave cone
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.arc(curLen * 0.72, 0, 13 * (0.5 + progress * 0.7), -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();

        // 2. Heavy Piercing Golden Spear Blade
        // Outer radiant golden aura
        ctx.fillStyle = `rgba(254, 240, 138, ${alpha * 0.92})`;
        ctx.beginPath();
        ctx.moveTo(curLen + 8, 0);
        ctx.lineTo(curLen - 24, -7);
        ctx.lineTo(curLen - 18, 0);
        ctx.lineTo(curLen - 24, 7);
        ctx.closePath();
        ctx.fill();

        // Inner glowing white core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(curLen + 8, 0);
        ctx.lineTo(curLen - 20, -3.5);
        ctx.lineTo(curLen - 15, 0);
        ctx.lineTo(curLen - 20, 3.5);
        ctx.closePath();
        ctx.fill();

        // Diamond tip gleam star
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(curLen + 6, -1.5, 3, 3);

        // 3. Piercing Speed Streaks (4 speed lines whistling alongside)
        ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.75})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(curLen * 0.15, -7.5);
        ctx.lineTo(curLen + 3, -7.5);
        ctx.moveTo(curLen * 0.15, 7.5);
        ctx.lineTo(curLen + 3, 7.5);
        ctx.moveTo(curLen * 0.35, -3.8);
        ctx.lineTo(curLen + 9, -3.8);
        ctx.moveTo(curLen * 0.35, 3.8);
        ctx.lineTo(curLen + 9, 3.8);
        ctx.stroke();
      }
      else {
        // Radial Slash 1 & 2 (Curved Crescent Paper Blade Swoosh)
        ctx.rotate(slash.angle);
        const flip = slash.type === 'slash2' ? -1 : 1;
        const curRadius = slash.radius * (0.75 + progress * 0.35);

        // Crescent Blade Arc (~70 degree paper crescent)
        ctx.fillStyle = `rgba(240, 249, 255, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius, -0.6 * flip, 0.6 * flip, flip < 0);
        ctx.arc(0, 0, curRadius - 8, 0.6 * flip, -0.6 * flip, flip > 0);
        ctx.closePath();
        ctx.fill();

        // Sharp luminous cutting edge
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius, -0.65 * flip, 0.65 * flip, flip < 0);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  renderTrainingDummies(ctx, t) {
    if (this.game.currentDimension !== 'overworld') return;

    for (const dummy of this.dummies) {
      const dx = Math.round(dummy.x);
      const dy = Math.round(dummy.y);

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(dummy.wobble);

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 3, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wooden Center Post
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-2, -18, 4, 20);

      // Crossbar support
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, -12, 16, 3);

      // Straw & Burlap Dummy Torso (Woven Papercraft Texture)
      ctx.fillStyle = dummy.hitTimer > 0 ? '#fef08a' : '#d97706';
      ctx.beginPath();
      ctx.ellipse(0, -10, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Straw Head
      ctx.fillStyle = dummy.hitTimer > 0 ? '#ffffff' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -18, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Painted Red Target Rings on chest
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, -10, 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, -10, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Rope bindings (Rope sash)
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-4, -6, 8, 1.5);

      ctx.restore();
    }
  }

  renderSparks(ctx) {
    for (const sp of this.hitSparks) {
      const alpha = sp.life / sp.maxLife;
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(sp.x, sp.y, sp.size, sp.size);
    }
    ctx.globalAlpha = 1.0;
  }

  renderFloatingTexts(ctx) {
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 2.5;

    for (const ft of this.floatingTexts) {
      const alpha = 1.0 - (ft.timer / ft.duration);
      ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = alpha;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();
  }
}


// --- js/game.js ---

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.minimapCanvas = document.getElementById('minimapCanvas');

    this.input = {
      keys: {},
      joystick: { x: 0, y: 0, active: false },
      buttons: { A: false, B: false, X: false, Y: false },
      mouseLeft: false,
      mouseRight: false
    };

    this.touchControls = new TouchControls(this.input, (action, isDown) => this.handleTouchButton(action, isDown));
    this.combat = new CombatManager(this);

    // Multi-Dimension Maps & Core Systems
    this.overworldMap = new WorldMap();
    this.cloudMap = new CloudMap();
    this.caves = {
      main_complex: new CaveMap('main_complex'),
      sub_crystal: new CaveMap('sub_crystal'),
      forest_grotto: new CaveMap('forest_grotto'),
      snow_grotto: new CaveMap('snow_grotto'),
      void_grotto: new CaveMap('void_grotto')
    };

    this.map = this.overworldMap;
    this.currentDimension = DIMENSIONS.OVERWORLD;
    this.activeSubCave = null;

    this.enemyManager = new EnemyManager(this);

    this.spriteManager = new SpriteManager();
    this.player = new Player(this.map.spawnPoint.x, this.map.spawnPoint.y, this.map, this);
    this.camera = new Camera(window.innerWidth, window.innerHeight);
    this.minimap = new Minimap(this.minimapCanvas, this.map);

    // Day-Night Cycle System (Start at 18:30 = Golden Twilight & Lantern Awakening)
    this.gameTime = 18.5; // Hours: 0.0 - 24.0
    this.timeSpeed = 0.04; // Smooth progression (~10 mins per full 24h cycle)

    // Ambient Environmental Particles (Day Clouds & Night Spirits/Embers)
    this.ambientParticles = [];
    this.initAmbientParticles();

    // HUD Elements
    this.hpStatEl = document.getElementById('hp-stat');
    this.compactHpFillEl = document.getElementById('compact-hp-fill');
    this.compactHpTextEl = document.getElementById('compact-hp-text');
    this.compactLevelBadgeEl = document.getElementById('compact-level-badge');
    this.compactXpFillEl = document.getElementById('compact-xp-fill');
    this.compactXpTextEl = document.getElementById('compact-xp-text');

    this.biomeNameEl = document.getElementById('biome-name');
    this.speedStatEl = document.getElementById('speed-stat');
    this.deathStatEl = document.getElementById('death-stat');
    this.posStatEl = document.getElementById('pos-stat');
    this.deathOverlay = document.getElementById('death-overlay');

    // Day/Night HUD Elements
    this.timeDisplayEl = document.getElementById('time-display');
    this.timeBarFillEl = document.getElementById('time-bar-fill');
    this.lanternStatusEl = document.getElementById('lantern-status-hint');
    this.timePanelEl = document.getElementById('time-panel');

    // Character & Name Selection Wizard State
    this.compactPlayerNameEl = document.getElementById('compact-player-name');
    this.charSelectModal = document.getElementById('character-select-modal');
    this.heroNameInput = document.getElementById('hero-name-input');
    this.btnRandomName = document.getElementById('btn-random-hero-name');
    this.btnStartGame = document.getElementById('btn-start-game');
    this.charSelectGrid = document.getElementById('char-select-grid');
    this.btnOpenCharSelect = document.getElementById('btn-open-char-select');

    this.btnStep1Next = document.getElementById('btn-step1-next');
    this.btnStep2Back = document.getElementById('btn-step2-back');
    this.btnStep2Next = document.getElementById('btn-step2-next');
    this.btnStep3Back = document.getElementById('btn-step3-back');
    this.confirmHeroNameEl = document.getElementById('confirm-hero-name');
    this.confirmHeroSubEl = document.getElementById('char-confirm-sub');
    this.confirmCanvas = document.getElementById('char-confirm-canvas');
    this.confirmCtx = this.confirmCanvas ? this.confirmCanvas.getContext('2d') : null;

    this.charWizardStep = 1;
    this.isCharacterSelectOpen = !!this.charSelectModal;
    this.selectedHeroSkin = (this.player && this.player.skinId) || getSelectedSkin();
    this.charPreviewCanvases = {};

    this.lastTime = 0;
    this.animTime = 0;

    this.initEvents();
    this.initCharacterSelectModal();
    this.updatePlayerNameUI();
    this.resize();
    this.start();
  }

  initAmbientParticles() {
    this.ambientParticles = [];
    const worldW = this.map.width * TILE_SIZE;
    const worldH = this.map.height * TILE_SIZE;

    // 1. Daytime / Twilight Sakura & Leaf Petals
    for (let i = 0; i < 45; i++) {
      this.ambientParticles.push({
        type: 'petal',
        x: Math.random() * worldW,
        y: Math.random() * worldH,
        vx: (Math.random() - 0.2) * 20,
        vy: Math.random() * 14 + 10,
        swaySpeed: Math.random() * 2 + 1,
        swayOffset: Math.random() * Math.PI * 2,
        size: Math.random() * 2 + 2,
        color: Math.random() > 0.4 ? 'rgba(244, 114, 182, 0.7)' : 'rgba(110, 231, 183, 0.65)'
      });
    }

    // 2. Nighttime Floating Ofuda (Paper Talismans with Red Seals)
    for (let i = 0; i < 20; i++) {
      this.ambientParticles.push({
        type: 'ofuda',
        x: Math.random() * worldW,
        y: Math.random() * worldH,
        vx: (Math.random() - 0.3) * 16,
        vy: Math.random() * 10 + 6,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 2,
        swaySpeed: Math.random() * 1.5 + 0.8,
        swayOffset: Math.random() * Math.PI * 2
      });
    }

    // 3. Nighttime Golden Firefly Embers
    for (let i = 0; i < 35; i++) {
      this.ambientParticles.push({
        type: 'firefly',
        x: Math.random() * worldW,
        y: Math.random() * worldH,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 15 - 5, // Rising upwards
        swaySpeed: Math.random() * 3 + 2,
        swayOffset: Math.random() * Math.PI * 2,
        size: Math.random() * 1.5 + 1.2
      });
    }
  }

  updateAmbientParticles(dt) {
    const t = this.animTime;
    const worldW = this.map.width * TILE_SIZE;
    const worldH = this.map.height * TILE_SIZE;

    for (const p of this.ambientParticles) {
      p.y += p.vy * dt;
      p.x += (p.vx + Math.sin(t * p.swaySpeed + p.swayOffset) * 12) * dt;

      if (p.type === 'ofuda') {
        p.rot += p.rotSpeed * dt;
      }

      if (p.y > worldH) {
        p.y = 0;
        p.x = Math.random() * worldW;
      } else if (p.y < 0) {
        p.y = worldH;
        p.x = Math.random() * worldW;
      }
      if (p.x < 0) p.x = worldW;
      if (p.x > worldW) p.x = 0;
    }
  }

  cycleTime() {
    // Immediate toggle between Day (12:00), Sunset (18:30), and Spirit Night (22:00)
    if (this.gameTime >= 6.5 && this.gameTime < 16.0) {
      this.gameTime = 18.5; // Jump to Sunset
    } else if (this.gameTime >= 16.0 && this.gameTime < 20.5) {
      this.gameTime = 22.0; // Jump to Night
    } else {
      this.gameTime = 11.5; // Jump to Day
    }
    this.updateHUD();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        if (e.code === 'Enter' && e.target === this.heroNameInput) {
          this.goToCharWizardStep(2);
        }
        return;
      }
      if (this.isCharacterSelectOpen) {
        if (e.code === 'Enter') {
          if (this.charWizardStep === 1) this.goToCharWizardStep(2);
          else if (this.charWizardStep === 2) this.goToCharWizardStep(3);
          else if (this.charWizardStep === 3) this.startGameWithSelectedHero();
        }
        return;
      }

      this.input.keys[e.code] = true;
      if (e.repeat) return; // Prevent OS keyboard auto-repeat from resetting charge timers!

      if (e.code === 'KeyT') {
        this.cycleTime();
      }
      if (e.code === 'KeyR') {
        this.player.respawn();
      }
      if (e.code === 'Space') {
        e.preventDefault();
        this.player.triggerDash();
      }
      if (e.code === 'KeyJ') {
        this.player.startMelee();
      }
      if (e.code === 'KeyK') {
        this.player.setShield(true);
      }
      if (e.code === 'KeyL' || e.code === 'KeyF') {
        this.player.startRanged();
      }
      if (e.code === 'KeyC') {
        this.toggleSkillModal();
      }
      if (e.code === 'Escape') {
        const modal = document.getElementById('skill-modal');
        if (modal && !modal.classList.contains('hidden')) {
          this.toggleSkillModal(false);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        return;
      }
      if (this.isCharacterSelectOpen) return;

      this.input.keys[e.code] = false;
      if (e.code === 'KeyJ') {
        this.player.releaseMelee();
      }
      if (e.code === 'KeyK') {
        this.player.setShield(false);
      }
      if (e.code === 'KeyL' || e.code === 'KeyF') {
        this.player.releaseRanged();
      }
    });

    if (this.canvas) {
      this.canvas.addEventListener('mousedown', (e) => {
        if (this.isCharacterSelectOpen) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const screenX = (e.clientX - rect.left) * scaleX;
        const screenY = (e.clientY - rect.top) * scaleY;
        const zoom = this.camera ? this.camera.zoom : 1;
        const camX = this.camera ? this.camera.x : 0;
        const camY = this.camera ? this.camera.y : 0;
        const mWorldX = screenX / zoom + camX;
        const mWorldY = screenY / zoom + camY;
        const mdx = mWorldX - this.player.x;
        const mdy = mWorldY - (this.player.y - 10);
        if (Math.hypot(mdx, mdy) > 12) {
          this.player.setDirectionFromVector(mdx, mdy);
        }

        if (e.button === 0) {
          this.input.mouseLeft = true;
          this.player.startMelee();
        }
        if (e.button === 2) {
          this.input.mouseRight = true;
          this.player.setShield(true);
        }
      });

      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
          this.input.mouseLeft = false;
          this.player.releaseMelee();
        }
        if (e.button === 2) {
          this.input.mouseRight = false;
          this.player.setShield(false);
        }
      });

      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    if (this.timePanelEl) {
      this.timePanelEl.addEventListener('click', () => this.cycleTime());
    }

    // 1. Dev Tools Toggle (starts collapsed on mobile/touch screens)
    const devToolsToggleBtn = document.getElementById('dev-tools-toggle');
    const hudDropdown = document.getElementById('hud');
    const isMobile = (typeof window !== 'undefined' && (
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      Math.min(window.innerWidth, window.innerHeight) <= 600
    ));

    if (hudDropdown) {
      if (isMobile) {
        hudDropdown.classList.add('collapsed');
        if (devToolsToggleBtn) devToolsToggleBtn.classList.remove('active');
      } else {
        if (devToolsToggleBtn) devToolsToggleBtn.classList.add('active');
      }
    }

    if (devToolsToggleBtn && hudDropdown) {
      devToolsToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = hudDropdown.classList.toggle('collapsed');
        devToolsToggleBtn.classList.toggle('active', !isCollapsed);
      });
    }

    // 2. Reset / Respawn Button in Dev Tools
    const btnReset = document.getElementById('btn-reset-player');
    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        this.player.respawn();
        this.updateHUD();
        this.showToast('🔄 Spieler zurückgesetzt & respawnt!');
      });
    }

    // 2b. Monster AI Toggle Button
    const btnToggleAI = document.getElementById('btn-toggle-enemy-ai');
    if (btnToggleAI) {
      btnToggleAI.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.enemyManager) {
          this.enemyManager.aiActive = !this.enemyManager.aiActive;
          btnToggleAI.textContent = this.enemyManager.aiActive ? '👾 Monster-KI: Aktiv' : '💤 Monster-KI: Friedlich';
          btnToggleAI.style.color = this.enemyManager.aiActive ? '#4ade80' : '#94a3b8';
          this.showToast(this.enemyManager.aiActive ? '👾 Monster-KI aktiviert!' : '💤 Monster sind nun friedlich!');
        }
      });
    }

    // 2c. Respawn All Enemies Button
    const btnRespawnEnemies = document.getElementById('btn-respawn-enemies');
    if (btnRespawnEnemies) {
      btnRespawnEnemies.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.enemyManager) {
          this.enemyManager.initSpawns();
          this.showToast('✨ Alle 20 Monster-Gruppen neu gespawnt!');
        }
      });
    }

    // 2d. Biome / Monster Quick Teleport Dropdown
    const teleportSelect = document.getElementById('teleport-select');
    if (teleportSelect) {
      teleportSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (!val) return;
        const [tx, ty, dim] = val.split(',');
        const targetX = parseInt(tx, 10) * TILE_SIZE + 8;
        const targetY = parseInt(ty, 10) * TILE_SIZE + 8;
        if (dim !== this.currentDimension) {
          this.switchDimension(dim, targetX, targetY);
        } else {
          this.player.x = targetX;
          this.player.y = targetY;
          this.camera.follow(targetX, targetY);
        }
        this.showToast(`🚀 Schnellreise zu (${tx}, ${ty})!`);
        e.target.value = '';
      });
    }

    // 3. Zoom Controls (Herauszoomen / Heranzoomen)
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    this.updateZoomDisplay();

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', (e) => {
        e.stopPropagation();
        this.camera.adjustZoom(-0.25);
        this.updateZoomDisplay();
      });
    }
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.camera.adjustZoom(+0.25);
        this.updateZoomDisplay();
      });
    }

    if (this.canvas) {
      // Mouse wheel zoom
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        this.camera.adjustZoom(delta);
        this.updateZoomDisplay();
      }, { passive: false });
    }

    // 4. Minimap Collapse & Expand
    const minimapContainer = document.getElementById('minimap-container');
    const minimapToggleBtn = document.getElementById('minimap-toggle-btn');
    const minimapPillBtn = document.getElementById('minimap-pill-btn');

    if (minimapToggleBtn && minimapContainer && minimapPillBtn) {
      minimapToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        minimapContainer.classList.add('minimized');
        minimapPillBtn.classList.remove('hidden');
      });

      minimapPillBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        minimapContainer.classList.remove('minimized');
        minimapPillBtn.classList.add('hidden');
      });
    }

    // 5. Fullscreen Toggle (Vollbild)
    const fsBtn = document.getElementById('fullscreen-btn');
    const fsIcon = document.getElementById('fs-icon');
    const fsText = document.getElementById('fs-text');

    const updateFsUI = () => {
      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      if (fsIcon) fsIcon.textContent = isFs ? '🗗' : '⛶';
      if (fsText) fsText.textContent = isFs ? 'Beenden' : 'Vollbild';
    };

    const toggleFs = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {
            this.showToast('Vollbild vom Browser eingeschränkt');
          });
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          docEl.msRequestFullscreen();
        } else {
          this.showToast('Tipp: Auf iOS "Zum Home-Bildschirm" für Vollbild');
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    };

    if (fsBtn) {
      fsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFs();
      });
    }
    document.addEventListener('fullscreenchange', updateFsUI);
    document.addEventListener('webkitfullscreenchange', updateFsUI);

    // 7. Skill System UI & Modal Wiring
    const skillMenuBtn = document.getElementById('skill-menu-btn');
    if (skillMenuBtn) {
      skillMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSkillModal();
      });
    }

    const skillModalCloseBtn = document.getElementById('skill-modal-close');
    if (skillModalCloseBtn) {
      skillModalCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSkillModal(false);
      });
    }

    const skillModal = document.getElementById('skill-modal');
    if (skillModal) {
      skillModal.addEventListener('click', (e) => {
        if (e.target === skillModal) {
          this.toggleSkillModal(false);
        }
      });

      const upgradeBtns = skillModal.querySelectorAll('.skill-upgrade-btn');
      upgradeBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const skillType = btn.getAttribute('data-skill');
          if (skillType) {
            this.investSkillPoint(skillType);
          }
        });
      });
    }
  }

  updateZoomDisplay() {
    const zoomValEl = document.getElementById('zoom-val-text');
    if (zoomValEl && this.camera) {
      zoomValEl.textContent = this.camera.zoom.toFixed(2) + 'x';
    }
  }

  showToast(msg, duration = 2200) {
    const toast = document.getElementById('game-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('toast-hidden');
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add('toast-hidden');
    }, duration);
  }

  handleTouchButton(action, isDown) {
    if (this.input.joystick && this.input.joystick.active) {
      this.player.setDirectionFromVector(this.input.joystick.x, this.input.joystick.y);
    }
    if (action === 'A') {
      // Dash (Sprung nach vorn)
      if (isDown) this.player.triggerDash();
    } else if (action === 'B') {
      // Schwert (Melee: Kombo & Wirbel)
      if (isDown) this.player.startMelee();
      else this.player.releaseMelee();
    } else if (action === 'X') {
      // Bogen (Range: Pfeil & Bogen)
      if (isDown) this.player.startRanged();
      else this.player.releaseRanged();
    } else if (action === 'Y') {
      // Schild (Blaue Schutzblase)
      this.player.setShield(isDown);
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;
    this.camera.resize(this.canvas.width, this.canvas.height);
    this.updateZoomDisplay();

    if (!this.canopyCanvas) {
      this.canopyCanvas = document.createElement('canvas');
      this.canopyCtx = this.canopyCanvas.getContext('2d');
    }
    this.canopyCanvas.width = this.canvas.width;
    this.canopyCanvas.height = this.canvas.height;
    this.canopyCtx.imageSmoothingEnabled = false;
  }

  switchDimension(targetDim, targetX, targetY) {
    if (targetDim === 'overworld') {
      this.map = this.overworldMap;
      this.currentDimension = DIMENSIONS.OVERWORLD;
      this.activeSubCave = null;
    } else if (targetDim === 'clouds') {
      this.map = this.cloudMap;
      this.currentDimension = DIMENSIONS.CLOUDS;
      this.activeSubCave = null;
    } else if (this.caves[targetDim]) {
      this.map = this.caves[targetDim];
      this.currentDimension = DIMENSIONS.CAVES;
      this.activeSubCave = targetDim;
    }

    this.player.map = this.map;
    this.player.x = targetX;
    this.player.y = targetY;
    this.player.lastTransitionTile = {
      x: Math.floor(targetX / TILE_SIZE),
      y: Math.floor(targetY / TILE_SIZE)
    };
    this.camera.setWorldBounds(this.map.width, this.map.height);
    this.camera.follow(targetX, targetY);
    this.minimap.setMap(this.map, this.currentDimension);
    this.updateHUD();
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    this.animTime += dt;

    this.update(dt);
    this.render();

    requestAnimationFrame((time) => this.loop(time));
  }

  update(dt) {
    if (this.isCharacterSelectOpen) {
      this.updateCharacterSelectPreviews(dt);
      return;
    }

    // 1. Advance Day-Night Clock
    this.gameTime = (this.gameTime + dt * this.timeSpeed) % 24;

    this.spriteManager.update(dt);
    this.player.update(dt, this.input);
    if (this.enemyManager) this.enemyManager.update(dt, this.player, this.map, this.combat);
    if (this.combat) this.combat.update(dt);
    this.camera.follow(this.player.x, this.player.y);
    this.camera.update(dt);
    this.updateAmbientParticles(dt);

    this.updateHUD();
    this.updateCombatUI();
  }

  getDayNightFactors() {
    const t = this.gameTime;

    // Sunlight: peak at 12h, zero between 20h and 05h
    let sunlight = 0;
    if (t >= 6.0 && t <= 18.0) {
      sunlight = Math.sin(((t - 6.0) / 12.0) * Math.PI);
    }

    // Sunset factor: peak around 18.0 - 19.5
    let sunset = 0;
    if (t >= 16.5 && t <= 20.0) {
      sunset = Math.sin(((t - 16.5) / 3.5) * Math.PI);
    }

    // Night factor: 1.0 during 20.5 - 04.5
    let night = 0;
    if (t >= 20.0 || t <= 5.5) {
      if (t >= 20.0) night = Math.min(1.0, (t - 20.0) / 1.5);
      else if (t <= 5.5) night = Math.max(0.0, 1.0 - (t - 4.0) / 1.5);
    }

    return { sunlight, sunset, night };
  }

  updateHUD() {
    const tileX = Math.floor(this.player.x / TILE_SIZE);
    const tileY = Math.floor(this.player.y / TILE_SIZE);
    const currentBiome = this.map.getBiome(tileX, tileY);

    if (this.biomeNameEl) {
      let worldPrefix = '';
      if (this.currentDimension === DIMENSIONS.CLOUDS) {
        worldPrefix = '☁️ [Wolkenreich] ';
        this.biomeNameEl.style.color = '#f472b6';
        this.biomeNameEl.textContent = worldPrefix + (this.map.name || 'Rosa Wolkenmeer');
      } else if (this.currentDimension === DIMENSIONS.CAVES) {
        worldPrefix = '🪨 [Höhlenwelt] ';
        const cTheme = this.map.getTheme ? this.map.getTheme(tileX, tileY) : 'main';
        if (cTheme === 'snow') this.biomeNameEl.style.color = '#38bdf8';
        else if (cTheme === 'void') this.biomeNameEl.style.color = '#c084fc';
        else if (cTheme === 'forest') this.biomeNameEl.style.color = '#4ade80';
        else if (cTheme === 'desert') this.biomeNameEl.style.color = '#fbbf24';
        else if (cTheme === 'swamp') this.biomeNameEl.style.color = '#a3e635';
        else if (cTheme === 'crystal') this.biomeNameEl.style.color = '#818cf8';
        else this.biomeNameEl.style.color = '#cbd5e1';

        this.biomeNameEl.textContent = worldPrefix + (this.map.name || currentBiome);
      } else {
        if (currentBiome.includes('Leere')) {
          this.biomeNameEl.style.color = '#e066ff';
        } else if (currentBiome.includes('Wüste')) {
          this.biomeNameEl.style.color = '#ffda73';
        } else if (currentBiome.includes('Schnee')) {
          this.biomeNameEl.style.color = '#aee1f7';
        } else if (currentBiome.includes('Sumpf')) {
          this.biomeNameEl.style.color = '#8bc34a';
        } else {
          this.biomeNameEl.style.color = '#55e6a5';
        }
        this.biomeNameEl.textContent = currentBiome;
      }
    }

    if (this.speedStatEl) {
      if (this.player.speedMod < 0.5) {
        this.speedStatEl.textContent = '35% (Treibsand!)';
        this.speedStatEl.style.color = '#ff9800';
      } else if (this.player.isSprinting && this.player.isMoving) {
        this.speedStatEl.textContent = '150% (Sprint)';
        this.speedStatEl.style.color = '#38bdf8';
      } else {
        this.speedStatEl.textContent = '100%';
        this.speedStatEl.style.color = '#55e6a5';
      }
    }

    if (this.deathStatEl) this.deathStatEl.textContent = this.player.deathCount;
    if (this.posStatEl) {
      const elev = this.player.elevation;
      const elevText = elev === 0 ? 'Boden (0)' : (elev > 0 ? `Podest +${elev}` : `Loch ${elev}`);
      const shrinesFound = this.player.discoveredShrines ? this.player.discoveredShrines.size : 0;
      this.posStatEl.textContent = `X: ${tileX}, Y: ${tileY} | ${elevText} | ⛩️ Schreine: ${shrinesFound}`;
    }

    if (this.deathOverlay) {
      if (this.player.isDead) {
        this.deathOverlay.classList.remove('hidden');
        const info = this.player.lastDeathInfo;
        const titleEl = document.getElementById('death-title');
        const descEl = document.getElementById('death-desc');
        const detailsEl = document.getElementById('death-penalty-details');
        const levelEl = document.getElementById('death-penalty-level');
        const xpEl = document.getElementById('death-penalty-xp');
        const skillsEl = document.getElementById('death-penalty-skills');

        if (info) {
          if (titleEl) titleEl.textContent = info.cause === 'enemy' ? 'IM KAMPF GEFALLEN!' : 'IN DIE LEERE GESTÜRZT!';
          if (descEl) descEl.textContent = info.cause === 'enemy' ? `${this.player.name || 'Held'} wurde von einem Monster überwältigt...` : `${this.player.name || 'Held'} stürzte in den ewigen Abgrund...`;
          if (detailsEl) detailsEl.classList.remove('hidden');
          if (levelEl) levelEl.textContent = `⚡ Level halbiert: Lv. ${info.oldExactLevel.toFixed(2)} → Lv. ${info.newExactLevel.toFixed(2)}`;
          if (xpEl) xpEl.textContent = `✨ ${info.dropXp} EP als Beute gedroppt`;
          if (skillsEl) {
            if (info.skillsReducedCount > 0) {
              skillsEl.textContent = `🛡️ ${info.skillsReducedCount} Skillpunkt${info.skillsReducedCount > 1 ? 'e' : ''} gleichmäßig abgebaut`;
              skillsEl.classList.remove('hidden');
            } else {
              skillsEl.classList.add('hidden');
            }
          }
        }
      } else {
        this.deathOverlay.classList.add('hidden');
      }
    }

    // Time-of-Day HUD Update
    if (this.timeDisplayEl) {
      const hours = Math.floor(this.gameTime);
      const minutes = Math.floor((this.gameTime % 1) * 60);
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      const { sunlight, sunset, night } = this.getDayNightFactors();
      let icon = '☀️ Tag';
      let col = '#38bdf8';
      let lanternText = 'Lampions aus';
      let lanternCol = '#94a3b8';

      if (night > 0.3) {
        icon = '🌙 Geisternacht';
        col = '#818cf8';
        lanternText = '🏮 Lampions an';
        lanternCol = '#fbbf24';
      } else if (sunset > 0.2 || (this.gameTime >= 17 && this.gameTime <= 20)) {
        icon = '🏮 Dämmerung';
        col = '#f59e0b';
        lanternText = '🏮 Lampions an';
        lanternCol = '#f59e0b';
      } else if (this.gameTime < 6.5) {
        icon = '🌅 Morgengrauen';
        col = '#f472b6';
        lanternText = 'Lampions aus';
      }

      if (this.currentDimension === DIMENSIONS.CAVES) {
        lanternText = '🏮 Höhlenlampe an';
        lanternCol = '#fbbf24';
      }

      this.timeDisplayEl.textContent = `${timeStr} ${icon}`;
      this.timeDisplayEl.style.color = col;

      if (this.timeBarFillEl) {
        this.timeBarFillEl.style.width = `${(this.gameTime / 24) * 100}%`;
      }
      if (this.lanternStatusEl) {
        this.lanternStatusEl.textContent = lanternText;
        this.lanternStatusEl.style.color = lanternCol;
      }
    }
  }

  updateCombatUI() {
    // 1. Update Ammo counters
    const ammoEl = document.getElementById('ammo-count');
    if (ammoEl && this.player && this.player.ranged) {
      ammoEl.textContent = this.player.ranged.ammo;
    }
    const ammoStatEl = document.getElementById('ammo-stat');
    if (ammoStatEl && this.player && this.player.ranged) {
      ammoStatEl.textContent = `${this.player.ranged.ammo} / 30`;
    }

    // 2. Update Shield meter & status
    const shieldFillEl = document.getElementById('shield-meter-fill');
    if (shieldFillEl && this.player && this.player.shield) {
      const pct = Math.max(0, Math.min(100, (this.player.shield.energy / 100) * 100));
      shieldFillEl.style.width = `${pct}%`;
      if (this.player.shield.broken) {
        shieldFillEl.className = 'broken';
      } else if (pct < 30) {
        shieldFillEl.className = 'warning';
      } else if (!this.player.shield.active && pct < 100) {
        if (this.player.shield.rechargeDelay > 0) {
          shieldFillEl.className = 'paused';
        } else {
          shieldFillEl.className = 'recharging';
        }
      } else {
        shieldFillEl.className = '';
      }
    }
    const shieldStatEl = document.getElementById('shield-stat');
    if (shieldStatEl && this.player && this.player.shield) {
      if (this.player.shield.broken) {
        const pct = Math.round(this.player.shield.energy);
        if (this.player.shield.stunTimer > 0) {
          shieldStatEl.textContent = 'ZERBROCHEN (Stun!)';
        } else {
          shieldStatEl.textContent = `ZERBROCHEN (Lädt: ${pct}%)`;
        }
        shieldStatEl.style.color = '#ef4444';
      } else {
        const pct = Math.round(this.player.shield.energy);
        if (this.player.shield.rechargeDelay > 0 && pct < 100) {
          shieldStatEl.textContent = `${pct}% (1s Pause...)`;
          shieldStatEl.style.color = '#f59e0b';
        } else {
          shieldStatEl.textContent = `${pct}%`;
          shieldStatEl.style.color = pct < 30 ? '#ef4444' : '#38bdf8';
        }
      }
    }

    // 3. Update Player HP display (Dev Tools & Compact Status Pill)
    if (this.player) {
      const curHp = Math.max(0, Math.round(this.player.hp));
      const maxHp = this.player.maxHp || 100;
      const hpPct = Math.max(0, Math.min(1.0, curHp / maxHp));

      if (this.hpStatEl) {
        this.hpStatEl.textContent = `${curHp} / ${maxHp}`;
        this.hpStatEl.style.color = hpPct > 0.5 ? '#4ade80' : (hpPct > 0.25 ? '#facc15' : '#ef4444');
      }

      if (this.compactHpFillEl) {
        this.compactHpFillEl.style.width = `${Math.round(hpPct * 100)}%`;
        this.compactHpFillEl.style.background = hpPct > 0.5
          ? 'linear-gradient(90deg, #22c55e, #4ade80)'
          : (hpPct > 0.25 ? 'linear-gradient(90deg, #d97706, #facc15)' : 'linear-gradient(90deg, #dc2626, #f87171)');
      }
      if (this.compactHpTextEl) {
        this.compactHpTextEl.textContent = `${curHp} / ${maxHp}`;
      }

      // XP & Level Progression
      const curXp = Math.max(0, Math.round(this.player.xp || 0));
      const xpToNext = this.player.xpToNext || 50;
      const curLevel = this.player.level || 1;
      const xpPct = Math.max(0, Math.min(1.0, curXp / xpToNext));

      if (this.compactLevelBadgeEl) {
        this.compactLevelBadgeEl.textContent = `Lv. ${curLevel}`;
      }
      if (this.compactXpFillEl) {
        this.compactXpFillEl.style.width = `${Math.round(xpPct * 100)}%`;
      }
      if (this.compactXpTextEl) {
        this.compactXpTextEl.textContent = `${curXp} / ${xpToNext}`;
      }

      // 4. Skill Menu Button & Blinking Notification
      const skillBtn = document.getElementById('skill-menu-btn');
      const skillBadge = document.getElementById('skill-badge');
      const points = this.player.skillPoints || 0;
      if (skillBtn) {
        if (points > 0) {
          skillBtn.classList.remove('hidden');
          skillBtn.classList.add('blinking');
          if (skillBadge) {
            skillBadge.textContent = points;
            skillBadge.classList.remove('hidden');
          }
        } else {
          skillBtn.classList.remove('blinking');
          if (skillBadge) {
            skillBadge.classList.add('hidden');
          }
          const hasInvested = Boolean(this.player.skills && (
            this.player.skills.hp > 0 ||
            this.player.skills.melee > 0 ||
            this.player.skills.range > 0 ||
            this.player.skills.shield > 0
          ));
          if (curLevel > 1 || hasInvested) {
            skillBtn.classList.remove('hidden');
          } else {
            skillBtn.classList.add('hidden');
          }
        }
      }

      // Synchronize modal if it is currently open
      this.updateSkillModal();
    }
  }

  toggleSkillModal(forceState = null) {
    const modal = document.getElementById('skill-modal');
    if (!modal) return;
    const isClosed = modal.classList.contains('hidden');
    const shouldOpen = forceState !== null ? forceState : isClosed;
    if (shouldOpen) {
      modal.classList.remove('hidden');
      this.updateSkillModal();
    } else {
      modal.classList.add('hidden');
    }
  }

  updateSkillModal() {
    if (!this.player) return;
    const modal = document.getElementById('skill-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    const points = this.player.skillPoints || 0;
    const pointsEl = document.getElementById('skill-points-counter');
    if (pointsEl) {
      pointsEl.textContent = points;
      pointsEl.style.color = points > 0 ? '#4ade80' : '#94a3b8';
    }

    const skills = this.player.skills || { hp: 0, melee: 0, range: 0, shield: 0 };

    // Update Counts and Stat Information
    const hpCount = document.getElementById('skill-count-hp');
    const hpBonus = document.getElementById('skill-bonus-hp');
    if (hpCount) hpCount.textContent = skills.hp;
    if (hpBonus) hpBonus.textContent = `(+${skills.hp * 15} HP)`;

    const meleeCount = document.getElementById('skill-count-melee');
    const meleeBonus = document.getElementById('skill-bonus-melee');
    if (meleeCount) meleeCount.textContent = skills.melee;
    if (meleeBonus) meleeBonus.textContent = `(+${skills.melee * 4} DMG)`;

    const rangeCount = document.getElementById('skill-count-range');
    const rangeBonus = document.getElementById('skill-bonus-range');
    if (rangeCount) rangeCount.textContent = skills.range;
    if (rangeBonus) rangeBonus.textContent = skills.range > 0 ? `(+${skills.range * 25} Spd / +${skills.range * 35} Rng)` : `(Standard)`;

    const shieldCount = document.getElementById('skill-count-shield');
    const shieldBonus = document.getElementById('skill-bonus-shield');
    if (shieldCount) shieldCount.textContent = skills.shield;
    if (shieldBonus) shieldBonus.textContent = `(+${skills.shield * 15} Energie & Block+)`;

    // Disable / Enable Upgrade Buttons depending on available points
    const buttons = modal.querySelectorAll('.skill-upgrade-btn');
    buttons.forEach((btn) => {
      btn.disabled = (points <= 0);
      btn.classList.toggle('disabled', points <= 0);
    });
  }

  investSkillPoint(type) {
    if (!this.player || this.player.skillPoints <= 0) return;
    const success = this.player.investSkillPoint(type);
    if (success) {
      this.updateCombatUI();
      this.updateSkillModal();
    }
  }

  // ==========================================================================
  // DARK GHIBLI 2.5D PAPERCRAFT RENDERING ENGINE (Mononoke + Chihiro Hybrid)
  // ==========================================================================
  render() {
    const t = this.animTime;

    if (this.currentDimension === DIMENSIONS.CLOUDS) {
      this.renderCloudDimension(this.camera.getVisibleTileBounds(), t);
    } else if (this.currentDimension === DIMENSIONS.CAVES) {
      this.renderCaveDimension(this.camera.getVisibleTileBounds(), t);
    } else {
      const { sunlight, sunset, night } = this.getDayNightFactors();

      // 1. Clear Viewport (Midnight Cardboard Base)
      this.ctx.fillStyle = '#0f1322';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // 2. Camera Transform
      this.camera.apply(this.ctx);

      const bounds = this.camera.getVisibleTileBounds();

      // 3. LAYER 1: 2.5D Layered Paper Ground Tiles (Cardstock sheets & cut bevels)
      this.renderPaperGroundTiles(bounds, sunlight, sunset, night, t);

      // 4. LAYER 2: Sunken Riverbed with flowing paper wave ribbons
      this.renderPaperWaterRibbons(bounds, t);

      // 5. LAYER 3: Red Lacquered Paper Bridges
      this.renderPaperBridges(bounds);

      // 6. LAYER 4: Dynamic Warm Lantern Light Cones (Twilight & Night)
      if (night > 0.05 || sunset > 0.05) {
        this.renderLanternLightCones(bounds, t, night, sunset);
      }

      // 7. LAYER 5: Ground Props (Origami Boulders, Stone Lanterns, Paper Mushrooms, Trampolines, Cave Entrances, Shrines)
      this.renderGroundProps(bounds, t, night);

      // 8. LAYER 6: Y-Sorted Entities (Scalloped Paper Trees, Kodama Spirits, Player)
      this.renderYSortedEntities(bounds, t, night);

      // Combat layer: flying arrows, slashes, hit effects, floating texts, training dummies
      if (this.combat) {
        this.combat.render(this.ctx, bounds, t);
      }

      // 9. LAYER 7: Dense Forest Canopy Roof with Circular Vision Cutout around Player
      this.renderForestCanopy(bounds, t);

      // 10. LAYER 8: Ambient Environmental Particles (Day Clouds, Night Ofuda, Fireflies)
      this.renderEnvironmentalAtmosphere(bounds, t, sunlight, night);

      this.camera.release(this.ctx);

      // 11. LAYER 9: Global Ambient Day/Night Lighting Wash & Forest Shade
      this.renderGlobalLightingWash(sunlight, sunset, night);
    }

    // 12. Screen Overlay: Floating Shrine Discovery Banner
    if (this.player.shrineMessage) {
      this.renderShrineBanner(this.player.shrineMessage);
    }

    // 13. LAYER 10: Minimap
    this.minimap.render(this.player, this.camera);
  }

  renderPaperGroundTiles(bounds, sunlight, sunset, night, t) {
    const ts = TILE_SIZE;
    const startY = Math.max(0, bounds.startY - 2);
    const endY = Math.min(this.map.height, bounds.endY + 2);
    const startX = Math.max(0, bounds.startX - 1);
    const endX = Math.min(this.map.width, bounds.endX + 1);

    // ========================================================================
    // PASS 1: Base ground cardstock surfaces & animated biome textures
    // ========================================================================
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.map.getGroundTile(x, y);
        const elev = this.map.getElevation(x, y);
        const px = x * ts;
        const py = y * ts;
        const surfaceY = py - elev * ELEVATION_PIXEL_OFFSET;

        let baseCol = '#224434'; // Mononoke Jade Cardstock (Grass)
        let isElevated = true;

        if (tile === TILES.DIRT) {
          baseCol = '#382d24';
        } else if (tile === TILES.SAND) {
          baseCol = '#dfb867'; // Warm golden desert sand
        } else if (tile === TILES.QUICKSAND) {
          baseCol = '#6b4317'; // Treibsand: sunken dark amber mud
          isElevated = false;
        } else if (tile === TILES.SNOW) {
          baseCol = '#5f758c'; // Frosted Lavender Cardstock
        } else if (tile === TILES.SWAMP_GROUND) {
          baseCol = '#1c2e22'; // Swamp Moss Paper
        } else if (tile === TILES.WATER || tile === TILES.SWAMP_WATER) {
          baseCol = '#0c1620'; // Sunken Cut Riverbed
          isElevated = false;
        } else if (tile === TILES.VOID_GROUND) {
          baseCol = '#221236'; // Solid deep obsidian twilight cardstock
        } else if (tile === TILES.VOID_LAKE) {
          baseCol = '#030008'; // Das Leerenmeer: endloser kosmischer Schlund
          isElevated = false;
        } else if (tile === TILES.BRIDGE_H || tile === TILES.BRIDGE_V) {
          baseCol = '#4d1e1c';
        }

        // Base card tile surface
        this.ctx.fillStyle = baseCol;
        this.ctx.fillRect(px, surfaceY, ts, ts);

        // Elevation-based shading ("heller nach oben, dunkler nach unten"):
        if (elev === ELEVATION.LEVEL_2) {
          // Level +2: deutlich heller & leuchtender
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
          this.ctx.fillRect(px, surfaceY, ts, ts);
        } else if (elev === ELEVATION.LEVEL_1) {
          // Level +1: spürbar heller
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          this.ctx.fillRect(px, surfaceY, ts, ts);
        } else if (elev === ELEVATION.HOLE) {
          // Level -1 (Loch): deutlich dunkler / tief abgesenkt
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
          this.ctx.fillRect(px, surfaceY, ts, ts);
        }

        // 2.5D Physical Cardstock Thickness & Highlights
        if (isElevated && elev >= 0) {
          // Top cut edge highlight bevel (extra crisp for higher tiers)
          const bevelAlpha = elev === ELEVATION.LEVEL_2 ? 'rgba(255, 255, 255, 0.38)' : 'rgba(255, 255, 255, 0.20)';
          this.ctx.fillStyle = bevelAlpha;
          this.ctx.fillRect(px, surfaceY, ts, 1.8);

          // Bottom edge shadow when neighbor to South is at same or higher elevation
          const elevS = (y + 1 < this.map.height) ? this.map.getElevation(x, y + 1) : elev;
          if (elevS >= elev) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            this.ctx.fillRect(px, surfaceY + ts - 2, ts, 2);
          }
        }

        // --- SPECIAL TERRAIN DETAILS (Rendered relative to surfaceY) ---
        // 1. WÜSTENSAND DETAILS (Windrippeln, Dünenkämme, Quarzglitzer)
        if (tile === TILES.SAND) {
          const dune = Math.sin(x * 0.45 + y * 0.85);
          if (dune > 0.4) {
            this.ctx.fillStyle = '#f3d88c'; // Lichter Dünenkamm
            this.ctx.fillRect(px + 1, surfaceY + 4, 14, 1.5);
            this.ctx.fillRect(px + 4, surfaceY + 11, 10, 1.5);
          } else if (dune < -0.4) {
            this.ctx.fillStyle = '#c89943'; // Warmer Schattensaum der Düne
            this.ctx.fillRect(px + 2, surfaceY + 6, 12, 1);
            this.ctx.fillRect(px + 1, surfaceY + 13, 13, 1);
          }
          // Feine Sandkörnchen
          if ((x * 23 + y * 37) % 7 === 0) {
            this.ctx.fillStyle = '#fff4ce';
            this.ctx.fillRect(px + 5, surfaceY + 7, 1.5, 1.5);
          } else if ((x * 19 + y * 29) % 9 === 0) {
            this.ctx.fillStyle = '#b78330';
            this.ctx.fillRect(px + 10, surfaceY + 3, 1.5, 1.5);
          }
        }

        // 2. TREIBSAND (Wirbelnder Mahlstrom, Schlickkrater, Blubberblasen)
        else if (tile === TILES.QUICKSAND) {
          // Krater-Innenschatten (abgesenkt)
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          this.ctx.fillRect(px, surfaceY, ts, 2);
          this.ctx.fillRect(px, surfaceY, 2, ts);

          // Dynamischer Wirbel
          const gcx = 28 * ts + 8;
          const gcy = 72 * ts + 8;
          const gdx = (px + 8) - gcx;
          const gdy = (surfaceY + 8) - gcy;
          const dist = Math.hypot(gdx, gdy);
          const angle = Math.atan2(gdy, gdx) + dist * 0.08 - t * 2.8;
          const swirl = Math.sin(angle * 3.5);

          if (swirl > 0.3) {
            this.ctx.fillStyle = '#a6762f';
            this.ctx.fillRect(px + 2, surfaceY + 4, 12, 2);
          } else if (swirl < -0.3) {
            this.ctx.fillStyle = '#452608';
            this.ctx.fillRect(px + 3, surfaceY + 9, 10, 2);
          }

          // Aufsteigende Schlickblasen
          const bubblePhase = Math.sin(t * 3.5 + x * 7 + y * 11);
          if (bubblePhase > 0.65) {
            this.ctx.fillStyle = '#d49b42';
            this.ctx.fillRect(px + 7, surfaceY + 6, 2, 2);
            this.ctx.fillStyle = '#fff0ba';
            this.ctx.fillRect(px + 7, surfaceY + 6, 1, 1);
          }
        }

        // 3. SOLID VOID GROUND (Fester Leerenboden)
        else if (tile === TILES.VOID_GROUND) {
          if ((x * 17 + y * 23) % 7 === 0) {
            this.ctx.fillStyle = 'rgba(192, 132, 252, 0.85)';
            this.ctx.fillRect(px + 6, surfaceY + 6, 2, 2);
          } else if ((x * 13 + y * 31) % 9 === 0) {
            this.ctx.fillStyle = 'rgba(147, 51, 234, 0.6)';
            this.ctx.fillRect(px + 3, surfaceY + 10, 3, 1);
          }
        }

        // 4. LEERENMEER (Tödlicher kosmischer Abgrund)
        else if (tile === TILES.VOID_LAKE) {
          const vcx = 112 * ts + 8;
          const vcy = 62 * ts + 8;
          const vdx = (px + 8) - vcx;
          const vdy = (surfaceY + 8) - vcy;
          const vdist = Math.hypot(vdx, vdy);
          const vAngle = Math.atan2(vdy, vdx) + vdist * 0.06 - t * 1.8;
          const vWave = Math.sin(vAngle * 3.0 + vdist * 0.1);

          if (vWave > 0.35) {
            this.ctx.fillStyle = 'rgba(126, 34, 206, 0.45)';
            this.ctx.fillRect(px + 2, surfaceY + 5, 12, 2);
          } else if (vWave < -0.35) {
            this.ctx.fillStyle = 'rgba(88, 28, 135, 0.35)';
            this.ctx.fillRect(px + 3, surfaceY + 9, 10, 2);
          }

          const spark = Math.sin(t * 4.5 + x * 13 + y * 19);
          if (spark > 0.72) {
            this.ctx.fillStyle = 'rgba(232, 121, 249, 0.9)';
            this.ctx.fillRect(px + 6, surfaceY + 7, 2, 2);
          }

          const neighbors = this.map.getNeighbors(x, y);
          const hasSolidNeighbor = (
            neighbors.N !== TILES.VOID_LAKE ||
            neighbors.S !== TILES.VOID_LAKE ||
            neighbors.W !== TILES.VOID_LAKE ||
            neighbors.E !== TILES.VOID_LAKE
          );

          if (hasSolidNeighbor) {
            const glowPulse = Math.sin(t * 4.0 + (x + y) * 0.5) * 0.2 + 0.8;
            this.ctx.fillStyle = `rgba(192, 132, 252, ${0.75 * glowPulse})`;
            if (neighbors.N !== TILES.VOID_LAKE) this.ctx.fillRect(px, surfaceY, ts, 2.5);
            if (neighbors.S !== TILES.VOID_LAKE) this.ctx.fillRect(px, surfaceY + ts - 2.5, ts, 2.5);
            if (neighbors.W !== TILES.VOID_LAKE) this.ctx.fillRect(px, surfaceY, 2.5, ts);
            if (neighbors.E !== TILES.VOID_LAKE) this.ctx.fillRect(px + ts - 2.5, surfaceY, 2.5, ts);

            this.ctx.fillStyle = `rgba(244, 114, 182, ${0.9 * glowPulse})`;
            if (neighbors.N !== TILES.VOID_LAKE) this.ctx.fillRect(px + 2, surfaceY, ts - 4, 1);
            if (neighbors.S !== TILES.VOID_LAKE) this.ctx.fillRect(px + 2, surfaceY + ts - 1, ts - 4, 1);
            if (neighbors.W !== TILES.VOID_LAKE) this.ctx.fillRect(px, surfaceY + 2, 1, ts - 4);
            if (neighbors.E !== TILES.VOID_LAKE) this.ctx.fillRect(px + ts - 1, surfaceY + 2, 1, ts - 4);
          }
        }
      }
    }

    // ========================================================================
    // PASS 2: 2.5D Physical Cardstock Cliffs, Slopes / Ramps, and Depth Shadows
    // ========================================================================
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.map.getGroundTile(x, y);
        const elev = this.map.getElevation(x, y);
        const ramp = this.map.getRamp(x, y);
        const px = x * ts;
        const py = y * ts;
        const surfaceY = py - elev * ELEVATION_PIXEL_OFFSET;

        // 1. DIRECTIONAL RAMPS (Folded paper ramps with wooden/stone steps)
        if (ramp !== RAMPS.NONE) {
          this.renderRampTile(px, surfaceY, ramp, elev, tile);
        }

        // 2. INNER RIM SHADOWS FOR HOLES (-1)
        if (elev === ELEVATION.HOLE) {
          const elevN = (y - 1 >= 0) ? this.map.getElevation(x, y - 1) : 0;
          const elevW = (x - 1 >= 0) ? this.map.getElevation(x - 1, y) : 0;
          const elevE = (x + 1 < this.map.width) ? this.map.getElevation(x + 1, y) : 0;
          const elevS = (y + 1 < this.map.height) ? this.map.getElevation(x, y + 1) : 0;

          // Massiv verstärkte Innenschatten im Loch
          if (elevN > ELEVATION.HOLE) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            this.ctx.fillRect(px, surfaceY, ts, 3.5);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            this.ctx.fillRect(px, surfaceY + 3.5, ts, 2.5);
          }
          if (elevW > ELEVATION.HOLE) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            this.ctx.fillRect(px, surfaceY, 3.5, ts);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            this.ctx.fillRect(px + 3.5, surfaceY, 2, ts);
          }
          if (elevE > ELEVATION.HOLE) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            this.ctx.fillRect(px + ts - 3.5, surfaceY, 3.5, ts);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            this.ctx.fillRect(px + ts - 5.5, surfaceY, 2, ts);
          }
          if (elevS > ELEVATION.HOLE) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            this.ctx.fillRect(px, surfaceY + ts - 3, ts, 3);
          }
          // Pit cracks and dark pebbles at bottom of hole
          if ((x * 19 + y * 29) % 4 === 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(px + 4, surfaceY + 7, 4, 2.5);
          }
        }

        // 3. SOUTH-FACING PHYSICAL CLIFF FACES (Abbrüche nach Süden)
        const elevS = (y + 1 < this.map.height) ? this.map.getElevation(x, y + 1) : elev;
        const rampS = (y + 1 < this.map.height) ? this.map.getRamp(x, y + 1) : RAMPS.NONE;

        if (elev > elevS && rampS !== RAMPS.UP_NORTH && ramp !== RAMPS.UP_SOUTH) {
          const cliffH = (elev - elevS) * ELEVATION_PIXEL_OFFSET;
          const cliffTopY = surfaceY + ts;
          const cliffBottomY = cliffTopY + cliffH;

          // Biome-specific cliff face palette (hoher Kontrast & Plastizität)
          let cliffBase = '#20160f';
          let cliffLine = '#352518';
          let cliffHighlight = 'rgba(255, 255, 255, 0.22)';

          if (tile === TILES.SAND || tile === TILES.QUICKSAND) {
            cliffBase = '#8a5e1d'; cliffLine = '#664512'; cliffHighlight = '#ffd98c';
          } else if (tile === TILES.SNOW) {
            cliffBase = '#2c3947'; cliffLine = '#1f2933'; cliffHighlight = '#94a9bf';
          } else if (tile === TILES.VOID_GROUND || tile === TILES.VOID_LAKE) {
            cliffBase = '#110620'; cliffLine = '#230b3d'; cliffHighlight = '#d8b4fe';
          } else if (tile === TILES.SWAMP_GROUND || tile === TILES.SWAMP_WATER) {
            cliffBase = '#0e1710'; cliffLine = '#080d09'; cliffHighlight = '#344e39';
          }

          // Main vertical cut cliff wall
          this.ctx.fillStyle = cliffBase;
          this.ctx.fillRect(px, cliffTopY, ts, cliffH);

          // Oberste Schnittkante: Glänzendes Lichtband
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          this.ctx.fillRect(px, cliffTopY - 1.5, ts, 1.5);

          // Scharfe dunkle Schnittrille (Incision) zwischen Oberfläche und Wand
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          this.ctx.fillRect(px, cliffTopY, ts, 1.5);

          // Cardboard layered core striations
          this.ctx.fillStyle = cliffLine;
          this.ctx.fillRect(px, cliffTopY + Math.floor(cliffH * 0.45), ts, 1.5);
          this.ctx.fillStyle = cliffHighlight;
          this.ctx.fillRect(px, cliffTopY + Math.floor(cliffH * 0.45) + 1.5, ts, 1);

          if (cliffH >= 14) {
            this.ctx.fillStyle = cliffLine;
            this.ctx.fillRect(px, cliffTopY + Math.floor(cliffH * 0.75), ts, 1.5);
            this.ctx.fillStyle = cliffHighlight;
            this.ctx.fillRect(px, cliffTopY + Math.floor(cliffH * 0.75) + 1.5, ts, 1);
          }

          // Vertical cut cardstock tooth marks
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          this.ctx.fillRect(px + 4, cliffTopY, 1.2, cliffH);
          this.ctx.fillRect(px + 11, cliffTopY, 1.2, cliffH);

          // Void crystal veins in cliff
          if (tile === TILES.VOID_GROUND || tile === TILES.VOID_LAKE) {
            this.ctx.fillStyle = 'rgba(192, 132, 252, 0.85)';
            this.ctx.fillRect(px + 3, cliffTopY + 2, 4, 1.2);
            this.ctx.fillRect(px + 9, cliffTopY + 4, 3, 1.2);
          }

          // Fetter, gestufter Schlagschatten auf den unteren Boden (Contact Drop Shadow)
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
          this.ctx.fillRect(px, cliffBottomY, ts, 2.5);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
          this.ctx.fillRect(px, cliffBottomY + 2.5, ts, 2.5);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
          this.ctx.fillRect(px, cliffBottomY + 5, ts, 2);
        }

        // 4. NORTH-FACING CLIFF EDGES (Scharfe obere Pappkante)
        const elevN = (y - 1 >= 0) ? this.map.getElevation(x, y - 1) : elev;
        const rampN = (y - 1 >= 0) ? this.map.getRamp(x, y - 1) : RAMPS.NONE;

        if (elev > elevN && ramp !== RAMPS.UP_NORTH && rampN !== RAMPS.UP_SOUTH) {
          // Starkes, leuchtendes Lichtband an der Oberkante des Podests
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          this.ctx.fillRect(px, surfaceY, ts, 2);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          this.ctx.fillRect(px, surfaceY + 2, ts, 1);

          // Schattenwurf nach Norden auf das tiefere Terrain
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
          this.ctx.fillRect(px, surfaceY - 3, ts, 3);
        }

        // 5. WEST-FACING CLIFF DROPS (Schattenkante links)
        const elevW = (x - 1 >= 0) ? this.map.getElevation(x - 1, y) : elev;
        const rampW = (x - 1 >= 0) ? this.map.getRamp(x - 1, y) : RAMPS.NONE;

        if (elev > elevW && ramp !== RAMPS.UP_WEST && rampW !== RAMPS.UP_EAST) {
          const diffW = (elev - elevW) * ELEVATION_PIXEL_OFFSET;
          // Dunkle Schnittkante auf dem Podest
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          this.ctx.fillRect(px, surfaceY, 2.5, ts);
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          this.ctx.fillRect(px + 2.5, surfaceY, 1.5, ts);

          // Ausgeprägter Schlagschatten auf das westliche Nachbarfeld
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          this.ctx.fillRect(px - 3.5, surfaceY + diffW, 3.5, ts);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          this.ctx.fillRect(px - 6, surfaceY + diffW, 2.5, ts);
        }

        // 6. EAST-FACING CLIFF DROPS (Lichtkante rechts)
        const elevE = (x + 1 < this.map.width) ? this.map.getElevation(x + 1, y) : elev;
        const rampE = (x + 1 < this.map.width) ? this.map.getRamp(x + 1, y) : RAMPS.NONE;

        if (elev > elevE && ramp !== RAMPS.UP_EAST && rampE !== RAMPS.UP_WEST) {
          const diffE = (elev - elevE) * ELEVATION_PIXEL_OFFSET;
          // Helle Schnittkante auf dem Podest
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          this.ctx.fillRect(px + ts - 2.5, surfaceY, 2.5, ts);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          this.ctx.fillRect(px + ts - 3.5, surfaceY, 1, ts);

          // Ausgeprägter Schlagschatten auf das östliche Nachbarfeld
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          this.ctx.fillRect(px + ts, surfaceY + diffE, 3.5, ts);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          this.ctx.fillRect(px + ts + 3.5, surfaceY + diffE, 2.5, ts);
        }
      }
    }
  }

  renderRampTile(px, surfaceY, ramp, elev, tile) {
    const ts = TILE_SIZE;

    // Biome-specific materials for ramps
    let plankCol = '#6b492b';
    let plankLight = '#9e6d42';
    let plankDark = '#3d2514';
    let railCol = '#26160a';
    let accentCol = '#fbbf24'; // Warm glowing golden step marker

    if (tile === TILES.SAND || tile === TILES.QUICKSAND) {
      plankCol = '#c99642'; plankLight = '#f0be6b'; plankDark = '#785018'; railCol = '#472f0b'; accentCol = '#ffffff';
    } else if (tile === TILES.SNOW) {
      plankCol = '#56697d'; plankLight = '#8da6bf'; plankDark = '#2d3844'; railCol = '#1a222b'; accentCol = '#bfdbfe';
    } else if (tile === TILES.VOID_GROUND || tile === TILES.VOID_LAKE) {
      plankCol = '#3b185e'; plankLight = '#732fb8'; plankDark = '#1a082b'; railCol = '#0d0217'; accentCol = '#e879f9';
    } else if (tile === TILES.SWAMP_GROUND || tile === TILES.SWAMP_WATER) {
      plankCol = '#374730'; plankLight = '#58734d'; plankDark = '#1b2418'; railCol = '#0f140e'; accentCol = '#bbf7d0';
    }

    // Outer dark framing border
    this.ctx.fillStyle = railCol;
    this.ctx.fillRect(px, surfaceY, ts, ts);

    // Inner ramp base fill
    this.ctx.fillStyle = plankCol;
    this.ctx.fillRect(px + 1, surfaceY + 1, ts - 2, ts - 2);

    if (ramp === RAMPS.UP_NORTH) {
      // Slopes UP towards North
      // Folded paper side rails
      this.ctx.fillStyle = railCol;
      this.ctx.fillRect(px, surfaceY, 2.5, ts);
      this.ctx.fillRect(px + ts - 2.5, surfaceY, 2.5, ts);

      // Side rail highlights
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(px + 2.5, surfaceY, 1, ts);
      this.ctx.fillRect(px + ts - 3.5, surfaceY, 1, ts);

      // 4 Stepped Planks / Rungs
      for (let i = 0; i < 4; i++) {
        const ry = surfaceY + i * 4;
        this.ctx.fillStyle = plankLight;
        this.ctx.fillRect(px + 2.5, ry, ts - 5, 1.5);
        this.ctx.fillStyle = plankDark;
        this.ctx.fillRect(px + 2.5, ry + 1.5, ts - 5, 1.5);
      }

      // Corner post studs
      this.ctx.fillStyle = '#0f0804';
      this.ctx.fillRect(px, surfaceY, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY, 3, 3);
      this.ctx.fillRect(px, surfaceY + ts - 3, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY + ts - 3, 3, 3);

      // Large luminous upward step chevron
      this.ctx.fillStyle = accentCol;
      this.ctx.fillRect(px + 7, surfaceY + 2, 2, 2);
      this.ctx.fillRect(px + 5, surfaceY + 4, 6, 1.5);
    } else if (ramp === RAMPS.UP_SOUTH) {
      // Slopes UP towards South
      this.ctx.fillStyle = railCol;
      this.ctx.fillRect(px, surfaceY, 2.5, ts);
      this.ctx.fillRect(px + ts - 2.5, surfaceY, 2.5, ts);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(px + 2.5, surfaceY, 1, ts);
      this.ctx.fillRect(px + ts - 3.5, surfaceY, 1, ts);

      for (let i = 0; i < 4; i++) {
        const ry = surfaceY + i * 4;
        this.ctx.fillStyle = plankLight;
        this.ctx.fillRect(px + 2.5, ry, ts - 5, 1.5);
        this.ctx.fillStyle = plankDark;
        this.ctx.fillRect(px + 2.5, ry + 1.5, ts - 5, 1.5);
      }

      this.ctx.fillStyle = '#0f0804';
      this.ctx.fillRect(px, surfaceY, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY, 3, 3);
      this.ctx.fillRect(px, surfaceY + ts - 3, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY + ts - 3, 3, 3);

      this.ctx.fillStyle = accentCol;
      this.ctx.fillRect(px + 5, surfaceY + 10.5, 6, 1.5);
      this.ctx.fillRect(px + 7, surfaceY + 12, 2, 2);
    } else if (ramp === RAMPS.UP_WEST) {
      // Slopes UP towards West
      this.ctx.fillStyle = railCol;
      this.ctx.fillRect(px, surfaceY, ts, 2.5);
      this.ctx.fillRect(px, surfaceY + ts - 2.5, ts, 2.5);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(px, surfaceY + 2.5, ts, 1);
      this.ctx.fillRect(px + ts - 3.5, surfaceY, 1, ts);

      for (let i = 0; i < 4; i++) {
        const rx = px + i * 4;
        this.ctx.fillStyle = plankLight;
        this.ctx.fillRect(rx, surfaceY + 2.5, 1.5, ts - 5);
        this.ctx.fillStyle = plankDark;
        this.ctx.fillRect(rx + 1.5, surfaceY + 2.5, 1.5, ts - 5);
      }

      this.ctx.fillStyle = '#0f0804';
      this.ctx.fillRect(px, surfaceY, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY, 3, 3);
      this.ctx.fillRect(px, surfaceY + ts - 3, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY + ts - 3, 3, 3);

      this.ctx.fillStyle = accentCol;
      this.ctx.fillRect(px + 2, surfaceY + 7, 2, 2);
      this.ctx.fillRect(px + 4, surfaceY + 5, 1.5, 6);
    } else if (ramp === RAMPS.UP_EAST) {
      // Slopes UP towards East
      this.ctx.fillStyle = railCol;
      this.ctx.fillRect(px, surfaceY, ts, 2.5);
      this.ctx.fillRect(px, surfaceY + ts - 2.5, ts, 2.5);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(px, surfaceY + 2.5, ts, 1);
      this.ctx.fillRect(px + ts - 3.5, surfaceY, 1, ts);

      for (let i = 0; i < 4; i++) {
        const rx = px + i * 4;
        this.ctx.fillStyle = plankLight;
        this.ctx.fillRect(rx, surfaceY + 2.5, 1.5, ts - 5);
        this.ctx.fillStyle = plankDark;
        this.ctx.fillRect(rx + 1.5, surfaceY + 2.5, 1.5, ts - 5);
      }

      this.ctx.fillStyle = '#0f0804';
      this.ctx.fillRect(px, surfaceY, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY, 3, 3);
      this.ctx.fillRect(px, surfaceY + ts - 3, 3, 3);
      this.ctx.fillRect(px + ts - 3, surfaceY + ts - 3, 3, 3);

      this.ctx.fillStyle = accentCol;
      this.ctx.fillRect(px + 12, surfaceY + 7, 2, 2);
      this.ctx.fillRect(px + 10.5, surfaceY + 5, 1.5, 6);
    }
  }

  renderPaperWaterRibbons(bounds, t) {
    const ts = TILE_SIZE;
    for (let y = bounds.startY; y < bounds.endY; y++) {
      for (let x = bounds.startX; x < bounds.endX; x++) {
        const tile = this.map.getGroundTile(x, y);
        if (tile === TILES.WATER || tile === TILES.SWAMP_WATER) {
          const px = x * ts;
          const py = y * ts;
          const wave = Math.sin((x * 0.4 + y * 0.2) - t * 2.2);
          if (wave > 0.45) {
            this.ctx.fillStyle = tile === TILES.WATER
              ? 'rgba(94, 234, 212, 0.45)' // Cyan paper ribbon
              : 'rgba(52, 211, 153, 0.35)'; // Mossy paper ribbon
            this.ctx.fillRect(px + 2, py + 6, 12, 1.5);
          }
        }
      }
    }
  }

  renderPaperBridges(bounds) {
    const ts = TILE_SIZE;
    for (let y = bounds.startY; y < bounds.endY; y++) {
      for (let x = bounds.startX; x < bounds.endX; x++) {
        const tile = this.map.getGroundTile(x, y);
        if (tile === TILES.BRIDGE_H || tile === TILES.BRIDGE_V) {
          const px = x * ts;
          const py = y * ts;

          // Red lacquered bridge plank
          this.ctx.fillStyle = '#b91c1c';
          this.ctx.fillRect(px, py, ts, ts);

          // Wood planks
          this.ctx.fillStyle = '#7f1d1d';
          this.ctx.fillRect(px, py, ts, 1);
          this.ctx.fillRect(px, py + ts - 2, ts, 2);

          // Golden lacquered studs
          this.ctx.fillStyle = '#fbbf24';
          this.ctx.fillRect(px + 2, py + 2, 2, 2);
          this.ctx.fillRect(px + ts - 4, py + 2, 2, 2);
        }
      }
    }
  }

  renderLanternLightCones(bounds, t, night, sunset) {
    const intensity = Math.max(night * 1.0, sunset * 0.6);
    if (intensity <= 0.01) return;

    // 1. Hanging tree lanterns
    const visibleTrees = this.map.getVisibleTrees(bounds);
    for (const tree of visibleTrees) {
      if (!tree.hasLantern) continue;

      const tTileX = Math.floor(tree.x / TILE_SIZE);
      const tTileY = Math.floor(tree.y / TILE_SIZE);
      const tElev = this.map.getElevation(tTileX, tTileY);

      const lx = tree.x + 8;
      const ly = tree.y - 12 - tElev * ELEVATION_PIXEL_OFFSET;
      const fPulse = Math.sin(t * 7 + tree.x) * 2;
      const radius = (48 + fPulse);

      const grad = this.ctx.createRadialGradient(lx, ly, 3, lx, ly, radius);
      grad.addColorStop(0, `rgba(254, 240, 138, ${0.36 * intensity})`); // Warm gold core
      grad.addColorStop(0.4, `rgba(249, 115, 22, ${0.18 * intensity})`); // Reddish-amber mid
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(lx, ly, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 1b. Hängende Lampions im dichten Blätterdach
    const canopyCrowns = this.map.getVisibleCanopyCrowns(bounds);
    for (const crown of canopyCrowns) {
      if (!crown.hasLantern) continue;

      const cTileX = Math.floor(crown.x / TILE_SIZE);
      const cTileY = Math.floor(crown.y / TILE_SIZE);
      const cElev = this.map.getElevation(cTileX, cTileY);

      const lx = crown.x + 8;
      const ly = crown.y + 12 - cElev * ELEVATION_PIXEL_OFFSET;
      const fPulse = Math.sin(t * 7 + crown.x) * 2;
      const radius = (48 + fPulse);

      const grad = this.ctx.createRadialGradient(lx, ly, 3, lx, ly, radius);
      grad.addColorStop(0, `rgba(254, 240, 138, ${0.36 * intensity})`);
      grad.addColorStop(0.4, `rgba(249, 115, 22, ${0.18 * intensity})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(lx, ly, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 2. Stone Lanterns (Tōrō) along paths & bridge
    for (let y = bounds.startY; y < bounds.endY; y++) {
      for (let x = bounds.startX; x < bounds.endX; x++) {
        if (this.map.getObjectTile(x, y) === OBJECTS.STONE_TORO) {
          const elev = this.map.getElevation(x, y);
          const lx = x * TILE_SIZE + 8;
          const ly = y * TILE_SIZE + 8 - elev * ELEVATION_PIXEL_OFFSET;
          const fPulse = Math.sin(t * 9 + x) * 1.5;
          const radius = (52 + fPulse);

          const grad = this.ctx.createRadialGradient(lx, ly, 4, lx, ly, radius);
          grad.addColorStop(0, `rgba(254, 240, 138, ${0.4 * intensity})`);
          grad.addColorStop(0.5, `rgba(234, 88, 12, ${0.2 * intensity})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          this.ctx.fillStyle = grad;
          this.ctx.beginPath();
          this.ctx.arc(lx, ly, radius, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    // 3. Player's Handheld Lantern (illuminates surroundings on movement)
    const plx = this.player.x + 6;
    const ply = this.player.y - 8 - Math.round(this.player.visualElevation * ELEVATION_PIXEL_OFFSET);
    const pPulse = Math.sin(t * 12) * 2;
    const pRadius = (68 + pPulse);

    const pGrad = this.ctx.createRadialGradient(plx, ply, 4, plx, ply, pRadius);
    pGrad.addColorStop(0, `rgba(254, 240, 138, ${0.42 * intensity})`);
    pGrad.addColorStop(0.45, `rgba(249, 115, 22, ${0.2 * intensity})`);
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = pGrad;
    this.ctx.beginPath();
    this.ctx.arc(plx, ply, pRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderGroundProps(bounds, t, night) {
    const ts = TILE_SIZE;

    const startY = Math.max(0, bounds.startY - 1);
    const endY = Math.min(this.map.height, bounds.endY + 2);
    const startX = Math.max(0, bounds.startX - 1);
    const endX = Math.min(this.map.width, bounds.endX + 1);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const obj = this.map.getObjectTile(x, y);
        if (obj === OBJECTS.NONE) continue;
        const elev = this.map.getElevation(x, y);
        const px = x * ts;
        const py = y * ts - elev * ELEVATION_PIXEL_OFFSET;

        // 1. Stone Lantern (Tōrō)
        if (obj === OBJECTS.STONE_TORO) {
          // Drop shadow
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          this.ctx.fillRect(px + 2, py + 12, 12, 4);

          // Base & pillar
          this.ctx.fillStyle = '#475569';
          this.ctx.fillRect(px + 5, py + 4, 6, 10);
          this.ctx.fillStyle = '#334155';
          this.ctx.fillRect(px + 3, py + 12, 10, 3);

          // Lantern fire chamber (warm glow at night)
          this.ctx.fillStyle = night > 0.1 ? '#fef08a' : '#1e293b';
          this.ctx.fillRect(px + 5, py + 6, 6, 4);

          // Pagoda roof cap
          this.ctx.fillStyle = '#1e293b';
          this.ctx.beginPath();
          this.ctx.moveTo(px + 1, py + 5);
          this.ctx.lineTo(px + 8, py + 1);
          this.ctx.lineTo(px + 15, py + 5);
          this.ctx.closePath();
          this.ctx.fill();
        }

        // 2. Torii Shrine Gate
        else if (obj === OBJECTS.TORII_GATE) {
          // Red lacquered gate pillars
          this.ctx.fillStyle = '#dc2626';
          this.ctx.fillRect(px + 1, py - 6, 3, 22);
          this.ctx.fillRect(px + 12, py - 6, 3, 22);

          // Top crossbeams
          this.ctx.fillStyle = '#b91c1c';
          this.ctx.fillRect(px - 2, py - 8, 20, 3);
          this.ctx.fillStyle = '#0f172a'; // Black lintel
          this.ctx.fillRect(px - 4, py - 11, 24, 3);
        }

        // 3. Origami Boulders
        else if (obj === OBJECTS.ROCK_STONE || obj === OBJECTS.ROCK_ICE || obj === OBJECTS.ROCK_VOID) {
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          this.ctx.fillRect(px + 2, py + 8, 12, 6);

          let lightFacet = '#4b5563';
          let darkFacet = '#374151';
          if (obj === OBJECTS.ROCK_ICE) {
            lightFacet = '#93c5fd'; darkFacet = '#60a5fa';
          } else if (obj === OBJECTS.ROCK_VOID) {
            lightFacet = '#a855f7'; darkFacet = '#6b21a8';
          }

          // Light facet
          this.ctx.fillStyle = lightFacet;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 2, py + 12);
          this.ctx.lineTo(px + 8, py + 4);
          this.ctx.lineTo(px + 8, py + 12);
          this.ctx.closePath();
          this.ctx.fill();

          // Shadow facet
          this.ctx.fillStyle = darkFacet;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 8, py + 4);
          this.ctx.lineTo(px + 14, py + 12);
          this.ctx.lineTo(px + 8, py + 12);
          this.ctx.closePath();
          this.ctx.fill();

          // Paper crease fold
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 8, py + 4);
          this.ctx.lineTo(px + 8, py + 12);
          this.ctx.stroke();
        }

        // 4. Paper Mushrooms
        else if (obj === OBJECTS.MUSHROOM || obj === OBJECTS.MUSHROOM_BROWN) {
          this.ctx.fillStyle = '#f8fafc';
          this.ctx.fillRect(px + 7, py + 8, 2, 6);
          this.ctx.fillStyle = obj === OBJECTS.MUSHROOM ? '#ef4444' : '#b45309';
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 7, 5, Math.PI, 0);
          this.ctx.fill();
        }

        // 5. Paper Bushes & Flowers
        else if (obj === OBJECTS.BUSH || obj === OBJECTS.FOREST_FLOWERS || obj === OBJECTS.FERN) {
          this.ctx.fillStyle = '#1e382b';
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 8, 5, 0, Math.PI * 2);
          this.ctx.fill();
          if (obj === OBJECTS.FOREST_FLOWERS) {
            this.ctx.fillStyle = '#fbcfe8';
            this.ctx.fillRect(px + 7, py + 7, 2, 2);
          }
        }

        // 6. Desert Cacti
        else if (obj === OBJECTS.CACTUS) {
          this.ctx.fillStyle = '#1e3a29';
          this.ctx.fillRect(px + 6, py + 2, 4, 12);
          this.ctx.fillRect(px + 2, py + 5, 4, 4);
          this.ctx.fillRect(px + 10, py + 7, 4, 4);
        }

        // 7. Bambus-Trampolin (Zum Wolkenreich)
        else if (obj === OBJECTS.TRAMPOLINE) {
          // Drop shadow
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 12, 7, 3.5, 0, 0, Math.PI * 2);
          this.ctx.fill();

          // 4 Bamboo legs
          this.ctx.strokeStyle = '#a16207';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 3, py + 6);  this.ctx.lineTo(px + 2, py + 14);
          this.ctx.moveTo(px + 13, py + 6); this.ctx.lineTo(px + 14, py + 14);
          this.ctx.stroke();

          // Bouncy coiled springs
          this.ctx.strokeStyle = '#f59e0b';
          this.ctx.lineWidth = 1.2;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 4, py + 7);  this.ctx.lineTo(px + 4, py + 11);
          this.ctx.moveTo(px + 12, py + 7); this.ctx.lineTo(px + 12, py + 11);
          this.ctx.stroke();

          // Springy Canvas Pad (Pink bouncy disc)
          const isNear = Math.hypot(this.player.x - (px + 8), this.player.y - (py + 8)) < 24;
          const bouncePulse = isNear ? Math.sin(t * 12) * 1.5 : 0;

          this.ctx.fillStyle = '#db2777'; // Dark pink frame
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 6 + bouncePulse, 7, 3.5, 0, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#f472b6'; // Vibrant pink surface
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 5.5 + bouncePulse, 5.5, 2.5, 0, 0, Math.PI * 2);
          this.ctx.fill();

          // Spiral star flower in center
          this.ctx.fillStyle = '#fef08a';
          this.ctx.fillRect(px + 7, py + 5 + bouncePulse, 2, 2);
        }

        // 8. Höhlenschlund (Cave Entrance in Hole)
        else if (obj === OBJECTS.CAVE_ENTRANCE) {
          // Deep dark cave chasm pit
          this.ctx.fillStyle = '#05070d';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 8, 7, 5, 0, 0, Math.PI * 2);
          this.ctx.fill();

          // Stone rim
          this.ctx.strokeStyle = '#334155';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 8, 7.5, 5.5, 0, 0, Math.PI * 2);
          this.ctx.stroke();

          // Swirling cave darkness smoke
          const sAngle = t * 2.5;
          const smokeX = px + 8 + Math.cos(sAngle) * 3;
          const smokeY = py + 8 + Math.sin(sAngle) * 2;
          this.ctx.fillStyle = 'rgba(71, 85, 105, 0.45)';
          this.ctx.beginPath();
          this.ctx.arc(smokeX, smokeY, 2.5, 0, Math.PI * 2);
          this.ctx.fill();
        }

        // 9. Uralter Schrein (Overworld)
        else if (obj === OBJECTS.SHRINE) {
          this.renderShrine(px, py, t, 'overworld');
        }
      }
    }
  }

  renderYSortedEntities(bounds, t, night) {
    const renderList = [];

    // Player
    const playerElev = this.player.visualElevation;
    const playerSortY = this.player.y - playerElev * ELEVATION_PIXEL_OFFSET;
    renderList.push({
      sortY: playerSortY,
      isPlayer: true
    });

    // Paper Trees
    const visibleTrees = this.map.getVisibleTrees(bounds);
    for (const tree of visibleTrees) {
      const tTileX = Math.floor(tree.x / TILE_SIZE);
      const tTileY = Math.floor(tree.y / TILE_SIZE);
      const treeElev = this.map.getElevation(tTileX, tTileY);
      const treeSortY = tree.y - treeElev * ELEVATION_PIXEL_OFFSET;
      renderList.push({
        sortY: treeSortY,
        isPlayer: false,
        isTree: true,
        tree,
        treeElev
      });
    }

    // Kodama Forest Spirits
    const visibleKodamas = this.map.getVisibleKodamas(bounds);
    for (const kodama of visibleKodamas) {
      const kTileX = Math.floor(kodama.x / TILE_SIZE);
      const kTileY = Math.floor(kodama.y / TILE_SIZE);
      const kElev = this.map.getElevation(kTileX, kTileY);
      const kSortY = kodama.y - kElev * ELEVATION_PIXEL_OFFSET;
      renderList.push({
        sortY: kSortY,
        isPlayer: false,
        isKodama: true,
        kodama,
        kElev
      });
    }

    // Active Enemies (Overworld)
    if (this.enemyManager) {
      const minX = bounds.startX * TILE_SIZE - 64;
      const maxX = bounds.endX * TILE_SIZE + 64;
      const minY = bounds.startY * TILE_SIZE - 64;
      const maxY = bounds.endY * TILE_SIZE + 64;

      const activeEnemies = this.enemyManager.getActiveEnemies();
      for (const enemy of activeEnemies) {
        if (enemy.x >= minX && enemy.x <= maxX &&
            enemy.y >= minY && enemy.y <= maxY) {
          const eElev = enemy.elevation || 0;
          const eSortY = enemy.y - eElev * ELEVATION_PIXEL_OFFSET;
          renderList.push({
            sortY: eSortY,
            isPlayer: false,
            isTree: false,
            isKodama: false,
            isEnemy: true,
            enemy
          });
        }
      }
    }

    // Sort back-to-front by visual screen Y
    renderList.sort((a, b) => a.sortY - b.sortY);

    for (const item of renderList) {
      if (item.isPlayer) {
        this.player.render(this.ctx, this.spriteManager, t, night);
      } else if (item.isTree) {
        this.renderPaperTree(item.tree, t, night, item.treeElev);
      } else if (item.isKodama) {
        this.renderKodamaSpirit(item.kodama, t, night, item.kElev);
      } else if (item.isEnemy) {
        item.enemy.render(this.ctx, t, night);
      }
    }

    // Render Collectible Loot Drops
    if (this.enemyManager) {
      this.enemyManager.renderLoot(this.ctx, t);
    }
  }

  renderPaperTree(tree, t, night, treeElev = 0) {
    const sway = Math.sin(t * 1.6 + tree.x * 0.08) * 1.8;
    const tx = tree.x;
    const ty = tree.y - treeElev * ELEVATION_PIXEL_OFFSET;

    // Paper card drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    this.ctx.beginPath();
    this.ctx.ellipse(tx, ty, 15, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Cut cardstock trunk
    this.ctx.fillStyle = '#3a2b1e';
    this.ctx.beginPath();
    this.ctx.moveTo(tx - 3, ty);
    this.ctx.lineTo(tx - 2, ty - 16);
    this.ctx.lineTo(tx + 2, ty - 16);
    this.ctx.lineTo(tx + 3, ty);
    this.ctx.closePath();
    this.ctx.fill();

    const cx = tx + sway;
    const cy = ty - 26;

    this.drawPaperTreeCrown(this.ctx, cx, cy, tree.type, 17, t, tree.hasLantern, night);
  }

  drawPaperTreeCrown(ctx, cx, cy, type, radius = 17, t = 0, hasLantern = false, night = 0) {
    const scale = radius / 17;

    // Palette per tree type
    let col1 = '#183426';
    let col2 = '#264e3a';
    let col3 = '#366d51';

    if (type === TREES.SNOWY_PINE) {
      col1 = '#475569'; col2 = '#64748b'; col3 = '#cbd5e1';
    } else if (type === TREES.SWAMP_WILLOW) {
      col1 = '#1f291e'; col2 = '#2d3d2a'; col3 = '#42573d';
    } else if (type === TREES.BLOSSOM) {
      col1 = '#831843'; col2 = '#be185d'; col3 = '#f472b6';
    } else if (type === TREES.AUTUMN) {
      col1 = '#7c2d12'; col2 = '#c2410c'; col3 = '#fb923c';
    } else if (type === TREES.BIRCH) {
      col1 = '#204428'; col2 = '#3a6e46'; col3 = '#65a773';
    }

    // Scalloped Paper Foliage Layers with Drop Shadows
    // Layer 1 (Back paper leaf with drop shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(cx + 2 * scale, cy + 3 * scale, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = col1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Layer 2 (Middle paper leaf with drop shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(cx - 3 * scale, cy - 1 * scale, 13 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 4 * scale, cy, 12 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = col2;
    ctx.beginPath();
    ctx.arc(cx - 4 * scale, cy - 2 * scale, 13 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 4 * scale, cy - 1 * scale, 12 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Layer 3 (Top paper highlight disc with fine cut edge)
    ctx.fillStyle = col3;
    ctx.beginPath();
    ctx.arc(cx - 2 * scale, cy - 6 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Papercraft center pin / brad
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(cx - 1, cy - 6 * scale, 2, 2);

    // HANGING RED/AMBER PAPER LANTERN (If this tree has a lantern)
    if (hasLantern) {
      const lSway = Math.sin(t * 3.0 + cx * 0.2) * 2;
      const lx = cx + 9 * scale + lSway;
      const ly = cy + 12 * scale;

      // Hanging wire
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 7 * scale, cy);
      ctx.lineTo(lx, ly - 6);
      ctx.stroke();

      // Red paper lantern body
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(lx - 4, ly - 6, 8, 10, 2) : ctx.rect(lx - 4, ly - 6, 8, 10);
      ctx.fill();

      // Glowing core (illuminates at night & sunset)
      if (night > 0.05 || this.gameTime >= 17) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(lx - 2, ly - 3, 4, 4);
      }

      // Black / Gold caps
      ctx.fillStyle = '#181021';
      ctx.fillRect(lx - 5, ly - 7, 10, 2);
      ctx.fillRect(lx - 5, ly + 4, 10, 2);

      // Hanging tassel
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, ly + 6);
      ctx.lineTo(lx, ly + 10);
      ctx.stroke();
    }
  }

  renderKodamaSpirit(kodama, t, night, kElev = 0) {
    const kx = kodama.x;
    // Gentle floating bob
    const ky = (kodama.y - kElev * ELEVATION_PIXEL_OFFSET) + Math.sin(t * 2.5 + kodama.floatOffset) * 3;
    const tilt = Math.sin(t * kodama.tiltSpeed + kodama.tiltOffset) * 0.25;

    this.ctx.save();
    this.ctx.translate(kx, ky);
    this.ctx.rotate(tilt);

    // Drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.beginPath();
    this.ctx.ellipse(1, 10, 4, 2, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Body
    this.ctx.fillStyle = '#f1f5f9';
    this.ctx.fillRect(-1.5, 3, 3, 6);

    // Head
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 5, 4.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 3 Dark Hollow Dots: 2 Eyes and 1 Mouth
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(-2, -1, 1, 0, Math.PI * 2);
    this.ctx.arc(2, -1, 1, 0, Math.PI * 2);
    this.ctx.arc(0, 2, 1.2, 0, Math.PI * 2);
    this.ctx.fill();

    // Ethereal cyan glow aura at night
    if (night > 0.1) {
      this.ctx.fillStyle = `rgba(94, 234, 212, ${0.25 * night})`;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  renderEnvironmentalAtmosphere(bounds, t, sunlight, night) {
    const startX = bounds.startX * TILE_SIZE;
    const endX = bounds.endX * TILE_SIZE;
    const startY = bounds.startY * TILE_SIZE;
    const endY = bounds.endY * TILE_SIZE;

    // 1. Daytime Translucent Cloud Shadows drifting lazily across the paper world
    if (sunlight > 0.1) {
      for (let c = 0; c < 4; c++) {
        const cloudX = ((c * 500 + t * 18) % (this.map.width * TILE_SIZE + 400)) - 200;
        const cloudY = 200 + c * 350;
        this.ctx.fillStyle = `rgba(30, 50, 60, ${0.08 * sunlight})`;
        this.ctx.beginPath();
        this.ctx.ellipse(cloudX, cloudY, 140, 70, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // 2. Ambient Particles (Petals, Ofuda Talismans, Fireflies)
    for (const p of this.ambientParticles) {
      if (p.x < startX || p.x > endX || p.y < startY || p.y > endY) continue;

      if (p.type === 'petal') {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, Math.sin(t + p.swayOffset), 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'ofuda' && night > 0.05) {
        // White paper talisman with red seal
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rot);
        this.ctx.fillStyle = `rgba(248, 250, 252, ${night * 0.85})`;
        this.ctx.fillRect(-3, -6, 6, 12);
        this.ctx.fillStyle = `rgba(220, 38, 38, ${night * 0.85})`;
        this.ctx.fillRect(-1.5, -3, 3, 6);
        this.ctx.restore();
      } else if (p.type === 'firefly' && night > 0.05) {
        // Golden glowing ember
        const pulse = Math.sin(t * 5 + p.swayOffset) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(251, 191, 36, ${pulse * night * 0.85})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  renderForestCanopy(bounds, t) {
    if (!this.canopyCanvas || !this.canopyCtx) return;

    const crowns = this.map.getVisibleCanopyCrowns(bounds);
    if (crowns.length === 0) return;

    const cCanvas = this.canopyCanvas;
    const cCtx = this.canopyCtx;

    // Offscreen Canvas leeren
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);

    // Exakte Kamera-Transformation anwenden
    this.camera.apply(cCtx);

    const { night } = this.getDayNightFactors();

    // GROSSE BAUMKRONEN RENDERN (Genau dieselben wie die großen Bäume, > 1 Tile groß!)
    for (const crown of crowns) {
      const cTileX = Math.floor(crown.x / TILE_SIZE);
      const cTileY = Math.floor(crown.y / TILE_SIZE);
      const cElev = this.map.getElevation(cTileX, cTileY);

      const sway = Math.sin(t * 1.6 + crown.x * 0.08) * 1.8;
      const cx = crown.x + sway;
      const cy = crown.y - cElev * ELEVATION_PIXEL_OFFSET;

      this.drawPaperTreeCrown(cCtx, cx, cy, crown.type, crown.radius, t, crown.hasLantern, night);
    }

    // SICHTKREIS-CUTOUT UM DIE SPIELFIGUR ("nur um mich herum was sehe")
    cCtx.save();
    cCtx.globalCompositeOperation = 'destination-out';

    const plx = this.player.x;
    const ply = this.player.y - Math.round(this.player.visualElevation * ELEVATION_PIXEL_OFFSET);
    const radius = PLAYER_CONFIG.CANOPY_REVEAL_RADIUS || 54;

    // Runder, weich gefederter Ausstanz-Gradient
    const revealGrad = cCtx.createRadialGradient(plx, ply, radius * 0.5, plx, ply, radius);
    revealGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    revealGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.95)');
    revealGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    cCtx.fillStyle = revealGrad;
    cCtx.beginPath();
    cCtx.arc(plx, ply, radius, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.restore();

    this.camera.release(cCtx);

    // Blätterschicht auf den Hauptcanvas übertragen
    this.camera.release(this.ctx);
    this.ctx.drawImage(cCanvas, 0, 0);
    this.camera.apply(this.ctx);

    // Weicher Blätterdach-Schattenring am Boden entlang der Schnittkante
    const shadowGrad = this.ctx.createRadialGradient(plx, ply, radius * 0.65, plx, ply, radius * 1.15);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(0.75, 'rgba(10, 24, 16, 0.38)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = shadowGrad;
    this.ctx.beginPath();
    this.ctx.arc(plx, ply, radius * 1.15, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderGlobalLightingWash(sunlight, sunset, night) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Sunset Golden Wash
    if (sunset > 0.02) {
      this.ctx.fillStyle = `rgba(251, 146, 60, ${sunset * 0.16})`;
      this.ctx.fillRect(0, 0, w, h);
    }

    // Deep Mononoke Night Indigo Wash
    if (night > 0.02) {
      this.ctx.fillStyle = `rgba(18, 24, 48, ${night * 0.42})`;
      this.ctx.fillRect(0, 0, w, h);
    }

    // Atmosphärischer Waldschatten, wenn der Spieler sich unter dem Blätterdach befindet
    const pTileX = Math.floor(this.player.x / TILE_SIZE);
    const pTileY = Math.floor(this.player.y / TILE_SIZE);
    if (this.map.getCanopyTile(pTileX, pTileY) === CANOPY.TREE_CROWN) {
      this.ctx.fillStyle = 'rgba(7, 20, 14, 0.26)';
      this.ctx.fillRect(0, 0, w, h);
    }

    // Vignette for cinematic framing
    const vig = this.ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.75);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    this.ctx.fillStyle = vig;
    this.ctx.fillRect(0, 0, w, h);
  }

  // ==========================================================================
  // CLOUD WORLD RENDERING (Rosa Wolken, Regenbogenbrücken & Schreine)
  // ==========================================================================
  renderCloudDimension(bounds, t) {
    // 1. Ethereal pastel twilight sky gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGrad.addColorStop(0, '#2b1b44');
    skyGrad.addColorStop(0.5, '#4a2559');
    skyGrad.addColorStop(1, '#6b2d5c');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Camera Transform
    this.camera.apply(this.ctx);

    const ts = TILE_SIZE;
    const startY = Math.max(0, bounds.startY - 2);
    const endY = Math.min(this.map.height, bounds.endY + 2);
    const startX = Math.max(0, bounds.startX - 2);
    const endX = Math.min(this.map.width, bounds.endX + 2);

    // PASS 1: Pink Clouds & Rainbow Bridges
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.map.getGroundTile(x, y);
        const px = x * ts;
        const py = y * ts;

        if (tile === TILES.CLOUD_PINK) {
          // Cloud drop shadow
          this.ctx.fillStyle = 'rgba(23, 10, 36, 0.45)';
          this.ctx.fillRect(px, py + 4, ts, ts);

          // Base cloud cardstock (lush rose)
          this.ctx.fillStyle = '#f472b6';
          this.ctx.fillRect(px, py, ts, ts);

          // Lighter soft pink top layer
          this.ctx.fillStyle = '#fbcfe8';
          this.ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);

          // Fluffy cloud paper arcs & puffs
          this.ctx.fillStyle = '#ffffff';
          const puffAngle = (x * 17 + y * 23) % 4;
          if (puffAngle === 0) {
            this.ctx.fillRect(px + 3, py + 3, 4, 3);
          } else if (puffAngle === 1) {
            this.ctx.fillRect(px + 8, py + 4, 5, 2.5);
          }

          // Scalloped cloud edge highlight if neighbor is sky abyss
          const nN = (y - 1 >= 0) ? this.map.getGroundTile(x, y - 1) : TILES.CLOUD_PINK;
          const nS = (y + 1 < this.map.height) ? this.map.getGroundTile(x, y + 1) : TILES.CLOUD_PINK;
          const nW = (x - 1 >= 0) ? this.map.getGroundTile(x - 1, y) : TILES.CLOUD_PINK;
          const nE = (x + 1 < this.map.width) ? this.map.getGroundTile(x + 1, y) : TILES.CLOUD_PINK;

          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          if (nN === TILES.SKY_ABYSS) {
            this.ctx.fillRect(px, py, ts, 2);
          }
          if (nS === TILES.SKY_ABYSS) {
            this.ctx.fillRect(px, py + ts - 2, ts, 2);
          }
          if (nW === TILES.SKY_ABYSS) {
            this.ctx.fillRect(px, py, 2, ts);
          }
          if (nE === TILES.SKY_ABYSS) {
            this.ctx.fillRect(px + ts - 2, py, 2, ts);
          }
        }
        else if (tile === TILES.RAINBOW_BRIDGE_H || tile === TILES.RAINBOW_BRIDGE_V) {
          this.renderRainbowBridgeTile(px, py, tile === TILES.RAINBOW_BRIDGE_H, t, x, y);
        }
        else if (tile === TILES.SKY_ABYSS) {
          // Twinkling stars in the sky abyss
          if ((x * 19 + y * 31) % 13 === 0) {
            const starTwinkle = Math.sin(t * 3.5 + x + y) * 0.3 + 0.7;
            this.ctx.fillStyle = `rgba(254, 240, 138, ${starTwinkle * 0.75})`;
            this.ctx.fillRect(px + 7, py + 7, 2, 2);
          }
        }
      }
    }

    // PASS 2: Objects / Shrines in Cloud World
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const obj = this.map.getObjectTile(x, y);
        if (obj === OBJECTS.SHRINE) {
          this.renderShrine(x * ts, y * ts, t, 'cloud');
        }
      }
    }

    // PASS 3: Cloud Enemies & Player
    if (this.enemyManager) {
      const minX = bounds.startX * TILE_SIZE - 64;
      const maxX = bounds.endX * TILE_SIZE + 64;
      const minY = bounds.startY * TILE_SIZE - 64;
      const maxY = bounds.endY * TILE_SIZE + 64;

      const cloudEnemies = this.enemyManager.getActiveEnemies();
      for (const enemy of cloudEnemies) {
        if (enemy.x >= minX && enemy.x <= maxX &&
            enemy.y >= minY && enemy.y <= maxY) {
          enemy.render(this.ctx, t, 0.4);
        }
      }
      this.enemyManager.renderLoot(this.ctx, t);
    }

    this.player.render(this.ctx, this.spriteManager, t, 0.4);

    // Combat layer: flying arrows, slashes, hit effects, floating texts
    if (this.combat) {
      this.combat.render(this.ctx, bounds, t);
    }

    // PASS 4: Ambient floating cotton cloud puffs & rainbow sparkle particles
    this.renderCloudAtmosphere(bounds, t);

    this.camera.release(this.ctx);

    // Cinematic soft cloud vignette
    const vig = this.ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.4, this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.8);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(35, 10, 45, 0.4)');
    this.ctx.fillStyle = vig;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderRainbowBridgeTile(px, py, isHorizontal, t, tx, ty) {
    const ts = TILE_SIZE;
    const rainbowColors = [
      '#f43f5e', // Rosa-Rot
      '#fb923c', // Orange
      '#facc15', // Goldgelb
      '#4ade80', // Smaragdgrün
      '#38bdf8', // Himmelblau
      '#c084fc'  // Flieder
    ];

    // Drop shadow
    this.ctx.fillStyle = 'rgba(23, 10, 36, 0.35)';
    this.ctx.fillRect(px, py + 4, ts, ts);

    // Glowing bridge aura
    const pulse = Math.sin(t * 4 + (tx + ty) * 0.5) * 0.15 + 0.85;
    this.ctx.fillStyle = `rgba(254, 240, 138, ${0.25 * pulse})`;
    this.ctx.fillRect(px - 1, py - 1, ts + 2, ts + 2);

    const stripeW = isHorizontal ? ts : (ts / rainbowColors.length);
    const stripeH = isHorizontal ? (ts / rainbowColors.length) : ts;

    for (let i = 0; i < rainbowColors.length; i++) {
      this.ctx.fillStyle = rainbowColors[i];
      if (isHorizontal) {
        this.ctx.fillRect(px, py + i * stripeH, stripeW, stripeH);
      } else {
        this.ctx.fillRect(px + i * stripeW, py, stripeW, stripeH);
      }
    }

    // Shimmering white light sheen moving across bridge
    const sheenPos = ((t * 30 + tx * 8 + ty * 8) % 40) - 20;
    if (Math.abs(sheenPos) < 10) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * (1 - Math.abs(sheenPos) / 10)})`;
      this.ctx.fillRect(px, py, ts, ts);
    }
  }

  renderCloudAtmosphere(bounds, t) {
    // Drifting pastel cloud puffs
    for (let i = 0; i < 18; i++) {
      const px = ((i * 137 + t * 25) % (this.map.width * TILE_SIZE));
      const py = ((i * 193 + Math.sin(t + i) * 20) % (this.map.height * TILE_SIZE));

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      this.ctx.beginPath();
      this.ctx.arc(px, py, 6 + (i % 4) * 3, 0, Math.PI * 2);
      this.ctx.fill();

      // Rainbow star sparkle
      if (i % 3 === 0) {
        const starGlow = Math.sin(t * 5 + i) * 0.4 + 0.6;
        this.ctx.fillStyle = `rgba(254, 240, 138, ${starGlow * 0.7})`;
        this.ctx.fillRect(px + 4, py - 4, 2, 2);
      }
    }
  }

  // ==========================================================================
  // CAVE WORLD RENDERING (Tiefenhöhlen, Unterirdischer See & Biome-Themen)
  // ==========================================================================
  renderCaveDimension(bounds, t) {
    // 1. Deep Cavern Black Base
    this.ctx.fillStyle = '#060810';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Camera Transform
    this.camera.apply(this.ctx);

    const ts = TILE_SIZE;
    const startY = Math.max(0, bounds.startY - 2);
    const endY = Math.min(this.map.height, bounds.endY + 2);
    const startX = Math.max(0, bounds.startX - 2);
    const endX = Math.min(this.map.width, bounds.endX + 2);

    // PASS 1: Ground Tiles (Biome-spezifische Felswände, Böden, Seen, Leitern)
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.map.getGroundTile(x, y);
        const px = x * ts;
        const py = y * ts;
        const theme = this.map.getTheme ? this.map.getTheme(x, y) : 'main';

        if (tile === TILES.CAVE_WALL) {
          if (theme === 'snow') {
            // Glaziale Eiswand
            this.ctx.fillStyle = '#0c4a6e';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 3);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#075985';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
            if ((x * 13 + y * 19) % 2 === 0) {
              this.ctx.fillStyle = '#bae6fd';
              this.ctx.beginPath();
              this.ctx.moveTo(px + 4, py + ts);
              this.ctx.lineTo(px + 7, py + ts + 3);
              this.ctx.lineTo(px + 10, py + ts);
              this.ctx.fill();
            }
          } else if (theme === 'void') {
            // Abyssisches Obsidian-Gestein
            this.ctx.fillStyle = '#150524';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#a855f7';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 2.5);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#2a0845';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
            if ((x * 31 + y * 47) % 5 === 0) {
              const rGlow = Math.sin(t * 3 + x + y) * 0.3 + 0.7;
              this.ctx.fillStyle = `rgba(232, 121, 249, ${rGlow * 0.8})`;
              this.ctx.fillRect(px + 6, py + 6, 3, 3);
            }
          } else if (theme === 'forest') {
            // Moosige Waldgesteinswand
            this.ctx.fillStyle = '#14381a';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#22c55e';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 3);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#0f2813';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
            if ((x * 19 + y * 37) % 3 === 0) {
              this.ctx.strokeStyle = '#78350f';
              this.ctx.lineWidth = 1.2;
              this.ctx.beginPath();
              this.ctx.moveTo(px + 5, py + 4);
              this.ctx.lineTo(px + 4, py + 12);
              this.ctx.stroke();
            }
          } else if (theme === 'desert') {
            // Antiker Sandstein
            this.ctx.fillStyle = '#78350f';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#f59e0b';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 3);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#5c2406';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            this.ctx.fillRect(px + 2, py + 6, ts - 4, 1.2);
            this.ctx.fillRect(px + 2, py + 10, ts - 4, 1.2);
          } else if (theme === 'swamp') {
            // Sumpf-Mergelstein
            this.ctx.fillStyle = '#1c2818';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#84cc16';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 3);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#111a0e';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
          } else if (theme === 'crystal') {
            // Amethyst-Kristallwand
            this.ctx.fillStyle = '#1e1b4b';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#818cf8';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 3);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#312e81';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
          } else {
            // Schieferwand
            this.ctx.fillStyle = '#0f172a';
            this.ctx.fillRect(px, py, ts, ts);
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(px + 1, py + 1, ts - 2, 3);
            if ((x * 17 + y * 29) % 3 === 0) {
              this.ctx.fillStyle = '#090d16';
              this.ctx.fillRect(px + 3, py + 5, ts - 6, ts - 8);
            }
          }
        }
        else if (tile === TILES.CAVE_FLOOR) {
          if (theme === 'snow') {
            this.ctx.fillStyle = '#155e75';
            this.ctx.fillRect(px, py, ts, ts);
            if ((x * 23 + y * 41) % 4 === 0) {
              this.ctx.fillStyle = '#67e8f9';
              this.ctx.fillRect(px + 4, py + 7, 3, 1.5);
            } else if ((x * 19 + y * 31) % 6 === 0) {
              this.ctx.fillStyle = '#e0f2fe';
              this.ctx.fillRect(px + 8, py + 4, 1.5, 1.5);
            }
          } else if (theme === 'void') {
            this.ctx.fillStyle = '#12071f';
            this.ctx.fillRect(px, py, ts, ts);
            if ((x * 23 + y * 41) % 4 === 0) {
              this.ctx.fillStyle = '#7e22ce';
              this.ctx.fillRect(px + 4, py + 6, 4, 1.5);
            } else if ((x * 19 + y * 31) % 5 === 0) {
              this.ctx.fillStyle = '#c084fc';
              this.ctx.fillRect(px + 9, py + 3, 2, 1.5);
            }
          } else if (theme === 'forest') {
            this.ctx.fillStyle = '#0f2e15';
            this.ctx.fillRect(px, py, ts, ts);
            if ((x * 23 + y * 41) % 4 === 0) {
              this.ctx.fillStyle = '#16a34a';
              this.ctx.fillRect(px + 4, py + 6, 3, 2);
            } else if ((x * 19 + y * 31) % 5 === 0) {
              this.ctx.fillStyle = '#4ade80';
              this.ctx.fillRect(px + 8, py + 4, 1.5, 1.5);
            }
          } else if (theme === 'desert') {
            this.ctx.fillStyle = '#451a03';
            this.ctx.fillRect(px, py, ts, ts);
            if ((x * 23 + y * 41) % 4 === 0) {
              this.ctx.fillStyle = '#d97706';
              this.ctx.fillRect(px + 4, py + 7, 4, 1.5);
            } else if ((x * 19 + y * 31) % 5 === 0) {
              this.ctx.fillStyle = '#f59e0b';
              this.ctx.fillRect(px + 9, py + 3, 2, 1.5);
            }
          } else if (theme === 'swamp') {
            this.ctx.fillStyle = '#141f13';
            this.ctx.fillRect(px, py, ts, ts);
            if ((x * 23 + y * 41) % 4 === 0) {
              this.ctx.fillStyle = '#3f6212';
              this.ctx.fillRect(px + 4, py + 7, 3, 2);
            }
          } else {
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(px, py, ts, ts);
            if ((x * 23 + y * 41) % 5 === 0) {
              this.ctx.fillStyle = '#334155';
              this.ctx.fillRect(px + 4, py + 7, 3, 1.5);
            } else if ((x * 19 + y * 31) % 7 === 0) {
              this.ctx.fillStyle = '#0f172a';
              this.ctx.fillRect(px + 9, py + 3, 2, 2);
            }
          }
        }
        else if (tile === TILES.CAVE_WATER) {
          let waterBase = '#07253b';
          let waveCol1 = '#0ea5e9';
          let waveCol2 = '#0369a1';
          let sparkCol = 'rgba(45, 212, 191, ';

          if (theme === 'snow') {
            waterBase = '#0e7490';
            waveCol1 = '#67e8f9';
            waveCol2 = '#0891b2';
            sparkCol = 'rgba(224, 242, 254, ';
          } else if (theme === 'void') {
            waterBase = '#2e1065';
            waveCol1 = '#a855f7';
            waveCol2 = '#581c87';
            sparkCol = 'rgba(240, 171, 252, ';
          } else if (theme === 'swamp') {
            waterBase = '#064e3b';
            waveCol1 = '#10b981';
            waveCol2 = '#047857';
            sparkCol = 'rgba(163, 230, 53, ';
          }

          this.ctx.fillStyle = waterBase;
          this.ctx.fillRect(px, py, ts, ts);

          const wave = Math.sin(t * 2.5 + x * 0.8 + y * 0.6);
          if (wave > 0.3) {
            this.ctx.fillStyle = waveCol1;
            this.ctx.fillRect(px + 2, py + 5, 12, 1.8);
          } else if (wave < -0.3) {
            this.ctx.fillStyle = waveCol2;
            this.ctx.fillRect(px + 3, py + 10, 10, 1.8);
          }

          if ((x * 37 + y * 59) % 6 === 0) {
            const glow = Math.sin(t * 3.5 + x + y) * 0.3 + 0.7;
            this.ctx.fillStyle = `${sparkCol}${glow * 0.85})`;
            this.ctx.fillRect(px + 6, py + 6, 2, 2);
          }
        }
        else if (tile === TILES.CAVE_HOLE_EXIT) {
          // Shaft of golden sunlight from the hole above!
          this.ctx.fillStyle = '#451a03';
          this.ctx.fillRect(px, py, ts, ts);

          const pulse = Math.sin(t * 3) * 0.15 + 0.85;
          this.ctx.fillStyle = `rgba(254, 240, 138, ${0.4 * pulse})`;
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 8, 9, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#fef08a';
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 8, 4, 0, Math.PI * 2);
          this.ctx.fill();

          // Wooden rope ladder dangling down
          this.ctx.strokeStyle = '#92400e';
          this.ctx.lineWidth = 1.2;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 4, py);
          this.ctx.lineTo(px + 4, py + ts);
          this.ctx.moveTo(px + 12, py);
          this.ctx.lineTo(px + 12, py + ts);
          this.ctx.moveTo(px + 4, py + 4);
          this.ctx.lineTo(px + 12, py + 4);
          this.ctx.moveTo(px + 4, py + 11);
          this.ctx.lineTo(px + 12, py + 11);
          this.ctx.stroke();
        }
        else if (tile === TILES.CAVE_LADDER_DOWN || tile === TILES.CAVE_LADDER_UP) {
          // Shaft hole with ladder
          this.ctx.fillStyle = '#090d16';
          this.ctx.fillRect(px + 2, py + 2, 12, 12);

          this.ctx.strokeStyle = '#cbd5e1';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 4, py);
          this.ctx.lineTo(px + 4, py + ts);
          this.ctx.moveTo(px + 12, py);
          this.ctx.lineTo(px + 12, py + ts);
          this.ctx.moveTo(px + 4, py + 4);
          this.ctx.lineTo(px + 12, py + 4);
          this.ctx.moveTo(px + 4, py + 8);
          this.ctx.lineTo(px + 12, py + 8);
          this.ctx.moveTo(px + 4, py + 12);
          this.ctx.lineTo(px + 12, py + 12);
          this.ctx.stroke();
        }
      }
    }

    // PASS 1b: Cave Light Cones (Warm ground illumination from Player Lantern, Torches, Sunlight Shafts, Shrines)
    this.renderCaveLightCones(bounds, t);

    // PASS 2: Objects in Cave (Stalagmites, Glow Crystals, Mushrooms, Shrines, Torches)
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const obj = this.map.getObjectTile(x, y);
        const px = x * ts;
        const py = y * ts;
        const theme = this.map.getTheme ? this.map.getTheme(x, y) : 'main';

        if (obj === OBJECTS.STALAGMITE || obj === OBJECTS.ROCK_ICE || obj === OBJECTS.ROCK_VOID) {
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          this.ctx.fillRect(px + 3, py + 12, 10, 3);

          let mainCol = '#334155';
          let lightCol = '#475569';
          if (theme === 'snow' || obj === OBJECTS.ROCK_ICE) {
            mainCol = '#0284c7';
            lightCol = '#7dd3fc';
          } else if (theme === 'void' || obj === OBJECTS.ROCK_VOID) {
            mainCol = '#581c87';
            lightCol = '#c084fc';
          } else if (theme === 'desert') {
            mainCol = '#9a3412';
            lightCol = '#f59e0b';
          } else if (theme === 'forest') {
            mainCol = '#166534';
            lightCol = '#4ade80';
          }

          this.ctx.fillStyle = mainCol;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 2, py + 14);
          this.ctx.lineTo(px + 8, py + 2);
          this.ctx.lineTo(px + 14, py + 14);
          this.ctx.closePath();
          this.ctx.fill();

          this.ctx.fillStyle = lightCol;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 8, py + 2);
          this.ctx.lineTo(px + 14, py + 14);
          this.ctx.lineTo(px + 8, py + 14);
          this.ctx.closePath();
          this.ctx.fill();
        }
        else if (obj === OBJECTS.GLOW_CRYSTAL) {
          this.renderGlowCrystal(px, py, t, x, y, theme);
        }
        else if (obj === OBJECTS.CAVE_MUSHROOM_GLOW) {
          this.renderCaveMushroom(px, py, t, x, y, theme);
        }
        else if (obj === OBJECTS.SHRINE) {
          this.renderShrine(px, py, t, 'cave');
        }
        else if (obj === OBJECTS.TORCH) {
          this.renderCaveTorch(px, py, t, x, y, theme);
        }
      }
    }

    // PASS 3: Cave Enemies & Player
    if (this.enemyManager) {
      const minX = bounds.startX * TILE_SIZE - 64;
      const maxX = bounds.endX * TILE_SIZE + 64;
      const minY = bounds.startY * TILE_SIZE - 64;
      const maxY = bounds.endY * TILE_SIZE + 64;

      const caveEnemies = this.enemyManager.getActiveEnemies();
      for (const enemy of caveEnemies) {
        if (enemy.x >= minX && enemy.x <= maxX &&
            enemy.y >= minY && enemy.y <= maxY) {
          enemy.render(this.ctx, t, 1.0);
        }
      }
      this.enemyManager.renderLoot(this.ctx, t);
    }

    this.player.render(this.ctx, this.spriteManager, t, 1.0);

    // Combat layer: flying arrows, slashes, hit effects, floating texts
    if (this.combat) {
      this.combat.render(this.ctx, bounds, t);
    }

    // PASS 4: Ambient Atmosphere (Biome-spezifische Effekte)
    this.renderCaveAtmosphere(bounds, t);

    this.camera.release(this.ctx);

    // PASS 5: Dynamic Cavern Darkness Mask with Lantern & Crystal Light Holes
    this.renderCaveDarkness(bounds, t);
  }

  renderGlowCrystal(px, py, t, tx, ty, theme = 'main') {
    let baseCol = '#38bdf8';
    let lightCol = '#e0f2fe';

    if (theme === 'snow') {
      baseCol = '#38bdf8';
      lightCol = '#f0fdfa';
    } else if (theme === 'void') {
      baseCol = '#a855f7';
      lightCol = '#f5d0fe';
    } else if (theme === 'desert') {
      baseCol = '#f59e0b';
      lightCol = '#fef08a';
    } else if (theme === 'forest') {
      baseCol = '#10b981';
      lightCol = '#a7f3d0';
    } else {
      const isPurple = (tx + ty) % 2 === 0;
      baseCol = isPurple ? '#c084fc' : '#38bdf8';
      lightCol = isPurple ? '#f3e8ff' : '#e0f2fe';
    }

    const pulse = Math.sin(t * 3.5 + tx + ty) * 0.2 + 0.8;

    // Glowing aura
    this.ctx.save();
    this.ctx.fillStyle = baseCol;
    this.ctx.globalAlpha = 0.35 * pulse;
    this.ctx.beginPath();
    this.ctx.arc(px + 8, py + 8, 9, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Central crystal spike
    this.ctx.fillStyle = baseCol;
    this.ctx.beginPath();
    this.ctx.moveTo(px + 8, py + 1);
    this.ctx.lineTo(px + 12, py + 13);
    this.ctx.lineTo(px + 4, py + 13);
    this.ctx.closePath();
    this.ctx.fill();

    // Gleaming facet
    this.ctx.fillStyle = lightCol;
    this.ctx.beginPath();
    this.ctx.moveTo(px + 8, py + 1);
    this.ctx.lineTo(px + 8, py + 13);
    this.ctx.lineTo(px + 5, py + 13);
    this.ctx.closePath();
    this.ctx.fill();
  }

  renderCaveMushroom(px, py, t, tx, ty, theme = 'main') {
    let capCol = '#2dd4bf';
    let capLight = '#99f6e4';
    if (theme === 'swamp') {
      capCol = '#84cc16';
      capLight = '#bef264';
    } else if (theme === 'void') {
      capCol = '#c084fc';
      capLight = '#f5d0fe';
    }

    const pulse = Math.sin(t * 3.0 + tx * 3 + ty * 5) * 0.2 + 0.8;
    this.ctx.save();
    this.ctx.fillStyle = capCol;
    this.ctx.globalAlpha = 0.28 * pulse;
    this.ctx.beginPath();
    this.ctx.arc(px + 8, py + 8, 7, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Stem
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.fillRect(px + 7, py + 8, 2, 5);

    // Glowing Cap
    this.ctx.fillStyle = capCol;
    this.ctx.beginPath();
    this.ctx.arc(px + 8, py + 7, 4, Math.PI, 0);
    this.ctx.fill();

    this.ctx.fillStyle = capLight;
    this.ctx.fillRect(px + 7, py + 6, 2, 1.5);
  }

  renderCaveAtmosphere(bounds, t) {
    const centerTheme = this.map.getTheme ? this.map.getTheme(Math.floor(this.player.x / TILE_SIZE), Math.floor(this.player.y / TILE_SIZE)) : 'main';

    if (centerTheme === 'snow') {
      // Schnee- & Eisflocken in Eishöhlen
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 89 + Math.sin(t * 1.5 + i) * 15) % (this.map.width * TILE_SIZE));
        const sy = ((i * 127 + t * 25) % (this.map.height * TILE_SIZE));
        this.ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
        this.ctx.fillRect(sx, sy, 2, 2);
      }
    } else if (centerTheme === 'void') {
      // Aufsteigende Astral-Seelenfunken in Leerenhöhlen
      for (let i = 0; i < 20; i++) {
        const vx = ((i * 101 + Math.cos(t * 2 + i) * 18) % (this.map.width * TILE_SIZE));
        const vy = ((i * 139 - t * 30) % (this.map.height * TILE_SIZE) + (this.map.height * TILE_SIZE)) % (this.map.height * TILE_SIZE);
        this.ctx.fillStyle = 'rgba(216, 180, 254, 0.75)';
        this.ctx.fillRect(vx, vy, 2, 2);
      }
    } else if (centerTheme === 'forest') {
      // Schwebende Moos- & Waldsporen
      for (let i = 0; i < 18; i++) {
        const fx = ((i * 79 + Math.sin(t * 2 + i) * 14) % (this.map.width * TILE_SIZE));
        const fy = ((i * 113 + Math.cos(t * 1.5 + i) * 14) % (this.map.height * TILE_SIZE));
        const pulse = Math.sin(t * 3 + i) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(74, 222, 128, ${pulse * 0.7})`;
        this.ctx.fillRect(fx, fy, 2, 2);
      }
    } else {
      // Höhlenwassertropfen von der Decke
      for (let i = 0; i < 15; i++) {
        const dropX = ((i * 73 + t * 4) % (this.map.width * TILE_SIZE));
        const dropY = ((i * 109 + t * 65) % (this.map.height * TILE_SIZE));
        this.ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
        this.ctx.fillRect(dropX, dropY, 1.5, 3);
      }
    }
  }

  renderCaveTorch(px, py, t, tx, ty, theme = 'main') {
    const seed = (tx * 17 + ty * 29);
    const fBob = Math.sin(t * 16 + seed) * 1.2;
    const fSway = Math.cos(t * 12 + seed) * 0.8;

    // 1. Paper card drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.beginPath();
    this.ctx.ellipse(px + 8, py + 14, 5, 2.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Stone / Wooden stand base
    this.ctx.fillStyle = theme === 'snow' ? '#1e293b' : '#334155';
    this.ctx.fillRect(px + 5.5, py + 12, 5, 2.5);

    // 3. Wooden post
    this.ctx.fillStyle = '#78350f';
    this.ctx.fillRect(px + 7, py + 5, 2, 8);

    // 4. Metal bracket / sconce ring
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillRect(px + 5.5, py + 4.5, 5, 2);

    // 5. Flickering Torch Flame
    const tipX = px + 8 + fSway;
    const tipY = py - 2 + fBob;

    // Outer fiery orange-red flame
    this.ctx.fillStyle = '#ea580c';
    this.ctx.beginPath();
    this.ctx.moveTo(px + 5, py + 5);
    this.ctx.quadraticCurveTo(px + 4, py + 1, tipX, tipY);
    this.ctx.quadraticCurveTo(px + 12, py + 1, px + 11, py + 5);
    this.ctx.closePath();
    this.ctx.fill();

    // Inner bright yellow flame
    this.ctx.fillStyle = '#fef08a';
    this.ctx.beginPath();
    this.ctx.moveTo(px + 6.5, py + 5);
    this.ctx.quadraticCurveTo(px + 6, py + 2.5, tipX, tipY + 2);
    this.ctx.quadraticCurveTo(px + 9.5, py + 2.5, px + 9.5, py + 5);
    this.ctx.closePath();
    this.ctx.fill();

    // White-hot center spark
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(px + 7, py + 3.5, 2, 2);

    // Rising ember sparks
    const sparkProg = ((t * 22 + seed) % 20);
    const sparkY = py - sparkProg;
    const sparkX = px + 8 + Math.sin(t * 4 + sparkY) * 3;
    const sparkAlpha = Math.max(0, 1.0 - sparkProg / 20);
    this.ctx.fillStyle = `rgba(254, 215, 170, ${sparkAlpha * 0.85})`;
    this.ctx.fillRect(sparkX, sparkY, 1.5, 1.5);
  }

  renderCaveLightCones(bounds, t) {
    const { startX, endX, startY, endY } = bounds;

    // 1. Warm Player Lantern Fire Cone
    const elevY = Math.round(this.player.visualElevation * ELEVATION_PIXEL_OFFSET);
    const plx = this.player.x + 6;
    const ply = this.player.y - 8 - elevY;
    const pPulse = Math.sin(t * 9) * 3;
    const pRadius = 94 + pPulse;

    const pGrad = this.ctx.createRadialGradient(plx, ply, 6, plx, ply, pRadius);
    pGrad.addColorStop(0, 'rgba(254, 240, 138, 0.48)');
    pGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.24)');
    pGrad.addColorStop(0.75, 'rgba(251, 146, 60, 0.08)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = pGrad;
    this.ctx.beginPath();
    this.ctx.arc(plx, ply, pRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Torches Light Cones
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const obj = this.map.getObjectTile(x, y);
        if (obj === OBJECTS.TORCH) {
          const tx = x * TILE_SIZE + 8;
          const ty = y * TILE_SIZE + 5;
          const fPulse = Math.sin(t * 14 + x * 7 + y * 13) * 3;
          const tRadius = 76 + fPulse;

          const tGrad = this.ctx.createRadialGradient(tx, ty, 4, tx, ty, tRadius);
          tGrad.addColorStop(0, 'rgba(254, 240, 138, 0.46)');
          tGrad.addColorStop(0.42, 'rgba(249, 115, 22, 0.22)');
          tGrad.addColorStop(0.8, 'rgba(234, 88, 12, 0.07)');
          tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          this.ctx.fillStyle = tGrad;
          this.ctx.beginPath();
          this.ctx.arc(tx, ty, tRadius, 0, Math.PI * 2);
          this.ctx.fill();
        }
        else if (obj === OBJECTS.SHRINE) {
          const sx = x * TILE_SIZE + 8;
          const sy = y * TILE_SIZE + 8;
          const sGrad = this.ctx.createRadialGradient(sx, sy, 8, sx, sy, 65);
          sGrad.addColorStop(0, 'rgba(254, 240, 138, 0.38)');
          sGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.16)');
          sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          this.ctx.fillStyle = sGrad;
          this.ctx.beginPath();
          this.ctx.arc(sx, sy, 65, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    // 3. Sunlight Shafts from Cave Hole Exits
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (this.map.getGroundTile(x, y) === TILES.CAVE_HOLE_EXIT) {
          const hx = x * TILE_SIZE + 8;
          const hy = y * TILE_SIZE + 8;
          const hGrad = this.ctx.createRadialGradient(hx, hy, 6, hx, hy, 58);
          hGrad.addColorStop(0, 'rgba(254, 240, 138, 0.52)');
          hGrad.addColorStop(0.45, 'rgba(250, 204, 21, 0.2)');
          hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          this.ctx.fillStyle = hGrad;
          this.ctx.beginPath();
          this.ctx.arc(hx, hy, 58, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }

  renderCaveDarkness(bounds, t) {
    // Fallback if no offscreen canvas available
    if (!this.canopyCanvas || !this.canopyCtx) {
      const elevY = Math.round(this.player.visualElevation * ELEVATION_PIXEL_OFFSET);
      const screenX = Math.round((this.player.x - this.camera.x) * this.camera.zoom);
      const screenY = Math.round((this.player.y - elevY - this.camera.y) * this.camera.zoom);
      const grad = this.ctx.createRadialGradient(screenX, screenY, 40, screenX, screenY, 280);
      grad.addColorStop(0, 'rgba(6, 8, 16, 0.05)');
      grad.addColorStop(0.5, 'rgba(6, 8, 16, 0.55)');
      grad.addColorStop(1, 'rgba(6, 8, 16, 0.95)');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    const cCanvas = this.canopyCanvas;
    const cCtx = this.canopyCtx;

    // 1. Offscreen Canvas leeren
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);

    // 2. Volle Höhlen-Dunkelheit zeichnen
    cCtx.fillStyle = 'rgba(5, 7, 15, 0.94)';
    cCtx.fillRect(0, 0, cCanvas.width, cCanvas.height);

    // 3. Kamera-Transformation für exakte Weltkoordinaten anwenden
    this.camera.apply(cCtx);

    // 4. Ausstanzung via destination-out (Licht-Löcher im Dunkelheits-Schleier)
    cCtx.save();
    cCtx.globalCompositeOperation = 'destination-out';

    // 4a. Spieler-Höhlenlampe (Großer, sanft ausblendender Lichtkreis)
    const elevY = Math.round(this.player.visualElevation * ELEVATION_PIXEL_OFFSET);
    const plx = this.player.x + 6;
    const ply = this.player.y - 8 - elevY;
    const pRadius = 92 + Math.sin(t * 11) * 3;

    const pGrad = cCtx.createRadialGradient(plx, ply, 14, plx, ply, pRadius);
    pGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    pGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.88)');
    pGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.4)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    cCtx.fillStyle = pGrad;
    cCtx.beginPath();
    cCtx.arc(plx, ply, pRadius, 0, Math.PI * 2);
    cCtx.fill();

    // 4b. Fackeln, Kristalle & Schreine im Sichtfeld
    const { startX, endX, startY, endY } = bounds;
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const obj = this.map.getObjectTile(x, y);
        if (obj === OBJECTS.TORCH) {
          const tx = x * TILE_SIZE + 8;
          const ty = y * TILE_SIZE + 5;
          const fPulse = Math.sin(t * 14 + x * 7 + y * 13) * 3;
          const tRadius = 74 + fPulse;

          const tGrad = cCtx.createRadialGradient(tx, ty, 8, tx, ty, tRadius);
          tGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
          tGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.85)');
          tGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.35)');
          tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          cCtx.fillStyle = tGrad;
          cCtx.beginPath();
          cCtx.arc(tx, ty, tRadius, 0, Math.PI * 2);
          cCtx.fill();
        }
        else if (obj === OBJECTS.GLOW_CRYSTAL) {
          const cx = x * TILE_SIZE + 8;
          const cy = y * TILE_SIZE + 8;
          const cPulse = Math.sin(t * 3.5 + x + y) * 2;
          const cRadius = 46 + cPulse;

          const cGrad = cCtx.createRadialGradient(cx, cy, 6, cx, cy, cRadius);
          cGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
          cGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.45)');
          cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          cCtx.fillStyle = cGrad;
          cCtx.beginPath();
          cCtx.arc(cx, cy, cRadius, 0, Math.PI * 2);
          cCtx.fill();
        }
        else if (obj === OBJECTS.SHRINE) {
          const sx = x * TILE_SIZE + 8;
          const sy = y * TILE_SIZE + 8;
          const sGrad = cCtx.createRadialGradient(sx, sy, 10, sx, sy, 65);
          sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
          sGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.5)');
          sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          cCtx.fillStyle = sGrad;
          cCtx.beginPath();
          cCtx.arc(sx, sy, 65, 0, Math.PI * 2);
          cCtx.fill();
        }

        // 4c. Lichtschächte von Oberwelt-Löchern
        const tile = this.map.getGroundTile(x, y);
        if (tile === TILES.CAVE_HOLE_EXIT) {
          const hx = x * TILE_SIZE + 8;
          const hy = y * TILE_SIZE + 8;
          const hGrad = cCtx.createRadialGradient(hx, hy, 8, hx, hy, 56);
          hGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
          hGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.7)');
          hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          cCtx.fillStyle = hGrad;
          cCtx.beginPath();
          cCtx.arc(hx, hy, 56, 0, Math.PI * 2);
          cCtx.fill();
        }
      }
    }

    cCtx.restore();
    this.camera.release(cCtx);

    // 5. Dunkelheits-Maske über die Höhlenszene zeichnen
    this.ctx.drawImage(cCanvas, 0, 0);
  }

  // ==========================================================================
  // SHRINE & BANNER RENDERING (Seltene Shinto-Schreine in Höhlen & Wolken)
  // ==========================================================================
  renderShrine(px, py, t, theme = 'overworld') {
    // Drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.ctx.fillRect(px + 1, py + 11, 14, 5);

    // Stone / Wood Pedestal
    this.ctx.fillStyle = theme === 'cave' ? '#475569' : (theme === 'cloud' ? '#fce7f3' : '#78350f');
    this.ctx.fillRect(px + 3, py + 8, 10, 6);
    this.ctx.fillStyle = theme === 'cave' ? '#334155' : (theme === 'cloud' ? '#f472b6' : '#451a03');
    this.ctx.fillRect(px + 1, py + 13, 14, 3);

    // Wooden Shrine Cabinet
    this.ctx.fillStyle = theme === 'cloud' ? '#fbcfe8' : '#b91c1c';
    this.ctx.fillRect(px + 4, py + 1, 8, 8);

    // Sacred Shimenawa Rope across front
    this.ctx.fillStyle = '#fef08a';
    this.ctx.fillRect(px + 3, py + 3, 10, 1.5);
    // White paper zig-zag shide streamers
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(px + 5, py + 4.5, 1.5, 3);
    this.ctx.fillRect(px + 9, py + 4.5, 1.5, 3);

    // Pagoda Roof
    this.ctx.fillStyle = theme === 'cloud' ? '#db2777' : '#0f172a';
    this.ctx.beginPath();
    this.ctx.moveTo(px, py + 2);
    this.ctx.lineTo(px + 8, py - 4);
    this.ctx.lineTo(px + 16, py + 2);
    this.ctx.closePath();
    this.ctx.fill();

    // Floating Spirit Flame / Orb above shrine
    const flameBob = Math.sin(t * 4 + px) * 2;
    const flameY = py - 7 + flameBob;
    const flameCol = theme === 'cloud' ? '#f472b6' : (theme === 'cave' ? '#38bdf8' : '#34d399');
    this.ctx.fillStyle = flameCol;
    this.ctx.beginPath();
    this.ctx.arc(px + 8, flameY, 2.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Soft flame aura
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(px + 8, flameY, 1.2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderShrineBanner(msg) {
    const w = Math.min(380, this.canvas.width - 40);
    const h = 56;
    const x = Math.round((this.canvas.width - w) / 2);
    const y = 22;

    this.ctx.save();
    // Drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(x + 3, y + 4, w, h);

    // Parchment card
    this.ctx.fillStyle = '#1e1b2e';
    this.ctx.fillRect(x, y, w, h);

    // Gold trim border
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // Header title
    this.ctx.fillStyle = '#fcd34d';
    this.ctx.font = 'bold 13px system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(msg.title, x + w / 2, y + 22);

    // Subtitle / Shrine name
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.font = '12px system-ui, sans-serif';
    this.ctx.fillText(`${msg.name} (Gefunden: ${msg.total})`, x + w / 2, y + 41);

    this.ctx.restore();
  }

  initCharacterSelectModal() {
    if (!this.charSelectModal) return;

    // Set initial name into input
    const initialName = getSelectedPlayerName();
    if (this.heroNameInput) {
      this.heroNameInput.value = initialName;
      this.heroNameInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          setSelectedPlayerName(val);
          if (this.player) this.player.setName(val);
          this.updatePlayerNameUI();
        }
      });
    }

    // Random name dice button
    if (this.btnRandomName) {
      this.btnRandomName.addEventListener('click', () => {
        const randomName = getRandomHeroName();
        if (this.heroNameInput) {
          this.heroNameInput.value = randomName;
        }
        setSelectedPlayerName(randomName);
        if (this.player) this.player.setName(randomName);
        this.updatePlayerNameUI();
      });
    }

    // Wizard Step Navigation
    if (this.btnStep1Next) {
      this.btnStep1Next.addEventListener('click', () => {
        this.goToCharWizardStep(2);
      });
    }
    if (this.btnStep2Back) {
      this.btnStep2Back.addEventListener('click', () => {
        this.goToCharWizardStep(1);
      });
    }
    if (this.btnStep2Next) {
      this.btnStep2Next.addEventListener('click', () => {
        this.goToCharWizardStep(3);
      });
    }
    if (this.btnStep3Back) {
      this.btnStep3Back.addEventListener('click', () => {
        this.goToCharWizardStep(2);
      });
    }

    // Final Start Button: Welt betreten
    if (this.btnStartGame) {
      this.btnStartGame.addEventListener('click', () => {
        this.startGameWithSelectedHero();
      });
    }

    // Dev Tools Re-open Button
    if (this.btnOpenCharSelect) {
      this.btnOpenCharSelect.addEventListener('click', () => {
        this.openCharacterSelectModal();
      });
    }

    // Populate initial cards and start at step 1
    this.goToCharWizardStep(1);
    this.renderCharacterSelectCards();
  }

  goToCharWizardStep(step) {
    this.charWizardStep = step;

    // Ensure valid name before moving past step 1
    if (step >= 2 && this.heroNameInput) {
      const val = this.heroNameInput.value.trim();
      if (!val) {
        const defChar = (typeof CHARACTERS_MAP !== 'undefined' ? CHARACTERS_MAP[this.selectedHeroSkin] : null) || (CHARACTERS_DATA && CHARACTERS_DATA[0]);
        const fallback = defChar ? defChar.name : 'Ren';
        this.heroNameInput.value = fallback;
        setSelectedPlayerName(fallback);
        if (this.player) this.player.setName(fallback);
        this.updatePlayerNameUI();
      }
    }

    // Toggle step containers
    for (let i = 1; i <= 3; i++) {
      const stepEl = document.getElementById(`char-wizard-step-${i}`);
      if (stepEl) {
        stepEl.classList.toggle('active', i === step);
      }
    }

    // Toggle indicator dots
    const dots = document.querySelectorAll('.wizard-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx + 1 === step);
    });

    if (step === 3) {
      this.updateConfirmStep();
    }
  }

  updateConfirmStep() {
    const chosenName = (this.heroNameInput && this.heroNameInput.value.trim()) || (this.player ? this.player.name : 'Ren');
    if (this.confirmHeroNameEl) {
      this.confirmHeroNameEl.textContent = chosenName;
    }
    const defChar = (typeof CHARACTERS_MAP !== 'undefined' ? CHARACTERS_MAP[this.selectedHeroSkin] : null) || (CHARACTERS_DATA && CHARACTERS_DATA[0]);
    if (this.confirmHeroSubEl && defChar) {
      this.confirmHeroSubEl.textContent = defChar.subtitle ? `${defChar.subtitle}.` : `${defChar.name}.`;
    }
    this.renderConfirmPreview();
  }

  renderCharacterSelectCards() {
    if (!this.charSelectGrid) return;
    this.charSelectGrid.innerHTML = '';
    this.charPreviewCanvases = {};

    const list = (typeof CHARACTERS_DATA !== 'undefined' ? CHARACTERS_DATA : []);

    list.forEach(char => {
      const isSelected = char.id === this.selectedHeroSkin;
      const card = document.createElement('div');
      card.className = `char-select-card${isSelected ? ' is-selected' : ''}`;
      card.dataset.charId = char.id;
      card.title = `${char.name} (${char.subtitle})`;

      // Clean card with large figure only - no names or text
      card.innerHTML = `
        <canvas width="78" height="88" class="char-card-canvas" data-char-id="${char.id}"></canvas>
      `;

      card.addEventListener('click', () => {
        this.selectedHeroSkin = char.id;
        setSelectedSkin(char.id);
        if (this.player) this.player.setSkin(char.id);

        this.charSelectGrid.querySelectorAll('.char-select-card').forEach(c => {
          c.classList.toggle('is-selected', c.dataset.charId === char.id);
        });

        if (this.charWizardStep === 3) {
          this.updateConfirmStep();
        }
      });

      this.charSelectGrid.appendChild(card);

      const canvas = card.querySelector('canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          this.charPreviewCanvases[char.id] = { canvas, ctx, charDef: char };
        }
      }
    });

    this.updateCharacterSelectPreviews(0);
  }

  updateCharacterSelectPreviews(dt) {
    if (this.charWizardStep === 2 && this.charPreviewCanvases) {
      for (const [id, item] of Object.entries(this.charPreviewCanvases)) {
        const { canvas, ctx, charDef } = item;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (typeof charDef.render === 'function') {
          ctx.save();
          ctx.translate(39, 74);
          ctx.scale(1.65, 1.65);
          charDef.render(ctx, 0, 0, this.animTime, 'down', true, 0);
          ctx.restore();
        }
      }
    } else if (this.charWizardStep === 3) {
      this.renderConfirmPreview();
    }
  }

  renderConfirmPreview() {
    if (!this.confirmCanvas || !this.confirmCtx) {
      this.confirmCanvas = document.getElementById('char-confirm-canvas');
      if (this.confirmCanvas) this.confirmCtx = this.confirmCanvas.getContext('2d');
    }
    if (!this.confirmCanvas || !this.confirmCtx) return;

    const defChar = (typeof CHARACTERS_MAP !== 'undefined' ? CHARACTERS_MAP[this.selectedHeroSkin] : null) || (CHARACTERS_DATA && CHARACTERS_DATA[0]);
    if (!defChar || typeof defChar.render !== 'function') return;

    const ctx = this.confirmCtx;
    ctx.clearRect(0, 0, this.confirmCanvas.width, this.confirmCanvas.height);
    ctx.save();
    ctx.translate(60, 98);
    ctx.scale(2.2, 2.2);
    defChar.render(ctx, 0, 0, this.animTime, 'down', true, 0);
    ctx.restore();
  }

  startGameWithSelectedHero() {
    let chosenName = this.heroNameInput ? this.heroNameInput.value.trim() : '';
    if (!chosenName) {
      const defChar = (typeof CHARACTERS_MAP !== 'undefined' ? CHARACTERS_MAP[this.selectedHeroSkin] : null) || (CHARACTERS_DATA && CHARACTERS_DATA[0]);
      chosenName = defChar ? defChar.name : 'Ren';
    }

    setSelectedPlayerName(chosenName);
    setSelectedSkin(this.selectedHeroSkin);

    if (this.player) {
      this.player.setName(chosenName);
      this.player.setSkin(this.selectedHeroSkin);
    }

    this.updatePlayerNameUI();

    if (this.charSelectModal) {
      this.charSelectModal.classList.add('hidden');
    }
    this.isCharacterSelectOpen = false;
  }

  openCharacterSelectModal() {
    if (!this.charSelectModal) return;
    this.isCharacterSelectOpen = true;
    this.selectedHeroSkin = this.player ? (this.player.skinId || getSelectedSkin()) : getSelectedSkin();
    if (this.heroNameInput && this.player) {
      this.heroNameInput.value = this.player.name || getSelectedPlayerName();
    }
    this.charSelectModal.classList.remove('hidden');
    this.goToCharWizardStep(1);
    this.renderCharacterSelectCards();
  }

  updatePlayerNameUI() {
    const name = this.player ? this.player.name : getSelectedPlayerName();
    if (this.compactPlayerNameEl) {
      this.compactPlayerNameEl.textContent = name;
    }
  }
}

// Start Game on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});


})();
