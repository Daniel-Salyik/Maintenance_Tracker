import { defineConfig } from '@playwright/test';
import 'dotenv/config';

const UI_URL = process.env.UI_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: 'testing/e2e',
  use: {
    baseURL: UI_URL,
    trace: 'retain-on-failure',
  },
  reporter: 'list',
  // Starts both servers unless already running. Postgres must be up and migrated.
  webServer: [
    { command: 'npm run dev', cwd: 'backend', url: `${API_URL}/health`, reuseExistingServer: true },
    { command: 'npm run dev', cwd: 'frontend', url: UI_URL, reuseExistingServer: true },
  ],
});
