import { GameDefinition } from '../types';
import { paperNumbers } from './paperNumbers';
import { ticTacToe } from './ticTacToe';
import { connectFour } from './connectFour';
import { highLow } from './highLow';
import { battleship } from './battleship';
import { dotsAndBoxes } from './dotsAndBoxes';
import { ludo } from './ludo';
import { uno } from './uno';
import { blackjack } from './blackjack';
import { loteria } from './loteria';

// The gallery of available games (most are 2-player; Ludo seats 2–4).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAMES: GameDefinition<any>[] = [paperNumbers, ticTacToe, connectFour, highLow, battleship, dotsAndBoxes, ludo, uno, blackjack, loteria];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const gameById = (id: string): GameDefinition<any> | undefined =>
  GAMES.find((g) => g.id === id);
