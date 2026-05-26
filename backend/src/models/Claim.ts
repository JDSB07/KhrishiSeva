import { Schema, model } from "mongoose";

const ClaimSchema = new Schema(
  {
    survey: {
      type: Schema.Types.ObjectId,
      ref: "Survey",
      required: [true, "Survey reference is required"],
    },
    farmer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Farmer reference is required"],
    },
    policyId: {
      type: String,
      required: [true, "Policy ID is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Initiated", "Under Review", "Approved", "Rejected"],
      default: "Initiated",
    },
    estimatedPayout: {
      type: Number,
      required: true,
      default: 0,
    },
    approvedPayout: {
      type: Number,
      default: 0,
    },
    resolutionDate: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default model("Claim", ClaimSchema);
