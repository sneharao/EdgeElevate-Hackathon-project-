import { chromium } from './node_modules/playwright-core/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Landing page
await page.goto('http://localhost:3000');
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/pipeline-landing.png', fullPage: true });
console.log('Screenshot saved to /tmp/pipeline-landing.png');

// Trigger analysis to capture the flow
const input = page.locator('input[placeholder="TARGET STARTUP OR BRAND"]');
if (await input.isVisible()) {
  await input.fill('FIGMA');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/pipeline-analysis.png', fullPage: true });
  console.log('Screenshot saved to /tmp/pipeline-analysis.png');

  // Wait for completion and capture dashboard
  await page.waitForTimeout(15000);
  await page.screenshot({ path: '/tmp/pipeline-dashboard.png', fullPage: true });
  console.log('Screenshot saved to /tmp/pipeline-dashboard.png');
}

await browser.close();
