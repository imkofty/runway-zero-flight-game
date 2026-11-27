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
    // Mid-flight over the canyon: plane big, whole runway + goal beacon
    // ahead, objective line live, HUD full.
    pl.x = 3400;
    pl.y = 330;
    pl.vx = 250;
    pl.vy = -18;
    pl.pitch = -0.12;
    pl.throttle = 0.72;
    pl.boost = 68;
    state.phase = 'flying';
    state.timeLeft = 52;
    state.score = 150;
    state.camera.x = 3100; // runway 3850-4150 lands at screen 750-1050: whole
    state.camera.y = 110; // "ZERO" text, beacon and windsock fully in frame
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
    // Honest restaging of an achievable outcome: Perfect + time bonus
    // only. The needle line is NOT faked here — it appears only when a
    // real playthrough earns it (see real-play capture for 3-reward.jpg).
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
        'Time bonus (38 s left)  +380',
      ],
      score: 1380,
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
    // Final approach at zoom 0.8: plane centre, pillar 2 at the left edge
    // and runway ZERO at the right edge in one frame, instruments readable.
    pl.x = 3350;
    pl.y = 330;
    pl.vx = 210;
    pl.vy = -8;
    pl.pitch = -0.06;
    pl.throttle = 0.62;
    pl.boost = 82;
    state.phase = 'flying';
    state.timeLeft = 63;
    state.score = 150;
    state.camera.x = 2710; // visible world 2550-4150: pillar 2 + runway
    state.camera.y = 110;
    state.camera.zoom = 0.8;
    state.nearRunway = true;
    return true;
  }

  return false;
}
