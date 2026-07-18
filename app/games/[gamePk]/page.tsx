import Link from "next/link";
import { notFound } from "next/navigation";
import BoxScoreTables from "./BoxScoreTables";
import LineupCard, { type TeamBoxscore } from "./LineupCard";
import LiveRefresh from "./LiveRefresh";
import styles from "./game.module.css";

type TeamStats = Record<string, number | string>;
type Side = { id: number; name: string };
type Play = {
  result?: { description?: string; event?: string; rbi?: number; awayScore?: number; homeScore?: number };
  about?: { inning?: number; halfInning?: string; isScoringPlay?: boolean; atBatIndex?: number };
  count?: { balls?: number; strikes?: number; outs?: number };
  matchup?: {
    batter?: { id?: number; fullName?: string };
    pitcher?: { id?: number; fullName?: string };
  };
};

type GameFeed = {
  gameData: {
    datetime: { dateTime: string };
    status: { abstractGameState: string; detailedState: string };
    venue?: { name?: string };
    teams: { away: Side; home: Side };
  };
  liveData: {
    linescore?: {
      currentInningOrdinal?: string;
      inningHalf?: string;
      balls?: number;
      strikes?: number;
      outs?: number;
      offense?: {
        first?: { id?: number; fullName?: string };
        second?: { id?: number; fullName?: string };
        third?: { id?: number; fullName?: string };
      };
      defense?: { pitcher?: { id?: number; fullName?: string } };
      innings?: Array<{
        num: number;
        away?: { runs?: number; hits?: number; errors?: number };
        home?: { runs?: number; hits?: number; errors?: number };
      }>;
      teams?: {
        away?: { runs?: number; hits?: number; errors?: number };
        home?: { runs?: number; hits?: number; errors?: number };
      };
    };
    plays?: { allPlays?: Play[]; currentPlay?: Play };
    decisions?: {
      winner?: { fullName?: string };
      loser?: { fullName?: string };
      save?: { fullName?: string };
    };
    boxscore?: {
      teams?: {
        away?: TeamBoxscore & { teamStats?: { batting?: TeamStats; pitching?: TeamStats }; pitchers?: number[] };
        home?: TeamBoxscore & { teamStats?: { batting?: TeamStats; pitching?: TeamStats }; pitchers?: number[] };
      };
    };
  };
};

const logo = (teamId: number) => `https://www.mlbstatic.com/team-logos/${teamId}.svg`;

async function getGame(gamePk: string): Promise<GameFeed> {
  const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, {
    next: { revalidate: 15 },
    headers: { Accept: "application/json" },
  });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`Game feed request failed with status ${response.status}`);
  return response.json();
}

function TeamHeader({ team, score, side }: { team: Side; score?: number; side: string }) {
  return (
    <div className={styles.team}>
      <img src={logo(team.id)} alt={`${team.name} logo`} width={72} height={72} />
      <Link className={styles.teamName} href={`/teams/${team.id}`}>
        <span>{side}</span><strong>{team.name}</strong>
      </Link>
      <span className={styles.score}>{score ?? 0}</span>
    </div>
  );
}

function BaseDiamond({ first, second, third }: { first: boolean; second: boolean; third: boolean }) {
  return (
    <div className={styles.diamond} aria-label={`Bases occupied: ${[first && "first", second && "second", third && "third"].filter(Boolean).join(", ") || "none"}`}>
      <span className={`${styles.base} ${styles.second} ${second ? styles.occupied : ""}`} />
      <span className={`${styles.base} ${styles.third} ${third ? styles.occupied : ""}`} />
      <span className={`${styles.base} ${styles.first} ${first ? styles.occupied : ""}`} />
      <span className={`${styles.base} ${styles.homeBase}`} />
    </div>
  );
}

function StatSummary({ title, stats, type }: { title: string; stats?: TeamStats; type: "batting" | "pitching" }) {
  const rows = type === "batting"
    ? [["Runs", stats?.runs], ["Hits", stats?.hits], ["Home runs", stats?.homeRuns], ["Walks", stats?.baseOnBalls], ["Strikeouts", stats?.strikeOuts]]
    : [["Innings", stats?.inningsPitched], ["Hits allowed", stats?.hits], ["Runs allowed", stats?.runs], ["Walks", stats?.baseOnBalls], ["Strikeouts", stats?.strikeOuts]];
  return <section className={styles.card}><h2>{title}</h2><dl className={styles.statList}>{rows.map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value ?? "—"}</dd></div>)}</dl></section>;
}

function gameContext(game: GameFeed) {
  const line = game.liveData.linescore;
  if (line?.currentInningOrdinal) return `${line.inningHalf ?? ""} ${line.currentInningOrdinal}`.trim();
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(new Date(game.gameData.datetime.dateTime));
}

export default async function GameCenterPage({ params }: { params: Promise<{ gamePk: string }> }) {
  const { gamePk } = await params;
  if (!/^\d+$/.test(gamePk)) notFound();

  const game = await getGame(gamePk);
  const { away, home } = game.gameData.teams;
  const line = game.liveData.linescore;
  const awayTotals = line?.teams?.away;
  const homeTotals = line?.teams?.home;
  const innings = line?.innings ?? [];
  const allPlays = game.liveData.plays?.allPlays ?? [];
  const currentPlay = game.liveData.plays?.currentPlay;
  const scoringPlays = allPlays.filter((play) => play.about?.isScoringPlay);
  const recentPlays = allPlays.slice(-14).reverse();
  const awayBoxscore = game.liveData.boxscore?.teams?.away;
  const homeBoxscore = game.liveData.boxscore?.teams?.home;
  const awayStats = awayBoxscore?.teamStats;
  const homeStats = homeBoxscore?.teamStats;
  const live = game.gameData.status.abstractGameState === "Live";
  const offense = line?.offense;
  const matchup = currentPlay?.matchup;
  const decisions = game.liveData.decisions;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}><Link className={styles.back} href="/">← Back to scoreboard</Link><LiveRefresh active={live} /></div>

      <header className={`${styles.hero} ${live ? styles.liveHero : ""}`}>
        <TeamHeader team={away} score={awayTotals?.runs} side="Away" />
        <div className={styles.status}>
          <span className="eyebrow">{live ? "Live GameDay" : "Game Center"}</span>
          <strong>{game.gameData.status.detailedState}</strong>
          <span>{gameContext(game)}</span>
          {game.gameData.venue?.name && <small>{game.gameData.venue.name}</small>}
        </div>
        <TeamHeader team={home} score={homeTotals?.runs} side="Home" />
      </header>

      {(live || currentPlay) && (
        <section className={styles.livePanel}>
          <div className={styles.matchup}>
            <span className="eyebrow">Current matchup</span>
            <strong>{matchup?.batter?.fullName ?? "Batter TBD"}</strong>
            <span>vs. {matchup?.pitcher?.fullName ?? line?.defense?.pitcher?.fullName ?? "Pitcher TBD"}</span>
            <p>{currentPlay?.result?.description ?? currentPlay?.result?.event ?? "Waiting for the next pitch."}</p>
          </div>
          <div className={styles.liveState}>
            <BaseDiamond first={Boolean(offense?.first)} second={Boolean(offense?.second)} third={Boolean(offense?.third)} />
            <div className={styles.counts}>
              <span><b>{line?.balls ?? currentPlay?.count?.balls ?? 0}</b> Balls</span>
              <span><b>{line?.strikes ?? currentPlay?.count?.strikes ?? 0}</b> Strikes</span>
              <span><b>{line?.outs ?? currentPlay?.count?.outs ?? 0}</b> Outs</span>
            </div>
          </div>
        </section>
      )}

      <section className={styles.card}>
        <h2>Line score</h2>
        {innings.length ? <div className={styles.tableScroll}><table className={styles.lineScore}><thead><tr><th>Team</th>{innings.map((inning) => <th key={inning.num}>{inning.num}</th>)}<th>R</th><th>H</th><th>E</th></tr></thead><tbody><tr><th>{away.name}</th>{innings.map((inning) => <td key={inning.num}>{inning.away?.runs ?? "—"}</td>)}<td>{awayTotals?.runs ?? 0}</td><td>{awayTotals?.hits ?? 0}</td><td>{awayTotals?.errors ?? 0}</td></tr><tr><th>{home.name}</th>{innings.map((inning) => <td key={inning.num}>{inning.home?.runs ?? "—"}</td>)}<td>{homeTotals?.runs ?? 0}</td><td>{homeTotals?.hits ?? 0}</td><td>{homeTotals?.errors ?? 0}</td></tr></tbody></table></div> : <p className={styles.empty}>The line score will appear when game data becomes available.</p>}
      </section>

      <BoxScoreTables awayName={away.name} homeName={home.name} away={awayBoxscore} home={homeBoxscore} />

      <div className={styles.lineupGrid}>
        <LineupCard teamName={away.name} team={awayBoxscore} />
        <LineupCard teamName={home.name} team={homeBoxscore} />
      </div>

      {(decisions?.winner || decisions?.loser || decisions?.save) && <section className={styles.decisions}><div><span>Winning pitcher</span><strong>{decisions.winner?.fullName ?? "—"}</strong></div><div><span>Losing pitcher</span><strong>{decisions.loser?.fullName ?? "—"}</strong></div><div><span>Save</span><strong>{decisions.save?.fullName ?? "—"}</strong></div></section>}

      <div className={styles.grid}><StatSummary title={`${away.name} batting`} stats={awayStats?.batting} type="batting" /><StatSummary title={`${home.name} batting`} stats={homeStats?.batting} type="batting" /><StatSummary title={`${away.name} pitching`} stats={awayStats?.pitching} type="pitching" /><StatSummary title={`${home.name} pitching`} stats={homeStats?.pitching} type="pitching" /></div>

      <div className={styles.grid}>
        <section className={styles.card}><h2>Scoring plays</h2>{scoringPlays.length ? <ol className={styles.playList}>{scoringPlays.map((play, index) => <li key={`${play.about?.inning}-${index}`}><div><span>{play.about?.halfInning} {play.about?.inning}</span>{play.result?.awayScore !== undefined && <b>{play.result.awayScore}–{play.result.homeScore}</b>}</div><p>{play.result?.description ?? play.result?.event ?? "Scoring play"}</p></li>)}</ol> : <p className={styles.empty}>No scoring plays are available yet.</p>}</section>
        <section className={styles.card}><h2>Play-by-play</h2>{recentPlays.length ? <ol className={styles.playList}>{recentPlays.map((play, index) => <li key={`recent-${play.about?.atBatIndex ?? index}`}><div><span>{play.about?.halfInning} {play.about?.inning}</span>{play.count && <b>{play.count.balls ?? 0}-{play.count.strikes ?? 0}, {play.count.outs ?? 0} out</b>}</div><p>{play.result?.description ?? play.result?.event ?? "Play update"}</p></li>)}</ol> : <p className={styles.empty}>Play-by-play will appear when the game begins.</p>}</section>
      </div>
    </div>
  );
}
