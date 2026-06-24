import { useState } from 'react';

interface JoinGameProps {
  gameName: string;
  tagline?: string;
  onJoin: (roomId: string, name: string) => void;
}

export function JoinGame({ gameName, tagline, onJoin }: JoinGameProps) {
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 selection:bg-[#EAEAEA]">
      <div className="max-w-md w-full bg-white shadow-[8px_8px_0px_#1A1A1A] border-2 border-[#1A1A1A] p-8 space-y-8">
        <div className="text-center space-y-2 border-b-2 border-[#1A1A1A] pb-6">
          <h1 className="text-4xl font-bold tracking-tighter uppercase italic text-[#1A1A1A]">{gameName}</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-[#6B6B6B]">
            {tagline ?? 'Share a room code with a friend to play'}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#8B8B8B] mb-2 tracking-widest">Room Code</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="e.g. ROOM123"
              className="w-full px-4 py-3 border-2 border-[#D1D1D1] focus:border-[#1A1A1A] focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_#1A1A1A] font-mono text-lg uppercase transition-all bg-[#F4F1EA] text-[#1A1A1A] font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#8B8B8B] mb-2 tracking-widest">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Taylor"
              className="w-full px-4 py-3 border-2 border-[#D1D1D1] focus:border-[#1A1A1A] focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_#1A1A1A] font-mono text-lg transition-all bg-[#F4F1EA] text-[#1A1A1A] font-bold"
            />
          </div>
          <button
            onClick={() => roomId && name && onJoin(roomId, name)}
            disabled={!roomId || !name}
            className="w-full py-4 px-6 bg-[#1A1A1A] hover:bg-[#2D2D2D] active:translate-y-1 active:shadow-none transition-all text-white font-bold border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#E63946] hover:shadow-[2px_2px_0px_#E63946] uppercase tracking-[0.2em] mt-4 disabled:opacity-50 disabled:active:translate-y-0 disabled:shadow-[4px_4px_0px_#D1D1D1] disabled:hover:shadow-[4px_4px_0px_#D1D1D1] disabled:border-[#D1D1D1] disabled:bg-[#D1D1D1] disabled:text-[#8B8B8B]"
          >
            Join Game
          </button>
          <p className="text-[10px] text-center text-[#8B8B8B] font-mono leading-relaxed">
            First to a code hosts the room. Share the same code with one friend to join them.
          </p>
        </div>
      </div>
    </div>
  );
}
