/**
 * Ocarina of Brawls - Bestiarium & Monster-Handbuch
 * 22 prozedural animierte Gegner auf dem gemeinsamen Pseudo-3D-Skelett-Rig (js/rig.js)
 * im "Süßen Dark Ghibli 2.5D Papercraft"-Stil.
 * Inspiriert von Prinzessin Mononoke, Chihiros Reise ins Zauberland, Totoro und japanischer Mythologie.
 *
 * render(ctx, cx, cy, time, state, hitFlash, opts)
 *   state: 'idle' | 'walk' | 'attack'
 *   opts (optional, aus enemies.js): { facing (Winkel), attackT (0..1 Ausholen), strikeT (1..0 Nachschwingen) }
 *   Ohne opts (Showroom) blicken Monster schräg nach vorne und spielen eine Angriffsschleife ab.
 */
import {
  RIG, rigV, rigAdd, rigSub, rigScale, rigLerp, rigNorm, rigBiped, rigQuad, rigIK, rigChain,
  rigSerpent, rigSurfPt, rigClamp, rigEaseOut, rigEaseInOut, rigAttackPhase, rigSwingValue
} from './js/rig.js';
import {
  heroBlink, heroDrawBlade, heroLegs, heroArms, heroTorso, heroRobe, heroSash, heroRibbon,
  heroHead, heroFace, heroHairEdge, heroEar, heroTail, heroBand, heroLerp
} from './js/characters.js';

const MON_FACING = 1.05; // Showroom: leicht seitliche 3/4-Ansicht nach vorne
const MON_PI = Math.PI;

/** Startet ein Monsterbild: Rig mit Boden bei cy + ground, Angriffsphase, Bewegung */
function monBegin(ctx, cx, cy, ground, time, state, hitFlash, opts, o = {}) {
  const op = opts || {};
  const facing = op.facing !== undefined ? op.facing : (o.facing !== undefined ? o.facing : MON_FACING);
  const r = RIG.begin(ctx, cx, cy + ground, {
    facing,
    scale: o.scale || 1,
    flash: hitFlash > 0 ? 0.8 : 0,
    flashColor: '#ffffff',
    ink: o.ink
  });
  const ap = rigAttackPhase(state, time, op);
  return { r, ap, sv: rigSwingValue(ap), moving: state === 'walk', t: time, blink: heroBlink(time, o.blink || 0) };
}

/** Weicher Schwebeschatten, der mit der Flughöhe kleiner wird */
function monHoverShadow(r, w, h, height) {
  const k = 1 / (1 + height * 0.04);
  r.shadow(w * k, h * k, 0.26 * k + 0.06);
}

/** Bogen in Ruhehaltung (Sehne gespannt, kein Pfeil) */
function monBowRest(r, hand, wood, o = {}) {
  const up = o.up || rigV(0, 1, 0.15);
  const top = rigAdd(hand, rigScale(up, 4.6));
  const bot = rigAdd(hand, rigScale(up, -4.6));
  const bend = rigV(0, 0, 1.1);
  r.line([top, rigAdd(rigLerp(hand, top, 0.55), bend), hand, rigAdd(rigLerp(hand, bot, 0.55), bend), bot], wood, 0.75, { bias: 0.1 });
  r.line([top, bot], '#f8fafc', 0.2, { smooth: false, outline: false, bias: 0.05 });
  return { top, bot };
}

/** Leuchtender Projektil-Aufbau (Feuer, Sporen, Magie) */
function monCharge(r, p, size, color, alpha = 1) {
  r.glow(p, size * 2.2, color, { alpha: 0.55 * alpha });
  r.glow(p, size, 'rgba(255,255,255,0.9)', { alpha: 0.7 * alpha });
}

/** Kleiner Kodama-Baumgeist (Schulter-Begleiter, Reiter) */
function monKodama(r, base, t, s = 1) {
  const tilt = Math.sin(t * 2.6) * 0.5;
  r.ball(rigAdd(base, rigV(0, 0.9 * s, 0)), 1.0 * s, '#f1f5f0', { sy: 1.2, gloss: 0.1 });
  const H = rigAdd(base, rigV(tilt * 0.4 * s, 2.6 * s, 0));
  r.ball(H, 1.35 * s, '#f8faf5', { sx: 1.1, gloss: 0.15, after: (c) => {
    r.eye(c, H, 1.35 * s, 0.4, 0.05, { style: 'dot', color: '#1f2937', size: 0.32 * s });
    r.eye(c, H, 1.35 * s, -0.4, 0.05, { style: 'dot', color: '#1f2937', size: 0.32 * s });
    r.mark(c, H, 1.35 * s, 0, -0.4, (cc, P, sq, sc) => {
      cc.fillStyle = r.col('#1f2937'); cc.beginPath(); cc.ellipse(P.x, P.y, 0.25 * sc * s * sq, 0.3 * sc * s, 0, 0, 6.29); cc.fill();
    });
  } });
}

/** Blatt (für Ponchos, Moos, Kronen) */
function monLeaf(r, base, tip, w, color, o = {}) {
  const mid = rigLerp(base, tip, 0.5);
  const side = o.side || rigV(w, 0, 0);
  r.poly([base, rigAdd(mid, side), tip, rigSub(mid, side)], color, { bias: o.bias || 0, depth: o.depth, outline: o.outline });
}

// =============================================================================
// GEGNER-RENDERER
// =============================================================================

/** Ellipsoid-Flecken (Pilzhut-Punkte, Fellmuster) nur auf der sichtbaren Seite */
function monSpots(r, C, rx, ry, rz, list, color, o = {}) {
  for (const sp of list) {
    const az = sp[0];
    const el = sp[1];
    const ce = Math.cos(el);
    const n = rigV(Math.sin(az) * ce, Math.sin(el), Math.cos(az) * ce);
    if (r.toCam(n) < 0.12) continue;
    const p = rigV(C.x + n.x * rx, C.y + n.y * ry, C.z + n.z * rz);
    r.ball(p, sp[2] || 0.8, color, { sy: 0.75, outline: false, gloss: 0.3, bias: o.bias || 0.4 });
  }
}

// 1. WALDLÄUFER-SCHÜTZE - Kitsune-Maske, Blätterponcho mit Fuchskapuze, Kodama auf der Schulter
function monMossArcher(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 18, time, state, hitFlash, opts, { scale: 1.4, blink: 0.4 });
  const { r, ap, t } = M;
  r.shadow(7.5, 2.8, 0.3, 0, 0.3);
  const aiming = ap.phase !== 'idle';
  const pull = ap.phase === 'windup' ? rigEaseInOut(ap.p) : (ap.phase === 'strike' ? Math.max(0, 1 - ap.p * 5) : 0);
  const B = { thigh: 2.4, shin: 2.3, hipW: 1.3, torso: 5.6, shoulderW: 2.45, upperArm: 2.3, foreArm: 2.2, freq: 12 };
  const shY = (B.thigh + B.shin) * 0.94 + B.torso * 0.86;
  const sk = rigBiped(t, Object.assign({}, B, {
    moving: M.moving,
    handL: aiming ? rigV(-0.5, shY - 0.1, 4.5) : null,
    handR: aiming ? rigV(-0.2, shY + 0.15, 4.3 - 3.8 * pull) : null,
    twist: aiming ? 0.42 : 0,
    elbowPoleR: aiming ? rigV(1, 0.4, -1) : null
  }));
  sk.H = rigV(sk.head.x, sk.neck.y + 3.9, sk.head.z + 0.25);
  sk.R = 4.4;
  heroLegs(r, sk, '#3f4a3c', '#6b3f1d', { wrap: '#a8a29e', toe: 0.85 });
  heroTorso(r, sk, '#1f4d2b', { rt: 2.2, rb: 2.0 });
  // Blätterponcho: Kegel mit hängenden Blattspitzen am Saum
  const neck = rigAdd(rigLerp(sk.shR, sk.shL, 0.5), rigV(0, 0.7, -0.1));
  const hemC = rigV(sk.pelvis.x * 0.4, sk.pelvis.y + 0.6, M.moving ? -0.8 : 0);
  r.cone(neck, hemC, 1.6, 3.6, '#2f7a3e', { sz: 0.85, hem: '#256b33', hemW: 0.6, bias: 0.05 });
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * MON_PI * 2 + 0.2;
    const n = rigV(Math.sin(a), 0, Math.cos(a));
    if (r.toCam(n) < -0.35) continue;
    const base = rigV(hemC.x + n.x * 3.4, hemC.y + 0.4, hemC.z + n.z * 3.1);
    const sway = Math.sin(t * 3 + k) * 0.3;
    const tip = rigAdd(base, rigV(n.x * 0.9 + sway, -1.9, n.z * 0.9));
    monLeaf(r, base, tip, 0.65, k % 2 ? '#4ade80' : '#22c55e', { side: rigScale(rigV(n.z, 0, -n.x), 0.65), bias: 0.08 });
  }
  // Köcher mit Papierfedern auf dem Rücken
  const q0 = rigAdd(sk.chest, rigV(1.4, 2.6, -2.4));
  const q1 = rigAdd(sk.chest, rigV(-1.2, -2.4, -2.1));
  r.capsule(q1, q0, 0.95, 1.05, '#7c3f17', { bias: -0.2 });
  for (let i = 0; i < 3; i++) {
    const fb = rigAdd(q0, rigV(-0.6 + i * 0.6, 0.4, 0));
    r.poly([fb, rigAdd(fb, rigV(0.35, 1.8, 0.2)), rigAdd(fb, rigV(-0.35, 1.6, -0.2))], i === 1 ? '#fca5a5' : '#f8fafc', { smooth: false, bias: -0.25 });
  }
  heroArms(r, sk, '#1f4d2b', '#f1dcc4', { cuff: '#7c3f17' });
  // Kopf: Kitsune-Porzellanmaske unter der Fuchskapuze
  heroHead(r, sk, '#f8fafc', (c, H, R) => {
    r.eye(c, H, R, 0.4, -0.02, { style: 'slit', color: '#166534', size: 0.85, tall: 0.9, blink: M.blink });
    r.eye(c, H, R, -0.4, -0.02, { style: 'slit', color: '#166534', size: 0.85, tall: 0.9, blink: M.blink });
    for (const sd of [1, -1]) {
      r.mark(c, H, R, sd * 0.42, 0.24, (cc, P, sq, s) => {
        cc.strokeStyle = r.col('#dc2626'); cc.lineWidth = 0.45 * s; cc.lineCap = 'round';
        cc.beginPath(); cc.moveTo(P.x - sd * 0.9 * s * sq, P.y + 0.4 * s); cc.quadraticCurveTo(P.x, P.y - 0.6 * s, P.x + sd * 1.1 * s * sq, P.y - 0.1 * s); cc.stroke();
      });
      r.mark(c, H, R, sd * 0.68, -0.34, (cc, P, sq, s) => {
        cc.strokeStyle = r.col('#dc2626'); cc.lineWidth = 0.4 * s;
        cc.beginPath(); cc.moveTo(P.x - 0.6 * s * sq, P.y); cc.lineTo(P.x + 0.6 * s * sq, P.y); cc.moveTo(P.x - 0.5 * s * sq, P.y + 0.7 * s); cc.lineTo(P.x + 0.5 * s * sq, P.y + 0.7 * s); cc.stroke();
      });
    }
    r.mark(c, H, R, 0, 0.42, (cc, P, sq, s) => {
      cc.fillStyle = r.col('#dc2626'); cc.beginPath(); cc.ellipse(P.x, P.y, 0.4 * s * sq, 0.6 * s, 0, 0, 6.29); cc.fill();
    });
  }, (c, H, R) => {
    r.cap(c, H, R, heroHairEdge(0.55, -0.45, -1.35, 0.04, 3), '#1f5a30', { grow: 1.13 });
  });
  for (const az of [0.6, -0.6]) heroEar(r, sk.H, sk.R * 1.12, az, 0.72, '#1f5a30', { len: 2.6, w: 0.32, inner: '#4ade80', tilt: rigV(0, 0.5, -0.1) });
  // Kodama reist auf der linken Schulter mit
  monKodama(r, rigAdd(sk.shL, rigV(-0.6, 0.6, -0.4)), t, 0.95);
  // Bogen
  if (aiming) {
    const h = sk.handL;
    const top = rigAdd(h, rigV(0, 4.8, -1.0));
    const bot = rigAdd(h, rigV(0, -4.8, -1.0));
    r.line([top, rigAdd(h, rigV(0, 2.7, 0.4)), h, rigAdd(h, rigV(0, -2.7, 0.4)), bot], '#854d0e', 0.8, { bias: 0.1 });
    r.line([top, sk.handR, bot], '#f8fafc', 0.22, { smooth: false, outline: false, bias: 0.08 });
    if (ap.phase === 'windup') {
      const tip = rigAdd(h, rigV(0, 0, 2.4));
      r.line([sk.handR, tip], '#bbf7d0', 0.4, { smooth: false, bias: 0.12 });
      r.glow(tip, 2.2 + pull * 1.5, 'rgba(74,222,128,0.95)', { alpha: 0.4 + pull * 0.5 });
    } else {
      r.glow(rigAdd(h, rigV(0, 0, 3 + ap.p * 10)), 3, 'rgba(134,239,172,0.95)', { alpha: 1 - ap.p });
    }
    r.ball(rigAdd(top, rigV(0, 0, 0.3)), 0.6, '#fbcfe8', { bias: 0.15, gloss: 0 });
  } else {
    monBowRest(r, sk.handL, '#854d0e', { up: rigV(0.15, 1, 0.3) });
  }
  r.flush();
}

// 2. SPOREN-SPUCKER - weicher Pilz-Dumpling mit Samthaube, Punkten und Sporenwolke
function monSporeSpitter(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 16, time, state, hitFlash, opts, { blink: 1.3 });
  const { r, ap, t } = M;
  const squash = ap.phase === 'windup' ? rigEaseInOut(ap.p) : (ap.phase === 'strike' ? -Math.max(0, 1 - ap.p * 2.5) : 0);
  const hopPh = t * 7;
  const hop = M.moving ? Math.abs(Math.sin(hopPh)) * 2.2 : 0;
  r.shadow(10 - hop * 0.6, 3.6, 0.3);
  const breathe = Math.sin(t * 2.4) * 0.35;
  const sx = 1 + squash * 0.16;
  const sy = 1 - squash * 0.2;
  // Stummelfüßchen
  for (const sd of [1, -1]) {
    const lift = M.moving ? Math.max(0, Math.sin(hopPh + (sd > 0 ? 0 : MON_PI))) * 1.4 : 0;
    r.ball(rigV(sd * 2.6, 0.8 + lift, 0.6), 1.6, '#e2cfb3', { sy: 0.7 });
  }
  const stem = rigV(0, 6.0 * sy + hop, 0);
  r.ball(stem, 5.4, '#f6e8d3', { sx, sy: 1.1 * sy, gloss: 0.25, after: (c) => {
    r.eye(c, stem, 5.4, 0.36, 0.12, { color: '#3b1d4a', size: 1.0, blink: M.blink, tall: 1.3 });
    r.eye(c, stem, 5.4, -0.36, 0.12, { color: '#3b1d4a', size: 1.0, blink: M.blink, tall: 1.3 });
    r.blush(c, stem, 5.4, 0.62, -0.08, '#c084fc', 1.0);
    r.blush(c, stem, 5.4, -0.62, -0.08, '#c084fc', 1.0);
    if (ap.phase === 'strike' && ap.p < 0.6) r.mouth(c, stem, 5.4, 0, -0.18, { open: 0.9, w: 0.9 });
    else r.mouth(c, stem, 5.4, 0, -0.16, { w: 0.6 });
  } });
  // Ärmchen
  for (const sd of [1, -1]) r.ball(rigAdd(stem, rigV(sd * 5.0 * sx, -1.0 + Math.sin(t * 3 + sd) * 0.4, 0.6)), 1.2, '#f6e8d3', { gloss: 0 });
  // Lamellen unter dem Hut und der samtige Hut mit Punkten
  const capC = rigV(0, 12.2 * sy + hop + breathe * 0.3, 0);
  r.ball(rigAdd(capC, rigV(0, -1.4, 0)), 8.0, '#d8ccf5', { sx: sx * 1.02, sy: 0.3, gloss: 0, bias: 0.1 });
  r.ball(capC, 8.4, '#7c3aed', { sx, sy: 0.64 * (1 + squash * 0.12), gloss: 0.5, bias: 0.2 });
  monSpots(r, capC, 8.4 * sx, 8.4 * 0.64, 8.4,
    [[0, 0.75, 1.4], [0.9, 0.45, 1.0], [-0.95, 0.5, 1.15], [1.8, 0.35, 0.9], [-1.9, 0.3, 1.0], [2.8, 0.5, 1.1], [-2.7, 0.55, 0.95], [0.4, 0.25, 0.7]],
    '#faf5ff', { bias: 0.5 });
  // Sporen: Aufladen kreist um den Hut, beim Spucken schießt eine Wolke nach vorne
  if (ap.phase === 'windup') {
    for (let i = 0; i < 5; i++) {
      const a = t * 4 + i * 1.26;
      const rad = 9 - ap.p * 3;
      r.glow(rigV(Math.cos(a) * rad, capC.y + 1 + Math.sin(a * 2) * 1.2, Math.sin(a) * rad), 1.4 + ap.p, 'rgba(192,132,252,0.95)', { alpha: 0.4 + ap.p * 0.5 });
    }
  } else if (ap.phase === 'strike') {
    for (let i = 0; i < 6; i++) {
      const spread = (i - 2.5) * 0.35;
      const d = 4 + ap.p * 16;
      r.glow(rigV(Math.sin(spread) * d, stem.y + Math.cos(i * 1.7) * 1.5, 4 + Math.cos(spread) * d), 2.5 + ap.p * 2, 'rgba(167,139,250,0.9)', { alpha: 1 - ap.p });
    }
  }
  r.flush();
}

// 9. TAU-TROPFEN BLOB - glasklarer Tautropfen mit Eichelhütchen, hüpft mit Squash & Stretch
function monGreenSlime(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 16, time, state, hitFlash, opts, { blink: 0.8 });
  const { r, ap, t } = M;
  let h = 0;
  let sq = Math.sin(t * 4) * 0.06; // + = platt, - = gestreckt
  let lunge = 0;
  if (M.moving) {
    const ph = (t * 2.6) % 1;
    if (ph < 0.6) {
      const k = ph / 0.6;
      h = Math.sin(k * MON_PI) * 7;
      sq = -0.18 * Math.sin(k * MON_PI);
    } else {
      sq = 0.25 * Math.sin(((ph - 0.6) / 0.4) * MON_PI);
    }
  }
  if (ap.phase === 'windup') sq = 0.35 * rigEaseInOut(ap.p);
  if (ap.phase === 'strike') {
    const k = ap.p;
    h = Math.sin(k * MON_PI) * 6;
    lunge = Math.sin(k * MON_PI) * 7;
    sq = -0.25 * Math.sin(k * MON_PI);
  }
  r.shadow(12 / (1 + h * 0.06), 4.2 / (1 + h * 0.06), 0.3, 0, 0.2);
  const R = 9.6;
  const C = rigV(0, R * (1 - sq) * 0.95 + h, lunge);
  // Gelee-Körper (durchscheinend) mit innerem Kern und Luftbläschen
  r.ball(rigAdd(C, rigV(0, -1.5, 0)), 5.0, '#16a34a', { sy: 0.9, alpha: 0.55, outline: false, gloss: 0, bias: -0.3 });
  for (let i = 0; i < 3; i++) {
    const a = t * 0.8 + i * 2.1;
    r.ball(rigAdd(C, rigV(Math.cos(a) * 3.5, Math.sin(t * 1.3 + i) * 2.5 - 1, Math.sin(a) * 2)), 0.6 + i * 0.2, '#dcfce7', { outline: false, alpha: 0.7, gloss: 0.6, bias: -0.2 });
  }
  r.ball(C, R, '#4ade80', { sx: 1 + sq * 0.55, sy: (1 - sq), alpha: 0.86, gloss: 0.65, after: (c) => {
    const ey = 0.05 + sq * 0.1;
    r.eye(c, C, R, 0.34, ey, { color: '#14532d', size: 1.45, tall: 1.25, blink: M.blink });
    r.eye(c, C, R, -0.34, ey, { color: '#14532d', size: 1.45, tall: 1.25, blink: M.blink });
    r.blush(c, C, R, 0.6, -0.15, '#f472b6', 1.3);
    r.blush(c, C, R, -0.6, -0.15, '#f472b6', 1.3);
    if (ap.phase !== 'idle') r.mouth(c, C, R, 0, -0.25, { open: 0.8, w: 0.9, inner: '#166534' });
    else r.mouth(c, C, R, 0, -0.22, { w: 0.8 });
  } });
  // Eichelhütchen
  const top = rigAdd(C, rigV(0.6, R * (1 - sq) * 0.88, -0.5));
  r.ball(top, 3.6, '#a16207', { sy: 0.6, gloss: 0.3, bias: 0.3, after: (c, P, rr) => {
    c.save(); c.strokeStyle = rr.col('#713f12'); c.lineWidth = 0.3 * rr.s;
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(P.x - 2.8 * rr.s, P.y + i * 0.6 * rr.s); c.lineTo(P.x + 2.8 * rr.s, P.y + i * 0.6 * rr.s + 0.3 * rr.s); c.stroke(); }
    c.restore();
  } });
  r.capsule(rigAdd(top, rigV(0, 1.6, 0)), rigAdd(top, rigV(0.6, 3.0, -0.3)), 0.5, 0.35, '#78350f', { bias: 0.35 });
  r.flush();
}

// 10. TEER-SCHLAMM - riesiger Susuwatari-Rußball mit Glubschaugen, Teerpfütze und Konpeitō-Rußgeistern
function monTarMire(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 18, time, state, hitFlash, opts, { blink: 2.2 });
  const { r, ap, t } = M;
  // Glänzende Teerpfütze
  ctx.save();
  ctx.fillStyle = 'rgba(10, 10, 16, 0.75)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, 17 + Math.sin(t * 2) * 1, 5.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx - 6, cy + 16.6, 4, 1, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const puff = ap.phase === 'windup' ? rigEaseInOut(ap.p) : (ap.phase === 'strike' ? 1 - ap.p : 0);
  const bounce = M.moving ? Math.abs(Math.sin(t * 6)) * 1.5 : Math.sin(t * 2) * 0.4;
  const R = 10 + puff * 2;
  const C = rigV(0, 10.5 + bounce + puff, 0);
  r.ball(C, R, '#262833', { gloss: 0.12, outline: false, after: (c, P, rr) => {
    // Rußiges Fell: viele feine Härchen entlang der Silhouette
    c.save();
    c.strokeStyle = rr.col('#15161d');
    c.lineCap = 'round';
    const Rs = R * rr.s;
    for (let k = 0; k < 46; k++) {
      const a = (k / 46) * Math.PI * 2;
      const jit = Math.sin(k * 12.9898 + Math.floor(t * 6) * 0.3) * 0.5 + 0.5;
      const len = (0.12 + jit * 0.22) * Rs;
      c.lineWidth = (0.5 + jit * 0.5) * rr.s;
      c.beginPath();
      c.moveTo(P.x + Math.cos(a) * Rs * 0.86, P.y + Math.sin(a) * Rs * 0.86);
      c.lineTo(P.x + Math.cos(a + 0.05) * (Rs + len), P.y + Math.sin(a + 0.05) * (Rs + len));
      c.stroke();
    }
    c.restore();
    const wide = 1.6 - puff * 0.4;
    r.eye(c, C, R, 0.36, 0.18, { white: true, style: 'dot', color: '#0b0b10', size: 2.0, tall: wide * 0.62, blink: M.blink });
    r.eye(c, C, R, -0.36, 0.18, { white: true, style: 'dot', color: '#0b0b10', size: 2.0, tall: wide * 0.62, blink: M.blink });
    if (ap.phase === 'strike' && ap.p < 0.5) r.mouth(c, C, R, 0, -0.25, { open: 1.6, w: 1.8, inner: '#450a0a' });
  } });
  // Konpeitō-Rußgeister hüpfen herum und halten Sternbonbons
  const candy = ['#f9a8d4', '#fde047', '#93c5fd'];
  for (let i = 0; i < 3; i++) {
    const a = t * 0.9 + i * 2.1;
    const hop = Math.abs(Math.sin(t * 5 + i * 1.3)) * 2.5;
    const p = rigV(Math.cos(a) * 13, 2 + hop, Math.sin(a) * 9);
    r.ball(p, 1.9, '#1f2029', { outline: false, gloss: 0.1, after: (c, P, rr) => {
      c.save(); c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(P.x - 0.6 * rr.s, P.y - 0.3 * rr.s, 0.55 * rr.s, 0, 6.29); c.arc(P.x + 0.6 * rr.s, P.y - 0.3 * rr.s, 0.55 * rr.s, 0, 6.29); c.fill();
      c.fillStyle = '#000'; c.beginPath(); c.arc(P.x - 0.6 * rr.s, P.y - 0.3 * rr.s, 0.22 * rr.s, 0, 6.29); c.arc(P.x + 0.6 * rr.s, P.y - 0.3 * rr.s, 0.22 * rr.s, 0, 6.29); c.fill();
      c.restore();
    } });
    r.ball(rigAdd(p, rigV(0, 2.4, 0)), 0.75, candy[i], { outline: false, gloss: 0.6, bias: 0.1 });
  }
  if (ap.phase === 'strike' && ap.p < 0.7) {
    r.ball(rigV(0, C.y - 2, R + ap.p * 14), 2.4 * (1 - ap.p * 0.5), '#111118', { gloss: 0.6, bias: 1 });
  }
  r.flush();
}

// 11. SCHATTENWOLF - weißer Okami-Geisterwolf mit roten Zeichnungen, Flammenspiegel und Geisterschweif
function monDireWolf(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 18, time, state, hitFlash, opts, { blink: 0.6, scale: 1.3 });
  const { r, ap, t } = M;
  r.shadow(10, 3.4, 0.3);
  const crouch = ap.phase === 'windup' ? rigEaseInOut(ap.p) * 0.55 : 0;
  const pounce = ap.phase === 'strike' ? Math.sin(ap.p * MON_PI) : 0;
  const q = rigQuad(t, { moving: M.moving || pounce > 0, freq: pounce > 0 ? 16 : 11, len: 10, width: 2.1, upper: 3.1, lower: 3.0, gait: pounce > 0 ? 'gallop' : 'trot', crouch });
  // Vorspringen: alles nach vorne und hoch
  const jump = rigV(0, pounce * 3, pounce * 6);
  q.front = rigAdd(q.front, jump);
  q.back = rigAdd(q.back, rigScale(jump, 0.7));
  q.head = rigAdd(q.head, rigAdd(jump, rigV(0, -crouch * 3, crouch * 1.5)));
  const white = '#f3f4f6';
  for (const key of ['RH', 'LH', 'RF', 'LF']) {
    const L = q.legs[key];
    const isF = key.charAt(1) === 'F';
    const root = isF ? q.front : q.back;
    const side = key.charAt(0) === 'R' ? 1 : -1;
    const hip = rigV(side * 2.1, root.y - 0.6, root.z);
    let foot = rigAdd(L.foot, rigScale(jump, isF ? 1.2 : 0.5));
    if (pounce > 0 && isF) foot = rigAdd(root, rigV(side * 1.8, -2.4, 3.4));
    const knee = rigIK(hip, foot, 3.1, 3.0, isF ? rigV(0, 0, -1) : rigV(0, 0, 1));
    r.capsule(hip, knee, 1.35, 0.95, white);
    r.capsule(knee, foot, 0.95, 0.7, white);
    r.ball(rigAdd(foot, rigV(0, 0.3, 0.5)), 0.95, '#e5e7eb', { sy: 0.7 });
  }
  // Rumpf: Brust, Bauch, Hinterteil
  const mid = rigLerp(q.front, q.back, 0.5);
  r.ball(rigAdd(q.back, rigV(0, 0.8, -0.5)), 3.3, white, { gloss: 0.2, after: (c) => {
    // rote Wirbel-Zeichnung auf der Flanke
    for (const sd of [1, -1]) {
      r.mark(c, rigAdd(q.back, rigV(0, 0.8, -0.5)), 3.3, sd * 1.4, 0.2, (cc, P, sq, s) => {
        cc.strokeStyle = r.col('#dc2626'); cc.lineWidth = 0.55 * s; cc.lineCap = 'round';
        cc.beginPath(); cc.arc(P.x, P.y, 1.1 * s, 0.3, 4.8); cc.stroke();
      });
    }
  } });
  r.capsule(rigAdd(q.back, rigV(0, 0.9, 0)), rigAdd(q.front, rigV(0, 1.0, 0)), 3.0, 3.3, white, { bias: 0.05 });
  r.ball(rigAdd(q.front, rigV(0, 1.3, 0.6)), 3.7, white, { gloss: 0.2 });
  // Flammender Göttlicher Spiegel auf dem Rücken
  const disc = rigAdd(mid, rigV(0, 4.6, 0.2));
  r.glow(disc, 5, 'rgba(251,146,60,0.9)', { alpha: 0.45 + Math.sin(t * 6) * 0.1 });
  r.ball(disc, 2.4, '#dc2626', { sy: 0.45, gloss: 0.6, bias: 0.4, after: (c, P, rr) => {
    c.save(); c.fillStyle = rr.col('#fde047'); c.beginPath(); c.ellipse(P.x, P.y, 1.2 * rr.s, 0.55 * rr.s, 0, 0, 6.29); c.fill(); c.restore();
  } });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * MON_PI * 2 + t * 2;
    r.glow(rigAdd(disc, rigV(Math.cos(a) * 2.8, 0.6 + Math.sin(t * 9 + i) * 0.5, Math.sin(a) * 2.8)), 1.3, 'rgba(253,186,116,0.95)', { alpha: 0.7 });
  }
  // Geisterschweif mit blauweißer Flammenspitze
  const tailPts = heroTail(r, rigAdd(q.back, rigV(0, 1.6, -3)), t, M.moving, white, '#bae6fd', { dir: rigV(0, M.moving ? 0.15 : 0.4, -1), n: 6, seg: 0.85, r0: 1.0, r1: 1.8, tipFrom: 0.8 });
  r.glow(tailPts[tailPts.length - 1], 3.5, 'rgba(125,211,252,0.95)', { alpha: 0.6 });
  // Mähne, Hals, Kopf mit langer Schnauze
  const H = q.head;
  r.capsule(rigAdd(q.front, rigV(0, 2.2, 1.2)), H, 2.4, 2.0, white);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * MON_PI * 2 + 0.4;
    r.ball(rigAdd(rigLerp(q.front, H, 0.45), rigV(Math.cos(a) * 1.9, 1.6 + Math.sin(a) * 1.2, -0.4)), 1.7, '#e5e7eb', { gloss: 0.1, bias: -0.05 });
  }
  const HR = 2.7;
  const open = pounce > 0.2 ? 1 : 0;
  r.ball(H, HR, white, { gloss: 0.25, after: (c) => {
    r.eye(c, H, HR, 0.55, 0.15, { style: 'slit', color: '#f59e0b', size: 0.75, blink: M.blink });
    r.eye(c, H, HR, -0.55, 0.15, { style: 'slit', color: '#f59e0b', size: 0.75, blink: M.blink });
    for (const sd of [1, -1]) {
      r.mark(c, H, HR, sd * 0.55, 0.42, (cc, P, sq, s) => {
        cc.strokeStyle = r.col('#dc2626'); cc.lineWidth = 0.5 * s; cc.lineCap = 'round';
        cc.beginPath(); cc.moveTo(P.x - sd * 0.3 * s * sq, P.y + 0.3 * s); cc.quadraticCurveTo(P.x + sd * 0.5 * s * sq, P.y - 0.9 * s, P.x + sd * 1.3 * s * sq, P.y - 0.5 * s); cc.stroke();
      });
    }
  } });
  const snoutB = rigAdd(H, rigV(0, -0.5, HR * 0.7));
  const snoutT = rigAdd(snoutB, rigV(0, -0.5 - open * 0.3, 2.6));
  r.capsule(snoutB, snoutT, 1.5, 0.8, white, { bias: 0.1 });
  r.ball(rigAdd(snoutT, rigV(0, 0.45, 0.35)), 0.5, '#1f2937', { gloss: 0.6, bias: 0.2 });
  if (open) r.capsule(rigAdd(snoutB, rigV(0, -1.4, 0)), rigAdd(snoutT, rigV(0, -1.6, -0.3)), 0.8, 0.5, '#7f1d1d', { bias: 0.05 });
  for (const sd of [1, -1]) heroEar(r, H, HR, sd * 0.6, 0.75, white, { len: 2.4, w: 0.3, inner: '#fca5a5', tilt: rigV(0, 0.5, -0.4) });
  r.flush();
}

// 3. MOOS-KOLOSS - uralter Laputa-Steinwächter mit Moosdach, Visier-Augen, langen Armen und Glühwürmchen
function monBoulderTroll(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 22, time, state, hitFlash, opts, { blink: 1.7 });
  const { r, ap, t } = M;
  r.shadow(17, 5.5, 0.32);
  const stone = '#8a9597';
  const stoneDark = '#5f6b6e';
  const raise = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const slam = ap.phase === 'strike' ? (ap.p < 0.3 ? rigEaseOut(ap.p / 0.3) : 1 - rigEaseInOut((ap.p - 0.3) / 0.7) * 0.6) : 0;
  const B = { thigh: 3.0, shin: 2.8, hipW: 3.0, torso: 10, shoulderW: 7.2, upperArm: 6.8, foreArm: 7.2, freq: 7, stride: 3.5, lift: 1.4, idleArms: 1.5, bob: 0.9 };
  const shY = (B.thigh + B.shin) * 0.94 + B.torso * 0.86;
  let handR = null;
  let handL = null;
  if (raise > 0) {
    handR = rigV(heroLerp(8, 4, raise), heroLerp(4, shY + 9, raise), heroLerp(3, 1, raise));
    handL = rigV(heroLerp(-8, -4, raise), heroLerp(4, shY + 9, raise), heroLerp(3, 1, raise));
  } else if (slam > 0) {
    handR = rigV(4, heroLerp(shY + 9, 1.8, slam), heroLerp(1, 8, slam));
    handL = rigV(-4, heroLerp(shY + 9, 1.8, slam), heroLerp(1, 8, slam));
  }
  const sk = rigBiped(t, Object.assign({}, B, { moving: M.moving, handR, handL, extraLean: raise * -0.15 + slam * 0.3, elbowPoleR: rigV(1, -0.3, -0.6), elbowPoleL: rigV(-1, -0.3, -0.6) }));
  heroLegs(r, sk, stoneDark, stone, { thighR: 2.6, kneeR: 2.3, ankleR: 2.1, toe: 1.6 });
  // Massiger Steinrumpf mit Rissen und Laputa-Rune auf der Brust
  const body = rigAdd(sk.chest, rigV(0, -0.5, 0));
  r.ball(body, 9.2, stone, { sy: 1.08, gloss: 0.12, after: (c) => {
    r.mark(c, body, 9.2, 0, -0.05, (cc, P, sq, s) => {
      cc.save(); cc.globalCompositeOperation = 'lighter';
      cc.strokeStyle = `rgba(94, 234, 212, ${0.45 + Math.sin(t * 2) * 0.2})`; cc.lineWidth = 0.55 * s;
      cc.beginPath(); cc.ellipse(P.x, P.y, 2.6 * s * sq, 2.6 * s, 0, 0, 6.29); cc.stroke();
      cc.beginPath(); cc.moveTo(P.x, P.y - 2.6 * s); cc.lineTo(P.x, P.y + 2.6 * s); cc.moveTo(P.x - 1.6 * s * sq, P.y + 0.6 * s); cc.lineTo(P.x + 1.6 * s * sq, P.y + 0.6 * s); cc.stroke();
      cc.restore();
    });
    for (const crack of [[0.8, 0.4], [-0.9, -0.3], [0.5, -0.6]]) {
      r.mark(c, body, 9.2, crack[0], crack[1], (cc, P, sq, s) => {
        cc.strokeStyle = r.col('#4b5557'); cc.lineWidth = 0.35 * s;
        cc.beginPath(); cc.moveTo(P.x - 1.2 * s * sq, P.y - 0.8 * s); cc.lineTo(P.x, P.y); cc.lineTo(P.x + 0.4 * s * sq, P.y + 1.3 * s); cc.stroke();
      });
    }
  } });
  // Moosdach mit Blüten und einem kleinen Bäumchen
  const mossC = rigAdd(body, rigV(0, 7.8, -0.8));
  r.ball(mossC, 7.6, '#4d7c3a', { sy: 0.42, gloss: 0.3, bias: 0.4 });
  monSpots(r, mossC, 7.6, 7.6 * 0.42, 7.6, [[0.5, 0.6, 0.7], [-1.2, 0.5, 0.6], [2.4, 0.4, 0.65], [-2.6, 0.5, 0.6]], '#fde047', { bias: 0.5 });
  monSpots(r, mossC, 7.6, 7.6 * 0.42, 7.6, [[1.4, 0.5, 0.6], [-0.4, 0.7, 0.55], [3.0, 0.6, 0.6]], '#f9a8d4', { bias: 0.5 });
  const trunk0 = rigAdd(mossC, rigV(-3, 2.2, -2));
  const trunk1 = rigAdd(trunk0, rigV(-0.6, 4.2, -0.4));
  r.line([trunk0, trunk1], '#6b4423', 0.9, { bias: 0.3, smooth: false });
  r.ball(rigAdd(trunk1, rigV(0, 1.2, 0)), 2.4, '#65a30d', { gloss: 0.3, bias: 0.4 });
  r.ball(rigAdd(trunk1, rigV(1.3, 0.3, 0.6)), 1.6, '#84cc16', { gloss: 0.3, bias: 0.45 });
  // Kopf mit Visier und zwei glimmenden Augen
  const H = rigAdd(sk.neck, rigV(0, 2.4, 2.4));
  r.ball(H, 4.2, stone, { sy: 0.9, gloss: 0.25, bias: 0.2, after: (c) => {
    r.mark(c, H, 4.2, 0, 0.05, (cc, P, sq, s) => {
      cc.fillStyle = r.col('#2a3133'); cc.beginPath(); cc.ellipse(P.x, P.y, 3.2 * s * sq, 1.1 * s, 0, 0, 6.29); cc.fill();
    });
    const glowA = ap.phase !== 'idle' ? 1 : 0.7 + Math.sin(t * 3) * 0.2;
    r.eye(c, H, 4.2, 0.35, 0.05, { style: 'glow', color: ap.phase !== 'idle' ? '#f87171' : '#fbbf24', size: 0.8 * glowA + 0.2, blink: M.blink });
    r.eye(c, H, 4.2, -0.35, 0.05, { style: 'glow', color: ap.phase !== 'idle' ? '#f87171' : '#fbbf24', size: 0.8 * glowA + 0.2, blink: M.blink });
  } });
  // Lange Steinarme mit schweren Fäusten
  for (const S of ['R', 'L']) {
    r.capsule(sk['sh' + S], sk['elbow' + S], 2.4, 2.0, stone);
    r.capsule(sk['elbow' + S], sk['hand' + S], 2.0, 2.2, stoneDark);
    r.ball(sk['sh' + S], 3.0, stone, { gloss: 0.15, bias: 0.05 });
    r.ball(sk['hand' + S], 2.9, stone, { gloss: 0.2, bias: 0.05 });
    r.ball(rigAdd(sk['sh' + S], rigV(0, 2.2, 0)), 2.0, '#4d7c3a', { sy: 0.45, bias: 0.3 });
  }
  if (slam > 0.85) {
    r.glow(rigV(0, 1, 8), 9, 'rgba(214,211,209,0.8)', { alpha: (slam - 0.85) * 5 });
  }
  // Glühwürmchen, die in den Steinfugen wohnen
  for (let i = 0; i < 4; i++) {
    const a = t * 0.7 + i * 1.6;
    r.glow(rigV(Math.cos(a) * 12, 14 + Math.sin(t * 1.5 + i) * 5, Math.sin(a) * 9), 1.5, 'rgba(253,230,138,0.95)', { alpha: 0.5 + Math.sin(t * 4 + i * 2) * 0.4 });
  }
  r.flush();
}

// 4. YETI-WÄCHTER - flauschiger Schnee-Totoro mit Eishörnern und roter Papierlaterne am Horn
function monFrostGiant(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 22, time, state, hitFlash, opts, { blink: 0.9 });
  const { r, ap, t } = M;
  r.shadow(16, 5.2, 0.3);
  const fur = '#f1f5f9';
  const raise = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const slam = ap.phase === 'strike' ? (ap.p < 0.3 ? rigEaseOut(ap.p / 0.3) : 1 - rigEaseInOut((ap.p - 0.3) / 0.7) * 0.7) : 0;
  const B = { thigh: 2.6, shin: 2.4, hipW: 3.4, torso: 9.5, shoulderW: 7.4, upperArm: 4.6, foreArm: 4.4, freq: 8, stride: 3, lift: 1.4, idleArms: 2.2, bob: 0.8 };
  const shY = (B.thigh + B.shin) * 0.94 + B.torso * 0.86;
  let handR = null;
  let handL = null;
  if (raise > 0) {
    handR = rigV(heroLerp(8, 3.5, raise), heroLerp(8, shY + 7, raise), heroLerp(2, 0, raise));
    handL = rigV(heroLerp(-8, -3.5, raise), heroLerp(8, shY + 7, raise), heroLerp(2, 0, raise));
  } else if (slam > 0) {
    handR = rigV(3.5, heroLerp(shY + 7, 2.5, slam), heroLerp(0, 9, slam));
    handL = rigV(-3.5, heroLerp(shY + 7, 2.5, slam), heroLerp(0, 9, slam));
  }
  const sk = rigBiped(t, Object.assign({}, B, { moving: M.moving, handR, handL, extraLean: slam * 0.25 }));
  // Stämmige Fellbeine mit Eisklauen
  for (const S of ['R', 'L']) {
    r.capsule(sk['hip' + S], sk['ankle' + S], 3.0, 2.4, fur);
    const f = sk['foot' + S];
    r.ball(rigAdd(f, rigV(0, 0.8, 0.8)), 2.4, '#e2e8f0', { sy: 0.65 });
    for (let k = -1; k <= 1; k++) r.ball(rigAdd(f, rigV(k * 1.0, 0.5, 2.8)), 0.45, '#7dd3fc', { outline: false, gloss: 0.6, bias: 0.05 });
  }
  // Birnenförmiger Fellkörper mit Fransen
  const body = rigAdd(sk.pelvis, rigV(0, 5.6 + sk.breathe * 0.4, 0));
  r.ball(body, 10.2, fur, { sy: 1.12, gloss: 0.2, after: (c) => {
    // Eisblaue Brustzeichnung mit Pfeilsicheln
    r.mark(c, body, 10.2, 0, -0.15, (cc, P, sq, s) => {
      cc.fillStyle = r.col('#dbeafe'); cc.beginPath(); cc.ellipse(P.x, P.y, 5.8 * s * sq, 5.6 * s, 0, 0, 6.29); cc.fill();
      cc.strokeStyle = r.col('#7dd3fc'); cc.lineWidth = 0.5 * s; cc.lineCap = 'round';
      for (const m of [[-2, -2], [0, -2.6], [2, -2], [-1, 0], [1, 0]]) {
        cc.beginPath(); cc.moveTo(P.x + (m[0] - 0.6) * s * sq, P.y + (m[1] + 0.5) * s); cc.lineTo(P.x + m[0] * s * sq, P.y + m[1] * s); cc.lineTo(P.x + (m[0] + 0.6) * s * sq, P.y + (m[1] + 0.5) * s); cc.stroke();
      }
    });
    // Gesicht oben am Körper
    r.mark(c, body, 10.2, 0, 0.5, (cc, P, sq, s) => {
      cc.fillStyle = r.col('#bfdbfe'); cc.beginPath(); cc.ellipse(P.x, P.y, 4.6 * s * sq, 2.8 * s, 0, 0, 6.29); cc.fill();
    });
    r.eye(c, body, 10.2, 0.2, 0.55, { color: '#0c4a6e', size: 1.0, blink: M.blink });
    r.eye(c, body, 10.2, -0.2, 0.55, { color: '#0c4a6e', size: 1.0, blink: M.blink });
    r.mark(c, body, 10.2, 0, 0.44, (cc, P, sq, s) => {
      cc.fillStyle = r.col('#1e3a5f'); cc.beginPath(); cc.ellipse(P.x, P.y, 0.7 * s * sq, 0.4 * s, 0, 0, 6.29); cc.fill();
    });
    if (ap.phase !== 'idle') r.mouth(c, body, 10.2, 0, 0.36, { open: 1.0, w: 1.6, inner: '#1e3a8a' });
    else r.mouth(c, body, 10.2, 0, 0.37, { w: 1.2 });
  } });
  // Fellfransen entlang der Seiten
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * MON_PI * 2;
    const n = rigV(Math.sin(a), 0, Math.cos(a));
    if (r.toCam(n) < -0.2) continue;
    r.ball(rigV(body.x + n.x * 9.6, body.y - 6 + Math.sin(i * 2.3) * 1.5, body.z + n.z * 9.6), 2.2, '#e2e8f0', { gloss: 0.1, bias: -0.02 });
  }
  // Große Arme mit Krallen
  for (const S of ['R', 'L']) {
    r.capsule(sk['sh' + S], sk['elbow' + S], 2.8, 2.4, fur);
    r.capsule(sk['elbow' + S], sk['hand' + S], 2.4, 2.0, fur);
    r.ball(sk['hand' + S], 2.4, '#e2e8f0', { gloss: 0.15 });
    for (let k = -1; k <= 1; k++) r.ball(rigAdd(sk['hand' + S], rigV(k * 0.9, -1.4, 1.2)), 0.45, '#7dd3fc', { outline: false, bias: 0.05 });
  }
  // Eishörner (gebogen), am linken hängt die rote Laterne
  const top = rigAdd(body, rigV(0, 9.4, 0));
  for (const sd of [1, -1]) {
    const pts = [];
    for (let i = 0; i <= 5; i++) {
      const f = i / 5;
      pts.push(rigAdd(top, rigV(sd * (2.5 + f * 5.5), 1 + Math.sin(f * MON_PI) * 3.5 - f * 0.5, 0.5 - f * 1.5)));
    }
    for (let i = 0; i < pts.length - 1; i++) {
      r.capsule(pts[i], pts[i + 1], 1.6 - i * 0.25, 1.35 - i * 0.25, i % 2 ? '#bae6fd' : '#7dd3fc', { light: 0.5 });
    }
    if (sd < 0) {
      const tip = pts[pts.length - 1];
      const sway = Math.sin(t * 2.2) * 0.6;
      const lan = rigAdd(tip, rigV(sway, -3.4, 0.3));
      r.line([tip, rigAdd(lan, rigV(0, 1.6, 0))], '#78350f', 0.2, { outline: false, smooth: false });
      r.ball(lan, 1.7, '#dc2626', { sy: 1.25, gloss: 0.5, bias: 0.1 });
      r.glow(lan, 4.5, 'rgba(248,113,113,0.9)', { alpha: 0.55 + Math.sin(t * 7) * 0.1 });
    }
  }
  // Frostatem und Schneeflocken
  if (ap.phase !== 'idle') r.glow(rigAdd(body, rigV(0, 3, 10)), 4 + raise * 3, 'rgba(186,230,253,0.9)', { alpha: 0.6 });
  for (let i = 0; i < 4; i++) {
    const life = (t * 0.35 + i / 4) % 1;
    r.glow(rigV(Math.sin(i * 4.1 + t) * 12, 28 - life * 26, Math.cos(i * 2.7) * 8), 1.2, 'rgba(240,249,255,0.95)', { alpha: Math.sin(life * MON_PI) * 0.8 });
  }
  r.flush();
}

// 7. LATERNEN-PYROMANT - schwebender Geist mit lächelndem Papierlaternen-Kopf und zwei Flammenwichten
function monPyromancer(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 18, time, state, hitFlash, opts, { blink: 2.4, scale: 1.3 });
  const { r, ap, t } = M;
  const hover = 2.4 + Math.sin(t * 2.6) * 0.8;
  monHoverShadow(r, 8, 2.8, hover);
  const charge = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const throwP = ap.phase === 'strike' ? ap.p : -1;
  const B = { thigh: 2.2, shin: 2.1, hipW: 1.2, torso: 5.8, shoulderW: 2.4, upperArm: 2.4, foreArm: 2.3 };
  const shY = (B.thigh + B.shin) * 0.94 + B.torso * 0.86 + hover;
  let handR = null;
  let handL = null;
  if (charge > 0) {
    handR = rigV(1.6, shY + 2 * charge, 2.6);
    handL = rigV(-1.6, shY + 2 * charge, 2.6);
  } else if (throwP >= 0) {
    handR = rigV(0.8, shY + heroLerp(2, -1, rigEaseOut(Math.min(1, throwP * 2))), heroLerp(2.6, 4.4, Math.min(1, throwP * 2)));
    handL = rigV(-2.4, shY - 2.5, 0.5);
  }
  const sk = rigBiped(t, Object.assign({}, B, { moving: false, handR: handR && rigSub(handR, rigV(0, hover, 0)), handL: handL && rigSub(handL, rigV(0, hover, 0)) }));
  for (const k of Object.keys(sk)) { const v = sk[k]; if (v && typeof v === 'object' && 'y' in v) v.y += hover; }
  // Zerfranstes Gewand (schwebt, kein Unterleib)
  const neck = rigAdd(rigLerp(sk.shR, sk.shL, 0.5), rigV(0, 0.4, 0));
  const hem = rigV(Math.sin(t * 2) * 0.5, hover - 0.8, M.moving ? -1.2 : Math.cos(t * 1.7) * 0.3);
  r.cone(neck, hem, 1.8, 3.6, '#4a1d2e', { sz: 0.9, hem: '#fbbf24', hemW: 0.35, bias: 0 });
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * MON_PI * 2;
    const n = rigV(Math.sin(a), 0, Math.cos(a));
    if (r.toCam(n) < -0.3) continue;
    const b = rigV(hem.x + n.x * 3.4, hem.y + 0.3, hem.z + n.z * 3.1);
    r.poly([rigAdd(b, rigV(-n.z * 0.7, 0, n.x * 0.7)), rigAdd(b, rigV(n.x * 0.4, -1.6 - Math.sin(t * 5 + k) * 0.4, n.z * 0.4)), rigAdd(b, rigV(n.z * 0.7, 0, -n.x * 0.7))], '#4a1d2e', { smooth: false, bias: 0.02 });
  }
  heroArms(r, sk, '#5b2338', '#78350f', { wide: '#5b2338', glove: '#3f1d14' });
  // Laternenkopf mit Rippen und gemaltem Lächeln
  const H = rigAdd(sk.neck, rigV(0, 3.6, 0.3));
  const bright = 0.75 + charge * 0.25 + Math.sin(t * 9) * 0.05;
  r.glow(H, 9, 'rgba(251,146,60,0.9)', { alpha: 0.35 * bright, bias: -0.5 });
  r.capsule(rigAdd(H, rigV(0, 4.2, 0)), rigAdd(H, rigV(0, 3.5, 0)), 1.6, 2.2, '#3f2414', { bias: 0.1 });
  r.ball(H, 3.9, charge > 0.5 ? '#fdba74' : '#fb923c', { sy: 1.15, gloss: 0.5, bias: 0.05, after: (c, P, rr) => {
    c.save(); c.strokeStyle = rr.col('#c2410c'); c.lineWidth = 0.3 * rr.s; c.globalAlpha *= 0.8;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(P.x, P.y + i * 1.5 * rr.s, 3.85 * rr.s * Math.cos(i * 0.35), 0.6 * rr.s, 0, 0, Math.PI); c.stroke(); }
    c.restore();
    r.eye(c, H, 3.9, 0.4, 0.1, { style: 'happy', lid: '#7c2d12', size: 0.85 });
    r.eye(c, H, 3.9, -0.4, 0.1, { style: 'happy', lid: '#7c2d12', size: 0.85 });
    r.mouth(c, H, 3.9, 0, -0.3, { w: 1.1, color: '#7c2d12' });
    r.blush(c, H, 3.9, 0.65, -0.15, '#ef4444', 0.8);
    r.blush(c, H, 3.9, -0.65, -0.15, '#ef4444', 0.8);
  } });
  r.capsule(rigAdd(H, rigV(0, -4.2, 0)), rigAdd(H, rigV(0, -3.6, 0)), 1.8, 2.3, '#3f2414', { bias: 0.1 });
  // Zwei Flammenwichte kreisen um ihn
  for (let i = 0; i < 2; i++) {
    const a = t * 1.8 + i * MON_PI;
    const p = rigV(Math.cos(a) * 6.5, shY + 2 + Math.sin(t * 3 + i) * 1.5, Math.sin(a) * 5);
    r.glow(p, 3, 'rgba(251,191,36,0.9)', { alpha: 0.6 });
    r.ball(p, 1.1, '#fbbf24', { outline: false, gloss: 0.6, after: (c, P, rr) => {
      c.save(); c.fillStyle = '#7c2d12'; c.beginPath(); c.arc(P.x - 0.4 * rr.s, P.y, 0.2 * rr.s, 0, 6.29); c.arc(P.x + 0.4 * rr.s, P.y, 0.2 * rr.s, 0, 6.29); c.fill(); c.restore();
    } });
    r.poly([rigAdd(p, rigV(-0.8, 0.5, 0)), rigAdd(p, rigV(Math.sin(t * 10 + i) * 0.3, 2.3, 0)), rigAdd(p, rigV(0.8, 0.5, 0))], '#f97316', { outline: false, bias: -0.05 });
  }
  // Feuerball zwischen den Händen / im Flug
  if (charge > 0) monCharge(r, rigLerp(sk.handR, sk.handL, 0.5), 1.5 + charge * 2.2, 'rgba(249,115,22,0.95)', charge);
  if (throwP >= 0 && throwP < 0.8) monCharge(r, rigAdd(sk.handR, rigV(0, 0, 2 + throwP * 18)), 3 * (1 - throwP * 0.5), 'rgba(249,115,22,0.95)', 1 - throwP);
  r.flush();
}

// 8. WOLKEN-ASTROLOGE - Eulen-Weiser mit Strohkegelhut, O-Mikuji-Streifen, Sternenmantel und Astrolabium
function monStarAstromancer(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 20, time, state, hitFlash, opts, { blink: 1.1, scale: 1.2 });
  const { r, ap, t } = M;
  const hover = 3.2 + Math.sin(t * 2.2) * 1.0;
  monHoverShadow(r, 10, 3.2, hover);
  const charge = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const cast = ap.phase === 'strike' ? ap.p : -1;
  const body = rigV(0, 7.5 + hover, 0);
  // Sternenmantel
  r.cone(rigAdd(body, rigV(0, 4.5, -0.3)), rigV(0, hover + 0.2, -0.6 - (M.moving ? 1 : 0)), 3.6, 6.2, '#312e81', { sz: 0.9, hem: '#fde047', hemW: 0.35, after: (c, T, Bt, rr) => {
    c.save(); c.fillStyle = rr.col('#fde68a');
    const stars = [[-3, -2], [2.5, -3.5], [-1, -5], [3.5, -1.2], [0.5, -1.5], [-4, -4]];
    for (const st of stars) {
      const x = Bt.x + st[0] * rr.s;
      const y = Bt.y + st[1] * rr.s;
      const s = 0.45 * rr.s * (0.7 + 0.3 * Math.sin(t * 3 + st[0]));
      c.beginPath(); c.moveTo(x, y - s * 2); c.lineTo(x + s * 0.5, y - s * 0.5); c.lineTo(x + s * 2, y); c.lineTo(x + s * 0.5, y + s * 0.5);
      c.lineTo(x, y + s * 2); c.lineTo(x - s * 0.5, y + s * 0.5); c.lineTo(x - s * 2, y); c.lineTo(x - s * 0.5, y - s * 0.5); c.fill();
    }
    c.restore();
  } });
  // Federbauch
  r.ball(body, 5.6, '#4c4f8a', { sy: 1.1, gloss: 0.2, bias: 0.1, after: (c) => {
    r.mark(c, body, 5.6, 0, -0.1, (cc, P, sq, s) => {
      cc.fillStyle = r.col('#e9e3cf'); cc.beginPath(); cc.ellipse(P.x, P.y, 3.2 * s * sq, 3.8 * s, 0, 0, 6.29); cc.fill();
      cc.strokeStyle = r.col('#a8a29e'); cc.lineWidth = 0.3 * s;
      for (let i = 0; i < 3; i++) for (let j = -1; j <= 1; j++) {
        const x = P.x + j * 1.3 * s * sq;
        const y = P.y - 2 * s + i * 1.6 * s;
        cc.beginPath(); cc.arc(x, y, 0.55 * s, 0.2, Math.PI - 0.2); cc.stroke();
      }
    });
  } });
  // Flügel-Arme halten den Stab
  const handR = rigAdd(body, rigV(3.6, 1 + charge * 3, 3.0 + charge));
  const handL = rigAdd(body, rigV(-3.8, 0.5 + Math.sin(t * 2) * 0.4, 1.8));
  for (const [sh, hand] of [[rigAdd(body, rigV(4.4, 3, 0)), handR], [rigAdd(body, rigV(-4.4, 3, 0)), handL]]) {
    r.capsule(sh, hand, 1.6, 1.0, '#3f427a');
    const sdx = sh.x > 0 ? 1 : -1;
    r.poly([sh, hand, rigAdd(hand, rigV(sdx * 0.6, -2.6, -1)), rigAdd(sh, rigV(sdx * 1.5, -4.5, -1.5))], '#3f427a', { bias: -0.05 });
  }
  const staffTop = rigAdd(handR, rigV(0.4, 6, 0.6));
  r.line([rigAdd(handR, rigV(-0.4, -5, -0.6)), staffTop], '#92400e', 0.6, { smooth: false });
  // Astrolabium: kreisende Ringe um einen Stern
  const spin = t * (1.5 + charge * 6);
  for (let i = 0; i < 2; i++) {
    const pts = [];
    for (let k = 0; k <= 16; k++) {
      const a = (k / 16) * MON_PI * 2;
      const tiltA = spin * (i ? -1 : 1) + i * 1.2;
      pts.push(rigAdd(staffTop, rigV(Math.cos(a) * 2.4, Math.sin(a) * 2.4 * Math.cos(tiltA), Math.sin(a) * 2.4 * Math.sin(tiltA))));
    }
    r.line(pts, '#fbbf24', 0.25, { outline: false, smooth: false });
  }
  monCharge(r, staffTop, 1.4 + charge * 2.5, 'rgba(253,224,71,0.95)', 0.7 + charge * 0.3);
  if (cast >= 0 && cast < 0.8) monCharge(r, rigAdd(staffTop, rigV(0, -2 * cast, 3 + cast * 16)), 2.5, 'rgba(196,181,253,0.95)', 1 - cast);
  // Eulenkopf mit Gesichtsschleier, Riesenaugen und Federohren
  const H = rigAdd(body, rigV(0, 8.6, 0.4));
  r.ball(H, 5.0, '#5b5f9e', { gloss: 0.2, after: (c) => {
    for (const sd of [1, -1]) {
      r.mark(c, H, 5.0, sd * 0.42, 0.0, (cc, P, sq, s) => {
        cc.fillStyle = r.col('#e0e7ff'); cc.beginPath(); cc.ellipse(P.x, P.y, 2.1 * s * sq, 2.1 * s, 0, 0, 6.29); cc.fill();
      });
    }
    const big = ap.phase !== 'idle' ? 1.5 : 1.3;
    r.eye(c, H, 5.0, 0.42, 0.0, { white: false, color: '#f59e0b', pupil: '#1e1b4b', size: big, tall: 1.0, blink: M.blink });
    r.eye(c, H, 5.0, -0.42, 0.0, { white: false, color: '#f59e0b', pupil: '#1e1b4b', size: big, tall: 1.0, blink: M.blink });
  } });
  r.capsule(rigAdd(H, rigV(0, -0.6, 4.4)), rigAdd(H, rigV(0, -1.8, 5.2)), 0.7, 0.2, '#fbbf24', { bias: 0.3 });
  for (const sd of [1, -1]) heroEar(r, H, 5.0, sd * 0.7, 0.55, '#3f427a', { len: 2.2, w: 0.25, tilt: rigV(sd * 0.6, 0.6, 0) });
  // Strohkegelhut mit Glücksstreifen
  const hatBot = rigAdd(H, rigV(0, 3.4, -0.2));
  r.cone(rigAdd(hatBot, rigV(0, 5.2, -0.6)), hatBot, 0.3, 6.2, '#d4a24c', { sz: 1, bias: 0.5 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * MON_PI * 2 + 0.4;
    const n = rigV(Math.sin(a), 0, Math.cos(a));
    if (r.toCam(n) < -0.2) continue;
    const b = rigAdd(hatBot, rigV(n.x * 5.8, 0, n.z * 5.8));
    const sway = Math.sin(t * 3 + i) * 0.3;
    r.poly([b, rigAdd(b, rigV(0.4 + sway, -2.4, 0)), rigAdd(b, rigV(-0.3 + sway, -2.4, 0))], '#f8fafc', { smooth: false, bias: 0.55 });
  }
  r.flush();
}

// 20. ORIGAMI-KRIEGER - gefalteter Papier-Samurai mit Kabuto, Mondsichel, roter Menpo-Maske und Tusche-Katana
function monCursedKnight(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 19, time, state, hitFlash, opts, { blink: 0.2, scale: 1.4 });
  const { r, ap, t } = M;
  r.shadow(8.5, 3, 0.32);
  const B = { thigh: 2.5, shin: 2.4, hipW: 1.5, torso: 5.8, shoulderW: 2.8, upperArm: 2.4, foreArm: 2.3, freq: 11 };
  const shY = (B.thigh + B.shin) * 0.94 + B.torso * 0.86;
  let handR = null;
  let handL = null;
  let bladeDir = rigNorm(rigV(0.3, 0.25, 1));
  let twist = 0;
  if (ap.phase === 'windup') {
    const k = rigEaseInOut(ap.p);
    handR = rigV(heroLerp(1.8, 1.4, k), heroLerp(shY - 3, shY + 3.2, k), heroLerp(2.5, -0.6, k));
    handL = rigAdd(handR, rigV(-1.1, -0.4, 0.2));
    bladeDir = rigNorm(rigV(heroLerp(0.3, 0.3, k), heroLerp(0.25, 0.9, k), heroLerp(1, -0.5, k)));
    twist = 0.4 * k;
  } else if (ap.phase === 'strike') {
    const k = ap.p < 0.35 ? rigEaseOut(ap.p / 0.35) : 1;
    handR = rigV(heroLerp(1.4, -1.6, k), heroLerp(shY + 3.2, shY - 3.6, k), heroLerp(-0.6, 3.8, k));
    handL = rigAdd(handR, rigV(-0.9, 0.5, -0.4));
    bladeDir = rigNorm(rigV(heroLerp(0.3, -0.6, k), heroLerp(0.9, -0.55, k), heroLerp(-0.5, 0.8, k)));
    twist = heroLerp(0.4, -0.5, k);
  }
  const sk = rigBiped(t, Object.assign({}, B, { moving: M.moving, handR, handL, twist, crouch: ap.phase === 'strike' ? 0.25 : 0 }));
  sk.H = rigV(sk.head.x, sk.neck.y + 3.9, sk.head.z + 0.2);
  sk.R = 4.0;
  const paper = '#f1ede4';
  const ink = '#1c1f2b';
  heroLegs(r, sk, ink, '#111318', { shin: paper, toe: 0.9 });
  // Kusazuri: gefaltete Papier-Schurzplatten
  heroRobe(r, sk, paper, t, M.moving, { topY: 1.6, hemY: sk.pelvis.y - 1.6, rt: 2.2, rb: 3.4, hem: '#b91c1c', hemW: 0.5, trail: 0.3, after: (c, T, Bt, rr) => {
    c.save(); c.strokeStyle = rr.col('#9ca3af'); c.lineWidth = 0.3 * rr.s;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(T.x + i * 1.0 * rr.s, T.y); c.lineTo(Bt.x + i * 1.6 * rr.s, Bt.y + 1.2 * rr.s); c.stroke(); }
    c.restore();
  } });
  // Do: Brustpanzer aus gefaltetem Papier mit roter Schnürung
  heroTorso(r, sk, paper, { rt: 2.7, rb: 2.2, after: (c, T, Bt, rr) => {
    c.save(); c.strokeStyle = rr.col('#b91c1c'); c.lineWidth = 0.35 * rr.s;
    for (let i = 0; i < 3; i++) {
      const y = T.y + (Bt.y - T.y) * (0.3 + i * 0.22);
      c.beginPath(); c.moveTo(T.x - 2.2 * rr.s, y); c.lineTo(T.x + 2.2 * rr.s, y); c.stroke();
    }
    c.restore();
  } });
  // Sode: eckige Schulterplatten
  for (const S of ['R', 'L']) {
    const sh = sk['sh' + S];
    const sd = S === 'R' ? 1 : -1;
    r.poly([rigAdd(sh, rigV(-sd * 0.4, 1.2, 1.2)), rigAdd(sh, rigV(sd * 1.6, 0.6, 1.3)), rigAdd(sh, rigV(sd * 2.1, -2.4, 1.0)), rigAdd(sh, rigV(sd * 0.4, -2.0, 1.4))], paper, { smooth: false, bias: 0.35 });
  }
  heroArms(r, sk, ink, '#111318', { cuff: '#b91c1c' });
  // Kopf: Kabuto mit Nackenschutz, goldene Mondsichel, rote Menpo mit Glutaugen
  heroHead(r, sk, '#7f1d1d', (c, H, R) => {
    r.eye(c, H, R, 0.38, 0.0, { style: 'glow', color: '#ef4444', size: 0.75 });
    r.eye(c, H, R, -0.38, 0.0, { style: 'glow', color: '#ef4444', size: 0.75 });
    r.mark(c, H, R, 0, -0.42, (cc, P, sq, s) => {
      cc.strokeStyle = r.col('#f8fafc'); cc.lineWidth = 0.3 * s;
      cc.beginPath(); for (let i = -2; i <= 2; i++) { cc.moveTo(P.x + i * 0.5 * s * sq, P.y - 0.3 * s); cc.lineTo(P.x + i * 0.5 * s * sq, P.y + 0.5 * s); } cc.stroke();
    });
  }, (c, H, R) => {
    r.cap(c, H, R, (az) => 0.28 + Math.abs(az) * 0.02 - (Math.abs(az) > 2 ? (Math.abs(az) - 2) * 0.9 : 0), ink, { grow: 1.12, gloss: 0.5 });
  });
  const neckGuard0 = rigAdd(sk.H, rigV(0, 1.6, -0.3));
  r.cone(neckGuard0, rigAdd(sk.H, rigV(0, -0.6, -1.2)), 4.2, 5.6, ink, { sz: 0.95, bias: -0.25 });
  const crest = rigSurfPt(sk.H, sk.R * 1.15, 0, 0.42);
  r.poly([rigAdd(crest, rigV(-0.7, -0.2, 0.3)), rigAdd(crest, rigV(-4.6, 4.8, 1.2)), rigAdd(crest, rigV(-2.6, 1.6, 0.9)), rigAdd(crest, rigV(0, 0.9, 0.8)), rigAdd(crest, rigV(2.6, 1.6, 0.9)), rigAdd(crest, rigV(4.6, 4.8, 1.2)), rigAdd(crest, rigV(0.7, -0.2, 0.3))], '#fbbf24', { bias: 1.2, lineWidth: 0.5 });
  r.ball(rigAdd(crest, rigV(0, 0.1, 0.4)), 0.7, '#dc2626', { bias: 1.3, gloss: 0.5 });
  // Katana mit Tuschespur
  heroDrawBlade(r, sk.handR, bladeDir, { blade: '#f8fafc', grip: '#111318', guard: '#fbbf24', len: 9.8, curve: 0.6, bladeW: 0.5 });
  if (ap.phase === 'strike' && ap.p < 0.6) {
    const tip = rigAdd(sk.handR, rigScale(bladeDir, 9.8));
    for (let i = 0; i < 4; i++) {
      r.ball(rigAdd(tip, rigV(Math.sin(i * 2.3) * 2, -i * 1.5 * ap.p - 1, Math.cos(i * 1.7) * 2)), 0.7 - i * 0.12, '#0f0f14', { outline: false, gloss: 0.4, alpha: 1 - ap.p });
    }
  }
  // Tropfende Tusche
  const drip = (t * 0.8) % 1;
  r.ball(rigAdd(sk.pelvis, rigV(1.4, 1.2 - drip * 4, 2.6)), 0.4 * (1 - drip * 0.5), '#0f0f14', { outline: false, alpha: 1 - drip });
  r.flush();
}

// 5. SMARAGD-NATTER - Jade-Banddrache mit Mähne, Barteln, Geweih und Kodama-Reiter mit Seerosenschirm
function monSlitheringViper(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 16, time, state, hitFlash, opts, { blink: 0.5, scale: 1.1 });
  const { r, ap, t } = M;
  r.shadow(14, 4, 0.26, 0, 0);
  const coil = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const lunge = ap.phase === 'strike' ? Math.sin(Math.min(1, ap.p * 1.6) * MON_PI) : 0;
  const rise = [7 + coil * 3 - lunge * 3, 5.6 + coil * 2.2 - lunge * 2, 3.9 + coil - lunge, 2.4, 1.3, 0.6, 0.2];
  const pts = rigSerpent(t, { n: 13, seg: 1.9, moving: M.moving, amp: 2.4, idleAmp: 1.0, k: 0.7, headZ: 7 - coil * 3 + lunge * 7, rise, height: 1.2 });
  const jade = '#10b981';
  const belly = '#a7f3d0';
  // Körpersegmente vom Schwanz zum Kopf, dicker in der Mitte
  for (let i = pts.length - 1; i > 0; i--) {
    const f = i / (pts.length - 1);
    const rad = 0.55 + Math.sin((1 - f) * MON_PI * 0.85 + 0.25) * 1.9;
    const radN = 0.55 + Math.sin((1 - (i - 1) / (pts.length - 1)) * MON_PI * 0.85 + 0.25) * 1.9;
    r.capsule(pts[i], pts[i - 1], rad, radN, i % 2 ? jade : '#0ea371', { light: 0.12 });
    // Bauchschuppen-Streifen
    r.line([rigAdd(pts[i], rigV(0, -rad * 0.55, 0)), rigAdd(pts[i - 1], rigV(0, -radN * 0.55, 0))], belly, Math.min(rad, radN) * 0.7, { outline: false, bias: 0.05, smooth: false });
    // Rückenflosse aus weißer Seide
    if (i < pts.length - 2 && i % 2 === 0) {
      const top = rigAdd(pts[i], rigV(0, rad + 0.2, 0));
      r.poly([rigAdd(top, rigV(0, 0, 0.9)), rigAdd(top, rigV(Math.sin(t * 5 + i) * 0.3, 1.5, -0.4)), rigAdd(top, rigV(0, 0, -1.1))], '#ecfeff', { smooth: true, bias: 0.15 });
    }
  }
  // Kopf mit Schnauze, Geweih, Barteln und Mähne
  const H = pts[0];
  const HR = 2.5;
  const mane = rigChain(t, rigAdd(pts[1], rigV(0, 2.1, 0)), rigV(0, 0.2, -1), { n: 4, seg: 1.2, amp: 0.8, ampY: 0.4, freq: 6, k: 0.9 });
  r.line(mane, '#e0f2fe', 1.4, { bias: -0.05 });
  r.ball(H, HR, jade, { gloss: 0.4, after: (c) => {
    r.eye(c, H, HR, 0.62, 0.25, { style: 'slit', color: '#fbbf24', size: 0.7, blink: M.blink });
    r.eye(c, H, HR, -0.62, 0.25, { style: 'slit', color: '#fbbf24', size: 0.7, blink: M.blink });
  } });
  const snT = rigAdd(H, rigV(0, -0.4, 3.0));
  r.capsule(rigAdd(H, rigV(0, -0.2, 1.2)), snT, 1.8, 1.0, jade, { bias: 0.1 });
  r.ball(rigAdd(snT, rigV(0, 0.3, 0.2)), 0.55, '#065f46', { bias: 0.2, gloss: 0.4 });
  if (lunge > 0.2) r.capsule(rigAdd(snT, rigV(0, -0.6, -0.4)), rigAdd(snT, rigV(0, -1.2, 1.6)), 0.25, 0.1, '#f43f5e', { bias: 0.2 });
  for (const sd of [1, -1]) {
    const w0 = rigAdd(snT, rigV(sd * 0.8, -0.2, -0.3));
    r.line(rigChain(t + sd, w0, rigV(sd, -0.2, -0.6), { n: 4, seg: 1.1, amp: 0.5, ampY: 0.5, freq: 4, k: 1 }), '#fde68a', 0.25, { outline: false, bias: 0.15 });
    const a0 = rigSurfPt(H, HR, sd * 0.6, 0.85);
    const a1 = rigAdd(a0, rigV(sd * 0.6, 2.0, -1.2));
    r.line([a0, a1, rigAdd(a1, rigV(sd * 0.8, 0.9, -0.6))], '#f8fafc', 0.38, { smooth: false, bias: 0.1 });
    r.line([rigLerp(a0, a1, 0.6), rigAdd(rigLerp(a0, a1, 0.6), rigV(-sd * 0.3, 0.9, 0.3))], '#f8fafc', 0.3, { smooth: false, bias: 0.1 });
  }
  // Kodama-Reiter mit Seerosenblatt-Schirm auf der Schwanzspitze
  const rider = pts[pts.length - 2];
  monKodama(r, rigAdd(rider, rigV(0, 0.8, 0)), t, 0.75);
  const umb = rigAdd(rider, rigV(0.3, 4.6, 0));
  r.line([rigAdd(rider, rigV(0.6, 1.6, 0.2)), umb], '#65a30d', 0.2, { outline: false, smooth: false });
  r.ball(umb, 2.2, '#4ade80', { sy: 0.32, gloss: 0.4, bias: 0.4 });
  r.flush();
}

// 6. DÜNEN-SCHLUND - Terrakotta-Wüstenlotus mit Kintsugi-Goldadern, Perlzähnen und Tautropfen-Juwel
function monDuneMaw(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 16, time, state, hitFlash, opts, { scale: 1.1 });
  const { r, ap, t } = M;
  const sink = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const burst = ap.phase === 'strike' ? (ap.p < 0.25 ? rigEaseOut(ap.p / 0.25) : 1 - rigEaseInOut((ap.p - 0.25) / 0.75)) : 0;
  // Wirbelnder Sandtrichter
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const rr = (15 - i * 4) * 1.1;
    ctx.strokeStyle = `rgba(180, 120, 50, ${0.35 - i * 0.08})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 16, rr, rr * 0.36, 0, t * (1 + i) % (Math.PI * 2), t * (1 + i) % (Math.PI * 2) + 4.2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(146, 84, 30, 0.45)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 16, 9, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const breathe = Math.sin(t * 2.6) * 0.6;
  const height = 4.5 - sink * 3 + burst * 6 + breathe * 0.3;
  const terra = '#c2683a';
  // Segmentierter Hals aus Keramikringen
  const base = rigV(0, 0, 0);
  const sway = Math.sin(t * 1.4) * 0.6;
  const top = rigV(sway, height + 4.5, burst * 1.5);
  for (let i = 0; i < 3; i++) {
    const a = rigLerp(base, top, i / 3);
    const b = rigLerp(base, top, (i + 1) / 3);
    r.cone(b, a, 2.7 - i * 0.25, 3.1 - i * 0.25, i % 2 ? '#b45f34' : terra, { sz: 1, after: (c, T, Bt, rr) => {
      c.save(); c.strokeStyle = rr.col('#fbbf24'); c.lineWidth = 0.28 * rr.s;
      c.beginPath(); c.moveTo(Bt.x - 1.2 * rr.s, Bt.y - 0.4 * rr.s); c.lineTo(Bt.x - 0.2 * rr.s, Bt.y - 1.6 * rr.s); c.lineTo(Bt.x + 0.9 * rr.s, Bt.y - 2.0 * rr.s); c.stroke(); c.restore();
    } });
  }
  // Blütenblätter: geschlossen beim Ausholen, weit offen beim Zuschnappen
  const open = 0.35 + burst * 0.9 - sink * 0.3 + breathe * 0.04;
  const N = 8;
  for (let layer = 0; layer < 2; layer++) {
    for (let k = 0; k < N; k++) {
      const a = (k / N) * MON_PI * 2 + layer * (MON_PI / N);
      const n = rigV(Math.sin(a), 0, Math.cos(a));
      const len = layer ? 5.6 : 7.4;
      const lift = Math.cos(open * (layer ? 1.2 : 1.0)) * len;
      const outv = Math.sin(open * (layer ? 1.2 : 1.0)) * len;
      const b0 = rigAdd(top, rigV(n.x * 2.4, 0, n.z * 2.4));
      const tip = rigAdd(b0, rigV(n.x * outv, lift, n.z * outv));
      const side = rigV(n.z * 1.9, 0, -n.x * 1.9);
      r.poly([rigAdd(b0, side), rigAdd(rigLerp(b0, tip, 0.6), rigScale(side, 1.3)), tip, rigSub(rigLerp(b0, tip, 0.6), rigScale(side, 1.3)), rigSub(b0, side)],
        layer ? '#e0915e' : terra, { bias: layer ? 0.1 : 0, after: (c, Ps, rr) => {
          // Kintsugi-Goldader
          c.save(); c.strokeStyle = rr.col('#fbbf24'); c.lineWidth = 0.3 * rr.s;
          c.beginPath(); c.moveTo((Ps[0].x + Ps[4].x) / 2, (Ps[0].y + Ps[4].y) / 2); c.lineTo((Ps[1].x * 0.3 + Ps[2].x * 0.7), (Ps[1].y * 0.3 + Ps[2].y * 0.7)); c.stroke();
          c.restore();
        } });
    }
  }
  // Schlund mit Perlzähnen
  const mawR = 1.6 + burst * 1.4;
  r.ball(rigAdd(top, rigV(0, 0.6, 0)), mawR + 0.8, '#3b0f0f', { sy: 0.45, gloss: 0, bias: 0.3 });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * MON_PI * 2;
    r.ball(rigAdd(top, rigV(Math.sin(a) * (mawR + 0.4), 1.0, Math.cos(a) * (mawR + 0.4))), 0.45, '#fdf6e3', { outline: false, gloss: 0.6, bias: 0.35 });
  }
  // Tautropfen-Juwel schwebt über dem Kelch
  const gem = rigAdd(top, rigV(0, 4.2 + Math.sin(t * 2) * 0.6 - burst * 2, 0));
  r.ball(gem, 0.9, '#7dd3fc', { gloss: 0.7, bias: 0.5 });
  r.glow(gem, 2.6, 'rgba(125,211,252,0.9)', { alpha: 0.6 });
  if (burst > 0.3) {
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26 + t * 3;
      r.glow(rigAdd(top, rigV(Math.cos(a) * 6 * burst, 1 + i * 0.5, Math.sin(a) * 6 * burst)), 1.6, 'rgba(234,179,8,0.85)', { alpha: burst });
    }
  }
  r.flush();
}

// 12. KAISER-SKORPION - Porzellan-Jade-Skorpion mit Goldkanten, acht Beinen, Scheren und leuchtendem Stachel
function monEmperorScorpion(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 18, time, state, hitFlash, opts, { scale: 1.15 });
  const { r, ap, t } = M;
  r.shadow(13, 4.5, 0.3);
  const porcelain = '#eef6f2';
  const jade = '#34d399';
  const gold = '#fbbf24';
  const aim = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const stab = ap.phase === 'strike' ? Math.sin(Math.min(1, ap.p * 1.8) * MON_PI) : 0;
  const bob = M.moving ? Math.sin(t * 16) * 0.25 : Math.sin(t * 2) * 0.15;
  const segs = [rigV(0, 3.6 + bob, 3.2), rigV(0, 3.8 + bob, 0.6), rigV(0, 3.6 + bob, -1.9), rigV(0, 3.3 + bob, -4.0)];
  // Acht Beine (vier pro Seite), Knie hoch, Tripod-Gang
  for (let i = 0; i < 4; i++) {
    for (const sd of [1, -1]) {
      const hip = rigV(sd * 2.0, 3.2 + bob, 2.2 - i * 1.9);
      const ph = t * 16 + i * MON_PI * 0.5 + (sd > 0 ? 0 : MON_PI);
      const step = M.moving ? Math.sin(ph) * 1.2 : 0;
      const lift = M.moving ? Math.max(0, Math.cos(ph)) * 1.0 : 0;
      const foot = rigV(sd * (6.6 - Math.abs(i - 1.5) * 0.4), lift, 3.2 - i * 2.3 + step);
      const knee = rigIK(hip, foot, 2.8, 3.2, rigV(sd * 1, 0.55, 0));
      r.capsule(hip, knee, 0.55, 0.45, jade);
      r.capsule(knee, foot, 0.45, 0.22, porcelain);
    }
  }
  // Gepanzerter Leib
  segs.forEach((p, i) => r.ball(p, 2.8 - i * 0.25, i === 0 ? porcelain : (i % 2 ? '#d7ede4' : porcelain), { sx: 1.15, sy: 0.6, gloss: 0.55, after: (c, P, rr) => {
    c.save(); c.strokeStyle = rr.col(gold); c.lineWidth = 0.3 * rr.s;
    c.beginPath(); c.ellipse(P.x, P.y, (2.8 - i * 0.25) * 1.15 * rr.s * 0.92, (2.8 - i * 0.25) * 0.6 * rr.s * 0.9, 0, MON_PI * 1.1, MON_PI * 1.9); c.stroke();
    c.fillStyle = rr.col(jade); c.beginPath(); c.arc(P.x, P.y - 0.4 * rr.s, 0.55 * rr.s, 0, 6.29); c.fill();
    c.restore();
  } }));
  // Augen
  r.ball(rigAdd(segs[0], rigV(0.7, 1.2, 1.6)), 0.4, '#111827', { outline: false, gloss: 0.8, bias: 0.3 });
  r.ball(rigAdd(segs[0], rigV(-0.7, 1.2, 1.6)), 0.4, '#111827', { outline: false, gloss: 0.8, bias: 0.3 });
  // Scheren
  for (const sd of [1, -1]) {
    const sh = rigAdd(segs[0], rigV(sd * 2.2, 0, 1.4));
    const hand = rigAdd(segs[0], rigV(sd * (3.2 - aim * 1.2), 1.2 + aim * 1.5, 5.4 + stab * 1.5));
    const el = rigIK(sh, hand, 2.6, 2.6, rigV(sd, 0.6, -0.3));
    r.capsule(sh, el, 0.75, 0.65, jade);
    r.capsule(el, hand, 0.65, 0.9, porcelain);
    const snap = 0.35 + Math.abs(Math.sin(t * (ap.phase !== 'idle' ? 10 : 2))) * 0.35;
    const jawA = rigAdd(hand, rigV(sd * snap, 0.3, 2.4));
    const jawB = rigAdd(hand, rigV(-sd * snap, 0.3, 2.2));
    r.capsule(hand, jawA, 0.85, 0.2, porcelain, { bias: 0.05 });
    r.capsule(hand, jawB, 0.7, 0.18, jade, { bias: 0.04 });
  }
  // Gebogener Schwanz mit Stachel
  const tail = [segs[3]];
  const curl = 1 + aim * 0.5 - stab * 0.8;
  for (let i = 1; i <= 6; i++) {
    const f = i / 6;
    const ang = f * MON_PI * 0.95 * curl;
    tail.push(rigAdd(segs[3], rigV(Math.sin(t * 1.5 + i) * 0.2, Math.sin(ang) * 7.5, -Math.cos(ang) * 4.5 + (1 - Math.cos(ang)) * 0.5 + stab * f * 7)));
  }
  for (let i = 1; i < tail.length; i++) r.ball(tail[i], 1.5 - i * 0.12, i % 2 ? porcelain : '#d7ede4', { gloss: 0.5, sy: 0.9 });
  const sting = tail[tail.length - 1];
  r.capsule(sting, rigAdd(sting, rigV(0, -1.2 - stab, 1.6 + stab * 2)), 0.7, 0.12, gold, { bias: 0.2 });
  r.glow(sting, 2.6 + aim * 2, 'rgba(52,211,153,0.9)', { alpha: 0.4 + aim * 0.5 });
  r.flush();
}

// 13. GRASLAND-WILDSCHWEIN - Moosrücken-Keiler mit Elfenbeinhauern, Pilzen und einem kleinen Vogel auf dem Rücken
function monTuskBoar(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 18, time, state, hitFlash, opts, { blink: 1.9, scale: 1.2 });
  const { r, ap, t } = M;
  r.shadow(12, 4.2, 0.32);
  const scrape = ap.phase === 'windup' ? ap.p : 0;
  const charging = M.moving && (opts && opts.charging);
  const q = rigQuad(t, { moving: M.moving, freq: charging ? 18 : 12, len: 8.5, width: 2.4, upper: 2.1, lower: 2.0, gait: charging ? 'gallop' : 'trot', crouch: scrape * 0.35 });
  const fur = '#6b4a33';
  const dark = '#3f2a1d';
  q.head = rigAdd(q.head, rigV(0, -1.5 - scrape * 1.2, -0.4));
  for (const key of ['RH', 'LH', 'RF', 'LF']) {
    const L = q.legs[key];
    const isF = key.charAt(1) === 'F';
    const side = key.charAt(0) === 'R' ? 1 : -1;
    const root = isF ? q.front : q.back;
    const hip = rigV(side * 2.4, root.y - 0.6, root.z);
    let foot = L.foot;
    if (scrape > 0 && key === 'RF') foot = rigV(side * 2.4, Math.max(0, Math.sin(t * 18)) * 1.2, root.z - 0.5 + Math.sin(t * 18) * 1.5);
    const knee = rigIK(hip, foot, 2.1, 2.0, isF ? rigV(0, 0, -1) : rigV(0, 0, 1));
    r.capsule(hip, knee, 1.3, 1.0, fur);
    r.capsule(knee, foot, 1.0, 0.8, dark);
    r.ball(rigAdd(foot, rigV(0, 0.35, 0.3)), 0.85, '#1c1410', { sy: 0.7 });
  }
  // Wuchtiger Rumpf mit Borstenkamm
  const mid = rigLerp(q.front, q.back, 0.5);
  r.ball(rigAdd(q.back, rigV(0, 1.0, -0.4)), 4.0, fur, { gloss: 0.12 });
  r.ball(rigAdd(mid, rigV(0, 1.4, 0)), 4.5, fur, { gloss: 0.12 });
  r.ball(rigAdd(q.front, rigV(0, 2.0, 0.4)), 4.7, fur, { gloss: 0.15 });
  for (let i = 0; i < 5; i++) {
    const p = rigLerp(rigAdd(q.back, rigV(0, 4.6, 0)), rigAdd(q.front, rigV(0, 6.4, 0)), i / 4);
    r.poly([rigAdd(p, rigV(0, 0, 0.8)), rigAdd(p, rigV(0, 1.6 + Math.sin(i * 2) * 0.3, -0.3)), rigAdd(p, rigV(0, 0, -0.8))], dark, { smooth: false, bias: 0.2 });
  }
  // Moosrücken mit Pilzen
  const moss = rigAdd(mid, rigV(0, 5.3, -0.6));
  r.ball(moss, 3.6, '#4d7c3a', { sy: 0.45, gloss: 0.3, bias: 0.3 });
  r.ball(rigAdd(moss, rigV(1.4, 1.1, -0.8)), 1.0, '#dc2626', { sy: 0.6, bias: 0.4, after: (c, P, rr) => {
    c.save(); c.fillStyle = '#fff'; c.beginPath(); c.arc(P.x - 0.3 * rr.s, P.y - 0.2 * rr.s, 0.25 * rr.s, 0, 6.29); c.arc(P.x + 0.4 * rr.s, P.y, 0.2 * rr.s, 0, 6.29); c.fill(); c.restore();
  } });
  r.line([rigAdd(moss, rigV(1.4, 0.3, -0.8)), rigAdd(moss, rigV(1.4, 1.0, -0.8))], '#f5f5f4', 0.35, { outline: false, bias: 0.35 });
  // Kleiner Blaumeisen-Vogel hüpft auf dem Rücken
  const bird = rigAdd(moss, rigV(-1.3, 1.6 + Math.abs(Math.sin(t * 3)) * 0.8, 0.6));
  r.ball(bird, 0.85, '#60a5fa', { gloss: 0.4, bias: 0.5 });
  r.ball(rigAdd(bird, rigV(0, 0.4, 0.6)), 0.6, '#fde047', { bias: 0.55, gloss: 0.3 });
  r.capsule(rigAdd(bird, rigV(0, 0.4, 1.1)), rigAdd(bird, rigV(0, 0.3, 1.6)), 0.18, 0.05, '#f97316', { outline: false, bias: 0.6 });
  // Kopf: Schnauze mit Rüsselscheibe, Hauer, Ohren, Knopfaugen
  const H = q.head;
  r.capsule(rigAdd(q.front, rigV(0, 2.4, 1.0)), H, 3.6, 2.8, fur);
  r.ball(H, 2.9, fur, { gloss: 0.15, after: (c) => {
    r.eye(c, H, 2.9, 0.6, 0.35, { color: charging || ap.phase !== 'idle' ? '#dc2626' : '#1c1410', size: 0.5, blink: M.blink });
    r.eye(c, H, 2.9, -0.6, 0.35, { color: charging || ap.phase !== 'idle' ? '#dc2626' : '#1c1410', size: 0.5, blink: M.blink });
  } });
  const sn = rigAdd(H, rigV(0, -0.6, 3.0));
  r.capsule(rigAdd(H, rigV(0, -0.3, 1.2)), sn, 2.0, 1.5, '#7c563c', { bias: 0.1 });
  r.ball(rigAdd(sn, rigV(0, 0, 0.6)), 1.3, '#d6a28a', { sy: 0.9, bias: 0.2, after: (c, P, rr) => {
    c.save(); c.fillStyle = rr.col('#5b2a1a'); c.beginPath(); c.arc(P.x - 0.45 * rr.s, P.y, 0.28 * rr.s, 0, 6.29); c.arc(P.x + 0.45 * rr.s, P.y, 0.28 * rr.s, 0, 6.29); c.fill(); c.restore();
  } });
  for (const sd of [1, -1]) {
    const tb = rigAdd(sn, rigV(sd * 1.3, -0.6, -0.4));
    r.line([tb, rigAdd(tb, rigV(sd * 0.9, 0.6, 0.6)), rigAdd(tb, rigV(sd * 1.0, 2.1, 0.7))], '#f5f0e1', 0.5, { bias: 0.25 });
    heroEar(r, H, 2.9, sd * 0.95, 0.7, dark, { len: 1.8, w: 0.3, inner: '#d6a28a', tilt: rigV(sd * 0.5, 0.2, -0.6) });
  }
  if (charging) {
    for (let i = 0; i < 3; i++) r.glow(rigV(Math.sin(i * 3 + t * 9) * 3, 1, q.back.z - 3 - i * 2), 2.5, 'rgba(214,211,209,0.8)', { alpha: 0.5 - i * 0.12 });
  }
  r.flush();
}

// 14. HÖHLEN-KRALLENSPINNE - flauschige Seidenweberin mit Tautropfen, Glanzaugen und acht Gelenkbeinen
function monCaveWeaver(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 22, time, state, hitFlash, opts, { blink: 1.4, scale: 1.25 });
  const { r, ap, t } = M;
  r.shadow(11, 3.8, 0.3);
  const rear = ap.phase === 'windup' ? rigEaseInOut(ap.p) : (ap.phase === 'strike' ? 1 - ap.p : 0);
  const bob = M.moving ? Math.sin(t * 18) * 0.3 : Math.sin(t * 2.2) * 0.25;
  const ceph = rigV(0, 4.2 + bob + rear * 1.2, 1.4 + rear * 0.4);
  const abd = rigV(0, 5.4 + bob - rear * 0.4, -3.4);
  // Seidenfaden nach oben (Idle: baumelnde Aufhängung)
  if (ap.phase === 'idle' && !M.moving) r.line([rigAdd(abd, rigV(0, 3.5, -1)), rigAdd(abd, rigV(0, 26, -2))], '#e2e8f0', 0.15, { outline: false, smooth: false, alpha: 0.6 });
  // Acht Gelenkbeine
  for (let i = 0; i < 4; i++) {
    for (const sd of [1, -1]) {
      const hip = rigAdd(ceph, rigV(sd * 1.4, -0.3, 0.9 - i * 0.8));
      const ph = t * 18 + i * MON_PI * 0.5 + (sd > 0 ? 0 : MON_PI);
      const step = M.moving ? Math.sin(ph) * 1.1 : Math.sin(t * 1.5 + i) * 0.15;
      const lift = M.moving ? Math.max(0, Math.cos(ph)) * 1.2 : 0;
      let foot = rigV(sd * (6.2 - Math.abs(i - 1.2) * 0.5), lift, 3.4 - i * 2.2 + step);
      if (i === 0 && rear > 0) foot = rigAdd(ceph, rigV(sd * 3.0, 3.5 * rear + 1, 3.2));
      const knee = rigIK(hip, foot, 3.6, 4.4, rigV(sd * 0.5, 1, 0));
      r.capsule(hip, knee, 0.55, 0.45, '#8b7fb5');
      r.capsule(knee, foot, 0.45, 0.2, '#6d5f9e');
      r.ball(knee, 0.5, '#c4b5fd', { outline: false, gloss: 0.4, bias: 0.02 });
    }
  }
  // Flauschiger Hinterleib mit Muster und Tautropfen
  r.ball(abd, 5.6, '#b9a9e6', { sy: 0.9, gloss: 0.25, after: (c, P, rr) => {
    c.save(); c.strokeStyle = rr.col('#8b7fb5'); c.lineCap = 'round';
    for (let k = 0; k < 30; k++) {
      const a = (k / 30) * MON_PI * 2;
      const L = (0.5 + (Math.sin(k * 7.7) * 0.5 + 0.5) * 0.6) * rr.s;
      c.lineWidth = 0.4 * rr.s;
      c.beginPath(); c.moveTo(P.x + Math.cos(a) * 5.2 * rr.s, P.y + Math.sin(a) * 4.8 * rr.s); c.lineTo(P.x + Math.cos(a) * (5.6 * rr.s + L), P.y + Math.sin(a) * (5.1 * rr.s + L)); c.stroke();
    }
    c.restore();
  } });
  monSpots(r, abd, 5.6, 5.0, 5.6, [[0, 0.5, 0.9], [0.6, 0.3, 0.6], [-0.7, 0.35, 0.65], [2.6, 0.6, 0.8], [-2.5, 0.4, 0.7]], '#7dd3fc', { bias: 0.4 });
  // Kopfbruststück mit zwei großen Glanzaugen und kleinen Nebenaugen
  r.ball(ceph, 3.4, '#a594da', { gloss: 0.3, after: (c) => {
    r.eye(c, ceph, 3.4, 0.38, 0.12, { color: '#1e1b2e', size: 1.15, tall: 1.1, blink: M.blink });
    r.eye(c, ceph, 3.4, -0.38, 0.12, { color: '#1e1b2e', size: 1.15, tall: 1.1, blink: M.blink });
    for (const az of [0.85, -0.85, 0.2, -0.2]) r.eye(c, ceph, 3.4, az, Math.abs(az) > 0.5 ? 0.3 : 0.55, { style: 'dot', color: '#1e1b2e', size: 0.4 });
    r.blush(c, ceph, 3.4, 0.7, -0.2, '#f9a8d4', 0.8);
    r.blush(c, ceph, 3.4, -0.7, -0.2, '#f9a8d4', 0.8);
  } });
  for (const sd of [1, -1]) r.capsule(rigAdd(ceph, rigV(sd * 0.7, -1.6, 2.4)), rigAdd(ceph, rigV(sd * 0.4, -2.8, 2.9)), 0.4, 0.15, '#f5f0e1', { bias: 0.2 });
  if (ap.phase === 'strike' && ap.p < 0.8) {
    const wp = rigAdd(ceph, rigV(0, -0.5, 3 + ap.p * 16));
    r.glow(wp, 3 + ap.p * 2, 'rgba(241,245,249,0.9)', { alpha: 1 - ap.p });
    r.line([rigAdd(ceph, rigV(0, -1, 3)), wp], '#f8fafc', 0.2, { outline: false, smooth: false, alpha: 1 - ap.p });
  }
  r.flush();
}

// 15. SCHATTEN-GOBLIN - geduckter Höhlen-Goblin mit tellergroßen Goldaugen, Lumpenkapuze und rostigem Dolch
function monCaveStalker(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 12, time, state, hitFlash, opts, { blink: 2.9, scale: 1.25 });
  const { r, ap, t } = M;
  r.shadow(6.5, 2.4, 0.32);
  const windup = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const stab = ap.phase === 'strike' ? Math.sin(Math.min(1, ap.p * 2) * MON_PI) : 0;
  const B = { thigh: 1.9, shin: 2.0, hipW: 1.1, torso: 3.8, shoulderW: 1.9, upperArm: 2.0, foreArm: 1.9, freq: 17, stride: 3.0, lift: 1.3 };
  const shY = (B.thigh + B.shin) * 0.94 + B.torso * 0.86;
  const handR = (windup > 0 || stab > 0) ? rigV(1.4, shY - 0.6 + windup * 0.5, heroLerp(-0.8, 4.4, stab) - windup * 0.6) : null;
  const sk = rigBiped(t, Object.assign({}, B, { moving: M.moving, crouch: 0.45 + windup * 0.25, extraLean: 0.42 + stab * 0.2, handR, idleArms: 1.1 }));
  sk.H = rigAdd(sk.neck, rigV(0, 2.6, 1.0));
  sk.R = 3.6;
  const skin = '#5b6b4f';
  heroLegs(r, sk, '#3a3530', '#2a2420', { thighR: 0.75, kneeR: 0.65, ankleR: 0.55, toe: 0.9 });
  heroTorso(r, sk, '#3a3530', { rt: 1.8, rb: 1.6 });
  // Lumpenumhang mit Fransen
  const neck = rigAdd(rigLerp(sk.shR, sk.shL, 0.5), rigV(0, 0.5, -0.4));
  const hem = rigV(0, sk.pelvis.y - 0.8, -1.4 - (M.moving ? 1 : 0));
  r.cone(neck, hem, 1.4, 3.0, '#2c2838', { sz: 0.8, bias: -0.1 });
  for (let k = 0; k < 5; k++) {
    const a = MON_PI + (k - 2) * 0.5;
    const b = rigV(hem.x + Math.sin(a) * 3, hem.y + 0.3, hem.z + Math.cos(a) * 2.6);
    r.poly([rigAdd(b, rigV(-0.6, 0, 0)), rigAdd(b, rigV(0, -1.5 - Math.sin(t * 6 + k) * 0.4, -0.3)), rigAdd(b, rigV(0.6, 0, 0))], '#2c2838', { smooth: false, bias: -0.12 });
  }
  heroArms(r, sk, skin, skin, { upperR: 0.7, handR: 0.65 });
  // Kopf mit langen Ohren, Hakennase und riesigen Goldaugen
  heroHead(r, sk, skin, (c, H, R) => {
    const big = 1.45 + windup * 0.25;
    r.eye(c, H, R, 0.42, 0.08, { white: false, color: '#fbbf24', pupil: '#111', size: big, tall: 1.0, blink: M.blink });
    r.eye(c, H, R, -0.42, 0.08, { white: false, color: '#fbbf24', pupil: '#111', size: big, tall: 1.0, blink: M.blink });
    for (const az of [0.42, -0.42]) {
      r.mark(c, H, R, az, 0.08, (cc, P, sq, s) => {
        cc.globalCompositeOperation = 'lighter'; cc.fillStyle = 'rgba(251,191,36,0.4)';
        cc.beginPath(); cc.ellipse(P.x, P.y, 2.4 * s * sq, 2.4 * s, 0, 0, 6.29); cc.fill();
      });
    }
    r.mouth(c, H, R, 0, -0.55, { w: 0.9, smile: true, color: '#1c1917' });
  }, (c, H, R) => {
    r.cap(c, H, R, heroHairEdge(0.75, 0.1, -1.0, 0, 1), '#2c2838', { grow: 1.12 });
  });
  r.capsule(rigAdd(sk.H, rigV(0, -0.4, 3.2)), rigAdd(sk.H, rigV(0, -1.6, 5.0)), 0.8, 0.3, skin, { bias: 0.3 });
  for (const sd of [1, -1]) heroEar(r, sk.H, sk.R, sd * 1.35, 0.15, skin, { len: 3.6, w: 0.22, inner: '#9a7a6a', tilt: rigV(sd * 1.2, 0.35, -0.5) });
  // Rostiger Dolch
  heroDrawBlade(r, sk.handR, rigNorm(rigV(0.1, 0.1 - stab * 0.1, 1)), { blade: '#b0a090', grip: '#3f2a1d', guard: '#78716c', len: 4.6, bladeW: 0.45 });
  r.flush();
}

// 16. FELS-KOLOSS - urzeitlicher Basalt-Behemoth mit glühenden Magmaadern und Kristallen auf dem Rücken
function monRockGolem(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 22, time, state, hitFlash, opts, { blink: 0.1 });
  const { r, ap, t } = M;
  r.shadow(17, 5.5, 0.34);
  const basalt = '#4b4f58';
  const basaltL = '#5d626c';
  const raise = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const slam = ap.phase === 'strike' ? (ap.p < 0.25 ? rigEaseOut(ap.p / 0.25) : 1 - rigEaseInOut((ap.p - 0.25) / 0.75) * 0.6) : 0;
  const B = { thigh: 3.2, shin: 3.0, hipW: 3.4, torso: 9.5, shoulderW: 7.6, upperArm: 5.4, foreArm: 5.6, freq: 6.5, stride: 3.4, lift: 1.3, idleArms: 2, bob: 1.0 };
  const shY = (B.thigh + B.shin) * 0.94 + B.torso * 0.86;
  const handR = raise > 0
    ? rigV(heroLerp(8, 5, raise), heroLerp(6, shY + 8, raise), heroLerp(2, -1, raise))
    : (slam > 0 ? rigV(heroLerp(5, 3, slam), heroLerp(shY + 8, 2.4, slam), heroLerp(-1, 8.5, slam)) : null);
  const sk = rigBiped(t, Object.assign({}, B, { moving: M.moving, handR, twist: raise * 0.3 - slam * 0.3, extraLean: slam * 0.25 }));
  const magma = (c, P, rr, R, seed) => {
    c.save(); c.globalCompositeOperation = 'lighter';
    c.strokeStyle = `rgba(251, ${120 + Math.round(Math.sin(t * 3 + seed) * 40)}, 30, ${0.65 + raise * 0.3})`;
    c.lineWidth = 0.45 * rr.s; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(P.x - R * 0.5 * rr.s, P.y - R * 0.2 * rr.s); c.lineTo(P.x - R * 0.1 * rr.s, P.y + R * 0.05 * rr.s); c.lineTo(P.x + R * 0.25 * rr.s, P.y - R * 0.3 * rr.s);
    c.moveTo(P.x - R * 0.1 * rr.s, P.y + R * 0.05 * rr.s); c.lineTo(P.x, P.y + R * 0.45 * rr.s);
    c.stroke(); c.restore();
  };
  for (const S of ['R', 'L']) {
    r.capsule(sk['hip' + S], sk['knee' + S], 2.6, 2.3, basalt);
    r.capsule(sk['knee' + S], sk['ankle' + S], 2.3, 2.5, basaltL);
    r.ball(rigAdd(sk['foot' + S], rigV(0, 0.9, 0.8)), 2.6, basalt, { sy: 0.7 });
  }
  // Rumpf aus übereinander getürmten Felsbrocken
  const body = rigAdd(sk.chest, rigV(0, -1.2, 0));
  r.ball(rigAdd(sk.pelvis, rigV(0, 1.2, 0)), 5.8, basalt, { sy: 0.8, gloss: 0.1 });
  r.ball(body, 8.6, basaltL, { sy: 0.95, gloss: 0.12, after: (c, P, rr) => magma(c, P, rr, 8.6, 1) });
  // Kristalle auf dem Rücken
  const crystals = [[-2.5, 7.5, -3.5, '#67e8f9', 5.5], [1.8, 8.0, -3.8, '#a78bfa', 4.5], [0, 6.6, -5.4, '#22d3ee', 4.0], [4.0, 5.2, -4.4, '#c4b5fd', 3.4]];
  for (const cr of crystals) {
    const b = rigAdd(body, rigV(cr[0], cr[1] - 3, cr[2]));
    r.cone(rigAdd(b, rigV(cr[0] * 0.15, cr[4], -0.8)), b, 0.1, 1.1, cr[3], { sz: 1, bias: 0.1 });
    r.glow(rigAdd(b, rigV(0, cr[4] * 0.5, 0)), 2.4, 'rgba(103,232,249,0.8)', { alpha: 0.35 + Math.sin(t * 2 + cr[0]) * 0.15 });
  }
  // Tief sitzender Kopf mit glühenden Augenschlitzen
  const H = rigAdd(sk.neck, rigV(0, 0.6, 3.0));
  r.ball(H, 3.6, basalt, { sx: 1.15, sy: 0.8, gloss: 0.2, bias: 0.3, after: (c) => {
    const col = ap.phase !== 'idle' ? '#fb923c' : '#fbbf24';
    r.eye(c, H, 3.6, 0.38, 0.05, { style: 'glow', color: col, size: 0.75, tall: 0.6 });
    r.eye(c, H, 3.6, -0.38, 0.05, { style: 'glow', color: col, size: 0.75, tall: 0.6 });
  } });
  // Gewaltige Arme
  for (const S of ['R', 'L']) {
    r.ball(sk['sh' + S], 3.8, basaltL, { gloss: 0.15, after: (c, P, rr) => magma(c, P, rr, 3.8, S === 'R' ? 2 : 3) });
    r.capsule(sk['sh' + S], sk['elbow' + S], 2.7, 2.4, basalt);
    r.capsule(sk['elbow' + S], sk['hand' + S], 2.4, 2.9, basaltL);
    r.ball(sk['hand' + S], 3.2, basalt, { gloss: 0.18, after: (c, P, rr) => { if (raise > 0.3 && S === 'R') magma(c, P, rr, 3.2, 4); } });
  }
  if (raise > 0.4) r.glow(sk.handR, 6 * raise, 'rgba(249,115,22,0.85)', { alpha: raise * 0.6 });
  if (slam > 0.85) {
    r.glow(rigV(3, 0.5, 8.5), 12, 'rgba(251,146,60,0.75)', { alpha: (slam - 0.85) * 5 });
  }
  r.flush();
}

// 17. LEEREN-VERSCHLINGER - Kaonashi-Schattensensenmann mit Noh-Maske, Sense und schimmernden Sternsteinen
function monVoidReaper(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 20, time, state, hitFlash, opts, { scale: 1.3 });
  const { r, ap, t } = M;
  const hover = 1.4 + Math.sin(t * 2) * 0.6;
  monHoverShadow(r, 9, 3, hover);
  const raise = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const sweep = ap.phase === 'strike' ? (ap.p < 0.4 ? rigEaseOut(ap.p / 0.4) : 1) : 0;
  const body = '#18161f';
  const neck = rigV(0, 15 + hover, 0);
  const hem = rigV(Math.sin(t * 1.8) * 0.6, hover - 0.6, M.moving ? -1.5 : 0);
  r.cone(neck, hem, 2.4, 5.2, body, { sz: 0.9, hem: '#3b0764', hemW: 1.6, alpha: 0.93 });
  // Schattenschwaden am Saum
  for (let i = 0; i < 4; i++) {
    const life = (t * 0.7 + i / 4) % 1;
    r.glow(rigV(Math.sin(i * 2.4 + t) * 4, hover + life * 4, Math.cos(i * 1.9) * 3), 2.5, 'rgba(76,29,149,0.9)', { alpha: (1 - life) * 0.5 });
  }
  // Rechter Arm mit Sense
  const shR = rigAdd(neck, rigV(2.4, -1, 0));
  const shL = rigAdd(neck, rigV(-2.4, -1, 0));
  const th = heroLerp(heroLerp(0.6, 2.2, raise), -1.2, sweep);
  const handR = rigAdd(shR, rigV(Math.sin(th) * 3.6, -2.5 + raise * 4 - sweep * 3, Math.cos(th) * 3.6));
  const elR = rigIK(shR, handR, 3, 3, rigV(1, -0.3, -1));
  r.capsule(shR, elR, 0.9, 0.7, body);
  r.capsule(elR, handR, 0.7, 0.55, body);
  r.ball(handR, 0.7, '#d4d4d8');
  const shaftDir = rigNorm(rigV(Math.sin(th) * 0.4, 1, Math.cos(th) * 0.4 - 0.3 + sweep * 0.8));
  const shaftTop = rigAdd(handR, rigScale(shaftDir, 9));
  const shaftBot = rigAdd(handR, rigScale(shaftDir, -5));
  r.line([shaftBot, shaftTop], '#3f3f46', 0.55, { smooth: false });
  const bladeDir = rigNorm(rigV(Math.cos(th), 0, -Math.sin(th)));
  const b1 = rigAdd(shaftTop, rigAdd(rigScale(bladeDir, 4), rigV(0, -1.2, 0)));
  const b2 = rigAdd(shaftTop, rigAdd(rigScale(bladeDir, 7.2), rigV(0, -3.6, 0)));
  r.poly([shaftTop, b1, b2, rigAdd(shaftTop, rigAdd(rigScale(bladeDir, 3.2), rigV(0, -0.9, 0))), rigAdd(shaftTop, rigV(0, -0.8, 0))], '#a78bfa', { bias: 0.1 });
  r.glow(b1, 3.5, 'rgba(167,139,250,0.85)', { alpha: 0.4 + raise * 0.4 });
  // Linke Hand bietet funkelnde Sternsteine an
  const handL = rigAdd(shL, rigV(-0.8, -3.2 + Math.sin(t * 1.5) * 0.3, 3.4));
  const elL = rigIK(shL, handL, 3, 3, rigV(-1, -0.3, -1));
  r.capsule(shL, elL, 0.9, 0.7, body);
  r.capsule(elL, handL, 0.7, 0.55, body);
  r.ball(handL, 0.75, '#d4d4d8', { sy: 0.7 });
  for (let i = 0; i < 3; i++) {
    const sp = rigAdd(handL, rigV(Math.cos(i * 2.1 + t) * 0.6, 0.7 + i * 0.15, Math.sin(i * 2.1 + t) * 0.6));
    r.glow(sp, 1.1, ['rgba(253,224,71,0.95)', 'rgba(147,197,253,0.95)', 'rgba(244,114,182,0.95)'][i], { alpha: 0.6 + Math.sin(t * 6 + i) * 0.3 });
  }
  // Ovale Noh-Maske mit lila Malereien
  const H = rigAdd(neck, rigV(0, 3.6, 0.4));
  r.ball(rigAdd(H, rigV(0, 0.3, -0.9)), 4.2, '#0e0d13', { sy: 1.15, gloss: 0.1, bias: -0.3 });
  r.ball(H, 3.8, '#f4f4f5', { sx: 0.88, sy: 1.22, gloss: 0.4, after: (c) => {
    r.eye(c, H, 3.8, 0.36, 0.0, { style: 'dot', color: '#09090b', size: 0.75, tall: 0.75 });
    r.eye(c, H, 3.8, -0.36, 0.0, { style: 'dot', color: '#09090b', size: 0.75, tall: 0.75 });
    for (const az of [0.36, -0.36]) {
      r.mark(c, H, 3.8, az, 0.24, (cc, P, sq, s) => {
        cc.fillStyle = r.col('#7c3aed'); cc.beginPath(); cc.moveTo(P.x - 0.35 * s * sq, P.y + 0.4 * s); cc.lineTo(P.x, P.y - 1.1 * s); cc.lineTo(P.x + 0.35 * s * sq, P.y + 0.4 * s); cc.fill();
      });
      r.mark(c, H, 3.8, az, -0.32, (cc, P, sq, s) => {
        cc.fillStyle = r.col('#8b5cf6'); cc.beginPath(); cc.moveTo(P.x - 0.3 * s * sq, P.y - 0.4 * s); cc.lineTo(P.x, P.y + 1.4 * s); cc.lineTo(P.x + 0.3 * s * sq, P.y - 0.4 * s); cc.fill();
      });
    }
    r.mouth(c, H, 3.8, 0, -0.62, { smile: false, w: 0.55, color: '#3f3f46' });
  } });
  r.flush();
}

// 18. AUGE DES ABGRUNDS - schwebende Mond-Qualle mit Riesenauge, Sichelmuster und leuchtenden Tentakeln
function monGazerOfTheVoid(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 20, time, state, hitFlash, opts, { blink: 1.6 });
  const { r, ap, t } = M;
  const hover = 9 + Math.sin(t * 1.8) * 1.5;
  monHoverShadow(r, 11, 3.5, hover);
  const charge = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const beam = ap.phase === 'strike' ? 1 - ap.p : 0;
  const pulse = Math.sin(t * 3) * 0.08;
  const C = rigV(0, hover + 5, 0);
  // Tentakel mit Leuchtspitzen
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * MON_PI * 2;
    const base = rigAdd(C, rigV(Math.sin(a) * 5, -1.5, Math.cos(a) * 5));
    const pts = rigChain(t + i * 0.6, base, rigV(Math.sin(a) * 0.2, -1, Math.cos(a) * 0.2 - (M.moving ? 0.5 : 0)), { n: 5, seg: 1.6, amp: 1.0, ampY: 0.3, freq: 3.5, k: 0.8 });
    r.line(pts, i % 2 ? '#a78bfa' : '#c4b5fd', 0.55, { alpha: 0.85 });
    r.glow(pts[pts.length - 1], 1.6, 'rgba(196,181,253,0.95)', { alpha: 0.6 + Math.sin(t * 4 + i) * 0.3 });
  }
  // Rüschensaum
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * MON_PI * 2 + t * 0.3;
    r.ball(rigAdd(C, rigV(Math.sin(a) * 7.2, -1.2 + Math.sin(t * 4 + k) * 0.3, Math.cos(a) * 7.2)), 1.3, '#8b5cf6', { sy: 0.7, alpha: 0.85, gloss: 0.3 });
  }
  // Riesenauge im Inneren (wird vom Glockenschirm umhüllt)
  const eyeC = rigAdd(C, rigV(0, 1.6, 2.6));
  r.ball(eyeC, 3.6, '#f5f3ff', { gloss: 0.3, bias: 0.2, after: (c) => {
    r.eye(c, eyeC, 3.6, 0, -0.05, { white: false, color: charge > 0 || beam > 0 ? '#e11d48' : '#7c3aed', pupil: '#0b0716', size: 2.2 + charge * 0.4, tall: 1.0, blink: M.blink });
  } });
  // Durchscheinender Glockenschirm mit Mondsichel
  r.ball(rigAdd(C, rigV(0, 1.5, 0)), 7.4, '#6d28d9', { sy: 0.78 + pulse, alpha: 0.55, gloss: 0.6, bias: 0.5, after: (c, P, rr) => {
    c.save(); c.globalAlpha *= 0.85; c.fillStyle = rr.col('#fde68a');
    const mx = P.x - 2.6 * rr.s;
    const my = P.y - 3.4 * rr.s;
    c.beginPath(); c.arc(mx, my, 1.4 * rr.s, 0.6, 5.7); c.arc(mx + 0.7 * rr.s, my - 0.2 * rr.s, 1.1 * rr.s, 5.3, 1.0, true); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    for (const st of [[3, -3], [1.5, -4.5], [4.2, -1.2]]) { c.beginPath(); c.arc(P.x + st[0] * rr.s, P.y + st[1] * rr.s, 0.3 * rr.s, 0, 6.29); c.fill(); }
    c.restore();
  } });
  if (charge > 0) r.glow(eyeC, 4 + charge * 4, 'rgba(244,63,94,0.85)', { alpha: charge * 0.7, bias: 1 });
  if (beam > 0) {
    const end = rigAdd(eyeC, rigV(0, -hover * 0.5, 22));
    r.line([eyeC, end], '#f472b6', 1.6 * beam + 0.3, { outline: false, smooth: false, alpha: beam, bias: 1 });
    r.glow(end, 4, 'rgba(244,114,182,0.9)', { alpha: beam });
  }
  r.flush();
}

// 19. SCHATTEN-TENTAKEL - Glockengeist-Ranke aus einem Moosbrunnen mit bronzener Suzu-Glocke
function monAbyssTentacle(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 16, time, state, hitFlash, opts, { scale: 1.1 });
  const { r, ap, t } = M;
  r.shadow(11, 3.8, 0.3);
  const coil = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const whip = ap.phase === 'strike' ? Math.sin(Math.min(1, ap.p * 1.6) * MON_PI) : 0;
  // Moosbewachsener Steinbrunnen
  r.cone(rigV(0, 2.4, 0), rigV(0, 0, 0), 5.2, 5.6, '#64748b', { sz: 1, hem: '#475569', hemW: 0.5 });
  r.ball(rigV(0, 2.5, 0), 4.6, '#0b1020', { sy: 0.3, gloss: 0, bias: 0.05 });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * MON_PI * 2 + 0.3;
    const n = rigV(Math.sin(a), 0, Math.cos(a));
    if (r.toCam(n) < -0.2) continue;
    r.ball(rigV(n.x * 5.3, 2.5, n.z * 5.3), 1.0, '#4d7c3a', { sy: 0.55, bias: 0.1 });
  }
  // Ranke als S-Kurve, die sich zum Peitschenhieb zusammenrollt
  const pts = [];
  const N = 9;
  for (let i = 0; i <= N; i++) {
    const f = i / N;
    const sway = Math.sin(t * 2.2 - f * 3) * 1.6 * f;
    const back = -coil * Math.sin(f * MON_PI) * 4 + whip * f * f * 9;
    const y = 2 + f * (15 - coil * 2 - whip * 6);
    pts.push(rigV(sway + Math.sin(f * MON_PI * 1.5) * 1.2 * (1 - whip), y, back));
  }
  for (let i = 0; i < N; i++) {
    const r0 = 1.8 - (i / N) * 1.3;
    const r1 = 1.8 - ((i + 1) / N) * 1.3;
    r.capsule(pts[i], pts[i + 1], r0, r1, i % 2 ? '#134e4a' : '#115e59', { light: 0.15 });
    if (i % 2 === 1) {
      const leafTip = rigAdd(pts[i], rigV((i % 4 === 1 ? 1 : -1) * 2.2, 0.6, 0.4));
      monLeaf(r, pts[i], leafTip, 0.6, '#14b8a6', { side: rigV(0, 0.6, 0), bias: 0.05 });
    }
  }
  // Rotes Seil und bronzene Glocke an der Spitze
  const tip = pts[N];
  const swing = Math.sin(t * 4) * 0.5 + whip * 1.2;
  const bell = rigAdd(tip, rigV(swing, -2.2, 0.3));
  r.line([tip, rigAdd(bell, rigV(0, 1.2, 0))], '#dc2626', 0.35, { smooth: false });
  r.ball(bell, 1.8, '#b45309', { sy: 1.1, gloss: 0.6, bias: 0.1, after: (c, P, rr) => {
    c.save(); c.fillStyle = rr.col('#451a03'); c.beginPath(); c.ellipse(P.x, P.y + 0.6 * rr.s, 1.2 * rr.s, 0.35 * rr.s, 0, 0, 6.29); c.fill(); c.restore();
  } });
  // Klangwellen beim Läuten
  if (whip > 0.2 || coil > 0.6) {
    const P = r.P(bell);
    r.custom(P.d + 1, (c, rr) => {
      c.save();
      for (let k = 0; k < 2; k++) {
        const rad = (3 + k * 2.5 + (t * 8) % 2.5) * rr.s;
        c.strokeStyle = `rgba(253, 230, 138, ${0.6 - k * 0.25})`;
        c.lineWidth = 0.4 * rr.s;
        c.beginPath(); c.arc(P.x, P.y, rad, -0.9, 0.9); c.stroke();
        c.beginPath(); c.arc(P.x, P.y, rad, MON_PI - 0.9, MON_PI + 0.9); c.stroke();
      }
      c.restore();
    });
  }
  r.flush();
}

// 21. WOLKEN-HARPYIE - Tengu-Federmädchen mit Flügelarmen, schräger Tengu-Maske und Kirschblüten-Böen
function monSkyHarpy(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 20, time, state, hitFlash, opts, { blink: 0.7, scale: 1.3 });
  const { r, ap, t } = M;
  const hover = 4 + Math.sin(t * 2.4) * 1.2;
  monHoverShadow(r, 8, 2.8, hover);
  const pull = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const gust = ap.phase === 'strike' ? (ap.p < 0.3 ? rigEaseOut(ap.p / 0.3) : 1 - (ap.p - 0.3) / 0.7) : 0;
  const flap = Math.sin(t * (M.moving ? 9 : 5)) * (1 - pull) * 0.5 - pull * 0.6 + gust * 0.9;
  const hipY = 4.5 + hover;
  const pelvis = rigV(0, hipY, 0);
  const chest = rigV(0, hipY + 3.6, 0.2);
  const neck = rigV(0, hipY + 5.2, 0.3);
  // Federrock und Vogelkrallen
  for (const sd of [1, -1]) {
    const knee = rigAdd(pelvis, rigV(sd * 1.0, -2.2, 0.6));
    const foot = rigAdd(pelvis, rigV(sd * 1.2, -4.2, 0.2 + Math.sin(t * 2 + sd) * 0.3));
    r.capsule(rigAdd(pelvis, rigV(sd, 0, 0)), knee, 0.8, 0.5, '#f9a8d4');
    r.capsule(knee, foot, 0.45, 0.35, '#f59e0b');
    for (let k = -1; k <= 1; k++) r.capsule(foot, rigAdd(foot, rigV(k * 0.6, -0.4, 0.9)), 0.25, 0.1, '#f59e0b', { outline: false });
  }
  r.cone(rigAdd(pelvis, rigV(0, 1.0, 0)), rigAdd(pelvis, rigV(0, -2.0, -0.3)), 2.0, 3.4, '#fbcfe8', { sz: 0.9, hem: '#f472b6', hemW: 0.5 });
  // Kimono-Oberteil
  r.cone(neck, rigAdd(pelvis, rigV(0, 0.6, 0)), 1.6, 2.2, '#fdf2f8', { sz: 0.8, bias: 0.05 });
  r.cone(rigAdd(pelvis, rigV(0, 1.6, 0)), rigAdd(pelvis, rigV(0, 0.8, 0)), 2.1, 2.2, '#db2777', { sz: 0.85, bias: 0.1 });
  // Flügelarme mit Federstaffeln
  for (const sd of [1, -1]) {
    const sh = rigAdd(chest, rigV(sd * 1.8, 0.6, -0.3));
    const a1 = 0.3 + flap * 0.7;
    const el = rigAdd(sh, rigV(sd * 3.6 * Math.cos(a1), 3.6 * Math.sin(a1), -1.0 - pull * 1.5 + gust * 2));
    const tip = rigAdd(el, rigV(sd * 5.2 * Math.cos(a1 * 1.3), 5.2 * Math.sin(a1 * 1.3) - 0.5, -1.8 - pull * 2 + gust * 3.5));
    const fe = [];
    for (let k = 0; k <= 5; k++) {
      const f = k / 5;
      const along = f < 0.4 ? rigLerp(sh, el, f / 0.4) : rigLerp(el, tip, (f - 0.4) / 0.6);
      fe.push(rigAdd(along, rigV(0, -3.4 * Math.sin(f * MON_PI * 0.85 + 0.3) - (k % 2) * 0.8, -1)));
    }
    const wd = r.depth(rigLerp(sh, tip, 0.4)) - 0.2;
    r.poly([sh, el, tip].concat(fe.reverse()), '#f8fafc', { smooth: false, depth: wd });
    r.poly([sh, el, rigLerp(el, tip, 0.5), rigAdd(rigLerp(sh, el, 0.6), rigV(0, -1.6, -0.6))], '#fbcfe8', { depth: wd + 0.01, outline: false });
    r.line([sh, el, tip], '#f9a8d4', 0.4, { outline: false, depth: wd + 0.02 });
  }
  // Kopf mit langem schwarzem Haar und schräger roter Tengu-Maske
  const H = rigAdd(neck, rigV(0, 3.3, 0.2));
  const HR = 3.3;
  const sway = M.moving ? -1 : Math.sin(t * 1.6) * 0.3;
  r.poly([rigAdd(H, rigV(-2.4, 1.6, -0.8)), rigAdd(H, rigV(2.4, 1.6, -0.8)), rigAdd(H, rigV(2.8, -4.5, -1.6 + sway)), rigAdd(H, rigV(0, -6, -2.2 + sway)), rigAdd(H, rigV(-2.8, -4.5, -1.6 + sway))], '#1c1424', { bias: -0.6 });
  r.ball(H, HR, '#fde7d6', { gloss: 0.18, after: (c) => {
    heroFace(r, c, H, HR, { blink: M.blink }, { eye: '#831843', white: true, size: 0.75, lid: '#1c1424', tall: 1.3, mouth: { w: 0.45 } });
    r.cap(c, H, HR, heroHairEdge(0.32, -0.6, -1.2, 0.08, 5), '#1c1424', { grow: 1.07, gloss: 0.45 });
  } });
  const mask = rigSurfPt(H, HR * 1.1, -1.25, 0.35);
  r.ball(mask, 1.4, '#dc2626', { sx: 0.8, gloss: 0.5, bias: 0.3 });
  r.capsule(mask, rigAdd(mask, rigV(-1.6, 0.6, 1.4)), 0.5, 0.15, '#dc2626', { bias: 0.35 });
  // Kirschblüten-Bö beim Angriff
  if (gust > 0) {
    for (let i = 0; i < 6; i++) {
      const d = 4 + gust * 14 + i * 1.5;
      const p = rigV(Math.sin(i * 1.9 + t * 3) * (2 + i * 0.6), hipY + 3 + Math.cos(i * 2.3) * 2, d);
      const P = r.P(p);
      r.custom(P.d + 1, (c, rr) => {
        c.save(); c.globalAlpha *= gust; c.translate(P.x, P.y); c.rotate(t * 5 + i);
        c.fillStyle = rr.col('#fda4af'); c.beginPath(); c.ellipse(0, 0, 1.1 * rr.s, 0.55 * rr.s, 0, 0, 6.29); c.fill(); c.restore();
      });
    }
  }
  r.flush();
}

// 22. MAGMA-FUNKE - Calcifer-Flammenwicht mit großen Augen, Zackengrinsen und züngelnden Flammen
function monLavaCore(ctx, cx, cy, time, state, hitFlash, opts) {
  const M = monBegin(ctx, cx, cy, 18, time, state, hitFlash, opts, { blink: 2.1, scale: 1.2 });
  const { r, ap, t } = M;
  const hover = 4 + Math.sin(t * 3) * 1.0;
  monHoverShadow(r, 8, 2.8, hover);
  const swell = ap.phase === 'windup' ? rigEaseInOut(ap.p) : 0;
  const spit = ap.phase === 'strike' ? ap.p : -1;
  const R = 4.6 * (1 + swell * 0.25);
  const C = rigV(0, hover + R, 0);
  r.glow(C, R * 3, 'rgba(249,115,22,0.85)', { alpha: 0.45 + swell * 0.3, bias: -3 });
  // Züngelnde Flammen (hinter und über dem Körper)
  const tongues = 7;
  for (let i = 0; i < tongues; i++) {
    const a = (i / tongues) * MON_PI * 2;
    const n = rigV(Math.sin(a) * 0.65, 1, Math.cos(a) * 0.65 - (M.moving ? 0.6 : 0));
    const base = rigAdd(C, rigV(Math.sin(a) * R * 0.55, R * 0.35, Math.cos(a) * R * 0.55));
    const len = R * (0.9 + Math.sin(t * 11 + i * 2.3) * 0.25 + swell * 0.4);
    const tip = rigAdd(base, rigScale(rigNorm(n), len));
    const side = rigScale(rigNorm(rigV(Math.cos(a), 0, -Math.sin(a))), R * 0.42);
    r.poly([rigAdd(base, side), rigAdd(rigLerp(base, tip, 0.55), rigScale(side, 0.5)), tip, rigSub(rigLerp(base, tip, 0.55), rigScale(side, 0.5)), rigSub(base, side)], i % 2 ? '#f97316' : '#ef4444', { outline: false, bias: -0.2 });
  }
  r.poly([rigAdd(C, rigV(-R * 0.7, R * 0.2, 0)), rigAdd(C, rigV(Math.sin(t * 9) * 0.6, R * 2.0 + swell * 2, -0.4)), rigAdd(C, rigV(R * 0.7, R * 0.2, 0))], '#fb923c', { outline: false, bias: -0.1 });
  // Körper mit Farbverlauf (außen rot, innen gelb)
  r.ball(C, R, '#f97316', { outline: false, gloss: 0, bias: 0 });
  r.ball(rigAdd(C, rigV(0, -R * 0.15, R * 0.15)), R * 0.72, '#fbbf24', { outline: false, gloss: 0, bias: 0.05 });
  r.ball(rigAdd(C, rigV(0, -R * 0.25, R * 0.3)), R * 0.42, '#fef3c7', { outline: false, gloss: 0, bias: 0.06, after: (c) => {
    // Große Calcifer-Augen und Zackengrinsen auf der Vorderseite
    const F = rigAdd(C, rigV(0, 0, 0));
    const ew = ap.phase !== 'idle' ? 1.0 : 1.15;
    r.eye(c, F, R, 0.36, 0.12, { white: true, style: 'dot', color: '#1c1917', size: 1.25, tall: ew, blink: M.blink });
    r.eye(c, F, R, -0.36, 0.12, { white: true, style: 'dot', color: '#1c1917', size: 1.25, tall: ew, blink: M.blink });
    r.mark(c, F, R, 0, -0.32, (cc, P, sq, s) => {
      const w = (1.6 + swell * 0.6) * s * sq;
      const h = (spit >= 0 && spit < 0.5 ? 1.6 : 0.8) * s;
      cc.fillStyle = r.col('#7c2d12');
      cc.beginPath(); cc.moveTo(P.x - w, P.y - 0.2 * s); cc.quadraticCurveTo(P.x, P.y + h * 1.6, P.x + w, P.y - 0.2 * s); cc.closePath(); cc.fill();
      cc.fillStyle = '#fff7ed';
      cc.beginPath();
      for (let k = 0; k < 4; k++) {
        const x = P.x - w * 0.8 + k * w * 0.53;
        cc.moveTo(x, P.y - 0.15 * s); cc.lineTo(x + w * 0.2, P.y + 0.45 * s); cc.lineTo(x + w * 0.4, P.y - 0.15 * s);
      }
      cc.fill();
    }, 1.0);
  } });
  // Flammen-Ärmchen
  for (const sd of [1, -1]) {
    const arm = rigAdd(C, rigV(sd * (R + 0.6), -R * 0.2 + Math.sin(t * 6 + sd) * 0.5, 0.5));
    r.poly([rigAdd(arm, rigV(-sd * 0.9, -0.6, 0)), rigAdd(arm, rigV(sd * 1.0, 0.9, 0)), rigAdd(arm, rigV(-sd * 0.5, 0.8, 0))], '#fb923c', { outline: false, bias: 0.1 });
  }
  // Glutfunken
  for (let i = 0; i < 4; i++) {
    const life = (t * 0.9 + i / 4) % 1;
    r.glow(rigV(Math.sin(i * 3.3 + t) * 3, C.y + R + life * 9, Math.cos(i * 2.1) * 2), 1.0, 'rgba(253,224,71,0.95)', { alpha: 1 - life });
  }
  if (spit >= 0 && spit < 0.8) monCharge(r, rigAdd(C, rigV(0, -1, R + spit * 16)), 2.6 * (1 - spit * 0.4), 'rgba(249,115,22,0.95)', 1 - spit);
  r.flush();
}

// =============================================================================
// BESTIARY DATA (22 GEGNER - SKELETT-RIG EDITION)
// =============================================================================

export const BESTIARY_DATA = [
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
    render: monMossArcher
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
    render: monSporeSpitter
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
    render: monBoulderTroll
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
    render: monFrostGiant
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
    render: monSlitheringViper
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
    render: monDuneMaw
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
    render: monPyromancer
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
    render: monStarAstromancer
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
    render: monGreenSlime
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
    render: monTarMire
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
    render: monDireWolf
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
    render: monEmperorScorpion
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
    render: monTuskBoar
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
    render: monCaveWeaver
  },

  {
    id: 'cave_stalker',
    name: 'Schatten-Goblin',
    title: 'Creeping Cave Goblin',
    category: 'beast',
    categoryName: '🐺 Wilde Bestien',
    biome: 'Höhlensysteme & Dunkle Schlünde',
    biomeBadge: 'Höhle',
    badgeClass: 'badge-cave',
    variants: ['Glimmaugen-Schwarz (Standard)', 'Moosrücken-Grün (Selten)'],
    scale: 0.72,
    xpValue: 12,
    stats: { hp: 95, maxHp: 95, atk: 22, spd: 'Extrem schnell (230px/s)', rng: 'Nahkampf (Hit-and-Run)' },
    behavior: 'Ein unheimlich flinker, kleiner Höhlen-Goblin mit spitzen Fledermausohren und riesigen, im Dunkeln gleißenden Augen. Lauert geduckt im Halbschatten, flitzt auf leisen Sohlen blitzschnell heran, stößt mit spitzen Klauendolchen zu und huscht sofort wieder kichernd in die Finsternis zurück.',
    counter: 'Den Ansturm mit erhobenem Schild abfangen und mit einem schnellen Konterschlag bestrafen, bevor er wieder in den Schatten flieht!',
    lore: 'Uralte Bergwerksstollen sind voll von ihren leisen Schritten. Wenn man in den tiefen Höhlen zwei tellergroße, goldgelb glühende Augen in der Schwärze aufblitzen sieht, sollte man den Schild heben.',
    render: monCaveStalker
  },

  {
    id: 'rock_golem',
    name: 'Fels-Koloss',
    title: 'Ancient Bedrock Behemoth',
    category: 'beast',
    categoryName: '🗿 Urzeitliche Kolosse',
    biome: 'Tiefste Höhlen & Basaltkammern',
    biomeBadge: 'Höhle',
    badgeClass: 'badge-cave',
    variants: ['Granitgrau (Standard)', 'Magmageädert (Ebene -2)', 'Eiskristallin (Schnee-Höhle)'],
    scale: 1.4,
    xpValue: 24,
    stats: { hp: 380, maxHp: 380, atk: 26, spd: 'Schreitend (50px/s)', rng: 'Erdbeben & Steinschlag (AOE)' },
    behavior: 'Ein massives lebendiges Felsengebilde. Seine gewaltige Masse absorbiert fast jeden Rückstoß. Schlägt mit schweren Steinäxten zu und entfesselt Erdbeben, die Felsbrocken von der Decke herabstürzen lassen.',
    counter: 'Wenn er zum Erdbeben ausholt, sofort auf die roten Warnzonen am Boden achten und per Dash ausweichen, bevor die Felsbrocken einschlagen!',
    lore: 'Jahrtausende lang ruhten sie als scheinbar lebloses Urgestein in den tiefsten Höhlenschichten, bis die Welt wieder von magischer Glut erfüllt wurde.',
    render: monRockGolem
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
    render: monVoidReaper
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
    render: monGazerOfTheVoid
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
    render: monAbyssTentacle
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
    render: monCursedKnight
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
    render: monSkyHarpy
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
    render: monLavaCore
  }
];

// =============================================================================
// BESTIARY UI MANAGER
// =============================================================================

export class BestiaryManager {
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
