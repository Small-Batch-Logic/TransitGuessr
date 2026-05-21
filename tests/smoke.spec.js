const { test, expect } = require('@playwright/test');

test('loads the start screen and can enter the game shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('The ultimate spatial awareness test for transit nerds.')).toBeVisible();
  await page.getByRole('button', { name: 'START SESSION' }).click();

  await expect(page.locator('#game-screen')).toHaveClass(/active/);
  await expect(page.locator('#photo-loading')).toBeVisible();
});

test('can complete all rounds and reach end screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'START SESSION' }).click();

  await expect(page.locator('#game-screen')).toHaveClass(/active/);
  await expect(page.locator('#map')).toBeVisible();

  for (let round = 0; round < 5; round++) {
    const state = await page.evaluate(() => {
      const station = game.roundStations[game.currentRound];
      game.guessLatLng = { lat: station.lat, lng: station.lng };
      submitGuess();
      const roundResultsCount = game.roundResults.length;
      nextRound();
      return {
        roundResultsCount,
        gameRound: game.currentRound,
        endActive: document.getElementById('end-screen').classList.contains('active')
      };
    });
    expect(state.roundResultsCount).toBe(round + 1);
  }

  await expect(page.locator('#end-screen')).toHaveClass(/active/);
  await expect(page.locator('#final-score')).toBeVisible();
});

test('can click the map and click confirm guess', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'START SESSION' }).click();

  await expect(page.locator('#game-screen')).toHaveClass(/active/);
  await expect(page.locator('#map')).toBeVisible();

  // Click in the center of the map
  await page.locator('#map').click();

  // Check if the guess button is enabled
  const guessBtn = page.locator('#guess-btn');
  await expect(guessBtn).not.toBeDisabled();

  // Click the guess button
  await guessBtn.click();

  // Check if the result overlay is visible
  await expect(page.locator('#result-overlay')).toHaveClass(/active/);
});

