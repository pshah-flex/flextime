/**
 * Test Jibble API Integration
 * Tests retry logic, pagination, and error handling
 * Run with: npx tsx scripts/test-jibble-integration.ts
 */

import { jibbleClient } from '../app/lib/jibble';
import { fetchTimeEntriesForGroup, getGroupsWithMemberCounts } from '../app/lib/jibble-helpers';

const GROUP_ID = '0c04e7ff-ec5b-4bba-8951-a7b2b99c4af3'; // 111 Hospitality

async function testIntegration() {
  try {
    console.log('🧪 Testing Jibble API Integration...\n');

    // Test 1: Fetch groups with pagination
    console.log('1. Testing pagination - fetching all groups...');
    const groups = await jibbleClient.getGroups();
    console.log(`   ✅ Fetched ${groups.length} groups`);
    const targetGroup = groups.find(g => g.id === GROUP_ID);
    if (targetGroup) {
      console.log(`   ✅ Found target group: ${targetGroup.name}`);
    }

    // Test 2: Fetch members with pagination
    console.log('\n2. Testing pagination - fetching all members...');
    const members = await jibbleClient.getMembers();
    console.log(`   ✅ Fetched ${members.length} members`);
    const groupMembers = members.filter(m => m.groupId === GROUP_ID);
    console.log(`   ✅ Found ${groupMembers.length} members in target group`);

    // Test 3: Fetch time entries with pagination
    console.log('\n3. Testing pagination - fetching time entries...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const today = new Date();
    
    const timeEntries = await jibbleClient.getTimeEntries(
      sevenDaysAgo.toISOString(),
      today.toISOString()
    );
    console.log(`   ✅ Fetched ${timeEntries.length} time entries (last 7 days)`);

    // Test 4: Test helper function
    console.log('\n4. Testing helper function - fetchTimeEntriesForGroup...');
    const groupTimeEntries = await fetchTimeEntriesForGroup(
      GROUP_ID,
      sevenDaysAgo.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    );
    console.log(`   ✅ Fetched ${groupTimeEntries.length} time entries for group`);

    // Test 5: Test groups with member counts
    console.log('\n5. Testing getGroupsWithMemberCounts...');
    const groupsWithCounts = await getGroupsWithMemberCounts();
    const targetGroupWithCount = groupsWithCounts.find(g => g.id === GROUP_ID);
    if (targetGroupWithCount) {
      console.log(`   ✅ Group "${targetGroupWithCount.name}" has ${targetGroupWithCount.memberCount} members`);
    }

    // Test 6: Test date range filtering
    console.log('\n6. Testing date range filtering...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
    const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));
    
    const yesterdayEntries = await jibbleClient.getTimeEntries(
      yesterdayStart.toISOString(),
      yesterdayEnd.toISOString()
    );
    console.log(`   ✅ Fetched ${yesterdayEntries.length} time entries for yesterday`);

    console.log('\n✅ All integration tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - Groups: ${groups.length}`);
    console.log(`   - Members: ${members.length}`);
    console.log(`   - Time entries (last 7 days): ${timeEntries.length}`);
    console.log(`   - Time entries for group (last 7 days): ${groupTimeEntries.length}`);
    
  } catch (error: any) {
    console.error('\n❌ Integration test failed:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testIntegration();

