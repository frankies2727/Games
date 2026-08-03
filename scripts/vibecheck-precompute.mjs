// VibeCheck "night-shift factory": pre-generate company profiles offline with a
// local model (Ollama + Gemma), grounded from the web, and write them as JSON
// under src/projects/vibecheck/data/. The static site reads those files, so
// niche/private companies resolve instantly for every visitor — no live model,
// no API key, no server. Meant to run in GitHub Actions (see the workflow), but
// it also runs locally: `node scripts/vibecheck-precompute.mjs`.
//
// Env:
//   OLLAMA_URL  (default http://localhost:11434)
//   LLM_MODEL   (default gemma3)
//   REFRESH     ("1" to regenerate profiles that already exist; default: skip
//               existing so hand-written seeds and prior runs are preserved)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'src/projects/vibecheck/data');
const LIST_PATH = join(__dirname, 'vibecheck-companies.json');

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/+$/, '');
const LLM_MODEL = process.env.LLM_MODEL || 'gemma3';
const REFRESH = process.env.REFRESH === '1';
const TODAY = new Date().toISOString().slice(0, 10);

const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Grounding: gather real web context + source links -----------------------

async function wikiContext(name) {
  try {
    const s = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1&format=json&origin=*`);
    const title = (await s.json())?.query?.search?.[0]?.title;
    if (!title) return null;
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.extract || j.type === 'disambiguation') return null;
    return {
      text: j.extract,
      source: { title: `Wikipedia — ${j.title}`, url: j.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}` },
    };
  } catch {
    return null;
  }
}

async function duckContext(name) {
  try {
    const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(name + ' company')}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VibeCheckBot/1.0)' },
    });
    if (!r.ok) return { text: '', sources: [] };
    const html = await r.text();
    const results = [];
    const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const snipRe = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
    const decodeDdg = (href) => {
      const m = href.match(/[?&]uddg=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : href.startsWith('//') ? 'https:' + href : href;
    };
    let m;
    const snippets = [];
    while ((m = snipRe.exec(html)) && snippets.length < 5) snippets.push(strip(m[1]));
    let i = 0;
    while ((m = re.exec(html)) && results.length < 4) {
      const url = decodeDdg(m[1]);
      const title = strip(m[2]);
      if (title && /^https?:\/\//.test(url)) results.push({ title, url });
      i++;
    }
    return { text: snippets.join(' '), sources: results };
  } catch {
    return { text: '', sources: [] };
  }
}

// --- Model call --------------------------------------------------------------

function extractJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

const asStrings = (v) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []);

function buildPrompt(name, context) {
  return `You are VibeCheck, a hipster but accurate company analyst.
Using the RESEARCH NOTES below (from the live web), write a fun but truthful JSON profile of "${name}".
Reply with ONLY a JSON object, no markdown, using exactly these keys:
{
  "tagline": string,        // punchy one-liner, under 12 words
  "rundown": string,        // 2-4 sentences: what they do and why they matter
  "founded": string,        // year (+ place if known); "" if unknown
  "industry": string,       // "" if unknown
  "headquarters": string,   // city, country; "" if unknown
  "founders": string[],     // [] if unknown
  "timeline": [ { "year": string, "event": string } ],  // 3-6 real milestones, oldest first
  "notableFacts": string[]  // 3-5 genuinely interesting, true facts
}
Base everything on the notes. Do NOT invent precise numbers (revenue, valuations) you don't see in the notes — keep those qualitative or omit them. If the notes are thin, keep it short and honest.

RESEARCH NOTES for "${name}":
${context.slice(0, 6000)}`;
}

async function generate(name, context) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LLM_MODEL,
      stream: false,
      format: 'json',
      keep_alive: '0',
      options: { temperature: 0.6 },
      messages: [{ role: 'user', content: buildPrompt(name, context) }],
    }),
  });
  if (!res.ok) throw new Error(`ollama http ${res.status}`);
  const data = await res.json();
  const parsed = extractJson(data?.message?.content || '');
  if (!parsed) throw new Error('unparseable model output');
  return parsed;
}

// --- Main --------------------------------------------------------------------

async function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const companies = JSON.parse(readFileSync(LIST_PATH, 'utf8'));
  let written = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of companies) {
    const name = typeof entry === 'string' ? entry : entry.name;
    const sector = typeof entry === 'string' ? '' : entry.sector || '';
    const slug = slugify(name);
    const outPath = join(DATA_DIR, `${slug}.json`);

    if (existsSync(outPath) && !REFRESH) {
      console.log(`• skip ${name} (already have ${slug}.json)`);
      skipped++;
      continue;
    }

    try {
      const wiki = await wikiContext(name);
      const duck = await duckContext(name);
      const contextText = [wiki?.text, duck.text].filter(Boolean).join('\n\n');
      const sources = [wiki?.source, ...duck.sources].filter(Boolean).slice(0, 5);

      if (!contextText.trim()) {
        console.log(`• ${name}: no web context found, generating from model knowledge only`);
      }

      const g = await generate(name, contextText || `(no notes found — use general knowledge about "${name}")`);

      const profile = {
        name,
        slug,
        sector,
        tagline: String(g.tagline || '').trim(),
        rundown: String(g.rundown || '').trim(),
        founded: String(g.founded || '').trim(),
        industry: String(g.industry || sector || '').trim(),
        headquarters: String(g.headquarters || '').trim(),
        founders: asStrings(g.founders),
        timeline: (Array.isArray(g.timeline) ? g.timeline : [])
          .map((t) => ({ year: String(t?.year ?? '').trim(), event: String(t?.event ?? '').trim() }))
          .filter((t) => t.year && t.event)
          .slice(0, 6),
        notableFacts: asStrings(g.notableFacts).slice(0, 5),
        sources,
        generatedBy: LLM_MODEL,
        updated: TODAY,
      };

      writeFileSync(outPath, JSON.stringify(profile, null, 2) + '\n');
      console.log(`✓ wrote ${slug}.json (${profile.timeline.length} milestones, ${sources.length} sources)`);
      written++;
      await sleep(500); // be polite to the web sources
    } catch (err) {
      console.error(`✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. wrote ${written}, skipped ${skipped}, failed ${failed}.`);
  if (written === 0 && failed > 0) process.exit(1);
}

main();
