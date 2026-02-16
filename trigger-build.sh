#!/bin/bash

# Traffic Booster Pro - GitHub Actions Build Trigger Script
# This script creates and pushes a version tag to trigger the automated build workflow

set -e

echo "🚀 Traffic Booster Pro - Build Trigger Script"
echo "=============================================="
echo ""

# Get current version from package.json
CURRENT_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo "Current version in package.json: $CURRENT_VERSION"
echo ""

# Determine next version
read -p "Enter version to build (default: $CURRENT_VERSION): " VERSION
VERSION=${VERSION:-$CURRENT_VERSION}

# Validate version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ Invalid version format. Use semantic versioning (e.g., 1.0.0)"
    exit 1
fi

TAG="v$VERSION"

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "⚠️  Tag $TAG already exists"
    read -p "Do you want to delete and recreate it? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ]; then
        echo "Cancelled."
        exit 1
    fi
    git tag -d "$TAG"
    git push origin ":refs/tags/$TAG" || true
fi

echo ""
echo "📝 Creating tag: $TAG"
git tag "$TAG"

echo "📤 Pushing tag to GitHub..."
git push origin "$TAG"

echo ""
echo "✅ Tag pushed successfully!"
echo ""
echo "🔄 GitHub Actions workflow should start within 10 seconds."
echo ""
echo "📊 Monitor the build at:"
echo "   https://github.com/cedyson8-creator/traffic-booster-app/actions"
echo ""
echo "⏱️  Build time: ~15-20 minutes"
echo ""
echo "📦 Once complete, download artifacts from:"
echo "   https://github.com/cedyson8-creator/traffic-booster-app/releases/tag/$TAG"
echo ""
