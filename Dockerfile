# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY prisma ./prisma
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS builder

ARG API_PROXY_TARGET=http://api:4000
ENV API_PROXY_TARGET=$API_PROXY_TARGET

COPY . .

RUN pnpm build \
  && mkdir -p /app/apps/web/.next/standalone/apps/web/.next \
  && cp -R /app/apps/web/.next/static /app/apps/web/.next/standalone/apps/web/.next/static

FROM builder AS api-runner

EXPOSE 4000

CMD ["sh", "/app/docker/api-start.sh"]

FROM builder AS web-runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["sh", "/app/docker/web-start.sh"]
