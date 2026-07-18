import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCurrentSeason,
  getEasternDateString,
  getMlbTeam,
  getTeamLeaders,
  getTeamRoster,
  getTeamSchedule,
  getTeamStanding,
  shiftDate,
} from "@/lib/mlb";
import type { MlbGame, RosterPerson, TeamLeaderCategory } from "@/types/mlb";
import styles from "./team.module.css";

function logo(teamId: number) {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

function splitRecord(standing: Awaited<ReturnType<typeof getTeamStanding>>, type: string) {
  const split = standing?.records?.splitRecords?.find((item) => item.type === type);
  return split ? `${split.wins}-${split.losses}` : "—";
}

function GameList({ games, teamId, emptyText }: { games: MlbGame[]; teamId: number; emptyText: string }) {
  if (!games.length) return <p className={styles.empty}>{emptyText}</p>;

  return (
    <ul className={styles.gameList}>
      {games.map((game) => {
        const isHome = game.teams.home.team.id === teamId;
        const teamSide = isHome ? game.teams.home : game.teams.away;
        const opponent = isHome ? game.teams.away : game.teams.home;
        const final = game.status.abstractGameState === "Final";
        const won = final && Boolean(teamSide.isWinner);
        const resultClass = final ? (won ? styles.resultWin : styles.resultLoss) : "";
        const label = final
          ? `${won ? "W" : "L"} ${teamSide.score ?? 0}-${opponent.score ?? 0}`
          : new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(new Date(game.gameDate));

        return (
          <li key={game.gamePk}>
            <Link className={styles.gameLink} href={`/games/${game.gamePk}`}>
              <span className={styles.date}>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(game.gameDate))}</span>
              <span className={styles.opponent}>
                <strong>{isHome ? "vs" : "at"} {opponent.team.name}</strong>
                <span>{game.status.detailedState}</span>
              </span>
              <span className={`${styles.score} ${resultClass}`}>{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function LeaderCard({ category }: { category: TeamLeaderCategory }) {
  const labels: Record<string, string> = {
    homeRuns: "Home Runs",
    runsBattedIn: "RBI",
    battingAverage: "Batting Average",
    wins: "Pitching Wins",
    strikeouts: "Strikeouts",
    earnedRunAverage: "ERA",
  };

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}><h2>{labels[category.leaderCategory] ?? category.leaderCategory}</h2></div>
      {category.leaders.length ? (
        <ol className={styles.leaderList}>
          {category.leaders.map((leader) => <li key={`${category.leaderCategory}-${leader.person.id}`}><strong>{leader.person.fullName}</strong><span>{leader.value}</span></li>)}
        </ol>
      ) : <p className={styles.empty}>No leaders available.</p>}
    </section>
  );
}

function Roster({ players }: { players: RosterPerson[] }) {
  const groups = players.reduce<Record<string, RosterPerson[]>>((result, player) => {
    const group = player.position.type || "Other";
    (result[group] ??= []).push(player);
    return result;
  }, {});

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}><h2>Active Roster</h2><span>{players.length} players</span></div>
      <div className={styles.rosterSection}>
        {Object.entries(groups).map(([group, groupPlayers]) => (
          <div className={styles.rosterGroup} key={group}>
            <h3>{group}</h3>
            <ul className={styles.rosterList}>
              {groupPlayers.map((player) => (
                <li key={player.person.id}><span>#{player.jerseyNumber ?? "—"}</span><strong>{player.person.fullName}</strong><span>{player.position.abbreviation}</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  if (!/^\d+$/.test(teamId)) notFound();

  const season = getCurrentSeason();
  const today = getEasternDateString();
  const team = await getMlbTeam(teamId, season);
  if (!team) notFound();

  const [standing, games, roster, leaders] = await Promise.all([
    getTeamStanding(team.id, season).catch(() => null),
    getTeamSchedule(teamId, shiftDate(today, -14), shiftDate(today, 21)).catch(() => []),
    getTeamRoster(teamId, season).catch(() => []),
    getTeamLeaders(teamId, season).catch(() => []),
  ]);

  const recent = games.filter((game) => game.status.abstractGameState === "Final").slice(-5).reverse();
  const upcoming = games.filter((game) => game.status.abstractGameState !== "Final" && new Date(game.gameDate) >= new Date()).slice(0, 5);

  return (
    <div className={styles.page}>
      <Link className={styles.back} href="/teams">← All MLB teams</Link>
      <header className={styles.hero}>
        <img className={styles.logo} src={logo(team.id)} alt={`${team.name} logo`} width={112} height={112} />
        <div>
          <span className="eyebrow">{team.league?.name ?? "Major League Baseball"}</span>
          <h1>{team.name}</h1>
          <p className={styles.meta}>{team.division?.name ?? "MLB"} · {team.venue?.name ?? "Home ballpark"}</p>
        </div>
        <div className={styles.record}>
          <strong>{standing ? `${standing.wins}-${standing.losses}` : "—"}</strong>
          <span>{standing ? `${standing.winningPercentage} · ${standing.gamesBack} GB` : `${season} season`}</span>
          <span>Home {splitRecord(standing, "home")} · Away {splitRecord(standing, "away")}</span>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}><div className={styles.cardHeader}><h2>Recent Results</h2><span>Last 5</span></div><GameList games={recent} teamId={team.id} emptyText="No recent games are available." /></section>
        <section className={styles.card}><div className={styles.cardHeader}><h2>Upcoming Games</h2><span>Next 5</span></div><GameList games={upcoming} teamId={team.id} emptyText="No upcoming games are scheduled in this window." /></section>
      </div>

      {leaders.length ? <div className={styles.leaders}>{leaders.map((category) => <LeaderCard key={category.leaderCategory} category={category} />)}</div> : null}
      <Roster players={roster} />
    </div>
  );
}
