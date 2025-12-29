# CLAUDE.md - Backend

This file provides guidance to Claude Code when working with the backend codebase.

## Project Overview

QA ChatBot Backend - NestJS + LangGraph based AI Agent service for intelligent Q&A and test case generation from PRD documents.

## Tech Stack

- **Framework**: NestJS 11
- **AI/LLM**: LangGraph + LangChain + OpenAI
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod
- **Logging**: Pino (nestjs-pino)
- **Testing**: Jest

## Development Commands

```bash
# Install dependencies
pnpm install

# Database setup
npx prisma migrate dev    # Run migrations
npx prisma generate       # Generate Prisma client

# Development
pnpm run start:dev        # Watch mode
pnpm run start:debug      # Debug mode

# Build & Production
pnpm run build
pnpm run start:prod

# Testing
pnpm test                 # Run all unit tests
pnpm test:watch           # Watch mode
pnpm test -- --testPathPattern=sessions  # Run single test file
pnpm test:e2e             # E2E tests (in test/ directory)
pnpm test:cov             # Coverage report

# Linting & Formatting
pnpm run lint
pnpm run format
```

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
├── config/                    # Configuration
│   ├── app.config.ts          # App settings (port, cors)
│   ├── database.config.ts     # Database connection
│   └── llm.config.ts          # LLM provider settings
├── common/                    # Shared utilities
│   ├── middleware/            # HTTP middleware (logging)
│   ├── pipes/                 # Validation pipes (Zod)
│   └── context/               # Request context service
├── shared/schemas/            # Zod schema definitions
│   ├── models.ts              # Data model schemas
│   ├── requests.ts            # API request schemas
│   ├── enums.ts               # Enum definitions
│   └── content-blocks.ts      # Content block types
├── infrastructure/            # Technical services
│   ├── database/              # Prisma service
│   └── logger/                # Pino logger service
├── agent/                     # AI Agent module
│   ├── core/interfaces/       # Agent interfaces
│   ├── tools/                 # Tool system
│   │   ├── tools.registry.ts  # Tool registration
│   │   └── builtin/           # Built-in tools
│   ├── prompts/               # Prompt templates
│   │   ├── persona.ts         # Agent persona
│   │   ├── chatbot.prompts.ts # Chatbot prompts
│   │   └── qa/                # QA workflow prompts
│   └── graphs/                # LangGraph workflows
│       ├── chatbot/           # General conversation
│       └── qa-chatbot/        # Test case generation
└── modules/                   # Business modules
    ├── conversation/          # Chat functionality
    │   ├── sessions/          # Session CRUD
    │   ├── messages/          # Message handling
    │   └── chat/              # Chat streaming (SSE)
    └── analytics/             # Analytics features
        ├── feedback/          # User feedback
        ├── export/            # Data export
        └── search/            # Search functionality
```

## Database Schema

### Prisma Models (`prisma/schema.prisma`)

```prisma
Session {
  id, name, type, status, createdAt, updatedAt, lastMessageAt
  messages[]
}

Message {
  id, sessionId, seq, role, content, metadata, createdAt
  toolCalls[]
}

ToolCall {
  id, messageId, seq, toolCallId, toolName, args, result, status, duration
}
```

### Common Commands

```bash
npx prisma migrate dev --name <migration_name>  # Create migration
npx prisma db push                              # Push schema (dev only)
npx prisma studio                               # Open Prisma Studio
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Stream chat response (SSE) |
| GET | `/api/chat?session_id=` | Get chat history |
| GET | `/api/sessions` | List all sessions |
| POST | `/api/sessions` | Create session |
| GET | `/api/sessions/:id` | Get session |
| PATCH | `/api/sessions/:id` | Update session |
| DELETE | `/api/sessions/:id` | Delete session |

## SSE Event Types

Chat streaming uses Server-Sent Events with these types:

```typescript
type SSEEventType =
  | 'chunk'       // Text content fragment
  | 'tool_start'  // Tool invocation started { tool_call_id, name, input }
  | 'tool_end'    // Tool completed { output, duration }
  | 'tool_error'  // Tool failed
  | 'end'         // Stream complete { session_id }
  | 'error';      // Server error
```

## Environment Variables

Create `.env` file:

```env
# Server
PORT=3000
CORS_ORIGINS=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/qachatbot

# LLM Provider
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_DEFAULT_MODEL=gpt-4o
```

## Adding New Agent Tools

1. Create tool file in `src/agent/tools/builtin/`:

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

2. Export from `src/agent/tools/builtin/index.ts`

3. Register in `src/agent/tools/tools.registry.ts`:

```typescript
import { myTool } from './builtin';
// In constructor:
this.register(myTool);
```

## Adding New LangGraph Workflow

Create directory `src/agent/graphs/<name>/`:

```
<name>/
├── types.ts              # Type definitions (stages, intents, node names)
├── state.ts              # LangGraph Annotation state
├── nodes.ts              # Node handler functions
├── edges.ts              # Conditional routing logic
├── graph.ts              # Graph compilation
├── <name>.service.ts     # NestJS service wrapper
└── index.ts              # Exports
```

### QA-Chatbot Workflow Stages

```
init → test_points → test_cases → review → completed
```

## Key Patterns

### Validation with Zod

```typescript
// Define schema in shared/schemas/
export const CreateSessionSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['normal', 'qa']).default('normal'),
});

// Use in controller
@Post()
create(@Body(new ZodValidationPipe(CreateSessionSchema)) dto: CreateSessionDto) {}
```

### Service Layer Pattern

```typescript
@Injectable()
export class MyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}
}
```

### Streaming Response (SSE)

```typescript
@Sse('stream')
stream(): Observable<MessageEvent> {
  return new Observable((subscriber) => {
    subscriber.next({ data: { type: 'chunk', content: 'Hello' } });
    subscriber.complete();
  });
}
```

## Testing

### Unit Tests

```bash
pnpm test                                    # Run all
pnpm test -- --testPathPattern=sessions      # Single file
pnpm test -- --watch                         # Watch mode
```

### E2E Tests

```bash
pnpm test:e2e
```

Test files location:
- Unit tests: `src/**/*.spec.ts`
- E2E tests: `test/*.e2e-spec.ts`

## Common Issues

### Prisma Client Not Generated

```bash
npx prisma generate
```

### Database Connection Issues

Check `DATABASE_URL` in `.env` and ensure PostgreSQL is running.

### LLM API Errors

Verify `OPENAI_API_KEY` and `OPENAI_BASE_URL` are correctly set.
