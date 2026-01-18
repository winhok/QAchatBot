import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { rankItem } from '@tanstack/match-sorter-utils'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ChevronRight, FlaskConical, FolderPlus, MessageSquare, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Folder } from '@/schemas'
import type { Session } from '@/types/stores'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { DraggableSessionItem, FolderDialog, FolderItem } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserSection } from '@/components/UserSection'
import {
  useCreateFolder,
  useDeleteFolder,
  useFolders,
  useMoveSession,
  useUpdateFolder,
} from '@/hooks/useFolders'
import { useQuickAction } from '@/hooks/useQuickAction'
import { useDeleteSession, useRenameSession, useSessions } from '@/hooks/useSessions'
import { cn } from '@/lib/utils'
import { useSession } from '@/stores/useSession'
import { getSessionTitle } from '@/utils/session'

/**
 * Filter sessions by search query using fuzzy matching
 */
function filterSessionsByQuery(sessions: Array<Session>, query: string): Array<Session> {
  if (!query.trim()) return sessions

  return sessions
    .map((session) => {
      const title = getSessionTitle(session)
      const ranking = rankItem(title, query, { threshold: 2 })
      return { session, ranking }
    })
    .filter(({ ranking }) => ranking.passed)
    .sort((a, b) => b.ranking.rank - a.ranking.rank)
    .map(({ session }) => session)
}

// Root drop zone component for moving sessions out of folders
function RootDropZone({ children, isOver }: { children: React.ReactNode; isOver: boolean }) {
  return (
    <div
      className={cn(
        'space-y-0.5 min-h-[40px] rounded-sm transition-colors',
        isOver && 'bg-primary/5 ring-1 ring-primary/20',
      )}
    >
      {children}
    </div>
  )
}

export default function SessionSidebar() {
  const navigate = useNavigate()
  const { resetToLobby } = useQuickAction()

  const sessionId = useSession((s) => s.sessionId)
  const setSessionId = useSession((s) => s.setSessionId)
  const renameId = useSession((s) => s.renameId)
  const renameValue = useSession((s) => s.renameValue)
  const setRenameValue = useSession((s) => s.setRenameValue)
  const openRenameModal = useSession((s) => s.openRenameModal)
  const closeRenameModal = useSession((s) => s.closeRenameModal)

  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [draggedSession, setDraggedSession] = useState<Session | null>(null)

  // Folder dialog state
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)

  // Data queries
  const { data: sessions = [] } = useSessions()
  const { data: folders = [] } = useFolders()

  // Mutations
  const deleteMutation = useDeleteSession()
  const renameMutation = useRenameSession()
  const createFolderMutation = useCreateFolder()
  const updateFolderMutation = useUpdateFolder()
  const deleteFolderMutation = useDeleteFolder()
  const moveSessionMutation = useMoveSession()

  // Root droppable for moving sessions out of folders
  const { setNodeRef: setRootRef, isOver: isOverRoot } = useDroppable({
    id: 'root',
    data: { type: 'root' },
  })

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  // Filter out default folder - we don't show it, root sessions go directly in the list
  const userFolders = useMemo(() => {
    return folders.filter((f) => !f.isDefault).sort((a, b) => a.name.localeCompare(b.name))
  }, [folders])

  // Separate root sessions (no folder) from folder sessions
  const { rootSessions, sessionsByFolder } = useMemo(() => {
    const byFolder: Record<string, Array<Session>> = {}
    const root: Array<Session> = []

    // Initialize folders
    userFolders.forEach((f) => {
      byFolder[f.id] = []
    })

    // Group sessions
    sessions.forEach((session) => {
      const folderId = (session as Session & { folderId?: string }).folderId
      if (folderId && folderId in byFolder) {
        byFolder[folderId].push(session)
      } else {
        // No folder or folder doesn't exist (including default folder) -> root
        root.push(session)
      }
    })

    return { rootSessions: root, sessionsByFolder: byFolder }
  }, [sessions, userFolders])

  // Apply search filter to sessions
  const filteredRootSessions = useMemo(
    () => filterSessionsByQuery(rootSessions, searchQuery),
    [rootSessions, searchQuery],
  )

  const filteredSessionsByFolder = useMemo(() => {
    const result: Record<string, Array<Session>> = {}
    Object.entries(sessionsByFolder).forEach(([folderId, folderSessions]) => {
      result[folderId] = filterSessionsByQuery(folderSessions, searchQuery)
    })
    return result
  }, [sessionsByFolder, searchQuery])

  // Check if any sessions match search
  const hasSearchResults = useMemo(() => {
    if (filteredRootSessions.length > 0) return true
    return Object.values(filteredSessionsByFolder).some((s) => s.length > 0)
  }, [filteredRootSessions, filteredSessionsByFolder])

  // Handlers
  const handleNew = () => {
    resetToLobby()
  }

  const handleSelect = (id: string) => {
    setSessionId(id)
    navigate({ to: '/$threadId', params: { threadId: id } })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (id === sessionId) {
          resetToLobby()
        }
      },
    })
  }

  const handleRename = (id: string) => {
    if (!renameValue.trim()) return
    renameMutation.mutate({ id, name: renameValue.trim() }, { onSuccess: closeRenameModal })
  }

  // Folder handlers
  const handleCreateFolder = () => {
    setEditingFolder(null)
    setFolderDialogOpen(true)
  }

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder)
    setFolderDialogOpen(true)
  }

  const handleDeleteFolder = (folderId: string) => {
    deleteFolderMutation.mutate(folderId, {
      onSuccess: () => {
        toast.success('文件夹已删除')
      },
    })
  }

  const handleFolderSubmit = (data: { name: string; color?: string; description?: string }) => {
    if (editingFolder) {
      updateFolderMutation.mutate(
        { id: editingFolder.id, ...data },
        {
          onSuccess: () => {
            setFolderDialogOpen(false)
            toast.success('文件夹已更新')
          },
        },
      )
    } else {
      createFolderMutation.mutate(data, {
        onSuccess: () => {
          setFolderDialogOpen(false)
          toast.success('文件夹已创建')
        },
      })
    }
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeData = active.data.current

    if (activeData?.type === 'session') {
      setDraggedSession(activeData.session)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedSession(null)

    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    if (activeData?.type === 'session') {
      const session = activeData.session as Session
      const currentFolderId = (session as Session & { folderId?: string }).folderId

      // Dropped on a folder
      if (overData?.type === 'folder') {
        const targetFolder = overData.folder as Folder
        if (currentFolderId === targetFolder.id) return

        moveSessionMutation.mutate(
          { folderId: targetFolder.id, sessionId: session.id },
          {
            onSuccess: () => {
              toast.success(`已移动到 ${targetFolder.name}`)
            },
          },
        )
      }
      // Dropped on root (move out of folder)
      else if (overData?.type === 'root') {
        if (!currentFolderId) return // Already at root

        moveSessionMutation.mutate(
          { folderId: null, sessionId: session.id },
          {
            onSuccess: () => {
              toast.success('已移至根目录')
            },
          },
        )
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <aside className="w-64 border-r border-border/50 bg-sidebar/95 backdrop-blur-md h-full flex flex-col font-mono">
        {/* Header Area */}
        <div className="flex items-center gap-3 p-4 pb-2">
          <div className="relative group">
            <div className="absolute inset-0 rounded-sm bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 border border-primary/20 text-primary">
              <FlaskConical className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground tracking-tighter">
              QA<span className="text-primary">BOT</span>_v1
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">系统在线</p>
          </div>
        </div>

        <div className="px-3 py-2">
          <div className="flex items-center gap-2 rounded-sm bg-sidebar-accent/50 border border-transparent focus-within:border-primary/50 px-3 py-2 text-muted-foreground transition-colors">
            <Search className="h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索记录..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50 font-mono"
            />
          </div>
        </div>

        <div className="px-3 py-2 flex gap-2">
          <Button
            onClick={handleNew}
            className="flex-1 justify-center gap-2 rounded-sm bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            新建会话
          </Button>
          <Button
            onClick={handleCreateFolder}
            variant="outline"
            size="icon"
            className="shrink-0 rounded-sm"
            title="新建文件夹"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 px-3 py-2 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              历史索引
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </div>

          <ScrollArea className="flex-1 scrollbar-thin">
            <div className="space-y-2">
              {/* User folders */}
              {userFolders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  sessions={filteredSessionsByFolder[folder.id]}
                  activeSessionId={sessionId}
                  hoveredSessionId={hoveredId}
                  openMenuId={openMenuId}
                  defaultExpanded={true}
                  onSelectSession={handleSelect}
                  onHoverSession={setHoveredId}
                  onMenuOpenChange={setOpenMenuId}
                  onRenameSession={openRenameModal}
                  onDeleteSession={handleDelete}
                  onEditFolder={handleEditFolder}
                  onDeleteFolder={handleDeleteFolder}
                />
              ))}

              {/* Root sessions (no folder) */}
              <div ref={setRootRef}>
                <RootDropZone isOver={isOverRoot}>
                  {filteredRootSessions.length > 0 ? (
                    filteredRootSessions.map((session) => (
                      <DraggableSessionItem
                        key={session.id}
                        session={session}
                        isActive={sessionId === session.id}
                        isHovered={hoveredId === session.id}
                        isMenuOpen={openMenuId === session.id}
                        onSelect={handleSelect}
                        onHover={setHoveredId}
                        onMenuOpenChange={setOpenMenuId}
                        onRename={openRenameModal}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : !searchQuery && userFolders.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-muted-foreground/40 text-xs"
                    >
                      [ 空记录 ]
                    </motion.div>
                  ) : null}
                </RootDropZone>
              </div>

              {/* No search results */}
              {searchQuery && !hasSearchResults && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground/40 text-xs"
                >
                  [ 无匹配项 ]
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 用户区域 */}
        <div className="px-3 py-3 border-t border-border/50 mt-auto">
          <UserSection />
        </div>

        {/* Rename Dialog */}
        <Dialog open={!!renameId} onOpenChange={closeRenameModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>重命名会话 ID</DialogTitle>
              <DialogDescription>输入此会话的新标识符。</DialogDescription>
            </DialogHeader>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="新名称..."
              className="font-mono"
              onKeyDown={(e) => e.key === 'Enter' && renameId && handleRename(renameId)}
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={closeRenameModal}>
                取消
              </Button>
              <Button
                onClick={() => renameId && handleRename(renameId)}
                disabled={renameMutation.isPending || !renameValue.trim()}
              >
                确认
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Folder Dialog */}
        <FolderDialog
          open={folderDialogOpen}
          onOpenChange={setFolderDialogOpen}
          folder={editingFolder}
          onSubmit={handleFolderSubmit}
          isLoading={createFolderMutation.isPending || updateFolderMutation.isPending}
        />
      </aside>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedSession && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs bg-sidebar border border-border rounded-sm shadow-lg">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="truncate">{getSessionTitle(draggedSession)}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
