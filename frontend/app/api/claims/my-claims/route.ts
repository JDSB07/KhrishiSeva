import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserFromReq } from '@/lib/auth';
import Claim from '@/lib/models/Claim';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = await getUserFromReq(req);
    if (!user) {
      return NextResponse.json({ status: "fail", message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "farmer") {
      return NextResponse.json({ status: "fail", message: "Only farmers can view their policy claims" }, { status: 403 });
    }

    const userIdStr = user._id.toString();

    if (process.env.USE_MOCK_DB === "true") {
      const { claims, surveys } = require('@/lib/mockDb');
      const myClaims = claims.filter((c: any) => c.farmer === userIdStr);

      const populatedClaims = myClaims.map((c: any) => {
        const survey = surveys.find((s: any) => s._id === c.survey);
        return {
          ...c,
          survey: survey ? { ...survey } : { cropName: "Unknown", cropType: "Unknown", area: 0, status: c.status }
        };
      });

      return NextResponse.json({
        status: "success",
        results: populatedClaims.length,
        claims: populatedClaims,
      }, { status: 200 });
    }

    const claimsList = await Claim.find({ farmer: user._id })
      .populate({
        path: "survey",
        select: "cropName cropType area sowingDate comments status images",
      })
      .sort("-createdAt");

    return NextResponse.json({
      status: "success",
      results: claimsList.length,
      claims: claimsList,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[API ERROR TRACE]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
