"use client"

import type { LucideIcon } from "lucide-react"
import {
  Folder,
  Dumbbell,
  Heart,
  BookOpen,
  Code,
  Music,
  Palette,
  Brain,
  Coffee,
  Flame,
  Star,
  Zap,
  Sun,
  Moon,
  Apple,
  Bike,
  Briefcase,
  GraduationCap,
  Home,
  Utensils,
  Gauge,
  Footprints,
  BedDouble,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

export const ICON_MAP: Record<string, LucideIcon> = {
  folder: Folder,
  dumbbell: Dumbbell,
  heart: Heart,
  "book-open": BookOpen,
  code: Code,
  music: Music,
  palette: Palette,
  brain: Brain,
  coffee: Coffee,
  flame: Flame,
  star: Star,
  zap: Zap,
  sun: Sun,
  moon: Moon,
  apple: Apple,
  bike: Bike,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  home: Home,
  utensils: Utensils,
  gauge: Gauge,
  footprints: Footprints,
  bed: BedDouble,
  activity: Activity,
}

const ICON_ENTRIES = Object.entries(ICON_MAP)

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  color?: string
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {ICON_ENTRIES.map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          className={cn(
            "flex size-9 items-center justify-center rounded-lg border transition-colors",
            value === name
              ? "border-foreground bg-muted"
              : "border-transparent hover:bg-muted"
          )}
          onClick={() => onChange(name)}
        >
          <Icon className="size-5" style={color ? { color } : undefined} />
        </button>
      ))}
    </div>
  )
}
