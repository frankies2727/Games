import { useState } from 'react';
import { BaseState, BoardProps, GameAction, GameDefinition } from '../types';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Lotería Millennial — a dark-mode take on the Mexican bingo of images.
//
// Born on a trip to CDMX: the deck mixes classic Lotería cartas with millennial
// chaos (WiFi, aguacate, mezcal, selfie) and a few very personal cartas — El
// Ajolote (the axolotl of Xochimilco), La Piedra del Sol at the Museo Nacional
// de Antropología, La Ciudadela's artesanías, and La Casa de Tacuba (Calle
// Tacuba 28, Centro).
//
// Each player gets a 4×4 tabla drawn from the deck. One carta is sung at a time;
// the slot flashes on your tabla if you hold it, you drop a frijol (bean) on it,
// then everyone taps LISTO — the next carta is only sung once BOTH players are
// ready. Fill the WHOLE tabla, then shout "¡LOTERÍA!".
//
// FRENZY MODE adds power-ups: reach 4 beans to earn a COMODÍN (drop one free
// wild bean anywhere) and complete a full row to earn a TÓMBOLA (auto-fill two
// of your neediest slots). The deck's un-sung tail is redacted so nobody peeks.
// ---------------------------------------------------------------------------

interface Carta {
  id: string;
  name: string;   // Spanish name as the cantor calls it
  emoji: string;
  verse: string;  // the cantor's little canto
}

// 30 cartas. Tablas take 16 of them, so every carta on a board is guaranteed to
// come up in the deck. Classic + millennial + personal (the trip cartas).
const DECK: Carta[] = [
  { id: 'ajolote',   name: 'El Ajolote',        emoji: '🦎', verse: 'El que sonríe bajo el agua de Xochimilco.' },
  { id: 'piedrasol', name: 'La Piedra del Sol', emoji: '🗿', verse: 'El calendario que guarda el Museo de Antropología.' },
  { id: 'tacuba',    name: 'La Casa de Tacuba', emoji: '🏠', verse: 'Calle Tacuba 28, Centro — donde dormimos.' },
  { id: 'ciudadela', name: 'La Ciudadela',      emoji: '🧶', verse: 'Puro arte hecho a mano en la artesanía.' },
  { id: 'museo',     name: 'El Museo',          emoji: '🏛️', verse: 'Toda la historia bajo un mismo techo.' },
  { id: 'gallo',     name: 'El Gallo',          emoji: '🐓', verse: 'El que despierta a todo el vecindario.' },
  { id: 'corazon',   name: 'El Corazón',        emoji: '❤️', verse: 'No me extrañes, corazón.' },
  { id: 'sirena',    name: 'La Sirena',         emoji: '🧜‍♀️', verse: 'Con los cantos de sirena no te enamores.' },
  { id: 'catrina',   name: 'La Catrina',        emoji: '💀', verse: 'La flaca elegante que a todos empareja.' },
  { id: 'nopal',     name: 'El Nopal',          emoji: '🌵', verse: 'Al nopal lo van a ver sólo cuando tiene tunas.' },
  { id: 'sol',       name: 'El Sol',            emoji: '☀️', verse: 'La cobija de los pobres.' },
  { id: 'luna',      name: 'La Luna',           emoji: '🌙', verse: 'El farol de los enamorados.' },
  { id: 'rana',      name: 'La Rana',           emoji: '🐸', verse: 'Al ver a la verde rana.' },
  { id: 'alacran',   name: 'El Alacrán',        emoji: '🦂', verse: 'El que con la cola pica, le dan una paliza.' },
  { id: 'rosa',      name: 'La Rosa',           emoji: '🌹', verse: 'Rosita, Rosaura.' },
  { id: 'estrella',  name: 'La Estrella',       emoji: '⭐', verse: 'La guía de los marineros.' },
  { id: 'sandia',    name: 'La Sandía',         emoji: '🍉', verse: 'La barriga que Juan tenía.' },
  { id: 'mano',      name: 'La Mano',           emoji: '✋', verse: 'La mano de un criminal.' },
  { id: 'venado',    name: 'El Venado',         emoji: '🦌', verse: 'Saltando va buscando.' },
  { id: 'corona',    name: 'La Corona',         emoji: '👑', verse: 'El sombrero de los reyes.' },
  { id: 'bandera',   name: 'La Bandera',        emoji: '🇲🇽', verse: 'Verde, blanco y colorado.' },
  { id: 'campana',   name: 'La Campana',        emoji: '🔔', verse: 'Tú con la campana y yo con tu hermana.' },
  { id: 'wifi',      name: 'El WiFi',           emoji: '📶', verse: 'Sin señal no hay lotería, mija.' },
  { id: 'aguacate',  name: 'El Aguacate',       emoji: '🥑', verse: 'Vale más que el oro… y que el guac lleva extra.' },
  { id: 'tacos',     name: 'Los Tacos',         emoji: '🌮', verse: '¿De qué los va a querer? Al pastor, obvio.' },
  { id: 'mezcal',    name: 'El Mezcal',         emoji: '🍸', verse: 'Para todo mal, mezcal; para todo bien, también.' },
  { id: 'chela',     name: 'La Chela',          emoji: '🍺', verse: 'Bien fría, con limón y sal.' },
  { id: 'selfie',    name: 'El Selfie',         emoji: '🤳', verse: 'Si no hay foto, no pasó.' },
  { id: 'elote',     name: 'El Elote',          emoji: '🌽', verse: 'Con mayonesa, queso y chile del bueno.' },
  { id: 'lucha',     name: 'El Luchador',       emoji: '🤼', verse: 'Máscara contra cabellera.' },
];

const CARTA = Object.fromEntries(DECK.map((c) => [c.id, c])) as Record<string, Carta>;

const TABLA_SIZE = 16; // 4×4
const FOUR_BEANS = 4;  // Frenzy: beans that earn a Comodín
const TOMBOLA_FILL = 2; // Frenzy: slots a Tómbola fills

// Rows of the 4×4 tabla (used for the Frenzy full-row power-up).
const ROWS = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]];
const hasFullRow = (marks: boolean[]) => ROWS.some((r) => r.every((i) => marks[i]));
const completedRowCells = (marks: boolean[]) => new Set(ROWS.filter((r) => r.every((i) => marks[i])).flat());

interface Powerups { comodin: number; tombola: number }
interface Earned { four: boolean; row: boolean }

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface LoteriaState extends BaseState {
  phase: 'choosing' | 'playing';        // pick Clásico / Frenzy, then play
  frenzy: boolean;
  deck: string[];                       // full call order (tail redacted from players)
  drawn: number;                        // how many cartas have been sung
  total: number;                        // deck.length (survives redaction)
  tablas: Record<string, string[]>;     // 16 carta ids per player
  marks: Record<string, boolean[]>;     // 16 beans per player
  ready: Record<string, boolean>;       // per-round: who's ready for the next carta
  powerups: Record<string, Powerups>;   // Frenzy tokens in hand
  earned: Record<string, Earned>;       // which milestones already fired
  lastClaim: { pid: string; ok: boolean } | null;
}

function createInitialState(roomId: string): LoteriaState {
  return {
    roomId,
    status: 'waiting',
    players: {},
    winnerId: null,
    phase: 'choosing',
    frenzy: false,
    deck: [],
    drawn: 0,
    total: DECK.length,
    tablas: {},
    marks: {},
    ready: {},
    powerups: {},
    earned: {},
    lastClaim: null,
  };
}

// Waiting -> playing drops into the mode chooser; the tablas are dealt once a
// mode is picked (so a rematch re-picks the mode too).
function start(state: LoteriaState): LoteriaState {
  return {
    ...state,
    status: 'playing',
    phase: 'choosing',
    frenzy: false,
    deck: [],
    drawn: 0,
    total: DECK.length,
    tablas: {},
    marks: {},
    ready: {},
    powerups: {},
    earned: {},
    lastClaim: null,
  };
}

// Frenzy: award tokens when a player first crosses a milestone. Fires each
// milestone once (tracked in `earned`); returns the same state if nothing new.
function grantPowerups(state: LoteriaState, pid: string): LoteriaState {
  if (!state.frenzy) return state;
  const marks = state.marks[pid];
  if (!marks) return state;
  const beans = marks.filter(Boolean).length;
  const earned: Earned = { ...state.earned[pid] };
  const pu: Powerups = { ...state.powerups[pid] };
  let changed = false;
  if (beans >= FOUR_BEANS && !earned.four) { earned.four = true; pu.comodin += 1; changed = true; }
  if (hasFullRow(marks) && !earned.row) { earned.row = true; pu.tombola += 1; changed = true; }
  if (!changed) return state;
  return {
    ...state,
    earned: { ...state.earned, [pid]: earned },
    powerups: { ...state.powerups, [pid]: pu },
  };
}

function reducer(state: LoteriaState, pid: string, action: GameAction): LoteriaState {
  if (state.status !== 'playing') return state;
  const ids = Object.keys(state.players);

  // ---- Mode selection: only the first player picks, then tablas are dealt. ----
  if (state.phase === 'choosing') {
    if (action.type !== 'mode' || pid !== ids[0]) return state;
    const frenzy = !!action.frenzy;
    const deck = shuffled(DECK.map((c) => c.id));
    const tablas: Record<string, string[]> = {};
    const marks: Record<string, boolean[]> = {};
    const ready: Record<string, boolean> = {};
    const powerups: Record<string, Powerups> = {};
    const earned: Record<string, Earned> = {};
    for (const id of ids) {
      tablas[id] = shuffled(DECK.map((c) => c.id)).slice(0, TABLA_SIZE);
      marks[id] = Array(TABLA_SIZE).fill(false);
      ready[id] = false;
      powerups[id] = { comodin: 0, tombola: 0 };
      earned[id] = { four: false, row: false };
    }
    // Sing the first carta right away so the tabla has something to flash.
    return {
      ...state, phase: 'playing', frenzy, deck, total: deck.length, drawn: 1,
      tablas, marks, ready, powerups, earned, lastClaim: null,
    };
  }

  const called = new Set(state.deck.slice(0, state.drawn));

  // ---- Drop / lift a frijol. Only sung cartas can be beaned by hand. ----
  if (action.type === 'mark') {
    const tabla = state.tablas[pid];
    const marks = state.marks[pid];
    if (!tabla || !marks) return state;
    const index = action.index as number;
    if (index < 0 || index >= TABLA_SIZE) return state;
    if (!marks[index] && !called.has(tabla[index])) return state; // can't place on an un-sung carta
    const next = marks.slice();
    next[index] = !next[index];
    return grantPowerups({ ...state, marks: { ...state.marks, [pid]: next }, lastClaim: null }, pid);
  }

  // ---- Frenzy: Comodín — drop one free wild bean on any empty slot. ----
  if (action.type === 'wild') {
    if (!state.frenzy) return state;
    const pu = state.powerups[pid];
    const marks = state.marks[pid];
    if (!pu || pu.comodin <= 0 || !marks) return state;
    const index = action.index as number;
    if (index < 0 || index >= TABLA_SIZE || marks[index]) return state;
    const next = marks.slice();
    next[index] = true;
    return grantPowerups({
      ...state,
      marks: { ...state.marks, [pid]: next },
      powerups: { ...state.powerups, [pid]: { ...pu, comodin: pu.comodin - 1 } },
      lastClaim: null,
    }, pid);
  }

  // ---- Frenzy: Tómbola — auto-fill two of the neediest slots (un-sung first). ----
  if (action.type === 'tombola') {
    if (!state.frenzy) return state;
    const pu = state.powerups[pid];
    const tabla = state.tablas[pid];
    const marks = state.marks[pid];
    if (!pu || pu.tombola <= 0 || !tabla || !marks) return state;
    const unmarked = marks.map((m, i) => (m ? -1 : i)).filter((i) => i >= 0);
    if (unmarked.length === 0) return state;
    // Prefer slots whose carta hasn't been sung yet — that's the real shortcut.
    unmarked.sort((a, b) => (called.has(tabla[a]) ? 1 : 0) - (called.has(tabla[b]) ? 1 : 0));
    const next = marks.slice();
    for (const i of unmarked.slice(0, TOMBOLA_FILL)) next[i] = true;
    return grantPowerups({
      ...state,
      marks: { ...state.marks, [pid]: next },
      powerups: { ...state.powerups, [pid]: { ...pu, tombola: pu.tombola - 1 } },
      lastClaim: null,
    }, pid);
  }

  // ---- Ready up. When everyone's ready, the next carta is sung automatically. ----
  if (action.type === 'ready') {
    if (state.ready[pid]) return state;
    const ready = { ...state.ready, [pid]: true };
    const allReady = ids.every((id) => ready[id]);
    if (allReady && state.drawn < state.total) {
      const cleared: Record<string, boolean> = {};
      for (const id of ids) cleared[id] = false;
      return { ...state, drawn: state.drawn + 1, ready: cleared, lastClaim: null };
    }
    return { ...state, ready };
  }

  // ---- Shout ¡Lotería! — valid only with a completely full tabla. ----
  if (action.type === 'loteria') {
    const marks = state.marks[pid];
    if (!marks) return state;
    if (marks.every(Boolean)) {
      return { ...state, status: 'gameover', winnerId: pid, lastClaim: { pid, ok: true } };
    }
    return { ...state, lastClaim: { pid, ok: false } };
  }

  return state;
}

// Bot cantor + player: pick a mode if it's ever seated first, mark cartas it
// holds, spend Frenzy power-ups, claim the moment its tabla is full, and ready
// up each round so the game keeps moving.
function botMove(state: LoteriaState, botId: string): GameAction | null {
  if (state.status !== 'playing') return null;
  const ids = Object.keys(state.players);

  if (state.phase === 'choosing') {
    return ids[0] === botId ? { type: 'mode', frenzy: true } : null;
  }

  const tabla = state.tablas[botId];
  const marks = state.marks[botId];
  if (!tabla || !marks) return null;
  const called = new Set(state.deck.slice(0, state.drawn));

  // 1) Mark any sung carta it still holds unbeaned.
  for (let i = 0; i < TABLA_SIZE; i++) {
    if (!marks[i] && called.has(tabla[i])) return { type: 'mark', index: i };
  }

  // 2) Spend Frenzy power-ups on the slots it can't yet reach.
  if (state.frenzy) {
    const pu = state.powerups[botId] ?? { comodin: 0, tombola: 0 };
    const unmarked = marks.map((m, i) => (m ? -1 : i)).filter((i) => i >= 0);
    if (pu.comodin > 0 && unmarked.length > 0) {
      const target = unmarked.find((i) => !called.has(tabla[i])) ?? unmarked[0];
      return { type: 'wild', index: target };
    }
    if (pu.tombola > 0 && unmarked.length > 0) return { type: 'tombola' };
  }

  // 3) Full tabla -> shout it.
  if (marks.every(Boolean)) return { type: 'loteria' };

  // 4) Otherwise ready up for the next carta.
  if (!state.ready[botId]) return { type: 'ready' };
  return null;
}

// Hide the un-sung tail of the deck so no player can read the upcoming cartas
// off the wire. `total` keeps the counter honest.
function redact(state: LoteriaState, _viewerId: string): LoteriaState {
  return { ...state, deck: state.deck.slice(0, state.drawn) };
}

// ---------------------------------------------------------------------------

const ACCENT = '#F72585';   // rosa mexicano
const GOLD = '#FFD60A';
const JADE = '#06D6A0';

function ModeChooser({ myTurn, chooserName, dispatch }: { myTurn: boolean; chooserName: string; dispatch: (a: GameAction) => void }) {
  return (
    <div className="flex flex-col items-center p-4 sm:p-8 max-w-md mx-auto w-full">
      <div className="w-full flex flex-col items-center mb-8 border-b-2 border-[#39414E] pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#F5F6F7]">Lotería</h1>
        <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">Choose your mode</span>
      </div>

      {myTurn ? (
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => dispatch({ type: 'mode', frenzy: false })}
            className="w-full p-6 text-left bg-[#1A1D24] hover:bg-[#262B34] active:translate-y-1 transition-all border-2 border-[#39414E] shadow-[4px_4px_0px_#454C5A] hover:shadow-[2px_2px_0px_#454C5A]"
          >
            <div className="text-xl font-bold uppercase tracking-wider text-[#F5F6F7]">🎴 Clásico</div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF] mt-2">
              Sing the cartas · fill the whole tabla · shout ¡Lotería!
            </div>
          </button>
          <button
            onClick={() => dispatch({ type: 'mode', frenzy: true })}
            className="w-full p-6 text-left bg-[#1A1D24] hover:bg-[#262B34] active:translate-y-1 transition-all border-2 border-[#39414E]"
            style={{ boxShadow: `4px 4px 0px ${ACCENT}` }}
          >
            <div className="text-xl font-bold uppercase tracking-wider text-[#F5F6F7]">⚡ Frenzy</div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF] mt-2">
              Classic + power-ups: 🃏 Comodín at 4 beans · 🎰 Tómbola on a full row
            </div>
          </button>
        </div>
      ) : (
        <p className="text-sm font-mono uppercase tracking-widest text-[#9CA3AF] animate-pulse text-center">
          Waiting for {chooserName} to pick a mode…
        </p>
      )}
    </div>
  );
}

function CalledCard({ carta, count, total }: { carta: Carta | null; count: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#8A92A0]">
        La carta cantada · {count}/{total}
      </span>
      <div
        className="relative w-44 sm:w-52 border-2 border-[#39414E] bg-[#12151C] px-4 py-5 flex flex-col items-center gap-2 text-center"
        style={{ boxShadow: `6px 6px 0px ${ACCENT}` }}
      >
        {carta ? (
          <>
            <div className="text-6xl sm:text-7xl leading-none">{carta.emoji}</div>
            <div className="text-lg font-black uppercase tracking-tight text-[#F5F6F7]">{carta.name}</div>
            <div className="text-[11px] italic leading-snug text-[#9CA3AF]">“{carta.verse}”</div>
          </>
        ) : (
          <>
            <div className="text-6xl sm:text-7xl leading-none opacity-40">🎴</div>
            <div className="text-sm font-mono uppercase tracking-widest text-[#8A92A0]">La primera carta</div>
          </>
        )}
      </div>
    </div>
  );
}

interface TablaCellProps {
  key?: number;
  carta: Carta;
  called: boolean;
  marked: boolean;
  flash: boolean;       // current sung carta sitting on this slot, still unbeaned
  wildTarget: boolean;  // Comodín is armed and this empty slot can take it
  rowGlow: boolean;     // part of a completed row (Frenzy feedback)
  canPlay: boolean;
  onClick: () => void;
}

function TablaCell({ carta, called, marked, flash, wildTarget, rowGlow, canPlay, onClick }: TablaCellProps) {
  return (
    <button
      disabled={!canPlay}
      onClick={onClick}
      className={cn(
        'relative aspect-[3/4] border-2 flex flex-col items-center justify-center gap-0.5 p-1 transition-all touch-manipulation overflow-hidden',
        'bg-[#12151C] border-[#39414E]',
        !called && !marked && 'opacity-40 grayscale',
        called && !marked && 'hover:bg-[#1E222B] active:translate-y-0.5',
        marked && 'border-[#F72585] bg-[#F72585]/10',
        rowGlow && 'border-[#06D6A0]',
        flash && 'ring-4 ring-[#FFD60A] ring-offset-1 ring-offset-[#0F1117] animate-pulse z-10',
        wildTarget && 'ring-2 ring-[#06D6A0] ring-offset-1 ring-offset-[#0F1117] opacity-100 grayscale-0',
      )}
      title={carta.name}
    >
      <span className="text-2xl sm:text-4xl leading-none">{carta.emoji}</span>
      <span className="text-[7px] sm:text-[9px] font-bold uppercase tracking-tight text-[#9CA3AF] leading-none text-center line-clamp-1 w-full px-0.5">
        {carta.name}
      </span>
      {marked && (
        <span className="absolute inset-0 flex items-center justify-center text-3xl sm:text-5xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] pointer-events-none">
          🫘
        </span>
      )}
    </button>
  );
}

function Powerup({ label, emoji, count, active, onClick }: { label: string; emoji: string; count: number; active: boolean; onClick: () => void }) {
  const usable = count > 0;
  return (
    <button
      disabled={!usable}
      onClick={onClick}
      className={cn(
        'flex-1 border-2 px-3 py-2 flex flex-col items-center gap-0.5 transition-all',
        usable ? 'border-[#06D6A0] bg-[#06D6A0]/10 text-white active:translate-y-0.5' : 'border-[#39414E] bg-[#12151C] text-[#5B6472] cursor-not-allowed',
        active && 'ring-2 ring-[#06D6A0] ring-offset-1 ring-offset-[#0F1117]',
      )}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{label} ×{count}</span>
      {active && <span className="text-[8px] font-mono uppercase tracking-widest text-[#06D6A0]">tap a slot</span>}
    </button>
  );
}

function Board({ state, myId, dispatch }: BoardProps<LoteriaState>) {
  const [armedWild, setArmedWild] = useState(false);
  const ids = Object.keys(state.players);

  if (state.phase === 'choosing') {
    const chooser = state.players[ids[0]];
    return <ModeChooser myTurn={myId === ids[0]} chooserName={chooser?.name ?? 'opponent'} dispatch={dispatch} />;
  }

  const opponent = Object.values(state.players).find((p) => p.id !== myId);
  const tabla: string[] = state.tablas[myId] ?? [];
  const marks: boolean[] = state.marks[myId] ?? Array<boolean>(TABLA_SIZE).fill(false);
  const called = new Set(state.deck.slice(0, state.drawn));
  const currentId = state.drawn > 0 ? state.deck[state.drawn - 1] : null;
  const currentCarta = currentId ? CARTA[currentId] ?? null : null;
  const currentIdx = currentId ? tabla.indexOf(currentId) : -1;

  const beans = marks.filter(Boolean).length;
  const full = beans === TABLA_SIZE;
  const oppMarks = opponent ? state.marks[opponent.id] ?? [] : [];
  const oppBeans = oppMarks.filter(Boolean).length;

  const pu: Powerups = state.powerups[myId] ?? { comodin: 0, tombola: 0 };
  const iReady = !!state.ready[myId];
  const oppReady = opponent ? !!state.ready[opponent.id] : false;
  const deckDone = state.drawn >= state.total;
  const rowGlow = state.frenzy ? completedRowCells(marks) : new Set<number>();

  const claim = state.lastClaim;
  const badClaimByMe = claim && !claim.ok && claim.pid === myId;

  const onCell = (i: number) => {
    if (armedWild) {
      if (!marks[i]) { dispatch({ type: 'wild', index: i }); setArmedWild(false); }
      return;
    }
    dispatch({ type: 'mark', index: i });
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 max-w-2xl mx-auto w-full">
      <div className="w-full flex flex-col items-center mb-4 border-b-2 border-[#39414E] pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#F5F6F7]">
          Lotería <span className="not-italic" style={{ color: ACCENT }}>{state.frenzy ? 'Frenzy ⚡' : 'Clásico'}</span>
        </h1>
        <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">Room ID: #{state.roomId}</span>
      </div>

      {/* Bean-count scoreboard */}
      <div className="flex items-stretch gap-3 w-full max-w-md mb-4">
        <div className="flex-1 border-2 border-[#39414E] p-2 text-center bg-[#F72585]/10">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF] truncate">You 🫘</div>
          <div className="text-2xl font-black font-mono text-[#F5F6F7]">{beans}<span className="text-sm text-[#8A92A0]">/{TABLA_SIZE}</span></div>
        </div>
        {opponent && (
          <div className="flex-1 border-2 border-[#39414E] p-2 text-center bg-[#1A1D24]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF] truncate">{opponent.name} 🫘</div>
            <div className="text-2xl font-black font-mono text-[#F5F6F7]">{oppBeans}<span className="text-sm text-[#8A92A0]">/{TABLA_SIZE}</span></div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <CalledCard carta={currentCarta} count={state.drawn} total={state.total} />
      </div>

      {/* Round gate: flash your slot, bean it, then tap Listo. */}
      <div className="w-full max-w-md flex flex-col items-center gap-2 mb-5">
        {deckDone ? (
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#8A92A0] text-center">
            Todas las cartas cantadas — termina tu tabla
          </p>
        ) : (
          <>
            <button
              onClick={() => dispatch({ type: 'ready' })}
              disabled={iReady}
              className={cn(
                'w-full py-3 font-black uppercase tracking-[0.2em] border-2 border-[#39414E] transition-all',
                iReady
                  ? 'bg-[#1A1D24] text-[#5B6472] animate-pulse cursor-default'
                  : 'bg-[#262B34] text-white shadow-[4px_4px_0px_#06D6A0] hover:shadow-[2px_2px_0px_#06D6A0] active:translate-y-1 active:shadow-none',
              )}
            >
              {iReady ? 'Esperando…' : '✓ Listo · siguiente carta'}
            </button>
            {currentIdx >= 0 && !marks[currentIdx] && (
              <p className="text-[11px] font-mono uppercase tracking-widest font-bold" style={{ color: GOLD }}>
                ¡La tienes! Toca la carta que parpadea 🫘
              </p>
            )}
            {opponent && (
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
                {opponent.name}: {oppReady ? 'listo ✓' : 'pensando…'}
              </p>
            )}
          </>
        )}
      </div>

      {/* My tabla */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full max-w-md">
        {tabla.map((id, i) => {
          const carta = CARTA[id];
          const isCalled = called.has(id);
          const marked = marks[i];
          return (
            <TablaCell
              key={i}
              carta={carta}
              called={isCalled}
              marked={marked}
              flash={i === currentIdx && !marked}
              wildTarget={armedWild && !marked}
              rowGlow={rowGlow.has(i)}
              canPlay={armedWild ? !marked : marked || isCalled}
              onClick={() => onCell(i)}
            />
          );
        })}
      </div>

      {/* Frenzy power-ups */}
      {state.frenzy && (
        <div className="w-full max-w-md flex gap-3 mt-4">
          <Powerup
            label="Comodín" emoji="🃏" count={pu.comodin} active={armedWild}
            onClick={() => setArmedWild((a) => !a)}
          />
          <Powerup
            label="Tómbola" emoji="🎰" count={pu.tombola} active={false}
            onClick={() => { dispatch({ type: 'tombola' }); setArmedWild(false); }}
          />
        </div>
      )}

      {/* Lotería claim — only once the tabla is completely full. */}
      {full && (
        <button
          onClick={() => dispatch({ type: 'loteria' })}
          className="mt-6 w-full max-w-md py-5 font-black uppercase tracking-[0.3em] text-lg border-2 border-[#FFD60A] text-[#0F1117] animate-pulse"
          style={{ background: GOLD, boxShadow: `4px 4px 0px ${JADE}` }}
        >
          ¡Lotería!
        </button>
      )}

      <div className="h-6 mt-3 text-center">
        {badClaimByMe ? (
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E63946]">
            ¡Falsa alarma! Aún no llenas la tabla.
          </span>
        ) : full ? (
          <span className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            ¡Tabla llena — grítalo!
          </span>
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
            {state.frenzy ? 'Llena toda la tabla · usa tus power-ups' : 'Llena toda la tabla para ganar'}
          </span>
        )}
      </div>
    </div>
  );
}

export const loteria: GameDefinition<LoteriaState> = {
  id: 'loteria',
  name: 'Lotería Millennial',
  tagline: 'Mexican bingo of images with a millennial twist — spot each carta, drop your frijoles, fill the whole tabla. Frenzy mode adds power-ups.',
  accent: ACCENT,
  emoji: '🎴',
  createInitialState,
  start,
  reducer,
  botMove,
  redact,
  Board,
  gameOverMessage: (state, myId) =>
    state.winnerId === myId
      ? '🎉 ¡Lotería! You filled your tabla first!'
      : `${state.players[state.winnerId ?? '']?.name ?? 'Opponent'} shouted ¡Lotería! first!`,
};
