import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpError } from '../utils/http-error';

const {
  mockCreateUser,
  mockFindByEmail,
  mockBcryptHash,
  mockBcryptCompare,
  mockJwtSign,
  mockSendWelcomeEmail,
  mockSendPasswordResetEmail,
  mockCreateResetToken,
} = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockFindByEmail: vi.fn(),
  mockBcryptHash: vi.fn(),
  mockBcryptCompare: vi.fn(),
  mockJwtSign: vi.fn(),
  mockSendWelcomeEmail: vi.fn(),
  mockSendPasswordResetEmail: vi.fn(),
  mockCreateResetToken: vi.fn(),
}));

vi.mock('../repositories/user.repository', () => ({
  createUser: mockCreateUser,
  findByEmail: mockFindByEmail,
}));

vi.mock('../repositories/password-reset.repository', () => ({
  createResetToken: mockCreateResetToken,
}));

vi.mock('./mail.service', () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

vi.mock('bcrypt', () => ({
  default: { hash: mockBcryptHash, compare: mockBcryptCompare },
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: mockJwtSign },
}));

import { register, login, forgotPassword } from './auth.service';

beforeEach(() => {
  mockCreateUser.mockReset();
  mockFindByEmail.mockReset();
  mockBcryptHash.mockReset();
  mockBcryptCompare.mockReset();
  mockJwtSign.mockReset();
  mockSendWelcomeEmail.mockReset();
  mockSendWelcomeEmail.mockResolvedValue(undefined);
  mockSendPasswordResetEmail.mockReset();
  mockSendPasswordResetEmail.mockResolvedValue(undefined);
  mockCreateResetToken.mockReset();
  mockCreateResetToken.mockResolvedValue(undefined);
});

describe('register', () => {
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
    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('sends a welcome email after the user is created', async () => {
    mockBcryptHash.mockResolvedValueOnce('hashed-pw');
    mockCreateUser.mockResolvedValueOnce({ id: '1', email: 'a@b.com' });

    await register('a@b.com', 'SecurePassword123!');

    expect(mockSendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(mockSendWelcomeEmail).toHaveBeenCalledWith('a@b.com');
  });

  it('still resolves when the welcome email fails (fire-and-forget)', async () => {
    mockBcryptHash.mockResolvedValueOnce('hashed-pw');
    mockCreateUser.mockResolvedValueOnce({ id: '1', email: 'a@b.com' });
    mockSendWelcomeEmail.mockRejectedValueOnce(new Error('smtp down'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(register('a@b.com', 'SecurePassword123!')).resolves.toBeUndefined();

    await vi.waitFor(() => expect(errorSpy).toHaveBeenCalled());
    errorSpy.mockRestore();
  });

  it.each([undefined, null, 123, { a: 1 }, ['a@b.com']])(
    'rejects a non-string email (%j) with HttpError 400 "Invalid email format"',
    async (bad) => {
      await expect(register(bad as unknown as string, 'SecurePassword123!')).rejects.toMatchObject({
        status: 400,
        message: 'Invalid email format',
      });

      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
      expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, null, 12345678, { a: 1 }, ['SecurePassword123!']])(
    'rejects a non-string password (%j) with HttpError 400, never touches the repository',
    async (bad) => {
      await expect(register('a@b.com', bad as unknown as string)).rejects.toMatchObject({
        status: 400,
        message: 'Password does not meet strength requirements',
      });

      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
      expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    }
  );

  it('does not send an email when validation fails', async () => {
    await expect(register('not-an-email', 'SecurePassword123!')).rejects.toMatchObject({ status: 400 });

    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
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
  const user = { id: 'user-1', email: 'a@b.com' };

  it('stores only the sha256 hash of the token, expiring in about one hour', async () => {
    mockFindByEmail.mockResolvedValueOnce(user);
    const before = Date.now();

    await forgotPassword('a@b.com');

    expect(mockCreateResetToken).toHaveBeenCalledTimes(1);
    const [userId, tokenHash, expiresAt] = mockCreateResetToken.mock.calls[0];
    expect(userId).toBe('user-1');
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    const ttl = (expiresAt as Date).getTime() - before;
    expect(ttl).toBeGreaterThan(59 * 60 * 1000);
    expect(ttl).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
  });

  it('emails a reset link that carries the raw token, never the stored hash', async () => {
    mockFindByEmail.mockResolvedValueOnce(user);

    await forgotPassword('a@b.com');

    expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const [to, link] = mockSendPasswordResetEmail.mock.calls[0];
    const tokenHash = mockCreateResetToken.mock.calls[0][1];
    expect(to).toBe('a@b.com');
    expect(link).toMatch(/\/reset-password\?token=[0-9a-f]{64}$/);
    expect(link).not.toContain(tokenHash);
  });

  it('sends the email to the stored address, not the typed string', async () => {
    mockFindByEmail.mockResolvedValueOnce({ id: 'user-1', email: 'stored@b.com' });

    await forgotPassword('typed@b.com');

    expect(mockSendPasswordResetEmail.mock.calls[0][0]).toBe('stored@b.com');
  });

  it('does nothing and resolves for an unknown email (no user enumeration)', async () => {
    mockFindByEmail.mockResolvedValueOnce(null);

    await expect(forgotPassword('ghost@b.com')).resolves.toBeUndefined();

    expect(mockCreateResetToken).not.toHaveBeenCalled();
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('rejects an empty email with HttpError 400 "Email is required"', async () => {
    await expect(forgotPassword('')).rejects.toMatchObject({ status: 400, message: 'Email is required' });

    expect(mockFindByEmail).not.toHaveBeenCalled();
  });

  it.each([undefined, null, 123, { a: 1 }, ['a@b.com']])(
    'rejects a non-string email (%j) with HttpError 400 before any lookup',
    async (bad) => {
      await expect(forgotPassword(bad as unknown as string)).rejects.toMatchObject({
        status: 400,
        message: 'Email is required',
      });

      expect(mockFindByEmail).not.toHaveBeenCalled();
    }
  );

  it('still resolves when the reset email fails (fire-and-forget)', async () => {
    mockFindByEmail.mockResolvedValueOnce(user);
    mockSendPasswordResetEmail.mockRejectedValueOnce(new Error('smtp down'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(forgotPassword('a@b.com')).resolves.toBeUndefined();

    await vi.waitFor(() => expect(errorSpy).toHaveBeenCalled());
    errorSpy.mockRestore();
  });
});

describe('forgotPassword reset link and ordering', () => {
  const user = { id: 'user-1', email: 'a@b.com' };

  afterEach(() => { 
    vi.unstubAllEnvs();
  });

  it('saves the token before it sends the email', async () => {
    mockFindByEmail.mockResolvedValueOnce(user);

    await forgotPassword('a@b.com');

    const saved = mockCreateResetToken.mock.invocationCallOrder[0];
    const sent = mockSendPasswordResetEmail.mock.invocationCallOrder[0];
    expect(saved).toBeLessThan(sent);
  });

  it('sends no email and rejects when the token cannot be saved', async () => {
    const dbError = new Error('connection lost');
    mockFindByEmail.mockResolvedValueOnce(user);
    mockCreateResetToken.mockRejectedValueOnce(dbError);

    await expect(forgotPassword('a@b.com')).rejects.toBe(dbError);

    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('creates a different token on every request', async () => {
    mockFindByEmail.mockResolvedValue(user);

    await forgotPassword('a@b.com');
    await forgotPassword('a@b.com');

    const [, first] = mockSendPasswordResetEmail.mock.calls[0];
    const [, second] = mockSendPasswordResetEmail.mock.calls[1];
    expect(first).not.toBe(second);
    expect(mockCreateResetToken.mock.calls[0][1]).not.toBe(mockCreateResetToken.mock.calls[1][1]);
  });

  it('builds the link from FRONTEND_URL', async () => {
    vi.stubEnv('FRONTEND_URL', 'https://app.example.com');
    mockFindByEmail.mockResolvedValueOnce(user);

    await forgotPassword('a@b.com');

    expect(mockSendPasswordResetEmail.mock.calls[0][1]).toMatch(
      /^https:\/\/app\.example\.com\/reset-password\?token=[0-9a-f]{64}$/
    );
  });

  it('falls back to the local frontend URL when FRONTEND_URL is not set', async () => {
    vi.stubEnv('FRONTEND_URL', undefined);
    mockFindByEmail.mockResolvedValueOnce(user);

    await forgotPassword('a@b.com');

    expect(mockSendPasswordResetEmail.mock.calls[0][1]).toMatch(
      /^http:\/\/localhost:5173\/reset-password\?token=[0-9a-f]{64}$/
    );
  });
});
