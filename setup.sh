#!/bin/bash

# Earthquake Alert System - Installation Script
# Installs all dependencies and prepares the system

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║  Earthquake Alert System - Setup Script       ║"
echo "╚════════════════════════════════════════════════╝"

# Check Node.js installation
echo ""
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js v14+"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION found"

# Check npm installation
echo ""
echo "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm $NPM_VERSION found"

# Install dependencies
echo ""
echo "Installing npm dependencies..."
npm install

# Create environment file
echo ""
echo "Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file (please update with your settings)"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                           ║"
echo "╠════════════════════════════════════════════════╣"
echo "║  Next steps:                                   ║"
echo "║  1. Update WiFi credentials in .env           ║"
echo "║  2. Upload firmware to NodeMCU                ║"
echo "║  3. Run: npm start                            ║"
echo "║  4. Open: http://localhost:3000               ║"
echo "╚════════════════════════════════════════════════╝"
