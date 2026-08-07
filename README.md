# Paper Games

A small gallery of chill, real-time pencil-and-paper games. Play over a shared
room code (**2 players**, or **2–4** for Ludo, **2–5** for Lotería), or hit **Play
vs Computer** on any game's join screen to take on built-in bots solo (offline).
In an online room, the **host can also add bots** to fill open seats, so you can
mix real friends and CPUs in the same game. Pick one from the home screen:

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
  code and the host starts once everyone's in. Before Start, each player **picks
  their colour** in the lobby (solo play gets a setup screen) from a wide palette
  of solids, gradients, and a full **rainbow** — one colour per player, locked in
  once the game begins. When **all four** of your pieces are stuck in the pen,
  **guess the die** before you roll — land the guess (or roll a 6) and one piece
  breaks free. A **scrollable history** under the board tracks every roll, move,
  capture, and wildcard.
- **Uno Frenzy!** — Uno's colour/number matching plus a deck of chaos: **Swap**
  trades entire hands, **Steal** yanks cards from your rival, and **Frenzy** buries
  them under six. Classic Skip / Reverse / +2 / Wild / +4 included. Empty your hand
  first to win. (Opponent hands are masked server-side via `redact`.)
- **Blackjack 21** — a neon, suit-free race to 21. Hit, Stand, or Double Down;
  closest without busting takes the round, with naturals and doubles worth extra.
  First to the point target wins. Your rival's hole cards stay hidden (`redact`)
  until the reveal.
- **Lotería Millennial** — the Mexican bingo of images with a millennial twist,
  for **2–5 players**. Pick **Clásico** or **Frenzy** to start. Each player gets a
  4×4 **tabla**; one carta is sung at a time, the slot **flashes** on your tabla
  if you hold it, you drop a **frijol** (bean) on it, then everyone taps **Listo**
  — the next carta is only sung once *all* players are ready. Fill the **whole
  tabla**, then shout **¡Lotería!**. In **Frenzy**, a 🎁 **mystery power-up** pops
  up for a random player at random moments — use it and it's either **"¡1 Free
  Bean!!"** (for you) or **"a random player just got a free bean… awww"**; you
  don't know which until you gamble. The deck blends classic cartas with modern
  chaos (El WiFi, El Aguacate, El Mezcal, El Selfie) and a bunch of very personal
  trip cartas — **El Ajolote**, **La Piedra del Sol** (Museo de Antropología),
  **La Ciudadela**, **La Casa de Tacuba**, **El Chapultepec**, **El Matcha**
  (Matcha Mío Café), **El Zócalo** (Palacio Nacional & its vendors), and **Tacos
  Del Valle**. The deck's un-sung tail is masked server-side (`redact`) so nobody
  peeks ahead.

When a game ends, the final board stays on screen behind the result panel — hit
**View Final Board** to inspect exactly how it played out before heading back.

## ⚡ Projects portal

Tap the **mini Pikachu** in the top-right of the home screen to jump into
**Frankie's Projects** — a little gallery of other things I'm building. First up
is **VibeCheck**: type any company (or tap a featured profile) to generate an
immersive, scrollable visual story — the rundown, fast facts, a timeline, and
fun facts. Two key-free data sources, both working for every visitor:

- **Wikipedia** (fallback) — real data from Wikipedia's public API (search +
  article summary + infobox). Great for established brands; niche or private
  companies may not have an article.
- **Featured profiles** — for companies Wikipedia can't cover (small VC firms,
  private startups), profiles are **pre-generated offline** by a GitHub Action
  running Ollama + Gemma, grounded from the web, and committed as JSON under
  `src/projects/vibecheck/data/`. The static site reads those, so they resolve
  instantly for everyone — no live model, no key, no server. See
  [docs/VIBECHECK_FEATURED.md](docs/VIBECHECK_FEATURED.md) to run/extend it.

On search, a matching featured profile wins; otherwise it falls back to Wikipedia.

### Monthly home-screen image

The **Frankie's Projects** gallery shows a big hero banner at the top. It loads
from a fixed path so you can refresh it whenever you like (a new one each month
works great) — just upload/replace one file, no code change:

```
public/projects/homescreen.jpg
```

Upload a file with that exact name (GitHub → **Add file → Upload files**) and it
appears on the next deploy. If the file is missing, the header falls back to the
Pikachu icon so nothing breaks. See
[public/projects/README.md](public/projects/README.md) for formats and sizing.

Each project is a self-contained component under `src/projects/` registered in
`src/projects/index.ts`, and is **lazy-loaded** so opening the games home screen
never downloads a project's (heavier) code until you actually open it.

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
