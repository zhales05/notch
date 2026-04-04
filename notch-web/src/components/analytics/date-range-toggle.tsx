import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DateRange } from "@/lib/types/analytics"

const options: { value: DateRange; label: string }[] = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
]

interface DateRangeToggleProps {
  value: DateRange
  onChange: (range: DateRange) => void
  lockedRanges?: DateRange[]
}

export function DateRangeToggle({
  value,
  onChange,
  lockedRanges = [],
}: DateRangeToggleProps) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => {
        const isLocked = lockedRanges.includes(opt.value)
        return (
          <Button
            key={opt.value}
            variant={value === opt.value ? "secondary" : "outline"}
            size="sm"
            disabled={isLocked}
            onClick={() => !isLocked && onChange(opt.value)}
            title={isLocked ? "Upgrade to Premium for extended analytics" : undefined}
          >
            {isLocked && <Lock className="mr-1 size-3" />}
            {opt.label}
          </Button>
        )
      })}
    </div>
  )
}
