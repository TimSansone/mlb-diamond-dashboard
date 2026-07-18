import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamStanding } from "@/lib/mlb";
import BoxScoreTables from "./BoxScoreTables";
import InningPlayByPlay from "./InningPlayByPlay";
import LineupCard, { type TeamBoxscore } from "./LineupCard";
import LiveGameFeatures from "./LiveGameFeatures";
import LiveRefresh from "./LiveRefresh";
import styles from "./game.module.css";

type TeamStats = Record<string, number | string>;
type Side = { id: number; name: string };
type TeamRecord = { wins: number; losses: number } | null;
type Person = { id?: number; fullName?: string };
type BattingStats = { atBats?: number; runs?: number; hits?: number; rbi?: number; baseOnBalls?: number; strikeOuts?: number; homeRuns?: number; doubles?: number; triples?: number; avg?: string };
type PitchingStats = { numberOfPitches?: number; strikes?: number; inningsPitched?: string; strikeOuts?: number; era?: string };
type PitchEvent = {
  details?: { isPitch?: boolean; description?: string; call?: { description?: string; code?: string }; type?: { description?: string; code?: string } };
  pitchData?: { startSpeed?: number; strikeZoneTop?: number; strikeZoneBottom?: number; coordinates?: { pX?: number; pZ?: number } };
  count?: { balls?: number; strikes?: number; outs?: number };
};
type GamePlayer = { person?: Person; stats?: { batting?: BattingStats; pitching?: PitchingStats }; seasonStats?: { batting?: BattingStats; pitching?: PitchingStats } };
type Play = {
  result?: { description?: string; event?: string; rbi?: number; awayScore?: number; homeScore?: number };
  about?: { inning?: number; halfInning?: string; isScoringPlay?: boolean; atBatIndex?: number; isComplete?: boolean };
  count?: { balls?: number; strikes?: number; outs?: number };
  matchup?: { batter?: Person; pitcher?: Person };
  playEvents?: PitchEvent[];
};
type Defense = { pitcher?: Person; catcher?: Person; first?: Person; second?: Person; third?: Person; shortstop?: Person; left?: Person; center?: Person; right?: Person };
type TeamBox = TeamBoxscore & { teamStats?: { batting?: TeamStats; pitching?: TeamStats }; pitchers?: number[]; players?: Record<string, GamePlayer> };
type GameFeed = {
  gameData: { datetime: { dateTime: string }; status: { abstractGameState: string; detailedState: string }; venue?: { name?: string }; teams: { away: Side; home: Side } };
  liveData: {
    linescore?: {
      currentInningOrdinal?: string; inningHalf?: string; balls?: number; strikes?: number; outs?: number;
      offense?: { first?: Person; second?: Person; third?: Person };
      defense?: Defense;
      innings?: Array<{ num: number; away?: { runs?: number; hits?: number; errors?: number }; home?: { runs?: number; hits?: number; errors?: number } }>;
      teams?: { away?: { runs?: number; hits?: number; errors?: number }; home?: { runs?: number; hits?: number; errors?: number } };
    };
    plays?: { allPlays?: Play[]; currentPlay?: Play };
    decisions?: { winner?: Person; loser?: Person; save?: Person };
    boxscore?: { teams?: { away?: TeamBox; home?: TeamBox } };
  };
};

const logo = (teamId: number) => `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
const headshot = (playerId?: number) => playerId ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_160,q_auto:best,f_auto/v1/people/${playerId}/headshot/67/current` : "";

async function getGame(gamePk: string): Promise<GameFeed> {
  const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, { next: { revalidate: 15 }, headers: { Accept: "application/json" } });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`Game feed request failed with status ${response.status}`);
  return response.json();
}

function TeamHeader({ team, score, side, record }: { team: Side; score?: number; side: string; record: TeamRecord }) {
  return <div className={styles.team}><img src={logo(team.id)} alt={`${team.name} logo`} width={72} height={72} /><Link className={styles.teamName} href={`/teams/${team.id}`}><span>{side}</span><strong>{team.name}</strong><small>{record ? `${record.wins}-${record.losses}` : "Record unavailable"}</small></Link><span className={styles.score}>{score ?? 0}</span></div>;
}

function BaseDiamond({ first, second, third }: { first?: Person; second?: Person; third?: Person }) {
  const occupied = [first && `first: ${first.fullName}`, second && `second: ${second.fullName}`, third && `third: ${third.fullName}`].filter(Boolean).join(", ") || "none";
  return <div className={styles.baseDisplay} aria-label={`Bases occupied: ${occupied}`}><div className={styles.diamond}><span className={`${styles.base} ${styles.second} ${second ? styles.occupied : ""}`} /><span className={`${styles.base} ${styles.third} ${third ? styles.occupied : ""}`} /><span className={`${styles.base} ${styles.first} ${first ? styles.occupied : ""}`} /><span className={`${styles.base} ${styles.homeBase}`} /></div><div className={styles.runnerLabels}><span className={styles.runnerSecond}>{second?.fullName ?? "2nd empty"}</span><span className={styles.runnerThird}>{third?.fullName ?? "3rd empty"}</span><span className={styles.runnerFirst}>{first?.fullName ?? "1st empty"}</span></div></div>;
}

function PlayerFeature({ label, person, primary, secondary }: { label: string; person?: Person; primary: string; secondary: string }) {
  return <div className={styles.playerFeature}>{person?.id ? <img src={headshot(person.id)} alt={`${person.fullName ?? label} headshot`} width={92} height={92} /> : <span className={styles.featurePlaceholder} />}<div><span className={styles.featureLabel}>{label}</span><strong>{person?.fullName ?? "TBD"}</strong><p>{primary}</p><small>{secondary}</small></div></div>;
}

function playerFromBoxes(id: number | undefined, away?: TeamBox, home?: TeamBox) {
  if (!id) return undefined;
  return away?.players?.[`ID${id}`] ?? home?.players?.[`ID${id}`];
}

function batterGameLine(stats?: BattingStats) {
  if (!stats) return "No game stats yet";
  const extras = [stats.doubles ? `${stats.doubles} 2B` : "", stats.triples ? `${stats.triples} 3B` : "", stats.homeRuns ? `${stats.homeRuns} HR` : "", stats.rbi ? `${stats.rbi} RBI` : ""].filter(Boolean);
  return `${stats.hits ?? 0}-${stats.atBats ?? 0}${extras.length ? `, ${extras.join(", ")}` : ""}`;
}

function StatSummary({ title, stats, type }: { title: string; stats?: TeamStats; type: "batting" | "pitching" }) {
  const rows = type === "batting" ? [["Runs", stats?.runs], ["Hits", stats?.hits], ["Home runs", stats?.homeRuns], ["Walks", stats?.baseOnBalls], ["Strikeouts", stats?.strikeOuts]] : [["Innings", stats?.inningsPitched], ["Hits allowed", stats?.hits], ["Runs allowed", stats?.runs], ["Walks", stats?.baseOnBalls], ["Strikeouts", stats?.strikeOuts]];
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
  const [awayRecord, homeRecord] = await Promise.all([
    getTeamStanding(away.id).catch(() => null),
    getTeamStanding(home.id).catch(() => null),
  ]);
  const line = game.liveData.linescore;
  const awayTotals = line?.teams?.away; const homeTotals = line?.teams?.home; const innings = line?.innings ?? [];
  const allPlays = game.liveData.plays?.allPlays ?? []; const currentPlay = game.liveData.plays?.currentPlay;
  const scoringPlays = allPlays.filter((play) => play.about?.isScoringPlay);
  const latestCompletePlay = [...allPlays].reverse().find((play) => play.about?.isComplete !== false && Boolean(play.result?.description || play.result?.event));
  const pitchPlay = currentPlay?.playEvents?.some((event) => event.details?.isPitch || event.pitchData)
    ? currentPlay
    : [...allPlays].reverse().find((play) => play.playEvents?.some((event) => event.details?.isPitch || event.pitchData));
  const awayBoxscore = game.liveData.boxscore?.teams?.away; const homeBoxscore = game.liveData.boxscore?.teams?.home;
  const awayStats = awayBoxscore?.teamStats; const homeStats = homeBoxscore?.teamStats;
  const live = game.gameData.status.abstractGameState === "Live"; const offense = line?.offense; const matchup = currentPlay?.matchup ?? pitchPlay?.matchup; const decisions = game.liveData.decisions;
  const batter = matchup?.batter; const pitcher = matchup?.pitcher ?? line?.defense?.pitcher;
  const batterData = playerFromBoxes(batter?.id, awayBoxscore, homeBoxscore); const pitcherData = playerFromBoxes(pitcher?.id, awayBoxscore, homeBoxscore);
  const batterStats = batterData?.stats?.batting; const pitcherStats = pitcherData?.stats?.pitching;
  const pitches = pitcherStats?.numberOfPitches ?? 0; const pitchStrikes = pitcherStats?.strikes ?? 0; const pitchBalls = Math.max(0, pitches - pitchStrikes);
  const batterAverage = batterData?.seasonStats?.batting?.avg ?? "—";
  const currentInning = currentPlay?.about?.inning ?? pitchPlay?.about?.inning ?? innings.at(-1)?.num;

  return <div className={styles.page}>
    <div className={styles.topBar}><Link className={styles.back} href="/">← Back to scoreboard</Link><LiveRefresh active={live} /></div>
    <header className={`${styles.hero} ${live ? styles.liveHero : ""}`}><TeamHeader team={away} score={awayTotals?.runs} side="Away" record={awayRecord} /><div className={styles.status}><span className="eyebrow">{live ? "Live GameDay" : "Game Center"}</span><strong>{game.gameData.status.detailedState}</strong><span>{gameContext(game)}</span>{game.gameData.venue?.name && <small>{game.gameData.venue.name}</small>}</div><TeamHeader team={home} score={homeTotals?.runs} side="Home" record={homeRecord} /></header>

    {(live || currentPlay || pitchPlay) && <>
      <section className={styles.livePanel}>
        <div className={styles.matchupPlayers}><PlayerFeature label="Current batter" person={batter} primary={`AVG ${batterAverage}`} secondary={batterGameLine(batterStats)} /><span className={styles.versus}>VS</span><PlayerFeature label="Current pitcher" person={pitcher} primary={`${pitches} pitches · ${pitchBalls} balls · ${pitchStrikes} strikes`} secondary={`${pitcherStats?.inningsPitched ?? "0.0"} IP · ${pitcherStats?.strikeOuts ?? 0} K · ERA ${pitcherData?.seasonStats?.pitching?.era ?? pitcherStats?.era ?? "—"}`} /></div>
        <div className={styles.liveState}><BaseDiamond first={offense?.first} second={offense?.second} third={offense?.third} /><div className={styles.counts}><span><b>{line?.balls ?? currentPlay?.count?.balls ?? 0}</b> Balls</span><span><b>{line?.strikes ?? currentPlay?.count?.strikes ?? 0}</b> Strikes</span><span><b>{line?.outs ?? currentPlay?.count?.outs ?? 0}</b> Outs</span></div></div>
        <div className={styles.latestPlay}><span className="eyebrow">Latest completed play</span><p>{latestCompletePlay?.result?.description ?? latestCompletePlay?.result?.event ?? "No completed play is available yet."}</p></div>
      </section>
      <LiveGameFeatures playEvents={pitchPlay?.playEvents} defense={line?.defense} />
    </>}

    <section className={styles.card}><h2>Line score</h2>{innings.length ? <div className={styles.tableScroll}><table className={styles.lineScore}><thead><tr><th>Team</th>{innings.map((inning) => <th key={inning.num}>{inning.num}</th>)}<th>R</th><th>H</th><th>E</th></tr></thead><tbody><tr><th>{away.name}</th>{innings.map((inning) => <td key={inning.num}>{inning.away?.runs ?? "—"}</td>)}<td>{awayTotals?.runs ?? 0}</td><td>{awayTotals?.hits ?? 0}</td><td>{awayTotals?.errors ?? 0}</td></tr><tr><th>{home.name}</th>{innings.map((inning) => <td key={inning.num}>{inning.home?.runs ?? "—"}</td>)}<td>{homeTotals?.runs ?? 0}</td><td>{homeTotals?.hits ?? 0}</td><td>{homeTotals?.errors ?? 0}</td></tr></tbody></table></div> : <p className={styles.empty}>The line score will appear when game data becomes available.</p>}</section>

    <div className={styles.grid}><section className={styles.card}><h2>Scoring plays</h2>{scoringPlays.length ? <ol className={styles.playList}>{scoringPlays.map((play, index) => <li key={`${play.about?.inning}-${index}`}><div><span>{play.about?.halfInning} {play.about?.inning}</span>{play.result?.awayScore !== undefined && <b>{play.result.awayScore}–{play.result.homeScore}</b>}</div><p>{play.result?.description ?? play.result?.event ?? "Scoring play"}</p></li>)}</ol> : <p className={styles.empty}>No scoring plays are available yet.</p>}</section><section className={styles.card}><h2>Play-by-play</h2><InningPlayByPlay plays={allPlays} currentInning={currentInning} /></section></div>

    <BoxScoreTables awayName={away.name} homeName={home.name} away={awayBoxscore} home={homeBoxscore} />
    <div className={styles.lineupGrid}><LineupCard teamName={away.name} team={awayBoxscore} /><LineupCard teamName={home.name} team={homeBoxscore} /></div>
    {(decisions?.winner || decisions?.loser || decisions?.save) && <section className={styles.decisions}><div><span>Winning pitcher</span><strong>{decisions.winner?.fullName ?? "—"}</strong></div><div><span>Losing pitcher</span><strong>{decisions.loser?.fullName ?? "—"}</strong></div><div><span>Save</span><strong>{decisions.save?.fullName ?? "—"}</strong></div></section>}
    <div className={styles.grid}><StatSummary title={`${away.name} batting`} stats={awayStats?.batting} type="batting" /><StatSummary title={`${home.name} batting`} stats={homeStats?.batting} type="batting" /><StatSummary title={`${away.name} pitching`} stats={awayStats?.pitching} type="pitching" /><StatSummary title={`${home.name} pitching`} stats={homeStats?.pitching} type="pitching" /></div>
  </div>;
}
