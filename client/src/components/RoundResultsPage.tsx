import { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Room } from '@/types';
import './RoundResultsPage.css';

interface RoundResultsPageProps {
  room: Room;
  currentPlayerId: string;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
}

function RoundResultsPage({ room, currentPlayerId, socket }: RoundResultsPageProps) {
  // Check if current player is the judge
  const isJudge = room.players[room.judgeIndex]?.id === currentPlayerId;

  const handleNextRound = () => {
    if (!socket) return;
    socket.emit('next_round');
  };

  // Sort players by score (descending)
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  // Find winning submission (from room state - would be passed from event ideally)
  // For now, we'll show all submissions since we don't have the winnerId separately in the room state
  // In a real implementation, you'd store winnerId in the room or pass it from the event

  return (
    <div className="round-results-page">
      <div className="results-container">
        <h1 className="results-title">Round Results</h1>
        <p className="results-subtitle">
          Prompt: "{room.currentPrompt}"
        </p>

        {/* Scoreboard */}
        <div className="scoreboard-section">
          <h2 className="scoreboard-title">Scoreboard</h2>
          <div className="scoreboard-list">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`scoreboard-item ${player.id === currentPlayerId ? 'current-player' : ''}`}
              >
                <div className="player-rank">#{index + 1}</div>
                <div className="player-info">
                  <span className="player-name">{player.name}</span>
                  {player.id === currentPlayerId && <span className="you-badge">You</span>}
                </div>
                <div className="player-score">{player.score} pts</div>
              </div>
            ))}
          </div>
        </div>

        {/* All Submissions */}
        <div className="submissions-section">
          <h2 className="submissions-title">All Submissions</h2>
          <div className="submissions-grid">
            {room.submissions.map((submission) => {
              const submitter = room.players.find(p => p.id === submission.playerId);
              if (!submitter) return null;

              return (
                <div key={submission.id} className="submission-result">
                  <img
                    src={submission.gifUrl}
                    alt={`Submission by ${submitter.name}`}
                    className="submission-gif"
                  />
                  <div className="submission-info">
                    <span className="submitter-name">{submitter.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Round Button (Judge Only) */}
        {isJudge && (
          <div className="next-round-section">
            <button
              className="next-round-button"
              onClick={handleNextRound}
              disabled={!socket}
            >
              Next Round
            </button>
          </div>
        )}

        {!isJudge && (
          <div className="waiting-section">
            <p className="waiting-text">Waiting for the judge to start the next round...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoundResultsPage;
