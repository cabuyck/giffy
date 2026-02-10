# PRD: Giffy - GIF-Based Party Game

## Introduction

Giffy is a Jackbox-style multiplayer party game where players compete to find the funniest or most relevant GIF in response to prompts. Similar to Apples-to-Apples or Cards Against Humanity, but with GIFs instead of cards. Each round, one player acts as the judge while others submit GIFs. The judge selects their favorite, and the submitter wins the round. Perfect for virtual hangouts, parties, and team building.

## Goals

- Enable 4 players to join a room via a simple 4-character code
- Provide smooth real-time gameplay using Socket.io
- Allow players to search and select GIFs via Giphy API integration
- Rotate judge role each round so every player judges once
- Create a fun, mobile-friendly Jackbox-style experience
- Support complete game flow: lobby → rounds → winner announcement

## User Stories

### US-001: Create game room and generate join code
**Description:** As a host, I want to create a game room with a shareable 4-character code so my friends can easily join.

**Acceptance Criteria:**
- [ ] Host can enter their name and click "Create Game"
- [ ] System generates a unique 4-character alphanumeric room code
- [ ] Host sees the room code prominently displayed for sharing
- [ ] Host joins the room immediately as player 1
- [ ] Room appears in "waiting for players" state
- [ ] Typecheck passes
- [ ] Integration test passes using playwright-mcp (see Testing Requirements below)

### US-002: Join existing game room
**Description:** As a player, I want to join a game using a room code so I can play with my friends.

**Acceptance Criteria:**
- [ ] Player can enter 4-character room code and their name
- [ ] System validates room code exists (shows error if invalid)
- [ ] Player joins lobby and sees all connected players
- [ ] Maximum 4 players per room (5th join attempt shows "room full" message)
- [ ] All existing players see new player join in real-time
- [ ] Typecheck passes
- [ ] Integration test passes using playwright-mcp (see Testing Requirements below)

### US-003: Start game when all players ready
**Description:** As the host, I want to start the game when all players have joined so we can begin playing.

**Acceptance Criteria:**
- [ ] Only host sees "Start Game" button in lobby
- [ ] Button is disabled when fewer than 2 players
- [ ] Clicking "Start Game" transitions all players to gameplay view
- [ ] System assigns first judge (random or player 1)
- [ ] System assigns order for subsequent judges
- [ ] Typecheck passes
- [ ] Integration test passes using playwright-mcp (see Testing Requirements below)

### US-004: Judge sees and selects prompt
**Description:** As the judge, I want to see a prompt and confirm it so the round begins.

**Acceptance Criteria:**
- [ ] Judge sees "You are the judge" indicator
- [ ] Judge sees a random prompt from predefined list
- [ ] Judge can click "Next Prompt" to get a different prompt (max 3 rerolls)
- [ ] Judge clicks "Start Round" to send prompt to all players
- [ ] Non-judge players see "Judge is selecting a prompt..." state
- [ ] Typecheck passes
- [ ] Integration test passes using playwright-mcp (see Testing Requirements below)

### US-005: Non-judge players search and submit GIFs
**Description:** As a non-judge player, I want to search Giphy and select a GIF so I can respond to the prompt.

**Acceptance Criteria:**
- [ ] Players see the judge's prompt prominently
- [ ] Search input field with Giphy integration
- [ ] Typing shows search results as grid of GIF thumbnails
- [ ] Clicking a GIF selects it (shows selection confirmation)
- [ ] Can change selection before submitting
- [ ] "Submit" button sends selected GIF to judge
- [ ] After submission, player sees "Waiting for other players..." state
- [ ] Typecheck passes
- [ ] Integration test passes using playwright-mcp (see Testing Requirements below)

### US-006: Judge views submissions and picks winner
**Description:** As the judge, I want to see all submitted GIFs anonymized and pick my favorite so someone wins the round.

**Acceptance Criteria:**
- [ ] Judge sees all submitted GIFs displayed in a grid
- [ ] Submissions are anonymized (labeled "Player A", "Player B", etc.)
- [ ] Judge cannot see who submitted which GIF during selection
- [ ] Judge clicks a GIF to select it as the winner
- [ ] "Confirm Winner" button requires selection before being clickable
- [ ] Typecheck passes
- [ ] Integration test passes using playwright-mcp (see Testing Requirements below)

### US-007: Round results and scoring
**Description:** As a player, I want to see who won the round and track scores so we know who's winning.

**Acceptance Criteria:**
- [ ] All players see the winning GIF highlighted
- [ ] Reveal which player submitted the winning GIF
- [ ] Reveal all submissions with their submitters
- [ ] Winner receives 1 point
- [ ] Scoreboard shows current standings for all players
- [ ] "Next Round" button appears (only judge can click)
- [ ] Typecheck passes
- [ ] Integration test passes using playwright-mcp (see Testing Requirements below)

### US-008: Rotate judge and start next round
**Description:** As a player, I want the judge role to rotate each round so everyone gets a turn.

**Acceptance Criteria:**
- [ ] Judge role advances to next player in order
- [ ] New judge sees "You are the judge" indicator
- [ ] Game continues for N rounds where N = number of players
- [ ] After N rounds, game ends and winner is announced
- [ ] Typecheck passes
- [ ] Integration test passes using playwright-mcp (see Testing Requirements below)

### US-009: Game over and winner announcement
**Description:** As a player, I want to see the final winner and have option to play again.

**Acceptance Criteria:**
- [ ] After all rounds complete, show "Game Over" screen
- [ ] Display final scoreboard with all players ranked
- [ ] Highlight the overall winner with special visual treatment
- [ ] "Play Again" button returns to lobby with same players
- [ ] "Leave Game" button returns to home screen
- [ ] Typecheck passes
- [ ] Integration test passes using playwright-mcp (see Testing Requirements below)

### US-010: Handle player disconnection
**Description:** As the system, I want to handle players disconnecting gracefully so the game can continue or end appropriately.

**Acceptance Criteria:**
- [ ] If a player disconnects, show "Player [name] disconnected" to all
- [ ] If judge disconnects, assign judge role to next player
- [ ] If fewer than 2 players remain, end game and show "Not enough players"
- [ ] Disconnected player can rejoin by entering same room code and name
- [ ] Typecheck passes
- [ ] Integration test passes using playwright-mcp (see Testing Requirements below)

### US-011: Giphy API integration
**Description:** As a developer, I need to integrate Giphy search API so players can find GIFs.

**Acceptance Criteria:**
- [ ] Set up Giphy API client with environment variable for API key
- [ ] Implement search endpoint with query parameter
- [ ] Return paginated results (limit to 20 per search)
- [ ] Handle API errors gracefully (show "Giphy unavailable, try again")
- [ ] Implement rate limiting to prevent API abuse
- [ ] Filter for GIF-only results (no stickers)
- [ ] Typecheck passes

### US-012: Socket.io room management
**Description:** As a developer, I need to set up Socket.io rooms so players in same game receive real-time updates.

**Acceptance Criteria:**
- [ ] Server joins socket to room when player enters room code
- [ ] Emit events only to players in specific room (not broadcast to all)
- [ ] Handle connection, disconnection, and reconnection
- [ ] Implement heartbeat/ping to detect stale connections
- [ ] Typecheck passes for both client and server socket types

## Functional Requirements

### Room & Lobby
- FR-1: System must generate unique 4-character alphanumeric room codes
- FR-2: System must validate room codes exist before allowing join
- FR-3: System must enforce maximum 4 players per room
- FR-4: System must display all connected players in lobby with their names
- FR-5: Only host must be able to start the game from lobby

### Game Flow
- FR-6: System must assign judge role sequentially (player 1 → 2 → 3 → 4 → 1)
- FR-7: System must run exactly N rounds where N = number of players
- FR-8: System must select random prompts from predefined list for each round
- FR-9: Judge must be able to reroll prompt up to 3 times per round

### Gameplay
- FR-10: Non-judge players must search Giphy and select one GIF per round
- FR-11: System must anonymize submissions when showing to judge
- FR-12: Judge must select one winning GIF per round
- FR-13: System must reveal submission authors after winner is selected
- FR-14: Winner of round must receive 1 point

### Real-time Communication
- FR-15: System must use Socket.io for all real-time updates
- FR-16: All players must see updates within 500ms of event occurring
- FR-17: System must handle network interruptions gracefully

### UI/UX
- FR-18: Interface must be mobile-responsive (375px+ viewport)
- FR-19: GIF thumbnails must load progressively (show placeholder while loading)
- FR-20: Current judge must be clearly indicated to all players
- FR-21: Scoreboard must be visible at all times during gameplay

## Non-Goals

**Out of scope for MVP:**
- User accounts or authentication
- Game history or replay functionality
- Persistent data storage (games lost on server restart)
- Custom prompt creation by users
- Video chat or voice integration
- Moderation tools or reporting
- Payment/monetization
- Public game browser
- Spectator mode
- Customizing room settings (round count, timer, etc.)
- Creating tournaments or leagues

## Design Considerations

### UI Style
- Jackbox-inspired: bold colors, simple shapes, large touch targets
- Dark mode preferred (party game, often played in evenings)
- Mobile-first design (most players join via phone)
- Minimal text, maximum visual content (GIFs are the focus)

### Key Screens
1. **Home:** Enter name + "Create Game" OR "Join Game" with room code
2. **Lobby:** Room code display, player list, "Start Game" button (host only)
3. **Judge Prompt:** Judge sees prompt, "Next Prompt", "Start Round" buttons
4. **Player Search:** Search bar, GIF grid, "Submit" button
5. **Judging:** Grid of anonymized submissions, click to select winner
6. **Round Results:** Winner reveal, scoreboard, "Next Round" button
7. **Game Over:** Final rankings, winner celebration, "Play Again" / "Leave"

### Components to Build
- RoomCodeDisplay (large, shareable code)
- PlayerAvatar (shows player name, maybe initials/icon)
- GifGrid (responsive grid of GIF thumbnails)
- GifSearchBar (search input with loading state)
- Scoreboard (player rankings with points)
- PromptCard (displays current prompt)
- SubmissionView (shows anonymized submissions for judging)

## Technical Considerations

### Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Real-time:** Socket.io (client + server)
- **Styling:** Tailwind CSS (recommended for rapid prototyping)
- **Giphy API:** Giphy SDK or REST API
- **Server:** Node.js + Express + Socket.io

### Architecture
- Monorepo structure: `/client` and `/server` directories
- Shared types package for TypeScript types used by client and server
- Server manages all game state (client is mostly display)
- Single server instance sufficient for MVP (horizontal scaling not needed)

### Socket Events
**Client → Server:**
- `create_room` { playerName }
- `join_room` { roomCode, playerName }
- `start_game`
- `reroll_prompt`
- `confirm_prompt`
- `search_gifs` { query }
- `submit_gif` { gifUrl }
- `select_winner` { submissionId }
- `next_round`
- `play_again`
- `leave_room`

**Server → Client:**
- `room_created` { roomCode }
- `player_joined` { playerId, playerName }
- `player_left` { playerId }
- `game_started`
- `prompt_selected` { prompt, judgeId }
- `submission_received` { count }
- `round_results` { winnerId, submissions, scores }
- `game_over` { finalScores }
- `error` { message }

### State Management
- Server maintains single source of truth for game state
- Client state mirrors server state via Socket events
- Consider React Context or Zustand for client state management

### Data Models
```typescript
interface Room {
  code: string;
  players: Player[];
  gameState: 'lobby' | 'prompt_selection' | 'submitting' | 'judging' | 'results' | 'game_over';
  currentRound: number;
  totalRounds: number;
  judgeIndex: number;
  currentPrompt?: string;
  submissions: Submission[];
  scores: Record<string, number>;
}

interface Player {
  id: string;
  name: string;
  isConnected: boolean;
}

interface Submission {
  playerId: string;
  gifUrl: string;
  gifTitle: string;
}
```

### External Dependencies
- **Giphy API Key:** Required for GIF search (obtain from developers.giphy.com)
- **Environment Variables:** `VITE_GIPHY_API_KEY`, `PORT`

## Success Metrics

- **Room code entry:** Player can join game in under 10 seconds from receiving code
- **Game completion:** 4-player game completes all rounds in under 15 minutes
- **Responsiveness:** All players see state changes within 500ms
- **Mobile usability:** Touch targets minimum 44x44px, usable on 375px viewport
- **GIF search:** Search results appear within 1 second
- **Connection reliability:** Game continues if one player temporarily disconnects

## Open Questions

1. **Prompt content:** Who creates the initial prompt list? How many prompts needed for MVP?
   - Recommendation: Start with 50-100 safe-for-work prompts (mix of funny, abstract, situational)

2. **Tie-breaking:** What happens if judge takes too long to decide?
   - Recommendation: Add 2-minute timer, if expires, randomly select winner

3. **GIF content moderation:** How to handle inappropriate GIFs?
   - Recommendation: Use Giphy's "rating" parameter (pg or pg-13 only)

4. **Player names:** Are names unique within a room?
   - Recommendation: Allow duplicates, assign internal IDs, display "Name (2)" if duplicate

5. **Reconnection flow:** If player refreshes page, can they rejoin automatically?
   - Recommendation: Store room code + player ID in localStorage, auto-reconnect on page load

6. **Round timer:** Should there be a time limit for submissions?
   - Recommendation: Start without timer, add in v2 if needed

7. **Giphy rate limits:** What if API quota is exceeded?
   - Recommendation: Show friendly error, cache popular searches, implement fallback

## Testing Requirements

**IMPORTANT:** All UI-related user stories (US-001 through US-010) require integration testing using `playwright-mcp` before being marked complete. This ensures end-to-end functionality works correctly.

### Integration Test Process

For each UI story, the implementing agent must:

1. **Start the server:**
   - Run the server in background mode with proper environment variables
   - Verify server is listening on expected port
   - Example: `npm run dev -- --server` (in background)

2. **Start the client:**
   - Run the dev server for the Vite client
   - Verify client is accessible on localhost
   - Example: `npm run dev -- --client` (in background)

3. **Run integration tests with playwright-mcp:**
   - Use playwright-mcp to automate browser interactions
   - Test the specific user flows described in the acceptance criteria
   - Verify expected UI elements are present and functional
   - Test real-time updates across multiple browser contexts (simulating multiple players)

4. **Clean up:**
   - Stop background processes after testing completes
   - Report any failures with specific error details

### Example Integration Test Structure

For US-001 (Create game room), an integration test would:

```javascript
// Pseudo-code for playwright-mcp test
1. Navigate to localhost:5173
2. Enter player name "Alice"
3. Click "Create Game" button
4. Verify room code is displayed (e.g., "A7X2")
5. Verify "waiting for players" state is shown
6. Verify player is in lobby as player 1
```

For US-002 (Join existing game room):

```javascript
// Pseudo-code for playwright-mcp test
1. Start server and create a room (context A)
2. Get room code from context A
3. Open new browser context (context B)
4. Navigate to localhost:5173
5. Enter room code and player name "Bob"
6. Verify Bob joins lobby
7. Verify context A shows "Bob joined" message
```

### Testing Multiple Players

Many stories require testing multiple simultaneous players (e.g., real-time updates). Agents should:

1. Use playwright-mcp's ability to manage multiple browser contexts
2. Simulate 2-4 players joining the same room
3. Verify that actions in one context trigger updates in all others
4. Test race conditions (e.g., two players submitting simultaneously)

### Test Data Requirements

- **Prompts:** Include a `prompts.json` file with at least 10 test prompts
- **Giphy API:** Use test API key or mock responses for consistent testing
- **Room codes:** Test various edge cases (invalid codes, full rooms, etc.)

### When Integration Tests Fail

If an integration test fails:
1. Do NOT mark the story as complete
2. Document the specific failure in the story's comments
3. Fix the issue and re-run the full integration test suite
4. Only mark complete when all acceptance criteria including integration tests pass

### Required Setup

Before implementation begins, ensure:
- `playwright-mcp` server is installed and accessible
- Test environment variables are configured (`.env.test`)
- Both client and server can be started via npm scripts

**Note:** This PRD assumes the user will set up playwright-mcp. Agents should verify availability before running tests and provide clear setup instructions if missing.

---

**Ready for implementation! This PRD provides clear direction for building the Giffy MVP.**
