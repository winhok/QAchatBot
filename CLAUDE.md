# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QA ChatBot is an AI-powered Q&A system with agent capabilities for generating test cases from PRD documents. It's a monorepo with:

- **Backend**: NestJS + LangGraph + Prisma (PostgreSQL)
- **Frontend**: Vite + React 19 + TanStack Router + Zustand
- **TypeScript**: Using Go-based native TypeScript compiler (`@typescript/native-preview`) for faster builds

## Git Commit Conventions

Always prefix commits to indicate scope:

- `[frontend]` - Frontend-only changes
- `[backend]` - Backend-only changes
- `[frontend][backend]` - Changes affecting both

## Development Commands

### Monorepo (Root)

```bash
pnpm dev              # Run frontend + backend concurrently
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm format           # Format with Prettier

# PM2 Production
pnpm pm2:start        # Start with PM2
pnpm pm2:stop         # Stop services
pnpm pm2:logs         # View logs
```

### Backend

```bash
cd backend
pnpm start:dev                              # Development (watch mode)
pnpm build && pnpm start:prod               # Production

# Database
npx prisma migrate dev --name <name>        # Create migration
npx prisma generate                         # Regenerate client

# Testing
pnpm test                                   # All tests
pnpm test -- --testPathPattern=sessions     # Single test file
pnpm test:cov                               # With coverage
pnpm test:e2e                               # E2E tests
```

### Frontend

```bash
cd frontend
pnpm dev                                    # Dev server (proxies /api to :3000)
pnpm build                                  # Production build
pnpm test                                   # Vitest
pnpm check                                  # Format + lint fix
pnpm dlx shadcn@latest add <component>      # Add Shadcn component
```

## Architecture

### Backend (`backend/src/`)

```
config/           # App, database, LLM configuration
common/           # Middleware, pipes (Zod), decorators, filters, guards
shared/schemas/   # Zod schemas for validation
infrastructure/
  ├── database/   # Prisma service
  ├── logger/     # Pino logging
  ├── cache/      # Caching layer
  └── memory/     # Persistent memory service (MemoryStoreService)
agent/
  ├── tools/
  │   ├── builtin/              # Custom tools (current-time, calculator, read-file)
  │   ├── config/               # unified-tools.config.ts - tool registry
  │   └── tools.registry.ts     # ToolsRegistry service (loads all tool types)
  ├── graphs/
  │   ├── chatbot/              # General conversation (ReAct pattern)
  │   └── qa-chatbot/           # Test case generation workflow
  └── prompts/                  # System prompts, persona config
modules/
  ├── conversation/             # Sessions, messages, folders, chat
  ├── analytics/                # Feedback, export, search
  ├── rag/                      # Document storage and retrieval
  └── auth/                     # Authentication (signin, signup, signout)
```

### Frontend (`frontend/src/`)

```
routes/           # TanStack Router file-based routing
components/
  ├── ui/         # Shadcn primitives
  ├── canvas/     # Canvas artifact system (CodePreviewPanel, CanvasSidebar)
  └── welcome/    # Welcome screen components
stores/
  ├── chat/       # Sliced Zustand store (messages, streaming, toolCalls)
  ├── useSession.ts
  └── useSendMessage.ts   # SSE streaming with abort support
hooks/            # TanStack Query wrappers
services/         # Axios API layer with Zod validation
schemas/          # Zod schemas (types via z.infer)
types/            # TypeScript definitions
utils/            # Utilities (CanvasArtifactParser, etc.)
```

### Database Schema (Prisma)

| Model    | Purpose                                           |
| -------- | ------------------------------------------------- |
| Folder   | Organize sessions; has icon, color, description   |
| Session  | Chat session with type (normal/testcase), status  |
| Message  | Seq-indexed messages with role, content, metadata |
| ToolCall | Tool invocations with args, result, duration      |
| Memory   | Persistent storage with scope (global/folder)     |
| Document | RAG document storage with collection partitioning |

### Data Flow

1. Frontend POSTs to `/api/chat` (SSE streaming)
2. Backend routes to appropriate LangGraph agent based on session type
3. Agent processes with tool calls, streams events back
4. SSE events: `chunk`, `tool_start`, `tool_end`, `end`, `error`
5. Messages persisted via Prisma with seq numbers per session
6. Canvas artifacts rendered in isolated iframe sandbox

## API Endpoints

### Chat & Sessions

| Method | Path                        | Description              |
| ------ | --------------------------- | ------------------------ |
| POST   | `/api/chat`                 | Stream chat (SSE)        |
| GET    | `/api/chat`                 | Get history (session_id) |
| GET    | `/api/sessions`             | List sessions            |
| POST   | `/api/sessions`             | Create session           |
| PATCH  | `/api/sessions/:id`         | Update session           |
| DELETE | `/api/sessions/:id`         | Delete session           |
| PATCH  | `/api/sessions/:id/archive` | Archive session          |

### Folders

| Method | Path                        | Description         |
| ------ | --------------------------- | ------------------- |
| GET    | `/api/folders`              | List folders        |
| POST   | `/api/folders`              | Create folder       |
| PATCH  | `/api/folders/:id`          | Update folder       |
| DELETE | `/api/folders/:id`          | Delete folder       |
| GET    | `/api/folders/:id/memories` | Get folder memories |
| POST   | `/api/folders/:id/memories` | Add memory          |
| POST   | `/api/folders/:id/sessions` | Move sessions batch |

### Auth

| Method | Path                | Description      |
| ------ | ------------------- | ---------------- |
| POST   | `/api/auth/signin`  | Sign in          |
| POST   | `/api/auth/signup`  | Sign up          |
| POST   | `/api/auth/signout` | Sign out         |
| GET    | `/api/auth/me`      | Get current user |

### RAG

| Method | Path                     | Description     |
| ------ | ------------------------ | --------------- |
| POST   | `/api/rag/documents`     | Add document    |
| GET    | `/api/rag/documents`     | List documents  |
| DELETE | `/api/rag/documents/:id` | Delete document |
| POST   | `/api/rag/query`         | Query documents |
| GET    | `/api/rag/stats`         | Get stats       |

## Tool System

Three tool types supported, configured in `backend/src/agent/tools/config/unified-tools.config.ts`:

### Custom Tools

Create in `backend/src/agent/tools/builtin/`:

```typescript
export const myTool: ToolDefinition = {
  name: 'my_tool',
  description: 'Description for LLM',
  schema: z.object({ param: z.string().describe('Parameter description') }),
  handler: async ({ param }) => `Result: ${param}`,
}
```

Register in `unified-tools.config.ts`:

```typescript
{ id: 'my_tool', type: 'custom', enabled: true, config: { toolName: 'my_tool' } }
```

### LangChain Tools

```typescript
{
  id: 'tavily_search',
  type: 'langchain',
  enabled: true,
  config: { package: '@langchain/community/tools/tavily_search', className: 'TavilySearchResults' }
}
```

### MCP Tools

```typescript
{
  serverName: 'filesystem',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/dir']
}
```

## Adding LangGraph Workflow

Create in `backend/src/agent/graphs/<name>/`:

```
types.ts          # Stages, intents, node names
state.ts          # Annotation state definition
nodes.ts          # Node implementations
edges.ts          # Conditional routing logic
graph.ts          # StateGraph compilation
<name>.service.ts # NestJS service wrapper
```

QA-chatbot stages: `init` → `test_points` → `test_cases` → `review` → `completed`

## Key Patterns

### TypeScript Compiler

Project uses Go-based native TypeScript compiler (`@typescript/native-preview` v7.0.0-dev) for significantly faster type checking and builds.

### Multi-Provider LLM Support

Model IDs support optional provider prefix: `openai:gpt-4o`, `google:gemini-pro`, or just `gpt-4o` (defaults to OpenAI).

### Frontend State Management

- **Zustand slices**: `stores/chat/` has messageSlice, streamSlice, toolCallSlice
- **Debug mode**: Add `?debug=chat` to enable devtools
- **External access**: Use `getChatStoreState()` outside React

### Canvas Artifacts

- Streaming XML parser extracts `<canvasArtifact>` and `<canvasCode>` tags
- Components transpiled with Babel Standalone in iframe sandbox
- Lucide icons pre-injected, console output captured

### Memory System

Hierarchical with scopes:

- `global` - User-wide preferences
- `folder` - Project-specific rules/context

Categories: `prefs`, `rules`, `knowledge`, `context`

### Sentry Instrumentation

Error collection configured in `frontend/src/router.tsx`. For server function instrumentation:

```typescript
import * as Sentry from '@sentry/tanstackstart-react'
Sentry.startSpan({ name: 'Operation description' }, async () => {
  /* ... */
})
```

## Environment Variables

Backend `.env`:

```env
PORT=3000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
DATABASE_URL="postgresql://user:pass@localhost:5432/qa_chatbot"

# LLM (required)
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

# Google AI (optional)
GOOGLE_API_KEY=
GOOGLE_MODEL_NAME=gemini-pro

# LangSmith tracing (optional)
LANGSMITH_API_KEY=
LANGSMITH_TRACING=false
```

## Conventions

- **Validation**: Zod schemas in `shared/schemas/` (backend), `schemas/` (frontend)
- **Path aliases**: `@/*` maps to `src/*`
- **Styling**: Tailwind CSS v4 + Framer Motion + Lucide icons
- **React Compiler**: Enabled via babel-plugin-react-compiler
- **Message ordering**: Seq numbers per session (not timestamps)
- **Soft deletes**: Session status field (active/archived/deleted)
