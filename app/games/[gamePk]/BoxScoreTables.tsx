import Link from "next/link";
import type { BoxscorePlayer, TeamBoxscore } from "./LineupCard";
import styles from "./game.module.css";

type PitchingStats = {
  inningsPitched?: string;
  hits?: number;
  runs?: number;
  earnedRuns?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  homeRuns?: number;
  numberOfPitches?: number;
  strikes?: number;
  era?: string;
  whip?: string;
  wins?: number;
  losses?: number;
  saves?: number;
  holds?: number;
};

type ExtendedPlayer = BoxscorePlayer & {
  stats?: BoxscorePlayer["stats"] & { pitching?: PitchingStats };
};

type ExtendedTeamBoxscore = TeamBoxscore & {
  batters?: number[];
  pitchers?: number[];
  players?: Record<string, ExtendedPlayer>;
};

function playerHeadshot(playerId: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_96,q_auto:best,f_auto/v1/people/${playerId}/headshot/67/current`;
}

function playerMap(team?: ExtendedTeamBoxscore) {
  return new Map(
    Object.values(team?.players ?? {})
      .filter((player) => player.person?.id)
      .map((player) => [player.person!.id!, player]),
  );
}

function uniqueIds(ids: number[]) {
  return [...new Set(ids)];
}

function battingPlayers(team?: ExtendedTeamBoxscore) {
  const map = playerMap(team);

  // MLB's `batters` array contains only hitters who were placed in the
  // lineup or entered the game. It excludes unused players on the active roster.
  const participantIds = uniqueIds(team?.batters ?? team?.battingOrder ?? []);

  return participantIds
    .map((id) => map.get(id))
    .filter(Boolean) as ExtendedPlayer[];
}

function pitchingPlayers(team?: ExtendedTeamBoxscore) {
  const map = playerMap(team);

  // MLB's `pitchers` array is ordered by appearance and excludes unused arms.
  return uniqueIds(team?.pitchers ?? [])
    .map((id) => map.get(id))
    .filter(Boolean) as ExtendedPlayer[];
}

function PlayerCell({ player }: { player: ExtendedPlayer }) {
  const id = player.person?.id;
  return (
    <div className={styles.boxPlayer}>
      {id ? <img src={playerHeadshot(id)} alt="" width={38} height={38} /> : <span className={styles.boxHeadshot} />}
      <div>
        {id ? <Link href={`/players/${id}`}>{player.person?.fullName ?? "Player"}</Link> : <strong>{player.person?.fullName ?? "Player"}</strong>}
        <span>{player.position?.abbreviation ?? "—"}</span>
      </div>
    </div>
  );
}

function BattingTable({ teamName, team }: { teamName: string; team?: ExtendedTeamBoxscore }) {
  const players = battingPlayers(team);
  const totals = players.reduce(
    (sum, player) => {
      const stats = player.stats?.batting;
      sum.ab += stats?.atBats ?? 0;
      sum.r += stats?.runs ?? 0;
      sum.h += stats?.hits ?? 0;
      sum.rbi += stats?.rbi ?? 0;
      sum.bb += stats?.baseOnBalls ?? 0;
      sum.k += stats?.strikeOuts ?? 0;
      sum.hr += stats?.homeRuns ?? 0;
      return sum;
    },
    { ab: 0, r: 0, h: 0, rbi: 0, bb: 0, k: 0, hr: 0 },
  );

  return (
    <section className={`${styles.card} ${styles.boxCard}`}>
      <div className={styles.boxHeader}><span className="eyebrow">Batting</span><h2>{teamName}</h2></div>
      {players.length ? (
        <div className={styles.tableScroll}>
          <table className={styles.playerTable}>
            <thead><tr><th>Player</th><th>AB</th><th>R</th><th>H</th><th>RBI</th><th>BB</th><th>SO</th><th>HR</th></tr></thead>
            <tbody>
              {players.map((player, index) => {
                const stats = player.stats?.batting;
                return <tr key={`${player.person?.id}-${index}`}><td><PlayerCell player={player} /></td><td>{stats?.atBats ?? 0}</td><td>{stats?.runs ?? 0}</td><td>{stats?.hits ?? 0}</td><td>{stats?.rbi ?? 0}</td><td>{stats?.baseOnBalls ?? 0}</td><td>{stats?.strikeOuts ?? 0}</td><td>{stats?.homeRuns ?? 0}</td></tr>;
              })}
              <tr className={styles.totalRow}><th>Totals</th><td>{totals.ab}</td><td>{totals.r}</td><td>{totals.h}</td><td>{totals.rbi}</td><td>{totals.bb}</td><td>{totals.k}</td><td>{totals.hr}</td></tr>
            </tbody>
          </table>
        </div>
      ) : <p className={styles.empty}>Individual batting lines will appear when MLB publishes the lineup or a hitter enters the game.</p>}
    </section>
  );
}

function PitchingTable({ teamName, team }: { teamName: string; team?: ExtendedTeamBoxscore }) {
  const players = pitchingPlayers(team);
  return (
    <section className={`${styles.card} ${styles.boxCard}`}>
      <div className={styles.boxHeader}><span className="eyebrow">Pitching</span><h2>{teamName}</h2></div>
      {players.length ? (
        <div className={styles.tableScroll}>
          <table className={`${styles.playerTable} ${styles.pitchingTable}`}>
            <thead><tr><th>Pitcher</th><th>IP</th><th>H</th><th>R</th><th>ER</th><th>BB</th><th>SO</th><th>HR</th><th>P-S</th><th>ERA</th></tr></thead>
            <tbody>
              {players.map((player, index) => {
                const stats = player.stats?.pitching;
                return <tr key={`${player.person?.id}-${index}`}><td><PlayerCell player={player} /></td><td>{stats?.inningsPitched ?? "0.0"}</td><td>{stats?.hits ?? 0}</td><td>{stats?.runs ?? 0}</td><td>{stats?.earnedRuns ?? 0}</td><td>{stats?.baseOnBalls ?? 0}</td><td>{stats?.strikeOuts ?? 0}</td><td>{stats?.homeRuns ?? 0}</td><td>{stats?.numberOfPitches ?? 0}-{stats?.strikes ?? 0}</td><td>{stats?.era ?? "—"}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      ) : <p className={styles.empty}>Individual pitching lines will appear when a pitcher enters the game.</p>}
    </section>
  );
}

export default function BoxScoreTables({ awayName, homeName, away, home }: { awayName: string; homeName: string; away?: ExtendedTeamBoxscore; home?: ExtendedTeamBoxscore }) {
  return (
    <section className={styles.boxScoreSection}>
      <div className={styles.sectionHeading}><div><span className="eyebrow">Complete box score</span><h2>Individual player lines</h2></div><p>Only starters and players who entered the game are shown.</p></div>
      <div className={styles.boxScoreGrid}>
        <BattingTable teamName={awayName} team={away} />
        <BattingTable teamName={homeName} team={home} />
        <PitchingTable teamName={awayName} team={away} />
        <PitchingTable teamName={homeName} team={home} />
      </div>
    </section>
  );
}
