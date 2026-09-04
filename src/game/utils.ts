// Isometric + drawing helpers for the HUSTLE visual benchmark.
// Shared by main.ts and sprites/textures.ts.

export const TILE_W = 64;
export const TILE_H = 32;

export type Pt = { x: number; y: number };

/** Convert grid (col,row) to screen-space iso point. */
export function isoToScreen(gx: number, gy: number): Pt {
  return { x: (gx - gy) * (TILE_W / 2), y: (gx + gy) * (TILE_H / 2) };
}

/** Inverse of isoToScreen. */
export function screenToIso(sx: number, sy: number): Pt {
  return { x: (sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2, y: (sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2 };
}

// --- Canvas 2D isometric box drawing -------------------------------------
// All building/prop art is drawn as 2:1 iso prisms: top face + left face +
// right face with directional shading, giving the "almost 3D" look.

export type RGB = [number, number, number];

export function shade(c: RGB, f: number): string {
  const r = Math.max(0, Math.min(255, Math.round(c[0] * f)));
  const g = Math.max(0, Math.min(255, Math.round(c[1] * f)));
  const b = Math.max(0, Math.min(255, Math.round(c[2] * f)));
  return `rgb(${r},${g},${b})`;
}

export function rgba(c: RGB, a: number): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/** Draw an isometric diamond (top face) centered at (cx,cy). */
export function isoTop(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, hw: number, hh: number,
  fill: string, stroke?: string, lw = 1,
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}

/** Draw the two visible side faces of an iso box (left = -x side, right = +x side). */
export function isoSides(
  ctx: CanvasRenderingContext2D,
  cx: number, topY: number, hw: number, hh: number, height: number,
  leftFill: string, rightFill: string,
) {
  // left face
  ctx.beginPath();
  ctx.moveTo(cx - hw, topY);
  ctx.lineTo(cx, topY + hh);
  ctx.lineTo(cx, topY + hh + height);
  ctx.lineTo(cx - hw, topY + height);
  ctx.closePath();
  ctx.fillStyle = leftFill;
  ctx.fill();
  // right face
  ctx.beginPath();
  ctx.moveTo(cx + hw, topY);
  ctx.lineTo(cx, topY + hh);
  ctx.lineTo(cx, topY + hh + height);
  ctx.lineTo(cx + hw, topY + height);
  ctx.closePath();
  ctx.fillStyle = rightFill;
  ctx.fill();
}

/** Full iso box: sides then top. Returns nothing. */
export function isoBox(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, hw: number, hh: number, height: number,
  base: RGB,
) {
  const topY = cy - height;
  isoSides(ctx, cx, topY, hw, hh, height, shade(base, 0.72), shade(base, 0.88));
  isoTop(ctx, cx, topY, hw, hh, shade(base, 1.08));
}

/** A window on the right-facing wall of an iso box (parallelogram). */
export function isoWindowRight(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, slope: number,
  fill: string, frame = 'rgba(0,0,0,0.35)',
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + w * slope);
  ctx.lineTo(x + w, y + w * slope + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = frame; ctx.stroke();
}

/** A window on the left-facing wall (mirrored slope). */
export function isoWindowLeft(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, slope: number,
  fill: string, frame = 'rgba(0,0,0,0.35)',
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - w, y + w * slope);
  ctx.lineTo(x - w, y - w * slope + h + 2 * w * slope);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = frame; ctx.stroke();
}

/** Soft elliptical ground shadow. */
export function dropShadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, a = 0.32) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
  grad.addColorStop(0, `rgba(0,0,0,${a})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  ctx.translate(-cx, -cy);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Deterministic pseudo-random for texture detail (stable across runs). */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
