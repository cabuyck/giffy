import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { Room, ServerToClientEvents, ClientToServerEvents, Player, InterServerEvents, SocketData } from '@/types';

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// In-memory room storage
const rooms = new Map<string, Room>();

// Track which socket ID belongs to which room code
const socketToRoom = new Map<string, string>();

// Track which socket ID belongs to which player ID
const socketToPlayer = new Map<string, string>();

/**
 * Generate a random 4-character alphanumeric room code
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude I, O, 1, 0 for clarity
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a unique player ID
 */
function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create initial room state
 */
function createRoom(roomCode: string, host: Player): Room {
  return {
    code: roomCode,
    players: [host],
    gameState: 'lobby',
    hostId: host.id,
    judgeIndex: 0,
    currentRound: 0,
    totalRounds: 0,
    submissions: [],
    currentPrompt: null,
    rerollCount: 0,
  };
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create_room', ({ playerName }, callback) => {
    console.log('create_room:', playerName);

    // Generate unique room code (ensure no collision)
    let roomCode: string;
    do {
      roomCode = generateRoomCode();
    } while (rooms.has(roomCode));

    // Create host player
    const host: Player = {
      id: generatePlayerId(),
      name: playerName,
      isHost: true,
      score: 0,
      isConnected: true,
    };

    // Create room
    const room = createRoom(roomCode, host);
    rooms.set(roomCode, room);

    // Track socket associations
    socketToRoom.set(socket.id, roomCode);
    socketToPlayer.set(socket.id, host.id);

    // Join socket to room for targeted broadcasts
    socket.join(roomCode);

    console.log(`Room ${roomCode} created by ${playerName} (${host.id})`);

    // Send room_created event to the creating client
    socket.emit('room_created', { roomCode, room });

    callback({ roomCode, room });
  });

  socket.on('join_room', ({ roomCode, playerName }, callback) => {
    console.log('join_room:', roomCode, playerName);

    // Validate room code
    const room = rooms.get(roomCode);
    if (!room) {
      callback({ error: 'Invalid room code' });
      return;
    }

    // Check max players (4 players max)
    if (room.players.length >= 4) {
      callback({ error: 'Room is full (max 4 players)' });
      return;
    }

    // Check for duplicate names
    const nameExists = room.players.some(p => p.name === playerName);
    if (nameExists) {
      callback({ error: 'Name already taken in this room' });
      return;
    }

    // Create player
    const player: Player = {
      id: generatePlayerId(),
      name: playerName,
      isHost: false,
      score: 0,
      isConnected: true,
    };

    // Add player to room
    room.players.push(player);

    // Track socket associations
    socketToRoom.set(socket.id, roomCode);
    socketToPlayer.set(socket.id, player.id);

    // Join socket to room
    socket.join(roomCode);

    console.log(`${playerName} (${player.id}) joined room ${roomCode}`);

    // Notify all players in room
    io.to(roomCode).emit('player_joined', { room });

    callback({ room });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayer.get(socket.id);

    if (!roomCode || !playerId) {
      console.log('Untracked socket disconnected');
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      console.log(`Room ${roomCode} not found for disconnect`);
      return;
    }

    // Find and mark player as disconnected
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;
      console.log(`Player ${player.name} (${playerId}) disconnected from room ${roomCode}`);

      // Notify other players
      socket.to(roomCode).emit('player_disconnected', { playerId });

      // Remove player if they were the last one or if room is in lobby
      // For active games, we keep them marked as disconnected
      if (room.gameState === 'lobby' || room.players.filter(p => p.isConnected).length === 0) {
        // Remove disconnected player
        room.players = room.players.filter(p => p.id !== playerId);

        // If host disconnected and room is in lobby, promote next player or delete room
        if (playerId === room.hostId) {
          if (room.players.length > 0) {
            // Promote next player to host
            room.players[0].isHost = true;
            room.hostId = room.players[0].id;
            console.log(`New host for room ${roomCode}: ${room.players[0].name}`);
          } else {
            // Delete empty room
            rooms.delete(roomCode);
            console.log(`Room ${roomCode} deleted (no players)`);
          }
        } else if (room.players.length === 0) {
          // Delete empty room
          rooms.delete(roomCode);
          console.log(`Room ${roomCode} deleted (no players)`);
        } else {
          // Notify remaining players of updated room state
          io.to(roomCode).emit('player_left', { room });
        }
      }
    }

    // Clean up tracking maps
    socketToRoom.delete(socket.id);
    socketToPlayer.delete(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
