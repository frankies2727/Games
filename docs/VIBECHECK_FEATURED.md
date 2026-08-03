# VibeCheck featured profiles (the "night-shift factory")

VibeCheck shows real company stories with **zero API keys and no server**. It has
two key-free sources:

1. **Wikipedia** — looked up live in the visitor's browser (works for established
   companies).
2. **Featured profiles** — for niche/private companies Wikipedia doesn't cover
   (small VC firms, brand-new startups). These are **pre-generated offline** and
   committed to the repo as JSON, so the site can show them instantly to everyone.

The pre-generation is the same trick as a scheduled bot: a **GitHub Action** spins
up a throwaway machine, runs **Ollama + Gemma** on it, researches each company
from the web, and writes the results as JSON. The Action *stocks the shelves*; the
static site just *reads* them. No live model runs when a visitor searches.

## What's where

- `scripts/vibecheck-companies.json` — the list of companies to generate.
- `scripts/vibecheck-precompute.mjs` — the generator (grounds each company from
  Wikipedia + DuckDuckGo, asks Gemma for a JSON profile, writes it out).
- `src/projects/vibecheck/data/*.json` — one profile per company (the "shelf").
  A few are hand-written seeds; the Action fills in and refreshes the rest.
- `.github/workflows/vibecheck-precompute.yml` — the scheduled/manual Action.

## Run it (in the cloud, no setup on your machine)

1. Push this repo to GitHub (already done).
2. Go to the repo's **Actions** tab → **"VibeCheck – precompute profiles"** →
   **Run workflow**. Leave "refresh" off to only fill in missing companies, or
   turn it on to regenerate everything.
3. It runs Ollama + Gemma on GitHub's runner, commits any new/updated
   `data/*.json`, and kicks off the Pages deploy automatically. Give it a few
   minutes, then the new profiles are live.

It also runs **every Monday** on its own to keep things fresh.

> The model is `gemma3:4b` (set by `LLM_MODEL` in the workflow). First run
> downloads it (~3 GB) and caches it for next time.

## Add or change companies

- **Add a company:** add `{ "name": "...", "sector": "..." }` to
  `scripts/vibecheck-companies.json`, then run the Action. It generates the
  missing profile and commits it.
- **Hand-write / correct a profile:** edit its `src/projects/vibecheck/data/<slug>.json`
  directly (same shape as the others). By default the Action **won't overwrite**
  an existing file, so your edits stick unless you run with "refresh" on.

## Run it locally instead (optional)

If you have Ollama installed:

```bash
ollama pull gemma3
OLLAMA_ORIGINS='*' ollama serve      # in one terminal
LLM_MODEL=gemma3 node scripts/vibecheck-precompute.mjs   # in another
```

Then commit the updated `data/*.json`.

## Honest limitations

- It only covers the companies you've **pre-generated** — a curated, growing
  list, not "type literally anything and get a fresh answer." Anything not in the
  list falls back to Wikipedia.
- Gemma is a small model. The Action grounds it in real web pages (and lists
  those sources on the profile), but it can still get details wrong — treat
  profiles as a helpful overview, not gospel. Every profile links its sources so
  readers can check.
