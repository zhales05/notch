"use client"

import { useState } from "react"
import { Plus, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCategories } from "@/hooks/use-categories"
import { useProfile } from "@/hooks/use-profile"
import { CategoryCard } from "@/components/categories/category-card"
import { CategoryFormDialog } from "@/components/categories/category-form-dialog"
import { DeleteCategoryDialog } from "@/components/categories/delete-category-dialog"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import type { Category, CategoryFormData } from "@/lib/types/categories"

export default function CategoriesPage() {
  const {
    categories,
    activeCategoryCount,
    isLoading,
    error,
    createCategory,
    updateCategory,
    archiveCategory,
    getHabitCount,
  } = useCategories()

  const { profile } = useProfile()
  const isPremium = profile?.plan === "premium"

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  )
  const [showUpgrade, setShowUpgrade] = useState(false)

  function handleNewCategory() {
    if (!isPremium && activeCategoryCount >= 2) {
      setShowUpgrade(true)
      return
    }
    setShowUpgrade(false)
    setIsFormOpen(true)
  }

  function handleEdit(category: Category) {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  function handleFormClose(open: boolean) {
    setIsFormOpen(open)
    if (!open) setEditingCategory(null)
  }

  async function handleSubmit(data: CategoryFormData) {
    if (editingCategory) {
      const result = await updateCategory(editingCategory.id, data)
      if (!result) throw new Error("Update failed")
    } else {
      const result = await createCategory(data)
      if (!result) throw new Error("Create failed")
    }
  }

  async function handleDelete() {
    if (!deletingCategory) return
    const success = await archiveCategory(deletingCategory.id)
    if (!success) throw new Error("Delete failed")
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={handleNewCategory}>
          <Plus className="size-4" />
          New Category
        </Button>
      </div>

      {error && error !== "CATEGORY_LIMIT" && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}

      {(showUpgrade || error === "CATEGORY_LIMIT") && (
        <div className="mt-4">
          <UpgradePrompt
            title="You've reached the free plan limit of 2 categories."
            description="Upgrade to Premium for unlimited categories."
          />
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <FolderPlus className="size-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 font-medium">No categories yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first category to start organizing habits.
          </p>
          <Button className="mt-4" onClick={handleNewCategory}>
            <Plus className="size-4" />
            Create Category
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => handleEdit(category)}
              onDelete={() => setDeletingCategory(category)}
            />
          ))}
        </div>
      )}

      <CategoryFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        category={editingCategory}
        onSubmit={handleSubmit}
      />

      <DeleteCategoryDialog
        open={deletingCategory !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null)
        }}
        category={deletingCategory}
        onConfirm={handleDelete}
        getHabitCount={getHabitCount}
      />
    </div>
  )
}
