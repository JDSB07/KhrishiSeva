import { Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import { users, hashPasswordSync } from "../utils/mockDb";

const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "super_secret_dev_key_123456", {
    expiresIn: (process.env.JWT_EXPIRES_IN as any) || "7d",
  });
};

export const signup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, password, role, policyId, district, state } = req.body;

    // Validate request
    if (!name || !phone || !password || !role || !district) {
      return res.status(400).json({
        status: "fail",
        message: "Please fill in all required fields (name, phone, password, role, district)",
      });
    }

    // Check if user already exists
    let existingUser;
    if (process.env.USE_MOCK_DB === "true") {
      existingUser = users.find((u) => u.phone === phone);
    } else {
      existingUser = await User.findOne({ phone });
    }

    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "A user with this phone number already exists",
      });
    }

    // Farmers require policy ID
    if (role === "farmer" && !policyId) {
      return res.status(400).json({
        status: "fail",
        message: "Farmers must provide an Insurance Policy ID",
      });
    }

    // Check unique Policy ID if provided
    if (policyId) {
      let existingPolicy;
      if (process.env.USE_MOCK_DB === "true") {
        existingPolicy = users.find((u) => u.policyId === policyId);
      } else {
        existingPolicy = await User.findOne({ policyId });
      }
      
      if (existingPolicy) {
        return res.status(400).json({
          status: "fail",
          message: "This Policy ID has already been registered",
        });
      }
    }

    let newUser;
    if (process.env.USE_MOCK_DB === "true") {
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
      newUser = await User.create({
        name,
        email,
        phone,
        password,
        role,
        policyId,
        district,
        state,
      });
    }

    const token = signToken(newUser._id.toString());

    // Exclude password from response
    const userObj = { ...((newUser as any).toObject ? (newUser as any).toObject() : newUser) };
    delete (userObj as any).password;

    res.status(201).json({
      status: "success",
      token,
      user: userObj,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to register user",
    });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { phone, password, role } = req.body;

    if (!phone || !password || !role) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide phone number, password, and role",
      });
    }

    // Find user and select password explicitly
    let user;
    if (process.env.USE_MOCK_DB === "true") {
      if (role === "farmer") {
        user = users.find((u) => u.policyId === phone || u.phone === phone);
      } else {
        user = users.find((u) => u.phone === phone);
      }
    } else {
      if (role === "farmer") {
        user = await User.findOne({ $or: [{ policyId: phone }, { phone: phone }] }).select("+password");
      } else {
        user = await User.findOne({ phone }).select("+password");
      }
    }

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect phone number or password",
      });
    }

    // Check role match
    if (user.role !== role) {
      return res.status(401).json({
        status: "fail",
        message: `This account is not registered under the role: ${role}`,
      });
    }

    // Verify password (or policyId for farmer role)
    let isCorrect = false;
    if (process.env.USE_MOCK_DB === "true") {
      const isPasswordCorrect = bcrypt.compareSync(password, user.password);
      const isPolicyCorrect = user.policyId === password;
      isCorrect = isPasswordCorrect || isPolicyCorrect;
    } else {
      if (role === "farmer") {
        const isPasswordCorrect = await (user as any).comparePassword(password);
        const isPolicyCorrect = user.policyId === password;
        isCorrect = isPasswordCorrect || isPolicyCorrect;
      } else {
        isCorrect = await (user as any).comparePassword(password);
      }
    }

    if (!isCorrect) {
      return res.status(401).json({
        status: "fail",
        message: role === "farmer" 
          ? "Incorrect Farmer ID or Password" 
          : "Incorrect phone number or password",
      });
    }

    const token = signToken(user._id.toString());

    const userObj = { ...((user as any).toObject ? (user as any).toObject() : user) };
    delete (userObj as any).password;

    res.status(200).json({
      status: "success",
      token,
      user: userObj,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to log in",
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      user: req.user,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to load profile",
    });
  }
};
