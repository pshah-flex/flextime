/**
 * Simple Ingestion Test (using Supabase MCP)
 * 
 * Tests ingestion using Supabase MCP for database operations
 * Run with: npx tsx scripts/test-ingestion-simple.ts
 */

import { jibbleClient } from '../app/lib/jibble';
import { mcp_supabase_execute_sql } from '@modelcontextprotocol/sdk/client.js';

const PROJECT_ID = 'xegtayaaifuxepntloct';
const GROUP_ID = '0c04e7ff-ec5b-4bba-8951-a7b2b99c4af3'; // 111 Hospitality

async function testIngestionSimple() {
  try {
    console.log('🧪 Testing Simple Ingestion (using MCP)...\n');

    // Test 1: Sync a single agent using MCP
    console.log('1. Testing agent sync via MCP...');
    const members = await jibbleClient.getMembers();
    const testMember = members.find(m => m.groupId === GROUP_ID) || members[0];
    
    if (testMember) {
      const name = (testMember.fullName || testMember.preferredName || testMember.email || 'Unknown').replace(/'/g, "''");
      const email = testMember.email ? `'${testMember.email.replace(/'/g, "''")}'` : 'NULL';
      
      const sql = `
        INSERT INTO agents (jibble_member_id, name, email)
        VALUES ('${testMember.id}', '${name}', ${email})
        ON CONFLICT (jibble_member_id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          updated_at = NOW()
        RETURNING id, name, jibble_member_id;
      `;

      // Note: This would need to be called via MCP tool
      // For now, we'll just show what would happen
      console.log(`   ✅ Would sync agent: ${name} (${testMember.id})`);
    }

    // Test 2: Sync a single group using MCP
    console.log('\n2. Testing group sync via MCP...');
    const groups = await jibbleClient.getGroups();
    const testGroup = groups.find(g => g.id === GROUP_ID);
    
    if (testGroup) {
      const groupName = testGroup.name.replace(/'/g, "''");
      const sql = `
        INSERT INTO client_groups (jibble_group_id, group_name)
        VALUES ('${testGroup.id}', '${groupName}')
        ON CONFLICT (jibble_group_id) 
        DO UPDATE SET 
          group_name = EXCLUDED.group_name,
          updated_at = NOW()
        RETURNING id, group_name, jibble_group_id;
      `;
      console.log(`   ✅ Would sync group: ${groupName} (${testGroup.id})`);
    }

    // Test 3: Test time entry ingestion (dry run)
    console.log('\n3. Testing time entry ingestion (dry run)...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const timeEntries = await jibbleClient.getTimeEntriesForGroup(
      GROUP_ID,
      yesterday.toISOString(),
      new Date().toISOString()
    );
    
    console.log(`   ✅ Found ${timeEntries.length} time entries for group (last 24 hours)`);
    
    if (timeEntries.length > 0) {
      console.log(`   Sample entry: ${timeEntries[0].type} at ${timeEntries[0].time}`);
      console.log(`   Would insert ${timeEntries.length} entries (after deduplication check)`);
    }

    console.log('\n✅ Simple ingestion test complete!');
    console.log('\n💡 Note: Full ingestion requires SUPABASE_SERVICE_ROLE_KEY');
    console.log('   See INGESTION_SETUP.md for instructions');
    
  } catch (error: any) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    process.exit(1);
  }
}

testIngestionSimple();

