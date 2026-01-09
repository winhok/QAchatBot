# QAchatBot Backend

基于 **NestJS + LangGraph** 的智能问答系统后端，支持多种 AI Agent 工作流。

## 技术栈

| 类别     | 技术                  |
| -------- | --------------------- |
| 框架     | NestJS v11+           |
| AI Agent | LangGraph + LangChain |
| 数据库   | PostgreSQL + Prisma   |
| 验证     | Zod                   |
| 日志     | Pino                  |

## 项目架构

```
src/
├── main.ts                      # 应用入口
├── app.module.ts
│
├── config/                      # 配置管理
│   ├── app.config.ts            # 应用配置 (端口、CORS)
│   ├── database.config.ts       # 数据库配置
│   └── llm.config.ts            # LLM 配置 (API Key, Model)
│
├── common/                      # 公共模块
│   ├── common.module.ts
│   ├── context/                 # 请求上下文
│   ├── middleware/              # 中间件 (日志)
│   └── pipes/                   # 管道 (Zod 验证)
│
├── shared/                      # 跨模块共享
│   └── schemas/                 # Zod Schema 定义
│       ├── enums.ts
│       ├── requests.ts
│       └── models.ts
│
├── infrastructure/              # 基础设施层
│   ├── database/                # Prisma 数据库服务
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── logger/                  # Pino 日志服务
│
├── agent/                       # AI Agent 模块
│   ├── agent.module.ts
│   ├── core/                    # Agent 核心接口
│   │   └── interfaces/
│   ├── tools/                   # 工具注册与内置工具
│   │   ├── tools.registry.ts    # 工具注册中心
│   │   └── builtin/             # 内置工具
│   │       ├── current-time.tool.ts
│   │       ├── calculator.tool.ts
│   │       └── read-file.tool.ts
│   ├── prompts/                 # 提示词管理
│   │   ├── persona.ts           # 人格配置
│   │   ├── chatbot.prompts.ts   # 通用聊天提示词
│   │   └── qa/                  # QA 专用提示词
│   └── graphs/                  # LangGraph 工作流
│       ├── chatbot/             # 通用聊天 Agent
│       │   └── chatbot.service.ts
│       └── qa-chatbot/          # QA 测试用例生成 Agent
│           ├── state.ts         # 状态定义
│           ├── nodes.ts         # 节点函数
│           ├── edges.ts         # 边条件
│           ├── graph.ts         # 图编译
│           └── qa-chatbot.service.ts
│
└── modules/                     # 业务模块 (按领域分组)
    ├── conversation/            # 对话领域
    │   ├── conversation.module.ts
    │   ├── sessions/            # 会话管理
    │   ├── messages/            # 消息管理
    │   └── chat/                # 聊天接口
    └── analytics/               # 分析领域
        ├── analytics.module.ts
        ├── feedback/            # 用户反馈
        ├── export/              # 数据导出
        └── search/              # 搜索功能
```

## Agent 工作流

### Chatbot (通用聊天)

ReAct 模式的通用对话 Agent，支持工具调用。

```
START → chatbot → [tools] → chatbot → END
```

### QA-Chatbot (测试用例生成)

多阶段状态机工作流，用于从 PRD 生成测试用例：

```
init → test_points → test_cases → review → completed
```

| 阶段        | 说明          |
| ----------- | ------------- |
| init        | 接收 PRD 文档 |
| test_points | 分析测试点    |
| test_cases  | 生成 CSV 用例 |
| review      | 评审优化      |
| completed   | 完成          |

## API 端点

### 聊天

| 方法 | 路径                    | 说明           | 状态      |
| ---- | ----------------------- | -------------- | --------- |
| POST | `/api/chat`             | 流式聊天 (SSE) | ✅ 使用中 |
| GET  | `/api/chat?session_id=` | 获取聊天历史   | ✅ 使用中 |

### 会话

| 方法   | 路径                | 说明     | 状态      |
| ------ | ------------------- | -------- | --------- |
| GET    | `/api/sessions`     | 会话列表 | ✅ 使用中 |
| POST   | `/api/sessions`     | 创建会话 | ✅ 使用中 |
| GET    | `/api/sessions/:id` | 会话详情 | ⚪ 未使用 |
| PATCH  | `/api/sessions/:id` | 更新会话 | ✅ 使用中 |
| DELETE | `/api/sessions/:id` | 删除会话 | ✅ 使用中 |

## 环境配置

创建 `.env` 文件：

```env
# 服务
PORT=3000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/qachatbot?schema=public"

# LLM
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_DEFAULT_MODEL=gpt-4o
OPENAI_TIMEOUT=120000

# 代理 (可选)
# HTTPS_PROXY=http://127.0.0.1:7890
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 数据库迁移
npx prisma migrate dev

# 开发模式
pnpm run start:dev

# 构建
pnpm run build
```

## 扩展指南

### 添加新工具

在 `src/agent/tools/builtin/` 创建工具文件：

```typescript
// my-tool.tool.ts
import { z } from 'zod'
import type { ToolDefinition } from '../tools.registry'

export const myTool: ToolDefinition = {
  name: 'my_tool',
  description: '工具描述',
  schema: z.object({
    param: z.string().describe('参数说明'),
  }),
  handler: async ({ param }) => {
    return `结果: ${param}`
  },
}
```

在 `tools.registry.ts` 注册：

```typescript
this.register(myTool)
```

### 添加新 Agent 工作流

在 `src/agent/graphs/` 创建目录：

```
src/agent/graphs/my-agent/
├── index.ts
├── types.ts          # 类型定义
├── state.ts          # LangGraph State
├── nodes.ts          # 节点函数
├── edges.ts          # 条件边
├── graph.ts          # 图编译
└── my-agent.service.ts
```

### 添加新业务模块

```bash
# 在对应领域下创建
src/modules/conversation/new-feature/
src/modules/analytics/new-feature/

# 或创建新领域
src/modules/research/
```

## 开源协议

UNLICENSED
