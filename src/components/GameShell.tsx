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
    <div className="min-h-screen bg-[#0F1117] text-[#E2E4E8] font-sans selection:bg-[#262B34]">
      <div className="sticky top-0 z-30 bg-[#0F1117]/95 backdrop-blur border-b border-[#23272F]">
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-widest text-[#9CA3AF] hover:text-[#F5F6F7] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Gallery
        </button>
      </div>

      {error && (
        <div className="fixed top-16 inset-x-0 flex justify-center z-50 px-4">
          <div className="bg-[#E63946] text-white px-6 py-3 border-2 border-[#39414E] shadow-[4px_4px_0px_#454C5A] font-bold uppercase tracking-widest text-sm text-center">
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
  const { state, myId, conn, error, join, start, move, rematch } = usePeerSession(def);
  const Board = def.Board;

  return (
    <Chrome onExit={onExit} error={error}>
      {conn === 'connecting' && !state ? (
        <div className="flex flex-col gap-6 min-h-[80vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#39414E]" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">Connecting to room…</p>
        </div>
      ) : !state ? (
        <JoinGame gameName={def.name} tagline={def.tagline} onJoin={join} onPlayBot={def.botMove ? onPlayBot : undefined} />
      ) : state.status === 'waiting' ? (
        <Lobby gameName={def.name} state={state} myId={myId} onStart={start} />
      ) : (
        // Keep the final board rendered underneath so players can see exactly
        // how the game ended; the overlay sits on top and can be dismissed.
        <>
          <Board state={state} myId={myId} dispatch={move} />
          {state.status === 'gameover' && (
            <GameOver def={def} state={state} myId={myId} onExit={onExit} onPlayAgain={rematch} />
          )}
        </>
      )}
    </Chrome>
  );
}

// Offline flow: auto-seat the human + a bot and start immediately.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BotGame({ def, onExit }: { def: GameDefinition<any>; onExit: () => void }) {
  const { state, myId, error, join, start, move, rematch } = useLocalSession(def);
  const Board = def.Board;

  useEffect(() => { join('SOLO', 'You'); }, [join]);
  useEffect(() => { if (state?.status === 'waiting') start(); }, [state?.status, start]);

  return (
    <Chrome onExit={onExit} error={error}>
      {!state || state.status === 'waiting' ? (
        <div className="flex flex-col gap-6 min-h-[80vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#39414E]" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">Dealing you in…</p>
        </div>
      ) : (
        <>
          <Board state={state} myId={myId} dispatch={move} />
          {state.status === 'gameover' && (
            <GameOver def={def} state={state} myId={myId} onExit={onExit} onPlayAgain={rematch} />
          )}
        </>
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
