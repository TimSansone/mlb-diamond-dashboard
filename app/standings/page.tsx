import StandingsTable from "@/components/StandingsTable";
import { getCurrentSeason, getStandings } from "@/lib/mlb";
import type { StandingsTeamRecord } from "@/types/mlb";
import "./standings.css";

function bestTeam(teams: StandingsTeamRecord[]) {
  return [...teams].sort((a, b) => Number(b.winningPercentage) - Number(a.winningPercentage))[0];
}

function formatDiff(team?: StandingsTeamRecord) {
  if (!team) return "—";
  const value = typeof team.runDifferential === "number"
    ? team.runDifferential
    : typeof team.runsScored === "number" && typeof team.runsAllowed === "number"
      ? team.runsScored - team.runsAllowed
      : null;
  return value === null ? "—" : `${value > 0 ? "+" : ""}${value}`;
}

export default async function StandingsPage() {
  const season = getCurrentSeason();
  const [divisionResult, wildCardResult] = await Promise.allSettled([
    getStandings("regularSeason", season),
    getStandings("wildCard", season),
  ]);

  const divisionData = divisionResult.status === "fulfilled" ? divisionResult.value : { records: [] };
  const wildCardData = wildCardResult.status === "fulfilled" ? wildCardResult.value : { records: [] };
  const allTeams = divisionData.records.flatMap((record) => record.teamRecords);
  const topTeam = bestTeam(allTeams);
  const hottestTeam = [...allTeams].sort((a, b) => {
    const aSplit = a.records?.splitRecords?.find((record) => record.type === "lastTen");
    const bSplit = b.records?.splitRecords?.find((record) => record.type === "lastTen");
    return (bSplit?.wins ?? 0) - (aSplit?.wins ?? 0);
  })[0];
  const hottestSplit = hottestTeam?.records?.splitRecords?.find((record) => record.type === "lastTen");

  return (
    <div className="standingsPage">
      <header className="pageHero">
        <div>
          <span className="eyebrow">MLB {season}</span>
          <h1>Standings 2.0</h1>
          <p>Follow every division race, wild-card position, team trend, and postseason push in one place.</p>
        </div>
        <div className="standingsLegend" aria-label="Standings legend">
          <span><i className="legendPlayoff" /> Playoff position</span>
          <span><i className="legendWin" /> Winning streak</span>
          <span><i className="legendLoss" /> Losing streak</span>
        </div>
      </header>

      {allTeams.length ? (
        <section className="overviewGrid" aria-label="League overview">
          <article className="overviewCard">
            <span>Best MLB record</span>
            <strong>{topTeam?.team.name ?? "—"}</strong>
            <small>{topTeam ? `${topTeam.wins}-${topTeam.losses} · ${topTeam.winningPercentage}` : "Unavailable"}</small>
          </article>
          <article className="overviewCard">
            <span>Hottest last 10</span>
            <strong>{hottestTeam?.team.name ?? "—"}</strong>
            <small>{hottestSplit ? `${hottestSplit.wins}-${hottestSplit.losses}` : "Unavailable"}</small>
          </article>
          <article className="overviewCard">
            <span>Top run differential</span>
            <strong>{[...allTeams].sort((a, b) => Number(b.runDifferential ?? -999) - Number(a.runDifferential ?? -999))[0]?.team.name ?? "—"}</strong>
            <small>{formatDiff([...allTeams].sort((a, b) => Number(b.runDifferential ?? -999) - Number(a.runDifferential ?? -999))[0])}</small>
          </article>
          <article className="overviewCard">
            <span>Teams tracked</span>
            <strong>{allTeams.length}</strong>
            <small>American &amp; National League</small>
          </article>
        </section>
      ) : null}

      <nav className="standingsNav" aria-label="Standings sections">
        <a href="#divisions">Division races</a>
        <a href="#wild-card">Wild card</a>
      </nav>

      <section className="standingsSection" id="divisions">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">Division races</span>
            <h2>American &amp; National League</h2>
          </div>
          <p>Tap any team to open its complete dashboard.</p>
        </div>
        {divisionData.records.length ? (
          <div className="standingsGrid">
            {divisionData.records.map((record) => (
              <StandingsTable
                key={record.division?.id ?? record.league?.id}
                title={record.division?.name ?? record.league?.name ?? "Standings"}
                teams={record.teamRecords}
              />
            ))}
          </div>
        ) : <p className="standingsNotice">Division standings are temporarily unavailable.</p>}
      </section>

      <section className="standingsSection" id="wild-card">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">Postseason race</span>
            <h2>Wild Card Standings</h2>
          </div>
          <p>The top three non-division winners in each league qualify.</p>
        </div>
        {wildCardData.records.length ? (
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
        ) : <p className="standingsNotice">Wild-card standings are temporarily unavailable.</p>}
      </section>
    </div>
  );
}
