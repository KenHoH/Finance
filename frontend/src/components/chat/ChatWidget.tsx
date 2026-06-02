"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Trash2, Square, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useChat, MODELS } from "@/hooks/useChat";
import { useChatWidgetStore } from "@/store/useChatWidgetStore";
import { ChatMessage } from "./ChatMessage";

export function ChatWidget() {
  const {
    messages,
    isStreaming,
    input,
    setInput,
    sendMessage,
    stopStreaming,
    clearMessages,
    selectedModel,
    setSelectedModel,
    isRateLimited,
    rateLimitMinutesLeft,
    providerRateLimit,
    formatTime,
  } = useChat();

  const isOpen = useChatWidgetStore((s) => s.isOpen);
  const setIsOpen = useChatWidgetStore((s) => s.setIsOpen);
  const isExpanded = useChatWidgetStore((s) => s.isExpanded);
  const setIsExpanded = useChatWidgetStore((s) => s.setIsExpanded);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const providerRateLimitMinutes = providerRateLimit
    ? Math.max(0, Math.ceil((new Date(providerRateLimit.resetAt).getTime() - now) / 60000))
    : 0;
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  // Close on Escape
  useEffect(() => {
    if(!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if(e.key === "Escape"){
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return() => window.removeEventListener("keydown", handler);
  }, [isOpen, setIsOpen]);

  // Auto-focus textarea when panel opens
  useEffect(() => {
    if(isOpen && textareaRef.current){
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if(!scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if(!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if(e.key === "Enter" && !e.shiftKey){
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClear = () => {
    clearMessages();
    setShowClearConfirm(false);
  };

  return (
    <>
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed z-[70] flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all duration-300",
              isExpanded
                ? "bottom-4 left-4 right-4 top-4 h-auto w-auto sm:bottom-8 sm:left-auto sm:right-8 sm:top-8 sm:h-[calc(100vh-64px)] sm:w-[700px]"
                : "bottom-0 left-0 right-0 h-[85vh] sm:bottom-20 sm:right-6 sm:left-auto sm:h-[600px] sm:w-[420px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 overflow-hidden">
                  <Image src="/finbot.png" alt="FinBot" width={32} height={32} className="object-cover" />
                </div>
                <div>
                  <div className="text-sm font-semibold">FinBot</div>
                  <div className="text-[10px] text-muted-foreground">
                    {isStreaming ? "Typing..." : "Online"}
                  </div>
                </div>
              </div>
              {/* Model Selector */}
              <div className="relative ml-auto mr-1">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isStreaming}
                  className="appearance-none rounded-md bg-accent px-2 py-1 pr-6 text-[10px] font-medium text-muted-foreground outline-none border border-border/50 cursor-pointer disabled:opacity-50"
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    aria-label="Clear chat"
                    title="Clear chat"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label={isExpanded ? "Minimize chat" : "Expand chat"}
                  title={isExpanded ? "Minimize" : "Expand"}
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Close FinBot"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-sky-950 ring-[3px] ring-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.3)] overflow-hidden">
                    <Image src="/finbot.png" alt="FinBot" width={64} height={64} className="object-cover" />
                  </div>
                  <div className="text-sm font-medium">Ask me about your finances</div>
                  <div className="max-w-[240px] text-xs text-muted-foreground">
                    I can help with budgets, expenses, goals, investments, and more.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      formatTime={formatTime}
                    />
                  ))}
                  {isStreaming && messages[messages.length - 1]?.content === "" && (
                    <div className="flex w-full justify-start">
                      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-card px-4 py-2.5 text-sm text-muted-foreground border border-border/50">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border bg-card px-4 py-3">
              {isRateLimited && (
                <div className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  Message limit reached. Try again in {rateLimitMinutesLeft} minute{rateLimitMinutesLeft !== 1 ? "s" : ""}.
                </div>
              )}
              {providerRateLimit && (
                <div className="mb-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  Provider rate limited this model. Switch to another model or wait {providerRateLimitMinutes}m.
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your finances..."
                  disabled={isStreaming || isRateLimited}
                  rows={1}
                  className={cn(
                    "max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground",
                    "focus:border-sky-500 focus:ring-1 focus:ring-sky-500",
                    (isStreaming || isRateLimited) && "opacity-60 cursor-not-allowed"
                  )}
                />
                {isStreaming ? (
                  <button
                    onClick={stopStreaming}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
                    aria-label="Stop generating"
                    title="Stop generating"
                  >
                    <Square size={14} className="fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isRateLimited}
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      input.trim() && !isRateLimited
                        ? "bg-sky-500 text-white hover:bg-sky-600"
                        : "bg-muted text-muted-foreground"
                    )}
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                )}
              </div>
              <div className="mt-1 text-center text-[10px] text-muted-foreground">
                Powered by OpenRouter AI
              </div>
            </div>

            {/* Clear Confirm Overlay */}
            <AnimatePresence>
              {showClearConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                >
                  <div className="w-[280px] rounded-xl border border-border bg-card p-4 shadow-xl">
                    <div className="mb-3 text-sm font-medium">Clear chat?</div>
                    <div className="mb-4 text-xs text-muted-foreground">
                      This will delete all messages. This action cannot be undone.
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleClear}
                        className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
