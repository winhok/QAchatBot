/**
 * Code Preview Panel 组件
 *
 * 负责在 iframe 沙箱中执行 React 代码
 * 使用 Babel Standalone 转译 JSX
 */

import type { CanvasArtifact, CanvasStatus } from '@/types/canvas'
import { AlertCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface CodePreviewPanelProps {
  code: string
  artifact: CanvasArtifact
  activeTab: 'preview' | 'console' | 'error'
  consoleOutput: string[]
  executionError: string
  onStatusChange: (status: CanvasStatus) => void
  onConsoleOutput: (logs: string[]) => void
  onError: (error: string) => void
}

/**
 * 生成 iframe HTML 模板
 */
function generateIframeHTML(code: string, icons: string[] = []): string {
  // 常用 lucide 图标的 SVG 路径数据
  const iconPaths: Record<string, string> = {
    Plus: 'M5 12h14M12 5v14',
    Minus: 'M5 12h14',
    X: 'M18 6L6 18M6 6l12 12',
    Check: 'M20 6L9 17l-5-5',
    ChevronRight: 'M9 18l6-6-6-6',
    ChevronLeft: 'M15 18l-6-6 6-6',
    ChevronDown: 'M6 9l6 6 6-6',
    ChevronUp: 'M18 15l-6-6-6 6',
    Search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    Settings:
      'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
    Trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
    Edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
    Copy: 'M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z',
    Download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
    Play: 'M5 3l14 9-14 9V3z',
    Pause: 'M10 4H6v16h4V4zm8 0h-4v16h4V4z',
    RefreshCw: 'M23 4v6h-6M1 20v-6h6M20.49 15a9 9 0 11-2.12-9.36L23 10',
    Eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    User: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
    Mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
    Home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    File: 'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z',
  }

  // 创建 lucide 图标的 React 组件代码
  const iconComponents =
    icons.length > 0
      ? `
    // Lucide 图标组件
    ${icons
      .map((iconName) => {
        const pathData = iconPaths[iconName] || 'M12 2L2 22h20L12 2z'
        return `const ${iconName} = ({ size = 24, className = '', strokeWidth = 2, ...props }) => {
        return React.createElement('svg', {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          className: 'lucide lucide-${iconName.toLowerCase()} ' + className,
          ...props
        }, React.createElement('path', { d: '${pathData}' }));
      };`
      })
      .join('\n    ')}
  `
      : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: auto; }
    body { font-family: system-ui, -apple-system, sans-serif; background: transparent; }
    #root { width: 100%; height: 100%; min-height: 100%; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    
    // Console interception
    const originalConsole = { log: console.log, error: console.error, warn: console.warn, info: console.info };
    function sendConsole(level, args) {
       window.parent.postMessage({ type: 'canvas:console', level, message: args.map(String).join(' ') }, '*');
    }
    ['log', 'error', 'warn', 'info'].forEach(l => console[l] = (...args) => { originalConsole[l](...args); sendConsole(l, args); });

    window.onerror = (msg, url, line, col, error) => {
      window.parent.postMessage({ type: 'canvas:error', error: String(msg) }, '*');
      return true;
    };

    ${iconComponents}

    try {
      const originalCode = ${JSON.stringify(code)};
      const userCode = originalCode.replace(/export default/g, 'window.UserComponent =');
      
      const transformedCode = Babel.transform(userCode, { presets: ['react'], filename: 'user-component.jsx' }).code;
      eval(transformedCode);

      if (typeof window.UserComponent !== 'function') throw new Error('UserComponent not defined (must export default)');

      const WrappedComponent = () => {
        useEffect(() => { setTimeout(() => window.parent.postMessage({ type: 'canvas:ready' }, '*'), 100); }, []);
        return React.createElement(window.UserComponent);
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(WrappedComponent));
    } catch (error) {
      window.parent.postMessage({ type: 'canvas:error', error: String(error.message || error) }, '*');
    }
  </script>
</body>
</html>`
}

function sanitizeCode(code: string): { sanitized: string; icons: string[] } {
  const icons: string[] = []
  let sanitized = code

  const lucideMatch = sanitized.match(/import\s*\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/)
  if (lucideMatch) {
    icons.push(
      ...lucideMatch[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
  }

  sanitized = sanitized
    .replace(/import\s+React.*?from\s+['"]react['"];?/g, '')
    .replace(/import\s*\{[^}]*\}\s+from\s+['"]lucide-react['"];?/g, '')
  return { sanitized, icons }
}

export function CodePreviewPanel({
  code,
  artifact,
  activeTab,
  consoleOutput,
  executionError,
  onStatusChange,
  onConsoleOutput,
  onError,
}: CodePreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data
      if (data.type === 'canvas:ready') {
        setIsReady(true)
        onStatusChange('ready')
      } else if (data.type === 'canvas:console') {
        onConsoleOutput([...consoleOutput, `[${data.level}] ${data.message}`].slice(-50))
      } else if (data.type === 'canvas:error') {
        onStatusChange('error')
        onError(data.error)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [consoleOutput, onStatusChange, onConsoleOutput, onError])

  useEffect(() => {
    if (artifact.isStreaming || !code.includes('export default')) {
      onStatusChange('streaming')
      return
    }

    setIsReady(false)
    onStatusChange('executing')

    const { sanitized, icons } = sanitizeCode(code)
    if (iframeRef.current) {
      iframeRef.current.srcdoc = generateIframeHTML(sanitized, icons)
    }
  }, [code, key, artifact.isStreaming]) // eslint-disable-line react-hooks/exhaustive-deps

  if (activeTab === 'console') {
    return (
      <div className="flex-1 bg-background p-4 overflow-auto font-mono text-xs">
        {consoleOutput.length === 0 ? (
          <div className="text-muted-foreground text-center">No logs</div>
        ) : (
          consoleOutput.map((l, i) => <div key={i}>{l}</div>)
        )}
      </div>
    )
  }

  if (activeTab === 'error') {
    return (
      <div className="flex-1 bg-destructive/10 p-4 overflow-auto">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">Execution Error</h3>
            <pre className="text-xs text-destructive mt-2 whitespace-pre-wrap">
              {executionError}
            </pre>
            <button
              onClick={() => setKey((k) => k + 1)}
              className="mt-4 text-xs bg-destructive text-destructive-foreground px-3 py-1 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative bg-background h-full">
      <iframe
        key={key}
        ref={iframeRef}
        sandbox="allow-scripts allow-same-origin allow-modals"
        className="w-full h-full border-0 block"
        title="Preview"
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <span className="animate-pulse">Loading preview...</span>
        </div>
      )}
    </div>
  )
}
