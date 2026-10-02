import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { findByEmail } from '../repositories/user.repository';
import { issueResetToken } from '../services/auth.service';

export const testRoutes = Router();

testRoutes.post('/reset', async (_req: Request, res: Response) => {
  await pool.query('TRUNCATE maintenance_logs, components, bikes, users RESTART IDENTITY CASCADE');
  res.status(200).json({ status: 'reset' });
});

// Test-only: forgot-password email is skipped under test, so BDD fetches the raw token here.
testRoutes.post('/reset-token', async (req: Request, res: Response) => {
  const user = await findByEmail(req.body.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const token = await issueResetToken(user.id, req.body.ttlMs);
  res.status(200).json({ token });
});
