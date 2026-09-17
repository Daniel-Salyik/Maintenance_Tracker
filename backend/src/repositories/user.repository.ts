import { pool } from '../config/db';
import { HttpError } from '../utils/http-error';

export async function createUser(email: string, passwordHash: string) {
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
      [email, passwordHash]
    );
    return rows[0];
  } catch (error: any) {
    if (error.code === '23505') {
      throw new HttpError(409, 'Email already in use');
    }
    throw error;
  }
}

export async function findByEmail(email: string) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] ?? null;
}

export async function findById(id: string) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function updatePreferences(id: string, fields: Record<string, string>) {
  const columns = Object.keys(fields);
  const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
  const params = [...columns.map((col) => fields[col]), id];

  const { rows } = await pool.query(
    `UPDATE users SET ${setClause} WHERE id = $${columns.length + 1} RETURNING *`,
    params
  );
  return rows[0];
}
