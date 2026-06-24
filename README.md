# Paper Numbers

A chill, real-time **2-player** pencil-and-paper game. One player is the
**Finder** (races to spot a target number on a 10×10 grid) while the other is
the **Dotter** (quietly fills in their 64-dot sheet). Finding the number swaps
the roles — first to fill all 64 dots wins.

It's fully **peer-to-peer**: the two browsers connect directly via WebRTC
(using [PeerJS](https://peerjs.com) for the initial handshake), so there's no
backend server to run or pay for. That's what lets it live on GitHub Pages.

**Play it:** https://frankies2727.github.io/Games/

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
