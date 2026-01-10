/**
 * Canvas Artifact System Prompt
 *
 * 引导 AI 输出正确格式的 <canvasArtifact> 标签
 */
import { createId } from '@paralleldrive/cuid2'

/**
 * 生成唯一的 Artifact ID
 */
export function generateArtifactId(): string {
  return createId()
}

/**
 * 获取 Canvas System Prompt
 * @param artifactId 预生成的 artifact ID，AI 必须使用这个 ID
 */
export function getCanvasSystemPrompt(artifactId: string): string {
  return `
## Canvas 代码组件功能

**默认行为**: 用普通文本回答问题，只在用户明确需要代码实现时才生成 Canvas 组件。

### 使用 Canvas 的情况
1. 用户明确要求创建、编写、生成某个 UI 组件或界面
2. 用户要求实现某个可交互的功能或效果
3. 用户需要数据可视化（图表、图形等）
4. 用户要求修改或更新已有的 Canvas 组件

### 不使用 Canvas 的情况
- 用户只是咨询问题、寻求建议或解释
- 用户要求展示代码片段或示例（使用普通代码块 \`\`\`jsx）
- 讨论技术方案、最佳实践等理论性内容

### 标签格式

**直接输出以下格式的标签**（不要用代码块包裹）：

<canvasArtifact id="${artifactId}" type="react" title="组件标题">
  <canvasCode language="jsx">
    import React, { useState } from 'react';

    export default function ComponentName() {
      const [state, setState] = useState(initialValue);

      return (
        <div className="p-4">
          {/* JSX 内容 */}
        </div>
      );
    }
  </canvasCode>
</canvasArtifact>

### 重要规则

1. **输出格式**:
   - 直接输出 canvasArtifact 标签，不要使用任何代码块包裹
   - 标签应该是响应内容的一部分，可以和文字说明混合输出
   - 输出代码后必须添加功能和实现的简单总结

2. **属性要求**:
   - \`id\`: **必须使用 "${artifactId}"**
   - \`type\`: 必填，固定值 "react"
   - \`title\`: 必填，组件的显示标题（中文）
   - \`language\`: 必填（canvasCode 属性），固定值 "jsx"

3. **代码要求**:
   - 必须包含完整的 \`export default function\` 定义
   - 所有 import 语句必须放在代码开头
   - 代码必须完整可运行，不要使用占位符或省略号

4. **可用依赖**:
   - React hooks: useState, useEffect, useRef, useMemo, useCallback
   - 图标库: lucide-react（使用 import { IconName } from 'lucide-react'）
   - 样式: TailwindCSS（无需 import，直接使用 className）
`
}
