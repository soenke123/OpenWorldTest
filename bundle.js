(function() {

// --- js/constants.js ---
// 16x16 Tile Size for fine, detailed pixel-art and organic shapes
const TILE_SIZE = 16;

// World Dimensions in Tiles (290 x 200 = 4640 x 3200 px, 5x larger than original test world)
const MAP_WIDTH = 290;
const MAP_HEIGHT = 200;

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

// =============================================================================
// PVP & COMBAT BALANCE CONFIG (Zentrale Konfiguration für alle PvP- und Kampf-Werte)
// =============================================================================
const PVP_CONFIG = {
  // 1. Lebenspunkte (HP)
  PLAYER_BASE_HP: 100,                  // Start-Lebenspunkte eines Spielers
  HP_PER_SKILL_POINT: 15,               // Zusätzliche Max-HP pro Skillpunkt
  BEAR_HP_MULTIPLIER: 1.5,              // Lebenspunkte-Multiplikator im Bären-Modus (1.5 = +50%)

  // 2. Nahkampf-Schaden (Melee)
  MELEE_SLASH_1_DMG: 20,                // 1. Schlag der Kombo
  MELEE_SLASH_2_DMG: 20,                // 2. Schlag der Kombo
  MELEE_THRUST_DMG: 30,                 // 3. Schlag (Stich / Ausfallschritt)
  MELEE_SPIN_DMG: 25,                   // 360° Wirbelattacke
  MELEE_DMG_PER_SKILL: 4,               // Bonus-Schaden pro Nahkampf-Skillpunkt
  BEAR_DMG_MULTIPLIER: 2.0,             // Schadens-Multiplikator im Bären-Modus (2.0 = doppelter Schaden)

  // 3. Fernkampf-Schaden (Bogen & Pfeile)
  ARROW_NORMAL_DMG: 30,                 // Normaler Schnellschuss
  ARROW_CHARGED_DMG: 50,                // Aufgeladener Schuss (Aimed Shot)

  // 4. Schild-System
  SHIELD_MAX_ENERGY: 100,               // Maximale Schild-Energie
  SHIELD_PER_SKILL_POINT: 15,           // Zusätzliche Schild-Energie pro Skillpunkt
  SHIELD_DRAIN_PER_SEC: 10,             // Energie-Verbrauch pro Sekunde beim aktiven Halten
  SHIELD_RECHARGE_PER_SEC: 20,          // Aufladung pro Sekunde nach Pause
  SHIELD_RECHARGE_DELAY: 1.0,           // Pause in Sekunden vor Beginn der Aufladung
  SHIELD_STUN_DURATION: 1.2,            // Betäubungsdauer in Sekunden bei Schildbruch (0 Energie)
  SHIELD_MELEE_DAMAGE_REDUCTION: 1.00,  // Block-Effizienz gegen Nahkampf (0.80 = 80% geblockt, 20% geht durch)
  SHIELD_ARROW_DAMAGE_REDUCTION: 1.00,  // Block-Effizienz gegen Pfeile (1.00 = 100% geblockt, 0% geht durch)

  // 5. Magie & Artefakte
  SPELL_FROST_DMG: 10,                  // Schaden des Eisnebels
  SPELL_FROST_FREEZE_TIME: 2.0,         // Einfrierdauer in Sekunden
  SPELL_PLASMA_ORB_DMG: 60,             // Schaden pro Plasmakugel
  SPELL_PHOENIX_DMG: 120,               // Schaden des Phönix-Flammensturms

  // 6. Dash (Ausweichen & I-Frames)
  DASH_DURATION: 0.18,                  // Dauer des Dashs in Sekunden (vollständige Unverwundbarkeit)
  DASH_SPEED: 265,                      // Geschwindigkeit während des Dashs
  DASH_COOLDOWN: 0.72,                  // Abklingzeit bis zum nächsten Dash

  // 7. Rückstoß (Knockback)
  KNOCKBACK_MULTIPLIER: 1.0,            // Globaler Multiplikator für PvP-Rückstoß (z.B. 0.5 = sanfter, 2.0 = extrem weit wegfliegen)
  MELEE_KNOCKBACK_SLASH: 80,            // Rückstoß bei Slash 1 & 2 (Pixel-Impuls)
  MELEE_KNOCKBACK_THRUST: 320,          // Rückstoß beim Stich / Ausfallschritt
  MELEE_KNOCKBACK_SPIN: 290,            // Rückstoß bei der Wirbelattacke
  ARROW_KNOCKBACK_NORMAL: 70,           // Rückstoß bei normalem Pfeiltreffer
  ARROW_KNOCKBACK_CHARGED: 140,         // Rückstoß bei aufgeladenem Pfeiltreffer

  // 8. Bogen: Feuerrate & Fluggeschwindigkeit
  ARROW_FIRE_RATE: 0.50,                // Schuss-Intervall beim Gedrückthalten in Sekunden (z.B. 0.5 = 2 Pfeile/s, 0.25 = 4 Pfeile/s Schnellfeuer)
  ARROW_CHARGE_TIME: 0.55,              // Ladezeit für gezielten Schuss in Sekunden
  ARROW_FLIGHT_SPEED: 330,              // Fluggeschwindigkeit normaler Pfeil (Pixel/Sekunde)
  ARROW_CHARGED_FLIGHT_SPEED: 580,      // Fluggeschwindigkeit gezielter Pfeil (Pixel/Sekunde)
  ARROW_RANGE: 165,                     // Reichweite normaler Pfeil in Pixeln
  ARROW_CHARGED_RANGE: 270              // Reichweite gezielter Pfeil in Pixeln
};

// Player Settings for 16px Scale
const PLAYER_CONFIG = {
  BASE_SPEED: 135,
  SPRINT_MULTIPLIER: 1.5,
  RADIUS: 5.5,
  MAX_HP: PVP_CONFIG.PLAYER_BASE_HP,
  CANOPY_REVEAL_RADIUS: 52 // Exakter, scharfer Sichtkreis
};

// Combat & Ability Settings (Zelda / Smash Bros Inspired)
const COMBAT_CONFIG = {
  // Dash
  DASH_DURATION: PVP_CONFIG.DASH_DURATION,
  DASH_SPEED: PVP_CONFIG.DASH_SPEED,
  DASH_COOLDOWN: PVP_CONFIG.DASH_COOLDOWN,

  // Melee & Combo
  COMBO_WINDOW: 0.44,
  COMBO_SLASH_RADIUS: 28,
  COMBO_THRUST_RANGE: 48,
  COMBO_THRUST_WIDTH: 22,
  COMBO_THRUST_KNOCKBACK: PVP_CONFIG.MELEE_KNOCKBACK_THRUST,
  COMBO_THRUST_LUNGE: 18,
  COMBO_RECOVERY_PAUSE: 0.38,
  SPIN_RADIUS: 48,
  SPIN_CHARGE_TIME: 0.45,
  SPIN_KNOCKBACK: PVP_CONFIG.MELEE_KNOCKBACK_SPIN,

  // Shield
  SHIELD_MAX: PVP_CONFIG.SHIELD_MAX_ENERGY,
  SHIELD_DRAIN_RATE: PVP_CONFIG.SHIELD_DRAIN_PER_SEC,
  SHIELD_RECHARGE_RATE: PVP_CONFIG.SHIELD_RECHARGE_PER_SEC,
  SHIELD_RECHARGE_DELAY: PVP_CONFIG.SHIELD_RECHARGE_DELAY,
  SHIELD_STUN_TIME: PVP_CONFIG.SHIELD_STUN_DURATION,
  SHIELD_RADIUS: 22,

  // Ranged (Bow & Arrow)
  MAX_AMMO: 30,
  ARROW_FIRE_RATE: PVP_CONFIG.ARROW_FIRE_RATE,
  ARROW_SPEED: PVP_CONFIG.ARROW_FLIGHT_SPEED,
  ARROW_CHARGED_SPEED: PVP_CONFIG.ARROW_CHARGED_FLIGHT_SPEED,
  ARROW_RANGE: PVP_CONFIG.ARROW_RANGE,
  ARROW_CHARGED_RANGE: PVP_CONFIG.ARROW_CHARGED_RANGE,
  ARROW_CHARGE_TIME: PVP_CONFIG.ARROW_CHARGE_TIME,
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


// --- js/worldPresets.js ---
// =============================================================================
// WORLD PRESETS CONFIGURATION (10 Vielfältige Riesenwelten - 290x200 Kacheln)
// =============================================================================

const WORLD_WIDTH = 290;
const WORLD_HEIGHT = 200;

const WORLD_PRESETS = [
  {
    id: 1,
    name: 'Das Smaragd-Hochland',
    subtitle: 'Üppige Flussauen & alte Eichenwälder',
    mainBiome: 'grass',
    badge: '🌱 Grasland',
    color: '#22c55e',
    seed: 1042,
    spawnPoint: { x: 50, y: 100 },
    spawnClearingRadius: 15,
    description: 'Eine sonnendurchflutete grüne Landschaft mit weiten Lichtungen, 5 großen Waldhainen, zwei mächtigen Flüssen mit Holzbrücken und seltenem Schnee im Norden.',
    voidZone: { x: 268, y: 40, radius: 18, name: 'Nordost-Rift' },
    forestCount: 5,
    trampolineCount: 18,
    shrineCount: 1
  },
  {
    id: 2,
    name: 'Die Ewige Frost-Tundra',
    subtitle: 'Verschneite Hochebenen & Gletscherseen',
    mainBiome: 'snow',
    badge: '❄️ Eislande',
    color: '#38bdf8',
    seed: 2841,
    spawnPoint: { x: 60, y: 95 },
    spawnClearingRadius: 15,
    description: 'Eine eisige Welt aus Schnee, Gletscherspalten und dichten Kiefernwäldern. Ein riesiger zugefrorener Bergsee dominiert das Zentrum. Die Leere liegt am fernen Südrand.',
    voidZone: { x: 265, y: 175, radius: 18, name: 'Südost-Gletscherabgrund' },
    forestCount: 6,
    trampolineCount: 17,
    shrineCount: 1
  },
  {
    id: 3,
    name: 'Die Goldene Sonnendüne',
    subtitle: 'Wanderdünen, Oasen & Felsplateaus',
    mainBiome: 'desert',
    badge: '🏜️ Wüste',
    color: '#f59e0b',
    seed: 3912,
    spawnPoint: { x: 55, y: 105 },
    spawnClearingRadius: 15,
    description: 'Glühende Wüstenmeere mit tückischem Treibsand, schattigen Palmenoasen und weiten Sandsteinplateaus. Im Osten klafft ein verlassener Leerenkrater.',
    voidZone: { x: 272, y: 110, radius: 17, name: 'Östlicher Dünenkrater' },
    forestCount: 4,
    trampolineCount: 16,
    shrineCount: 1
  },
  {
    id: 4,
    name: 'Das Flusstal von Eldoria',
    subtitle: 'Mächtige Doppelströme & Seenplatte',
    mainBiome: 'grass',
    badge: '🌱 Grasland',
    color: '#10b981',
    seed: 4721,
    spawnPoint: { x: 70, y: 85 },
    spawnClearingRadius: 15,
    description: 'Ein von zwei gewaltigen Flüssen durchzogenes Tal mit üppiger Vegetation, 6 Mischwäldern und einem weitläufigen Binnensee mit Insel.',
    voidZone: { x: 145, y: 186, radius: 18, name: 'Südliches Bruch-Rift' },
    forestCount: 6,
    trampolineCount: 18,
    shrineCount: 1
  },
  {
    id: 5,
    name: 'Der Gletscher-Abgrund',
    subtitle: 'Eisstürme, Nadelwälder & Kletterpfade',
    mainBiome: 'snow',
    badge: '❄️ Eislande',
    color: '#0ea5e9',
    seed: 5193,
    spawnPoint: { x: 65, y: 110 },
    spawnClearingRadius: 15,
    description: 'Imposante Höhenstufen und Steilwände aus weißem Eis. Schneebedeckte Haine und geheime Grottenzugänge prägen die Bergketten.',
    voidZone: { x: 20, y: 170, radius: 17, name: 'Südwestlicher Abgrund' },
    forestCount: 5,
    trampolineCount: 16,
    shrineCount: 1
  },
  {
    id: 6,
    name: 'Die Obsidian-Schlucht',
    subtitle: 'Canyons, Akazien & Oasenflüsse',
    mainBiome: 'desert',
    badge: '🏜️ Wüste',
    color: '#d97706',
    seed: 6384,
    spawnPoint: { x: 50, y: 90 },
    spawnClearingRadius: 15,
    description: 'Tief eingeschnittene rote Canyons, gewundene Schluchten mit kleinen Quellflüssen und seltsamen Felsformationen. Die Leere liegt ganz im Norden.',
    voidZone: { x: 150, y: 16, radius: 17, name: 'Nördliche Kluft' },
    forestCount: 5,
    trampolineCount: 16,
    shrineCount: 1
  },
  {
    id: 7,
    name: 'Der Urwald von Sakura',
    subtitle: 'Kirschblüten, Dickichte & Geisterweiher',
    mainBiome: 'grass',
    badge: '🌱 Grasland',
    color: '#ec4899',
    seed: 7452,
    spawnPoint: { x: 60, y: 100 },
    spawnClearingRadius: 16,
    description: 'Ein märchenhafter Riesenwald mit rosa Kirschblüten, Moosbächen und uralten Holzbrücken. Ein dichter Sumpf liegt versteckt im Südosten.',
    voidZone: { x: 270, y: 165, radius: 18, name: 'Südost-Schattenforst' },
    forestCount: 7,
    trampolineCount: 18,
    shrineCount: 1
  },
  {
    id: 8,
    name: 'Die Frostkristall-Gipfel',
    subtitle: 'Gletscherkämme, Bergseen & 8 Heiligtümer',
    mainBiome: 'snow',
    badge: '❄️ Eislande',
    color: '#67e8f9',
    seed: 8319,
    spawnPoint: { x: 55, y: 105 },
    spawnClearingRadius: 15,
    description: 'Majestätische Doppelgipfel auf Ebene +2 mit zahlreichen Kletterrampen, eisblauen Bergseen und 8 geheimen Schreinen für tapfere Entdecker.',
    voidZone: { x: 268, y: 55, radius: 18, name: 'Nordost-Eisspalte' },
    forestCount: 6,
    trampolineCount: 17,
    shrineCount: 1
  },
  {
    id: 9,
    name: 'Das Sandmeer von Al-Zahra',
    subtitle: 'Endlose Dünen, Oasenketten & Skorpionfelsen',
    mainBiome: 'desert',
    badge: '🏜️ Wüste',
    color: '#eab308',
    seed: 9247,
    spawnPoint: { x: 45, y: 95 },
    spawnClearingRadius: 15,
    description: 'Eine atemberaubende, weitläufige Wüstenwelt mit verbundenen Oasen, Palmenhainen und verborgenen Grotteneingängen.',
    voidZone: { x: 275, y: 100, radius: 18, name: 'Östliches Astraltor' },
    forestCount: 4,
    trampolineCount: 16,
    shrineCount: 1
  },
  {
    id: 10,
    name: 'Die Urwüchsigen Lande',
    subtitle: 'Kontinentale Vielfalt mit allen Landschaftsformen',
    mainBiome: 'grass',
    badge: '🌱 Grasland',
    color: '#84cc16',
    seed: 10835,
    spawnPoint: { x: 55, y: 100 },
    spawnClearingRadius: 16,
    description: 'Eine harmonische Großwelt, die weite Grasländer, dichte Laub- und Tannenwälder, weite Flüsse und kleine Wüstenausläufer perfekt vereint.',
    voidZone: { x: 270, y: 180, radius: 18, name: 'Südost-Urzeit-Abgrund' },
    forestCount: 7,
    trampolineCount: 18,
    shrineCount: 1
  }
];

function getWorldPreset(id) {
  const num = parseInt(id, 10) || 1;
  return WORLD_PRESETS.find(p => p.id === num) || WORLD_PRESETS[0];
}

function getAllWorldPresets() {
  return WORLD_PRESETS;
}

const STORAGE_KEY = 'ocarina_selected_world_id';

function getSelectedWorldId() {
  // Check URL query parameter first: ?world=3
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const qWorld = parseInt(params.get('world'), 10);
    if (qWorld >= 1 && qWorld <= 10) {
      return qWorld;
    }
  }
  // Check localStorage
  if (typeof localStorage !== 'undefined') {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    if (saved >= 1 && saved <= 10) {
      return saved;
    }
  }
  return 1;
}

function setSelectedWorldId(id) {
  const num = parseInt(id, 10);
  if (num >= 1 && num <= 10 && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, num.toString());
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

    // Seltene Schrein-Nische am Seeufer (Schrein 1)
    const shrineX = roomNE.x + 7;
    const shrineY = roomNE.y - 4;
    if (this.isValid(shrineX, shrineY) && this.ground[shrineY][shrineX] === TILES.CAVE_FLOOR) {
      this.objects[shrineY][shrineX] = OBJECTS.SHRINE;
      this.shrines.push({ x: shrineX, y: shrineY, name: 'Schrein des Tiefenwassers' });
      placeTorchIfFloor(shrineX - 2, shrineY);
      placeTorchIfFloor(shrineX + 2, shrineY);
    }

    // Zweiter Schrein im Höhlensystem: Schrein der Uralten Tiefen (Schrein 2)
    const shrine2X = roomSW.x - 5;
    const shrine2Y = roomSW.y + 4;
    if (this.isValid(shrine2X, shrine2Y)) {
      this.ground[shrine2Y][shrine2X] = TILES.CAVE_FLOOR;
      this.objects[shrine2Y][shrine2X] = OBJECTS.SHRINE;
      this.shrines.push({ x: shrine2X, y: shrine2Y, name: 'Schrein der Uralten Tiefen' });
      placeTorchIfFloor(shrine2X - 2, shrine2Y);
      placeTorchIfFloor(shrine2X + 2, shrine2Y);
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


// --- js/map.js ---

class WorldMap {
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
      // 1. West- & Spawn-Region (Grasland & Vorwälder)
      { x: Math.round(this.width * 0.24), y: Math.round(this.height * 0.36), targetCave: 'main_complex', targetX: 16, targetY: 17, name: 'Grasland-Kluft (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.18), y: Math.round(this.height * 0.16), targetCave: 'forest_grotto', targetX: 11, targetY: 9, name: 'Mooswald-Loch (Moosige Grotte)' },
      { x: Math.round(this.width * 0.12), y: Math.round(this.height * 0.30), targetCave: 'forest_grotto', targetX: 12, targetY: 10, name: 'Alteiche-Schacht (Moosige Grotte)' },
      { x: Math.round(this.width * 0.28), y: Math.round(this.height * 0.18), targetCave: 'main_complex', targetX: 17, targetY: 17, name: 'Nordwest-Stollen (Tiefenhöhlen)' },
      { x: this.spawnPoint.x + 18, y: this.spawnPoint.y - 14, targetCave: 'main_complex', targetX: 16, targetY: 18, name: 'Spawn-Gipfelspalte (Tiefenhöhlen)' },
      { x: this.spawnPoint.x - 14, y: this.spawnPoint.y + 24, targetCave: 'main_complex', targetX: 19, targetY: 17, name: 'Lichtungsschacht (Tiefenhöhlen)' },

      // 2. Wüsten- & Canyon-Region (Südwesten)
      { x: Math.round(this.width * 0.24), y: Math.round(this.height * 0.84), targetCave: 'main_complex', targetX: 20, targetY: 53, name: 'Wüsten-Trichter (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.14), y: Math.round(this.height * 0.74), targetCave: 'main_complex', targetX: 21, targetY: 53, name: 'Dünen-Erdloch (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.32), y: Math.round(this.height * 0.78), targetCave: 'main_complex', targetX: 18, targetY: 52, name: 'Sandstein-Riss (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.10), y: Math.round(this.height * 0.86), targetCave: 'main_complex', targetX: 21, targetY: 55, name: 'Oasen-Senke (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.22), y: Math.round(this.height * 0.94), targetCave: 'main_complex', targetX: 23, targetY: 52, name: 'Südwest-Schlucht (Tiefenhöhlen)' },

      // 3. Schnee- & Gletscher-Region (Nordosten)
      { x: Math.round(this.width * 0.78), y: Math.round(this.height * 0.16), targetCave: 'snow_grotto', targetX: 11, targetY: 9, name: 'Schnee-Eisspalte (Eis-Grotte)' },
      { x: Math.round(this.width * 0.86), y: Math.round(this.height * 0.24), targetCave: 'snow_grotto', targetX: 12, targetY: 10, name: 'Gletscher-Höhle (Eis-Grotte)' },
      { x: Math.round(this.width * 0.68), y: Math.round(this.height * 0.22), targetCave: 'main_complex', targetX: 58, targetY: 22, name: 'Eispass-Stollen (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.74), y: Math.round(this.height * 0.32), targetCave: 'main_complex', targetX: 76, targetY: 22, name: 'Frostkamm-Einsturz (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.92), y: Math.round(this.height * 0.14), targetCave: 'snow_grotto', targetX: 10, targetY: 9, name: 'Nordkap-Kluft (Eis-Grotte)' },

      // 4. Sumpf- & Nebelmoor-Region (Südosten)
      { x: Math.round(this.width * 0.66), y: Math.round(this.height * 0.72), targetCave: 'main_complex', targetX: 74, targetY: 51, name: 'Sumpf-Kuhle (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.72), y: Math.round(this.height * 0.80), targetCave: 'main_complex', targetX: 72, targetY: 53, name: 'Schilf-Trichter (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.58), y: Math.round(this.height * 0.76), targetCave: 'main_complex', targetX: 75, targetY: 51, name: 'Moorloch (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.80), y: Math.round(this.height * 0.88), targetCave: 'main_complex', targetX: 75, targetY: 54, name: 'Teerpfuhl-Grotte (Tiefenhöhlen)' },

      // 5. Void-Zone & Umfeld
      { x: this.preset.voidZone.x - 7, y: this.preset.voidZone.y + 6, targetCave: 'void_grotto', targetX: 12, targetY: 9, name: 'Leeren-Riss (Astrale Kluft)' },
      { x: this.preset.voidZone.x + 7, y: this.preset.voidZone.y - 6, targetCave: 'void_grotto', targetX: 13, targetY: 10, name: 'Schatten-Schlund (Astrale Kluft)' },

      // 6. Zentrales Tal, Seenplatte & Hochebenen
      { x: Math.round(this.width * 0.46), y: Math.round(this.height * 0.34), targetCave: 'main_complex', targetX: 44, targetY: 32, name: 'Flusstal-Klamm (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.56), y: Math.round(this.height * 0.40), targetCave: 'main_complex', targetX: 42, targetY: 34, name: 'Seeterrassen-Schacht (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.82), y: Math.round(this.height * 0.46), targetCave: 'main_complex', targetX: 46, targetY: 30, name: 'Ostplateau-Grotte (Tiefenhöhlen)' },
      { x: Math.round(this.width * 0.40), y: Math.round(this.height * 0.68), targetCave: 'main_complex', targetX: 46, targetY: 54, name: 'Südübergang-Höhle (Tiefenhöhlen)' }
    ];

    this.holeEntrances = [];

    for (const d of desiredEntrances) {
      const spot = this.findSafeCaveEntranceSpot(d.x, d.y);
      const entrance = {
        ...d,
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


// --- js/magic.js ---
// =============================================================================
// MAGIC & ARTIFACT SYSTEM (Zauber- & Artefakt-System)
// =============================================================================

const ARTIFACT_TYPES = {
  PHOENIX: {
    id: 'phoenix',
    name: 'Rubin-Phönix',
    title: 'Flammen-Phönix',
    icon: '🔥',
    description: 'Ein mächtiger flammender Phönix schnellt in Blickrichtung hervor. Er erstreckt sich über 5 Kacheln (80px) und fliegt unaufhaltsam bis an den Rand der gesamten Welt. Alle Monster in seiner Schneise erleiden verheerenden Feuerschaden.',
    maxCharges: 5,
    rechargeBonus: 3,
    cooldown: 3.0,
    damage: 220,
    widthTiles: 5,
    speed: 360,
    colorTheme: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.5)'
  },
  DRUID_BEAR: {
    id: 'druid_bear',
    name: 'Smaragd-Druide',
    title: 'Bärengestalt',
    icon: '🐻',
    description: 'Entfesselt uralte Druidenmagie mit smaragdgrünem Leuchten. Verwandelt dich für 1 Minute in einen mächtigen Bären mit 50% mehr Leben! Deine Prankenhiebe sind 20% langsamer, aber doppelt so stark mit mehr Rückstoß. Der Vorstoß reicht 20% weiter. Kein Bogen, stattdessen mächtiger Krallenwirbel.',
    maxCharges: 5,
    rechargeBonus: 3,
    cooldown: 2.0,
    damage: 0,
    widthTiles: 0,
    speed: 0,
    colorTheme: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.6)'
  },
  PLASMA_ORBS: {
    id: 'plasma_orbs',
    name: 'Rosa Plasmakugeln',
    title: 'Plasma-Orbit',
    icon: '🔮',
    description: 'Beschwört kurz nacheinander 4 pulsierende rosa Plasmakugeln in deine Umlaufbahn. Sie blinken mit ansteigender Frequenz und detonieren nacheinander in verheerenden Plasma-Explosionen mit hohem Schaden und enormem Rückstoß.',
    maxCharges: 5,
    rechargeBonus: 3,
    cooldown: 3.0,
    damage: 45,
    widthTiles: 3,
    speed: 0,
    colorTheme: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.6)'
  },
  VOID_TELEPORT: {
    id: 'void_teleport',
    name: 'Leeren-Teleport',
    title: 'Schatten-Riss',
    icon: '🌌',
    description: 'Nutzt die dimensionale Teleportation der Schattenmonster. Öffnet eine taktische Karte aller aufgedeckten Gebiete. Wähle ein begehbares Ziel auf der Karte, um dich mit violetter Leeren-Implosion sofort dorthin zu teleportieren.',
    maxCharges: 5,
    rechargeBonus: 3,
    cooldown: 1.0,
    damage: 0,
    widthTiles: 0,
    speed: 0,
    colorTheme: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.6)'
  },
  FROST_CONE: {
    id: 'frost_cone',
    name: 'Eisnebel',
    title: 'Frost-Kollaps',
    icon: '❄️',
    description: 'Entfesselt einen eisigen Frostnebel in einem weiten Kegel vor dir. Alle getroffenen Monster werden sofort eingefroren (keine Bewegung, kein Angriff). Die Froststarre hält je nach Monsterstärke zwischen 0,5 und 3,0 Sekunden an.',
    maxCharges: 5,
    rechargeBonus: 3,
    cooldown: 2.5,
    damage: 0,
    widthTiles: 4,
    speed: 0,
    colorTheme: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.6)'
  }
};

function getArtifactDef(typeId) {
  if (!typeId) return ARTIFACT_TYPES.PHOENIX;
  const key = String(typeId).toUpperCase();
  if (ARTIFACT_TYPES[key]) return ARTIFACT_TYPES[key];
  for (const def of Object.values(ARTIFACT_TYPES)) {
    if (def.id === typeId) return def;
  }
  return ARTIFACT_TYPES.PHOENIX;
}

const getElement = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);

class MagicManager {
  constructor(game) {
    this.game = game;
    this.groundArtifacts = [];
    this.activeSpells = [];
    this.activePlasmaSequences = [];
    this.playerGlitterParticles = [];
    this.glitterTimer = 0;

    this.isSwapModalOpen = false;
    this.pendingGroundArtifact = null;

    // Aiming Stencil State (Schablone bei Halten)
    this.isAiming = false;
    this.aimTimer = 0;

    // Shrine Respawn Queue (2-3 Min / 120-180s)
    this.respawnQueue = [];
    this.pickupCooldown = 0;

    // Teleportation Map State
    this.isTeleportModalOpen = false;
    this.teleportHoverTile = null;

    // UI elements
    this.magicHudSlot = getElement('magic-hud-slot');
    this.btnCastMagic = getElement('btn-cast-magic');
    this.btnMagicInfo = getElement('btn-magic-info');
    this.magicChargesBadge = getElement('magic-charges-badge');
    this.magicCooldownOverlay = getElement('magic-cooldown-overlay');
    this.magicInfoModal = getElement('magic-info-modal');
    this.btnInfoModalClose = getElement('btn-magic-info-close');
    this.artifactSwapModal = getElement('artifact-swap-modal');
    this.magicPickupBanner = getElement('magic-pickup-banner');

    this.teleportModal = getElement('teleport-map-modal');
    this.teleportCanvas = getElement('teleportMapCanvas');
    this.btnTeleportClose = getElement('btn-teleport-map-close');
    this.btnTeleportConfirm = getElement('btn-teleport-confirm');
    this.selectedTeleportTile = null;

    this.initEvents();
  }

  initEvents() {
    if (this.btnCastMagic) {
      const handlePress = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.startAiming(this.game?.player);
      };

      const handleRelease = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        if (this.isAiming) {
          this.releaseAiming(this.game?.player, this.game?.map, this.game?.combat);
        }
      };

      const handleCancel = () => {
        this.cancelAiming();
      };

      this.btnCastMagic.addEventListener('pointerdown', handlePress);
      this.btnCastMagic.addEventListener('pointerup', handleRelease);
      this.btnCastMagic.addEventListener('pointercancel', handleCancel);

      this.btnCastMagic.addEventListener('touchstart', handlePress, { passive: false });
      this.btnCastMagic.addEventListener('touchend', handleRelease, { passive: false });
      this.btnCastMagic.addEventListener('touchcancel', handleCancel, { passive: true });

      this.btnCastMagic.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        if (this.isAiming) {
          this.releaseAiming(this.game?.player, this.game?.map, this.game?.combat);
        } else {
          this.castActiveSpell(this.game?.player, this.game?.map, this.game?.combat);
        }
      });
    }

    // Window release safety fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', () => {
        if (this.isAiming) {
          this.releaseAiming(this.game?.player, this.game?.map, this.game?.combat);
        }
      });
      window.addEventListener('mouseup', () => {
        if (this.isAiming) {
          this.releaseAiming(this.game?.player, this.game?.map, this.game?.combat);
        }
      });
      window.addEventListener('touchend', () => {
        if (this.isAiming) {
          this.releaseAiming(this.game?.player, this.game?.map, this.game?.combat);
        }
      });
    }

    if (this.btnMagicInfo) {
      const handleInfo = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.toggleInfoModal(true);
      };
      this.btnMagicInfo.addEventListener('click', handleInfo);
      this.btnMagicInfo.addEventListener('touchstart', handleInfo, { passive: false });
    }

    if (this.btnInfoModalClose) {
      const handleClose = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.toggleInfoModal(false);
      };
      this.btnInfoModalClose.addEventListener('click', handleClose);
      this.btnInfoModalClose.addEventListener('touchstart', handleClose, { passive: false });
    }

    // Modal Swap buttons
    const btnSwapAccept = getElement('btn-artifact-swap-accept');
    if (btnSwapAccept) {
      const handleSwap = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.chooseSwap();
      };
      btnSwapAccept.addEventListener('click', handleSwap);
      btnSwapAccept.addEventListener('touchstart', handleSwap, { passive: false });
    }

    const btnSwapRecharge = getElement('btn-artifact-swap-recharge');
    if (btnSwapRecharge) {
      const handleRecharge = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.chooseKeepAndRecharge();
      };
      btnSwapRecharge.addEventListener('click', handleRecharge);
      btnSwapRecharge.addEventListener('touchstart', handleRecharge, { passive: false });
    }

    const btnSwapLeave = getElement('btn-artifact-swap-leave');
    if (btnSwapLeave) {
      const handleLeave = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.closeSwapModal();
      };
      btnSwapLeave.addEventListener('click', handleLeave);
      btnSwapLeave.addEventListener('touchstart', handleLeave, { passive: false });
    }

    // Click backdrop outside modal dialog to dismiss
    if (this.artifactSwapModal) {
      this.artifactSwapModal.addEventListener('click', (e) => {
        if (e.target === this.artifactSwapModal) {
          this.closeSwapModal();
        }
      });
    }

    // Teleport Map Modal Listeners
    if (this.btnTeleportClose) {
      const handleCloseTeleport = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.closeTeleportModal();
      };
      this.btnTeleportClose.addEventListener('click', handleCloseTeleport);
      this.btnTeleportClose.addEventListener('touchstart', handleCloseTeleport, { passive: false });
    }

    if (this.teleportModal) {
      this.teleportModal.addEventListener('click', (e) => {
        if (e.target === this.teleportModal) {
          this.closeTeleportModal();
        }
      });
    }

    // Teleport Confirm Button
    this.btnTeleportConfirm = getElement('btn-teleport-confirm');
    if (this.btnTeleportConfirm) {
      const handleConfirm = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.confirmTeleport();
      };
      this.btnTeleportConfirm.addEventListener('click', handleConfirm);
      this.btnTeleportConfirm.addEventListener('touchstart', handleConfirm, { passive: false });
    }

    if (this.teleportCanvas) {
      const handleCanvasInput = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
        this.selectTeleportTarget(touch.clientX, touch.clientY);
      };

      this.teleportCanvas.addEventListener('click', handleCanvasInput);
      this.teleportCanvas.addEventListener('touchstart', handleCanvasInput, { passive: false });

      const wrap = document.querySelector('.teleport-canvas-wrap');
      if (wrap) {
        wrap.addEventListener('click', (e) => {
          if (e.target === wrap) handleCanvasInput(e);
        });
        wrap.addEventListener('touchstart', (e) => {
          if (e.target === wrap) handleCanvasInput(e);
        }, { passive: false });
      }

      this.teleportCanvas.addEventListener('mousemove', (e) => {
        if (!this.isTeleportModalOpen) return;
        if (!this.selectedTeleportTile) {
          const coords = this.getCanvasCoords(e.clientX, e.clientY);
          if (coords) {
            this.teleportHoverTile = { tx: coords.tx, ty: coords.ty, valid: true };
          }
        }
      });
    }

    // Dev Quick-Equip buttons
    const bindDevEquip = (btnId, artDef) => {
      const btn = getElement(btnId);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.game?.player) {
            this.equipArtifact(this.game.player, artDef);
            this.triggerPickupBanner(artDef, `✨ DEV: ${artDef.name.toUpperCase()} AUSGERÜSTET!`);
          }
        });
      }
    };

    bindDevEquip('dev-equip-phoenix', ARTIFACT_TYPES.PHOENIX);
    bindDevEquip('dev-equip-bear', ARTIFACT_TYPES.DRUID_BEAR);
    bindDevEquip('dev-equip-plasma', ARTIFACT_TYPES.PLASMA_ORBS);
    bindDevEquip('dev-equip-teleport', ARTIFACT_TYPES.VOID_TELEPORT);
    bindDevEquip('dev-equip-frost', ARTIFACT_TYPES.FROST_CONE);
  }

  toggleInfoModal(forceState = null) {
    if (!this.magicInfoModal) return;
    const isClosed = this.magicInfoModal.classList.contains('hidden');
    const shouldOpen = forceState !== null ? forceState : isClosed;
    if (shouldOpen) {
      this.populateInfoModal();
      this.magicInfoModal.classList.remove('hidden');
    } else {
      this.magicInfoModal.classList.add('hidden');
    }
  }

  populateInfoModal() {
    const player = this.game?.player;
    const artifactDef = player?.artifact ? getArtifactDef(player.artifact.id) : ARTIFACT_TYPES.PHOENIX;

    const titleEl = getElement('magic-info-title');
    const iconEl = getElement('magic-info-icon');
    const descEl = getElement('magic-info-desc');
    const chargesEl = getElement('magic-info-charges');
    const cdEl = getElement('magic-info-cooldown');
    const widthEl = getElement('magic-info-width');
    const dmgEl = getElement('magic-info-dmg');

    if (titleEl) titleEl.textContent = artifactDef.name;
    if (iconEl) iconEl.textContent = artifactDef.icon;
    if (descEl) descEl.textContent = artifactDef.description;
    if (chargesEl) chargesEl.textContent = player?.artifact ? `${player.artifact.charges} / ${player.artifact.maxCharges}` : `${artifactDef.maxCharges} Aufladungen`;
    if (cdEl) cdEl.textContent = `${artifactDef.cooldown.toFixed(1)}s`;

    if (artifactDef.id === 'druid_bear') {
      if (widthEl) widthEl.textContent = 'Pranken & Wirbel';
      if (dmgEl) dmgEl.textContent = '2x Schaden (+50% HP)';
    } else if (artifactDef.id === 'plasma_orbs') {
      if (widthEl) widthEl.textContent = '4 Orbs im Orbit';
      if (dmgEl) dmgEl.textContent = `${artifactDef.damage} Plasma-Schaden`;
    } else if (artifactDef.id === 'void_teleport') {
      if (widthEl) widthEl.textContent = 'Aufgedeckte Weltkarte';
      if (dmgEl) dmgEl.textContent = 'Sofortige Teleportation';
    } else {
      if (widthEl) widthEl.textContent = `${artifactDef.widthTiles} Kacheln (80px)`;
      if (dmgEl) dmgEl.textContent = `${artifactDef.damage} Feuerschaden`;
    }
  }

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // GROUND ARTIFACT MANAGEMENT
  // ---------------------------------------------------------------------------
  spawnGroundArtifact(x, y, dimension = DIMENSIONS.OVERWORLD, typeId = 'phoenix', fromShrine = false, subCaveId = null) {
    // Walkable ground verification: ensure artifact is placed on walkable tiles
    let map = null;
    if (dimension === DIMENSIONS.OVERWORLD) map = this.game?.overworldMap;
    else if (dimension === DIMENSIONS.CLOUDS) map = this.game?.cloudMap;
    else if (dimension === DIMENSIONS.CAVES && this.game?.caves) {
      map = subCaveId ? this.game.caves[subCaveId] : this.game.caves.main_complex;
    }

    if (map) {
      let tx = Math.floor(x / TILE_SIZE);
      let ty = Math.floor(y / TILE_SIZE);
      const isSolid = map.isSolid ? map.isSolid(tx, ty) : false;
      const isWalkable = map.isTileWalkable ? map.isTileWalkable(tx, ty) : !isSolid;
      if (!isWalkable || isSolid) {
        let found = false;
        for (let r = 1; r <= 4 && !found; r++) {
          for (let dy = -r; dy <= r && !found; dy++) {
            for (let dx = -r; dx <= r && !found; dx++) {
              const nx = tx + dx;
              const ny = ty + dy;
              if (map.isValid && map.isValid(nx, ny)) {
                const s = map.isSolid ? map.isSolid(nx, ny) : false;
                const w = map.isTileWalkable ? map.isTileWalkable(nx, ny) : !s;
                if (w && !s) {
                  x = nx * TILE_SIZE + 8;
                  y = ny * TILE_SIZE + 8;
                  found = true;
                }
              }
            }
          }
        }
      }
    }

    // 5. An jedem Schrein liegt maximal 1 Artefakt!
    const existing = this.groundArtifacts.find(a =>
      a.dimension === dimension &&
      (dimension !== DIMENSIONS.CAVES || a.subCaveId === subCaveId) &&
      Math.hypot(a.x - x, a.y - y) < 24
    );
    if (existing) {
      return existing; // Kein Duplikat am selben Schrein ablegen
    }

    const artifactDef = getArtifactDef(typeId);
    const artifact = {
      id: `art_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      typeId: artifactDef.id,
      def: artifactDef,
      x,
      y,
      dimension,
      subCaveId,
      fromShrine,
      bobTime: Math.random() * Math.PI * 2,
      lightPulse: 0
    };
    this.groundArtifacts.push(artifact);
    return artifact;
  }

  initShrineArtifacts(caves, cloudMap, overworldMap) {
    this.groundArtifacts = [];
    const ALL_ARTIFACTS = ['phoenix', 'druid_bear', 'plasma_orbs', 'void_teleport', 'frost_cone'];
    const getRandomType = () => ALL_ARTIFACTS[Math.floor(Math.random() * ALL_ARTIFACTS.length)];

    // 1. Shrines in Cloud World (Himmel): Zufälliges Artefakt aus allen 5 Typen
    if (cloudMap && Array.isArray(cloudMap.shrines)) {
      cloudMap.shrines.forEach(shrine => {
        const type = getRandomType();
        this.spawnGroundArtifact(shrine.x * TILE_SIZE + 8, (shrine.y + 1) * TILE_SIZE + 8, DIMENSIONS.CLOUDS, type, true, null);
      });
    }

    // 2. Shrines in Cave World (Höhlen): Jede Unterhöhle separat taggen
    if (caves && typeof caves === 'object') {
      if (Array.isArray(caves.shrines)) {
        caves.shrines.forEach(shrine => {
          const type = getRandomType();
          this.spawnGroundArtifact(shrine.x * TILE_SIZE + 8, (shrine.y + 1) * TILE_SIZE + 8, DIMENSIONS.CAVES, type, true, null);
        });
      } else {
        Object.entries(caves).forEach(([caveKey, cMap]) => {
          if (cMap && Array.isArray(cMap.shrines)) {
            cMap.shrines.forEach(shrine => {
              const type = getRandomType();
              this.spawnGroundArtifact(shrine.x * TILE_SIZE + 8, (shrine.y + 1) * TILE_SIZE + 8, DIMENSIONS.CAVES, type, true, caveKey);
            });
          }
        });
      }
    }

    // 3. Shrines in Overworld: Nur der uralte Leeren-Schrein im Abgrund (Void)
    if (overworldMap && Array.isArray(overworldMap.shrines)) {
      overworldMap.shrines.forEach(shrine => {
        const type = getRandomType();
        this.spawnGroundArtifact(shrine.x * TILE_SIZE + 8, (shrine.y + 1) * TILE_SIZE + 8, DIMENSIONS.OVERWORLD, type, true, null);
      });
    } else {
      const type = getRandomType();
      this.spawnGroundArtifact(108 * TILE_SIZE + 8, 63 * TILE_SIZE + 8, DIMENSIONS.OVERWORLD, type, true, null);
    }
  }

  handleArtifactRemoved(artifact) {
    if (!artifact || !artifact.fromShrine) return;
    // Prüfe, ob dieser Schrein bereits in der Respawn-Queue wartet
    const isQueued = this.respawnQueue.some(r =>
      r.dimension === artifact.dimension &&
      (artifact.dimension !== DIMENSIONS.CAVES || r.subCaveId === artifact.subCaveId) &&
      Math.hypot(r.x - artifact.x, r.y - artifact.y) < 24
    );
    if (isQueued) return;

    const ALL_ARTIFACTS = ['phoenix', 'druid_bear', 'plasma_orbs', 'void_teleport', 'frost_cone'];
    const nextType = ALL_ARTIFACTS[Math.floor(Math.random() * ALL_ARTIFACTS.length)];
    // Respawn nach 2 bis 3 Minuten (120 bis 180 Sekunden)
    const respawnDelay = 120 + Math.random() * 60;
    this.respawnQueue.push({
      x: artifact.x,
      y: artifact.y,
      dimension: artifact.dimension,
      subCaveId: artifact.subCaveId || null,
      typeId: nextType,
      timer: respawnDelay,
      maxTimer: respawnDelay
    });
  }

  dropMonsterArtifact(x, y, dimension = DIMENSIONS.OVERWORLD) {
    const allTypes = ['phoenix', 'druid_bear', 'plasma_orbs', 'void_teleport', 'frost_cone'];
    const chosenType = allTypes[Math.floor(Math.random() * allTypes.length)];
    const art = this.spawnGroundArtifact(x, y, dimension, chosenType, false, this.game?.activeSubCave || null);

    if (this.game?.combat) {
      this.game.combat.addFloatingText(`✨ ${art.def.icon} ${art.def.name.toUpperCase()}!`, x, y - 24, art.def.colorTheme || '#f59e0b', 1.3);
      for (let i = 0; i < 22; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = Math.random() * 50 + 20;
        this.game.combat.hitSparks.push({
          x,
          y: y - 10,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 15,
          color: Math.random() > 0.4 ? (art.def.colorTheme || '#f59e0b') : '#facc15',
          size: Math.random() * 3 + 1.5,
          life: 0.7,
          maxLife: 0.7
        });
      }
    }
    return art;
  }

  // ---------------------------------------------------------------------------
  // PICKUP & SWAP LOGIC
  // ---------------------------------------------------------------------------
  checkPlayerPickup(player) {
    if (!player || player.isDead || this.isSwapModalOpen || this.pickupCooldown > 0) return;
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;
    const curSubCave = this.game?.activeSubCave || null;

    const PICKUP_DIST = 20;

    for (let i = this.groundArtifacts.length - 1; i >= 0; i--) {
      const art = this.groundArtifacts[i];
      if (art.dimension !== curDim) continue;
      if (curDim === DIMENSIONS.CAVES && art.subCaveId && curSubCave && art.subCaveId !== curSubCave) continue;

      const dist = Math.hypot(player.x - art.x, (player.y - 8) - art.y);
      if (dist <= PICKUP_DIST) {
        // 7. Nur fragen, wenn man BEREITS ein aktives Artefakt mit Aufladungen hat!
        const hasActiveArtifact = Boolean(player.artifact && player.artifact.id && player.artifact.charges > 0);

        if (!hasActiveArtifact) {
          // Direkt ausrüsten ohne jegliche Rückfrage!
          this.equipArtifact(player, art.def);
          this.handleArtifactRemoved(art);
          this.groundArtifacts.splice(i, 1);
          this.triggerPickupBanner(art.def);
          this.pickupCooldown = 0.5;
        } else if (player.artifact.id === art.def.id) {
          // 2. Gleiche Artefakt-Art: Automatisch +3 Aufladungen ohne Frage!
          const bonus = art.def.rechargeBonus || 3;
          player.artifact.charges = Math.min(player.artifact.maxCharges + 5, player.artifact.charges + bonus);
          this.handleArtifactRemoved(art);
          this.groundArtifacts.splice(i, 1);
          this.updateHUD();
          this.triggerPickupBanner(art.def, `✨ ${art.def.name.toUpperCase()} AUFGELADEN (+${bonus} AUFLADUNGEN)!`);
          this.pickupCooldown = 0.5;
        } else {
          // Spieler hat bereits ein ANDERES aktives Artefakt -> Swap Modal anzeigen
          this.openSwapModal(art, i);
        }
        break;
      }
    }
  }

  equipArtifact(player, artifactDef) {
    if (!player) return;

    // 4. Wenn der Spieler in Bärengestalt ist und das Artefakt wechselt: zurückverwandeln!
    if (player.isBearForm && typeof player.revertBearForm === 'function') {
      player.revertBearForm();
    }

    const def = getArtifactDef(artifactDef.id || artifactDef);
    player.artifact = {
      id: def.id,
      name: def.name,
      title: def.title,
      icon: def.icon,
      charges: def.maxCharges,
      maxCharges: def.maxCharges,
      cooldownTimer: 0,
      cooldownMax: def.cooldown,
      damage: def.damage,
      widthTiles: def.widthTiles,
      speed: def.speed,
      colorTheme: def.colorTheme,
      glowColor: def.glowColor
    };
    this.updateHUD();
  }

  openSwapModal(groundArtifact, index) {
    const player = this.game?.player;
    if (!player) return;

    // Sicherheitsprüfung: Wenn kein aktives Artefakt vorhanden ist, direkt ausrüsten
    const hasActiveArtifact = Boolean(player.artifact && player.artifact.id && player.artifact.charges > 0);
    if (!hasActiveArtifact) {
      this.equipArtifact(player, groundArtifact.def);
      this.handleArtifactRemoved(groundArtifact);
      if (index >= 0 && index < this.groundArtifacts.length) {
        this.groundArtifacts.splice(index, 1);
      }
      this.triggerPickupBanner(groundArtifact.def);
      this.pickupCooldown = 0.5;
      return;
    }

    // Wenn gleiches Artefakt: Automatisch aufladen ohne Dialog
    if (player.artifact.id === groundArtifact.def.id) {
      const bonus = groundArtifact.def.rechargeBonus || 3;
      player.artifact.charges = Math.min(player.artifact.maxCharges + 5, player.artifact.charges + bonus);
      this.handleArtifactRemoved(groundArtifact);
      if (index >= 0 && index < this.groundArtifacts.length) {
        this.groundArtifacts.splice(index, 1);
      }
      this.updateHUD();
      this.triggerPickupBanner(groundArtifact.def, `✨ ${groundArtifact.def.name.toUpperCase()} AUFGELADEN (+${bonus} AUFLADUNGEN)!`);
      this.pickupCooldown = 0.5;
      return;
    }

    this.isSwapModalOpen = true;
    this.pendingGroundArtifact = { artifact: groundArtifact, index };

    const modal = getElement('artifact-swap-modal');
    if (!modal) return;

    const current = player.artifact;
    const incoming = groundArtifact.def;

    const curIcon = getElement('swap-current-icon');
    const curName = getElement('swap-current-name');
    const curCharges = getElement('swap-current-charges');

    const newIcon = getElement('swap-new-icon');
    const newName = getElement('swap-new-name');
    const newCharges = getElement('swap-new-charges');

    if (curIcon) curIcon.textContent = current.icon;
    if (curName) curName.textContent = current.name;
    if (curCharges) curCharges.textContent = `${current.charges} / ${current.maxCharges} Aufladungen`;

    if (newIcon) newIcon.textContent = incoming.icon;
    if (newName) newName.textContent = incoming.name;
    if (newCharges) newCharges.textContent = `${incoming.maxCharges} Aufladungen`;

    modal.classList.remove('hidden');
  }

  closeSwapModal() {
    this.isSwapModalOpen = false;
    this.pendingGroundArtifact = null;
    const modal = getElement('artifact-swap-modal');
    if (modal) modal.classList.add('hidden');
  }

  chooseSwap() {
    if (!this.pendingGroundArtifact || !this.game?.player) {
      this.closeSwapModal();
      return;
    }
    const { artifact, index } = this.pendingGroundArtifact;
    const player = this.game.player;

    // 4. Bärengestalt bei Artefaktwechsel auflösen
    if (player.isBearForm && typeof player.revertBearForm === 'function') {
      player.revertBearForm();
    }

    this.equipArtifact(player, artifact.def);
    this.handleArtifactRemoved(artifact);
    if (index >= 0 && index < this.groundArtifacts.length) {
      this.groundArtifacts.splice(index, 1);
    }
    this.triggerPickupBanner(artifact.def, 'NEUES ARTEFAKT AUSGERÜSTET!');
    this.pickupCooldown = 0.5;
    this.closeSwapModal();
  }

  chooseKeepAndRecharge() {
    if (!this.pendingGroundArtifact || !this.game?.player) {
      this.closeSwapModal();
      return;
    }
    const { artifact, index } = this.pendingGroundArtifact;
    const player = this.game.player;

    if (player.artifact) {
      const bonus = artifact.def.rechargeBonus || 3;
      player.artifact.charges = Math.min(player.artifact.maxCharges + 5, player.artifact.charges + bonus);
      this.triggerPickupBanner(artifact.def, `ARTEFAKT AUFGELADEN (+${bonus} AUFLADUNGEN)!`);
    }

    this.handleArtifactRemoved(artifact);
    if (index >= 0 && index < this.groundArtifacts.length) {
      this.groundArtifacts.splice(index, 1);
    }
    this.updateHUD();
    this.pickupCooldown = 0.5;
    this.closeSwapModal();
  }

  triggerPickupBanner(artifactDef, customMsg = null) {
    const banner = getElement('magic-pickup-banner');
    if (!banner) return;

    const titleEl = getElement('pickup-banner-title');
    const subEl = getElement('pickup-banner-sub');

    if (titleEl) titleEl.textContent = customMsg || `✨ ARTEFAKT GEBUNDEN: ${artifactDef.name.toUpperCase()}!`;
    if (subEl) subEl.textContent = `Drücke [ E ] oder den Zauber-Button zum Entfesseln (${artifactDef.maxCharges} Aufladungen)`;

    banner.classList.remove('hidden');
    banner.classList.remove('anim-fade-out');
    banner.classList.add('anim-pop-glow');

    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      banner.classList.add('anim-fade-out');
      setTimeout(() => {
        banner.classList.add('hidden');
        banner.classList.remove('anim-pop-glow');
      }, 500);
    }, 3800);
  }

  // ---------------------------------------------------------------------------
  // SPELL CASTING & AIMING STENCIL
  // ---------------------------------------------------------------------------
  startAiming(player) {
    if (!player || player.isDead) return false;
    if (!player.artifact || player.artifact.charges <= 0) return false;
    if (player.artifact.cooldownTimer > 0) return false;
    if (this.isTeleportModalOpen || this.isSwapModalOpen) return false;

    this.isAiming = true;
    this.aimTimer = 0;
    if (this.btnCastMagic) {
      this.btnCastMagic.classList.add('aiming-active');
    }
    return true;
  }

  cancelAiming() {
    this.isAiming = false;
    this.aimTimer = 0;
    if (this.btnCastMagic) {
      this.btnCastMagic.classList.remove('aiming-active');
    }
  }

  releaseAiming(player, map, combatManager) {
    if (!this.isAiming) return false;
    this.isAiming = false;
    this.aimTimer = 0;
    if (this.btnCastMagic) {
      this.btnCastMagic.classList.remove('aiming-active');
    }
    return this.castActiveSpell(player, map, combatManager);
  }

  castActiveSpell(player, map, combatManager) {
    if (!player || player.isDead) return false;
    if (!player.artifact || player.artifact.charges <= 0) {
      combatManager?.addFloatingText('❌ Keine Aufladungen!', player.x, player.y - 20, '#ef4444', 0.8);
      return false;
    }
    if (player.artifact.cooldownTimer > 0) {
      combatManager?.addFloatingText(`⏳ Abklingzeit (${player.artifact.cooldownTimer.toFixed(1)}s)`, player.x, player.y - 20, '#f59e0b', 0.6);
      return false;
    }

    const artId = player.artifact.id;

    // 1. DRUIDEN-BÄR GESTALT (Smaragd-Druide)
    if (artId === 'druid_bear') {
      player.activateBearForm(60);
      player.artifact.charges--;
      player.artifact.cooldownTimer = player.artifact.cooldownMax || 2.0;
      if (this.game && this.game.network && this.game.network.connected) {
        this.game.network.sendAction('spell_bear', { x: player.x, y: player.y });
      }
      this.updateHUD();
      return true;
    }

    // 2. ROSA PLASMAKUGELN (4 Kugeln im Orbit)
    if (artId === 'plasma_orbs') {
      player.artifact.charges--;
      player.artifact.cooldownTimer = player.artifact.cooldownMax || 3.0;
      this.spawnPlasmaOrbSequence(player, combatManager);
      if (this.game && this.game.network && this.game.network.connected) {
        this.game.network.sendAction('spell_plasma', { x: player.x, y: player.y });
      }
      this.updateHUD();
      return true;
    }

    // 3. LEEREN-TELEPORT (Karte zur Zielauswahl öffnen)
    if (artId === 'void_teleport') {
      this.openTeleportModal();
      return true;
    }

    // 4. EISNEBEL (Hellblauer Frostkegel mit Einfrieren)
    if (artId === 'frost_cone') {
      return this.castFrostCone(player, map, combatManager);
    }

    // 4. RUBIN-PHÖNIX (Flammen-Sturm)
    const fVec = (typeof player.getFacingVector === 'function') ? player.getFacingVector() : { x: 1, y: 0 };
    const dirX = fVec.x;
    const dirY = fVec.y;

    player.artifact.charges--;
    player.artifact.cooldownTimer = player.artifact.cooldownMax || 3.0;

    const widthPx = (player.artifact.widthTiles || 5) * TILE_SIZE;

    const spell = {
      id: `phoenix_${Date.now()}`,
      type: 'phoenix',
      dimension: this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD,
      x: player.x,
      y: player.y - 10,
      dirX,
      dirY,
      angle: Math.atan2(dirY, dirX),
      width: widthPx,
      speed: player.artifact.speed || 360,
      damage: player.artifact.damage || 220,
      hitEnemies: new Set(),
      life: 14.0, // Long enough to cross entire map
      animTime: 0
    };

    this.activeSpells.push(spell);

    if (this.game && this.game.network && this.game.network.connected) {
      this.game.network.sendAction('spell_phoenix', {
        x: spell.x,
        y: spell.y,
        dirX: spell.dirX,
        dirY: spell.dirY,
        angle: spell.angle,
        speed: spell.speed,
        damage: spell.damage,
        dimension: spell.dimension
      });
    }

    // Casting shockwave & audio-visual particles
    if (combatManager) {
      combatManager.addFloatingText(`🔥 PHÖNIX-STURM! (${player.artifact.charges} übrig)`, player.x, player.y - 28, '#ef4444', 1.2);
      for (let i = 0; i < 35; i++) {
        const ang = spell.angle + (Math.random() - 0.5) * 1.5;
        const sp = Math.random() * 80 + 30;
        combatManager.hitSparks.push({
          x: player.x,
          y: player.y - 10,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          color: Math.random() > 0.4 ? '#ef4444' : '#f59e0b',
          size: Math.random() * 3 + 2,
          life: 0.6,
          maxLife: 0.6
        });
      }
    }

    this.updateHUD();
    return true;
  }

  // ---------------------------------------------------------------------------
  // EISNEBEL (Hellblauer Frostkegel mit Einfrieren)
  // ---------------------------------------------------------------------------
  castFrostCone(player, map, combatManager) {
    if (!player || player.isDead) return false;
    player.artifact.charges--;
    player.artifact.cooldownTimer = player.artifact.cooldownMax || 2.5;
    this.updateHUD();

    const facingAngle = (typeof player.getFacingAngle === 'function') ? player.getFacingAngle() : 0;
    const px = player.x;
    const py = player.y - 8;
    const range = 115;
    const halfArc = 0.65; // ~75° cone
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;

    let hitCount = 0;
    if (this.game && this.game.enemyManager) {
      const activeEnemies = this.game.enemyManager.getActiveEnemies ? this.game.enemyManager.getActiveEnemies() : [];
      for (const enemy of activeEnemies) {
        if (enemy.dimension !== curDim || enemy.state === 'dead') continue;
        const dx = enemy.x - px;
        const dy = enemy.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist > range + (enemy.radius || 0)) continue;

        const angToEnemy = Math.atan2(dy, dx);
        let diff = angToEnemy - facingAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        if (Math.abs(diff) <= halfArc) {
          // Dauer abhängig von Monsterstärke: 0.5s (Bosse) bis 3.0s (schwache Monster)
          let duration = 2.0;
          if (typeof calculateFreezeDuration === 'function') {
            duration = calculateFreezeDuration(enemy);
          } else if (enemy.category === 'boss' || enemy.maxHp >= 500) {
            duration = 0.5;
          } else if (enemy.maxHp >= 300 || enemy.scale >= 1.3) {
            duration = 1.0;
          } else if (enemy.maxHp >= 100) {
            duration = 1.8;
          } else {
            duration = 3.0;
          }

          enemy.freezeTimer = duration;
          hitCount++;

          if (combatManager) {
            combatManager.addFloatingText(`❄️ EINGEFROREN (${duration.toFixed(1)}s)`, enemy.x, enemy.y - 20, '#38bdf8', 1.1);
            for (let s = 0; s < 14; s++) {
              const pAng = Math.random() * Math.PI * 2;
              const sp = Math.random() * 50 + 20;
              combatManager.hitSparks.push({
                x: enemy.x,
                y: enemy.y - 6,
                vx: Math.cos(pAng) * sp,
                vy: Math.sin(pAng) * sp - 10,
                color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
                size: Math.random() * 2.8 + 1.2,
                life: 0.5,
                maxLife: 0.5
              });
            }
          }
        }
      }
    }

    // PvP: Treffer auf Mitspieler im LAN-Multiplayer
    if (this.game && this.game.remotePlayers && this.game.network && this.game.network.connected) {
      for (const remotePlayer of this.game.remotePlayers.values()) {
        if (remotePlayer.id === this.game.network.clientId) continue;
        if (remotePlayer.isDead || (remotePlayer.dimension && remotePlayer.dimension !== curDim)) continue;

        const dx = remotePlayer.x - px;
        const dy = remotePlayer.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist > range + (remotePlayer.radius || 10)) continue;

        const angToRemote = Math.atan2(dy, dx);
        let diff = angToRemote - facingAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        if (Math.abs(diff) <= halfArc) {
          const frostDmg = PVP_CONFIG.SPELL_FROST_DMG ?? 30;
          let actualDmg = frostDmg;
          const kbX = Math.cos(angToRemote) * 50;
          const kbY = Math.sin(angToRemote) * 50;

          if (remotePlayer.shield && remotePlayer.shield.active && remotePlayer.shield.energy > 0) {
            actualDmg = Math.round(frostDmg * 0.33);
            combatManager?.addHitSparks(remotePlayer.x, remotePlayer.y, '#38bdf8', 14);
            combatManager?.addFloatingText('🛡️ GEBLOCKT!', remotePlayer.x, remotePlayer.y - 20, '#38bdf8');
          } else {
            combatManager?.addHitSparks(remotePlayer.x, remotePlayer.y, '#38bdf8', 18);
            const freezeDuration = PVP_CONFIG.SPELL_FROST_FREEZE_TIME ?? 2.0;
            combatManager?.addFloatingText(`❄️ EINGEFROREN! (${freezeDuration.toFixed(1)}s)`, remotePlayer.x, remotePlayer.y - 20, '#38bdf8', 1.1);
          }

          this.game.network.sendPvPHit(remotePlayer.id, actualDmg, kbX, kbY);
        }
      }
    }

    // Audio-visuelles Feedback
    if (combatManager) {
      combatManager.addFloatingText(`❄️ EISNEBEL! (${player.artifact.charges} übrig)`, px, py - 26, '#38bdf8', 1.2);
      for (let s = 0; s < 32; s++) {
        const spreadAng = facingAngle + (Math.random() - 0.5) * (halfArc * 1.8);
        const sp = Math.random() * 120 + 30;
        combatManager.hitSparks.push({
          x: px,
          y: py,
          vx: Math.cos(spreadAng) * sp,
          vy: Math.sin(spreadAng) * sp,
          color: Math.random() > 0.4 ? '#38bdf8' : (Math.random() > 0.5 ? '#bae6fd' : '#ffffff'),
          size: Math.random() * 3 + 1.5,
          life: 0.45,
          maxLife: 0.45
        });
      }
    }

    // Aktiver Zauber für visuelle Frostwellen-Animation
    this.activeSpells.push({
      id: `frost_${Date.now()}`,
      type: 'frost_cone',
      dimension: curDim,
      x: px,
      y: py,
      angle: facingAngle,
      range,
      arc: halfArc * 2,
      animTime: 0,
      life: 0.4,
      maxLife: 0.4
    });

    if (this.game && this.game.network && this.game.network.connected) {
      this.game.network.sendAction('spell_frost', {
        x: px,
        y: py,
        angle: facingAngle,
        dimension: curDim
      });
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // REMOTE SPELL SPAWNERS (Multiplayer Synchronisation)
  // ---------------------------------------------------------------------------
  spawnRemoteFrostCone(data) {
    const px = data.x;
    const py = data.y;
    const facingAngle = data.angle;
    const range = 115;
    const halfArc = 0.65;
    const curDim = data.dimension ?? (this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD);

    this.activeSpells.push({
      id: `frost_remote_${Date.now()}`,
      type: 'frost_cone',
      dimension: curDim,
      x: px,
      y: py,
      angle: facingAngle,
      range,
      arc: halfArc * 2,
      animTime: 0,
      life: 0.4,
      maxLife: 0.4
    });

    const combatManager = this.game ? this.game.combat : null;
    if (combatManager) {
      combatManager.addFloatingText('❄️ EISNEBEL!', px, py - 26, '#38bdf8', 1.2);
      for (let s = 0; s < 25; s++) {
        const spreadAng = facingAngle + (Math.random() - 0.5) * (halfArc * 1.8);
        const sp = Math.random() * 120 + 30;
        combatManager.hitSparks.push({
          x: px,
          y: py,
          vx: Math.cos(spreadAng) * sp,
          vy: Math.sin(spreadAng) * sp,
          color: Math.random() > 0.4 ? '#38bdf8' : (Math.random() > 0.5 ? '#bae6fd' : '#ffffff'),
          size: Math.random() * 3 + 1.2,
          life: 0.45,
          maxLife: 0.45
        });
      }
    }
  }

  spawnRemotePhoenix(data) {
    const spell = {
      id: `phoenix_remote_${Date.now()}_${Math.random()}`,
      type: 'phoenix',
      dimension: data.dimension ?? (this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD),
      x: data.x,
      y: data.y,
      dirX: data.dirX,
      dirY: data.dirY,
      angle: data.angle,
      width: 5 * TILE_SIZE,
      speed: data.speed || 360,
      damage: data.damage || 220,
      hitEnemies: new Set(),
      life: 14.0,
      animTime: 0
    };
    this.activeSpells.push(spell);

    const combatManager = this.game ? this.game.combat : null;
    if (combatManager) {
      combatManager.addFloatingText('🔥 PHÖNIX-STURM!', data.x, data.y - 28, '#ef4444', 1.2);
      for (let i = 0; i < 25; i++) {
        const ang = spell.angle + (Math.random() - 0.5) * 1.5;
        const sp = Math.random() * 80 + 30;
        combatManager.hitSparks.push({
          x: data.x,
          y: data.y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          color: Math.random() > 0.4 ? '#ef4444' : '#f59e0b',
          size: Math.random() * 3 + 2,
          life: 0.6,
          maxLife: 0.6
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // PLASMA ORBS LOGIC
  // ---------------------------------------------------------------------------
  spawnPlasmaOrbSequence(player, combatManager) {
    const sequence = {
      id: `plasma_${Date.now()}`,
      dimension: this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD,
      timer: 0,
      orbs: [0, 1, 2, 3].map(i => ({
        index: i,
        delay: i * 0.18, // short delay between spawns
        active: false,
        life: 1.35,
        maxLife: 1.35,
        orbitAngle: (i * Math.PI) / 2,
        exploded: false,
        damage: 45,
        knockback: 90
      }))
    };
    this.activePlasmaSequences.push(sequence);

    if (combatManager) {
      combatManager.addFloatingText(`🔮 PLASMA-ORBIT! (${player.artifact.charges} übrig)`, player.x, player.y - 28, '#ec4899', 1.2);
      for (let i = 0; i < 18; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = Math.random() * 60 + 20;
        combatManager.hitSparks.push({
          x: player.x,
          y: player.y - 10,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 10,
          color: Math.random() > 0.4 ? '#ec4899' : '#f472b6',
          size: Math.random() * 2.5 + 1.5,
          life: 0.5,
          maxLife: 0.5
        });
      }
    }
  }

  updatePlasmaOrbs(dt, player, combatManager, enemyManager) {
    if (!this.activePlasmaSequences.length) return;
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;

    for (let s = this.activePlasmaSequences.length - 1; s >= 0; s--) {
      const seq = this.activePlasmaSequences[s];
      if (seq.dimension !== curDim) continue;

      seq.timer += dt;
      let allExploded = true;

      for (let i = 0; i < seq.orbs.length; i++) {
        const orb = seq.orbs[i];
        if (orb.exploded) continue;

        allExploded = false;

        if (seq.timer >= orb.delay) {
          if (!orb.active) {
            orb.active = true;
            if (combatManager && player) {
              const ox = player.x + Math.cos(orb.orbitAngle) * 34;
              const oy = (player.y - 10) + Math.sin(orb.orbitAngle) * 34;
              for (let k = 0; k < 6; k++) {
                const a = Math.random() * Math.PI * 2;
                combatManager.hitSparks.push({
                  x: ox,
                  y: oy,
                  vx: Math.cos(a) * 30,
                  vy: Math.sin(a) * 30,
                  color: '#f472b6',
                  size: 2,
                  life: 0.3,
                  maxLife: 0.3
                });
              }
            }
          }

          orb.orbitAngle += dt * 4.2;
          orb.life -= dt;

          if (combatManager && player && Math.random() < 0.35) {
            const ox = player.x + Math.cos(orb.orbitAngle) * 34;
            const oy = (player.y - 10) + Math.sin(orb.orbitAngle) * 34;
            combatManager.hitSparks.push({
              x: ox + (Math.random() - 0.5) * 6,
              y: oy + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 15,
              vy: (Math.random() - 0.5) * 15,
              color: Math.random() > 0.4 ? '#f472b6' : '#ec4899',
              size: 2,
              life: 0.25,
              maxLife: 0.25
            });
          }

          if (orb.life <= 0) {
            orb.exploded = true;
            if (player && combatManager) {
              const ox = player.x + Math.cos(orb.orbitAngle) * 34;
              const oy = (player.y - 10) + Math.sin(orb.orbitAngle) * 34;
              combatManager.spawnPlasmaExplosion(ox, oy, 36, orb.damage, orb.knockback, enemyManager);
            }
          }
        }
      }

      if (allExploded) {
        this.activePlasmaSequences.splice(s, 1);
      }
    }
  }

  renderPlasmaOrbs(ctx, camera) {
    if (!this.activePlasmaSequences.length) return;
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;
    const player = this.game?.player;
    if (!player) return;

    const zoom = camera ? camera.zoom : 1;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    for (const seq of this.activePlasmaSequences) {
      if (seq.dimension !== curDim) continue;

      for (const orb of seq.orbs) {
        if (!orb.active || orb.exploded) continue;

        const worldX = player.x + Math.cos(orb.orbitAngle) * 34;
        const worldY = (player.y - 10) + Math.sin(orb.orbitAngle) * 34;

        const sx = (worldX - camX) * zoom;
        const sy = (worldY - camY) * zoom;

        const lifeFraction = Math.max(0, orb.life / orb.maxLife);
        const blinkFreq = 10 + (1 - lifeFraction) * 28;
        const blink = Math.sin(seq.timer * blinkFreq) > 0;

        ctx.save();

        const glowRad = (10 + Math.sin(seq.timer * 15) * 3) * zoom;
        if (typeof ctx.createRadialGradient === 'function') {
          const grad = ctx.createRadialGradient(sx, sy, 2 * zoom, sx, sy, glowRad);
          grad.addColorStop(0, blink ? 'rgba(244, 114, 182, 0.85)' : 'rgba(236, 72, 153, 0.45)');
          grad.addColorStop(0.6, 'rgba(219, 39, 119, 0.3)');
          grad.addColorStop(1, 'rgba(157, 23, 77, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sx, sy, glowRad, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = blink ? '#fdf2f8' : '#ec4899';
        ctx.beginPath();
        ctx.arc(sx, sy, (4 + Math.sin(seq.timer * 20) * 1) * zoom, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 1.2 * zoom;
        ctx.beginPath();
        ctx.arc(sx, sy, 6 * zoom, seq.timer * 8, seq.timer * 8 + Math.PI * 1.3);
        ctx.stroke();

        ctx.restore();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // VOID TELEPORT MAP MODAL LOGIC
  // ---------------------------------------------------------------------------
  openTeleportModal() {
    const modal = getElement('teleport-map-modal');
    if (!modal) return;
    this.isTeleportModalOpen = true;
    this.selectedTeleportTile = null;
    this.teleportHoverTile = null;
    modal.classList.remove('hidden');

    const confirmBtn = getElement('btn-teleport-confirm');
    if (confirmBtn) confirmBtn.classList.add('hidden');

    const coordsEl = getElement('teleport-coords-display');
    if (coordsEl) {
      coordsEl.textContent = 'Tippe Zielort an';
      coordsEl.style.color = '#c084fc';
    }

    if (this.game?.minimap) {
      this.game.minimap.renderStaticBackground();
    }

    this.renderTeleportMap();

    const animLoop = () => {
      if (!this.isTeleportModalOpen) return;
      this.renderTeleportMap();
      this.teleportAnimFrame = requestAnimationFrame(animLoop);
    };
    if (typeof requestAnimationFrame === 'function') {
      this.teleportAnimFrame = requestAnimationFrame(animLoop);
    }
  }

  closeTeleportModal() {
    const modal = getElement('teleport-map-modal');
    if (modal) modal.classList.add('hidden');
    this.isTeleportModalOpen = false;
    this.selectedTeleportTile = null;
    this.teleportHoverTile = null;
    if (this.teleportAnimFrame && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.teleportAnimFrame);
      this.teleportAnimFrame = null;
    }
  }

  getCanvasCoords(clientX, clientY) {
    const canvas = this.teleportCanvas || getElement('teleportMapCanvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    const normX = Math.max(0, Math.min(1, relX / rect.width));
    const normY = Math.max(0, Math.min(1, relY / rect.height));

    const map = this.game?.map;
    const mapW = map?.width || MAP_WIDTH;
    const mapH = map?.height || MAP_HEIGHT;

    const tx = Math.min(mapW - 1, Math.max(0, Math.floor(normX * mapW)));
    const ty = Math.min(mapH - 1, Math.max(0, Math.floor(normY * mapH)));

    return { tx, ty, normX, normY };
  }

  selectTeleportTarget(clientX, clientY) {
    const coords = this.getCanvasCoords(clientX, clientY);
    if (!coords) return;
    const map = this.game?.map;
    const player = this.game?.player;
    if (!map || !player) return;
    const mapW = map.width || MAP_WIDTH;
    const mapH = map.height || MAP_HEIGHT;

    const rawTx = Math.max(0, Math.min(mapW - 1, coords.tx));
    const rawTy = Math.max(0, Math.min(mapH - 1, coords.ty));
    const rawWorldX = rawTx * TILE_SIZE + TILE_SIZE / 2;
    const rawWorldY = rawTy * TILE_SIZE + TILE_SIZE / 2;

    // Sichere Landeposition suchen wie beim Wolkensturz (Wasser, Bäume, Abgrund etc. werden automatisch zum nächsten sicheren Uferplatz korrigiert)
    const safePos = (typeof player.findSafeLandingPosition === 'function')
      ? player.findSafeLandingPosition(map, rawWorldX, rawWorldY)
      : { x: rawWorldX, y: rawWorldY };

    const targetTx = Math.max(0, Math.min(mapW - 1, Math.floor(safePos.x / TILE_SIZE)));
    const targetTy = Math.max(0, Math.min(mapH - 1, Math.floor(safePos.y / TILE_SIZE)));
    const isAdjusted = (targetTx !== rawTx || targetTy !== rawTy);

    this.selectedTeleportTile = {
      tx: targetTx,
      ty: targetTy,
      worldX: safePos.x,
      worldY: safePos.y
    };

    const coordsEl = getElement('teleport-coords-display');
    if (coordsEl) {
      coordsEl.textContent = isAdjusted
        ? `📍 Ziel: X: ${targetTx}, Y: ${targetTy} (Sicherer Uferplatz) ✅`
        : `📍 Ziel: X: ${targetTx}, Y: ${targetTy} ✅`;
      coordsEl.style.color = '#c084fc';
    }

    const confirmBtn = getElement('btn-teleport-confirm');
    if (confirmBtn) {
      confirmBtn.classList.remove('hidden');
    }

    this.renderTeleportMap();
  }

  confirmTeleport() {
    if (!this.selectedTeleportTile) return;
    const { worldX, worldY } = this.selectedTeleportTile;
    const player = this.game?.player;
    if (!player) return;

    // Modal SOFORT schließen, damit der Spieler die volle Animation sieht!
    this.closeTeleportModal();

    if (player.artifact) {
      player.artifact.charges--;
      player.artifact.cooldownTimer = player.artifact.cooldownMax || 1.0;
    }

    this.updateHUD();

    // 3-Phasen Teleport-Animation starten (Lila Loch -> Spieler sinkt -> Blackout -> Lila Loch Zielort -> Spieler springt heraus)
    player.startTeleportSequence(worldX, worldY);
  }

  handleTeleportClick(clientX, clientY) {
    this.selectTeleportTarget(clientX, clientY);
  }

  renderTeleportMap() {
    const canvas = this.teleportCanvas || getElement('teleportMapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = this.game?.player;
    const map = this.game?.map;
    if (!map) return;

    const mapW = map.width || MAP_WIDTH;
    const mapH = map.height || MAP_HEIGHT;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / mapW;
    const scaleY = canvas.height / mapH;

    // 1. Exakte Minimap-Karte in Groß
    if (this.game?.minimap && this.game.minimap.bgCanvas) {
      ctx.drawImage(this.game.minimap.bgCanvas, 0, 0, canvas.width, canvas.height);
    } else {
      for (let ty = 0; ty < mapH; ty++) {
        for (let tx = 0; tx < mapW; tx++) {
          const isWalkable = map.isTileWalkable ? map.isTileWalkable(tx, ty) : true;
          ctx.fillStyle = isWalkable ? '#1e293b' : '#0f172a';
          ctx.fillRect(tx * scaleX, ty * scaleY, scaleX + 0.5, scaleY + 0.5);
        }
      }
    }

    // 2. Nebel des Krieges (Exakt aus der Minimap: nur erforschte Bereiche sichtbar!)
    const fog = this.game?.minimap?.getFogCanvas();
    if (fog && fog.canvas) {
      ctx.drawImage(fog.canvas, 0, 0, canvas.width, canvas.height);
    }

    // 3. Schreine als leuchtende goldene Diamanten hervorheben (nur wenn bereits erforscht!)
    const time = Date.now() / 1000;
    const shrinePulse = 1.0 + Math.sin(time * 4) * 0.2;
    const drawShrine = (sx, sy) => {
      const isExplored = this.game?.minimap ? this.game.minimap.isTileExplored(sx, sy) : true;
      if (!isExplored) return;
      const px = (sx + 0.5) * scaleX;
      const py = (sy + 0.5) * scaleY;
      const sz = 5 * shrinePulse;

      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = 'rgba(250, 204, 21, 0.85)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(px, py - sz);
      ctx.lineTo(px + sz, py);
      ctx.lineTo(px, py + sz);
      ctx.lineTo(px - sz, py);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    if (map.shrines && Array.isArray(map.shrines)) {
      map.shrines.forEach(s => drawShrine(s.x, s.y));
    } else if (map.objects) {
      for (let ty = 0; ty < mapH; ty++) {
        if (!map.objects[ty]) continue;
        for (let tx = 0; tx < mapW; tx++) {
          if (map.objects[ty][tx] === 15) {
            drawShrine(tx, ty);
          }
        }
      }
    }

    // 4. Kamera-Sichtfeld (Weißer Rahmen wie auf der Minimap)
    const camera = this.game?.camera;
    if (camera) {
      const viewW = (camera.viewportWidth / (camera.zoom || 1)) / TILE_SIZE * scaleX;
      const viewH = (camera.viewportHeight / (camera.zoom || 1)) / TILE_SIZE * scaleY;
      const viewX = (camera.x / TILE_SIZE) * scaleX;
      const viewY = (camera.y / TILE_SIZE) * scaleY;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(viewX, viewY, viewW, viewH);
      ctx.restore();
    }

    // 5. Spieler-Position (Roter Punkt + weißer Rand wie Minimap + Lila Aura)
    if (player) {
      const pTileX = player.x / TILE_SIZE;
      const pTileY = player.y / TILE_SIZE;
      const px = pTileX * scaleX;
      const py = pTileY * scaleY;

      // Pulsierende Leeren-Aura
      const ringR = 8 + Math.sin(time * 5) * 2.5;
      ctx.save();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Minimap Marker
      ctx.fillStyle = '#ff2a55';
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Ausgewähltes Ziel (Pulsierendes violettes Leeren-Signal mit Fadenkreuz & Halo)
    const target = this.selectedTeleportTile || this.teleportHoverTile;
    if (target) {
      const { tx, ty } = target;
      const hx = (tx + 0.5) * scaleX;
      const hy = (ty + 0.5) * scaleY;
      const pulseR = 9 + Math.sin(time * 6) * 3;

      ctx.save();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(hx, hy, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      // Fadenkreuz
      ctx.beginPath();
      ctx.moveTo(hx - pulseR - 4, hy); ctx.lineTo(hx - pulseR + 3, hy);
      ctx.moveTo(hx + pulseR - 3, hy); ctx.lineTo(hx + pulseR + 4, hy);
      ctx.moveTo(hx, hy - pulseR - 4); ctx.lineTo(hx, hy - pulseR + 3);
      ctx.moveTo(hx, hy + pulseR - 3); ctx.lineTo(hx, hy + pulseR + 4);
      ctx.stroke();

      // Leuchtender Kernpunkt
      ctx.fillStyle = '#f3e8ff';
      ctx.beginPath();
      ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Transparenter Halo
      ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.beginPath();
      ctx.arc(hx, hy, pulseR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // UPDATE LOOP
  // ---------------------------------------------------------------------------
  update(dt, player, map, combatManager, enemyManager) {
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;

    // Tick pickup cooldown
    if (this.pickupCooldown > 0) {
      this.pickupCooldown = Math.max(0, this.pickupCooldown - dt);
    }

    // 0. Update Shrine Respawn Queue (2-3 Min / 120-180s)
    for (let r = this.respawnQueue.length - 1; r >= 0; r--) {
      const respawn = this.respawnQueue[r];
      respawn.timer -= dt;
      if (respawn.timer <= 0) {
        this.spawnGroundArtifact(respawn.x, respawn.y, respawn.dimension, respawn.typeId, true, respawn.subCaveId || null);
        const def = getArtifactDef(respawn.typeId);
        if (combatManager && (!this.game || this.game.currentDimension === respawn.dimension)) {
          combatManager.addFloatingText(`✨ ARTEFAKT RESPAWNT: ${def.name.toUpperCase()}!`, respawn.x, respawn.y - 20, def.colorTheme || '#38bdf8', 1.6);
          for (let s = 0; s < 25; s++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = Math.random() * 60 + 20;
            combatManager.hitSparks.push({
              x: respawn.x,
              y: respawn.y - 8,
              vx: Math.cos(ang) * sp,
              vy: Math.sin(ang) * sp - 20,
              color: def.colorTheme || '#38bdf8',
              size: Math.random() * 3 + 2,
              life: 0.8,
              maxLife: 0.8
            });
          }
        }
        this.respawnQueue.splice(r, 1);
      }
    }

    // Aiming state tracking
    if (this.isAiming) {
      this.aimTimer += dt;
      if (!player || player.isDead || !player.artifact || player.artifact.charges <= 0) {
        this.cancelAiming();
      }
    }

    // 1. Update Player Artifact Cooldown & Glitter
    if (player && player.artifact) {
      if (player.artifact.cooldownTimer > 0) {
        player.artifact.cooldownTimer = Math.max(0, player.artifact.cooldownTimer - dt);
      }

      // Sparkle Glitter Aura while charges > 0
      if (player.artifact.charges > 0 && !player.isDead) {
        this.glitterTimer += dt;
        if (this.glitterTimer >= 0.08) {
          this.glitterTimer = 0;
          const a = Math.random() * Math.PI * 2;
          const dist = Math.random() * 18 + 6;
          this.playerGlitterParticles.push({
            x: player.x + Math.cos(a) * dist,
            y: (player.y - 10) + Math.sin(a) * dist,
            vx: (Math.random() - 0.5) * 12,
            vy: -Math.random() * 18 - 8,
            color: Math.random() > 0.5 ? '#facc15' : (Math.random() > 0.5 ? '#ef4444' : '#ec4899'),
            size: Math.random() * 2.2 + 1.2,
            life: 0.65,
            maxLife: 0.65,
            twinkle: Math.random() * Math.PI * 2
          });
        }
      }
    }

    // 2. Update Glitter Particles
    for (let i = this.playerGlitterParticles.length - 1; i >= 0; i--) {
      const p = this.playerGlitterParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.playerGlitterParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.twinkle += dt * 8;
    }

    // 3. Update Ground Artifacts
    for (const art of this.groundArtifacts) {
      art.bobTime += dt * 3.5;
      art.lightPulse = (Math.sin(art.bobTime) + 1) / 2;
    }

    // Check player pickup
    this.checkPlayerPickup(player);

    // 4. Update Active Spells (Phoenix & Frost Cone)
    const mapPixelW = (map ? map.width : MAP_WIDTH) * TILE_SIZE;
    const mapPixelH = (map ? map.height : MAP_HEIGHT) * TILE_SIZE;

    for (let i = this.activeSpells.length - 1; i >= 0; i--) {
      const spell = this.activeSpells[i];
      if (spell.dimension !== curDim) continue;

      if (spell.type === 'frost_cone') {
        spell.animTime += dt;
        spell.life -= dt;
        if (spell.life <= 0) {
          this.activeSpells.splice(i, 1);
        }
        continue;
      }

      spell.animTime += dt;
      spell.life -= dt;

      // Advance flight
      spell.x += spell.dirX * spell.speed * dt;
      spell.y += spell.dirY * spell.speed * dt;

      // Boundary check - until end of map
      if (spell.x < -80 || spell.x > mapPixelW + 80 || spell.y < -80 || spell.y > mapPixelH + 80 || spell.life <= 0) {
        this.activeSpells.splice(i, 1);
        continue;
      }

      // Trailing flame embers
      if (combatManager && Math.random() < 0.8) {
        const perpX = -spell.dirY;
        const perpY = spell.dirX;
        const spreadOffset = (Math.random() - 0.5) * (spell.width * 0.8);
        combatManager.hitSparks.push({
          x: spell.x + perpX * spreadOffset,
          y: spell.y + perpY * spreadOffset,
          vx: -spell.dirX * (Math.random() * 40 + 20) + (Math.random() - 0.5) * 30,
          vy: -spell.dirY * (Math.random() * 40 + 20) + (Math.random() - 0.5) * 30,
          color: Math.random() > 0.4 ? '#ef4444' : '#f59e0b',
          size: Math.random() * 3.5 + 1.5,
          life: 0.45,
          maxLife: 0.45
        });
      }

      // Check collision with all active enemies in path (5 tiles wide box)
      if (enemyManager && enemyManager.enemies) {
        for (const enemy of enemyManager.enemies) {
          if (enemy.dimension !== curDim || enemy.state === 'dead' || enemy.hp <= 0) continue;
          if (spell.hitEnemies.has(enemy)) continue;

          const dx = enemy.x - spell.x;
          const dy = enemy.y - spell.y;
          const dotFlight = dx * spell.dirX + dy * spell.dirY;
          const dotPerp = Math.abs(dx * (-spell.dirY) + dy * spell.dirX);

          // If enemy is within collision window along flight path and within half-width (40px) laterally
          const collisionDist = Math.max(35, spell.speed * dt * 1.5);
          if (Math.abs(dotFlight) <= collisionDist && dotPerp <= (spell.width / 2 + (enemy.radius || 10))) {
            spell.hitEnemies.add(enemy);

            // Deal heavy phoenix fire damage
            enemy.takeDamage(spell.damage, spell.angle, 120, combatManager, true);
            combatManager?.addFloatingText(`🔥 -${spell.damage}`, enemy.x, enemy.y - 20, '#ef4444', 0.9);

            // Explosion sparks at impact
            if (combatManager) {
              for (let s = 0; s < 14; s++) {
                const spAng = Math.random() * Math.PI * 2;
                const sp = Math.random() * 60 + 20;
                combatManager.hitSparks.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(spAng) * sp,
                  vy: Math.sin(spAng) * sp - 10,
                  color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
                  size: Math.random() * 3 + 2,
                  life: 0.5,
                  maxLife: 0.5
                });
              }
            }
          }
        }
      }

      // Check collision with remote players (LAN Multiplayer PvP)
      if (this.game && this.game.remotePlayers && this.game.network && this.game.network.connected) {
        for (const remotePlayer of this.game.remotePlayers.values()) {
          if (remotePlayer.id === this.game.network.clientId) continue;
          if (remotePlayer.isDead || (remotePlayer.dimension && remotePlayer.dimension !== curDim)) continue;
          if (spell.hitEnemies.has(remotePlayer.id)) continue;

          const dx = remotePlayer.x - spell.x;
          const dy = remotePlayer.y - spell.y;
          const dotFlight = dx * spell.dirX + dy * spell.dirY;
          const dotPerp = Math.abs(dx * (-spell.dirY) + dy * spell.dirX);

          const collisionDist = Math.max(35, spell.speed * dt * 1.5);
          if (Math.abs(dotFlight) <= collisionDist && dotPerp <= (spell.width / 2 + (remotePlayer.radius || 10))) {
            spell.hitEnemies.add(remotePlayer.id);

            const kbX = spell.dirX * 130;
            const kbY = spell.dirY * 130;

            let actualDmg = spell.damage;
            if (remotePlayer.shield && remotePlayer.shield.active && remotePlayer.shield.energy > 0) {
              actualDmg = Math.round(spell.damage * 0.35);
              combatManager?.addHitSparks(remotePlayer.x, remotePlayer.y, '#38bdf8', 16);
              combatManager?.addFloatingText('🛡️ GEBLOCKT!', remotePlayer.x, remotePlayer.y - 20, '#38bdf8');
            } else {
              combatManager?.addHitSparks(remotePlayer.x, remotePlayer.y, '#ef4444', 20);
              combatManager?.addFloatingText(`🔥 -${actualDmg}`, remotePlayer.x, remotePlayer.y - 20, '#ef4444', 1.0);
            }

            this.game.network.sendPvPHit(remotePlayer.id, actualDmg, kbX, kbY);
          }
        }
      }
    }

    // 5. Update Plasma Orbs
    this.updatePlasmaOrbs(dt, player, combatManager, enemyManager);

    this.updateHUD();
  }

  // ---------------------------------------------------------------------------
  // HUD & UI SYNCHRONIZATION
  // ---------------------------------------------------------------------------
  updateHUD() {
    const player = this.game?.player;
    if (!this.magicHudSlot) return;

    if (!player || !player.artifact || player.artifact.charges <= 0) {
      this.magicHudSlot.classList.add('hidden');
      return;
    }

    this.magicHudSlot.classList.remove('hidden');

    if (this.magicChargesBadge) {
      this.magicChargesBadge.textContent = player.artifact.charges;
    }

    // Dynamic icon on the spell button
    const iconEl = this.magicHudSlot.querySelector('.magic-btn-icon');
    if (iconEl) {
      iconEl.textContent = player.artifact.icon || '🔥';
    }

    // Dynamic border & glow based on artifact colorTheme
    if (this.btnCastMagic) {
      const col = player.artifact.colorTheme || '#ef4444';
      const glow = player.artifact.glowColor || 'rgba(239, 68, 68, 0.5)';
      this.btnCastMagic.style.borderColor = col;
      this.btnCastMagic.style.boxShadow = `0 0 12px ${glow}`;
    }

    if (this.magicCooldownOverlay) {
      const cd = player.artifact.cooldownTimer || 0;
      const cdMax = player.artifact.cooldownMax || 3.0;
      if (cd > 0) {
        const pct = (cd / cdMax) * 100;
        this.magicCooldownOverlay.style.height = `${pct}%`;
        this.magicCooldownOverlay.classList.remove('hidden');
      } else {
        this.magicCooldownOverlay.style.height = '0%';
        this.magicCooldownOverlay.classList.add('hidden');
      }
    }

    // Synchronize mobile touch magic button
    const touchMagicBtn = (typeof document !== 'undefined') ? document.querySelector('.touch-btn.btn-magic') : null;
    const touchChargesBadge = (typeof document !== 'undefined') ? document.getElementById('touch-magic-charges') : null;
    const touchSub = (typeof document !== 'undefined') ? document.getElementById('touch-magic-sub') : null;
    if (touchMagicBtn) {
      if (!player || !player.artifact || player.artifact.charges <= 0) {
        touchMagicBtn.style.display = 'none';
        touchMagicBtn.style.pointerEvents = 'none';
        if (touchChargesBadge) touchChargesBadge.textContent = '0';
      } else {
        touchMagicBtn.style.display = 'flex';
        touchMagicBtn.style.opacity = '1';
        touchMagicBtn.style.pointerEvents = 'auto';
        const col = player.artifact.colorTheme || '#ef4444';
        const glow = player.artifact.glowColor || 'rgba(239, 68, 68, 0.5)';
        touchMagicBtn.style.borderColor = col;
        const iconEl = touchMagicBtn.querySelector('.btn-icon') || touchMagicBtn.querySelector('.btn-letter');
        if (iconEl) iconEl.textContent = player.artifact.icon || '✨';
        if (touchChargesBadge) touchChargesBadge.textContent = player.artifact.charges;
        if (touchSub) touchSub.textContent = player.artifact.title || 'Magie';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // RENDERING (Dark Ghibli Papercraft Aesthetics)
  // ---------------------------------------------------------------------------
  render(ctx, camera) {
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;
    this.renderGroundArtifacts(ctx, camera, curDim);
    this.renderSpellsAndAuras(ctx, camera);
  }

  renderSpellsAndAuras(ctx, camera) {
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;
    const player = this.game?.player;

    // 2. Active Spell Projectiles (Phönix)
    this.renderActiveSpells(ctx, camera, curDim);

    // 3. Pink Plasma Orbs in Orbit
    this.renderPlasmaOrbs(ctx, camera);

    // 4. Player Glitter Aura
    if (player && player.artifact && player.artifact.charges > 0) {
      this.renderPlayerGlitter(ctx, camera);
    }

    // 5. Attack Preview Aiming Stencil (Schablone bei Halten)
    if (this.isAiming) {
      this.renderAimingStencil(ctx, camera);
    }
  }

  renderGroundArtifacts(ctx, camera, curDim) {
    const zoom = camera ? camera.zoom : 1;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;
    const curSubCave = this.game?.activeSubCave || null;

    for (const art of this.groundArtifacts) {
      if (art.dimension !== curDim) continue;
      if (curDim === DIMENSIONS.CAVES && art.subCaveId && curSubCave && art.subCaveId !== curSubCave) continue;

      const sx = (art.x - camX) * zoom;
      const sy = (art.y - camY) * zoom;

      // Distance culling
      if (sx < -40 || sx > ctx.canvas.width + 40 || sy < -60 || sy > ctx.canvas.height + 40) continue;

      const bobY = Math.sin(art.bobTime) * 4;
      const py = sy + bobY;
      const themeColor = art.def.colorTheme || '#ef4444';
      const glowColor = art.def.glowColor || 'rgba(239, 68, 68, 0.5)';

      ctx.save();

      // Vertical Heavenly Light Pillar
      const grad = ctx.createLinearGradient(sx, py - 45 * zoom, sx, py + 10 * zoom);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.6, glowColor);
      grad.addColorStop(1, 'rgba(250, 204, 21, 0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(sx - 10 * zoom, py - 45 * zoom, 20 * zoom, 55 * zoom);

      // Rotating Magic Runes Sigil on ground
      ctx.save();
      ctx.translate(sx, sy + 6 * zoom);
      ctx.scale(1, 0.38); // Flattened perspective oval
      ctx.rotate(art.bobTime * 0.5);
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1.5 * zoom;
      ctx.beginPath();
      ctx.arc(0, 0, 16 * zoom, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(0, 0, 10 * zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Floating Papercraft Gem Orb
      const orbRadius = 7 * zoom;

      // Soft outer glow
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(sx, py, (orbRadius + 4) * (1 + art.lightPulse * 0.2), 0, Math.PI * 2);
      ctx.fill();

      // Gem Orb Body
      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.arc(sx, py, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // Top Highlight fold
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.moveTo(sx, py - orbRadius);
      ctx.lineTo(sx + orbRadius * 0.7, py);
      ctx.lineTo(sx, py + orbRadius * 0.4);
      ctx.lineTo(sx - orbRadius * 0.7, py);
      ctx.closePath();
      ctx.fill();

      // Pure White Shine Sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx - 2 * zoom, py - 2 * zoom, 1.8 * zoom, 0, Math.PI * 2);
      ctx.fill();

      // Floating Artifact Icon Emoji above Orb
      if (typeof ctx.fillText === 'function') {
        ctx.font = `${Math.round(11 * zoom)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(art.def.icon || '✨', sx, py - 12 * zoom);
      }

      // Orbiting Ember Sparks
      for (let s = 0; s < 3; s++) {
        const sparkAng = art.bobTime * 2 + (s * Math.PI * 2) / 3;
        const sparkDist = (orbRadius + 5) * zoom;
        const spx = sx + Math.cos(sparkAng) * sparkDist;
        const spy = py + Math.sin(sparkAng) * (sparkDist * 0.5);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(spx, spy, 1.2 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  renderActiveSpells(ctx, camera, curDim) {
    const zoom = camera ? camera.zoom : 1;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    for (const spell of this.activeSpells) {
      if (spell.dimension !== curDim) continue;

      const sx = (spell.x - camX) * zoom;
      const sy = (spell.y - camY) * zoom;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(spell.angle);

      // Frost-Kegel Wellen-Animation
      if (spell.type === 'frost_cone') {
        const progress = Math.min(1.0, 1.0 - (spell.life / (spell.maxLife || 0.4)));
        const curR = (spell.range * (0.35 + progress * 0.65)) * zoom;
        const alpha = Math.sin(progress * Math.PI);

        ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.35})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, curR, -spell.arc / 2, spell.arc / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `rgba(224, 242, 254, ${alpha * 0.85})`;
        ctx.lineWidth = 2.5 * zoom;
        ctx.beginPath();
        ctx.arc(0, 0, curR, -spell.arc / 2, spell.arc / 2);
        ctx.stroke();

        ctx.restore();
        continue;
      }

      // Flapping wing cycle
      const flap = Math.sin(spell.animTime * 18);
      const halfW = (spell.width / 2) * zoom; // 40px * zoom each wing

      // 1. Blazing Heat Aura / Shockwave
      const auraGrad = ctx.createRadialGradient(0, 0, 10 * zoom, 0, 0, halfW * 1.2);
      auraGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
      auraGrad.addColorStop(0.4, 'rgba(239, 68, 68, 0.45)');
      auraGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, halfW * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 2. Trailing Fiery Tail Feathers (3 long blazing streams)
      for (let t = -1; t <= 1; t++) {
        const tailWav = Math.sin(spell.animTime * 14 + t) * (6 * zoom);
        ctx.fillStyle = t === 0 ? '#facc15' : '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-10 * zoom, t * 8 * zoom);
        ctx.quadraticCurveTo(-40 * zoom, (t * 16 + tailWav) * zoom, -70 * zoom, (t * 22 + tailWav * 1.4) * zoom);
        ctx.lineTo(-45 * zoom, (t * 8) * zoom);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Wide Majestic Origami Phoenix Wings (5 Tiles = 80px width)
      // Left Wing
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-18 * zoom, -halfW * (0.85 + flap * 0.15));
      ctx.lineTo(12 * zoom, -halfW * (0.65 + flap * 0.15));
      ctx.lineTo(8 * zoom, 0);
      ctx.closePath();
      ctx.fill();

      // Left Wing Layer 2 (Lighter Orange Paper Fold)
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12 * zoom, -halfW * (0.75 + flap * 0.12));
      ctx.lineTo(10 * zoom, -halfW * (0.5 + flap * 0.12));
      ctx.lineTo(6 * zoom, 0);
      ctx.closePath();
      ctx.fill();

      // Right Wing
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-18 * zoom, halfW * (0.85 + flap * 0.15));
      ctx.lineTo(12 * zoom, halfW * (0.65 + flap * 0.15));
      ctx.lineTo(8 * zoom, 0);
      ctx.closePath();
      ctx.fill();

      // Right Wing Layer 2
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12 * zoom, halfW * (0.75 + flap * 0.12));
      ctx.lineTo(10 * zoom, halfW * (0.5 + flap * 0.12));
      ctx.lineTo(6 * zoom, 0);
      ctx.closePath();
      ctx.fill();

      // 4. Phoenix Body & Radiant Origami Beak
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-16 * zoom, 0);
      ctx.lineTo(0, -6 * zoom);
      ctx.lineTo(24 * zoom, 0); // Sharp golden beak forward
      ctx.lineTo(0, 6 * zoom);
      ctx.closePath();
      ctx.fill();

      // Golden Beak Tip
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(14 * zoom, -3 * zoom);
      ctx.lineTo(26 * zoom, 0);
      ctx.lineTo(14 * zoom, 3 * zoom);
      ctx.closePath();
      ctx.fill();

      // Blazing Head Crest (3 fire feathers)
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(4 * zoom, 0);
      ctx.lineTo(-10 * zoom, -8 * zoom);
      ctx.lineTo(0, -2 * zoom);
      ctx.lineTo(-14 * zoom, 0);
      ctx.lineTo(0, 2 * zoom);
      ctx.lineTo(-10 * zoom, 8 * zoom);
      ctx.closePath();
      ctx.fill();

      // Pure White Glowing Eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10 * zoom, -2 * zoom, 3 * zoom, 1.5 * zoom);
      ctx.fillRect(10 * zoom, 0.5 * zoom, 3 * zoom, 1.5 * zoom);

      ctx.restore();
    }
  }

  renderPlayerGlitter(ctx, camera) {
    const zoom = camera ? camera.zoom : 1;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    for (const p of this.playerGlitterParticles) {
      const sx = (p.x - camX) * zoom;
      const sy = (p.y - camY) * zoom;

      ctx.save();
      const alpha = (p.life / p.maxLife) * (0.6 + Math.sin(p.twinkle) * 0.35);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;

      // Draw 4-point star sparkle
      const s = p.size * zoom;
      ctx.beginPath();
      ctx.moveTo(sx, sy - s);
      ctx.lineTo(sx + s * 0.3, sy - s * 0.3);
      ctx.lineTo(sx + s, sy);
      ctx.lineTo(sx + s * 0.3, sy + s * 0.3);
      ctx.lineTo(sx, sy + s);
      ctx.lineTo(sx - s * 0.3, sy + s * 0.3);
      ctx.lineTo(sx - s, sy);
      ctx.lineTo(sx - s * 0.3, sy - s * 0.3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // ATTACK PREVIEW AIMING STENCIL (Schablone bei Halten)
  // ---------------------------------------------------------------------------
  renderAimingStencil(ctx, camera) {
    const player = this.game?.player;
    if (!player || !player.artifact || player.artifact.charges <= 0 || player.isDead) return;

    const zoom = camera ? camera.zoom : 1;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    const px = player.x;
    const py = player.y - 8;
    const sx = (px - camX) * zoom;
    const sy = (py - camY) * zoom;

    const facingAngle = (typeof player.getFacingAngle === 'function') ? player.getFacingAngle() : 0;
    const artId = player.artifact.id;
    const t = Date.now() / 1000;

    ctx.save();

    // 1. RUBIN-PHÖNIX: 5 Kacheln (80px) breite Schneise in Blickrichtung
    if (artId === 'phoenix') {
      ctx.translate(sx, sy);
      ctx.rotate(facingAngle);

      const corridorLength = 260 * zoom;
      const corridorHalfWidth = 40 * zoom; // 80px Gesamtbreite (5 Kacheln)

      // Halbtransparenter Flammen-Schleier
      const grad = ctx.createLinearGradient(0, 0, corridorLength, 0);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.42)');
      grad.addColorStop(0.7, 'rgba(245, 158, 11, 0.22)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, -corridorHalfWidth, corridorLength, corridorHalfWidth * 2);

      // Gestrichelte feuerrote Seitenlinien
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.85)';
      ctx.lineWidth = 2 * zoom;
      ctx.setLineDash([8 * zoom, 5 * zoom]);
      ctx.lineDashOffset = -t * 32 * zoom;
      ctx.beginPath();
      ctx.moveTo(0, -corridorHalfWidth);
      ctx.lineTo(corridorLength, -corridorHalfWidth);
      ctx.moveTo(0, corridorHalfWidth);
      ctx.lineTo(corridorLength, corridorHalfWidth);
      ctx.stroke();
      ctx.setLineDash([]);

      // Flugbahn-Mittelachse
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.55)';
      ctx.lineWidth = 1 * zoom;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(corridorLength * 0.9, 0);
      ctx.stroke();

      // Animierte wandernde Chevrons (>> Vorwärtsflug-Indikatoren)
      const chevCount = 4;
      for (let c = 0; c < chevCount; c++) {
        const progress = ((t * 1.6 + c / chevCount) % 1.0);
        const cx = progress * corridorLength;
        const alpha = Math.sin(progress * Math.PI);
        ctx.strokeStyle = `rgba(254, 240, 138, ${alpha * 0.9})`;
        ctx.lineWidth = 2.5 * zoom;
        ctx.beginPath();
        ctx.moveTo(cx - 12 * zoom, -20 * zoom);
        ctx.lineTo(cx + 4 * zoom, 0);
        ctx.lineTo(cx - 12 * zoom, 20 * zoom);
        ctx.stroke();
      }
    }

    // 2. ROSA PLASMAKUGELN: Orbit-Ring & 4 Detonations-Zonen um den Spieler
    else if (artId === 'plasma_orbs') {
      ctx.translate(sx, sy);
      const orbitR = 42 * zoom;
      const blastR = 24 * zoom;

      // Zonen-Hintergrund
      ctx.fillStyle = 'rgba(236, 72, 153, 0.14)';
      ctx.beginPath();
      ctx.arc(0, 0, orbitR + blastR, 0, Math.PI * 2);
      ctx.fill();

      // Pulsierender gestrichelter Orbit-Pfad
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.85)';
      ctx.lineWidth = 2 * zoom;
      ctx.setLineDash([6 * zoom, 4 * zoom]);
      ctx.lineDashOffset = -t * 24 * zoom;
      ctx.beginPath();
      ctx.arc(0, 0, orbitR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4 Detonations-Retikel an den 4 Orbit-Positionen
      for (let i = 0; i < 4; i++) {
        const orbAngle = t * 2.5 + (i * Math.PI / 2);
        const ox = Math.cos(orbAngle) * orbitR;
        const oy = Math.sin(orbAngle) * orbitR;

        // Explosions-Wirkungsbereich
        ctx.fillStyle = 'rgba(236, 72, 153, 0.22)';
        ctx.beginPath();
        ctx.arc(ox, oy, blastR * (0.85 + Math.sin(t * 6 + i) * 0.15), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 1.5 * zoom;
        ctx.beginPath();
        ctx.arc(ox, oy, 6 * zoom, 0, Math.PI * 2);
        ctx.stroke();

        // Ziel-Fadenkreuz
        ctx.beginPath();
        ctx.moveTo(ox - 10 * zoom, oy);
        ctx.lineTo(ox + 10 * zoom, oy);
        ctx.moveTo(ox, oy - 10 * zoom);
        ctx.lineTo(ox, oy + 10 * zoom);
        ctx.stroke();
      }
    }

    // 3. EISNEBEL: 70° Frostkegel vor dem Spieler
    else if (artId === 'frost_cone') {
      ctx.translate(sx, sy);
      const coneR = 115 * zoom;
      const halfArc = 0.65; // ~75° Kegel (±37.5°)

      // Kegel-Pfad
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, coneR, facingAngle - halfArc, facingAngle + halfArc);
      ctx.closePath();

      // Frost-Fächer Farbverlauf
      const grad = ctx.createRadialGradient(0, 0, 10 * zoom, 0, 0, coneR);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.42)');
      grad.addColorStop(0.7, 'rgba(125, 211, 252, 0.25)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Gestrichelter cyanblauer Bogenrand
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.9)';
      ctx.lineWidth = 2 * zoom;
      ctx.setLineDash([7 * zoom, 4 * zoom]);
      ctx.lineDashOffset = -t * 20 * zoom;
      ctx.stroke();
      ctx.setLineDash([]);

      // Radiale Begrenzungslinien
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.8 * zoom;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(facingAngle - halfArc) * coneR, Math.sin(facingAngle - halfArc) * coneR);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(facingAngle + halfArc) * coneR, Math.sin(facingAngle + halfArc) * coneR);
      ctx.stroke();

      // Mittlere Ziel-Leitlinie
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1 * zoom;
      ctx.setLineDash([4 * zoom, 4 * zoom]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(facingAngle) * coneR * 0.9, Math.sin(facingAngle) * coneR * 0.9);
      ctx.stroke();
      ctx.setLineDash([]);

      // Eiskristall-Glanzpunkte im Kegel
      for (let s = 1; s <= 3; s++) {
        const sDist = (coneR * 0.3 * s) * (0.8 + Math.sin(t * 3 + s) * 0.1);
        const sAng = facingAngle + Math.sin(t * 2 + s * 1.5) * (halfArc * 0.6);
        const gx = Math.cos(sAng) * sDist;
        const gy = Math.sin(sAng) * sDist;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx, gy, 2 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. SMARAGD-DRUIDE / LEEREN-TELEPORT
    else if (artId === 'druid_bear') {
      ctx.translate(sx, sy);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.75)';
      ctx.lineWidth = 2 * zoom;
      ctx.setLineDash([5 * zoom, 5 * zoom]);
      ctx.lineDashOffset = -t * 15 * zoom;
      ctx.beginPath();
      ctx.arc(0, 0, 32 * zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (artId === 'void_teleport') {
      ctx.translate(sx, sy);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
      ctx.lineWidth = 2 * zoom;
      ctx.beginPath();
      ctx.arc(0, 0, 24 * zoom, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
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
    this.spawnOptions = options;

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

    // Freeze Status (Eisnebel Artefakt)
    this.freezeTimer = 0;
  }

  update(dt, player, map, enemyManager, combatManager) {
    if (this.state === 'dead') return;

    // Wasser-Ertrinken für nicht-fliegende Gegner (falls durch Knockback oder Wanderung im Wasser gelandet)
    if (!isFlyingEnemy(this.typeId) && map) {
      const tx = Math.floor(this.x / TILE_SIZE);
      const ty = Math.floor(this.y / TILE_SIZE);
      const ground = map.getGroundTile ? map.getGroundTile(tx, ty) : 0;
      const isWater = (ground === TILES.WATER || ground === TILES.SWAMP_WATER || ground === TILES.CAVE_WATER || ground === TILES.VOID_LAKE);
      const isBridge = (ground === TILES.BRIDGE_H || ground === TILES.BRIDGE_V || ground === TILES.RAINBOW_BRIDGE_H || ground === TILES.RAINBOW_BRIDGE_V);
      if (isWater && !isBridge) {
        this.hp = 0;
        this.state = 'dead';
        this.die(combatManager);
        if (combatManager) {
          combatManager.addFloatingText('🌊 ERTRUNKEN!', this.x, this.y - 20, '#38bdf8', 1.3);
          for (let s = 0; s < 18; s++) {
            const spAng = Math.random() * Math.PI * 2;
            const sp = Math.random() * 60 + 20;
            combatManager.hitSparks.push({
              dimension: this.dimension,
              x: this.x,
              y: this.y,
              vx: Math.cos(spAng) * sp,
              vy: Math.sin(spAng) * sp - 15,
              color: Math.random() > 0.3 ? '#38bdf8' : '#e0f2fe',
              size: Math.random() * 3 + 1.5,
              life: 0.5,
              maxLife: 0.5
            });
          }
        }
        return;
      }
    }

    // Einfrier-Zustand durch Eisnebel-Artefakt: Vollständige Lähmung (keine Bewegung, keine Angriffe)
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      if (this.hitFlash > 0) this.hitFlash -= dt;
      return;
    }

    this.animTime += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    if (this.alertEmoteTimer > 0) this.alertEmoteTimer -= dt;
    if (this.teleportCooldown > 0) this.teleportCooldown -= dt;
    if (this.hookCooldown > 0) this.hookCooldown -= dt;

    // Nur in der aktiven Dimension berechnen
    if (this.dimension !== enemyManager.game.currentDimension) return;

    // Wenn der Client im LAN-Modus NICHT der Master-Client ist:
    // Der Master-Client simuliert Bewegung, KI und Angriffe autoritativ.
    // Nicht-Master-Clients führen nur die Animation aus und interpolieren Koordinaten!
    if (enemyManager && enemyManager.isMasterClient === false) {
      return;
    }

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

    // Ertrinken im tiefen Wasser
    if (!isFlyingEnemy(this.typeId) && map) {
      const curTx = Math.floor(this.x / TILE_SIZE);
      const curTy = Math.floor(this.y / TILE_SIZE);
      const ground = map.getGroundTile ? map.getGroundTile(curTx, curTy) : 0;
      const isWater = (ground === TILES.WATER || ground === TILES.SWAMP_WATER || ground === TILES.CAVE_WATER || ground === TILES.VOID_LAKE);
      const isBridge = (ground === TILES.BRIDGE_H || ground === TILES.BRIDGE_V || ground === TILES.RAINBOW_BRIDGE_H || ground === TILES.RAINBOW_BRIDGE_V);
      if (isWater && !isBridge) {
        this.hp = 0;
        this.state = 'dead';
        this.die(this.enemyManager?.game?.combat);
      }
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

    // Wenn nicht Master-Client im LAN: Schaden an Master senden
    const net = combatManager?.game?.network;
    const isMaster = combatManager?.game?.enemyManager?.isMasterClient ?? true;
    if (!isMaster && net && net.connected) {
      net.sendDamageEnemy(this.id, amount, knockbackAngle, knockbackForce, isRange);
    }

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

      // Prüfen, ob nicht-fliegende Gegner durch Knockback ins Wasser gestoßen wurden -> Sofortiges Ertrinken!
      if (!isFlyingEnemy(this.typeId)) {
        const map = combatManager?.game?.currentMap || combatManager?.game?.map || null;
        if (map) {
          const tx = Math.floor(this.x / TILE_SIZE);
          const ty = Math.floor(this.y / TILE_SIZE);
          const ground = map.getGroundTile ? map.getGroundTile(tx, ty) : 0;
          const isWater = (ground === TILES.WATER || ground === TILES.SWAMP_WATER || ground === TILES.CAVE_WATER || ground === TILES.VOID_LAKE);
          const isBridge = (ground === TILES.BRIDGE_H || ground === TILES.BRIDGE_V || ground === TILES.RAINBOW_BRIDGE_H || ground === TILES.RAINBOW_BRIDGE_V);
          if (isWater && !isBridge) {
            this.hp = 0;
            this.state = 'dead';
            this.die(combatManager);
            if (combatManager) {
              combatManager.addFloatingText('🌊 ERTRUNKEN!', this.x, this.y - 20, '#38bdf8', 1.3);
              for (let s = 0; s < 18; s++) {
                const spAng = Math.random() * Math.PI * 2;
                const sp = Math.random() * 60 + 20;
                combatManager.hitSparks.push({
                  dimension: this.dimension,
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(spAng) * sp,
                  vy: Math.sin(spAng) * sp - 15,
                  color: Math.random() > 0.3 ? '#38bdf8' : '#e0f2fe',
                  size: Math.random() * 3 + 1.5,
                  life: 0.5,
                  maxLife: 0.5
                });
              }
            }
            return;
          }
        }
      }
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

    // Lebensbalken unter dem Monster (nur wenn verletzt / < 100% HP, kein Name)
    if (this.hp < this.maxHp && this.hp > 0) {
      const baseBelowY = drawY + Math.round(15 * this.scale) + 4;
      const barW = Math.round(24 * Math.max(0.8, Math.min(1.8, this.scale)));
      const barH = 3.5;
      const barX = drawX - barW / 2;
      const barY = baseBelowY;
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

    // 4. Frost Freeze Visuals (Eisnebel Artefakt)
    if (this.freezeTimer > 0) {
      ctx.save();
      const r = Math.max(9, Math.round(this.radius * 1.35));
      // Frost-Kokondecke
      ctx.fillStyle = 'rgba(56, 189, 248, 0.38)';
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(drawX, drawY - r - 6);
      ctx.lineTo(drawX + r + 4, drawY - 2);
      ctx.lineTo(drawX + r * 0.7, drawY + r);
      ctx.lineTo(drawX - r * 0.7, drawY + r);
      ctx.lineTo(drawX - r - 4, drawY - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sharp crystal shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.moveTo(drawX - r * 0.4, drawY - r);
      ctx.lineTo(drawX - r * 0.1, drawY - r * 0.4);
      ctx.lineTo(drawX - r * 0.5, drawY - 2);
      ctx.closePath();
      ctx.fill();

      // Floating Snowflake Icon
      if (typeof ctx.fillText === 'function') {
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄️', drawX, drawY - r - 12);
      }
      ctx.restore();
    }
  }
}

/**
 * Berechnet die Einfrier-Dauer für das Eisnebel-Artefakt (0.5s - 3.0s nach Monsterstärke)
 */
function calculateFreezeDuration(enemy) {
  if (!enemy) return 2.0;
  // Bosses / extrem starke Gegner (>= 500 HP oder Boss-Kategorie)
  if (enemy.category === 'boss' || enemy.maxHp >= 500) {
    return 0.5;
  }
  // Schwere / Elite-Monster (>= 300 HP oder mächtige Skalierung)
  if (enemy.maxHp >= 300 || enemy.scale >= 1.3) {
    return 1.0;
  }
  // Mittlere Monster (100 - 300 HP)
  if (enemy.maxHp >= 100) {
    return 1.8;
  }
  // Schwache Monster (<= 60 HP, kleine Spinnen, Schleime)
  return 3.0;
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
    this.respawnQueue = [];
    this.aiActive = true;
    this.isMasterClient = true; // Im LAN: Master simuliert KI; Nicht-Master interpoliert

    this.initSpawns();
  }

  initSpawns() {
    this.enemies = [];
    this.lootItems = [];
    this.xpOrbs = [];
    this.respawnQueue = [];

    const map = this.getMapForDimension(DIMENSIONS.OVERWORLD);
    const sp = map?.spawnPoint || { x: 50, y: 100 };
    const vz = map?.preset?.voidZone || { x: 268, y: 40, radius: 18 };
    const w = map?.width || 290;
    const h = map?.height || 200;

    // =========================================================================
    // OVERWORLD SPAWNS (Verdoppelt auf ~240 Mobs, Deterministische IDs)
    // =========================================================================

    // 1. Grasland & Lichtungen
    // Massenschwarm Blobs bei Spawn
    this.spawnPack('green_slime', (sp.x + 18) * TILE_SIZE, (sp.y + 4) * TILE_SIZE, 32, 55, DIMENSIONS.OVERWORLD, 'pack_slimes', {
      scale: 0.48, hp: 12, atk: 5, xpValue: 2
    });
    // Zweiter Blob-Schwarm südlich
    this.spawnPack('green_slime', (sp.x + 35) * TILE_SIZE, (sp.y + 40) * TILE_SIZE, 24, 50, DIMENSIONS.OVERWORLD, 'pack_slimes_south', {
      scale: 0.48, hp: 12, atk: 5, xpValue: 2
    });
    // Hügelschleime auf Hochebene
    this.spawnPack('green_slime', (sp.x + 22) * TILE_SIZE, (sp.y - 14) * TILE_SIZE, 8, 28, DIMENSIONS.OVERWORLD, 'pack_hill_slimes', {
      scale: 0.55, hp: 16, atk: 6, xpValue: 3, elevation: 1
    });

    // Waldhüter-Wildschweine
    this.spawnPack('tusk_boar', (sp.x - 18) * TILE_SIZE, (sp.y - 10) * TILE_SIZE, 6, 34, DIMENSIONS.OVERWORLD, 'pack_boars', {
      scale: 0.88, hp: 55, atk: 18, xpValue: 10
    });
    this.spawnPack('tusk_boar', (sp.x + 12) * TILE_SIZE, (sp.y - 35) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_boars_north', {
      scale: 0.88, hp: 55, atk: 18, xpValue: 10
    });
    this.spawnPack('tusk_boar', Math.round(w * 0.48) * TILE_SIZE, Math.round(h * 0.82) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_boars_south', {
      scale: 0.88, hp: 55, atk: 18, xpValue: 10
    });

    // Waldläufer-Schützen
    this.spawnPack('moss_archer', (sp.x - 20) * TILE_SIZE, (sp.y + 14) * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_archers', {
      scale: 0.95, hp: 65, atk: 18, xpValue: 15
    });
    this.spawnPack('moss_archer', Math.round(w * 0.36) * TILE_SIZE, Math.round(h * 0.35) * TILE_SIZE, 5, 28, DIMENSIONS.OVERWORLD, 'pack_river_archers', {
      scale: 0.95, hp: 65, atk: 18, xpValue: 15
    });
    this.spawnPack('moss_archer', Math.round(w * 0.44) * TILE_SIZE, Math.round(h * 0.48) * TILE_SIZE, 4, 26, DIMENSIONS.OVERWORLD, 'pack_lake_archers', {
      scale: 0.95, hp: 65, atk: 18, xpValue: 15
    });

    // 2. Dichter Urwald & Forste
    // Okami-Schattenwölfe
    this.spawnPack('dire_wolf', Math.round(w * 0.18) * TILE_SIZE, Math.round(h * 0.22) * TILE_SIZE, 6, 34, DIMENSIONS.OVERWORLD, 'pack_wolves_nw', {
      scale: 0.85, hp: 45, atk: 16, xpValue: 8
    });
    this.spawnPack('dire_wolf', Math.round(w * 0.22) * TILE_SIZE, Math.round(h * 0.68) * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_wolves_sw', {
      scale: 0.85, hp: 45, atk: 16, xpValue: 8
    });
    this.spawnPack('dire_wolf', Math.round(w * 0.78) * TILE_SIZE, Math.round(h * 0.52) * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_wolves_east', {
      scale: 0.85, hp: 45, atk: 16, xpValue: 8
    });
    this.spawnPack('dire_wolf', Math.round(w * 0.32) * TILE_SIZE, Math.round(h * 0.18) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_wolves_north', {
      scale: 0.85, hp: 45, atk: 16, xpValue: 8
    });

    // 3. Wüste & Treibsand (Südwesten)
    // 2x APEX-PREDATOR: Dünen-Schlund
    this.spawnEnemy('dune_maw', Math.round(w * 0.18) * TILE_SIZE, Math.round(h * 0.78) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_dune_maw_1', {
      scale: 1.55, hp: 340, atk: 36, xpValue: 60
    });
    this.spawnEnemy('dune_maw', Math.round(w * 0.28) * TILE_SIZE, Math.round(h * 0.90) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_dune_maw_2', {
      scale: 1.55, hp: 340, atk: 36, xpValue: 60
    });

    // Kaiser-Skorpione (3 Rudel)
    this.spawnPack('emperor_scorpion', Math.round(w * 0.14) * TILE_SIZE, Math.round(h * 0.84) * TILE_SIZE, 4, 34, DIMENSIONS.OVERWORLD, 'pack_scorpions_1', {
      scale: 1.05, hp: 90, atk: 24, xpValue: 20
    });
    this.spawnPack('emperor_scorpion', Math.round(w * 0.26) * TILE_SIZE, Math.round(h * 0.82) * TILE_SIZE, 4, 34, DIMENSIONS.OVERWORLD, 'pack_scorpions_2', {
      scale: 1.05, hp: 90, atk: 24, xpValue: 20
    });
    this.spawnPack('emperor_scorpion', Math.round(w * 0.10) * TILE_SIZE, Math.round(h * 0.75) * TILE_SIZE, 4, 32, DIMENSIONS.OVERWORLD, 'pack_scorpions_3', {
      scale: 1.05, hp: 90, atk: 24, xpValue: 20
    });

    // Wüstendünen-Vipern
    this.spawnPack('slithering_viper', Math.round(w * 0.12) * TILE_SIZE, Math.round(h * 0.88) * TILE_SIZE, 6, 28, DIMENSIONS.OVERWORLD, 'pack_dune_vipers', {
      scale: 0.9, hp: 55, atk: 18, xpValue: 12
    });
    this.spawnPack('slithering_viper', Math.round(w * 0.22) * TILE_SIZE, Math.round(h * 0.76) * TILE_SIZE, 5, 28, DIMENSIONS.OVERWORLD, 'pack_oasis_vipers', {
      scale: 0.9, hp: 55, atk: 18, xpValue: 12
    });

    // 4. Schnee & Eisberge (Nordosten)
    // 2x RIESIGER KOLOSS: Frost Giant
    this.spawnEnemy('frost_giant', Math.round(w * 0.78) * TILE_SIZE, Math.round(h * 0.20) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_frost_giant_1', {
      scale: 1.65, hp: 1500, atk: 65, xpValue: 220, elevation: 1
    });
    this.spawnEnemy('frost_giant', Math.round(w * 0.88) * TILE_SIZE, Math.round(h * 0.28) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_frost_giant_2', {
      scale: 1.65, hp: 1500, atk: 65, xpValue: 220, elevation: 1
    });

    // Origami-Krieger
    this.spawnPack('cursed_knight', Math.round(w * 0.72) * TILE_SIZE, Math.round(h * 0.26) * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_ice_knights', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25, elevation: 1
    });
    this.spawnPack('cursed_knight', Math.round(w * 0.82) * TILE_SIZE, Math.round(h * 0.15) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_glacier_knights', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25, elevation: 1
    });
    this.spawnPack('cursed_knight', Math.round(w * 0.62) * TILE_SIZE, Math.round(h * 0.20) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_north_knights', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25
    });
    this.spawnPack('cursed_knight', Math.round(w * 0.84) * TILE_SIZE, Math.round(h * 0.58) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_highland_knights', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25, elevation: 1
    });

    // 5. Düsterer Sumpf (Südosten)
    // Sporen-Spucker
    this.spawnPack('spore_spitter', Math.round(w * 0.62) * TILE_SIZE, Math.round(h * 0.68) * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_spores_1', {
      scale: 0.85, hp: 40, atk: 14, xpValue: 8
    });
    this.spawnPack('spore_spitter', Math.round(w * 0.70) * TILE_SIZE, Math.round(h * 0.78) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_spores_2', {
      scale: 0.85, hp: 40, atk: 14, xpValue: 8
    });

    // Smaragd-Nattern
    this.spawnPack('slithering_viper', Math.round(w * 0.70) * TILE_SIZE, Math.round(h * 0.66) * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_vipers_swamp', {
      scale: 1.0, hp: 70, atk: 20, xpValue: 15
    });

    // Teer-Schlamm Geister
    this.spawnPack('tar_mire', Math.round(w * 0.76) * TILE_SIZE, Math.round(h * 0.74) * TILE_SIZE, 6, 30, DIMENSIONS.OVERWORLD, 'pack_tar_1', {
      scale: 0.82, hp: 45, atk: 12, xpValue: 8
    });
    this.spawnPack('tar_mire', Math.round(w * 0.64) * TILE_SIZE, Math.round(h * 0.82) * TILE_SIZE, 5, 28, DIMENSIONS.OVERWORLD, 'pack_tar_2', {
      scale: 0.82, hp: 45, atk: 12, xpValue: 8
    });

    // 6. Felsgebirge & Bergpfade (Höhenebene +1, +2)
    // 2x Moos-Koloss
    this.spawnEnemy('boulder_troll', Math.round(w * 0.58) * TILE_SIZE, Math.round(h * 0.32) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_boulder_troll_1', {
      scale: 1.60, hp: 1400, atk: 60, xpValue: 200, elevation: 1
    });
    this.spawnEnemy('boulder_troll', Math.round(w * 0.48) * TILE_SIZE, Math.round(h * 0.24) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_boulder_troll_2', {
      scale: 1.60, hp: 1400, atk: 60, xpValue: 200, elevation: 1
    });

    // Wache Origami-Krieger auf Hochebenen
    this.spawnPack('cursed_knight', Math.round(w * 0.64) * TILE_SIZE, Math.round(h * 0.36) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_samurai_1', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25, elevation: 1
    });
    this.spawnPack('cursed_knight', Math.round(w * 0.52) * TILE_SIZE, Math.round(h * 0.38) * TILE_SIZE, 4, 28, DIMENSIONS.OVERWORLD, 'pack_samurai_2', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25, elevation: 1
    });

    // 7. Die Leere / Void
    // Leeren-Verschlinger
    this.spawnPack('void_reaper', (vz.x - 7) * TILE_SIZE, (vz.y - 5) * TILE_SIZE, 4, 30, DIMENSIONS.OVERWORLD, 'pack_void_reapers_1', {
      scale: 1.15, hp: 540, atk: 55, xpValue: 90
    });
    this.spawnPack('void_reaper', (vz.x + 4) * TILE_SIZE, (vz.y + 7) * TILE_SIZE, 4, 30, DIMENSIONS.OVERWORLD, 'pack_void_reapers_2', {
      scale: 1.15, hp: 540, atk: 55, xpValue: 90
    });

    // TITAN: Auge des Abgrunds
    this.spawnEnemy('gazer_of_the_void', vz.x * TILE_SIZE, vz.y * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_gazer_of_the_void', {
      scale: 1.55, hp: 1350, atk: 75, xpValue: 220
    });

    // Brunnen-Fallen: Schatten-Tentakel
    this.spawnEnemy('abyss_tentacle', (vz.x - 6) * TILE_SIZE, (vz.y + 5) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'tentacle_1', {
      scale: 1.25, hp: 480, atk: 50, xpValue: 80
    });
    this.spawnEnemy('abyss_tentacle', (vz.x + 6) * TILE_SIZE, (vz.y - 5) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'tentacle_2', {
      scale: 1.25, hp: 480, atk: 50, xpValue: 80
    });
    this.spawnEnemy('abyss_tentacle', (vz.x + 1) * TILE_SIZE, (vz.y + 8) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'tentacle_3', {
      scale: 1.25, hp: 480, atk: 50, xpValue: 80
    });

    // 8. Brand- & Vulkanzone
    this.spawnEnemy('pyromancer', Math.round(w * 0.44) * TILE_SIZE, Math.round(h * 0.76) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_pyromancer_1', {
      scale: 1.10, hp: 130, atk: 30, xpValue: 35
    });
    this.spawnEnemy('pyromancer', Math.round(w * 0.50) * TILE_SIZE, Math.round(h * 0.74) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_pyromancer_2', {
      scale: 1.10, hp: 130, atk: 30, xpValue: 35
    });
    this.spawnPack('lava_core', Math.round(w * 0.44) * TILE_SIZE, Math.round(h * 0.78) * TILE_SIZE, 8, 28, DIMENSIONS.OVERWORLD, 'pack_fire_1', {
      scale: 0.75, hp: 25, atk: 12, xpValue: 4
    });
    this.spawnPack('lava_core', Math.round(w * 0.52) * TILE_SIZE, Math.round(h * 0.76) * TILE_SIZE, 6, 26, DIMENSIONS.OVERWORLD, 'pack_fire_2', {
      scale: 0.75, hp: 25, atk: 12, xpValue: 4
    });

    // =========================================================================
    // HÖHLEN-SPAWNS (CAVES DIMENSION)
    // =========================================================================
    // Haupthöhlen (main_complex)
    this.spawnPack('cave_weaver', 32 * TILE_SIZE, 26 * TILE_SIZE, 8, 36, DIMENSIONS.CAVES, 'pack_cave_spiders_main1', {
      scale: 0.72, hp: 24, atk: 10, xpValue: 4
    });
    this.spawnPack('cave_weaver', 55 * TILE_SIZE, 42 * TILE_SIZE, 6, 32, DIMENSIONS.CAVES, 'pack_cave_spiders_main2', {
      scale: 0.72, hp: 24, atk: 10, xpValue: 4
    });

    // Moosige Grotte
    this.spawnPack('cave_weaver', 12 * TILE_SIZE, 12 * TILE_SIZE, 6, 28, DIMENSIONS.CAVES, 'pack_cave_spiders_forest', {
      scale: 0.72, hp: 24, atk: 10, xpValue: 4
    });

    // Eis-Grotte
    this.spawnPack('cave_weaver', 12 * TILE_SIZE, 12 * TILE_SIZE, 6, 28, DIMENSIONS.CAVES, 'pack_cave_spiders_snow', {
      scale: 0.72, hp: 24, atk: 10, xpValue: 4
    });

    // Astrale Kluft
    this.spawnPack('cave_weaver', 12 * TILE_SIZE, 12 * TILE_SIZE, 6, 28, DIMENSIONS.CAVES, 'pack_cave_spiders_void', {
      scale: 0.72, hp: 24, atk: 10, xpValue: 4
    });

    // =========================================================================
    // WOLKENREICH-SPAWNS (CLOUDS DIMENSION)
    // =========================================================================
    const cloudMap = this.getMapForDimension(DIMENSIONS.CLOUDS);
    if (cloudMap && cloudMap.islands && cloudMap.islands.length > 0) {
      cloudMap.islands.forEach((isl, idx) => {
        if (idx % 2 === 0) {
          this.spawnPack('sky_harpy', isl.x * TILE_SIZE, isl.y * TILE_SIZE, 3, 24, DIMENSIONS.CLOUDS, `pack_sky_${idx}`, {
            scale: 1.05, hp: 390, atk: 50, xpValue: 65
          });
        }
        if (idx % 2 === 1) {
          this.spawnEnemy('star_astromancer', (isl.x + 2) * TILE_SIZE, (isl.y - 1) * TILE_SIZE, DIMENSIONS.CLOUDS, `pack_sky_astro_${idx}`, {
            scale: 1.18, hp: 500, atk: 62, xpValue: 90
          });
        }
      });
    } else {
      const cloudSpawns = [
        { x: Math.round(w * 0.15), y: Math.round(h * 0.15) },
        { x: Math.round(w * 0.35), y: Math.round(h * 0.12) },
        { x: Math.round(w * 0.55), y: Math.round(h * 0.20) },
        { x: Math.round(w * 0.50), y: Math.round(h * 0.48) },
        { x: Math.round(w * 0.78), y: Math.round(h * 0.45) },
        { x: Math.round(w * 0.60), y: Math.round(h * 0.72) },
        { x: Math.round(w * 0.25), y: Math.round(h * 0.68) },
        { x: Math.round(w * 0.85), y: Math.round(h * 0.80) }
      ];
      cloudSpawns.forEach((cs, i) => {
        this.spawnPack('sky_harpy', cs.x * TILE_SIZE, cs.y * TILE_SIZE, 3, 24, DIMENSIONS.CLOUDS, `pack_sky_fb_${i}`, {
          scale: 1.05, hp: 390, atk: 50, xpValue: 65
        });
        this.spawnEnemy('star_astromancer', (cs.x + 3) * TILE_SIZE, (cs.y + 1) * TILE_SIZE, DIMENSIONS.CLOUDS, `pack_sky_astro_fb_${i}`, {
          scale: 1.15, hp: 480, atk: 60, xpValue: 85
        });
      });
    }
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
    if (isFlyingEnemy(typeId)) {
      return { x: rawX, y: rawY };
    }

    const map = this.getMapForDimension(dimension);
    if (!map) return { x: rawX, y: rawY };

    const tx = Math.floor(rawX / TILE_SIZE);
    const ty = Math.floor(rawY / TILE_SIZE);

    // Finde nächste freie begehbare Land-Kachel (deterministisch)
    const safeTile = findNearestWalkableTile(map, tx, ty, 14);
    return {
      x: safeTile.tx * TILE_SIZE + 8,
      y: safeTile.ty * TILE_SIZE + 8
    };
  }

  spawnEnemy(typeId, x, y, dimension = DIMENSIONS.OVERWORLD, packId = null, options = {}) {
    const pos = this.findWalkablePosition(typeId, x, y, dimension);
    const id = options.id || (packId ? `${packId}_0` : `${typeId}_${Math.round(x)}_${Math.round(y)}`);
    const enemy = new EnemyEntity(typeId, pos.x, pos.y, dimension, packId, {
      ...options,
      id
    });
    this.enemies.push(enemy);
    return enemy;
  }

  spawnPack(typeId, centerX, centerY, count = 2, radius = 26, dimension = DIMENSIONS.OVERWORLD, packId = null, options = {}) {
    const pack = packId || `pack_${typeId}_${Math.round(centerX)}_${Math.round(centerY)}`;
    const created = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.sin(i * 1.5) * 0.25);
      const dist = ((i % 3) * 0.3 + 0.4) * radius;
      const rawX = centerX + Math.cos(angle) * dist;
      const rawY = centerY + Math.sin(angle) * dist;
      const pos = this.findWalkablePosition(typeId, rawX, rawY, dimension);
      const enemy = new EnemyEntity(typeId, pos.x, pos.y, dimension, pack, {
        ...options,
        id: `${pack}_${i}`
      });
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

    // Drop-Raten: XP droppen immer (100%), Pfeile und Herzen nach Nutzer-Balancing
    const isBoss = enemy && (enemy.category === 'boss' || enemy.maxHp >= 100);
    const isRanged = enemy && (enemy.category === 'range' || enemy.typeId === 'moss_archer');

    // 1. Herz-Beere (❤️ +25 HP) - leicht erhöht (14% normal, 40% bei Bossen)
    const heartChance = isBoss ? 0.40 : 0.14;
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

    // 2. Köcher-Pfeile (🏹 +3-5 Pfeile) - deutlich erhöht (35% normal, 60% Bogenschützen, 50% Bosse)
    const arrowChance = isBoss ? 0.50 : (isRanged ? 0.60 : 0.35);
    if (Math.random() < arrowChance) {
      const amount = Math.floor(Math.random() * 3) + 3; // 3 bis 5 Pfeile
      this.lootItems.push({
        type: LOOT_TYPES.ARROW,
        dimension,
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        amount,
        life: 25.0,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    // 3. Sternenstaub / Geist-Juwel (⭐ Glanzpartikel) - selten (ca. 6% bei normalen Gegnern, 35% bei Bossen)
    const gemChance = isBoss ? 0.35 : 0.06;
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

    // 4. Magisches Artefakt (🔥 Zauber-Orb) - NUR bei schweren Monstern!
    const HEAVY_MONSTER_TYPES = [
      'boulder_troll', 'frost_giant', 'void_reaper', 'gazer_of_the_void',
      'sky_harpy_queen', 'sky_astromancer_grand', 'star_astromancer',
      'cursed_knight', 'emperor_scorpion'
    ];
    const isHeavyMonster = enemy && (
      enemy.category === 'boss' ||
      enemy.maxHp >= 350 ||
      HEAVY_MONSTER_TYPES.includes(enemy.typeId)
    );

    if (isHeavyMonster) {
      const roll = Math.random();
      const dropChance = enemy.category === 'boss' ? 0.35 : 0.15;
      if (roll < dropChance && this.game?.magicManager) {
        this.game.magicManager.dropMonsterArtifact(x, y, dimension);
      }
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

        // Respawn-Berechnung nach Stärke (3-5 Min)
        // Schwach (<= 60 HP): 3 Min (180 s)
        // Mittel (60 < HP < 350): 4 Min (240 s)
        // Schwer / Boss (>= 350 HP oder category 'boss'): 5 Min (300 s)
        let respawnTime = 180;
        if (enemy.maxHp >= 350 || enemy.category === 'boss') {
          respawnTime = 300;
        } else if (enemy.maxHp > 60) {
          respawnTime = 240;
        }

        this.respawnQueue.push({
          typeId: enemy.typeId,
          x: enemy.homeX || enemy.x,
          y: enemy.homeY || enemy.y,
          dimension: enemy.dimension,
          packId: enemy.packId,
          options: enemy.spawnOptions ? { ...enemy.spawnOptions } : {},
          timer: respawnTime
        });

        this.enemies.splice(i, 1);
      }
    }

    // 1b. Update Respawn Queue (tick down and respawn after 3-5 min)
    for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
      const item = this.respawnQueue[i];
      item.timer -= dt;
      if (item.timer <= 0) {
        this.spawnEnemy(item.typeId, item.x, item.y, item.dimension, item.packId, item.options);
        this.respawnQueue.splice(i, 1);
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
            const gain = item.amount || 4;
            player.ranged.ammo = Math.min(30, player.ranged.ammo + gain);
            combatManager?.addFloatingText(`🏹 +${gain} PFEILE`, player.x, player.y - 20, '#38bdf8');
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

  // ---------------------------------------------------------------------------
  // LAN-MULTIPLAYER MOB-SYNCHRONISATION
  // ---------------------------------------------------------------------------
  serializeEnemiesState() {
    return this.enemies.map(e => ({
      id: e.id,
      x: Math.round(e.x * 10) / 10,
      y: Math.round(e.y * 10) / 10,
      vx: Math.round((e.vx || 0) * 10) / 10,
      vy: Math.round((e.vy || 0) * 10) / 10,
      hp: e.hp,
      maxHp: e.maxHp,
      state: e.state,
      animTime: Math.round(e.animTime * 10) / 10,
      facing: e.facing,
      elevation: e.elevation || 0,
      isDead: e.state === 'dead',
      freezeTimer: Math.round((e.freezeTimer || 0) * 10) / 10,
      isCharging: Boolean(e.isCharging)
    }));
  }

  applyEnemiesState(remoteList) {
    if (!Array.isArray(remoteList)) return;
    const enemyMap = new Map();
    for (const e of this.enemies) {
      enemyMap.set(e.id, e);
    }

    for (const remote of remoteList) {
      const local = enemyMap.get(remote.id);
      if (local) {
        if (remote.isDead && local.state !== 'dead') {
          local.state = 'dead';
          local.hp = 0;
          local.die(this.game?.combat);
        } else if (!remote.isDead) {
          // Smooth interpolation der Position
          local.x += (remote.x - local.x) * 0.45;
          local.y += (remote.y - local.y) * 0.45;
          local.hp = remote.hp;
          local.maxHp = remote.maxHp || local.maxHp;
          local.state = remote.state;
          local.facing = remote.facing || local.facing;
          local.elevation = remote.elevation ?? local.elevation;
          local.freezeTimer = remote.freezeTimer || 0;
          local.isCharging = Boolean(remote.isCharging);
          local.animTime = remote.animTime || local.animTime;
        }
      }
    }
  }

  handleRemoteDamage(msg) {
    if (!msg || !msg.enemyId) return;
    const enemy = this.enemies.find(e => e.id === msg.enemyId);
    if (enemy && enemy.state !== 'dead') {
      enemy.takeDamage(msg.damage, msg.angle || 0, msg.knockback || 0, this.game?.combat, msg.isRange);
    }
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
      ghosts: [],
      aiming: false,
      aimAngle: 0,
      hitEnemies: new Set()
    };

    this.melee = {
      comboStep: 0,       // 0 = idle, 1 = slash1, 2 = slash2, 3 = thrust
      comboTimer: 0,      // buffer window for next combo attack
      recoveryTimer: 0,   // pause after thrust (schnitt schnitt stich PAUSE)
      charging: false,
      chargeTimer: 0,
      autoCombo: false,   // continuous combo chain while attack is held
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
      chargeTimer: 0,
      aiming: false,
      aimAngle: 0,
      autoFireTimer: 0,
      isAimedShot: false,
      isHolding: false
    };

    // Decoupled Aiming & Movement State
    this.aimAngle = 0;
    this.aimDirection = 'right';
    this.isAiming = false;
    this.moveVector = { x: 0, y: 0 };
    this.moveAngle = 0;

    // Dimensions-Transitionen (Trampolin, Wolkenfall, Höhleneinstieg)
    this.transition = null; // { type, timer, duration, targetDim, targetX, targetY, switched }
    this.transitionCooldown = 0;
    this.lastTransitionTile = null; // Verhindert Re-Triggering solange man auf dem Zielfeld steht
    this.discoveredShrines = new Set();
    this.shrineMessage = null;
    this.artifact = null; // Active magical artifact { id, name, charges, maxCharges, cooldownTimer, ... }
    this.isBearForm = false;
    this.bearFormTimer = 0;
    this.bearFormMaxTimer = 60;
    this.teleportSequence = null; // 3-Phasen Teleport-Animation { phase, timer, targetX, targetY, vortexAngle }
  }

  respawn() {
    this.revertBearForm();
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

    if (this.game && this.game.network && this.game.network.connected) {
      this.game.network.sendRespawn(this.x, this.y);
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
      this.skillPoints = (this.skillPoints || 0) + 2;
      leveledUp = true;
    }

    if (leveledUp) {
      this.levelUpFlameTimer = 2.4;
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText(`🎉 LEVEL UP! Lv. ${this.level} (+2 Skillpunkte)`, this.x, this.y - 28, '#facc15', 1.1);
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

  startTeleportSequence(targetX, targetY) {
    if (this.isDead) return;
    // Sicherstellen, dass das Ziel wie beim Wolkensturz niemals auf Wasser, Bäumen oder unpassierbaren Kacheln liegt
    const safePos = (this.map && typeof this.findSafeLandingPosition === 'function')
      ? this.findSafeLandingPosition(this.map, targetX, targetY)
      : { x: targetX, y: targetY };

    this.teleportSequence = {
      phase: 'sink', // 'sink' | 'blackout' | 'emerge'
      timer: 0,
      targetX: safePos.x,
      targetY: safePos.y,
      originX: this.x,
      originY: this.y,
      vortexAngle: 0
    };
    this.invulnTimer = 1.2;
    this.isMoving = false;
    this.currentSpeed = 0;

    if (this.game && this.game.network && this.game.network.connected) {
      this.game.network.sendAction('teleport', {
        originX: this.x,
        originY: this.y,
        targetX: safePos.x,
        targetY: safePos.y
      });
    }
  }

  getTeleportBlackoutAlpha() {
    if (!this.teleportSequence) return 0;
    if (this.teleportSequence.phase === 'blackout') return 1.0;
    if (this.teleportSequence.phase === 'sink' && this.teleportSequence.timer > 0.22) {
      return Math.min(1.0, (this.teleportSequence.timer - 0.22) / 0.13);
    }
    if (this.teleportSequence.phase === 'emerge' && this.teleportSequence.timer < 0.15) {
      return Math.max(0.0, 1.0 - (this.teleportSequence.timer / 0.15));
    }
    return 0;
  }

  renderVoidVortexHole(ctx, x, y, progress, angle = 0) {
    const radius = 22 * Math.max(0.1, progress);
    ctx.save();
    // Dunkles Leeren-Zentrum
    ctx.fillStyle = '#0f051d';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, radius, radius * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    // Violetter Strudel-Rand
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.4;
    ctx.shadowColor = 'rgba(192, 132, 252, 0.85)';
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.ellipse(x, y + 4, radius, radius * 0.52, 0, angle, angle + Math.PI * 1.6);
    ctx.stroke();

    // Rosa Innenwirbel
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y + 4, radius * 0.6, radius * 0.32, 0, -angle * 1.5, -angle * 1.5 + Math.PI * 1.3);
    ctx.stroke();

    ctx.restore();
  }

  hasActiveArtifact() {
    return !!(this.artifact && this.artifact.charges > 0);
  }

  equipArtifact(artifactDef) {
    this.artifact = {
      id: artifactDef.id,
      name: artifactDef.name,
      title: artifactDef.title,
      icon: artifactDef.icon,
      charges: artifactDef.maxCharges,
      maxCharges: artifactDef.maxCharges,
      cooldownTimer: 0,
      cooldownMax: artifactDef.cooldown,
      damage: artifactDef.damage,
      widthTiles: artifactDef.widthTiles,
      speed: artifactDef.speed
    };
  }

  rechargeArtifact(amount = 3) {
    if (this.artifact) {
      this.artifact.charges = Math.min(this.artifact.maxCharges + 5, this.artifact.charges + amount);
    }
  }

  activateBearForm(duration = 60) {
    this.isBearForm = true;
    this.bearFormTimer = duration;
    this.bearFormMaxTimer = duration;

    // 50% mehr Leben während Bärengestalt
    const hpPerPoint = PVP_CONFIG.HP_PER_SKILL_POINT ?? 15;
    const baseHp = PVP_CONFIG.PLAYER_BASE_HP ?? 100;
    const bearMult = PVP_CONFIG.BEAR_HP_MULTIPLIER ?? 1.5;
    const baseMax = baseHp + (this.skills?.hp || 0) * hpPerPoint;
    const targetMax = Math.round(baseMax * bearMult);
    const hpRatio = this.hp / Math.max(1, this.maxHp);
    this.maxHp = targetMax;
    this.hp = Math.round(targetMax * Math.max(0.3, hpRatio));

    if (this.game && this.game.combat) {
      this.game.combat.addFloatingText('🐻 BÄRENGESTALT! (60s)', this.x, this.y - 28, '#22c55e', 1.4);
      for (let i = 0; i < 28; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = Math.random() * 75 + 25;
        this.game.combat.hitSparks.push({
          x: this.x,
          y: this.y - 12,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 20,
          color: Math.random() > 0.4 ? '#22c55e' : '#86efac',
          size: Math.random() * 3.5 + 1.8,
          life: 0.6,
          maxLife: 0.6
        });
      }
    }
  }

  revertBearForm() {
    if (!this.isBearForm) return;
    this.isBearForm = false;
    this.bearFormTimer = 0;

    const hpPerPoint = PVP_CONFIG.HP_PER_SKILL_POINT ?? 15;
    const baseHp = PVP_CONFIG.PLAYER_BASE_HP ?? 100;
    const baseMax = baseHp + (this.skills?.hp || 0) * hpPerPoint;
    const hpRatio = this.hp / Math.max(1, this.maxHp);
    this.maxHp = baseMax;
    this.hp = Math.max(1, Math.min(this.maxHp, Math.round(baseMax * hpRatio)));

    if (this.game && this.game.combat) {
      this.game.combat.addFloatingText('🍃 Gestalt gelöst', this.x, this.y - 24, '#a3e635', 1.0);
      for (let i = 0; i < 18; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = Math.random() * 45 + 15;
        this.game.combat.hitSparks.push({
          x: this.x,
          y: this.y - 10,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 15,
          color: '#4ade80',
          size: Math.random() * 2.5 + 1.2,
          life: 0.45,
          maxLife: 0.45
        });
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
      const hpPerPoint = PVP_CONFIG.HP_PER_SKILL_POINT ?? 15;
      const baseHp = PVP_CONFIG.PLAYER_BASE_HP ?? 100;
      const bearMult = PVP_CONFIG.BEAR_HP_MULTIPLIER ?? 1.5;
      const baseMax = baseHp + this.skills.hp * hpPerPoint;
      const newMax = this.isBearForm ? Math.round(baseMax * bearMult) : baseMax;
      const gain = this.isBearForm ? Math.round(hpPerPoint * bearMult) : hpPerPoint;
      this.maxHp = newMax;
      this.hp = Math.min(this.maxHp, this.hp + gain);
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText(`❤️ +${gain} Max HP!`, this.x, this.y - 24, '#4ade80', 1.1);
        this.game.combat.addHitSparks(this.x, this.y - 10, '#4ade80', 14);
      }
    } else if (attribute === 'melee') {
      const dmgBonus = PVP_CONFIG.MELEE_DMG_PER_SKILL ?? 4;
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText(`⚔️ +${dmgBonus} Nahkampf-Schaden!`, this.x, this.y - 24, '#f59e0b', 1.1);
        this.game.combat.addHitSparks(this.x, this.y - 10, '#f59e0b', 14);
      }
    } else if (attribute === 'range') {
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('🏹 Pfeil-Speed & Reichweite +!', this.x, this.y - 24, '#38bdf8', 1.1);
        this.game.combat.addHitSparks(this.x, this.y - 10, '#38bdf8', 14);
      }
    } else if (attribute === 'shield') {
      const baseMax = PVP_CONFIG.SHIELD_MAX_ENERGY ?? 100;
      const shieldBonus = PVP_CONFIG.SHIELD_PER_SKILL_POINT ?? 15;
      this.shield.maxEnergy = baseMax + this.skills.shield * shieldBonus;
      this.shield.energy = Math.min(this.shield.maxEnergy, this.shield.energy + shieldBonus);
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText(`🛡️ +${shieldBonus} Schild-Energie!`, this.x, this.y - 24, '#06b6d4', 1.1);
        this.game.combat.addHitSparks(this.x, this.y - 10, '#06b6d4', 14);
      }
    }

    return true;
  }

  // ==========================================================================
  // DIRECTION & VECTOR HELPERS (8-Directional Support)
  // ==========================================================================

  setAimAngle(angle) {
    if (typeof angle !== 'number' || isNaN(angle)) return;
    this.aimAngle = angle;
    this.isAiming = true;
    const step = Math.PI / 4;
    const offset = Math.PI / 8;
    let a = angle;
    if (a < 0) a += Math.PI * 2;
    const index = Math.floor((a + offset) / step) % 8;
    const dirs = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
    this.aimDirection = dirs[index];
    this.direction = this.aimDirection;
  }

  resetAim() {
    this.isAiming = false;
  }

  getFacingAngle() {
    if (this.isAiming && typeof this.aimAngle === 'number') {
      return this.aimAngle;
    }
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
    const a = this.getFacingAngle();
    return { x: Math.cos(a), y: Math.sin(a) };
  }

  getMoveVector() {
    if (this.moveVector && (this.moveVector.x !== 0 || this.moveVector.y !== 0)) {
      const len = Math.hypot(this.moveVector.x, this.moveVector.y);
      return { x: this.moveVector.x / len, y: this.moveVector.y / len };
    }
    return this.getFacingVector();
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
      this.moveVector = { x: dx, y: dy };
      if (dx !== 0 || dy !== 0) {
        this.moveAngle = Math.atan2(dy, dx);
        if (!this.isAiming) {
          this.setDirectionFromVector(dx, dy);
          this.aimAngle = this.moveAngle;
          this.aimDirection = this.direction;
        }
      }
    }
  }

  // ==========================================================================
  // COMBAT ACTIONS (Zelda & Smash Bros Mechanics)
  // ==========================================================================

  triggerDash(targetAngle = null) {
    if (this.dash.cooldown > 0 || this.dash.active || this.shield.active || this.shield.stunTimer > 0 || this.isDead || this.transition) {
      return;
    }

    this.syncDirectionFromInput();

    let dirX = 0;
    let dirY = 0;

    if (typeof targetAngle === 'number' && !isNaN(targetAngle)) {
      dirX = Math.cos(targetAngle);
      dirY = Math.sin(targetAngle);
      this.setAimAngle(targetAngle);
    } else {
      const moveVec = this.getMoveVector();
      dirX = moveVec.x;
      dirY = moveVec.y;
    }

    const speed = COMBAT_CONFIG.DASH_SPEED;
    this.dash.active = true;
    this.dash.timer = COMBAT_CONFIG.DASH_DURATION;
    this.dash.cooldown = COMBAT_CONFIG.DASH_COOLDOWN;
    this.dash.vx = dirX * speed;
    this.dash.vy = dirY * speed;
    this.dash.hitEnemies = new Set();

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

    if (this.game && this.game.network && this.game.network.connected) {
      this.game.network.sendAction('dash', {
        x: this.x,
        y: this.y,
        angle: Math.atan2(dirY, dirX),
        isBear: Boolean(this.isBearForm)
      });
    }
  }

  startMelee(targetAngle = null) {
    if (this.shield.active || this.shield.stunTimer > 0 || this.isDead || this.transition) return;
    if (this.melee.recoveryTimer > 0) return; // Pause nach Stich einhalten!
    if (typeof targetAngle === 'number') {
      this.setAimAngle(targetAngle);
    }
    this.melee.autoCombo = true;
    this.melee.charging = true;
    this.melee.chargeTimer = 0;

    if (this.melee.comboStep === 0) {
      this.executeComboStep(targetAngle);
    }
  }

  releaseMelee() {
    this.melee.autoCombo = false;
    this.melee.charging = false;
    this.melee.chargeTimer = 0;
  }

  executeSpinAttack() {
    const isBear = Boolean(this.isBearForm);
    this.melee.isSpinning = true;
    this.melee.spinTimer = 0.32 * (isBear ? 1.2 : 1.0);
    this.melee.swingProgress = 0;
    this.melee.swingType = 'spin';
    this.melee.comboStep = 0;
    this.melee.comboTimer = 0;
    this.melee.recoveryTimer = 0;

    const radius = COMBAT_CONFIG.SPIN_RADIUS;
    const slashType = isBear ? 'bear_spin' : 'spin';
    if (this.game && this.game.combat) {
      this.game.combat.addSlashEffect(slashType, this.x, this.y - 6, 0, radius);
      this.game.combat.checkMeleeHits({
        type: slashType,
        x: this.x,
        y: this.y - 6,
        radius,
        damageMultiplier: isBear ? 2.0 : 1.0,
        knockbackMultiplier: isBear ? 1.5 : 1.0,
        knockback: COMBAT_CONFIG.SPIN_KNOCKBACK * (isBear ? 1.5 : 1.0)
      });
    }

    if (this.game && this.game.network && this.game.network.connected) {
      this.game.network.sendAction('melee', {
        subType: slashType,
        angle: 0,
        radius,
        isBear
      });
    }
  }

  executeComboStep(targetAngle = null) {
    if (typeof targetAngle === 'number' && !isNaN(targetAngle)) {
      this.setAimAngle(targetAngle);
    }
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
    const isBear = Boolean(this.isBearForm);
    const speedFactor = isBear ? 1.2 : 1.0;

    if (nextStep === 1) {
      this.melee.swingType = 'slash1';
      this.melee.comboTimer = COMBAT_CONFIG.COMBO_WINDOW * speedFactor;
      this.melee.recoveryTimer = 0;
      const radius = COMBAT_CONFIG.COMBO_SLASH_RADIUS * (isBear ? 0.8 : 1.0);
      const slashType = isBear ? 'bear_claw1' : 'slash1';
      const kb = isBear ? 75 * 1.5 : 75;
      if (this.game && this.game.combat) {
        this.game.combat.addSlashEffect(slashType, this.x, this.y - 6, angle, radius);
        this.game.combat.checkMeleeHits({
          type: slashType,
          x: this.x,
          y: this.y - 6,
          angle,
          radius,
          damageMultiplier: isBear ? 2.0 : 1.0,
          knockbackMultiplier: isBear ? 1.5 : 1.0,
          knockback: kb
        });
      }
    } else if (nextStep === 2) {
      this.melee.swingType = 'slash2';
      this.melee.comboTimer = COMBAT_CONFIG.COMBO_WINDOW * speedFactor;
      this.melee.recoveryTimer = 0;
      const radius = (COMBAT_CONFIG.COMBO_SLASH_RADIUS + 2) * (isBear ? 0.8 : 1.0);
      const slashType = isBear ? 'bear_claw2' : 'slash2';
      const kb = isBear ? 95 * 1.5 : 95;
      if (this.game && this.game.combat) {
        this.game.combat.addSlashEffect(slashType, this.x, this.y - 6, angle, radius);
        this.game.combat.checkMeleeHits({
          type: slashType,
          x: this.x,
          y: this.y - 6,
          angle,
          radius,
          damageMultiplier: isBear ? 2.0 : 1.0,
          knockbackMultiplier: isBear ? 1.5 : 1.0,
          knockback: kb
        });
      }
    } else if (nextStep === 3) {
      // Kräftiger Stich / Beast Lunge mit Vorstoß, Wucht & anschließender Pause
      this.melee.swingType = 'thrust';
      this.melee.comboTimer = 0; // Kombo-Kette endet mit dem Stich
      this.melee.recoveryTimer = COMBAT_CONFIG.COMBO_RECOVERY_PAUSE * speedFactor; // Pause nach Stich
      const range = COMBAT_CONFIG.COMBO_THRUST_RANGE * (isBear ? 1.2 : 1.0);

      // Vorwärts-Lunge (kräftiger Ausfallschritt nach vorne)
      const lungeDist = COMBAT_CONFIG.COMBO_THRUST_LUNGE * (isBear ? 1.2 : 1.0);
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
          color: isBear ? 'rgba(74, 222, 128, 0.75)' : 'rgba(254, 240, 138, 0.75)',
          life: 0.28,
          maxLife: 0.28
        });
      }

      const slashType = isBear ? 'bear_thrust' : 'thrust';
      if (this.game && this.game.combat) {
        this.game.combat.addSlashEffect(slashType, this.x, this.y - 6, angle, range);
        this.game.combat.checkMeleeHits({
          type: slashType,
          x: this.x,
          y: this.y - 6,
          angle,
          range,
          damageMultiplier: isBear ? 2.0 : 1.0,
          knockbackMultiplier: isBear ? 1.5 : 1.0,
          width: COMBAT_CONFIG.COMBO_THRUST_WIDTH * (isBear ? 1.2 : 1.0),
          knockback: COMBAT_CONFIG.COMBO_THRUST_KNOCKBACK * (isBear ? 1.5 : 1.0)
        });
      }
    }

    if (this.game && this.game.network && this.game.network.connected) {
      const effectRadius = (nextStep === 3) ? COMBAT_CONFIG.COMBO_THRUST_RANGE * (isBear ? 1.2 : 1.0) : COMBAT_CONFIG.COMBO_SLASH_RADIUS * (isBear ? 0.8 : 1.0);
      this.game.network.sendAction('melee', {
        subType: slashType,
        angle,
        direction: this.direction,
        radius: effectRadius,
        isBear
      });
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

    if (this.game && this.game.network && this.game.network.connected && wasActive !== this.shield.active) {
      this.game.network.sendAction('shield', {
        active: this.shield.active
      });
    }
  }

  fireSingleArrow(isCharged = false) {
    if (this.isBearForm || this.isDead || this.transition || this.shield.active) return;
    if (this.ranged.ammo <= 0) {
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('Keine Pfeile! (0/30) 🏹', this.x, this.y - 22, '#ef4444', 0.65);
      }
      return;
    }

    this.ranged.ammo--;
    const vec = this.getFacingVector();
    const dirX = vec.x;
    const dirY = vec.y;

    if (this.game && this.game.combat) {
      this.game.combat.fireArrow(this.x, this.y - 6, dirX, dirY, isCharged);
    }

    if (this.game && this.game.network && this.game.network.connected) {
      this.game.network.sendAction('arrow', {
        x: this.x,
        y: this.y - 6,
        dirX,
        dirY,
        isCharged: Boolean(isCharged)
      });
    }
  }

  startRanged(targetAngle = null) {
    if (this.isBearForm) {
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('🐾 Ein Bär kann keinen Bogen nutzen!', this.x, this.y - 22, '#4ade80', 0.85);
      }
      return;
    }
    if (this.shield.active || this.shield.stunTimer > 0 || this.isDead || this.transition) return;
    if (this.ranged.ammo <= 0) {
      if (this.game && this.game.combat) {
        this.game.combat.addFloatingText('Keine Pfeile! (0/30) 🏹', this.x, this.y - 22, '#ef4444', 0.65);
      }
      return;
    }

    if (typeof targetAngle === 'number' && !isNaN(targetAngle)) {
      this.setAimAngle(targetAngle);
    }

    this.ranged.isHolding = true;
    this.ranged.isAimedShot = false;
    this.ranged.charging = false;
    this.ranged.aiming = true;
    this.ranged.chargeTimer = 0;
    const fireRate = COMBAT_CONFIG.ARROW_FIRE_RATE || 0.5;
    this.ranged.autoFireTimer = fireRate;

    // First shot fires immediately upon pressing
    this.fireSingleArrow(false);
  }

  setRangedAimedShot(isAimed, angle = null) {
    if (typeof angle === 'number' && !isNaN(angle)) {
      this.setAimAngle(angle);
    }
    const fireRate = COMBAT_CONFIG.ARROW_FIRE_RATE || 0.5;
    if (isAimed) {
      this.ranged.isAimedShot = true;
      this.ranged.charging = true;
      this.ranged.aiming = true;
      this.ranged.autoFireTimer = 999; // Stop auto-fire while charging aimed shot
    } else if (isAimed === false) {
      this.ranged.isAimedShot = false;
      this.ranged.charging = false;
      if (this.ranged.autoFireTimer > fireRate) {
        this.ranged.autoFireTimer = fireRate;
      }
    }
  }

  releaseRanged(targetAngle = null, forceAimed = null) {
    if (!this.ranged.isHolding && !this.ranged.aiming && !this.ranged.charging) return;
    if (typeof targetAngle === 'number' && !isNaN(targetAngle)) {
      this.setAimAngle(targetAngle);
    }

    // Guarantee that if the shot was charged / aimed (line visible), it ALWAYS shoots the aimed shot!
    const wasAimed = (forceAimed === true) || Boolean(this.ranged.isAimedShot) || Boolean(this.ranged.charging);

    this.ranged.isHolding = false;
    this.ranged.isAimedShot = false;
    this.ranged.charging = false;
    this.ranged.aiming = false;
    this.ranged.chargeTimer = 0;
    this.ranged.autoFireTimer = 0;

    // If an Aimed Shot was charged (outer zone pulled), release the 1.5x damage charged shot!
    if (wasAimed) {
      this.fireSingleArrow(true);
    }
  }

  cancelRanged() {
    this.ranged.isHolding = false;
    this.ranged.isAimedShot = false;
    this.ranged.charging = false;
    this.ranged.aiming = false;
    this.ranged.chargeTimer = 0;
    this.ranged.autoFireTimer = 0;
  }

  setDashAim(active, angle = null) {
    this.dash.aiming = Boolean(active);
    if (typeof angle === 'number' && !isNaN(angle)) {
      this.dash.aimAngle = angle;
      this.setAimAngle(angle);
    }
  }

  update(dt, input) {
    this.updateParticles(dt);

    // 3-Phasen Teleport-Animation (Sink -> Blackout -> Emerge)
    if (this.teleportSequence) {
      this.teleportSequence.timer += dt;
      this.teleportSequence.vortexAngle = (this.teleportSequence.vortexAngle || 0) + dt * 10;

      if (this.teleportSequence.phase === 'sink') {
        if (this.teleportSequence.timer >= 0.35) {
          this.teleportSequence.phase = 'blackout';
          this.teleportSequence.timer = 0;
          // Sichere Landung garantieren (kein Wasser, kein Abgrund, keine Bäume)
          const safe = (this.map && typeof this.findSafeLandingPosition === 'function')
            ? this.findSafeLandingPosition(this.map, this.teleportSequence.targetX, this.teleportSequence.targetY)
            : { x: this.teleportSequence.targetX, y: this.teleportSequence.targetY };
          this.x = safe.x;
          this.y = safe.y;
          const targetTileX = Math.floor(this.x / TILE_SIZE);
          const targetTileY = Math.floor(this.y / TILE_SIZE);
          this.elevation = this.map ? this.map.getElevation(targetTileX, targetTileY) : 0;
          this.visualElevation = this.elevation;
          if (this.game && this.game.camera) {
            this.game.camera.follow(this.x, this.y);
          }
        }
      } else if (this.teleportSequence.phase === 'blackout') {
        if (this.teleportSequence.timer >= 0.22) {
          this.teleportSequence.phase = 'emerge';
          this.teleportSequence.timer = 0;
          if (this.game && this.game.camera) {
            this.game.camera.follow(this.x, this.y);
          }
        }
      } else if (this.teleportSequence.phase === 'emerge') {
        if (this.teleportSequence.timer >= 0.40) {
          this.teleportSequence = null;
          this.invulnTimer = 0.3;
          if (this.game && this.game.combat) {
            this.game.combat.addFloatingText('🌀 TELEPORTIERT!', this.x, this.y - 24, '#c084fc', 1.2);
            this.game.combat.addHitSparks(this.x, this.y, '#c084fc', 20);
          }
        }
      }
      return;
    }

    // Druid Bear Form Duration Countdown & Green Forest Aura Emitters
    if (this.isBearForm) {
      this.bearFormTimer -= dt;
      if (Math.random() < 0.3) {
        this.particles.push({
          x: this.x + (Math.random() - 0.5) * 22,
          y: this.y + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 16,
          vy: -(Math.random() * 22 + 8),
          size: Math.random() * 2.5 + 1.2,
          color: Math.random() > 0.4 ? '#22c55e' : '#86efac',
          life: 0.45,
          maxLife: 0.45
        });
      }
      if (this.bearFormTimer <= 0) {
        this.revertBearForm();
      }
    }

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
      // Dash (Space on PC - mobile touch dash handled via handleTouchButton for drag-to-aim)
      if (input.keys && input.keys['Space']) {
        const targetAngle = (input.keys['ShiftLeft'] || input.keys['ShiftRight']) ? this.getFacingAngle() : null;
        this.triggerDash(targetAngle);
      }

      // Melee (Button B on Mobile/Touch, KeyJ or Left Click on PC)
      const meleeDown = Boolean((input.keys && input.keys['KeyJ']) || input.mouseLeft || (input.buttons && input.buttons['B']));
      if (meleeDown && !this.melee.charging && this.melee.recoveryTimer <= 0) {
        this.startMelee();
      } else if (!meleeDown && this.melee.charging) {
        this.releaseMelee();
      }

      // Shield (Button Y on Mobile/Touch, KeyK or Right Click on PC)
      const shieldDown = Boolean((input.keys && input.keys['KeyK']) || input.mouseRight || (input.buttons && input.buttons['Y']));
      this.setShield(shieldDown);

      // Ranged (KeyL or KeyF on PC - mobile touch bow handled via handleTouchButton)
      const pcRanged = Boolean(input.keys && (input.keys['KeyL'] || input.keys['KeyF']));
      const isShift = Boolean(input.keys && (input.keys['ShiftLeft'] || input.keys['ShiftRight']));
      if (pcRanged && !this.ranged.isHolding) {
        this.ranged.pcTriggered = true;
        this.startRanged();
        if (isShift) {
          this.setRangedAimedShot(true);
        }
      } else if (pcRanged && this.ranged.isHolding) {
        if (isShift !== this.ranged.isAimedShot) {
          this.setRangedAimedShot(isShift);
        }
      } else if (!pcRanged && this.ranged.isHolding && this.ranged.pcTriggered) {
        this.ranged.pcTriggered = false;
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

      // Check dash impact (knockback on enemies with 0 damage)
      if (this.game && this.game.combat) {
        this.game.combat.checkDashImpact(this);
      }

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

      // Ghost trail
      if (Math.random() < 0.6) {
        this.dash.ghosts.push({
          x: this.x,
          y: this.y,
          elevY: Math.round(this.visualElevation * ELEVATION_PIXEL_OFFSET),
          direction: this.direction,
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
      const baseSwingSpeed = (this.melee.swingType === 'thrust') ? 2.8 : 5.0;
      const swingSpeed = baseSwingSpeed * (this.isBearForm ? 0.8 : 1.0);
      this.melee.swingProgress += dt * swingSpeed;
    }

    // Auto-combo progression while holding attack
    if (this.melee.autoCombo && !this.melee.isSpinning && !this.shield.active && !this.isDead && !this.transition) {
      if (this.melee.recoveryTimer <= 0) {
        if (this.melee.comboStep === 0) {
          this.executeComboStep(this.isAiming ? this.aimAngle : null);
        } else if ((this.melee.comboStep === 1 || this.melee.comboStep === 2) && this.melee.swingProgress >= 0.78) {
          this.executeComboStep(this.isAiming ? this.aimAngle : null);
        }
      }
    }

    // 4. Ranged auto-fire & charge timer
    if (this.ranged.isHolding && !this.ranged.isAimedShot && !this.isDead && !this.transition && !this.shield.active) {
      this.ranged.autoFireTimer -= dt;
      if (this.ranged.autoFireTimer <= 0) {
        this.ranged.autoFireTimer = COMBAT_CONFIG.ARROW_FIRE_RATE || 0.5;
        this.fireSingleArrow(false);
      }
    }

    if (this.ranged.charging) {
      this.ranged.chargeTimer += dt;
      if (Math.random() < 0.45) {
        this.particles.push({
          x: this.x + (Math.random() - 0.5) * 14,
          y: this.y - 12 + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 20,
          vy: -Math.random() * 25 - 5,
          size: Math.random() * 2.2 + 1.2,
          color: '#38bdf8',
          life: 0.25,
          maxLife: 0.25
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
        this.elevation = newElev;
        if (dx !== 0) {
          const hopX = this.x + Math.sign(dx) * 8;
          if (!this.checkCollision(hopX, this.y)) {
            this.x = hopX;
          }
        }
        if (dy !== 0) {
          const hopY = this.y + Math.sign(dy) * 8;
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

    // Check deadly abyss & water drowning
    const curTileX = Math.floor(this.x / TILE_SIZE);
    const curTileY = Math.floor(this.y / TILE_SIZE);

    // Sobald sich der Spieler vom Lande-Kachel wegbewegt, wird der Schutz aufgehoben
    if (this.lastTransitionTile && (this.lastTransitionTile.x !== curTileX || this.lastTransitionTile.y !== curTileY)) {
      this.lastTransitionTile = null;
    }

    const currentGround = this.map.getGroundTile ? this.map.getGroundTile(curTileX, curTileY) : 0;
    const isWater = (currentGround === TILES.WATER || currentGround === TILES.SWAMP_WATER || currentGround === TILES.CAVE_WATER);
    const isBridge = (currentGround === TILES.BRIDGE_H || currentGround === TILES.BRIDGE_V || currentGround === TILES.RAINBOW_BRIDGE_H || currentGround === TILES.RAINBOW_BRIDGE_V);

    if (!isBridge && !this.transition && !this.teleportSequence) {
      if (this.map.isDeadly(curTileX, curTileY)) {
        this.die('void');
      } else if (isWater) {
        if (this.game && this.game.combat) {
          this.game.combat.addFloatingText('🌊 ERTRUNKEN!', this.x, this.y - 28, '#0ea5e9', 1.5);
          for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const sp = Math.random() * 50 + 20;
            this.game.combat.hitSparks.push({
              x: this.x,
              y: this.y,
              vx: Math.cos(angle) * sp,
              vy: Math.sin(angle) * sp - 15,
              color: '#38bdf8',
              size: Math.random() * 3.5 + 1.5,
              life: 0.6,
              maxLife: 0.6
            });
          }
        }
        this.die('drown');
      }
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
            this.lastOverworldCaveEntrance = { x: entrance.x, y: entrance.y, targetCave: entrance.targetCave };
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
            let targetX = exit.targetX * TILE_SIZE + 8;
            let targetY = exit.targetY * TILE_SIZE + 8;
            if (tType === 'cave_exit' && this.lastOverworldCaveEntrance && this.lastOverworldCaveEntrance.targetCave === this.map.id) {
              targetX = this.lastOverworldCaveEntrance.x * TILE_SIZE + 8;
              targetY = (this.lastOverworldCaveEntrance.y + 1) * TILE_SIZE + 8;
            }
            this.startTransition(tType, exit.targetDim, targetX, targetY, 0.65);
          }
        }
      }
    }
  }

  findSafeLandingPosition(map, startX, startY) {
    if (!map) return { x: startX, y: startY };

    if (map.findSafeLandingFloor) {
      const sf = map.findSafeLandingFloor(Math.floor(startX / TILE_SIZE), Math.floor(startY / TILE_SIZE));
      if (sf && typeof sf.x === 'number' && typeof sf.y === 'number') {
        return { x: sf.x * TILE_SIZE + 8, y: sf.y * TILE_SIZE + 8 };
      }
    }

    const isSafe = (x, y) => {
      const tx = Math.floor(x / TILE_SIZE);
      const ty = Math.floor(y / TILE_SIZE);
      if (tx < 2 || tx >= map.width - 2 || ty < 2 || ty >= map.height - 2) return false;
      if (map.isDeadly && map.isDeadly(tx, ty)) return false;

      const g = map.getGroundTile(tx, ty);
      if (g === TILES.WATER || g === TILES.SWAMP_WATER || g === TILES.VOID_LAKE ||
          g === TILES.QUICKSAND || g === TILES.SKY_ABYSS || g === TILES.CAVE_WATER) {
        return false;
      }
      if (map.getSpeedModifier && map.getSpeedModifier(tx, ty) <= 0.05) return false;

      if (map.isSolid && map.isSolid(tx, ty)) return false;
      if (typeof map.isTileWalkable === 'function' && !map.isTileWalkable(tx, ty)) return false;
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

    for (let r = 1; r <= 25; r++) {
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
    } else if (type === 'cave_enter') {
      const targetMap = (this.game && this.game.caves) ? this.game.caves[targetDim] : null;
      if (targetMap && targetMap.findSafeLandingFloor) {
        const safeFloor = targetMap.findSafeLandingFloor(Math.floor(targetX / TILE_SIZE), Math.floor(targetY / TILE_SIZE));
        destX = safeFloor.x * TILE_SIZE + 8;
        destY = safeFloor.y * TILE_SIZE + 8;
      }
    } else if (type === 'cave_exit' && targetDim === 'overworld') {
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
      if (this.game && this.game.network && this.game.network.connected) {
        this.game.network.sendAction('shield_block', { x: this.x, y: this.y - 6 });
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

  takePvPDamage(amount, kbX = 0, kbY = 0, attackerId = null) {
    if (this.isDead) return 'dead';

    // 1. Dash-I-Frames
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
      if (this.game && this.game.network && this.game.network.connected) {
        this.game.network.sendAction('shield_block', { x: this.x, y: this.y - 6 });
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

    // 3. Voller PvP-Treffer
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.3;
    this.invulnTimer = 0.35;

    // Knockback
    if (kbX !== 0 || kbY !== 0) {
      if (!this.checkCollision(this.x + kbX, this.y)) this.x += kbX;
      if (!this.checkCollision(this.x, this.y + kbY)) this.y += kbY;
    }

    if (this.game && this.game.combat) {
      this.game.combat.addHitSparks(this.x, this.y - 8, '#ef4444', 16);
      this.game.combat.addFloatingText(`-${Math.round(amount)} HP`, this.x, this.y - 22, '#ef4444');
    }

    if (this.game && this.game.camera) {
      this.game.camera.shake(6, 0.22);
    }

    if (this.hp <= 0) {
      this.die('pvp');
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

    // 3. Even Skill Reduction matching new level (2 skill points per level)
    const targetTotalPoints = Math.max(0, (this.level - 1) * 2);
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
    if (moveDx !== 0 && moveDy !== 0) {
      // Diagonale Bewegung: vorderer Eckpunkt und Kantenpunkte beider Achsen
      const sx = Math.sign(moveDx);
      const sy = Math.sign(moveDy);
      checkPoints = [
        { x: targetX + sx * r, y: targetY + sy * r },
        { x: targetX + sx * r, y: targetY },
        { x: targetX, y: targetY + sy * r }
      ];
    } else if (moveDx > 0) {
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

      // Kantenkollision prüfen: Nur wenn Zielkachel HÖHER liegt als die aktuelle Spieler-Ebene!
      // Wenn targetElev <= this.elevation, steigt man herab oder bleibt gleich -> niemals blockieren
      const targetElev = this.map.getElevation ? this.map.getElevation(tx, ty) : 0;
      if (targetElev > this.elevation) {
        if (!this.map.isElevationPassable(curTileX, curTileY, tx, ty)) {
          return true;
        }
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

    if (this.teleportSequence) {
      const { phase, timer, vortexAngle } = this.teleportSequence;
      if (phase === 'sink') {
        const prog = Math.min(1.0, timer / 0.35);
        this.renderVoidVortexHole(ctx, px, Math.round(this.y) - elevY, Math.min(1.0, prog * 1.5), vortexAngle);
        transScale = Math.max(0.05, 1.0 - prog * 0.95);
        transOffset = -prog * 12;
        transAlpha = Math.max(0.0, 1.0 - prog);
      } else if (phase === 'blackout') {
        transAlpha = 0.0;
        return;
      } else if (phase === 'emerge') {
        const prog = Math.min(1.0, timer / 0.40);
        this.renderVoidVortexHole(ctx, px, Math.round(this.y) - elevY, Math.max(0.1, 1.0 - prog * 0.75), vortexAngle);
        transScale = Math.min(1.0, 0.2 + prog * 0.8);
        transOffset = Math.sin(prog * Math.PI) * 18;
        transAlpha = Math.min(1.0, prog * 2.0);
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

    // 2. Folded Papercraft Hero Skin (15 selectable Dark Ghibli skins) OR Druid Bear Form
    if (this.isBearForm) {
      this.renderBearForm(ctx, px, py, animTime, this.direction, this.isMoving, this.hitFlash);
    } else {
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
    }

    // 2b. Level-Up Green Flame Aura (Front Layer)
    if (this.levelUpFlameTimer > 0) {
      const flameAlpha = Math.min(1.0, this.levelUpFlameTimer / 0.45);
      this.renderGreenFlameAura(ctx, px, py, animTime, flameAlpha, false);
    }

    // 3. Handheld Paper Lantern on Bamboo Pole (Held during Dusk & Night AND always Underground in Caves)
    const isUnderground = (this.game && this.game.currentDimension === 'caves') ||
      (this.map && this.map.biome && typeof this.map.biome === 'string' && (this.map.biome.includes('Tiefenhöhlen') || this.map.biome.includes('Grotte') || this.map.biome.includes('Höhle')));
    const showLantern = ((nightFactor > 0.1) || isUnderground) && !this.isBearForm;
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

    // 4a. Sword & Melee Attack Rendering (Suppressed in Bear Form)
    // Dynamic swing animations (Slash 1 -> Slash 2 -> Thrust) take precedence so combo is visible while holding!
    if (!this.isBearForm && this.melee.swingProgress < 1.0 && this.melee.swingType) {
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
    if (!this.isBearForm && this.melee.isSpinning) {
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

    // 4b. Bow & Arrow Aiming (Pulled blue & glowing for Aimed Shot)
    if (!this.isBearForm && (this.ranged.charging || this.ranged.isHolding || this.ranged.aiming)) {
      const bowAngle = this.getFacingAngle();
      const isAimed = Boolean(this.ranged.isAimedShot);

      ctx.save();
      ctx.translate(px, py - 10 + bob);
      ctx.rotate(bowAngle);

      if (isAimed) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
      }

      // Curved Bamboo Bow (turns radiant blue when Aimed Shot is active!)
      ctx.strokeStyle = isAimed ? '#38bdf8' : '#a16207';
      ctx.lineWidth = isAimed ? 2.4 : 1.8;
      ctx.beginPath();
      ctx.arc(8, 0, 10, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();

      // Pulled Bowstring
      ctx.strokeStyle = isAimed ? '#e0f2fe' : '#f8fafc';
      ctx.lineWidth = isAimed ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(8 + Math.cos(-Math.PI * 0.35) * 10, Math.sin(-Math.PI * 0.35) * 10);
      ctx.lineTo(isAimed ? 0 : 2, 0);
      ctx.lineTo(8 + Math.cos(Math.PI * 0.35) * 10, Math.sin(Math.PI * 0.35) * 10);
      ctx.stroke();

      // Nocked Paper Arrow
      ctx.strokeStyle = isAimed ? '#38bdf8' : '#cbd5e1';
      ctx.lineWidth = isAimed ? 2.2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(isAimed ? 0 : 2, 0);
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

    // 6. Name und HP unter dem Charakter (erst Name, dann HP nur wenn nicht voll)
    const baseUnderY = py + 9;

    // Nameplate unter dem Charakter (Dark Ghibli Papercraft)
    if (this.name && !this.isDead) {
      ctx.save();
      ctx.font = 'bold 8.5px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const nameY = baseUnderY;
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

    // Lebensbalken direkt unter dem Namen (nur wenn verletzt)
    if (this.hp < this.maxHp && this.hp > 0 && !this.isDead) {
      const barW = 24;
      const barH = 3.5;
      const barX = px - barW / 2;
      const barY = baseUnderY + 8;
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

    // Aiming Trajectory Previews (Dash & Bow)
    this.renderAimPreviews(ctx, px, py, animTime);

    ctx.restore();
  }

  renderAimPreviews(ctx, px, py, animTime) {
    if (this.isDead || this.transition) return;

    // 1. Dash Trajectory Preview (glowing emerald arrow)
    if (this.dash && this.dash.aiming) {
      const angle = this.dash.aimAngle;
      const startX = px;
      const startY = py - 6;
      const dashDist = 80;
      const endX = startX + Math.cos(angle) * dashDist;
      const endY = startY + Math.sin(angle) * dashDist;

      ctx.save();
      // Translucent landing indicator shadow
      ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
      ctx.beginPath();
      ctx.ellipse(endX, endY + 6, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing destination landing ring
      const ringPulse = 1.0 + Math.sin(animTime * 8) * 0.18;
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(endX, endY + 6, 9 * ringPulse, 4.5 * ringPulse, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Glowing dashed trajectory line
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.85)';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -animTime * 28;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated forward chevron indicators along dash path
      const chevrons = 3;
      for (let c = 1; c <= chevrons; c++) {
        const frac = ((animTime * 1.8 + c / chevrons) % 1.0);
        const cx = startX + Math.cos(angle) * (frac * dashDist);
        const cy = startY + Math.sin(angle) * (frac * dashDist);
        const perpX = -Math.sin(angle) * 4.5;
        const perpY = Math.cos(angle) * 4.5;
        const tipX = Math.cos(angle) * 3.5;
        const tipY = Math.sin(angle) * 3.5;

        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.sin(frac * Math.PI) * 0.9})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx - perpX - tipX, cy - perpY - tipY);
        ctx.lineTo(cx + tipX, cy + tipY);
        ctx.lineTo(cx + perpX - tipX, cy + perpY - tipY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Bow Aim Trajectory Preview (sky-blue dashed line with reticle)
    if (this.ranged && (this.ranged.aiming || (this.ranged.charging && this.isAiming) || this.ranged.isAimedShot)) {
      const angle = this.getFacingAngle();
      const startX = px;
      const startY = py - 8;
      const isCharged = Boolean(this.ranged.isAimedShot);
      const baseRange = isCharged ? COMBAT_CONFIG.ARROW_CHARGED_RANGE : COMBAT_CONFIG.ARROW_RANGE;
      const range = baseRange + (this.skills?.range || 0) * 35;
      const endX = startX + Math.cos(angle) * range;
      const endY = startY + Math.sin(angle) * range;

      ctx.save();
      if (isCharged) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
      }

      // Outer faint aim guide
      ctx.strokeStyle = isCharged ? 'rgba(56, 189, 248, 0.6)' : 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = isCharged ? 4.2 : 3.2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Inner crisp dashed trajectory
      ctx.strokeStyle = isCharged ? '#ffffff' : '#38bdf8';
      ctx.lineWidth = isCharged ? 2.4 : 1.6;
      ctx.setLineDash(isCharged ? [10, 4] : [6, 5]);
      ctx.lineDashOffset = -animTime * (isCharged ? 55 : 35);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Crosshair Reticle at end of range
      ctx.strokeStyle = isCharged ? '#38bdf8' : '#ffffff';
      ctx.lineWidth = isCharged ? 2.2 : 1.6;
      ctx.beginPath();
      ctx.arc(endX, endY, isCharged ? 7.5 : 5.5, 0, Math.PI * 2);
      ctx.stroke();

      if (isCharged) {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(endX, endY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.moveTo(endX - (isCharged ? 11 : 8), endY);
      ctx.lineTo(endX + (isCharged ? 11 : 8), endY);
      ctx.moveTo(endX, endY - (isCharged ? 11 : 8));
      ctx.lineTo(endX, endY + (isCharged ? 11 : 8));
      ctx.stroke();

      ctx.restore();
    }
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

  renderBearForm(ctx, px, py, animTime, direction, isMoving, hitFlash) {
    const vec = this.getFacingVector();
    const dx = vec.x;
    const dy = vec.y;
    const waddle = isMoving ? Math.sin(animTime * 9) * 2 : Math.sin(animTime * 2.5) * 0.5;
    const footStep = isMoving ? Math.cos(animTime * 9) * 2.5 : 0;

    const drawBox = (x, y, w, h, rad) => {
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, rad);
      } else {
        ctx.rect(x, y, w, h);
      }
    };

    ctx.save();

    // 1. Bear Paper Drop Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.ellipse(px + 1, py + 2, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Druidic Nature Aura Ring (Forest Emerald Glow)
    const auraPulse = 1.0 + Math.sin(animTime * 4) * 0.12;
    if (typeof ctx.createRadialGradient === 'function') {
      const auraGrad = ctx.createRadialGradient(px, py - 8, 4, px, py - 8, 22 * auraPulse);
      auraGrad.addColorStop(0, 'rgba(34, 197, 94, 0.35)');
      auraGrad.addColorStop(0.7, 'rgba(22, 163, 74, 0.15)');
      auraGrad.addColorStop(1, 'rgba(22, 101, 52, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(px, py - 8, 22 * auraPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Back Paws (Hind Feet)
    const hindY = py - 2;
    ctx.fillStyle = '#2e1507';
    // Left hind paw
    ctx.beginPath();
    ctx.ellipse(px - 7, hindY - footStep * 0.5, 4.2, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Right hind paw
    ctx.beginPath();
    ctx.ellipse(px + 7, hindY + footStep * 0.5, 4.2, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Massive Bear Torso (Chunky Layered Papercraft Fold)
    const bodyY = py - 13 + waddle;
    // Darker back/shoulder shadow layer
    ctx.fillStyle = '#3d1d0a';
    ctx.beginPath();
    drawBox(px - 11, bodyY - 11, 22, 20, 7);
    ctx.fill();

    // Main fur body
    ctx.fillStyle = '#552a10';
    ctx.beginPath();
    drawBox(px - 10, bodyY - 10, 20, 18, 6);
    ctx.fill();

    // Papercraft Crease lines on fur
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px - 7, bodyY - 9);
    ctx.lineTo(px, bodyY + 6);
    ctx.lineTo(px + 7, bodyY - 9);
    ctx.stroke();

    // Shoulder moss flakes
    ctx.fillStyle = '#15803d';
    ctx.fillRect(px - 9, bodyY - 8, 3, 2);
    ctx.fillRect(px + 6, bodyY - 8, 3, 2);

    // 5. Pale Honey Parchment Chest Crest with Druid Runes
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.moveTo(px, bodyY - 7);
    ctx.lineTo(px + 6 + dx * 1.5, bodyY + 4 + dy);
    ctx.lineTo(px, bodyY + 7 + dy);
    ctx.lineTo(px - 6 + dx * 1.5, bodyY + 4 + dy);
    ctx.closePath();
    ctx.fill();

    // Glowing Emerald Druid Spiral / Mark on Chest
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(px + dx * 1.2, bodyY + dy * 0.8, 2.8, 0, Math.PI * 1.6);
    ctx.stroke();

    // 6. Bear Head & Snout
    const headX = px + dx * 3;
    const headY = bodyY - 9 + dy * 2;

    // Round Paper Ears
    // Left ear
    ctx.fillStyle = '#3d1d0a';
    ctx.beginPath();
    ctx.arc(headX - 6.5, headY - 5, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e5a882'; // Inner ear fold
    ctx.beginPath();
    ctx.arc(headX - 6.5, headY - 5, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Right ear
    ctx.fillStyle = '#3d1d0a';
    ctx.beginPath();
    ctx.arc(headX + 6.5, headY - 5, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e5a882';
    ctx.beginPath();
    ctx.arc(headX + 6.5, headY - 5, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Main Head Fold
    ctx.fillStyle = '#5c3012';
    ctx.beginPath();
    ctx.ellipse(headX, headY, 8.5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Folded Snout / Muzzle
    const snoutX = headX + dx * 2.5;
    const snoutY = headY + 2 + dy * 1.5;
    ctx.fillStyle = '#783c18';
    ctx.beginPath();
    ctx.ellipse(snoutX, snoutY, 4.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black Button Nose with tiny highlight
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(snoutX + dx * 0.8, snoutY - 1 + dy * 0.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(snoutX + dx * 0.8 - 0.6, snoutY - 1.6 + dy * 0.5, 0.9, 0.9);

    // Glowing Fierce Emerald Eyes
    if (direction !== 'up') {
      const eyeY = headY - 1.5 + dy * 0.5;
      const eyeSpacing = 3.8;
      // Left eye
      if (!direction.includes('right')) {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(headX - eyeSpacing + dx * 0.8 - 1, eyeY, 2.2, 2.2);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(headX - eyeSpacing + dx * 0.8 - 0.4, eyeY + 0.4, 1.1, 1.1);
      }
      // Right eye
      if (!direction.includes('left')) {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(headX + eyeSpacing + dx * 0.8 - 1, eyeY, 2.2, 2.2);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(headX + eyeSpacing + dx * 0.8 - 0.4, eyeY + 0.4, 1.1, 1.1);
      }
    }

    // 7. Massive Front Paws with Emerald-Tipped Bone Claws
    const pawRaise = (this.melee.charging || this.melee.swingProgress < 0.6) ? -4 : 0;
    const lPawX = px - 9 + (dx < 0 ? -2 : 0);
    const lPawY = bodyY + 5 + footStep + pawRaise;
    const rPawX = px + 9 + (dx > 0 ? 2 : 0);
    const rPawY = bodyY + 5 - footStep + pawRaise;

    const drawPawWithClaws = (pawX, pawY, isLeft) => {
      ctx.fillStyle = '#3d1d0a';
      ctx.beginPath();
      ctx.ellipse(pawX, pawY, 4.6, 3.8, isLeft ? -0.15 : 0.15, 0, Math.PI * 2);
      ctx.fill();

      const clawAngle = Math.atan2(dy || 1, dx || (isLeft ? -0.4 : 0.4));
      for (let c = -1; c <= 1; c++) {
        const ca = clawAngle + c * 0.35;
        const cx = pawX + Math.cos(ca) * 3.5;
        const cy = pawY + Math.sin(ca) * 3.5;
        const tipX = pawX + Math.cos(ca) * 6.5;
        const tipY = pawY + Math.sin(ca) * 6.5;

        // Bone white claw base
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Emerald glowing claw tip
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(tipX - 0.7, tipY - 0.7, 1.4, 1.4);
      }
    };

    drawPawWithClaws(lPawX, lPawY, true);
    drawPawWithClaws(rPawX, rPawY, false);

    // Hit Flash Tint
    if (hitFlash > 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.55)';
      ctx.beginPath();
      drawBox(px - 12, bodyY - 15, 24, 26, 7);
      ctx.fill();
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
    this.dimension = 'overworld';

    this.scaleX = this.canvas.width / (this.map ? this.map.width : MAP_WIDTH);
    this.scaleY = this.canvas.height / (this.map ? this.map.height : MAP_HEIGHT);

    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = this.canvas.width;
    this.bgCanvas.height = this.canvas.height;
    this.bgCtx = this.bgCanvas.getContext('2d');
    this.bgCtx.imageSmoothingEnabled = false;

    // Fog of War Canvases & Explored Grids (persistent pro Dimension)
    this.fogCanvases = {};
    this.exploredGrids = {};

    this.renderStaticBackground();
  }

  getFogCanvasKey() {
    if (this.dimension === 'caves') {
      return `caves_${this.map.id || 'main'}`;
    }
    return this.dimension || 'overworld';
  }

  getFogCanvas() {
    const key = this.getFogCanvasKey();
    if (!this.fogCanvases[key]) {
      const fc = document.createElement('canvas');
      fc.width = this.canvas.width;
      fc.height = this.canvas.height;
      const fctx = fc.getContext('2d');
      fctx.fillStyle = '#06070d';
      fctx.fillRect(0, 0, fc.width, fc.height);
      this.fogCanvases[key] = { canvas: fc, ctx: fctx };
    }
    return this.fogCanvases[key];
  }

  resetFog() {
    this.fogCanvases = {};
    this.exploredGrids = {};
  }

  revealFog(playerX, playerY) {
    const fog = this.getFogCanvas();
    const fctx = fog.ctx;

    const mx = (playerX / TILE_SIZE) * this.scaleX;
    const my = (playerY / TILE_SIZE) * this.scaleY;
    const radius = Math.max(10, 20 * this.scaleX); // ~20 Kacheln Sichtradius

    fctx.save();
    fctx.globalCompositeOperation = 'destination-out';

    const grad = fctx.createRadialGradient(mx, my, radius * 0.65, mx, my, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    fctx.fillStyle = grad;
    fctx.beginPath();
    fctx.arc(mx, my, radius, 0, Math.PI * 2);
    fctx.fill();

    fctx.restore();

    // Track explored tiles in Uint8Array for Teleport validation & discovery checks
    const key = this.getFogCanvasKey();
    if (this.map) {
      if (!this.exploredGrids[key]) {
        this.exploredGrids[key] = new Uint8Array(this.map.width * this.map.height);
      }
      const grid = this.exploredGrids[key];
      const centerTx = Math.floor(playerX / TILE_SIZE);
      const centerTy = Math.floor(playerY / TILE_SIZE);
      const rTiles = 20;
      const r2 = rTiles * rTiles;
      for (let dy = -rTiles; dy <= rTiles; dy++) {
        const ty = centerTy + dy;
        if (ty < 0 || ty >= this.map.height) continue;
        for (let dx = -rTiles; dx <= rTiles; dx++) {
          const tx = centerTx + dx;
          if (tx < 0 || tx >= this.map.width) continue;
          if (dx * dx + dy * dy <= r2) {
            grid[ty * this.map.width + tx] = 1;
          }
        }
      }
    }
  }

  isTileExplored(tx, ty, dimensionKey = null) {
    const key = dimensionKey || this.getFogCanvasKey();
    const grid = this.exploredGrids[key];
    if (!grid) return false;
    if (!this.map || tx < 0 || tx >= this.map.width || ty < 0 || ty >= this.map.height) return false;
    return grid[ty * this.map.width + tx] === 1;
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
    // Header & Legende wurden für minimalistisches Design entfernt
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

        // Shrine indicator (Golden Pagoda Diamond 5x5)
        if (this.map.objects && this.map.objects[y] && this.map.objects[y][x] === 15) {
          const sx = Math.floor(x * this.scaleX) + 1;
          const sy = Math.floor(y * this.scaleY) + 1;
          this.bgCtx.fillStyle = '#b45309'; // Amber outline
          this.bgCtx.beginPath();
          this.bgCtx.moveTo(sx, sy - 3.5);
          this.bgCtx.lineTo(sx + 3.5, sy);
          this.bgCtx.lineTo(sx, sy + 3.5);
          this.bgCtx.lineTo(sx - 3.5, sy);
          this.bgCtx.closePath();
          this.bgCtx.fill();

          this.bgCtx.fillStyle = '#facc15'; // Bright Gold
          this.bgCtx.beginPath();
          this.bgCtx.moveTo(sx, sy - 2.5);
          this.bgCtx.lineTo(sx + 2.5, sy);
          this.bgCtx.lineTo(sx, sy + 2.5);
          this.bgCtx.lineTo(sx - 2.5, sy);
          this.bgCtx.closePath();
          this.bgCtx.fill();

          this.bgCtx.fillStyle = '#fef08a'; // Radiant core
          this.bgCtx.fillRect(sx - 0.5, sy - 0.5, 1.5, 1.5);
        }

        // Trampoline indicator (Bright Bouncy Magenta/Pink Disc 3x3)
        if (this.map.objects && this.map.objects[y] && this.map.objects[y][x] === 14) {
          const tx = Math.floor(x * this.scaleX);
          const ty = Math.floor(y * this.scaleY);
          this.bgCtx.fillStyle = '#be185d'; // Dark magenta border
          this.bgCtx.beginPath();
          this.bgCtx.arc(tx + 1, ty + 1, 3.2, 0, Math.PI * 2);
          this.bgCtx.fill();

          this.bgCtx.fillStyle = '#f472b6'; // Vibrant pink canvas
          this.bgCtx.beginPath();
          this.bgCtx.arc(tx + 1, ty + 1, 2.2, 0, Math.PI * 2);
          this.bgCtx.fill();

          this.bgCtx.fillStyle = '#ffffff'; // White highlight dot
          this.bgCtx.fillRect(tx + 0.5, ty + 0.5, 1, 1);
        }

        // Cave Entrance indicator (Dark Abyss Pit with Cyan Glowing Ring)
        if (this.map.objects && this.map.objects[y] && this.map.objects[y][x] === 16) {
          const cx = Math.floor(x * this.scaleX);
          const cy = Math.floor(y * this.scaleY);
          this.bgCtx.fillStyle = '#0284c7'; // Deep cyan outer ring
          this.bgCtx.beginPath();
          this.bgCtx.arc(cx + 1, cy + 1, 3.5, 0, Math.PI * 2);
          this.bgCtx.fill();

          this.bgCtx.fillStyle = '#38bdf8'; // Bright cyan glow
          this.bgCtx.beginPath();
          this.bgCtx.arc(cx + 1, cy + 1, 2.5, 0, Math.PI * 2);
          this.bgCtx.fill();

          this.bgCtx.fillStyle = '#020617'; // Pitch dark cave chasm
          this.bgCtx.beginPath();
          this.bgCtx.arc(cx + 1, cy + 1, 1.5, 0, Math.PI * 2);
          this.bgCtx.fill();
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

  render(player, camera, remotePlayers = null) {
    // 0. Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Reveal Fog around player
    if (player && !player.isDead) {
      this.revealFog(player.x, player.y);
    }

    // 2. Pre-rendered terrain
    this.ctx.drawImage(this.bgCanvas, 0, 0);

    // 3. Fog of War Overlay (nur bereits erforschte Gebiete sind sichtbar!)
    const fog = this.getFogCanvas();
    if (fog && fog.canvas) {
      this.ctx.drawImage(fog.canvas, 0, 0);
    }

    // 4. Camera Viewport Box
    if (camera) {
      const viewW = (camera.viewportWidth / camera.zoom) / TILE_SIZE * this.scaleX;
      const viewH = (camera.viewportHeight / camera.zoom) / TILE_SIZE * this.scaleY;
      const viewX = (camera.x / TILE_SIZE) * this.scaleX;
      const viewY = (camera.y / TILE_SIZE) * this.scaleY;

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(viewX, viewY, viewW, viewH);
    }

    // 5. Remote Players (Andere Spieler auf der Minimap)
    if (remotePlayers) {
      const playersList = (remotePlayers instanceof Map) ? remotePlayers.values() : (Array.isArray(remotePlayers) ? remotePlayers : []);
      for (const rp of playersList) {
        if (!rp || rp.isDead) continue;
        if (rp.dimension && rp.dimension !== this.dimension) continue;

        const rx = (rp.x / TILE_SIZE) * this.scaleX;
        const ry = (rp.y / TILE_SIZE) * this.scaleY;

        // Leuchtender Cyan-Punkt mit Goldring
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.beginPath();
        this.ctx.arc(rx, ry, 3.2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.arc(rx, ry, 4.4, 0, Math.PI * 2);
        this.ctx.stroke();

        if (rp.name) {
          this.ctx.font = 'bold 8px system-ui, sans-serif';
          this.ctx.fillStyle = '#f8fafc';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(rp.name, rx, ry - 6);
        }
      }
    }

    // 6. Local Player Marker (Grüner Punkt mit weißer Umrandung)
    if (player && !player.isDead) {
      const pX = (player.x / TILE_SIZE) * this.scaleX;
      const pY = (player.y / TILE_SIZE) * this.scaleY;

      this.ctx.fillStyle = '#22c55e';
      this.ctx.beginPath();
      this.ctx.arc(pX, pY, 3.5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.4;
      this.ctx.beginPath();
      this.ctx.arc(pX, pY, 4.8, 0, Math.PI * 2);
      this.ctx.stroke();

      if (player.name) {
        this.ctx.font = 'bold 8px system-ui, sans-serif';
        this.ctx.fillStyle = '#4ade80';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(player.name, pX, pY - 6);
      }
    }
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

    const activeTouches = new Map(); // touchId -> state
    let mouseState = null;

    const startButtonInteraction = (action, btn, clientX, clientY) => {
      const rect = btn.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;

      btn.classList.add('active');
      this.input.buttons[action] = true;

      const state = {
        btn,
        action,
        originX,
        originY,
        startTime: performance.now(),
        circleStartTime: performance.now(),
        isDragging: false,
        dragDistance: 0,
        dragAngle: 0,
        prevAngle: null,
        cumulativeAngle: 0,
        spinFired: false,
        isAimed: false,
        isCancelled: false
      };

      if (this.onButtonPress) {
        this.onButtonPress(action, true, { initial: true });
      }

      return state;
    };

    const processButtonMove = (state, clientX, clientY) => {
      if (!state) return;
      const dx = clientX - state.originX;
      const dy = clientY - state.originY;
      const dist = Math.hypot(dx, dy);

      // Schild (Y) braucht kein Drag-to-Aim
      if (state.action === 'Y') return;

      if (dist >= 14) {
        state.isDragging = true;
        state.dragDistance = dist;
        state.dragAngle = Math.atan2(dy, dx);
        state.isCancelled = false;

        state.btn.classList.remove('cancel-zone');
        state.btn.classList.add('aiming-active');

        // Visuelle Auslenkung des Buttons (virtueller Analog-Stick-Effekt)
        const clampDist = Math.min(28, dist);
        const vx = (dx / dist) * clampDist;
        const vy = (dy / dist) * clampDist;
        state.btn.style.transform = `translate(${vx}px, ${vy}px)`;

        // Range (Button X): Zone 1 (< 54px) = normal fire | Zone 2 (>= 54px) = Aimed Shot (+20% weiter)
        if (state.action === 'X') {
          // Hysterese: Lädt ab 54px auf, bleibt aufgeladen bis der Finger fast ganz im Zentrum (< 22px) ist
          if (dist >= 54) {
            state.isAimed = true;
          } else if (dist < 22) {
            state.isAimed = false;
          }

          if (state.isAimed) {
            state.btn.classList.add('btn-aim-charged');
          } else {
            state.btn.classList.remove('btn-aim-charged');
          }
          if (this.onButtonPress) {
            this.onButtonPress('X', true, {
              drag: true,
              angle: state.dragAngle,
              dist,
              isAimed: Boolean(state.isAimed),
              isCancelled: false
            });
          }
          return;
        }

        // Kreis-Geste für Schwert (Button B: Wirbelattacke)
        // Rolling time window: kann jederzeit auch mitten im Schlagen ausgelöst werden!
        if (state.action === 'B') {
          const now = performance.now();
          if (!state.circleStartTime) state.circleStartTime = now;

          if (state.prevAngle !== null) {
            let delta = state.dragAngle - state.prevAngle;
            while (delta > Math.PI) delta -= Math.PI * 2;
            while (delta < -Math.PI) delta += Math.PI * 2;

            // Rolling window von 850ms
            if (now - state.circleStartTime > 850) {
              state.cumulativeAngle = 0;
              state.circleStartTime = now;
            }

            state.cumulativeAngle += delta;

            // Schnelle Kreisbewegung (~270° bis 360°)
            if (Math.abs(state.cumulativeAngle) >= Math.PI * 1.5) {
              state.cumulativeAngle = 0;
              state.circleStartTime = now;
              state.spinFired = true;
              state.btn.classList.add('anim-pop-glow');
              setTimeout(() => state.btn.classList.remove('anim-pop-glow'), 400);
              if (this.onButtonPress) {
                this.onButtonPress('B', true, { spin: true });
              }
            }
          }
          state.prevAngle = state.dragAngle;
        }

        if (this.onButtonPress) {
          this.onButtonPress(state.action, true, {
            drag: true,
            angle: state.dragAngle,
            dist,
            isCancelled: false
          });
        }
      } else {
        // Finger nahe Button-Zentrum: Button visuell zentrieren, KEIN versehentlicher Abbruch!
        state.btn.style.transform = 'translate(0px, 0px)';
      }
    };

    const finishButtonInteraction = (state) => {
      if (!state) return;
      state.btn.classList.remove('active', 'aiming-active', 'cancel-zone', 'btn-aim-charged');
      state.btn.style.transform = 'translate(0px, 0px)';
      this.input.buttons[state.action] = false;

      const wasDrag = state.isDragging && typeof state.dragAngle === 'number';
      const finalAngle = wasDrag ? state.dragAngle : null;

      if (this.onButtonPress) {
        this.onButtonPress(state.action, false, {
          isDrag: wasDrag,
          angle: finalAngle,
          dist: state.dragDistance,
          isAimed: Boolean(state.isAimed),
          isCancelled: false,
          spinTriggered: state.spinFired
        });
      }
    };

    buttons.forEach((btn) => {
      const action = btn.getAttribute('data-action');
      if (!btn.addEventListener) return;

      // Touch Events
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const state = startButtonInteraction(action, btn, touch.clientX, touch.clientY);
          activeTouches.set(touch.identifier, state);
        }
      }, { passive: false });

      // Mouse Events (Desktop-Testing)
      btn.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        mouseState = startButtonInteraction(action, btn, e.clientX, e.clientY);
      });
    });

    // Window-level move and release listeners so dragging outside the button works smoothly
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('touchmove', (e) => {
        if (activeTouches.size === 0) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const state = activeTouches.get(touch.identifier);
          if (state) {
            e.preventDefault();
            processButtonMove(state, touch.clientX, touch.clientY);
          }
        }
      }, { passive: false });

      const handleTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const state = activeTouches.get(touch.identifier);
          if (state) {
            finishButtonInteraction(state);
            activeTouches.delete(touch.identifier);
          }
        }
      };

      window.addEventListener('touchend', handleTouchEnd, { passive: true });
      window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

      // Desktop Mouse Fallback
      window.addEventListener('mousemove', (e) => {
        if (!mouseState) return;
        processButtonMove(mouseState, e.clientX, e.clientY);
      });

      window.addEventListener('mouseup', () => {
        if (!mouseState) return;
        finishButtonInteraction(mouseState);
        mouseState = null;
      });
    }
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


// --- js/remotePlayer.js ---

class RemotePlayer {
  constructor(data) {
    this.id = data.id;
    this.name = data.name || 'Mitspieler';
    this.skinId = data.skinId || 'ren_twilight';

    this.x = data.x || 800;
    this.y = data.y || 1600;
    this.targetX = this.x;
    this.targetY = this.y;

    this.elevation = data.elevation || 0;
    this.targetElevation = this.elevation;
    this.visualElevation = this.elevation;

    this.dimension = data.dimension || 'overworld';
    this.direction = data.direction || 'down';
    this.isMoving = Boolean(data.isMoving);
    this.isSprinting = Boolean(data.isSprinting);

    this.hp = data.hp ?? 100;
    this.maxHp = data.maxHp ?? 100;
    this.level = data.level || 1;
    this.xp = data.xp || 0;
    this.pvpKills = data.pvpKills || 0;
    this.deaths = data.deaths || 0;
    this.isDead = Boolean(data.isDead);

    this.shieldActive = Boolean(data.shieldActive);
    this.isBearForm = Boolean(data.isBearForm);

    this.hitFlash = 0;
    this.radius = 6;

    // Melee attack visual effect
    this.swingAnim = 0;
    this.swingType = null;
    this.swingAngle = 0;

    // Bow attack visual effect
    this.bowAnim = 0;
    this.bowAngle = 0;

    // Dash visual effect & ghost trails
    this.dashAnim = 0;
    this.dashAngle = 0;
    this.dashGhosts = [];

    // Shield block & spells
    this.shieldBlockTimer = 0;
    this.plasmaTimer = 0;
    this.teleportSequence = null;
  }

  updateFromNetwork(data) {
    if (typeof data.x === 'number') this.targetX = data.x;
    if (typeof data.y === 'number') this.targetY = data.y;
    if (typeof data.elevation === 'number') this.targetElevation = data.elevation;
    if (data.dimension) this.dimension = data.dimension;
    if (data.direction) this.direction = data.direction;
    if (data.skinId) this.skinId = data.skinId;

    this.isMoving = Boolean(data.isMoving);
    this.isSprinting = Boolean(data.isSprinting);

    if (typeof data.hp === 'number') {
      if (data.hp < this.hp) this.hitFlash = 0.2;
      this.hp = data.hp;
    }
    if (typeof data.maxHp === 'number') this.maxHp = data.maxHp;
    if (typeof data.level === 'number') this.level = data.level;
    if (typeof data.xp === 'number') this.xp = data.xp;
    if (typeof data.pvpKills === 'number') this.pvpKills = data.pvpKills;
    if (typeof data.deaths === 'number') this.deaths = data.deaths;
    if (typeof data.isDead === 'boolean') this.isDead = data.isDead;

    if (typeof data.shieldActive === 'boolean') this.shieldActive = data.shieldActive;
    if (typeof data.isBearForm === 'boolean') this.isBearForm = data.isBearForm;
  }

  update(dt) {
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Smooth Lerp Position (Butterweiche Interpolation bei 25 Hz Netzwerk-Updates)
    const lerpSpeed = 16.0;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;

    // Schneller Sprung bei Teleportation / großem Desync (> 200 px)
    if (Math.hypot(dx, dy) > 200) {
      this.x = this.targetX;
      this.y = this.targetY;
    } else {
      this.x += dx * Math.min(1.0, dt * lerpSpeed);
      this.y += dy * Math.min(1.0, dt * lerpSpeed);
    }

    // Smooth elevation lerp
    this.visualElevation += (this.targetElevation - this.visualElevation) * Math.min(1.0, dt * 10);
    this.elevation = this.targetElevation;

    // Swing animation decay
    if (this.swingAnim > 0) {
      this.swingAnim = Math.max(0, this.swingAnim - dt * 4.2);
    }

    // Bow animation decay
    if (this.bowAnim > 0) {
      this.bowAnim = Math.max(0, this.bowAnim - dt * 2.5);
    }

    // Dash animation decay and ghost spawning
    if (this.dashAnim > 0) {
      this.dashAnim = Math.max(0, this.dashAnim - dt);
      if (Math.random() < 0.7) {
        this.dashGhosts.push({
          x: this.x,
          y: this.y,
          direction: this.direction,
          alpha: 0.65,
          isBear: this.isBearForm
        });
      }
    }

    // Dash ghost fading
    for (let g = this.dashGhosts.length - 1; g >= 0; g--) {
      this.dashGhosts[g].alpha -= dt * 3.5;
      if (this.dashGhosts[g].alpha <= 0) {
        this.dashGhosts.splice(g, 1);
      }
    }

    // Shield block timer decay
    if (this.shieldBlockTimer > 0) {
      this.shieldBlockTimer = Math.max(0, this.shieldBlockTimer - dt);
    }

    // Plasma timer decay
    if (this.plasmaTimer > 0) {
      this.plasmaTimer = Math.max(0, this.plasmaTimer - dt);
    }

    // Teleport sequence
    if (this.teleportSequence) {
      this.teleportSequence.timer += dt;
      this.teleportSequence.vortexAngle += dt * 8;
      if (this.teleportSequence.phase === 'sink') {
        if (this.teleportSequence.timer >= 0.35) {
          this.teleportSequence.phase = 'emerge';
          this.teleportSequence.timer = 0;
          this.x = this.teleportSequence.targetX;
          this.y = this.teleportSequence.targetY;
          this.targetX = this.x;
          this.targetY = this.y;
        }
      } else if (this.teleportSequence.phase === 'emerge') {
        if (this.teleportSequence.timer >= 0.35) {
          this.teleportSequence = null;
        }
      }
    }
  }

  triggerAction(action, data = {}) {
    if (action === 'melee') {
      this.swingAnim = 1.0;
      this.swingType = data.subType || 'slash1';
      this.swingAngle = (typeof data.angle === 'number') ? data.angle : this.getFacingAngle();
      if (data.direction) this.direction = data.direction;
      if (typeof data.isBear === 'boolean') this.isBearForm = data.isBear;
    } else if (action === 'arrow') {
      this.bowAnim = 0.45;
      this.bowAngle = Math.atan2(data.dirY || 0, data.dirX || 1);
    } else if (action === 'dash') {
      this.dashAnim = 0.28;
      this.dashAngle = (typeof data.angle === 'number') ? data.angle : this.getFacingAngle();
      if (typeof data.isBear === 'boolean') this.isBearForm = data.isBear;
      this.dashGhosts.push({
        x: this.x,
        y: this.y,
        direction: this.direction,
        alpha: 0.75,
        isBear: this.isBearForm
      });
    } else if (action === 'shield') {
      this.shieldActive = Boolean(data.active);
    } else if (action === 'shield_block') {
      this.shieldBlockTimer = 0.28;
    } else if (action === 'spell_bear') {
      this.isBearForm = true;
    } else if (action === 'spell_plasma') {
      this.plasmaTimer = 2.0;
    } else if (action === 'teleport') {
      this.teleportSequence = {
        phase: 'sink',
        timer: 0,
        originX: data.originX || this.x,
        originY: data.originY || this.y,
        targetX: data.targetX,
        targetY: data.targetY,
        vortexAngle: 0
      };
    }
  }

  getFacingAngle() {
    switch (this.direction) {
      case 'up': return -Math.PI / 2;
      case 'down': return Math.PI / 2;
      case 'left': return Math.PI;
      case 'right': return 0;
      case 'up-left': return -Math.PI * 0.75;
      case 'up-right': return -Math.PI * 0.25;
      case 'down-left': return Math.PI * 0.75;
      case 'down-right': return Math.PI * 0.25;
      default: return 0;
    }
  }

  getFacingVector() {
    const angle = this.getFacingAngle();
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  render(ctx, animTime, nightFactor = 0) {
    if (this.isDead) return;

    const px = Math.round(this.x);
    const py = Math.round(this.y - this.visualElevation * ELEVATION_PIXEL_OFFSET);

    ctx.save();

    // 0. Dash Ghost Trails
    for (const ghost of this.dashGhosts) {
      ctx.save();
      ctx.globalAlpha = ghost.alpha * 0.75;
      const gx = Math.round(ghost.x);
      const gy = Math.round(ghost.y - this.visualElevation * ELEVATION_PIXEL_OFFSET);
      if (ghost.isBear) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.beginPath();
        ctx.ellipse(gx, gy - 8, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const skinDef = CHARACTERS_MAP[this.skinId] || CHARACTERS_MAP['ren_twilight'];
        if (skinDef && typeof skinDef.render === 'function') {
          skinDef.render(ctx, gx, gy, animTime, ghost.direction, true, 0);
        }
      }
      ctx.restore();
    }

    // 0b. Teleportation Void Vortex
    if (this.teleportSequence) {
      ctx.save();
      const seq = this.teleportSequence;
      const vScale = seq.phase === 'sink'
        ? Math.min(1.0, seq.timer / 0.18)
        : Math.max(0, 1.0 - seq.timer / 0.35);
      const vortexRadius = 22 * vScale;
      ctx.translate(px, py - 4);
      ctx.rotate(seq.vortexAngle);

      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, vortexRadius);
      grad.addColorStop(0, '#090514');
      grad.addColorStop(0.65, 'rgba(88, 28, 135, 0.85)');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, vortexRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.6;
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        const startA = (arm * Math.PI * 2) / 3;
        ctx.arc(0, 0, vortexRadius * 0.75, startA, startA + 1.2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 1. Weicher Papierschatten unter den Füßen
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.ellipse(px, py + 5, this.isBearForm ? 12 : 8, this.isBearForm ? 5 : 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Charakter Skin oder Druiden-Bärengestalt
    if (this.isBearForm) {
      this.renderBearForm(ctx, px, py, animTime);
    } else {
      const skinDef = CHARACTERS_MAP[this.skinId] || CHARACTERS_MAP['ren_twilight'];
      if (skinDef && typeof skinDef.render === 'function') {
        skinDef.render(ctx, px, py, animTime, this.direction, this.isMoving, this.hitFlash);
      } else {
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Schild-Blase (wenn aktiv) & Schild-Block Blitz
    if (this.shieldActive) {
      ctx.save();
      const pulse = 1.0 + Math.sin(animTime * 10) * 0.06;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(px, py - 4, (this.isBearForm ? 20 : 15) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (this.shieldBlockTimer > 0) {
      ctx.save();
      const flareRatio = 1.0 - (this.shieldBlockTimer / 0.28);
      ctx.strokeStyle = `rgba(56, 189, 248, ${1.0 - flareRatio})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px, py - 4, 14 + flareRatio * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Melee Schwung-Visual (Schwert, Stich, Spin & Bärenkrallen)
    if (this.swingAnim > 0) {
      ctx.save();
      const isSpin = this.swingType === 'spin' || this.swingType === 'bear_spin';
      const isThrust = this.swingType === 'thrust' || this.swingType === 'bear_thrust';
      const isBear = this.isBearForm || (this.swingType && this.swingType.startsWith('bear_'));
      const ang = this.swingAngle;

      if (isBear) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        if (isSpin) {
          ctx.arc(px, py - 6, 26 * (1.0 - this.swingAnim * 0.25), 0, Math.PI * 2);
        } else if (isThrust) {
          const tx = Math.cos(ang) * 26;
          const ty = Math.sin(ang) * 26;
          ctx.moveTo(px, py - 6);
          ctx.lineTo(px + tx, py - 6 + ty);
        } else {
          ctx.arc(px, py - 6, 22, ang - 0.75, ang + 0.75);
        }
        ctx.stroke();
      } else {
        ctx.strokeStyle = isSpin ? '#38bdf8' : '#f8fafc';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        if (isSpin) {
          ctx.arc(px, py - 6, 24 * (1.0 - this.swingAnim * 0.25), 0, Math.PI * 2);
        } else if (isThrust) {
          const tx = Math.cos(ang) * 24;
          const ty = Math.sin(ang) * 24;
          ctx.moveTo(px, py - 6);
          ctx.lineTo(px + tx, py - 6 + ty);
        } else {
          ctx.arc(px, py - 6, 18, ang - 0.7, ang + 0.7);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Bogen-Zielen & Abschuss-Visual
    if (this.bowAnim > 0 && !this.isBearForm) {
      ctx.save();
      ctx.translate(px, py - 6);
      ctx.rotate(this.bowAngle);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(6, 0, 7, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(6, -7);
      ctx.lineTo(2, 0);
      ctx.lineTo(6, 7);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Plasmakugeln im Orbit
    if (this.plasmaTimer > 0) {
      ctx.save();
      const orbDist = 20;
      for (let i = 0; i < 4; i++) {
        const orbAngle = animTime * 6 + (i * Math.PI) / 2;
        const ox = px + Math.cos(orbAngle) * orbDist;
        const oy = (py - 6) + Math.sin(orbAngle) * (orbDist * 0.65);

        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fdf2f8';
        ctx.beginPath();
        ctx.arc(ox, oy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. Nameplate & Level unter dem Charakter
    const baseUnderY = py + (this.isBearForm ? 12 : 9);
    if (this.name) {
      ctx.save();
      ctx.font = 'bold 8.5px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const nameY = baseUnderY;
      const text = `${this.name} (Lv.${this.level})`;
      const textMetrics = (typeof ctx.measureText === 'function') ? ctx.measureText(text) : { width: text.length * 5.2 };
      const textW = Math.max(16, textMetrics.width);
      const padX = 4;
      const badgeH = 11;

      // Dark Papercraft Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.fillRect(px - textW / 2 - padX, nameY - badgeH / 2, textW + padX * 2, badgeH);

      // Goldene Umrandung für Mitspieler
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(px - textW / 2 - padX, nameY - badgeH / 2, textW + padX * 2, badgeH);

      // Weißer Text
      ctx.fillStyle = '#f8fafc';
      if (typeof ctx.fillText === 'function') {
        ctx.fillText(text, px, nameY);
      }
      ctx.restore();
    }

    // 8. Lebensbalken direkt unter dem Namen (nur wenn verletzt)
    if (this.hp < this.maxHp && this.hp > 0) {
      const barW = 24;
      const barH = 3.5;
      const barX = px - barW / 2;
      const barY = baseUnderY + 8;
      const hpPct = Math.max(0, this.hp / this.maxHp);

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : (hpPct > 0.25 ? '#f59e0b' : '#ef4444');
      ctx.fillRect(barX, barY, barW * hpPct, barH);
      ctx.restore();
    }

    ctx.restore();
  }

  renderBearForm(ctx, px, py, animTime) {
    const vec = this.getFacingVector();
    const dx = vec.x;
    const dy = vec.y;
    const waddle = this.isMoving ? Math.sin(animTime * 9) * 2 : Math.sin(animTime * 2.5) * 0.5;
    const footStep = this.isMoving ? Math.cos(animTime * 9) * 2.5 : 0;

    const drawBox = (x, y, w, h, rad) => {
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, rad);
      } else {
        ctx.rect(x, y, w, h);
      }
    };

    ctx.save();

    // 1. Druidic Nature Aura Ring (Forest Emerald Glow)
    const auraPulse = 1.0 + Math.sin(animTime * 4) * 0.12;
    if (typeof ctx.createRadialGradient === 'function') {
      const auraGrad = ctx.createRadialGradient(px, py - 8, 4, px, py - 8, 22 * auraPulse);
      auraGrad.addColorStop(0, 'rgba(34, 197, 94, 0.35)');
      auraGrad.addColorStop(0.7, 'rgba(22, 163, 74, 0.15)');
      auraGrad.addColorStop(1, 'rgba(22, 101, 52, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(px, py - 8, 22 * auraPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Back Paws
    const hindY = py - 2;
    ctx.fillStyle = '#2e1507';
    ctx.beginPath();
    ctx.ellipse(px - 7, hindY - footStep * 0.5, 4.2, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + 7, hindY + footStep * 0.5, 4.2, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 3. Massive Bear Torso
    const bodyY = py - 13 + waddle;
    ctx.fillStyle = '#3d1d0a';
    ctx.beginPath();
    drawBox(px - 11, bodyY - 11, 22, 20, 7);
    ctx.fill();

    ctx.fillStyle = '#552a10';
    ctx.beginPath();
    drawBox(px - 10, bodyY - 10, 20, 18, 6);
    ctx.fill();

    // 4. Chest Crest
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.moveTo(px, bodyY - 7);
    ctx.lineTo(px + 6 + dx * 1.5, bodyY + 4 + dy);
    ctx.lineTo(px, bodyY + 7 + dy);
    ctx.lineTo(px - 6 + dx * 1.5, bodyY + 4 + dy);
    ctx.closePath();
    ctx.fill();

    // Emerald Spiral Mark
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(px + dx * 1.2, bodyY + dy * 0.8, 2.8, 0, Math.PI * 1.6);
    ctx.stroke();

    // 5. Head & Snout
    const headX = px + dx * 3;
    const headY = bodyY - 9 + dy * 2;

    // Ears
    ctx.fillStyle = '#3d1d0a';
    ctx.beginPath();
    ctx.arc(headX - 6.5, headY - 5, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX + 6.5, headY - 5, 3.6, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#5c3012';
    ctx.beginPath();
    ctx.ellipse(headX, headY, 8.5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    const snoutX = headX + dx * 2.5;
    const snoutY = headY + 2 + dy * 1.5;
    ctx.fillStyle = '#783c18';
    ctx.beginPath();
    ctx.ellipse(snoutX, snoutY, 4.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(snoutX + dx * 0.8, snoutY - 1 + dy * 0.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Emerald Eyes
    if (this.direction !== 'up') {
      const eyeY = headY - 1.5 + dy * 0.5;
      const eyeSpacing = 3.8;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(headX - eyeSpacing + dx * 0.8 - 1, eyeY, 2.2, 2.2);
      ctx.fillRect(headX + eyeSpacing + dx * 0.8 - 1, eyeY, 2.2, 2.2);
    }

    ctx.restore();
  }
}


// --- js/network.js ---
/**
 * NetworkManager - WebSocket Client für Ocarina of Brawls LAN-Multiplayer
 * Verwaltet Verbindung, Paket-Serialisierung, Ratenbegrenzung und Event-Dispatching.
 */

class NetworkManager {
  constructor(game) {
    this.game = game;
    this.ws = null;
    this.connected = false;
    this.clientId = null;
    this.role = 'player'; // 'host' | 'player'
    this.lanIp = '';
    this.joinUrl = '';

    this.updateInterval = 1000 / 25; // 25 Hz Tickrate für Positionsübertragung
    this.lastUpdateSent = 0;

    this.listeners = new Map();
  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
  }

  emit(type, data) {
    const list = this.listeners.get(type);
    if (list) {
      for (const cb of list) {
        try {
          cb(data);
        } catch (err) {
          console.error(`[Network Event Error] ${type}:`, err);
        }
      }
    }
  }

  connect(role = 'player', name = 'Ren', skinId = 'ren_twilight') {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }

    this.role = role;
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}`;

    console.log(`[Network] Verbinde mit WebSocket: ${wsUrl} als ${role}...`);

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (e) {
      console.error('[Network] Konnte WebSocket nicht erstellen:', e);
      return;
    }

    this.ws.onopen = () => {
      this.connected = true;
      console.log('[Network] ✅ WebSocket verbunden!');

      const spawnX = (this.game.player && this.game.player.x) || 800;
      const spawnY = (this.game.player && this.game.player.y) || 1600;
      const dim = (this.game.currentDimension) || 'overworld';

      this.send({
        type: 'join',
        role: this.role,
        name,
        skinId,
        x: spawnX,
        y: spawnY,
        dimension: dim
      });

      this.emit('connected', { role: this.role });
    };

    this.ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        return;
      }
      this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      this.connected = false;
      console.warn('[Network] ⚠️ WebSocket getrennt.');
      this.emit('disconnected', {});
    };

    this.ws.onerror = (err) => {
      console.error('[Network Error]', err);
    };
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleMessage(msg) {
    // 1. Zuerst globale interne State-Updates setzen
    switch (msg.type) {
      case 'init':
        this.clientId = msg.clientId;
        this.lanIp = msg.lanIp;
        this.joinUrl = msg.joinUrl;
        this.masterClientId = msg.masterClientId || null;
        console.log(`[Network] Initialisiert. Eigene ID: ${this.clientId}, Master: ${this.masterClientId}, LAN-URL: ${this.joinUrl}`);
        break;

      case 'master_client':
        this.masterClientId = msg.masterClientId;
        console.log(`[Network] Neuer Master-Client für Mobs: ${this.masterClientId}`);
        break;

      case 'player_killed':
        if (this.game && typeof this.game.showKillFeed === 'function') {
          this.game.showKillFeed(msg.killerName, msg.victimName);
        }
        break;
    }

    // 2. Danach Event an registrierte Listener senden (this.clientId ist nun garantiert gesetzt!)
    this.emit(msg.type, msg);
  }

  update(dt, player) {
    if (!this.connected || this.role !== 'player' || !player) return;

    const now = performance.now();
    if (now - this.lastUpdateSent >= this.updateInterval) {
      this.lastUpdateSent = now;

      this.send({
        type: 'player_update',
        x: Math.round(player.x * 10) / 10,
        y: Math.round(player.y * 10) / 10,
        elevation: player.elevation || 0,
        dimension: this.game.currentDimension || 'overworld',
        direction: player.direction || 'down',
        isMoving: Boolean(player.isMoving),
        isSprinting: Boolean(player.isSprinting),
        hp: player.hp,
        maxHp: player.maxHp,
        level: player.level || 1,
        xp: player.xp || 0,
        shieldActive: Boolean(player.shield && player.shield.active),
        isBearForm: Boolean(player.isBearForm),
        skinId: player.skinId
      });
    }
  }

  sendAction(action, extraData = {}) {
    if (!this.connected || this.role !== 'player') return;
    this.send({
      type: 'player_action',
      action,
      ...extraData
    });
  }

  sendPvPHit(targetId, damage, kbX = 0, kbY = 0) {
    if (!this.connected) return;
    this.send({
      type: 'pvp_hit',
      targetId,
      damage,
      kbX,
      kbY
    });
  }

  sendRespawn(x, y) {
    if (!this.connected) return;
    this.send({
      type: 'player_respawn',
      x,
      y
    });
  }

  sendArtifactPickup(artifactType, shrineIdx, dimension) {
    if (!this.connected) return;
    this.send({
      type: 'artifact_pickup',
      artifactType,
      shrineIdx,
      dimension
    });
  }

  sendHostSelectWorld(worldId) {
    if (!this.connected || this.role !== 'host') return;
    this.send({
      type: 'host_select_world',
      worldId
    });
  }

  sendHostEndGame() {
    if (!this.connected || this.role !== 'host') return;
    this.send({
      type: 'host_end_game'
    });
  }

  sendHostStartRound(worldId) {
    if (!this.connected || this.role !== 'host') return;
    this.send({
      type: 'host_start_round',
      worldId
    });
  }

  sendEnemiesUpdate(enemies) {
    if (!this.connected) return;
    this.send({
      type: 'enemies_update',
      enemies
    });
  }

  sendDamageEnemy(enemyId, damage, angle = 0, knockback = 0, isRange = false) {
    if (!this.connected) return;
    this.send({
      type: 'damage_enemy',
      enemyId,
      damage,
      angle,
      knockback,
      isRange
    });
  }
}


// --- js/spectator.js ---
/**
 * SpectatorManager - Spielleiter & Beobachter-Steuerung für den Host
 * Verwaltet freie Kamerafahrt, Spieler-Verfolgung, Host-HUD, QR-Code und Runden-Management.
 */


class SpectatorManager {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.followedPlayerId = null; // null = freie Kamera

    // Freie Kamera-Geschwindigkeit
    this.camX = 800;
    this.camY = 1600;
    this.panSpeed = 600; // px/s

    // UI Elemente
    this.container = document.getElementById('spectator-hud');
    this.playersListEl = document.getElementById('spectator-players-list');
    this.lanIpDisplayEl = document.getElementById('spectator-lan-ip');
    this.btnCopyLink = document.getElementById('btn-copy-join-link');
    this.qrImageEl = document.getElementById('spectator-qr-img');
    this.qrWrapperEl = document.getElementById('spectator-qr-wrapper');
    this.btnToggleQr = document.getElementById('btn-toggle-qr');
    this.btnEndGame = document.getElementById('btn-host-end-game');
    this.btnNewRound = document.getElementById('btn-host-new-round');
    this.worldSelectEl = document.getElementById('spectator-world-select');

    // Drag-to-pan State
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.camStartX = 0;
    this.camStartY = 0;

    this.initEvents();
  }

  initEvents() {
    // 1. Link kopieren
    if (this.btnCopyLink) {
      this.btnCopyLink.addEventListener('click', () => {
        const url = this.game.network ? this.game.network.joinUrl : window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(() => {
            const span = this.btnCopyLink.querySelector('span') || this.btnCopyLink;
            const prev = span.textContent;
            span.textContent = '✅ Kopiert!';
            setTimeout(() => { span.textContent = prev; }, 2000);
          }).catch(() => {
            prompt('Kopiere diesen Link für Mitspieler:', url);
          });
        } else {
          prompt('Kopiere diesen Link für Mitspieler:', url);
        }
      });
    }

    // 2. QR-Code ein-/ausklappen
    if (this.btnToggleQr && this.qrWrapperEl) {
      this.btnToggleQr.addEventListener('click', () => {
        this.qrWrapperEl.classList.toggle('hidden');
      });
    }

    // 3. Spiel beenden
    if (this.btnEndGame) {
      this.btnEndGame.addEventListener('click', () => {
        if (confirm('Möchtest du das laufende Spiel beenden und die Siegerehrung starten?')) {
          if (this.game.network) {
            this.game.network.sendHostEndGame();
          }
        }
      });
    }

    // 4. Neue Runde starten
    if (this.btnNewRound) {
      this.btnNewRound.addEventListener('click', () => {
        const selWorld = this.worldSelectEl ? parseInt(this.worldSelectEl.value, 10) : 1;
        if (this.game.network) {
          this.game.network.sendHostStartRound(selWorld);
        }
      });
    }

    // 5. Welt-Auswahl Dropdown befüllen
    if (this.worldSelectEl) {
      this.worldSelectEl.innerHTML = '';
      WORLD_PRESETS.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.id}. ${p.name} (${p.badge})`;
        this.worldSelectEl.appendChild(opt);
      });

      this.worldSelectEl.addEventListener('change', (e) => {
        const newWorldId = parseInt(e.target.value, 10);
        if (this.game.network) {
          this.game.network.sendHostSelectWorld(newWorldId);
        }
      });
    }

    // 6. Canvas Drag-to-pan für die freie Kamera
    const canvas = this.game.canvas;
    if (canvas) {
      canvas.addEventListener('mousedown', (e) => {
        if (!this.active || this.followedPlayerId) return;
        if (e.button === 0 || e.button === 1) { // Left or Middle click
          this.isDragging = true;
          this.dragStartX = e.clientX;
          this.dragStartY = e.clientY;
          this.camStartX = this.camX;
          this.camStartY = this.camY;
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.active || !this.isDragging) return;
        const zoom = (this.game.camera && this.game.camera.zoom) || 2.0;
        const dx = (e.clientX - this.dragStartX) / zoom;
        const dy = (e.clientY - this.dragStartY) / zoom;
        this.camX = this.camStartX - dx;
        this.camY = this.camStartY - dy;
      });

      window.addEventListener('mouseup', () => {
        this.isDragging = false;
      });
    }
  }

  activate() {
    this.active = true;
    if (this.container) {
      this.container.classList.remove('hidden');
    }

    // Eigene Kampf- und Touch-Elemente auf Host ausblenden
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) touchControls.style.display = 'none';

    const playerCompactHud = document.getElementById('player-compact-hud');
    if (playerCompactHud) playerCompactHud.style.display = 'none';

    const magicSlot = document.getElementById('magic-hud-slot');
    if (magicSlot) magicSlot.style.display = 'none';

    // Start-Kamera auf Spawnpunkt der Welt
    if (this.game.map && this.game.map.spawnPoint) {
      this.camX = this.game.map.spawnPoint.x * TILE_SIZE;
      this.camY = this.game.map.spawnPoint.y * TILE_SIZE;
    }

    // Host-Zoom auf Übersicht stellen
    if (this.game.camera) {
      this.game.camera.setZoom(1.85);
    }

    // Server-Info (IP & QR) abrufen
    this.fetchServerInfo();
  }

  async fetchServerInfo() {
    try {
      const res = await fetch('/api/server-info');
      if (!res.ok) return;
      const data = await res.json();

      if (this.lanIpDisplayEl) {
        this.lanIpDisplayEl.textContent = data.joinUrl;
      }
      if (this.qrImageEl && data.qrDataUrl) {
        this.qrImageEl.src = data.qrDataUrl;
      }
      if (this.worldSelectEl && data.worldId) {
        this.worldSelectEl.value = data.worldId;
      }
    } catch (e) {
      console.warn('[Spectator] Konnte Server-Info nicht laden:', e);
    }
  }

  followPlayer(playerId) {
    if (this.followedPlayerId === playerId) {
      // Toggle off -> Freie Kamera
      this.followedPlayerId = null;
      console.log('[Spectator] Kamera freigegeben (Freier Modus)');
    } else {
      this.followedPlayerId = playerId;
      console.log(`[Spectator] Verfolge Spieler: ${playerId}`);
    }
    this.updatePlayersListUI();
  }

  update(dt, input) {
    if (!this.active) return;

    if (this.followedPlayerId) {
      const target = this.game.remotePlayers.get(this.followedPlayerId);
      if (target) {
        this.camX = target.x;
        this.camY = target.y;
      } else {
        this.followedPlayerId = null; // Spieler hat verlassen
      }
    } else {
      // Freie Kamera über Tastatur (WASD oder Pfeile)
      let vx = 0;
      let vy = 0;
      if (input && input.keys) {
        if (input.keys['KeyW'] || input.keys['ArrowUp']) vy -= 1;
        if (input.keys['KeyS'] || input.keys['ArrowDown']) vy += 1;
        if (input.keys['KeyA'] || input.keys['ArrowLeft']) vx -= 1;
        if (input.keys['KeyD'] || input.keys['ArrowRight']) vx += 1;
      }

      if (vx !== 0 || vy !== 0) {
        const len = Math.hypot(vx, vy);
        const speed = this.panSpeed * (input.keys && input.keys['ShiftLeft'] ? 2.5 : 1.0);
        this.camX += (vx / len) * speed * dt;
        this.camY += (vy / len) * speed * dt;
      }
    }

    // Kamera im Spiel aktualisieren
    if (this.game.camera) {
      this.game.camera.follow(this.camX, this.camY);
      this.game.camera.update(dt);
    }

    // Spieler-Liste periodisch aktualisieren
    this.updatePlayersListUI();
  }

  updatePlayersListUI() {
    if (!this.playersListEl) return;

    const players = Array.from(this.game.remotePlayers.values());
    if (players.length === 0) {
      this.playersListEl.innerHTML = '<div class="spectator-no-players">Warte auf Mitspieler...</div>';
      return;
    }

    let html = '';
    for (const p of players) {
      const isFollowed = this.followedPlayerId === p.id;
      const hpPct = Math.round((p.hp / p.maxHp) * 100);
      const hpColor = hpPct > 50 ? '#22c55e' : (hpPct > 25 ? '#f59e0b' : '#ef4444');

      html += `
        <div class="spectator-player-card ${isFollowed ? 'following' : ''}" data-id="${p.id}">
          <div class="sp-card-left">
            <span class="sp-name">${p.name}</span>
            <span class="sp-badge">Lv.${p.level}</span>
            <span class="sp-kills">⚔️ ${p.pvpKills}</span>
          </div>
          <div class="sp-card-right">
            <div class="sp-hp-bar">
              <div class="sp-hp-fill" style="width: ${hpPct}%; background-color: ${hpColor};"></div>
            </div>
            <button class="sp-follow-btn" title="Kamera auf Spieler zentrieren">${isFollowed ? '🎥 Folgt' : '👁️ Zuschauen'}</button>
          </div>
        </div>
      `;
    }

    this.playersListEl.innerHTML = html;

    // Klick-Events auf Spielerkarten
    this.playersListEl.querySelectorAll('.spectator-player-card').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        this.followPlayer(id);
      });
    });
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
    if (type === 'spin' || type === 'bear_spin') duration = 0.32;
    if (type === 'thrust' || type === 'bear_thrust') duration = 0.32; // Longer duration for powerful lingering thrust
    if (type === 'bear_claw1' || type === 'bear_claw2') duration = 0.26;

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
    const isBear = type.startsWith('bear_');
    const sparkCount = (type === 'spin' || type === 'bear_spin') ? 24 : ((type === 'thrust' || type === 'bear_thrust') ? 22 : 12);
    for (let i = 0; i < sparkCount; i++) {
      let pAngle;
      if (type === 'spin' || type === 'bear_spin') {
        pAngle = (i / sparkCount) * Math.PI * 2;
      } else if (type === 'thrust' || type === 'bear_thrust') {
        pAngle = angle + (Math.random() - 0.5) * 0.4;
      } else {
        pAngle = angle + (Math.random() - 0.5) * 1.0;
      }

      const pSpeed = (type === 'thrust' || type === 'bear_thrust') ? (Math.random() * 150 + 60) : (Math.random() * 90 + 40);
      let color = '#ffffff';
      if (isBear) {
        color = Math.random() > 0.4 ? '#22c55e' : (Math.random() > 0.5 ? '#86efac' : '#facc15');
      } else if (type === 'spin') {
        color = '#67e8f9';
      } else if (type === 'thrust') {
        color = Math.random() > 0.4 ? '#fef08a' : '#f59e0b';
      }

      this.hitSparks.push({
        x: x + Math.cos(pAngle) * (radius * 0.5),
        y: y + Math.sin(pAngle) * (radius * 0.5),
        vx: Math.cos(pAngle) * pSpeed,
        vy: Math.sin(pAngle) * pSpeed,
        color,
        size: Math.random() * 2.8 + 1.2,
        life: 0.35,
        maxLife: 0.35
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

  checkDashImpact(player) {
    if (!player || !player.dash || !player.dash.active || player.isDead) return;

    if (!player.dash.hitEnemies) {
      player.dash.hitEnemies = new Set();
    }

    const px = player.x;
    const py = player.y - 6;
    const dashRadius = (player.radius || 8) + 12;
    const curDim = this.game?.currentDimension || 'overworld';

    // Compute normalized dash direction
    const spd = Math.hypot(player.dash.vx, player.dash.vy) || COMBAT_CONFIG.DASH_SPEED;
    const dirX = player.dash.vx / spd;
    const dirY = player.dash.vy / spd;
    const kbSpeed = 240; // Strong knockback push!

    if (this.game && this.game.enemyManager) {
      const enemies = this.game.enemyManager.getActiveEnemies ? this.game.enemyManager.getActiveEnemies() : (this.game.enemyManager.enemies || []);
      for (const enemy of enemies) {
        if (enemy.dimension !== curDim || enemy.state === 'dead' || enemy.hp <= 0) continue;
        if (player.dash.hitEnemies.has(enemy)) continue;

        const dx = enemy.x - px;
        const dy = enemy.y - py;
        const dist = Math.hypot(dx, dy);
        const threshold = dashRadius + (enemy.radius || 10);

        if (dist <= threshold) {
          player.dash.hitEnemies.add(enemy);

          // Apply strong knockback without damage
          enemy.vx = dirX * kbSpeed;
          enemy.vy = dirY * kbSpeed;
          enemy.state = 'hurt';
          enemy.stunTimer = Math.max(enemy.stunTimer || 0, 0.35);

          // Visual impact (NO HP deduction!)
          this.addHitSparks(enemy.x, enemy.y - 6, '#67e8f9', 14, 100);
          this.addFloatingText('💨 BASH!', enemy.x, enemy.y - 20, '#38bdf8', 0.65);
          if (this.game.camera) {
            this.game.camera.shake(3.5, 0.14);
          }
        }
      }
    }
  }

  checkMeleeHits(hitbox) {
    let hitAny = false;
    const isSpin = hitbox.type === 'spin' || hitbox.type === 'bear_spin';
    const isThrust = hitbox.type === 'thrust' || hitbox.type === 'bear_thrust';

    // Check collision with training dummies
    for (const dummy of this.dummies) {
      if (this.game.currentDimension !== 'overworld') continue;

      const dx = dummy.x - hitbox.x;
      const dy = dummy.y - hitbox.y;
      const dist = Math.hypot(dx, dy);

      let inRange = false;
      if (isSpin) {
        inRange = dist <= (hitbox.radius + 10);
      } else if (isThrust) {
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
        if (isSpin) {
          inRange = dist <= (hitbox.radius + enemy.radius + 4);
        } else if (isThrust) {
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
          if (hitbox.type === 'slash2' || hitbox.type === 'bear_claw2') dmg = 35;
          if (isThrust) dmg = 52;
          if (isSpin) dmg = 68;

          const meleeBonus = (this.game?.player?.skills?.melee || 0) * 4;
          dmg += meleeBonus;

          if (hitbox.damageMultiplier) {
            dmg = Math.round(dmg * hitbox.damageMultiplier);
          } else if (hitbox.damage) {
            dmg = hitbox.damage;
          }

          const angle = isSpin ? Math.atan2(enemy.y - hitbox.y, enemy.x - hitbox.x) : hitbox.angle;
          let kb = hitbox.knockback || (isThrust ? 120 : (isSpin ? 140 : 80));
          if (hitbox.knockbackMultiplier) {
            kb = Math.round(kb * hitbox.knockbackMultiplier);
          }
          enemy.takeDamage(dmg, angle, kb, this);
        }
      }
    }

    // Check collision with remote players (LAN Multiplayer PvP)
    if (this.game && this.game.remotePlayers && this.game.network && this.game.network.connected) {
      const curDim = this.game.currentDimension || 'overworld';
      for (const remotePlayer of this.game.remotePlayers.values()) {
        if (remotePlayer.id === this.game.network.clientId) continue;
        if (remotePlayer.isDead || (remotePlayer.dimension && remotePlayer.dimension !== curDim)) continue;

        const dx = remotePlayer.x - hitbox.x;
        const dy = remotePlayer.y - hitbox.y;
        const dist = Math.hypot(dx, dy);

        let inRange = false;
        if (isSpin) {
          inRange = dist <= (hitbox.radius + remotePlayer.radius + 4);
        } else if (isThrust) {
          const forwardDot = (dx * Math.cos(hitbox.angle) + dy * Math.sin(hitbox.angle));
          const sideDist = Math.abs(-dx * Math.sin(hitbox.angle) + dy * Math.cos(hitbox.angle));
          inRange = (forwardDot > 0 && forwardDot <= hitbox.range + remotePlayer.radius && sideDist <= (hitbox.width || 22) + remotePlayer.radius);
        } else {
          const forwardDot = (dx * Math.cos(hitbox.angle) + dy * Math.sin(hitbox.angle));
          const angleDiff = Math.abs(Math.atan2(dy, dx) - hitbox.angle);
          const normAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
          inRange = (dist <= hitbox.radius + remotePlayer.radius && Math.abs(normAngleDiff) <= 0.95);
        }

        if (inRange) {
          hitAny = true;
          let dmg = PVP_CONFIG.MELEE_SLASH_1_DMG ?? 25;
          if (hitbox.type === 'slash2' || hitbox.type === 'bear_claw2') dmg = PVP_CONFIG.MELEE_SLASH_2_DMG ?? 35;
          if (isThrust) dmg = PVP_CONFIG.MELEE_THRUST_DMG ?? 52;
          if (isSpin) dmg = PVP_CONFIG.MELEE_SPIN_DMG ?? 68;

          const meleeBonus = (this.game?.player?.skills?.melee || 0) * (PVP_CONFIG.MELEE_DMG_PER_SKILL ?? 4);
          dmg += meleeBonus;

          if (hitbox.damageMultiplier) {
            dmg = Math.round(dmg * hitbox.damageMultiplier);
          } else if (hitbox.damage) {
            dmg = hitbox.damage;
          }

          const angle = isSpin ? Math.atan2(dy, dx) : hitbox.angle;
          let kb = hitbox.knockback || (isThrust ? (PVP_CONFIG.MELEE_KNOCKBACK_THRUST ?? 320) : (isSpin ? (PVP_CONFIG.MELEE_KNOCKBACK_SPIN ?? 290) : (PVP_CONFIG.MELEE_KNOCKBACK_SLASH ?? 80)));
          if (hitbox.knockbackMultiplier) {
            kb = Math.round(kb * hitbox.knockbackMultiplier);
          }

          // Shield block check
          if (remotePlayer.shieldActive) {
            this.addHitSparks(remotePlayer.x, remotePlayer.y, '#38bdf8', 16, 90);
            this.addFloatingText('🛡️ GEBLOCKT!', remotePlayer.x, remotePlayer.y - 16, '#38bdf8');
            const reduction = PVP_CONFIG.SHIELD_MELEE_DAMAGE_REDUCTION ?? 0.80;
            dmg = Math.round(dmg * (1 - reduction));
          } else {
            this.addHitSparks(remotePlayer.x, remotePlayer.y, '#ef4444', 12, 70);
            this.addFloatingText(`-${dmg}`, remotePlayer.x, remotePlayer.y - 14, '#f87171');
          }

          const kbMult = PVP_CONFIG.KNOCKBACK_MULTIPLIER ?? 1.0;
          const kbX = Math.cos(angle) * (kb * 0.4 * kbMult);
          const kbY = Math.sin(angle) * (kb * 0.4 * kbMult);
          this.game.network.sendPvPHit(remotePlayer.id, dmg, kbX, kbY);
        }
      }
    }

    // Heavy thrust or spin attack camera shake impact
    if (hitAny && this.game && this.game.camera) {
      if (isThrust) {
        this.game.camera.shake(4.5, 0.18);
      } else if (isSpin) {
        this.game.camera.shake(4.0, 0.16);
      }
    }

    return hitAny;
  }

  spawnVoidTeleportVFX(x, y, isArrival = false) {
    const dim = this.game?.currentDimension || 'overworld';
    const count = isArrival ? 35 : 28;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = isArrival ? (Math.random() * 90 + 30) : -(Math.random() * 70 + 20);
      const dist = isArrival ? (Math.random() * 8) : (Math.random() * 25 + 10);
      this.hitSparks.push({
        dimension: dim,
        x: x + Math.cos(ang) * dist,
        y: (y - 8) + Math.sin(ang) * dist,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 5,
        color: Math.random() > 0.4 ? '#a855f7' : (Math.random() > 0.5 ? '#c084fc' : '#ffffff'),
        size: Math.random() * 3 + 1.5,
        life: 0.55,
        maxLife: 0.55
      });
    }
    this.createShockwave(x, y - 8, isArrival ? 32 : 24, 0, '#a855f7', false, dim);
  }

  spawnPlasmaExplosion(x, y, radius = 36, damage = 45, knockback = 90) {
    const dim = this.game?.currentDimension || 'overworld';
    this.createShockwave(x, y, radius, 0, '#ec4899', false, dim);

    if (this.game?.camera) {
      this.game.camera.shake(1.6, 0.12);
    }

    this.addFloatingText('💥 PLASMA!', x, y - 18, '#f472b6', 0.85);

    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = Math.random() * 80 + 25;
      this.hitSparks.push({
        dimension: dim,
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 10,
        color: Math.random() > 0.4 ? '#ec4899' : (Math.random() > 0.5 ? '#f472b6' : '#ffffff'),
        size: Math.random() * 2.8 + 1.2,
        life: 0.4,
        maxLife: 0.4
      });
    }

    if (this.game?.enemyManager) {
      const enemies = this.game.enemyManager.getActiveEnemies();
      for (const enemy of enemies) {
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist <= radius + (enemy.radius || 12)) {
          const angle = dist > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
          enemy.takeDamage(damage, angle, knockback, this);
        }
      }
    }

    // PvP: Treffer auf andere Mitspieler im LAN-Multiplayer
    if (this.game && this.game.remotePlayers && this.game.network && this.game.network.connected) {
      for (const remotePlayer of this.game.remotePlayers.values()) {
        if (remotePlayer.id === this.game.network.clientId) continue;
        if (remotePlayer.isDead || (remotePlayer.dimension && remotePlayer.dimension !== dim)) continue;

        const dx = remotePlayer.x - x;
        const dy = remotePlayer.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist <= radius + (remotePlayer.radius || 10)) {
          const angle = dist > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
          const kbX = Math.cos(angle) * knockback;
          const kbY = Math.sin(angle) * knockback;

          let actualDmg = damage;
          if (remotePlayer.shield && remotePlayer.shield.active && remotePlayer.shield.energy > 0) {
            actualDmg = Math.round(damage * 0.3);
            this.addHitSparks(remotePlayer.x, remotePlayer.y, '#38bdf8', 16);
            this.addFloatingText('🛡️ GEBLOCKT!', remotePlayer.x, remotePlayer.y - 20, '#38bdf8');
          } else {
            this.addHitSparks(remotePlayer.x, remotePlayer.y, '#ec4899', 18);
            this.addFloatingText(`-${actualDmg}!`, remotePlayer.x, remotePlayer.y - 20, '#f472b6');
          }

          this.game.network.sendPvPHit(remotePlayer.id, actualDmg, kbX, kbY);
        }
      }
    }

    for (const dummy of this.dummies) {
      const dx = dummy.x - x;
      const dy = dummy.y - 6 - y;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius + 12) {
        this.applyHitToDummy(dummy, {
          type: 'thrust',
          knockback,
          angle: Math.atan2(dy, dx)
        });
      }
    }
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

            const dmg = arrow.isCharged ? 33 : 22; // 1.5x damage for aimed shot
            const kb = arrow.isCharged ? 160 : 85;
            if (arrow.isCharged) {
              this.addFloatingText('🎯 AIMED SHOT!', enemy.x, enemy.y - 20, '#38bdf8', 0.65);
            }
            enemy.takeDamage(dmg, arrow.angle, kb, this, true);
            hitEnemy = true;
            break;
          }
        }
      }

      // Check collision with remote players (PvP)
      let hitRemotePlayer = false;
      if (!hitEnemy && this.game && this.game.remotePlayers && this.game.network && this.game.network.connected) {
        const curDim = this.game.currentDimension || 'overworld';
        for (const remotePlayer of this.game.remotePlayers.values()) {
          if (remotePlayer.id === this.game.network.clientId) continue;
          if (remotePlayer.isDead || (remotePlayer.dimension && remotePlayer.dimension !== curDim)) continue;

          if (Math.hypot(remotePlayer.x - arrow.x, remotePlayer.y - arrow.y) <= (remotePlayer.radius + 6)) {
            let dmg = arrow.isCharged ? (PVP_CONFIG.ARROW_CHARGED_DMG ?? 33) : (PVP_CONFIG.ARROW_NORMAL_DMG ?? 22);
            const kb = arrow.isCharged ? (PVP_CONFIG.ARROW_KNOCKBACK_CHARGED ?? 140) : (PVP_CONFIG.ARROW_KNOCKBACK_NORMAL ?? 70);

            if (remotePlayer.shieldActive) {
              this.addHitSparks(arrow.x, arrow.y, '#38bdf8', 14, 80);
              this.addFloatingText('🛡️ GEBLOCKT!', remotePlayer.x, remotePlayer.y - 18, '#38bdf8');
              const reduction = PVP_CONFIG.SHIELD_ARROW_DAMAGE_REDUCTION ?? 1.0;
              dmg = Math.round(dmg * (1 - reduction));
            } else {
              this.addHitSparks(arrow.x, arrow.y, '#ef4444', 12, 70);
              this.addFloatingText(`-${dmg}`, remotePlayer.x, remotePlayer.y - 14, '#f87171');
            }

            if (dmg > 0) {
              const kbMult = PVP_CONFIG.KNOCKBACK_MULTIPLIER ?? 1.0;
              const kbX = Math.cos(arrow.angle) * kb * 0.3 * kbMult;
              const kbY = Math.sin(arrow.angle) * kb * 0.3 * kbMult;
              this.game.network.sendPvPHit(remotePlayer.id, dmg, kbX, kbY);
            }

            hitRemotePlayer = true;
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

      if (hitDummy || hitEnemy || hitRemotePlayer || hitWall || arrow.distTraveled >= arrow.maxRange) {
        const curTile = map?.getGroundTile ? map.getGroundTile(tX, tY) : (map?.ground ? map.ground[tY]?.[tX] : 0);
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
      if (player && stuck.canCollect) {
        const pDist = Math.hypot(player.x - stuck.x, player.y - stuck.y);
        if (pDist <= COMBAT_CONFIG.ARROW_PICKUP_RADIUS) {
          if (player.ranged && player.ranged.ammo < COMBAT_CONFIG.MAX_AMMO) {
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
      else if (slash.type === 'bear_spin') {
        // 360 Degree Savage Bear Claw Cyclone & Nature Spirit Shockwave
        const curRadius = slash.radius * (0.75 + progress * 0.45);

        // Outer emerald forest vacuum ring
        ctx.lineWidth = 2.5 * alpha;
        ctx.strokeStyle = `rgba(34, 197, 94, ${alpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius * 1.25, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glowing jade blade ring
        ctx.lineWidth = 4.5 * alpha;
        ctx.strokeStyle = `rgba(74, 222, 128, ${alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(0, 0, curRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 4 swirling savage claw scratches
        for (let s = 0; s < 4; s++) {
          const startA = (s * Math.PI / 2) + progress * Math.PI * 4;
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
          ctx.lineWidth = 2.8 * alpha;
          ctx.beginPath();
          ctx.arc(0, 0, curRadius * 0.85, startA, startA + 0.85);
          ctx.stroke();

          ctx.strokeStyle = `rgba(250, 204, 21, ${alpha * 0.85})`;
          ctx.lineWidth = 2.0 * alpha;
          ctx.beginPath();
          ctx.arc(0, 0, curRadius * 0.65, -startA, -startA + 0.85);
          ctx.stroke();
        }
      }
      else if (slash.type === 'bear_thrust') {
        // Heavy twin paw gouge / beast lunge shockwave & razor claw trails
        ctx.rotate(slash.angle);
        const curLen = slash.radius * (0.7 + progress * 0.5);

        // Emerald shockwave rings
        ctx.strokeStyle = `rgba(34, 197, 94, ${alpha * 0.85})`;
        ctx.lineWidth = 3.0 * alpha;
        ctx.beginPath();
        ctx.arc(curLen * 0.5, 0, 18 * (0.6 + progress * 0.8), -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        // 4 forward razor claw puncture trails
        for (let c = -1.5; c <= 1.5; c += 1) {
          const yOff = c * 7;
          ctx.strokeStyle = `rgba(134, 239, 172, ${alpha * 0.95})`;
          ctx.lineWidth = 2.5 * alpha;
          ctx.beginPath();
          ctx.moveTo(curLen * 0.15, yOff * 0.4);
          ctx.lineTo(curLen + 10, yOff);
          ctx.stroke();

          // Star gleam at claw tips
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fillRect(curLen + 9, yOff - 1.5, 3, 3);
        }
      }
      else if (slash.type === 'bear_claw1' || slash.type === 'bear_claw2') {
        // Savage Bear Claw Swipe (Triple curved lacerations in emerald green & gold)
        ctx.rotate(slash.angle);
        const flip = slash.type === 'bear_claw2' ? -1 : 1;
        const curRadius = slash.radius * (0.8 + progress * 0.35);

        // Draw 3 distinct curved claw lacerations
        for (let c = -1; c <= 1; c++) {
          const clawOffset = c * 7.5;
          const r = curRadius - Math.abs(c) * 2.5;

          // Outer green claw trail
          ctx.strokeStyle = `rgba(34, 197, 94, ${alpha * 0.95})`;
          ctx.lineWidth = (3.5 - Math.abs(c) * 0.6) * alpha;
          ctx.beginPath();
          ctx.arc(0, clawOffset, r, -0.6 * flip, 0.6 * flip, flip < 0);
          ctx.stroke();

          // Inner white razor gleam
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.92})`;
          ctx.lineWidth = 1.4 * alpha;
          ctx.beginPath();
          ctx.arc(0, clawOffset, r, -0.45 * flip, 0.45 * flip, flip < 0);
          ctx.stroke();
        }
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

    // Multiplayer State
    this.remotePlayers = new Map();
    this.isHost = false;
    this.network = new NetworkManager(this);
    this.spectator = new SpectatorManager(this);

    this.input = {
      keys: {},
      joystick: { x: 0, y: 0, active: false },
      buttons: { A: false, B: false, X: false, Y: false },
      mouseLeft: false,
      mouseRight: false
    };

    this.touchControls = new TouchControls(this.input, (action, isDown, meta) => this.handleTouchButton(action, isDown, meta));
    this.combat = new CombatManager(this);

    // Multi-Dimension Maps & Core Systems
    this.overworldMap = new WorldMap();
    this.cloudMap = new CloudMap(this.overworldMap);
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

    // Magic & Artifact System (Phoenix Spells, Shrines & Monster Drops)
    this.magicManager = new MagicManager(this);
    this.magicManager.initShrineArtifacts(this.caves, this.cloudMap, this.overworldMap);

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
    this.isCharacterSelectOpen = Boolean(this.charSelectModal && !this.charSelectModal.classList.contains('hidden'));
    this.selectedHeroSkin = (this.player && this.player.skinId) || getSelectedSkin();
    this.charPreviewCanvases = {};

    this.lastTime = 0;
    this.animTime = 0;

    this.initEvents();
    this.initCharacterSelectModal();
    this.initWorldSelectUI();
    this.updatePlayerNameUI();
    this.initNetworkEvents();
    this.initMultiplayerUI();
    this.openCharacterSelectModal();
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
        } else if (e.code === 'Escape' && this.isCharacterSelectOpen) {
          if (typeof e.target.blur === 'function') e.target.blur();
          this.startGameWithSelectedHero();
        }
        return;
      }
      if (this.isCharacterSelectOpen) {
        if (!this.charSelectModal || this.charSelectModal.classList.contains('hidden')) {
          this.isCharacterSelectOpen = false;
        } else {
          if (e.code === 'Enter') {
            if (this.charWizardStep === 1) this.goToCharWizardStep(2);
            else if (this.charWizardStep === 2) this.goToCharWizardStep(3);
            else if (this.charWizardStep === 3) this.startGameWithSelectedHero();
          } else if (e.code === 'Escape') {
            this.startGameWithSelectedHero();
          }
          return;
        }
      }

      if (this.magicManager && this.magicManager.isSwapModalOpen) {
        if (e.code === 'Escape') {
          this.magicManager.closeSwapModal();
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
        const targetAngle = e.shiftKey ? this.player.getFacingAngle() : null;
        this.player.triggerDash(targetAngle);
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
      if (e.code === 'KeyE') {
        if (!e.repeat && this.magicManager) {
          this.magicManager.startAiming(this.player);
        }
      }
      if (e.code === 'KeyC') {
        this.toggleSkillModal();
      }
      if (e.code === 'Escape') {
        const modal = document.getElementById('skill-modal');
        if (modal && !modal.classList.contains('hidden')) {
          this.toggleSkillModal(false);
        }
        if (this.magicManager) {
          this.magicManager.cancelAiming();
          this.magicManager.toggleInfoModal(false);
          this.magicManager.closeSwapModal();
          this.magicManager.closeTeleportModal();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        return;
      }
      if (this.isCharacterSelectOpen) {
        if (!this.charSelectModal || this.charSelectModal.classList.contains('hidden')) {
          this.isCharacterSelectOpen = false;
        } else {
          return;
        }
      }

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
      if (e.code === 'KeyE') {
        if (this.magicManager) {
          this.magicManager.releaseAiming(this.player, this.map, this.combat);
        }
      }
    });

    if (this.canvas) {
      this.canvas.addEventListener('mousedown', (e) => {
        if (this.isCharacterSelectOpen) {
          if (!this.charSelectModal || this.charSelectModal.classList.contains('hidden')) {
            this.isCharacterSelectOpen = false;
          } else {
            return;
          }
        }
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

      this.canvas.addEventListener('mousemove', (e) => {
        if (!this.player || this.player.isDead) return;
        if (this.isCharacterSelectOpen && this.charSelectModal && !this.charSelectModal.classList.contains('hidden')) return;

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
        if (Math.hypot(mdx, mdy) > 14) {
          const aimAngle = Math.atan2(mdy, mdx);
          this.player.setAimAngle(aimAngle);
        }
      });

      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    if (this.timePanelEl) {
      this.timePanelEl.addEventListener('click', () => this.cycleTime());
    }

    // 1. Dev Tools Visibility & Toggle
    // Automatische Erkennung: Auf Vercel (.vercel.app) oder bei ?dev=1 Entwicklertools aktivieren!
    // Auf dem lokalen LAN-Server / IP (z.B. 192.168.x.x:3000) standardmäßig reine User-Sicht.
    const isVercel = typeof window !== 'undefined' && window.location && (
      window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('vercel.dev')
    );
    const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
    const forceDev = Boolean(urlParams && (urlParams.get('dev') === '1' || urlParams.get('dev') === 'true' || urlParams.get('mode') === 'dev'));
    const forceUser = Boolean(urlParams && (urlParams.get('dev') === '0' || urlParams.get('dev') === 'false' || urlParams.get('mode') === 'user'));
    const isDevMode = !forceUser && (isVercel || forceDev);

    if (typeof document !== 'undefined') {
      if (isDevMode) {
        document.body.classList.add('dev-mode');
        console.log('[Mode] 🛠️ Entwickler-Modus aktiv (Vercel / ?dev=1: Dev Tools eingeblendet)');
      } else {
        document.body.classList.remove('dev-mode');
        console.log('[Mode] 🎮 Spieler-Modus / User-Sicht aktiv (LAN-Server / IP: Dev Tools ausgeblendet)');
      }
    }

    const devToolsToggleBtn = document.getElementById('dev-tools-toggle');
    const hudDropdown = document.getElementById('hud');
    const isMobile = (typeof window !== 'undefined' && (
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      Math.min(window.innerWidth, window.innerHeight) <= 600
    ));

    if (hudDropdown) {
      hudDropdown.classList.add('collapsed');
      if (devToolsToggleBtn) devToolsToggleBtn.classList.remove('active');
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
        if (this.isCharacterSelectOpen) {
          this.startGameWithSelectedHero();
        }
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

    // 4. Minimalist Minimap (Hold / Press to View Large Map)
    const minimapContainer = document.getElementById('minimap-container');
    if (minimapContainer) {
      let isHoldingMap = false;

      const expandMap = (e) => {
        if (e && e.cancelable) e.preventDefault();
        isHoldingMap = true;
        minimapContainer.classList.add('expanded');
        minimapContainer.classList.add('pressing');
      };

      const collapseMap = () => {
        if (!isHoldingMap) return;
        isHoldingMap = false;
        minimapContainer.classList.remove('expanded');
        minimapContainer.classList.remove('pressing');
      };

      // Pointer, Touch & Mouse Events
      minimapContainer.addEventListener('pointerdown', expandMap);
      window.addEventListener('pointerup', collapseMap);
      window.addEventListener('pointercancel', collapseMap);

      minimapContainer.addEventListener('touchstart', expandMap, { passive: false });
      window.addEventListener('touchend', collapseMap, { passive: true });
      window.addEventListener('touchcancel', collapseMap, { passive: true });

      minimapContainer.addEventListener('mousedown', expandMap);
      window.addEventListener('mouseup', collapseMap);

      // Verhindere Kontextmenü bei langem Drücken
      minimapContainer.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Automatischer Vollbild-Wechsel bei der ersten Benutzer-Geste
    const triggerFsOnFirstGesture = () => {
      this.requestGameFullscreen();
      window.removeEventListener('pointerdown', triggerFsOnFirstGesture);
      window.removeEventListener('keydown', triggerFsOnFirstGesture);
    };
    window.addEventListener('pointerdown', triggerFsOnFirstGesture, { once: true });
    window.addEventListener('keydown', triggerFsOnFirstGesture, { once: true });

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

  handleTouchButton(action, isDown, meta = null) {
    if (this.isCharacterSelectOpen) {
      if (!this.charSelectModal || this.charSelectModal.classList.contains('hidden')) {
        this.isCharacterSelectOpen = false;
      } else {
        return;
      }
    }
    if (this.input.joystick && this.input.joystick.active) {
      this.player.setDirectionFromVector(this.input.joystick.x, this.input.joystick.y);
    }

    // A = Dash (Tippen: in Laufrichtung | Halten & Ziehen: 360° Richtungs-Dash | Zurück: Abbrechen)
    if (action === 'A') {
      if (isDown) {
        if (meta && meta.drag && typeof meta.angle === 'number') {
          this.player.setDashAim(true, meta.angle);
        } else if (meta && meta.cancel) {
          this.player.setDashAim(false);
        }
      } else {
        this.player.setDashAim(false);
        if (meta && meta.isCancelled) return;
        if (meta && meta.isDrag && typeof meta.angle === 'number') {
          this.player.triggerDash(meta.angle);
        } else {
          // Tap: In aktuelle Laufrichtung (oder Blickrichtung wenn stillstehend)
          this.player.triggerDash(null);
        }
      }
    }
    // B = Schwert (Gedrückt halten: 3er-Kombo durchballern | Kreis-Geste: 360° Wirbelattacke)
    else if (action === 'B') {
      if (isDown) {
        if (meta && meta.spin) {
          this.player.executeSpinAttack();
          if (this.combat) {
            this.combat.addFloatingText('🌀 WIRBELATTACKE!', this.player.x, this.player.y - 24, '#38bdf8', 0.9);
          }
        } else if (meta && meta.drag && typeof meta.angle === 'number') {
          this.player.setAimAngle(meta.angle);
        } else if (meta && meta.initial) {
          this.player.startMelee();
        }
      } else {
        this.player.releaseMelee();
      }
    }
    // X = Bogen (Gedrückt halten: ruhiges Tempo Schüsse in Zieh-Richtung | Weit ziehen >= 54px: Aimed Shot blau laden mit Flugbahn)
    else if (action === 'X') {
      if (isDown) {
        if (meta && meta.cancel) {
          this.player.cancelRanged();
        } else if (meta && meta.drag) {
          const aimAng = (typeof meta.angle === 'number') ? meta.angle : null;
          this.player.setRangedAimedShot(meta.isAimed, aimAng);
        } else if (meta && meta.initial) {
          this.player.startRanged();
        }
      } else {
        if (meta && meta.isCancelled) {
          this.player.cancelRanged();
        } else {
          const aimAng = (meta && typeof meta.angle === 'number') ? meta.angle : null;
          this.player.releaseRanged(aimAng, meta ? meta.isAimed : null);
        }
      }
    }
    // MAGIC = Zauber/Artefakt (Ziehen: 360° Schablone drehen | Loslassen: Wirken | Zurück: Abbrechen)
    else if (action === 'MAGIC') {
      if (!this.magicManager) return;
      if (isDown) {
        if (meta && meta.drag && typeof meta.angle === 'number') {
          this.player.setAimAngle(meta.angle);
        } else if (meta && meta.cancel) {
          this.magicManager.cancelAiming();
        } else if (meta && meta.initial) {
          this.magicManager.startAiming(this.player);
        }
      } else {
        if (meta && meta.isCancelled) {
          this.magicManager.cancelAiming();
        } else {
          if (meta && meta.isDrag && typeof meta.angle === 'number') {
            this.player.setAimAngle(meta.angle);
          }
          this.magicManager.releaseAiming(this.player, this.map, this.combat);
        }
      }
    }
    // Y = Schild (Einfaches Halten/Blocken)
    else if (action === 'Y') {
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

    let finalX = targetX;
    let finalY = targetY;
    const curTx = Math.floor(targetX / TILE_SIZE);
    const curTy = Math.floor(targetY / TILE_SIZE);

    if (this.map.isSolid && this.map.isSolid(curTx, curTy)) {
      if (this.map.findSafeLandingFloor) {
        const safe = this.map.findSafeLandingFloor(curTx, curTy);
        finalX = safe.x * TILE_SIZE + 8;
        finalY = safe.y * TILE_SIZE + 8;
      } else if (this.player.findSafeLandingPosition) {
        const safe = this.player.findSafeLandingPosition(this.map, targetX, targetY);
        finalX = safe.x;
        finalY = safe.y;
      }
    }

    this.player.x = finalX;
    this.player.y = finalY;
    this.player.lastTransitionTile = {
      x: Math.floor(finalX / TILE_SIZE),
      y: Math.floor(finalY / TILE_SIZE)
    };
    this.camera.setWorldBounds(this.map.width, this.map.height);
    this.camera.follow(finalX, finalY);
    this.minimap.setMap(this.map, this.currentDimension);
    this.updateHUD();
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(currentTime) {
    const now = (typeof currentTime === 'number' && !isNaN(currentTime)) ? currentTime : performance.now();
    let dt = 0.016;
    if (this.lastTime && !isNaN(this.lastTime)) {
      const rawDt = (now - this.lastTime) / 1000;
      if (rawDt > 0 && rawDt < 1.0) {
        dt = Math.min(rawDt, 0.1);
      }
    }
    this.lastTime = now;
    this.animTime += dt;

    this.update(dt);
    this.render();

    requestAnimationFrame((time) => this.loop(time));
  }

  update(dt) {
    if (this.isCharacterSelectOpen) {
      if (!this.charSelectModal || this.charSelectModal.classList.contains('hidden')) {
        this.isCharacterSelectOpen = false;
      } else {
        this.updateCharacterSelectPreviews(dt);
        return;
      }
    }

    // 1. Advance Day-Night Clock
    this.gameTime = (this.gameTime + dt * this.timeSpeed) % 24;
    if (isNaN(this.gameTime) || this.gameTime < 0) {
      this.gameTime = 18.5;
    }

    this.spriteManager.update(dt);

    // Host / Spectator vs normaler Spieler
    if (this.isHost && this.spectator && this.spectator.active) {
      this.spectator.update(dt, this.input);
    } else {
      this.player.update(dt, this.input);
      this.camera.follow(this.player.x, this.player.y);
      this.camera.update(dt);
    }

    // Remote Players aktualisieren
    if (this.remotePlayers) {
      for (const rp of this.remotePlayers.values()) {
        rp.update(dt);
      }
    }

    if (this.enemyManager) this.enemyManager.update(dt, this.player, this.map, this.combat);
    if (this.combat) this.combat.update(dt);
    this.updateAmbientParticles(dt);

    if (this.magicManager) {
      this.magicManager.update(dt, this.player, this.map, this.combat, this.enemyManager);
    }

    if (!this.isHost) {
      this.updateHUD();
      this.updateCombatUI();
    }

    // Netzwerk-Synchronisation
    if (this.network) {
      this.network.update(dt, this.isHost ? null : this.player);

      // Im LAN-Modus: Wenn dieser Client der Master ist, Snapshot aller Monster an Mitspieler senden (~12.5 Hz)
      if (this.network.connected && this.enemyManager && this.enemyManager.isMasterClient) {
        this.enemySyncTimer = (this.enemySyncTimer || 0) + dt;
        if (this.enemySyncTimer >= 0.08) {
          this.enemySyncTimer = 0;
          this.network.sendEnemiesUpdate(this.enemyManager.serializeEnemiesState());
        }
      }
    }
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

    // Night factor: 0.0 - 1.0 (clamped strictly between 0 and 1)
    let night = 0;
    if (t >= 20.0 && t <= 21.5) {
      night = (t - 20.0) / 1.5; // Dämmerung -> Nacht Übergang
    } else if (t > 21.5 || t < 4.0) {
      night = 1.0; // Volle Nacht (Mitternacht bis 04:00)
    } else if (t >= 4.0 && t <= 5.5) {
      night = 1.0 - (t - 4.0) / 1.5; // Nacht -> Morgengrauen Übergang
    }
    night = Math.max(0, Math.min(1, night));

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

      if (night > 0.3 || this.gameTime >= 21.0 || this.gameTime < 4.0) {
        icon = '🌙 Geisternacht';
        col = '#818cf8';
        lanternText = '🏮 Lampions an';
        lanternCol = '#fbbf24';
      } else if (sunset > 0.2 || (this.gameTime >= 16.5 && this.gameTime < 21.0)) {
        icon = '🏮 Dämmerung';
        col = '#f59e0b';
        lanternText = '🏮 Lampions an';
        lanternCol = '#f59e0b';
      } else if (this.gameTime >= 4.0 && this.gameTime < 6.5) {
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

      // Magic Ground Artifacts (unter dem Blätterdach gerendert, damit sie im dichten Wald von außen verdeckt bleiben!)
      if (this.magicManager) {
        this.magicManager.renderGroundArtifacts(this.ctx, this.camera, this.currentDimension);
      }

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

    // 11.5. Magic Layer: Spells, Plasma Orbs & Player Sparkle Aura
    if (this.magicManager) {
      if (this.currentDimension !== DIMENSIONS.OVERWORLD) {
        this.magicManager.renderGroundArtifacts(this.ctx, this.camera, this.currentDimension);
      }
      this.magicManager.renderSpellsAndAuras(this.ctx, this.camera);
    }

    // 12. Screen Overlay: Floating Shrine Discovery Banner
    if (this.player.shrineMessage) {
      this.renderShrineBanner(this.player.shrineMessage);
    }

    // 12.5. Screen Overlay: Teleport Blackout Fade (kurze Schwarzüberblende während Kamerasprung)
    if (this.player && typeof this.player.getTeleportBlackoutAlpha === 'function') {
      const bAlpha = this.player.getTeleportBlackoutAlpha();
      if (bAlpha > 0) {
        this.ctx.save();
        this.ctx.fillStyle = `rgba(15, 5, 29, ${bAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
      }
    }

    // 13. LAYER 10: Minimap (inklusive Mitspieler auf der Karte)
    this.minimap.render(this.player, this.camera, this.remotePlayers);
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

        // 10. Fluoreszierende Kristalle (Overworld)
        else if (obj === OBJECTS.GLOW_CRYSTAL) {
          const gTile = this.map.getGroundTile(x, y);
          let theme = 'main';
          if (gTile === TILES.SNOW) theme = 'snow';
          else if (gTile === TILES.SAND || gTile === TILES.QUICKSAND) theme = 'desert';
          else if (gTile === TILES.SWAMP_GROUND || gTile === TILES.SWAMP_WATER) theme = 'forest';
          else if (gTile === TILES.VOID_GROUND || gTile === TILES.VOID_LAKE) theme = 'void';
          this.renderGlowCrystal(px, py, t, x, y, theme);
        }

        // 11. Trainingspuppe (Straw training dummy with target cross)
        else if (obj === OBJECTS.TRAINING_DUMMY) {
          // Drop shadow
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 14, 5, 2.5, 0, 0, Math.PI * 2);
          this.ctx.fill();

          // Wooden base post
          this.ctx.fillStyle = '#78350f';
          this.ctx.fillRect(px + 7, py + 6, 2, 9);

          // Straw woven chest
          this.ctx.fillStyle = '#d97706';
          this.ctx.fillRect(px + 5, py + 4, 6, 8);

          // Cross arms
          this.ctx.fillStyle = '#92400e';
          this.ctx.fillRect(px + 2, py + 6, 12, 2.5);

          // Head sack with tie
          this.ctx.fillStyle = '#fef3c7';
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 3, 3, 0, Math.PI * 2);
          this.ctx.fill();

          // Red bullseye target cross
          this.ctx.strokeStyle = '#dc2626';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 6, py + 8); this.ctx.lineTo(px + 10, py + 8);
          this.ctx.moveTo(px + 8, py + 6); this.ctx.lineTo(px + 8, py + 10);
          this.ctx.stroke();
        }

        // 12. Moosiger Holzstamm (Fallen log)
        else if (obj === OBJECTS.FALLEN_LOG) {
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          this.ctx.fillRect(px + 1, py + 11, 14, 4);

          this.ctx.fillStyle = '#451a03';
          this.ctx.fillRect(px + 2, py + 7, 12, 6);

          this.ctx.fillStyle = '#78350f';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 2, py + 10, 2, 3, 0, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#4ade80';
          this.ctx.fillRect(px + 5, py + 6, 6, 2);
        }

        // 13. Baumstumpf (Tree trunk)
        else if (obj === OBJECTS.TREE_TRUNK) {
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 12, 6, 3, 0, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#5c2d12';
          this.ctx.fillRect(px + 4, py + 8, 8, 5);

          this.ctx.fillStyle = '#b45309';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 8, py + 8, 4, 2.5, 0, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#78350f';
          this.ctx.beginPath();
          this.ctx.arc(px + 8, py + 8, 1.2, 0, Math.PI * 2);
          this.ctx.fill();
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

    // Remote Players (LAN Multiplayer)
    if (this.remotePlayers && this.remotePlayers.size > 0) {
      const curDim = this.currentDimension || 'overworld';
      const minX = bounds.startX * TILE_SIZE - 48;
      const maxX = bounds.endX * TILE_SIZE + 48;
      const minY = bounds.startY * TILE_SIZE - 48;
      const maxY = bounds.endY * TILE_SIZE + 48;

      for (const rp of this.remotePlayers.values()) {
        if (!rp.isDead && (rp.dimension || 'overworld') === curDim) {
          if (rp.x >= minX && rp.x <= maxX && rp.y >= minY && rp.y <= maxY) {
            const rpElev = rp.visualElevation || 0;
            const rpSortY = rp.y - rpElev * ELEVATION_PIXEL_OFFSET;
            renderList.push({
              sortY: rpSortY,
              isPlayer: false,
              isRemotePlayer: true,
              remotePlayer: rp
            });
          }
        }
      }
    }

    // Sort back-to-front by visual screen Y
    renderList.sort((a, b) => a.sortY - b.sortY);

    for (const item of renderList) {
      if (item.isPlayer) {
        if (!this.isHost) {
          this.player.render(this.ctx, this.spriteManager, t, night);
        }
      } else if (item.isRemotePlayer) {
        item.remotePlayer.render(this.ctx, t, night);
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

    // Deep Mononoke Night Indigo Wash (max 0.38 alpha for clear visibility at night)
    if (night > 0.02) {
      const nightAlpha = Math.min(0.38, Math.max(0, night) * 0.38);
      this.ctx.fillStyle = `rgba(18, 24, 48, ${nightAlpha})`;
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

    if (!this.isHost) {
      this.player.render(this.ctx, this.spriteManager, t, 0.4);
    }
    if (this.remotePlayers) {
      for (const rp of this.remotePlayers.values()) {
        if (!rp.isDead && rp.dimension === DIMENSIONS.CLOUDS) {
          rp.render(this.ctx, t, 0.4);
        }
      }
    }

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

    if (!this.isHost) {
      this.player.render(this.ctx, this.spriteManager, t, 1.0);
    }
    if (this.remotePlayers) {
      for (const rp of this.remotePlayers.values()) {
        if (!rp.isDead && rp.dimension === DIMENSIONS.CAVES) {
          rp.render(this.ctx, t, 1.0);
        }
      }
    }

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

    // Direct Close / Skip Button (✕)
    const btnCloseWizard = document.getElementById('btn-close-char-wizard');
    if (btnCloseWizard) {
      btnCloseWizard.addEventListener('click', () => {
        this.startGameWithSelectedHero();
      });
    }

    // Click backdrop outside modal dialog to start/resume
    if (this.charSelectModal) {
      this.charSelectModal.addEventListener('click', (e) => {
        if (e.target === this.charSelectModal) {
          this.startGameWithSelectedHero();
        }
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
    this.updateWizardWorldDisplay();
    this.renderConfirmPreview();
  }

  updateWizardWorldDisplay(worldId) {
    const activeWorldEl = document.getElementById('wizard-active-world-name');
    if (!activeWorldEl) return;
    const currentId = worldId || (this.overworldMap && this.overworldMap.preset ? this.overworldMap.preset.id : getSelectedWorldId());
    const preset = getWorldPreset(currentId);
    if (preset) {
      activeWorldEl.textContent = `${preset.id}. ${preset.name} (${preset.badge})`;
    }
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
    this.requestGameFullscreen();

    // Auto-Connect to LAN-Multiplayer as Player
    if (this.network && !this.isHost) {
      this.network.connect('player', chosenName, this.selectedHeroSkin);
    }

    if (this.heroNameInput && typeof this.heroNameInput.blur === 'function') {
      this.heroNameInput.blur();
    }
    if (this.canvas && typeof this.canvas.focus === 'function') {
      this.canvas.focus();
    }
  }

  initWorldSelectUI() {
    const devWorldSelect = document.getElementById('dev-world-select');
    const presets = getAllWorldPresets();
    const currentId = getSelectedWorldId();

    if (devWorldSelect) {
      devWorldSelect.innerHTML = '';
      presets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.id}. ${p.name} (${p.badge})`;
        if (p.id === currentId) opt.selected = true;
        devWorldSelect.appendChild(opt);
      });

      devWorldSelect.addEventListener('change', (e) => {
        const newId = parseInt(e.target.value, 10);
        if (newId) {
          this.switchWorld(newId);
        }
      });
    }

    this.updateWizardWorldDisplay(currentId);
  }

  switchWorld(worldId) {
    const preset = getWorldPreset(worldId);
    setSelectedWorldId(preset.id);

    // Re-create maps with the new preset
    this.overworldMap = new WorldMap(preset.id);
    this.cloudMap = new CloudMap(this.overworldMap);

    if (this.currentDimension === DIMENSIONS.OVERWORLD) {
      this.map = this.overworldMap;
    } else if (this.currentDimension === DIMENSIONS.CLOUDS) {
      this.map = this.cloudMap;
    }

    // Reposition player to the new world's spawn point
    if (this.player) {
      this.player.x = this.overworldMap.spawnPoint.x * TILE_SIZE + 8;
      this.player.y = this.overworldMap.spawnPoint.y * TILE_SIZE + 8;
      this.player.elevation = 0;
      this.player.map = this.map;
    }

    // Reset camera bounds & center on player
    this.camera.setWorldBounds(this.map.width, this.map.height);
    this.camera.follow(this.player.x, this.player.y);

    // Reset Minimap and Fog of War for new world
    if (this.minimap) {
      this.minimap.setMap(this.map, this.currentDimension);
      this.minimap.resetFog();
    }

    // Reinitialize Shrines & Artifacts
    if (this.magicManager) {
      this.magicManager.initShrineArtifacts(this.caves, this.cloudMap, this.overworldMap);
    }

    // Re-spawn all monster groups for the new terrain and dimensions
    if (this.enemyManager) {
      this.enemyManager.initSpawns();
    }

    // Update World Select UI controls
    const worldPresetSelect = document.getElementById('world-preset-select');
    const devWorldSelect = document.getElementById('dev-world-select');
    const worldPresetDesc = document.getElementById('world-preset-desc');
    if (worldPresetSelect) worldPresetSelect.value = preset.id;
    if (devWorldSelect) devWorldSelect.value = preset.id;
    if (worldPresetDesc) {
      worldPresetDesc.innerHTML = `<strong style="color: ${preset.color || '#38bdf8'}">${preset.badge}: ${preset.name}</strong> - <em>${preset.subtitle}</em><br><span style="color: #cbd5e1">${preset.description}</span>`;
    }

    this.showToast(`🌍 Welt gewechselt: ${preset.name}!`);
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

  // ---------------------------------------------------------------------------
  // LAN MULTIPLAYER & SPECTATOR SYSTEMS
  // ---------------------------------------------------------------------------
  requestGameFullscreen() {
    const docEl = document.documentElement;
    if (!docEl || document.fullscreenElement || document.webkitFullscreenElement) return;
    try {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } catch (e) {}
  }

  startAsHost() {
    this.isHost = true;
    if (this.charSelectModal) {
      this.charSelectModal.classList.add('hidden');
    }
    this.isCharacterSelectOpen = false;
    this.requestGameFullscreen();

    if (this.spectator) {
      this.spectator.activate();
    }
    if (this.network) {
      this.network.connect('host', 'Spielleiter', 'ren_twilight');
    }
    this.showToast('👑 Als Spielleiter (Host / Spectator) gestartet!');
  }

  initMultiplayerUI() {
    this.btnStartAsHost = document.getElementById('btn-start-as-host');
    const wizardHostBanner = document.querySelector('.wizard-host-banner');
    const wizardDivider = document.querySelector('.wizard-divider');

    // Host-Rolle nur auf dem Host-Rechner (localhost / 127.0.0.1) erlauben
    const isLocalhost = typeof window !== 'undefined' && window.location &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Wenn nicht am Host-PC (z.B. Handy/Tablet/anderer PC im LAN): Host-Banner komplett ausblenden!
    if (!isLocalhost) {
      if (wizardHostBanner) wizardHostBanner.style.display = 'none';
      if (wizardDivider) wizardDivider.style.display = 'none';
    } else {
      // Am Host-PC: prüfen ob bereits ein Host aktiv ist
      if (typeof fetch !== 'undefined') {
        fetch('/api/server-info')
          .then(res => res.json())
          .then(data => {
            if (data && data.hasHost && !this.isHost) {
              if (wizardHostBanner) wizardHostBanner.style.display = 'none';
              if (wizardDivider) wizardDivider.style.display = 'none';
            }
            if (data && data.worldId) {
              this.updateWizardWorldDisplay(data.worldId);
            }
          })
          .catch(() => {});
      }
    }

    if (this.btnStartAsHost) {
      this.btnStartAsHost.addEventListener('click', () => {
        this.startAsHost();
      });
    }

    const btnDevHost = document.getElementById('btn-dev-host-mode');
    if (btnDevHost) {
      btnDevHost.addEventListener('click', () => {
        this.startAsHost();
      });
    }

    const btnResultsNewRound = document.getElementById('btn-results-new-round');
    if (btnResultsNewRound) {
      btnResultsNewRound.addEventListener('click', () => {
        const selWorld = (this.spectator && this.spectator.worldSelectEl) ? parseInt(this.spectator.worldSelectEl.value, 10) : 1;
        if (this.network) {
          this.network.sendHostStartRound(selWorld);
        }
      });
    }

    // URL Query Parameter ?host=true Support (nur auf localhost)
    if (isLocalhost && typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('host') === 'true' || urlParams.get('host') === '1') {
        this.startAsHost();
      }
    }
  }

  initNetworkEvents() {
    if (!this.network) return;

    this.network.on('init', (msg) => {
      this.remotePlayers.clear();
      const myId = msg.clientId || (this.network ? this.network.clientId : null);
      if (msg.masterClientId && this.enemyManager) {
        this.enemyManager.isMasterClient = (myId === msg.masterClientId);
      }
      if (msg.players) {
        for (const p of msg.players) {
          if (p.id !== myId) {
            this.remotePlayers.set(p.id, new RemotePlayer(p));
          }
        }
      }
      if (msg.worldId) {
        if (this.overworldMap && this.overworldMap.preset.id !== msg.worldId) {
          this.switchWorld(msg.worldId);
        }
        this.updateWizardWorldDisplay(msg.worldId);
      }
    });

    this.network.on('master_client', (msg) => {
      const isMaster = (this.network.clientId === msg.masterClientId);
      if (this.enemyManager) {
        this.enemyManager.isMasterClient = isMaster;
      }
    });

    this.network.on('enemies_update', (msg) => {
      if (this.enemyManager && !this.enemyManager.isMasterClient) {
        this.enemyManager.applyEnemiesState(msg.enemies);
      }
    });

    this.network.on('damage_enemy', (msg) => {
      if (this.enemyManager && this.enemyManager.isMasterClient) {
        this.enemyManager.handleRemoteDamage(msg);
      }
    });

    this.network.on('player_joined', (msg) => {
      const myId = this.network ? this.network.clientId : null;
      if (msg.player && msg.player.id !== myId) {
        this.remotePlayers.set(msg.player.id, new RemotePlayer(msg.player));
        this.showToast(`👋 ${msg.player.name} ist beigetreten!`);
      }
    });

    this.network.on('player_left', (msg) => {
      this.remotePlayers.delete(msg.id);
      this.showToast(`🚪 ${msg.name || 'Ein Spieler'} hat das Spiel verlassen.`);
    });

    this.network.on('player_update', (msg) => {
      if (this.network && msg.id === this.network.clientId) return;
      const rp = this.remotePlayers.get(msg.id);
      if (rp) {
        rp.updateFromNetwork(msg);
      }
    });

    this.network.on('player_action', (msg) => {
      if (this.network && msg.id === this.network.clientId) return;
      const rp = this.remotePlayers.get(msg.id);
      if (rp) {
        rp.triggerAction(msg.action, msg);
      }
      if (msg.action === 'melee' && this.combat) {
        const mx = (rp ? rp.x : msg.x) || 0;
        const my = ((rp ? rp.y : msg.y) || 0) - 6;
        this.combat.addSlashEffect(msg.subType || 'slash1', mx, my, msg.angle || 0, msg.radius || 24);
      } else if (msg.action === 'arrow' && this.combat) {
        this.combat.fireArrow(msg.x, msg.y, msg.dirX, msg.dirY, msg.isCharged);
      } else if (msg.action === 'dash' && this.combat) {
        const dx = (rp ? rp.x : msg.x) || 0;
        const dy = (rp ? rp.y : msg.y) || 0;
        this.combat.addHitSparks(dx, dy + 2, 'rgba(240, 240, 245, 0.75)', 8, 40);
      } else if (msg.action === 'shield_block' && this.combat) {
        this.combat.addHitSparks(msg.x, msg.y, '#38bdf8', 14);
        this.combat.addFloatingText('🛡️ GEBLOCKT!', msg.x, msg.y - 14, '#38bdf8');
      } else if (msg.action === 'spell_phoenix' && this.magicManager) {
        this.magicManager.spawnRemotePhoenix(msg);
      } else if (msg.action === 'spell_frost' && this.magicManager) {
        this.magicManager.spawnRemoteFrostCone(msg);
      }
    });

    this.network.on('pvp_hit', (msg) => {
      if (msg.targetId === this.network.clientId) {
        this.player.takePvPDamage(msg.damage, msg.kbX, msg.kbY, msg.attackerId);
      } else {
        const rp = this.remotePlayers.get(msg.targetId);
        if (rp && typeof msg.targetHp === 'number') {
          rp.hp = msg.targetHp;
        }
      }
    });

    this.network.on('player_respawned', (msg) => {
      if (msg.id !== this.network.clientId) {
        const rp = this.remotePlayers.get(msg.id);
        if (rp) {
          rp.isDead = false;
          rp.hp = msg.hp;
          rp.maxHp = msg.maxHp;
          rp.x = msg.x;
          rp.y = msg.y;
        }
      }
    });

    this.network.on('world_changed', (msg) => {
      this.switchWorld(msg.worldId);
      this.updateWizardWorldDisplay(msg.worldId);
      this.showToast(`🌍 Welt gewechselt: ${getWorldPreset(msg.worldId).name}`);
    });

    this.network.on('game_ended', (msg) => {
      this.showMatchResultsModal(msg.winners, msg.leaderboard);
    });

    this.network.on('round_started', (msg) => {
      this.hideMatchResultsModal();
      this.switchWorld(msg.worldId);
      this.updateWizardWorldDisplay(msg.worldId);

      // Reset local player
      if (!this.isHost && this.player) {
        this.player.level = 1;
        this.player.xp = 0;
        this.player.totalXpEarned = 0;
        this.player.skillPoints = 0;
        this.player.skills = { hp: 0, melee: 0, range: 0, shield: 0 };
        this.player.hp = this.player.maxHp;
        this.player.isDead = false;
        this.player.x = this.map.spawnPoint.x * TILE_SIZE + 8;
        this.player.y = this.map.spawnPoint.y * TILE_SIZE + 8;
        this.updateHUD();
      }

      // Reset remote players
      for (const rp of this.remotePlayers.values()) {
        rp.level = 1;
        rp.xp = 0;
        rp.pvpKills = 0;
        rp.deaths = 0;
        rp.hp = rp.maxHp;
        rp.isDead = false;
        rp.x = this.map.spawnPoint.x * TILE_SIZE + 8;
        rp.y = this.map.spawnPoint.y * TILE_SIZE + 8;
      }

      this.showToast('🚀 Neue Runde gestartet! Auf in den Kampf!');
    });
  }

  showKillFeed(killerName, victimName) {
    const container = document.getElementById('killfeed-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'killfeed-toast';
    toast.textContent = `⚔️ ${killerName} hat ${victimName} besiegt!`;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
  }

  showMatchResultsModal(winners, leaderboard) {
    const modal = document.getElementById('match-results-modal');
    if (!modal) return;

    const levelNameEl = document.getElementById('podium-level-name');
    const levelStatEl = document.getElementById('podium-level-stat');
    const killsNameEl = document.getElementById('podium-kills-name');
    const killsStatEl = document.getElementById('podium-kills-stat');
    const tbody = document.getElementById('results-table-body');
    const hostControls = document.getElementById('results-host-controls');
    const playerNotice = document.getElementById('results-player-notice');

    if (winners && winners.highestLevel) {
      if (levelNameEl) levelNameEl.textContent = winners.highestLevel.name;
      if (levelStatEl) levelStatEl.textContent = `Level ${winners.highestLevel.level} (${winners.highestLevel.xp} XP)`;
    } else {
      if (levelNameEl) levelNameEl.textContent = '-';
      if (levelStatEl) levelStatEl.textContent = 'Keine Daten';
    }

    if (winners && winners.mostKills) {
      if (killsNameEl) killsNameEl.textContent = winners.mostKills.name;
      if (killsStatEl) killsStatEl.textContent = `${winners.mostKills.pvpKills} PvP-Kills`;
    } else {
      if (killsNameEl) killsNameEl.textContent = '-';
      if (killsStatEl) killsStatEl.textContent = '0 Kills';
    }

    if (tbody) {
      tbody.innerHTML = '';
      if (leaderboard && leaderboard.length > 0) {
        leaderboard.forEach((p, idx) => {
          const row = document.createElement('tr');
          const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));
          row.innerHTML = `
            <td><strong>${medal}</strong></td>
            <td><strong>${p.name}</strong></td>
            <td>Lv.${p.level}</td>
            <td>${p.xp}</td>
            <td style="color: #f87171; font-weight: bold;">${p.pvpKills}</td>
            <td style="color: #94a3b8;">${p.deaths}</td>
          `;
          tbody.appendChild(row);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #94a3b8;">Keine Spielerdaten verfügbar</td></tr>';
      }
    }

    if (this.isHost) {
      if (hostControls) hostControls.classList.remove('hidden');
      if (playerNotice) playerNotice.classList.add('hidden');
    } else {
      if (hostControls) hostControls.classList.add('hidden');
      if (playerNotice) playerNotice.classList.remove('hidden');
    }

    modal.classList.remove('hidden');
  }

  hideMatchResultsModal() {
    const modal = document.getElementById('match-results-modal');
    if (modal) modal.classList.add('hidden');
  }
}

// Start Game on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});


})();
