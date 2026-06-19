"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DemoAccessButton() {
  const [status, setStatus] = useState<"idle" | "seeding" | "signing-in" | "error">("idle");
  const router = useRouter();

  const handleDemo = async () => {
    setStatus("seeding");

    const seed = await fetch("/api/seed", { method: "POST" });
    if (!seed.ok) {
      setStatus("error");
      return;
    }

    setStatus("signing-in");

    const result = await signIn("credentials", {
      email: "demo@minimalistbazaar.com",
      password: "demo123456",
      redirect: false,
    });

    if (result?.error) {
      setStatus("error");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const labels: Record<typeof status, string> = {
    idle: "Try demo",
    seeding: "Setting up…",
    "signing-in": "Signing in…",
    error: "Something went wrong",
  };

  return (
    <button
      onClick={handleDemo}
      disabled={status !== "idle" && status !== "error"}
      className="px-6 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {(status === "seeding" || status === "signing-in") && (
        <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      )}
      {labels[status]}
    </button>
  );
}
