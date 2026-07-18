"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./ScoreTicker.module.css";

type TickerSide = {
  score?: number;
  team: { id: number; name: string };
};

type TickerGame = {
  gamePk: number;
  gameDate: string;
  status: { abstractGameState: string; detailedState: string };
  teams: { away: TickerSide; home: TickerSide };
  linescore?: {
    currentInningOrdinal?: string;
    currentInning?: number;
    inningHalf?: string;
    inningState?: string;
  };
};

type ScheduleResponse = {
  dates?: Array<{ games: TickerGame[] }>;
};

const logo = (teamId: number) => `https://www.mlbstatic.com/team-logos/${teamId}.svg`;

function easternDateString() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function gameLabel(game: TickerGame) {
  const state = game.status.abstractGameState;
  if (state === "Live") {
    const inning = game.linescore?.currentInning ?? game.linescore?.currentInningOrdinal?.replace(/\D/g, "");
    const half = (game.linescore?.inningHalf ?? game.linescore?.inningState ?? "").toLowerCase();

    if (!inning) return "LIVE";
    if (half.startsWith("top")) return `▲ ${inning}`;
    if (half.startsWith("bottom")) return `▼ ${inning}`;
    if (half.startsWith("middle")) return `MID ${inning}`;
    if (half.startsWith("end")) return `END ${inning}`;
    return `LIVE ${inning}`;
  }
  if (state === "Final") return "FINAL";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(game.gameDate));
}

function gameStatusLabel(game: TickerGame) {
  const state = game.status.abstractGameState;
  if (state !== "Live") return gameLabel(game);

  const inning = game.linescore?.currentInning ?? game.linescore?.currentInningOrdinal?.replace(/\D/g, "");
  const half = (game.linescore?.inningHalf ?? game.linescore?.inningState ?? "").toLowerCase();

  if (!inning) return "Live game";
  if (half.startsWith("top")) return `Top of the ${inning}`;
  if (half.startsWith("bottom")) return `Bottom of the ${inning}`;
  if (half.startsWith("middle")) return `Middle of the ${inning}`;
  if (half.startsWith("end")) return `End of the ${inning}`;
  return `Live, inning ${inning}`;
}

export default function ScoreTicker() {
  const [games, setGames] = useState<TickerGame[]>([]);
  const [failed, setFailed] = useState(false);
  const date = useMemo(easternDateString, []);

  useEffect(() => {
    let mounted = true;

    async function loadGames() {
      try {
        const params = new URLSearchParams({
          date,
          _: Date.now().toString(),
        });
        const response = await fetch(`/api/scores?${params.toString()}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Ticker request failed: ${response.status}`);
        const data = await response.json() as ScheduleResponse;
        if (mounted) {
          setGames(data.dates?.flatMap((entry) => entry.games) ?? []);
          setFailed(false);
        }
      } catch {
        if (mounted) setFailed(true);
      }
    }

    loadGames();
    const timer = window.setInterval(loadGames, 30000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [date]);

  if (!games.length) {
    return failed
      ? <div className={styles.loading} role="status">Scores temporarily unavailable</div>
      : <div className={styles.loading} aria-label="Loading today's MLB scores">Loading today&apos;s scores…</div>;
  }

  return (
    <aside className={styles.band} aria-label="Today's MLB scores">
      <div className={styles.scroller}>
        {games.map((game) => {
          const preview = game.status.abstractGameState === "Preview";
          return (
            <Link key={game.gamePk} className={styles.game} href={`/games/${game.gamePk}`} aria-label={`${game.teams.away.team.name} ${game.teams.away.score ?? 0}, ${game.teams.home.team.name} ${game.teams.home.score ?? 0}, ${gameStatusLabel(game)}`}>
              <div className={styles.teamRow}>
                <img src={logo(game.teams.away.team.id)} alt={`${game.teams.away.team.name} logo`} width={24} height={24} />
                <strong>{preview ? "–" : game.teams.away.score ?? 0}</strong>
              </div>
              <span className={styles.status} aria-hidden="true">{gameLabel(game)}</span>
              <div className={styles.teamRow}>
                <img src={logo(game.teams.home.team.id)} alt={`${game.teams.home.team.name} logo`} width={24} height={24} />
                <strong>{preview ? "–" : game.teams.home.score ?? 0}</strong>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
