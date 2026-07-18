import Link from "next/link";
import FavoriteTeamPicker from "./FavoriteTeamPicker";
import styles from "./favorite.module.css";
import {
  getAllMlbTeams,
  getEasternDateString,
  getMlbTeam,
  getTeamLeaders,
  getTeamSchedule,
  getTeamStanding,
  shiftDate,
} from "@/lib/mlb";
import type { MlbGame, TeamLeaderCategory } from "@/types/mlb";

type FavoritePageProps = {
  searchParams: Promise<{ team?: string }>;
};

function teamLogo(teamId: number) {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

function playerImage(playerId: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best,f_auto/v1/people/${playerId}/headshot/67/current`;
}

function gameTime(game: MlbGame) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(game.gameDate));
}

function opponentFor(game: MlbGame, teamId: number) {
  const isHome = game.teams.home.team.id === teamId;
  return {
    isHome,
    opponent: isHome ? game.teams.away : game.teams.home,
    favorite: isHome ? game.teams.home : game.teams.away,
  };
}

function leaderTitle(category: string) {
  const labels: Record<string, string> = {
    homeRuns: "Home Runs",
    runsBattedIn: "RBI",
    battingAverage: "Batting Average",
    wins: "Wins",
    strikeouts: "Strikeouts",
    earnedRunAverage: "ERA",
  };
  return labels[category] ?? category;
}

function LeaderCard({ category }: { category: TeamLeaderCategory }) {
  const leader = category.leaders?.[0];
  if (!leader) return null;

  return (
    <Link className={styles.leaderCard} href={`/players/${leader.person.id}`}>
      <img src={playerImage(leader.person.id)} alt="" width={64} height={64} />
      <span>
        <small>{leaderTitle(category.leaderCategory)}</small>
        <strong>{leader.person.fullName}</strong>
      </span>
      <b>{leader.value}</b>
    </Link>
  );
}

function RecentGame({ game, teamId }: { game: MlbGame; teamId: number }) {
  const matchup = opponentFor(game, teamId);
  const favoriteScore = matchup.favorite.score ?? 0;
  const opponentScore = matchup.opponent.score ?? 0;
  const result = favoriteScore > opponentScore ? "W" : "L";

  return (
    <Link className={styles.recentGame} href={`/games/${game.gamePk}`}>
      <span className={result === "W" ? styles.win : styles.loss}>{result}</span>
      <img src={teamLogo(matchup.opponent.team.id)} alt="" width={34} height={34} />
      <span className={styles.recentOpponent}>
        <strong>{matchup.isHome ? "vs" : "@"} {matchup.opponent.team.name}</strong>
        <small>{gameTime(game)}</small>
      </span>
      <b>{favoriteScore}-{opponentScore}</b>
    </Link>
  );
}

export default async function FavoritePage({ searchParams }: FavoritePageProps) {
  const params = await searchParams;
  const teams = await getAllMlbTeams();
  const teamId = params.team && /^\d+$/.test(params.team) ? Number(params.team) : undefined;
  const selectedTeam = teamId ? await getMlbTeam(String(teamId)) : null;

  if (!selectedTeam || !teamId) {
    return (
      <div className={styles.page}>
        <header className={styles.welcomeHero}>
          <span className="eyebrow">Personalized baseball</span>
          <h1>Choose Your Favorite Team</h1>
          <p>Build a personalized dashboard with your team’s next game, recent results, standings position, leaders, and shortcuts.</p>
          <FavoriteTeamPicker teams={teams.map(({ id, name }) => ({ id, name }))} />
        </header>
        <section className={styles.featureGrid}>
          <article><strong>Next Game</strong><span>Opponent, start time, venue, and probable pitchers.</span></article>
          <article><strong>Season Pulse</strong><span>Record, division rank, games back, streak, and run differential.</span></article>
          <article><strong>Team Leaders</strong><span>Quick access to the club’s top hitters and pitchers.</span></article>
        </section>
      </div>
    );
  }

  const today = getEasternDateString();
  const [schedule, standing, leaders] = await Promise.all([
    getTeamSchedule(String(teamId), shiftDate(today, -10), shiftDate(today, 21)),
    getTeamStanding(teamId),
    getTeamLeaders(String(teamId)),
  ]);

  const completed = schedule
    .filter((game) => game.status.abstractGameState === "Final")
    .sort((a, b) => b.gameDate.localeCompare(a.gameDate))
    .slice(0, 5);
  const upcoming = schedule
    .filter((game) => game.status.abstractGameState !== "Final" && game.gameDate >= `${today}T00:00:00`)
    .sort((a, b) => a.gameDate.localeCompare(b.gameDate));
  const nextGame = upcoming[0];
  const nextMatchup = nextGame ? opponentFor(nextGame, teamId) : null;

  return (
    <div className={styles.page}>
      <header className={styles.teamHero}>
        <div className={styles.identity}>
          <img src={teamLogo(teamId)} alt={`${selectedTeam.name} logo`} width={112} height={112} />
          <div>
            <span className="eyebrow">My team dashboard</span>
            <h1>{selectedTeam.name}</h1>
            <p>{selectedTeam.division?.name ?? selectedTeam.league?.name} · {selectedTeam.venue?.name}</p>
          </div>
        </div>
        <div className={styles.heroActions}>
          <FavoriteTeamPicker teams={teams.map(({ id, name }) => ({ id, name }))} selectedTeamId={teamId} />
          <Link href={`/teams/${teamId}`} className={styles.primaryButton}>Full Team Dashboard</Link>
        </div>
      </header>

      <section className={styles.metrics}>
        <article><span>Record</span><strong>{standing ? `${standing.wins}-${standing.losses}` : "—"}</strong></article>
        <article><span>Division</span><strong>{standing?.divisionRank ? `#${standing.divisionRank}` : "—"}</strong></article>
        <article><span>Games Back</span><strong>{standing?.gamesBack ?? "—"}</strong></article>
        <article><span>Streak</span><strong>{standing?.streak?.streakCode ?? "—"}</strong></article>
        <article><span>Run Diff.</span><strong>{standing?.runDifferential !== undefined ? `${standing.runDifferential > 0 ? "+" : ""}${standing.runDifferential}` : "—"}</strong></article>
      </section>

      <div className={styles.dashboardGrid}>
        <section className={styles.nextGameCard}>
          <div className={styles.sectionHeader}><div><span className="eyebrow">Coming up</span><h2>Next Game</h2></div><Link href={`/schedule?team=${teamId}`}>Full schedule</Link></div>
          {nextGame && nextMatchup ? (
            <>
              <div className={styles.matchup}>
                <div><img src={teamLogo(teamId)} alt="" width={86} height={86} /><strong>{selectedTeam.name}</strong></div>
                <span>{nextMatchup.isHome ? "VS" : "AT"}</span>
                <div><img src={teamLogo(nextMatchup.opponent.team.id)} alt="" width={86} height={86} /><strong>{nextMatchup.opponent.team.name}</strong></div>
              </div>
              <div className={styles.gameDetails}>
                <strong>{gameTime(nextGame)}</strong>
                <span>{nextGame.venue?.name ?? "Venue TBD"}</span>
                <span>{nextGame.status.detailedState}</span>
              </div>
              <div className={styles.pitchers}>
                <span><small>{selectedTeam.name}</small><strong>{nextMatchup.favorite.probablePitcher?.fullName ?? "TBD"}</strong></span>
                <span><small>{nextMatchup.opponent.team.name}</small><strong>{nextMatchup.opponent.probablePitcher?.fullName ?? "TBD"}</strong></span>
              </div>
              <Link className={styles.gameButton} href={`/games/${nextGame.gamePk}`}>Open Game Center</Link>
            </>
          ) : <p className={styles.empty}>No upcoming game is currently listed.</p>}
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHeader}><div><span className="eyebrow">Latest form</span><h2>Recent Results</h2></div></div>
          <div className={styles.recentList}>
            {completed.length ? completed.map((game) => <RecentGame key={game.gamePk} game={game} teamId={teamId} />) : <p className={styles.empty}>No completed games found.</p>}
          </div>
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}><div><span className="eyebrow">Club leaders</span><h2>Top Performers</h2></div><Link href="/leaders">League leaders</Link></div>
        <div className={styles.leaderGrid}>
          {leaders.slice(0, 6).map((category) => <LeaderCard key={category.leaderCategory} category={category} />)}
        </div>
      </section>

      <section className={styles.quickLinks}>
        <Link href={`/teams/${teamId}`}><strong>Team Dashboard</strong><span>Roster, schedule, and complete team information</span></Link>
        <Link href={`/schedule?team=${teamId}`}><strong>Team Schedule</strong><span>Filter the full MLB schedule to your club</span></Link>
        <Link href="/standings"><strong>Standings</strong><span>See the complete division and Wild Card races</span></Link>
      </section>
    </div>
  );
}
