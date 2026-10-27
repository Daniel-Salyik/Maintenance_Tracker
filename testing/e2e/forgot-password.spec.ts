import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3000';

test.beforeEach(async ({ request }) => {
  await request.post(`${API_URL}/test/reset`);
});

async function seedUser(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API_URL}/auth/register`, { data: { email, password } });
  expect(res.status()).toBe(201);
}

async function requestResetViaUi(page: Page, email: string) {
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send' }).click();
}

test('Forgot password page is reachable from the login page', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByRole('heading', { name: 'Forgot password' })).toBeVisible();
});

test('Forgot password for an existing account shows the confirmation message', async ({ page, request }) => {
  await seedUser(request, 'cyclist@example.com', 'SecurePass123');
  await requestResetViaUi(page, 'cyclist@example.com');
  await expect(page.getByText('If an account exists, a reset link has been sent.')).toBeVisible();
  await expect(page).toHaveURL(/\/forgot-password$/);
});

test('Forgot password for an unknown email shows the same confirmation message', async ({ page }) => {
  await requestResetViaUi(page, 'ghost@example.com');
  await expect(page.getByText('If an account exists, a reset link has been sent.')).toBeVisible();
  await expect(page).toHaveURL(/\/forgot-password$/);
});

test('Forgot password with a malformed email shows the same confirmation message', async ({ page }) => {
  await requestResetViaUi(page, 'not-an-email');
  await expect(page.getByText('If an account exists, a reset link has been sent.')).toBeVisible();
  await expect(page).toHaveURL(/\/forgot-password$/);
});

test('Forgot password with an empty email shows a validation message', async ({ page }) => {
  await requestResetViaUi(page, '');
  await expect(page.getByText('Email is required')).toBeVisible();
  await expect(page).toHaveURL(/\/forgot-password$/);
});

test('Forgot password page links back to login', async ({ page }) => {
  await page.goto('/forgot-password');
  await page.getByRole('link', { name: 'Back to login' }).click();
  await expect(page).toHaveURL(/\/login$/);
});
