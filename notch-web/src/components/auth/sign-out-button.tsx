"use client";

import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline">
        <LogOut className="size-4" />
        Sign out
      </Button>
    </form>
  );
}
