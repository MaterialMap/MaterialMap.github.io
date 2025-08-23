#!/bin/bash

echo "🧪 Testing Material MAP in all environments..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run test and capture result
run_test() {
    local env_name=$1
    local npm_script=$2
    
    echo -e "\n${YELLOW}Testing $env_name environment...${NC}"
    
    if npm run $npm_script; then
        echo -e "${GREEN}✅ $env_name tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $env_name tests failed${NC}"
        return 1
    fi
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run tests for each environment
failed_tests=0

run_test "Local (localhost:5500)" "test:local" || ((failed_tests++))
run_test "GitHub Pages simulation (localhost:3001)" "test:github-pages" || ((failed_tests++))
run_test "Subdirectory simulation (localhost:3002)" "test:subdirectory" || ((failed_tests++))

# Summary
echo -e "\n📊 Test Summary:"
if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}🎉 All environments passed!${NC}"
    exit 0
else
    echo -e "${RED}💥 $failed_tests environment(s) failed${NC}"
    exit 1
fi