import { Trophy } from 'lucide-react';
import { BaseState, GameDefinition } from '../types';

interface GameOverProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def: GameDefinition<any>;
  state: BaseState;
  myId: string;
  onExit: () => void;
  /** When provided (e.g. vs computer), offers an immediate rematch. */
  onPlayAgain?: () => void;
}

export function GameOver({ def, state, myId, onExit, onPlayAgain }: GameOverProps) {
  const message = def.gameOverMessage
    ? def.gameOverMessage(state, myId)
    : !state.winnerId
      ? "It's a draw!"
      : state.winnerId === myId
        ? '🎉 You win!'
        : `${state.players[state.winnerId]?.name ?? 'Opponent'} wins!`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-[#2D2D2D]">
      <div className="max-w-md w-full bg-white shadow-[8px_8px_0px_#1A1A1A] border-2 border-[#1A1A1A] p-10 text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-[#EAEAEA] p-6 border-2 border-[#1A1A1A] inline-flex items-center justify-center shadow-[4px_4px_0px_#D1D1D1]">
            <Trophy className="w-20 h-20 text-[#1A1A1A]" strokeWidth={2} />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-[#1A1A1A] tracking-tighter uppercase italic">GAME OVER</h1>
          <p className="text-base mt-4 text-[#6B6B6B] font-mono tracking-widest uppercase">{message}</p>
        </div>
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="w-full py-4 bg-[#E63946] hover:bg-[#D90429] active:translate-y-1 active:shadow-none transition-all text-white font-bold border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] uppercase tracking-[0.2em] mt-4"
          >
            ↻ Play Again
          </button>
        )}
        <button
          onClick={onExit}
          className="w-full py-4 bg-[#1A1A1A] hover:bg-[#2D2D2D] active:translate-y-1 active:shadow-none transition-all text-white font-bold border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#E63946] hover:shadow-[2px_2px_0px_#E63946] uppercase tracking-[0.2em] mt-4"
        >
          Back to Gallery
        </button>
      </div>
    </div>
  );
}
