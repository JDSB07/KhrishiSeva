import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, phone, password, role, policyId, district, state } = body;

    if (!name || !phone || !password || !role || !district) {
      return NextResponse.json({ status: "fail", message: "Please fill in all required fields" }, { status: 400 });
    }

    let existingUser;
    if (process.env.USE_MOCK_DB === "true") {
      const { users } = require('@/lib/mockDb');
      existingUser = users.find((u: any) => u.phone === phone);
    } else {
      existingUser = await User.findOne({ phone });
    }

    if (existingUser) {
      return NextResponse.json({ status: "fail", message: "A user with this phone number already exists" }, { status: 400 });
    }

    if (role === "farmer" && !policyId) {
      return NextResponse.json({ status: "fail", message: "Farmers must provide an Insurance Policy ID" }, { status: 400 });
    }

    if (policyId) {
      let existingPolicy;
      if (process.env.USE_MOCK_DB === "true") {
        const { users } = require('@/lib/mockDb');
        existingPolicy = users.find((u: any) => u.policyId === policyId);
      } else {
        existingPolicy = await User.findOne({ policyId });
      }
      if (existingPolicy) {
        return NextResponse.json({ status: "fail", message: "This Policy ID has already been registered" }, { status: 400 });
      }
    }

    let newUser;
    if (process.env.USE_MOCK_DB === "true") {
      const { users, hashPasswordSync } = require('@/lib/mockDb');
      newUser = {
        _id: "mock_user_" + Date.now(),
        name,
        email,
        phone,
        password: hashPasswordSync(password),
        role,
        policyId,
        district,
        state: state || "Bihar",
        createdAt: new Date(),
        toObject() {
          return { ...this };
        },
      };
      users.push(newUser);
    } else {
      newUser = await User.create({ name, email, phone, password, role, policyId, district, state });
    }
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || "super_secret_dev_key_123456", { expiresIn: "7d" });

    const userObj = { ...(newUser.toObject ? newUser.toObject() : newUser) };
    delete (userObj as any).password;

    return NextResponse.json({ status: "success", token, user: userObj }, { status: 201 });
  } catch (error: any) {
    console.error("[API ERROR TRACE]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
