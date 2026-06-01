"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";

interface ChatMessageProps {
  message: ChatMessageType;
  formatTime: (date: Date) => string;
}

function renderMarkdown(text: string): string {
  // Bold: **text**
  let html = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Bullet lists: - item or * item at line start
  html = html.replace(/^(\s*)[-*]\s+(.+)$/gm, "$1<li>$2</li>");
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul class="list-disc pl-4 space-y-1 my-1">${match}</ul>`);
  // Remove extra </ul><ul> breaks
  html = html.replace(/<\/ul>\s*<ul[^>]*>/g, "");
  return html;
}

export function ChatMessage({ message, formatTime }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async() => {
    try{
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch{
      // ignore
    }
  };

  return (
    <div className={cn("flex w-full group", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed relative",
          isUser
            ? "bg-sky-500 text-white rounded-br-md"
            : "bg-card text-foreground border border-border/50 rounded-bl-md"
        )}
      >
        {!isUser && message.content && (
          <button
            onClick={handleCopy}
            className="absolute top-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity text-muted-foreground"
            aria-label="Copy message"
            title="Copy"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        )}
        <div
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
        {!(message.role === "assistant" && !message.content) && (
          <div
            className={cn(
              "mt-1 text-[10px] opacity-60",
              isUser ? "text-right" : "text-left"
            )}
          >
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}
