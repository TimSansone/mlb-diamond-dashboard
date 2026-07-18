import Link from "next/link";
import styles from "./game.module.css";

export type BoxscorePlayer = {
  person?: { id?: number; fullName?: string };
  jerseyNumber?: string;
  position?: { abbreviation?: string; name?: string };
  battingOrder?: string;
  stats?: {
    batting?: {
      atBats?: number;
      runs?: number;
      hits?: number;
      rbi?: number;
      baseOnBalls?: number;
      strikeOuts?: number;
      homeRuns?: number;
      doubles?: number;
      triples?: number;
    };
  };
};

export type TeamBoxscore = {
  battingOrder?: number[];
  players?: Record<string, BoxscorePlayer>;
};

function headshot(playerId: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best,f_auto/v1/people/${playerId}/headshot/67/current`;
}

function battingLine(player: BoxscorePlayer) {
  const stats = player.stats?.batting;
  if (!stats) return "No batting stats yet";

  const pieces = [
    `${stats.hits ?? 0}-${stats.atBats ?? 0}`,
    stats.runs ? `${stats.runs} R` : "",
    stats.rbi ? `${stats.rbi} RBI` : "",
    stats.baseOnBalls ? `${stats.baseOnBalls} BB` : "",
    stats.strikeOuts ? `${stats.strikeOuts} K` : "",
    stats.homeRuns ? `${stats.homeRuns} HR` : "",
  ].filter(Boolean);

  return pieces.join(" · ");
}

function orderedPlayers(team?: TeamBoxscore) {
  if (!team?.players) return [];

  const players = Object.values(team.players).filter((player) => player.person?.id);
  const byId = new Map(players.map((player) => [player.person?.id, player]));
  const battingOrder = team.battingOrder ?? [];
  const starters = battingOrder.map((id) => byId.get(id)).filter(Boolean) as BoxscorePlayer[];

  const substitutions = players
    .filter((player) => !battingOrder.includes(player.person?.id ?? -1) && player.stats?.batting?.atBats !== undefined)
    .sort((a, b) => Number(a.battingOrder ?? 9999) - Number(b.battingOrder ?? 9999));

  return [...starters, ...substitutions];
}

export default function LineupCard({ teamName, team }: { teamName: string; team?: TeamBoxscore }) {
  const lineup = orderedPlayers(team);

  return (
    <section className={`${styles.card} ${styles.lineupCard}`}>
      <div className={styles.lineupHeader}>
        <div>
          <span className="eyebrow">Starting lineup</span>
          <h2>{teamName}</h2>
        </div>
        <span>{lineup.length} players</span>
      </div>

      {lineup.length ? (
        <ol className={styles.lineupList}>
          {lineup.map((player, index) => {
            const playerId = player.person?.id;
            return (
              <li key={`${playerId}-${index}`}>
                <span className={styles.battingSlot}>{index + 1}</span>
                {playerId ? (
                  <img src={headshot(playerId)} alt="" width={52} height={52} />
                ) : (
                  <span className={styles.headshotPlaceholder} />
                )}
                <div className={styles.playerIdentity}>
                  {playerId ? (
                    <Link href={`/players/${playerId}`}>{player.person?.fullName ?? "Player"}</Link>
                  ) : (
                    <strong>{player.person?.fullName ?? "Player"}</strong>
                  )}
                  <span>
                    {player.position?.abbreviation ?? "—"}
                    {player.jerseyNumber ? ` · #${player.jerseyNumber}` : ""}
                  </span>
                </div>
                <span className={styles.playerLine}>{battingLine(player)}</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className={styles.empty}>The official lineup will appear when MLB publishes the box score.</p>
      )}
    </section>
  );
}
