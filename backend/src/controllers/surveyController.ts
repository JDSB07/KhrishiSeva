import { Response } from "express";
import Survey from "../models/Survey";
import Claim from "../models/Claim";
import Notification from "../models/Notification";
import AIAnalysis from "../models/AIAnalysis";
import WeatherLog from "../models/WeatherLog";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import { fetchAndVerifyWeather } from "../services/weather";
import { analyzeCropDamage } from "../services/ai";
import { 
  users, 
  surveys, 
  claims, 
  notifications, 
  aiAnalyses, 
  weatherLogs 
} from "../utils/mockDb";

export const createSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const {
      farmerName,
      farmerPhone,
      policyId,
      cropName,
      cropType,
      area,
      sowingDate,
      isDamaged,
      damageDetails,
      images,
      location,
    } = req.body;

    // Validation
    if (!farmerName || !farmerPhone || !policyId || !cropName || !cropType || !area || !sowingDate || !images || !location) {
      console.log("SURVEY VALIDATION FAILED:", { farmerName, farmerPhone, policyId, cropName, cropType, area, sowingDate, images: images ? images.length : 0, location });
      return res.status(400).json({
        status: "fail",
        message: "Please fill in all required fields",
      });
    }

    if (images.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "At least one crop image is required",
      });
    }

    // Find the Farmer account to link Claim payouts
    let farmerUser;
    if (process.env.USE_MOCK_DB === "true") {
      farmerUser = users.find((u) => u.phone === farmerPhone && u.role === "farmer");
    } else {
      farmerUser = await User.findOne({ phone: farmerPhone, role: "farmer" });
    }

    // 1. Fetch & Verify Weather (Anti-Fraud check)
    const weatherResult = await fetchAndVerifyWeather(
      location.lat,
      location.lng,
      isDamaged ? damageDetails?.damageType : undefined
    );

    const gpsWeatherStatus = weatherResult.isSuspicious ? "Suspicious" : "Verified";

    // 2. Create Survey Record
    let newSurvey;
    if (process.env.USE_MOCK_DB === "true") {
      newSurvey = {
        _id: "mock_survey_" + Date.now(),
        farmerName,
        farmerPhone,
        policyId,
        cropName,
        cropType,
        area: parseFloat(area),
        sowingDate: new Date(sowingDate),
        isDamaged,
        damageDetails: isDamaged ? damageDetails : undefined,
        images,
        location,
        weatherData: {
          temp: weatherResult.temp,
          humidity: weatherResult.humidity,
          windSpeed: weatherResult.windSpeed,
          description: weatherResult.description,
          rawResponse: weatherResult.rawResponse,
        },
        gpsWeatherStatus,
        status: "Pending",
        comments: "",
        createdBy: req.user,
        createdAt: new Date(),
        toObject() { return this; }
      };
      surveys.push(newSurvey);
    } else {
      newSurvey = await Survey.create({
        farmerName,
        farmerPhone,
        policyId,
        cropName,
        cropType,
        area,
        sowingDate,
        isDamaged,
        damageDetails: isDamaged ? damageDetails : undefined,
        images,
        location,
        weatherData: {
          temp: weatherResult.temp,
          humidity: weatherResult.humidity,
          windSpeed: weatherResult.windSpeed,
          description: weatherResult.description,
          rawResponse: weatherResult.rawResponse,
        },
        gpsWeatherStatus,
        status: "Pending",
        createdBy: req.user._id,
      });
    }

    // Log the weather check to WeatherLog database
    const mockWeatherLog = {
      _id: "mock_weatherlog_" + Date.now(),
      survey: newSurvey._id,
      coordinates: location,
      weatherFetched: weatherResult.rawResponse,
      status: weatherResult.isSuspicious ? "Mismatch" : "Match",
      reason: weatherResult.isSuspicious 
        ? `Damage type ${damageDetails?.damageType} conflicts with humidity ${weatherResult.humidity}% and description '${weatherResult.description}'` 
        : "Weather metrics correlate with declared damage status.",
      createdAt: new Date()
    };
    
    if (process.env.USE_MOCK_DB === "true") {
      weatherLogs.push(mockWeatherLog);
    } else {
      await WeatherLog.create({
        survey: newSurvey._id,
        coordinates: location,
        weatherFetched: weatherResult.rawResponse,
        status: weatherResult.isSuspicious ? "Mismatch" : "Match",
        reason: mockWeatherLog.reason,
      });
    }

    // 3. Trigger Mock AI Analysis
    const aiResult = await analyzeCropDamage(
      cropName,
      isDamaged ? damageDetails?.damageType : "None"
    );

    const mockAiAnalysis = {
      _id: "mock_ai_" + Date.now(),
      survey: newSurvey._id,
      cropHealth: aiResult.cropHealth,
      damageType: aiResult.damageType,
      severity: isDamaged ? aiResult.severity : "Low",
      confidence: aiResult.confidence,
      recommendation: aiResult.recommendation,
      createdAt: new Date()
    };

    if (process.env.USE_MOCK_DB === "true") {
      aiAnalyses.push(mockAiAnalysis);
    } else {
      await AIAnalysis.create({
        survey: newSurvey._id,
        cropHealth: aiResult.cropHealth,
        damageType: aiResult.damageType,
        severity: isDamaged ? aiResult.severity : "Low",
        confidence: aiResult.confidence,
        recommendation: aiResult.recommendation,
      });
    }

    // 4. Create Insurance Claim record (if damaged)
    let claimObj = null;
    if (isDamaged && farmerUser) {
      // Calculate estimated payout: ₹10,000 per acre for High severity, ₹5,000 for Medium, ₹2,000 for Low
      let ratePerAcre = 2000;
      const severity = isDamaged ? aiResult.severity : "Low";
      if (severity === "High") ratePerAcre = 10000;
      else if (severity === "Medium") ratePerAcre = 5000;

      const estimatedPayout = Math.round(area * ratePerAcre);

      if (process.env.USE_MOCK_DB === "true") {
        claimObj = {
          _id: "mock_claim_" + Date.now(),
          survey: newSurvey._id,
          farmer: farmerUser._id,
          policyId,
          status: "Initiated",
          estimatedPayout,
          approvedPayout: 0,
          createdAt: new Date(),
          toObject() { return this; }
        };
        claims.push(claimObj);
      } else {
        claimObj = await Claim.create({
          survey: newSurvey._id,
          farmer: farmerUser._id,
          policyId,
          status: "Initiated",
          estimatedPayout,
        });
      }
    }

    // 5. Send Notification Alerts
    // Notification for Farmer
    if (farmerUser) {
      const fNotif = {
        _id: "mock_notif_farmer_" + Date.now(),
        recipient: farmerUser._id,
        titleEn: "Crop Damage Survey Submitted",
        titleHi: "फसल क्षति सर्वेक्षण जमा किया गया",
        messageEn: `An AEW worker has submitted a damage report for your ${cropName} crop. Status is currently pending review.`,
        messageHi: `एक कृषि कार्यकर्ता ने आपकी ${cropName} फसल के लिए नुकसान की रिपोर्ट जमा की है। स्थिति अभी समीक्षा के लिए लंबित है।`,
        type: "survey_submitted",
        surveyId: newSurvey._id,
        read: false,
        createdAt: new Date()
      };
      
      if (process.env.USE_MOCK_DB === "true") {
        notifications.push(fNotif);
      } else {
        await Notification.create({
          recipient: farmerUser._id,
          titleEn: fNotif.titleEn,
          titleHi: fNotif.titleHi,
          messageEn: fNotif.messageEn,
          messageHi: fNotif.messageHi,
          type: "survey_submitted",
          surveyId: newSurvey._id,
        });
      }
    }

    // Notification for Officer
    let officers = [];
    if (process.env.USE_MOCK_DB === "true") {
      officers = users.filter((u) => u.role === "officer" && u.district === req.user.district);
    } else {
      officers = await User.find({ role: "officer", district: req.user.district });
    }

    for (const off of officers) {
      const oNotif = {
        _id: "mock_notif_officer_" + Date.now() + "_" + Math.random().toString(36).slice(-4),
        recipient: off._id,
        titleEn: `New Claim Pending Review: Policy #${policyId}`,
        titleHi: `नया दावा समीक्षा लंबित है: पॉलिसी #${policyId}`,
        messageEn: `A new survey was submitted by ${req.user.name} for farmer ${farmerName}. Weather matching status is: ${gpsWeatherStatus}.`,
        messageHi: `${req.user.name} द्वारा किसान ${farmerName} के लिए एक नया सर्वेक्षण प्रस्तुत किया गया है। मौसम मिलान स्थिति: ${gpsWeatherStatus} है।`,
        type: "survey_submitted",
        surveyId: newSurvey._id,
        read: false,
        createdAt: new Date()
      };

      if (process.env.USE_MOCK_DB === "true") {
        notifications.push(oNotif);
      } else {
        await Notification.create({
          recipient: off._id,
          titleEn: oNotif.titleEn,
          titleHi: oNotif.titleHi,
          messageEn: oNotif.messageEn,
          messageHi: oNotif.messageHi,
          type: "survey_submitted",
          surveyId: newSurvey._id,
        });
      }
    }

    res.status(201).json({
      status: "success",
      survey: newSurvey,
      claim: claimObj,
      aiAnalysis: aiResult,
      weather: weatherResult,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to create survey report",
    });
  }
};

export const getSurveys = async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.USE_MOCK_DB === "true") {
      let list = [...surveys];
      if (req.user.role === "officer") {
        list = surveys.filter((s) => s.createdBy?.district === req.user.district || s.district === req.user.district);
      }
      return res.status(200).json({
        status: "success",
        results: list.length,
        surveys: list,
      });
    }

    let filter: any = {};
    if (req.user.role === "officer") {
      filter.district = req.user.district;
    }

    const surveysList = await Survey.find(filter)
      .populate("createdBy", "name phone district")
      .sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: surveysList.length,
      surveys: surveysList,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to retrieve survey records",
    });
  }
};

export const getMySurveys = async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.USE_MOCK_DB === "true") {
      let list = [];
      if (req.user.role === "aew") {
        list = surveys.filter((s) => s.createdBy?._id === req.user._id);
      } else if (req.user.role === "farmer") {
        list = surveys.filter((s) => s.policyId === req.user.policyId);
      }
      return res.status(200).json({
        status: "success",
        results: list.length,
        surveys: list,
      });
    }

    let filter: any = {};
    if (req.user.role === "aew") {
      filter.createdBy = req.user._id;
    } else if (req.user.role === "farmer") {
      filter.policyId = req.user.policyId;
    } else {
      return res.status(403).json({
        status: "fail",
        message: "Unauthorized access to these records",
      });
    }

    const surveysList = await Survey.find(filter)
      .populate("createdBy", "name phone district")
      .sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: surveysList.length,
      surveys: surveysList,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to retrieve your surveys",
    });
  }
};

export const getSurveyById = async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.USE_MOCK_DB === "true") {
      const survey = surveys.find((s) => s._id === req.params.id);
      if (!survey) {
        return res.status(404).json({ status: "fail", message: "Survey not found" });
      }
      return res.status(200).json({ status: "success", survey });
    }

    const survey = await Survey.findById(req.params.id).populate("createdBy", "name phone district");
    
    if (!survey) {
      return res.status(404).json({
        status: "fail",
        message: "Survey report not found",
      });
    }

    res.status(200).json({
      status: "success",
      survey,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to load survey report details",
    });
  }
};

export const updateSurveyStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, comments } = req.body;
    
    if (!status || !["Approved", "Rejected", "Resurvey Required"].includes(status)) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide a valid status update ('Approved', 'Rejected', 'Resurvey Required')",
      });
    }

    let survey;
    if (process.env.USE_MOCK_DB === "true") {
      survey = surveys.find((s) => s._id === req.params.id);
    } else {
      survey = await Survey.findById(req.params.id);
    }

    if (!survey) {
      return res.status(404).json({
        status: "fail",
        message: "Survey report not found",
      });
    }

    // Update survey details
    survey.status = status;
    survey.comments = comments || "";
    
    if (process.env.USE_MOCK_DB !== "true") {
      await (survey as any).save();
    }

    // Update associated Claim record if exists
    let claim;
    if (process.env.USE_MOCK_DB === "true") {
      claim = claims.find((c) => c.survey === survey._id);
      if (claim) {
        if (status === "Approved") {
          claim.status = "Approved";
          claim.approvedPayout = claim.estimatedPayout;
          claim.resolutionDate = new Date();
        } else if (status === "Rejected") {
          claim.status = "Rejected";
          claim.resolutionDate = new Date();
        } else if (status === "Resurvey Required") {
          claim.status = "Under Review";
        }
        claim.remarks = comments || "";
      }
    } else {
      claim = await Claim.findOne({ survey: survey._id });
      if (claim) {
        if (status === "Approved") {
          claim.status = "Approved";
          claim.approvedPayout = claim.estimatedPayout;
          claim.resolutionDate = new Date();
        } else if (status === "Rejected") {
          claim.status = "Rejected";
          claim.resolutionDate = new Date();
        } else if (status === "Resurvey Required") {
          claim.status = "Under Review";
        }
        claim.remarks = comments || "";
        await claim.save();
      }
    }

    // Send Notification Alert to the Farmer
    let farmerUser;
    if (process.env.USE_MOCK_DB === "true") {
      farmerUser = users.find((u) => u.phone === survey.farmerPhone && u.role === "farmer");
    } else {
      farmerUser = await User.findOne({ phone: survey.farmerPhone, role: "farmer" });
    }

    if (farmerUser) {
      let titleEn = "";
      let titleHi = "";
      let messageEn = "";
      let messageHi = "";

      if (status === "Approved") {
        titleEn = "Insurance Claim Approved!";
        titleHi = "बीमा दावा स्वीकृत किया गया!";
        messageEn = `Your crop claim for ${survey.cropName} was approved. Approved payout: ₹${claim?.approvedPayout || 0}.`;
        messageHi = `आपकी ${survey.cropName} फसल के लिए आपका दावा स्वीकृत कर दिया गया है। स्वीकृत राशि: ₹${claim?.approvedPayout || 0} है।`;
      } else if (status === "Rejected") {
        titleEn = "Insurance Claim Rejected";
        titleHi = "बीमा दावा खारिज कर दिया गया";
        messageEn = `Your crop claim was rejected by review officer. Remarks: ${comments || "None"}.`;
        messageHi = `अधिकारी द्वारा आपका दावा खारिज कर दिया गया है। टिप्पणी: ${comments || "कोई नहीं"}।`;
      } else if (status === "Resurvey Required") {
        titleEn = "Resurvey Scheduled";
        titleHi = "पुनः सर्वेक्षण निर्धारित";
        messageEn = `The review officer has requested a resurvey of your field. Reason: ${comments || "None"}.`;
        messageHi = `समीक्षा अधिकारी ने आपके खेत के पुनः सर्वेक्षण का अनुरोध किया है। कारण: ${comments || "कोई नहीं"}।`;
      }

      const statusNotif = {
        _id: "mock_notif_status_" + Date.now(),
        recipient: farmerUser._id,
        titleEn,
        titleHi,
        messageEn,
        messageHi,
        type: status === "Approved" ? "approved" : status === "Rejected" ? "rejected" : "resurvey",
        surveyId: survey._id,
        read: false,
        createdAt: new Date()
      };

      if (process.env.USE_MOCK_DB === "true") {
        notifications.push(statusNotif);
      } else {
        await Notification.create({
          recipient: farmerUser._id,
          titleEn,
          titleHi,
          messageEn,
          messageHi,
          type: statusNotif.type,
          surveyId: survey._id,
        });
      }
    }

    res.status(200).json({
      status: "success",
      survey,
      claim,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to resolve survey audit status",
    });
  }
};

export const getSurveyAi = async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.USE_MOCK_DB === "true") {
      const aiAnalysis = aiAnalyses.find((a) => a.survey === req.params.id);
      if (!aiAnalysis) {
        return res.status(404).json({ status: "fail", message: "No AI analysis found" });
      }
      return res.status(200).json({ status: "success", aiAnalysis });
    }

    const aiAnalysis = await AIAnalysis.findOne({ survey: req.params.id });
    if (!aiAnalysis) {
      return res.status(404).json({
        status: "fail",
        message: "No AI analysis log found for this survey",
      });
    }
    res.status(200).json({
      status: "success",
      aiAnalysis,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to load AI logs",
    });
  }
};

export const getSurveyWeather = async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.USE_MOCK_DB === "true") {
      const weatherLog = weatherLogs.find((w) => w.survey === req.params.id);
      if (!weatherLog) {
        return res.status(404).json({ status: "fail", message: "No weather log found" });
      }
      return res.status(200).json({ status: "success", weatherLog });
    }

    const weatherLog = await WeatherLog.findOne({ survey: req.params.id });
    if (!weatherLog) {
      return res.status(404).json({
        status: "fail",
        message: "No weather verification log found for this survey",
      });
    }
    res.status(200).json({
      status: "success",
      weatherLog,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to load weather logs",
    });
  }
};
