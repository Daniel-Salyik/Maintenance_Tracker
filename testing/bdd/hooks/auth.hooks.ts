import { Before, After } from '@cucumber/cucumber';
import request from 'supertest';
import 'dotenv/config';

const API_URL = process.env.API_URL || 'http://localhost:3000';

Before(async function () {
  // Reset DB state before each scenario
  // Since we don't have a reset endpoint yet, this is a placeholder
  // In TDD Green, we will implement a /test/reset endpoint or direct DB truncate
  try {
    await request(API_URL).post('/test/reset');
  } catch (e) {
    // Ignore if not implemented yet
  }
});

After(async function () {
  // Clean up any specific state if needed
});
