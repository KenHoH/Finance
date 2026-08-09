"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModalProps } from "@/lib/types";

function trapFocus(node: HTMLElement, event: KeyboardEvent){
  if(event.key !== "Tab" || !node) return;
  const focusable = node.querySelectorAll<HTMLElement>(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  if(focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if(event.shiftKey){
    if(document.activeElement === first){
      last.focus();
      event.preventDefault();
    }
  }else{
    if(document.activeElement === last){
      first.focus();
      event.preventDefault();
    }
  }
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  isSuccess = false,
  successMessage = "Success!",
  zIndex = 40,
  backdropClassName = "bg-black/60 backdrop-blur-sm"
}: ModalProps & { zIndex?: number; backdropClassName?: string } ){
  const contentRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if(isOpen){
      previouslyFocused.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => {
        const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.[0]?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }else{
      previouslyFocused.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if(e.key === "Escape"){
        onClose();
      }else if(contentRef.current){
        trapFocus(contentRef.current, e);
      }
    };
    if(isOpen){
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("fixed inset-0 z-40", backdropClassName)}
            style={{ zIndex }}
          />
          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-card border border-border rounded-xl shadow-2xl z-50 p-6 outline-none focus:ring-1 focus:ring-primary max-h-[85vh] overflow-y-auto font-sans"
            style={{ zIndex: zIndex + 10 }}
            tabIndex={-1}
          >
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mb-5 relative"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 bg-primary/30 rounded-full"
                    />
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground mb-1.5">Success!</h3>
                  <p className="text-muted-foreground font-medium">{successMessage}</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 id="modal-title" className="text-xl font-semibold text-foreground">{title}</h2>
                      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                    </div>
                    <button
                      onClick={onClose}
                      className="p-1.5 hover:bg-sky-500/[0.05] rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
