import { useDroppable } from '@dnd-kit/core'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Folder, FolderOpen, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DraggableSessionItem } from './DraggableSessionItem'
import type { Folder as FolderType } from '@/schemas'
import type { Session } from '@/types/stores'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface FolderItemProps {
  folder: FolderType
  sessions: Array<Session>
  activeSessionId: string | null
  hoveredSessionId: string | null
  openMenuId: string | null
  defaultExpanded?: boolean
  onSelectSession: (id: string) => void
  onHoverSession: (id: string | null) => void
  onMenuOpenChange: (id: string | null) => void
  onRenameSession: (id: string, name: string) => void
  onDeleteSession: (id: string) => void
  onEditFolder: (folder: FolderType) => void
  onDeleteFolder: (id: string) => void
}

export function FolderItem({
  folder,
  sessions,
  activeSessionId,
  hoveredSessionId,
  openMenuId,
  defaultExpanded = true,
  onSelectSession,
  onHoverSession,
  onMenuOpenChange,
  onRenameSession,
  onDeleteSession,
  onEditFolder,
  onDeleteFolder,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isHovered, setIsHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: {
      type: 'folder',
      folder,
    },
  })

  const folderColor = folder.color || 'hsl(var(--primary))'

  return (
    <div className="mb-1">
      {/* Folder header */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-sm cursor-pointer transition-all',
          'hover:bg-sidebar-accent group',
          isOver && 'bg-primary/10 ring-1 ring-primary/30',
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0"
        >
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </motion.div>

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0" style={{ color: folderColor }} />
        ) : (
          <Folder className="h-4 w-4 shrink-0" style={{ color: folderColor }} />
        )}

        <span className="text-xs font-medium truncate flex-1 text-foreground/90">
          {folder.name}
        </span>

        <span className="text-[10px] text-muted-foreground tabular-nums">{sessions.length}</span>

        <AnimatePresence>
          {(isHovered || isMenuOpen) && !folder.isDefault && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-sm p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-primary transition-colors">
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 font-mono">
                  <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                    <Pencil className="mr-2 h-3 w-3" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteFolder(folder.id)}
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

      {/* Sessions list */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-4 pr-1 py-0.5 space-y-0.5">
              {sessions.length === 0 ? (
                <div className="text-[10px] text-muted-foreground/50 py-2 px-2 text-center">
                  [ 空文件夹 ]
                </div>
              ) : (
                sessions.map((session) => (
                  <DraggableSessionItem
                    key={session.id}
                    session={session}
                    isActive={activeSessionId === session.id}
                    isHovered={hoveredSessionId === session.id}
                    isMenuOpen={openMenuId === session.id}
                    onSelect={onSelectSession}
                    onHover={onHoverSession}
                    onMenuOpenChange={onMenuOpenChange}
                    onRename={onRenameSession}
                    onDelete={onDeleteSession}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
