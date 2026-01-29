#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting release process for @ccshare/viewer${NC}"
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "packages/cli" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo -e "${RED}Error: Not logged in to npm. Please run 'npm login' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm login verified${NC}"

# Install dependencies
echo ""
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install

# Build SDK first
echo ""
echo -e "${YELLOW}🔨 Building SDK...${NC}"
pnpm --filter @ccshare/sdk build

# Build renderer
echo ""
echo -e "${YELLOW}🔨 Building renderer...${NC}"
pnpm --filter @ccshare/renderer build

# Build CLI (this will also copy renderer)
echo ""
echo -e "${YELLOW}🔨 Building CLI...${NC}"
pnpm --filter @ccshare/viewer build

# Verify the build
echo ""
echo -e "${YELLOW}🔍 Verifying build...${NC}"

if [ ! -f "packages/cli/dist/index.mjs" ]; then
    echo -e "${RED}Error: dist/index.mjs not found${NC}"
    exit 1
fi

if [ ! -d "packages/cli/renderer" ]; then
    echo -e "${RED}Error: renderer directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build verification passed${NC}"

# Get current version
CURRENT_VERSION=$(node -p "require('./packages/cli/package.json').version")
echo ""
echo -e "Current version: ${YELLOW}${CURRENT_VERSION}${NC}"

# Ask for new version
echo ""
echo "Select version bump:"
echo "  1) patch (x.x.X)"
echo "  2) minor (x.X.0)"
echo "  3) major (X.0.0)"
echo "  4) custom"
echo "  5) keep current (${CURRENT_VERSION})"
read -p "Choice [1-5]: " VERSION_CHOICE

case $VERSION_CHOICE in
    1)
        cd packages/cli && npm version patch --no-git-tag-version && cd ../..
        ;;
    2)
        cd packages/cli && npm version minor --no-git-tag-version && cd ../..
        ;;
    3)
        cd packages/cli && npm version major --no-git-tag-version && cd ../..
        ;;
    4)
        read -p "Enter custom version: " CUSTOM_VERSION
        cd packages/cli && npm version $CUSTOM_VERSION --no-git-tag-version && cd ../..
        ;;
    5)
        echo "Keeping current version"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

NEW_VERSION=$(node -p "require('./packages/cli/package.json').version")
echo ""
echo -e "Publishing version: ${GREEN}${NEW_VERSION}${NC}"

# Confirm publish
echo ""
read -p "Publish @ccshare/viewer@${NEW_VERSION} to npm? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 1
fi

# Publish
echo ""
echo -e "${YELLOW}📤 Publishing to npm...${NC}"
cd packages/cli
npm publish --access public
cd ../..

echo ""
echo -e "${GREEN}✅ Successfully published @ccshare/viewer@${NEW_VERSION}${NC}"
echo ""
echo "Users can now run:"
echo -e "  ${YELLOW}npx @ccshare/viewer${NC}"
