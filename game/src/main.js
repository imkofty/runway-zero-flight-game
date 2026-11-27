// RUNWAY ZERO — main.js
// One job: the game loop. States (title / flying / ended), camera, scoring,
// dust and the wiring between plane, world, HUD and input.

import { CONFIG } from './config.js';
import { Input } from './input.js';
import { groundAt, onRunway, drawWorld } from './world.js';
import { newPlane, stepPlane, drawPlane } from './plane.js';
import { drawHUD, drawOverlay } from './hud.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.W;
canvas.height = CONFIG.H;

const state = {
  phase: 'title', // title | flying | ended
  plane: newPlane(),
  camera: { x: 0, y: 120, zoom: 1 },
  score: 0,
  timeLeft: CONFIG.LEVEL_TIME,
  nearRunway: false,
  pullUp: false,
  stallWarn: false,
  toast: null,
  toastUntil: 0,
  result: null,
  dust: [],
  shot: null,
  blink: true,
  t: 0,
};

function reset() {
  state.plane = newPlane();
  state.camera = { x: 0, y: 120, zoom: 1 };
  state.score = 0;
  state.timeLeft = CONFIG.LEVEL_TIME;
  state.nearRunway = false;
  state.pullUp = false;
  state.stallWarn = false;
  state.toast = null;
  state.result = null;
  state.dust = [];
  state.phase = 'flying';
}

function land(ev) {
  const pl = state.plane;
  const timeBonus = Math.max(0, Math.round(state.timeLeft)) * CONFIG.TIME_BONUS_PER_SEC;
  const needle = state.plane.needleBonus.filter(Boolean).length * CONFIG.SCORE_NEEDLE;
  const base = ev.quality === 'PERFECT' ? CONFIG.SCORE_PERFECT
    : ev.quality === 'SAFE' ? CONFIG.SCORE_SAFE : 0;
  const total = base + timeBonus + needle;
  state.score = total;
  const line = ev.quality === 'PERFECT'
    ? 'Touchdown in the window — speed, sink and centre all green.'
    : ev.quality === 'SAFE'
      ? 'Down on ZERO, but outside the perfect window.'
      : 'Too fast, too hard, or too far from the centre line.';
  const breakdown = [];
  if (base) breakdown.push(`${ev.quality === 'PERFECT' ? 'Perfect' : 'Safe'} landing  +${base}`);
  if (needle) breakdown.push(`Threaded the needle  +${needle}`);
  if (timeBonus) breakdown.push(`Time bonus (${Math.max(0, Math.round(state.timeLeft))} s left)  +${timeBonus}`);
  if (!base && !needle && !timeBonus) breakdown.push('No points — fly the window, not the ground.');
  state.result = { quality: ev.quality, line, breakdown, score: total };
  state.phase = 'ended';
  // Touchdown dust.
  for (let i = 0; i < 24; i++) {
    state.dust.push({
      x: pl.x - 90 + Math.random() * 190,
      y: CONFIG.RUNWAY_Y - 4 - Math.random() * 14,
      r: 4 + Math.random() * 8,
      a: 0.6,
    });
  }
}

function crash(reason) {
  const pl = state.plane;
  state.result = {
    quality: 'MISS',
    line: reason,
    breakdown: ['Aircraft lost — the canyon keeps what it catches.'],
    score: 0,
  };
  state.phase = 'ended';
  for (let i = 0; i < 30; i++) {
    state.dust.push({
      x: pl.x - 60 + Math.random() * 130,
      y: pl.y - 20 + Math.random() * 40,
      r: 5 + Math.random() * 10,
      a: 0.8,
    });
  }
}

function update(dt) {
  state.t += dt;
  state.blink = Math.floor(state.t * 1.6) % 2 === 0;
  const pl = state.plane;

  if (state.phase === 'title') {
    if (Input.consumeAction() || Input.anyKey) {
      state.phase = 'flying';
      Input.anyKey = false;
    }
    // Idle drift: plane hovers gently over the start mesa for the title shot.
    pl.propAngle += dt * 20;
    return;
  }

  if (state.phase === 'ended') {
    if (Input.consumeRestart() || Input.consumeAction()) reset();
    for (const d of state.dust) {
      d.a -= dt * 0.5;
      d.r += dt * 14;
    }
    state.dust = state.dust.filter((d) => d.a > 0);
    return;
  }

  // Flying.
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    crash('Out of time — the sun set on the approach.');
    return;
  }

  const ev = stepPlane(pl, Input, dt);
  if (ev.needle >= 0) {
    state.score += CONFIG.SCORE_NEEDLE;
    state.toast = `THREAD THE NEEDLE  +${CONFIG.SCORE_NEEDLE}`;
    state.toastUntil = state.t + 2;
  }
  if (ev.landed) {
    land(ev);
    return;
  }
  if (ev.crashed) {
    crash('You hit the canyon. The runway was 4000 feet ahead.');
    return;
  }
  if (Input.consumeRestart()) reset();

  // Proximity flags for the HUD.
  const gearY = pl.y + 26;
  const ground = groundAt(pl.x + 60);
  state.pullUp = ground - gearY < 90 && pl.vy > 20 && !onRunway(pl.x);
  state.stallWarn = !state.pullUp && pl.vx < CONFIG.STALL_SPEED;
  state.nearRunway = pl.x > 3300 && pl.x < 4300;

  // Camera: follow with lookahead, damped; zoom eases to the shot value.
  const targetX = Math.max(0, Math.min(CONFIG.WORLD_W - 1280, pl.x - 480 + pl.vx * 0.25));
  const targetY = Math.max(0, Math.min(180, pl.y - 330));
  state.camera.x += (targetX - state.camera.x) * Math.min(1, 3.2 * dt);
  state.camera.y += (targetY - state.camera.y) * Math.min(1, 2.4 * dt);
}

function render() {
  ctx.clearRect(0, 0, CONFIG.W, CONFIG.H);
  const zoom = state.camera.zoom;
  ctx.save();
  if (zoom !== 1) {
    ctx.translate(CONFIG.W / 2, CONFIG.H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-CONFIG.W / 2, -CONFIG.H / 2);
  }
  // World draws in screen space offset by the camera.
  drawWorld(ctx, { x: state.camera.x, y: state.camera.y }, state.t);
  drawPlane(ctx, state.plane, state.camera, state.t);

  // Dust puffs (screen space).
  for (const d of state.dust) {
    ctx.fillStyle = `rgba(245, 230, 200, ${Math.max(0, d.a)})`;
    ctx.beginPath();
    ctx.arc(d.x - state.camera.x, d.y - state.camera.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  if (state.phase !== 'title') drawHUD(ctx, state, state.t);
  if (state.phase === 'title' || state.phase === 'ended') drawOverlay(ctx, state);
  // After a landing the plane stays visible on top of the dimmed overlay,
  // so the reward shot shows the aircraft on the runway, not just text.
  if (state.phase === 'ended') {
    drawPlane(ctx, state.plane, state.camera, state.t);
    for (const d of state.dust) {
      ctx.fillStyle = `rgba(245, 230, 200, ${Math.max(0, d.a)})`;
      ctx.beginPath();
      ctx.arc(d.x - state.camera.x, d.y - state.camera.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!state.shot) update(dt);
  render();
  requestAnimationFrame(loop);
}

// Screenshot presets: ?shot=hero|danger|reward|readability freezes the frame.
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
if (shotName) {
  if (applyShot(state, shotName)) {
    state.t = 1.42; // fixed light/time: PULL UP bright, blink text on, strobe lit
  }
}

Input.attach();
requestAnimationFrame(loop);
