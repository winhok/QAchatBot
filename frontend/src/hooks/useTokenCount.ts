import { debounce } from 'es-toolkit/compat'
import { startTransition, useEffect, useState } from 'react'

/**
 * 简单 Token 估算（4 个字符 ≈ 1 个 Token）
 *
 * 这是一个粗略估算，实际 Token 数量取决于具体的分词器。
 * 对于中文，每个汉字大约是 1-2 个 Token。
 */
const estimateTokens = (text: string): number => {
  // 简单估算：英文约 4 字符/token，中文约 1.5 字符/token
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const otherChars = text.length - chineseChars
  return Math.ceil(chineseChars / 1.5 + otherChars / 4)
}

/**
 * 带防抖更新的文本 Token 计数 Hook。
 *
 * 适用于在聊天输入框显示 Token 使用量。
 * 使用 300ms 防抖避免频繁计算。
 *
 * @param input - 输入文本
 * @returns 估算的 Token 数量
 *
 * @example
 * ```tsx
 * const tokenCount = useTokenCount(inputText)
 * <span className="text-sm text-muted">{tokenCount} tokens</span>
 * ```
 */
export const useTokenCount = (input: string = ''): number => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const debouncedCount = debounce((text: string) => {
      const tokens = estimateTokens(text)
      setCount(tokens)
    }, 300)

    startTransition(() => {
      debouncedCount(input || '')
    })

    return () => {
      debouncedCount.cancel()
    }
  }, [input])

  return count
}
