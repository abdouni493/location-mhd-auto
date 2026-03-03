const fetch_module = await import('node-fetch');
const fetch = fetch_module.default;

async function testInsert() {
  try {
    console.log('\n=== Testing POST /api/from/inspections/insert ===\n');
    
    const inspection = {
      reservation_id: '90a870f2-59f3-45c2-812f-eb2ac945d0bb',
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
    
    const response = await fetch('http://localhost:4000/api/from/inspections/insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: [inspection] })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Inspection inserted successfully!');
      console.log('Response:', JSON.stringify(data, null, 2).substring(0, 200));
    } else {
      console.log('❌ Server error:', response.status);
      console.log('Error:', JSON.stringify(data, null, 2));
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testInsert();
