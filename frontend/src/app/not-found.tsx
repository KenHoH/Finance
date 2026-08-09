"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound(){
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10 max-w-lg"
      >
        <div className="mb-6">
          <img
            src="/empty-404.webp"
            alt=""
            className="w-56 h-56 mx-auto opacity-90"
          />
        </div>

        <h1 className="text-8xl font-black text-primary tracking-tighter mb-4">
          404
        </h1>

        <h2 className="text-3xl font-bold text-foreground mb-3">
          Page not found
        </h2>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you are looking for does not exist or has been moved.
          Check the URL or head back home.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>

          <button
            onClick={() => history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold border border-border text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
