import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StatCardProps {
  title: string
  value: number
  suffix?: string
  subtitle?: string
  description?: string
  isLoading?: boolean
}

export function StatCard({
  title,
  value,
  suffix,
  subtitle,
  description,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        {subtitle ? (
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {subtitle}
          </p>
        ) : (
          <>
            <p className="mt-1 text-2xl font-bold">
              {value}
              {suffix && (
                <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                  {suffix}
                </span>
              )}
            </p>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
