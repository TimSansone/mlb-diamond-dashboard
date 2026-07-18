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

function headshot(playerId: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best,f_auto/v1/people/${playerId}/headshot/67/current`;
}

function splitRecord(standing: Awaited<ReturnType<typeof getTeamStanding>>, type: string) {
  const split = standing?.records?.splitRecords?.find((item) => item.type === type);
  return split ? `${split.wins}-${split.losses}` : "—";
}

function formatGameDate(date: string, includeTime = false) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "America/New_York",
  }).format(new Date(date));
}

function getTeamSide(game: MlbGame, teamId: number) {
  const isHome = game.teams.home.team.id === teamId;
  return {
    isHome,
    teamSide: isHome ? game.teams.home : game.teams.away,
    opponent: isHome ? game.teams.away : game.teams.home,
  };
}

function GameList({ games, teamId, emptyText }: { games: MlbGame[]; teamId: number; emptyText: string }) {
  if (!games.length) return <p className={styles.empty}>{emptyText}</p>;

  return (
    <ul className={styles.gameList}>
      {games.map((game) => {
        const { isHome, teamSide, opponent } = getTeamSide(game, teamId);
        const final = game.status.abstractGameState === "Final";
        const live = game.status.abstractGameState === "Live";
        const won = final && Boolean(teamSide.isWinner);
        const resultClass = final ? (won ? styles.resultWin : styles.resultLoss) : live ? styles.resultLive : "";
        const label = final
          ? `${won ? "W" : "L"} ${teamSide.score ?? 0}-${opponent.score ?? 0}`
          : live
            ? `${teamSide.score ?? 0}-${opponent.score ?? 0}`
            : formatGameDate(game.gameDate, true).split(", ").at(-1) ?? formatGameDate(game.gameDate, true);

        return (
          <li key={game.gamePk}>
            <Link className={styles.gameLink} href={`/games/${game.gamePk}`}>
              <span className={styles.date}>{formatGameDate(game.gameDate)}</span>
              <img className={styles.opponentLogo} src={logo(opponent.team.id)} alt="" width={34} height={34} />
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

function NextGame({ game, teamId }: { game?: MlbGame; teamId: number }) {
  if (!game) {
    return (
      <section className={styles.nextGameCard}>
        <span className="eyebrow">Next game</span>
        <h2>Schedule unavailable</h2>
        <p>No upcoming matchup is currently listed.</p>
      </section>
    );
  }

  const { isHome, opponent } = getTeamSide(game, teamId);
  const probable = isHome ? game.teams.home.probablePitcher : game.teams.away.probablePitcher;
  const opponentProbable = isHome ? game.teams.away.probablePitcher : game.teams.home.probablePitcher;

  return (
    <Link className={styles.nextGameCard} href={`/games/${game.gamePk}`}>
      <div className={styles.nextGameHeading}>
        <div>
          <span className="eyebrow">Next game</span>
          <h2>{isHome ? "vs" : "at"} {opponent.team.name}</h2>
        </div>
        <img src={logo(opponent.team.id)} alt="" width={72} height={72} />
      </div>
      <strong className={styles.nextGameTime}>{formatGameDate(game.gameDate, true)}</strong>
      <p>{game.venue?.name ?? "Venue to be announced"}</p>
      <div className={styles.pitchingMatchup}>
        <span><small>Team starter</small><strong>{probable?.fullName ?? "TBD"}</strong></span>
        <span><small>Opponent starter</small><strong>{opponentProbable?.fullName ?? "TBD"}</strong></span>
      </div>
    </Link>
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
          {category.leaders.slice(0, 3).map((leader, index) => (
            <li key={`${category.leaderCategory}-${leader.person.id}`}>
              <span className={styles.leaderRank}>{index + 1}</span>
              <img src={headshot(leader.person.id)} alt="" width={42} height={42} />
              <Link href={`/players/${leader.person.id}`}><strong>{leader.person.fullName}</strong></Link>
              <span className={styles.leaderValue}>{leader.value}</span>
            </li>
          ))}
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
      <div className={styles.cardHeader}><h2>Active Roster</h2><span>{players.length ? `${players.length} players` : "Roster"}</span></div>
      {players.length ? (
        <div className={styles.rosterSection}>
          {Object.entries(groups).map(([group, groupPlayers]) => (
            <div className={styles.rosterGroup} key={group}>
              <h3>{group}</h3>
              <ul className={styles.rosterList}>
                {groupPlayers.map((player) => (
                  <li key={player.person.id}>
                    <span>#{player.jerseyNumber ?? "—"}</span>
                    <Link href={`/players/${player.person.id}`}><strong>{player.person.fullName}</strong></Link>
                    <span>{player.position.abbreviation}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : <p className={styles.empty}>Roster data is temporarily unavailable.</p>}
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

  const [standingResult, gamesResult, rosterResult, leadersResult] = await Promise.allSettled([
    getTeamStanding(team.id, season),
    getTeamSchedule(teamId, shiftDate(today, -30), shiftDate(today, 35)),
    getTeamRoster(teamId, season),
    getTeamLeaders(teamId, season),
  ]);

  const standing = standingResult.status === "fulfilled" ? standingResult.value : null;
  const games = gamesResult.status === "fulfilled" ? gamesResult.value : [];
  const roster = rosterResult.status === "fulfilled" ? rosterResult.value : [];
  const leaders = leadersResult.status === "fulfilled" ? leadersResult.value : [];

  const recent = games.filter((game) => game.status.abstractGameState === "Final").slice(-5).reverse();
  const currentOrUpcoming = games.filter((game) => game.status.abstractGameState !== "Final" && new Date(game.gameDate) >= new Date(Date.now() - 6 * 60 * 60 * 1000));
  const upcoming = currentOrUpcoming.slice(0, 5);
  const nextGame = currentOrUpcoming[0];
  const recentWins = recent.filter((game) => getTeamSide(game, team.id).teamSide.isWinner).length;
  const recentForm = recent.map((game) => getTeamSide(game, team.id).teamSide.isWinner ? "W" : "L");

  return (
    <div className={styles.page}>
      <Link className={styles.back} href="/teams">← All MLB teams</Link>

      <header className={styles.hero}>
        <img className={styles.logo} src={logo(team.id)} alt={`${team.name} logo`} width={124} height={124} />
        <div className={styles.heroCopy}>
          <span className="eyebrow">{team.league?.name ?? "Major League Baseball"}</span>
          <h1>{team.name}</h1>
          <p className={styles.meta}>{team.division?.name ?? "MLB"} · {team.venue?.name ?? "Home ballpark"}</p>
          <div className={styles.heroLinks}>
            <Link href={`/schedule?team=${team.id}`}>Full schedule</Link>
            <Link href="/standings">MLB standings</Link>
          </div>
        </div>
        <div className={styles.record}>
          <strong>{standing ? `${standing.wins}-${standing.losses}` : "—"}</strong>
          <span>{standing ? `${standing.winningPercentage} winning percentage` : `${season} season`}</span>
          <span>Home {splitRecord(standing, "home")} · Away {splitRecord(standing, "away")}</span>
        </div>
      </header>

      <section className={styles.dashboardStats} aria-label="Team season overview">
        <div><span>Division</span><strong>{standing?.divisionRank ? `#${standing.divisionRank}` : "—"}</strong><small>{standing?.gamesBack === "-" ? "Division leader" : `${standing?.gamesBack ?? "—"} GB`}</small></div>
        <div><span>League</span><strong>{standing?.leagueRank ? `#${standing.leagueRank}` : "—"}</strong><small>League rank</small></div>
        <div><span>Wild Card</span><strong>{standing?.wildCardRank ? `#${standing.wildCardRank}` : "—"}</strong><small>{standing?.wildCardGamesBack ? `${standing.wildCardGamesBack} GB` : "Race position"}</small></div>
        <div><span>Current Streak</span><strong>{standing?.streak?.streakCode ?? "—"}</strong><small>Latest run</small></div>
        <div><span>Last 5</span><strong>{recent.length ? `${recentWins}-${recent.length - recentWins}` : "—"}</strong><small className={styles.formStrip}>{recentForm.map((result, index) => <i className={result === "W" ? styles.formWin : styles.formLoss} key={`${result}-${index}`}>{result}</i>)}</small></div>
      </section>

      <div className={styles.featureGrid}>
        <NextGame game={nextGame} teamId={team.id} />
        <section className={styles.card}>
          <div className={styles.cardHeader}><h2>Recent Results</h2><span>Last 5</span></div>
          <GameList games={recent} teamId={team.id} emptyText="Recent game data is temporarily unavailable." />
        </section>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHeader}><h2>Upcoming Schedule</h2><span>Next 5</span></div>
        <GameList games={upcoming} teamId={team.id} emptyText="No upcoming games are currently available." />
      </section>

      <div className={styles.sectionHeading}>
        <div><span className="eyebrow">Season performance</span><h2>Team Leaders</h2></div>
        <Link href="/leaders">View league leaders →</Link>
      </div>

      {leaders.length ? (
        <div className={styles.leaders}>{leaders.map((category) => <LeaderCard key={category.leaderCategory} category={category} />)}</div>
      ) : (
        <section className={styles.card}><div className={styles.cardHeader}><h2>Team Leaders</h2></div><p className={styles.empty}>Team leader data is temporarily unavailable.</p></section>
      )}

      <Roster players={roster} />
    </div>
  );
}
