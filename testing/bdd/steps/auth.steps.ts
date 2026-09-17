import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import request from 'supertest';
import nock from 'nock';
import 'dotenv/config';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const STRAVA_API_URL = 'https://www.strava.com/api';

// Shared scenario state moved to Cucumber World (this)

// --- Section 1: Standard Authentication ---

Given('a registered user exists with email {string} and password {string}', async function (email, password) {
  const uniqueEmail = `${Date.now()}-${email}`;
  // Create real state via API
  const regRes = await request(API_URL).post('/auth/register').send({ email: uniqueEmail, password });
  expect(regRes.status).to.be.oneOf([200, 201]);

  // Log in to get token
  const loginRes = await request(API_URL).post('/auth/login').send({ email: uniqueEmail, password });
  expect(loginRes.status).to.equal(200);
  this.currentToken = loginRes.body.token;
  this.currentUser = { email: uniqueEmail };
});

Given('no registered user exists with email {string}', async function (_email: string) {
  // No setup needed - email is guaranteed unused in a fresh test DB
});

When('the user enters {string} and {string} on the login page', async function (email, password) {
  this.lastResponse = await request(API_URL)
    .post('/auth/login')
    .send({ email, password });
});

When('clicks the {string} button', async function () {
  // Request already sent in previous step
});

Then('they should be redirected to the dashboard', async function () {
  // Constraint: API returns JSON { token }, not 302
  expect(this.lastResponse.status).to.equal(200);
  expect(this.lastResponse.body).to.have.property('token');
});

Then('they should see a welcome message {string}', async function (message) {
  const token = this.lastResponse?.body?.token || this.currentToken;
  const res = await request(API_URL)
    .get('/user/me')
    .set('Authorization', `Bearer ${token || 'invalid'}`);

  expect(res.status).to.equal(200);
  expect(res.body.welcomeMessage).to.equal(message);
});

Then('they should see an error message {string}', async function (message) {
  expect(this.lastResponse.status).to.equal(401);
  expect(this.lastResponse.body.error).to.equal(message);
});

Then('they should remain on the login page', async function () {
  expect(this.lastResponse.status).to.equal(401);
});

Given('a new user provides a valid email {string} and a strong password', async function (email) {
  // Data generated per scenario to avoid collisions
  this.registrationData = {
    email: `${Date.now()}-${email}`,
    password: 'SecurePassword123!'
  };
});

Given('a new user provides an invalid email {string} and a strong password', async function (email: string) {
  this.registrationData = {
    email,
    password: 'SecurePassword123!'
  };
});

Given('a new user provides a valid email {string} and a weak password {string}', async function (email: string, password: string) {
  this.registrationData = {
    email: `${Date.now()}-${email}`,
    password
  };
});

When('they submit the registration form', async function () {
  this.lastResponse = await request(API_URL)
    .post('/auth/register')
    .send(this.registrationData);
});

Then('a new account should be created in the database', async function () {
  // Verify via a non-leaking endpoint or profile check
  const res = await request(API_URL)
    .get(`/auth/verify/${this.registrationData.email}`);
  expect(res.status).to.equal(200);
});

Then('they should be automatically logged in and redirected to the bike setup wizard', async function () {
  expect(this.lastResponse.status).to.equal(200);
  expect(this.lastResponse.body.token).to.exist;
  expect(this.lastResponse.body.redirectTo).to.equal('/setup-wizard');
});

Then('they should see a registration error message {string}', async function (message: string) {
  expect(this.lastResponse.status).to.be.oneOf([400, 409]);
  expect(this.lastResponse.body.error).to.equal(message);
});

Then('no new account should be created in the database', async function () {
  const res = await request(API_URL)
    .get(`/auth/verify/${this.registrationData.email}`);
  expect(res.status).to.equal(404);
});

// --- Section 2: OAuth Integration (@phase2 - excluded from default run, see SPECIFICATION.md 2.1/2.6) ---

Given('a user has a valid Strava account', async function () {
  // Setup nock for Strava token exchange
  nock(STRAVA_API_URL)
    .post('/oauth/token')
    .reply(200, {
      access_token: 'mock_strava_token',
      athlete_id: '12345'
    });
});

When('the user clicks {string}', async function (buttonText) {
  if (buttonText === 'Login with Strava') {
    this.lastResponse = await request(API_URL).get('/auth/strava');
  }
});

When('authorizes the application through the Strava OAuth portal', async function () {
  // Simulate callback with code
  this.lastResponse = await request(API_URL)
    .get('/auth/strava/callback')
    .query({ code: 'mock_strava_code' });
});

Then('they should be redirected to the app dashboard', async function () {
  expect(this.lastResponse.status).to.equal(200);
  expect(this.lastResponse.body.token).to.exist;
  expect(this.lastResponse.body.redirectTo).to.equal('/dashboard');
});

Then('their Strava profile information should be linked to their app account', async function () {
  const token = this.lastResponse.body.token;
  const res = await request(API_URL)
    .get('/user/profile')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).to.equal(200);
  expect(res.body.stravaId).to.equal('12345');
});

// --- Section 3: User Preferences ---

Given('a logged-in user whose distance unit is set to {string}', async function (unit) {
  // Setup: Register -> Login -> Set Pref
  const email = `pref-${Date.now()}@example.com`;
  await request(API_URL).post('/auth/register').send({ email, password: 'Password123!' });
  const login = await request(API_URL).post('/auth/login').send({ email, password: 'Password123!' });
  this.currentToken = login.body.token;

  await request(API_URL)
    .patch('/user/preferences')
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send({ distanceUnit: unit });
});

When('the user changes their distance preference to {string} in settings', async function (unit) {
  this.lastResponse = await request(API_URL)
    .patch('/user/preferences')
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send({ distanceUnit: unit });
});

Given('a logged-in user whose currency is set to {string}', async function (currency) {
  const email = `pref-${Date.now()}@example.com`;
  await request(API_URL).post('/auth/register').send({ email, password: 'Password123!' });
  const login = await request(API_URL).post('/auth/login').send({ email, password: 'Password123!' });
  this.currentToken = login.body.token;

  await request(API_URL)
    .patch('/user/preferences')
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send({ currency });
});

When('the user changes their currency preference to {string} in settings', async function (currency) {
  this.lastResponse = await request(API_URL)
    .patch('/user/preferences')
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send({ currency });
});

When('saves the changes', async function () {
  // Handled by PATCH
});

Then('all distances on the dashboard should be displayed in {string}', async function (unit) {
  const res = await request(API_URL)
    .get('/user/dashboard')
    .set('Authorization', `Bearer ${this.currentToken}`);

  expect(res.status).to.equal(200);
  expect(res.body.units).to.equal(unit === 'Miles' ? 'mi' : 'km');
});

Then('all financial costs and totals should be displayed in {string}', async function (currency) {
  const res = await request(API_URL)
    .get('/user/dashboard')
    .set('Authorization', `Bearer ${this.currentToken}`);

  expect(res.status).to.equal(200);
  expect(res.body.currency).to.equal(currency);
});

Then('the preference should be persisted in the database', async function () {
  const res = await request(API_URL)
    .get('/user/profile')
    .set('Authorization', `Bearer ${this.currentToken}`);

  expect(res.status).to.equal(200);
});

// --- Section 4: Security & Isolation ---

Given('User A has a bike named {string}', async function (bikeName) {
  const emailA = `userA-${Date.now()}@example.com`;
  await request(API_URL).post('/auth/register').send({ email: emailA, password: 'PasswordA' });
  const loginA = await request(API_URL).post('/auth/login').send({ email: emailA, password: 'PasswordA' });

  // Need token to create bike
  await request(API_URL)
    .post('/bikes')
    .set('Authorization', `Bearer ${loginA.body.token}`)
    .send({ name: bikeName });
});

Given('User B has a bike named {string}', async function (bikeName) {
  const emailB = `userB-${Date.now()}@example.com`;
  await request(API_URL).post('/auth/register').send({ email: emailB, password: 'PasswordB' });
  const loginB = await request(API_URL).post('/auth/login').send({ email: emailB, password: 'PasswordB' });

  this.otherUserToken = loginB.body.token;

  await request(API_URL)
    .post('/bikes')
    .set('Authorization', `Bearer ${this.otherUserToken}`)
    .send({ name: bikeName });
});

When('User B attempts to access the bike profile of {string} via a direct URL', async function (bikeName) {
  this.lastResponse = await request(API_URL)
    .get(`/bikes/${bikeName}`)
    .set('Authorization', `Bearer ${this.otherUserToken}`);
});

Then('the system should return a {string} or {string} error', async function (err1, err2) {
  expect(this.lastResponse.status).to.be.oneOf([403, 404]);
});

Then('User B should not be able to see any data belonging to User A', async function () {
  expect(this.lastResponse.body).to.not.have.property('specs');
});
