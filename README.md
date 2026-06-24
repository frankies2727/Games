# Paper Games

A small gallery of chill, real-time **2-player** pencil-and-paper games. Pick one
from the home screen:

- **Paper Numbers** — one player is the **Finder** (races to spot a target number
  on a 10×10 grid; claimed numbers turn red) while the other is the **Dotter**
  (fills a 64-dot sheet). Finding the number swaps roles — first to fill all 64
  dots wins.
- **Tic-Tac-Toe** — the classic 3-in-a-row duel.
- **Connect 4** — drop discs and line up four.
- **High-Low** — call whether the next card is higher or lower; first to 6 points wins.
- **Battleship** — randomize your fleet, then hunt the enemy ships. Opponent ship
  positions are masked server-side (`redact`) so they can't be read off the wire.

Every game is fully **peer-to-peer**: the two browsers connect directly via WebRTC
(using [PeerJS](https://peerjs.com) for the initial handshake), so there's no
backend server to run or pay for. That's what lets it live on GitHub Pages.

**Play it:** https://frankies2727.github.io/Games/

## Adding a game

Each game is a self-contained `GameDefinition` in `src/games/` (initial state,
`start`, a pure `reducer`, and a `Board` component). Add it to the registry in
`src/games/index.ts` and it shows up in the gallery automatically — the
peer-to-peer networking in `src/hooks/usePeerSession.ts` is game-agnostic.

## How to play

1. One player opens the site, enters a **room code** + name, and joins.
2. They share that same room code with a friend.
3. The friend enters the same code — the two browsers link up directly.
4. Hit **Start** and play. Both players must be online at the same time.

> The room's "host" is whoever joins the code first; their browser is the
> authoritative game state. If they close the tab, the game ends.

## Run locally

**Prerequisites:** Node.js

```bash
npm install
npm run dev      # Vite dev server
```

Open two browser tabs/windows on the same room code to test both sides.

## Deploy (GitHub Pages)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
static site and publishes it to GitHub Pages.

One-time setup: in the repo's **Settings → Pages**, set **Source** to
**GitHub Actions**.

The site is served from `/Games/` (configured via `base` in `vite.config.ts`);
update that if you rename the repo.
