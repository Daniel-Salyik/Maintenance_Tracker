import { Router, Request, Response } from 'express';
import { pool } from '../config/db';

export const testRoutes = Router();

testRoutes.post('/reset', async (_req: Request, res: Response) => {
  const { rows } = await pool.query('SELECT current_database() AS db');
  if (!rows[0].db.endsWith('_test')) {
    return res.status(403).json({ error: `Refusing to reset non-test database "${rows[0].db}"` });
  }
  const { rows: tables } = await pool.query(
    "SELECT quote_ident(tablename) AS t FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migrations'",
  );
  await pool.query(`TRUNCATE ${tables.map((r) => r.t).join(', ')} RESTART IDENTITY CASCADE`);
  res.status(200).json({ status: 'reset' });
});
