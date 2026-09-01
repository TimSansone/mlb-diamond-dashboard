"use client";

import { useEffect, useRef, useState } from "react";
import type { MlbGame } from "@/types/mlb";

const STORAGE_KEY = "mlb-alerts-enabled";
const FAVORITE_KEY = "mlb-favorite-team";
const TOAST_LIFETIME_MS = 7000;
const MAX_TOASTS = 5;

type GameSnapshot = {
  state: string;
  awayScore: number;
  homeScore: number;
};

type Toast = {
  id: string;
  message: string;
  favorite: boolean;
  tone: "start" | "score" | "final";
};

function teamName(game: MlbGame, side: "away" | "home") {
  return game.teams[side].team.name;
}

function readFavoriteTeamId(): number | null {
  const saved = window.localStorage.getItem(FAVORITE_KEY);
  return saved ? Number(saved) : null;
}

export default function LiveAlerts({ games }: { games: MlbGame[] }) {
  const [enabled, setEnabled] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const snapshots = useRef<Map<number, GameSnapshot>>(new Map());
  const primed = useRef(false);
  const timers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) setEnabled(saved === "true");
  }, []);

  useEffect(() => {
    const favoriteId = readFavoriteTeamId();
    const next: Toast[] = [];

    games.forEach((game) => {
      const previous = snapshots.current.get(game.gamePk);
      const state = game.status.abstractGameState;
      const awayScore = game.teams.away.score ?? 0;
      const homeScore = game.teams.home.score ?? 0;
      const isFavoriteGame = favoriteId !== null
        && (game.teams.away.team.id === favoriteId || game.teams.home.team.id === favoriteId);

      if (primed.current && previous) {
        if (previous.state !== "Live" && state === "Live") {
          next.push({
            id: `${game.gamePk}-start-${state}`,
            message: `${teamName(game, "away")} @ ${teamName(game, "home")} is underway`,
            favorite: isFavoriteGame,
            tone: "start",
          });
        }

        if (state === "Live" && (awayScore !== previous.awayScore || homeScore !== previous.homeScore)) {
          const scoringTeam = awayScore > previous.awayScore ? teamName(game, "away") : teamName(game, "home");
          next.push({
            id: `${game.gamePk}-score-${awayScore}-${homeScore}`,
            message: `${scoringTeam} scores! ${teamName(game, "away")} ${awayScore} – ${teamName(game, "home")} ${homeScore}`,
            favorite: isFavoriteGame,
            tone: "score",
          });
        }

        if (previous.state !== "Final" && state === "Final") {
          next.push({
            id: `${game.gamePk}-final`,
            message: `Final: ${teamName(game, "away")} ${awayScore} – ${teamName(game, "home")} ${homeScore}`,
            favorite: isFavoriteGame,
            tone: "final",
          });
        }
      }

      snapshots.current.set(game.gamePk, { state, awayScore, homeScore });
    });

    primed.current = true;

    if (next.length && enabled) {
      setToasts((current) => [...next, ...current].slice(0, MAX_TOASTS));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games]);

  useEffect(() => {
    toasts.forEach((toast) => {
      if (timers.current.has(toast.id)) return;
      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
        timers.current.delete(toast.id);
      }, TOAST_LIFETIME_MS);
      timers.current.set(toast.id, timer);
    });
  }, [toasts]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function toggleAlerts() {
    setEnabled((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      if (!next) setToasts([]);
      return next;
    });
  }

  function dismiss(id: string) {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }

  return (
    <>
      <button type="button" className="alertsToggle" aria-pressed={enabled} onClick={toggleAlerts}>
        {enabled ? "🔔 Alerts on" : "🔕 Alerts off"}
      </button>
      <div className="alertsStack" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`alertToast alertToast-${toast.tone}${toast.favorite ? " alertToast-favorite" : ""}`}
          >
            <span>{toast.message}</span>
            <button type="button" aria-label="Dismiss alert" onClick={() => dismiss(toast.id)}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}
