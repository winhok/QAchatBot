/**
 * Hooks 统一导出
 *
 * QAchatBot 前端的自定义 React Hooks 集合。
 */

// ============================================================
// 核心工具 Hooks
// ============================================================

/** 稳定回调引用，避免闭包陷阱 */
export { useEventCallback } from './useEventCallback'

/** 暗色模式检测 */
export { useIsDark } from './useIsDark'

// ============================================================
// 操作状态 Hooks
// ============================================================

/** 消息/工具调用操作状态 */
export {
  useMessageOperationState,
  useToolOperationState,
  type MessageOperationState,
  type ToolOperationState,
} from './useOperationState'

// ============================================================
// 热键系统
// ============================================================

export {
  useHotkeyById,
  useNewSessionHotkey,
  useRegisterChatHotkeys,
  useRegisterGlobalHotkeys,
  useSearchHotkey,
  useStopGenerationHotkey,
  useToggleSidebarHotkey,
  useToggleThemeHotkey,
} from './useHotkeys'

// ============================================================
// 数据与界面 Hooks
// ============================================================

/** 自动滚动 */
export { useAutoScroll } from './useAutoScroll'

/** 聊天历史 */
export { useChatHistory } from './useChatHistory'

/** 复制到剪贴板 */
export { useCopyToClipboard } from './useCopyToClipboard'

/** 文件上传 */
export { useFileUpload, type UploadResult } from './useFileUpload'

/** 快速操作 */
export { useQuickAction } from './useQuickAction'

/** Token 计数 */
export { useTokenCount } from './useTokenCount'

/** Canvas Artifact 解析 */
export { useArtifactParsing } from './useArtifactParsing'

// ============================================================
// 媒体操作 Hooks
// ============================================================

/** 截图功能 */
export { useScreenshot, type UseScreenshotReturn } from './useScreenshot'

/** 分享功能 */
export { useShare, type ShareData, type UseShareReturn } from './useShare'

/** 图片下载 */
export { useDownloadImage, type UseDownloadImageReturn } from './useDownloadImage'

// ============================================================
// 会话管理 Hooks
// ============================================================

export {
  sessionsQueryKey,
  useCreateSession,
  useDeleteSession,
  useInvalidateSessions,
  useRenameSession,
  useSessions,
  useUpdateSessionName,
} from './useSessions'
