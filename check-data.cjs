const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_bOsfDgNWA5c1@ep-dark-sky-aiqm294x-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function check() {
  try {
    console.log('\n=== Checking reservations ===\n');
    
    const result = await pool.query(`
      SELECT id, customer_id, vehicle_id, start_date, status
      FROM reservations
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`Found ${result.rows.length} reservations:`);
    result.rows.forEach(row => {
      console.log(`  ${row.id.substring(0, 8)}... | Customer: ${row.customer_id.substring(0, 8)}... | Vehicle: ${row.vehicle_id.substring(0, 8)}... | Status: ${row.status}`);
    });
    
    console.log('\n=== Checking customers ===\n');
    const custResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    console.log(`Total customers: ${custResult.rows[0].count}`);
    
    console.log('\n=== Checking vehicles ===\n');
    const vehResult = await pool.query('SELECT COUNT(*) as count FROM vehicles');
    console.log(`Total vehicles: ${vehResult.rows[0].count}`);
    
    console.log('\n=== Checking inspections ===\n');
    const inspResult = await pool.query(`
      SELECT id, reservation_id, type, date
      FROM inspections
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log(`Found ${inspResult.rows.length} inspections:`);
    inspResult.rows.forEach(row => {
      console.log(`  ${row.id.substring(0, 8)}... | Reservation: ${row.reservation_id?.substring(0, 8)}... | Type: ${row.type} | Date: ${row.date}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
