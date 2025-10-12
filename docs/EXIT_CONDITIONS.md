# AI Loop Exit Conditions

## Overview

The AI loop script (`run-loop.sh`) has been enhanced with intelligent exit conditions to prevent infinite loops when the AI gets stuck in repetitive or blocked states.

## Problem Analysis

Based on the log analysis (`ai-loop-20251012-160445.log`), the following stuck patterns were identified:

1. **88 consecutive identical responses** - AI kept giving the same "blocked" response
2. **Read-only environment** - AI couldn't proceed due to `approval_policy=never`
3. **Missing documentation** - Referenced files like `docs/SPEC.md`, `docs/FIX_PLAN.md` didn't exist
4. **Rate limiting** - Claude Code hit weekly limits, falling back to Codex
5. **No exit mechanism** - Original script ran indefinitely with `while :; do`

## Exit Conditions Added

### 1. Maximum Iterations
- **Environment Variable**: `MAX_ITERATIONS` (default: 100)
- **Purpose**: Prevents infinite loops by limiting total iterations
- **Exit Code**: 0 (normal completion)

### 2. Consecutive Identical Responses
- **Environment Variable**: `MAX_CONSECUTIVE_IDENTICAL` (default: 10)
- **Purpose**: Detects when AI gives the same response repeatedly
- **Detection**: MD5 hash comparison of response content
- **Exit Code**: 1 (error condition)

### 3. Consecutive Blocked Responses
- **Environment Variable**: `MAX_CONSECUTIVE_BLOCKED` (default: 5)
- **Purpose**: Detects when AI is consistently blocked from proceeding
- **Detection**: Pattern matching for blocking keywords:
  - "blocked", "read-only", "approval.*never"
  - "can't.*edit", "unable.*modify"
  - "filesystem.*read-only", "sandbox.*read-only"
  - "permission.*denied", "write.*access.*denied"
- **Exit Code**: 1 (error condition)

### 4. Repetitive Response Pattern
- **Purpose**: Detects when the same response appears frequently in recent history
- **Detection**: Same response appears 3+ times in last 20 iterations
- **Exit Code**: 1 (error condition)

## Usage

### Basic Usage
```bash
./run-loop.sh [path/to/PROMPT.md]
```

### With Custom Exit Conditions
```bash
# Limit to 50 iterations
MAX_ITERATIONS=50 ./run-loop.sh

# Exit after 3 blocked responses
MAX_CONSECUTIVE_BLOCKED=3 ./run-loop.sh

# Exit after 5 identical responses
MAX_CONSECUTIVE_IDENTICAL=5 ./run-loop.sh

# Combine multiple conditions
MAX_ITERATIONS=30 MAX_CONSECUTIVE_BLOCKED=2 ./run-loop.sh
```

### Help
```bash
./run-loop.sh --help
```

## Configuration

All exit conditions can be configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_ITERATIONS` | 100 | Maximum total iterations |
| `MAX_CONSECUTIVE_IDENTICAL` | 10 | Max consecutive identical responses |
| `MAX_CONSECUTIVE_BLOCKED` | 5 | Max consecutive blocked responses |

## Logging

The script provides detailed logging of exit conditions:

- **Startup**: Shows configured exit condition limits
- **During execution**: Warns when conditions are approaching limits
- **On exit**: Logs final statistics and exit reason

Example exit log:
```
🛑 EXITING AI LOOP: Too many consecutive blocked responses (5/5)
📊 Final Statistics:
  - Total iterations: 12
  - Consecutive identical responses: 0
  - Consecutive blocked responses: 5
  - Exit time: Sun Oct 12 16:30:15 CDT 2025
```

## Testing

A test script is provided to verify exit conditions:

```bash
./test-exit-conditions.sh
```

This will test all exit conditions with various scenarios.

## Benefits

1. **Prevents infinite loops** - No more 88+ iteration runs
2. **Early detection** - Identifies stuck states quickly
3. **Configurable** - Adjust limits based on use case
4. **Informative** - Clear logging of why the loop exited
5. **Resource efficient** - Stops wasting tokens on repetitive responses

## Implementation Details

### Response Hashing
- Extracts content after "📝 Response:" marker
- Normalizes whitespace and removes formatting
- Uses MD5 hash for comparison
- Maintains rolling history of last 20 responses

### Pattern Matching
- Case-insensitive regex matching
- Covers common blocking scenarios
- Easily extensible for new patterns

### Memory Management
- Limits response history to 20 entries
- Uses efficient bash array operations
- Cleans up temporary files on exit

## Future Enhancements

Potential improvements for future versions:

1. **Dynamic thresholds** - Adjust limits based on response quality
2. **Provider-specific limits** - Different limits for Claude vs Codex
3. **Time-based exits** - Exit after certain duration
4. **Progress detection** - Exit when no progress is made
5. **External monitoring** - Integration with monitoring systems
