import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserFromReq } from '@/lib/auth';
import Survey from '@/lib/models/Survey';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = await getUserFromReq(req);
    if (!user) {
      return NextResponse.json({ status: "fail", message: "Unauthorized" }, { status: 401 });
    }

    if (process.env.USE_MOCK_DB === "true") {
      const { surveys } = require('@/lib/mockDb');
      const userIdStr = user._id.toString();
      
      let filteredSurveys = [];
      if (user.role === 'farmer') {
        filteredSurveys = surveys.filter((s: any) => s.farmerPhone === user.phone);
      } else if (user.role === 'aew') {
        filteredSurveys = surveys.filter((s: any) => {
          const creatorId = s.createdBy && (s.createdBy._id ? s.createdBy._id.toString() : s.createdBy.toString());
          return creatorId === userIdStr;
        });
      }

      return NextResponse.json({
        status: "success",
        results: filteredSurveys.length,
        surveys: filteredSurveys,
      }, { status: 200 });
    }

    let query = {};
    if (user.role === 'farmer') {
      query = { farmerPhone: user.phone };
    } else if (user.role === 'aew') {
      query = { createdBy: user._id };
    } else {
      return NextResponse.json({ status: "fail", message: "Unauthorized role access" }, { status: 403 });
    }

    const surveysList = await Survey.find(query)
      .populate("createdBy", "name phone district")
      .sort("-createdAt");

    return NextResponse.json({
      status: "success",
      results: surveysList.length,
      surveys: surveysList,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[API ERROR TRACE]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
