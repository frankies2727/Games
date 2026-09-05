export interface Question {
  id: string;
  question: string;
  /** Answer choices as authored; `correctAnswerIndex` points at the right one. */
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export type Screen = 'start' | 'playing' | 'results';
