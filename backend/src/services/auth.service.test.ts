import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpError } from '../utils/http-error';

const { mockCreateUser, mockFindByEmail, mockBcryptHash, mockBcryptCompare, mockJwtSign, mockSendWelcome } = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockFindByEmail: vi.fn(),
  mockBcryptHash: vi.fn(),
  mockBcryptCompare: vi.fn(),
  mockJwtSign: vi.fn(),
  mockSendWelcome: vi.fn(),
}));

vi.mock('../repositories/user.repository', () => ({
  createUser: mockCreateUser,
  findByEmail: mockFindByEmail,
}));

vi.mock('./email.service', () => ({
  sendWelcomeEmail: mockSendWelcome,
}));

vi.mock('bcrypt', () => ({
  default: { hash: mockBcryptHash, compare: mockBcryptCompare },
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: mockJwtSign },
}));

import { register, login } from './auth.service';

beforeEach(() => {
  mockCreateUser.mockReset();
  mockFindByEmail.mockReset();
  mockBcryptHash.mockReset();
  mockBcryptCompare.mockReset();
  mockJwtSign.mockReset();
  mockSendWelcome.mockReset();
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
