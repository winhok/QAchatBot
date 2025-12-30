import { CodeBlock } from '@/components/CodeBlock'
import { CanvasTitleCard } from '@/components/canvas/CanvasTitleCard'
import { useCanvasArtifacts } from '@/stores/useCanvasArtifacts'
import 'highlight.js/styles/github-dark.css'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
  messageId?: string // Added to link artifacts to specific messages
}

export function MarkdownRenderer({
  content,
  className = '',
  messageId,
}: MarkdownRendererProps) {
  const { getArtifact, setIsCanvasVisible, setActiveArtifactId } = useCanvasArtifacts()

  const handleOpenArtifact = (artifactId: string) => {
    setActiveArtifactId(artifactId)
    setIsCanvasVisible(true, 'preview')
  }

  const components: Components = {
    // Custom handling for canvasartifact tag
    // @ts-ignore
    canvasartifact: ({ node, ...props }: any) => {
        const artifactId = props.id
        // Try to get fully parsed artifact from store first
        const artifact = messageId ? getArtifact(messageId, artifactId) : undefined

         // Fallback display if store doesn't have it yet (or just metadata from tag)
        const displayArtifact = artifact || {
              id: artifactId,
              type: props.type || 'component',
              title: props.title || 'Untitled Component',
              code: { language: 'jsx', content: '' },
              status: 'creating',
              isStreaming: true,
              messageId: messageId || '',
              sessionId: '',
              currentVersion: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            }

        return (
            <CanvasTitleCard 
                artifact={displayArtifact}
                onOpen={handleOpenArtifact}
            />
        )
    },
    code({ className: codeClassName, children, ...props }) {
      const text = Array.isArray(children)
        ? children.join('')
        : String(children ?? '')
      const isBlock =
        (codeClassName && codeClassName.includes('language-')) ||
        text.includes('\n')

      if (isBlock) {
        return (
          <CodeBlock code={text.replace(/\n$/, '')} className={codeClassName} />
        )
      }
      return (
        <code
          className={`${codeClassName} break-all bg-muted/50 px-1.5 py-0.5 rounded text-sm`}
          style={{ wordBreak: 'break-all' }}
          {...props}
        >
          {children}
        </code>
      )
    },
    pre({ children }) {
      // pre 标签直接返回 children，因为 CodeBlock 已经处理了容器
      return <>{children}</>
    },
    table({ children, ...props }) {
      return (
        <div className="overflow-hidden">
          <table
            className="table-fixed w-full"
            style={{ tableLayout: 'fixed', wordBreak: 'break-word' }}
            {...props}
          >
            {children}
          </table>
        </div>
      )
    },
    th({ children, ...props }) {
      return (
        <th style={{ wordBreak: 'break-word', maxWidth: '200px' }} {...props}>
          {children}
        </th>
      )
    },
    td({ children, ...props }) {
      return (
        <td style={{ wordBreak: 'break-word', maxWidth: '200px' }} {...props}>
          {children}
        </td>
      )
    },
    p({ children, ...props }: any) {
       // Check if children contain canvasartifact
      const hasCanvasArtifact = props.node?.children?.some(
        (child: any) =>
          child.type === 'element' && child.tagName === 'canvasartifact'
      )
      
      if (hasCanvasArtifact) {
        return <div {...props}>{children}</div>
      }
      return (
        <p
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
          {...props}
        >
          {children}
        </p>
      )
    },
    h1({ children, ...props }) {
      return (
        <h1
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
          {...props}
        >
          {children}
        </h1>
      )
    },
    h2({ children, ...props }) {
      return (
        <h2
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
          {...props}
        >
          {children}
        </h2>
      )
    },
    h3({ children, ...props }) {
      return (
        <h3
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
          {...props}
        >
          {children}
        </h3>
      )
    },
  }

  return (
    <div className={`markdown-body ${className} max-w-full overflow-hidden`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
