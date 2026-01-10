import { produce } from 'immer'
import type { Message } from '@/schemas'

// Action 类型定义
interface AddMessage {
  type: 'addMessage'
  payload: Message
}

interface UpdateMessageContent {
  type: 'updateMessageContent'
  id: string
  content: string
}

interface FinishStreaming {
  type: 'finishStreaming'
  id: string
}

interface DeleteMessage {
  type: 'deleteMessage'
  id: string
}

interface ClearMessages {
  type: 'clearMessages'
}

interface LoadMessages {
  type: 'loadMessages'
  messages: Array<Message>
}

export type MessageDispatch =
  | AddMessage
  | UpdateMessageContent
  | FinishStreaming
  | DeleteMessage
  | ClearMessages
  | LoadMessages

/**
 * 消息状态 reducer
 * 使用 immer 进行不可变更新
 */
export const messagesReducer = (state: Array<Message>, action: MessageDispatch): Array<Message> => {
  switch (action.type) {
    case 'addMessage':
      return produce(state, (draft) => {
        draft.push(action.payload)
      })

    case 'updateMessageContent':
      return produce(state, (draft) => {
        const message = draft.find((m) => m.id === action.id)
        if (message && typeof message.content === 'string') {
          message.content += action.content
        }
      })

    case 'finishStreaming':
      return produce(state, (draft) => {
        const message = draft.find((m) => m.id === action.id)
        if (message) {
          message.isStreaming = false
        }
      })

    case 'deleteMessage':
      return state.filter((m) => m.id !== action.id)

    case 'clearMessages':
      return []

    case 'loadMessages':
      return action.messages

    default:
      return state
  }
}
