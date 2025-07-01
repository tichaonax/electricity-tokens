const fetch = require('node-fetch');

async function testAuth() {
  try {
    // Test if we can get the auth route
    const response = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('Auth endpoint status:', response.status);
    
    // Test if we can hit a simple API
    const dbResponse = await fetch('http://localhost:3000/api/db-status', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('DB status endpoint status:', dbResponse.status);
    if (dbResponse.ok) {
      const dbData = await dbResponse.text();
      console.log('DB response:', dbData);
    } else {
      const errorText = await dbResponse.text();
      console.log('DB error:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAuth();