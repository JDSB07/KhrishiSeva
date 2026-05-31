import React from "react";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "../hooks/AuthContext";
import { LanguageProvider } from "../hooks/LanguageContext";
import Navbar from "../components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "KrishiSeva - Crop Insurance Verification",
  description: "AI-Powered crop damage assessment and verification system.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KrishiSeva",
  },
};

export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className="h-full flex flex-col antialiased">
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
            <footer className="border-t border-neutral-200/60 py-6 text-center text-xs text-neutral-400 bg-white dark:border-neutral-800/60 dark:bg-dark-bg transition-colors duration-200">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p>&copy; 2026 KrishiSeva. Developed for Agricultural Crop Verification & Damage Assessment.</p>
                <div className="flex space-x-4">
                  <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Terms</a>
                  <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Privacy Policy</a>
                  <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Support</a>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
