import { Request, Response } from 'express';
import { register, login, forgotPassword, resetPassword } from '../services/auth.service';
import { findByEmail } from '../repositories/user.repository';

export async function registerHandler(req: Request, res: Response) {
  await register(req.body.email, req.body.password);
  res.status(201).json({ message: 'Registration successful. Please log in.' });
}

export async function loginHandler(req: Request, res: Response) {
  const token = await login(req.body.email, req.body.password);
  res.status(200).json({ token });
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  await forgotPassword(req.body.email);
  res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  await resetPassword(req.body.token, req.body.password);
  res.status(200).json({ message: 'Password has been reset. Please log in.' });
}

export async function verifyEmailHandler(req: Request, res: Response) {
  const user = await findByEmail(req.params.email as string);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.status(200).json({ email: user.email });
}
