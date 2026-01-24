import { useState } from 'react'

// TODO: 用例版本对比组件（Diff Viewer）
// 功能需求：
// 1. 并排对比（Side by Side）模式
// 2. 内联对比（Inline）模式
// 3. 高亮显示新增/删除/修改的内容
// 4. 行号显示
// 5. 折叠未修改的部分
// 6. 支持 JSON/文本/Markdown 对比
// 7. Human-in-the-Loop 场景：显示 AI 生成 vs 用户修改
// 8. 可选：接受/拒绝单个修改
// 9. 参考 GitHub 的 Diff 视图

type DiffMode = 'side-by-side' | 'inline'

interface DiffLine {
  type: 'add' | 'remove' | 'unchanged'
  lineNumber: { old?: number; new?: number }
  content: string
}

interface DiffViewerProps {
  oldContent: string
  newContent: string
  oldTitle?: string // 如 "AI 生成版本"
  newTitle?: string // 如 "修改后版本"
  mode?: DiffMode
  language?: string // 用于语法高亮
  showLineNumbers?: boolean
  collapsible?: boolean // 是否折叠未修改部分
}

export function DiffViewer({
  oldContent,
  newContent,
  oldTitle = '修改前',
  newTitle = '修改后',
  mode = 'side-by-side',
  language,
  showLineNumbers = true,
  collapsible = true,
}: DiffViewerProps) {
  const [currentMode, setCurrentMode] = useState<DiffMode>(mode)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  // TODO: 计算 Diff
  const diffLines = ((): Array<DiffLine> => {
    // TODO: 实现 Diff 算法
    // - 可以使用 diff 库（如 diff, jsdiff）
    // - 或自己实现简单的行级 Diff
    // - 返回 DiffLine 数组
    void oldContent
    void newContent
    return []
  })()

  // TODO: 统计变更
  const stats = (() => {
    // TODO: 计算新增/删除/修改行数
    void diffLines
    return {
      additions: 0,
      deletions: 0,
      unchanged: 0,
    }
  })()

  // TODO: 切换显示模式
  const toggleMode = () => {
    setCurrentMode((prev) => (prev === 'side-by-side' ? 'inline' : 'side-by-side'))
  }

  // TODO: 展开/折叠未修改部分
  const toggleSection = (sectionIndex: number) => {
    // TODO: 更新 expandedSections
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionIndex)) {
        next.delete(sectionIndex)
      } else {
        next.add(sectionIndex)
      }
      return next
    })
  }

  // Suppress unused variable warnings for TODO implementations
  void language
  void showLineNumbers
  void collapsible
  void stats
  void toggleMode
  void toggleSection
  void expandedSections

  return (
    <div className="diff-viewer">
      {/* TODO: 工具栏 */}
      <div className="diff-toolbar">
        {/* TODO: 模式切换按钮 */}
        {/* TODO: 统计信息（+X -Y） */}
        {/* TODO: 展开全部/折叠全部 */}
      </div>

      {/* TODO: 标题栏（并排模式） */}
      {currentMode === 'side-by-side' && (
        <div className="diff-headers">
          <div>{oldTitle}</div>
          <div>{newTitle}</div>
        </div>
      )}

      {/* TODO: Diff 内容 */}
      <div className="diff-content">
        {currentMode === 'side-by-side' ? (
          // TODO: 并排视图
          <div className="side-by-side">
            {/* TODO: 左侧面板（旧内容） */}
            {/* TODO: 右侧面板（新内容） */}
          </div>
        ) : (
          // TODO: 内联视图
          <div className="inline">
            {diffLines.map((line, index) => (
              <DiffLineComponent key={index} line={line} showLineNumber={showLineNumbers} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// TODO: 辅助组件 - 单行 Diff
interface DiffLineComponentProps {
  line: DiffLine
  showLineNumber: boolean
}

function DiffLineComponent({ line, showLineNumber }: DiffLineComponentProps) {
  // TODO: 根据 line.type 渲染不同样式
  return (
    <div className={`diff-line diff-line-${line.type}`}>
      {showLineNumber && (
        <span className="line-numbers">
          <span>{line.lineNumber.old ?? ''}</span>
          <span>{line.lineNumber.new ?? ''}</span>
        </span>
      )}
      <span className="line-content">{line.content}</span>
    </div>
  )
}
