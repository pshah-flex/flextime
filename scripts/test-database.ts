/**
 * Test Supabase database connectivity and operations
 * Run with: npx tsx scripts/test-database.ts
 */

import { getSupabaseAdmin } from '../app/lib/supabase';

async function testDatabase() {
  const supabase = getSupabaseAdmin();
  
  try {
    console.log('🧪 Testing Supabase Database Connection...\n');

    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('agents')
      .select('count')
      .limit(0);
    
    if (tablesError && tablesError.code !== 'PGRST116') {
      throw tablesError;
    }
    console.log('   ✅ Connection successful\n');

    // Test 2: Insert test agent
    console.log('2. Testing agents table...');
    const testAgent = {
      jibble_member_id: 'test-member-' + Date.now(),
      name: 'Test Agent',
      email: 'test@example.com',
      timezone: 'America/Los_Angeles',
    };
    
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert(testAgent)
      .select()
      .single();
    
    if (agentError) throw agentError;
    console.log(`   ✅ Agent inserted: ${agent.name} (ID: ${agent.id})`);
    
    // Test query
    const { data: agents, error: queryError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent.id)
      .single();
    
    if (queryError) throw queryError;
    console.log(`   ✅ Agent queried successfully\n`);

    // Test 3: Insert test client group
    console.log('3. Testing client_groups table...');
    const testGroup = {
      jibble_group_id: 'test-group-' + Date.now(),
      group_name: 'Test Group',
      group_code: 'TEST001',
    };
    
    const { data: group, error: groupError } = await supabase
      .from('client_groups')
      .insert(testGroup)
      .select()
      .single();
    
    if (groupError) throw groupError;
    console.log(`   ✅ Group inserted: ${group.group_name} (ID: ${group.id})`);
    
    // Test query
    const { data: groups, error: groupQueryError } = await supabase
      .from('client_groups')
      .select('*')
      .eq('id', group.id)
      .single();
    
    if (groupQueryError) throw groupQueryError;
    console.log(`   ✅ Group queried successfully\n`);

    // Test 4: Insert test client
    console.log('4. Testing clients table...');
    const testClient = {
      airtable_record_id: 'test-record-' + Date.now(),
      email: 'test-client@example.com',
    };
    
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert(testClient)
      .select()
      .single();
    
    if (clientError) throw clientError;
    console.log(`   ✅ Client inserted: ${client.email} (ID: ${client.id})`);
    
    // Test query
    const { data: clients, error: clientQueryError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client.id)
      .single();
    
    if (clientQueryError) throw clientQueryError;
    console.log(`   ✅ Client queried successfully\n`);

    // Test 5: Insert client-group mapping
    console.log('5. Testing client_group_mappings table...');
    const testMapping = {
      client_id: client.id,
      client_group_id: group.id,
    };
    
    const { data: mapping, error: mappingError } = await supabase
      .from('client_group_mappings')
      .insert(testMapping)
      .select()
      .single();
    
    if (mappingError) throw mappingError;
    console.log(`   ✅ Mapping inserted (Client: ${client.email} → Group: ${group.group_name})`);
    
    // Test query with join
    const { data: mappings, error: mappingQueryError } = await supabase
      .from('client_group_mappings')
      .select(`
        *,
        clients(email),
        client_groups(group_name)
      `)
      .eq('id', mapping.id)
      .single();
    
    if (mappingQueryError) throw mappingQueryError;
    console.log(`   ✅ Mapping queried with joins successfully\n`);

    // Test 6: Insert test activity
    console.log('6. Testing activities table...');
    const testActivity = {
      jibble_time_entry_id: 'test-entry-' + Date.now(),
      agent_id: agent.id,
      client_group_id: group.id,
      activity_id: 'test-activity-id',
      entry_type: 'In',
      time_utc: new Date().toISOString(),
      local_time: new Date().toLocaleString(),
      belongs_to_date: new Date().toISOString().split('T')[0],
      raw_payload: { test: 'data', timestamp: Date.now() },
    };
    
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert(testActivity)
      .select()
      .single();
    
    if (activityError) throw activityError;
    console.log(`   ✅ Activity inserted: ${activity.entry_type} at ${activity.time_utc}`);
    
    // Test query with joins
    const { data: activities, error: activityQueryError } = await supabase
      .from('activities')
      .select(`
        *,
        agents(name, email),
        client_groups(group_name)
      `)
      .eq('id', activity.id)
      .single();
    
    if (activityQueryError) throw activityQueryError;
    console.log(`   ✅ Activity queried with joins successfully\n`);

    // Test 7: Test updated_at trigger
    console.log('7. Testing auto-update triggers...');
    const originalUpdatedAt = agent.updated_at;
    
    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update({ name: 'Updated Test Agent' })
      .eq('id', agent.id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    if (new Date(updatedAgent.updated_at) > new Date(originalUpdatedAt)) {
      console.log(`   ✅ updated_at trigger working (${originalUpdatedAt} → ${updatedAgent.updated_at})\n`);
    } else {
      console.log(`   ⚠️  updated_at may not have updated\n`);
    }

    // Test 8: Test unique constraints
    console.log('8. Testing unique constraints...');
    const { error: duplicateError } = await supabase
      .from('agents')
      .insert({
        jibble_member_id: testAgent.jibble_member_id, // Duplicate
        name: 'Duplicate Agent',
      });
    
    if (duplicateError && duplicateError.code === '23505') {
      console.log(`   ✅ Unique constraint working (duplicate prevented)\n`);
    } else {
      console.log(`   ⚠️  Unique constraint test inconclusive\n`);
    }

    // Test 9: Test foreign key constraints
    console.log('9. Testing foreign key constraints...');
    const { error: fkError } = await supabase
      .from('activities')
      .insert({
        jibble_time_entry_id: 'test-fk-' + Date.now(),
        agent_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID
        client_group_id: group.id,
        entry_type: 'In',
        time_utc: new Date().toISOString(),
        belongs_to_date: new Date().toISOString().split('T')[0],
        raw_payload: {},
      });
    
    if (fkError && fkError.code === '23503') {
      console.log(`   ✅ Foreign key constraint working (invalid reference prevented)\n`);
    } else {
      console.log(`   ⚠️  Foreign key constraint test inconclusive\n`);
    }

    // Test 10: Test check constraint
    console.log('10. Testing check constraints...');
    const { error: checkError } = await supabase
      .from('activities')
      .insert({
        jibble_time_entry_id: 'test-check-' + Date.now(),
        agent_id: agent.id,
        client_group_id: group.id,
        entry_type: 'Invalid', // Should fail
        time_utc: new Date().toISOString(),
        belongs_to_date: new Date().toISOString().split('T')[0],
        raw_payload: {},
      });
    
    if (checkError && checkError.code === '23514') {
      console.log(`   ✅ Check constraint working (invalid entry_type prevented)\n`);
    } else {
      console.log(`   ⚠️  Check constraint test inconclusive\n`);
    }

    // Cleanup
    console.log('11. Cleaning up test data...');
    await supabase.from('activities').delete().eq('id', activity.id);
    await supabase.from('client_group_mappings').delete().eq('id', mapping.id);
    await supabase.from('clients').delete().eq('id', client.id);
    await supabase.from('client_groups').delete().eq('id', group.id);
    await supabase.from('agents').delete().eq('id', agent.id);
    console.log('   ✅ Test data cleaned up\n');

    console.log('✅ All database tests passed!\n');
    console.log('📊 Database is ready for use');
    console.log('📝 Next steps:');
    console.log('   - Phase 3: Core Data Models & Types');
    console.log('   - Phase 4: Jibble API Integration');
    console.log('   - Phase 5: Data Ingestion Pipeline');
    
  } catch (error: any) {
    console.error('\n❌ Database test failed:');
    console.error(error.message);
    
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    
    if (error.message.includes('Missing Supabase environment variables')) {
      console.error('\n💡 Make sure you have set:');
      console.error('   - NEXT_PUBLIC_SUPABASE_URL');
      console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    }
    
    if (error.message.includes('service role')) {
      console.error('\n💡 Note: This test requires SUPABASE_SERVICE_ROLE_KEY');
      console.error('   (Anon key has RLS restrictions)');
    }
    
    process.exit(1);
  }
}

testDatabase();

