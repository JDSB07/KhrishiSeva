import { Schema, model } from "mongoose";

const AIAnalysisSchema = new Schema(
  {
    survey: {
      type: Schema.Types.ObjectId,
      ref: "Survey",
      required: [true, "Survey reference is required"],
    },
    cropHealth: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    damageType: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    recommendation: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("AIAnalysis", AIAnalysisSchema);
