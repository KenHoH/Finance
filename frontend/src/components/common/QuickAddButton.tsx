"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, CreditCard } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useChatWidgetStore } from "@/store/useChatWidgetStore";

const QUICK_ACTIONS = [
  { label: "Income", href: "/income", icon: ArrowUpRight, color: "text-sky-400", bg: "bg-sky-500/10" },
  { label: "Expense", href: "/expenses", icon: CreditCard, color: "text-rose-400", bg: "bg-rose-500/10" },
];

export function QuickAddButton(){
  const [open, setOpen] = useState(false);
  const setChatOpen = useChatWidgetStore((s) => s.setIsOpen);

  const handleChatClick = () => {
    setOpen(false);
    setChatOpen(true);
  };

  return (
    <div data-tour="quick-add" className="hidden lg:block fixed bottom-6 right-6 z-[70]">
      <div className="relative flex flex-col items-end gap-2">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-end gap-2 mb-1"
            >
              {QUICK_ACTIONS.map((action, i) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-xs font-medium text-foreground bg-card/90 backdrop-blur border border-border rounded-lg px-2 py-1 shadow-sm">
                    {action.label}
                  </span>
                  <Link
                    href={action.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border border-border shadow-lg transition-transform hover:scale-110",
                      action.bg
                    )}
                  >
                    <div className="flex items-center justify-center w-full h-full">
                      <action.icon className={cn("w-5 h-5", action.color)} />
                    </div>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: QUICK_ACTIONS.length * 0.04 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs font-medium text-foreground bg-card/90 backdrop-blur border border-border rounded-lg px-2 py-1 shadow-sm">
                  Chat
                </span>
                <button
                  onClick={handleChatClick}
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-sky-400 shadow-lg transition-transform hover:scale-110 bg-sky-500 overflow-hidden"
                  aria-label="Open chat"
                >
                  <Image src="/finbot.png" alt="FinBot" width={32} height={32} className="object-cover" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          onClick={() => setOpen(!open)}
          whileTap={{ scale: 0.92 }}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-sky-500/20 transition-colors duration-200",
            open ? "bg-rose-500 text-white" : "bg-transparent"
          )}
          aria-label="Quick actions"
        >
          {open ? (
            <X className="w-6 h-6" />
          ) : (
            <Image src="/qa-icon.png" alt="" width={64} height={64} className="w-full h-full object-cover rounded-full" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
