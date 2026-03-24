#!/bin/sh
set -eu

cd /app

pnpm --filter @image-set-studio/api exec prisma db push --schema /app/prisma/schema.prisma

exec node /app/apps/api/dist/src/index.js
