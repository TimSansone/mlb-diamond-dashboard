import type { StandingsTeamRecord } from "@/types/mlb";

function teamLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

function splitLabel(team: StandingsTeamRecord, type: string): string {
  const split = team.records?.splitRecords?.find((record) => record.type === type);
  return split ? `${split.wins}-${split.losses}` : "—";
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
        <h2>{title}</h2>
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
              <th>HOME</th>
              <th>AWAY</th>
              <th>L10</th>
              <th>STRK</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.team.id}>
                <td className="rankColumn">{wildCard ? team.wildCardRank ?? index + 1 : team.divisionRank ?? index + 1}</td>
                <td className="teamColumn">
                  <span className="standingsTeam">
                    <img src={teamLogoUrl(team.team.id)} alt="" width={32} height={32} />
                    <strong>{team.team.name}</strong>
                  </span>
                </td>
                <td>{team.wins}</td>
                <td>{team.losses}</td>
                <td>{team.winningPercentage}</td>
                <td>{wildCard ? team.wildCardGamesBack ?? "—" : team.gamesBack}</td>
                <td>{splitLabel(team, "home")}</td>
                <td>{splitLabel(team, "away")}</td>
                <td>{splitLabel(team, "lastTen")}</td>
                <td>{team.streak?.streakCode ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}