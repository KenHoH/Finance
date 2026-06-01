"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const STORAGE_KEY = "finance-onboarding-v2";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: string;
}

const STEPS: TourStep[] = [
  {
    target: "[data-tour='sidebar']",
    title: "Sidebar Navigation",
    description: "Use the sidebar to jump between all major sections — Dashboard, Income, Expenses, Budgets, and more.",
    position: "right",
  },
  {
    target: "[data-tour='welcome']",
    title: "Welcome to FinPro",
    description: "This is your financial command center. Let us take a quick tour of the main features. You can skip anytime.",
    position: "bottom",
  },
  {
    target: "[data-tour='dashboard-overview']",
    title: "Your Overview",
    description: "Track your total balance, expenses, and investments at a glance.",
    position: "bottom",
  },
  {
    target: "[data-tour='add-income']",
    title: "Add Income",
    description: "Click here to quickly log any income you receive.",
    position: "left",
  },
  {
    target: "[data-tour='add-expense']",
    title: "Add Expense",
    description: "Log your expenses just as easily to keep your records up to date.",
    position: "left",
  },
  {
    target: "[data-tour='recent-income']",
    title: "Recent Income",
    description: "See your latest income transactions listed here.",
    position: "right",
  },
  {
    target: "[data-tour='active-budgets']",
    title: "Active Budgets",
    description: "Monitor your spending limits and stay on track.",
    position: "left",
  },
  {
    target: "[data-tour='recent-expenses']",
    title: "Recent Expenses",
    description: "Keep an eye on where your money is going.",
    position: "right",
  },
  {
    target: "[data-tour='active-goals']",
    title: "Active Goals",
    description: "Set savings goals and watch your progress over time.",
    position: "left",
  },
  {
    target: "[data-tour='topbar']",
    title: "Navigation",
    description: "Access friends, settings, and notifications from the top bar.",
    position: "bottom",
  },
  {
    target: "[data-tour='quick-add']",
    title: "Quick Add",
    description: "This floating button lets you quickly add Income, Expenses, Bills, Goals, or Debts from anywhere.",
    position: "left",
  },
];

function getTargetRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  if(!el) return null;
  return el.getBoundingClientRect();
}

function rectsEqual(a: DOMRect | null, b: DOMRect | null): boolean {
  if(a === b) return true;
  if(!a || !b) return false;
  return (
    Math.round(a.left) === Math.round(b.left) &&
    Math.round(a.top) === Math.round(b.top) &&
    Math.round(a.width) === Math.round(b.width) &&
    Math.round(a.height) === Math.round(b.height)
  );
}

export function OnboardingTour(){
  const user = useAuthStore((s) => s.user);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isActive, setIsActive] = useState(false);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if(typeof window === "undefined") return;
    const completed = window.localStorage.getItem(STORAGE_KEY);
    if(!completed && user){
      setIsActive(true);
    }
  }, [user]);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const updateRect = useCallback(() => {
    if(!isActive || !step) return;
    const r = getTargetRect(step.target);
    if(!rectsEqual(r, rectRef.current)){
      rectRef.current = r;
      setRect(r);
    }
  }, [isActive, step]);

  useEffect(() => {
    if(!step) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if(el){
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [stepIndex]);

  useEffect(() => {
    updateRect();
    const onResize = () => updateRect();
    const onScroll = () => {
      if(rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateRect);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return() => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      if(rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateRect]);

  const handleNext = () => {
    if(isLast){
      handleFinish();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleFinish = () => {
    if(typeof window !== "undefined"){
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
    setIsActive(false);
  };

  const handleSkip = () => {
    if(typeof window !== "undefined"){
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
    setIsActive(false);
  };

  const handleStepClick = () => {
    if(step?.action){
      const el = document.querySelector(step.target) as HTMLElement | null;
      if(el){
        el.click();
        setTimeout(() => handleNext(), 300);
      }
    }
  };

  if(!isActive || !step || !user) return null;

  const padding = 8;
  const tooltipWidth = 280;

  let tooltipStyle: React.CSSProperties = {};
  if(rect){
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    switch(step.position){
      case "top":
        tooltipStyle = {
          left: Math.min(Math.max(centerX - tooltipWidth / 2, 16), window.innerWidth - tooltipWidth - 16),
          bottom: window.innerHeight - rect.top + padding + 8,
        };
        break;
      case "bottom":
        tooltipStyle = {
          left: Math.min(Math.max(centerX - tooltipWidth / 2, 16), window.innerWidth - tooltipWidth - 16),
          top: rect.bottom + padding + 8,
        };
        break;
      case "left":
        tooltipStyle = {
          right: window.innerWidth - rect.left + padding + 8,
          top: Math.max(rect.top - 270, 16),
        };
        break;
      case "right":
        tooltipStyle = {
          left: Math.min(rect.right + padding + 8, window.innerWidth - tooltipWidth - 16),
          top: Math.max(rect.top + 8, 16),
        };
        break;
    }
  } else {
    tooltipStyle = {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Quadrant overlays with spotlight hole */}
      {rect && (
        <>
          <div className="absolute bg-black/50 backdrop-blur-[1px] transition-all duration-300" style={{ top: 0, left: 0, right: 0, height: Math.max(rect.top - padding, 0) }} />
          <div className="absolute bg-black/50 backdrop-blur-[1px] transition-all duration-300" style={{ top: rect.bottom + padding, left: 0, right: 0, bottom: 0 }} />
          <div className="absolute bg-black/50 backdrop-blur-[1px] transition-all duration-300" style={{ top: Math.max(rect.top - padding, 0), left: 0, width: Math.max(rect.left - padding, 0), height: rect.height + padding * 2 }} />
          <div className="absolute bg-black/50 backdrop-blur-[1px] transition-all duration-300" style={{ top: Math.max(rect.top - padding, 0), left: rect.right + padding, right: 0, height: rect.height + padding * 2 }} />

          {/* Highlight ring */}
          <div
            className="absolute rounded-xl border-2 border-primary/80 pointer-events-none animate-pulse"
            style={{
              left: rect.left - padding,
              top: rect.top - padding,
              width: rect.width + padding * 2,
              height: rect.height + padding * 2,
              boxShadow: "0 0 0 4px rgba(14,165,233,0.2), 0 0 32px rgba(14,165,233,0.15), inset 0 0 32px rgba(14,165,233,0.05)",
            }}
          />
        </>
      )}

      {!rect && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      )}

      {/* Tooltip */}
      <motion.div
        key={stepIndex}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute z-10 w-72"
        style={tooltipStyle}
      >
        <div className="rounded-2xl border border-white/[0.08] bg-card/95 backdrop-blur-xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
              Step {stepIndex + 1} of {STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors"
              aria-label="Skip tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">{step.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    i === stepIndex ? "bg-primary" : "bg-white/10"
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  onClick={() => setStepIndex(i => i - 1)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className={cn(
                  "rounded-lg font-bold transition-all flex items-center gap-1",
                  isLast
                    ? "px-5 py-2.5 text-sm bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_24px_rgba(14,165,233,0.3)]"
                    : "px-3.5 py-1.5 text-xs bg-primary text-primary-foreground hover:brightness-110"
                )}
              >
                {isLast ? "Finish" : "Next"}
                <ArrowRight className={cn(isLast ? "w-4 h-4" : "w-3.5 h-3.5")} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
