import { BaseState, BoardProps, GameAction, GameDefinition } from '../types';
import { cn } from '../lib/utils';

const CARD_MIN = 1;
const CARD_MAX = 12;
const TARGET_SCORE = 6;

const draw = () => CARD_MIN + Math.floor(Math.random() * (CARD_MAX - CARD_MIN + 1));

type Guess = 'higher' | 'lower';
type Outcome = 'correct' | 'wrong' | 'push';

export interface HighLowState extends BaseState {
  currentCard: number;
  scores: Record<string, number>;
  turnId: string | null;
  lastResult: { by: string; guess: Guess; prev: number; drawn: number; outcome: Outcome } | null;
}

function createInitialState(roomId: string): HighLowState {
  return {
    roomId,
    status: 'waiting',
    players: {},
    winnerId: null,
    currentCard: draw(),
    scores: {},
    turnId: null,
    lastResult: null,
  };
}

function start(state: HighLowState): HighLowState {
  const ids = Object.keys(state.players);
  const scores: Record<string, number> = {};
  for (const id of ids) scores[id] = 0;
  return { ...state, status: 'playing', scores, turnId: ids[0], currentCard: draw(), lastResult: null };
}

function reducer(state: HighLowState, pid: string, action: GameAction): HighLowState {
  if (state.status !== 'playing' || pid !== state.turnId) return state;
  const guess = action.guess as Guess;
  if (guess !== 'higher' && guess !== 'lower') return state;

  const prev = state.currentCard;
  const drawn = draw();
  const outcome: Outcome = drawn === prev ? 'push' : (drawn > prev ? 'higher' : 'lower') === guess ? 'correct' : 'wrong';

  const scores = { ...state.scores };
  if (outcome === 'correct') scores[pid] = (scores[pid] ?? 0) + 1;

  const ids = Object.keys(state.players);
  const won = scores[pid] >= TARGET_SCORE;
  const lastResult = { by: pid, guess, prev, drawn, outcome };

  if (won) {
    return { ...state, currentCard: drawn, scores, lastResult, status: 'gameover', winnerId: pid, turnId: null };
  }
  return { ...state, currentCard: drawn, scores, lastResult, turnId: pid === ids[0] ? ids[1] : ids[0] };
}

function Card({ value, small }: { value: number; small?: boolean }) {
  return (
    <div className={cn(
      "bg-white border-2 border-[#1A1A1A] flex items-center justify-center font-black font-mono text-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]",
      small ? "w-14 h-20 text-3xl" : "w-28 h-40 sm:w-32 sm:h-44 text-6xl sm:text-7xl"
    )}>
      {value}
    </div>
  );
}

function Board({ state, myId, dispatch }: BoardProps<HighLowState>) {
  const myTurn = state.turnId === myId;
  const me = Object.values(state.players).find((p) => p.id === myId);
  const opponent = Object.values(state.players).find((p) => p.id !== myId);
  const r = state.lastResult;

  const resultText = r
    ? `${state.players[r.by]?.name ?? '—'} guessed ${r.guess.toUpperCase()} · drew ${r.drawn} · ` +
      (r.outcome === 'correct' ? '✓ point!' : r.outcome === 'push' ? '= push (tie)' : '✗ miss')
    : 'Guess if the next card is higher or lower.';

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 max-w-xl mx-auto w-full">
      <div className="w-full flex flex-col items-center mb-6 border-b-2 border-[#1A1A1A] pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#1A1A1A]">High-Low</h1>
        <span className="text-xs font-mono uppercase tracking-widest text-[#6B6B6B]">Room ID: #{state.roomId}</span>
      </div>

      {/* Scoreboard */}
      <div className="flex items-stretch gap-4 w-full max-w-md mb-8">
        {[me, opponent].map((p, i) => p && (
          <div key={p.id} className={cn(
            "flex-1 border-2 border-[#1A1A1A] p-3 text-center",
            state.turnId === p.id ? "bg-[#E63946] text-white" : "bg-white text-[#1A1A1A]"
          )}>
            <div className="text-[10px] font-mono uppercase tracking-widest truncate">{i === 0 ? 'You' : p.name}</div>
            <div className="text-3xl font-black font-mono">{state.scores[p.id] ?? 0}<span className="text-sm text-[#8B8B8B]">/{TARGET_SCORE}</span></div>
          </div>
        ))}
      </div>

      {/* Current card */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B8B8B]">Current card</span>
        <Card value={state.currentCard} />
      </div>

      {/* Result banner */}
      <div className={cn(
        "w-full max-w-md text-center text-xs font-mono font-bold uppercase tracking-wider px-4 py-3 border-2 border-[#1A1A1A] mb-8",
        r?.outcome === 'correct' ? "bg-green-200 text-green-900" :
        r?.outcome === 'wrong' ? "bg-red-200 text-red-900" :
        r?.outcome === 'push' ? "bg-yellow-100 text-yellow-900" : "bg-white text-[#6B6B6B]"
      )}>
        {resultText}
      </div>

      {/* Guess buttons */}
      <div className="flex gap-4 w-full max-w-md">
        <button
          disabled={!myTurn}
          onClick={() => dispatch({ guess: 'higher' })}
          className="flex-1 py-5 bg-[#1A1A1A] text-white font-bold uppercase tracking-[0.2em] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#E63946] hover:shadow-[2px_2px_0px_#E63946] active:translate-y-1 active:shadow-none transition-all disabled:opacity-40 disabled:bg-[#D1D1D1] disabled:border-[#D1D1D1] disabled:shadow-none"
        >
          ▲ Higher
        </button>
        <button
          disabled={!myTurn}
          onClick={() => dispatch({ guess: 'lower' })}
          className="flex-1 py-5 bg-[#1A1A1A] text-white font-bold uppercase tracking-[0.2em] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#E63946] hover:shadow-[2px_2px_0px_#E63946] active:translate-y-1 active:shadow-none transition-all disabled:opacity-40 disabled:bg-[#D1D1D1] disabled:border-[#D1D1D1] disabled:shadow-none"
        >
          ▼ Lower
        </button>
      </div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8B8B8B] mt-4">
        {myTurn ? 'Your turn' : `Waiting for ${opponent?.name ?? 'opponent'}…`} · cards run {CARD_MIN}–{CARD_MAX}
      </p>
    </div>
  );
}

export const highLow: GameDefinition<HighLowState> = {
  id: 'high-low',
  name: 'High-Low',
  tagline: 'Call the next card higher or lower. First to 6 points.',
  accent: '#9D4EDD',
  emoji: '🃏',
  createInitialState,
  start,
  reducer,
  Board,
  gameOverMessage: (state, myId) =>
    state.winnerId === myId
      ? `🎉 You hit ${TARGET_SCORE} first!`
      : `${state.players[state.winnerId ?? '']?.name ?? 'Opponent'} reached ${TARGET_SCORE} first!`,
};
