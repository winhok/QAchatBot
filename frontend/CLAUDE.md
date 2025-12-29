# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QA ChatBot Frontend - React 19 application with TanStack Router, Zustand state management, and Shadcn UI. Communicates with NestJS backend via SSE streaming for real-time chat responses.

## Development Commands

```bash
# Install dependencies
pnpm install

# Development (proxies /api to localhost:3000)
pnpm dev

# Build
pnpm build

# Testing (Vitest)
pnpm test

# Linting & Formatting
pnpm lint
pnpm format
pnpm check                # Format + lint fix

# Add Shadcn component
pnpm dlx shadcn@latest add <component-name>
```

## Architecture

### Directory Structure

```
src/
├── routes/           # TanStack Router file-based routing
│   ├── __root.tsx    # Root layout with sidebar
│   ├── index.tsx     # Welcome/lobby page
│   └── $threadId.tsx # Chat thread page (dynamic route)
├── components/
│   ├── ui/           # Shadcn primitives (button, dialog, input, etc.)
│   └── *.tsx         # Feature components (ChatInput, MessageList, SessionSidebar)
├── stores/           # Zustand state management
├── hooks/            # Custom hooks (TanStack Query wrappers)
├── services/         # API layer with Zod validation
├── schemas/          # Zod schemas and TypeScript types
├── integrations/     # TanStack Query provider and devtools
├── lib/              # Utilities (cn, motion variants, constants)
├── types/            # Store interface definitions
└── utils/            # Helper functions (message, file, image)
```

### Key Files

| File | Purpose |
|------|---------|
| `router.tsx` | Router + QueryClient creation |
| `routeTree.gen.ts` | Auto-generated route tree (don't edit) |
| `stores/useChatMessages.ts` | Message state, streaming updates, tool calls |
| `stores/useSession.ts` | Current session ID, type, model selection |
| `stores/useSendMessage.ts` | SSE streaming logic with abort support |
| `services/api.ts` | Axios instance with Zod runtime validation |
| `schemas/index.ts` | All Zod schemas and derived types |

## Key Patterns

### Path Aliases

`@/*` maps to `src/*` (configured in tsconfig.json):
```typescript
import { Button } from '@/components/ui/button'
import { useChatMessages } from '@/stores/useChatMessages'
```

### Zustand Stores

```typescript
// Access state
const messages = useChatMessages((s) => s.messages)
const isLoading = useChatMessages((s) => s.isLoading)

// Access outside React
const { addUserMessage } = useChatMessages.getState()
```

### TanStack Query Hooks

Custom hooks wrap TanStack Query in `hooks/`:
```typescript
const { data: sessions } = useSessions()
const deleteMutation = useDeleteSession()
```

### API with Zod Validation

```typescript
import { apiGet, apiPost } from '@/services/api'

// Validates response at runtime
const { data } = await apiGet<GetSessionsResponse>('/api/sessions', {
  schema: GetSessionsResponseSchema,
})
```

### SSE Streaming

`useSendMessage.ts` processes these event types from `/api/chat`:
- `chunk` - Text content fragment
- `tool_start` - Tool invocation (tool_call_id, name, input)
- `tool_end` - Tool completed (output, duration)
- `tool_error` - Tool failed
- `end` - Stream complete (session_id)
- `error` - Server error

### Dynamic Routes

Routes with `$` prefix are dynamic parameters:
```typescript
// routes/$threadId.tsx
export const Route = createFileRoute('/$threadId')({
  component: ThreadPage,
  beforeLoad: ({ params }) => {
    if (!isCuid(params.threadId)) throw notFound()
  },
})
```

## Conventions

- **Styling**: Tailwind CSS v4 with `@tailwindcss/vite` plugin
- **Icons**: Lucide React (`lucide-react`)
- **Animations**: Framer Motion (`framer-motion`)
- **UI Components**: Shadcn (Radix primitives + Tailwind)
- **Forms**: Controlled components with Zustand
- **Types**: Derived from Zod schemas via `z.infer<typeof Schema>`

## Adding New Features

### New Route

1. Create file in `src/routes/` (e.g., `settings.tsx`)
2. Export `Route` using `createFileRoute`:
```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return <div>Settings</div>
}
```
3. `routeTree.gen.ts` auto-updates on dev server restart

### New Zustand Store

```typescript
// stores/useMyStore.ts
import { create } from 'zustand'

interface MyState {
  value: string
  setValue: (v: string) => void
}

export const useMyStore = create<MyState>((set) => ({
  value: '',
  setValue: (v) => set({ value: v }),
}))
```

### New TanStack Query Hook

```typescript
// hooks/useMyData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/services/api'

export function useMyData() {
  return useQuery({
    queryKey: ['myData'],
    queryFn: () => apiGet('/api/my-data'),
  })
}

export function useCreateMyData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MyData) => apiPost('/api/my-data', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myData'] }),
  })
}
```

### New Zod Schema

```typescript
// schemas/index.ts
export const MyDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
})

export type MyData = z.infer<typeof MyDataSchema>
```

### New Shadcn Component

```bash
pnpm dlx shadcn@latest add accordion
```

Components are added to `src/components/ui/`.

## Session Types

Two session modes controlled by `useSession.sessionType`:
- `normal` - General chat conversation
- `testcase` - Test case generation workflow

## Tech Stack

- React 19 with React Compiler (`babel-plugin-react-compiler`)
- Vite 7 with `@tailwindcss/vite` and `vite-tsconfig-paths`
- TanStack Router (file-based) + TanStack Query
- Zustand for state management
- Zod for validation (schemas shared with backend)
- Axios for HTTP requests
- Shadcn UI (Radix + Tailwind)
- Framer Motion for animations
- Vitest + Testing Library for tests
