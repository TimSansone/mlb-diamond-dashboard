import Link from "next/link";
import { getAllMlbTeams, getCurrentSeason } from "@/lib/mlb";
import styles from "./teams.module.css";

function logo(teamId: number) {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

export default async function TeamsPage() {
  const season = getCurrentSeason();
  const teams = await getAllMlbTeams(season);
  const divisions = teams.reduce<Record<string, typeof teams>>((groups, team) => {
    const division = team.division?.name ?? team.league?.name ?? "Major League Baseball";
    (groups[division] ??= []).push(team);
    return groups;
  }, {});

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className="eyebrow">MLB {season}</span>
        <h1>Teams</h1>
        <p>Select a club to view its record, recent results, upcoming schedule, statistical leaders, and active roster.</p>
      </header>

      <div className={styles.divisions}>
        {Object.entries(divisions).map(([division, divisionTeams]) => (
          <section className={styles.division} key={division}>
            <div className={styles.divisionHeader}>
              <h2>{division}</h2>
              <span>{divisionTeams.length} teams</span>
            </div>
            <div className={styles.teamGrid}>
              {divisionTeams.map((team) => (
                <Link className={styles.teamCard} href={`/teams/${team.id}`} key={team.id}>
                  <img src={logo(team.id)} alt="" width={64} height={64} />
                  <span>
                    <strong>{team.name}</strong>
                    <small>{team.venue?.name ?? "MLB club"}</small>
                  </span>
                  <b aria-hidden="true">→</b>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
