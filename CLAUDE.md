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
pnpm check            # Format + lint fix all packages

# PM2 Production
pnpm pm2:start        # Start with PM2
pnpm pm2:stop         # Stop services
pnpm pm2:logs         # View logs
```

### Backend

```bash
cd backend
pnpm start:dev                              # Development (watch mode)
pnpm start:debug                            # Debug mode with watch
pnpm build && pnpm start:prod               # Production

# Database
npx prisma migrate dev --name <name>        # Create migration
npx prisma generate                         # Regenerate client
npx prisma studio                           # Open Prisma Studio GUI

# Testing
pnpm test                                   # All tests
pnpm test:watch                             # Watch mode
pnpm test -- --testPathPattern=sessions     # Single test file
pnpm test:cov                               # With coverage
pnpm test:e2e                               # E2E tests
```

### Frontend

```bash
cd frontend
pnpm dev                                    # Dev server (proxies /api to :3000)
pnpm build                                  # Production build
pnpm preview                                # Preview production build
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
  ├── memory/     # Persistent memory service (MemoryStoreService)
  └── context/    # Request context handling
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
  ├── sidebar/    # Sidebar components
  └── welcome/    # Welcome screen components
stores/
  ├── chat/
  │   ├── slices/
  │   │   ├── message/    # Message state and actions
  │   │   ├── stream/     # Streaming state
  │   │   └── toolCall/   # Tool call state
  │   ├── store.ts        # Combined store
  │   └── selectors.ts    # Memoized selectors
  ├── useSession.ts
  ├── usePanel.ts
  ├── useTheme.ts
  ├── useCanvasArtifacts.ts
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
{
  id: 'my_tool',
  name: '工具名称',
  description: myTool.description,
  icon: '🔧',
  enabled: true,
  type: 'custom',
  schema: myTool.schema,
  handler: myTool.handler,
}
```

### LangChain Tools

```typescript
{
  id: 'tavily',
  name: 'Tavily 搜索',
  description: '使用 Tavily API 进行网络搜索',
  icon: '🌐',
  enabled: true,
  type: 'langchain',
  langChainTool: {
    importPath: '@langchain/tavily',
    className: 'TavilySearch',
    options: { maxResults: 5 },
  },
}
```

### MCP Tools

```typescript
{
  id: 'sequential-thinking',
  name: '顺序思考',
  description: '结构化思考过程',
  icon: '🧠',
  enabled: true,
  type: 'mcp',
  mcpConfig: {
    server: 'server-sequential-thinking',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    transport: 'stdio',
  },
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

## Code Style Guidelines

### Formatting (Prettier)

- **No semicolons**: `semi: false`
- **Single quotes**: `singleQuote: true`
- **Trailing commas**: `trailingComma: 'all'`
- **Line width**: `printWidth: 100`
- **Tabs**: 2 spaces, `useTabs: false`

### Import Order

```typescript
// 1. External dependencies (sorted)
import { z } from 'zod'
import { Injectable } from '@nestjs/common'

// 2. Internal imports with @ alias (sorted)
import { LoggerService } from '@/infrastructure/logger/logger.service'
import { SessionsService } from '@/modules/conversation/sessions/sessions.service'

// 3. Relative imports
import { createRouterNode } from './nodes'
```

### Naming Conventions

```typescript
// camelCase for variables and functions
const userId = '123'
async function createSession() {}

// PascalCase for classes, interfaces, types, components
export class MessagesService {}
export interface CreateMessageDto {}
export type MessageState = {}
export function MessageList() {}

// UPPER_SNAKE_CASE for constants
const API_ENDPOINT = '/api/chat'
const MAX_LENGTH = 50
```

### Type Imports

```typescript
import type { MessageRole } from '@/shared/schemas/enums'
import type { Prisma } from '../../../../generated/prisma/index.js'
```

### File Naming

- **Backend**: `*.service.ts`, `*.controller.ts`, `*.module.ts`, `*.dto.ts`
- **Frontend**: `*.tsx` (components), `*.ts` (hooks/stores/services)
- **Shared types**: `*.types.ts` or `schemas/*.ts`

## Key Patterns

### Multi-Provider LLM Support

Model IDs support optional provider prefix: `openai:gpt-4o`, `google:gemini-pro`, or just `gpt-4o` (defaults to OpenAI).

### Frontend State Management

- **Zustand slices**: `stores/chat/slices/` has message, stream, toolCall subdirectories
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

### Backend Service Pattern

```typescript
@Injectable()
export class MessagesService {
  private readonly className = 'MessagesService'

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async create(dto: CreateMessageDto) {
    const result = await this.prisma.message.create({ ... })
    this.logger.logQueryResult(this.className, 'create', result)
    return result
  }
}
```

### Frontend API Layer

```typescript
// Type-safe service methods with Zod schemas
export const chatService = {
  getSessions: async (): Promise<Array<Session>> => {
    const { data } = await apiGet<GetSessionsResponse>('/api/sessions', {
      schema: GetSessionsResponseSchema,
    })
    return data.sessions
  },
}
```

## Key Files Reference

| Purpose            | Path                                                      |
| ------------------ | --------------------------------------------------------- |
| Tool registry      | `backend/src/agent/tools/config/unified-tools.config.ts`  |
| Session management | `backend/src/modules/conversation/sessions/`              |
| Chat streaming     | `backend/src/modules/conversation/chat/chat.service.ts`   |
| Store slices       | `frontend/src/stores/chat/slices/`                        |
| API layer          | `frontend/src/services/api.ts`                            |
| Zod schemas        | `backend/src/shared/schemas/` and `frontend/src/schemas/` |
| Logger service     | `backend/src/infrastructure/logger/logger.service.ts`     |

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

# Tavily Search (optional)
TAVILY_API_KEY=

# LangSmith tracing (optional)
LANGSMITH_API_KEY=
LANGSMITH_TRACING=false

# Supabase (optional)
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## Conventions

- **Validation**: Zod schemas in `shared/schemas/` (backend), `schemas/` (frontend)
- **Path aliases**: `@/*` maps to `src/*`
- **Styling**: Tailwind CSS v4 + Framer Motion + Lucide icons
- **React Compiler**: Enabled via babel-plugin-react-compiler
- **Message ordering**: Seq numbers per session (not timestamps)
- **Soft deletes**: Session status field (active/archived/deleted)
