(function() {

// --- js/rig.js ---
/**
 * Ocarina of Brawls - Pseudo-3D Skelett-Rig
 *
 * Gemeinsame Grundlage für Helden, Monster und Verwandlungen:
 *  - Gelenke liegen im 3D-Modellraum (x = rechts, y = oben, z = vorne/Blickrichtung)
 *  - Die Blickrichtung (Yaw) dreht das ganze Skelett, die Projektion ist eine
 *    leicht gekippte Draufsicht (3/4-Perspektive). Dadurch drehen sich Figuren
 *    stufenlos in alle Richtungen und Teile verdecken sich korrekt.
 *  - Zwei-Knochen-IK für Arme und Beine (Füße bleiben am Boden, Hände greifen Waffen)
 *  - Gangzyklen für Zweibeiner, Vierbeiner, Schlangen/Ketten und Schwebende
 *  - Formen mit Kontur ("Tinte"), Eigenschatten und Glanzlicht im Ghibli-Stil
 *
 * Alle Namen sind mit rig/Rig/SkelRig präfixiert, weil build.js alle Dateien
 * in einen gemeinsamen Scope bündelt.
 */

// Polyfill für CanvasRenderingContext2D.prototype.roundRect auf älteren Browsern/Mobilgeräten
// (wurde früher in bestiary.js gesetzt; game.js nutzt roundRect direkt)
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) {
    this.rect(x, y, w, h);
  };
}

const RIG_TILT = 0.5;      // Wie stark Bodentiefe auf Bildschirm-Y abgebildet wird
const RIG_CAM_Y = 0.55;    // Kamerablick: Höhenanteil
const RIG_CAM_Z = 0.84;    // Kamerablick: Tiefenanteil (zum Betrachter)
const RIG_TAU = Math.PI * 2;

const RIG_DIR_ANGLE = {
  right: 0,
  'down-right': Math.PI / 4,
  down: Math.PI / 2,
  'down-left': (3 * Math.PI) / 4,
  left: Math.PI,
  'up-left': (-3 * Math.PI) / 4,
  up: -Math.PI / 2,
  'up-right': -Math.PI / 4
};

/** Wandelt Blickrichtung (String oder Winkel) in einen Bildschirmwinkel um */
function rigFacingAngle(facing) {
  if (typeof facing === 'number' && !isNaN(facing)) return facing;
  const a = RIG_DIR_ANGLE[facing];
  return a === undefined ? Math.PI / 2 : a;
}

// -----------------------------------------------------------------------------
// FARBEN
// -----------------------------------------------------------------------------
const rigColorCache = new Map();
const RIG_INK_TINT = [27, 21, 48]; // tiefes Indigo statt reinem Schwarz

function rigParseHex(hex) {
  let h = hex.charAt(0) === '#' ? hex.slice(1) : hex;
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rigToHex(r, g, b) {
  const c = (v) => {
    const s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
    return s.length === 1 ? '0' + s : s;
  };
  return '#' + c(r) + c(g) + c(b);
}

/** Mischt zwei Hex-Farben (t = 0 -> a, t = 1 -> b) */
function rigMix(a, b, t) {
  let ma = rigColorCache.get(a);
  if (!ma) { ma = new Map(); rigColorCache.set(a, ma); }
  let mb = ma.get(b);
  if (!mb) { mb = new Map(); ma.set(b, mb); }
  let out = mb.get(t);
  if (out) return out;
  const A = rigParseHex(a);
  const B = rigParseHex(b);
  out = rigToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  mb.set(t, out);
  return out;
}

const rigShadeCache = new Map();

/** Hellt auf (amt > 0, Richtung warmes Weiß) oder dunkelt ab (amt < 0, Richtung Indigo) */
function rigShade(hex, amt) {
  if (!amt) return hex;
  let m = rigShadeCache.get(hex);
  if (!m) { m = new Map(); rigShadeCache.set(hex, m); }
  let out = m.get(amt);
  if (out) return out;
  const c = rigParseHex(hex);
  if (amt > 0) {
    out = rigToHex(c[0] + (255 - c[0]) * amt, c[1] + (250 - c[1]) * amt, c[2] + (240 - c[2]) * amt);
  } else {
    const t = -amt;
    // Schatten werden leicht blau-violett (Ghibli-typisch) statt grau
    out = rigToHex(
      c[0] * (1 - t) + RIG_INK_TINT[0] * t,
      c[1] * (1 - t) + RIG_INK_TINT[1] * t,
      c[2] * (1 - t) + RIG_INK_TINT[2] * t
    );
  }
  m.set(amt, out);
  return out;
}

const rigInkCache = new Map();

/** Konturfarbe einer Grundfarbe (dunkles, leicht violettes Tintenblau) */
function rigInk(hex) {
  let out = rigInkCache.get(hex);
  if (!out) {
    out = rigMix(rigShade(hex, -0.62), '#1b1530', 0.25);
    rigInkCache.set(hex, out);
  }
  return out;
}

// -----------------------------------------------------------------------------
// VEKTOR-HILFEN (Modellraum)
// -----------------------------------------------------------------------------
function rigV(x, y, z) { return { x, y, z }; }
function rigAdd(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
function rigSub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function rigScale(a, s) { return { x: a.x * s, y: a.y * s, z: a.z * s }; }
function rigLerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }; }
function rigLen(a) { return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z); }
function rigNorm(a) {
  const l = rigLen(a) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
}
function rigDot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
function rigCross(a, b) {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
/** Dreht einen Punkt um die senkrechte Achse (für Oberkörper-Twist / Schwünge) */
function rigRotY(p, ang, pivot) {
  const px = pivot ? pivot.x : 0;
  const pz = pivot ? pivot.z : 0;
  const dx = p.x - px;
  const dz = p.z - pz;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return { x: px + dx * c + dz * s, y: p.y, z: pz - dx * s + dz * c };
}
function rigClamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rigEaseOut(t) { return 1 - (1 - t) * (1 - t) * (1 - t); }
function rigEaseInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
/** Federnder Überschwinger (für Schläge: Ausholen -> Schlag -> Nachschwingen) */
function rigBackOut(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Zwei-Knochen-IK: liefert das Mittelgelenk (Knie/Ellbogen) zwischen Wurzel a und Ziel c.
 * pole gibt die Richtung an, in die das Gelenk knicken soll.
 */
function rigIK(a, c, l1, l2, pole) {
  let d = rigSub(c, a);
  let dist = rigLen(d);
  const maxD = (l1 + l2) * 0.999;
  if (dist > maxD) {
    d = rigScale(d, maxD / dist);
    dist = maxD;
  }
  if (dist < 1e-4) dist = 1e-4;
  const u = rigScale(d, 1 / dist);
  const along = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  let perp = rigSub(pole, rigScale(u, rigDot(pole, u)));
  const pl = rigLen(perp);
  perp = pl < 1e-5 ? { x: 0, y: 0, z: 1 } : rigScale(perp, 1 / pl);
  return rigAdd(a, rigAdd(rigScale(u, along), rigScale(perp, h)));
}

// -----------------------------------------------------------------------------
// DER RIG-RENDERER
// -----------------------------------------------------------------------------
class SkelRig {
  constructor() {
    this.items = [];
    this.ctx = null;
    this.ox = 0;
    this.oy = 0;
    this.s = 1;
    this.flash = 0;
    this.flashColor = '#ffffff';
    this.ink = 0.85;
    this.tilt = RIG_TILT;
    this.setFacing(Math.PI / 2);
  }

  /**
   * Startet ein neues Bild.
   * o.facing: Richtung (String oder Winkel), o.scale, o.flash (0..1), o.flashColor, o.ink (Konturbreite)
   */
  begin(ctx, ox, oy, o = {}) {
    this.ctx = ctx;
    this.ox = ox;
    this.oy = oy;
    this.s = o.scale || 1;
    this.flash = rigClamp(o.flash || 0, 0, 1);
    this.flashMix = Math.round(this.flash * 0.85 * 10) / 10;
    this.flashColor = o.flashColor || '#ffffff';
    this.ink = o.ink === undefined ? 0.85 : o.ink;
    this.alpha = o.alpha === undefined ? 1 : o.alpha;
    this.tilt = o.tilt || RIG_TILT;
    this.items.length = 0;
    this.setFacing(rigFacingAngle(o.facing));
    return this;
  }

  setFacing(angle) {
    this.angle = angle;
    this.fx = Math.cos(angle);
    this.fy = Math.sin(angle);
    this.rx = -this.fy;
    this.ry = this.fx;
  }

  /** Projiziert einen Modellpunkt auf den Bildschirm */
  P(p) {
    const gx = p.x * this.rx + p.z * this.fx;
    const gd = p.x * this.ry + p.z * this.fy;
    return {
      x: this.ox + gx * this.s,
      y: this.oy + (-p.y + gd * this.tilt) * this.s,
      d: gd * RIG_CAM_Z + p.y * RIG_CAM_Y
    };
  }

  /** Tiefe eines Modellpunkts (größer = näher an der Kamera) */
  depth(p) {
    const gd = p.x * this.ry + p.z * this.fy;
    return gd * RIG_CAM_Z + p.y * RIG_CAM_Y;
  }

  /** Wie stark zeigt eine Modellrichtung zur Kamera (-1..1) */
  toCam(n) {
    const gd = n.x * this.ry + n.z * this.fy;
    return gd * RIG_CAM_Z + n.y * RIG_CAM_Y;
  }

  /** Bildschirm-X-Anteil einer Modellrichtung (für Verkürzungen) */
  screenX(n) {
    return n.x * this.rx + n.z * this.fx;
  }

  /** Farbe inkl. Treffer-Aufblitzen und optionaler Helligkeit */
  col(hex, k = 0) {
    const c = k ? rigShade(hex, k) : hex;
    if (this.flash > 0) return rigMix(c, this.flashColor, this.flashMix);
    return c;
  }

  inkCol(hex) {
    return this.col(rigInk(hex));
  }

  add(depth, fn) {
    this.items.push({ d: depth, i: this.items.length, fn });
  }

  /** Zeichnet alle gesammelten Teile in Tiefenreihenfolge */
  flush() {
    const items = this.items;
    items.sort((a, b) => (a.d - b.d) || (a.i - b.i));
    const ctx = this.ctx;
    // Ein gemeinsames save/restore für die ganze Figur; Teile setzen ihren Zustand selbst
    ctx.save();
    if (this.alpha !== 1) ctx.globalAlpha *= this.alpha;
    this.baseAlpha = ctx.globalAlpha;
    for (let i = 0; i < items.length; i++) items[i].fn(ctx, this);
    ctx.restore();
    items.length = 0;
  }

  // ---------------------------------------------------------------------------
  // GRUNDFORMEN
  // ---------------------------------------------------------------------------

  /** Weicher Bodenschatten (wird sofort gezeichnet) */
  shadow(rx, ry, alpha = 0.3, offX = 0, offY = 0) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = `rgba(15, 12, 35, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(this.ox + offX * this.s, this.oy + offY * this.s, rx * this.s, ry * this.s, 0, 0, RIG_TAU);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Kugel/Ellipsoid mit Eigenschatten, Glanzlicht und Kontur.
   * o: sx, sy (Streckung), rot (Bildschirmrotation), bias (Tiefe), shade (bool),
   *    outline (bool), gloss (0..1), after(ctx, P, rig) für Gesichter etc.
   */
  ball(p, r, hex, o = {}) {
    const P = this.P(p);
    const depth = P.d + (o.bias || 0);
    this.add(depth, (ctx) => {
      const s = this.s;
      const rx = r * (o.sx || 1) * s;
      const ry = r * (o.sy || 1) * s;
      const rot = o.rot || 0;
      ctx.globalAlpha = o.alpha !== undefined ? this.baseAlpha * o.alpha : this.baseAlpha;
      // Kontur
      if (o.outline !== false) {
        const ink = this.ink * s;
        ctx.fillStyle = o.inkColor ? this.col(o.inkColor) : this.inkCol(hex);
        ctx.beginPath();
        ctx.ellipse(P.x, P.y, rx + ink, ry + ink, rot, 0, RIG_TAU);
        ctx.fill();
      }
      // Eigenschatten-Grundton
      ctx.fillStyle = this.col(hex, o.shade === false ? 0 : -0.22);
      ctx.beginPath();
      ctx.ellipse(P.x, P.y, rx, ry, rot, 0, RIG_TAU);
      ctx.fill();
      if (o.shade !== false) {
        // Lichtseite (Licht von oben links)
        ctx.fillStyle = this.col(hex);
        ctx.beginPath();
        ctx.ellipse(P.x - rx * 0.13, P.y - ry * 0.15, rx * 0.84, ry * 0.82, rot, 0, RIG_TAU);
        ctx.fill();
        const gloss = o.gloss === undefined ? 0.35 : o.gloss;
        if (gloss > 0 && r * s > 1.6) {
          ctx.fillStyle = this.col(hex, gloss);
          ctx.beginPath();
          ctx.ellipse(P.x - rx * 0.38, P.y - ry * 0.42, rx * 0.26, ry * 0.18, -0.6, 0, RIG_TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = this.baseAlpha;
      if (o.after) o.after(ctx, P, this);
    });
    return P;
  }

  /** Verjüngte Kapsel zwischen zwei Gelenken (Gliedmaßen, Hälse, Schwänze) */
  capsule(a, b, ra, rb, hex, o = {}) {
    const A = this.P(a);
    const B = this.P(b);
    const depth = (A.d + B.d) * 0.5 + (o.bias || 0);
    this.add(depth, (ctx) => {
      ctx.globalAlpha = o.alpha !== undefined ? this.baseAlpha * o.alpha : this.baseAlpha;
      const s = this.s;
      if (o.outline !== false) {
        ctx.fillStyle = o.inkColor ? this.col(o.inkColor) : this.inkCol(hex);
        rigCapsulePath(ctx, A.x, A.y, B.x, B.y, ra * s + this.ink * s, rb * s + this.ink * s);
        ctx.fill();
      }
      ctx.fillStyle = this.col(hex, o.shade === false ? 0 : -0.18);
      rigCapsulePath(ctx, A.x, A.y, B.x, B.y, ra * s, rb * s);
      ctx.fill();
      if (o.shade !== false && (ra + rb) * s > 1.4) {
        // Lichtkante oben links
        ctx.fillStyle = this.col(hex, o.light === undefined ? 0.04 : o.light);
        const ox = -0.28 * ra * s;
        const oy = -0.3 * ra * s;
        rigCapsulePath(ctx, A.x + ox, A.y + oy, B.x + ox * (rb / ra || 1), B.y + oy * (rb / ra || 1), ra * s * 0.62, rb * s * 0.62);
        ctx.fill();
      }
      ctx.globalAlpha = this.baseAlpha;
      if (o.after) o.after(ctx, A, B, this);
    });
  }

  /**
   * Freie Fläche aus Modellpunkten (Umhänge, Ohren, Hüte, Flügel, Blätter).
   * o: smooth (Kurven), depth, bias, outline, alpha, gradTo (zweite Farbe nach unten),
   *    stroke (Linie ohne Füllung), shade (Tönung -1..1)
   */
  poly(pts, hex, o = {}) {
    const Ps = pts.map((p) => this.P(p));
    let depth = o.depth;
    if (depth === undefined) {
      depth = 0;
      for (let i = 0; i < Ps.length; i++) depth += Ps[i].d;
      depth /= Ps.length;
    }
    depth += o.bias || 0;
    this.add(depth, (ctx) => {
      ctx.globalAlpha = o.alpha !== undefined ? this.baseAlpha * o.alpha : this.baseAlpha;
      rigPolyPath(ctx, Ps, o.smooth !== false, o.closed !== false);
      if (o.closed !== false) {
        ctx.fillStyle = this.col(hex, o.shade || 0);
        ctx.fill();
      }
      if (o.outline !== false) {
        ctx.strokeStyle = o.inkColor ? this.col(o.inkColor) : this.inkCol(hex);
        ctx.lineWidth = (o.lineWidth || this.ink) * this.s;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.globalAlpha = this.baseAlpha;
      if (o.after) o.after(ctx, Ps, this);
    });
    return Ps;
  }

  /** Dicke Linie entlang Modellpunkten (Haarsträhnen, Bänder, Peitschen, Schnüre) */
  line(pts, hex, width, o = {}) {
    const Ps = pts.map((p) => this.P(p));
    let depth = o.depth;
    if (depth === undefined) {
      depth = 0;
      for (let i = 0; i < Ps.length; i++) depth += Ps[i].d;
      depth /= Ps.length;
    }
    depth += o.bias || 0;
    this.add(depth, (ctx) => {
      ctx.globalAlpha = o.alpha !== undefined ? this.baseAlpha * o.alpha : this.baseAlpha;
      ctx.lineCap = o.cap || 'round';
      ctx.lineJoin = 'round';
      const smooth = o.smooth !== false;
      if (o.outline !== false) {
        rigPolyPath(ctx, Ps, smooth, false);
        ctx.strokeStyle = o.inkColor ? this.col(o.inkColor) : this.inkCol(hex);
        ctx.lineWidth = (width + this.ink * 2) * this.s;
        ctx.stroke();
      }
      rigPolyPath(ctx, Ps, smooth, false);
      ctx.strokeStyle = this.col(hex, o.shade || 0);
      ctx.lineWidth = width * this.s;
      ctx.stroke();
      ctx.globalAlpha = this.baseAlpha;
    });
    return Ps;
  }

  /** Eigene Zeichenfunktion an einer Tiefe (fn bekommt ctx und rig) */
  custom(depth, fn) {
    this.add(depth, fn);
  }

  /** Leuchtender Punkt (Augen, Funken, Laternen) ohne Kontur, additiv */
  glow(p, r, color, o = {}) {
    const P = this.P(p);
    this.add(P.d + (o.bias || 0), (ctx) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const R = r * this.s;
      const g = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, R);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha *= o.alpha === undefined ? 0.8 : o.alpha;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(P.x, P.y, R, 0, RIG_TAU);
      ctx.fill();
      ctx.restore();
    });
  }

  // ---------------------------------------------------------------------------
  // GESICHTER
  // ---------------------------------------------------------------------------

  /**
   * Punkt auf einer Kopfkugel. az = Drehung um die Hochachse (0 = vorne, + = rechts der Figur),
   * el = Höhe (+ = oben). Liefert Bildschirmposition und Sichtbarkeit v (0..1).
   */
  surf(center, r, az, el, out = 1) {
    const ce = Math.cos(el);
    const n = { x: Math.sin(az) * ce, y: Math.sin(el), z: Math.cos(az) * ce };
    const p = { x: center.x + n.x * r * out, y: center.y + n.y * r * out, z: center.z + n.z * r * out };
    const P = this.P(p);
    P.v = this.toCam(n);
    P.sx = this.screenX({ x: Math.cos(az), y: 0, z: -Math.sin(az) });
    return P;
  }

  /**
   * Ghibli-Auge auf der Kopfkugel. style: 'round' | 'glow' | 'slit' | 'closed' | 'dot' | 'happy'
   * o: color (Iris), white (Sklera zeichnen), size, lid (Oberlid-Farbe), blink (0..1)
   */
  eye(ctx, head, r, az, el, o = {}) {
    const P = this.surf(head, r, az, el, 0.96);
    if (P.v < 0.08) return;
    const s = this.s;
    const size = (o.size || 1) * s;
    const squash = rigClamp(Math.abs(P.v) * 1.15, 0.35, 1);
    const w = size * squash;
    const h = size * (o.tall || 1.25);
    const style = o.style || 'round';
    const blink = o.blink || 0;
    if (style === 'closed' || style === 'happy' || blink > 0.85) {
      ctx.strokeStyle = this.col(o.lid || '#1b1530');
      ctx.lineWidth = Math.max(0.6, 0.55 * s);
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (style === 'happy') ctx.arc(P.x, P.y + h * 0.25, w * 0.9, Math.PI * 1.15, Math.PI * 1.85);
      else ctx.arc(P.x, P.y - h * 0.15, w * 0.9, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.globalAlpha = this.baseAlpha; ctx.globalCompositeOperation = 'source-over';
      return;
    }
    const hh = h * (1 - blink);
    if (style === 'glow') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = o.color || '#5eead4';
      ctx.globalAlpha *= 0.45;
      ctx.beginPath();
      ctx.ellipse(P.x, P.y, w * 1.9, hh * 1.5, 0, 0, RIG_TAU);
      ctx.fill();
      ctx.globalAlpha /= 0.45;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = this.col(o.color || '#5eead4', 0.35);
      ctx.beginPath();
      ctx.ellipse(P.x, P.y, w * 0.85, hh * 0.85, 0, 0, RIG_TAU);
      ctx.fill();
      ctx.globalAlpha = this.baseAlpha; ctx.globalCompositeOperation = 'source-over';
      return;
    }
    if (o.white) {
      ctx.fillStyle = this.col('#fffaf0');
      ctx.beginPath();
      ctx.ellipse(P.x, P.y, w * 1.25, hh * 1.05, 0, 0, RIG_TAU);
      ctx.fill();
    }
    // Iris / Pupille
    ctx.fillStyle = this.col(o.color || '#1b1530');
    ctx.beginPath();
    if (style === 'slit') ctx.ellipse(P.x, P.y, w * 0.9, hh, 0, 0, RIG_TAU);
    else if (style === 'dot') ctx.ellipse(P.x, P.y, w * 0.7, hh * 0.7, 0, 0, RIG_TAU);
    else ctx.ellipse(P.x, P.y, w * 0.95, hh * 0.95, 0, 0, RIG_TAU);
    ctx.fill();
    if (style === 'slit') {
      ctx.fillStyle = this.col('#0b0716');
      ctx.beginPath();
      ctx.ellipse(P.x, P.y, w * 0.25, hh * 0.85, 0, 0, RIG_TAU);
      ctx.fill();
    } else if (o.pupil) {
      ctx.fillStyle = this.col(o.pupil);
      ctx.beginPath();
      ctx.ellipse(P.x, P.y + hh * 0.1, w * 0.5, hh * 0.55, 0, 0, RIG_TAU);
      ctx.fill();
    }
    // Glanzpunkte - machen den Blick lebendig
    if (size > 0.7 && style !== 'dot') {
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.arc(P.x - w * 0.3, P.y - hh * 0.35, Math.max(0.35, size * 0.32), 0, RIG_TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(P.x + w * 0.3, P.y + hh * 0.35, Math.max(0.2, size * 0.15), 0, RIG_TAU);
      ctx.fill();
    }
    // Oberlid / Wimpernstrich
    if (o.lid) {
      ctx.strokeStyle = this.col(o.lid);
      ctx.lineWidth = Math.max(0.5, 0.45 * s);
      ctx.beginPath();
      ctx.ellipse(P.x, P.y, w * 1.05, hh * 1.0, 0, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
    ctx.globalAlpha = this.baseAlpha; ctx.globalCompositeOperation = 'source-over';
  }

  /** Kleines Oberflächen-Detail (Wangenröte, Nase, Mund, Abzeichen) */
  mark(ctx, head, r, az, el, fn, out = 0.98) {
    const P = this.surf(head, r, az, el, out);
    if (P.v < 0.05) return;
    fn(ctx, P, rigClamp(P.v * 1.2, 0.3, 1), this.s);
    // Zustand zurücksetzen (statt teurem save/restore)
    ctx.globalAlpha = this.baseAlpha;
    ctx.globalCompositeOperation = 'source-over';
  }

  /** Rosige Wangen */
  blush(ctx, head, r, az, el, color = '#fb7185', size = 1) {
    this.mark(ctx, head, r, az, el, (c, P, sq, s) => {
      c.globalAlpha *= 0.55;
      c.fillStyle = this.col(color);
      c.beginPath();
      c.ellipse(P.x, P.y, 1.25 * size * s * sq, 0.7 * size * s, 0, 0, RIG_TAU);
      c.fill();
    });
  }

  /** Mund als Strich/Bogen */
  mouth(ctx, head, r, az, el, o = {}) {
    this.mark(ctx, head, r, az, el, (c, P, sq, s) => {
      const w = (o.w || 1) * s * sq;
      c.strokeStyle = this.col(o.color || '#3b1d2a');
      c.lineWidth = Math.max(0.45, 0.4 * s);
      c.lineCap = 'round';
      c.beginPath();
      if (o.open) {
        c.fillStyle = this.col(o.inner || '#7f1d1d');
        c.ellipse(P.x, P.y, w * 0.8, (o.open || 0.6) * s, 0, 0, RIG_TAU);
        c.fill();
        c.stroke();
      } else if (o.smile === false) {
        c.moveTo(P.x - w, P.y);
        c.lineTo(P.x + w, P.y);
        c.stroke();
      } else {
        c.arc(P.x, P.y - w * 0.6, w, Math.PI * 0.2, Math.PI * 0.8);
        c.stroke();
      }
    });
  }
  // ---------------------------------------------------------------------------
  // KÖRPER-VOLUMEN
  // ---------------------------------------------------------------------------

  /**
   * Kegelstumpf / Gewand: oberer Ring (Mitte top, Radius rt) zu unterem Ring (Mitte bot, Radius rb).
   * Ideal für Rümpfe, Kimonos, Röcke, Umhänge, Hüte. o: sx (Breitenfaktor x), sz (Tiefenfaktor),
   * hem (Saumfarbe), hemW, bias, shade, trim (Mittellinie vorne), after
   */
  cone(top, bot, rt, rb, hex, o = {}) {
    const T = this.P(top);
    const B = this.P(bot);
    const depth = (T.d + B.d) * 0.5 + (o.bias || 0);
    this.add(depth, (ctx) => {
      const s = this.s;
      const sx = o.sx || 1;
      const sz = o.sz || 1;
      // Ellipsen-Achsen des horizontalen Rings auf dem Bildschirm
      const ring = (r) => {
        // Ring-Achsen: Modell-x und Modell-z, projiziert
        const ax = { x: this.rx * r * sx * s, y: this.ry * r * sx * this.tilt * s };
        const az = { x: this.fx * r * sz * s, y: this.fy * r * sz * this.tilt * s };
        return { ax, az };
      };
      const rT = ring(rt);
      const rB = ring(rb);
      const N = 14;
      const ptsTop = [];
      const ptsBot = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * RIG_TAU;
        const c = Math.cos(a);
        const si = Math.sin(a);
        ptsTop.push({ x: T.x + rT.ax.x * c + rT.az.x * si, y: T.y + rT.ax.y * c + rT.az.y * si });
        ptsBot.push({ x: B.x + rB.ax.x * c + rB.az.x * si, y: B.y + rB.ax.y * c + rB.az.y * si });
      }
      // Silhouette: konvexe Hülle beider Ringe (einfach, robust für alle Drehungen)
      const hull = rigHull(ptsTop.concat(ptsBot));
      ctx.save();
      if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(hull[0].x, hull[0].y);
        for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i].x, hull[i].y);
        ctx.closePath();
      };
      path();
      if (o.outline !== false) {
        ctx.strokeStyle = this.inkCol(hex);
        ctx.lineWidth = this.ink * 2 * s;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
      // Seitliche Schattierung (Licht von links)
      let minX = Infinity;
      let maxX = -Infinity;
      for (let i = 0; i < hull.length; i++) {
        if (hull[i].x < minX) minX = hull[i].x;
        if (hull[i].x > maxX) maxX = hull[i].x;
      }
      if (o.shade !== false && maxX - minX > 1) {
        const g = ctx.createLinearGradient(minX, 0, maxX, 0);
        g.addColorStop(0, this.col(hex, 0.12));
        g.addColorStop(0.45, this.col(hex));
        g.addColorStop(1, this.col(hex, -0.3));
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = this.col(hex);
      }
      ctx.fill();
      // Saum unten
      if (o.hem) {
        ctx.save();
        path();
        ctx.clip();
        ctx.fillStyle = this.col(o.hem);
        const hw = (o.hemW || 1) * s;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const p = ptsBot[i % N];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        for (let i = N; i >= 0; i--) {
          const p = ptsBot[i % N];
          ctx.lineTo(p.x + (T.x - B.x) * 0.02, p.y - hw);
        }
        ctx.closePath();
        ctx.fill();
        // alles unterhalb des Rings ebenfalls einfärben
        ctx.fillRect(minX - 2, B.y, maxX - minX + 4, 20 * s);
        ctx.restore();
      }
      ctx.restore();
      if (o.after) o.after(ctx, T, B, this);
    });
  }

  /** Liegt der zur Kamera zeigende Kugelpunkt innerhalb der Kappe? */
  capCovers(edge, below) {
    const n = { x: this.ry * RIG_CAM_Z, y: RIG_CAM_Y, z: this.fy * RIG_CAM_Z };
    const az = Math.atan2(n.x, n.z);
    const el = Math.asin(rigClamp(n.y, -1, 1));
    return below ? el < edge(az) : el > edge(az);
  }

  /**
   * Füllt auf einer Kugel die Fläche oberhalb (oder unterhalb) einer Grenzlinie el = edge(az).
   * Für Haare, Kapuzen, Masken, Helme, Fellzeichnungen. Muss innerhalb eines after-Hooks
   * (oder custom) aufgerufen werden, damit es direkt nach dem Kopf gezeichnet wird.
   * o: below (unterhalb füllen), grow (Radiusfaktor), shade, outline, gloss
   */
  cap(ctx, center, r, edge, hex, o = {}) {
    const C = this.P(center);
    const R = r * (o.grow || 1.05) * this.s;
    const N = 24;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const az = -Math.PI + (i / N) * RIG_TAU;
      const el = edge(az);
      const ce = Math.cos(el);
      const n = { x: Math.sin(az) * ce, y: Math.sin(el), z: Math.cos(az) * ce };
      if (this.toCam(n) < -0.18) { pts.push(null); continue; }
      const P = this.P({ x: center.x + n.x * r * (o.grow || 1.05), y: center.y + n.y * r * (o.grow || 1.05), z: center.z + n.z * r * (o.grow || 1.05) });
      pts.push(P);
    }
    // längstes zusammenhängendes sichtbares Stück finden (Ring kann über -PI/PI laufen)
    const runs = [];
    let cur = [];
    for (let k = 0; k < pts.length * 2; k++) {
      const p = pts[k % pts.length];
      if (p) cur.push(p);
      else {
        if (cur.length) runs.push(cur);
        cur = [];
      }
      if (k === pts.length - 1 && runs.length === 0 && cur.length === pts.length) break;
    }
    if (cur.length) runs.push(cur);
    let vis = runs.reduce((a, b) => (b.length > a.length ? b : a), []);
    if (vis.length > pts.length) vis = vis.slice(0, pts.length);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(C.x, C.y, R, R * (o.sy || 1), 0, 0, RIG_TAU);
    ctx.clip();
    ctx.beginPath();
    const far = o.below ? 4 * R : -4 * R;
    if (vis.length >= 2) {
      vis.sort((a, b) => a.x - b.x);
      ctx.moveTo(vis[0].x - R * 2, vis[0].y);
      for (let i = 0; i < vis.length; i++) ctx.lineTo(vis[i].x, vis[i].y);
      ctx.lineTo(vis[vis.length - 1].x + R * 2, vis[vis.length - 1].y);
      ctx.lineTo(vis[vis.length - 1].x + R * 2, C.y + far);
      ctx.lineTo(vis[0].x - R * 2, C.y + far);
      ctx.closePath();
    } else if (this.capCovers(edge, o.below)) {
      // Grenze komplett unsichtbar: Kappe bedeckt die ganze sichtbare Seite
      ctx.rect(C.x - R * 2, C.y - R * 2, R * 4, R * 4);
    }
    ctx.fillStyle = this.col(hex);
    ctx.fill();
    if (o.shade !== false) {
      // Schatten rechts unten innerhalb der Kappe
      ctx.clip();
      ctx.fillStyle = this.col(hex, -0.25);
      ctx.beginPath();
      ctx.ellipse(C.x + R * 0.55, C.y + R * 0.45, R * 0.9, R * 0.9, 0, 0, RIG_TAU);
      ctx.fill();
      if (o.gloss !== 0) {
        ctx.fillStyle = this.col(hex, o.gloss || 0.3);
        ctx.beginPath();
        ctx.ellipse(C.x - R * 0.35, C.y - R * 0.55, R * 0.35, R * 0.16, -0.5, 0, RIG_TAU);
        ctx.fill();
      }
    }
    ctx.restore();
    // Grenzlinie als zarte Kontur
    if (o.outline !== false && vis.length >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(C.x, C.y, R + 0.01, R * (o.sy || 1), 0, 0, RIG_TAU);
      ctx.clip();
      ctx.strokeStyle = this.inkCol(hex);
      ctx.lineWidth = this.ink * 0.9 * this.s;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(vis[0].x, vis[0].y);
      for (let i = 1; i < vis.length; i++) ctx.lineTo(vis[i].x, vis[i].y);
      ctx.stroke();
      ctx.restore();
    }
    if (o.rim !== false) {
      // Außenkontur der Kappe (damit Haar über den Kopf hinaus wirkt)
      ctx.save();
      ctx.beginPath();
      if (vis.length >= 2) {
        ctx.moveTo(vis[0].x - R * 2, vis[0].y);
        for (let i = 0; i < vis.length; i++) ctx.lineTo(vis[i].x, vis[i].y);
        ctx.lineTo(vis[vis.length - 1].x + R * 2, vis[vis.length - 1].y);
        ctx.lineTo(vis[vis.length - 1].x + R * 2, C.y + far);
        ctx.lineTo(vis[0].x - R * 2, C.y + far);
        ctx.closePath();
      } else if (this.capCovers(edge, o.below)) {
        ctx.rect(C.x - R * 2, C.y - R * 2, R * 4, R * 4);
      }
      ctx.clip();
      ctx.strokeStyle = this.inkCol(hex);
      ctx.lineWidth = this.ink * this.s;
      ctx.beginPath();
      ctx.ellipse(C.x, C.y, R, R * (o.sy || 1), 0, 0, RIG_TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/** Punkt auf einer Kugeloberfläche im Modellraum (az 0 = vorne, + = rechts; el + = oben) */
function rigSurfPt(center, r, az, el) {
  const ce = Math.cos(el);
  return {
    x: center.x + Math.sin(az) * ce * r,
    y: center.y + Math.sin(el) * r,
    z: center.z + Math.cos(az) * ce * r
  };
}

/** Konvexe Hülle (Andrew's Monotone Chain) für Bildschirmpunkte */
function rigHull(points) {
  const pts = points.slice().sort((a, b) => (a.x - b.x) || (a.y - b.y));
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

// -----------------------------------------------------------------------------
// PFAD-HILFEN (Bildschirmraum)
// -----------------------------------------------------------------------------
function rigCapsulePath(ctx, ax, ay, bx, by, ra, rb) {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.sqrt(dx * dx + dy * dy);
  ctx.beginPath();
  if (d < Math.abs(ra - rb) + 0.01) {
    const r = Math.max(ra, rb);
    ctx.arc(ra >= rb ? ax : bx, ra >= rb ? ay : by, r, 0, RIG_TAU);
    return;
  }
  const ang = Math.atan2(dy, dx);
  const off = Math.acos(rigClamp((ra - rb) / d, -1, 1));
  ctx.arc(ax, ay, ra, ang + off, ang - off + RIG_TAU, false);
  ctx.arc(bx, by, rb, ang - off, ang + off, false);
  ctx.closePath();
}

function rigPolyPath(ctx, Ps, smooth, closed) {
  ctx.beginPath();
  const n = Ps.length;
  if (n === 0) return;
  if (!smooth || n < 3) {
    ctx.moveTo(Ps[0].x, Ps[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(Ps[i].x, Ps[i].y);
    if (closed) ctx.closePath();
    return;
  }
  if (closed) {
    const m0x = (Ps[n - 1].x + Ps[0].x) / 2;
    const m0y = (Ps[n - 1].y + Ps[0].y) / 2;
    ctx.moveTo(m0x, m0y);
    for (let i = 0; i < n; i++) {
      const p = Ps[i];
      const q = Ps[(i + 1) % n];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(Ps[0].x, Ps[0].y);
    for (let i = 1; i < n - 1; i++) {
      const p = Ps[i];
      const q = Ps[i + 1];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
    }
    ctx.lineTo(Ps[n - 1].x, Ps[n - 1].y);
  }
}

// -----------------------------------------------------------------------------
// GANGZYKLEN & POSEN
// -----------------------------------------------------------------------------

/**
 * Zweibeiner-Skelett mit IK-Beinen und pendelnden Armen.
 * o: moving, freq, stride, lift, thigh, shin, hipW, hipY, torso, shoulderW, upperArm, foreArm,
 *    lean, bob, breathe, handR/handL (Ziel-Überschreibungen), twist (Oberkörperdrehung),
 *    crouch (0..1), armSwing, idleArms (Abstand der Hände vom Körper), phase
 */
function rigBiped(t, o = {}) {
  const moving = Boolean(o.moving);
  const thigh = o.thigh || 3;
  const shin = o.shin || 3;
  const legLen = thigh + shin;
  const hipW = o.hipW || 2;
  const crouch = o.crouch || 0;
  const freq = o.freq || 13;
  const phase = t * freq + (o.phase || 0);
  const stride = moving ? (o.stride === undefined ? legLen * 0.62 : o.stride) : 0;
  const lift = moving ? (o.lift === undefined ? legLen * 0.38 : o.lift) : 0;
  const breathe = Math.sin(t * (o.breatheRate || 2.6)) * (o.breathe === undefined ? 0.35 : o.breathe);

  const bob = moving ? Math.cos(phase * 2) * (o.bob === undefined ? 0.55 : o.bob) : breathe * 0.4;
  const hipY = (o.hipY || legLen * 0.94) - crouch * legLen * 0.35 + bob;
  const sway = moving ? Math.sin(phase) * 0.35 : Math.sin(t * 1.3) * 0.15;
  const pelvis = rigV(sway, hipY, 0);

  // Becken dreht sich leicht mit dem Schritt
  const hipTwist = moving ? Math.sin(phase) * 0.18 : 0;
  // Modell-x zeigt zur rechten Hand der Figur
  const hipR = rigRotY(rigV(pelvis.x + hipW, hipY, 0), hipTwist, pelvis);
  const hipL = rigRotY(rigV(pelvis.x - hipW, hipY, 0), hipTwist, pelvis);

  // Fußziele: Schwungphase hebt den Fuß in einem weichen Bogen
  const footFor = (side, ph) => {
    const s = Math.sin(ph);
    const c = Math.cos(ph);
    const x = side * (hipW * 0.95) + sway * 0.4;
    const z = s * stride * 0.5 + (o.footZ || 0);
    const y = Math.max(0, c) * lift;
    return rigV(x, y + (o.footY || 0), z);
  };
  const footR = o.footR || footFor(1, phase);
  const footL = o.footL || footFor(-1, phase + Math.PI);
  const kneePole = rigV(0, 0.2, 1);
  const kneeR = rigIK(hipR, rigAdd(footR, rigV(0, 0.6, 0)), thigh, shin, rigAdd(kneePole, rigV(0.15, 0, 0)));
  const kneeL = rigIK(hipL, rigAdd(footL, rigV(0, 0.6, 0)), thigh, shin, rigAdd(kneePole, rigV(-0.15, 0, 0)));
  const ankleR = rigAdd(footR, rigV(0, 0.6, 0));
  const ankleL = rigAdd(footL, rigV(0, 0.6, 0));

  // Wirbelsäule
  const torso = o.torso || 6;
  const lean = (moving ? (o.lean === undefined ? 0.16 : o.lean) : 0) + (o.extraLean || 0);
  const twist = (o.twist || 0) - hipTwist * 0.8;
  const chest = rigV(pelvis.x * 0.6, hipY + torso * 0.62 + breathe * 0.25, Math.sin(lean) * torso * 0.62);
  const neck = rigV(pelvis.x * 0.4, hipY + torso + breathe * 0.35, Math.sin(lean) * torso);
  const shoulderW = o.shoulderW || 3;
  const shoulderY = hipY + torso * 0.86 + breathe * 0.3;
  const shoulderZ = Math.sin(lean) * torso * 0.86;
  const shR = rigRotY(rigV(chest.x + shoulderW, shoulderY, shoulderZ), twist, chest);
  const shL = rigRotY(rigV(chest.x - shoulderW, shoulderY, shoulderZ), twist, chest);

  // Arme pendeln gegengleich zu den Beinen
  const upperArm = o.upperArm || 2.6;
  const foreArm = o.foreArm || 2.6;
  const armLen = upperArm + foreArm;
  const armSwing = moving ? (o.armSwing === undefined ? armLen * 0.55 : o.armSwing) : 0;
  const idleOut = o.idleArms === undefined ? 0.9 : o.idleArms;
  const idleSway = Math.sin(t * 2.6) * 0.25;
  const handFor = (sh, side, ph) => rigV(
    sh.x + side * idleOut,
    sh.y - armLen * 0.86 + Math.max(0, Math.sin(ph)) * armSwing * 0.3 + idleSway * 0.3,
    sh.z + Math.sin(ph) * armSwing + 0.6
  );
  const handR = o.handR || handFor(shR, 1, phase + Math.PI);
  const handL = o.handL || handFor(shL, -1, phase);
  const elbowR = rigIK(shR, handR, upperArm, foreArm, o.elbowPoleR || rigV(0.5, -0.2, -1));
  const elbowL = rigIK(shL, handL, upperArm, foreArm, o.elbowPoleL || rigV(-0.5, -0.2, -1));

  const headY = neck.y + (o.neck || 1.2);
  const nod = moving ? Math.cos(phase * 2) * 0.15 : Math.sin(t * 2.6 + 1) * 0.12;
  const head = rigV(neck.x, headY + nod, neck.z + (o.headZ || 0));

  return {
    phase, moving, bob, breathe, lean, twist, legLen, hipY,
    pelvis, hipR, hipL, kneeR, kneeL, ankleR, ankleL, footR, footL,
    chest, neck, head, shR, shL, elbowR, elbowL, handR, handL
  };
}

/**
 * Vierbeiner-Skelett (Trab: diagonale Beinpaare). Kopf vorne (+z), Schwanz hinten.
 * o: moving, freq, len (Rumpflänge), width, legH (Hüfthöhe), upper, lower, stride, lift,
 *    gait ('trot' | 'walk' | 'gallop'), crouch, headH, neckLen
 */
function rigQuad(t, o = {}) {
  const moving = Boolean(o.moving);
  const freq = o.freq || 11;
  const phase = t * freq + (o.phase || 0);
  const len = o.len || 8;
  const width = o.width || 2.5;
  const upper = o.upper || 2.4;
  const lower = o.lower || 2.4;
  const legH = (o.legH || (upper + lower) * 0.92) - (o.crouch || 0) * (upper + lower) * 0.4;
  const stride = moving ? (o.stride === undefined ? (upper + lower) * 0.7 : o.stride) : 0;
  const lift = moving ? (o.lift === undefined ? (upper + lower) * 0.35 : o.lift) : 0;
  const breathe = Math.sin(t * 2.4) * 0.3;
  const bob = moving ? Math.cos(phase * 2) * (o.bob === undefined ? 0.5 : o.bob) : breathe * 0.4;
  const gait = o.gait || 'trot';
  const offs = gait === 'walk'
    ? { RF: 0, LH: Math.PI * 0.5, LF: Math.PI, RH: Math.PI * 1.5 }
    : gait === 'gallop'
      ? { RF: 0, LF: 0.5, RH: Math.PI, LH: Math.PI + 0.5 }
      : { RF: 0, LH: 0, LF: Math.PI, RH: Math.PI };
  const pitch = gait === 'gallop' && moving ? Math.sin(phase) * 0.6 : 0;

  const front = rigV(0, legH + bob + breathe * 0.2 + pitch, len * 0.5);
  const back = rigV(0, legH + bob - pitch * 0.6, -len * 0.5);
  const legs = {};
  const mk = (key, root, side, isFront) => {
    const ph = phase + offs[key];
    const hip = rigV(root.x + side * width, root.y - 0.5, root.z);
    const foot = rigV(
      side * width * 1.05,
      Math.max(0, Math.cos(ph)) * lift,
      root.z + Math.sin(ph) * stride * 0.5
    );
    const pole = isFront ? rigV(0, 0, -1) : rigV(0, 0, 1);
    const knee = rigIK(hip, rigAdd(foot, rigV(0, 0.5, 0)), upper, lower, pole);
    legs[key] = { hip, knee, foot, ankle: rigAdd(foot, rigV(0, 0.5, 0)) };
  };
  mk('RF', front, 1, true);
  mk('LF', front, -1, true);
  mk('RH', back, 1, false);
  mk('LH', back, -1, false);

  const neckLen = o.neckLen || 2.5;
  const headH = o.headH === undefined ? 2.2 : o.headH;
  const nod = moving ? Math.cos(phase * 2) * 0.35 : Math.sin(t * 1.8) * 0.25;
  const neckBase = rigV(0, front.y + 0.6, front.z + 0.6);
  const head = rigV(0, neckBase.y + headH + nod, neckBase.z + neckLen);
  const tailBase = rigV(0, back.y + 0.6, back.z - 0.6);
  return { phase, moving, bob, breathe, front, back, legs, neckBase, head, tailBase, legH };
}

/**
 * Punktkette (Schwanz, Schlangenkörper, Tentakel, Haar, Umhang-Kante).
 * Startet bei base, läuft in Richtung dir, wellt seitlich (x) und/oder vertikal.
 * o: n, seg, amp, freq, k (Wellenzahl), ampY, grow (Amplitude wächst zur Spitze), droop
 */
function rigChain(t, base, dir, o = {}) {
  const n = o.n || 6;
  const seg = o.seg || 1.5;
  const amp = o.amp || 0;
  const ampY = o.ampY || 0;
  const freq = o.freq || 4;
  const k = o.k || 0.8;
  const droop = o.droop || 0;
  const d = rigNorm(dir);
  // Seitenvektor senkrecht zur Richtung (bevorzugt horizontal)
  let side = rigCross(d, rigV(0, 1, 0));
  if (rigLen(side) < 0.1) side = rigV(1, 0, 0);
  side = rigNorm(side);
  const up = rigNorm(rigCross(side, d));
  const pts = [base];
  for (let i = 1; i <= n; i++) {
    const f = i / n;
    const g = o.grow === false ? 1 : f;
    const w = Math.sin(t * freq - i * k) * amp * g;
    const wy = Math.cos(t * freq * 0.8 - i * k) * ampY * g;
    pts.push(rigV(
      base.x + d.x * seg * i + side.x * w + up.x * wy,
      base.y + d.y * seg * i + side.y * w + up.y * wy - droop * f * f,
      base.z + d.z * seg * i + side.z * w + up.z * wy
    ));
  }
  return pts;
}

/**
 * Bodenkette für Schlangen/Würmer: Körper schlängelt sich am Boden entlang (S-Kurven).
 * Liefert Punkte von Kopf (Index 0) bis Schwanzspitze.
 */
function rigSerpent(t, o = {}) {
  const n = o.n || 10;
  const seg = o.seg || 2;
  const moving = Boolean(o.moving);
  const speed = moving ? (o.freq || 7) : (o.idleFreq || 2);
  const amp = (moving ? o.amp || 2.6 : o.idleAmp || 1.2);
  const k = o.k || 0.75;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const z = (o.headZ || 4) - i * seg;
    const env = 0.35 + 0.65 * (i / n);
    const x = Math.sin(t * speed - i * k) * amp * env;
    const y = (o.rise && i < o.rise.length) ? o.rise[i] : (o.height || 0);
    pts.push(rigV(x, y, z));
  }
  return pts;
}

/**
 * Zustand für Angriffe: gibt die Phase 'idle' | 'windup' | 'strike' plus Fortschritt zurück.
 * opts.attackT (0..1 Ausholen) und opts.strikeT (0..1 Nachschwingen) kommen aus enemies.js;
 * im Showroom (ohne Timer) wird ein Schleifen-Zyklus aus der Zeit erzeugt.
 */
function rigAttackPhase(state, time, opts = {}) {
  if (opts.strikeT !== undefined && opts.strikeT > 0) {
    return { phase: 'strike', p: rigClamp(1 - opts.strikeT, 0, 1), windup: 0, strike: rigClamp(1 - opts.strikeT, 0, 1) };
  }
  if (state !== 'attack') return { phase: 'idle', p: 0, windup: 0, strike: 0 };
  if (opts.attackT !== undefined) {
    return { phase: 'windup', p: rigClamp(opts.attackT, 0, 1), windup: rigClamp(opts.attackT, 0, 1), strike: 0 };
  }
  // Showroom-Schleife: 0.0-0.6 ausholen, 0.6-1.0 zuschlagen
  const cyc = (time * 0.9) % 1;
  if (cyc < 0.6) {
    const p = cyc / 0.6;
    return { phase: 'windup', p, windup: p, strike: 0 };
  }
  const p = (cyc - 0.6) / 0.4;
  return { phase: 'strike', p, windup: 0, strike: p };
}

/**
 * Einheitlicher "Schlag-Wert": -1 = voll ausgeholt, 0 = Ruhe, +1 = voll durchgeschlagen.
 * Praktisch, um Gliedmaßen zwischen drei Posen zu blenden.
 */
function rigSwingValue(ap) {
  if (ap.phase === 'windup') return -rigEaseInOut(ap.p);
  if (ap.phase === 'strike') {
    const p = ap.p;
    if (p < 0.25) return -1 + rigEaseOut(p / 0.25) * 2;      // schneller Schlag
    return 1 - rigEaseInOut((p - 0.25) / 0.75);             // langsames Zurückfedern
  }
  return 0;
}

/** Wiederverwendbare Rig-Instanz (Zeichnen ist synchron, daher reicht eine) */
const RIG = new SkelRig();


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
function heroSlashTheta(p, type) {
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
function renderHeroSwingTrail(ctx, px, py, action, opts = {}) {
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
    g.addColorStop(1, `rgba(${col},${0.45 * fade})`);
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
// SMARAGD-DRUIDE: WERBÄR-GESTALT (Vierbeiner-Rig)
// -----------------------------------------------------------------------------

/**
 * Druidenbär: massiger Braunbär mit Moosrücken, Zweig-Geweih, leuchtenden Runen.
 * Gleiche Signatur wie Helden-Skins; action steuert Prankenhieb, Ansprung und Wirbel.
 */
function renderDruidBear(ctx, px, py, animTime, direction, isMoving, hitFlash, action) {
  const t = animTime;
  let facing = direction;
  let swipe = 0;      // -1..1 Prankenhieb (rechte Pranke)
  let swipeSide = 1;
  let lunge = 0;      // 0..1 Ansprung
  let rear = 0;       // 0..1 Aufrichten
  if (action && action.type) {
    facing = action.angle;
    const p = rigClamp(action.progress || 0, 0, 1);
    if (action.type === 'slash' || action.type === 'slash2') {
      swipeSide = action.type === 'slash2' ? -1 : 1;
      rear = p < 0.2 ? rigEaseOut(p / 0.2) * 0.55 : 0.55 * (1 - rigEaseInOut((p - 0.2) / 0.8));
      swipe = p < 0.2 ? -rigEaseOut(p / 0.2) : (p < 0.5 ? heroLerp(-1, 1, rigEaseOut((p - 0.2) / 0.3)) : heroLerp(1, 0.3, (p - 0.5) / 0.5));
    } else if (action.type === 'thrust') {
      lunge = p < 0.2 ? -rigEaseOut(p / 0.2) * 0.4 : (p < 0.45 ? heroLerp(-0.4, 1, rigEaseOut((p - 0.2) / 0.25)) : heroLerp(1, 0, rigEaseInOut((p - 0.45) / 0.55)));
    } else if (action.type === 'spin') {
      facing = (action.angle || 0) + t * 26;
      rear = 0.75;
    }
  }
  const moving = Boolean(isMoving) && !action;
  const r = RIG.begin(ctx, px, py, { facing, flash: hitFlash > 0 ? 0.55 : 0, flashColor: '#f87171' });

  // Druiden-Aura am Boden mit kreisenden Blättern
  const pulse = 1 + Math.sin(t * 4) * 0.1;
  ctx.save();
  const ag = ctx.createRadialGradient(px, py, 2, px, py, 17 * pulse);
  ag.addColorStop(0, 'rgba(74, 222, 128, 0.32)');
  ag.addColorStop(0.7, 'rgba(22, 163, 74, 0.12)');
  ag.addColorStop(1, 'rgba(22, 101, 52, 0)');
  ctx.fillStyle = ag;
  ctx.beginPath();
  ctx.ellipse(px, py, 17 * pulse, 9 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  r.shadow(10.5, 4.5, 0.38, 0, 0.5);

  const fur = '#6b3f22';
  const furDark = '#4a2814';
  const moss = '#3f8f3a';
  const q = rigQuad(t, {
    moving, freq: 10, len: 8.5, width: 2.7, upper: 2.7, lower: 2.6,
    stride: moving ? 4.2 : 0, lift: 1.6, gait: 'walk', crouch: lunge < 0 ? -lunge * 0.6 : 0
  });
  // Aufrichten (Hieb/Wirbel) und Vorspringen verschieben Vorderkörper
  const lift = rear * 4.5;
  const fwd = lunge * 3.2;
  q.front.y += lift;
  q.front.z += fwd;
  q.back.z += fwd * 0.6;
  q.head = rigAdd(q.head, rigV(0, lift * 1.05 - lunge * 1.2, fwd + lunge * 0.8));

  // Beine neu lösen (Vorderbeine folgen dem angehobenen Vorderkörper)
  const legR = (key, root, side, isFront) => {
    const L = q.legs[key];
    const hip = rigV(side * 2.7, root.y - 0.5, root.z);
    let foot = L.foot;
    if (isFront && rear > 0) {
      // Vorderpranken in der Luft
      foot = rigV(side * 3.0, root.y - 3.2 + rear, root.z + 1.4);
      if (action && action.type === 'spin') foot = rigV(side * 5.4, root.y - 1.2, root.z + 0.4);
    }
    if (isFront && swipe !== 0 && side === swipeSide) {
      // Prankenhieb: Bogen von außen-hinten nach innen-vorne
      const th = -swipe * 1.4 * swipeSide;
      foot = rigV(Math.sin(th) * 4.6 + side * 1.0, root.y - 1.5 + Math.cos(swipe * 1.5) * 1.2, root.z + Math.cos(th) * 4.0);
    }
    if (isFront && lunge > 0) foot = rigV(side * 2.6, Math.max(0, 1.5 - lunge * 1.5), root.z + lunge * 2.6);
    const knee = rigIK(hip, foot, 2.7, 2.6, isFront ? rigV(0, -0.3, -1) : rigV(0, 0, 1));
    return { hip, knee, foot };
  };
  const legs = {
    RF: legR('RF', q.front, 1, true), LF: legR('LF', q.front, -1, true),
    RH: legR('RH', q.back, 1, false), LH: legR('LH', q.back, -1, false)
  };
  for (const key of ['RH', 'LH', 'RF', 'LF']) {
    const L = legs[key];
    const isFront = key.charAt(1) === 'F';
    r.capsule(L.hip, L.knee, 1.95, 1.6, fur);
    r.capsule(L.knee, L.foot, 1.6, 1.4, furDark);
    const paw = rigAdd(L.foot, rigV(0, 0.3, 0.5));
    r.ball(paw, 1.45, furDark, { sy: 0.75 });
    // Krallen
    for (let k = -1; k <= 1; k++) {
      r.ball(rigAdd(paw, rigV(k * 0.6, -0.1, 1.25)), 0.33, '#f5f0e1', { outline: false, gloss: 0, bias: 0.05 });
    }
    if (isFront && swipe !== 0 && (key === 'RF') === (swipeSide === 1)) {
      r.glow(paw, 3.2, 'rgba(134,239,172,0.9)', { alpha: 0.55 });
    }
  }

  // Massiger Rumpf: Hinterteil, Bauch, Schulterbuckel
  const mid = rigLerp(q.front, q.back, 0.5);
  r.ball(rigAdd(q.back, rigV(0, 1.6, -0.6)), 4.3, fur, { sy: 0.95, gloss: 0.12 });
  r.ball(rigAdd(mid, rigV(0, 1.9, 0)), 4.8, fur, { sx: 1.0, sy: 0.92, gloss: 0.12 });
  const hump = rigAdd(q.front, rigV(0, 2.6, -0.8));
  r.ball(hump, 4.4, fur, { gloss: 0.15 });
  // Moosrücken mit Blättern und kleinen Blüten
  const mossPts = [rigAdd(q.back, rigV(0, 5.4, -0.4)), rigAdd(mid, rigV(0.4, 6.4, 0)), rigAdd(hump, rigV(-0.3, 4.2, -0.2))];
  mossPts.forEach((m, i) => r.ball(m, 2.2 - i * 0.2, i === 1 ? '#4ca346' : moss, { sy: 0.55, gloss: 0.25, bias: 0.3 }));
  r.ball(rigAdd(mossPts[1], rigV(1.1, 0.8, 0.4)), 0.45, '#fde047', { bias: 0.5, gloss: 0 });
  r.ball(rigAdd(mossPts[0], rigV(-0.9, 0.7, 0.2)), 0.4, '#f9a8d4', { bias: 0.5, gloss: 0 });
  // Leuchtende Druidenrunen auf den Schultern
  for (const side of [1, -1]) {
    const rp = rigAdd(hump, rigV(side * 3.6, 0.2, 1.0));
    const P = r.P(rp);
    r.custom(P.d + 0.2, (c, rr) => {
      if (rr.toCam(rigV(side, 0, 0.6)) < 0) return;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = `rgba(134, 239, 172, ${0.7 + Math.sin(t * 5) * 0.25})`;
      c.lineWidth = 0.45 * rr.s;
      c.beginPath();
      for (let k = 0; k < 14; k++) {
        const a = k * 0.55;
        const rad = 0.15 * k * rr.s;
        const x = P.x + Math.cos(a) * rad;
        const y = P.y + Math.sin(a) * rad * 0.8;
        if (k === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
      c.restore();
    });
  }

  // Kopf mit Schnauze, runden Ohren, Zweig-Geweih und Smaragdaugen
  const H = q.head;
  const HR = 3.3;
  r.capsule(rigAdd(q.front, rigV(0, 2.4, 0.4)), H, 2.6, 2.3, fur);
  r.ball(H, HR, fur, { gloss: 0.18, after: (c) => {
    r.eye(c, H, HR, 0.48, 0.18, { style: 'glow', color: '#4ade80', size: 1.0, blink: heroBlink(t, 0.5) });
    r.eye(c, H, HR, -0.48, 0.18, { style: 'glow', color: '#4ade80', size: 1.0, blink: heroBlink(t, 0.5) });
    // Rune auf der Stirn
    r.mark(c, H, HR, 0, 0.55, (cc, P, sq, s) => {
      cc.globalCompositeOperation = 'lighter';
      cc.strokeStyle = 'rgba(134,239,172,0.85)'; cc.lineWidth = 0.4 * s;
      cc.beginPath(); cc.moveTo(P.x, P.y - 0.9 * s); cc.lineTo(P.x, P.y + 0.6 * s);
      cc.moveTo(P.x - 0.6 * s * sq, P.y - 0.3 * s); cc.lineTo(P.x, P.y + 0.1 * s); cc.lineTo(P.x + 0.6 * s * sq, P.y - 0.3 * s); cc.stroke();
    });
  } });
  const snout = rigAdd(H, rigV(0, -0.9, HR * 0.95));
  r.ball(snout, 1.6, '#b98a5e', { sx: 1.1, sy: 0.85, bias: 0.2 });
  r.ball(rigAdd(snout, rigV(0, 0.45, 1.25)), 0.62, '#1c1410', { sx: 1.2, sy: 0.8, gloss: 0.6, bias: 0.3 });
  if (lunge > 0.3 || swipe !== 0) {
    // Brüllendes Maul
    r.ball(rigAdd(snout, rigV(0, -0.8, 0.7)), 0.8, '#7f1d1d', { sx: 1.2, sy: 0.6, bias: 0.25 });
  }
  for (const side of [1, -1]) {
    r.ball(rigSurfPt(H, HR * 0.95, side * 0.9, 0.75), 1.15, furDark, { sy: 0.9, bias: -0.05 });
    // Zweig-Geweih mit Blättchen
    const base = rigSurfPt(H, HR, side * 0.45, 0.95);
    const k1 = rigAdd(base, rigV(side * 0.8, 1.6, -0.2));
    const tip = rigAdd(k1, rigV(side * 1.0, 1.4, -0.4));
    const tine = rigAdd(k1, rigV(-side * 0.2, 1.3, 0.5));
    r.line([base, k1, tip], '#7c5a3a', 0.45, { smooth: false, bias: 0.1 });
    r.line([k1, tine], '#7c5a3a', 0.35, { smooth: false, bias: 0.1 });
    const leafSway = Math.sin(t * 3 + side) * 0.3;
    r.poly([tip, rigAdd(tip, rigV(side * 0.8 + leafSway, 0.7, 0.3)), rigAdd(tip, rigV(side * 1.2 + leafSway, 0.1, 0))], '#4ade80', { bias: 0.15 });
    r.poly([tine, rigAdd(tine, rigV(-side * 0.4 + leafSway, 0.8, 0.5)), rigAdd(tine, rigV(side * 0.4 + leafSway, 0.7, 0.2))], '#22c55e', { bias: 0.15 });
  }

  // Kleiner Stummelschwanz
  r.ball(rigAdd(q.back, rigV(0, 2.4, -4.6)), 1.0, furDark, { bias: -0.1 });

  // Schwebende Blätter der Druidenmagie
  for (let i = 0; i < 3; i++) {
    const life = (t * 0.45 + i / 3) % 1;
    const a = i * 2.1 + t * 0.8;
    const lp = rigV(Math.cos(a) * 9, 1 + life * 12, Math.sin(a) * 7);
    const P = r.P(lp);
    r.custom(P.d, (c, rr) => {
      c.save();
      c.globalAlpha *= Math.sin(life * Math.PI) * 0.9;
      c.translate(P.x, P.y);
      c.rotate(t * 2 + i);
      c.fillStyle = rr.col(i % 2 ? '#86efac' : '#4ade80');
      c.beginPath();
      c.ellipse(0, 0, 1.1 * rr.s, 0.5 * rr.s, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    });
  }
  r.flush();
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
 * 22 prozedural animierte Gegner auf dem gemeinsamen Pseudo-3D-Skelett-Rig (js/rig.js)
 * im "Süßen Dark Ghibli 2.5D Papercraft"-Stil.
 * Inspiriert von Prinzessin Mononoke, Chihiros Reise ins Zauberland, Totoro und japanischer Mythologie.
 *
 * render(ctx, cx, cy, time, state, hitFlash, opts)
 *   state: 'idle' | 'walk' | 'attack'
 *   opts (optional, aus enemies.js): { facing (Winkel), attackT (0..1 Ausholen), strikeT (1..0 Nachschwingen) }
 *   Ohne opts (Showroom) blicken Monster schräg nach vorne und spielen eine Angriffsschleife ab.
 */

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
  // Eiskristall-Keule in der rechten Pranke
  const clubDir = rigNorm(raise > 0 ? rigV(0.2, 1, -0.4) : (slam > 0 ? rigV(0, -0.4 + (1 - slam) * 1.2, 1) : rigV(0.3, -0.35, 1)));
  const clubTip = rigAdd(sk.handR, rigScale(clubDir, 8.5));
  r.capsule(rigAdd(sk.handR, rigScale(clubDir, -1)), clubTip, 0.7, 2.1, '#7dd3fc', { light: 0.5, bias: 0.15 });
  r.ball(clubTip, 1.6, '#e0f2fe', { gloss: 0.7, bias: 0.2 });
  r.glow(clubTip, 3.5 + raise * 2, 'rgba(125,211,252,0.85)', { alpha: 0.35 + raise * 0.4 });
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
          <canvas id="enemy-canvas-${enemy.id}" class="enemy-canvas" width="360" height="360"></canvas>
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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Hochauflösend: logische 80x80-Bühne (Mitte bei 40, 40)
        const k = canvas.width / 80;
        ctx.setTransform(k, 0, 0, k, 0, 0);
        ctx.translate(40, 42);
        ctx.scale(1.45, 1.45);
        enemy.render(ctx, 0, 0, st.animTime, st.state, Math.max(0, st.hitTimer));
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    });
  }
}


// --- showroom.js ---

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

  if (player.skinId && CHARACTERS_MAP[player.skinId]) {
    CHARACTERS_MAP[player.skinId].render(ctx, px, py, t, player.direction || 'down', player.isMoving, 0);
    return;
  }

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

  if (player.skinId && CHARACTERS_MAP[player.skinId]) {
    CHARACTERS_MAP[player.skinId].render(ctx, px, py, t, player.direction || 'down', player.isMoving, 0);
    return;
  }

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

  if (player.skinId && CHARACTERS_MAP[player.skinId]) {
    CHARACTERS_MAP[player.skinId].render(ctx, px, py, t, player.direction || 'down', player.isMoving, 0);
    return;
  }

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

  if (player.skinId && CHARACTERS_MAP[player.skinId]) {
    CHARACTERS_MAP[player.skinId].render(ctx, px, py, t, player.direction || 'down', player.isMoving, 0);
    return;
  }

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
// 8b. CHARACTER SHOWCASE MANAGER (15 Playable Heroes)
// ============================================================================
class CharacterShowcaseManager {
  constructor(app = null) {
    this.app = app;
    this.container = document.getElementById('characters-grid');
    this.activeHeroBadge = document.getElementById('active-hero-badge-name');
    this.filtersContainer = document.getElementById('characters-filters');
    this.canvases = {};
    this.charStates = {};
    this.currentCategory = 'all';
    this.selectedSkin = getSelectedSkin();
    this.initialized = false;

    // Initialize individual animation states for all 15 characters
    CHARACTERS_DATA.forEach(char => {
      this.charStates[char.id] = {
        animTime: 0,
        direction: 'down',
        isMoving: true,
        hitTimer: 0
      };
    });
  }

  init() {
    if (!this.container) {
      this.container = document.getElementById('characters-grid');
    }
    if (!this.activeHeroBadge) {
      this.activeHeroBadge = document.getElementById('active-hero-badge-name');
    }
    if (!this.filtersContainer) {
      this.filtersContainer = document.getElementById('characters-filters');
    }

    this.selectedSkin = getSelectedSkin();
    this.updateActiveHeroBadge();

    if (!this.initialized) {
      this.initFilterEvents();
      this.initialized = true;
    }
    this.renderCards();
  }

  updateActiveHeroBadge() {
    if (this.activeHeroBadge && CHARACTERS_MAP[this.selectedSkin]) {
      const char = CHARACTERS_MAP[this.selectedSkin];
      this.activeHeroBadge.textContent = `${char.name} (${char.title.split(' (')[0]})`;
    }
  }

  initFilterEvents() {
    if (!this.filtersContainer) return;
    this.filtersContainer.querySelectorAll('.char-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filtersContainer.querySelectorAll('.char-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.dataset.category || 'all';
        this.renderCards();
      });
    });
  }

  selectSkin(skinId) {
    if (!CHARACTERS_MAP[skinId]) return;
    this.selectedSkin = skinId;
    setSelectedSkin(skinId);
    this.updateActiveHeroBadge();

    if (this.app && this.app.player) {
      this.app.player.skinId = skinId;
    }

    const select = document.getElementById('select-hero-skin');
    if (select && select.value !== skinId) {
      select.value = skinId;
    }

    // Update active visual cues on cards
    if (this.container) {
      this.container.querySelectorAll('.character-card').forEach(card => {
        const isChosen = card.dataset.id === skinId;
        card.classList.toggle('is-active-skin', isChosen);
        const btn = card.querySelector('.btn-choose-skin');
        if (btn) {
          btn.classList.toggle('btn-is-chosen', isChosen);
          btn.textContent = isChosen ? '✓ Aktiver Held' : '🎮 Als Held wählen';
        }
        let activeTag = card.querySelector('.char-active-indicator');
        if (isChosen && !activeTag) {
          const badgeGroup = card.querySelector('.char-badges-group');
          if (badgeGroup) {
            const tag = document.createElement('span');
            tag.className = 'char-active-indicator';
            tag.textContent = '✓ Aktiv';
            badgeGroup.appendChild(tag);
          }
        } else if (!isChosen && activeTag) {
          activeTag.remove();
        }
      });
    }
  }

  renderCards() {
    if (!this.container) return;
    this.container.innerHTML = '';
    this.canvases = {};

    const filtered = this.currentCategory === 'all'
      ? CHARACTERS_DATA
      : CHARACTERS_DATA.filter(c => c.category === this.currentCategory);

    filtered.forEach(char => {
      const st = this.charStates[char.id];
      const isSelected = char.id === this.selectedSkin;

      const card = document.createElement('div');
      card.className = `character-card ${isSelected ? 'is-active-skin' : ''}`;
      card.dataset.id = char.id;
      card.dataset.category = char.category;

      card.innerHTML = `
        <div class="char-card-header">
          <div class="char-title-group">
            <h3>${char.name}</h3>
            <span class="char-title">${char.title}</span>
          </div>
          <div class="char-badges-group">
            <span class="char-badge ${char.badgeClass}">${char.categoryName}</span>
            ${isSelected ? '<span class="char-active-indicator">✓ Aktiv</span>' : ''}
          </div>
        </div>

        <div class="char-preview-stage">
          <canvas id="char-canvas-${char.id}" class="char-canvas" width="320" height="320"></canvas>
          <div class="char-stage-controls">
            <button class="char-stage-btn btn-char-anim" title="Animation (Laufen / Stehen)">
              Modus: <span class="anim-label">${st.isMoving ? 'LAUFEN' : 'STEHEN'}</span>
            </button>
            <button class="char-stage-btn btn-char-dir" title="Blickrichtung drehen">
              🔄 Blick: <span class="dir-label">${st.direction.toUpperCase()}</span>
            </button>
          </div>
        </div>

        <div class="char-details-panel">
          <p class="char-desc">${char.desc}</p>
          <div class="char-palette-row">
            <span class="char-palette-label">Palette:</span>
            ${char.palette.map(c => `<span class="char-color-dot" style="background:${c}"></span>`).join('')}
          </div>
          <div class="char-lore-quote">„${char.lore}“</div>
        </div>

        <div class="char-card-actions">
          <button class="char-btn btn-choose-skin ${isSelected ? 'btn-is-chosen' : ''}" title="Diesen Helden für Spiel & Showroom auswählen">
            ${isSelected ? '✓ Aktiver Held' : '🎮 Als Held wählen'}
          </button>
          <button class="char-btn btn-test-playground" title="Sofort im Playground testen">
            🕹️ Testen
          </button>
        </div>
      `;

      this.container.appendChild(card);

      const canvas = card.querySelector(`#char-canvas-${char.id}`);
      if (canvas) {
        this.canvases[char.id] = canvas;
      }

      // Wire Modus Toggle (Idle vs Moving)
      const btnAnim = card.querySelector('.btn-char-anim');
      const animLabel = card.querySelector('.anim-label');
      if (btnAnim && animLabel) {
        btnAnim.addEventListener('click', (e) => {
          e.stopPropagation();
          st.isMoving = !st.isMoving;
          animLabel.textContent = st.isMoving ? 'LAUFEN' : 'STEHEN';
        });
      }

      // Wire Direction Cycle (8 directions)
      const btnDir = card.querySelector('.btn-char-dir');
      const dirLabel = card.querySelector('.dir-label');
      const dirs = ['down', 'down-right', 'right', 'up-right', 'up', 'up-left', 'left', 'down-left'];
      if (btnDir && dirLabel) {
        btnDir.addEventListener('click', (e) => {
          e.stopPropagation();
          const nextIdx = (dirs.indexOf(st.direction) + 1) % dirs.length;
          st.direction = dirs[nextIdx];
          dirLabel.textContent = st.direction.toUpperCase();
        });
      }

      // Wire Select Hero button
      const btnSelect = card.querySelector('.btn-choose-skin');
      if (btnSelect) {
        btnSelect.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectSkin(char.id);
        });
      }

      // Wire Test in Playground button
      const btnTest = card.querySelector('.btn-test-playground');
      if (btnTest) {
        btnTest.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectSkin(char.id);
          if (this.app) {
            this.app.openPlayground('paper_mononoke');
          }
        });
      }
    });
  }

  update(dt) {
    CHARACTERS_DATA.forEach(char => {
      const st = this.charStates[char.id];
      if (!st) return;
      st.animTime += dt;
      if (st.hitTimer > 0) st.hitTimer -= dt;

      const canvas = this.canvases[char.id];
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Hochauflösend: logische 80x80-Bühne, Held vergrößert, Füße bei y = 64
        const k = canvas.width / 80;
        ctx.setTransform(k, 0, 0, k, 0, 0);
        ctx.translate(40, 64);
        ctx.scale(2.2, 2.2);
        char.render(ctx, 0, 0, st.animTime, st.direction, st.isMoving, Math.max(0, st.hitTimer));
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    });
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
      speed: 130,
      direction: 'down',
      skinId: getSelectedSkin()
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
    this.charactersView = document.getElementById('characters-view');
    this.btnModeGallery = document.getElementById('btn-mode-gallery');
    this.btnModePlayground = document.getElementById('btn-mode-playground');
    this.btnModeBestiary = document.getElementById('btn-mode-bestiary');
    this.btnModeCharacters = document.getElementById('btn-mode-characters');
    this.headerStyleSwitcher = document.getElementById('header-style-switcher');
    this.playgroundCanvas = document.getElementById('playground-canvas');
    this.playgroundCtx = this.playgroundCanvas.getContext('2d');
    this.crtOverlay = document.getElementById('crt-overlay');

    this.bestiaryGrid = document.getElementById('bestiary-grid');
    this.bestiaryManager = new BestiaryManager(this.bestiaryGrid || 'bestiary-grid');
    if (this.bestiaryManager) {
      this.bestiaryManager.init();
    }

    this.charactersManager = new CharacterShowcaseManager(this);
    if (this.charactersManager) {
      this.charactersManager.init();
    }

    const selectSkin = document.getElementById('select-hero-skin');
    if (selectSkin) {
      selectSkin.value = this.player.skinId;
    }

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
    if (this.btnModeCharacters) {
      this.btnModeCharacters.addEventListener('click', () => this.setMode('characters'));
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
      if (this.charactersView) this.charactersView.classList.add('hidden');
      this.headerStyleSwitcher.classList.add('hidden');
      this.btnModeGallery.classList.add('active');
      this.btnModePlayground.classList.remove('active');
      if (this.btnModeBestiary) this.btnModeBestiary.classList.remove('active');
      if (this.btnModeCharacters) this.btnModeCharacters.classList.remove('active');
    } else if (mode === 'playground') {
      this.galleryView.classList.add('hidden');
      this.playgroundView.classList.remove('hidden');
      if (this.bestiaryView) this.bestiaryView.classList.add('hidden');
      if (this.charactersView) this.charactersView.classList.add('hidden');
      this.headerStyleSwitcher.classList.remove('hidden');
      this.btnModeGallery.classList.remove('active');
      this.btnModePlayground.classList.add('active');
      if (this.btnModeBestiary) this.btnModeBestiary.classList.remove('active');
      if (this.btnModeCharacters) this.btnModeCharacters.classList.remove('active');
      this.resize();
    } else if (mode === 'bestiary') {
      this.galleryView.classList.add('hidden');
      this.playgroundView.classList.add('hidden');
      if (this.bestiaryView) this.bestiaryView.classList.remove('hidden');
      if (this.charactersView) this.charactersView.classList.add('hidden');
      this.headerStyleSwitcher.classList.add('hidden');
      this.btnModeGallery.classList.remove('active');
      this.btnModePlayground.classList.remove('active');
      if (this.btnModeBestiary) this.btnModeBestiary.classList.add('active');
      if (this.btnModeCharacters) this.btnModeCharacters.classList.remove('active');
      if (this.bestiaryManager) {
        this.bestiaryManager.init();
      }
    } else if (mode === 'characters') {
      this.galleryView.classList.add('hidden');
      this.playgroundView.classList.add('hidden');
      if (this.bestiaryView) this.bestiaryView.classList.add('hidden');
      if (this.charactersView) this.charactersView.classList.remove('hidden');
      this.headerStyleSwitcher.classList.add('hidden');
      this.btnModeGallery.classList.remove('active');
      this.btnModePlayground.classList.remove('active');
      if (this.btnModeBestiary) this.btnModeBestiary.classList.remove('active');
      if (this.btnModeCharacters) this.btnModeCharacters.classList.add('active');
      if (this.charactersManager) {
        this.charactersManager.init();
      }
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

  setPlayerSkin(skinId) {
    if (CHARACTERS_MAP[skinId]) {
      this.player.skinId = skinId;
      setSelectedSkin(skinId);
      if (this.charactersManager) {
        this.charactersManager.selectSkin(skinId);
      }
      const select = document.getElementById('select-hero-skin');
      if (select && select.value !== skinId) {
        select.value = skinId;
      }
    }
  }

  update(dt) {
    this.animTime += dt;

    if (this.currentMode === 'bestiary') {
      if (this.bestiaryManager) this.bestiaryManager.update(dt);
      return;
    }

    if (this.currentMode === 'characters') {
      if (this.charactersManager) this.charactersManager.update(dt);
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
        if (dy < 0 && dx < 0) this.player.direction = 'up-left';
        else if (dy < 0 && dx > 0) this.player.direction = 'up-right';
        else if (dy > 0 && dx < 0) this.player.direction = 'down-left';
        else if (dy > 0 && dx > 0) this.player.direction = 'down-right';
        else if (dy < 0) this.player.direction = 'up';
        else if (dy > 0) this.player.direction = 'down';
        else if (dx < 0) this.player.direction = 'left';
        else if (dx > 0) this.player.direction = 'right';

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


})();
