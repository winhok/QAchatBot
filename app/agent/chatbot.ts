import { AIMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { ProxyAgent, setGlobalDispatcher } from 'undici'
import '@/app/utils/loadEnv'
import './config/tools.register'
import db from './db'
import { getAllTools } from './tools'
import { getModelName, DEFAULT_MODEL_ID } from '@/app/config/models'
import { buildChatbotSystemPrompt, type PersonaConfig } from './prompts'

// 配置全局代理
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY
if (proxyUrl) {
  console.log('[PROXY] Using proxy:', proxyUrl)
  setGlobalDispatcher(new ProxyAgent(proxyUrl))
}

// Debug: 拦截 fetch 打印请求
const originalFetch = globalThis.fetch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
  console.log('[FETCH REQUEST]', init?.method || 'GET', url)
  try {
    const res = await originalFetch(input, init)
    console.log('[FETCH RESPONSE]', res.status, res.statusText)
    return res
  } catch (error) {
    console.error('[FETCH ERROR]', error)
    throw error
  }
}

const tools = getAllTools()

// 获取工具名称列表用于系统指令
const toolNames = tools.map(t => t.name)

// 当前使用的人格配置（可通过 API 扩展支持自定义）
let currentPersona: Partial<PersonaConfig> = {}

/**
 * 设置 chatbot 人格配置
 */
export function setPersona(persona: Partial<PersonaConfig>) {
  currentPersona = persona
  console.log('[chatbot] Persona updated:', persona.name || 'default')
}

/**
 * 获取当前系统指令
 */
function getSystemMessage(): SystemMessage {
  const prompt = buildChatbotSystemPrompt(currentPersona, toolNames)
  return new SystemMessage(prompt)
}

/**
 * 根据模型 ID 创建 ChatOpenAI 实例
 * 所有模型使用同一个中转站 API
 */
function createModelInstance(modelId: string) {
  const modelName = getModelName(modelId)

  console.log(`[chatbot] Creating model instance: ${modelName}`)
  console.log(`[chatbot] Base URL: ${process.env.OPENAI_BASE_URL}`)

  return new ChatOpenAI({
    model: modelName,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    streaming: true,
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '120000'),
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
  })
}

/**
 * 创建带有工具绑定的模型
 */
function createBoundModel(modelId: string) {
  const baseModel = createModelInstance(modelId)
  return baseModel.bindTools(tools)
}

// 模型实例缓存，避免重复创建
const modelCache = new Map<string, ReturnType<typeof createBoundModel>>()

function getBoundModel(modelId: string) {
  if (!modelCache.has(modelId)) {
    modelCache.set(modelId, createBoundModel(modelId))
  }
  return modelCache.get(modelId)!
}

/**
 * 创建 chatbot 节点函数
 * 自动在对话开始时注入 SystemMessage
 */
function createChatbotNode(modelId: string) {
  return async function chatbotNode(state: typeof MessagesAnnotation.State) {
    const model = getBoundModel(modelId)

    // 准备消息列表，确保 SystemMessage 在最前面
    let messagesToSend = state.messages

    // 检查是否已有 SystemMessage（避免重复注入）
    const hasSystemMessage = state.messages.some(msg => msg._getType() === 'system')

    if (!hasSystemMessage) {
      // 首次对话，注入系统指令
      const systemMessage = getSystemMessage()
      messagesToSend = [systemMessage, ...state.messages]
      console.log('[chatbotNode] Injected SystemMessage for new conversation')
    }

    console.log('[chatbotNode] Invoking model with', messagesToSend.length, 'messages')

    try {
      const res = await model.invoke(messagesToSend)
      console.log('[chatbotNode] Model response received')
      return { messages: [res] }
    } catch (error) {
      console.error('[chatbotNode] Model invoke error:', error)
      throw error
    }
  }
}

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return 'tools'
  }
  return END
}

const toolNode = new ToolNode(tools)

// Checkpointer 单例
let checkpointer: SqliteSaver

export const getCheckpointer = () => {
  if (!checkpointer) {
    console.log('Initializing checkpointer')
    try {
      checkpointer = new SqliteSaver(db)
      console.log('Checkpointer initialized')
    } catch (error) {
      console.error('Error initializing checkpointer:', error)
      throw error
    }
  }
  return checkpointer
}

// 编译后的 app 缓存，按模型 ID 缓存
const appCache = new Map<string, ReturnType<typeof compileWorkflow>>()

function compileWorkflow(modelId: string) {
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('chatbot', createChatbotNode(modelId))
    .addNode('tools', toolNode)
    .addEdge(START, 'chatbot')
    .addConditionalEdges('chatbot', shouldContinue, ['tools', END])
    .addEdge('tools', 'chatbot')

  return workflow.compile({ checkpointer: getCheckpointer() })
}

/**
 * 获取指定模型的 app 实例
 */
const getApp = async (modelId: string = DEFAULT_MODEL_ID) => {
  if (!appCache.has(modelId)) {
    console.log(`[chatbot] Creating app for model: ${modelId}`)
    appCache.set(modelId, compileWorkflow(modelId))
  }
  return appCache.get(modelId)!
}

export { checkpointer, getApp }
