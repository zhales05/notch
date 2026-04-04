"use client"

import { Pencil, Trash2, Folder } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ICON_MAP } from "@/components/categories/icon-picker"
import type { Category } from "@/lib/types/categories"

interface CategoryCardProps {
  category: Category
  onEdit: () => void
  onDelete: () => void
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const Icon = ICON_MAP[category.icon] ?? Folder

  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: category.color + "20",
            color: category.color,
          }}
        >
          <Icon className="size-5" />
        </div>
        <span className="min-w-0 flex-1 truncate font-medium">
          {category.title}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={onEdit}>
          <Pencil />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete}>
          <Trash2 />
        </Button>
      </CardContent>
    </Card>
  )
}
