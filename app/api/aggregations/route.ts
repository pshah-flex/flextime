/**
 * Aggregations API Endpoint
 * 
 * GET /api/aggregations?type=hoursByAgent&startDate=2024-01-01&endDate=2024-01-31
 * 
 * Get various aggregations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getHoursByAgent,
  getHoursByActivity,
  getHoursByClientGroup,
  getHoursByAgentAndActivity,
  getHoursByGroupAndActivity,
  getHoursByAgentAndDay,
  getSummaryStats,
  type AggregationOptions,
} from '../../lib/services/aggregations';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'summary';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'startDate and endDate are required',
        },
        { status: 400 }
      );
    }

    const options: AggregationOptions = {
      startDate,
      endDate,
      agentIds: searchParams.get('agentIds')?.split(',').filter(Boolean),
      clientGroupIds: searchParams.get('clientGroupIds')?.split(',').filter(Boolean),
      activityIds: searchParams.get('activityIds')?.split(',').filter(Boolean),
      includeIncomplete: searchParams.get('includeIncomplete') !== 'false',
    };

    let result;

    switch (type) {
      case 'summary':
        result = await getSummaryStats(options);
        break;
      case 'hoursByAgent':
        result = await getHoursByAgent(options);
        break;
      case 'hoursByActivity':
        result = await getHoursByActivity(options);
        break;
      case 'hoursByClientGroup':
        result = await getHoursByClientGroup(options);
        break;
      case 'hoursByAgentAndActivity':
        result = await getHoursByAgentAndActivity(options);
        break;
      case 'hoursByGroupAndActivity':
        result = await getHoursByGroupAndActivity(options);
        break;
      case 'hoursByAgentAndDay':
        result = await getHoursByAgentAndDay(options);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown aggregation type: ${type}. Valid types: summary, hoursByAgent, hoursByActivity, hoursByClientGroup, hoursByAgentAndActivity, hoursByGroupAndActivity, hoursByAgentAndDay`,
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      options,
      result,
    });
  } catch (error: any) {
    console.error('❌ Aggregation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

