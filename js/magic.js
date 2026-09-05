// =============================================================================
// MAGIC & ARTIFACT SYSTEM (Zauber- & Artefakt-System)
// =============================================================================
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, DIMENSIONS } from './constants.js';

export const ARTIFACT_TYPES = {
  PHOENIX: {
    id: 'phoenix',
    name: 'Rubin-Phönix',
    title: 'Flammen-Phönix',
    icon: '🔥',
    description: 'Ein mächtiger flammender Phönix schnellt in Blickrichtung hervor. Er erstreckt sich über 5 Kacheln (80px) und fliegt unaufhaltsam bis an den Rand der gesamten Welt. Alle Monster in seiner Schneise erleiden verheerenden Feuerschaden.',
    maxCharges: 5,
    rechargeBonus: 3,
    cooldown: 3.0,
    damage: 220,
    widthTiles: 5,
    speed: 360,
    colorTheme: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.5)'
  }
};

const getElement = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);

export class MagicManager {
  constructor(game) {
    this.game = game;
    this.groundArtifacts = [];
    this.activeSpells = [];
    this.playerGlitterParticles = [];
    this.glitterTimer = 0;

    this.isSwapModalOpen = false;
    this.pendingGroundArtifact = null;

    // UI elements
    this.magicHudSlot = getElement('magic-hud-slot');
    this.btnCastMagic = getElement('btn-cast-magic');
    this.btnMagicInfo = getElement('btn-magic-info');
    this.magicChargesBadge = getElement('magic-charges-badge');
    this.magicCooldownOverlay = getElement('magic-cooldown-overlay');
    this.magicInfoModal = getElement('magic-info-modal');
    this.btnInfoModalClose = getElement('btn-magic-info-close');
    this.artifactSwapModal = getElement('artifact-swap-modal');
    this.magicPickupBanner = getElement('magic-pickup-banner');

    this.initEvents();
  }

  initEvents() {
    if (this.btnCastMagic) {
      const handleCast = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.castActiveSpell(this.game?.player, this.game?.map, this.game?.combat);
      };
      this.btnCastMagic.addEventListener('click', handleCast);
      this.btnCastMagic.addEventListener('touchstart', handleCast, { passive: false });
    }

    if (this.btnMagicInfo) {
      const handleInfo = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.toggleInfoModal(true);
      };
      this.btnMagicInfo.addEventListener('click', handleInfo);
      this.btnMagicInfo.addEventListener('touchstart', handleInfo, { passive: false });
    }

    if (this.btnInfoModalClose) {
      const handleClose = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.toggleInfoModal(false);
      };
      this.btnInfoModalClose.addEventListener('click', handleClose);
      this.btnInfoModalClose.addEventListener('touchstart', handleClose, { passive: false });
    }

    // Modal Swap buttons
    const btnSwapAccept = getElement('btn-artifact-swap-accept');
    if (btnSwapAccept) {
      const handleSwap = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.chooseSwap();
      };
      btnSwapAccept.addEventListener('click', handleSwap);
      btnSwapAccept.addEventListener('touchstart', handleSwap, { passive: false });
    }

    const btnSwapRecharge = getElement('btn-artifact-swap-recharge');
    if (btnSwapRecharge) {
      const handleRecharge = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.chooseKeepAndRecharge();
      };
      btnSwapRecharge.addEventListener('click', handleRecharge);
      btnSwapRecharge.addEventListener('touchstart', handleRecharge, { passive: false });
    }

    const btnSwapLeave = getElement('btn-artifact-swap-leave');
    if (btnSwapLeave) {
      const handleLeave = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.closeSwapModal();
      };
      btnSwapLeave.addEventListener('click', handleLeave);
      btnSwapLeave.addEventListener('touchstart', handleLeave, { passive: false });
    }

    // Click backdrop outside modal dialog to dismiss
    if (this.artifactSwapModal) {
      this.artifactSwapModal.addEventListener('click', (e) => {
        if (e.target === this.artifactSwapModal) {
          this.closeSwapModal();
        }
      });
    }
  }

  toggleInfoModal(forceState = null) {
    if (!this.magicInfoModal) return;
    const isClosed = this.magicInfoModal.classList.contains('hidden');
    const shouldOpen = forceState !== null ? forceState : isClosed;
    if (shouldOpen) {
      this.populateInfoModal();
      this.magicInfoModal.classList.remove('hidden');
    } else {
      this.magicInfoModal.classList.add('hidden');
    }
  }

  populateInfoModal() {
    const player = this.game?.player;
    const artifactDef = player?.artifact ? (ARTIFACT_TYPES[player.artifact.id?.toUpperCase()] || ARTIFACT_TYPES.PHOENIX) : ARTIFACT_TYPES.PHOENIX;

    const titleEl = getElement('magic-info-title');
    const iconEl = getElement('magic-info-icon');
    const descEl = getElement('magic-info-desc');
    const chargesEl = getElement('magic-info-charges');
    const cdEl = getElement('magic-info-cooldown');
    const widthEl = getElement('magic-info-width');
    const dmgEl = getElement('magic-info-dmg');

    if (titleEl) titleEl.textContent = artifactDef.name;
    if (iconEl) iconEl.textContent = artifactDef.icon;
    if (descEl) descEl.textContent = artifactDef.description;
    if (chargesEl) chargesEl.textContent = player?.artifact ? `${player.artifact.charges} / ${player.artifact.maxCharges}` : `${artifactDef.maxCharges} Aufladungen`;
    if (cdEl) cdEl.textContent = `${artifactDef.cooldown.toFixed(1)}s`;
    if (widthEl) widthEl.textContent = `${artifactDef.widthTiles} Kacheln (80px)`;
    if (dmgEl) dmgEl.textContent = `${artifactDef.damage} Feuerschaden`;
  }

  // ---------------------------------------------------------------------------
  // GROUND ARTIFACT MANAGEMENT
  // ---------------------------------------------------------------------------
  spawnGroundArtifact(x, y, dimension = DIMENSIONS.OVERWORLD, typeId = 'phoenix', fromShrine = false) {
    const artifactDef = ARTIFACT_TYPES[typeId.toUpperCase()] || ARTIFACT_TYPES.PHOENIX;
    const artifact = {
      id: `art_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      typeId: artifactDef.id,
      def: artifactDef,
      x,
      y,
      dimension,
      fromShrine,
      bobTime: Math.random() * Math.PI * 2,
      lightPulse: 0
    };
    this.groundArtifacts.push(artifact);
    return artifact;
  }

  initShrineArtifacts(caves, cloudMap, overworldMap) {
    this.groundArtifacts = [];

    // 1. Shrines in Cloud World (Himmel)
    if (cloudMap && cloudMap.shrines) {
      cloudMap.shrines.forEach(shrine => {
        this.spawnGroundArtifact(shrine.x * TILE_SIZE + 8, (shrine.y + 1) * TILE_SIZE + 8, DIMENSIONS.CLOUDS, 'phoenix', true);
      });
    }

    // 2. Shrines in Cave World (Höhlen) - handles both single CaveMap and caves collection object
    if (caves) {
      if (Array.isArray(caves.shrines)) {
        caves.shrines.forEach(shrine => {
          this.spawnGroundArtifact(shrine.x * TILE_SIZE + 8, (shrine.y + 1) * TILE_SIZE + 8, DIMENSIONS.CAVES, 'phoenix', true);
        });
      } else if (typeof caves === 'object') {
        Object.values(caves).forEach(cMap => {
          if (cMap && Array.isArray(cMap.shrines)) {
            cMap.shrines.forEach(shrine => {
              this.spawnGroundArtifact(shrine.x * TILE_SIZE + 8, (shrine.y + 1) * TILE_SIZE + 8, DIMENSIONS.CAVES, 'phoenix', true);
            });
          }
        });
      }
    }

    // 3. Shrines in Overworld (Ancient Void Shrine in the Abyss)
    if (overworldMap && Array.isArray(overworldMap.shrines)) {
      overworldMap.shrines.forEach(shrine => {
        this.spawnGroundArtifact(shrine.x * TILE_SIZE + 8, (shrine.y + 1) * TILE_SIZE + 8, DIMENSIONS.OVERWORLD, 'phoenix', true);
      });
    } else {
      this.spawnGroundArtifact(108 * TILE_SIZE + 8, 63 * TILE_SIZE + 8, DIMENSIONS.OVERWORLD, 'phoenix', true);
    }
  }

  dropMonsterArtifact(x, y, dimension = DIMENSIONS.OVERWORLD) {
    const art = this.spawnGroundArtifact(x, y, dimension, 'phoenix', false);
    // Add glowing burst of embers on monster drop
    if (this.game?.combat) {
      this.game.combat.addFloatingText('✨ MAGISCHES ARTEFAKT!', x, y - 24, '#f59e0b', 1.2);
      for (let i = 0; i < 20; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = Math.random() * 50 + 20;
        this.game.combat.hitSparks.push({
          x,
          y: y - 10,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 15,
          color: Math.random() > 0.5 ? '#ef4444' : '#facc15',
          size: Math.random() * 3 + 1.5,
          life: 0.7,
          maxLife: 0.7
        });
      }
    }
    return art;
  }

  // ---------------------------------------------------------------------------
  // PICKUP & SWAP LOGIC
  // ---------------------------------------------------------------------------
  checkPlayerPickup(player) {
    if (!player || player.isDead || this.isSwapModalOpen) return;
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;

    const PICKUP_DIST = 20;

    for (let i = this.groundArtifacts.length - 1; i >= 0; i--) {
      const art = this.groundArtifacts[i];
      if (art.dimension !== curDim) continue;

      const dist = Math.hypot(player.x - art.x, (player.y - 8) - art.y);
      if (dist <= PICKUP_DIST) {
        if (!player.artifact || player.artifact.charges <= 0) {
          // Direct equip when player has no artifact or 0 charges
          this.equipArtifact(player, art.def);
          this.groundArtifacts.splice(i, 1);
          this.triggerPickupBanner(art.def);
        } else {
          // Player already has an active artifact -> open swap modal
          this.openSwapModal(art, i);
        }
        break;
      }
    }
  }

  equipArtifact(player, artifactDef) {
    player.artifact = {
      id: artifactDef.id,
      name: artifactDef.name,
      title: artifactDef.title,
      icon: artifactDef.icon,
      charges: artifactDef.maxCharges,
      maxCharges: artifactDef.maxCharges,
      cooldownTimer: 0,
      cooldownMax: artifactDef.cooldown,
      damage: artifactDef.damage,
      widthTiles: artifactDef.widthTiles,
      speed: artifactDef.speed
    };
    this.updateHUD();
  }

  openSwapModal(groundArtifact, index) {
    this.isSwapModalOpen = true;
    this.pendingGroundArtifact = { artifact: groundArtifact, index };

    const modal = getElement('artifact-swap-modal');
    if (!modal) return;

    const player = this.game?.player;
    const current = player?.artifact;
    const incoming = groundArtifact.def;

    const curIcon = getElement('swap-current-icon');
    const curName = getElement('swap-current-name');
    const curCharges = getElement('swap-current-charges');

    const newIcon = getElement('swap-new-icon');
    const newName = getElement('swap-new-name');
    const newCharges = getElement('swap-new-charges');

    if (curIcon) curIcon.textContent = current ? current.icon : '✨';
    if (curName) curName.textContent = current ? current.name : 'Kein Artefakt';
    if (curCharges) curCharges.textContent = current ? `${current.charges} / ${current.maxCharges} Aufladungen` : '0 Aufladungen';

    if (newIcon) newIcon.textContent = incoming.icon;
    if (newName) newName.textContent = incoming.name;
    if (newCharges) newCharges.textContent = `${incoming.maxCharges} Aufladungen`;

    modal.classList.remove('hidden');
  }

  closeSwapModal() {
    this.isSwapModalOpen = false;
    this.pendingGroundArtifact = null;
    const modal = getElement('artifact-swap-modal');
    if (modal) modal.classList.add('hidden');
  }

  chooseSwap() {
    if (!this.pendingGroundArtifact || !this.game?.player) {
      this.closeSwapModal();
      return;
    }
    const { artifact, index } = this.pendingGroundArtifact;
    const player = this.game.player;

    this.equipArtifact(player, artifact.def);
    if (index >= 0 && index < this.groundArtifacts.length) {
      this.groundArtifacts.splice(index, 1);
    }
    this.triggerPickupBanner(artifact.def, 'NEUES ARTEFAKT AUSGERÜSTET!');
    this.closeSwapModal();
  }

  chooseKeepAndRecharge() {
    if (!this.pendingGroundArtifact || !this.game?.player) {
      this.closeSwapModal();
      return;
    }
    const { artifact, index } = this.pendingGroundArtifact;
    const player = this.game.player;

    if (player.artifact) {
      const bonus = artifact.def.rechargeBonus || 3;
      player.artifact.charges = Math.min(player.artifact.maxCharges + 5, player.artifact.charges + bonus);
      this.triggerPickupBanner(artifact.def, `ARTEFAKT AUFGELADEN (+${bonus} AUFLADUNGEN)!`);
    }

    if (index >= 0 && index < this.groundArtifacts.length) {
      this.groundArtifacts.splice(index, 1);
    }
    this.updateHUD();
    this.closeSwapModal();
  }

  triggerPickupBanner(artifactDef, customMsg = null) {
    const banner = getElement('magic-pickup-banner');
    if (!banner) return;

    const titleEl = getElement('pickup-banner-title');
    const subEl = getElement('pickup-banner-sub');

    if (titleEl) titleEl.textContent = customMsg || `✨ ARTEFAKT GEBUNDEN: ${artifactDef.name.toUpperCase()}!`;
    if (subEl) subEl.textContent = `Drücke [ E ] oder den Zauber-Button zum Entfesseln (${artifactDef.maxCharges} Aufladungen)`;

    banner.classList.remove('hidden');
    banner.classList.remove('anim-fade-out');
    banner.classList.add('anim-pop-glow');

    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      banner.classList.add('anim-fade-out');
      setTimeout(() => {
        banner.classList.add('hidden');
        banner.classList.remove('anim-pop-glow');
      }, 500);
    }, 3800);
  }

  // ---------------------------------------------------------------------------
  // SPELL CASTING (Phönix)
  // ---------------------------------------------------------------------------
  castActiveSpell(player, map, combatManager) {
    if (!player || player.isDead) return false;
    if (!player.artifact || player.artifact.charges <= 0) {
      combatManager?.addFloatingText('❌ Keine Aufladungen!', player.x, player.y - 20, '#ef4444', 0.8);
      return false;
    }
    if (player.artifact.cooldownTimer > 0) {
      combatManager?.addFloatingText(`⏳ Abklingzeit (${player.artifact.cooldownTimer.toFixed(1)}s)`, player.x, player.y - 20, '#f59e0b', 0.6);
      return false;
    }

    // Determine direction
    let dirX = 0, dirY = 1;
    if (player.direction === 'up') { dirX = 0; dirY = -1; }
    else if (player.direction === 'down') { dirX = 0; dirY = 1; }
    else if (player.direction === 'left') { dirX = -1; dirY = 0; }
    else if (player.direction === 'right') { dirX = 1; dirY = 0; }
    else if (player.direction === 'up-left') { dirX = -0.7071; dirY = -0.7071; }
    else if (player.direction === 'up-right') { dirX = 0.7071; dirY = -0.7071; }
    else if (player.direction === 'down-left') { dirX = -0.7071; dirY = 0.7071; }
    else if (player.direction === 'down-right') { dirX = 0.7071; dirY = 0.7071; }

    // Deduct charge and trigger cooldown
    player.artifact.charges--;
    player.artifact.cooldownTimer = player.artifact.cooldownMax;

    // 5 tiles width = 80px
    const widthPx = player.artifact.widthTiles * TILE_SIZE;

    const spell = {
      id: `phoenix_${Date.now()}`,
      type: 'phoenix',
      dimension: this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD,
      x: player.x,
      y: player.y - 10,
      dirX,
      dirY,
      angle: Math.atan2(dirY, dirX),
      width: widthPx,
      speed: player.artifact.speed || 360,
      damage: player.artifact.damage || 220,
      hitEnemies: new Set(),
      life: 14.0, // Long enough to cross entire map
      animTime: 0
    };

    this.activeSpells.push(spell);

    // Casting shockwave & audio-visual particles
    if (combatManager) {
      combatManager.addFloatingText(`🔥 PHÖNIX-STURM! (${player.artifact.charges} übrig)`, player.x, player.y - 28, '#ef4444', 1.2);
      for (let i = 0; i < 35; i++) {
        const ang = spell.angle + (Math.random() - 0.5) * 1.5;
        const sp = Math.random() * 80 + 30;
        combatManager.hitSparks.push({
          x: player.x,
          y: player.y - 10,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          color: Math.random() > 0.4 ? '#ef4444' : '#f59e0b',
          size: Math.random() * 3 + 2,
          life: 0.6,
          maxLife: 0.6
        });
      }
    }

    this.updateHUD();
    return true;
  }

  // ---------------------------------------------------------------------------
  // UPDATE LOOP
  // ---------------------------------------------------------------------------
  update(dt, player, map, combatManager, enemyManager) {
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;

    // 1. Update Player Artifact Cooldown & Glitter
    if (player && player.artifact) {
      if (player.artifact.cooldownTimer > 0) {
        player.artifact.cooldownTimer = Math.max(0, player.artifact.cooldownTimer - dt);
      }

      // Sparkle Glitter Aura while charges > 0
      if (player.artifact.charges > 0 && !player.isDead) {
        this.glitterTimer += dt;
        if (this.glitterTimer >= 0.08) {
          this.glitterTimer = 0;
          const a = Math.random() * Math.PI * 2;
          const dist = Math.random() * 18 + 6;
          this.playerGlitterParticles.push({
            x: player.x + Math.cos(a) * dist,
            y: (player.y - 10) + Math.sin(a) * dist,
            vx: (Math.random() - 0.5) * 12,
            vy: -Math.random() * 18 - 8,
            color: Math.random() > 0.5 ? '#facc15' : (Math.random() > 0.5 ? '#ef4444' : '#ec4899'),
            size: Math.random() * 2.2 + 1.2,
            life: 0.65,
            maxLife: 0.65,
            twinkle: Math.random() * Math.PI * 2
          });
        }
      }
    }

    // 2. Update Glitter Particles
    for (let i = this.playerGlitterParticles.length - 1; i >= 0; i--) {
      const p = this.playerGlitterParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.playerGlitterParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.twinkle += dt * 8;
    }

    // 3. Update Ground Artifacts
    for (const art of this.groundArtifacts) {
      art.bobTime += dt * 3.5;
      art.lightPulse = (Math.sin(art.bobTime) + 1) / 2;
    }

    // Check player pickup
    this.checkPlayerPickup(player);

    // 4. Update Active Spells (Phoenix)
    const mapPixelW = (map ? map.width : MAP_WIDTH) * TILE_SIZE;
    const mapPixelH = (map ? map.height : MAP_HEIGHT) * TILE_SIZE;

    for (let i = this.activeSpells.length - 1; i >= 0; i--) {
      const spell = this.activeSpells[i];
      if (spell.dimension !== curDim) continue;

      spell.animTime += dt;
      spell.life -= dt;

      // Advance flight
      spell.x += spell.dirX * spell.speed * dt;
      spell.y += spell.dirY * spell.speed * dt;

      // Boundary check - until end of map
      if (spell.x < -80 || spell.x > mapPixelW + 80 || spell.y < -80 || spell.y > mapPixelH + 80 || spell.life <= 0) {
        this.activeSpells.splice(i, 1);
        continue;
      }

      // Trailing flame embers
      if (combatManager && Math.random() < 0.8) {
        const perpX = -spell.dirY;
        const perpY = spell.dirX;
        const spreadOffset = (Math.random() - 0.5) * (spell.width * 0.8);
        combatManager.hitSparks.push({
          x: spell.x + perpX * spreadOffset,
          y: spell.y + perpY * spreadOffset,
          vx: -spell.dirX * (Math.random() * 40 + 20) + (Math.random() - 0.5) * 30,
          vy: -spell.dirY * (Math.random() * 40 + 20) + (Math.random() - 0.5) * 30,
          color: Math.random() > 0.4 ? '#ef4444' : '#f59e0b',
          size: Math.random() * 3.5 + 1.5,
          life: 0.45,
          maxLife: 0.45
        });
      }

      // Check collision with all active enemies in path (5 tiles wide box)
      if (enemyManager && enemyManager.enemies) {
        for (const enemy of enemyManager.enemies) {
          if (enemy.dimension !== curDim || enemy.state === 'dead' || enemy.hp <= 0) continue;
          if (spell.hitEnemies.has(enemy)) continue;

          const dx = enemy.x - spell.x;
          const dy = enemy.y - spell.y;
          const dotFlight = dx * spell.dirX + dy * spell.dirY;
          const dotPerp = Math.abs(dx * (-spell.dirY) + dy * spell.dirX);

          // If enemy is within collision window along flight path and within half-width (40px) laterally
          const collisionDist = Math.max(35, spell.speed * dt * 1.5);
          if (Math.abs(dotFlight) <= collisionDist && dotPerp <= (spell.width / 2 + (enemy.radius || 10))) {
            spell.hitEnemies.add(enemy);

            // Deal heavy phoenix fire damage
            enemy.takeDamage(spell.damage, spell.angle, 120, combatManager, true);
            combatManager?.addFloatingText(`🔥 -${spell.damage}`, enemy.x, enemy.y - 20, '#ef4444', 0.9);

            // Explosion sparks at impact
            if (combatManager) {
              for (let s = 0; s < 14; s++) {
                const spAng = Math.random() * Math.PI * 2;
                const sp = Math.random() * 60 + 20;
                combatManager.hitSparks.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(spAng) * sp,
                  vy: Math.sin(spAng) * sp - 10,
                  color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
                  size: Math.random() * 3 + 2,
                  life: 0.5,
                  maxLife: 0.5
                });
              }
            }
          }
        }
      }
    }

    this.updateHUD();
  }

  // ---------------------------------------------------------------------------
  // HUD & UI SYNCHRONIZATION
  // ---------------------------------------------------------------------------
  updateHUD() {
    const player = this.game?.player;
    if (!this.magicHudSlot) return;

    if (!player || !player.artifact || player.artifact.charges <= 0) {
      this.magicHudSlot.classList.add('hidden');
      return;
    }

    this.magicHudSlot.classList.remove('hidden');

    if (this.magicChargesBadge) {
      this.magicChargesBadge.textContent = player.artifact.charges;
    }

    if (this.magicCooldownOverlay) {
      const cd = player.artifact.cooldownTimer || 0;
      const cdMax = player.artifact.cooldownMax || 3.0;
      if (cd > 0) {
        const pct = (cd / cdMax) * 100;
        this.magicCooldownOverlay.style.height = `${pct}%`;
        this.magicCooldownOverlay.classList.remove('hidden');
      } else {
        this.magicCooldownOverlay.style.height = '0%';
        this.magicCooldownOverlay.classList.add('hidden');
      }
    }
  }

  // ---------------------------------------------------------------------------
  // RENDERING (Dark Ghibli Papercraft Aesthetics)
  // ---------------------------------------------------------------------------
  render(ctx, camera) {
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;
    const player = this.game?.player;

    // 1. Ground Artifacts
    this.renderGroundArtifacts(ctx, camera, curDim);

    // 2. Active Spell Projectiles (Phönix)
    this.renderActiveSpells(ctx, camera, curDim);

    // 3. Player Glitter Aura
    if (player && player.artifact && player.artifact.charges > 0) {
      this.renderPlayerGlitter(ctx, camera);
    }
  }

  renderGroundArtifacts(ctx, camera, curDim) {
    const zoom = camera ? camera.zoom : 1;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    for (const art of this.groundArtifacts) {
      if (art.dimension !== curDim) continue;

      const sx = (art.x - camX) * zoom;
      const sy = (art.y - camY) * zoom;

      // Distance culling
      if (sx < -40 || sx > ctx.canvas.width + 40 || sy < -60 || sy > ctx.canvas.height + 40) continue;

      const bobY = Math.sin(art.bobTime) * 4;
      const py = sy + bobY;

      ctx.save();

      // Vertical Heavenly Light Pillar
      const grad = ctx.createLinearGradient(sx, py - 45 * zoom, sx, py + 10 * zoom);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      grad.addColorStop(0.6, `rgba(239, 68, 68, ${0.15 + art.lightPulse * 0.15})`);
      grad.addColorStop(1, 'rgba(250, 204, 21, 0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(sx - 10 * zoom, py - 45 * zoom, 20 * zoom, 55 * zoom);

      // Rotating Magic Runes Sigil on ground
      ctx.save();
      ctx.translate(sx, sy + 6 * zoom);
      ctx.scale(1, 0.38); // Flattened perspective oval
      ctx.rotate(art.bobTime * 0.5);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 1.5 * zoom;
      ctx.beginPath();
      ctx.arc(0, 0, 16 * zoom, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, 10 * zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Floating Papercraft Ruby Orb
      const orbRadius = 7 * zoom;

      // Soft outer glow
      ctx.fillStyle = art.def.glowColor || 'rgba(239, 68, 68, 0.5)';
      ctx.beginPath();
      ctx.arc(sx, py, (orbRadius + 4) * (1 + art.lightPulse * 0.2), 0, Math.PI * 2);
      ctx.fill();

      // Ruby Orb Facets (Dark Ghibli Papercraft)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(sx, py, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // Top Highlight fold
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.moveTo(sx, py - orbRadius);
      ctx.lineTo(sx + orbRadius * 0.7, py);
      ctx.lineTo(sx, py + orbRadius * 0.4);
      ctx.lineTo(sx - orbRadius * 0.7, py);
      ctx.closePath();
      ctx.fill();

      // Pure White Shine Sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx - 2 * zoom, py - 2 * zoom, 1.8 * zoom, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting Ember Sparks
      for (let s = 0; s < 3; s++) {
        const sparkAng = art.bobTime * 2 + (s * Math.PI * 2) / 3;
        const sparkDist = (orbRadius + 5) * zoom;
        const spx = sx + Math.cos(sparkAng) * sparkDist;
        const spy = py + Math.sin(sparkAng) * (sparkDist * 0.5);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(spx, spy, 1.2 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  renderActiveSpells(ctx, camera, curDim) {
    const zoom = camera ? camera.zoom : 1;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    for (const spell of this.activeSpells) {
      if (spell.dimension !== curDim) continue;

      const sx = (spell.x - camX) * zoom;
      const sy = (spell.y - camY) * zoom;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(spell.angle);

      // Flapping wing cycle
      const flap = Math.sin(spell.animTime * 18);
      const halfW = (spell.width / 2) * zoom; // 40px * zoom each wing

      // 1. Blazing Heat Aura / Shockwave
      const auraGrad = ctx.createRadialGradient(0, 0, 10 * zoom, 0, 0, halfW * 1.2);
      auraGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
      auraGrad.addColorStop(0.4, 'rgba(239, 68, 68, 0.45)');
      auraGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, halfW * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 2. Trailing Fiery Tail Feathers (3 long blazing streams)
      for (let t = -1; t <= 1; t++) {
        const tailWav = Math.sin(spell.animTime * 14 + t) * (6 * zoom);
        ctx.fillStyle = t === 0 ? '#facc15' : '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-10 * zoom, t * 8 * zoom);
        ctx.quadraticCurveTo(-40 * zoom, (t * 16 + tailWav) * zoom, -70 * zoom, (t * 22 + tailWav * 1.4) * zoom);
        ctx.lineTo(-45 * zoom, (t * 8) * zoom);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Wide Majestic Origami Phoenix Wings (5 Tiles = 80px width)
      // Left Wing
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-18 * zoom, -halfW * (0.85 + flap * 0.15));
      ctx.lineTo(12 * zoom, -halfW * (0.65 + flap * 0.15));
      ctx.lineTo(8 * zoom, 0);
      ctx.closePath();
      ctx.fill();

      // Left Wing Layer 2 (Lighter Orange Paper Fold)
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12 * zoom, -halfW * (0.75 + flap * 0.12));
      ctx.lineTo(10 * zoom, -halfW * (0.5 + flap * 0.12));
      ctx.lineTo(6 * zoom, 0);
      ctx.closePath();
      ctx.fill();

      // Right Wing
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-18 * zoom, halfW * (0.85 + flap * 0.15));
      ctx.lineTo(12 * zoom, halfW * (0.65 + flap * 0.15));
      ctx.lineTo(8 * zoom, 0);
      ctx.closePath();
      ctx.fill();

      // Right Wing Layer 2
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12 * zoom, halfW * (0.75 + flap * 0.12));
      ctx.lineTo(10 * zoom, halfW * (0.5 + flap * 0.12));
      ctx.lineTo(6 * zoom, 0);
      ctx.closePath();
      ctx.fill();

      // 4. Phoenix Body & Radiant Origami Beak
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-16 * zoom, 0);
      ctx.lineTo(0, -6 * zoom);
      ctx.lineTo(24 * zoom, 0); // Sharp golden beak forward
      ctx.lineTo(0, 6 * zoom);
      ctx.closePath();
      ctx.fill();

      // Golden Beak Tip
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(14 * zoom, -3 * zoom);
      ctx.lineTo(26 * zoom, 0);
      ctx.lineTo(14 * zoom, 3 * zoom);
      ctx.closePath();
      ctx.fill();

      // Blazing Head Crest (3 fire feathers)
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(4 * zoom, 0);
      ctx.lineTo(-10 * zoom, -8 * zoom);
      ctx.lineTo(0, -2 * zoom);
      ctx.lineTo(-14 * zoom, 0);
      ctx.lineTo(0, 2 * zoom);
      ctx.lineTo(-10 * zoom, 8 * zoom);
      ctx.closePath();
      ctx.fill();

      // Pure White Glowing Eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10 * zoom, -2 * zoom, 3 * zoom, 1.5 * zoom);
      ctx.fillRect(10 * zoom, 0.5 * zoom, 3 * zoom, 1.5 * zoom);

      ctx.restore();
    }
  }

  renderPlayerGlitter(ctx, camera) {
    const zoom = camera ? camera.zoom : 1;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    for (const p of this.playerGlitterParticles) {
      const sx = (p.x - camX) * zoom;
      const sy = (p.y - camY) * zoom;

      ctx.save();
      const alpha = (p.life / p.maxLife) * (0.6 + Math.sin(p.twinkle) * 0.35);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;

      // Draw 4-point star sparkle
      const s = p.size * zoom;
      ctx.beginPath();
      ctx.moveTo(sx, sy - s);
      ctx.lineTo(sx + s * 0.3, sy - s * 0.3);
      ctx.lineTo(sx + s, sy);
      ctx.lineTo(sx + s * 0.3, sy + s * 0.3);
      ctx.lineTo(sx, sy + s);
      ctx.lineTo(sx - s * 0.3, sy + s * 0.3);
      ctx.lineTo(sx - s, sy);
      ctx.lineTo(sx - s * 0.3, sy - s * 0.3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }
}
