import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { Room, ServerToClientEvents, ClientToServerEvents } from '@/types';

const app = express();
const httpServer = createServer(app);
const io = new Server<ServerToClientEvents, ClientToServerEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// In-memory room storage
const rooms = new Map<string, Room>();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create_room', ({ playerName }, callback) => {
    console.log('create_room:', playerName);
    // TODO: Implement in US-002
    callback({ error: 'Not implemented yet' });
  });

  socket.on('join_room', ({ roomCode, playerName }, callback) => {
    console.log('join_room:', roomCode, playerName);
    // TODO: Implement in US-002
    callback({ error: 'Not implemented yet' });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // TODO: Implement in US-002
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
