# Use Node LTS base (for npm and claude CLI)
FROM node:lts-bookworm

# Prevent apt from prompting for input
ENV DEBIAN_FRONTEND=noninteractive

# Install basic utilities, fish shell, and Chromium with dependencies
RUN apt-get update && apt-get install -y \
    git curl bash vim less ca-certificates fish ripgrep \
    chromium \
    chromium-driver \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
 && rm -rf /var/lib/apt/lists/*

# Install Claude CLI, Playwright, OpenAI Codex, and Google Gemini CLI globally
RUN npm install -g @anthropic-ai/claude-code playwright @openai/codex @google/gemini-cli

# Install Cursor CLI
RUN curl https://cursor.com/install -fsS | bash

# Install Playwright browsers (using system chromium)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_PATH=/usr/local/lib/node_modules

# Create dev user with UID 501 (matching host user)
# This prevents "whoami: cannot find name for user ID 501" warnings
RUN groupadd -g 501 dev 2>/dev/null || groupmod -g 501 $(getent group 20 | cut -d: -f1) 2>/dev/null || true
RUN useradd -u 501 -g 501 -d /home/dev -s /bin/bash dev 2>/dev/null || usermod -u 501 -d /home/dev dev 2>/dev/null || true

# Create a home directory for the dev user that will be writable
RUN mkdir -p /home/dev && chown -R 501:501 /home/dev

# Set HOME environment variable
ENV HOME=/home/dev

# Create workspace and make it writable by all users
# The container will run as the host user, so we need world-writable permissions
WORKDIR /workspace
RUN chmod 777 /workspace

# Copy the Claude Code loop script
COPY run-loop.sh /usr/local/bin/run-loop
RUN chmod +x /usr/local/bin/run-loop

# Default command: drop into a fish shell
CMD [ "fish" ]
