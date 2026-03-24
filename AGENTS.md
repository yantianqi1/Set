# Repository Guidelines

## Project Structure & Module Organization
- `apps/web/src/app` contains Next.js App Router pages. Shared UI lives in `apps/web/src/components`, helpers in `apps/web/src/lib`, and locales in `apps/web/src/i18n`.
- `apps/api/src` contains the Fastify backend. Put business logic in `src/modules`, helpers in `src/lib`, and startup/config code in `src/index.ts` and `src/config.ts`.
- `packages/shared/src` stores shared Zod schemas, runtime defaults, and types used by both apps.
- Database and deployment assets live at `prisma/schema.prisma`, `docker/`, `Dockerfile`, `docker-compose.yml`, and `DEPLOYMENT.md`.

## Build, Test, and Development Commands
- `pnpm dev`: run the web app and API together from the repo root.
- `pnpm build`: build all workspaces; the API build also runs Prisma client generation.
- `pnpm test`: run every Vitest suite in the monorepo.
- `pnpm prisma:generate`: regenerate Prisma client after schema changes.
- `pnpm prisma:migrate`: create and apply local Prisma migrations.
- `pnpm --filter @image-set-studio/web dev` or `pnpm --filter @image-set-studio/api dev`: run one app in isolation.

## Coding Style & Naming Conventions
- Use TypeScript ESM, double quotes, semicolons, and 2-space indentation.
- Keep module filenames lowercase and hyphenated, for example `config-resolution.ts` or `request-auth.ts`.
- Use PascalCase for React components and exported type names, and camelCase for functions and variables.
- In the web app, prefer the `@/` alias. Import shared contracts from `@image-set-studio/shared`.
- No formatter config is checked in; match surrounding code.

## Testing Guidelines
- Vitest is the test runner for every workspace.
- API tests live in `apps/api/test/*.test.ts`, web tests in `apps/web/test/*.test.ts`, and shared-package tests may sit beside source files such as `packages/shared/src/schemas.test.ts`.
- Name tests after behavior, such as `scheduler.test.ts` or `jobs-pagination.test.ts`.
- No coverage gate is configured; every change to schemas, routes, or client helpers should include targeted test updates.

## Commit & Pull Request Guidelines
- Follow Conventional Commit prefixes, for example `feat: finalize competition submission fixes`.
- Keep each commit focused on one change set and mention the workspace when useful.
- Pull requests should summarize behavior changes, list required env or Prisma updates, link related issues, and include screenshots for `apps/web` UI changes.
- Record the verification you ran in the PR description, such as `pnpm test` or a workspace-specific test command.

## Security & Configuration Tips
- Initialize local config from `.env.example` and `docker-compose.env.example`; do not commit real secrets.
- `apps/api/.env` must provide `CONFIG_ENCRYPTION_KEY` and database settings before the API can start.
- Use `API_PROXY_TARGET` only when `apps/web` should proxy `/api` requests elsewhere.
