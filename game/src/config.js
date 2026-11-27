// RUNWAY ZERO — config.js
// One job: every tunable number and the single palette of the game.
// Palette: dark navy sky, warm amber sun and instruments, cream runway marks.

export const CONFIG = {
  // Canvas (logical size; screenshots are 1280x720)
  W: 1280,
  H: 720,

  // World
  WORLD_W: 4400,
  RUNWAY_X0: 3850,
  RUNWAY_X1: 4150,
  RUNWAY_Y: 470, // flat mesa top the runway sits on
  RUNWAY_CENTER: 4000,
  START_X: 140,
  START_Y: 300,

  // Flight model (arcade, pixels + seconds)
  SPEED_MIN: 120,
  SPEED_MAX: 330,
  SPEED_BOOST_MULT: 1.45,
  PITCH_UP_MAX: -0.42, // radians, nose up
  PITCH_DOWN_MAX: 0.38, // radians, nose down
  PITCH_RATE: 1.9, // rad per second of input
  ACCEL_RATE: 2.2, // how fast speed chases its target
  VY_RATE: 2.6, // how fast vertical speed chases its target
  STALL_SPEED: 145, // below this the plane sinks
  STALL_SINK: 95, // px/s extra sink while stalled

  // Boost
  BOOST_MAX: 100,
  BOOST_DRAIN: 38, // per second while boosting
  BOOST_REGEN: 13, // per second while not boosting

  // Timer
  LEVEL_TIME: 90, // seconds

  // Landing window (judged on touchdown)
  PERFECT_SPEED: [120, 200], // px/s horizontal
  PERFECT_VSPEED: 70, // px/s downward, max
  PERFECT_OFFSET: 34, // px from runway centre line
  SAFE_SPEED: [95, 245],
  SAFE_VSPEED: 130,
  SAFE_OFFSET: 120,

  // Scoring
  SCORE_PERFECT: 1000,
  SCORE_SAFE: 500,
  SCORE_NEEDLE: 150, // skimming a pillar top closely from above
  TIME_BONUS_PER_SEC: 10,

  // Palette
  PALETTE: {
    skyTop: '#0a1030',
    skyMid: '#1b2350',
    skyLow: '#3c2a5e',
    horizonGlow: '#ff9a3c',
    sunCore: '#ffb347',
    sunGlow: '#ff7a1a',
    farMesa: '#2a2050',
    midRock: '#3a2a58',
    nearRock: '#201638',
    rockRim: '#ffb347',
    river: '#ff9a3c',
    planeBody: '#ff4d1c',
    planeDark: '#c22e08',
    planeStripe: '#f5e6c8',
    planeGlass: '#ffd27a',
    runway: '#2a2140',
    runwayMark: '#f5e6c8',
    runwayLight: '#ffb347',
    hudAmber: '#ffb347',
    hudCream: '#f5e6c8',
    hudRed: '#ff3b30',
    hudGreen: '#7ee081',
    hudPanel: 'rgba(8, 12, 34, 0.72)',
  },
};
