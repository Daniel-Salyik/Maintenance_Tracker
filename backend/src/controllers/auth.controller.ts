import { Request, Response } from 'express';
import { register, login } from '../services/auth.service';
import { findByEmail } from '../repositories/user.repository';

export async function registerHandler(req: Request, res: Response) {
  const token = await register(req.body.email, req.body.password);
  res.status(201).json({ token, redirectTo: '/setup-wizard' });
}

export async function loginHandler(req: Request, res: Response) {
  const token = await login(req.body.email, req.body.password);
  res.status(200).json({ token });
}

export async function verifyEmailHandler(req: Request, res: Response) {
  const user = await findByEmail(req.params.email as string);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.status(200).json({ email: user.email });
}
