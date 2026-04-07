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
import type { MeasureWithCategory } from "@/lib/types/measures"

interface ArchiveMeasureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  measure: MeasureWithCategory | null
  onConfirm: () => Promise<void>
}

export function ArchiveMeasureDialog({
  open,
  onOpenChange,
  measure,
  onConfirm,
}: ArchiveMeasureDialogProps) {
  const [isArchiving, setIsArchiving] = useState(false)

  async function handleArchive() {
    setIsArchiving(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Measure</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive &ldquo;{measure?.title}&rdquo;? You
            can restore it later from the archived view.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isArchiving} onClick={handleArchive}>
            {isArchiving ? "Archiving..." : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
