import fs from 'fs';
import { CHARACTERS_DATA, CHARACTERS_MAP, getSelectedSkin, setSelectedSkin, STORAGE_KEY_SKIN } from './js/characters.js';
import { Player } from './js/player.js';

console.log('=== TEST SUITE: 15 PLAYABLE HERO CHARACTERS (GHIBLI PAPERCRAFT) ===\n');

// 1. VERIFY ROSTER COUNT AND CATEGORIES
console.log('1. Checking Character Roster & Categories...');
if (CHARACTERS_DATA.length !== 15) {
  throw new Error(`Expected 15 characters, but got ${CHARACTERS_DATA.length}`);
}

const counts = { male: 0, female: 0, beast: 0, spirit: 0 };
CHARACTERS_DATA.forEach(c => {
  if (!counts.hasOwnProperty(c.category)) {
    throw new Error(`Unexpected category: ${c.category} on ${c.id}`);
  }
  counts[c.category]++;
});

console.log(`- Male: ${counts.male} (expected 4)`);
console.log(`- Female: ${counts.female} (expected 4)`);
console.log(`- Beast: ${counts.beast} (expected 5)`);
console.log(`- Spirit: ${counts.spirit} (expected 2)`);

if (counts.male !== 4 || counts.female !== 4 || counts.beast !== 5 || counts.spirit !== 2) {
  throw new Error('Category counts do not match requirements!');
}
console.log('✓ All 15 characters categorized correctly!\n');

// 2. VERIFY METADATA AND REQUIRED FIELDS
console.log('2. Checking Required Fields on Each Character...');
const requiredFields = ['id', 'name', 'title', 'category', 'categoryName', 'badgeClass', 'desc', 'lore', 'palette', 'render'];
CHARACTERS_DATA.forEach(c => {
  requiredFields.forEach(f => {
    if (!c[f]) throw new Error(`Character ${c.id} missing field: ${f}`);
  });
  if (!Array.isArray(c.palette) || c.palette.length < 3) {
    throw new Error(`Character ${c.id} palette is invalid: ${c.palette}`);
  }
  if (typeof c.render !== 'function') {
    throw new Error(`Character ${c.id} render is not a function!`);
  }
  if (CHARACTERS_MAP[c.id] !== c) {
    throw new Error(`CHARACTERS_MAP missing or mismatched for id: ${c.id}`);
  }
});
console.log('✓ All metadata and palette fields validated!\n');

// 3. CANVAS 2D MOCK RENDERING TEST
console.log('3. Testing Procedural Canvas Rendering Across 8 Directions & States...');
class MockCanvasContext {
  constructor() {
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.globalAlpha = 1.0;
    this.calls = [];
  }
  save() { this.calls.push('save'); }
  restore() { this.calls.push('restore'); }
  beginPath() { this.calls.push('beginPath'); }
  closePath() { this.calls.push('closePath'); }
  moveTo(x, y) { this.calls.push(`moveTo(${x},${y})`); }
  lineTo(x, y) { this.calls.push(`lineTo(${x},${y})`); }
  arc(x, y, r, sa, ea) { this.calls.push(`arc(${x},${y},${r})`); }
  ellipse(x, y, rx, ry, rot, sa, ea) { this.calls.push(`ellipse(${x},${y},${rx},${ry})`); }
  quadraticCurveTo(cpx, cpy, x, y) { this.calls.push(`quadraticCurveTo(${cpx},${cpy},${x},${y})`); }
  fill() { this.calls.push('fill'); }
  stroke() { this.calls.push('stroke'); }
  fillRect(x, y, w, h) { this.calls.push(`fillRect(${x},${y},${w},${h})`); }
  strokeRect(x, y, w, h) { this.calls.push(`strokeRect(${x},${y},${w},${h})`); }
  clearRect(x, y, w, h) { this.calls.push(`clearRect(${x},${y},${w},${h})`); }
  translate(x, y) { this.calls.push(`translate(${x},${y})`); }
  scale(x, y) { this.calls.push(`scale(${x},${y})`); }
}

const mockCtx = new MockCanvasContext();
const directions = ['down', 'up', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'];

CHARACTERS_DATA.forEach(char => {
  directions.forEach(dir => {
    // Test moving and standing
    [true, false].forEach(isMoving => {
      // Test normal and hitFlash
      [0, 0.4].forEach(hitFlash => {
        mockCtx.calls = [];
        char.render(mockCtx, 40, 52, 1.25, dir, isMoving, hitFlash);
        if (mockCtx.calls.length === 0) {
          throw new Error(`Render did not draw anything for character ${char.id} facing ${dir}!`);
        }
      });
    });
  });
});
console.log(`✓ Successfully tested procedural rendering for all 15 characters across 8 directions & states! (Total draw calls executed smoothly)\n`);

// 4. TEST LOCALSTORAGE PERSISTENCE HELPERS
console.log('4. Testing Skin Selection & LocalStorage Persistence...');
const memoryStorage = {};
global.window = {
  localStorage: {
    getItem: (k) => memoryStorage[k] || null,
    setItem: (k, v) => { memoryStorage[k] = String(v); }
  }
};

setSelectedSkin('sora_miko');
if (getSelectedSkin() !== 'sora_miko') {
  throw new Error(`Expected getSelectedSkin to return 'sora_miko', got '${getSelectedSkin()}'`);
}

setSelectedSkin('yuto_kitsune');
if (getSelectedSkin() !== 'yuto_kitsune') {
  throw new Error(`Expected getSelectedSkin to return 'yuto_kitsune', got '${getSelectedSkin()}'`);
}

// Fallback test
setSelectedSkin('non_existent_skin');
if (getSelectedSkin() !== 'yuto_kitsune') {
  throw new Error(`Invalid skin should not overwrite previous valid skin!`);
}
console.log('✓ Skin selection getters and setters verified!\n');

// 5. TEST PLAYER INTEGRATION & IDENTICAL COMBAT MECHANICS
console.log('5. Testing Player Integration & Identical Combat Mechanics...');
const mockMap = {
  isWalkable: () => true,
  isWater: () => false,
  isBridge: () => false,
  isAbyss: () => false,
  isRamp: () => false,
  getElevation: () => 0,
  biome: 'Wiesenwald'
};

const player = new Player(10, 10, mockMap);
if (!player.skinId) {
  throw new Error('Player failed to initialize skinId!');
}

console.log(`- Default player skin initialized to: ${player.skinId}`);

// Verify combat stats and hitboxes are 100% identical regardless of skin
const initialRadius = player.radius;
const initialMaxHp = player.maxHp;
const initialBaseSpeed = player.baseSpeed;

CHARACTERS_DATA.forEach(c => {
  player.skinId = c.id;
  
  // Verify stats & hitbox remain untouched
  if (player.radius !== initialRadius) {
    throw new Error(`Hitbox changed for skin ${c.id}!`);
  }
  if (player.maxHp !== initialMaxHp) {
    throw new Error(`Max HP changed for skin ${c.id}!`);
  }
  if (player.baseSpeed !== initialBaseSpeed) {
    throw new Error(`Base speed changed for skin ${c.id}!`);
  }

  // Verify Player.render draws without error
  mockCtx.calls = [];
  player.render(mockCtx, 160, 160, 0, 0.5);
  if (mockCtx.calls.length === 0) {
    throw new Error(`Player render produced no draw calls with skin ${c.id}!`);
  }
});
console.log('✓ All 15 skins verified to have identical combat mechanics, hitboxes, and stats!\n');

// 6. VERIFY SHOWROOM HTML & CSS
console.log('6. Verifying Showroom HTML & CSS Integrations...');
const html = fs.readFileSync('showroom.html', 'utf8');
const css = fs.readFileSync('showroom.css', 'utf8');

if (!html.includes('id="btn-mode-characters"')) {
  throw new Error('showroom.html missing #btn-mode-characters button!');
}
if (!html.includes('id="characters-view"')) {
  throw new Error('showroom.html missing #characters-view section!');
}
if (!html.includes('id="characters-grid"')) {
  throw new Error('showroom.html missing #characters-grid container!');
}
if (!html.includes('id="select-hero-skin"')) {
  throw new Error('showroom.html missing #select-hero-skin dropdown!');
}

if (!css.includes('#characters-view')) {
  throw new Error('showroom.css missing #characters-view styles!');
}
if (!css.includes('.character-card')) {
  throw new Error('showroom.css missing .character-card styles!');
}
if (!css.includes('.is-active-skin')) {
  throw new Error('showroom.css missing .is-active-skin styles!');
}
console.log('✓ Showroom HTML & CSS elements verified!\n');

console.log('🎉 ALL 15 CHARACTERS TESTS PASSED PERFECTLY! 100% SUCCESSFUL!');
