# Project Agent Container Setup

This project uses the centralized agent container configuration.

## Quick Start

1. **Build and run the container:**
   ```bash
   docker compose build
   docker compose run --rm agent # alias (docker-agent)
   ```

2. **Run specific commands:**
   ```bash
   # Interactive shell
   docker compose run --rm agent # alias (docker-agent)
   
   # Run a specific script
   docker compose run --rm agent node script.js
   
   # Run AI agent loop
   docker compose run --rm agent run-loop ./PROMPT.md
   ```

3. **Update the container:**
   ```bash
   # Pull latest changes from central repo
   cd ${AGENT_CONTAINER_PATH} && git pull
   
   # Rebuild with updates
   docker compose build
   ```

## Configuration

Edit `.env` to customize:
- Project name and paths
- Port mappings
- Additional environment variables
- User/group IDs

## Features

- **Fish shell** with your host configuration
- **Headless browser** automation with Playwright
- **AI provider** integration (Claude Code + OpenAI Codex)
- **Development tools** (Node.js, Git, vim, etc.)
- **Automatic updates** from central configuration

## Documentation Organization

**Create a `docs/` folder for all project documentation:**

```bash
mkdir -p docs
```

All documentation files (SPEC.md, ARCHITECTURE_NOTES.md, FIX_PLAN.md, etc.) should be placed in the `docs/` folder, not in the root directory. This keeps your project organized and follows best practices.

## Troubleshooting

- **Permission issues**: Check `AGENT_UID` and `AGENT_GID` in `.env`
- **Port conflicts**: Adjust `PROJECT_PORT_*` variables in `.env`
- **Script not found**: Ensure `AGENT_CONTAINER_PATH` is correct in `.env`

For more details, see the [central documentation](../../README.md).
