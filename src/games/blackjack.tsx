import { BaseState, BoardProps, GameAction, GameDefinition } from '../types';
import { cn } from '../lib/utils';

// A neon, suit-less take on Blackjack: two players each build a hand against the
// magic number 21. Hit, Stand, or Double Down; closest to 21 without busting
// takes the round. Naturals and doubled wins are worth extra. First to the point
// target wins. Cards are plain ranks on vivid gradients — no hearts or spades.

const TARGET = 7; // points to win the match
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Card { id: string; rank: string }

// A vibrant gradient per rank family so the felt looks colourful, not stuffy.
const GRADIENT: Record<string, string> = {
  A: 'linear-gradient(145deg,#F72585,#7209B7)',
  J: 'linear-gradient(145deg,#FF9E00,#FF5400)',
  Q: 'linear-gradient(145deg,#FFBE0B,#FB5607)',
  K: 'linear-gradient(145deg,#FFD60A,#FF7B00)',
};
const NUM_GRADIENTS = [
  'linear-gradient(145deg,#4CC9F0,#4361EE)',
  'linear-gradient(145deg,#3A86FF,#4361EE)',
  'linear-gradient(145deg,#06D6A0,#118AB2)',
  'linear-gradient(145deg,#2EC4B6,#1B9AAA)',
  'linear-gradient(145deg,#8338EC,#3A0CA3)',
  'linear-gradient(145deg,#FF6392,#B5179E)',
];
const gradientFor = (rank: string) =>
  GRADIENT[rank] ?? NUM_GRADIENTS[(parseInt(rank, 10) || 0) % NUM_GRADIENTS.length];

const cardValue = (rank: string) => (rank === 'A' ? 11 : ['J', 'Q', 'K'].includes(rank) ? 10 : parseInt(rank, 10));

function handValue(cards: Card[]): number {
  let total = cards.reduce((s, c) => s + cardValue(c.rank), 0);
  let aces = cards.filter((c) => c.rank === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}
const isBlackjack = (cards: Card[]) => cards.length === 2 && handValue(cards) === 21;

function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (let copy = 0; copy < 4; copy++) for (const rank of RANKS) deck.push({ id: `${rank}-${copy}-${Math.random().toString(36).slice(2, 7)}`, rank });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export interface BlackjackState extends BaseState {
  deck: Card[];
  hands: Record<string, Card[]>;
  standing: Record<string, boolean>;
  doubled: Record<string, boolean>;
  turnId: string | null;
  phase: 'playing' | 'reveal';
  scores: Record<string, number>;
  round: number;
  roundResult: string | null;
  revealWinner: string | null; // pid, 'push', or null
}

function createInitialState(roomId: string): BlackjackState {
  return {
    roomId,
    status: 'waiting',
    players: {},
    winnerId: null,
    deck: [],
    hands: {},
    standing: {},
    doubled: {},
    turnId: null,
    phase: 'playing',
    scores: {},
    round: 0,
    roundResult: null,
    revealWinner: null,
  };
}

function dealRound(state: BlackjackState): BlackjackState {
  const ids = Object.keys(state.players);
  const deck = freshDeck();
  const hands: Record<string, Card[]> = {};
  const standing: Record<string, boolean> = {};
  const doubled: Record<string, boolean> = {};
  for (const id of ids) {
    hands[id] = [deck.pop()!, deck.pop()!];
    standing[id] = false;
    doubled[id] = false;
  }
  return {
    ...state,
    deck,
    hands,
    standing,
    doubled,
    turnId: ids[0],
    phase: 'playing',
    round: state.round + 1,
    roundResult: null,
    revealWinner: null,
  };
}

function start(state: BlackjackState): BlackjackState {
  const ids = Object.keys(state.players);
  const scores: Record<string, number> = {};
  for (const id of ids) scores[id] = 0;
  return dealRound({ ...state, status: 'playing', scores });
}

// Score the round once both players are done, and either end the match or park
// in the reveal phase until someone deals the next hand.
function resolve(state: BlackjackState): BlackjackState {
  const ids = Object.keys(state.players);
  const [a, b] = ids;
  const va = handValue(state.hands[a]);
  const vb = handValue(state.hands[b]);
  const bustA = va > 21;
  const bustB = vb > 21;

  let winner: string | null = null; // null = push
  if (bustA && bustB) winner = null;
  else if (bustA) winner = b;
  else if (bustB) winner = a;
  else if (va > vb) winner = a;
  else if (vb > va) winner = b;
  else winner = null;

  const scores = { ...state.scores };
  let result: string;
  if (!winner) {
    result = bustA && bustB ? 'Both bust — push!' : `Push at ${va} — no points`;
  } else {
    const gain = state.doubled[winner] ? 2 : isBlackjack(state.hands[winner]) ? 2 : 1;
    scores[winner] = (scores[winner] ?? 0) + gain;
    const why = state.doubled[winner] ? ' (doubled ×2)' : isBlackjack(state.hands[winner]) ? ' (blackjack ×2)' : '';
    const loser = winner === a ? b : a;
    result = (bustA || bustB)
      ? `${state.players[loser]?.name ?? '—'} busts — ${state.players[winner]?.name ?? '—'} wins +${gain}${why}`
      : `${state.players[winner]?.name ?? '—'} wins ${Math.max(va, vb)} vs ${Math.min(va, vb)} +${gain}${why}`;
  }

  if (winner && scores[winner] >= TARGET) {
    return { ...state, scores, phase: 'reveal', turnId: null, roundResult: result, revealWinner: winner, status: 'gameover', winnerId: winner };
  }
  return { ...state, scores, phase: 'reveal', turnId: null, roundResult: result, revealWinner: winner };
}

// Hand off to the other player if they still have decisions; otherwise resolve.
function advance(state: BlackjackState, me: string): BlackjackState {
  const ids = Object.keys(state.players);
  const other = ids[0] === me ? ids[1] : ids[0];
  if (!state.standing[other]) return { ...state, turnId: other };
  return resolve(state);
}

function reducer(state: BlackjackState, pid: string, action: GameAction): BlackjackState {
  if (state.status !== 'playing') return state;

  if (state.phase === 'reveal') {
    if (action.a === 'next') return dealRound(state);
    return state;
  }

  // playing
  if (pid !== state.turnId || state.standing[pid]) return state;

  if (action.a === 'hit') {
    const deck = state.deck.slice();
    const card = deck.pop();
    if (!card) return state;
    const hand = [...state.hands[pid], card];
    const hands = { ...state.hands, [pid]: hand };
    if (handValue(hand) > 21) {
      const standing = { ...state.standing, [pid]: true };
      return advance({ ...state, deck, hands, standing }, pid);
    }
    return { ...state, deck, hands }; // still my turn
  }

  if (action.a === 'stand') {
    return advance({ ...state, standing: { ...state.standing, [pid]: true } }, pid);
  }

  if (action.a === 'double') {
    if (state.hands[pid].length !== 2) return state;
    const deck = state.deck.slice();
    const card = deck.pop();
    if (!card) return state;
    const hands = { ...state.hands, [pid]: [...state.hands[pid], card] };
    const standing = { ...state.standing, [pid]: true };
    const doubled = { ...state.doubled, [pid]: true };
    return advance({ ...state, deck, hands, standing, doubled }, pid);
  }

  return state;
}

// Bot: dealer-style basic strategy — double a two-card 10/11, otherwise hit
// below 17 and stand at 17+. In reveal, deal the next hand.
function botMove(state: BlackjackState, botId: string): GameAction | null {
  if (state.status !== 'playing') return null;
  if (state.phase === 'reveal') return { a: 'next' };
  if (state.turnId !== botId || state.standing[botId]) return null;
  const hand = state.hands[botId] ?? [];
  const v = handValue(hand);
  if (hand.length === 2 && (v === 10 || v === 11)) return { a: 'double' };
  return v < 17 ? { a: 'hit' } : { a: 'stand' };
}

// Hide the opponent's second-and-later cards until the reveal — you only see
// their first card and a hidden count, like reading a dealer's up-card.
function redact(state: BlackjackState, viewerId: string): BlackjackState {
  if (state.phase !== 'playing') return state;
  const hands: Record<string, Card[]> = {};
  for (const [pid, cards] of Object.entries(state.hands)) {
    hands[pid] = pid === viewerId ? cards : cards.map((c, i) => (i === 0 ? c : { id: `hidden-${pid}-${i}`, rank: '?' }));
  }
  return { ...state, hands, deck: [] };
}

function PlayingCard({ rank, small }: { key?: string; rank: string; small?: boolean }) {
  const hidden = rank === '?';
  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-white/70 shadow-[0_6px_16px_rgba(0,0,0,0.45)] flex items-center justify-center font-black text-white shrink-0',
        small ? 'w-12 h-16 text-xl' : 'w-16 h-24 sm:w-20 sm:h-28 text-3xl sm:text-4xl',
      )}
      style={{ background: hidden ? 'linear-gradient(145deg,#3A3F4B,#20242C)' : gradientFor(rank) }}
    >
      {hidden ? <span className="opacity-70 text-2xl">✦</span> : rank}
    </div>
  );
}

function Hand({ cards, label, value, highlight }: { cards: Card[]; label: string; value?: number; highlight?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center gap-2 p-3 rounded-2xl border-2 w-full', highlight ? 'border-white bg-white/5' : 'border-[#39414E] bg-[#1A1D24]')}>
      <div className="flex items-center justify-between w-full px-1">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#9CA3AF]">{label}</span>
        {value != null && (
          <span className={cn('text-sm font-black font-mono px-2 py-0.5 rounded-lg', value > 21 ? 'bg-[#E63946] text-white' : 'bg-[#262B34] text-[#F5F6F7]')}>
            {value > 21 ? `BUST ${value}` : value}
          </span>
        )}
      </div>
      <div className="flex gap-2 flex-wrap justify-center min-h-[6rem] items-center">
        {cards.map((c) => <PlayingCard key={c.id} rank={c.rank} />)}
      </div>
    </div>
  );
}

function Board({ state, myId, dispatch }: BoardProps<BlackjackState>) {
  const me = state.players[myId];
  const opponent = Object.values(state.players).find((p) => p.id !== myId);
  const oppId = opponent?.id ?? '';
  const myHand = state.hands[myId] ?? [];
  const oppHand = state.hands[oppId] ?? [];
  const myVal = handValue(myHand);
  const myTurn = state.turnId === myId && state.phase === 'playing' && !state.standing[myId];
  const canDouble = myTurn && myHand.length === 2;
  const inReveal = state.phase === 'reveal';

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 max-w-xl mx-auto w-full">
      <div className="w-full flex flex-col items-center mb-4 border-b-2 border-[#39414E] pb-4">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#F72585,#4CC9F0)' }}>
          Blackjack 21
        </h1>
        <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">Round {state.round} · first to {TARGET} · Room #{state.roomId}</span>
      </div>

      {/* Chips / score */}
      <div className="flex items-stretch gap-4 w-full max-w-md mb-5">
        {[me, opponent].map((p, i) => p && (
          <div key={p.id} className={cn('flex-1 rounded-2xl border-2 p-3 text-center', state.turnId === p.id ? 'border-white' : 'border-[#39414E] bg-[#1A1D24]')} style={state.turnId === p.id ? { background: 'linear-gradient(145deg,#F72585,#7209B7)' } : undefined}>
            <div className="text-[10px] font-mono uppercase tracking-widest truncate text-white/90">{i === 0 ? 'You' : p.name}</div>
            <div className="text-3xl font-black font-mono text-white">{state.scores[p.id] ?? 0}<span className="text-sm text-white/50">/{TARGET}</span></div>
          </div>
        ))}
      </div>

      <div className="w-full space-y-4">
        <Hand cards={oppHand} label={`${opponent?.name ?? 'Opponent'}${inReveal ? '' : ' · hidden'}`} value={inReveal ? handValue(oppHand) : undefined} highlight={state.turnId === oppId} />
        <Hand cards={myHand} label="Your hand" value={myVal} highlight={myTurn} />
      </div>

      {/* Result banner */}
      {inReveal && (
        <div className="w-full mt-5 text-center text-sm font-mono font-bold uppercase tracking-wider px-4 py-3 rounded-2xl border-2 border-[#39414E] bg-[#1A1D24] text-[#F5F6F7]">
          {state.roundResult}
        </div>
      )}

      {/* Controls */}
      <div className="w-full mt-5 flex flex-col items-center gap-3">
        {myTurn ? (
          <div className="grid grid-cols-3 gap-3 w-full">
            <button onClick={() => dispatch({ a: 'hit' })} className="py-4 rounded-2xl font-black uppercase tracking-widest text-white active:translate-y-0.5 transition-all shadow-[0_5px_0_#118AB2]" style={{ background: 'linear-gradient(145deg,#06D6A0,#118AB2)' }}>Hit</button>
            <button onClick={() => dispatch({ a: 'stand' })} className="py-4 rounded-2xl font-black uppercase tracking-widest text-white active:translate-y-0.5 transition-all shadow-[0_5px_0_#B5179E]" style={{ background: 'linear-gradient(145deg,#F72585,#B5179E)' }}>Stand</button>
            <button onClick={() => canDouble && dispatch({ a: 'double' })} disabled={!canDouble} className="py-4 rounded-2xl font-black uppercase tracking-widest text-white active:translate-y-0.5 transition-all shadow-[0_5px_0_#FF5400] disabled:opacity-40 disabled:shadow-none" style={{ background: 'linear-gradient(145deg,#FF9E00,#FF5400)' }}>2×</button>
          </div>
        ) : inReveal ? (
          <button onClick={() => dispatch({ a: 'next' })} className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-white active:translate-y-0.5 transition-all shadow-[0_5px_0_#3A0CA3]" style={{ background: 'linear-gradient(145deg,#8338EC,#3A0CA3)' }}>
            ♻ Next Round
          </button>
        ) : (
          <p className="text-sm font-mono uppercase tracking-widest text-[#9CA3AF] animate-pulse">Waiting for {opponent?.name ?? 'opponent'}…</p>
        )}
        <p className="text-[10px] font-mono uppercase tracking-wider text-[#8A92A0] text-center">Aces count 11 or 1 · face cards are 10 · blackjack &amp; doubles score double</p>
      </div>
    </div>
  );
}

export const blackjack: GameDefinition<BlackjackState> = {
  id: 'blackjack',
  name: 'Blackjack 21',
  tagline: 'Neon, suit-free 21. Hit, stand, or double — closest to 21 takes the pot.',
  accent: '#F72585',
  emoji: '🃏',
  createInitialState,
  start,
  reducer,
  redact,
  botMove,
  Board,
  gameOverMessage: (state, myId) =>
    state.winnerId === myId
      ? `🎉 You hit ${TARGET} first — cash out!`
      : `${state.players[state.winnerId ?? '']?.name ?? 'Opponent'} cleaned up the table!`,
};
