import { BoardProps, GameAction, GameDefinition } from '../../types';
import { cn } from '../../lib/utils';
import { CheckCircle2, XCircle, ChevronRight, Landmark, Loader2 } from 'lucide-react';
import { buildDeck } from './questions';
import { CitizenshipState, DealtQuestion } from './types';

// ---------------------------------------------------------------------------
// Citizenship Trivia — a real-time civics quiz for 1 solo player or 2–4 friends
// over a shared room code (no bots, no sign-in). Everyone answers the SAME
// question at the same time; once every player has locked an answer the round
// reveals — the correct choice, a short fact, and each player's result — and
// scores update. Most correct after 10 official USCIS questions wins.
//
// Fair play: the answer key never travels on the wire before a reveal. `redact`
// strips each question's correct index + explanation until the whole room has
// answered, and hides other players' choices until then, so nothing useful
// leaks to a peer's console mid-round.
// ---------------------------------------------------------------------------

// Questions per game — the real USCIS civics interview asks up to 10.
const ROUNDS = 10;

// ---- state transitions ----------------------------------------------------

function createInitialState(roomId: string): CitizenshipState {
  return {
    roomId,
    status: 'waiting',
    players: {},
    winnerId: null,
    deck: [],
    index: 0,
    answers: {},
    scores: {},
    revealed: false,
  };
}

function start(state: CitizenshipState): CitizenshipState {
  const scores: Record<string, number> = {};
  for (const id of Object.keys(state.players)) scores[id] = 0;
  return {
    ...state,
    status: 'playing',
    deck: buildDeck(ROUNDS),
    index: 0,
    answers: {},
    scores,
    revealed: false,
    winnerId: null,
  };
}

// Decide the winner once the deck is exhausted: highest score; a tie at the top
// leaves winnerId null (a draw).
function decideWinner(scores: Record<string, number>): string | null {
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;
  const top = Math.max(...entries.map(([, s]) => s));
  const leaders = entries.filter(([, s]) => s === top).map(([id]) => id);
  return leaders.length === 1 ? leaders[0] : null;
}

function reducer(state: CitizenshipState, playerId: string, action: GameAction): CitizenshipState {
  if (state.status !== 'playing') return state;

  switch (action.type) {
    case 'answer': {
      if (state.revealed) return state; // round already resolved
      if (playerId in state.answers) return state; // one answer per player per round
      const option = action.option;
      const current = state.deck[state.index];
      if (typeof option !== 'number' || option < 0 || option >= current.options.length) return state;

      const answers = { ...state.answers, [playerId]: option };
      const everyoneAnswered =
        Object.keys(answers).length >= Object.keys(state.players).length;

      if (!everyoneAnswered) return { ...state, answers };

      // Reveal: score every answer at once, so scores never move mid-round (and
      // so no score bump hints at the answer before the reveal).
      const scores = { ...state.scores };
      for (const [pid, opt] of Object.entries(answers)) {
        if (opt === current.correctIndex) scores[pid] = (scores[pid] ?? 0) + 1;
      }
      return { ...state, answers, scores, revealed: true };
    }

    case 'next': {
      if (!state.revealed) return state; // can't advance until the round is revealed
      const nextIndex = state.index + 1;
      if (nextIndex >= state.deck.length) {
        return { ...state, status: 'gameover', winnerId: decideWinner(state.scores) };
      }
      return { ...state, index: nextIndex, answers: {}, revealed: false };
    }

    default:
      return state;
  }
}

// Per-viewer masking: keep the answer key off the wire until the whole room has
// answered the current question.
function redact(state: CitizenshipState, viewerId: string): CitizenshipState {
  const deck = state.deck.map((q, i): DealtQuestion => {
    const reveal = i < state.index || (i === state.index && state.revealed);
    return reveal ? q : { ...q, correctIndex: -1, explanation: '' };
  });
  const answers: Record<string, number> = {};
  for (const [pid, opt] of Object.entries(state.answers)) {
    answers[pid] = state.revealed || pid === viewerId ? opt : -1;
  }
  return { ...state, deck, answers };
}

// ---- board ----------------------------------------------------------------

function Board({ state, myId, dispatch }: BoardProps<CitizenshipState>) {
  const players = Object.values(state.players);
  const current = state.deck[state.index];
  if (!current) return null;

  const iAnswered = myId in state.answers;
  const myChoice = state.answers[myId];
  const answeredCount = Object.keys(state.answers).length;
  const total = state.deck.length;
  const revealed = state.revealed;
  const solo = players.length <= 1;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8">
      {/* Header: progress + live scoreboard */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#9CA3AF]">
          <Landmark className="w-4 h-4 text-[#E63946]" />
          Question <span className="text-[#F5F6F7]">{state.index + 1}</span>
          <span className="text-[#4B5563]">/</span>
          {total}
        </div>
        <div className="flex gap-2 overflow-x-auto max-w-full">
          {players.map((p) => {
            const answered = p.id in state.answers;
            const correctThisRound = revealed && state.answers[p.id] === current.correctIndex;
            return (
              <div
                key={p.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 border-2 shrink-0',
                  p.id === myId
                    ? 'border-[#E63946] bg-[#1A1D24]'
                    : 'border-[#39414E] bg-[#1A1D24]',
                )}
              >
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E2E4E8] max-w-[80px] truncate">
                  {p.name}
                  {p.id === myId && <span className="text-[#E63946]"> ·you</span>}
                </span>
                <span className="text-sm font-black text-[#F5F6F7]">{state.scores[p.id] ?? 0}</span>
                {/* Round status dot: ✓/✗ after reveal, else "answered" tick */}
                {revealed ? (
                  correctThisRound ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#06D6A0]" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-[#E63946]" />
                  )
                ) : answered ? (
                  <span className="w-2 h-2 rounded-full bg-[#06D6A0]" title="Answered" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#4B5563]" title="Thinking…" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#1A1D24] border-2 border-[#39414E] shadow-[8px_8px_0px_#454C5A]">
        {/* Accent stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#E63946] via-[#F5F6F7] to-[#3A86FF]" />

        <div className="p-6 md:p-10">
          <h3 className="text-2xl md:text-3xl font-bold text-[#F5F6F7] mb-8 leading-tight">
            {current.question}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {current.options.map((option, i) => {
              const isMyChoice = myChoice === i;
              const isCorrect = revealed && current.correctIndex === i;

              let stateClass = 'bg-[#262B34] border-[#39414E] text-[#E2E4E8] hover:bg-[#323A47]';
              let icon = null;

              if (revealed) {
                if (isCorrect) {
                  stateClass = 'bg-[#06D6A0]/15 border-[#06D6A0] text-[#F5F6F7]';
                  icon = <CheckCircle2 className="text-[#06D6A0]" size={22} />;
                } else if (isMyChoice) {
                  stateClass = 'bg-[#E63946]/15 border-[#E63946] text-[#F5F6F7]';
                  icon = <XCircle className="text-[#E63946]" size={22} />;
                } else {
                  stateClass = 'bg-[#262B34] border-[#2E343F] text-[#6B7280] opacity-60';
                }
              } else if (isMyChoice) {
                stateClass = 'bg-[#3A86FF]/15 border-[#3A86FF] text-[#F5F6F7]';
              }

              return (
                <button
                  key={i}
                  disabled={iAnswered}
                  onClick={() => dispatch({ type: 'answer', option: i })}
                  className={cn(
                    'relative flex items-center justify-between w-full text-left p-5 border-2 font-semibold text-lg transition-all duration-150',
                    !iAnswered && 'hover:-translate-y-0.5 active:translate-y-0 cursor-pointer',
                    stateClass,
                  )}
                >
                  <span className="flex-1 pr-4">{option}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* After I answer but before the room reveals: waiting indicator */}
          {iAnswered && !revealed && !solo && (
            <div className="mt-8 flex items-center justify-center gap-3 text-sm font-mono uppercase tracking-widest text-[#9CA3AF]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Waiting for others… ({answeredCount}/{players.length})
            </div>
          )}

          {/* Reveal: fact + advance */}
          {revealed && (
            <div className="mt-8 bg-[#0F1117] border-2 border-[#2E343F] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="text-[10px] font-mono font-bold text-[#3A86FF] uppercase tracking-widest mb-2">
                  {myChoice === current.correctIndex ? 'Correct!' : 'Fact'}
                </div>
                <p className="text-[#E2E4E8] font-medium text-base leading-relaxed">
                  {current.explanation}
                </p>
              </div>
              <button
                onClick={() => dispatch({ type: 'next' })}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#E63946] hover:bg-[#D90429] active:translate-y-0.5 transition-all text-white font-bold border-2 border-[#39414E] shadow-[4px_4px_0px_#454C5A] hover:shadow-[2px_2px_0px_#454C5A] uppercase tracking-[0.15em] shrink-0"
              >
                {state.index + 1 >= total ? 'See Results' : 'Next'} <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-center mt-6 text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
        Official USCIS civics questions · anyone can tap Next once everyone's answered
      </p>
    </div>
  );
}

export const citizenship: GameDefinition<CitizenshipState> = {
  id: 'citizenship',
  name: 'Citizenship Trivia',
  tagline:
    'Solo or 2–4 friends — race through the official USCIS civics questions. Everyone answers, then the room reveals.',
  accent: '#B22234',
  emoji: '🗽',
  minPlayers: 1,
  maxPlayers: 4,
  createInitialState,
  start,
  reducer,
  redact,
  Board,
  gameOverMessage: (state, myId) => {
    const total = state.deck.length;
    const mine = state.scores[myId] ?? 0;
    const players = Object.keys(state.players).length;
    if (players <= 1) {
      const pct = total ? Math.round((mine / total) * 100) : 0;
      return mine / total >= 0.6
        ? `🎉 You scored ${mine}/${total} (${pct}%) — you'd pass!`
        : `You scored ${mine}/${total} (${pct}%) — keep studying!`;
    }
    if (!state.winnerId) return `It's a tie! You scored ${mine}/${total}.`;
    if (state.winnerId === myId) return `🏆 You win with ${mine}/${total}!`;
    const winnerName = state.players[state.winnerId]?.name ?? 'Someone';
    const winnerScore = state.scores[state.winnerId] ?? 0;
    return `${winnerName} wins with ${winnerScore}/${total} — you had ${mine}.`;
  },
};
