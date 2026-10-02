import { Router } from 'express';
import { registerHandler, loginHandler, forgotPasswordHandler, resetPasswordHandler, verifyEmailHandler } from '../controllers/auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', registerHandler);
authRoutes.post('/login', loginHandler);
authRoutes.post('/forgot-password', forgotPasswordHandler);
authRoutes.post('/reset-password', resetPasswordHandler);
authRoutes.get('/verify/:email', verifyEmailHandler);
