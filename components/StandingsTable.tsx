import Link from "next/link";
import type { StandingsTeamRecord } from "@/types/mlb";

function teamLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

function splitLabel(team: StandingsTeamRecord, type: string): string {
  const split = team.records?.splitRecords?.find((record) => record.type === type);
  return split ? `${split.wins}-${split.losses}` : "—";
}

function differential(team: StandingsTeamRecord): number | null {
  if (typeof team.runDifferential === "number") return team.runDifferential;
  if (typeof team.runsScored === "number" && typeof team.runsAllowed === "number") {
    return team.runsScored - team.runsAllowed;
  }
  return null;
}

function postseasonLabel(team: StandingsTeamRecord, wildCard: boolean): string | null {
  if (team.clinched) return "Clinched";
  if (!wildCard && (team.divisionChamp || team.divisionLeader)) return "Division";
  if (wildCard && (team.wildCardLeader || Number(team.wildCardRank) <= 3)) return "WC spot";
  return null;
}

export default function StandingsTable({
  title,
  teams,
  wildCard = false,
}: {
  title: string;
  teams: StandingsTeamRecord[];
  wildCard?: boolean;
}) {
  return (
    <section className="standingsCard">
      <div className="standingsCardHeader">
        <div>
          <span className="standingsKicker">{wildCard ? "Postseason race" : "Division race"}</span>
          <h2>{title}</h2>
        </div>
        <span>{teams.length} teams</span>
      </div>
      <div className="tableScroller">
        <table className="standingsTable">
          <thead>
            <tr>
              <th className="rankColumn">#</th>
              <th className="teamColumn">Team</th>
              <th>W</th>
              <th>L</th>
              <th>PCT</th>
              <th>{wildCard ? "WCGB" : "GB"}</th>
              <th>DIFF</th>
              <th>HOME</th>
              <th>AWAY</th>
              <th>L10</th>
              <th>STRK</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => {
              const diff = differential(team);
              const streak = team.streak?.streakCode ?? "—";
              const badge = postseasonLabel(team, wildCard);
              const rank = wildCard ? team.wildCardRank ?? index + 1 : team.divisionRank ?? index + 1;

              return (
                <tr className={badge ? "playoffRow" : ""} key={team.team.id}>
                  <td className="rankColumn">{rank}</td>
                  <td className="teamColumn">
                    <Link className="standingsTeam" href={`/teams/${team.team.id}`}>
                      <img src={teamLogoUrl(team.team.id)} alt="" width={32} height={32} />
                      <span className="teamIdentity">
                        <strong>{team.team.name}</strong>
                        {badge ? <small>{badge}</small> : null}
                      </span>
                    </Link>
                  </td>
                  <td className="strongCell">{team.wins}</td>
                  <td>{team.losses}</td>
                  <td>{team.winningPercentage}</td>
                  <td className="strongCell">{wildCard ? team.wildCardGamesBack ?? "—" : team.gamesBack}</td>
                  <td className={diff === null ? "" : diff >= 0 ? "positiveDiff" : "negativeDiff"}>
                    {diff === null ? "—" : `${diff > 0 ? "+" : ""}${diff}`}
                  </td>
                  <td>{splitLabel(team, "home")}</td>
                  <td>{splitLabel(team, "away")}</td>
                  <td>{splitLabel(team, "lastTen")}</td>
                  <td><span className={streak.startsWith("W") ? "winStreak" : streak.startsWith("L") ? "lossStreak" : ""}>{streak}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
