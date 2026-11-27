// RUNWAY ZERO — shots.js
// One job: the four screenshot presets. Each one puts the game into a fixed,
// readable state and freezes it, so a screenshot is a real render of the
// game's own code at a chosen moment. Called with ?shot=<name>.

import { CONFIG } from './config.js';
import { newPlane } from './plane.js';

// Apply a preset to the game state object. Returns true when a preset matched.
export function applyShot(state, name) {
  const pl = newPlane();
  state.plane = pl; // the preset IS the plane; without this the default
  // start-plane stays on screen and the camera looks at empty sky.
  state.shot = name;

  if (name === 'hero') {
    // Mid-flight over the canyon: plane big, runway + arch ahead, HUD full.
    pl.x = 3400;
    pl.y = 340;
    pl.vx = 250;
    pl.vy = -18;
    pl.pitch = -0.12;
    pl.throttle = 0.72;
    pl.boost = 68;
    state.phase = 'flying';
    state.timeLeft = 52;
    state.score = 150;
    state.camera.x = 2840;
    state.camera.y = 120;
    state.camera.zoom = 1;
    state.nearRunway = true;
    return true;
  }

  if (name === 'danger') {
    // Threading the second pillar low, boost on, PULL UP warning live.
    pl.x = 2540;
    pl.y = 308;
    pl.vx = 330;
    pl.vy = 26;
    pl.pitch = 0.1;
    pl.throttle = 1;
    pl.boost = 34;
    pl.boosting = true;
    state.phase = 'flying';
    state.timeLeft = 41;
    state.score = 300;
    state.camera.x = 2520 - 520;
    state.camera.y = 90;
    state.camera.zoom = 1;
    state.pullUp = true;
    state.nearRunway = false;
    return true;
  }

  if (name === 'reward') {
    // Just touched down on ZERO: PERFECT banner, dust, score popup.
    pl.x = CONFIG.RUNWAY_CENTER;
    pl.y = CONFIG.RUNWAY_Y - 26;
    pl.vx = 0;
    pl.vy = 0;
    pl.pitch = 0;
    pl.throttle = 0;
    state.phase = 'ended';
    state.timeLeft = 38;
    state.score = 1380;
    state.camera.x = 3700; // plane at screen x 300: clear of the centred text
    state.camera.y = 120;
    state.camera.zoom = 1;
    state.nearRunway = true;
    state.result = {
      quality: 'PERFECT',
      line: 'Touchdown in the window — speed, sink and centre all green.',
      breakdown: [
        'Perfect landing  +1000',
        'Threaded the needle  +150',
        'Time bonus (38 s left)  +380',
      ],
      score: 1530,
    };
    state.dust = [];
    for (let i = 0; i < 26; i++) {
      state.dust.push({
        x: CONFIG.RUNWAY_CENTER - 90 + i * 8,
        y: CONFIG.RUNWAY_Y - 4 - (i % 5) * 4,
        r: 4 + (i % 4) * 3,
        a: 0.5,
      });
    }
    return true;
  }

  if (name === 'readability') {
    // Close chase view: big plane, instruments and HUD readable at a glance.
    pl.x = 2050;
    pl.y = 300;
    pl.vx = 210;
    pl.vy = -8;
    pl.pitch = -0.06;
    pl.throttle = 0.62;
    pl.boost = 82;
    state.phase = 'flying';
    state.timeLeft = 63;
    state.score = 150;
    state.camera.x = 1410; // plane dead-centre on screen, tail clear of the HUD
    state.camera.y = 150;
    state.camera.zoom = 1.28;
    state.nearRunway = false;
    return true;
  }

  return false;
}
