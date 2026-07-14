import { useCallback, useEffect, useRef, useState } from 'react';
import { BaseState, GameAction, GameDefinition } from '../types';
import { Session } from './usePeerSession';

// Offline "vs computer" session. It mirrors the Session shape that GameShell
// expects from usePeerSession, but instead of networking it runs the whole game
// locally: the human is seated first (so they take seat 0 / move first) and one
// or more bots fill the remaining seats. After every state change each bot is
// asked for a move via `def.botMove`; a short delay makes turns feel deliberate.
// There is no peer, so nothing ever leaves the browser.
const HUMAN = 'you';
const botId = (i: number) => `cpu${i}`;
const BOT_DELAY_MS = 650;

export function useLocalSession<S extends BaseState>(
  def: GameDefinition<S>,
  botCount = 1,
): Session<S> {
  const [state, setState] = useState<S | null>(null);
  const stateRef = useRef<S | null>(null); // authoritative, unredacted copy
  const botIds = useRef<string[]>([]);

  // The human only ever sees their own redacted view (same as a guest would).
  const commit = useCallback((next: S) => {
    if (next === stateRef.current) return; // ignore no-op reducer results
    stateRef.current = next;
    setState(def.redact ? def.redact(next, HUMAN) : next);
  }, [def]);

  const join = useCallback((_roomId: string, name: string) => {
    const fresh = def.createInitialState('SOLO');
    // Insertion order matters: human first => seat 0, bots after.
    const players: BaseState['players'] = { [HUMAN]: { id: HUMAN, name: name.trim() || 'You' } };
    botIds.current = [];
    for (let i = 0; i < botCount; i++) {
      const id = botId(i);
      botIds.current.push(id);
      players[id] = { id, name: botCount > 1 ? `Bot ${i + 1}` : 'Computer' };
    }
    commit({ ...fresh, players });
  }, [commit, def, botCount]);

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

  // Rematch: restart straight into a fresh game with the same seating (human
  // first), regenerating any random setup — no return to a waiting screen.
  const rematch = useCallback(() => {
    const room = stateRef.current;
    if (!room) return;
    const fresh = def.createInitialState(room.roomId);
    commit(def.start({ ...fresh, players: room.players }));
  }, [commit, def]);

  // Drive the bots. Re-runs after every commit; whichever bot has a move to make
  // takes it after a short delay, so a bot that earns another turn (extra rolls,
  // closing a box) simply keeps moving as the state advances.
  useEffect(() => {
    if (!state || state.status !== 'playing' || !def.botMove) return;
    const room = stateRef.current;
    if (!room) return;
    for (const bid of botIds.current) {
      const view = def.redact ? def.redact(room, bid) : room;
      const action = def.botMove(view, bid);
      if (!action) continue;
      const timer = setTimeout(() => {
        const cur = stateRef.current;
        if (!cur || cur.status !== 'playing') return;
        commit(def.reducer(cur, bid, action));
      }, BOT_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [state, def, commit]);

  return {
    state,
    myId: HUMAN,
    conn: 'connected',
    error: '',
    join,
    start,
    move,
    rematch,
  };
}
