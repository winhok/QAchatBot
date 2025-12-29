import { ChatbotService } from '@/agent/graphs/chatbot';
import type { SessionType } from '@/shared/schemas/enums';
import type { ChatMessageContent } from '@/shared/schemas/requests';
import { MessagesService } from '../messages/messages.service';
import { SessionsService } from '../sessions/sessions.service';
import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

interface StreamChatParams {
  message: ChatMessageContent;
  sessionId: string;
  modelId: string;
  sessionType: SessionType;
  res: Response;
  isAborted: () => boolean;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly chatbot: ChatbotService,
    private readonly sessions: SessionsService,
    private readonly messages: MessagesService,
  ) {}

  async getHistory(threadId: string, modelId?: string) {
    return this.chatbot.getHistory(threadId, modelId);
  }

  async streamChat(params: StreamChatParams) {
    const { message, sessionId, modelId, sessionType, res, isAborted } = params;

    // Ensure session exists
    await this.sessions.findOrCreate(sessionId, sessionType);

    // Save user message
    const userMessageContent =
      typeof message === 'string' ? message : JSON.stringify(message);
    await this.messages.create({
      sessionId,
      role: 'user',
      content: userMessageContent,
    });

    // Create assistant message placeholder
    const assistantMessage = await this.messages.create({
      sessionId,
      role: 'assistant',
      content: '',
      metadata: { modelId },
    });

    const userMessage = this.chatbot.createHumanMessage(message);
    const app = this.chatbot.getApp(modelId);
    const threadConfig = { configurable: { thread_id: sessionId } };

    // Track tool calls: runId -> { dbId, name, startTime }
    const toolCallsMap = new Map<
      string,
      { dbId?: string; name: string; startTime: number }
    >();

    let accumulatedContent = '';

    const eventStream = app.streamEvents(
      { messages: [userMessage] },
      { version: 'v2', ...threadConfig },
    );

    for await (const event of eventStream) {
      if (isAborted()) {
        console.log('[Chat Service] Client disconnected, stopping');
        break;
      }

      // Handle model streaming output
      if (event.event === 'on_chat_model_stream') {
        const chunk = event.data?.chunk as
          | {
              content?: string;
              usage_metadata?: unknown;
              tool_call_chunks?: unknown[];
            }
          | undefined;

        if (chunk) {
          const dataObj: Record<string, unknown> = {
            type: 'chunk',
            content: chunk.content,
          };

          // Accumulate content for database
          if (chunk.content) {
            accumulatedContent += chunk.content;
          }

          if (chunk.usage_metadata) {
            dataObj.usage_metadata = chunk.usage_metadata;
          }

          if (chunk.tool_call_chunks?.length) {
            dataObj.tool_call_chunks = chunk.tool_call_chunks;
          }

          res.write(JSON.stringify(dataObj) + '\n');
        }
      }

      // Handle tool call start
      if (event.event === 'on_tool_start') {
        const toolName = event.name || 'unknown_tool';
        const runId = event.run_id;

        // Create tool call in database
        const toolCall = await this.messages.createToolCall({
          messageId: assistantMessage.id,
          toolCallId: runId,
          toolName,
          args: event.data?.input ?? {},
        });

        // Update status to running
        await this.messages.updateToolCall(toolCall.id, { status: 'running' });

        toolCallsMap.set(runId, {
          dbId: toolCall.id,
          name: toolName,
          startTime: Date.now(),
        });

        res.write(
          JSON.stringify({
            type: 'tool_start',
            tool_call_id: runId,
            name: toolName,
            input: event.data?.input,
          }) + '\n',
        );
      }

      // Handle tool call end
      if (event.event === 'on_tool_end') {
        const runId = event.run_id;
        const toolInfo = toolCallsMap.get(runId);
        const duration = toolInfo ? Date.now() - toolInfo.startTime : undefined;

        // Update tool call in database
        if (toolInfo?.dbId) {
          await this.messages.updateToolCall(toolInfo.dbId, {
            status: 'completed',
            result: event.data?.output,
            duration,
          });
        }

        res.write(
          JSON.stringify({
            type: 'tool_end',
            tool_call_id: runId,
            name: toolInfo?.name || 'unknown_tool',
            output: event.data?.output,
            duration,
          }) + '\n',
        );

        toolCallsMap.delete(runId);
      }

      // Handle tool call error
      if (event.event === 'on_tool_error') {
        const runId = event.run_id;
        const error = (event.data as { error?: unknown })?.error;
        const toolInfo = toolCallsMap.get(runId);
        const duration = toolInfo ? Date.now() - toolInfo.startTime : undefined;

        // Update tool call in database with error
        if (toolInfo?.dbId) {
          await this.messages.updateToolCall(toolInfo.dbId, {
            status: 'error',
            result: {
              error: error instanceof Error ? error.message : String(error),
            },
            duration,
          });
        }

        res.write(
          JSON.stringify({
            type: 'tool_error',
            tool_call_id: runId,
            name: toolInfo?.name || 'unknown_tool',
            error: error instanceof Error ? error.message : String(error),
            duration,
          }) + '\n',
        );

        toolCallsMap.delete(runId);
      }
    }

    // Save accumulated content to assistant message
    if (accumulatedContent) {
      await this.messages.updateContent(
        assistantMessage.id,
        accumulatedContent,
      );
    }

    // Send end signal
    res.write(
      JSON.stringify({
        type: 'end',
        status: isAborted() ? 'aborted' : 'success',
        session_id: sessionId,
      }) + '\n',
    );
  }
}
