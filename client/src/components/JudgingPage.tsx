import { useState } from 'react';
import { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Room } from '@/types';
import './JudgingPage.css';

interface JudgingPageProps {
  room: Room;
  currentPlayerId: string;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
}

// Player labels for anonymized submissions
const PLAYER_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function JudgingPage({ room, currentPlayerId, socket }: JudgingPageProps) {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // Check if current player is the judge
  const isJudge = room.players[room.judgeIndex]?.id === currentPlayerId;

  const handleGifClick = (submissionId: string) => {
    if (!isJudge) return;
    setSelectedSubmissionId(submissionId);
  };

  const handleConfirmWinner = () => {
    if (!selectedSubmissionId || !socket || !isJudge) return;

    socket.emit('select_winner', { submissionId: selectedSubmissionId });
  };

  // Non-judge players see waiting screen
  if (!isJudge) {
    return (
      <div className="judging-page">
        <div className="waiting-container">
          <div className="loading-spinner"></div>
          <h1 className="waiting-title">The judge is reviewing submissions...</h1>
          <p className="waiting-subtitle">
            "{room.currentPrompt}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="judging-page">
      <div className="judging-container">
        <div className="judge-header">
          <span className="judge-badge">You're the Judge</span>
        </div>

        <h1 className="judging-title">Select the Best GIF</h1>
        <p className="judging-subtitle">
          Prompt: "{room.currentPrompt}"
        </p>

        {room.submissions.length === 0 ? (
          <div className="no-submissions">
            <p>No submissions yet.</p>
          </div>
        ) : (
          <>
            <div className="submissions-grid">
              {room.submissions.map((submission, index) => {
                const playerLabel = PLAYER_LABELS[index] || `Player ${index + 1}`;
                const isSelected = selectedSubmissionId === submission.id;

                return (
                  <div
                    key={submission.id}
                    className={`submission-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleGifClick(submission.id)}
                  >
                    <div className="submission-label">{playerLabel}</div>
                    <img
                      src={submission.gifUrl}
                      alt={`Submission ${playerLabel}`}
                      className="submission-gif"
                    />
                    {isSelected && (
                      <div className="selected-overlay">
                        <span className="selected-check">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="confirm-section">
              <button
                className="confirm-button"
                onClick={handleConfirmWinner}
                disabled={!selectedSubmissionId || !socket}
              >
                Confirm Winner
              </button>
              {!selectedSubmissionId && (
                <p className="confirm-hint">Select a GIF to confirm your choice</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default JudgingPage;
