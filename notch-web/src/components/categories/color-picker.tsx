"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#4F7EF7", // blue
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#639922", // green
  "#84cc16", // lime
  "#eab308", // yellow
  "#BA7517", // amber
  "#f97316", // orange
  "#E24B4A", // red
  "#ec4899", // pink
  "#8b5cf6", // violet
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            "flex size-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110",
            value === color ? "border-foreground" : "border-transparent"
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        >
          {value === color && <Check className="size-4 text-white" />}
        </button>
      ))}
    </div>
  )
}
