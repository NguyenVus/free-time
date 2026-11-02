import { BLOCK_DEFS, HOTBAR_ITEMS } from '../world/blocks';
import { CHUNK_HEIGHT } from '../config';
import { VoxelCharacter } from '../player/VoxelCharacter';

// =========================================================================
// MULTIPLAYER: players in the same room see each other, through public relay servers
// =========================================================================
// Plain secure WebSockets get through mobile networks and home routers where direct device-to-
// device WebRTC is often blocked. Two relays are used at once, so one being down changes nothing.
// These servers are public: names and positions sent through them can be read by anyone.
// Pinned, and loaded only after the player enters: if it cannot load, the game stays single-player.
export const MULTIPLAYER_LIBRARY_URL = 'https://cdn.jsdelivr.net/npm/mqtt@5.16.1/dist/mqtt.esm.js';
export const MULTIPLAYER_RELAYS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
export const MULTIPLAYER_TOPIC_PREFIX = 'cherry-blossom-garden-nguyenvus/v1';
export const MULTIPLAYER_MAX_MESSAGE_LENGTH = 1600; // room for one full batch of block edits
export const SYNC_EDITS_PER_MESSAGE = 40;
export const SYNC_MAX_SHARED_EDITS = 2000;
export const SYNC_MESSAGE_SPACING_MS = 100; // public relays do not like bursts
export const SYNC_MAX_DELAY_MS = 1200; // players answer at slightly different moments, not all at once
export const SYNC_MAX_EDITS_PER_SECOND = 1000;
export const SYNC_RESEND_DELAY_MS = 3000;
export const SYNC_MAX_CLOCK_AHEAD_MS = 10 * 60 * 1000;
export const MULTIPLAYER_DEFAULT_ROOM = 'vuon-chung';
export const MULTIPLAYER_MAX_PEERS = 8;
export const MULTIPLAYER_POSE_INTERVAL_MS = 200;
export const MULTIPLAYER_HEARTBEAT_MS = 1000;
export const MULTIPLAYER_PEER_TIMEOUT_MS = 10000; // a closed page or a locked phone stops sending
export const MULTIPLAYER_SNAP_DISTANCE = 20;
export const PLAYER_NAME_STORAGE_KEY = 'cherry_player_name';
export const PLAYER_NAME_MAX_LENGTH = 16;
export const MULTIPLAYER_RELAY_CHECK_MS = 10000;
export const MULTIPLAYER_CROWDED_DISTANCE = 2.5; // closer than this, one player is inside the other
export const MULTIPLAYER_STEP_ASIDE_DISTANCE = 5;
export const MULTIPLAYER_STEP_ASIDE_TRIES = 12;
export const MULTIPLAYER_GREET_DISTANCE = 12;
export const MULTIPLAYER_GREET_MS = 3000;
export const NAME_TAG_SCREEN_WIDTH = 0.22; // constant on screen, so a far player can still be found
export const NAME_TAG_SCREEN_HEIGHT = 0.055;
export const AVATAR_COLORS = [0x38bdf8, 0xf59e0b, 0x34d399, 0xa78bfa, 0xef4444, 0xfacc15, 0x2dd4bf, 0xfb7185];

/** [x, y, z, yaw, isMoving as 0 or 1] */
export type Pose = [number, number, number, number, number];
/** [x, y, z, blockId, time the edit was made] */
export type SharedEdit = [number, number, number, number, number];

// Everything received comes from another person's browser, so it is checked before use.
export const cleanPlayerName = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, PLAYER_NAME_MAX_LENGTH);
};
export const isValidPose = (pose: unknown): pose is Pose =>
  Array.isArray(pose) && pose.length === 5 && pose.every(Number.isFinite) &&
  Math.abs(pose[0]) < 1e6 && Math.abs(pose[2]) < 1e6 && pose[1] > -64 && pose[1] < 256;

export const isPlausibleEditTime = (time: unknown): time is number =>
  typeof time === 'number' && Number.isFinite(time) && time >= 0 && time <= Date.now() + SYNC_MAX_CLOCK_AHEAD_MS;
// Only blocks a player can really place, so a message cannot create anything else
export const isValidEdit = (edit: unknown): edit is SharedEdit =>
  Array.isArray(edit) && edit.length === 5 &&
  Number.isInteger(edit[0]) && Math.abs(edit[0]) < 1e6 &&
  Number.isInteger(edit[1]) && edit[1] >= 0 && edit[1] < CHUNK_HEIGHT &&
  Number.isInteger(edit[2]) && Math.abs(edit[2]) < 1e6 &&
  (edit[3] === BLOCK_DEFS.AIR || HOTBAR_ITEMS.some(item => item.id === edit[3])) &&
  isPlausibleEditTime(edit[4]);

export class MultiplayerClient {
  declare batchTimer: any;
  declare departed: any;
  declare game: any;
  declare lastPose: any;
  declare lastPoseSent: any;
  declare name: any;
  declare peers: any;
  declare relays: any;
  declare resendTimer: any;
  declare selfId: any;
  declare sequence: any;
  declare shareTimer: any;
  declare status: any;
  declare statusEl: any;
  declare topic: any;

  constructor(game) {
    this.game = game;
    this.peers = new Map();
    this.selfId = Math.random().toString(36).slice(2, 14).padEnd(12, '0');
    this.sequence = Date.now(); // keeps rising across reloads, so old messages can be told apart
    this.relays = [];
    this.departed = new Map();
    this.status = 'off';
    this.name = '';
    this.lastPoseSent = 0;
    this.lastPose = null;
    this.statusEl = document.getElementById('btn-online');
  }

  getRoomId() {
    const requested = new URLSearchParams(window.location.search).get('phong') || '';
    return requested.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || MULTIPLAYER_DEFAULT_ROOM;
  }

  async connect(name) {
    if (this.relays.length || this.status === 'connecting') return;
    this.name = name;
    this.setStatus('connecting');
    try {
      const { default: mqtt } = await import(/* @vite-ignore */ MULTIPLAYER_LIBRARY_URL);
      this.topic = `${MULTIPLAYER_TOPIC_PREFIX}/${this.getRoomId()}`;
      this.relays = MULTIPLAYER_RELAYS.map(url => {
        const relay = mqtt.connect(url, { reconnectPeriod: 3000, connectTimeout: 8000, keepalive: 30 });
        relay.on('connect', () => {
          relay.subscribe(this.topic, { qos: 1 });
          this.setStatus('online');
          this.lastPoseSent = 0; // say hello straight away, including after a phone wakes up
          this.publish({ needEdits: true }); // catch up on anything missed while away
        });
        relay.on('message', (_topic, payload) => this.handleMessage(payload.toString()));
        relay.on('error', error => console.warn('Multiplayer relay error:', url, error.message));
        return relay;
      });

      setInterval(() => {
        if (this.peers.size === 0) this.setStatus(this.relays.some(relay => relay.connected) ? 'online' : 'failed');
      }, MULTIPLAYER_RELAY_CHECK_MS);
      window.addEventListener('pagehide', () => this.publish({ leaving: true }));
    } catch (error) {
      console.warn('Multiplayer unavailable:', error);
      this.setStatus('failed');
    }
  }

  // Positions are replaced by the next one a moment later, so a lost one does not matter.
  // Anything else is sent with delivery confirmation.
  publish(fields) {
    const message = JSON.stringify({ id: this.selfId, seq: ++this.sequence, name: this.name, ...fields });
    const options = { qos: fields.pose ? 0 : 1 };
    for (const relay of this.relays) {
      if (relay.connected) relay.publish(this.topic, message, options);
    }
  }

  // Anyone can publish to a public relay, so nothing here is trusted until it has been checked.
  handleMessage(text: string) {
    if (text.length > MULTIPLAYER_MAX_MESSAGE_LENGTH) return;
    let message;
    try {
      message = JSON.parse(text);
    } catch (error) {
      return;
    }
    if (!message || typeof message.id !== 'string' || !/^[a-z0-9]{8,16}$/.test(message.id)) return;
    if (message.id === this.selfId || !Number.isFinite(message.seq)) return;

    if (message.leaving === true) {
      this.departed.set(message.id, message.seq);
      this.removePeer(message.id, true);
      return;
    }
    // A copy from the slower relay must not bring back someone who just left
    if (message.seq <= (this.departed.get(message.id) || 0)) return;

    const peer = this.getOrAddPeer(message.id);
    if (!peer) return;
    this.handleName(message.id, message.name);

    // Every message arrives once per relay. Old positions are skipped, but edits never are:
    // relays do not stay in step, and applying an edit twice is harmless while skipping one is not.
    if (isValidPose(message.pose) && message.seq > peer.lastSequence) {
      peer.lastSequence = message.seq;
      this.handlePose(message.id, message.pose);
    }
    if (message.needEdits === true) this.scheduleSharingEdits();
    if (Number.isFinite(message.reset)) this.handleReset(message.reset, peer);
    if (Array.isArray(message.edits)) this.handleEdits(message.edits, peer);
  }

  shareEdit(x: number, y: number, z: number, blockId: number, time: number) {
    this.publish({ edits: [[x, y, z, blockId, time]] });
  }

  shareReset(time: number) {
    this.publish({ reset: time });
  }

  handleReset(time, peer) {
    if (time <= this.game.world.lastResetAt || !isPlausibleEditTime(time)) return;
    this.game.resetWorldAndView(time);
    this.game.showToast(`${peer.name} đã đặt lại thế giới`);
  }

  handleEdits(edits: unknown[], peer) {
    const now = performance.now();
    if (now - peer.editWindowStart >= 1000) {
      peer.editWindowStart = now;
      peer.editsInWindow = 0;
    }
    const valid = edits.filter(isValidEdit);
    const allowed = valid.slice(0, Math.max(0, SYNC_MAX_EDITS_PER_SECOND - peer.editsInWindow));
    // Only real changes count: each message arrives once per relay, and the copy changes nothing
    if (allowed.length) peer.editsInWindow += this.game.world.applySharedEdits(allowed);
    if (allowed.length < valid.length) this.requestResend();
  }

  // Some edits went over the limit, so ask for them again once things have calmed down
  requestResend() {
    if (this.resendTimer) return;
    this.resendTimer = setTimeout(() => {
      this.resendTimer = null;
      this.publish({ needEdits: true });
    }, SYNC_RESEND_DELAY_MS);
  }

  // Someone new has appeared, or asked: send them this world's edits, and they send theirs.
  // Together with "newest edit wins", this brings both worlds to the same state.
  scheduleSharingEdits() {
    if (this.shareTimer) return;
    this.shareTimer = setTimeout(() => {
      this.shareTimer = null;
      this.shareEditsInBatches();
    }, Math.random() * SYNC_MAX_DELAY_MS);
  }

  shareEditsInBatches() {
    clearInterval(this.batchTimer);
    const world = this.game.world;
    if (world.lastResetAt > 0) this.publish({ reset: world.lastResetAt });

    const pending = [];
    world.modifiedBlocks.forEach((blockId, key) => {
      const [x, y, z] = key.split(',').map(Number);
      pending.push([x, y, z, blockId, world.editTimes.get(key) || 0]);
    });
    pending.sort((a, b) => b[4] - a[4]);
    pending.length = Math.min(pending.length, SYNC_MAX_SHARED_EDITS);

    let next = 0;
    const sendBatch = () => {
      if (next >= pending.length) {
        clearInterval(this.batchTimer);
        return;
      }
      this.publish({ edits: pending.slice(next, next + SYNC_EDITS_PER_MESSAGE) });
      next += SYNC_EDITS_PER_MESSAGE;
    };
    sendBatch();
    this.batchTimer = setInterval(sendBatch, SYNC_MESSAGE_SPACING_MS);
  }

  setStatus(status) {
    this.status = status;
    if (!this.statusEl) return;
    const labels = {
      off: '👥 Một mình',
      connecting: '👥 Đang kết nối...',
      failed: '👥 Không kết nối được',
      online: `👥 ${this.peers.size + 1} người`
    };
    this.statusEl.textContent = labels[status];
    this.statusEl.classList.toggle('active', status === 'online' && this.peers.size > 0);
  }

  describePlayers() {
    if (this.status === 'failed') return 'Không kết nối được, bạn vẫn chơi một mình bình thường';
    if (this.status !== 'online') return 'Đang tìm người chơi khác...';
    const names = [...this.peers.values()].map(peer => peer.name);
    if (names.length) return `Đang ở đây: ${names.join(', ')}. Xem chấm màu trên bản đồ nhỏ`;
    return 'Chưa thấy ai. Máy kia cần mở web và bấm vào vườn, cả 2 máy giữ màn hình sáng';
  }

  getOrAddPeer(peerId) {
    if (this.peers.has(peerId)) return this.peers.get(peerId);
    if (this.peers.size >= MULTIPLAYER_MAX_PEERS) return null;

    let hash = 0;
    for (let i = 0; i < peerId.length; i++) hash = (hash * 31 + peerId.charCodeAt(i)) | 0;
    const color = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
    const avatar = new VoxelCharacter(this.game.scene, color);
    avatar.visible = false; // until the first position arrives

    const peer = {
      avatar,
      color,
      name: 'Khách',
      nameTag: null,
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      yaw: 0,
      targetYaw: 0,
      moving: false,
      placed: false,
      announced: false,
      greetUntil: 0,
      greetYaw: null,
      lastSequence: 0,
      editWindowStart: 0,
      editsInWindow: 0,
      lastHeard: performance.now()
    };
    this.peers.set(peerId, peer);
    this.scheduleSharingEdits();
    this.setNameTag(peer);
    this.setStatus('online');
    return peer;
  }

  handleName(peerId, value) {
    const peer = this.getOrAddPeer(peerId);
    const name = cleanPlayerName(value);
    if (!peer || !name) return;
    peer.name = name;
    peer.lastHeard = performance.now();
    this.setNameTag(peer);
    if (!peer.announced) {
      peer.announced = true;
      this.game.showToast(`${name} đã vào vườn 🌸`);
    }
  }

  handlePose(peerId, pose) {
    if (!isValidPose(pose)) return;
    const peer = this.getOrAddPeer(peerId);
    if (!peer) return;
    peer.target.set(pose[0], pose[1], pose[2]);
    peer.targetYaw = pose[3];
    peer.moving = pose[4] === 1;
    peer.lastHeard = performance.now();
    const isFirstPose = !peer.placed;
    if (isFirstPose || peer.position.distanceTo(peer.target) > MULTIPLAYER_SNAP_DISTANCE) {
      peer.position.copy(peer.target);
      peer.yaw = peer.targetYaw;
      peer.placed = true;
      peer.avatar.visible = true;
    }
    // Everyone starts on the same spot, where each camera would sit inside the other's head
    if (isFirstPose) {
      const distance = this.game.player.pos.distanceTo(peer.position);
      if (distance < MULTIPLAYER_CROWDED_DISTANCE) {
        this.game.stepAsideFrom(peer.position, this.getStepAsideAngle());
      }
      // Whoever did not need to step aside still has to turn to see the other player
      if (distance <= MULTIPLAYER_GREET_DISTANCE) {
        peer.greetUntil = performance.now() + MULTIPLAYER_GREET_MS;
        peer.greetYaw = null;
      }
    }
  }

  // Each player has their own direction, so two players who step aside end up apart
  getStepAsideAngle() {
    let hash = 0;
    const id = this.selfId || '';
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    return (Math.abs(hash) % 360) * Math.PI / 180;
  }

  drawOnMinimap(ctx, size, centerX, centerZ, range) {
    const scale = size / (range * 2);
    const edge = size / 2 - 3;
    for (const peer of this.peers.values()) {
      if (!peer.placed) continue;
      // Players beyond the map stay pinned to its edge, which shows which way to walk
      const dx = (peer.position.x - centerX) * scale;
      const dz = (peer.position.z - centerZ) * scale;
      const pin = Math.min(1, edge / Math.max(1, Math.hypot(dx, dz)));
      ctx.fillStyle = '#' + new THREE.Color(peer.color).getHexString();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(size / 2 + dx * pin, size / 2 + dz * pin, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  setNameTag(peer) {
    if (peer.nameTag) {
      peer.avatar.group.remove(peer.nameTag);
      peer.nameTag.material.map.dispose();
      peer.nameTag.material.dispose();
    }
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(20, 10, 24, 0.75)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.font = '700 30px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(peer.name, 128, 33, 240);

    peer.nameTag = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
      depthTest: false, // shows through trees and hills, to help players find each other
      sizeAttenuation: false,
      fog: false
    }));
    peer.nameTag.renderOrder = 10;
    peer.nameTag.scale.set(NAME_TAG_SCREEN_WIDTH, NAME_TAG_SCREEN_HEIGHT, 1);
    peer.nameTag.position.y = 2.05;
    peer.avatar.group.add(peer.nameTag);
  }

  removePeer(peerId, announce) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    this.game.scene.remove(peer.avatar.group);
    peer.avatar.group.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
      }
    });
    this.peers.delete(peerId);
    this.setStatus(this.status);
    if (announce) this.game.showToast(`${peer.name} đã rời vườn`);
  }

  update(dt, player, isMoving) {
    if (!this.relays.length) return;
    const now = performance.now();

    // Sent even when alone: this heartbeat is how other players discover this one
    if (now - this.lastPoseSent >= MULTIPLAYER_POSE_INTERVAL_MS) {
      const pose = [
        Math.round(player.pos.x * 100) / 100,
        Math.round(player.pos.y * 100) / 100,
        Math.round(player.pos.z * 100) / 100,
        Math.round(player.yaw * 100) / 100,
        isMoving ? 1 : 0
      ];
      const changed = !this.lastPose || pose.some((value, i) => value !== this.lastPose[i]);
      if (changed || now - this.lastPoseSent >= MULTIPLAYER_HEARTBEAT_MS) {
        this.publish({ pose });
        this.lastPose = pose;
        this.lastPoseSent = now;
      }
    }

    const rate = 1.0 - Math.exp(-12 * dt);
    for (const [peerId, peer] of this.peers) {
      if (now - peer.lastHeard > MULTIPLAYER_PEER_TIMEOUT_MS) {
        this.removePeer(peerId, true);
        continue;
      }
      peer.position.lerp(peer.target, rate);
      const turn = Math.atan2(Math.sin(peer.targetYaw - peer.yaw), Math.cos(peer.targetYaw - peer.yaw));
      peer.yaw += turn * rate;
      peer.avatar.update(peer.position, peer.yaw, peer.moving, dt);

      if (now < peer.greetUntil) {
        // Any move or look from the player ends this at once: their input always wins
        const playerTurned = peer.greetYaw !== null && Math.abs(this.game.targetYaw - peer.greetYaw) > 0.001;
        if (isMoving || playerTurned) peer.greetUntil = 0;
        else peer.greetYaw = this.game.turnToward(peer.position);
      }
    }
  }
}
