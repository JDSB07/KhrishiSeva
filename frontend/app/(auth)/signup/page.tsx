"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/AuthContext";
import { useLanguage } from "../../../hooks/LanguageContext";
import { motion } from "framer-motion";
import { Shield, User, Phone, Lock, Mail, Map, FileKey, AlertCircle } from "lucide-react";
import Link from "next/link";

const DISTRICTS = [
  "Patna",
  "Gaya",
  "Muzaffarpur",
  "Bhagalpur",
  "Darbhanga",
  "Rohtas",
  "Nalanda",
  "Saran",
  "Purnia",
  "Champaran"
];

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signup, user } = useAuth();
  const { t } = useLanguage();

  const [role, setRole] = useState<string>("farmer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [policyId, setPolicyId] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam && ["farmer", "aew"].includes(roleParam)) {
      setRole(roleParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      if (user.role === "aew") router.push("/aew");
      else if (user.role === "officer") router.push("/officer");
      else if (user.role === "farmer") router.push("/farmer");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !phone || !password || !district) {
      setError(t("surveyForm.validationError"));
      return;
    }

    if (role === "farmer" && !policyId) {
      setError("Please fill in Policy ID");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name,
        phone,
        password,
        role,
        district,
      };

      if (email) payload.email = email;
      if (role === "farmer") payload.policyId = policyId;

      await signup(payload);
    } catch (err: any) {
      setError(err || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const roleLabels = [
    { id: "farmer", label: t("common.farmer") },
    { id: "aew", label: t("common.aewWorker") },
  ];

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100/50 px-4 py-12 dark:from-dark-bg dark:to-[#090f0b]">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] h-72 w-72 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] h-72 w-72 rounded-full bg-brand-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-dark-card z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-lg shadow-brand-500/20 mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            {t("common.signup")}
          </h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
            {t("common.tagline")}
          </p>
        </div>

        {/* Role Switcher tab */}
        <div className="relative flex rounded-xl bg-neutral-100 p-1 mb-6 dark:bg-neutral-800/60">
          {roleLabels.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setRole(tab.id);
                setError("");
              }}
              className="relative flex-1 py-2 text-xs font-semibold text-neutral-600 rounded-lg dark:text-neutral-400 transition-colors duration-150 z-10"
            >
              {role === tab.id && (
                <motion.div
                  layoutId="activeSignupRole"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-neutral-700"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`relative z-20 ${role === tab.id ? "text-neutral-900 dark:text-white" : ""}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Error Callout */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl bg-red-50/80 p-3.5 text-xs text-red-600 border border-red-100/50 mb-6 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="font-medium leading-normal">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wide">
              {t("common.name")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Kumar"
                className="w-full rounded-xl border border-neutral-200/80 bg-transparent py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-neutral-800 dark:text-white dark:placeholder-neutral-600 transition"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wide">
              {t("common.phone")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Phone className="h-4 w-4" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full rounded-xl border border-neutral-200/80 bg-transparent py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-neutral-800 dark:text-white dark:placeholder-neutral-600 transition"
                required
              />
            </div>
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wide">
              Email (Optional)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@example.com"
                className="w-full rounded-xl border border-neutral-200/80 bg-transparent py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-neutral-800 dark:text-white dark:placeholder-neutral-600 transition"
              />
            </div>
          </div>

          {/* District Select */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wide">
              {t("common.district")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Map className="h-4 w-4" />
              </span>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-xl border border-neutral-200/80 bg-transparent py-3 pl-10 pr-4 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-neutral-800 dark:text-white dark:bg-dark-card transition cursor-pointer"
                required
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d} className="dark:bg-dark-bg">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Policy ID for Farmer */}
          {role === "farmer" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wide">
                {t("common.policyId")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                  <FileKey className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  placeholder="AGRI-98273"
                  className="w-full rounded-xl border border-neutral-200/80 bg-transparent py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-neutral-800 dark:text-white dark:placeholder-neutral-600 transition"
                  required={role === "farmer"}
                />
              </div>
            </motion.div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wide">
              {t("common.password")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-xl border border-neutral-200/80 bg-transparent py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-neutral-800 dark:text-white dark:placeholder-neutral-600 transition"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/10 hover:from-brand-700 hover:to-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 mt-2"
          >
            {loading ? t("common.loading") : t("common.signup")}
          </button>
        </form>

        {/* Login footer */}
        <div className="mt-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          <span>Already have an account? </span>
          <Link
            href={`/login?role=${role}`}
            className="font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition"
          >
            {t("common.login")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
