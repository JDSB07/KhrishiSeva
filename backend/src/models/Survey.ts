import { Schema, model, Types } from "mongoose";

const SurveySchema = new Schema(
  {
    farmerName: {
      type: String,
      required: [true, "Farmer name is required"],
      trim: true,
    },
    farmerPhone: {
      type: String,
      required: [true, "Farmer phone is required"],
      trim: true,
    },
    policyId: {
      type: String,
      required: [true, "Policy ID is required"],
      trim: true,
    },
    cropName: {
      type: String,
      required: [true, "Crop name is required"],
      trim: true,
    },
    cropType: {
      type: String,
      required: [true, "Crop type/variety is required"],
      trim: true,
    },
    area: {
      type: Number,
      required: [true, "Crop area in acres is required"],
      min: [0.01, "Area must be greater than 0"],
    },
    sowingDate: {
      type: Date,
      required: [true, "Seed sowing date is required"],
    },
    isDamaged: {
      type: Boolean,
      required: [true, "Please specify if crop is damaged"],
      default: false,
    },
    damageDetails: {
      damageType: {
        type: String,
        enum: ["Flood", "Drought", "Pest", "Heavy Rain", "Other"],
      },
      damageDescription: {
        type: String,
        trim: true,
      },
      damageSeverity: {
        type: String,
        enum: ["Low", "Medium", "High"],
      },
    },
    images: {
      type: [String],
      required: [true, "At least one crop image is required"],
    },
    location: {
      lat: {
        type: Number,
        required: [true, "Latitude is required"],
      },
      lng: {
        type: Number,
        required: [true, "Longitude is required"],
      },
      accuracy: {
        type: Number,
      },
    },
    weatherData: {
      temp: Number,
      humidity: Number,
      windSpeed: Number,
      description: String,
      rawResponse: Schema.Types.Mixed,
    },
    gpsWeatherStatus: {
      type: String,
      enum: ["Verified", "Suspicious", "Pending"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Resurvey Required"],
      default: "Pending",
    },
    comments: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User submitting the survey is required"],
    },
  },
  {
    timestamps: true,
  }
);

export default model("Survey", SurveySchema);
