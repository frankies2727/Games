# Paper Games

A small gallery of chill, real-time pencil-and-paper games. Play over a shared
room code (**2 players**, or **2–4** for Ludo), or hit **Play vs Computer** on any
game's join screen to take on built-in bots solo (offline). Pick one from the home
screen:

- **Paper Numbers** — one player is the **Finder** (races to spot a target number
  on a 10×10 grid; claimed numbers turn red) while the other is the **Dotter**
  (fills a 64-dot sheet). Finding the number swaps roles — first to fill all 64
  dots wins.
- **Tic-Tac-Toe** — the classic 3-in-a-row duel.
- **Connect 4** — drop discs and line up four.
- **High-Low** — the guesser secretly calls higher or lower, then the *opponent
  deals a card blind* (they can't see the call). Each round starts from a fresh
  random card. Correct call scores; first to 6.
- **Battleship** — arrange your fleet (shuffle a **random** layout or **place each
  ship by hand**), then hunt the enemy ships. The game only starts once **both**
  players ready up. Opponent ship positions are masked server-side (`redact`) so
  they can't be read off the wire.
- **Dots & Boxes** — pick a **quick** (5×5) or **long** (8×8) board, then take
  turns drawing the edges of the grid; close the fourth side of a box to claim it
  and take another turn. Most boxes wins.
- **Ludo** — the classic **2–4 player** race on the cross board. Roll the die,
  release a token on a 6, chase your tokens clockwise around the shared loop, and
  land on rivals to send them back to their pen (except on safe squares). Turn up
  your colour's home column into the centre; first to get all four tokens home
  wins. Rolling a 6 — or capturing / finishing a token — earns another roll. Solo
  play lets you pick 2–4 players (you plus bots); online, up to four share a room
  code and the host starts once everyone's in.
- **Uno Frenzy!** — Uno's colour/number matching plus a deck of chaos: **Swap**
  trades entire hands, **Steal** yanks cards from your rival, and **Frenzy** buries
  them under six. Classic Skip / Reverse / +2 / Wild / +4 included. Empty your hand
  first to win. (Opponent hands are masked server-side via `redact`.)
- **Blackjack 21** — a neon, suit-free race to 21. Hit, Stand, or Double Down;
  closest without busting takes the round, with naturals and doubles worth extra.
  First to the point target wins. Your rival's hole cards stay hidden (`redact`)
  until the reveal.

When a game ends, the final board stays on screen behind the result panel — hit
**View Final Board** to inspect exactly how it played out before heading back.

Every game is fully **peer-to-peer**: the two browsers connect directly via WebRTC
(using [PeerJS](https://peerjs.com) for the initial handshake), so there's no
backend server to run or pay for. That's what lets it live on GitHub Pages.

**Play it:** https://frankies2727.github.io/Games/

## Adding a game

Each game is a self-contained `GameDefinition` in `src/games/` (initial state,
`start`, a pure `reducer`, and a `Board` component). Add it to the registry in
`src/games/index.ts` and it shows up in the gallery automatically — the
peer-to-peer networking in `src/hooks/usePeerSession.ts` is game-agnostic. Set
`minPlayers`/`maxPlayers` (both default 2) to seat more than two — the lobby, the
"Play vs Computer" flow, and the host's start gate all adapt automatically.

To make a game playable solo, add an optional `botMove(state, botId)` to its
definition that returns the action the bot should take (or `null` when it isn't
the bot's turn). Games with a `botMove` automatically get the **Play vs Computer**
button; `src/hooks/useLocalSession.ts` runs the same `reducer` locally and drives
the bot after each move.

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
