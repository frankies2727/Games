# Give everyone grounded VibeCheck answers (the "Live" source)

By default VibeCheck runs **free, with no setup** — it uses Wikipedia for
everyone, plus a local Ollama option for you. This guide adds an optional
**"Live · grounded"** source so that *anyone in the world* who uses your site
gets answers based on a live web search (including niche and private companies).

**How it works, in one sentence:** you run a tiny free cloud service (a
"Cloudflare Worker") that quietly holds your Google Gemini key and does the web
search; the website calls that service, so the key is never exposed and every
visitor shares the same "brain."

You do **not** need to write code. It's mostly copy‑paste and clicking. Set aside
about 20 minutes. You'll touch three websites: **Google AI Studio**,
**Cloudflare**, and **GitHub**.

> 💡 Heads-up on cost: Gemini has a **free tier** that's plenty for a hobby
> project. Cloudflare Workers are **free** up to 100,000 requests/day. If your
> site somehow gets very popular you could exceed the free tiers, so see
> "Keeping it safe & cheap" at the end.

---

## Part 1 — Get a Google Gemini key (~5 min)

1. Go to **https://aistudio.google.com/apikey** and sign in with a Google account.
2. Click **Create API key**. Copy the key (a long string). Keep it somewhere safe
   for a minute — you'll paste it into Cloudflare next. **Never paste this key
   into the website code or GitHub.** It only goes into Cloudflare.

## Part 2 — Create the Cloudflare Worker (~10 min)

1. Go to **https://dash.cloudflare.com** and create a free account (or sign in).
2. In the left menu click **Workers & Pages** → **Create** → **Create Worker**.
3. Give it a name like `vibecheck` and click **Deploy** (it deploys a default
   "Hello World" — we'll replace it next).
4. Click **Edit code**. Delete everything in the editor.
5. Open the file **`server/vibecheck-worker.js`** from this repository, copy its
   entire contents, and paste it into the Cloudflare editor. Click **Deploy**.
6. Add your Gemini key as a secret:
   - Go to the Worker's **Settings** → **Variables and Secrets**.
   - Click **Add**, choose **Secret** (encrypted), name it exactly
     **`GEMINI_API_KEY`**, paste your key as the value, and **Save/Deploy**.
7. *(Recommended)* Lock the service to your site so others can't run up your bill:
   - Add another variable (a plain **Text** one this time) named
     **`ALLOWED_ORIGIN`** with the value of your site, e.g.
     `https://frankies2727.github.io` — then **Save/Deploy**.
8. Copy your Worker's URL. It looks like
   `https://vibecheck.YOUR-NAME.workers.dev`. You'll paste it into GitHub next.

**Quick test (optional):** open the URL in your browser — you should see
`Use POST` (that's the Worker saying it's alive and only accepts real requests).

## Part 3 — Tell the website where the brain is (~5 min)

1. In this GitHub repository, go to **Settings** → **Secrets and variables** →
   **Actions** → the **Variables** tab → **New repository variable**.
2. Name it exactly **`VIBECHECK_API_URL`** and set the value to your Worker URL
   from Part 2 (e.g. `https://vibecheck.YOUR-NAME.workers.dev`). Save.
3. Re-deploy the site so it picks up the new value: go to the **Actions** tab,
   open the latest **"Deploy to GitHub Pages"** run, and click
   **Re-run all jobs** (or just push any small change to `main`).

That's it. Once the deploy finishes, open VibeCheck — you'll see a new
**"Live · grounded"** toggle, on by default, and searches will return live,
web-grounded profiles that list their sources.

---

## Keeping it safe & cheap

- **The key is safe.** It lives only inside Cloudflare as an encrypted secret. It
  is never sent to browsers and never stored in GitHub or the website's code.
- **Lock it to your site.** Setting `ALLOWED_ORIGIN` (Part 2, step 7) stops other
  websites' browsers from using your Worker. (Determined abusers can still call
  it directly, so keep an eye on usage.)
- **Watch usage.** Cloudflare's dashboard shows request counts; Google AI Studio
  shows your Gemini usage. Both have free tiers; you can set up billing alerts in
  Google Cloud if you ever add billing.
- **Turning it off.** Delete the `VIBECHECK_API_URL` repository variable and
  re-deploy — the "Live" toggle disappears and the site falls back to Wikipedia +
  Ollama. Nothing else breaks.

## Troubleshooting

- **No "Live" toggle appears** → the `VIBECHECK_API_URL` variable isn't set, or
  the site hasn't been re-deployed since you set it. Re-run the deploy.
- **"Live service had trouble"** → open your Worker URL directly; if it doesn't
  say `Use POST`, re-check the paste/deploy in Part 2. Make sure the
  `GEMINI_API_KEY` secret is set and spelled exactly.
- **Everything is blocked in the browser console** → your `ALLOWED_ORIGIN` value
  must match your site's address exactly (scheme + host, no trailing slash),
  e.g. `https://frankies2727.github.io`.
