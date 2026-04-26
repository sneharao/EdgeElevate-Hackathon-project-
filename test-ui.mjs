import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  // Listen to page errors
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3000');
  
  console.log('Waiting 2 seconds...');
  await page.waitForTimeout(2000);
  
  // Type test brand name
  await page.fill('input[type="text"]', 'TestBrand');
  await page.screenshot({ path: '/tmp/before-submit.png' });
  
  console.log('Submitting form...');
  await page.click('button[type="submit"]');
  
  // Wait and capture after submit
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/after-submit.png' });
  
  // Wait longer to see if it redirects back
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/final-state.png' });
  
  console.log('Screenshots saved');
  await browser.close();
})();
