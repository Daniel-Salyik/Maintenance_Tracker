import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import request from 'supertest';
import { faker } from '@faker-js/faker';
import 'dotenv/config';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Shared scenario state lives on Cucumber World (this), matching auth.steps.ts

async function loginNewUser(world: any) {
  const email = faker.internet.email();
  const password = 'Password123!';
  await request(API_URL).post('/auth/register').send({ email, password });
  const login = await request(API_URL).post('/auth/login').send({ email, password });
  world.currentToken = login.body.token;
}

function defaultBikeBody() {
  return {
    modelType: 'Road Bike',
    modelYear: 2023,
    frameNumber: faker.string.alphanumeric(11).toUpperCase(),
    description: 'My main racing bike',
    specs: {
      brakeType: 'Disc',
      tireWidth: '25mm',
      userWeight: '75kg',
      numSpeeds: 12,
      shiftingType: 'Electronic'
    }
  };
}

// Top-level profile fields
const PROFILE_FIELD_TO_KEY: Record<string, string> = {
  'Frame Number': 'frameNumber',
  'Model Type': 'modelType',
  'Model Year': 'modelYear',
  'Description': 'description'
};

// Spec (nested) fields
const SPEC_FIELD_TO_KEY: Record<string, string> = {
  'Brake Type': 'brakeType',
  'Tire Width': 'tireWidth',
  'User Weight': 'userWeight',
  'Number of Speeds': 'numSpeeds',
  'Shifting Type': 'shiftingType'
};

// --- Section 1: Adding Bikes ---

Given('a logged-in user with space in their garage', async function () {
  await loginNewUser(this);
});

Given('a logged-in user', async function () {
  await loginNewUser(this);
});

When('the user provides the following bike profile:', async function (dataTable) {
  const rows: { Field: string; Value: string }[] = dataTable.hashes();
  this.bikeProfile = {};
  for (const row of rows) {
    const key = PROFILE_FIELD_TO_KEY[row.Field] || row.Field;
    this.bikeProfile[key] = row.Value;
  }
});

When('provides the following specifications:', async function (dataTable) {
  const rows: { Spec: string; Value: string }[] = dataTable.hashes();
  const specs: Record<string, string> = {};
  for (const row of rows) {
    specs[row.Spec] = row.Value;
  }
  this.lastResponse = await request(API_URL)
    .post('/bikes')
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send({ ...this.bikeProfile, specs });
});

Then('the bike should be successfully added to the fleet', async function () {
  expect(this.lastResponse.status).to.be.oneOf([200, 201]);
});

Then('the user should see the bike listed in their garage', async function () {
  const res = await request(API_URL)
    .get('/bikes')
    .set('Authorization', `Bearer ${this.currentToken}`);

  expect(res.status).to.equal(200);
  expect(res.body).to.be.an('array').with.length.above(0);
});

When('the user attempts to save a bike without a {string}', async function (fieldName: string) {
  const body: any = defaultBikeBody();
  delete body[PROFILE_FIELD_TO_KEY[fieldName] || fieldName];
  this.lastResponse = await request(API_URL)
    .post('/bikes')
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send(body);
});

When('the user attempts to save a bike with a {string} of {string}', async function (specName: string, value: string) {
  const body: any = defaultBikeBody();
  const key = SPEC_FIELD_TO_KEY[specName] || specName;
  body.specs[key] = value;
  this.lastResponse = await request(API_URL)
    .post('/bikes')
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send(body);
});

Then('the system should prevent the save', async function () {
  expect(this.lastResponse.status).to.equal(400);
});

Then('display an error: {string}', async function (message: string) {
  expect(this.lastResponse.body.error).to.equal(message);
});

// --- Section 2: Capacity Limits ---

Given('a user already has 3 bikes in their garage', async function () {
  await loginNewUser(this);
  for (let i = 0; i < 3; i++) {
    await request(API_URL)
      .post('/bikes')
      .set('Authorization', `Bearer ${this.currentToken}`)
      .send({ ...defaultBikeBody(), name: faker.commerce.productName() });
  }
});

When('the user attempts to add a 4th bike', async function () {
  this.lastResponse = await request(API_URL)
    .post('/bikes')
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send({ ...defaultBikeBody(), name: faker.commerce.productName() });
});

Then('the system should block the addition', async function () {
  expect(this.lastResponse.status).to.equal(400);
});

Then('display an error message {string}', async function (message: string) {
  expect(this.lastResponse.body.error).to.equal(message);
});

Then('the total bike count should remain at 3', async function () {
  const res = await request(API_URL)
    .get('/bikes')
    .set('Authorization', `Bearer ${this.currentToken}`);

  expect(res.status).to.equal(200);
  expect(res.body).to.have.length(3);
});

Given('a user has the maximum limit of 3 bikes', async function () {
  await loginNewUser(this);
  this.bikeNames = [];
  for (let i = 0; i < 3; i++) {
    const name = faker.commerce.productName();
    await request(API_URL)
      .post('/bikes')
      .set('Authorization', `Bearer ${this.currentToken}`)
      .send({ ...defaultBikeBody(), name });
    this.bikeNames.push(name);
  }
});

When('the user deletes one of their bikes', async function () {
  const name = this.bikeNames.pop();
  await request(API_URL)
    .delete(`/bikes/${name}`)
    .set('Authorization', `Bearer ${this.currentToken}`);
});

When('the user attempts to add a new bike', async function () {
  this.lastResponse = await request(API_URL)
    .post('/bikes')
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send({ ...defaultBikeBody(), name: faker.commerce.productName() });
});

Then('the system should successfully allow the addition', async function () {
  expect(this.lastResponse.status).to.be.oneOf([200, 201]);
});

Then('the total bike count should return to 3', async function () {
  const res = await request(API_URL)
    .get('/bikes')
    .set('Authorization', `Bearer ${this.currentToken}`);

  expect(res.status).to.equal(200);
  expect(res.body).to.have.length(3);
});

// --- Section 3: Managing Existing Bikes ---

Given('a bike exists in the user\'s fleet with {string} set to {string}', async function (specName: string, value: string) {
  await loginNewUser(this);
  this.bikeName = faker.commerce.productName();
  const body: any = defaultBikeBody();
  const key = SPEC_FIELD_TO_KEY[specName] || specName;
  body.specs[key] = value;
  await request(API_URL)
    .post('/bikes')
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send({ ...body, name: this.bikeName });
});

When('the user updates the {string} to {string} in the bike settings', async function (fieldName: string, value: string) {
  const body: any = SPEC_FIELD_TO_KEY[fieldName]
    ? { specs: { [SPEC_FIELD_TO_KEY[fieldName]]: value } }
    : { [PROFILE_FIELD_TO_KEY[fieldName] || fieldName]: value };

  this.lastResponse = await request(API_URL)
    .put(`/bikes/${this.bikeName}`)
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send(body);
});

Then('the bike\'s profile should reflect the new width of {string}', async function (width: string) {
  const res = await request(API_URL)
    .get(`/bikes/${this.bikeName}`)
    .set('Authorization', `Bearer ${this.currentToken}`);

  expect(res.status).to.equal(200);
  expect(res.body.specs.tireWidth).to.equal(width);
});

Then('the bike\'s profile should reflect the new description of {string}', async function (description: string) {
  const res = await request(API_URL)
    .get(`/bikes/${this.bikeName}`)
    .set('Authorization', `Bearer ${this.currentToken}`);

  expect(res.status).to.equal(200);
  expect(res.body.description).to.equal(description);
});

Given('a bike named {string} exists in the user\'s fleet', async function (bikeName: string) {
  await loginNewUser(this);
  this.bikeName = bikeName;
  await request(API_URL)
    .post('/bikes')
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send({ ...defaultBikeBody(), name: bikeName });
});

When('the user selects {string} for the {string}', async function (_action: string, bikeName: string) {
  this.bikeName = bikeName;
});

When('confirms the deletion in the pop-up dialog', async function () {
  this.lastResponse = await request(API_URL)
    .delete(`/bikes/${this.bikeName}`)
    .set('Authorization', `Bearer ${this.currentToken}`);
});

Then('the {string} should no longer appear in the garage', async function (bikeName: string) {
  const res = await request(API_URL)
    .get('/bikes')
    .set('Authorization', `Bearer ${this.currentToken}`);

  expect(res.status).to.equal(200);
  expect(res.body.map((b: any) => b.name)).to.not.include(bikeName);
});

Then('the user\'s available bike slots should increase by one', async function () {
  expect(this.lastResponse.status).to.be.oneOf([200, 204]);
});

Given('the bike has since been deleted in another tab', async function () {
  await request(API_URL)
    .delete(`/bikes/${this.bikeName}`)
    .set('Authorization', `Bearer ${this.currentToken}`);
});

When('the user attempts to update the {string} via their stale page', async function (bikeName: string) {
  this.lastResponse = await request(API_URL)
    .put(`/bikes/${bikeName}`)
    .set('Authorization', `Bearer ${this.currentToken}`)
    .send({ specs: { tireWidth: '30mm' } });
});

When('the user attempts to delete the {string} again via their stale page', async function (bikeName: string) {
  this.lastResponse = await request(API_URL)
    .delete(`/bikes/${bikeName}`)
    .set('Authorization', `Bearer ${this.currentToken}`);
});

Then('the system should return a {string} error', async function (code: string) {
  expect(this.lastResponse.status).to.equal(Number(code));
});

// --- Section 4: Listing and Viewing ---

Given('a logged-in user with an empty garage', async function () {
  await loginNewUser(this);
});

Given('a logged-in user with {int} bikes in their garage', async function (count: number) {
  await loginNewUser(this);
  for (let i = 0; i < count; i++) {
    await request(API_URL)
      .post('/bikes')
      .set('Authorization', `Bearer ${this.currentToken}`)
      .send({ ...defaultBikeBody(), name: faker.commerce.productName() });
  }
});

When('the user opens their garage', async function () {
  this.lastResponse = await request(API_URL)
    .get('/bikes')
    .set('Authorization', `Bearer ${this.currentToken}`);
});

Then('the garage should show {int} bikes', async function (count: number) {
  expect(this.lastResponse.status).to.equal(200);
  expect(this.lastResponse.body).to.have.length(count);
});

When('the user opens the profile for {string}', async function (bikeName: string) {
  this.lastResponse = await request(API_URL)
    .get(`/bikes/${bikeName}`)
    .set('Authorization', `Bearer ${this.currentToken}`);
});

Then('the profile should include the bike\'s full profile and specifications', async function () {
  expect(this.lastResponse.status).to.equal(200);
  expect(this.lastResponse.body).to.include.keys('modelType', 'modelYear', 'frameNumber', 'description', 'specs');
});

// --- Section 5: Security & Isolation ---
// "User A has a bike named {string}", "User B has a bike named {string}",
// "User B attempts to access the bike profile of {string} via a direct URL",
// "the system should return a {string} or {string} error", and
// "User B should not be able to see any data belonging to User A" are already
// defined in auth.steps.ts and are reused here as-is.

When('User B attempts to update the bike profile of {string} via a direct URL', async function (bikeName: string) {
  this.lastResponse = await request(API_URL)
    .put(`/bikes/${bikeName}`)
    .set('Authorization', `Bearer ${this.otherUserToken}`)
    .send({ specs: { tireWidth: '30mm' } });
});

When('User B attempts to delete the bike profile of {string} via a direct URL', async function (bikeName: string) {
  this.lastResponse = await request(API_URL)
    .delete(`/bikes/${bikeName}`)
    .set('Authorization', `Bearer ${this.otherUserToken}`);
});

When('an unauthenticated user attempts to {word} a bike', async function (action: string) {
  const fakeId = faker.string.uuid();
  if (action === 'view') {
    this.lastResponse = await request(API_URL).get('/bikes');
  } else if (action === 'add') {
    this.lastResponse = await request(API_URL).post('/bikes').send(defaultBikeBody());
  } else if (action === 'update') {
    this.lastResponse = await request(API_URL).put(`/bikes/${fakeId}`).send({ specs: { tireWidth: '30mm' } });
  } else if (action === 'delete') {
    this.lastResponse = await request(API_URL).delete(`/bikes/${fakeId}`);
  }
});
