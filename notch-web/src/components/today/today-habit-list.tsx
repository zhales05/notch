"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ListChecks, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { HabitLogCard } from "./habit-log-card"
import type { HabitWithLog } from "@/lib/types/logs"

interface TodayHabitListProps {
  habitsWithLogs: HabitWithLog[]
  isLoading: boolean
  completionRates: Map<string, number>
  onToggle: (habitId: string) => void
  onValueChange: (habitId: string, value: number) => void
}

interface CategoryGroup {
  categoryId: string | null
  categoryTitle: string
  habits: HabitWithLog[]
}

export function TodayHabitList({
  habitsWithLogs,
  isLoading,
  completionRates,
  onToggle,
  onValueChange,
}: TodayHabitListProps) {
  const groups = useMemo(() => {
    const map = new Map<string | null, CategoryGroup>()

    for (const h of habitsWithLogs) {
      const key = h.category_id
      if (!map.has(key)) {
        map.set(key, {
          categoryId: key,
          categoryTitle: h.category?.title ?? "Uncategorized",
          habits: [],
        })
      }
      map.get(key)!.habits.push(h)
    }

    return Array.from(map.values())
  }, [habitsWithLogs])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[60px] rounded-xl" />
        ))}
      </div>
    )
  }

  if (habitsWithLogs.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <ListChecks className="size-6 text-muted-foreground" />
        </div>
        <h2 className="mt-4 font-medium">No habits for today</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create habits on the Habits page to start tracking.
        </p>
        <Link
          href="/habits"
          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Create Habit
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.categoryId ?? "uncategorized"}>
          <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {group.categoryTitle}
          </h3>
          <div className="flex flex-col gap-2">
            {group.habits.map((habit) => (
              <HabitLogCard
                key={habit.id}
                habit={habit}
                completionRate={completionRates.get(habit.id) ?? null}
                onToggle={() => onToggle(habit.id)}
                onValueChange={(value) => onValueChange(habit.id, value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
