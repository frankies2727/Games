import { useState } from 'react';
import { GameDefinition } from '../types';
import { PikachuIcon } from './PikachuIcon';

// Swappable icon for the top-right "My Projects" portal button.
//
// Like the projects hero image, this points at a fixed, stable path — drop (or
// replace) a single file at `public/projects/icon.png` via GitHub → Add file →
// Upload files and it shows up here automatically, no code change needed. Swap
// it whenever you like. If the file isn't there, the button falls back to the
// built-in Pikachu icon, so nothing breaks when the slot is empty.
//
// A small square image with a transparent background looks best. Prefer another
// format? Change the extension on this one line (e.g. `icon.jpg` / `icon.webp`).
const PROJECTS_ICON = `${import.meta.env.BASE_URL}projects/icon.png`;

interface GalleryProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  games: GameDefinition<any>[];
  onSelect: (id: string) => void;
  onOpenProjects: () => void;
}

export function Gallery({ games, onSelect, onOpenProjects }: GalleryProps) {
  // Assume the custom icon is present; if it 404s we fall back to Pikachu.
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#E2E4E8] font-sans selection:bg-[#262B34] px-4 py-12 sm:py-20">
      {/* Mini Pikachu portal → Frankie's personal projects gallery. */}
      <button
        onClick={onOpenProjects}
        title="Peek at my projects"
        aria-label="Open Frankie's projects"
        className="group fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border-2 border-[#39414E] bg-[#1A1D24]/90 backdrop-blur-md pl-1.5 pr-1.5 sm:pr-3 py-1.5 shadow-[3px_3px_0px_#454C5A] hover:shadow-[1px_1px_0px_#454C5A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
      >
        <span className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 drop-shadow-[0_0_6px_rgba(247,208,44,0.5)] group-hover:animate-bounce">
          {iconFailed ? (
            <PikachuIcon className="w-full h-full" />
          ) : (
            <img
              src={PROJECTS_ICON}
              alt="My Projects"
              onError={() => setIconFailed(true)}
              className="w-full h-full object-contain rounded-full"
            />
          )}
        </span>
        <span className="hidden sm:inline text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5F6F7]">
          My Projects
        </span>
      </button>

      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tighter uppercase italic text-[#F5F6F7] flex items-center justify-center flex-wrap gap-x-3">
            <span className="not-italic">💕</span>
            <span>C&amp;F - Couple Games</span>
            <span className="not-italic">✏️</span>
          </h1>
          <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.3em] text-[#9CA3AF] mt-4">
            Chill pencil &amp; paper games · 2 players · pick one
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              className="group text-left bg-[#1A1D24] border-2 border-[#39414E] p-6 shadow-[6px_6px_0px_#454C5A] hover:shadow-[2px_2px_0px_#454C5A] hover:translate-x-1 hover:translate-y-1 active:translate-x-1.5 active:translate-y-1.5 transition-all flex flex-col gap-4 min-h-[200px]"
            >
              <div
                className="w-14 h-14 flex items-center justify-center text-3xl border-2 border-[#39414E]"
                style={{ background: `${game.accent}22` }}
              >
                {game.emoji}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold uppercase tracking-tight text-[#F5F6F7]">{game.name}</h2>
                <p className="text-sm text-[#9CA3AF] mt-2 leading-snug">{game.tagline}</p>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">
                Play →
              </span>
            </button>
          ))}
        </div>

        <footer className="text-center mt-16 text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
          Peer-to-peer · share a room code to play
        </footer>
      </div>
    </div>
  );
}
