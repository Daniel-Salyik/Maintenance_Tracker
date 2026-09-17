# 🗺 Backend Implementation Roadmap

This file tracks the atomic progression of the backend development. Each task corresponds to a specific feature/unit of work and should be developed on its own dedicated branch.

## 🛠 Task List

| Status | Task | Branch | Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| Done | **#1: Project Structure & TS Setup** | `setup/backend-ts` | Infra | Initialize Node.js, Express, and TypeScript configuration. |
| Waiting | **#1.1: CI/CD Pipeline** | `infra/cicd` | Infra | Automate test execution (BDD + unit) on every PR via GitHub Actions. |
| Done | **#2: Database Schema Design** | `feat/db-schema` | Arch | PostgreSQL schema for Users, Bikes, Components, and Logs. |
| Waiting | **#2.1: DB Migration Tooling** | `infra/migrations` | Infra | Implement migration strategy (Knex/TypeORM) over manual schema scripts. |
| Done | **#3: Auth BDD Scenarios** | `feat-bdd-plan` | Shift-Left | Define Gherkin scenarios for User Registration and Login. |
| Waiting | **#3.1: Validation Schema** | `infra/validation` | Infra | Integrate Zod/Joi for shared request validation middleware. |
| Waiting | **#3.2: Global Error Handler** | `infra/error-handler` | Infra | Implement central middleware for consistent API error responses. |
| Done | **#4.0: Multi-tenancy BDD** | `feat-bdd-plan` | Shift-Left | Define IDOR scenarios and negative tests for cross-user data isolation. |
| Waiting | **#4.1: Isolation Step Definitions** | `feat/isolation` | TDD Red | Define Cucumber steps for `isolation.feature`. |
| Waiting | **#4.2: Isolation Middleware & Repo Filters** | `feat/isolation` | TDD Green | Middleware to scope every query by authenticated user_id. |
| Waiting | **#4.3: Isolation Refactor** | `feat/isolation` | Refactor | Clean up and BDD verification across all resources. |
| Waiting | **#5: User Auth Implementation** | `feat/user-auth` | Shift-Left | Implement Auth logic using TDD. |
| Waiting | **#5.1: Auth Step Definitions** | `feat/user-auth` | TDD Red | Define Cucumber steps for `auth.feature`. |
| Waiting | **#5.2: UserRepository** | `feat/user-auth` | TDD Green | PostgreSQL data access for Users. |
| Waiting | **#5.3: AuthService** | `feat/user-auth` | TDD Green | Password hashing and JWT logic. |
| Waiting | **#5.4: AuthController** | `feat/user-auth` | TDD Green | HTTP endpoints for reg/login. |
| Waiting | **#5.5: Auth Refactor** | `feat/user-auth` | Refactor | Clean up and BDD verification. |
| Done | **#6: Bike Management BDD** | `feat-bdd-plan` | Shift-Left | Define Gherkin scenarios for Bike CRUD, including max-3-bikes limit edge case. |
| Waiting | **#7: Bike Management Impl** | `feat/bike-mgmt` | Shift-Left | Implement Bike endpoints using TDD. |
| Waiting | **#7.1: Bike Step Definitions** | `feat/bike-mgmt` | TDD Red | Define Cucumber steps for `bikes.feature`. |
| Waiting | **#7.2: BikeRepository** | `feat/bike-mgmt` | TDD Green | PostgreSQL data access for Bikes. |
| Waiting | **#7.3: BikeService** | `feat/bike-mgmt` | TDD Green | Implement bike CRUD and max 3 limit. |
| Waiting | **#7.4: BikeController** | `feat/bike-mgmt` | TDD Green | HTTP endpoints for Bike management. |
| Waiting | **#7.5: Bike Refactor** | `feat/bike-mgmt` | Refactor | Clean up and BDD verification. |
| Done | **#8: Components BDD** | `feat-bdd-plan` | Shift-Left | Define Gherkin scenarios for Wear & Tear, Overrides, negative mileage input, and component deletion with existing logs. |
| Waiting | **#9: Component Tracking Impl** | `feat/comp-tracking` | Shift-Left | Implement Component endpoints using TDD. |
| Waiting | **#9.1: Comp Step Definitions** | `feat/comp-tracking` | TDD Red | Define Cucumber steps for `components.feature`. |
| Waiting | **#9.2: ComponentRepository** | `feat/comp-tracking` | TDD Green | PostgreSQL data access for Components. |
| Waiting | **#9.3: ComponentService** | `feat/comp-tracking` | TDD Green | Wear tracking and status transition logic. |
| Waiting | **#9.4: ComponentController** | `feat/comp-tracking` | TDD Green | HTTP endpoints for components. |
| Waiting | **#9.5: Comp Refactor** | `feat/comp-tracking` | Refactor | Clean up and BDD verification. |
| Done | **#10: Maintenance BDD** | `feat-bdd-plan` | Shift-Left | Define Gherkin scenarios for Logging, Financials and Planning. |
| Waiting | **#11: Maintenance Logging Impl** | `feat/maint-logging` | Shift-Left | Implement Maintenance endpoints using TDD. |
| Waiting | **#11.1: Maint Step Definitions** | `feat/maint-logging` | TDD Red | Define Cucumber steps for `maintenance.feature`. |
| Waiting | **#11.2: LogRepository** | `feat/maint-logging` | TDD Green | PostgreSQL data access for Logs. |
| Waiting | **#11.3: MaintenanceService** | `feat/maint-logging` | TDD Green | Service event recording and costs. |
| Waiting | **#11.4: MaintenanceController** | `feat/maint-logging` | TDD Green | HTTP endpoints for maintenance logs. |
| Waiting | **#11.5: Maint Refactor** | `feat/maint-logging` | Refactor | Clean up and BDD verification. |
| Waiting | **#12: Frontend BDD Scenarios** | `feat-bdd-plan` | Shift-Left | Define Gherkin scenarios for login, bike CRUD, component tracking, and maintenance logging views. |
| Waiting | **#13: Frontend Implementation** | `feat/frontend-core` | Shift-Left | Implement a minimal React SPA against existing backend endpoints, using TDD. |
| Waiting | **#13.1: Frontend Step Definitions** | `feat/frontend-core` | TDD Red | Define Cucumber steps for `frontend.feature`. |
| Waiting | **#13.2: Login Page** | `feat/frontend-core` | TDD Green | Login/registration view wired to Auth endpoints. |
| Waiting | **#13.3: Bike Pages** | `feat/frontend-core` | TDD Green | List/create/edit views for Bike CRUD (max 3 bikes). |
| Waiting | **#13.4: Component Pages** | `feat/frontend-core` | TDD Green | View for component wear status and overrides. |
| Waiting | **#13.5: Maintenance Pages** | `feat/frontend-core` | TDD Green | Log entry form and history view for maintenance logging. |
| Waiting | **#13.6: Frontend Refactor** | `feat/frontend-core` | Refactor | Clean up and BDD verification. |
| Waiting | **#14: API Specification** | `infra/api-spec` | Arch | OpenAPI/Swagger contract documentation for all implemented endpoints. |
| Waiting | **#15: Performance Baseline** | `infra/performance` | Arch | Load-test financial/cost report endpoints on realistic log volume. |
| Waiting | **#16: Deployment Strategy** | `infra/deploy` | Arch | TBD — hosting and CI/CD deployment pipeline decision. |
| Waiting | **#17: Strava OAuth Integration** | `feat/strava-oauth` | TBD | Deferred: OAuth integration with Strava to auto-sync mileage/activity data (per SPECIFICATION.md/README.md future scope). |

## 📐 Development Workflow (Shift-Left)
For every feature (`feat/` branches), we follow this strict sequence:
1. **BDD Scenario:** Write `.feature` file $\rightarrow$ Define "Done".
2. **TDD Red:** Write failing test $\rightarrow$ Prove the feature is missing.
3. **TDD Green:** Write minimal code to pass $\rightarrow$ Implementation.
4. **Refactor:** Clean up code $\rightarrow$ Optimize without breaking tests.

## 🚦 Legend
Done = Completed
Waiting = Pending   
