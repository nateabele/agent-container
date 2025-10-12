#!/bin/bash
# Test script to verify exit conditions work properly

set -e

echo "🧪 Testing AI Loop Exit Conditions"
echo "=================================="

# Create a test prompt that will generate blocked responses
cat > test-prompt.md << 'EOF'
You are in a read-only environment with approval_policy=never. 
Please implement a complex migration that requires file editing, 
running tests, and updating documentation. The files docs/SPEC.md 
and docs/FIX_PLAN.md are missing.

Please proceed with the implementation.
EOF

echo "📝 Created test prompt that should trigger blocked responses"
echo ""

# Test 1: Exit after consecutive blocked responses
echo "Test 1: Testing MAX_CONSECUTIVE_BLOCKED=3"
echo "----------------------------------------"
MAX_CONSECUTIVE_BLOCKED=3 MAX_ITERATIONS=10 ./run-loop.sh test-prompt.md
echo "✅ Test 1 completed"
echo ""

# Test 2: Exit after consecutive identical responses  
echo "Test 2: Testing MAX_CONSECUTIVE_IDENTICAL=2"
echo "-------------------------------------------"
MAX_CONSECUTIVE_IDENTICAL=2 MAX_ITERATIONS=10 ./run-loop.sh test-prompt.md
echo "✅ Test 2 completed"
echo ""

# Test 3: Exit after max iterations
echo "Test 3: Testing MAX_ITERATIONS=5"
echo "--------------------------------"
MAX_ITERATIONS=5 ./run-loop.sh test-prompt.md
echo "✅ Test 3 completed"
echo ""

# Cleanup
rm -f test-prompt.md

echo "🎉 All exit condition tests completed!"
echo ""
echo "Check the generated log files for detailed output:"
ls -la ai-loop-*.log | tail -3
