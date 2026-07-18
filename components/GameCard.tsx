import type { MlbGame, MlbTeamSide } from "@/types/mlb";

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

  if (state === "Final") {
    return game.status.detailedState;
  }

  return gameTime(game.gameDate);
}

function TeamRow({ team, showScore }: { team: MlbTeamSide; showScore: boolean }) {
  return (
    <div className={`teamRow${team.isWinner ? " winner" : ""}`}>
      <img
        className="teamLogo"
        src={teamLogoUrl(team.team.id)}
        alt=""
        width={44}
        height={44}
      />
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

export default function GameCard({ game }: { game: MlbGame }) {
  const showScore = game.status.abstractGameState !== "Preview";
  const awayPitcher = game.teams.away.probablePitcher?.fullName;
  const homePitcher = game.teams.home.probablePitcher?.fullName;

  return (
    <article className="gameCard">
      <div className="gameCardHeader">
        <span className={`statusBadge ${game.status.abstractGameState.toLowerCase()}`}>
          {statusLabel(game)}
        </span>
        <span className="venue">{game.venue?.name ?? "Venue TBD"}</span>
      </div>

      <div className="matchup">
        <TeamRow team={game.teams.away} showScore={showScore} />
        <TeamRow team={game.teams.home} showScore={showScore} />
      </div>

      <div className="pitcherPanel">
        <div>
          <span>Away starter</span>
          <strong>{awayPitcher ?? "TBD"}</strong>
        </div>
        <div>
          <span>Home starter</span>
          <strong>{homePitcher ?? "TBD"}</strong>
        </div>
      </div>
    </article>
  );
}
