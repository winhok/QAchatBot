export const welcomeMessages = [
  {
    headline: ({ time }: { time: string }) => `${time}，让测试更智能`,
    subtitle: 'AI 驱动的测试用例生成，告别手动编写的繁琐',
    highlightColor: 'from-teal-400 to-cyan-400',
  },
  {
    headline: ({ time }: { time: string }) => `${time}，释放你的生产力`,
    subtitle: '一句话生成完整测试方案，专注于更有价值的工作',
    highlightColor: 'from-emerald-400 to-teal-400',
  },
  {
    headline: ({ time }: { time: string }) => `${time}，我是你的 QA 伙伴`,
    subtitle: '无论是测试设计还是问题咨询，随时为你提供专业支持',
    highlightColor: 'from-cyan-400 to-blue-400',
  },
  {
    headline: ({ time }: { time: string }) => `${time}，测试从这里开始`,
    subtitle: '描述你的需求，AI 帮你规划测试策略和用例设计',
    highlightColor: 'from-purple-400 to-pink-400',
  },
  {
    headline: ({ time }: { time: string }) => `${time}，今天想更聪明地工作吗？`,
    subtitle: 'AI 辅助分析、生成、优化，让测试工作事半功倍',
    highlightColor: 'from-amber-400 to-orange-400',
  },
]

export const featureTips = [
  '尝试: [ 生成测试用例 ] 登录模块',
  '尝试: [ 分析日志 ] error.log',
  '尝试: [ API测试 ] /api/v1/users',
  '尝试: [ 系统状态 ] --verbose',
]

/**
 * Randomly select an index ensuring it's different from the last one
 */
export function getRandomIndex(length: number, lastIndex: number | null): number {
  if (length <= 1) return 0
  let nextIndex: number
  do {
    nextIndex = Math.floor(Math.random() * length)
  } while (nextIndex === lastIndex)
  return nextIndex
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return '早上好'
  if (hour >= 12 && hour < 18) return '下午好'
  if (hour >= 18 && hour < 23) return '晚上好'
  return '夜深了'
}
