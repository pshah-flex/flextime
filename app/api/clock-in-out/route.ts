/**
 * Clock-in/Clock-out API Endpoint
 * 
 * GET /api/clock-in-out?startDate=2024-01-01&endDate=2024-01-31&agentId=agent-id
 * 
 * Get clock-in/clock-out records
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getClockInOutRecords,
  getClockInOutForAgent,
  getClockInOutForDate,
} from '../../lib/services/clock-in-out';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date'); // Single date
    const agentId = searchParams.get('agentId') || undefined;
    const clientGroupId = searchParams.get('clientGroupId') || undefined;
    const timezone = searchParams.get('timezone') || undefined;

    let result;

    if (date) {
      // Get records for a single date
      result = await getClockInOutForDate(date, {
        agentId,
        clientGroupId,
        timezone,
      });
    } else if (startDate && endDate) {
      // Get records for date range
      if (agentId) {
        result = await getClockInOutForAgent(agentId, {
          startDate,
          endDate,
          clientGroupId,
          timezone,
        });
      } else {
        result = await getClockInOutRecords({
          startDate,
          endDate,
          agentId,
          clientGroupId,
          timezone,
        });
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Either (startDate and endDate) or date is required',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      count: result.length,
      records: result,
    });
  } catch (error: any) {
    console.error('❌ Clock-in/out query failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

