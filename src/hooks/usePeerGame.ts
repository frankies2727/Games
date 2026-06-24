import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { ConnStatus, GameState, NetMessage } from '../types';

// All rooms share the public PeerJS broker, so the host's peer id is derived
// deterministically from the room code (namespaced to reduce global clashes).
// The first player to claim that id becomes the authoritative host; the second
// fails to claim it and instead connects to it as a guest.
const ROOM_PREFIX = 'paper-numbers-gallery-v1-';
const hostIdFor = (code: string) => ROOM_PREFIX + code;

function createNewGame(roomId: string): GameState {
  const masterSheet = Array.from({ length: 100 }, (_, i) => i + 1);
  for (let i = masterSheet.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [masterSheet[i], masterSheet[j]] = [masterSheet[j], masterSheet[i]];
  }
  return {
    roomId,
    status: 'waiting',
    players: {},
    masterSheet,
    targetNumber: null,
    finderId: null,
    playerDots: {},
    winnerId: null,
  };
}

const randomTarget = (masterSheet: number[]) =>
  masterSheet[Math.floor(Math.random() * masterSheet.length)];

export interface PeerGame {
  gameState: GameState | null;
  myId: string;
  status: ConnStatus;
  error: string;
  join: (roomId: string, name: string) => void;
  startGame: () => void;
  findNumber: (num: number) => void;
  circleDot: (index: number) => void;
}

export function usePeerGame(): PeerGame {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myId, setMyId] = useState('');
  const [status, setStatus] = useState<ConnStatus>('idle');
  const [error, setError] = useState('');

  const peerRef = useRef<Peer | null>(null);
  const isHostRef = useRef(false);
  const myIdRef = useRef('');
  const stateRef = useRef<GameState | null>(null); // host's authoritative copy
  const connsRef = useRef<DataConnection[]>([]); // host: guests; guest: [hostConn]
  const joinedRef = useRef(false); // guard against double-join

  const errTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showError = useCallback((msg: string) => {
    setError(msg);
    if (errTimer.current) clearTimeout(errTimer.current);
    errTimer.current = setTimeout(() => setError(''), 5000);
  }, []);

  // --- Host: persist authoritative state + push it to every guest ---
  const commit = useCallback(() => {
    const st = stateRef.current;
    if (!st) return;
    const snapshot: GameState = { ...st };
    setGameState(snapshot);
    const msg: NetMessage = { type: 'state', state: snapshot };
    for (const c of connsRef.current) {
      try { c.send(msg); } catch { /* connection may be closing */ }
    }
  }, []);

  // --- Host action handlers (authoritative game rules) ---
  const hostAddPlayer = useCallback((pid: string, name: string) => {
    const room = stateRef.current;
    if (!room || room.status !== 'waiting') return;
    if (Object.keys(room.players).length >= 2 || room.players[pid]) return;
    room.players[pid] = { id: pid, name };
    room.playerDots[pid] = Array(64).fill(false);
    commit();
  }, [commit]);

  const hostStart = useCallback(() => {
    const room = stateRef.current;
    if (!room || room.status !== 'waiting') return;
    const ids = Object.keys(room.players);
    if (ids.length !== 2) return;
    room.status = 'playing';
    room.finderId = ids[0];
    room.targetNumber = randomTarget(room.masterSheet);
    for (const pid of ids) room.playerDots[pid] = Array(64).fill(false);
    commit();
  }, [commit]);

  const hostFound = useCallback((pid: string, num: number) => {
    const room = stateRef.current;
    if (!room || room.status !== 'playing' || pid !== room.finderId) return;
    if (num !== room.targetNumber) return;
    const ids = Object.keys(room.players);
    room.finderId = room.finderId === ids[0] ? ids[1] : ids[0];
    room.targetNumber = randomTarget(room.masterSheet);
    commit();
  }, [commit]);

  const hostDot = useCallback((pid: string, index: number) => {
    const room = stateRef.current;
    if (!room || room.status !== 'playing' || pid === room.finderId) return;
    const dots = room.playerDots[pid];
    if (!dots || index < 0 || index >= dots.length) return;
    dots[index] = true;
    if (dots.every(Boolean)) {
      room.status = 'gameover';
      room.winnerId = pid;
    }
    commit();
  }, [commit]);

  const handleGuestMessage = useCallback((conn: DataConnection, data: NetMessage) => {
    switch (data.type) {
      case 'join': hostAddPlayer(conn.peer, data.name); break;
      case 'start': hostStart(); break;
      case 'number_found': hostFound(conn.peer, data.num); break;
      case 'circle_dot': hostDot(conn.peer, data.index); break;
      default: break;
    }
  }, [hostAddPlayer, hostStart, hostFound, hostDot]);

  // --- Guest: render whatever the host sends ---
  const handleHostMessage = useCallback((data: NetMessage) => {
    if (data.type === 'state') {
      stateRef.current = data.state;
      setGameState(data.state);
    } else if (data.type === 'error') {
      showError(data.msg);
    }
  }, [showError]);

  const sendToHost = useCallback((msg: NetMessage) => {
    connsRef.current[0]?.send(msg);
  }, []);

  const joinAsGuest = useCallback((code: string, name: string) => {
    const peer = new Peer();
    peerRef.current = peer;
    isHostRef.current = false;

    peer.on('open', (id) => {
      myIdRef.current = id;
      setMyId(id);
      const conn = peer.connect(hostIdFor(code), { reliable: true });
      connsRef.current = [conn];
      conn.on('open', () => {
        setStatus('connected');
        conn.send({ type: 'join', name } as NetMessage);
      });
      conn.on('data', (d) => handleHostMessage(d as NetMessage));
      conn.on('close', () => {
        showError('Host left the game.');
        setStatus('idle');
        setGameState(null);
        stateRef.current = null;
        joinedRef.current = false;
      });
    });
    peer.on('error', (err) => {
      showError(`Connection error (${(err as { type?: string }).type ?? 'unknown'}).`);
      setStatus('idle');
      joinedRef.current = false;
    });
  }, [handleHostMessage, showError]);

  const join = useCallback((roomId: string, name: string) => {
    if (joinedRef.current) return;
    const code = roomId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code || !name.trim()) return;
    joinedRef.current = true;
    setStatus('connecting');

    // Attempt to claim the room's host id. Success => we host it.
    const peer = new Peer(hostIdFor(code));
    peerRef.current = peer;

    peer.on('open', (id) => {
      isHostRef.current = true;
      myIdRef.current = id;
      setMyId(id);
      stateRef.current = createNewGame(code);
      hostAddPlayer(id, name); // seat the host as player 1
      setStatus('connected');
    });

    peer.on('connection', (conn) => {
      connsRef.current.push(conn);
      conn.on('open', () => {
        if (stateRef.current) conn.send({ type: 'state', state: stateRef.current } as NetMessage);
      });
      conn.on('data', (d) => handleGuestMessage(conn, d as NetMessage));
      conn.on('close', () => {
        connsRef.current = connsRef.current.filter((c) => c !== conn);
        const room = stateRef.current;
        if (room && room.players[conn.peer]) {
          if (room.status === 'waiting') {
            delete room.players[conn.peer];
            delete room.playerDots[conn.peer];
          } else if (room.status === 'playing') {
            room.status = 'gameover'; // opponent bailed mid-game
          }
          commit();
        }
        showError('Opponent disconnected.');
      });
    });

    peer.on('error', (err) => {
      const type = (err as { type?: string }).type;
      if (type === 'unavailable-id') {
        // Room already has a host -> become the guest instead.
        peer.destroy();
        peerRef.current = null;
        joinAsGuest(code, name);
      } else {
        showError(`Connection error (${type ?? 'unknown'}).`);
        setStatus('idle');
        joinedRef.current = false;
      }
    });
  }, [commit, hostAddPlayer, handleGuestMessage, joinAsGuest, showError]);

  const startGame = useCallback(() => {
    if (isHostRef.current) hostStart();
    else sendToHost({ type: 'start' });
  }, [hostStart, sendToHost]);

  const findNumber = useCallback((num: number) => {
    if (isHostRef.current) hostFound(myIdRef.current, num);
    else sendToHost({ type: 'number_found', num });
  }, [hostFound, sendToHost]);

  const circleDot = useCallback((index: number) => {
    if (isHostRef.current) hostDot(myIdRef.current, index);
    else sendToHost({ type: 'circle_dot', index });
  }, [hostDot, sendToHost]);

  useEffect(() => () => {
    if (errTimer.current) clearTimeout(errTimer.current);
    peerRef.current?.destroy();
  }, []);

  return { gameState, myId, status, error, join, startGame, findNumber, circleDot };
}
