import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserFromReq } from '@/lib/auth';
import Notification from '@/lib/models/Notification';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request) {
  try {
    await connectDB();
    const user = await getUserFromReq(req);
    if (!user) {
      return NextResponse.json({ status: "fail", message: "Unauthorized" }, { status: 401 });
    }

    const userIdStr = user._id.toString();

    if (process.env.USE_MOCK_DB === "true") {
      const { notifications } = require('@/lib/mockDb');
      notifications.forEach((n: any) => {
        if (n.recipient === userIdStr && !n.read) {
          n.read = true;
        }
      });

      return NextResponse.json({
        status: "success",
        message: "All notifications marked as read",
      }, { status: 200 });
    }

    await Notification.updateMany(
      { recipient: user._id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({
      status: "success",
      message: "All notifications marked as read",
    }, { status: 200 });

  } catch (error: any) {
    console.error("[API ERROR TRACE]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
