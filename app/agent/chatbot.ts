import { AIMessage } from '@langchain/core/messages'
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'
import Database from 'better-sqlite3'
import path from 'path'
import '../utils/loadEnv'
import './config/tools.register'
import { initSessionTable } from './db'
import { getAllTools } from './tools'

const tools = getAllTools()

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
  maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3'),
  temperature: 0.7,
  streaming: true,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
}).bindTools(tools)

async function chatbotNode(state: typeof MessagesAnnotation.State) {
  const res = await model.invoke(state.messages)
  return { messages: [res] }
}

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return 'tools'
  }
  return END
}

const dbPath = path.resolve(process.cwd(), 'chat_history.db')
export const db = new Database(dbPath)

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
    console.log('Initializing checkpointer for', dbPath)
    try {
      initSessionTable()
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
    console.log('Initializing checkpointer for', dbPath)
    try {
      const db = new Database(dbPath)
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
