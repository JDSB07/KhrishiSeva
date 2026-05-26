import { Router } from "express";
import { 
  createSurvey, 
  getSurveys, 
  getMySurveys, 
  getSurveyById, 
  updateSurveyStatus, 
  getSurveyAi, 
  getSurveyWeather 
} from "../controllers/surveyController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = Router();

// Create new survey - AEW workers only
router.post("/", protect, restrictTo("aew"), createSurvey);

// Get all surveys - Officers only
router.get("/", protect, restrictTo("officer"), getSurveys);

// Get my surveys - AEW workers (who created them) or Farmers (who are the subject)
router.get("/my-surveys", protect, restrictTo("aew", "farmer"), getMySurveys);

// Get individual survey details
router.get("/:id", protect, getSurveyById);

// Update survey status - Officers only
router.put("/:id/status", protect, restrictTo("officer"), updateSurveyStatus);

// Get related diagnostics
router.get("/:id/ai", protect, getSurveyAi);
router.get("/:id/weather-log", protect, getSurveyWeather);

export default router;
