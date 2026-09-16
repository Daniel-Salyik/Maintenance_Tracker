# 🗺 Backend Implementation Roadmap

This file tracks the atomic progression of the backend development. Each task corresponds to a specific feature/unit of work and should be developed on its own dedicated branch.

## 🛠 Task List

| Status | Task | Branch | Focus | Description | GH_ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [x] | **#1: Project Structure & TS Setup** | `setup/backend-ts` | Infra | Initialize Node.js, Express, and TypeScript configuration. | 1 |
| [ ] | **#1.1: CI/CD Pipeline** | `infra/cicd` | Infra | Automate test execution (BDD + unit) on every PR via GitHub Actions. | — |
| [x] | **#2: Database Schema Design** | `feat/db-schema` | Arch | PostgreSQL schema for Users, Bikes, Components, and Logs. | 2 |
| [ ] | **#2.1: DB Migration Tooling** | `infra/migrations` | Infra | Implement migration strategy (Knex/TypeORM) over manual schema scripts. | — |
| [x] | **#3: Auth BDD Scenarios** | `feat-bdd-plan` | Shift-Left | Define Gherkin scenarios for User Registration and Login. | 3 |
| [ ] | **#3.1: Validation Schema** | `infra/validation` | Infra | Integrate Zod/Joi for shared request validation middleware. | — |
| [ ] | **#3.2: Global Error Handler** | `infra/error-handler` | Infra | Implement central middleware for consistent API error responses. | — |
| [x] | **#7.0: Multi-tenancy BDD** | `feat-bdd-plan` | Shift-Left | Define IDOR scenarios and negative tests for cross-user data isolation. | 10 |
| [ ] | **#7.1: Isolation Step Definitions** | `feat/isolation` | TDD Red | Define Cucumber steps for `isolation.feature`. | — |
| [ ] | **#7.2: Isolation Middleware & Repo Filters** | `feat/isolation` | TDD Green | Middleware to scope every query by authenticated user_id. | — |
| [ ] | **#7.3: Isolation Refactor** | `feat/isolation` | Refactor | Clean up and BDD verification across all resources. | — |
| [ ] | **#4: User Auth Implementation** | `feat/user-auth` | Shift-Left | Implement Auth logic using TDD. | 4 |
| [ ] | **#4.1: Auth Step Definitions** | `feat/user-auth` | TDD Red | Define Cucumber steps for `auth.feature`. | — |
| [ ] | **#4.2: UserRepository** | `feat/user-auth` | TDD Green | PostgreSQL data access for Users. | — |
| [ ] | **#4.3: AuthService** | `feat/user-auth` | TDD Green | Password hashing and JWT logic. | — |
| [ ] | **#4.4: AuthController** | `feat/user-auth` | TDD Green | HTTP endpoints for reg/login. | — |
| [ ] | **#4.5: Auth Refactor** | `feat/user-auth` | Refactor | Clean up and BDD verification. | — |
| [x] | **#5: Bike Management BDD** | `feat-bdd-plan` | Shift-Left | Define Gherkin scenarios for Bike CRUD, including max-3-bikes limit edge case. | 5 |
| [ ] | **#6: Bike Management Impl** | `feat/bike-mgmt` | Shift-Left | Implement Bike endpoints using TDD. | 6 |
| [ ] | **#6.1: Bike Step Definitions** | `feat/bike-mgmt` | TDD Red | Define Cucumber steps for `bikes.feature`. | — |
| [ ] | **#6.2: BikeRepository** | `feat/bike-mgmt` | TDD Green | PostgreSQL data access for Bikes. | — |
| [ ] | **#6.3: BikeService** | `feat/bike-mgmt` | TDD Green | Implement bike CRUD and max 3 limit. | — |
| [ ] | **#6.4: BikeController** | `feat/bike-mgmt` | TDD Green | HTTP endpoints for Bike management. | — |
| [ ] | **#6.5: Bike Refactor** | `feat/bike-mgmt` | Refactor | Clean up and BDD verification. | — |
| [x] | **#8: Components BDD** | `feat-bdd-plan` | Shift-Left | Define Gherkin scenarios for Wear & Tear, Overrides, negative mileage input, and component deletion with existing logs. | 8 |
| [ ] | **#11: Component Tracking Impl** | `feat/comp-tracking` | Shift-Left | Implement Component endpoints using TDD. | — |
| [ ] | **#11.1: Comp Step Definitions** | `feat/comp-tracking` | TDD Red | Define Cucumber steps for `components.feature`. | — |
| [ ] | **#11.2: ComponentRepository** | `feat/comp-tracking` | TDD Green | PostgreSQL data access for Components. | — |
| [ ] | **#11.3: ComponentService** | `feat/comp-tracking` | TDD Green | Wear tracking and status transition logic. | — |
| [ ] | **#11.4: ComponentController** | `feat/comp-tracking` | TDD Green | HTTP endpoints for components. | — |
| [ ] | **#11.5: Comp Refactor** | `feat/comp-tracking` | Refactor | Clean up and BDD verification. | — |
| [x] | **#9: Maintenance BDD** | `feat-bdd-plan` | Shift-Left | Define Gherkin scenarios for Logging, Financials and Planning. | 9 |
| [ ] | **#12: Maintenance Logging Impl** | `feat/maint-logging` | Shift-Left | Implement Maintenance endpoints using TDD. | — |
| [ ] | **#12.1: Maint Step Definitions** | `feat/maint-logging` | TDD Red | Define Cucumber steps for `maintenance.feature`. | — |
| [ ] | **#12.2: LogRepository** | `feat/maint-logging` | TDD Green | PostgreSQL data access for Logs. | — |
| [ ] | **#12.3: MaintenanceService** | `feat/maint-logging` | TDD Green | Service event recording and costs. | — |
| [ ] | **#12.4: MaintenanceController** | `feat/maint-logging` | TDD Green | HTTP endpoints for maintenance logs. | — |
| [ ] | **#12.5: Maint Refactor** | `feat/maint-logging` | Refactor | Clean up and BDD verification. | — |
| [ ] | **#15: API Specification** | `infra/api-spec` | Arch | OpenAPI/Swagger contract documentation for all implemented endpoints. | — |
| [ ] | **#16: Performance Baseline** | `infra/performance` | Arch | Load-test financial/cost report endpoints on realistic log volume. | — |
| [ ] | **#17: Deployment Strategy** | `infra/deploy` | Arch | TBD — hosting and CI/CD deployment pipeline decision. | — |

## 📐 Development Workflow (Shift-Left)
For every feature (`feat/` branches), we follow this strict sequence:
1. **BDD Scenario:** Write `.feature` file $\rightarrow$ Define "Done".
2. **TDD Red:** Write failing test $\rightarrow$ Prove the feature is missing.
3. **TDD Green:** Write minimal code to pass $\rightarrow$ Implementation.
4. **Refactor:** Clean up code $\rightarrow$ Optimize without breaking tests.

## 🚦 Legend
[x] = Completed
[ ] = Pending
