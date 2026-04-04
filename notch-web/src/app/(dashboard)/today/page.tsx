"use client"

import { useMemo, useState } from "react"
import { formatDateKey } from "@/lib/date-utils"
import { useTodayHabits } from "@/hooks/use-today-habits"
import { useWeekSummary } from "@/hooks/use-week-summary"
import { useCompletionRates } from "@/hooks/use-completion-rates"
import { DateSelector } from "@/components/today/date-selector"
import { TodaySummary } from "@/components/today/today-summary"
import { WeekChart } from "@/components/today/week-chart"
import { TodayHabitList } from "@/components/today/today-habit-list"

export default function TodayPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const dateKey = formatDateKey(selectedDate)

  const {
    habitsWithLogs,
    completedCount,
    totalCount,
    categoryProgress,
    isLoading,
    error,
    toggleBoolean,
    updateValue,
  } = useTodayHabits(dateKey)

  const { data: weekData, isLoading: weekLoading } = useWeekSummary(
    dateKey,
    totalCount
  )

  const habitIds = useMemo(
    () => habitsWithLogs.map((h) => h.id),
    [habitsWithLogs]
  )
  const { rates: completionRates } = useCompletionRates(habitIds)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Today</h1>
        <DateSelector date={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!isLoading && totalCount > 0 && (
        <TodaySummary
          completed={completedCount}
          total={totalCount}
          categoryProgress={categoryProgress}
        />
      )}

      <WeekChart data={weekData} isLoading={weekLoading} />

      <TodayHabitList
        habitsWithLogs={habitsWithLogs}
        isLoading={isLoading}
        completionRates={completionRates}
        onToggle={toggleBoolean}
        onValueChange={updateValue}
      />
    </div>
  )
}
