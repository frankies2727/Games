import { BaseState, BoardProps, GameAction, GameDefinition } from '../types';
import { cn } from '../lib/utils';

const SIZE = 10;
const SHIPS = [5, 4, 3, 3, 2]; // carrier, battleship, cruiser, submarine, destroyer
const TOTAL_SHIP_CELLS = SHIPS.reduce((a, b) => a + b, 0); // 17
const idx = (r: number, c: number) => r * SIZE + c;

type Shot = 'hit' | 'miss' | null;

export interface BattleshipState extends BaseState {
  phase: 'placing' | 'firing';
  fleets: Record<string, (number | null)[]>; // 100 cells, shipId or null
  incoming: Record<string, Shot[]>; // shots received per player (100)
  ready: Record<string, boolean>;
  turnId: string | null;
  lastShot: { by: string; cell: number; result: 'hit' | 'miss'; sunk: number | null } | null;
}

function randomFleet(): (number | null)[] {
  const cells: (number | null)[] = Array(SIZE * SIZE).fill(null);
  SHIPS.forEach((size, shipId) => {
    for (;;) {
      const horiz = Math.random() < 0.5;
      const r = Math.floor(Math.random() * SIZE);
      const c = Math.floor(Math.random() * SIZE);
      const coords: number[] = [];
      for (let k = 0; k < size; k++) {
        const rr = horiz ? r : r + k;
        const cc = horiz ? c + k : c;
        if (rr >= SIZE || cc >= SIZE) { coords.length = 0; break; }
        coords.push(idx(rr, cc));
      }
      if (coords.length !== size || coords.some((i) => cells[i] !== null)) continue;
      coords.forEach((i) => { cells[i] = shipId; });
      break;
    }
  });
  return cells;
}

function createInitialState(roomId: string): BattleshipState {
  return {
    roomId,
    status: 'waiting',
    players: {},
    winnerId: null,
    phase: 'placing',
    fleets: {},
    incoming: {},
    ready: {},
    turnId: null,
    lastShot: null,
  };
}

function start(state: BattleshipState): BattleshipState {
  const ids = Object.keys(state.players);
  const fleets: Record<string, (number | null)[]> = {};
  const incoming: Record<string, Shot[]> = {};
  const ready: Record<string, boolean> = {};
  for (const id of ids) {
    fleets[id] = randomFleet();
    incoming[id] = Array(SIZE * SIZE).fill(null);
    ready[id] = false;
  }
  return { ...state, status: 'playing', phase: 'placing', fleets, incoming, ready, turnId: null, lastShot: null };
}

function reducer(state: BattleshipState, pid: string, action: GameAction): BattleshipState {
  if (state.status !== 'playing') return state;
  const ids = Object.keys(state.players);
  const other = pid === ids[0] ? ids[1] : ids[0];

  if (state.phase === 'placing') {
    if (state.ready[pid]) return state;
    if (action.a === 'shuffle') {
      return { ...state, fleets: { ...state.fleets, [pid]: randomFleet() } };
    }
    if (action.a === 'ready') {
      const ready = { ...state.ready, [pid]: true };
      const bothReady = ids.length === 2 && ids.every((id) => ready[id]);
      return bothReady
        ? { ...state, ready, phase: 'firing', turnId: ids[0] }
        : { ...state, ready };
    }
    return state;
  }

  // firing
  if (action.a === 'fire' && pid === state.turnId) {
    const cell = action.cell as number;
    if (cell < 0 || cell >= SIZE * SIZE) return state;
    const targetInc = state.incoming[other];
    if (targetInc[cell] != null) return state; // already fired here

    const hit = state.fleets[other][cell] != null;
    const newInc = targetInc.slice();
    newInc[cell] = hit ? 'hit' : 'miss';
    const incoming = { ...state.incoming, [other]: newInc };

    let sunk: number | null = null;
    if (hit) {
      const shipId = state.fleets[other][cell]!;
      const shipCells: number[] = [];
      for (let i = 0; i < SIZE * SIZE; i++) if (state.fleets[other][i] === shipId) shipCells.push(i);
      if (shipCells.every((i) => newInc[i] === 'hit')) sunk = shipId;
    }

    const hits = newInc.filter((v) => v === 'hit').length;
    const won = hits >= TOTAL_SHIP_CELLS;
    const lastShot = { by: pid, cell, result: hit ? ('hit' as const) : ('miss' as const), sunk };

    if (won) return { ...state, incoming, lastShot, status: 'gameover', winnerId: pid, turnId: null };
    return { ...state, incoming, lastShot, turnId: other };
  }

  return state;
}

// Bot: auto-confirm its randomized fleet, then hunt. It targets cells adjacent
// to existing hits, and otherwise fires at unshot cells on a checkerboard
// (every ship is ≥2 long, so parity guarantees coverage with half the shots).
function botMove(state: BattleshipState, botId: string): GameAction | null {
  if (state.status !== 'playing') return null;
  const ids = Object.keys(state.players);
  const human = ids.find((id) => id !== botId);
  if (!human) return null;

  if (state.phase === 'placing') {
    return state.ready[botId] ? null : { a: 'ready' };
  }
  if (state.turnId !== botId) return null;

  const shots = state.incoming[human] || []; // where the bot has already fired
  const open = (i: number) => i >= 0 && i < SIZE * SIZE && shots[i] == null;

  const targets: number[] = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (shots[i] !== 'hit') continue;
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && open(rr * SIZE + cc)) targets.push(rr * SIZE + cc);
    }
  }

  let pool = targets;
  if (!pool.length) {
    for (let i = 0; i < SIZE * SIZE; i++) {
      if (open(i) && (Math.floor(i / SIZE) + (i % SIZE)) % 2 === 0) pool.push(i);
    }
  }
  if (!pool.length) {
    for (let i = 0; i < SIZE * SIZE; i++) if (open(i)) pool.push(i);
  }
  if (!pool.length) return null;
  return { a: 'fire', cell: pool[Math.floor(Math.random() * pool.length)] };
}

// Hide each opponent's un-hit ships from the viewer.
function redact(state: BattleshipState, viewerId: string): BattleshipState {
  if (!state.fleets || Object.keys(state.fleets).length === 0) return state;
  const fleets: Record<string, (number | null)[]> = { ...state.fleets };
  for (const pid of Object.keys(fleets)) {
    if (pid === viewerId) continue;
    const inc = state.incoming[pid] || [];
    fleets[pid] = fleets[pid].map((v, i) => (inc[i] === 'hit' ? v : null));
  }
  return { ...state, fleets };
}

// `key` is declared so React's special key prop type-checks without @types/react.
function GridCell({ kind, onClick, clickable }: { key?: number; kind: 'water' | 'ship' | 'hit' | 'miss'; onClick?: () => void; clickable?: boolean }) {
  return (
    <button
      disabled={!clickable}
      onClick={onClick}
      className={cn(
        "aspect-square border border-[#cdd9de] flex items-center justify-center text-[10px] sm:text-xs touch-manipulation",
        kind === 'water' && "bg-[#eaf3f6]",
        kind === 'ship' && "bg-[#5b6770]",
        kind === 'hit' && "bg-[#E63946]",
        kind === 'miss' && "bg-[#eaf3f6]",
        clickable && "hover:bg-[#cfe6ef] cursor-pointer"
      )}
    >
      {kind === 'hit' && <span className="text-white font-bold">✕</span>}
      {kind === 'miss' && <span className="w-1.5 h-1.5 rounded-full bg-[#9aa7ad]" />}
    </button>
  );
}

function Board({ state, myId, dispatch }: BoardProps<BattleshipState>) {
  const opponent = Object.values(state.players).find((p) => p.id !== myId);
  const myFleet = state.fleets[myId] || Array(100).fill(null);
  const myIncoming = state.incoming[myId] || Array(100).fill(null);
  const oppId = opponent?.id ?? '';
  const oppIncoming = state.incoming[oppId] || Array(100).fill(null); // my shots land here

  // ---- Placement phase ----
  if (state.phase === 'placing') {
    const iAmReady = state.ready[myId];
    return (
      <div className="flex flex-col items-center p-4 sm:p-8 max-w-md mx-auto w-full">
        <div className="w-full flex flex-col items-center mb-6 border-b-2 border-[#1A1A1A] pb-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#1A1A1A]">Battleship</h1>
          <span className="text-xs font-mono uppercase tracking-widest text-[#6B6B6B]">Place your fleet · Room #{state.roomId}</span>
        </div>

        <div className="grid grid-cols-10 gap-0.5 w-full max-w-[360px] bg-[#1A1A1A] p-1 border-2 border-[#1A1A1A] shadow-[6px_6px_0px_#D1D1D1] mb-6">
          {myFleet.map((cell, i) => (
            <GridCell key={i} kind={cell != null ? 'ship' : 'water'} />
          ))}
        </div>

        {iAmReady ? (
          <p className="text-sm font-mono uppercase tracking-widest text-[#6B6B6B] animate-pulse">
            Waiting for {opponent?.name ?? 'opponent'}…
          </p>
        ) : (
          <div className="flex gap-4 w-full max-w-[360px]">
            <button
              onClick={() => dispatch({ a: 'shuffle' })}
              className="flex-1 py-4 bg-white text-[#1A1A1A] font-bold uppercase tracking-widest border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] active:translate-y-1 active:shadow-none transition-all"
            >
              ⤭ Shuffle
            </button>
            <button
              onClick={() => dispatch({ a: 'ready' })}
              className="flex-1 py-4 bg-[#E63946] text-white font-bold uppercase tracking-widest border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] active:translate-y-1 active:shadow-none transition-all"
            >
              ✓ Ready
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- Firing phase ----
  const myTurn = state.turnId === myId;
  const myHits = oppIncoming.filter((v) => v === 'hit').length;
  const theirHits = myIncoming.filter((v) => v === 'hit').length;
  const ls = state.lastShot;
  const lastText = ls
    ? `${state.players[ls.by]?.name ?? '—'} fired — ${ls.result.toUpperCase()}${ls.sunk != null ? ` · sunk a ${SHIPS[ls.sunk]}-cell ship!` : ''}`
    : 'Battle stations!';

  const fireCell = (i: number) => {
    if (!myTurn || oppIncoming[i] != null) return;
    dispatch({ a: 'fire', cell: i });
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 max-w-3xl mx-auto w-full">
      <div className="w-full flex flex-col items-center mb-4 border-b-2 border-[#1A1A1A] pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#1A1A1A]">Battleship</h1>
        <span className="text-xs font-mono uppercase tracking-widest text-[#6B6B6B]">Room #{state.roomId}</span>
      </div>

      <div className={cn(
        "px-6 py-2 border-2 border-[#1A1A1A] font-bold text-sm uppercase shadow-[4px_4px_0px_#1A1A1A] mb-2",
        myTurn ? "bg-[#E63946] text-white" : "bg-[#1A1A1A] text-white"
      )}>
        {myTurn ? 'Your turn — fire!' : `${opponent?.name ?? 'Opponent'}'s turn`}
      </div>
      <p className="text-[11px] font-mono uppercase tracking-wider text-[#6B6B6B] mb-6 text-center">{lastText}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Opponent waters — fire here */}
        <div className="flex flex-col items-center">
          <div className="flex justify-between w-full max-w-[320px] mb-2">
            <h2 className="font-bold text-xs uppercase tracking-widest">Enemy waters</h2>
            <span className="font-mono text-xs text-[#E63946] font-bold">{myHits}/{TOTAL_SHIP_CELLS}</span>
          </div>
          <div className={cn(
            "grid grid-cols-10 gap-0.5 w-full max-w-[320px] bg-[#1A1A1A] p-1 border-2 border-[#1A1A1A] shadow-[6px_6px_0px_#D1D1D1]",
            !myTurn && "opacity-70"
          )}>
            {oppIncoming.map((shot, i) => (
              <GridCell
                key={i}
                kind={shot === 'hit' ? 'hit' : shot === 'miss' ? 'miss' : 'water'}
                clickable={myTurn && shot == null}
                onClick={() => fireCell(i)}
              />
            ))}
          </div>
        </div>

        {/* My fleet — incoming fire */}
        <div className="flex flex-col items-center">
          <div className="flex justify-between w-full max-w-[320px] mb-2">
            <h2 className="font-bold text-xs uppercase tracking-widest">Your fleet</h2>
            <span className="font-mono text-xs text-[#6B6B6B] font-bold">{theirHits}/{TOTAL_SHIP_CELLS} hit</span>
          </div>
          <div className="grid grid-cols-10 gap-0.5 w-full max-w-[320px] bg-[#1A1A1A] p-1 border-2 border-[#1A1A1A] shadow-[6px_6px_0px_#D1D1D1]">
            {myFleet.map((cell, i) => {
              const shot = myIncoming[i];
              const kind = shot === 'hit' ? 'hit' : cell != null ? 'ship' : shot === 'miss' ? 'miss' : 'water';
              return <GridCell key={i} kind={kind} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export const battleship: GameDefinition<BattleshipState> = {
  id: 'battleship',
  name: 'Battleship',
  tagline: 'Hide your fleet, then hunt down the enemy ships.',
  accent: '#264653',
  emoji: '🚢',
  createInitialState,
  start,
  reducer,
  redact,
  botMove,
  Board,
  gameOverMessage: (state, myId) =>
    state.winnerId === myId ? '🎉 Enemy fleet destroyed — you win!' : `${state.players[state.winnerId ?? '']?.name ?? 'Opponent'} sank your fleet!`,
};
