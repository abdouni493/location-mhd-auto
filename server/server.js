import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { Pool } from 'pg';

const app = express();

// Global error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
  console.error('Stack:', err.stack);
  // Don't exit - just log it
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]:', err);
  console.error('Stack:', err instanceof Error ? err.stack : 'N/A');
});

// ============================================================
// MIDDLEWARE - Enable compression for faster responses
// ============================================================
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb' }));

// ============================================================
// CACHING LAYER - In-memory cache for frequently accessed data
// ============================================================
const cache = new Map();
const CACHE_CONFIG = {
  customers: { ttl: 10 * 60 * 1000, maxSize: 500 }, // 10 min
  vehicles: { ttl: 15 * 60 * 1000, maxSize: 500 }, // 15 min
  agencies: { ttl: 30 * 60 * 1000, maxSize: 100 }, // 30 min
  workers: { ttl: 10 * 60 * 1000, maxSize: 200 }, // 10 min
  reservations: { ttl: 2 * 60 * 1000, maxSize: 1000 }, // 2 min (changes frequently)
  dashboard: { ttl: 3 * 60 * 1000, maxSize: 50 } // 3 min
};

function getFromCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > item.ttl) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setInCache(key, data, ttl) {
  if (!ttl) ttl = 5 * 60 * 1000; // default 5 min
  cache.set(key, { data, timestamp: Date.now(), ttl });
  // Simple garbage collection - limit cache size
  if (cache.size > 1000) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

function clearCache(pattern) {
  // Clear all cache keys matching pattern
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'DB proxy server is running', cache_size: cache.size });
});

// Cache stats endpoint
app.get('/cache-stats', (req, res) => {
  res.json({ cache_size: cache.size, max_cache: 1000 });
});

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  console.error('NEON_DATABASE_URL not set');
  process.exit(1);
}

// ============================================================
// CONNECTION POOLING - Optimized for performance
// ============================================================
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 25, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 20000, // Timeout for new connections (increased)
  statement_timeout: 60000, // Query timeout 60s
  keepAlive: true,
});

// Test database connection and create inspection_templates table if needed
// Prepare SQL used for initial table creation
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS public.inspection_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_type TEXT NOT NULL CHECK (template_type IN ('security', 'equipment', 'comfort', 'cleanliness')),
    item_name TEXT NOT NULL,
    _key TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_inspection_templates_template_type ON public.inspection_templates(template_type);
  CREATE INDEX IF NOT EXISTS idx_inspection_templates_is_active ON public.inspection_templates(is_active);
`;

const createRentalOptionsSQL = `
  CREATE TABLE IF NOT EXISTS public.rental_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    _key TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_rental_options_category ON public.rental_options(category);
  CREATE INDEX IF NOT EXISTS idx_rental_options_is_active ON public.rental_options(is_active);
`;

// Initialize DB connection with retry loop so dev server keeps attempting to reconnect
let dbReady = false;

const initDb = async () => {
  while (true) {
    try {
      const r = await pool.query('SELECT NOW()');
      console.log('Database connected successfully');

      // Ensure required tables exist
      try {
        await pool.query(createTableSQL);
        console.log('inspection_templates table ready');
      } catch (e) {
        console.error('Error creating inspection_templates table:', e.message || e);
      }

      try {
        await pool.query(createRentalOptionsSQL);
        console.log('rental_options table ready');
      } catch (e) {
        console.error('Error creating rental_options table:', e.message || e);
      }

      dbReady = true;
      break;
    } catch (err) {
      console.error('Database connection failed:', err && err.message ? err.message : err);
      console.error('Error code:', err && err.code ? err.code : 'N/A');
      console.error('Stack:', err && err.stack ? err.stack : 'N/A');
      // Mask connection string when logging
      try {
        const masked = connectionString.replace(/(postgresql:\/\/)([^:@]+):([^@]+)@/, '$1$2:*****@');
        console.error('DB connection string (masked):', masked);
      } catch (e) {}
      console.error('Retrying in 5 seconds...');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
};

// Middleware: if DB not ready, return 503 for API routes (allow /health)
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/cache-stats') return next();
  if (!dbReady && req.path.startsWith('/api')) {
    return res.status(503).json({ data: null, error: { message: 'Database not ready. Try again shortly.' } });
  }
  next();
});

function isSafeIdentifier(id) {
  return /^[a-zA-Z0-9_]+$/.test(id);
}

function toSnakeCase(key) {
  if (!key || typeof key !== 'string') return key;
  if (key.includes('_')) return key;
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function buildInsertQuery(table, rows) {
  // Normalize keys (camelCase -> snake_case) to match DB columns
  const normalizedRows = rows.map(r => {
    const nr = {};
    Object.entries(r).forEach(([k, v]) => {
      const nk = toSnakeCase(k);
      nr[nk] = v;
    });
    return nr;
  });
  const cols = Object.keys(normalizedRows[0]);
  const colList = cols.map((c) => `"${c}"`).join(', ');
  const values = [];
  // JSON fields - convert objects to JSON strings (do NOT include Postgres TEXT[] fields)
  const jsonFields = ['options', 'temp_options', 'inspection_items', 'rental_options', 'security', 'equipment', 'comfort', 'cleanliness', 'inspection_data'];
  // Array fields in database (Postgres TEXT[] columns) - these should stay as JS arrays so pg sends them as SQL arrays
  const arrayFields = ['exterior_photos', 'interior_photos', 'document_images'];
  
  const groups = normalizedRows.map((r, i) => {
    const g = cols.map((c, j) => {
      let val = r[c];
      
      // Skip if undefined or null
      if (val === undefined || val === null) {
        values.push(val);
        return `$${i * cols.length + j + 1}`;
      }
      
      // Convert complex types
      if (typeof val === 'object') {
        if (arrayFields.includes(c) && Array.isArray(val)) {
          // Keep arrays as-is for ARRAY type columns
          values.push(val);
        } else {
          // Convert objects and arrays to JSON strings
          try {
            val = JSON.stringify(val);
          } catch (e) {
            val = '{}';
          }
          values.push(val);
        }
      } else {
        values.push(val);
      }
      
      return `$${i * cols.length + j + 1}`;
    });
    return `(${g.join(', ')})`;
  });
  const text = `INSERT INTO "${table}" (${colList}) VALUES ${groups.join(', ')} RETURNING *`;
  return { text, values };
}

function buildUpdateQuery(table, data, whereCol) {
  // Normalize keys to snake_case
  const normalizedData = {};
  Object.entries(data).forEach(([k, v]) => { normalizedData[toSnakeCase(k)] = v; });
  const cols = Object.keys(normalizedData);
  const setList = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
  const values = cols.map((c) => normalizedData[c]);
  const text = `UPDATE "${table}" SET ${setList} WHERE "${toSnakeCase(whereCol)}" = $${cols.length + 1} RETURNING *`;
  return { text, values };
}

app.post('/api/from/:table/select', async (req, res) => {
  const table = req.params.table;
  const { columns = '*', order, limit, filters, where } = req.body || {};
  if (!isSafeIdentifier(table)) return res.status(400).json({ data: null, error: { message: 'Invalid table' } });
  
  try {
    // Merge where and filters (where takes precedence)
    const finalFilters = where ? { [where.col]: where.val } : (filters || {});
    
    // Generate cache key
    const cacheKey = `select:${table}:${columns}:${JSON.stringify(order)}:${limit}:${JSON.stringify(finalFilters)}`;
    
    // Check cache first for cacheable queries
    const config = CACHE_CONFIG[table];
    if (config && Object.keys(finalFilters).length === 0) { // Only cache queries without filters
      const cached = getFromCache(cacheKey);
      if (cached) {
        console.log(`[CACHE HIT] ${table}`);
        return res.json({ data: cached, error: null, cached: true });
      }
    }
    
    let q = `SELECT ${columns === '*' ? columns : columns.split(',').map(c => `"${c.trim()}"`).join(', ')} FROM "${table}"`;
    let params = [];
    
    // Add WHERE clause if filters/where provided
    if (finalFilters && typeof finalFilters === 'object' && Object.keys(finalFilters).length > 0) {
      const whereClausesArray = [];
      let paramIndex = 1;
      
      Object.entries(finalFilters).forEach(([col, val]) => {
        if (Array.isArray(val)) {
          const placeholders = val.map(() => `$${paramIndex++}`).join(',');
          whereClausesArray.push(`"${col}" IN (${placeholders})`);
          params.push(...val);
        } else {
          whereClausesArray.push(`"${col}" = $${paramIndex++}`);
          params.push(val);
        }
      });
      
      q += ` WHERE ${whereClausesArray.join(' AND ')}`;
    }
    
    // Add ORDER BY clause if specified
    if (order && order.column && isSafeIdentifier(order.column)) {
      const dir = order.ascending ? 'ASC' : 'DESC';
      q += ` ORDER BY "${order.column}" ${dir}`;
    }
    
    // Add LIMIT clause if specified
    if (limit && !isNaN(limit)) {
      const safeLimit = Math.max(1, Math.min(parseInt(limit), 10000));
      q += ` LIMIT ${safeLimit}`;
    }
    
    const start = Date.now();
    const r = await pool.query(q, params);
    const duration = Date.now() - start;
    
    console.log(`[SELECT] ${table}: ${duration}ms (${r.rowCount} rows)`);
    
    // Cache the result if applicable
    if (config && Object.keys(finalFilters).length === 0 && r.rowCount > 0) {
      setInCache(cacheKey, r.rows, config.ttl);
    }
    
    res.json({ data: r.rows, error: null, duration_ms: duration });
  } catch (err) {
    console.error(`[SELECT ERROR] ${table}:`, err.message);
    console.error('Full query:', req.body);
    console.error('Stack:', err.stack);
    res.status(500).json({ data: null, error: { message: err.message || 'Database error', table, columns: req.body?.columns } });
  }
});

app.post('/api/from/:table/insert', async (req, res) => {
  const table = req.params.table;
  const { rows } = req.body || {};
  if (!isSafeIdentifier(table)) return res.status(400).json({ data: null, error: { message: 'Invalid table' } });
  if (!rows || !Array.isArray(rows) || rows.length === 0) return res.json({ data: [], error: null });
  try {
    const { text, values } = buildInsertQuery(table, rows);
    const start = Date.now();
    const r = await pool.query(text, values);
    const duration = Date.now() - start;
    
    console.log(`[INSERT] ${table}: Inserted ${r.rowCount} rows in ${duration}ms`);
    
    // Invalidate cache for this table
    clearCache(table);
    
    res.json({ data: r.rows, error: null, duration_ms: duration });
  } catch (err) {
    console.error(`[INSERT ERROR] ${table}:`, err.message);
    console.error(`[INSERT ERROR DETAILS]`, {
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      position: err.position,
      where: err.where
    });
    res.status(500).json({ data: null, error: { message: err.message || err } });
  }
});

app.post('/api/from/:table/update', async (req, res) => {
  const table = req.params.table;
  const { data, where } = req.body || {};
  if (!isSafeIdentifier(table)) return res.status(400).json({ data: null, error: { message: 'Invalid table' } });
  if (!data || !where || !where.col) return res.status(400).json({ data: null, error: { message: 'Invalid payload' } });
  try {
    const { text, values } = buildUpdateQuery(table, data, where.col);
    const start = Date.now();
    const r = await pool.query(text, [...values, where.val]);
    const duration = Date.now() - start;
    
    console.log(`[UPDATE] ${table}: Updated ${r.rowCount} rows in ${duration}ms`);
    
    // Invalidate cache for this table
    clearCache(table);
    
    res.json({ data: r.rows, error: null, duration_ms: duration });
  } catch (err) {
    console.error(`[UPDATE ERROR] ${table}:`, err.message);
    res.status(500).json({ data: null, error: { message: err.message || err } });
  }
});

app.post('/api/from/:table/upsert', async (req, res) => {
  const table = req.params.table;
  const { rows, onConflict = 'id' } = req.body || {};
  
  console.log(`[UPSERT REQUEST] Table: ${table}, OnConflict: ${onConflict}, Rows: ${rows?.length || 0}`);
  
  if (!isSafeIdentifier(table)) {
    console.error(`[UPSERT ERROR] Invalid table identifier: ${table}`);
    return res.status(400).json({ data: null, error: { message: 'Invalid table' } });
  }
  
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.json({ data: [], error: null });
  }
  
  try {
    // Normalize row keys (camelCase -> snake_case)
    const normalizedRows = rows.map(r => {
      const nr = {};
      Object.entries(r).forEach(([k, v]) => { nr[toSnakeCase(k)] = v; });
      return nr;
    });
    const cols = Object.keys(normalizedRows[0]);
    // JSON fields - objects/dicts that should be JSON stringified (snake_case)
    const jsonFields = ['options', 'temp_options', 'inspection_items', 'rental_options', 'security', 'equipment', 'comfort', 'cleanliness', 'inspection_data', 'activation_log', 'termination_log'];
    // Array fields - stay as-is for PostgreSQL ARRAY type
    const arrayFields = ['exterior_photos', 'interior_photos', 'document_images'];
    
    // Validate onConflict column exists
    if (!cols.includes(onConflict) && onConflict !== 'id') {
      console.warn(`[UPSERT] Column "${onConflict}" not in data, using "id" instead`);
    }
    
    const conflictCol = cols.includes(onConflict) ? toSnakeCase(onConflict) : 'id';
    const colList = cols.map((c) => `"${c}"`).join(', ');
    const values = [];
    const groups = normalizedRows.map((r, i) => {
      const g = cols.map((c, j) => {
        let val = r[c];
        
        // Handle JSON fields (objects/dicts)
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          if (jsonFields.includes(c)) {
            try {
              val = typeof val === 'string' ? val : JSON.stringify(val);
            } catch (e) {
              console.warn(`Failed to stringify JSON field ${c}:`, e);
              val = '{}';
            }
          }
        }
        // Handle array fields - PostgreSQL expects them as arrays
        else if (Array.isArray(val) && !arrayFields.includes(c)) {
          // This is an array but should not be an array field - stringify it as JSON
          if (jsonFields.includes(c)) {
            try {
              val = JSON.stringify(val);
            } catch (e) {
              console.warn(`Failed to stringify array as JSON field ${c}:`, e);
              val = '[]';
            }
          }
        }
        // Arrays stay as arrays for ARRAY type columns
        
        values.push(val);
        return `$${i * cols.length + j + 1}`;
      });
      return `(${g.join(', ')})`;
    });
    
    // Build ON CONFLICT clause - only update columns that exist
    const updateCols = cols.filter(c => c !== conflictCol).map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');
    const text = `INSERT INTO "${table}" (${colList}) VALUES ${groups.join(', ')} ON CONFLICT ("${conflictCol}") DO UPDATE SET ${updateCols} RETURNING *`;
    
    const start = Date.now();
    const r = await pool.query(text, values);
    const duration = Date.now() - start;
    
    console.log(`[UPSERT SUCCESS] ${table}: Upserted ${r.rowCount} rows in ${duration}ms`);
    
    // Invalidate cache for this table
    clearCache(table);
    
    res.json({ data: r.rows, error: null, duration_ms: duration });
  } catch (err) {
    console.error(`[UPSERT ERROR] ${table}:`, err.message, err.code);
    res.status(500).json({ data: null, error: { message: err.message || 'Upsert failed' } });
  }
});

app.post('/api/from/:table/delete', async (req, res) => {
  const table = req.params.table;
  const { where } = req.body || {};
  if (!isSafeIdentifier(table)) return res.status(400).json({ data: null, error: { message: 'Invalid table' } });
  if (!where || !where.col) return res.status(400).json({ data: null, error: { message: 'Invalid payload' } });
  try {
    const text = `DELETE FROM "${table}" WHERE "${where.col}" = $1 RETURNING *`;
    const start = Date.now();
    const r = await pool.query(text, [where.val]);
    const duration = Date.now() - start;
    
    console.log(`[DELETE] ${table}: Deleted ${r.rowCount} rows in ${duration}ms`);
    
    // Invalidate cache for this table
    clearCache(table);
    
    res.json({ data: r.rows, error: null, duration_ms: duration });
  } catch (err) {
    console.error(`[DELETE ERROR] ${table}:`, err.message);
    res.status(500).json({ data: null, error: { message: err.message || err } });
  }
});

// Minimal auth endpoints
app.post('/api/batch/update', async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ data: null, error: { message: 'Invalid updates array' } });
  }

  try {
    const results = [];
    const jsonFields = ['options', 'document_images', 'temp_options', 'inspection_items', 'rental_options', 'security', 'equipment', 'comfort', 'cleanliness', 'inspection_data', 'activation_log', 'termination_log'];
    
    for (const update of updates) {
      const { table, id, data } = update;
      if (!isSafeIdentifier(table) || !id || !data) continue;

      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(data).forEach(([rawCol, rawVal]) => {
        const col = toSnakeCase(rawCol);
        let val = rawVal;
        if (!isSafeIdentifier(col)) return;

        // Handle JSON fields (now in snake_case)
        if (typeof val === 'object' && val !== null && !Array.isArray(val) && jsonFields.includes(col)) {
          try {
            val = JSON.stringify(val);
          } catch (e) {
            val = '{}';
          }
        }

        setClauses.push(`"${col}" = $${paramIndex++}`);
        values.push(val);
      });

      if (setClauses.length === 0) continue;

      values.push(id);
      const q = `UPDATE "${table}" SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      const r = await pool.query(q, values);
      results.push({ table, id, success: r.rowCount > 0, data: r.rows[0] });
    }

    console.log(`[BATCH UPDATE] ${updates.length} updates processed`);
    res.json({ data: results, error: null });
  } catch (err) {
    console.error('[BATCH UPDATE ERROR]:', err.message);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ data: null, error: { message: 'Email required' } });
  try {
    const r = await pool.query('SELECT id, email FROM public.admin_security WHERE email = $1 LIMIT 1', [email]);
    if (r.rowCount === 0) return res.json({ data: null, error: { message: 'Invalid credentials' } });
    const user = { id: r.rows[0].id, email: r.rows[0].email };
    return res.json({ data: { user }, error: null });
  } catch (err) {
    return res.json({ data: null, error: { message: err.message || err } });
  }
});

app.post('/api/auth/signout', async (req, res) => {
  // client handles signout locally; server keeps this for compatibility
  res.json({ data: null, error: null });
});

// Global error handler - always return JSON
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ data: null, error: { message: err.message || 'Internal server error' } });
});

const port = process.env.PORT || 4000;
initDb()
  .then(() => {
    app.listen(port, () => console.log(`DB proxy server listening on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('Failed to initialize DB:', err);
    // Start server anyway so frontend can still run; endpoints will return 500 until DB connects.
    app.listen(port, () => console.log(`DB proxy server listening on http://localhost:${port} (DB init failed)`));
  });
