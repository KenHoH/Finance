# FinPro Frontend - Comprehensive Codebase Analysis

## 1. App Overview

**FinPro** is an all-in-one personal finance dashboard web application. It helps users track income, expenses, budgets, savings goals, investments, bills, debts, and split bills with friends. It features a dark-themed UI with a collapsible sidebar navigation, real-time financial overview cards, an AI-powered financial advisor chatbot (FinBot), receipt OCR scanning, and Google OAuth authentication.

**Currency:** Indonesian Rupiah (IDR)  
**Theme:** Dark mode only (slate/blue palette)  
**Auth:** Google OAuth 2.0 via backend API  

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| React | 19.2.3 |
| Styling | Tailwind CSS v4 + `tailwind-merge` + `clsx` |
| State | Zustand (auth, sidebar, toast) |
| Server State | TanStack React Query v5 |
| HTTP Client | Axios (with CSRF token interceptors) |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Date Utils | date-fns v4 |
| Chat AI | OpenRouter API (free models) |

---

## 3. Complete Feature Inventory

### Pages (App Router)
| Route | Feature | Status |
|-------|---------|--------|
| `/` | Marketing landing page with Google login | Done |
| `/login` | Auth page with value props | Done |
| `/dashboard` | Main dashboard with overview, recent transactions, budgets widget, goals widget | Done |
| `/income` | CRUD income transactions with categories, filtering, CSV export, recurring intervals | Done |
| `/expenses` | CRUD expense transactions with categories, receipt OCR scan, CSV export | Done |
| `/budgets` | CRUD budgets per category with date ranges, spending status | Done |
| `/goals` | Savings goals with contributions, progress tracking, deadlines | Done |
| `/bills` | Recurring bills with due dates, pay action, reminders | Done |
| `/debts` | Debt tracking linked to budgets | Done |
| `/investments` | Investment categories with allocations, portfolio chart | Done |
| `/investments/[id]` | Investment detail with allocation history area chart | Done |
| `/split-bills` | Shared expense splitting with friends, receipt scan, participant tracking | Done |
| `/categories` | Manage income/expense categories with icons | Done |
| `/friends` | Friend system with search, requests, send/accept/reject | Done |
| `/notifications` | Notification inbox with read/unread, filtering by type | Done |
| `/settings` | Key-value settings (currency, theme, notifications, language) | Done |
| `/activity-logs` | Audit log of user actions with filtering | Done |
| `/email` | Email transaction integration page | Minimal |
| `/receipts` | Receipt management page | Minimal |

### Global UI
- **Sidebar** - Collapsible, 9 nav items, active indicator, mobile drawer
- **TopBar** - Friends, Settings, Notifications links, user avatar, logout
- **QuickAddButton** - FAB with 5 quick action links (Income, Expense, Bill, Goal, Debt)
- **ChatWidget** - Floating AI chat panel (FinBot)
- **ToastContainer** - Global toast notifications
- **PageTransition** - Framer Motion page transitions
- **AmbientBackground** - Decorative gradient orbs

---

## 4. Component Architecture

### UI Components (`/components/ui/`)
| Component | Purpose | Notes |
|-----------|---------|-------|
| `Modal` | Accessible modal with focus trap, Escape close, success state | Done |
| `DatePicker` | Calendar date picker with timezone-safe formatting | Recently fixed |
| `CurrencyInput` | IDR formatted input with `Rp` prefix | Done |
| `Skeleton` | Loading shimmer placeholder | Done |
| `EmptyState` | Empty state with image, title, description | Done |
| `FormField` | Label + input wrapper with error display | Done |
| `ProgressRing` | Circular progress indicator | Done |
| `StatusBadge` | Colored status pill (paid/pending/overdue/cancelled) | Done |

### Common Components (`/components/common/`)
| Component | Purpose |
|-----------|---------|
| `Navbar` | Top mobile/nav bar with primary + "More" dropdown nav |
| `Sidebar` | Desktop collapsible sidebar with nav items |
| `TopBar` | Desktop top bar with user actions |
| `MainWrapper` | Layout wrapper that conditionally renders sidebar/topbar/chat based on auth |
| `QuickAddButton` | Floating action button for quick navigation |
| `ToastContainer` | Toast notification renderer |
| `PageTransition` | Framer Motion AnimatePresence wrapper |
| `AmbientBackground` | Decorative blurred gradient background |
| `InvestmentCard` | Card component for investment display |

### Chat Components (`/components/chat/`)
| Component | Purpose |
|-----------|---------|
| `ChatWidget` | Floating chat panel UI with model selector, stop/clear, copy |
| `ChatMessage` | Individual message bubble with markdown rendering |

### Dashboard Features (`/features/dashboard/components/`)
| Component | Purpose |
|-----------|---------|
| `Dashboard` | Main dashboard layout with widgets |
| `DashboardOverview` | Summary cards (Balance, Expenses, Investments) |

---

## 5. Utilities & Helpers Inventory

### `@/lib/utils.ts`
| Function | Purpose |
|----------|---------|
| `cn(...)` | Merge Tailwind classes with `clsx` + `tailwind-merge` |
| `formatCurrency(amount)` | Format number as IDR (`Rp 1.234.567`) |
| `unwrapArray<T>(res)` | Unwrap API response from various wrapper shapes |
| `formatLocalDate(d)` | Format Date to `YYYY-MM-DD` without timezone shift |
| `dateToApiISO(dateStr)` | Convert `YYYY-MM-DD` to ISO string at noon (TZ-safe) |
| `apiDateToInput(dateStr)` | Extract `YYYY-MM-DD` from ISO date string |

### `@/lib/validation.ts`
| Function | Purpose |
|----------|---------|
| `validateNumber(value, field, opts)` | Number validation with min/max/zero checks |
| `validateString(value, field, opts)` | String validation with min/max/pattern |
| `validateDate(value, field)` | Date validation (rejects future dates) |
| `validateEmail(value)` | Email format validation |
| `validatePassword(value)` | Password strength (8+ chars, uppercase, number) |
| `runValidators(...)` | Aggregate multiple validators into error array |

### `@/lib/api.ts`
| Export | Purpose |
|--------|---------|
| `api` | Axios instance with CSRF token interceptors |
| `get`, `post`, `put`, `del`, `patch` | Typed HTTP wrappers |
| `fetchCsrfToken()` | Fetch CSRF token from `/api/auth/csrf` |
| `setCsrfToken(token)` | Manually set CSRF token |
| `extractApiError(err, fallback)` | Extract error message from Axios error |

### Chat Utilities
| File | Purpose |
|------|---------|
| `chat-context.ts` | Reads React Query cache to build financial summary string for AI context |
| `chat-guard.ts` | Off-topic filter (blocks coding, cooking, weather, etc.) with allowlist override |
| `chat-prompt.ts` | Builds detailed system prompt describing all FinPro features |

---

## 6. State Management (Zustand Stores)

| Store | State | Actions |
|-------|-------|---------|
| `useAuthStore` | `user: User \| null`, `isLoading` | `fetchUser`, `logout`, `setUser` |
| `useSidebarStore` | `collapsed: boolean` | `toggle` |
| `useToastStore` | `toasts: Toast[]` | `addToast`, `removeToast` |

---

## 7. Data Models (`@/lib/types.ts`)

**Core Entities:**
- `Transaction` - id, date, description, amount, type (INCOME/EXPENSE), source, categoryId, category
- `Bill` - title, amount, dueDate, status (PENDING/PAID/OVERDUE), category, isReminderEnabled
- `Budget` - amount, startDate, endDate, category
- `Goal` - name, targetAmount, currentAmount, deadline, status
- `Investment` - categoryId, totalAmount, category
- `Allocation` - categoryId, amount, allocationDate, note
- `SplitBill` - description, totalAmount, date, status, participants[]
- `Participant` - name, amount, status (PENDING/PAID)
- `DebtPoint` - budgetId, debtAmount, budget
- `SavingPoint` - budgetId, savingAmount, budget
- `Notification` - type, title, message, isRead, readAt
- `Friend` / `FriendRequest` / `FriendUser`
- `ActivityLog` - action, entity, entityId, details
- `Setting` - key, value
- `User` - id, email, username, avatar

---

## 8. Chatbot (FinBot) System

**Hook:** `useChat.ts`
- 4 selectable AI models via OpenRouter (free tier)
- Client-side rate limiting: 30 messages/hour via `localStorage`
- `AbortController` for stopping streaming
- Financial context injection via `buildFinancialContext`
- Off-topic guard via `isOffTopic`
- Markdown rendering for assistant messages
- Auto-scroll, copy-to-clipboard, clear history

---

## 9. Design System & Styling

- **CSS Variables** in `globals.css`: background (#020617), foreground (#f8fafc), primary (#38bdf8), card (#0f172a), border (#1e293b)
- **Font:** IBM Plex Sans + IBM Plex Mono
- **Radius:** 0.75rem base, consistent rounded-xl usage
- **Effects:** Glass card, glow border, skeleton shimmer, fade-in animation
- **Scrollbar:** Custom thin scrollbar
- **Base font size:** 18px

---

## 10. What is Missing / Gaps / Improvements

### A. Missing Utility Helpers (`@/lib/utils.ts`)
These would reduce code duplication across pages:

1. **`debounce(fn, ms)`** - For search inputs (friends, activity logs)
2. **`throttle(fn, ms)`** - For scroll/resize handlers
3. **`formatDateRelative(date)`** - "2 hours ago", "Yesterday" instead of full date
4. **`formatDateDisplay(date)`** - Centralized `dd MMM yyyy` formatter to avoid scattered `format(new Date(...))`
5. **`clamp(value, min, max)`** - Used in budget percentage calculations
6. **`calculatePercentage(part, total)`** - Avoids division-by-zero bugs
7. **`groupBy<T>(array, key)`** - For grouping transactions by month/category
8. **`sortByDate(array, key, desc?)`** - Centralized date sorting
9. **`generateCSV(data, headers)`** - Currently CSV logic is duplicated in income/expenses pages
10. **`downloadFile(content, filename, type)`** - For CSV/JSON exports
11. **`isOverdue(date)`** / **`isDueSoon(date, days)`** - Bill due date helpers
12. **`truncate(str, maxLength)`** - For long descriptions
13. **`slugify(str)`** - For URL-friendly strings
14. **`formatNumberCompact(n)`** - "1.2M" instead of "1.200.000"
15. **`deepEqual(a, b)`** - For comparing form state before submit
16. **`useLocalStorage(key, defaultValue)`** - Custom hook (currently only in useChat)
17. **`useDebounce(value, ms)`** - For search query debouncing
18. **`useClickOutside(ref, handler)`** - Used in many components (Navbar, modals, dropdowns) but inlined each time
19. **`useMediaQuery(query)`** - For responsive breakpoints in JS
20. **`usePrevious(value)`** - For comparing previous state

### B. Missing Custom Hooks (`/hooks/`)
Currently only `useChat.ts` exists. Could add:

1. **`useForm<T>(schema, options)`** - Centralized form state + validation with Zod (project uses validation.ts but no Zod)
2. **`usePagination(data, pageSize)`** - For tables/lists
3. **`useInfiniteScroll(callback)`** - For transaction history
4. **`useExport(format)`** - CSV/JSON export hook
5. **`useConfirmDialog()`** - Reusable confirmation modal logic
6. **`useFilter(data, filters)`** - Client-side filtering logic
7. **`useSearch(data, fields)`** - Multi-field search

### C. Missing Components

1. **`DataTable`** - All list pages (income, expenses, bills, etc.) use raw `<table>` elements. A reusable sortable/filterable table with pagination would reduce code.
2. **`Pagination`** - No pagination anywhere; all lists load everything
3. **`ConfirmDialog`** - Delete confirmations are duplicated on every page
4. **`SearchInput`** - With debounce, clear button, loading spinner
5. **`FilterBar`** - Date range, category, type filters (duplicated on income/expenses)
6. **`StatCard`** - The summary cards on every page are similar but not reusable
7. **`Timeline`** - For investment allocations / activity logs
8. **`Avatar`** - With fallback initials, used in friends, topbar
9. **`Badge`** - Status badges exist but not flexible enough
10. **`Tooltip`** - No tooltip component; only title attributes
11. **`DropdownMenu`** - Used in Navbar "More" but not a reusable component
12. **`Breadcrumb`** - No breadcrumbs for nested navigation
13. **`Tabs`** - Used in split-bills, notifications, friends but inline each time
14. **`Accordion`** - Could be used for FAQ or settings sections
15. **`SkeletonCard`** - Different from basic Skeleton; card-shaped shimmer
16. **`ChartContainer`** - Wrapper for Recharts with loading/error states
17. **`FileUpload`** - For receipt scanning, profile picture
18. **`ColorPicker`** - For category colors (categories currently have no color field)
19. **`CalendarHeatmap`** - For transaction activity visualization
20. **`NotificationBell`** - Standalone component with real-time unread count

### D. Missing Pages/Features

1. **Reports & Analytics**
   - Monthly/yearly spending reports
   - Category breakdown pie charts
   - Income vs expense trend charts
   - Cash flow projections
   
2. **Recurring Transactions**
   - Income page has `interval` field but no recurring management UI
   - No scheduled/automated transaction creation

3. **Import/Export**
   - CSV import (only export exists)
   - Bank statement upload
   - JSON backup/restore

4. **User Profile Page**
   - No dedicated `/profile` page
   - Avatar upload not implemented
   - Password change not available (only Google OAuth)

5. **Notification Settings**
   - Toggle which notifications to receive
   - Email vs in-app preferences

6. **Theme Toggle**
   - Only dark mode exists; no light mode
   - Theme setting in Settings is non-functional

7. **Multi-Currency**
   - Hardcoded to IDR everywhere
   - Currency setting exists but not wired up

8. **Mobile App / PWA**
   - Has `manifest.json` reference but no service worker
   - No offline capability

9. **Transaction Search & Advanced Filtering**
   - No global transaction search
   - No date range filtering on dashboard
   - No multi-category filter

10. **Budget Alerts / Notifications**
    - No real-time budget overspend alerts
    - No email notifications

11. **Investment Performance Tracking**
    - Only tracks total invested, not ROI/gains
    - No price fetching for stocks/crypto

12. **Debt Repayment Plans**
    - No payment schedule/amortization
    - No payment history per debt

13. **Split Bill Settlement**
    - No actual payment/settlement flow
    - No payment method integration

14. **Activity Log Auto-Generation**
    - Currently manual creation only
    - Should auto-log all CRUD actions

15. **Data Visualization Dashboard**
    - No charts on main dashboard
    - No spending trends over time
    - No category distribution visualization

### E. Code Quality & Architecture Gaps

1. **No Zod Integration** - Validation is manual; Zod is in user rules but not used
2. **No Error Boundaries** - React error boundaries not implemented
3. **No Loading/Error States Pattern** - Each page handles loading differently
4. **No API Response Caching Strategy** - Beyond React Query defaults
5. **No Request Deduplication** - Beyond React Query defaults
6. **No Offline Support** - No service worker, no offline fallback
7. **No Analytics/Error Tracking** - No Sentry, no Google Analytics
8. **No E2E Tests** - No Playwright/Cypress
9. **No Unit Tests** - Jest + React Testing Library in rules but no test files exist
10. **No Storybook** - Component documentation missing
11. **No i18n** - Hardcoded English/Indonesian strings mixed throughout
12. **Middleware is empty** - `middleware.ts` does nothing (matcher is empty array)

### F. Security Gaps

1. **No Content Security Policy** - No CSP headers configured
2. **No Rate Limiting UI** - Chat has rate limiting but API calls don't show rate limit info
3. **No Input Sanitization** - HTML in descriptions could render (though React escapes by default)
4. **No Audit Logging** - Activity logs are manual, not automatic
5. **Session Management** - No session expiry handling beyond 401/403

### G. Performance Gaps

1. **No Code Splitting** - `next/dynamic` is in rules but barely used
2. **No Image Optimization** - Many `<img>` tags instead of `next/image`
3. **No Bundle Analysis** - No `@next/bundle-analyzer`
4. **Large Page Files** - Income/expenses pages are 800+ lines each
5. **No Virtual Scrolling** - Long transaction lists will lag
6. **No Data Prefetching** - `router.prefetch` not used for navigation

### H. Accessibility Gaps

1. **Focus Management** - Some modals trap focus, but not consistently
2. **ARIA Labels** - Missing on some interactive elements
3. **Keyboard Navigation** - No keyboard shortcuts documented
4. **Screen Reader Support** - No `aria-live` regions for dynamic content
5. **Reduced Motion** - No `prefers-reduced-motion` handling
6. **Color Contrast** - Some muted text may fail WCAG AA

---

## 11. Recently Fixed Bugs

1. **Date off-by-one** - Timezone issue with `toISOString().slice(0,10)` fixed with `formatLocalDate` / `dateToApiISO`
2. **Category persistence** - `categoryId` now properly passed in create/update mutations
3. **Income/expense total mixing** - Client-side type filtering added to `filteredData`
4. **Split bills balance** - `amountIOwe` vs `amountTheyOweMe` now correctly uses `creatorId` to distinguish
5. **Button text readability** - Fixed `text-sky-400` on light backgrounds

---

## 12. File Count Summary

| Category | Count |
|----------|-------|
| Pages | 19 routes |
| UI Components | 9 |
| Common Components | 9 |
| Chat Components | 2 |
| Dashboard Components | 2 |
| Hooks | 1 |
| Stores | 3 |
| Lib Files | 7 |
| Types | 1 comprehensive file |
| CSS | 1 (globals.css) |
