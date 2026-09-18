import 'dotenv/config';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { pool } from '../src/config/db';

const SCHEMA_DIR = path.resolve(__dirname, '../../db/schema');

function migrationOrder(filename: string): number {
  if (filename === 'init.sql') return 0;
  const match = filename.match(/^(\d+)_/);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = readdirSync(SCHEMA_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => migrationOrder(a) - migrationOrder(b));

  for (const file of files) {
    const { rows } = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
    if (rows.length > 0) {
      console.log(`skip ${file} (already applied)`);
      continue;
    }

    const sql = readFileSync(path.join(SCHEMA_DIR, file), 'utf-8');
    console.log(`applying ${file}...`);
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
  }

  console.log('done');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
