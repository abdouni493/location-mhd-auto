import { Pool } from 'pg';

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error('NEON_DATABASE_URL is not set');

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function testConnection() {
  const res = await pool.query('SELECT now()');
  return res.rows[0];
}
