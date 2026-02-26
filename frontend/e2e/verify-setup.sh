#!/bin/bash

# Verify E2E Testing Setup
# Run: bash e2e/verify-setup.sh

echo "🔧 Verifying E2E Testing Environment..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
    echo -e "${RED}✗ Not found${NC}"
    ((ERRORS++))
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} $NPM_VERSION"
else
    echo -e "${RED}✗ Not found${NC}"
    ((ERRORS++))
fi

# Check Playwright
echo -n "Checking Playwright... "
if npm list @playwright/test &> /dev/null; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${YELLOW}! Not installed${NC}"
    echo "  Run: npm install && npx playwright install"
    ((ERRORS++))
fi

# Check ANDROID_HOME
echo -n "Checking ANDROID_HOME... "
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${RED}✗ Not set${NC}"
    echo "  Set ANDROID_HOME environment variable"
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC} $ANDROID_HOME"
fi

# Check ADB
echo -n "Checking adb... "
if command -v adb &> /dev/null; then
    ADB_VERSION=$(adb version | head -n1)
    echo -e "${GREEN}✓${NC} $ADB_VERSION"
else
    echo -e "${RED}✗ Not found${NC}"
    echo "  Add \$ANDROID_HOME/platform-tools to PATH"
    ((ERRORS++))
fi

# Check emulator command
echo -n "Checking emulator... "
if command -v emulator &> /dev/null; then
    echo -e "${GREEN}✓ Available${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    echo "  Add \$ANDROID_HOME/emulator to PATH"
    ((ERRORS++))
fi

# Check aapt
echo -n "Checking aapt... "
if command -v aapt &> /dev/null; then
    echo -e "${GREEN}✓ Available${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    echo "  Add \$ANDROID_HOME/build-tools/XX.X.X to PATH"
    ((ERRORS++))
fi

# Check AVDs
echo -n "Checking Android AVDs... "
if command -v emulator &> /dev/null; then
    AVD_COUNT=$(emulator -list-avds 2>/dev/null | wc -l)
    if [ "$AVD_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Found $AVD_COUNT AVD(s)${NC}"
        emulator -list-avds 2>/dev/null | while read avd; do
            echo "  - $avd"
        done
    else
        echo -e "${YELLOW}! No AVDs found${NC}"
        echo "  Run: npm run test:android:create-avd"
    fi
else
    echo -e "${YELLOW}! Skipped (emulator not found)${NC}"
fi

# Check if emulator is running
echo -n "Checking running emulators... "
if command -v adb &> /dev/null; then
    RUNNING=$(adb devices | grep "emulator-" | wc -l)
    if [ "$RUNNING" -gt 0 ]; then
        echo -e "${GREEN}✓ $RUNNING running${NC}"
    else
        echo -e "None (will start when needed)"
    fi
else
    echo -e "${YELLOW}! Skipped${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "You can now run:"
    echo "  npm run test:e2e:full       # Complete E2E with APK testing"
    echo "  npm run test:e2e:prod       # Production tests (fast)"
    echo "  npm run test:e2e            # Local tests"
else
    echo -e "${RED}❌ Found $ERRORS issue(s)${NC}"
    echo ""
    echo "Please fix the issues above before running tests."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
