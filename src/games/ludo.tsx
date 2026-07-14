import { BaseState, BoardProps, GameAction, GameDefinition } from '../types';
import { cn } from '../lib/utils';

// Ludo (the "Sorry!"-style race game) on the classic 15×15 cross board with
// 2–4 players. Roll the die, bring tokens out on a 6, race clockwise around the
// shared 52-space loop, capture opponents by landing on them (except on safe
// squares), then turn up your colour's home column into the centre. First to get
// all four tokens Home wins. Rolling a 6 — or capturing / finishing a token —
// earns another roll.
//
// A token's position `p` is stored relative to its colour's start square:
//   p = -1        -> in the base pen
//   0 .. 50       -> on the shared loop; board space = PATH[(start + p) % 52]
//   51 .. 55      -> in the private home column (5 cells)
//   p = FINISH(56)-> Home (finished)

type Color = 'red' | 'green' | 'yellow' | 'blue';

// The 52 shared loop cells as [row, col] on the 15×15 grid, clockwise.
const PATH: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0],
];

const START_INDEX: Record<Color, number> = { red: 0, green: 13, yellow: 26, blue: 39 };
const COLOR_HEX: Record<Color, string> = { red: '#E63946', green: '#2A9D8F', yellow: '#F4C430', blue: '#457B9D' };

// Home column cells (5 lanes + the finish cell) leading into the centre.
const HOME_CELLS: Record<Color, [number, number][]> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

// A compact 2×2 pen (one square per piece) tucked into each corner.
const BASE_SLOTS: Record<Color, [number, number][]> = {
  red: [[2, 2], [2, 3], [3, 2], [3, 3]],
  green: [[2, 11], [2, 12], [3, 11], [3, 12]],
  yellow: [[11, 11], [11, 12], [12, 11], [12, 12]],
  blue: [[11, 2], [11, 3], [12, 2], [12, 3]],
};

const SAFE = new Set([0, 13, 26, 39, 8, 21, 34, 47]); // start squares + stars
const FINISH = 56;

// The bottom-left seat plays as the rainbow colour.
const RAINBOW = 'conic-gradient(from 140deg,#EF4444,#F59E0B,#FDE047,#22C55E,#3B82F6,#A855F7,#EF4444)';
const isRainbow = (c: Color) => c === 'blue';
const fillOf = (c: Color) => (isRainbow(c) ? RAINBOW : COLOR_HEX[c]);
const tintOf = (c: Color, alpha: string) => (isRainbow(c) ? RAINBOW : COLOR_HEX[c] + alpha);

// Wildcard tiles (absolute loop indices): landing here fires a random powerup or
// unlucky event. Chosen off the safe squares and start squares, one per arm.
const WILD = new Set([3, 16, 29, 42]);

// Which colours play, by seat order — 2 players sit diagonally for balance.
const SEATING: Record<number, Color[]> = {
  2: ['red', 'yellow'],
  3: ['red', 'green', 'yellow'],
  4: ['red', 'green', 'yellow', 'blue'],
};

export interface LudoState extends BaseState {
  order: string[]; // player ids in seat/turn order
  colorOf: Record<string, Color>; // player id -> colour
  tokens: Record<string, number[]>; // player id -> 4 token positions
  turnId: string | null;
  die: number | null; // rolled value awaiting a move (null = must roll)
  mustRoll: boolean;
  awaitingProceed: boolean; // turn is over; someone must click to pass play on
  lastEvent: string | null;
}

function createInitialState(roomId: string): LudoState {
  return {
    roomId,
    status: 'waiting',
    players: {},
    winnerId: null,
    order: [],
    colorOf: {},
    tokens: {},
    turnId: null,
    die: null,
    mustRoll: true,
    awaitingProceed: false,
    lastEvent: null,
  };
}

function start(state: LudoState): LudoState {
  const order = Object.keys(state.players);
  const colors = SEATING[order.length] ?? SEATING[4].slice(0, order.length);
  const colorOf: Record<string, Color> = {};
  const tokens: Record<string, number[]> = {};
  order.forEach((id, i) => {
    colorOf[id] = colors[i];
    tokens[id] = [-1, -1, -1, -1];
  });
  return { ...state, status: 'playing', order, colorOf, tokens, turnId: order[0], die: null, mustRoll: true, awaitingProceed: false, lastEvent: null };
}

const mainAbs = (color: Color, p: number) => (START_INDEX[color] + p) % 52; // valid for p in 0..50

// Destination of a token if `die` is applied, plus any opponent tokens it would
// capture — or null if the move is illegal.
interface Landing { to: number; captures: { player: string; token: number }[] }

function landing(state: LudoState, pid: string, tokenIdx: number, die: number): Landing | null {
  const color = state.colorOf[pid];
  const p = state.tokens[pid][tokenIdx];

  let to: number;
  if (p === -1) {
    if (die !== 6) return null; // need a 6 to leave the pen
    to = 0;
  } else {
    if (p >= FINISH) return null; // already Home
    to = p + die;
    if (to > FINISH) return null; // must reach Home by exact count
  }

  // Capture: only on the shared loop, only on non-safe squares.
  const captures: Landing['captures'] = [];
  if (to <= 50) {
    const absTo = mainAbs(color, to);
    if (!SAFE.has(absTo)) {
      for (const other of state.order) {
        if (other === pid) continue;
        const oc = state.colorOf[other];
        state.tokens[other].forEach((tp, ti) => {
          if (tp >= 0 && tp <= 50 && mainAbs(oc, tp) === absTo) captures.push({ player: other, token: ti });
        });
      }
    }
  }
  return { to, captures };
}

const legalTokens = (state: LudoState, pid: string, die: number): number[] =>
  state.tokens[pid].map((_, i) => i).filter((i) => landing(state, pid, i, die) != null);

const nextTurn = (state: LudoState, pid: string): string => {
  const i = state.order.indexOf(pid);
  return state.order[(i + 1) % state.order.length];
};

// Opponent tokens sharing a loop cell (used for wildcard-induced re-landings).
function loopCaptures(state: LudoState, tokens: Record<string, number[]>, pid: string, color: Color, toP: number): { player: string; token: number }[] {
  if (toP < 0 || toP > 50) return [];
  const absTo = mainAbs(color, toP);
  if (SAFE.has(absTo)) return [];
  const caps: { player: string; token: number }[] = [];
  for (const other of state.order) {
    if (other === pid) continue;
    const oc = state.colorOf[other];
    tokens[other].forEach((tp, ti) => { if (tp >= 0 && tp <= 50 && mainAbs(oc, tp) === absTo) caps.push({ player: other, token: ti }); });
  }
  return caps;
}

// Fire a random wildcard effect on the token that just landed on a wild tile.
// Mutates `tokens`; returns whether it grants another roll plus a description.
function applyWildcard(state: LudoState, tokens: Record<string, number[]>, pid: string, color: Color, tokenIdx: number): { extra: boolean; event: string } {
  const p = tokens[pid][tokenIdx];
  let extra = false;
  let event: string;
  switch (Math.floor(Math.random() * 5)) {
    case 0: { const np = p + 3; if (np <= FINISH) tokens[pid][tokenIdx] = np; event = '🚀 Wildcard: Boost +3!'; break; }
    case 1: { extra = true; event = '⭐ Wildcard: Extra roll!'; break; }
    case 2: { tokens[pid][tokenIdx] = -1; event = '💀 Wildcard: SORRY — back to the pen!'; break; }
    case 3: { tokens[pid][tokenIdx] = Math.max(p - 4, 0); event = '🐌 Wildcard: Slip back 4'; break; }
    default: { const np = p + 6; if (np <= FINISH) tokens[pid][tokenIdx] = np; event = '✈️ Wildcard: Leap +6!'; break; }
  }
  const caps = loopCaptures(state, tokens, pid, color, tokens[pid][tokenIdx]);
  for (const cap of caps) tokens[cap.player][cap.token] = -1;
  if (caps.length) event += ` · captured ${caps.length}!`;
  return { extra, event };
}

function reducer(state: LudoState, pid: string, action: GameAction): LudoState {
  if (state.status !== 'playing') return state;

  // Anyone may click to pass play on — so a solo player also advances bot turns.
  if (action.a === 'proceed') {
    if (!state.awaitingProceed || !state.turnId) return state;
    const next = nextTurn(state, state.turnId);
    return { ...state, turnId: next, mustRoll: true, die: null, awaitingProceed: false, lastEvent: `${state.players[next]?.name ?? '—'}'s turn` };
  }

  if (pid !== state.turnId || state.awaitingProceed) return state;
  const name = state.players[pid]?.name ?? '—';
  const color = state.colorOf[pid];

  // Roll the die. If nothing can move, the turn ends (click Proceed to pass on).
  if (action.a === 'roll') {
    if (!state.mustRoll) return state;
    const die = 1 + Math.floor(Math.random() * 6);
    if (legalTokens(state, pid, die).length === 0) {
      return { ...state, die, mustRoll: false, awaitingProceed: true, lastEvent: `${name} rolled ${die} — no move` };
    }
    return { ...state, die, mustRoll: false, lastEvent: `${name} rolled ${die}` };
  }

  // Apply the rolled die to a chosen token.
  if (action.a === 'move') {
    if (state.mustRoll || state.die == null) return state;
    const tokenIdx = action.token as number;
    const res = landing(state, pid, tokenIdx, state.die);
    if (!res) return state;

    const tokens: Record<string, number[]> = {};
    for (const id of state.order) tokens[id] = state.tokens[id].slice();
    for (const cap of res.captures) tokens[cap.player][cap.token] = -1;
    tokens[pid][tokenIdx] = res.to;

    let event = `${name} moved`;
    if (res.captures.length) event += ` · captured ${res.captures.length}!`;

    // Landing on a wildcard tile fires a random powerup / unlucky effect.
    let wildExtra = false;
    if (res.to <= 50 && WILD.has(mainAbs(color, res.to))) {
      const w = applyWildcard(state, tokens, pid, color, tokenIdx);
      wildExtra = w.extra;
      event += ` · ${w.event}`;
    } else if (res.to === FINISH) {
      event += ' · a token Home!';
    }

    if (tokens[pid].every((t) => t === FINISH)) {
      return { ...state, tokens, status: 'gameover', winnerId: pid, turnId: null, die: null, mustRoll: true, awaitingProceed: false, lastEvent: `${name} got all tokens Home!` };
    }

    // A 6, a capture, sending a token Home, or a wildcard bonus earns another roll.
    const again = state.die === 6 || res.captures.length > 0 || tokens[pid][tokenIdx] === FINISH || wildExtra;
    if (again) return { ...state, tokens, die: null, mustRoll: true, awaitingProceed: false, turnId: pid, lastEvent: event };
    // Otherwise the turn is over — hold until someone clicks Proceed.
    return { ...state, tokens, mustRoll: false, awaitingProceed: true, lastEvent: event };
  }

  return state;
}

// Bot: roll when it must; otherwise pick the strongest move — capture, then
// finish a token, then leave the pen, then advance the furthest.
function botMove(state: LudoState, botId: string): GameAction | null {
  if (state.status !== 'playing' || state.turnId !== botId) return null;
  if (state.awaitingProceed) return null; // a human clicks Proceed to pass play on
  if (state.mustRoll) return { a: 'roll' };
  if (state.die == null) return null;
  const opts = state.tokens[botId]
    .map((p, i) => ({ i, p, res: landing(state, botId, i, state.die!) }))
    .filter((o) => o.res) as { i: number; p: number; res: Landing }[];
  if (!opts.length) return null;
  const score = (o: { p: number; res: Landing }) => {
    let s = o.res.to;
    if (o.res.captures.length) s += 200;
    if (o.res.to === FINISH) s += 120;
    if (o.p === -1) s += 60; // develop a penned token
    return s;
  };
  const best = opts.reduce((a, b) => (score(b) > score(a) ? b : a));
  return { a: 'move', token: best.i };
}

// ---- Rendering ----
const key = (r: number, c: number) => r * 15 + c;

// Precompute per-cell static roles.
const PATH_AT = new Map<number, number>(); // cell -> loop index
PATH.forEach(([r, c], i) => PATH_AT.set(key(r, c), i));
const HOME_AT = new Map<number, Color>();
(Object.keys(HOME_CELLS) as Color[]).forEach((col) => HOME_CELLS[col].forEach(([r, c]) => HOME_AT.set(key(r, c), col)));
const START_CELL = new Map<number, Color>();
(Object.keys(START_INDEX) as Color[]).forEach((col) => {
  const [r, c] = PATH[START_INDEX[col]];
  START_CELL.set(key(r, c), col);
});
const SLOT_AT = new Map<number, Color>(); // pen square -> colour
(Object.keys(BASE_SLOTS) as Color[]).forEach((col) => BASE_SLOTS[col].forEach(([r, c]) => SLOT_AT.set(key(r, c), col)));

function Token({ color, active, count, onClick }: { color: Color; active?: boolean; count?: number; onClick?: () => void }) {
  return (
    <button
      disabled={!active}
      onClick={onClick}
      className={cn(
        // A white border keeps a token visible even on its own colour's cells.
        'w-[85%] h-[85%] rounded-full border-2 border-white shadow-[0_1px_2px_rgba(0,0,0,0.6)] flex items-center justify-center text-[8px] font-black text-white',
        active ? 'ring-2 ring-white cursor-pointer animate-pulse' : '',
      )}
      style={{ background: fillOf(color) }}
    >
      {count && count > 1 ? count : ''}
    </button>
  );
}

function Board({ state, myId, dispatch }: BoardProps<LudoState>) {
  const myColor = state.colorOf[myId];
  const myTurn = state.turnId === myId;
  const movable = myTurn && !state.mustRoll && state.die != null ? legalTokens(state, myId, state.die) : [];
  const activeColors = new Set(state.order.map((id) => state.colorOf[id]));

  // Cell -> tokens located there.
  const tokensAt = new Map<number, { pid: string; idx: number; color: Color }[]>();
  for (const pid of state.order) {
    const color = state.colorOf[pid];
    state.tokens[pid].forEach((p, idx) => {
      const [r, c] = p === -1 ? BASE_SLOTS[color][idx] : p <= 50 ? PATH[mainAbs(color, p)] : HOME_CELLS[color][p - 51];
      const k = key(r, c);
      if (!tokensAt.has(k)) tokensAt.set(k, []);
      tokensAt.get(k)!.push({ pid, idx, color });
    });
  }

  const cells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const k = key(r, c);
      const pathIdx = PATH_AT.get(k);
      const homeCol = HOME_AT.get(k);
      const startCol = START_CELL.get(k);
      const slotCol = SLOT_AT.get(k);
      const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
      const safe = pathIdx != null && SAFE.has(pathIdx);
      const wild = pathIdx != null && WILD.has(pathIdx);
      const here = tokensAt.get(k) ?? [];

      // Dark-mode palette: the board is dark, colours appear as muted tints on
      // the track's start squares, each colour's home lane, and its little pen.
      let bg = '#0F1117'; // empty corner space / void
      let border = 'transparent';
      if (startCol) { bg = tintOf(startCol, '77'); border = COLOR_HEX[startCol]; }
      else if (wild) { bg = '#2E2440'; border = '#A855F7'; }
      else if (pathIdx != null) { bg = safe ? '#2A313B' : '#1B1F27'; border = '#2E343F'; }
      else if (homeCol) { bg = tintOf(homeCol, '3A'); border = tintOf(homeCol, '77'); }
      else if (isCenter) { bg = '#181B22'; border = '#2E343F'; }

      const slotActive = slotCol != null && activeColors.has(slotCol);
      if (slotActive) { bg = tintOf(slotCol!, '4D'); border = COLOR_HEX[slotCol!]; }

      // Dim a colour's lane/start when that colour isn't in this game.
      const laneCol = startCol ?? homeCol;
      const dim = laneCol != null && !activeColors.has(laneCol);

      const primary = here[0];
      const active = primary != null && primary.pid === myId && movable.includes(primary.idx);

      cells.push(
        <div
          key={k}
          className="flex items-center justify-center"
          style={{
            gridColumn: c + 1,
            gridRow: r + 1,
            background: bg,
            opacity: dim ? 0.3 : 1,
            outline: border === 'transparent' ? undefined : `1px solid ${border}`,
          }}
        >
          {wild && !primary && <span className="text-[10px] font-black text-[#C084FC] leading-none">?</span>}
          {safe && !startCol && !wild && !primary && <span className="text-[8px] text-[#5B6470] leading-none">✦</span>}
          {slotActive && !primary && <span className="w-[62%] h-[62%] rounded-full border-2" style={{ borderColor: tintOf(slotCol!, 'AA') }} />}
          {primary && <Token color={primary.color} active={active} count={here.length} onClick={() => active && dispatch({ a: 'move', token: primary.idx })} />}
        </div>,
      );
    }
  }

  const me = state.players[myId];
  const turnPlayer = state.turnId ? state.players[state.turnId] : null;
  const turnColor = state.turnId ? state.colorOf[state.turnId] : null;

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 max-w-2xl mx-auto w-full">
      <div className="w-full flex flex-col items-center mb-4 border-b-2 border-[#39414E] pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#F5F6F7]">Sorry</h1>
        <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">Room ID: #{state.roomId}</span>
      </div>

      {/* Turn + die + controls */}
      <div className="flex items-center gap-4 mb-4 flex-wrap justify-center">
        <div
          className="px-5 py-2 border-2 border-[#39414E] font-bold text-sm uppercase shadow-[4px_4px_0px_#454C5A] text-white"
          style={{ background: turnColor ? fillOf(turnColor) : '#262B34' }}
        >
          {state.awaitingProceed ? `${myTurn ? 'Your' : `${turnPlayer?.name ?? 'Opponent'}'s`} turn — done` : myTurn ? 'Your turn' : `${turnPlayer?.name ?? 'Opponent'}'s turn`}
        </div>
        <div className="w-12 h-12 bg-[#1A1D24] border-2 border-[#39414E] shadow-[3px_3px_0px_#454C5A] flex items-center justify-center text-2xl font-black font-mono text-[#F5F6F7]">
          {state.die ?? '·'}
        </div>
        {state.awaitingProceed ? (
          <button
            onClick={() => dispatch({ a: 'proceed' })}
            className="px-6 py-3 bg-[#8338EC] text-white font-bold uppercase tracking-widest text-sm border-2 border-[#39414E] shadow-[4px_4px_0px_#454C5A] active:translate-y-1 active:shadow-none transition-all"
          >
            ▶ Proceed{state.turnId ? ` → ${state.players[nextTurn(state, state.turnId)]?.name ?? 'next'}` : ''}
          </button>
        ) : myTurn && state.mustRoll ? (
          <button
            onClick={() => dispatch({ a: 'roll' })}
            className="px-6 py-3 bg-[#E63946] text-white font-bold uppercase tracking-widest text-sm border-2 border-[#39414E] shadow-[4px_4px_0px_#454C5A] active:translate-y-1 active:shadow-none transition-all"
          >
            🎲 Roll
          </button>
        ) : myTurn && !state.mustRoll ? (
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF] animate-pulse">Tap a glowing token</span>
        ) : null}
      </div>

      {/* The board */}
      <div className="w-full max-w-[440px] aspect-square border-2 border-[#39414E] shadow-[6px_6px_0px_#2E343F]">
        <div className="grid w-full h-full" style={{ gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}>
          {cells}
        </div>
      </div>

      {/* Player legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        {state.order.map((pid) => {
          const col = state.colorOf[pid];
          const home = state.tokens[pid].filter((t) => t === FINISH).length;
          return (
            <div
              key={pid}
              className={cn('flex items-center gap-2 px-3 py-1.5 border-2 text-[11px] font-mono uppercase tracking-wider', state.turnId === pid ? 'border-white text-white' : 'border-[#39414E] text-[#9CA3AF]')}
            >
              <span className="w-3 h-3 rounded-full border border-black/40" style={{ background: fillOf(col) }} />
              {pid === myId ? 'You' : state.players[pid]?.name} · {home}/4
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-mono uppercase tracking-wider text-[#8A92A0] mt-3 text-center border-l-2 border-[#E63946] pl-3">
        {state.lastEvent ?? `You are ${isRainbow(myColor) ? 'rainbow' : myColor}. Roll a 6 to release a token, capture rivals, and race home. Land on a "?" wildcard for a lucky boost or an unlucky spill!`}
      </p>
    </div>
  );
}

export const ludo: GameDefinition<LudoState> = {
  id: 'ludo',
  name: 'Sorry',
  tagline: 'A 2–4 player race with wildcard tiles. Roll, chase, capture, get all four home.',
  accent: '#2A9D8F',
  emoji: '🎲',
  minPlayers: 2,
  maxPlayers: 4,
  createInitialState,
  start,
  reducer,
  botMove,
  Board,
  gameOverMessage: (state, myId) =>
    state.winnerId === myId
      ? '🎉 All four home — you win!'
      : `${state.players[state.winnerId ?? '']?.name ?? 'Opponent'} got all four home first!`,
};
