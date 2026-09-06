import { BESTIARY_DATA } from '../bestiary.js';
import { TILE_SIZE, DIMENSIONS, ENEMY_CONFIG, LOOT_TYPES, RAMPS, TILES, OBJECTS, TILE_PROPS, OBJ_PROPS } from './constants.js';

// Index BESTIARY_DATA by ID for quick O(1) lookup
export const BESTIARY_MAP = {};
BESTIARY_DATA.forEach(def => {
  BESTIARY_MAP[def.id] = def;
});

/** Gibt an, ob ein Monster fliegt oder schwebt (darf über Wasser/Abgründen existieren) */
export function isFlyingEnemy(typeId) {
  return typeId === 'gazer_of_the_void' ||
         typeId === 'sky_harpy' ||
         typeId === 'star_astromancer' ||
         typeId === 'lava_core';
}

/** Prüft, ob ein Kachelfeld für Boden-Gegner begehbar ist */
export function isTileWalkable(map, tx, ty) {
  if (!map || !map.isValid(tx, ty)) return false;
  if (map.isSolid && map.isSolid(tx, ty)) return false;
  if (map.isDeadly && map.isDeadly(tx, ty)) return false;

  const ground = map.getGroundTile ? map.getGroundTile(tx, ty) : (map.ground ? map.ground[ty]?.[tx] : 0);
  if (ground === TILES.WATER ||
      ground === TILES.SWAMP_WATER ||
      ground === TILES.CAVE_WATER ||
      ground === TILES.VOID_LAKE ||
      ground === TILES.SKY_ABYSS) {
    return false;
  }

  const obj = map.getObjectTile ? map.getObjectTile(tx, ty) : (map.objects ? map.objects[ty]?.[tx] : 0);
  if (obj && OBJ_PROPS[obj] && OBJ_PROPS[obj].solid) {
    return false;
  }

  if (map.checkTreeCollision && map.checkTreeCollision(tx * TILE_SIZE + 8, ty * TILE_SIZE + 8, 4)) {
    return false;
  }

  return true;
}

/** Sucht in Spiralen das nächste gültige begehbare Kachelfeld */
export function findNearestWalkableTile(map, tx, ty, maxRadius = 14) {
  if (isTileWalkable(map, tx, ty)) return { tx, ty };

  for (let r = 1; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) === r || Math.abs(dy) === r) {
          const nx = tx + dx;
          const ny = ty + dy;
          if (isTileWalkable(map, nx, ny)) {
            return { tx: nx, ty: ny };
          }
        }
      }
    }
  }
  return { tx, ty };
}

/**
 * EnemyEntity - Ein lebendiges, animiertes Monster in der Spielwelt
 */
export class EnemyEntity {
  constructor(typeId, x, y, dimension = DIMENSIONS.OVERWORLD, packId = null, options = {}) {
    this.def = BESTIARY_MAP[typeId];
    if (!this.def) {
      throw new Error(`Unbekannter Gegner-Typ: ${typeId}`);
    }

    this.id = options.id || `${typeId}_${Math.random().toString(36).substr(2, 7)}`;
    this.typeId = typeId;
    this.name = this.def.name;
    this.title = this.def.title;
    this.category = this.def.category;
    this.dimension = dimension;
    this.packId = packId;

    // Welt-Position (in Pixeln)
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.vx = 0;
    this.vy = 0;
    this.elevation = options.elevation || 0;
    this.spawnOptions = options;

    // Proportionale Skalierung (Schwache Monster kleiner, Kolosse/Bosse riesig!)
    this.scale = options.scale ?? this.def.scale ?? (this.typeId === 'green_slime' ? 0.48 : (this.category === 'boss' ? 1.6 : (this.typeId === 'cave_weaver' || this.typeId === 'lava_core' ? 0.72 : 1.0)));

    // Hitbox-Radius proportional zur Skalierung
    let baseRadius = 9;
    if (this.category === 'boss') {
      baseRadius = 18;
    } else if (this.category === 'reptile' || this.category === 'beast') {
      baseRadius = 11;
    } else if (this.typeId === 'green_slime') {
      baseRadius = 6;
    } else if (this.typeId === 'cave_weaver' || this.typeId === 'lava_core') {
      baseRadius = 7;
    }
    this.radius = Math.max(3, Math.round(baseRadius * this.scale));

    // Werte aus Bestiarium / Optionen
    this.maxHp = options.hp ?? this.def.stats.hp ?? 50;
    this.hp = this.maxHp;
    this.atk = options.atk ?? this.def.stats.atk ?? 20;

    // XP-Ertrag bei Besiegung (stärkere Gegner geben deutlich mehr EP)
    this.xpValue = options.xpValue ?? this.def.xpValue ?? (this.category === 'boss' ? 65 : (this.scale < 0.85 ? 4 : 16));

    // Geschwindigkeit
    const spdStr = this.def.stats.spd || 'Mittel';
    if (spdStr.includes('Sehr Schnell')) this.baseSpeed = 92;
    else if (spdStr.includes('Schnell')) this.baseSpeed = 74;
    else if (spdStr.includes('Mittel')) this.baseSpeed = 52;
    else if (spdStr.includes('Langsam')) this.baseSpeed = 34;
    else if (spdStr.includes('Schwerfällig')) this.baseSpeed = 24;
    else if (spdStr.includes('Stationär')) this.baseSpeed = 0;
    else this.baseSpeed = 48;

    // Reichweite
    const rngStr = this.def.stats.rng || '40px';
    const parsedRng = parseInt(rngStr, 10);
    this.attackRange = isNaN(parsedRng) ? 40 : parsedRng;

    // KI & Animationsstatus
    this.state = 'idle'; // 'idle' | 'walk' | 'alert' | 'attack' | 'cooldown' | 'hurt' | 'dead'
    this.animTime = Math.random() * 5;
    this.hitFlash = 0;
    this.telegraphTimer = 0;
    this.cooldownTimer = Math.random() * 1.5;
    this.wanderTimer = Math.random() * 2 + 1;
    this.wanderTarget = { x, y };

    this.alertEmoteTimer = 0;
    this.facing = 'down';

    // Boar Charge State
    this.chargeDir = { x: 0, y: 0 };
    this.isCharging = false;
    this.chargeTimer = 0;

    // Anti-Kiting & Spezialfähigkeiten
    this.teleportCooldown = Math.random() * 2 + 4.0;
    this.isTeleporting = false;
    this.teleportTimer = 0;
    this.teleportDest = null;
    this.hookCooldown = Math.random() * 2 + 4.5;
    this.isHooking = false;

    // Freeze Status (Eisnebel Artefakt)
    this.freezeTimer = 0;
  }

  update(dt, player, map, enemyManager, combatManager) {
    if (this.state === 'dead') return;

    // Wasser-Ertrinken für nicht-fliegende Gegner (falls durch Knockback oder Wanderung im Wasser gelandet)
    if (!isFlyingEnemy(this.typeId) && map) {
      const tx = Math.floor(this.x / TILE_SIZE);
      const ty = Math.floor(this.y / TILE_SIZE);
      const ground = map.getGroundTile ? map.getGroundTile(tx, ty) : 0;
      const isWater = (ground === TILES.WATER || ground === TILES.SWAMP_WATER || ground === TILES.CAVE_WATER || ground === TILES.VOID_LAKE);
      const isBridge = (ground === TILES.BRIDGE_H || ground === TILES.BRIDGE_V || ground === TILES.RAINBOW_BRIDGE_H || ground === TILES.RAINBOW_BRIDGE_V);
      if (isWater && !isBridge) {
        this.hp = 0;
        this.state = 'dead';
        this.die(combatManager);
        if (combatManager) {
          combatManager.addFloatingText('🌊 ERTRUNKEN!', this.x, this.y - 20, '#38bdf8', 1.3);
          for (let s = 0; s < 18; s++) {
            const spAng = Math.random() * Math.PI * 2;
            const sp = Math.random() * 60 + 20;
            combatManager.hitSparks.push({
              dimension: this.dimension,
              x: this.x,
              y: this.y,
              vx: Math.cos(spAng) * sp,
              vy: Math.sin(spAng) * sp - 15,
              color: Math.random() > 0.3 ? '#38bdf8' : '#e0f2fe',
              size: Math.random() * 3 + 1.5,
              life: 0.5,
              maxLife: 0.5
            });
          }
        }
        return;
      }
    }

    // Einfrier-Zustand durch Eisnebel-Artefakt: Vollständige Lähmung (keine Bewegung, keine Angriffe)
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      if (this.hitFlash > 0) this.hitFlash -= dt;
      return;
    }

    this.animTime += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    if (this.alertEmoteTimer > 0) this.alertEmoteTimer -= dt;
    if (this.teleportCooldown > 0) this.teleportCooldown -= dt;
    if (this.hookCooldown > 0) this.hookCooldown -= dt;

    // Nur in der aktiven Dimension berechnen
    if (this.dimension !== enemyManager.game.currentDimension) return;

    // Wenn der Client im LAN-Modus NICHT der Master-Client ist:
    // Der Master-Client simuliert Bewegung, KI und Angriffe autoritativ.
    // Nicht-Master-Clients führen nur die Animation aus und interpolieren Koordinaten!
    if (enemyManager && enemyManager.isMasterClient === false) {
      return;
    }

    // Distanz zum Spieler
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distToPlayer = Math.hypot(dx, dy);

    // Spezial: Teleportation im Gange
    if (this.isTeleporting) {
      this.teleportTimer -= dt;
      if (this.teleportTimer <= 0) {
        this.completeTeleport(player, map, combatManager);
      }
      return;
    }

    // Ausrichtung
    if (Math.abs(dx) > Math.abs(dy)) {
      this.facing = dx > 0 ? 'right' : 'left';
    } else {
      this.facing = dy > 0 ? 'down' : 'up';
    }

    // Wenn KI deaktiviert (z.B. friedlicher Show-Modus)
    if (!enemyManager.aiActive) {
      this.state = 'idle';
      return;
    }

    // Erfassungsreichweite
    const detectionRange = (this.category === 'range' || this.typeId === 'star_astromancer')
      ? ENEMY_CONFIG.DETECTION_RADIUS_SCOUT
      : ENEMY_CONFIG.DETECTION_RADIUS_DEFAULT;

    // =========================================================================
    // 1. ZUSTANDSAUTOMAT (FSM)
    // =========================================================================

    // A) Wenn im Angriff oder Telegraphieren
    if (this.state === 'attack') {
      this.telegraphTimer -= dt;

      // Spezial: Wildschwein-Ansturm (Charge)
      if (this.typeId === 'tusk_boar' && this.isCharging) {
        this.chargeTimer -= dt;
        const cSpeed = this.baseSpeed * 2.6;
        const nextX = this.x + this.chargeDir.x * cSpeed * dt;
        const nextY = this.y + this.chargeDir.y * cSpeed * dt;

        // Kollision beim Stürmen
        const tx = Math.floor(nextX / TILE_SIZE);
        const ty = Math.floor(nextY / TILE_SIZE);
        const hitWall = map.isSolid ? map.isSolid(tx, ty) : false;

        if (hitWall || this.chargeTimer <= 0) {
          // Betäubung bei Wandaufprall
          this.isCharging = false;
          this.state = 'idle';
          this.cooldownTimer = hitWall ? 2.5 : 1.2;
          if (hitWall && combatManager) {
            combatManager.addHitSparks(this.x, this.y, '#f59e0b', 12);
            combatManager.addFloatingText('💫 BENOMMEN!', this.x, this.y - 18, '#fde047');
          }
        } else {
          this.x = nextX;
          this.y = nextY;
          // Prüfe Treffer auf Spieler während des Ansturms
          if (Math.hypot(player.x - this.x, player.y - this.y) <= (this.radius + player.radius + 4)) {
            this.hitPlayer(player, combatManager, this.atk * 1.3, this.chargeDir);
            this.isCharging = false;
            this.state = 'idle';
            this.cooldownTimer = 1.5;
          }
        }
        return;
      }

      if (this.telegraphTimer <= 0) {
        if (this.isHooking) {
          this.isHooking = false;
          if (combatManager) {
            combatManager.fireGrapplingHook(this, player.x, player.y);
          }
          this.state = 'idle';
          this.cooldownTimer = 0.9;
          return;
        }

        this.executeAttack(player, combatManager, enemyManager);
        this.state = 'idle';
        this.cooldownTimer = ENEMY_CONFIG.ATTACK_RECOVERY_TIME + Math.random() * 0.4;
      }
      return;
    }

    // B) Aggro & Annäherung
    const isAggro = distToPlayer <= detectionRange;

    if (isAggro && !player.isDead) {
      // Wenn frisch aufgeschreckt -> Alarm-Emote und Rudel alarmieren!
      if (this.state === 'idle' || this.state === 'wander') {
        this.alertEmoteTimer = 1.0;
        enemyManager.alertPack(this.packId, this.x, this.y);
      }

      // 1. Anti-Kiting: Leeren-Monster teleportieren sich zum Spieler!
      if (this.category === 'void' && distToPlayer > 75 && this.teleportCooldown <= 0 && this.state !== 'attack') {
        this.startTeleport(player, map, combatManager);
        return;
      }

      // 2. Anti-Kiting: Yeti und Trolle haben einen Enterhaken, mit dem sie den Spieler heranziehen!
      if ((this.typeId === 'boulder_troll' || this.typeId === 'frost_giant') &&
          distToPlayer >= 65 && distToPlayer <= 230 &&
          this.hookCooldown <= 0 && this.state !== 'attack' && this.cooldownTimer <= 0) {
        this.startHookAttack(player, combatManager);
        return;
      }

      // Bereite Angriff vor, wenn in Angriffsreichweite
      if (distToPlayer <= this.attackRange && this.cooldownTimer <= 0) {
        this.startAttack(player, combatManager);
        return;
      }

      // Bewegung zum Spieler (wenn nicht stationär)
      if (this.baseSpeed > 0) {
        this.state = 'walk';
        let moveX = dx / (distToPlayer || 1);
        let moveY = dy / (distToPlayer || 1);

        // Fernkämpfer halten Abstand! Weichen zurück, wenn Spieler zu nah (< 45px)
        if (this.category === 'range' && distToPlayer < 45) {
          moveX = -moveX;
          moveY = -moveY;
        }

        this.moveWithCollision(moveX, moveY, this.baseSpeed, dt, map);
      } else {
        this.state = 'idle';
      }
    } else {
      // C) Friedliches Umherstreifen (Wander) nahe Heimatort
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = Math.random() * 3 + 2;
        const angle = Math.random() * Math.PI * 2;
        const wDist = Math.random() * ENEMY_CONFIG.WANDER_RADIUS;
        this.wanderTarget = {
          x: this.homeX + Math.cos(angle) * wDist,
          y: this.homeY + Math.sin(angle) * wDist
        };
      }

      const distToWander = Math.hypot(this.wanderTarget.x - this.x, this.wanderTarget.y - this.y);
      if (distToWander > 8 && this.baseSpeed > 0) {
        this.state = 'walk';
        const wdx = (this.wanderTarget.x - this.x) / distToWander;
        const wdy = (this.wanderTarget.y - this.y) / distToWander;
        this.moveWithCollision(wdx, wdy, this.baseSpeed * 0.45, dt, map);
      } else {
        this.state = 'idle';
      }
    }
  }

  moveWithCollision(dirX, dirY, speed, dt, map) {
    const nextX = this.x + dirX * speed * dt;
    const nextY = this.y + dirY * speed * dt;

    // X-Achse
    const tx1 = Math.floor((nextX + (dirX > 0 ? this.radius : -this.radius)) / TILE_SIZE);
    const ty1 = Math.floor(this.y / TILE_SIZE);
    if (!map.isSolid || !map.isSolid(tx1, ty1)) {
      this.x = nextX;
    }

    // Y-Achse
    const tx2 = Math.floor(this.x / TILE_SIZE);
    const ty2 = Math.floor((nextY + (dirY > 0 ? this.radius : -this.radius)) / TILE_SIZE);
    if (!map.isSolid || !map.isSolid(tx2, ty2)) {
      this.y = nextY;
    }

    // Ertrinken im tiefen Wasser
    if (!isFlyingEnemy(this.typeId) && map) {
      const curTx = Math.floor(this.x / TILE_SIZE);
      const curTy = Math.floor(this.y / TILE_SIZE);
      const ground = map.getGroundTile ? map.getGroundTile(curTx, curTy) : 0;
      const isWater = (ground === TILES.WATER || ground === TILES.SWAMP_WATER || ground === TILES.CAVE_WATER || ground === TILES.VOID_LAKE);
      const isBridge = (ground === TILES.BRIDGE_H || ground === TILES.BRIDGE_V || ground === TILES.RAINBOW_BRIDGE_H || ground === TILES.RAINBOW_BRIDGE_V);
      if (isWater && !isBridge) {
        this.hp = 0;
        this.state = 'dead';
        this.die(this.enemyManager?.game?.combat);
      }
    }
  }

  startTeleport(player, map, combatManager) {
    this.isTeleporting = true;
    this.teleportTimer = 0.32;
    this.teleportCooldown = 4.5 + Math.random() * 1.5;
    this.state = 'idle';

    if (combatManager) {
      combatManager.addHitSparks(this.x, this.y - 4, '#a855f7', 16, 90);
      combatManager.addFloatingText('🔮 SCHATTEN-SPRUNG!', this.x, this.y - 18, '#c084fc');
    }

    // Bestimme Zielposition nahe dem Spieler (flankierend / im Rücken)
    const angle = Math.random() * Math.PI * 2;
    const targetDist = 26 + Math.random() * 12;
    const destX = player.x + Math.cos(angle) * targetDist;
    const destY = player.y + Math.sin(angle) * targetDist;

    if (isFlyingEnemy(this.typeId)) {
      this.teleportDest = { x: destX, y: destY };
    } else {
      const tx = Math.floor(destX / TILE_SIZE);
      const ty = Math.floor(destY / TILE_SIZE);
      const safeTile = findNearestWalkableTile(map, tx, ty, 8);
      this.teleportDest = {
        x: safeTile.tx * TILE_SIZE + 8,
        y: safeTile.ty * TILE_SIZE + 8
      };
    }
  }

  completeTeleport(player, map, combatManager) {
    if (this.teleportDest) {
      this.x = this.teleportDest.x;
      this.y = this.teleportDest.y;
    }
    this.isTeleporting = false;
    this.teleportDest = null;
    this.cooldownTimer = 0.25;

    if (combatManager) {
      combatManager.addHitSparks(this.x, this.y - 4, '#7c3aed', 18, 120);
    }
  }

  startHookAttack(player, combatManager) {
    this.state = 'attack';
    this.telegraphTimer = 0.38;
    this.isHooking = true;
    this.hookCooldown = 5.5 + Math.random() * 1.5;

    if (combatManager) {
      combatManager.addFloatingText('⛓️ ENTERHAKEN!', this.x, this.y - 20, '#f59e0b');
      combatManager.addHitSparks(this.x, this.y - 6, '#f59e0b', 8);
    }
  }

  startAttack(player, combatManager) {
    this.state = 'attack';
    this.telegraphTimer = ENEMY_CONFIG.ATTACK_TELEGRAPH_TIME;

    // Optisches Telegraphing (Warnkreis / Funken)
    if (combatManager) {
      combatManager.addHitSparks(this.x, this.y - 4, '#fbbf24', 6);
    }

    // Vorbereitung für Wildschwein
    if (this.typeId === 'tusk_boar') {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      this.chargeDir = { x: dx / dist, y: dy / dist };
    }
  }

  executeAttack(player, combatManager, enemyManager) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    // =========================================================================
    // SPEZIFISCHE ATTACKEN ALLER 20 MODELLE
    // =========================================================================
    switch (this.typeId) {
      // 1. Waldläufer-Schütze: Moospfeil
      case 'moss_archer':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'moss_arrow',
            x: this.x,
            y: this.y - 2,
            dirX,
            dirY,
            speed: 240,
            damage: this.atk,
            color: '#22c55e',
            radius: 4,
            maxDist: 220
          });
        }
        break;

      // 2. Sporen-Spucker: Sporen-Ball mit Giftnebel
      case 'spore_spitter':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'spore_blob',
            x: this.x,
            y: this.y - 12,
            dirX,
            dirY,
            speed: 160,
            damage: this.atk,
            color: '#a855f7',
            radius: 6,
            maxDist: 180,
            spawnsPuddle: true
          });
        }
        break;

      // 3. Moos-Koloss: Erdbeben-Bodenstampfer (Schockwelle)
      case 'boulder_troll':
        if (combatManager) {
          combatManager.createShockwave(this.x, this.y + 8, 48, this.atk, '#15803d');
          enemyManager.game.camera.shake(4.5, 0.22);
        }
        break;

      // 4. Yeti-Wächter: Eiskeulen-Frostwelle
      case 'frost_giant':
        if (combatManager) {
          combatManager.createShockwave(this.x, this.y + 8, 55, this.atk, '#38bdf8', true); // Slows player
          enemyManager.game.camera.shake(5.0, 0.25);
        }
        break;

      // 5. Smaragd-Natter: Blitzschneller Giftzahn-Vorstoß
      case 'slithering_viper':
        if (dist <= 38) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
        }
        break;

      // 6. Dünen-Schlund: Lotus-Maw Einschnappen mit Sandfontäne
      case 'dune_maw':
        if (combatManager) {
          combatManager.createShockwave(this.x, this.y, 42, this.atk, '#d97706');
        }
        break;

      // 7. Laternen-Pyromant: Feuriger Lampion-Feuerball
      case 'pyromancer':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'fireball',
            x: this.x,
            y: this.y - 6,
            dirX,
            dirY,
            speed: 210,
            damage: this.atk,
            color: '#f97316',
            radius: 6,
            maxDist: 200
          });
        }
        break;

      // 8. Wolken-Astrologe: Fallende Sternschnuppe am Spielerort
      case 'star_astromancer':
        if (combatManager) {
          combatManager.spawnCelestialStrike(player.x, player.y, this.atk);
        }
        break;

      // 9. Tau-Tropfen Blob: Weicher Gelee-Platscher
      case 'green_slime':
        if (dist <= 30) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
        }
        break;

      // 10. Teer-Schlamm: Rußkugel-Schuss
      case 'tar_mire':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'ink_ball',
            x: this.x,
            y: this.y,
            dirX,
            dirY,
            speed: 180,
            damage: this.atk,
            color: '#0f172a',
            radius: 5,
            maxDist: 160
          });
        }
        break;

      // 11. Schattenwolf: Mononoke-Hechtsprung
      case 'dire_wolf':
        // Schneller Vorwärtssprung
        this.x += dirX * 22;
        this.y += dirY * 22;
        if (Math.hypot(player.x - this.x, player.y - this.y) <= 32) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
        }
        break;

      // 12. Kaiser-Skorpion: Lotus-Scherenschlag & Stachel
      case 'emperor_scorpion':
        if (dist <= 42) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
        }
        break;

      // 13. Grasland-Wildschwein: Sturm-Anlauf aktivieren
      case 'tusk_boar':
        this.isCharging = true;
        this.chargeTimer = 1.4;
        this.state = 'attack'; // bleibt während des Sturms im Angriffsmodus
        break;

      // 14. Höhlen-Krallenspinne: Verlangsamender Seidenfaden-Schuss
      case 'cave_weaver':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'web_shot',
            x: this.x,
            y: this.y,
            dirX,
            dirY,
            speed: 230,
            damage: this.atk,
            color: '#e2e8f0',
            radius: 6,
            maxDist: 180,
            slowsPlayer: true
          });
        }
        break;

      // 15. Leeren-Verschlinger: Kaonashi Sternenklingen-Schnitt
      case 'void_reaper':
        if (dist <= 48) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
          if (combatManager) {
            combatManager.addSlashEffect('slash1', player.x, player.y, Math.atan2(dirY, dirX), 24);
          }
        }
        break;

      // 16. Auge des Abgrunds: Kosmischer Starlight-Strahl
      case 'gazer_of_the_void':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'void_beam',
            x: this.x,
            y: this.y - 2,
            dirX,
            dirY,
            speed: 290,
            damage: this.atk,
            color: '#c084fc',
            radius: 5,
            maxDist: 240
          });
        }
        break;

      // 17. Schatten-Tentakel: Tempelglocken-Peitschenhieb
      case 'abyss_tentacle':
        if (dist <= 48) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
          if (combatManager) {
            combatManager.addHitSparks(this.x, this.y, '#f59e0b', 14);
          }
        }
        break;

      // 18. Origami-Krieger: Iaijutsu Mondsichel-Tuschehieb
      case 'cursed_knight':
        if (dist <= 46) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
          if (combatManager) {
            combatManager.addSlashEffect('thrust', player.x, player.y, Math.atan2(dirY, dirX), 28);
          }
        }
        break;

      // 19. Wolken-Harpyie: Sakura-Windböen-Fächer
      case 'sky_harpy':
        if (combatManager) {
          combatManager.fireEnemyProjectile({
            type: 'wind_petal',
            x: this.x,
            y: this.y,
            dirX,
            dirY,
            speed: 260,
            damage: this.atk,
            color: '#f472b6',
            radius: 7,
            maxDist: 210,
            knockbackPlayer: 220
          });
        }
        break;

      // 20. Magma-Funke: Calcifer Feuerwerk-Funken
      case 'lava_core':
        if (combatManager) {
          for (let s = -1; s <= 1; s++) {
            const spreadAngle = Math.atan2(dirY, dirX) + s * 0.3;
            combatManager.fireEnemyProjectile({
              type: 'fire_spark',
              x: this.x,
              y: this.y,
              dirX: Math.cos(spreadAngle),
              dirY: Math.sin(spreadAngle),
              speed: 220,
              damage: this.atk * 0.65,
              color: '#facc15',
              radius: 4,
              maxDist: 180
            });
          }
        }
        break;

      default:
        if (dist <= 35) {
          this.hitPlayer(player, combatManager, this.atk, { x: dirX, y: dirY });
        }
        break;
    }
  }

  hitPlayer(player, combatManager, damage, dir) {
    if (!player || player.isDead) return;

    // 1. Dash-Ausweich-Unverwundbarkeit (I-Frames)
    if (player.dash && player.dash.active) {
      if (combatManager) {
        combatManager.addFloatingText('💨 AUSGEWICHEN!', player.x, player.y - 16, '#67e8f9');
      }
      return;
    }

    // 2. Schild-Block
    if (player.shield && player.shield.active && player.shield.energy > 0) {
      player.shield.energy = Math.max(0, player.shield.energy - damage * 0.7);
      if (combatManager) {
        combatManager.addHitSparks(player.x, player.y, '#38bdf8', 16);
        combatManager.addFloatingText('🛡️ GEBLOCKT!', player.x, player.y - 18, '#38bdf8');
      }
      // Schild-Betäubung bei Bruch
      if (player.shield.energy <= 0) {
        player.shield.broken = true;
        player.shield.stunTimer = 1.2;
        player.shield.active = false;
        if (combatManager) {
          combatManager.addFloatingText('💥 SCHILD ZERBROCHEN!', player.x, player.y - 26, '#ef4444');
        }
      }
      return;
    }

    // 3. Voller Treffer auf Spieler
    player.takeDamage(damage, dir);
  }

  takeDamage(amount, knockbackAngle, knockbackForce, combatManager, isRange = false) {
    if (this.state === 'dead') return;

    // Wenn nicht Master-Client im LAN: Schaden an Master senden
    const net = combatManager?.game?.network;
    const isMaster = combatManager?.game?.enemyManager?.isMasterClient ?? true;
    if (!isMaster && net && net.connected) {
      net.sendDamageEnemy(this.id, amount, knockbackAngle, knockbackForce, isRange);
    }

    this.hp -= amount;
    this.hitFlash = 0.25;

    // Wenn Leeren-Monster aus der Ferne getroffen wird -> Sofortiger Konter-Teleport zum Schützen!
    if (isRange && this.category === 'void' && combatManager?.game?.player && !this.isTeleporting) {
      const player = combatManager.game.player;
      const map = combatManager.game.currentMap || combatManager.game.map;
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      if (dist > 75) {
        this.startTeleport(player, map, combatManager);
      }
    }

    // Knockback (Kleine Blob-Gegner fliegen mit starkem Impuls wie Kegel weg!)
    if (this.baseSpeed > 0) {
      const kbMult = (this.typeId === 'green_slime' || this.scale < 0.6) ? 0.24 : 0.08;
      this.x += Math.cos(knockbackAngle) * (knockbackForce * kbMult);
      this.y += Math.sin(knockbackAngle) * (knockbackForce * kbMult);

      // Prüfen, ob nicht-fliegende Gegner durch Knockback ins Wasser gestoßen wurden -> Sofortiges Ertrinken!
      if (!isFlyingEnemy(this.typeId)) {
        const map = combatManager?.game?.currentMap || combatManager?.game?.map || null;
        if (map) {
          const tx = Math.floor(this.x / TILE_SIZE);
          const ty = Math.floor(this.y / TILE_SIZE);
          const ground = map.getGroundTile ? map.getGroundTile(tx, ty) : 0;
          const isWater = (ground === TILES.WATER || ground === TILES.SWAMP_WATER || ground === TILES.CAVE_WATER || ground === TILES.VOID_LAKE);
          const isBridge = (ground === TILES.BRIDGE_H || ground === TILES.BRIDGE_V || ground === TILES.RAINBOW_BRIDGE_H || ground === TILES.RAINBOW_BRIDGE_V);
          if (isWater && !isBridge) {
            this.hp = 0;
            this.state = 'dead';
            this.die(combatManager);
            if (combatManager) {
              combatManager.addFloatingText('🌊 ERTRUNKEN!', this.x, this.y - 20, '#38bdf8', 1.3);
              for (let s = 0; s < 18; s++) {
                const spAng = Math.random() * Math.PI * 2;
                const sp = Math.random() * 60 + 20;
                combatManager.hitSparks.push({
                  dimension: this.dimension,
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(spAng) * sp,
                  vy: Math.sin(spAng) * sp - 15,
                  color: Math.random() > 0.3 ? '#38bdf8' : '#e0f2fe',
                  size: Math.random() * 3 + 1.5,
                  life: 0.5,
                  maxLife: 0.5
                });
              }
            }
            return;
          }
        }
      }
    }

    // Treffer-Partikel
    if (combatManager) {
      combatManager.addHitSparks(this.x, this.y - 4, '#ef4444', 10);
      combatManager.addFloatingText(`-${Math.round(amount)}!`, this.x, this.y - 18, '#f87171');
    }

    // Tod prüfen
    if (this.hp <= 0) {
      this.die(combatManager);
    }
  }

  die(combatManager) {
    this.state = 'dead';
    this.hp = 0;

    // Poof / Konfetti-Partikelwolke
    if (combatManager) {
      combatManager.addDefeatPoof(this.x, this.y, this.category, this.dimension);

      // Spritzige Gelee-Partikel für Blobs
      if (this.typeId === 'green_slime') {
        for (let s = 0; s < 10; s++) {
          const pAng = Math.random() * Math.PI * 2;
          const sp = Math.random() * 50 + 15;
          combatManager.hitSparks.push({
            dimension: this.dimension,
            x: this.x,
            y: this.y,
            vx: Math.cos(pAng) * sp,
            vy: Math.sin(pAng) * sp - 15,
            color: Math.random() > 0.4 ? '#4ade80' : '#22c55e',
            size: Math.random() * 2.5 + 1.2,
            life: 0.35,
            maxLife: 0.35
          });
        }
      }
    }
  }

  render(ctx, t, night) {
    if (this.state === 'dead') return;

    const renderState = (this.state === 'walk' || this.isCharging)
      ? 'walk'
      : (this.state === 'attack' ? 'attack' : 'idle');

    const elevY = (this.elevation || 0) * ELEVATION_PIXEL_OFFSET;
    const drawX = Math.round(this.x);
    const drawY = Math.round(this.y - elevY);

    // Zeichne das prozedurale Ghibli-Papercraft-Wesen (skaliert nach Monster-Kategorie)
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.scale(this.scale, this.scale);
    this.def.render(ctx, 0, 0, this.animTime, renderState, Math.max(0, this.hitFlash));
    ctx.restore();

    // Alarm-Emote `!` über dem Kopf
    if (this.alertEmoteTimer > 0) {
      const emoteY = drawY - Math.round(24 * this.scale);
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(drawX, emoteY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', drawX, emoteY);
      ctx.restore();
    }

    // Lebensbalken unter dem Monster (nur wenn verletzt / < 100% HP, kein Name)
    if (this.hp < this.maxHp && this.hp > 0) {
      const baseBelowY = drawY + Math.round(15 * this.scale) + 4;
      const barW = Math.round(24 * Math.max(0.8, Math.min(1.8, this.scale)));
      const barH = 3.5;
      const barX = drawX - barW / 2;
      const barY = baseBelowY;
      const hpPct = Math.max(0, this.hp / this.maxHp);

      ctx.save();
      // Hintergrund
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      // Füllung
      ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : (hpPct > 0.25 ? '#f59e0b' : '#ef4444');
      ctx.fillRect(barX, barY, barW * hpPct, barH);
      ctx.restore();
    }

    // 4. Frost Freeze Visuals (Eisnebel Artefakt)
    if (this.freezeTimer > 0) {
      ctx.save();
      const r = Math.max(9, Math.round(this.radius * 1.35));
      // Frost-Kokondecke
      ctx.fillStyle = 'rgba(56, 189, 248, 0.38)';
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(drawX, drawY - r - 6);
      ctx.lineTo(drawX + r + 4, drawY - 2);
      ctx.lineTo(drawX + r * 0.7, drawY + r);
      ctx.lineTo(drawX - r * 0.7, drawY + r);
      ctx.lineTo(drawX - r - 4, drawY - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sharp crystal shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.moveTo(drawX - r * 0.4, drawY - r);
      ctx.lineTo(drawX - r * 0.1, drawY - r * 0.4);
      ctx.lineTo(drawX - r * 0.5, drawY - 2);
      ctx.closePath();
      ctx.fill();

      // Floating Snowflake Icon
      if (typeof ctx.fillText === 'function') {
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄️', drawX, drawY - r - 12);
      }
      ctx.restore();
    }
  }
}

/**
 * Berechnet die Einfrier-Dauer für das Eisnebel-Artefakt (0.5s - 3.0s nach Monsterstärke)
 */
export function calculateFreezeDuration(enemy) {
  if (!enemy) return 2.0;
  // Bosses / extrem starke Gegner (>= 500 HP oder Boss-Kategorie)
  if (enemy.category === 'boss' || enemy.maxHp >= 500) {
    return 0.5;
  }
  // Schwere / Elite-Monster (>= 300 HP oder mächtige Skalierung)
  if (enemy.maxHp >= 300 || enemy.scale >= 1.3) {
    return 1.0;
  }
  // Mittlere Monster (100 - 300 HP)
  if (enemy.maxHp >= 100) {
    return 1.8;
  }
  // Schwache Monster (<= 60 HP, kleine Spinnen, Schleime)
  return 3.0;
}

/**
 * EnemyManager - Koordiniert alle Spawns, Gruppen und Dimensionen
 */
export class EnemyManager {
  constructor(game) {
    this.game = game;
    this.enemies = [];
    this.lootItems = [];
    this.xpOrbs = [];
    this.respawnQueue = [];
    this.aiActive = true;
    this.isMasterClient = true; // Im LAN: Master simuliert KI; Nicht-Master interpoliert

    this.initSpawns();
  }

  initSpawns() {
    this.enemies = [];
    this.lootItems = [];
    this.xpOrbs = [];
    this.respawnQueue = [];

    const map = this.getMapForDimension(DIMENSIONS.OVERWORLD);
    const sp = map?.spawnPoint || { x: 50, y: 100 };
    const vz = map?.preset?.voidZone || { x: 268, y: 40, radius: 18 };
    const w = map?.width || 290;
    const h = map?.height || 200;

    // =========================================================================
    // OVERWORLD SPAWNS (Verdoppelt auf ~240 Mobs, Deterministische IDs)
    // =========================================================================

    // 1. Grasland & Lichtungen
    // Massenschwarm Blobs bei Spawn
    this.spawnPack('green_slime', (sp.x + 18) * TILE_SIZE, (sp.y + 4) * TILE_SIZE, 32, 55, DIMENSIONS.OVERWORLD, 'pack_slimes', {
      scale: 0.48, hp: 12, atk: 5, xpValue: 2
    });
    // Zweiter Blob-Schwarm südlich
    this.spawnPack('green_slime', (sp.x + 35) * TILE_SIZE, (sp.y + 40) * TILE_SIZE, 24, 50, DIMENSIONS.OVERWORLD, 'pack_slimes_south', {
      scale: 0.48, hp: 12, atk: 5, xpValue: 2
    });
    // Hügelschleime auf Hochebene
    this.spawnPack('green_slime', (sp.x + 22) * TILE_SIZE, (sp.y - 14) * TILE_SIZE, 8, 28, DIMENSIONS.OVERWORLD, 'pack_hill_slimes', {
      scale: 0.55, hp: 16, atk: 6, xpValue: 3, elevation: 1
    });

    // Waldhüter-Wildschweine
    this.spawnPack('tusk_boar', (sp.x - 18) * TILE_SIZE, (sp.y - 10) * TILE_SIZE, 6, 34, DIMENSIONS.OVERWORLD, 'pack_boars', {
      scale: 0.88, hp: 55, atk: 18, xpValue: 10
    });
    this.spawnPack('tusk_boar', (sp.x + 12) * TILE_SIZE, (sp.y - 35) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_boars_north', {
      scale: 0.88, hp: 55, atk: 18, xpValue: 10
    });
    this.spawnPack('tusk_boar', Math.round(w * 0.48) * TILE_SIZE, Math.round(h * 0.82) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_boars_south', {
      scale: 0.88, hp: 55, atk: 18, xpValue: 10
    });

    // Waldläufer-Schützen
    this.spawnPack('moss_archer', (sp.x - 20) * TILE_SIZE, (sp.y + 14) * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_archers', {
      scale: 0.95, hp: 65, atk: 18, xpValue: 15
    });
    this.spawnPack('moss_archer', Math.round(w * 0.36) * TILE_SIZE, Math.round(h * 0.35) * TILE_SIZE, 5, 28, DIMENSIONS.OVERWORLD, 'pack_river_archers', {
      scale: 0.95, hp: 65, atk: 18, xpValue: 15
    });
    this.spawnPack('moss_archer', Math.round(w * 0.44) * TILE_SIZE, Math.round(h * 0.48) * TILE_SIZE, 4, 26, DIMENSIONS.OVERWORLD, 'pack_lake_archers', {
      scale: 0.95, hp: 65, atk: 18, xpValue: 15
    });

    // 2. Dichter Urwald & Forste
    // Okami-Schattenwölfe
    this.spawnPack('dire_wolf', Math.round(w * 0.18) * TILE_SIZE, Math.round(h * 0.22) * TILE_SIZE, 6, 34, DIMENSIONS.OVERWORLD, 'pack_wolves_nw', {
      scale: 0.85, hp: 45, atk: 16, xpValue: 8
    });
    this.spawnPack('dire_wolf', Math.round(w * 0.22) * TILE_SIZE, Math.round(h * 0.68) * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_wolves_sw', {
      scale: 0.85, hp: 45, atk: 16, xpValue: 8
    });
    this.spawnPack('dire_wolf', Math.round(w * 0.78) * TILE_SIZE, Math.round(h * 0.52) * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_wolves_east', {
      scale: 0.85, hp: 45, atk: 16, xpValue: 8
    });
    this.spawnPack('dire_wolf', Math.round(w * 0.32) * TILE_SIZE, Math.round(h * 0.18) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_wolves_north', {
      scale: 0.85, hp: 45, atk: 16, xpValue: 8
    });

    // 3. Wüste & Treibsand (Südwesten)
    // 2x APEX-PREDATOR: Dünen-Schlund
    this.spawnEnemy('dune_maw', Math.round(w * 0.18) * TILE_SIZE, Math.round(h * 0.78) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_dune_maw_1', {
      scale: 1.55, hp: 340, atk: 36, xpValue: 60
    });
    this.spawnEnemy('dune_maw', Math.round(w * 0.28) * TILE_SIZE, Math.round(h * 0.90) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_dune_maw_2', {
      scale: 1.55, hp: 340, atk: 36, xpValue: 60
    });

    // Kaiser-Skorpione (3 Rudel)
    this.spawnPack('emperor_scorpion', Math.round(w * 0.14) * TILE_SIZE, Math.round(h * 0.84) * TILE_SIZE, 4, 34, DIMENSIONS.OVERWORLD, 'pack_scorpions_1', {
      scale: 1.05, hp: 90, atk: 24, xpValue: 20
    });
    this.spawnPack('emperor_scorpion', Math.round(w * 0.26) * TILE_SIZE, Math.round(h * 0.82) * TILE_SIZE, 4, 34, DIMENSIONS.OVERWORLD, 'pack_scorpions_2', {
      scale: 1.05, hp: 90, atk: 24, xpValue: 20
    });
    this.spawnPack('emperor_scorpion', Math.round(w * 0.10) * TILE_SIZE, Math.round(h * 0.75) * TILE_SIZE, 4, 32, DIMENSIONS.OVERWORLD, 'pack_scorpions_3', {
      scale: 1.05, hp: 90, atk: 24, xpValue: 20
    });

    // Wüstendünen-Vipern
    this.spawnPack('slithering_viper', Math.round(w * 0.12) * TILE_SIZE, Math.round(h * 0.88) * TILE_SIZE, 6, 28, DIMENSIONS.OVERWORLD, 'pack_dune_vipers', {
      scale: 0.9, hp: 55, atk: 18, xpValue: 12
    });
    this.spawnPack('slithering_viper', Math.round(w * 0.22) * TILE_SIZE, Math.round(h * 0.76) * TILE_SIZE, 5, 28, DIMENSIONS.OVERWORLD, 'pack_oasis_vipers', {
      scale: 0.9, hp: 55, atk: 18, xpValue: 12
    });

    // 4. Schnee & Eisberge (Nordosten)
    // 2x RIESIGER KOLOSS: Frost Giant
    this.spawnEnemy('frost_giant', Math.round(w * 0.78) * TILE_SIZE, Math.round(h * 0.20) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_frost_giant_1', {
      scale: 1.65, hp: 1500, atk: 65, xpValue: 220, elevation: 1
    });
    this.spawnEnemy('frost_giant', Math.round(w * 0.88) * TILE_SIZE, Math.round(h * 0.28) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_frost_giant_2', {
      scale: 1.65, hp: 1500, atk: 65, xpValue: 220, elevation: 1
    });

    // Origami-Krieger
    this.spawnPack('cursed_knight', Math.round(w * 0.72) * TILE_SIZE, Math.round(h * 0.26) * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_ice_knights', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25, elevation: 1
    });
    this.spawnPack('cursed_knight', Math.round(w * 0.82) * TILE_SIZE, Math.round(h * 0.15) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_glacier_knights', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25, elevation: 1
    });
    this.spawnPack('cursed_knight', Math.round(w * 0.62) * TILE_SIZE, Math.round(h * 0.20) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_north_knights', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25
    });
    this.spawnPack('cursed_knight', Math.round(w * 0.84) * TILE_SIZE, Math.round(h * 0.58) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_highland_knights', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25, elevation: 1
    });

    // 5. Düsterer Sumpf (Südosten)
    // Sporen-Spucker
    this.spawnPack('spore_spitter', Math.round(w * 0.62) * TILE_SIZE, Math.round(h * 0.68) * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_spores_1', {
      scale: 0.85, hp: 40, atk: 14, xpValue: 8
    });
    this.spawnPack('spore_spitter', Math.round(w * 0.70) * TILE_SIZE, Math.round(h * 0.78) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_spores_2', {
      scale: 0.85, hp: 40, atk: 14, xpValue: 8
    });

    // Smaragd-Nattern
    this.spawnPack('slithering_viper', Math.round(w * 0.70) * TILE_SIZE, Math.round(h * 0.66) * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_vipers_swamp', {
      scale: 1.0, hp: 70, atk: 20, xpValue: 15
    });

    // Teer-Schlamm Geister
    this.spawnPack('tar_mire', Math.round(w * 0.76) * TILE_SIZE, Math.round(h * 0.74) * TILE_SIZE, 6, 30, DIMENSIONS.OVERWORLD, 'pack_tar_1', {
      scale: 0.82, hp: 45, atk: 12, xpValue: 8
    });
    this.spawnPack('tar_mire', Math.round(w * 0.64) * TILE_SIZE, Math.round(h * 0.82) * TILE_SIZE, 5, 28, DIMENSIONS.OVERWORLD, 'pack_tar_2', {
      scale: 0.82, hp: 45, atk: 12, xpValue: 8
    });

    // 6. Felsgebirge & Bergpfade (Höhenebene +1, +2)
    // 2x Moos-Koloss
    this.spawnEnemy('boulder_troll', Math.round(w * 0.58) * TILE_SIZE, Math.round(h * 0.32) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_boulder_troll_1', {
      scale: 1.60, hp: 1400, atk: 60, xpValue: 200, elevation: 1
    });
    this.spawnEnemy('boulder_troll', Math.round(w * 0.48) * TILE_SIZE, Math.round(h * 0.24) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_boulder_troll_2', {
      scale: 1.60, hp: 1400, atk: 60, xpValue: 200, elevation: 1
    });

    // Wache Origami-Krieger auf Hochebenen
    this.spawnPack('cursed_knight', Math.round(w * 0.64) * TILE_SIZE, Math.round(h * 0.36) * TILE_SIZE, 5, 30, DIMENSIONS.OVERWORLD, 'pack_samurai_1', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25, elevation: 1
    });
    this.spawnPack('cursed_knight', Math.round(w * 0.52) * TILE_SIZE, Math.round(h * 0.38) * TILE_SIZE, 4, 28, DIMENSIONS.OVERWORLD, 'pack_samurai_2', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25, elevation: 1
    });

    // 7. Die Leere / Void
    // Leeren-Verschlinger
    this.spawnPack('void_reaper', (vz.x - 7) * TILE_SIZE, (vz.y - 5) * TILE_SIZE, 4, 30, DIMENSIONS.OVERWORLD, 'pack_void_reapers_1', {
      scale: 1.15, hp: 540, atk: 55, xpValue: 90
    });
    this.spawnPack('void_reaper', (vz.x + 4) * TILE_SIZE, (vz.y + 7) * TILE_SIZE, 4, 30, DIMENSIONS.OVERWORLD, 'pack_void_reapers_2', {
      scale: 1.15, hp: 540, atk: 55, xpValue: 90
    });

    // TITAN: Auge des Abgrunds
    this.spawnEnemy('gazer_of_the_void', vz.x * TILE_SIZE, vz.y * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_gazer_of_the_void', {
      scale: 1.55, hp: 1350, atk: 75, xpValue: 220
    });

    // Brunnen-Fallen: Schatten-Tentakel
    this.spawnEnemy('abyss_tentacle', (vz.x - 6) * TILE_SIZE, (vz.y + 5) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'tentacle_1', {
      scale: 1.25, hp: 480, atk: 50, xpValue: 80
    });
    this.spawnEnemy('abyss_tentacle', (vz.x + 6) * TILE_SIZE, (vz.y - 5) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'tentacle_2', {
      scale: 1.25, hp: 480, atk: 50, xpValue: 80
    });
    this.spawnEnemy('abyss_tentacle', (vz.x + 1) * TILE_SIZE, (vz.y + 8) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'tentacle_3', {
      scale: 1.25, hp: 480, atk: 50, xpValue: 80
    });

    // 8. Brand- & Vulkanzone
    this.spawnEnemy('pyromancer', Math.round(w * 0.44) * TILE_SIZE, Math.round(h * 0.76) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_pyromancer_1', {
      scale: 1.10, hp: 130, atk: 30, xpValue: 35
    });
    this.spawnEnemy('pyromancer', Math.round(w * 0.50) * TILE_SIZE, Math.round(h * 0.74) * TILE_SIZE, DIMENSIONS.OVERWORLD, 'boss_pyromancer_2', {
      scale: 1.10, hp: 130, atk: 30, xpValue: 35
    });
    this.spawnPack('lava_core', Math.round(w * 0.44) * TILE_SIZE, Math.round(h * 0.78) * TILE_SIZE, 8, 28, DIMENSIONS.OVERWORLD, 'pack_fire_1', {
      scale: 0.75, hp: 25, atk: 12, xpValue: 4
    });
    this.spawnPack('lava_core', Math.round(w * 0.52) * TILE_SIZE, Math.round(h * 0.76) * TILE_SIZE, 6, 26, DIMENSIONS.OVERWORLD, 'pack_fire_2', {
      scale: 0.75, hp: 25, atk: 12, xpValue: 4
    });

    // =========================================================================
    // HÖHLEN-SPAWNS (CAVES DIMENSION)
    // =========================================================================
    // Haupthöhlen (main_complex)
    this.spawnPack('cave_weaver', 32 * TILE_SIZE, 26 * TILE_SIZE, 8, 36, DIMENSIONS.CAVES, 'pack_cave_spiders_main1', {
      scale: 0.72, hp: 24, atk: 10, xpValue: 4
    });
    this.spawnPack('cave_weaver', 55 * TILE_SIZE, 42 * TILE_SIZE, 6, 32, DIMENSIONS.CAVES, 'pack_cave_spiders_main2', {
      scale: 0.72, hp: 24, atk: 10, xpValue: 4
    });

    // Moosige Grotte
    this.spawnPack('cave_weaver', 12 * TILE_SIZE, 12 * TILE_SIZE, 6, 28, DIMENSIONS.CAVES, 'pack_cave_spiders_forest', {
      scale: 0.72, hp: 24, atk: 10, xpValue: 4
    });

    // Eis-Grotte
    this.spawnPack('cave_weaver', 12 * TILE_SIZE, 12 * TILE_SIZE, 6, 28, DIMENSIONS.CAVES, 'pack_cave_spiders_snow', {
      scale: 0.72, hp: 24, atk: 10, xpValue: 4
    });

    // Astrale Kluft
    this.spawnPack('cave_weaver', 12 * TILE_SIZE, 12 * TILE_SIZE, 6, 28, DIMENSIONS.CAVES, 'pack_cave_spiders_void', {
      scale: 0.72, hp: 24, atk: 10, xpValue: 4
    });

    // =========================================================================
    // WOLKENREICH-SPAWNS (CLOUDS DIMENSION)
    // =========================================================================
    const cloudMap = this.getMapForDimension(DIMENSIONS.CLOUDS);
    if (cloudMap && cloudMap.islands && cloudMap.islands.length > 0) {
      cloudMap.islands.forEach((isl, idx) => {
        if (idx % 2 === 0) {
          this.spawnPack('sky_harpy', isl.x * TILE_SIZE, isl.y * TILE_SIZE, 3, 24, DIMENSIONS.CLOUDS, `pack_sky_${idx}`, {
            scale: 1.05, hp: 390, atk: 50, xpValue: 65
          });
        }
        if (idx % 2 === 1) {
          this.spawnEnemy('star_astromancer', (isl.x + 2) * TILE_SIZE, (isl.y - 1) * TILE_SIZE, DIMENSIONS.CLOUDS, `pack_sky_astro_${idx}`, {
            scale: 1.18, hp: 500, atk: 62, xpValue: 90
          });
        }
      });
    } else {
      const cloudSpawns = [
        { x: Math.round(w * 0.15), y: Math.round(h * 0.15) },
        { x: Math.round(w * 0.35), y: Math.round(h * 0.12) },
        { x: Math.round(w * 0.55), y: Math.round(h * 0.20) },
        { x: Math.round(w * 0.50), y: Math.round(h * 0.48) },
        { x: Math.round(w * 0.78), y: Math.round(h * 0.45) },
        { x: Math.round(w * 0.60), y: Math.round(h * 0.72) },
        { x: Math.round(w * 0.25), y: Math.round(h * 0.68) },
        { x: Math.round(w * 0.85), y: Math.round(h * 0.80) }
      ];
      cloudSpawns.forEach((cs, i) => {
        this.spawnPack('sky_harpy', cs.x * TILE_SIZE, cs.y * TILE_SIZE, 3, 24, DIMENSIONS.CLOUDS, `pack_sky_fb_${i}`, {
          scale: 1.05, hp: 390, atk: 50, xpValue: 65
        });
        this.spawnEnemy('star_astromancer', (cs.x + 3) * TILE_SIZE, (cs.y + 1) * TILE_SIZE, DIMENSIONS.CLOUDS, `pack_sky_astro_fb_${i}`, {
          scale: 1.15, hp: 480, atk: 60, xpValue: 85
        });
      });
    }
  }

  getMapForDimension(dim) {
    if (!this.game) return null;
    if (dim === DIMENSIONS.CAVES) {
      return this.game.caves?.main_complex || null;
    }
    if (dim === DIMENSIONS.CLOUDS) {
      return this.game.cloudMap || null;
    }
    return this.game.overworldMap || this.game.map || null;
  }

  findWalkablePosition(typeId, rawX, rawY, dimension) {
    if (isFlyingEnemy(typeId)) {
      return { x: rawX, y: rawY };
    }

    const map = this.getMapForDimension(dimension);
    if (!map) return { x: rawX, y: rawY };

    const tx = Math.floor(rawX / TILE_SIZE);
    const ty = Math.floor(rawY / TILE_SIZE);

    // Finde nächste freie begehbare Land-Kachel (deterministisch)
    const safeTile = findNearestWalkableTile(map, tx, ty, 14);
    return {
      x: safeTile.tx * TILE_SIZE + 8,
      y: safeTile.ty * TILE_SIZE + 8
    };
  }

  spawnEnemy(typeId, x, y, dimension = DIMENSIONS.OVERWORLD, packId = null, options = {}) {
    const pos = this.findWalkablePosition(typeId, x, y, dimension);
    const id = options.id || (packId ? `${packId}_0` : `${typeId}_${Math.round(x)}_${Math.round(y)}`);
    const enemy = new EnemyEntity(typeId, pos.x, pos.y, dimension, packId, {
      ...options,
      id
    });
    this.enemies.push(enemy);
    return enemy;
  }

  spawnPack(typeId, centerX, centerY, count = 2, radius = 26, dimension = DIMENSIONS.OVERWORLD, packId = null, options = {}) {
    const pack = packId || `pack_${typeId}_${Math.round(centerX)}_${Math.round(centerY)}`;
    const created = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.sin(i * 1.5) * 0.25);
      const dist = ((i % 3) * 0.3 + 0.4) * radius;
      const rawX = centerX + Math.cos(angle) * dist;
      const rawY = centerY + Math.sin(angle) * dist;
      const pos = this.findWalkablePosition(typeId, rawX, rawY, dimension);
      const enemy = new EnemyEntity(typeId, pos.x, pos.y, dimension, pack, {
        ...options,
        id: `${pack}_${i}`
      });
      this.enemies.push(enemy);
      created.push(enemy);
    }
    return created;
  }

  alertPack(packId, fromX, fromY) {
    if (!packId) return;
    this.enemies.forEach(e => {
      if (e.packId === packId && e.state !== 'dead') {
        const dist = Math.hypot(e.x - fromX, e.y - fromY);
        if (dist <= ENEMY_CONFIG.PACK_CALL_RADIUS) {
          e.alertEmoteTimer = 1.0;
          if (e.state === 'idle' || e.state === 'wander') {
            e.state = 'walk';
          }
        }
      }
    });
  }

  dropLoot(x, y, enemy = null) {
    const dimension = enemy?.dimension || this.game?.currentDimension || DIMENSIONS.OVERWORLD;

    // Drop-Raten: XP droppen immer (100%), Pfeile und Herzen nach Nutzer-Balancing
    const isBoss = enemy && (enemy.category === 'boss' || enemy.maxHp >= 100);
    const isRanged = enemy && (enemy.category === 'range' || enemy.typeId === 'moss_archer');

    // 1. Herz-Beere (❤️ +25 HP) - leicht erhöht (14% normal, 40% bei Bossen)
    const heartChance = isBoss ? 0.40 : 0.14;
    if (Math.random() < heartChance) {
      this.lootItems.push({
        type: LOOT_TYPES.HEART,
        dimension,
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        life: 25.0,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    // 2. Köcher-Pfeile (🏹 +3-5 Pfeile) - deutlich erhöht (35% normal, 60% Bogenschützen, 50% Bosse)
    const arrowChance = isBoss ? 0.50 : (isRanged ? 0.60 : 0.35);
    if (Math.random() < arrowChance) {
      const amount = Math.floor(Math.random() * 3) + 3; // 3 bis 5 Pfeile
      this.lootItems.push({
        type: LOOT_TYPES.ARROW,
        dimension,
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        amount,
        life: 25.0,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    // 3. Sternenstaub / Geist-Juwel (⭐ Glanzpartikel) - selten (ca. 6% bei normalen Gegnern, 35% bei Bossen)
    const gemChance = isBoss ? 0.35 : 0.06;
    if (Math.random() < gemChance) {
      this.lootItems.push({
        type: LOOT_TYPES.SPIRIT_GEM,
        dimension,
        x,
        y,
        life: 20.0,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    // 4. Magisches Artefakt (🔥 Zauber-Orb) - NUR bei schweren Monstern!
    const HEAVY_MONSTER_TYPES = [
      'boulder_troll', 'frost_giant', 'void_reaper', 'gazer_of_the_void',
      'sky_harpy_queen', 'sky_astromancer_grand', 'star_astromancer',
      'cursed_knight', 'emperor_scorpion'
    ];
    const isHeavyMonster = enemy && (
      enemy.category === 'boss' ||
      enemy.maxHp >= 350 ||
      HEAVY_MONSTER_TYPES.includes(enemy.typeId)
    );

    if (isHeavyMonster) {
      const roll = Math.random();
      const dropChance = enemy.category === 'boss' ? 0.35 : 0.15;
      if (roll < dropChance && this.game?.magicManager) {
        this.game.magicManager.dropMonsterArtifact(x, y, dimension);
      }
    }
  }

  spawnXp(x, y, totalXp, dimension = null) {
    const dim = dimension || this.game?.currentDimension || DIMENSIONS.OVERWORLD;

    // Gegner droppen IMMER Erfahrungspunkte (mindestens 1 EP)
    totalXp = Math.max(1, totalXp || 1);

    let orbCount = 1;
    if (totalXp >= 40) orbCount = Math.min(9, Math.max(5, Math.round(totalXp / 8)));
    else if (totalXp >= 12) orbCount = Math.min(4, Math.max(2, Math.round(totalXp / 5)));
    else if (totalXp >= 4) orbCount = 2;

    const baseVal = Math.max(1, Math.floor(totalXp / orbCount));
    let remainder = totalXp - (baseVal * orbCount);

    for (let i = 0; i < orbCount; i++) {
      const val = baseVal + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      const burstAng = (i / orbCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const burstSpeed = Math.random() * 45 + 20;

      this.xpOrbs.push({
        dimension: dim,
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(burstAng) * burstSpeed,
        vy: Math.sin(burstAng) * burstSpeed - 10,
        value: val,
        life: 45.0,
        magnetSpeed: 0,
        bobOffset: Math.random() * Math.PI * 2
      });
    }
  }

  update(dt, player, map, combatManager) {
    const curDim = this.game.currentDimension;

    // 1. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.dimension !== curDim) continue;

      enemy.update(dt, player, map, this, combatManager);

      // Bei Tod: XP droppt IMMER garantiert, Pfeile & Herzen nur selten
      if (enemy.state === 'dead') {
        this.dropLoot(enemy.x, enemy.y, enemy);
        this.spawnXp(enemy.x, enemy.y, Math.max(1, enemy.xpValue || 2), enemy.dimension);

        // Respawn-Berechnung nach Stärke (3-5 Min)
        // Schwach (<= 60 HP): 3 Min (180 s)
        // Mittel (60 < HP < 350): 4 Min (240 s)
        // Schwer / Boss (>= 350 HP oder category 'boss'): 5 Min (300 s)
        let respawnTime = 180;
        if (enemy.maxHp >= 350 || enemy.category === 'boss') {
          respawnTime = 300;
        } else if (enemy.maxHp > 60) {
          respawnTime = 240;
        }

        this.respawnQueue.push({
          typeId: enemy.typeId,
          x: enemy.homeX || enemy.x,
          y: enemy.homeY || enemy.y,
          dimension: enemy.dimension,
          packId: enemy.packId,
          options: enemy.spawnOptions ? { ...enemy.spawnOptions } : {},
          timer: respawnTime
        });

        this.enemies.splice(i, 1);
      }
    }

    // 1b. Update Respawn Queue (tick down and respawn after 3-5 min)
    for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
      const item = this.respawnQueue[i];
      item.timer -= dt;
      if (item.timer <= 0) {
        this.spawnEnemy(item.typeId, item.x, item.y, item.dimension, item.packId, item.options);
        this.respawnQueue.splice(i, 1);
      }
    }

    // 2. Update Loot Items (nur aktuelle Dimension)
    for (let i = this.lootItems.length - 1; i >= 0; i--) {
      const item = this.lootItems[i];
      if (item.dimension && curDim && item.dimension !== curDim) continue;

      item.life -= dt;
      if (item.life <= 0) {
        this.lootItems.splice(i, 1);
        continue;
      }

      // Pickup durch Spieler
      const dist = Math.hypot(player.x - item.x, player.y - item.y);
      if (dist <= 16 && !player.isDead) {
        if (item.type === LOOT_TYPES.HEART) {
          if (player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + 25);
            combatManager?.addFloatingText('❤️ +25 LEBEN', player.x, player.y - 20, '#4ade80');
            combatManager?.addHitSparks(player.x, player.y, '#4ade80', 12);
            this.lootItems.splice(i, 1);
          }
        } else if (item.type === LOOT_TYPES.ARROW) {
          if (player.ranged && player.ranged.ammo < 30) {
            const gain = item.amount || 4;
            player.ranged.ammo = Math.min(30, player.ranged.ammo + gain);
            combatManager?.addFloatingText(`🏹 +${gain} PFEILE`, player.x, player.y - 20, '#38bdf8');
            combatManager?.addHitSparks(player.x, player.y, '#38bdf8', 10);
            this.lootItems.splice(i, 1);
          }
        } else if (item.type === LOOT_TYPES.SPIRIT_GEM) {
          combatManager?.addFloatingText('⭐ GEIST-FUNKE', player.x, player.y - 20, '#fde047');
          combatManager?.addHitSparks(player.x, player.y, '#facc15', 14);
          this.lootItems.splice(i, 1);
        }
      }
    }

    // 3. Update XP Orbs (Magnetischer Flug zum Spieler, nur in aktueller Dimension)
    const MAGNET_RADIUS = 90;
    const PICKUP_RADIUS = 14;

    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const orb = this.xpOrbs[i];
      if (orb.dimension && curDim && orb.dimension !== curDim) continue;

      orb.life -= dt;
      if (orb.life <= 0) {
        this.xpOrbs.splice(i, 1);
        continue;
      }

      // Physics drag
      if (Math.abs(orb.vx) > 0.1 || Math.abs(orb.vy) > 0.1) {
        orb.x += orb.vx * dt;
        orb.y += orb.vy * dt;
        orb.vx *= Math.pow(0.08, dt);
        orb.vy *= Math.pow(0.08, dt);
      }

      if (!player || player.isDead) continue;

      const pTargetY = player.y - 8;
      const dx = player.x - orb.x;
      const dy = pTargetY - orb.y;
      const dist = Math.hypot(dx, dy);

      // Magnetischer Zug wenn Spieler in der Nähe ist
      if (dist <= MAGNET_RADIUS) {
        orb.magnetSpeed = Math.min(320, orb.magnetSpeed + 650 * dt);
        orb.x += (dx / (dist || 1)) * orb.magnetSpeed * dt;
        orb.y += (dy / (dist || 1)) * orb.magnetSpeed * dt;
      }

      // Einsammeln durch Spieler
      if (dist <= PICKUP_RADIUS) {
        player.addXp(orb.value);

        if (combatManager) {
          combatManager.addFloatingText(`+${orb.value} EP`, player.x + (Math.random() - 0.5) * 14, player.y - 18, '#4ade80', 0.55);
          for (let s = 0; s < 5; s++) {
            const spAng = Math.random() * Math.PI * 2;
            combatManager.hitSparks.push({
              x: orb.x,
              y: orb.y,
              vx: Math.cos(spAng) * (Math.random() * 30 + 10),
              vy: Math.sin(spAng) * (Math.random() * 30 + 10),
              color: '#4ade80',
              size: Math.random() * 2 + 1,
              life: 0.25,
              maxLife: 0.25
            });
          }
        }

        this.xpOrbs.splice(i, 1);
      }
    }
  }

  getActiveEnemies() {
    const curDim = this.game.currentDimension;
    return this.enemies.filter(e => e.dimension === curDim && e.state !== 'dead');
  }

  renderLoot(ctx, t) {
    const curDim = this.game?.currentDimension || DIMENSIONS.OVERWORLD;

    // 1. Render Normal Loot (nur in der Dimension wo es gedroppt wurde!)
    this.lootItems.forEach(item => {
      if (item.dimension && curDim && item.dimension !== curDim) return;

      const bob = Math.sin(t * 4 + item.bobOffset) * 2.5;

      ctx.save();
      ctx.translate(item.x, item.y + bob);

      // Papierschatten
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 4 - bob * 0.4, 5, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      if (item.type === LOOT_TYPES.HEART) {
        // Herz-Beere
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.bezierCurveTo(-4, -2, -4, -6, 0, -4);
        ctx.bezierCurveTo(4, -6, 4, -2, 0, 2);
        ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(-1.5, -4, 1, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === LOOT_TYPES.ARROW) {
        // Pfeil-Bündel
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-3, 3);
        ctx.lineTo(3, -3);
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-4, 2, 2, 2);
      } else if (item.type === LOOT_TYPES.SPIRIT_GEM) {
        // Stern-Juwel
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-0.8, -0.8, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // 2. Render Glowing Green XP Orbs (nur in der Dimension wo es gedroppt wurde!)
    this.xpOrbs.forEach(orb => {
      if (orb.dimension && curDim && orb.dimension !== curDim) return;

      const bob = Math.sin(t * 6 + orb.bobOffset) * 2;
      const ox = orb.x;
      const oy = orb.y + bob;

      ctx.save();
      // Weiche grüne Aura
      const pulse = Math.sin(t * 8 + orb.bobOffset) * 0.8 + 3.8;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.35)';
      ctx.beginPath();
      ctx.arc(ox, oy, pulse, 0, Math.PI * 2);
      ctx.fill();

      // Smaragdgrüner Körper
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Heller Glanzpunkt
      ctx.fillStyle = '#f0fdf4';
      ctx.beginPath();
      ctx.arc(ox - 0.6, oy - 0.6, 1.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  // ---------------------------------------------------------------------------
  // LAN-MULTIPLAYER MOB-SYNCHRONISATION
  // ---------------------------------------------------------------------------
  serializeEnemiesState() {
    return this.enemies.map(e => ({
      id: e.id,
      x: Math.round(e.x * 10) / 10,
      y: Math.round(e.y * 10) / 10,
      vx: Math.round((e.vx || 0) * 10) / 10,
      vy: Math.round((e.vy || 0) * 10) / 10,
      hp: e.hp,
      maxHp: e.maxHp,
      state: e.state,
      animTime: Math.round(e.animTime * 10) / 10,
      facing: e.facing,
      elevation: e.elevation || 0,
      isDead: e.state === 'dead',
      freezeTimer: Math.round((e.freezeTimer || 0) * 10) / 10,
      isCharging: Boolean(e.isCharging)
    }));
  }

  applyEnemiesState(remoteList) {
    if (!Array.isArray(remoteList)) return;
    const enemyMap = new Map();
    for (const e of this.enemies) {
      enemyMap.set(e.id, e);
    }

    for (const remote of remoteList) {
      const local = enemyMap.get(remote.id);
      if (local) {
        if (remote.isDead && local.state !== 'dead') {
          local.state = 'dead';
          local.hp = 0;
          local.die(this.game?.combat);
        } else if (!remote.isDead) {
          // Smooth interpolation der Position
          local.x += (remote.x - local.x) * 0.45;
          local.y += (remote.y - local.y) * 0.45;
          local.hp = remote.hp;
          local.maxHp = remote.maxHp || local.maxHp;
          local.state = remote.state;
          local.facing = remote.facing || local.facing;
          local.elevation = remote.elevation ?? local.elevation;
          local.freezeTimer = remote.freezeTimer || 0;
          local.isCharging = Boolean(remote.isCharging);
          local.animTime = remote.animTime || local.animTime;
        }
      }
    }
  }

  handleRemoteDamage(msg) {
    if (!msg || !msg.enemyId) return;
    const enemy = this.enemies.find(e => e.id === msg.enemyId);
    if (enemy && enemy.state !== 'dead') {
      enemy.takeDamage(msg.damage, msg.angle || 0, msg.knockback || 0, this.game?.combat, msg.isRange);
    }
  }
}

