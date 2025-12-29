# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QA ChatBot - An intelligent Q&A system with AI Agent capabilities for generating test cases from PRD documents. Monorepo with separate frontend and backend applications.

## Development Commands

### Backend (NestJS + LangGraph)

```bash
cd backend

# Install dependencies
pnpm install

# Database setup
npx prisma migrate dev    # Run migrations
npx prisma generate       # Generate Prisma client

# Development
pnpm run start:dev        # Watch mode

# Build & Production
pnpm run build
pnpm run start:prod

# Testing
pnpm test                 # Run all unit tests
pnpm test:watch           # Watch mode
pnpm test -- --testPathPattern=sessions  # Run single test file
pnpm test:e2e             # E2E tests (in test/ directory)

# Linting
pnpm run lint
pnpm run format
```

### Frontend (Vite + React + TanStack)

```bash
cd frontend

# Install dependencies
pnpm install

# Development
pnpm dev                  # Proxies /api to localhost:3000

# Build
pnpm build

# Testing
pnpm test                 # Vitest (run mode)

# Linting & Formatting
pnpm lint
pnpm format
pnpm check                # Format + lint fix
```

### Adding Shadcn Components

```bash
cd frontend
pnpm dlx shadcn@latest add <component-name>
```

## Architecture

### Backend Structure (`backend/src/`)

- **`config/`** - App, database, and LLM configuration
- **`common/`** - Middleware (logging), pipes (Zod validation), request context
- **`shared/schemas/`** - Zod schema definitions for validation
- **`infrastructure/`** - Database (Prisma) and logger (Pino) services
- **`agent/`** - AI Agent module:
  - `tools/` - Tool registry and built-in tools (current-time, calculator, read-file)
  - `prompts/` - Prompt templates and persona configuration
  - `graphs/` - LangGraph workflows:
    - `chatbot/` - ReAct pattern for general conversation
    - `qa-chatbot/` - Multi-stage workflow for test case generation (init → test_points → test_cases → review → completed)
- **`modules/`** - Business domains:
  - `conversation/` - Sessions, messages, chat endpoints
  - `analytics/` - Feedback, export, search

### Frontend Structure (`frontend/src/`)

- **`routes/`** - TanStack Router file-based routing (auto-generated `routeTree.gen.ts`)
- **`components/`** - React components with Shadcn UI
  - `ui/` - Shadcn primitives (button, dialog, etc.)
  - Root level - Feature components (ChatInput, MessageList, SessionSidebar)
- **`stores/`** - Zustand state management
  - `useChatMessages.ts` - Message state and streaming updates
  - `useSession.ts` - Current session state
  - `useSendMessage.ts` - SSE streaming logic with abort support
- **`hooks/`** - Custom React hooks (TanStack Query wrappers)
- **`services/`** - Axios API layer with Zod runtime validation
- **`schemas/`** - Zod schemas (shared types derived via `z.infer`)
- **`integrations/`** - TanStack Query provider and devtools

### Key Frontend Patterns

- **Path Aliases**: `@/*` maps to `src/*` (configured in tsconfig.json)
- **React Compiler**: Enabled via `babel-plugin-react-compiler`
- **SSE Streaming**: `useSendMessage.ts` handles chunked responses with tool call events
- **API Validation**: `services/api.ts` validates responses at runtime using Zod schemas
- **Route Parameters**: Dynamic routes like `$threadId.tsx` use CUID validation

### Data Flow

1. Frontend sends chat requests to `/api/chat` (SSE streaming)
2. Backend routes to appropriate LangGraph agent based on session type
3. Agent processes with tool calls and state transitions
4. Responses streamed back via Server-Sent Events (chunk, tool_start, tool_end, end events)
5. Chat history persisted via Prisma to PostgreSQL

### Database Schema (Prisma)

- **Session** - Chat sessions with name, type, status
- **Message** - Messages with role, content, metadata, linked to sessions
- **ToolCall** - Tool invocations with args, result, status, linked to messages

## Key Conventions

- **Validation**: Zod schemas in `shared/schemas/` (backend) and `src/schemas/` (frontend)
- **State Management**: Zustand for frontend global state
- **Routing**: TanStack Router with file-based routes
- **Styling**: Tailwind CSS v4 with `@tailwindcss/vite` plugin
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Agent Tools**: Register in `backend/src/agent/tools/tools.registry.ts`
- **New LangGraph Workflow**: Create in `backend/src/agent/graphs/<name>/` with state.ts, nodes.ts, edges.ts, graph.ts pattern

## SSE Event Types

The chat streaming protocol uses these event types:
- `chunk` - Text content fragment
- `tool_start` - Tool invocation started (includes tool_call_id, name, input)
- `tool_end` - Tool completed (includes output, duration)
- `tool_error` - Tool failed
- `end` - Stream complete (includes session_id)
- `error` - Server error

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Stream chat (SSE) |
| GET | `/api/chat?session_id=` | Get chat history |
| GET/POST/PATCH/DELETE | `/api/sessions` | Session CRUD |

## Environment Variables

Backend `.env`:
- `PORT`, `CORS_ORIGINS` - Server config
- `DATABASE_URL` - PostgreSQL connection
- `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_DEFAULT_MODEL` - LLM config

## Adding New Agent Tools

Create a tool definition in `backend/src/agent/tools/builtin/`:

```typescript
// my-tool.tool.ts
import { z } from 'zod';
import type { ToolDefinition } from '../tools.registry';

export const myTool: ToolDefinition = {
  name: 'my_tool',
  description: 'Tool description for LLM',
  schema: z.object({
    param: z.string().describe('Parameter description'),
  }),
  handler: async ({ param }) => {
    return `Result: ${param}`;
  },
};
```

Register in `tools.registry.ts`:
```typescript
this.register(myTool);
```

## Adding New LangGraph Workflow

Create directory structure in `backend/src/agent/graphs/<name>/`:

```
├── types.ts          # Type definitions (stages, intents, node names)
├── state.ts          # LangGraph Annotation state
├── nodes.ts          # Node functions
├── edges.ts          # Conditional routing logic
├── graph.ts          # Graph compilation
└── <name>.service.ts # NestJS service wrapper
```

QA-chatbot workflow stages: `init` → `test_points` → `test_cases` → `review` → `completed`

## Adding New Frontend Routes

1. Create route file in `frontend/src/routes/` (e.g., `mypage.tsx`)
2. Export `Route` using `createFileRoute`
3. `routeTree.gen.ts` auto-updates on dev server restart

## Adding New Zustand Store

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
