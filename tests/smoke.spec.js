const { test, expect } = require('@playwright/test');

test('loads the start screen and can enter the game shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Worldwide' })).toBeVisible();
  await page.getByRole('button', { name: 'PLAY PRACTICE' }).click();

  // Select difficulty
  await page.getByRole('button', { name: 'Normal' }).click();

  await expect(page.locator('#game-screen')).toHaveClass(/active/);
  await expect(page.locator('.photo-loading')).toBeVisible();
});

test('can complete all rounds and reach end screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'PLAY PRACTICE' }).click();

  // Select difficulty
  await page.getByRole('button', { name: 'Normal' }).click();

  await expect(page.locator('#game-screen')).toHaveClass(/active/);
  await expect(page.locator('#map')).toBeVisible();

  for (let round = 0; round < 5; round++) {
    // Click on the map to place a pin
    await page.locator('#map').click();

    // Check if the guess button is enabled
    const guessBtn = page.locator('.btn-guess');
    await expect(guessBtn).not.toBeDisabled();

    // Click the guess button
    await guessBtn.click();

    // Check if the result overlay is visible
    await expect(page.locator('#result-overlay')).toHaveClass(/active/);

    // Click next round or see results button
    const nextBtn = page.locator('.btn-next');
    await nextBtn.click();
  }

  await expect(page.locator('#end-screen')).toHaveClass(/active/);
  await expect(page.locator('.final-score')).toBeVisible();
});

test('can click the map and click confirm guess', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'PLAY PRACTICE' }).click();

  // Select difficulty
  await page.getByRole('button', { name: 'Normal' }).click();

  await expect(page.locator('#game-screen')).toHaveClass(/active/);
  await expect(page.locator('#map')).toBeVisible();

  // Click in the center of the map
  await page.locator('#map').click();

  // Check if the guess button is enabled
  const guessBtn = page.locator('.btn-guess');
  await expect(guessBtn).not.toBeDisabled();

  // Click the guess button
  await guessBtn.click();

  // Check if the result overlay is visible
  await expect(page.locator('#result-overlay')).toHaveClass(/active/);
});


