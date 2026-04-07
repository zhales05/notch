"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useHabits } from "@/hooks/use-habits"
import { useProfile } from "@/hooks/use-profile"
import { useHabitStats } from "@/hooks/use-habit-stats"
import { useCategoryStats } from "@/hooks/use-category-stats"
import { useMeasures } from "@/hooks/use-measures"
import { useMeasureStats } from "@/hooks/use-measure-stats"
import { DateRangeToggle } from "@/components/analytics/date-range-toggle"
import { HabitSelectorPills } from "@/components/analytics/habit-selector-pills"
import { MeasureSelectorPills } from "@/components/analytics/measure-selector-pills"
import { StatCard } from "@/components/analytics/stat-card"
import { HeatmapCard } from "@/components/analytics/heatmap-card"
import { WeeklyTrendCard } from "@/components/analytics/weekly-trend-card"
import { MonthlyBarCard } from "@/components/analytics/monthly-bar-card"
import { CategoryStatsList } from "@/components/analytics/category-stats-list"
import type { DateRange } from "@/lib/types/analytics"

type Tab = "habit" | "category" | "measures"

export default function AnalyticsPage() {
  const { profile } = useProfile()
  const isFreeUser = profile?.plan === "free"

  const { habits, isLoading: habitsLoading } = useHabits()
  const activeHabits = useMemo(
    () => habits.filter((h) => !h.archived_at),
    [habits]
  )

  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const effectiveDateRange = isFreeUser ? "30d" : dateRange
  const [activeTab, setActiveTab] = useState<Tab>("habit")
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null)

  // Auto-select first habit once loaded
  const effectiveHabitId = selectedHabitId ?? activeHabits[0]?.id ?? null
  const selectedHabit = activeHabits.find((h) => h.id === effectiveHabitId)

  const { stats, isLoading: statsLoading } = useHabitStats(
    effectiveHabitId,
    effectiveDateRange,
    selectedHabit?.created_at
  )

  const { categoryStats, isLoading: categoryLoading } =
    useCategoryStats(effectiveDateRange)

  // Measures
  const { measures } = useMeasures()
  const activeMeasures = useMemo(
    () => measures.filter((m) => !m.archived_at),
    [measures]
  )
  const effectiveMeasureId = selectedMeasureId ?? activeMeasures[0]?.id ?? null
  const selectedMeasure = activeMeasures.find((m) => m.id === effectiveMeasureId)

  const { stats: measureStats, isLoading: measureStatsLoading } =
    useMeasureStats(
      effectiveMeasureId,
      effectiveDateRange,
      selectedMeasure?.created_at
    )

  const measureColor = selectedMeasure?.color ?? "#6366f1"
  const measureUnit = selectedMeasure?.unit ?? ""

  const habitColor = selectedHabit?.color ?? "#6366f1"
  const isValueHabit = selectedHabit?.log_type === "value" || selectedHabit?.log_type === "time"
  const habitUnit = selectedHabit?.unit ?? ""

  // Streak=0 subtitle
  const streakSubtitle =
    stats?.currentStreak === 0 && stats.lastLoggedDaysAgo !== null
      ? `Last logged: ${stats.lastLoggedDaysAgo}d ago`
      : undefined

  // 30-day rate description
  const last30Count = stats
    ? Math.round((stats.completionRate30d / 100) * 30)
    : 0
  const rateDescription = stats ? `${last30Count} of 30 days` : undefined

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your patterns and progress over time
          </p>
        </div>
        <DateRangeToggle
          value={effectiveDateRange}
          onChange={setDateRange}
          lockedRanges={isFreeUser ? ["90d", "all"] : []}
        />
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1.5">
        <Button
          variant={activeTab === "habit" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setActiveTab("habit")}
        >
          By Habit
        </Button>
        <Button
          variant={activeTab === "category" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setActiveTab("category")}
        >
          By Category
        </Button>
        <Button
          variant={activeTab === "measures" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setActiveTab("measures")}
        >
          Measures
        </Button>
      </div>

      <Separator />

      {/* Habit tab */}
      {activeTab === "habit" && (
        <div className="grid gap-6">
          <HabitSelectorPills
            habits={activeHabits}
            selectedId={effectiveHabitId}
            onSelect={setSelectedHabitId}
          />

          {!habitsLoading && activeHabits.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Create some habits first to see analytics.
            </p>
          ) : (
            <>
              {/* Stat cards — reordered: rate → avg/logs → streak → best */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  title="30-Day Rate"
                  value={stats?.completionRate30d ?? 0}
                  suffix="%"
                  description={rateDescription}
                  isLoading={statsLoading}
                />
                {isValueHabit ? (
                  <StatCard
                    title={`Daily Avg`}
                    value={stats?.dailyAvg ?? 0}
                    suffix={` ${habitUnit}`}
                    description="when logged"
                    isLoading={statsLoading}
                  />
                ) : (
                  <StatCard
                    title="Total Logs"
                    value={stats?.totalLogs ?? 0}
                    isLoading={statsLoading}
                  />
                )}
                <StatCard
                  title="Current Streak"
                  value={stats?.currentStreak ?? 0}
                  suffix={streakSubtitle ? undefined : " days"}
                  subtitle={streakSubtitle}
                  description={
                    !streakSubtitle ? "consecutive" : undefined
                  }
                  isLoading={statsLoading}
                />
                <StatCard
                  title="Best Streak"
                  value={stats?.bestStreak ?? 0}
                  suffix=" days"
                  description="all time"
                  isLoading={statsLoading}
                />
              </div>

              {/* Heatmap */}
              <HeatmapCard
                data={stats?.heatmapData ?? []}
                habitColor={habitColor}
                logType={selectedHabit?.log_type}
                unit={habitUnit}
                dateRange={effectiveDateRange}
                dailyTarget={selectedHabit?.daily_target}
                targetDirection={selectedHabit?.target_direction}
                isLoading={statsLoading}
              />

              {/* Charts — stacked full width */}
              <div className="grid gap-6">
                <WeeklyTrendCard
                  data={stats?.weeklyTrend ?? []}
                  habitColor={habitColor}
                  logType={selectedHabit?.log_type}
                  unit={habitUnit}
                  bestDay={stats?.bestDay}
                  toughestDay={stats?.toughestDay}
                  isLoading={statsLoading}
                />
                <MonthlyBarCard
                  data={stats?.monthlyBars ?? []}
                  habitColor={habitColor}
                  logType={selectedHabit?.log_type}
                  unit={habitUnit}
                  isLoading={statsLoading}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Category tab */}
      {activeTab === "category" && (
        <CategoryStatsList stats={categoryStats} isLoading={categoryLoading} />
      )}

      {/* Measures tab */}
      {activeTab === "measures" && (
        <div className="grid gap-6">
          <MeasureSelectorPills
            measures={activeMeasures}
            selectedId={effectiveMeasureId}
            onSelect={setSelectedMeasureId}
          />

          {activeMeasures.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Create some measures first to see analytics.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  title="Daily Avg"
                  value={measureStats?.dailyAvg ?? 0}
                  suffix={measureUnit ? ` ${measureUnit}` : undefined}
                  description="when logged"
                  isLoading={measureStatsLoading}
                />
                <StatCard
                  title="Total Logs"
                  value={measureStats?.totalLogs ?? 0}
                  isLoading={measureStatsLoading}
                />
                <StatCard
                  title="Min"
                  value={measureStats?.minValue ?? 0}
                  suffix={measureUnit ? ` ${measureUnit}` : undefined}
                  description="lowest recorded"
                  isLoading={measureStatsLoading}
                />
                <StatCard
                  title="Max"
                  value={measureStats?.maxValue ?? 0}
                  suffix={measureUnit ? ` ${measureUnit}` : undefined}
                  description="highest recorded"
                  isLoading={measureStatsLoading}
                />
              </div>

              <HeatmapCard
                data={measureStats?.heatmapData ?? []}
                habitColor={measureColor}
                logType="value"
                unit={measureUnit}
                dateRange={effectiveDateRange}
                isLoading={measureStatsLoading}
              />

              <div className="grid gap-6">
                <WeeklyTrendCard
                  data={measureStats?.weeklyTrend ?? []}
                  habitColor={measureColor}
                  logType="value"
                  unit={measureUnit}
                  isLoading={measureStatsLoading}
                />
                <MonthlyBarCard
                  data={measureStats?.monthlyBars ?? []}
                  habitColor={measureColor}
                  logType="value"
                  unit={measureUnit}
                  isLoading={measureStatsLoading}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
