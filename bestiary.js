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
export function drawPaperShadow(ctx, cx, cy, rx, ry, alpha = 0.28) {
  ctx.save();
  ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Zeichnet ausdrucksstarke Ghibli-Anime-Augen mit Glanzpunkten und Wangen-Rouge */
export function drawGhibliEyes(ctx, lx, rx, y, r, dx = 0, dy = 0, isBlinking = false, blush = true) {
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
export function drawPorcelainMask(ctx, cx, cy, w, h, style = 'fox') {
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
export function drawKodama(ctx, x, y, tilt = 0, scale = 1) {
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
export function drawSootSprite(ctx, x, y, r, time, holdingCandy = false) {
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
export function drawPaperLantern(ctx, x, y, w, h, time, glowColor = '#f59e0b') {
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
export function drawSakuraPetal(ctx, x, y, rot, scale = 1) {
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
    xpValue: 65,
    stats: { hp: 380, maxHp: 380, atk: 38, spd: 'Schwerfällig', rng: '50px (Flächen-Beben)' },
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
    xpValue: 75,
    stats: { hp: 420, maxHp: 420, atk: 42, spd: 'Langsam', rng: '65px (Eis-Keule)' },
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
    stats: { hp: 50, maxHp: 50, atk: 28, spd: 'Mittel', rng: '150px (Sternschnuppen)' },
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
    scale: 0.70,
    xpValue: 3,
    stats: { hp: 20, maxHp: 20, atk: 8, spd: 'Mittel', rng: '25px (Körper-Platscher)' },
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
    stats: { hp: 95, maxHp: 95, atk: 34, spd: 'Mittel', rng: '60px (Doppelklingen-Wirbel)' },
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
    xpValue: 70,
    stats: { hp: 360, maxHp: 360, atk: 40, spd: 'Schwebend Schnell', rng: '160px (Kosmischer Strahl)' },
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
    stats: { hp: 55, maxHp: 50, atk: 22, spd: 'Stationär', rng: '50px (Peitschenhieb)' },
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
    stats: { hp: 80, maxHp: 80, atk: 30, spd: 'Sehr Schnell (Fliegend)', rng: '110px (Windklingen-Fächer)' },
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
