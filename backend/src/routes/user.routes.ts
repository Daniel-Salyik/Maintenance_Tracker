import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { me, profile, dashboard, updateOwnPreferences, updateOtherUserPreferences } from '../controllers/user.controller';

export const userRoutes = Router();

userRoutes.get('/me', requireAuth, me);
userRoutes.get('/profile', requireAuth, profile);
userRoutes.get('/dashboard', requireAuth, dashboard);
userRoutes.patch('/preferences', requireAuth, updateOwnPreferences);

export const usersRoutes = Router();
usersRoutes.patch('/:id/preferences', requireAuth, updateOtherUserPreferences);
