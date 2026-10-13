import { Before, After } from '@cucumber/cucumber';
import request from 'supertest';
import 'dotenv/config';

const API_URL = process.env.API_URL || 'http://localhost:3000';

Before(async function () {
  const res = await request(API_URL).post('/test/reset');
  if (res.status !== 200) {
    throw new Error(
      `/test/reset failed (${res.status}): ${JSON.stringify(res.body)}. Start the backend with "npm run dev:test".`,
    );
  }
});

After(async function () {
  // Clean up any specific state if needed
});
