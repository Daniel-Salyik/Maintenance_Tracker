# 🚲 Bicycle Maintenance Tracker

![Project Status](https://img.shields.io/badge/Status-Phase%201%3A%20Core%20Infrastructure-green)
![TDD](https://img.shields.io/badge/Approach-TDD%20%2F%20BDD-blue)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20PostgreSQL-orange)

> *From "it broke" to "time to service"—transforming bike care into a proactive experience.*

## 🌟 Vision
Most cyclists maintain their bikes reactively. The **Bicycle Maintenance Tracker** changes this by tracking component wear against actual mileage, allowing users to plan service intervals before a failure occurs.

## ✨ Key Features
- **🚲 Multi-Bike Profiles:** Manage up to 3 bikes with detailed specs (frame, gear type, tire width).
- **⚙️ Component Wear Tracking:** Real-time status (Green $\rightarrow$ Yellow $\rightarrow$ Red) for drivetrain, bearings, and cables.
- **🔔 Proactive Alerts:** Get notified when your chain or tires hit their service limit.
- **📈 Financial Tracking:** Log every cent spent on maintenance and analyze cost-per-kilometer.
- **🤖 Intelligent Intervals (Dream Feature):** Auto-sync mileage from Strava/Garmin to update wear levels automatically.

## 🛠 Tech Stack
- **Frontend:** React $\mid$ TypeScript $\mid$ Tailwind CSS
- **Backend:** Node.js $\mid$ Express $\mid$ TypeScript
- **Database:** PostgreSQL
- **Testing:** Vitest (Unit) $\mid$ Playwright (E2E) $\mid$ Cucumber (BDD)

## 🚀 Getting Started
*(This section will be expanded as the project grows)*
1. **Clone the repo:** `git clone <repository-url>`
2. **Install dependencies:** `npm install`
3. **Setup Environment:** Create a `.env` file with your database credentials.
4. **Run Development Mode:** `npm run dev`

## 📐 Development Approach
This project follows a **Shift-Left** methodology:
- **TDD (Test Driven Development):** Tests are written alongside features.
- **BDD (Behavior Driven Development):** Feature behavior is defined via Cucumber Gherkin scenarios.
- **Quality First:** API testing via Postman and E2E coverage via Playwright.

## 🗺 Roadmap
- [ ] **Phase 1: Core Infrastructure** (Auth, Bike Profiles, DB Schema)
- [ ] **Phase 2: Component Logic** (Wear calculation, status triggers)
- [ ] **Phase 3: Logging & Financials** (Service history, cost analysis)
- [ ] **Phase 4: Intelligent Intervals** (Strava/Garmin API integration)
