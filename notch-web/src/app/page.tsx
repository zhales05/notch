import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Target,
  BarChart3,
  FolderOpen,
} from "lucide-react";

const features = [
  {
    icon: CheckCircle2,
    title: "Daily tracking",
    description: "Check off habits each day and build streaks that keep you motivated.",
  },
  {
    icon: Target,
    title: "Goal setting",
    description: "Set meaningful goals and link them to the habits that drive progress.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "See completion rates, weekly trends, and how your habits stack up over time.",
  },
  {
    icon: FolderOpen,
    title: "Categories",
    description: "Organize habits into color-coded categories that fit your life.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-24">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center max-w-2xl">
        <Image
          src="/images/notch-logo-full.svg"
          alt="Notch logo"
          width={220}
          height={94}
          priority
        />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Habit tracking, simplified.
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Build better habits with daily tracking, goals, and insights — free to
          start with up to 4 habits.
        </p>
        <div className="flex gap-3 mt-2">
          <Link href="/signup">
            <Button size="lg">Get Started — It&apos;s Free</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Log In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mt-24 grid gap-8 sm:grid-cols-2 max-w-3xl w-full">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex gap-4">
            <div className="mt-1 shrink-0">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
