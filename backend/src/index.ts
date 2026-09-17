import 'dotenv/config';
import express, { Request, Response } from 'express';
import { authRoutes } from './routes/auth.routes';
import { userRoutes, usersRoutes } from './routes/user.routes';
import { testRoutes } from './routes/test.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/users', usersRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.use('/test', testRoutes);
}

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
