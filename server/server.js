import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { pool, testConnection } from '../lib/db-fallback.js';

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

// CORS configuration - Allow Vercel and local development
const corsOptions = {
  origin: [
    'https://location-mhd-auto.vercel.app',
    'https://location-mhd-auto-git-main-youssefs-projects-87b30820.vercel.app',
    'https://location-mhd-auto-nz1bhmsdd-youssefs-projects-87b30820.vercel.app',
    'https://location-mhd-auto-llcis11op-youssefs-projects-87b30820.vercel.app',
    'https://location-mhd-auto.fly.dev',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
  maxAge: 86400
};

// Apply CORS globally - MUST be before routes
app.use(cors(corsOptions));

// Handle preflight (OPTIONS) requests for all routes using middleware
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.header('Access-Control-Max-Age', '86400');
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb' }));

// ============================================================
// CACHING LAYER - In-memory cache for frequently accessed data
// ============================================================
const cache = new Map();
const CACHE_CONFIG = {
  customers: { ttl: 5 * 60 * 1000, maxSize: 50 }, // 5 min, max 50 cached queries
  vehicles: { ttl: 5 * 60 * 1000, maxSize: 50 }, // 5 min, max 50 cached queries
  agencies: { ttl: 15 * 60 * 1000, maxSize: 20 }, // 15 min, max 20 cached queries
  workers: { ttl: 5 * 60 * 1000, maxSize: 30 }, // 5 min, max 30 cached queries
  reservations: { ttl: 2 * 60 * 1000, maxSize: 30 }, // 2 min, max 30 (changes frequently)
  dashboard: { ttl: 1 * 60 * 1000, maxSize: 10 } // 1 min, max 10 (real-time)
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

// Use shared pool from lib/db.js (centralized configuration)

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
  let retryCount = 0;
  const maxRetries = 60; // Try for 5 minutes
  
  while (retryCount < maxRetries) {
    try {
      const r = await testConnection(5);
      console.log('✅ Database connected successfully', r);

      // Ensure required tables exist
      try {
        await pool.query(createTableSQL);
        console.log('✅ inspection_templates table ready');
      } catch (e) {
        console.warn('⚠️ Error creating inspection_templates table:', e.message || e);
      }

      try {
        await pool.query(createRentalOptionsSQL);
        console.log('✅ rental_options table ready');
      } catch (e) {
        console.warn('⚠️ Error creating rental_options table:', e.message || e);
      }

      dbReady = true;
      console.log('✅ DATABASE INITIALIZATION COMPLETE');
      break;
    } catch (err) {
      retryCount++;
      const elapsedSeconds = retryCount * 5;
      console.error(`❌ [${elapsedSeconds}s] Database connection failed (attempt ${retryCount}/${maxRetries}):`, err && err.message ? err.message : err);
      
      if (err && err.code) {
        console.error('   Error code:', err.code);
      }
      if (retryCount % 2 === 0) {
        console.error('   Note: Check that NEON_DATABASE_URL env var is set correctly');
      }
      
      if (retryCount < maxRetries) {
        console.log('   Retrying in 5 seconds...');
        await new Promise((r) => setTimeout(r, 5000));
      } else {
        console.error('❌ Max retries reached. Server will continue without database.');
        dbReady = false;
        break;
      }
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
    
    // ============================================================
    // OPTIMIZATION: For vehicles table, exclude heavy columns
    // ============================================================
    let selectedColumns = columns;
    if (table === 'customers' && columns === '*') {
      // Fetch essential + critical display columns (EXCLUDE document_images only)
      selectedColumns = 'id, first_name, last_name, phone, email, wilaya, address, license_number, license_expiry, profile_picture, total_reservations, total_spent, document_left_at_store, document_number, created_at';
    } else if (table === 'vehicles' && columns === '*') {
      // For vehicles, INCLUDE main_image (required for display), EXCLUDE secondary_images (heavy array)
      selectedColumns = 'id, brand, model, year, immatriculation, color, fuel_type, transmission, seats, daily_rate, weekly_rate, monthly_rate, status, current_location, mileage, created_at, main_image';
    }
    
    // Generate cache key (use normalized column selection)
    const cacheKey = `select:${table}:${selectedColumns}:${JSON.stringify(order)}:${limit}:${JSON.stringify(finalFilters)}`;
    
    // Check cache first for cacheable queries
    const config = CACHE_CONFIG[table];
    if (config && Object.keys(finalFilters).length === 0) { // Only cache queries without filters
      const cached = getFromCache(cacheKey);
      if (cached) {
        console.log(`[CACHE HIT] ${table}`);
        return res.json({ data: cached, error: null, cached: true });
      }
    }
    
    let q = `SELECT ${selectedColumns === '*' ? selectedColumns : selectedColumns.split(',').map(c => `"${c.trim()}"`).join(', ')} FROM "${table}"`;
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
    
    // Add LIMIT clause if specified (or default to 500 for safety)
    if (limit && !isNaN(limit)) {
      const safeLimit = Math.max(1, Math.min(parseInt(limit), 1000));
      q += ` LIMIT ${safeLimit}`;
    } else {
      // Default limit to prevent fetching too many rows and exhausting memory
      q += ` LIMIT 100`;
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
    console.log(`[INSERT REQUEST] table=${table}, rowCount=${rows.length}, firstRow:`, JSON.stringify(rows[0]).substring(0, 200));
    
    // For workers, clean up blob URLs and invalid photo data
    const cleanedRows = rows.map(row => {
      const cleanRow = { ...row };
      if (table === 'workers' && cleanRow.photo) {
        // Remove blob URLs or invalid photo data
        if (cleanRow.photo.startsWith('blob:') || cleanRow.photo === 'null' || cleanRow.photo === '') {
          delete cleanRow.photo;
        }
      }
      return cleanRow;
    });
    
    console.log(`[INSERT PROCESSING] table=${table}, rowCount=${cleanedRows.length}`);
    
    const { text, values } = buildInsertQuery(table, cleanedRows);
    console.log(`[INSERT QUERY] ${text.substring(0, 150)}...`);
    
    const start = Date.now();
    const r = await pool.query(text, values);
    const duration = Date.now() - start;
    
    console.log(`[INSERT SUCCESS] ${table}: Inserted ${r.rowCount} rows in ${duration}ms`);
    
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
    // For workers, clean photo data
    const cleanData = { ...data };
    if (table === 'workers' && cleanData.photo) {
      // Remove blob URLs or invalid photo data
      if (cleanData.photo.startsWith('blob:') || cleanData.photo === 'null' || cleanData.photo === '') {
        delete cleanData.photo;
      }
    }
    
    console.log(`[UPDATE PROCESSING] table=${table}, where=${JSON.stringify(where)}, dataKeys=${Object.keys(cleanData)}`);
    
    const { text, values } = buildUpdateQuery(table, cleanData, where.col);
    console.log(`[UPDATE QUERY] ${text.substring(0, 200)}...`);
    console.log(`[UPDATE VALUES] ${values.map(v => typeof v === 'string' ? v.substring(0, 50) : v).join(', ')}`);
    
    const start = Date.now();
    const r = await pool.query(text, [...values, where.val]);
    const duration = Date.now() - start;
    
    console.log(`[UPDATE SUCCESS] ${table}: Updated ${r.rowCount} rows in ${duration}ms`);
    
    // Invalidate cache for this table
    clearCache(table);
    
    res.json({ data: r.rows, error: null, duration_ms: duration });
  } catch (err) {
    console.error(`[UPDATE ERROR] ${table}:`, err.message);
    console.error(`[UPDATE ERROR DETAILS]`, {
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      position: err.position
    });
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
    
    // Try to refresh materialized views if applicable (non-critical, ignore errors)
    if (table === 'customers') {
      try {
        // Use non-concurrent refresh to avoid conflicts
        pool.query('REFRESH MATERIALIZED VIEW customers_dashboard_view').catch(e => {
          console.warn(`[WARN] Could not refresh dashboard view:`, e.message);
        });
      } catch (e) {
        // Silently ignore view refresh errors - they're not critical
      }
    }
    
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

// ============================================================
// DOCUMENT TEMPLATES API ENDPOINTS
// ============================================================

// Get all templates or filter by category
// ============================================================
// OPTIMIZED CUSTOMER LIST API - Fast pagination with caching
// ============================================================
app.get('/api/customers/list', async (req, res) => {
  const page = parseInt(req.query.page || '0');
  const limit = Math.min(parseInt(req.query.limit || '50'), 200); // Max 200 per page
  const offset = page * limit;
  const cacheKey = `customers_list_${page}_${limit}`;
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] customers list page ${page}`);
    return res.json(cached);
  }
  
  try {
    const start = Date.now();
    
    // Fast query using index
    const result = await pool.query(`
      SELECT 
        id, first_name, last_name, phone, email, profile_picture,
        COALESCE(total_reservations, 0) as total_reservations, 
        COALESCE(total_spent, 0) as total_spent, 
        document_left_at_store,
        id_card_number, document_number, wilaya, address,
        license_number, license_expiry, license_issue_date, license_issue_place,
        birthday, birth_place, document_type, document_delivery_date,
        document_delivery_address, document_expiry_date, document_images,
        created_at
      FROM public.customers 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM public.customers');
    const total = parseInt(countResult.rows[0].total);
    
    const response = {
      data: result.rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      duration_ms: Date.now() - start
    };
    
    // Cache the result
    setInCache(cacheKey, response, CACHE_CONFIG.customers.ttl);
    
    console.log(`[SELECT] customers page ${page}: ${result.rows.length} rows in ${response.duration_ms}ms`);
    res.json(response);
  } catch (err) {
    console.error('[CUSTOMERS LIST ERROR]:', err.message);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.get('/api/templates', async (req, res) => {
  try {
    const { category } = req.query;
    
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'document_templates'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({ data: [], error: null, message: 'Templates table not initialized. Run SQL_TEMPLATES_COMPLETE.sql' });
    }
    
    let query = 'SELECT * FROM public.document_templates ORDER BY is_default DESC, created_at DESC';
    let params = [];

    if (category) {
      query = 'SELECT * FROM public.document_templates WHERE category = $1 ORDER BY is_default DESC, created_at DESC';
      params = [category];
    }

    const result = await pool.query(query, params);
    res.json({ data: result.rows, error: null });
  } catch (err) {
    console.error('[TEMPLATES GET ERROR]:', err.message);
    res.json({ data: [], error: null }); // Return empty array instead of error
  }
});

// Get single template by ID
app.get('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM public.document_templates WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ data: null, error: { message: 'Template not found' } });
    }
    res.json({ data: result.rows[0], error: null });
  } catch (err) {
    console.error('[TEMPLATES GET BY ID ERROR]:', err.message);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// Save/Create new template
app.post('/api/templates', async (req, res) => {
  try {
    const { name, category, elements, canvasWidth, canvasHeight, description } = req.body;

    if (!name || !category || !elements) {
      return res.status(400).json({ data: null, error: { message: 'Missing required fields: name, category, elements' } });
    }

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'document_templates'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.status(400).json({ 
        data: null, 
        error: { message: 'Templates table not initialized. Run SQL_TEMPLATES_COMPLETE.sql in your database first.' } 
      });
    }

    const result = await pool.query(
      `INSERT INTO public.document_templates (name, category, elements, canvas_width, canvas_height, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, category, JSON.stringify(elements), canvasWidth || 800, canvasHeight || 1100, description || '']
    );

    clearCache('templates');
    res.json({ data: result.rows[0], error: null });
  } catch (err) {
    console.error('[TEMPLATES CREATE ERROR]:', err.message);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// Update existing template
app.put('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, elements, canvasWidth, canvasHeight, description } = req.body;

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'document_templates'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.status(400).json({ 
        data: null, 
        error: { message: 'Templates table not initialized' } 
      });
    }

    const result = await pool.query(
      `UPDATE public.document_templates 
       SET name = $1, category = $2, elements = $3, canvas_width = $4, canvas_height = $5, description = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, category, JSON.stringify(elements), canvasWidth, canvasHeight, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ data: null, error: { message: 'Template not found' } });
    }

    clearCache('templates');
    res.json({ data: result.rows[0], error: null });
  } catch (err) {
    console.error('[TEMPLATES UPDATE ERROR]:', err.message);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// Delete template
app.delete('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'document_templates'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.status(400).json({ 
        data: null, 
        error: { message: 'Templates table not initialized' } 
      });
    }
    
    const result = await pool.query('DELETE FROM public.document_templates WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ data: null, error: { message: 'Template not found' } });
    }

    clearCache('templates');
    res.json({ data: result.rows[0], error: null });
  } catch (err) {
    console.error('[TEMPLATES DELETE ERROR]:', err.message);
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

// Start HTTP server immediately so frontend can reach API even while DB init retries
// Listen on 0.0.0.0 to accept connections from any interface (required for Fly.io, Render, Heroku)
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`\n🚀 Server started on http://0.0.0.0:${port} (Fly.io port: ${port})`);
  console.log(`📊 Endpoints ready at https://location-mhd-auto.fly.dev`);
  console.log(`⏳ Initializing database connection...\n`);
});

// Initialize DB in background (will retry until connected)
// DO NOT wait for this - server should be responsive even if DB init is pending
initDb()
  .then(() => {
    console.log('\n✅ Database initialization complete. API fully operational.\n');
  })
  .catch((err) => {
    console.error('\n❌ Database initialization failed:', err);
    console.error('⚠️  Server running but API endpoints will return 503 until database is available.\n');
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n📢 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n📢 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});
