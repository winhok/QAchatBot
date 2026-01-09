import { useState } from 'react'

// TODO: 缺陷报告模板组件
// 功能需求：
// 1. 支持多种缺陷管理系统格式（Jira、禅道、GitLab、GitHub Issues）
// 2. AI 分析后自动填充字段
// 3. 可编辑各个字段
// 4. 一键复制为对应格式
// 5. 直接创建到缺陷系统（需要 API 集成）
// 6. 自定义模板
// 7. 历史模板保存
// 8. 附件关联

type BugPlatform = 'jira' | 'zentao' | 'gitlab' | 'github' | 'custom'
type BugSeverity = 'critical' | 'major' | 'minor' | 'trivial'
type BugPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest'

interface BugReport {
  title: string
  description: string
  stepsToReproduce: Array<string>
  expectedResult: string
  actualResult: string
  severity: BugSeverity
  priority: BugPriority
  environment: string
  version: string
  assignee?: string
  labels?: Array<string>
  attachments?: Array<string>
  customFields?: Record<string, string>
}

interface BugReportTemplateProps {
  initialData?: Partial<BugReport>
  platform: BugPlatform
  onSubmit?: (report: BugReport, platform: BugPlatform) => void
  onCopy?: (formattedReport: string) => void
}

export function BugReportTemplate({
  initialData,
  platform,
  onSubmit,
  onCopy,
}: BugReportTemplateProps) {
  const [report, setReport] = useState<BugReport>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    stepsToReproduce: initialData?.stepsToReproduce || [''],
    expectedResult: initialData?.expectedResult || '',
    actualResult: initialData?.actualResult || '',
    severity: initialData?.severity || 'major',
    priority: initialData?.priority || 'medium',
    environment: initialData?.environment || '',
    version: initialData?.version || '',
    labels: initialData?.labels || [],
    ...initialData,
  })

  const [currentPlatform, setCurrentPlatform] = useState<BugPlatform>(platform)

  // TODO: 更新字段
  const updateField = <TField extends keyof BugReport>(field: TField, value: BugReport[TField]) => {
    setReport((prev) => ({ ...prev, [field]: value }))
  }

  // TODO: 添加复现步骤
  const addStep = () => {
    setReport((prev) => ({
      ...prev,
      stepsToReproduce: [...prev.stepsToReproduce, ''],
    }))
  }

  // TODO: 删除复现步骤
  const removeStep = (index: number) => {
    setReport((prev) => ({
      ...prev,
      stepsToReproduce: prev.stepsToReproduce.filter((_, i) => i !== index),
    }))
  }

  // TODO: 更新复现步骤
  const updateStep = (index: number, value: string) => {
    setReport((prev) => ({
      ...prev,
      stepsToReproduce: prev.stepsToReproduce.map((step, i) => (i === index ? value : step)),
    }))
  }

  // TODO: 格式化为 Jira 格式
  const formatForJira = (reportData: BugReport): string => {
    // TODO: 生成 Jira Markdown 格式
    // h3. 描述
    // {panel}内容{panel}
    // ||步骤||预期||实际||
    void reportData
    return ''
  }

  // TODO: 格式化为禅道格式
  const formatForZentao = (reportData: BugReport): string => {
    // TODO: 生成禅道格式
    void reportData
    return ''
  }

  // TODO: 格式化为 GitLab/GitHub Issue 格式
  const formatForGitHub = (reportData: BugReport): string => {
    // TODO: 生成 GitHub Markdown 格式
    // ## 描述
    // ### 复现步骤
    // 1. xxx
    // ### 预期结果
    // ### 实际结果
    void reportData
    return ''
  }

  // TODO: 根据平台格式化
  const formattedReport = (() => {
    switch (currentPlatform) {
      case 'jira':
        return formatForJira(report)
      case 'zentao':
        return formatForZentao(report)
      case 'gitlab':
      case 'github':
        return formatForGitHub(report)
      default:
        return JSON.stringify(report, null, 2)
    }
  })()

  // TODO: 复制格式化后的报告
  const handleCopy = async () => {
    // TODO: 复制到剪贴板
    await navigator.clipboard.writeText(formattedReport)
    // TODO: 调用 onCopy 回调
    onCopy?.(formattedReport)
  }

  // TODO: 提交到缺陷系统
  const handleSubmit = () => {
    // TODO: 调用 onSubmit 回调
    // TODO: 或直接调用对应平台的 API
    void onSubmit
  }

  // Suppress unused variable warnings for TODO implementations
  void setCurrentPlatform
  void addStep
  void removeStep
  void updateStep
  void handleCopy
  void handleSubmit

  return (
    <div className="bug-report-template">
      {/* TODO: 平台选择 */}
      <div className="platform-selector">{/* TODO: Jira / 禅道 / GitLab / GitHub / 自定义 */}</div>

      {/* TODO: 表单 */}
      <form className="report-form">
        {/* TODO: 标题 */}
        <div className="field">
          <label>标题 *</label>
          <input value={report.title} onChange={(e) => updateField('title', e.target.value)} />
        </div>

        {/* TODO: 描述 */}
        <div className="field">
          <label>描述</label>
          <textarea
            value={report.description}
            onChange={(e) => updateField('description', e.target.value)}
          />
        </div>

        {/* TODO: 复现步骤（动态列表） */}
        <div className="field">
          <label>复现步骤</label>
          {report.stepsToReproduce.map((step, index) => (
            <div key={index} className="step-row">
              {/* TODO: 步骤序号 */}
              {/* TODO: 输入框 */}
              {/* TODO: 删除按钮 */}
              <span>{step}</span>
            </div>
          ))}
          {/* TODO: 添加步骤按钮 */}
        </div>

        {/* TODO: 预期结果 */}
        {/* TODO: 实际结果 */}
        {/* TODO: 严重程度选择 */}
        {/* TODO: 优先级选择 */}
        {/* TODO: 环境信息 */}
        {/* TODO: 版本号 */}
        {/* TODO: 标签（多选） */}
      </form>

      {/* TODO: 预览区域 */}
      <div className="preview">
        <div className="preview-header">
          <span>预览（{currentPlatform} 格式）</span>
          {/* TODO: 复制按钮 */}
        </div>
        <pre className="preview-content">{formattedReport}</pre>
      </div>

      {/* TODO: 操作按钮 */}
      <div className="actions">
        {/* TODO: 复制按钮 */}
        {/* TODO: 提交到系统按钮（需要配置 API） */}
      </div>
    </div>
  )
}

// TODO: 严重程度选项
export const severityOptions: Array<{
  value: BugSeverity
  label: string
  color: string
}> = [
  { value: 'critical', label: '致命', color: 'red' },
  { value: 'major', label: '严重', color: 'orange' },
  { value: 'minor', label: '一般', color: 'yellow' },
  { value: 'trivial', label: '轻微', color: 'gray' },
]

// TODO: 优先级选项
export const priorityOptions: Array<{ value: BugPriority; label: string }> = [
  { value: 'highest', label: '最高' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
  { value: 'lowest', label: '最低' },
]
