import { Router } from "express";
import { getNotifications, markNotificationsAsRead } from "../controllers/notificationController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// Get user's notifications
router.get("/", protect, getNotifications);

// Mark all as read
router.put("/mark-read", protect, markNotificationsAsRead);

export default router;
