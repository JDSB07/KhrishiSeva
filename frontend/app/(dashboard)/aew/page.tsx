"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/AuthContext";
import { useLanguage } from "../../../hooks/LanguageContext";
import { useRouter } from "next/navigation";
import { 
  ClipboardCheck, 
  FileText, 
  FileWarning, 
  Clock, 
  RefreshCw, 
  Plus, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import api from "../../../services/api";

interface DraftSurvey {
  id: string;
  farmerName: string;
  cropName: string;
  cropType: string;
  area: number;
  isDamaged: boolean;
  savedAt: string;
}

export default function AewDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [drafts, setDrafts] = useState<DraftSurvey[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    rejected: 0,
  });

  // Track online status
  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch surveys and drafts
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch submitted surveys from backend
      const res = await api.get("/surveys/my-surveys");
      const list = res.data.surveys || [];
      setSubmissions(list);

      // Compute stats
      const pending = list.filter((s: any) => s.status === "Pending").length;
      const completed = list.filter((s: any) => s.status === "Approved").length;
      const rejected = list.filter((s: any) => s.status === "Rejected" || s.status === "Resurvey Required").length;
      
      setStats({ completed, pending, rejected });
    } catch (err) {
      console.error("Error fetching surveys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    loadDrafts();
  }, [user]);

  const loadDrafts = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("survey_drafts");
      if (stored) {
        setDrafts(JSON.parse(stored));
      } else {
        setDrafts([]);
      }
    }
  };

  const deleteDraft = (id: string) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem("survey_drafts", JSON.stringify(updated));
  };

  const handleSyncDrafts = async () => {
    if (!online || drafts.length === 0) return;
    setSyncing(true);
    try {
      // Loop drafts and post
      for (const draft of drafts) {
        // Find full draft object in localStorage
        const fullDraftStr = localStorage.getItem(`draft_${draft.id}`);
        if (fullDraftStr) {
          const fullDraft = JSON.parse(fullDraftStr);
          await api.post("/surveys", fullDraft);
          // Clean up
          localStorage.removeItem(`draft_${draft.id}`);
        }
      }
      // Clear drafts list
      localStorage.removeItem("survey_drafts");
      setDrafts([]);
      await fetchData();
    } catch (err) {
      console.error("Sync failed:", err);
      alert("Some drafts failed to sync. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20";
      case "Rejected":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20";
      case "Resurvey Required":
        return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20";
      default:
        return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-neutral-50/20 dark:bg-dark-bg/20 min-h-screen">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-6 mb-8 dark:border-neutral-800">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            {t("common.welcome")}, {user?.name}
          </h1>
          <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
            District: {user?.district} • Role: {t("common.aewWorker")}
          </p>
        </div>

        {/* Network Status Badge */}
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          {online ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <Wifi className="h-3.5 w-3.5" />
              Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400 animate-pulse">
              <WifiOff className="h-3.5 w-3.5" />
              Offline Mode
            </span>
          )}

          <button
            onClick={() => router.push("/aew/survey")}
            className="min-h-[48px] flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/10 hover:from-brand-700 hover:to-brand-600 transition"
          >
            <Plus className="h-4 w-4" />
            {t("aew.startSurvey")}
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
                {t("aew.surveyCount")}
              </p>
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                {stats.completed}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
                {t("aew.pendingCount")}
              </p>
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                {stats.pending}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileWarning className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
                {t("aew.rejectedCount")}
              </p>
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                {stats.rejected}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Offline Drafts */}
        <div className="lg:col-span-1 border border-neutral-200 rounded-2xl bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4 dark:border-neutral-800">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {t("aew.activeDrafts")} ({drafts.length})
            </h2>
            {drafts.length > 0 && online && (
              <button
                onClick={handleSyncDrafts}
                disabled={syncing}
                className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 disabled:opacity-50 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                {t("aew.syncDrafts")}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {drafts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-neutral-400 dark:text-neutral-500">{t("aew.noDrafts")}</p>
              </div>
            ) : (
              drafts.map((d) => (
                <div key={d.id} className="rounded-xl border border-neutral-100 p-4 dark:border-neutral-800 flex justify-between items-start bg-neutral-50/50 dark:bg-dark-bg/25">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      {d.farmerName}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {d.cropName} ({d.cropType})
                    </p>
                    <span className="text-[10px] text-neutral-400 block mt-2">
                      Saved {new Date(d.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submitted Surveys List */}
        <div className="lg:col-span-2 border border-neutral-200 rounded-2xl bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4 dark:border-neutral-800">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {t("aew.pastSurveys")}
            </h2>
            <button
              onClick={fetchData}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-neutral-400">{t("common.loading")}</div>
          ) : submissions.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-neutral-400 dark:text-neutral-500">No surveys submitted yet.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 font-semibold dark:border-neutral-800">
                      <th className="py-3 px-2">{t("surveyForm.farmerName")}</th>
                      <th className="py-3 px-2">{t("surveyForm.cropName")}</th>
                      <th className="py-3 px-2">{t("surveyForm.area")}</th>
                      <th className="py-3 px-2">Weather Block</th>
                      <th className="py-3 px-2">{t("common.status")}</th>
                      <th className="py-3 px-2">Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {submissions.map((s) => (
                      <tr key={s._id} className="hover:bg-neutral-50/50 dark:hover:bg-dark-bg/10">
                        <td className="py-3 px-2 font-bold text-neutral-800 dark:text-neutral-200">
                          {s.farmerName}
                        </td>
                        <td className="py-3 px-2 text-neutral-600 dark:text-neutral-400">
                          {s.cropName}
                        </td>
                        <td className="py-3 px-2 text-neutral-600 dark:text-neutral-400">
                          {s.area} ac
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                            s.gpsWeatherStatus === "Verified" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                              : s.gpsWeatherStatus === "Suspicious"
                              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 animate-pulse"
                              : "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                          }`}>
                            {s.gpsWeatherStatus === "Verified" && <CheckCircle2 className="h-3 w-3" />}
                            {s.gpsWeatherStatus === "Suspicious" && <AlertTriangle className="h-3 w-3" />}
                            {s.gpsWeatherStatus}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusColor(s.status)}`}>
                            {s.status === "Approved" && <CheckCircle2 className="h-3 w-3" />}
                            {s.status === "Rejected" && <XCircle className="h-3 w-3" />}
                            {s.status === "Resurvey Required" && <AlertTriangle className="h-3 w-3" />}
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-neutral-400">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards Layout */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {submissions.map((s) => (
                  <div key={s._id} className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-dark-bg/25">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">{s.farmerName}</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.cropName} • {s.area} ac</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusColor(s.status)}`}>
                        {s.status === "Approved" && <CheckCircle2 className="h-3 w-3" />}
                        {s.status === "Rejected" && <XCircle className="h-3 w-3" />}
                        {s.status === "Resurvey Required" && <AlertTriangle className="h-3 w-3" />}
                        {s.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        s.gpsWeatherStatus === "Verified" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                          : s.gpsWeatherStatus === "Suspicious"
                          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 animate-pulse"
                          : "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                      }`}>
                        {s.gpsWeatherStatus === "Verified" && <CheckCircle2 className="h-3 w-3" />}
                        {s.gpsWeatherStatus === "Suspicious" && <AlertTriangle className="h-3 w-3" />}
                        {s.gpsWeatherStatus}
                      </span>
                      <span className="text-[10px] text-neutral-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
