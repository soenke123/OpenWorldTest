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

import {
  RIG, rigV, rigAdd, rigSub, rigScale, rigLerp, rigNorm, rigCross, rigBiped, rigChain, rigSurfPt,
  rigRotY, rigClamp, rigEaseOut, rigEaseInOut
} from './rig.js';

// -----------------------------------------------------------------------------
// GEMEINSAMES HELDEN-SKELETT
// Chibi-Proportionen (großer Kopf, kleiner Körper, ca. 24px hoch). Alle Helden teilen
// Gangzyklus, Kampfposen und Waffenhaltung; nur Aussehen und Sekundäranimation sind individuell.
// -----------------------------------------------------------------------------
const HERO_BUILD = {
  thigh: 2.3, shin: 2.2, hipW: 1.3, torso: 5.4, shoulderW: 2.5,
  upperArm: 2.2, foreArm: 2.1, headR: 4.3, headUp: 3.7,
  freq: 14, stride: 3.4, lift: 1.7, idleArms: 0.7
};

const HERO_PI = Math.PI;

function heroLerp(a, b, t) { return a + (b - a) * t; }

/** Blinzeln alle paar Sekunden (pro Held leicht versetzt) */
function heroBlink(t, offset = 0) {
  const c = (t + offset) % 3.9;
  return c < 0.13 ? 1 : 0;
}

/**
 * Pose-Überschreibungen für Kampfaktionen.
 * action: { type: 'slash' | 'slash2' | 'thrust' | 'spin' | 'bow', progress (0..1), angle, pull, aimed }
 */
function heroActionPose(action, t, B) {
  if (!action || !action.type) return null;
  const p = rigClamp(action.progress || 0, 0, 1);
  const hipY = (B.thigh + B.shin) * 0.94;
  const shY = hipY + B.torso * 0.86;
  const chestY = hipY + B.torso * 0.62;
  const reach = (B.upperArm + B.foreArm) * 0.95;
  const out = { facing: action.angle, weapons: [], twist: 0, lean: 0, crouch: 0 };

  if (action.type === 'slash' || action.type === 'slash2') {
    const dirS = action.type === 'slash2' ? -1 : 1;
    const sw = heroSlashTheta(p, action.type);
    const th = sw.th;
    const rise = sw.rise;
    out.twist = th * 0.42;
    out.lean = p > 0.16 && p < 0.6 ? 0.18 : 0.06;
    out.crouch = p > 0.16 && p < 0.7 ? 0.18 : 0.05;
    const sh = rigRotY(rigV(B.shoulderW, shY, 0), out.twist, rigV(0, 0, 0));
    const armDir = rigNorm(rigV(Math.sin(th * 0.85), -0.3 + rise * 0.4, Math.cos(th * 0.85)));
    out.handR = rigAdd(sh, rigScale(armDir, reach));
    out.handL = rigV(-1.4, chestY - 0.6, 1.6);
    out.weapons.push({ hand: out.handR, dir: rigNorm(rigV(Math.sin(th), rise, Math.cos(th))) });
    out.trail = { th, dirS, p };
  } else if (action.type === 'thrust') {
    let z;
    if (p < 0.2) z = heroLerp(0.6, -1.4, rigEaseOut(p / 0.2));
    else if (p < 0.42) z = heroLerp(-1.4, 4.4, rigEaseOut((p - 0.2) / 0.22));
    else z = heroLerp(4.4, 1.2, rigEaseInOut((p - 0.42) / 0.58));
    const ext = rigClamp(z / 4.4, 0, 1);
    out.twist = -0.45 * ext;
    out.lean = 0.3 * ext;
    out.crouch = 0.25 * ext;
    out.handR = rigV(0.7, chestY + 0.4, z);
    out.handL = rigV(-2.4, chestY - 0.8, -1.2 * ext);
    out.weapons.push({ hand: out.handR, dir: rigV(0, 0.04, 1) });
  } else if (action.type === 'spin') {
    out.facing = (action.angle || 0) + t * 30;
    out.crouch = 0.22;
    out.handR = rigV(4.6, shY - 0.4, 0.9);
    out.handL = rigV(-4.6, shY - 0.4, -0.9);
    out.weapons.push({ hand: out.handR, dir: rigNorm(rigV(1, 0.06, 0.35)) });
    out.weapons.push({ hand: out.handL, dir: rigNorm(rigV(-1, 0.06, -0.35)) });
  } else if (action.type === 'bow') {
    const pull = rigClamp(action.pull === undefined ? 1 : action.pull, 0, 1);
    out.twist = 0.42;
    out.handL = rigV(-0.5, shY - 0.1, 4.2);
    out.handR = rigV(-0.2, shY + 0.1, 4.0 - 3.4 * pull);
    out.bow = { hand: out.handL, string: out.handR, aimed: Boolean(action.aimed), pull };
    out.elbowPoleR = rigV(1, 0.4, -1);
  }
  return out;
}

/**
 * Schwungkurve eines Hiebs: Winkel th in der Bodenebene relativ zur Blickrichtung
 * (+ = rechte Körperseite) und Klingenneigung rise. Ausholen -> schneller Schlag -> Nachschwingen.
 */
export function heroSlashTheta(p, type) {
  const dirS = type === 'slash2' ? -1 : 1;
  let th;
  let rise;
  if (p < 0.16) {
    const k = rigEaseOut(p / 0.16);
    th = heroLerp(0.9, 1.8, k);
    rise = heroLerp(0.2, 0.55, k);
  } else if (p < 0.5) {
    const k = rigEaseOut((p - 0.16) / 0.34);
    th = heroLerp(1.8, -1.5, k);
    rise = heroLerp(0.55, -0.35, k);
  } else {
    const k = rigEaseInOut((p - 0.5) / 0.5);
    th = heroLerp(-1.5, -1.1, k);
    rise = heroLerp(-0.35, -0.2, k);
  }
  return { th: th * dirS, rise };
}

/**
 * Leuchtende Schwungspur (Smear) passend zur Klinge in der Hand des Helden.
 * action wie bei den Render-Funktionen; opts.color / opts.edge als 'r,g,b', opts.radius
 */
export function renderHeroSwingTrail(ctx, px, py, action, opts = {}) {
  if (!action || !action.type) return;
  const cx = px;
  const cy = py - 8;
  const A = action.angle || 0;
  const col = opts.color || '226,240,255';
  const edge = opts.edge || '255,255,255';
  const p = rigClamp(action.progress || 0, 0, 1);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (action.type === 'slash' || action.type === 'slash2') {
    if (p < 0.15 || p > 0.72) { ctx.restore(); return; }
    const fade = p > 0.5 ? 1 - (p - 0.5) / 0.22 : 1;
    const head = heroSlashTheta(p, action.type).th;
    const tail = heroSlashTheta(Math.max(0.16, p - 0.24), action.type).th;
    const Rout = opts.radius || 14.5;
    const N = 16;
    const outer = [];
    const inner = [];
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const phi = A + tail + (head - tail) * f;
      const ro = Rout * (0.82 + 0.18 * f);
      const ri = ro - (1 + 5.5 * f);
      outer.push([cx + Math.cos(phi) * ro, cy + Math.sin(phi) * ro * 0.55]);
      inner.push([cx + Math.cos(phi) * ri, cy + Math.sin(phi) * ri * 0.55]);
    }
    const g = ctx.createLinearGradient(outer[0][0], outer[0][1], outer[N][0], outer[N][1]);
    g.addColorStop(0, `rgba(${col},0)`);
    g.addColorStop(1, `rgba(${col},${0.7 * fade})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(outer[0][0], outer[0][1]);
    for (let i = 1; i <= N; i++) ctx.lineTo(outer[i][0], outer[i][1]);
    for (let i = N; i >= 0; i--) ctx.lineTo(inner[i][0], inner[i][1]);
    ctx.closePath();
    ctx.fill();
    const ge = ctx.createLinearGradient(outer[0][0], outer[0][1], outer[N][0], outer[N][1]);
    ge.addColorStop(0, `rgba(${edge},0)`);
    ge.addColorStop(1, `rgba(${edge},${0.95 * fade})`);
    ctx.strokeStyle = ge;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(outer[0][0], outer[0][1]);
    for (let i = 1; i <= N; i++) ctx.lineTo(outer[i][0], outer[i][1]);
    ctx.stroke();
  } else if (action.type === 'thrust') {
    if (p < 0.22 || p > 0.62) { ctx.restore(); return; }
    const ext = rigClamp((p - 0.22) / 0.2, 0, 1);
    const fade = p > 0.42 ? 1 - (p - 0.42) / 0.2 : 1;
    const ca = Math.cos(A);
    const sa = Math.sin(A) * 0.55;
    const nx = -Math.sin(A);
    const ny = Math.cos(A) * 0.55;
    const len = 6 + ext * 15;
    for (let k = -1; k <= 1; k++) {
      const off = k * 2.6;
      const sx = cx + nx * off + ca * 4;
      const sy = cy + ny * off + sa * 4;
      const ex = sx + ca * len * (k === 0 ? 1 : 0.7);
      const ey = sy + sa * len * (k === 0 ? 1 : 0.7);
      const g = ctx.createLinearGradient(sx, sy, ex, ey);
      g.addColorStop(0, `rgba(${col},0)`);
      g.addColorStop(1, `rgba(${k === 0 ? edge : col},${(k === 0 ? 0.9 : 0.55) * fade})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = k === 0 ? 1.6 : 0.8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(${col},${0.5 * fade})`;
    ctx.beginPath();
    ctx.arc(cx + ca * (len + 4), cy + sa * (len + 4), 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (action.type === 'spin') {
    const t = action.time || 0;
    const head = (action.angle || 0) + t * 30 + 1.38;
    const R = opts.radius || 15;
    const segs = 10;
    for (let i = 0; i < segs; i++) {
      const a0 = head - (i + 1) * 0.28;
      const a1 = head - i * 0.28;
      const alpha = (1 - i / segs) * 0.75;
      ctx.strokeStyle = `rgba(${opts.spinColor || '56,189,248'},${alpha})`;
      ctx.lineWidth = 3.2 * (1 - i / segs) + 0.6;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, R * 0.55, 0, a0, a1);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, R * 0.55, 0, a0 + Math.PI, a1 + Math.PI);
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(${edge},0.35)`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(cx, cy, R + 1.5, (R + 1.5) * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Schwert/Katana in der Hand */
function heroDrawBlade(r, hand, dir, W) {
  const len = W.len || 8.6;
  const grip0 = rigSub(hand, rigScale(dir, 1.1));
  const guard = rigAdd(hand, rigScale(dir, 0.85));
  const base = rigAdd(hand, rigScale(dir, 1.05));
  let tip = rigAdd(hand, rigScale(dir, len));
  if (W.curve) {
    // Leichte Katana-Krümmung: Spitze etwas nach oben
    tip = rigAdd(tip, rigV(0, W.curve, 0));
  }
  r.capsule(grip0, guard, 0.42, 0.42, W.grip || '#7f1d1d', { bias: 0.02 });
  r.capsule(base, tip, W.bladeW || 0.55, 0.16, W.blade || '#e2e8f0', { light: 0.55, bias: 0.04, inkColor: W.bladeInk || '#475569' });
  r.ball(guard, 0.72, W.guard || '#fbbf24', { sy: 0.65, gloss: 0.45, bias: 0.05 });
  r.ball(grip0, 0.42, W.guard || '#fbbf24', { bias: 0.05, gloss: 0 });
  if (W.glow) r.glow(rigLerp(base, tip, 0.55), 3.4, W.glow, { alpha: 0.55 });
}

/** Bogen mit Sehne und Pfeil */
function heroDrawBow(r, bow, W) {
  const h = bow.hand;
  const top = rigAdd(h, rigV(0, 4.6, -1.0));
  const bot = rigAdd(h, rigV(0, -4.6, -1.0));
  const midT = rigAdd(h, rigV(0, 2.6, 0.35));
  const midB = rigAdd(h, rigV(0, -2.6, 0.35));
  const wood = bow.aimed ? '#38bdf8' : (W.bow || '#a16207');
  r.line([top, midT, h, midB, bot], wood, 0.75, { bias: 0.1 });
  r.line([top, bow.string, bot], bow.aimed ? '#e0f2fe' : '#f8fafc', 0.22, { smooth: false, outline: false, bias: 0.08 });
  const tip = rigAdd(h, rigV(0, 0, 2.6));
  r.line([bow.string, tip], bow.aimed ? '#7dd3fc' : '#e2e8f0', 0.32, { smooth: false, bias: 0.12 });
  r.poly([rigAdd(tip, rigV(0, 0, 1.1)), rigAdd(tip, rigV(0.55, 0, -0.2)), rigAdd(tip, rigV(-0.55, 0, -0.2))], bow.aimed ? '#38bdf8' : '#fef08a', { smooth: false, bias: 0.13 });
  if (bow.aimed) r.glow(tip, 3.5, 'rgba(56,189,248,0.9)', { alpha: 0.7 });
}

/**
 * Rahmen für jeden Helden: Pose berechnen, Skelett lösen, Design zeichnen, Waffen ergänzen.
 * D: { build, weapon, draw(r, sk, ctx, t, info) }
 */
function heroRender(D, ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  const B = D.B || (D.B = Object.assign({}, HERO_BUILD, D.build || {}));
  const pose = heroActionPose(action, animTime, B);
  const facing = pose && pose.facing !== undefined ? pose.facing : direction;
  const r = RIG.begin(ctx, px, py, {
    facing,
    flash: hitFlash > 0 ? 0.6 : 0,
    flashColor: '#f87171'
  });
  if (!D.noShadow) r.shadow(D.shadowW || 7, 2.8, 0.3, 0, 0.4);

  const moving = Boolean(isMoving) && !(pose && (pose.bow || action.type === 'spin'));
  const hover = D.hover ? Math.sin(animTime * 3) * 0.8 + D.hover : 0;
  const sk = rigBiped(animTime, Object.assign({}, B, {
    moving,
    handR: pose && pose.handR,
    handL: pose && pose.handL,
    twist: pose ? pose.twist : 0,
    extraLean: pose ? pose.lean : 0,
    crouch: pose ? pose.crouch : 0,
    elbowPoleR: pose && pose.elbowPoleR
  }));
  if (hover) {
    // Schwebende Geister: ganzes Skelett anheben
    for (const k of Object.keys(sk)) {
      const v = sk[k];
      if (v && typeof v === 'object' && 'y' in v) v.y += hover;
    }
  }
  sk.H = rigV(sk.head.x, sk.neck.y + B.headUp, sk.head.z + 0.25);
  sk.R = B.headR;
  sk.shY = (sk.shR.y + sk.shL.y) / 2;
  const info = { t: animTime, moving, pose, action, blink: heroBlink(animTime, D.blinkOffset || 0), B };
  D.draw(r, sk, ctx, animTime, info);

  if (pose) {
    const W = D.weapon || {};
    for (const w of pose.weapons) heroDrawBlade(r, w.hand, w.dir, W);
    if (pose.bow) heroDrawBow(r, pose.bow, W);
  }
  r.flush();
}

// -----------------------------------------------------------------------------
// KÖRPERTEIL-BAUSTEINE
// -----------------------------------------------------------------------------

/** Beine mit Hose und Schuhen. o: shin (Unterschenkel-Farbe, z.B. Wickelgamaschen), toe (Fußlänge) */
function heroLegs(r, sk, pants, shoes, o = {}) {
  const sides = ['R', 'L'];
  for (const S of sides) {
    const hip = sk['hip' + S];
    const knee = sk['knee' + S];
    const ankle = sk['ankle' + S];
    const foot = sk['foot' + S];
    r.capsule(hip, knee, o.thighR || 1.05, o.kneeR || 0.92, pants);
    r.capsule(knee, ankle, o.kneeR || 0.92, o.ankleR || 0.78, o.shin || pants);
    if (o.wrap) {
      // Wickelbänder um den Unterschenkel
      const m1 = rigLerp(knee, ankle, 0.35);
      const m2 = rigLerp(knee, ankle, 0.7);
      r.line([rigAdd(m1, rigV(-0.9, 0.2, 0.3)), rigAdd(m1, rigV(0.9, -0.2, 0.4))], o.wrap, 0.3, { outline: false, bias: 0.05 });
      r.line([rigAdd(m2, rigV(-0.8, 0.2, 0.3)), rigAdd(m2, rigV(0.8, -0.2, 0.4))], o.wrap, 0.3, { outline: false, bias: 0.05 });
    }
    if (shoes) {
      const heel = rigAdd(foot, rigV(0, 0.55, -0.35));
      const toe = rigAdd(foot, rigV(0, 0.45, o.toe || 0.8));
      r.capsule(heel, toe, 0.78, 0.7, shoes);
    }
  }
}

/** Arme mit Ärmeln und Händen. o: wide (weiter Kimono-Ärmel-Farbe), cuff, handR, glove */
function heroArms(r, sk, sleeve, skin, o = {}) {
  for (const S of ['R', 'L']) {
    const sh = sk['sh' + S];
    const el = sk['elbow' + S];
    const hand = sk['hand' + S];
    r.capsule(sh, el, o.upperR || 0.95, 0.8, sleeve);
    r.capsule(el, hand, 0.8, 0.68, o.fore || sleeve);
    if (o.wide) {
      // Weiter Ärmel hängt vom Unterarm herab und schwingt nach
      const sag = rigV(0, -1.9, -0.4);
      r.poly([
        rigAdd(sh, rigV(0, -0.3, 0)),
        el,
        rigLerp(el, hand, 0.75),
        rigAdd(rigLerp(el, hand, 0.7), sag),
        rigAdd(el, rigAdd(sag, rigV(0, 0.4, -0.2)))
      ], o.wide, { bias: 0.03 });
    }
    if (o.cuff) r.ball(rigLerp(el, hand, 0.82), 0.72, o.cuff, { sy: 0.8, gloss: 0, bias: 0.02 });
    r.ball(hand, o.handR || 0.78, o.glove || skin, { gloss: 0.2, bias: 0.06 });
  }
}

/** Oberkörper als Kegelstumpf (Schultern -> Becken). o: rt, rb, sz, hem, trim */
function heroTorso(r, sk, color, o = {}) {
  const top = rigLerp(sk.shR, sk.shL, 0.5);
  top.y += o.topUp === undefined ? 0.25 : o.topUp;
  const bot = rigAdd(sk.pelvis, rigV(0, o.botY === undefined ? -0.2 : o.botY, 0));
  r.cone(top, bot, o.rt || 2.3, o.rb || 2.0, color, { sz: o.sz || 0.78, hem: o.hem, hemW: o.hemW, bias: o.bias || 0, after: o.after });
}

/**
 * Gewand/Rock/Umhang ab Taille, Saum schwingt beim Laufen nach.
 * o: topY (über Becken), hemY (Höhe des Saums), rt, rb, trail, hem, hemW, sz
 */
function heroRobe(r, sk, color, t, moving, o = {}) {
  const ph = Math.sin(t * 14);
  const trail = moving ? (o.trail === undefined ? 0.9 : o.trail) : 0;
  const top = rigAdd(sk.pelvis, rigV(0, o.topY === undefined ? 1.0 : o.topY, 0));
  const bot = rigV(sk.pelvis.x * 0.5 + (moving ? ph * 0.35 : Math.sin(t * 1.6) * 0.12), o.hemY === undefined ? 1.0 : o.hemY, -trail + (o.botZ || 0));
  r.cone(top, bot, o.rt || 2.0, o.rb || 3.0, color, { sz: o.sz || 0.85, hem: o.hem, hemW: o.hemW || 0.8, bias: o.bias || 0.01, after: o.after });
}

/** Gürtel/Obi als schmaler Ring */
function heroSash(r, sk, color, o = {}) {
  const top = rigAdd(sk.pelvis, rigV(0, o.y1 === undefined ? 1.7 : o.y1, 0));
  const bot = rigAdd(sk.pelvis, rigV(0, o.y0 === undefined ? 0.7 : o.y0, 0));
  r.cone(top, bot, o.r || 2.1, o.r2 || (o.r || 2.1) * 1.03, color, { sz: o.sz || 0.82, bias: o.bias === undefined ? 0.08 : o.bias, shade: true, after: o.after });
}

/** Flatternde Bänder / Schärpen-Enden hinter der Figur */
function heroRibbon(r, base, t, moving, color, o = {}) {
  const dir = rigV(o.dx || 0, moving ? -0.6 : -0.9, moving ? -1 : -0.3);
  const pts = rigChain(t, base, dir, {
    n: o.n || 4, seg: o.seg || 1.25, amp: o.amp || (moving ? 0.9 : 0.4), ampY: o.ampY || 0.35,
    freq: o.freq || (moving ? 11 : 4), k: 0.9
  });
  r.line(pts, color, o.w || 0.7, { bias: o.bias || 0 });
  return pts;
}

/** Kopf mit Gesicht und Haaren; face/hair werden direkt nach der Kopfkugel gezeichnet */
function heroHead(r, sk, skin, face, hair, o = {}) {
  const H = sk.H;
  const R = sk.R * (o.scale || 1);
  r.ball(H, R, skin, {
    sy: o.sy || 0.95,
    sx: o.sx || 1,
    gloss: o.gloss === undefined ? 0.18 : o.gloss,
    bias: o.bias || 0,
    after: (ctx) => {
      if (face) face(ctx, H, R);
      if (hair) hair(ctx, H, R);
    }
  });
  return { H, R };
}

/** Standard-Ghibli-Gesicht: Augen, Wangenröte, kleiner Mund */
function heroFace(r, ctx, H, R, info, o = {}) {
  const eyeEl = o.eyeEl === undefined ? -0.12 : o.eyeEl;
  const eyeAz = o.eyeAz || 0.4;
  const eo = {
    style: o.style || 'round', color: o.eye || '#2b1d3a', size: o.size || 0.95,
    white: o.white, lid: o.lid, blink: info.blink, pupil: o.pupil, tall: o.tall
  };
  r.eye(ctx, H, R, eyeAz, eyeEl, eo);
  r.eye(ctx, H, R, -eyeAz, eyeEl, eo);
  if (o.blush !== false) {
    r.blush(ctx, H, R, 0.62, -0.38, o.blushColor || '#fb7185', 0.9);
    r.blush(ctx, H, R, -0.62, -0.38, o.blushColor || '#fb7185', 0.9);
  }
  if (o.mouth !== false) r.mouth(ctx, H, R, 0, -0.45, o.mouth || {});
}

/** Haarkante: Stirnfransen vorne, tiefer an den Seiten, ganz unten hinten */
function heroHairEdge(front = 0.3, side = -0.25, back = -0.95, spikes = 0.14, count = 7) {
  return (az) => {
    const a = Math.abs(az);
    let base;
    if (a < 1.3) base = heroLerp(front, side, a / 1.3);
    else base = heroLerp(side, back, (a - 1.3) / (HERO_PI - 1.3));
    if (spikes && a < 1.5) {
      const saw = Math.abs(((az * count) / HERO_PI) % 1);
      base -= (saw < 0.5 ? saw : 1 - saw) * 2 * spikes;
    }
    return base;
  };
}

/** Spitzes Ohr / Horn als Kegel auf der Kopfkugel (wirkt aus jeder Richtung räumlich) */
function heroEar(r, H, R, az, el, color, o = {}) {
  const w = o.w || 0.32;
  const len = o.len || 3.2;
  const base = rigSurfPt(H, R * 0.92, az, el);
  const n = rigNorm(rigSub(rigSurfPt(H, R, az, el), H));
  const tilt = o.tilt || rigV(0, 0.6, 0);
  const tip = rigAdd(base, rigScale(rigNorm(rigAdd(n, tilt)), len));
  const rb = w * R;
  r.cone(tip, base, 0.08, rb, color, { sz: o.flat || 0.55, bias: o.bias || 0 });
  if (o.inner && r.toCam(rigNorm(rigAdd(n, rigV(0, 0, 0.4)))) > 0.05) {
    const side = rigNorm(rigCross(rigNorm(rigSub(tip, base)), rigV(0, 0, 1)));
    const fwd = rigScale(rigNorm(rigAdd(rigV(n.x, 0, n.z), rigV(0, 0, 0.6))), 0.35);
    const a = rigAdd(rigAdd(base, rigScale(side, rb * 0.5)), fwd);
    const b = rigAdd(rigAdd(base, rigScale(side, -rb * 0.5)), fwd);
    r.poly([a, rigAdd(rigLerp(base, tip, 0.72), fwd), b], o.inner, { smooth: false, outline: false, bias: (o.bias || 0) + 0.3 });
  }
  if (o.tipColor) r.cone(tip, rigLerp(base, tip, 0.62), 0.08, rb * 0.42, o.tipColor, { sz: o.flat || 0.55, bias: (o.bias || 0) + 0.02 });
  return tip;
}

/** Punkte (Sterne, Sommersprossen, Muster) auf einer Zylinder-/Kegelfläche, nur auf der sichtbaren Seite */
function heroSpeckles(r, center, radius, yFrom, yTo, list, color, o = {}) {
  for (const sp of list) {
    const az = sp[0];
    const y = yFrom + (yTo - yFrom) * sp[1];
    const n = rigV(Math.sin(az), 0, Math.cos(az));
    if (r.toCam(n) < 0.1) continue;
    const rad = radius(sp[1]);
    const p = rigV(center.x + n.x * rad, y, center.z + n.z * rad);
    const P = r.P(p);
    const size = (sp[2] || 1) * (o.size || 0.45);
    r.custom(P.d + (o.bias || 0.3), (ctx, rr) => {
      ctx.save();
      ctx.fillStyle = rr.col(color);
      if (o.star) {
        const s = size * rr.s;
        ctx.beginPath();
        ctx.moveTo(P.x, P.y - s * 1.6);
        ctx.lineTo(P.x + s * 0.45, P.y - s * 0.45);
        ctx.lineTo(P.x + s * 1.6, P.y);
        ctx.lineTo(P.x + s * 0.45, P.y + s * 0.45);
        ctx.lineTo(P.x, P.y + s * 1.6);
        ctx.lineTo(P.x - s * 0.45, P.y + s * 0.45);
        ctx.lineTo(P.x - s * 1.6, P.y);
        ctx.lineTo(P.x - s * 0.45, P.y - s * 0.45);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(P.x, P.y, size * rr.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }
}

/** Buschiger Schwanz aus überlappenden Kugeln entlang einer Kette */
function heroTail(r, base, t, moving, color, tipColor, o = {}) {
  const dir = o.dir || rigV(0, moving ? 0.25 : 0.6, -1);
  const pts = rigChain(t + (o.phase || 0), base, dir, {
    n: o.n || 5, seg: o.seg || 1.1, amp: o.amp || (moving ? 1.1 : 0.7), ampY: o.ampY || 0.4,
    freq: o.freq || (moving ? 9 : 3.2), k: 0.7
  });
  const r0 = o.r0 || 0.9;
  const r1 = o.r1 || 1.6;
  for (let i = 1; i < pts.length; i++) {
    const f = i / (pts.length - 1);
    const rad = o.taper ? heroLerp(r0, r1 * 0.4, f) : heroLerp(r0, r1, Math.sin(f * HERO_PI * 0.85));
    const col = tipColor && f > (o.tipFrom || 0.7) ? tipColor : color;
    r.ball(pts[i], rad, col, { gloss: 0.15, bias: o.bias || 0 });
  }
  return pts;
}

/** Band um den Kopf (Stirnband, Tiara, Hutband) - nur der sichtbare Bogen wird gezeichnet */
function heroBand(r, ctx, H, R, el, color, width, o = {}) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const az = -HERO_PI + (i / 24) * HERO_PI * 2;
    const P = r.surf(H, R, az, el + (o.dip ? Math.cos(az) * o.dip : 0), 1);
    if (P.v > -0.05) pts.push(P);
  }
  if (pts.length < 2) return;
  pts.sort((a, b) => a.x - b.x);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = r.inkCol(color);
  ctx.lineWidth = (width + r.ink * 1.6) * r.s;
  ctx.stroke();
  ctx.strokeStyle = r.col(color);
  ctx.lineWidth = width * r.s;
  ctx.stroke();
  ctx.restore();
}

// -----------------------------------------------------------------------------
// 15 HELDEN-DESIGNS
// -----------------------------------------------------------------------------

// 1. REN (Schattengänger) - Kapuzenumhang aus Indigo-Papier, Porzellanmaske, Geisteraugen
const HERO_REN = {
  weapon: { blade: '#e2e8f0', grip: '#b91c1c', guard: '#94a3b8', glow: 'rgba(45,212,191,0.8)' },
  draw(r, sk, ctx, t, info) {
    const cloak = '#26335a';
    const cloakDark = '#1a2340';
    heroLegs(r, sk, '#2a3142', '#3b2a1e', { wrap: '#cbd5e1' });
    // Umhang: weiter Kegel vom Hals bis knapp über die Knöchel
    const neck = rigAdd(rigLerp(sk.shR, sk.shL, 0.5), rigV(0, 0.6, -0.2));
    const hem = rigV(sk.pelvis.x * 0.4 + (info.moving ? Math.sin(t * 14) * 0.4 : 0), 1.5, info.moving ? -1.3 : -0.2);
    r.cone(neck, hem, 1.7, 3.9, cloak, { sz: 0.85, hem: '#3b4c80', hemW: 0.7, bias: 0 });
    // Papierfalz-Linie vorne
    r.line([rigAdd(neck, rigV(0, -0.4, 1.3)), rigAdd(rigLerp(neck, hem, 0.85), rigV(0, 0, 3.0))], '#3b4c80', 0.25, { outline: false, bias: 0.04, smooth: false });
    // Roter Obi + zwei lange Bänder
    heroSash(r, sk, '#dc2626', { y1: 2.0, y0: 0.9, r: 2.75, sz: 0.88, bias: 0.06 });
    const knot = rigAdd(sk.pelvis, rigV(0, 1.4, -2.4));
    heroRibbon(r, knot, t, info.moving, '#ef4444', { n: 3, seg: 1.2, w: 0.85, dx: 0.5 });
    heroRibbon(r, rigAdd(knot, rigV(-0.5, 0, 0)), t + 0.4, info.moving, '#b91c1c', { n: 3, seg: 1.0, w: 0.75, dx: -0.5 });
    heroArms(r, sk, cloakDark, '#f1f5f9', { cuff: '#cbd5e1', glove: '#e2e8f0' });
    // Kopf: weiße Porzellanmaske mit Geisteraugen, Kapuze darüber
    heroHead(r, sk, '#eef2f7', (c, H, R) => {
      r.eye(c, H, R, 0.38, -0.08, { style: 'glow', color: '#2dd4bf', size: 0.95, blink: info.blink });
      r.eye(c, H, R, -0.38, -0.08, { style: 'glow', color: '#2dd4bf', size: 0.95, blink: info.blink });
      // Zinnoberrote Maskenstriche
      r.mark(c, H, R, 0.62, -0.42, (cc, P, sq, s) => {
        cc.strokeStyle = r.col('#dc2626'); cc.lineWidth = 0.45 * s;
        cc.beginPath(); cc.moveTo(P.x - 0.6 * s * sq, P.y - 0.5 * s); cc.lineTo(P.x + 0.4 * s * sq, P.y + 0.6 * s); cc.stroke();
      });
      r.mark(c, H, R, -0.62, -0.42, (cc, P, sq, s) => {
        cc.strokeStyle = r.col('#dc2626'); cc.lineWidth = 0.45 * s;
        cc.beginPath(); cc.moveTo(P.x + 0.6 * s * sq, P.y - 0.5 * s); cc.lineTo(P.x - 0.4 * s * sq, P.y + 0.6 * s); cc.stroke();
      });
    }, (c, H, R) => {
      r.cap(c, H, R, heroHairEdge(0.62, -0.2, -1.45, 0.05, 3), cloak, { grow: 1.12 });
    });
    // Kapuzenzipfel weht nach hinten
    const sway = Math.sin(t * (info.moving ? 10 : 2.5)) * 0.5;
    const base1 = rigSurfPt(sk.H, sk.R * 1.05, HERO_PI - 0.5, 0.55);
    const base2 = rigSurfPt(sk.H, sk.R * 1.05, HERO_PI + 0.5, 0.55);
    const tip = rigAdd(sk.H, rigV(sway, sk.R * 0.9, -sk.R * 1.9 - (info.moving ? 0.8 : 0)));
    r.poly([base1, rigAdd(rigLerp(base1, tip, 0.5), rigV(0, 0.8, 0)), tip, base2], cloak, { bias: -0.2 });
  }
};

// 2. KAITO (Windläufer) - asymmetrischer Moos-Poncho, Lederriemen, Windzopf mit Falkenfeder
const HERO_KAITO = {
  blinkOffset: 0.7,
  weapon: { blade: '#e7e5e4', grip: '#78350f', guard: '#15803d' },
  draw(r, sk, ctx, t, info) {
    const skin = '#f2c49b';
    heroLegs(r, sk, '#8a6a45', '#4a3222', { shin: '#a58660', wrap: '#5b4330' });
    heroTorso(r, sk, '#e7dcc3', { rt: 2.2, rb: 1.9 });
    heroArms(r, sk, '#e7dcc3', skin, { fore: '#d6c7a6', cuff: '#78350f' });
    // Asymmetrischer Poncho: rechts kurz, links lang, schwingt im Wind
    const neck = rigAdd(rigLerp(sk.shR, sk.shL, 0.5), rigV(0, 0.7, 0));
    const wind = info.moving ? -1.0 : Math.sin(t * 1.7) * 0.2;
    const hem = rigV(sk.pelvis.x * 0.4 - 0.7, sk.pelvis.y + 0.2, wind);
    r.cone(neck, hem, 1.5, 3.4, '#2f7d43', { sz: 0.82, hem: '#1f5a30', hemW: 0.6, bias: 0.05,
      after: (c, T, Bt, rr) => {
        // Moos-Muster: kleine hellgrüne Flecken
        c.save(); c.fillStyle = rr.col('#4ade80'); c.globalAlpha *= 0.55;
        c.beginPath(); c.arc(Bt.x - 1.2 * rr.s, Bt.y - 2.2 * rr.s, 0.5 * rr.s, 0, 6.29); c.arc(Bt.x + 0.8 * rr.s, Bt.y - 3.3 * rr.s, 0.4 * rr.s, 0, 6.29); c.fill();
        c.restore();
      } });
    // Lederriemen quer über die Brust mit Messingschnalle
    const s1 = rigAdd(sk.shR, rigV(0, 0.4, 0.9));
    const s2 = rigAdd(sk.pelvis, rigV(-1.9, 0.9, 1.9));
    r.line([s1, rigLerp(s1, s2, 0.5), s2], '#7c4a24', 0.55, { bias: 0.4, smooth: false });
    r.ball(rigLerp(s1, s2, 0.45), 0.42, '#f59e0b', { bias: 0.45, gloss: 0.5 });
    heroHead(r, sk, skin, (c, H, R) => {
      heroFace(r, c, H, R, info, { eye: '#166534', white: true, size: 0.85, lid: '#3f2a1d', mouth: { w: 0.7 } });
    }, (c, H, R) => {
      r.cap(c, H, R, heroHairEdge(0.32, -0.15, -1.0, 0.18, 6), '#4a2f1d', { grow: 1.08 });
    });
    // Windzopf: hoher Pferdeschwanz, der stark im Wind flattert
    const root = rigSurfPt(sk.H, sk.R, HERO_PI, 0.75);
    r.ball(root, 0.85, '#4a2f1d', { bias: -0.05 });
    heroTail(r, root, t, info.moving, '#4a2f1d', '#6b4429', { taper: true, r0: 0.85, r1: 1.0, n: 5, seg: 0.9, tipFrom: 0.8,
      dir: rigV(0.2, info.moving ? -0.15 : -0.8, -1), amp: info.moving ? 0.9 : 0.35, freq: info.moving ? 12 : 3 });
    // Falkenfeder hinter dem rechten Ohr
    const fBase = rigSurfPt(sk.H, sk.R, 1.7, 0.25);
    const fTip = rigAdd(fBase, rigV(1.1, 2.6 + Math.sin(t * 5) * 0.2, -1.4));
    r.poly([fBase, rigAdd(rigLerp(fBase, fTip, 0.5), rigV(0.5, 0, 0.2)), fTip, rigAdd(rigLerp(fBase, fTip, 0.5), rigV(-0.4, 0, -0.2))], '#f5e6c8', { bias: 0.1 });
    r.line([rigLerp(fBase, fTip, 0.55), fTip], '#b45309', 0.5, { outline: false, bias: 0.15, smooth: false });
  }
};

// 3. JIRO (Papier-Ronin) - breiter Kasa-Strohhut, schwarzer Kimono, violetter Hakama, Katana an der Hüfte
const HERO_JIRO = {
  blinkOffset: 1.9,
  weapon: { blade: '#f8fafc', grip: '#1f2937', guard: '#fbbf24', curve: 0.9, len: 9.6, bladeW: 0.5 },
  draw(r, sk, ctx, t, info) {
    const skin = '#eec39a';
    heroLegs(r, sk, '#2d1b4e', '#3b2416', { toe: 0.9 });
    heroRobe(r, sk, '#3b1d5c', t, info.moving, { topY: 1.5, hemY: 1.1, rt: 2.1, rb: 3.2, hem: '#2a1245', trail: 0.6 });
    heroTorso(r, sk, '#1c2333', { rt: 2.4, rb: 2.1,
      after: (c, T, Bt, rr) => {
        // Kimono-Kragen (V-Ausschnitt)
        const v = rr.toCam(rigV(0, 0, 1));
        if (v < 0.1) return;
        c.save(); c.strokeStyle = rr.col('#f1f5f9'); c.lineWidth = 0.5 * rr.s;
        c.beginPath(); c.moveTo(T.x - 1.3 * rr.s * v, T.y + 0.2 * rr.s); c.lineTo(T.x, T.y + 3.2 * rr.s); c.lineTo(T.x + 1.3 * rr.s * v, T.y + 0.2 * rr.s); c.stroke();
        c.restore();
      } });
    heroSash(r, sk, '#e5e7eb', { y1: 1.9, y0: 1.1, r: 2.25 });
    heroArms(r, sk, '#1c2333', skin, { wide: '#1c2333' });
    // Katana in der Scheide (nur sichtbar, wenn nicht gekämpft wird)
    if (!info.pose || !info.pose.weapons.length) {
      const sA = rigAdd(sk.pelvis, rigV(-2.3, 1.5, 2.2));
      const sB = rigAdd(sk.pelvis, rigV(-2.6, 0.4, -4.4));
      r.line([sA, sB], '#111827', 0.7, { smooth: false, bias: 0.1 });
      r.line([rigAdd(sA, rigV(0, 0.3, 1.8)), sA], '#7c2d12', 0.55, { smooth: false, bias: 0.12 });
      r.ball(sA, 0.6, '#fbbf24', { sy: 0.6, bias: 0.13, gloss: 0.4 });
    }
    heroHead(r, sk, skin, (c, H, R) => {
      heroFace(r, c, H, R, info, { eye: '#fbbf24', style: 'slit', size: 0.8, lid: '#111827', blush: false, mouth: { smile: false, w: 0.6 } });
      // kleine Narbe über dem linken Auge
      r.mark(c, H, R, -0.42, 0.12, (cc, P, sq, s) => {
        cc.strokeStyle = r.col('#b45309'); cc.lineWidth = 0.3 * s;
        cc.beginPath(); cc.moveTo(P.x - 0.4 * s * sq, P.y - 0.6 * s); cc.lineTo(P.x + 0.3 * s * sq, P.y + 0.6 * s); cc.stroke();
      });
    }, (c, H, R) => {
      r.cap(c, H, R, heroHairEdge(0.38, -0.3, -1.1, 0.1, 5), '#111827', { grow: 1.05 });
    });
    // Kasa-Hut: flacher Kegel mit Flechtringen und Kinnband
    const tilt = info.moving ? Math.sin(t * 14) * 0.15 : 0;
    const hatTop = rigAdd(sk.H, rigV(tilt, sk.R * 1.35, -0.6));
    const hatBot = rigAdd(sk.H, rigV(0, sk.R * 0.72, -sk.R * 0.4));
    r.cone(hatTop, hatBot, 0.25, sk.R * 1.5, '#c8913f', { sz: 1, bias: 0.6,
      after: (c, T, Bt, rr) => {
        c.save(); c.strokeStyle = rr.col('#8a5a24'); c.lineWidth = 0.28 * rr.s; c.globalAlpha *= 0.8;
        for (let i = 1; i <= 3; i++) {
          const f = i / 4;
          c.beginPath();
          c.ellipse(T.x + (Bt.x - T.x) * f, T.y + (Bt.y - T.y) * f, sk.R * 1.5 * f * rr.s, sk.R * 1.5 * f * rr.s * 0.5, 0, 0, Math.PI * 2);
          c.stroke();
        }
        c.restore();
      } });
    r.line([rigSurfPt(sk.H, sk.R, 1.3, -0.2), rigAdd(sk.H, rigV(0, -sk.R * 0.85, 0.9)), rigSurfPt(sk.H, sk.R, -1.3, -0.2)], '#7c2d12', 0.25, { outline: false, bias: 0.2 });
  }
};

// 4. TARO (Lampion-Schmied) - kräftig, Lederschürze, Kupferbrille, Glutaugen, Laterne am Gürtel
const HERO_TARO = {
  build: { shoulderW: 2.85, hipW: 1.5, torso: 5.2, upperArm: 2.3, foreArm: 2.2 },
  blinkOffset: 2.6,
  weapon: { blade: '#fdba74', grip: '#451a03', guard: '#d97706', glow: 'rgba(249,115,22,0.9)', len: 8.2, bladeW: 0.75 },
  draw(r, sk, ctx, t, info) {
    const skin = '#c98b5e';
    heroLegs(r, sk, '#3f3f46', '#292524', { thighR: 1.2, kneeR: 1.05, toe: 0.95 });
    heroTorso(r, sk, '#64748b', { rt: 2.8, rb: 2.3 });
    // Lederschürze vorne
    const a1 = rigAdd(sk.chest, rigV(1.7, 0.9, 1.9));
    const a2 = rigAdd(sk.chest, rigV(-1.7, 0.9, 1.9));
    const k1 = rigV(sk.kneeR.x + 0.4, sk.kneeR.y - 0.4, Math.max(sk.kneeR.z, sk.kneeL.z) + 1.4);
    const k2 = rigV(sk.kneeL.x - 0.4, sk.kneeL.y - 0.4, Math.max(sk.kneeR.z, sk.kneeL.z) + 1.4);
    r.poly([a1, rigAdd(sk.pelvis, rigV(2.4, 0.6, 2.2)), k1, rigLerp(k1, k2, 0.5), k2, rigAdd(sk.pelvis, rigV(-2.4, 0.6, 2.2)), a2], '#7c2d12', { bias: 0.35, smooth: false,
      after: (c, Ps, rr) => {
        c.save(); c.strokeStyle = rr.col('#fbbf24'); c.lineWidth = 0.25 * rr.s; c.setLineDash && c.setLineDash([0.6 * rr.s, 0.5 * rr.s]);
        c.beginPath(); c.moveTo(Ps[1].x, Ps[1].y); c.lineTo(Ps[2].x, Ps[2].y); c.moveTo(Ps[5].x, Ps[5].y); c.lineTo(Ps[4].x, Ps[4].y); c.stroke();
        c.setLineDash && c.setLineDash([]); c.restore();
      } });
    heroSash(r, sk, '#451a03', { y1: 1.4, y0: 0.7, r: 2.45 });
    // Kleine Papierlaterne am Gürtel (glüht)
    const lan = rigAdd(sk.pelvis, rigV(2.8, 0.2 + Math.sin(t * 6) * 0.15, 0.4));
    r.ball(lan, 0.95, '#ea580c', { sy: 1.15, gloss: 0.5, bias: 0.2 });
    r.glow(lan, 3.2, 'rgba(251,146,60,0.9)', { alpha: 0.5 + Math.sin(t * 9) * 0.1 });
    heroArms(r, sk, '#64748b', skin, { upperR: 1.1, fore: skin, cuff: '#7c2d12', glove: '#57351f' });
    heroHead(r, sk, skin, (c, H, R) => {
      heroFace(r, c, H, R, info, { eye: '#ea580c', pupil: '#7c2d12', white: true, size: 0.78, lid: '#3f2a1d', blush: false, mouth: { w: 0.8, smile: true } });
      // Bart-Stoppeln
      r.mark(c, H, R, 0, -0.62, (cc, P, sq, s) => {
        cc.fillStyle = r.col('#3f2a1d'); cc.globalAlpha *= 0.7;
        cc.beginPath(); cc.ellipse(P.x, P.y, 2.0 * s * sq, 0.8 * s, 0, 0, 6.29); cc.fill();
      }, 0.97);
    }, (c, H, R) => {
      r.cap(c, H, R, heroHairEdge(0.45, -0.1, -0.9, 0.22, 5), '#3f2a1d', { grow: 1.1 });
      heroBand(r, c, H, R * 1.1, 0.4, '#b91c1c', 0.75);
    });
    // Kupfer-Schweißerbrille auf der Stirn
    for (const az of [0.38, -0.38]) {
      const g = rigSurfPt(sk.H, sk.R * 1.12, az, 0.42);
      r.ball(g, 0.9, '#b45309', { gloss: 0.6, bias: 0.4, after: (c, P, rr) => {
        c.save(); c.fillStyle = rr.col('#164e63'); c.globalAlpha *= 0.9;
        c.beginPath(); c.arc(P.x, P.y, 0.55 * rr.s, 0, 6.29); c.fill(); c.restore();
      } });
    }
  }
};

// 5. SORA (Kirschblüten-Miko) - weißes Haori mit weiten Ärmeln, roter Hakama, langes Haar, Sakura-Blätter
const HERO_SORA = {
  blinkOffset: 0.3,
  weapon: { blade: '#fff1f2', grip: '#be123c', guard: '#fbbf24', glow: 'rgba(251,113,133,0.75)' },
  draw(r, sk, ctx, t, info) {
    const skin = '#fbe3d0';
    const hair = '#231a2e';
    heroLegs(r, sk, '#be123c', '#f8fafc', { toe: 0.7 });
    heroRobe(r, sk, '#c2183f', t, info.moving, { topY: 1.9, hemY: 0.9, rt: 2.0, rb: 3.35, hem: '#9f1239', hemW: 0.6, trail: 0.7 });
    heroTorso(r, sk, '#fdfbf7', { rt: 2.3, rb: 2.0,
      after: (c, T, Bt, rr) => {
        const v = rr.toCam(rigV(0, 0, 1));
        if (v < 0.1) return;
        c.save(); c.strokeStyle = rr.col('#e11d48'); c.lineWidth = 0.45 * rr.s;
        c.beginPath(); c.moveTo(T.x - 1.2 * rr.s * v, T.y + 0.2 * rr.s); c.lineTo(T.x, T.y + 2.8 * rr.s); c.lineTo(T.x + 1.2 * rr.s * v, T.y + 0.2 * rr.s); c.stroke();
        c.restore();
      } });
    heroSash(r, sk, '#e11d48', { y1: 2.1, y0: 1.5, r: 2.15 });
    // Lange Haare fallen über den Rücken bis zur Taille (unter dem Kopf gezeichnet)
    const hb = rigSurfPt(sk.H, sk.R * 0.9, HERO_PI, -0.1);
    const sway = info.moving ? -0.9 : Math.sin(t * 1.5) * 0.15;
    const hairBack = [
      rigAdd(hb, rigV(-2.6, 1.2, 0.8)), rigAdd(hb, rigV(2.6, 1.2, 0.8)),
      rigAdd(hb, rigV(2.9, -4.2, -0.4 + sway)), rigAdd(hb, rigV(1.2, -6.2, -0.9 + sway)),
      rigAdd(hb, rigV(-1.2, -6.2, -0.9 + sway)), rigAdd(hb, rigV(-2.9, -4.2, -0.4 + sway))
    ];
    r.poly(hairBack, hair, { bias: -0.6 });
    // Weiße Haarschleife (Mizuhiki)
    r.ball(rigAdd(hb, rigV(0, -2.4, -0.6 + sway * 0.4)), 0.8, '#f8fafc', { sx: 1.6, sy: 0.7, bias: -0.3 });
    heroArms(r, sk, '#fdfbf7', skin, { wide: '#fdfbf7' });
    // Rote Zierschnüre an den Ärmeln
    for (const S of ['R', 'L']) {
      r.ball(rigLerp(sk['elbow' + S], sk['hand' + S], 0.55), 0.38, '#e11d48', { bias: 0.1, gloss: 0 });
    }
    heroHead(r, sk, skin, (c, H, R) => {
      heroFace(r, c, H, R, info, { eye: '#4a1d2e', white: true, size: 0.95, lid: '#231a2e', tall: 1.35, mouth: { w: 0.55 } });
    }, (c, H, R) => {
      // Hime-Schnitt: gerade Stirnfransen und Seitensträhnen
      r.cap(c, H, R, (az) => {
        const a = Math.abs(az);
        if (a < 0.9) return 0.22;
        if (a < 1.5) return -0.75;
        return heroLerp(-0.75, -1.2, (a - 1.5) / (HERO_PI - 1.5));
      }, hair, { grow: 1.07, gloss: 0.45 });
    });
    // Kirschblüten-Haarschmuck
    const flower = rigSurfPt(sk.H, sk.R * 1.08, -1.15, 0.45);
    r.ball(flower, 0.85, '#fb7185', { bias: 0.3, gloss: 0.3, after: (c, P, rr) => {
      c.save(); c.fillStyle = rr.col('#fde047'); c.beginPath(); c.arc(P.x, P.y, 0.32 * rr.s, 0, 6.29); c.fill(); c.restore();
    } });
    // Schwebende Sakura-Blätter
    for (let i = 0; i < 2; i++) {
      const a = t * 1.4 + i * HERO_PI;
      const pp = rigV(Math.cos(a) * 5.5, 9 + Math.sin(t * 2 + i) * 2.5, Math.sin(a) * 4);
      const P = r.P(pp);
      r.custom(P.d, (c, rr) => {
        c.save(); c.translate(P.x, P.y); c.rotate(t * 2 + i);
        c.fillStyle = rr.col('#fda4af'); c.beginPath(); c.ellipse(0, 0, 0.9 * rr.s, 0.45 * rr.s, 0, 0, 6.29); c.fill();
        c.restore();
      });
    }
  }
};

// 6. KANNA (Wolfsprinzessin) - Wolfsfell-Kapuze mit Ohren, Pelzkragen, rote Kriegsbemalung, Eisaugen
const HERO_KANNA = {
  blinkOffset: 1.2,
  weapon: { blade: '#f5f5f4', grip: '#7c2d12', guard: '#e11d48', len: 7.6, bladeW: 0.65 },
  draw(r, sk, ctx, t, info) {
    const skin = '#f3d2b8';
    const pelt = '#dfe5ec';
    heroLegs(r, sk, '#334155', '#57534e', { wrap: '#a8a29e', shin: '#e7d8c9' });
    heroRobe(r, sk, '#1e293b', t, info.moving, { topY: 1.0, hemY: 2.6, rt: 2.0, rb: 2.8, hem: '#e11d48', hemW: 0.45, trail: 0.4 });
    heroTorso(r, sk, '#1e293b', { rt: 2.2, rb: 1.95 });
    heroArms(r, sk, '#1e293b', skin, { fore: skin, cuff: '#e11d48' });
    // Pelz-Schulterumhang mit gezackter Kante
    const neck = rigAdd(rigLerp(sk.shR, sk.shL, 0.5), rigV(0, 0.8, -0.2));
    r.cone(neck, rigAdd(sk.chest, rigV(0, -0.5, -0.4)), 2.0, 3.3, pelt, { sz: 0.85, bias: 0.15 });
    // Fellschwanz der Wolfsfell-Kapuze hängt hinten herab
    heroTail(r, rigAdd(sk.chest, rigV(0, 0.6, -2.6)), t, info.moving, pelt, '#94a3b8', { dir: rigV(0, -1, -0.45), n: 4, seg: 1.1, r0: 1.0, r1: 1.35, amp: 0.35, ampY: 0.1 });
    heroHead(r, sk, skin, (c, H, R) => {
      heroFace(r, c, H, R, info, { eye: '#38bdf8', pupil: '#0c4a6e', white: true, size: 0.9, lid: '#1e293b', blush: false, mouth: { w: 0.55, smile: false } });
      // Rote Kriegsbemalung: Dreiecke auf den Wangen
      for (const az of [0.62, -0.62]) {
        r.mark(c, H, R, az, -0.35, (cc, P, sq, s) => {
          cc.fillStyle = r.col('#e11d48');
          cc.beginPath(); cc.moveTo(P.x - 0.9 * s * sq, P.y - 0.4 * s); cc.lineTo(P.x + 0.9 * s * sq, P.y - 0.4 * s); cc.lineTo(P.x, P.y + 1.0 * s); cc.closePath(); cc.fill();
        });
      }
      r.mark(c, H, R, 0, 0.32, (cc, P, sq, s) => {
        cc.fillStyle = r.col('#e11d48');
        cc.beginPath(); cc.ellipse(P.x, P.y, 0.45 * s * sq, 0.75 * s, 0, 0, 6.29); cc.fill();
      });
    }, (c, H, R) => {
      r.cap(c, H, R, heroHairEdge(0.32, -0.3, -1.0, 0.16, 6), '#2a1f1a', { grow: 1.05 });
      r.cap(c, H, R, heroHairEdge(0.62, -0.05, -1.3, 0.06, 4), pelt, { grow: 1.16 });
    });
    // Wolfsohren und Schnauze der Fellkapuze
    heroEar(r, sk.H, sk.R * 1.12, 0.62, 0.72, pelt, { len: 2.6, w: 0.3, inner: '#475569', tilt: rigV(0, 0.3, -0.2) });
    heroEar(r, sk.H, sk.R * 1.12, -0.62, 0.72, pelt, { len: 2.6, w: 0.3, inner: '#475569', tilt: rigV(0, 0.3, -0.2) });
  }
};

// 7. AOI (Sternen-Weise) - Mitternachtsmantel mit Sternen, Mondsichel-Tiara, Schleier, Lichtfunken
const HERO_AOI = {
  blinkOffset: 2.2,
  weapon: { blade: '#fef9c3', grip: '#4c1d95', guard: '#fde047', glow: 'rgba(253,224,71,0.85)' },
  draw(r, sk, ctx, t, info) {
    const skin = '#f8e5dc';
    const robe = '#232062';
    heroLegs(r, sk, '#1e1b4b', '#c4b5fd', { toe: 0.7 });
    // Sternenmantel bis zum Boden
    heroRobe(r, sk, robe, t, info.moving, { topY: 1.2, hemY: 0.8, rt: 2.0, rb: 3.6, hem: '#fde047', hemW: 0.35, trail: 1.0 });
    heroSpeckles(r, sk.pelvis, (f) => heroLerp(2.2, 3.5, f), sk.pelvis.y + 0.6, 1.3,
      [[0.3, 0.3, 1.1], [-0.6, 0.5, 0.8], [1.2, 0.7, 0.9], [-1.4, 0.2, 1.0], [0.0, 0.8, 0.7], [2.2, 0.4, 0.9], [-2.4, 0.6, 0.8]],
      '#fde68a', { star: true, size: 0.42 });
    heroTorso(r, sk, robe, { rt: 2.2, rb: 2.0 });
    heroSash(r, sk, '#c084fc', { y1: 1.8, y0: 1.2, r: 2.1 });
    heroArms(r, sk, robe, skin, { wide: '#2e2a7a', cuff: '#fde047' });
    // Langes silber-lavendel Haar hinten
    const hb = rigSurfPt(sk.H, sk.R * 0.9, HERO_PI, 0);
    const sway = info.moving ? -1 : Math.sin(t * 1.3) * 0.2;
    r.poly([
      rigAdd(hb, rigV(-2.5, 1.0, 0.8)), rigAdd(hb, rigV(2.5, 1.0, 0.8)),
      rigAdd(hb, rigV(2.7, -4.6, -0.5 + sway)), rigAdd(hb, rigV(0, -5.6, -1 + sway)), rigAdd(hb, rigV(-2.7, -4.6, -0.5 + sway))
    ], '#d8dcf5', { bias: -0.6 });
    // Durchscheinender Schleier
    r.poly([
      rigSurfPt(sk.H, sk.R * 1.15, 1.6, 0.5), rigSurfPt(sk.H, sk.R * 1.15, HERO_PI, 0.75), rigSurfPt(sk.H, sk.R * 1.15, -1.6, 0.5),
      rigAdd(hb, rigV(-3.0, -5.5, -1.4 + sway)), rigAdd(hb, rigV(3.0, -5.5, -1.4 + sway))
    ], '#c084fc', { alpha: 0.45, bias: -0.4 });
    heroHead(r, sk, skin, (c, H, R) => {
      heroFace(r, c, H, R, info, { eye: '#7c3aed', pupil: '#2e1065', white: true, size: 0.95, lid: '#312e81', tall: 1.3, blushColor: '#c084fc', mouth: { w: 0.5 } });
    }, (c, H, R) => {
      r.cap(c, H, R, heroHairEdge(0.36, -0.55, -1.2, 0.08, 4), '#d8dcf5', { grow: 1.07, gloss: 0.5 });
      heroBand(r, c, H, R * 1.08, 0.42, '#fbbf24', 0.45, { dip: 0.08 });
    });
    // Goldene Mondsichel auf der Stirn
    const moon = rigSurfPt(sk.H, sk.R * 1.12, 0, 0.52);
    const MP = r.P(moon);
    r.custom(MP.d + 0.5, (c, rr) => {
      if (rr.toCam(rigV(0, 0.3, 1)) < 0.05) return;
      c.save(); c.fillStyle = rr.col('#fde047'); c.strokeStyle = rr.col('#a16207'); c.lineWidth = 0.25 * rr.s;
      c.beginPath(); c.arc(MP.x, MP.y, 1.1 * rr.s, 0.6, Math.PI * 2 - 0.6, false); c.arc(MP.x + 0.55 * rr.s, MP.y - 0.15 * rr.s, 0.85 * rr.s, Math.PI * 2 - 0.9, 0.9, true);
      c.closePath(); c.fill(); c.stroke(); c.restore();
    });
    // Schwebende Sternenfunken
    for (let i = 0; i < 3; i++) {
      const a = t * 0.9 + i * 2.1;
      r.glow(rigV(Math.cos(a) * 6, 8 + Math.sin(t * 1.7 + i * 2) * 3, Math.sin(a) * 5), 1.4, 'rgba(253,230,138,0.95)', { alpha: 0.6 + Math.sin(t * 5 + i) * 0.3 });
    }
  }
};

// 8. MEI (Kräuter-Nomadin) - salbeigrünes Kleid, Weidenkorb auf dem Rücken, Zöpfe mit Wiesenblüten
const HERO_MEI = {
  blinkOffset: 3.1,
  weapon: { blade: '#ecfccb', grip: '#78350f', guard: '#65a30d' },
  draw(r, sk, ctx, t, info) {
    const skin = '#f6d5b5';
    const hair = '#7a4220';
    heroLegs(r, sk, '#f3e8d0', '#92400e', { toe: 0.75, shin: '#f3e8d0' });
    heroRobe(r, sk, '#5f8f67', t, info.moving, { topY: 1.4, hemY: 2.0, rt: 2.0, rb: 3.1, hem: '#3f6b4a', trail: 0.7 });
    heroTorso(r, sk, '#5f8f67', { rt: 2.15, rb: 1.95 });
    // Cremefarbene Schürze vorne
    r.poly([
      rigAdd(sk.pelvis, rigV(1.6, 1.6, 2.0)), rigAdd(sk.pelvis, rigV(-1.6, 1.6, 2.0)),
      rigV(-1.9, 2.4, 2.9 + (info.moving ? Math.sin(t * 14) * 0.3 : 0)), rigV(1.9, 2.4, 2.9 + (info.moving ? Math.sin(t * 14) * 0.3 : 0))
    ], '#fdf6e3', { bias: 0.5 });
    heroSash(r, sk, '#92400e', { y1: 1.9, y0: 1.4, r: 2.05 });
    heroArms(r, sk, '#5f8f67', skin, { cuff: '#fdf6e3' });
    // Weidenkorb mit Kräutern auf dem Rücken
    const basket = rigAdd(sk.chest, rigV(0, 0.4, -3.0));
    r.cone(rigAdd(basket, rigV(0, 2.2, 0)), rigAdd(basket, rigV(0, -2.0, 0.3)), 2.2, 1.7, '#a16207', { sz: 0.75, bias: -0.2,
      after: (c, T, Bt, rr) => {
        c.save(); c.strokeStyle = rr.col('#713f12'); c.lineWidth = 0.25 * rr.s;
        for (let i = 1; i < 4; i++) {
          const y = T.y + (Bt.y - T.y) * (i / 4);
          c.beginPath(); c.moveTo(T.x - 2.2 * rr.s, y); c.lineTo(T.x + 2.2 * rr.s, y); c.stroke();
        }
        c.restore();
      } });
    for (let i = 0; i < 3; i++) {
      const lb = rigAdd(basket, rigV(-1 + i, 2.0, 0));
      const lt = rigAdd(lb, rigV((i - 1) * 0.8 + Math.sin(t * 3 + i) * 0.2, 2.2 + i * 0.3, -0.4));
      r.poly([lb, rigAdd(rigLerp(lb, lt, 0.5), rigV(0.6, 0, 0)), lt, rigAdd(rigLerp(lb, lt, 0.5), rigV(-0.6, 0, 0))], i === 1 ? '#84cc16' : '#22c55e', { bias: -0.25 });
    }
    r.ball(rigAdd(basket, rigV(0.8, 2.6, 0.2)), 0.55, '#c4b5fd', { bias: -0.15 });
    // Riemen über den Schultern
    r.line([rigAdd(sk.shR, rigV(0, 0.3, 0.3)), rigAdd(sk.chest, rigV(1.4, -1.2, 1.9))], '#78350f', 0.4, { bias: 0.4, smooth: false });
    r.line([rigAdd(sk.shL, rigV(0, 0.3, 0.3)), rigAdd(sk.chest, rigV(-1.4, -1.2, 1.9))], '#78350f', 0.4, { bias: 0.4, smooth: false });
    heroHead(r, sk, skin, (c, H, R) => {
      heroFace(r, c, H, R, info, { eye: '#713f12', white: true, size: 0.92, lid: '#422006', mouth: { w: 0.65 } });
      // Sommersprossen
      for (const az of [0.55, -0.55]) {
        r.mark(c, H, R, az, -0.22, (cc, P, sq, s) => {
          cc.fillStyle = r.col('#c2410c'); cc.globalAlpha *= 0.6;
          cc.beginPath(); cc.arc(P.x - 0.4 * s, P.y, 0.18 * s, 0, 6.29); cc.arc(P.x + 0.3 * s, P.y + 0.2 * s, 0.16 * s, 0, 6.29); cc.arc(P.x, P.y - 0.3 * s, 0.15 * s, 0, 6.29); cc.fill();
        });
      }
    }, (c, H, R) => {
      r.cap(c, H, R, heroHairEdge(0.36, -0.35, -1.1, 0.1, 5), hair, { grow: 1.07, gloss: 0.35 });
    });
    // Zwei Zöpfe mit Blüten
    for (const side of [1, -1]) {
      const root = rigSurfPt(sk.H, sk.R, side * 1.9, -0.45);
      const braid = rigChain(t + side, root, rigV(side * 0.2, -1, -0.15), { n: 4, seg: 0.95, amp: info.moving ? 0.35 : 0.12, freq: info.moving ? 12 : 3, k: 0.6 });
      for (let i = 1; i < braid.length; i++) r.ball(braid[i], 0.62 - i * 0.05, hair, { bias: -0.02, gloss: 0.2 });
      r.ball(rigAdd(braid[braid.length - 1], rigV(0, -0.5, 0)), 0.38, '#fde047', { bias: 0.02 });
      r.ball(rigAdd(root, rigV(side * 0.4, 0.2, 0)), 0.7, '#fde047', { bias: 0.1, after: (c, P, rr) => {
        c.save(); c.fillStyle = rr.col('#f97316'); c.beginPath(); c.arc(P.x, P.y, 0.28 * rr.s, 0, 6.29); c.fill(); c.restore();
      } });
    }
  }
};

// 9. KITSUNE YUTO (Fuchskrieger) - Fuchskopf, hohe Ohren, drei flammende Schwänze, Haori & Hakama
const HERO_YUTO = {
  blinkOffset: 0.9,
  weapon: { blade: '#ffedd5', grip: '#9a3412', guard: '#f59e0b', glow: 'rgba(251,146,60,0.85)' },
  draw(r, sk, ctx, t, info) {
    const fur = '#e8732a';
    const cream = '#fff1dc';
    heroLegs(r, sk, fur, '#3b2416', { shin: fur, toe: 0.9 });
    // Drei Fuchsschwänze mit Fuchsfeuer-Spitzen
    const tb = rigAdd(sk.pelvis, rigV(0, 0.7, -1.6));
    const dirs = [rigV(0.6, 0.45, -1), rigV(0, 0.75, -1), rigV(-0.6, 0.45, -1)];
    dirs.forEach((d, i) => {
      const pts = heroTail(r, tb, t, info.moving, fur, cream, { dir: d, n: 6, seg: 0.78, r0: 0.95, r1: 1.75, phase: i * 0.9, tipFrom: 0.97, amp: info.moving ? 0.8 : 0.45 });
      r.glow(pts[pts.length - 1], 2.6, 'rgba(251,146,60,0.9)', { alpha: 0.45 + Math.sin(t * 8 + i) * 0.15 });
    });
    heroRobe(r, sk, '#9a3412', t, info.moving, { topY: 1.5, hemY: 2.4, rt: 2.0, rb: 2.9, hem: '#7c2d12', trail: 0.5 });
    heroTorso(r, sk, cream, { rt: 2.2, rb: 1.95,
      after: (c, T, Bt, rr) => {
        const v = rr.toCam(rigV(0, 0, 1));
        if (v < 0.1) return;
        c.save(); c.strokeStyle = rr.col('#ea580c'); c.lineWidth = 0.5 * rr.s;
        c.beginPath(); c.moveTo(T.x - 1.2 * rr.s * v, T.y + 0.2 * rr.s); c.lineTo(T.x, T.y + 2.8 * rr.s); c.lineTo(T.x + 1.2 * rr.s * v, T.y + 0.2 * rr.s); c.stroke();
        c.restore();
      } });
    heroSash(r, sk, '#f59e0b', { y1: 1.9, y0: 1.4, r: 2.1 });
    heroArms(r, sk, cream, fur, { wide: cream, glove: fur });
    heroHead(r, sk, fur, (c, H, R) => {
      // Helle Wangen und Kehle
      r.cap(c, H, R, (az) => { const a = Math.abs(az); return a < 1.7 ? -0.12 - a * 0.22 : -1.6; }, cream, { below: true, grow: 1.0, gloss: 0, rim: false });
      heroFace(r, c, H, R, info, { eye: '#f59e0b', style: 'slit', size: 0.95, lid: '#431407', blush: false, mouth: false, eyeAz: 0.45 });
      // Rote Kitsune-Lidstriche
      for (const az of [0.45, -0.45]) {
        r.mark(c, H, R, az * 1.05, 0.18, (cc, P, sq, s) => {
          cc.strokeStyle = r.col('#dc2626'); cc.lineWidth = 0.4 * s; cc.lineCap = 'round';
          cc.beginPath(); cc.moveTo(P.x - 0.7 * s * sq * Math.sign(az), P.y + 0.3 * s); cc.lineTo(P.x + 0.9 * s * sq * Math.sign(az), P.y - 0.4 * s); cc.stroke();
        });
      }
    }, null);
    // Spitze Schnauze mit schwarzer Nase
    const snoutBase = rigSurfPt(sk.H, sk.R * 0.75, 0, -0.32);
    r.capsule(snoutBase, rigAdd(snoutBase, rigV(0, -0.2, 2.2)), 1.5, 0.75, cream, { bias: 0.3 });
    r.ball(rigAdd(snoutBase, rigV(0, 0.05, 2.75)), 0.5, '#1c1917', { bias: 0.45, gloss: 0.6 });
    // Große Fuchsohren mit dunklen Spitzen
    for (const az of [0.6, -0.6]) {
      heroEar(r, sk.H, sk.R, az, 0.7, fur, { len: 3.4, w: 0.34, inner: cream, tipColor: '#3b2416', tilt: rigV(0, 0.6, -0.15) });
    }
  }
};

// 10. TANUKI POKO (Marderhund-Mönch) - Kugelbauch, Strohhut mit Zauberblatt, Maske, Ringelschwanz, Sake-Kürbis
const HERO_POKO = {
  build: { thigh: 1.9, shin: 1.7, hipW: 1.55, torso: 5.0, shoulderW: 2.65, headR: 4.4, freq: 15 },
  blinkOffset: 1.6,
  weapon: { blade: '#d9f99d', grip: '#78350f', guard: '#22c55e', len: 7.8 },
  draw(r, sk, ctx, t, info) {
    const fur = '#8b5a2b';
    const dark = '#3b2412';
    heroLegs(r, sk, fur, dark, { thighR: 1.25, kneeR: 1.1, toe: 0.8 });
    // Geringelter Schwanz
    const tail = rigChain(t, rigAdd(sk.pelvis, rigV(0, 0.6, -2.2)), rigV(0, 0.15, -1), { n: 4, seg: 1.0, amp: info.moving ? 0.8 : 0.4, freq: info.moving ? 12 : 3, k: 0.8 });
    for (let i = 1; i < tail.length; i++) r.ball(tail[i], 1.25 - i * 0.08, i % 2 ? fur : dark, { bias: -0.1 });
    heroTorso(r, sk, fur, { rt: 2.4, rb: 3.0, botY: -0.6 });
    // Kugelrunder Bauch
    const belly = rigAdd(sk.pelvis, rigV(0, 1.9 + sk.breathe * 0.3, 1.5));
    r.ball(belly, 2.55, '#fde68a', { sy: 1.05, bias: 0.25, gloss: 0.3 });
    // Sake-Kürbis an der Hüfte
    const gourd = rigAdd(sk.pelvis, rigV(-2.9, 0.4 + Math.sin(t * 7) * 0.12, 0.3));
    r.ball(gourd, 1.0, '#f59e0b', { bias: 0.1 });
    r.ball(rigAdd(gourd, rigV(0, 1.2, 0)), 0.65, '#f59e0b', { bias: 0.12 });
    r.ball(rigAdd(gourd, rigV(0, 0.62, 0)), 0.35, '#dc2626', { bias: 0.14, gloss: 0 });
    heroArms(r, sk, fur, dark, { upperR: 1.05 });
    heroHead(r, sk, fur, (c, H, R) => {
      r.cap(c, H, R, (az) => { const a = Math.abs(az); return a < 1.7 ? -0.2 - a * 0.2 : -1.6; }, '#f4e1b5', { below: true, grow: 1.0, gloss: 0, rim: false });
      // Dunkle Waschbär-Augenmaske
      for (const az of [0.42, -0.42]) {
        r.mark(c, H, R, az, -0.1, (cc, P, sq, s) => {
          cc.fillStyle = r.col(dark);
          cc.beginPath(); cc.ellipse(P.x, P.y + 0.15 * s, 1.55 * s * sq, 1.2 * s, Math.sign(az) * -0.35, 0, 6.29); cc.fill();
        });
      }
      heroFace(r, c, H, R, info, { eye: '#fde68a', pupil: '#1c1917', size: 0.8, blush: false, mouth: false });
      r.mark(c, H, R, 0, -0.42, (cc, P, sq, s) => {
        cc.fillStyle = r.col('#1c1917'); cc.beginPath(); cc.ellipse(P.x, P.y - 0.3 * s, 0.75 * s * sq, 0.5 * s, 0, 0, 6.29); cc.fill();
        cc.strokeStyle = r.col('#3b1d1d'); cc.lineWidth = 0.35 * s; cc.lineCap = 'round';
        cc.beginPath(); cc.arc(P.x, P.y - 0.2 * s, 1.3 * s * sq, Math.PI * 0.2, Math.PI * 0.8); cc.stroke();
      }, 1.0);
    }, null);
    // Runde Ohren
    for (const az of [0.95, -0.95]) r.ball(rigSurfPt(sk.H, sk.R * 0.95, az, 0.72), 1.15, dark, { sy: 0.9, bias: -0.05 });
    // Kleiner Strohhut mit Zauberblatt
    const hatBot = rigAdd(sk.H, rigV(0.4, sk.R * 0.88, -0.9));
    r.cone(rigAdd(hatBot, rigV(0, 1.4, 0)), hatBot, 0.3, sk.R * 0.72, '#d4a24c', { sz: 1, bias: 0.5 });
    const leafB = rigAdd(hatBot, rigV(0, 1.3, 0));
    const wob = Math.sin(t * 3) * 0.3;
    const leafT = rigAdd(leafB, rigV(1.2 + wob, 2.4, 0.4));
    r.poly([leafB, rigAdd(rigLerp(leafB, leafT, 0.5), rigV(0.9, -0.2, 0.3)), leafT, rigAdd(rigLerp(leafB, leafT, 0.5), rigV(-0.9, 0.3, -0.3))], '#22c55e', { bias: 0.7,
      after: (c, Ps, rr) => { c.save(); c.strokeStyle = rr.col('#15803d'); c.lineWidth = 0.25 * rr.s; c.beginPath(); c.moveTo(Ps[0].x, Ps[0].y); c.lineTo(Ps[2].x, Ps[2].y); c.stroke(); c.restore(); } });
  }
};

// 11. NEKO KURO (Schattenkater) - schwarzer Kater, Neon-Schlitzaugen, wehender roter Schal, Ringelschwanz
const HERO_KURO = {
  build: { shoulderW: 2.3, hipW: 1.2, torso: 5.2 },
  blinkOffset: 2.8,
  weapon: { blade: '#d1fae5', grip: '#111827', guard: '#ef4444', glow: 'rgba(74,222,128,0.6)', len: 8.0, bladeW: 0.45 },
  draw(r, sk, ctx, t, info) {
    const fur = '#2a2d44';
    heroLegs(r, sk, fur, '#1a1c2c', { shin: '#3a3f5c', toe: 0.85, wrap: '#64748b' });
    // Langer, geschwungener Katzenschwanz
    const tail = rigChain(t, rigAdd(sk.pelvis, rigV(0, 0.5, -1.4)), rigV(0, 0.85, -0.7), { n: 7, seg: 1.0, amp: 1.0, ampY: 0.3, freq: info.moving ? 9 : 2.8, k: 0.7 });
    r.line(tail, fur, 0.85, { bias: -0.1 });
    heroTorso(r, sk, '#1f2233', { rt: 2.05, rb: 1.85 });
    heroSash(r, sk, '#475569', { y1: 1.6, y0: 1.0, r: 1.95 });
    heroArms(r, sk, '#1f2233', fur, { fore: '#3a3f5c', glove: fur });
    // Roter Schal mit zwei langen Enden
    const neck = rigAdd(rigLerp(sk.shR, sk.shL, 0.5), rigV(0, 0.4, 0));
    r.cone(rigAdd(neck, rigV(0, 0.9, 0)), rigAdd(neck, rigV(0, -0.4, 0)), 1.9, 2.3, '#ef4444', { sz: 0.9, bias: 0.3 });
    heroRibbon(r, rigAdd(neck, rigV(0.6, 0.2, -1.8)), t, info.moving, '#ef4444', { n: 5, seg: 1.3, w: 1.1, dx: 0.4 });
    heroRibbon(r, rigAdd(neck, rigV(-0.6, 0.2, -1.8)), t + 0.5, info.moving, '#dc2626', { n: 4, seg: 1.2, w: 1.0, dx: -0.3 });
    heroHead(r, sk, fur, (c, H, R) => {
      r.cap(c, H, R, (az) => { const a = Math.abs(az); return a < 1.2 ? -0.38 - a * 0.25 : -1.6; }, '#3a3f5c', { below: true, grow: 1.0, gloss: 0, rim: false });
      heroFace(r, c, H, R, info, { eye: '#4ade80', style: 'slit', size: 1.15, tall: 1.2, blush: false, mouth: false, eyeAz: 0.44 });
      for (const az of [0.44, -0.44]) {
        r.mark(c, H, R, az, -0.12, (cc, P, sq, s) => {
          cc.globalCompositeOperation = 'lighter'; cc.fillStyle = 'rgba(74,222,128,0.35)';
          cc.beginPath(); cc.ellipse(P.x, P.y, 1.8 * s * sq, 1.8 * s, 0, 0, 6.29); cc.fill();
        });
      }
      // Rosa Nase, Mäulchen und Schnurrhaare
      r.mark(c, H, R, 0, -0.38, (cc, P, sq, s) => {
        cc.fillStyle = r.col('#f472b6');
        cc.beginPath(); cc.moveTo(P.x - 0.5 * s * sq, P.y - 0.3 * s); cc.lineTo(P.x + 0.5 * s * sq, P.y - 0.3 * s); cc.lineTo(P.x, P.y + 0.25 * s); cc.closePath(); cc.fill();
        cc.strokeStyle = r.col('#cbd5e1'); cc.lineWidth = 0.2 * s; cc.globalAlpha *= 0.8;
        cc.beginPath();
        for (const sd of [-1, 1]) {
          cc.moveTo(P.x + sd * 1.0 * s * sq, P.y + 0.1 * s); cc.lineTo(P.x + sd * 3.2 * s * sq, P.y - 0.3 * s);
          cc.moveTo(P.x + sd * 1.0 * s * sq, P.y + 0.4 * s); cc.lineTo(P.x + sd * 3.1 * s * sq, P.y + 0.6 * s);
        }
        cc.stroke();
      }, 1.0);
    }, null);
    for (const az of [0.62, -0.62]) {
      heroEar(r, sk.H, sk.R, az, 0.66, fur, { len: 2.7, w: 0.42, inner: '#f472b6', tilt: rigV(Math.sign(az) * 0.2, 0.5, 0) });
    }
  }
};

// 12. TOTORO TORU (Waldwächter) - birnenförmiger Riesenkörper, Pfeilmuster, Hasenohren, breites Grinsen
const HERO_TORU = {
  build: { thigh: 1.5, shin: 1.3, hipW: 2.0, torso: 6.0, shoulderW: 3.6, upperArm: 1.9, foreArm: 1.7, headR: 0.1, headUp: 0, freq: 11, stride: 2.4, idleArms: 1.4 },
  shadowW: 8.5,
  blinkOffset: 1.1,
  weapon: { blade: '#f1f5f9', grip: '#475569', guard: '#94a3b8', len: 8.0 },
  draw(r, sk, ctx, t, info) {
    const grey = '#6b7280';
    const belly = '#eef1f4';
    // Kurze, stämmige Krallenfüße
    for (const S of ['R', 'L']) {
      r.capsule(sk['hip' + S], sk['ankle' + S], 1.5, 1.2, grey);
      const foot = sk['foot' + S];
      r.ball(rigAdd(foot, rigV(0, 0.6, 0.6)), 1.25, grey, { sy: 0.7, bias: 0.02 });
      for (let k = -1; k <= 1; k++) r.ball(rigAdd(foot, rigV(k * 0.55, 0.4, 1.7)), 0.28, '#1f2937', { bias: 0.05, gloss: 0, outline: false });
    }
    const waddle = info.moving ? Math.sin(sk.phase) * 0.5 : Math.sin(t * 1.2) * 0.15;
    const C = rigV(sk.pelvis.x + waddle, sk.pelvis.y + 4.2 + sk.breathe * 0.4, 0.2);
    const BR = 5.6;
    // Großer birnenförmiger Körper mit Gesicht
    r.ball(C, BR, grey, { sy: 1.1, gloss: 0.25, after: (c, P, rr) => {
      rr.eye(c, C, BR, 0.36, 0.45, { white: true, style: 'dot', color: '#111827', size: 1.15, blink: info.blink, tall: 1.05 });
      rr.eye(c, C, BR, -0.36, 0.45, { white: true, style: 'dot', color: '#111827', size: 1.15, blink: info.blink, tall: 1.05 });
      rr.mark(c, C, BR, 0, 0.42, (cc, M, sq, s) => {
        cc.fillStyle = rr.col('#1f2937'); cc.beginPath(); cc.ellipse(M.x, M.y, 0.7 * s * sq, 0.35 * s, 0, 0, 6.29); cc.fill();
      });
      // Breites Totoro-Grinsen
      rr.mark(c, C, BR, 0, 0.2, (cc, M, sq, s) => {
        const w = 2.6 * s * sq;
        cc.fillStyle = rr.col('#3f1d1d');
        cc.beginPath(); cc.moveTo(M.x - w, M.y - 0.2 * s); cc.quadraticCurveTo(M.x, M.y + 1.4 * s, M.x + w, M.y - 0.2 * s); cc.quadraticCurveTo(M.x, M.y + 0.2 * s, M.x - w, M.y - 0.2 * s); cc.fill();
        cc.fillStyle = 'rgba(255,255,255,0.95)';
        cc.fillRect(M.x - w * 0.6, M.y - 0.05 * s, w * 1.2, 0.35 * s);
      });
      // Schnurrhaare
      for (const sd of [1, -1]) {
        rr.mark(c, C, BR, sd * 0.75, 0.32, (cc, M, sq, s) => {
          cc.strokeStyle = rr.col('#374151'); cc.lineWidth = 0.22 * s;
          cc.beginPath(); cc.moveTo(M.x, M.y); cc.lineTo(M.x - sd * 2.4 * s * sq, M.y - 0.4 * s);
          cc.moveTo(M.x, M.y + 0.5 * s); cc.lineTo(M.x - sd * 2.4 * s * sq, M.y + 0.6 * s); cc.stroke();
        });
      }
    } });
    // Heller Bauch mit Pfeilsicheln
    const bc = rigAdd(C, rigV(0, -1.6, BR * 0.55));
    r.ball(bc, 3.8, belly, { sy: 1.0, bias: 0.6, gloss: 0.15, after: (c, P, rr) => {
      if (rr.toCam(rigV(0, 0, 1)) < 0.15) return;
      c.save(); c.strokeStyle = rr.col('#64748b'); c.lineWidth = 0.38 * rr.s; c.lineCap = 'round'; c.lineJoin = 'round';
      const marks = [[-1.3, -1.3], [0, -1.6], [1.3, -1.3], [-0.7, -0.3], [0.7, -0.3]];
      for (const m of marks) {
        const x = P.x + m[0] * rr.s;
        const y = P.y + m[1] * rr.s;
        c.beginPath(); c.moveTo(x - 0.45 * rr.s, y + 0.3 * rr.s); c.lineTo(x, y - 0.25 * rr.s); c.lineTo(x + 0.45 * rr.s, y + 0.3 * rr.s); c.stroke();
      }
      c.restore();
    } });
    // Stummelarme mit Krallen
    for (const S of ['R', 'L']) {
      r.capsule(sk['sh' + S], sk['hand' + S], 1.2, 0.95, grey, { bias: 0.1 });
    }
    // Hasenohren
    for (const az of [0.32, -0.32]) {
      heroEar(r, C, BR * 1.05, az, 1.05, grey, { len: 3.4, w: 0.18, tilt: rigV(Math.sign(az) * 0.15, 0.8, 0), smooth: true });
    }
    // Blatt auf dem Kopf
    const lb = rigAdd(C, rigV(-1.0, BR * 1.05, -0.4));
    const lt = rigAdd(lb, rigV(-1.8, 1.4 + Math.sin(t * 2.2) * 0.2, 0.6));
    r.poly([lb, rigAdd(rigLerp(lb, lt, 0.5), rigV(0, 0.9, 0.5)), lt, rigAdd(rigLerp(lb, lt, 0.5), rigV(0.2, -0.6, -0.4))], '#16a34a', { bias: 0.5 });
  }
};

// 13. TENGU HAYATE (Rabenkrieger) - Krähenkopf mit Goldschnabel, rotes Tokin, Origami-Flügel, Yamabushi-Bommeln
const HERO_HAYATE = {
  blinkOffset: 0.4,
  weapon: { blade: '#e0e7ff', grip: '#1e1b4b', guard: '#f59e0b' },
  draw(r, sk, ctx, t, info) {
    const feather = '#1f2a44';
    // Origami-Flügel auf dem Rücken
    const flap = info.moving ? Math.sin(t * 14) * 0.5 : Math.sin(t * 3) * 0.3;
    for (const sd of [1, -1]) {
      const root = rigAdd(sk.chest, rigV(sd * 1.0, 0.9, -1.6));
      const tip = rigAdd(root, rigV(sd * (5.0 + flap), 3.2 + flap * 2, -2.0));
      const mid = rigAdd(root, rigV(sd * 3.8, -1.2 + flap, -2.4));
      const low = rigAdd(root, rigV(sd * 1.6, -3.4, -1.8));
      r.poly([root, tip, rigLerp(tip, mid, 0.5), mid, rigLerp(mid, low, 0.5), low], '#1e3a8a', { smooth: false, bias: -0.4 });
      r.poly([root, tip, mid], '#2c52b5', { smooth: false, outline: false, bias: -0.35 });
    }
    heroLegs(r, sk, '#1e293b', '#92400e', { wrap: '#e2e8f0', toe: 0.9 });
    // Geta-Holzzähne
    for (const S of ['R', 'L']) r.capsule(rigAdd(sk['foot' + S], rigV(0, 0.05, -0.1)), rigAdd(sk['foot' + S], rigV(0, 0.05, 0.6)), 0.3, 0.3, '#78350f', { bias: -0.05 });
    heroRobe(r, sk, '#1e3a8a', t, info.moving, { topY: 1.5, hemY: 2.3, rt: 2.0, rb: 2.9, hem: '#172554', trail: 0.5 });
    heroTorso(r, sk, '#e2e8f0', { rt: 2.25, rb: 2.0 });
    // Kragen-Schärpe mit orangefarbenen Bonbon-Bommeln
    r.line([rigAdd(sk.shR, rigV(0, 0.3, 0.6)), rigAdd(sk.chest, rigV(0, -0.4, 2.0)), rigAdd(sk.shL, rigV(0, 0.3, 0.6))], '#1e3a8a', 0.6, { bias: 0.4 });
    for (let i = 0; i < 2; i++) r.ball(rigAdd(sk.chest, rigV(i ? -0.9 : 0.9, 0.0 - i * 0.6, 2.1)), 0.65, '#f97316', { bias: 0.5, gloss: 0.2 });
    heroSash(r, sk, '#1e293b', { y1: 1.8, y0: 1.2, r: 2.1 });
    heroArms(r, sk, '#e2e8f0', feather, { wide: '#e2e8f0', glove: '#334155' });
    heroHead(r, sk, feather, (c, H, R) => {
      heroFace(r, c, H, R, info, { eye: '#facc15', pupil: '#111827', size: 0.95, white: false, blush: false, mouth: false, eyeAz: 0.48, eyeEl: -0.02 });
      // Strenge Brauen
      for (const sd of [1, -1]) {
        r.mark(c, H, R, sd * 0.48, 0.22, (cc, P, sq, s) => {
          cc.strokeStyle = r.col('#0b1020'); cc.lineWidth = 0.55 * s; cc.lineCap = 'round';
          cc.beginPath(); cc.moveTo(P.x - sd * 0.2 * s * sq, P.y - 0.1 * s); cc.lineTo(P.x + sd * 1.2 * s * sq, P.y - 0.6 * s); cc.stroke();
        });
      }
    }, (c, H, R) => {
      // gefiederter Hinterkopf (zackige Federn)
      r.cap(c, H, R, heroHairEdge(1.2, -0.2, -1.2, 0.0, 1), '#111a30', { grow: 1.07, gloss: 0.35 });
    });
    // Goldener Schnabel
    const bb = rigSurfPt(sk.H, sk.R * 0.85, 0, -0.32);
    r.capsule(bb, rigAdd(bb, rigV(0, -1.3, 3.0)), 1.15, 0.12, '#f59e0b', { bias: 0.5, light: 0.3 });
    // Rotes Tokin-Käppchen
    const tok = rigSurfPt(sk.H, sk.R * 1.02, 0, 0.78);
    r.ball(tok, 1.15, '#dc2626', { sx: 1.1, sy: 0.85, bias: 0.6, gloss: 0.4 });
    // Federschopf am Hinterkopf
    for (let i = -1; i <= 1; i++) {
      const fb = rigSurfPt(sk.H, sk.R, HERO_PI + i * 0.35, 0.3);
      r.poly([fb, rigAdd(fb, rigV(i * 0.6, 0.5, -2.4 - Math.abs(i) * 0.3 + Math.sin(t * 4 + i) * 0.2)), rigAdd(fb, rigV(i * 0.6 + 0.6, -0.4, -0.6))], '#111a30', { smooth: false, bias: -0.2 });
    }
  }
};

// 14. YUREI SHIRATAMA (Tempelgeist) - schwebende Papierwolke, Kodama-Gesicht, Seelenfeuer-Orbs
const HERO_SHIRATAMA = {
  build: { headR: 4.4, headUp: 3.4 },
  hover: 2.2,
  shadowW: 5.5,
  blinkOffset: 2.0,
  weapon: { blade: '#e0f2fe', grip: '#0369a1', guard: '#a5f3fc', glow: 'rgba(56,189,248,0.8)' },
  draw(r, sk, ctx, t, info) {
    const paper = '#f8fafc';
    // Wolkenkörper mit welligem Saum und Schweif
    const body = rigAdd(sk.pelvis, rigV(0, 2.4, 0));
    r.ball(body, 3.4, paper, { sy: 1.05, gloss: 0.2 });
    const trail = info.moving ? -1.6 : 0;
    for (let i = 1; i <= 3; i++) {
      const w = Math.sin(t * 5 - i) * 0.5;
      r.ball(rigAdd(body, rigV(w, -1.8 - i * 1.0, trail * i * 0.6 - i * 0.2)), 2.4 - i * 0.6, i === 3 ? '#e0f2fe' : paper, { bias: -0.05 * i, gloss: 0.1 });
    }
    // Papierfalz
    r.line([rigAdd(body, rigV(-1.8, 1.4, 2.6)), rigAdd(body, rigV(0.2, -0.6, 3.3)), rigAdd(body, rigV(1.8, -2.0, 2.6))], '#cbd5e1', 0.25, { outline: false, bias: 0.4, smooth: false });
    // Kleine schwebende Papierhände
    r.ball(sk.handR, 0.85, paper, { bias: 0.1 });
    r.ball(sk.handL, 0.85, paper, { bias: 0.1 });
    // Kodama-Kopf mit Wackelneigung
    const tilt = Math.sin(t * 1.7) * 0.7;
    sk.H = rigAdd(sk.H, rigV(tilt, 0, 0));
    heroHead(r, sk, '#f1f5f9', (c, H, R) => {
      r.eye(c, H, R, 0.4, 0.0, { style: 'dot', color: '#1e293b', size: 1.15, tall: 1.2 });
      r.eye(c, H, R, -0.4, 0.0, { style: 'dot', color: '#1e293b', size: 1.15, tall: 1.2 });
      r.mark(c, H, R, 0, -0.42, (cc, P, sq, s) => {
        cc.fillStyle = r.col('#1e293b'); cc.beginPath(); cc.ellipse(P.x, P.y, 0.55 * s * sq, 0.7 * s, 0, 0, 6.29); cc.fill();
      });
      r.blush(c, H, R, 0.66, -0.3, '#7dd3fc', 0.8);
      r.blush(c, H, R, -0.66, -0.3, '#7dd3fc', 0.8);
    }, null, { sy: 1.0 });
    // Seelenfeuer-Orbs kreisen
    for (let i = 0; i < 3; i++) {
      const a = t * 2.2 + (i * HERO_PI * 2) / 3;
      const p = rigV(Math.cos(a) * 6.5, 7 + Math.sin(t * 3 + i) * 1.2, Math.sin(a) * 6.5);
      r.ball(p, 0.75, '#a5f3fc', { outline: false, gloss: 0.6 });
      r.glow(p, 2.8, 'rgba(56,189,248,0.95)', { alpha: 0.6 });
    }
  }
};

// 15. MUKURO (Leeren-Schatten) - wabernder Schattenkörper, ovale Noh-Maske mit lila Tränen, Schattenschwaden
const HERO_MUKURO = {
  build: { torso: 6.2, headR: 4.2, headUp: 4.2 },
  hover: 0.6,
  blinkOffset: 3.3,
  weapon: { blade: '#ddd6fe', grip: '#09090b', guard: '#7c3aed', glow: 'rgba(124,58,237,0.85)' },
  draw(r, sk, ctx, t, info) {
    const shade = '#1c1a24';
    // Langer Schattenkörper bis zum Boden mit wogendem Saum
    const neck = rigAdd(rigLerp(sk.shR, sk.shL, 0.5), rigV(0, 1.2, -0.2));
    const hem = rigV(Math.sin(t * 2.2) * 0.5, -0.2, info.moving ? -1.4 : Math.cos(t * 1.8) * 0.3);
    r.cone(neck, hem, 2.0, 3.8, shade, { sz: 0.9, hem: '#2e1065', hemW: 1.2, alpha: 0.95 });
    // Dunkle Hinterkopf-Kapuze
    r.ball(rigAdd(sk.H, rigV(0, 0.2, -0.8)), sk.R * 1.12, '#0e0d13', { sy: 1.15, bias: -0.3, gloss: 0.1 });
    // Dünne Arme mit fahlen Händen
    for (const S of ['R', 'L']) {
      r.capsule(sk['sh' + S], sk['elbow' + S], 0.75, 0.6, shade);
      r.capsule(sk['elbow' + S], sk['hand' + S], 0.6, 0.5, shade);
      r.ball(sk['hand' + S], 0.65, '#d4d4d8', { bias: 0.05 });
    }
    heroHead(r, sk, '#f4f4f5', (c, H, R) => {
      r.eye(c, H, R, 0.38, -0.05, { style: 'dot', color: '#09090b', size: 0.85, tall: 0.8 });
      r.eye(c, H, R, -0.38, -0.05, { style: 'dot', color: '#09090b', size: 0.85, tall: 0.8 });
      // Lila Malereien: Striche über den Augen, Tränen darunter
      for (const az of [0.38, -0.38]) {
        r.mark(c, H, R, az, 0.2, (cc, P, sq, s) => {
          cc.fillStyle = r.col('#7c3aed');
          cc.beginPath(); cc.moveTo(P.x - 0.35 * s * sq, P.y + 0.4 * s); cc.lineTo(P.x, P.y - 1.0 * s); cc.lineTo(P.x + 0.35 * s * sq, P.y + 0.4 * s); cc.closePath(); cc.fill();
        });
        r.mark(c, H, R, az, -0.33, (cc, P, sq, s) => {
          cc.fillStyle = r.col('#8b5cf6');
          cc.beginPath(); cc.moveTo(P.x - 0.3 * s * sq, P.y - 0.4 * s); cc.lineTo(P.x, P.y + 1.3 * s); cc.lineTo(P.x + 0.3 * s * sq, P.y - 0.4 * s); cc.closePath(); cc.fill();
        });
      }
      r.mouth(c, H, R, 0, -0.62, { smile: false, w: 0.6, color: '#3f3f46' });
    }, null, { sy: 1.2, sx: 0.88, gloss: 0.4 });
    // Aufsteigende Schattenschwaden
    for (let i = 0; i < 3; i++) {
      const life = (t * 0.6 + i / 3) % 1;
      const p = rigV(Math.sin(i * 2.3 + t) * 3, 2 + life * 14, Math.cos(i * 1.7) * 2 - 1);
      r.glow(p, 2.0 + life * 1.5, 'rgba(124,58,237,0.8)', { alpha: (1 - life) * 0.5 });
    }
  }
};

// -----------------------------------------------------------------------------
// RENDER-EINSTIEGSPUNKTE (Signatur bleibt kompatibel; action ist optional)
// -----------------------------------------------------------------------------
function renderRenTwilight(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_REN, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderKaitoWind(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_KAITO, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderJiroRonin(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_JIRO, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderTaroLantern(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_TARO, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderSoraMiko(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_SORA, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderKannaWolf(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_KANNA, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderAoiCelestial(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_AOI, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderMeiHerbalist(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_MEI, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderYutoKitsune(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_YUTO, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderPokoTanuki(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_POKO, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderKuroNeko(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_KURO, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderToruTotoro(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_TORU, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderHayateTengu(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_HAYATE, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderShiratamaSpirit(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_SHIRATAMA, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}
function renderMukuroShadow(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  heroRender(HERO_MUKURO, ctx, px, py, animTime, direction, isMoving, hitFlash, action);
}

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
