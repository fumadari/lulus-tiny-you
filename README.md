Lulu's Tiny You
================

A whimsical Tamagotchi-style browser game where you take care of a virtual pet named Dario. Built with vanilla HTML5/Canvas and modern ES modules, featuring minigames, an explorable NYC map, a selfie camera, a shop, and a tongue‑in‑cheek Hinge dating mini‑app.

Overview
--------
- Core loop: Feed, pet, talk to Dario; keep hunger, energy, and happiness balanced.
- Activities: Minigames, NYC map exploration, selfie camera, shop purchases.
- Dating: A Hinge-like flow where Dario swipes Lulu variants; rejections cost hearts, good chats award hearts.

What’s Inside
-------------
- `index.html` — UI shell (canvas, overlays, controls) + legacy helpers.
- `game-modular.js` — Main engine: game state, render loop, inputs, map/NPCs, minigame routing, dating glue.
- `modules/` — ES modules:
  - `core/` — `constants.js`, `save-manager.js` (robust backups + recovery).
  - `ui/` — `ui-manager.js` (modals, notifications, overlays, loading, confetti, etc.).
  - `minigames/` — `feed-frenzy.js` (minigame example).
  - `hinge/` — `conversation-system.js` + README.
  - `data/` — `sprites.js`, `trivia-questions.js`.
- Legacy globals (kept for now): `sound.js`, `dance-battle.js`, `camera-system.js`, `map-renderer.js`, `nyc-map-data.js`.

Key Systems
-----------
- Stats & mood: Minute-based decay; critical thresholds trigger heart loss. Mood influences rendering.
- Save system: Multiple fallbacks (localStorage + backup key + sessionStorage + URL hash), iPhone‑friendly emergency backups, save code export/import, optional photo backup. Autosave every 10s and on lifecycle events.
- Map & NPCs: NYC tile map with camera follow, walkable tiles, POIs, and simple NPC behaviors/dialog.
- Hinge Dating: Profiles with likes/doesn’t-like flags. Swipes update hearts. `ConversationSystem` runs question flows (+2 hearts for correct; -2 for wrong; rude choices get extra penalties). Tiered completion rewards.

Run Locally
-----------
- Requirements: Node >= 14
- Start: `npm start` (serves on `http://localhost:8000`)
- Dev (CORS enabled): `npm run dev`
- No build step required; all assets are static.

PWA
---
- `manifest.json` and `sw.js` included. The modular entry now registers the service worker on load for offline caching and better installability.

Deployment
----------
- Static hosting ready (e.g., GitHub Pages). Serve the root so `sw.js` registers at the scope `/`.

Directory Structure
-------------------
- `/` — Static entry (`index.html`), modular engine (`game-modular.js`), legacy helpers, assets.
- `modules/` — ES modules organized by concern (`core`, `ui`, `minigames`, `hinge`, `data`).

Version
-------
- Current: v1.15 (September 4, 2025)
  - PWA: Register service worker from modular entry for offline/install.
  - Dev: Align local dev server to port 8000.
  - Docs: Add project README with architecture and usage.
  - Prior: v1.14 — Dating rejections + penalties for wrong/inappropriate answers.

Contributing & Next Steps
-------------------------
- Keep changes modular and focused; prefer extending `modules/`.
- Potential improvements:
  - Convert legacy globals (dance battle, sound, camera, map renderer) into ES modules.
  - Add lightweight linting/formatting (when adding tooling, mind Pages constraints).
  - Expand minigames and POIs; persist more map state.
  - Optional: centralize configuration for hearts/penalties to tune difficulty.

License
-------
MIT
