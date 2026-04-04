"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { WeeklyTrendPoint, DayOfWeekStat } from "@/lib/types/analytics"
import type { LogType } from "@/lib/types/habits"

interface WeeklyTrendCardProps {
  data: WeeklyTrendPoint[]
  habitColor: string
  isLoading: boolean
  logType?: LogType
  unit?: string
  bestDay?: DayOfWeekStat | null
  toughestDay?: DayOfWeekStat | null
}

export function WeeklyTrendCard({
  data,
  habitColor,
  isLoading,
  logType,
  unit,
  bestDay,
  toughestDay,
}: WeeklyTrendCardProps) {
  const isValue = logType === "value"
  const title = isValue ? `Weekly avg ${unit}` : "Weekly completion rate"
  const dataKey = isValue ? "avgValue" : "completionRate"

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data yet
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatValue = (v: number) =>
    isValue ? `${v} ${unit}` : `${v}%`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis
              dataKey="weekLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              domain={isValue ? [0, "auto"] : [0, 100]}
              hide={!isValue}
              axisLine={false}
              tickLine={false}
              width={40}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) =>
                isValue ? `${v} ${unit}` : `${v}%`
              }
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                return (
                  <div className="rounded-md border bg-background px-3 py-1.5 text-xs shadow-sm">
                    <p className="font-medium">
                      {payload[0].payload.weekLabel}
                    </p>
                    <p className="text-muted-foreground">
                      {formatValue(payload[0].value as number)}
                    </p>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={habitColor}
              strokeWidth={2}
              dot={(props: Record<string, unknown>) => {
                const { cx, cy, index } = props as {
                  cx: number
                  cy: number
                  index: number
                }
                // Show dot only on last data point
                if (index === data.length - 1) {
                  return (
                    <circle
                      key="endpoint"
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={habitColor}
                      stroke="var(--color-background)"
                      strokeWidth={2}
                    />
                  )
                }
                return <circle key={index} r={0} cx={cx} cy={cy} />
              }}
              activeDot={{ r: 4, fill: habitColor }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Best / Toughest day chips */}
        {(bestDay || toughestDay) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {bestDay && (
              <div className="rounded-lg border bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">Best day</p>
                <p className="text-sm font-medium" style={{ color: habitColor }}>
                  {bestDay.day} &middot;{" "}
                  {isValue && bestDay.avgValue !== undefined
                    ? `${bestDay.avgValue} ${unit}`
                    : `${bestDay.rate}%`}
                </p>
              </div>
            )}
            {toughestDay && (
              <div className="rounded-lg border bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">Toughest day</p>
                <p className="text-sm font-medium">
                  {toughestDay.day} &middot;{" "}
                  {isValue && toughestDay.avgValue !== undefined
                    ? `${toughestDay.avgValue} ${unit}`
                    : `${toughestDay.rate}%`}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
