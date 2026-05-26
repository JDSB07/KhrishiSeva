import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import surveyRoutes from "./routes/surveyRoutes";
import claimRoutes from "./routes/claimRoutes";
import notificationRoutes from "./routes/notificationRoutes";

// Connect to MongoDB
connectDB();

const app = express();

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
  app.use(morgan("dev"));
}

// Limit requests from same API (Rate Limiting)
const limiter = rateLimit({
  max: 10000, // Increased to 10000 requests to prevent HTTP 429 in dev/testing
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many requests from this IP, please try again in 15 minutes",
});
app.use("/api", limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  credentials: true,
};
app.use(cors(corsOptions));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Serve static uploads folder (created dynamically during image upload phase)
app.use("/uploads", express.static("uploads"));

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).send("KrishiSeva API is healthy");
});

// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to KrishiSeva API");
});

// 404 Route handler
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";
  
  res.status(statusCode).json({
    status,
    message: err.message || "Something went wrong on the server",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

// Handle unhandled rejections
process.on("unhandledRejection", (err: any) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: any) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});
