"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../hooks/AuthContext";
import { useLanguage } from "../../../../hooks/LanguageContext";
import { 
  Shield, 
  MapPin, 
  Camera, 
  FileText, 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Cpu,
  Trash2,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../../../../services/api";

const CROPS = ["Wheat (गेंहू)", "Paddy (धान)", "Maize (मक्का)", "Mustard (सरसों)", "Sugarcane (गन्ना)", "Pulses (दालें)"];
const DAMAGE_CATEGORIES = ["Flood", "Drought", "Pest", "Heavy Rain", "Other"];
const SEVERITIES = ["Low", "Medium", "High"];

export default function SurveyFormPage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();

  // Navigation step
  const [step, setStep] = useState(1);
  const [online, setOnline] = useState(true);

  // Form states
  const [farmerName, setFarmerName] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [cropName, setCropName] = useState(CROPS[0]);
  const [cropType, setCropType] = useState("");
  const [area, setArea] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  
  const [isDamaged, setIsDamaged] = useState<boolean>(false);
  const [damageType, setDamageType] = useState(DAMAGE_CATEGORIES[0]);
  const [damageDescription, setDamageDescription] = useState("");
  const [damageSeverity, setDamageSeverity] = useState(SEVERITIES[0]);

  // Geolocation
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");

  // Media
  const [images, setImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // AI Diagnostic overlay state
  const [aiDiagnostic, setAiDiagnostic] = useState<any | null>(null);
  const [aiRunning, setAiRunning] = useState(false);

  // General states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Camera capture states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Camera lifecycle effects
  useEffect(() => {
    if (cameraActive && !cameraStream) {
      const openMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
          });
          setCameraStream(stream);
        } catch (err: any) {
          console.error("Camera access failed:", err);
          setError("Failed to access camera. Please verify permission settings.");
          setCameraActive(false);
        }
      };
      openMedia();
    }
    
    return () => {
      if (!cameraActive && cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    };
  }, [cameraActive]);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, cameraActive]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        setImages((prev) => [...prev, dataUrl]);
        
        // Auto trigger AI evaluation
        runMockAIDiagnostic();
      }
    } catch (err: any) {
      console.error("Failed to capture image:", err);
      setError("Failed to capture photo: " + err.message);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  // Track online status
  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    // Trigger GPS capture automatically on mount
    captureGPS();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const captureGPS = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser");
      return;
    }

    setLocLoading(true);
    setLocError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocLoading(false);
      },
      (err) => {
        console.error("GPS capture error:", err);
        // Fallback mock coordinates (Patna, Bihar) if user blocks GPS (for testing)
        setLocation({
          lat: 25.5941 + (Math.random() - 0.5) * 0.05,
          lng: 85.1376 + (Math.random() - 0.5) * 0.05,
          accuracy: 10,
        });
        setLocError("Simulated GPS fallback locked.");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Convert uploaded image file to base64 preview & trigger mock AI
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError("");
    setUploadProgress(10);

    const fileArray = Array.from(files);
    let loadedCount = 0;
    const newImages: string[] = [];

    fileArray.forEach((file) => {
      // Compress/simulate upload progress
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        loadedCount++;
        
        setUploadProgress(Math.round((loadedCount / fileArray.length) * 100));

        if (loadedCount === fileArray.length) {
          setImages(prev => [...prev, ...newImages]);
          setUploadProgress(0);

          // Run instant mock AI crop diagnosis on uploaded image
          runMockAIDiagnostic();
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const runMockAIDiagnostic = () => {
    setAiRunning(true);
    setAiDiagnostic(null);

    setTimeout(() => {
      // Return custom diagnostic based on toggle selection
      if (isDamaged) {
        setAiDiagnostic({
          cropHealth: Math.floor(Math.random() * 25) + 30, // 30% to 55%
          damageType: `${damageType} Damage`,
          severity: damageSeverity,
          confidence: Math.floor(Math.random() * 10) + 85,
          recommendation: "Drain agricultural channels immediately. Minimize pesticide application."
        });
      } else {
        setAiDiagnostic({
          cropHealth: Math.floor(Math.random() * 10) + 90, // 90% to 100%
          damageType: "Healthy Crop",
          severity: "Low",
          confidence: Math.floor(Math.random() * 5) + 92,
          recommendation: "Foliar nutrition looks excellent. Maintain moisture."
        });
      }
      setAiRunning(false);
    }, 1200);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, idx) => idx !== index));
    if (images.length <= 1) {
      setAiDiagnostic(null);
    }
  };

  const handleSaveDraft = (silent = false) => {
    if (!farmerName || !cropName) return;

    const draftId = `draft_${farmerPhone || Date.now()}`;
    const draftSurvey = {
      farmerName,
      farmerPhone,
      policyId,
      cropName,
      cropType,
      area: parseFloat(area) || 0,
      sowingDate,
      isDamaged,
      damageDetails: isDamaged ? { damageType, damageDescription, damageSeverity } : undefined,
      images,
      location: location || { lat: 25.5941, lng: 85.1376 },
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(`draft_${draftId}`, JSON.stringify(draftSurvey));

      const draftListStr = localStorage.getItem("survey_drafts");
      let draftsList = draftListStr ? JSON.parse(draftListStr) : [];
      
      // Update existing draft or add new
      const existingIdx = draftsList.findIndex((d: any) => d.id === draftId);
      const draftMeta = {
        id: draftId,
        farmerName,
        cropName,
        cropType,
        area: draftSurvey.area,
        isDamaged,
        savedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        draftsList[existingIdx] = draftMeta;
      } else {
        draftsList.push(draftMeta);
      }

      localStorage.setItem("survey_drafts", JSON.stringify(draftsList));
      
      if (!silent) {
        alert(t("surveyForm.draftSaved") || "Draft Saved");
        router.push("/aew");
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (farmerName && cropName) {
        handleSaveDraft(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [farmerName, farmerPhone, policyId, cropName, cropType, area, sowingDate, isDamaged, damageType, damageSeverity, images]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (images.length === 0) {
      setError("Please capture or upload at least one geotagged crop image");
      return;
    }

    const payload = {
      farmerName,
      farmerPhone,
      policyId,
      cropName,
      cropType,
      area: parseFloat(area),
      sowingDate,
      isDamaged,
      damageDetails: isDamaged ? { damageType, damageDescription, damageSeverity } : undefined,
      images,
      location: location || { lat: 25.5941, lng: 85.1376 },
    };

    if (!online) {
      // Save to drafts automatically if offline
      handleSaveDraft();
      return;
    }

    setLoading(true);
    try {
      await api.post("/surveys", payload);
      setSuccess(true);
      setTimeout(() => {
        router.push("/aew");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit survey to servers.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    setError("");
    if (step === 1) {
      if (!farmerName) return setError("Farmer Name is required");
      if (!farmerPhone) return setError("Farmer Contact Phone is required");
      if (!policyId) return setError("Insurance Policy ID is required");
    } else if (step === 2) {
      if (!cropName) return setError("Crop Name is required");
      if (!cropType) return setError("Crop Type/Variety is required");
      if (!area) return setError("Area of Land is required");
      if (!sowingDate) return setError("Sowing Date is required (or the date entered is invalid e.g. Feb 30th)");
    } else if (step === 3) {
      if (isDamaged) {
        if (!damageType) return setError("Damage Type is required");
        if (!damageSeverity) return setError("Damage Severity is required");
      }
    }
    setStep(step + 1);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 bg-neutral-50/20 dark:bg-dark-bg/20 min-h-screen">
      
      {/* Header bar */}
      <div className="flex items-center justify-between mb-8 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-sm font-bold text-neutral-900 dark:text-white">
          Step {step} of 4
        </span>
        <div className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 italic">
          {farmerName && cropName ? "Auto-saving..." : ""}
        </div>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
          {t("surveyForm.title")}
        </h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          Complete field survey reporting. Data is saved in offline cache if network drops.
        </p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          {t("surveyForm.surveySubmitted")}! Redirecting...
        </div>
      )}

      {/* Error Callout */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4 text-xs font-semibold text-red-800 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Farmer details */}
        {step === 1 && (
          <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card animate-slide-up">
            <h3 className="text-md font-bold text-neutral-900 dark:text-white border-b border-neutral-100 pb-3 mb-2 dark:border-neutral-800">
              {t("surveyForm.farmerDetails")}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
                {t("surveyForm.farmerName")} *
              </label>
              <input
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder="Ramesh Prasad"
                className="w-full rounded-xl border-slate-400 bg-transparent py-2.5 px-3.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-primary dark:border-neutral-800 dark:text-white transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
                Farmer Contact Phone *
              </label>
              <input
                type="tel"
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full rounded-xl border-slate-400 bg-transparent py-2.5 px-3.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-primary dark:border-neutral-800 dark:text-white transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
                Insurance Policy ID *
              </label>
              <input
                type="text"
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                placeholder="AGRI-98273"
                className="w-full rounded-xl border-slate-400 bg-transparent py-2.5 px-3.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-primary dark:border-neutral-800 dark:text-white transition"
                required
              />
            </div>
          </div>
        )}

        {/* Step 2: Crop Details */}
        {step === 2 && (
          <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card animate-slide-up">
            <h3 className="text-md font-bold text-neutral-900 dark:text-white border-b border-neutral-100 pb-3 mb-2 dark:border-neutral-800">
              {t("surveyForm.cropDetails")}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
                {t("surveyForm.cropName")} *
              </label>
              <select
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full rounded-xl border-slate-400 bg-transparent py-2.5 px-3.5 text-xs text-neutral-900 outline-none focus:ring-2 focus:ring-primary dark:border-neutral-800 dark:text-white dark:bg-dark-card transition cursor-pointer"
                required
              >
                {CROPS.map((c) => (
                  <option key={c} value={c} className="dark:bg-dark-bg">{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
                {t("surveyForm.cropType")} *
              </label>
              <input
                type="text"
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                placeholder="PBW-343 (Kalyan Sona)"
                className="w-full rounded-xl border-slate-400 bg-transparent py-2.5 px-3.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-primary dark:border-neutral-800 dark:text-white transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
                  {t("surveyForm.area")} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="3.5"
                  className="w-full rounded-xl border-slate-400 bg-transparent py-2.5 px-3.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-primary dark:border-neutral-800 dark:text-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
                  {t("surveyForm.sowingDate")} *
                </label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full rounded-xl border-slate-400 bg-transparent py-2.5 px-3.5 text-xs text-neutral-900 outline-none focus:ring-2 focus:ring-primary dark:border-neutral-800 dark:text-white transition"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Damage assessment */}
        {step === 3 && (
          <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card animate-slide-up">
            <h3 className="text-md font-bold text-neutral-900 dark:text-white border-b border-neutral-100 pb-3 mb-2 dark:border-neutral-800">
              Damage Assessment
            </h3>

            {/* Is Damaged Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-dark-bg/25">
              <div>
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {t("surveyForm.damagedHeading")}
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5">Toggle yes to open claim assessments</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsDamaged(false)}
                  className={`min-h-[48px] px-4 py-2 rounded-lg text-xs font-bold transition ${
                    !isDamaged 
                      ? "bg-neutral-800 text-white dark:bg-neutral-700" 
                      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {t("surveyForm.no")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDamaged(true)}
                  className={`min-h-[48px] px-4 py-2 rounded-lg text-xs font-bold transition ${
                    isDamaged 
                      ? "bg-red-600 text-white" 
                      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {t("surveyForm.yes")}
                </button>
              </div>
            </div>

            {/* Conditional Damage Details */}
            {isDamaged && (
              <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800 animate-slide-up">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
                    {t("surveyForm.damageType")}
                  </label>
                  <select
                    value={damageType}
                    onChange={(e) => setDamageType(e.target.value)}
                    className="w-full rounded-xl border-slate-400 bg-transparent py-2.5 px-3.5 text-xs text-neutral-900 outline-none focus:ring-2 focus:ring-primary dark:border-neutral-800 dark:text-white dark:bg-dark-card transition cursor-pointer"
                  >
                    {DAMAGE_CATEGORIES.map((dt) => (
                      <option key={dt} value={dt} className="dark:bg-dark-bg">{t(`damageTypes.${dt}`)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
                    {t("surveyForm.damageSeverity")}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {SEVERITIES.map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setDamageSeverity(sev)}
                        className={`min-h-[48px] py-2 rounded-xl text-xs font-bold border transition ${
                          damageSeverity === sev
                            ? "border-red-500 bg-red-50/50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                            : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                        }`}
                      >
                        {t(`severities.${sev}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wide">
                    {t("surveyForm.damageDesc")}
                  </label>
                  <textarea
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                    placeholder="Enter visual crop conditions..."
                    rows={3}
                    className="w-full rounded-xl border-slate-400 border bg-transparent py-2.5 px-3.5 text-xs text-neutral-900 outline-none focus:ring-2 focus:ring-primary dark:border-neutral-800 dark:text-white transition"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Geotagged Media & Location */}
        {step === 4 && (
          <div className="space-y-6">
            
            {/* Geolocation Lock status */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card animate-slide-up">
              <h3 className="text-md font-bold text-neutral-900 dark:text-white border-b border-neutral-100 pb-3 mb-4 dark:border-neutral-800">
                {t("surveyForm.geolocation")}
              </h3>

              {locLoading ? (
                <div className="flex items-center gap-2 text-xs text-neutral-500 animate-pulse py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                  {t("surveyForm.fetchingGps")}
                </div>
              ) : location ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50/60 p-4 border border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/30">
                    <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                        {t("surveyForm.gpsCaptured")}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Lat: {location.lat.toFixed(6)} • Lng: {location.lng.toFixed(6)} (Acc: {location.accuracy?.toFixed(1) || 5}m)
                      </p>
                    </div>
                  </div>
                  {locError && <p className="text-[10px] text-amber-500 font-semibold">{locError}</p>}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={captureGPS}
                  className="min-h-[48px] w-full py-3 rounded-xl border-2 border-dashed border-neutral-200 hover:border-neutral-400 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold text-neutral-500 transition"
                >
                  <MapPin className="h-5 w-5 text-neutral-400" />
                  Retry Capturing GPS Coordinates
                </button>
              )}
            </div>

            {/* Geotagged Media Upload */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card animate-slide-up">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4 dark:border-neutral-800">
                <h3 className="text-md font-bold text-neutral-900 dark:text-white">
                  {t("surveyForm.uploadImages")}
                </h3>
                {!cameraActive && (
                  <button
                    type="button"
                    onClick={() => setCameraActive(true)}
                    className="min-h-[48px] flex items-center gap-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-2.5 py-1 text-xs font-semibold transition"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Open Live Camera
                  </button>
                )}
              </div>

              {cameraActive ? (
                <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-black aspect-video flex flex-col items-center justify-center mb-4">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 flex gap-3 z-20">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="min-h-[48px] rounded-full bg-brand-600 hover:bg-brand-700 text-white p-3.5 shadow-lg flex items-center justify-center animate-pulse"
                      title="Capture Photo"
                    >
                      <Camera className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="min-h-[48px] rounded-xl bg-neutral-800 hover:bg-neutral-950 text-white px-4 py-2 text-xs font-bold"
                    >
                      Close Camera
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 dark:border-neutral-800">
                      <img src={img} alt="Crop upload" className="w-full h-full object-cover" />
                    </div>
                  ))}

                  {/* Upload Trigger card */}
                  <label className="aspect-video rounded-xl border-2 border-dashed border-neutral-200 hover:border-neutral-400 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold text-neutral-500 transition">
                    <Camera className="h-5 w-5 text-neutral-400" />
                    <span>Upload Image Files</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {uploadProgress > 0 && (
                <div className="w-full bg-neutral-100 rounded-full h-2 mb-4 overflow-hidden dark:bg-neutral-800">
                  <div className="bg-brand-500 h-2 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>

            {/* Instant AI Diagnostic widget */}
            {(aiRunning || aiDiagnostic) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-dark-card border-brand-200 dark:border-brand-900/30"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5 mb-4">
                  <Cpu className="h-4 w-4 text-brand-600 animate-spin" />
                  KrishiSeva Diagnostic Engine
                </h4>

                {aiRunning ? (
                  <p className="text-xs text-neutral-400 animate-pulse">{t("surveyForm.aiChecking")}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-neutral-100 p-3.5 dark:border-neutral-800">
                      <p className="text-[10px] text-neutral-400">Crop Health Index</p>
                      <p className="text-lg font-extrabold text-emerald-600">{aiDiagnostic.cropHealth}%</p>
                    </div>
                    <div className="rounded-xl border border-neutral-100 p-3.5 dark:border-neutral-800">
                      <p className="text-[10px] text-neutral-400">Diagnostic Severity</p>
                      <p className={`text-lg font-extrabold ${aiDiagnostic.severity === 'High' ? 'text-red-500' : 'text-amber-500'}`}>{aiDiagnostic.severity}</p>
                    </div>
                    <div className="col-span-2 rounded-xl bg-neutral-50 p-3.5 dark:bg-dark-bg/25 border border-neutral-100 dark:border-neutral-800">
                      <p className="font-bold text-neutral-700 dark:text-neutral-300">Recommendation:</p>
                      <p className="mt-0.5 text-neutral-500 leading-normal">{aiDiagnostic.recommendation}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-neutral-200 dark:border-neutral-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="min-h-[48px] rounded-xl border border-neutral-200 px-5 py-2.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 transition"
            >
              Previous
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="min-h-[48px] rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/10 hover:from-brand-700 hover:to-brand-600 transition"
            >
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || success}
              className="min-h-[48px] rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/10 hover:from-brand-700 hover:to-brand-600 transition flex items-center gap-1.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.submit")} Report
            </button>
          )}
        </div>

      </form>

    </div>
  );
}
