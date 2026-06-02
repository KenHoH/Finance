"use client";

import React from "react";
import { Shield, FileText } from "lucide-react";

export default function LegalPage(){
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 pt-6 pb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Legal</h1>
        <p className="text-muted-foreground mb-12">Last updated: May 31, 2026</p>

        {/* Terms of Service */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Terms of Service</h2>
          </div>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <div>
              <h3 className="text-foreground font-semibold mb-1">1. Acceptance</h3>
              <p>By accessing or using FinPro, you agree to be bound by these Terms. If you do not agree, please do not use the service.</p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-1">2. Account</h3>
              <p>You must authenticate via Google OAuth. You are responsible for maintaining the confidentiality of your account and all activity under it.</p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-1">3. Data Accuracy</h3>
              <p>You are responsible for the accuracy of the financial data you enter. FinPro provides tools for tracking — it does not verify external transaction data.</p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-1">4. Prohibited Use</h3>
              <p>You may not use FinPro for any unlawful purpose, attempt to gain unauthorized access, or interfere with the service&apos;s operation.</p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-1">5. Termination</h3>
              <p>We reserve the right to suspend or terminate your access if you violate these Terms. You may stop using the service at any time.</p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-1">6. Changes</h3>
              <p>We may update these Terms from time to time. Continued use after changes constitutes acceptance.</p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-border mb-16" />

        {/* Privacy Policy */}
        <section className="pb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Privacy Policy</h2>
          </div>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <div>
              <h3 className="text-foreground font-semibold mb-1">1. Information We Collect</h3>
              <p>We collect your Google profile (name, email, avatar) upon sign-in, and the financial data you voluntarily enter into the app.</p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-1">2. How We Use Data</h3>
              <p>Your data is used solely to provide the FinPro service: tracking income, expenses, budgets, and investments. We do not sell your data to third parties.</p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-1">3. Cookies & Auth</h3>
              <p>We use HTTP-only cookies for session authentication. These are secure and automatically cleared on sign-out.</p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-1">4. Email Scanning (Optional)</h3>
              <p>If you enable Gmail sync, we scan only for transaction-related emails. We do not read other emails and you can revoke access anytime.</p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-1">5. Data Retention</h3>
              <p>Your data persists while your account is active. You may request deletion by contacting support or using the account settings.</p>
            </div>
            <div>
              <h3 className="text-foreground font-semibold mb-1">6. Security</h3>
              <p>We use industry-standard practices including HTTPS, CSRF tokens, and secure cookie flags. However, no system is 100% secure.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
