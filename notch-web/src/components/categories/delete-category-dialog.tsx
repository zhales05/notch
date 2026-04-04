"use client"

import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Category } from "@/lib/types/categories"

interface DeleteCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onConfirm: () => Promise<void>
  getHabitCount: (categoryId: string) => Promise<number>
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onConfirm,
  getHabitCount,
}: DeleteCategoryDialogProps) {
  const [habitCount, setHabitCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open && category) {
      setIsLoading(true)
      setHabitCount(null)
      getHabitCount(category.id).then((count) => {
        setHabitCount(count)
        setIsLoading(false)
      })
    }
  }, [open, category, getHabitCount])

  const hasHabits = habitCount !== null && habitCount > 0
  const canDelete = !isLoading && !hasHabits

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            {isLoading
              ? "Checking for linked habits..."
              : hasHabits
                ? `This category has ${habitCount} habit${habitCount === 1 ? "" : "s"}. Remove or reassign them before deleting.`
                : `Are you sure you want to delete "${category?.title}"? This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!canDelete || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
