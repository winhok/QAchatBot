export const welcomeMessages = [
  {
    headline: ({ time }: { time: string }) => `${time}，有什么我能帮你的？`,
    subtitle: '问我任何问题，或者告诉我你想完成的任务',
    highlightColor: 'from-teal-400 to-cyan-400',
  },
  {
    headline: ({ time }: { time: string }) => `${time}，准备好开始了吗`,
    subtitle: '无论是分析、生成还是解答疑问，随时为你效劳',
    highlightColor: 'from-emerald-400 to-teal-400',
  },
  {
    headline: ({ time }: { time: string }) => `${time}，今天想聊点什么`,
    subtitle: '我可以帮你思考问题、完成任务、或者只是闲聊',
    highlightColor: 'from-cyan-400 to-blue-400',
  },
  {
    headline: ({ time }: { time: string }) => `${time}，让我们开始吧`,
    subtitle: '描述你的需求，我会尽力提供帮助',
    highlightColor: 'from-purple-400 to-pink-400',
  },
  {
    headline: ({ time }: { time: string }) => `${time}，需要帮手吗`,
    subtitle: '复杂任务、简单问题，或者任何想法，都可以聊聊',
    highlightColor: 'from-amber-400 to-orange-400',
  },
]

export const featureTips = [
  '尝试: 帮我分析这份文档的要点',
  '尝试: 解释一下这段代码的逻辑',
  '尝试: 帮我整理这些想法',
  '尝试: 用简单的话解释这个概念',
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

  if (hour >= 5 && hour < 12) {
    return '早上好'
  }
  if (hour >= 12 && hour < 18) {
    return '下午好'
  }
  if (hour >= 18 && hour < 23) {
    return '晚上好'
  }
  return '夜深了'
}
