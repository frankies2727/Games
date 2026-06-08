import { GameState } from '../types';
import { cn } from '../lib/utils';

interface GameBoardProps {
  gameState: GameState;
  myId: string;
  onCircleDot: (index: number) => void;
  onNumberFound: (num: number) => void;
}

export function GameBoard({ gameState, myId, onCircleDot, onNumberFound }: GameBoardProps) {
  const isMyTurnToFind = gameState.finderId === myId;
  const opponents = Object.values(gameState.players).filter(p => p.id !== myId);
  const opponent = opponents[0];

  const myDotsInfo = gameState.playerDots[myId] || Array(64).fill(false);
  const opponentDotsInfo = opponent ? (gameState.playerDots[opponent.id] || Array(64).fill(false)) : Array(64).fill(false);
  
  const myDotsCount = myDotsInfo.filter(Boolean).length;
  const opponentDotsCount = opponentDotsInfo.filter(Boolean).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F1EA] text-[#2D2D2D] font-sans selection:bg-[#EAEAEA] p-4 sm:p-8 max-w-6xl mx-auto w-full">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b-2 border-[#1A1A1A] pb-4 gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#1A1A1A]">Paper Numbers</h1>
          <span className="text-xs font-mono uppercase tracking-widest text-[#6B6B6B]">Room ID: #{gameState.roomId}</span>
        </div>
        <div className="flex items-center gap-6 sm:gap-12 w-full md:w-auto justify-between md:justify-end">
          <div className="text-center">
            <div className="text-[10px] sm:text-xs uppercase font-bold text-[#8B8B8B] mb-1 tracking-widest">Current Role</div>
            <div className={cn(
              "px-4 sm:px-6 py-2 border-2 border-[#1A1A1A] font-bold text-sm sm:text-lg uppercase shadow-[4px_4px_0px_#1A1A1A]",
              isMyTurnToFind ? "bg-[#E63946] text-white" : "bg-[#1A1A1A] text-white"
            )}>
              {isMyTurnToFind ? 'FINDER' : 'DOTTER'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] sm:text-xs uppercase font-bold text-[#8B8B8B] mb-1 tracking-widest">Target</div>
            <div className="text-4xl sm:text-5xl font-black text-[#E63946] font-mono leading-none">
              {gameState.targetNumber ?? '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-8">
        
        {/* My Sheet (8x8 Dots) */}
        <div className={cn(
          "col-span-1 lg:col-span-3 bg-white border border-[#D1D1D1] p-4 shadow-[4px_4px_0px_#1A1A1A] flex flex-col transition-opacity duration-300 min-h-[400px]",
          isMyTurnToFind && "opacity-60 grayscale pointer-events-none"
        )}>
          <div className="flex justify-between items-end mb-6">
            <h2 className="font-bold text-sm underline underline-offset-4 uppercase">YOUR SHEET</h2>
            <span className="font-mono text-xs text-[#E63946] font-bold tracking-widest">{myDotsCount}/64</span>
          </div>
          <div className="grid grid-cols-8 gap-2 flex-1 items-center max-w-[280px] mx-auto w-full">
            {myDotsInfo.map((circled, i) => (
              <button
                key={i}
                disabled={isMyTurnToFind || circled}
                onClick={() => onCircleDot(i)}
                className={cn(
                  "aspect-square rounded-full border-2 flex items-center justify-center transition-all outline-none",
                  circled 
                    ? "border-blue-600 bg-blue-100" 
                    : "border-[#D1D1D1] bg-[#EAEAEA] hover:border-blue-400 active:scale-95",
                  !isMyTurnToFind && !circled && "animate-pulse"
                )}
              >
                {circled && <div className="w-1 h-1 sm:w-2 sm:h-2 bg-blue-600 rounded-full" />}
              </button>
            ))}
          </div>
          <div className="mt-6">
            <div className="h-1 bg-[#EAEAEA] w-full">
              <div className="h-1 bg-blue-600 transition-all duration-300" style={{ width: `${(myDotsCount/64)*100}%` }}></div>
            </div>
            <p className="text-[10px] mt-2 text-[#8B8B8B] italic uppercase tracking-wider font-bold">
              Status: {isMyTurnToFind ? 'Finding Number...' : 'Circling Dots...'}
            </p>
          </div>
        </div>

        {/* Master Sheet (10x10) */}
        <div className={cn(
          "col-span-1 lg:col-span-6 flex flex-col h-full min-h-[400px] transition-opacity duration-300",
          !isMyTurnToFind && "opacity-60 pointer-events-none"
        )}>
          <div className="bg-white border-2 border-[#1A1A1A] p-2 flex-1 shadow-[8px_8px_0px_#D1D1D1] overflow-hidden">
            <div className="grid grid-cols-10 h-full border border-[#D1D1D1]">
              {gameState.masterSheet.map((num, i) => {
                return (
                  <button
                    key={i}
                    disabled={!isMyTurnToFind}
                    onClick={() => onNumberFound(num)}
                    className={cn(
                      "aspect-square border-[0.5px] border-[#EEEEEE] flex items-center justify-center font-mono text-sm sm:text-base lg:text-lg outline-none transition-colors text-[#444] bg-white",
                      isMyTurnToFind ? "hover:bg-[#F4F1EA] active:bg-[#D1D1D1]" : "hover:bg-white"
                    )}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <p className="text-[10px] sm:text-xs font-bold text-[#6B6B6B] border-l-2 border-[#E63946] pl-3 uppercase tracking-widest">
              Scan the grid quickly. Tap to claim target.
            </p>
          </div>
        </div>

        {/* Opponent Sheet (miniature/reference) */}
        <div className="col-span-1 lg:col-span-3 bg-white border border-[#D1D1D1] p-4 shadow-[4px_4px_0px_#1A1A1A] flex flex-col grayscale opacity-60 pointer-events-none min-h-[400px]">
          <div className="flex justify-between items-end mb-6">
            <h2 className="font-bold text-sm underline underline-offset-4 uppercase">{opponent?.name || 'OPPONENT'}</h2>
            <span className="font-mono text-xs text-[#E63946] font-bold tracking-widest">{opponentDotsCount}/64</span>
          </div>
          <div className="grid grid-cols-8 gap-2 flex-1 items-center max-w-[280px] mx-auto w-full">
            {opponentDotsInfo.map((circled, i) => (
               <div
                 key={i}
                 className={cn(
                   "aspect-square rounded-full border-2 flex items-center justify-center",
                   circled 
                     ? "border-red-600 bg-red-100" 
                     : "border-[#D1D1D1] bg-[#EAEAEA]"
                 )}
               >
                 {circled && <div className="w-1 h-1 sm:w-2 sm:h-2 bg-red-600 rounded-full" />}
               </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="h-1 bg-[#EAEAEA] w-full">
               <div className="h-1 bg-red-600" style={{ width: `${(opponentDotsCount/64)*100}%` }}></div>
            </div>
            <p className="text-[10px] mt-2 text-[#8B8B8B] italic uppercase tracking-wider font-bold">
               Status: {!isMyTurnToFind ? 'Finding Number...' : 'Circling Dots...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
