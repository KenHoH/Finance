# Frontend Best Practices & Architecture Guide

This guide outlines the industry-standard architecture for building scalable, maintainable, and high-performance web applications using modern frameworks like React, Vue, or Next.js.

## 1. The Core Philosophy: Modular & Decoupled
The goal of this architecture is to minimize the "ripple effect" (where changing code in one place breaks it in another). We achieve this through:
- **High Cohesion**: Keeping related logic (API, components, hooks) together.
- **Low Coupling**: Ensuring different parts of the app know as little about each other as possible.
- **Unidirectional Data Flow**: Data flows down, events flow up.

---

## 2. Standard Folder Structure (The Blueprint)

This structure is based on the **Feature-Sliced Design (FSD)** methodology, which is currently the gold standard for large-scale frontend apps.

```text
src/
├── app/                # Application initialization (Providers, Router, Global Styles)
├── assets/             # Static assets (images, fonts, global icons)
├── components/         # Shared, generic UI components (Buttons, Inputs, Modals)
│   ├── ui/             # Base primitives (e.g., shadcn/ui)
│   └── common/         # Complex shared components (e.g., Navigation, Layouts)
├── features/           # BUSINESS DOMAINS (The most important folder)
│   └── [feature-name]/ # e.g., auth, chat, profile
│       ├── api/        # Data fetching logic for this feature
│       ├── components/ # Private components used ONLY in this feature
│       ├── hooks/      # Business logic hooks
│       ├── types/      # Feature-specific TypeScript definitions
│       └── index.ts    # PUBLIC API (The only entry point for this feature)
├── hooks/              # Global, reusable utility hooks (e.g., useDebounce, useLocalStorage)
├── lib/                # Third-party library configurations (Axios, Firebase, Sentry)
├── pages/              # Flat list of route-level components (Composes Features)
├── services/           # Global singleton services (AuthService, Analytics)
├── store/              # Global state management (Zustand, Redux, or Context)
├── types/              # Global TypeScript interfaces/enums
└── utils/              # Pure functions (formatters, validators, calculations)
```

---

## 3. Layer Definitions

### A. The `app` Layer
This is the entry point. It sets up the environment:
- `App.tsx` / `main.tsx`
- Routing configuration
- Global Context Providers (Theme, Auth, QueryClient)

### B. The `features` Layer
The heart of your application. A feature is a functional part of the app that provides value to the user.
- **Rule**: Features should NOT import from other features.
- **Public API**: Use an `index.ts` to export only what is necessary. This prevents circular dependencies.

### C. The `pages` Layer
Pages should be thin wrappers. They are responsible for:
1. Fetching URL parameters.
2. Composing multiple features together.
3. Defining the layout (Sidebar, Header).

### D. The `components/ui` Layer
These are "dumb" or "presentational" components. They should not contain business logic or API calls. They should be highly reusable via props.

---

## 4. Component Design Patterns

### Smart vs. Dumb Components
- **Smart (Feature/Container)**: Handles data fetching, state management, and side effects.
- **Dumb (UI/Presentational)**: Receives data via props and renders it. It is agnostic to where the data comes from.

### Controlled vs. Uncontrolled
- Favor **Controlled components** for forms to ensure the UI and state are always in sync.

### Composition over Inheritance
- Use the `children` prop to create flexible layouts rather than creating deep inheritance hierarchies.

---

## 5. State Management Best Practices

1. **Local State**: Use `useState` for UI-only state (e.g., "is dropdown open").
2. **Server State**: Use **TanStack Query (React Query)** for server data. Do NOT manually store API data in global state (Redux/Zustand) unless absolutely necessary.
3. **Global State**: Use **Zustand** or **Context** for truly global data (e.g., User session, Theme preferences).

---

## 6. API & Data Fetching

- **Centralized Instance**: Create a single `axios` or `fetch` instance in `lib/api.ts` with interceptors for auth tokens and error handling.
- **Service Pattern**: Group API calls into services or repository classes.
- **Custom Hooks**: Wrap every API call in a custom hook (e.g., `useGetProfile`). This abstracts the fetching logic away from the component.

---

## 7. Coding Standards

- **Naming**: 
  - Components: `PascalCase` (`UserProfile.tsx`)
  - Folders/Files: `kebab-case` (`user-profile.tsx`)
  - Hooks: `camelCase` starting with `use` (`useAuth.ts`)
- **TypeScript**: 
  - Always define types for props and API responses.
  - Avoid `any` at all costs.
- **Performance**: 
  - Use `React.memo` and `useMemo/useCallback` only when necessary to solve specific performance bottlenecks.
  - Optimize images and use lazy loading for routes.

---

## 8. Summary Checklist for New Code

- [ ] Does this belong in a `feature` or is it `shared`?
- [ ] Is my component too big? (Should I break it into smaller sub-components?)
- [ ] Am I exposing too much in my `index.ts`?
- [ ] Does this component have business logic that should be in a `hook`?
- [ ] Are all my types defined correctly?
