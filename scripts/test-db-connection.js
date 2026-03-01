import { Pool } from 'pg';

const conn = process.env.NEON_DATABASE_URL;
if (!conn) {
  console.error('Set NEON_DATABASE_URL first');
  process.exit(1);
}

const pool = new Pool({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
});

try {
  const r = await pool.query('SELECT now()');
  console.log('DB time:', r.rows[0]);
} catch (err) {
  console.error('Connection test failed:', err);
  process.exit(2);
} finally {
  await pool.end();
}
