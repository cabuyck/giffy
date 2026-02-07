import { useState } from 'react';
import HomePage from './components/HomePage';
import LobbyPage from './components/LobbyPage';
import JudgePromptPage from './components/JudgePromptPage';
import GifSubmissionPage from './components/GifSubmissionPage';
import JudgingPage from './components/JudgingPage';
import type { Room } from '@/types';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types';
import type { Socket } from 'socket.io-client';
import './App.css';

function App() {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  // If we're in a room, route based on game state
  if (currentRoom && currentPlayerId) {
    if (currentRoom.gameState === 'lobby') {
      return (
        <LobbyPage
          room={currentRoom}
          currentPlayerId={currentPlayerId}
          socket={socket}
          onRoomUpdate={setCurrentRoom}
        />
      );
    }

    if (currentRoom.gameState === 'prompt_selection') {
      return (
        <JudgePromptPage
          room={currentRoom}
          currentPlayerId={currentPlayerId}
          socket={socket}
        />
      );
    }

    if (currentRoom.gameState === 'submitting') {
      return (
        <GifSubmissionPage
          room={currentRoom}
          currentPlayerId={currentPlayerId}
          socket={socket}
        />
      );
    }

    if (currentRoom.gameState === 'judging') {
      return (
        <JudgingPage
          room={currentRoom}
          currentPlayerId={currentPlayerId}
          socket={socket}
        />
      );
    }

    // For other states, still show lobby for now (will be updated in future stories)
    return (
      <LobbyPage
        room={currentRoom}
        currentPlayerId={currentPlayerId}
        socket={socket}
        onRoomUpdate={setCurrentRoom}
      />
    );
  }

  // Otherwise show the home page
  return (
    <HomePage
      onRoomJoined={setCurrentRoom}
      onPlayerIdSet={setCurrentPlayerId}
      onSocketReady={setSocket}
    />
  );
}

export default App;
