import { useHotkeys } from 'react-hotkeys-hook'
import type { HotkeyId } from '@/config/hotkeys'
import type { Options } from 'react-hotkeys-hook'
import { HOTKEY_DEFINITIONS } from '@/config/hotkeys'

/**
 * 通过 ID 从集中热键配置注册热键。
 *
 * 支持自定义选项并提供一致的行为。
 * 使用 react-hotkeys-hook 库实现。
 *
 * @param hotkeyId - 热键 ID
 * @param callback - 热键触发时的回调函数
 * @param options - 可选的 react-hotkeys-hook 配置
 * @returns 包含 ref 和 id 的对象
 *

/**
 * 通过 ID 从集中热键配置注册热键。
 *
 * 支持自定义选项并提供一致的行为。
 * 使用 react-hotkeys-hook 库实现。
 *
 * @param hotkeyId - 热键 ID
 * @param callback - 热键触发时的回调函数
 * @param options - 可选的 react-hotkeys-hook 配置
 * @returns 包含 ref 和 id 的对象
 *
 * @example
 * ```tsx
 * useHotkeyById('newSession', () => createNewSession())
 * useHotkeyById('stopGeneration', abortCurrent, { enabled: isGenerating })
 * ```
 */
export const useHotkeyById = (
  hotkeyId: HotkeyId,
  callback: () => void,
  options?: Omit<Options, 'keys'>,
) => {
  const hotkey = HOTKEY_DEFINITIONS[hotkeyId]

  const ref = useHotkeys(
    hotkey.keys,
    (e) => {
      e.preventDefault()
      callback()
    },
    {
      enabled: options?.enabled ?? true,
      enableOnFormTags: hotkey.enableOnFormTags ?? false,
      preventDefault: true,
      ...options,
    },
  )

  return { ref, id: hotkeyId }
}
