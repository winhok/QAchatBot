import { Command, interrupt } from '@langchain/langgraph'
import type { DeepResearchState } from '../state'

/**
 * 人工审批节点
 *
 * 使用 LangGraph interrupt 机制实现 Human-in-the-Loop：
 * - 暂停工作流等待用户审批
 * - 用户可以批准计划或提供修改意见
 * - 根据用户反馈决定下一步流向
 */
export async function humanApprovalNode(state: DeepResearchState) {
  // 中断执行，等待用户输入
  const rawRes: unknown = await interrupt({
    type: 'waiting_approval',
    message: '等待用户审批研究计划',
    plan: state.plan,
  })

  // 安全地提取 userFeedback
  let userFeedback = ''
  if (
    typeof rawRes === 'object' &&
    rawRes !== null &&
    'userFeedback' in rawRes &&
    typeof (rawRes as { userFeedback: unknown }).userFeedback === 'string'
  ) {
    userFeedback = (rawRes as { userFeedback: string }).userFeedback
  }

  const hasUserFeedback = userFeedback.trim().length > 0
  const hasSections = (state.plan?.sections?.length ?? 0) > 0

  // 如果有用户修改意见或计划无效，返回重新生成计划
  if (hasUserFeedback || !hasSections) {
    return new Command({
      update: {
        userFeedback,
        approvalStatus: 'rejected' as const,
      },
      goto: 'generate_plan',
    })
  }

  // 用户批准，继续执行研究
  return new Command({
    update: {
      approvalStatus: 'approved' as const,
    },
    goto: 'coordinate_research',
  })
}
