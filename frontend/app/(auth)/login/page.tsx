"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/AuthContext";
import { useLanguage } from "../../../hooks/LanguageContext";
import { motion } from "framer-motion";
import { Shield, Phone, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, user } = useAuth();
  const { t } = useLanguage();

  const [role, setRole] = useState<string>("farmer");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-select role if passed in query string
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam && ["farmer", "aew", "officer"].includes(roleParam)) {
      setRole(roleParam);
    }
  }, [searchParams]);

  // Redirect if already logged in
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

    if (!phone || !password) {
      setError(t("surveyForm.validationError"));
      return;
    }

    setLoading(true);
    try {
      await login(phone, password, role);
    } catch (err: any) {
      setError(err || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const roleLabels = [
    { id: "farmer", label: t("common.farmer") },
    { id: "aew", label: t("common.aewWorker") },
    { id: "officer", label: t("common.officer") },
  ];

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100/50 px-4 dark:from-dark-bg dark:to-[#090f0b]">
      {/* Background visual element */}
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
            {t("common.login")}
          </h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
            {t("common.tagline")}
          </p>
        </div>

        {/* Role Switcher Tab */}
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
                  layoutId="activeRole"
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Phone Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wide">
              {role === "farmer" ? "Farmer ID" : t("common.phone")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Phone className="h-4 w-4" />
              </span>
              <input
                type={role === "farmer" ? "text" : "tel"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={role === "farmer" ? "AGRI-98273" : "9876543210"}
                className="w-full rounded-xl border-slate-400 border bg-transparent py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-primary dark:border-neutral-800 dark:text-white dark:placeholder-neutral-600 transition"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                {t("common.password")}
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-xl border-slate-400 border bg-transparent py-3 pl-10 pr-10 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-primary dark:border-neutral-800 dark:text-white dark:placeholder-neutral-600 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/10 hover:from-brand-700 hover:to-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
          >
            {loading ? t("common.loading") : t("common.login")}
          </button>
        </form>

        {/* Register footer */}
        {role !== "officer" && (
          <div className="mt-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
            <span>Don't have an account? </span>
            <Link
              href={`/signup?role=${role}`}
              className="font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition"
            >
              {t("common.signup")}
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
