/**
 * NetworkManager - WebSocket Client für Ocarina of Brawls LAN-Multiplayer
 * Verwaltet Verbindung, Paket-Serialisierung, Ratenbegrenzung und Event-Dispatching.
 */

export class NetworkManager {
  constructor(game) {
    this.game = game;
    this.ws = null;
    this.connected = false;
    this.clientId = null;
    this.role = 'player'; // 'host' | 'player'
    this.lanIp = '';
    this.joinUrl = '';

    this.updateInterval = 1000 / 25; // 25 Hz Tickrate für Positionsübertragung
    this.lastUpdateSent = 0;

    this.listeners = new Map();
  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
  }

  emit(type, data) {
    const list = this.listeners.get(type);
    if (list) {
      for (const cb of list) {
        try {
          cb(data);
        } catch (err) {
          console.error(`[Network Event Error] ${type}:`, err);
        }
      }
    }
  }

  connect(role = 'player', name = 'Ren', skinId = 'ren_twilight') {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }

    this.role = role;
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}`;

    console.log(`[Network] Verbinde mit WebSocket: ${wsUrl} als ${role}...`);

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (e) {
      console.error('[Network] Konnte WebSocket nicht erstellen:', e);
      return;
    }

    this.ws.onopen = () => {
      this.connected = true;
      console.log('[Network] ✅ WebSocket verbunden!');

      const spawnX = (this.game.player && this.game.player.x) || 800;
      const spawnY = (this.game.player && this.game.player.y) || 1600;
      const dim = (this.game.currentDimension) || 'overworld';

      this.send({
        type: 'join',
        role: this.role,
        name,
        skinId,
        x: spawnX,
        y: spawnY,
        dimension: dim
      });

      this.emit('connected', { role: this.role });
    };

    this.ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        return;
      }
      this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      this.connected = false;
      console.warn('[Network] ⚠️ WebSocket getrennt.');
      this.emit('disconnected', {});
    };

    this.ws.onerror = (err) => {
      console.error('[Network Error]', err);
    };
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleMessage(msg) {
    // 1. Zuerst globale interne State-Updates setzen
    switch (msg.type) {
      case 'init':
        this.clientId = msg.clientId;
        this.lanIp = msg.lanIp;
        this.joinUrl = msg.joinUrl;
        console.log(`[Network] Initialisiert. Eigene ID: ${this.clientId}, LAN-URL: ${this.joinUrl}`);
        break;

      case 'player_killed':
        if (this.game && typeof this.game.showKillFeed === 'function') {
          this.game.showKillFeed(msg.killerName, msg.victimName);
        }
        break;
    }

    // 2. Danach Event an registrierte Listener senden (this.clientId ist nun garantiert gesetzt!)
    this.emit(msg.type, msg);
  }

  update(dt, player) {
    if (!this.connected || this.role !== 'player' || !player) return;

    const now = performance.now();
    if (now - this.lastUpdateSent >= this.updateInterval) {
      this.lastUpdateSent = now;

      this.send({
        type: 'player_update',
        x: Math.round(player.x * 10) / 10,
        y: Math.round(player.y * 10) / 10,
        elevation: player.elevation || 0,
        dimension: this.game.currentDimension || 'overworld',
        direction: player.direction || 'down',
        isMoving: Boolean(player.isMoving),
        isSprinting: Boolean(player.isSprinting),
        hp: player.hp,
        maxHp: player.maxHp,
        level: player.level || 1,
        xp: player.xp || 0,
        shieldActive: Boolean(player.shield && player.shield.active),
        isBearForm: Boolean(player.isBearForm),
        skinId: player.skinId
      });
    }
  }

  sendAction(action, extraData = {}) {
    if (!this.connected || this.role !== 'player') return;
    this.send({
      type: 'player_action',
      action,
      ...extraData
    });
  }

  sendPvPHit(targetId, damage, kbX = 0, kbY = 0) {
    if (!this.connected) return;
    this.send({
      type: 'pvp_hit',
      targetId,
      damage,
      kbX,
      kbY
    });
  }

  sendRespawn(x, y) {
    if (!this.connected) return;
    this.send({
      type: 'player_respawn',
      x,
      y
    });
  }

  sendArtifactPickup(artifactType, shrineIdx, dimension) {
    if (!this.connected) return;
    this.send({
      type: 'artifact_pickup',
      artifactType,
      shrineIdx,
      dimension
    });
  }

  sendHostSelectWorld(worldId) {
    if (!this.connected || this.role !== 'host') return;
    this.send({
      type: 'host_select_world',
      worldId
    });
  }

  sendHostEndGame() {
    if (!this.connected || this.role !== 'host') return;
    this.send({
      type: 'host_end_game'
    });
  }

  sendHostStartRound(worldId) {
    if (!this.connected || this.role !== 'host') return;
    this.send({
      type: 'host_start_round',
      worldId
    });
  }
}
