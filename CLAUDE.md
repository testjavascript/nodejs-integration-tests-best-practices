# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a comprehensive guide and examples for Node.js testing best practices, focusing on integration/component testing. It includes both educational content and a practical example application that demonstrates modern testing techniques.

## Commands

### Testing
- `npm test` - Run Jest tests (default test runner)
- `npm run test:vitest` - Run Vitest tests (alternative test runner)
- `npm run test:dev` - Run Jest in watch mode with optimized settings (2 workers, silent)
- `npm run test:dev:debug` - Run Jest in debug mode with inspector on port 9229
- `npm run test:dev:verbose` - Run Jest in watch mode with verbose output
- `npm run test:nestjs` - Run NestJS-specific tests

### Database
- `npm run db:migrate` - Run database migrations (uses Sequelize CLI)
- `npm run db:seed` - Seed database with initial data

### Code Quality
- `npm run lint` - Run ESLint on the codebase

## Architecture

### Example Application Structure
The repository contains an example Node.js application demonstrating testing best practices:

- **Entry Points** (`example-application/entry-points/`): API server (Express.js) and message queue consumer
- **Business Logic** (`example-application/business-logic/`): Core order service logic
- **Data Access** (`example-application/data-access/`): Database repository layer with Sequelize ORM
- **Libraries** (`example-application/libraries/`): Shared utilities (authentication, logging, message queue client, etc.)

### Testing Architecture

**Dual Test Framework Support:**
- **Jest** (primary): Configured in `jest.config.js` with comprehensive watch plugins
- **Vitest** (alternative): Configured in `vitest.config.ts` for modern ESM support

**Test Organization:**
- Jest tests: `example-application/test/jest/*.test.ts`
- Vitest tests: `example-application/test/vitest/*.spec.ts`
- Setup files: `example-application/test/setup/`

**Infrastructure Setup:**
- Docker Compose for PostgreSQL database (port 54310)
- Global setup automatically starts database if not running
- Database migrations and seeding via npm scripts
- Smart cleanup: database persists in dev, cleaned up in CI

**Testing Philosophy:**
- **Component/Integration First**: Tests focus on entire API endpoints with real database
- **Minimal E2E**: Only 3-10 E2E tests for configuration/infrastructure issues
- **Selective Unit Tests**: Only for complex algorithms or non-trivial logic
- **Feature-Focused**: Tests cover features/routes, not individual functions

### Key Patterns

**Database Testing:**
- Tests use real PostgreSQL database, not mocks
- Global setup handles Docker container lifecycle
- Database cleanup occurs probabilistically (10% chance) in dev, always in CI
- Migration and seeding handled by npm scripts

**Test Data:**
- Data factories in `example-application/test/order-data-factory.ts`
- Metadata seeded once, test data created per test
- No shared test data between tests

**Error Handling:**
- Centralized error handler in `example-application/error-handling.js`
- Process-level uncaught exception/rejection handling

## Development Notes

- The repository demonstrates the "Testing Diamond" strategy prioritizing component tests
- Anti-pattern examples are excluded from test runs by default (see jest.config.js)
- Performance tests are also excluded by default
- TypeScript support with ts-jest transformer
- Rich Jest watch mode with plugins for filtering, repeating, and suspending tests