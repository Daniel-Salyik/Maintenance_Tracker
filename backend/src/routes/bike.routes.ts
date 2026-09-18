import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { create, list, get, update, remove } from '../controllers/bike.controller';

export const bikeRoutes = Router();

bikeRoutes.post('/', requireAuth, create);
bikeRoutes.get('/', requireAuth, list);
bikeRoutes.get('/:id', requireAuth, get);
bikeRoutes.put('/:id', requireAuth, update);
bikeRoutes.delete('/:id', requireAuth, remove);
