import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3001', { waitUntil: 'load' });
  
  // Wait for game to load
  await page.waitForTimeout(2000);
  
  // Take screenshot of start scene
  console.log('📸 Start scene loaded');
  await page.screenshot({ path: 'step1-start.png' });
  
  // Click first starter (Bulbasaur)
  await page.click('text=[Elegir]');
  await page.waitForTimeout(3000);
  
  console.log('📸 Game scene loaded');
  await page.screenshot({ path: 'step2-game.png' });
  
  // Click bag button
  await page.click('text=Mochila');
  await page.waitForTimeout(1500);
  
  console.log('📸 Bag scene loaded');
  await page.screenshot({ path: 'step3-bag-initial.png' });
  
  // Check initial state
  const bagText = await page.textContent('body');
  console.log('Bag scene text:', bagText.substring(0, 500));
  
  await browser.close();
  console.log('✅ Test complete');
})();
