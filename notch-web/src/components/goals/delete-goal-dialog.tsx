"use client"

import { useState } from "react"
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
import type { GoalWithCategory } from "@/lib/types/goals"

interface DeleteGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: GoalWithCategory | null
  onConfirm: () => Promise<void>
}

export function DeleteGoalDialog({
  open,
  onOpenChange,
  goal,
  onConfirm,
}: DeleteGoalDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

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
          <AlertDialogTitle>Delete Goal</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{goal?.title}&rdquo;? This
            action cannot be undone. All linked habit associations will be
            removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
