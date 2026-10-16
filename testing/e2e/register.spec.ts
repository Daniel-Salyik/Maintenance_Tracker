import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const STRONG_PASSWORD = 'SecurePass123';

// Mirrors the @ui registration scenarios in testing/bdd/features/auth.feature.
test.beforeEach(async ({ request }) => {
  await request.post(`${API_URL}/test/reset`);
});

// User setup goes through the API; only the behaviour under test goes through the browser.
async function seedUser(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API_URL}/auth/register`, { data: { email, password } });
  expect(res.status()).toBe(201);
}

async function registerViaUi(page: Page, email: string, password: string) {
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
}

// "No account created" proven through the UI: logging in with those credentials must fail.
async function expectNotCreated(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Invalid email or password')).toBeVisible();
}

test('Successful registration redirects to login with confirmation', async ({ page }) => {
  await registerViaUi(page, 'newuser@example.com', STRONG_PASSWORD);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Registration successful. Please log in.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});

test('Registration fails with an already-registered email', async ({ page, request }) => {
  await seedUser(request, 'duplicate@example.com', STRONG_PASSWORD);
  await registerViaUi(page, 'duplicate@example.com', STRONG_PASSWORD);
  await expect(page.getByText('Email already in use')).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test('Registration fails with an invalid email format', async ({ page }) => {
  await registerViaUi(page, 'not-an-email', STRONG_PASSWORD);
  await expect(page.getByText('Invalid email format')).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  await expectNotCreated(page, 'not-an-email', STRONG_PASSWORD);
});

test('Registration fails with a weak password', async ({ page }) => {
  await registerViaUi(page, 'weakpass@example.com', '123');
  await expect(page.getByText('Password does not meet strength requirements')).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  await expectNotCreated(page, 'weakpass@example.com', '123');
});

test('Registration fails with an empty email', async ({ page }) => {
  await registerViaUi(page, '', STRONG_PASSWORD);
  await expect(page.getByText('Invalid email format')).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test('Registration fails with an empty password', async ({ page }) => {
  await registerViaUi(page, 'nopass@example.com', '');
  await expect(page.getByText('Password does not meet strength requirements')).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});
