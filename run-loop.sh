#!/bin/bash
# Run AI agents in a loop with usage monitoring and auto-switching between Claude Code and Codex

set -e

# Hard-coded path to agent-container runtime files in the container
AGENT_RUNTIME_PATH="/usr/local/lib/agent-container"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if CLAUDE_CODE_OAUTH_TOKEN is set
if [ -z "$CLAUDE_CODE_OAUTH_TOKEN" ]; then
    echo "Error: CLAUDE_CODE_OAUTH_TOKEN environment variable is not set"
    echo "Please set it in your .env file or export it directly"
    exit 1
fi

# Get prompt file path from first parameter, default to ./PROMPT.md
PROMPT_FILE="${1:-./PROMPT.md}"

# Show usage if help requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0 [path/to/PROMPT.md]"
    echo ""
    echo "Environment variables for exit conditions:"
    echo "  MAX_ITERATIONS          - Maximum iterations before exit (default: 100)"
    echo "  MAX_CONSECUTIVE_IDENTICAL - Max consecutive identical responses (default: 10)"
    echo "  MAX_CONSECUTIVE_BLOCKED    - Max consecutive blocked responses (default: 5)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Use ./PROMPT.md"
    echo "  $0 ./my-prompt.md                    # Use custom prompt file"
    echo "  MAX_ITERATIONS=50 $0                 # Limit to 50 iterations"
    echo "  MAX_CONSECUTIVE_BLOCKED=3 $0         # Exit after 3 blocked responses"
    exit 0
fi

# Create log file with timestamp in project-specific log directory
if [ -n "$PROJECT_LOG_DIR" ] && [ -d "$PROJECT_LOG_DIR" ]; then
    LOG_FILE="$PROJECT_LOG_DIR/ai-loop-$(date +%Y%m%d-%H%M%S).log"
else
    # Fallback to current directory if PROJECT_LOG_DIR is not set or doesn't exist
    LOG_FILE="./ai-loop-$(date +%Y%m%d-%H%M%S).log"
fi

# Check if prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
    echo "Error: $PROMPT_FILE not found"
    echo "Usage: $0 [path/to/PROMPT.md]"
    exit 1
fi

# Check if Node.js and required modules are available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found"
    exit 1
fi

if [ ! -f "$AGENT_RUNTIME_PATH/dist/src/ai-provider.js" ]; then
    echo "Error: AI provider module not found at $AGENT_RUNTIME_PATH/dist/src/ai-provider.js"
    exit 1
fi

if [ ! -f "$AGENT_RUNTIME_PATH/dist/src/index.js" ]; then
    echo "Error: AI loop executor module not found at $AGENT_RUNTIME_PATH/dist/src/index.js"
    exit 1
fi

# Validate authentication for both providers with timeout
echo "Checking authentication for both Claude and Codex..."
if ! timeout 5 node "$AGENT_RUNTIME_PATH/dist/src/ai-provider.js" validate-auth > /dev/null 2>&1; then
    AUTH_EXIT_CODE=$?

    if [ $AUTH_EXIT_CODE -eq 124 ]; then
        echo "⚠️  Authentication check timed out after 5 seconds"
        echo "⚠️  Continuing without validation - provider may be unavailable"
    else
        echo "⚠️  Authentication validation failed"
        echo "⚠️  Continuing anyway - will attempt to use available providers"
    fi
else
    echo "✅ Authentication validation passed for both providers"
fi

echo "Starting AI agent loop with usage monitoring..."
echo "Reading prompts from: $(realpath "$PROMPT_FILE")"
echo "Logging output to: $(realpath "$LOG_FILE")"
echo ""
echo "Exit conditions configured:"
echo "  Max iterations: $MAX_ITERATIONS"
echo "  Max consecutive identical responses: $MAX_CONSECUTIVE_IDENTICAL"
echo "  Max consecutive blocked responses: $MAX_CONSECUTIVE_BLOCKED"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Show initial usage status
echo "=== Initial Usage Status ===" | tee -a "$LOG_FILE"
if ! timeout 5 node "$AGENT_RUNTIME_PATH/dist/src/ai-provider.js" status 2>&1 | tee -a "$LOG_FILE"; then
    echo "⚠️  Status check timed out or failed" | tee -a "$LOG_FILE"
fi
echo "" | tee -a "$LOG_FILE"

# Configuration for exit conditions
MAX_ITERATIONS=${MAX_ITERATIONS:-200}
MAX_CONSECUTIVE_IDENTICAL=${MAX_CONSECUTIVE_IDENTICAL:-5}
MAX_CONSECUTIVE_BLOCKED=${MAX_CONSECUTIVE_BLOCKED:-5}
RESPONSE_HISTORY_FILE="/tmp/ai-loop-responses-$$"

# Initialize tracking variables
CONSECUTIVE_IDENTICAL=0
CONSECUTIVE_BLOCKED=0
LAST_RESPONSE_HASH=""
RESPONSE_HISTORY=()

# Function to calculate hash of response content
calculate_response_hash() {
    local response="$1"
    # Extract just the response content, normalize whitespace, and hash it
    echo "$response" | grep -A 1000 "📝 Response:" | tail -n +2 | sed 's/^[[:space:]]*//' | tr -d '\n' | md5sum | cut -d' ' -f1
}

# Function to check if response indicates being blocked
is_blocked_response() {
    local response="$1"
    # Check for common blocking patterns
    echo "$response" | grep -qiE "(blocked|read-only|approval.*never|can't.*edit|unable.*modify|filesystem.*read-only|sandbox.*read-only|permission.*denied|write.*access.*denied)"
}

# Function to check if response is identical to previous ones
is_identical_response() {
    local current_hash="$1"
    local identical_count=0
    
    # Count how many recent responses have the same hash
    for hash in "${RESPONSE_HISTORY[@]}"; do
        if [ "$hash" = "$current_hash" ]; then
            identical_count=$((identical_count + 1))
        fi
    done
    
    # Consider identical if we've seen this response 3+ times in recent history
    [ $identical_count -ge 3 ]
}

# Function to log exit reason
log_exit_reason() {
    local reason="$1"
    echo "" | tee -a "$LOG_FILE"
    echo "🛑 EXITING AI LOOP: $reason" | tee -a "$LOG_FILE"
    echo "📊 Final Statistics:" | tee -a "$LOG_FILE"
    echo "  - Total iterations: $ITERATION" | tee -a "$LOG_FILE"
    echo "  - Consecutive identical responses: $CONSECUTIVE_IDENTICAL" | tee -a "$LOG_FILE"
    echo "  - Consecutive blocked responses: $CONSECUTIVE_BLOCKED" | tee -a "$LOG_FILE"
    echo "  - Exit time: $(date)" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

# Run AI agents in a loop with exit conditions
ITERATION=1
while [ $ITERATION -le $MAX_ITERATIONS ]; do
    echo "=== Running AI Agent - Iteration $ITERATION ($(date)) ==="
    echo "=== Iteration $ITERATION - $(date) ===" >> "$LOG_FILE"

    # Execute with AI provider (auto-switching between Claude Code and Codex)
    echo "Executing with AI provider..." | tee -a "$LOG_FILE"
    
    # Capture the full output for analysis
    FULL_OUTPUT=$(cat "$PROMPT_FILE" | node "$AGENT_RUNTIME_PATH/dist/src/index.js" 2>&1)
    echo "$FULL_OUTPUT" | tee -a "$LOG_FILE"

    # Analyze the response for exit conditions
    CURRENT_RESPONSE_HASH=$(calculate_response_hash "$FULL_OUTPUT")
    
    # Check if this is a blocked response
    if is_blocked_response "$FULL_OUTPUT"; then
        CONSECUTIVE_BLOCKED=$((CONSECUTIVE_BLOCKED + 1))
        echo "⚠️  Blocked response detected (consecutive: $CONSECUTIVE_BLOCKED/$MAX_CONSECUTIVE_BLOCKED)" | tee -a "$LOG_FILE"
        
        if [ $CONSECUTIVE_BLOCKED -ge $MAX_CONSECUTIVE_BLOCKED ]; then
            log_exit_reason "Too many consecutive blocked responses ($CONSECUTIVE_BLOCKED/$MAX_CONSECUTIVE_BLOCKED)"
            exit 1
        fi
    else
        CONSECUTIVE_BLOCKED=0
    fi
    
    # Check if this response is identical to previous ones
    if [ "$CURRENT_RESPONSE_HASH" = "$LAST_RESPONSE_HASH" ] && [ -n "$CURRENT_RESPONSE_HASH" ]; then
        CONSECUTIVE_IDENTICAL=$((CONSECUTIVE_IDENTICAL + 1))
        echo "⚠️  Identical response detected (consecutive: $CONSECUTIVE_IDENTICAL/$MAX_CONSECUTIVE_IDENTICAL)" | tee -a "$LOG_FILE"
        
        if [ $CONSECUTIVE_IDENTICAL -ge $MAX_CONSECUTIVE_IDENTICAL ]; then
            log_exit_reason "Too many consecutive identical responses ($CONSECUTIVE_IDENTICAL/$MAX_CONSECUTIVE_IDENTICAL)"
            exit 1
        fi
    else
        CONSECUTIVE_IDENTICAL=0
    fi
    
    # Check if this response appears frequently in recent history
    if is_identical_response "$CURRENT_RESPONSE_HASH"; then
        echo "⚠️  Response pattern detected in recent history" | tee -a "$LOG_FILE"
        log_exit_reason "Repetitive response pattern detected"
        exit 1
    fi
    
    # Update tracking variables
    LAST_RESPONSE_HASH="$CURRENT_RESPONSE_HASH"
    RESPONSE_HISTORY+=("$CURRENT_RESPONSE_HASH")
    
    # Keep only last 20 responses in history to prevent memory issues
    if [ ${#RESPONSE_HISTORY[@]} -gt 20 ]; then
        RESPONSE_HISTORY=("${RESPONSE_HISTORY[@]:1}")
    fi

    echo "" | tee -a "$LOG_FILE"
    echo "=== Iteration $ITERATION complete, checking usage status... ===" | tee -a "$LOG_FILE"

    # Show usage status after each iteration
    if ! timeout 5 node "$AGENT_RUNTIME_PATH/dist/src/ai-provider.js" status 2>&1 | tee -a "$LOG_FILE"; then
        echo "⚠️  Status check timed out or failed" | tee -a "$LOG_FILE"
    fi
    
    echo "" | tee -a "$LOG_FILE"
    echo "=== Iteration $ITERATION complete, restarting... ===" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"

    ITERATION=$((ITERATION + 1))

    # Brief pause to prevent overwhelming the system
    sleep 2
done

# If we reach here, we hit the max iterations limit
log_exit_reason "Maximum iterations reached ($MAX_ITERATIONS)"
exit 0
