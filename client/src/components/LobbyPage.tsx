import { Socket } from 'socket.io-client';
import { useEffect } from 'react';
import type { ServerToClientEvents, ClientToServerEvents, Room } from '@/types';
import type { GameStartedEvent } from '@/types';
import './LobbyPage.css';

interface LobbyPageProps {
  room: Room;
  currentPlayerId: string;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  onRoomUpdate?: (room: Room) => void;
}

function LobbyPage({ room, currentPlayerId, socket, onRoomUpdate }: LobbyPageProps) {
  // Find current player to check if they're the host
  const currentPlayer = room.players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost || false;

  // Count connected players (not disconnected)
  const connectedPlayerCount = room.players.filter(p => p.isConnected).length;

  const handleStartGame = () => {
    if (!socket) return;

    socket.emit('start_game');
  };

  const canStartGame = connectedPlayerCount >= 2;

  // Handle game_started event
  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = (data: GameStartedEvent) => {
      console.log('Game started:', data);
      if (onRoomUpdate) {
        onRoomUpdate(data.room);
      }
    };

    socket.on('game_started', handleGameStarted);

    return () => {
      socket.off('game_started', handleGameStarted);
    };
  }, [socket, onRoomUpdate]);

  return (
    <div className="lobby-page">
      <div className="lobby-container">
        <h1 className="lobby-title">Lobby</h1>

        {/* Room Code Display */}
        <div className="room-code-section">
          <p className="room-code-label">Room Code</p>
          <div className="room-code">{room.code}</div>
          <p className="room-code-hint">Share this code with friends to invite them!</p>
        </div>

        {/* Players List */}
        <div className="players-section">
          <h2 className="players-title">
            Players ({connectedPlayerCount}/4)
          </h2>
          <div className="players-list">
            {room.players.map((player) => (
              <div
                key={player.id}
                className={`player-item ${player.id === currentPlayerId ? 'current-player' : ''} ${!player.isConnected ? 'disconnected' : ''}`}
              >
                <div className="player-info">
                  <span className="player-name">
                    {player.name}
                    {player.isHost && <span className="host-badge">Host</span>}
                  </span>
                  {!player.isConnected && <span className="disconnected-badge">Disconnected</span>}
                </div>
                {player.id === currentPlayerId && <span className="you-badge">You</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Button (Host Only) */}
        {isHost && (
          <div className="start-game-section">
            <button
              className="start-game-button"
              onClick={handleStartGame}
              disabled={!canStartGame || !socket}
            >
              {connectedPlayerCount < 2
                ? 'Need at least 2 players'
                : connectedPlayerCount < 4
                  ? 'Start Game'
                  : 'Start Game'}
            </button>
            <p className="start-game-hint">
              {connectedPlayerCount < 2
                ? 'Wait for at least 2 players to join'
                : connectedPlayerCount === 4
                  ? 'Room is full!'
                  : 'Waiting for more players...'}
            </p>
          </div>
        )}

        {!isHost && (
          <div className="waiting-section">
            <p className="waiting-text">Waiting for the host to start the game...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LobbyPage;
