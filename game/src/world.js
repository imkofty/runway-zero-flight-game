// RUNWAY ZERO — world.js
// One job: the canyon. Terrain height, runway, pillars, and all drawing of
// sky, sun, mesas and ground. Deterministic — no Math.random in the world.

import { CONFIG } from './config.js';

const P = CONFIG.PALETTE;

// Two rock spires the flight path threads between.
export const PILLARS = [
  { x: 1500, w: 70, top: 380 },
  { x: 2600, w: 84, top: 336 },
];

// Gentle rolling canyon floor (deterministic waves).
function floorY(x) {
  return 648
    + Math.sin(x * 0.011) * 16
    + Math.sin(x * 0.004 + 1.7) * 24
    + Math.sin(x * 0.0013 + 4.1) * 28;
}

// Ground height at world x: mesa tops and pillar tops override the floor.
export function groundAt(x) {
  if (x >= 0 && x < 520) return 430; // start mesa
  if (x >= CONFIG.RUNWAY_X0 && x <= CONFIG.RUNWAY_X1) return CONFIG.RUNWAY_Y;
  if (x >= 4150 && x <= 4400) return CONFIG.RUNWAY_Y; // overshoot mesa
  for (const p of PILLARS) {
    if (Math.abs(x - p.x) < p.w / 2) return p.top;
  }
  return floorY(x);
}

export function onRunway(x) {
  return x >= CONFIG.RUNWAY_X0 && x <= CONFIG.RUNWAY_X1;
}

// Precomputed stars (seeded, screen space).
const STARS = [];
{
  let s = 1234567;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 90; i++) {
    STARS.push({ x: rnd() * 1280, y: rnd() * 300, r: 0.6 + rnd() * 1.4, a: 0.25 + rnd() * 0.55 });
  }
}

function drawSky(ctx, camX, t) {
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, P.skyTop);
  g.addColorStop(0.45, P.skyMid);
  g.addColorStop(0.72, P.skyLow);
  g.addColorStop(1, '#5a2f56');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);

  for (const s of STARS) {
    ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(t * 1.3 + s.x));
    ctx.fillStyle = '#ffe9c4';
    ctx.fillRect(s.x, s.y, s.r, s.r);
  }
  ctx.globalAlpha = 1;

  // Low amber sun, fixed ahead on the horizon (screen space, drifts slowly).
  const sunX = 980 - ((camX * 0.02) % 120);
  const sunY = 470;
  const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 260);
  glow.addColorStop(0, 'rgba(255, 154, 60, 0.55)');
  glow.addColorStop(0.4, 'rgba(255, 122, 26, 0.18)');
  glow.addColorStop(1, 'rgba(255, 122, 26, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 260, sunY - 260, 520, 520);
  ctx.fillStyle = P.sunCore;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 214, 140, 0.85)';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 44, 0, Math.PI * 2);
  ctx.fill();
}

// One distant mesa silhouette layer. depth 0..1 shifts its parallax.
function mesaLayer(ctx, camX, depth, color, baseY, amp) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 720);
  const off = camX * depth;
  for (let sx = 0; sx <= 1280; sx += 16) {
    const wx = sx + off;
    const y = baseY
      + Math.sin(wx * 0.004 + depth * 9) * amp
      + Math.sin(wx * 0.0016 + depth * 40) * amp * 1.6;
    ctx.lineTo(sx, y);
  }
  ctx.lineTo(1280, 720);
  ctx.closePath();
  ctx.fill();
}

export function drawWorld(ctx, cam, t) {
  const camX = cam.x;
  const camY = cam.y;
  drawSky(ctx, camX, t);
  mesaLayer(ctx, camX, 0.12, P.farMesa, 470, 26);
  mesaLayer(ctx, camX, 0.3, P.midRock, 540, 34);

  // No clouds: the sky, stars and sun carry the dusk on their own.

  // Near terrain: filled path of groundAt, sampled in screen space.
  const top = [];
  for (let sx = -20; sx <= 1300; sx += 10) {
    const wx = sx + camX;
    top.push([sx, groundAt(wx) - camY]);
  }
  const grad = ctx.createLinearGradient(0, 300, 0, 720);
  grad.addColorStop(0, '#241a3e');
  grad.addColorStop(1, P.nearRock);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(top[0][0], top[0][1]);
  for (const [sx, sy] of top) ctx.lineTo(sx, sy);
  ctx.lineTo(1300, 720);
  ctx.lineTo(-20, 720);
  ctx.closePath();
  ctx.fill();

  // Amber rim light along the terrain's top edge.
  ctx.strokeStyle = P.rockRim;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(top[0][0], top[0][1]);
  for (const [sx, sy] of top) ctx.lineTo(sx, sy);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // River glint on the canyon floor.
  ctx.strokeStyle = P.river;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let sx = -20; sx <= 1300; sx += 10) {
    const wx = sx + camX;
    const ry = floorY(wx) + 26 - camY;
    if (sx === -20) ctx.moveTo(sx, ry);
    else ctx.lineTo(sx, ry);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  drawRunway(ctx, cam);
}

// The runway: cream marks, amber edge lights, threshold chevrons, "ZERO".
function drawRunway(ctx, cam) {
  const x0 = CONFIG.RUNWAY_X0 - cam.x;
  const x1 = CONFIG.RUNWAY_X1 - cam.x;
  const y = CONFIG.RUNWAY_Y - cam.y;
  if (x1 < -50 || x0 > 1330) return;

  // Runway slab.
  ctx.fillStyle = P.runway;
  ctx.fillRect(x0, y, x1 - x0, 26);
  // Centre line dashes.
  ctx.fillStyle = P.runwayMark;
  for (let x = x0 + 14; x < x1 - 20; x += 42) {
    ctx.fillRect(x, y + 11, 24, 4);
  }
  // Threshold: centre dashes + painted ZERO + amber edge lights.
  // (No chevrons: they collided with the ZERO text at screenshot size.)
  // "ZERO" painted on the slab.
  ctx.fillStyle = 'rgba(245, 230, 200, 0.9)';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ZERO', (x0 + x1) / 2, y + 22);
  // Amber edge lights (glowing).
  for (let x = x0 + 8; x <= x1 - 8; x += 32) {
    ctx.fillStyle = P.runwayLight;
    ctx.beginPath();
    ctx.arc(x, y - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 179, 71, 0.25)';
    ctx.beginPath();
    ctx.arc(x, y - 2, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  // Windsock on a pole at the far end.
  const wx = x1 - 16;
  ctx.strokeStyle = P.runwayMark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wx, y);
  ctx.lineTo(wx, y - 52);
  ctx.stroke();
  ctx.fillStyle = '#ff4d1c';
  ctx.beginPath();
  ctx.moveTo(wx, y - 52);
  ctx.lineTo(wx + 34, y - 46);
  ctx.lineTo(wx, y - 40);
  ctx.closePath();
  ctx.fill();
}
