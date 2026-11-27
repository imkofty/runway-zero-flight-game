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

// Precomputed stars (seeded, screen space). Range extends past the
// viewport so zoomed-out shots (readability, 0.8x) still have stars
// at the frame edges.
const STARS = [];
{
  let s = 1234567;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 90; i++) {
    STARS.push({ x: -200 + rnd() * 1680, y: -90 + rnd() * 420, r: 0.6 + rnd() * 1.4, a: 0.25 + rnd() * 0.55 });
  }
}

function drawSky(ctx, camX, t) {
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, P.skyTop);
  g.addColorStop(0.45, P.skyMid);
  g.addColorStop(0.72, P.skyLow);
  g.addColorStop(1, '#5a2f56');
  ctx.fillStyle = g;
  // Overscan: the fill extends past the viewport so zoomed-out shots
  // (readability, 0.8x) have sky at the frame edges, not bare canvas.
  ctx.fillRect(-200, -200, 1680, 1120);

  for (const s of STARS) {
    ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(t * 1.3 + s.x));
    ctx.fillStyle = '#ffe9c4';
    ctx.fillRect(s.x, s.y, s.r, s.r);
  }
  ctx.globalAlpha = 1;

  // Low amber sun, fixed ahead on the horizon (screen space, drifts slowly).
  // Raised and brightened (polish v2): the old low sun left the lower
  // half of the hero frame near-unreadable in thumbnails. Centred behind
  // the runway mesa so the disc sits on the mesa line in the hero frame.
  const sunX = 980 - ((camX * 0.02) % 120);
  const sunY = 400;
  const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 300);
  glow.addColorStop(0, 'rgba(255, 154, 60, 0.65)');
  glow.addColorStop(0.4, 'rgba(255, 122, 26, 0.22)');
  glow.addColorStop(1, 'rgba(255, 122, 26, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 300, sunY - 300, 600, 600);
  ctx.fillStyle = P.sunCore;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 66, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 214, 140, 0.85)';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
  ctx.fill();
}

// One distant mesa silhouette layer. depth 0..1 shifts its parallax.
// Drawn overscanned (-200..1480, down to 920) for zoomed-out shots.
function mesaLayer(ctx, camX, depth, color, baseY, amp) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-200, 920);
  const off = camX * depth;
  for (let sx = -200; sx <= 1480; sx += 16) {
    const wx = sx + off;
    const y = baseY
      + Math.sin(wx * 0.004 + depth * 9) * amp
      + Math.sin(wx * 0.0016 + depth * 40) * amp * 1.6;
    ctx.lineTo(sx, y);
  }
  ctx.lineTo(1480, 920);
  ctx.closePath();
  ctx.fill();
}

export function drawWorld(ctx, cam, t) {
  const camX = cam.x;
  const camY = cam.y;
  drawSky(ctx, camX, t);
  mesaLayer(ctx, camX, 0.12, P.farMesa, 470, 26);
  mesaLayer(ctx, camX, 0.3, P.midRock, 540, 34);

  // Distant volcano: the canyon's landmark, slow parallax (0.05). The
  // near terrain covers its base, so only the cone above the mesa line
  // shows — looming behind the runway in the hero frame.
  const volX = 1060 - camX * 0.05;
  if (volX > -200 && volX < 1480) {
    ctx.fillStyle = '#2e2352';
    ctx.beginPath();
    ctx.moveTo(volX - 170, 545);
    ctx.lineTo(volX, 300);
    ctx.lineTo(volX + 170, 545);
    ctx.closePath();
    ctx.fill();
    // Glowing crater + embers at the peak.
    const crater = ctx.createRadialGradient(volX, 302, 2, volX, 302, 30);
    crater.addColorStop(0, 'rgba(255, 154, 60, 0.9)');
    crater.addColorStop(1, 'rgba(255, 154, 60, 0)');
    ctx.fillStyle = crater;
    ctx.fillRect(volX - 30, 272, 60, 60);
    ctx.fillStyle = P.hudAmber;
    ctx.beginPath();
    ctx.arc(volX - 8, 300, 3, 0, Math.PI * 2);
    ctx.arc(volX + 10, 306, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // No clouds: the sky, stars and sun carry the dusk on their own.

  // Near terrain: filled path of groundAt, sampled in screen space.
  // Overscanned for zoomed-out shots (visible range at 0.8x is -160..1440,
  // -90..810).
  const top = [];
  for (let sx = -200; sx <= 1480; sx += 10) {
    const wx = sx + camX;
    top.push([sx, groundAt(wx) - camY]);
  }
  const grad = ctx.createLinearGradient(0, 300, 0, 720);
  grad.addColorStop(0, '#2e2350');
  grad.addColorStop(1, '#201638');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(top[0][0], top[0][1]);
  for (const [sx, sy] of top) ctx.lineTo(sx, sy);
  ctx.lineTo(1480, 920);
  ctx.lineTo(-200, 920);
  ctx.closePath();
  ctx.fill();

  // Amber rim light along the terrain's top edge.
  ctx.strokeStyle = P.rockRim;
  ctx.globalAlpha = 1;
  ctx.lineWidth = 4;
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
  for (let sx = -200; sx <= 1480; sx += 10) {
    const wx = sx + camX;
    const ry = floorY(wx) + 26 - camY;
    if (sx === -200) ctx.moveTo(sx, ry);
    else ctx.lineTo(sx, ry);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Riverside village: lit windows on the canyon floor (world x 3500-3720).
  // Sits in the lower frame of the hero shot, where the old frame was
  // near-black.
  const HOUSES = [
    { x: 3510, w: 30, h: 16 },
    { x: 3552, w: 24, h: 12 },
    { x: 3588, w: 36, h: 18 },
    { x: 3636, w: 26, h: 13 },
    { x: 3672, w: 32, h: 17 },
    { x: 3714, w: 24, h: 12 },
  ];
  for (const hs of HOUSES) {
    const gy = floorY(hs.x + hs.w / 2) - camY;
    const hx = hs.x - camX;
    if (hx < -200 || hx > 1480) continue;
    ctx.fillStyle = '#1a1230';
    ctx.fillRect(hx, gy - hs.h, hs.w, hs.h);
    // Lit windows.
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(hx + 5, gy - hs.h + 4, 4, 5);
    ctx.fillRect(hx + hs.w - 9, gy - hs.h + 4, 4, 5);
  }

  drawRunway(ctx, cam);
  drawGoalBeacon(ctx, cam, t);
}

// Glowing goal beacon above the runway centre: a light beam plus a
// diamond marker, so the target reads from anywhere in the canyon.
function drawGoalBeacon(ctx, cam, t) {
  const x = CONFIG.RUNWAY_CENTER - cam.x;
  const y = CONFIG.RUNWAY_Y - cam.y;
  if (x < -40 || x > 1320) return;
  // Light beam above the runway centre, gently pulsing. Short enough
  // that the diamond reads as attached to the runway, not floating.
  const pulse = 0.16 + 0.06 * Math.sin(t * 2.2);
  const beam = ctx.createLinearGradient(0, y - 200, 0, y);
  beam.addColorStop(0, 'rgba(255, 179, 71, 0)');
  beam.addColorStop(1, `rgba(255, 179, 71, ${pulse})`);
  ctx.fillStyle = beam;
  ctx.fillRect(x - 10, y - 200, 20, 200);
  // Glowing diamond marker at the top of the beam.
  const glow = ctx.createRadialGradient(x, y - 212, 2, x, y - 212, 26);
  glow.addColorStop(0, 'rgba(255, 179, 71, 0.85)');
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 26, y - 238, 52, 52);
  ctx.fillStyle = P.hudAmber;
  ctx.save();
  ctx.translate(x, y - 212);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-9, -9, 18, 18);
  ctx.restore();
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
