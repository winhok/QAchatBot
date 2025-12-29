/**
 * QA Chatbot Agent 节点定义
 */
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import type { ChatOpenAI } from '@langchain/openai';
import {
  QA_TEST_POINTS_PROMPT,
  QA_TEST_CASES_PROMPT,
  QA_REVIEW_PROMPT,
  QA_STAGE_HEADERS,
  QA_STAGE_FOOTERS,
} from '@/agent/prompts';
import type { QAChatbotStateType } from './state';
import type { UserIntent } from './types';

/**
 * 获取最后一条用户消息
 */
function getLastUserMessage(state: QAChatbotStateType): string {
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage instanceof HumanMessage) {
    return typeof lastMessage.content === 'string' ? lastMessage.content : '';
  }
  return '';
}

/**
 * 检测用户意图
 */
function detectUserIntent(userMessage: string): UserIntent {
  const msg = userMessage.toLowerCase().trim();

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
  ];

  for (const pattern of continuePatterns) {
    if (
      msg === pattern ||
      msg.startsWith(pattern + '，') ||
      msg.startsWith(pattern + ',')
    ) {
      return 'continue';
    }
  }

  // 超过一定长度认为是修改意见
  if (msg.length > 5) {
    return 'revise';
  }

  return 'other';
}

/**
 * 路由节点 - 检测用户意图
 */
export function createRouterNode() {
  return async (state: QAChatbotStateType) => {
    const userMessage = getLastUserMessage(state);
    const intent = detectUserIntent(userMessage);

    console.log('[QA Router] Stage:', state.stage, 'Intent:', intent);

    return { userIntent: intent };
  };
}

/**
 * 生成测试点节点
 */
export function createGenTestPointsNode(model: ChatOpenAI) {
  return async (state: QAChatbotStateType) => {
    const userMessage = getLastUserMessage(state);
    const isRevise =
      state.stage === 'test_points' && state.userIntent === 'revise';

    console.log('[QA GenTestPoints] isRevise:', isRevise);

    let systemPrompt: SystemMessage;

    if (isRevise) {
      // 修改模式
      systemPrompt = new SystemMessage(
        `你是一个专业的QA测试专家。用户对之前的测试点分析有修改意见，请根据意见重新分析。

${QA_TEST_POINTS_PROMPT}

## 原始需求

${state.prdContent}

## 之前的测试点分析

${state.testPoints}

重要：
1. 在输出开头加上：${QA_STAGE_HEADERS.test_points}
2. 在输出结尾加上：${QA_STAGE_FOOTERS.test_points}
3. 根据用户意见调整后，输出完整的测试点分析（不是只输出修改部分）。`,
      );
    } else {
      // 初始生成模式
      systemPrompt = new SystemMessage(
        `你是一个专业的QA测试专家。用户将提供PRD需求文档，你需要进行测试点分析。

${QA_TEST_POINTS_PROMPT}

重要：
1. 在输出开头加上：${QA_STAGE_HEADERS.test_points}
2. 在输出结尾加上：${QA_STAGE_FOOTERS.test_points}
3. 直接开始分析，不要有多余的开场白。`,
      );
    }

    const humanMessage = isRevise
      ? new HumanMessage(`用户修改意见：${userMessage}`)
      : new HumanMessage(userMessage);

    const response = await model.invoke([systemPrompt, humanMessage]);
    const content =
      typeof response.content === 'string' ? response.content : '';

    return {
      messages: [new AIMessage(content)],
      stage: 'test_points' as const,
      prdContent: isRevise ? state.prdContent : userMessage,
      testPoints: content,
    };
  };
}

/**
 * 生成测试用例节点
 */
export function createGenTestCasesNode(model: ChatOpenAI) {
  return async (state: QAChatbotStateType) => {
    const userMessage = getLastUserMessage(state);
    const isRevise =
      state.stage === 'test_cases' && state.userIntent === 'revise';

    console.log('[QA GenTestCases] isRevise:', isRevise);

    let systemPrompt: SystemMessage;

    if (isRevise) {
      systemPrompt = new SystemMessage(
        `你是一个专业的QA测试专家。用户对之前的测试用例有修改意见，请根据意见重新生成。

${QA_TEST_CASES_PROMPT}

## 测试点

${state.testPoints}

## 之前的测试用例

${state.testCases}

重要：
1. 在输出开头加上：${QA_STAGE_HEADERS.test_cases}
2. 在输出结尾加上：${QA_STAGE_FOOTERS.test_cases}
3. 根据用户意见调整后，输出完整的测试用例（不是只输出修改部分）。`,
      );
    } else {
      systemPrompt = new SystemMessage(
        `你是一个专业的QA测试专家。根据以下测试点生成测试用例。

${QA_TEST_CASES_PROMPT}

重要：
1. 在输出开头加上：${QA_STAGE_HEADERS.test_cases}
2. 在输出结尾加上：${QA_STAGE_FOOTERS.test_cases}
3. 直接开始生成，不要有多余的开场白。

## 测试点

${state.testPoints}`,
      );
    }

    const humanMessage = isRevise
      ? new HumanMessage(`用户修改意见：${userMessage}`)
      : new HumanMessage('请根据上述测试点生成测试用例');

    const response = await model.invoke([systemPrompt, humanMessage]);
    const content =
      typeof response.content === 'string' ? response.content : '';

    return {
      messages: [new AIMessage(content)],
      stage: 'test_cases' as const,
      testCases: content,
    };
  };
}

/**
 * 评审节点
 */
export function createGenReviewNode(model: ChatOpenAI) {
  return async (state: QAChatbotStateType) => {
    console.log('[QA GenReview] Starting review...');

    const systemPrompt = new SystemMessage(
      `你是一个专业的QA测试专家。请对测试用例进行评审和优化。

${QA_REVIEW_PROMPT}

重要：
1. 在输出开头加上：${QA_STAGE_HEADERS.review}
2. 在输出结尾加上：${QA_STAGE_FOOTERS.review}
3. 直接开始评审，不要有多余的开场白。

## 原始需求

${state.prdContent}

## 测试点

${state.testPoints}

## 待评审用例

${state.testCases}`,
    );

    const response = await model.invoke([
      systemPrompt,
      new HumanMessage('请对上述测试用例进行评审和优化'),
    ]);
    const content =
      typeof response.content === 'string' ? response.content : '';

    return {
      messages: [new AIMessage(content)],
      stage: 'completed' as const,
      testCases: content,
    };
  };
}

/**
 * 处理已完成阶段的修改请求
 */
export function createHandleCompletedReviseNode(model: ChatOpenAI) {
  return async (state: QAChatbotStateType) => {
    const userMessage = getLastUserMessage(state);

    console.log('[QA HandleCompletedRevise] Processing revision...');

    const systemPrompt = new SystemMessage(
      `你是一个专业的QA测试专家。用户对最终测试用例有调整意见，请根据意见修改。

${QA_REVIEW_PROMPT}

## 原始需求

${state.prdContent}

## 测试点

${state.testPoints}

## 当前测试用例

${state.testCases}

重要：
1. 在输出开头加上：📝 **调整测试用例**\n\n
2. 在输出结尾加上：\n\n---\n已根据您的意见调整，如需继续修改请告诉我。
3. 根据用户意见调整后，输出完整的测试用例。`,
    );

    const response = await model.invoke([
      systemPrompt,
      new HumanMessage(`用户修改意见：${userMessage}`),
    ]);
    const content =
      typeof response.content === 'string' ? response.content : '';

    return {
      messages: [new AIMessage(content)],
      testCases: content,
    };
  };
}

/**
 * 处理其他问题
 */
export function createHandleOtherNode(model: ChatOpenAI) {
  return async (state: QAChatbotStateType) => {
    const userMessage = getLastUserMessage(state);
    const stage = state.stage;

    const stageInfo =
      stage === 'test_points'
        ? '当前在测试点分析阶段'
        : stage === 'test_cases'
          ? '当前在用例生成阶段'
          : stage === 'review'
            ? '当前在用例评审阶段'
            : '测试用例已完成';

    console.log('[QA HandleOther] Stage:', stage);

    const systemPrompt = new SystemMessage(
      `你是一个专业的QA测试专家。${stageInfo}。

用户可能在询问问题或提供反馈。请根据上下文回答。

如果用户的问题像是对当前输出的修改建议，请按修改建议处理并重新输出该阶段的完整内容。
如果用户是在问其他问题，正常回答即可。

回答后，提醒用户可以回复"继续"进入下一阶段，或者提供修改建议。`,
    );

    const response = await model.invoke([
      systemPrompt,
      new HumanMessage(userMessage),
    ]);
    const content =
      typeof response.content === 'string' ? response.content : '';

    return {
      messages: [new AIMessage(content)],
    };
  };
}
