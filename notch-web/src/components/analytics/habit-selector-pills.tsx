import { Button } from "@/components/ui/button"
import type { HabitWithCategory } from "@/lib/types/habits"

interface HabitSelectorPillsProps {
  habits: HabitWithCategory[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function HabitSelectorPills({
  habits,
  selectedId,
  onSelect,
}: HabitSelectorPillsProps) {
  if (habits.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {habits.map((habit) => (
        <Button
          key={habit.id}
          variant={selectedId === habit.id ? "secondary" : "outline"}
          size="sm"
          className="shrink-0"
          onClick={() => onSelect(habit.id)}
        >
          <span
            className="mr-1.5 inline-block size-2 rounded-full"
            style={{ backgroundColor: habit.color }}
          />
          {habit.title}
        </Button>
      ))}
    </div>
  )
}
