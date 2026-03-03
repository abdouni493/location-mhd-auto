import 'dotenv/config';
import { testConnection, pool } from '../lib/db-fallback.js';

(async () => {
  try {
    const r = await testConnection(5);
    console.log('Fallback DB time:', r);
  } catch (err) {
    console.error('Fallback connection failed:', err && err.message ? err.message : err);
    console.error(err);
    process.exit(2);
  } finally {
    try { await pool.end(); } catch (e) {}
  }
})();
