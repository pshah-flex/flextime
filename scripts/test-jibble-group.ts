/**
 * Test script to fetch Jibble data for a specific group
 * Run with: npx tsx scripts/test-jibble-group.ts
 */

import { jibbleClient } from '../app/lib/jibble';

const GROUP_ID = '0c04e7ff-ec5b-4bba-8951-a7b2b99c4af3';
const GROUP_NAME = '111 Hospitality';

async function testGroupData() {
  try {
    console.log(`Testing Jibble data fetch for: ${GROUP_NAME}`);
    console.log(`Group ID: ${GROUP_ID}\n`);

    // 1. Fetch all organizations to verify the group exists
    console.log('1. Fetching all organizations...');
    const organizations = await jibbleClient.getGroups();
    console.log(`   Found ${organizations.length} organizations`);
    
    const targetOrg = organizations.find(org => org.id === GROUP_ID);
    if (targetOrg) {
      console.log(`   ✅ Found target organization: ${targetOrg.name || 'N/A'}`);
      console.log(`   Details:`, JSON.stringify(targetOrg, null, 2).substring(0, 300));
    } else {
      console.log(`   ⚠️  Group ID ${GROUP_ID} not found in organizations list`);
      console.log(`   Available organizations:`, organizations.map(o => `${o.name} (${o.id})`).join(', '));
    }

    // 2. Fetch all people/members
    console.log('\n2. Fetching all people/members...');
    const members = await jibbleClient.getMembers();
    console.log(`   Found ${members.length} people/members`);
    
    // Filter members for this organization if organizationId field exists
    const orgMembers = members.filter(m => 
      m.organizationId === GROUP_ID || 
      (m as any).organization?.id === GROUP_ID ||
      (m as any).organizationId === GROUP_ID
    );
    
    if (orgMembers.length > 0) {
      console.log(`   ✅ Found ${orgMembers.length} members in this organization`);
      console.log(`   Members:`, orgMembers.map(m => m.name || m.id).join(', '));
      
      // Show sample member
      if (orgMembers.length > 0) {
        console.log(`\n   Sample member:`, JSON.stringify(orgMembers[0], null, 2).substring(0, 400));
      }
    } else {
      console.log(`   ⚠️  No members found with organizationId=${GROUP_ID}`);
      console.log(`   Showing first 3 members for reference:`, 
        members.slice(0, 3).map(m => `${m.name || 'N/A'} (orgId: ${(m as any).organizationId || 'N/A'})`).join(', '));
    }

    // 3. Fetch activities (these are activity types/templates, not time entries)
    console.log('\n3. Fetching activity types...');
    const allActivities = await jibbleClient.getActivities();
    console.log(`   Found ${allActivities.length} activity types`);
    
    // Check if any activities are assigned to this group
    const groupActivities = allActivities.filter(a => {
      const assignedGroups = (a as any).assignedGroups || [];
      return assignedGroups.some((g: any) => 
        g.id === GROUP_ID || 
        g === GROUP_ID ||
        (typeof g === 'string' && g === GROUP_ID)
      );
    });
    
    if (groupActivities.length > 0) {
      console.log(`   ✅ Found ${groupActivities.length} activity types assigned to this group`);
      console.log(`   Activity types:`, groupActivities.map(a => `${(a as any).name || a.id}`).join(', '));
    } else {
      console.log(`   ⚠️  No activity types found assigned to group ${GROUP_ID}`);
    }
    
    // Show full structure of first activity
    if (allActivities.length > 0) {
      console.log(`\n   Sample activity type structure:`, JSON.stringify(allActivities[0], null, 2));
    }

    // 4. Check for Groups endpoint (separate from Organizations)
    console.log('\n4. Checking for Groups endpoint...');
    try {
      const token = await (jibbleClient as any).getAccessToken();
      const groupsResponse = await fetch('https://workspace.prod.jibble.io/v1/Groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        const groups = Array.isArray(groupsData) ? groupsData : (groupsData.value || []);
        console.log(`   ✅ Found Groups endpoint: /v1/Groups (${groups.length} groups)`);
        
        const targetGroup = groups.find((g: any) => g.id === GROUP_ID);
        if (targetGroup) {
          console.log(`   ✅ Found target group: ${targetGroup.name || 'N/A'}`);
          console.log(`   Group details:`, JSON.stringify(targetGroup, null, 2).substring(0, 500));
        } else {
          console.log(`   ⚠️  Group ID ${GROUP_ID} not found in groups`);
          if (groups.length > 0) {
            console.log(`   Available groups (first 10):`, groups.slice(0, 10).map((g: any) => `${g.name || 'N/A'} (${g.id})`).join(', '));
          }
        }
      } else {
        console.log(`   /v1/Groups: ${groupsResponse.status}`);
      }
    } catch (error: any) {
      console.log(`   Error checking Groups: ${error.message}`);
    }

    // 5. Check member structure for group references
    let membersWithGroup: any[] = [];
    if (members.length > 0) {
      console.log('\n5. Checking member structure for group references...');
      const sampleMember = members[0] as any;
      console.log(`   Sample member keys:`, Object.keys(sampleMember).join(', '));
      
      // Check if members have groupId or groups field
      membersWithGroup = members.filter(m => {
        const member = m as any;
        return member.groupId === GROUP_ID ||
               member.group?.id === GROUP_ID ||
               (Array.isArray(member.groups) && member.groups.some((g: any) => 
                 (typeof g === 'string' ? g === GROUP_ID : g.id === GROUP_ID)
               ));
      });
      
      if (membersWithGroup.length > 0) {
        console.log(`   ✅ Found ${membersWithGroup.length} members in group ${GROUP_ID}`);
        console.log(`   Members:`, membersWithGroup.map(m => (m as any).name || m.id).join(', '));
      } else {
        console.log(`   ⚠️  No members found with groupId=${GROUP_ID}`);
        console.log(`   Sample member structure:`, JSON.stringify(sampleMember, null, 2).substring(0, 600));
      }
    }

    // 6. Fetch time entries for the group
    console.log('\n6. Fetching time entries for group...');
    
    // Get all member IDs in the group
    const memberIds = membersWithGroup.map(m => m.id);
    console.log(`   Found ${memberIds.length} members in group: ${memberIds.join(', ')}`);
    
    try {
      // Fetch time entries for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const today = new Date();
      
      console.log(`   Fetching time entries from ${thirtyDaysAgo.toISOString()} to ${today.toISOString()}`);
      
      // Fetch time entries for all members in the group
      const groupTimeEntries = await jibbleClient.getTimeEntries(
        thirtyDaysAgo.toISOString(),
        today.toISOString(),
        undefined,
        memberIds
      );
      
      console.log(`   ✅ Found ${groupTimeEntries.length} time entries for group ${GROUP_ID}`);
      
      if (groupTimeEntries.length > 0) {
        console.log(`\n   Sample time entry:`, JSON.stringify(groupTimeEntries[0], null, 2).substring(0, 600));
        
        // Calculate total hours by pairing In/Out entries
        // Time entries are individual clock in/out events, need to pair them
        const entriesByPerson = groupTimeEntries.reduce((acc: any, entry: any) => {
          if (!acc[entry.personId]) {
            acc[entry.personId] = [];
          }
          acc[entry.personId].push(entry);
          return acc;
        }, {});
        
        let totalHours = 0;
        Object.keys(entriesByPerson).forEach(personId => {
          const personEntries = entriesByPerson[personId].sort((a: any, b: any) => 
            new Date(a.time).getTime() - new Date(b.time).getTime()
          );
          
          // Pair In/Out entries
          for (let i = 0; i < personEntries.length - 1; i++) {
            const current = personEntries[i];
            const next = personEntries[i + 1];
            
            if (current.type === 'In' && next.type === 'Out') {
              const start = new Date(current.time);
              const end = new Date(next.time);
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              totalHours += hours;
            }
          }
        });
        
        console.log(`\n   Total hours tracked: ${totalHours.toFixed(2)} hours`);
        console.log(`   Time entries breakdown:`);
        Object.keys(entriesByPerson).forEach(personId => {
          const personName = members.find(m => m.id === personId)?.name || personId;
          const count = entriesByPerson[personId].length;
          console.log(`     - ${personName}: ${count} entries`);
        });
      } else {
        console.log(`   ⚠️  No time entries found for this group in the last 30 days`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error fetching time entries: ${error.message}`);
    }

    console.log('\n✅ Test complete!');
    
  } catch (error: any) {
    console.error('\n❌ Error fetching Jibble data:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testGroupData();

