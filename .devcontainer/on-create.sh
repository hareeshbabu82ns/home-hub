#!/bin/bash
set -e

echo "🔧 Setting up devcontainer environment..."

# Use sudo when running as a non-root user.
if [ "$(id -u)" -ne 0 ]; then
  SUDO="sudo"
else
  SUDO=""
fi

# Update package manager
echo "📦 Updating package manager..."
$SUDO apt-get update

# Install build essentials and required system packages
echo "📦 Installing system dependencies..."
$SUDO apt-get install -y --no-install-recommends \
  build-essential \
  python3-dev \
  git \
  curl \
  wget \
  ca-certificates

# Enable corepack for pnpm
echo "⚙️  Enabling corepack..."
corepack enable
corepack prepare pnpm@latest --activate

# Configure git for container
echo "🔐 Configuring git..."
git config --global --add safe.directory /workspaces/home-hub
git config --global user.name "Developer" 2>/dev/null || true
git config --global user.email "dev@example.com" 2>/dev/null || true

# Clean up apt cache to reduce image size
$SUDO apt-get clean
$SUDO rm -rf /var/lib/apt/lists/*

echo "✅ Devcontainer environment setup complete!"
