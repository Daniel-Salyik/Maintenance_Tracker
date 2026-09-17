import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpError } from '../utils/http-error';

const { mockCreateUser, mockFindByEmail, mockBcryptHash, mockBcryptCompare, mockJwtSign } = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockFindByEmail: vi.fn(),
  mockBcryptHash: vi.fn(),
  mockBcryptCompare: vi.fn(),
  mockJwtSign: vi.fn(),
}));

vi.mock('../repositories/user.repository', () => ({
  createUser: mockCreateUser,
  findByEmail: mockFindByEmail,
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
});

describe('register', () => {
  it('hashes the password once and creates the user, returns a token', async () => {
    mockBcryptHash.mockResolvedValueOnce('hashed-pw');
    mockCreateUser.mockResolvedValueOnce({ id: '1', email: 'a@b.com' });
    mockJwtSign.mockReturnValueOnce('signed-token');

    const token = await register('a@b.com', 'SecurePassword123!');

    expect(mockBcryptHash).toHaveBeenCalledTimes(1);
    expect(mockBcryptHash).toHaveBeenCalledWith('SecurePassword123!', expect.any(Number));
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
    expect(mockCreateUser).toHaveBeenCalledWith('a@b.com', 'hashed-pw');
    expect(token).toBe('signed-token');
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
