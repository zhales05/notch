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
import type { Category } from "@/lib/types/categories"
import type { MeasureWithCategory, MeasureFormData } from "@/lib/types/measures"

interface MeasureFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  measure: MeasureWithCategory | null
  categories: Category[]
  onSubmit: (data: MeasureFormData) => Promise<void>
}

export function MeasureFormDialog({
  open,
  onOpenChange,
  measure,
  categories,
  onSubmit,
}: MeasureFormDialogProps) {
  const [title, setTitle] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [unit, setUnit] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [icon, setIcon] = useState("gauge")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = measure !== null

  useEffect(() => {
    if (open) {
      if (measure) {
        setTitle(measure.title)
        setCategoryId(measure.category_id)
        setUnit(measure.unit ?? "")
        setColor(measure.color)
        setIcon(measure.icon)
      } else {
        setTitle("")
        setCategoryId(null)
        setUnit("")
        setColor("#6366f1")
        setIcon("gauge")
      }
      setError(null)
    }
  }, [open, measure])

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
      await onSubmit({
        title: trimmed,
        category_id: categoryId,
        unit: unit.trim(),
        color,
        icon,
      })
      onOpenChange(false)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Measure" : "New Measure"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your measure details."
              : "Track a metric like sleep, steps, or screen time."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="grid max-h-[60vh] gap-4 overflow-y-auto px-1"
        >
          <div className="grid gap-2">
            <Label htmlFor="measure-title">Title</Label>
            <Input
              id="measure-title"
              placeholder="e.g. Hours of Sleep, Step Count"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="measure-unit">Unit</Label>
            <Input
              id="measure-unit"
              placeholder="e.g. hours, steps, minutes"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="measure-category">Category</Label>
            <select
              id="measure-category"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
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
                  : "Create Measure"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
