import { BaseState, BoardProps, GameAction, GameDefinition } from '../types';
import { cn } from '../lib/utils';

// A pared-down take on the classic board game "Sorry!". Each player has 4 pawns
// that start in their pen. On your turn you draw a card and move one pawn the
// card's value around a shared loop and into your private home lane. Land on an
// opponent's pawn to bump it back to its pen. A "Sorry!" card pulls one of your
// penned pawns straight onto an opponent — sending them home. First to get all
// four pawns Home wins.
//
// Pawn position `t` is stored relative to the player's own entry point:
//   t = -1              -> in the Start pen (off the shared loop)
//   0 .. TRACK-1        -> on the shared loop; board space = (entry + t) % TRACK
//   TRACK .. FINISH-1   -> in the private home lane (not shared, can't be bumped)
//   t = FINISH          -> Home (finished)
const TRACK = 44; // spaces on the shared loop (multiple of 4)
const HOME_LEN = 5; // home-lane slots including Home itself
const FINISH = TRACK + HOME_LEN - 1; // 48

// Deck weighted toward low cards so pawns can actually leave the pen (only a 1
// or 2 gets a pawn out). 'sorry' is the wildcard.
type Card = number | 'sorry';
const DECK: Card[] = [1, 1, 2, 2, 3, 4, 5, 7, 8, 10, 11, 12, 'sorry'];
const drawCard = (): Card => DECK[Math.floor(Math.random() * DECK.length)];

const COLORS = ['#E63946', '#457B9D'];

export interface SorryState extends BaseState {
  pawns: Record<string, number[]>; // playerId -> 4 pawn positions (t values)
  turnId: string | null;
  card: Card | null; // the card in hand this turn (null = need to draw)
  mustDraw: boolean; // true = draw next; false = a card is drawn, pick a pawn
  lastEvent: string | null;
}

const entryOf = (ids: string[], pid: string) => (pid === ids[0] ? 0 : TRACK / 2);
const absOf = (entry: number, t: number) => (entry + t) % TRACK; // only for loop t

function createInitialState(roomId: string): SorryState {
  return {
    roomId,
    status: 'waiting',
    players: {},
    winnerId: null,
    pawns: {},
    turnId: null,
    card: null,
    mustDraw: true,
    lastEvent: null,
  };
}

function start(state: SorryState): SorryState {
  const ids = Object.keys(state.players);
  const pawns: Record<string, number[]> = {};
  for (const id of ids) pawns[id] = [-1, -1, -1, -1];
  return { ...state, status: 'playing', pawns, turnId: ids[0], card: null, mustDraw: true, lastEvent: null };
}

// Where a pawn would end up if `card` were applied to it, plus any bump it would
// cause — or null if the move is illegal.
interface Landing { to: number; bump: { player: string; pawn: number } | null }

function landing(state: SorryState, pid: string, pawnIdx: number, card: Card): Landing | null {
  const ids = Object.keys(state.players);
  const oppId = pid === ids[0] ? ids[1] : ids[0];
  if (!oppId) return null;
  const entry = entryOf(ids, pid);
  const oppEntry = entryOf(ids, oppId);
  const t = state.pawns[pid][pawnIdx];

  // A positional key so we can detect two pawns sharing a space. Loop spaces are
  // shared; home-lane spaces are private to a player.
  const keyAt = (owner: string, tt: number): string =>
    tt < 0 ? `S${owner}` : tt < TRACK ? `L${absOf(entryOf(ids, owner), tt)}` : `H${owner}-${tt}`;

  let to: number;
  if (card === 'sorry') {
    if (t !== -1) return null; // only pulls a penned pawn
    const targets = state.pawns[oppId]
      .map((tt, i) => ({ tt, i }))
      .filter((x) => x.tt >= 0 && x.tt < TRACK); // opponent pawns out on the loop
    if (!targets.length) return null;
    const target = targets.reduce((a, b) => (b.tt > a.tt ? b : a)); // most advanced
    const absT = absOf(oppEntry, target.tt);
    to = (absT - entry + TRACK) % TRACK;
    return { to, bump: { player: oppId, pawn: target.i } };
  }

  const v = card;
  if (t === -1) {
    if (v !== 1 && v !== 2) return null; // need a 1 or 2 to leave the pen
    to = 0;
  } else {
    if (t >= FINISH) return null; // already Home
    to = t + v;
    if (to > FINISH) return null; // can't overshoot Home
  }

  const destKey = keyAt(pid, to);
  // Can't land on your own pawn (Home can stack several finished pawns).
  if (to !== FINISH) {
    for (let j = 0; j < state.pawns[pid].length; j++) {
      if (j === pawnIdx) continue;
      const tj = state.pawns[pid][j];
      if (tj >= 0 && keyAt(pid, tj) === destKey) return null;
    }
  }

  // Bump an opponent sharing the destination loop space.
  let bump: Landing['bump'] = null;
  if (to < TRACK) {
    for (let j = 0; j < state.pawns[oppId].length; j++) {
      const tj = state.pawns[oppId][j];
      if (tj >= 0 && tj < TRACK && absOf(oppEntry, tj) === absOf(entry, to)) {
        bump = { player: oppId, pawn: j };
      }
    }
  }
  return { to, bump };
}

const legalPawns = (state: SorryState, pid: string, card: Card): number[] =>
  state.pawns[pid].map((_, i) => i).filter((i) => landing(state, pid, i, card) != null);

const cardLabel = (c: Card) => (c === 'sorry' ? 'SORRY!' : String(c));

function reducer(state: SorryState, pid: string, action: GameAction): SorryState {
  if (state.status !== 'playing' || pid !== state.turnId) return state;
  const ids = Object.keys(state.players);
  const oppId = pid === ids[0] ? ids[1] : ids[0];

  // Draw a card. If it can't be played, the turn passes automatically.
  if (action.a === 'draw') {
    if (!state.mustDraw) return state;
    const card = drawCard();
    const canPlay = legalPawns(state, pid, card).length > 0;
    if (!canPlay) {
      return {
        ...state,
        card: null,
        mustDraw: true,
        turnId: oppId,
        lastEvent: `${state.players[pid]?.name ?? '—'} drew ${cardLabel(card)} — no moves, turn passes`,
      };
    }
    return { ...state, card, mustDraw: false, lastEvent: `${state.players[pid]?.name ?? '—'} drew ${cardLabel(card)}` };
  }

  // Apply the drawn card to a chosen pawn.
  if (action.a === 'move') {
    if (state.mustDraw || state.card == null) return state;
    const pawnIdx = action.pawn as number;
    const res = landing(state, pid, pawnIdx, state.card);
    if (!res) return state;

    const pawns: Record<string, number[]> = {};
    for (const id of ids) pawns[id] = state.pawns[id].slice();
    let event = `${state.players[pid]?.name ?? '—'} played ${cardLabel(state.card)}`;
    if (res.bump) {
      pawns[res.bump.player][res.bump.pawn] = -1;
      event += ` · bumped ${state.players[res.bump.player]?.name ?? 'a pawn'} home!`;
    }
    pawns[pid][pawnIdx] = res.to;

    const won = pawns[pid].every((t) => t === FINISH);
    if (won) return { ...state, pawns, status: 'gameover', winnerId: pid, turnId: null, card: null, mustDraw: true, lastEvent: `${state.players[pid]?.name ?? '—'} got everyone Home!` };

    return { ...state, pawns, card: null, mustDraw: true, turnId: oppId, lastEvent: event };
  }

  // Explicit pass (fallback; draw already auto-passes when stuck).
  if (action.a === 'pass') {
    if (state.mustDraw) return state;
    return { ...state, card: null, mustDraw: true, turnId: oppId };
  }

  return state;
}

// Bot: draw when it must, otherwise pick the highest-value move — bumping and
// finishing pawns first, then getting pawns out of the pen, then progress.
function botMove(state: SorryState, botId: string): GameAction | null {
  if (state.status !== 'playing' || state.turnId !== botId) return null;
  if (state.mustDraw) return { a: 'draw' };
  if (state.card == null) return null;
  const options = state.pawns[botId]
    .map((t, i) => ({ i, t, res: landing(state, botId, i, state.card!) }))
    .filter((o) => o.res) as { i: number; t: number; res: Landing }[];
  if (!options.length) return { a: 'pass' };

  const score = (o: { t: number; res: Landing }): number => {
    let s = 0;
    if (o.res.bump) s += 100;
    if (o.res.to === FINISH) s += 60;
    if (o.t === -1) s += 25; // develop a penned pawn
    s += o.res.to; // general progress
    return s;
  };
  const best = options.reduce((a, b) => (score(b) > score(a) ? b : a));
  return { a: 'move', pawn: best.i };
}

// ---- Rendering ----
// Clockwise ring coordinates on a 12×12 grid, starting at the top-left corner.
function ringCoords(): [number, number][] {
  const N = 12;
  const out: [number, number][] = [];
  for (let c = 0; c < N; c++) out.push([0, c]);
  for (let r = 1; r < N; r++) out.push([r, N - 1]);
  for (let c = N - 2; c >= 0; c--) out.push([N - 1, c]);
  for (let r = N - 2; r >= 1; r--) out.push([r, 0]);
  return out; // 12 + 11 + 11 + 10 = 44
}
const RING = ringCoords();

function locationLabel(t: number): string {
  if (t === -1) return 'Pen';
  if (t < TRACK) return `Space ${t}`;
  if (t < FINISH) return 'Home lane';
  return 'Home ✓';
}

function PawnChips({ pawns, color, movable, onMove }: {
  pawns: number[]; color: string; movable: number[]; onMove?: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {pawns.map((t, i) => {
        const canMove = movable.includes(i);
        const done = t === FINISH;
        return (
          <button
            key={i}
            disabled={!canMove}
            onClick={() => canMove && onMove?.(i)}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 border-2 text-[10px] font-mono uppercase tracking-wider transition-all',
              canMove
                ? 'border-white bg-white/10 text-white cursor-pointer animate-pulse'
                : 'border-[#39414E] text-[#9CA3AF]',
            )}
          >
            <span
              className="w-3 h-3 rounded-full border border-black/30 shrink-0"
              style={{ background: done ? '#FFC300' : t === -1 ? '#5b6770' : color }}
            />
            {locationLabel(t)}
          </button>
        );
      })}
    </div>
  );
}

function Board({ state, myId, dispatch }: BoardProps<SorryState>) {
  const ids = Object.keys(state.players);
  const me = Object.values(state.players).find((p) => p.id === myId);
  const opponent = Object.values(state.players).find((p) => p.id !== myId);
  const myTurn = state.turnId === myId;
  const colorOf = (pid: string) => COLORS[ids.indexOf(pid)] ?? '#9CA3AF';

  // Which board loop space holds which pawn (for the ring dots).
  const occupancy: Record<number, string> = {}; // absSpace -> playerId
  for (const pid of ids) {
    const entry = entryOf(ids, pid);
    state.pawns[pid]?.forEach((t) => {
      if (t >= 0 && t < TRACK) occupancy[absOf(entry, t)] = pid;
    });
  }
  const entrySpaces: Record<number, string> = {};
  for (const pid of ids) entrySpaces[entryOf(ids, pid)] = pid;

  const movable = myTurn && !state.mustDraw && state.card != null ? legalPawns(state, myId, state.card) : [];

  const cells = RING.map(([r, c], i) => {
    const owner = occupancy[i];
    const isEntry = entrySpaces[i] != null;
    return (
      <div
        key={i}
        className="flex items-center justify-center border border-[#27313a] bg-[#172029]"
        style={{
          gridColumn: c + 1,
          gridRow: r + 1,
          boxShadow: isEntry ? `inset 0 0 0 2px ${colorOf(entrySpaces[i])}` : undefined,
        }}
      >
        {owner && (
          <span className="w-3/5 h-3/5 rounded-full border border-black/40" style={{ background: colorOf(owner) }} />
        )}
      </div>
    );
  });

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 max-w-2xl mx-auto w-full">
      <div className="w-full flex flex-col items-center mb-4 border-b-2 border-[#39414E] pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#F5F6F7]">Sorry!</h1>
        <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">Room ID: #{state.roomId}</span>
      </div>

      <div className={cn(
        'px-6 py-2 border-2 border-[#39414E] font-bold text-sm uppercase shadow-[4px_4px_0px_#454C5A] mb-4',
        myTurn ? 'bg-[#E63946] text-white' : 'bg-[#262B34] text-white',
      )}>
        {myTurn ? (state.mustDraw ? 'Your turn — draw a card' : 'Your turn — move a pawn') : `${opponent?.name ?? 'Opponent'}'s turn`}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* The ring board with a card panel in the middle */}
        <div className="relative w-full max-w-[420px] mx-auto">
          <div className="grid aspect-square w-full gap-0.5" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)' }}>
            {cells}
            <div
              className="flex flex-col items-center justify-center gap-3 bg-[#1A1D24] border-2 border-[#39414E] p-3"
              style={{ gridColumn: '2 / 12', gridRow: '2 / 12' }}
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A92A0]">Card</span>
              <div className="w-20 h-28 sm:w-24 sm:h-32 flex items-center justify-center bg-[#262B34] border-2 border-[#39414E] shadow-[4px_4px_0px_#454C5A]">
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#F5F6F7] text-center leading-none px-1">
                  {state.card != null ? cardLabel(state.card) : '—'}
                </span>
              </div>
              {myTurn && state.mustDraw && (
                <button
                  onClick={() => dispatch({ a: 'draw' })}
                  className="px-5 py-2 bg-[#E63946] text-white font-bold uppercase tracking-widest text-xs border-2 border-[#39414E] shadow-[3px_3px_0px_#454C5A] active:translate-y-0.5 active:shadow-none transition-all"
                >
                  Draw
                </button>
              )}
              {myTurn && !state.mustDraw && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] text-center animate-pulse">
                  Tap a glowing pawn
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Player panels */}
        <div className="w-full space-y-4">
          {me && (
            <div className="border-2 border-[#39414E] p-3 bg-[#1A1D24]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: colorOf(myId) }}>You</span>
                <span className="text-[10px] font-mono text-[#9CA3AF]">{state.pawns[myId]?.filter((t) => t === FINISH).length ?? 0}/4 Home</span>
              </div>
              <PawnChips pawns={state.pawns[myId] ?? [-1, -1, -1, -1]} color={colorOf(myId)} movable={movable} onMove={(i) => dispatch({ a: 'move', pawn: i })} />
            </div>
          )}
          {opponent && (
            <div className="border-2 border-[#39414E] p-3 bg-[#1A1D24]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: colorOf(opponent.id) }}>{opponent.name}</span>
                <span className="text-[10px] font-mono text-[#9CA3AF]">{state.pawns[opponent.id]?.filter((t) => t === FINISH).length ?? 0}/4 Home</span>
              </div>
              <PawnChips pawns={state.pawns[opponent.id] ?? [-1, -1, -1, -1]} color={colorOf(opponent.id)} movable={[]} />
            </div>
          )}
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#8A92A0] border-l-2 border-[#E63946] pl-3 leading-relaxed">
            {state.lastEvent ?? 'Draw a card, move a pawn. Land on a rival to bump them home. A 1 or 2 frees a penned pawn; "Sorry!" yanks one out onto an opponent. All 4 Home wins.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export const sorry: GameDefinition<SorryState> = {
  id: 'sorry',
  name: 'Sorry!',
  tagline: 'Race your pawns home — bump rivals back to their pen along the way.',
  accent: '#F4A261',
  emoji: '🔺',
  createInitialState,
  start,
  reducer,
  botMove,
  Board,
  gameOverMessage: (state, myId) =>
    state.winnerId === myId
      ? '🎉 All four pawns Home — you win!'
      : `${state.players[state.winnerId ?? '']?.name ?? 'Opponent'} got everyone Home first!`,
};
