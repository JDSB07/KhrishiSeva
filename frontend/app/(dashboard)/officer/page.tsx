"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/AuthContext";
import { useLanguage } from "../../../hooks/LanguageContext";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Filter, 
  TrendingUp, 
  Activity, 
  Search,
  MessageSquare,
  CloudSun,
  MapPin,
  Image as ImageIcon,
  Cpu
} from "lucide-react";
import api from "../../../services/api";

const DISTRICTS = ["All", "Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Rohtas", "Nalanda", "Saran", "Purnia", "Champaran"];
const DAMAGE_TYPES = ["All", "Flood", "Drought", "Pest", "Heavy Rain", "Other"];
const STATUSES = ["All", "Pending", "Approved", "Rejected", "Resurvey Required"];

export default function OfficerDashboard() {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedDamage, setSelectedDamage] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Selection for Review Detail Inspector
  const [selectedSurvey, setSelectedSurvey] = useState<any | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [weatherLog, setWeatherLog] = useState<any | null>(null);
  const [comments, setComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    mismatches: 0,
    approved: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/surveys");
      const list = res.data.surveys || [];
      setSubmissions(list);

      // Compute statistics
      const total = list.length;
      const pending = list.filter((s: any) => s.status === "Pending").length;
      const mismatches = list.filter((s: any) => s.gpsWeatherStatus === "Suspicious").length;
      const approved = list.filter((s: any) => s.status === "Approved").length;

      setStats({ total, pending, mismatches, approved });
    } catch (err) {
      console.error("Error fetching surveys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectSurveyForReview = async (survey: any) => {
    setSelectedSurvey(survey);
    setComments(survey.comments || "");
    setAiAnalysis(null);
    setWeatherLog(null);

    // Fetch related AI analysis and weather logs
    try {
      const aiRes = await api.get(`/surveys/${survey._id}/ai`);
      setAiAnalysis(aiRes.data.aiAnalysis || null);
    } catch (err) {
      console.error("No AI log found:", err);
    }

    try {
      const weatherRes = await api.get(`/surveys/${survey._id}/weather-log`);
      setWeatherLog(weatherRes.data.weatherLog || null);
    } catch (err) {
      console.error("No weather log found:", err);
    }
  };

  const handleStatusUpdate = async (status: "Approved" | "Rejected" | "Resurvey Required") => {
    if (!selectedSurvey) return;
    setActionLoading(true);
    try {
      await api.put(`/surveys/${selectedSurvey._id}/status`, {
        status,
        comments,
      });
      // Refresh list
      await fetchData();
      setSelectedSurvey(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update survey status");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered List
  const filteredSubmissions = submissions.filter((s) => {
    const matchDistrict = selectedDistrict === "All" || s.createdBy?.district === selectedDistrict || s.district === selectedDistrict;
    const matchDamage = selectedDamage === "All" || (s.damageDetails && s.damageDetails.damageType === selectedDamage);
    const matchStatus = selectedStatus === "All" || s.status === selectedStatus;
    return matchDistrict && matchDamage && matchStatus;
  });

  // Calculate damage breakdown counts for SVG chart
  const damageBreakdown = DAMAGE_TYPES.filter(d => d !== "All").map((type) => {
    const count = submissions.filter(s => s.damageDetails?.damageType === type).length;
    return { type, count };
  });
  const maxCount = Math.max(...damageBreakdown.map(d => d.count), 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-neutral-50/20 dark:bg-dark-bg/20 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-200 pb-6 mb-8 dark:border-neutral-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            {t("officer.title")}
          </h1>
          <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
            District Officer Dashboard • Active Region: {user?.district} District
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-dark-card dark:text-neutral-300 dark:hover:bg-neutral-800 transition shadow-sm"
        >
          Sync Records
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                {t("officer.totalSurveys")}
              </p>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mt-0.5">
                {stats.total}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50/80 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                {t("officer.pendingReview")}
              </p>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mt-0.5 animate-pulse">
                {stats.pending}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50/80 text-red-600 dark:bg-red-950/20 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                {t("officer.flaggedCount")}
              </p>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mt-0.5">
                {stats.mismatches}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                {t("officer.resolvedCount")}
              </p>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mt-0.5">
                {stats.approved}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-10">
        
        {/* Interactive Data SVG Chart */}
        <div className="lg:col-span-1 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 uppercase tracking-wide">
            Damage Category Distribution
          </h3>
          
          <div className="space-y-4">
            {damageBreakdown.map((item) => {
              const percentage = (item.count / maxCount) * 100;
              return (
                <div key={item.type} className="text-xs">
                  <div className="flex justify-between font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    <span>{t(`damageTypes.${item.type}`)}</span>
                    <span className="font-bold">{item.count} claims</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter and Table Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
          
          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-neutral-100 pb-4 dark:border-neutral-800">
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-neutral-400" />
              <h2 className="text-md font-bold text-neutral-900 dark:text-white">
                Verifications Log
              </h2>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {/* District */}
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-600 outline-none bg-transparent dark:border-neutral-800 dark:text-neutral-400"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d} className="dark:bg-dark-card">{d}</option>
                ))}
              </select>

              {/* Damage Type */}
              <select
                value={selectedDamage}
                onChange={(e) => setSelectedDamage(e.target.value)}
                className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-600 outline-none bg-transparent dark:border-neutral-800 dark:text-neutral-400"
              >
                {DAMAGE_TYPES.map((dt) => (
                  <option key={dt} value={dt} className="dark:bg-dark-card">{dt}</option>
                ))}
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-600 outline-none bg-transparent dark:border-neutral-800 dark:text-neutral-400"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st} className="dark:bg-dark-card">{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-20 text-center text-xs text-neutral-400">{t("common.loading")}</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-400">No submissions match current filters.</div>
          ) : (
            <>
              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 font-semibold dark:border-neutral-800">
                      <th className="py-3 px-2">Farmer / Policy</th>
                      <th className="py-3 px-2">Crop Details</th>
                      <th className="py-3 px-2">Damage Category</th>
                      <th className="py-3 px-2">Validation Status</th>
                      <th className="py-3 px-2">Decision</th>
                      <th className="py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub._id} className="hover:bg-neutral-50/50 dark:hover:bg-dark-bg/10">
                        <td className="py-3.5 px-2">
                          <p className="font-bold text-neutral-800 dark:text-neutral-200">{sub.farmerName}</p>
                          <span className="text-[10px] text-neutral-400">{sub.policyId}</span>
                        </td>
                        <td className="py-3.5 px-2">
                          <p>{sub.cropName}</p>
                          <span className="text-[10px] text-neutral-400">{sub.area} ac</span>
                        </td>
                        <td className="py-3.5 px-2 font-medium">
                          {sub.isDamaged ? sub.damageDetails?.damageType : "No Damage"}
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                            sub.gpsWeatherStatus === "Verified"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : sub.gpsWeatherStatus === "Suspicious"
                              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 animate-pulse"
                              : "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                          }`}>
                            {sub.gpsWeatherStatus === "Verified" && <CheckCircle2 className="h-3 w-3" />}
                            {sub.gpsWeatherStatus === "Suspicious" && <AlertTriangle className="h-3 w-3" />}
                            {sub.gpsWeatherStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            sub.status === "Approved"
                              ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400"
                              : sub.status === "Rejected"
                              ? "text-red-700 bg-red-50 dark:text-red-400"
                              : sub.status === "Resurvey Required"
                              ? "text-amber-700 bg-amber-50 dark:text-amber-400"
                              : "text-blue-700 bg-blue-50 dark:text-blue-400"
                          }`}>
                            {sub.status === "Approved" && <CheckCircle2 className="h-3 w-3" />}
                            {sub.status === "Rejected" && <XCircle className="h-3 w-3" />}
                            {sub.status === "Resurvey Required" && <AlertTriangle className="h-3 w-3" />}
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2">
                          <button
                            onClick={() => handleSelectSurveyForReview(sub)}
                            className="min-h-[48px] rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-3 py-1 font-bold text-[10px] transition"
                          >
                            Review Log
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards Layout */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredSubmissions.map((sub) => (
                  <div key={sub._id} className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-dark-bg/25">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">{sub.farmerName}</h4>
                        <p className="text-[10px] text-neutral-400">{sub.policyId}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        sub.status === "Approved"
                          ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400"
                          : sub.status === "Rejected"
                          ? "text-red-700 bg-red-50 dark:text-red-400"
                          : sub.status === "Resurvey Required"
                          ? "text-amber-700 bg-amber-50 dark:text-amber-400"
                          : "text-blue-700 bg-blue-50 dark:text-blue-400"
                      }`}>
                        {sub.status === "Approved" && <CheckCircle2 className="h-3 w-3" />}
                        {sub.status === "Rejected" && <XCircle className="h-3 w-3" />}
                        {sub.status === "Resurvey Required" && <AlertTriangle className="h-3 w-3" />}
                        {sub.status}
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-neutral-600 dark:text-neutral-300">{sub.cropName} • {sub.area} ac</p>
                      <p className="text-[10px] text-neutral-500 font-medium">Damage: {sub.isDamaged ? sub.damageDetails?.damageType : "None"}</p>
                    </div>
                    <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800 pt-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                        sub.gpsWeatherStatus === "Verified"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : sub.gpsWeatherStatus === "Suspicious"
                          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 animate-pulse"
                          : "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}>
                        {sub.gpsWeatherStatus === "Verified" && <CheckCircle2 className="h-3 w-3" />}
                        {sub.gpsWeatherStatus === "Suspicious" && <AlertTriangle className="h-3 w-3" />}
                        {sub.gpsWeatherStatus}
                      </span>
                      <button
                        onClick={() => handleSelectSurveyForReview(sub)}
                        className="min-h-[48px] rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-4 py-1 font-bold text-[10px] transition"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Review Inspector Overlay Dialog */}
      {selectedSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-dark-card max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 p-5 dark:border-neutral-800">
              <div>
                <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
                  Audit: Survey #{selectedSurvey._id.slice(-6)}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Submitted by {selectedSurvey.createdBy?.name || "AEW"} on {new Date(selectedSurvey.createdAt).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSurvey(null)}
                className="rounded-xl border border-neutral-200 hover:bg-neutral-50 p-1.5 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Split layout: Farmer + Survey details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Survey Report Metadata
                  </h4>
                  <div className="grid grid-cols-2 gap-4 border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 bg-neutral-50/30 dark:bg-dark-bg/20">
                    <div>
                      <p className="text-[10px] text-neutral-400">Farmer Name</p>
                      <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedSurvey.farmerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400">Insurance Policy ID</p>
                      <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedSurvey.policyId}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400">Crop Details</p>
                      <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedSurvey.cropName} ({selectedSurvey.cropType})</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400">Area of Land</p>
                      <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedSurvey.area} Acres</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400">Sowing Date</p>
                      <p className="font-bold text-neutral-800 dark:text-neutral-200">{new Date(selectedSurvey.sowingDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400">Damage Declared?</p>
                      <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedSurvey.isDamaged ? "Yes" : "No"}</p>
                    </div>
                  </div>

                  {selectedSurvey.isDamaged && (
                    <div className="border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 bg-red-50/20 dark:bg-red-950/10">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase mb-2">AEW Declared Damage</p>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <p className="text-[10px] text-neutral-400">Damage Category</p>
                          <p className="font-bold text-red-600 dark:text-red-400">{selectedSurvey.damageDetails?.damageType}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-400">Severity</p>
                          <p className="font-bold text-red-600 dark:text-red-400">{selectedSurvey.damageDetails?.damageSeverity}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400">Description</p>
                        <p className="text-neutral-600 dark:text-neutral-300 italic">"{selectedSurvey.damageDetails?.damageDescription}"</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Media Image previews */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" /> Geotagged Media Proof
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSurvey.images && selectedSurvey.images.length > 0 ? (
                      selectedSurvey.images.map((img: string, idx: number) => (
                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 dark:border-neutral-800">
                          <img src={img} alt="Crop image" className="object-cover w-full h-full" />
                        </div>
                      ))
                    ) : (
                      <p className="text-neutral-400 py-6 text-center col-span-2">No images uploaded.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-neutral-100 p-3 dark:border-neutral-800 bg-neutral-50/50 dark:bg-dark-bg/25 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand-600" />
                    <div>
                      <p className="font-semibold">Survey Geolocation Coordinates</p>
                      <p className="text-[10px] text-neutral-400">
                        Latitude: {selectedSurvey.location.lat} • Longitude: {selectedSurvey.location.lng} (Accuracy: {selectedSurvey.location.accuracy || 5}m)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI & Weather Diagnostics Validation Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                {/* AI Validation */}
                <div className="border border-neutral-200 rounded-2xl p-5 dark:border-neutral-800 bg-neutral-50/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-3 flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-brand-600" />
                    {t("officer.aiCardTitle")}
                  </h4>
                  {aiAnalysis ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">{t("officer.aiHealth")}</span>
                        <span className="font-extrabold text-emerald-600">{aiAnalysis.cropHealth}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Diagnostic Category</span>
                        <span className="font-bold">{aiAnalysis.damageType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Severity Metric</span>
                        <span className={`font-bold ${aiAnalysis.severity === 'High' ? 'text-red-500' : 'text-amber-500'}`}>{aiAnalysis.severity}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">{t("officer.aiConfidence")}</span>
                        <span className="font-extrabold text-brand-600">{aiAnalysis.confidence}%</span>
                      </div>
                      {aiAnalysis.recommendation && (
                        <p className="text-[10px] text-neutral-500 italic mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                          Rec: {aiAnalysis.recommendation}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-neutral-400 py-4 text-center">AI analysis pending.</p>
                  )}
                </div>

                {/* Weather validation */}
                <div className="border border-neutral-200 rounded-2xl p-5 dark:border-neutral-800 bg-neutral-50/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-3 flex items-center gap-1.5">
                    <CloudSun className="h-4 w-4 text-blue-500" />
                    {t("officer.weatherCardTitle")}
                  </h4>
                  {selectedSurvey.weatherData ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">{t("officer.weatherTemp")}</span>
                        <span className="font-bold">{selectedSurvey.weatherData.temp || 27}°C</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">{t("officer.weatherHumidity")}</span>
                        <span className="font-bold">{selectedSurvey.weatherData.humidity || 75}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">{t("officer.weatherWind")}</span>
                        <span className="font-bold">{selectedSurvey.weatherData.windSpeed || 8} km/h</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">{t("officer.weatherVerdict")}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          selectedSurvey.gpsWeatherStatus === "Verified" 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "bg-red-50 text-red-700 animate-pulse"
                        }`}>
                          {selectedSurvey.gpsWeatherStatus === "Verified" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                          {selectedSurvey.gpsWeatherStatus}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-neutral-400 py-4 text-center">Weather records not loaded.</p>
                  )}
                </div>
              </div>

              {/* Review Audit Actions */}
              <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wide">
                    {t("officer.officerRemarks")}
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={t("officer.remarksPlaceholder")}
                    rows={3}
                    className="w-full rounded-xl border-slate-400 border bg-transparent py-2.5 px-3.5 text-xs text-neutral-900 outline-none focus:ring-2 focus:ring-primary dark:border-neutral-800 dark:text-white transition"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleStatusUpdate("Resurvey Required")}
                    disabled={actionLoading}
                    className="min-h-[48px] rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100/50 text-amber-700 px-4 py-2.5 font-bold transition disabled:opacity-50 text-xs"
                  >
                    {t("officer.requestResurvey")}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("Rejected")}
                    disabled={actionLoading}
                    className="min-h-[48px] rounded-xl border border-red-200 bg-red-50 hover:bg-red-100/50 text-red-700 px-4 py-2.5 font-bold transition disabled:opacity-50 text-xs"
                  >
                    {t("officer.reject")}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("Approved")}
                    disabled={actionLoading}
                    className="min-h-[48px] rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white px-5 py-2.5 font-bold transition disabled:opacity-50 text-xs shadow-md shadow-brand-500/10"
                  >
                    {t("officer.approve")}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
