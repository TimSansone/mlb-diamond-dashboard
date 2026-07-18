import StandingsTable from "@/components/StandingsTable";
import { getCurrentSeason, getStandings } from "@/lib/mlb";
import "./standings.css";

export default async function StandingsPage() {
  const season = getCurrentSeason();
  const [divisionData, wildCardData] = await Promise.all([
    getStandings("regularSeason", season),
    getStandings("wildCard", season),
  ]);

  return (
    <div className="standingsPage">
      <header className="pageHero">
        <span className="eyebrow">MLB {season}</span>
        <h1>Standings</h1>
        <p>Division races, league records, and the American and National League Wild Card pictures.</p>
      </header>

      <section className="standingsSection">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">Division races</span>
            <h2>American &amp; National League</h2>
          </div>
        </div>
        <div className="standingsGrid">
          {divisionData.records.map((record) => (
            <StandingsTable
              key={record.division?.id ?? record.league?.id}
              title={record.division?.name ?? record.league?.name ?? "Standings"}
              teams={record.teamRecords}
            />
          ))}
        </div>
      </section>

      <section className="standingsSection">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">Postseason race</span>
            <h2>Wild Card Standings</h2>
          </div>
        </div>
        <div className="standingsGrid wildCardGrid">
          {wildCardData.records.map((record) => (
            <StandingsTable
              key={record.league?.id ?? record.division?.id}
              title={`${record.league?.name ?? "League"} Wild Card`}
              teams={record.teamRecords}
              wildCard
            />
          ))}
        </div>
      </section>
    </div>
  );
}