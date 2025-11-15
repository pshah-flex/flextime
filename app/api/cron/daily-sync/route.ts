/**
 * Daily Sync Cron Job API Route
 * 
 * Scheduled to run daily at 5 AM Pacific Time via Vercel Cron Jobs
 * Syncs previous day's Jibble data to Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { runDailySync } from '@/app/lib/services/daily-sync.service';

/**
 * GET /api/cron/daily-sync
 * 
 * Handles Vercel Cron Job requests for daily sync
 * Authenticates using CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate cron job request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('❌ CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }
    
    // Check authorization header
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Unauthorized cron job request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('🔄 Daily sync cron job triggered');
    
    // Run daily sync for previous day
    const result = await runDailySync();
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ Daily sync cron job failed:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/daily-sync
 * 
 * Manual trigger for daily sync (for testing or manual runs)
 * Supports optional targetDate parameter
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { targetDate } = body;
    
    console.log('🔄 Manual daily sync triggered');
    if (targetDate) {
      console.log(`   Target date: ${targetDate}`);
    }
    
    // Run daily sync
    const result = await runDailySync(targetDate);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ Manual daily sync failed:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

