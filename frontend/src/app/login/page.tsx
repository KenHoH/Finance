"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, Shield, Wallet, BarChart3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

const VALUE_PROPS = [
  { icon: Wallet, text: "Track income & expenses" },
  { icon: BarChart3, text: "Visual budgets & insights" },
  { icon: TrendingUp, text: "Monitor investments" },
  { icon: Shield, text: "Secure OAuth login" },
];

export default function LoginPage(){
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if(user && !authLoading){
      setIsRedirecting(true);
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = "/api/auth/google?returnTo=/dashboard";
  };

  if(authLoading || isRedirecting){
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background flex font-sans">
      {/* Left — Hero illustration (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 h-full flex-col items-center justify-center px-12 py-8 bg-muted/30 overflow-hidden">
        <div className="w-full max-w-lg flex flex-col justify-center h-full overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-foreground leading-tight mb-4">
              Take control of your finances
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Track spending, set budgets, monitor investments, and achieve your savings goals — all in one place.
            </p>
          </motion.div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {VALUE_PROPS.map((prop, i) => (
              <motion.div
                key={prop.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <prop.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium leading-tight">{prop.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-6 rounded-2xl overflow-hidden border border-border shadow-lg max-h-[32vh] shrink-0"
          >
            <Image
              src="/onboarding-hero.png"
              alt="FinPro finance management illustration"
              width={560}
              height={360}
              className="w-full h-full object-contain"
              priority
            />
          </motion.div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 h-full flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Image src="/logo.png" alt="" width={72} height={72} />
            </div>
            <span className="font-bold text-4xl tracking-tight text-foreground">FinPro</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-base text-muted-foreground">Sign in to manage your personal finances.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={cn(
                "w-full rounded-xl text-base font-bold",
                "flex items-center justify-center gap-3 py-3.5 px-4",
                "bg-white text-gray-900",
                "hover:bg-gray-100 transition-all",
                "active:scale-[0.98]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "shadow-lg shadow-white/10"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <p className="mt-6 pt-5 border-t border-border text-xs text-center text-muted-foreground/70 leading-relaxed">
              By signing in, you agree to our{" "}
              <Link href="/legal" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/legal" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          {/* Mobile-only value props */}
          <div className="lg:hidden mt-8 grid grid-cols-2 gap-3">
            {VALUE_PROPS.map((prop, i) => (
              <motion.div
                key={prop.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <prop.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium leading-tight">{prop.text}</span>
              </motion.div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground/50">
            Secure, private, and free forever.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
