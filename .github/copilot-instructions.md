---
description: "Clean Architecture + Next.js + Tailwind development standards"
applyTo: "**/*.tsx, **/*.ts, **/*.jsx, **/*.js, **/*.css"
---

# GitHub Copilot Instructions for React and Next.js Projects

This file provides guidelines for GitHub Copilot to ensure consistent, clean, and performant code generation following **Clean Architecture** principles for React and Next.js applications.

Note: for **Validating Changes by GitHub Copilot** do not build the app, instead check the errors from the terminal and fix them. If app is not running, suggest to run `pnpm dev` to start the development server or compile using `tsc --noEmit` to check for TypeScript errors.

Note: never read .env file variables or secrets for security reasons.

# Clean Architecture + Next.js + Tailwind Development Instructions

Instructions for high-quality Next.js applications following Clean Architecture with Tailwind CSS styling and TypeScript.

## Project Context

- Latest Next.js (App Router)
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui and Radix UI for UI components
- tanstack/react-query for data fetching
- pnpm for package management
- **Clean Architecture with clear layer separation**

## Development Standards

### Architecture Overview

The project follows **Clean Architecture** with strict layer separation:

```
Presentation Layer (Components & Hooks)
    ↓
Server Actions Layer (Controllers)
    ↓
Business Logic Layer (Services)
    ↓
Data Access Layer (Repositories)
    ↓
Database Layer (Prisma)
```

**Key Principle**: Each layer only depends on layers below it. Never import upward (e.g., never import components from services).

### 1. **Presentation Layer** (UI)

**Location**: `src/components/`

**Responsibility**: React components for rendering UI

**Structure**:
- `src/components/ui/` - shadcn/ui components
- `src/components/ui/primitives/` - Small, reusable custom components (UserTable, PolicyTable, etc.)
- `src/components/shared/` - Shared UI components across features
- `src/components/[feature]/` - Feature-specific components

**Principles**:
- Components should be **small and focused** (< 200 lines)
- Delegate business logic to custom hooks
- Accept handlers and data via props
- Use composition over inheritance
- Avoid state management (use hooks)
- Never import directly from services or repositories

**Component Types**:
1. **Primitive Components** - Reusable UI elements
   ```typescript
   // src/components/ui/primitives/user-table.tsx
   export function UserTable({ users, onDelete, onEdit }: Props) {
     // Render table, call handlers on interaction
   }
   ```

2. **Feature Components** - Use hooks and primitives
   ```typescript
   // src/app/(app)/admin/users/page.tsx
   "use client";
   export default function UsersPage() {
     const { users, loading, handleDelete } = useUserManagement();
     return <UserTable users={users} onDelete={handleDelete} />;
   }
   ```

### 2. **Custom Hooks Layer** (UI Logic)

**Location**: `src/hooks/`

**Responsibility**: Encapsulate stateful UI logic and side effects

**Key Files**:
- `use-user-management.ts` - User CRUD operations state
- `use-registration-policies.ts` - Policy management state
- `use-debounce.ts` - Debouncing utility
- `use-mobile.ts` - Responsive design hook

**Principles**:
- Manage component state with `useState` and `useCallback`
- Call server actions and handle responses
- Show user feedback with toast notifications
- Handle loading and error states
- Keep logic reusable across components

**Hook Pattern**:
```typescript
export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = useCallback(async (userId: string) => {
    const result = await deleteUser(userId); // Server action
    if (result.success) {
      setUsers(users.filter(u => u.id !== userId));
      toast.success("User deleted");
    } else {
      toast.error(result.error || "Failed to delete");
    }
  }, [users]);

  return { users, loading, handleDelete };
}
```

### 3. **Server Actions Layer** (Controllers)

**Location**: `src/lib/actions/`

**Responsibility**: Handle HTTP requests, validation, authorization

**Key Files**:
- `auth.ts` - Authentication actions
- `admin.ts` - Admin management actions
- `exercise.ts` - Exercise actions

**Principles**:
- Always use `"use server"` directive
- Perform authorization/authentication checks first
- Validate input with Zod schemas
- Delegate business logic to services
- Return consistent response format: `{ success: boolean, error?: string, data?: any }`
- Add comments documenting the flow

**Standard Pattern**:
```typescript
"use server";

/**
 * Controller: Delete a user
 * - Authorization: Admin only
 * - Validation: User ID format
 * - Business Logic: Delegated to userService
 */
export async function deleteUser(userId: string) {
  try {
    // 1. Authorization
    await checkAdminAuth();

    // 2. Validation
    if (!userId || userId.length === 0) {
      return { error: "Invalid user ID" };
    }

    // 3. Business Logic
    await userService.delete(userId);

    // 4. Response
    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    return { error: "Failed to delete user" };
  }
}
```

### 4. **Business Logic Layer** (Services)

**Location**: `src/lib/services/`

**Responsibility**: Core business logic, rules, and workflows

**Key Files**:
- `user.service.ts` - User business logic
- `exercise.service.ts` - Exercise business logic
- `registration-policy.service.ts` - Policy logic
- `index.ts` - Centralized exports

**Principles**:
- Pure functions focused on business rules
- No framework dependencies (Next.js, React)
- No direct HTTP/response handling
- Use repositories for data access
- Throw errors for failures (caught by actions)
- No console.logs (return errors properly)

**Service Pattern**:
```typescript
class UserService {
  async create(data: CreateUserInput) {
    // Validation & business logic
    const hashedPassword = await hash(data.password, 10);

    // Use repository for data access
    return userRepository.create({
      ...data,
      password: hashedPassword,
    });
  }

  async delete(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");
    return userRepository.delete(userId);
  }
}

export const userService = new UserService();
```

### 5. **Data Access Layer** (Repositories)

**Location**: `src/lib/db/repositories/`

**Responsibility**: Database queries and mutations

**Key Files**:
- `user.repository.ts` - User database operations
- `exercise.repository.ts` - Exercise database operations
- `registration-policy.repository.ts` - Policy database operations
- `index.ts` - Centralized exports

**Principles**:
- CRUD operations only
- No business logic or data transformation
- Return raw database results
- Consistent naming: `findById()`, `findMany()`, `create()`, `update()`, `delete()`
- Throw database errors (caught by services)

**Repository Pattern**:
```typescript
export const userRepository = {
  findById: async (id: string) => {
    return db.user.findUnique({ where: { id } });
  },

  findMany: async (where?: Prisma.UserWhereInput) => {
    return db.user.findMany({ where });
  },

  create: async (data: Prisma.UserCreateInput) => {
    return db.user.create({ data });
  },

  update: async (id: string, data: Prisma.UserUpdateInput) => {
    return db.user.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    return db.user.delete({ where: { id } });
  },
};
```

### 6. **Database Layer** (Prisma)

**Location**: `prisma/schema.prisma`

**Responsibility**: Database schema and ORM configuration

**Key Files**:
- `prisma/schema.prisma` - Database schema
- `src/lib/db/index.ts` - Prisma client singleton

## Implementation Process

When implementing a new feature, follow this strict order:

### Step 1: Update Database Schema (if needed)
```bash
# prisma/schema.prisma
model Entity {
  id    String  @id @default(cuid())
  name  String
}

# Run migration
pnpm prisma migrate dev --name add_entity
```

### Step 2: Create Repository Methods
```typescript
// src/lib/db/repositories/entity.repository.ts
export const entityRepository = {
  findById: async (id: string) => db.entity.findUnique({ where: { id } }),
  create: async (data) => db.entity.create({ data }),
};
```

### Step 3: Create Service Methods
```typescript
// src/lib/services/entity.service.ts
class EntityService {
  async create(data: CreateEntityInput) {
    // Business logic here
    return entityRepository.create(data);
  }
}
```

### Step 4: Create Server Actions
```typescript
// src/lib/actions/entity.ts
export async function createEntity(data: CreateEntityInput) {
  try {
    await checkAuth();
    const result = await entityService.create(data);
    return { success: true, data: result };
  } catch (error) {
    return { error: error.message };
  }
}
```

### Step 5: Create Custom Hooks (if needed)
```typescript
// src/hooks/use-entity-management.ts
export function useEntityManagement() {
  const [entities, setEntities] = useState([]);
  const handleCreate = useCallback(async (data) => {
    const result = await createEntity(data);
    if (result.success) {
      setEntities([...entities, result.data]);
      toast.success("Created");
    }
  }, [entities]);
  return { entities, handleCreate };
}
```

### Step 6: Create UI Primitives (if reusable)
```typescript
// src/components/ui/primitives/entity-card.tsx
export function EntityCard({ entity, onDelete }: Props) {
  return <div>{/* render entity */}</div>;
}
```

### Step 7: Create Feature Components
```typescript
// src/app/(app)/entities/page.tsx
"use client";
export default function EntitiesPage() {
  const { entities, handleDelete } = useEntityManagement();
  return <EntityCard entity={entities[0]} onDelete={handleDelete} />;
}
```

## TypeScript Guidelines

### Type Organization

- **Location**: `src/types/` folder with descriptive filenames
- **Never** define types inside components
- Use `interfaces` over `types` for object shapes
- **Avoid enums** - use const objects instead

```typescript
// src/types/user.ts
export interface User {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
}

// src/types/exercise.ts
export interface Exercise {
  id: string;
  title: string;
  description: string;
}
```

### Validation with Zod

```typescript
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name required"),
  password: z.string().min(8, "Min 8 characters"),
});

// In server action:
const parsed = createUserSchema.parse(data);
```

## Styling Guidelines

### Tailwind CSS

- Use Tailwind CSS v4 or later
- Mobile-first responsive approach
- Follow color palette from design system
- Dark mode support using `dark:` prefix

```typescript
export function Button({ primary }: Props) {
  return (
    <button className={`
      px-4 py-2 rounded
      ${primary 
        ? 'bg-blue-500 text-white dark:bg-blue-600' 
        : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
      }
    `}>
      Click me
    </button>
  );
}
```

### Component Styling

- No inline styles (use Tailwind)
- Use CSS modules only for complex scoped styles
- Maintain semantic HTML structure
- Ensure accessibility (ARIA attributes)

## State Management

### Client State

Use `useState` for local component state:
```typescript
const [isOpen, setIsOpen] = useState(false);
```

### Global State

Use React Context API or Zustand for shared state across components:
```typescript
// hooks/use-auth-context.ts
const AuthContext = createContext<AuthContextType | null>(null);
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("Must be used within provider");
  return ctx;
}
```

### Server State

Manage through server actions and hooks, never in client state if coming from server.

## Error Handling

### Pattern for All Layers

**Repository**: Throw database errors
```typescript
async findById(id) {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");
  return user;
}
```

**Service**: Throw business logic errors
```typescript
async delete(userId) {
  if (isSystemUser(userId)) throw new Error("Cannot delete system user");
  return await userRepository.delete(userId);
}
```

**Action**: Catch and map to response
```typescript
export async function deleteUser(userId) {
  try {
    await userService.delete(userId);
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed" };
  }
}
```

**Hook**: Handle response and show UI feedback
```typescript
const handleDelete = useCallback(async (userId) => {
  const result = await deleteUser(userId);
  if (result.success) {
    toast.success("Deleted");
    setUsers(users.filter(u => u.id !== userId));
  } else {
    toast.error(result.error);
  }
}, [users]);
```

## Common Patterns

### Authentication Required Action

```typescript
export async function protectedAction(data: any) {
  try {
    await checkAuth(); // Throws if not authenticated
    // ... rest of logic
    return { success: true };
  } catch (error) {
    return { error: "Unauthorized" };
  }
}
```

### Admin Only Action

```typescript
export async function adminAction(id: string) {
  try {
    await checkAdminAuth(); // Throws if not admin
    await adminService.doAdminThing(id);
    return { success: true };
  } catch (error) {
    return { error: "Unauthorized" };
  }
}
```

### Input Validation

```typescript
export async function validatedAction(values: CreateUserInput) {
  try {
    const parsed = createUserSchema.parse(values);
    const user = await userService.create(parsed);
    return { success: true, user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message };
    }
    return { error: "Failed" };
  }
}
```

---

## General Implementation Principles

### Separation of Concerns

- **Components**: Only handle UI rendering and user interactions
- **Hooks**: Manage component state and call server actions
- **Server Actions**: Handle authorization, validation, and business logic delegation
- **Services**: Implement business rules without framework dependencies
- **Repositories**: Execute database operations only

### Import Rules (Clean Architecture)

```
❌ NEVER DO THIS:
- Components importing from services/repositories
- Services importing from components
- Repositories importing from services

✅ ALWAYS DO THIS:
- Components import from hooks and other components
- Hooks import from server actions
- Server actions import from services
- Services import from repositories
- Repositories import from database only
```

### Response Mapping

All actions must return consistent response format:
```typescript
// Success cases
{ success: true, data?: any }
{ success: true, users: User[] }
{ success: true, policy: Policy }

// Error cases  
{ error: string }
{ success: false, error: "Specific error message" }
```

Hooks always check `result.success` before updating state and show toasts for errors.

---

## React Specific Guidelines

### Component Design

- **Functional Components & Hooks:** Prefer **functional components with React Hooks**. Avoid class components unless explicitly for error boundaries.
- **Single Responsibility:** Each component has ONE primary responsibility. **Keep components small (< 200 lines).**
- **No Business Logic:** Components only receive data via props and call handlers - zero business logic
- **Props:**
  - Use `camelCase` for prop names.
  - Destructure props in the function signature.
  - Provide clear `interface` or `type` definitions for props.
- **Immutability:** Never mutate props or state directly. Always create new objects/arrays for updates.
- **Fragments:** Use `<>...</>` to avoid unnecessary DOM wrapper elements.
- **UI Components:** Use [shadcn/ui](https://ui.shadcn.com/) and Radix UI for consistency and accessibility.
- **Minimize Client Components:** Reduce use of 'use client' and 'useEffect' directives; favor React Server Components.
- **Suspense Boundaries:** Wrap client components in Suspense with appropriate fallbacks.

### Primitive Components

Located in `src/components/ui/primitives/`, these small reusable components should:
- Accept all data and handlers via props
- Have no state or side effects
- Be < 100 lines of code
- Be usable across multiple features

Example:
```typescript
export function UserTable({ users, onDelete, onEdit, loading }: Props) {
  return (
    <Table>
      {users.map(user => (
        <TableRow key={user.id}>
          <TableCell>{user.name}</TableCell>
          <TableCell>
            <Button onClick={() => onEdit(user.id)}>Edit</Button>
            <Button onClick={() => onDelete(user.id)} disabled={loading}>Delete</Button>
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
```

### Feature Components

Located in feature folders or pages, these components:
- Use custom hooks for state management
- Compose primitive components
- Call event handlers from hooks
- Keep UI and logic separated

Example:
```typescript
"use client";
export default function UsersPage() {
  const { users, loading, handleDelete, handleEdit } = useUserManagement();
  return <UserTable users={users} loading={loading} onDelete={handleDelete} onEdit={handleEdit} />;
}
```

### State Management

- **Component State:** Use `useState` only for temporary UI state (modals, dropdowns, form inputs)
- **Data State:** Always managed through hooks that call server actions
- **Global State:** Use React Context for auth/user info; avoid for business data
- **Never:** Store server data directly in component state

### Styling

- **Tailwind CSS v4+** for all styling
- **Mobile-First:** Responsive design from smallest screen up
- **No Inline Styles:** Use Tailwind classes exclusively
- **Dark Mode:** Support with `dark:` prefix
- **CSS Modules:** Only for complex scoped styles (rare)
- **Semantic HTML:** Maintain proper HTML structure

### Performance

- **Keys:** Always use unique, stable keys when mapping lists
- **Lazy Loading:** Use `React.lazy` and `Suspense` for code splitting
- **Dynamic Imports:** Use `next/dynamic` for non-critical components
- **Image Optimization:** Always use `next/image` component with proper sizing
- **Memoization:** Only use `useMemo`/`useCallback` if proven necessary

## Next.js Specific Guidelines

### Data Fetching & Rendering

- **App Router Only:** This project uses **App Router exclusively**. Never use Pages Router.
- **Server Components Default:** Use Server Components for data fetching and public content
- **Client Components Minimal:** Use 'use client' only when needed for interactivity
- **Data Fetching Methods:**
  - **Server Components:** Direct database access via repositories/services
  - **Client Components:** Use server actions called from hooks
  - Never fetch on client for server data - always use server actions
- **Parallel Fetching:** Initiate independent requests in parallel in Server Components

### Server Components with Clean Architecture

```typescript
// src/app/users/page.tsx - Server Component
import { userService } from '@/lib/services';

export default async function UsersPage() {
  // Directly use service in server component
  const users = await userService.getAll();
  return <UserList initialUsers={users} />;
}

// src/app/users/user-list.tsx - Client Component  
"use client";
import { useUserManagement } from '@/hooks/use-user-management';
import { UserTable } from '@/components/ui/primitives/user-table';

export function UserList({ initialUsers }: Props) {
  const { users = initialUsers, handleDelete } = useUserManagement();
  return <UserTable users={users} onDelete={handleDelete} />;
}
```

### Routing

- **File-System Routing:** Use Next.js App Router file-system convention
- **Route Groups:** Use `(folderName)` to organize without affecting URLs
- **Dynamic Routes:** Define segments clearly (e.g., `[userId]`, `[...slug]`)
- **Middleware:** Use `middleware.ts` for global auth/authorization checks
- **Layout Strategy:** Keep layouts focused on their scope

### Optimization

- **Image Optimization:** Always use `next/image` with proper sizing
- **Font Optimization:** Use `next/font` for custom fonts
- **Dynamic Imports:** Use `next/dynamic` for lazy loading
- **Build Optimization:** Leverage static generation where possible
- **Caching:** Use `revalidate` for ISR when needed

### Project Structure - Clean Architecture Compliance

```
src/
├── app/                          ← Pages and layouts (use server components by default)
│   ├── (app)/                    ← Main app routes
│   │   ├── layout.tsx            ← Server component, handles auth checks
│   │   ├── dashboard/
│   │   │   └── page.tsx          ← Server component fetches data
│   │   └── users/
│   │       ├── page.tsx          ← Server component, uses userService directly
│   │       └── user-list.tsx     ← Client component, uses hooks
│   └── (auth)/                   ← Auth routes
│
├── components/                   ← React Components (UI Layer)
│   ├── ui/                       ← shadcn/ui and custom primitives
│   │   └── primitives/           ← Reusable small components (no state)
│   │       ├── user-table.tsx
│   │       ├── delete-dialog.tsx
│   │       └── index.ts
│   ├── shared/                   ← Shared across features
│   └── [feature]/                ← Feature-specific components
│
├── hooks/                        ← Custom Hooks (UI Logic Layer)
│   ├── use-user-management.ts    ← State + server action calls
│   ├── use-registration-policies.ts
│   ├── use-debounce.ts
│   └── index.ts
│
├── lib/
│   ├── actions/                  ← Server Actions (Controller Layer)
│   │   ├── auth.ts
│   │   ├── admin.ts
│   │   ├── exercise.ts
│   │   └── index.ts
│   │
│   ├── services/                 ← Business Logic (Service Layer)
│   │   ├── user.service.ts
│   │   ├── exercise.service.ts
│   │   ├── registration-policy.service.ts
│   │   └── index.ts
│   │
│   ├── db/
│   │   ├── repositories/         ← Data Access (Repository Layer)
│   │   │   ├── user.repository.ts
│   │   │   ├── exercise.repository.ts
│   │   │   ├── registration-policy.repository.ts
│   │   │   └── index.ts
│   │   └── index.ts              ← Prisma client
│   │
│   ├── utils.ts                  ← General utilities
│   ├── colors.ts
│   └── [other utilities]
│
├── types/                        ← TypeScript types/interfaces
│   ├── user.ts
│   ├── exercise.ts
│   └── track.ts
│
└── auth.ts                       ← Auth configuration
```

**Key Principles:**
- No barrel files (`index.ts` re-exports) - import directly from files
- Components only in `components/`
- All business logic in layers below components
- Clear dependency direction: Components ← Hooks ← Actions ← Services ← Repositories

### SEO & Accessibility

- **Metadata:** Use `generateMetadata` for dynamic SEO
- **Semantic HTML:** Use proper heading hierarchy, article, section, nav, etc.
- **ARIA Attributes:** Include aria-labels, aria-descriptions where needed
- **Keyboard Navigation:** Ensure all interactive elements are keyboard accessible
- **Focus Management:** Visible focus indicators and logical tab order
- **Alt Text:** Descriptive alt text for all meaningful images

### TypeScript Best Practices

- **Strict Mode:** Ensure `strict: true` in `tsconfig.json`
- **Type Locations:** All types in `src/types/` folder with descriptive filenames
- **No Inline Types:** Never define interfaces in components or other files
- **Interfaces over Types:** Use interfaces for object shapes, types for unions/aliases
- **Avoid Enums:** Use const objects instead
  ```typescript
  // Bad
  enum UserRole { ADMIN = 'ADMIN', USER = 'USER' }
  
  // Good
  const USER_ROLES = { ADMIN: 'ADMIN', USER: 'USER' } as const;
  type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
  ```
- **Type Safety Across Stack:** Changes to types must be reflected in DB → Repositories → Services → Actions → Components
