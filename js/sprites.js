import { TILE_SIZE, TILES, OBJECTS, CANOPY, TREES, TILE_LAYER_ORDER } from './constants.js';

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
export const TREE_METADATA = {
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
export class SpriteManager {
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
