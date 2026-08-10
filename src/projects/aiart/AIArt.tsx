import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, ExternalLink, Search, Shuffle, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// AI Art — a gallery of AI-generated images and the exact prompts behind them,
// migrated from Frankie's Notion collection. Browse the images, copy any prompt
// to your clipboard with one tap, and jump to the creator's original post.
//
// Every entry credits its creator, links to the source, tags a theme, and names
// the AI model used. Data lives in ./data/gallery.json; images are self-hosted
// (compressed webp) under public/projects/ai-art/ so the gallery is fully
// standalone — nothing loads from Notion at runtime.
// ---------------------------------------------------------------------------

interface GalleryEntry {
  id: string;
  name: string;
  prompt: string;
  user: string;
  url: string;
  model: string;
  themes: string[];
  img: string;
  w: number;
  h: number;
}

// Eager glob import keeps us off a tsconfig `resolveJsonModule` change and
// matches the pattern used elsewhere in the projects area.
const GALLERY: GalleryEntry[] = (
  Object.values(
    import.meta.glob('./data/gallery.json', { eager: true }) as Record<string, { default: GalleryEntry[] }>,
  )[0]?.default ?? []
).filter((e) => e.img);

const IMG_BASE = `${import.meta.env.BASE_URL}projects/ai-art/`;
const ACCENT = '#ccff00';

// Models in descending frequency, so the busiest filters sit first.
const MODELS: string[] = (() => {
  const count: Record<string, number> = {};
  for (const e of GALLERY) if (e.model) count[e.model] = (count[e.model] || 0) + 1;
  return Object.keys(count).sort((a, b) => count[b] - count[a]);
})();

function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    });
  };
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  return [copied, copy];
}

function xHandleUrl(user: string, fallback: string) {
  const h = user.replace(/^@/, '').trim();
  return h ? `https://x.com/${h}` : fallback;
}

// --- Lightbox: big image + full prompt, copy, credit, model, themes ---------
function Lightbox({
  entry, onClose, onPrev, onNext, onTheme,
}: {
  entry: GalleryEntry;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onTheme: (t: string) => void;
}) {
  const [copied, copy] = useCopy();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] flex flex-col lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="lg:w-3/5 bg-black flex items-center justify-center min-h-[40vh] max-h-[50vh] lg:max-h-[92vh]">
          <img
            src={`${IMG_BASE}${entry.img}`}
            alt={entry.name}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Details */}
        <div className="lg:w-2/5 flex flex-col min-h-0 max-h-[52vh] lg:max-h-[92vh]">
          <div className="p-5 overflow-y-auto">
            <h2 className="text-xl font-black tracking-tight text-white leading-tight">{entry.name}</h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={xHandleUrl(entry.user, entry.url)}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs font-mono font-bold text-neutral-300 hover:text-[#ccff00] transition-colors"
              >
                {entry.user || 'Unknown creator'}
              </a>
              {entry.model && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/15 text-neutral-200 bg-white/5">
                  {entry.model}
                </span>
              )}
            </div>

            {entry.themes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {entry.themes.map((t) => (
                  <button
                    key={t}
                    onClick={() => onTheme(t)}
                    className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full text-neutral-400 border border-white/10 hover:border-[#ccff00]/60 hover:text-[#ccff00] transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500">Prompt</span>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap break-words">
                {entry.prompt || <span className="italic text-neutral-500">No prompt provided.</span>}
              </p>
            </div>
          </div>

          {/* Sticky action bar */}
          <div className="mt-auto flex gap-2 p-4 border-t border-white/10 bg-[#0d0d0d]">
            <button
              onClick={() => copy(entry.prompt)}
              disabled={!entry.prompt}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black transition-transform active:scale-[0.98] disabled:opacity-40"
              style={{ background: ACCENT }}
            >
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy prompt</>}
            </button>
            <a
              href={entry.url || xHandleUrl(entry.user, '#')}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/15 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Original
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Card -------------------------------------------------------------------
interface CardProps {
  key?: string;
  entry: GalleryEntry;
  onOpen: () => void;
  onCopy: (e: GalleryEntry) => void;
  copiedId: string;
}

function Card({ entry, onOpen, onCopy, copiedId }: CardProps) {
  const ratio = entry.w && entry.h ? entry.h / entry.w : 1;
  return (
    <div className="mb-3 break-inside-avoid group relative overflow-hidden rounded-xl border border-white/10 bg-[#141414]">
      <button onClick={onOpen} className="block w-full text-left" aria-label={`Open ${entry.name}`}>
        <div style={{ paddingBottom: `${ratio * 100}%` }} className="relative w-full">
          <img
            src={`${IMG_BASE}${entry.img}`}
            alt={entry.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        {/* Hover gradient + meta */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-sm font-bold text-white leading-tight line-clamp-2 drop-shadow">{entry.name}</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-300 truncate">{entry.user}</span>
            {entry.model && <span className="text-[9px] font-mono uppercase tracking-wide text-[#ccff00] truncate">{entry.model}</span>}
          </div>
        </div>
      </button>

      {/* Quick copy button (top-right, appears on hover) */}
      <button
        onClick={() => onCopy(entry)}
        title="Copy prompt"
        className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 backdrop-blur text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all"
      >
        {copiedId === entry.id ? <Check className="w-4 h-4 text-[#ccff00]" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

// --- Main -------------------------------------------------------------------
export function AIArt({ onExit }: { onExit: () => void }) {
  const [query, setQuery] = useState('');
  const [model, setModel] = useState<string | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState('');
  const copyTimer = useRef<number | null>(null);

  const quickCopy = (e: GalleryEntry) => {
    navigator.clipboard?.writeText(e.prompt).then(() => {
      setCopiedId(e.id);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopiedId(''), 1500);
    });
  };
  useEffect(() => () => { if (copyTimer.current) window.clearTimeout(copyTimer.current); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GALLERY.filter((e) => {
      if (model && e.model !== model) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.prompt.toLowerCase().includes(q) ||
        e.user.toLowerCase().includes(q) ||
        e.model.toLowerCase().includes(q) ||
        e.themes.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, model]);

  const openEntry = openIdx != null ? filtered[openIdx] : null;
  const go = (delta: number) => {
    setOpenIdx((i) => {
      if (i == null || filtered.length === 0) return i;
      return (i + delta + filtered.length) % filtered.length;
    });
  };

  const shuffle = () => {
    if (filtered.length) setOpenIdx(Math.floor(Math.random() * filtered.length));
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-neutral-100 font-sans selection:bg-[#ccff00] selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              title="Back to projects"
              className="group inline-flex items-center justify-center w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black tracking-tighter uppercase italic text-white leading-none">AI Art</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mt-0.5 truncate">
                {GALLERY.length} prompts · tap the image, copy the prompt
              </p>
            </div>

            {/* Search */}
            <div className="ml-auto relative w-40 sm:w-72 shrink">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search prompts, creators…"
                className="w-full bg-neutral-900 border border-white/10 rounded-full pl-9 pr-8 py-2 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#ccff00]/60 transition-colors"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Model filter chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setModel(null)}
              className={`shrink-0 text-[11px] font-mono font-bold uppercase tracking-wide px-3 py-1 rounded-full border transition-colors ${
                model === null ? 'text-black border-transparent' : 'text-neutral-400 border-white/15 hover:text-white'
              }`}
              style={model === null ? { background: ACCENT } : undefined}
            >
              All
            </button>
            {MODELS.map((m) => (
              <button
                key={m}
                onClick={() => setModel((cur) => (cur === m ? null : m))}
                className={`shrink-0 text-[11px] font-mono font-bold uppercase tracking-wide px-3 py-1 rounded-full border transition-colors ${
                  model === m ? 'text-black border-transparent' : 'text-neutral-400 border-white/15 hover:text-white'
                }`}
                style={model === m ? { background: ACCENT } : undefined}
              >
                {m}
              </button>
            ))}
            <button
              onClick={shuffle}
              title="Surprise me"
              className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wide px-3 py-1 rounded-full border border-white/15 text-neutral-400 hover:text-white transition-colors ml-1"
            >
              <Shuffle className="w-3.5 h-3.5" /> Random
            </button>
          </div>
        </div>
      </header>

      {/* Masonry grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-neutral-500 font-mono uppercase tracking-widest text-sm">
            No artwork matches “{query}”.
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
            {filtered.map((entry: GalleryEntry, i: number) => (
              <Card
                key={entry.id}
                entry={entry}
                onOpen={() => setOpenIdx(i)}
                onCopy={quickCopy}
                copiedId={copiedId}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-10 text-[10px] font-mono uppercase tracking-widest text-neutral-700">
        Prompts credit their original creators · migrated from Notion
      </footer>

      {openEntry && (
        <Lightbox
          entry={openEntry}
          onClose={() => setOpenIdx(null)}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
          onTheme={(t) => { setQuery(t); setModel(null); setOpenIdx(null); }}
        />
      )}
    </div>
  );
}
