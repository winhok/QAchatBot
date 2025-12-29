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
pnpm test                 # Run tests
pnpm test:watch           # Watch mode
pnpm test:e2e             # E2E tests

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
pnpm dev

# Build
pnpm build

# Testing
pnpm test

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

- **`routes/`** - TanStack Router file-based routing
- **`components/`** - React components with Shadcn UI
- **`stores/`** - Zustand state management
- **`hooks/`** - Custom React hooks
- **`services/`** - API service layer
- **`schemas/`** - Zod validation schemas
- **`providers/`** - React context providers

### Data Flow

1. Frontend sends chat requests to `/api/chat` (SSE streaming)
2. Backend routes to appropriate LangGraph agent
3. Agent processes with tool calls and state transitions
4. Responses streamed back via Server-Sent Events
5. Chat history persisted via Prisma to PostgreSQL

### Database Schema (Prisma)

- **Session** - Chat sessions with name, type, status
- **Message** - Messages with role, content, metadata, linked to sessions
- **ToolCall** - Tool invocations with args, result, status, linked to messages

## Key Conventions

- **Validation**: Zod schemas in `shared/schemas/` (backend) and `src/schemas/` (frontend)
- **State Management**: Zustand for frontend global state
- **Routing**: TanStack Router with file-based routes
- **Styling**: Tailwind CSS v4
- **Agent Tools**: Register in `backend/src/agent/tools/tools.registry.ts`
- **New LangGraph Workflow**: Create in `backend/src/agent/graphs/<name>/` with state.ts, nodes.ts, edges.ts, graph.ts pattern

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
