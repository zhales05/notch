"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDisplayDate, isToday } from "@/lib/date-utils"

interface DateSelectorProps {
  date: Date
  onDateChange: (date: Date) => void
}

export function DateSelector({ date, onDateChange }: DateSelectorProps) {
  function goBack() {
    const prev = new Date(date)
    prev.setDate(prev.getDate() - 1)
    onDateChange(prev)
  }

  function goForward() {
    const next = new Date(date)
    next.setDate(next.getDate() + 1)
    onDateChange(next)
  }

  const today = isToday(date)

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={goBack}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[120px] text-center text-sm font-medium">
        {today ? "Today" : formatDisplayDate(date)}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={goForward}
        disabled={today}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
