import { Pool } from 'pg';

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error('NEON_DATABASE_URL is not set');

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  allowExitOnIdle: true,
  keepAlive: true,
  statement_timeout: 60000,
});

export async function testConnection(retries = 5) {
  let attempt = 0;
  const backoff = (n) => Math.min(30000, 500 * Math.pow(2, n));

  while (attempt < retries) {
    try {
      const res = await pool.query('SELECT now()');
      return res.rows[0];
    } catch (err) {
      attempt += 1;
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, backoff(attempt)));
    }
  }
  throw new Error('testConnection: exceeded retries');
}
