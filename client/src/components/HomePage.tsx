import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, RoomCreatedEvent, RoomJoinedEvent, PlayerLeftEvent, Room } from '@/types';
import './HomePage.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

type GameMode = 'create' | 'join';

interface HomePageProps {
  onRoomJoined: (room: Room) => void;
  onPlayerIdSet: (playerId: string) => void;
  onSocketReady: (socket: Socket<ServerToClientEvents, ClientToServerEvents> | null) => void;
}

function HomePage({ onRoomJoined, onPlayerIdSet, onSocketReady }: HomePageProps) {
  const [mode, setMode] = useState<GameMode>('create');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  // Note: currentRoom and currentPlayerId are managed by App.tsx
  // through callbacks - we don't need local state for these

  // Validate room code format (4 characters, alphanumeric)
  const isValidRoomCode = (code: string): boolean => {
    return /^[A-Z0-9]{4}$/i.test(code);
  };

  // Handle player_joined event - update room state
  const handlePlayerJoined = useCallback((data: RoomJoinedEvent) => {
    onRoomJoined(data.room);
  }, [onRoomJoined]);

  // Handle player_left event - update room state
  const handlePlayerLeft = useCallback((data: PlayerLeftEvent) => {
    onRoomJoined(data.room);
  }, [onRoomJoined]);

  // Handle player_disconnected event - won't be handled on HomePage
  // since we navigate to LobbyPage immediately after joining
  const handlePlayerDisconnected = useCallback(() => {
    // No-op - LobbyPage will handle these events
  }, []);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL);

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('room_created', (data: RoomCreatedEvent) => {
      console.log('Room created:', data);
      onRoomJoined(data.room);
      // Find the current player ID from the room
      const hostPlayer = data.room.players.find(p => p.isHost);
      if (hostPlayer) {
        onPlayerIdSet(hostPlayer.id);
      }
    });

    socketInstance.on('player_joined', handlePlayerJoined);

    socketInstance.on('player_left', handlePlayerLeft);

    socketInstance.on('player_disconnected', handlePlayerDisconnected);

    socketInstance.on('error', (message: string) => {
      setError(message);
    });

    setSocket(socketInstance);
    onSocketReady(socketInstance);

    return () => {
      // Don't disconnect - socket persists across navigation
      // App.tsx manages the socket lifecycle
    };
  }, [handlePlayerJoined, handlePlayerLeft, handlePlayerDisconnected]);

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!socket) {
      setError('Not connected to server');
      return;
    }

    socket.emit('create_room', { playerName: playerName.trim() }, (response) => {
      if ('error' in response) {
        setError(response.error);
      } else {
        // Store room and player ID from successful response
        onRoomJoined(response.room);
        const hostPlayer = response.room.players.find(p => p.isHost);
        if (hostPlayer) {
          onPlayerIdSet(hostPlayer.id);
        }
      }
    });
  };

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (!isValidRoomCode(roomCode)) {
      setError('Room code must be 4 characters (letters and numbers)');
      return;
    }

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!socket) {
      setError('Not connected to server');
      return;
    }

    socket.emit('join_room',
      { roomCode: roomCode.toUpperCase(), playerName: playerName.trim() },
      (response) => {
        if ('error' in response) {
          setError(response.error);
        } else {
          // Store room and find current player ID
          onRoomJoined(response.room);
          const joiningPlayer = response.room.players.find(p => p.name === playerName.trim());
          if (joiningPlayer) {
            onPlayerIdSet(joiningPlayer.id);
          }
        }
      }
    );
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="game-title">Giffy</h1>
        <p className="game-subtitle">A Jackbox-style GIF party game</p>

        {/* Connection status */}
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>

        {/* Mode toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-button ${mode === 'create' ? 'active' : ''}`}
            onClick={() => {
              setMode('create');
              setError('');
              setRoomCode('');
            }}
          >
            Create Game
          </button>
          <button
            className={`mode-button ${mode === 'join' ? 'active' : ''}`}
            onClick={() => {
              setMode('join');
              setError('');
            }}
          >
            Join Game
          </button>
        </div>

        {/* Error message */}
        {error && <div className="error-message">{error}</div>}

        {/* Create Game Form */}
        {mode === 'create' && (
          <form className="game-form" onSubmit={handleCreateGame}>
            <div className="form-group">
              <label htmlFor="create-name">Your Name</label>
              <input
                id="create-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                autoComplete="off"
              />
            </div>
            <button type="submit" className="submit-button" disabled={!isConnected}>
              Create Game
            </button>
          </form>
        )}

        {/* Join Game Form */}
        {mode === 'join' && (
          <form className="game-form" onSubmit={handleJoinGame}>
            <div className="form-group">
              <label htmlFor="join-code">Room Code</label>
              <input
                id="join-code"
                type="text"
                value={roomCode}
                onChange={(e) => {
                  // Only allow alphanumeric, max 4 chars, auto-uppercase
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setRoomCode(value.slice(0, 4));
                }}
                placeholder="ABCD"
                maxLength={4}
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="join-name">Your Name</label>
              <input
                id="join-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                autoComplete="off"
              />
            </div>
            <button type="submit" className="submit-button" disabled={!isConnected}>
              Join Game
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default HomePage;
