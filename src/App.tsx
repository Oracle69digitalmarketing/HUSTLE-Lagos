import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import StartGame, { EventBus, EV, TimeOfDay } from './game/main';

export interface IRefPhaserGame {
  game: Phaser.Game | null;
  scene: Phaser.Scene | null;
}

interface HotspotData {
  id: string; title: string; category: string; desc: string;
  stats: Record<string, string>; coords: { x: number; y: number };
}

const CAMERA_TARGETS: { key: string; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'danfo', label: 'Danfo Depot' },
  { key: 'buka', label: 'Suya Spot' },
  { key: 'plaza', label: 'De-Grace Plaza' },
  { key: 'pos', label: 'POS Kiosk' },
  { key: 'boutique', label: 'Boutique' },
];

const LIGHT_MODES: { key: TimeOfDay; label: string; icon: string }[] = [
  { key: 'day', label: 'Afternoon Sun', icon: '☀️' },
  { key: 'golden', label: 'Golden Hour', icon: '🌇' },
  { key: 'night', label: 'Lagos Twilight', icon: '🌃' },
];

function Icon({ path, size = 18 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  sun: 'M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5 19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5 19 5 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  audioOn: 'M11 5 6 9H3v6h3l5 4V5z M16 9a3 3 0 0 1 0 6 M19 6a7 7 0 0 1 0 12',
  audioOff: 'M11 5 6 9H3v6h3l5 4V5z M17 9l4 6 M21 9l-4 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  reset: 'M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5',
  close: 'M6 6l12 12M18 6 6 18',
  pin: 'M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  pause: 'M8 5v14M16 5v14',
  play: 'M6 4l14 8-14 8V4z',
};

export default function App() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [phase, setPhase] = useState<'PLAYING' | 'PAUSED'>('PLAYING');
  const [hotspot, setHotspot] = useState<HotspotData | null>(null);
  const [tod, setTod] = useState<TimeOfDay>('day');
  const [audioOn, setAudioOn] = useState(true);
  const [bootError, setBootError] = useState(false);
  const bootTimer = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (phaserRef.current === null) {
      const game = StartGame('game-container');
      phaserRef.current = { game, scene: null };
    }
    const handler = (scene: Phaser.Scene) => {
      if (phaserRef.current) phaserRef.current.scene = scene;
      setBootError(false);
      if (bootTimer.current) { window.clearTimeout(bootTimer.current); bootTimer.current = null; }
    };
    EventBus.on(EV.SCENE_READY, handler);
    // visible boot-failure state so a blank canvas is never silently hidden
    bootTimer.current = window.setTimeout(() => setBootError(true), 12000);

    return () => {
      EventBus.removeListener(EV.SCENE_READY, handler);
      if (bootTimer.current) window.clearTimeout(bootTimer.current);
      phaserRef.current?.game?.destroy(true);
      phaserRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onPhase = (p: 'PLAYING' | 'PAUSED') => setPhase(p);
    const onSelect = (h: HotspotData) => setHotspot(h);
    const onTod = (t: TimeOfDay) => setTod(t);
    EventBus.on(EV.PHASE, onPhase);
    EventBus.on(EV.HOTSPOT_SELECTED, onSelect);
    EventBus.on(EV.TIME_OF_DAY, onTod);
    return () => {
      EventBus.off(EV.PHASE, onPhase);
      EventBus.off(EV.HOTSPOT_SELECTED, onSelect);
      EventBus.off(EV.TIME_OF_DAY, onTod);
    };
  }, []);

  const closeHotspot = () => { setHotspot(null); EventBus.emit(EV.HOTSPOT_CLOSED); };
  const focus = (key: string) => { EventBus.emit(EV.CAMERA_FOCUS, { targetKey: key }); };
  const setLight = (t: TimeOfDay) => { EventBus.emit(EV.TIME_OF_DAY, t); };
  const toggleAudio = () => { setAudioOn((a) => !a); EventBus.emit(EV.TOGGLE_AUDIO); };
  const zoom = (dir: number) => {
    const scene = phaserRef.current?.scene as any;
    if (scene?.cameras) {
      const cam = scene.cameras.main;
      const z = Math.max(0.6, Math.min(2.2, cam.zoom + dir * 0.2));
      cam.setZoom(z);
    }
  };
  const togglePause = () => {
    const scene = phaserRef.current?.scene as any;
    if (scene?.togglePause) scene.togglePause();
  };

  return (
    <div id="app">
      <div id="game-container" />

      <div id="hud">
        {/* Title badge */}
        <div className="badge">
          <span className="badge-mark">◆</span>
          <span className="badge-title">HUSTLE</span>
          <span className="badge-sub">Visual Benchmark • Lagos Commercial Quarter</span>
        </div>

        {/* Top-right controls */}
        <div className="top-right">
          <button className="ctrl" onClick={toggleAudio} title="Toggle sound" aria-label="Toggle sound">
            <Icon path={audioOn ? ICONS.audioOn : ICONS.audioOff} />
          </button>
          <button className="ctrl" onClick={togglePause} title="Pause / Resume" aria-label="Pause">
            <Icon path={phase === 'PAUSED' ? ICONS.play : ICONS.pause} />
          </button>
        </div>

        {/* Camera focus (left rail) */}
        <div className="panel camera-panel">
          <div className="panel-h">
            <Icon path={ICONS.pin} size={14} /> Camera Focus
          </div>
          <div className="camera-grid">
            {CAMERA_TARGETS.map((c) => (
              <button key={c.key} className="chip" onClick={() => focus(c.key)}>{c.label}</button>
            ))}
          </div>
        </div>

        {/* Lighting switcher (bottom-center) */}
        <div className="panel light-panel">
          <div className="panel-h">Atmosphere</div>
          <div className="light-row">
            {LIGHT_MODES.map((m) => (
              <button
                key={m.key}
                className={`light-btn ${tod === m.key ? 'active' : ''}`}
                onClick={() => setLight(m.key)}
              >
                <span className="light-ico">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="zoom-col">
          <button className="ctrl" onClick={() => zoom(1)} aria-label="Zoom in"><Icon path={ICONS.plus} /></button>
          <button className="ctrl" onClick={() => zoom(-1)} aria-label="Zoom out"><Icon path={ICONS.minus} /></button>
          <button className="ctrl" onClick={() => focus('overview')} aria-label="Reset view"><Icon path={ICONS.reset} /></button>
        </div>

        {/* Hint */}
        <div className="hint">WASD / Arrows to walk • Click ground to move • Drag beacons to inspect • Wheel to zoom</div>

        {/* Hotspot inspector card */}
        {hotspot && (
          <div className="inspector">
            <button className="inspector-close" onClick={closeHotspot} aria-label="Close"><Icon path={ICONS.close} /></button>
            <div className="inspector-cat">{hotspot.category}</div>
            <h2 className="inspector-title">{hotspot.title}</h2>
            <p className="inspector-desc">{hotspot.desc}</p>
            <div className="stats">
              {Object.entries(hotspot.stats).map(([k, v]) => (
                <div className="stat" key={k}>
                  <div className="stat-k">{k}</div>
                  <div className="stat-v">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pause overlay */}
        {phase === 'PAUSED' && (
          <div className="pause-overlay">
            <div className="pause-card">
              <h1>Paused</h1>
              <p>Explore the neighborhood at your own pace.</p>
              <button className="primary-btn" onClick={togglePause}>Resume</button>
            </div>
          </div>
        )}

        {/* Boot error state */}
        {bootError && (
          <div className="pause-overlay">
            <div className="pause-card">
              <h1>Loading…</h1>
              <p>The 3D-feel isometric world is still initializing.</p>
              <button className="primary-btn" onClick={() => window.location.reload()}>Reload</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}