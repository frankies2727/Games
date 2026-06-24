import { GameDefinition } from '../types';

interface GalleryProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  games: GameDefinition<any>[];
  onSelect: (id: string) => void;
}

export function Gallery({ games, onSelect }: GalleryProps) {
  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#2D2D2D] font-sans selection:bg-[#EAEAEA] px-4 py-12 sm:py-20">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tighter uppercase italic text-[#1A1A1A]">
            Paper Games
          </h1>
          <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.3em] text-[#6B6B6B] mt-4">
            Chill pencil &amp; paper games · 2 players · pick one
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              className="group text-left bg-white border-2 border-[#1A1A1A] p-6 shadow-[6px_6px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-1 hover:translate-y-1 active:translate-x-1.5 active:translate-y-1.5 transition-all flex flex-col gap-4 min-h-[200px]"
            >
              <div
                className="w-14 h-14 flex items-center justify-center text-3xl border-2 border-[#1A1A1A]"
                style={{ background: `${game.accent}22` }}
              >
                {game.emoji}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold uppercase tracking-tight text-[#1A1A1A]">{game.name}</h2>
                <p className="text-sm text-[#6B6B6B] mt-2 leading-snug">{game.tagline}</p>
              </div>
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-widest"
                style={{ color: game.accent }}
              >
                Play →
              </span>
            </button>
          ))}
        </div>

        <footer className="text-center mt-16 text-[10px] font-mono uppercase tracking-widest text-[#B0B0B0]">
          Peer-to-peer · share a room code to play
        </footer>
      </div>
    </div>
  );
}
