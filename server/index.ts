import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { Room, ServerToClientEvents, ClientToServerEvents, Player, InterServerEvents, SocketData } from '@/types';
import { getRandomPrompt } from './prompts';
import { searchGifs } from './giphyClient';

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Express middleware
app.use(express.json());

// Giphy search endpoint
app.get('/api/gifs/search', async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const results = await searchGifs(q, 20);
    res.json({ results });
  } catch (error) {
    console.error('Error in /api/gifs/search:', error);
    res.status(500).json({
      error: 'Failed to search GIFs',
      results: [],
    });
  }
});

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

  socket.on('start_game', () => {
    console.log('start_game');

    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayer.get(socket.id);

    if (!roomCode || !playerId) {
      socket.emit('error', 'You are not in a room');
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    // Verify the player is the host
    if (playerId !== room.hostId) {
      socket.emit('error', 'Only the host can start the game');
      return;
    }

    // Check minimum players (at least 2)
    const connectedPlayers = room.players.filter(p => p.isConnected);
    if (connectedPlayers.length < 2) {
      socket.emit('error', 'Need at least 2 players to start');
      return;
    }

    // Set game state to prompt_selection
    room.gameState = 'prompt_selection';

    // Assign judgeIndex (0 for first game)
    room.judgeIndex = 0;

    // Set totalRounds equal to number of players
    room.totalRounds = room.players.length;

    // Reset reroll count
    room.rerollCount = 0;

    // Generate initial prompt
    const initialPrompt = getRandomPrompt();
    room.currentPrompt = initialPrompt;

    // Get judge ID
    const judgeId = room.players[room.judgeIndex].id;

    console.log(`Game started in room ${roomCode}. Judge: ${room.players[room.judgeIndex].name}`);

    // Emit game_started event to all players
    io.to(roomCode).emit('game_started', { judgeId, room });

    // Send first prompt to judge
    const judgeSocketId = Array.from(socketToRoom.entries())
      .find(([_, rc]) => rc === roomCode && socketToPlayer.get(_!) === judgeId)?.[0];

    if (judgeSocketId) {
      io.to(judgeSocketId).emit('prompt_rerolled', {
        prompt: initialPrompt,
        rerollsRemaining: 3,
      });
    }
  });

  socket.on('reroll_prompt', () => {
    console.log('reroll_prompt');

    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayer.get(socket.id);

    if (!roomCode || !playerId) {
      socket.emit('error', 'You are not in a room');
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    // Verify the player is the judge
    const judgeId = room.players[room.judgeIndex].id;
    if (playerId !== judgeId) {
      socket.emit('error', 'Only the judge can reroll the prompt');
      return;
    }

    // Check reroll limit (max 3 rerolls)
    if (room.rerollCount >= 3) {
      socket.emit('error', 'Maximum rerolls reached (3)');
      return;
    }

    // Increment reroll count
    room.rerollCount++;

    // Get new prompt
    const newPrompt = getRandomPrompt();
    room.currentPrompt = newPrompt;

    console.log(`Prompt rerolled in room ${roomCode}. Rerolls used: ${room.rerollCount}/3`);

    // Send new prompt to judge
    const rerollsRemaining = 3 - room.rerollCount;
    socket.emit('prompt_rerolled', {
      prompt: newPrompt,
      rerollsRemaining,
    });
  });

  socket.on('confirm_prompt', ({ prompt }) => {
    console.log('confirm_prompt:', prompt);

    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayer.get(socket.id);

    if (!roomCode || !playerId) {
      socket.emit('error', 'You are not in a room');
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    // Verify the player is the judge
    const judgeId = room.players[room.judgeIndex].id;
    if (playerId !== judgeId) {
      socket.emit('error', 'Only the judge can confirm the prompt');
      return;
    }

    // Set game state to submitting
    room.gameState = 'submitting';

    // Store the confirmed prompt
    room.currentPrompt = prompt;

    // Reset reroll count for next round
    room.rerollCount = 0;

    console.log(`Prompt confirmed in room ${roomCode}: "${prompt}"`);

    // Emit prompt_selected event to all players
    io.to(roomCode).emit('prompt_selected', {
      prompt,
      judgeId,
    });
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
