import dynamic from "next/dynamic";

/**
 * Code-split heavy components for better initial bundle size.
 */
export const DynamicChatWidget = dynamic(
  () => import("@/components/chat/ChatWidget").then((m) => m.ChatWidget),
  { ssr: false }
);

export const DynamicCsvImport = dynamic(
  () => import("@/components/ui/CsvImport").then((m) => m.CsvImport),
  { ssr: false }
);
