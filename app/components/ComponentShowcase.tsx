'use client'

import { useState } from 'react'
import { Brain, Code, Zap, Rocket, FileText, Settings } from 'lucide-react'
import { ToolCallBlock } from './ToolCallBlock'
import { ApiResultBlock } from './ApiResultBlock'
import { FeatureCard } from './FeatureCard'
import { AiOrb } from './AiOrb'

export function ComponentShowcase() {
  const [isThinking, setIsThinking] = useState(false)

  return (
    <div className='space-y-6 p-6'>
      <div className='text-center mb-8'>
        <h2 className='text-2xl font-bold text-white mb-2'>组件展示</h2>
        <p className='text-purple-200 text-sm'>优化后的 UI 组件库</p>
      </div>

      {/* AI Orb Demo */}
      <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6'>
        <h3 className='text-white font-semibold mb-4 flex items-center gap-2'>
          <Zap className='h-5 w-5 text-yellow-400' />
          AI 可视化指示器
        </h3>
        <div className='flex items-center justify-center gap-8'>
          <div className='text-center'>
            <AiOrb size={80} isThinking={false} />
            <p className='text-purple-200 text-xs mt-2'>静态状态</p>
          </div>
          <div className='text-center'>
            <AiOrb size={80} isThinking={isThinking} />
            <p className='text-purple-200 text-xs mt-2'>思考状态</p>
          </div>
        </div>
        <div className='mt-4 text-center'>
          <button
            onClick={() => setIsThinking(!isThinking)}
            className='px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 shadow-md'
          >
            {isThinking ? '停止思考' : '开始思考'}
          </button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6'>
        <h3 className='text-white font-semibold mb-4 flex items-center gap-2'>
          <Rocket className='h-5 w-5 text-purple-400' />
          功能卡片
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FeatureCard
            icon={Brain}
            title='智能分析'
            description='使用 AI 进行深度数据分析'
            onClick={() => alert('功能已点击')}
            badge='热门'
          />
          <FeatureCard
            icon={Code}
            title='代码生成'
            description='自动生成高质量代码'
            onClick={() => alert('功能已点击')}
          />
          <FeatureCard
            icon={FileText}
            title='文档处理'
            description='智能文档理解与生成'
            comingSoon
          />
          <FeatureCard
            icon={Settings}
            title='高级设置'
            description='自定义配置选项'
            disabled
          />
        </div>
      </div>

      {/* Tool Call Block */}
      <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6'>
        <h3 className='text-white font-semibold mb-4 flex items-center gap-2'>
          <Code className='h-5 w-5 text-cyan-400' />
          工具调用示例
        </h3>
        <ToolCallBlock
          toolName='search_api'
          input={{ query: 'AI 最新进展', limit: 10 }}
          output={{ results: ['Result 1', 'Result 2', 'Result 3'], total: 3 }}
          status='success'
        />
        <ToolCallBlock
          toolName='database_query'
          input='SELECT * FROM users WHERE active = true'
          status='pending'
        />
      </div>

      {/* API Result Block */}
      <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6'>
        <h3 className='text-white font-semibold mb-4 flex items-center gap-2'>
          <FileText className='h-5 w-5 text-green-400' />
          API 响应示例
        </h3>
        <ApiResultBlock
          endpoint='/api/users'
          method='GET'
          statusCode={200}
          responseTime={145}
          data={{
            users: [
              { id: 1, name: 'Alice', email: 'alice@example.com' },
              { id: 2, name: 'Bob', email: 'bob@example.com' },
            ],
            total: 2,
            page: 1,
          }}
        />
        <div className='mt-4'>
          <ApiResultBlock
            endpoint='/api/posts'
            method='POST'
            statusCode={201}
            responseTime={89}
            data={{
              id: 123,
              title: 'New Post',
              content: 'This is a sample post content that demonstrates the API result block component.',
              created_at: '2025-12-12T07:00:00Z',
            }}
          />
        </div>
      </div>
    </div>
  )
}
