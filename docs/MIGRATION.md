# Migration Plan for Existing Projects

This guide helps you migrate existing projects to use the new centralized base configuration.

## Overview

The migration involves:
1. **Backing up** your current configuration
2. **Converting** your project's `docker-compose.yml` to extend the base
3. **Creating** a project-specific `.env` file
4. **Testing** the new configuration
5. **Cleaning up** old files

## Step-by-Step Migration

### Step 1: Backup Current Configuration

Before making any changes, backup your current setup:

```bash
# In your project directory
cp docker-compose.yml docker-compose.yml.backup
cp .env .env.backup 2>/dev/null || echo "No .env file found"
```

### Step 2: Identify Your Project Configuration

Look at your current `docker-compose.yml` and identify:

**Project-specific volumes:**
- Your project directory mount
- Any additional directories you mount
- Shared libraries or data directories

**Custom ports:**
- Any port mappings you've changed from defaults
- Additional ports you've added

**Environment variables:**
- Project-specific variables
- Any overrides to default settings

**Example current configuration:**
```yaml
services:
  agent:
    build:
      context: .
      dockerfile: Dockerfile
    user: "${AGENT_UID}:${AGENT_GID}"
    volumes:
      - .:/workspace/my-project:rw
      - ../shared-lib:/workspace/shared-lib:rw
      - /path/to/data:/workspace/data:ro
    ports:
      - "8080:3000"  # Custom port mapping
      - "3001:3001"
    environment:
      - PROJECT_NAME=my-project
      - DATABASE_URL=${DATABASE_URL}
      - API_KEY=${API_KEY}
```

### Step 3: Create New docker-compose.yml

Replace your current `docker-compose.yml` with one that extends the base:

```yaml
services:
  agent:
    extends:
      file: /Users/nate/Projects/agent-container/docker-compose.base.yml
      service: agent-base
    
    # Project-specific volumes
    volumes:
      - .:/workspace/my-project:rw
      - ../shared-lib:/workspace/shared-lib:rw
      - /path/to/data:/workspace/data:ro
    
    # Project-specific ports (optional - defaults from base)
    ports:
      - "8080:3000"  # Custom port mapping
      - "3001:3001"
    
    # Project-specific environment variables
    environment:
      - PROJECT_NAME=my-project
      - DATABASE_URL=${DATABASE_URL}
      - API_KEY=${API_KEY}
```

### Step 4: Create .env File

Create a `.env` file with your project-specific settings:

```bash
# Agent Container Configuration
# Generated for my-project

# Path to the agent container repository
AGENT_CONTAINER_PATH=/Users/nate/Projects/agent-container

# Project name (used for workspace directory)
PROJECT_NAME=my-project

# User ID and Group ID
AGENT_UID=501
AGENT_GID=20

# Project-specific ports
PROJECT_PORT_3000=8080  # Custom port
PROJECT_PORT_3001=3001
PROJECT_PORT_5173=5173
PROJECT_PORT_9222=9222

# Additional project-specific environment variables
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
API_KEY=your-api-key-here
```

### Step 5: Test the New Configuration

Test the migrated configuration:

```bash
# Build the container
docker compose build

# Test basic functionality
docker compose run --rm agent echo "Container works"

# Test your specific use case
docker compose run --rm agent node --version
docker compose run --rm agent fish -c "echo 'Fish works'"

# Test AI provider if you use it
docker compose run --rm agent node /Users/nate/Projects/agent-container/scripts/ai-provider.js status
```

### Step 6: Update .gitignore

Add `.env` to your `.gitignore` if it's not already there:

```bash
echo "" >> .gitignore
echo "# Agent container environment" >> .gitignore
echo ".env" >> .gitignore
```

### Step 7: Clean Up

Once everything works, remove the backup files:

```bash
rm docker-compose.yml.backup .env.backup
```

## Migration Script

For automated migration, here's a script you can run in each project:

```bash
#!/bin/bash
# migrate-project.sh - Migrate existing project to base configuration

set -e

PROJECT_DIR="$(pwd)"
AGENT_CONTAINER_PATH="/Users/nate/Projects/agent-container"

echo "Migrating project in $PROJECT_DIR"

# Backup current configuration
echo "Backing up current configuration..."
cp docker-compose.yml docker-compose.yml.backup
cp .env .env.backup 2>/dev/null || echo "No .env file found"

# Extract project name from directory
PROJECT_NAME=$(basename "$PROJECT_DIR")

# Detect user ID and group ID
USER_ID=$(id -u)
GROUP_ID=$(id -g)

# Create new .env file
echo "Creating .env file..."
cat > .env << EOF
# Agent Container Configuration
# Generated for $PROJECT_NAME

# Path to the agent container repository
AGENT_CONTAINER_PATH=$AGENT_CONTAINER_PATH

# Project name (used for workspace directory)
PROJECT_NAME=$PROJECT_NAME

# User ID and Group ID
AGENT_UID=$USER_ID
AGENT_GID=$GROUP_ID

# Project-specific ports (detect from current config)
PROJECT_PORT_3000=3000
PROJECT_PORT_3001=3001
PROJECT_PORT_5173=5173
PROJECT_PORT_9222=9222

# Additional project-specific environment variables
# Add your custom variables here
EOF

# Create new docker-compose.yml
echo "Creating new docker-compose.yml..."
cat > docker-compose.yml << EOF
services:
  agent:
    extends:
      file: $AGENT_CONTAINER_PATH/docker-compose.base.yml
      service: agent-base
    
    # Project-specific volumes
    volumes:
      - .:/workspace/$PROJECT_NAME:rw
    
    # Project-specific ports (optional - defaults from base)
    ports:
      - "\${PROJECT_PORT_3000:-3000}:3000"
      - "\${PROJECT_PORT_3001:-3001}:3001"
      - "\${PROJECT_PORT_5173:-5173}:5173"
      - "\${PROJECT_PORT_9222:-9222}:9222"
    
    # Project-specific environment variables
    environment:
      - PROJECT_NAME=$PROJECT_NAME
EOF

# Update .gitignore
if [ -f .gitignore ]; then
    if ! grep -q "\.env" .gitignore; then
        echo "" >> .gitignore
        echo "# Agent container environment" >> .gitignore
        echo ".env" >> .gitignore
        echo "Added .env to .gitignore"
    fi
else
    echo ".env" > .gitignore
    echo "Created .gitignore"
fi

echo "Migration complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env to add your custom environment variables"
echo "2. Edit docker-compose.yml to add your custom volumes and ports"
echo "3. Test: docker compose build && docker compose run --rm agent"
echo "4. Remove backups: rm docker-compose.yml.backup .env.backup"
```

## Common Migration Scenarios

### Scenario 1: Simple Project
**Current:** Basic project with just the project directory mounted
**Migration:** Use the migration script above

### Scenario 2: Multi-Directory Project
**Current:** Project with multiple directories mounted
**Migration:** Add additional volumes to the new `docker-compose.yml`:

```yaml
services:
  agent:
    extends:
      file: /Users/nate/Projects/agent-container/docker-compose.base.yml
      service: agent-base
    
    volumes:
      - .:/workspace/my-project:rw
      - ../shared-lib:/workspace/shared-lib:rw
      - ../data:/workspace/data:ro
```

### Scenario 3: Custom Ports
**Current:** Project using non-standard ports
**Migration:** Update `.env` file:

```bash
PROJECT_PORT_3000=8080
PROJECT_PORT_3001=8081
```

### Scenario 4: Custom Environment Variables
**Current:** Project with many environment variables
**Migration:** Add them to both `.env` and `docker-compose.yml`:

**.env:**
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
API_KEY=your-api-key-here
REDIS_URL=redis://localhost:6379
```

**docker-compose.yml:**
```yaml
environment:
  - PROJECT_NAME=my-project
  - DATABASE_URL=${DATABASE_URL}
  - API_KEY=${API_KEY}
  - REDIS_URL=${REDIS_URL}
```

## Troubleshooting Migration

### Issue: "Service not found" error
**Cause:** The `extends` path is incorrect
**Solution:** Use absolute path to `docker-compose.base.yml`

### Issue: Port conflicts
**Cause:** Ports already in use
**Solution:** Update `PROJECT_PORT_*` variables in `.env`

### Issue: Permission denied
**Cause:** Wrong user/group IDs
**Solution:** Check and update `AGENT_UID` and `AGENT_GID` in `.env`

### Issue: Scripts not found
**Cause:** `AGENT_CONTAINER_PATH` not set correctly
**Solution:** Verify the path in `.env` points to the agent container directory

### Issue: Volumes not mounting
**Cause:** Volume paths changed
**Solution:** Check volume mappings in `docker-compose.yml`

## Post-Migration Benefits

After migration, you'll get:
- **Automatic updates** when you pull changes to the agent container
- **Consistent configuration** across all projects
- **Easier maintenance** with centralized base config
- **Better documentation** with project-specific READMEs

## Rollback Plan

If something goes wrong:

```bash
# Restore from backup
cp docker-compose.yml.backup docker-compose.yml
cp .env.backup .env 2>/dev/null || rm .env

# Rebuild
docker compose build
```

## Next Steps

1. **Migrate one project at a time** to test the process
2. **Document any customizations** in your project README
3. **Update your team** on the new configuration structure
4. **Set up CI/CD** to use the new configuration if applicable
