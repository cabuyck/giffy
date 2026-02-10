import { test, expect } from '@playwright/test';

test.describe('Giffy Smoke Test', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.locator('h1')).toContainText('Giffy');
  });

  test('should create a game room', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Enter player name
    await page.fill('input[placeholder*="name"]', 'TestPlayer');

    // Click create game button
    await page.click('button:has-text("Create Game")');

    // Should show room code (4 characters)
    const roomCode = await page.locator('text=/^[A-Z0-9]{4}$/').first();
    await expect(roomCode).toBeVisible({ timeout: 5000 });
  });

  test('should allow second player to join', async ({ context }) => {
    // Player 1 creates room
    const page1 = await context.newPage();
    await page1.goto('http://localhost:5173');
    await page1.fill('input[placeholder*="name"]', 'Alice');
    await page1.click('button:has-text("Create Game")');

    // Get room code
    const roomCode = await page1.locator('text=/^[A-Z0-9]{4}$/').textContent({ timeout: 5000 });

    // Player 2 joins
    const page2 = await context.newPage();
    await page2.goto('http://localhost:5173');
    await page2.click('button:has-text("Join Game")'); // Switch to join tab
    await page2.fill('input[placeholder*="room code"]', roomCode!);
    await page2.fill('input[placeholder*="name"]', 'Bob');
    await page2.click('button:has-text("Join")');

    // Both should see each other
    await expect(page1.locator('text=Bob')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=Alice')).toBeVisible({ timeout: 5000 });
  });

  test('should start game when 2+ players', async ({ context }) => {
    // Create and join
    const page1 = await context.newPage();
    await page1.goto('http://localhost:5173');
    await page1.fill('input[placeholder*="name"]', 'Host');
    await page1.click('button:has-text("Create Game")');

    const roomCode = await page1.locator('text=/^[A-Z0-9]{4}$/').textContent({ timeout: 5000 });

    const page2 = await context.newPage();
    await page2.goto('http://localhost:5173');
    await page2.click('button:has-text("Join Game")');
    await page2.fill('input[placeholder*="room code"]', roomCode!);
    await page2.fill('input[placeholder*="name"]', 'Player2');
    await page2.click('button:has-text("Join")');

    // Host should see start button enabled
    await expect(page1.locator('button:has-text("Start Game")')).toBeEnabled();
  });
});
