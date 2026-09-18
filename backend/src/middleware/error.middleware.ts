import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/http-error';

export function errorMiddleware(err: HttpError | Error, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof HttpError ? err.message : 'Internal Server Error';

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
}
