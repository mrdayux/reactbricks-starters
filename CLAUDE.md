# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a **pnpm + Turborepo monorepo** containing React Bricks CMS starter applications and their companion UI component libraries. Each starter demonstrates React Bricks integration with a different framework: **Astro**, **Next.js App Router (RSC)**, and **Next.js Pages Router**.

## Commands

All commands run from the repo root using Turborepo:

```bash
pnpm dev              # Run all apps/packages in dev mode
pnpm build            # Build all packages and apps (respects dependency order)
pnpm lint             # Lint all workspaces
pnpm check-types      # TypeScript type checking across all workspaces
pnpm format           # Prettier format (ts, tsx, md files)
```

To target a specific workspace:

```bash
pnpm --filter @reactbricks/nextjs-app dev
pnpm --filter @reactbricks/astro build
pnpm --filter @reactbricks/reactbricks-ui-rsc lint
```

Changesets workflow (alpha pre-release mode):

```bash
pnpm create-changeset       # Create a new changeset
pnpm changeset-version      # Bump versions from changesets
pnpm changeset-publish      # Publish to npm
```

## Architecture

### Three-tier structure

```
apps/                          # Starter applications (not published)
├── astro/                     # Astro 5 + React integration
├── nextjs-app/                # Next.js 15 App Router (RSC)
└── nextjs-pages/              # Next.js 15 Pages Router

packages/
├── reactbricks-ui/            # UI brick libraries (published to npm)
│   ├── astro/                 #   → @reactbricks/reactbricks-ui-astro
│   ├── nextjs-app/            #   → @reactbricks/reactbricks-ui-rsc
│   └── nextjs-pages/          #   → @reactbricks/reactbricks-ui
├── email-ui/                  # Email template brick libraries (published)
│   ├── astro/                 #   → @reactbricks/email-ui-astro
│   ├── nextjs-app/
│   └── nextjs-pages/
└── reactbricks-ui-tailwind-config/  # Shared Tailwind styles + font (published)
                                     #   → @reactbricks/reactbricks-ui-tailwind-config
```

Each app imports its matching UI package variant via `workspace:*` references. The UI packages are the publishable npm artifacts; the apps serve as both development environments and starter templates.

### React Bricks Brick pattern

Every UI component follows the `types.Brick<Props>` interface from `react-bricks`. Each brick has:
- A React component with visual/text props managed by the CMS editor
- A `.schema` static property defining editor metadata, side edit props, and defaults
- Registration in the app's `react-bricks/config.tsx`

Key files in each UI package:
- `blockNames.ts` — enum of all brick identifiers
- `colors.ts` — shared color palette definitions for editor sidebar
- `LayoutSideProps.ts` — reusable side panel configurations
- `defaultImages.ts` — default imagery for brick previews
- `src/` — brick components organized by category (layout, heroSections, mainContent, cta, team, testimonials, pricing, contacts, shared, singleColumnContent, etc.)

### Shared styling

All packages use **Tailwind CSS v4** with `classnames` for conditional class composition. The `reactbricks-ui-tailwind-config` package provides shared CSS variables and the Nunito Sans font, imported by all UI packages.
The code should be written for readability and ease of understanding, with clear naming conventions and modular organization.

### Notes
All interactions should be through this file and the public codebase.
Don't add the Claude or Claude Opus XXX or similar users as a collaborator or co-author on any commit or pull request. Only the actual human developers working on the code should be listed as collaborators or co-authors.

## Key Technical Details

- **Node >=20** required (Astro needs >=22)
- **pnpm 10.16.1** as package manager
- **React 19**, **react-bricks 5.0.0**
- **TypeScript strict mode** throughout; path alias `@/*` maps to `./` or `./src`
- **ESLint v9** flat config format
- **Prettier**: no semicolons, single quotes, trailing commas (es5), 80 char width
- Next.js apps run on ports 3000 (app router) and 3001 (pages router), Astro on 4321
- No test suite exists in this repo
