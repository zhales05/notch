"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SupabaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">(
    "checking"
  );

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (error) {
          console.error("Supabase connection error:", error.message);
          setStatus("error");
        } else {
          console.log("Supabase connected successfully");
          setStatus("connected");
        }
      })
      .catch(() => {
        setStatus("error");
      });
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`h-2 w-2 rounded-full ${
          status === "connected"
            ? "bg-green-500"
            : status === "error"
              ? "bg-red-500"
              : "bg-yellow-500 animate-pulse"
        }`}
      />
      <span className="text-muted-foreground">
        Supabase:{" "}
        {status === "checking"
          ? "Connecting..."
          : status === "connected"
            ? "Connected"
            : "Error"}
      </span>
    </div>
  );
}
