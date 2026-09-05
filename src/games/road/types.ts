import { BaseState, GameStatus, Player } from '../../types';
import { Category } from './questions';

// A source civics question as authored, with the correct answer by index.
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

// One question as dealt into a game: options shuffled, correct answer tracked by
// its new position. `correctIndex` / `explanation` are stripped by the hub's
// `redact` for human viewers until it's safe to show, so the answer key never
// travels to a peer before they've locked in.
export interface DealtQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// ---- which game, and how hard the bots are --------------------------------
export type SubGame = 'trivia' | 'civicpath';
export type Difficulty = 'novice' | 'citizen' | 'scholar';

// Probability a bot answers a civics question correctly, by tier.
export const DIFFICULTY_ACCURACY: Record<Difficulty, number> = {
  novice: 0.45,
  citizen: 0.7,
  scholar: 0.9,
};

// ---- trivia sub-game state ------------------------------------------------
export interface TriviaState {
  deck: DealtQuestion[];
  index: number;
  /** playerId -> chosen option for the current question (-1 = hidden by redact). */
  answers: Record<string, number>;
  scores: Record<string, number>;
  /** True once every player has answered the current question. */
  revealed: boolean;
}

// ---- Civic Path sub-game state --------------------------------------------
export type BotPersona = 'govboty' | 'balanced' | 'scholar' | 'trader';

export interface CivicPlayer {
  resources: Record<Category, number>;
  milestones: number; // 0..3; three unlocks the exam
  passedExam: boolean;
  bot: boolean;
  persona: BotPersona | null;
}

export interface TradeOffer {
  from: string;
  to: string;
  give: Partial<Record<Category, number>>; // from -> to
  want: Partial<Record<Category, number>>; // to -> from
}

// The current player's in-progress citizenship exam (10 questions, 6 to pass).
export interface ExamState {
  taker: string;
  deck: DealtQuestion[];
  index: number;
  correct: number;
  lastAnswer: number | null; // option chosen for the current exam question (-1 hidden)
}

export interface CivicState {
  order: string[]; // seating / turn order
  turn: number; // index into order
  phase: 'question' | 'action' | 'exam';
  /** The question the current player must answer this turn to earn a resource. */
  question: DealtQuestion | null;
  questionCategory: Category | null;
  lastQuestionCorrect: boolean | null; // result of the turn's question (for the UI)
  players: Record<string, CivicPlayer>;
  difficulty: Difficulty;
  trade: TradeOffer | null; // a pending trade awaiting the target's response
  exam: ExamState | null;
  log: string[]; // short activity feed (most recent last)
}

// ---- the umbrella hub state -----------------------------------------------
export interface RoadState extends BaseState {
  /** Chosen in the lobby (defaults to trivia); which sub-game is/would be played. */
  chosen: SubGame;
  /** Bot difficulty for Civic Path, set in the lobby. */
  difficulty: Difficulty;
  trivia: TriviaState | null;
  civic: CivicState | null;
}

// Sub-reducers return their new sub-state plus an optional lift to the hub's
// status/winner, so a sub-game can end the whole match without knowing about
// RoadState.
export interface SubResult<S> {
  state: S;
  status?: GameStatus;
  winnerId?: string | null;
}

export type Players = Record<string, Player>;
