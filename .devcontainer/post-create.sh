#!/bin/bash
set -e

echo "📦 Installing pnpm..."
npm install -g pnpm@latest

echo "⚙️  Setting up pnpm global bin directory..."
export SHELL=/bin/bash
pnpm setup
source /home/node/.bashrc

echo "🔧 Installing project dependencies..."
pnpm install

echo "🗄️ Generating Prisma client..."
pnpm db:gen

echo "✅ Devcontainer setup complete!"
echo ""
echo "📝 Next steps:"
echo "  - Run 'pnpm dev' to start the development server"
echo "  - Visit http://localhost:3000 in your browser"
echo "  - Files in ~/Downloads are accessible at /downloads"
