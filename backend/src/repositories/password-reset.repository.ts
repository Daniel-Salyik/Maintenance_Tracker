import { pool } from '../config/db';

// One statement = atomic: a new token always replaces the user's older ones.
export async function createResetToken(userId: string, tokenHash: string, expiresAt: Date) {
  await pool.query(
    `WITH cleared AS (DELETE FROM password_reset_tokens WHERE user_id = $1)
     INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}
