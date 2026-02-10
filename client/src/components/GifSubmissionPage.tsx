import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Room } from '@/types';
import type { PromptSelectedEvent, JudgingStartedEvent } from '@/types';
import './GifSubmissionPage.css';

interface GifResult {
  url: string;
  title: string;
}

interface GifSubmissionPageProps {
  room: Room;
  currentPlayerId: string;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  onRoomUpdate: (room: Room) => void;
}

function GifSubmissionPage({ room, currentPlayerId, socket, onRoomUpdate }: GifSubmissionPageProps) {
  const [prompt, setPrompt] = useState<string | null>(room.currentPrompt);
  const [searchQuery, setSearchQuery] = useState('');
  const [gifResults, setGifResults] = useState<GifResult[]>([]);
  const [selectedGif, setSelectedGif] = useState<GifResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check if current player is the judge
  const isJudge = room.players[room.judgeIndex]?.id === currentPlayerId;

  // Handle prompt_selected event
  useEffect(() => {
    if (!socket) return;

    const handlePromptSelected = (data: PromptSelectedEvent) => {
      console.log('Prompt selected:', data);
      setPrompt(data.prompt);
      setHasSubmitted(false);
      setSelectedGif(null);
    };

    const handleJudgingStarted = (data: JudgingStartedEvent) => {
      // Update room state to trigger navigation to judging page
      onRoomUpdate(data.room);
    };

    socket.on('prompt_selected', handlePromptSelected);
    socket.on('judging_started', handleJudgingStarted);

    return () => {
      socket.off('prompt_selected', handlePromptSelected);
      socket.off('judging_started', handleJudgingStarted);
    };
  }, [socket, onRoomUpdate]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query || query.trim().length === 0) {
        setGifResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
        const response = await fetch(`${serverUrl}/api/gifs/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setGifResults(data.results || []);
      } catch (error) {
        console.error('Error searching GIFs:', error);
        setGifResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle GIF selection
  const handleGifClick = (gif: GifResult) => {
    if (hasSubmitted) return;
    setSelectedGif(gif);
  };

  // Handle submit
  const handleSubmit = () => {
    if (!selectedGif || !socket || hasSubmitted) return;

    socket.emit('submit_gif', { gifUrl: selectedGif.url });
    setHasSubmitted(true);
  };

  // Judge sees different view
  if (isJudge) {
    return (
      <div className="gif-submission-page">
        <div className="waiting-container">
          <div className="loading-spinner"></div>
          <h1 className="waiting-title">Waiting for players to submit...</h1>
          <p className="waiting-subtitle">{prompt}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gif-submission-page">
      <div className="submission-container">
        {/* Prompt Display */}
        <div className="prompt-section">
          <h1 className="prompt-title">{prompt}</h1>
          <p className="prompt-instruction">
            Search for a GIF that best represents this prompt!
          </p>
        </div>

        {!hasSubmitted ? (
          <>
            {/* Search Section */}
            <div className="search-section">
              <input
                type="text"
                className="search-input"
                placeholder="Search for GIFs..."
                value={searchQuery}
                onChange={handleSearchChange}
                disabled={isSearching}
              />
              {isSearching && <div className="search-spinner"></div>}
            </div>

            {/* GIF Results Grid */}
            {gifResults.length > 0 && (
              <div className="gif-grid">
                {gifResults.map((gif, index) => (
                  <div
                    key={`${gif.url}-${index}`}
                    className={`gif-item ${selectedGif?.url === gif.url ? 'selected' : ''}`}
                    onClick={() => handleGifClick(gif)}
                  >
                    <img src={gif.url} alt={gif.title} loading="lazy" />
                    {selectedGif?.url === gif.url && (
                      <div className="selected-badge">✓ Selected</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit Section */}
            {selectedGif && (
              <div className="submit-section">
                <button
                  className="submit-button"
                  onClick={handleSubmit}
                  disabled={!socket}
                >
                  Submit GIF
                </button>
              </div>
            )}
          </>
        ) : (
          /* Waiting for other players */
          <div className="waiting-container">
            <div className="loading-spinner"></div>
            <h1 className="waiting-title">GIF Submitted!</h1>
            <p className="waiting-subtitle">Waiting for other players...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default GifSubmissionPage;
