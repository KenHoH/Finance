"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, PieChart, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex items-center justify-center gap-2 font-bold text-3xl text-primary mb-2">
          <PieChart className="w-8 h-8" />
          FinPro
        </div>
        <p className="text-center text-muted-foreground mb-8 font-medium">
          Create an account to manage your finances.
        </p>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Full Name</label>
            <input 
              type="text" 
              placeholder="John Doe" 
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Email</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Create a password" 
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] mt-6">
            Create Account <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-sm font-medium text-muted-foreground mt-8">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
