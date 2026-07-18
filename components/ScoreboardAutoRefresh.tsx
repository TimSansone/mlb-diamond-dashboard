"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ScoreboardAutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const savedScroll = useRef<number | null>(null);

  const refresh = useCallback(() => {
    if (isPending) return;
    savedScroll.current = window.scrollY;
    startTransition(() => router.refresh());
  }, [isPending, router]);

  useEffect(() => {
    if (isPending || savedScroll.current === null) return;
    const top = savedScroll.current;
    savedScroll.current = null;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.scrollTo({ top, left: 0, behavior: "auto" }));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isPending]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, [active, refresh]);

  return active ? <span className="scoreRefreshStatus" aria-live="polite">{isPending ? "Updating scores…" : "Live scores update every 30 seconds"}</span> : null;
}
