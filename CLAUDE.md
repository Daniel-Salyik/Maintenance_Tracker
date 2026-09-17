# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🛠 Common Commands
- Build: `npm run build`
- Lint: `npm run lint`
- Run all tests: `npm test`
- Run a single test: `npm test -- <path_to_file>`
- Start development server: `npm run dev`

## 📐 Architecture & Structure
The project follows a **Layered Architecture** (Repository Pattern) to ensure strict separation of concerns and testability.

### Logic Flow
`Client Request` $\rightarrow$ `Route` $\rightarrow$ `Controller` $\rightarrow$ `Service` $\rightarrow$ `Repository` $\rightarrow$ `PostgreSQL`

### Layer Responsibilities
- **Controllers (`src/controllers/`)**: Handles HTTP requests and responses. Validates request bodies and returns appropriate status codes.
- **Services (`src/services/`)**: Contains the "Brain" of the application. Orchestrates business logic, validation rules, and security checks.
- **Repositories (`src/repositories/`)**: Encapsulates all data access logic. Contains raw SQL queries and returns domain models.
- **Models (`src/models/`)**: TypeScript interfaces and types defining the domain entities (User, Bike, Component, Log).
- **Middleware (`src/middleware/`)**: Handles cross-cutting concerns like Authentication guards, Multi-tenancy isolation, and global error handling.
- **Config (`src/config/`)**: Manages environment variables (`.env`) and database connection pooling.

### Tech Stack
- **Language**: TypeScript / Node.js
- **Framework**: Express
- **Database**: PostgreSQL
- **Testing**: Jest/Vitest (Unit/Integration), Playwright (E2E), Cucumber (BDD)

## 🚀 Development Workflow (Shift-Left)
The project strictly adheres to a Shift-Left approach for all feature development:
1. **BDD Scenario**: Define the behavior in a `.feature` file (Cucumber).
2. **TDD Red**: Write a failing test (Unit $\rightarrow$ Integration $\rightarrow$ E2E).
3. **TDD Green**: Implement minimal code to make the test pass.
4. **Refactor**: Optimize and clean code while maintaining test integrity.

## 🎯 Planned Features
- **User Management**: Auth (Email/Password, OAuth), Multi-tenancy data isolation.
- **Bike Management**: Profile management (max 3 bikes), specifications.
- **Component Tracking**: Wear tracking based on mileage, service intervals, status indicators (Green/Yellow/Red).
- **Maintenance Logging**: Service events, proactive alerting, costs, and history.
- **Financials**: Total cost analysis and data export (CSV/PDF).


## Git workflow
Do not create git worktrees for any task. Make all changes directly in the
current working directory on the currently checked-out branch. I will
handle branching and merging myself.

Show me the diff before saving.