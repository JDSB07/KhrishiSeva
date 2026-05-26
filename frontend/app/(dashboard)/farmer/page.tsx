"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/AuthContext";
import { useLanguage } from "../../../hooks/LanguageContext";
import { 
  FileText, 
  MapPin, 
  TrendingUp, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  ShieldCheck,
  Building,
  XCircle
} from "lucide-react";
import api from "../../../services/api";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [surveys, setSurveys] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFarmerData = async () => {
      setLoading(true);
      try {
        // Fetch farmer's own surveys
        const surveysRes = await api.get("/surveys/my-surveys");
        setSurveys(surveysRes.data.surveys || []);

        // Fetch farmer's claims
        const claimsRes = await api.get("/claims/my-claims");
        setClaims(claimsRes.data.claims || []);
      } catch (err) {
        console.error("Error fetching farmer data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerData();
  }, [user]);

  const getTimelineStep = (status: string) => {
    switch (status) {
      case "Approved":
        return 3;
      case "Rejected":
        return 3;
      case "Resurvey Required":
        return 1;
      case "Pending":
      default:
        return 2;
    }
  };

  const getTimelineStatusIcon = (step: number, activeStep: number, isRejected: boolean) => {
    if (step < activeStep) {
      return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
    } else if (step === activeStep) {
      if (isRejected) {
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 animate-pulse" />;
      }
      return <Clock className="h-5 w-5 text-brand-600 dark:text-brand-400 animate-pulse" />;
    } else {
      return <div className="h-3 w-3 rounded-full bg-neutral-200 dark:bg-neutral-800" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-neutral-50/20 dark:bg-dark-bg/20 min-h-screen">
      
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 mb-8 dark:border-neutral-800">
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
          {t("common.welcome")}, {user?.name}
        </h1>
        <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
          {t("farmer.policyDetails")}: <span className="font-bold text-neutral-700 dark:text-neutral-200">{user?.policyId}</span> • District: {user?.district}
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-neutral-400">{t("common.loading")}</div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Policy Information Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                {t("farmer.activePolicies")}
              </h2>
              
              <div className="rounded-xl bg-neutral-50 p-4 dark:bg-dark-bg/40 border border-neutral-100 dark:border-neutral-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 uppercase tracking-wider font-semibold">Policy Number</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">{user?.policyId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 uppercase tracking-wider font-semibold">Coverage Status</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 uppercase tracking-wider font-semibold">Covered Land</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">5.5 Acres</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 uppercase tracking-wider font-semibold">Primary Insurer</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" /> AIC India
                  </span>
                </div>
              </div>
            </div>

            {/* Claim Settlement Payout Stat */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card bg-gradient-to-br from-white to-brand-50/20 dark:from-dark-card dark:to-[#122017]/30">
              <h3 className="text-sm font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                Total Claims Payout
              </h3>
              <div className="flex items-baseline gap-1.5 text-neutral-900 dark:text-white">
                <span className="text-3xl font-extrabold">
                  ₹{claims.reduce((acc, c) => acc + (c.approvedPayout || 0), 0).toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-neutral-400">INR</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                Payouts are auto-disbursed directly to your Aadhaar-linked bank account upon officer resolution approval.
              </p>
            </div>
          </div>

          {/* Active Claim Timeline Progress */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">
                {t("farmer.claimStatus")}
              </h2>

              {surveys.length === 0 ? (
                <div className="py-12 text-center text-sm text-neutral-400">
                  No survey reports filed yet for your policy. An AEW worker needs to visit your farm to file a survey.
                </div>
              ) : (
                surveys.map((survey) => {
                  const step = getTimelineStep(survey.status);
                  const isRejected = survey.status === "Rejected" || survey.status === "Resurvey Required";

                  return (
                    <div key={survey._id} className="border-b border-neutral-100 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0 dark:border-neutral-800">
                      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2 text-xs">
                        <div>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">
                            {survey.cropName} ({survey.cropType})
                          </span>
                          <span className="text-neutral-400 ml-2">• Submitted {new Date(survey.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold ${
                            survey.status === "Approved" 
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : isRejected 
                              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                          }`}>
                            {survey.status === "Approved" && <CheckCircle className="h-3 w-3" />}
                            {survey.status === "Rejected" && <XCircle className="h-3 w-3" />}
                            {survey.status === "Resurvey Required" && <AlertCircle className="h-3 w-3" />}
                            {survey.status}
                          </span>
                        </div>
                      </div>

                      {/* Visual Timeline Row */}
                      <div className="relative flex items-center justify-between mt-6 px-4">
                        <div className="absolute top-[48%] left-8 right-8 h-0.5 bg-neutral-200 dark:bg-neutral-800 -z-10" />

                        {/* Step 1 */}
                        <div className="flex flex-col items-center">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-dark-card border-2 ${
                            step >= 1 ? "border-brand-500" : "border-neutral-200 dark:border-neutral-800"
                          }`}>
                            {getTimelineStatusIcon(1, step, isRejected)}
                          </div>
                          <span className="text-[10px] font-semibold text-neutral-500 mt-2 text-center max-w-[80px]">
                            {t("farmer.timelineSubmitted")}
                          </span>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-dark-card border-2 ${
                            step >= 2 ? "border-brand-500" : "border-neutral-200 dark:border-neutral-800"
                          }`}>
                            {getTimelineStatusIcon(2, step, isRejected)}
                          </div>
                          <span className="text-[10px] font-semibold text-neutral-500 mt-2 text-center max-w-[100px]">
                            {t("farmer.timelineReview")}
                          </span>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-dark-card border-2 ${
                            step >= 3 ? (isRejected ? "border-red-500" : "border-brand-500") : "border-neutral-200 dark:border-neutral-800"
                          }`}>
                            {getTimelineStatusIcon(3, step, isRejected)}
                          </div>
                          <span className="text-[10px] font-semibold text-neutral-500 mt-2 text-center max-w-[100px]">
                            {isRejected ? t("farmer.timelineRejected") : t("farmer.timelineApproved")}
                          </span>
                        </div>
                      </div>

                      {survey.comments && (
                        <div className="mt-6 rounded-xl bg-neutral-50 p-3.5 text-xs text-neutral-600 border border-neutral-100 dark:bg-dark-bg/25 dark:text-neutral-400 dark:border-neutral-800">
                          <p className="font-semibold text-neutral-700 dark:text-neutral-300">Officer Remarks:</p>
                          <p className="mt-0.5">{survey.comments}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Payout History / Records */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                {t("farmer.claimHistory")}
              </h2>

              {claims.length === 0 ? (
                <p className="text-xs text-neutral-400 py-4 text-center">No past claims logged.</p>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {claims.map((claim) => (
                    <div key={claim._id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200">
                          Policy ID: {claim.policyId}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          Status: {claim.status} • Resolution Date: {claim.resolutionDate ? new Date(claim.resolutionDate).toLocaleDateString() : "Pending"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-neutral-900 dark:text-white">
                          ₹{claim.approvedPayout || claim.estimatedPayout || 0}
                        </span>
                        <span className="text-[9px] text-neutral-400 block">Payout Approved</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
