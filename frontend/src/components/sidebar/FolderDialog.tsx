import { useEffect, useState } from 'react'
import type { Folder } from '@/schemas'
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
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const DEFAULT_COLOR = 'hsl(var(--primary))'

const FOLDER_COLORS = [
  { name: 'Default', value: DEFAULT_COLOR },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
] as const

interface FolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder?: Folder | null
  onSubmit: (data: { name: string; color?: string; description?: string }) => void
  isLoading?: boolean
}

export function FolderDialog({
  open,
  onOpenChange,
  folder,
  onSubmit,
  isLoading = false,
}: FolderDialogProps): React.ReactNode {
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [description, setDescription] = useState('')

  const isEditing = Boolean(folder)

  // Sync form state when folder changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(folder?.name ?? '')
      setColor(folder?.color ?? DEFAULT_COLOR)
      setDescription(folder?.description ?? '')
    }
  }, [open, folder])

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    onSubmit({
      name: trimmedName,
      color: color === DEFAULT_COLOR ? undefined : color,
      description: description.trim() || undefined,
    })
  }

  function getSubmitButtonText(): string {
    if (isLoading) return '保存中…'
    return isEditing ? '保存' : '创建'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? '编辑文件夹' : '新建文件夹'}</DialogTitle>
            <DialogDescription>
              {isEditing ? '修改文件夹的名称和颜色' : '创建一个新文件夹来组织你的会话'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">名称</Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入文件夹名称…"
                className="font-mono"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label>颜色</Label>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all',
                      color === c.value
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:border-muted-foreground/30',
                    )}
                    style={{ backgroundColor: c.value }}
                    aria-label={`选择${c.name}颜色`}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="folder-description">描述 (可选)</Label>
              <Input
                id="folder-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="添加描述…"
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {getSubmitButtonText()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
