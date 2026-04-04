"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ColorPicker } from "@/components/categories/color-picker"
import { IconPicker } from "@/components/categories/icon-picker"
import type { Category, CategoryFormData } from "@/lib/types/categories"

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onSubmit: (data: CategoryFormData) => Promise<void>
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
}: CategoryFormDialogProps) {
  const [title, setTitle] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [icon, setIcon] = useState("folder")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = category !== null

  useEffect(() => {
    if (open) {
      if (category) {
        setTitle(category.title)
        setColor(category.color)
        setIcon(category.icon)
      } else {
        setTitle("")
        setColor("#6366f1")
        setIcon("folder")
      }
      setError(null)
    }
  }, [open, category])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmed = title.trim()
    if (!trimmed) {
      setError("Title is required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({ title: trimmed, color, icon })
      onOpenChange(false)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category" : "New Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your category details."
              : "Create a new category to organize your habits."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="category-title">Title</Label>
            <Input
              id="category-title"
              placeholder="e.g. Health, Work, Learning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="grid gap-2">
            <Label>Icon</Label>
            <IconPicker value={icon} onChange={setIcon} color={color} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
