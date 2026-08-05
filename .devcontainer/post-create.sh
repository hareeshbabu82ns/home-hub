#!/bin/bash
set -euo pipefail

echo "Installing project dependencies..."
if ! pnpm install --frozen-lockfile; then
	echo "Lockfile install failed, retrying without frozen lockfile..."
	pnpm install --no-frozen-lockfile
fi

echo "Generating Prisma client..."
if [ -f .env ] && grep -q '^DATABASE_URL=' .env; then
	pnpm db:gen
else
	echo "Skipping Prisma generation: DATABASE_URL is not configured in .env yet."
fi

echo "Project setup complete!"
