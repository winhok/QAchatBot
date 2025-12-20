import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { Annotation, END, interrupt, START, StateGraph } from '@langchain/langgraph'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { ChatOpenAI } from '@langchain/openai'
import Database from 'better-sqlite3'
import path from 'path'
import '../utils/loadEnv'

// ============================================================================
// 阶段定义
// ============================================================================

export type WorkflowStage = 'test_points' | 'test_cases' | 'review' | 'completed'

export const STAGE_INFO: Record<WorkflowStage, { title: string; description: string; order: number }> = {
  test_points: { title: '测试点分析', description: '从 PRD 需求中提取测试点', order: 1 },
  test_cases: { title: '用例生成', description: '基于测试点生成 CSV 格式测试用例', order: 2 },
  review: { title: '用例评审优化', description: '评审并优化测试用例，输出最终版本', order: 3 },
  completed: { title: '完成', description: '工作流已完成', order: 4 },
}

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
- 异常验证点: XX个

请直接开始分析，不要有多余的开场白。`

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
- P3边缘功能: XX个（占比XX%）

请直接生成用例，不要有多余的开场白。`

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
- P3边缘功能: XX个（占比XX%）

请直接开始评审，不要有多余的开场白。`

// ============================================================================
// 自定义 State
// ============================================================================

const QAWorkflowState = Annotation.Root({
  // 用户原始输入
  prdContent: Annotation<string>({
    reducer: (_, newValue) => newValue,
    default: () => '',
  }),
  // 第一阶段输出：测试点
  testPoints: Annotation<string>({
    reducer: (_, newValue) => newValue,
    default: () => '',
  }),
  // 第二阶段输出：测试用例初稿
  testCasesDraft: Annotation<string>({
    reducer: (_, newValue) => newValue,
    default: () => '',
  }),
  // 第三阶段输出：最终测试用例
  testCasesFinal: Annotation<string>({
    reducer: (_, newValue) => newValue,
    default: () => '',
  }),
  // 当前阶段
  currentStage: Annotation<WorkflowStage>({
    reducer: (_, newValue) => newValue,
    default: () => 'test_points',
  }),
  // 用户反馈（用于修改）
  userFeedback: Annotation<string | null>({
    reducer: (_, newValue) => newValue,
    default: () => null,
  }),
  // 保留 messages 用于历史记录
  messages: Annotation<(HumanMessage | AIMessage)[]>({
    reducer: (existing, newMessages) => [...existing, ...newMessages],
    default: () => [],
  }),
})

export type QAWorkflowStateType = typeof QAWorkflowState.State

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
// Workflow 节点
// ============================================================================

async function analyzeTestPointsNode(state: typeof QAWorkflowState.State) {
  console.log('[QA Workflow] Stage 1: Analyzing test points...')

  // 构建消息
  let prompt = TEST_POINTS_PROMPT + '\n\n## 用户需求\n\n' + state.prdContent

  // 如果有用户反馈，附加到 prompt
  if (state.userFeedback) {
    prompt += '\n\n## 用户修改意见\n\n' + state.userFeedback + '\n\n请根据以上修改意见重新分析测试点。'
  }

  const response = await model.invoke([new HumanMessage(prompt)])
  const content = typeof response.content === 'string' ? response.content : ''

  return {
    testPoints: content,
    currentStage: 'test_points' as WorkflowStage,
    userFeedback: null,
    messages: [new AIMessage(content)],
  }
}

async function generateTestCasesNode(state: typeof QAWorkflowState.State) {
  console.log('[QA Workflow] Stage 2: Generating test cases...')

  let prompt = TEST_CASES_PROMPT + '\n\n## 测试点\n\n' + state.testPoints

  if (state.userFeedback) {
    prompt += '\n\n## 用户修改意见\n\n' + state.userFeedback + '\n\n请根据以上修改意见重新生成用例。'
  }

  const response = await model.invoke([new HumanMessage(prompt)])
  const content = typeof response.content === 'string' ? response.content : ''

  return {
    testCasesDraft: content,
    currentStage: 'test_cases' as WorkflowStage,
    userFeedback: null,
    messages: [new AIMessage(content)],
  }
}

async function reviewTestCasesNode(state: typeof QAWorkflowState.State) {
  console.log('[QA Workflow] Stage 3: Reviewing and optimizing...')

  let prompt =
    REVIEW_PROMPT + '\n\n## 原始需求\n\n' + state.prdContent + '\n\n## 测试点\n\n' + state.testPoints + '\n\n## 待评审用例\n\n' + state.testCasesDraft

  if (state.userFeedback) {
    prompt += '\n\n## 用户修改意见\n\n' + state.userFeedback + '\n\n请根据以上修改意见重新评审优化。'
  }

  const response = await model.invoke([new HumanMessage(prompt)])
  const content = typeof response.content === 'string' ? response.content : ''

  return {
    testCasesFinal: content,
    currentStage: 'review' as WorkflowStage,
    userFeedback: null,
    messages: [new AIMessage(content)],
  }
}

// ============================================================================
// Interrupt 节点（暂停等待用户确认）
// ============================================================================

function waitForTestPointsApproval(state: typeof QAWorkflowState.State) {
  console.log('[QA Workflow] Waiting for test points approval...')

  // 使用 interrupt 暂停，返回当前阶段信息给前端
  const interruptData = interrupt({
    stage: 'test_points',
    stageInfo: STAGE_INFO.test_points,
    output: state.testPoints,
    nextStage: 'test_cases',
  })

  // 如果用户提供了反馈，返回它
  if (interruptData && typeof interruptData === 'object' && 'feedback' in interruptData) {
    return { userFeedback: interruptData.feedback as string }
  }

  return {}
}

function waitForTestCasesApproval(state: typeof QAWorkflowState.State) {
  console.log('[QA Workflow] Waiting for test cases approval...')

  const interruptData = interrupt({
    stage: 'test_cases',
    stageInfo: STAGE_INFO.test_cases,
    output: state.testCasesDraft,
    nextStage: 'review',
  })

  if (interruptData && typeof interruptData === 'object' && 'feedback' in interruptData) {
    return { userFeedback: interruptData.feedback as string }
  }

  return {}
}

function waitForReviewApproval(state: typeof QAWorkflowState.State) {
  console.log('[QA Workflow] Waiting for review approval...')

  const interruptData = interrupt({
    stage: 'review',
    stageInfo: STAGE_INFO.review,
    output: state.testCasesFinal,
    nextStage: 'completed',
  })

  if (interruptData && typeof interruptData === 'object' && 'feedback' in interruptData) {
    return { userFeedback: interruptData.feedback as string }
  }

  return { currentStage: 'completed' as WorkflowStage }
}

// ============================================================================
// 条件路由
// ============================================================================

function routeAfterTestPointsApproval(state: typeof QAWorkflowState.State) {
  // 如果有用户反馈，重新生成测试点
  if (state.userFeedback) {
    return 'analyze_test_points'
  }
  // 否则继续下一阶段
  return 'generate_test_cases'
}

function routeAfterTestCasesApproval(state: typeof QAWorkflowState.State) {
  if (state.userFeedback) {
    return 'generate_test_cases'
  }
  return 'review_test_cases'
}

function routeAfterReviewApproval(state: typeof QAWorkflowState.State) {
  if (state.userFeedback) {
    return 'review_test_cases'
  }
  return END
}

// ============================================================================
// 构建 Workflow
// ============================================================================

const dbPath = path.resolve(process.cwd(), 'qa_workflow_history.db')
export const qaWorkflowDb = new Database(dbPath)

const workflow = new StateGraph(QAWorkflowState)
  // 添加节点
  .addNode('analyze_test_points', analyzeTestPointsNode)
  .addNode('wait_test_points_approval', waitForTestPointsApproval)
  .addNode('generate_test_cases', generateTestCasesNode)
  .addNode('wait_test_cases_approval', waitForTestCasesApproval)
  .addNode('review_test_cases', reviewTestCasesNode)
  .addNode('wait_review_approval', waitForReviewApproval)
  // 添加边
  .addEdge(START, 'analyze_test_points')
  .addEdge('analyze_test_points', 'wait_test_points_approval')
  .addConditionalEdges('wait_test_points_approval', routeAfterTestPointsApproval, ['analyze_test_points', 'generate_test_cases'])
  .addEdge('generate_test_cases', 'wait_test_cases_approval')
  .addConditionalEdges('wait_test_cases_approval', routeAfterTestCasesApproval, ['generate_test_cases', 'review_test_cases'])
  .addEdge('review_test_cases', 'wait_review_approval')
  .addConditionalEdges('wait_review_approval', routeAfterReviewApproval, ['review_test_cases', END])

let checkpointer: SqliteSaver
let app: ReturnType<typeof workflow.compile>

export const getQaWorkflowCheckpointer = () => {
  if (!checkpointer) {
    console.log('Initializing QA workflow checkpointer for', dbPath)
    try {
      checkpointer = new SqliteSaver(qaWorkflowDb)
      console.log('QA workflow checkpointer initialized')
    } catch (error) {
      console.error('Error initializing QA workflow checkpointer:', error)
      throw error
    }
  }
  return checkpointer
}

async function initializeQaWorkflowApp() {
  if (!checkpointer) {
    checkpointer = getQaWorkflowCheckpointer()
  }
  if (!app) {
    app = workflow.compile({ checkpointer })
  }
  return app
}

initializeQaWorkflowApp()

export const getQaWorkflowApp = async () => {
  return await initializeQaWorkflowApp()
}

// 导出类型供其他模块使用
export { QAWorkflowState }
