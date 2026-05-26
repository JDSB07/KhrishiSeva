import { Response } from "express";
import Notification from "../models/Notification";
import { AuthRequest } from "../middleware/authMiddleware";
import { notifications } from "../utils/mockDb";

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.USE_MOCK_DB === "true") {
      const myNotifs = notifications
        .filter((n) => n.recipient === req.user._id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 50);

      return res.status(200).json({
        status: "success",
        results: myNotifs.length,
        notifications: myNotifs,
      });
    }

    const notificationsList = await Notification.find({ recipient: req.user._id })
      .sort("-createdAt")
      .limit(50);

    res.status(200).json({
      status: "success",
      results: notificationsList.length,
      notifications: notificationsList,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to load notifications",
    });
  }
};

export const markNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.USE_MOCK_DB === "true") {
      notifications.forEach((n) => {
        if (n.recipient === req.user._id && !n.read) {
          n.read = true;
        }
      });
      
      return res.status(200).json({
        status: "success",
        message: "All notifications marked as read",
      });
    }

    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      status: "success",
      message: "All notifications marked as read",
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to update notification states",
    });
  }
};
