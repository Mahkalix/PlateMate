import { readdir, readFile } from 'node:fs/promises';

export async function migrate(pool) {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [71439227]);
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const files = (await readdir(new URL('../sql/', import.meta.url))).filter(name => /^\d+_[\w-]+\.sql$/.test(name)).sort();
    for (const name of files) {
      if ((await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name])).rowCount) continue;
      await client.query('BEGIN');
      try {
        await client.query(await readFile(new URL(`../sql/${name}`, import.meta.url), 'utf8'));
        await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [71439227]);
    client.release();
  }
}
