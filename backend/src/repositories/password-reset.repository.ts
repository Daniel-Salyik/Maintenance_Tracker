import { pool } from '../config/db';

// One statement = atomic: a new token always replaces the user's older ones.
export async function createResetToken(userId: string, tokenHash: string, expiresAt: Date) {
  await pool.query(
    `WITH cleared AS (DELETE FROM password_reset_tokens WHERE user_id = $1)
     INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

export async function findResetToken(tokenHash: string) {
  const { rows } = await pool.query(
    'SELECT id, user_id, token_hash, expires_at FROM password_reset_tokens WHERE token_hash = $1',
    [tokenHash]
  );
  return rows[0] ?? null;
}

// Aliases for compatibility with different call sites.
export const findByTokenHash = findResetToken;
export const findValidResetToken = findResetToken;

export async function deleteResetToken(tokenHash: string) {
  await pool.query('DELETE FROM password_reset_tokens WHERE token_hash = $1', [tokenHash]);
}

export const deleteResetTokenByHash = deleteResetToken;
export const consumeResetToken = deleteResetToken;
