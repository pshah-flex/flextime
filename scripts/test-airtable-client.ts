/**
 * Test Airtable Client Data
 * 
 * Test pulling client data from Airtable for "111 Hospitality"
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env.local') });

import { fetchClientEmails } from '../app/lib/airtable';

async function main() {
  console.log('🧪 Testing Airtable Client Data for "111 Hospitality"\n');

  try {
    const clientEmail = 'paramdshah@gmail.com';
    const expectedGroupId = '0c04e7ff-ec5b-4bba-8951-a7b2b99c4af3';

    // Fetch clients from Airtable
    console.log('📋 Fetching clients from Airtable...');
    const airtableClients = await fetchClientEmails();
    console.log(`   ✅ Found ${airtableClients.length} clients in Airtable\n`);

    // Find the specific client
    const client = airtableClients.find(c => 
      c.email.toLowerCase() === clientEmail.toLowerCase()
    );

    if (!client) {
      console.error(`❌ Client with email ${clientEmail} not found in Airtable`);
      console.log('\nAvailable clients:');
      airtableClients.forEach(c => {
        console.log(`   - ${c.email} (Groups: ${c.jibbleGroupIds.join(', ') || 'None'})`);
      });
      process.exit(1);
    }

    console.log('📧 Client Details from Airtable:');
    console.log(`   Email: ${client.email}`);
    console.log(`   Record ID: ${client.recordId}`);
    console.log(`   Jibble Group IDs: ${client.jibbleGroupIds.length > 0 ? client.jibbleGroupIds.join(', ') : 'None'}\n`);

    // Verify the group ID matches
    if (client.jibbleGroupIds.includes(expectedGroupId)) {
      console.log(`   ✅ Group ID ${expectedGroupId} found in client's groups\n`);
    } else {
      console.error(`   ❌ Expected Group ID ${expectedGroupId} not found`);
      console.log(`   Found: ${client.jibbleGroupIds.join(', ') || 'None'}\n`);
      process.exit(1);
    }

    console.log('✅ Airtable data verification successful!\n');
    console.log('📊 Summary:');
    console.log(`   Email: ${client.email} ✅`);
    console.log(`   Jibble Group ID: ${expectedGroupId} ✅`);

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

