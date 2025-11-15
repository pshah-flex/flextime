/**
 * Full Client Flow Test
 * 
 * Complete end-to-end test including:
 * 1. Pulling client data from Airtable
 * 2. Syncing agents and groups
 * 3. Ingesting time entries
 * 4. Generating weekly report
 * 5. Sending email
 * 
 * Usage:
 *   npx tsx scripts/test-full-client-flow.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST with override to ensure they're set
config({ path: resolve(process.cwd(), '.env.local'), override: true });

// Verify critical environment variables are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
}
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in .env.local');
}
if (!process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN) {
  throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN is not set in .env.local');
}

// Use dynamic imports after environment variables are loaded
async function main() {
  // Dynamic imports after env vars are loaded
  const { fetchClientEmails } = await import('../app/lib/airtable');
  const { syncClientsFromAirtable } = await import('../app/lib/services/sync-clients');
  const { syncAllGroups } = await import('../app/lib/services/sync-groups');
  const { syncAllAgents } = await import('../app/lib/services/sync-agents');
  const { runIngestion } = await import('../app/lib/services/ingestion.service');
  const { generateWeeklyReportForClient } = await import('../app/lib/services/weekly-report');
  const { sendWeeklyReportEmail } = await import('../app/lib/services/email.service');
  
  console.log('🧪 Testing Full Client Flow for "111 Hospitality"\n');

  try {
    const clientEmail = 'paramdshah@gmail.com';
    const expectedGroupId = '0c04e7ff-ec5b-4bba-8951-a7b2b99c4af3';
    // Note: We'll find agents by group ID instead of member code
    
    // Step 1: Fetch clients from Airtable
    console.log('📋 Step 1: Fetching clients from Airtable...');
    const airtableClients = await fetchClientEmails();
    console.log(`   ✅ Found ${airtableClients.length} clients in Airtable\n`);

    const client = airtableClients.find(c => 
      c.email.toLowerCase() === clientEmail.toLowerCase()
    );

    if (!client) {
      throw new Error(`Client with email ${clientEmail} not found in Airtable`);
    }

    console.log('📧 Client Details from Airtable:');
    console.log(`   Email: ${client.email}`);
    console.log(`   Record ID: ${client.recordId}`);
    console.log(`   Jibble Group IDs: ${client.jibbleGroupIds.join(', ')}\n`);

    if (!client.jibbleGroupIds.includes(expectedGroupId)) {
      throw new Error(
        `Expected Group ID ${expectedGroupId} not found. ` +
        `Found: ${client.jibbleGroupIds.join(', ')}`
      );
    }

    console.log(`   ✅ Group ID ${expectedGroupId} found in client's groups\n`);

    // Step 2: Sync groups from Jibble
    console.log('📋 Step 2: Syncing groups from Jibble...');
    const groupsSyncResult = await syncAllGroups();
    console.log(`   ✅ Synced ${groupsSyncResult.synced} groups, ${groupsSyncResult.errors} errors\n`);

    // Step 3: Sync agents from Jibble
    console.log('📋 Step 3: Syncing agents from Jibble...');
    const agentsSyncResult = await syncAllAgents();
    console.log(`   ✅ Synced ${agentsSyncResult.synced} agents, ${agentsSyncResult.errors} errors\n`);

    // Find agents for this group
    const { agentsRepository, clientGroupsRepository: groupsRepo } = await import('../app/lib/repositories');
    const group = await groupsRepo.findByJibbleGroupId(expectedGroupId);
    if (group) {
      const groupAgents = await agentsRepository.findByGroupId(group.id);
      console.log(`   📋 Agents in group "${group.group_name}" (${group.id}):`);
      groupAgents.forEach(agent => {
        console.log(`      - ${agent.name} (${agent.jibble_member_id})`);
      });
      console.log(`   ✅ Found ${groupAgents.length} agent(s) in group\n`);
    } else {
      console.log(`   ⚠️  Group ${expectedGroupId} not found in database\n`);
    }

    // Step 4: Sync clients to database
    console.log('📋 Step 4: Syncing clients to database...');
    const syncResult = await syncClientsFromAirtable();
    console.log(`   ✅ Synced ${syncResult.clientsSynced} clients, ${syncResult.mappingsSynced} mappings\n`);

    // Step 5: Ingest time entries for the group
    console.log('📋 Step 5: Ingesting time entries...');
    // Get date range for last 60 days to ensure we capture all timesheets
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`   Period: ${startDateStr} to ${endDateStr}`);
    console.log(`   Group ID: ${expectedGroupId}`);
    console.log(`   Group Name: "111 Hospitality"`);
    
    const ingestionResult = await runIngestion({
      startDate: startDateStr,
      endDate: endDateStr,
      groupIds: [expectedGroupId],
      syncAgents: true,
      syncGroups: false, // Already synced
      deriveSessions: true,
      dryRun: false,
    });
    
    console.log(`   ✅ Ingestion complete:`);
    console.log(`      Agents synced: ${ingestionResult.agents?.synced || 0}`);
    console.log(`      Groups synced: ${ingestionResult.groups?.synced || 0}`);
    console.log(`      Time entries fetched: ${ingestionResult.timeEntries?.fetched || 0}`);
    console.log(`      Time entries inserted: ${ingestionResult.timeEntries?.inserted || 0}`);
    console.log(`      Time entries skipped: ${ingestionResult.timeEntries?.skipped || 0}`);
    console.log(`      Time entries duplicates: ${ingestionResult.timeEntries?.duplicates || 0}`);
    console.log(`      Sessions derived: ${ingestionResult.sessions?.derived || 0}\n`);

    // Step 6: Check what data we have in the database
    console.log('📋 Step 6: Checking ingested data...');
    const { clientGroupsRepository } = await import('../app/lib/repositories');
    
    const dbGroup = await clientGroupsRepository.findByJibbleGroupId(expectedGroupId);
    if (dbGroup) {
      // Get all activities for this group in the ingested period
      const { data: activities } = await (await import('../app/lib/supabase')).getSupabaseAdmin()
        .from('activities')
        .select('*, agents(*)')
        .eq('client_group_id', dbGroup.id)
        .gte('time_utc', `${startDateStr}T00:00:00Z`)
        .lte('time_utc', `${endDateStr}T23:59:59Z`)
        .order('time_utc', { ascending: true });
      
      if (activities && activities.length > 0) {
        console.log(`   ✅ Found ${activities.length} time entries for this group`);
        
        // Group by agent
        const agentMap = new Map<string, any[]>();
        activities.forEach((act: any) => {
          const agentId = act.agent_id;
          if (!agentMap.has(agentId)) {
            agentMap.set(agentId, []);
          }
          agentMap.get(agentId)!.push(act);
        });
        
        console.log(`   📋 Time entries by agent:`);
        for (const [agentId, entries] of agentMap.entries()) {
          const agent = entries[0]?.agents;
          const firstDate = new Date(entries[0]?.time_utc).toISOString().split('T')[0];
          const lastDate = new Date(entries[entries.length - 1]?.time_utc).toISOString().split('T')[0];
          console.log(`      - ${agent?.name || 'Unknown'}: ${entries.length} entries (${firstDate} to ${lastDate})`);
        }
        console.log('');
        
        // Derive sessions if they weren't derived
        if ((ingestionResult.sessions?.derived || 0) === 0) {
          console.log(`   📋 Deriving sessions for the ingested period...`);
          const { deriveSessionsForDateRange } = await import('../app/lib/services/derive-sessions');
          const sessions = await deriveSessionsForDateRange(startDateStr, endDateStr, {
            clientGroupId: dbGroup.id,
          });
          
          if (sessions.length > 0) {
            const supabase = await import('../app/lib/supabase');
            const sessionsToInsert = sessions.map(s => ({
              activity_id: s.activity_id || undefined,
              agent_id: s.agent_id,
              client_group_id: s.client_group_id,
              start_time_utc: s.start_time_utc,
              end_time_utc: s.end_time_utc || undefined,
              duration_minutes: s.duration_minutes || undefined,
              is_complete: s.is_complete,
            }));
            
            // Insert sessions with duplicate handling (using unique constraint on agent_id, client_group_id, start_time_utc)
            const supabaseAdmin = supabase.getSupabaseAdmin();
            let inserted = 0;
            let skipped = 0;
            let errors = 0;
            
            // Insert one by one to handle duplicates gracefully
            // Supabase upsert doesn't support composite unique constraints directly
            for (const session of sessionsToInsert) {
              try {
                const { error: insertError } = await supabaseAdmin
                  .from('activity_sessions')
                  .insert(session)
                  .select()
                  .single();
                
                if (insertError) {
                  // Check if it's a duplicate (unique constraint violation)
                  if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
                    // Skip duplicates silently
                    skipped++;
                    continue;
                  }
                  throw insertError;
                }
                inserted++;
              } catch (err: any) {
                // Handle duplicates
                if (err.code === '23505' || err.message?.includes('duplicate') || err.message?.includes('unique')) {
                  skipped++;
                } else {
                  errors++;
                  console.log(`      ⚠️  Error inserting session: ${err.message}`);
                }
              }
            }
            
            console.log(`   ✅ Derived ${sessions.length} sessions, ${inserted} inserted, ${skipped} skipped (duplicates), ${errors} errors\n`);
          }
        }
      } else {
        console.log(`   ⚠️  No time entries found for this group in the ingested period`);
        console.log(`   (This might mean the data is from a different period)\n`);
      }
    }

    // Step 7: Generate weekly report for a period with data
    console.log('📋 Step 7: Generating weekly report...');
    
    // Test Sunday-Saturday period
    // Use a date range that includes the actual data (2025-10-20 to 2025-11-14)
    // Use a Sunday-Saturday week that has data: Nov 3 (Sunday) - Nov 9 (Saturday), 2025
    const reportStartDate = new Date('2025-11-03'); // Sunday
    const reportEndDate = new Date('2025-11-09');   // Saturday

    const reportStartDateStr = reportStartDate.toISOString().split('T')[0];
    const reportEndDateStr = reportEndDate.toISOString().split('T')[0];

    // Verify this is Sunday to Saturday
    const startDay = reportStartDate.getDay(); // Should be 0 (Sunday)
    const endDay = reportEndDate.getDay(); // Should be 6 (Saturday)
    console.log(`   Period: ${reportStartDateStr} to ${reportEndDateStr} (Sunday to Saturday)`);
    console.log(`   Start day: ${startDay === 0 ? 'Sunday ✓' : 'NOT Sunday ✗'}`);
    console.log(`   End day: ${endDay === 6 ? 'Saturday ✓' : 'NOT Saturday ✗'}`);

    const report = await generateWeeklyReportForClient({
      clientEmail: clientEmail,
      startDate: reportStartDateStr,
      endDate: reportEndDateStr,
    });

    console.log(`   ✅ Report generated for ${clientEmail}`);
    const { formatHoursAsHrsMin } = await import('../app/lib/utils/format-hours');
    console.log(`   Total Hours: ${formatHoursAsHrsMin(report.summary.total_hours)}`);
    console.log(`   Total Sessions: ${report.summary.total_sessions}`);
    console.log(`   Unique Agents: ${report.summary.unique_agents}`);
    console.log(`   Unique Groups: ${report.summary.unique_groups}`);
    console.log(`   Incomplete Sessions: ${report.summary.incomplete_sessions}\n`);

    if (report.hours_by_agent.length > 0) {
      console.log('   Hours by Agent:');
      report.hours_by_agent.forEach(agent => {
        console.log(`     - ${agent.agent_name}: ${formatHoursAsHrsMin(agent.total_hours)} (${agent.session_count} sessions)`);
        if (agent.incomplete_sessions > 0) {
          console.log(`       ⚠️  ${agent.incomplete_sessions} incomplete session(s)`);
        }
      });
      console.log('');
    } else {
      console.log('   ⚠️  No agent hours found for this period');
      console.log('   (This is normal if there are no time entries for the selected week)\n');
    }

    if (report.hours_by_day && report.hours_by_day.length > 0) {
      console.log('   Hours by Day:');
      report.hours_by_day.forEach(day => {
        console.log(`     - ${day.date_formatted}: ${formatHoursAsHrsMin(day.total_hours)} (${day.session_count} sessions)`);
      });
      console.log('');
    }

    // Step 8: Send email
    console.log('📋 Step 8: Sending email...');
    // Use Resend's test domain for testing (no domain verification needed)
    // Note: Resend test mode only allows sending to param@flexscale.com
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const testEmail = 'param@flexscale.com'; // Resend test mode restriction
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: ${testEmail} (Resend test mode - original: ${clientEmail})`);
    
    // Create a test report with the allowed email
    const testReport = {
      ...report,
      client_email: testEmail,
    };
    
    const emailResult = await sendWeeklyReportEmail(testReport, {
      from: fromEmail,
    });

    if (emailResult.success) {
      console.log(`   ✅ Email sent successfully!`);
      console.log(`   Message ID: ${emailResult.messageId}\n`);
    } else {
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }

    console.log('✅ Full end-to-end test completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Client Email: ${clientEmail} ✅`);
    console.log(`   Jibble Group ID: ${expectedGroupId} ✅`);
    console.log(`   Ingestion Period: ${startDateStr} to ${endDateStr}`);
    console.log(`   Time Entries Fetched: ${ingestionResult.timeEntries?.fetched || 0}`);
    console.log(`   Time Entries Inserted: ${ingestionResult.timeEntries?.inserted || 0}`);
    console.log(`   Sessions Derived: ${ingestionResult.sessions?.derived || 0}`);
    console.log(`   Report Period: ${reportStartDateStr} to ${reportEndDateStr}`);
    console.log(`   Total Hours: ${formatHoursAsHrsMin(report.summary.total_hours)}`);
    console.log(`   Total Sessions: ${report.summary.total_sessions}`);
    console.log(`   Unique Agents: ${report.summary.unique_agents}`);
    if (report.hours_by_agent.length > 0) {
      console.log(`   Agent Hours:`);
      report.hours_by_agent.forEach(agent => {
        console.log(`      - ${agent.agent_name}: ${formatHoursAsHrsMin(agent.total_hours)}`);
      });
    }
    console.log(`   Email Sent: Yes ✅`);
    console.log(`   Message ID: ${emailResult.messageId}`);

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

