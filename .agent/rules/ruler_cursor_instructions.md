---
alwaysApply: true
---
<!-- Source: .ruler/bts.md -->


## Project Structure

This is a project with the following structure:

- `src/` - Source code
- `public/` - Public assets
- `styles/` - Global styles
- `zenstack/` - ZenStack files
- `generated-routers/` - Generated tRPC routers

## Available Scripts

- `pnpm run dev` - Start the development server


## Project Configuration

This project includes a `bts.jsonc` configuration file that stores your Better-T-Stack settings:

- Contains your selected stack configuration (database, ORM, backend, frontend, etc.)
- Used by the CLI to understand your project structure
- Safe to delete if not needed
- Updated automatically when using the `add` command

## Key Points

- This is a Tanstack Start project with pnpm
