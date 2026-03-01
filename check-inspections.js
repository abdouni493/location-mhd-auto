const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:abcdef@ep-holy-sunset-a5xoxkik-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function check() {
  try {
    console.log('\n=== Checking inspections table schema ===\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'inspections'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ inspections table does not exist or has no columns!');
    } else {
      console.log('✅ Inspections table columns:');
      result.rows.forEach(col => {
        const nullable = col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE';
        console.log(`   ${col.column_name}: ${col.data_type} (${nullable})`);
      });
    }
    
    // Try to see the table definition
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'inspections'
      );
    `);
    
    console.log(`\nTable exists: ${tableCheck.rows[0].exists}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
