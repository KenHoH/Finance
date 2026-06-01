"use client";

import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { isOffTopic } from "@/lib/chat-guard";
import { buildFinancialContext } from "@/lib/chat-context";
import { buildSystemPrompt } from "@/lib/chat-prompt";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

interface RateLimitEntry {
  count: number;
  resetAt: string;
}

interface ProviderRateLimit {
  retryAfter: number; // seconds
  resetAt: string;
  modelId: string;
}

const RATE_LIMIT_KEY = "finbot_rate_limit";
const PROVIDER_RATE_LIMIT_KEY = "finbot_provider_rate_limit";
const MAX_MESSAGES_PER_HOUR = 30;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_KEY = "finbot_selected_model";

export const MODELS = [
  { id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "Hermes 3 (405B)" },
  { id: "google/gemma-4-26b-a4b-it:free", name: "Gemma 4 (26B)" },
  { id: "moonshotai/kimi-k2.6:free", name: "Kimi 2.6" },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free", name: "Qwen3 Next (80B)" },
] as const;

function getSavedModel(): string {
  try{
    const raw = localStorage.getItem(MODEL_KEY);
    if(raw && MODELS.some((m) => m.id === raw)) return raw;
  } catch{
    // ignore
  }
  return MODELS[0].id;
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getRateLimit(): RateLimitEntry {
  try{
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if(raw){
      const parsed = JSON.parse(raw) as RateLimitEntry;
      if(new Date(parsed.resetAt) > new Date()){
        return parsed;
      }
    }
  } catch{
    // ignore
  }
  const now = new Date();
  const resetAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  return { count: 0, resetAt };
}

function saveRateLimit(entry: RateLimitEntry): void {
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entry));
}

function getProviderRateLimit(): ProviderRateLimit | null {
  try{
    const raw = localStorage.getItem(PROVIDER_RATE_LIMIT_KEY);
    if(!raw) return null;
    const parsed = JSON.parse(raw) as ProviderRateLimit;
    if(new Date(parsed.resetAt) > new Date()) return parsed;
  } catch{
    // ignore
  }
  return null;
}

function saveProviderRateLimit(entry: ProviderRateLimit): void {
  localStorage.setItem(PROVIDER_RATE_LIMIT_KEY, JSON.stringify(entry));
}

function parseProviderRetryAfter(errText: string): number | null {
  try{
    const parsed = JSON.parse(errText);
    const raw = parsed?.error?.metadata?.retry_after_seconds_raw;
    const retry = parsed?.error?.metadata?.retry_after_seconds;
    if(typeof raw === "number" && raw > 0) return Math.ceil(raw);
    if(typeof retry === "number" && retry > 0) return retry;
  } catch{
    // ignore
  }
  return null;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => Promise<void>;
  stopStreaming: () => void;
  clearMessages: () => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
  isRateLimited: boolean;
  rateLimitMinutesLeft: number;
  providerRateLimit: ProviderRateLimit | null;
  formatTime: (date: Date) => string;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModelState] = useState<string>(getSavedModel);
  const [rateLimit, setRateLimit] = useState<RateLimitEntry>(getRateLimit);
  const [providerRateLimit, setProviderRateLimit] = useState<ProviderRateLimit | null>(getProviderRateLimit);
  const abortRef = useRef<AbortController | null>(null);

  const setSelectedModel = useCallback((v: string) => {
    setSelectedModelState(v);
    try{
      localStorage.setItem(MODEL_KEY, v);
    } catch{
      // ignore
    }
  }, []);

  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);

  const isRateLimited = rateLimit.count >= MAX_MESSAGES_PER_HOUR;
  const rateLimitMinutesLeft = isRateLimited
    ? Math.max(0, Math.ceil((new Date(rateLimit.resetAt).getTime() - Date.now()) / 60000))
    : 0;

  const checkAndUpdateRateLimit = useCallback((): boolean => {
    const entry = getRateLimit();
    if(entry.count >= MAX_MESSAGES_PER_HOUR){
      if(new Date(entry.resetAt) > new Date()){
        setRateLimit(entry);
        return false;
      }
      // reset window
      const resetAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const fresh = { count: 1, resetAt };
      saveRateLimit(fresh);
      setRateLimit(fresh);
      return true;
    }
    const updated = { ...entry, count: entry.count + 1 };
    saveRateLimit(updated);
    setRateLimit(updated);
    return true;
  }, []);

  const stopStreaming = useCallback(() => {
    if(abortRef.current){
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(async() => {
    const text = input.trim();
    if(!text || isStreaming) return;

    // Off-topic guard (Layer 1) — no rate limit penalty
    const guard = isOffTopic(text);
    if(guard.blocked){
      addToast("I can only help with personal finance and FinPro-related questions.", "error");
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      const refusalMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "I can only help with personal finance and FinPro-related questions.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg, refusalMsg]);
      setInput("");
      return;
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // API key check — no rate limit penalty if not configured
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if(!apiKey){
      addToast("FinBot is not configured. Please add your OpenRouter API key.", "error");
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "FinBot is unavailable right now. Please try again later.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // Rate limit check — only count when we are about to hit the API
    if(!checkAndUpdateRateLimit()){
      addToast(`You have reached the message limit. Please try again in ${rateLimitMinutesLeft} minutes.`, "error");
      return;
    }

    // Build context
    const financialSummary = buildFinancialContext(queryClient);
    const systemPrompt = buildSystemPrompt({
      username: user?.username || "User",
      financialSummary,
      currentDate: new Date().toISOString().split("T")[0],
    });

    // Build message history (last 10 exchanges = 20 messages max, but we keep it small)
    const history = messages.slice(-10).map((m) => ({
      role: m.role === "system" ? "assistant" : m.role,
      content: m.content,
    }));

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: text },
    ];

    setIsStreaming(true);
    const aiMsgId = generateId();
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try{
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "FinPro",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 800,
        }),
        signal: controller.signal,
      });

      if(!res.ok){
        const errText = await res.text().catch(() => "unknown error");
        console.error("OpenRouter API error:", res.status, errText);
        if(res.status === 429){
          const retrySeconds = parseProviderRetryAfter(errText);
          const resetAt = new Date(Date.now() + (retrySeconds || 60) * 1000).toISOString();
          const modelId = selectedModel;
          const providerLimit: ProviderRateLimit = {
            retryAfter: retrySeconds || 60,
            resetAt,
            modelId,
          };
          saveProviderRateLimit(providerLimit);
          setProviderRateLimit(providerLimit);
          const minutes = Math.ceil((retrySeconds || 60) / 60);
          const otherModels = MODELS.filter((m) => m.id !== modelId);
          const suggestion = otherModels.length > 0
            ? ` Try switching to ${otherModels[0].name} or try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`
            : ` Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`;
          addToast(`Rate limited by provider.${suggestion}`, "error");
          throw new Error(`Rate limited: retry in ${retrySeconds || 60}s`);
        }
        throw new Error(`API error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if(!reader){
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while(true){
        const { done, value } = await reader.read();
        if(done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for(const line of lines){
          const trimmed = line.trim();
          if(!trimmed || !trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.slice(6);
          if(dataStr === "[DONE]") continue;

          try{
            const data = JSON.parse(dataStr);
            const delta = data.choices?.[0]?.delta?.content;
            if(typeof delta === "string"){
              fullContent += delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, content: fullContent } : m
                )
              );
            }
          } catch{
            // ignore malformed JSON lines
          }
        }
      }

      // Final update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, content: fullContent || "I didn't get a response. Can you rephrase your question?" } : m
        )
      );
    } catch(err){
      if((err as Error).name === "AbortError"){
        // user stopped stream or closed panel, keep partial content
        setIsStreaming(false);
        abortRef.current = null;
        return;
      }
      console.error("FinBot fetch error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: "FinBot is unavailable right now. Please try again later." }
            : m
        )
      );
      addToast("FinBot is unavailable right now. Please try again later.", "error");
    } finally{
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages, selectedModel, checkAndUpdateRateLimit, rateLimitMinutesLeft, addToast, queryClient, user?.username]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
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
  };
}
