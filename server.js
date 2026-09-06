import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import QRCode from 'qrcode';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

let cachedQrDataUrl = null;
async function getQrDataUrl(url) {
  if (!cachedQrDataUrl) {
    try {
      cachedQrDataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        scale: 6,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
    } catch (e) {
      console.error('[QRCode Error]', e);
    }
  }
  return cachedQrDataUrl;
}

// Automatic Local LAN IPv4 Detection
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  // First check Wi-Fi / WLAN adapters
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const iface of addrs) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (/wlan|wi-fi|wireless|hotspot|ethernet/i.test(name)) {
          return iface.address;
        }
      }
    }
  }
  // Fallback to any non-internal IPv4
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const iface of addrs) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const LAN_IP = getLocalIp();

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// -----------------------------------------------------------------------------
// GAME ROOM STATE (Server-Authoritative Match Coordinator)
// -----------------------------------------------------------------------------
const roomState = {
  worldId: 1, // Default World Preset: Das Smaragd-Hochland
  gameState: 'running', // 'lobby' | 'running' | 'ended'
  hostWs: null,
  players: new Map() // id -> { id, name, skinId, x, y, elevation, dimension, direction, isMoving, hp, maxHp, level, xp, pvpKills, deaths, isDead, shieldActive, isBearForm }
};

function broadcast(msg, excludeWs = null) {
  const data = typeof msg === 'string' ? msg : JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function sendTo(ws, msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
}

function getPlayerSummary(p) {
  return {
    id: p.id,
    name: p.name,
    skinId: p.skinId,
    x: p.x,
    y: p.y,
    elevation: p.elevation || 0,
    dimension: p.dimension || 'overworld',
    direction: p.direction || 'down',
    isMoving: Boolean(p.isMoving),
    isSprinting: Boolean(p.isSprinting),
    hp: p.hp,
    maxHp: p.maxHp,
    level: p.level || 1,
    xp: p.xp || 0,
    pvpKills: p.pvpKills || 0,
    deaths: p.deaths || 0,
    isDead: Boolean(p.isDead),
    shieldActive: Boolean(p.shieldActive),
    isBearForm: Boolean(p.isBearForm)
  };
}

// -----------------------------------------------------------------------------
// HTTP SERVER (Static files + API)
// -----------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  let reqUrl = req.url.split('?')[0];

  // API Endpoint for Server & LAN IP Info
  if (reqUrl === '/api/server-info') {
    const qrDataUrl = await getQrDataUrl(`http://${LAN_IP}:${PORT}`);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      ip: LAN_IP,
      port: PORT,
      joinUrl: `http://${LAN_IP}:${PORT}`,
      qrDataUrl,
      worldId: roomState.worldId,
      gameState: roomState.gameState,
      playerCount: roomState.players.size,
      hasHost: Boolean(roomState.hostWs && roomState.hostWs.readyState === WebSocket.OPEN)
    }));
    return;
  }

  if (reqUrl === '/') reqUrl = '/index.html';

  const filePath = path.join(__dirname, reqUrl);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// -----------------------------------------------------------------------------
// WEBSOCKET SERVER (Real-Time Multiplayer Sync)
// -----------------------------------------------------------------------------
const wss = new WebSocketServer({ server });

let nextClientId = 1;
let masterClientId = null;

wss.on('connection', (ws) => {
  const clientId = `p_${nextClientId++}_${Math.random().toString(36).substr(2, 5)}`;
  let clientRole = 'player'; // 'host' | 'player'

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (e) {
      return;
    }

    switch (msg.type) {
      case 'join': {
        const requestedRole = msg.role === 'host' ? 'host' : 'player';

        // Nur EIN Host ist erlaubt! Wenn bereits ein Host aktiv ist, wird die Rolle abgewiesen
        if (requestedRole === 'host') {
          if (roomState.hostWs && roomState.hostWs !== ws && roomState.hostWs.readyState === WebSocket.OPEN) {
            console.warn(`[Multiplayer] ⚠️ Host-Slot bereits belegt. Client (ID: ${clientId}) wird zum Spieler heruntergestuft.`);
            clientRole = 'player';
          } else {
            clientRole = 'host';
            roomState.hostWs = ws;
            console.log(`[Multiplayer] 👑 Host verbunden (ID: ${clientId})`);
          }
        } else {
          clientRole = 'player';
        }

        if (clientRole === 'player') {
          if (!masterClientId) {
            masterClientId = clientId;
            console.log(`[Multiplayer] 🤖 Master-Client für Monster-Simulation: ${clientId}`);
          }

          const playerRecord = {
            id: clientId,
            ws,
            name: (msg.name && msg.name.trim()) ? msg.name.trim().slice(0, 20) : `Held_${nextClientId}`,
            skinId: msg.skinId || 'ren_twilight',
            x: typeof msg.x === 'number' ? msg.x : 800,
            y: typeof msg.y === 'number' ? msg.y : 1600,
            elevation: 0,
            dimension: msg.dimension || 'overworld',
            direction: 'down',
            isMoving: false,
            isSprinting: false,
            hp: 100,
            maxHp: 100,
            level: 1,
            xp: 0,
            pvpKills: 0,
            deaths: 0,
            isDead: false,
            shieldActive: false,
            isBearForm: false
          };
          roomState.players.set(clientId, playerRecord);
          console.log(`[Multiplayer] ⚔️ Spieler beigetreten: ${playerRecord.name} (${playerRecord.skinId}) [ID: ${clientId}]`);

          // Notify everyone else that a new player joined
          broadcast({
            type: 'player_joined',
            player: getPlayerSummary(playerRecord)
          }, ws);
        }

        // Send initialization package to the connected client
        // EIGENER SPIELER WIRD HIER HERAUSGEFILTERT, damit keine Geister-Kopie entsteht!
        const otherPlayers = Array.from(roomState.players.values())
          .filter(p => p.id !== clientId)
          .map(getPlayerSummary);

        sendTo(ws, {
          type: 'init',
          clientId,
          role: clientRole,
          worldId: roomState.worldId,
          gameState: roomState.gameState,
          lanIp: LAN_IP,
          port: PORT,
          joinUrl: `http://${LAN_IP}:${PORT}`,
          players: otherPlayers,
          hasHost: Boolean(roomState.hostWs && roomState.hostWs.readyState === WebSocket.OPEN),
          masterClientId
        });
        break;
      }

      case 'player_update': {
        if (clientRole !== 'player') return;
        const p = roomState.players.get(clientId);
        if (!p) return;

        p.x = msg.x ?? p.x;
        p.y = msg.y ?? p.y;
        p.elevation = msg.elevation ?? p.elevation;
        p.dimension = msg.dimension ?? p.dimension;
        p.direction = msg.direction ?? p.direction;
        p.isMoving = Boolean(msg.isMoving);
        p.isSprinting = Boolean(msg.isSprinting);
        if (typeof msg.hp === 'number') p.hp = msg.hp;
        if (typeof msg.maxHp === 'number') p.maxHp = msg.maxHp;
        if (typeof msg.level === 'number') p.level = msg.level;
        if (typeof msg.xp === 'number') p.xp = msg.xp;
        p.shieldActive = Boolean(msg.shieldActive);
        p.isBearForm = Boolean(msg.isBearForm);
        p.skinId = msg.skinId || p.skinId;

        // Relay update to all other clients
        broadcast({
          type: 'player_update',
          id: clientId,
          x: p.x,
          y: p.y,
          elevation: p.elevation,
          dimension: p.dimension,
          direction: p.direction,
          isMoving: p.isMoving,
          isSprinting: p.isSprinting,
          hp: p.hp,
          maxHp: p.maxHp,
          level: p.level,
          xp: p.xp,
          shieldActive: p.shieldActive,
          isBearForm: p.isBearForm,
          skinId: p.skinId
        }, ws);
        break;
      }

      case 'player_action': {
        // Broadcast combat actions (melee swing, bow shot, dash, spell cast)
        broadcast({
          type: 'player_action',
          id: clientId,
          action: msg.action,
          subType: msg.subType,
          x: msg.x,
          y: msg.y,
          angle: msg.angle,
          direction: msg.direction,
          dimension: msg.dimension || 'overworld'
        }, ws);
        break;
      }

      case 'pvp_hit': {
        // Player deals damage to another player
        const target = roomState.players.get(msg.targetId);
        const attacker = roomState.players.get(clientId);
        if (!target || !attacker || target.isDead) return;

        const dmg = Math.max(1, Math.round(msg.damage || 10));
        target.hp = Math.max(0, target.hp - dmg);

        console.log(`[Multiplayer PvP] ${attacker.name} trifft ${target.name} für ${dmg} Schaden! (Rest-HP: ${target.hp})`);

        broadcast({
          type: 'pvp_hit',
          attackerId: clientId,
          targetId: target.id,
          damage: dmg,
          kbX: msg.kbX || 0,
          kbY: msg.kbY || 0,
          targetHp: target.hp
        });

        // Check fatal blow
        if (target.hp <= 0 && !target.isDead) {
          target.isDead = true;
          target.deaths++;
          attacker.pvpKills++;

          console.log(`[Multiplayer PvP] ☠️ ${attacker.name} hat ${target.name} besiegt! (Kills: ${attacker.pvpKills})`);

          broadcast({
            type: 'player_killed',
            killerId: attacker.id,
            killerName: attacker.name,
            victimId: target.id,
            victimName: target.name,
            attackerKills: attacker.pvpKills,
            victimDeaths: target.deaths
          });
        }
        break;
      }

      case 'player_respawn': {
        const p = roomState.players.get(clientId);
        if (!p) return;
        p.isDead = false;
        p.hp = p.maxHp;
        p.x = msg.x ?? p.x;
        p.y = msg.y ?? p.y;
        p.elevation = 0;

        broadcast({
          type: 'player_respawned',
          id: clientId,
          x: p.x,
          y: p.y,
          hp: p.hp,
          maxHp: p.maxHp
        });
        break;
      }

      case 'artifact_pickup': {
        broadcast({
          type: 'artifact_pickup',
          finderId: clientId,
          finderName: (roomState.players.get(clientId) || {}).name || 'Jemand',
          artifactType: msg.artifactType,
          shrineIdx: msg.shrineIdx,
          dimension: msg.dimension
        });
        break;
      }

      case 'artifact_respawn': {
        broadcast({
          type: 'artifact_respawn',
          shrineIdx: msg.shrineIdx,
          artifactType: msg.artifactType,
          dimension: msg.dimension
        });
        break;
      }

      case 'enemies_update': {
        if (clientId === masterClientId) {
          broadcast({
            type: 'enemies_update',
            enemies: msg.enemies
          }, ws);
        }
        break;
      }

      case 'damage_enemy': {
        broadcast({
          type: 'damage_enemy',
          attackerId: clientId,
          enemyId: msg.enemyId,
          damage: msg.damage,
          angle: msg.angle,
          knockback: msg.knockback,
          isRange: msg.isRange
        }, ws);
        break;
      }

      // -----------------------------------------------------------------------
      // HOST COMMANDS
      // -----------------------------------------------------------------------
      case 'host_select_world': {
        if (clientRole !== 'host') return;
        const newWorldId = parseInt(msg.worldId, 10) || 1;
        roomState.worldId = newWorldId;
        console.log(`[Multiplayer] 🌍 Host wählt Welt Preset ${newWorldId}`);

        broadcast({
          type: 'world_changed',
          worldId: newWorldId
        });
        break;
      }

      case 'host_end_game': {
        if (clientRole !== 'host') return;
        roomState.gameState = 'ended';

        const playersList = Array.from(roomState.players.values());

        // Find winner: Highest Level (Tiebreaker: XP)
        let highestLevelWinner = null;
        if (playersList.length > 0) {
          highestLevelWinner = [...playersList].sort((a, b) => {
            if (b.level !== a.level) return b.level - a.level;
            return b.xp - a.xp;
          })[0];
        }

        // Find winner: Most PvP Kills (Tiebreaker: fewest deaths)
        let mostKillsWinner = null;
        if (playersList.length > 0) {
          mostKillsWinner = [...playersList].sort((a, b) => {
            if (b.pvpKills !== a.pvpKills) return b.pvpKills - a.pvpKills;
            return a.deaths - b.deaths;
          })[0];
        }

        // Leaderboard table sorted by Level & Kills
        const leaderboard = playersList.map(p => ({
          id: p.id,
          name: p.name,
          skinId: p.skinId,
          level: p.level,
          xp: p.xp,
          pvpKills: p.pvpKills,
          deaths: p.deaths
        })).sort((a, b) => (b.level * 1000 + b.pvpKills * 100) - (a.level * 1000 + a.pvpKills * 100));

        console.log(`[Multiplayer] 🛑 Spiel beendet! Sieger Level: ${highestLevelWinner?.name || '-'}, Sieger Kills: ${mostKillsWinner?.name || '-'}`);

        broadcast({
          type: 'game_ended',
          winners: {
            highestLevel: highestLevelWinner ? getPlayerSummary(highestLevelWinner) : null,
            mostKills: mostKillsWinner ? getPlayerSummary(mostKillsWinner) : null
          },
          leaderboard
        });
        break;
      }

      case 'host_start_round': {
        if (clientRole !== 'host') return;
        const newWorldId = parseInt(msg.worldId, 10) || roomState.worldId;
        roomState.worldId = newWorldId;
        roomState.gameState = 'running';

        // Reset all player stats back to zero / level 1
        for (const p of roomState.players.values()) {
          p.level = 1;
          p.xp = 0;
          p.pvpKills = 0;
          p.deaths = 0;
          p.hp = 100;
          p.maxHp = 100;
          p.isDead = false;
          p.shieldActive = false;
          p.isBearForm = false;
        }

        console.log(`[Multiplayer] 🔄 Neue Runde gestartet in Welt ${newWorldId}! Alle Werte zurückgesetzt.`);

        broadcast({
          type: 'round_started',
          worldId: newWorldId,
          players: Array.from(roomState.players.values()).map(getPlayerSummary)
        });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (clientRole === 'host') {
      console.log(`[Multiplayer] 👑 Host hat die Verbindung getrennt`);
      roomState.hostWs = null;
    } else {
      const p = roomState.players.get(clientId);
      if (p) {
        console.log(`[Multiplayer] 🚪 Spieler hat verlassen: ${p.name} [ID: ${clientId}]`);
        roomState.players.delete(clientId);
        if (clientId === masterClientId) {
          const remaining = Array.from(roomState.players.keys());
          masterClientId = remaining.length > 0 ? remaining[0] : null;
          console.log(`[Multiplayer] 🤖 Neuer Master-Client für Monster-Simulation: ${masterClientId}`);
          if (masterClientId) {
            broadcast({
              type: 'master_client',
              masterClientId
            });
          }
        }
        broadcast({
          type: 'player_left',
          id: clientId,
          name: p.name
        });
      }
    }
  });

  ws.on('error', (err) => {
    console.error(`[Multiplayer Error] Client ${clientId}:`, err.message);
  });
});

// -----------------------------------------------------------------------------
// START SERVER & LOG BANNER
// -----------------------------------------------------------------------------
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [FEHLER] Port ${PORT} ist bereits belegt!`);
    console.error(`   Ein anderer Prozess (oder ein altes Server-Fenster) nutzt Port ${PORT}.`);
    console.error(`   Starte einfach 'start.bat' erneut, um alte Prozesse automatisch zu beenden,\n   oder schließe andere Fenster.\n`);
  } else {
    console.error(`\n❌ [Server-Fehler]:`, err);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('       🗡️  OCARINA OF BRAWLS - LAN MULTIPLAYER  🛡️    ');
  console.log('====================================================');
  console.log(`💻 Host (PC / Spectator):  http://localhost:${PORT}`);
  console.log(`📱 Mitspieler (WLAN/Hotspot): http://${LAN_IP}:${PORT}`);
  console.log('----------------------------------------------------');
  console.log('👉 Alle Geräte im selben WLAN oder Handy-Hotspot können');
  console.log(`   direkt über http://${LAN_IP}:${PORT} beitreten!`);
  console.log('====================================================');
});
