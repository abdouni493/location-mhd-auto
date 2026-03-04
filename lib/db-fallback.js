import 'dotenv/config';

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  console.error('❌ ERROR: NEON_DATABASE_URL environment variable not set!');
  console.error('   Available env vars:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('DATABASE') || k.includes('NEON')));
  throw new Error('NEON_DATABASE_URL is not set');
}

let pool = null;
let clientName = 'unknown';

async function makePgPool() {
  const { Pool } = await import('pg');
  clientName = 'pg';
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
    allowExitOnIdle: true,
    keepAlive: true,
    statement_timeout: 60000,
  });
}

async function createPool() {
  // Allow forcing direct pg usage via env var (useful for local dev on Windows)
  const forcePg = (process.env.FORCE_PG === '1' || process.env.FORCE_PG === 'true');

  if (!forcePg) {
    try {
      const neon = await import('@neondatabase/serverless');
      const NeonPool = neon.Pool || neon.default?.Pool || null;
      if (NeonPool) {
        try {
          pool = new NeonPool({
            connectionString,
            ssl: { rejectUnauthorized: false },
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 20000,
            allowExitOnIdle: true,
            keepAlive: true,
            statement_timeout: 60000,
          });

          // quick test to validate the Neon client can connect
          await pool.query('SELECT now()');
          clientName = '@neondatabase/serverless';
          console.log(`DB client initialized using: ${clientName}`);
          return;
        } catch (e) {
          console.warn('Neon client failed to connect, falling back to pg:', e && e.message ? e.message : e);
          try { await pool?.end?.(); } catch (__) {}
          pool = null;
        }
      }
    } catch (e) {
      // import failed or not installed — fall through to pg
    }
  }

  // Fallback or forced path: use pg
  pool = await makePgPool();
  try {
    await pool.query('SELECT now()');
    console.log(`DB client initialized using: ${clientName} ${forcePg ? '(FORCED)' : '(fallback)'}`);
  } catch (e) {
    console.error('pg client test failed:', e && e.message ? e.message : e);
    throw e;
  }
}

await createPool();

export { pool, connectionString };

export async function testConnection(retries = 5) {
  let attempt = 0;
  const backoff = (n) => Math.min(30000, 500 * Math.pow(2, n));

  while (attempt < retries) {
    try {
      const res = await pool.query('SELECT now()');
      return res.rows[0];
    } catch (err) {
      attempt += 1;
      console.error(`DB test attempt ${attempt} failed:`, err && err.message ? err.message : err);
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, backoff(attempt)));
    }
  }
  throw new Error('testConnection: exceeded retries');
}
