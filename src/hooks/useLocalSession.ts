import { useCallback, useEffect, useRef, useState } from 'react';
import { BaseState, GameAction, GameDefinition } from '../types';
import { Session } from './usePeerSession';

// Offline "vs computer" session. It mirrors the Session shape that GameShell
// expects from usePeerSession, but instead of networking it runs the whole game
// locally: the human is seated first (so they take seat 0 / move first) and a
// bot fills seat 1. After every state change the bot is asked for a move via
// `def.botMove`; a short delay makes its turns feel deliberate rather than
// instant. There is no peer, so nothing ever leaves the browser.
const HUMAN = 'you';
const BOT = 'cpu';
const BOT_DELAY_MS = 650;

export function useLocalSession<S extends BaseState>(
  def: GameDefinition<S>,
  botName = 'Computer',
): Session<S> {
  const [state, setState] = useState<S | null>(null);
  const stateRef = useRef<S | null>(null); // authoritative, unredacted copy

  // The human only ever sees their own redacted view (same as a guest would).
  const commit = useCallback((next: S) => {
    if (next === stateRef.current) return; // ignore no-op reducer results
    stateRef.current = next;
    setState(def.redact ? def.redact(next, HUMAN) : next);
  }, [def]);

  const join = useCallback((_roomId: string, name: string) => {
    const fresh = def.createInitialState('SOLO');
    // Insertion order matters: human first => seat 0, bot second => seat 1.
    commit({
      ...fresh,
      players: {
        [HUMAN]: { id: HUMAN, name: name.trim() || 'You' },
        [BOT]: { id: BOT, name: botName },
      },
    });
  }, [commit, def, botName]);

  const start = useCallback(() => {
    const room = stateRef.current;
    if (!room || room.status !== 'waiting') return;
    commit(def.start(room));
  }, [commit, def]);

  const move = useCallback((action: GameAction) => {
    const room = stateRef.current;
    if (!room) return;
    commit(def.reducer(room, HUMAN, action));
  }, [commit, def]);

  // Drive the bot. Re-runs after every commit, so a bot that earns another turn
  // (e.g. closing a box) simply keeps moving as the state advances.
  useEffect(() => {
    if (!state || state.status !== 'playing' || !def.botMove) return;
    const room = stateRef.current;
    if (!room) return;
    const view = def.redact ? def.redact(room, BOT) : room;
    const action = def.botMove(view, BOT);
    if (!action) return;
    const timer = setTimeout(() => {
      const cur = stateRef.current;
      if (!cur || cur.status !== 'playing') return;
      commit(def.reducer(cur, BOT, action));
    }, BOT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state, def, commit]);

  return {
    state,
    myId: HUMAN,
    conn: 'connected',
    error: '',
    join,
    start,
    move,
  };
}
