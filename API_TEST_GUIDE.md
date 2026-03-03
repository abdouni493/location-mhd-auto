# Test API Endpoints

Open your browser console (F12) and run these commands one by one:

## 1. Test GET /api/templates (should return array or empty)
```javascript
fetch('http://localhost:4000/api/templates')
  .then(r => {
    console.log('Status:', r.status);
    console.log('Headers:', r.headers);
    return r.text();
  })
  .then(text => {
    console.log('Response:', text);
    try {
      console.log('Parsed:', JSON.parse(text));
    } catch(e) {
      console.log('Not valid JSON:', e.message);
    }
  })
  .catch(e => console.error('Error:', e));
```

## 2. Test GET /api/templates with category filter
```javascript
fetch('http://localhost:4000/api/templates?category=engagement')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e));
```

## 3. Check server is running
```javascript
fetch('http://localhost:4000/health')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error('Server not responding:', e));
```

## 4. Try to save a template
```javascript
fetch('http://localhost:4000/api/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Template',
    category: 'engagement',
    elements: [],
    canvasWidth: 800,
    canvasHeight: 1100
  })
})
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(d => console.log('Response:', d))
  .catch(e => console.error('Error:', e));
```

---

## Expected Results:

✅ GET should return: `{ data: [...], error: null }`
✅ POST should return: `{ data: {...}, error: null }`
✅ If table doesn't exist: `{ data: [], error: null, message: '...' }`

If you get:
- ❌ 404 status → endpoint not registered
- ❌ Connection refused → server not running
- ❌ CORS error → need to add Access-Control headers

Share the console output and I'll fix it!
