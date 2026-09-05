import { BaseState } from '../../types';

// A source civics question as authored, with the correct answer by index.
export interface Question {
  id: string;
  question: string;
  /** Answer choices as authored; `correctAnswerIndex` points at the right one. */
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

// One question as dealt into a game: options shuffled, correct answer tracked by
// its new position. `correctIndex` and `explanation` are stripped (to -1 / '')
// by the game's `redact` for any question not yet revealed, so the answer key
// never travels to a peer before everyone has locked in their answer.
export interface DealtQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CitizenshipState extends BaseState {
  /** The questions dealt for this game (fixed order once started). */
  deck: DealtQuestion[];
  /** Index of the question currently in play. */
  index: number;
  /**
   * Each player's chosen option index for the *current* question. A player id is
   * present here once they've locked an answer. `redact` hides other players'
   * choices (sets them to -1) until everyone has answered.
   */
  answers: Record<string, number>;
  /** Cumulative score per player id. Only changes at the reveal of each question. */
  scores: Record<string, number>;
  /** True once every player has answered the current question (the shared reveal). */
  revealed: boolean;
}
