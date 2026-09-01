"use client";

import Link from "next/link";
import { useState } from "react";
import { tvBroadcastLabel } from "@/lib/broadcasts";
import type { LiveGameSituation } from "@/lib/live-situations";
import type { MlbGame, MlbTeamSide } from "@/types/mlb";
import GameQuickLook from "./GameQuickLook";
import MiniGameCenter from "./MiniGameCenter";

function teamLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

function recordLabel(team: MlbTeamSide): string {
  const record = team.leagueRecord;
  return record ? `${record.wins}-${record.losses}` : "—";
}

function gameTime(gameDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(gameDate));
}

function statusLabel(game: MlbGame): string {
  const state = game.status.abstractGameState;
  if (state === "Live") {
    const inning = game.linescore?.currentInningOrdinal;
    const half = game.linescore?.inningHalf;
    return inning ? `${half ?? ""} ${inning}`.trim() : game.status.detailedState;
  }
  if (state === "Final") return game.status.detailedState;
  return gameTime(game.gameDate);
}

function TeamRow({ team, showScore }: { team: MlbTeamSide; showScore: boolean }) {
  return (
    <div className={`teamRow${team.isWinner ? " winner" : ""}`}>
      <img className="teamLogo" src={teamLogoUrl(team.team.id)} alt="" width={44} height={44} />
      <div className="teamInfo">
        <strong>{team.team.name}</strong>
        <span>{recordLabel(team)}</span>
      </div>
      <div className="teamScore" aria-label={`${team.team.name} score`}>
        {showScore ? team.score ?? 0 : ""}
      </div>
    </div>
  );
}

export default function GameCard({ game, situation }: { game: MlbGame; situation?: LiveGameSituation | null }) {
  const [expanded, setExpanded] = useState(false);
  const showScore = game.status.abstractGameState !== "Preview";
  const live = game.status.abstractGameState === "Live";
  const awayPitcher = game.teams.away.probablePitcher?.fullName;
  const homePitcher = game.teams.home.probablePitcher?.fullName;
  const matchupLabel = `${game.teams.away.team.name} at ${game.teams.home.team.name}`;

  return (
    <article className={`gameCard${live ? " liveGameCard" : ""}`}>
      <button
        type="button"
        className="gameCardToggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} quick look for ${matchupLabel}`}
      >
        <div className="gameCardHeader">
          <span className={`statusBadge ${game.status.abstractGameState.toLowerCase()}`}>{statusLabel(game)}</span>
          <span className="venue">{game.venue?.name ?? "Venue TBD"}</span>
        </div>

        <div className="matchup">
          <TeamRow team={game.teams.away} showScore={showScore} />
          <TeamRow team={game.teams.home} showScore={showScore} />
        </div>

        {live && situation ? (
          <MiniGameCenter situation={situation} />
        ) : (
          <div className="pitcherPanel">
            <div><span>Away starter</span><strong>{awayPitcher ?? "TBD"}</strong></div>
            <div><span>Home starter</span><strong>{homePitcher ?? "TBD"}</strong></div>
          </div>
        )}
        <div className="broadcastPanel" aria-label="Television broadcasts">
          <div><span>Away TV</span><strong>{tvBroadcastLabel(game.broadcasts, "away")}</strong></div>
          <div><span>Home TV</span><strong>{tvBroadcastLabel(game.broadcasts, "home")}</strong></div>
        </div>
        <div className="quickLookHint">{expanded ? "Hide quick look ▲" : "Quick look ▼"}</div>
      </button>

      {expanded && (
        <GameQuickLook
          gamePk={game.gamePk}
          status={game.status.abstractGameState}
          awayName={game.teams.away.team.name}
          homeName={game.teams.home.team.name}
        />
      )}

      <Link className="openGameCenter" href={`/games/${game.gamePk}`} aria-label={`Open full Game Center for ${matchupLabel}`}>
        Open full Game Center →
      </Link>
    </article>
  );
}
