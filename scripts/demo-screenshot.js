#!/usr/bin/env node

/**
 * Demo: Take screenshots of web pages
 * Usage: node scripts/demo-screenshot.js <url> [output-path]
 */

const { chromium } = require('playwright');

async function takeScreenshot(url, outputPath = 'screenshot.png') {
  console.log(`📸 Taking screenshot of ${url}...`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ]
  });

  const page = await browser.newPage();

  // Set viewport size
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Navigate to URL
  console.log(`🌐 Loading ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Get page info
  const title = await page.title();
  console.log(`📄 Page title: "${title}"`);

  // Take screenshot
  console.log(`💾 Saving screenshot to ${outputPath}...`);
  await page.screenshot({
    path: outputPath,
    fullPage: true
  });

  // Get file size
  const fs = require('fs');
  const stats = fs.statSync(outputPath);
  const fileSizeInKB = (stats.size / 1024).toFixed(2);

  console.log(`✅ Screenshot saved successfully!`);
  console.log(`📊 File size: ${fileSizeInKB} KB`);
  console.log(`📁 Location: ${outputPath}`);

  await browser.close();
}

// CLI interface
if (require.main === module) {
  const url = process.argv[2];
  const outputPath = process.argv[3] || 'screenshot.png';

  if (!url) {
    console.log(`Usage: node scripts/demo-screenshot.js <url> [output-path]

Examples:
  node scripts/demo-screenshot.js https://example.com
  node scripts/demo-screenshot.js https://github.com github.png
  node scripts/demo-screenshot.js https://playwright.dev /workspace/playwright.png
    `);
    process.exit(1);
  }

  takeScreenshot(url, outputPath)
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { takeScreenshot };
