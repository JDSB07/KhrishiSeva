import mongoose from 'mongoose';
import { Schema, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient reference is required"],
    },
    titleEn: {
      type: String,
      required: true,
      trim: true,
    },
    titleHi: {
      type: String,
      required: true,
      trim: true,
    },
    messageEn: {
      type: String,
      required: true,
      trim: true,
    },
    messageHi: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["survey_submitted", "approved", "rejected", "resurvey"],
      required: true,
    },
    surveyId: {
      type: Schema.Types.ObjectId,
      ref: "Survey",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);



