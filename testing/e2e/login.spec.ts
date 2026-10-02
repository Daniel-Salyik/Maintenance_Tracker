import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Mirrors the @ui login scenarios in testing/bdd/features/auth.feature.
test.beforeEach(async ({ request }) => {
  await request.post(`${API_URL}/test/reset`);
});

// User setup goes through the API; only the behaviour under test goes through the browser.
async function register(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API_URL}/auth/register`, { data: { email, password } });
  expect(res.status()).toBe(201);
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

test('Successful login with email and password', async ({ page, request }) => {
  await register(request, 'cyclist@example.com', 'SecurePass123');
  await login(page, 'cyclist@example.com', 'SecurePass123');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Welcome back!')).toBeVisible();
});

test('Failed login with incorrect credentials', async ({ page, request }) => {
  await register(request, 'cyclist@example.com', 'SecurePass123');
  await login(page, 'cyclist@example.com', 'WrongPassword');
  await expect(page.getByText('Invalid email or password')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('Login fails with a non-existent email', async ({ page }) => {
  await login(page, 'ghost@example.com', 'AnyPassword123');
  await expect(page.getByText('Invalid email or password')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('Login fails when the email is missing', async ({ page }) => {
  await login(page, '', 'SecurePass123');
  await expect(page.getByText('Email and password are required')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('Login fails when the password is missing', async ({ page }) => {
  await login(page, 'cyclist@example.com', '');
  await expect(page.getByText('Email and password are required')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
