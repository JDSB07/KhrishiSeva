import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { phone, password, role } = body;

    if (!phone || !password || !role) {
      return NextResponse.json({ status: "fail", message: "Please provide phone number, password, and role" }, { status: 400 });
    }

    let user;
    if (process.env.USE_MOCK_DB === "true") {
      const { users } = require('@/lib/mockDb');
      if (role === "farmer") {
        user = users.find((u: any) => u.policyId === phone || u.phone === phone);
      } else {
        user = users.find((u: any) => u.phone === phone);
      }
    } else {
      if (role === "farmer") {
        user = await User.findOne({ $or: [{ policyId: phone }, { phone: phone }] }).select("+password");
      } else {
        user = await User.findOne({ phone }).select("+password");
      }
    }

    if (!user || user.role !== role) {
      return NextResponse.json({ status: "fail", message: "Incorrect login details or role" }, { status: 401 });
    }

    let isCorrect = false;
    if (process.env.USE_MOCK_DB === "true") {
      const isPasswordCorrect = bcrypt.compareSync(password, user.password);
      const isPolicyCorrect = user.policyId === password;
      isCorrect = isPasswordCorrect || isPolicyCorrect;
    } else {
      if (role === "farmer") {
        isCorrect = await (user as any).comparePassword(password) || user.policyId === password;
      } else {
        isCorrect = await (user as any).comparePassword(password);
      }
    }

    if (!isCorrect) {
      return NextResponse.json({ status: "fail", message: "Incorrect credentials" }, { status: 401 });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "super_secret_dev_key_123456", { expiresIn: "7d" });

    const userObj = { ...(user.toObject ? user.toObject() : user) };
    delete (userObj as any).password;

    return NextResponse.json({ status: "success", token, user: userObj }, { status: 200 });
  } catch (error: any) {
    console.error("[API ERROR TRACE]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
