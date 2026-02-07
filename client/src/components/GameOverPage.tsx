import { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Room } from '@/types';
import './GameOverPage.css';

interface GameOverPageProps {
  room: Room;
  currentPlayerId: string;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
}

function GameOverPage({ room, currentPlayerId, socket }: GameOverPageProps) {
  // Sort players by score (descending)
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const isWinner = winner?.id === currentPlayerId;

  const handlePlayAgain = () => {
    if (!socket) return;
    socket.emit('play_again');
  };

  const handleLeaveGame = () => {
    // Refresh the page to return to home
    window.location.reload();
  };

  return (
    <div className="game-over-page">
      <div className="game-over-container">
        {isWinner && (
          <div className="winner-banner">
            <h1 className="winner-text">🏆 You Win! 🏆</h1>
          </div>
        )}

        {!isWinner && winner && (
          <div className="winner-banner">
            <h1 className="winner-text">🏆 {winner.name} Wins! 🏆</h1>
          </div>
        )}

        <h2 className="game-over-title">Game Over</h2>
        <p className="game-over-subtitle">Final Scores</p>

        {/* Final Scoreboard */}
        <div className="scoreboard-section">
          <div className="scoreboard-list">
            {sortedPlayers.map((player, index) => {
              const isFirstPlace = index === 0;
              const isCurrentPlayer = player.id === currentPlayerId;

              return (
                <div
                  key={player.id}
                  className={`scoreboard-item ${isFirstPlace ? 'winner' : ''} ${isCurrentPlayer ? 'current-player' : ''}`}
                >
                  {isFirstPlace && <div className="trophy-icon">🏆</div>}
                  <div className="player-rank">#{index + 1}</div>
                  <div className="player-info">
                    <span className="player-name">{player.name}</span>
                    {isCurrentPlayer && <span className="you-badge">You</span>}
                  </div>
                  <div className="player-score">{player.score} pts</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="actions-section">
          <button
            className="play-again-button"
            onClick={handlePlayAgain}
            disabled={!socket}
          >
            Play Again
          </button>
          <button
            className="leave-game-button"
            onClick={handleLeaveGame}
          >
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverPage;
