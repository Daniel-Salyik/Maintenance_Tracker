import { pool } from '../config/db';

export async function createResetToken(userId: string, tokenHash: string, expiresAt: Date) {
  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );
}
