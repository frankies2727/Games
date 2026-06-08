import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, GameState, ServerToClientEvents } from './types';
import { JoinGame } from './components/JoinGame';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { Trophy } from 'lucide-react';

let socket: Socket<ServerToClientEvents, ClientToServerEvents>;

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myId, setMyId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Only connect once
    socket = io({ path: '/socket.io/' });

    socket.on('connect', () => {
      setMyId(socket.id!);
      setIsConnected(true);
    });

    socket.on('game_state_update', (state) => {
      setGameState(state);
    });

    socket.on('error', (msg) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 5000);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoin = (roomId: string, name: string) => {
    if (socket && isConnected) {
      socket.emit('join_room', roomId, name);
    }
  };

  const handleStart = () => {
    socket.emit('start_game');
  };

  const handleCircleDot = (index: number) => {
    socket.emit('circle_dot', index);
  };

  const handleNumberFound = (num: number) => {
    socket.emit('number_found', num);
  };

  if (!isConnected) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F1EA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1A1A1A]"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F4F1EA] text-[#2D2D2D] font-sans selection:bg-[#EAEAEA]">
        {errorMsg && (
          <div className="fixed top-4 inset-x-0 flex justify-center z-50">
            <div className="bg-[#E63946] text-white px-6 py-3 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold uppercase tracking-widest text-sm">
              {errorMsg}
            </div>
          </div>
        )}

        {!gameState && (
          <JoinGame onJoin={handleJoin} />
        )}

        {gameState && gameState.status === 'waiting' && (
          <Lobby 
            gameState={gameState} 
            onStart={handleStart} 
            myId={myId} 
          />
        )}

        {gameState && gameState.status === 'playing' && (
          <GameBoard 
            gameState={gameState} 
            myId={myId} 
            onCircleDot={handleCircleDot}
            onNumberFound={handleNumberFound}
          />
        )}

        {gameState && gameState.status === 'gameover' && (
          <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F1EA] p-4 text-[#2D2D2D]">
            <div className="max-w-md w-full bg-white shadow-[8px_8px_0px_#1A1A1A] border-2 border-[#1A1A1A] p-10 text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-[#EAEAEA] p-6 border-2 border-[#1A1A1A] inline-flex items-center justify-center shadow-[4px_4px_0px_#D1D1D1]">
                  <Trophy className="w-20 h-20 text-[#1A1A1A]" strokeWidth={2} />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-[#1A1A1A] tracking-tighter uppercase italic">GAME OVER</h1>
                <p className="text-xl mt-4 text-[#6B6B6B] font-mono tracking-widest uppercase text-sm">
                  {gameState.winnerId === myId 
                    ? '🎉 YOU DOT-BLASTED THEM!' 
                    : `😢 ${gameState.players[gameState.winnerId!].name} WON THE GAME!`}
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-[#1A1A1A] hover:bg-[#2D2D2D] active:translate-y-1 active:shadow-none transition-all text-white font-bold border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#E63946] hover:shadow-[2px_2px_0px_#E63946] uppercase tracking-[0.2em] mt-4"
              >
                React-ivate Game
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
