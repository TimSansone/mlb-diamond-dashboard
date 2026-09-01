"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const REFRESH_SECONDS = 30;
const STORAGE_KEY = "mlb-auto-refresh-enabled";

export default function ScoreboardAutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_SECONDS);
  const savedScroll = useRef<number | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) setEnabled(saved === "true");
  }, []);

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
    if (!active || !enabled) return;
    setSecondsLeft(REFRESH_SECONDS);
    const timer = window.setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds <= 1) {
          refresh();
          return REFRESH_SECONDS;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active, enabled, refresh]);

  function toggleAutoRefresh() {
    setEnabled((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  function handleManualRefresh() {
    setSecondsLeft(REFRESH_SECONDS);
    refresh();
  }

  if (!active) return null;

  return (
    <div className="autoRefreshBar" aria-label="Scoreboard refresh controls">
      <button type="button" className="refreshToggle" aria-pressed={enabled} onClick={toggleAutoRefresh}>
        {enabled ? "⟳ Auto-refresh on" : "⏸ Auto-refresh off"}
      </button>
      <span className="scoreRefreshStatus" aria-live="polite">
        {isPending ? "Updating scores…" : enabled ? `Next update in ${secondsLeft}s` : "Auto-refresh paused"}
      </span>
      <button type="button" className="refreshNowButton" onClick={handleManualRefresh} disabled={isPending}>
        Refresh now
      </button>
    </div>
  );
}
