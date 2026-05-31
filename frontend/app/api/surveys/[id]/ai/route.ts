import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserFromReq } from '@/lib/auth';
import AIAnalysis from '@/lib/models/AIAnalysis';

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
      const { aiAnalyses } = require('@/lib/mockDb');
      const aiAnalysis = aiAnalyses.find((a: any) => a.survey === surveyId);
      if (!aiAnalysis) {
        return NextResponse.json({ status: "fail", message: "No AI analysis found" }, { status: 404 });
      }
      return NextResponse.json({ status: "success", aiAnalysis }, { status: 200 });
    }

    const aiAnalysis = await AIAnalysis.findOne({ survey: surveyId });
    if (!aiAnalysis) {
      return NextResponse.json({ status: "fail", message: "No AI analysis log found for this survey" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", aiAnalysis }, { status: 200 });

  } catch (error: any) {
    console.error("[API ERROR TRACE]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
