import { Response } from "express";
import Claim from "../models/Claim";
import { AuthRequest } from "../middleware/authMiddleware";
import { claims } from "../utils/mockDb";

export const getClaims = async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.USE_MOCK_DB === "true") {
      // Map related surveys to claims for display
      const { surveys, users } = require("../utils/mockDb");
      
      const populatedClaims = claims.map((c) => {
        const survey = surveys.find((s: any) => s._id === c.survey);
        const farmer = users.find((u: any) => u._id === c.farmer);
        return {
          ...c,
          survey: survey || { cropName: "Unknown", cropType: "Unknown", area: 0, status: c.status },
          farmer: farmer || { name: "Demo Farmer", phone: "9988776655", policyId: c.policyId }
        };
      });

      return res.status(200).json({
        status: "success",
        results: populatedClaims.length,
        claims: populatedClaims,
      });
    }

    const claimsList = await Claim.find({})
      .populate({
        path: "survey",
        select: "cropName cropType area district location status gpsWeatherStatus",
      })
      .populate("farmer", "name phone policyId district")
      .sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: claimsList.length,
      claims: claimsList,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to load claims list",
    });
  }
};

export const getMyClaims = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        status: "fail",
        message: "Only farmers can view their policy claims",
      });
    }

    if (process.env.USE_MOCK_DB === "true") {
      const { surveys } = require("../utils/mockDb");
      const myClaims = claims.filter((c) => c.farmer === req.user._id);

      const populatedClaims = myClaims.map((c) => {
        const survey = surveys.find((s: any) => s._id === c.survey);
        return {
          ...c,
          survey: survey || { cropName: "Unknown", cropType: "Unknown", area: 0, status: c.status }
        };
      });

      return res.status(200).json({
        status: "success",
        results: populatedClaims.length,
        claims: populatedClaims,
      });
    }

    const claimsList = await Claim.find({ farmer: req.user._id })
      .populate({
        path: "survey",
        select: "cropName cropType area sowingDate comments status images",
      })
      .sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: claimsList.length,
      claims: claimsList,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to retrieve your claims",
    });
  }
};

export const getClaimById = async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.USE_MOCK_DB === "true") {
      const claim = claims.find((c) => c._id === req.params.id);
      if (!claim) {
        return res.status(404).json({ status: "fail", message: "Claim not found" });
      }
      return res.status(200).json({ status: "success", claim });
    }

    const claim = await Claim.findById(req.params.id)
      .populate({
        path: "survey",
        select: "cropName cropType area location status",
      })
      .populate("farmer", "name phone policyId district");

    if (!claim) {
      return res.status(404).json({
        status: "fail",
        message: "Claim record not found",
      });
    }

    res.status(200).json({
      status: "success",
      claim,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to load claim details",
    });
  }
};
