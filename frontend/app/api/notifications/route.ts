import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserFromReq } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ status: "fail", message: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ status: "success", data: "Migrated to Next.js API Route" }, { status: 200 });
  } catch (error: any) {
    console.error("[API ERROR TRACE]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
