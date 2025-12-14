import { AIMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { ProxyAgent, setGlobalDispatcher } from 'undici'
import '../utils/loadEnv'
import './config/tools.register'
import db from './db'
import { getAllTools } from './tools'

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

// Debug: 打印配置
console.log('=== Chatbot Config ===')
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL)
console.log('OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL)
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY?.slice(0, 10) + '...')
console.log('OPENAI_TIMEOUT:', process.env.OPENAI_TIMEOUT)
console.log('======================')

const baseModel = new ChatOpenAI({
  model: process.env.OPENAI_MODEL as string,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
  streaming: true,
  timeout: parseInt(process.env.OPENAI_TIMEOUT || '120000'),
  verbose: true,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
})

// 使用bindTools将工具绑定到模型
const model = baseModel.bindTools(tools)

async function chatbotNode(state: typeof MessagesAnnotation.State) {
  console.log('[chatbotNode] Invoking model with', state.messages.length, 'messages')
  try {
    const res = await model.invoke(state.messages)
    console.log('[chatbotNode] Model response received')
    return { messages: [res] }
  } catch (error) {
    console.error('[chatbotNode] Model invoke error:', error)
    throw error
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

const workflow = new StateGraph(MessagesAnnotation)
  .addNode('chatbot', chatbotNode)
  .addNode('tools', toolNode)
  .addEdge(START, 'chatbot')
  .addConditionalEdges('chatbot', shouldContinue, ['tools', END])
  .addEdge('tools', 'chatbot')

let checkpointer: SqliteSaver
let app: ReturnType<typeof workflow.compile>

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

async function initializeApp() {
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
  if (!app) {
    app = workflow.compile({ checkpointer })
  }
  return app
}

initializeApp()

const getApp = async () => {
  return await initializeApp()
}

export { checkpointer, getApp }
