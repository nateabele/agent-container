#!/bin/bash
# migrate-project.sh - Migrate existing project to base configuration
# Usage:
#  cd /Users/nate/Projects/my-project; ~/Projects/agent-container/bin/migrate-project.sh

set -e

PROJECT_DIR="$(pwd)"
AGENT_CONTAINER_PATH="/Users/nate/Projects/agent-container"

echo "Migrating project in $PROJECT_DIR"

# Check if we're in a project directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found. Are you in a project directory?"
    exit 1
fi

# Backup current configuration
echo "Backing up current configuration..."
cp docker-compose.yml docker-compose.yml.backup
cp .env .env.backup 2>/dev/null || echo "No .env file found"

# Extract project name from directory
PROJECT_NAME=$(basename "$PROJECT_DIR")

# Detect user ID and group ID
USER_ID=$(id -u)
GROUP_ID=$(id -g)

# Detect common ports in use
detect_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        echo $((port + 1000))
    else
        echo $port
    fi
}

PORT_3000=$(detect_port 3000)
PORT_3001=$(detect_port 3001)
PORT_5173=$(detect_port 5173)
PORT_9222=$(detect_port 9222)

echo "Detected available ports: 3000->$PORT_3000, 3001->$PORT_3001, 5173->$PORT_5173, 9222->$PORT_9222"

# Create project-specific log directory in agent-container
PROJECT_LOG_DIR="$AGENT_CONTAINER_PATH/logs/$PROJECT_NAME"
if [ ! -d "$PROJECT_LOG_DIR" ]; then
    mkdir -p "$PROJECT_LOG_DIR"
    echo "Created project log directory: $PROJECT_LOG_DIR"
else
    echo "Project log directory already exists: $PROJECT_LOG_DIR"
fi

# Create session directory in project for persistent /home/dev
if [ ! -d "session" ]; then
    mkdir -p "session"
    echo "Created session directory: $PROJECT_DIR/session"
else
    echo "Session directory already exists: $PROJECT_DIR/session"
fi

# Create new .env file
echo "Creating .env file..."
cat > .env << EOF
# Agent Container Configuration
# Generated for $PROJECT_NAME

# Path to the agent container repository
AGENT_CONTAINER_PATH=$AGENT_CONTAINER_PATH

# Project name (used for workspace directory)
PROJECT_NAME=$PROJECT_NAME

# Project-specific log directory
PROJECT_LOG_DIR=$PROJECT_LOG_DIR

# User ID and Group ID
AGENT_UID=$USER_ID
AGENT_GID=$GROUP_ID

# Project-specific ports
PROJECT_PORT_3000=$PORT_3000
PROJECT_PORT_3001=$PORT_3001
PROJECT_PORT_5173=$PORT_5173
PROJECT_PORT_9222=$PORT_9222

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
      - \${PROJECT_LOG_DIR}:/workspace/logs:rw
      - ./session:/home/dev:rw

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
        echo "session/" >> .gitignore
        echo "Added .env and session/ to .gitignore"
    elif ! grep -q "session/" .gitignore; then
        echo "session/" >> .gitignore
        echo "Added session/ to .gitignore"
    fi
else
    echo ".env" > .gitignore
    echo "session/" >> .gitignore
    echo "Created .gitignore"
fi

echo "Migration complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env to add your custom environment variables"
echo "2. Edit docker-compose.yml to add your custom volumes and ports"
echo "3. Test: docker compose build && docker compose run --rm agent"
echo "4. Remove backups: rm docker-compose.yml.backup .env.backup"
echo ""
echo "Your old configuration is backed up as:"
echo "  - docker-compose.yml.backup"
echo "  - .env.backup (if it existed)"
