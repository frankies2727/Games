// VibeCheck hosted "brain" — a Cloudflare Worker that gives every visitor
// grounded company profiles without exposing any key.
//
// It calls Google's Gemini API with the built-in Google Search grounding tool,
// so answers are based on live web results, then returns a clean JSON profile
// that the VibeCheck front-end renders. Your Gemini key lives ONLY here, as a
// Worker secret — it is never shipped to the browser.
//
// Setup (all in your browser, no coding): see docs/VIBECHECK_HOSTING.md.
//   1. Create a free Cloudflare Worker and paste this file in.
//   2. Add a secret named GEMINI_API_KEY (your Google AI Studio key).
//   3. (Optional) Add a variable ALLOWED_ORIGIN = your site, e.g.
//      https://frankies2727.github.io  — locks the API to your site.
//   4. Deploy, copy the worker URL, and set it as the VIBECHECK_API_URL repo
//      variable so the site knows where to call.

const GEMINI_MODEL = 'gemini-2.5-flash';

const PROMPT = (query) => `You are VibeCheck, a hipster but accurate company analyst.
Use Google Search to research the company or brand "${query}" using up-to-date, real information.
Then reply with ONLY a JSON object (no markdown fences, no commentary) using exactly these keys:
{
  "name": string,            // canonical company/brand name
  "tagline": string,         // punchy one-liner, under 12 words
  "rundown": string,         // 2-4 sentences: what they do and why they matter right now
  "founded": string,         // year, optionally with place; "" if unknown
  "industry": string,        // "" if unknown
  "headquarters": string,    // city, country; "" if unknown
  "founders": string[],      // people; [] if unknown
  "timeline": [ { "year": string, "event": string } ],  // 3-6 real milestones, oldest first
  "notableFacts": string[],  // 3-5 genuinely interesting, true facts
  "website": string          // bare domain like "example.com"; "" if unknown
}
Base every field on your search results. If the company genuinely can't be found, set "name" to the query and explain that in "rundown". Do not invent precise figures you didn't find.`;

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

// Pull the web pages Gemini actually cited, so the UI can show its sources.
function extractSources(candidate) {
  const chunks = candidate?.groundingMetadata?.groundingChunks || [];
  const seen = new Set();
  const out = [];
  for (const c of chunks) {
    const uri = c?.web?.uri;
    const title = c?.web?.title;
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    out.push({ title: title || uri, url: uri });
    if (out.length >= 5) break;
  }
  return out;
}

export default {
  async fetch(request, env) {
    const allowOrigin = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);

    if (!env.GEMINI_API_KEY) return json({ error: 'Server missing GEMINI_API_KEY' }, 500);

    let query = '';
    try {
      const bodyIn = await request.json();
      query = String(bodyIn?.query || '').trim().slice(0, 100);
    } catch {
      /* ignore */
    }
    if (!query) return json({ error: 'Missing "query"' }, 400);

    let resp;
    try {
      resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: PROMPT(query) }] }],
            tools: [{ google_search: {} }],
            generationConfig: { temperature: 0.6 },
          }),
        },
      );
    } catch {
      return json({ error: 'Could not reach Gemini' }, 502);
    }

    if (!resp.ok) {
      const detail = (await resp.text().catch(() => '')).slice(0, 300);
      return json({ error: `Gemini error ${resp.status}`, detail }, 502);
    }

    const data = await resp.json();
    const candidate = data?.candidates?.[0];
    const text = (candidate?.content?.parts || []).map((p) => p.text).filter(Boolean).join('');
    const profile = extractJson(text);
    if (!profile) return json({ error: 'Gemini returned an unreadable answer' }, 502);

    profile.sources = extractSources(candidate);
    return json({ profile });
  },
};
