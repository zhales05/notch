"use client"

import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateKey } from "@/lib/date-utils"
import type { DaySummary } from "@/hooks/use-week-summary"

interface WeekChartProps {
  data: DaySummary[]
  isLoading: boolean
}

export function WeekChart({ data, isLoading }: WeekChartProps) {
  const todayKey = formatDateKey(new Date())

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {data.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={
                    entry.date === todayKey
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted))"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
