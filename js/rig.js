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

const RIG_TILT = 0.5;      // Wie stark Bodentiefe auf Bildschirm-Y abgebildet wird
const RIG_CAM_Y = 0.55;    // Kamerablick: Höhenanteil
const RIG_CAM_Z = 0.84;    // Kamerablick: Tiefenanteil (zum Betrachter)
const RIG_TAU = Math.PI * 2;

export const RIG_DIR_ANGLE = {
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
export function rigFacingAngle(facing) {
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
export function rigMix(a, b, t) {
  const key = a + b + t.toFixed(2);
  let out = rigColorCache.get(key);
  if (out) return out;
  const A = rigParseHex(a);
  const B = rigParseHex(b);
  out = rigToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  rigColorCache.set(key, out);
  return out;
}

/** Hellt auf (amt > 0, Richtung warmes Weiß) oder dunkelt ab (amt < 0, Richtung Indigo) */
export function rigShade(hex, amt) {
  if (!amt) return hex;
  const key = hex + '~' + amt.toFixed(2);
  let out = rigColorCache.get(key);
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
  rigColorCache.set(key, out);
  return out;
}

// -----------------------------------------------------------------------------
// VEKTOR-HILFEN (Modellraum)
// -----------------------------------------------------------------------------
export function rigV(x, y, z) { return { x, y, z }; }
export function rigAdd(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
export function rigSub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
export function rigScale(a, s) { return { x: a.x * s, y: a.y * s, z: a.z * s }; }
export function rigLerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }; }
export function rigLen(a) { return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z); }
export function rigNorm(a) {
  const l = rigLen(a) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
}
export function rigDot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
export function rigCross(a, b) {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
/** Dreht einen Punkt um die senkrechte Achse (für Oberkörper-Twist / Schwünge) */
export function rigRotY(p, ang, pivot) {
  const px = pivot ? pivot.x : 0;
  const pz = pivot ? pivot.z : 0;
  const dx = p.x - px;
  const dz = p.z - pz;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return { x: px + dx * c + dz * s, y: p.y, z: pz - dx * s + dz * c };
}
export function rigClamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
export function rigEaseOut(t) { return 1 - (1 - t) * (1 - t) * (1 - t); }
export function rigEaseInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
/** Federnder Überschwinger (für Schläge: Ausholen -> Schlag -> Nachschwingen) */
export function rigBackOut(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Zwei-Knochen-IK: liefert das Mittelgelenk (Knie/Ellbogen) zwischen Wurzel a und Ziel c.
 * pole gibt die Richtung an, in die das Gelenk knicken soll.
 */
export function rigIK(a, c, l1, l2, pole) {
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
export class SkelRig {
  constructor() {
    this.items = [];
    this.ctx = null;
    this.ox = 0;
    this.oy = 0;
    this.s = 1;
    this.flash = 0;
    this.flashColor = '#ffffff';
    this.ink = 0.85;
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
    this.flashColor = o.flashColor || '#ffffff';
    this.ink = o.ink === undefined ? 0.85 : o.ink;
    this.alpha = o.alpha === undefined ? 1 : o.alpha;
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
      y: this.oy + (-p.y + gd * RIG_TILT) * this.s,
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
    let c = k ? rigShade(hex, k) : hex;
    if (this.flash > 0) c = rigMix(c, this.flashColor, Math.round(this.flash * 0.85 * 10) / 10);
    return c;
  }

  inkCol(hex) {
    return this.col(rigMix(rigShade(hex, -0.62), '#1b1530', 0.25));
  }

  add(depth, fn) {
    this.items.push({ d: depth, i: this.items.length, fn });
  }

  /** Zeichnet alle gesammelten Teile in Tiefenreihenfolge */
  flush() {
    const items = this.items;
    items.sort((a, b) => (a.d - b.d) || (a.i - b.i));
    const ctx = this.ctx;
    const prevAlpha = ctx.globalAlpha;
    if (this.alpha !== 1) ctx.globalAlpha = prevAlpha * this.alpha;
    for (let i = 0; i < items.length; i++) items[i].fn(ctx, this);
    ctx.globalAlpha = prevAlpha;
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
      ctx.save();
      if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
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
      ctx.restore();
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
      ctx.save();
      if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
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
      ctx.restore();
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
      ctx.save();
      if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
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
      ctx.restore();
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
      ctx.save();
      if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
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
      ctx.restore();
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
    ctx.save();
    if (style === 'closed' || style === 'happy' || blink > 0.85) {
      ctx.strokeStyle = this.col(o.lid || '#1b1530');
      ctx.lineWidth = Math.max(0.6, 0.55 * s);
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (style === 'happy') ctx.arc(P.x, P.y + h * 0.25, w * 0.9, Math.PI * 1.15, Math.PI * 1.85);
      else ctx.arc(P.x, P.y - h * 0.15, w * 0.9, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.restore();
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
      ctx.restore();
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
    ctx.restore();
  }

  /** Kleines Oberflächen-Detail (Wangenröte, Nase, Mund, Abzeichen) */
  mark(ctx, head, r, az, el, fn, out = 0.98) {
    const P = this.surf(head, r, az, el, out);
    if (P.v < 0.05) return;
    ctx.save();
    fn(ctx, P, rigClamp(P.v * 1.2, 0.3, 1), this.s);
    ctx.restore();
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
        const ax = { x: this.rx * r * sx * s, y: this.ry * r * sx * RIG_TILT * s };
        const az = { x: this.fx * r * sz * s, y: this.fy * r * sz * RIG_TILT * s };
        return { ax, az };
      };
      const rT = ring(rt);
      const rB = ring(rb);
      const N = 20;
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
    const N = 36;
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
export function rigSurfPt(center, r, az, el) {
  const ce = Math.cos(el);
  return {
    x: center.x + Math.sin(az) * ce * r,
    y: center.y + Math.sin(el) * r,
    z: center.z + Math.cos(az) * ce * r
  };
}

/** Konvexe Hülle (Andrew's Monotone Chain) für Bildschirmpunkte */
export function rigHull(points) {
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
export function rigCapsulePath(ctx, ax, ay, bx, by, ra, rb) {
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

export function rigPolyPath(ctx, Ps, smooth, closed) {
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
export function rigBiped(t, o = {}) {
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
export function rigQuad(t, o = {}) {
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
export function rigChain(t, base, dir, o = {}) {
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
export function rigSerpent(t, o = {}) {
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
export function rigAttackPhase(state, time, opts = {}) {
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
export function rigSwingValue(ap) {
  if (ap.phase === 'windup') return -rigEaseInOut(ap.p);
  if (ap.phase === 'strike') {
    const p = ap.p;
    if (p < 0.25) return -1 + rigEaseOut(p / 0.25) * 2;      // schneller Schlag
    return 1 - rigEaseInOut((p - 0.25) / 0.75);             // langsames Zurückfedern
  }
  return 0;
}

/** Wiederverwendbare Rig-Instanz (Zeichnen ist synchron, daher reicht eine) */
export const RIG = new SkelRig();
