# Project Specification: Bicycle Maintenance Tracker

## 1. Vision
A proactive web application for individual cyclists to track component wear, log maintenance history, and plan future service costs. The app transforms maintenance from a reactive task ("it broke") to a proactive one ("time to service based on mileage").

## 2. Core Features

### 2.1 User Management & Auth
- **Authentication:** Secure user accounts via OAuth (integrating with Strava/Garmin/Google) and standard Email/Password.
- **User Preferences:**
    - Distance Units (Kilometers vs Miles).
    - Currency Preference (e.g., USD, EUR, GBP).
- **Multi-tenancy:** Strict isolation of bike data between users.

### 2.2 Bike Management
- **Capacity:** Max 3 bikes per user.
- **Bike Profile:**
    - Purchase Date
    - Frame Number
    - Model Year
    - Model Type
    - Short Description
- **Bike Specifications:**
    - Brake Type
    - Tire Width
    - User Weight
    - Number of Speeds
    - Shifting Type (Manual vs Electronic)

### 2.3 Component Tracking
- **Priority Groups:**
    - **Drivetrain (Critical):** Chain, Chainrings, Cassette.
    - **Wear & Tear:** Tires, Bearings, Cables.
    - **General:** Alignments, Frame.
- **Tracking Logic:**
    - Components have a "Last Serviced Mileage".
    - Components have a "Service Interval" (e.g., Chain: 3,000km).
    - **State Management:** Support for "Used Parts" (Starting Mileage $\neq$ 0) and "Manual Wear %" overrides (e.g., from a chain checker tool).
    - Status changes based on current mileage (Green $\rightarrow$ Yellow $\rightarrow$ Red).

### 2.4 Maintenance Logging
- **Proactive Prompting:** 
    - System alerts user when a component exceeds its interval (e.g., "Lube chain every 200km").
    - **Delivery:** In-app dashboard alerts and optional email notifications.
- **Service Events:** 
    - Ability to group multiple jobs into a single event (e.g., "Annual Tune-up").
    - Digital/Printable checklists for these events.
- **Logging:** Recording date, specific components serviced, and cost.

### 2.5 Financials & History
- **Service History:** A chronological log of all maintenance.
- **Analytics:** Calculation of total cost, average cost per year/km.
- **Data Portability:** Ability to export service history to CSV or PDF for maintenance records/resale.

### 2.6 The "Dream Feature": Intelligent Intervals
- **Data Integration:** Pull distance/activity from 3rd party fitness trackers (Strava/Garmin).
- **Smart Recommendations:** Calculate recommended service periods based on:
    - `Bike Specs` + `User Weight` + `Activity Patterns` + `Travelled Distance`.

## 3. Technical Constraints & Goals

### 3.1 Development Methodology
- **Agile:** Iterative development with frequent feedback.
- **Shift-Left Approach:** Testing is integrated early. 
    - TDD (Test Driven Development) where applicable.
    - Early API testing (Postman).
    - E2E testing integrated into the pipeline (Playwright).
    - BDD (Cucumber) for defining feature behavior.

### 3.2 Proposed Tech Stack
- **Frontend:** React with TypeScript and Tailwind CSS.
- **Backend:** Node.js with Express and TypeScript.
- **Database:** PostgreSQL.
- **Testing:** Jest/Vitest (Unit), Playwright (E2E), Cucumber (BDD).
