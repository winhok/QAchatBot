import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { FlaskConical, ArrowLeft, Construction } from 'lucide-react'

export default function NotFound() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-background'>
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
          <div className='h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-3xl' />
        </div>
      </div>

      <div className='relative z-10 flex flex-col items-center text-center px-4'>
        <div className='relative mb-8'>
          <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 blur-xl opacity-50' />
          <div className='relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl'>
            <FlaskConical className='h-10 w-10 text-white' />
          </div>
        </div>

        <div className='mb-4 text-8xl font-bold'>
          <span className='bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent'>404</span>
        </div>

        <h1 className='mb-2 text-2xl font-bold text-foreground'>功能开发中</h1>

        <p className='mb-8 max-w-md text-muted-foreground'>
          该功能模块正在紧张开发中，敬请期待！您可以先使用已上线的
          <span className='text-emerald-400'>普通聊天</span>和
          <span className='text-teal-400'>测试用例设计</span>功能。
        </p>

        <div className='mb-8 flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-amber-400'>
          <Construction className='h-4 w-4' />
          <span className='text-sm font-medium'>Coming Soon</span>
        </div>

        <Link href='/'>
          <Button className='gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40'>
            <ArrowLeft className='h-4 w-4' />
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  )
}
