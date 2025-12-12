'use client'

import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/app/components/ui/dropdown-menu'
import { Bell, Settings, ChevronDown, Sparkles, Wrench, Database, Globe } from 'lucide-react'

const models = [
  { id: 'qwen-plus', name: 'Qwen Plus', badge: '推荐', description: '强大的语言模型' },
  { id: 'gpt-4', name: 'GPT-4', description: '稳定可靠' },
]

const tools = [
  { id: 'stategraph', name: 'StateGraph', icon: Globe, enabled: true },
  { id: 'database', name: 'Database Query', icon: Database, enabled: true },
  { id: 'playwright', name: 'Playwright', icon: Wrench, enabled: false },
]

export function ChatHeader() {
  const selectedModel = 'qwen-plus'
  const currentModel = models.find(m => m.id === selectedModel) || models[0]
  const enabledToolsCount = tools.filter(t => t.enabled).length

  return (
    <header className='flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 sticky top-0 z-10'>
      <div className='flex items-center gap-3'>
        {/* Model Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='gap-2 text-foreground hover:bg-accent rounded-xl h-9 px-3'>
              <div className='flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20'>
                <Sparkles className='h-3.5 w-3.5 text-emerald-400' />
              </div>
              <span className='font-medium'>{currentModel.name}</span>
              <ChevronDown className='h-4 w-4 text-muted-foreground' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-56'>
            <DropdownMenuLabel className='text-xs text-muted-foreground'>选择模型</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {models.map(model => (
              <DropdownMenuItem
                key={model.id}
                className='flex flex-col items-start gap-0.5 py-2.5'
              >
                <div className='flex items-center gap-2 w-full'>
                  <Sparkles className='h-4 w-4 text-emerald-400' />
                  <span className='font-medium'>{model.name}</span>
                  {model.badge && (
                    <Badge
                      variant='secondary'
                      className='ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 border-0'
                    >
                      {model.badge}
                    </Badge>
                  )}
                </div>
                <span className='text-xs text-muted-foreground ml-6'>{model.description}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className='h-5 w-px bg-border' />

        {/* Tools Indicator */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='gap-2 text-muted-foreground hover:text-foreground rounded-xl h-9'
            >
              <div className='relative'>
                <Wrench className='h-4 w-4' />
                <span className='absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white'>
                  {enabledToolsCount}
                </span>
              </div>
              <span className='text-sm'>工具</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-56'>
            <DropdownMenuLabel className='text-xs text-muted-foreground'>已启用工具</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tools.map(tool => (
              <DropdownMenuItem key={tool.id} className='flex items-center justify-between py-2.5'>
                <div className='flex items-center gap-2.5'>
                  <div className={`rounded-lg p-1.5 ${tool.enabled ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                    <tool.icon className={`h-4 w-4 ${tool.enabled ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                  </div>
                  <span>{tool.name}</span>
                </div>
                <div className={`h-2 w-2 rounded-full ${tool.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Actions */}
      <div className='flex items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          className='text-muted-foreground hover:text-foreground relative rounded-xl h-9 w-9'
        >
          <Bell className='h-4 w-4' />
          <span className='absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background' />
        </Button>
        <Button variant='ghost' size='icon' className='text-muted-foreground hover:text-foreground rounded-xl h-9 w-9'>
          <Settings className='h-4 w-4' />
        </Button>
      </div>
    </header>
  )
}
