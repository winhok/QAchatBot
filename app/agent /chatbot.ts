import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { ChatOpenAI } from '@langchain/openai'
import Database from 'better-sqlite3'
import path from 'path'
import '../utils/loadEnv'

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
})

async function chatbotNode(state: typeof MessagesAnnotation.State) {
  const res = await model.invoke(state.messages)
  return { messages: [res] }
}
const dbPath = path.resolve(process.cwd(), 'chat_history.db')
export const db = new Database(dbPath)

const workflow = new StateGraph(MessagesAnnotation).addNode('chatbot', chatbotNode).addEdge(START, 'chatbot').addEdge('chatbot', END)

let checkpointer: SqliteSaver
let app: ReturnType<typeof workflow.compile>
