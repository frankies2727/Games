import type { ComponentType } from 'react';

// ---- Shared base every game's state extends ----
export type GameStatus = 'waiting' | 'playing' | 'gameover';
export type ConnStatus = 'idle' | 'connecting' | 'connected';

export interface Player {
  id: string;
  name: string;
}

export interface BaseState {
  roomId: string;
  status: GameStatus;
  players: Record<string, Player>;
  winnerId: string | null;
}

// ---- Game plug-in contract ----
// A game is fully described by how to create/advance its state plus a board to
// render it. The networking layer (usePeerSession) is game-agnostic: the host
// runs `start`/`reducer`, broadcasts the resulting state, guests render it.
export interface BoardProps<S extends BaseState> {
  state: S;
  myId: string;
  dispatch: (action: GameAction) => void;
}

// Game moves are opaque to the network layer.
export type GameAction = Record<string, unknown>;

export interface GameDefinition<S extends BaseState = BaseState> {
  id: string;
  name: string;
  tagline: string;
  accent: string; // hex used for the gallery card
  emoji: string;
  /** Fresh waiting-room state (no players seated yet). */
  createInitialState: (roomId: string) => S;
  /** Transition waiting -> playing once 2 players are seated. */
  start: (state: S) => S;
  /** Apply a player's move; return the next state. */
  reducer: (state: S, playerId: string, action: GameAction) => S;
  Board: ComponentType<BoardProps<S>>;
  /** Optional custom end-screen line. */
  gameOverMessage?: (state: S, myId: string) => string;
  /**
   * Optional per-viewer state masking for hidden-information games. The host
   * applies this before sending state to each player (and to its own view), so
   * secrets (e.g. un-hit ship positions) never leave the host. The host's
   * authoritative copy stays unredacted for game logic.
   */
  redact?: (state: S, viewerId: string) => S;
}

// ---- Wire protocol (guest <-> host) ----
export type NetMessage<S extends BaseState = BaseState> =
  | { kind: 'join'; name: string }
  | { kind: 'start' }
  | { kind: 'action'; action: GameAction }
  | { kind: 'state'; state: S }
  | { kind: 'error'; msg: string };
