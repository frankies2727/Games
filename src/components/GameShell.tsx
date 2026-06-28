import { ReactNode, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { GameDefinition } from '../types';
import { usePeerSession } from '../hooks/usePeerSession';
import { useLocalSession } from '../hooks/useLocalSession';
import { JoinGame } from './JoinGame';
import { Lobby } from './Lobby';
import { GameOver } from './GameOver';

interface GameShellProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def: GameDefinition<any>;
  onExit: () => void;
}

// Shared page chrome: sticky back bar + transient error toast.
function Chrome({ onExit, error, children }: { onExit: () => void; error?: string; children: ReactNode }) {
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

      {children}
    </div>
  );
}

// Online (peer-to-peer) flow: join a room code, lobby, then play.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OnlineGame({ def, onExit, onPlayBot }: { def: GameDefinition<any>; onExit: () => void; onPlayBot: () => void }) {
  const { state, myId, conn, error, join, start, move } = usePeerSession(def);
  const Board = def.Board;

  return (
    <Chrome onExit={onExit} error={error}>
      {conn === 'connecting' && !state ? (
        <div className="flex flex-col gap-6 min-h-[80vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1A1A1A]" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#6B6B6B]">Connecting to room…</p>
        </div>
      ) : !state ? (
        <JoinGame gameName={def.name} tagline={def.tagline} onJoin={join} onPlayBot={def.botMove ? onPlayBot : undefined} />
      ) : state.status === 'waiting' ? (
        <Lobby gameName={def.name} state={state} myId={myId} onStart={start} />
      ) : state.status === 'playing' ? (
        <Board state={state} myId={myId} dispatch={move} />
      ) : (
        <GameOver def={def} state={state} myId={myId} onExit={onExit} />
      )}
    </Chrome>
  );
}

// Offline flow: auto-seat the human + a bot and start immediately.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BotGame({ def, onExit }: { def: GameDefinition<any>; onExit: () => void }) {
  const { state, myId, error, join, start, move } = useLocalSession(def);
  const Board = def.Board;

  useEffect(() => { join('SOLO', 'You'); }, [join]);
  useEffect(() => { if (state?.status === 'waiting') start(); }, [state?.status, start]);

  return (
    <Chrome onExit={onExit} error={error}>
      {!state || state.status === 'waiting' ? (
        <div className="flex flex-col gap-6 min-h-[80vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1A1A1A]" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#6B6B6B]">Dealing you in…</p>
        </div>
      ) : state.status === 'playing' ? (
        <Board state={state} myId={myId} dispatch={move} />
      ) : (
        <GameOver def={def} state={state} myId={myId} onExit={onExit} onPlayAgain={() => join('SOLO', 'You')} />
      )}
    </Chrome>
  );
}

export function GameShell({ def, onExit }: GameShellProps) {
  const [mode, setMode] = useState<'online' | 'bot'>('online');

  return mode === 'bot'
    ? <BotGame def={def} onExit={onExit} />
    : <OnlineGame def={def} onExit={onExit} onPlayBot={() => setMode('bot')} />;
}
