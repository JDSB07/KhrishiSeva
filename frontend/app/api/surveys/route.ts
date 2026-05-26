import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserFromReq } from '@/lib/auth';
import Survey from '@/lib/models/Survey';
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
    if (!user || user.role !== 'aew') return NextResponse.json({ status: "fail", message: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const { farmerName, farmerPhone, policyId, cropName, cropType, area, sowingDate, isDamaged, damageDetails, images, location } = body;

    if (!farmerName || !farmerPhone || !policyId || !cropName || !cropType || !area || !sowingDate || !images || !location) {
      return NextResponse.json({ status: "fail", message: "Please fill in all required fields" }, { status: 400 });
    }

    const farmerUser = await User.findOne({ phone: farmerPhone, role: "farmer" });

    const weatherResult = await fetchAndVerifyWeather(location.lat, location.lng, isDamaged ? damageDetails?.damageType : undefined);
    const gpsWeatherStatus = weatherResult.isSuspicious ? "Suspicious" : "Verified";

    const newSurvey = await Survey.create({
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

    const aiResult = await analyzeCropDamage(cropName, isDamaged ? damageDetails?.damageType : "None");
    await AIAnalysis.create({
      survey: newSurvey._id, cropHealth: aiResult.cropHealth, damageType: aiResult.damageType,
      severity: isDamaged ? aiResult.severity : "Low", confidence: aiResult.confidence, recommendation: aiResult.recommendation,
    });

    let claimObj = null;
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
    if (!user || user.role !== 'officer') return NextResponse.json({ status: "fail", message: "Unauthorized" }, { status: 403 });

    const surveysList = await Survey.find({ district: user.district }).populate("createdBy", "name phone district").sort("-createdAt");
    return NextResponse.json({ status: "success", results: surveysList.length, surveys: surveysList }, { status: 200 });
  } catch (error: any) {
    console.error("[API ERROR TRACE]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
