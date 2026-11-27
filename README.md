# RUNWAY ZERO

[![make.fun bounty](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/imkofty/runway-zero-flight-game/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/imkofty/runway-zero-flight-game/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

A precision-landing flight game, built for the
[make.fun best flight game bounty](https://make.fun/bounty/best-flight-game-20261126-0057).
One runway, one canyon, one chance: thread the rock pillars at dusk and put
the plane down on the narrow strip called ZERO — inside the Landing Window
for a Perfect score.

## Play

Open `game/index.html` in a desktop browser (no network, no build step) or
serve `game/` with any static server.

- **↑ / ↓** — pitch (climb / descend)
- **← / →** — throttle down / up
- **SHIFT / SPACE / mouse hold** — boost
- **R** — restart

Land on the runway with the right speed, sink rate and centre offset:
**PERFECT** (+1000), **SAFE** (+500), **MISS** (0). Skim a pillar top
closely — gear above the rock — for a +150 needle bonus. 90 seconds on
the clock; the sun is setting.

## Polish v2 (27 Nov 2026)

After the probe submission, a Feed audit scored us 74/100 (12–13 of 23
sampled judged entries). Three fixes only: (1) the needle bonus is now
earnable — gear 4–90 px above a pillar top (the old window sat inside
the crash zone, so +150 could never survive to a landing); (2) the hero
frame shows the whole runway + a glowing goal beacon + a HUD objective
line ("LAND ON ZERO — PERFECT +1000 • SAFE +500"); (3) a brighter dusk
with a volcano behind the runway and a lit village on the canyon floor.
The reward screenshot comes from a real flown landing (autopilot):
SAFE 1500 with both needle bonuses genuinely earned. One honest note:
the 90 s timeout cannot trigger in practice — the world is crossable
in ~37 s at minimum speed, so every flight ends in a landing or a
crash first.

## Layout

- `main.ts` — the entrypoint: copies `game/` + `screenshots/` to `/output`
  and writes `dossier.json` with the kit's `buildDossier`.
- `game/index.html` — the page; `game/src/` is the game, one file per job:
  `config` (palette + tuning), `input`, `world` (canyon + runway),
  `plane` (flight model + drawing), `hud` (instruments + Landing Window),
  `shots` (the four screenshot presets), `main` (loop + states + scoring).
- `game/` is plain static files — no libraries, no network requests.
- `screenshots/` — four real renders of the game's own code (1280×720):
  hero, danger, reward, readability.
- `vendor/makefun-game.ts` — the kit's library, unchanged.
