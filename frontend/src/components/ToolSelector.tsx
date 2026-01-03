import { cn } from '@/lib/utils'
import { Check, Wrench } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface Tool {
  id: string
  name: string
  description: string
  icon?: string
}

interface ToolSelectorProps {
  tools: Tool[]
  selectedTools: string[]
  onToolToggle: (toolId: string) => void
}

export function ToolSelector({
  tools,
  selectedTools,
  onToolToggle,
}: ToolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const handleToolClick = (toolId: string) => {
    onToolToggle(toolId)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 工具按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
          selectedTools.length > 0
            ? 'bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-md'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        )}
        title="选择工具"
      >
        <Wrench className="w-4 h-4" />
        <span className="text-sm font-medium">工具</span>
        {selectedTools.length > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xs bg-white/20 rounded-full">
            {selectedTools.length}
          </span>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200 z-50">
          {/* 标题 */}
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">选择工具</h3>
            <p className="text-xs text-muted-foreground mt-1">
              点击选择或取消选择工具
            </p>
          </div>

          {/* 工具列表 */}
          <div className="max-h-80 overflow-y-auto">
            {tools.map((tool) => {
              const isSelected = selectedTools.includes(tool.id)
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleToolClick(tool.id)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors duration-150',
                    'hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent/50',
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* 复选框 */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-5 h-5 mt-0.5 border-2 rounded transition-all duration-200 flex items-center justify-center',
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground',
                      )}
                    >
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      )}
                    </div>

                    {/* 工具信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {tool.icon && (
                          <span className="text-lg">{tool.icon}</span>
                        )}
                        <span className="text-sm font-medium text-foreground">
                          {tool.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 底部操作 */}
          {selectedTools.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-muted/30">
              <button
                type="button"
                onClick={() => {
                  selectedTools.forEach((toolId) => onToolToggle(toolId))
                }}
                className="text-xs text-primary hover:underline"
              >
                清除全部选择
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
