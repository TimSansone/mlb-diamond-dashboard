import Link from "next/link";
import styles from "./leaders.module.css";

const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";
const CURRENT_SEASON = new Date().getFullYear();

const battingCategories = [
  ["homeRuns", "Home Runs"],
  ["runsBattedIn", "RBI"],
  ["battingAverage", "Batting Average"],
  ["onBasePercentage", "On-Base Percentage"],
  ["sluggingPercentage", "Slugging Percentage"],
  ["onBasePlusSlugging", "OPS"],
  ["hits", "Hits"],
  ["runs", "Runs"],
  ["doubles", "Doubles"],
  ["triples", "Triples"],
  ["stolenBases", "Stolen Bases"],
] as const;

const pitchingCategories = [
  ["wins", "Wins"],
  ["strikeouts", "Strikeouts"],
  ["earnedRunAverage", "ERA"],
  ["walksAndHitsPerInningPitched", "WHIP"],
  ["saves", "Saves"],
  ["inningsPitched", "Innings Pitched"],
  ["completeGames", "Complete Games"],
  ["shutouts", "Shutouts"],
  ["battingAverageAgainst", "Opponent Average"],
] as const;

const leagueViews = [
  { id: "mlb", label: "MLB", leagueId: undefined },
  { id: "al", label: "American League", leagueId: "103" },
  { id: "nl", label: "National League", leagueId: "104" },
] as const;

type StatGroup = "hitting" | "pitching";
type LeagueView = (typeof leagueViews)[number];

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
  leagueId?: string,
) {
  const params = new URLSearchParams({
    leaderCategories: categories.map(([id]) => id).join(","),
    statGroup,
    sportId: "1",
    gameTypes: "R",
    season: String(CURRENT_SEASON),
    limit: "10",
  });

  if (leagueId) params.set("leagueId", leagueId);

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
          <h3>{title}</h3>
        </div>
      </header>
      {leaders.length ? (
        <ol className={styles.list}>
          {leaders.map((leader) => (
            <li key={`${category?.leaderCategory}-${leader.person.id}`}>
              <span className={styles.rank}>{leader.rank}</span>
              <Link className={styles.playerLink} href={`/players/${leader.person.id}`}>
                <img className={styles.headshot} src={playerImage(leader.person.id)} alt="" width={48} height={48} />
                <span className={styles.player}>
                  <strong>{leader.person.fullName}</strong>
                  <span>
                    {leader.team?.id ? <img src={teamLogo(leader.team.id)} alt="" width={20} height={20} /> : null}
                    {leader.team?.name ?? "MLB"}
                  </span>
                </span>
              </Link>
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

async function LeagueSection({ view }: { view: LeagueView }) {
  const [battingResult, pitchingResult] = await Promise.allSettled([
    getLeaders(battingCategories, "hitting", view.leagueId),
    getLeaders(pitchingCategories, "pitching", view.leagueId),
  ]);

  const batting = battingResult.status === "fulfilled" ? battingResult.value : [];
  const pitching = pitchingResult.status === "fulfilled" ? pitchingResult.value : [];
  const battingMap = new Map(batting.map((category) => [category.leaderCategory, category]));
  const pitchingMap = new Map(pitching.map((category) => [category.leaderCategory, category]));

  return (
    <section className={styles.leagueSection} id={view.id}>
      <header className={styles.leagueHeader}>
        <div>
          <span className="eyebrow">{CURRENT_SEASON} season</span>
          <h2>{view.label}</h2>
        </div>
        <a href="#top">Back to top ↑</a>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><span className="eyebrow">Offense</span><h2>Batting Leaders</h2></div>
        </div>
        <div className={styles.grid}>
          {battingCategories.map(([id, label]) => <Leaderboard key={`${view.id}-${id}`} title={label} category={battingMap.get(id)} />)}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><span className="eyebrow">On the mound</span><h2>Pitching Leaders</h2></div>
        </div>
        <div className={styles.grid}>
          {pitchingCategories.map(([id, label]) => <Leaderboard key={`${view.id}-${id}`} title={label} category={pitchingMap.get(id)} />)}
        </div>
      </section>
    </section>
  );
}

export default function LeadersPage() {
  return (
    <div className={styles.page} id="top">
      <header className={styles.hero}>
        <span className="eyebrow">Season leaders</span>
        <h1>MLB League Leaders</h1>
        <p>Compare the top hitters and pitchers across Major League Baseball, the American League, and the National League.</p>
        <nav className={styles.leagueNav} aria-label="League leader sections">
          {leagueViews.map((view) => <a key={view.id} href={`#${view.id}`}>{view.label}</a>)}
        </nav>
      </header>

      {leagueViews.map((view) => <LeagueSection key={view.id} view={view} />)}
    </div>
  );
}
