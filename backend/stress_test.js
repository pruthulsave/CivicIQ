const BASE_URL = 'http://localhost:5000/api';

async function testBackend() {
  console.log('--- Starting Backend Stress Test ---');
  let successCount = 0;
  let failCount = 0;

  const handleResult = async (name, promise) => {
    try {
      const res = await promise;
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      console.log(`[PASS] ${name} - Status: ${res.status}`);
      successCount++;
      return res;
    } catch (err) {
      console.error(`[FAIL] ${name} - ${err.message}`);
      failCount++;
      throw err;
    }
  };

  const fetchJson = (url, method = 'GET', body = null) => {
    const options = { method, headers: {} };
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    return fetch(url, options);
  };

  // 1. GET /api/health
  await handleResult('Health Check', fetchJson(`${BASE_URL}/health`)).catch(() => {});

  // 2. GET /api/complaints
  await handleResult('Get Complaints', fetchJson(`${BASE_URL}/complaints`)).catch(() => {});

  // 3. POST /api/complaints (Valid payload)
  await handleResult('Submit Complaint (Valid)', fetchJson(`${BASE_URL}/complaints`, 'POST', {
    issueType: 'pothole',
    description: 'Test pothole',
    latitude: 19.1074,
    longitude: 72.8377,
    accuracy: 50.0
  })).catch(() => {});

  // 4. POST /api/complaints/precheck (Valid payload)
  await handleResult('Precheck Complaint (Valid)', fetchJson(`${BASE_URL}/complaints/precheck`, 'POST', {
    issueType: 'streetlight',
    description: 'Broken light',
    latitude: 12.9716,
    longitude: 77.5946
  })).catch(() => {});

  // 5. POST /api/complaints (Invalid payload - String coords)
  try {
    const res = await fetchJson(`${BASE_URL}/complaints`, 'POST', {
      issueType: 'garbage',
      description: 'Test garbage',
      latitude: '19.1074',
      longitude: '72.8377'
    });
    
    if (res.status === 400) {
      console.log(`[PASS] Submit Complaint (Invalid - Strings) - Status: 400`);
      successCount++;
    } else {
      console.error(`[FAIL] Submit Complaint (Invalid - Strings) - Status: ${res.status} (Expected 400)`);
      failCount++;
    }
  } catch (err) {
    console.error(`[FAIL] Submit Complaint (Invalid - Strings) - ${err.message}`);
    failCount++;
  }

  console.log('--- Test Complete ---');
  console.log(`Passed: ${successCount}, Failed: ${failCount}`);
  
  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testBackend();
