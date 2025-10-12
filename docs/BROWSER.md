# Headless Browser Setup

This container includes a fully functional headless Chromium browser with Playwright for automation and scripting.

## Features

- ✅ Headless Chromium 141.0.7390.54
- ✅ Playwright automation library
- ✅ Chrome DevTools Protocol (CDP) access on port 9222
- ✅ Full DOM and JavaScript execution access
- ✅ Console log capture
- ✅ Screenshot capabilities
- ✅ Network request monitoring

## Quick Start

### 1. Using Playwright API (Recommended)

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.goto('https://example.com');

  // Get page title
  const title = await page.title();
  console.log('Title:', title);

  // Execute JavaScript in page context
  const result = await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      headings: Array.from(document.querySelectorAll('h1,h2,h3'))
        .map(h => h.textContent)
    };
  });
  console.log(result);

  // Capture console logs
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await browser.close();
})();
```

### 2. Using Browser Utils

The included `scripts/browser-utils.js` provides CLI commands:

```bash
# Get page HTML content
node scripts/browser-utils.js content https://example.com

# Capture console logs
node scripts/browser-utils.js logs https://example.com

# Execute JavaScript and get result
node scripts/browser-utils.js eval https://example.com "document.title"

# Take screenshot
node scripts/browser-utils.js screenshot https://example.com screenshot.png
```

### 3. Using Chrome DevTools Protocol (CDP)

The browser is accessible via CDP on port 9222:

```javascript
// Connect to remote debugging
const CDP = require('chrome-remote-interface');

CDP({ port: 9222 }, async (client) => {
  const { Network, Page, Runtime } = client;

  await Network.enable();
  await Page.enable();

  await Page.navigate({ url: 'https://example.com' });

  const result = await Runtime.evaluate({
    expression: 'document.title'
  });
  console.log(result.result.value);

  await client.close();
});
```

## Environment Variables

The following environment variables are pre-configured:

- `NODE_PATH=/usr/local/lib/node_modules` - Makes Playwright available globally
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` - Points to system Chromium
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` - Prevents downloading additional browsers

## Common Use Cases

### Web Scraping

```javascript
const { chromium } = require('playwright');

async function scrape(url) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(url);

  const data = await page.evaluate(() => {
    const articles = [];
    document.querySelectorAll('article').forEach(article => {
      articles.push({
        title: article.querySelector('h2')?.textContent,
        content: article.querySelector('p')?.textContent
      });
    });
    return articles;
  });

  await browser.close();
  return data;
}
```

### Testing Web Applications

```javascript
const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Navigate and interact
  await page.goto('http://localhost:3000');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');

  // Wait and assert
  await page.waitForSelector('.success-message');
  const message = await page.locator('.success-message').textContent();
  console.log('Success:', message);

  await browser.close();
}
```

### Monitoring Console Errors

```javascript
const { chromium } = require('playwright');

async function monitorErrors(url) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack
    });
  });

  await page.goto(url);
  await page.waitForLoadState('networkidle');

  await browser.close();
  return errors;
}
```

### Taking Screenshots

```javascript
const { chromium } = require('playwright');

async function screenshot(url, path) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(url);

  // Full page screenshot
  await page.screenshot({
    path,
    fullPage: true
  });

  // Specific element screenshot
  await page.locator('header').screenshot({
    path: 'header.png'
  });

  await browser.close();
}
```

## Troubleshooting

### Browser won't launch

Make sure to include the required args:
```javascript
args: [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage'
]
```

### Module not found

Ensure `NODE_PATH` is set in your environment:
```bash
export NODE_PATH=/usr/local/lib/node_modules
```

### Permission denied

The browser runs as the container user (UID 501). Make sure `/home/dev` is writable.

## Testing

Run the included test suite:

```bash
docker compose run --rm agent node tests/test-browser.js
```

Expected output:
```
🧪 Testing headless Chromium setup...
✅ Browser launched successfully
✅ Navigation successful
✅ Page title: "Example Domain"
...
🎉 All tests passed!
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Chromium Command Line Switches](https://peter.sh/experiments/chromium-command-line-switches/)
