"use client"

import { useState } from "react"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useProfile } from "@/hooks/use-profile"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { updatePassword } from "@/lib/auth/actions"

const FREE_LIMITS = [
  { feature: "Habits", free: "4", premium: "Unlimited" },
  { feature: "Categories", free: "2", premium: "Unlimited" },
  { feature: "Goals", free: "Not available", premium: "Unlimited" },
  { feature: "Analytics", free: "30 days", premium: "Unlimited" },
]

export default function SettingsPage() {
  const { profile, email, isLoading, error, updateProfile, upgradeToPremium } = useProfile()

  const [displayName, setDisplayName] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const currentName = displayName ?? profile?.display_name ?? ""
  const hasChanges = displayName !== null && displayName !== (profile?.display_name ?? "")

  async function handleSave() {
    if (!hasChanges) return
    setIsSaving(true)
    setSaveSuccess(false)
    const success = await updateProfile({ display_name: displayName! })
    setIsSaving(false)
    if (success) {
      setSaveSuccess(true)
      setDisplayName(null)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }

  async function handlePasswordUpdate() {
    setPasswordError(null)
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.")
      return
    }
    setPasswordSaving(true)
    const formData = new FormData()
    formData.set("password", newPassword)
    const result = await updatePassword(formData)
    setPasswordSaving(false)
    if (result.error) {
      setPasswordError(result.error)
    } else {
      setPasswordSuccess(true)
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordSuccess(false), 2000)
    }
  }

  const isPremium = profile?.plan === "premium"

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account and preferences.
          </p>
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[250px] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Profile section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName">Display name</Label>
            <div className="flex gap-2">
              <Input
                id="displayName"
                value={currentName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {saveSuccess ? (
                  <>
                    <Check className="size-4" />
                    Saved
                  </>
                ) : isSaving ? (
                  "Saving..."
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email ?? ""}
              disabled
              className="text-muted-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Password section */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
          </div>
          {passwordError && (
            <p className="text-sm text-destructive">{passwordError}</p>
          )}
          <Button
            className="w-fit"
            onClick={handlePasswordUpdate}
            disabled={passwordSaving || !newPassword || !confirmPassword}
          >
            {passwordSuccess ? (
              <>
                <Check className="size-4" />
                Updated
              </>
            ) : passwordSaving ? (
              "Updating..."
            ) : (
              "Update password"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Plan section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Plan
            {isPremium ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                <Sparkles className="size-3" />
                Premium
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Free
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isPremium ? (
            <p className="text-sm text-muted-foreground">
              You have full access to all features.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                You&apos;re on the Free plan. Upgrade to unlock all features.
              </p>
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium">Feature</th>
                      <th className="px-4 py-2 text-left font-medium">Free</th>
                      <th className="px-4 py-2 text-left font-medium">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FREE_LIMITS.map((row) => (
                      <tr key={row.feature} className="border-b last:border-0">
                        <td className="px-4 py-2">{row.feature}</td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {row.free}
                        </td>
                        <td className="px-4 py-2 font-medium">{row.premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                className="w-fit"
                disabled={isUpgrading}
                onClick={async () => {
                  setIsUpgrading(true)
                  await upgradeToPremium()
                  setIsUpgrading(false)
                }}
              >
                <Sparkles className="size-4" />
                {isUpgrading ? "Upgrading..." : "Upgrade to Premium"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Account section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Sign out</h2>
          <p className="text-xs text-muted-foreground">
            Sign out of your account on this device.
          </p>
        </div>
        <SignOutButton />
      </div>
    </div>
  )
}
