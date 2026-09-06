// 16x16 Tile Size for fine, detailed pixel-art and organic shapes
export const TILE_SIZE = 16;

// World Dimensions in Tiles (290 x 200 = 4640 x 3200 px, 5x larger than original test world)
export const MAP_WIDTH = 290;
export const MAP_HEIGHT = 200;

// Dimensions / Worlds (4 Vertikale Schichten)
export const DIMENSIONS = {
  CLOUDS: 'clouds',         // Layer +1 (Wolke +1)
  OVERWORLD: 'overworld',   // Layer 0  (Ground 0)
  CAVES: 'caves_l1',        // Layer -1 (Höhle -1)
  CAVES_L1: 'caves_l1',
  CAVES_DEEP: 'caves_l2',   // Layer -2 (Höhle -2)
  CAVES_L2: 'caves_l2'
};

// Biome Names
export const BIOMES = {
  GRASSLAND: 'Grasland & Wald',
  DESERT: 'Wüste & Treibsand',
  SNOW: 'Schnee & Eislande',
  SWAMP: 'Düsterer Sumpf',
  VOID: 'Die Leere (Void)',
  CAVES_L1: 'Höhlen & Grotten (Ebene -1)',
  CAVES_L2: 'Tiefe Kristall- & Magmahöhlen (Ebene -2)',
  CAVES_MAIN: 'Tiefenhöhlen & Unterirdischer See',
  CAVES_SUB: 'Kristall-Unterhöhle',
  CAVES_GROTTO: 'Versteckte Grotte',
  CLOUDS: 'Rosa Wolkenreich'
};

// Ground Tiles (Base Terrain)
export const TILES = {
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
export const OBJECTS = {
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
export const TREES = {
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
export const TILE_LAYER_ORDER = {
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
export const CANOPY = {
  NONE: 0,
  TREE_CROWN: 1
};

// Elevation Levels (Höhenebenen: -1 = Loch/Senke, 0 = Boden, 1 = Podest Stufe 1, 2 = Podest Stufe 2)
export const ELEVATION = {
  HOLE: -1,
  GROUND: 0,
  LEVEL_1: 1,
  LEVEL_2: 2
};

// Ramps / Slopes (Schrägen / Aufgänge zwischen Ebenen)
export const RAMPS = {
  NONE: 0,
  UP_NORTH: 1, // Führt nach Norden bergauf (nach Süden bergab)
  UP_SOUTH: 2, // Führt nach Süden bergauf (nach Norden bergab)
  UP_WEST: 3,  // Führt nach Westen bergauf (nach Osten bergab)
  UP_EAST: 4   // Führt nach Osten bergauf (nach Westen bergab)
};

export const ELEVATION_PIXEL_OFFSET = 7; // Visuelle Kantenhöhe in Pixeln pro Stufe

// Ground Tile Properties
export const TILE_PROPS = {
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
export const OBJ_PROPS = {
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
export const PVP_CONFIG = {
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
  MELEE_KNOCKBACK_SLASH: 40,            // Rückstoß bei Slash 1 & 2 (Pixel-Impuls)
  MELEE_KNOCKBACK_THRUST: 150,          // Rückstoß beim Stich / Ausfallschritt
  MELEE_KNOCKBACK_SPIN: 250,            // Rückstoß bei der Wirbelattacke
  ARROW_KNOCKBACK_NORMAL: 50,           // Rückstoß bei normalem Pfeiltreffer
  ARROW_KNOCKBACK_CHARGED: 100,         // Rückstoß bei aufgeladenem Pfeiltreffer

  // 8. Bogen: Feuerrate & Fluggeschwindigkeit
  ARROW_FIRE_RATE: 0.30,                // Schuss-Intervall beim Gedrückthalten in Sekunden (z.B. 0.5 = 2 Pfeile/s, 0.25 = 4 Pfeile/s Schnellfeuer)
  ARROW_CHARGE_TIME: 0.75,              // Ladezeit für gezielten Schuss in Sekunden
  ARROW_FLIGHT_SPEED: 330,              // Fluggeschwindigkeit normaler Pfeil (Pixel/Sekunde)
  ARROW_CHARGED_FLIGHT_SPEED: 580,      // Fluggeschwindigkeit gezielter Pfeil (Pixel/Sekunde)
  ARROW_RANGE: 165,                     // Reichweite normaler Pfeil in Pixeln
  ARROW_CHARGED_RANGE: 270              // Reichweite gezielter Pfeil in Pixeln
};

// Player Settings for 16px Scale
export const PLAYER_CONFIG = {
  BASE_SPEED: 135,
  SPRINT_MULTIPLIER: 1.5,
  RADIUS: 5.5,
  MAX_HP: PVP_CONFIG.PLAYER_BASE_HP,
  CANOPY_REVEAL_RADIUS: 52 // Exakter, scharfer Sichtkreis
};

// Combat & Ability Settings (Zelda / Smash Bros Inspired)
export const COMBAT_CONFIG = {
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
export const ENEMY_CONFIG = {
  DETECTION_RADIUS_DEFAULT: 135,
  DETECTION_RADIUS_SCOUT: 180,
  DEAGGRO_RADIUS: 240,
  WANDER_RADIUS: 42,
  PACK_CALL_RADIUS: 110,
  ATTACK_TELEGRAPH_TIME: 0.45,
  ATTACK_RECOVERY_TIME: 0.65
};

export const LOOT_TYPES = {
  HEART: 'heart',
  ARROW: 'arrow',
  SPIRIT_GEM: 'spirit_gem'
};
