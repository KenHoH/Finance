# FinPro - Personal Finance Management

A full-stack personal finance web application that helps users track expenses, manage budgets, set savings goals, split bills with friends, and automatically capture transactions from email receipts and scanned receipts using AI.

# Link website 
https://footsore-uptake-autopilot.ngrok-free.dev/

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Security](#security)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)

## Architecture

The application follows a **microservices architecture** with three independent services orchestrated via Docker Compose:

```
                        +-------------------+
                        |     Ngrok         |
                        |  (HTTPS Tunnel)   |
                        +--------+----------+
                                 |
                    +------------+------------+
                    |                         |
           +-------v-------+        +--------v--------+
           |   Frontend    |        |    Backend       |
           |   (Next.js)   +------->+    (NestJS)      |
           |   Port 3000   |  API   |    Port 3001     |
           +---------------+        +----+----+--------+
                                         |    |
                              +----------+    +----------+
                              |                          |
                      +-------v-------+          +-------v-------+
                      |    Redis      |          |  PostgreSQL   |
                      |   Port 6379   |          |   (Supabase)  |
                      +---------------+          +---------------+
                              |
                      +-------v-------+
                      |    BullMQ     |
                      | (Job Queue)   |
                      +---------------+

           +---------------+
           |  OCR Service  |
           |   (Python)    |
           |   Port 5000   |
           +---------------+
```

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 | React framework with SSR and App Router |
| React 19 | UI component library |
| Tailwind CSS v4 | Utility-first CSS styling |
| Zustand | Lightweight client-side state management |
| TanStack Query | Server state management, data fetching, and caching |
| Axios | HTTP client with interceptors for CSRF handling |
| Recharts | Data visualization and charts |
| Framer Motion | Animations and transitions |
| Lucide React | Icon library |
| Socket.io Client | Real-time WebSocket communication |

### Backend
| Technology | Purpose |
|---|---|
| NestJS 11 | Node.js framework with modular architecture |
| Prisma ORM 7 | Type-safe database ORM for PostgreSQL |
| PostgreSQL | Primary relational database (hosted on Supabase) |
| Redis | In-memory store for job queues and rate limiting |
| BullMQ | Background job queue (budget alerts, saving point calculations) |
| Socket.io | Real-time notifications via WebSocket |
| Helmet | HTTP security headers |
| Swagger | Auto-generated API documentation |

### AI / OCR
| Technology | Purpose |
|---|---|
| OpenRouter Vision LLM | Primary receipt image parsing via AI vision model |
| Python PaddleOCR | Fallback OCR engine for text extraction from receipt images |
| Groq | LLM for parsing OCR text output and powering the financial chatbot |
| OpenRouter (Text) | Alternative LLM provider for the AI chatbot |

### Email Integration
| Technology | Purpose |
|---|---|
| Gmail API | Read and parse transaction emails |
| Google Pub/Sub | Real-time push notifications when new emails arrive |
| IMAP (imapflow) | Fallback email polling via cron schedule |

### Storage & Deployment
| Technology | Purpose |
|---|---|
| Supabase Storage | Cloud file storage for receipt images and payment proofs |
| Docker Compose | Multi-container orchestration |
| PWA | Installable web app with home screen icon |

## Features

### Core Finance
- **Dashboard** - Financial overview with charts and summary cards
- **Transactions** - Manual income/expense tracking with category tagging
- **Budgets** - Monthly/custom period budget planning per category
- **Goals** - Savings goals with progress tracking and contributions
- **Bills** - Recurring bill reminders with due date notifications
- **Investments** - Investment portfolio tracking across categories
- **Categories** - Customizable income/expense/investment categories
- **Debts** - Debt tracking with overbudget detection (DebtPoint)

### Smart Features
- **Receipt Scanner** - Upload receipt images, AI extracts items and amounts automatically
- **Email Auto-Tracker** - Automatically parse e-receipts from Gmail (Gojek, Tokopedia, etc.)
- **AI Financial Chatbot** - Context-aware chatbot that answers questions based on your actual financial data
- **Split Bills** - Split expenses with friends, upload payment proofs, confirm/reject payments

### Social
- **Friends** - Send/accept friend requests, manage friend list
- **Split Bill Collaboration** - Invite friends to split bills with item-level assignments
- **Real-time Notifications** - WebSocket-powered notifications for bill reminders, budget alerts, split bill updates

### System
- **Activity Logs** - Full audit trail of user actions
- **Settings** - User preferences and configuration
- **Search** - Global search across transactions and entities
- **Profile** - User profile management

## Project Structure

```
softeng/
  docker-compose.yaml        # Multi-container orchestration
  backend/                    # NestJS API server
    src/
      modules/
        auth/                 # Google OAuth, JWT, session management
        transaction/          # Income/expense CRUD
        budget/               # Budget planning + BullMQ alerts
        goal/                 # Savings goals + contributions
        bill/                 # Bill reminders + due dates
        split-bill/           # Split bill with friends
        investment/           # Investment portfolio
        category/             # Custom categories
        debt/                 # Debt tracking
        receipt/              # Receipt OCR + AI parsing
        email/                # Gmail API integration
        pubsub/               # Google Pub/Sub webhook
        chat/                 # AI chatbot with financial context
        notification/         # Real-time + cron notifications
        friend/               # Friend system
        saving-point/         # Under-budget savings calculation
        activity-log/         # Audit trail
        settings/             # User preferences
        prisma/               # Database client
      infrastructure/
        guards/               # CSRF guard, JWT auth guard
        middleware/            # Request logging
        filters/              # Global exception filter
        interceptors/         # Input sanitizer
        imap/                 # IMAP email fallback
        utils/                # CSRF token utilities
      processor/
        saving-processor/     # BullMQ worker for saving calculations
    prisma/
      schema.prisma           # Database schema (19 models)
  frontend/                   # Next.js web application
    src/
      app/
        dashboard/            # Main dashboard page
        expenses/             # Expense tracking
        income/               # Income tracking
        budgets/              # Budget management
        goals/                # Savings goals
        bills/                # Bill reminders
        split-bills/          # Split bill feature
        investments/          # Investment tracking
        receipts/             # Receipt scanner
        email/                # Email sync settings
        categories/           # Category management
        debts/                # Debt tracking
        friends/              # Friend management
        notifications/        # Notification center
        activity-logs/        # Activity history
        settings/             # App settings
        profile/              # User profile
        search/               # Global search
        auth/                 # OAuth callback handler
        api/                  # API proxy routes
        login/                # Login page
  ocr-service/                # Python OCR microservice
    main.py                   # FastAPI server with PaddleOCR + Groq
    requirements.txt          # Python dependencies
```

## Prerequisites

- **Node.js** >= 20
- **Python** >= 3.10 (for OCR service)
- **Docker** & **Docker Compose** (for containerized deployment)
- **PostgreSQL** database (or Supabase project)
- **Redis** server
- **Google Cloud Console** project with OAuth 2.0 credentials and Gmail API enabled
- **Supabase** project (for file storage)
- **OpenRouter** API key (for receipt scanning and chatbot)
- **Groq** API key (for OCR text parsing and chatbot)

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Auth
CLIENT_ID=your-google-oauth-client-id
CLIENT_SECRET=your-google-oauth-client-secret
REDIRECT_URI=https://your-domain.com/auth/google/callback
JWT_SECRET=your-jwt-secret

# Frontend
FRONTEND_URL=https://your-domain.com

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key

# AI / LLM
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_VISION_MODEL=nvidia/nemotron-nano-12b-v2-vl:free

# Email
GMAIL_WATCH_TOPIC=projects/your-project/topics/your-topic

# OCR Service
OCR_SERVICE_URL=http://ocr-service:5000/scan
```

### Frontend (`frontend/.env`)

```env
BACKEND_URL=http://nestjs-app:3001
FRONTEND_URL=https://your-domain.com
```

### OCR Service (`ocr-service/.env`)

```env
GROQ_API_KEY=your-groq-api-key
PORT=5000
```

## Getting Started

### Local Development

**1. Backend**

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

**2. Frontend**

```bash
cd frontend
npm install
npm run dev
```

**3. OCR Service**

```bash
cd ocr-service
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
```

### Docker Compose (Production)

```bash
docker-compose up --build -d
```

This starts four containers:
| Service | Port | Description |
|---|---|---|
| `next-app` | 3000 | Next.js frontend |
| `nestjs-app` | 3001 | NestJS backend API |
| `redis` | 6379 | Redis for BullMQ and rate limiting |
| `ocr-service` | 5000 | Python PaddleOCR + Groq parsing |

## Security

| Layer | Implementation | Protection Against |
|---|---|---|
| Authentication | Google OAuth 2.0 + JWT in `httpOnly` cookie | Credential theft, XSS token stealing |
| CSRF Protection | Double-submit cookie pattern (`csrf-token` cookie + `X-CSRF-Token` header) | Cross-Site Request Forgery |
| Rate Limiting | 40 requests / 60 seconds per IP (via `@nestjs/throttler`) | DDoS, brute force |
| OAuth State | HMAC-SHA256 signed `state` parameter with `timingSafeEqual` | Open redirect, state tampering, timing attacks |
| HTTP Headers | Helmet middleware (X-Frame-Options, CSP, HSTS, etc.) | Clickjacking, MIME sniffing, XSS |
| Upload Validation | 5MB max size, PNG/JPEG/WebP whitelist | Malicious file upload, disk exhaustion |
| Input Sanitization | Global `SanitizeInterceptor` + `ValidationPipe` with whitelist | SQL injection, XSS via input |
| Request Logging | Global middleware logs method, URL, status, duration | Audit trail, incident forensics |
| CORS | Strict origin whitelist based on `FRONTEND_URL` | Unauthorized cross-origin requests |

## API Documentation

When the backend is running, Swagger UI is available at:

```
http://localhost:3001/api
```

Swagger is configured to automatically attach CSRF tokens from cookies, allowing direct API testing after login.

## Database Schema

The database consists of **19 models** managed via Prisma ORM:

| Model | Description |
|---|---|
| `User` | User accounts (OAuth-based, no passwords stored) |
| `AuthIdentities` | OAuth provider credentials (Google) with refresh tokens |
| `Transaction` | Income and expense records (manual or auto-tracked) |
| `Category` | User-customizable categories (income, expense, investment) |
| `Budget` | Budget planning per category and time period |
| `Goal` | Savings targets with deadline and progress |
| `GoalContribution` | Individual contributions toward a goal |
| `SavingPoint` | Under-budget savings per budget period |
| `DebtPoint` | Over-budget debt per budget period |
| `Bill` | Recurring bills with due dates and reminders |
| `SplitBill` | Group expense splitting |
| `SplitBillItem` | Individual items within a split bill |
| `SplitParticipant` | Participants in a split bill with payment status |
| `Investment` | Investment portfolio totals per category |
| `InvestmentAllocation` | Individual investment allocation records |
| `Notification` | User notifications (bill reminders, budget alerts, split bill updates) |
| `FriendRequest` | Friend request management (pending, accepted, rejected, blocked) |
| `Friend` | Established bidirectional friendships |
| `Settings` | Key-value user preferences |
| `ActivityLog` | Audit trail of user actions |
