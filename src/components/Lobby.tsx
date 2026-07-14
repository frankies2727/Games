import { BaseState } from '../types';

interface LobbyProps {
  gameName: string;
  state: BaseState;
  onStart: () => void;
  myId: string;
  minPlayers?: number;
  maxPlayers?: number;
}

export function Lobby({ gameName, state, onStart, myId, minPlayers = 2, maxPlayers = 2 }: LobbyProps) {
  const players = Object.values(state.players);
  const canStart = players.length >= minPlayers && players.length <= maxPlayers;
  // Show a slot for each still-open seat, up to the max.
  const emptySlots = Math.max(0, maxPlayers - players.length);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 selection:bg-[#262B34]">
      <div className="max-w-md w-full bg-[#1A1D24] shadow-[8px_8px_0px_#454C5A] border-2 border-[#39414E] p-8">
        <h2 className="text-2xl font-bold text-center mb-2 text-[#F5F6F7] tracking-tighter uppercase italic">{gameName}</h2>
        <h3 className="text-center mb-8 text-[#F5F6F7] tracking-tighter uppercase italic border-b-2 border-[#39414E] pb-4">
          Room: <span className="text-[#E63946] font-mono not-italic font-black">{state.roomId}</span>
        </h3>

        <div className="space-y-4 mb-10">
          <p className="text-xs font-mono font-bold text-[#8A92A0] uppercase tracking-widest text-center">
            Players ({players.length}/{maxPlayers})
          </p>
          <ul className="space-y-4">
            {players.map((p) => (
              <li key={p.id} className="flex items-center space-x-4 p-4 bg-[#262B34] border-2 border-[#2E343F] shadow-[4px_4px_0px_#2E343F]">
                <div className="h-12 w-12 bg-[#262B34] text-white flex items-center justify-center font-bold text-xl font-mono border-2 border-[#39414E]">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-[#F5F6F7] text-xl uppercase tracking-wider">
                  {p.name} {p.id === myId && <span className="text-[10px] text-[#E63946] ml-2 tracking-widest font-mono align-middle">(YOU)</span>}
                </span>
              </li>
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <li key={`empty-${i}`} className="flex items-center space-x-4 p-4 bg-[#1A1D24] border-2 border-dashed border-[#2E343F]">
                <div className="h-12 w-12 border-2 border-dashed border-[#2E343F] bg-[#262B34]" />
                <span className="font-mono h-4 w-24 bg-[#262B34] animate-pulse" />
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onStart}
          disabled={!canStart}
          className="w-full py-4 bg-[#E63946] hover:bg-[#D90429] active:translate-y-1 active:shadow-none transition-all text-white font-bold border-2 border-[#39414E] shadow-[4px_4px_0px_#454C5A] hover:shadow-[2px_2px_0px_#454C5A] uppercase tracking-[0.2em] mt-4 disabled:opacity-50 disabled:active:translate-y-0 disabled:shadow-none disabled:border-[#2E343F] disabled:bg-[#2E343F] disabled:text-[#8A92A0]"
        >
          {canStart
            ? maxPlayers > minPlayers
              ? `START GAME (${players.length})`
              : 'START GAME'
            : `WAITING FOR PLAYERS… (${players.length}/${minPlayers})`}
        </button>
        {maxPlayers > 2 && (
          <p className="text-[10px] text-center text-[#8A92A0] font-mono leading-relaxed mt-4">
            Up to {maxPlayers} can join this room code. Start any time {minPlayers}+ are in.
          </p>
        )}
      </div>
    </div>
  );
}
