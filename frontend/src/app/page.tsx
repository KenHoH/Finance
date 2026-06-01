"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Wallet,
  Loader2,
  TrendingUp,
  Target,
  Users,
  PieChart,
  CreditCard,
  LogOut,
  User,
} from "lucide-react";

import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

function AvatarImg({ src }: { src?: string | null }){
  const [error, setError] = useState(false);
  if(!src || error){
    return (
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <User className="w-5 h-5 text-primary" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="w-9 h-9 rounded-lg object-cover"
      onError={() => setError(true)}
    />
  );
}

const FEATURES = [
  {
    icon: Wallet,
    title: "Income & Expenses",
    description:
      "Smart categorization and real-time summaries for every transaction.",
  },
  {
    icon: PieChart,
    title: "Budget Tracking",
    description:
      "Set monthly budgets per category and get alerts before you overspend.",
  },
  {
    icon: Target,
    title: "Savings Goals",
    description:
      "Define targets, track progress visually, and celebrate every milestone.",
  },
  {
    icon: TrendingUp,
    title: "Investments",
    description:
      "Monitor your portfolio, allocations, and total returns in one place.",
  },
  {
    icon: CreditCard,
    title: "Debt Management",
    description:
      "Track overspent budgets and debt points with clear repayment plans.",
  },
  {
    icon: Users,
    title: "Split Bills",
    description:
      "Divide shared expenses with friends and keep everyone accountable.",
  },
];

const STEPS = [
  {
    icon: GoogleIcon,
    title: "Sign in with Google",
    description:
      "One click. No passwords. Secure OAuth 2.0 authentication.",
  },
  {
    icon: Wallet,
    title: "Add your accounts",
    description:
      "Connect your income, expenses, and categories in seconds.",
  },
  {
    icon: BarChart3,
    title: "Watch it grow",
    description:
      "Visual dashboards, charts, and insights at your fingertips.",
  },
];

const STATS = [
  { value: "6", label: "Modules" },
  { value: "100%", label: "Free" },
  { value: "OAuth", label: "Secure" },
  { value: "IDR", label: "Currency" },
];

export default function LandingPage() {
  const router = useRouter();

  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = async() => {
    try{
      await useAuthStore.getState().logout();
    } catch{
      // ignore
    }
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden pt-16">

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-6 pt-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/15 blur-[150px] pointer-events-none" />

        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-sm font-medium rounded-full border border-primary/20 bg-primary/10 text-primary">
            All-in-one personal finance
          </div>

          <h1 className="mb-5 text-4xl sm:text-5xl lg:text-4xl font-bold tracking-tight leading-[1.1]">
            Take Control of Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-400">
              Financial Future
            </span>
          </h1>

          <p className="max-w-2xl mx-auto mb-10 text-lg leading-relaxed text-muted-foreground">
            Track income, expenses, budgets, goals,
            investments, debts, and split bills — all in one
            beautifully simple dashboard. No spreadsheets required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-8 py-3.5 text-lg font-bold rounded-xl bg-white text-gray-900 hover:bg-gray-100 transition-all active:scale-[0.98] shadow-lg shadow-white/10"
            >
              <GoogleIcon className="w-5 h-5" />

              Get Started Free

              <ArrowRight className="w-5 h-5" />
            </button>

            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              See what&apos;s included ↓
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 hidden lg:flex items-center justify-center"
        >
          <img
            src="/hero-illustration.png"
            alt=""
            className="w-full max-w-xl h-auto drop-shadow-2xl"
            width={512}
            height={512}
          />
        </motion.div>
      </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              className="p-4 text-center rounded-xl border border-border bg-card/50"
            >
              <div className="text-2xl font-extrabold text-primary">
                {stat.value}
              </div>

              <div className="mt-1 text-sm font-medium text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="max-w-6xl mx-auto px-6 py-20"
      >
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl sm:text-3xl font-bold">
            Everything you need
          </h2>

          <p className="max-w-xl mx-auto text-muted-foreground">
            Six powerful modules to manage every aspect
            of your personal finances.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.05 * index,
                duration: 0.4,
              }}
              className="group p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
            >
              <div className="w-11 h-11 mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>

              <h3 className="mb-1.5 text-base font-bold">
                {feature.title}
              </h3>

              <p className="text-base leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section
        id="how-it-works"
        className="max-w-4xl mx-auto px-6 py-20"
      >
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl sm:text-3xl font-bold">
            Get started in minutes
          </h2>

          <p className="max-w-xl mx-auto text-muted-foreground">
            No credit card. No spreadsheets.
            Just your Google account.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className="relative p-6 text-center rounded-xl border border-border bg-card"
            >
              {index < STEPS.length - 1 && (
                <div className="hidden sm:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-border" />
              )}

              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                {index === 0 ? (
                  <GoogleIcon className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6 text-primary" />
                )}
              </div>

              <h3 className="mb-1.5 font-bold">
                {step.title}
              </h3>

              <p className="text-base leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="relative overflow-hidden p-10 sm:p-14 rounded-xl border border-border bg-card">

          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <h2 className="mb-4 text-3xl sm:text-3xl font-bold">
              Ready to take control?
            </h2>

            <p className="max-w-md mx-auto mb-8 text-muted-foreground">
              Join now and start tracking your finances
              in under 60 seconds.
            </p>

            <button
              onClick={handleLogin}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-lg font-bold rounded-xl bg-white text-gray-900 hover:bg-gray-100 transition-all active:scale-[0.98] shadow-lg shadow-white/10"
            >
              <GoogleIcon className="w-5 h-5" />

              Get Started Free

              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">

          <div className="flex items-center gap-2.5 font-bold text-foreground">
            <img
              src="/logo.png"
              alt=""
              className="w-14 h-14 rounded-xl"
            />
            <span className="text-lg">FinPro</span>
          </div>

          <div className="flex items-center gap-7">
            <span>
              Built for better money management
            </span>

            <span className="hidden sm:inline">
              &bull;
            </span>

            <span>
              Secure &bull; Private &bull; Free
            </span>
          </div>

          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
