import { Router } from "express";
import { getClaims, getMyClaims, getClaimById } from "../controllers/claimController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = Router();

// Get all claims - Officers only
router.get("/", protect, restrictTo("officer"), getClaims);

// Get my claims - Farmers only
router.get("/my-claims", protect, restrictTo("farmer"), getMyClaims);

// Get individual claim details
router.get("/:id", protect, getClaimById);

export default router;
