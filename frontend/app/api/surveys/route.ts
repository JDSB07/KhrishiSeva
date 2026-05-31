import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserFromReq } from '@/lib/auth';
import Survey from '@/lib/models/Survey';

export const dynamic = 'force-dynamic';
import Claim from '@/lib/models/Claim';
import Notification from '@/lib/models/Notification';
import AIAnalysis from '@/lib/models/AIAnalysis';
import WeatherLog from '@/lib/models/WeatherLog';
import User from '@/lib/models/User';
import { fetchAndVerifyWeather } from '@/lib/services/weather';
import { analyzeCropDamage } from '@/lib/services/ai';

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getUserFromReq(req);
    if (!user || user.role !== 'aew') {
      return NextResponse.json({ status: "fail", message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { farmerName, farmerPhone, policyId, cropName, cropType, area, sowingDate, isDamaged, damageDetails, images, location } = body;

    if (!farmerName || !farmerPhone || !policyId || !cropName || !cropType || !area || !sowingDate || !images || !location) {
      return NextResponse.json({ status: "fail", message: "Please fill in all required fields" }, { status: 400 });
    }

    // 1. Weather verification
    const weatherResult = await fetchAndVerifyWeather(location.lat, location.lng, isDamaged ? damageDetails?.damageType : undefined);
    const gpsWeatherStatus = weatherResult.isSuspicious ? "Suspicious" : "Verified";

    // 2. AI crop analysis
    const aiResult = await analyzeCropDamage(cropName, isDamaged ? damageDetails?.damageType : "None");

    let newSurvey: any;
    let claimObj = null;

    if (process.env.USE_MOCK_DB === "true") {
      const { surveys, claims, weatherLogs, aiAnalyses, notifications, users } = require('@/lib/mockDb');
      const farmerUser = users.find((u: any) => u.phone === farmerPhone && u.role === "farmer");

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
        createdBy: { _id: user._id, name: user.name, phone: user.phone, district: user.district },
        createdAt: new Date(),
        toObject() { return this; }
      };
      surveys.push(newSurvey);

      // Save Weather Log
      weatherLogs.push({
        _id: "mock_weatherlog_" + Date.now(),
        survey: newSurvey._id,
        coordinates: location,
        weatherFetched: weatherResult.rawResponse,
        status: weatherResult.isSuspicious ? "Mismatch" : "Match",
        reason: weatherResult.isSuspicious ? "Weather conflicts with claim" : "Weather correlates",
        createdAt: new Date()
      });

      // Save AI Analysis
      aiAnalyses.push({
        _id: "mock_ai_" + Date.now(),
        survey: newSurvey._id,
        cropHealth: aiResult.cropHealth,
        damageType: aiResult.damageType,
        severity: isDamaged ? aiResult.severity : "Low",
        confidence: aiResult.confidence,
        recommendation: aiResult.recommendation,
        createdAt: new Date()
      });

      // Save Claim
      if (isDamaged && farmerUser) {
        let ratePerAcre = aiResult.severity === "High" ? 10000 : aiResult.severity === "Medium" ? 5000 : 2000;
        claimObj = {
          _id: "mock_claim_" + Date.now(),
          survey: newSurvey._id,
          farmer: farmerUser._id,
          policyId,
          status: "Initiated",
          estimatedPayout: Math.round(parseFloat(area) * ratePerAcre),
          approvedPayout: 0,
          createdAt: new Date()
        };
        claims.push(claimObj);
      }

      // Notification for Farmer
      if (farmerUser) {
        notifications.push({
          _id: "mock_notif_" + Date.now(),
          recipient: farmerUser._id,
          titleEn: "Crop Damage Survey Submitted",
          titleHi: "फसल क्षति सर्वेक्षण जमा किया गया",
          messageEn: `An AEW worker has submitted a damage report for your ${cropName} crop.`,
          messageHi: `आपकी ${cropName} फसल के लिए एक नुकसान की रिपोर्ट प्रस्तुत की गई है।`,
          type: "survey_submitted",
          surveyId: newSurvey._id,
          read: false,
          createdAt: new Date()
        });
      }

      // Notifications for District Officers
      const districtOfficers = users.filter((u: any) => u.role === "officer" && u.district === user.district);
      districtOfficers.forEach((off: any) => {
        notifications.push({
          _id: "mock_notif_off_" + Date.now() + "_" + off._id,
          recipient: off._id,
          titleEn: `New Claim Pending Review`,
          titleHi: `नया दावा समीक्षा लंबित है`,
          messageEn: `A new survey was submitted by ${user.name}.`,
          messageHi: `${user.name} द्वारा एक नया सर्वेक्षण प्रस्तुत किया गया है।`,
          type: "survey_submitted",
          surveyId: newSurvey._id,
          read: false,
          createdAt: new Date()
        });
      });

    } else {
      const farmerUser = await User.findOne({ phone: farmerPhone, role: "farmer" });

      newSurvey = await Survey.create({
        farmerName, farmerPhone, policyId, cropName, cropType, area, sowingDate, isDamaged,
        damageDetails: isDamaged ? damageDetails : undefined, images, location,
        weatherData: { temp: weatherResult.temp, humidity: weatherResult.humidity, windSpeed: weatherResult.windSpeed, description: weatherResult.description, rawResponse: weatherResult.rawResponse },
        gpsWeatherStatus, status: "Pending", createdBy: user._id,
      });

      await WeatherLog.create({
        survey: newSurvey._id, coordinates: location, weatherFetched: weatherResult.rawResponse,
        status: weatherResult.isSuspicious ? "Mismatch" : "Match",
        reason: weatherResult.isSuspicious ? `Damage type conflicts with weather` : "Weather metrics correlate",
      });

      await AIAnalysis.create({
        survey: newSurvey._id, cropHealth: aiResult.cropHealth, damageType: aiResult.damageType,
        severity: isDamaged ? aiResult.severity : "Low", confidence: aiResult.confidence, recommendation: aiResult.recommendation,
      });

      if (isDamaged && farmerUser) {
        let ratePerAcre = aiResult.severity === "High" ? 10000 : aiResult.severity === "Medium" ? 5000 : 2000;
        claimObj = await Claim.create({ survey: newSurvey._id, farmer: farmerUser._id, policyId, status: "Initiated", estimatedPayout: Math.round(area * ratePerAcre) });
      }

      if (farmerUser) {
        await Notification.create({
          recipient: farmerUser._id, titleEn: "Crop Damage Survey Submitted", titleHi: "फसल क्षति सर्वेक्षण जमा किया गया",
          messageEn: `An AEW worker has submitted a damage report.`, messageHi: `रिपोर्ट जमा की गई है।`,
          type: "survey_submitted", surveyId: newSurvey._id,
        });
      }

      const officers = await User.find({ role: "officer", district: user.district });
      for (const off of officers) {
        await Notification.create({
          recipient: off._id, titleEn: `New Claim Pending`, titleHi: `नया दावा`,
          messageEn: `New survey submitted.`, messageHi: `नया सर्वेक्षण प्रस्तुत किया गया है।`,
          type: "survey_submitted", surveyId: newSurvey._id,
        });
      }
    }

    return NextResponse.json({ status: "success", survey: newSurvey, claim: claimObj, aiAnalysis: aiResult, weather: weatherResult }, { status: 201 });
  } catch (error: any) {
    console.error("[API ERROR TRACE]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = await getUserFromReq(req);
    if (!user || user.role !== 'officer') {
      return NextResponse.json({ status: "fail", message: "Unauthorized" }, { status: 403 });
    }

    if (process.env.USE_MOCK_DB === "true") {
      const { surveys } = require('@/lib/mockDb');
      // In mock DB mode, createdBy is populated directly. We filter surveys in same district
      const surveysList = surveys.filter((s: any) => s.createdBy && s.createdBy.district === user.district);
      
      return NextResponse.json({ status: "success", results: surveysList.length, surveys: surveysList }, { status: 200 });
    }

    // District filter logic: find users (farmers and AEW) in this district
    const farmersInDistrict = await User.find({ district: user.district, role: "farmer" });
    const farmerPhones = farmersInDistrict.map((f) => f.phone);
    const aewsInDistrict = await User.find({ district: user.district, role: "aew" });
    const aewIds = aewsInDistrict.map((a) => a._id);

    const filter = {
      $or: [
        { farmerPhone: { $in: farmerPhones } },
        { createdBy: { $in: aewIds } }
      ]
    };

    const surveysList = await Survey.find(filter)
      .populate("createdBy", "name phone district")
      .sort("-createdAt");

    return NextResponse.json({ status: "success", results: surveysList.length, surveys: surveysList }, { status: 200 });
  } catch (error: any) {
    console.error("[API ERROR TRACE]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
