import { Request, Response, NextFunction } from 'express';

type Bucket = { count: number; resetAt: number };

export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      res.status(429).json({ error: 'Too many requests, please try again later.' });
      return;
    }

    bucket.count += 1;
    return next();
  };
}
