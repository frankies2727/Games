import { GameDefinition } from '../types';
import { paperNumbers } from './paperNumbers';
import { ticTacToe } from './ticTacToe';
import { connectFour } from './connectFour';

// The gallery of available 2-player games.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAMES: GameDefinition<any>[] = [paperNumbers, ticTacToe, connectFour];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const gameById = (id: string): GameDefinition<any> | undefined =>
  GAMES.find((g) => g.id === id);
