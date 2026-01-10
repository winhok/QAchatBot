import { Code2, Copy, Eye, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { CodePreviewPanel } from './CodePreviewPanel'
import { useCanvasArtifacts } from '@/stores/useCanvasArtifacts'

export function CanvasSidebar() {
  const {
    isCanvasVisible,
    activeArtifactId,
    artifacts,
    setIsCanvasVisible,
    updateArtifact, // Assuming this exists in store for updating code content
    initialTab,
  } = useCanvasArtifacts()

  // 查找当前激活的 Artifact
  // artifacts is Map<messageId, Map<artifactId, Artifact>>
  const activeArtifact = React.useMemo(() => {
    if (!activeArtifactId) return null
    for (const map of artifacts.values()) {
      if (map.has(activeArtifactId)) return map.get(activeArtifactId)!
    }
    return null
  }, [artifacts, activeArtifactId])

  const [code, setCode] = useState('')
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview')
  const [consoleOutput, setConsoleOutput] = useState<Array<string>>([])
  const [executionError, setExecutionError] = useState('')

  // Sync state
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab, isCanvasVisible])

  useEffect(() => {
    if (activeArtifact) {
      setCode(activeArtifact.code.content)
    }
  }, [activeArtifact])

  // Code update handler
  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    if (activeArtifact) {
      // We really should have an updateArtifactCode action, but updateArtifact works
      updateArtifact(activeArtifact.messageId, activeArtifact.id, {
        code: { ...activeArtifact.code, content: newCode },
      })
    }
  }

  if (!isCanvasVisible || !activeArtifact) return null

  return (
    <div className="flex flex-col h-full w-[450px] lg:w-[600px] border-l border-border bg-background shadow-xl fixed right-0 top-0 bottom-0 z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="font-semibold">{activeArtifact.title}</div>
          <div className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
            v{activeArtifact.currentVersion}
          </div>
        </div>
        <button onClick={() => setIsCanvasVisible(false)} className="p-2 hover:bg-muted rounded-md">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex bg-muted/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 ${activeTab === 'editor' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            <Code2 className="w-3 h-3" /> Code
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 ${activeTab === 'preview' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="p-2 hover:bg-muted rounded-md"
            title="Copy"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'editor' ? (
          <textarea
            className="w-full h-full p-4 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] resize-none focus:outline-none"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <CodePreviewPanel
            code={code}
            artifact={activeArtifact}
            activeTab={executionError ? 'error' : 'preview'}
            // Simple console viewing logic could be added back if needed
            consoleOutput={consoleOutput}
            executionError={executionError}
            onStatusChange={() => {}}
            onConsoleOutput={setConsoleOutput}
            onError={setExecutionError}
          />
        )}
      </div>
    </div>
  )
}
