import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpError } from '../utils/http-error';

const { mockCreateUser, mockFindByEmail, mockBcryptHash, mockBcryptCompare, mockJwtSign, mockSendWelcome, mockSendReset, mockSetResetToken, mockFindByResetTokenHash, mockUpdatePassword } = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockFindByEmail: vi.fn(),
  mockBcryptHash: vi.fn(),
  mockBcryptCompare: vi.fn(),
  mockJwtSign: vi.fn(),
  mockSendWelcome: vi.fn(),
  mockSendReset: vi.fn(),
  mockSetResetToken: vi.fn(),
  mockFindByResetTokenHash: vi.fn(),
  mockUpdatePassword: vi.fn(),
}));

vi.mock('../repositories/user.repository', () => ({
  createUser: mockCreateUser,
  findByEmail: mockFindByEmail,
  setResetToken: mockSetResetToken,
  findByResetTokenHash: mockFindByResetTokenHash,
  updatePassword: mockUpdatePassword,
}));

vi.mock('./email.service', () => ({
  sendWelcomeEmail: mockSendWelcome,
  sendPasswordResetEmail: mockSendReset,
}));

vi.mock('bcrypt', () => ({
  default: { hash: mockBcryptHash, compare: mockBcryptCompare },
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: mockJwtSign },
}));

import { createHash } from 'crypto';
import { register, login, forgotPassword, issueResetToken, resetPassword } from './auth.service';

beforeEach(() => {
  mockCreateUser.mockReset();
  mockFindByEmail.mockReset();
  mockBcryptHash.mockReset();
  mockBcryptCompare.mockReset();
  mockJwtSign.mockReset();
  mockSendWelcome.mockReset();
  mockSendReset.mockReset();
  mockSetResetToken.mockReset();
  mockFindByResetTokenHash.mockReset();
  mockUpdatePassword.mockReset();
});

describe('register', () => {
  it('sends the welcome email once after the user is created', async () => {
    mockBcryptHash.mockResolvedValueOnce('hashed-pw');
    mockCreateUser.mockResolvedValueOnce({ id: '1', email: 'a@b.com' });

    await register('a@b.com', 'SecurePassword123!');

    expect(mockSendWelcome).toHaveBeenCalledTimes(1);
    expect(mockSendWelcome).toHaveBeenCalledWith('a@b.com');
  });

  it('does not wait for the welcome email to finish', async () => {
    mockBcryptHash.mockResolvedValueOnce('hashed-pw');
    mockCreateUser.mockResolvedValueOnce({ id: '1', email: 'a@b.com' });
    mockSendWelcome.mockReturnValueOnce(new Promise(() => {}));

    await expect(register('a@b.com', 'SecurePassword123!')).resolves.toBeUndefined();
  });

  it('sends no welcome email when user creation fails', async () => {
    mockBcryptHash.mockResolvedValueOnce('hashed-pw');
    mockCreateUser.mockRejectedValueOnce(new HttpError(409, 'Email already registered'));

    await expect(register('a@b.com', 'SecurePassword123!')).rejects.toMatchObject({ status: 409 });
    expect(mockSendWelcome).not.toHaveBeenCalled();
  });

  it('hashes the password once and creates the user, does not log the user in', async () => {
    mockBcryptHash.mockResolvedValueOnce('hashed-pw');
    mockCreateUser.mockResolvedValueOnce({ id: '1', email: 'a@b.com' });

    const result = await register('a@b.com', 'SecurePassword123!');

    expect(mockBcryptHash).toHaveBeenCalledTimes(1);
    expect(mockBcryptHash).toHaveBeenCalledWith('SecurePassword123!', expect.any(Number));
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
    expect(mockCreateUser).toHaveBeenCalledWith('a@b.com', 'hashed-pw');
    expect(result).toBeUndefined();
    expect(mockJwtSign).not.toHaveBeenCalled();
  });

  it('rejects an invalid email format with HttpError 400, never touches the repository', async () => {
    await expect(register('not-an-email', 'SecurePassword123!')).rejects.toMatchObject({ status: 400 });

    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockBcryptHash).not.toHaveBeenCalled();
  });

  it('rejects a weak password with HttpError 400, never touches the repository', async () => {
    await expect(register('a@b.com', 'weak')).rejects.toMatchObject({ status: 400 });

    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockBcryptHash).not.toHaveBeenCalled();
  });

  it('propagates a duplicate-email HttpError from the repository unchanged', async () => {
    mockBcryptHash.mockResolvedValueOnce('hashed-pw');
    const conflict = new HttpError(409, 'Email already in use');
    mockCreateUser.mockRejectedValueOnce(conflict);

    await expect(register('a@b.com', 'SecurePassword123!')).rejects.toBe(conflict);
  });
});

describe('login', () => {
  it('returns a token when the password matches', async () => {
    mockFindByEmail.mockResolvedValueOnce({ id: '1', email: 'a@b.com', password_hash: 'hashed-pw' });
    mockBcryptCompare.mockResolvedValueOnce(true);
    mockJwtSign.mockReturnValueOnce('signed-token');

    const token = await login('a@b.com', 'SecurePassword123!');

    expect(token).toBe('signed-token');
  });

  it('rejects a wrong password with HttpError 401 "Invalid email or password"', async () => {
    mockFindByEmail.mockResolvedValueOnce({ id: '1', email: 'a@b.com', password_hash: 'hashed-pw' });
    mockBcryptCompare.mockResolvedValueOnce(false);

    await expect(login('a@b.com', 'WrongPassword')).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password',
    });
  });

  it('rejects a nonexistent email with the identical HttpError (no user enumeration)', async () => {
    mockFindByEmail.mockResolvedValueOnce(null);

    await expect(login('nobody@b.com', 'whatever')).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password',
    });
    expect(mockBcryptCompare).not.toHaveBeenCalled();
  });
});

describe('forgotPassword', () => {
  it('stores a hashed token valid ~1h and emails the raw token link', async () => {
    mockFindByEmail.mockResolvedValueOnce({ id: 'u1', email: 'a@b.com' });
    const before = Date.now();

    await forgotPassword('a@b.com');

    expect(mockSetResetToken).toHaveBeenCalledTimes(1);
    const [id, hash, expires] = mockSetResetToken.mock.calls[0];
    expect(id).toBe('u1');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(expires.getTime()).toBeGreaterThanOrEqual(before + 3600_000 - 1000);
    expect(expires.getTime()).toBeLessThanOrEqual(Date.now() + 3600_000);

    expect(mockSendReset).toHaveBeenCalledTimes(1);
    const [to, link] = mockSendReset.mock.calls[0];
    expect(to).toBe('a@b.com');
    const token = new URL(link).searchParams.get('token') as string;
    expect(new URL(link).pathname).toBe('/reset-password');
    expect(createHash('sha256').update(token).digest('hex')).toBe(hash);
    expect(token).not.toBe(hash);
  });

  it('does nothing and does not throw for an unknown email', async () => {
    mockFindByEmail.mockResolvedValueOnce(null);

    await expect(forgotPassword('ghost@b.com')).resolves.toBeUndefined();

    expect(mockSetResetToken).not.toHaveBeenCalled();
    expect(mockSendReset).not.toHaveBeenCalled();
  });

  it('rejects an invalid email format with HttpError 400', async () => {
    await expect(forgotPassword('not-an-email')).rejects.toMatchObject({ status: 400, message: 'Invalid email format' });
    expect(mockFindByEmail).not.toHaveBeenCalled();
  });
});

describe('issueResetToken', () => {
  it('returns the raw token and stores only its hash with the given ttl', async () => {
    const before = Date.now();

    const token = await issueResetToken('u1', -1000);

    const [id, hash, expires] = mockSetResetToken.mock.calls[0];
    expect(id).toBe('u1');
    expect(createHash('sha256').update(token).digest('hex')).toBe(hash);
    expect(expires.getTime()).toBeLessThan(before);
  });
});

describe('resetPassword', () => {
  it('looks up the token by hash, hashes the new password and updates the user', async () => {
    mockFindByResetTokenHash.mockResolvedValueOnce({ id: 'u1' });
    mockBcryptHash.mockResolvedValueOnce('new-hash');

    await resetPassword('raw-token', 'NewSecurePass456');

    expect(mockFindByResetTokenHash).toHaveBeenCalledWith(createHash('sha256').update('raw-token').digest('hex'));
    expect(mockBcryptHash).toHaveBeenCalledWith('NewSecurePass456', expect.any(Number));
    expect(mockUpdatePassword).toHaveBeenCalledWith('u1', 'new-hash');
  });

  it('rejects an unknown or expired token with HttpError 400, no update', async () => {
    mockFindByResetTokenHash.mockResolvedValueOnce(null);

    await expect(resetPassword('bad', 'NewSecurePass456')).rejects.toMatchObject({
      status: 400,
      message: 'Invalid or expired reset token',
    });
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it('rejects a weak password with HttpError 400 before touching the repository', async () => {
    await expect(resetPassword('raw-token', 'weak')).rejects.toMatchObject({
      status: 400,
      message: 'Password does not meet strength requirements',
    });
    expect(mockFindByResetTokenHash).not.toHaveBeenCalled();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it('rejects a missing token or password with HttpError 400', async () => {
    await expect(resetPassword(undefined as any, 'NewSecurePass456')).rejects.toMatchObject({ status: 400 });
    await expect(resetPassword('raw-token', undefined as any)).rejects.toMatchObject({ status: 400 });
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });
});
