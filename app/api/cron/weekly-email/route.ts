/**
 * Vercel Cron Job: Weekly Email Digest
 * 
 * Runs weekly (e.g., Monday mornings) to send weekly digest emails
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/weekly-email",
 *       "schedule": "0 9 * * 1"  // Every Monday at 9 AM UTC
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPreviousWeekEmailJob } from '../../../lib/services/weekly-email-job';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes max

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel sets this header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📧 Cron job triggered: Weekly email digest');
    
    // Run weekly email job for previous week
    const result = await runPreviousWeekEmailJob();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

