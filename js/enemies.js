import { BESTIARY_DATA } from '../bestiary.js';
import { TILE_SIZE, DIMENSIONS, ENEMY_CONFIG, LOOT_TYPES, RAMPS } from './constants.js';

// Index BESTIARY_DATA by ID for quick O(1) lookup
export const BESTIARY_MAP = {};
BESTIARY_DATA.forEach(def => {
  BESTIARY_MAP[def.id] = def;
});

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

    // Proportionale Skalierung (Schwache Monster kleiner, Kolosse/Bosse riesig!)
    this.scale = options.scale ?? this.def.scale ?? (this.category === 'boss' ? 1.6 : (this.typeId === 'green_slime' || this.typeId === 'cave_weaver' || this.typeId === 'lava_core' ? 0.72 : 1.0));

    // Hitbox-Radius proportional zur Skalierung
    let baseRadius = 9;
    if (this.category === 'boss') {
      baseRadius = 18;
    } else if (this.category === 'reptile' || this.category === 'beast') {
      baseRadius = 11;
    } else if (this.typeId === 'green_slime' || this.typeId === 'cave_weaver' || this.typeId === 'lava_core') {
      baseRadius = 7;
    }
    this.radius = Math.round(baseRadius * this.scale);

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
  }

  update(dt, player, map, enemyManager, combatManager) {
    if (this.state === 'dead') return;

    this.animTime += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    if (this.alertEmoteTimer > 0) this.alertEmoteTimer -= dt;

    // Nur in der aktiven Dimension berechnen
    if (this.dimension !== enemyManager.game.currentDimension) return;

    // Distanz zum Spieler
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distToPlayer = Math.hypot(dx, dy);

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

  takeDamage(amount, knockbackAngle, knockbackForce, combatManager) {
    if (this.state === 'dead') return;

    this.hp -= amount;
    this.hitFlash = 0.25;

    // Knockback
    if (this.baseSpeed > 0) {
      this.x += Math.cos(knockbackAngle) * (knockbackForce * 0.08);
      this.y += Math.sin(knockbackAngle) * (knockbackForce * 0.08);
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
      combatManager.addDefeatPoof(this.x, this.y, this.category);
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

    // Lebensbalken über dem Kopf (nur wenn verletzt)
    if (this.hp < this.maxHp && this.hp > 0) {
      const barW = Math.round(24 * Math.max(0.8, Math.min(1.8, this.scale)));
      const barH = 3.5;
      const barX = drawX - barW / 2;
      const barY = drawY - Math.round(18 * this.scale);
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
  }
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
    this.aiActive = true;

    this.initSpawns();
  }

  initSpawns() {
    this.enemies = [];
    this.lootItems = [];
    this.xpOrbs = [];

    // =========================================================================
    // OVERWORLD SPAWNS NACH BIOMEN & GRUPPEN
    // =========================================================================

    // 1. Grasland & Lichtungen (nahe Spawn 30, 45)
    // 6er-Schwarm Tau-Tropfen Blobs (klein, schwach, flink)
    this.spawnPack('green_slime', 38 * TILE_SIZE, 46 * TILE_SIZE, 6, 32, DIMENSIONS.OVERWORLD, 'pack_slimes', {
      scale: 0.70, hp: 20, atk: 8, xpValue: 3
    });

    // 3er-Gruppe Waldhüter-Wildschweine (Tusk Boars)
    this.spawnPack('tusk_boar', 22 * TILE_SIZE, 38 * TILE_SIZE, 3, 30, DIMENSIONS.OVERWORLD, 'pack_boars', {
      scale: 0.88, hp: 55, atk: 18, xpValue: 10
    });

    // 3er-Gruppe Waldläufer-Schützen (Moss Archers) am Waldsaum
    this.spawnPack('moss_archer', 17 * TILE_SIZE, 28 * TILE_SIZE, 3, 28, DIMENSIONS.OVERWORLD, 'pack_archers', {
      scale: 0.95, hp: 65, atk: 18, xpValue: 15
    });

    // 2. Dichter Dunkelwald (Nordwesten)
    // 4er-Rudel Okami-Schattenwölfe (Dire Wolves)
    this.spawnPack('dire_wolf', 24 * TILE_SIZE, 15 * TILE_SIZE, 4, 32, DIMENSIONS.OVERWORLD, 'pack_wolves', {
      scale: 0.85, hp: 45, atk: 16, xpValue: 8
    });

    // 3. Wüste & Treibsand (Südwesten)
    // RIESIGER APEX-PREDATOR: Dünen-Schlund (Dune Maw)
    this.spawnEnemy('dune_maw', 25 * TILE_SIZE, 68 * TILE_SIZE, DIMENSIONS.OVERWORLD, null, {
      scale: 1.55, hp: 340, atk: 36, xpValue: 60
    });

    // 2er-Gruppe Kaiser-Skorpione (Emperor Scorpions)
    this.spawnPack('emperor_scorpion', 16 * TILE_SIZE, 74 * TILE_SIZE, 2, 32, DIMENSIONS.OVERWORLD, 'pack_scorpions', {
      scale: 1.05, hp: 90, atk: 24, xpValue: 20
    });

    // 4. Schnee & Eisberge (Nordosten)
    // RIESIGER KOLOSS: Yeti-Wächter (Frost Giant)
    this.spawnEnemy('frost_giant', 88 * TILE_SIZE, 16 * TILE_SIZE, DIMENSIONS.OVERWORLD, null, {
      scale: 1.65, hp: 420, atk: 42, xpValue: 75, elevation: 1
    });

    // 5. Düsterer Sumpf (Südosten)
    // 3er-Gruppe Sporen-Spucker (Spore Spitters)
    this.spawnPack('spore_spitter', 68 * TILE_SIZE, 62 * TILE_SIZE, 3, 28, DIMENSIONS.OVERWORLD, 'pack_spores', {
      scale: 0.85, hp: 40, atk: 14, xpValue: 8
    });

    // 3er-Gruppe Smaragd-Nattern (Slithering Vipers) am Sumpfteich
    this.spawnPack('slithering_viper', 82 * TILE_SIZE, 60 * TILE_SIZE, 3, 30, DIMENSIONS.OVERWORLD, 'pack_vipers', {
      scale: 1.0, hp: 70, atk: 20, xpValue: 15
    });

    // 3er-Gruppe Teer-Schlamm Geister (Tar Mire)
    this.spawnPack('tar_mire', 95 * TILE_SIZE, 75 * TILE_SIZE, 3, 26, DIMENSIONS.OVERWORLD, 'pack_tar', {
      scale: 0.82, hp: 45, atk: 12, xpValue: 8
    });

    // 6. Felsgebirge & Bergpfade (Höhenebene +1, +2)
    // RIESIGER KOLOSS: Moos-Koloss (Boulder Troll) am Bergpass
    this.spawnEnemy('boulder_troll', 56 * TILE_SIZE, 28 * TILE_SIZE, DIMENSIONS.OVERWORLD, null, {
      scale: 1.60, hp: 380, atk: 38, xpValue: 65, elevation: 1
    });

    // 2er-Wache Origami-Krieger (Cursed Paper Knights)
    this.spawnPack('cursed_knight', 70 * TILE_SIZE, 35 * TILE_SIZE, 2, 28, DIMENSIONS.OVERWORLD, 'pack_samurai', {
      scale: 1.10, hp: 110, atk: 28, xpValue: 25, elevation: 1
    });

    // 7. Die Leere / Void (Osten)
    // 2er-Patrouille Leeren-Verschlinger (Void Reapers)
    this.spawnPack('void_reaper', 108 * TILE_SIZE, 45 * TILE_SIZE, 2, 28, DIMENSIONS.OVERWORLD, 'pack_void_reapers', {
      scale: 1.15, hp: 130, atk: 30, xpValue: 35
    });

    // RIESIGER TITAN: Schwebende Mondqualle: Auge des Abgrunds (Gazer of the Void)
    this.spawnEnemy('gazer_of_the_void', 115 * TILE_SIZE, 55 * TILE_SIZE, DIMENSIONS.OVERWORLD, null, {
      scale: 1.55, hp: 360, atk: 40, xpValue: 70
    });

    // Brunnen-Falle: Schatten-Tentakel (Abyss Tentacle)
    this.spawnEnemy('abyss_tentacle', 118 * TILE_SIZE, 38 * TILE_SIZE, DIMENSIONS.OVERWORLD, null, {
      scale: 1.25, hp: 160, atk: 34, xpValue: 40
    });

    // 8. Brand- & Vulkanzone (Zwischen Felsen und Wüste)
    // Laternen-Pyromant mit 5 Calcifer-Feuerdämonen (Schwarm kleiner Feuerfunken)
    this.spawnEnemy('pyromancer', 85 * TILE_SIZE, 36 * TILE_SIZE, DIMENSIONS.OVERWORLD, 'pack_fire', {
      scale: 1.10, hp: 130, atk: 30, xpValue: 35
    });
    this.spawnPack('lava_core', 85 * TILE_SIZE, 38 * TILE_SIZE, 5, 24, DIMENSIONS.OVERWORLD, 'pack_fire', {
      scale: 0.75, hp: 25, atk: 12, xpValue: 4
    });

    // =========================================================================
    // HÖHLEN-SPAWNS (CAVES DIMENSION)
    // =========================================================================
    // 6er-Schwarm Höhlen-Krallenspinnen (Cave Weavers) (klein, viele, fies)
    this.spawnPack('cave_weaver', 32 * TILE_SIZE, 26 * TILE_SIZE, 6, 36, DIMENSIONS.CAVES, 'pack_cave_spiders', {
      scale: 0.72, hp: 24, atk: 10, xpValue: 4
    });

    // =========================================================================
    // WOLKENREICH-SPAWNS (CLOUDS DIMENSION)
    // =========================================================================
    // Wolken-Astrologe (Star Astromancer) auf hoher Traumwolke
    this.spawnEnemy('star_astromancer', 45 * TILE_SIZE, 20 * TILE_SIZE, DIMENSIONS.CLOUDS, null, {
      scale: 1.15, hp: 150, atk: 32, xpValue: 40
    });

    // 3er-Patrouille Wolken-Harpyien (Sky Harpies)
    this.spawnPack('sky_harpy', 65 * TILE_SIZE, 32 * TILE_SIZE, 3, 34, DIMENSIONS.CLOUDS, 'pack_harpies', {
      scale: 1.05, hp: 85, atk: 24, xpValue: 22
    });
  }

  spawnEnemy(typeId, x, y, dimension = DIMENSIONS.OVERWORLD, packId = null, options = {}) {
    const enemy = new EnemyEntity(typeId, x, y, dimension, packId, options);
    this.enemies.push(enemy);
    return enemy;
  }

  spawnPack(typeId, centerX, centerY, count = 2, radius = 26, dimension = DIMENSIONS.OVERWORLD, packId = null, options = {}) {
    const pack = packId || `pack_${typeId}_${Math.random().toString(36).substr(2, 5)}`;
    const created = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = Math.random() * radius * 0.6 + radius * 0.4;
      const ex = centerX + Math.cos(angle) * dist;
      const ey = centerY + Math.sin(angle) * dist;
      const enemy = new EnemyEntity(typeId, ex, ey, dimension, pack, options);
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

  dropLoot(x, y) {
    // 1. Herz-Beere (❤️ +25 HP)
    if (Math.random() > 0.35) {
      this.lootItems.push({
        type: LOOT_TYPES.HEART,
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        life: 25.0,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    // 2. Köcher-Pfeile (🏹 +3 Pfeile)
    if (Math.random() > 0.45) {
      this.lootItems.push({
        type: LOOT_TYPES.ARROW,
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        life: 25.0,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    // 3. Sternenstaub / Geist-Juwel (⭐ Glanzpartikel)
    this.lootItems.push({
      type: LOOT_TYPES.SPIRIT_GEM,
      x,
      y,
      life: 20.0,
      bobOffset: Math.random() * Math.PI * 2
    });
  }

  spawnXp(x, y, totalXp) {
    if (totalXp <= 0) return;
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

      // Bei Tod Loot & EP droppen und aus Liste entfernen
      if (enemy.state === 'dead') {
        this.dropLoot(enemy.x, enemy.y);
        this.spawnXp(enemy.x, enemy.y, enemy.xpValue);
        this.enemies.splice(i, 1);
      }
    }

    // 2. Update Loot Items
    for (let i = this.lootItems.length - 1; i >= 0; i--) {
      const item = this.lootItems[i];
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
            combatManager.addFloatingText('❤️ +25 LEBEN', player.x, player.y - 20, '#4ade80');
            combatManager.addHitSparks(player.x, player.y, '#4ade80', 12);
            this.lootItems.splice(i, 1);
          }
        } else if (item.type === LOOT_TYPES.ARROW) {
          if (player.ranged && player.ranged.ammo < 30) {
            player.ranged.ammo = Math.min(30, player.ranged.ammo + 3);
            combatManager.addFloatingText('🏹 +3 PFEILE', player.x, player.y - 20, '#38bdf8');
            combatManager.addHitSparks(player.x, player.y, '#38bdf8', 10);
            this.lootItems.splice(i, 1);
          }
        } else if (item.type === LOOT_TYPES.SPIRIT_GEM) {
          combatManager.addFloatingText('⭐ GEIST-FUNKE', player.x, player.y - 20, '#fde047');
          combatManager.addHitSparks(player.x, player.y, '#facc15', 14);
          this.lootItems.splice(i, 1);
        }
      }
    }

    // 3. Update XP Orbs (Magnetischer Flug zum Spieler)
    const MAGNET_RADIUS = 90;
    const PICKUP_RADIUS = 14;

    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const orb = this.xpOrbs[i];
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
    const curDim = this.game.currentDimension;

    // 1. Render Normal Loot
    this.lootItems.forEach(item => {
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

    // 2. Render Glowing Green XP Orbs (Kleine grüne leuchtende Punkte)
    this.xpOrbs.forEach(orb => {
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
}
