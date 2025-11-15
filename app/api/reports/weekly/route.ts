/**
 * Weekly Report API Endpoint
 * 
 * GET /api/reports/weekly?startDate=2024-01-01&endDate=2024-01-07&clientEmail=client@example.com
 * 
 * Generates weekly reports for clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateWeeklyReportForClient, 
  generateWeeklyReportsForAllClients,
  generatePreviousWeekReport,
} from '../../../lib/services/weekly-report';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientEmail = searchParams.get('clientEmail') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const previousWeek = searchParams.get('previousWeek') === 'true';

    // Generate previous week report
    if (previousWeek) {
      const report = await generatePreviousWeekReport(clientEmail);
      return NextResponse.json({
        success: true,
        report,
      });
    }

    // Generate report for specific date range
    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'startDate and endDate are required (or use previousWeek=true)',
        },
        { status: 400 }
      );
    }

    if (clientEmail) {
      const report = await generateWeeklyReportForClient(clientEmail, {
        startDate,
        endDate,
      });
      return NextResponse.json({
        success: true,
        report,
      });
    } else {
      const reports = await generateWeeklyReportsForAllClients({
        startDate,
        endDate,
      });
      return NextResponse.json({
        success: true,
        reports,
        count: reports.length,
      });
    }
  } catch (error: any) {
    console.error('❌ Weekly report generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

