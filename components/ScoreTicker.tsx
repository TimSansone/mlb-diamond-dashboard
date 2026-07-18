"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ScoreTicker.module.css";

type TickerSide = {
  score?: number;
  team: { id: number; name: string; abbreviation?: string };
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

function easternDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function teamAbbreviation(side: TickerSide) {
  if (side.team.abbreviation) return side.team.abbreviation;
  const words = side.team.name.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(-2).map((word) => word[0]).join("").toUpperCase();
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
  if (half.startsWith("top")) return `Top of inning ${inning}`;
  if (half.startsWith("bottom")) return `Bottom of inning ${inning}`;
  if (half.startsWith("middle")) return `Middle of inning ${inning}`;
  if (half.startsWith("end")) return `End of inning ${inning}`;
  return `Live, inning ${inning}`;
}

function tickerPriority(game: TickerGame) {
  const state = game.status.abstractGameState;
  if (state === "Live") return 0;
  if (state === "Final") return 2;
  return 1;
}

async function requestScores(date: string): Promise<ScheduleResponse> {
  const stamp = Date.now().toString();
  const internal = await fetch(`/api/scores?date=${date}&_=${stamp}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  }).catch(() => null);

  if (internal?.ok) return internal.json() as Promise<ScheduleResponse>;

  const params = new URLSearchParams({
    sportId: "1",
    date,
    hydrate: "team,linescore",
    _: stamp,
  });
  const fallback = await fetch(`https://statsapi.mlb.com/api/v1/schedule?${params.toString()}`, {
    cache: "no-store",
    headers: { Accept: "application/json", "Cache-Control": "no-cache" },
  });
  if (!fallback.ok) throw new Error(`Scores request failed: ${fallback.status}`);
  return fallback.json() as Promise<ScheduleResponse>;
}

export default function ScoreTicker() {
  const [games, setGames] = useState<TickerGame[]>([]);
  const [failed, setFailed] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const date = useMemo(() => easternDateString(), []);
  const orderedGames = useMemo(
    () => games
      .map((game, originalIndex) => ({ game, originalIndex }))
      .sort((a, b) => tickerPriority(a.game) - tickerPriority(b.game) || a.originalIndex - b.originalIndex)
      .map(({ game }) => game),
    [games],
  );

  useEffect(() => {
    let mounted = true;

    async function loadGames() {
      try {
        const data = await requestScores(date);
        if (mounted) {
          setGames(data.dates?.flatMap((entry) => entry.games) ?? []);
          setUpdatedAt(new Date());
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

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      scroller.scrollLeft += event.deltaY;
      event.preventDefault();
    };
    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <aside className={styles.band} aria-label="Today's MLB scores">
      <div className={styles.bandInner}>
        <div className={styles.labelBlock}>
          <span className={styles.liveDot} aria-hidden="true" />
          <div><strong>MLB Scores</strong><small>{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Live feed"}</small></div>
        </div>

        {orderedGames.length ? (
          <div className={styles.scroller} ref={scrollerRef}>
            {orderedGames.map((game) => {
              const preview = game.status.abstractGameState === "Preview";
              const live = game.status.abstractGameState === "Live";
              return (
                <Link
                  key={game.gamePk}
                  className={`${styles.game} ${live ? styles.liveGame : ""}`}
                  href={`/games/${game.gamePk}`}
                  aria-label={`${game.teams.away.team.name} ${game.teams.away.score ?? 0}, ${game.teams.home.team.name} ${game.teams.home.score ?? 0}, ${gameStatusLabel(game)}`}
                >
                  <div className={styles.gameStatus}><span className={live ? styles.livePill : ""}>{gameLabel(game)}</span></div>
                  <div className={styles.teamLine}>
                    <img src={logo(game.teams.away.team.id)} alt="" width={26} height={26} />
                    <span>{teamAbbreviation(game.teams.away)}</span>
                    <strong>{preview ? "–" : game.teams.away.score ?? 0}</strong>
                  </div>
                  <div className={styles.teamLine}>
                    <img src={logo(game.teams.home.team.id)} alt="" width={26} height={26} />
                    <span>{teamAbbreviation(game.teams.home)}</span>
                    <strong>{preview ? "–" : game.teams.home.score ?? 0}</strong>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className={styles.loading} role="status">
            {failed ? "Scores temporarily unavailable" : "Loading today's scores…"}
          </div>
        )}
      </div>
    </aside>
  );
}
