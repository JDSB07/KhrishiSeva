import { Schema, model } from "mongoose";

const WeatherLogSchema = new Schema(
  {
    survey: {
      type: Schema.Types.ObjectId,
      ref: "Survey",
      required: [true, "Survey reference is required"],
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    weatherFetched: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["Match", "Mismatch"],
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("WeatherLog", WeatherLogSchema);
