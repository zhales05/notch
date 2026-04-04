"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { MonthlyBarPoint } from "@/lib/types/analytics"
import type { LogType } from "@/lib/types/habits"

interface MonthlyBarCardProps {
  data: MonthlyBarPoint[]
  habitColor: string
  isLoading: boolean
  logType?: LogType
  unit?: string
}

export function MonthlyBarCard({
  data,
  habitColor,
  isLoading,
  logType,
  unit,
}: MonthlyBarCardProps) {
  const isValue = logType === "value"
  const title = isValue ? `Monthly avg ${unit}` : "Monthly completion rate"
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
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="monthLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              hide={!isValue}
              domain={isValue ? [0, "auto"] : [0, 100]}
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
                const point = payload[0].payload as MonthlyBarPoint
                return (
                  <div className="rounded-md border bg-background px-3 py-1.5 text-xs shadow-sm">
                    <p className="font-medium">{point.monthLabel}</p>
                    <p className="text-muted-foreground">
                      {isValue
                        ? formatValue(point.avgValue ?? 0)
                        : `${point.totalLogged} / ${point.totalDue} days (${point.completionRate}%)`}
                    </p>
                  </div>
                )
              }}
            />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((entry, i) => (
                <Cell
                  key={entry.month}
                  fill={habitColor}
                  opacity={i === data.length - 1 ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
