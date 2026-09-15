FROM node:20-alpine AS deps

WORKDIR /usr/src/frontend/app

COPY package.json package-lock.json ./

# Better for CI/CD than npm install
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /usr/src/frontend/app

COPY --from=deps /usr/src/frontend/app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_BACKEND_URL=https://footsore-uptake-autopilot.ngrok-free.dev
ARG NEXT_PUBLIC_FRONTEND_URL=https://footsore-uptake-autopilot.ngrok-free.dev
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /usr/src/frontend/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /usr/src/frontend/app/package.json ./
COPY --from=builder /usr/src/frontend/app/package-lock.json ./
COPY --from=builder /usr/src/frontend/app/node_modules ./node_modules

COPY --from=builder /usr/src/frontend/app/.next ./.next
COPY --from=builder /usr/src/frontend/app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]
