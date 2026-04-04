"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, signInWithMagicLink } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const searchParams = useSearchParams();
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const urlError = searchParams.get("error");

  async function handlePasswordLogin(formData: FormData) {
    setError(null);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  async function handleMagicLink(formData: FormData) {
    setError(null);
    const result = await signInWithMagicLink(formData);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setMagicLinkSent(true);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Log in to Notch</CardDescription>
      </CardHeader>
      <CardContent>
        {(error || urlError) && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error || "Authentication failed. Please try again."}
          </div>
        )}

        {magicLinkSent ? (
          <div className="rounded-lg bg-muted p-4 text-center text-sm">
            <p className="font-medium">Check your email</p>
            <p className="mt-1 text-muted-foreground">
              We sent you a magic link to sign in.
            </p>
          </div>
        ) : useMagicLink ? (
          <form action={handleMagicLink} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <SubmitButton>Send magic link</SubmitButton>
          </form>
        ) : (
          <form action={handlePasswordLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            <SubmitButton>Log in</SubmitButton>
          </form>
        )}

        {!magicLinkSent && (
          <button
            type="button"
            onClick={() => {
              setUseMagicLink(!useMagicLink);
              setError(null);
            }}
            className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {useMagicLink
              ? "Use password instead"
              : "Use magic link instead"}
          </button>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
