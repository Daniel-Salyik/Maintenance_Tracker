import { Router, Request, Response } from 'express';
import { pool } from '../config/db';

export const testRoutes = Router();

testRoutes.post('/reset', async (_req: Request, res: Response) => {
  await pool.query('TRUNCATE maintenance_logs, components, bikes, users RESTART IDENTITY CASCADE');
  res.status(200).json({ status: 'reset' });
});
