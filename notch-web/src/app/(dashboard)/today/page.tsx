"use client"

import { useCallback, useMemo, useState } from "react"
import { formatDateKey } from "@/lib/date-utils"
import { useTodayHabits } from "@/hooks/use-today-habits"
import { useWeekSummary } from "@/hooks/use-week-summary"
import { useCompletionRates } from "@/hooks/use-completion-rates"
import { useMeasures } from "@/hooks/use-measures"
import { useMeasureLogs } from "@/hooks/use-measure-logs"
import { DateSelector } from "@/components/today/date-selector"
import { TodaySummary } from "@/components/today/today-summary"
import { WeekChart } from "@/components/today/week-chart"
import { TodayHabitList } from "@/components/today/today-habit-list"
import { TodayMeasureList } from "@/components/today/today-measure-list"
import { Separator } from "@/components/ui/separator"
import type { MeasureWithLog } from "@/lib/types/measures"

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

  const habitsForRates = useMemo(
    () => habitsWithLogs.map((h) => ({ id: h.id, start_date: h.start_date })),
    [habitsWithLogs]
  )
  const { rates: completionRates } = useCompletionRates(habitsForRates)

  // Measures
  const { measures, isLoading: measuresLoading } = useMeasures()
  const {
    logs: measureLogs,
    isLoading: measureLogsLoading,
    upsertLog: upsertMeasureLog,
    deleteLog: deleteMeasureLog,
  } = useMeasureLogs(dateKey)

  const activeMeasures = useMemo(
    () => measures.filter((m) => !m.archived_at),
    [measures]
  )

  const measuresWithLogs: MeasureWithLog[] = useMemo(
    () =>
      activeMeasures.map((measure) => ({
        ...measure,
        log: measureLogs.find((l) => l.measure_id === measure.id) ?? null,
      })),
    [activeMeasures, measureLogs]
  )

  const handleMeasureValueChange = useCallback(
    async (measureId: string, value: number) => {
      if (value === 0 || isNaN(value)) {
        await deleteMeasureLog(measureId)
      } else {
        await upsertMeasureLog(measureId, value)
      }
    },
    [upsertMeasureLog, deleteMeasureLog]
  )

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

      <Separator />

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Measures
        </h2>
        <TodayMeasureList
          measuresWithLogs={measuresWithLogs}
          isLoading={measuresLoading || measureLogsLoading}
          onValueChange={handleMeasureValueChange}
        />
      </div>
    </div>
  )
}
