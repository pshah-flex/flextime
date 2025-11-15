/**
 * Test script for Airtable connection
 * Run with: npx tsx scripts/test-airtable.ts
 * 
 * Make sure to set AIRTABLE_PERSONAL_ACCESS_TOKEN in your environment
 */

const BASE_ID = 'appvhgZiUha2A1OQg';
const TABLE_NAME = 'Clients';
const TOKEN = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;

if (!TOKEN) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN environment variable is not set');
  console.error('Please set it in your .env.local file or export it in your shell');
  process.exit(1);
}

async function testAirtableConnection() {
  try {
    console.log('Testing Airtable connection...');
    console.log(`Base ID: ${BASE_ID}`);
    console.log(`Table: ${TABLE_NAME}`);
    
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    
    console.log('\n✅ Airtable connection successful!');
    console.log(`📊 Records found: ${data.records?.length || 0}`);
    
    if (data.records && data.records.length > 0) {
      console.log('\n📋 Sample record fields:');
      const firstRecord = data.records[0];
      const allFields = Object.keys(firstRecord.fields || {});
      console.log('Available fields:', allFields.join(', '));
      
      // Check for email-related fields
      const emailFields = allFields.filter(f => 
        f.toLowerCase().includes('email') || 
        f.toLowerCase().includes('mail')
      );
      if (emailFields.length > 0) {
        console.log('\n📧 Email-related fields found:', emailFields.join(', '));
      } else {
        console.log('\n⚠️  No email-related fields found in the field list');
      }
      
      // Check for Jibble Group ID field
      const groupFields = allFields.filter(f => 
        f.toLowerCase().includes('jibble') || 
        f.toLowerCase().includes('group')
      );
      if (groupFields.length > 0) {
        console.log('🔗 Group-related fields found:', groupFields.join(', '));
      }
      
      console.log('\n📋 Sample record (first 3 fields):');
      const sampleFields = Object.entries(firstRecord.fields || {}).slice(0, 3);
      sampleFields.forEach(([key, value]) => {
        console.log(`  ${key}: ${typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : value}`);
      });
      
      console.log('\n📧 Client emails found:');
      let emailCount = 0;
      data.records.forEach((record: any, index: number) => {
        // Try different possible field names for email
        const email = record.fields?.Email || record.fields?.email || record.fields?.['Email Address'] || record.fields?.['email address'];
        const groupId = record.fields?.['Jibble Group ID'] || record.fields?.['jibble group id'];
        
        if (email) {
          emailCount++;
          console.log(`  ${emailCount}. ${email} (Group ID: ${groupId || 'N/A'})`);
        }
      });
      
      if (emailCount === 0) {
        console.log('  ⚠️  No records with email addresses found');
        console.log('  💡 Make sure the "Email" field exists and is populated in your Airtable base');
      } else {
        console.log(`\n✅ Found ${emailCount} records with email addresses`);
      }
    } else {
      console.log('\n⚠️  No records found in the Clients table');
    }
    
  } catch (error: any) {
    console.error('\n❌ Error connecting to Airtable:');
    console.error(error.message);
    process.exit(1);
  }
}

testAirtableConnection();

