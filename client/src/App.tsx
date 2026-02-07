import { useState } from 'react';
import HomePage from './components/HomePage';
import LobbyPage from './components/LobbyPage';
import type { Room } from '@/types';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types';
import type { Socket } from 'socket.io-client';
import './App.css';

function App() {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  // If we're in a room, show the lobby
  if (currentRoom && currentPlayerId) {
    return (
      <LobbyPage
        room={currentRoom}
        currentPlayerId={currentPlayerId}
        socket={socket}
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
