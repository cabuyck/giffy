/**
 * Shared TypeScript types for Giffy game
 */

export type GameState =
  | 'lobby'
  | 'prompt_selection'
  | 'submitting'
  | 'judging'
  | 'round_results'
  | 'game_over';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  isConnected: boolean;
}

export interface Submission {
  id: string;
  playerId: string;
  gifUrl: string;
}

export interface Room {
  code: string;
  players: Player[];
  gameState: GameState;
  hostId: string;
  judgeIndex: number;
  currentRound: number;
  totalRounds: number;
  submissions: Submission[];
  currentPrompt: string | null;
  rerollCount: number;
}

// Socket Event Types
export interface CreateRoomEvent {
  playerName: string;
}

export interface JoinRoomEvent {
  roomCode: string;
  playerName: string;
}

export interface RoomCreatedEvent {
  roomCode: string;
  room: Room;
}

export interface PlayerJoinedEvent {
  room: Room;
}

export interface PlayerLeftEvent {
  room: Room;
}

export interface GameStartedEvent {
  judgeId: string;
  room: Room;
}

export interface ConfirmPromptEvent {
  prompt: string;
}

export interface PromptSelectedEvent {
  prompt: string;
  judgeId: string;
}

export interface SubmitGifEvent {
  gifUrl: string;
}

export interface SubmissionReceivedEvent {
  count: number;
  total: number;
}

export interface SelectWinnerEvent {
  submissionId: string;
}

export interface RoundResultsEvent {
  winnerId: string;
  submissions: Submission[];
  room: Room;
}

export interface NextRoundEvent {
  judgeId: string;
  round: number;
  room: Room;
}

export interface PlayAgainEvent {}

export interface GameOverEvent {
  room: Room;
  reason?: string;
}

// Server to Client Events
export type ServerToClientEvents = {
  room_created: (data: RoomCreatedEvent) => void;
  player_joined: (data: PlayerJoinedEvent) => void;
  player_left: (data: PlayerLeftEvent) => void;
  error: (message: string) => void;
  game_started: (data: GameStartedEvent) => void;
  prompt_selected: (data: PromptSelectedEvent) => void;
  submission_received: (data: SubmissionReceivedEvent) => void;
  round_results: (data: RoundResultsEvent) => void;
  next_round: (data: NextRoundEvent) => void;
  game_over: (data: GameOverEvent) => void;
  player_disconnected: (data: { playerId: string }) => void;
};

// Client to Server Events
export type ClientToServerEvents = {
  create_room: (data: CreateRoomEvent, callback: (response: RoomCreatedEvent | { error: string }) => void) => void;
  join_room: (data: JoinRoomEvent, callback: (response: RoomJoinedEvent | { error: string }) => void) => void;
  start_game: () => void;
  confirm_prompt: (data: ConfirmPromptEvent) => void;
  reroll_prompt: () => void;
  submit_gif: (data: SubmitGifEvent) => void;
  select_winner: (data: SelectWinnerEvent) => void;
  next_round: () => void;
  play_again: () => void;
};

export interface RoomJoinedEvent {
  room: Room;
}

// Additional types for Socket.io Server
export type InterServerEvents = {};
export type SocketData = {};
