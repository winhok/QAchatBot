'use client'

import { Spinner } from '@/app/components/ui/spinner'

export function LoadingIndicator() {
  return (
    <div className='flex items-center gap-2 rounded-2xl bg-muted px-4 py-3'>
      <Spinner className='h-4 w-4 text-emerald-400' />
      <span className='text-sm text-muted-foreground'>正在思考...</span>
    </div>
  )
}
