import { Request, Response, NextFunction } from 'express';

type Bucket = { count: number; resetAt: number };

const MAX_BUCKETS = 10000;

export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    for (const [bucketKey, bucket] of buckets) {
      if (now >= bucket.resetAt) {
        buckets.delete(bucketKey);
      }
    }

    if (buckets.size >= MAX_BUCKETS) {
      buckets.clear();
    }

    const bucket = buckets.get(key);

    if (!bucket) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (now >= bucket.resetAt) {
      bucket.count = 1;
      bucket.resetAt = now + windowMs;
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
