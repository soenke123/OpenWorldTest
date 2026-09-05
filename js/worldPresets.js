// =============================================================================
// WORLD PRESETS CONFIGURATION (10 Vielfältige Riesenwelten - 290x200 Kacheln)
// =============================================================================
import { TILES } from './constants.js';

export const WORLD_WIDTH = 290;
export const WORLD_HEIGHT = 200;

export const WORLD_PRESETS = [
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
    trampolineCount: 8,
    shrineCount: 7
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
    trampolineCount: 7,
    shrineCount: 8
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
    trampolineCount: 6,
    shrineCount: 6
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
    trampolineCount: 9,
    shrineCount: 7
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
    trampolineCount: 7,
    shrineCount: 8
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
    trampolineCount: 6,
    shrineCount: 6
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
    trampolineCount: 10,
    shrineCount: 8
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
    trampolineCount: 8,
    shrineCount: 8
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
    trampolineCount: 6,
    shrineCount: 6
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
    trampolineCount: 9,
    shrineCount: 8
  }
];

export function getWorldPreset(id) {
  const num = parseInt(id, 10) || 1;
  return WORLD_PRESETS.find(p => p.id === num) || WORLD_PRESETS[0];
}

export function getAllWorldPresets() {
  return WORLD_PRESETS;
}

const STORAGE_KEY = 'ocarina_selected_world_id';

export function getSelectedWorldId() {
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

export function setSelectedWorldId(id) {
  const num = parseInt(id, 10);
  if (num >= 1 && num <= 10 && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, num.toString());
  }
}
