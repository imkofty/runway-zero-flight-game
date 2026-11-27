// RUNWAY ZERO — plane.js
// One job: the aircraft. Arcade flight model + drawing a big red-orange
// bush plane that reads at a glance against the dusk sky.

import { CONFIG } from './config.js';
import { groundAt, onRunway, PILLARS } from './world.js';

const C = CONFIG;
const P = C.PALETTE;

export function newPlane() {
  return {
    x: C.START_X,
    y: C.START_Y,
    vx: 180, // px/s horizontal
    vy: 0, // px/s vertical (down positive)
    pitch: 0, // radians, nose up is negative
    throttle: 0.55, // 0..1
    boost: C.BOOST_MAX,
    boosting: false,
    propAngle: 0,
    needleBonus: [false, false], // one per pillar
    alive: true,
  };
}

// Returns events the game loop turns into score/feedback:
// { crashed, landed, quality, offset, needle }
export function stepPlane(pl, input, dt) {
  const ev = { crashed: false, landed: false, quality: null, offset: 0, needle: -1 };

  // Pitch.
  if (input.up) pl.pitch -= C.PITCH_RATE * dt;
  if (input.down) pl.pitch += C.PITCH_RATE * dt;
  pl.pitch = Math.max(C.PITCH_UP_MAX, Math.min(C.PITCH_DOWN_MAX, pl.pitch));

  // Throttle.
  if (input.right) pl.throttle = Math.min(1, pl.throttle + 0.7 * dt);
  if (input.left) pl.throttle = Math.max(0, pl.throttle - 0.7 * dt);

  // Boost: Shift / Space / mouse held, while meter lasts.
  pl.boosting = input.boost && pl.boost > 1;
  if (pl.boosting) pl.boost = Math.max(0, pl.boost - C.BOOST_DRAIN * dt);
  else pl.boost = Math.min(C.BOOST_MAX, pl.boost + C.BOOST_REGEN * dt);

  // Speed chases its throttle target; boost multiplies it.
  const targetSpeed = C.SPEED_MIN + (C.SPEED_MAX - C.SPEED_MIN) * pl.throttle;
  const boosted = targetSpeed * (pl.boosting ? C.SPEED_BOOST_MULT : 1);
  pl.vx += (boosted - pl.vx) * Math.min(1, C.ACCEL_RATE * dt);

  // Vertical speed follows pitch; stall sinks the nose.
  let targetVy = -Math.sin(pl.pitch) * pl.vx * 0.95;
  if (pl.vx < C.STALL_SPEED) targetVy += C.STALL_SINK * (1 - pl.vx / C.STALL_SPEED);
  pl.vy += (targetVy - pl.vy) * Math.min(1, C.VY_RATE * dt);

  pl.x += pl.vx * dt;
  pl.y += pl.vy * dt;
  pl.propAngle += dt * (18 + pl.throttle * 30 + (pl.boosting ? 22 : 0));

  // Ceiling: soft push back down.
  if (pl.y < 56) {
    pl.y = 56;
    pl.vy = Math.max(pl.vy, 30);
  }
  // World end: invisible wall past the overshoot mesa.
  if (pl.x > C.WORLD_W - 30) {
    pl.x = C.WORLD_W - 30;
    pl.vx = 0;
  }

  // Needle bonus: skimming a pillar top closely from ABOVE. The gear must
  // pass 4-90 px above the top: below the top is the pillar itself, and
  // the crash check below would end the run, so a bonus can never be
  // earned by flying through the rock. (>4 px keeps the gear clear of
  // the 2 px crash margin.)
  PILLARS.forEach((pillar, i) => {
    if (!pl.needleBonus[i] && Math.abs(pl.x - pillar.x) < 26) {
      const clearance = pillar.top - (pl.y + 26); // pillar top to gear
      if (clearance > 4 && clearance < 90) {
        pl.needleBonus[i] = true;
        ev.needle = i;
      }
    }
  });

  // Ground contact: gear is 26 px below the plane centre.
  const gearY = pl.y + 26;
  const g = groundAt(pl.x);
  if (gearY >= g - 2) {
    if (onRunway(pl.x)) {
      // Landing evaluation.
      const offset = Math.abs(pl.x - C.RUNWAY_CENTER);
      const speed = pl.vx;
      const vspeed = pl.vy;
      let quality = null;
      if (
        speed >= C.PERFECT_SPEED[0] && speed <= C.PERFECT_SPEED[1]
        && vspeed <= C.PERFECT_VSPEED && offset <= C.PERFECT_OFFSET
      ) quality = 'PERFECT';
      else if (
        speed >= C.SAFE_SPEED[0] && speed <= C.SAFE_SPEED[1]
        && vspeed <= C.SAFE_VSPEED && offset <= C.SAFE_OFFSET
      ) quality = 'SAFE';
      else quality = 'MISS';
      ev.landed = true;
      ev.quality = quality;
      ev.offset = offset;
      pl.y = g - 26;
      pl.vy = 0;
      pl.vx = Math.max(0, pl.vx - 260 * dt);
    } else {
      ev.crashed = true;
      pl.alive = false;
    }
  }
  return ev;
}

export function drawPlane(ctx, pl, cam, t) {
  const sx = pl.x - cam.x;
  const sy = pl.y - cam.y;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(pl.pitch * 0.9);
  ctx.scale(1, 1);

  // Boost flame.
  if (pl.boosting) {
    ctx.fillStyle = 'rgba(255, 122, 26, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-118, -4);
    ctx.lineTo(-168 - Math.random() * 22, 0);
    ctx.lineTo(-118, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 211, 122, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-118, -2);
    ctx.lineTo(-148 - Math.random() * 14, 0);
    ctx.lineTo(-118, 3);
    ctx.closePath();
    ctx.fill();
  }

  // Tail fin + stabiliser.
  ctx.fillStyle = P.planeDark;
  ctx.beginPath();
  ctx.moveTo(-96, -6);
  ctx.lineTo(-128, -52);
  ctx.lineTo(-104, -52);
  ctx.lineTo(-78, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = P.planeBody;
  ctx.beginPath();
  ctx.moveTo(-92, 4);
  ctx.lineTo(-132, 16);
  ctx.lineTo(-96, 20);
  ctx.lineTo(-76, 8);
  ctx.closePath();
  ctx.fill();

  // Low wing (seen edge-on from the side, with a lit tip).
  ctx.fillStyle = P.planeDark;
  ctx.beginPath();
  ctx.moveTo(-18, 10);
  ctx.lineTo(42, 26);
  ctx.lineTo(52, 20);
  ctx.lineTo(6, 2);
  ctx.closePath();
  ctx.fill();

  // Fuselage: long sleek body, nose to the right.
  ctx.fillStyle = P.planeBody;
  ctx.beginPath();
  ctx.moveTo(-118, -2);
  ctx.quadraticCurveTo(-60, -26, 30, -18);
  ctx.quadraticCurveTo(108, -12, 132, 2);
  ctx.quadraticCurveTo(108, 14, 30, 18);
  ctx.quadraticCurveTo(-60, 22, -118, 8);
  ctx.closePath();
  ctx.fill();

  // Cream cheatline stripe.
  ctx.fillStyle = P.planeStripe;
  ctx.beginPath();
  ctx.moveTo(-112, 2);
  ctx.quadraticCurveTo(-40, -8, 44, -4);
  ctx.quadraticCurveTo(100, -1, 126, 4);
  ctx.quadraticCurveTo(60, 8, -20, 8);
  ctx.quadraticCurveTo(-80, 8, -112, 6);
  ctx.closePath();
  ctx.fill();

  // Cockpit canopy, amber glass, lit.
  ctx.fillStyle = P.planeGlass;
  ctx.beginPath();
  ctx.moveTo(28, -16);
  ctx.quadraticCurveTo(58, -30, 88, -12);
  ctx.quadraticCurveTo(70, -6, 44, -6);
  ctx.quadraticCurveTo(30, -8, 28, -16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.moveTo(40, -20);
  ctx.quadraticCurveTo(56, -26, 72, -16);
  ctx.quadraticCurveTo(58, -18, 46, -15);
  ctx.closePath();
  ctx.fill();

  // Registration + "ZERO" on the tail.
  ctx.fillStyle = P.planeStripe;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ZERO', -104, -24);

  // Landing gear.
  ctx.strokeStyle = '#1c1428';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-52, 18);
  ctx.lineTo(-52, 26);
  ctx.moveTo(48, 16);
  ctx.lineTo(48, 26);
  ctx.stroke();
  ctx.fillStyle = '#1c1428';
  ctx.beginPath();
  ctx.arc(-52, 28, 6, 0, Math.PI * 2);
  ctx.arc(48, 28, 6, 0, Math.PI * 2);
  ctx.fill();

  // Spinning prop disc at the nose.
  ctx.save();
  ctx.translate(134, 2);
  ctx.rotate(pl.propAngle);
  ctx.fillStyle = 'rgba(245, 230, 200, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(245, 230, 200, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 3, 30, Math.PI / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#1c1428';
  ctx.beginPath();
  ctx.arc(134, 2, 6, 0, Math.PI * 2);
  ctx.fill();

  // Nav lights: red tail, green wing, white strobe blink.
  ctx.fillStyle = '#ff3b30';
  ctx.beginPath();
  ctx.arc(-120, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  if (Math.sin(t * 9) > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -24, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
