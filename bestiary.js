/**
 * Ocarina of Brawls - Bestiarium & Monster-Handbuch
 * 20 detaillierte, prozedural animierte Gegner-Modelle
 */

export const BESTIARY_DATA = [
  // =========================================================================
  // 1. FERNKAMPF (RANGE)
  // =========================================================================
  {
    id: 'moss_archer',
    name: 'Waldläufer-Schütze',
    title: 'Moss Archer',
    category: 'range',
    categoryName: '🏹 Fernkampf',
    biome: 'Grasland / Dichter Wald',
    biomeBadge: 'Grasland',
    badgeClass: 'badge-grass',
    variants: ['Waldgrün (Standard)', 'Wüstensand (Ockergelb)', 'Schneetarn (Polarweiß)'],
    stats: { hp: 45, maxHp: 50, atk: 18, spd: 'Schnell', rng: '180px (Hoch)' },
    behavior: 'Lauert im Unterholz und feuert gezielte Pfeilsalven ab. Nähert sich der Spieler auf unter 35px, weicht er mit einem geschickten Rückwärtssprung ins Dickicht aus.',
    counter: 'Mit dem Schild anrücken, um Pfeile abzuwehren. Dann mit einem schnellen Dash aufschließen und die 3-Hit Schwertkombo ansetzen.',
    lore: 'Verwendet ausgehöhlte Eichelkappen als Pfeilköcher und schläft auf den höchsten Ästen des Geisterwalds.',
    palette: { primary: '#15803d', secondary: '#166534', cloth: '#22c55e', bow: '#854d0e', skin: '#fde047' },
    render(ctx, cx, cy, time, state, hitFlash) {
      const breath = Math.sin(time * 3) * 1.5;
      const isAttacking = state === 'attack';
      const isWalking = state === 'walk';
      const walkCycle = Math.sin(time * 8) * 3;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 18, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hit Flash override
      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Legs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 5, cy + 10, 3, 8 + (isWalking ? walkCycle : 0));
      ctx.fillRect(cx + 2, cy + 10, 3, 8 - (isWalking ? walkCycle : 0));

      // Boots
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 6, cy + 16, 4, 3);
      ctx.fillRect(cx + 2, cy + 16, 4, 3);

      // Body / Leaf Tunic
      ctx.fillStyle = '#166534';
      ctx.fillRect(cx - 7, cy - 2 + breath, 14, 13);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(cx - 5, cy + 1 + breath, 10, 8);

      // Belt & Quiver strap
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 7, cy + 7 + breath, 14, 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx - 2, cy + 6.5 + breath, 4, 3);

      // Quiver on Back with arrows
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 9, cy - 8 + breath, 4, 14);
      ctx.fillStyle = '#f8fafc'; // Arrow feathers
      ctx.fillRect(cx - 10, cy - 12 + breath, 2, 4);
      ctx.fillRect(cx - 7, cy - 11 + breath, 2, 4);

      // Head & Hood
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(cx, cy - 7 + breath, 7, 0, Math.PI * 2);
      ctx.fill();

      // Pointy Hood Tip
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 12 + breath);
      ctx.lineTo(cx - 8, cy - 16 + breath);
      ctx.lineTo(cx + 2, cy - 10 + breath);
      ctx.closePath();
      ctx.fill();

      // Face Shadow & Glowing Archer Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 4, cy - 8 + breath, 8, 5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - 2, cy - 7 + breath, 2, 2);
      ctx.fillRect(cx + 2, cy - 7 + breath, 2, 2);

      // Bow & Hands
      const bowPull = isAttacking ? Math.sin(time * 12) * 4 : 0;
      const bowX = cx + 8 + (isAttacking ? 2 : 0);
      const bowY = cy + 2 + breath;

      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(bowX, bowY, 11, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();

      // Bow String
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bowX - 4, bowY - 10);
      ctx.lineTo(bowX - 8 - bowPull, bowY);
      ctx.lineTo(bowX - 4, bowY + 10);
      ctx.stroke();

      // Arrow if attacking
      if (isAttacking) {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(bowX - 8 - bowPull, bowY - 1, 16, 2);
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(bowX + 10, bowY);
        ctx.lineTo(bowX + 6, bowY - 2.5);
        ctx.lineTo(bowX + 6, bowY + 2.5);
        ctx.fill();
      }

      ctx.filter = 'none';
    }
  },

  {
    id: 'spore_spitter',
    name: 'Sporen-Spucker',
    title: 'Spore Spitter',
    category: 'range',
    categoryName: '🏹 Fernkampf',
    biome: 'Sumpf & Pilzgrotten',
    biomeBadge: 'Sumpf',
    badgeClass: 'badge-swamp',
    variants: ['Giftgrün (Standard)', 'Neon-Lila (Tiefsteinhöhle)', 'Gletscherblau (Frostpilz)'],
    stats: { hp: 55, maxHp: 60, atk: 22, spd: 'Langsam', rng: '160px (Bogen)' },
    behavior: 'Pufft rhythmisch Sporenwolken aus. Verschießt parabolische Säuregeschosse, die beim Aufprall 3 Sekunden lang eine ätzende Pfütze hinterlassen.',
    counter: 'Ständig in Bewegung bleiben, um den Flugbahnen auszuweichen. Sobald er nach dem Spucken nachlädt, mit dem Bogen oder Dash attackieren.',
    lore: 'Seine Sporen riechen nach altem feuchtem Pergament, schmecken jedoch überraschend süßlich.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const pulse = Math.sin(time * 4) * 2;
      const isAttacking = state === 'attack';
      const attackSquash = isAttacking ? Math.sin(time * 10) * 3 : 0;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Root Pods / Tentacle feet
      ctx.fillStyle = '#3f2c1d';
      for (let i = -2; i <= 2; i++) {
        const footSway = Math.sin(time * 3 + i) * 2;
        ctx.fillRect(cx + i * 5 - 2, cy + 12 + footSway, 4, 6);
      }

      // Bulbous Stem Body
      ctx.fillStyle = '#831843';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4 - attackSquash, 12 + pulse * 0.5, 12 + attackSquash, 0, 0, Math.PI * 2);
      ctx.fill();

      // Spore Blisters (Glow)
      ctx.fillStyle = '#a21caf';
      ctx.beginPath();
      ctx.arc(cx - 7, cy + 2, 4, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy + 5, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f0abfc';
      ctx.beginPath();
      ctx.arc(cx - 7, cy + 1, 2, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy + 4, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Top Funnel Mouth
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 6);
      ctx.lineTo(cx - 13 - pulse, cy - 14 - attackSquash);
      ctx.lineTo(cx + 13 + pulse, cy - 14 - attackSquash);
      ctx.lineTo(cx + 10, cy - 6);
      ctx.closePath();
      ctx.fill();

      // Glowing Maw Throat
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 14 - attackSquash, 11 + pulse, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bubbling Spore Projectile when attacking
      if (isAttacking) {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(cx, cy - 22 - attackSquash, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#bbf7d0';
        ctx.arc(cx - 1, cy - 23 - attackSquash, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 2. GROSSE MONSTER / TANKS
  // =========================================================================
  {
    id: 'boulder_troll',
    name: 'Fels-Troll',
    title: 'Boulder Troll',
    category: 'boss',
    categoryName: '👹 Tanks & Trolle',
    biome: 'Gebirge & Höhlenwände',
    biomeBadge: 'Höhlen',
    badgeClass: 'badge-caves',
    variants: ['Moosfels (Standard)', 'Wüsten-Lehm (Sandrot)', 'Frost-Granit (Gletschergrau)'],
    stats: { hp: 120, maxHp: 120, atk: 35, spd: 'Sehr Langsam', rng: '55px (Smash)' },
    behavior: 'Monumentale Silhouette mit verheerendem Boden-Smash. Sein Keulenhieb erzeugt eine ringförmige Schockwelle, die Spieler-Schilde bei direktem Treffer sofort zerbricht!',
    counter: 'Während des extrem langsamen Ausholens per Dash hinter ihn gelangen und den aufgeladenen Wirbelangriff zünden.',
    lore: 'Schläft oft jahrelang regungslos im Sitzen und wird von Vögeln für einen normalen Felsen gehalten.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const breath = Math.sin(time * 2) * 1.5;
      const isAttacking = state === 'attack';
      const armLift = isAttacking ? -16 : Math.sin(time * 3) * 2;

      // Big heavy shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 22, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Thick Stumpy Rock Legs
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 14, cy + 12, 10, 12);
      ctx.fillRect(cx + 4, cy + 12, 10, 12);

      // Massive Torso / Rock Slab
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(cx - 18, cy - 10 + breath, 36, 26, 6);
      ctx.fill();

      // Moss Overgrowth on shoulders
      ctx.fillStyle = '#15803d';
      ctx.fillRect(cx - 18, cy - 10 + breath, 12, 5);
      ctx.fillRect(cx + 6, cy - 10 + breath, 12, 5);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(cx - 15, cy - 8 + breath, 5, 2);

      // Craggy Head & Jaw
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 8, cy - 18 + breath, 16, 12);
      // Glowing Amber Eyes
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - 5, cy - 14 + breath, 3, 2);
      ctx.fillRect(cx + 2, cy - 14 + breath, 3, 2);
      // Underbite Tusks
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(cx - 6, cy - 9 + breath, 2, 4);
      ctx.fillRect(cx + 4, cy - 9 + breath, 2, 4);

      // Huge Club Hand
      const clubX = cx + 22;
      const clubY = cy + armLift + breath;

      // Arm
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx + 12, cy - 4 + armLift + breath, 10, 8);

      // Club Handle & Stone Head
      ctx.fillStyle = '#78350f';
      ctx.fillRect(clubX - 2, clubY - 14, 4, 32);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(clubX - 7, clubY - 22, 14, 16, 3);
      ctx.fill();
      // Spikes on club
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(clubX - 9, clubY - 18, 2, 3);
      ctx.fillRect(clubX + 7, clubY - 18, 2, 3);
      ctx.fillRect(clubX - 2, clubY - 24, 4, 2);

      ctx.filter = 'none';
    }
  },

  {
    id: 'frost_golem',
    name: 'Frost-Gigant (Yeti)',
    title: 'Frost Golem / Yeti',
    category: 'boss',
    categoryName: '👹 Tanks & Trolle',
    biome: 'Tundra & Schneegipfel',
    biomeBadge: 'Schnee',
    badgeClass: 'badge-snow',
    variants: ['Arktisweiß (Standard)', 'Gletscherblau', 'Höhlenschiefer (Dunkel)'],
    stats: { hp: 110, maxHp: 110, atk: 30, spd: 'Mittel', rng: '50px (Frost-Aura)' },
    behavior: 'Stößt eine Frostwolke aus und führt einen Zweihand-Stampfer aus. Getroffene Spieler erleiden Frostbite (Bewegungstempo für 1.5s halbiert).',
    counter: 'Mit Dash aus der Stampfzone entkommen. Auf Distanz mit Bogenpfeilen zermürben oder hinter ihn gelangen.',
    lore: 'Seine Körpertemperatur ist so niedrig, dass herabfallender Schnee sofort zu dicken Eispanzerplatten gefriert.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const sway = Math.sin(time * 2.5) * 2;
      const isAttacking = state === 'attack';

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 22, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Thick Yeti Legs
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(cx - 12, cy + 10, 8, 12);
      ctx.fillRect(cx + 4, cy + 10, 8, 12);

      // Fluffy Shaggy Body
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(cx - 16, cy - 12 + sway * 0.5, 32, 26, 8);
      ctx.fill();

      // Ice Crystals on Back
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy - 12);
      ctx.lineTo(cx - 15, cy - 24);
      ctx.lineTo(cx - 7, cy - 12);
      ctx.moveTo(cx + 7, cy - 12);
      ctx.lineTo(cx + 15, cy - 24);
      ctx.lineTo(cx + 12, cy - 12);
      ctx.fill();

      // Face Mask (Cold blue skin)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(cx - 7, cy - 16 + sway * 0.5, 14, 10);

      // Cyan Glowing Eyes
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(cx - 5, cy - 13 + sway * 0.5, 3, 2);
      ctx.fillRect(cx + 2, cy - 13 + sway * 0.5, 3, 2);

      // Massive Claws
      const slamY = isAttacking ? 10 : 0;
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx - 20, cy - 2 + slamY, 7, 14);
      ctx.fillRect(cx + 13, cy - 2 + slamY, 7, 14);

      // Ice particle aura
      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.fillRect(cx + Math.sin(time * 5) * 16, cy - 5 + Math.cos(time * 4) * 12, 2, 2);
      ctx.fillRect(cx - Math.cos(time * 6) * 14, cy + Math.sin(time * 4) * 10, 2, 2);

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 3. SCHLANGEN & REPTILIEN (SINUS-SCHLÄNGELN)
  // =========================================================================
  {
    id: 'slithering_viper',
    name: 'Smaragd-Natter',
    title: 'Slithering Viper',
    category: 'reptile',
    categoryName: '🐍 Schlangen',
    biome: 'Sumpf & dichter Wald',
    biomeBadge: 'Sumpf',
    badgeClass: 'badge-swamp',
    variants: ['Smaragdgrün (Standard)', 'Klapperschlange (Wüstenbraun)', 'Albino-Höhlenschlange (Weiß)'],
    stats: { hp: 40, maxHp: 45, atk: 25, spd: 'Extrem Schnell', rng: '32px (Blitzbiss)' },
    behavior: 'Schlängelt sich in flüssigen Sinuswellen mit hoher Geschwindigkeit heran. Rollt sich kurz zusammen und stößt mit blitzartigem Giftbiss vor.',
    counter: 'Im Moment des Vorstoßens seitlich weghüpfen (Dash), um dem linearen Biss auszuweichen, und sofort von der Flanke zuschlagen.',
    lore: 'Ihre Schuppen werfen sich bei jedem Vollmond ab und hinterlassen funkelnde, smaragdgrüne Pergamentstreifen.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const speed = isAttacking ? 10 : 6;
      const numSegments = 7;

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Draw segments from tail to head
      for (let i = numSegments - 1; i >= 0; i--) {
        const segProgress = i / numSegments;
        const wave = Math.sin(time * speed - i * 0.7) * (10 * (1 - segProgress * 0.4));
        const segX = cx - i * 5 + (isAttacking ? 8 : 0);
        const segY = cy + wave;
        const segRadius = 6.5 - segProgress * 3.5;

        // Shadow under each segment
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(segX, segY + 8, segRadius, segRadius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body scales
        ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#22c55e';
        ctx.beginPath();
        ctx.arc(segX, segY, Math.max(2, segRadius), 0, Math.PI * 2);
        ctx.fill();
      }

      // Snake Head (Segment 0)
      const headWave = Math.sin(time * speed) * 6;
      const headX = cx + 8;
      const headY = cy + headWave;

      // Cobra Hood
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.ellipse(headX - 2, headY, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head diamond
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(headX + 8, headY);
      ctx.lineTo(headX - 1, headY - 6);
      ctx.lineTo(headX - 5, headY);
      ctx.lineTo(headX - 1, headY + 6);
      ctx.closePath();
      ctx.fill();

      // Ruby Eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(headX + 2, headY - 4, 2, 2);
      ctx.fillRect(headX + 2, headY + 2, 2, 2);

      // Flicking Forked Tongue
      const tongueOut = (Math.sin(time * 14) > 0.3);
      if (tongueOut || isAttacking) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(headX + 7, headY);
        ctx.lineTo(headX + 13, headY);
        ctx.lineTo(headX + 16, headY - 2);
        ctx.moveTo(headX + 13, headY);
        ctx.lineTo(headX + 16, headY + 2);
        ctx.stroke();
      }

      ctx.filter = 'none';
    }
  },

  {
    id: 'dune_maw',
    name: 'Wüsten-Sandwurm',
    title: 'Dune Maw',
    category: 'reptile',
    categoryName: '🐍 Schlangen',
    biome: 'Wüsten-Dünen',
    biomeBadge: 'Wüste',
    badgeClass: 'badge-desert',
    variants: ['Dünensand (Standard)', 'Schlickwurm (Sumpfgrün)', 'Lavawurm (Magmaschwarz)'],
    stats: { hp: 75, maxHp: 80, atk: 28, spd: 'Mittel', rng: '45px (Hervorbrechen)' },
    behavior: 'Vergräbt sich im Sandmeer. Bricht explosionsartig unter dem Spieler hervor und schnappt mit seinem Ringzahnschlund zu.',
    counter: 'Sobald Sandwirbel am Boden erscheinen, sofort wegdashen! Sein Kopf bleibt nach dem Fehlschlag für 1.5s im Boden stecken – Zeit für freie Schläge.',
    lore: 'Erspürt selbst das leise Trippeln eines Wüstenskorpions über Hunderte Schritte Entfernung.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const emergeY = isAttacking ? Math.sin(time * 6) * 6 : 0;

      // Sand crater base
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Segmented Worm Body rising from sand
      for (let i = 3; i >= 0; i--) {
        const segY = cy + 12 - i * 8 - emergeY;
        const width = 18 - i * 2;
        ctx.fillStyle = i % 2 === 0 ? '#92400e' : '#b45309';
        ctx.beginPath();
        ctx.ellipse(cx, segY, width, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Spiky chitin ridges
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(cx - width + 1, segY - 2, 3, 3);
        ctx.fillRect(cx + width - 4, segY - 2, 3, 3);
      }

      // Gaping Round Maw Head
      const mawY = cy - 18 - emergeY;
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(cx, mawY, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Deep Throat Hole
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(cx, mawY, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Circular Ring of Needle Teeth
      ctx.fillStyle = '#f8fafc';
      const numTeeth = 8;
      for (let t = 0; t < numTeeth; t++) {
        const angle = (t / numTeeth) * Math.PI * 2 + time * 2;
        const tx = cx + Math.cos(angle) * 7;
        const ty = mawY + Math.sin(angle) * 5;
        ctx.fillRect(tx - 1, ty - 1, 2, 2);
      }

      // Sand flying particles
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 16 + Math.sin(time * 7) * 4, cy + 12, 3, 3);
      ctx.fillRect(cx + 14 + Math.cos(time * 8) * 4, cy + 11, 2, 2);

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 4. MAGIER & ZAUBERWIRKER
  // =========================================================================
  {
    id: 'pyromancer',
    name: 'Flammen-Kultist',
    title: 'Pyromancer',
    category: 'mage',
    categoryName: '🔮 Magier',
    biome: 'Höhlen & Alte Ruinen',
    biomeBadge: 'Höhlen',
    badgeClass: 'badge-caves',
    variants: ['Feuerrot (Standard)', 'Frostblau (Eismagier)', 'Schatten-Violett (Nekromant)'],
    stats: { hp: 50, maxHp: 55, atk: 26, spd: 'Mittel', rng: '150px (Zauber)' },
    behavior: 'Schwebt über dem Boden und kanalisiert zielsuchende Feuerbälle. Teleportiert sich bei Nahkampftreffern in einer Rauchwolke 60px nach hinten.',
    counter: 'Mit Bogenpfeilen aus der Ferne unterbrechen, oder seinen Teleport-Rauch abpassen und sofort hinterherdashen.',
    lore: 'Trägt stets eine kleine Teekanne unter der Kutte – so hat er auch in feuchten Höhlen immer kochendes Teewasser parat.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const floatY = Math.sin(time * 3.5) * 3;
      const isAttacking = state === 'attack';

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 18, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Floating Tattered Robe
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy + 14 + floatY);
      ctx.lineTo(cx - 6, cy - 6 + floatY);
      ctx.lineTo(cx + 6, cy - 6 + floatY);
      ctx.lineTo(cx + 9, cy + 14 + floatY);
      ctx.closePath();
      ctx.fill();

      // Flame Trim
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(cx - 7, cy + 10 + floatY, 14, 3);

      // Deep Hood
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(cx, cy - 8 + floatY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Eyes in Dark Hood
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 4, cy - 9 + floatY, 8, 4);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx - 3, cy - 8 + floatY, 2, 2);
      ctx.fillRect(cx + 1, cy - 8 + floatY, 2, 2);

      // Magic Staff with Floating Flame Core
      const staffX = cx + 12;
      const staffY = cy + floatY;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(staffX - 1.5, staffY - 14, 3, 26);

      // Fire Core on staff
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(staffX, staffY - 16, 5 + Math.sin(time * 8) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(staffX, staffY - 16, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Circling Fire Orbs when attacking
      if (isAttacking) {
        for (let i = 0; i < 3; i++) {
          const oAngle = time * 7 + (i * Math.PI * 2 / 3);
          const ox = cx + Math.cos(oAngle) * 16;
          const oy = cy - 6 + floatY + Math.sin(oAngle) * 8;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.filter = 'none';
    }
  },

  {
    id: 'star_astromancer',
    name: 'Wolken-Astrologe',
    title: 'Star Astromancer',
    category: 'mage',
    categoryName: '🔮 Magier',
    biome: 'Wolkenreich & Himmelsaltäre',
    biomeBadge: 'Wolken',
    badgeClass: 'badge-clouds',
    variants: ['Sternenblau & Gold (Standard)', 'Dämmerungs-Rosa', 'Nacht-Azur'],
    stats: { hp: 60, maxHp: 65, atk: 24, spd: 'Mittel', rng: '170px (Lichtstrahl)' },
    behavior: 'Kanalisiert vertikale Lichtstrahlen aus den Sternen mit kurzem optischen Warnkegel am Boden. Schirmt sich kurz mit einer goldenen Barriere ab.',
    counter: 'Vor dem Lichtstrahl seitlich aus der Zielmarkierung sprinten und seine Schild-Pausen für Vorstöße nutzen.',
    lore: 'Behauptet, in den Wolkenformationen die Zukunft zu lesen – meist sieht er aber bloß Regen voraus.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const floatY = Math.sin(time * 2.5) * 4;
      const isAttacking = state === 'attack';

      // Soft Cloud Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 18, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Flowing Celestial Robe
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 14 + floatY);
      ctx.lineTo(cx - 6, cy - 6 + floatY);
      ctx.lineTo(cx + 6, cy - 6 + floatY);
      ctx.lineTo(cx + 10, cy + 14 + floatY);
      ctx.closePath();
      ctx.fill();

      // Golden Starmap Hem
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx - 8, cy + 11 + floatY, 16, 2);

      // Astrologer Mask & Hood
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.arc(cx, cy - 8 + floatY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Golden Sun Crown Crest
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 14 + floatY);
      ctx.lineTo(cx, cy - 20 + floatY);
      ctx.lineTo(cx + 5, cy - 14 + floatY);
      ctx.fill();

      // Constellation Orb Hand
      const orbX = cx - 12;
      const orbY = cy - 4 + floatY;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Glowing Center Star
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(orbX - 1.5, orbY - 1.5, 3, 3);

      // Star Ray Beacon when attacking
      if (isAttacking) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.fillRect(cx - 12, cy - 35, 24, 30);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(cx - 2, cy - 35, 4, 30);
      }

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 5. BLOBS & SLIMES
  // =========================================================================
  {
    id: 'green_slime',
    name: 'Wald-Blob (Green Slime)',
    title: 'Green Slime',
    category: 'blob',
    categoryName: '🟢 Blobs',
    biome: 'Grasland & Wiesen',
    biomeBadge: 'Grasland',
    badgeClass: 'badge-grass',
    variants: ['Giftgrün (Standard)', 'Gletscherblau (Schnee)', 'Sonnengelb (Wüste)'],
    stats: { hp: 35, maxHp: 40, atk: 15, spd: 'Hüpfend', rng: '25px (Kontakt)' },
    behavior: 'Hüpft rhythmisch mit federnder Stauch-Physik. Wird er besiegt, teilt er sich in 2 flinke Mini-Blobs mit jeweils halber Lebensenergie!',
    counter: 'Mit dem Rundum-Wirbelangriff oder einem präzisen Pfeilschuss beide Spaltlinge gleichzeitig ausschalten.',
    lore: 'Hinterlässt eine Spur, die nach Waldmeister riecht und von Schrein-Mönchen als Buchkleister geschätzt wird.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const hopCycle = Math.abs(Math.sin(time * 4));
      const hopY = hopCycle * 14;
      const squashX = (1 - hopCycle) * 4;
      const squashY = hopCycle * 4;
      const isAttacking = state === 'attack';

      // Shadow contracts as blob hops high
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 14, 12 - hopCycle * 4, 4 - hopCycle * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      const blobY = cy + 6 - hopY;
      const rx = 12 + squashX - squashY * 0.5;
      const ry = 10 - squashX * 0.5 + squashY;

      // Outer Jelly
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(cx, blobY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner Core Glow
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.ellipse(cx, blobY + 1, rx * 0.7, ry * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bubble highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(cx - rx * 0.4, blobY - ry * 0.4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Cute Cartoon Eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx - 4, blobY - 1, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 4, blobY - 1, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 5, blobY - 2, 1.5, 1.5);
      ctx.fillRect(cx + 3, blobY - 2, 1.5, 1.5);

      // Mini split blobs on attack preview
      if (isAttacking) {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(cx - 16, cy + 10, 5, 0, Math.PI * 2);
        ctx.arc(cx + 16, cy + 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.filter = 'none';
    }
  },

  {
    id: 'tar_mire',
    name: 'Teer-Schlamm (Tar Blob)',
    title: 'Tar Mire',
    category: 'blob',
    categoryName: '🟢 Blobs',
    biome: 'Sumpf & Moorböden',
    biomeBadge: 'Sumpf',
    badgeClass: 'badge-swamp',
    variants: ['Pechschwarz (Standard)', 'Giftgelb (Schwefelteer)', 'Rostrot'],
    stats: { hp: 65, maxHp: 70, atk: 18, spd: 'Sehr Langsam', rng: '35px (Kleb-Pfütze)' },
    behavior: 'Platzt bei Bedrängnis auf und verteilt klebrigen Teer. Spieler in der Teerspur können 2.5s lang nicht dashen und bewegen sich 40% langsamer.',
    counter: 'Niemals hineintreten! Aus der Entfernung mit Pfeilen erledigen oder per Wirbelangriff aus sicherem Radius bekämpfen.',
    lore: 'Alte Schätze und Waffen, die er im Laufe der Jahrhunderte verschluckt hat, bleiben in seinem sauerstofffreien Kern makellos erhalten.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const bubble = Math.sin(time * 5) * 2;
      const isAttacking = state === 'attack';

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 14, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Viscous Oozing Mound
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 8, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tar Drips & Tendrils
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.arc(cx - 6, cy + 3 + bubble, 6, 0, Math.PI * 2);
      ctx.arc(cx + 5, cy + 4 - bubble, 5, 0, Math.PI * 2);
      ctx.fill();

      // Trapped Skull inside tar
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx - 2, cy + 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx - 3, cy + 4, 1.5, 1.5);
      ctx.fillRect(cx, cy + 4, 1.5, 1.5);

      // Yellow Sludge Gas Bubbles
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(cx + 6, cy + 1 + bubble, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Splatter particles when attacking
      if (isAttacking) {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(cx - 16, cy + 6, 4, 4);
        ctx.fillRect(cx + 14, cy + 8, 3, 3);
      }

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 6. WILDTIERE
  // =========================================================================
  {
    id: 'dire_wolf',
    name: 'Schattenwolf',
    title: 'Dire Wolf',
    category: 'beast',
    categoryName: '🐺 Wildtiere',
    biome: 'Wald & Schneeregionen',
    biomeBadge: 'Grasland',
    badgeClass: 'badge-grass',
    variants: ['Silbergrau (Standard)', 'Schneeweiß (Polrwolf)', 'Nachtschwarz (Alpha)'],
    stats: { hp: 50, maxHp: 55, atk: 26, spd: 'Sehr Schnell', rng: '40px (Sprungangriff)' },
    behavior: 'Umkreist den Spieler in sicherem Abstand, duckt sich tief und führt einen plötzlichen, weiten Hechtsprung-Angriff mit kräftigem Biss aus.',
    counter: 'Genau im Moment des Hechtsprungs den Schild hochreißen: Der Wolf prallt ab und ist für 1.2s benommen.',
    lore: 'Sein Heulen hallt bei Nacht noch im Nachbarbiom wider und versetzt die kleinen Kodama-Waldgeister in helle Aufregung.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isWalking = state === 'walk';
      const isAttacking = state === 'attack';
      const tailWag = Math.sin(time * 6) * 3;
      const legRun = Math.sin(time * 10) * 3;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 15, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Four Legs
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 10, cy + 8, 3, 8 + (isWalking ? legRun : 0));
      ctx.fillRect(cx - 5, cy + 8, 3, 8 - (isWalking ? legRun : 0));
      ctx.fillRect(cx + 4, cy + 8, 3, 8 + (isWalking ? -legRun : 0));
      ctx.fillRect(cx + 9, cy + 8, 3, 8 - (isWalking ? -legRun : 0));

      // Wolf Body
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(cx - 12, cy - 2, 22, 12, 4);
      ctx.fill();

      // Bushy Tail
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy);
      ctx.lineTo(cx - 20, cy - 6 + tailWag);
      ctx.lineTo(cx - 18, cy + 2 + tailWag);
      ctx.closePath();
      ctx.fill();

      // Fur Ruff Neck
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(cx + 8, cy - 2, 6, 0, Math.PI * 2);
      ctx.fill();

      // Snout & Head
      const headLunge = isAttacking ? 4 : 0;
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx + 8 + headLunge, cy - 8, 9, 8);
      ctx.fillRect(cx + 14 + headLunge, cy - 5, 5, 5); // Snout

      // Pointy Ears
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(cx + 8 + headLunge, cy - 8);
      ctx.lineTo(cx + 10 + headLunge, cy - 14);
      ctx.lineTo(cx + 13 + headLunge, cy - 8);
      ctx.fill();

      // Glowing Amber Eye
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx + 11 + headLunge, cy - 7, 2, 2);

      // Fangs
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx + 15 + headLunge, cy - 1, 2, 2.5);

      ctx.filter = 'none';
    }
  },

  {
    id: 'emperor_scorpion',
    name: 'Kaiser-Skorpion',
    title: 'Emperor Scorpion',
    category: 'beast',
    categoryName: '🐺 Wildtiere',
    biome: 'Wüstenkanten & Höhlen',
    biomeBadge: 'Wüste',
    badgeClass: 'badge-desert',
    variants: ['Sandocker (Standard)', 'Obsidian-Schwarz (Lavahöhlen)', 'Jade-Grün'],
    stats: { hp: 70, maxHp: 75, atk: 28, spd: 'Mittel', rng: '42px (Stachel)' },
    behavior: 'Hält zwei wuchtige Panzerscheren schützend vor sich (frontale Schwerthiebe prallen wirkungslos ab). Sticht überraschend über die Deckung hinweg zu.',
    counter: 'Mit Dash hinter seinen Rücken springen, um den weichen Chitin-Hinterleib zu treffen, oder mit aufgeladenem Wirbelangriff die Deckung brechen.',
    lore: 'Sein Rückenpanzer ist so dicht und feuerfest, dass Wüstenwanderer verlassene Hüllen als Kochtöpfe nutzen.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const tailSway = Math.sin(time * 3) * 3;
      const clawSnap = state === 'attack' ? Math.sin(time * 12) * 3 : 0;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 14, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // 6 Spider-like legs
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 5, cy + 6);
        ctx.lineTo(cx + i * 7 - 6, cy + 14);
        ctx.moveTo(cx + i * 5, cy + 6);
        ctx.lineTo(cx + i * 7 + 6, cy + 14);
        ctx.stroke();
      }

      // Hard Chitin Carapace
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Front Pincers (Shielding)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx + 7, cy - 2, 8, 5);
      ctx.fillRect(cx + 7, cy + 5, 8, 5);

      // Pincer Claws
      ctx.fillStyle = '#b45309';
      ctx.fillRect(cx + 14 + clawSnap, cy - 4, 5, 4);
      ctx.fillRect(cx + 14 + clawSnap, cy + 7, 5, 4);

      // Arched Segmented Tail curving over back
      ctx.fillStyle = '#78350f';
      for (let s = 0; s < 5; s++) {
        const sx = cx - 6 - s * 3 + s * s * 0.4;
        const sy = cy - s * 4 + tailSway * (s / 5);
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5 - s * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stinger Barb with dripping poison
      const stingerX = cx - 1;
      const stingerY = cy - 18 + tailSway;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(stingerX - 3, stingerY);
      ctx.lineTo(stingerX + 5, stingerY);
      ctx.lineTo(stingerX + 1, stingerY - 5);
      ctx.closePath();
      ctx.fill();

      // Green venom drop
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(stingerX + 2, stingerY - 6, 2, 2);

      ctx.filter = 'none';
    }
  },

  {
    id: 'tusk_boar',
    name: 'Grasland-Wildschwein',
    title: 'Tusk Boar',
    category: 'beast',
    categoryName: '🐺 Wildtiere',
    biome: 'Grasland & Eichenhaine',
    biomeBadge: 'Grasland',
    badgeClass: 'badge-grass',
    variants: ['Borstenbraun (Standard)', 'Frostborste (Schneebiom)', 'Schwarzschwein'],
    stats: { hp: 65, maxHp: 70, atk: 24, spd: 'Stürmend', rng: '35px (Ansturm)' },
    behavior: 'Scharrt 1s drohend mit den Vorderhufen und prescht in gerader Linie unaufhaltsam vor. Rammt es gegen Felsen oder Bäume, ist es 2 Sekunden betäubt.',
    counter: 'Im allerletzten Moment vor dem Einschlag zur Seite springen (Dash) und das betäubte Tier von hinten attackieren.',
    lore: 'Besitzt eine unbezwingbare Schwäche für rote Waldpilze und pflügt auf der Suche danach ganze Wiesen um.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const pawGround = isAttacking ? Math.sin(time * 12) * 2 : 0;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Stubby Legs
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(cx - 10, cy + 10, 4, 7);
      ctx.fillRect(cx - 3, cy + 10, 4, 7);
      ctx.fillRect(cx + 6, cy + 10 + pawGround, 4, 7);

      // Heavy Barrel Body
      ctx.fillStyle = '#5d4037';
      ctx.beginPath();
      ctx.roundRect(cx - 14, cy - 2, 24, 14, 5);
      ctx.fill();

      // Bristle Ridge
      ctx.fillStyle = '#3e2723';
      for (let b = -12; b <= 6; b += 3) {
        ctx.fillRect(cx + b, cy - 5, 2, 3);
      }

      // Snout & Head
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(cx + 8, cy - 2, 10, 9);
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(cx + 16, cy, 3, 5); // Pinkish snout disk

      // Curved Ivory Tusks
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy + 6);
      ctx.lineTo(cx + 18, cy - 1);
      ctx.lineTo(cx + 15, cy + 2);
      ctx.closePath();
      ctx.fill();

      // Steam puffs when angry/attacking
      if (isAttacking) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(cx + 20, cy - 3, 3, 3);
        ctx.fillRect(cx + 23, cy - 5, 2, 2);
      }

      ctx.filter = 'none';
    }
  },

  {
    id: 'cave_weaver',
    name: 'Höhlen-Krallenspinne',
    title: 'Cave Weaver',
    category: 'beast',
    categoryName: '🐺 Wildtiere',
    biome: 'Dunkle Höhlen & Klüfte',
    biomeBadge: 'Höhlen',
    badgeClass: 'badge-caves',
    variants: ['Schiefergrau (Standard)', 'Kristall-Cyan (Kristallhöhle)', 'Lava-Glimm'],
    stats: { hp: 45, maxHp: 50, atk: 20, spd: 'Schnell', rng: '60px (Spinnnetz)' },
    behavior: 'Krabbelt flink über Kanten und Höhlenwände. Schießt klebrige Netzkugeln, die das Bewegungstempo des Spielers für 2s einfrieren.',
    counter: 'Mit dem Schild das Netz abfangen oder ausweichen; im Nahkampf ist ihr Pelzkörper sehr verwundbar.',
    lore: 'Ihre Spinnenseide schimmert im Dunkeln schwach blau und wird von Höhlenforschern als Orientierungsfaden genutzt.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const legCycle = Math.sin(time * 8) * 3;
      const isAttacking = state === 'attack';

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 14, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // 8 Jointed Legs
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const lOffset = (i % 2 === 0 ? legCycle : -legCycle);
        // Left legs
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy + 2);
        ctx.lineTo(cx - 10, cy - 2 + i * 4 + lOffset);
        ctx.lineTo(cx - 18, cy + 12 + i * 2);
        ctx.stroke();

        // Right legs
        ctx.beginPath();
        ctx.moveTo(cx + 2, cy + 2);
        ctx.lineTo(cx + 10, cy - 2 + i * 4 - lOffset);
        ctx.lineTo(cx + 18, cy + 12 + i * 2);
        ctx.stroke();
      }

      // Abdomen
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(cx - 6, cy + 2, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cephalothorax (Head)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx + 4, cy + 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // Multiple Glowing Red Spider Eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx + 6, cy, 2, 2);
      ctx.fillRect(cx + 8, cy + 1, 1.5, 1.5);
      ctx.fillRect(cx + 6, cy + 3, 2, 2);
      ctx.fillRect(cx + 4, cy - 1, 1.5, 1.5);

      // Web projectile if attacking
      if (isAttacking) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 14, cy, 8, 8);
      }

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 7. FIESE KREATUREN DER LEERENWELT (VOID)
  // =========================================================================
  {
    id: 'void_reaper',
    name: 'Leeren-Verschlinger',
    title: 'Void Reaper',
    category: 'void',
    categoryName: '🌌 Leerenwelt',
    biome: 'Leeren-Abgründe & Void-Seen',
    biomeBadge: 'Void',
    badgeClass: 'badge-void',
    variants: ['Albtraum-Violett (Standard)', 'Astral-Schwarz', 'Blutrot (Blutmond)'],
    stats: { hp: 85, maxHp: 90, atk: 38, spd: 'Teleportierend', rng: '45px (Doppelschnitt)' },
    behavior: 'Löst sich in schwarzen Rauch auf und materialisiert sich 0.4s später blitzschnell DIREKT IM RÜCKEN des Spielers für einen vernichtenden Doppelsensen-Schlag!',
    counter: 'Sobald er verpufft, sofort vorwärts dashen, um seinem Rückenschlag zu entgehen, und sich mit einem Wirbelangriff umdrehen.',
    lore: 'Entsteht aus verlorenen Gedanken derjenigen Abenteurer, die zu lange in den ewigen Sternenabgrund geblickt haben.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const floatY = Math.sin(time * 3) * 4;
      const isAttacking = state === 'attack';

      // Dark Void Rift Shadow
      ctx.fillStyle = 'rgba(147, 51, 234, 0.3)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 20, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Tattered Shroud of Nothingness
      ctx.fillStyle = '#0f051d';
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 16 + floatY);
      ctx.lineTo(cx - 8, cy - 8 + floatY);
      ctx.lineTo(cx + 8, cy - 8 + floatY);
      ctx.lineTo(cx + 10, cy + 16 + floatY);
      ctx.lineTo(cx + 4, cy + 12 + floatY);
      ctx.lineTo(cx, cy + 18 + floatY);
      ctx.lineTo(cx - 5, cy + 11 + floatY);
      ctx.closePath();
      ctx.fill();

      // Cosmic Violet Aura Ribbons
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy + floatY, 14, -Math.PI * 0.7, Math.PI * 0.3);
      ctx.stroke();

      // Empty Abyss Hood
      ctx.fillStyle = '#1e0836';
      ctx.beginPath();
      ctx.arc(cx, cy - 10 + floatY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Piercing Cyan Stare in darkness
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(cx - 4, cy - 11 + floatY, 2, 3);
      ctx.fillRect(cx + 2, cy - 11 + floatY, 2, 3);

      // Scythe Blade Arms
      const scytheAngle = isAttacking ? Math.sin(time * 10) * 0.8 : 0;
      ctx.fillStyle = '#a855f7';
      // Left Scythe
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 4 + floatY);
      ctx.quadraticCurveTo(cx - 20, cy - 18 + scytheAngle * 10, cx - 14, cy + 10);
      ctx.fill();
      // Right Scythe
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy - 4 + floatY);
      ctx.quadraticCurveTo(cx + 20, cy - 18 - scytheAngle * 10, cx + 14, cy + 10);
      ctx.fill();

      ctx.filter = 'none';
    }
  },

  {
    id: 'gazer_void',
    name: 'Auge des Abgrunds',
    title: 'Gazer of the Void',
    category: 'void',
    categoryName: '🌌 Leerenwelt',
    biome: 'Leeren-Inseln & Kosmische Risse',
    biomeBadge: 'Void',
    badgeClass: 'badge-void',
    variants: ['Abyss-Lila (Standard)', 'Blutauge (Rot)', 'Smaragd-Seher (Grün)'],
    stats: { hp: 65, maxHp: 70, atk: 32, spd: 'Schwebend', rng: '200px (Todesstrahl)' },
    behavior: 'Schwebt lautlos über dem Abgrund. Visiert den Spieler an und feuert nach 1.2s Aufladezeit einen kontinuierlichen, alles durchdringenden Todesstrahl.',
    counter: 'Während des Ladevorgangs um ihn herumkreisen (der Strahl dreht sich nur träge mit) und Pfeile direkt in die ungeschützte Pupille schießen.',
    lore: 'Blinzelt niemals freiwillig. Wer ihm zu tief ins Auge blickt, hört das Flüstern vergessener Götter.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const floatY = Math.sin(time * 2.8) * 3;
      const isAttacking = state === 'attack';

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 18, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // 4 Writhing Nerve Tentacles
      ctx.strokeStyle = '#581c87';
      ctx.lineWidth = 2;
      for (let t = 0; t < 4; t++) {
        const tWave = Math.sin(time * 5 + t) * 4;
        ctx.beginPath();
        ctx.moveTo(cx - 6 + t * 4, cy + 8 + floatY);
        ctx.lineTo(cx - 10 + t * 6 + tWave, cy + 16 + floatY);
        ctx.stroke();
      }

      // Giant Fleshy Eyeball
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.arc(cx, cy + floatY, 13, 0, Math.PI * 2);
      ctx.fill();

      // Bloodshot Veins
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy - 4 + floatY);
      ctx.lineTo(cx - 5, cy + floatY);
      ctx.moveTo(cx + 11, cy + 4 + floatY);
      ctx.lineTo(cx + 6, cy + floatY);
      ctx.stroke();

      // Iris (Violet)
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.arc(cx + Math.sin(time) * 2, cy + floatY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Slit Pupil
      const pupilExpand = isAttacking ? 2 : 0;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(cx + Math.sin(time) * 2, cy + floatY, 2 + pupilExpand, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Death Ray Laser when attacking
      if (isAttacking) {
        ctx.fillStyle = 'rgba(192, 132, 252, 0.65)';
        ctx.fillRect(cx + 6, cy - 3 + floatY, 35, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx + 6, cy - 1 + floatY, 35, 2);
      }

      ctx.filter = 'none';
    }
  },

  {
    id: 'abyss_tentacle',
    name: 'Schatten-Tentakel',
    title: 'Abyss Tentacle',
    category: 'void',
    categoryName: '🌌 Leerenwelt',
    biome: 'Leeren-Risse & Sumpflöcher',
    biomeBadge: 'Void',
    badgeClass: 'badge-void',
    variants: ['Abyss-Violett (Standard)', 'Sumpf-Grün', 'Lava-Glimm'],
    stats: { hp: 55, maxHp: 60, atk: 26, spd: 'Stationär', rng: '50px (Peitschenhieb)' },
    behavior: 'Bricht überraschend aus Bodenrissen hervor. Peitscht im weiten 180°-Radius über das Spielfeld und zieht den Spieler bei Kontakt an den Riss heran.',
    counter: 'Den Peitschenschwung per Dash überspringen und die Basis des Tentakels mit schnellen Schwerthieben abtrennen.',
    lore: 'Niemand weiß, wie gigantisch die Kreatur im Kern der Welt ist, zu der all diese Tentakel gehören.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const whip = Math.sin(time * 4) * 8;
      const isAttacking = state === 'attack';
      const attackWhip = isAttacking ? Math.sin(time * 12) * 14 : whip;

      // Dark Ground Rift Hole
      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f051d';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Curved Muscular Tentacle
      ctx.strokeStyle = '#7e22ce';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 14);
      ctx.quadraticCurveTo(cx + attackWhip * 0.6, cy, cx + attackWhip, cy - 18);
      ctx.stroke();

      // Inner Highlight
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 14);
      ctx.quadraticCurveTo(cx + attackWhip * 0.6, cy, cx + attackWhip, cy - 18);
      ctx.stroke();

      // Glowing Neon Suction Cups
      ctx.fillStyle = '#f0abfc';
      for (let s = 0; s < 4; s++) {
        const sx = cx + attackWhip * (s / 4) + 4;
        const sy = cy + 10 - s * 8;
        ctx.fillRect(sx, sy, 3, 3);
      }

      ctx.filter = 'none';
    }
  },

  // =========================================================================
  // 8. ELITE, HIMMEL & ELEMENTARE
  // =========================================================================
  {
    id: 'paper_knight',
    name: 'Dunkler Pergament-Ritter',
    title: 'Cursed Paper Knight',
    category: 'elite',
    categoryName: '⚔️ Elite & Elementare',
    biome: 'Alte Schreine & Tempelhallen',
    biomeBadge: 'Höhlen',
    badgeClass: 'badge-caves',
    variants: ['Karton-Schwarz (Standard)', 'Rost-Rot', 'Kaiser-Gold'],
    stats: { hp: 95, maxHp: 100, atk: 32, spd: 'Mittel', rng: '45px (Katana)' },
    behavior: 'Meisterlicher Fechter. Blockiert normale Spielerschläge mit seinem Falzschild unter hellem Funkenregen und kontert sofort mit einem Ausfallstich.',
    counter: 'Seine Haltung kann nur durch einen voll aufgeladenen Wirbelangriff oder wiederholte Pfeiltreffer aus der Distanz durchbrochen werden.',
    lore: 'Wurde vor Jahrtausenden gefaltet, um die uralten Schreine zu bewachen, und hat seitdem keinen Millimeter nachgegeben.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const breathe = Math.sin(time * 3) * 1.5;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 18, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Greaves / Legs
      ctx.fillStyle = '#18181b';
      ctx.fillRect(cx - 7, cy + 8, 5, 10);
      ctx.fillRect(cx + 2, cy + 8, 5, 10);

      // Folded Plate Armor
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.roundRect(cx - 10, cy - 6 + breathe, 20, 16, 3);
      ctx.fill();

      // Red Sash
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - 9, cy + 5 + breathe, 18, 2.5);

      // Kabuto Helmet
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx - 7, cy - 16 + breathe, 14, 11);

      // Golden Horn Crest
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 16 + breathe);
      ctx.lineTo(cx - 8, cy - 23 + breathe);
      ctx.lineTo(cx, cy - 19 + breathe);
      ctx.lineTo(cx + 8, cy - 23 + breathe);
      ctx.closePath();
      ctx.fill();

      // Katana Blade
      const slashAngle = isAttacking ? Math.sin(time * 12) * 25 : -10;
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy + breathe);
      ctx.lineTo(cx + 22, cy - 14 + slashAngle + breathe);
      ctx.stroke();

      // Shield on left arm
      ctx.fillStyle = '#71717a';
      ctx.fillRect(cx - 14, cy - 4 + breathe, 6, 14);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - 13, cy + 1 + breathe, 4, 4); // Crest

      ctx.filter = 'none';
    }
  },

  {
    id: 'sky_harpy',
    name: 'Wolken-Harpyie',
    title: 'Sky Harpy',
    category: 'elite',
    categoryName: '⚔️ Elite & Elementare',
    biome: 'Wolkenreich & Himmelsbrücken',
    biomeBadge: 'Wolken',
    badgeClass: 'badge-clouds',
    variants: ['Himmelsblau (Standard)', 'Sonnen-Gold', 'Gewitter-Grau'],
    stats: { hp: 55, maxHp: 60, atk: 25, spd: 'Fliegend', rng: '45px (Sturzflug)' },
    behavior: 'Fliegt ungehindert über Wolkenabgründe. Erzeugt mit heftigen Flügelschlägen Windböen, die den Spieler von Plattformen wegpusten können, gefolgt von einem Sturzflug mit Krallen.',
    counter: 'Gegen den Wind anlaufen und den Sturzflug mit einem gut getimten Schwerthieb im Flug abfangen.',
    lore: 'Sammelt alles Glänzende. In ihren Nestern auf den höchsten Kumulus-Wolken findet man oft goldene Pfeile.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const wingFlap = Math.sin(time * 7) * 8;
      const floatY = Math.cos(time * 3) * 4;
      const isAttacking = state === 'attack';

      // Cloud Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 20, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Feathered Wings (Flapping)
      ctx.fillStyle = '#bae6fd';
      // Left wing
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy + floatY);
      ctx.lineTo(cx - 24, cy - 14 + wingFlap + floatY);
      ctx.lineTo(cx - 12, cy + 6 + floatY);
      ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(cx + 5, cy + floatY);
      ctx.lineTo(cx + 24, cy - 14 - wingFlap + floatY);
      ctx.lineTo(cx + 12, cy + 6 + floatY);
      ctx.fill();

      // Harpy Body
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(cx - 6, cy - 4 + floatY, 12, 14, 4);
      ctx.fill();

      // Fierce Head & Wild Hair
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(cx, cy - 10 + floatY, 6, 0, Math.PI * 2);
      ctx.fill();
      // Hair plumage
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 8, cy - 16 + floatY, 16, 5);

      // Beak / Talons
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - 1.5, cy - 9 + floatY, 3, 3);

      // Claws
      const diveTalon = isAttacking ? 4 : 0;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - 4, cy + 10 + floatY + diveTalon, 2, 4);
      ctx.fillRect(cx + 2, cy + 10 + floatY + diveTalon, 2, 4);

      ctx.filter = 'none';
    }
  },

  {
    id: 'lava_core',
    name: 'Magma-Kernling',
    title: 'Lava Core',
    category: 'elite',
    categoryName: '⚔️ Elite & Elementare',
    biome: 'Vulkangebiete & Tiefe Magmahöhlen',
    biomeBadge: 'Höhlen',
    badgeClass: 'badge-caves',
    variants: ['Glut-Orange (Standard)', 'Höllen-Blau', 'Obsidian-Dunkel'],
    stats: { hp: 60, maxHp: 65, atk: 30, spd: 'Rollend', rng: '45px (Todes-Explosion)' },
    behavior: 'Rollender Feuerball mit rotierenden Obsidianplatten. Bei 0 HP explodiert er nach 1.2s Warn-Blinken in einer verheerenden radialen Hitzewelle!',
    counter: 'Den tödlichen Schlag ausführen und SOFORT per Dash das Weite suchen, bevor die Detonation einsetzt.',
    lore: 'Kühlt fernab von Lavaseen über Tage langsam ab und erstarrt schließlich zu porösem Bimsstein.',
    render(ctx, cx, cy, time, state, hitFlash) {
      const isAttacking = state === 'attack';
      const corePulse = Math.sin(time * 6) * 2;
      const rotAngle = time * 3;

      // Fiery Shadow
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hitFlash > 0) ctx.filter = 'brightness(2.5) saturate(0.2)';

      // Molten Core (Orange & Yellow glow)
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 11 + corePulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 6 + corePulse * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // 4 Orbiting Obsidian Armor Plates
      ctx.fillStyle = '#1c1917';
      for (let p = 0; p < 4; p++) {
        const pAngle = rotAngle + (p * Math.PI * 2 / 4);
        const px = cx + Math.cos(pAngle) * (14 + (isAttacking ? 6 : 0));
        const py = cy + 2 + Math.sin(pAngle) * (10 + (isAttacking ? 4 : 0));
        ctx.fillRect(px - 3, py - 3, 6, 6);
      }

      // Floating Embers
      ctx.fillStyle = '#f97316';
      ctx.fillRect(cx - 10 + Math.sin(time * 5) * 3, cy - 12, 2, 2);
      ctx.fillRect(cx + 8 + Math.cos(time * 7) * 3, cy - 10, 2, 2);

      // Warning Flash before explosion if attacking
      if (isAttacking) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy + 2, 22 + Math.sin(time * 15) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.filter = 'none';
    }
  }
];

export class BestiaryManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentFilter = 'all';
    this.enemyStates = {}; // id -> { state: 'idle'|'walk'|'attack', hitTimer: 0, animTime: 0 }

    BESTIARY_DATA.forEach(e => {
      this.enemyStates[e.id] = { state: 'idle', hitTimer: 0, animTime: Math.random() * 10 };
    });

    this.canvases = {};
    this.init();
  }

  init() {
    this.renderCards();
    this.setupFilters();
  }

  setFilter(category) {
    this.currentFilter = category;
    document.querySelectorAll('.bestiary-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-category') === category);
    });
    this.renderCards();
  }

  setupFilters() {
    document.querySelectorAll('.bestiary-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        this.setFilter(cat);
      });
    });
  }

  renderCards() {
    if (!this.container) return;
    this.container.innerHTML = '';
    this.canvases = {};

    const filtered = this.currentFilter === 'all' 
      ? BESTIARY_DATA 
      : BESTIARY_DATA.filter(e => e.category === this.currentFilter);

    filtered.forEach(enemy => {
      const card = document.createElement('div');
      card.className = 'enemy-card';
      card.setAttribute('data-id', enemy.id);

      const st = this.enemyStates[enemy.id];

      card.innerHTML = `
        <div class="enemy-card-header">
          <div class="enemy-title-group">
            <h3 class="enemy-name">${enemy.name}</h3>
            <span class="enemy-eng-title">${enemy.title}</span>
          </div>
          <div class="enemy-badges-group">
            <span class="enemy-badge badge-role">${enemy.categoryName}</span>
            <span class="enemy-badge ${enemy.badgeClass}">${enemy.biomeBadge}</span>
          </div>
        </div>

        <div class="enemy-preview-stage">
          <canvas id="enemy-canvas-${enemy.id}" class="enemy-canvas" width="80" height="80"></canvas>
          <div class="enemy-stage-controls">
            <button class="stage-btn btn-anim-toggle" title="Animation umschalten (Idle / Walk / Attack)">
              <span>▶ Modus: </span><b class="anim-state-label">${st.state.toUpperCase()}</b>
            </button>
            <button class="stage-btn btn-hit-test" title="Treffer-Reaktion testen">
              <span>💥 Treffer</span>
            </button>
          </div>
          <div id="dmg-float-${enemy.id}" class="dmg-float hidden">-24!</div>
        </div>

        <div class="enemy-stats-panel">
          <div class="stat-bar-row">
            <span class="stat-label">❤️ HP</span>
            <div class="stat-track"><div class="stat-fill fill-hp" style="width: ${Math.min(100, (enemy.stats.hp / 120) * 100)}%;"></div></div>
            <span class="stat-num">${enemy.stats.hp}</span>
          </div>
          <div class="stat-bar-row">
            <span class="stat-label">⚔️ ATK</span>
            <div class="stat-track"><div class="stat-fill fill-atk" style="width: ${Math.min(100, (enemy.stats.atk / 40) * 100)}%;"></div></div>
            <span class="stat-num">${enemy.stats.atk}</span>
          </div>
          <div class="stat-chips-row">
            <span class="stat-chip">⚡ Tempo: <b>${enemy.stats.spd}</b></span>
            <span class="stat-chip">🎯 Reichweite: <b>${enemy.stats.rng}</b></span>
          </div>
        </div>

        <div class="enemy-tactics-box">
          <div class="tactic-item">
            <span class="tactic-icon">⚡</span>
            <div><strong>Verhalten & Stärken:</strong> ${enemy.behavior}</div>
          </div>
          <div class="tactic-item counter-item">
            <span class="tactic-icon">🛡️</span>
            <div><strong>Schwäche & Konter:</strong> ${enemy.counter}</div>
          </div>
        </div>

        <div class="enemy-variants-row">
          <span class="variants-title">🎨 Farbvarianten:</span>
          ${enemy.variants.map(v => `<span class="variant-pill">${v}</span>`).join('')}
        </div>

        <div class="enemy-lore-quote">
          <span>„${enemy.lore}“</span>
        </div>
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
        btnAnim.addEventListener('click', () => {
          const nextState = st.state === 'idle' ? 'walk' : (st.state === 'walk' ? 'attack' : 'idle');
          st.state = nextState;
          labelAnim.textContent = nextState.toUpperCase();
        });
      }

      const btnHit = card.querySelector('.btn-hit-test');
      const dmgFloat = card.querySelector(`#dmg-float-${enemy.id}`);
      if (btnHit) {
        btnHit.addEventListener('click', () => {
          st.hitTimer = 0.25; // White flash
          if (dmgFloat) {
            dmgFloat.textContent = `-${Math.floor(Math.random() * 14 + 18)}!`;
            dmgFloat.classList.remove('hidden');
            dmgFloat.classList.add('anim-float');
            setTimeout(() => {
              dmgFloat.classList.remove('anim-float');
              dmgFloat.classList.add('hidden');
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
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render enemy centered in 80x80 canvas (center at 40, 42)
        enemy.render(ctx, 40, 42, st.animTime, st.state, Math.max(0, st.hitTimer));
      }
    });
  }
}
