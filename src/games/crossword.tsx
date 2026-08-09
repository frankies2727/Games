import { useEffect, useRef, useState } from 'react';
import { BaseState, BoardProps, GameAction, GameDefinition } from '../types';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Crossword Clash — a real-time brain-teaser race for 2–5 players (friends and
// bots). Everyone shares one crossword. Pick a clue, type the answer, and if
// you're right you CLAIM that word: its letters lock in for everybody and you
// pocket points equal to the word's length. First to fill the whole grid ends
// it; most points wins.
//
// Two modes:
//   • NORMAL — a snappy 4×4 grid with friendly, direct clues. A wrong guess
//     costs nothing, so guess away.
//   • HARD   — a chunkier 5×5 grid with terser, trickier clues. A wrong guess
//     LOCKS you out of that word (a rival can still steal it), so think first.
//
// Power-up — every player gets exactly 3× 🔍 HINTS. A hint reveals one more
// letter of your selected word, just for you. Spend them wisely.
//
// The answers never travel on the wire: game state only ever carries a puzzle
// id plus which words have been claimed, so nothing leaks to a peer's console.
// Bots read the solution from the local puzzle table and pace themselves so
// they're a real race, not an instant sweep.
// ---------------------------------------------------------------------------

type Dir = 'across' | 'down';

interface ClueDef {
  dir: Dir;
  index: number; // across → row, down → column (0-based)
  answer: string; // UPPERCASE, no spaces
  clue: string;
}

interface PuzzleDef {
  id: string;
  size: number;
  hard: boolean;
  clues: ClueDef[];
}

// --- Puzzle bank. Every grid is a fully-interlocking word square (no black
// squares): each row is an across word and each column is a down word, so all
// crossings agree. Grids were generated and verified by a solver; the runtime
// check below re-verifies every crossing at load, so a bad edit fails loudly.

const NORMAL_PUZZLES: PuzzleDef[] = [
  {
    id: 'n1', size: 4, hard: false,
    clues: [
      { dir: 'across', index: 0, answer: 'FLOW', clue: 'Move steadily, like a river' },
      { dir: 'across', index: 1, answer: 'ROPE', clue: "Cowboy's lasso, essentially" },
      { dir: 'across', index: 2, answer: 'OVER', clue: 'Finished; the opposite of under' },
      { dir: 'across', index: 3, answer: 'GENE', clue: 'Unit of heredity' },
      { dir: 'down', index: 0, answer: 'FROG', clue: 'Pond amphibian that leaps' },
      { dir: 'down', index: 1, answer: 'LOVE', clue: 'Zero, in tennis' },
      { dir: 'down', index: 2, answer: 'OPEN', clue: 'Not shut' },
      { dir: 'down', index: 3, answer: 'WERE', clue: "'As it ___' (so to speak)" },
    ],
  },
  {
    id: 'n2', size: 4, hard: false,
    clues: [
      { dir: 'across', index: 0, answer: 'SHIP', clue: 'Ocean-going vessel' },
      { dir: 'across', index: 1, answer: 'TIDE', clue: "The sea's daily rise and fall" },
      { dir: 'across', index: 2, answer: 'AREA', clue: 'Region; length times width' },
      { dir: 'across', index: 3, answer: 'REAR', clue: 'The back of something' },
      { dir: 'down', index: 0, answer: 'STAR', clue: 'Twinkler in the night sky' },
      { dir: 'down', index: 1, answer: 'HIRE', clue: 'Take on a new employee' },
      { dir: 'down', index: 2, answer: 'IDEA', clue: 'A bright thought' },
      { dir: 'down', index: 3, answer: 'PEAR', clue: 'Bell-shaped fruit' },
    ],
  },
  {
    id: 'n3', size: 4, hard: false,
    clues: [
      { dir: 'across', index: 0, answer: 'SCAN', clue: 'Quickly skim a page' },
      { dir: 'across', index: 1, answer: 'WORE', clue: 'Had on, as clothes' },
      { dir: 'across', index: 2, answer: 'IDEA', clue: 'A plan forming in your head' },
      { dir: 'across', index: 3, answer: 'MEAT', clue: "Butcher's main offering" },
      { dir: 'down', index: 0, answer: 'SWIM', clue: 'Do laps in a pool' },
      { dir: 'down', index: 1, answer: 'CODE', clue: "Programmer's output" },
      { dir: 'down', index: 2, answer: 'AREA', clue: 'Zone or district' },
      { dir: 'down', index: 3, answer: 'NEAT', clue: 'Tidy and orderly' },
    ],
  },
];

const HARD_PUZZLES: PuzzleDef[] = [
  {
    id: 'h1', size: 5, hard: true,
    clues: [
      { dir: 'across', index: 0, answer: 'SHEEP', clue: 'Flock member counted by insomniacs' },
      { dir: 'across', index: 1, answer: 'HELLO', clue: 'Switchboard greeting' },
      { dir: 'across', index: 2, answer: 'ELBOW', clue: "Joint you supposedly can't lick" },
      { dir: 'across', index: 3, answer: 'ELOPE', clue: 'Skip the big wedding' },
      { dir: 'across', index: 4, answer: 'TOWER', clue: 'Pisa landmark that leans' },
      { dir: 'down', index: 0, answer: 'SHEET', clue: "Bed linen; a ream's single one" },
      { dir: 'down', index: 1, answer: 'HELLO', clue: 'Adele smash of 2015' },
      { dir: 'down', index: 2, answer: 'ELBOW', clue: "Macaroni's bend" },
      { dir: 'down', index: 3, answer: 'ELOPE', clue: 'Run off to Vegas to wed' },
      { dir: 'down', index: 4, answer: 'POWER', clue: 'What watts measure' },
    ],
  },
  {
    id: 'h2', size: 5, hard: true,
    clues: [
      { dir: 'across', index: 0, answer: 'FORGE', clue: "Blacksmith's hearth; to counterfeit" },
      { dir: 'across', index: 1, answer: 'OPERA', clue: 'Carmen or Aida' },
      { dir: 'across', index: 2, answer: 'REFER', clue: 'Point to, as a source' },
      { dir: 'across', index: 3, answer: 'TREAT', clue: "Halloween's non-trick" },
      { dir: 'across', index: 4, answer: 'EARTH', clue: 'Third rock from the sun' },
      { dir: 'down', index: 0, answer: 'FORTE', clue: "One's strong suit" },
      { dir: 'down', index: 1, answer: 'OPERA', clue: 'Browser, or a night at La Scala' },
      { dir: 'down', index: 2, answer: 'REFER', clue: 'Send elsewhere, as a patient' },
      { dir: 'down', index: 3, answer: 'GREAT', clue: 'Terrific; a grandparent prefix' },
      { dir: 'down', index: 4, answer: 'EARTH', clue: 'Our pale blue dot' },
    ],
  },
  {
    id: 'h3', size: 5, hard: true,
    clues: [
      { dir: 'across', index: 0, answer: 'CHEST', clue: "Treasure box; your ribcage's front" },
      { dir: 'across', index: 1, answer: 'HUNCH', clue: "Detective's gut feeling" },
      { dir: 'across', index: 2, answer: 'ENTER', clue: 'Key pressed to confirm' },
      { dir: 'across', index: 3, answer: 'SCENE', clue: 'Part of an act, in a play' },
      { dir: 'across', index: 4, answer: 'SHREW', clue: 'Tiny mammal; Kate, tamed by the Bard' },
      { dir: 'down', index: 0, answer: 'CHESS', clue: 'Game of kings and pawns' },
      { dir: 'down', index: 1, answer: 'HUNCH', clue: 'Curl your shoulders forward' },
      { dir: 'down', index: 2, answer: 'ENTER', clue: 'Go inside' },
      { dir: 'down', index: 3, answer: 'SCENE', clue: 'Make a ___ (a public fuss)' },
      { dir: 'down', index: 4, answer: 'THREW', clue: 'Pitched the ball' },
    ],
  },
];

const ALL_PUZZLES = [...NORMAL_PUZZLES, ...HARD_PUZZLES];
const puzzleById = (id: string): PuzzleDef | undefined => ALL_PUZZLES.find((p) => p.id === id);

// --- Load-time integrity check: build each grid from its across words and make
// sure every down word matches the column it should read. Catches typos.
(function verifyPuzzles() {
  for (const p of ALL_PUZZLES) {
    const grid: string[][] = Array.from({ length: p.size }, () => Array<string>(p.size).fill(''));
    for (const c of p.clues) {
      if (c.answer.length !== p.size) throw new Error(`crossword ${p.id}: ${c.dir} ${c.index} wrong length`);
      for (let k = 0; k < p.size; k++) {
        const r = c.dir === 'across' ? c.index : k;
        const col = c.dir === 'across' ? k : c.index;
        const ch = c.answer[k];
        if (grid[r][col] && grid[r][col] !== ch) {
          throw new Error(`crossword ${p.id}: crossing mismatch at ${r},${col}`);
        }
        grid[r][col] = ch;
      }
    }
  }
})();

// --- Derived helpers (numbering, cells). Because every grid is a full square:
//   across word on row r starts at (r,0); number = r === 0 ? 1 : size + r
//   down word on col c starts at (0,c); number = c === 0 ? 1 : c + 1
const clueKey = (dir: Dir, index: number) => `${dir === 'across' ? 'A' : 'D'}${index}`;
const cellKey = (r: number, c: number) => `${r},${c}`;
const clueNumber = (dir: Dir, index: number, size: number) =>
  dir === 'across' ? (index === 0 ? 1 : size + index) : index + 1;

function clueCells(dir: Dir, index: number, size: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let k = 0; k < size; k++) cells.push(dir === 'across' ? [index, k] : [k, index]);
  return cells;
}

// The correct letter at (r,c): the r-th letter of the down word on column c
// (equivalently the c-th letter of the across word on row r).
function letterAt(puzzle: PuzzleDef, r: number, c: number): string {
  const across = puzzle.clues.find((x) => x.dir === 'across' && x.index === r);
  return across ? across.answer[c] : '';
}

const HINTS_PER_PLAYER = 3;
const BOT_SOLVE_CHANCE = 0.4; // per bot "tick" while it has an available clue
const BOT_ERR_CHANCE = 0.12; // hard mode: chance a bot fumbles and locks itself out

const PLAYER_COLORS = ['#4CC9F0', '#F72585', '#FFD166', '#06D6A0', '#B5179E'];
const colorForSeat = (i: number) => PLAYER_COLORS[i % PLAYER_COLORS.length];

// A wrong guess of the same length (used by a fumbling bot in hard mode).
function wrongGuess(ans: string): string {
  const rot = ans.slice(1) + ans[0];
  if (rot !== ans) return rot;
  const rev = ans.split('').reverse().join('');
  return rev !== ans ? rev : ans.slice(0, -1) + (ans[0] === 'A' ? 'B' : 'A');
}

// ---------------------------------------------------------------------------

export interface CrosswordState extends BaseState {
  phase: 'choosing' | 'playing';
  hard: boolean;
  puzzleId: string;
  size: number;
  solvedBy: Record<string, string>; // clueKey -> playerId who claimed it
  scores: Record<string, number>;
  hints: Record<string, number>; // playerId -> hints remaining
  revealed: Record<string, string[]>; // playerId -> cellKeys revealed to them via hints
  locked: Record<string, string[]>; // hard mode: playerId -> clueKeys they're locked out of
  lastResult: { pid: string; clueKey: string; ok: boolean; hint?: boolean } | null;
  botClock: number; // bumped by bot "think" ticks to keep the local bot loop alive
}

function createInitialState(roomId: string): CrosswordState {
  return {
    roomId,
    status: 'waiting',
    players: {},
    winnerId: null,
    phase: 'choosing',
    hard: false,
    puzzleId: '',
    size: 4,
    solvedBy: {},
    scores: {},
    hints: {},
    revealed: {},
    locked: {},
    lastResult: null,
    botClock: 0,
  };
}

// Waiting -> playing drops into the mode chooser; the puzzle is dealt once a
// mode is picked (so a rematch re-picks the mode and re-rolls the puzzle).
function start(state: CrosswordState): CrosswordState {
  return {
    ...state,
    status: 'playing',
    phase: 'choosing',
    puzzleId: '',
    solvedBy: {},
    scores: {},
    hints: {},
    revealed: {},
    locked: {},
    lastResult: null,
    botClock: 0,
  };
}

const isPublic = (state: CrosswordState, r: number, c: number) =>
  !!state.solvedBy[clueKey('across', r)] || !!state.solvedBy[clueKey('down', c)];

function topScorer(scores: Record<string, number>, ids: string[]): string | null {
  let best: string | null = null;
  let bestScore = -1;
  for (const id of ids) {
    const s = scores[id] ?? 0;
    if (s > bestScore) { bestScore = s; best = id; }
  }
  return best;
}

function reducer(state: CrosswordState, pid: string, action: GameAction): CrosswordState {
  if (state.status !== 'playing') return state;
  const ids = Object.keys(state.players);

  // ---- Mode selection: only the first-seated player picks. ----
  if (state.phase === 'choosing') {
    if (action.type !== 'mode' || pid !== ids[0]) return state;
    const hard = !!action.hard;
    const pool = hard ? HARD_PUZZLES : NORMAL_PUZZLES;
    const puzzle = pool[Math.floor(Math.random() * pool.length)];
    const scores: Record<string, number> = {};
    const hints: Record<string, number> = {};
    const revealed: Record<string, string[]> = {};
    const locked: Record<string, string[]> = {};
    for (const id of ids) {
      scores[id] = 0;
      hints[id] = HINTS_PER_PLAYER;
      revealed[id] = [];
      locked[id] = [];
    }
    return {
      ...state,
      phase: 'playing',
      hard,
      puzzleId: puzzle.id,
      size: puzzle.size,
      solvedBy: {},
      scores,
      hints,
      revealed,
      locked,
      lastResult: null,
      botClock: 0,
    };
  }

  const puzzle = puzzleById(state.puzzleId);
  if (!puzzle) return state;

  // ---- Bot "think" tick: a no-op solve step that still advances state so the
  // local bot driver keeps getting called (bots only move on state changes). ----
  if (action.type === 'tick') {
    return { ...state, botClock: state.botClock + 1 };
  }

  // ---- Submit a guess for a clue. ----
  if (action.type === 'submit') {
    const dir = action.dir as Dir;
    const index = action.index as number;
    const clue = puzzle.clues.find((c) => c.dir === dir && c.index === index);
    if (!clue) return state;
    const key = clueKey(dir, index);
    if (state.solvedBy[key]) return state; // already claimed
    if (state.hard && (state.locked[pid] ?? []).includes(key)) return state; // locked out

    const guess = String(action.guess ?? '').toUpperCase().replace(/[^A-Z]/g, '');
    if (guess !== clue.answer) {
      // Wrong. In hard mode it locks the guesser out of this word.
      const locked = state.hard
        ? { ...state.locked, [pid]: [...(state.locked[pid] ?? []), key] }
        : state.locked;
      return { ...state, locked, lastResult: { pid, clueKey: key, ok: false } };
    }

    // Correct — claim it.
    const solvedBy = { ...state.solvedBy, [key]: pid };
    const scores = { ...state.scores, [pid]: (state.scores[pid] ?? 0) + clue.answer.length };
    const done = Object.keys(solvedBy).length === puzzle.clues.length;
    return {
      ...state,
      solvedBy,
      scores,
      status: done ? 'gameover' : 'playing',
      winnerId: done ? topScorer(scores, ids) : null,
      lastResult: { pid, clueKey: key, ok: true },
    };
  }

  // ---- Spend a hint: reveal one more letter of a clue, privately. ----
  if (action.type === 'hint') {
    const dir = action.dir as Dir;
    const index = action.index as number;
    const clue = puzzle.clues.find((c) => c.dir === dir && c.index === index);
    if (!clue) return state;
    const key = clueKey(dir, index);
    if (state.solvedBy[key]) return state; // no point hinting a solved word
    if ((state.hints[pid] ?? 0) <= 0) return state;

    const mine = new Set(state.revealed[pid] ?? []);
    const target = clueCells(dir, index, puzzle.size).find(
      ([r, c]) => !isPublic(state, r, c) && !mine.has(cellKey(r, c)),
    );
    if (!target) return state; // whole word already known to this player

    const revealed = { ...state.revealed, [pid]: [...(state.revealed[pid] ?? []), cellKey(target[0], target[1])] };
    return {
      ...state,
      hints: { ...state.hints, [pid]: state.hints[pid] - 1 },
      revealed,
      lastResult: { pid, clueKey: key, ok: true, hint: true },
    };
  }

  return state;
}

// Bot cantor + solver. It reads answers from the local puzzle table (they're
// not in the wire state) and paces itself: each time the loop wakes it, with
// BOT_SOLVE_CHANCE it claims a random available clue, otherwise it "thinks"
// (a tick) so the loop keeps running without an instant sweep.
function botMove(state: CrosswordState, bid: string): GameAction | null {
  if (state.status !== 'playing') return null;
  const ids = Object.keys(state.players);

  if (state.phase === 'choosing') {
    return ids[0] === bid ? { type: 'mode', hard: Math.random() < 0.5 } : null;
  }

  const puzzle = puzzleById(state.puzzleId);
  if (!puzzle) return null;

  const lockedSet = new Set(state.locked[bid] ?? []);
  const avail = puzzle.clues.filter(
    (c) => !state.solvedBy[clueKey(c.dir, c.index)] && !lockedSet.has(clueKey(c.dir, c.index)),
  );
  if (avail.length === 0) return null; // nothing left for this bot — go quiet

  if (Math.random() < BOT_SOLVE_CHANCE) {
    const c = avail[Math.floor(Math.random() * avail.length)];
    const guess = state.hard && Math.random() < BOT_ERR_CHANCE ? wrongGuess(c.answer) : c.answer;
    return { type: 'submit', dir: c.dir, index: c.index, guess };
  }
  return { type: 'tick' };
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

const INK = '#F5F6F7';
const SUB = '#9CA3AF';
const LINE = '#39414E';
const PANEL = '#1A1D24';

function ModeChooser({ myTurn, chooserName, dispatch }: { myTurn: boolean; chooserName: string; dispatch: (a: GameAction) => void }) {
  return (
    <div className="flex flex-col items-center p-4 sm:p-8 max-w-md mx-auto w-full">
      <div className="w-full flex flex-col items-center mb-8 border-b-2 border-[#39414E] pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#F5F6F7]">Crossword</h1>
        <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">Choose your mode</span>
      </div>

      {myTurn ? (
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => dispatch({ type: 'mode', hard: false })}
            className="w-full p-6 text-left bg-[#1A1D24] hover:bg-[#262B34] active:translate-y-1 transition-all border-2 border-[#39414E] shadow-[4px_4px_0px_#454C5A] hover:shadow-[2px_2px_0px_#454C5A]"
          >
            <div className="text-xl font-bold uppercase tracking-wider text-[#F5F6F7]">🟢 Normal</div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF] mt-2">
              4×4 grid · friendly clues · wrong guesses are free
            </div>
          </button>
          <button
            onClick={() => dispatch({ type: 'mode', hard: true })}
            className="w-full p-6 text-left bg-[#1A1D24] hover:bg-[#262B34] active:translate-y-1 transition-all border-2 border-[#39414E]"
            style={{ boxShadow: '4px 4px 0px #E63946' }}
          >
            <div className="text-xl font-bold uppercase tracking-wider text-[#F5F6F7]">🔴 Hard</div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF] mt-2">
              5×5 grid · trickier clues · a wrong guess locks you out of that word
            </div>
          </button>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280] text-center mt-2">
            Everyone gets 3× 🔍 hints — reveal a letter of your selected word
          </p>
        </div>
      ) : (
        <p className="text-sm font-mono uppercase tracking-widest text-[#9CA3AF] animate-pulse text-center">
          Waiting for {chooserName} to pick a mode…
        </p>
      )}
    </div>
  );
}

function Board({ state, myId, dispatch }: BoardProps<CrosswordState>) {
  const ids = Object.keys(state.players);
  const seatOf = (id: string) => ids.indexOf(id);
  const nameOf = (id: string) => (id === myId ? 'You' : state.players[id]?.name ?? '—');

  const [sel, setSel] = useState<{ dir: Dir; index: number } | null>(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear the draft whenever the selected clue changes.
  useEffect(() => { setDraft(''); }, [sel?.dir, sel?.index]);

  if (state.phase === 'choosing') {
    const chooser = state.players[ids[0]];
    return <ModeChooser myTurn={myId === ids[0]} chooserName={chooser?.name ?? 'opponent'} dispatch={dispatch} />;
  }

  const puzzle = puzzleById(state.puzzleId);
  if (!puzzle) return null;
  const size = puzzle.size;

  const myRevealed = new Set(state.revealed[myId] ?? []);
  const myLocked = new Set(state.locked[myId] ?? []);
  const myHints = state.hints[myId] ?? 0;

  const totalClues = puzzle.clues.length;
  const solvedCount = Object.keys(state.solvedBy).length;

  // Which clue owns each cell (for numbering + selection highlight).
  const acrossOf = (r: number) => puzzle.clues.find((c) => c.dir === 'across' && c.index === r)!;
  const downOf = (c: number) => puzzle.clues.find((x) => x.dir === 'down' && x.index === c)!;

  const selCells = sel ? new Set(clueCells(sel.dir, sel.index, size).map(([r, c]) => cellKey(r, c))) : new Set<string>();

  const selClue = sel ? puzzle.clues.find((c) => c.dir === sel.dir && c.index === sel.index) : undefined;
  const selKey = sel ? clueKey(sel.dir, sel.index) : '';
  const selSolvedBy = sel ? state.solvedBy[selKey] : undefined;
  const selLocked = sel ? myLocked.has(selKey) : false;

  // Letters of the selected word already known to me (public solve or my hints).
  const selKnown: string[] = sel
    ? clueCells(sel.dir, sel.index, size).map(([r, c]) =>
        isPublic(state, r, c) || myRevealed.has(cellKey(r, c)) ? letterAt(puzzle, r, c) : '')
    : [];

  const result = state.lastResult;
  const myBadGuess = result && !result.ok && result.pid === myId && result.clueKey === selKey;

  const submit = () => {
    if (!sel || !selClue) return;
    const g = draft.toUpperCase().replace(/[^A-Z]/g, '');
    if (g.length !== selClue.answer.length) return;
    dispatch({ type: 'submit', dir: sel.dir, index: sel.index, guess: g });
    setDraft('');
  };

  const clueList = (dir: Dir) =>
    puzzle.clues
      .filter((c) => c.dir === dir)
      .sort((a, b) => clueNumber(a.dir, a.index, size) - clueNumber(b.dir, b.index, size))
      .map((c) => {
        const key = clueKey(c.dir, c.index);
        const owner = state.solvedBy[key];
        const selected = sel?.dir === c.dir && sel?.index === c.index;
        const locked = myLocked.has(key);
        return (
          <button
            key={key}
            onClick={() => setSel({ dir: c.dir, index: c.index })}
            className={cn(
              'w-full text-left px-2 py-1.5 border-2 flex items-start gap-2 transition-colors',
              selected ? 'bg-[#262B34] border-[#5B6472]' : 'bg-[#14171D] border-[#23272F] hover:border-[#39414E]',
            )}
          >
            <span className="text-[11px] font-mono font-bold text-[#8A92A0] w-5 shrink-0 pt-0.5">{clueNumber(c.dir, c.index, size)}</span>
            <span className="flex-1 text-[12px] leading-snug text-[#D6D9DE]">{c.clue}</span>
            {owner ? (
              <span
                className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 shrink-0"
                style={{ color: colorForSeat(seatOf(owner)) }}
                title={`Claimed by ${nameOf(owner)}`}
              >
                ✓ {nameOf(owner)}
              </span>
            ) : locked ? (
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#E63946] shrink-0">🔒</span>
            ) : null}
          </button>
        );
      });

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 max-w-3xl mx-auto w-full">
      <div className="w-full flex flex-col items-center mb-4 border-b-2 border-[#39414E] pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#F5F6F7]">
          Crossword <span className="not-italic" style={{ color: state.hard ? '#E63946' : '#06D6A0' }}>{state.hard ? 'Hard' : 'Normal'}</span>
        </h1>
        <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">
          Room #{state.roomId} · {solvedCount}/{totalClues} words claimed
        </span>
      </div>

      {/* Scoreboard: score + hints left per player. */}
      <div className="flex flex-wrap justify-center gap-2 w-full max-w-xl mb-5">
        {ids.map((id) => {
          const me = id === myId;
          const color = colorForSeat(seatOf(id));
          return (
            <div
              key={id}
              className={cn('min-w-[92px] flex-1 border-2 p-2 text-center', me ? 'bg-white/5' : 'bg-[#1A1D24]')}
              style={{ borderColor: color }}
            >
              <div className="text-[10px] font-mono uppercase tracking-widest truncate" style={{ color }}>{nameOf(id)}</div>
              <div className="text-xl font-black font-mono text-[#F5F6F7]">{state.scores[id] ?? 0}<span className="text-[10px] text-[#8A92A0]"> pts</span></div>
              <div className="text-[10px] font-mono text-[#8A92A0]">🔍 {state.hints[id] ?? 0} left</div>
            </div>
          );
        })}
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* The grid */}
        <div className="mx-auto shrink-0">
          <div
            className="grid gap-0.5 bg-[#23272F] p-0.5 border-2 border-[#39414E]"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: size * size }, (_, i) => {
              const r = Math.floor(i / size);
              const c = i % size;
              const key = cellKey(r, c);
              const pub = isPublic(state, r, c);
              const mineReveal = myRevealed.has(key);
              const show = pub || mineReveal;
              const letter = show ? letterAt(puzzle, r, c) : '';
              const inSel = selCells.has(key);
              // Corner number if this cell starts an across and/or down word.
              const startsAcross = c === 0;
              const startsDown = r === 0;
              const num = startsDown ? clueNumber('down', c, size) : startsAcross ? clueNumber('across', r, size) : 0;
              // Tint publicly-solved cells by their claimant.
              const ownerId = state.solvedBy[clueKey('across', r)] ?? state.solvedBy[clueKey('down', c)];
              const tint = pub && ownerId ? colorForSeat(seatOf(ownerId)) : null;
              return (
                <div
                  key={key}
                  onClick={() => setSel({ dir: sel?.dir === 'down' ? 'down' : 'across', index: sel?.dir === 'down' ? c : r })}
                  className={cn(
                    'relative flex items-center justify-center select-none cursor-pointer',
                    'w-[15vw] h-[15vw] max-w-[58px] max-h-[58px] sm:w-14 sm:h-14',
                  )}
                  style={{
                    background: inSel ? '#3a2a10' : tint ? `${tint}26` : '#0F1117',
                    boxShadow: inSel ? 'inset 0 0 0 2px #FFD166' : 'none',
                  }}
                >
                  {num > 0 && (
                    <span className="absolute top-0.5 left-1 text-[8px] sm:text-[9px] font-mono text-[#6B7280] leading-none">{num}</span>
                  )}
                  <span
                    className={cn('text-lg sm:text-2xl font-black uppercase', mineReveal && !pub ? 'text-[#FFD166]' : 'text-[#F5F6F7]')}
                  >
                    {letter}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280] text-center mt-2">
            Tap a clue or a cell to select · fill the grid to end the race
          </p>
        </div>

        {/* Answer panel + clue lists */}
        <div className="w-full max-w-md flex flex-col gap-4">
          {/* Selected clue / answer entry */}
          <div className="border-2 border-[#39414E] bg-[#14171D] p-3">
            {!selClue ? (
              <p className="text-xs font-mono uppercase tracking-widest text-[#8A92A0] text-center py-2">
                Select a clue to answer it
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#8A92A0]">
                    {clueNumber(sel!.dir, sel!.index, size)} {sel!.dir === 'across' ? 'Across' : 'Down'}
                  </span>
                  <span className="text-[10px] font-mono text-[#6B7280]">{selClue.answer.length} letters</span>
                </div>
                <p className="text-sm text-[#E2E4E8] leading-snug">{selClue.clue}</p>

                {/* Known-letters preview */}
                <div className="flex gap-1 flex-wrap">
                  {selKnown.map((ch, i) => (
                    <span
                      key={i}
                      className="w-6 h-7 flex items-center justify-center border-2 border-[#39414E] text-sm font-black text-[#FFD166] bg-[#0F1117]"
                    >
                      {ch || ''}
                    </span>
                  ))}
                </div>

                {selSolvedBy ? (
                  <div className="text-xs font-mono font-bold uppercase tracking-widest py-1" style={{ color: colorForSeat(seatOf(selSolvedBy)) }}>
                    ✓ Claimed by {nameOf(selSolvedBy)}
                  </div>
                ) : selLocked ? (
                  <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#E63946] py-1">
                    🔒 You're locked out of this word
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, selClue.answer.length))}
                        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                        placeholder={`${selClue.answer.length} letters…`}
                        maxLength={selClue.answer.length}
                        autoFocus
                        className={cn(
                          'flex-1 min-w-0 bg-[#0F1117] border-2 px-3 py-2 text-sm font-mono font-bold uppercase tracking-[0.3em] text-[#F5F6F7] outline-none',
                          myBadGuess ? 'border-[#E63946]' : 'border-[#39414E] focus:border-[#5B6472]',
                        )}
                      />
                      <button
                        onClick={submit}
                        disabled={draft.replace(/[^A-Za-z]/g, '').length !== selClue.answer.length}
                        className="px-3 py-2 font-black uppercase tracking-widest text-xs text-[#0F1117] bg-[#06D6A0] border-2 border-[#39414E] disabled:opacity-40 active:translate-y-0.5"
                      >
                        Go
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'hint', dir: sel!.dir, index: sel!.index })}
                        disabled={myHints <= 0}
                        title={myHints > 0 ? `Reveal a letter (${myHints} left)` : 'No hints left'}
                        className="px-3 py-2 font-black uppercase tracking-widest text-xs text-[#0F1117] bg-[#FFD166] border-2 border-[#39414E] disabled:opacity-40 active:translate-y-0.5"
                      >
                        🔍 {myHints}
                      </button>
                    </div>
                    {myBadGuess && (
                      <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#E63946]">
                        {state.hard ? "Nope — you're now locked out of this word." : 'Nope — try again.'}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Clue lists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#8A92A0] mb-1.5">Across</h3>
              <div className="flex flex-col gap-1">{clueList('across')}</div>
            </div>
            <div>
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#8A92A0] mb-1.5">Down</h3>
              <div className="flex flex-col gap-1">{clueList('down')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const crossword: GameDefinition<CrosswordState> = {
  id: 'crossword',
  name: 'Crossword Clash',
  tagline: 'A 2–5 player brain-teaser race — claim words in a shared crossword for points. Normal & Hard modes, plus 3× 🔍 hints each.',
  accent: '#4CC9F0',
  emoji: '🧩',
  minPlayers: 2,
  maxPlayers: 5,
  createInitialState,
  start,
  reducer,
  botMove,
  Board,
  gameOverMessage: (state, myId) => {
    const ids = Object.keys(state.players);
    const scores = state.scores;
    const mine = scores[myId] ?? 0;
    if (state.winnerId === myId) {
      const tied = ids.filter((id) => id !== myId && (scores[id] ?? 0) === mine).length > 0;
      return tied ? `🏆 Tied at the top — ${mine} pts!` : `🏆 You claimed the most — ${mine} pts!`;
    }
    const w = state.winnerId ?? '';
    return `${state.players[w]?.name ?? 'Someone'} won with ${scores[w] ?? 0} pts — you had ${mine}.`;
  },
};
