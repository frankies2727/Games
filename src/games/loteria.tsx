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
// Each player gets a 4×4 tabla drawn from the deck. Anyone can "sing" the next
// carta; when a carta you hold is called you drop a frijol (bean) on it. Line up
// a row, column, diagonal, the four corners, or fill the whole tabla, then shout
// "¡LOTERÍA!". The deck's un-sung tail is redacted so nobody can peek ahead.
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

// Winning patterns on a 4×4 tabla (cell indexes 0..15).
const ROWS = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]];
const COLS = [[0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15]];
const DIAGS = [[0, 5, 10, 15], [3, 6, 9, 12]];
const CORNERS = [[0, 3, 12, 15]];
const FULL = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]];
const PATTERNS: { cells: number[]; label: string }[] = [
  ...FULL.map((cells) => ({ cells, label: 'Tabla llena' })),
  ...ROWS.map((cells) => ({ cells, label: 'Línea' })),
  ...COLS.map((cells) => ({ cells, label: 'Línea' })),
  ...DIAGS.map((cells) => ({ cells, label: 'Diagonal' })),
  ...CORNERS.map((cells) => ({ cells, label: 'Cuatro esquinas' })),
];

// Patterns the given marks complete (all cells beaned).
function completedPatterns(marks: boolean[]): { cells: number[]; label: string }[] {
  return PATTERNS.filter((p) => p.cells.every((i) => marks[i]));
}
const hasWin = (marks: boolean[]) => completedPatterns(marks).length > 0;

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface LoteriaState extends BaseState {
  deck: string[];                       // full call order (tail redacted from players)
  drawn: number;                        // how many cartas have been sung
  total: number;                        // deck.length (survives redaction)
  tablas: Record<string, string[]>;     // 16 carta ids per player
  marks: Record<string, boolean[]>;     // 16 beans per player
  lastClaim: { pid: string; ok: boolean; label: string | null } | null;
}

function createInitialState(roomId: string): LoteriaState {
  return {
    roomId,
    status: 'waiting',
    players: {},
    winnerId: null,
    deck: [],
    drawn: 0,
    total: DECK.length,
    tablas: {},
    marks: {},
    lastClaim: null,
  };
}

function start(state: LoteriaState): LoteriaState {
  const ids = Object.keys(state.players);
  const deck = shuffled(DECK.map((c) => c.id));
  const tablas: Record<string, string[]> = {};
  const marks: Record<string, boolean[]> = {};
  for (const id of ids) {
    // Each player's tabla is its own independent 16-carta sample of the deck.
    tablas[id] = shuffled(DECK.map((c) => c.id)).slice(0, TABLA_SIZE);
    marks[id] = Array(TABLA_SIZE).fill(false);
  }
  return {
    ...state,
    status: 'playing',
    winnerId: null,
    deck,
    drawn: 0,
    total: deck.length,
    tablas,
    marks,
    lastClaim: null,
  };
}

function reducer(state: LoteriaState, pid: string, action: GameAction): LoteriaState {
  if (state.status !== 'playing') return state;

  // Sing the next carta. Anyone at the table can be the cantor.
  if (action.type === 'draw') {
    if (state.drawn >= state.deck.length) return state;
    return { ...state, drawn: state.drawn + 1 };
  }

  // Drop / lift a frijol. Only cartas already sung can be beaned.
  if (action.type === 'mark') {
    const tabla = state.tablas[pid];
    const marks = state.marks[pid];
    if (!tabla || !marks) return state;
    const index = action.index as number;
    if (index < 0 || index >= TABLA_SIZE) return state;
    const called = new Set(state.deck.slice(0, state.drawn));
    // Lifting a bean is always allowed; placing one requires the carta be sung.
    if (!marks[index] && !called.has(tabla[index])) return state;
    const next = marks.slice();
    next[index] = !next[index];
    return { ...state, marks: { ...state.marks, [pid]: next }, lastClaim: null };
  }

  // Shout "¡Lotería!". Valid only if a full pattern is beaned AND every one of
  // those cartas was actually sung — no cheating a bean onto an un-called carta.
  if (action.type === 'loteria') {
    const tabla = state.tablas[pid];
    const marks = state.marks[pid];
    if (!tabla || !marks) return state;
    const called = new Set(state.deck.slice(0, state.drawn));
    const won = completedPatterns(marks).find((p) => p.cells.every((i) => called.has(tabla[i])));
    if (won) {
      return { ...state, status: 'gameover', winnerId: pid, lastClaim: { pid, ok: true, label: won.label } };
    }
    return { ...state, lastClaim: { pid, ok: false, label: null } };
  }

  return state;
}

// Bot cantor + player: mark anything it can, claim the moment it can win, and
// otherwise keep the game moving by singing the next carta.
function botMove(state: LoteriaState, botId: string): GameAction | null {
  if (state.status !== 'playing') return null;
  const tabla = state.tablas[botId];
  const marks = state.marks[botId];
  if (!tabla || !marks) return null;
  const called = new Set(state.deck.slice(0, state.drawn));

  for (let i = 0; i < TABLA_SIZE; i++) {
    if (!marks[i] && called.has(tabla[i])) return { type: 'mark', index: i };
  }
  if (hasWin(marks)) return { type: 'loteria' };
  if (state.drawn < state.total) return { type: 'draw' };
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
            <div className="text-sm font-mono uppercase tracking-widest text-[#8A92A0]">
              Canta la primera carta
            </div>
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
  canPlay: boolean;
  glow: boolean;
  onClick: () => void;
}

function TablaCell({ carta, called, marked, canPlay, glow, onClick }: TablaCellProps) {
  return (
    <button
      disabled={!canPlay}
      onClick={onClick}
      className={cn(
        'relative aspect-[3/4] border-2 flex flex-col items-center justify-center gap-0.5 p-1 transition-all touch-manipulation overflow-hidden',
        'bg-[#12151C] border-[#39414E]',
        !called && 'opacity-40 grayscale',
        called && !marked && 'hover:bg-[#1E222B] active:translate-y-0.5',
        marked && 'border-[#F72585] bg-[#F72585]/10',
        glow && 'ring-2 ring-[#FFD60A] ring-offset-1 ring-offset-[#0F1117]',
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

function Board({ state, myId, dispatch }: BoardProps<LoteriaState>) {
  const opponent = Object.values(state.players).find((p) => p.id !== myId);
  const tabla: string[] = state.tablas[myId] ?? [];
  const marks: boolean[] = state.marks[myId] ?? Array<boolean>(TABLA_SIZE).fill(false);
  const called = new Set(state.deck.slice(0, state.drawn));
  const currentCarta = state.drawn > 0 ? CARTA[state.deck[state.drawn - 1]] ?? null : null;

  const done = completedPatterns(marks);
  const glowCells = new Set<number>(done.flatMap((p) => p.cells));
  const iCanWin = done.length > 0;
  const deckEmpty = state.drawn >= state.total;

  const myBeans = marks.filter(Boolean).length;
  const oppMarks = opponent ? state.marks[opponent.id] ?? [] : [];
  const oppBeans = oppMarks.filter(Boolean).length;

  const claim = state.lastClaim;
  const badClaimByMe = claim && !claim.ok && claim.pid === myId;

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 max-w-2xl mx-auto w-full">
      <div className="w-full flex flex-col items-center mb-6 border-b-2 border-[#39414E] pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase italic text-[#F5F6F7]">
          Lotería <span className="not-italic" style={{ color: ACCENT }}>Millennial</span>
        </h1>
        <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">Room ID: #{state.roomId}</span>
      </div>

      {/* Bean count scoreboard */}
      <div className="flex items-stretch gap-3 w-full max-w-md mb-6">
        <div className="flex-1 border-2 border-[#39414E] p-2 text-center bg-[#F72585]/10">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF] truncate">You 🫘</div>
          <div className="text-2xl font-black font-mono text-[#F5F6F7]">{myBeans}<span className="text-sm text-[#8A92A0]">/{TABLA_SIZE}</span></div>
        </div>
        {opponent && (
          <div className="flex-1 border-2 border-[#39414E] p-2 text-center bg-[#1A1D24]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF] truncate">{opponent.name} 🫘</div>
            <div className="text-2xl font-black font-mono text-[#F5F6F7]">{oppBeans}<span className="text-sm text-[#8A92A0]">/{TABLA_SIZE}</span></div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <CalledCard carta={currentCarta} count={state.drawn} total={state.total} />
      </div>

      {/* Cantor control */}
      <button
        onClick={() => dispatch({ type: 'draw' })}
        disabled={deckEmpty}
        className={cn(
          'mb-6 px-8 py-3 font-black uppercase tracking-[0.2em] border-2 border-[#39414E] text-white transition-all',
          deckEmpty
            ? 'bg-[#1A1D24] text-[#5B6472] cursor-not-allowed'
            : 'bg-[#262B34] shadow-[4px_4px_0px_#06D6A0] hover:shadow-[2px_2px_0px_#06D6A0] active:translate-y-1 active:shadow-none',
        )}
      >
        {deckEmpty ? 'Se acabó el mazo' : '🎤 Cantar carta'}
      </button>

      {/* My tabla */}
      <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#8A92A0] mb-2">Tu tabla · toca para poner frijol</span>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full max-w-md">
        {tabla.map((id, i) => {
          const carta = CARTA[id];
          const isCalled = called.has(id);
          return (
            <TablaCell
              key={i}
              carta={carta}
              called={isCalled}
              marked={marks[i]}
              canPlay={marks[i] || isCalled}
              glow={glowCells.has(i)}
              onClick={() => dispatch({ type: 'mark', index: i })}
            />
          );
        })}
      </div>

      {/* Lotería claim */}
      <button
        onClick={() => dispatch({ type: 'loteria' })}
        className={cn(
          'mt-8 w-full max-w-md py-5 font-black uppercase tracking-[0.3em] text-lg border-2 transition-all',
          iCanWin
            ? 'border-[#FFD60A] text-[#0F1117] animate-pulse'
            : 'border-[#39414E] text-white bg-[#262B34] shadow-[4px_4px_0px_#F72585] hover:shadow-[2px_2px_0px_#F72585] active:translate-y-1 active:shadow-none',
        )}
        style={iCanWin ? { background: GOLD, boxShadow: `4px 4px 0px ${JADE}` } : undefined}
      >
        ¡Lotería!
      </button>

      <div className="h-6 mt-3 text-center">
        {badClaimByMe ? (
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E63946]">
            ¡Falsa alarma! Aún no tienes línea.
          </span>
        ) : iCanWin ? (
          <span className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            {done[0].label} completa — ¡grítalo!
          </span>
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
            Gana con línea · diagonal · 4 esquinas · o tabla llena
          </span>
        )}
      </div>
    </div>
  );
}

export const loteria: GameDefinition<LoteriaState> = {
  id: 'loteria',
  name: 'Lotería Millennial',
  tagline: 'Mexican bingo of images with a millennial twist — beans on El Ajolote, El WiFi & tacos. First to a line shouts ¡Lotería!',
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
      ? '🎉 ¡Lotería! You won!'
      : `${state.players[state.winnerId ?? '']?.name ?? 'Opponent'} shouted ¡Lotería! first!`,
};
