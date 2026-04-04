import Image from "next/image";
import Link from "next/link";
import { SupabaseStatus } from "@/components/supabase-status";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-24">
      <Image
        src="/images/notch-logo-full.svg"
        alt="Notch logo"
        width={280}
        height={120}
        priority
      />
      <p className="text-muted-foreground">Habit tracking, simplified.</p>
      <Link href="/signup">
        <Button>Get Started</Button>
      </Link>
      <SupabaseStatus />
    </main>
  );
}
