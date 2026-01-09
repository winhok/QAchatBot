# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QA ChatBot - An intelligent Q&A system with AI Agent capabilities for generating test cases from PRD documents. Monorepo with separate frontend and backend applications featuring canvas artifacts, RAG document storage, and multi-provider LLM support.

## Git Commit Conventions

**IMPORTANT**: Always distinguish between frontend and backend changes in commit messages:

- Prefix commits with `[frontend]` for frontend-only changes
- Prefix commits with `[backend]` for backend-only changes
- Use both prefixes `[frontend][backend]` for changes affecting both

Examples:

```
[frontend] Add canvas artifact preview panel
[backend] Implement RAG document storage service
[frontend][backend] Update chat API schema for tool metadata
```

When changes span multiple areas within the same workspace, be specific:

```
[backend] Add memory persistence and update folder schema
[frontend] Implement session sidebar with folder organization
```

## Development Commands

### Monorepo (Root)

```bash
# Run both frontend and backend concurrently
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Lint and format all packages
pnpm lint
pnpm format
```

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
- **`common/`** - Request context, middleware (logging), pipes (Zod validation), decorators, filters, guards, interceptors
- **`shared/schemas/`** - Zod schema definitions for validation (enums, requests, models)
- **`infrastructure/`** - Core services:
  - `database/` - Prisma client and service
  - `logger/` - Pino logging service
  - `cache/` - Caching layer
  - `memory/` - Memory persistence service
- **`agent/`** - AI Agent module:
  - `core/interfaces/` - Agent core interface definitions
  - `tools/` - Tool registry and multi-type tool support:
    - `builtin/` - Custom tools (current-time, calculator, read-file)
    - `config/` - Unified tools configuration (custom, LangChain, MCP)
    - `types/` - Tool type definitions
  - `prompts/` - Prompt templates and persona configuration
  - `graphs/` - LangGraph workflows:
    - `chatbot/` - ReAct pattern for general conversation
    - `qa-chatbot/` - Multi-stage workflow for test case generation
  - `utils/` - Agent utilities
- **`modules/`** - Business domains:
  - `conversation/` - Sessions, messages, folders, chat endpoints
  - `analytics/` - Feedback, export, search
  - `rag/` - RAG document storage and retrieval

### Frontend Structure (`frontend/src/`)

- **`routes/`** - TanStack Router file-based routing (auto-generated `routeTree.gen.ts`)
- **`components/`** - React components with Shadcn UI
  - `ui/` - Shadcn primitives (button, dialog, etc.)
  - `canvas/` - Canvas artifact system (CodePreviewPanel, MarkdownPreview)
  - Root level - Feature components (ChatInput, MessageList, SessionSidebar)
- **`stores/`** - Zustand state management
  - `useChatMessages.ts` - Message state and streaming updates
  - `useSession.ts` - Current session state
  - `useSendMessage.ts` - SSE streaming logic with abort support
- **`hooks/`** - Custom React hooks (TanStack Query wrappers)
- **`services/`** - Axios API layer with Zod runtime validation
- **`schemas/`** - Zod schemas (shared types derived via `z.infer`)
- **`integrations/`** - TanStack Query provider and devtools
- **`config/`** - Frontend configuration
- **`providers/`** - React context providers
- **`types/`** - TypeScript type definitions (canvas artifacts, etc.)
- **`utils/`** - Utility functions
- **`lib/`** - Shared library code

### Key Frontend Patterns

- **Path Aliases**: `@/*` maps to `src/*` (configured in tsconfig.json)
- **React Compiler**: Enabled via `babel-plugin-react-compiler`
- **SSE Streaming**: `useSendMessage.ts` handles chunked responses with tool call events
- **API Validation**: `services/api.ts` validates responses at runtime using Zod schemas
- **Route Parameters**: Dynamic routes like `$threadId.tsx` use CUID validation
- **Canvas Artifacts**: Interactive React components rendered in iframe sandbox with Babel transpilation

### Data Flow

1. Frontend sends chat requests to `/api/chat` (SSE streaming)
2. Backend routes to appropriate LangGraph agent based on session type
3. Agent processes with tool calls and state transitions
4. Responses streamed back via Server-Sent Events (chunk, tool_start, tool_end, end events)
5. Chat history persisted via Prisma to PostgreSQL
6. Canvas artifacts rendered in isolated iframe for security

### Database Schema (Prisma)

- **Folder** - Organize sessions with icons, colors, descriptions
- **Session** - Chat sessions with name, type, status, linked to folders
- **Message** - Messages with role, content, metadata, linked to sessions
- **ToolCall** - Tool invocations with args, result, status, duration, linked to messages
- **Memory** - Persistent memory storage with scope (folder/global), category, priority, expiration
- **Document** - RAG document storage with collection, content, metadata

## Key Conventions

- **Validation**: Zod schemas in `shared/schemas/` (backend) and `src/schemas/` (frontend)
- **State Management**: Zustand for frontend global state
- **Routing**: TanStack Router with file-based routes
- **Styling**: Tailwind CSS v4 with `@tailwindcss/vite` plugin
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Agent Tools**: Three types supported - custom, LangChain, MCP (configured in `backend/src/agent/tools/config/`)
- **New LangGraph Workflow**: Create in `backend/src/agent/graphs/<name>/` with types.ts, state.ts, nodes.ts, edges.ts, graph.ts, <name>.service.ts pattern

## Tool System

The backend supports three types of tools:

### 1. Custom Tools

Built-in tools in `backend/src/agent/tools/builtin/`:

- `current-time.tool.ts` - Returns current time
- `calculator.tool.ts` - Performs calculations
- `read-file.tool.ts` - Reads file contents

### 2. LangChain Tools

Dynamically imported LangChain community tools (e.g., TavilySearch, WikipediaQuery)

### 3. MCP Tools

Model Context Protocol server tools with 15s connection timeout

Tool configuration is managed via `backend/src/agent/tools/config/unified-tools.config.ts`

## SSE Event Types

The chat streaming protocol uses these event types:

- `chunk` - Text content fragment
- `tool_start` - Tool invocation started (includes tool_call_id, name, input)
- `tool_end` - Tool completed (includes output, duration)
- `tool_error` - Tool failed
- `end` - Stream complete (includes session_id)
- `error` - Server error

## API Endpoints

### Chat

| Method | Path                    | Description       |
| ------ | ----------------------- | ----------------- |
| POST   | `/api/chat`             | Stream chat (SSE) |
| GET    | `/api/chat?session_id=` | Get chat history  |

### Sessions

| Method | Path                | Description    |
| ------ | ------------------- | -------------- |
| GET    | `/api/sessions`     | List sessions  |
| POST   | `/api/sessions`     | Create session |
| PATCH  | `/api/sessions/:id` | Update session |
| DELETE | `/api/sessions/:id` | Delete session |

## Environment Variables

Backend `.env`:

```env
# Server
PORT=3000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/qa_chatbot?schema=public"

# LLM
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
OPENAI_TIMEOUT=300000
OPENAI_MAX_RETRIES=3

# Google AI (optional)
GOOGLE_API_KEY=your_google_api_key
GOOGLE_MODEL_NAME=gemini-pro

# LangSmith (optional)
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_TRACING=false
LANGSMITH_PROJECT=QAchatBot

# Proxy (optional)
# HTTPS_PROXY=http://127.0.0.1:7890
```

## Adding New Agent Tools

### Custom Tools

Create a tool definition in `backend/src/agent/tools/builtin/`:

```typescript
// my-tool.tool.ts
import { z } from 'zod'
import type { ToolDefinition } from '../tools.registry'

export const myTool: ToolDefinition = {
  name: 'my_tool',
  description: 'Tool description for LLM',
  schema: z.object({
    param: z.string().describe('Parameter description'),
  }),
  handler: async ({ param }) => {
    return `Result: ${param}`
  },
}
```

Register in `backend/src/agent/tools/config/unified-tools.config.ts`:

```typescript
{
  id: 'my_tool',
  type: 'custom',
  enabled: true,
  config: { toolName: 'my_tool' }
}
```

### LangChain Tools

Add to `unified-tools.config.ts`:

```typescript
{
  id: 'tavily_search',
  type: 'langchain',
  enabled: true,
  config: {
    package: '@langchain/community/tools/tavily_search',
    className: 'TavilySearchResults'
  }
}
```

### MCP Tools

Configure MCP server in `unified-tools.config.ts`:

```typescript
{
  serverName: 'filesystem',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/dir']
}
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

## Canvas Artifacts

The frontend supports rendering interactive React components via canvas artifacts:

- Components are transpiled using Babel Standalone in an iframe sandbox
- Lucide React icons are pre-injected
- Console output and errors are captured and displayed
- Code is executed in isolation for security

To trigger canvas artifact creation, include special XML tags in LLM responses (handled automatically by the agent).
