# Agent Container

A Docker container environment for AI agents with headless browser automation capabilities, fish shell, and development tools.

## Features

### 🐚 Shell Environment
- **Fish shell** with your host configuration
- Platform-specific configs (Darwin.fish for macOS, Linux.fish for containers)
- Persistent history and settings

### 🌐 Headless Browser
- **Chromium 141** with Playwright automation
- Full DOM and JavaScript access
- Console log capture
- Screenshot capabilities
- Chrome DevTools Protocol on port 9222

### 🛠️ Development Tools
- Node.js LTS with npm/pnpm
- TypeScript 5.0+ with strict type checking
- Claude CLI
- OpenAI Codex integration
- Google Gemini CLI integration
- AI usage monitoring and auto-switching
- Git, vim, and common utilities

## Quick Start

### Single Project Setup

1. Configure environment variables:
```bash
# Edit .env with your paths and user ID
# Already configured with your projects
```

2. Build and run:
```bash
docker compose build
docker compose run --rm agent
```

### Multi-Project Setup

This container configuration can be used across multiple projects with automatic updates.

**Initialize a new project:**
```bash
# From the agent container directory
cd /Users/nate/Projects/agent-container
./init-project.sh my-project /Users/nate/Projects/my-project
```

**Run from any project:**
```bash
cd /Users/nate/Projects/my-project
docker compose build
docker compose run --rm agent
```

**Update all projects:**
```bash
# Pull latest changes
cd /Users/nate/Projects/agent-container && git pull

# Rebuild in each project
cd /Users/nate/Projects/my-project && docker compose build
```

See [docs/MULTI_PROJECT.md](docs/MULTI_PROJECT.md) for detailed multi-project documentation.

### Browser Automation

See [docs/BROWSER.md](docs/BROWSER.md) for comprehensive browser documentation.

**Quick Examples:**

```bash
# Run test suite
docker compose run --rm agent node tests/test-browser.js

# Take a screenshot
docker compose run --rm agent node scripts/demo-screenshot.js https://example.com

# Get console logs
docker compose run --rm agent node scripts/browser-utils.js logs https://example.com

# Execute JavaScript
docker compose run --rm agent node scripts/browser-utils.js eval https://example.com "document.title"
```

### Programmatic Usage

```javascript
const { chromium } = require('playwright');

const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});

const page = await browser.newPage();
await page.goto('https://example.com');

// Access DOM
const title = await page.title();

// Execute JavaScript
const data = await page.evaluate(() => ({
  url: location.href,
  headings: Array.from(document.querySelectorAll('h1')).map(h => h.textContent)
}));

// Capture console
page.on('console', msg => console.log('BROWSER:', msg.text()));

await browser.close();
```

### AI Provider Usage

```javascript
const AIProvider = require('./scripts/ai-provider');

const provider = new AIProvider();

// Execute with auto-switching between all providers
const result = await provider.execute("What is the capital of France?", 100);

console.log(`Provider: ${result.provider}`);
console.log(`Tokens: ${result.tokens}`);
console.log(`Response: ${result.result}`);

// Check usage status
provider.printStatus();

// Get health status
const health = await provider.getHealthStatus();

// Validate authentication
const auth = await provider.validateAuthentication();

// List all providers
const providers = provider.getAllProviderInfo();
```

## Configuration

### Environment Variables

Set in [docker-compose.yml](docker-compose.yml):

- `NODE_PATH=/usr/local/lib/node_modules` - Global Node.js modules
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` - Browser path
- `HOME=/home/dev` - User home directory

### AI Provider Configuration

Configure in [config/usage-config.json](config/usage-config.json):

```json
{
  "claude-code": {
    "dailyLimit": 1000000,
    "weeklyLimit": 5000000,
    "switchThreshold": 0.75
  },
  "codex": {
    "dailyLimit": 1000000,
    "weeklyLimit": 5000000,
    "switchThreshold": 0.75
  },
  "gemini": {
    "dailyLimit": 1000000,
    "weeklyLimit": 5000000,
    "switchThreshold": 0.75
  },
  "cursor": {
    "dailyLimit": 1000000,
    "weeklyLimit": 5000000,
    "switchThreshold": 0.75
  },
  "providers": {
    "primary": "claude-code",
    "fallback": "codex",
    "secondary-fallback": "gemini",
    "tertiary-fallback": "cursor"
  }
}
```

The system automatically switches providers when usage exceeds 75% of daily or weekly limits.

### Provider Interface Architecture

The AI provider system uses a modular architecture with the following components:

- **BaseAIProvider**: Abstract base class defining the provider interface
- **ProviderOrchestrator**: Manages multiple providers and handles routing/fallbacks
- **ProviderFactory**: Creates and configures provider instances
- **Concrete Providers**: Implementations for Claude, Codex, Gemini, and Cursor

Each provider implements:
- **Authentication**: Login and validation methods
- **Execution**: Request processing and response handling
- **Usage Tracking**: Token counting and limit monitoring
- **Health Monitoring**: Availability and status reporting

### Provider Configuration

Providers are configured using an array-based system where **array order = priority order**:

```javascript
const factory = new ProviderFactory();
const providers = [
  factory.createProvider('gemini', { dailyLimit: 2000000, switchThreshold: 0.8 }),
  factory.createProvider('claude-code', { dailyLimit: 1500000, switchThreshold: 0.7 }),
  factory.createProvider('codex', { dailyLimit: 1000000, switchThreshold: 0.75 }),
  factory.createProvider('cursor', { dailyLimit: 500000, switchThreshold: 0.9 })
];

const orchestrator = new ProviderOrchestrator(providers);
```

The system will try providers in array order, falling back to the next available provider if the current one fails or exceeds usage limits.

### Ports

- `3000` - Vite/Next.js dev server
- `3001` - Additional dev server
- `5173` - Vite default port
- `9222` - Chrome DevTools Protocol

### Volumes

- Your project directories (configured in `.env`)
- Fish config: `~/.config/fish` (read-only)

## Files

### Configuration
- [Dockerfile](Dockerfile) - Container image definition
- [docker-compose.base.yml](docker-compose.base.yml) - Base service configuration
- [docker-compose.yml](docker-compose.yml) - Example project configuration
- [template/](template/) - Project template files
- [init-project.sh](init-project.sh) - Project initialization script

### Fish Shell
- `~/.config/fish/config.fish` - Main config (platform-agnostic)
- `~/.config/fish/Darwin.fish` - macOS-specific settings
- `~/.config/fish/Linux.fish` - Linux/container settings

### Browser Tools
- [scripts/browser-utils.js](scripts/browser-utils.js) - CLI utilities for browser automation
- [tests/test-browser.ts](tests/test-browser.ts) - Comprehensive test suite
- [scripts/demo-screenshot.js](scripts/demo-screenshot.js) - Screenshot example
- [docs/BROWSER.md](docs/BROWSER.md) - Browser documentation

## TypeScript Development

This project is built with TypeScript for type safety and better developer experience.

### Development Commands

```bash
# Type checking
npm run type-check

# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Clean build artifacts
npm run clean

# Run tests
npm test
```

### Project Structure

```
src/
├── types.ts                    # Core type definitions
├── index.ts                    # Main entry point
├── ai-provider.ts              # Main AI provider wrapper
└── providers/
    ├── base-provider.ts         # Abstract base provider
    ├── claude-provider.ts       # Claude Code implementation
    ├── codex-provider.ts        # OpenAI Codex implementation
    ├── gemini-provider.ts       # Google Gemini implementation
    ├── cursor-provider.ts       # Cursor AI implementation
    ├── provider-factory.ts     # Provider factory
    └── provider-orchestrator.ts # Provider orchestration

tests/
├── test-browser.ts              # Browser automation tests
├── test-provider-interface.ts   # Provider interface tests
└── example-custom-providers.ts  # Custom provider examples

dist/                           # Compiled JavaScript output
```

### AI Provider Tools
- [src/ai-provider.ts](src/ai-provider.ts) - Main AI provider wrapper with auto-switching
- [src/providers/](src/providers/) - Provider implementations and orchestration
- [tests/test-provider-interface.ts](tests/test-provider-interface.ts) - Provider interface tests
- [tests/example-custom-providers.ts](tests/example-custom-providers.ts) - Custom provider examples
- [config/usage-config.json](config/usage-config.json) - Configuration file

### Multi-Project Documentation
- [docs/MULTI_PROJECT.md](docs/MULTI_PROJECT.md) - Comprehensive multi-project setup guide
- [template/README.md](template/README.md) - Quick start guide for new projects

## Development

### Running Commands

```bash
# Interactive shell
docker compose run --rm agent

# Run specific command
docker compose run --rm agent node script.js

# Mount additional volumes
docker compose run --rm -v /path/to/dir:/workspace/dir agent
```

### Testing

```bash
# Test browser functionality
docker compose run --rm agent node tests/test-browser.js

# Test AI provider integration
docker compose run --rm agent node tests/test-ai-integration.js

# Test AI provider with example
docker compose run --rm agent node scripts/example-usage.js

# Test fish shell
docker compose run --rm agent fish -c "echo 'Fish works'"

# Validate environment
docker compose run --rm agent bash -c "chromium --version && node -v && fish --version"

# Check AI provider status
docker compose run --rm agent node scripts/ai-provider.js status

# Execute AI provider with prompt from stdin
echo "Your prompt here" | docker compose run --rm agent node scripts/ai-loop-executor.js
```

## Troubleshooting

### Browser Issues

**Problem:** `Executable doesn't exist at .../headless_shell`
```javascript
// Solution: Always specify executablePath
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium'
});
```

**Problem:** `Permission denied` errors
```javascript
// Solution: Include required args
args: [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage'
]
```

### Module Not Found

```bash
# Verify NODE_PATH
docker compose run --rm agent node -e "console.log(process.env.NODE_PATH)"

# Should output: /usr/local/lib/node_modules
```

### Fish Shell Issues

If fish config has errors, check platform-specific files:
- macOS-only commands should be in `Darwin.fish`
- Container commands should be in `Linux.fish`
- Shared config goes in `config.fish`

## Architecture

The container runs as your host user (UID/GID from `.env`) to ensure clean file ownership in bind-mounted directories. This allows seamless editing of project files from both host and container.

Key decisions:
- **System Chromium** instead of Playwright's bundled browser (smaller image)
- **Global npm packages** accessible via NODE_PATH
- **Platform-specific fish configs** for seamless host/container switching
- **Read-only config mounts** to prevent accidental modifications

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Fish Shell Documentation](https://fishshell.com/docs/current/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
