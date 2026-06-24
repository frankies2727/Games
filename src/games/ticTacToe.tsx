import { BaseState, BoardProps, GameAction, GameDefinition } from '../types';
import { cn } from '../lib/utils';

export interface TicTacToeState extends BaseState {
  board: (string | null)[]; // 9 cells, value = player id
  turnId: string | null;
  winningLine: number[] | null;
}

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

const winnerLine = (board: (string | null)[], pid: string): number[] | null =>
  LINES.find((line) => line.every((i) => board[i] === pid)) ?? null;

function createInitialState(roomId: string): TicTacToeState {
  return {
    roomId,
    status: 'waiting',
    players: {},
    winnerId: null,
    board: Array(9).fill(null),
    turnId: null,
    winningLine: null,
  };
}

function start(state: TicTacToeState): TicTacToeState {
  const ids = Object.keys(state.players);
  return { ...state, status: 'playing', board: Array(9).fill(null), turnId: ids[0], winningLine: null };
}

function reducer(state: TicTacToeState, pid: string, action: GameAction): TicTacToeState {
  if (state.status !== 'playing' || pid !== state.turnId) return state;
  const index = action.index as number;
  if (index < 0 || index >= 9 || state.board[index] !== null) return state;

  const board = state.board.slice();
  board[index] = pid;

  const line = winnerLine(board, pid);
  if (line) return { ...state, board, status: 'gameover', winnerId: pid, winningLine: line, turnId: null };
  if (board.every(Boolean)) return { ...state, board, status: 'gameover', winnerId: null, turnId: null };

  const ids = Object.keys(state.players);
  return { ...state, board, turnId: pid === ids[0] ? ids[1] : ids[0] };
}

function Board({ state, myId, dispatch }: BoardProps<TicTacToeState>) {
  const ids = Object.keys(state.players);
  const symbolOf = (pid: string | null) => (pid === ids[0] ? 'X' : pid === ids[1] ? 'O' : '');
  const mySymbol = symbolOf(myId);
  const myTurn = state.turnId === myId;
  const opponent = Object.values(state.players).find((p) => p.id !== myId);
  const winning = new Set(state.winningLine ?? []);

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 max-w-xl mx-auto w-full">
      <div className="w-full flex flex-col items-center mb-6 border-b-2 border-[#1A1A1A] pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#1A1A1A]">Tic-Tac-Toe</h1>
        <span className="text-xs font-mono uppercase tracking-widest text-[#6B6B6B]">Room ID: #{state.roomId}</span>
      </div>

      <div className={cn(
        "px-6 py-2 border-2 border-[#1A1A1A] font-bold text-sm sm:text-lg uppercase shadow-[4px_4px_0px_#1A1A1A] mb-8",
        myTurn ? "bg-[#E63946] text-white" : "bg-[#1A1A1A] text-white"
      )}>
        You are {mySymbol} · {myTurn ? 'Your turn' : `${opponent?.name ?? 'Opponent'}'s turn`}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[360px] aspect-square">
        {state.board.map((cell, i) => {
          const sym = symbolOf(cell);
          const canPlay = myTurn && cell === null;
          return (
            <button
              key={i}
              disabled={!canPlay}
              onClick={() => dispatch({ index: i })}
              className={cn(
                "aspect-square bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#D1D1D1] flex items-center justify-center text-5xl sm:text-6xl font-black transition-colors touch-manipulation",
                winning.has(i) && "bg-green-200",
                sym === 'X' ? "text-[#E63946]" : "text-[#1A1A1A]",
                canPlay && "hover:bg-[#F4F1EA] active:translate-y-0.5"
              )}
            >
              {sym}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const ticTacToe: GameDefinition<TicTacToeState> = {
  id: 'tic-tac-toe',
  name: 'Tic-Tac-Toe',
  tagline: 'The timeless 3-in-a-row duel.',
  accent: '#2A9D8F',
  emoji: '⭕',
  createInitialState,
  start,
  reducer,
  Board,
  gameOverMessage: (state, myId) =>
    !state.winnerId
      ? "It's a draw!"
      : state.winnerId === myId
        ? '🎉 You win!'
        : `${state.players[state.winnerId]?.name ?? 'Opponent'} wins!`,
};
