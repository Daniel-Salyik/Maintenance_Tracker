import { Router } from 'express';
import {
  registerHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  verifyEmailHandler,
} from '../controllers/auth.controller';
import { rateLimit } from '../middleware/rate-limit.middleware';

export const authRoutes = Router();

authRoutes.post('/register', registerHandler);
authRoutes.post('/login', loginHandler);
const resetRateLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
authRoutes.post('/forgot-password', resetRateLimiter, forgotPasswordHandler);
authRoutes.post('/reset-password', resetRateLimiter, resetPasswordHandler);
authRoutes.get('/verify/:email', verifyEmailHandler);
