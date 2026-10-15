import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

const { mockRegister, mockLogin, mockForgotPassword, mockFindByEmail } = vi.hoisted(() => ({
  mockRegister: vi.fn(),
  mockLogin: vi.fn(),
  mockForgotPassword: vi.fn(),
  mockFindByEmail: vi.fn(),
}));

vi.mock('../services/auth.service', () => ({
  register: mockRegister,
  login: mockLogin,
  forgotPassword: mockForgotPassword,
}));

vi.mock('../repositories/user.repository', () => ({
  findByEmail: mockFindByEmail,
}));

import { registerHandler, loginHandler, forgotPasswordHandler, verifyEmailHandler } from './auth.controller';

beforeEach(() => {
  mockRegister.mockReset();
  mockLogin.mockReset();
  mockForgotPassword.mockReset();
  mockFindByEmail.mockReset();
});

function fakeRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

// Express 5 leaves req.body undefined when the request carries no parsable body.
const noBody = {} as Request;

describe('registerHandler', () => {
  it('passes email and password to the service and answers 201', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const req = { body: { email: 'a@b.com', password: 'SecurePassword123!' } } as Request;
    const res = fakeRes();

    await registerHandler(req, res);

    expect(mockRegister).toHaveBeenCalledWith('a@b.com', 'SecurePassword123!');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Registration successful. Please log in.' });
  });

  it('forwards undefined to the service when there is no body, so the service answers 400 not 500', async () => {
    mockRegister.mockRejectedValueOnce({ status: 400 });

    await expect(registerHandler(noBody, fakeRes())).rejects.toMatchObject({ status: 400 });

    expect(mockRegister).toHaveBeenCalledWith(undefined, undefined);
  });
});

describe('loginHandler', () => {
  it('passes credentials to the service and answers 200 with the token', async () => {
    mockLogin.mockResolvedValueOnce('signed-token');
    const req = { body: { email: 'a@b.com', password: 'SecurePassword123!' } } as Request;
    const res = fakeRes();

    await loginHandler(req, res);

    expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'SecurePassword123!');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: 'signed-token' });
  });

  it('forwards undefined to the service when there is no body, so the service answers 400 not 500', async () => {
    mockLogin.mockRejectedValueOnce({ status: 400 });

    await expect(loginHandler(noBody, fakeRes())).rejects.toMatchObject({ status: 400 });

    expect(mockLogin).toHaveBeenCalledWith(undefined, undefined);
  });
});

describe('forgotPasswordHandler', () => {
  it('passes the email to the service and answers 200 with the generic message', async () => {
    mockForgotPassword.mockResolvedValueOnce(undefined);
    const req = { body: { email: 'a@b.com' } } as Request;
    const res = fakeRes();

    await forgotPasswordHandler(req, res);

    expect(mockForgotPassword).toHaveBeenCalledWith('a@b.com');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'If an account exists, a reset link has been sent.' });
  });

  it('forwards undefined to the service when there is no body', async () => {
    mockForgotPassword.mockRejectedValueOnce({ status: 400 });

    await expect(forgotPasswordHandler(noBody, fakeRes())).rejects.toMatchObject({ status: 400 });

    expect(mockForgotPassword).toHaveBeenCalledWith(undefined);
  });
});

describe('verifyEmailHandler', () => {
  it('answers 200 with the email when the user exists', async () => {
    mockFindByEmail.mockResolvedValueOnce({ email: 'a@b.com' });
    const req = { params: { email: 'a@b.com' } } as unknown as Request;
    const res = fakeRes();

    await verifyEmailHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('answers 404 when the user does not exist', async () => {
    mockFindByEmail.mockResolvedValueOnce(null);
    const req = { params: { email: 'ghost@b.com' } } as unknown as Request;
    const res = fakeRes();

    await verifyEmailHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });
});
