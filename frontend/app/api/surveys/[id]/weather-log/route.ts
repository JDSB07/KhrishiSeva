import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserFromReq } from '@/lib/auth';
import WeatherLog from '@/lib/models/WeatherLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = await getUserFromReq(req);
    if (!user) {
      return NextResponse.json({ status: "fail", message: "Unauthorized" }, { status: 401 });
    }

    const surveyId = params.id;

    if (process.env.USE_MOCK_DB === "true") {
      const { weatherLogs } = require('@/lib/mockDb');
      const weatherLog = weatherLogs.find((w: any) => w.survey === surveyId);
      if (!weatherLog) {
        return NextResponse.json({ status: "fail", message: "No weather log found" }, { status: 404 });
      }
      return NextResponse.json({ status: "success", weatherLog }, { status: 200 });
    }

    const weatherLog = await WeatherLog.findOne({ survey: surveyId });
    if (!weatherLog) {
      return NextResponse.json({ status: "fail", message: "No weather verification log found for this survey" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", weatherLog }, { status: 200 });

  } catch (error: any) {
    console.error("[API ERROR TRACE]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
