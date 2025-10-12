# Multi-Project Setup Guide

This guide explains how to use the centralized agent container configuration across multiple projects.

## Architecture Overview

The agent container system uses Docker Compose's `extends` feature to create a centralized base configuration that projects can inherit from. This allows:

- **Single source of truth**: All scripts, Dockerfile, and base config in one place
- **Automatic updates**: Projects inherit changes when they rebuild
- **Minimal per-project config**: Just volumes, ports, and env vars
- **No sync step**: Extends references the central repo directly

## How It Works

### Base Configuration (`docker-compose.base.yml`)

The base configuration contains all the reusable parts:
- Dockerfile build context
- User mapping and security settings
- Shared environment variables
- Common ports (with defaults)
- Fish shell and SSH config mounts

### Project Configuration (`docker-compose.yml`)

Each project has a minimal compose file that:
- Extends the base configuration
- Defines project-specific volumes
- Overrides ports if needed
- Adds project-specific environment variables

### Environment Variables (`.env`)

Each project has a `.env` file with:
- Path to the central agent container repo
- Project name and user/group IDs
- Port mappings
- Additional project-specific variables

## Setting Up New Projects

### Using the Initialization Script

The easiest way to set up a new project:

```bash
# From the agent container directory
cd /Users/nate/Projects/agent-container
./init-project.sh my-project /Users/nate/Projects/my-project
```

This will:
1. Create `docker-compose.yml` that extends the base config
2. Generate `.env` with detected settings
3. Copy a README with quick start instructions
4. Add `.env` to `.gitignore` if it exists

### Manual Setup

If you prefer to set up manually:

1. **Create `docker-compose.yml`:**
```yaml
services:
  agent:
    extends:
      file: /Users/nate/Projects/agent-container/docker-compose.base.yml
      service: agent-base
    
    volumes:
      - .:/workspace/my-project:rw
    
    ports:
      - "3000:3000"
    
    environment:
      - PROJECT_NAME=my-project
```

2. **Create `.env`:**
```bash
AGENT_CONTAINER_PATH=/Users/nate/Projects/agent-container
PROJECT_NAME=my-project
AGENT_UID=501
AGENT_GID=20
PROJECT_PORT_3000=3000
```

3. **Build and run:**
```bash
docker compose build
docker compose run --rm agent
```

## Customization

### Adding Project-Specific Volumes

```yaml
services:
  agent:
    extends:
      file: /path/to/agent-container/docker-compose.base.yml
      service: agent-base
    
    volumes:
      - .:/workspace/my-project:rw
      - ../shared-lib:/workspace/shared-lib:rw
      - /path/to/data:/workspace/data:ro
```

### Custom Port Mappings

```yaml
services:
  agent:
    extends:
      file: /path/to/agent-container/docker-compose.base.yml
      service: agent-base
    
    ports:
      - "8080:3000"  # Map host port 8080 to container port 3000
      - "8081:3001"  # Map host port 8081 to container port 3001
```

### Project-Specific Environment Variables

```yaml
services:
  agent:
    extends:
      file: /path/to/agent-container/docker-compose.base.yml
      service: agent-base
    
    environment:
      - PROJECT_NAME=my-project
      - DATABASE_URL=${DATABASE_URL}
      - API_KEY=${API_KEY}
      - NODE_ENV=development
```

## Updating Projects

When you make changes to the central agent container configuration:

1. **Pull the latest changes:**
```bash
cd /Users/nate/Projects/agent-container
git pull
```

2. **Rebuild the image in each project:**
```bash
cd /Users/nate/Projects/my-project
docker compose build
```

3. **Run the updated container:**
```bash
docker compose run --rm agent
```

## Troubleshooting

### Permission Issues

If you get permission errors, check your user/group IDs:

```bash
# Check your user ID and group ID
id -u
id -g

# Update .env file
AGENT_UID=501
AGENT_GID=20
```

### Port Conflicts

If ports are already in use, the init script will detect this and suggest alternatives. You can also manually set ports in `.env`:

```bash
PROJECT_PORT_3000=4000
PROJECT_PORT_3001=4001
```

### Script Not Found Errors

If scripts can't be found, check the `AGENT_CONTAINER_PATH` in your `.env`:

```bash
# Should point to the agent container directory
AGENT_CONTAINER_PATH=/Users/nate/Projects/agent-container
```

### Docker Compose Extends Issues

If `extends` doesn't work, ensure:
1. The path to `docker-compose.base.yml` is correct
2. The service name `agent-base` matches the base file
3. You're using Docker Compose v2 (not v1)

### Build Context Issues

The base configuration uses `.` as the build context, which means it builds from the project directory. If you need to build from the agent container directory, you can override this:

```yaml
services:
  agent:
    extends:
      file: /path/to/agent-container/docker-compose.base.yml
      service: agent-base
    
    build:
      context: /path/to/agent-container
      dockerfile: Dockerfile
```

## Best Practices

### Version Control

- **Commit** `docker-compose.yml` and `.env.example` to your project
- **Don't commit** `.env` (contains sensitive data)
- **Don't commit** the agent container directory to your project

### Environment Management

- Use `.env.example` as a template for other developers
- Document required environment variables in your project README
- Use different `.env` files for different environments if needed

### Project Organization

- Keep project-specific config minimal
- Use descriptive project names
- Document any customizations in your project README

## Advanced Usage

### Multiple Agent Containers

You can have multiple agent container configurations for different purposes:

```yaml
services:
  web-agent:
    extends:
      file: /path/to/web-agent-container/docker-compose.base.yml
      service: agent-base
    
  data-agent:
    extends:
      file: /path/to/data-agent-container/docker-compose.base.yml
      service: agent-base
```

### Custom Base Configurations

You can create custom base configurations for specific types of projects:

```yaml
# docker-compose.web-base.yml
services:
  web-agent-base:
    extends:
      file: ./docker-compose.base.yml
      service: agent-base
    
    environment:
      - NODE_ENV=development
      - WEB_PORT=3000
```

### CI/CD Integration

For automated builds, you can set environment variables in your CI system:

```bash
# In your CI pipeline
export AGENT_CONTAINER_PATH=/path/to/agent-container
export PROJECT_NAME=my-project
export AGENT_UID=1000
export AGENT_GID=1000

docker compose build
docker compose run --rm agent npm test
```

## Migration from Single Project

If you have an existing single-project setup, you can migrate by:

1. **Backup your current configuration:**
```bash
cp docker-compose.yml docker-compose.yml.backup
cp .env .env.backup
```

2. **Create the base configuration:**
```bash
# Move your current config to base
mv docker-compose.yml docker-compose.base.yml
```

3. **Create a new project configuration:**
```bash
# Use the template
cp template/docker-compose.yml docker-compose.yml
cp template/env.example .env
```

4. **Update the new configuration:**
   - Edit `docker-compose.yml` to add your specific volumes
   - Edit `.env` to set your project name and paths
   - Test the new configuration

5. **Clean up:**
```bash
rm docker-compose.yml.backup .env.backup
```
