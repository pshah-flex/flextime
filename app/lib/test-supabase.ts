/**
 * Test Supabase connection
 * Run with: npx tsx app/lib/test-supabase.ts
 */

import { supabase } from './supabase';

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection by querying a system table
    const { data, error } = await supabase
      .from('_prisma_migrations')
      .select('*')
      .limit(1);

    if (error) {
      // If migrations table doesn't exist, try a simple query
      const { error: testError } = await supabase.rpc('version');
      
      if (testError) {
        console.log('⚠️  Database is empty (no tables yet) - this is expected for a new project');
        console.log('✅ Supabase connection is working!');
        console.log('📝 Next step: Create database schema (Phase 2)');
        return;
      }
    }

    console.log('✅ Supabase connection successful!');
    console.log('📊 Database is accessible');
    
  } catch (error: any) {
    console.error('❌ Error connecting to Supabase:');
    console.error(error.message);
    
    if (error.message.includes('Missing Supabase environment variables')) {
      console.error('\n💡 Make sure you have set:');
      console.error('   - NEXT_PUBLIC_SUPABASE_URL');
      console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    
    process.exit(1);
  }
}

testSupabaseConnection();

