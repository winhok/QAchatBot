import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { ChatOpenAI } from '@langchain/openai'
import Database from 'better-sqlite3'
import path from 'path'
import '@/app/utils/loadEnv'

// ============================================================================
// 工作流阶段定义
// ============================================================================

export type QAWorkflowStage = 'init' | 'test_points' | 'test_cases' | 'review' | 'completed'

// ============================================================================
// 阶段专用 Prompt
// ============================================================================

const TEST_POINTS_PROMPT = `你是一个专业的QA测试专家。请根据用户提供的PRD需求文档，进行**测试点分析**。

## 测试点定义
测试点是从需求中提取的需要验证的功能要点或验证项，描述"需要测试什么"而不是"如何测试"。

## 测试点分类
1. **功能验证点**: 核心业务功能、数据处理逻辑、业务规则验证、状态变更确认
2. **边界验证点**: 输入参数边界、数据量限制、时间范围约束、权限边界
3. **异常验证点**: 错误输入处理、系统异常响应、网络异常处理、资源不足处理
4. **集成验证点**: 模块间交互、外部系统集成、数据传递验证、接口调用验证

## 测试点提取规则
1. 首先识别需求中的主要功能点，然后在每个功能点下细分验证类型
2. 从需求中识别核心功能动作（CRUD操作、业务动作、状态变更）
3. 将需求中的业务规则转化为验证点
4. 识别数据验证点（格式、完整性、一致性）
5. 从需求中推导可能的异常情况

## 测试点ID命名规范
格式: TP_[模块简称]_[功能简称]_[序号]
- 001-099: 功能验证点
- 100-199: 边界验证点
- 200-299: 异常验证点
- 300-399: 集成验证点

## 优先级定义
- **P1（高优先级）**: 核心业务流程的关键功能验证点
- **P2（中优先级）**: 一般功能验证点、常规边界验证点
- **P3（低优先级）**: 辅助功能验证点、边缘异常验证点

## 输出格式

### [模块名称]模块

#### [功能点名称]功能

##### 功能验证点
- TP_XXX_001: [测试点名称]
  - 验证要点: [具体验证内容]
  - 优先级: P1/P2/P3

##### 边界验证点
- TP_XXX_101: [测试点名称]
  - 验证要点: [具体验证内容]
  - 优先级: P1/P2/P3

##### 异常验证点
- TP_XXX_201: [测试点名称]
  - 验证要点: [具体验证内容]
  - 优先级: P1/P2/P3

### 测试点统计
- 测试点总数: XX个
- 功能验证点: XX个
- 边界验证点: XX个
- 异常验证点: XX个`

const TEST_CASES_PROMPT = `你是一个专业的QA测试专家。请根据以下测试点，生成**CSV格式的测试用例**。

## CSV格式规范
表头: 编号,用例标题,级别,预置条件,操作步骤,测试预期内容

### 字段说明
1. **编号**: {需求名称}_YYYYMMDD0001 格式
2. **用例标题**: {功能模块}_{功能点}_{测试场景}
3. **级别**: P0/P1/P2/P3
   - P0（冒烟用例）: 必须占总用例数的30%左右
   - P1: 主要功能（40%）
   - P2: 一般功能（20%）
   - P3: 边缘功能（10%）
4. **预置条件**: 每个条件带序号且换行（1、条件一\\n2、条件二）
5. **操作步骤**: 每个步骤带序号且换行（1、步骤一\\n2、步骤二）
6. **测试预期内容**: 每个结果带序号且换行（1、结果一\\n2、结果二）

### 测试点到用例转换原则
- 一对多映射：一个测试点可能对应多个测试用例场景
- 场景细化：根据测试点的验证要点，细化为具体的测试场景
- 数据驱动：针对边界验证点，设计多组边界数据的测试用例
- 期望结果细分：复杂的期望结果应拆分为多个具体的验证点

### 必须应用的6种测试设计方法
1. 等价类划分
2. 边界值分析
3. 判定表驱动法
4. 场景法
5. 错误猜测法
6. 状态迁移法

## 输出格式

\`\`\`csv
编号,用例标题,级别,预置条件,操作步骤,测试预期内容
"需求名称_202XXXXX0001","功能模块_功能点_测试场景","P0","1、预置条件一
2、预置条件二","1、操作步骤一
2、操作步骤二
3、操作步骤三","1、预期结果一
2、预期结果二"
\`\`\`

### 用例统计
- 用例总数: XX个
- P0冒烟用例: XX个（占比XX%）
- P1主要功能: XX个（占比XX%）
- P2一般功能: XX个（占比XX%）
- P3边缘功能: XX个（占比XX%）`

const REVIEW_PROMPT = `你是一个专业的QA测试专家。请对以下测试用例进行**评审和优化**，输出最终版本。

## 评审维度
1. **需求覆盖度**: 功能覆盖度≥95%、业务规则覆盖度100%、异常场景覆盖度≥90%
2. **设计质量**: 等价类划分、边界值分析、场景完整性、用例独立性
3. **内容质量**: 用例标题简洁明确、测试步骤详细可操作、预期结果具体可验证
4. **结构规范**: 用例编号规范唯一、功能模块分类清晰

## 评审后优化要求
- 识别并补充遗漏的测试场景
- 优化用例描述使其更清晰
- 调整优先级确保P0占比30%
- 确保6种测试设计方法都有应用

## 输出格式

### 评审发现

#### 覆盖度分析
- 功能覆盖度: XX%
- 业务规则覆盖度: XX%
- 异常场景覆盖度: XX%

#### 设计方法应用检查
- 等价类划分: [已应用/需补充] - [说明]
- 边界值分析: [已应用/需补充] - [说明]
- 判定表驱动法: [已应用/需补充] - [说明]
- 场景法: [已应用/需补充] - [说明]
- 错误猜测法: [已应用/需补充] - [说明]
- 状态迁移法: [已应用/需补充] - [说明]

#### 优化点
[列出发现的问题和优化建议]

---

### 最终测试用例

\`\`\`csv
编号,用例标题,级别,预置条件,操作步骤,测试预期内容
...优化后的完整用例...
\`\`\`

### 最终统计
- 用例总数: XX个
- P0冒烟用例: XX个（占比XX%）
- P1主要功能: XX个（占比XX%）
- P2一般功能: XX个（占比XX%）
- P3边缘功能: XX个（占比XX%）`

// ============================================================================
// 阶段引导语
// ============================================================================

const STAGE_HEADERS: Record<QAWorkflowStage, string> = {
  init: '',
  test_points: '📋 **阶段 1/3：测试点分析**\n\n',
  test_cases: '📝 **阶段 2/3：用例生成**\n\n',
  review: '✅ **阶段 3/3：用例评审**\n\n',
  completed: '',
}

const STAGE_FOOTERS: Record<QAWorkflowStage, string> = {
  init: '',
  test_points: '\n\n---\n以上是分析的测试点，没问题请回复"继续"，需要调整请告诉我修改建议。',
  test_cases: '\n\n---\n以上是生成的测试用例，没问题请回复"继续"进入评审阶段，需要调整请说明。',
  review: '\n\n---\n测试用例生成完成！如需进一步调整请告诉我。',
  completed: '',
}

// ============================================================================
// State 定义
// ============================================================================

const QAChatbotState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (existing, newMessages) => [...existing, ...newMessages],
    default: () => [],
  }),
  workflowStage: Annotation<QAWorkflowStage>({
    reducer: (_, newValue) => newValue,
    default: () => 'init',
  }),
  prdContent: Annotation<string>({
    reducer: (_, newValue) => newValue,
    default: () => '',
  }),
  testPoints: Annotation<string>({
    reducer: (_, newValue) => newValue,
    default: () => '',
  }),
  testCases: Annotation<string>({
    reducer: (_, newValue) => newValue,
    default: () => '',
  }),
})

export type QAChatbotStateType = typeof QAChatbotState.State

// ============================================================================
// Model 实例
// ============================================================================

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  timeout: parseInt(process.env.OPENAI_TIMEOUT || '120000'),
  maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3'),
  temperature: 0.2,
  streaming: true,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
})

// ============================================================================
// 意图识别
// ============================================================================

type UserIntent = 'continue' | 'revise' | 'other'

function detectUserIntent(userMessage: string): UserIntent {
  const msg = userMessage.toLowerCase().trim()

  // 继续意图
  const continuePatterns = [
    '继续',
    '可以',
    '没问题',
    '好的',
    '好',
    'ok',
    '确认',
    '通过',
    '下一步',
    '进行下一步',
    '没有问题',
    '可以继续',
    '继续吧',
    'continue',
    'yes',
    'next',
    '行',
    '嗯',
    '是',
    '对',
  ]

  for (const pattern of continuePatterns) {
    if (msg === pattern || msg.startsWith(pattern + '，') || msg.startsWith(pattern + ',')) {
      return 'continue'
    }
  }

  // 修改意图 - 较长的回复通常是修改建议
  if (msg.length > 5) {
    return 'revise'
  }

  return 'other'
}

// ============================================================================
// 核心节点
// ============================================================================

async function qaChatbotNode(state: typeof QAChatbotState.State) {
  const lastMessage = state.messages[state.messages.length - 1]
  const userInput = lastMessage instanceof HumanMessage ? (lastMessage.content as string) : ''

  console.log('[QA Chatbot] Current stage:', state.workflowStage)
  console.log('[QA Chatbot] User input:', userInput.slice(0, 100) + '...')

  // 初始阶段：用户刚输入 PRD
  if (state.workflowStage === 'init') {
    return await handleInitStage(state, userInput)
  }

  // 检测用户意图
  const intent = detectUserIntent(userInput)
  console.log('[QA Chatbot] Detected intent:', intent)

  // 已完成阶段
  if (state.workflowStage === 'completed') {
    return await handleCompletedStage(state, userInput, intent)
  }

  // 根据意图处理
  if (intent === 'continue') {
    return await handleContinue(state)
  } else if (intent === 'revise') {
    return await handleRevise(state, userInput)
  } else {
    return await handleOther(state, userInput)
  }
}

// ============================================================================
// 阶段处理函数
// ============================================================================

async function handleInitStage(state: typeof QAChatbotState.State, prdContent: string) {
  console.log('[QA Chatbot] Starting test points analysis...')

  const systemPrompt = new SystemMessage(
    `你是一个专业的QA测试专家。用户将提供PRD需求文档，你需要进行测试点分析。

${TEST_POINTS_PROMPT}

重要：
1. 在输出开头加上：${STAGE_HEADERS.test_points}
2. 在输出结尾加上：${STAGE_FOOTERS.test_points}
3. 直接开始分析，不要有多余的开场白。`
  )

  const response = await model.invoke([systemPrompt, new HumanMessage(prdContent)])
  const content = typeof response.content === 'string' ? response.content : ''

  return {
    messages: [new AIMessage(content)],
    workflowStage: 'test_points' as QAWorkflowStage,
    prdContent: prdContent,
    testPoints: content,
  }
}

async function handleContinue(state: typeof QAChatbotState.State) {
  const currentStage = state.workflowStage

  if (currentStage === 'test_points') {
    // 进入用例生成阶段
    console.log('[QA Chatbot] Generating test cases...')

    const systemPrompt = new SystemMessage(
      `你是一个专业的QA测试专家。根据以下测试点生成测试用例。

${TEST_CASES_PROMPT}

重要：
1. 在输出开头加上：${STAGE_HEADERS.test_cases}
2. 在输出结尾加上：${STAGE_FOOTERS.test_cases}
3. 直接开始生成，不要有多余的开场白。

## 测试点

${state.testPoints}`
    )

    const response = await model.invoke([systemPrompt, new HumanMessage('请根据上述测试点生成测试用例')])
    const content = typeof response.content === 'string' ? response.content : ''

    return {
      messages: [new AIMessage(content)],
      workflowStage: 'test_cases' as QAWorkflowStage,
      testCases: content,
    }
  } else if (currentStage === 'test_cases') {
    // 进入评审阶段
    console.log('[QA Chatbot] Reviewing test cases...')

    const systemPrompt = new SystemMessage(
      `你是一个专业的QA测试专家。请对测试用例进行评审和优化。

${REVIEW_PROMPT}

重要：
1. 在输出开头加上：${STAGE_HEADERS.review}
2. 在输出结尾加上：${STAGE_FOOTERS.review}
3. 直接开始评审，不要有多余的开场白。

## 原始需求

${state.prdContent}

## 测试点

${state.testPoints}

## 待评审用例

${state.testCases}`
    )

    const response = await model.invoke([systemPrompt, new HumanMessage('请对上述测试用例进行评审和优化')])
    const content = typeof response.content === 'string' ? response.content : ''

    return {
      messages: [new AIMessage(content)],
      workflowStage: 'completed' as QAWorkflowStage,
      testCases: content,
    }
  }

  return { messages: [] }
}

async function handleRevise(state: typeof QAChatbotState.State, feedback: string) {
  const currentStage = state.workflowStage
  console.log('[QA Chatbot] Revising', currentStage, 'with feedback:', feedback.slice(0, 100))

  let systemPrompt: SystemMessage
  let stagePrompt: string
  let stageHeader: string
  let stageFooter: string

  if (currentStage === 'test_points') {
    stagePrompt = TEST_POINTS_PROMPT
    stageHeader = STAGE_HEADERS.test_points
    stageFooter = STAGE_FOOTERS.test_points

    systemPrompt = new SystemMessage(
      `你是一个专业的QA测试专家。用户对之前的测试点分析有修改意见，请根据意见重新分析。

${stagePrompt}

## 原始需求

${state.prdContent}

## 之前的测试点分析

${state.testPoints}

重要：
1. 在输出开头加上：${stageHeader}
2. 在输出结尾加上：${stageFooter}
3. 根据用户意见调整后，输出完整的测试点分析（不是只输出修改部分）。`
    )
  } else if (currentStage === 'test_cases') {
    stagePrompt = TEST_CASES_PROMPT
    stageHeader = STAGE_HEADERS.test_cases
    stageFooter = STAGE_FOOTERS.test_cases

    systemPrompt = new SystemMessage(
      `你是一个专业的QA测试专家。用户对之前的测试用例有修改意见，请根据意见重新生成。

${stagePrompt}

## 测试点

${state.testPoints}

## 之前的测试用例

${state.testCases}

重要：
1. 在输出开头加上：${stageHeader}
2. 在输出结尾加上：${stageFooter}
3. 根据用户意见调整后，输出完整的测试用例（不是只输出修改部分）。`
    )
  } else if (currentStage === 'completed') {
    // 完成后的调整
    stageHeader = '📝 **调整测试用例**\n\n'
    stageFooter = '\n\n---\n已根据您的意见调整，如需继续修改请告诉我。'

    systemPrompt = new SystemMessage(
      `你是一个专业的QA测试专家。用户对最终测试用例有调整意见，请根据意见修改。

${REVIEW_PROMPT}

## 原始需求

${state.prdContent}

## 测试点

${state.testPoints}

## 当前测试用例

${state.testCases}

重要：
1. 在输出开头加上：${stageHeader}
2. 在输出结尾加上：${stageFooter}
3. 根据用户意见调整后，输出完整的测试用例。`
    )
  } else {
    return { messages: [] }
  }

  const response = await model.invoke([systemPrompt, new HumanMessage(`用户修改意见：${feedback}`)])
  const content = typeof response.content === 'string' ? response.content : ''

  const updates: Partial<typeof QAChatbotState.State> = {
    messages: [new AIMessage(content)],
  }

  if (currentStage === 'test_points') {
    updates.testPoints = content
  } else if (currentStage === 'test_cases' || currentStage === 'completed') {
    updates.testCases = content
  }

  return updates
}

async function handleCompletedStage(state: typeof QAChatbotState.State, userInput: string, intent: UserIntent) {
  if (intent === 'revise') {
    return await handleRevise(state, userInput)
  }

  // 其他问题，作为普通对话处理
  const systemPrompt = new SystemMessage(
    `你是一个专业的QA测试专家。测试用例已经生成完成。用户可能有其他问题或需要进一步调整。

## 当前测试用例

${state.testCases}

请根据用户的问题进行回答或调整。如果用户想修改用例，请输出完整的修改后用例。`
  )

  const response = await model.invoke([systemPrompt, new HumanMessage(userInput)])
  const content = typeof response.content === 'string' ? response.content : ''

  return {
    messages: [new AIMessage(content)],
  }
}

async function handleOther(state: typeof QAChatbotState.State, userInput: string) {
  // 处理其他问题
  const currentStage = state.workflowStage
  const stageInfo =
    currentStage === 'test_points'
      ? '当前在测试点分析阶段'
      : currentStage === 'test_cases'
        ? '当前在用例生成阶段'
        : currentStage === 'review'
          ? '当前在用例评审阶段'
          : '测试用例已完成'

  const systemPrompt = new SystemMessage(
    `你是一个专业的QA测试专家。${stageInfo}。

用户可能在询问问题或提供反馈。请根据上下文回答。

如果用户的问题像是对当前输出的修改建议，请按修改建议处理并重新输出该阶段的完整内容。
如果用户是在问其他问题，正常回答即可。

回答后，提醒用户可以回复"继续"进入下一阶段，或者提供修改建议。`
  )

  const response = await model.invoke([systemPrompt, new HumanMessage(userInput)])
  const content = typeof response.content === 'string' ? response.content : ''

  return {
    messages: [new AIMessage(content)],
  }
}

// ============================================================================
// 构建 Graph
// ============================================================================

const dbPath = path.resolve(process.cwd(), 'qa_chatbot_history.db')
export const qaChatbotDb = new Database(dbPath)

const workflow = new StateGraph(QAChatbotState).addNode('qa_chatbot', qaChatbotNode).addEdge(START, 'qa_chatbot').addEdge('qa_chatbot', END)

let checkpointer: SqliteSaver
let app: ReturnType<typeof workflow.compile>

export const getQaChatbotCheckpointer = () => {
  if (!checkpointer) {
    console.log('Initializing QA chatbot checkpointer for', dbPath)
    try {
      checkpointer = new SqliteSaver(qaChatbotDb)
      console.log('QA chatbot checkpointer initialized')
    } catch (error) {
      console.error('Error initializing QA chatbot checkpointer:', error)
      throw error
    }
  }
  return checkpointer
}

async function initializeQaChatbotApp() {
  if (!checkpointer) {
    checkpointer = getQaChatbotCheckpointer()
  }
  if (!app) {
    app = workflow.compile({ checkpointer })
  }
  return app
}

initializeQaChatbotApp()

export const getQaChatbotApp = async () => {
  return await initializeQaChatbotApp()
}

export { QAChatbotState }
