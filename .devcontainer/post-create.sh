#!/usr/bin/env bash
set -euo pipefail

corepack enable
corepack prepare pnpm@10 --activate

if [ -f pnpm-lock.yaml ]; then
  pnpm install --frozen-lockfile
else
  pnpm install
fi

pnpm db:gen
