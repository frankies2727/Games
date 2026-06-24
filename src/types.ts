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

// Peer-to-peer messages exchanged over the WebRTC data channel.
// The room "host" browser is authoritative: it owns the GameState, applies all
// actions, and broadcasts the result. Guests send actions and render state.
export type NetMessage =
  // guest -> host
  | { type: 'join'; name: string }
  | { type: 'start' }
  | { type: 'number_found'; num: number }
  | { type: 'circle_dot'; index: number }
  // host -> guest
  | { type: 'state'; state: GameState }
  | { type: 'error'; msg: string };

export type ConnStatus = 'idle' | 'connecting' | 'connected';
