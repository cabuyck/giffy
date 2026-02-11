import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Room } from '@/types';
import type { PromptRerolledEvent, PromptSelectedEvent } from '@/types';
import './JudgePromptPage.css';

interface JudgePromptPageProps {
  room: Room;
  currentPlayerId: string;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  onRoomUpdate: (room: Room) => void;
}

function JudgePromptPage({ room, currentPlayerId, socket, onRoomUpdate }: JudgePromptPageProps) {
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [rerollsRemaining, setRerollsRemaining] = useState(3);

  const isJudge = room.players[room.judgeIndex]?.id === currentPlayerId;

  useEffect(() => {
    if (!socket) return;

    const handlePromptRerolled = (data: PromptRerolledEvent) => {
      setCurrentPrompt(data.prompt);
      setRerollsRemaining(data.rerollsRemaining);
    };

    const handlePromptSelected = (data: PromptSelectedEvent) => {
      // Update room state to trigger navigation to next page
      onRoomUpdate(data.room);
    };

    socket.on('prompt_rerolled', handlePromptRerolled);
    socket.on('prompt_selected', handlePromptSelected);

    // If we already have a prompt in the room, use it
    if (room.currentPrompt) {
      setCurrentPrompt(room.currentPrompt);
      setRerollsRemaining(3 - room.rerollCount);
    }

    return () => {
      socket.off('prompt_rerolled', handlePromptRerolled);
      socket.off('prompt_selected', handlePromptSelected);
    };
  }, [socket, room, onRoomUpdate]);

  const handleReroll = () => {
    if (!socket || rerollsRemaining <= 0) return;
    socket.emit('reroll_prompt');
  };

  const handleStartRound = () => {
    if (!socket || !currentPrompt) return;
    socket.emit('confirm_prompt', { prompt: currentPrompt });
  };

  if (!isJudge) {
    return (
      <div className="judge-prompt-page">
        <div className="waiting-container">
          <div className="loading-spinner"></div>
          <h1 className="waiting-title">Judge is selecting a prompt...</h1>
          <p className="waiting-subtitle">Get ready to search for GIFs!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="judge-prompt-page">
      <div className="judge-container">
        <div className="judge-header">
          <span className="judge-badge">You're the Judge</span>
        </div>

        <h1 className="judge-title">Select a Prompt</h1>
        <p className="judge-subtitle">
          Choose a prompt for this round. You can reroll up to 3 times.
        </p>

        {currentPrompt && (
          <div className="prompt-card">
            <div className="prompt-content">
              <h2 className="prompt-text">{currentPrompt}</h2>
            </div>
          </div>
        )}

        <div className="judge-actions">
          <button
            className="reroll-button"
            onClick={handleReroll}
            disabled={rerollsRemaining <= 0 || !socket}
          >
            <span className="reroll-icon">🎲</span>
            Next Prompt
            <span className="reroll-count">{rerollsRemaining} left</span>
          </button>

          <button
            className="start-round-button"
            onClick={handleStartRound}
            disabled={!currentPrompt || !socket}
          >
            Start Round
          </button>
        </div>

        <p className="judge-hint">
          Once you start the round, all players will search for GIFs that best
          match this prompt. You'll then judge which GIF is the best!
        </p>
      </div>
    </div>
  );
}

export default JudgePromptPage;
