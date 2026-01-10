'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { XIcon } from 'lucide-react'
import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { cn } from '@/lib/utils'
import { dialogVariants, overlayVariants } from '@/lib/motion'

const MOBILE_BREAKPOINT = 768

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

interface ResponsiveDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
        {children}
      </DrawerPrimitive.Root>
    )
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  )
}

function ResponsiveDialogTrigger({
  children,
  asChild,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  const isMobile = useIsMobile()
  const Comp = isMobile ? DrawerPrimitive.Trigger : DialogPrimitive.Trigger

  return (
    <Comp asChild={asChild} {...props}>
      {children}
    </Comp>
  )
}

interface ResponsiveDialogContentProps {
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

function ResponsiveDialogContent({
  children,
  className,
  showCloseButton = true,
}: ResponsiveDialogContentProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerPrimitive.Portal>
        <AnimatePresence>
          <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit">
            <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          </motion.div>
        </AnimatePresence>
        <DrawerPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[96vh] flex-col rounded-t-2xl border-t bg-background shadow-xl',
            className,
          )}
        >
          <div className="mx-auto mt-4 mb-2 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          <div className="flex-1 overflow-auto p-6">{children}</div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    )
  }

  return (
    <DialogPrimitive.Portal>
      <AnimatePresence>
        <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit">
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        </motion.div>
      </AnimatePresence>
      <DialogPrimitive.Content asChild>
        <motion.div
          variants={dialogVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border bg-background p-6 shadow-xl',
            className,
          )}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <XIcon className="h-4 w-4" />
              <span className="sr-only">关闭</span>
            </DialogPrimitive.Close>
          )}
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function ResponsiveDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-2 text-center sm:text-left', className)} {...props} />
  )
}

function ResponsiveDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function ResponsiveDialogTitle({ className, children, ...props }: React.ComponentProps<'h2'>) {
  const isMobile = useIsMobile()
  const Comp = isMobile ? DrawerPrimitive.Title : DialogPrimitive.Title

  return (
    <Comp className={cn('text-lg font-semibold leading-none', className)} {...props}>
      {children}
    </Comp>
  )
}

function ResponsiveDialogDescription({ className, children, ...props }: React.ComponentProps<'p'>) {
  const isMobile = useIsMobile()
  const Comp = isMobile ? DrawerPrimitive.Description : DialogPrimitive.Description

  return (
    <Comp className={cn('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </Comp>
  )
}

function ResponsiveDialogClose({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  const isMobile = useIsMobile()
  const Comp = isMobile ? DrawerPrimitive.Close : DialogPrimitive.Close

  return <Comp {...props}>{children}</Comp>
}

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
  useIsMobile,
}
