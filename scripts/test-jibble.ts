/**
 * Test script for Jibble API connection
 * Run with: npx tsx scripts/test-jibble.ts
 * 
 * Make sure to set JIBBLE_CLIENT_ID and JIBBLE_CLIENT_SECRET in your environment
 */

const CLIENT_ID = process.env.JIBBLE_CLIENT_ID;
const CLIENT_SECRET = process.env.JIBBLE_CLIENT_SECRET;
const API_URL = process.env.JIBBLE_API_URL || 'https://workspace.prod.jibble.io';
const IDENTITY_URL = process.env.JIBBLE_IDENTITY_URL || 'https://identity.prod.jibble.io';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: JIBBLE_CLIENT_ID and JIBBLE_CLIENT_SECRET must be set');
  console.error('Please set them in your .env.local file or export them in your shell');
  process.exit(1);
}

async function testJibbleConnection() {
  try {
    console.log('Testing Jibble API connection...');
    console.log(`API URL: ${API_URL}`);
    console.log(`Client ID: ${CLIENT_ID.substring(0, 10)}...`);
    console.log('\nBased on Jibble API docs: https://docs.api.jibble.io/#1a15bb81-b2a0-41d3-bfee-bf52382d6988');
    console.log('Jibble uses OAuth 2.0 - exchanging Client ID/Secret for access token');
    
    // Step 1: Get OAuth access token
    // Based on Jibble API docs, token endpoint is on identity.prod.jibble.io
    console.log('\n1. Getting OAuth access token...');
    console.log(`   Token endpoint: ${IDENTITY_URL}/connect/token`);
    
    const tokenUrl = `${IDENTITY_URL}/connect/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'api1',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(
        `Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}\n` +
        `Response: ${errorText}`
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Access token obtained successfully!');
    console.log(`   Token type: ${tokenData.token_type}`);
    console.log(`   Expires in: ${tokenData.expires_in} seconds`);
    if (tokenData.organizationId) {
      console.log(`   Organization ID: ${tokenData.organizationId}`);
    }
    
    const accessToken = tokenData.access_token;
    
    // Step 2: Test API endpoint with the access token
    console.log('\n2. Testing API endpoints with access token...');
    console.log(`   Organization ID: ${tokenData.organizationId || 'N/A'}`);
    
    const organizationId = tokenData.organizationId;
    
    // Based on Jibble API documentation:
    // - Organizations: https://workspace.prod.jibble.io/v1/Organizations
    // - Activities: https://workspace.prod.jibble.io/v1/Activities
    // - People (Members): https://workspace.prod.jibble.io/v1/People
    const testEndpoints = [
      '/v1/Organizations',
      '/v1/People',
      '/v1/Activities',
    ];
    
    let apiResponse: Response | null = null;
    let workingEndpoint = '';
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`   Trying: ${API_URL}${endpoint}`);
        
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        };
        
        // Try with organization ID in header if we have it
        if (organizationId) {
          headers['X-Organization-Id'] = organizationId;
        }
        
        apiResponse = await fetch(`${API_URL}${endpoint}`, {
          headers,
        });
        
        if (apiResponse.ok) {
          workingEndpoint = endpoint;
          // Clone response to read it without consuming the body
          const clonedResponse = apiResponse.clone();
          const responseData = await clonedResponse.json().catch(() => null);
          const itemCount = Array.isArray(responseData) ? responseData.length : 
                           (responseData && typeof responseData === 'object' ? Object.keys(responseData).length : 0);
          console.log(`   ✅ Success with ${endpoint}${itemCount > 0 ? ` (${itemCount} items)` : ''}`);
          break;
        } else {
          const statusText = await apiResponse.text().catch(() => '');
          // Show more detail for 403 errors
          if (apiResponse.status === 403) {
            console.log(`      ${endpoint}: 403 unauthorized - ${statusText.substring(0, 100)}`);
          } else {
            console.log(`      ${endpoint}: ${apiResponse.status} ${statusText.substring(0, 80)}`);
          }
        }
      } catch (error: any) {
        console.log(`      ${endpoint}: Error - ${error.message}`);
        continue;
      }
    }

    if (!apiResponse || !apiResponse.ok) {
      console.log(`\n⚠️  API endpoint test failed`);
      console.log(`   Token obtained successfully, but endpoints returned errors`);
      console.log(`   This might indicate incorrect endpoint paths`);
      console.log('\n💡 Next steps:');
      console.log('   1. Check Jibble API documentation for correct endpoint paths');
      console.log('   2. Verify the API version and endpoint structure');
      return;
    }

    // Get the successful response data
    const clonedResponse = apiResponse.clone();
    const apiData = await clonedResponse.json();
    console.log('\n✅ API connection successful!');
    console.log(`   Token endpoint: ${IDENTITY_URL}/connect/token`);
    console.log(`   Working API endpoint: ${workingEndpoint}`);
    console.log(`📊 Response sample:`, JSON.stringify(apiData, null, 2).substring(0, 500));
    
    // Test other endpoints
    console.log('\n3. Testing other endpoints...');
    const otherEndpoints = testEndpoints.filter(e => e !== workingEndpoint);
    for (const endpoint of otherEndpoints) {
      try {
        const testResponse = await fetch(`${API_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          const count = Array.isArray(testData) ? testData.length : 'N/A';
          console.log(`   ✅ ${endpoint}: Success (${count} items)`);
        } else {
          const errorText = await testResponse.text().catch(() => '');
          console.log(`   ⚠️  ${endpoint}: ${testResponse.status} ${errorText.substring(0, 60)}`);
        }
      } catch (error: any) {
        console.log(`   ❌ ${endpoint}: Error - ${error.message}`);
      }
    }
    
  } catch (error: any) {
    console.error('\n❌ Error connecting to Jibble API:');
    console.error(error.message);
    
    if (error.message.includes('Failed to get access token')) {
      console.error('\n💡 Possible issues:');
      console.error('   - Client ID or Client Secret is incorrect');
      console.error('   - API URL might be different');
      console.error('   - OAuth endpoint path might be different');
      console.error('   - Check Jibble API documentation for correct authentication flow');
    }
    
    process.exit(1);
  }
}

testJibbleConnection();

