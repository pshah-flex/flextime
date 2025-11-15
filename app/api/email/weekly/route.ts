/**
 * Manual Weekly Email Endpoint
 * 
 * POST /api/email/weekly
 * 
 * Manually trigger weekly email job
 * 
 * Body (optional):
 * {
 *   "startDate": "2024-01-01",
 *   "endDate": "2024-01-07",
 *   "syncClients": true,
 *   "fromEmail": "noreply@flexscale.com",
 *   "replyTo": "support@flexscale.com"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { runWeeklyEmailJob, runPreviousWeekEmailJob } from '../../../lib/services/weekly-email-job';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes max

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const previousWeek = body.previousWeek !== false; // Default to true
    
    console.log('📧 Manual weekly email job triggered');
    
    let result;
    
    if (previousWeek && !body.startDate && !body.endDate) {
      // Generate previous week report
      result = await runPreviousWeekEmailJob({
        syncClients: body.syncClients !== false,
        fromEmail: body.fromEmail,
        replyTo: body.replyTo,
      });
    } else if (body.startDate && body.endDate) {
      // Generate for specific date range
      result = await runWeeklyEmailJob({
        startDate: body.startDate,
        endDate: body.endDate,
        syncClients: body.syncClients !== false,
        fromEmail: body.fromEmail,
        replyTo: body.replyTo,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Either provide startDate and endDate, or use previousWeek=true (default)',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    console.error('❌ Weekly email job failed:', error);
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

export async function GET(request: NextRequest) {
  // Support GET for easy testing (generates previous week report)
  try {
    console.log('📧 Manual weekly email job triggered (GET - previous week)');
    
    const result = await runPreviousWeekEmailJob();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    console.error('❌ Weekly email job failed:', error);
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

