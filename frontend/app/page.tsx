"use client";

import React from "react";
import { useLanguage } from "../hooks/LanguageContext";
import { useAuth } from "../hooks/AuthContext";
import { motion } from "framer-motion";
import { 
  Shield, 
  MapPin, 
  CloudSun, 
  FileText, 
  TrendingUp, 
  AlertOctagon, 
  ArrowRight,
  ClipboardCheck,
  Building2,
  Users
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  // Mock statistics
  const stats = [
    { label: t("landing.statTotalClaims"), value: "12,450+", icon: FileText, color: "text-blue-500 bg-blue-500/10" },
    { label: t("landing.statAreaSurveyed"), value: "48,200+", icon: MapPin, color: "text-emerald-500 bg-emerald-500/10" },
    { label: t("landing.statSettlementRate"), value: "94.2%", icon: TrendingUp, color: "text-brand-600 bg-brand-500/10" },
    { label: t("landing.statFraudBlocked"), value: "1,142", icon: AlertOctagon, color: "text-amber-500 bg-amber-500/10" },
  ];

  // Role portal buttons
  const portals = [
    {
      role: "farmer",
      title: t("landing.farmerPortal"),
      description: t("landing.farmerDesc"),
      icon: Users,
      color: "from-brand-500 to-brand-600 shadow-brand-500/10",
      link: user ? "/farmer" : "/login?role=farmer",
    },
    {
      role: "aew",
      title: t("landing.aewPortal"),
      description: t("landing.aewDesc"),
      icon: ClipboardCheck,
      color: "from-blue-500 to-blue-600 shadow-blue-500/10",
      link: user ? "/aew" : "/login?role=aew",
    },
    {
      role: "officer",
      title: t("landing.officerPortal"),
      description: t("landing.officerDesc"),
      icon: Building2,
      color: "from-neutral-700 to-neutral-900 dark:from-neutral-800 dark:to-neutral-900 shadow-neutral-700/10",
      link: user ? "/officer" : "/login?role=officer",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-b from-neutral-50 to-neutral-100/50 dark:from-dark-bg dark:to-[#090f0b]">
      
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center space-x-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-700 dark:border-brand-900/30 dark:bg-brand-950/20 dark:text-brand-400 mb-6 animate-pulse">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-3.5 w-3.5 object-cover" 
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = document.createElement("span");
                fallback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
                e.currentTarget.parentElement?.insertBefore(fallback, e.currentTarget);
              }}
            />
            <span>{t("common.appName")} Portal</span>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-white leading-tight">
            {t("landing.heading")}
          </h1>
          
          <p className="mt-6 text-base sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            {t("landing.description")}
          </p>
        </motion.div>

        {/* Portal Selection Grid */}
        <motion.div 
          className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto mb-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {portals.map((portal) => (
            <motion.div
              key={portal.role}
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-md dark:border-neutral-800 dark:bg-dark-card transition-shadow"
            >
              <div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr ${portal.color} text-white mb-6 shadow-lg group-hover:scale-105 transition-transform`}>
                  <portal.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  {portal.title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {portal.description}
                </p>
              </div>

              <div className="mt-8">
                <Link
                  href={portal.link}
                  className="min-h-[48px] inline-flex items-center space-x-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition group"
                >
                  <span>{t("landing.getStarted")}</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Statistics Grid */}
        <motion.div 
          className="grid grid-cols-2 gap-4 md:grid-cols-4 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="rounded-2xl border border-neutral-200/60 bg-white/60 p-5 dark:border-neutral-800/60 dark:bg-dark-card/60 backdrop-blur-sm text-center flex flex-col items-center justify-center shadow-sm"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color} mb-3`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mt-1 leading-snug">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
