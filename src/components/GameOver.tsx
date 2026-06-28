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
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-[#E2E4E8]">
      <div className="max-w-md w-full bg-[#1A1D24] shadow-[8px_8px_0px_#454C5A] border-2 border-[#39414E] p-10 text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-[#262B34] p-6 border-2 border-[#39414E] inline-flex items-center justify-center shadow-[4px_4px_0px_#2E343F]">
            <Trophy className="w-20 h-20 text-[#F5F6F7]" strokeWidth={2} />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-[#F5F6F7] tracking-tighter uppercase italic">GAME OVER</h1>
          <p className="text-base mt-4 text-[#9CA3AF] font-mono tracking-widest uppercase">{message}</p>
        </div>
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="w-full py-4 bg-[#E63946] hover:bg-[#D90429] active:translate-y-1 active:shadow-none transition-all text-white font-bold border-2 border-[#39414E] shadow-[4px_4px_0px_#454C5A] hover:shadow-[2px_2px_0px_#454C5A] uppercase tracking-[0.2em] mt-4"
          >
            ↻ Play Again
          </button>
        )}
        <button
          onClick={onExit}
          className="w-full py-4 bg-[#262B34] hover:bg-[#323A47] active:translate-y-1 active:shadow-none transition-all text-white font-bold border-2 border-[#39414E] shadow-[4px_4px_0px_#E63946] hover:shadow-[2px_2px_0px_#E63946] uppercase tracking-[0.2em] mt-4"
        >
          Back to Gallery
        </button>
      </div>
    </div>
  );
}
