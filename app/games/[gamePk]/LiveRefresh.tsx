"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveRefresh({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => router.refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [active, router]);

  return active ? <span aria-label="Live data refreshes every 15 seconds">Auto-refresh · 15s</span> : null;
}
