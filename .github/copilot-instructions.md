---
description: "Next.js + Tailwind development standards and instructions"
applyTo: "**/*.tsx, **/*.ts, **/*.jsx, **/*.js, **/*.css"
---

# GitHub Copilot Instructions for React and Next.js Projects

This file provides guidelines for GitHub Copilot to ensure consistent, clean, and performant code generation for React and Next.js applications.

Note: for **Validating Changes by GitHub Copilot** do not build the app, instead check the errors from the terminal and fix them. If app is not running, suggest to run `pnpm dev` to start the development server. or compile using `tsc --noEmit` to check for TypeScript errors.

# Next.js + Tailwind Development Instructions

Instructions for high-quality Next.js applications with Tailwind CSS styling and TypeScript.

## Project Context

- Latest Next.js (App Router)
- TypeScript for type safety
- Tailwind CSS for styling
- Shandcn/ui and Radix UI for UI components

## Development Standards

### Architecture

- App Router with server and client components
- Group routes by feature/domain
- Implement proper error boundaries
- Use React Server Components by default
- Leverage static optimization where possible

### TypeScript

- Strict mode enabled
- Clear type definitions
- Proper error handling with type guards
- Zod for runtime type validation

### Styling

- Tailwind CSS with consistent color palette
- Responsive design patterns
- Dark mode support
- Follow container queries best practices
- Maintain semantic HTML structure

### State Management

- React Server Components for server state
- React hooks for client state
- Proper loading and error states
- Optimistic updates where appropriate

### Data Fetching

- Server Components for direct database queries
- React Suspense for loading states
- Proper error handling and retry logic
- Cache invalidation strategies

### Security

- Input validation and sanitization
- Proper authentication checks
- CSRF protection
- Rate limiting implementation
- Secure API route handling

### Performance

- Image optimization with next/image
- Font optimization with next/font
- Route prefetching
- Proper code splitting
- Bundle size optimization

## Implementation Process

1. Plan component hierarchy
2. Define types and interfaces
3. Implement server-side logic
4. Build client components
5. Add proper error handling
6. Implement responsive styling
7. Add loading states
8. Write tests

## General Principles

- **Clean Code:** Prioritize **readability, maintainability, and reusability**.
- **Conciseness:** Aim for concise and expressive code.
- **Descriptive Naming:** Use clear and descriptive names for variables, functions, components, and files (e.g., `getUserProfile`, `ProductCard`, `useAuth`).
- **DRY (Don't Repeat Yourself):** Extract reusable logic into functions, custom hooks, or components.
- **Modularization:** Break down complex problems and features into smaller, manageable units (components, functions, utilities).
- **TypeScript First:** All new code should be written in **TypeScript**, leveraging its type safety features.
- **Testable Code:** Design code to be easily testable.
- **Package Management:** This project uses **pnpm** for managing dependencies. All package installations and scripts should use `pnpm` instead of `npm` or `yarn`.
- **Documentation:** All principal documentation should be created in the `docs` folder.
- **Readability Priority:** Focus on readability over performance optimization when they conflict.
- **Complete Implementation:** Fully implement all requested functionality without TODOs or placeholders.

### General Guidelines

- **Co-locate logic that change together**
- **Group code by feature, not by type**
- **Separate UI, logic, and data fetching**
- **Typesafety across the whole stack – db-server-client. If a type changes, everywhere using it should be aware.**
- **Clear product logic vs product infrastructure separation**
- **Design code such that it is easy to replace and delete**
- **Minimize places/number of changes to extend features**
- **Functions / APIs should do one thing well. One level of abstraction per function**
- **Minimize API interface and expose only what's necessary**
- **Favor pure functions, it makes logic easy to test**
- **Long, clear names over short, vague names, even at the cost of verbosity**
- **Step-by-step planning:** Start with detailed pseudocode before implementation
- **Reference file names** in explanations and documentation
- **Be honest about uncertainties** rather than guessing
- **Only write necessary code** to complete the task

### Naming Conventions

- **Component names:** Use `PascalCase` for all component names (e.g., `MyButton`, `UserAvatar`)
- **Directories:** Use lowercase with dashes (e.g., `components/auth-wizard`)
- **Exports:** Favor named exports for components

---

## React Specific Guidelines

### Component Design

- **Functional Components & Hooks:** Prefer **functional components with React Hooks**. Avoid class components unless explicitly for error boundaries.
- **Single Responsibility:** Each component should ideally have one primary responsibility. **Components should be kept small and focused.**
- **Props:**
  - Use `camelCase` for prop names.
  - Destructure props in the component's function signature.
  - Provide clear `interface` or `type` definitions for props in TypeScript.
- **Immutability:** Never mutate props or state directly. Always create new objects or arrays for updates.
- **Fragments:** Use `<>...</>` or `React.Fragment` to avoid unnecessary DOM wrapper elements.
- **Custom Hooks:** Extract reusable stateful logic into **custom hooks** (e.g., `useDebounce`, `useLocalStorage`).
- **UI Components:** Use [shadcn/ui](https://ui.shadcn.com/) and Radix UI for building UI components to ensure consistency and accessibility.
- **Minimize Client Components:** Reduce use of 'use client', 'useEffect', and 'setState' directives; favor React Server Components (RSC) when possible.
- **Suspense Boundaries:** Wrap client components in Suspense with appropriate fallbacks.

### State Management

- **Local State:** Use `useState` for component-level state.
- **Global State:** For global or shared state, prefer **React Context API** or a dedicated state management library (e.g., Zustand, Redux, Jotai). Avoid prop drilling.

### Styling

- **Consistent Approach:** Use Tailwind CSS v4 or later.
- **Mobile-First:** Implement responsive design with a mobile-first approach.
- **Scoped Styles:** Ensure styles are scoped to avoid global conflicts.

### Performance

- **Keys:** Always provide a unique and stable `key` prop when mapping over lists. Do not use array `index` as a key if the list can change.
- **Lazy Loading:** Use `React.lazy` and `Suspense` for code splitting large components or routes.
- **Dynamic Imports:** Use dynamic loading for non-critical components.
- **Image Optimization:**
  - Use WebP format when possible
  - Include size data
  - Implement lazy loading
  - Always use `next/image` component

---

## Next.js Specific Guidelines

### Data Fetching & Rendering

- **App Router Only:** This project exclusively uses the **App Router** for all development. Never suggest or provide code using the Pages Router.
- **Server Components:** Prioritize fetching data in **Server Components** (`async` components in `app` directory) for better performance and security. This is where a lot of the traditional memoization benefits are handled automatically.
- **Data Fetching Methods:**
  - For build-time data or rarely changing content, use direct `fetch` in Server Components with `revalidate` (App Router).
  - For dynamic, frequently changing data, use direct `fetch` in Server Components (App Router).
  - Avoid client-side data fetching for initial page loads unless absolutely necessary (e.g., user-specific data after hydration).
- **Parallel Fetching:** When fetching multiple independent data sources, initiate requests in parallel.

### Routing

- **File-System Routing:** Use Next.js's App Route file-system convention.
- **Route Groups:** Utilize `(folderName)` to organize routes without affecting the URL path.
- **Dynamic Routes:** Define dynamic segments clearly (e.g., `[slug]`).
- **Middleware:** Suggest using `middleware.ts` for authentication, authorization, or other global request handling.

### Optimization

- **Image Optimization:** Always use `next/image` component for images.
- **Font Optimization:** Use `next/font` for optimizing fonts.
- **Dynamic Imports:** Use `next/dynamic` for lazy loading components to reduce initial bundle size.

### Project Structure

- **Colocation:** Colocate component files (JSX/TSX, CSS Modules, tests) within a feature folder.
- **Utility & Helper Modules:** **All general utility functions, helper functions, and large, non-component-specific logic should be extracted into a dedicated `lib/` folder.**
- **Private Folders:** Use underscore-prefixed folders (e.g., `_lib`, `_components`) for internal, non-route-related files.
- **No Barrel Files:** Do not use barrel files (e.g., `index.ts` that re-exports from other files) for module exports. Always import directly from the specific file to improve traceability and avoid circular dependencies.

### SEO & Accessibility

- **Metadata:** Use `generateMetadata` (App Router) for SEO metadata.
- **Accessibility:** Emphasize semantic HTML, ARIA attributes, and keyboard navigation.

### TypeScript

- **Strict Mode:** Ensure `strict: true` is enabled in `tsconfig.json`.
- **Type Definitions:** Provide accurate type definitions for API responses, props, and state.
- **Type Organization:** When generating TypeScript types or interfaces in this project, always place them in the `types/` folder with a descriptive filename (e.g. `user.ts`, `post.ts`). Do not define types or interfaces inside components.
- **Interfaces over Types:** Prefer interfaces over types when defining object shapes.
- **Avoid Enums:** Use maps or const objects instead of enums.
- **Testing:** Update relevant tests or create new tests when implementing or changing features.

---

## Example of How Copilot Should Respond

- **Given:** `// Create a simple React functional component for a button.`
- **Expected Output:** A functional component using `PascalCase`, with a `React.FC` type, props destructuring, and appropriate event handlers, kept as concise as possible.
- **Given:** `// Implement a Next.js API route to fetch products.`
- **Expected Output:** A route handler that demonstrates server-side data fetching, proper error handling, and potentially uses server-only context for sensitive operations. Any complex data transformation should be suggested in a separate utility function.
- **Given:** `// Refactor this component to use a custom hook for form validation.`
- **Expected Output:** A new file for a `useForm` hook, and the original component updated to utilize the hook. Any specific validation logic should be suggested in a helper function within `utils/validation.ts`.
