"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, TrendingUp, Shield, Wallet, BarChart3 } from "lucide-react";
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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(14,165,233,0.08) 0%, transparent 60%), var(--background)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[28rem]"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <img src="/logo.png" alt="" className="w-8 h-8" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-foreground">FinPro</span>
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-base text-muted-foreground">Sign in to manage your personal finances.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={cn(
              "w-full rounded-xl text-sm font-bold",
              "flex items-center justify-center gap-3 py-4",
              "bg-primary text-primary-foreground",
              "hover:brightness-110 transition-all",
              "active:scale-[0.98]",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <GoogleIcon className="w-5 h-5" />
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
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

        {/* Value props — 2x2 grid */}
        <div className="mt-8 grid grid-cols-2 gap-3">
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
  );
}
