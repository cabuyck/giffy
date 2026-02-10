# Giffy Testing Guide with Playwright-MCP

## Overview

This project uses Playwright for integration testing as specified in the PRD. The playwright-mcp server is configured for Claude Code to automate browser testing during development.

## Setup

Playwright and Chromium are already installed. To verify:

```bash
npx playwright --version
```

## MCP Configuration

The playwright-mcp server is configured in two places:

1. **Project-level:** `.claude/mcp.json`
2. **Global:** `~/.claude.json` (under projects."/home/ubuntu/projects/giffy".mcpServers)

Configuration uses Chromium in headless mode by default.

## Using Playwright-MCP with Claude Code

When working on user stories that require integration testing (US-001 through US-010), Claude Code can use playwright-mcp to:

1. Navigate to localhost URLs
2. Fill forms and click buttons
3. Verify UI elements are present
4. Test real-time updates across multiple browser contexts

### Example Testing Flow

For a typical user story like "Create game room and generate join code":

```bash
# Terminal 1: Start the server and client
npm run dev

# In Claude Code, the agent will:
# 1. Navigate to http://localhost:5173
# 2. Enter player name "Alice"
# 3. Click "Create Game" button
# 4. Verify room code is displayed (e.g., "A7X2")
# 5. Verify "waiting for players" state is shown
```

## Manual Testing with Playwright

For manual testing, you can use Playwright directly:

```bash
# Run all tests in headless mode
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests with UI mode
npm run test:ui
```

## Test Files

Integration tests should be placed in the `tests/` directory following Playwright conventions:

```
tests/
├── integration/
│   ├── room-creation.spec.ts
│   ├── player-join.spec.ts
│   ├── game-flow.spec.ts
│   └── ...
└── fixtures/
    └── test-data.ts
```

## Writing Tests

Example test for room creation:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Room Creation', () => {
  test('should create a room and display code', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Enter name and create game
    await page.fill('[data-testid="player-name"]', 'Alice');
    await page.click('[data-testid="create-game-btn"]');

    // Verify room code is displayed
    const roomCode = page.locator('[data-testid="room-code"]');
    await expect(roomCode).toBeVisible();
    await expect(roomCode).toHaveText(/^[A-Z0-9]{4}$/);

    // Verify waiting state
    await expect(page.locator('[data-testid="lobby-status"]')).toContainText('waiting for players');
  });
});
```

## Testing Multi-Player Scenarios

For real-time multiplayer testing, use multiple browser contexts:

```typescript
test('should show new player joining to all players', async ({ browser }) => {
  // Context 1: Host creates room
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  await hostPage.goto('http://localhost:5173');
  await hostPage.fill('[data-testid="player-name"]', 'Alice');
  await hostPage.click('[data-testid="create-game-btn"]');

  const roomCode = await hostPage.textContent('[data-testid="room-code"]');

  // Context 2: Second player joins
  const playerContext = await browser.newContext();
  const playerPage = await playerContext.newPage();
  await playerPage.goto('http://localhost:5173');
  await playerPage.fill('[data-testid="room-code"]', roomCode!);
  await playerPage.fill('[data-testid="player-name"]', 'Bob');
  await playerPage.click('[data-testid="join-game-btn"]');

  // Verify host sees Bob join
  await expect(hostPage.locator('[data-testid="player-list"]')).toContainText('Bob');
});
```

## Required Test Data

Create `tests/fixtures/prompts.json` with test prompts:

```json
[
  "When your friend cancels plans last minute",
  "My face when I realize it's Monday",
  "That feeling when code works on the first try",
  "Me pretending to understand technical jargon",
  "When someone says 'it's a quick fix'"
]
```

## Environment Variables

Create a `.env` file for testing:

```bash
# Giphy API (get from https://developers.giphy.com/)
VITE_GIPHY_API_KEY=your_test_api_key_here

# Server port
PORT=3001
```

## Troubleshooting

### MCP Server Not Available

If Claude Code can't connect to playwright-mcp:

1. Restart Claude Code session
2. Verify MCP config: `cat .claude/mcp.json`
3. Check global config: `cat ~/.claude.json | grep -A 20 giffy`

### Port Already in Use

If port 3001 or 5173 is already in use:

```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use different ports in .env
```

### Browser Not Installed

If Playwright can't find Chromium:

```bash
npx playwright install chromium
```

## Test-Driven Development Workflow

1. Write acceptance criteria from PRD user story
2. Create Playwright test for the criteria
3. Run test (should fail - red)
4. Implement feature
5. Run test (should pass - green)
6. Verify with playwright-mcp in Claude Code
7. Mark story complete

## Notes for Ralph Agents

When implementing user stories:

- Always start server/client before testing
- Use proper test IDs (data-testid attributes) for reliable selectors
- Test both happy path and error cases
- Clean up background processes after testing
- Report specific failures with error details
- Only mark story complete when ALL acceptance criteria pass
