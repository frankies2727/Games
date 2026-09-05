import { ExternalGameDefinition, GameDefinition } from '../types';
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
import { crossword } from './crossword';
import { roadToCitizenship } from './road';

// The gallery of available games (most are 2-player; Ludo, Lotería, Crossword &
// Road to Citizenship seat more).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAMES: GameDefinition<any>[] = [paperNumbers, ticTacToe, connectFour, highLow, battleship, dotsAndBoxes, ludo, uno, blackjack, loteria, crossword, roadToCitizenship];

// Games hosted on their own site. They have no in-app state/reducer/board, so
// they live here rather than in GAMES — the gallery renders the same card but
// links out, and /play/<id> redirects to the real site so shared links work.
export const EXTERNAL_GAMES: ExternalGameDefinition[] = [
  {
    id: 'balloon-rumble',
    name: 'Balloon Rumble',
    tagline: 'Night arena. Drop balloons, grab power-ups, last fighter standing.',
    accent: '#C45E12',
    emoji: '🎈',
    href: 'https://pepper-apex-brave-coral.grok.me/',
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const gameById = (id: string): GameDefinition<any> | undefined =>
  GAMES.find((g) => g.id === id);

export const externalGameById = (id: string): ExternalGameDefinition | undefined =>
  EXTERNAL_GAMES.find((g) => g.id === id);
