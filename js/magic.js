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
  },
  DRUID_BEAR: {
    id: 'druid_bear',
    name: 'Smaragd-Druide',
    title: 'Bärengestalt',
    icon: '🐻',
    description: 'Entfesselt uralte Druidenmagie mit smaragdgrünem Leuchten. Verwandelt dich für 1 Minute in einen mächtigen Bären mit 50% mehr Leben! Deine Prankenhiebe sind 20% langsamer, aber doppelt so stark mit mehr Rückstoß. Der Vorstoß reicht 20% weiter. Kein Bogen, stattdessen mächtiger Krallenwirbel.',
    maxCharges: 5,
    rechargeBonus: 3,
    cooldown: 2.0,
    damage: 0,
    widthTiles: 0,
    speed: 0,
    colorTheme: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.6)'
  },
  PLASMA_ORBS: {
    id: 'plasma_orbs',
    name: 'Rosa Plasmakugeln',
    title: 'Plasma-Orbit',
    icon: '🔮',
    description: 'Beschwört kurz nacheinander 4 pulsierende rosa Plasmakugeln in deine Umlaufbahn. Sie blinken mit ansteigender Frequenz und detonieren nacheinander in verheerenden Plasma-Explosionen mit hohem Schaden und enormem Rückstoß.',
    maxCharges: 5,
    rechargeBonus: 3,
    cooldown: 3.0,
    damage: 45,
    widthTiles: 3,
    speed: 0,
    colorTheme: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.6)'
  },
  VOID_TELEPORT: {
    id: 'void_teleport',
    name: 'Leeren-Teleport',
    title: 'Schatten-Riss',
    icon: '🌌',
    description: 'Nutzt die dimensionale Teleportation der Schattenmonster. Öffnet eine taktische Karte aller aufgedeckten Gebiete. Wähle ein begehbares Ziel auf der Karte, um dich mit violetter Leeren-Implosion sofort dorthin zu teleportieren.',
    maxCharges: 5,
    rechargeBonus: 3,
    cooldown: 1.0,
    damage: 0,
    widthTiles: 0,
    speed: 0,
    colorTheme: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.6)'
  },
  FROST_CONE: {
    id: 'frost_cone',
    name: 'Eisnebel',
    title: 'Frost-Kollaps',
    icon: '❄️',
    description: 'Entfesselt einen eisigen Frostnebel in einem weiten Kegel vor dir. Alle getroffenen Monster werden sofort eingefroren (keine Bewegung, kein Angriff). Die Froststarre hält je nach Monsterstärke zwischen 0,5 und 3,0 Sekunden an.',
    maxCharges: 5,
    rechargeBonus: 3,
    cooldown: 2.5,
    damage: 0,
    widthTiles: 4,
    speed: 0,
    colorTheme: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.6)'
  }
};

export function getArtifactDef(typeId) {
  if (!typeId) return ARTIFACT_TYPES.PHOENIX;
  const key = String(typeId).toUpperCase();
  if (ARTIFACT_TYPES[key]) return ARTIFACT_TYPES[key];
  for (const def of Object.values(ARTIFACT_TYPES)) {
    if (def.id === typeId) return def;
  }
  return ARTIFACT_TYPES.PHOENIX;
}

const getElement = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);

export class MagicManager {
  constructor(game) {
    this.game = game;
    this.groundArtifacts = [];
    this.activeSpells = [];
    this.activePlasmaSequences = [];
    this.playerGlitterParticles = [];
    this.glitterTimer = 0;

    this.isSwapModalOpen = false;
    this.pendingGroundArtifact = null;

    // Aiming Stencil State (Schablone bei Halten)
    this.isAiming = false;
    this.aimTimer = 0;

    // Shrine Respawn Queue (2-3 Min / 120-180s)
    this.respawnQueue = [];
    this.pickupCooldown = 0;

    // Teleportation Map State
    this.isTeleportModalOpen = false;
    this.teleportHoverTile = null;

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

    this.teleportModal = getElement('teleport-map-modal');
    this.teleportCanvas = getElement('teleportMapCanvas');
    this.btnTeleportClose = getElement('btn-teleport-map-close');

    this.initEvents();
  }

  initEvents() {
    if (this.btnCastMagic) {
      const handlePress = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.startAiming(this.game?.player);
      };

      const handleRelease = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        if (this.isAiming) {
          this.releaseAiming(this.game?.player, this.game?.map, this.game?.combat);
        }
      };

      const handleCancel = () => {
        this.cancelAiming();
      };

      this.btnCastMagic.addEventListener('pointerdown', handlePress);
      this.btnCastMagic.addEventListener('pointerup', handleRelease);
      this.btnCastMagic.addEventListener('pointercancel', handleCancel);

      this.btnCastMagic.addEventListener('touchstart', handlePress, { passive: false });
      this.btnCastMagic.addEventListener('touchend', handleRelease, { passive: false });
      this.btnCastMagic.addEventListener('touchcancel', handleCancel, { passive: true });

      this.btnCastMagic.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        if (this.isAiming) {
          this.releaseAiming(this.game?.player, this.game?.map, this.game?.combat);
        } else {
          this.castActiveSpell(this.game?.player, this.game?.map, this.game?.combat);
        }
      });
    }

    // Window release safety fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', () => {
        if (this.isAiming) {
          this.releaseAiming(this.game?.player, this.game?.map, this.game?.combat);
        }
      });
      window.addEventListener('mouseup', () => {
        if (this.isAiming) {
          this.releaseAiming(this.game?.player, this.game?.map, this.game?.combat);
        }
      });
      window.addEventListener('touchend', () => {
        if (this.isAiming) {
          this.releaseAiming(this.game?.player, this.game?.map, this.game?.combat);
        }
      });
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

    // Teleport Map Modal Listeners
    if (this.btnTeleportClose) {
      const handleCloseTeleport = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.closeTeleportModal();
      };
      this.btnTeleportClose.addEventListener('click', handleCloseTeleport);
      this.btnTeleportClose.addEventListener('touchstart', handleCloseTeleport, { passive: false });
    }

    if (this.teleportModal) {
      this.teleportModal.addEventListener('click', (e) => {
        if (e.target === this.teleportModal) {
          this.closeTeleportModal();
        }
      });
    }

    if (this.teleportCanvas) {
      const handleMouseMove = (e) => {
        if (!this.isTeleportModalOpen) return;
        const rect = this.teleportCanvas.getBoundingClientRect();
        const map = this.game?.map;
        if (!map) return;

        const mapW = map.width || MAP_WIDTH;
        const mapH = map.height || MAP_HEIGHT;

        const clickX = ((e.clientX - rect.left) / rect.width) * this.teleportCanvas.width;
        const clickY = ((e.clientY - rect.top) / rect.height) * this.teleportCanvas.height;

        const scaleX = this.teleportCanvas.width / mapW;
        const scaleY = this.teleportCanvas.height / mapH;

        const tx = Math.floor(clickX / scaleX);
        const ty = Math.floor(clickY / scaleY);

        if (tx >= 0 && tx < mapW && ty >= 0 && ty < mapH) {
          const isWalkable = map.isTileWalkable ? map.isTileWalkable(tx, ty) : true;
          const isExplored = !map.explored || (map.explored[ty] && map.explored[ty][tx]);
          this.teleportHoverTile = { tx, ty, valid: Boolean(isWalkable && isExplored) };

          const coordsEl = getElement('teleport-coords-display');
          if (coordsEl) {
            coordsEl.textContent = `Ziel: X: ${tx}, Y: ${ty} ${isWalkable && isExplored ? '✅ Begehbar' : '❌ Gesperrt / Dunkel'}`;
            coordsEl.style.color = isWalkable && isExplored ? '#a855f7' : '#ef4444';
          }
          this.renderTeleportMap();
        }
      };

      this.teleportCanvas.addEventListener('mousemove', handleMouseMove);

      const handleClick = (e) => {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        this.handleTeleportClick(e.clientX, e.clientY);
      };
      this.teleportCanvas.addEventListener('click', handleClick);

      this.teleportCanvas.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        if (e.touches && e.touches[0]) {
          this.handleTeleportClick(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: false });
    }

    // Dev Quick-Equip buttons
    const bindDevEquip = (btnId, artDef) => {
      const btn = getElement(btnId);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.game?.player) {
            this.equipArtifact(this.game.player, artDef);
            this.triggerPickupBanner(artDef, `✨ DEV: ${artDef.name.toUpperCase()} AUSGERÜSTET!`);
          }
        });
      }
    };

    bindDevEquip('dev-equip-phoenix', ARTIFACT_TYPES.PHOENIX);
    bindDevEquip('dev-equip-bear', ARTIFACT_TYPES.DRUID_BEAR);
    bindDevEquip('dev-equip-plasma', ARTIFACT_TYPES.PLASMA_ORBS);
    bindDevEquip('dev-equip-teleport', ARTIFACT_TYPES.VOID_TELEPORT);
    bindDevEquip('dev-equip-frost', ARTIFACT_TYPES.FROST_CONE);
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
    const artifactDef = player?.artifact ? getArtifactDef(player.artifact.id) : ARTIFACT_TYPES.PHOENIX;

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

    if (artifactDef.id === 'druid_bear') {
      if (widthEl) widthEl.textContent = 'Pranken & Wirbel';
      if (dmgEl) dmgEl.textContent = '2x Schaden (+50% HP)';
    } else if (artifactDef.id === 'plasma_orbs') {
      if (widthEl) widthEl.textContent = '4 Orbs im Orbit';
      if (dmgEl) dmgEl.textContent = `${artifactDef.damage} Plasma-Schaden`;
    } else if (artifactDef.id === 'void_teleport') {
      if (widthEl) widthEl.textContent = 'Aufgedeckte Weltkarte';
      if (dmgEl) dmgEl.textContent = 'Sofortige Teleportation';
    } else {
      if (widthEl) widthEl.textContent = `${artifactDef.widthTiles} Kacheln (80px)`;
      if (dmgEl) dmgEl.textContent = `${artifactDef.damage} Feuerschaden`;
    }
  }

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // GROUND ARTIFACT MANAGEMENT
  // ---------------------------------------------------------------------------
  spawnGroundArtifact(x, y, dimension = DIMENSIONS.OVERWORLD, typeId = 'phoenix', fromShrine = false, subCaveId = null) {
    // 5. An jedem Schrein liegt maximal 1 Artefakt!
    const existing = this.groundArtifacts.find(a =>
      a.dimension === dimension &&
      (dimension !== DIMENSIONS.CAVES || a.subCaveId === subCaveId) &&
      Math.hypot(a.x - x, a.y - y) < 24
    );
    if (existing) {
      return existing; // Kein Duplikat am selben Schrein ablegen
    }

    const artifactDef = getArtifactDef(typeId);
    const artifact = {
      id: `art_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      typeId: artifactDef.id,
      def: artifactDef,
      x,
      y,
      dimension,
      subCaveId,
      fromShrine,
      bobTime: Math.random() * Math.PI * 2,
      lightPulse: 0
    };
    this.groundArtifacts.push(artifact);
    return artifact;
  }

  initShrineArtifacts(caves, cloudMap, overworldMap) {
    this.groundArtifacts = [];
    const ALL_ARTIFACTS = ['phoenix', 'druid_bear', 'plasma_orbs', 'void_teleport', 'frost_cone'];
    const getRandomType = () => ALL_ARTIFACTS[Math.floor(Math.random() * ALL_ARTIFACTS.length)];

    // 1. Shrines in Cloud World (Himmel): Zufälliges Artefakt aus allen 5 Typen
    if (cloudMap && Array.isArray(cloudMap.shrines)) {
      cloudMap.shrines.forEach(shrine => {
        const type = getRandomType();
        this.spawnGroundArtifact(shrine.x * TILE_SIZE + 8, (shrine.y + 1) * TILE_SIZE + 8, DIMENSIONS.CLOUDS, type, true, null);
      });
    }

    // 2. Shrines in Cave World (Höhlen): Jede Unterhöhle separat taggen
    if (caves && typeof caves === 'object') {
      if (Array.isArray(caves.shrines)) {
        caves.shrines.forEach(shrine => {
          const type = getRandomType();
          this.spawnGroundArtifact(shrine.x * TILE_SIZE + 8, (shrine.y + 1) * TILE_SIZE + 8, DIMENSIONS.CAVES, type, true, null);
        });
      } else {
        Object.entries(caves).forEach(([caveKey, cMap]) => {
          if (cMap && Array.isArray(cMap.shrines)) {
            cMap.shrines.forEach(shrine => {
              const type = getRandomType();
              this.spawnGroundArtifact(shrine.x * TILE_SIZE + 8, (shrine.y + 1) * TILE_SIZE + 8, DIMENSIONS.CAVES, type, true, caveKey);
            });
          }
        });
      }
    }

    // 3. Shrines in Overworld: Nur der uralte Leeren-Schrein im Abgrund (Void)
    if (overworldMap && Array.isArray(overworldMap.shrines)) {
      overworldMap.shrines.forEach(shrine => {
        const type = getRandomType();
        this.spawnGroundArtifact(shrine.x * TILE_SIZE + 8, (shrine.y + 1) * TILE_SIZE + 8, DIMENSIONS.OVERWORLD, type, true, null);
      });
    } else {
      const type = getRandomType();
      this.spawnGroundArtifact(108 * TILE_SIZE + 8, 63 * TILE_SIZE + 8, DIMENSIONS.OVERWORLD, type, true, null);
    }
  }

  handleArtifactRemoved(artifact) {
    if (!artifact || !artifact.fromShrine) return;
    // Prüfe, ob dieser Schrein bereits in der Respawn-Queue wartet
    const isQueued = this.respawnQueue.some(r =>
      r.dimension === artifact.dimension &&
      (artifact.dimension !== DIMENSIONS.CAVES || r.subCaveId === artifact.subCaveId) &&
      Math.hypot(r.x - artifact.x, r.y - artifact.y) < 24
    );
    if (isQueued) return;

    const ALL_ARTIFACTS = ['phoenix', 'druid_bear', 'plasma_orbs', 'void_teleport', 'frost_cone'];
    const nextType = ALL_ARTIFACTS[Math.floor(Math.random() * ALL_ARTIFACTS.length)];
    // Respawn nach 2 bis 3 Minuten (120 bis 180 Sekunden)
    const respawnDelay = 120 + Math.random() * 60;
    this.respawnQueue.push({
      x: artifact.x,
      y: artifact.y,
      dimension: artifact.dimension,
      subCaveId: artifact.subCaveId || null,
      typeId: nextType,
      timer: respawnDelay,
      maxTimer: respawnDelay
    });
  }

  dropMonsterArtifact(x, y, dimension = DIMENSIONS.OVERWORLD) {
    const allTypes = ['phoenix', 'druid_bear', 'plasma_orbs', 'void_teleport', 'frost_cone'];
    const chosenType = allTypes[Math.floor(Math.random() * allTypes.length)];
    const art = this.spawnGroundArtifact(x, y, dimension, chosenType, false, this.game?.activeSubCave || null);

    if (this.game?.combat) {
      this.game.combat.addFloatingText(`✨ ${art.def.icon} ${art.def.name.toUpperCase()}!`, x, y - 24, art.def.colorTheme || '#f59e0b', 1.3);
      for (let i = 0; i < 22; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = Math.random() * 50 + 20;
        this.game.combat.hitSparks.push({
          x,
          y: y - 10,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 15,
          color: Math.random() > 0.4 ? (art.def.colorTheme || '#f59e0b') : '#facc15',
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
    if (!player || player.isDead || this.isSwapModalOpen || this.pickupCooldown > 0) return;
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;
    const curSubCave = this.game?.activeSubCave || null;

    const PICKUP_DIST = 20;

    for (let i = this.groundArtifacts.length - 1; i >= 0; i--) {
      const art = this.groundArtifacts[i];
      if (art.dimension !== curDim) continue;
      if (curDim === DIMENSIONS.CAVES && art.subCaveId && curSubCave && art.subCaveId !== curSubCave) continue;

      const dist = Math.hypot(player.x - art.x, (player.y - 8) - art.y);
      if (dist <= PICKUP_DIST) {
        // 7. Nur fragen, wenn man BEREITS ein aktives Artefakt mit Aufladungen hat!
        const hasActiveArtifact = Boolean(player.artifact && player.artifact.id && player.artifact.charges > 0);

        if (!hasActiveArtifact) {
          // Direkt ausrüsten ohne jegliche Rückfrage!
          this.equipArtifact(player, art.def);
          this.handleArtifactRemoved(art);
          this.groundArtifacts.splice(i, 1);
          this.triggerPickupBanner(art.def);
          this.pickupCooldown = 0.5;
        } else {
          // Spieler hat bereits ein aktives Artefakt -> Swap Modal anzeigen
          this.openSwapModal(art, i);
        }
        break;
      }
    }
  }

  equipArtifact(player, artifactDef) {
    if (!player) return;

    // 4. Wenn der Spieler in Bärengestalt ist und das Artefakt wechselt: zurückverwandeln!
    if (player.isBearForm && typeof player.revertBearForm === 'function') {
      player.revertBearForm();
    }

    const def = getArtifactDef(artifactDef.id || artifactDef);
    player.artifact = {
      id: def.id,
      name: def.name,
      title: def.title,
      icon: def.icon,
      charges: def.maxCharges,
      maxCharges: def.maxCharges,
      cooldownTimer: 0,
      cooldownMax: def.cooldown,
      damage: def.damage,
      widthTiles: def.widthTiles,
      speed: def.speed,
      colorTheme: def.colorTheme,
      glowColor: def.glowColor
    };
    this.updateHUD();
  }

  openSwapModal(groundArtifact, index) {
    const player = this.game?.player;
    if (!player) return;

    // 7. Sicherheitsprüfung: Wenn kein aktives Artefakt vorhanden ist, direkt ausrüsten
    const hasActiveArtifact = Boolean(player.artifact && player.artifact.id && player.artifact.charges > 0);
    if (!hasActiveArtifact) {
      this.equipArtifact(player, groundArtifact.def);
      this.handleArtifactRemoved(groundArtifact);
      if (index >= 0 && index < this.groundArtifacts.length) {
        this.groundArtifacts.splice(index, 1);
      }
      this.triggerPickupBanner(groundArtifact.def);
      this.pickupCooldown = 0.5;
      return;
    }

    this.isSwapModalOpen = true;
    this.pendingGroundArtifact = { artifact: groundArtifact, index };

    const modal = getElement('artifact-swap-modal');
    if (!modal) return;

    const current = player.artifact;
    const incoming = groundArtifact.def;

    const curIcon = getElement('swap-current-icon');
    const curName = getElement('swap-current-name');
    const curCharges = getElement('swap-current-charges');

    const newIcon = getElement('swap-new-icon');
    const newName = getElement('swap-new-name');
    const newCharges = getElement('swap-new-charges');

    if (curIcon) curIcon.textContent = current.icon;
    if (curName) curName.textContent = current.name;
    if (curCharges) curCharges.textContent = `${current.charges} / ${current.maxCharges} Aufladungen`;

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

    // 4. Bärengestalt bei Artefaktwechsel auflösen
    if (player.isBearForm && typeof player.revertBearForm === 'function') {
      player.revertBearForm();
    }

    this.equipArtifact(player, artifact.def);
    this.handleArtifactRemoved(artifact);
    if (index >= 0 && index < this.groundArtifacts.length) {
      this.groundArtifacts.splice(index, 1);
    }
    this.triggerPickupBanner(artifact.def, 'NEUES ARTEFAKT AUSGERÜSTET!');
    this.pickupCooldown = 0.5;
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

    this.handleArtifactRemoved(artifact);
    if (index >= 0 && index < this.groundArtifacts.length) {
      this.groundArtifacts.splice(index, 1);
    }
    this.updateHUD();
    this.pickupCooldown = 0.5;
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
  // SPELL CASTING & AIMING STENCIL
  // ---------------------------------------------------------------------------
  startAiming(player) {
    if (!player || player.isDead) return false;
    if (!player.artifact || player.artifact.charges <= 0) return false;
    if (player.artifact.cooldownTimer > 0) return false;
    if (this.isTeleportModalOpen || this.isSwapModalOpen) return false;

    this.isAiming = true;
    this.aimTimer = 0;
    if (this.btnCastMagic) {
      this.btnCastMagic.classList.add('aiming-active');
    }
    return true;
  }

  cancelAiming() {
    this.isAiming = false;
    this.aimTimer = 0;
    if (this.btnCastMagic) {
      this.btnCastMagic.classList.remove('aiming-active');
    }
  }

  releaseAiming(player, map, combatManager) {
    if (!this.isAiming) return false;
    this.isAiming = false;
    this.aimTimer = 0;
    if (this.btnCastMagic) {
      this.btnCastMagic.classList.remove('aiming-active');
    }
    return this.castActiveSpell(player, map, combatManager);
  }

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

    const artId = player.artifact.id;

    // 1. DRUIDEN-BÄR GESTALT (Smaragd-Druide)
    if (artId === 'druid_bear') {
      player.activateBearForm(60);
      player.artifact.charges--;
      player.artifact.cooldownTimer = player.artifact.cooldownMax || 2.0;
      this.updateHUD();
      return true;
    }

    // 2. ROSA PLASMAKUGELN (4 Kugeln im Orbit)
    if (artId === 'plasma_orbs') {
      player.artifact.charges--;
      player.artifact.cooldownTimer = player.artifact.cooldownMax || 3.0;
      this.spawnPlasmaOrbSequence(player, combatManager);
      this.updateHUD();
      return true;
    }

    // 3. LEEREN-TELEPORT (Karte zur Zielauswahl öffnen)
    if (artId === 'void_teleport') {
      this.openTeleportModal();
      return true;
    }

    // 4. EISNEBEL (Hellblauer Frostkegel mit Einfrieren)
    if (artId === 'frost_cone') {
      return this.castFrostCone(player, map, combatManager);
    }

    // 4. RUBIN-PHÖNIX (Flammen-Sturm)
    let dirX = 0, dirY = 1;
    if (player.direction === 'up') { dirX = 0; dirY = -1; }
    else if (player.direction === 'down') { dirX = 0; dirY = 1; }
    else if (player.direction === 'left') { dirX = -1; dirY = 0; }
    else if (player.direction === 'right') { dirX = 1; dirY = 0; }
    else if (player.direction === 'up-left') { dirX = -0.7071; dirY = -0.7071; }
    else if (player.direction === 'up-right') { dirX = 0.7071; dirY = -0.7071; }
    else if (player.direction === 'down-left') { dirX = -0.7071; dirY = 0.7071; }
    else if (player.direction === 'down-right') { dirX = 0.7071; dirY = 0.7071; }

    player.artifact.charges--;
    player.artifact.cooldownTimer = player.artifact.cooldownMax || 3.0;

    const widthPx = (player.artifact.widthTiles || 5) * TILE_SIZE;

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
  // EISNEBEL (Hellblauer Frostkegel mit Einfrieren)
  // ---------------------------------------------------------------------------
  castFrostCone(player, map, combatManager) {
    if (!player || player.isDead) return false;
    player.artifact.charges--;
    player.artifact.cooldownTimer = player.artifact.cooldownMax || 2.5;
    this.updateHUD();

    const facingAngle = (typeof player.getFacingAngle === 'function') ? player.getFacingAngle() : 0;
    const px = player.x;
    const py = player.y - 8;
    const range = 115;
    const halfArc = 0.65; // ~75° cone
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;

    let hitCount = 0;
    if (this.game && this.game.enemyManager) {
      const activeEnemies = this.game.enemyManager.getActiveEnemies ? this.game.enemyManager.getActiveEnemies() : [];
      for (const enemy of activeEnemies) {
        if (enemy.dimension !== curDim || enemy.state === 'dead') continue;
        const dx = enemy.x - px;
        const dy = enemy.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist > range + (enemy.radius || 0)) continue;

        const angToEnemy = Math.atan2(dy, dx);
        let diff = angToEnemy - facingAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        if (Math.abs(diff) <= halfArc) {
          // Dauer abhängig von Monsterstärke: 0.5s (Bosse) bis 3.0s (schwache Monster)
          let duration = 2.0;
          if (typeof calculateFreezeDuration === 'function') {
            duration = calculateFreezeDuration(enemy);
          } else if (enemy.category === 'boss' || enemy.maxHp >= 500) {
            duration = 0.5;
          } else if (enemy.maxHp >= 300 || enemy.scale >= 1.3) {
            duration = 1.0;
          } else if (enemy.maxHp >= 100) {
            duration = 1.8;
          } else {
            duration = 3.0;
          }

          enemy.freezeTimer = duration;
          hitCount++;

          if (combatManager) {
            combatManager.addFloatingText(`❄️ EINGEFROREN (${duration.toFixed(1)}s)`, enemy.x, enemy.y - 20, '#38bdf8', 1.1);
            for (let s = 0; s < 14; s++) {
              const pAng = Math.random() * Math.PI * 2;
              const sp = Math.random() * 50 + 20;
              combatManager.hitSparks.push({
                x: enemy.x,
                y: enemy.y - 6,
                vx: Math.cos(pAng) * sp,
                vy: Math.sin(pAng) * sp - 10,
                color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
                size: Math.random() * 2.8 + 1.2,
                life: 0.5,
                maxLife: 0.5
              });
            }
          }
        }
      }
    }

    // Audio-visuelles Feedback
    if (combatManager) {
      combatManager.addFloatingText(`❄️ EISNEBEL! (${player.artifact.charges} übrig)`, px, py - 26, '#38bdf8', 1.2);
      for (let s = 0; s < 32; s++) {
        const spreadAng = facingAngle + (Math.random() - 0.5) * (halfArc * 1.8);
        const sp = Math.random() * 120 + 30;
        combatManager.hitSparks.push({
          x: px,
          y: py,
          vx: Math.cos(spreadAng) * sp,
          vy: Math.sin(spreadAng) * sp,
          color: Math.random() > 0.4 ? '#38bdf8' : (Math.random() > 0.5 ? '#bae6fd' : '#ffffff'),
          size: Math.random() * 3 + 1.5,
          life: 0.45,
          maxLife: 0.45
        });
      }
    }

    // Aktiver Zauber für visuelle Frostwellen-Animation
    this.activeSpells.push({
      id: `frost_${Date.now()}`,
      type: 'frost_cone',
      dimension: curDim,
      x: px,
      y: py,
      angle: facingAngle,
      range,
      arc: halfArc * 2,
      animTime: 0,
      life: 0.4,
      maxLife: 0.4
    });

    return true;
  }

  // ---------------------------------------------------------------------------
  // PLASMA ORBS LOGIC
  // ---------------------------------------------------------------------------
  spawnPlasmaOrbSequence(player, combatManager) {
    const sequence = {
      id: `plasma_${Date.now()}`,
      dimension: this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD,
      timer: 0,
      orbs: [0, 1, 2, 3].map(i => ({
        index: i,
        delay: i * 0.18, // short delay between spawns
        active: false,
        life: 1.35,
        maxLife: 1.35,
        orbitAngle: (i * Math.PI) / 2,
        exploded: false,
        damage: 45,
        knockback: 90
      }))
    };
    this.activePlasmaSequences.push(sequence);

    if (combatManager) {
      combatManager.addFloatingText(`🔮 PLASMA-ORBIT! (${player.artifact.charges} übrig)`, player.x, player.y - 28, '#ec4899', 1.2);
      for (let i = 0; i < 18; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = Math.random() * 60 + 20;
        combatManager.hitSparks.push({
          x: player.x,
          y: player.y - 10,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 10,
          color: Math.random() > 0.4 ? '#ec4899' : '#f472b6',
          size: Math.random() * 2.5 + 1.5,
          life: 0.5,
          maxLife: 0.5
        });
      }
    }
  }

  updatePlasmaOrbs(dt, player, combatManager, enemyManager) {
    if (!this.activePlasmaSequences.length) return;
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;

    for (let s = this.activePlasmaSequences.length - 1; s >= 0; s--) {
      const seq = this.activePlasmaSequences[s];
      if (seq.dimension !== curDim) continue;

      seq.timer += dt;
      let allExploded = true;

      for (let i = 0; i < seq.orbs.length; i++) {
        const orb = seq.orbs[i];
        if (orb.exploded) continue;

        allExploded = false;

        if (seq.timer >= orb.delay) {
          if (!orb.active) {
            orb.active = true;
            if (combatManager && player) {
              const ox = player.x + Math.cos(orb.orbitAngle) * 34;
              const oy = (player.y - 10) + Math.sin(orb.orbitAngle) * 34;
              for (let k = 0; k < 6; k++) {
                const a = Math.random() * Math.PI * 2;
                combatManager.hitSparks.push({
                  x: ox,
                  y: oy,
                  vx: Math.cos(a) * 30,
                  vy: Math.sin(a) * 30,
                  color: '#f472b6',
                  size: 2,
                  life: 0.3,
                  maxLife: 0.3
                });
              }
            }
          }

          orb.orbitAngle += dt * 4.2;
          orb.life -= dt;

          if (combatManager && player && Math.random() < 0.35) {
            const ox = player.x + Math.cos(orb.orbitAngle) * 34;
            const oy = (player.y - 10) + Math.sin(orb.orbitAngle) * 34;
            combatManager.hitSparks.push({
              x: ox + (Math.random() - 0.5) * 6,
              y: oy + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 15,
              vy: (Math.random() - 0.5) * 15,
              color: Math.random() > 0.4 ? '#f472b6' : '#ec4899',
              size: 2,
              life: 0.25,
              maxLife: 0.25
            });
          }

          if (orb.life <= 0) {
            orb.exploded = true;
            if (player && combatManager) {
              const ox = player.x + Math.cos(orb.orbitAngle) * 34;
              const oy = (player.y - 10) + Math.sin(orb.orbitAngle) * 34;
              combatManager.spawnPlasmaExplosion(ox, oy, 36, orb.damage, orb.knockback, enemyManager);
            }
          }
        }
      }

      if (allExploded) {
        this.activePlasmaSequences.splice(s, 1);
      }
    }
  }

  renderPlasmaOrbs(ctx, camera) {
    if (!this.activePlasmaSequences.length) return;
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;
    const player = this.game?.player;
    if (!player) return;

    const zoom = camera ? camera.zoom : 1;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    for (const seq of this.activePlasmaSequences) {
      if (seq.dimension !== curDim) continue;

      for (const orb of seq.orbs) {
        if (!orb.active || orb.exploded) continue;

        const worldX = player.x + Math.cos(orb.orbitAngle) * 34;
        const worldY = (player.y - 10) + Math.sin(orb.orbitAngle) * 34;

        const sx = (worldX - camX) * zoom;
        const sy = (worldY - camY) * zoom;

        const lifeFraction = Math.max(0, orb.life / orb.maxLife);
        const blinkFreq = 10 + (1 - lifeFraction) * 28;
        const blink = Math.sin(seq.timer * blinkFreq) > 0;

        ctx.save();

        const glowRad = (10 + Math.sin(seq.timer * 15) * 3) * zoom;
        if (typeof ctx.createRadialGradient === 'function') {
          const grad = ctx.createRadialGradient(sx, sy, 2 * zoom, sx, sy, glowRad);
          grad.addColorStop(0, blink ? 'rgba(244, 114, 182, 0.85)' : 'rgba(236, 72, 153, 0.45)');
          grad.addColorStop(0.6, 'rgba(219, 39, 119, 0.3)');
          grad.addColorStop(1, 'rgba(157, 23, 77, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sx, sy, glowRad, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = blink ? '#fdf2f8' : '#ec4899';
        ctx.beginPath();
        ctx.arc(sx, sy, (4 + Math.sin(seq.timer * 20) * 1) * zoom, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 1.2 * zoom;
        ctx.beginPath();
        ctx.arc(sx, sy, 6 * zoom, seq.timer * 8, seq.timer * 8 + Math.PI * 1.3);
        ctx.stroke();

        ctx.restore();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // VOID TELEPORT MAP MODAL LOGIC
  // ---------------------------------------------------------------------------
  openTeleportModal() {
    const modal = getElement('teleport-map-modal');
    if (!modal) return;
    this.isTeleportModalOpen = true;
    modal.classList.remove('hidden');
    this.renderTeleportMap();
  }

  closeTeleportModal() {
    const modal = getElement('teleport-map-modal');
    if (modal) modal.classList.add('hidden');
    this.isTeleportModalOpen = false;
    this.teleportHoverTile = null;
  }

  renderTeleportMap() {
    const canvas = this.teleportCanvas || getElement('teleportMapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = this.game?.player;
    const map = this.game?.map;
    if (!map) return;

    const mapW = map.width || MAP_WIDTH;
    const mapH = map.height || MAP_HEIGHT;

    ctx.fillStyle = '#090a10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / mapW;
    const scaleY = canvas.height / mapH;

    // Draw explored tiles / minimap background
    if (this.game?.minimap && this.game.minimap.bgCanvas) {
      ctx.drawImage(this.game.minimap.bgCanvas, 0, 0, canvas.width, canvas.height);
    } else {
      for (let ty = 0; ty < mapH; ty++) {
        for (let tx = 0; tx < mapW; tx++) {
          const isWalkable = map.isTileWalkable ? map.isTileWalkable(tx, ty) : true;
          ctx.fillStyle = isWalkable ? '#1e293b' : '#0f172a';
          ctx.fillRect(tx * scaleX, ty * scaleY, scaleX + 0.5, scaleY + 0.5);
        }
      }
    }

    // Fog of war: darken unexplored tiles if map.explored exists
    if (map.explored) {
      ctx.fillStyle = 'rgba(5, 7, 15, 0.82)';
      for (let ty = 0; ty < mapH; ty++) {
        for (let tx = 0; tx < mapW; tx++) {
          if (!map.explored[ty] || !map.explored[ty][tx]) {
            ctx.fillRect(tx * scaleX, ty * scaleY, scaleX + 0.5, scaleY + 0.5);
          }
        }
      }
    }

    // Grid lines for tactical map feel
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.15)';
    ctx.lineWidth = 1;
    const gridStepX = scaleX * 10;
    for (let gx = 0; gx < canvas.width; gx += gridStepX) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, canvas.height);
      ctx.stroke();
    }
    const gridStepY = scaleY * 10;
    for (let gy = 0; gy < canvas.height; gy += gridStepY) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(canvas.width, gy);
      ctx.stroke();
    }

    // Player position marker (Pulsing Cyan/Gold Star)
    if (player) {
      const pTileX = player.x / TILE_SIZE;
      const pTileY = player.y / TILE_SIZE;
      const px = pTileX * scaleX;
      const py = pTileY * scaleY;

      const time = Date.now() / 1000;
      const ringR = 6 + Math.sin(time * 5) * 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(px, py, ringR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hovered Target Reticle
    if (this.teleportHoverTile) {
      const { tx, ty, valid } = this.teleportHoverTile;
      const hx = (tx + 0.5) * scaleX;
      const hy = (ty + 0.5) * scaleY;

      ctx.save();
      ctx.strokeStyle = valid ? '#c084fc' : '#ef4444';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(hx, hy, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(hx - 14, hy); ctx.lineTo(hx - 6, hy);
      ctx.moveTo(hx + 6, hy); ctx.lineTo(hx + 14, hy);
      ctx.moveTo(hx, hy - 14); ctx.lineTo(hx, hy - 6);
      ctx.moveTo(hx, hy + 6); ctx.lineTo(hx, hy + 14);
      ctx.stroke();

      ctx.fillStyle = valid ? 'rgba(168, 85, 247, 0.25)' : 'rgba(239, 68, 68, 0.25)';
      ctx.beginPath();
      ctx.arc(hx, hy, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  handleTeleportClick(clientX, clientY) {
    const canvas = this.teleportCanvas || getElement('teleportMapCanvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const map = this.game?.map;
    const player = this.game?.player;
    if (!map || !player) return;

    const mapW = map.width || MAP_WIDTH;
    const mapH = map.height || MAP_HEIGHT;

    const clickX = ((clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((clientY - rect.top) / rect.height) * canvas.height;

    const scaleX = canvas.width / mapW;
    const scaleY = canvas.height / mapH;

    const tx = Math.floor(clickX / scaleX);
    const ty = Math.floor(clickY / scaleY);

    if (tx < 0 || tx >= mapW || ty < 0 || ty >= mapH) return;

    const isWalkable = map.isTileWalkable ? map.isTileWalkable(tx, ty) : true;
    const isExplored = !map.explored || (map.explored[ty] && map.explored[ty][tx]);

    if (!isWalkable || !isExplored) {
      const tooltip = getElement('teleport-target-tooltip');
      if (tooltip) {
        tooltip.textContent = !isExplored ? '❌ Unerforschter Ort!' : '❌ Nicht begehbar!';
        tooltip.classList.remove('hidden');
        setTimeout(() => tooltip?.classList.add('hidden'), 1200);
      }
      return;
    }

    const targetWorldX = tx * TILE_SIZE + TILE_SIZE / 2;
    const targetWorldY = ty * TILE_SIZE + TILE_SIZE / 2;

    const combat = this.game?.combat;
    if (combat) {
      combat.spawnVoidTeleportVFX(player.x, player.y, false);
    }

    player.x = targetWorldX;
    player.y = targetWorldY;
    if (this.game?.camera) {
      this.game.camera.centerOn(targetWorldX, targetWorldY);
    }

    if (combat) {
      combat.spawnVoidTeleportVFX(player.x, player.y, true);
      combat.addFloatingText('🌌 LEEREN-SPRUNG!', player.x, player.y - 28, '#c084fc', 1.3);
    }

    if (player.artifact) {
      player.artifact.charges--;
      player.artifact.cooldownTimer = player.artifact.cooldownMax || 1.0;
    }

    this.closeTeleportModal();
    this.updateHUD();
  }

  // ---------------------------------------------------------------------------
  // UPDATE LOOP
  // ---------------------------------------------------------------------------
  update(dt, player, map, combatManager, enemyManager) {
    const curDim = this.game ? this.game.currentDimension : DIMENSIONS.OVERWORLD;

    // Tick pickup cooldown
    if (this.pickupCooldown > 0) {
      this.pickupCooldown = Math.max(0, this.pickupCooldown - dt);
    }

    // 0. Update Shrine Respawn Queue (2-3 Min / 120-180s)
    for (let r = this.respawnQueue.length - 1; r >= 0; r--) {
      const respawn = this.respawnQueue[r];
      respawn.timer -= dt;
      if (respawn.timer <= 0) {
        this.spawnGroundArtifact(respawn.x, respawn.y, respawn.dimension, respawn.typeId, true, respawn.subCaveId || null);
        const def = getArtifactDef(respawn.typeId);
        if (combatManager && (!this.game || this.game.currentDimension === respawn.dimension)) {
          combatManager.addFloatingText(`✨ ARTEFAKT RESPAWNT: ${def.name.toUpperCase()}!`, respawn.x, respawn.y - 20, def.colorTheme || '#38bdf8', 1.6);
          for (let s = 0; s < 25; s++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = Math.random() * 60 + 20;
            combatManager.hitSparks.push({
              x: respawn.x,
              y: respawn.y - 8,
              vx: Math.cos(ang) * sp,
              vy: Math.sin(ang) * sp - 20,
              color: def.colorTheme || '#38bdf8',
              size: Math.random() * 3 + 2,
              life: 0.8,
              maxLife: 0.8
            });
          }
        }
        this.respawnQueue.splice(r, 1);
      }
    }

    // Aiming state tracking
    if (this.isAiming) {
      this.aimTimer += dt;
      if (!player || player.isDead || !player.artifact || player.artifact.charges <= 0) {
        this.cancelAiming();
      }
    }

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

    // 4. Update Active Spells (Phoenix & Frost Cone)
    const mapPixelW = (map ? map.width : MAP_WIDTH) * TILE_SIZE;
    const mapPixelH = (map ? map.height : MAP_HEIGHT) * TILE_SIZE;

    for (let i = this.activeSpells.length - 1; i >= 0; i--) {
      const spell = this.activeSpells[i];
      if (spell.dimension !== curDim) continue;

      if (spell.type === 'frost_cone') {
        spell.animTime += dt;
        spell.life -= dt;
        if (spell.life <= 0) {
          this.activeSpells.splice(i, 1);
        }
        continue;
      }

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

    // 5. Update Plasma Orbs
    this.updatePlasmaOrbs(dt, player, combatManager, enemyManager);

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

    // Dynamic icon on the spell button
    const iconEl = this.magicHudSlot.querySelector('.magic-btn-icon');
    if (iconEl) {
      iconEl.textContent = player.artifact.icon || '🔥';
    }

    // Dynamic border & glow based on artifact colorTheme
    if (this.btnCastMagic) {
      const col = player.artifact.colorTheme || '#ef4444';
      const glow = player.artifact.glowColor || 'rgba(239, 68, 68, 0.5)';
      this.btnCastMagic.style.borderColor = col;
      this.btnCastMagic.style.boxShadow = `0 0 12px ${glow}`;
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

    // 1. Ground Artifacts with unique themed glow & icons
    this.renderGroundArtifacts(ctx, camera, curDim);

    // 2. Active Spell Projectiles (Phönix)
    this.renderActiveSpells(ctx, camera, curDim);

    // 3. Pink Plasma Orbs in Orbit
    this.renderPlasmaOrbs(ctx, camera);

    // 4. Player Glitter Aura
    if (player && player.artifact && player.artifact.charges > 0) {
      this.renderPlayerGlitter(ctx, camera);
    }

    // 5. Attack Preview Aiming Stencil (Schablone bei Halten)
    if (this.isAiming) {
      this.renderAimingStencil(ctx, camera);
    }
  }

  renderGroundArtifacts(ctx, camera, curDim) {
    const zoom = camera ? camera.zoom : 1;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;
    const curSubCave = this.game?.activeSubCave || null;

    for (const art of this.groundArtifacts) {
      if (art.dimension !== curDim) continue;
      if (curDim === DIMENSIONS.CAVES && art.subCaveId && curSubCave && art.subCaveId !== curSubCave) continue;

      const sx = (art.x - camX) * zoom;
      const sy = (art.y - camY) * zoom;

      // Distance culling
      if (sx < -40 || sx > ctx.canvas.width + 40 || sy < -60 || sy > ctx.canvas.height + 40) continue;

      const bobY = Math.sin(art.bobTime) * 4;
      const py = sy + bobY;
      const themeColor = art.def.colorTheme || '#ef4444';
      const glowColor = art.def.glowColor || 'rgba(239, 68, 68, 0.5)';

      ctx.save();

      // Vertical Heavenly Light Pillar
      const grad = ctx.createLinearGradient(sx, py - 45 * zoom, sx, py + 10 * zoom);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.6, glowColor);
      grad.addColorStop(1, 'rgba(250, 204, 21, 0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(sx - 10 * zoom, py - 45 * zoom, 20 * zoom, 55 * zoom);

      // Rotating Magic Runes Sigil on ground
      ctx.save();
      ctx.translate(sx, sy + 6 * zoom);
      ctx.scale(1, 0.38); // Flattened perspective oval
      ctx.rotate(art.bobTime * 0.5);
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1.5 * zoom;
      ctx.beginPath();
      ctx.arc(0, 0, 16 * zoom, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(0, 0, 10 * zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Floating Papercraft Gem Orb
      const orbRadius = 7 * zoom;

      // Soft outer glow
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(sx, py, (orbRadius + 4) * (1 + art.lightPulse * 0.2), 0, Math.PI * 2);
      ctx.fill();

      // Gem Orb Body
      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.arc(sx, py, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // Top Highlight fold
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
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

      // Floating Artifact Icon Emoji above Orb
      if (typeof ctx.fillText === 'function') {
        ctx.font = `${Math.round(11 * zoom)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(art.def.icon || '✨', sx, py - 12 * zoom);
      }

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

      // Frost-Kegel Wellen-Animation
      if (spell.type === 'frost_cone') {
        const progress = Math.min(1.0, 1.0 - (spell.life / (spell.maxLife || 0.4)));
        const curR = (spell.range * (0.35 + progress * 0.65)) * zoom;
        const alpha = Math.sin(progress * Math.PI);

        ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.35})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, curR, -spell.arc / 2, spell.arc / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `rgba(224, 242, 254, ${alpha * 0.85})`;
        ctx.lineWidth = 2.5 * zoom;
        ctx.beginPath();
        ctx.arc(0, 0, curR, -spell.arc / 2, spell.arc / 2);
        ctx.stroke();

        ctx.restore();
        continue;
      }

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

  // ---------------------------------------------------------------------------
  // ATTACK PREVIEW AIMING STENCIL (Schablone bei Halten)
  // ---------------------------------------------------------------------------
  renderAimingStencil(ctx, camera) {
    const player = this.game?.player;
    if (!player || !player.artifact || player.artifact.charges <= 0 || player.isDead) return;

    const zoom = camera ? camera.zoom : 1;
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    const px = player.x;
    const py = player.y - 8;
    const sx = (px - camX) * zoom;
    const sy = (py - camY) * zoom;

    const facingAngle = (typeof player.getFacingAngle === 'function') ? player.getFacingAngle() : 0;
    const artId = player.artifact.id;
    const t = Date.now() / 1000;

    ctx.save();

    // 1. RUBIN-PHÖNIX: 5 Kacheln (80px) breite Schneise in Blickrichtung
    if (artId === 'phoenix') {
      ctx.translate(sx, sy);
      ctx.rotate(facingAngle);

      const corridorLength = 260 * zoom;
      const corridorHalfWidth = 40 * zoom; // 80px Gesamtbreite (5 Kacheln)

      // Halbtransparenter Flammen-Schleier
      const grad = ctx.createLinearGradient(0, 0, corridorLength, 0);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.42)');
      grad.addColorStop(0.7, 'rgba(245, 158, 11, 0.22)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, -corridorHalfWidth, corridorLength, corridorHalfWidth * 2);

      // Gestrichelte feuerrote Seitenlinien
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.85)';
      ctx.lineWidth = 2 * zoom;
      ctx.setLineDash([8 * zoom, 5 * zoom]);
      ctx.lineDashOffset = -t * 32 * zoom;
      ctx.beginPath();
      ctx.moveTo(0, -corridorHalfWidth);
      ctx.lineTo(corridorLength, -corridorHalfWidth);
      ctx.moveTo(0, corridorHalfWidth);
      ctx.lineTo(corridorLength, corridorHalfWidth);
      ctx.stroke();
      ctx.setLineDash([]);

      // Flugbahn-Mittelachse
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.55)';
      ctx.lineWidth = 1 * zoom;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(corridorLength * 0.9, 0);
      ctx.stroke();

      // Animierte wandernde Chevrons (>> Vorwärtsflug-Indikatoren)
      const chevCount = 4;
      for (let c = 0; c < chevCount; c++) {
        const progress = ((t * 1.6 + c / chevCount) % 1.0);
        const cx = progress * corridorLength;
        const alpha = Math.sin(progress * Math.PI);
        ctx.strokeStyle = `rgba(254, 240, 138, ${alpha * 0.9})`;
        ctx.lineWidth = 2.5 * zoom;
        ctx.beginPath();
        ctx.moveTo(cx - 12 * zoom, -20 * zoom);
        ctx.lineTo(cx + 4 * zoom, 0);
        ctx.lineTo(cx - 12 * zoom, 20 * zoom);
        ctx.stroke();
      }
    }

    // 2. ROSA PLASMAKUGELN: Orbit-Ring & 4 Detonations-Zonen um den Spieler
    else if (artId === 'plasma_orbs') {
      ctx.translate(sx, sy);
      const orbitR = 42 * zoom;
      const blastR = 24 * zoom;

      // Zonen-Hintergrund
      ctx.fillStyle = 'rgba(236, 72, 153, 0.14)';
      ctx.beginPath();
      ctx.arc(0, 0, orbitR + blastR, 0, Math.PI * 2);
      ctx.fill();

      // Pulsierender gestrichelter Orbit-Pfad
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.85)';
      ctx.lineWidth = 2 * zoom;
      ctx.setLineDash([6 * zoom, 4 * zoom]);
      ctx.lineDashOffset = -t * 24 * zoom;
      ctx.beginPath();
      ctx.arc(0, 0, orbitR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4 Detonations-Retikel an den 4 Orbit-Positionen
      for (let i = 0; i < 4; i++) {
        const orbAngle = t * 2.5 + (i * Math.PI / 2);
        const ox = Math.cos(orbAngle) * orbitR;
        const oy = Math.sin(orbAngle) * orbitR;

        // Explosions-Wirkungsbereich
        ctx.fillStyle = 'rgba(236, 72, 153, 0.22)';
        ctx.beginPath();
        ctx.arc(ox, oy, blastR * (0.85 + Math.sin(t * 6 + i) * 0.15), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 1.5 * zoom;
        ctx.beginPath();
        ctx.arc(ox, oy, 6 * zoom, 0, Math.PI * 2);
        ctx.stroke();

        // Ziel-Fadenkreuz
        ctx.beginPath();
        ctx.moveTo(ox - 10 * zoom, oy);
        ctx.lineTo(ox + 10 * zoom, oy);
        ctx.moveTo(ox, oy - 10 * zoom);
        ctx.lineTo(ox, oy + 10 * zoom);
        ctx.stroke();
      }
    }

    // 3. EISNEBEL: 70° Frostkegel vor dem Spieler
    else if (artId === 'frost_cone') {
      ctx.translate(sx, sy);
      const coneR = 115 * zoom;
      const halfArc = 0.65; // ~75° Kegel (±37.5°)

      // Kegel-Pfad
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, coneR, facingAngle - halfArc, facingAngle + halfArc);
      ctx.closePath();

      // Frost-Fächer Farbverlauf
      const grad = ctx.createRadialGradient(0, 0, 10 * zoom, 0, 0, coneR);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.42)');
      grad.addColorStop(0.7, 'rgba(125, 211, 252, 0.25)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Gestrichelter cyanblauer Bogenrand
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.9)';
      ctx.lineWidth = 2 * zoom;
      ctx.setLineDash([7 * zoom, 4 * zoom]);
      ctx.lineDashOffset = -t * 20 * zoom;
      ctx.stroke();
      ctx.setLineDash([]);

      // Radiale Begrenzungslinien
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.8 * zoom;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(facingAngle - halfArc) * coneR, Math.sin(facingAngle - halfArc) * coneR);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(facingAngle + halfArc) * coneR, Math.sin(facingAngle + halfArc) * coneR);
      ctx.stroke();

      // Mittlere Ziel-Leitlinie
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1 * zoom;
      ctx.setLineDash([4 * zoom, 4 * zoom]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(facingAngle) * coneR * 0.9, Math.sin(facingAngle) * coneR * 0.9);
      ctx.stroke();
      ctx.setLineDash([]);

      // Eiskristall-Glanzpunkte im Kegel
      for (let s = 1; s <= 3; s++) {
        const sDist = (coneR * 0.3 * s) * (0.8 + Math.sin(t * 3 + s) * 0.1);
        const sAng = facingAngle + Math.sin(t * 2 + s * 1.5) * (halfArc * 0.6);
        const gx = Math.cos(sAng) * sDist;
        const gy = Math.sin(sAng) * sDist;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx, gy, 2 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. SMARAGD-DRUIDE / LEEREN-TELEPORT
    else if (artId === 'druid_bear') {
      ctx.translate(sx, sy);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.75)';
      ctx.lineWidth = 2 * zoom;
      ctx.setLineDash([5 * zoom, 5 * zoom]);
      ctx.lineDashOffset = -t * 15 * zoom;
      ctx.beginPath();
      ctx.arc(0, 0, 32 * zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (artId === 'void_teleport') {
      ctx.translate(sx, sy);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
      ctx.lineWidth = 2 * zoom;
      ctx.beginPath();
      ctx.arc(0, 0, 24 * zoom, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
