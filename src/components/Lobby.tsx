import { GameState } from '../types';

interface LobbyProps {
  gameState: GameState;
  onStart: () => void;
  myId: string;
}

export function Lobby({ gameState, onStart, myId }: LobbyProps) {
  const players = Object.values(gameState.players);
  const isFull = players.length === 2;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F1EA] p-4 text-[#2D2D2D] font-sans selection:bg-[#EAEAEA]">
      <div className="max-w-md w-full bg-white shadow-[8px_8px_0px_#1A1A1A] border-2 border-[#1A1A1A] p-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-[#1A1A1A] tracking-tighter uppercase italic border-b-2 border-[#1A1A1A] pb-4">
          Room: <span className="text-[#E63946] font-mono not-italic font-black">{gameState.roomId}</span>
        </h2>
        
        <div className="space-y-4 mb-10">
          <p className="text-xs font-mono font-bold text-[#8B8B8B] uppercase tracking-widest text-center">Players ({players.length}/2)</p>
          <ul className="space-y-4">
            {players.map((p) => (
              <li key={p.id} className="flex items-center space-x-4 p-4 bg-[#F4F1EA] border-2 border-[#D1D1D1] shadow-[4px_4px_0px_#D1D1D1]">
                <div className="h-12 w-12 bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-xl font-mono border-2 border-[#1A1A1A]">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-[#1A1A1A] text-xl uppercase tracking-wider">
                  {p.name} {p.id === myId && <span className="text-[10px] text-[#E63946] ml-2 tracking-widest font-mono align-middle">(YOU)</span>}
                </span>
              </li>
            ))}
            {players.length < 2 && (
              <li className="flex items-center space-x-4 p-4 bg-white border-2 border-dashed border-[#D1D1D1]">
                <div className="h-12 w-12 border-2 border-dashed border-[#D1D1D1] bg-[#F4F1EA]" />
                <span className="font-mono h-4 w-24 bg-[#EAEAEA] animate-pulse" />
              </li>
            )}
          </ul>
        </div>
        
        <button 
          onClick={onStart}
          disabled={!isFull}
          className="w-full py-4 bg-[#E63946] hover:bg-[#D90429] active:translate-y-1 active:shadow-none transition-all text-white font-bold border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] uppercase tracking-[0.2em] mt-4 disabled:opacity-50 disabled:active:translate-y-0 disabled:shadow-none disabled:border-[#D1D1D1] disabled:bg-[#D1D1D1] disabled:text-[#8B8B8B]"
        >
          {isFull ? 'START GAME' : 'WAITING...'}
        </button>
      </div>
    </div>
  );
}
