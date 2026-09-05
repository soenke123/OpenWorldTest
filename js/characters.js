/**
 * Ocarina of Brawls - 15 Spielbare Helden-Skins
 * Kunststil: Süßer Dark Ghibli 2.5D Papercraft
 * Identische Spielmechanik, Hitboxen und Kampfaktionen für alle Helden.
 */

// LocalStorage Keys for chosen skin & player name
export const STORAGE_KEY_SKIN = 'ocarina_player_skin';
export const STORAGE_KEY_NAME = 'ocarina_player_name';

export const RANDOM_HERO_NAMES = [
  'Ren', 'Kaito', 'Jiro', 'Taro', 'Sora', 'Kanna', 'Aoi', 'Mei',
  'Yuto', 'Poko', 'Kuro', 'Toru', 'Hayate', 'Shiratama', 'Mukuro',
  'Haku', 'Ashitaka', 'San', 'Chihiro', 'Howl', 'Nausicaä', 'Kiki',
  'Tsuki', 'Kohaku', 'Genji', 'Kagome', 'Rin', 'Botan', 'Shin'
];

export function getRandomHeroName() {
  return RANDOM_HERO_NAMES[Math.floor(Math.random() * RANDOM_HERO_NAMES.length)];
}

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
}

export function getSelectedSkin() {
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

export function setSelectedSkin(skinId) {
  const storage = getStorage();
  if (CHARACTERS_MAP[skinId] && storage) {
    try {
      storage.setItem(STORAGE_KEY_SKIN, skinId);
    } catch (e) {
      // ignore
    }
  }
}

export function getSelectedPlayerName() {
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

export function setSelectedPlayerName(name) {
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
export const CHARACTERS_DATA = [
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

export const CHARACTERS_MAP = CHARACTERS_DATA.reduce((acc, char) => {
  acc[char.id] = char;
  return acc;
}, {});
