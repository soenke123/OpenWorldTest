/**
 * SpectatorManager - Spielleiter & Beobachter-Steuerung für den Host
 * Verwaltet freie Kamerafahrt, Spieler-Verfolgung, Host-HUD, QR-Code und Runden-Management.
 */

import { WORLD_PRESETS, getWorldPreset } from './worldPresets.js';
import { TILE_SIZE } from './constants.js';

export class SpectatorManager {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.followedPlayerId = null; // null = freie Kamera

    // Freie Kamera-Geschwindigkeit
    this.camX = 800;
    this.camY = 1600;
    this.panSpeed = 600; // px/s

    // UI Elemente
    this.container = document.getElementById('spectator-hud');
    this.playersListEl = document.getElementById('spectator-players-list');
    this.lanIpDisplayEl = document.getElementById('spectator-lan-ip');
    this.btnCopyLink = document.getElementById('btn-copy-join-link');
    this.qrImageEl = document.getElementById('spectator-qr-img');
    this.qrWrapperEl = document.getElementById('spectator-qr-wrapper');
    this.btnToggleQr = document.getElementById('btn-toggle-qr');
    this.btnEndGame = document.getElementById('btn-host-end-game');
    this.btnNewRound = document.getElementById('btn-host-new-round');
    this.worldSelectEl = document.getElementById('spectator-world-select');

    // Drag-to-pan State
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.camStartX = 0;
    this.camStartY = 0;

    this.initEvents();
  }

  initEvents() {
    // 1. Link kopieren
    if (this.btnCopyLink) {
      this.btnCopyLink.addEventListener('click', () => {
        const url = this.game.network ? this.game.network.joinUrl : window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(() => {
            const span = this.btnCopyLink.querySelector('span') || this.btnCopyLink;
            const prev = span.textContent;
            span.textContent = '✅ Kopiert!';
            setTimeout(() => { span.textContent = prev; }, 2000);
          }).catch(() => {
            prompt('Kopiere diesen Link für Mitspieler:', url);
          });
        } else {
          prompt('Kopiere diesen Link für Mitspieler:', url);
        }
      });
    }

    // 2. QR-Code ein-/ausklappen
    if (this.btnToggleQr && this.qrWrapperEl) {
      this.btnToggleQr.addEventListener('click', () => {
        this.qrWrapperEl.classList.toggle('hidden');
      });
    }

    // 3. Spiel beenden
    if (this.btnEndGame) {
      this.btnEndGame.addEventListener('click', () => {
        if (confirm('Möchtest du das laufende Spiel beenden und die Siegerehrung starten?')) {
          if (this.game.network) {
            this.game.network.sendHostEndGame();
          }
        }
      });
    }

    // 4. Neue Runde starten
    if (this.btnNewRound) {
      this.btnNewRound.addEventListener('click', () => {
        const selWorld = this.worldSelectEl ? parseInt(this.worldSelectEl.value, 10) : 1;
        if (this.game.network) {
          this.game.network.sendHostStartRound(selWorld);
        }
      });
    }

    // 5. Welt-Auswahl Dropdown befüllen
    if (this.worldSelectEl) {
      this.worldSelectEl.innerHTML = '';
      WORLD_PRESETS.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.id}. ${p.name} (${p.badge})`;
        this.worldSelectEl.appendChild(opt);
      });

      this.worldSelectEl.addEventListener('change', (e) => {
        const newWorldId = parseInt(e.target.value, 10);
        if (this.game.network) {
          this.game.network.sendHostSelectWorld(newWorldId);
        }
      });
    }

    // 6. Canvas Drag-to-pan für die freie Kamera
    const canvas = this.game.canvas;
    if (canvas) {
      canvas.addEventListener('mousedown', (e) => {
        if (!this.active || this.followedPlayerId) return;
        if (e.button === 0 || e.button === 1) { // Left or Middle click
          this.isDragging = true;
          this.dragStartX = e.clientX;
          this.dragStartY = e.clientY;
          this.camStartX = this.camX;
          this.camStartY = this.camY;
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.active || !this.isDragging) return;
        const zoom = (this.game.camera && this.game.camera.zoom) || 2.0;
        const dx = (e.clientX - this.dragStartX) / zoom;
        const dy = (e.clientY - this.dragStartY) / zoom;
        this.camX = this.camStartX - dx;
        this.camY = this.camStartY - dy;
      });

      window.addEventListener('mouseup', () => {
        this.isDragging = false;
      });
    }
  }

  activate() {
    this.active = true;
    if (this.container) {
      this.container.classList.remove('hidden');
    }

    // Eigene Kampf- und Touch-Elemente auf Host ausblenden
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) touchControls.style.display = 'none';

    const playerCompactHud = document.getElementById('player-compact-hud');
    if (playerCompactHud) playerCompactHud.style.display = 'none';

    const magicSlot = document.getElementById('magic-hud-slot');
    if (magicSlot) magicSlot.style.display = 'none';

    // Start-Kamera auf Spawnpunkt der Welt
    if (this.game.map && this.game.map.spawnPoint) {
      this.camX = this.game.map.spawnPoint.x * TILE_SIZE;
      this.camY = this.game.map.spawnPoint.y * TILE_SIZE;
    }

    // Host-Zoom auf Übersicht stellen
    if (this.game.camera) {
      this.game.camera.setZoom(1.85);
    }

    // Server-Info (IP & QR) abrufen
    this.fetchServerInfo();
  }

  async fetchServerInfo() {
    try {
      const res = await fetch('/api/server-info');
      if (!res.ok) return;
      const data = await res.json();

      if (this.lanIpDisplayEl) {
        this.lanIpDisplayEl.textContent = data.joinUrl;
      }
      if (this.qrImageEl && data.qrDataUrl) {
        this.qrImageEl.src = data.qrDataUrl;
      }
      if (this.worldSelectEl && data.worldId) {
        this.worldSelectEl.value = data.worldId;
      }
    } catch (e) {
      console.warn('[Spectator] Konnte Server-Info nicht laden:', e);
    }
  }

  followPlayer(playerId) {
    if (this.followedPlayerId === playerId) {
      // Toggle off -> Freie Kamera
      this.followedPlayerId = null;
      console.log('[Spectator] Kamera freigegeben (Freier Modus)');
    } else {
      this.followedPlayerId = playerId;
      console.log(`[Spectator] Verfolge Spieler: ${playerId}`);
    }
    this.updatePlayersListUI();
  }

  update(dt, input) {
    if (!this.active) return;

    if (this.followedPlayerId) {
      const target = this.game.remotePlayers.get(this.followedPlayerId);
      if (target) {
        this.camX = target.x;
        this.camY = target.y;
      } else {
        this.followedPlayerId = null; // Spieler hat verlassen
      }
    } else {
      // Freie Kamera über Tastatur (WASD oder Pfeile)
      let vx = 0;
      let vy = 0;
      if (input && input.keys) {
        if (input.keys['KeyW'] || input.keys['ArrowUp']) vy -= 1;
        if (input.keys['KeyS'] || input.keys['ArrowDown']) vy += 1;
        if (input.keys['KeyA'] || input.keys['ArrowLeft']) vx -= 1;
        if (input.keys['KeyD'] || input.keys['ArrowRight']) vx += 1;
      }

      if (vx !== 0 || vy !== 0) {
        const len = Math.hypot(vx, vy);
        const speed = this.panSpeed * (input.keys && input.keys['ShiftLeft'] ? 2.5 : 1.0);
        this.camX += (vx / len) * speed * dt;
        this.camY += (vy / len) * speed * dt;
      }
    }

    // Kamera im Spiel aktualisieren
    if (this.game.camera) {
      this.game.camera.follow(this.camX, this.camY);
      this.game.camera.update(dt);
    }

    // Spieler-Liste periodisch aktualisieren
    this.updatePlayersListUI();
  }

  updatePlayersListUI() {
    if (!this.playersListEl) return;

    const players = Array.from(this.game.remotePlayers.values());
    if (players.length === 0) {
      this.playersListEl.innerHTML = '<div class="spectator-no-players">Warte auf Mitspieler...</div>';
      return;
    }

    let html = '';
    for (const p of players) {
      const isFollowed = this.followedPlayerId === p.id;
      const hpPct = Math.round((p.hp / p.maxHp) * 100);
      const hpColor = hpPct > 50 ? '#22c55e' : (hpPct > 25 ? '#f59e0b' : '#ef4444');

      html += `
        <div class="spectator-player-card ${isFollowed ? 'following' : ''}" data-id="${p.id}">
          <div class="sp-card-left">
            <span class="sp-name">${p.name}</span>
            <span class="sp-badge">Lv.${p.level}</span>
            <span class="sp-kills">⚔️ ${p.pvpKills}</span>
          </div>
          <div class="sp-card-right">
            <div class="sp-hp-bar">
              <div class="sp-hp-fill" style="width: ${hpPct}%; background-color: ${hpColor};"></div>
            </div>
            <button class="sp-follow-btn" title="Kamera auf Spieler zentrieren">${isFollowed ? '🎥 Folgt' : '👁️ Zuschauen'}</button>
          </div>
        </div>
      `;
    }

    this.playersListEl.innerHTML = html;

    // Klick-Events auf Spielerkarten
    this.playersListEl.querySelectorAll('.spectator-player-card').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        this.followPlayer(id);
      });
    });
  }
}
