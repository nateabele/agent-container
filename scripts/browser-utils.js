#!/usr/bin/env node

/**
 * Browser utilities for headless Chrome in the container
 * Usage examples in comments below
 */

const { chromium } = require('playwright');

async function startBrowser() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=9222',
      '--remote-debugging-address=0.0.0.0',
    ]
  });
  return browser;
}

async function getPageContent(url) {
  const browser = await startBrowser();
  const page = await browser.newPage();
  await page.goto(url);
  const content = await page.content();
  await browser.close();
  return content;
}

async function getConsoleLogs(url) {
  const browser = await startBrowser();
  const page = await browser.newPage();
  const logs = [];

  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await browser.close();

  return logs;
}

async function executeScript(url, script) {
  const browser = await startBrowser();
  const page = await browser.newPage();
  await page.goto(url);
  const result = await page.evaluate(script);
  await browser.close();
  return result;
}

async function screenshot(url, path) {
  const browser = await startBrowser();
  const page = await browser.newPage();
  await page.goto(url);
  await page.screenshot({ path, fullPage: true });
  await browser.close();
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  (async () => {
    switch (command) {
      case 'content':
        const content = await getPageContent(args[0]);
        console.log(content);
        break;

      case 'logs':
        const logs = await getConsoleLogs(args[0]);
        console.log(JSON.stringify(logs, null, 2));
        break;

      case 'eval':
        const result = await executeScript(args[0], args[1]);
        console.log(JSON.stringify(result, null, 2));
        break;

      case 'screenshot':
        await screenshot(args[0], args[1] || 'screenshot.png');
        console.log(`Screenshot saved to ${args[1] || 'screenshot.png'}`);
        break;

      default:
        console.log(`Usage:
  node scripts/browser-utils.js content <url>              - Get page HTML
  node scripts/browser-utils.js logs <url>                 - Get console logs
  node scripts/browser-utils.js eval <url> <script>        - Execute JavaScript
  node scripts/browser-utils.js screenshot <url> [path]    - Take screenshot
        `);
    }
  })().catch(console.error);
}

module.exports = {
  startBrowser,
  getPageContent,
  getConsoleLogs,
  executeScript,
  screenshot
};
