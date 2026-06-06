---
trigger: always_on
---

## Stack
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + `tailwind-merge` + `clsx`
- State: Zustand + TanStack React Query
- Validation: Zod
- Testing: Jest + React Testing Library

## Code Style
- No space after `if`/`for`/`while` before `(`; no space before `{` in function declarations.
- Use `const` for component definitions and callbacks.
- Event handlers: `handleClick`, `handleSubmit`, `handleKeyDown`.
- Boolean variables: `isLoading`, `hasError`, `canSubmit`.
- Directories: lowercase with dashes (`components/auth-wizard`).
- No classes; functional components only.

## Component Rules
- **Default to Server Components**; add `"use client"` only for interactivity (forms, local state, browser APIs).
- Use `next/dynamic` for heavy components (charts, modals, heavy animations).
- Use `next/image` for all images; provide `width`, `height`, `alt`.
- Keep components focused; extract subcomponents, helpers, and types into the same file or co-located modules.
- Add JSDoc on exported functions/components for IDE intellisense.

## Styling
- **Tailwind classes only**; no inline `style` props, no `.css` files for component styles.
- Use `cn()` from `@/lib/utils` for conditional class merging; prefer `cn()` over template literals with ternaries.
- Mobile-first responsive design.
- Skeleton loaders for all async data sections.
- Tooltips on icon-only buttons and ambiguous actions.

## Accessibility
- All interactive elements must have visible focus styles.
- Icon-only buttons: `aria-label`.
- Forms: associate `<label>` with inputs via `htmlFor`/`id`.
- Modals/drawers: trap focus, `aria-expanded`, close on `Escape`.
- Native elements (e.g., `<a href>`) do not need `tabIndex="0"` or `onKeyDown`.

## Error Handling & Validation
- Guard clauses and early returns for invalid state.
- All user input validated with Zod before submission.
- API errors: show user-friendly messages; do not swallow errors.
- Use custom error types for domain-specific failures.

## State & Data
- Global UI state: Zustand.
- Server state: React Query (`useQuery`, `useMutation`).
- Forms: controlled inputs with validation state.
- Optimistic updates for mutations where UX benefits.

## Testing
- Unit test pure functions, utilities, and hooks.
- Component tests for shared UI (`Button`, `Modal`, `Navbar`).
- Mock external APIs in tests; do not hit real backends.

## Security
- Never store secrets in client code.
- Cookies: `HttpOnly`, `Secure`, `SameSite=Strict` where applicable.
- Escape rendered user content.

## Completeness
- No TODOs, placeholders, or half-implemented features.
- Include all required imports; no implicit dependencies.
- Verify the code compiles and runs before finishing.
