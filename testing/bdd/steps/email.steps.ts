import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import request from 'supertest';
import 'dotenv/config';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const MAILPIT_API = `${process.env.MAILPIT_URL || 'http://localhost:8025'}/api/v1`;

const WELCOME_SUBJECT = 'Welcome';
const RESET_SUBJECT = 'Reset your password';

// Mail is sent in the background (fire-and-forget), so positive steps poll,
// and "nothing arrives" steps wait one settle window before asserting.
const DELIVERY_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 100;
const SETTLE_MS = 500;
// Above DELIVERY_TIMEOUT_MS so a slow delivery fails with our message, not cucumber's generic timeout.
const STEP_TIMEOUT_MS = 15000;

type MailpitMessage = { ID: string; Subject: string; To: { Address: string }[] };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function mailpit(path: string) {
  const res = await fetch(`${MAILPIT_API}${path}`, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) {
    throw new Error(`Mailpit ${path} returned HTTP ${res.status}. Is it running? docker compose up -d mailpit`);
  }
  return res.json() as Promise<any>;
}

// Mailpit's "to:" search can match looser than the exact address, so keep only exact recipients.
async function emailsTo(address: string): Promise<MailpitMessage[]> {
  const body = await mailpit(`/search?limit=500&query=${encodeURIComponent(`to:"${address}"`)}`);
  const wanted = address.toLowerCase();
  return (body.messages ?? []).filter((m: MailpitMessage) => m.To.some((t) => t.Address.toLowerCase() === wanted));
}

// Waits for the first email to `address`, optionally only one whose subject contains `subjectPart`.
async function waitForEmail(address: string, subjectPart = ''): Promise<MailpitMessage> {
  const deadline = Date.now() + DELIVERY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const found = (await emailsTo(address)).find((m) => m.Subject.includes(subjectPart));
    if (found) return found;
    await sleep(POLL_INTERVAL_MS);
  }
  const what = subjectPart ? `with subject containing "${subjectPart}" ` : '';
  throw new Error(`No email ${what}reached ${address} within ${DELIVERY_TIMEOUT_MS}ms`);
}

// --- Section 1: Registration email ---

Then('a welcome email should be delivered to {string}', { timeout: STEP_TIMEOUT_MS }, async function (address: string) {
  await waitForEmail(address, WELCOME_SUBJECT);
});

Then('no email should be delivered to {string}', { timeout: STEP_TIMEOUT_MS }, async function (address: string) {
  await sleep(SETTLE_MS);
  expect(await emailsTo(address)).to.have.lengthOf(0);
});

Then('only one email should have been delivered to {string}', { timeout: STEP_TIMEOUT_MS }, async function (address: string) {
  await waitForEmail(address);
  await sleep(SETTLE_MS);
  expect(await emailsTo(address)).to.have.lengthOf(1);
});

Then('no email should have been delivered at all', { timeout: STEP_TIMEOUT_MS }, async function () {
  await sleep(SETTLE_MS);
  const inbox = await mailpit('/messages');
  expect(inbox.total).to.equal(0);
});

// --- Section 2: Forgot password email ---

When('the user requests a password reset for {string}', async function (email: string) {
  this.lastResponse = await request(API_URL).post('/auth/forgot-password').send({ email });
});

Then('they should see a reset confirmation message {string}', async function (message: string) {
  expect(this.lastResponse.status).to.equal(200);
  expect(this.lastResponse.body.message).to.equal(message);
});

Then('they should see a reset error message {string}', async function (message: string) {
  expect(this.lastResponse.status).to.equal(400);
  expect(this.lastResponse.body.error).to.equal(message);
});

Then('a password reset email should be delivered to {string}', { timeout: STEP_TIMEOUT_MS }, async function (address: string) {
  this.resetEmail = await waitForEmail(address, RESET_SUBJECT);
});

Then('the reset email should contain a reset link', async function () {
  const message = await mailpit(`/message/${this.resetEmail.ID}`);
  expect(message.Text).to.match(/\/reset-password\?token=[0-9a-f]{64}/);
});
