// Procedural isometric texture generators for the HUSTLE Lagos neighborhood.
// Every sprite is hand-drawn with Canvas 2D using the iso helpers in utils.ts,
// producing a cohesive, richly-detailed "almost 3D" 2.5D look.
import { Scene } from 'phaser';
import {
  isoTop, isoSides, isoBox, isoWindowRight, isoWindowLeft,
  dropShadow, shade, rgba, mulberry32, RGB,
} from '../game/utils';

// --- cohesive warm Lagos palette ------------------------------------------
export const PAL = {
  asphalt: [43, 43, 48] as RGB,
  roadLine: '#f2c230',
  dirt: [168, 84, 47] as RGB,
  paver: [201, 168, 106] as RGB,
  concrete: [150, 148, 140] as RGB,
  zinc: [122, 128, 138] as RGB,
  danfoYellow: [245, 197, 24] as RGB,
  teal: [46, 139, 139] as RGB,
  cream: [232, 217, 181] as RGB,
  gold: [224, 169, 46] as RGB,
  terracotta: [181, 101, 29] as RGB,
  wood: [122, 78, 42] as RGB,
  darkWood: [82, 52, 28] as RGB,
  green: [58, 128, 60] as RGB,
  palm: [74, 154, 78] as RGB,
  skin: [110, 70, 45] as RGB,
  skin2: [138, 92, 60] as RGB,
  water: [70, 120, 140] as RGB,
};

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  return { c, ctx };
}

// --------------------------------------------------------------------------
// GROUND TILES (64x32 iso diamonds)
// --------------------------------------------------------------------------
function tileAsphalt(ctx: CanvasRenderingContext2D) {
  const rnd = mulberry32(7);
  isoTop(ctx, 32, 16, 32, 16, shade(PAL.asphalt, 1));
  ctx.save();
  isoTop(ctx, 32, 16, 32, 16, '#000'); ctx.clip();
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(${180 + rnd() * 40 | 0},${180 + rnd() * 40 | 0},${190},${0.04 + rnd() * 0.05})`;
    ctx.fillRect(rnd() * 64, rnd() * 32, 1.5, 1.5);
  }
  ctx.restore();
}
function tileDirt(ctx: CanvasRenderingContext2D) {
  const rnd = mulberry32(13);
  isoTop(ctx, 32, 16, 32, 16, shade(PAL.dirt, 1));
  ctx.save(); isoTop(ctx, 32, 16, 32, 16, '#000'); ctx.clip();
  for (let i = 0; i < 60; i++) {
    const f = 0.7 + rnd() * 0.5;
    ctx.fillStyle = rgba([168, 84, 47], 0.5);
    ctx.fillStyle = shade([190, 110, 60], f);
    ctx.globalAlpha = 0.35;
    ctx.fillRect(rnd() * 64, rnd() * 32, 2, 1.4);
  }
  // gravel
  ctx.globalAlpha = 1;
  for (let i = 0; i < 18; i++) { ctx.fillStyle = 'rgba(90,50,30,0.6)'; ctx.beginPath(); ctx.arc(rnd() * 64, rnd() * 32, 1 + rnd(), 0, 7); ctx.fill(); }
  ctx.restore();
}
function tilePaver(ctx: CanvasRenderingContext2D) {
  isoTop(ctx, 32, 16, 32, 16, shade(PAL.paver, 0.92));
  ctx.save(); isoTop(ctx, 32, 16, 32, 16, '#000'); ctx.clip();
  // interlocking herringbone blocks
  for (let r = -2; r < 6; r++) {
    for (let col = -2; col < 6; col++) {
      const bx = 32 + (col - r) * 11;
      const by = 16 + (col + r) * 5.5;
      ctx.beginPath();
      ctx.moveTo(bx, by - 5); ctx.lineTo(bx + 10, by); ctx.lineTo(bx, by + 5); ctx.lineTo(bx - 10, by); ctx.closePath();
      ctx.fillStyle = shade(PAL.paver, (col + r) % 2 ? 1.04 : 0.96);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,50,0.5)'; ctx.lineWidth = 0.6; ctx.stroke();
    }
  }
  ctx.restore();
}
function tileGutter(ctx: CanvasRenderingContext2D) {
  isoTop(ctx, 32, 16, 32, 16, shade(PAL.concrete, 1));
  // inner channel with water sheen
  isoTop(ctx, 32, 16, 22, 11, shade(PAL.concrete, 0.6));
  isoTop(ctx, 32, 18, 16, 7, rgba(PAL.water, 0.85));
  ctx.save(); isoTop(ctx, 32, 18, 16, 7, '#000'); ctx.clip();
  const g = ctx.createLinearGradient(16, 12, 48, 24);
  g.addColorStop(0, 'rgba(255,255,255,0.0)'); g.addColorStop(0.5, 'rgba(220,240,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(10, 8, 50, 24);
  ctx.restore();
}
function tilePlank(ctx: CanvasRenderingContext2D) {
  // wooden crossing plank over gutter
  isoTop(ctx, 32, 16, 32, 16, shade(PAL.concrete, 0.6));
  isoTop(ctx, 32, 18, 16, 7, rgba(PAL.water, 0.8));
  ctx.save(); ctx.translate(32, 16);
  for (let i = -3; i <= 3; i++) {
    ctx.fillStyle = shade(PAL.wood, 0.9 + (i % 2) * 0.12);
    ctx.fillRect(-26, i * 4 - 1.5, 52, 3.2);
  }
  ctx.strokeStyle = 'rgba(40,20,10,0.5)'; ctx.lineWidth = 0.8;
  ctx.strokeRect(-26, -14, 52, 28);
  ctx.restore();
}

// --------------------------------------------------------------------------
// BUILDINGS
// --------------------------------------------------------------------------
function signage(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, text: string, bg: string, fg: string) {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  ctx.fillStyle = fg;
  ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

// De-Grace Plaza — 2-storey yellow/teal commercial complex
function plaza(ctx: CanvasRenderingContext2D) {
  const W = 280, H = 320;
  ctx.translate(W / 2, H - 40);
  dropShadow(ctx, 0, 0, 120, 46, 0.4);
  const hw = 92, hh = 46;
  // ground floor (teal)
  isoBox(ctx, 0, 0, hw, hh, 86, PAL.teal);
  // upper floor (cream)
  isoBox(ctx, 0, -86, hw, hh, 80, PAL.cream);
  // windows upper (right face)
  for (let i = 0; i < 3; i++) {
    isoWindowRight(ctx, 18 + i * 26, -150 + i * 13, 18, 22, 0.5, 'rgba(40,70,90,0.9)');
    isoWindowLeft(ctx, -18 - i * 26, -150 + i * 13, 18, 22, 0.5, 'rgba(40,70,90,0.9)');
  }
  // ground shopfront opening (right face)
  isoWindowRight(ctx, 14, -60, 60, 50, 0.5, 'rgba(20,30,40,0.85)', 'rgba(0,0,0,0.5)');
  // balcony railing
  ctx.strokeStyle = shade(PAL.cream, 0.7); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-hw, -86); ctx.lineTo(0, -86 + hh); ctx.lineTo(hw, -86); ctx.stroke();
  for (let i = 0; i < 8; i++) { const t = i / 7; const x = -hw + t * hw; const y = -86 + t * hh; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 8); ctx.stroke(); ctx.beginPath(); const x2 = t * hw; ctx.moveTo(x2, -86 + hh - t * hh); ctx.lineTo(x2, -86 + hh - t * hh + 8); ctx.stroke(); }
  // roof line + parapet
  isoTop(ctx, 0, -166, hw, hh, shade(PAL.concrete, 1.05));
  // rooftop GP water tank on iron stand
  ctx.save(); ctx.translate(-30, -186);
  ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-8, 18); ctx.moveTo(12, 0); ctx.lineTo(8, 18); ctx.moveTo(0, -2); ctx.lineTo(0, 18); ctx.stroke();
  ctx.fillStyle = '#22262b'; ctx.fillRect(-16, -26, 32, 26);
  ctx.fillStyle = '#33383f'; ctx.fillRect(-16, -26, 32, 6);
  ctx.restore();
  // satellite dishes
  for (const dx of [40, 58]) {
    ctx.save(); ctx.translate(dx, -178);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 8); ctx.stroke();
    ctx.fillStyle = '#cfd3d8'; ctx.beginPath(); ctx.ellipse(0, -2, 10, 7, -0.5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#9aa0a6'; ctx.stroke();
    ctx.restore();
  }
  // AC unit
  ctx.fillStyle = '#d8d8d8'; ctx.fillRect(60, -150, 16, 12); ctx.strokeStyle = '#999'; ctx.strokeRect(60, -150, 16, 12);
  // weathered stains
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(-hw + 10, -150, 6, 60); ctx.fillRect(30, -140, 5, 50);
  ctx.restore();
  // signage band
  signage(ctx, 0, -40, 150, 22, 'DE-GRACE PLAZA', '#f5c518', '#1a1a1a');
  // ground shop label
  ctx.save(); ctx.fillStyle = '#0e3b3b'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center';
  ctx.fillText('GENERATOR REPAIR', 30, -16); ctx.restore();
}

// Mama Nkechi Buka & Suya spot — open front, zinc roof, grill
function buka(ctx: CanvasRenderingContext2D) {
  const W = 260, H = 220;
  ctx.translate(W / 2, H - 30);
  dropShadow(ctx, 0, 0, 110, 42, 0.4);
  const hw = 86, hh = 43;
  // back wall block
  isoBox(ctx, 0, 0, hw, hh, 54, PAL.terracotta);
  // zinc corrugated roof (overhanging)
  ctx.save();
  isoTop(ctx, 0, -70, hw + 14, hh + 7, shade(PAL.zinc, 1.1));
  ctx.save(); isoTop(ctx, 0, -70, hw + 14, hh + 7, '#000'); ctx.clip();
  ctx.strokeStyle = 'rgba(40,46,55,0.6)'; ctx.lineWidth = 1.4;
  for (let i = -10; i < 12; i++) { ctx.beginPath(); ctx.moveTo(-hw + i * 9, -70 - 30); ctx.lineTo(-hw + i * 9 + 40, -70 + 30); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(60,66,75,0.9)'; ctx.lineWidth = 2; isoTop(ctx, 0, -70, hw + 14, hh + 7, 'rgba(0,0,0,0)'); ctx.stroke();
  ctx.restore();
  // roof support posts
  ctx.fillStyle = PAL.darkWood[0] + '';
  ctx.strokeStyle = shade(PAL.darkWood, 1); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-hw + 6, -8); ctx.lineTo(-hw + 6, -66); ctx.moveTo(hw - 6, -8); ctx.lineTo(hw - 6, -66); ctx.moveTo(0, hh - 4); ctx.lineTo(0, -62); ctx.stroke();
  // wooden counter
  isoBox(ctx, 6, -2, 46, 23, 22, PAL.wood);
  // cooking pots on counter
  for (const px of [-10, 14, 36]) {
    ctx.fillStyle = '#6b6f76'; ctx.beginPath(); ctx.ellipse(px, -28, 9, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a8f98'; ctx.beginPath(); ctx.ellipse(px, -30, 9, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#caa15a'; ctx.beginPath(); ctx.ellipse(px, -30, 6, 3, 0, 0, 7); ctx.fill();
  }
  // suya grill (right side) with embers
  ctx.save(); ctx.translate(64, -10);
  ctx.fillStyle = '#3a3a3a'; ctx.fillRect(-16, -6, 32, 10);
  ctx.fillStyle = '#222'; ctx.fillRect(-16, -8, 32, 3);
  ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); ctx.ellipse(0, -7, 13, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.ellipse(-4, -7, 4, 1.6, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#777'; ctx.lineWidth = 1;
  for (let i = -12; i <= 12; i += 4) { ctx.beginPath(); ctx.moveTo(i, -9); ctx.lineTo(i, -5); ctx.stroke(); }
  // skewers
  ctx.strokeStyle = shade(PAL.wood, 1); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-14, -12); ctx.lineTo(14, -12); ctx.moveTo(-14, -14); ctx.lineTo(14, -14); ctx.stroke();
  ctx.fillStyle = '#7a3a1a';
  for (let i = -10; i <= 10; i += 6) { ctx.beginPath(); ctx.arc(i, -12, 2.4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(i + 2, -14, 2.4, 0, 7); ctx.fill(); }
  ctx.restore();
  // drink crates
  const crate = (x: number, y: number, col: string) => { ctx.fillStyle = col; ctx.fillRect(x, y, 18, 12); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.strokeRect(x, y, 18, 12); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 3 + i * 5, y + 2, 3, 3); };
  crate(-78, -12, '#c0392b'); crate(-78, -24, '#2e6db4'); crate(-60, -12, '#c0392b');
  // wooden bench
  ctx.fillStyle = shade(PAL.wood, 0.9); ctx.fillRect(-40, 6, 60, 6); ctx.fillRect(-36, 12, 5, 8); ctx.fillRect(18, 12, 5, 8);
  // sign
  signage(ctx, 0, -92, 168, 22, "MAMA NKECHI BUKA", '#b53a1a', '#fff');
}

// Ola POS & Mobile Money kiosk — yellow/blue, umbrella canopy
function posKiosk(ctx: CanvasRenderingContext2D) {
  const W = 180, H = 200;
  ctx.translate(W / 2, H - 26);
  dropShadow(ctx, 0, 0, 64, 26, 0.4);
  const hw = 40, hh = 20;
  // kiosk body
  isoBox(ctx, 0, 0, hw, hh, 52, PAL.gold);
  isoWindowRight(ctx, 10, -40, 26, 26, 0.5, 'rgba(30,40,50,0.9)');
  // blue trim
  ctx.fillStyle = '#2e6db4'; ctx.beginPath(); ctx.moveTo(-hw, -52); ctx.lineTo(0, -52 + hh); ctx.lineTo(hw, -52); ctx.lineTo(hw, -46); ctx.lineTo(0, -46 + hh); ctx.lineTo(-hw, -46); ctx.closePath(); ctx.fill();
  // solar panel on top
  ctx.save(); ctx.translate(0, -64);
  ctx.fillStyle = '#1b2a4a'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(0, 14); ctx.lineTo(30, 0); ctx.lineTo(0, -14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a6aa0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-15, 7); ctx.lineTo(15, -7); ctx.moveTo(-15, -7); ctx.lineTo(15, 7); ctx.stroke();
  ctx.restore();
  // umbrella canopy (yellow/blue segments)
  ctx.save(); ctx.translate(46, -30);
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(0, -6); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2, a1 = ((i + 1) / 6) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(0, -6);
    ctx.ellipse(0, -2, 30, 12, 0, a0, a1);
    ctx.closePath(); ctx.fillStyle = i % 2 ? '#f5c518' : '#2e6db4'; ctx.fill();
  }
  ctx.restore();
  // high stool + POS operator implied later; add small table
  ctx.fillStyle = shade(PAL.wood, 0.9); ctx.fillRect(40, -4, 22, 4); ctx.fillRect(48, 0, 4, 12);
  // banner text
  signage(ctx, 0, 18, 96, 16, 'POS • CASH', '#2e6db4', '#fff');
}

// Anjola Fabrics & Lace boutique — colorful awning + mannequins
function boutique(ctx: CanvasRenderingContext2D) {
  const W = 240, H = 210;
  ctx.translate(W / 2, H - 28);
  dropShadow(ctx, 0, 0, 100, 40, 0.4);
  const hw = 78, hh = 39;
  isoBox(ctx, 0, 0, hw, hh, 58, PAL.cream);
  // shopfront glass (right face)
  isoWindowRight(ctx, 12, -46, 56, 40, 0.5, 'rgba(60,110,120,0.55)', 'rgba(20,30,40,0.6)');
  // colorful awning scalloped
  ctx.save(); ctx.translate(0, -50);
  const cols = ['#d0432a', '#f5c518', '#2e8b57', '#2e6db4', '#b5348a'];
  for (let i = 0; i < 10; i++) {
    const x = -hw + i * (hw * 2 / 10);
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + hw * 2 / 10, 0); ctx.lineTo(x + hw * 2 / 10, 16 + (i % 2) * 2); ctx.lineTo(x, 16 + (i % 2) * 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x + hw / 10, 16, hw / 10, 0, Math.PI); ctx.fillStyle = cols[i % cols.length]; ctx.fill();
  }
  ctx.restore();
  // mannequins with Ankara patterns (front)
  const mannequin = (x: number, base: string, pat: string) => {
    ctx.save(); ctx.translate(x, 8);
    ctx.fillStyle = '#444'; ctx.fillRect(-2, -2, 4, 10); // stand
    ctx.fillStyle = base; ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(8, -20); ctx.lineTo(6, -2); ctx.lineTo(-6, -2); ctx.lineTo(-8, -20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#caa'; ctx.beginPath(); ctx.arc(0, -38, 5, 0, 7); ctx.fill(); // head
    ctx.strokeStyle = pat; ctx.lineWidth = 2;
    for (let i = -16; i < 0; i += 5) { ctx.beginPath(); ctx.moveTo(-7, i); ctx.lineTo(7, i + 3); ctx.stroke(); }
    ctx.restore();
  };
  mannequin(-30, '#d0432a', '#f5c518');
  mannequin(-10, '#2e6db4', '#eaeaea');
  mannequin(10, '#2e8b57', '#f5c518');
  signage(ctx, 0, -78, 188, 22, 'ANJOLA FABRICS & LACE', '#b5348a', '#fff');
}

// Gas / kerosene refill mini station
function gasStation(ctx: CanvasRenderingContext2D) {
  const W = 220, H = 180;
  ctx.translate(W / 2, H - 26);
  dropShadow(ctx, 0, 0, 90, 36, 0.4);
  // pump shade canopy
  ctx.save(); ctx.translate(0, -80);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(-70, 0, 140, 12);
  ctx.fillStyle = '#eaeaea'; for (let i = 0; i < 7; i++) ctx.fillRect(-70 + i * 20, 0, 10, 12);
  ctx.strokeStyle = '#888'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-60, 12); ctx.lineTo(-60, 60); ctx.moveTo(60, 12); ctx.lineTo(60, 60); ctx.stroke();
  ctx.restore();
  // pump
  ctx.fillStyle = '#d8d8d8'; ctx.fillRect(-14, -34, 28, 34); ctx.fillStyle = '#c0392b'; ctx.fillRect(-14, -34, 28, 8);
  ctx.fillStyle = '#222'; ctx.fillRect(-8, -22, 16, 10);
  // gas cylinders
  const cyl = (x: number, col: string) => { ctx.fillStyle = col; ctx.fillRect(x, -22, 12, 22); ctx.fillStyle = shade([200,200,200],1); ctx.beginPath(); ctx.arc(x + 6, -22, 6, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#333'; ctx.fillRect(x + 4, -30, 4, 6); };
  cyl(28, '#f5c518'); cyl(44, '#2e6db4'); cyl(60, '#e07a2e');
  signage(ctx, 0, -98, 150, 20, 'FUEL & GAS REFILL', '#c0392b', '#fff');
}

// --------------------------------------------------------------------------
// VEHICLES
// --------------------------------------------------------------------------
function danfo(ctx: CanvasRenderingContext2D) {
  const W = 200, H = 150;
  ctx.translate(W / 2, H - 26);
  dropShadow(ctx, 0, 0, 86, 30, 0.42);
  const hw = 78, hh = 26, bodyH = 46;
  // body (long iso box)
  isoSides(ctx, 0, -bodyH, hw, hh, bodyH, shade(PAL.danfoYellow, 0.82), shade(PAL.danfoYellow, 1));
  isoTop(ctx, 0, -bodyH, hw, hh, shade(PAL.danfoYellow, 1.12));
  // twin black stripes on right face
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.moveTo(0, -bodyH + hh - 18); ctx.lineTo(hw, -bodyH - 18); ctx.lineTo(hw, -bodyH - 12); ctx.lineTo(0, -bodyH + hh - 12); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -bodyH + hh - 10); ctx.lineTo(hw, -bodyH - 10); ctx.lineTo(hw, -bodyH - 5); ctx.lineTo(0, -bodyH + hh - 5); ctx.closePath(); ctx.fill();
  // windows along right face
  for (let i = 0; i < 4; i++) isoWindowRight(ctx, 8 + i * 18, -bodyH + 4 + i * 9, 14, 14, 0.5, 'rgba(40,70,90,0.9)');
  // windshield (front-left face near +x tip)
  isoWindowLeft(ctx, hw - 2, -bodyH + 2, 16, 18, 0.33, 'rgba(60,100,120,0.9)');
  // roof luggage rack
  ctx.strokeStyle = '#5a4a2a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-hw + 14, -bodyH - 2); ctx.lineTo(hw - 14, -bodyH - 2 + (hh - 0)); ctx.stroke();
  ctx.save(); ctx.translate(-10, -bodyH - 8);
  ctx.fillStyle = '#7a5a2a'; ctx.fillRect(-20, -6, 40, 8); ctx.fillStyle = '#9a7a3a'; ctx.fillRect(-14, -12, 28, 7);
  ctx.restore();
  // wheels
  ctx.fillStyle = '#151515';
  ctx.beginPath(); ctx.ellipse(-hw + 22, 2, 12, 8, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hw - 22, 2, 12, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#444';
  ctx.beginPath(); ctx.ellipse(-hw + 22, 2, 5, 3.4, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hw - 22, 2, 5, 3.4, 0, 0, 7); ctx.fill();
  // headlight + route board
  ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(hw - 4, -bodyH + 14, 3, 0, 7); ctx.fill();
  signage(ctx, -20, -bodyH - 2, 40, 12, '104', '#1a1a1a', '#f5c518');
}

function keke(ctx: CanvasRenderingContext2D) {
  const W = 120, H = 120;
  ctx.translate(W / 2, H - 22);
  dropShadow(ctx, 0, 0, 46, 18, 0.4);
  const hw = 34, hh = 16, bodyH = 30;
  isoSides(ctx, 0, -bodyH, hw, hh, bodyH, shade(PAL.danfoYellow, 0.8), shade(PAL.danfoYellow, 1));
  isoTop(ctx, 0, -bodyH, hw, hh, shade(PAL.danfoYellow, 1.1));
  // black canvas canopy
  ctx.fillStyle = '#1c1c1c'; ctx.beginPath(); ctx.moveTo(-hw + 4, -bodyH); ctx.lineTo(0, -bodyH - hh + 2); ctx.lineTo(hw - 4, -bodyH); ctx.lineTo(0, -bodyH + hh - 2); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.translate(0, -bodyH - 12);
  isoTop(ctx, 0, 0, hw - 2, hh - 2, '#222');
  ctx.restore();
  // windshield
  isoWindowRight(ctx, 6, -bodyH + 4, 20, 16, 0.5, 'rgba(60,100,120,0.9)');
  // three wheels
  ctx.fillStyle = '#151515';
  ctx.beginPath(); ctx.ellipse(-hw + 10, 2, 8, 6, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hw - 8, 2, 8, 6, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, hh - 2, 7, 5, 0, 0, 7); ctx.fill();
}

function okada(ctx: CanvasRenderingContext2D, col: RGB) {
  const W = 90, H = 90;
  ctx.translate(W / 2, H - 18);
  dropShadow(ctx, 0, 0, 34, 13, 0.4);
  // wheels
  ctx.fillStyle = '#151515';
  ctx.beginPath(); ctx.ellipse(-22, 0, 11, 8, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(22, 0, 11, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.ellipse(-22, 0, 4, 3, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(22, 0, 4, 3, 0, 0, 7); ctx.fill();
  // frame + tank
  ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(0, -14); ctx.lineTo(22, 0); ctx.moveTo(0, -14); ctx.lineTo(8, -22); ctx.stroke();
  ctx.fillStyle = shade(col, 1); ctx.beginPath(); ctx.ellipse(0, -16, 12, 7, -0.2, 0, 7); ctx.fill();
  ctx.fillStyle = shade(col, 1.2); ctx.beginPath(); ctx.ellipse(-2, -18, 8, 3, -0.2, 0, 7); ctx.fill();
  // seat
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-12, -22, 18, 6);
  // handlebar + mirror
  ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(8, -22); ctx.lineTo(14, -30); ctx.stroke();
  ctx.fillStyle = '#bbb'; ctx.beginPath(); ctx.arc(15, -31, 2.5, 0, 7); ctx.fill();
  // chrome exhaust
  ctx.strokeStyle = '#cfd3d8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(-20, -4); ctx.stroke();
  // delivery box on rear
  ctx.fillStyle = '#e07a2e'; ctx.fillRect(-26, -30, 16, 14); ctx.strokeStyle = '#7a3a1a'; ctx.lineWidth = 1.5; ctx.strokeRect(-26, -30, 16, 14);
}

// --------------------------------------------------------------------------
// PROPS
// --------------------------------------------------------------------------
function utilityPole(ctx: CanvasRenderingContext2D) {
  const W = 120, H = 200;
  ctx.translate(W / 2, H - 12);
  dropShadow(ctx, 0, 0, 26, 10, 0.35);
  ctx.fillStyle = shade(PAL.concrete, 0.8); ctx.fillRect(-5, -180, 10, 180);
  ctx.fillStyle = shade(PAL.concrete, 1); ctx.fillRect(-5, -180, 4, 180);
  // crossarms
  ctx.fillStyle = '#5a5a5a'; ctx.fillRect(-40, -166, 80, 5); ctx.fillRect(-34, -150, 68, 5);
  // insulators
  ctx.fillStyle = '#3a6a4a';
  for (const x of [-36, -12, 12, 36]) { ctx.beginPath(); ctx.arc(x, -168, 3, 0, 7); ctx.fill(); }
  for (const x of [-30, 0, 30]) { ctx.beginPath(); ctx.arc(x, -152, 3, 0, 7); ctx.fill(); }
  // transformer can
  ctx.fillStyle = '#4a4f55'; ctx.fillRect(14, -140, 22, 30); ctx.fillStyle = '#5a6068'; ctx.fillRect(14, -140, 22, 6);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(25, -140); ctx.lineTo(25, -146); ctx.stroke();
}

function generator(ctx: CanvasRenderingContext2D) {
  const W = 90, H = 80;
  ctx.translate(W / 2, H - 14);
  dropShadow(ctx, 0, 0, 34, 13, 0.4);
  const hw = 28, hh = 14, h = 26;
  isoSides(ctx, 0, -h, hw, hh, h, shade([70, 90, 70], 0.8), shade([70, 90, 70], 1));
  isoTop(ctx, 0, -h, hw, hh, shade([90, 110, 90], 1.1));
  // handle + vents
  ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -h - hh + 2); ctx.lineTo(10, -h - hh + 2); ctx.stroke();
  ctx.fillStyle = '#222'; ctx.fillRect(-hw + 4, -16, 10, 8);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(6, -16, 8, 6);
  // exhaust pipe
  ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hw - 6, -h); ctx.lineTo(hw - 2, -h - 10); ctx.stroke();
}

function wasteBin(ctx: CanvasRenderingContext2D) {
  const W = 60, H = 70;
  ctx.translate(W / 2, H - 12);
  dropShadow(ctx, 0, 0, 20, 8, 0.4);
  const hw = 16, hh = 8, h = 34;
  isoSides(ctx, 0, -h, hw, hh, h, shade([40, 90, 50], 0.8), shade([40, 90, 50], 1));
  isoTop(ctx, 0, -h, hw, hh, '#1e5a32');
  isoTop(ctx, 0, -h - 2, hw - 3, hh - 2, '#0e3a1e');
  ctx.fillStyle = '#0e3a1e'; ctx.fillRect(-hw + 2, -24, 2, 18); ctx.fillRect(hw - 4, -24, 2, 18);
}

function palmTree(ctx: CanvasRenderingContext2D) {
  const W = 140, H = 180;
  ctx.translate(W / 2, H - 14);
  dropShadow(ctx, 0, 0, 40, 16, 0.32);
  // curved trunk
  ctx.strokeStyle = shade(PAL.wood, 0.9); ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -70, 2, -120); ctx.stroke();
  ctx.strokeStyle = shade(PAL.wood, 1.1); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -70, 2, -120); ctx.stroke();
  // fronds
  const top = { x: 2, y: -122 };
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const ex = top.x + Math.cos(a) * 52, ey = top.y + Math.sin(a) * 26 - 6;
    const mx = top.x + Math.cos(a) * 30, my = top.y + Math.sin(a) * 14 - 16;
    ctx.strokeStyle = i % 2 ? shade(PAL.palm, 0.85) : shade(PAL.palm, 1.1);
    ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
    // leaflets
    ctx.lineWidth = 1.5; ctx.strokeStyle = shade(PAL.green, 1);
    for (let t = 0.3; t < 1; t += 0.18) {
      const px = top.x + (mx - top.x) * t * 1.2, py = top.y + (my - top.y) * t * 1.2;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 4, py + 6); ctx.moveTo(px, py); ctx.lineTo(px + 4, py + 6); ctx.stroke();
    }
  }
  // coconuts
  ctx.fillStyle = '#6b4a2a';
  for (const dx of [-6, 4, 0]) { ctx.beginPath(); ctx.arc(top.x + dx, top.y + 4, 4, 0, 7); ctx.fill(); }
}

function bananaTree(ctx: CanvasRenderingContext2D) {
  const W = 120, H = 150;
  ctx.translate(W / 2, H - 12);
  dropShadow(ctx, 0, 0, 34, 13, 0.3);
  ctx.strokeStyle = shade(PAL.green, 0.8); ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -60); ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.5;
    const ex = Math.cos(a) * 50, ey = -60 + Math.sin(a) * 30;
    ctx.fillStyle = i % 2 ? shade(PAL.palm, 1) : shade(PAL.green, 1.1);
    ctx.beginPath(); ctx.moveTo(0, -58);
    ctx.quadraticCurveTo(ex * 0.6, ey - 14, ex, ey);
    ctx.quadraticCurveTo(ex * 0.6, ey + 8, 0, -54);
    ctx.fill();
  }
  ctx.fillStyle = '#e0b030'; ctx.beginPath(); ctx.ellipse(6, -40, 6, 12, 0.4, 0, 7); ctx.fill();
}

function hibiscus(ctx: CanvasRenderingContext2D) {
  const W = 80, H = 70;
  ctx.translate(W / 2, H - 10);
  dropShadow(ctx, 0, 0, 26, 10, 0.3);
  const rnd = mulberry32(21);
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = shade(PAL.green, 0.7 + rnd() * 0.5);
    ctx.beginPath(); ctx.arc((rnd() - 0.5) * 44, -10 - rnd() * 26, 7 + rnd() * 4, 0, 7); ctx.fill();
  }
  for (let i = 0; i < 7; i++) {
    const x = (rnd() - 0.5) * 40, y = -14 - rnd() * 28;
    ctx.fillStyle = '#e0344a';
    for (let p = 0; p < 5; p++) { const a = (p / 5) * 7; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 3, y + Math.sin(a) * 3, 2.4, 2.4, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill();
  }
}

function potPlant(ctx: CanvasRenderingContext2D) {
  const W = 40, H = 50;
  ctx.translate(W / 2, H - 8);
  ctx.fillStyle = '#a8542f'; ctx.beginPath(); ctx.moveTo(-10, -12); ctx.lineTo(10, -12); ctx.lineTo(7, 4); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
  const rnd = mulberry32(5);
  for (let i = 0; i < 12; i++) { ctx.fillStyle = shade(PAL.palm, 0.8 + rnd() * 0.5); ctx.beginPath(); ctx.arc((rnd() - 0.5) * 20, -18 - rnd() * 16, 4, 0, 7); ctx.fill(); }
}

// --------------------------------------------------------------------------
// CHARACTERS (idle frame + walk frame as a 2-frame spritesheet, side-ish iso)
// --------------------------------------------------------------------------
function personFrame(ctx: CanvasRenderingContext2D, ox: number, opts: {
  skin: RGB; shirt: RGB; pants: RGB; head?: RGB; hat?: string; bag?: string; apron?: boolean; cape?: boolean;
}) {
  ctx.save(); ctx.translate(ox, 0);
  const { skin, shirt, pants } = opts;
  // legs
  ctx.fillStyle = shade(pants, 0.9); ctx.fillRect(-5, -16, 4, 16); ctx.fillRect(1, -16, 4, 16);
  ctx.fillStyle = '#222'; ctx.fillRect(-6, -2, 5, 3); ctx.fillRect(1, -2, 5, 3);
  // torso
  ctx.fillStyle = shade(shirt, 1);
  ctx.beginPath(); ctx.moveTo(-7, -34); ctx.lineTo(7, -34); ctx.lineTo(6, -15); ctx.lineTo(-6, -15); ctx.closePath(); ctx.fill();
  if (opts.cape) { ctx.fillStyle = shade(shirt, 0.85); ctx.beginPath(); ctx.moveTo(-8, -34); ctx.lineTo(-14, -10); ctx.lineTo(-4, -12); ctx.closePath(); ctx.fill(); }
  if (opts.apron) { ctx.fillStyle = '#eaeaea'; ctx.fillRect(-5, -26, 10, 12); }
  // arms
  ctx.fillStyle = shade(shirt, 0.9); ctx.fillRect(-9, -33, 3, 12); ctx.fillRect(6, -33, 3, 12);
  ctx.fillStyle = shade(skin, 1); ctx.fillRect(-9, -22, 3, 4); ctx.fillRect(6, -22, 3, 4);
  // head
  ctx.fillStyle = shade(skin, 1); ctx.beginPath(); ctx.arc(0, -40, 6, 0, 7); ctx.fill();
  if (opts.hat === 'cap') { ctx.fillStyle = '#f0f0f0'; ctx.beginPath(); ctx.arc(0, -42, 6, Math.PI, 0); ctx.fill(); ctx.fillRect(0, -43, 8, 2); }
  if (opts.hat === 'gele') { ctx.fillStyle = '#d0432a'; ctx.beginPath(); ctx.ellipse(0, -45, 8, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#f5c518'; ctx.fillRect(-7, -44, 14, 3); }
  if (opts.hat === 'helmet') { ctx.fillStyle = '#2e6db4'; ctx.beginPath(); ctx.arc(0, -41, 7, Math.PI, 0); ctx.fill(); ctx.fillRect(-7, -41, 14, 4); ctx.fillStyle = 'rgba(180,220,255,0.7)'; ctx.fillRect(-5, -40, 10, 3); }
  if (opts.bag) { ctx.fillStyle = opts.bag; ctx.fillRect(8, -28, 8, 10); ctx.strokeStyle = shade(shirt, 0.6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(2, -33); ctx.lineTo(11, -28); ctx.stroke(); }
  ctx.restore();
}
function personSheet(ctx: CanvasRenderingContext2D, opts: Parameters<typeof personFrame>[2]) {
  // two 40px-wide frames: idle, step
  dropShadow(ctx, 20, 0, 14, 6, 0.3);
  dropShadow(ctx, 60, 0, 14, 6, 0.3);
  personFrame(ctx, 20, opts);
  // walk frame: legs split, body bob
  ctx.save(); ctx.translate(40, 0);
  personFrame(ctx, 20, opts);
  ctx.restore();
}

// --------------------------------------------------------------------------
// Hotspot beacon
// --------------------------------------------------------------------------
function beacon(ctx: CanvasRenderingContext2D) {
  ctx.save(); ctx.translate(32, 40);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 26);
  g.addColorStop(0, 'rgba(255,220,80,0.9)'); g.addColorStop(0.4, 'rgba(255,180,40,0.4)'); g.addColorStop(1, 'rgba(255,160,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill();
  // pin
  ctx.fillStyle = '#f5c518'; ctx.beginPath(); ctx.arc(0, -18, 11, 0, 7); ctx.fill();
  ctx.strokeStyle = '#7a5a00'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('i', 0, -18);
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(-4, -16); ctx.lineTo(4, -16); ctx.closePath(); ctx.fillStyle = '#f5c518'; ctx.fill();
  ctx.restore();
}

// --------------------------------------------------------------------------
// Public API: register every texture on the scene
// --------------------------------------------------------------------------
export function generateAllTextures(scene: Scene) {
  const reg = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, frameWidth?: number, frameHeight?: number) => {
    const { c, ctx } = makeCanvas(w, h);
    draw(ctx);
    if (scene.textures.exists(key)) (scene.textures as any).remove(key);
    const tex = scene.textures.addCanvas(key, c) as any;
    if (frameWidth && frameHeight && tex.add) {
      // convert single canvas to spritesheet frames
    }
    return tex;
  };

  // ground tiles
  reg('t_asphalt', 64, 32, tileAsphalt);
  reg('t_dirt', 64, 32, tileDirt);
  reg('t_paver', 64, 32, tilePaver);
  reg('t_gutter', 64, 32, tileGutter);
  reg('t_plank', 64, 32, tilePlank);

  // buildings (origin bottom-center)
  reg('b_plaza', 280, 320, plaza);
  reg('b_buka', 260, 220, buka);
  reg('b_pos', 180, 200, posKiosk);
  reg('b_boutique', 240, 210, boutique);
  reg('b_gas', 220, 180, gasStation);

  // vehicles
  reg('v_danfo', 200, 150, danfo);
  reg('v_keke', 120, 120, keke);
  reg('v_okada_red', 90, 90, (x) => okada(x, [200, 50, 40]));
  reg('v_okada_blue', 90, 90, (x) => okada(x, [46, 109, 180]));

  // props
  reg('p_pole', 120, 200, utilityPole);
  reg('p_gen', 90, 80, generator);
  reg('p_bin', 60, 70, wasteBin);
  reg('p_palm', 140, 180, palmTree);
  reg('p_banana', 120, 150, bananaTree);
  reg('p_hibiscus', 80, 70, hibiscus);
  reg('p_pot', 40, 50, potPlant);

  // characters
  reg('c_player', 80, 44, (x) => personSheet(x, { skin: PAL.skin, shirt: [46, 139, 139], pants: [40, 40, 60], cape: true, hat: undefined }));
  reg('c_vendor', 80, 44, (x) => personSheet(x, { skin: PAL.skin2, shirt: [208, 67, 42], pants: [60, 40, 30], apron: true, hat: 'gele' }));
  reg('c_suya', 80, 44, (x) => personSheet(x, { skin: PAL.skin, shirt: [230, 230, 230], pants: [50, 50, 50], hat: 'cap' }));
  reg('c_rider', 80, 44, (x) => personSheet(x, { skin: PAL.skin2, shirt: [46, 109, 180], pants: [30, 30, 30], hat: 'helmet' }));
  reg('c_shop', 80, 44, (x) => personSheet(x, { skin: PAL.skin, shirt: [224, 169, 46], pants: [70, 50, 40], bag: '#7a3a1a' }));
  reg('c_pos', 80, 44, (x) => personSheet(x, { skin: PAL.skin2, shirt: [46, 139, 87], pants: [40, 40, 50] }));

  reg('beacon', 64, 64, beacon);
}
