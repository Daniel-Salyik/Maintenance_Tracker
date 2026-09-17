import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }));

vi.mock('../config/db', () => ({
  pool: { query: mockQuery },
}));

import { createUser, findByEmail, findById, updatePreferences } from './user.repository';

beforeEach(() => {
  mockQuery.mockReset();
});

describe('createUser', () => {
  it('inserts email and password hash, returns mapped row', async () => {
    const row = { id: '1', email: 'a@b.com', password_hash: 'hashed', distance_unit: 'km', currency: 'EUR' };
    mockQuery.mockResolvedValueOnce({ rows: [row] });

    const result = await createUser('a@b.com', 'hashed');

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO users/i);
    expect(params).toEqual(['a@b.com', 'hashed']);
    expect(result).toEqual(row);
  });

  it('translates unique-violation (23505) into HttpError 409', async () => {
    mockQuery.mockRejectedValueOnce({ code: '23505' });

    await expect(createUser('dup@b.com', 'hashed')).rejects.toMatchObject({
      status: 409,
      message: 'Email already in use',
    });
  });

  it('rethrows non-unique-violation errors unchanged', async () => {
    const dbError = new Error('connection lost');
    mockQuery.mockRejectedValueOnce(dbError);

    await expect(createUser('a@b.com', 'hashed')).rejects.toBe(dbError);
  });
});

describe('findByEmail', () => {
  it('queries by email and returns mapped row when found', async () => {
    const row = { id: '1', email: 'a@b.com', password_hash: 'hashed' };
    mockQuery.mockResolvedValueOnce({ rows: [row] });

    const result = await findByEmail('a@b.com');

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/WHERE email = \$1/i);
    expect(params).toEqual(['a@b.com']);
    expect(result).toEqual(row);
  });

  it('returns null when no row found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await findByEmail('nobody@b.com');

    expect(result).toBeNull();
  });
});

describe('findById', () => {
  it('queries by id and returns mapped row when found', async () => {
    const row = { id: '1', email: 'a@b.com' };
    mockQuery.mockResolvedValueOnce({ rows: [row] });

    const result = await findById('1');

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/WHERE id = \$1/i);
    expect(params).toEqual(['1']);
    expect(result).toEqual(row);
  });

  it('returns null when no row found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await findById('missing');

    expect(result).toBeNull();
  });
});

describe('updatePreferences', () => {
  it('builds a partial SET clause for a single field and returns mapped row', async () => {
    const row = { id: '1', distance_unit: 'mi' };
    mockQuery.mockResolvedValueOnce({ rows: [row] });

    const result = await updatePreferences('1', { distance_unit: 'mi' });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/UPDATE users SET distance_unit = \$1 WHERE id = \$2 RETURNING \*/i);
    expect(params).toEqual(['mi', '1']);
    expect(result).toEqual(row);
  });

  it('builds a partial SET clause for multiple fields in call order', async () => {
    const row = { id: '1', distance_unit: 'mi', currency: 'USD' };
    mockQuery.mockResolvedValueOnce({ rows: [row] });

    const result = await updatePreferences('1', { distance_unit: 'mi', currency: 'USD' });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/UPDATE users SET distance_unit = \$1, currency = \$2 WHERE id = \$3 RETURNING \*/i);
    expect(params).toEqual(['mi', 'USD', '1']);
    expect(result).toEqual(row);
  });
});
