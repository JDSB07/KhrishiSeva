"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/AuthContext";
import { useLanguage } from "../hooks/LanguageContext";
import { 
  Sun, 
  Moon, 
  Globe, 
  Bell, 
  LogOut, 
  User, 
  Shield,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw
} from "lucide-react";
import api from "../services/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Clean up active production service workers in development mode to avoid stylesheet caching issues
    if (process.env.NODE_ENV === "development" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log("Unregistered service worker successfully in dev mode");
              }
            });
          }
          // Force-reload the page to retrieve fresh uncached dev stylesheets
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }
      });
    }
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.notifications.filter((n: any) => !n.read).length);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [user]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const markNotificationsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.put("/notifications/mark-read");
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking notifications read:", err);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : "en");
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "survey_submitted":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "resurvey":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-neutral-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 bg-white/75 backdrop-blur-md dark:border-neutral-800/80 dark:bg-dark-bg/75 transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <a href="/" className="flex items-center space-x-2 group">
          <div className="flex h-10 w-10 items-center justify-center group-hover:scale-105 transition-transform overflow-hidden rounded-xl">
            <img 
              src="/logo.png" 
              alt="KrishiSeva" 
              className="h-10 w-10 object-cover" 
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = document.createElement("div");
                fallback.className = "flex h-10 w-10 items-center justify-center bg-gradient-to-tr from-brand-600 to-brand-400 text-white";
                fallback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
                e.currentTarget.parentElement?.appendChild(fallback);
              }}
            />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">
              {t("common.appName")}
            </span>
            <p className="hidden xs:block text-[10px] text-neutral-500 dark:text-neutral-400 leading-none mt-0.5">
              {t("common.tagline")}
            </p>
          </div>
        </a>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="min-h-[48px] flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition"
            title="Switch Language"
          >
            <Globe className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span className="hidden sm:inline">
              {language === "en" ? "हिन्दी" : "English"}
            </span>
            <span className="sm:hidden uppercase">{language === "en" ? "hi" : "en"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition"
            title="Toggle Dark Mode"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
          </button>

          {/* User Logged-in Controls */}
          {user ? (
            <>
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    if (!notifOpen) markNotificationsRead();
                  }}
                  className="min-h-[48px] min-w-[48px] flex items-center justify-center relative rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-dark-bg animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-dark-card animate-slide-up z-50">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-2 dark:border-neutral-800">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {t("farmer.notificationCenter")}
                      </span>
                      <button
                        onClick={() => setNotifOpen(false)}
                        className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <X className="h-3.5 w-3.5 text-neutral-400" />
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {notifications.length === 0 ? (
                        <p className="py-6 text-center text-xs text-neutral-400">
                          {t("common.noNotifications")}
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`flex gap-3 rounded-lg p-2 text-left transition text-xs ${
                              n.read 
                                ? "bg-transparent text-neutral-600 dark:text-neutral-400" 
                                : "bg-brand-50/50 dark:bg-brand-900/10 text-neutral-900 dark:text-neutral-100"
                            }`}
                          >
                            <div className="mt-0.5 flex-shrink-0">{getNotifIcon(n.type)}</div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {language === "en" ? n.titleEn : n.titleHi}
                              </p>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-tight">
                                {language === "en" ? n.messageEn : n.messageHi}
                              </p>
                              <span className="text-[9px] text-neutral-400 block mt-1">
                                {new Date(n.createdAt).toLocaleDateString(language === "en" ? "en-US" : "hi-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile / Role Banner */}
              <div className="hidden md:flex items-center space-x-2 border-l border-neutral-200 pl-4 dark:border-neutral-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  <User className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white max-w-[100px] truncate">
                    {user.name}
                  </p>
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium uppercase tracking-wide">
                    {t(`common.${user.role === 'aew' ? 'aewWorker' : user.role === 'officer' ? 'officer' : 'farmer'}`)}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="min-h-[48px] flex items-center justify-center rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 transition"
              >
                <LogOut className="h-3.5 w-3.5 sm:mr-1.5 text-red-500" />
                <span className="hidden sm:inline">{t("common.logout")}</span>
              </button>
            </>
          ) : (
            <a
              href="/login"
              className="min-h-[48px] flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand-500/20 hover:from-brand-700 hover:to-brand-600 transition"
            >
              {t("common.login")}
            </a>
          )}

        </div>
      </div>
    </header>
  );
}
