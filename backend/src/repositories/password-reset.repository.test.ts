import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }));

vi.mock('../config/db', () => ({
  pool: { query: mockQuery },
}));

import { createResetToken } from './password-reset.repository';

beforeEach(() => {
  mockQuery.mockReset();
});

describe('createResetToken', () => {
  it('replaces older tokens: deletes the user\'s existing ones and inserts the new one in a single statement', async () => {
    const expiresAt = new Date('2026-10-14T12:00:00Z');
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await createResetToken('user-1', 'hashed-token', expiresAt);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/DELETE FROM password_reset_tokens/i);
    expect(sql).toMatch(/INSERT INTO password_reset_tokens/i);
    expect(params).toEqual(['user-1', 'hashed-token', expiresAt]);
  });

  it('rethrows database errors unchanged', async () => {
    const dbError = new Error('connection lost');
    mockQuery.mockRejectedValueOnce(dbError);

    await expect(createResetToken('user-1', 'hashed-token', new Date())).rejects.toBe(dbError);
  });
});
