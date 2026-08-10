import { useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';

// Govbot Social — embeds the live "Social Media Posts Dashboard" that tracks
// every legislative bill update Govbot posts across Bluesky, X, Threads and
// Instagram. It's a separate GitHub Pages site (which allows framing), shown
// full-window here with a slim chrome bar so it lives inside the gallery; the
// "Open full site" button pops it out to its own tab for the complete view.

const DASHBOARD_URL = 'https://frankies2727.github.io/CHN-SocialMedia-Govbot-Main/';

export function GovbotDashboard({ onExit }: { onExit: () => void }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-neutral-100">
      {/* Chrome bar */}
      <header className="flex-none flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-white/10 bg-[#0a0a0a]">
        <button
          onClick={onExit}
          title="Back to projects"
          className="group inline-flex items-center justify-center w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-black tracking-tight uppercase italic text-white leading-none truncate">
            Govbot · Social Dashboard
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mt-0.5 truncate">
            Bill updates across Bluesky · X · Threads · Instagram
          </p>
        </div>
        <a
          href={DASHBOARD_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="ml-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wide text-black bg-[#ccff00] hover:brightness-95 transition"
        >
          <ExternalLink className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Open full site</span>
        </a>
      </header>

      {/* Embedded dashboard */}
      <div className="relative flex-1 min-h-0 bg-[#0a0a0a]">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-white/10 border-t-[#ccff00] rounded-full animate-spin" />
            <p className="text-neutral-400 font-mono text-xs uppercase tracking-widest animate-pulse">
              Loading dashboard…
            </p>
          </div>
        )}
        <iframe
          src={DASHBOARD_URL}
          title="Govbot Social Media Posts Dashboard"
          onLoad={() => setLoaded(true)}
          className="w-full h-full border-0"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
