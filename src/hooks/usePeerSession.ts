import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { BaseState, ConnStatus, GameAction, GameDefinition, NetMessage } from '../types';

// All rooms share the public PeerJS broker, so the host's peer id is derived
// deterministically from the game id + room code (the game id keeps two
// different games from colliding on the same code). The first player to claim
// that id becomes the authoritative host; the second fails and joins as guest.
const PREFIX = 'pn-gallery-v2';
const hostIdFor = (gameId: string, code: string) => `${PREFIX}-${gameId}-${code}`;

export interface Session<S extends BaseState> {
  state: S | null;
  myId: string;
  conn: ConnStatus;
  error: string;
  join: (roomId: string, name: string) => void;
  start: () => void;
  move: (action: GameAction) => void;
  rematch: () => void;
}

export function usePeerSession<S extends BaseState>(def: GameDefinition<S>): Session<S> {
  const [state, setState] = useState<S | null>(null);
  const [myId, setMyId] = useState('');
  const [conn, setConn] = useState<ConnStatus>('idle');
  const [error, setError] = useState('');

  const peerRef = useRef<Peer | null>(null);
  const isHostRef = useRef(false);
  const myIdRef = useRef('');
  const stateRef = useRef<S | null>(null); // host's authoritative copy
  const connsRef = useRef<DataConnection[]>([]); // host: guests; guest: [hostConn]
  const joinedRef = useRef(false);

  const errTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showError = useCallback((msg: string) => {
    setError(msg);
    if (errTimer.current) clearTimeout(errTimer.current);
    errTimer.current = setTimeout(() => setError(''), 5000);
  }, []);

  // --- Host: persist authoritative state + push a per-viewer view to each ---
  const viewFor = useCallback(
    (next: S, viewerId: string): S => (def.redact ? def.redact(next, viewerId) : next),
    [def],
  );

  const commit = useCallback((next: S) => {
    stateRef.current = next; // authoritative, unredacted
    setState(viewFor(next, myIdRef.current));
    for (const c of connsRef.current) {
      try { c.send({ kind: 'state', state: viewFor(next, c.peer) } as NetMessage<S>); } catch { /* closing */ }
    }
  }, [viewFor]);

  const maxPlayers = def.maxPlayers ?? 2;
  const minPlayers = def.minPlayers ?? 2;

  const hostSeat = useCallback((pid: string, name: string) => {
    const room = stateRef.current;
    if (!room || room.status !== 'waiting') return;
    if (room.players[pid] || Object.keys(room.players).length >= maxPlayers) return;
    commit({ ...room, players: { ...room.players, [pid]: { id: pid, name } } });
  }, [commit, maxPlayers]);

  const hostStart = useCallback(() => {
    const room = stateRef.current;
    if (!room || room.status !== 'waiting') return;
    const n = Object.keys(room.players).length;
    if (n < minPlayers || n > maxPlayers) return;
    commit(def.start(room));
  }, [commit, def, minPlayers, maxPlayers]);

  const hostAction = useCallback((pid: string, action: GameAction) => {
    const room = stateRef.current;
    if (!room) return;
    commit(def.reducer(room, pid, action));
  }, [commit, def]);

  // Rematch: restart straight into a fresh game with the same two players —
  // no return to the lobby or room code. Regenerates random setup (shuffles,
  // fleets, cards) by rebuilding from a clean initial state.
  const hostRematch = useCallback(() => {
    const room = stateRef.current;
    if (!room) return;
    const n = Object.keys(room.players).length;
    if (n < minPlayers) {
      showError('Not enough players to rematch.');
      return;
    }
    const fresh = def.createInitialState(room.roomId);
    commit(def.start({ ...fresh, players: room.players }));
  }, [commit, def, showError, minPlayers]);

  const hostRemove = useCallback((pid: string) => {
    const room = stateRef.current;
    if (!room || !room.players[pid]) return;
    if (room.status === 'waiting') {
      const players = { ...room.players };
      delete players[pid];
      commit({ ...room, players });
    } else if (room.status === 'playing') {
      commit({ ...room, status: 'gameover' }); // opponent bailed mid-game
    }
  }, [commit]);

  // --- Guest: render whatever the host sends ---
  const handleHostMessage = useCallback((data: NetMessage<S>) => {
    if (data.kind === 'state') {
      stateRef.current = data.state;
      setState(data.state);
    } else if (data.kind === 'error') {
      showError(data.msg);
    }
  }, [showError]);

  const handleGuestMessage = useCallback((c: DataConnection, data: NetMessage<S>) => {
    switch (data.kind) {
      case 'join': hostSeat(c.peer, data.name); break;
      case 'start': hostStart(); break;
      case 'rematch': hostRematch(); break;
      case 'action': hostAction(c.peer, data.action); break;
      default: break;
    }
  }, [hostSeat, hostStart, hostRematch, hostAction]);

  const sendToHost = useCallback((msg: NetMessage<S>) => {
    connsRef.current[0]?.send(msg);
  }, []);

  const joinAsGuest = useCallback((code: string, name: string) => {
    const peer = new Peer();
    peerRef.current = peer;
    isHostRef.current = false;

    peer.on('open', (id) => {
      myIdRef.current = id;
      setMyId(id);
      const c = peer.connect(hostIdFor(def.id, code), { reliable: true });
      connsRef.current = [c];
      c.on('open', () => {
        setConn('connected');
        c.send({ kind: 'join', name } as NetMessage<S>);
      });
      c.on('data', (d) => handleHostMessage(d as NetMessage<S>));
      c.on('close', () => {
        showError('Host left the game.');
        setConn('idle');
        setState(null);
        stateRef.current = null;
        joinedRef.current = false;
      });
    });
    peer.on('error', (err) => {
      showError(`Connection error (${(err as { type?: string }).type ?? 'unknown'}).`);
      setConn('idle');
      joinedRef.current = false;
    });
  }, [def.id, handleHostMessage, showError]);

  const join = useCallback((roomId: string, name: string) => {
    if (joinedRef.current) return;
    const code = roomId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code || !name.trim()) return;
    joinedRef.current = true;
    setConn('connecting');

    const peer = new Peer(hostIdFor(def.id, code));
    peerRef.current = peer;

    peer.on('open', (id) => {
      isHostRef.current = true;
      myIdRef.current = id;
      setMyId(id);
      stateRef.current = def.createInitialState(code);
      hostSeat(id, name); // seat the host as player 1
      setConn('connected');
    });

    peer.on('connection', (c) => {
      connsRef.current.push(c);
      c.on('open', () => {
        if (stateRef.current) c.send({ kind: 'state', state: viewFor(stateRef.current, c.peer) } as NetMessage<S>);
      });
      c.on('data', (d) => handleGuestMessage(c, d as NetMessage<S>));
      c.on('close', () => {
        connsRef.current = connsRef.current.filter((x) => x !== c);
        hostRemove(c.peer);
        showError('Opponent disconnected.');
      });
    });

    peer.on('error', (err) => {
      const type = (err as { type?: string }).type;
      if (type === 'unavailable-id') {
        peer.destroy();
        peerRef.current = null;
        joinAsGuest(code, name); // room already hosted -> become guest
      } else {
        showError(`Connection error (${type ?? 'unknown'}).`);
        setConn('idle');
        joinedRef.current = false;
      }
    });
  }, [def, hostSeat, handleGuestMessage, hostRemove, joinAsGuest, showError]);

  const start = useCallback(() => {
    if (isHostRef.current) hostStart();
    else sendToHost({ kind: 'start' });
  }, [hostStart, sendToHost]);

  const move = useCallback((action: GameAction) => {
    if (isHostRef.current) hostAction(myIdRef.current, action);
    else sendToHost({ kind: 'action', action });
  }, [hostAction, sendToHost]);

  const rematch = useCallback(() => {
    if (isHostRef.current) hostRematch();
    else sendToHost({ kind: 'rematch' });
  }, [hostRematch, sendToHost]);

  useEffect(() => () => {
    if (errTimer.current) clearTimeout(errTimer.current);
    peerRef.current?.destroy();
  }, []);

  return { state, myId, conn, error, join, start, move, rematch };
}
