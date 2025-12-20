'use client'

import 'highlight.js/styles/github-dark.css'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from '@/app/components/CodeBlock'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const components: Components = {
    code({ className, children, ...props }) {
      const text = Array.isArray(children) ? children.join('') : String(children ?? '')
      const isBlock = (className && className.includes('language-')) || text.includes('\n')

      if (isBlock) {
        return <CodeBlock code={text.replace(/\n$/, '')} className={className} />
      }
      return (
        <code className={`${className} break-all bg-muted/50 px-1.5 py-0.5 rounded text-sm`} style={{ wordBreak: 'break-all' }} {...props}>
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
        <div className='overflow-hidden'>
          <table className='table-fixed w-full' style={{ tableLayout: 'fixed', wordBreak: 'break-word' }} {...props}>
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
    p({ children, ...props }) {
      return (
        <p style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props}>
          {children}
        </p>
      )
    },
    h1({ children, ...props }) {
      return (
        <h1 style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props}>
          {children}
        </h1>
      )
    },
    h2({ children, ...props }) {
      return (
        <h2 style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props}>
          {children}
        </h2>
      )
    },
    h3({ children, ...props }) {
      return (
        <h3 style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props}>
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
