// RUNWAY ZERO — hud.js
// One job: everything the pilot reads. Big amber digits, a lit artificial
// horizon, a compass strip, boost meter and the Landing Window tape.

import { CONFIG } from './config.js';
import { groundAt } from './world.js';

const P = CONFIG.PALETTE;

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = P.hudPanel;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 179, 71, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function label(ctx, text, x, y, color) {
  ctx.fillStyle = color || 'rgba(245, 230, 200, 0.75)';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

function bigNum(ctx, text, x, y, color, size) {
  ctx.fillStyle = color || P.hudAmber;
  ctx.font = `bold ${size || 30}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

// Artificial horizon: lit dial whose sky/ground split follows pitch.
export function drawAttitude(ctx, cx, cy, r, pitch, t) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate(-pitch * 0.7);
  const horizonY = 0;
  ctx.fillStyle = '#2c4a7a';
  ctx.fillRect(-r, -r, r * 2, r + horizonY);
  ctx.fillStyle = '#7a4a22';
  ctx.fillRect(-r, horizonY, r * 2, r);
  ctx.fillStyle = P.hudAmber;
  ctx.fillRect(-r, horizonY - 1, r * 2, 2);
  ctx.restore();

  ctx.strokeStyle = P.hudAmber;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // Fixed wings marker.
  ctx.strokeStyle = P.hudCream;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - r + 6, cy);
  ctx.lineTo(cx - 12, cy);
  ctx.moveTo(cx + 12, cy);
  ctx.lineTo(cx + r - 6, cy);
  ctx.stroke();
  ctx.fillStyle = P.hudCream;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, 'ATTITUDE', cx - r + 2, cy - r - 8);
}

// Compass strip: heading tape, centre 090.
function drawCompass(ctx, x, y, w, heading) {
  panel(ctx, x, y, w, 44);
  const marks = [60, 75, 90, 105, 120];
  ctx.fillStyle = P.hudCream;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const h of marks) {
    const mx = x + w / 2 + (h - heading) * 4;
    if (mx < x + 14 || mx > x + w - 14) continue;
    ctx.fillText(String(h).padStart(3, '0'), mx, y + 18);
    ctx.fillRect(mx - 1, y + 24, 2, 8);
  }
  ctx.fillStyle = P.hudAmber;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 6, y + 2);
  ctx.lineTo(x + w / 2 + 6, y + 2);
  ctx.lineTo(x + w / 2, y + 10);
  ctx.closePath();
  ctx.fill();
  label(ctx, 'HDG', x + 10, y + 40);
  bigNum(ctx, String(Math.round(heading)).padStart(3, '0') + '°', x + w - 62, y + 40, P.hudCream, 15);
}

// Landing Window: speed tape with the green touchdown zone.
function drawLandingWindow(ctx, x, y, w, speed, vspeed) {
  panel(ctx, x, y, w, 58);
  label(ctx, 'LANDING WINDOW — SPEED', x + 12, y + 16);
  const lo = CONFIG.SAFE_SPEED[0];
  const hi = CONFIG.SAFE_SPEED[1];
  const trackY = y + 34;
  const toX = (v) => x + 12 + ((v - 60) / 220) * (w - 24);
  // Safe band, then perfect band inside it.
  ctx.fillStyle = 'rgba(126, 224, 129, 0.35)';
  ctx.fillRect(toX(lo), trackY - 6, toX(hi) - toX(lo), 12);
  ctx.fillStyle = P.hudGreen;
  ctx.fillRect(toX(CONFIG.PERFECT_SPEED[0]), trackY - 6,
    toX(CONFIG.PERFECT_SPEED[1]) - toX(CONFIG.PERFECT_SPEED[0]), 12);
  ctx.fillStyle = 'rgba(245, 230, 200, 0.25)';
  ctx.fillRect(toX(60), trackY - 6, toX(280) - toX(60), 12);
  // Current speed marker.
  const mx = Math.max(toX(60), Math.min(toX(280), toX(speed)));
  ctx.fillStyle = P.hudAmber;
  ctx.beginPath();
  ctx.moveTo(mx, trackY - 12);
  ctx.lineTo(mx + 6, trackY - 2);
  ctx.lineTo(mx, trackY + 8);
  ctx.lineTo(mx - 6, trackY - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = P.hudCream;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.round(speed * 0.45)} kt  •  VS ${Math.round(vspeed * 0.45)}`, x + w - 108, y + 16);
}

export function drawHUD(ctx, state, t) {
  const pl = state.plane;
  // Altitude above the ground directly below (AGL): 0 on touchdown.
  const altFt = Math.max(0, Math.round((groundAt(pl.x) - (pl.y + 26)) * 3));
  const speedKt = Math.round(pl.vx * 0.45);
  const heading = 90 + Math.round(pl.pitch * -18);

  // Top-left: ALT / SPD / HDG.
  panel(ctx, 16, 14, 300, 78);
  label(ctx, 'ALTITUDE', 28, 30);
  bigNum(ctx, String(altFt), 28, 62);
  label(ctx, 'FT', 118, 62);
  label(ctx, 'SPEED', 168, 30);
  bigNum(ctx, String(speedKt), 168, 62);
  label(ctx, 'KT', 244, 62);

  // Top-right: SCORE + TIME.
  panel(ctx, 1280 - 316, 14, 300, 78);
  label(ctx, 'SCORE', 1280 - 304, 30);
  bigNum(ctx, String(state.score), 1280 - 304, 62, P.hudAmber, 30);
  label(ctx, 'TIME', 1280 - 128, 30);
  const timeLeft = Math.max(0, Math.ceil(state.timeLeft));
  bigNum(ctx, String(timeLeft), 1280 - 128, 62, timeLeft <= 15 ? P.hudRed : P.hudCream, 30);
  label(ctx, 'S', 1280 - 84, 62);

  // Bottom-left: attitude dial + compass.
  drawAttitude(ctx, 62, 720 - 62, 42, pl.pitch, t);
  drawCompass(ctx, 128, 720 - 62, 250, heading);

  // Bottom-right: boost meter.
  panel(ctx, 1280 - 216, 720 - 62, 200, 46);
  label(ctx, 'BOOST  [SHIFT]', 1280 - 204, 720 - 44);
  ctx.fillStyle = 'rgba(245, 230, 200, 0.2)';
  ctx.fillRect(1280 - 204, 720 - 34, 176, 10);
  ctx.fillStyle = pl.boosting ? '#ff7a1a' : P.hudAmber;
  ctx.fillRect(1280 - 204, 720 - 34, 176 * (pl.boost / CONFIG.BOOST_MAX), 10);

  // Landing window tape appears once the runway is ahead.
  // Speeds are px/s internally; the tape shows kt.
  if (state.nearRunway) {
    drawLandingWindow(ctx, 1280 / 2 - 190, 720 - 66, 380, pl.vx, pl.vy);
  }

  // Warnings.
  if (state.pullUp) {
    ctx.fillStyle = Math.sin(t * 10) > 0 ? P.hudRed : 'rgba(255, 59, 48, 0.35)';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PULL UP', 640, 130);
  } else if (state.stallWarn) {
    ctx.fillStyle = Math.sin(t * 8) > 0 ? P.hudAmber : 'rgba(255, 179, 71, 0.4)';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOW SPEED — STALL', 640, 130);
  }

  // Needle bonus toast.
  if (state.toast && t < state.toastUntil) {
    ctx.fillStyle = P.hudAmber;
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.toast, 640, 170);
  }
}

// Full-screen overlay for title / landed / crashed states.
export function drawOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(8, 12, 34, 0.62)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';

  if (state.phase === 'title') {
    ctx.fillStyle = P.hudAmber;
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.fillText('RUNWAY ZERO', 640, 250);
    ctx.fillStyle = P.hudCream;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('Precision landing in the canyon — one runway, one chance.', 640, 300);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(245, 230, 200, 0.85)';
    ctx.fillText('↑ ↓ pitch      ← → throttle      SHIFT boost      R restart', 640, 360);
    ctx.fillStyle = P.hudAmber;
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(state.blink ? 'PRESS SPACE TO FLY' : '', 640, 430);
    return;
  }

  const result = state.result;
  const color = result.quality === 'PERFECT' ? '#ffd700'
    : result.quality === 'SAFE' ? P.hudCream : P.hudRed;
  ctx.fillStyle = color;
  ctx.font = 'bold 72px system-ui, sans-serif';
  ctx.fillText(result.quality === 'MISS' ? 'MISSED' : result.quality, 640, 220);
  ctx.fillStyle = P.hudCream;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(result.line, 640, 268);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(245, 230, 200, 0.9)';
  for (let i = 0; i < result.breakdown.length; i++) {
    ctx.fillText(result.breakdown[i], 640, 320 + i * 30);
  }
  ctx.fillStyle = P.hudAmber;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(`SCORE ${result.score}`, 640, 320 + result.breakdown.length * 30 + 18);
  ctx.fillStyle = P.hudCream;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(state.blink ? 'PRESS R TO FLY AGAIN' : '', 640, 320 + result.breakdown.length * 30 + 62);
}
