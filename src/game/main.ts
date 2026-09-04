import { AUTO, BlendModes, Events, Game as PhaserGame, Scale, Scene } from 'phaser';
import { generateAllTextures } from '../sprites/textures';
import { isoToScreen, TILE_W, TILE_H } from './utils';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------------------
// HUSTLE — Lagos Commercial Neighborhood visual benchmark
// ---------------------------------------------------------------------------
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const WORLD_W = 2400;
export const WORLD_H = 1600;

// EventBus (React <-> Phaser bridge)
export const EventBus = new Events.EventEmitter();

// Event-name constants (single source of truth so both sides can't drift)
export const EV = {
  SCENE_READY: 'current-scene-ready',
  PHASE: 'phase-changed',
  HOTSPOT_SELECTED: 'hotspot-selected',
  HOTSPOT_CLOSED: 'hotspot-closed',
  TIME_OF_DAY: 'time-of-day-changed',
  CAMERA_FOCUS: 'camera-focus-target',
  TOGGLE_AUDIO: 'toggle-audio',
} as const;

export type TimeOfDay = 'day' | 'golden' | 'night';

interface Hotspot {
  id: string; title: string; category: string; desc: string;
  stats: Record<string, string>; gx: number; gy: number;
}

const HOTSPOTS: Hotspot[] = [
  { id: 'danfo', title: 'Lagos Danfo Route 104', category: 'Transport', gx: 6, gy: 9,
    desc: 'The iconic yellow LT35 minibus — the workhorse transit of Lagos. Route 104 runs commercial corridors packed with traders and commuters. Conductor fares fund daily cash-flow of thousands.',
    stats: { 'Daily Riders': '~1,200', 'Fare': '₦300', 'Owner Model': 'Co-op lease' } },
  { id: 'buka', title: 'Mama Nkechi Buka & Suya', category: 'Food & Informal', gx: 3, gy: 4,
    desc: 'A roadside buka (eatery) with charcoal suya grill. Open-air kitchens are the backbone of neighborhood food economy — low capital, high footfall, cash-only margins.',
    stats: { 'Startup Cost': '₦80k', 'Daily Cover': '~140', 'Peak': 'Evening' } },
  { id: 'plaza', title: 'De-Grace Plaza', category: 'Commercial Real Estate', gx: 12, gy: 4,
    desc: 'Two-storey mixed-use block: generator repair on the ground floor, barber and accounting upstairs. Rooftop GP tank and satellite dishes signal self-sufficient urban commerce.',
    stats: { 'Units': '6 shops', 'Rent/yr': '₦450k', 'Occupancy': '100%' } },
  { id: 'pos', title: 'Ola POS & Mobile Money', category: 'Fintech Agent', gx: 10, gy: 11,
    desc: 'A POS agent kiosk under a yellow-blue umbrella — the neighborhood bank. Withdrawals, deposits, airtime. Fintech agents are among the fastest-growing micro-enterprises in Nigeria.',
    stats: { 'Float': '₦600k', 'Txns/day': '~220', 'Commission': '0.5–1%' } },
  { id: 'boutique', title: 'Anjola Fabrics & Lace', category: 'Retail Fashion', gx: 5, gy: 12,
    desc: 'Ankara and lace boutique with mannequins out front. Fabric retail rides wedding and Aso-Ebi culture — seasonal demand spikes drive a full year of cash flow.',
    stats: { 'Stock Value': '₦1.2M', 'Season': 'Wedding peak', 'Margin': '35%' } },
  { id: 'okada', title: 'Okada Express Stand', category: 'Last-mile Logistics', gx: 13, gy: 9,
    desc: 'Motorcycle-taxi and courier stand. Despite regulation debates, okada remains the fastest last-mile link in dense neighborhoods — and a delivery backbone for e-commerce.',
    stats: { 'Trips/day': '~28', 'Avg Fare': '₦250', 'Fleet': 'Owner-rider' } },
];

const COLORS = { bg: '#1a2230' } as const;

const StartGame = (parent: string) => {
  const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: COLORS.bg,
    scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    scene: [Game],
  };
  const game = new PhaserGame({ ...config, parent });
  if (typeof window !== 'undefined') {
    (window as any).__PHASER_GAME__ = game;
    (window as any).__PHASER_EVENT_BUS__ = EventBus;
  }
  return game;
};

// ---------------------------------------------------------------------------
export class Game extends Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private sortedObjs: Phaser.GameObjects.Image[] = [];
  private moveTarget: { x: number; y: number } | null = null;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private ambient!: Phaser.GameObjects.Rectangle;
  private timeOfDay: TimeOfDay = 'day';
  private audioOn = true;
  private bgm?: Phaser.Sound.BaseSound;
  private smoke?: Phaser.GameObjects.Particles.ParticleEmitter;
  private embers?: Phaser.GameObjects.Particles.ParticleEmitter;
  private dust?: Phaser.GameObjects.Particles.ParticleEmitter;
  private paused = false;

  constructor() { super('Game'); }

  preload() {
    this.load.image('fx_smoke', 'assets/fx/smoke.png');
    this.load.image('fx_spark', 'assets/fx/spark.png');
    this.load.image('fx_glow', 'assets/fx/glow.png');
    this.load.audio('bgm', 'assets/audio/bgm_chill.mp3');
    this.load.audio('sfx_button', 'assets/audio/sfx_button.mp3');
    this.load.audio('sfx_collect', 'assets/audio/sfx_collect.mp3');
    this.load.audio('sfx_powerup', 'assets/audio/sfx_powerup.mp3');
  }

  create() {
    generateAllTextures(this);

    const cx = WORLD_W / 2, cy = WORLD_H / 2 - 120;
    const S = (gx: number, gy: number) => { const p = isoToScreen(gx, gy); return { x: cx + p.x, y: cy + p.y }; };

    // ---- ground tile field ----
    const tileKind = (gx: number, gy: number): string => {
      if (gy === 7 || gy === 8) return 't_asphalt';
      if (gy === 6 || gy === 9) return 't_dirt';
      if (gy === 5 || gy === 10) return 't_paver';
      if (gy === 11) return (gx % 4 === 0) ? 't_plank' : 't_gutter';
      if (gy === 4 || gy === 12) return 't_paver';
      return (gx + gy) % 3 === 0 ? 't_dirt' : 't_paver';
    };
    for (let gy = 1; gy <= 14; gy++) {
      for (let gx = 0; gx <= 16; gx++) {
        const p = S(gx, gy);
        this.add.image(p.x, p.y, tileKind(gx, gy)).setOrigin(0.5, 0.5).setDepth(-1000 + (gx + gy));
        if (gy === 7 || gy === 8) {
          if (gx % 2 === 0) {
            const dash = this.add.rectangle(p.x, p.y, 26, 4, 0xf2c230, 0.85).setDepth(-999 + (gx + gy));
            dash.angle = -26.5;
          }
        }
      }
    }

    // ---- depth-sorted placement helper ----
    const place = (tex: string, gx: number, gy: number, oy = 0, scale = 1) => {
      const p = S(gx, gy);
      const img = this.add.image(p.x, p.y + oy, tex).setOrigin(0.5, 1).setScale(scale);
      this.sortedObjs.push(img);
      return img;
    };

    // ---- buildings ----
    place('b_plaza', 12, 4);
    place('b_buka', 3, 4);
    place('b_pos', 10, 11);
    place('b_boutique', 5, 12);
    place('b_gas', 14, 5, 0, 0.95);

    // ---- vehicles ----
    place('v_danfo', 6, 8, 0, 1);
    place('v_keke', 9, 7, 0, 1);
    place('v_okada_red', 13, 9, 0, 1);
    place('v_okada_blue', 8, 8, 0, 0.9);

    // ---- props / vegetation ----
    place('p_pole', 2, 6); place('p_pole', 8, 6); place('p_pole', 14, 6);
    place('p_pole', 4, 10); place('p_pole', 11, 10);
    place('p_gen', 4, 5); place('p_gen', 11, 5);
    place('p_bin', 7, 5); place('p_bin', 12, 10); place('p_bin', 2, 10);
    place('p_palm', 1, 3); place('p_palm', 15, 3); place('p_palm', 15, 12); place('p_palm', 1, 13);
    place('p_banana', 7, 3); place('p_banana', 13, 12); place('p_banana', 2, 12);
    place('p_hibiscus', 6, 5); place('p_hibiscus', 9, 5); place('p_hibiscus', 11, 12);
    place('p_pot', 4, 4, 0, 1); place('p_pot', 13, 5);

    // overhead sagging wires between poles
    const wire = (a: [number, number], b: [number, number]) => {
      const pa = S(a[0], a[1]), pb = S(b[0], b[1]);
      const g = this.add.graphics().setDepth(-500);
      g.lineStyle(1.4, 0x14181f, 0.85);
      for (let s = 0; s < 3; s++) {
        g.beginPath();
        g.moveTo(pa.x - 6 + s * 6, pa.y - 178 + s * 4);
        const mx = (pa.x + pb.x) / 2, my = Math.max(pa.y, pb.y) - 150 + 30 + s * 5;
        g.lineTo(mx, my);
        g.lineTo(pb.x - 6 + s * 6, pb.y - 178 + s * 4);
        g.strokePath();
      }
    };
    wire([2, 6], [8, 6]); wire([8, 6], [14, 6]); wire([4, 10], [11, 10]);

    // ---- characters ----
    place('c_vendor', 3.4, 4.6);
    place('c_suya', 3.9, 4.4);
    place('c_pos', 10, 11.2);
    place('c_rider', 12.8, 9.2);
    place('c_shop', 5.4, 12.2);

    // ---- player (entrepreneur) ----
    const start = S(7, 9);
    this.player = this.physics.add.sprite(start.x, start.y - 18, 'c_player');
    this.player.setOrigin(0.5, 0.85).setScale(1.1);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(start.y);

    // ---- hotspot beacons (interactive) ----
    for (const h of HOTSPOTS) {
      const p = S(h.gx, h.gy);
      const b = this.add.image(p.x, p.y - 30, 'beacon').setOrigin(0.5, 0.8).setScale(0.9).setDepth(2000);
      b.setInteractive({ useHandCursor: true });
      b.on('pointerover', () => b.setScale(1.08));
      b.on('pointerout', () => b.setScale(0.9));
      b.on('pointerdown', () => this.selectHotspot(h));
      this.tweens.add({ targets: b, y: b.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.tweens.add({ targets: b, alpha: 0.7, duration: 700, yoyo: true, repeat: -1 });
    }

    // ---- particle FX ----
    const genA = S(4, 5);
    this.smoke = this.add.particles(0, 0, 'fx_smoke', {
      x: { min: genA.x - 24, max: genA.x + 24 }, y: genA.y - 30,
      speedY: { min: -34, max: -14 }, speedX: { min: -8, max: 14 },
      scale: { start: 0.5, end: 0 }, alpha: { start: 0.4, end: 0 },
      quantity: 1, frequency: 220, tint: 0x9aa0a6, lifespan: 2200,
    }).setDepth(1500);
    const suya = S(3.9, 4.4);
    this.embers = this.add.particles(0, 0, 'fx_spark', {
      x: { min: suya.x - 8, max: suya.x + 8 }, y: suya.y - 26,
      speedY: { min: -40, max: -16 }, speedX: { min: -10, max: 10 },
      scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 },
      quantity: 1, frequency: 120, tint: [0xff7a2a, 0xffd24a], lifespan: 900,
    }).setDepth(1500);
    this.dust = this.add.particles(0, 0, 'fx_glow', {
      x: { min: cx - 600, max: cx + 600 }, y: { min: cy - 200, max: cy + 300 },
      speedX: { min: -6, max: 6 }, speedY: { min: -3, max: 3 },
      scale: { start: 0.12, end: 0 }, alpha: { start: 0.25, end: 0 },
      quantity: 1, frequency: 300, tint: 0xfff0c0, lifespan: 4000,
    }).setDepth(1400);

    // ---- ambient lighting overlay (screen-fixed) ----
    this.ambient = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 1.6, GAME_HEIGHT * 1.6, 0xffe9b0, 0.06)
      .setDepth(1600).setScrollFactor(0).setBlendMode(BlendModes.MULTIPLY);
    this.applyLighting('day');

    // ---- camera ----
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.05);

    // ---- input ----
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,ESC') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on('keydown-ESC', () => this.togglePause());

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.paused) {
        const wp = this.cameras.main.getWorldPoint(p.x, p.y);
        this.moveTarget = { x: wp.x, y: wp.y - 18 };
      }
    });
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _go: unknown, _dx: number, dy: number) => {
      const cam = this.cameras.main;
      cam.setZoom(clamp(cam.zoom - dy * 0.0008, 0.6, 2.2));
    });

    // ---- EventBus listeners from React ----
    EventBus.on(EV.HOTSPOT_CLOSED, this.clearHotspot, this);
    EventBus.on(EV.TIME_OF_DAY, this.setTimeOfDay, this);
    EventBus.on(EV.CAMERA_FOCUS, this.focusTarget, this);
    EventBus.on(EV.TOGGLE_AUDIO, this.toggleAudio, this);

    this.events.once('shutdown', () => {
      this.time.removeAllEvents();
      this.tweens.killAll();
      this.input.keyboard?.removeAllListeners();
      this.sound.stopAll();
      EventBus.off(EV.HOTSPOT_CLOSED, this.clearHotspot, this);
      EventBus.off(EV.TIME_OF_DAY, this.setTimeOfDay, this);
      EventBus.off(EV.CAMERA_FOCUS, this.focusTarget, this);
      EventBus.off(EV.TOGGLE_AUDIO, this.toggleAudio, this);
    });

    // start ambient BGM
    this.bgm = this.sound.add('bgm', { loop: true, volume: 0.4 });
    this.bgm.play();

    EventBus.emit(EV.PHASE, 'PLAYING');
    EventBus.emit(EV.SCENE_READY, this);
  }

  // ---- public scene methods (called by React via ref or EventBus) ----
  selectHotspot(h: Hotspot) {
    const p = isoToScreen(h.gx, h.gy);
    EventBus.emit(EV.HOTSPOT_SELECTED, {
      id: h.id, title: h.title, category: h.category, desc: h.desc, stats: h.stats,
      coords: { x: p.x, y: p.y },
    });
    this.sound.play('sfx_collect', { volume: 0.5 });
    this.moveTarget = null;
  }

  clearHotspot() { /* selection state lives in React */ }

  setTimeOfDay(tod: TimeOfDay) {
    this.timeOfDay = tod;
    this.applyLighting(tod);
    this.sound.play('sfx_powerup', { volume: 0.4 });
    EventBus.emit(EV.TIME_OF_DAY, tod);
  }

  focusTarget(payload: { targetKey: string }) {
    const cx = WORLD_W / 2, cy = WORLD_H / 2 - 120;
    const h = HOTSPOTS.find((x) => x.id === payload.targetKey);
    if (!h) {
      this.cameras.main.pan(cx, cy, 700, 'Sine.easeInOut');
      this.cameras.main.setZoom(1.05);
      return;
    }
    const p = isoToScreen(h.gx, h.gy);
    this.cameras.main.pan(cx + p.x, cy + p.y, 800, 'Sine.easeInOut');
    this.cameras.main.setZoom(1.5);
  }

  toggleAudio() {
    this.audioOn = !this.audioOn;
    if (this.audioOn) { this.sound.unlock(); this.bgm?.resume(); }
    else { this.bgm?.pause(); }
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.world.pause(); this.tweens.pauseAll();
      this.smoke?.pause(); this.embers?.pause(); this.dust?.pause();
    } else {
      this.physics.world.resume(); this.tweens.resumeAll();
      this.smoke?.resume(); this.embers?.resume(); this.dust?.resume();
    }
    EventBus.emit(EV.PHASE, this.paused ? 'PAUSED' : 'PLAYING');
  }

  private applyLighting(tod: TimeOfDay) {
    const cfg: Record<TimeOfDay, { color: number; alpha: number }> = {
      day: { color: 0xfff2d0, alpha: 0.05 },
      golden: { color: 0xff9a4a, alpha: 0.2 },
      night: { color: 0x2a3a6a, alpha: 0.45 },
    };
    this.ambient.setFillStyle(cfg[tod].color, cfg[tod].alpha);
    this.tweens.add({ targets: this.ambient, alpha: 1, duration: 700 });
  }

  update(_time: number, delta: number) {
    if (this.paused) return;
    const speed = 220;
    let vx = 0, vy = 0;
    const k = this.keys;
    if (k.A.isDown || k.LEFT.isDown) vx -= 1;
    if (k.D.isDown || k.RIGHT.isDown) vx += 1;
    if (k.W.isDown || k.UP.isDown) vy -= 1;
    if (k.S.isDown || k.DOWN.isDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      this.moveTarget = null;
      const ivx = (vx - vy) * (TILE_W / 2);
      const ivy = (vx + vy) * (TILE_H / 2);
      const len = Math.hypot(ivx, ivy) || 1;
      this.player.setVelocity((ivx / len) * speed, (ivy / len) * speed * 0.6);
    } else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.player.x;
      const dy = this.moveTarget.y - this.player.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) { this.player.setVelocity(0, 0); this.moveTarget = null; }
      else this.player.setVelocity((dx / d) * speed, (dy / d) * speed);
    } else {
      this.player.setVelocity(0, 0);
    }

    // depth sort for true 2.5D occlusion
    this.player.setDepth(this.player.y + 18);
    for (const o of this.sortedObjs) o.setDepth(o.y);
    void delta;
  }
}

export default StartGame;