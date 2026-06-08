import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GameState, ClientToServerEvents, ServerToClientEvents } from './src/types';

const app = express();
const PORT = 3000;

// API routes FIRST
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: { origin: '*' }
});

const rooms: Record<string, GameState> = {};

function createNewGame(roomId: string): GameState {
  const masterSheet = Array.from({ length: 100 }, (_, i) => i + 1);
  // Shuffle array
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

function getRandomTarget(masterSheet: number[]): number {
  return masterSheet[Math.floor(Math.random() * masterSheet.length)];
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  let currentRoom: string | null = null;

  socket.on('join_room', (roomId, playerName) => {
    socket.join(roomId);
    currentRoom = roomId;

    if (!rooms[roomId]) {
      rooms[roomId] = createNewGame(roomId);
    }
    const room = rooms[roomId];

    if (room.status === 'waiting') {
      if (Object.keys(room.players).length < 2) {
        room.players[socket.id] = { id: socket.id, name: playerName };
        room.playerDots[socket.id] = Array(64).fill(false);
      } else if (!room.players[socket.id]) {
        // Room full, let them watch or send error
        socket.emit('error', 'Room is full, joining as spectator.');
      }
    }
    
    io.to(roomId).emit('game_state_update', room);
  });

  socket.on('start_game', () => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room || room.status !== 'waiting') return;

    const playerIds = Object.keys(room.players);
    if (playerIds.length === 2) {
      room.status = 'playing';
      room.finderId = playerIds[0];
      room.targetNumber = getRandomTarget(room.masterSheet);
      // reset dots just in case
      for (const pid of playerIds) {
        room.playerDots[pid] = Array(64).fill(false);
      }
      io.to(currentRoom).emit('game_state_update', room);
    } else {
      socket.emit('error', 'Need 2 players to start.');
    }
  });

  socket.on('number_found', (foundNum) => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room || room.status !== 'playing') return;

    // Only the current finder can find the number
    if (socket.id !== room.finderId) return;

    if (foundNum === room.targetNumber) {
      // Roles swap
      const playerIds = Object.keys(room.players);
      room.finderId = room.finderId === playerIds[0] ? playerIds[1] : playerIds[0];
      room.targetNumber = getRandomTarget(room.masterSheet);
      
      io.to(currentRoom).emit('game_state_update', room);
    }
  });

  socket.on('circle_dot', (dotIndex) => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room || room.status !== 'playing') return;

    // You can only circle dots if you are NOT the finder
    if (socket.id === room.finderId) return;

    // Must be a valid player
    if (!room.playerDots[socket.id]) return;

    room.playerDots[socket.id][dotIndex] = true;

    // Check win condition
    const hasWon = room.playerDots[socket.id].every(d => d === true);
    if (hasWon) {
      room.status = 'gameover';
      room.winnerId = socket.id;
    }

    io.to(currentRoom).emit('game_state_update', room);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      
      // If a player disconnects, we could mark them as left, or keep state so they can reconnect.
      // For this simple version, if someone leaves waiting room, we remove them.
      if (room.status === 'waiting' && room.players[socket.id]) {
        delete room.players[socket.id];
        delete room.playerDots[socket.id];
        io.to(currentRoom).emit('game_state_update', room);
      }
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
