#!/usr/bin/env node

/**
 * Test script to validate browser functionality
 */

const { chromium } = require('playwright');

async function testBrowser() {
  console.log('🧪 Testing headless Chromium setup...\n');

  try {
    // Test 1: Launch browser
    console.log('1. Launching browser...');
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ]
    });
    console.log('✅ Browser launched successfully\n');

    // Test 2: Create page and navigate
    console.log('2. Creating page and navigating to example.com...');
    const page = await browser.newPage();
    await page.goto('https://example.com');
    console.log('✅ Navigation successful\n');

    // Test 3: Get page title
    console.log('3. Getting page title...');
    const title = await page.title();
    console.log(`✅ Page title: "${title}"\n`);

    // Test 4: Execute JavaScript in page
    console.log('4. Executing JavaScript in page context...');
    const result = await page.evaluate(() => {
      return {
        url: window.location.href,
        userAgent: navigator.userAgent,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth
      };
    });
    console.log('✅ JavaScript execution successful:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    // Test 5: Get DOM content
    console.log('5. Getting DOM content...');
    const h1Text = await page.locator('h1').textContent();
    console.log(`✅ Found H1 text: "${h1Text}"\n`);

    // Test 6: Console log capture
    console.log('6. Testing console log capture...');
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(msg.text()));

    await page.evaluate(() => {
      console.log('Test message from browser');
      console.warn('Test warning from browser');
      console.error('Test error from browser');
    });

    console.log(`✅ Captured ${consoleLogs.length} console messages:`);
    consoleLogs.forEach(log => console.log(`   - ${log}`));
    console.log('');

    // Test 7: Get computed styles
    console.log('7. Getting computed styles...');
    const bodyStyle = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      return {
        backgroundColor: style.backgroundColor,
        fontFamily: style.fontFamily,
        margin: style.margin
      };
    });
    console.log('✅ Body styles:');
    console.log(JSON.stringify(bodyStyle, null, 2));
    console.log('');

    // Cleanup
    await browser.close();
    console.log('✅ Browser closed successfully\n');

    console.log('🎉 All tests passed! Browser is ready for use.');
    console.log('\nYou can now use the browser via:');
    console.log('  - Playwright API in Node.js scripts');
    console.log('  - node scripts/browser-utils.js <command> <url>');
    console.log('  - Chrome DevTools Protocol at http://localhost:9222');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testBrowser();
