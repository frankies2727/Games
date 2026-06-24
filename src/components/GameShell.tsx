import { ArrowLeft } from 'lucide-react';
import { GameDefinition } from '../types';
import { usePeerSession } from '../hooks/usePeerSession';
import { JoinGame } from './JoinGame';
import { Lobby } from './Lobby';
import { GameOver } from './GameOver';

interface GameShellProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def: GameDefinition<any>;
  onExit: () => void;
}

export function GameShell({ def, onExit }: GameShellProps) {
  const { state, myId, conn, error, join, start, move } = usePeerSession(def);
  const Board = def.Board;

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#2D2D2D] font-sans selection:bg-[#EAEAEA]">
      <div className="sticky top-0 z-30 bg-[#F4F1EA]/90 backdrop-blur border-b border-[#E0DCCF]">
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-widest text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Gallery
        </button>
      </div>

      {error && (
        <div className="fixed top-16 inset-x-0 flex justify-center z-50 px-4">
          <div className="bg-[#E63946] text-white px-6 py-3 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold uppercase tracking-widest text-sm text-center">
            {error}
          </div>
        </div>
      )}

      {conn === 'connecting' && !state ? (
        <div className="flex flex-col gap-6 min-h-[80vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1A1A1A]" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#6B6B6B]">Connecting to room…</p>
        </div>
      ) : !state ? (
        <JoinGame gameName={def.name} tagline={def.tagline} onJoin={join} />
      ) : state.status === 'waiting' ? (
        <Lobby gameName={def.name} state={state} myId={myId} onStart={start} />
      ) : state.status === 'playing' ? (
        <Board state={state} myId={myId} dispatch={move} />
      ) : (
        <GameOver def={def} state={state} myId={myId} onExit={onExit} />
      )}
    </div>
  );
}
