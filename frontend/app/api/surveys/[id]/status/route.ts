import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserFromReq } from '@/lib/auth';
import Survey from '@/lib/models/Survey';

export const dynamic = 'force-dynamic';
import Claim from '@/lib/models/Claim';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = await getUserFromReq(req);
    if (!user || user.role !== 'officer') {
      return NextResponse.json({ status: "fail", message: "Unauthorized" }, { status: 403 });
    }

    const { status, comments } = await req.json();

    if (!status || !["Approved", "Rejected", "Resurvey Required"].includes(status)) {
      return NextResponse.json({
        status: "fail",
        message: "Please provide a valid status update ('Approved', 'Rejected', 'Resurvey Required')"
      }, { status: 400 });
    }

    const surveyId = params.id;

    if (process.env.USE_MOCK_DB === "true") {
      const { surveys, claims, notifications, users } = require('@/lib/mockDb');
      const survey = surveys.find((s: any) => s._id === surveyId);
      if (!survey) {
        return NextResponse.json({ status: "fail", message: "Survey report not found" }, { status: 404 });
      }

      survey.status = status;
      survey.comments = comments || "";

      const claim = claims.find((c: any) => c.survey === surveyId);
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

      const farmerUser = users.find((u: any) => u.phone === survey.farmerPhone && u.role === "farmer");
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

        notifications.push({
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
        });
      }

      return NextResponse.json({ status: "success", survey, claim }, { status: 200 });
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ status: "fail", message: "Survey report not found" }, { status: 404 });
    }

    survey.status = status;
    survey.comments = comments || "";
    await survey.save();

    const claim = await Claim.findOne({ survey: survey._id });
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

    const farmerUser = await User.findOne({ phone: survey.farmerPhone, role: "farmer" });
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

      await Notification.create({
        recipient: farmerUser._id,
        titleEn,
        titleHi,
        messageEn,
        messageHi,
        type: status === "Approved" ? "approved" : status === "Rejected" ? "rejected" : "resurvey",
        surveyId: survey._id,
      });
    }

    return NextResponse.json({ status: "success", survey, claim }, { status: 200 });

  } catch (error: any) {
    console.error("[API ERROR TRACE]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
