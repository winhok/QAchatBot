'use client'

import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

function Drawer({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  )
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn('fixed inset-0 z-50 bg-black/50', className)}
      {...props}
    />
  )
}

const drawerContentVariants = cva('fixed z-50 flex flex-col bg-background border shadow-lg', {
  variants: {
    direction: {
      bottom: 'inset-x-0 bottom-0 mt-24 rounded-t-2xl border-t max-h-[96vh]',
      top: 'inset-x-0 top-0 mb-24 rounded-b-2xl border-b max-h-[96vh]',
      left: 'inset-y-0 left-0 mr-24 rounded-r-2xl border-r w-[85vw] max-w-sm h-full',
      right: 'inset-y-0 right-0 ml-24 rounded-l-2xl border-l w-[85vw] max-w-sm h-full',
    },
  },
  defaultVariants: {
    direction: 'bottom',
  },
})

function DrawerContent({
  className,
  children,
  direction = 'bottom',
  showHandle = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> &
  VariantProps<typeof drawerContentVariants> & {
    showHandle?: boolean
  }) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(drawerContentVariants({ direction }), className)}
        {...props}
      >
        {showHandle && (direction === 'bottom' || direction === 'top') && (
          <div
            className={cn(
              'mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20',
              direction === 'bottom' ? 'mt-4 mb-2' : 'mb-4 mt-2',
            )}
          />
        )}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
  drawerContentVariants,
}
