# Software Requirements Specification

## 1. Navigation Layout
- **REQ-NAV-01**: The application shall use a left sidebar navigation instead of a top navbar for authenticated pages.
- **REQ-NAV-02**: The sidebar shall be collapsible on mobile devices with a hamburger toggle.
- **REQ-NAV-03**: The sidebar shall display user avatar, name, and primary navigation links with active state highlighting.
- **REQ-NAV-04**: Auth pages (/login, /register, /) shall remain fullscreen without sidebar.

## 2. Database Schema
- **REQ-DB-01**: The User model already includes `avatar String?` column in Prisma schema.
- **REQ-DB-02**: The application shall support avatar URL storage and retrieval.

## 3. Form Validation — Interval Field
- **REQ-FORM-01**: The `interval` property shall NOT be sent in update/edit mutation payloads.
- **REQ-FORM-02**: The `interval` field shall only appear in create forms, not edit forms.

## 4. Modal UX
- **REQ-MODAL-01**: All modals shall be scrollable when content exceeds viewport height (max-height 85vh with overflow-y-auto).
- **REQ-MODAL-02**: Modal backdrop shall remain fixed while content scrolls.
- **REQ-MODAL-03**: Modal shall not overflow off-screen on small viewports.

## 5. OCR Receipt Scan Flow
- **REQ-OCR-01**: After scanning, a compact summary card shall show item count and total amount.
- **REQ-OCR-02**: A "Review Items" button shall open a secondary modal to view and edit individual scanned items.
- **REQ-OCR-03**: Items can be edited (name, quantity, price) or removed before final submission.
- **REQ-OCR-04**: The primary add modal shall not expand beyond reasonable height when scan results appear.

## 6. Confirmation Dialogs
- **REQ-CONFIRM-01**: A reusable confirmation dialog component shall exist.
- **REQ-CONFIRM-02**: Delete actions shall prompt "Are you sure?" with item name/context.
- **REQ-CONFIRM-03**: Bulk/irreversible actions shall require explicit confirmation.

## 7. Design Turnover
- **REQ-DESIGN-01**: Consistent left-sidebar layout across all authenticated pages.
- **REQ-DESIGN-02**: Improved spacing, card shadows, and visual hierarchy.
- **REQ-DESIGN-03**: No oversized modals; scrollable content regions.
- **REQ-DESIGN-04**: Clean, minimal aesthetic with sky-blue primary accent on OLED dark theme.

## 8. AI Chatbot — FinBot

### 8.1 Architecture & Security
- **REQ-CHAT-ARCH-01**: The chatbot shall be implemented as a frontend-only component calling the OpenRouter API directly via `fetch` from the browser.
- **REQ-CHAT-ARCH-02**: The OpenRouter API key shall be stored in an environment variable `NEXT_PUBLIC_OPENROUTER_API_KEY` and embedded at build time. The user is responsible for rotating this key periodically due to client-side exposure.
- **REQ-CHAT-ARCH-03**: The default LLM model shall be `openai/gpt-4o-mini` via OpenRouter for cost efficiency, with the ability to switch models via configuration.
- **REQ-CHAT-ARCH-04**: All chat communication shall use HTTPS (`https://openrouter.ai/api/v1/chat/completions`).
- **REQ-CHAT-ARCH-05**: The chatbot shall only appear on authenticated pages (dashboard and all feature pages under `/`). It shall be hidden on `/login`, `/register`, and `/not-found`.
- **REQ-CHAT-ARCH-06**: No server-side chatbot proxy shall be built unless explicitly requested later.

### 8.2 UI/UX Requirements
- **REQ-CHAT-UI-01**: A floating action button (FAB) shall be displayed at the bottom-right corner of the viewport (`fixed bottom-6 right-6`, z-index above all content).
- **REQ-CHAT-UI-02**: The FAB shall use a chat bubble icon (Lucide `MessageCircle`). When the chat panel is open, the icon shall change to an X (`X`).
- **REQ-CHAT-UI-03**: Clicking the FAB shall toggle a chat panel. The panel shall be `fixed bottom-20 right-6` on desktop, `fixed bottom-0 left-0 right-0` on mobile (slides up from bottom).
- **REQ-CHAT-UI-04**: The chat panel shall have a fixed width of `420px` on desktop (max `95vw`) and full-width on mobile, with a max-height of `600px` (max `85vh`).
- **REQ-CHAT-UI-05**: The panel shall have a header bar showing "FinBot" title and a close button (X).
- **REQ-CHAT-UI-06**: The chat body shall display messages in a scrollable area. User messages shall be right-aligned with a sky-blue background. AI messages shall be left-aligned with a card/background background.
- **REQ-CHAT-UI-07**: Each message shall display a timestamp (HH:mm format).
- **REQ-CHAT-UI-08**: An input area shall be fixed to the bottom of the chat panel. It shall be a textarea that auto-resizes up to 4 lines.
- **REQ-CHAT-UI-09**: Pressing `Enter` (without Shift) shall send the message. Pressing `Shift+Enter` shall insert a newline.
- **REQ-CHAT-UI-10**: The send button shall be disabled while the AI is generating a response (streaming).
- **REQ-CHAT-UI-11**: While streaming, a subtle animated indicator (three bouncing dots) shall appear below the AI's partial message.
- **REQ-CHAT-UI-12**: A "Clear Chat" button shall exist in the panel header (with confirmation). Clicking it clears all messages from local state (not persisted).
- **REQ-CHAT-UI-13**: An empty state message shall appear in the chat body when no messages exist: "Ask me about your finances, budgets, or goals."
- **REQ-CHAT-UI-14**: The chat panel shall trap focus when open (Escape key closes it). The FAB shall have `aria-label="Open FinBot"` when closed and `aria-label="Close FinBot"` when open.
- **REQ-CHAT-UI-15**: The chat panel shall close automatically when the user navigates to a different page (Next.js route change).

### 8.3 System Prompt Specification
- **REQ-CHAT-PROMPT-01**: The system prompt shall be a single string constructed at runtime. It shall be very long and detailed, covering every feature of the app.
- **REQ-CHAT-PROMPT-02**: The prompt shall include the current date in ISO format.
- **REQ-CHAT-PROMPT-03**: The prompt shall include the authenticated user's username.
- **REQ-CHAT-PROMPT-04**: The prompt shall define the AI's identity: "You are FinBot, the AI financial advisor assistant for FinPro, an all-in-one personal finance web application."
- **REQ-CHAT-PROMPT-05**: The prompt shall list every app feature with a brief description:
  - **Expenses**: Track spending with categories, time filters (this month, last month, this year, all time), pie charts, trend bar charts, receipt OCR auto-fill.
  - **Income**: Track earnings with categories, time filters, and charts.
  - **Budgets**: Set monthly spending limits per category with start/end dates.
  - **Goals**: Create savings targets with deadlines and track progress percentages.
  - **Investments**: Track investment categories (stocks, crypto, bonds, real estate) and allocate saving points.
  - **Bills**: Create recurring bills with due dates and status (PENDING, PAID, OVERDUE) and reminder toggles.
  - **Debts**: Automatically generated when a budget is overspent; track debt amounts per category.
  - **Split Bills**: Divide expenses with friends, track who owes what.
  - **Receipt Scanner**: Upload receipt images, OCR extraction, auto-fill transaction data.
  - **Saving Points**: Allocate budget surplus to savings goals.
  - **Friends**: Add friends, manage requests, search users.
  - **Activity Logs**: Audit trail of all user actions across the app.
  - **Notifications**: Alerts for bills, budgets, goals.
  - **Email Sync**: Scan Gmail for transaction emails and auto-import.
  - **Settings**: Currency, theme, notification preferences.
- **REQ-CHAT-PROMPT-06**: The prompt shall include the user's actual financial summary (computed from React Query cache). This includes:
  - Total balance (income minus expenses all-time)
  - Total expenses this month and last month
  - Total income this month and last month
  - Number of active budgets and % used for each
  - Number of goals, how many are in-progress, and closest deadline
  - Total investments across all categories
  - Number of pending/overdue bills and next due date
  - Number of debt points and total debt amount
  - Number of saving points and total saved amount
- **REQ-CHAT-PROMPT-07**: If any financial summary data is unavailable (cache empty, loading, or user has no data), the prompt shall say "User has no [data type] recorded yet." for that section.
- **REQ-CHAT-PROMPT-08**: The prompt shall instruct the AI on tone: "Be concise, helpful, and supportive. Use simple language. When giving advice, ground it in the user's actual data. Do not make up numbers. If data is missing, say so and suggest how to add it."
- **REQ-CHAT-PROMPT-09**: The prompt shall include a CRITICAL safety instruction: "You must ONLY answer questions related to personal finance, budgeting, saving, investing, money management, or FinPro app features. If the user asks about anything else — coding, programming, recipes, food, weather, math homework, general trivia, entertainment, politics, relationships, or any topic unrelated to personal finance — you must reply EXACTLY with this sentence and nothing else: 'I can only help with personal finance and FinPro-related questions.' Do not provide any other response, explanation, or apology for off-topic questions."
- **REQ-CHAT-PROMPT-10**: The prompt shall include formatting instructions: "Use bullet points for lists. Use bold for important numbers. Do not use markdown tables. Keep responses under 200 words unless the user explicitly asks for detail."
- **REQ-CHAT-PROMPT-11**: The prompt shall include currency awareness: "All monetary values are in Indonesian Rupiah (IDR). Format large numbers with commas (e.g., Rp 1,500,000)."

### 8.4 Off-Topic Guard Requirements
- **REQ-CHAT-GUARD-01**: A client-side pre-filter shall run BEFORE sending any message to the API. This is Layer 1 defense.
- **REQ-CHAT-GUARD-02**: The pre-filter shall use regex and keyword matching to detect off-topic queries.
- **REQ-CHAT-GUARD-03**: BLOCKED exact keywords (case-insensitive): `code`, `coding`, `program`, `programming`, `developer`, `python`, `javascript`, `typescript`, `react`, `nextjs`, `html`, `css`, `java`, `cpp`, `c++`, `golang`, `rust`, `sql`, `database`, `algorithm`, `leetcode`, `hackerrank`, `api design`, `software engineering`, `web development`, `app development`, `debug`, `bug`, `error fix`, `recipe`, `cooking`, `bake`, `ingredient`, `kitchen`, `food recipe`, `restaurant`, `chef`, `menu`, `dish`, `weather`, `forecast`, `temperature`, `rain`, `sunny`, `math problem`, `solve for x`, `equation`, `algebra`, `calculus`, `geometry`, `homework`, `assignment`, `essay`, `write a poem`, `write a story`, `song lyrics`, `movie`, `film`, `actor`, `celebrity`, `sports`, `football`, `basketball`, `politics`, `election`, `government`, `religion`, `dating`, `relationship`, `love advice`, `horoscope`, `zodiac`, `travel`, `flight`, `hotel`, `vacation plan`.
- **REQ-CHAT-GUARD-04**: BLOCKED regex patterns: URLs (`https?://`, `www\.`, `\.(com|org|net|io|co|id)`), code snippets (`\{|\}|function\s+\w+\s*\(|const\s+\w+\s*=`), math equations (`=.*\+.*=|\d+x\+\d+=`).
- **REQ-CHAT-GUARD-05**: ALLOWED keywords that overlap with blocklist but are finance-related: `budget`, `expense`, `income`, `saving`, `investment`, `stock`, `stocks`, `crypto`, `cryptocurrency`, `bond`, `bonds`, `real estate`, `property`, `debt`, `bill`, `bills`, `receipt`, `goal`, `goals`, `transaction`, `category`, `allocation`, `finance`, `financial`, `money`, `spending`, `earning`, `profit`, `loss`, `balance`, `bank`, `account`, `IDR`, `rupiah`, `tax`, `insurance`, `retirement`, `emergency fund`, `portfolio`, `dividend`, `interest rate`, `inflation`, `ROI`, `net worth`.
- **REQ-CHAT-GUARD-06**: If a message passes the allowlist check (contains allowed finance keywords), it shall NOT be blocked even if it contains blocked words in a financial context (e.g., "What is the best stock to invest in?" contains "best" which is not blocked, but "stock" is allowed).
- **REQ-CHAT-GUARD-07**: Priority rule: ALLOWED keywords override BLOCKED keywords. If both exist in the same message, allow it.
- **REQ-CHAT-GUARD-08**: If Layer 1 blocks a message, display a local error toast: "I can only help with personal finance and FinPro-related questions." Do NOT call the API.
- **REQ-CHAT-GUARD-09**: Layer 2 defense is the system prompt itself (REQ-CHAT-PROMPT-09). If the AI somehow responds to an off-topic question, the frontend shall NOT attempt to filter the response — the system prompt is the final line of defense.

### 8.5 API Integration Requirements
- **REQ-CHAT-API-01**: The frontend shall send a POST request to `https://openrouter.ai/api/v1/chat/completions`.
- **REQ-CHAT-API-02**: Request headers shall include: `Authorization: Bearer ${NEXT_PUBLIC_OPENROUTER_API_KEY}`, `Content-Type: application/json`, `HTTP-Referer: ${window.location.origin}`, `X-Title: FinPro`.
- **REQ-CHAT-API-03**: Request body shall include: `model`, `messages` (system + history + user), `stream: true`, `temperature: 0.7`, `max_tokens: 800`.
- **REQ-CHAT-API-04**: The response shall be read as a ReadableStream. Each chunk is parsed as Server-Sent Event (SSE) format (`data: {...}`).
- **REQ-CHAT-API-05**: The `content` delta from each SSE chunk shall be appended to the AI message in real-time.
- **REQ-CHAT-API-06**: On API error (network failure, invalid key, rate limit), display a user-friendly message: "FinBot is unavailable right now. Please try again later." Log the actual error to console.
- **REQ-CHAT-API-07**: On API success but empty response, display: "I didn't get a response. Can you rephrase your question?"
- **REQ-CHAT-API-08**: A loading/cancel mechanism is NOT required for MVP. The user can close the panel while streaming; the stream continues in the background and the message is retained.

### 8.6 Rate Limiting
- **REQ-CHAT-RATE-01**: Client-side rate limiting shall use `localStorage` key `finbot_rate_limit`.
- **REQ-CHAT-RATE-02**: The format shall be `{ count: number, resetAt: ISOString }`.
- **REQ-CHAT-RATE-03**: Limit: 30 messages per rolling 1-hour window per browser.
- **REQ-CHAT-RATE-04**: When limit is exceeded, display: "You've reached the message limit. Please try again in [X] minutes." and disable the send button.
- **REQ-CHAT-RATE-05**: The rate limit counter shall reset automatically when the `resetAt` time passes.
- **REQ-CHAT-RATE-06**: The rate limit does NOT persist across different browsers/devices (by design, since there is no server-side tracking).

### 8.7 Message History
- **REQ-CHAT-HISTORY-01**: Message history shall be stored in component local state (`useState`). It is NOT persisted to localStorage, database, or server.
- **REQ-CHAT-HISTORY-02**: On page refresh, the chat history is reset to empty.
- **REQ-CHAT-HISTORY-03**: The message history passed to the API shall include the last 10 messages (5 user + 5 AI exchanges) to stay within token limits.
- **REQ-CHAT-HISTORY-04**: Each message in history shall have `role: "user" | "assistant"` and `content: string`.
- **REQ-CHAT-HISTORY-05**: The system prompt is prepended as the first message with `role: "system"` on every API call.

### 8.8 Financial Context Builder
- **REQ-CHAT-CONTEXT-01**: A utility function `buildFinancialContext()` shall read the React Query client cache to extract user data without making new API calls.
- **REQ-CHAT-CONTEXT-02**: It shall read the following query keys from cache: `["transactions-all"]`, `["transactions", "EXPENSE"]`, `["transactions", "INCOME"]`, `["budgets"]`, `["goals"]`, `["investments"]`, `["bills"]`, `["debts"]`, `["saving-points"]`.
- **REQ-CHAT-CONTEXT-03**: If a query key is not in cache, the function returns "No data" for that section.
- **REQ-CHAT-CONTEXT-04**: The function shall compute summary statistics: total income, total expenses, net balance, active budget count and usage, goal progress, investment total, pending bills count, total debt, total saving points.
- **REQ-CHAT-CONTEXT-05**: The output shall be a plain text string formatted for inclusion in the system prompt, not a JSON object.

### 8.9 File Structure
- **REQ-CHAT-FILES-01**: `src/components/chat/ChatWidget.tsx` — Main floating widget component, manages open/close state, renders FAB and panel.
- **REQ-CHAT-FILES-02**: `src/components/chat/ChatMessage.tsx` — Individual message bubble component.
- **REQ-CHAT-FILES-03**: `src/hooks/useChat.ts` — Custom hook managing messages, API calls, streaming, rate limiting, guard checks.
- **REQ-CHAT-FILES-04**: `src/lib/chat-prompt.ts` — System prompt builder function. Exports `buildSystemPrompt(context: string): string`.
- **REQ-CHAT-FILES-05**: `src/lib/chat-guard.ts` — Off-topic guard. Exports `isOffTopic(message: string): { blocked: boolean; reason?: string }`.
- **REQ-CHAT-FILES-06**: `src/lib/chat-context.ts` — Financial context builder. Exports `buildFinancialContext(queryClient: QueryClient): string`.
- **REQ-CHAT-FILES-07**: The chat widget shall be imported and rendered inside `src/components/common/MainWrapper.tsx` so it appears on all authenticated pages.

### 8.10 Acceptance Criteria
- **AC-CHAT-01**: User clicks FAB, chat panel opens. User types "How much did I spend this month?" and receives a response grounded in their actual expense data.
- **AC-CHAT-02**: User asks "What is the best restaurant in Jakarta?" — the guard blocks it and shows the off-topic toast. No API call is made.
- **AC-CHAT-03**: User asks "Write me a Python script" — the guard blocks it.
- **AC-CHAT-04**: User asks "How do I save for retirement?" — allowed, AI responds with financial advice.
- **AC-CHAT-05**: User sends 31 messages within 1 hour — the 31st is blocked with rate limit message.
- **AC-CHAT-06**: AI response streams in word-by-word, not waiting for full response.
- **AC-CHAT-07**: Chat panel closes on Escape key and on route navigation.
- **AC-CHAT-08**: Chat widget does not appear on `/login` page.

## 9. Split Bills

### 9.1 Core Concept
- **REQ-SPLIT-01**: A Split Bill allows a user (creator) to divide a receipt/expense among friends, with each friend assigned a specific amount.
- **REQ-SPLIT-02**: The creator uploads a receipt image which is stored and displayed to all participants as a reference.
- **REQ-SPLIT-03**: Friends are linked from the authenticated user's friend list, not typed as free-text names.
- **REQ-SPLIT-04**: Each participant has a payment status: `PENDING` → `PAID_PENDING_CONFIRMATION` → `CONFIRMED` (or back to `PENDING` if rejected).

### 9.2 Receipt OCR Flow
- **REQ-SPLIT-OCR-01**: Creator uploads a receipt image during split bill creation.
- **REQ-SPLIT-OCR-02**: Backend sends image to OCR service, returns extracted items (name, quantity, price).
- **REQ-SPLIT-OCR-03**: Creator reviews extracted items in a modal — can edit item names, quantities, prices, or remove items.
- **REQ-SPLIT-OCR-04**: Creator confirms the items, and the total becomes the `totalAmount` of the split bill.
- **REQ-SPLIT-OCR-05**: The receipt image is persisted (URL stored in database) and visible to all participants.

### 9.3 Friend Selection
- **REQ-SPLIT-FRIEND-01**: Creator selects friends from their existing friend list.
- **REQ-SPLIT-FRIEND-02**: Each selected friend becomes a participant with an assigned amount.
- **REQ-SPLIT-FRIEND-03**: The creator can manually adjust the split amount per participant (not always equal split).
- **REQ-SPLIT-FRIEND-04**: Validation: sum of all participant amounts must equal the `totalAmount`.

### 9.4 Two-Sided Payment Confirmation
- **REQ-SPLIT-PAY-01**: Participant (friend) sees the split bill in their "Split Bills" page under "Bills I Owe".
- **REQ-SPLIT-PAY-02**: Participant can upload a payment proof image (bank transfer screenshot, etc.).
- **REQ-SPLIT-PAY-03**: Participant presses "I Have Paid" → status changes to `PAID_PENDING_CONFIRMATION`.
- **REQ-SPLIT-PAY-04**: Creator receives a notification: "[Friend] has marked payment as paid. Please confirm."
- **REQ-SPLIT-PAY-05**: Creator views the payment proof image and can either **Confirm** (status → `CONFIRMED`) or **Reject** (status → `PENDING` with a reason note).
- **REQ-SPLIT-PAY-06**: If confirmed, the split bill's overall status may become `SETTLED` when all participants are confirmed.
- **REQ-SPLIT-PAY-07**: Participant can view the original receipt image at any time for reference.

### 9.5 Notifications
- **REQ-SPLIT-NOTIF-01**: Notification sent to participant when added to a new split bill.
- **REQ-SPLIT-NOTIF-02**: Notification sent to creator when participant marks as paid.
- **REQ-SPLIT-NOTIF-03**: Notification sent to participant when creator confirms or rejects payment.

### 9.6 Data Schema
- **REQ-SPLIT-SCHEMA-01**: `SplitBill` table fields: `id`, `creatorId`, `description`, `totalAmount`, `receiptImageUrl`, `status` (`PENDING` | `SETTLED`), `date`, `createdAt`.
- **REQ-SPLIT-SCHEMA-02**: `SplitBillParticipant` table fields: `id`, `splitBillId`, `userId` (friend's user ID, nullable for backward compat), `name` (for display), `amount`, `status` (`PENDING` | `PAID_PENDING_CONFIRMATION` | `CONFIRMED`), `paymentProofUrl`, `rejectionReason`, `createdAt`.

### 9.7 Frontend UX
- **REQ-SPLIT-UI-01**: Split Bills page shows two tabs: "Bills I Created" and "Bills I Owe".
- **REQ-SPLIT-UI-02**: Create modal: upload receipt → OCR review → select friends → adjust amounts → create.
- **REQ-SPLIT-UI-03**: Detail modal shows receipt image, item breakdown, participant list with statuses.
- **REQ-SPLIT-UI-04**: Participant view shows "Upload Proof" button and "Mark as Paid" button.
- **REQ-SPLIT-UI-05**: Creator view shows "Confirm" / "Reject" buttons for pending confirmations.

## 10. Budget Surplus & Debt Allocation

### 9.1 Surplus Generation
- **REQ-SURPLUS-01**: A SavingPoint shall be generated per individual budget when the budget's period ends and `totalSpent < budgetAmount`.
- **REQ-SURPLUS-02**: The surplus amount shall equal `budgetAmount - totalSpent` for the entire budget period.
- **REQ-SURPLUS-03**: If a SavingPoint already exists for a budget, the surplus shall accumulate (upsert, increment `savingAmount`), not create a duplicate row.
- **REQ-SURPLUS-04**: Surplus shall only be calculated for budgets whose `endDate` has passed.
- **REQ-SURPLUS-05**: The cron job shall run daily at 1:00 AM to evaluate all ended budgets from the previous day.

### 9.2 Surplus Allocation Targets
- **REQ-SURPLUS-06**: Users may allocate SavingPoint balance to three targets: **Goal**, **Investment**, or **Debt Payment**.
- **REQ-SURPLUS-07**: Allocation shall only be possible after the budget period has ended.
- **REQ-SURPLUS-08**: Allocation amount must be `<=` the SavingPoint's current `savingAmount`.
- **REQ-SURPLUS-09**: On allocation to a Goal: deduct from SavingPoint, increment Goal `currentAmount`, create `GoalContribution` record.
- **REQ-SURPLUS-10**: On allocation to an Investment: deduct from SavingPoint, increment `Investment.totalAmount` for the selected category, create `InvestmentAllocation` record.
- **REQ-SURPLUS-11**: On allocation to Debt Payment: deduct from SavingPoint, decrement `DebtPoint.debtAmount`. If debt reaches zero, optionally delete the DebtPoint record.
- **REQ-SURPLUS-12**: Each allocation shall create an `ActivityLog` entry with action type `ALLOCATE`.

### 9.3 Overspend Debt Creation
- **REQ-SURPLUS-13**: When `totalSpent > budgetAmount`, a DebtPoint shall be automatically created/updated for that budget via `upsert`.
- **REQ-SURPLUS-14**: Debt creation shall trigger a `BUDGET_ALERT` notification.
- **REQ-SURPLUS-15**: DebtPoint `debtAmount` shall accumulate on repeated overspends, not overwrite.

### 9.4 Frontend UX
- **REQ-SURPLUS-16**: A `/saving-points` page shall list all SavingPoints grouped by budget category, showing budget name, period, and surplus amount.
- **REQ-SURPLUS-17**: Each SavingPoint card shall display an "Allocate" button that opens a modal to choose target (Goal, Investment, Pay Debt) and amount.
- **REQ-SURPLUS-18**: The allocation modal shall validate that amount `<=` available surplus and show a user-friendly error on insufficient balance.
- **REQ-SURPLUS-19**: SavingPoints with `savingAmount <= 0` shall be visually marked as "Fully Allocated" or hidden.
- **REQ-SURPLUS-20**: The sidebar navigation shall include a "Saving Points" link with a badge showing count of unallocated saving points.
