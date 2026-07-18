import Link from "next/link";
import type { LiveGameSituation } from "@/lib/live-situations";
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

function MiniDiamond({ situation }: { situation: LiveGameSituation }) {
  return (
    <div className="miniDiamond" aria-label={`${situation.outs} outs; runners on ${[
      situation.firstOccupied && "first",
      situation.secondOccupied && "second",
      situation.thirdOccupied && "third",
    ].filter(Boolean).join(", ") || "no bases"}`}>
      <span className={`miniBase miniSecond${situation.secondOccupied ? " occupied" : ""}`} />
      <span className={`miniBase miniThird${situation.thirdOccupied ? " occupied" : ""}`} />
      <span className={`miniBase miniFirst${situation.firstOccupied ? " occupied" : ""}`} />
      <span className="miniHome" />
    </div>
  );
}

function MiniGameCenter({ situation }: { situation: LiveGameSituation }) {
  return (
    <section className="miniGameCenter" aria-label="Current game situation">
      <div className="miniSituationTop">
        <MiniDiamond situation={situation} />
        <div className="miniCount">
          <span><b>{situation.balls}</b> B</span>
          <span><b>{situation.strikes}</b> S</span>
          <span><b>{situation.outs}</b> OUT</span>
        </div>
      </div>
      <div className="miniMatchup">
        <div><span>At bat</span><strong>{situation.batter}</strong></div>
        <div><span>Pitching</span><strong>{situation.pitcher}</strong></div>
      </div>
    </section>
  );
}

export default function GameCard({ game, situation }: { game: MlbGame; situation?: LiveGameSituation | null }) {
  const showScore = game.status.abstractGameState !== "Preview";
  const live = game.status.abstractGameState === "Live";
  const awayPitcher = game.teams.away.probablePitcher?.fullName;
  const homePitcher = game.teams.home.probablePitcher?.fullName;

  return (
    <Link className="gameCardLink" href={`/games/${game.gamePk}`} aria-label={`Open ${game.teams.away.team.name} at ${game.teams.home.team.name} Game Center`}>
      <article className={`gameCard${live ? " liveGameCard" : ""}`}>
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
        <div className="openGameCenter">Open Game Center →</div>
      </article>
    </Link>
  );
}
