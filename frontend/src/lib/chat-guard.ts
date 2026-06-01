/**
 * Off-topic guard for FinBot chatbot.
 * Layer 1 defense: blocks non-finance queries before they reach the API.
 */

const BLOCKED_KEYWORDS: string[] = [
  "coding", "programming", "developer",
  "python", "javascript", "typescript", "react", "nextjs", "html", "css",
  "java", "cpp", "c++", "golang", "rust", "database",
  "algorithm", "leetcode", "hackerrank", "api design", "software engineering",
  "web development", "app development", "debugging", "error fix",
  "recipe", "cooking", "bake", "ingredient", "kitchen", "food recipe",
  "restaurant", "chef", "menu", "dish",
  "weather", "forecast", "temperature", "rain", "sunny",
  "math problem", "solve for x", "equation", "algebra", "calculus", "geometry",
  "homework", "assignment", "essay", "write a poem", "write a story", "song lyrics",
  "movie", "film", "actor", "celebrity",
  "sports", "football", "basketball",
  "politics", "election", "government", "religion",
  "dating", "relationship", "love advice", "horoscope", "zodiac",
  "travel", "flight", "hotel", "vacation plan",
];

// Words that must match as whole words to avoid false positives
const BLOCKED_WORDS: string[] = [
  "code", // avoid "decode", "encode"
  "program", // avoid "savings program"
  "bug", // avoid "budget", "debug"
  "sql", // avoid words containing "sql"
];

const ALLOWED_KEYWORDS: string[] = [
  "budget", "expense", "income", "saving", "investment",
  "stock", "stocks", "crypto", "cryptocurrency", "bond", "bonds",
  "real estate", "property", "debt", "bill", "bills", "receipt",
  "goal", "goals", "transaction", "category", "allocation",
  "finance", "financial", "money", "spending", "earning",
  "profit", "loss", "balance", "bank", "account",
  "idr", "rupiah", "tax", "insurance", "retirement", "emergency fund",
  "portfolio", "dividend", "interest rate", "inflation", "roi", "net worth",
];

const BLOCKED_PATTERNS: RegExp[] = [
  /https?:\/\//i,
  /www\./i,
  /\.(com|org|net|io|co|id)\b/i,
  /\{|\}/,
  /function\s+\w+\s*\(/i,
  /const\s+\w+\s*=/i,
  /\d+x\+\d+=/,
  /=.*\+.*=/,
];

interface GuardResult {
  blocked: boolean;
  reason?: string;
}

/**
 * Checks if a message is off-topic.
 * Priority: ALLOWED keywords override BLOCKED keywords.
 */
export function isOffTopic(message: string): GuardResult {
  const lower = message.toLowerCase().trim();
  if(!lower) {
    return { blocked: false };
  }

  // Check allowed keywords first — finance terms override everything
  const hasAllowed = ALLOWED_KEYWORDS.some((kw) => lower.includes(kw));
  if(hasAllowed) {
    return { blocked: false };
  }

  // Check blocked keywords (phrases)
  for(const kw of BLOCKED_KEYWORDS) {
    if(lower.includes(kw)) {
      return { blocked: true, reason: `Blocked keyword: "${kw}"` };
    }
  }

  // Check blocked whole words (word boundary to avoid false positives)
  for(const w of BLOCKED_WORDS) {
    const regex = new RegExp(`\\b${w}\\b`, "i");
    if(regex.test(message)) {
      return { blocked: true, reason: `Blocked word: "${w}"` };
    }
  }

  // Check blocked regex patterns
  for(const pattern of BLOCKED_PATTERNS) {
    if(pattern.test(message)) {
      return { blocked: true, reason: `Blocked pattern: ${pattern.source}` };
    }
  }

  return { blocked: false };
}
