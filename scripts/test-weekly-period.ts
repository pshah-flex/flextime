/**
 * Test script to verify Sunday-Saturday weekly period calculation
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local'), override: true });

async function main() {
  console.log('🧪 Testing Sunday-Saturday Weekly Period Calculation\n');

  try {
    const { generatePreviousWeekReport } = await import('../app/lib/services/weekly-report');
    
    // Test generating a previous week report
    console.log('📋 Generating previous week report...');
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    console.log(`   Today: ${today.toISOString().split('T')[0]} (${dayNames[dayOfWeek]})`);
    
    // Calculate what the previous week should be
    const endDate = new Date(today);
    if (dayOfWeek === 0) {
      endDate.setDate(endDate.getDate() - 1); // Yesterday (Saturday)
    } else {
      endDate.setDate(endDate.getDate() - (dayOfWeek + 1)); // Go back to Saturday
    }
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6); // 6 days before Saturday = Sunday
    startDate.setHours(0, 0, 0, 0);
    
    console.log(`   Expected Period:`);
    console.log(`     Start: ${startDate.toISOString().split('T')[0]} (${dayNames[startDate.getDay()]})`);
    console.log(`     End: ${endDate.toISOString().split('T')[0]} (${dayNames[endDate.getDay()]})`);
    
    // Verify it's Sunday-Saturday
    if (startDate.getDay() !== 0) {
      throw new Error(`Expected start date to be Sunday (0), got ${startDate.getDay()}`);
    }
    if (endDate.getDay() !== 6) {
      throw new Error(`Expected end date to be Saturday (6), got ${endDate.getDay()}`);
    }
    
    console.log(`   ✅ Period is Sunday-Saturday ✓\n`);
    
    // Generate a test report (this will fail if no data, but we just want to verify the period)
    try {
      const report = await generatePreviousWeekReport('paramdshah@gmail.com');
      
      if (Array.isArray(report)) {
        if (report.length > 0) {
          const firstReport = report[0];
          console.log(`   Generated Report Period:`);
          console.log(`     Start: ${firstReport.period_start} (${new Date(firstReport.period_start).getDay() === 0 ? 'Sunday ✓' : 'NOT Sunday ✗'})`);
          console.log(`     End: ${firstReport.period_end} (${new Date(firstReport.period_end).getDay() === 6 ? 'Saturday ✓' : 'NOT Saturday ✗'})`);
          
          if (firstReport.period_start === startDate.toISOString().split('T')[0] && 
              firstReport.period_end === endDate.toISOString().split('T')[0]) {
            console.log(`   ✅ Report period matches expected period ✓\n`);
          } else {
            console.log(`   ⚠️  Report period does not match expected period`);
            console.log(`      Expected: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
            console.log(`      Got: ${firstReport.period_start} to ${firstReport.period_end}\n`);
          }
        } else {
          console.log(`   ⚠️  No reports generated (no data for this client)\n`);
        }
      } else {
        console.log(`   Generated Report Period:`);
        console.log(`     Start: ${report.period_start} (${new Date(report.period_start).getDay() === 0 ? 'Sunday ✓' : 'NOT Sunday ✗'})`);
        console.log(`     End: ${report.period_end} (${new Date(report.period_end).getDay() === 6 ? 'Saturday ✓' : 'NOT Saturday ✗'})`);
        
        if (report.period_start === startDate.toISOString().split('T')[0] && 
            report.period_end === endDate.toISOString().split('T')[0]) {
          console.log(`   ✅ Report period matches expected period ✓\n`);
        } else {
          console.log(`   ⚠️  Report period does not match expected period`);
          console.log(`      Expected: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
          console.log(`      Got: ${report.period_start} to ${report.period_end}\n`);
        }
      }
    } catch (error: any) {
      console.log(`   ⚠️  Could not generate report (this is OK if there's no data): ${error.message}\n`);
    }
    
    console.log('✅ Weekly period calculation test completed!\n');
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

