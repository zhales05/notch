"use client"

import { Pencil, Archive, ArchiveRestore, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ICON_MAP } from "@/components/categories/icon-picker"
import type { HabitWithCategory } from "@/lib/types/habits"
import { getFrequencyLabel } from "@/lib/frequency-utils"

interface HabitCardProps {
  habit: HabitWithCategory
  onEdit: () => void
  onArchive: () => void
  onUnarchive: () => void
}

export function HabitCard({
  habit,
  onEdit,
  onArchive,
  onUnarchive,
}: HabitCardProps) {
  const Icon = ICON_MAP[habit.icon] ?? Check
  const isArchived = habit.archived_at !== null

  return (
    <Card size="sm" className={isArchived ? "opacity-50" : undefined}>
      <CardContent className="flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: habit.color + "20",
            color: habit.color,
          }}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{habit.title}</span>
            {isArchived && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                Archived
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{getFrequencyLabel(habit)}</span>
            {habit.log_type === "value" && habit.unit && (
              <>
                <span>&middot;</span>
                <span>{habit.unit}</span>
              </>
            )}
            {habit.log_type === "time" && (
              <>
                <span>&middot;</span>
                <span>time</span>
              </>
            )}
          </div>
        </div>

        {!isArchived && (
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil />
          </Button>
        )}

        {isArchived ? (
          <Button variant="ghost" size="icon-sm" onClick={onUnarchive}>
            <ArchiveRestore />
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" onClick={onArchive}>
            <Archive />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
