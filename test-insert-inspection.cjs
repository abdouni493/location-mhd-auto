const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_bOsfDgNWA5c1@ep-dark-sky-aiqm294x-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function testInsert() {
  try {
    console.log('\n=== Testing inspection insert ===\n');
    
    // Get an existing reservation ID
    const resRes = await pool.query('SELECT id FROM reservations LIMIT 1');
    if (resRes.rows.length === 0) {
      console.log('❌ No reservations found. Create one first!');
      return;
    }
    
    const reservationId = resRes.rows[0].id;
    console.log(`Using reservation ID: ${reservationId}`);
    
    // Try to insert an inspection
    const inspection = {
      reservation_id: reservationId,
      type: 'depart',
      date: '2025-01-17',
      mileage: 50000,
      fuel: 'plein',
      security: { airbags: true, locks: true },
      equipment: { jack: true, spare_tire: true },
      comfort: { air_conditioning: true },
      cleanliness: { exterior: 8, interior: 9 },
      exterior_photos: ['photo1.jpg', 'photo2.jpg'],
      interior_photos: ['photo3.jpg'],
      signature: 'signature.png',
      notes: 'Test inspection'
    };
    
    const result = await pool.query(`
      INSERT INTO inspections (
        reservation_id, type, date, mileage, fuel, security, equipment, 
        comfort, cleanliness, exterior_photos, interior_photos, signature, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      inspection.reservation_id,
      inspection.type,
      inspection.date,
      inspection.mileage,
      inspection.fuel,
      JSON.stringify(inspection.security),
      JSON.stringify(inspection.equipment),
      JSON.stringify(inspection.comfort),
      JSON.stringify(inspection.cleanliness),
      inspection.exterior_photos,
      inspection.interior_photos,
      inspection.signature,
      inspection.notes
    ]);
    
    console.log('✅ Inspection inserted successfully!');
    console.log('Result:', result.rows[0].id);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Code:', err.code);
    console.error('Detail:', err.detail);
  } finally {
    await pool.end();
  }
}

testInsert();
