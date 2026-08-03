// Talks to a locally-running Ollama server (https://ollama.com) so VibeCheck can
// generate a company profile with a local model such as Google's Gemma — no API
// key, no cloud. This only works where Ollama is actually running (your machine,
// `ollama run gemma3`); on the public site we fall back to Wikipedia.

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_OLLAMA_MODEL = 'gemma3';

export type OllamaProfile = {
  name: string;
  tagline: string;
  rundown: string;
  founded: string;
  industry: string;
  headquarters: string;
  founders: string[];
  timeline: { year: string; event: string }[];
  notableFacts: string[];
  website: string;
};

const normUrl = (url: string) => url.trim().replace(/\/+$/, '');

// Is an Ollama server reachable at this URL? Short timeout so a missing server
// fails fast instead of hanging the UI.
export async function checkOllama(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const r = await fetch(`${normUrl(url)}/api/tags`, { signal: controller.signal });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const SYSTEM_PROMPT = `You are VibeCheck, a hipster but accurate company analyst.
Given a company or brand name, reply with ONLY a JSON object (no markdown, no prose) using exactly these keys:
{
  "name": string,                 // canonical company/brand name
  "tagline": string,              // punchy one-liner, under 12 words
  "rundown": string,              // 2-4 sentences: what they do and why they matter
  "founded": string,              // year, optionally with place; "" if unsure
  "industry": string,             // "" if unsure
  "headquarters": string,         // city, country; "" if unsure
  "founders": string[],           // people; [] if unsure
  "timeline": [ { "year": string, "event": string } ],  // 3-6 items, oldest first
  "notableFacts": string[],       // 3-5 fun, interesting facts
  "website": string               // bare domain like "example.com"; "" if unsure
}
Rules: Be playful but truthful. Do NOT invent precise numbers (revenue, valuations, user counts) — if you are not confident, leave the field "" or keep it qualitative. Never fabricate a company that you don't recognize; if you don't know it, say so in the rundown.`;

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        /* fall through */
      }
    }
    return null;
  }
}

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 6) : [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProfile(raw: any, fallbackName: string): OllamaProfile {
  const timeline = Array.isArray(raw?.timeline)
    ? raw.timeline
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((t: any) => ({ year: String(t?.year ?? '').trim(), event: String(t?.event ?? '').trim() }))
        .filter((t: { year: string; event: string }) => t.year && t.event)
        .slice(0, 6)
    : [];
  return {
    name: String(raw?.name || fallbackName).trim(),
    tagline: String(raw?.tagline || '').trim(),
    rundown: String(raw?.rundown || '').trim(),
    founded: String(raw?.founded || '').trim(),
    industry: String(raw?.industry || '').trim(),
    headquarters: String(raw?.headquarters || '').trim(),
    founders: asStringArray(raw?.founders),
    timeline,
    notableFacts: asStringArray(raw?.notableFacts),
    website: String(raw?.website || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, ''),
  };
}

// Generate a profile with the local model. Throws with a friendly message when
// the server is unreachable or the response can't be parsed.
export async function generateProfile(url: string, model: string, query: string): Promise<OllamaProfile> {
  let res: Response;
  try {
    res = await fetch(`${normUrl(url)}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.trim() || DEFAULT_OLLAMA_MODEL,
        stream: false,
        format: 'json',
        options: { temperature: 0.7 },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Company or brand: "${query}"` },
        ],
      }),
    });
  } catch {
    throw new Error('unreachable');
  }
  if (!res.ok) {
    // 404 from /api/chat usually means the model isn't pulled yet.
    throw new Error(res.status === 404 ? 'model-missing' : `http-${res.status}`);
  }
  const data = await res.json();
  const content: string = data?.message?.content ?? '';
  const parsed = extractJson(content);
  if (!parsed || typeof parsed !== 'object') throw new Error('bad-json');
  return normalizeProfile(parsed, query);
}
