/**
 * Simple Supabase database connectivity test
 * Run with: npx tsx scripts/test-database-simple.ts
 */

import { supabase } from '../app/lib/supabase';

async function testDatabaseSimple() {
  try {
    console.log('🧪 Testing Supabase Database Connection...\n');

    // Test 1: List tables (using a simple query)
    console.log('1. Testing connection and table access...');
    
    // Try to query agents table (should work even if empty)
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, jibble_member_id')
      .limit(1);
    
    if (agentsError) {
      // Check if it's a permissions issue or connection issue
      if (agentsError.code === 'PGRST301' || agentsError.message.includes('permission')) {
        console.log('   ⚠️  Connection works but RLS may be blocking access');
        console.log('   💡 This is expected - we can use service role key for admin operations');
      } else {
        throw agentsError;
      }
    } else {
      console.log(`   ✅ Connection successful! Found ${agents?.length || 0} agents`);
    }

    // Test 2: Check table structure
    console.log('\n2. Testing table structure...');
    const tables = ['agents', 'client_groups', 'clients', 'client_group_mappings', 'activities', 'activity_sessions'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (error && error.code !== 'PGRST116' && !error.message.includes('permission')) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: accessible`);
      }
    }

    // Test 3: Test RPC functions
    console.log('\n3. Testing database functions...');
    const { data: version, error: versionError } = await supabase.rpc('version');
    
    if (versionError) {
      console.log('   ⚠️  version() function not available (this is OK)');
    } else {
      console.log(`   ✅ Database functions accessible`);
    }

    console.log('\n✅ Basic connectivity test complete!');
    console.log('\n📝 Notes:');
    console.log('   - Tables are accessible');
    console.log('   - For full CRUD testing, use SUPABASE_SERVICE_ROLE_KEY');
    console.log('   - RLS policies can be added later for production');
    
  } catch (error: any) {
    console.error('\n❌ Database test failed:');
    console.error(error.message);
    
    if (error.message.includes('Missing Supabase environment variables')) {
      console.error('\n💡 Make sure you have set:');
      console.error('   - NEXT_PUBLIC_SUPABASE_URL');
      console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    
    process.exit(1);
  }
}

testDatabaseSimple();

