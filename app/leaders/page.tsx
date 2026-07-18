import styles from "./leaders.module.css";

const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";

const battingCategories = [
  ["homeRuns", "Home Runs"],
  ["runsBattedIn", "RBI"],
  ["battingAverage", "Batting Average"],
  ["onBasePlusSlugging", "OPS"],
  ["stolenBases", "Stolen Bases"],
] as const;

const pitchingCategories = [
  ["wins", "Wins"],
  ["strikeouts", "Strikeouts"],
  ["earnedRunAverage", "ERA"],
  ["walksAndHitsPerInningPitched", "WHIP"],
  ["saves", "Saves"],
] as const;

type StatGroup = "hitting" | "pitching";

type Leader = {
  rank: number;
  value: string;
  person: { id: number; fullName: string };
  team?: { id: number; name: string };
};

type Category = {
  leaderCategory: string;
  leaders: Leader[];
};

type LeadersResponse = { leagueLeaders?: Category[] };

async function getLeaders(
  categories: readonly (readonly [string, string])[],
  statGroup: StatGroup,
) {
  const params = new URLSearchParams({
    leaderCategories: categories.map(([id]) => id).join(","),
    statGroup,
    sportId: "1",
    gameTypes: "R",
    limit: "10",
  });

  const response = await fetch(`${MLB_API_BASE}/stats/leaders?${params.toString()}`, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`MLB ${statGroup} leaders request failed with status ${response.status}`);
  }

  return ((await response.json()) as LeadersResponse).leagueLeaders ?? [];
}

function playerImage(id: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best,f_auto/v1/people/${id}/headshot/67/current`;
}

function teamLogo(id?: number) {
  return id ? `https://www.mlbstatic.com/team-logos/${id}.svg` : "";
}

function Leaderboard({ title, category }: { title: string; category?: Category }) {
  const leaders = category?.leaders ?? [];

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <span className="eyebrow">Top 10</span>
          <h2>{title}</h2>
        </div>
      </header>
      {leaders.length ? (
        <ol className={styles.list}>
          {leaders.map((leader) => (
            <li key={`${category?.leaderCategory}-${leader.person.id}`}>
              <span className={styles.rank}>{leader.rank}</span>
              <img className={styles.headshot} src={playerImage(leader.person.id)} alt="" width={48} height={48} />
              <span className={styles.player}>
                <strong>{leader.person.fullName}</strong>
                <span>
                  {leader.team?.id ? <img src={teamLogo(leader.team.id)} alt="" width={20} height={20} /> : null}
                  {leader.team?.name ?? "MLB"}
                </span>
              </span>
              <strong className={styles.value}>{leader.value}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>No leader data is currently available.</p>
      )}
    </section>
  );
}

export default async function LeadersPage() {
  const [batting, pitching] = await Promise.all([
    getLeaders(battingCategories, "hitting"),
    getLeaders(pitchingCategories, "pitching"),
  ]);

  const battingMap = new Map(batting.map((category) => [category.leaderCategory, category]));
  const pitchingMap = new Map(pitching.map((category) => [category.leaderCategory, category]));

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className="eyebrow">Season leaders</span>
        <h1>MLB League Leaders</h1>
        <p>Track the top hitters and pitchers across Major League Baseball.</p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><span className="eyebrow">Offense</span><h2>Batting Leaders</h2></div>
        </div>
        <div className={styles.grid}>
          {battingCategories.map(([id, label]) => <Leaderboard key={id} title={label} category={battingMap.get(id)} />)}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><span className="eyebrow">On the mound</span><h2>Pitching Leaders</h2></div>
        </div>
        <div className={styles.grid}>
          {pitchingCategories.map(([id, label]) => <Leaderboard key={id} title={label} category={pitchingMap.get(id)} />)}
        </div>
      </section>
    </div>
  );
}
