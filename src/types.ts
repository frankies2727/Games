import type { ComponentType, ReactNode } from 'react';

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
  /**
   * Optional custom icon rendered on the gallery card in place of `emoji`.
   * Use when a plain emoji can't express the icon (e.g. an animated glyph).
   */
  icon?: ReactNode;
  /** Fewest players needed to start (default 2). */
  minPlayers?: number;
  /** Most players a room seats (default 2). */
  maxPlayers?: number;
  /** Fresh waiting-room state (no players seated yet). */
  createInitialState: (roomId: string) => S;
  /** Transition waiting -> playing once enough players are seated. */
  start: (state: S) => S;
  /** Apply a player's move; return the next state. */
  reducer: (state: S, playerId: string, action: GameAction) => S;
  Board: ComponentType<BoardProps<S>>;
  /**
   * Optional pre-game setup panel rendered in the lobby (online) and on the
   * solo setup screen, before `start`. Lets players lock in choices — e.g. their
   * token colour — while `status` is still `'waiting'`. Receives the same props
   * as the board, so it can read state and `dispatch` waiting-phase actions.
   */
  LobbyExtra?: ComponentType<BoardProps<S>>;
  /**
   * Optional bot policy. Given the state as the bot sees it (post-`redact`) and
   * the bot's player id, return the action it wants to take, or `null` if it's
   * not the bot's move. Games that define this get a "Play vs Computer" option.
   */
  botMove?: (state: S, botId: string) => GameAction | null;
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
  | { kind: 'rematch' }
  | { kind: 'action'; action: GameAction }
  | { kind: 'state'; state: S }
  | { kind: 'error'; msg: string };
