import { Router } from 'express';
import { registerHandler, loginHandler, verifyEmailHandler } from '../controllers/auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', registerHandler);
authRoutes.post('/login', loginHandler);
authRoutes.get('/verify/:email', verifyEmailHandler);
