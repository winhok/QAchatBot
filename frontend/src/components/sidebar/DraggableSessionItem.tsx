import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import {
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  TestTube2,
  Trash2,
} from 'lucide-react'
import type { Session } from '@/types/stores'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { getSessionTitle } from '@/utils/session'

interface DraggableSessionItemProps {
  session: Session
  isActive: boolean
  isHovered: boolean
  isMenuOpen: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onMenuOpenChange: (id: string | null) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

function getTypeIcon(type: string | undefined): React.ReactNode {
  switch (type) {
    case 'testcase':
      return <TestTube2 className="h-4 w-4 text-primary shrink-0" />
    default:
      return <MessageSquare className="h-4 w-4 text-primary shrink-0" />
  }
}

export function DraggableSessionItem({
  session,
  isActive,
  isHovered,
  isMenuOpen,
  onSelect,
  onHover,
  onMenuOpenChange,
  onRename,
  onDelete,
}: DraggableSessionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id,
    data: {
      type: 'session',
      session,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative group', isDragging && 'z-50 opacity-80')}
      onMouseEnter={() => onHover(session.id)}
      onMouseLeave={() => onHover(null)}
    >
      <motion.button
        onClick={() => onSelect(session.id)}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-xs transition-all border-l-2',
          isActive
            ? 'border-primary bg-primary/10 text-primary shadow-sm'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
          isDragging && 'shadow-lg ring-2 ring-primary/20',
        )}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sidebar-accent',
            isDragging && 'opacity-100',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>

        {getTypeIcon(session.type)}
        <span className="truncate flex-1 text-left tracking-tight">{getSessionTitle(session)}</span>
      </motion.button>

      <AnimatePresence>
        {(isHovered || isMenuOpen) && !isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <DropdownMenu
              open={isMenuOpen}
              onOpenChange={(open) => onMenuOpenChange(open ? session.id : null)}
            >
              <DropdownMenuTrigger asChild>
                <button className="rounded-sm p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-primary transition-colors">
                  <MoreHorizontal className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 font-mono">
                <DropdownMenuItem onClick={() => onRename(session.id, getSessionTitle(session))}>
                  <Pencil className="mr-2 h-3 w-3" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(session.id)}
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
