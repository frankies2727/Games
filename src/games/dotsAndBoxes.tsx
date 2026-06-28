import type { ReactNode } from 'react';
import { BaseState, BoardProps, GameAction, GameDefinition } from '../types';
import { cn } from '../lib/utils';

// Classic pencil-and-paper Dots & Boxes on a DOTS×DOTS lattice of dots. Players
// take turns drawing one edge between adjacent dots; closing the 4th side of a
// box claims it AND earns another turn. Most boxes when the grid fills wins.
const DOTS = 5; // dots per side -> (DOTS-1)^2 = 16 boxes
const COLS = DOTS - 1; // boxes / edges per row

// Horizontal edges: DOTS rows × (DOTS-1) per row. hIdx(r,c), r∈[0,DOTS), c∈[0,COLS)
// Vertical edges:   (DOTS-1) rows × DOTS per row.  vIdx(r,c), r∈[0,COLS), c∈[0,DOTS)
const H_COUNT = DOTS * COLS;
const V_COUNT = COLS * DOTS;
const BOX_COUNT = COLS * COLS;

const hIdx = (r: number, c: number) => r * COLS + c;
const vIdx = (r: number, c: number) => r * DOTS + c;
const bIdx = (r: number, c: number) => r * COLS + c;

type Edge = 'h' | 'v';

export interface DotsAndBoxesState extends BaseState {
  hEdges: (string | null)[]; // player id who drew it, or null
  vEdges: (string | null)[];
  boxes: (string | null)[]; // owner per box
  scores: Record<string, number>;
  turnId: string | null;
  lastEdge: { edge: Edge; i: number } | null;
}

// Count of drawn sides of box (br,bc) given edge arrays.
function sidesOf(h: (string | null)[], v: (string | null)[], br: number, bc: number): number {
  let n = 0;
  if (h[hIdx(br, bc)] != null) n++;
  if (h[hIdx(br + 1, bc)] != null) n++;
  if (v[vIdx(br, bc)] != null) n++;
  if (v[vIdx(br, bc + 1)] != null) n++;
  return n;
}

// Boxes that border a given edge (one or two of them).
function boxesTouching(edge: Edge, i: number): [number, number][] {
  const out: [number, number][] = [];
  if (edge === 'h') {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    if (r < COLS) out.push([r, c]); // box below
    if (r > 0) out.push([r - 1, c]); // box above
  } else {
    const r = Math.floor(i / DOTS);
    const c = i % DOTS;
    if (c < COLS) out.push([r, c]); // box right
    if (c > 0) out.push([r, c - 1]); // box left
  }
  return out;
}

function createInitialState(roomId: string): DotsAndBoxesState {
  return {
    roomId,
    status: 'waiting',
    players: {},
    winnerId: null,
    hEdges: Array(H_COUNT).fill(null),
    vEdges: Array(V_COUNT).fill(null),
    boxes: Array(BOX_COUNT).fill(null),
    scores: {},
    turnId: null,
    lastEdge: null,
  };
}

function start(state: DotsAndBoxesState): DotsAndBoxesState {
  const ids = Object.keys(state.players);
  const scores: Record<string, number> = {};
  for (const id of ids) scores[id] = 0;
  return {
    ...state,
    status: 'playing',
    hEdges: Array(H_COUNT).fill(null),
    vEdges: Array(V_COUNT).fill(null),
    boxes: Array(BOX_COUNT).fill(null),
    scores,
    turnId: ids[0],
    lastEdge: null,
  };
}

function reducer(state: DotsAndBoxesState, pid: string, action: GameAction): DotsAndBoxesState {
  if (state.status !== 'playing' || pid !== state.turnId) return state;
  const edge = action.edge as Edge;
  const i = action.i as number;
  if (edge !== 'h' && edge !== 'v') return state;

  const hEdges = state.hEdges.slice();
  const vEdges = state.vEdges.slice();
  if (edge === 'h') {
    if (i < 0 || i >= H_COUNT || hEdges[i] != null) return state;
    hEdges[i] = pid;
  } else {
    if (i < 0 || i >= V_COUNT || vEdges[i] != null) return state;
    vEdges[i] = pid;
  }

  // Claim any box this edge just closed.
  const boxes = state.boxes.slice();
  const scores = { ...state.scores };
  let claimed = 0;
  for (const [br, bc] of boxesTouching(edge, i)) {
    if (boxes[bIdx(br, bc)] == null && sidesOf(hEdges, vEdges, br, bc) === 4) {
      boxes[bIdx(br, bc)] = pid;
      scores[pid] = (scores[pid] ?? 0) + 1;
      claimed++;
    }
  }

  const lastEdge = { edge, i };
  // Grid full -> game over; otherwise closing a box earns another turn.
  if (boxes.every(Boolean)) {
    const ids = Object.keys(state.players);
    const [a, b] = ids;
    const winnerId = scores[a] === scores[b] ? null : scores[a] > scores[b] ? a : b;
    return { ...state, hEdges, vEdges, boxes, scores, lastEdge, status: 'gameover', winnerId, turnId: null };
  }
  const ids = Object.keys(state.players);
  const turnId = claimed > 0 ? pid : pid === ids[0] ? ids[1] : ids[0];
  return { ...state, hEdges, vEdges, boxes, scores, lastEdge, turnId };
}

// Bot: take a box if one is available (and keep going, since that earns another
// turn), otherwise prefer an edge that doesn't open a 3-sided box for the rival.
function botMove(state: DotsAndBoxesState, botId: string): GameAction | null {
  if (state.status !== 'playing' || state.turnId !== botId) return null;

  const moves: { edge: Edge; i: number }[] = [];
  for (let i = 0; i < H_COUNT; i++) if (state.hEdges[i] == null) moves.push({ edge: 'h', i });
  for (let i = 0; i < V_COUNT; i++) if (state.vEdges[i] == null) moves.push({ edge: 'v', i });
  if (!moves.length) return null;

  // Sides each bordering box would have *after* playing this move.
  const sidesAfter = (m: { edge: Edge; i: number }): number[] => {
    const h = state.hEdges.slice();
    const v = state.vEdges.slice();
    if (m.edge === 'h') h[m.i] = botId; else v[m.i] = botId;
    return boxesTouching(m.edge, m.i).map(([br, bc]) => sidesOf(h, v, br, bc));
  };

  const completing = moves.filter((m) => sidesAfter(m).some((s) => s === 4));
  if (completing.length) return completing[Math.floor(Math.random() * completing.length)];

  const safe = moves.filter((m) => !sidesAfter(m).some((s) => s === 3));
  const pool = safe.length ? safe : moves;
  return pool[Math.floor(Math.random() * pool.length)];
}

function Board({ state, myId, dispatch }: BoardProps<DotsAndBoxesState>) {
  const ids = Object.keys(state.players);
  const colorOf = (pid: string | null) => (pid === ids[0] ? '#E76F51' : pid === ids[1] ? '#2A9D8F' : '#D1D1D1');
  const me = Object.values(state.players).find((p) => p.id === myId);
  const opponent = Object.values(state.players).find((p) => p.id !== myId);
  const myTurn = state.turnId === myId;

  const place = (edge: Edge, i: number, drawn: boolean) => {
    if (!myTurn || drawn) return;
    dispatch({ edge, i });
  };

  // Build the interleaved grid: 2·DOTS−1 tracks each way (dot / cell / dot / …).
  const tracks = 2 * DOTS - 1;
  const cells: ReactNode[] = [];
  for (let R = 0; R < tracks; R++) {
    for (let C = 0; C < tracks; C++) {
      const evenR = R % 2 === 0;
      const evenC = C % 2 === 0;
      if (evenR && evenC) {
        cells.push(<span key={`${R}-${C}`} className="w-3 h-3 rounded-full bg-[#1A1A1A] place-self-center" />);
      } else if (evenR && !evenC) {
        // Horizontal edge between dots
        const i = hIdx(R / 2, (C - 1) / 2);
        const owner = state.hEdges[i];
        const drawn = owner != null;
        cells.push(
          <button
            key={`${R}-${C}`}
            disabled={!myTurn || drawn}
            onClick={() => place('h', i, drawn)}
            className="group flex items-center justify-center h-3 touch-manipulation"
          >
            <span
              className={cn(
                'h-1.5 w-full rounded-full transition-colors',
                drawn ? '' : 'bg-[#E6E1D4] group-hover:bg-[#1A1A1A]/30',
              )}
              style={drawn ? { background: colorOf(owner) } : undefined}
            />
          </button>,
        );
      } else if (!evenR && evenC) {
        // Vertical edge between dots
        const i = vIdx((R - 1) / 2, C / 2);
        const owner = state.vEdges[i];
        const drawn = owner != null;
        cells.push(
          <button
            key={`${R}-${C}`}
            disabled={!myTurn || drawn}
            onClick={() => place('v', i, drawn)}
            className="group flex items-center justify-center w-3 touch-manipulation"
          >
            <span
              className={cn(
                'w-1.5 h-full rounded-full transition-colors',
                drawn ? '' : 'bg-[#E6E1D4] group-hover:bg-[#1A1A1A]/30',
              )}
              style={drawn ? { background: colorOf(owner) } : undefined}
            />
          </button>,
        );
      } else {
        // Box interior
        const owner = state.boxes[bIdx((R - 1) / 2, (C - 1) / 2)];
        cells.push(
          <span
            key={`${R}-${C}`}
            className="flex items-center justify-center text-sm font-black uppercase"
            style={owner ? { background: `${colorOf(owner)}33`, color: colorOf(owner) } : undefined}
          >
            {owner ? state.players[owner]?.name?.charAt(0).toUpperCase() : ''}
          </span>,
        );
      }
    }
  }

  // Dots fixed-size, edges/boxes flexible so boxes render roughly square.
  const colTemplate = Array.from({ length: tracks }, (_, k) => (k % 2 === 0 ? '14px' : '1fr')).join(' ');

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 max-w-xl mx-auto w-full">
      <div className="w-full flex flex-col items-center mb-6 border-b-2 border-[#1A1A1A] pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#1A1A1A]">Dots &amp; Boxes</h1>
        <span className="text-xs font-mono uppercase tracking-widest text-[#6B6B6B]">Room ID: #{state.roomId}</span>
      </div>

      {/* Scoreboard */}
      <div className="flex items-stretch gap-4 w-full max-w-md mb-6">
        {[me, opponent].map((p, idx) => p && (
          <div
            key={p.id}
            className={cn(
              'flex-1 border-2 border-[#1A1A1A] p-3 text-center',
              state.turnId === p.id ? 'text-white' : 'bg-white text-[#1A1A1A]',
            )}
            style={state.turnId === p.id ? { background: colorOf(p.id) } : undefined}
          >
            <div className="text-[10px] font-mono uppercase tracking-widest truncate">{idx === 0 ? 'You' : p.name}</div>
            <div className="text-3xl font-black font-mono">{state.scores[p.id] ?? 0}</div>
          </div>
        ))}
      </div>

      <div className={cn(
        'px-6 py-2 border-2 border-[#1A1A1A] font-bold text-sm uppercase shadow-[4px_4px_0px_#1A1A1A] mb-6',
        myTurn ? 'bg-[#E76F51] text-white' : 'bg-[#1A1A1A] text-white',
      )}>
        {myTurn ? 'Your turn — draw a line' : `${opponent?.name ?? 'Opponent'}'s turn`}
      </div>

      <div
        className="grid w-full max-w-[360px] aspect-square select-none"
        style={{ gridTemplateColumns: colTemplate, gridTemplateRows: colTemplate }}
      >
        {cells}
      </div>

      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8B8B8B] mt-6 text-center">
        Close the 4th side of a box to claim it &amp; go again · most boxes wins
      </p>
    </div>
  );
}

export const dotsAndBoxes: GameDefinition<DotsAndBoxesState> = {
  id: 'dots-and-boxes',
  name: 'Dots & Boxes',
  tagline: 'Draw lines, close boxes, claim the most. The classic pencil duel.',
  accent: '#E76F51',
  emoji: '🔳',
  createInitialState,
  start,
  reducer,
  botMove,
  Board,
  gameOverMessage: (state, myId) =>
    !state.winnerId
      ? "It's a tie — boxes split evenly!"
      : state.winnerId === myId
        ? '🎉 You boxed them in!'
        : `${state.players[state.winnerId]?.name ?? 'Opponent'} claimed the most boxes!`,
};
