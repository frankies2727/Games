export type GameStatus = 'waiting' | 'playing' | 'gameover';

export interface Player {
  id: string;
  name: string;
}

export interface GameState {
  roomId: string;
  status: GameStatus;
  players: Record<string, Player>;
  masterSheet: number[]; // 1 to 100, shuffled
  targetNumber: number | null; // the current number to be found
  finderId: string | null; // player ID currently looking for the number
  playerDots: Record<string, boolean[]>; // string is player ID. array of 64 booleans.
  winnerId: string | null;
}

// Events from Client to Server
export interface ClientToServerEvents {
  join_room: (roomId: string, playerName: string) => void;
  start_game: () => void;
  number_found: (number: number) => void;
  circle_dot: (dotIndex: number) => void;
}

// Events from Server to Client
export interface ServerToClientEvents {
  game_state_update: (state: GameState) => void;
  error: (msg: string) => void;
}
