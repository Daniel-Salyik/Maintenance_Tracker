import { Before } from '@cucumber/cucumber';
import 'dotenv/config';

const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025';

// Only @email scenarios need Mailpit, so auth/bikes BDD still runs without it.
// The inbox is global: run these scenarios serially (no cucumber --parallel).
Before({ tags: '@email' }, async function () {
  try {
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    throw new Error(
      `Could not clear the Mailpit inbox at ${MAILPIT_URL} (${(err as Error).message}). Start it with "docker compose up -d mailpit".`,
    );
  }
});
