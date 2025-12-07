import { z } from 'zod'
import { toolManager } from '../tools'

toolManager.add('current_time', {
  description: 'Get the current time',
  schema: z.object({}),
  handler: async () => {
    const date = new Date()
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Shanghai',
      timeZoneName: 'short',
    })
  },
})

toolManager.add('calculator', {
  description: '计算数学表达式',
  schema: z.object({ expression: z.string().describe('数学表达式，如 2+2*3') }),
  handler: ({ expression }) => {
    try {
      const result = Function(`"use strict"; return (${expression})`)()
      return `${expression} = ${result}`
    } catch {
      return `无法计算: ${expression}`
    }
  },
})
