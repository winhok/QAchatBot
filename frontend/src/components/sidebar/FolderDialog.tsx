import { useState } from 'react'
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

// Predefined folder colors
const FOLDER_COLORS = [
  { name: 'Default', value: 'hsl(var(--primary))' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
]

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
  isLoading,
}: FolderDialogProps) {
  const isEditing = !!folder
  const [name, setName] = useState(folder?.name || '')
  const [color, setColor] = useState(folder?.color || FOLDER_COLORS[0].value)
  const [description, setDescription] = useState(folder?.description || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      color: color === FOLDER_COLORS[0].value ? undefined : color,
      description: description.trim() || undefined,
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form when closing
      setName(folder?.name || '')
      setColor(folder?.color || FOLDER_COLORS[0].value)
      setDescription(folder?.description || '')
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                placeholder="输入文件夹名称..."
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
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      color === c.value
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
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
                placeholder="添加描述..."
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? '保存中...' : isEditing ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
