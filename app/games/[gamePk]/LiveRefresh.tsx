"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./game.module.css";

export default function LiveRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const restorePosition = useRef<number | null>(null);

  const refresh = useCallback(() => {
    if (isPending) return;

    restorePosition.current = window.scrollY;
    startTransition(() => router.refresh());
  }, [isPending, router]);

  useEffect(() => {
    if (isPending || restorePosition.current === null) return;

    const savedPosition = restorePosition.current;
    restorePosition.current = null;

    // Wait for the refreshed server content and layout to settle before restoring.
    const firstFrame = window.requestAnimationFrame(() => {
      const secondFrame = window.requestAnimationFrame(() => {
        window.scrollTo({ top: savedPosition, left: 0, behavior: "instant" });
      });

      return () => window.cancelAnimationFrame(secondFrame);
    });

    return () => window.cancelAnimationFrame(firstFrame);
  }, [isPending]);

  useEffect(() => {
    if (!active) return;

    const timer = window.setInterval(refresh, 15000);
    return () => window.clearInterval(timer);
  }, [active, refresh]);

  return (
    <>
      {active && (
        <span aria-label="Live data refreshes every 15 seconds">
          {isPending ? "Refreshing…" : "Auto-refresh · 15s"}
        </span>
      )}
      <button
        type="button"
        className={`${styles.floatingRefresh} ${isPending ? styles.refreshing : ""}`}
        onClick={refresh}
        disabled={isPending}
        aria-label="Refresh game data"
        title="Refresh game data"
      >
        <span aria-hidden="true">↻</span>
        <b>{isPending ? "Refreshing" : "Refresh"}</b>
      </button>
    </>
  );
}
