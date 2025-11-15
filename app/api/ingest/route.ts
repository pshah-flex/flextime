/**
 * Manual Ingestion Endpoint
 * 
 * POST /api/ingest
 * 
 * Manually trigger data ingestion
 * 
 * Body (optional):
 * {
 *   "startDate": "2024-01-01",
 *   "endDate": "2024-01-31",
 *   "groupIds": ["group-id-1", "group-id-2"],
 *   "syncAgents": true,
 *   "syncGroups": true,
 *   "deriveSessions": false,
 *   "dryRun": false
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { runIngestion } from '../../lib/services/ingestion.service';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes max for manual runs

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    console.log('🔄 Manual ingestion triggered');
    
    const result = await runIngestion({
      startDate: body.startDate,
      endDate: body.endDate,
      groupIds: body.groupIds,
      syncAgents: body.syncAgents !== false,
      syncGroups: body.syncGroups !== false,
      deriveSessions: body.deriveSessions || false,
      dryRun: body.dryRun || false,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    console.error('❌ Ingestion failed:', error);
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
  // Support GET for easy testing
  const searchParams = request.nextUrl.searchParams;
  
  const options = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    groupIds: searchParams.get('groupIds')?.split(',') || undefined,
    syncAgents: searchParams.get('syncAgents') !== 'false',
    syncGroups: searchParams.get('syncGroups') !== 'false',
    deriveSessions: searchParams.get('deriveSessions') === 'true',
    dryRun: searchParams.get('dryRun') === 'true',
  };

  try {
    console.log('🔄 Manual ingestion triggered (GET)');
    
    const result = await runIngestion(options);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    console.error('❌ Ingestion failed:', error);
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

